"""
API REST para Movimientos de Inventario con soporte Scanner 2D
Endpoints para CRUD de movimientos con trazabilidad completa
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.utils import timezone
from datetime import datetime
import json

from .models import Producto, MovimientoInventario


@require_http_methods(["GET"])
def buscar_producto_codigo(request):
    """
    Buscar producto por código de barra - ACEPTA CUALQUIER CÓDIGO
    GET /api/movimientos/producto-codigo/?codigo=123456789
    
    La búsqueda funciona de la siguiente manera:
    1. Primero intenta encontrar una coincidencia exacta
    2. Si no encuentra, busca por prefijo (primeros caracteres)
    3. Si no encuentra por prefijo, devuelve un PRODUCTO GENÉRICO con el código escaneado
    
    NOTA: Ahora acepta CUALQUIER código de barra, incluso si no existe en la BD.
    Esto permite registrar movimientos de productos nuevos o desconocidos.
    
    Respuesta JSON con datos del producto
    """
    codigo = request.GET.get('codigo', '').strip()
    
    print(f'[DEBUG] Buscando código: {repr(codigo)}')
    
    if not codigo:
        print('[DEBUG] Código vacío')
        return JsonResponse({'error': 'Código requerido'}, status=400)
    
    try:
        print(f'[DEBUG] Intentando búsqueda exacta con codigo_barra={repr(codigo)}')
        # Primero intentar búsqueda exacta
        producto = Producto.objects.get(codigo_barra=codigo)
        print(f'[DEBUG] Encontrado (exacto): {producto.nombre}')
        return JsonResponse({
            'success': True,
            'producto': {
                'id': producto.id,
                'nombre': producto.nombre,
                'codigo_barra': producto.codigo_barra,
                'sku': producto.sku or '',
                'cantidad': producto.cantidad,
                'ubicacion': producto.ubicacion or 'Sin ubicación',
                'precio': float(producto.precio or 0),
                'categoria': producto.categoria or 'General'
            },
            'es_generado': False  # Indica que es un producto real de la BD
        })
    except Producto.DoesNotExist:
        print(f'[DEBUG] Búsqueda exacta sin resultados, intentando búsqueda por prefijo')
        try:
            # Si no hay coincidencia exacta, buscar por prefijo
            # Obtener los primeros caracteres (mínimo 2)
            prefijo = codigo[:3] if len(codigo) >= 3 else codigo
            print(f'[DEBUG] Buscando por prefijo: {repr(prefijo)}')
            
            producto = Producto.objects.filter(codigo_barra__istartswith=prefijo).first()
            
            if producto:
                print(f'[DEBUG] Encontrado (por prefijo): {producto.nombre}')
                return JsonResponse({
                    'success': True,
                    'producto': {
                        'id': producto.id,
                        'nombre': producto.nombre,
                        'codigo_barra': producto.codigo_barra,
                        'sku': producto.sku or '',
                        'cantidad': producto.cantidad,
                        'ubicacion': producto.ubicacion or 'Sin ubicación',
                        'precio': float(producto.precio or 0),
                        'categoria': producto.categoria or 'General'
                    },
                    'es_generado': False  # Indica que es un producto real de la BD
                })
            else:
                # ✅ CAMBIO: Si no encuentra, devolver PRODUCTO GENÉRICO en lugar de error
                print(f'[DEBUG] Producto no encontrado, creando producto genérico para código: {repr(codigo)}')
                
                return JsonResponse({
                    'success': True,
                    'producto': {
                        'id': None,  # Sin ID en base de datos
                        'nombre': f'Producto - {codigo}',  # Nombre genérico con el código
                        'codigo_barra': codigo,  # El código escaneado
                        'sku': codigo,  # Usar el código como SKU temporal
                        'cantidad': 0,  # Sin cantidad catalogada
                        'ubicacion': 'Por ubicar',  # Ubicación genérica
                        'precio': 0.0,  # Sin precio
                        'categoria': 'Sin categoría'  # Sin categoría
                    },
                    'es_generado': True,  # Indica que es un producto generado temporalmente
                    'es_nuevo': True  # Indica que el código no existía en la BD
                })
        except Exception as e:
            print(f'[DEBUG] Error en búsqueda por prefijo: {str(e)}')
            return JsonResponse({'error': str(e)}, status=500)
    except Exception as e:
        print(f'[DEBUG] Error: {str(e)}')
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def crear_movimiento(request):
    """
    Crear nuevo movimiento de inventario
    POST /api/movimientos/crear/
    
    Body JSON:
    {
        "producto_id": 1,
        "tipo": "ENTRADA|SALIDA|AJUSTE|DEVOLUCION|TRANSFERENCIA",
        "cantidad": 50,
        "motivo": "Compra a proveedor XYZ",
        "referencia_externa": "PO-2024-001",
        "ubicacion": "Bodega A",
        "categoria": "Equipos"
    }
    """
    try:
        datos = json.loads(request.body)
        
        # Validar campos requeridos
        producto_id = datos.get('producto_id')
        tipo = datos.get('tipo', 'ENTRADA').upper()
        cantidad = int(datos.get('cantidad', 0))
        motivo = datos.get('motivo', '').strip()
        referencia = datos.get('referencia_externa', '').strip()
        ubicacion = datos.get('ubicacion', '').strip()
        categoria = datos.get('categoria', '').strip()
        codigo_escaneado = datos.get('codigo_escaneado', '').strip()
        
        # Validar cantidad
        if cantidad <= 0:
            return JsonResponse({'error': 'Cantidad debe ser mayor a 0'}, status=400)
        
        # Validar tipo
        tipos_validos = ['ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION', 'TRANSFERENCIA']
        if tipo not in tipos_validos:
            return JsonResponse({'error': f'Tipo inválido. Debe ser: {", ".join(tipos_validos)}'}, status=400)
        
        # Buscar producto
        try:
            producto = Producto.objects.get(id=producto_id)
        except Producto.DoesNotExist:
            return JsonResponse({'error': 'Producto no encontrado'}, status=404)
        
        # Actualizar ubicación y categoría del producto si fueron proporcionadas
        if ubicacion:
            producto.ubicacion = ubicacion
        if categoria:
            producto.categoria = categoria
        producto.save()
        
        # Validar stock para salidas
        if tipo in ['SALIDA', 'DEVOLUCION'] and producto.cantidad < cantidad:
            return JsonResponse({
                'error': f'Stock insuficiente. Stock actual: {producto.cantidad}',
                'stock_actual': producto.cantidad
            }, status=400)
        
        # Crear movimiento
        # Usar None para usuarios anónimos (el campo usuario permite null=True)
        usuario = request.user if request.user.is_authenticated else None
        
        # Generar SKU correlativo basado en el nombre del producto o su SKU
        # Prioridad: nombre del producto > SKU del producto > categoría
        if producto.nombre:
            # Usar primeras letras del nombre del producto, eliminando espacios
            sku_base = producto.nombre.upper().replace(' ', '')[:15]
        elif producto.sku:
            # Usar el SKU del producto
            sku_base = producto.sku.upper().replace(' ', '')[:15]
        else:
            # Usar la categoría como último recurso
            sku_base = (producto.categoria or 'SKU').upper().replace(' ', '')[:10]
        
        # Contar movimientos previos de este producto para generar el número correlativo
        movimientos_previos = MovimientoInventario.objects.filter(
            producto=producto,
            activo=True
        ).count()
        
        # El número correlativo es la cantidad de movimientos previos + 1
        numero_correlativo = movimientos_previos + 1
        sku_correlativo = f"{sku_base}-{numero_correlativo:03d}"
        
        movimiento = MovimientoInventario(
            producto=producto,
            usuario=usuario,
            tipo=tipo,
            cantidad=cantidad,
            motivo=motivo,
            referencia_externa=referencia,
            codigo_escaneado=codigo_escaneado,
            sku_correlativo=sku_correlativo,
            stock_anterior=producto.cantidad
        )
        
        # save() calcula automáticamente stock_nuevo y actualiza producto
        movimiento.save()
        
        return JsonResponse({
            'success': True,
            'movimiento': {
                'id': movimiento.id,
                'producto': producto.nombre,
                'tipo': movimiento.tipo,
                'cantidad': movimiento.cantidad,
                'stock_anterior': movimiento.stock_anterior,
                'stock_nuevo': movimiento.stock_nuevo,
                'fecha': movimiento.fecha.isoformat(),
                'usuario': request.user.username
            }
        }, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def listar_movimientos(request):
    """
    Listar movimientos con filtros opcionales
    GET /api/movimientos/listar/
    
    Parámetros opcionales:
    ?tipo=ENTRADA
    ?codigo=BX9M8232 (búsqueda por código o código_escaneado)
    ?producto_id=1
    ?usuario_id=2
    ?fecha_desde=2024-01-01
    ?fecha_hasta=2024-12-31
    ?activo=true|false
    ?limit=50&offset=0
    """
    try:
        # Filtros opcionales
        tipo = request.GET.get('tipo', '').upper()
        codigo = request.GET.get('codigo', '').strip()
        producto_id = request.GET.get('producto_id')
        usuario_id = request.GET.get('usuario_id')
        fecha_desde = request.GET.get('fecha_desde')
        fecha_hasta = request.GET.get('fecha_hasta')
        activo = request.GET.get('activo', 'true').lower() == 'true'
        limit = int(request.GET.get('limit', 50))
        offset = int(request.GET.get('offset', 0))
        
        # Query base
        movimientos = MovimientoInventario.objects.filter(activo=activo).order_by('-fecha')
        
        # Aplicar filtros
        if tipo:
            movimientos = movimientos.filter(tipo=tipo)
        if codigo:
            # Buscar en código escaneado o código de producto
            from django.db.models import Q
            movimientos = movimientos.filter(
                Q(codigo_escaneado__icontains=codigo) | 
                Q(producto__codigo_barra__icontains=codigo)
            )
        if producto_id:
            movimientos = movimientos.filter(producto_id=producto_id)
        if usuario_id:
            movimientos = movimientos.filter(usuario_id=usuario_id)
        if fecha_desde:
            fecha_desde_dt = datetime.fromisoformat(fecha_desde)
            movimientos = movimientos.filter(fecha__gte=fecha_desde_dt)
        if fecha_hasta:
            fecha_hasta_dt = datetime.fromisoformat(fecha_hasta)
            movimientos = movimientos.filter(fecha__lte=fecha_hasta_dt)
        
        # Total de registros
        total = movimientos.count()
        
        # Paginación
        movimientos_page = movimientos[offset:offset + limit]
        
        # Serializar
        data = []
        for mov in movimientos_page:
            data.append({
                'id': mov.id,
                'producto': {
                    'id': mov.producto.id,
                    'nombre': mov.producto.nombre,
                    'codigo_barra': mov.producto.codigo_barra,
                    'sku': mov.producto.sku,
                    'ubicacion': mov.producto.ubicacion,
                    'categoria': mov.producto.categoria
                },
                'tipo': mov.tipo,
                'cantidad': mov.cantidad,
                'stock_anterior': mov.stock_anterior,
                'stock_nuevo': mov.stock_nuevo,
                'motivo': mov.motivo,
                'referencia_externa': mov.referencia_externa,
                'codigo_escaneado': mov.codigo_escaneado,
                'sku_correlativo': mov.sku_correlativo,
                'usuario': mov.usuario.username if mov.usuario else 'Sistema',
                'fecha': mov.fecha.isoformat(),
                'fecha_actualizacion': mov.fecha_actualizacion.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'total': total,
            'limit': limit,
            'offset': offset,
            'movimientos': data
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def obtener_movimiento(request, movimiento_id):
    """
    Obtener detalles de un movimiento específico
    GET /api/movimientos/<id>/
    """
    try:
        movimiento = MovimientoInventario.objects.get(id=movimiento_id)
        
        return JsonResponse({
            'success': True,
            'movimiento': {
                'id': movimiento.id,
                'producto': {
                    'id': movimiento.producto.id,
                    'nombre': movimiento.producto.nombre,
                    'codigo_barra': movimiento.producto.codigo_barra,
                    'sku': movimiento.producto.sku,
                    'ubicacion': movimiento.producto.ubicacion,
                    'categoria': movimiento.producto.categoria
                },
                'tipo': movimiento.tipo,
                'cantidad': movimiento.cantidad,
                'stock_anterior': movimiento.stock_anterior,
                'stock_nuevo': movimiento.stock_nuevo,
                'motivo': movimiento.motivo,
                'referencia_externa': movimiento.referencia_externa,
                'codigo_escaneado': movimiento.codigo_escaneado,
                'sku_correlativo': movimiento.sku_correlativo,
                'usuario': movimiento.usuario.username if movimiento.usuario else 'Sistema',
                'fecha': movimiento.fecha.isoformat(),
                'fecha_actualizacion': movimiento.fecha_actualizacion.isoformat(),
                'activo': movimiento.activo
            }
        })
    
    except MovimientoInventario.DoesNotExist:
        return JsonResponse({'error': 'Movimiento no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def editar_movimiento(request, movimiento_id):
    """
    Editar movimiento (solo mismo día, solo Admin)
    PUT /api/movimientos/<id>/editar/
    
    Body JSON (campos opcionales):
    {
        "cantidad": 60,
        "motivo": "Ajuste de cantidad",
        "referencia_externa": "PO-2024-001-AJUSTE"
    }
    """
    try:
        movimiento = MovimientoInventario.objects.get(id=movimiento_id)
        
        # Parsear datos
        datos = json.loads(request.body)
        
        cantidad_nueva = datos.get('cantidad')
        motivo = datos.get('motivo')
        referencia = datos.get('referencia_externa')
        ubicacion = datos.get('ubicacion')
        categoria = datos.get('categoria')
        
        # Si cambia la cantidad, validar stock
        if cantidad_nueva and cantidad_nueva != movimiento.cantidad:
            cantidad_nueva = int(cantidad_nueva)
            if cantidad_nueva <= 0:
                return JsonResponse({'error': 'Cantidad debe ser mayor a 0'}, status=400)
            
            # Revertir stock antiguo
            producto = movimiento.producto
            if movimiento.tipo == 'ENTRADA':
                producto.cantidad -= movimiento.cantidad
            elif movimiento.tipo == 'SALIDA':
                producto.cantidad += movimiento.cantidad
            elif movimiento.tipo == 'DEVOLUCION':
                producto.cantidad -= movimiento.cantidad
            
            # Validar stock suficiente para nuevas salidas
            if movimiento.tipo in ['SALIDA', 'DEVOLUCION'] and producto.cantidad < cantidad_nueva:
                producto.save()
                return JsonResponse({
                    'error': f'Stock insuficiente para nueva cantidad. Stock disponible: {producto.cantidad}'
                }, status=400)
            
            # Aplicar nueva cantidad
            if movimiento.tipo == 'ENTRADA':
                producto.cantidad += cantidad_nueva
            elif movimiento.tipo == 'SALIDA':
                producto.cantidad -= cantidad_nueva
            elif movimiento.tipo == 'DEVOLUCION':
                producto.cantidad += cantidad_nueva
            
            movimiento.cantidad = cantidad_nueva
            movimiento.stock_nuevo = producto.cantidad
            producto.save()
        
        # Actualizar campos
        if motivo is not None:
            movimiento.motivo = motivo
        if referencia is not None:
            movimiento.referencia_externa = referencia
        
        # Actualizar ubicación y categoría del producto si se proporcionan
        if ubicacion:
            movimiento.producto.ubicacion = ubicacion
        if categoria:
            movimiento.producto.categoria = categoria
        
        movimiento.fecha_actualizacion = timezone.now()
        movimiento.save()
        movimiento.producto.save()
        
        return JsonResponse({
            'success': True,
            'mensaje': 'Movimiento actualizado correctamente',
            'movimiento': {
                'id': movimiento.id,
                'cantidad': movimiento.cantidad,
                'stock_nuevo': movimiento.stock_nuevo,
                'fecha_actualizacion': movimiento.fecha_actualizacion.isoformat()
            }
        })
    
    except MovimientoInventario.DoesNotExist:
        return JsonResponse({'error': 'Movimiento no encontrado'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def eliminar_movimiento(request, movimiento_id):
    """
    Eliminar movimiento (soft delete, revertir stock)
    DELETE /api/movimientos/<id>/eliminar/
    """
    try:
        movimiento = MovimientoInventario.objects.get(id=movimiento_id, activo=True)
        
        # Revertir stock del producto
        producto = movimiento.producto
        if movimiento.tipo == 'ENTRADA':
            producto.cantidad -= movimiento.cantidad
        elif movimiento.tipo == 'SALIDA':
            producto.cantidad += movimiento.cantidad
        elif movimiento.tipo == 'DEVOLUCION':
            producto.cantidad -= movimiento.cantidad
        elif movimiento.tipo == 'AJUSTE':
            diferencia = movimiento.stock_nuevo - movimiento.stock_anterior
            producto.cantidad -= diferencia
        elif movimiento.tipo == 'TRANSFERENCIA':
            producto.cantidad += movimiento.cantidad
        
        # Validar que cantidad no sea negativa
        if producto.cantidad < 0:
            return JsonResponse({
                'error': f'No se puede eliminar. Stock no puede ser negativo. Sería: {producto.cantidad}',
                'stock_actual': producto.cantidad
            }, status=400)
        
        producto.save()
        
        # Realizar soft delete
        movimiento.activo = False
        movimiento.save()
        
        return JsonResponse({
            'success': True,
            'mensaje': 'Movimiento eliminado. Stock revertido.',
            'stock_nueva': producto.cantidad
        })
    
    except MovimientoInventario.DoesNotExist:
        return JsonResponse({'error': 'Movimiento no encontrado o ya eliminado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ============================================================================
# ENDPOINTS PARA VALIDACIÓN DE CÓDIGOS BX - CONTROL DE ENTRADA/SALIDA
# ============================================================================

@require_http_methods(["POST"])
def validar_codigo_bx(request):
    """
    Endpoint de validación de código BX ANTES de registrar movimiento.
    
    Implementa reglas ERP-grade de control de códigos escaneados:
    - ENTRADA: Solo permite si código no existe como ENTRADA activa
    - SALIDA: Solo permite si código existe como ENTRADA activa
    
    POST /api/movimientos/validar-codigo-bx/
    
    Body JSON:
    {
        "codigo": "BX9M8232",
        "tipo": "ENTRADA|SALIDA",
        "producto_id": 1 (opcional)
    }
    
    Response:
    {
        "valido": true|false,
        "estado": "VALIDO|DUPLICADO_ENTRADA|NO_EXISTE_EN_INVENTARIO|ERROR_VALIDACION",
        "mensaje": "Descripción del estado",
        "codigo": "BX9M8232",
        "tipo": "ENTRADA|SALIDA",
        "producto_id": 1,
        "producto_nombre": "Nombre del Producto",
        "stock_actual": 50,
        "movimientos_relacionados": [],
        "recomendacion": "Acción recomendada"
    }
    """
    try:
        datos = json.loads(request.body)
        
        codigo_bx = datos.get('codigo', '').strip()
        tipo_movimiento = datos.get('tipo', '').strip().upper()
        producto_id = datos.get('producto_id')
        
        if not codigo_bx or not tipo_movimiento:
            return JsonResponse({
                'valido': False,
                'estado': 'ERROR_VALIDACION',
                'mensaje': 'Código y tipo de movimiento son requeridos'
            }, status=400)
        
        # Importar el validador
        from stock.validators import ValidadorCodigoBX
        
        # Ejecutar validación
        resultado = ValidadorCodigoBX.validar_codigo_para_movimiento(
            codigo_bx=codigo_bx,
            tipo_movimiento=tipo_movimiento,
            producto_id=producto_id
        )
        
        # Determinar status HTTP
        status_code = 200 if resultado['valido'] else 400
        
        return JsonResponse(resultado, status=status_code)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'valido': False,
            'estado': 'ERROR_JSON',
            'mensaje': 'JSON inválido'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'valido': False,
            'estado': 'ERROR_SERVIDOR',
            'mensaje': str(e)
        }, status=500)


@require_http_methods(["GET"])
def obtener_historial_codigo_bx(request):
    """
    Obtiene historial completo de un código BX.
    Útil para auditoría y trazabilidad.
    
    GET /api/movimientos/historial-codigo-bx/?codigo=BX9M8232
    
    Response:
    {
        "codigo": "BX9M8232",
        "total_movimientos": 3,
        "status_actual": "ACTIVO_COMO_ENTRADA",
        "producto": "Nombre Producto",
        "stock_actual": 50,
        "ubicacion_actual": "Bodega A",
        "movimientos": [
            {
                "id": 1,
                "tipo": "ENTRADA",
                "cantidad": 100,
                "stock_anterior": 0,
                "stock_nuevo": 100,
                "fecha": "2024-01-22T10:00:00Z",
                "usuario": "admin"
            }
        ]
    }
    """
    try:
        codigo_bx = request.GET.get('codigo', '').strip()
        
        if not codigo_bx:
            return JsonResponse({
                'error': 'Parámetro codigo requerido'
            }, status=400)
        
        from stock.validators import ValidadorCodigoBX
        
        resultado = ValidadorCodigoBX.obtener_historial_codigo(codigo_bx)
        
        return JsonResponse(resultado, status=200)
    
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)


@require_http_methods(["GET"])
def validar_integridad_codigo_bx(request):
    """
    Valida integridad del historial de un código BX.
    Detecta anomalías o inconsistencias.
    
    GET /api/movimientos/validar-integridad-bx/?codigo=BX9M8232
    
    Response:
    {
        "codigo": "BX9M8232",
        "es_consistente": true,
        "anomalias": [],
        "validaciones": {
            "unica_entrada_activa": true,
            "stock_coherente": true,
            "secuencia_temporal": true
        },
        "total_movimientos": 3
    }
    """
    try:
        codigo_bx = request.GET.get('codigo', '').strip()
        
        if not codigo_bx:
            return JsonResponse({
                'error': 'Parámetro codigo requerido'
            }, status=400)
        
        from stock.validators import ValidadorCodigoBX
        
        resultado = ValidadorCodigoBX.validar_integridad_codigo(codigo_bx)
        
        return JsonResponse(resultado, status=200)
    
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)
