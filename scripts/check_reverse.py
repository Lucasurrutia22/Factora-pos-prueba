import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FactoraPos.settings')
django.setup()
from django.urls import reverse, get_resolver

resolver = get_resolver()

# Mostrar nombres registrados (filtrado) y probar reverse
names = sorted({name for name in resolver.reverse_dict.keys() if isinstance(name, str)})
print('Registered names (sample):')
for n in names[:200]:
    print('-', n)

try:
    print('\nreverse("reportes") ->', reverse('reportes'))
except Exception as e:
    print('\nreverse("reportes") raised:', repr(e))

try:
    print('\nreverse("reportes:reportes") ->', reverse('reportes:reportes'))
except Exception as e:
    print('\nreverse("reportes:reportes") raised:', repr(e))
