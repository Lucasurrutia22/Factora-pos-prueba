from django.urls import reverse_lazy
from django.views import generic
from .models import Producto


class ProductListView(generic.ListView):
    model = Producto
    template_name = 'stock/product_list.html'
    context_object_name = 'productos'


class ProductCreateView(generic.CreateView):
    model = Producto
    fields = ['nombre', 'sku', 'categoria', 'precio', 'cantidad']
    template_name = 'stock/product_form.html'
    success_url = reverse_lazy('stock:product_list')


class ProductUpdateView(generic.UpdateView):
    model = Producto
    fields = ['nombre', 'sku', 'categoria', 'precio', 'cantidad']
    template_name = 'stock/product_form.html'
    success_url = reverse_lazy('stock:product_list')


class ProductDeleteView(generic.DeleteView):
    model = Producto
    template_name = 'stock/product_confirm_delete.html'
    success_url = reverse_lazy('stock:product_list')
