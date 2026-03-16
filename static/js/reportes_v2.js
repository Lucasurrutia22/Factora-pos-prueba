// stub loader: `reportes_v2.js` se mantiene por compatibilidad,
// pero delega toda la funcionalidad al nuevo `bodega_v3.js`.
console.warn('reportes_v2.js está obsoleto: cargando bodega_v3.js');
(function(){
    try{
        var s = document.createElement('script');
        s.src = '/static/js/Bodega.js?v=' + (new Date().getTime());
        s.defer = true;
        document.head.appendChild(s);
    }catch(e){ console.error('No se pudo cargar Bodega.js', e); }
})();

function renderTableHeaders(headers) {
    const thead = document.getElementById('reportTableHeader');
    if (!thead) return;
    thead.innerHTML = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
}

function updatePagination() {
    const maxPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${maxPages}`;
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    if (prev) prev.disabled = currentPage === 1;
    if (next) next.disabled = currentPage === maxPages;
}

function updateStats() {
    // actualizar estadísticas principales: total valor y total unidades
    const totalValor = filteredData.reduce((s, r) => s + (Number(r.subtotal)||0), 0);
    const totalUnidades = filteredData.reduce((s, r) => s + (Number(r.stock)||0), 0);
    const totalSalesEl = document.getElementById('totalSales'); if (totalSalesEl) totalSalesEl.textContent = '$' + totalValor.toLocaleString();
    const totalUnitsEl = document.getElementById('totalUnits'); if (totalUnitsEl) totalUnitsEl.textContent = totalUnidades + ' unidades';
}

// --- Módulo Bodega ---
function initBodegaModule() {
    // agregar botones de control en filtros
    const filtersRow = document.querySelector('.filters-card .filter-row');
    if (filtersRow && !document.getElementById('addBodegaBtn')) {
        const btn = document.createElement('button');
        btn.id = 'addBodegaBtn';
        btn.className = 'btn-primary';
        btn.textContent = '➕ Agregar Producto (Bodega)';
        btn.onclick = (e) => { e.preventDefault(); openBodegaModal(); };

        const refresh = document.createElement('button');
        refresh.className = 'btn-secondary';
        refresh.textContent = '🔄 Recargar Bodega';
        refresh.onclick = (e) => { e.preventDefault(); fetchBodegaProducts(); };

        const wrap = document.createElement('div');
        wrap.style.display = 'flex'; wrap.style.gap = '8px'; wrap.appendChild(btn); wrap.appendChild(refresh);
        filtersRow.appendChild(wrap);
    }

    if (!document.getElementById('bodegaModal')) createBodegaModal();

    // Pagination buttons
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    if (prev) prev.addEventListener('click', ()=>{ if (currentPage>1){ currentPage--; renderTable(); } });
    if (next) next.addEventListener('click', ()=>{ const max = Math.ceil(filteredData.length/itemsPerPage)||1; if (currentPage<max){ currentPage++; renderTable(); } });

    const stockToggle = document.getElementById('stockOnlyToggle');
    if (stockToggle) stockToggle.addEventListener('change', ()=>{ fetchBodegaProducts(); });

    const bodegaFilter = document.getElementById('bodegaFilter');
    if (bodegaFilter) bodegaFilter.addEventListener('change', ()=>{ fetchBodegaProducts(); });

    fetchBodegaProducts();
}

function createBodegaModal() {
    const modal = document.createElement('div');
    modal.id = 'bodegaModal';
    modal.style.display = 'none';
    modal.style.position = 'fixed'; modal.style.left = '0'; modal.style.top = '0'; modal.style.width = '100%'; modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)'; modal.style.zIndex = '9999';
    modal.innerHTML = `
        <div style="background:#fff; max-width:720px; margin:60px auto; padding:20px; border-radius:8px;">
            <h3>Registrar Producto en Bodega</h3>
            <form id="bodegaForm">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <input name="sku" placeholder="SKU" required />
                    <input name="nombre" placeholder="Nombre del producto" required />
                    <input name="categoria" placeholder="Categoría" />
                    <input name="stock" type="number" placeholder="Stock" min="0" />
                    <input name="precio" type="number" step="0.01" placeholder="Precio venta" />
                    <textarea name="descripcion" placeholder="Descripción" style="grid-column:1 / -1; height:80px;"></textarea>
                    <div style="grid-column:1 / -1; display:flex; gap:10px; align-items:center;">
                        <input id="bodegaImageInput" name="image" type="file" accept="image/*" />
                        <img id="bodegaImagePreview" src="" alt="preview" style="height:48px; display:none; border-radius:4px;" />
                    </div>
                </div>
                <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end;">
                    <button id="bodegaCancel" class="btn-secondary">Cancelar</button>
                    <button id="bodegaSave" class="btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('bodegaCancel').addEventListener('click', (e)=>{ e.preventDefault(); closeBodegaModal(); });
    document.getElementById('bodegaForm').addEventListener('submit', handleBodegaFormSubmit);
    document.getElementById('bodegaImageInput').addEventListener('change', (e)=>{
        const f = e.target.files && e.target.files[0];
        const p = document.getElementById('bodegaImagePreview');
        if (f) { p.src = URL.createObjectURL(f); p.style.display = 'inline-block'; } else { p.src=''; p.style.display='none'; }
    });
}

