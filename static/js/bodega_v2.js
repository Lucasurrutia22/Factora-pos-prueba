// bodega_v2.js obsoleto — loader para Bodega.js
console.warn('bodega_v2.js obsoleto — cargando Bodega.js');
(function(){
    try{
        var s = document.createElement('script');
        s.src = '/static/js/Bodega.js?v=' + (new Date().getTime());
        s.defer = true;
        document.head.appendChild(s);
    }catch(e){ console.error('No se pudo cargar Bodega.js', e); }
})();

// Toggle dropdown menu
function toggleProfileMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const userProfile = document.querySelector('.user-profile-wrapper');
    
    if (userProfile && !userProfile.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// logoutSession provided centrally in js/auth.js

// Open user profile
function openUserProfile(event) {
    event.preventDefault();
    const user = JSON.parse(sessionStorage.getItem('factora_user') || 'null') || { username: 'Admin Usuario', email: '', role: 'Administrador' };
    document.getElementById('profileUsername').value = user.username || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileRole').value = user.role || 'Administrador';
    openModalById('userProfileModal');
}

// Open settings
function openSettings(event) {
    event.preventDefault();
    const settings = JSON.parse(localStorage.getItem('factora_settings') || 'null') || { theme: 'light', notifications: true };
    document.getElementById('settingTheme').value = settings.theme || 'light';
    document.getElementById('settingNotifications').checked = !!settings.notifications;
    openModalById('settingsModal');
}

// Modal helpers
function openModalById(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

function closeModalById(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

function saveUserProfile(e) {
    e.preventDefault();
    const username = document.getElementById('profileUsername').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const role = document.getElementById('profileRole').value;

    const user = { username, email, role };
    sessionStorage.setItem('factora_user', JSON.stringify(user));

    const welcomeEl = document.getElementById('welcomeText');
    const roleEl = document.getElementById('roleText');
    const avatarEl = document.getElementById('userAvatar');
    if (welcomeEl) welcomeEl.textContent = username;
    if (roleEl) roleEl.textContent = role;
    if (avatarEl) avatarEl.textContent = username.charAt(0) || 'A';

    closeModalById('userProfileModal');
}

function saveSettings(e) {
    e.preventDefault();
    const theme = document.getElementById('settingTheme').value;
    const notifications = document.getElementById('settingNotifications').checked;
    const settings = { theme, notifications };
    localStorage.setItem('factora_settings', JSON.stringify(settings));

    applyTheme(theme);
    closeModalById('settingsModal');
}

function applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('theme-dark');
    else document.body.classList.remove('theme-dark');
}

// Apply theme on load
const savedSettings = JSON.parse(localStorage.getItem('factora_settings') || 'null');
if (savedSettings && savedSettings.theme) applyTheme(savedSettings.theme);

// ============== FUNCIONES DE BODEGA ==============

// Obtener productos del inventario en tiempo real
function getInventoryProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

let currentPage = 1;
let itemsPerPage = 10;
let filteredData = [];
let chartsInstances = {};
let products = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    refreshInventoryData();
    updateBodegaView();
    setupEventListeners();
});

// Refrescar datos del inventario
function refreshInventoryData() {
    products = getInventoryProducts();
}

function setupEventListeners() {
    const periodEl = document.getElementById('reportPeriod');
    if (periodEl) {
        periodEl.addEventListener('change', (e) => {
            if (e.target.value === 'personalizado') {
                const dr = document.getElementById('dateRangeGroup');
                if (dr) dr.style.display = 'flex';
            } else {
                const dr = document.getElementById('dateRangeGroup');
                if (dr) dr.style.display = 'none';
            }
        });
    }

    const prev = document.getElementById('prevPage');
    if (prev) prev.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    const next = document.getElementById('nextPage');
    if (next) next.addEventListener('click', () => {
        const maxPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < maxPages) {
            currentPage++;
            renderTable();
        }
    });

    const reportTypeEl = document.getElementById('reportType');
    if (reportTypeEl) reportTypeEl.addEventListener('change', (e) => {
        updateBodegaView();
    });
}

function updateBodegaView() {
    currentPage = 1;
    refreshInventoryData();
    generateSolicitudesBodega();
    renderTable();
    updateStats();
    updateCharts('solicitudes');
}

