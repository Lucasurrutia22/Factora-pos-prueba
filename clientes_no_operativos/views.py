from django.shortcuts import render, redirect, get_object_or_404
from django.views import generic
from django.urls import reverse_lazy
from django.contrib import messages
from django.db.models import Q

from core.models import Cliente
from .models import ClienteNoOperativo


class ClienteNoOperativoListView(generic.ListView):
    """
    Vista para listar todos los clientes no operativos.
    """
    model = ClienteNoOperativo
    template_name = 'clientes_no_operativos/list.html'
    context_object_name = 'clientes'
    paginate_by = 20

    def get_queryset(self):
        queryset = ClienteNoOperativo.objects.select_related('cliente').all()
        
        # Buscar por nombre del cliente
        search = self.request.GET.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(cliente__nombre__icontains=search) |
                Q(motivo_desactivacion__icontains=search)
            )
        
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        return context


class DesactivarClienteView(generic.CreateView):
    """
    Vista para desactivar un cliente (marcar como no operativo).
    """
    model = ClienteNoOperativo
    template_name = 'clientes_no_operativos/desactivar.html'
    fields = ['motivo_desactivacion', 'observaciones']
    success_url = reverse_lazy('clientes_no_operativos:list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        cliente_id = self.kwargs.get('cliente_id')
        context['cliente'] = get_object_or_404(Cliente, id=cliente_id)
        return context

    def form_valid(self, form):
        cliente_id = self.kwargs.get('cliente_id')
        cliente = get_object_or_404(Cliente, id=cliente_id)
        
        # Marcar cliente como inactivo
        cliente.activo = False
        cliente.save()
        
        # Crear registro de no operativo
        form.instance.cliente = cliente
        messages.success(self.request, f'Cliente "{cliente.nombre}" marcado como no operativo.')
        
        return super().form_valid(form)


class ClienteNoOperativoDetailView(generic.DetailView):
    """
    Vista para ver detalles de un cliente no operativo.
    """
    model = ClienteNoOperativo
    template_name = 'clientes_no_operativos/detail.html'
    context_object_name = 'cliente_no_op'
    pk_url_kwarg = 'pk'

    def get_object(self, queryset=None):
        return get_object_or_404(
            ClienteNoOperativo,
            cliente_id=self.kwargs.get('pk')
        )


class ReactivarClienteView(generic.View):
    """
    Vista para reactivar un cliente (marcarlo como operativo nuevamente).
    """
    
    def get(self, request, pk):
        cliente_no_op = get_object_or_404(ClienteNoOperativo, cliente_id=pk)
        cliente = cliente_no_op.cliente
        return render(
            request,
            'clientes_no_operativos/confirmar_reactivar.html',
            {'cliente': cliente, 'cliente_no_op': cliente_no_op}
        )

    def post(self, request, pk):
        cliente_no_op = get_object_or_404(ClienteNoOperativo, cliente_id=pk)
        cliente = cliente_no_op.cliente
        
        # Marcar como activo
        cliente.activo = True
        cliente.save()
        
        # Eliminar registro de no operativo
        cliente_no_op.delete()
        
        messages.success(request, f'Cliente "{cliente.nombre}" reactivado exitosamente.')
        return redirect('clientes_no_operativos:list')


class EditarClienteNoOperativoView(generic.UpdateView):
    """
    Vista para editar la información de un cliente no operativo.
    """
    model = ClienteNoOperativo
    template_name = 'clientes_no_operativos/edit.html'
    fields = ['motivo_desactivacion', 'observaciones']
    success_url = reverse_lazy('clientes_no_operativos:list')
    pk_url_kwarg = 'pk'

    def get_object(self, queryset=None):
        return get_object_or_404(
            ClienteNoOperativo,
            cliente_id=self.kwargs.get('pk')
        )

    def form_valid(self, form):
        messages.success(self.request, 'Información del cliente actualizada.')
        return super().form_valid(form)
