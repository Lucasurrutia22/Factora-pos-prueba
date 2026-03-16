/**
 * VALIDADOR DE CÓDIGOS BX (Scanner 2D)
 * =====================================
 * 
 * Módulo frontend profesional para validación de códigos escaneados
 * Control de entrada/salida en tiempo real
 * 
 * Características:
 * - Validación en tiempo real al escanear
 * - Mensajes contextuales según estado
 * - Auditoría de códigos
 * - Bloqueo de duplicidad
 */

class ValidadorCodigoBX {
    constructor(config = {}) {
        this.apiBaseUrl = config.apiBaseUrl || '/stock/api/movimientos';
        this.callback = config.callback || null;
        this.debug = config.debug || false;
    }
    
    /**
     * Valida un código BX antes de registrar movimiento
     * 
     * @param {string} codigo - Código BX escaneado
     * @param {string} tipoMovimiento - "ENTRADA" o "SALIDA"
     * @param {number} productoId - ID del producto (opcional)
     * @returns {Promise<Object>} Resultado de validación
     */
    async validarCodigo(codigo, tipoMovimiento, productoId = null) {
        this.log(`Validando código: ${codigo} (${tipoMovimiento})`);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/validar-codigo-bx/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.obtenerCSRFToken()
                },
                body: JSON.stringify({
                    codigo: codigo.trim().toUpperCase(),
                    tipo: tipoMovimiento.toUpperCase(),
                    producto_id: productoId
                })
            });
            
            const datos = await response.json();
            
            // Ejecutar callback si existe
            if (this.callback) {
                this.callback(datos);
            }
            
            return datos;
        } catch (error) {
            this.log(`Error en validación: ${error.message}`, 'error');
            return {
                valido: false,
                estado: 'ERROR_CONEXION',
                mensaje: `Error de conexión: ${error.message}`,
                codigo: codigo
            };
        }
    }
    
    /**
     * Obtiene el historial de un código BX
     * 
     * @param {string} codigo - Código BX a buscar
     * @returns {Promise<Object>} Historial del código
     */
    async obtenerHistorial(codigo) {
        this.log(`Obteniendo historial de: ${codigo}`);
        
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/historial-codigo-bx/?codigo=${encodeURIComponent(codigo)}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return await response.json();
        } catch (error) {
            this.log(`Error obteniendo historial: ${error.message}`, 'error');
            return { error: error.message };
        }
    }
    
    /**
     * Valida la integridad de un código BX
     * 
     * @param {string} codigo - Código BX a validar
     * @returns {Promise<Object>} Resultado de validación de integridad
     */
    async validarIntegridad(codigo) {
        this.log(`Validando integridad de: ${codigo}`);
        
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/validar-integridad-bx/?codigo=${encodeURIComponent(codigo)}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return await response.json();
        } catch (error) {
            this.log(`Error en validación de integridad: ${error.message}`, 'error');
            return { error: error.message };
        }
    }
    
    /**
     * Obtiene el token CSRF necesario para POST
     * 
     * @returns {string} Token CSRF
     */
    obtenerCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]');
        if (token) {
            return token.value;
        }
        
        // Alternativa: buscar en cookies
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        
        return '';
    }
    
    /**
     * Log con soporte a debug
     * 
     * @param {string} mensaje - Mensaje a loguear
     * @param {string} tipo - "info", "warn", "error"
     */
    log(mensaje, tipo = 'info') {
        if (!this.debug) return;
        
        const prefix = `[ValidadorBX] ${new Date().toLocaleTimeString()}`;
        
        if (tipo === 'error') {
            console.error(`${prefix} ERROR:`, mensaje);
        } else if (tipo === 'warn') {
            console.warn(`${prefix} WARN:`, mensaje);
        } else {
            console.log(`${prefix}`, mensaje);
        }
    }
    
    /**
     * Formatea el resultado para mostrar al usuario
     * 
     * @param {Object} resultado - Resultado de validación
     * @returns {Object} Objeto formateado con clase CSS, icono, mensaje
     */
    formatearResultado(resultado) {
        const formatos = {
            'VALIDO': {
                clase: 'alert-success',
                icono: '✓',
                color: '#28a745'
            },
            'DUPLICADO_ENTRADA': {
                clase: 'alert-danger',
                icono: '✗',
                color: '#dc3545',
                titulo: 'CÓDIGO DUPLICADO'
            },
            'NO_EXISTE_EN_INVENTARIO': {
                clase: 'alert-danger',
                icono: '✗',
                color: '#dc3545',
                titulo: 'CÓDIGO NO ENCONTRADO'
            },
            'VALIDO_SALIDA': {
                clase: 'alert-success',
                icono: '✓',
                color: '#28a745'
            },
            'STOCK_INSUFICIENTE': {
                clase: 'alert-warning',
                icono: '⚠',
                color: '#ffc107'
            },
            'ERROR_VALIDACION': {
                clase: 'alert-danger',
                icono: '✗',
                color: '#dc3545'
            },
            'ERROR_PRODUCTO': {
                clase: 'alert-danger',
                icono: '✗',
                color: '#dc3545'
            },
            'ERROR_CONEXION': {
                clase: 'alert-danger',
                icono: '✗',
                color: '#dc3545'
            }
        };
        
        const formato = formatos[resultado.estado] || {
            clase: 'alert-secondary',
            icono: '?',
            color: '#6c757d'
        };
        
        return {
            ...resultado,
            ...formato
        };
    }
}

