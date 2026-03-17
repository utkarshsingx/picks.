from decimal import Decimal

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from games.models import Bet
from games.serializers import BetSerializer
from wallets.models import Transaction
from wallets.services import debit_wallet

from .odds_client import (
    apply_house_edge,
    get_sports,
    get_odds,
    get_event_odds,
    search_events,
)
from .serializers import SportsBetSerializer


@extend_schema(
    tags=['sports'],
    summary='Search events',
    parameters=[OpenApiParameter('q', str, description='Search query (team or event name)')],
    responses={200: {'type': 'array', 'items': {'type': 'object'}}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sports_search(request):
    """Search sports events by team/event name. GET /api/sports/search/?q=..."""
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response([], status=status.HTTP_200_OK)
    if not settings.ODDS_API_KEY:
        return Response(
            {'detail': 'Odds API not configured. Set ODDS_API_KEY.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    results = search_events(q, limit=20)
    return Response(results, status=status.HTTP_200_OK)


@extend_schema(
    tags=['sports'],
    summary='List sports',
    description='Returns in-season sports from The Odds API. Cost: 0 credits.',
    responses={200: {'type': 'array', 'items': {'type': 'object'}}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sports_list(request):
    """List available sports (NFL, NBA, etc.)."""
    sports = get_sports()
    if not sports and not settings.ODDS_API_KEY:
        return Response(
            {'detail': 'Odds API not configured. Set ODDS_API_KEY.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(sports)


@extend_schema(
    tags=['sports'],
    summary='List events with optional odds',
    parameters=[
        OpenApiParameter('include_odds', bool, description='Include odds (costs API credits)'),
    ],
    responses={200: {'type': 'array', 'items': {'type': 'object'}}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def events_list(request, sport_key):
    """List events for a sport. Set include_odds=true to get odds."""
    include_odds = request.query_params.get('include_odds', 'false').lower() == 'true'
    if include_odds:
        events, remaining = get_odds(sport_key)
        return Response({
            'events': events,
            'remaining_credits': remaining,
        })
    from .odds_client import get_events
    if not settings.ODDS_API_KEY:
        return Response(
            {'detail': 'Odds API not configured. Set ODDS_API_KEY.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    events = get_events(sport_key)
    return Response({'events': events})


@extend_schema(
    tags=['sports'],
    summary='Get event odds',
    responses={200: {'type': 'object'}, 404: {'description': 'Event not found'}},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def event_odds(request, sport_key, event_id):
    """Get odds for a single event."""
    event, remaining = get_event_odds(sport_key, event_id)
    if event is None:
        if not settings.ODDS_API_KEY:
            return Response(
                {'detail': 'Odds API not configured. Set ODDS_API_KEY.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({'detail': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'event': event,
        'remaining_credits': remaining,
    })


@extend_schema(
    tags=['sports'],
    summary='Place sports bet',
    request=SportsBetSerializer,
    responses={200: BetSerializer, 400: {'description': 'Validation or insufficient balance'}, 503: {'description': 'Odds API not configured'}},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_bet(request):
    """Place a sports bet. Applies house edge to odds."""
    serializer = SportsBetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if not settings.ODDS_API_KEY:
        return Response(
            {'detail': 'Odds API not configured. Set ODDS_API_KEY.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    odds = float(data['odds'])
    adjusted_odds = apply_house_edge(odds)
    amount = data['amount']

    metadata = {
        'event_id': data['event_id'],
        'sport_key': data['sport_key'],
        'market_key': data['market_key'],
        'outcome_name': data['outcome_name'],
        'odds_placed': str(data['odds']),
        'adjusted_odds': str(adjusted_odds),
        'home_team': data.get('home_team', ''),
        'away_team': data.get('away_team', ''),
        'outcome_point': str(data['outcome_point']) if data.get('outcome_point') is not None else None,
    }

    try:
        bet_tx = debit_wallet(
            request.user.id,
            data['currency'],
            amount,
            Transaction.Type.BET,
            metadata={'game': 'sports', **metadata},
        )
        bet = Bet.objects.create(
            user=request.user,
            game_type=Bet.GameType.SPORTS,
            currency_code=data['currency'],
            amount=amount,
            status=Bet.Status.PENDING,
            metadata=metadata,
            bet_transaction_id=bet_tx.id,
        )
        return Response(BetSerializer(bet).data)
    except ValueError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['sports'],
    summary='List user sports bets',
    parameters=[
        OpenApiParameter('page', int),
        OpenApiParameter('page_size', int),
    ],
    responses={200: BetSerializer(many=True)},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sports_bets(request):
    """List user's sports bets. Reuses games bet list filtered by SPORTS."""
    from rest_framework.pagination import PageNumberPagination
    qs = Bet.objects.filter(user=request.user, game_type=Bet.GameType.SPORTS).order_by('-created_at')
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response(BetSerializer(page, many=True).data)
