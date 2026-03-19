"""
create_tm_bx_products.py
Django Management Command

Uso:
python manage.py create_tm_bx_products
"""

from django.core.management.base import BaseCommand
from stock.models import Producto

class Command(BaseCommand):
    help = 'Crear asociaciones TM→TOTEM y BX→TVBOX en la base de datos'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*80)
        self.stdout.write("CREANDO ASOCIACIONES DE CÓDIGOS TM Y BX")
        self.stdout.write("="*80 + "\n")

        # 1. CREAR TOTEM con código TM
        self.stdout.write("1️⃣ Creando TOTEM ANYPOS 100 con código TM101723...")
        try:
            totem, created = Producto.objects.update_or_create(
                nombre='TOTEM ANYPOS 100',
                defaults={
                    'codigo_barra': 'TM101723',
                    'sku': 'TOTEM-001',
                    'categoria': 'Equipos',
                    'cantidad': 1,
                    'ubicacion': 'Bodega A - Mostrador',
                    'precio': 3500.00
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS('✅ TOTEM CREADO'))
            else:
                self.stdout.write(self.style.SUCCESS('✅ TOTEM ACTUALIZADO'))
            
            self.stdout.write(f"   📦 {totem.nombre}")
            self.stdout.write(f"   🔖 Código: {totem.codigo_barra}")
            self.stdout.write(f"   📊 ID: {totem.id}")
            self.stdout.write(f"   💾 Stock: {totem.cantidad}\n")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {str(e)}\n'))

        # 2. CREAR TV BOX con código BX
        self.stdout.write("2️⃣ Creando TV BOX con código BX101723...")
        try:
            tvbox, created = Producto.objects.update_or_create(
                nombre='TV BOX',
                defaults={
                    'codigo_barra': 'BX101723',
                    'sku': 'TVBOX-001',
                    'categoria': 'Equipos',
                    'cantidad': 5,
                    'ubicacion': 'Bodega B - Estante 2',
                    'precio': 150.00
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS('✅ TV BOX CREADO'))
            else:
                self.stdout.write(self.style.SUCCESS('✅ TV BOX ACTUALIZADO'))
            
            self.stdout.write(f"   📦 {tvbox.nombre}")
            self.stdout.write(f"   🔖 Código: {tvbox.codigo_barra}")
            self.stdout.write(f"   📊 ID: {tvbox.id}")
            self.stdout.write(f"   💾 Stock: {tvbox.cantidad}\n")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {str(e)}\n'))

        # 3. VERIFICACIÓN
        self.stdout.write("\n3️⃣ VERIFICACIÓN EN BASE DE DATOS...")
        self.stdout.write("-" * 80)
        
        tm_prods = Producto.objects.filter(codigo_barra__istartswith='TM')
        self.stdout.write(f"\n🔍 Productos con código TM: {tm_prods.count()}")
        for prod in tm_prods:
            self.stdout.write(f"   ✓ {prod.codigo_barra} - {prod.nombre}")
        
        bx_prods = Producto.objects.filter(codigo_barra__istartswith='BX')
        self.stdout.write(f"\n🔍 Productos con código BX: {bx_prods.count()}")
        for prod in bx_prods:
            self.stdout.write(f"   ✓ {prod.codigo_barra} - {prod.nombre}")

        # RESUMEN FINAL
        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS("✅ ASOCIACIONES CREADAS EXITOSAMENTE"))
        self.stdout.write("="*80)
        
        resumen = """
📋 RESUMEN:
   ✅ TOTEM ANYPOS 100 = TM101723
   ✅ TV BOX = BX101723
   
🎯 PRÓXIMOS PASOS:
   1. El scanner puede escanear TM101723 → TOTEM ✅
   2. El scanner puede escanear BX101723 → TV BOX ✅
   3. Los movimientos se registrarán correctamente ✅

🔍 VER EN SHELL:
   from stock.models import Producto
   Producto.objects.filter(codigo_barra__istartswith='TM').values()
   Producto.objects.filter(codigo_barra__istartswith='BX').values()
        """
        self.stdout.write(resumen)
        self.stdout.write("="*80 + "\n")
