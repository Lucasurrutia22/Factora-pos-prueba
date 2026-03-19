from django.test import TestCase
from django.urls import reverse
from core.models import Cliente
from .models import ClienteNoOperativo


class ClienteNoOperativoModelTest(TestCase):
    """Tests para el modelo ClienteNoOperativo"""
    
    def setUp(self):
        self.cliente = Cliente.objects.create(
            nombre='Cliente Test',
            pais='Colombia',
            activo=True
        )
    
    def test_crear_cliente_no_operativo(self):
        """Test creación de cliente no operativo"""
        cliente_no_op = ClienteNoOperativo.objects.create(
            cliente=self.cliente,
            motivo_desactivacion='Prueba de motivo',
            observaciones='Observación de prueba'
        )
        self.assertEqual(str(cliente_no_op), f"{self.cliente.nombre} (Desactivado)")
    
    def test_dias_inactivo_property(self):
        """Test propiedad dias_inactivo"""
        cliente_no_op = ClienteNoOperativo.objects.create(
            cliente=self.cliente,
            motivo_desactivacion='Test'
        )
        self.assertGreaterEqual(cliente_no_op.dias_inactivo, 0)


class ClienteNoOperativoViewTest(TestCase):
    """Tests para las vistas de ClienteNoOperativo"""
    
    def setUp(self):
        self.cliente = Cliente.objects.create(
            nombre='Cliente Test Vista',
            pais='Argentina',
            activo=False
        )
        self.cliente_no_op = ClienteNoOperativo.objects.create(
            cliente=self.cliente,
            motivo_desactivacion='Test vista',
            observaciones='Test'
        )
    
    def test_lista_clientes_no_operativos(self):
        """Test listado de clientes no operativos"""
        url = reverse('clientes_no_operativos:list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn(self.cliente.nombre, response.content.decode())
    
    def test_detalle_cliente_no_operativo(self):
        """Test vista de detalle"""
        url = reverse('clientes_no_operativos:detail', args=[self.cliente.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn(self.cliente.nombre, response.content.decode())
