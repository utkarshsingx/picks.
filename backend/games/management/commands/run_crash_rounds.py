"""
Management command to run Crash game rounds. Broadcasts multiplier via WebSocket.
Run with: python manage.py run_crash_rounds
Requires Redis and Django Channels. Run daphne for WebSocket support.
"""
import asyncio
import time
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async

from games.models import CrashRound
from games.services import create_crash_round, compute_crash_point


@database_sync_to_async
def get_or_create_betting_round():
    if not CrashRound.objects.filter(status=CrashRound.Status.BETTING).exists():
        create_crash_round()
    return CrashRound.objects.filter(status=CrashRound.Status.BETTING).first()


@database_sync_to_async
def transition_round_to_running(round_obj, crash_point):
    """Transition round to RUNNING and save."""
    round_obj.status = CrashRound.Status.RUNNING
    round_obj.crash_point = crash_point
    round_obj.started_at = timezone.now()
    round_obj.save()


@database_sync_to_async
def settle_pending_crash_bets(round_id):
    """Mark all pending crash bets in round as LOST."""
    from games.models import Bet
    Bet.objects.filter(
        game_type=Bet.GameType.CRASH,
        status=Bet.Status.PENDING,
        metadata__round_id=round_id,
    ).update(status=Bet.Status.LOST)


@database_sync_to_async
def transition_round_to_crashed(round_obj):
    """Transition round to CRASHED and save."""
    round_obj.status = CrashRound.Status.CRASHED
    round_obj.crashed_at = timezone.now()
    round_obj.save()


@database_sync_to_async
def create_next_crash_round():
    """Create next crash round."""
    create_crash_round()


class Command(BaseCommand):
    help = 'Run Crash game rounds (broadcasts multiplier via WebSocket)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--betting-seconds',
            type=int,
            default=5,
            help='Seconds in BETTING phase before round starts',
        )
        parser.add_argument(
            '--tick-ms',
            type=int,
            default=100,
            help='Milliseconds between multiplier updates',
        )

    def handle(self, *args, **options):
        betting_seconds = options['betting_seconds']
        tick_ms = options['tick_ms']

        channel_layer = get_channel_layer()
        if not channel_layer:
            self.stderr.write('Channel layer not configured. Set CHANNEL_LAYERS.')
            return

        self.stdout.write('Starting Crash round runner...')

        while True:
            try:
                async_to_sync(self._run_round)(channel_layer, betting_seconds, tick_ms)
            except KeyboardInterrupt:
                self.stdout.write('Stopped.')
                break
            except Exception as e:
                self.stderr.write(f'Error: {e}')
                time.sleep(1)

    async def _run_round(self, channel_layer, betting_seconds, tick_ms):
        # Ensure we have a BETTING round
        round_obj = await get_or_create_betting_round()
        round_id = str(round_obj.round_id)
        group = f'crash_round_{round_id}'

        # Betting phase
        self.stdout.write(f'Round {round_id} BETTING for {betting_seconds}s')
        await asyncio.sleep(betting_seconds)

        # Compute crash point and transition to RUNNING
        crash_point = compute_crash_point(
            round_obj.server_seed,
            round_obj.client_seed,
            round_obj.nonce,
        )
        await transition_round_to_running(round_obj, crash_point)

        await channel_layer.group_send(group, {
            'type': 'crash_round_started',
        })

        # Run multiplier from 1.00 to crash_point
        multiplier = Decimal('1.00')
        elapsed_ms = 0
        tick_sec = tick_ms / 1000.0

        while multiplier < crash_point:
            await asyncio.sleep(tick_sec)
            elapsed_ms += tick_ms
            # Linear growth: 1.00 + (crash_point - 1) * progress
            # Simpler: grow by ~0.01 per tick
            multiplier += Decimal('0.01')
            if multiplier >= crash_point:
                multiplier = crash_point

            await channel_layer.group_send(group, {
                'type': 'crash_multiplier_update',
                'multiplier': float(multiplier),
                'elapsed_ms': elapsed_ms,
            })

        # Crashed - mark all pending bets in this round as LOST
        await settle_pending_crash_bets(round_id)

        await transition_round_to_crashed(round_obj)

        await channel_layer.group_send(group, {
            'type': 'crash_round_crashed',
            'crash_point': str(crash_point),
        })

        self.stdout.write(f'Round {round_id} CRASHED at {crash_point}x')

        # Create next round
        await create_next_crash_round()