function openBodegaModal(){ const m=document.getElementById('bodegaModal'); if(m) m.style.display='block'; }
function closeBodegaModal(){ const m=document.getElementById('bodegaModal'); if(m) m.style.display='none'; const f=document.getElementById('bodegaForm'); if(f) f.reset(); const p=document.getElementById('bodegaImagePreview'); if(p){p.src=''; p.style.display='none';} }

async function handleBodegaFormSubmit(e){
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const apiUrl = '/inventario/api/productos/';
    try{
        const res = await fetch(apiUrl, { method: 'POST', body: fd });
        if(!res.ok){ const txt = await res.text(); console.error('Bodega POST error', res.status, txt); alert('Error al guardar producto: '+res.status); return; }
        await res.json();
        closeBodegaModal();
        fetchBodegaProducts();
        alert('Producto guardado correctamente');
    }catch(err){ console.error(err); alert('Error de conexión al guardar producto.'); }
}

async function fetchBodegaProducts(){
    const apiUrl = '/inventario/api/productos/';
    try{
        const res = await fetch(apiUrl);
        if(!res.ok){ console.warn('fetchBodegaProducts no disponible', res.status); filteredData = []; renderTableHeaders(['Producto','Unidad','Bodega','Inicial','Entradas','Salidas','Stock','Valor unitario','SubTotal']); renderTable(); updateStats(); return; }
        const payload = await res.json();
        const rows = Array.isArray(payload)? payload : (payload.results || payload.data || []);

        // obtener filtros UI
        const stockOnly = !!(document.getElementById('stockOnlyToggle') && document.getElementById('stockOnlyToggle').checked);
        const bodegaSel = (document.getElementById('bodegaFilter') && document.getElementById('bodegaFilter').value) || 'all';

        const mapped = rows.map(p => {
            const precio = Number(p.precio || p.precio_venta || p.salePrice || 0) || 0;
            const stock = Number(p.cantidad || p.stock || 0) || 0;
            return {
                sku: p.sku || p.codigo || '',
                producto: p.nombre || p.name || p.descripcion_corta || '',
                unidad: p.unidad || p.uom || 'un.',
                bodega: p.bodega || p.bodega_nombre || p.bodega_display || 'Bodega principal',
                inicial: Number(p.inicial || p.inicial_stock || 0) || 0,
                entradas: Number(p.entradas || 0) || 0,
                salidas: Number(p.salidas || 0) || 0,
                stock: stock,
                precio_unitario: precio,
                subtotal: precio * stock,
                imagen: p.imagen || p.image || ''
            };
        });

        // aplicar filtros
        let filtered = mapped;
        if (stockOnly) filtered = filtered.filter(r => r.stock > 0);
        if (bodegaSel && bodegaSel !== 'all') filtered = filtered.filter(r => (r.bodega||'').toLowerCase().includes(bodegaSel.toLowerCase()));

        filteredData = filtered;
        renderTableHeaders(['Producto','Unidad','Bodega','Inicial','Entradas','Salidas','Stock','Valor unitario','SubTotal']);
        currentPage = 1; renderTable(); updateStats();

        // actualizar total global
        const total = filteredData.reduce((s, r) => s + (Number(r.subtotal)||0), 0);
        const box = document.getElementById('totalBox'); if (box) box.textContent = 'TOTAL $' + total.toLocaleString();
    }catch(err){ console.error('fetchBodegaProducts', err); }
}

