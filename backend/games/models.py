from decimal import Decimal
from uuid import uuid4

from django.conf import settings
from django.db import models


class Bet(models.Model):
    """Bet record for casino games. Links to wallet transactions."""

    class GameType(models.TextChoices):
        DICE = 'DICE', 'Dice'
        MINES = 'MINES', 'Mines'
        PLINKO = 'PLINKO', 'Plinko'
        CRASH = 'CRASH', 'Crash'
        SPORTS = 'SPORTS', 'Sports'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        WON = 'WON', 'Won'
        LOST = 'LOST', 'Lost'
        CASHED_OUT = 'CASHED_OUT', 'Cashed Out'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bets',
    )
    game_type = models.CharField(max_length=20, choices=GameType.choices)
    currency_code = models.CharField(max_length=10)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payout = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    outcome = models.JSONField(null=True, blank=True)
    bet_transaction_id = models.BigIntegerField(null=True, blank=True)
    win_transaction_id = models.BigIntegerField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'game_type']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} {self.game_type} {self.amount} ({self.status})"


class CrashRound(models.Model):
    """Crash game round. Provably fair with server/client seeds."""

    class Status(models.TextChoices):
        BETTING = 'BETTING', 'Betting'
        RUNNING = 'RUNNING', 'Running'
        CRASHED = 'CRASHED', 'Crashed'

    round_id = models.UUIDField(default=uuid4, unique=True, db_index=True)
    server_seed = models.CharField(max_length=64)
    server_seed_hash = models.CharField(max_length=64)
    client_seed = models.CharField(max_length=64, default='')
    nonce = models.PositiveIntegerField(default=0)
    crash_point = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BETTING)
    started_at = models.DateTimeField(null=True, blank=True)
    crashed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"CrashRound {self.round_id} ({self.status})"
