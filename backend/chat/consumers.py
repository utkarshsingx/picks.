import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


def get_user_from_token(token_string: str):
    try:
        token = AccessToken(token_string)
        return User.objects.get(id=token['user_id'])
    except (InvalidToken, TokenError, User.DoesNotExist):
        return None


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        from urllib.parse import parse_qs
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]
        user = await sync_to_async(get_user_from_token)(token) if token else None
        if not user:
            await self.close(code=4001)
            return
        self.scope['user'] = user
        self.room_name = 'lobby'
        self.room_group_name = f'chat_{self.room_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        try:
            data = json.loads(text_data)
            if data.get('type') == 'chat_message':
                text = (data.get('text') or '').strip()[:1000]
                if text:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'username': self.scope['user'].email,
                            'text': text,
                        },
                    )
                    await self.save_message(text)
        except json.JSONDecodeError:
            pass

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'username': event['username'],
            'text': event['text'],
        }))

    @database_sync_to_async
    def save_message(self, text):
        from .models import ChatRoom, ChatMessage
        room, _ = ChatRoom.objects.get_or_create(name='lobby', defaults={})
        ChatMessage.objects.create(
            room=room,
            user=self.scope['user'],
            text=text,
        )
