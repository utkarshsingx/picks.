from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ChatRoom, ChatMessage


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_messages_view(request):
    """GET /api/chat/messages/?room=...&limit=50"""
    room_name = request.query_params.get('room', 'lobby')
    limit = min(int(request.query_params.get('limit', 50)), 100)
    room = ChatRoom.objects.filter(name=room_name).first()
    if not room:
        return Response([], status=status.HTTP_200_OK)
    messages = ChatMessage.objects.filter(room=room).select_related('user').order_by('-created_at')[:limit]
    data = [
        {
            'id': m.id,
            'username': m.user.email,
            'text': m.text,
            'created_at': m.created_at.isoformat(),
        }
        for m in reversed(list(messages))
    ]
    return Response(data, status=status.HTTP_200_OK)
