from django.urls import path
from . import views

app_name = 'clientes_no_operativos'

urlpatterns = [
    # Listar clientes no operativos
    path('', views.ClienteNoOperativoListView.as_view(), name='list'),
    
    # Desactivar un cliente (crear registro de no operativo)
    path('desactivar/<int:cliente_id>/', views.DesactivarClienteView.as_view(), name='desactivar'),
    
    # Ver detalle de cliente no operativo
    path('<int:pk>/', views.ClienteNoOperativoDetailView.as_view(), name='detail'),
    
    # Editar información de cliente no operativo
    path('<int:pk>/editar/', views.EditarClienteNoOperativoView.as_view(), name='edit'),
    
    # Reactivar cliente
    path('<int:pk>/reactivar/', views.ReactivarClienteView.as_view(), name='reactivar'),
]
