from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Producto


class MovimientoInventario(models.Model):
    """Registro de movimientos de inventario con trazabilidad completa"""
    
    TIPO_CHOICES = [
        ('ENTRADA', 'Entrada de stock'),
        ('SALIDA', 'Salida de stock'),
        ('AJUSTE', 'Ajuste de inventario'),
        ('DEVOLUCION', 'Devolución'),
        ('TRANSFERENCIA', 'Transferencia'),
    ]
    
    # Relaciones
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name='movimientos'
    )
    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos_inventario'
    )
    
    # Campos principales
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default='ENTRADA'
    )
    cantidad = models.IntegerField()
    motivo = models.TextField(blank=True)
    
    # Trazabilidad de stock
    stock_anterior = models.IntegerField()
    stock_nuevo = models.IntegerField()
    
    # Auditoría
    fecha = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)  # Para soft delete
    
    # Referencia (opcional)
    referencia_externa = models.CharField(
        max_length=100,
        blank=True,
        help_text="Número de orden de compra, factura, etc."
    )
    
    # Código escaneado (para rastrear el código exacto que se escaneó)
    codigo_escaneado = models.CharField(
        max_length=100,
        blank=True,
        help_text="Código de barra escaneado exacto"
    )
    
    # SKU correlativo (generado automáticamente por movimiento)
    sku_correlativo = models.CharField(
        max_length=50,
        blank=True,
        help_text="SKU correlativo generado (CATEGORIA-NNN)"
    )
    
    class Meta:
        db_table = 'movimientos_inventario'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['producto', '-fecha']),
            models.Index(fields=['tipo', '-fecha']),
            models.Index(fields=['usuario', '-fecha']),
        ]
    
    def __str__(self):
        return f"{self.tipo}: {self.producto.nombre} × {self.cantidad}"
    
    @property
    def diferencia_stock(self):
        """Calcula la diferencia de stock"""
        return self.stock_nuevo - self.stock_anterior
    
    def save(self, *args, **kwargs):
        """Guardar y actualizar stock del producto"""
        if not self.stock_anterior:
            self.stock_anterior = self.producto.cantidad
        
        # Calcular nuevo stock según tipo
        if self.tipo == 'ENTRADA':
            self.stock_nuevo = self.stock_anterior + self.cantidad
        elif self.tipo in ['SALIDA', 'DEVOLUCION']:
            self.stock_nuevo = self.stock_anterior - self.cantidad
        elif self.tipo == 'AJUSTE':
            self.stock_nuevo = self.cantidad
        elif self.tipo == 'TRANSFERENCIA':
            self.stock_nuevo = self.stock_anterior - self.cantidad
        else:
            self.stock_nuevo = self.stock_anterior
        
        # Validar que no quede negativo
        if self.stock_nuevo < 0:
            raise ValueError(f"Stock no puede ser negativo. Stock actual: {self.stock_anterior}, Cantidad: {self.cantidad}")
        
        super().save(*args, **kwargs)
        
        # Actualizar stock del producto
        self.producto.cantidad = self.stock_nuevo
        self.producto.save(update_fields=['cantidad'])
    
    def delete(self, *args, **kwargs):
        """Soft delete con reversión de stock"""
        # Revertir stock del producto
        self.producto.cantidad = self.stock_anterior
        self.producto.save(update_fields=['cantidad'])
        
        # Marcar como inactivo en lugar de borrar
        self.activo = False
        self.save(update_fields=['activo'])
    
    def to_dict(self):
        """Convertir a diccionario JSON"""
        return {
            'id': self.id,
            'producto_id': self.producto.id,
            'producto_nombre': self.producto.nombre,
            'producto_sku': self.producto.sku,
            'tipo': self.tipo,
            'cantidad': self.cantidad,
            'motivo': self.motivo,
            'stock_anterior': self.stock_anterior,
            'stock_nuevo': self.stock_nuevo,
            'diferencia': self.diferencia_stock,
            'usuario': self.usuario.username if self.usuario else 'Sistema',
            'fecha': self.fecha.isoformat(),
            'referencia': self.referencia_externa,
            'activo': self.activo,
        }
