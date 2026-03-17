from django.contrib import admin
from django.contrib import messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from wallets.models import Wallet

from .models import User


class WalletInline(admin.TabularInline):
    model = Wallet
    extra = 0
    max_num = 0
    can_delete = False
    readonly_fields = ('currency', 'balance', 'updated_at')
    show_change_link = True


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'is_verified', 'kyc_status', 'vip_level', 'two_factor_enabled', 'is_staff', 'last_login', 'created_at')
    list_filter = ('is_verified', 'kyc_status', 'two_factor_enabled', 'is_staff', 'is_active')
    search_fields = ('email', 'username')
    ordering = ('-created_at',)
    inlines = [WalletInline]
    fieldsets = BaseUserAdmin.fieldsets + (
        (None, {'fields': ('is_verified', 'kyc_status', 'vip_level', 'two_factor_enabled', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')
    actions = ['approve_kyc', 'reject_kyc', 'mark_verified', 'mark_unverified']

    @admin.action(description='Approve KYC')
    def approve_kyc(self, request, queryset):
        updated = queryset.update(kyc_status=User.KycStatus.APPROVED)
        self.message_user(request, f'Approved KYC for {updated} user(s)', messages.SUCCESS)

    @admin.action(description='Reject KYC')
    def reject_kyc(self, request, queryset):
        updated = queryset.update(kyc_status=User.KycStatus.REJECTED)
        self.message_user(request, f'Rejected KYC for {updated} user(s)', messages.SUCCESS)

    @admin.action(description='Mark verified')
    def mark_verified(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'Marked {updated} user(s) as verified', messages.SUCCESS)

    @admin.action(description='Mark unverified')
    def mark_unverified(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'Marked {updated} user(s) as unverified', messages.SUCCESS)
