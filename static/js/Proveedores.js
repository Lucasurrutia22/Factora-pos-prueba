// Proveedores (Suppliers) Module
(function() {
    'use strict';

    let suppliers = [];
    let nextId = 1;

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        loadSuppliers();
    });

    // Load suppliers
    function loadSuppliers() {
        const stored = localStorage.getItem('suppliers');
        
        // Validar si hay datos guardados
        if (stored) {
            try {
                suppliers = JSON.parse(stored);
                
                // Verificar si los IDs son timestamps (números muy grandes)
                // Si es así, regenerar con IDs correlativos
                if (suppliers.length > 0 && suppliers[0].id > 1000) {
                    // Regenerar IDs correlativos
                    suppliers.forEach((supplier, index) => {
                        supplier.id = index + 1;
                    });
                    localStorage.setItem('suppliers', JSON.stringify(suppliers));
                }
            } catch(e) {
                // Si hay error al parsear, inicializar con datos por defecto
                suppliers = [
                    { id: 1, name: 'Proveedor A', contact: 'Juan García', email: 'juan@proveedora.com', phone: '+56-2-1234-5678', rut: '76.123.456-7', address: 'Calle Principal 123', registrationDate: '2024-01-15' },
                    { id: 2, name: 'Proveedor B', contact: 'María López', email: 'maria@proveedorb.com', phone: '+56-2-2345-6789', rut: '76.234.567-8', address: 'Avenida Secundaria 456', registrationDate: '2024-01-20' }
                ];
                localStorage.setItem('suppliers', JSON.stringify(suppliers));
            }
        } else {
            // Inicializar con datos por defecto
            suppliers = [
                { id: 1, name: 'Proveedor A', contact: 'Juan García', email: 'juan@proveedora.com', phone: '+56-2-1234-5678', rut: '76.123.456-7', address: 'Calle Principal 123', registrationDate: '2024-01-15' },
                { id: 2, name: 'Proveedor B', contact: 'María López', email: 'maria@proveedorb.com', phone: '+56-2-2345-6789', rut: '76.234.567-8', address: 'Avenida Secundaria 456', registrationDate: '2024-01-20' }
            ];
            localStorage.setItem('suppliers', JSON.stringify(suppliers));
        }
        
        // Calcular el próximo ID basado en los proveedores existentes
        if (suppliers.length > 0) {
            nextId = Math.max(...suppliers.map(s => s.id)) + 1;
        }
        
        renderSuppliersTable();
    }

    // Handle supplier form submission
    window.handleSupplierSubmit = function(e) {
        e.preventDefault();
        
        const name = document.getElementById('supplierName').value;
        const contact = document.getElementById('supplierContact').value;
        const email = document.getElementById('supplierEmail').value;
        const phone = document.getElementById('supplierPhone').value;
        const rut = document.getElementById('supplierRut').value;
        const address = document.getElementById('supplierAddress').value;

        if (!name) {
            alert('El nombre de la empresa es requerido');
            return;
        }

        const supplier = {
            id: nextId++,
            name: name,
            contact: contact,
            email: email,
            phone: phone,
            rut: rut,
            address: address,
            registrationDate: new Date().toISOString().split('T')[0]
        };

        suppliers.push(supplier);
        localStorage.setItem('suppliers', JSON.stringify(suppliers));

        // Reset form
        document.getElementById('supplierForm').reset();
        renderSuppliersTable();
        alert('Proveedor creado exitosamente');
    };

    // Render suppliers table
    function renderSuppliersTable() {
        const tbody = document.getElementById('suppliersTableBody');
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b;">No hay proveedores registrados</td></tr>';
            return;
        }

        tbody.innerHTML = suppliers.map((supplier, index) => `
            <tr>
                <td>#${supplier.id}</td>
                <td><strong>${supplier.name}</strong></td>
                <td>${supplier.contact || '-'}</td>
                <td>${supplier.email || '-'}</td>
                <td>${supplier.phone || '-'}</td>
                <td>${supplier.rut || '-'}</td>
                <td>${supplier.registrationDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit" onclick="window.editSupplier(${index})" title="Editar">✏️</button>
                        <button class="btn-action delete" onclick="window.deleteSupplier(${index})" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Edit supplier
    window.editSupplier = function(index) {
        const supplier = suppliers[index];
        document.getElementById('supplierName').value = supplier.name;
        document.getElementById('supplierContact').value = supplier.contact || '';
        document.getElementById('supplierEmail').value = supplier.email || '';
        document.getElementById('supplierPhone').value = supplier.phone || '';
        document.getElementById('supplierRut').value = supplier.rut || '';
        document.getElementById('supplierAddress').value = supplier.address || '';
        
        document.getElementById('supplierForm').dataset.editingIndex = index;
        
        const oldSubmit = document.getElementById('supplierForm').onsubmit;
        document.getElementById('supplierForm').onsubmit = function(e) {
            e.preventDefault();
            const editIndex = parseInt(this.dataset.editingIndex);
            const name = document.getElementById('supplierName').value;
            const contact = document.getElementById('supplierContact').value;
            const email = document.getElementById('supplierEmail').value;
            const phone = document.getElementById('supplierPhone').value;
            const rut = document.getElementById('supplierRut').value;
            const address = document.getElementById('supplierAddress').value;

            suppliers[editIndex] = {
                ...suppliers[editIndex],
                name: name,
                contact: contact,
                email: email,
                phone: phone,
                rut: rut,
                address: address
            };

            localStorage.setItem('suppliers', JSON.stringify(suppliers));
            document.getElementById('supplierForm').reset();
            delete this.dataset.editingIndex;
            this.onsubmit = oldSubmit;
            renderSuppliersTable();
            alert('Proveedor actualizado');
        };
    };

    // Delete supplier
    window.deleteSupplier = function(index) {
        if (confirm('¿Estás seguro de eliminar este proveedor?')) {
            suppliers.splice(index, 1);
            localStorage.setItem('suppliers', JSON.stringify(suppliers));
            renderSuppliersTable();
        }
    };

    // Reset suppliers data to defaults
    window.resetSuppliersData = function() {
        if (confirm('¿Estás seguro? Esto eliminará todos los proveedores y restaurará los datos por defecto.')) {
            suppliers = [
                { id: 1, name: 'Proveedor A', contact: 'Juan García', email: 'juan@proveedora.com', phone: '+56-2-1234-5678', rut: '76.123.456-7', address: 'Calle Principal 123', registrationDate: '2024-01-15' },
                { id: 2, name: 'Proveedor B', contact: 'María López', email: 'maria@proveedorb.com', phone: '+56-2-2345-6789', rut: '76.234.567-8', address: 'Avenida Secundaria 456', registrationDate: '2024-01-20' }
            ];
            nextId = 3;
            localStorage.setItem('suppliers', JSON.stringify(suppliers));
            renderSuppliersTable();
            alert('Datos restaurados a valores por defecto');
        }
    };

    // Listen for updates
    window.addEventListener('storage', function(e) {
        if (e.key === 'suppliers') {
            loadSuppliers();
        }
    });

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadSuppliers();
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
