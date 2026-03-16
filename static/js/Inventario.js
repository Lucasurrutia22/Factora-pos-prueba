// JavaScript logic for managing the inventory

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

    // Update header display
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

// Apply theme on load if set
const savedSettingsInv = JSON.parse(localStorage.getItem('factora_settings') || 'null');
if (savedSettingsInv && savedSettingsInv.theme) applyTheme(savedSettingsInv.theme);

// LIMPIEZA PARA PRODUCCIÓN - Limpiar datos de prueba del localStorage
(function cleanProductionData() {
    const cleanFlag = localStorage.getItem('factora_production_clean_v1');
    if (!cleanFlag) {
        // Limpiar datos de prueba
        localStorage.removeItem('sales');
        localStorage.removeItem('products');
        localStorage.setItem('factora_production_clean_v1', 'true');
        console.log('Inventario limpio - Sistema listo para producción');
    }
})();

// Initialize products array - will be loaded from API
let products = [];

// Current product being edited
let currentProductId = null;

// =============================================
// CARGAR DATOS DESDE ORACLE (API)
// =============================================
async function loadProductsFromAPI() {
    try {
        const response = await fetch('/inventario/api/productos/');
        const result = await response.json();
        
        if (result.success) {
            // Mapear datos de Oracle al formato esperado por la UI
            products = result.data.map(p => ({
                id: p.id_producto,
                name: p.nombre,
                sku: `SKU-${String(p.id_producto).padStart(3, '0')}`,
                category: 'electronica',
                brand: p.proveedor_nombre || 'Sin marca',
                costPrice: Math.round(p.precio * 0.7),
                salePrice: p.precio,
                stock: p.stock,
                minStock: 5,
                requiresSerial: true,
                description: p.descripcion || ''
            }));
            
            console.log(`✅ ${products.length} productos cargados desde Oracle`);
            updateProductsTable();
            updateStats();
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        // Fallback a localStorage si falla la API
        products = JSON.parse(localStorage.getItem('products')) || [];
        updateProductsTable();
        updateStats();
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromAPI();
    setupEventListeners();
});

function setupEventListeners() {
    // Search
    document.getElementById('searchProducts').addEventListener('input', filterProducts);
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
    
    // Filter buttons
    document.querySelectorAll('.btn-filter[data-filter]').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-filter[data-filter]').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            filterProducts();
        });
    });
}

function handleProductSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const productData = {
        nombre: formData.get('productName'),
        descripcion: formData.get('productDescription') || '',
        stock: parseInt(formData.get('productStock') || '0'),
        precio: parseInt(formData.get('productSalePrice')),
        id_proveedor: 1 // Por defecto proveedor 1
    };

    if (currentProductId) {
        // Actualizar producto existente
        updateProductInAPI(currentProductId, productData);
    } else {
        // Crear nuevo producto
        createProductInAPI(productData);
    }
}

async function createProductInAPI(data) {
    try {
        const response = await fetch('/inventario/api/productos/create/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Producto creado exitosamente en Oracle');
            closeModal();
            loadProductsFromAPI(); // Recargar tabla
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ Error de conexión: ' + error.message);
    }
}

