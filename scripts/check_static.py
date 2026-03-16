import urllib.request

urls = [
    'http://127.0.0.1:8000/static/js/Bodega.js',
    'http://127.0.0.1:8000/static/js/reportes_v2.js',
    'http://127.0.0.1:8000/static/js/header-user.js'
]

for url in urls:
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            print('URL:', url, 'STATUS', r.getcode())
            data = r.read().decode('utf-8', 'replace')
            print(data[:800])
    except Exception as e:
        print('URL', url, 'ERROR', e)
