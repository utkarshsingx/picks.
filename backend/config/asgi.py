"""
ASGI config for picks backend.
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

from django.conf import settings
from games.routing import websocket_urlpatterns as games_ws
from chat.routing import websocket_urlpatterns as chat_ws

# Allow WebSocket from frontend origin (localhost, FRONTEND_URL, CORS origins, production)
_ws_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://picksbet.vercel.app",
    "https://www.picksbet.vercel.app",
]
if getattr(settings, "FRONTEND_URL", None):
    _ws_origins.append(settings.FRONTEND_URL.rstrip("/"))
_ws_origins.extend(getattr(settings, "CORS_ALLOWED_ORIGINS", []))
_ws_origins = list(dict.fromkeys(o.rstrip("/") for o in _ws_origins if o))

websocket_app = OriginValidator(
    URLRouter(games_ws + chat_ws),
    _ws_origins,
)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": websocket_app,
})
