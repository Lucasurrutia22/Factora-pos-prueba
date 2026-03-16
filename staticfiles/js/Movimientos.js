/**
 * MOVIMIENTOS DE INVENTARIO - Scanner 2D + Gestión de Movimientos
 * Sistema completo para control de entrada/salida de stock con Scanner 2D
 */

// ============ CONFIGURACIÓN ============
const API_BASE = '/stock/api/movimientos';
let productoActual = null;
let codigoEscaneado = null;  // Guardar el código que se escaneó
let movimientoEditando = null;
let paginaActual = 1;
const LIMITE_PAGINA = 20;

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando módulo Movimientos de Inventario');
    
    // Configurar listeners
    configurarScannerListener();
    configurarFormularioMovimiento();
    configurarModalListeners();
    configurarFiltros();
    configurarBotones();
    
    // Cargar movimientos iniciales
    cargarMovimientos();
});

// ============ SCANNER 2D ============
function configurarScannerListener() {
    const scannerInput = document.getElementById('scannerInput');
    
    if (!scannerInput) return;
    
    scannerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const codigo = scannerInput.value.trim();
            
            if (codigo.length > 0) {
                buscarProductoPorCodigo(codigo);
            }
        }
    });
    
    // Botón Limpiar
    document.getElementById('btnClearScanner')?.addEventListener('click', () => {
        scannerInput.value = '';
        scannerInput.focus();
        limpiarProductoCard();
        mostrarStatus('', '');
    });
    
    // Focus automático al cargar
    scannerInput.focus();
}

function buscarProductoPorCodigo(codigo) {
    const statusEl = document.getElementById('scannerStatus');
    const url = `${API_BASE}/producto-codigo/?codigo=${encodeURIComponent(codigo)}`;
    
    console.log('Buscando: ' + url);
    
    fetch(url)
        .then(response => {
            console.log('Status:', response.status);
            console.log('Content-Type:', response.headers.get('content-type'));
            
            // Primero convertir a texto para ver qué llega
            return response.text().then(text => {
                console.log('Respuesta raw:', text);
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Error parseando JSON:', e);
                    throw new Error('JSON inválido: ' + text);
                }
            });
        })
        .then(data => {
            console.log('Respuesta parseada:', data);
            if (data.success) {
                productoActual = data.producto;
                codigoEscaneado = codigo;  // Guardar el código escaneado
                // Pasar el código escaneado (no el del producto en BD)
                mostrarProductoCard(data.producto, codigo);
                mostrarStatus('Producto encontrado', 'success');
                
                // Enfocar cantidad después de 500ms
                setTimeout(() => {
                    document.getElementById('cantidadMovimiento').focus();
                }, 500);
            } else {
                mostrarStatus('Error: ' + (data.error || 'Desconocido'), 'error');
                limpiarProductoCard();
                productoActual = null;
                codigoEscaneado = null;
            }
        })
        .catch(error => {
            console.error('Error buscando producto:', error);
            mostrarStatus('Error en búsqueda: ' + error.message, 'error');
        });
}

function mostrarProductoCard(producto, codigoEscaneado) {
    const card = document.getElementById('productoCard');
    
    document.getElementById('productoNombre').textContent = producto.nombre;
    // Usar el código escaneado si se proporciona, sino usar el del producto
    document.getElementById('productoCodigo').value = codigoEscaneado || producto.codigo_barra;
    document.getElementById('productoSKU').value = producto.sku || 'N/A';
    document.getElementById('productoUbicacion').value = producto.ubicacion || 'Sin especificar';
    document.getElementById('productoCategoria').value = producto.categoria || 'General';
    
    card.classList.remove('hidden');
    
    // Cerrar card
    document.getElementById('btnCerrarProducto')?.addEventListener('click', () => {
        card.classList.add('hidden');
        productoActual = null;
        document.getElementById('scannerInput').focus();
    });
}

function limpiarProductoCard() {
    document.getElementById('productoCard').classList.add('hidden');
}

function mostrarStatus(mensaje, tipo) {
    const statusEl = document.getElementById('scannerStatus');
    statusEl.textContent = mensaje;
    statusEl.className = 'scanner-status';
    
    if (tipo === 'success') {
        statusEl.classList.add('success');
    } else if (tipo === 'error') {
        statusEl.classList.add('error');
    }
    
    // Limpiar después de 5 segundos
    setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'scanner-status';
    }, 5000);
}

// ============ FORMULARIO MOVIMIENTO ============
function configurarFormularioMovimiento() {
    const form = document.getElementById('formMovimiento');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        enviarMovimiento();
    });
}

