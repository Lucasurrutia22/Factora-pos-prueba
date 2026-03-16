from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Q
from django.db import DatabaseError
import traceback
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import (
    Cliente, Sucursal, Tecnico, Solicitud,
    CoordinacionLogistica, CoordinacionTecnica,
    TipoEquipo, EquipoInstalado, HistorialSolicitud
)

# =============================================
# VISTAS API PARA COORDINACIÓN LOGÍSTICA
# =============================================

@csrf_exempt
def api_solicitudes_list(request):
    """GET: Listar todas las solicitudes con filtros"""
    try:
        # Filtros
        estado = request.GET.get('estado')
        mes = request.GET.get('mes')
        anio = request.GET.get('anio')
        tipo = request.GET.get('tipo')
        cliente_id = request.GET.get('cliente')
        tecnico_id = request.GET.get('tecnico')
        search = request.GET.get('search', '')
        
        try:
            solicitudes = Solicitud.objects.select_related(
                'cliente', 'sucursal'
            ).prefetch_related('equipos__tipo_equipo', 'tecnica', 'logistica').all()
        except DatabaseError as db_err:
            # Log traceback to server output for debugging and fallback to empty queryset
            print('api_solicitudes_list - DatabaseError when building queryset: ', str(db_err))
            traceback.print_exc()
            solicitudes = Solicitud.objects.none()
        
        if estado:
            solicitudes = solicitudes.filter(estado=estado)
        if tipo:
            t = tipo.strip().lower()
            # mapear valores comunes
            mapping = {
                'instalacion': 'INSTALACION',
                'instalación': 'INSTALACION',
                'retiro': 'RETIRO',
                'mantenimiento': 'MANTENIMIENTO',
                'traslado': 'TRASLADO',
                'traslado de equipos': 'TRASLADO'
            }
            mapped = mapping.get(t)
            if mapped:
                # intentar filtro exacto si el valor existe; si no, usar icontains
                try:
                    solicitudes = solicitudes.filter(tipo_solicitud=mapped)
                except Exception:
                    solicitudes = solicitudes.filter(tipo_solicitud__icontains=t)
            else:
                solicitudes = solicitudes.filter(tipo_solicitud__icontains=t)
        if mes:
            solicitudes = solicitudes.filter(mes=int(mes))
        if anio:
            solicitudes = solicitudes.filter(anio=int(anio))
        if cliente_id:
            solicitudes = solicitudes.filter(cliente_id=int(cliente_id))
        if tecnico_id:
            solicitudes = solicitudes.filter(coordinacion_tecnica__tecnico_asignado_id=int(tecnico_id))
        if search:
            solicitudes = solicitudes.filter(numero_solicitud__icontains=search)
        
        data = []
        for s in solicitudes:
            # coordinación técnica/logística (OneToOne en modelos: related_name 'tecnica'/'logistica')
            tecnica = getattr(s, 'tecnica', None)
            logistica = getattr(s, 'logistica', None)

            tecnico_nombre = None
            if tecnica and getattr(tecnica, 'tecnico', None):
                tecnico_nombre = tecnica.tecnico.nombre

            # equipos instalados
            equipos_list = []
            for e in s.equipos.all():
                equipos_list.append({
                    'tipo': e.tipo_equipo.nombre if e.tipo_equipo else '',
                    'categoria': e.tipo_equipo.categoria if e.tipo_equipo else '',
                    'cantidad': e.cantidad,
                    'version': e.version,
                    'numero_serie': e.numero_serie,
                    'estado': e.estado,
                    'observaciones': e.observaciones,
                })

            # intentar leer datos_red si existe en la base; si no, no bloquear el listado
            try:
                datos_red_val = getattr(s, 'datos_red', '') or ''
            except Exception:
                datos_red_val = ''

            data.append({
                'id': s.id,
                'numero_solicitud': getattr(s, 'numero_solicitud', None) or s.codigo_solicitud,
                'cliente_nombre': s.cliente.nombre if s.cliente else '',
                'sucursal_nombre': s.sucursal.nombre if s.sucursal else '',
                'tipo_solicitud': s.tipo_solicitud,
                'tipo_equipo_nombre': None,
                'cantidad_equipos': None,
                'fecha_solicitada': None,
                'estado': s.estado,
                'estado_display': getattr(s, 'estado', ''),
                'tecnico_asignado': tecnico_nombre,
                'prioridad': None,
                'observaciones': s.observaciones or '',
                'fecha_creacion': s.fecha_creacion.isoformat() if hasattr(s, 'fecha_creacion') else None,
                'equipos': equipos_list,
                'datos_red': datos_red_val,
                'coordinacion_tecnica': {
                    'tecnico': tecnico_nombre,
                    'fecha_visita': tecnica.fecha_visita.isoformat() if tecnica and tecnica.fecha_visita else None,
                    'fecha_instalacion': tecnica.fecha_instalacion.isoformat() if tecnica and tecnica.fecha_instalacion else None,
                    'no_instalada': tecnica.no_instalada if tecnica else False,
                    'motivo_no_instalacion': tecnica.motivo_no_instalacion if tecnica else '',
                    'fecha_reprogramada': tecnica.fecha_reprogramada.isoformat() if tecnica and tecnica.fecha_reprogramada else None,
                } if tecnica else None,
                'coordinacion_logistica': {
                    'fecha_ok_cliente': logistica.fecha_ok_cliente.isoformat() if logistica and logistica.fecha_ok_cliente else None,
                    'fecha_despacho': logistica.fecha_despacho.isoformat() if logistica and logistica.fecha_despacho else None,
                } if logistica else None,
            })
        
        return JsonResponse(data, safe=False)
    except DatabaseError as db_e:
        # Si la BD tiene esquema desactualizado (columnas faltantes), evitar 400
        print('api_solicitudes_list - DatabaseError:', str(db_e))
        traceback.print_exc()
        # Devolver lista vacía para que el frontend no rompa mientras se aplican migraciones
        return JsonResponse([], safe=False, status=200)
    except Exception as e:
        # imprimir traza completa para depuración en la salida del servidor
        print('api_solicitudes_list - Exception:', str(e))
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
def api_solicitudes_create(request):
    """POST: Crear nueva solicitud"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        
        # Crear solicitud
        solicitud = Solicitud.objects.create(
            codigo_solicitud=data['codigo_solicitud'],
            cliente_id=data['cliente_id'],
            sucursal_id=data['sucursal_id'],
            tipo_solicitud=data['tipo_solicitud'],
            plataforma=data.get('plataforma', ''),
            mes=data['mes'],
            anio=data['anio'],
            observaciones=data.get('observaciones', ''),
            datos_red=data.get('datos_red', '')
        )
        
        # Crear registros de coordinación automáticamente
        CoordinacionLogistica.objects.create(solicitud=solicitud)
        CoordinacionTecnica.objects.create(solicitud=solicitud)
        
        # Registrar en historial
        HistorialSolicitud.objects.create(
            solicitud=solicitud,
            usuario=request.GET.get('usuario', 'Sistema'),
            accion='Creación',
            detalle=f'Solicitud {solicitud.codigo_solicitud} creada'
        )
        
        return JsonResponse({
            'success': True,
            'id': solicitud.id,
            'message': 'Solicitud creada exitosamente'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
def api_solicitudes_detail(request, id):
    """GET: Obtener detalle completo de una solicitud"""
    try:
        solicitud = Solicitud.objects.select_related(
            'cliente', 'sucursal', 'logistica', 'tecnica', 'tecnica__tecnico'
        ).prefetch_related('equipos', 'historial').get(id=id)
        
        # Construir respuesta completa
        data = {
            'id': solicitud.id,
            'codigo_solicitud': solicitud.codigo_solicitud,
            'cliente': {
                'id': solicitud.cliente.id,
                'nombre': solicitud.cliente.nombre,
                'pais': solicitud.cliente.pais
            },
            'sucursal': {
                'id': solicitud.sucursal.id,
                'nombre': solicitud.sucursal.nombre,
                'codigo': solicitud.sucursal.codigo,
                'direccion': solicitud.sucursal.direccion
            },
            'tipo_solicitud': solicitud.tipo_solicitud,
            'plataforma': solicitud.plataforma,
            'estado': solicitud.estado,
            'status': solicitud.status,
            'mes': solicitud.mes,
            'anio': solicitud.anio,
            'observaciones': solicitud.observaciones,
            'logistica': {
                'fecha_ok_cliente': solicitud.logistica.fecha_ok_cliente.isoformat() if solicitud.logistica.fecha_ok_cliente else None,
                'fecha_despacho': solicitud.logistica.fecha_despacho.isoformat() if solicitud.logistica.fecha_despacho else None,
                'en_hold': solicitud.logistica.en_hold,
                'dias_en_hold': solicitud.logistica.dias_en_hold(),
                'comentarios': solicitud.logistica.comentarios
            } if hasattr(solicitud, 'logistica') else None,
            'tecnica': {
                'tecnico': solicitud.tecnica.tecnico.nombre if solicitud.tecnica.tecnico else None,
                'fecha_visita': solicitud.tecnica.fecha_visita.isoformat() if solicitud.tecnica.fecha_visita else None,
                'fecha_instalacion': solicitud.tecnica.fecha_instalacion.isoformat() if solicitud.tecnica.fecha_instalacion else None,
                'no_instalada': solicitud.tecnica.no_instalada,
                'motivo_no_instalacion': solicitud.tecnica.motivo_no_instalacion,
                'fecha_reprogramada': solicitud.tecnica.fecha_reprogramada.isoformat() if solicitud.tecnica.fecha_reprogramada else None,
                'comentarios': solicitud.tecnica.comentarios
            } if hasattr(solicitud, 'tecnica') else None,
            'equipos': [{
                'tipo': e.tipo_equipo.nombre,
                'categoria': e.tipo_equipo.categoria,
                'cantidad': e.cantidad,
                'version': e.version,
                'estado': e.estado
            } for e in solicitud.equipos.all()],
            'datos_red': getattr(solicitud, 'datos_red', '') or '',
            'historial': [{
                'usuario': h.usuario,
                'accion': h.accion,
                'detalle': h.detalle,
                'fecha': h.fecha.isoformat()
            } for h in solicitud.historial.all()[:10]]  # Últimos 10 registros
        }
        
        return JsonResponse({'success': True, 'data': data})
    except Solicitud.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Solicitud no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
def api_solicitudes_update(request, id):
    """PUT: Actualizar solicitud"""
    if request.method not in ['PUT', 'POST']:
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        solicitud = Solicitud.objects.get(id=id)
        
        # Actualizar campos básicos
        if 'estado' in data:
            old_estado = solicitud.estado
            solicitud.estado = data['estado']
            if old_estado != data['estado']:
                HistorialSolicitud.objects.create(
                    solicitud=solicitud,
                    usuario=request.GET.get('usuario', 'Sistema'),
                    accion='Cambio de estado',
                    detalle=f'Estado cambiado de {old_estado} a {data["estado"]}'
                )
        
        if 'status' in data:
            solicitud.status = data['status']
        if 'observaciones' in data:
            solicitud.observaciones = data['observaciones']
        if 'datos_red' in data:
            solicitud.datos_red = data['datos_red']
        
        solicitud.save()
        
        # Actualizar logística si viene en data
        if 'logistica' in data:
            log = solicitud.logistica
            log_data = data['logistica']
            if 'fecha_ok_cliente' in log_data:
                log.fecha_ok_cliente = log_data['fecha_ok_cliente']
            if 'fecha_despacho' in log_data:
                log.fecha_despacho = log_data['fecha_despacho']
            if 'en_hold' in log_data:
                log.en_hold = log_data['en_hold']
            if 'comentarios' in log_data:
                log.comentarios = log_data['comentarios']
            log.save()
        
        # Actualizar técnica si viene en data
        if 'tecnica' in data:
            tec = solicitud.tecnica
            tec_data = data['tecnica']
            if 'tecnico_id' in tec_data:
                tec.tecnico_id = tec_data['tecnico_id']
            if 'fecha_visita' in tec_data:
                tec.fecha_visita = tec_data['fecha_visita']
            if 'fecha_instalacion' in tec_data:
                tec.fecha_instalacion = tec_data['fecha_instalacion']
            if 'no_instalada' in tec_data:
                tec.no_instalada = bool(tec_data['no_instalada'])
            if 'motivo_no_instalacion' in tec_data:
                tec.motivo_no_instalacion = tec_data['motivo_no_instalacion']
            if 'fecha_reprogramada' in tec_data:
                tec.fecha_reprogramada = tec_data['fecha_reprogramada']
            if 'comentarios' in tec_data:
                tec.comentarios = tec_data['comentarios']
            tec.save()
        
        return JsonResponse({'success': True, 'message': 'Solicitud actualizada'})
    except Solicitud.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Solicitud no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


# =============================================
# APIS DE CATÁLOGOS
# =============================================

def api_clientes_list(request):
    """GET: Listar clientes"""
    clientes = Cliente.objects.filter(activo=True)
    data = [{
        'id': c.id,
        'nombre': c.nombre,
        'pais': c.pais,
        'total_solicitudes': c.solicitudes.count()
    } for c in clientes]
    return JsonResponse(data, safe=False)


@csrf_exempt
def api_clientes_create(request):
    """POST: Crear cliente"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        cliente = Cliente.objects.create(
            nombre=data['nombre'],
            pais=data.get('pais', 'Chile')
        )
        return JsonResponse({'success': True, 'id': cliente.id, 'message': 'Cliente creado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


def api_sucursales_list(request):
    """GET: Listar sucursales (opcionalmente filtradas por cliente)"""
    cliente_id = request.GET.get('cliente')
    sucursales = Sucursal.objects.select_related('cliente').filter(activo=True)
    
    if cliente_id:
        sucursales = sucursales.filter(cliente_id=int(cliente_id))
    
    data = [{
        'id': s.id,
        'codigo': s.codigo,
        'nombre': s.nombre,
        'cliente_id': s.cliente.id,
        'cliente_nombre': s.cliente.nombre,
        'direccion': s.direccion,
        'ciudad': s.ciudad
    } for s in sucursales]
    return JsonResponse(data, safe=False)


@csrf_exempt
def api_sucursales_create(request):
    """POST: Crear sucursal"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        sucursal = Sucursal.objects.create(
            cliente_id=data['cliente_id'],
            codigo=data['codigo'],
            nombre=data['nombre'],
            direccion=data.get('direccion', ''),
            ciudad=data.get('ciudad', ''),
            contacto=data.get('contacto', ''),
            telefono=data.get('telefono', '')
        )
        return JsonResponse({'success': True, 'id': sucursal.id, 'message': 'Sucursal creada'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


def api_tecnicos_list(request):
    """GET: Listar técnicos"""
    tecnicos = Tecnico.objects.filter(activo=True)
    data = [{
        'id': t.id,
        'nombre': t.nombre,
        'especialidad': t.especialidad,
        'telefono': t.telefono,
        'solicitudes_activas': t.asignaciones.filter(solicitud__estado='EN_PROCESO').count()
    } for t in tecnicos]
    return JsonResponse(data, safe=False)


def api_tipos_equipo_list(request):
    """GET: Listar tipos de equipo"""
    tipos = TipoEquipo.objects.filter(activo=True)
    data = [{
        'id': t.id,
        'nombre': t.nombre,
        'categoria': t.categoria,
        'descripcion': t.descripcion or '',
        'requiere_instalacion': t.requiere_instalacion,
    } for t in tipos]
    return JsonResponse(data, safe=False)


# =============================================
# REPORTES Y DASHBOARDS
# =============================================

def api_dashboard_stats(request):
    """GET: Estadísticas para dashboard"""
    try:
        stats = {
            'total_solicitudes': Solicitud.objects.count(),
            'pendientes': Solicitud.objects.filter(estado='PENDIENTE').count(),
            'en_proceso': Solicitud.objects.filter(estado='EN_PROCESO').count(),
            'completadas': Solicitud.objects.filter(estado='COMPLETADA').count(),
            'on_hold': Solicitud.objects.filter(estado='ON_HOLD').count(),
            'canceladas': Solicitud.objects.filter(estado='CANCELADA').count(),
        }
        
        return JsonResponse(stats)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


def api_reporte_mensual(request):
    """GET: Reporte mensual de solicitudes"""
    try:
        mes = int(request.GET.get('mes', timezone.now().month))
        anio = int(request.GET.get('anio', timezone.now().year))
        
        solicitudes = Solicitud.objects.filter(mes=mes, anio=anio).select_related(
            'cliente', 'sucursal'
        )
        
        data = [{
            'codigo': s.codigo_solicitud,
            'cliente': s.cliente.nombre,
            'sucursal': s.sucursal.nombre,
            'tipo': s.tipo_solicitud,
            'estado': s.estado,
            'status': s.status,
            'fecha_creacion': s.fecha_creacion.isoformat()
        } for s in solicitudes]
        
        resumen = {
            'total': len(data),
            'por_estado': {},
            'por_tipo': {},
            'por_cliente': {}
        }
        
        # Agrupar estadísticas
        for s in solicitudes:
            resumen['por_estado'][s.estado] = resumen['por_estado'].get(s.estado, 0) + 1
            resumen['por_tipo'][s.tipo_solicitud] = resumen['por_tipo'].get(s.tipo_solicitud, 0) + 1
            resumen['por_cliente'][s.cliente.nombre] = resumen['por_cliente'].get(s.cliente.nombre, 0) + 1
        
        return JsonResponse({
            'success': True,
            'mes': mes,
            'anio': anio,
            'solicitudes': data,
            'resumen': resumen
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
