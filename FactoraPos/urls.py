from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import RedirectView
from django.contrib.auth.views import LoginView, LogoutView
from reportes import views as reportes_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Autenticación
    path('accounts/login/', LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('accounts/logout/', LogoutView.as_view(next_page='/'), name='logout'),

    # rutas del sistema
    path('', include('core.urls')),              # index y dashboard
    path('inventario/', include('inventario.urls')),
    path('movimientos/', include('movimientos.urls')),
    path('proveedores/', include('proveedores.urls')),
    path('stock/', include('stock.urls')),
    path('reportes/', include('reportes.urls')),
    path('bodega/', reportes_views.bodega_home, name='bodega'),
    # Favicon (evita 404 en /favicon.ico)
    path('favicon.ico', RedirectView.as_view(url='/static/img/favicon.svg')),
    path('rma/', include('rma.urls')),
    path('usuarios/', include('usuarios.urls')),
    path('ventas/', include('ventas.urls')),
    path('config/', include('config.urls')),
    path('clientes-no-operativos/', include('clientes_no_operativos.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
