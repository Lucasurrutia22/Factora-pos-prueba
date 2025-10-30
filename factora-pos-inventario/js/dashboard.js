// Verificar sesión
const user = JSON.parse(sessionStorage.getItem('factora_user') || 'null');
if (!user) {
    window.location.href = 'index.html';
}

document.getElementById('welcomeText').textContent = `Hola, ${user.username}`;
document.getElementById('roleText').textContent = user.role || '';

document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('factora_user');
    window.location.href = 'index.html';
});

let salesChart = null;

function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const total = products.length;
    const lowStock = products.filter(p => (typeof p.minStock === 'number') ? p.stock <= p.minStock : false).length;

    document.getElementById('totalProducts').textContent = total;
    document.getElementById('lowStock').textContent = lowStock;

    const tbody = document.querySelector('#productsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id ?? ''}</td>
            <td>${p.name ?? ''}</td>
            <td>${p.stock ?? 0}</td>
            <td>${p.minStock ?? ''}</td>
            <td>
                <button class="action" data-id="${p.id}" onclick="goToInventory(${p.id})">Ver/Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Navegar a Inventario con parámetro edit
function goToInventory(id) {
    window.location.href = `Inventario.html${id ? '?edit=' + encodeURIComponent(id) : ''}`;
}

// Inicializar gráfico de ventas (7 días) — usa datos de ejemplo si no hay datos reales
function initSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) {
        console.warn('salesChart canvas not found');
        return;
    }

    if (typeof Chart === 'undefined') {
        console.error('Chart.js no está cargado. Verifica que la CDN esté incluida antes de dashboard.js');
        return;
    }

    // altura explícita en píxeles para evitar que el canvas quede con 0px de alto
    canvas.height = 320;

    if (salesChart) {
        try { salesChart.destroy(); } catch (e) { console.warn('No se pudo destruir chart previo:', e); }
        salesChart = null;
    }

    const labels = getLastNDaysLabels(7);
    const exampleData = [1200, 2200, 1800, 2600, 3000, 2400, 2847];

    try {
        const ctx = canvas.getContext('2d');
        salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Ventas (CLP)',
                    data: exampleData,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37,99,235,0.12)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#2563eb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: '#f1f5f9' } }
                }
            }
        });
    } catch (err) {
        console.error('Error creando gráfico:', err);
    }
}

function getLastNDaysLabels(n) {
    const res = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        res.push(d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }));
    }
    return res;
}

function formatCurrency(v) {
    // formateo simple, no depende de Intl para evitar problemas de compatibilidad
    try {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
    } catch {
        return '$' + Math.round(v).toString();
    }
}

// Inicialización al cargar DOM
window.addEventListener('DOMContentLoaded', () => {
    try {
        loadProducts();
        initSalesChart();
    } catch (err) {
        console.error('Error inicializando dashboard:', err);
    }
});

// Actualizar cuando cambie storage (por ejemplo desde Inventario)
window.addEventListener('storage', () => {
    loadProducts();
    // opcional: re-renderizar chart si quieres usar datos en tiempo real
    // initSalesChart();
});

// Exponer función para botones de tabla (se usa onclick inline)
window.goToInventory = goToInventory;