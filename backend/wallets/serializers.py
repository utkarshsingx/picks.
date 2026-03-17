from decimal import Decimal

from rest_framework import serializers

from .models import Currency, Wallet, Transaction


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ('code', 'name', 'is_crypto', 'decimals')


class BalanceSerializer(serializers.Serializer):
    currency = serializers.CharField()
    balance = serializers.DecimalField(max_digits=20, decimal_places=8)
    balance_display = serializers.CharField(read_only=True)

    def to_representation(self, instance):
        if isinstance(instance, dict):
            return {
                'currency': instance['currency'],
                'balance': str(instance['balance']),
                'balance_display': f"{instance['balance']:.{instance.get('decimals', 8)}f}".rstrip('0').rstrip('.'),
            }
        return super().to_representation(instance)


class TransactionSerializer(serializers.ModelSerializer):
    currency = serializers.CharField(source='wallet.currency.code', read_only=True)

    class Meta:
        model = Transaction
        fields = ('id', 'currency', 'type', 'amount', 'balance_after', 'status', 'reference_id', 'created_at')
        read_only_fields = fields


class DepositCryptoSerializer(serializers.Serializer):
    currency = serializers.ChoiceField(choices=['BTC', 'ETH', 'USDT'])
    amount_usd = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('1'))


class DepositFiatSerializer(serializers.Serializer):
    amount_usd = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('1'))


class WithdrawSerializer(serializers.Serializer):
    currency = serializers.CharField()
    amount = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0.00000001'))
    destination_address = serializers.CharField(required=False, allow_blank=True)


class VaultMoveSerializer(serializers.Serializer):
    currency = serializers.ChoiceField(choices=['BTC', 'ETH', 'USDT', 'USD'])
    amount = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0.00000001'))
    direction = serializers.ChoiceField(choices=['to_vault', 'from_vault'])
