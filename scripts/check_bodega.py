import urllib.request

urls = [
    'http://127.0.0.1:8000/bodega/',
    'http://127.0.0.1:8000/inventario/api/productos/'
]

for url in urls:
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            status = r.getcode()
            data = r.read().decode('utf-8', 'replace')
            print('URL:', url, 'STATUS', status)
            print(data[:1600])
            print('\n--- END ---\n')
    except Exception as e:
        print('URL', url, 'ERROR', e)
