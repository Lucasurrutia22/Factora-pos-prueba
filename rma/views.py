from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import json

def rma_view(request):
    return render(request, 'rma/RMA.html')

# =============================================
# API REST para RMA
# =============================================

def api_rma_list(request):
    """GET: Obtener todos los RMA"""
    cursor = connection.cursor()
    cursor.execute("""
        SELECT ID_RMA, PRODUCTO, CLIENTE_NOMBRE, EMAIL_CLIENTE, TELEFONO_CLIENTE, 
               TIPO_RMA, FECHA_COMPRA, NUMERO_REFERENCIA, DESCRIPCION_PROBLEMA, 
               ESTADO, FECHA_CREACION, FECHA_RESOLUCION, NOTAS_TECNICAS
        FROM RMA 
        ORDER BY FECHA_CREACION DESC
    """)
    columns = [col[0].lower() for col in cursor.description]
    rmas = [dict(zip(columns, row)) for row in cursor.fetchall()]
    cursor.close()
    return JsonResponse({'success': True, 'data': rmas})

@csrf_exempt
def api_rma_create(request):
    """POST: Crear un nuevo RMA"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        print(f"DEBUG RMA Create: {data}")
        cursor = connection.cursor()
        
        # Desabilitar foreign keys
        cursor.execute("PRAGMA foreign_keys = OFF")
        
        # Obtener siguiente ID
        cursor.execute("SELECT COALESCE(MAX(ID_RMA), 0) + 1 FROM RMA")
        next_id = cursor.fetchone()[0]
        
        # Insertar RMA
        cursor.execute("""
            INSERT INTO RMA (
                ID_RMA, PRODUCTO, CLIENTE_ID, CLIENTE_NOMBRE, EMAIL_CLIENTE, 
                TELEFONO_CLIENTE, TIPO_RMA, FECHA_COMPRA, NUMERO_REFERENCIA, 
                DESCRIPCION_PROBLEMA, ESTADO
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, [
            next_id,
            data.get('producto', ''),
            data.get('cliente_id', None),
            data.get('cliente_nombre', ''),
            data.get('email_cliente', ''),
            data.get('telefono_cliente', ''),
            data.get('tipo_rma', 'Devolución'),
            data.get('fecha_compra', ''),
            data.get('numero_referencia', ''),
            data.get('descripcion_problema', ''),
            'PENDIENTE'
        ])
        
        cursor.execute("PRAGMA foreign_keys = ON")
        connection.commit()
        cursor.close()
        
        return JsonResponse({'success': True, 'id': next_id, 'message': 'RMA creado'})
    except Exception as e:
        print(f"DEBUG Error RMA Create: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
def api_rma_update(request, id):
    """PUT: Actualizar un RMA"""
    if request.method not in ['PUT', 'POST']:
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        cursor = connection.cursor()
        
        cursor.execute("PRAGMA foreign_keys = OFF")
        
        # Actualizar RMA
        updates = []
        values = []
        
        fields = ['PRODUCTO', 'CLIENTE_NOMBRE', 'EMAIL_CLIENTE', 'TELEFONO_CLIENTE', 
                  'TIPO_RMA', 'FECHA_COMPRA', 'NUMERO_REFERENCIA', 'DESCRIPCION_PROBLEMA', 
                  'ESTADO', 'NOTAS_TECNICAS']
        
        for field in fields:
            key = field.lower()
            if key in data:
                updates.append(f"{field} = ?")
                values.append(data[key])
        
        if updates:
            values.append(id)
            sql = f"UPDATE RMA SET {', '.join(updates)} WHERE ID_RMA = ?"
            cursor.execute(sql, values)
        
        cursor.execute("PRAGMA foreign_keys = ON")
        connection.commit()
        cursor.close()
        
        return JsonResponse({'success': True, 'message': 'RMA actualizado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@csrf_exempt
def api_rma_delete(request, id):
    """DELETE: Eliminar un RMA"""
    if request.method not in ['DELETE', 'POST']:
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)
    
    try:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys = OFF")
        cursor.execute("DELETE FROM RMA WHERE ID_RMA = ?", (id,))
        cursor.execute("PRAGMA foreign_keys = ON")
        connection.commit()
        cursor.close()
        
        return JsonResponse({'success': True, 'message': 'RMA eliminado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

