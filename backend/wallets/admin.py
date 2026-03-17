from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html

from .models import Currency, Wallet, Transaction, PendingDeposit


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_crypto', 'decimals')


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'currency', 'balance', 'updated_at')
    list_filter = ('currency',)
    search_fields = ('user__email',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'wallet', 'type', 'amount', 'balance_after', 'status', 'reference_id', 'created_at')
    list_filter = ('type', 'status')
    search_fields = ('reference_id', 'wallet__user__email')
    readonly_fields = ('wallet', 'type', 'amount', 'balance_after', 'created_at')
    actions = ['approve_withdrawals', 'reject_withdrawals']

    @admin.action(description='Approve selected withdrawals')
    def approve_withdrawals(self, request, queryset):
        pending = queryset.filter(type='WITHDRAWAL', status='PENDING')
        for tx in pending:
            tx.status = Transaction.Status.COMPLETED
            tx.save()
        self.message_user(request, f'Approved {pending.count()} withdrawal(s)', messages.SUCCESS)

    @admin.action(description='Reject selected withdrawals')
    def reject_withdrawals(self, request, queryset):
        from .services import credit_wallet
        from decimal import Decimal
        pending = queryset.filter(type='WITHDRAWAL', status='PENDING')
        for tx in pending:
            tx.status = Transaction.Status.CANCELLED
            tx.save()
            credit_wallet(tx.wallet.user_id, tx.wallet.currency.code, abs(tx.amount), 'ADJUSTMENT', metadata={'reason': 'withdrawal_rejected'})
        self.message_user(request, f'Rejected {pending.count()} withdrawal(s)', messages.SUCCESS)


@admin.register(PendingDeposit)
class PendingDepositAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'currency_code', 'amount_usd', 'gateway', 'status', 'created_at')
    list_filter = ('gateway', 'status')