function enviarMovimiento() {
    if (!productoActual) {
        mostrarToast('Escanee un producto primero', 'error');
        return;
    }
    
    const cantidad = parseFloat(document.getElementById('cantidadMovimiento').value);
    const tipo = document.getElementById('tipoMovimiento').value;
    const motivo = document.getElementById('motivoMovimiento').value.trim();
    const referencia = document.getElementById('referenciaMovimiento').value.trim();
    
    // Obtener datos editables de la tarjeta
    const ubicacion = document.getElementById('productoUbicacion').value.trim();
    const categoria = document.getElementById('productoCategoria').value.trim();
    
    // Validaciones
    if (!cantidad || cantidad <= 0) {
        mostrarToast('Cantidad inválida', 'error');
        return;
    }
    
    if (!tipo) {
        mostrarToast('Seleccione tipo de movimiento', 'error');
        return;
    }
    
    if (!motivo) {
        mostrarToast('Ingrese motivo del movimiento', 'error');
        return;
    }
    
    const payload = {
        producto_id: productoActual.id,
        tipo: tipo,
        cantidad: cantidad,
        motivo: motivo,
        referencia_externa: referencia,
        ubicacion: ubicacion,
        categoria: categoria,
        codigo_escaneado: codigoEscaneado  // Incluir el código escaneado
    };
    
    fetch(`${API_BASE}/crear/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarToast(`✓ Movimiento registrado: ${data.movimiento.cantidad} unidades`, 'success');
            
            // Limpiar formulario
            document.getElementById('formMovimiento').reset();
            limpiarProductoCard();
            productoActual = null;
            
            // Recargar tabla y enfocar scanner
            cargarMovimientos();
            document.getElementById('scannerInput').focus();
        } else {
            mostrarToast('✗ ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarToast('Error al crear movimiento', 'error');
    });
}

// ============ CARGAR MOVIMIENTOS ============
function configurarFiltros() {
    const filterCodigo = document.getElementById('filterCodigo');
    
    if (filterCodigo) {
        filterCodigo.addEventListener('keyup', () => {
            cargarMovimientos(1);
        });
    }
}

function configurarBotones() {
    const btnPrevPage = document.getElementById('btnPrevPage');
    const btnNextPage = document.getElementById('btnNextPage');
    
    if (btnPrevPage) {
        btnPrevPage.addEventListener('click', () => {
            if (paginaActual > 1) {
                cargarMovimientos(paginaActual - 1);
            }
        });
    }
    
    if (btnNextPage) {
        btnNextPage.addEventListener('click', () => {
            cargarMovimientos(paginaActual + 1);
        });
    }
}

function cargarMovimientos(pagina = 1) {
    paginaActual = pagina;
    const offset = (pagina - 1) * LIMITE_PAGINA;
    
    // Obtener valores de filtros
    const filterCodigo = document.getElementById('filterCodigo')?.value.trim() || '';
    
    let url = `${API_BASE}/listar/?limit=${LIMITE_PAGINA}&offset=${offset}`;
    
    if (filterCodigo) {
        url += `&codigo=${encodeURIComponent(filterCodigo)}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderizarTabla(data.movimientos);
                actualizarPaginacion(data.total, pagina);
            }
        })
        .catch(error => console.error('Error cargando movimientos:', error));
}

