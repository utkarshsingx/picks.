from django.urls import path

from . import views

urlpatterns = [
    path('dice/bet/', views.dice_bet),
    path('mines/start/', views.mines_start),
    path('mines/reveal/', views.mines_reveal),
    path('mines/cashout/', views.mines_cashout),
    path('plinko/bet/', views.plinko_bet),
    path('crash/bet/', views.crash_bet),
    path('crash/cashout/', views.crash_cashout),
    path('crash/rounds/', views.crash_rounds),
    path('crash/rounds/<uuid:round_id>/', views.crash_round_detail),
    path('bets/', views.bet_list),
]
