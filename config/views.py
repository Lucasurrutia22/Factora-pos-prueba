from django.shortcuts import render

def config_view(request):
    return render(request, 'config/config.html')
