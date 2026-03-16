// LIMPIEZA PARA PRODUCCIÓN - Limpiar datos de prueba del localStorage
// Esta función se ejecuta una sola vez para limpiar datos antiguos
(function cleanProductionData() {
    const cleanFlag = localStorage.getItem('factora_production_clean_v1');
    if (!cleanFlag) {
        // Limpiar datos de prueba
        localStorage.removeItem('sales');
        localStorage.removeItem('products');
        localStorage.removeItem('notifications');
        localStorage.removeItem('clients');
        localStorage.removeItem('orders');
        // Marcar como limpio
        localStorage.setItem('factora_production_clean_v1', 'true');
        console.log('✅ Datos de prueba eliminados - Sistema listo para producción');
    }
})();

// Reemplazar los eventos de cierre de sesión existentes con este código
document.addEventListener('DOMContentLoaded', function() {
    // Verificar sesión
    const user = JSON.parse(sessionStorage.getItem('factora_user') || 'null');
    if (!user) {
        window.location.href = '/';
        return;
    }

    // Actualizar información del usuario en el perfil
    const userNameElement = document.querySelector('.user-profile .profile-info div:first-child');
    const userRoleElement = document.querySelector('.user-profile .profile-info div:last-child');
    if (userNameElement) userNameElement.textContent = user.username || 'Admin Usuario';
    if (userRoleElement) userRoleElement.textContent = user.role || 'Administrador';

    // Agregar manejo del dropdown
    const userProfile = document.querySelector('.user-profile');
    const profileDropdown = document.querySelector('.profile-dropdown');

    if (userProfile && profileDropdown) {
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }

    // Manejar cierre de sesión
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                // Limpiar datos de sesión
                sessionStorage.removeItem('factora_user');
                localStorage.removeItem('userToken');
                localStorage.removeItem('userData');
                // Redirigir al login
                window.location.href = '/';
            }
        });
    }
    
    // Cargar productos y estadísticas al cargar la página
    loadProducts();
    updateStats();
});

let salesChart = null;
let equiposChart = null;

function loadProducts() {
    const tbody = document.querySelector('.table-custom tbody');
    if (!tbody) return;

    // Limpiar tabla actual
    tbody.innerHTML = '';

    // Obtener productos del localStorage (misma clave que Inventario.js)
    const products = JSON.parse(localStorage.getItem('products') || '[]');

    // Ordenar productos por cantidad vendida (si existe), sino por nombre
    products.sort((a, b) => (b.vendidos || 0) - (a.vendidos || 0) || ((a.name || '').localeCompare(b.name || '')));

    // Mostrar los productos
    products.forEach(product => {
        const vendidos = product.vendidos || 0;
        const salePrice = product.salePrice || product.precio || 0;
        const nombre = product.name || product.nombre || 'Sin nombre';
        const categoria = product.category || product.categoria || '';
        const sku = product.sku || '';
        const stock = typeof product.stock === 'number' ? product.stock : (product.cantidad || 0);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="product-cell">
                <span class="product-name">${nombre}</span>
            </td>
            <td>${sku}</td>
            <td>${categoria}</td>
            <td class="text-center">${vendidos}</td>
            <td class="text-center">${stock}</td>
            <td class="text-center">
                <span class="badge-status ${getStatusClass(stock)}">${getStatusText(stock)}</span>
            </td>
            <td class="text-right income-cell">$${formatNumber(salePrice * vendidos)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusClass(stock) {
    if (stock === 0) return 'low';
    if (stock <= 5) return 'low';
    if (stock <= 10) return 'medium';
    return 'active';
}

function getStatusText(stock) {
    if (stock === 0) return 'Agotado';
    if (stock <= 5) return 'Stock Bajo';
    if (stock <= 10) return 'Stock Medio';
    return 'Disponible';
}

function formatNumber(number) {
    return new Intl.NumberFormat('es-CL').format(number);
}

// Actualizar estadísticas del dashboard desde datos reales
function updateStats() {
    // Obtener productos del localStorage
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Total de productos
    const totalProducts = products.length;
    const statProducts = document.getElementById('statProducts');
    if (statProducts) {
        statProducts.textContent = totalProducts.toLocaleString('es-CL');
    }
    
    // Ventas de hoy (calcular desde ventas)
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales
        .filter(sale => sale.date && sale.date.startsWith(today))
        .reduce((sum, sale) => sum + (sale.amount || 0), 0);
    
    const statSales = document.getElementById('statSales');
    if (statSales) {
        statSales.textContent = '$' + todaySales.toLocaleString('es-CL');
    }
    
    // Clientes activos (desde localStorage si existe)
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const statClients = document.getElementById('statClients');
    if (statClients) {
        statClients.textContent = clients.length.toLocaleString('es-CL');
    }
    
    // Pedidos pendientes (desde localStorage si existe)
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'pendiente').length;
    const statOrders = document.getElementById('statOrders');
    if (statOrders) {
        statOrders.textContent = pendingOrders.toLocaleString('es-CL');
    }
}

// Navegar a Inventario with edit parameter
function goToInventory(id) {
    window.location.href = `/inventario/${id ? '?edit=' + encodeURIComponent(id) : ''}`;
}

// Función para obtener ventas del localStorage
function getSalesData() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const last7Days = {};
    
    // Inicializar últimos 7 días con 0
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days[dateStr] = 0;
    }
    
    // Sumar ventas por día
    sales.forEach(sale => {
        const dateStr = new Date(sale.date).toISOString().split('T')[0];
        if (dateStr in last7Days) {
            last7Days[dateStr] += sale.amount;
        }
    });
    
    return Object.values(last7Days);
}

// Inicializar gráfico de ventas (7 días) — usa datos de ejemplo si no hay datos reales
function initSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) {
        console.error('Canvas no encontrado');
        return;
    }

    const ctx = canvas.getContext('2d');
    // Forzar tamaño del canvas para que el gráfico ocupe más espacio
    try {
        canvas.style.width = '100%';
        canvas.style.height = '300px';
        if (canvas.parentElement) canvas.parentElement.style.minHeight = '300px';
    } catch (e) { /* no bloquear si falla */ }

    const data = {
        labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        datasets: [{
            label: 'Ventas Diarias',
            data: getSalesData(),
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderColor: '#2563eb',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#2563eb',
            pointBorderWidth: 2,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#2563eb',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { size: 13, family: "'Segoe UI', sans-serif", weight: '600' },
                bodyFont: { size: 12, family: "'Segoe UI', sans-serif" },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        return '$ ' + context.parsed.y.toLocaleString('es-CL');
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 12, family: "'Segoe UI', sans-serif" }, color: '#64748b' } },
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 12, family: "'Segoe UI', sans-serif" }, color: '#64748b', callback: function(value){ return '$ ' + value.toLocaleString('es-CL'); } } }
        },
        interaction: { intersect: false, mode: 'index' }
    };

    if (window.salesChart instanceof Chart) window.salesChart.destroy();

    window.salesChart = new Chart(ctx, { type: 'line', data: data, options: options });
}

