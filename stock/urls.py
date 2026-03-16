from django.urls import path
from . import views
from . import views_movimientos
from . import views_rma

app_name = 'stock'

urlpatterns = [
    # Vistas de Producto
    path('', views.ProductListView.as_view(), name='product_list'),
    path('add/', views.ProductCreateView.as_view(), name='product_add'),
    path('<int:pk>/edit/', views.ProductUpdateView.as_view(), name='product_edit'),
    path('<int:pk>/delete/', views.ProductDeleteView.as_view(), name='product_delete'),
    
    # API REST Movimientos de Inventario
    path('api/movimientos/producto-codigo/', views_movimientos.buscar_producto_codigo, name='api_buscar_producto'),
    path('api/movimientos/crear/', views_movimientos.crear_movimiento, name='api_crear_movimiento'),
    path('api/movimientos/listar/', views_movimientos.listar_movimientos, name='api_listar_movimientos'),
    path('api/movimientos/<int:movimiento_id>/', views_movimientos.obtener_movimiento, name='api_obtener_movimiento'),
    path('api/movimientos/<int:movimiento_id>/editar/', views_movimientos.editar_movimiento, name='api_editar_movimiento'),
    path('api/movimientos/<int:movimiento_id>/eliminar/', views_movimientos.eliminar_movimiento, name='api_eliminar_movimiento'),
    
    # API REST Validación de Códigos BX (Scanner 2D)
    path('api/movimientos/validar-codigo-bx/', views_movimientos.validar_codigo_bx, name='api_validar_codigo_bx'),
    path('api/movimientos/historial-codigo-bx/', views_movimientos.obtener_historial_codigo_bx, name='api_historial_codigo_bx'),
    path('api/movimientos/validar-integridad-bx/', views_movimientos.validar_integridad_codigo_bx, name='api_validar_integridad_bx'),
    
    # API REST RMA / Garantías
    path('api/rma/listar/', views_rma.listar_rmas, name='api_listar_rmas'),
    path('api/rma/crear/', views_rma.crear_rma, name='api_crear_rma'),
    path('api/rma/<int:rma_id>/', views_rma.obtener_rma, name='api_obtener_rma'),
    path('api/rma/<int:rma_id>/actualizar/', views_rma.actualizar_rma, name='api_actualizar_rma'),
    path('api/rma/<int:rma_id>/registrar-devolucion/', views_rma.registrar_devolucion, name='api_registrar_devolucion'),
    path('api/rma/<int:rma_id>/registrar-reemplazo/', views_rma.registrar_reemplazo, name='api_registrar_reemplazo'),
    path('api/rma/estadisticas/', views_rma.estadisticas_rma, name='api_estadisticas_rma'),
]
