from django.urls import path

from . import views

urlpatterns = [
    path('balances/', views.balances),
    path('transactions/', views.transactions),
    path('deposit/crypto/', views.deposit_crypto),
    path('deposit/fiat/', views.deposit_fiat),
    path('withdraw/', views.withdraw),
]
