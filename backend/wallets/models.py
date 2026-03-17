from decimal import Decimal

from django.conf import settings
from django.db import models


class Currency(models.Model):
    """Supported currency (crypto or fiat)."""

    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=50)
    is_crypto = models.BooleanField(default=False)
    decimals = models.PositiveIntegerField(default=8)

    def __str__(self):
        return f"{self.code} ({self.name})"


class Wallet(models.Model):
    """User wallet for a specific currency."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallets',
    )
    currency = models.ForeignKey(
        Currency,
        on_delete=models.PROTECT,
        related_name='wallets',
    )
    balance = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'currency')]
        indexes = [
            models.Index(fields=['user', 'currency']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.currency.code}"


class Transaction(models.Model):
    """Immutable ledger entry for wallet balance changes."""

    class Type(models.TextChoices):
        DEPOSIT = 'DEPOSIT', 'Deposit'
        WITHDRAWAL = 'WITHDRAWAL', 'Withdrawal'
        BET = 'BET', 'Bet'
        WIN = 'WIN', 'Win'
        BONUS = 'BONUS', 'Bonus'
        ADJUSTMENT = 'ADJUSTMENT', 'Adjustment'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.PROTECT,
        related_name='transactions',
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    balance_after = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reference_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', 'created_at']),
            models.Index(fields=['reference_id']),
        ]

    def __str__(self):
        return f"{self.wallet} {self.type} {self.amount} ({self.status})"


class PendingWithdrawal(Transaction):
    """Proxy for pending withdrawal transactions. Admin-only view."""

    class Meta:
        proxy = True
        verbose_name = 'Pending Withdrawal'
        verbose_name_plural = 'Pending Withdrawals'


class PendingDeposit(models.Model):
    """Tracks deposits awaiting webhook confirmation. Used for idempotency."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pending_deposits',
    )
    currency_code = models.CharField(max_length=10)
    amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    reference_id = models.CharField(max_length=255, unique=True, db_index=True)
    gateway = models.CharField(max_length=20)  # nowpayments, stripe
    status = models.CharField(max_length=20, default='PENDING')  # PENDING, COMPLETED, FAILED
    created_at = models.DateTimeField(auto_now_add=True)
