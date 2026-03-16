from django.urls import path
from . import views
from . import views_coordinacion as coord

urlpatterns = [
    path('', views.inventario_view, name='inventario'),
    path('coordinacion/', views.coordinacion_view, name='coordinacion_logistica'),
    
    # APIs de Productos
    path('api/productos/', views.api_productos_list, name='api_productos_list'),
    path('api/productos/create/', views.api_productos_create, name='api_productos_create'),
    path('api/productos/<int:id>/update/', views.api_productos_update, name='api_productos_update'),
    path('api/productos/<int:id>/delete/', views.api_productos_delete, name='api_productos_delete'),
    
    # APIs de Proveedores
    path('api/proveedores/', views.api_proveedores_list, name='api_proveedores_list'),
    path('api/proveedores/create/', views.api_proveedores_create, name='api_proveedores_create'),
    
    # APIs de Movimientos
    path('api/movimientos/', views.api_movimientos_list, name='api_movimientos_list'),
    path('api/movimientos/create/', views.api_movimientos_create, name='api_movimientos_create'),
    
    # =============================================
    # APIs DE COORDINACIÓN LOGÍSTICA
    # =============================================
    
    # Solicitudes
    path('api/coordinacion/solicitudes/', coord.api_solicitudes_list, name='api_coordinacion_solicitudes_list'),
    path('api/coordinacion/solicitudes/create/', coord.api_solicitudes_create, name='api_coordinacion_solicitudes_create'),
    path('api/coordinacion/solicitudes/<int:id>/', coord.api_solicitudes_detail, name='api_coordinacion_solicitudes_detail'),
    path('api/coordinacion/solicitudes/<int:id>/update/', coord.api_solicitudes_update, name='api_coordinacion_solicitudes_update'),
    
    # Catálogos
    path('api/coordinacion/clientes/', coord.api_clientes_list, name='api_coordinacion_clientes_list'),
    path('api/coordinacion/clientes/create/', coord.api_clientes_create, name='api_coordinacion_clientes_create'),
    path('api/coordinacion/sucursales/', coord.api_sucursales_list, name='api_coordinacion_sucursales_list'),
    path('api/coordinacion/sucursales/create/', coord.api_sucursales_create, name='api_coordinacion_sucursales_create'),
    path('api/coordinacion/tecnicos/', coord.api_tecnicos_list, name='api_coordinacion_tecnicos_list'),
    path('api/coordinacion/tipos-equipo/', coord.api_tipos_equipo_list, name='api_coordinacion_tipos_equipo_list'),
    
    # Reportes y Dashboard
    path('api/coordinacion/dashboard/stats/', coord.api_dashboard_stats, name='api_coordinacion_dashboard_stats'),
    path('api/coordinacion/reportes/mensual/', coord.api_reporte_mensual, name='api_coordinacion_reporte_mensual'),
]
