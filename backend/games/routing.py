from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/crash/<uuid:round_id>/', consumers.CrashConsumer.as_asgi()),
]
