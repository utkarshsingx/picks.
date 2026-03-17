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
        defaults={'balance': Decimal('0'), 'vault_balance': Decimal('0')},
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


def get_balances(user_id: int) -> dict[str, tuple[Decimal, Decimal]]:
    """Return dict of currency_code -> (balance, vault_balance) for user."""
    wallets = Wallet.objects.filter(user_id=user_id).select_related('currency')
    return {w.currency.code: (w.balance, w.vault_balance) for w in wallets}


def vault_move(user_id: int, currency_code: str, amount: Decimal, direction: str) -> None:
    """Move amount between wallet and vault. direction: 'to_vault' or 'from_vault'."""
    if amount <= 0:
        raise ValueError('Amount must be positive')
    with transaction.atomic():
        wallet = get_or_create_wallet(user_id, currency_code)
        wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
        if direction == 'to_vault':
            if wallet.balance < amount:
                raise ValueError(f'Insufficient balance: {wallet.balance} < {amount}')
            wallet.balance -= amount
            wallet.vault_balance += amount
        elif direction == 'from_vault':
            if wallet.vault_balance < amount:
                raise ValueError(f'Insufficient vault balance: {wallet.vault_balance} < {amount}')
            wallet.vault_balance -= amount
            wallet.balance += amount
        else:
            raise ValueError("direction must be 'to_vault' or 'from_vault'")
        wallet.save()


def get_or_create_all_wallets(user_id: int) -> list[Wallet]:
    """Ensure user has a wallet for each supported currency."""
    currencies = Currency.objects.all()
    wallets = []
    for currency in currencies:
        wallet, _ = Wallet.objects.get_or_create(
            user_id=user_id,
            currency=currency,
            defaults={'balance': Decimal('0'), 'vault_balance': Decimal('0')},
        )
        wallets.append(wallet)
    return wallets