function renderTable(){
    const tbody = document.getElementById('reportTableBody'); if(!tbody) return; tbody.innerHTML = '';
    const start = (currentPage-1)*itemsPerPage; const end = start+itemsPerPage; const pageData = filteredData.slice(start,end);
    pageData.forEach(row=>{
        const tr = document.createElement('tr');
        const cols = [];
        cols.push(`<td>${escapeHtml(row.producto)}</td>`);
        cols.push(`<td>${escapeHtml(row.unidad)}</td>`);
        cols.push(`<td>${escapeHtml(row.bodega)}</td>`);
        cols.push(`<td>${row.inicial}</td>`);
        cols.push(`<td>${row.entradas}</td>`);
        cols.push(`<td>${row.salidas}</td>`);
        cols.push(`<td>${row.stock}</td>`);
        cols.push(`<td>$${Number(row.precio_unitario||0).toLocaleString()}</td>`);
        cols.push(`<td>$${Number(row.subtotal||0).toLocaleString()}</td>`);
        tr.innerHTML = cols.join(''); tbody.appendChild(tr);
    });
    updatePagination();
}

// Escuchar cambios en almacenamiento para recargar vista
window.addEventListener('storage', (e)=>{ if(e.key==='products'){ fetchBodegaProducts(); } });

// Inicializar módulo al cargar la página si está la tabla
document.addEventListener('DOMContentLoaded', ()=>{ if(document.getElementById('reportTable')) initBodegaModule(); });

    document.getElementById('reportTitle').textContent = 'Reporte de Inventario Detallado';
    
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
    document.getElementById('reportTitle').textContent = 'Productos en Inventario (Por Valor Total)';
    
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
    document.getElementById('reportTitle').textContent = 'Estado de Stock';
    
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
    thead.innerHTML = headers.map(h => `<th>${h}</th>`).join('');
}

function renderTable() {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return; tbody.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    pageData.forEach(row => {
        const tr = document.createElement('tr');
        const cols = [];
        cols.push(`<td>${escapeHtml(row.producto || '')}</td>`);
        cols.push(`<td>${escapeHtml(row.unidad || '')}</td>`);
        cols.push(`<td>${escapeHtml(row.bodega || '')}</td>`);
        cols.push(`<td>${row.inicial || 0}</td>`);
        cols.push(`<td>${row.entradas || 0}</td>`);
        cols.push(`<td>${row.salidas || 0}</td>`);
        cols.push(`<td>${row.stock || 0}</td>`);
        cols.push(`<td>$${Number(row.precio_unitario||0).toLocaleString()}</td>`);
        cols.push(`<td>$${Number(row.subtotal||0).toLocaleString()}</td>`);
        tr.innerHTML = cols.join('');
        tbody.appendChild(tr);
    });

    updatePagination();
}

function updatePagination() {
    const maxPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${maxPages}`;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === maxPages;
}

function updateStats() {
    const totalValor = filteredData.reduce((s, r) => s + (Number(r.subtotal)||0), 0);
    const totalUnidades = filteredData.reduce((s, r) => s + (Number(r.stock)||0), 0);
    const totalSalesEl = document.getElementById('totalSales'); if (totalSalesEl) totalSalesEl.textContent = '$' + totalValor.toLocaleString();
    const totalUnitsEl = document.getElementById('totalUnits'); if (totalUnitsEl) totalUnitsEl.textContent = totalUnidades + ' unidades';
    // mantener otros indicadores vacíos para esta vista
    const avgMarginEl = document.getElementById('avgMargin'); if (avgMarginEl) avgMarginEl.textContent = '';
    const growthEl = document.getElementById('growth'); if (growthEl) growthEl.textContent = '';
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
    
    const reportType = document.getElementById('reportType').value;
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
    
    const reportType = document.getElementById('reportType').value;
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
    document.getElementById('reportType').value = 'inventario';
    document.getElementById('reportPeriod').value = 'mes';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('dateRangeGroup').style.display = 'none';
    
    updateReportView();
}

function printReport() {
    window.print();
}

function exportReportCSV() {
    const headers = Array.from(document.querySelectorAll('#reportTableHeader th')).map(th => th.textContent);
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
    link.setAttribute('download', `reporte_inventario_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
}

