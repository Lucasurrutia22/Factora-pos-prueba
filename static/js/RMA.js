// RMA / Garantías Module
(function() {
    'use strict';

    let rmaList = [];

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        loadRMAFromAPI();
        setupFormHandlers();
    });

    // Load RMA from API
    async function loadRMAFromAPI() {
        try {
            const response = await fetch('/rma/api/rmas/');
            const result = await response.json();
            if (result.success) {
                rmaList = result.data.map(r => ({
                    id: r.id_rma,
                    producto: r.producto || '',
                    clienteNombre: r.cliente_nombre || '',
                    emailCliente: r.email_cliente || '',
                    telefonoCliente: r.telefono_cliente || '',
                    tipoRMA: r.tipo_rma || 'Devolución',
                    fechaCompra: r.fecha_compra || '',
                    numeroReferencia: r.numero_referencia || '',
                    descripcionProblema: r.descripcion_problema || '',
                    estado: r.estado || 'PENDIENTE',
                    fechaCreacion: r.fecha_creacion ? new Date(r.fecha_creacion).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                }));
                renderRMATable();
                console.log('RMAs cargados:', rmaList.length);
            } else {
                console.error('Error API:', result.error);
                rmaList = [];
                renderRMATable();
            }
        } catch (error) {
            console.error('Error cargando RMAs:', error);
            rmaList = [];
            renderRMATable();
        }
    }

    // Setup form handlers
    function setupFormHandlers() {
        const rmaForm = document.getElementById('rmaForm');
        if (rmaForm) {
            rmaForm.onsubmit = handleRMASubmit;
        }
    }

    // Handle RMA form submission
    async function handleRMASubmit(e) {
        e.preventDefault();
        
        const producto = document.getElementById('producto')?.value || '';
        const clienteNombre = document.getElementById('clienteNombre')?.value || '';
        const emailCliente = document.getElementById('emailCliente')?.value || '';
        const telefonoCliente = document.getElementById('telefonoCliente')?.value || '';
        const tipoRMA = document.getElementById('tipoRMA')?.value || 'Devolución';
        const fechaCompra = document.getElementById('fechaCompra')?.value || '';
        const numeroReferencia = document.getElementById('numeroReferencia')?.value || '';
        const descripcionProblema = document.getElementById('descripcionProblema')?.value || '';

        console.log('Datos RMA:', { producto, clienteNombre, emailCliente, tipoRMA, numeroReferencia });

        if (!producto) {
            alert('El producto es requerido');
            return;
        }
        if (!clienteNombre) {
            alert('El nombre del cliente es requerido');
            return;
        }

        try {
            const payload = {
                producto: producto,
                cliente_nombre: clienteNombre,
                email_cliente: emailCliente,
                telefono_cliente: telefonoCliente,
                tipo_rma: tipoRMA,
                fecha_compra: fechaCompra,
                numero_referencia: numeroReferencia,
                descripcion_problema: descripcionProblema
            };
            
            console.log('Enviando RMA:', payload);

            const response = await fetch('/rma/api/rmas/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.success) {
                document.getElementById('rmaForm').reset();
                await loadRMAFromAPI();
                alert('Solicitud RMA creada exitosamente');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error creando RMA:', error);
            alert('Error de conexión con el servidor');
        }
    }

    // Render RMA table
    function renderRMATable() {
        const tbody = document.getElementById('rmaTableBody');
        if (!tbody) return;

        if (rmaList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #64748b;">No hay solicitudes RMA registradas</td></tr>';
            return;
        }

        tbody.innerHTML = rmaList.map((rma, index) => `
            <tr>
                <td>#${rma.id}</td>
                <td>${rma.producto || '-'}</td>
                <td>${rma.clienteNombre || '-'}</td>
                <td>${rma.tipoRMA || '-'}</td>
                <td>${rma.numeroReferencia || '-'}</td>
                <td>
                    <span class="badge" style="background-color: ${getStatusColor(rma.estado)}; color: white; padding: 4px 8px; border-radius: 4px;">
                        ${rma.estado}
                    </span>
                </td>
                <td>${rma.fechaCreacion || '-'}</td>
                <td>
                    <button class="btn-edit" onclick="editRMA(${index})" title="Editar">✏️</button>
                    <button class="btn-delete" onclick="deleteRMA(${index})" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    // Get status color
    function getStatusColor(estado) {
        const colors = {
            'PENDIENTE': '#f59e0b',
            'EN PROCESO': '#3b82f6',
            'COMPLETADO': '#10b981',
            'RECHAZADO': '#ef4444'
        };
        return colors[estado] || '#64748b';
    }

    // Edit RMA
    window.editRMA = function(index) {
        const rma = rmaList[index];
        document.getElementById('producto').value = rma.producto;
        document.getElementById('clienteNombre').value = rma.clienteNombre;
        document.getElementById('emailCliente').value = rma.emailCliente;
        document.getElementById('telefonoCliente').value = rma.telefonoCliente;
        document.getElementById('tipoRMA').value = rma.tipoRMA;
        document.getElementById('fechaCompra').value = rma.fechaCompra;
        document.getElementById('numeroReferencia').value = rma.numeroReferencia;
        document.getElementById('descripcionProblema').value = rma.descripcionProblema;
        
        const rmaForm = document.getElementById('rmaForm');
        rmaForm.dataset.editingId = rma.id;
        
        rmaForm.onsubmit = async function(e) {
            e.preventDefault();
            const editId = this.dataset.editingId;
            
            const payload = {
                producto: document.getElementById('producto').value,
                cliente_nombre: document.getElementById('clienteNombre').value,
                email_cliente: document.getElementById('emailCliente').value,
                telefono_cliente: document.getElementById('telefonoCliente').value,
                tipo_rma: document.getElementById('tipoRMA').value,
                fecha_compra: document.getElementById('fechaCompra').value,
                numero_referencia: document.getElementById('numeroReferencia').value,
                descripcion_problema: document.getElementById('descripcionProblema').value,
                estado: document.getElementById('estado')?.value || 'PENDIENTE'
            };

            try {
                const response = await fetch(`/rma/api/rmas/${editId}/update/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                if (result.success) {
                    document.getElementById('rmaForm').reset();
                    delete this.dataset.editingId;
                    this.onsubmit = handleRMASubmit;
                    await loadRMAFromAPI();
                    alert('Solicitud RMA actualizada');
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error actualizando RMA:', error);
                alert('Error de conexión con el servidor');
            }
        };
    };

    // Delete RMA
    window.deleteRMA = async function(index) {
        const rma = rmaList[index];
        if (confirm('¿Estás seguro de eliminar esta solicitud RMA?')) {
            try {
                const response = await fetch(`/rma/api/rmas/${rma.id}/delete/`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                if (result.success) {
                    await loadRMAFromAPI();
                    alert('Solicitud RMA eliminada');
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error eliminando RMA:', error);
                alert('Error de conexión con el servidor');
            }
        }
    };

})();
