import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FactoraPos.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()

# Ver estructura de la tabla clientes
cursor.execute("PRAGMA table_info(clientes)")
cols = cursor.fetchall()
print("Columnas en tabla 'clientes':")
for col in cols:
    print(f"  {col}")

cursor.close()