/**
 * WIDGET INTEGRADO PARA SCANNER
 * =============================
 */
class WidgetScannerBX {
    constructor(contenedorId, config = {}) {
        this.contenedor = document.getElementById(contenedorId);
        if (!this.contenedor) {
            throw new Error(`Contenedor #${contenedorId} no encontrado`);
        }
        
        this.validador = new ValidadorCodigoBX({
            callback: (resultado) => this.procesarValidacion(resultado),
            debug: config.debug || false
        });
        
        this.tipoMovimientoActual = 'ENTRADA';
        this.inicializar();
    }
    
    /**
     * Inicializa el widget HTML
     */
    inicializar() {
        this.contenedor.innerHTML = `
            <div class="scanner-widget">
                <style>
                    .scanner-widget {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        max-width: 500px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .scanner-widget h3 {
                        margin-top: 0;
                        color: #333;
                        border-bottom: 3px solid #007bff;
                        padding-bottom: 10px;
                    }
                    
                    .form-group-scanner {
                        margin-bottom: 15px;
                    }
                    
                    .form-group-scanner label {
                        display: block;
                        font-weight: 600;
                        margin-bottom: 5px;
                        color: #495057;
                    }
                    
                    .form-group-scanner input,
                    .form-group-scanner select {
                        width: 100%;
                        padding: 10px;
                        border: 2px solid #dee2e6;
                        border-radius: 4px;
                        font-size: 14px;
                        transition: border-color 0.3s;
                    }
                    
                    .form-group-scanner input:focus,
                    .form-group-scanner select:focus {
                        outline: none;
                        border-color: #007bff;
                        box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
                    }
                    
                    .tipo-movimiento-selector {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    
                    .btn-tipo {
                        flex: 1;
                        padding: 10px;
                        border: 2px solid #dee2e6;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s;
                    }
                    
                    .btn-tipo:hover {
                        border-color: #007bff;
                    }
                    
                    .btn-tipo.activo {
                        background: #007bff;
                        color: white;
                        border-color: #007bff;
                    }
                    
                    .validacion-resultado {
                        margin-top: 20px;
                        padding: 15px;
                        border-radius: 4px;
                        display: none;
                    }
                    
                    .validacion-resultado.show {
                        display: block;
                    }
                    
                    .validacion-resultado.success {
                        background: #d4edda;
                        border: 1px solid #c3e6cb;
                        color: #155724;
                    }
                    
                    .validacion-resultado.error {
                        background: #f8d7da;
                        border: 1px solid #f5c6cb;
                        color: #721c24;
                    }
                    
                    .validacion-resultado.warning {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        color: #856404;
                    }
                    
                    .validacion-titulo {
                        font-weight: 700;
                        margin-bottom: 5px;
                        font-size: 14px;
                    }
                    
                    .validacion-mensaje {
                        font-size: 13px;
                    }
                    
                    .validacion-detalles {
                        margin-top: 10px;
                        font-size: 12px;
                        border-top: 1px solid rgba(0,0,0,0.1);
                        padding-top: 10px;
                    }
                    
                    .detalles-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 3px 0;
                    }
                    
                    .detalles-label {
                        font-weight: 600;
                    }
                    
                    .spinner-input {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }
                    
                    .spinner-input input {
                        flex: 1;
                    }
                    
                    .btn-accion {
                        width: 100%;
                        padding: 12px;
                        margin-top: 10px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.3s;
                    }
                    
                    .btn-accion:hover:not(:disabled) {
                        background: #218838;
                    }
                    
                    .btn-accion:disabled {
                        background: #ccc;
                        cursor: not-allowed;
                    }
                </style>
                
                <h3>📱 Scanner de Códigos BX</h3>
                
                <div class="tipo-movimiento-selector">
                    <button class="btn-tipo activo" data-tipo="ENTRADA">📥 ENTRADA</button>
                    <button class="btn-tipo" data-tipo="SALIDA">📤 SALIDA</button>
                </div>
                
                <div class="form-group-scanner">
                    <label for="codigoBX">Código BX (Scanner)</label>
                    <input 
                        type="text" 
                        id="codigoBX" 
                        placeholder="Escanea el código 2D..."
                        autocomplete="off"
                    >
                </div>
                
                <div class="validacion-resultado" id="resultadoValidacion"></div>
                
                <button class="btn-accion" id="btnRegistrar" disabled>
                    Registrar Movimiento
                </button>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    /**
     * Adjunta event listeners
     */
    attachEventListeners() {
        // Botones de tipo de movimiento
        this.contenedor.querySelectorAll('.btn-tipo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.cambiarTipoMovimiento(e.target.dataset.tipo);
            });
        });
        
        // Input de código
        const inputCodigo = this.contenedor.querySelector('#codigoBX');
        inputCodigo.addEventListener('keyup', (e) => {
            // En escaners reales, el Enter automáticamente dispara validación
            if (e.key === 'Enter') {
                this.validarCodigo();
            }
        });
        
        inputCodigo.addEventListener('blur', () => {
            if (inputCodigo.value.trim()) {
                this.validarCodigo();
            }
        });
        
        // Botón registrar
        this.contenedor.querySelector('#btnRegistrar').addEventListener('click', () => {
            this.registrarMovimiento();
        });
    }
    
    /**
     * Cambia el tipo de movimiento
     */
    cambiarTipoMovimiento(tipo) {
        this.tipoMovimientoActual = tipo;
        
        // Actualizar UI
        this.contenedor.querySelectorAll('.btn-tipo').forEach(btn => {
            btn.classList.toggle('activo', btn.dataset.tipo === tipo);
        });
        
        // Limpiar campo
        const inputCodigo = this.contenedor.querySelector('#codigoBX');
        inputCodigo.value = '';
        inputCodigo.focus();
        
        // Limpiar resultado anterior
        this.limpiarResultado();
    }
    
    /**
     * Valida el código escaneado
     */
    async validarCodigo() {
        const inputCodigo = this.contenedor.querySelector('#codigoBX');
        const codigo = inputCodigo.value.trim();
        
        if (!codigo) {
            this.mostrarError('Código vacío');
            return;
        }
        
        // Desabilitar input durante validación
        inputCodigo.disabled = true;
        
        const resultado = await this.validador.validarCodigo(
            codigo,
            this.tipoMovimientoActual
        );
        
        inputCodigo.disabled = false;
        this.procesarValidacion(resultado);
    }
    
    /**
     * Procesa el resultado de validación
     */
    procesarValidacion(resultado) {
        const formatted = this.validador.formatearResultado(resultado);
        const divResultado = this.contenedor.querySelector('#resultadoValidacion');
        const btnRegistrar = this.contenedor.querySelector('#btnRegistrar');
        
        // Mostrar resultado
        let html = `<div class="validacion-titulo">${formatted.icono} ${resultado.estado}</div>`;
        html += `<div class="validacion-mensaje">${resultado.mensaje}</div>`;
        
        if (resultado.producto_nombre) {
            html += `<div class="validacion-detalles">`;
            html += `<div class="detalles-row"><span class="detalles-label">Producto:</span> ${resultado.producto_nombre}</div>`;
            if (resultado.stock_actual !== undefined) {
                html += `<div class="detalles-row"><span class="detalles-label">Stock:</span> ${resultado.stock_actual}</div>`;
            }
            if (resultado.recomendacion) {
                html += `<div class="detalles-row"><span class="detalles-label">💡 ${resultado.recomendacion}</span></div>`;
            }
            html += `</div>`;
        }
        
        divResultado.innerHTML = html;
        divResultado.className = 'validacion-resultado show';
        
        if (formatted.clase.includes('success')) {
            divResultado.classList.add('success');
        } else if (formatted.clase.includes('danger')) {
            divResultado.classList.add('error');
        } else if (formatted.clase.includes('warning')) {
            divResultado.classList.add('warning');
        }
        
        // Habilitar botón registrar solo si es válido
        btnRegistrar.disabled = !resultado.valido;
        
        // Guardar resultado para registrar
        this.ultimoResultado = resultado;
    }
    
    /**
     * Registra el movimiento
     */
    async registrarMovimiento() {
        if (!this.ultimoResultado || !this.ultimoResultado.valido) {
            alert('Valida el código primero');
            return;
        }
        
        // Aquí se integraría con el endpoint de crear movimiento
        console.log('Registrando movimiento:', this.ultimoResultado);
        alert(`✓ Movimiento ${this.tipoMovimientoActual} registrado: ${this.ultimoResultado.codigo}`);
        
        // Limpiar para siguiente
        this.limpiarFormulario();
    }
    
    /**
     * Limpia el formulario
     */
    limpiarFormulario() {
        const inputCodigo = this.contenedor.querySelector('#codigoBX');
        inputCodigo.value = '';
        inputCodigo.focus();
        this.limpiarResultado();
        const btnRegistrar = this.contenedor.querySelector('#btnRegistrar');
        btnRegistrar.disabled = true;
    }
    
    /**
     * Limpia el resultado mostrado
     */
    limpiarResultado() {
        const divResultado = this.contenedor.querySelector('#resultadoValidacion');
        divResultado.innerHTML = '';
        divResultado.classList.remove('show', 'success', 'error', 'warning');
    }
    
    /**
     * Muestra un error
     */
    mostrarError(mensaje) {
        const divResultado = this.contenedor.querySelector('#resultadoValidacion');
        divResultado.innerHTML = `<div class="validacion-titulo">❌ Error</div><div class="validacion-mensaje">${mensaje}</div>`;
        divResultado.className = 'validacion-resultado show error';
    }
}

// Exportar para uso global
window.ValidadorCodigoBX = ValidadorCodigoBX;
window.WidgetScannerBX = WidgetScannerBX;
