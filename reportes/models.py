from django.db import models
from django.conf import settings


class BodegaEntry(models.Model):
	CATEGORIA_CHOICES = [
		('equipos', 'Equipos'),
		('materiales', 'Materiales y cables'),
		('repuestos', 'Repuestos'),
	]

	categoria = models.CharField(max_length=32, choices=CATEGORIA_CHOICES)
	nombre = models.CharField(max_length=255)
	valor = models.DecimalField(max_digits=14, decimal_places=2, default=0)
	created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def as_dict(self):
		return {
			'id': self.id,
			'categoria': self.categoria,
			'nombre': self.nombre,
			'valor': float(self.valor),
			'created_at': self.created_at.isoformat(),
			'created_by': getattr(self.created_by, 'username', None)
		}

	def __str__(self):
		return f"[{self.categoria}] {self.nombre} - {self.valor}"
