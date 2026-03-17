"""
Settle sports bets based on scores from The Odds API.
Run: python manage.py settle_sports_bets
Run periodically (cron every 5-15 min) to settle completed events.
"""
import logging
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from games.models import Bet
from wallets.models import Transaction
from wallets.services import credit_wallet

from sports.odds_client import get_sports, get_scores

logger = logging.getLogger(__name__)


def _get_score(scores: list[dict], team_name: str) -> int | None:
    """Get score for team from scores list."""
    if not scores:
        return None
    for s in scores:
        if s.get('name') == team_name:
            try:
                return int(s.get('score', 0))
            except (ValueError, TypeError):
                return None
    return None


def _resolve_h2h(home_team: str, away_team: str, scores: list[dict]) -> str | None:
    """Return winning team name for moneyline. None if tie."""
    home_score = _get_score(scores, home_team)
    away_score = _get_score(scores, away_team)
    if home_score is None or away_score is None:
        return None
    if home_score > away_score:
        return home_team
    if away_score > home_score:
        return away_team
    return None  # tie


def _resolve_spreads(
    home_team: str,
    away_team: str,
    scores: list[dict],
    outcome_name: str,
    outcome_point: Decimal | None,
) -> bool | None:
    """
    Return True if outcome_name covers the spread. None if cannot resolve.
    outcome_point: spread for the selected team (e.g. -3.5 for home team -3.5).
    """
    home_score = _get_score(scores, home_team)
    away_score = _get_score(scores, away_team)
    if home_score is None or away_score is None:
        return None
    point = float(outcome_point) if outcome_point is not None else 0
    if outcome_name == home_team:
        return (home_score + point) > away_score
    if outcome_name == away_team:
        return (away_score + point) > home_score
    return None


def _resolve_totals(
    home_team: str,
    away_team: str,
    scores: list[dict],
    outcome_name: str,
    outcome_point: Decimal | None,
) -> bool | None:
    """
    Return True if Over/Under wins. outcome_name is "Over" or "Under".
    """
    home_score = _get_score(scores, home_team)
    away_score = _get_score(scores, away_team)
    if home_score is None or away_score is None or outcome_point is None:
        return None
    total = home_score + away_score
    point = float(outcome_point)
    if outcome_name.lower() == 'over':
        return total > point
    if outcome_name.lower() == 'under':
        return total < point
    return None


class Command(BaseCommand):
    help = 'Settle pending sports bets using scores from The Odds API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sports',
            nargs='*',
            help='Sport keys to settle (default: all in-season)',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=1,
            help='Days back to fetch completed games (default 1)',
        )

    def handle(self, *args, **options):
        sport_keys = options.get('sports')
        days_from = options.get('days', 1)

        if not sport_keys:
            sports = get_sports()
            sport_keys = [s['key'] for s in sports if s.get('active') and not s.get('has_outrights')]
            sport_keys = [k for k in sport_keys if not k.endswith('_winner') and 'super_bowl' not in k.lower()][:10]

        settled = 0
        for sport_key in sport_keys:
            events, _ = get_scores(sport_key, days_from=days_from)
            for event in events:
                if not event.get('completed') or not event.get('scores'):
                    continue
                event_id = event.get('id')
                home_team = event.get('home_team', '')
                away_team = event.get('away_team', '')
                scores = event.get('scores', [])

                bets = Bet.objects.filter(
                    game_type=Bet.GameType.SPORTS,
                    status=Bet.Status.PENDING,
                    metadata__event_id=event_id,
                )

                for bet in bets:
                    meta = bet.metadata or {}
                    market_key = meta.get('market_key', 'h2h')
                    outcome_name = meta.get('outcome_name', '')
                    outcome_point = meta.get('outcome_point')
                    if outcome_point is not None:
                        try:
                            outcome_point = Decimal(str(outcome_point))
                        except Exception:
                            outcome_point = None

                    won = None
                    if market_key == 'h2h':
                        winner = _resolve_h2h(home_team, away_team, scores)
                        won = winner == outcome_name if winner else None
                    elif market_key == 'spreads':
                        won = _resolve_spreads(home_team, away_team, scores, outcome_name, outcome_point)
                    elif market_key == 'totals':
                        won = _resolve_totals(home_team, away_team, scores, outcome_name, outcome_point)

                    if won is None:
                        continue

                    adjusted_odds = meta.get('adjusted_odds')
                    try:
                        adjusted_odds = Decimal(str(adjusted_odds))
                    except Exception:
                        adjusted_odds = Decimal('1')

                    with transaction.atomic():
                        if won:
                            payout = bet.amount * adjusted_odds
                            win_tx = credit_wallet(
                                bet.user_id,
                                bet.currency_code,
                                payout,
                                Transaction.Type.WIN,
                                reference_id=str(bet.id),
                                metadata={'game': 'sports', 'bet_id': bet.id},
                            )
                            bet.status = Bet.Status.WON
                            bet.payout = payout
                            bet.win_transaction_id = win_tx.id
                        else:
                            bet.status = Bet.Status.LOST
                        bet.outcome = {
                            'home_team': home_team,
                            'away_team': away_team,
                            'scores': scores,
                            'won': won,
                        }
                        bet.save()
                        settled += 1
                        self.stdout.write(f'Settled bet {bet.id}: {"WON" if won else "LOST"}')

        self.stdout.write(self.style.SUCCESS(f'Settled {settled} bets'))
