"""
URL configuration for picks backend.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from wallets.webhooks import nowpayments_webhook, stripe_webhook

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/wallets/', include('wallets.urls')),
    path('api/games/', include('games.urls')),
    path('api/webhooks/nowpayments/', nowpayments_webhook),
    path('api/webhooks/stripe/', stripe_webhook),
    # API documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