function populateProductSelect() {
    const sel = document.getElementById('productSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccionar producto --</option>';
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.sku || p.id || (p.nombre || p.name);
        opt.textContent = p.name || p.nombre || p.sku || opt.value;
        sel.appendChild(opt);
    });
}

function generateSolicitudesBodega() {
    const tipoEl = document.getElementById('solicitudTipo');
    const tipo = tipoEl ? (tipoEl.value || '') : '';
    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.textContent = `Bodega - Solicitudes - ${tipo || 'Todos'}`;

    let listUrl = '/inventario/api/coordinacion/solicitudes/';
    if (tipo) listUrl += '?tipo=' + encodeURIComponent(tipo);

    console.debug('generateSolicitudesBodega: requesting', listUrl);
    fetch(listUrl)
        .then(res => {
            if (!res.ok) {
                console.error('Listado solicitudes responded with', res.status, res.statusText);
                throw new Error('Error al obtener listado de solicitudes');
            }
            return res.text();
        })
        .then(text => {
            let listPayload;
            try {
                listPayload = JSON.parse(text);
            } catch (err) {
                console.error('Respuesta no es JSON válido para solicitudes:', text);
                throw err;
            }
            const rows = Array.isArray(listPayload) ? listPayload : (listPayload.results || []);
            if (!rows.length) {
                console.warn('No hay solicitudes en Inventario', listPayload);
                filteredData = [];
                renderTableHeaders(['Código','Cliente','Sucursal','Tipo','Fecha Instalación','Técnico','Estado','Equipos Instalados','Datos Red','Acciones']);
                renderTable();
                updateStats();
                return;
            }

            filteredData = rows.map(s => {
                const codigo = s.numero_solicitud || s.codigo_solicitud || s.codigo || '';
                const cliente = s.cliente_nombre || (s.cliente && s.cliente.nombre) || '';
                const sucursal = s.sucursal_nombre || (s.sucursal && s.sucursal.nombre) || (typeof s.sucursal === 'string' ? s.sucursal : '') || '';
                const fecha_instalacion = (s.coordinacion_tecnica && (s.coordinacion_tecnica.fecha_instalacion || s.coordinacion_tecnica.fecha_visita)) || s.fecha_solicitada || s.fecha || '';
                const tecnico = (s.coordinacion_tecnica && (s.coordinacion_tecnica.tecnico || s.coordinacion_tecnica.tecnico_nombre)) || s.tecnico_asignado || '';
                const tipo_solicitud = s.tipo_solicitud || s.tipo || (s.tipo_solicitud_display || '') ;
                const estado = s.estado || s.estado_display || '';

                const equiposCandidates = [s.equipos, s.equipos_instalados, s.equiposInstalados, s.equipos_json];
                let equiposArr = [];
                for (const cand of equiposCandidates) {
                    if (Array.isArray(cand)) { equiposArr = cand; break; }
                    if (typeof cand === 'string' && cand.trim()) {
                        const parsed = safeParseJSON(cand);
                        if (Array.isArray(parsed)) { equiposArr = parsed; break; }
                    }
                }

                const equiposText = equiposArr.map(e => {
                    const tipoEq = e.tipo || e.nombre || e.modelo || e.descripcion || e.name || '';
                    const cantidad = (e.cantidad || e.cantidad_instalada || e.qty || '') ? ` x${e.cantidad || e.cantidad_instalada || e.qty}` : '';
                    const version = e.version || e.modelo_version || e.model || '';
                    const sn = e.numero_serie || e.serial || e.sn || '';
                    const obs = e.observaciones || e.observacion || e.note || '';
                    const parts = [tipoEq + cantidad];
                    if (version) parts.push(version);
                    if (sn) parts.push('SN:' + sn);
                    if (obs) parts.push(obs);
                    return parts.join(' / ');
                }).join('\n');

                const datos_red_raw = s.datos_red || s.datosRed || s.red || '';
                const datos_red = formatDatosRed(datos_red_raw);

                const actions = `<a class="btn-small btn-secondary" href="/inventario/api/coordinacion/solicitudes/${s.id}/" target="_blank">Ver</a>`;

                const mapped = {
                    codigo: codigo,
                    cliente: cliente,
                    sucursal: sucursal,
                    tipo: tipo_solicitud || '',
                    fecha_instalacion: fecha_instalacion || '',
                    tecnico: tecnico || '',
                    estado: estado || '',
                    equipos: `<pre style="white-space:pre-wrap; font-family:inherit;">${escapeHtml(equiposText)}</pre>`,
                    red: escapeHtml(datos_red || ''),
                    acciones: actions
                };

                console.debug('solicitud mapped', { id: s.id, source: s, mapped: mapped });

                return mapped;
            });
            renderTableHeaders(['Código','Cliente','Sucursal','Tipo','Fecha Instalación','Técnico','Estado','Equipos Instalados','Datos Red','Acciones']);
            renderTable();
            updateStats();
        })
        .catch(err => {
            console.error('generateSolicitudesBodega error', err);
            filteredData = [];
            renderTableHeaders(['Código','Cliente','Sucursal','Fecha Instalación','Técnico','Estado','Equipos Instalados','Datos Red']);
            const tbody = document.getElementById('reportTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8">No se pudieron cargar las solicitudes. Revisa la consola y la respuesta del endpoint.</td></tr>';
            }
            updateStats();
        });
}

