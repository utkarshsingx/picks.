from django.urls import path

from . import views

urlpatterns = [
    path('', views.sports_list),
    path('bet/', views.place_bet),
    path('bets/', views.sports_bets),
    path('<str:sport_key>/events/', views.events_list),
    path('<str:sport_key>/events/<str:event_id>/odds/', views.event_odds),
]
