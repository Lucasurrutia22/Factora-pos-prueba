// JavaScript logic for managing the inventory

// Initialize products from localStorage or use sample data
let products = JSON.parse(localStorage.getItem('products')) || [
    {
        id: 1,
        name: 'Notebook Asus ROG Strix G15',
        sku: 'NB-ASUS-001',
        category: 'notebooks',
        brand: 'Asus',
        costPrice: 950000,
        salePrice: 1299990,
        stock: 12,
        minStock: 5,
        requiresSerial: true,
        description: 'Laptop gaming de alto rendimiento'
    }
];

// Current product being edited
let currentProductId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    updateProductsTable();
    updateStats();
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
    
    const product = {
        id: currentProductId || Date.now(),
        name: formData.get('productName'),
        sku: formData.get('productSKU'),
        category: formData.get('productCategory'),
        brand: formData.get('productBrand'),
        costPrice: parseInt(formData.get('productCostPrice')),
        salePrice: parseInt(formData.get('productSalePrice')),
        stock: parseInt(formData.get('productStock') || '0'),
        minStock: parseInt(formData.get('productMinStock') || '5'),
        requiresSerial: formData.get('requiresSerial') === 'on',
        description: formData.get('productDescription') || ''
    };

    if (currentProductId) {
        const index = products.findIndex(p => p.id === currentProductId);
        products[index] = product;
    } else {
        products.push(product);
    }

    localStorage.setItem('products', JSON.stringify(products));
    
    updateProductsTable();
    updateStats();
    closeModal();
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
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    products = products.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(products));
    updateProductsTable();
    updateStats();
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