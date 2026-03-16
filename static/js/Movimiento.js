// Log de Inventario - Control de Movimientos de Stock
(function() {
    'use strict';

    let stockMovements = [];
    let allMovements = [];

    // Tipos de movimiento de inventario
    const MOVEMENT_TYPES = {
        ENTRADA: { label: 'Entrada', icon: '📥', color: 'active' },
        SALIDA: { label: 'Salida', icon: '📤', color: 'danger' },
        AJUSTE_POSITIVO: { label: 'Ajuste (+)', icon: '➕', color: 'medium' },
        AJUSTE_NEGATIVO: { label: 'Ajuste (-)', icon: '➖', color: 'warning' },
        DEVOLUCION: { label: 'Devolución', icon: '🔄', color: 'info' },
        TRASPASO: { label: 'Traspaso', icon: '🔀', color: 'primary' }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        loadMovements();
        loadProductsForSelect();
        renderMovementsTable();
        updateSummaryCards();
    });

    // Load movements from localStorage
    function loadMovements() {
        const stored = localStorage.getItem('stockMovements');
        allMovements = stored ? JSON.parse(stored) : generateSampleMovements();
        stockMovements = [...allMovements];
        
        if (!stored) {
            localStorage.setItem('stockMovements', JSON.stringify(allMovements));
        }
    }

    // Generate sample movements for demo
    function generateSampleMovements() {
        const today = new Date();
        const samples = [
            {
                id: 'SM001',
                date: formatDate(new Date(today - 86400000 * 2)),
                time: '09:15',
                type: 'ENTRADA',
                productId: 1,
                productName: 'Laptop HP ProBook',
                quantity: 10,
                stockBefore: 15,
                stockAfter: 25,
                reason: 'Compra a proveedor TechDistributor',
                user: 'Admin',
                reference: 'OC-2024-001'
            },
            {
                id: 'SM002',
                date: formatDate(new Date(today - 86400000)),
                time: '14:30',
                type: 'SALIDA',
                productId: 2,
                productName: 'Mouse Logitech MX',
                quantity: 5,
                stockBefore: 50,
                stockAfter: 45,
                reason: 'Venta a cliente',
                user: 'Vendedor1',
                reference: 'VTA-2024-125'
            },
            {
                id: 'SM003',
                date: formatDate(today),
                time: '10:00',
                type: 'AJUSTE_NEGATIVO',
                productId: 3,
                productName: 'Teclado Mecánico RGB',
                quantity: 2,
                stockBefore: 30,
                stockAfter: 28,
                reason: 'Producto dañado en almacén',
                user: 'Admin',
                reference: 'AJ-2024-015'
            },
            {
                id: 'SM004',
                date: formatDate(today),
                time: '11:45',
                type: 'DEVOLUCION',
                productId: 2,
                productName: 'Mouse Logitech MX',
                quantity: 1,
                stockBefore: 45,
                stockAfter: 46,
                reason: 'Cliente devolvió producto defectuoso',
                user: 'Vendedor1',
                reference: 'DEV-2024-008'
            }
        ];
        return samples;
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Load products for dropdown
    function loadProductsForSelect() {
        const select = document.getElementById('mv_product');
        if (!select) return;

        // Try to load from API first, fallback to localStorage
        fetch('/inventario/api/productos/')
            .then(response => response.json())
            .then(data => {
                if (data.productos && data.productos.length > 0) {
                    populateProductSelect(select, data.productos.map(p => ({
                        id: p.ID || p.id,
                        name: p.NOMBRE || p.nombre || p.name
                    })));
                } else {
                    loadProductsFromLocalStorage(select);
                }
            })
            .catch(() => {
                loadProductsFromLocalStorage(select);
            });
    }

    function loadProductsFromLocalStorage(select) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        populateProductSelect(select, products.map(p => ({ id: p.id, name: p.name })));
    }

    function populateProductSelect(select, products) {
        select.innerHTML = '<option value="">Seleccionar producto...</option>';
        products.forEach(p => {
            select.innerHTML += `<option value="${p.id}" data-name="${p.name}">${p.name}</option>`;
        });
    }

    // Render movements table
    function renderMovementsTable() {
        const tbody = document.getElementById('movementsTableBody');
        if (!tbody) return;

        if (stockMovements.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 40px;">📦 No hay movimientos de inventario registrados</td></tr>';
            return;
        }

        tbody.innerHTML = stockMovements.map(mov => {
            const typeInfo = MOVEMENT_TYPES[mov.type] || { label: mov.type, icon: '📋', color: 'default' };
            const isPositive = ['ENTRADA', 'AJUSTE_POSITIVO', 'DEVOLUCION'].includes(mov.type);
            
            return `
            <tr>
                <td><strong>${mov.id}</strong></td>
                <td>${mov.date}<br><small style="color:#64748b;">${mov.time}</small></td>
                <td>
                    <span class="badge-status ${typeInfo.color}">
                        ${typeInfo.icon} ${typeInfo.label}
                    </span>
                </td>
                <td>${mov.productName}</td>
                <td style="text-align: center;">
                    <span style="color: ${isPositive ? '#10b981' : '#ef4444'}; font-weight: 600;">
                        ${isPositive ? '+' : '-'}${mov.quantity}
                    </span>
                </td>
                <td style="text-align: center;">${mov.stockBefore} → <strong>${mov.stockAfter}</strong></td>
                <td>${mov.reason || '-'}</td>
                <td>${mov.user}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewMovementDetails('${mov.id}')" title="Ver Detalles">
                            👁️
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteMovement('${mov.id}')" title="Eliminar Movimiento" style="margin-left:6px;">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    // Update summary cards
    function updateSummaryCards() {
        const today = formatDate(new Date());
        const todayMovements = allMovements.filter(m => m.date === today);
        
        const entries = todayMovements.filter(m => ['ENTRADA', 'AJUSTE_POSITIVO', 'DEVOLUCION'].includes(m.type));
        const exits = todayMovements.filter(m => ['SALIDA', 'AJUSTE_NEGATIVO'].includes(m.type));
        
        const totalEntries = entries.reduce((sum, m) => sum + m.quantity, 0);
        const totalExits = exits.reduce((sum, m) => sum + m.quantity, 0);

        const entriesEl = document.getElementById('todayEntries');
        const exitsEl = document.getElementById('todayExits');
        const totalEl = document.getElementById('totalMovements');
        const balanceEl = document.getElementById('stockBalance');

        if (entriesEl) entriesEl.textContent = totalEntries;
        if (exitsEl) exitsEl.textContent = totalExits;
        if (totalEl) totalEl.textContent = todayMovements.length;
        if (balanceEl) {
            const balance = totalEntries - totalExits;
            balanceEl.textContent = (balance >= 0 ? '+' : '') + balance;
            balanceEl.style.color = balance >= 0 ? '#10b981' : '#ef4444';
        }
    }

    // Apply filters
    window.applyFilters = function() {
        const typeFilter = document.getElementById('filterType').value;
        const fromDate = document.getElementById('filterFromDate').value;
        const toDate = document.getElementById('filterToDate').value;
        const searchText = document.getElementById('searchProduct')?.value?.toLowerCase() || '';

        stockMovements = allMovements.filter(m => {
            const typeMatch = !typeFilter || m.type === typeFilter;
            const dateMatch = (!fromDate || m.date >= fromDate) && (!toDate || m.date <= toDate);
            const searchMatch = !searchText || 
                m.productName.toLowerCase().includes(searchText) ||
                m.id.toLowerCase().includes(searchText) ||
                (m.reason && m.reason.toLowerCase().includes(searchText));
            return typeMatch && dateMatch && searchMatch;
        });

        renderMovementsTable();
    };

    // Eliminar movimiento por ID
    window.deleteMovement = function(id) {
        if (!id) return;
        if (!confirm('¿Confirma eliminar este movimiento? Esta acción no se puede deshacer.')) return;

        const idxAll = allMovements.findIndex(m => m.id === id);
        if (idxAll === -1) {
            alert('Movimiento no encontrado');
            return;
        }

        // Eliminar del array principal
        allMovements.splice(idxAll, 1);
        // Guardar en storage
        localStorage.setItem('stockMovements', JSON.stringify(allMovements));

        // Actualizar vistas
        stockMovements = [...allMovements];
        renderMovementsTable();
        updateSummaryCards();

        // Notificar
        if (typeof window.addNotification === 'function') {
            window.addNotification({ title: '🗑️ Movimiento eliminado', message: `ID ${id} eliminado`, type: 'Inventario' });
        }
    };

    // Clear filters
    window.clearFilters = function() {
        document.getElementById('filterType').value = '';
        document.getElementById('filterFromDate').value = '';
        document.getElementById('filterToDate').value = '';
        const searchEl = document.getElementById('searchProduct');
        if (searchEl) searchEl.value = '';
        
        stockMovements = [...allMovements];
        renderMovementsTable();
    };

    // Open add movement modal
    window.openAddMovementModal = function() {
        const modal = document.getElementById('addMovementModal');
        if (modal) {
            modal.style.display = 'flex';
            // Set today's date and current time
            const now = new Date();
            document.getElementById('mv_date').value = formatDate(now);
            document.getElementById('mv_time').value = now.toTimeString().slice(0, 5);
        }
    };

    // Close modal
    window.closeAddMovementModal = function() {
        const modal = document.getElementById('addMovementModal');
        if (modal) modal.style.display = 'none';
        document.getElementById('addMovementForm')?.reset();
    };

    // Submit new movement
    window.submitAddMovement = function() {
        const date = document.getElementById('mv_date').value;
        const time = document.getElementById('mv_time').value;
        const type = document.getElementById('mv_type').value;
        const productSelect = document.getElementById('mv_product');
        const productId = productSelect.value;
        const productName = productSelect.options[productSelect.selectedIndex]?.dataset?.name || '';
        const quantity = parseInt(document.getElementById('mv_quantity').value) || 0;
        const reason = document.getElementById('mv_reason').value;
        const reference = document.getElementById('mv_reference').value || '';

        if (!date || !time || !type || !productId || quantity <= 0) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }

        // Get current stock (simulated)
        const currentStock = Math.floor(Math.random() * 50) + 10;
        const isPositive = ['ENTRADA', 'AJUSTE_POSITIVO', 'DEVOLUCION'].includes(type);
        const newStock = isPositive ? currentStock + quantity : currentStock - quantity;

        const newMovement = {
            id: 'SM' + Date.now().toString().slice(-6),
            date: date,
            time: time,
            type: type,
            productId: parseInt(productId),
            productName: productName,
            quantity: quantity,
            stockBefore: currentStock,
            stockAfter: Math.max(0, newStock),
            reason: reason,
            user: localStorage.getItem('currentUser') || 'Admin',
            reference: reference
        };

        allMovements.unshift(newMovement);
        localStorage.setItem('stockMovements', JSON.stringify(allMovements));
        
        stockMovements = [...allMovements];
        renderMovementsTable();
        updateSummaryCards();

        // Notification
        if (typeof window.addNotification === 'function') {
            window.addNotification({
                title: `${MOVEMENT_TYPES[type]?.icon || '📦'} ${MOVEMENT_TYPES[type]?.label || type}`,
                message: `${productName}: ${isPositive ? '+' : '-'}${quantity} unidades`,
                type: 'Inventario'
            });
        }

        closeAddMovementModal();
        alert('✅ Movimiento registrado exitosamente');
    };

    // View movement details
    window.viewMovementDetails = function(id) {
        const mov = allMovements.find(m => m.id === id);
        if (!mov) return;

        const typeInfo = MOVEMENT_TYPES[mov.type] || { label: mov.type, icon: '📋' };
        const isPositive = ['ENTRADA', 'AJUSTE_POSITIVO', 'DEVOLUCION'].includes(mov.type);

        alert(`
📋 DETALLE DE MOVIMIENTO

ID: ${mov.id}
Fecha: ${mov.date} ${mov.time}
Tipo: ${typeInfo.icon} ${typeInfo.label}

Producto: ${mov.productName}
Cantidad: ${isPositive ? '+' : '-'}${mov.quantity}
Stock: ${mov.stockBefore} → ${mov.stockAfter}

Motivo: ${mov.reason || 'No especificado'}
Referencia: ${mov.reference || 'N/A'}
Usuario: ${mov.user}
        `.trim());
    };

    // Export to CSV
    window.exportMovements = function() {
        let csv = 'ID,Fecha,Hora,Tipo,Producto,Cantidad,Stock Antes,Stock Después,Motivo,Usuario,Referencia\n';
        
        stockMovements.forEach(mov => {
            const typeInfo = MOVEMENT_TYPES[mov.type] || { label: mov.type };
            csv += `"${mov.id}","${mov.date}","${mov.time}","${typeInfo.label}","${mov.productName}","${mov.quantity}","${mov.stockBefore}","${mov.stockAfter}","${mov.reason || ''}","${mov.user}","${mov.reference || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'log_inventario_' + formatDate(new Date()) + '.csv';
        link.click();
    };

})();

// Global dropdown functions
window.toggleProfileMenu = function() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('show');
};

document.addEventListener('click', function(e) {
    const profileWrapper = document.querySelector('.user-profile-wrapper');
    const dropdown = document.getElementById('userDropdown');
    if (profileWrapper && !profileWrapper.contains(e.target) && dropdown) {
        dropdown.classList.remove('show');
    }
});
