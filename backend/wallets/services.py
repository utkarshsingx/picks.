"""
Atomic wallet operations. All balance changes use transaction.atomic() and select_for_update().
"""

from decimal import Decimal

from django.db import transaction

from .models import Currency, Wallet, Transaction


def get_or_create_wallet(user_id: int, currency_code: str) -> Wallet:
    """Get or create wallet for user and currency."""
    currency = Currency.objects.get(code=currency_code.upper())
    wallet, _ = Wallet.objects.get_or_create(
        user_id=user_id,
        currency=currency,
        defaults={'balance': Decimal('0')},
    )
    return wallet


def credit_wallet(
    user_id: int,
    currency_code: str,
    amount: Decimal,
    tx_type: str,  # Transaction.Type value
    reference_id: str | None = None,
    metadata: dict | None = None,
) -> Transaction:
    """Atomically credit wallet. Amount must be non-negative."""
    if amount < 0:
        raise ValueError('Credit amount must be non-negative')
    with transaction.atomic():
        wallet = get_or_create_wallet(user_id, currency_code)
        wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
        wallet.balance += amount
        wallet.save()
        tx = Transaction.objects.create(
            wallet=wallet,
            type=tx_type,
            amount=amount,
            balance_after=wallet.balance,
            status=Transaction.Status.COMPLETED,
            reference_id=reference_id,
            metadata=metadata,
        )
    return tx


def debit_wallet(
    user_id: int,
    currency_code: str,
    amount: Decimal,
    tx_type: str,
    reference_id: str | None = None,
    metadata: dict | None = None,
    allow_negative: bool = False,
) -> Transaction:
    """Atomically debit wallet. Raises ValueError if insufficient balance (unless allow_negative)."""
    if amount < 0:
        raise ValueError('Debit amount must be non-negative')
    with transaction.atomic():
        wallet = get_or_create_wallet(user_id, currency_code)
        wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
        if not allow_negative and wallet.balance < amount:
            raise ValueError(f'Insufficient balance: {wallet.balance} < {amount}')
        wallet.balance -= amount
        wallet.save()
        tx = Transaction.objects.create(
            wallet=wallet,
            type=tx_type,
            amount=-amount,
            balance_after=wallet.balance,
            status=Transaction.Status.COMPLETED,
            reference_id=reference_id,
            metadata=metadata,
        )
    return tx


def get_balances(user_id: int) -> dict[str, Decimal]:
    """Return dict of currency_code -> balance for user."""
    wallets = Wallet.objects.filter(user_id=user_id).select_related('currency')
    return {w.currency.code: w.balance for w in wallets}


def get_or_create_all_wallets(user_id: int) -> list[Wallet]:
    """Ensure user has a wallet for each supported currency."""
    currencies = Currency.objects.all()
    wallets = []
    for currency in currencies:
        wallet, _ = Wallet.objects.get_or_create(
            user_id=user_id,
            currency=currency,
            defaults={'balance': Decimal('0')},
        )
        wallets.append(wallet)
    return wallets
