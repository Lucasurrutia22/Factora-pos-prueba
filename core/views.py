from django.shortcuts import render

def index(request):
    return render(request, 'core/index.html')

def dashboard(request):
    return render(request, 'core/dashboard.html')

def profile(request):
    return render(request, 'core/dashboard.html', {'is_profile': True})
