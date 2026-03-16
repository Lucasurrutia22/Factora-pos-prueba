from django.shortcuts import render
from django.views.decorators.http import condition
from stock.models import Producto

def movimientos_view(request):
    """Mostrar dashboard de movimientos de inventario con Scanner 2D"""
    # Obtener contador de productos
    productos_count = Producto.objects.count()
    
    # Obtener usuario o usar "Anónimo"
    usuario = request.user.username if request.user.is_authenticated else "Anónimo"
    
    context = {
        'productos_count': productos_count,
        'usuario': usuario
    }
    
    response = render(request, 'movimientos/Movimientos.html', context)
    
    # Prevenir caching de la página
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, public, max-age=0'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    return response