async function updateProductInAPI(id, data) {
    try {
        const response = await fetch(`/inventario/api/productos/${id}/update/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Producto actualizado en Oracle');
            closeModal();
            loadProductsFromAPI();
        } else {
            alert('❌ Error: ' + result.error);
        }
    } catch (error) {
        alert('❌ Error de conexión: ' + error.message);
    }
}

function updateProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        const stockStatus = getStockStatus(product.stock, product.minStock);
        
        row.innerHTML = `
            <td>
                <div class="product-info">
                    <div class="product-image">📦</div>
                    <div class="product-details">
                        <h4>${product.name}</h4>
                        <p>${product.brand}</p>
                    </div>
                </div>
            </td>
            <td>${product.sku}</td>
            <td>${product.category}</td>
            <td>$${product.salePrice.toLocaleString()}</td>
            <td>
                <div class="stock-indicator">
                    <div class="stock-bar">
                        <div class="stock-bar-fill ${stockStatus}" 
                             style="width: ${Math.min((product.stock / product.minStock) * 100, 100)}%">
                        </div>
                    </div>
                    ${product.stock}
                </div>
            </td>
            <td>
                <span class="badge ${stockStatus}">
                    ${product.stock === 0 ? 'Agotado' : 
                      product.stock <= product.minStock ? 'Stock Bajo' : 'Disponible'}
                </span>
            </td>
            <td>
                <span class="badge info">
                    ${product.requiresSerial ? 'Requerido' : 'No Requerido'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" onclick="viewProduct(${product.id})">👁️</button>
                    <button class="btn-action edit" onclick="editProduct(${product.id})">✏️</button>
                    <button class="btn-action delete" onclick="deleteProduct(${product.id})">🗑️</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    document.getElementById('productCount').textContent = products.length;
}

function updateStats() {
    const stats = {
        total: products.length,
        lowStock: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        inventoryValue: products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0)
    };

    document.getElementById('totalProducts').textContent = stats.total;
    document.querySelector('.stat-mini-card.warning h4').textContent = stats.lowStock;
    document.querySelector('.stat-mini-card.danger h4').textContent = stats.outOfStock;
    document.querySelector('.stat-mini-card.success h4').textContent = 
        '$' + (stats.inventoryValue / 1000000).toFixed(1) + 'M';
}

function getStockStatus(stock, minStock) {
    if (stock === 0) return 'danger';
    if (stock <= minStock) return 'warning';
    return 'success';
}

function filterProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const stockFilter = document.querySelector('.btn-filter[data-filter].active').dataset.filter;

    const filtered = products.filter(product => {
        const matchesSearch = 
            product.name.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !category || product.category === category;
        
        const matchesStock = stockFilter === 'all' ||
            (stockFilter === 'disponible' && product.stock > product.minStock) ||
            (stockFilter === 'bajo' && product.stock > 0 && product.stock <= product.minStock) ||
            (stockFilter === 'agotado' && product.stock === 0);

        return matchesSearch && matchesCategory && matchesStock;
    });

    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    filtered.forEach(product => {
        const row = document.createElement('tr');
        const stockStatus = getStockStatus(product.stock, product.minStock);
        
        row.innerHTML = `
            <td>
                <div class="product-info">
                    <div class="product-image">📦</div>
                    <div class="product-details">
                        <h4>${product.name}</h4>
                        <p>${product.brand}</p>
                    </div>
                </div>
            </td>
            <td>${product.sku}</td>
            <td>${product.category}</td>
            <td>$${product.salePrice.toLocaleString()}</td>
            <td>
                <div class="stock-indicator">
                    <div class="stock-bar">
                        <div class="stock-bar-fill ${stockStatus}" 
                             style="width: ${Math.min((product.stock / product.minStock) * 100, 100)}%">
                        </div>
                    </div>
                    ${product.stock}
                </div>
            </td>
            <td>
                <span class="badge ${stockStatus}">
                    ${product.stock === 0 ? 'Agotado' : 
                      product.stock <= product.minStock ? 'Stock Bajo' : 'Disponible'}
                </span>
            </td>
            <td>
                <span class="badge info">
                    ${product.requiresSerial ? 'Requerido' : 'No Requerido'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" onclick="viewProduct(${product.id})">👁️</button>
                    <button class="btn-action edit" onclick="editProduct(${product.id})">✏️</button>
                    <button class="btn-action delete" onclick="deleteProduct(${product.id})">🗑️</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    document.getElementById('productCount').textContent = filtered.length;
}

function openModal(edit = false) {
    const modal = document.getElementById('productModal');
    modal.classList.add('active');
    document.getElementById('modalTitle').textContent = edit ? 'Editar Producto' : 'Nuevo Producto';
    if (!edit) {
        currentProductId = null;
        document.getElementById('productForm').reset();
    }
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('productForm').reset();
    currentProductId = null;
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    currentProductId = id;
    
    document.getElementById('productName').value = product.name;
    document.getElementById('productSKU').value = product.sku;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productBrand').value = product.brand;
    document.getElementById('productCostPrice').value = product.costPrice;
    document.getElementById('productSalePrice').value = product.salePrice;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productMinStock').value = product.minStock;
    document.getElementById('requiresSerial').checked = product.requiresSerial;
    document.getElementById('productDescription').value = product.description;

    openModal(true);
}

function deleteProduct(id) {
    checkAndDeleteProduct(id);
}

async function checkAndDeleteProduct(id) {
    try {
        // Primero verificar registros relacionados
        const checkResponse = await fetch(`/inventario/api/productos/${id}/delete/?check=true`, {
            method: 'POST'
        });
        const checkResult = await checkResponse.json();
        
        if (checkResult.success) {
            const rel = checkResult.registros_relacionados;
            let mensaje = `¿Eliminar "${checkResult.producto}"?`;
            
            if (rel.total > 0) {
                mensaje += `\n\n⚠️ ADVERTENCIA: Este producto tiene registros relacionados:\n`;
                if (rel.movimientos > 0) mensaje += `  • ${rel.movimientos} movimientos de inventario\n`;
                if (rel.garantias > 0) mensaje += `  • ${rel.garantias} garantías\n`;
                if (rel.detalles_venta > 0) mensaje += `  • ${rel.detalles_venta} detalles de venta\n`;
                mensaje += `\nTodos estos registros también serán eliminados.`;
            }
            
            if (!confirm(mensaje)) return;
            
            // Proceder con la eliminación
            const deleteResponse = await fetch(`/inventario/api/productos/${id}/delete/`, {
                method: 'POST'
            });
            const deleteResult = await deleteResponse.json();
            
            if (deleteResult.success) {
                let successMsg = '✅ Producto eliminado de Oracle';
                const elim = deleteResult.eliminados;
                if (elim.movimientos + elim.garantias + elim.detalles_venta > 0) {
                    successMsg += `\n\nRegistros eliminados:`;
                    if (elim.movimientos > 0) successMsg += `\n  • ${elim.movimientos} movimientos`;
                    if (elim.garantias > 0) successMsg += `\n  • ${elim.garantias} garantías`;
                    if (elim.detalles_venta > 0) successMsg += `\n  • ${elim.detalles_venta} detalles de venta`;
                }
                alert(successMsg);
                loadProductsFromAPI();
            } else {
                alert('❌ Error: ' + deleteResult.error);
            }
        }
    } catch (error) {
        alert('❌ Error de conexión: ' + error.message);
    }
}

function viewProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    alert(`
        Detalles del Producto:
        
        Nombre: ${product.name}
        SKU: ${product.sku}
        Categoría: ${product.category}
        Marca: ${product.brand}
        Precio de Compra: $${product.costPrice.toLocaleString()}
        Precio de Venta: $${product.salePrice.toLocaleString()}
        Stock Actual: ${product.stock}
        Stock Mínimo: ${product.minStock}
        Requiere Serie: ${product.requiresSerial ? 'Sí' : 'No'}
        
        Descripción:
        ${product.description}
    `);
}