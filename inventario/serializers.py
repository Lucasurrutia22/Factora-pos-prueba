# Serializers para API REST
from rest_framework import serializers
from .models import (
    Cliente, Sucursal, Tecnico, Solicitud, 
    CoordinacionLogistica, CoordinacionTecnica,
    TipoEquipo, EquipoInstalado, HistorialSolicitud
)


class ClienteSerializer(serializers.ModelSerializer):
    total_solicitudes = serializers.SerializerMethodField()
    
    class Meta:
        model = Cliente
        fields = '__all__'
    
    def get_total_solicitudes(self, obj):
        return obj.solicitudes.count()


class SucursalSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    
    class Meta:
        model = Sucursal
        fields = '__all__'


class TecnicoSerializer(serializers.ModelSerializer):
    solicitudes_asignadas = serializers.SerializerMethodField()
    
    class Meta:
        model = Tecnico
        fields = '__all__'
    
    def get_solicitudes_asignadas(self, obj):
        return obj.asignaciones.filter(solicitud__estado='EN_PROCESO').count()


class CoordinacionLogisticaSerializer(serializers.ModelSerializer):
    dias_hold = serializers.SerializerMethodField()
    
    class Meta:
        model = CoordinacionLogistica
        fields = '__all__'
    
    def get_dias_hold(self, obj):
        return obj.dias_en_hold()


class CoordinacionTecnicaSerializer(serializers.ModelSerializer):
    tecnico_nombre = serializers.CharField(source='tecnico.nombre', read_only=True)
    
    class Meta:
        model = CoordinacionTecnica
        fields = '__all__'


class TipoEquipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoEquipo
        fields = '__all__'


class EquipoInstaladoSerializer(serializers.ModelSerializer):
    tipo_equipo_nombre = serializers.CharField(source='tipo_equipo.nombre', read_only=True)
    categoria = serializers.CharField(source='tipo_equipo.categoria', read_only=True)
    
    class Meta:
        model = EquipoInstalado
        fields = '__all__'


class HistorialSolicitudSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialSolicitud
        fields = '__all__'


class SolicitudListSerializer(serializers.ModelSerializer):
    """Serializer ligero para listado"""
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)
    
    class Meta:
        model = Solicitud
        fields = [
            'id', 'codigo_solicitud', 'cliente_nombre', 'sucursal_nombre',
            'tipo_solicitud', 'estado', 'status', 'mes', 'anio',
            'fecha_creacion', 'fecha_actualizacion'
        ]


class SolicitudDetailSerializer(serializers.ModelSerializer):
    """Serializer completo con relaciones"""
    cliente = ClienteSerializer(read_only=True)
    sucursal = SucursalSerializer(read_only=True)
    logistica = CoordinacionLogisticaSerializer(read_only=True)
    tecnica = CoordinacionTecnicaSerializer(read_only=True)
    equipos = EquipoInstaladoSerializer(many=True, read_only=True)
    historial = HistorialSolicitudSerializer(many=True, read_only=True)
    
    # IDs para escritura
    cliente_id = serializers.IntegerField(write_only=True)
    sucursal_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Solicitud
        fields = '__all__'
    
    def create(self, validated_data):
        # Crear solicitud
        solicitud = Solicitud.objects.create(**validated_data)
        
        # Crear automáticamente registros de coordinación
        CoordinacionLogistica.objects.create(solicitud=solicitud)
        CoordinacionTecnica.objects.create(solicitud=solicitud)
        
        # Registrar en historial
        HistorialSolicitud.objects.create(
            solicitud=solicitud,
            usuario=self.context.get('request').user.username if self.context.get('request') else 'Sistema',
            accion='Creación',
            detalle=f'Solicitud {solicitud.codigo_solicitud} creada'
        )
        
        return solicitud