function exportReportPDF() {
    const reportType = document.getElementById('reportType').value;
    const reportPeriod = document.getElementById('reportPeriod').value;
    
    // Obtener solo la tabla de reporte actual (la más reciente)
    const tables = document.querySelectorAll('.report-table');
    if (tables.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Usar la última tabla (la más reciente)
    const table = tables[tables.length - 1];

    // Crear un contenedor temporal para imprimir
    const printElement = document.createElement('div');
    printElement.style.padding = '20px';
    printElement.style.backgroundColor = 'white';
    printElement.style.color = 'black';
    printElement.style.fontFamily = 'Arial, sans-serif';
    
    // Agregar título
    const title = document.createElement('h2');
    title.textContent = `Reporte de ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} - ${reportPeriod}`;
    title.style.textAlign = 'center';
    title.style.marginBottom = '10px';
    title.style.color = '#333';
    printElement.appendChild(title);
    
    // Agregar fecha de generación
    const dateInfo = document.createElement('p');
    dateInfo.textContent = `Fecha de generación: ${new Date().toLocaleString('es-CL')}`;
    dateInfo.style.fontSize = '12px';
    dateInfo.style.marginBottom = '20px';
    dateInfo.style.color = '#666';
    dateInfo.style.textAlign = 'center';
    printElement.appendChild(dateInfo);
    
    // Clonar la tabla
    const tableClone = table.cloneNode(true);
    tableClone.style.width = '100%';
    tableClone.style.borderCollapse = 'collapse';
    tableClone.style.fontSize = '11px';
    
    // Estilos para la tabla
    const rows = tableClone.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.style.borderBottom = '1px solid #ccc';
        
        // Encabezados
        if (index === 0) {
            row.style.backgroundColor = '#4282f6';
            row.style.color = 'white';
        } else {
            // Alternar colores
            row.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        }
        
        row.querySelectorAll('td, th').forEach(cell => {
            cell.style.padding = '8px';
            cell.style.textAlign = 'left';
            cell.style.border = '1px solid #ddd';
        });
    });
    
    printElement.appendChild(tableClone);
    
    // Guardar el contenido actual
    const originalContent = document.body.innerHTML;
    
    // Reemplazar contenido temporalmente
    document.body.innerHTML = printElement.outerHTML;
    
    // Imprimir (se abrirá el diálogo de impresión)
    window.print();
    
    // Restaurar contenido original
    setTimeout(() => {
        document.body.innerHTML = originalContent;
        // Re-ejecutar scripts si es necesario
        location.reload();
    }, 1000);
}

// Escuchar cambios en el inventario desde otras pestañas/ventanas
// Escuchar cambios en el inventario desde otras pestañas/ventanas
window.addEventListener('storage', (e) => {
    if (e.key === 'products') {
        console.log('Inventario actualizado, refrescando Bodega...');
        updateBodegaView();
    }
});

// ============== MÓDULO BODEGA: registro y gestión de inventario ==============

// Inicializar controles de Bodega (botón agregar, modal, listado)
function initBodegaModule() {
    // Añadir botón para crear producto si no existe
    const filtersCard = document.querySelector('.filters-card .filter-row');
    if (filtersCard && !document.getElementById('addBodegaBtn')) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';

        const addBtn = document.createElement('button');
        addBtn.id = 'addBodegaBtn';
        addBtn.className = 'btn-primary';
        addBtn.textContent = '➕ Agregar Producto (Bodega)';
        addBtn.onclick = (e) => { e.preventDefault(); openBodegaModal(); };

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn-secondary';
        refreshBtn.textContent = '🔄 Recargar Bodega';
        refreshBtn.onclick = (e) => { e.preventDefault(); fetchBodegaProducts(); };

        wrapper.appendChild(addBtn);
        wrapper.appendChild(refreshBtn);
        filtersCard.appendChild(wrapper);
    }

    // Crear modal si no existe
    if (!document.getElementById('bodegaModal')) createBodegaModal();

    // Cargar listado inicial
    fetchBodegaProducts();
}

function createBodegaModal() {
    const modal = document.createElement('div');
    modal.id = 'bodegaModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
        <div class="modal-content" style="background:#fff; max-width:720px; margin:60px auto; padding:20px; border-radius:8px;">
            <h3>Registrar Producto en Bodega</h3>
            <form id="bodegaForm">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <input name="sku" placeholder="SKU" required />
                    <input name="name" placeholder="Nombre del producto" required />
                    <input name="category" placeholder="Categoría" />
                    <input name="stock" type="number" placeholder="Stock" min="0" />
                    <input name="costPrice" type="number" step="0.01" placeholder="Precio costo" />
                    <input name="salePrice" type="number" step="0.01" placeholder="Precio venta" />
                    <textarea name="description" placeholder="Descripción" style="grid-column:1 / -1; height:80px;"></textarea>
                    <div style="grid-column:1 / -1; display:flex; gap:10px; align-items:center;">
                        <input id="bodegaImageInput" name="image" type="file" accept="image/*" />
                        <img id="bodegaImagePreview" src="" alt="preview" style="height:48px; display:none; border-radius:4px;" />
                    </div>
                </div>
                <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end;">
                    <button id="bodegaCancel" class="btn-secondary">Cancelar</button>
                    <button id="bodegaSave" class="btn-primary">Guardar</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('bodegaCancel').addEventListener('click', (e)=>{ e.preventDefault(); closeBodegaModal(); });
    document.getElementById('bodegaForm').addEventListener('submit', handleBodegaFormSubmit);
    document.getElementById('bodegaImageInput').addEventListener('change', (e)=>{
        const f = e.target.files && e.target.files[0];
        const p = document.getElementById('bodegaImagePreview');
        if (f) {
            const url = URL.createObjectURL(f);
            p.src = url; p.style.display = 'inline-block';
        } else { p.src=''; p.style.display='none'; }
    });
}

