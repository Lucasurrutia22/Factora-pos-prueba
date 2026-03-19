from django.db import models
from core.models import Cliente


class ClienteNoOperativo(models.Model):
    """
    Modelo para gestionar clientes no operativos.
    Representa clientes que están marcados como inactivos en el sistema.
    """
    cliente = models.OneToOneField(
        Cliente,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='registro_no_operativo'
    )
    fecha_desactivacion = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha en que el cliente fue marcado como no operativo"
    )
    motivo_desactivacion = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Razón por la cual el cliente fue desactivado"
    )
    observaciones = models.TextField(
        blank=True,
        null=True,
        help_text="Observaciones adicionales sobre el cliente"
    )

    class Meta:
        verbose_name = "Cliente No Operativo"
        verbose_name_plural = "Clientes No Operativos"
        ordering = ['-fecha_desactivacion']

    def __str__(self):
        return f"{self.cliente.nombre} (Desactivado)"

    @property
    def dias_inactivo(self):
        """Calcula los días que el cliente ha estado inactivo"""
        from datetime import datetime
        from django.utils import timezone
        delta = timezone.now() - self.fecha_desactivacion
        return delta.days
