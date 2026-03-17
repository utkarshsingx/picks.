from django.urls import path

from . import views

urlpatterns = [
    path('documents/', views.document_list),
    path('status/', views.kyc_status),
]
