import urllib.request, json

print('GET entries')
print(urllib.request.urlopen('http://127.0.0.1:8000/reportes/api/bodega-entries/').read().decode()[:1000])
print('\nPOST new entry')
req=urllib.request.Request('http://127.0.0.1:8000/reportes/api/bodega-entries/', data=json.dumps({'categoria':'equipos','nombre':'Prueba Equipo','valor':12345}).encode('utf-8'), headers={'Content-Type':'application/json'})
resp=urllib.request.urlopen(req)
print(resp.status, resp.read().decode())
print('\nGET entries after')
print(urllib.request.urlopen('http://127.0.0.1:8000/reportes/api/bodega-entries/').read().decode()[:1000])