function generateProductDetailReport() {
    const sku = document.getElementById('productSelect').value;
    if (!sku) { filteredData = []; renderTable(); return; }
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const p = products.find(x => (x.sku === sku) || (String(x.id) === sku) || (x.name === sku) || (x.nombre === sku));
    if (!p) { filteredData = []; renderTable(); return; }

    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.textContent = `Bodega - Producto - ${p.name || p.nombre || p.sku}`;
    filteredData = [{
        sku: p.sku || 'N/A',
        producto: p.name || p.nombre || 'Sin nombre',
        stock: p.stock || 0,
        precioCompra: p.costPrice || p.precioCompra || 0,
        precioVenta: p.salePrice || p.precio || 0,
        margen: parseFloat((((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 1) * 100).toFixed(1)) || 0,
        descripcion: p.descripcion || p.description || ''
    }];

    renderTableHeaders(['SKU','Producto','Stock','Precio Compra','Precio Venta','Margen %','Descripción']);
    renderTable();
}

function generateInstallationsReport() {
    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.textContent = 'Bodega - Instalaciones - Detalle de Equipos';

    const apiUrl = '/bodega/api/instalaciones/';
    fetch(apiUrl)
        .then(res => {
            if (!res.ok) throw new Error('Error al obtener instalaciones');
            return res.json();
        })
        .then(payload => {
            const rows = (payload && payload.results) ? payload.results : [];
            filteredData = rows.map(s => {
                const equiposText = (s.equipos || []).map(e => `${e.tipo} x${e.cantidad}${e.version ? ' / ' + e.version : ''}${e.numero_serie ? ' / SN:' + e.numero_serie : ''}${e.observaciones ? ' - ' + e.observaciones : ''}`).join('\n');

                return {
                    codigo: s.codigo || '',
                    cliente: s.cliente || '',
                    sucursal: s.sucursal || '',
                    fecha_instalacion: s.fecha_instalacion || '',
                    tecnico: s.tecnico || '',
                    estado: s.estado || (s.status || ''),
                    equipos: `<pre style="white-space:pre-wrap; font-family:inherit;">${escapeHtml(equiposText)}</pre>`,
                    red: ''
                };
            });

            const headers = ['Código', 'Cliente', 'Sucursal', 'Fecha Instalación', 'Técnico', 'Estado', 'Equipos Instalados', 'Datos Red'];
            renderTableHeaders(headers);
            renderTable();
            updateStats();
            updateCharts('instalaciones');
        })
        .catch(err => {
            console.error('generateInstallationsReport error', err);
            filteredData = [];
            renderTableHeaders(['Código', 'Cliente', 'Sucursal', 'Fecha Instalación', 'Técnico', 'Estado', 'Equipos Instalados', 'Datos Red']);
            renderTable();
        });
}

// pequeño helper para escapar texto antes de insertar en HTML
function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Parsea JSON de forma segura, devuelve null si falla
function safeParseJSON(str) {
    if (!str || typeof str !== 'string') return null;
    try {
        return JSON.parse(str);
    } catch (e) {
        try {
            return JSON.parse(str.replace(/'/g, '"'));
        } catch (e2) {
            console.debug('safeParseJSON fallback failed for:', str);
            return null;
        }
    }
}

// Formatea datos_red que puede venir como string o como objeto
function formatDatosRed(raw) {
    if (!raw && raw !== 0) return '';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') {
        const keys = ['ip', 'gateway', 'subnet', 'ssid', 'password', 'vlan'];
        const pieces = [];
        keys.forEach(k => {
            if (raw[k]) pieces.push(`${k}: ${raw[k]}`);
        });
        if (pieces.length) return pieces.join(' / ');
        try { return JSON.stringify(raw); } catch (e) { return String(raw); }
    }
    return String(raw);
}

function generateSalesReport() {
    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.textContent = 'Bodega - Inventario (Ventas Potenciales)';
    
    filteredData = products.map(p => ({
        fecha: new Date().toISOString().split('T')[0],
        producto: p.name || p.nombre || 'Sin nombre',
        cantidad: p.stock || 0,
        monto: ((p.salePrice || p.precio || 0) * (p.stock || 0)),
        margen: parseFloat((((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 1) * 100).toFixed(1)) || 0
    }));
    
    const headers = ['Fecha', 'Producto', 'Cantidad', 'Monto Potencial', 'Margen %'];
    renderTableHeaders(headers);
}

function generateInventoryReport() {
    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.textContent = 'Bodega - Inventario Detallado';
    
    filteredData = products.map(p => ({
        sku: p.sku || 'N/A',
        producto: p.name || p.nombre || 'Sin nombre',
        categoria: p.category || p.categoria || 'Sin categoría',
        stock: p.stock || 0,
        precioCompra: p.costPrice || p.precioCompra || 0,
        precioVenta: p.salePrice || p.precio || 0,
        margen: parseFloat((((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 1) * 100).toFixed(1)) || 0,
        valorTotal: ((p.costPrice || 0) * (p.stock || 0))
    }));
    
    const headers = ['SKU', 'Producto', 'Categoría', 'Stock', 'Precio Compra', 'Precio Venta', 'Margen %', 'Valor Total'];
    renderTableHeaders(headers);
}

function generateTopProductsReport() {
    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.textContent = 'Bodega - Productos en Inventario (Por Valor Total)';
    
    filteredData = products
        .map(p => ({
            producto: p.name || p.nombre || 'Sin nombre',
            sku: p.sku || 'N/A',
            stock: p.stock || 0,
            categoria: p.category || p.categoria || 'Sin categoría',
            precioVenta: p.salePrice || p.precio || 0,
            margen: parseFloat((((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 1) * 100).toFixed(1)) || 0,
            valorInventario: ((p.costPrice || 0) * (p.stock || 0))
        }))
        .sort((a, b) => b.valorInventario - a.valorInventario);
    
    const headers = ['Producto', 'SKU', 'Stock', 'Categoría', 'Precio Venta', 'Margen %', 'Valor Inventario'];
    renderTableHeaders(headers);
}

function generateStockReport() {
    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.textContent = 'Bodega - Estado de Stock';
    
    filteredData = products
        .map(p => ({
            producto: p.name || p.nombre || 'Sin nombre',
            sku: p.sku || 'N/A',
            stock: p.stock || 0,
            minStock: p.minStock || 5,
            estado: (p.stock || 0) === 0 ? 'Agotado' : (p.stock || 0) <= (p.minStock || 5) ? 'Stock Bajo' : 'Disponible',
            categoria: p.category || p.categoria || 'Sin categoría',
            precioVenta: p.salePrice || p.precio || 0
        }))
        .sort((a, b) => a.stock - b.stock);
    
    const headers = ['Producto', 'SKU', 'Stock Actual', 'Stock Mínimo', 'Estado', 'Categoría', 'Precio Venta'];
    renderTableHeaders(headers);
}

function renderTableHeaders(headers) {
    const thead = document.getElementById('reportTableHeader');
    if (!thead) return;
    thead.innerHTML = headers.map(h => `<th>${h}</th>`).join('');
}

function renderTable() {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    pageData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = Object.values(row)
            .map(val => {
                if (typeof val === 'number') {
                    if (val > 1000 && val === Math.floor(val)) {
                        return `<td>$${val.toLocaleString()}</td>`;
                    }
                    return `<td>${val.toFixed ? val.toFixed(2) : val}</td>`;
                }
                return `<td>${val}</td>`;
            })
            .join('');
        tbody.appendChild(tr);
    });
    
    updatePagination();
}

function updatePagination() {
    const maxPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${maxPages}`;
    
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    if (prev) prev.disabled = currentPage === 1;
    if (next) next.disabled = currentPage === maxPages;
}

function updateStats() {
    const reportTypeEl = document.getElementById('reportType');
    const reportType = reportTypeEl ? reportTypeEl.value : 'inventario';
    
    if (reportType === 'ventas') {
        const totalSales = filteredData.reduce((sum, d) => sum + (d.monto || 0), 0);
        const totalUnits = filteredData.reduce((sum, d) => sum + (d.cantidad || 0), 0);
        const avgMargin = filteredData.length > 0 ? (filteredData.reduce((sum, d) => sum + (d.margen || 0), 0) / filteredData.length).toFixed(1) : 0;
        
        const totalSalesEl = document.getElementById('totalSales'); if (totalSalesEl) totalSalesEl.textContent = '$' + totalSales.toLocaleString();
        const totalUnitsEl = document.getElementById('totalUnits'); if (totalUnitsEl) totalUnitsEl.textContent = totalUnits;
        const avgMarginEl = document.getElementById('avgMargin'); if (avgMarginEl) avgMarginEl.textContent = avgMargin + '%';
        const growthEl = document.getElementById('growth'); if (growthEl) growthEl.textContent = 'Potencial';
    } else if (reportType === 'inventario') {
        const totalValue = filteredData.reduce((sum, d) => sum + (d.valorTotal || 0), 0);
        const totalStock = filteredData.reduce((sum, d) => sum + (d.stock || 0), 0);
        const avgMargin = filteredData.length > 0 ? (filteredData.reduce((sum, d) => sum + (d.margen || 0), 0) / filteredData.length).toFixed(1) : 0;
        
        const totalSalesEl = document.getElementById('totalSales'); if (totalSalesEl) totalSalesEl.textContent = '$' + totalValue.toLocaleString();
        const totalUnitsEl = document.getElementById('totalUnits'); if (totalUnitsEl) totalUnitsEl.textContent = totalStock + ' unidades';
        const avgMarginEl = document.getElementById('avgMargin'); if (avgMarginEl) avgMarginEl.textContent = avgMargin + '%';
        const growthEl = document.getElementById('growth'); if (growthEl) growthEl.textContent = filteredData.length + ' productos';
    } else if (reportType === 'productos') {
        const totalValue = filteredData.reduce((sum, d) => sum + (d.valorInventario || 0), 0);
        const totalStock = filteredData.reduce((sum, d) => sum + (d.stock || 0), 0);
        const avgMargin = filteredData.length > 0 ? (filteredData.reduce((sum, d) => sum + (d.margen || 0), 0) / filteredData.length).toFixed(1) : 0;
        
        const totalSalesEl = document.getElementById('totalSales'); if (totalSalesEl) totalSalesEl.textContent = '$' + totalValue.toLocaleString();
        const totalUnitsEl = document.getElementById('totalUnits'); if (totalUnitsEl) totalUnitsEl.textContent = totalStock + ' unidades';
        const avgMarginEl = document.getElementById('avgMargin'); if (avgMarginEl) avgMarginEl.textContent = avgMargin + '%';
        const growthEl = document.getElementById('growth'); if (growthEl) growthEl.textContent = 'Top ' + Math.min(5, filteredData.length);
    } else if (reportType === 'stock') {
        const totalStock = filteredData.reduce((sum, d) => sum + (d.stock || 0), 0);
        const agotados = filteredData.filter(d => d.estado === 'Agotado').length;
        const bajos = filteredData.filter(d => d.estado === 'Stock Bajo').length;
        const disponibles = filteredData.filter(d => d.estado === 'Disponible').length;
        
        const totalSalesEl = document.getElementById('totalSales'); if (totalSalesEl) totalSalesEl.textContent = totalStock + ' unidades';
        const totalUnitsEl = document.getElementById('totalUnits'); if (totalUnitsEl) totalUnitsEl.textContent = agotados + ' agotados';
        const avgMarginEl = document.getElementById('avgMargin'); if (avgMarginEl) avgMarginEl.textContent = bajos + ' bajos';
        const growthEl = document.getElementById('growth'); if (growthEl) growthEl.textContent = disponibles + ' disponibles';
    }
}

function updateCharts(reportType) {
    if (reportType === 'ventas' || reportType === 'inventario') {
        updateCategoryChart();
        updateProductChart();
    } else if (reportType === 'productos') {
        updateProductChart();
        updateInventoryCharts();
    } else if (reportType === 'stock') {
        updateStockCharts();
        updateCategoryChart();
    }
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const reportTypeEl = document.getElementById('reportType');
    const reportType = reportTypeEl ? reportTypeEl.value : 'inventario';
    const categories = {};
    
    filteredData.forEach(d => {
        const key = d.categoria || 'Sin categoría';
        if (reportType === 'ventas' || reportType === 'inventario') {
            categories[key] = (categories[key] || 0) + (d.monto || d.valorTotal || 0);
        } else if (reportType === 'stock') {
            categories[d.estado || 'Desconocido'] = (categories[d.estado || 'Desconocido'] || 0) + 1;
        }
    });
    
    if (chartsInstances.categoryChart) chartsInstances.categoryChart.destroy();
    
    chartsInstances.categoryChart = new Chart(ctx, {
        type: reportType === 'stock' ? 'doughnut' : 'bar',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                label: reportType === 'stock' ? 'Estado de Stock' : 'Valor por Categoría',
                data: Object.values(categories),
                backgroundColor: reportType === 'stock' 
                    ? ['#10b981', '#f59e0b', '#ef4444']
                    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
                borderColor: '#ffffff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: reportType === 'stock' ? 'bottom' : 'top'
                }
            }
        }
    });
}

function updateProductChart() {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    
    const reportTypeEl = document.getElementById('reportType');
    const reportType = reportTypeEl ? reportTypeEl.value : 'inventario';
    const topProducts = filteredData.slice(0, 8);
    
    if (chartsInstances.trendsChart) chartsInstances.trendsChart.destroy();
    
    chartsInstances.trendsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProducts.map(d => (d.producto || 'Sin nombre').substring(0, 15)),
            datasets: [{
                label: reportType === 'inventario' ? 'Valor Inventario' : reportType === 'productos' ? 'Valor Total' : 'Stock',
                data: topProducts.map(d => 
                    reportType === 'ventas' ? (d.monto || 0) : 
                    reportType === 'inventario' ? (d.valorTotal || 0) :
                    reportType === 'productos' ? (d.valorInventario || 0) :
                    (d.stock || 0)
                ),
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateInventoryCharts() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const byCategory = {};
    filteredData.forEach(d => {
        const key = d.categoria || 'Sin categoría';
        byCategory[key] = (byCategory[key] || 0) + (d.stock || 0);
    });
    
    if (chartsInstances.categoryChart) chartsInstances.categoryChart.destroy();
    
    chartsInstances.categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(byCategory),
            datasets: [{
                label: 'Stock por Categoría',
                data: Object.values(byCategory),
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateStockCharts() {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    
    const states = { 'Disponible': 0, 'Stock Bajo': 0, 'Agotado': 0 };
    filteredData.forEach(d => {
        states[d.estado]++;
    });
    
    if (chartsInstances.trendsChart) chartsInstances.trendsChart.destroy();
    
    chartsInstances.trendsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(states),
            datasets: [{
                data: Object.values(states),
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function resetFilters() {
    const reportTypeEl = document.getElementById('reportType'); if (reportTypeEl) reportTypeEl.value = 'inventario';
    const reportPeriodEl = document.getElementById('reportPeriod'); if (reportPeriodEl) reportPeriodEl.value = 'mes';
    const start = document.getElementById('startDate'); if (start) start.value = '';
    const end = document.getElementById('endDate'); if (end) end.value = '';
    const dr = document.getElementById('dateRangeGroup'); if (dr) dr.style.display = 'none';
    
    updateBodegaView();
}

function printReport() {
    window.print();
}

function exportReportCSV() {
    const headerEls = document.querySelectorAll('#reportTableHeader th');
    const headers = headerEls ? Array.from(headerEls).map(th => th.textContent) : [];
    const rows = Array.from(document.querySelectorAll('#reportTableBody tr')).map(tr => 
        Array.from(tr.querySelectorAll('td')).map(td => td.textContent)
    );
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(val => `"${val}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bodega_inventario_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
}

function exportReportPDF() {
    const printElement = document.createElement('div');
    printElement.style.padding = '20px';
    printElement.style.backgroundColor = 'white';
    printElement.style.color = 'black';
    printElement.style.fontFamily = 'Arial, sans-serif';
    
    // Título del reporte
    const title = document.createElement('h1');
    title.textContent = 'REPORTE DE BODEGA';
    title.style.textAlign = 'center';
    title.style.marginBottom = '10px';
    title.style.color = '#333';
    title.style.borderBottom = '3px solid #d84315';
    title.style.paddingBottom = '10px';
    printElement.appendChild(title);
    
    // Fecha de generación
    const dateInfo = document.createElement('p');
    dateInfo.textContent = `Fecha de generación: ${new Date().toLocaleString('es-CL')}`;
    dateInfo.style.fontSize = '12px';
    dateInfo.style.marginBottom = '20px';
    dateInfo.style.color = '#666';
    dateInfo.style.textAlign = 'center';
    printElement.appendChild(dateInfo);
    
    // TOTAL BOX
    const totalBox = document.getElementById('totalBox');
    if (totalBox) {
        const totalClone = totalBox.cloneNode(true);
        totalClone.style.fontSize = '16px';
        totalClone.style.marginBottom = '20px';
        totalClone.style.padding = '15px';
        totalClone.style.fontWeight = 'bold';
        totalClone.style.textAlign = 'center';
        printElement.appendChild(totalClone);
    }
    
    // Función auxiliar para formatear tablas
    function formatTable(table) {
        if (!table) return null;
        
        const tableClone = table.cloneNode(true);
        tableClone.style.width = '100%';
        tableClone.style.borderCollapse = 'collapse';
        tableClone.style.fontSize = '11px';
        tableClone.style.marginBottom = '20px';
        
        // Eliminar botones de acciones de las celdas pero mantener los valores
        const rows = tableClone.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td, th');
            
            // Para filas de datos (no encabezado), limpiar botones de la última columna
            if (cells.length > 0 && rowIndex > 0) {
                const lastCell = cells[cells.length - 1];
                // Si contiene botones, remover solo los botones pero mantener el texto/valor
                if (lastCell.innerHTML.includes('onclick')) {
                    // Extraer solo el primer span que contiene el valor
                    const valueSpan = lastCell.querySelector('span');
                    if (valueSpan) {
                        lastCell.innerHTML = valueSpan.textContent;
                    }
                }
            }
            
            // Estilos para filas
            row.style.borderBottom = '1px solid #ccc';
            if (rowIndex === 0) {
                row.style.backgroundColor = '#d84315';
                row.style.color = 'white';
                row.style.fontWeight = 'bold';
            } else {
                row.style.backgroundColor = rowIndex % 2 === 0 ? '#f9f9f9' : 'white';
            }
            
            row.querySelectorAll('td, th').forEach(cell => {
                cell.style.padding = '8px';
                cell.style.textAlign = 'center';
                cell.style.border = '1px solid #ddd';
            });
        });
        
        return tableClone;
    }
    
    // Agregar tablas de Equipos, Materiales y Repuestos
    const cards = document.querySelectorAll('.report-card');
    
    cards.forEach((card, index) => {
        const cardTitle = card.querySelector('h3');
        if (cardTitle) {
            const sectionTitle = document.createElement('h2');
            sectionTitle.textContent = cardTitle.textContent;
            sectionTitle.style.fontSize = '14px';
            sectionTitle.style.marginTop = '20px';
            sectionTitle.style.marginBottom = '10px';
            sectionTitle.style.color = '#333';
            sectionTitle.style.borderLeft = '4px solid #d84315';
            sectionTitle.style.paddingLeft = '10px';
            printElement.appendChild(sectionTitle);
        }
        
        const table = card.querySelector('table');
        const formattedTable = formatTable(table);
        if (formattedTable) {
            printElement.appendChild(formattedTable);
        }
        
        // Agregar salto de página después de cada sección
        if (index < cards.length - 1) {
            const pageBreak = document.createElement('div');
            pageBreak.style.pageBreakAfter = 'always';
            pageBreak.style.marginTop = '20px';
            printElement.appendChild(pageBreak);
        }
    });
    
    // Si no hay cards, buscar report-tables
    if (cards.length === 0) {
        const tables = document.querySelectorAll('.report-table');
        if (tables.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        tables.forEach((table, index) => {
            const formattedTable = formatTable(table);
            if (formattedTable) {
                printElement.appendChild(formattedTable);
            }
        });
    }
    
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printElement.outerHTML;
    window.print();
    setTimeout(() => {
        document.body.innerHTML = originalContent;
        location.reload();
    }, 1000);
}

// Escuchar cambios en el inventario desde otras pestañas/ventanas
window.addEventListener('storage', (e) => {
    if (e.key === 'products') {
        console.log('Inventario actualizado, refrescando Bodega...');
        updateBodegaView();
    }
});
