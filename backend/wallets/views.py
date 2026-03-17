from decimal import Decimal

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Currency, Transaction, Wallet
from .serializers import (
    DepositCryptoSerializer,
    DepositFiatSerializer,
    TransactionSerializer,
    WithdrawSerializer,
)
from .services import credit_wallet, debit_wallet, get_balances, get_or_create_all_wallets


class TransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@extend_schema(
    tags=['wallets'],
    summary='Get wallet balances',
    description='Returns current user balances for all supported currencies (BTC, ETH, USDT, USD).',
    responses={
        200: {
            'type': 'object',
            'properties': {
                'balances': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'currency': {'type': 'string'},
                            'balance': {'type': 'string'},
                            'balance_display': {'type': 'string'},
                        },
                    },
                },
            },
        },
    },
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def balances(request):
    """Get current user's balances for all currencies."""
    user_id = request.user.id
    get_or_create_all_wallets(user_id)
    balances_dict = get_balances(user_id)
    currencies = {c.code: c for c in Currency.objects.all()}
    result = []
    for code, bal in sorted(balances_dict.items()):
        dec = currencies.get(code, Currency()).decimals if code in currencies else 8
        try:
            disp = f"{float(bal):.{dec}f}".rstrip('0').rstrip('.') or '0'
        except (ValueError, TypeError):
            disp = str(bal)
        result.append({'currency': code, 'balance': str(bal), 'balance_display': disp})
    return Response({'balances': result})


@extend_schema(
    tags=['wallets'],
    summary='List transactions',
    description='Paginated list of user transactions. Filter by type, currency, or status.',
    parameters=[
        OpenApiParameter(name='type', description='Filter by type', type=str, enum=['DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'BONUS', 'ADJUSTMENT']),
        OpenApiParameter(name='currency', description='Filter by currency', type=str, enum=['BTC', 'ETH', 'USDT', 'USD']),
        OpenApiParameter(name='status', description='Filter by status', type=str, enum=['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']),
        OpenApiParameter(name='page', description='Page number', type=int),
        OpenApiParameter(name='page_size', description='Items per page', type=int),
    ],
    responses={200: TransactionSerializer(many=True)},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transactions(request):
    """List user's transactions with pagination and filters."""
    wallet_ids = Wallet.objects.filter(user=request.user).values_list('id', flat=True)
    qs = Transaction.objects.filter(wallet_id__in=wallet_ids).select_related('wallet__currency').order_by('-created_at')

    tx_type = request.query_params.get('type')
    if tx_type:
        qs = qs.filter(type=tx_type)
    currency = request.query_params.get('currency')
    if currency:
        qs = qs.filter(wallet__currency__code=currency.upper())
    tx_status = request.query_params.get('status')
    if tx_status:
        qs = qs.filter(status=tx_status.upper())

    paginator = TransactionPagination()
    page = paginator.paginate_queryset(qs, request)
    serializer = TransactionSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@extend_schema(
    tags=['wallets'],
    summary='Create crypto deposit',
    description='Create a NowPayments payment. Returns payment_url to redirect user. Webhook credits wallet on completion.',
    request=DepositCryptoSerializer,
    responses={
        200: {'type': 'object', 'properties': {'payment_url': {'type': 'string'}, 'payment_id': {'type': 'string'}}},
        503: {'description': 'NowPayments not configured'},
    },
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_crypto(request):
    """Create crypto deposit via NowPayments. Returns payment URL."""
    from .payments.nowpayments_client import create_nowpayments_payment

    serializer = DepositCryptoSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    currency = serializer.validated_data['currency']
    amount_usd = serializer.validated_data['amount_usd']

    result = create_nowpayments_payment(
        user_id=request.user.id,
        user_email=request.user.email,
        currency=currency,
        amount_usd=float(amount_usd),
    )
    if result is None:
        return Response(
            {'detail': 'NowPayments is not configured. Set NOWPAYMENTS_API_KEY.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(result)


@extend_schema(
    tags=['wallets'],
    summary='Create fiat deposit',
    description='Create Stripe PaymentIntent. Returns client_secret for Stripe Elements. Webhook credits wallet on payment success.',
    request=DepositFiatSerializer,
    responses={
        200: {'type': 'object', 'properties': {'client_secret': {'type': 'string'}, 'payment_intent_id': {'type': 'string'}}},
        503: {'description': 'Stripe not configured'},
    },
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_fiat(request):
    """Create fiat deposit via Stripe. Returns client_secret for Stripe Elements."""
    from .payments.stripe_client import create_stripe_payment_intent

    serializer = DepositFiatSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    amount_usd = serializer.validated_data['amount_usd']

    result = create_stripe_payment_intent(
        user_id=request.user.id,
        amount_cents=int(float(amount_usd) * 100),
    )
    if result is None:
        return Response(
            {'detail': 'Stripe is not configured. Set STRIPE_SECRET_KEY.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(result)


@extend_schema(
    tags=['wallets'],
    summary='Request withdrawal',
    description='Withdraw funds. Auto-approved if under WITHDRAWAL_AUTO_APPROVE_LIMIT_USD, else pending admin approval. Crypto requires destination_address.',
    request=WithdrawSerializer,
    responses={200: TransactionSerializer, 400: {'description': 'Insufficient balance or validation error'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw(request):
    """Request withdrawal. Auto-approved if under limit, else pending admin approval."""
    serializer = WithdrawSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    currency_code = serializer.validated_data['currency'].upper()
    amount = serializer.validated_data['amount']
    destination_address = serializer.validated_data.get('destination_address', '')

    limit_usd = settings.WITHDRAWAL_AUTO_APPROVE_LIMIT_USD
    min_usd = settings.WITHDRAWAL_MIN_AMOUNT_USD

    # Approximate USD: 1:1 for USD; for crypto use rough conversion (simplified - could use live rates)
    if currency_code == 'USD':
        amount_usd_approx = float(amount)
    else:
        rates = {'BTC': 50000, 'ETH': 3000, 'USDT': 1}
        amount_usd_approx = float(amount) * rates.get(currency_code, 1)

    if amount_usd_approx < min_usd:
        return Response(
            {'detail': f'Minimum withdrawal is ${min_usd} USD equivalent.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        if amount_usd_approx <= limit_usd:
            tx = debit_wallet(
                request.user.id,
                currency_code,
                amount,
                Transaction.Type.WITHDRAWAL,
                metadata={'destination_address': destination_address} if destination_address else None,
            )
            return Response(TransactionSerializer(tx).data)
        else:
            # Create pending withdrawal - debit and create tx with PENDING
            from .models import Wallet
            from django.db import transaction as db_transaction

            with db_transaction.atomic():
                from .services import get_or_create_wallet
                wallet = get_or_create_wallet(request.user.id, currency_code)
                wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
                if wallet.balance < amount:
                    return Response(
                        {'detail': 'Insufficient balance.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                wallet.balance -= amount
                wallet.save()
                tx = Transaction.objects.create(
                    wallet=wallet,
                    type=Transaction.Type.WITHDRAWAL,
                    amount=-amount,
                    balance_after=wallet.balance,
                    status=Transaction.Status.PENDING,
                    metadata={'destination_address': destination_address, 'requires_approval': True} if destination_address else {'requires_approval': True},
                )
            return Response(TransactionSerializer(tx).data)
    except ValueError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
