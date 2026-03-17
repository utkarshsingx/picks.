"""
Game logic services. All games use wallet debit/credit via wallets.services.
"""

from decimal import Decimal
import hashlib
import secrets

from django.conf import settings
from django.db import transaction as db_transaction

from wallets.models import Transaction
from wallets.services import credit_wallet, debit_wallet

from .models import Bet, CrashRound


def _house_edge_multiplier(base_multiplier: float) -> Decimal:
    """Apply house edge to multiplier."""
    edge = getattr(settings, 'GAMES_HOUSE_EDGE', 0.01)
    return Decimal(str(base_multiplier * (1 - edge)))


# --- Dice ---

def play_dice(user_id: int, currency_code: str, amount: Decimal, direction: str, target: float) -> Bet:
    """
    Play dice game. direction: 'over' or 'under', target: 1-99.
    Roll 0.00-99.99. Over: win if roll > target. Under: win if roll < target.
    """
    if direction not in ('over', 'under'):
        raise ValueError('direction must be over or under')
    if not (1 <= target <= 99):
        raise ValueError('target must be between 1 and 99')

    # Win chance: over = (100 - target) / 100, under = target / 100
    if direction == 'over':
        win_chance = (100 - target) / 100
    else:
        win_chance = target / 100

    base_multiplier = 1 / win_chance
    multiplier = _house_edge_multiplier(base_multiplier)

    # Roll: 0.00 to 99.99 (10000 possible values)
    roll = secrets.randbelow(10000) / 100

    won = (direction == 'over' and roll > target) or (direction == 'under' and roll < target)
    payout = amount * multiplier if won else Decimal('0')

    with db_transaction.atomic():
        bet_tx = debit_wallet(
            user_id,
            currency_code,
            amount,
            Transaction.Type.BET,
            reference_id=None,
            metadata={'game': 'dice', 'direction': direction, 'target': target},
        )

        bet = Bet.objects.create(
            user_id=user_id,
            game_type=Bet.GameType.DICE,
            currency_code=currency_code.upper(),
            amount=amount,
            status=Bet.Status.WON if won else Bet.Status.LOST,
            payout=payout,
            outcome={'roll': round(roll, 2), 'target': target, 'direction': direction, 'multiplier': float(multiplier)},
            bet_transaction_id=bet_tx.id,
            metadata={'direction': direction, 'target': target},
        )

        if won:
            win_tx = credit_wallet(
                user_id,
                currency_code,
                payout,
                Transaction.Type.WIN,
                reference_id=str(bet.id),
                metadata={'game': 'dice', 'bet_id': bet.id},
            )
            bet.win_transaction_id = win_tx.id
            bet.save(update_fields=['win_transaction_id'])

    return bet


# --- Mines ---

GRID_SIZE = 25
DEFAULT_MINE_COUNT = 5


def start_mines(user_id: int, currency_code: str, amount: Decimal, mine_count: int = DEFAULT_MINE_COUNT) -> Bet:
    """Start a Mines game. Debit wallet, create bet with hidden mine positions."""
    if not (1 <= mine_count <= 24):
        raise ValueError('mine_count must be between 1 and 24')

    mine_positions = sorted(secrets.SystemRandom().sample(range(GRID_SIZE), mine_count))

    with db_transaction.atomic():
        bet_tx = debit_wallet(
            user_id,
            currency_code,
            amount,
            Transaction.Type.BET,
            metadata={'game': 'mines', 'mine_count': mine_count},
        )

        bet = Bet.objects.create(
            user_id=user_id,
            game_type=Bet.GameType.MINES,
            currency_code=currency_code.upper(),
            amount=amount,
            status=Bet.Status.PENDING,
            metadata={
                'mine_positions': mine_positions,
                'mine_count': mine_count,
                'revealed': [],
            },
            bet_transaction_id=bet_tx.id,
        )

    return bet


def _mines_multiplier(revealed_count: int, mine_count: int) -> Decimal:
    """Multiplier for cashing out after revealing revealed_count safe tiles."""
    # Formula: multiplier = (GRID_SIZE / (GRID_SIZE - mine_count)) ^ revealed_count
    safe_count = GRID_SIZE - mine_count
    base = GRID_SIZE / safe_count
    raw = base ** revealed_count
    return _house_edge_multiplier(raw)


def reveal_mines_tile(bet_id: int, user_id: int, tile_index: int) -> dict:
    """
    Reveal a tile. Returns {'is_mine': bool, 'bet': Bet}. If mine, bet status -> LOST.
    """
    bet = Bet.objects.get(id=bet_id, user_id=user_id, game_type=Bet.GameType.MINES, status=Bet.Status.PENDING)
    meta = bet.metadata or {}
    mine_positions = meta.get('mine_positions', [])
    revealed = meta.get('revealed', [])

    if tile_index in revealed:
        raise ValueError('Tile already revealed')
    if not (0 <= tile_index < GRID_SIZE):
        raise ValueError('Invalid tile index')

    is_mine = tile_index in mine_positions
    revealed = revealed + [tile_index]
    meta['revealed'] = revealed
    bet.metadata = meta

    if is_mine:
        bet.status = Bet.Status.LOST
        bet.outcome = {'revealed': revealed, 'hit_mine': tile_index}
    bet.save()

    return {'is_mine': is_mine, 'bet': bet}


