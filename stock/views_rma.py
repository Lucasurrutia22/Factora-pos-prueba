import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from stock.models import Producto
from .models_rma import RMAGarantia


# ============================================================================
# API REST RMA / GARANTÍAS
# ============================================================================

@require_http_methods(["GET"])
def listar_rmas(request):
    """Lista todas las RMAs con filtros opcionales"""
    estado = request.GET.get('estado')
    tipo = request.GET.get('tipo')
    busqueda = request.GET.get('busqueda')
    
    rmas = RMAGarantia.objects.all()
    
    if estado:
        rmas = rmas.filter(estado=estado)
    if tipo:
        rmas = rmas.filter(tipo=tipo)
    if busqueda:
        rmas = rmas.filter(
            numero_rma__icontains=busqueda
        ) | rmas.filter(
            nombre_cliente__icontains=busqueda
        )
    
    data = [rma.to_dict() for rma in rmas]
    return JsonResponse(data, safe=False)


@require_http_methods(["POST"])
def crear_rma(request):
    """Crea una nueva RMA"""
    try:
        data = json.loads(request.body)
        
        # Validaciones
        if not data.get('producto_id'):
            return JsonResponse({'error': 'Producto requerido'}, status=400)
        
        producto = get_object_or_404(Producto, id=data.get('producto_id'))
        
        # Generar número RMA
        from datetime import datetime
        fecha_hoy = datetime.now().strftime('%Y%m%d')
        contador = RMAGarantia.objects.filter(
            numero_rma__startswith=f"RMA-{fecha_hoy}"
        ).count()
        numero_rma = f"RMA-{fecha_hoy}-{str(contador + 1).zfill(4)}"
        
        # Crear RMA
        rma = RMAGarantia.objects.create(
            numero_rma=numero_rma,
            producto=producto,
            nombre_cliente=data.get('nombre_cliente'),
            email_cliente=data.get('email_cliente'),
            telefono_cliente=data.get('telefono_cliente'),
            tipo=data.get('tipo', 'DEVOLUCION'),
            cantidad=int(data.get('cantidad', 1)),
            fecha_compra=data.get('fecha_compra'),
            referencia_numero=data.get('referencia_numero', ''),
            descripcion_problema=data.get('descripcion'),
        )
        
        return JsonResponse({
            'id': rma.id,
            'numero_rma': rma.numero_rma,
            'estado': rma.estado,
        }, status=201)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["GET"])
def obtener_rma(request, rma_id):
    """Obtiene detalle de una RMA"""
    rma = get_object_or_404(RMAGarantia, id=rma_id)
    
    data = {
        'id': rma.id,
        'numero_rma': rma.numero_rma,
        'producto': rma.producto.nombre,
        'cliente': rma.nombre_cliente,
        'email': rma.email_cliente,
        'telefono': rma.telefono_cliente,
        'tipo': rma.tipo,
        'cantidad': rma.cantidad,
        'estado': rma.estado,
        'descripcion': rma.descripcion_problema,
        'fecha_compra': rma.fecha_compra.isoformat(),
    }
    
    return JsonResponse(data)


@require_http_methods(["PUT"])
def actualizar_rma(request, rma_id):
    """Actualiza el estado de una RMA"""
    try:
        rma = get_object_or_404(RMAGarantia, id=rma_id)
        data = json.loads(request.body)
        
        if 'estado' in data:
            rma.estado = data['estado']
        
        if 'notas' in data:
            rma.notas_internas = data['notas']
        
        rma.save()
        
        return JsonResponse({
            'id': rma.id,
            'numero_rma': rma.numero_rma,
            'estado': rma.estado,
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["POST"])
def registrar_devolucion(request, rma_id):
    """Registra una devolución y aumenta el stock"""
    try:
        rma = get_object_or_404(RMAGarantia, id=rma_id)
        data = json.loads(request.body)
        
        cantidad = int(data.get('cantidad', rma.cantidad))
        
        # Registrar devolución
        rma.cantidad_devuelta = cantidad
        rma.estado = 'EN_PROCESO'
        
        # Aumentar stock
        rma.producto.stock += cantidad
        rma.producto.save()
        
        rma.save()
        
        return JsonResponse({
            'id': rma.id,
            'numero_rma': rma.numero_rma,
            'cantidad_devuelta': rma.cantidad_devuelta,
            'stock_actualizado': rma.producto.stock,
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["POST"])
def registrar_reemplazo(request, rma_id):
    """Registra un reemplazo de producto"""
    try:
        rma = get_object_or_404(RMAGarantia, id=rma_id)
        data = json.loads(request.body)
        
        producto_reemplazo_id = data.get('producto_reemplazo_id')
        cantidad_reemplazo = int(data.get('cantidad', 1))
        
        producto_reemplazo = get_object_or_404(Producto, id=producto_reemplazo_id)
        
        # Disminuir stock del producto de reemplazo
        if producto_reemplazo.stock < cantidad_reemplazo:
            return JsonResponse({
                'error': f'Stock insuficiente. Disponible: {producto_reemplazo.stock}'
            }, status=400)
        
        producto_reemplazo.stock -= cantidad_reemplazo
        producto_reemplazo.save()
        
        rma.producto_reemplazo = producto_reemplazo
        rma.cantidad_reemplazo = cantidad_reemplazo
        rma.estado = 'COMPLETADA'
        rma.save()
        
        return JsonResponse({
            'id': rma.id,
            'numero_rma': rma.numero_rma,
            'producto_reemplazo': producto_reemplazo.nombre,
            'cantidad_reemplazo': cantidad_reemplazo,
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["GET"])
def estadisticas_rma(request):
    """Retorna estadísticas de RMAs"""
    total = RMAGarantia.objects.count()
    pendientes = RMAGarantia.objects.filter(estado='PENDIENTE').count()
    aceptadas = RMAGarantia.objects.filter(estado='ACEPTADA').count()
    completadas = RMAGarantia.objects.filter(estado='COMPLETADA').count()
    rechazadas = RMAGarantia.objects.filter(estado='RECHAZADA').count()
    
    data = {
        'total': total,
        'pendientes': pendientes,
        'aceptadas': aceptadas,
        'completadas': completadas,
        'rechazadas': rechazadas,
    }
    
    return JsonResponse(data)
