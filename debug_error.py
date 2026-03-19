import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FactoraPos.settings')
django.setup()

from django.test import Client
import traceback

client = Client()
try:
    response = client.get('/ventas/clientes/')
    print(f'Status: {response.status_code}')
except Exception as e:
    print("ERROR CAPTURADO:")
    print(traceback.format_exc())
