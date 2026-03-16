from django.urls import path
from . import views

urlpatterns = [
    path('', views.punto_venta_view, name='punto_venta'),
    path('compras/', views.compras_view, name='compras'),
    path('clientes/', views.clientes_view, name='clientes'),
    
    # APIs de Clientes
    path('api/clientes/', views.api_clientes_list, name='api_clientes_list'),
    path('api/clientes/create/', views.api_clientes_create, name='api_clientes_create'),
    path('api/clientes/<int:id>/update/', views.api_clientes_update, name='api_clientes_update'),
    path('api/clientes/<int:id>/delete/', views.api_clientes_delete, name='api_clientes_delete'),
    
    # APIs de Ventas
    path('api/ventas/', views.api_ventas_list, name='api_ventas_list'),
    path('api/ventas/create/', views.api_ventas_create, name='api_ventas_create'),
    
    # APIs de Usuarios
    path('api/usuarios/', views.api_usuarios_list, name='api_usuarios_list'),
    path('api/login/', views.api_login, name='api_login'),
]
