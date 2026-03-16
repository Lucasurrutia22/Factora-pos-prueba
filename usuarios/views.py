from django.shortcuts import render

def usuarios_view(request):
    return render(request, 'usuarios/usuarios.html')

def config_view(request):
    return render(request, 'usuarios/config.html')
