from django.contrib import admin
from .models import Producto
from .models_movimientos import MovimientoInventario


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'sku', 'codigo_barra', 'categoria', 'precio', 'cantidad', 'ubicacion')
    search_fields = ('nombre', 'sku', 'codigo_barra', 'categoria')
    list_filter = ('categoria',)
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'categoria')
        }),
        ('Identificación', {
            'fields': ('sku', 'codigo_barra', 'ubicacion')
        }),
        ('Stock y Precio', {
            'fields': ('cantidad', 'precio')
        }),
    )


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto', 'tipo', 'cantidad', 'stock_anterior', 'stock_nuevo', 'usuario', 'fecha')
    list_filter = ('tipo', 'fecha', 'activo')
    search_fields = ('producto__nombre', 'usuario__username', 'motivo')
    readonly_fields = ('stock_anterior', 'stock_nuevo', 'fecha', 'fecha_actualizacion', 'diferencia_stock')
    
    fieldsets = (
        ('Información del Movimiento', {
            'fields': ('producto', 'tipo', 'cantidad', 'usuario')
        }),
        ('Stock', {
            'fields': ('stock_anterior', 'stock_nuevo', 'diferencia_stock')
        }),
        ('Detalles', {
            'fields': ('motivo', 'referencia_externa')
        }),
        ('Auditoría', {
            'fields': ('fecha', 'fecha_actualizacion', 'activo'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Edición
            return self.readonly_fields + ('tipo', 'producto', 'cantidad')
        return self.readonly_fields

