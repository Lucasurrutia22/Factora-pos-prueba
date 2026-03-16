import urllib.request

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/dashboard/') as r:
        print('Status:', r.status)
        data = r.read(8000)
        print('Length:', len(data))
except Exception as e:
    print('Request error:', repr(e))