def cashout_mines(bet_id: int, user_id: int) -> Bet:
    """Cash out on Mines. Credit wallet with payout based on revealed tiles."""
    bet = Bet.objects.get(id=bet_id, user_id=user_id, game_type=Bet.GameType.MINES, status=Bet.Status.PENDING)
    meta = bet.metadata or {}
    revealed = meta.get('revealed', [])
    mine_count = meta.get('mine_count', DEFAULT_MINE_COUNT)

    if len(revealed) == 0:
        raise ValueError('Reveal at least one tile before cashing out')

    multiplier = _mines_multiplier(len(revealed), mine_count)
    payout = bet.amount * multiplier

    with db_transaction.atomic():
        win_tx = credit_wallet(
            user_id,
            bet.currency_code,
            payout,
            Transaction.Type.WIN,
            reference_id=str(bet.id),
            metadata={'game': 'mines', 'bet_id': bet.id, 'tiles_revealed': len(revealed)},
        )
        bet.status = Bet.Status.CASHED_OUT
        bet.payout = payout
        bet.outcome = {'revealed': revealed, 'multiplier': float(multiplier), 'tiles_revealed': len(revealed)}
        bet.win_transaction_id = win_tx.id
        bet.save()

    return bet


# --- Plinko ---

PLINKO_RISK_PAYOUTS = {
    'low': [0.5, 0.7, 1.0, 2.0, 5.0, 2.0, 1.0, 0.7, 0.5],
    'medium': [0.2, 0.4, 0.8, 1.2, 2.5, 5.0, 2.5, 1.2, 0.8, 0.4, 0.2],
    'high': [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 5.0, 2.0, 1.0, 0.5, 0.2, 0.1],
}


def play_plinko(user_id: int, currency_code: str, amount: Decimal, risk: str) -> Bet:
    """Play Plinko. risk: low, medium, high. Ball path determined by RNG, final column gives multiplier."""
    if risk not in PLINKO_RISK_PAYOUTS:
        raise ValueError('risk must be low, medium, or high')

    payouts = PLINKO_RISK_PAYOUTS[risk]
    # Random column 0 to len(payouts)-1
    column = secrets.randbelow(len(payouts))
    multiplier = Decimal(str(payouts[column]))
    payout = amount * multiplier

    with db_transaction.atomic():
        bet_tx = debit_wallet(
            user_id,
            currency_code,
            amount,
            Transaction.Type.BET,
            metadata={'game': 'plinko', 'risk': risk},
        )

        bet = Bet.objects.create(
            user_id=user_id,
            game_type=Bet.GameType.PLINKO,
            currency_code=currency_code.upper(),
            amount=amount,
            status=Bet.Status.WON if multiplier > 0 else Bet.Status.LOST,
            payout=payout,
            outcome={'column': column, 'multiplier': float(multiplier), 'risk': risk},
            bet_transaction_id=bet_tx.id,
            metadata={'risk': risk},
        )

        if multiplier > 0:
            win_tx = credit_wallet(
                user_id,
                currency_code,
                payout,
                Transaction.Type.WIN,
                reference_id=str(bet.id),
                metadata={'game': 'plinko', 'bet_id': bet.id},
            )
            bet.win_transaction_id = win_tx.id
            bet.save(update_fields=['win_transaction_id'])

    return bet


# --- Crash (provably fair) ---

def _crash_point_from_hash(h: bytes) -> Decimal:
    """Provably fair crash point. Returns multiplier where round crashes (min 1.01)."""
    num = int.from_bytes(h[:8], 'big') % (10**12 - 10**9) + 10**9
    point = 10**12 / num
    return max(Decimal('1.01'), Decimal(str(round(point, 2))))


def compute_crash_point(server_seed: str, client_seed: str, nonce: int) -> Decimal:
    """Compute crash point from seeds (provably fair)."""
    data = f"{server_seed}:{client_seed}:{nonce}"
    h = hashlib.sha256(data.encode()).digest()
    return _crash_point_from_hash(h)


def create_crash_round() -> CrashRound:
    """Create a new crash round with hashed server seed (provably fair)."""
    server_seed = secrets.token_hex(32)
    server_seed_hash = hashlib.sha256(server_seed.encode()).hexdigest()
    return CrashRound.objects.create(
        server_seed=server_seed,
        server_seed_hash=server_seed_hash,
        client_seed=secrets.token_hex(16),
        nonce=0,
    )
