from django.contrib import admin
from .models import Bet, CrashRound


@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'game_type', 'currency_code', 'amount', 'status', 'payout', 'created_at')
    list_filter = ('game_type', 'status', 'currency_code')
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CrashRound)
class CrashRoundAdmin(admin.ModelAdmin):
    list_display = ('round_id', 'status', 'crash_point', 'started_at', 'crashed_at', 'created_at')
    list_filter = ('status',)
    readonly_fields = ('round_id', 'server_seed_hash', 'created_at')
