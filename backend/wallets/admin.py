from django.contrib import admin
from django.contrib import messages

from .models import Currency, Wallet, Transaction, PendingWithdrawal, PendingDeposit


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
    date_hierarchy = 'created_at'
    list_per_page = 25
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


@admin.register(PendingWithdrawal)
class PendingWithdrawalAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email', 'amount', 'currency', 'destination', 'created_at')
    list_filter = ('wallet__currency',)
    search_fields = ('reference_id', 'wallet__user__email')
    date_hierarchy = 'created_at'
    list_per_page = 25
    actions = ['approve_withdrawals', 'reject_withdrawals']

    def get_queryset(self, request):
        return super().get_queryset(request).filter(
            type=Transaction.Type.WITHDRAWAL,
            status=Transaction.Status.PENDING,
        ).select_related('wallet__user', 'wallet__currency')

    def user_email(self, obj):
        return obj.wallet.user.email

    user_email.short_description = 'User'
    user_email.admin_order_field = 'wallet__user__email'

    def currency(self, obj):
        return obj.wallet.currency.code

    currency.short_description = 'Currency'
    currency.admin_order_field = 'wallet__currency__code'

    def destination(self, obj):
        return obj.reference_id or '-'

    destination.short_description = 'Destination'

    @admin.action(description='Approve selected withdrawals')
    def approve_withdrawals(self, request, queryset):
        for tx in queryset:
            tx.status = Transaction.Status.COMPLETED
            tx.save()
        self.message_user(request, f'Approved {queryset.count()} withdrawal(s)', messages.SUCCESS)

    @admin.action(description='Reject selected withdrawals')
    def reject_withdrawals(self, request, queryset):
        from .services import credit_wallet
        for tx in queryset:
            tx.status = Transaction.Status.CANCELLED
            tx.save()
            credit_wallet(tx.wallet.user_id, tx.wallet.currency.code, abs(tx.amount), 'ADJUSTMENT', metadata={'reason': 'withdrawal_rejected'})
        self.message_user(request, f'Rejected {queryset.count()} withdrawal(s)', messages.SUCCESS)


@admin.register(PendingDeposit)
class PendingDepositAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'currency_code', 'amount_usd', 'gateway', 'status', 'created_at')
    list_filter = ('gateway', 'status')
    search_fields = ('user__email', 'reference_id')
    date_hierarchy = 'created_at'
    actions = ['mark_completed', 'mark_failed']

    @admin.action(description='Mark selected as completed')
    def mark_completed(self, request, queryset):
        from decimal import Decimal
        from .services import credit_wallet
        pending = queryset.filter(status='PENDING')
        for pd in pending:
            # amount_usd is always USD value; credit to USD wallet for manual reconciliation
            credit_wallet(
                pd.user_id,
                'USD',
                Decimal(str(pd.amount_usd)),
                'DEPOSIT',
                reference_id=pd.reference_id,
            )
            pd.status = 'COMPLETED'
            pd.save()
        self.message_user(request, f'Marked {pending.count()} deposit(s) as completed', messages.SUCCESS)

    @admin.action(description='Mark selected as failed')
    def mark_failed(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(status='FAILED')
        self.message_user(request, f'Marked {updated} deposit(s) as failed', messages.SUCCESS)
