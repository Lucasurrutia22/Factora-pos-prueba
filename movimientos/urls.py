from django.urls import path
from . import views

urlpatterns = [
    path('', views.movimientos_view, name='movimientos'),
]