// Obtener datos de equipos a partir de factora_solicitudes
function getEquiposData() {
    const stored = localStorage.getItem('factora_solicitudes');
    let sols = [];
    try { sols = stored ? JSON.parse(stored) : []; } catch(e) { sols = []; }

    const counts = {};

    sols.forEach(s => {
        if (!s) return;
        if (Array.isArray(s.equipos_list) && s.equipos_list.length > 0) {
            s.equipos_list.forEach(it => {
                const lab = (it.label || '').trim();
                const valNum = parseInt(String(it.value || '').replace(/[^0-9\-]/g, ''));
                const numeric = isNaN(valNum) ? 0 : valNum;
                if (numeric > 0) counts[lab] = (counts[lab] || 0) + numeric;
                else counts[lab] = (counts[lab] || 0) + 0;
            });
        } else if (s.equipos && typeof s.equipos === 'object') {
            const namesMap = {
                totem: 'CANT. TOTEM',
                tv_43: 'TV 43"',
                tv_55: 'TV 55"',
                tv_32: 'TV 32"',
                tv_40: 'TV 40"',
                tv_50: 'TV 50"',
                tv_65: 'TV 65"',
                tvbox: 'TV BOX',
                tv_cliente: 'TV Cliente',
                tv_carteleria_digital: 'Cartelería Digital',
                soporte_brazo: 'SOPORTE TV BRAZO',
                carcasa_ap: 'CANT. CARCASA AP'
            };
            Object.entries(s.equipos).forEach(([k,v]) => {
                const name = namesMap[k] || String(k).replace(/_/g, ' ').toUpperCase();
                const n = parseInt(v) || 0;
                if (n > 0) counts[name] = (counts[name] || 0) + n;
            });
        }
    });

    return counts;
}

