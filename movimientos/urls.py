from django.urls import path
from . import views

app_name = 'movimientos'

urlpatterns = [
    path('', views.movimientos_view, name='movimientos'),
]
