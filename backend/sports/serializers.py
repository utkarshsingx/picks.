from decimal import Decimal

from rest_framework import serializers


class SportsBetSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0.00000001'))
    currency = serializers.ChoiceField(choices=['BTC', 'ETH', 'USDT', 'USD'])
    event_id = serializers.CharField()
    sport_key = serializers.CharField()
    market_key = serializers.CharField()
    outcome_name = serializers.CharField()
    odds = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('1.01'))
    home_team = serializers.CharField(required=False, allow_blank=True)
    away_team = serializers.CharField(required=False, allow_blank=True)
    outcome_point = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)