function initEquiposChart() {
    const canvas = document.getElementById('equiposChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const counts = getEquiposData();
    const labels = Object.keys(counts).filter(l => l && l.length > 0);
    const dataVals = labels.map(l => counts[l] || 0);

    const data = {
        labels: labels,
        datasets: [{
            label: 'Equipos instalados',
            data: dataVals,
            backgroundColor: labels.map((_,i) => `hsl(${(i*50)%360} 70% 60%)`),
            borderColor: '#ffffff',
            borderWidth: 1
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { beginAtZero: true }, y: { beginAtZero: true } }
    };

    if (window.equiposChart instanceof Chart) window.equiposChart.destroy();
    window.equiposChart = new Chart(ctx, { type: 'bar', data: data, options: options });

    const totalEquipos = Object.values(counts).reduce((a,b)=>a+b,0);
    const el = document.getElementById('statEquipos');
    if (el) el.textContent = totalEquipos.toLocaleString('es-CL');
}

// Ensure dropdown toggle works globally (dashboard.html uses onclick="toggleProfileMenu()")
window.toggleProfileMenu = function() {
    const dropdown = document.getElementById('userDropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('show');
};

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('userDropdown');
    const wrapper = document.querySelector('.user-profile-wrapper');
    if (!dropdown || !wrapper) return;
    if (!wrapper.contains(e.target)) dropdown.classList.remove('show');
});

// Notifications: load, render, toggle and manage read state
window.loadNotifications = function() {
    const stored = localStorage.getItem('notifications');
    let notes = stored ? JSON.parse(stored) : [];
    // No agregar notificación de bienvenida automáticamente
    window._factora_notifications = notes;
    renderNotifications();
    updateNotificationCount();
};

function renderNotifications() {
    const list = document.getElementById('notificationsList');
    const dropdown = document.getElementById('notificationsDropdown');
    if (!list || !dropdown) return;

    const notes = window._factora_notifications || [];
    if (notes.length === 0) {
        list.innerHTML = '<div style="padding:16px; color:#64748b; text-align:center">No hay notificaciones</div>';
        return;
    }

    list.innerHTML = notes.map(n => `
        <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
            <div class="ni-content">
                <div class="ni-title">${escapeHtml(n.title || 'Notificación')}</div>
                <div class="ni-msg">${escapeHtml(n.message || '')}</div>
                <div class="ni-time">${n.time || ''}</div>
            </div>
            <div class="ni-actions">
                <button class="btn-small btn-secondary" data-action="mark" data-id="${n.id}">Marcar leída</button>
            </div>
        </div>
    `).join('');

    // Attach handlers
    list.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function(e) {
            const id = this.getAttribute('data-id');
            markNotificationRead(id);
        });
    });

    list.querySelectorAll('[data-action="mark"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.getAttribute('data-id');
            markNotificationRead(id);
        });
    });
}

function updateNotificationCount() {
    const countEl = document.getElementById('notificationCount');
    if (!countEl) return;
    const notes = window._factora_notifications || [];
    const unread = notes.filter(n => !n.read).length;
    if (unread > 0) {
        countEl.style.display = 'inline-flex';
        countEl.textContent = unread > 99 ? '99+' : String(unread);
    } else {
        countEl.style.display = 'none';
        countEl.textContent = '';
    }
}

window.toggleNotifications = function(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('notificationsDropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('show');
    // If opening, ensure list is fresh
    if (dropdown.classList.contains('show')) {
        loadNotifications();
    }
};

function markNotificationRead(id) {
    if (!id) return;
    const notes = window._factora_notifications || [];
    const idx = notes.findIndex(n => String(n.id) === String(id));
    if (idx === -1) return;
    notes[idx].read = true;
    localStorage.setItem('notifications', JSON.stringify(notes));
    window._factora_notifications = notes;
    renderNotifications();
    updateNotificationCount();
}

window.clearAllNotifications = function() {
    const notes = window._factora_notifications || [];
    notes.forEach(n => n.read = true);
    localStorage.setItem('notifications', JSON.stringify(notes));
    window._factora_notifications = notes;
    renderNotifications();
    updateNotificationCount();
};

// Utility: escape HTML to prevent injection
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Close notifications dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('notificationsDropdown');
    const wrapper = document.querySelector('.notification-badge');
    if (!dropdown || !wrapper) return;
    if (!wrapper.contains(e.target)) dropdown.classList.remove('show');
});

// Asegurarse de que el gráfico de equipos se inicialice después de cargar la página
document.addEventListener('DOMContentLoaded', initEquiposChart);

// Actualizar cuando cambie storage (por ejemplo desde Inventario)
window.addEventListener('storage', () => {
    loadProducts();
    updateStats();
    // re-renderizar charts si hay cambios en storage
    initEquiposChart();
});

// Refrescar cuando la pestaña vuelve a estar visible (útil si se editó inventario en otra pestaña)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        loadProducts();
        updateStats();
    }
});

// Escuchar un evento personalizado que dispatcha la página de Inventario en la misma pestaña
window.addEventListener('productsUpdated', () => {
    loadProducts();
    updateStats();
    initEquiposChart();
});

// Exponer función para botones de tabla (se usa onclick inline)
window.goToInventory = goToInventory;

// Función para limpiar datos de prueba (producción)
function clearTestData() {
    // Esta función se puede llamar manualmente para limpiar datos de prueba
    // localStorage.removeItem('sales');
    // localStorage.removeItem('products');
    // localStorage.removeItem('notifications');
    // console.log('Datos de prueba eliminados');
}

// Para desarrollo: Descomentar la siguiente línea para agregar datos de prueba
// addTestSalesForDevelopment();

function addTestSalesForDevelopment() {
    // Solo para desarrollo - comentar en producción
    const sales = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sales.push({
            date: date.toISOString(),
            amount: Math.random() * 2000000 + 500000
        });
    }
    localStorage.setItem('sales', JSON.stringify(sales));
    initSalesChart();
}