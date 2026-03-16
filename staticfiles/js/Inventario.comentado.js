// JavaScript logic for managing the inventory
// (Archivo comentado línea a línea en español)

// Toggle dropdown menu
function toggleProfileMenu() { // Función que muestra/oculta el menú desplegable del perfil
    const dropdown = document.getElementById('userDropdown'); // Obtiene el elemento del dropdown por id
    dropdown.classList.toggle('show'); // Alterna la clase 'show' para mostrar u ocultar
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => { // Escucha clics en todo el documento
    const dropdown = document.getElementById('userDropdown'); // Obtiene el dropdown
    const userProfile = document.querySelector('.user-profile-wrapper'); // Obtiene el contenedor del perfil
    
    if (userProfile && !userProfile.contains(e.target)) { // Si el clic no ocurrió dentro del perfil
        dropdown.classList.remove('show'); // Cierra el dropdown
    }
});

// Logout session
function logoutSession(event) { // Función para cerrar sesión
    event.preventDefault(); // Evita el comportamiento por defecto del enlace
    
    // Mostrar confirmación
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) { // Pide confirmación al usuario
        // Limpiar sesión
        sessionStorage.removeItem('factora_user'); // Elimina la sesión del usuario del sessionStorage
        localStorage.removeItem('products'); // (Opcional) elimina productos de localStorage
        
        // Redirigir a login
        window.location.href = '/'; // Lleva al usuario a la página de login
    }
}

// Open user profile
function openUserProfile(event) { // Abre el modal de perfil de usuario
    event.preventDefault(); // Evita comportamiento por defecto
    const user = JSON.parse(sessionStorage.getItem('factora_user') || 'null') || { username: 'Admin Usuario', email: '', role: 'Administrador' }; // Lee datos de sesión
    document.getElementById('profileUsername').value = user.username || ''; // Rellena campo nombre
    document.getElementById('profileEmail').value = user.email || ''; // Rellena campo email
    document.getElementById('profileRole').value = user.role || 'Administrador'; // Rellena campo rol
    openModalById('userProfileModal'); // Muestra el modal de perfil
}

// Open settings
function openSettings(event) { // Abre el modal de configuración
    event.preventDefault(); // Evita comportamiento por defecto
    const settings = JSON.parse(localStorage.getItem('factora_settings') || 'null') || { theme: 'light', notifications: true }; // Lee ajustes guardados
    document.getElementById('settingTheme').value = settings.theme || 'light'; // Rellena el selector de tema
    document.getElementById('settingNotifications').checked = !!settings.notifications; // Rellena checkbox de notificaciones
    openModalById('settingsModal'); // Muestra el modal de configuración
}

// Modal helpers
function openModalById(id) { // Abre un modal por su id
    const m = document.getElementById(id); // Obtiene elemento
    if (m) m.classList.add('active'); // Añade clase para mostrarlo
}

function closeModalById(id) { // Cierra un modal por su id
    const m = document.getElementById(id); // Obtiene elemento
    if (m) m.classList.remove('active'); // Quita clase para ocultarlo
}

function saveUserProfile(e) { // Guarda los cambios del perfil de usuario
    e.preventDefault(); // Evita submit por defecto
    const username = document.getElementById('profileUsername').value.trim(); // Lee nombre
    const email = document.getElementById('profileEmail').value.trim(); // Lee email
    const role = document.getElementById('profileRole').value; // Lee rol

    const user = { username, email, role }; // Crea objeto usuario
    sessionStorage.setItem('factora_user', JSON.stringify(user)); // Guarda en sessionStorage

    // Update header display
    const welcomeEl = document.getElementById('welcomeText'); // Elemento de bienvenida
    const roleEl = document.getElementById('roleText'); // Elemento de rol
    const avatarEl = document.getElementById('userAvatar'); // Elemento avatar
    if (welcomeEl) welcomeEl.textContent = username; // Actualiza texto de bienvenida
    if (roleEl) roleEl.textContent = role; // Actualiza texto de rol
    if (avatarEl) avatarEl.textContent = username.charAt(0) || 'A'; // Actualiza avatar con inicial

    closeModalById('userProfileModal'); // Cierra modal de perfil
}

function saveSettings(e) { // Guarda la configuración general
    e.preventDefault(); // Evita comportamiento por defecto
    const theme = document.getElementById('settingTheme').value; // Lee tema
    const notifications = document.getElementById('settingNotifications').checked; // Lee notificaciones
    const settings = { theme, notifications }; // Crea objeto ajustes
    localStorage.setItem('factora_settings', JSON.stringify(settings)); // Guarda en localStorage

    applyTheme(theme); // Aplica el tema seleccionado
    closeModalById('settingsModal'); // Cierra modal de ajustes
}

