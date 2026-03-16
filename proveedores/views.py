from django.shortcuts import render

def proveedores_view(request):
    return render(request, 'proveedores/Proveedores.html')

