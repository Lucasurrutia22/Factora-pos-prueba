// Clientes (Customers) Module - Conectado a Oracle
(function() {
    'use strict';

    let customers = [];

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        loadCustomersFromAPI();
    });

    // Load customers from Oracle API
    async function loadCustomersFromAPI() {
        try {
            const response = await fetch('/ventas/api/clientes/');
            const result = await response.json();
            if (result.success) {
                customers = result.data.map(c => ({
                    id: c.id_cliente,
                    name: c.nombre || '',
                    email: c.email || c.correo || '',
                    phone: c.telefono || '',
                    rut: c.rut || '',
                    address: c.direccion || '',
                    city: c.ciudad || '',
                    registrationDate: c.fecha_registro ? new Date(c.fecha_registro).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                }));
                renderCustomersTable();
                console.log('Clientes cargados desde Oracle:', customers.length);
            } else {
                console.error('Error API:', result.error);
                customers = [];
                renderCustomersTable();
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
            customers = [];
            renderCustomersTable();
        }
    }

    // Handle customer form submission
    window.handleCustomerSubmit = async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('customerName').value;
        const email = document.getElementById('customerEmail').value;
        const phone = document.getElementById('customerPhone').value;
        const rut = document.getElementById('customerRut').value;
        const address = document.getElementById('customerAddress').value;
        const city = document.getElementById('customerCity').value;

        console.log('Datos del formulario:', { name, email, phone, rut, address, city });

        if (!name) {
            alert('El nombre es requerido');
            return;
        }

        try {
            const payload = {
                nombre: name,
                correo: email,
                telefono: phone,
                rut: rut,
                direccion: address,
                ciudad: city
            };
            console.log('Enviando payload:', payload);
            
            const response = await fetch('/ventas/api/clientes/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.success) {
                document.getElementById('customerForm').reset();
                await loadCustomersFromAPI();
                alert('Cliente creado exitosamente en Oracle');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error creando cliente:', error);
            alert('Error de conexión con el servidor');
        }
    };

    // Render customers table
    function renderCustomersTable() {
        const tbody = document.getElementById('customersTableBody');
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b;">No hay clientes registrados</td></tr>';
            return;
        }

        tbody.innerHTML = customers.map((customer, index) => `
            <tr>
                <td>#${customer.id}</td>
                <td><strong>${customer.name}</strong></td>
                <td>${customer.email || '-'}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.rut || '-'}</td>
                <td>${customer.city || '-'}</td>
                <td>${customer.registrationDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit" onclick="window.editCustomer(${index})" title="Editar">✏️</button>
                        <button class="btn-action delete" onclick="window.deleteCustomer(${index})" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Edit customer
    window.editCustomer = function(index) {
        const customer = customers[index];
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerPhone').value = customer.phone || '';
        document.getElementById('customerRut').value = customer.rut || '';
        document.getElementById('customerAddress').value = customer.address || '';
        document.getElementById('customerCity').value = customer.city || '';
        
        // Store current editing customer ID
        document.getElementById('customerForm').dataset.editingId = customer.id;
        
        document.getElementById('customerForm').onsubmit = async function(e) {
            e.preventDefault();
            const editId = this.dataset.editingId;
            const name = document.getElementById('customerName').value;
            const email = document.getElementById('customerEmail').value;
            const phone = document.getElementById('customerPhone').value;
            const rut = document.getElementById('customerRut').value;
            const address = document.getElementById('customerAddress').value;
            const city = document.getElementById('customerCity').value;

            try {
                const response = await fetch(`/ventas/api/clientes/${editId}/update/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: name,
                        correo: email,
                        telefono: phone,
                        rut: rut,
                        direccion: address,
                        ciudad: city
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    document.getElementById('customerForm').reset();
                    delete this.dataset.editingId;
                    this.onsubmit = window.handleCustomerSubmit;
                    await loadCustomersFromAPI();
                    alert('Cliente actualizado en Oracle');
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error actualizando cliente:', error);
                alert('Error de conexión con el servidor');
            }
        };
    };

    // Delete customer
    window.deleteCustomer = async function(index) {
        const customer = customers[index];
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            try {
                const response = await fetch(`/ventas/api/clientes/${customer.id}/delete/`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                if (result.success) {
                    await loadCustomersFromAPI();
                    alert('Cliente eliminado de Oracle');
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error eliminando cliente:', error);
                alert('Error de conexión con el servidor');
            }
        }
    };

    // Listen for updates
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadCustomersFromAPI();
        }
    });
})();

// Global dropdown functions
window.toggleProfileMenu = function() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
};

document.addEventListener('click', function(e) {
    const profileWrapper = document.querySelector('.user-profile-wrapper');
    const dropdown = document.getElementById('userDropdown');
    if (profileWrapper && !profileWrapper.contains(e.target) && dropdown) {
        dropdown.classList.remove('show');
    }
});

// Modal functions
function openUserProfile(event) {
    event.preventDefault();
    const modal = document.getElementById('userProfileModal');
    if (modal) modal.style.display = 'flex';
}

function openSettings(event) {
    event.preventDefault();
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'flex';
}

function closeModalById(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}
