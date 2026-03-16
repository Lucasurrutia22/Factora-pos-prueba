"""
VALIDADOR DE CÓDIGOS BX PARA MOVIMIENTOS DE INVENTARIO
======================================================

Módulo profesional de validación de códigos escaneados (BX) con reglas de negocio
ERP-grade para control de entrada/salida de inventario.

Reglas implementadas:
- Cada código BX solo puede existir una vez como ENTRADA activa
- Bloqueo de duplicidad de códigos en ENTRADA
- Validación automática en SALIDA
- Trazabilidad completa de códigos
"""

from django.db.models import Q
from stock.models_movimientos import MovimientoInventario
from stock.models import Producto


class ValidadorCodigoBX:
    """Validador profesional de códigos BX escaneados"""
    
    # Constantes de estado
    ESTADO_VALIDO = 'VALIDO'
    ESTADO_DUPLICADO_ENTRADA = 'DUPLICADO_ENTRADA'
    ESTADO_NO_EXISTE = 'NO_EXISTE_EN_INVENTARIO'
    ESTADO_VALIDO_SALIDA = 'VALIDO_SALIDA'
    
    @staticmethod
    def validar_codigo_para_movimiento(codigo_bx: str, tipo_movimiento: str, producto_id: int = None) -> dict:
        """
        Valida un código BX antes de registrar un movimiento.
        
        Args:
            codigo_bx: Código escaneado (ej: "BX9M8232")
            tipo_movimiento: "ENTRADA" o "SALIDA"
            producto_id: ID del producto (opcional para búsqueda)
        
        Returns:
            {
                'valido': bool,
                'estado': str,
                'mensaje': str,
                'codigo': str,
                'tipo': str,
                'producto_id': int | None,
                'producto_nombre': str | None,
                'stock_actual': int | None,
                'movimientos_relacionados': list,
                'recomendacion': str
            }
        """
        codigo_bx = codigo_bx.strip().upper()
        tipo_movimiento = tipo_movimiento.strip().upper()
        
        # Validar entrada
        if not codigo_bx:
            return {
                'valido': False,
                'estado': 'ERROR_VALIDACION',
                'mensaje': 'Código BX requerido',
                'codigo': '',
                'tipo': tipo_movimiento
            }
        
        if tipo_movimiento not in ['ENTRADA', 'SALIDA']:
            return {
                'valido': False,
                'estado': 'ERROR_VALIDACION',
                'mensaje': 'Tipo de movimiento debe ser ENTRADA o SALIDA',
                'codigo': codigo_bx,
                'tipo': tipo_movimiento
            }
        
        # ==========================================
        # CASO 1: VALIDAR ENTRADA DE CÓDIGO BX
        # ==========================================
        if tipo_movimiento == 'ENTRADA':
            return ValidadorCodigoBX._validar_entrada(codigo_bx, producto_id)
        
        # ==========================================
        # CASO 2: VALIDAR SALIDA DE CÓDIGO BX
        # ==========================================
        else:  # SALIDA
            return ValidadorCodigoBX._validar_salida(codigo_bx, producto_id)
    
    @staticmethod
    def _validar_entrada(codigo_bx: str, producto_id: int = None) -> dict:
        """
        Valida la ENTRADA de un código BX.
        
        Regla: Cada código BX solo puede existir una vez como ENTRADA activa.
        Si ya existe, se bloquea la entrada.
        """
        
        # Buscar si ya existe este código como ENTRADA activa
        movimiento_existente = MovimientoInventario.objects.filter(
            codigo_escaneado=codigo_bx,
            tipo='ENTRADA',
            activo=True
        ).first()
        
        if movimiento_existente:
            # El código ya fue ingresado como ENTRADA
            return {
                'valido': False,
                'estado': ValidadorCodigoBX.ESTADO_DUPLICADO_ENTRADA,
                'mensaje': f'Este código ya fue ingresado. Solo puede registrarse como SALIDA.',
                'codigo': codigo_bx,
                'tipo': 'ENTRADA',
                'producto_id': movimiento_existente.producto_id,
                'producto_nombre': movimiento_existente.producto.nombre,
                'stock_actual': movimiento_existente.producto.cantidad,
                'movimientos_relacionados': [
                    {
                        'id': movimiento_existente.id,
                        'tipo': movimiento_existente.tipo,
                        'fecha': movimiento_existente.fecha.isoformat(),
                        'usuario': movimiento_existente.usuario.username if movimiento_existente.usuario else 'Sistema'
                    }
                ],
                'recomendacion': 'Selecciona SALIDA si deseas registrar la salida de este código.'
            }
        
        # Código no existe como ENTRADA activa - puede ingresarse
        # Si se proporciona producto_id, validar que exista
        if producto_id:
            try:
                producto = Producto.objects.get(id=producto_id)
                return {
                    'valido': True,
                    'estado': ValidadorCodigoBX.ESTADO_VALIDO,
                    'mensaje': 'Código disponible para ENTRADA',
                    'codigo': codigo_bx,
                    'tipo': 'ENTRADA',
                    'producto_id': producto.id,
                    'producto_nombre': producto.nombre,
                    'stock_actual': producto.cantidad,
                    'movimientos_relacionados': [],
                    'recomendacion': 'Código listo para registrar entrada'
                }
            except Producto.DoesNotExist:
                return {
                    'valido': False,
                    'estado': 'ERROR_PRODUCTO',
                    'mensaje': 'Producto no encontrado',
                    'codigo': codigo_bx,
                    'tipo': 'ENTRADA'
                }
        
        # Sin producto_id - solo confirmar que el código es válido
        return {
            'valido': True,
            'estado': ValidadorCodigoBX.ESTADO_VALIDO,
            'mensaje': 'Código disponible para ENTRADA',
            'codigo': codigo_bx,
            'tipo': 'ENTRADA',
            'producto_id': None,
            'producto_nombre': None,
            'stock_actual': None,
            'movimientos_relacionados': [],
            'recomendacion': 'Selecciona el producto a ingresar'
        }
    
    @staticmethod
    def _validar_salida(codigo_bx: str, producto_id: int = None) -> dict:
        """
        Valida la SALIDA de un código BX.
        
        Regla: El código debe existir en inventario como ENTRADA para poder salir.
        Si no existe, se bloquea la salida.
        """
        
        # Buscar movimientos de ENTRADA de este código (activos, sin reversión)
        movimiento_entrada = MovimientoInventario.objects.filter(
            codigo_escaneado=codigo_bx,
            tipo='ENTRADA',
            activo=True
        ).first()
        
        if not movimiento_entrada:
            # El código NO existe en inventario como ENTRADA
            return {
                'valido': False,
                'estado': ValidadorCodigoBX.ESTADO_NO_EXISTE,
                'mensaje': 'Este código no existe en inventario.',
                'codigo': codigo_bx,
                'tipo': 'SALIDA',
                'producto_id': None,
                'producto_nombre': None,
                'stock_actual': 0,
                'movimientos_relacionados': [],
                'recomendacion': 'El código no ha sido registrado como entrada anteriormente.'
            }
        
        # El código EXISTE como ENTRADA - puede salir
        producto = movimiento_entrada.producto
        
        # Verificar que el producto tenga stock suficiente
        if producto.cantidad <= 0:
            return {
                'valido': False,
                'estado': 'STOCK_INSUFICIENTE',
                'mensaje': f'Stock insuficiente. Stock disponible: 0',
                'codigo': codigo_bx,
                'tipo': 'SALIDA',
                'producto_id': producto.id,
                'producto_nombre': producto.nombre,
                'stock_actual': producto.cantidad,
                'movimientos_relacionados': [
                    {
                        'id': movimiento_entrada.id,
                        'tipo': movimiento_entrada.tipo,
                        'cantidad': movimiento_entrada.cantidad,
                        'fecha': movimiento_entrada.fecha.isoformat(),
                        'usuario': movimiento_entrada.usuario.username if movimiento_entrada.usuario else 'Sistema'
                    }
                ],
                'recomendacion': 'No hay stock disponible para este código.'
            }
        
        # Código válido para SALIDA
        return {
            'valido': True,
            'estado': ValidadorCodigoBX.ESTADO_VALIDO_SALIDA,
            'mensaje': 'Código disponible para SALIDA',
            'codigo': codigo_bx,
            'tipo': 'SALIDA',
            'producto_id': producto.id,
            'producto_nombre': producto.nombre,
            'stock_actual': producto.cantidad,
            'movimientos_relacionados': [
                {
                    'id': movimiento_entrada.id,
                    'tipo': movimiento_entrada.tipo,
                    'cantidad': movimiento_entrada.cantidad,
                    'fecha': movimiento_entrada.fecha.isoformat(),
                    'usuario': movimiento_entrada.usuario.username if movimiento_entrada.usuario else 'Sistema'
                }
            ],
            'recomendacion': 'Código listo para registrar salida'
        }
    
    @staticmethod
    def obtener_historial_codigo(codigo_bx: str) -> dict:
        """
        Obtiene el historial completo de movimientos de un código BX.
        Útil para auditoría y trazabilidad.
        
        Args:
            codigo_bx: Código BX a buscar
        
        Returns:
            {
                'codigo': str,
                'total_movimientos': int,
                'movimientos': [
                    {
                        'id': int,
                        'producto': str,
                        'tipo': str,
                        'cantidad': int,
                        'stock_anterior': int,
                        'stock_nuevo': int,
                        'motivo': str,
                        'usuario': str,
                        'fecha': str,
                        'activo': bool
                    }
                ],
                'status_actual': str,
                'ubicacion_actual': str
            }
        """
        codigo_bx = codigo_bx.strip().upper()
        
        movimientos = MovimientoInventario.objects.filter(
            codigo_escaneado=codigo_bx
        ).order_by('fecha').select_related('producto', 'usuario')
        
        if not movimientos.exists():
            return {
                'codigo': codigo_bx,
                'total_movimientos': 0,
                'movimientos': [],
                'status_actual': 'NO_ENCONTRADO',
                'ubicacion_actual': None,
                'mensaje': 'Ningún movimiento encontrado para este código'
            }
        
        datos_movimientos = []
        for mov in movimientos:
            datos_movimientos.append({
                'id': mov.id,
                'producto': mov.producto.nombre,
                'tipo': mov.tipo,
                'cantidad': mov.cantidad,
                'stock_anterior': mov.stock_anterior,
                'stock_nuevo': mov.stock_nuevo,
                'motivo': mov.motivo,
                'usuario': mov.usuario.username if mov.usuario else 'Sistema',
                'fecha': mov.fecha.isoformat(),
                'activo': mov.activo
            })
        
        # Determinar estado actual del código
        ultimo_mov = movimientos.filter(activo=True).last()
        
        if not ultimo_mov:
            status_actual = 'REVERSADO'
        else:
            status_actual = f'ACTIVO_COMO_{ultimo_mov.tipo}'
        
        ubicacion_actual = ultimo_mov.producto.ubicacion if ultimo_mov else None
        
        return {
            'codigo': codigo_bx,
            'total_movimientos': movimientos.count(),
            'movimientos': datos_movimientos,
            'status_actual': status_actual,
            'ubicacion_actual': ubicacion_actual,
            'producto': ultimo_mov.producto.nombre if ultimo_mov else None,
            'stock_actual': ultimo_mov.producto.cantidad if ultimo_mov else None
        }
    
    @staticmethod
    def validar_integridad_codigo(codigo_bx: str) -> dict:
        """
        Valida la integridad del historial de un código BX.
        Detecta anomalías o inconsistencias en los movimientos.
        
        Returns:
            {
                'codigo': str,
                'es_consistente': bool,
                'anomalias': list,
                'validaciones': {
                    'unica_entrada_activa': bool,
                    'stock_coherente': bool,
                    'secuencia_temporal': bool
                }
            }
        """
        codigo_bx = codigo_bx.strip().upper()
        anomalias = []
        
        movimientos = MovimientoInventario.objects.filter(
            codigo_escaneado=codigo_bx
        ).order_by('fecha').select_related('producto')
        
        # Validación 1: Debe haber exactamente 1 ENTRADA activa o 0 (si fue reversada)
        entradas_activas = movimientos.filter(tipo='ENTRADA', activo=True).count()
        if entradas_activas > 1:
            anomalias.append(f'CRÍTICO: Múltiples ENTRADAS activas encontradas ({entradas_activas})')
        
        # Validación 2: Stock debe ser coherente
        stock_acumulado = 0
        for mov in movimientos:
            if mov.activo:
                if mov.tipo == 'ENTRADA':
                    stock_acumulado += mov.cantidad
                elif mov.tipo == 'SALIDA':
                    stock_acumulado -= mov.cantidad
            else:
                # Revertir si está inactivo
                if mov.tipo == 'ENTRADA':
                    stock_acumulado -= mov.cantidad
                elif mov.tipo == 'SALIDA':
                    stock_acumulado += mov.cantidad
        
        # Obtener el último movimiento activo
        ultimo_mov = movimientos.filter(activo=True).last()
        if ultimo_mov and ultimo_mov.stock_nuevo != stock_acumulado:
            anomalias.append(
                f'ALERTA: Inconsistencia de stock. '
                f'Stock en DB: {ultimo_mov.stock_nuevo}, '
                f'Stock acumulado calculado: {stock_acumulado}'
            )
        
        # Validación 3: Secuencia temporal (sin duplicados de fecha)
        fechas = [mov.fecha for mov in movimientos]
        if len(fechas) != len(set(fechas)):
            anomalias.append('ALERTA: Múltiples movimientos con la misma fecha exacta')
        
        return {
            'codigo': codigo_bx,
            'es_consistente': len(anomalias) == 0,
            'anomalias': anomalias,
            'validaciones': {
                'unica_entrada_activa': entradas_activas <= 1,
                'stock_coherente': not any('Inconsistencia de stock' in a for a in anomalias),
                'secuencia_temporal': len(anomalias) == 0
            },
            'total_movimientos': movimientos.count()
        }
