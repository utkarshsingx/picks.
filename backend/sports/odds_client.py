"""
The Odds API client. https://the-odds-api.com
Free tier: 500 credits/month. Sports/events = 0 cost; odds = 1 per region; scores = 2.
"""

import logging
from decimal import Decimal
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BASE_URL = 'https://api.the-odds-api.com/v4'


def _get_api_key() -> str | None:
    return getattr(settings, 'ODDS_API_KEY', None) or None


def _get_regions() -> list[str]:
    return getattr(settings, 'ODDS_API_REGIONS', ['us'])


def _get_markets() -> list[str]:
    return getattr(settings, 'ODDS_API_MARKETS', ['h2h', 'spreads', 'totals'])


def _get_house_edge() -> float:
    return getattr(settings, 'SPORTS_HOUSE_EDGE', 0.05)


def apply_house_edge(decimal_odds: float) -> Decimal:
    """Apply house edge to decimal odds. Returns worse odds for player."""
    edge = _get_house_edge()
    adjusted = decimal_odds * (1 - edge)
    return Decimal(str(round(adjusted, 2)))


def american_to_decimal(american: int | float) -> float:
    """Convert American odds to decimal."""
    if american >= 100:
        return 1 + american / 100
    elif american <= -100:
        return 1 + 100 / abs(american)
    return 1.0


def get_sports() -> list[dict[str, Any]]:
    """List in-season sports. Cost: 0 credits."""
    key = _get_api_key()
    if not key:
        return []
    try:
        r = requests.get(f'{BASE_URL}/sports/', params={'apiKey': key}, timeout=10)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        logger.warning('Odds API get_sports failed: %s', e)
        return []


def get_events(sport_key: str) -> list[dict[str, Any]]:
    """List events for sport (no odds). Cost: 0 credits."""
    key = _get_api_key()
    if not key:
        return []
    try:
        r = requests.get(
            f'{BASE_URL}/sports/{sport_key}/events/',
            params={'apiKey': key},
            timeout=10,
        )
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        logger.warning('Odds API get_events failed: %s', e)
        return []


def get_odds(
    sport_key: str,
    regions: list[str] | None = None,
    markets: list[str] | None = None,
    odds_format: str = 'decimal',
) -> tuple[list[dict[str, Any]], int | None]:
    """
    Get events with odds. Returns (events, remaining_credits).
    Cost: 1 credit per region.
    """
    key = _get_api_key()
    if not key:
        return [], None
    regions = regions or _get_regions()
    markets = markets or _get_markets()
    try:
        r = requests.get(
            f'{BASE_URL}/sports/{sport_key}/odds/',
            params={
                'apiKey': key,
                'regions': ','.join(regions),
                'markets': ','.join(markets),
                'oddsFormat': odds_format,
            },
            timeout=15,
        )
        r.raise_for_status()
        remaining = r.headers.get('x-requests-remaining')
        return r.json(), int(remaining) if remaining else None
    except requests.RequestException as e:
        logger.warning('Odds API get_odds failed: %s', e)
        return [], None


def get_event_odds(
    sport_key: str,
    event_id: str,
    regions: list[str] | None = None,
    markets: list[str] | None = None,
    odds_format: str = 'decimal',
) -> tuple[dict[str, Any] | None, int | None]:
    """
    Get odds for single event. Returns (event, remaining_credits).
    Cost: 1 per market per region.
    """
    key = _get_api_key()
    if not key:
        return None, None
    regions = regions or _get_regions()
    markets = markets or _get_markets()
    try:
        r = requests.get(
            f'{BASE_URL}/sports/{sport_key}/events/{event_id}/odds/',
            params={
                'apiKey': key,
                'regions': ','.join(regions),
                'markets': ','.join(markets),
                'oddsFormat': odds_format,
            },
            timeout=15,
        )
        r.raise_for_status()
        remaining = r.headers.get('x-requests-remaining')
        return r.json(), int(remaining) if remaining else None
    except requests.RequestException as e:
        logger.warning('Odds API get_event_odds failed: %s', e)
        return None, None


def get_scores(
    sport_key: str,
    days_from: int = 1,
) -> tuple[list[dict[str, Any]], int | None]:
    """
    Get scores for completed/live games. Returns (events, remaining_credits).
    Cost: 2 if daysFrom specified, else 1.
    """
    key = _get_api_key()
    if not key:
        return [], None
    try:
        params = {'apiKey': key}
        if days_from:
            params['daysFrom'] = days_from
        r = requests.get(
            f'{BASE_URL}/sports/{sport_key}/scores/',
            params=params,
            timeout=15,
        )
        r.raise_for_status()
        remaining = r.headers.get('x-requests-remaining')
        return r.json(), int(remaining) if remaining else None
    except requests.RequestException as e:
        logger.warning('Odds API get_scores failed: %s', e)
        return [], None
