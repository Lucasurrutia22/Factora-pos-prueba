// reportes.js: reportes module removed - stub
console.warn('reportes.js: reportes module removed; file is a stub.');

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

// Obtener datos del inventario desde localStorage
function getInventoryProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

// Obtener datos de ventas/transacciones del localStorage
function getSalesTransactions() {
    return JSON.parse(localStorage.getItem('sales') || '[]');
}

// Generar datos de reporte a partir del inventario actual
const products = getInventoryProducts();

// Convertir datos de inventario a formato de reporte
const salesData = products.map(product => ({
    fecha: new Date().toISOString().split('T')[0],
    producto: product.name || product.nombre || 'Producto sin nombre',
    cantidad: product.stock || 0,
    monto: ((product.salePrice || product.precio || 0) * (product.stock || 0)),
    margen: product.margen || ((product.salePrice - product.costPrice) / product.costPrice * 100) || 0,
    sku: product.sku || '',
    categoria: product.category || product.categoria || 'Sin categoría',
    costPrice: product.costPrice || product.precioCompra || 0,
    salePrice: product.salePrice || product.precio || 0,
    minStock: product.minStock || 5
}));

let currentPage = 1;
let itemsPerPage = 10;
let filteredData = [];
let chartsInstances = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateReportView();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('reportPeriod').addEventListener('change', (e) => {
        if (e.target.value === 'personalizado') {
            document.getElementById('dateRangeGroup').style.display = 'flex';
        } else {
            document.getElementById('dateRangeGroup').style.display = 'none';
        }
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const maxPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < maxPages) {
            currentPage++;
            renderTable();
        }
    });
}

function updateReportView() {
    const reportType = document.getElementById('reportType').value;
    
    currentPage = 1;
    
    switch(reportType) {
        case 'ventas':
            generateSalesReport();
            break;
        case 'inventario':
            generateInventoryReport();
            break;
        case 'productos':
            generateTopProductsReport();
            break;
        case 'stock':
            generateStockReport();
            break;
    }
    
    renderTable();
    updateStats();
    updateCharts(reportType);
}

function generateSalesReport() {
    document.getElementById('reportTitle').textContent = 'Reporte de Inventario (Ventas Potenciales)';
    
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
    document.getElementById('reportTitle').textContent = 'Reporte de Inventario';
    
    filteredData = products.map(p => ({
        producto: p.name || p.nombre || 'Sin nombre',
        categoria: p.category || p.categoria || 'Sin categoría',
        stock: p.stock || 0,
        precioCompra: p.costPrice || p.precioCompra || 0,
        precioVenta: p.salePrice || p.precio || 0,
        margen: parseFloat((((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 1) * 100).toFixed(1)) || 0,
        valorTotal: ((p.costPrice || 0) * (p.stock || 0))
    }));
    
    const headers = ['Producto', 'Categoría', 'Stock', 'Precio Compra', 'Precio Venta', 'Margen %', 'Valor Total'];
    renderTableHeaders(headers);
}

function generateTopProductsReport() {
    document.getElementById('reportTitle').textContent = 'Productos en Inventario (Por Valor)';
    
    filteredData = products
        .map(p => ({
            producto: p.name || p.nombre || 'Sin nombre',
            stock: p.stock || 0,
            categoria: p.category || p.categoria || 'Sin categoría',
            margen: parseFloat((((p.salePrice || 0) - (p.costPrice || 0)) / (p.costPrice || 1) * 100).toFixed(1)) || 0,
            valorInventario: ((p.costPrice || 0) * (p.stock || 0))
        }))
        .sort((a, b) => b.valorInventario - a.valorInventario);
    
    const headers = ['Producto', 'Stock', 'Categoría', 'Margen %', 'Valor Inventario'];
    renderTableHeaders(headers);
}

function generateStockReport() {
    document.getElementById('reportTitle').textContent = 'Estado de Stock';
    
    filteredData = products
        .map(p => ({
            producto: p.name || p.nombre || 'Sin nombre',
            stock: p.stock || 0,
            minStock: p.minStock || 5,
            estado: (p.stock || 0) === 0 ? 'Agotado' : (p.stock || 0) <= (p.minStock || 5) ? 'Stock Bajo' : 'Disponible',
            categoria: p.category || p.categoria || 'Sin categoría',
            precioVenta: p.salePrice || p.precio || 0
        }))
        .sort((a, b) => a.stock - b.stock);
    
    const headers = ['Producto', 'Stock Actual', 'Stock Mínimo', 'Estado', 'Categoría', 'Precio Venta'];
    renderTableHeaders(headers);
}

function renderTableHeaders(headers) {
    const thead = document.getElementById('reportTableHeader');
    thead.innerHTML = headers.map(h => `<th>${h}</th>`).join('');
}

function renderTable() {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    pageData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = Object.values(row)
            .map(val => `<td>${typeof val === 'number' ? formatValue(val) : val}</td>`)
            .join('');
        tbody.appendChild(tr);
    });
    
    updatePagination();
}

function formatValue(val) {
    if (val > 1000 && Number.isInteger(val)) {
        return '$' + val.toLocaleString();
    }
    return val;
}

