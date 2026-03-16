from django.db import models

# Create your models here.

class Cliente(models.Model):
    id = models.AutoField(primary_key=True, db_column='id')
    nombre = models.CharField(max_length=200, db_column='nombre')
    pais = models.CharField(max_length=100, null=True, blank=True, db_column='pais')
    activo = models.BooleanField(default=True, db_column='activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True, db_column='fecha_creacion')
    
    class Meta:
        db_table = 'clientes'
        managed = False
    
    def __str__(self):
        return self.nombre
