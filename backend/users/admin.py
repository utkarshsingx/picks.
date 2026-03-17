from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'is_verified', 'kyc_status', 'vip_level', 'two_factor_enabled', 'created_at')
    list_filter = ('is_verified', 'kyc_status', 'two_factor_enabled')
    search_fields = ('email', 'username')
    ordering = ('-created_at',)
    fieldsets = BaseUserAdmin.fieldsets + (
        (None, {'fields': ('is_verified', 'kyc_status', 'vip_level', 'two_factor_enabled', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')