function openBodegaModal() {
    const m = document.getElementById('bodegaModal');
    if (!m) return;
    m.style.display = 'block';
}

function closeBodegaModal() {
    const m = document.getElementById('bodegaModal');
    if (!m) return;
    m.style.display = 'none';
    const form = document.getElementById('bodegaForm');
    if (form) form.reset();
    const p = document.getElementById('bodegaImagePreview'); if (p) { p.src=''; p.style.display='none'; }
}

async function handleBodegaFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    // Post to inventario API - servidor debe exponer /inventario/api/productos/
    const apiUrl = '/inventario/api/productos/';
    try {
        const res = await fetch(apiUrl, { method: 'POST', body: fd });
        if (!res.ok) {
            const txt = await res.text();
            console.error('Bodega POST error', res.status, txt);
            alert('Error al guardar producto en bodega: ' + res.status);
            return;
        }
        const payload = await res.json();
        alert('Producto guardado correctamente');
        closeBodegaModal();
        fetchBodegaProducts();
    } catch (err) {
        console.error('handleBodegaFormSubmit', err);
        alert('Error de conexión al guardar producto. Revisa la consola.');
    }
}

// Obtener productos desde backend y mapear a `filteredData` para renderizado
async function fetchBodegaProducts() {
    const apiUrl = '/inventario/api/productos/';
    try {
        const res = await fetch(apiUrl);
        if (!res.ok) { console.warn('fetchBodegaProducts no disponible', res.status); return; }
        const payload = await res.json();
        const rows = Array.isArray(payload) ? payload : (payload.results || []);
        filteredData = rows.map(p => ({
            sku: p.sku || p.codigo || '',
            producto: p.nombre || p.name || '',
            stock: p.stock || p.cantidad || 0,
            categoria: p.categoria || p.category || '',
            precioCompra: p.precio_compra || p.costPrice || 0,
            precioVenta: p.precio_venta || p.salePrice || 0,
            descripcion: p.descripcion || p.description || '',
            imagen: p.imagen || p.image || ''
        }));

        // Render tabla con encabezados apropiados para Bodega
        renderTableHeaders(['SKU','Producto','Stock','Categoría','Precio Compra','Precio Venta','Descripción','Imagen']);
        renderTable();
        updateStats();
    } catch (err) {
        console.error('fetchBodegaProducts error', err);
    }
}

// Adaptar renderTable para mostrar imagen si existe
const _origRenderTable = renderTable;
function renderTable() {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    pageData.forEach(row => {
        const tr = document.createElement('tr');
        const cells = [];
        // Order must match headers used in fetchBodegaProducts mapping
        if (row.sku !== undefined) cells.push(`<td>${escapeHtml(row.sku)}</td>`);
        if (row.producto !== undefined) cells.push(`<td>${escapeHtml(row.producto)}</td>`);
        if (row.stock !== undefined) cells.push(`<td>${row.stock}</td>`);
        if (row.categoria !== undefined) cells.push(`<td>${escapeHtml(row.categoria)}</td>`);
        if (row.precioCompra !== undefined) cells.push(`<td>$${Number(row.precioCompra || 0).toLocaleString()}</td>`);
        if (row.precioVenta !== undefined) cells.push(`<td>$${Number(row.precioVenta || 0).toLocaleString()}</td>`);
        if (row.descripcion !== undefined) cells.push(`<td>${escapeHtml(row.descripcion)}</td>`);
        if (row.imagen) cells.push(`<td><img src="${row.imagen}" style="height:40px; border-radius:4px;"/></td>`);
        tr.innerHTML = cells.join('');
        tbody.appendChild(tr);
    });

    updatePagination();
}

// Exponer funciones globalmente
window.initBodegaModule = initBodegaModule;
window.openBodegaModal = openBodegaModal;
window.fetchBodegaProducts = fetchBodegaProducts;

// Inicializar módulo Bodega cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si la plantilla actual contiene el contenedor de reportes
    if (document.getElementById('reportTable')) {
        initBodegaModule();
    }
});
