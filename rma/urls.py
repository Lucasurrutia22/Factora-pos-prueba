from django.urls import path
from .views import (
    rma_view, 
    api_rma_list, 
    api_rma_create, 
    api_rma_update, 
    api_rma_delete
)

app_name = 'rma'

urlpatterns = [
    path('', rma_view, name='rma'),
    # API endpoints
    path('api/rmas/', api_rma_list, name='api_rma_list'),
    path('api/rmas/create/', api_rma_create, name='api_rma_create'),
    path('api/rmas/<int:id>/update/', api_rma_update, name='api_rma_update'),
    path('api/rmas/<int:id>/delete/', api_rma_delete, name='api_rma_delete'),
]

