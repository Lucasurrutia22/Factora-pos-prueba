from django.contrib import admin
from .models import (
    Cliente, Sucursal, Tecnico, Solicitud,
    CoordinacionLogistica, CoordinacionTecnica,
    TipoEquipo, EquipoInstalado, HistorialSolicitud
)


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'pais', 'activo', 'fecha_creacion']
    list_filter = ['activo', 'pais']
    search_fields = ['nombre']


@admin.register(Sucursal)
class SucursalAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'cliente', 'ciudad', 'activo']
    list_filter = ['activo', 'cliente']
    search_fields = ['codigo', 'nombre', 'ciudad']


@admin.register(Tecnico)
class TecnicoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'especialidad', 'telefono', 'activo']
    list_filter = ['activo', 'especialidad']
    search_fields = ['nombre']


class EquipoInstaladoInline(admin.TabularInline):
    model = EquipoInstalado
    extra = 1


class HistorialInline(admin.TabularInline):
    model = HistorialSolicitud
    extra = 0
    readonly_fields = ['usuario', 'accion', 'detalle', 'fecha']
    can_delete = False


@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = ['codigo_solicitud', 'cliente', 'sucursal', 'tipo_solicitud', 
                    'estado', 'status', 'mes', 'anio', 'fecha_creacion']
    list_filter = ['estado', 'status', 'tipo_solicitud', 'mes', 'anio', 'cliente']
    search_fields = ['codigo_solicitud', 'cliente__nombre', 'sucursal__nombre']
    inlines = [EquipoInstaladoInline, HistorialInline]
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']


@admin.register(CoordinacionLogistica)
class CoordinacionLogisticaAdmin(admin.ModelAdmin):
    list_display = ['solicitud', 'fecha_ok_cliente', 'fecha_despacho', 'en_hold']
    list_filter = ['en_hold', 'fecha_despacho']
    search_fields = ['solicitud__codigo_solicitud']


@admin.register(CoordinacionTecnica)
class CoordinacionTecnicaAdmin(admin.ModelAdmin):
    list_display = ['solicitud', 'tecnico', 'fecha_visita', 'fecha_instalacion', 'no_instalada']
    list_filter = ['no_instalada', 'tecnico', 'fecha_instalacion']
    search_fields = ['solicitud__codigo_solicitud', 'tecnico__nombre']


@admin.register(TipoEquipo)
class TipoEquipoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'categoria', 'activo']
    list_filter = ['categoria', 'activo']
    search_fields = ['nombre']


@admin.register(EquipoInstalado)
class EquipoInstaladoAdmin(admin.ModelAdmin):
    list_display = ['solicitud', 'tipo_equipo', 'cantidad', 'version', 
                    'estado', 'fecha_instalacion']
    list_filter = ['estado', 'tipo_equipo__categoria', 'fecha_instalacion']
    search_fields = ['solicitud__codigo_solicitud', 'numero_serie']


@admin.register(HistorialSolicitud)
class HistorialSolicitudAdmin(admin.ModelAdmin):
    list_display = ['solicitud', 'usuario', 'accion', 'fecha']
    list_filter = ['accion', 'fecha']
    search_fields = ['solicitud__codigo_solicitud', 'usuario', 'detalle']
    readonly_fields = ['fecha']
