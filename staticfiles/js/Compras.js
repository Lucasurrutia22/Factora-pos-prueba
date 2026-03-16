// Compras (Purchases) Module
(function() {
    'use strict';

    let products = [];
    let suppliers = [];
    let purchases = [];

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        loadProducts();
        loadSuppliers();
        loadPurchases();
        populateSelects();
    });

    // Load products
    function loadProducts() {
        // Compras.js - placeholder
        // El módulo Compras fue removido por petición del usuario. Este archivo mantiene
        // un placeholder vacío para evitar errores si alguna página aún lo referencia.
        console.log('Compras module disabled');
        product.costPrice = purchase.costPerUnit;

        localStorage.setItem('products', JSON.stringify(products));
        purchase.status = 'Recibida';
        localStorage.setItem('purchases', JSON.stringify(purchases));

        // Dispatch event
        window.dispatchEvent(new CustomEvent('productsUpdated', { detail: { source: 'Compras', action: 'receive' } }));

        renderPurchasesTable();
        alert('Compra recibida: ' + purchase.quantity + ' unidades agregadas al inventario');
    };

    // Delete purchase
    window.deletePurchase = function(index) {
        if (confirm('¿Estás seguro de eliminar esta orden?')) {
            purchases.splice(index, 1);
            localStorage.setItem('purchases', JSON.stringify(purchases));
            renderPurchasesTable();
        }
    };

    // Listen for updates
    window.addEventListener('storage', function(e) {
        if (e.key === 'products' || e.key === 'suppliers' || e.key === 'purchases') {
            loadProducts();
            loadSuppliers();
            loadPurchases();
            populateSelects();
        }
    });

    window.addEventListener('productsUpdated', function(e) {
        loadProducts();
        loadSuppliers();
        loadPurchases();
        populateSelects();
    });

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadProducts();
            loadSuppliers();
            loadPurchases();
            populateSelects();
        }
    });
})();

// Global dropdown functions
window.toggleProfileMenu = function() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
};

document.addEventListener('click', function(e) {
    const profileWrapper = document.querySelector('.user-profile-wrapper');
    const dropdown = document.getElementById('userDropdown');
    if (profileWrapper && !profileWrapper.contains(e.target) && dropdown) {
        dropdown.classList.remove('show');
    }
});

// Modal functions
function openUserProfile(event) {
    event.preventDefault();
    const modal = document.getElementById('userProfileModal');
    if (modal) modal.style.display = 'flex';
}

function openSettings(event) {
    event.preventDefault();
    const modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'flex';
}

function closeModalById(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}
