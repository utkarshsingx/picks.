from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, extend_schema_view

from . import views

TokenRefreshViewExtended = extend_schema_view(
    post=extend_schema(
        tags=['auth'],
        request={'type': 'object', 'properties': {'refresh': {'type': 'string'}}, 'required': ['refresh']},
        responses={200: {'type': 'object', 'properties': {'access': {'type': 'string'}, 'refresh': {'type': 'string'}}}},
    ),
)(TokenRefreshView)

urlpatterns = [
    path('register/', views.register),
    path('login/', views.CustomTokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshViewExtended.as_view()),
    path('verify-email/<str:token>/', views.verify_email),
    path('me/', views.MeView.as_view()),
    path('2fa/enable/', views.two_factor_enable),
    path('2fa/verify/', views.two_factor_verify),
    path('2fa/verify-login/', views.two_factor_verify_login),
    path('2fa/disable/', views.two_factor_disable),
]
