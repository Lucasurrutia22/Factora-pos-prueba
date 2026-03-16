from django.db import models
import re


class Producto(models.Model):
    nombre = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, blank=True, null=True)
    codigo_barra = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
        help_text="Código de barras para lectura con scanner"
    )
    categoria = models.CharField(max_length=120, blank=True, null=True)
    precio = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cantidad = models.IntegerField(default=0)
    ubicacion = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Ubicación en bodega/almacén"
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return f"{self.nombre} ({self.sku or 'sin SKU'})"
    
    def save(self, *args, **kwargs):
        """Generar SKU automático si no existe"""
        if not self.sku or self.sku.strip() == '':
            # Generar SKU basado en el nombre o categoría
            prefijo = self._obtener_prefijo_sku()
            numero = self._obtener_proximo_numero_sku(prefijo)
            self.sku = f"{prefijo}-{numero:03d}"
        super().save(*args, **kwargs)
    
    def _obtener_prefijo_sku(self):
        """Obtener prefijo para SKU basado en nombre o categoría"""
        if 'TV BOX' in self.nombre.upper():
            return 'TV BOX'
        elif 'TOTEM' in self.nombre.upper():
            return 'TOTEM'
        elif 'TECLADO' in self.nombre.upper():
            return 'TECLADO'
        elif 'MOUSE' in self.nombre.upper():
            return 'MOUSE'
        elif self.categoria:
            return self.categoria.upper().replace(' ', '')[:10]
        else:
            return 'PROD'
    
    @staticmethod
    def _obtener_proximo_numero_sku(prefijo):
        """Obtener el próximo número correlativo para un prefijo de SKU"""
        # Buscar todos los SKU que comiencen con este prefijo
        productos = Producto.objects.filter(sku__startswith=f"{prefijo}-")
        
        numero_maximo = 0
        for p in productos:
            # Extraer el número del SKU (ej: de "TV BOX-001" obtener 1)
            match = re.search(r'-(\d+)$', p.sku or '')
            if match:
                numero = int(match.group(1))
                numero_maximo = max(numero_maximo, numero)
        
        return numero_maximo + 1


# Importar modelo de Movimientos
from .models_movimientos import MovimientoInventario
