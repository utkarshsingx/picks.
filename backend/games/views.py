from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Bet, CrashRound
from .serializers import (
    BetSerializer,
    DiceBetSerializer,
    MinesStartSerializer,
    MinesRevealSerializer,
    MinesCashoutSerializer,
    PlinkoBetSerializer,
    CrashBetSerializer,
    CrashCashoutSerializer,
    CrashRoundSerializer,
)
from .services import (
    play_dice,
    start_mines,
    reveal_mines_tile,
    cashout_mines,
    play_plinko,
    create_crash_round,
    compute_crash_point,
)


class BetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# --- Dice ---

@extend_schema(
    tags=['games'],
    summary='Place Dice bet',
    request=DiceBetSerializer,
    responses={200: BetSerializer, 400: {'description': 'Validation or insufficient balance'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dice_bet(request):
    """Place a Dice bet. Instant resolution."""
    serializer = DiceBetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        bet = play_dice(
            request.user.id,
            data['currency'],
            data['amount'],
            data['direction'],
            data['target'],
        )
        return Response(BetSerializer(bet).data)
    except ValueError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# --- Mines ---

@extend_schema(
    tags=['games'],
    summary='Start Mines game',
    request=MinesStartSerializer,
    responses={200: BetSerializer, 400: {'description': 'Validation or insufficient balance'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mines_start(request):
    """Start a Mines game. Returns bet with bet_id for reveal/cashout."""
    serializer = MinesStartSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        bet = start_mines(
            request.user.id,
            data['currency'],
            data['amount'],
            data.get('mine_count', 5),
        )
        return Response(BetSerializer(bet).data)
    except ValueError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['games'],
    summary='Reveal Mines tile',
    request=MinesRevealSerializer,
    responses={
        200: {
            'type': 'object',
            'properties': {
                'is_mine': {'type': 'boolean'},
                'bet': BetSerializer(),
            },
        },
        400: {'description': 'Invalid tile or already revealed'},
    },
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mines_reveal(request):
    """Reveal a tile. Returns is_mine and updated bet."""
    serializer = MinesRevealSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        result = reveal_mines_tile(data['bet_id'], request.user.id, data['tile_index'])
        return Response({
            'is_mine': result['is_mine'],
            'bet': BetSerializer(result['bet']).data,
        })
    except Bet.DoesNotExist:
        return Response({'detail': 'Bet not found.'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['games'],
    summary='Cash out Mines',
    request=MinesCashoutSerializer,
    responses={200: BetSerializer, 400: {'description': 'Must reveal at least one tile'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mines_cashout(request):
    """Cash out on Mines. Payout based on revealed tiles."""
    serializer = MinesCashoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        bet = cashout_mines(serializer.validated_data['bet_id'], request.user.id)
        return Response(BetSerializer(bet).data)
    except Bet.DoesNotExist:
        return Response({'detail': 'Bet not found.'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# --- Plinko ---

@extend_schema(
    tags=['games'],
    summary='Place Plinko bet',
    request=PlinkoBetSerializer,
    responses={200: BetSerializer, 400: {'description': 'Validation or insufficient balance'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def plinko_bet(request):
    """Place a Plinko bet. Instant resolution."""
    serializer = PlinkoBetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        bet = play_plinko(request.user.id, data['currency'], data['amount'], data['risk'])
        return Response(BetSerializer(bet).data)
    except ValueError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# --- Crash ---

@extend_schema(
    tags=['games'],
    summary='Place Crash bet',
    request=CrashBetSerializer,
    responses={200: BetSerializer, 400: {'description': 'Round not in betting or invalid'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crash_bet(request):
    """Place a Crash bet. Bet is pending until round runs and user cashes out or crashes."""
    from .services import _house_edge_multiplier
    from wallets.services import debit_wallet
    from wallets.models import Transaction
    from django.db import transaction as db_transaction

    serializer = CrashBetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        round_obj = CrashRound.objects.get(round_id=data['round_id'], status=CrashRound.Status.BETTING)
    except CrashRound.DoesNotExist:
        return Response({'detail': 'Round not found or betting closed.'}, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        bet_tx = debit_wallet(
            request.user.id,
            data['currency'],
            data['amount'],
            Transaction.Type.BET,
            metadata={'game': 'crash', 'round_id': str(data['round_id'])},
        )
        bet = Bet.objects.create(
            user=request.user,
            game_type=Bet.GameType.CRASH,
            currency_code=data['currency'],
            amount=data['amount'],
            status=Bet.Status.PENDING,
            metadata={'round_id': str(data['round_id']), 'cashout_multiplier': None},
            bet_transaction_id=bet_tx.id,
        )
    return Response(BetSerializer(bet).data)


@extend_schema(
    tags=['games'],
    summary='Cash out Crash',
    request=CrashCashoutSerializer,
    responses={200: BetSerializer, 400: {'description': 'Round already crashed or invalid'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crash_cashout(request):
    """Cash out at current multiplier. Only valid while round is RUNNING."""
    from .services import _house_edge_multiplier
    from wallets.services import credit_wallet
    from wallets.models import Transaction
    from django.db import transaction as db_transaction

    serializer = CrashCashoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    bet_id = serializer.validated_data['bet_id']

    try:
        bet = Bet.objects.get(id=bet_id, user=request.user, game_type=Bet.GameType.CRASH, status=Bet.Status.PENDING)
    except Bet.DoesNotExist:
        return Response({'detail': 'Bet not found.'}, status=status.HTTP_404_NOT_FOUND)

    round_id = bet.metadata.get('round_id')
    try:
        round_obj = CrashRound.objects.get(round_id=round_id, status=CrashRound.Status.RUNNING)
    except CrashRound.DoesNotExist:
        return Response({'detail': 'Round not running. Cannot cash out.'}, status=status.HTTP_400_BAD_REQUEST)

    multiplier = serializer.validated_data.get('multiplier')
    if multiplier is None:
        return Response({'detail': 'multiplier required for cashout (from WebSocket or request).'}, status=status.HTTP_400_BAD_REQUEST)
    multiplier = Decimal(str(multiplier))
    payout_multiplier = _house_edge_multiplier(float(multiplier))
    payout = bet.amount * payout_multiplier

    with db_transaction.atomic():
        win_tx = credit_wallet(
            request.user.id,
            bet.currency_code,
            payout,
            Transaction.Type.WIN,
            reference_id=str(bet.id),
            metadata={'game': 'crash', 'bet_id': bet.id, 'multiplier': float(multiplier)},
        )
        bet.status = Bet.Status.CASHED_OUT
        bet.payout = payout
        bet.outcome = {'cashout_multiplier': float(multiplier), 'payout_multiplier': float(payout_multiplier)}
        bet.metadata = {**(bet.metadata or {}), 'cashout_multiplier': float(multiplier)}
        bet.win_transaction_id = win_tx.id
        bet.save()

    return Response(BetSerializer(bet).data)


@extend_schema(
    tags=['games'],
    summary='List Crash rounds',
    parameters=[
        OpenApiParameter('limit', int, description='Max rounds to return', default=20),
    ],
    responses={200: CrashRoundSerializer(many=True)},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def crash_rounds(request):
    """List recent crash rounds. Ensures at least one BETTING round exists."""
    if not CrashRound.objects.filter(status=CrashRound.Status.BETTING).exists():
        create_crash_round()
    limit = min(int(request.query_params.get('limit', 20)), 50)
    rounds = CrashRound.objects.order_by('-created_at')[:limit]
    return Response(CrashRoundSerializer(rounds, many=True).data)


@extend_schema(
    tags=['games'],
    summary='Get Crash round details',
    responses={200: CrashRoundSerializer, 404: {'description': 'Round not found'}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def crash_round_detail(request, round_id):
    """Get round details. For BETTING rounds, includes server_seed_hash for next round."""
    try:
        round_obj = CrashRound.objects.get(round_id=round_id)
    except CrashRound.DoesNotExist:
        return Response({'detail': 'Round not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(CrashRoundSerializer(round_obj).data)


# --- Bet history ---

@extend_schema(
    tags=['games'],
    summary='List user bets',
    parameters=[
        OpenApiParameter('game_type', str, enum=['DICE', 'MINES', 'PLINKO', 'CRASH']),
        OpenApiParameter('page', int),
        OpenApiParameter('page_size', int),
    ],
    responses={200: BetSerializer(many=True)},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bet_list(request):
    """Paginated list of user's bets."""
    qs = Bet.objects.filter(user=request.user).order_by('-created_at')
    game_type = request.query_params.get('game_type')
    if game_type:
        qs = qs.filter(game_type=game_type.upper())
    paginator = BetPagination()
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response(BetSerializer(page, many=True).data)
