from decimal import Decimal

from rest_framework import serializers

from .models import Bet, CrashRound


class BetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bet
        fields = (
            'id', 'game_type', 'currency_code', 'amount', 'status', 'payout',
            'outcome', 'metadata', 'created_at', 'updated_at',
        )
        read_only_fields = fields


class DiceBetSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0'))
    currency = serializers.ChoiceField(choices=['BTC', 'ETH', 'USDT', 'USD'])
    direction = serializers.ChoiceField(choices=['over', 'under'])
    target = serializers.FloatField(min_value=1, max_value=99)


class MinesStartSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0'))
    currency = serializers.ChoiceField(choices=['BTC', 'ETH', 'USDT', 'USD'])
    mine_count = serializers.IntegerField(min_value=1, max_value=24, default=5)


class MinesRevealSerializer(serializers.Serializer):
    bet_id = serializers.IntegerField()
    tile_index = serializers.IntegerField(min_value=0, max_value=24)


class MinesCashoutSerializer(serializers.Serializer):
    bet_id = serializers.IntegerField()


class PlinkoBetSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0'))
    currency = serializers.ChoiceField(choices=['BTC', 'ETH', 'USDT', 'USD'])
    risk = serializers.ChoiceField(choices=['low', 'medium', 'high'])


class CrashBetSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0'))
    currency = serializers.ChoiceField(choices=['BTC', 'ETH', 'USDT', 'USD'])
    round_id = serializers.UUIDField()


class CrashCashoutSerializer(serializers.Serializer):
    bet_id = serializers.IntegerField()
    multiplier = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)


class CrashRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrashRound
        fields = ('round_id', 'server_seed_hash', 'status', 'crash_point', 'started_at', 'crashed_at', 'created_at')
        read_only_fields = fields