function updatePagination() {
    const maxPages = Math.ceil(filteredData.length / itemsPerPage);
    document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${maxPages}`;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === maxPages;
}

function updateStats() {
    const reportType = document.getElementById('reportType').value;
    
    if (reportType === 'ventas') {
        const totalSales = filteredData.reduce((sum, d) => sum + (d.monto || 0), 0);
        const totalUnits = filteredData.reduce((sum, d) => sum + (d.cantidad || 0), 0);
        const avgMargin = filteredData.length > 0 ? (filteredData.reduce((sum, d) => sum + (d.margen || 0), 0) / filteredData.length).toFixed(1) : 0;
        
        document.getElementById('totalSales').textContent = '$' + totalSales.toLocaleString();
        document.getElementById('totalUnits').textContent = totalUnits;
        document.getElementById('avgMargin').textContent = avgMargin + '%';
        document.getElementById('growth').textContent = '+0%';
    } else if (reportType === 'inventario') {
        const totalValue = filteredData.reduce((sum, d) => sum + (d.valorTotal || 0), 0);
        const totalStock = filteredData.reduce((sum, d) => sum + (d.stock || 0), 0);
        const avgMargin = filteredData.length > 0 ? (filteredData.reduce((sum, d) => sum + (d.margen || 0), 0) / filteredData.length).toFixed(1) : 0;
        
        document.getElementById('totalSales').textContent = '$' + totalValue.toLocaleString();
        document.getElementById('totalUnits').textContent = totalStock;
        document.getElementById('avgMargin').textContent = avgMargin + '%';
        document.getElementById('growth').textContent = filteredData.length + ' productos';
    } else if (reportType === 'productos') {
        const totalValue = filteredData.reduce((sum, d) => sum + (d.valorInventario || 0), 0);
        const totalStock = filteredData.reduce((sum, d) => sum + (d.stock || 0), 0);
        const avgMargin = filteredData.length > 0 ? (filteredData.reduce((sum, d) => sum + (d.margen || 0), 0) / filteredData.length).toFixed(1) : 0;
        
        document.getElementById('totalSales').textContent = '$' + totalValue.toLocaleString();
        document.getElementById('totalUnits').textContent = totalStock;
        document.getElementById('avgMargin').textContent = avgMargin + '%';
        document.getElementById('growth').textContent = 'Top ' + Math.min(5, filteredData.length);
    } else if (reportType === 'stock') {
        const totalStock = filteredData.reduce((sum, d) => sum + (d.stock || 0), 0);
        const agotados = filteredData.filter(d => d.estado === 'Agotado').length;
        const bajos = filteredData.filter(d => d.estado === 'Stock Bajo').length;
        const disponibles = filteredData.filter(d => d.estado === 'Disponible').length;
        
        document.getElementById('totalSales').textContent = totalStock;
        document.getElementById('totalUnits').textContent = agotados;
        document.getElementById('avgMargin').textContent = bajos;
        document.getElementById('growth').textContent = disponibles + ' disponibles';
    }
}

function filterByPeriod(data) {
    const period = document.getElementById('reportPeriod').value;
    const today = new Date();
    
    let startDate = new Date();
    
    switch(period) {
        case 'hoy':
            startDate.setDate(today.getDate());
            break;
        case 'semana':
            startDate.setDate(today.getDate() - 7);
            break;
        case 'mes':
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'trimestre':
            startDate.setMonth(today.getMonth() - 3);
            break;
        case 'ano':
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        case 'personalizado':
            const customStart = document.getElementById('startDate').value;
            if (customStart) startDate = new Date(customStart);
            break;
    }
    
    return data.filter(d => new Date(d.fecha || new Date()) >= startDate);
}

function updateCharts(reportType) {
    if (reportType === 'ventas') {
        updateCategoryChart();
        updateTrendsChart();
    } else if (reportType === 'inventario') {
        updateInventoryCharts();
    } else if (reportType === 'productos') {
        updateProductsCharts();
    } else if (reportType === 'stock') {
        updateStockCharts();
    }
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    const categories = {};
    filteredData.forEach(d => {
        categories[d.producto] = (categories[d.producto] || 0) + d.monto;
    });
    
    if (chartsInstances.categoryChart) chartsInstances.categoryChart.destroy();
    
    chartsInstances.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'
                ],
                borderColor: '#ffffff',
                borderWidth: 2
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

function updateTrendsChart() {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    const dates = {};
    filteredData.forEach(d => {
        dates[d.fecha] = (dates[d.fecha] || 0) + d.monto;
    });
    
    if (chartsInstances.trendsChart) chartsInstances.trendsChart.destroy();
    
    chartsInstances.trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(dates),
            datasets: [{
                label: 'Ventas Diarias',
                data: Object.values(dates),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateInventoryCharts() {
    const ctx1 = document.getElementById('categoryChart').getContext('2d');
    
    const byCategory = {};
    filteredData.forEach(d => {
        byCategory[d.categoria] = (byCategory[d.categoria] || 0) + d.stock;
    });
    
    if (chartsInstances.categoryChart) chartsInstances.categoryChart.destroy();
    
    chartsInstances.categoryChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: Object.keys(byCategory),
            datasets: [{
                label: 'Stock por Categoría',
                data: Object.values(byCategory),
                backgroundColor: '#3b82f6'
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

function updateProductsCharts() {
    const ctx1 = document.getElementById('categoryChart').getContext('2d');
    
    if (chartsInstances.categoryChart) chartsInstances.categoryChart.destroy();
    
    chartsInstances.categoryChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: filteredData.map(d => d.producto.substring(0, 10)),
            datasets: [{
                label: 'Unidades Vendidas',
                data: filteredData.map(d => d.vendidos),
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateStockCharts() {
    const ctx1 = document.getElementById('categoryChart').getContext('2d');
    
    const states = { 'Disponible': 0, 'Stock Bajo': 0, 'Agotado': 0 };
    filteredData.forEach(d => {
        states[d.estado]++;
    });
    
    if (chartsInstances.categoryChart) chartsInstances.categoryChart.destroy();
    
    chartsInstances.categoryChart = new Chart(ctx1, {
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
    document.getElementById('reportType').value = 'ventas';
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
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function exportReportPDF() {
    alert('Función de exportación PDF requiere librería adicional (jsPDF). Por ahora, usa Imprimir > Guardar como PDF');
}
