/**
 * API Client para FactoraPos
 * Conecta el frontend con la base de datos Oracle a través de Django
 */

const API = {
    // =============================================
    // PRODUCTOS
    // =============================================
    productos: {
        async getAll() {
            const response = await fetch('/inventario/api/productos/');
            return await response.json();
        },
        
        async create(data) {
            const response = await fetch('/inventario/api/productos/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        },
        
        async update(id, data) {
            const response = await fetch(`/inventario/api/productos/${id}/update/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        },
        
        async delete(id) {
            const response = await fetch(`/inventario/api/productos/${id}/delete/`, {
                method: 'POST'
            });
            return await response.json();
        }
    },
    
    // =============================================
    // PROVEEDORES
    // =============================================
    proveedores: {
        async getAll() {
            const response = await fetch('/inventario/api/proveedores/');
            return await response.json();
        },
        
        async create(data) {
            const response = await fetch('/inventario/api/proveedores/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        }
    },
    
    // =============================================
    // MOVIMIENTOS DE INVENTARIO
    // =============================================
    movimientos: {
        async getAll() {
            const response = await fetch('/inventario/api/movimientos/');
            return await response.json();
        },
        
        async create(data) {
            const response = await fetch('/inventario/api/movimientos/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        }
    },
    
    // =============================================
    // CLIENTES
    // =============================================
    clientes: {
        async getAll() {
            const response = await fetch('/ventas/api/clientes/');
            return await response.json();
        },
        
        async create(data) {
            const response = await fetch('/ventas/api/clientes/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        },
        
        async update(id, data) {
            const response = await fetch(`/ventas/api/clientes/${id}/update/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        },
        
        async delete(id) {
            const response = await fetch(`/ventas/api/clientes/${id}/delete/`, {
                method: 'POST'
            });
            return await response.json();
        }
    },
    
    // =============================================
    // VENTAS
    // =============================================
    ventas: {
        async getAll() {
            const response = await fetch('/ventas/api/ventas/');
            return await response.json();
        },
        
        async create(data) {
            const response = await fetch('/ventas/api/ventas/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        }
    },
    
    // =============================================
    // USUARIOS / AUTH
    // =============================================
    usuarios: {
        async getAll() {
            const response = await fetch('/ventas/api/usuarios/');
            return await response.json();
        },
        
        async login(username, password) {
            const response = await fetch('/ventas/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            return await response.json();
        }
    }
};

// Ejemplo de uso:
// const productos = await API.productos.getAll();
// await API.productos.create({ nombre: 'Test', precio: 1000, stock: 10 });
// await API.clientes.delete(5);

console.log('API Client cargado - Conectado a Oracle Database');
