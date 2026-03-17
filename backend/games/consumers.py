import json
from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


def get_user_from_token(token_string: str):
    """Validate JWT and return user or None."""
    try:
        token = AccessToken(token_string)
        return User.objects.get(id=token['user_id'])
    except (InvalidToken, TokenError, User.DoesNotExist):
        return None


class CrashConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for Crash game. Broadcasts multiplier updates."""

    async def connect(self):
        self.round_id = str(self.scope['url_route']['kwargs']['round_id'])
        self.room_group_name = f'crash_round_{self.round_id}'

        # JWT from query string: ?token=...
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]

        user = await sync_to_async(get_user_from_token)(token) if token else None
        if not user:
            await self.close(code=4001)
            return

        self.scope['user'] = user

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """Handle incoming messages (e.g. cashout request)."""
        if text_data:
            try:
                data = json.loads(text_data)
                if data.get('type') == 'cashout':
                    # Forward to a sync handler - cashout is done via REST for now
                    await self.send(text_data=json.dumps({
                        'type': 'cashout_ack',
                        'message': 'Use POST /api/games/crash/cashout/ with bet_id and multiplier',
                    }))
            except json.JSONDecodeError:
                pass

    async def crash_multiplier_update(self, event):
        """Broadcast multiplier update to client."""
        await self.send(text_data=json.dumps({
            'type': 'multiplier_update',
            'multiplier': event['multiplier'],
            'elapsed_ms': event.get('elapsed_ms', 0),
        }))

    async def crash_round_started(self, event):
        """Notify client round has started."""
        await self.send(text_data=json.dumps({
            'type': 'round_started',
        }))

    async def crash_round_crashed(self, event):
        """Notify client round has crashed."""
        await self.send(text_data=json.dumps({
            'type': 'round_crashed',
            'crash_point': str(event['crash_point']),
        }))

    async def crash_round_betting(self, event):
        """Notify client round is in betting phase."""
        await self.send(text_data=json.dumps({
            'type': 'round_betting',
            'round_id': event.get('round_id'),
        }))
