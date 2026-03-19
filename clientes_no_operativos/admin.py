from django.contrib import admin
from .models import ClienteNoOperativo


@admin.register(ClienteNoOperativo)
class ClienteNoOperativoAdmin(admin.ModelAdmin):
    """
    Administrador para clientes no operativos.
    """
    list_display = ('cliente', 'fecha_desactivacion', 'dias_inactivo', 'motivo_desactivacion')
    list_filter = ('fecha_desactivacion', 'cliente__pais')
    search_fields = ('cliente__nombre', 'motivo_desactivacion', 'observaciones')
    readonly_fields = ('fecha_desactivacion', 'dias_inactivo')
    fieldsets = (
        ('Información del Cliente', {
            'fields': ('cliente',)
        }),
        ('Desactivación', {
            'fields': ('fecha_desactivacion', 'dias_inactivo', 'motivo_desactivacion', 'observaciones')
        }),
    )

    def dias_inactivo(self, obj):
        return f"{obj.dias_inactivo} días"
    dias_inactivo.short_description = "Días inactivo"
