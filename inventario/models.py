from django.db import models
from django.utils import timezone

# =============================================
# CATÁLOGOS Y CONFIGURACIÓN
# =============================================

class Cliente(models.Model):
    """Clientes que solicitan instalaciones"""
    nombre = models.CharField(max_length=200, unique=True)
    pais = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'clientes'
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.pais})"


class Sucursal(models.Model):
    """Sucursales de los clientes"""
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='sucursales')
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=200)
    direccion = models.TextField(blank=True)
    ciudad = models.CharField(max_length=100, blank=True)
    contacto = models.CharField(max_length=200, blank=True)
    telefono = models.CharField(max_length=50, blank=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'sucursales'
        unique_together = ['cliente', 'codigo']
        ordering = ['cliente', 'nombre']
    
    def __str__(self):
        return f"{self.nombre} - {self.cliente.nombre}"


class Tecnico(models.Model):
    """Técnicos que realizan instalaciones"""
    nombre = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    telefono = models.CharField(max_length=50, blank=True)
    especialidad = models.CharField(max_length=100, blank=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'tecnicos'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


# =============================================
# GESTIÓN DE SOLICITUDES
# =============================================

class Solicitud(models.Model):
    """Solicitud principal de instalación/retiro/piloto"""
    
    TIPO_CHOICES = [
        ('INSTALACION', 'Instalación'),
        ('RETIRO', 'Retiro'),
        ('PILOTO', 'Piloto'),
    ]
    
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
        ('ON_HOLD', 'On Hold'),
    ]
    
    STATUS_CHOICES = [
        ('NUEVA', 'Nueva'),
        ('COORDINANDO_LOGISTICA', 'Coordinando Logística'),
        ('DESPACHADA', 'Despachada'),
        ('AGENDADA', 'Agendada'),
        ('INSTALADA', 'Instalada'),
        ('NO_INSTALADA', 'No Instalada'),
        ('RETIRADA', 'Retirada'),
    ]
    
    # Identificación
    codigo_solicitud = models.CharField(max_length=50, unique=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='solicitudes')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.PROTECT, related_name='solicitudes')
    
    # Tipo y clasificación
    tipo_solicitud = models.CharField(max_length=20, choices=TIPO_CHOICES)
    plataforma = models.CharField(max_length=100, blank=True)
    
    # Estado
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='NUEVA')
    
    # Fechas
    mes = models.IntegerField()
    anio = models.IntegerField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    # Notas generales
    observaciones = models.TextField(blank=True)
    datos_red = models.TextField(blank=True)
    
    class Meta:
        db_table = 'solicitudes'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['codigo_solicitud']),
            models.Index(fields=['estado', 'status']),
            models.Index(fields=['mes', 'anio']),
        ]
    
    def __str__(self):
        return f"{self.codigo_solicitud} - {self.cliente.nombre}"


# =============================================
# COORDINACIÓN LOGÍSTICA
# =============================================

class CoordinacionLogistica(models.Model):
    """Coordinación de despachos y logística"""
    solicitud = models.OneToOneField(Solicitud, on_delete=models.CASCADE, related_name='logistica')
    
    fecha_ok_cliente = models.DateField(null=True, blank=True)
    fecha_despacho = models.DateField(null=True, blank=True)
    
    en_hold = models.BooleanField(default=False)
    fecha_inicio_hold = models.DateField(null=True, blank=True)
    fecha_fin_hold = models.DateField(null=True, blank=True)
    motivo_hold = models.TextField(blank=True)
    
    comentarios = models.TextField(blank=True)
    
    class Meta:
        db_table = 'coordinacion_logistica'
    
    def dias_en_hold(self):
        if not self.en_hold or not self.fecha_inicio_hold:
            return 0
        fecha_fin = self.fecha_fin_hold or timezone.now().date()
        return (fecha_fin - self.fecha_inicio_hold).days


class CoordinacionTecnica(models.Model):
    """Coordinación de visitas técnicas e instalaciones"""
    solicitud = models.OneToOneField(Solicitud, on_delete=models.CASCADE, related_name='tecnica')
    
    tecnico = models.ForeignKey(Tecnico, on_delete=models.SET_NULL, null=True, blank=True, related_name='asignaciones')
    
    fecha_visita = models.DateField(null=True, blank=True)
    horario_visita = models.TimeField(null=True, blank=True)
    fecha_instalacion = models.DateField(null=True, blank=True)
    
    no_instalada = models.BooleanField(default=False)
    motivo_no_instalacion = models.TextField(blank=True)
    fecha_reprogramada = models.DateField(null=True, blank=True)
    
    dias_on_hold_validacion = models.IntegerField(default=0)
    dias_on_hold_instalacion = models.IntegerField(default=0)
    
    comentarios = models.TextField(blank=True)
    
    class Meta:
        db_table = 'coordinacion_tecnica'


class TipoEquipo(models.Model):
    """Catálogo de tipos de equipos"""
    nombre = models.CharField(max_length=100, unique=True)
    categoria = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'tipos_equipo'
        ordering = ['categoria', 'nombre']
    
    def __str__(self):
        return f"{self.categoria} - {self.nombre}"


class EquipoInstalado(models.Model):
    """Equipos instalados en una solicitud"""
    solicitud = models.ForeignKey(Solicitud, on_delete=models.CASCADE, related_name='equipos')
    tipo_equipo = models.ForeignKey(TipoEquipo, on_delete=models.PROTECT)
    
    cantidad = models.IntegerField(default=1)
    version = models.CharField(max_length=50, blank=True)
    numero_serie = models.CharField(max_length=100, blank=True)
    
    estado = models.CharField(max_length=20, choices=[
        ('OPERATIVO', 'Operativo'),
        ('MANTENIMIENTO', 'En Mantenimiento'),
        ('RETIRADO', 'Retirado'),
        ('DEFECTUOSO', 'Defectuoso'),
    ], default='OPERATIVO')
    
    fecha_instalacion = models.DateField(null=True, blank=True)
    fecha_retiro = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    
    class Meta:
        db_table = 'equipos_instalados'
        ordering = ['-fecha_instalacion']


class HistorialSolicitud(models.Model):
    """Registro de cambios en solicitudes para trazabilidad"""
    solicitud = models.ForeignKey(Solicitud, on_delete=models.CASCADE, related_name='historial')
    usuario = models.CharField(max_length=100)
    accion = models.CharField(max_length=100)
    detalle = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'historial_solicitudes'
        ordering = ['-fecha']
