from django.db import models
from django.utils import timezone
from decimal import Decimal

class RMAGarantia(models.Model):
    """Modelo para RMA (Return Merchandise Authorization) y Garantías"""
    
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('ACEPTADA', 'Aceptada'),
        ('RECHAZADA', 'Rechazada'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    TIPO_CHOICES = [
        ('DEVOLUCION', 'Devolución'),
        ('CAMBIO', 'Cambio'),
        ('REPARACION', 'Reparación'),
        ('DEFECTO', 'Defecto de Fábrica'),
        ('GARANTIA', 'Garantía'),
    ]
    
    # Datos básicos
    numero_rma = models.CharField(max_length=20, unique=True)
    producto = models.ForeignKey('stock.Producto', on_delete=models.PROTECT, related_name='rmas')
    
    # Cliente
    nombre_cliente = models.CharField(max_length=255)
    email_cliente = models.EmailField()
    telefono_cliente = models.CharField(max_length=20)
    
    # Detalles del RMA
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    cantidad = models.IntegerField(default=1)
    fecha_compra = models.DateField(null=True, blank=True)
    referencia_numero = models.CharField(max_length=100, blank=True)
    descripcion_problema = models.TextField()
    
    # Datos de devolución
    cantidad_devuelta = models.IntegerField(default=0)
    producto_reemplazo = models.ForeignKey(
        'stock.Producto', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='rmas_reemplazo'
    )
    cantidad_reemplazo = models.IntegerField(default=0)
    
    # Estado
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    notas_internas = models.TextField(blank=True)
    
    # Auditoría
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.numero_rma} - {self.nombre_cliente}"
    
    def marcar_como_devuelto(self):
        """Marca el RMA como devuelto y actualiza el stock"""
        if self.estado in ['ACEPTADA', 'EN_PROCESO']:
            self.estado = 'COMPLETADA'
            # Aumentar stock del producto original
            self.producto.stock += self.cantidad_devuelta
            self.producto.save()
    
    def marcar_como_completada(self):
        """Marca el RMA como completada"""
        self.estado = 'COMPLETADA'
    
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'numero_rma': self.numero_rma,
            'producto': self.producto.nombre,
            'cliente': self.nombre_cliente,
            'tipo': self.tipo,
            'estado': self.estado,
            'fecha_creacion': self.fecha_creacion.isoformat(),
        }
