from django.urls import path
from .views import proveedores_view

app_name = 'proveedores'

urlpatterns = [
    path('', proveedores_view, name='proveedores'),
]

