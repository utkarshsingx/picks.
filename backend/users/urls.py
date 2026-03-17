from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path('register/', views.register),
    path('login/', views.CustomTokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('verify-email/<str:token>/', views.verify_email),
    path('me/', views.MeView.as_view()),
    path('2fa/enable/', views.two_factor_enable),
    path('2fa/verify/', views.two_factor_verify),
    path('2fa/disable/', views.two_factor_disable),
]
