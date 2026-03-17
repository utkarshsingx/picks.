from django.urls import path
from . import views

urlpatterns = [
    path('messages/', views.chat_messages_view),
]