function applyTheme(theme) { // Aplica tema claro u oscuro al body
    if (theme === 'dark') document.body.classList.add('theme-dark'); // Añade clase dark
    else document.body.classList.remove('theme-dark'); // Quita clase dark
}

// Apply theme on load
const savedSettingsInv = JSON.parse(localStorage.getItem('factora_settings') || 'null'); // Lee ajustes guardados
if (savedSettingsInv && savedSettingsInv.theme) applyTheme(savedSettingsInv.theme); // Si existe tema, aplicarlo

// Initialize products from localStorage or use sample data
let products = JSON.parse(localStorage.getItem('products')) || [ // Lee productos o usa ejemplo
    { // Producto ejemplo
        id: 1, // id del producto
        name: 'Notebook Asus ROG Strix G15', // nombre
        sku: 'NB-ASUS-001', // sku
        category: 'notebooks', // categoría
        brand: 'Asus', // marca
        costPrice: 950000, // precio costo
        salePrice: 1299990, // precio venta
        stock: 12, // stock actual
        minStock: 5, // stock mínimo
        requiresSerial: true, // si requiere número de serie
        description: 'Laptop gaming de alto rendimiento' // descripción
    }
];

// Current product being edited
let currentProductId = null; // Id del producto en edición (null si es nuevo)

// Initialize page
document.addEventListener('DOMContentLoaded', () => { // Cuando el DOM cargue
    updateProductsTable(); // Actualiza la tabla de productos
    updateStats(); // Actualiza estadísticas
    setupEventListeners(); // Configura event listeners
});

function setupEventListeners() { // Configura eventos de búsqueda y filtros
    // Search
    document.getElementById('searchProducts').addEventListener('input', filterProducts); // Filtra al escribir
    document.getElementById('categoryFilter').addEventListener('change', filterProducts); // Filtra por categoría
    
    // Filter buttons
    document.querySelectorAll('.btn-filter[data-filter]').forEach(button => { // Para cada botón de filtro
        button.addEventListener('click', (e) => { // Añade manejador click
            document.querySelectorAll('.btn-filter[data-filter]').forEach(btn => btn.classList.remove('active')); // Quita active de todos
            e.target.classList.add('active'); // Añade active al botón clicado
            filterProducts(); // Aplica filtro
        });
    });
}

function handleProductSubmit(e) { // Maneja submit del formulario de producto
    e.preventDefault(); // Evita recarga de página
    
    const form = e.target; // Formulario enviado
    const formData = new FormData(form); // Construye FormData
    
    const product = { // Crea objeto producto con datos del formulario
        id: currentProductId || Date.now(), // usa id existente o timestamp
        name: formData.get('productName'), // nombre
        sku: formData.get('productSKU'), // sku
        category: formData.get('productCategory'), // categoría
        brand: formData.get('productBrand'), // marca
        costPrice: parseInt(formData.get('productCostPrice')), // precio costo (numero)
        salePrice: parseInt(formData.get('productSalePrice')), // precio venta (numero)
        stock: parseInt(formData.get('productStock') || '0'), // stock (numero)
        minStock: parseInt(formData.get('productMinStock') || '5'), // stock mínimo (numero)
        requiresSerial: formData.get('requiresSerial') === 'on', // si requiere serie
        description: formData.get('productDescription') || '' // descripción
    };

    if (currentProductId) { // Si estamos editando
        const index = products.findIndex(p => p.id === currentProductId); // Busca índice
        products[index] = product; // Reemplaza producto
    } else {
        products.push(product); // Agrega nuevo producto
    }

    localStorage.setItem('products', JSON.stringify(products)); // Guarda productos en localStorage
    
    updateProductsTable(); // Actualiza tabla
    updateStats(); // Actualiza estadísticas
    closeModal(); // Cierra modal
}

