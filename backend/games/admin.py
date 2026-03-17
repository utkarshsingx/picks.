from django.contrib import admin

from .models import Bet, CrashRound


@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'game_type', 'sports_meta_display', 'currency_code', 'amount', 'status', 'payout', 'created_at')
    list_filter = ('game_type', 'status', 'currency_code')
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'updated_at', 'outcome', 'metadata')

    def sports_meta_display(self, obj):
        if obj.game_type != Bet.GameType.SPORTS or not obj.metadata:
            return '-'
        parts = []
        if sport := obj.metadata.get('sport_key'):
            parts.append(sport)
        if event := obj.metadata.get('event_id'):
            parts.append(str(event)[:12] + '...' if len(str(event)) > 12 else str(event))
        if market := obj.metadata.get('market_key'):
            parts.append(market)
        return ' | '.join(parts) if parts else '-'

    sports_meta_display.short_description = 'Sports (event/sport/market)'


@admin.register(CrashRound)
class CrashRoundAdmin(admin.ModelAdmin):
    list_display = ('round_id', 'status', 'crash_point', 'started_at', 'crashed_at', 'created_at')
    list_filter = ('status',)
    readonly_fields = ('round_id', 'server_seed_hash', 'created_at')
    date_hierarchy = 'created_at'
