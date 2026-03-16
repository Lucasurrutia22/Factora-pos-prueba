from django.urls import path
from . import views

app_name = 'reportes'

urlpatterns = [
	# Ruta de compatibilidad: muchas plantillas usan {% url 'reportes' %}
	# Redirigimos a `stock:product_list` para evitar NoReverseMatch.
	path('', views.reportes_home, name='reportes'),
    # API para entradas de Bodega (persistencia de entradas manuales)
    path('api/bodega-entries/', views.bodega_entries_list, name='bodega_entries_list'),
	path('api/bodega-entries/<int:pk>/', views.bodega_entry_detail_extended, name='bodega_entry_detail'),
]
