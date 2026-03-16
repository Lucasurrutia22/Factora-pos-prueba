"""
Reportes views stub — reportes module removed from project.
This file intentionally exposes only a deprecation response for any former endpoints.
"""

from django.http import JsonResponse
from django.shortcuts import redirect
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

from .models import BodegaEntry
from django.contrib.auth.decorators import login_required


def removed_view(request, *args, **kwargs):
    return JsonResponse({'success': False, 'error': 'Reportes module removed'}, status=410)


# Backwards-compatible names mapping
kardex_api = removed_view
reportes_view = removed_view
solicitudes_api = removed_view


def reportes_home(request):
    """Compatibilidad: redirige a la vista principal de `stock`.

    Las plantillas del proyecto todavía esperan la URL llamada 'reportes',
    así que exponemos una ruta que redirige al listado de productos.
    """
    return redirect('stock:product_list')


def bodega_home(request):
    """Vista para la sección 'Bodega'. Renderiza la plantilla de reportes
    (se reutiliza `reportes/reportes.html` que ya contiene el módulo Bodega
    en `static/js/Bodega.js`).
    """
    return render(request, 'reportes/reportes.html')


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def bodega_entries_list(request):
    if request.method == 'GET':
        qs = BodegaEntry.objects.all()
        data = [e.as_dict() for e in qs]
        return JsonResponse({'success': True, 'results': data})

    # POST: crear
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        payload = request.POST.dict()

    categoria = payload.get('categoria')
    nombre = payload.get('nombre')
    valor = payload.get('valor')
    try:
        valor = float(valor)
    except Exception:
        valor = 0

    entry = BodegaEntry.objects.create(
        categoria=categoria or 'equipos',
        nombre=nombre or '',
        valor=valor,
        created_by=request.user if request.user.is_authenticated else None
    )

    return JsonResponse({'success': True, 'result': entry.as_dict()}, status=201)


@csrf_exempt
@require_http_methods(['DELETE'])
def bodega_entry_detail(request, pk):
    try:
        entry = BodegaEntry.objects.get(pk=pk)
    except BodegaEntry.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'not found'}, status=404)

    # Permitir borrado por quien lo creó o por staff
    if entry.created_by and request.user.is_authenticated and (request.user == entry.created_by or request.user.is_staff):
        entry.delete()
        return JsonResponse({'success': True})
    # Si el entry no tiene created_by (legacy) y el usuario es staff, permitir
    if not entry.created_by and request.user.is_authenticated and request.user.is_staff:
        entry.delete()
        return JsonResponse({'success': True})

    return JsonResponse({'success': False, 'error': 'forbidden'}, status=403)


@csrf_exempt
@require_http_methods(['GET', 'PUT', 'PATCH', 'DELETE'])
def bodega_entry_detail_extended(request, pk):
    """Endpoint extendido que permite GET y actualizaciones (PUT/PATCH) además de DELETE.
    Mantener compatibilidad con `bodega_entry_detail` que ya estaba enlazado en urls.
    """
    try:
        entry = BodegaEntry.objects.get(pk=pk)
    except BodegaEntry.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse({'success': True, 'result': entry.as_dict()})

    if request.method in ('PUT', 'PATCH'):
        # aceptar JSON en body
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            payload = request.POST.dict()

        nombre = payload.get('nombre') or payload.get('name')
        categoria = payload.get('categoria') or payload.get('category')
        valor = payload.get('valor') or payload.get('value')
        try:
            if valor is not None:
                entry.valor = float(valor)
        except Exception:
            pass
        if nombre is not None:
            entry.nombre = nombre
        if categoria is not None:
            entry.categoria = categoria
        entry.save()
        return JsonResponse({'success': True, 'result': entry.as_dict()})

    # DELETE: reutilizar la misma lógica de permisos que antes
    if entry.created_by and request.user.is_authenticated and (request.user == entry.created_by or request.user.is_staff):
        entry.delete()
        return JsonResponse({'success': True})
    if not entry.created_by and request.user.is_authenticated and request.user.is_staff:
        entry.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'forbidden'}, status=403)
