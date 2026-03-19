from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    path('', views.usuarios_view, name='usuarios'),
    path('config/', views.config_view, name='config_usuarios'),
]