function updateProductsTable() { // Renderiza la tabla de productos
    const tbody = document.getElementById('productsTableBody'); // Cuerpo de la tabla
    tbody.innerHTML = ''; // Limpia contenido
    
    products.forEach(product => { // Recorre cada producto
        const row = document.createElement('tr'); // Crea fila
        
        const stockStatus = getStockStatus(product.stock, product.minStock); // Determina estado de stock
        
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
        `; // Contenido HTML de la fila con datos y botones
        
        tbody.appendChild(row); // Añade la fila al cuerpo
    });

    document.getElementById('productCount').textContent = products.length; // Actualiza contador de productos
}

function updateStats() { // Calcula y muestra estadísticas del inventario
    const stats = {
        total: products.length, // total de productos
        lowStock: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length, // stock bajo
        outOfStock: products.filter(p => p.stock === 0).length, // agotados
        inventoryValue: products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0) // valor inventario
    };

    document.getElementById('totalProducts').textContent = stats.total; // Muestra total
    document.querySelector('.stat-mini-card.warning h4').textContent = stats.lowStock; // Muestra stock bajo
    document.querySelector('.stat-mini-card.danger h4').textContent = stats.outOfStock; // Muestra agotados
    document.querySelector('.stat-mini-card.success h4').textContent = 
        '$' + (stats.inventoryValue / 1000000).toFixed(1) + 'M'; // Muestra valor inventario en millones
}

function getStockStatus(stock, minStock) { // Devuelve una clase según el stock
    if (stock === 0) return 'danger'; // Agotado
    if (stock <= minStock) return 'warning'; // Stock bajo
    return 'success'; // Disponible
}

function filterProducts() { // Filtra productos según búsqueda, categoría y estado
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase(); // Término de búsqueda
    const category = document.getElementById('categoryFilter').value; // Categoría seleccionada
    const stockFilter = document.querySelector('.btn-filter[data-filter].active').dataset.filter; // Filtro activo

    const filtered = products.filter(product => { // Filtra array de productos
        const matchesSearch = 
            product.name.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm); // Coincidencia por nombre, sku o marca
        
        const matchesCategory = !category || product.category === category; // Coincidencia de categoría
        
        const matchesStock = stockFilter === 'all' ||
            (stockFilter === 'disponible' && product.stock > product.minStock) ||
            (stockFilter === 'bajo' && product.stock > 0 && product.stock <= product.minStock) ||
            (stockFilter === 'agotado' && product.stock === 0); // Coincidencia por estado

        return matchesSearch && matchesCategory && matchesStock; // Devuelve true si cumple todos
    });

    const tbody = document.getElementById('productsTableBody'); // Cuerpo de la tabla
    tbody.innerHTML = ''; // Limpia tabla
    
    filtered.forEach(product => { // Renderiza filas filtradas
        const row = document.createElement('tr');
        const stockStatus = getStockStatus(product.stock, product.minStock); // Estado stock
        
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
        `; // HTML de la fila
        
        tbody.appendChild(row); // Añade fila filtrada
    });

    document.getElementById('productCount').textContent = filtered.length; // Actualiza contador con filtrado
}

function openModal(edit = false) { // Abre modal para nuevo o editar producto
    const modal = document.getElementById('productModal'); // Obtiene modal
    modal.classList.add('active'); // Muestra modal
    document.getElementById('modalTitle').textContent = edit ? 'Editar Producto' : 'Nuevo Producto'; // Ajusta título
    if (!edit) {
        currentProductId = null; // Resetea id actual
        document.getElementById('productForm').reset(); // Resetea formulario
    }
}

function closeModal() { // Cierra modal de producto
    document.getElementById('productModal').classList.remove('active'); // Oculta modal
    document.getElementById('productForm').reset(); // Resetea formulario
    currentProductId = null; // Resetea id
}

function editProduct(id) { // Llena modal con datos para editar
    const product = products.find(p => p.id === id); // Busca producto por id
    if (!product) return; // Si no existe, sale

    currentProductId = id; // Guarda id actual
    
    document.getElementById('productName').value = product.name; // Rellena nombre
    document.getElementById('productSKU').value = product.sku; // Rellena SKU
    document.getElementById('productCategory').value = product.category; // Rellena categoría
    document.getElementById('productBrand').value = product.brand; // Rellena marca
    document.getElementById('productCostPrice').value = product.costPrice; // Rellena costo
    document.getElementById('productSalePrice').value = product.salePrice; // Rellena precio venta
    document.getElementById('productStock').value = product.stock; // Rellena stock
    document.getElementById('productMinStock').value = product.minStock; // Rellena stock mínimo
    document.getElementById('requiresSerial').checked = product.requiresSerial; // Rellena checkbox serie
    document.getElementById('productDescription').value = product.description; // Rellena descripción

    openModal(true); // Abre modal en modo edición
}

function deleteProduct(id) { // Elimina producto con confirmación
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return; // Pregunta confirmación
    
    products = products.filter(p => p.id !== id); // Filtra producto eliminado
    localStorage.setItem('products', JSON.stringify(products)); // Guarda en localStorage
    updateProductsTable(); // Actualiza tabla
    updateStats(); // Actualiza estadísticas
}

function viewProduct(id) { // Muestra details del producto en alert
    const product = products.find(p => p.id === id); // Busca producto
    if (!product) return; // Si no existe, sale
    
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
    `); // Muestra los detalles con formato
}