function renderizarTabla(movimientos) {
    const tbody = document.getElementById('tbodyMovimientos');
    
    if (movimientos.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="11">No hay movimientos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = movimientos.map(mov => {
        const fechaFormato = new Date(mov.fecha).toLocaleString('es-CL');
        const badge = obtenerBadgeTipo(mov.tipo);
        // Mostrar código escaneado si existe, sino mostrar código del producto
        const codigoMostrar = mov.codigo_escaneado || mov.producto.codigo_barra || 'N/A';
        // Mostrar SKU correlativo si existe, sino mostrar SKU del producto
        const skuMostrar = mov.sku_correlativo || mov.producto.sku || 'N/A';
        
        return `
            <tr>
                <td>${fechaFormato}</td>
                <td><span class="badge ${badge}">${mov.tipo}</span></td>
                <td><strong>${mov.producto.nombre}</strong></td>
                <td>${codigoMostrar}</td>
                <td>${skuMostrar}</td>
                <td>${mov.cantidad}</td>
                <td>${mov.producto.ubicacion || 'Sin especificar'}</td>
                <td>${mov.producto.categoria || 'General'}</td>
                <td>${mov.usuario}</td>
                <td title="${mov.motivo}">${mov.motivo.substring(0, 30)}...</td>
                <td>${mov.referencia_externa || '-'}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-action btn-edit" onclick="abrirModalEditar(${mov.id})" title="Editar">✏️</button>
                        <button class="btn-action btn-delete" onclick="abrirModalEliminar(${mov.id})" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function obtenerBadgeTipo(tipo) {
    const tipos = {
        'ENTRADA': 'badge-entrada',
        'SALIDA': 'badge-salida',
        'AJUSTE': 'badge-ajuste',
        'DEVOLUCION': 'badge-devolucion',
        'TRANSFERENCIA': 'badge-transferencia'
    };
    return tipos[tipo] || 'badge-ajuste';
}

function esMismodia(fecha) {
    const hoy = new Date();
    const fechaMovimiento = new Date(fecha);
    return hoy.toDateString() === fechaMovimiento.toDateString();
}

function actualizarPaginacion(total, paginaActual) {
    const totalPaginas = Math.ceil(total / LIMITE_PAGINA);
    
    document.getElementById('paginaInfo').textContent = `Página ${paginaActual} de ${totalPaginas} (${total} movimientos)`;
    
    document.getElementById('btnPrevPage').disabled = paginaActual <= 1;
    document.getElementById('btnNextPage').disabled = paginaActual >= totalPaginas;
    
    document.getElementById('btnPrevPage').onclick = () => cargarMovimientos(paginaActual - 1);
    document.getElementById('btnNextPage').onclick = () => cargarMovimientos(paginaActual + 1);
}

// ============ MODALES EDITAR/ELIMINAR ============
function configurarModalListeners() {
    // Editar
    document.getElementById('formEditar')?.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarEdicion();
    });
    
    // Eliminar
    document.getElementById('btnConfirmDelete')?.addEventListener('click', confirmarEliminar);
    
    // Cerrar modales con botones
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.dataset.close;
            document.getElementById(modalId).classList.add('hidden');
        });
    });
}

function abrirModalEditar(movimientoId) {
    fetch(`${API_BASE}/${movimientoId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                movimientoEditando = data.movimiento;
                
                // Llenar todos los campos
                document.getElementById('editProducto').value = data.movimiento.producto.nombre;
                document.getElementById('editTipo').value = data.movimiento.tipo;
                document.getElementById('editCantidad').value = data.movimiento.cantidad;
                document.getElementById('editUbicacion').value = data.movimiento.producto.ubicacion || 'Sin especificar';
                document.getElementById('editCategoria').value = data.movimiento.producto.categoria || 'General';
                document.getElementById('editCodigo').value = data.movimiento.codigo_escaneado || data.movimiento.producto.codigo_barra || 'N/A';
                document.getElementById('editMotivo').value = data.movimiento.motivo;
                document.getElementById('editReferencia').value = data.movimiento.referencia_externa;
                
                document.getElementById('modalEditar').classList.remove('hidden');
            }
        })
        .catch(error => console.error('Error:', error));
}

function guardarEdicion() {
    if (!movimientoEditando) return;
    
    const cantidad = parseFloat(document.getElementById('editCantidad').value);
    const motivo = document.getElementById('editMotivo').value.trim();
    const referencia = document.getElementById('editReferencia').value.trim();
    const ubicacion = document.getElementById('editUbicacion').value.trim();
    const categoria = document.getElementById('editCategoria').value.trim();
    
    if (!cantidad || cantidad <= 0) {
        mostrarToast('Cantidad inválida', 'error');
        return;
    }
    
    const payload = {
        cantidad: cantidad,
        motivo: motivo,
        referencia_externa: referencia,
        ubicacion: ubicacion,
        categoria: categoria
    };
    
    fetch(`${API_BASE}/${movimientoEditando.id}/editar/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarToast('Movimiento actualizado correctamente', 'success');
            document.getElementById('modalEditar').classList.add('hidden');
            cargarMovimientos(paginaActual);
        } else {
            mostrarToast('Error: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarToast('Error al actualizar', 'error');
    });
}

function abrirModalEliminar(movimientoId) {
    movimientoEditando = { id: movimientoId };
    document.getElementById('modalEliminar').classList.remove('hidden');
}

function confirmarEliminar() {
    if (!movimientoEditando) return;
    
    fetch(`${API_BASE}/${movimientoEditando.id}/eliminar/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarToast('✓ Movimiento eliminado. Stock revertido.', 'success');
            document.getElementById('modalEliminar').classList.add('hidden');
            cargarMovimientos(paginaActual);
        } else {
            mostrarToast('✗ ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarToast('Error al eliminar', 'error');
    });
}

// ============ UTILIDADES ============
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.className = `toast ${tipo}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

console.log('✅ Movimientos.js cargado correctamente');
