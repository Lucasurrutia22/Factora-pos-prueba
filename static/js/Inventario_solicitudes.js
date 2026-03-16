// Gestión de Solicitudes de Instalación

// Clientes personalizados
let customClientes = [];

// Tipos de solicitud personalizados
let customTipos = [];

// Datos de solicitudes (temporal - en producción vendría de la API)
let solicitudes = [
    {
        codigo: "SOL-2024-015",
        cliente: "Falabella",
        sucursal: "Mall Plaza Norte",
        tipo_solicitud: "Instalación",
        estado: "Instalado",
        tecnico: "Juan Pérez",
        fecha_instalacion: "2024-08-15",
        equipos: {
            totem: 2,
            tv_43: 1,
            tv_55: 0,
            tvbox: 1,
            soporte_brazo: 1,
            carcasa_ap: 2
        }
    }
];

// Por defecto importar localmente. Si quieres sincronizar con backend, cambia a true.
const SYNC_TO_BACKEND = false;

let currentEditIndex = null;

// Cargar solicitudes al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadCustomClientes();
    loadCustomTipos();
    loadSolicitudesFromStorage();
    renderSolicitudes();
    updateStats();
    updateClienteSelect();
    updateTipoSelect();
});

// Asegurar accesibilidad global y enganchar listeners para el modal de importación
document.addEventListener('DOMContentLoaded', function() {
    // Exponer funciones que se usan en HTML inline
    window.openImportModal = openImportModal;
    window.closeImportModal = closeImportModal;
    window.processImport = processImport;
    window.deleteImportedData = deleteImportedData;
    window.clearAllSolicitudes = clearAllSolicitudes;

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.removeEventListener('change', handleFileSelect);
        fileInput.addEventListener('change', handleFileSelect);
    }

    const dropArea = document.querySelector('.file-upload-area');
    if (dropArea) {
        dropArea.removeEventListener('dragover', handleDragOver);
        dropArea.removeEventListener('drop', handleFileDrop);
        dropArea.addEventListener('dragover', handleDragOver);
        dropArea.addEventListener('drop', handleFileDrop);
    }

    const btn = document.getElementById('btnProcessImport');
    if (btn) {
        console.log('btnProcessImport found, display=', btn.style.display, ' disabled=', btn.disabled);
        // ensure click binding both via listener and inline fallback
        try { btn.removeEventListener('click', processImport); } catch(e){}
        btn.addEventListener('click', function(e){ console.log('btnProcessImport clicked'); processImport(); });
        try { btn.setAttribute('onclick', 'processImport()'); } catch(e){}
    }

    // Añadir botón para reintentar sincronización
    const importModal = document.getElementById('importModal');
    if (importModal) {
        const footer = importModal.querySelector('.modal-footer');
        if (footer && !document.getElementById('btnRetrySync')) {
            const retryBtn = document.createElement('button');
            retryBtn.type = 'button';
            retryBtn.id = 'btnRetrySync';
            retryBtn.className = 'btn-secondary';
            retryBtn.textContent = 'Reintentar sincronización';
            retryBtn.style.marginRight = '10px';
            retryBtn.addEventListener('click', syncUnsynced);
            footer.insertBefore(retryBtn, footer.firstChild);
        }
        if (footer && !document.getElementById('btnDeleteImported')) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.id = 'btnDeleteImported';
            delBtn.className = 'btn-secondary';
            delBtn.textContent = 'Eliminar datos importados';
            delBtn.style.marginRight = '10px';
            delBtn.addEventListener('click', function(){ if (confirm('¿Eliminar datos importados recientemente? Esta acción no se puede deshacer.')) deleteImportedData(); });
            footer.insertBefore(delBtn, footer.firstChild);
        }
    }
});

// Cargar clientes personalizados
function loadCustomClientes() {
    const stored = localStorage.getItem('factora_custom_clientes');
    if (stored) {
        try {
            customClientes = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading custom clientes:', e);
        }
    }
}

// Cargar tipos personalizados
function loadCustomTipos() {
    const stored = localStorage.getItem('factora_custom_tipos');
    if (stored) {
        try {
            customTipos = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading custom tipos:', e);
        }
    }
}

// Guardar clientes personalizados
function saveCustomClientes() {
    localStorage.setItem('factora_custom_clientes', JSON.stringify(customClientes));
}

// Guardar tipos personalizados
function saveCustomTipos() {
    localStorage.setItem('factora_custom_tipos', JSON.stringify(customTipos));
}

// Actualizar select de clientes
function updateClienteSelect() {
    const select = document.getElementById('productCliente');
    if (!select) return;
    
    const currentValue = select.value;
    
    // Limpiar opciones excepto las primeras (por defecto y los clientes base)
    select.innerHTML = `
        <option value="">Seleccionar...</option>
        <option value="Walmart Chile">Walmart Chile</option>
        <option value="Cencosud">Cencosud</option>
        <option value="SMU">SMU (Unimarc)</option>
        <option value="Falabella">Falabella</option>
    `;
    
    // Agregar clientes personalizados
    customClientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente;
        option.textContent = cliente;
        select.appendChild(option);
    });
    
    // Agregar opción de nuevo cliente al final
    const newOption = document.createElement('option');
    newOption.value = '__nuevo__';
    newOption.textContent = '➕ Agregar Nuevo Cliente...';
    newOption.style.color = '#667eea';
    newOption.style.fontWeight = '600';
    select.appendChild(newOption);
    
    // Restaurar valor seleccionado
    if (currentValue && currentValue !== '__nuevo__') {
        select.value = currentValue;
    }
}

// Actualizar select de tipos de solicitud
function updateTipoSelect() {
    const select = document.getElementById('productTipo');
    if (!select) return;
    
    const currentValue = select.value;
    
    // Limpiar opciones y agregar las base
    select.innerHTML = `
        <option value="">Seleccionar...</option>
        <option value="Instalación">Instalación</option>
        <option value="Retiro">Retiro</option>
        <option value="Mantenimiento">Mantenimiento</option>
    `;
    
    // Agregar tipos personalizados
    customTipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        select.appendChild(option);
    });
    
    // Agregar opción de nuevo tipo al final
    const newOption = document.createElement('option');
    newOption.value = '__nuevo__';
    newOption.textContent = '➕ Agregar Nuevo Tipo...';
    newOption.style.color = '#667eea';
    newOption.style.fontWeight = '600';
    select.appendChild(newOption);
    
    // Restaurar valor seleccionado
    if (currentValue && currentValue !== '__nuevo__') {
        select.value = currentValue;
    }
}

// Cargar desde localStorage
function loadSolicitudesFromStorage() {
    const stored = localStorage.getItem('factora_solicitudes');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                solicitudes = parsed.map(sanitizeSolicitud);
            } else {
                console.warn('loadSolicitudesFromStorage: stored value is not an array, resetting');
                solicitudes = [];
            }
        } catch (e) {
            console.error('Error loading solicitudes:', e);
            // fallback: clear corrupted storage to avoid repeated crashes
            try { localStorage.removeItem('factora_solicitudes'); } catch(e2) { console.warn('could not remove corrupted storage', e2); }
            solicitudes = [];
        }
    }
}

// Guardar en localStorage
function saveSolicitudesToStorage() {
    try {
        // sanitize all items before saving to avoid corrupt or unexpected structures
        const safe = (solicitudes || []).map(sanitizeSolicitud);
        // Optional: cap stored items to a large number to avoid exhausting localStorage
        const MAX_STORE = 20000;
        if (safe.length > MAX_STORE) safe.length = MAX_STORE;
        localStorage.setItem('factora_solicitudes', JSON.stringify(safe));
        // keep in-memory consistent with sanitized data
        solicitudes = safe;
    } catch (err) {
        console.error('saveSolicitudesToStorage failed', err);
        showNotification('No se pudo guardar solicitudes en localStorage: ' + (err && err.message), 'danger');
    }
}

// Renderizar tabla de solicitudes
function renderSolicitudes() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    try {
        if (!Array.isArray(solicitudes)) solicitudes = [];
        if (solicitudes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #64748b;">
                    No hay solicitudes registradas. Haz clic en "Nueva Solicitud" para comenzar.
                </td>
            </tr>
        `;
        document.getElementById('productCount').textContent = '0';
        return;
    }
    } catch (err) {
        console.error('renderSolicitudes top-level error, resetting solicitudes array', err);
        solicitudes = [];
        try { saveSolicitudesToStorage(); } catch(e){}
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:#64748b;">No hay solicitudes registradas.</td></tr>`;
        document.getElementById('productCount').textContent = '0';
        return;
    }

    tbody.innerHTML = solicitudes.map((sol, index) => {
        const totalEquipos = Object.values(sol.equipos).reduce((a, b) => a + b, 0);
        const equiposResumen = Object.entries(sol.equipos)
            .filter(([key, val]) => val > 0)
            .map(([key, val]) => `${formatEquipoName(key)}: ${val}`)
            .join(', ');
        const unsyncedBadge = sol._synced === false ? '<span style="color: #b45309; font-weight:600; margin-left:6px;">(sincronizar)</span>' : '';

        const mainRow = `
            <tr class="main-row">
                <td><strong>${sol.codigo}</strong>${unsyncedBadge}</td>
                <td>${sol.cliente}</td>
                <td>${sol.sucursal}</td>
                <td>${sol.tipo_solicitud}</td>
                <td>${sol.tecnico}</td>
                <td>
                    <div class="date-cell">
                        <div class="date-main">${formatDate(sol.fecha_instalacion)}</div>
                    </div>
                </td>
                <td>
                    ${sol.fecha_reprogramada ? `<div class="date-cell"><div class="date-reprog"><span class="reprog-date">${formatDate(sol.fecha_reprogramada)}</span></div></div>` : '&nbsp;'}
                </td>
                <td title="${equiposResumen}">
                    <span class="badge-info">${totalEquipos} equipos</span>
                </td>
                <td>
                    <span class="status-badge ${getStatusClass(sol.estado)}">
                        ${sol.estado}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewSolicitud(${index})" title="Ver detalle">
                            👁️
                        </button>
                        <button class="btn-icon" onclick="editSolicitud(${index})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-icon btn-danger" onclick="deleteSolicitud(${index})" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;

        return mainRow;
    }).join('');

    document.getElementById('productCount').textContent = solicitudes.length;
}

// Actualizar estadísticas
function updateStats() {
    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
    const instaladas = solicitudes.filter(s => s.estado === 'Instalado').length;
    const totalEquipos = solicitudes.reduce((sum, sol) => {
        return sum + Object.values(sol.equipos).reduce((a, b) => a + b, 0);
    }, 0);

    document.getElementById('totalSolicitudes').textContent = total;
    document.getElementById('pendientesSolicitudes').textContent = pendientes;
    document.getElementById('instaladasSolicitudes').textContent = instaladas;
    document.getElementById('equiposInstalados').textContent = totalEquipos;
}

// Formatear nombre de equipo
function formatEquipoName(key) {
    const names = {
        totem: 'Totem',
        tv_43: 'TV 43"',
        tv_55: 'TV 55"',
        tv_32: 'TV 32"',
        tv_40: 'TV 40"',
        tv_50: 'TV 50"',
        tv_65: 'TV 65"',
        tvbox: 'TV Box',
        tv_cliente: 'TV Cliente',
        tv_carteleria_digital: 'Cartelería Digital',
        soporte_brazo: 'Soporte Brazo',
        carcasa_ap: 'Carcasa AP'
    };
    return names[key] || key;
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Saneamiento de una solicitud: asegura tipos y presencia de campos esperados
function sanitizeSolicitud(s) {
    const out = {};
    if (!s || typeof s !== 'object') s = {};
    out.codigo = s.codigo ? String(s.codigo).trim() : '';
    out.cliente = s.cliente ? String(s.cliente).trim() : '';
    out.sucursal = s.sucursal ? String(s.sucursal).trim() : '';
    out.tipo_solicitud = s.tipo_solicitud ? String(s.tipo_solicitud).trim() : 'Instalación';
    out.estado = s.estado ? String(s.estado).trim() : 'Pendiente';
    out.tecnico = s.tecnico ? String(s.tecnico).trim() : '';
    // normalize fecha_instalacion to YYYY-MM-DD or null
    let f = s.fecha_instalacion || null;
    try {
        if (f) {
            const ds = String(f).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) out.fecha_instalacion = ds;
            else {
                const d = new Date(ds);
                if (!isNaN(d.getTime())) out.fecha_instalacion = d.toISOString().split('T')[0];
                else out.fecha_instalacion = null;
            }
        } else out.fecha_instalacion = null;
    } catch (e) { out.fecha_instalacion = null; }

    // normalize fecha_reprogramada to YYYY-MM-DD or null (preserve reprogramacion)
    let fr = s.fecha_reprogramada || s.reprogramacion || null;
    try {
        if (fr) {
            const ds2 = String(fr).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(ds2)) out.fecha_reprogramada = ds2;
            else {
                const d2 = new Date(ds2);
                if (!isNaN(d2.getTime())) out.fecha_reprogramada = d2.toISOString().split('T')[0];
                else out.fecha_reprogramada = null;
            }
        } else out.fecha_reprogramada = null;
    } catch (e) { out.fecha_reprogramada = null; }

    // equipos: ensure object with numeric fields
    const eqKeys = ['totem','tv_32','tv_40','tv_43','tv_50','tv_55','tv_65','tvbox','tv_cliente','tv_carteleria_digital','soporte_brazo','carcasa_ap'];
    out.equipos = {};
    try {
        const srcEq = s.equipos || s;
        eqKeys.forEach(k => {
            let v = srcEq[k];
            if (v === undefined || v === null) v = 0;
            if (typeof v === 'string') v = v.replace(/[^0-9\-]/g, '');
            const n = parseInt(v);
            out.equipos[k] = isNaN(n) ? 0 : n;
        });
    } catch (e) {
        eqKeys.forEach(k => out.equipos[k] = 0);
    }

    // Ensure totem max 1
    try { out.equipos.totem = Math.min(1, Math.max(0, parseInt(out.equipos.totem) || 0)); } catch(e) {}

    // Incluir cualquier equipo adicional que venga en la estructura (dinámicos)
    try {
        const srcEq = (s && s.equipos) ? s.equipos : (s || {});
        Object.keys(srcEq).forEach(k => {
            if (!eqKeys.includes(k)) {
                let v = srcEq[k];
                if (v === undefined || v === null) v = 0;
                if (typeof v === 'string') v = v.replace(/[^0-9\-]/g, '');
                const n = parseInt(v);
                out.equipos[k] = isNaN(n) ? 0 : n;
            }
        });
    } catch (e) {
        // ignore
    }

    // metadata flags
    out._synced = !!s._synced;
    out._imported = !!s._imported;
    // network details raw (string) and parsed (array)
    try {
        out.network_details_raw = s.network_details_raw ? String(s.network_details_raw) : (s.network_details || '');
        out.network_parsed = parseNetworkTable(out.network_details_raw);
    } catch (e) { out.network_details_raw = ''; out.network_parsed = []; }
    // equipos_list and formatted variants
    try {
        if (Array.isArray(s.equipos_list)) out.equipos_list = s.equipos_list.map(it => ({ label: String(it.label || ''), value: String(it.value || '') }));
        else out.equipos_list = [];
        out.equipos_formatted_text = s.equipos_formatted_text || formatEquiposText(out.equipos_list);
        out.equipos_formatted_html = s.equipos_formatted_html || formatEquiposHtml(out.equipos_list);
    } catch (e) { out.equipos_list = []; out.equipos_formatted_text = ''; out.equipos_formatted_html = ''; }
    // keep other non-sensitive fields like observaciones or plataforma if present
    if (s.plataforma) out.plataforma = s.plataforma;
    if (s.observaciones) out.observaciones = s.observaciones;
    return out;
}

// Parsea una tabla CSV/TSV o texto con cabecera y columnas (EQUIPO,IP,GATEWAY,NETMASK,DNS1,DNS2,MAC)
function parseNetworkTable(raw) {
    if (!raw) return [];
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];
    // detect delimiter: comma, tab, semicolon or multiple spaces
    let delim = ',';
    if (lines[0].includes('\t')) delim = '\t';
    else if (lines[0].includes(';')) delim = ';';
    else if (lines[0].includes(',')) delim = ',';
    else if (/\s{2,}/.test(lines[0])) delim = /\s{2,}/; // two or more spaces
    else delim = /\s+/; // fallback: any whitespace

    const headers = lines[0].split(delim).map(h => h.trim().toUpperCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(delim).map(p => p.trim());
        if (parts.length === 0) continue;
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = parts[idx] || ''; });
        rows.push(obj);
    }
    return rows;
}

// Mostrar tabla de red en el modal de detalle (si existe)
function renderNetworkHtml(sol) {
    try {
        const parsed = sol.network_parsed || [];
        if (Array.isArray(parsed) && parsed.length > 0) {
            const headers = Object.keys(parsed[0]);
            const thead = headers.map(h => `<th style="padding:6px 8px; text-align:left; background:#f1f5f9;">${h}</th>`).join('');
            const rows = parsed.map(r => {
                const cols = headers.map(h => `<td style="padding:6px 8px; border-top:1px solid #e6e6e6">${r[h] || ''}</td>`).join('');
                return `<tr>${cols}</tr>`;
            }).join('');
            return `
                <div style="margin-top:12px;">
                        <strong>Adjunto datos de red:</strong>
                        <div style="overflow:auto; margin-top:8px; border:1px solid #e6e6e6; border-radius:6px; max-height:300px;">
                            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                            <thead><tr>${thead}</tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        if (sol.network_details_raw) {
            return `
                <div style="margin-top:12px;">
                    <strong>Adjunto datos de red:</strong>
                    <pre style="white-space:pre-wrap; background:#fafafa; padding:10px; border:1px solid #e6e6e6; border-radius:6px; margin-top:8px;">${escapeHtml(sol.network_details_raw)}</pre>
                </div>
            `;
        }
    } catch (e) { }
    return '';
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Formatear equipos como texto (tabla simple con cabecera)
function formatEquiposText(list) {
    if (!Array.isArray(list) || list.length === 0) return '';
    const lines = [];
    lines.push('EQUIPOS A INSTALAR');
    lines.push('EQUIPO\tCANTIDAD');
    list.forEach(it => {
        lines.push(`${it.label}\t${it.value}`);
    });
    return lines.join('\n');
}

// Formatear equipos como HTML table (similar a ejemplo)
function formatEquiposHtml(list) {
    if (!Array.isArray(list) || list.length === 0) return '';
    const rows = list.map(it => `<tr><td style="padding:6px 8px; border-top:1px solid #e6e6e6; font-weight:600;">${escapeHtml(it.label)}</td><td style="padding:6px 8px; border-top:1px solid #e6e6e6;">${escapeHtml(it.value)}</td></tr>`).join('');
    return `
        <div style="margin-top:8px; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden;">
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead><tr><th style="background:#e2e8f0; padding:8px; text-align:left;">EQUIPO</th><th style="background:#e2e8f0; padding:8px; text-align:left;">CANTIDAD</th></tr></thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// Obtener clase de estado
function getStatusClass(estado) {
    const classes = {
        'Pendiente': 'status-warning',
        'En Proceso': 'status-info',
        'Instalado': 'status-success',
        'Cancelado': 'status-danger'
    };
    return classes[estado] || 'status-secondary';
}

// Abrir modal
function openModal(isEdit) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    
    if (isEdit) {
        title.textContent = 'Editar Solicitud';
    } else {
        title.textContent = 'Nueva Solicitud de Instalación';
        form.reset();
        currentEditIndex = null;
        
        // Generar código automático
        const nextNum = solicitudes.length + 1;
        const year = new Date().getFullYear();
        document.getElementById('productCode').value = `SOL-${year}-${String(nextNum).padStart(3, '0')}`;
        
        // Fecha actual
        document.getElementById('productFecha').value = new Date().toISOString().split('T')[0];
        // Inicializar contenedor dinámico de equipos (vacío)
        initDynamicEquipos();
    }
    
    modal.classList.add('active');
}

// --- Funciones para equipos dinámicos ---
function initDynamicEquipos() {
    const container = document.getElementById('dynamicEquiposContainer');
    if (!container) return;
    container.innerHTML = '';
}

function addEquipoRow(type = '', qty = 0) {
    const container = document.getElementById('dynamicEquiposContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'equipo-row-dinamico';
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.marginBottom = '8px';
    row.innerHTML = `
        <input type="text" class="input-equipo-tipo" placeholder="Campo (ej: CANT. TOTEM / VERSION TOTEM)" style="flex:2; padding:8px; border:1px solid #e2e8f0; border-radius:6px;" value="${type}">
        <input type="text" class="input-equipo-cantidad" placeholder="Cantidad o texto" value="${qty}" style="width:180px; padding:8px; border:1px solid #e2e8f0; border-radius:6px;">
        <button type="button" class="btn-remove-equipo" style="background:#fee2e2; border:1px solid #fecaca; padding:6px 10px; border-radius:6px;">✕</button>
    `;

    row.querySelector('.btn-remove-equipo').addEventListener('click', function() { row.remove(); });
    container.appendChild(row);
}

function gatherDynamicEquipos() {
    const out = [];
    const rows = document.querySelectorAll('.equipo-row-dinamico');
    rows.forEach(r => {
        const tipo = r.querySelector('.input-equipo-tipo')?.value?.trim();
        const valor = r.querySelector('.input-equipo-cantidad')?.value?.trim() || '';
        if (tipo && valor !== '') {
            out.push({ label: tipo, value: valor });
        }
    });
    return out;
}

// Atachar listener del botón '+' si existe (DOMContentLoaded ya corrió, así que hacemos chequeo inmediato)
document.getElementById('btnAddEquipo')?.addEventListener('click', function() { addEquipoRow(); });

// Validación y capping para campo Totem: máximo 1
const totemInput = document.getElementById('equipoTotem');
if (totemInput) {
    totemInput.addEventListener('input', function() {
        let v = parseInt(this.value) || 0;
        if (v < 0) v = 0;
        if (v > 1) v = 1;
        if (String(this.value) !== String(v)) this.value = v;
    });
}

// Botón para parsear archivo CSV de red al textarea
document.getElementById('btnParseNetwork')?.addEventListener('click', function() {
    const input = document.getElementById('networkFileInput');
    if (!input || !input.files || input.files.length === 0) {
        showNotification('Selecciona un archivo CSV o TXT primero', 'info');
        return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        document.getElementById('networkDetails').value = text;
        showNotification('Archivo de red cargado en textarea', 'success');
    };
    reader.onerror = function() { showNotification('No se pudo leer el archivo', 'danger'); };
    reader.readAsText(file);
});


// Cerrar modal
function closeModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
    currentEditIndex = null;
}

// Manejar envío del formulario
function handleProductSubmit(event) {
    event.preventDefault();
    
    const equiposFixed = {
            totem: parseInt(document.getElementById('equipoTotem').value) || 0,
            tv_43: parseInt(document.getElementById('equipoTV43').value) || 0,
            tv_55: parseInt(document.getElementById('equipoTV55').value) || 0,
            tvbox: parseInt(document.getElementById('equipoTVBox').value) || 0,
            soporte_brazo: parseInt(document.getElementById('equipoSoporteBrazo').value) || 0,
            carcasa_ap: parseInt(document.getElementById('equipoCarcasaAP').value) || 0
    };

    // recoger equipos dinámicos (lista de {label,value})
    const equiposDinamicos = gatherDynamicEquipos();

    // construir lista estructurada de equipos (para mostrar en formato solicitado)
    const equipos_list = [];
    // agregar campos fijos con etiquetas solicitadas si tienen valor > 0
    if (equiposFixed.totem && equiposFixed.totem > 0) equipos_list.push({ label: 'CANT. TOTEM', value: String(equiposFixed.totem) });
    if (equiposFixed.tv_43 && equiposFixed.tv_43 > 0) equipos_list.push({ label: 'TV 43"', value: String(equiposFixed.tv_43) });
    if (equiposFixed.tv_55 && equiposFixed.tv_55 > 0) equipos_list.push({ label: 'TV 55"', value: String(equiposFixed.tv_55) });
    if (equiposFixed.tvbox && equiposFixed.tvbox > 0) equipos_list.push({ label: 'TV BOX', value: String(equiposFixed.tvbox) });
    if (equiposFixed.soporte_brazo && equiposFixed.soporte_brazo > 0) equipos_list.push({ label: 'SOPORTE TV BRAZO', value: String(equiposFixed.soporte_brazo) });
    if (equiposFixed.carcasa_ap && equiposFixed.carcasa_ap > 0) equipos_list.push({ label: 'CANT. CARCASA AP', value: String(equiposFixed.carcasa_ap) });

    // agregar dinámicos después
    equiposDinamicos.forEach(item => {
        equipos_list.push({ label: item.label, value: item.value });
    });

    // construir un mapa para compatibilidad hacia atrás (keys slug -> numeric when possible)
    const equiposCombinados = Object.assign({}, equiposFixed);
    equiposDinamicos.forEach(it => {
        const key = it.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const n = parseInt(it.value);
        if (!isNaN(n)) equiposCombinados[key] = (equiposCombinados[key] || 0) + n;
        else equiposCombinados[key] = it.value;
    });

    const solicitud = {
        codigo: document.getElementById('productCode').value,
        cliente: document.getElementById('productCliente').value,
        sucursal: document.getElementById('productSucursal').value,
        tipo_solicitud: document.getElementById('productTipo').value,
        estado: document.getElementById('productEstado').value,
        tecnico: document.getElementById('productTecnico').value,
        fecha_instalacion: document.getElementById('productFecha').value,
        fecha_reprogramada: document.getElementById('productReprogramDate') ? document.getElementById('productReprogramDate').value : '',
        equipos: equiposCombinados,
        equipos_list: equipos_list,
        equipos_formatted_text: formatEquiposText(equipos_list),
        equipos_formatted_html: formatEquiposHtml(equipos_list),
        network_details_raw: document.getElementById('networkDetails')?.value || ''
    };
    
    if (currentEditIndex !== null) {
        // Editar existente - preservar meta (_remote_id, _synced)
        const prev = solicitudes[currentEditIndex] || {};
        solicitud._remote_id = prev._remote_id || prev._remote_id || null;
        solicitud._synced = prev._synced || false;
        solicitudes[currentEditIndex] = solicitud;
        showNotification('Solicitud actualizada exitosamente', 'success');

        // Si estamos configurados para sincronizar y ya existe en backend, enviar update técnica
        if (typeof SYNC_TO_BACKEND !== 'undefined' && SYNC_TO_BACKEND && solicitud._remote_id) {
            (async function(){
                try {
                    const needsNoInst = (String(solicitud.estado || '').toLowerCase().includes('no instal')) || !!solicitud.no_instalada;
                    const fr = solicitud.fecha_reprogramada || null;
                    if (needsNoInst || fr) {
                        const tecPayload = { tecnica: {} };
                        if (needsNoInst) tecPayload.tecnica.no_instalada = true;
                        if (fr) tecPayload.tecnica.fecha_reprogramada = fr;
                        if (solicitud.motivo_no_instalacion) tecPayload.tecnica.motivo_no_instalacion = solicitud.motivo_no_instalacion;
                        const upd = await updateSolicitudApi(solicitud._remote_id, tecPayload);
                        if (upd && upd.success) showNotification('Reprogramación enviada al servidor', 'success');
                        else showNotification('No se pudo enviar reprogramación al servidor', 'danger');
                    }
                } catch (e) { console.error('auto-update after edit failed', e); }
            })();
        }
    } else {
        // Agregar nueva
        solicitudes.push(solicitud);
        showNotification('Solicitud creada exitosamente', 'success');

        // Si está activada la sincronización, intentar sincronizar nuevos registros
        if (typeof SYNC_TO_BACKEND !== 'undefined' && SYNC_TO_BACKEND) {
            try { syncUnsynced(); } catch(e){ console.warn('syncUnsynced failed', e); }
        }
    }
    
    saveSolicitudesToStorage();
    renderSolicitudes();
    updateStats();
    closeModal();
}

// Ver detalle de solicitud
function viewSolicitud(index) {
    const sol = solicitudes[index];
    let equiposHtml = '';
    try {
        if (Array.isArray(sol.equipos_list) && sol.equipos_list.length > 0) {
            equiposHtml = sol.equipos_list.map(it => `<li>${escapeHtml(it.label)}: <strong>${escapeHtml(it.value)}</strong></li>`).join('');
        } else {
            equiposHtml = Object.entries(sol.equipos || {})
                .filter(([key, val]) => (typeof val === 'number' ? val > 0 : String(val).trim() !== ''))
                .map(([key, val]) => `<li>${formatEquipoName(key)}: <strong>${escapeHtml(String(val))}</strong></li>`)
                .join('');
        }
    } catch (e) { equiposHtml = ''; }
    
    const modalHtml = `
        <div class="modal-overlay active" id="viewModal" onclick="closeViewModal()">
            <div class="modal-container" onclick="event.stopPropagation()" style="max-width: 900px; max-height:80vh; overflow:auto; width:90%;">
                <div class="modal-header">
                    <h3>Detalle de Solicitud</h3>
                    <button class="modal-close" onclick="closeViewModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; gap: 15px;">
                        <div>
                            <strong>Código:</strong> ${sol.codigo}
                        </div>
                        <div>
                            <strong>Cliente:</strong> ${sol.cliente}
                        </div>
                        <div>
                            <strong>Sucursal:</strong> ${sol.sucursal}
                        </div>
                        <div>
                            <strong>Tipo:</strong> ${sol.tipo_solicitud}
                        </div>
                        <div>
                            <strong>Estado:</strong> 
                            <span class="status-badge ${getStatusClass(sol.estado)}">${sol.estado}</span>
                        </div>
                        <div>
                            <strong>Técnico:</strong> ${sol.tecnico}
                        </div>
                        <div>
                            <strong>Fecha Instalación:</strong> ${formatDate(sol.fecha_instalacion)}
                            ${sol.fecha_reprogramada ? `<div style="margin-top:6px;color:#64748b;">Fecha Reprogramación: <strong>${formatDate(sol.fecha_reprogramada)}</strong></div>` : ''}
                        </div>
                        <div>
                            <strong>Equipos Instalados:</strong>
                            <div style="margin-top:8px;">
                                ${sol.equipos_formatted_html ? sol.equipos_formatted_html : `<ul style="margin: 10px 0 0 20px;">${equiposHtml}</ul>`}
                            </div>
                        </div>
                        ${renderNetworkHtml(sol)}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeViewModal()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) modal.remove();
}

// Editar solicitud
function editSolicitud(index) {
    currentEditIndex = index;
    const sol = solicitudes[index];
    
    document.getElementById('productCode').value = sol.codigo;
    document.getElementById('productCliente').value = sol.cliente;
    document.getElementById('productSucursal').value = sol.sucursal;
    document.getElementById('productTipo').value = sol.tipo_solicitud;
    document.getElementById('productEstado').value = sol.estado;
    document.getElementById('productTecnico').value = sol.tecnico;
    document.getElementById('productFecha').value = sol.fecha_instalacion;
    
    // Cargar fecha reprogramada con validación de formato
    if (document.getElementById('productReprogramDate')) {
        let frValue = sol.fecha_reprogramada || '';
        if (frValue) {
            // Asegurar que está en formato YYYY-MM-DD
            const dateStr = String(frValue).trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                // Intentar convertir a YYYY-MM-DD
                try {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) {
                        frValue = d.toISOString().split('T')[0];
                    } else {
                        frValue = '';
                    }
                } catch (e) {
                    frValue = '';
                }
            } else {
                frValue = dateStr;
            }
        }
        document.getElementById('productReprogramDate').value = frValue;
    }
    
    document.getElementById('equipoTotem').value = sol.equipos.totem;
    document.getElementById('equipoTV43').value = sol.equipos.tv_43;
    document.getElementById('equipoTV55').value = sol.equipos.tv_55 || 0;
    document.getElementById('equipoTVBox').value = sol.equipos.tvbox;
    document.getElementById('equipoSoporteBrazo').value = sol.equipos.soporte_brazo;
    document.getElementById('equipoCarcasaAP').value = sol.equipos.carcasa_ap;
    
    // Poblamos los equipos dinámicos que no están en los campos fijos
    try {
        initDynamicEquipos();
        const fixedKeys = ['totem','tv_43','tv_55','tvbox','soporte_brazo','carcasa_ap'];
        // primero, si existe equipos_list usarlo para rellenar filas (preserva texto)
        if (Array.isArray(sol.equipos_list) && sol.equipos_list.length > 0) {
            sol.equipos_list.forEach(it => {
                // si corresponde a un campo fijo, mapear al input fijo
                const lab = (it.label || '').toUpperCase();
                if (lab.includes('TOTEM') && lab.includes('CANT')) {
                    document.getElementById('equipoTotem').value = parseInt(it.value) || 0;
                } else if (lab.includes('TV 43')) {
                    document.getElementById('equipoTV43').value = parseInt(it.value) || 0;
                } else if (lab.includes('TV 55')) {
                    document.getElementById('equipoTV55').value = parseInt(it.value) || 0;
                } else if (lab.includes('TV BOX') || lab.includes('TVBOX')) {
                    document.getElementById('equipoTVBox').value = parseInt(it.value) || 0;
                } else if (lab.includes('SOPORTE') && lab.includes('BRAZO')) {
                    document.getElementById('equipoSoporteBrazo').value = parseInt(it.value) || 0;
                } else if (lab.includes('CARCASA') && lab.includes('AP') && lab.includes('CANT')) {
                    document.getElementById('equipoCarcasaAP').value = parseInt(it.value) || 0;
                } else {
                    addEquipoRow(it.label, it.value);
                }
            });
        } else {
            Object.entries(sol.equipos || {}).forEach(([k, v]) => {
                if (!fixedKeys.includes(k) && v && Number(v) > 0) {
                    let display = formatEquipoName(k);
                    if (display === k) display = String(k).replace(/_/g, ' ');
                    addEquipoRow(display, v);
                }
            });
        }
    } catch (e) { /* ignore */ }

    // poner network details en textarea
    try { document.getElementById('networkDetails').value = sol.network_details_raw || ''; } catch(e) {}

    openModal(true);
}

// Eliminar solicitud
function deleteSolicitud(index) {
    const sol = solicitudes[index];
    if (confirm(`¿Estás seguro de eliminar la solicitud ${sol.codigo}?`)) {
        solicitudes.splice(index, 1);
        saveSolicitudesToStorage();
        renderSolicitudes();
        updateStats();
        showNotification('Solicitud eliminada', 'info');
    }
}

// Borrar todo el listado de solicitudes (vacía `solicitudes` y localStorage)
function clearAllSolicitudes() {
    if (!confirm('¿Borrar TODO el listado de solicitudes? Esta acción eliminará todos los datos locales de solicitudes.')) return;
    solicitudes = [];
    try { saveSolicitudesToStorage(); } catch(e) { console.warn('saveSolicitudesToStorage failed', e); }
    try { renderSolicitudes(); updateStats(); } catch(e) { console.warn('render/update failed', e); }
    // limpiar buffers temporales
    try { importedData = []; window.mappedImportedData = []; window.rawImportedData = []; } catch(e) {}
    showNotification('Se eliminaron todas las solicitudes localmente', 'success');
}

// Eliminar todos los registros importados en la sesión (marcados con _imported)
function deleteImportedData() {
    const toRemove = solicitudes.filter(s => s && (s._imported === true || (s.codigo && String(s.codigo).startsWith('IMP-'))));
    if (!toRemove || toRemove.length === 0) {
        showNotification('No se encontraron datos importados para eliminar', 'info');
        return;
    }
    if (!confirm(`Eliminar ${toRemove.length} registros importados? Esta acción no se puede deshacer.`)) return;

    solicitudes = solicitudes.filter(s => !(s && (s._imported === true || (s.codigo && String(s.codigo).startsWith('IMP-')))) );
    try { saveSolicitudesToStorage(); } catch(e) { console.warn('saveSolicitudesToStorage failed', e); }
    try { renderSolicitudes(); updateStats(); } catch(e) {}
    // limpiar buffers de import temporales
    try { importedData = []; window.mappedImportedData = []; window.rawImportedData = []; } catch(e) {}
    showNotification(`${toRemove.length} registros importados eliminados`, 'success');
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Buscar solicitudes
document.getElementById('searchProducts')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Filtros de estado
document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const filter = this.dataset.filter;
        const rows = document.querySelectorAll('#productsTableBody tr');
        
        rows.forEach(row => {
            if (filter === 'all') {
                row.style.display = '';
            } else {
                const estado = row.querySelector('.status-badge')?.textContent.trim();
                const match = 
                    (filter === 'disponible' && estado === 'Instalado') ||
                    (filter === 'bajo' && estado === 'En Proceso') ||
                    (filter === 'agotado' && estado === 'Pendiente');
                row.style.display = match ? '' : 'none';
            }
        });
    });
});

// Estilos adicionales
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 5px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .status-success {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-warning {
        background: #fef3c7;
        color: #92400e;
    }
    
    .status-info {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .status-danger {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .status-secondary {
        background: #f1f5f9;
        color: #475569;
    }
    
    .badge-info {
        background: #e0e7ff;
        color: #3730a3;
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .action-buttons {
        display: flex;
        gap: 5px;
        justify-content: center;
    }
    
    .btn-icon {
        background: none;
        border: 1px solid #e2e8f0;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .btn-icon:hover {
        background: #f1f5f9;
        transform: scale(1.05);
    }
    
    .btn-danger:hover {
        background: #fee2e2;
        border-color: #fecaca;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .btn-add-client {
        padding: 8px 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
    }
    
    .btn-add-client:hover {
        background: #5a67d8;
        transform: scale(1.05);
    }
`;
document.head.appendChild(style);

// Estilos adicionales para fechas y reprogramación
try {
    const style2 = document.createElement('style');
    style2.textContent = `
        .date-cell { display:flex; flex-direction:column; }
        .date-main { font-weight:700; color:#0f172a; font-size:14px; }
        .date-reprog { margin-top:6px; display:flex; gap:8px; align-items:center; font-size:14px; color:#dc2626; }
        .reprog-badge { background:#eef2ff; color:#1e40af; padding:2px 8px; border-radius:10px; font-weight:700; font-size:11px; text-transform:uppercase; }
        .reprog-date { font-weight:700; color:#dc2626; font-size:14px; }
        /* ajuste responsivo para celdas de tabla */
        .products-table td .date-cell { min-width:120px; }
        .reprog-row td { background: #fbfdff; }
        .reprog-row .date-reprog { display:flex; gap:8px; align-items:center; }
        .reprog-row td { padding-top:6px; padding-bottom:6px; }
    `;
    document.head.appendChild(style2);
} catch (e) { console.warn('Could not append date styles', e); }

// =============================================
// GESTIÓN DE CLIENTES PERSONALIZADOS
// =============================================

// Manejar cambio en select de cliente
function handleClienteChange() {
    const select = document.getElementById('productCliente');
    if (select && select.value === '__nuevo__') {
        openAddClientModal();
    }
}

// Abrir modal de agregar cliente
function openAddClientModal() {
    const select = document.getElementById('productCliente');
    if (select && select.value === '__nuevo__') {
        select.value = ''; // Reset selection
    }
    
    const modal = document.getElementById('addClientModal');
    const form = document.getElementById('addClientForm');
    if (modal && form) {
        form.reset();
        document.getElementById('newClientCountry').value = 'Chile';
        modal.classList.add('active');
        
        // Focus en el campo de nombre
        setTimeout(() => {
            document.getElementById('newClientName')?.focus();
        }, 100);
    }
}

// Cerrar modal de agregar cliente
function closeAddClientModal() {
    const modal = document.getElementById('addClientModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Manejar envío del formulario de nuevo cliente
function handleAddClient(event) {
    event.preventDefault();
    
    const clientName = document.getElementById('newClientName').value.trim();
    
    if (!clientName) {
        showNotification('Por favor ingrese un nombre de cliente', 'danger');
        return;
    }
    
    // Verificar si el cliente ya existe (case insensitive)
    const baseClientes = ['Walmart Chile', 'Cencosud', 'SMU', 'Falabella'];
    const allClientes = [...baseClientes, ...customClientes];
    
    if (allClientes.some(c => c.toLowerCase() === clientName.toLowerCase())) {
        showNotification('Este cliente ya existe', 'danger');
        return;
    }
    
    // Agregar nuevo cliente
    customClientes.push(clientName);
    saveCustomClientes();
    updateClienteSelect();
    
    // Seleccionar el nuevo cliente en el select
    const select = document.getElementById('productCliente');
    if (select) {
        select.value = clientName;
    }
    
    closeAddClientModal();
    showNotification(`Cliente "${clientName}" agregado exitosamente`, 'success');
}

// Cerrar modales al hacer click fuera
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        if (e.target.id === 'addClientModal') {
            closeAddClientModal();
        }
        if (e.target.id === 'addTipoModal') {
            closeAddTipoModal();
        }
    }
});

// =============================================
// GESTIÓN DE TIPOS DE SOLICITUD PERSONALIZADOS
// =============================================

// Manejar cambio en select de tipo
function handleTipoChange() {
    const select = document.getElementById('productTipo');
    if (select && select.value === '__nuevo__') {
        openAddTipoModal();
    }
}

// Abrir modal de agregar tipo
function openAddTipoModal() {
    const select = document.getElementById('productTipo');
    if (select && select.value === '__nuevo__') {
        select.value = ''; // Reset selection
    }
    
    const modal = document.getElementById('addTipoModal');
    const form = document.getElementById('addTipoForm');
    if (modal && form) {
        form.reset();
        modal.classList.add('active');
        
        // Focus en el campo de nombre
        setTimeout(() => {
            document.getElementById('newTipoName')?.focus();
        }, 100);
    }
}

// Cerrar modal de agregar tipo
function closeAddTipoModal() {
    const modal = document.getElementById('addTipoModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Manejar envío del formulario de nuevo tipo
function handleAddTipo(event) {
    event.preventDefault();
    
    const tipoName = document.getElementById('newTipoName').value.trim();
    
    if (!tipoName) {
        showNotification('Por favor ingrese un nombre de tipo', 'danger');
        return;
    }
    
    // Verificar si el tipo ya existe (case insensitive)
    const baseTipos = ['Instalación', 'Retiro', 'Mantenimiento'];
    const allTipos = [...baseTipos, ...customTipos];
    
    if (allTipos.some(t => t.toLowerCase() === tipoName.toLowerCase())) {
        showNotification('Este tipo de solicitud ya existe', 'danger');
        return;
    }
    
    // Agregar nuevo tipo
    customTipos.push(tipoName);
    saveCustomTipos();
    updateTipoSelect();
    
    // Seleccionar el nuevo tipo en el select
    const select = document.getElementById('productTipo');
    if (select) {
        select.value = tipoName;
    }
    
    closeAddTipoModal();
    showNotification(`Tipo "${tipoName}" agregado exitosamente`, 'success');
}

// =============================================
// IMPORTACIÓN DESDE EXCEL/CSV
// =============================================

let importedData = null;
let rawImportedData = null;

// Abrir modal de importación
function openImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        // Limpiar estado
        importedData = null;
        const fileInputEl = document.getElementById('fileInput');
        if (fileInputEl) {
            try { fileInputEl.value = ''; } catch(e) {}
            try {
                fileInputEl.removeEventListener('change', handleFileSelect);
            } catch(e) {}
            // Prefer the clean importer if available
            try {
                fileInputEl.addEventListener('change', function(ev){
                    const files = ev.target.files || ev.dataTransfer && ev.dataTransfer.files;
                    if (!files || !files.length) return;
                    const f = files[0];
                    if (window.InventarioImporter && typeof window.InventarioImporter.processFile === 'function') {
                        window.InventarioImporter.processFile(f, function(err, res){
                            if (err) { console.warn('InventarioImporter.processFile failed', err); showNotification('Error al parsear archivo: '+(err&&err.message||err),'danger'); return; }
                            const finalized = (res && res.finalized) || [];
                            // store for later import
                            try { window.mappedImportedData = finalized; window.importedData = finalized; importedData = finalized; } catch(e){}
                            const valid = (finalized||[]).filter(r=> r.codigo && r.cliente && r.sucursal);
                            const invalidCount = (finalized||[]).length - valid.length;
                            const rawSample = (finalized||[]).filter(r=> !(r.codigo && r.cliente && r.sucursal)).slice(0,5);
                            showPreview(valid, invalidCount, rawSample);
                            const btn = document.getElementById('btnProcessImport'); if (btn) { btn.style.display = finalized.length>0 ? 'block' : 'none'; btn.disabled = finalized.length === 0; }
                        });
                    } else {
                        // fallback to old handler
                        try { handleFileSelect({ target: { files: files } }); } catch(e) { console.warn('fallback handleFileSelect failed', e); }
                    }
                });
            } catch(e){ console.warn('fileInput init failed', e); }
        }
        document.getElementById('import-preview').style.display = 'none';
        document.getElementById('import-result').style.display = 'none';
        document.getElementById('btnProcessImport').style.display = 'none';
        
        // Asegurar input oculto para carga de CSV de mapeo
        try {
            let codeInput = document.getElementById('codeMapFileInput');
            if (!codeInput) {
                codeInput = document.createElement('input');
                codeInput.type = 'file';
                codeInput.accept = '.csv,text/csv';
                codeInput.id = 'codeMapFileInput';
                codeInput.style.display = 'none';
                codeInput.addEventListener('change', function(ev){
                    const f = ev.target.files && ev.target.files[0];
                    if (!f) return;
                    loadCodeMapFromFile(f, function(err, map){
                        if (err) {
                            showNotification('Error cargando mapa de códigos: ' + (err && err.message ? err.message : err), 'danger');
                        } else {
                            showNotification('Mapa de códigos cargado', 'success');
                            try { applyCodeMapToAll(); } catch(e) { console.warn('applyCodeMapToAll failed', e); }
                        }
                    });
                });
                document.body.appendChild(codeInput);
            }
            // Añadir badge de estado y botón Exportar errores en el modal si no existen
            try {
                let statusWrap = document.getElementById('codeMapStatus');
                if (!statusWrap) {
                    statusWrap = document.createElement('div');
                    statusWrap.id = 'codeMapStatus';
                    statusWrap.style.display = 'flex';
                    statusWrap.style.gap = '10px';
                    statusWrap.style.alignItems = 'center';
                    statusWrap.style.marginBottom = '8px';
                    // insert at top of modal body
                    const modalBody = document.querySelector('#importModal .modal-body') || document.getElementById('importModal');
                    if (modalBody) modalBody.insertBefore(statusWrap, modalBody.firstChild);
                }
                // badge
                let badge = document.getElementById('codeMapBadge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.id = 'codeMapBadge';
                    badge.style.background = '#eef2ff';
                    badge.style.color = '#3730a3';
                    badge.style.padding = '6px 10px';
                    badge.style.borderRadius = '12px';
                    badge.style.fontWeight = '700';
                    badge.textContent = 'Mapa: 0 entradas';
                    statusWrap.appendChild(badge);
                }
                // export errors button
                let expBtn = document.getElementById('btnExportImportErrors');
                if (!expBtn) {
                    expBtn = document.createElement('button');
                    expBtn.id = 'btnExportImportErrors';
                    expBtn.type = 'button';
                    expBtn.className = 'btn-secondary';
                    expBtn.textContent = 'Exportar errores';
                    expBtn.style.marginLeft = '6px';
                    expBtn.addEventListener('click', function(){
                        const invalid = getInvalidRows();
                        if (!invalid || invalid.length === 0) { showNotification('No se encontraron filas inválidas para exportar', 'info'); return; }
                        downloadCSV(invalid.map(r => ({ codigo: r.codigo||'', cliente: r.cliente||'', sucursal: r.sucursal||'', motivo: r._invalid_reason||'' })), 'import_errors.csv');
                    });
                    statusWrap.appendChild(expBtn);
                }
                // boton Importar (local) para guardar inmediatamente en localStorage
                let importLocalBtn = document.getElementById('btnImportLocal');
                if (!importLocalBtn) {
                    importLocalBtn = document.createElement('button');
                    importLocalBtn.id = 'btnImportLocal';
                    importLocalBtn.type = 'button';
                    importLocalBtn.className = 'btn-primary';
                    importLocalBtn.textContent = 'Importar (local)';
                    importLocalBtn.style.marginLeft = '6px';
                    importLocalBtn.addEventListener('click', function(){
                        try {
                            // prefer mappedImportedData finalizadas
                            const rows = window.mappedImportedData || importedData || window.rawImportedData || [];
                            if (!rows || rows.length === 0) { showNotification('No hay datos para importar', 'info'); return; }
                            // if InventarioImporter available, use its saver which appends to storage
                            if (window.InventarioImporter && typeof window.InventarioImporter.saveRowsToLocalStorage === 'function') {
                                const toSave = (rows||[]).map(r=> {
                                    try { return window.InventarioImporter.finalizeImportedRow ? window.InventarioImporter.finalizeImportedRow(r) : r; } catch(e){ return r; }
                                });
                                const ok = window.InventarioImporter.saveRowsToLocalStorage(toSave);
                                if (ok) {
                                    // refresh in-memory and UI
                                    loadSolicitudesFromStorage(); renderSolicitudes(); updateStats();
                                    showNotification('Importación local completada: ' + toSave.length + ' registros', 'success');
                                } else {
                                    showNotification('No se pudo guardar localmente', 'danger');
                                }
                            } else {
                                // fallback: push into solicitudes and save
                                const toSave = (rows||[]).map(r=> { try { return finalizeImportedRow(r); } catch(e){ return r; } });
                                solicitudes = solicitudes.concat(toSave);
                                saveSolicitudesToStorage(); renderSolicitudes(); updateStats();
                                showNotification('Importación local completada: ' + toSave.length + ' registros', 'success');
                            }
                        } catch(e) { console.error('Importar(local) failed', e); showNotification('Error al importar localmente', 'danger'); }
                    });
                    statusWrap.appendChild(importLocalBtn);
                }
                // boton para usar importadas como listado principal (reemplaza solicitudes)
                let useAsListBtn = document.getElementById('btnUseAsListing');
                if (!useAsListBtn) {
                    useAsListBtn = document.createElement('button');
                    useAsListBtn.id = 'btnUseAsListing';
                    useAsListBtn.type = 'button';
                    useAsListBtn.className = 'btn-secondary';
                    useAsListBtn.textContent = 'Usar como listado';
                    useAsListBtn.style.marginLeft = '6px';
                    useAsListBtn.addEventListener('click', function(){
                        try {
                            const rows = window.mappedImportedData || importedData || window.rawImportedData || [];
                            if (!rows || rows.length === 0) { showNotification('No hay datos importados para usar como listado', 'info'); return; }
                            const finalized = rows.map(r => { try { return (window.InventarioImporter && window.InventarioImporter.finalizeImportedRow) ? window.InventarioImporter.finalizeImportedRow(r) : finalizeImportedRow(r); } catch(e){ return finalizeImportedRow(r); } });
                            // deduplicate by codigo: keep last occurrence
                            const byCode = {};
                            for (let i=0;i<finalized.length;i++){ const it = finalized[i]; if (!it || !it.codigo) continue; byCode[String(it.codigo).trim()] = it; }
                            const newList = Object.keys(byCode).map(k => byCode[k]);
                            // replace solicitudes
                            solicitudes = newList.map(sanitizeSolicitud);
                            saveSolicitudesToStorage(); renderSolicitudes(); updateStats();
                            showNotification('Listado reemplazado con ' + solicitudes.length + ' registros importados', 'success');
                        } catch(e) { console.error('UseAsListing failed', e); showNotification('Error al aplicar como listado', 'danger'); }
                    });
                    statusWrap.appendChild(useAsListBtn);
                }
                // actualizar badge con conteo actual
                try {
                    const persistent = JSON.parse(localStorage.getItem('factora_code_map')||'{}');
                    const count = persistent ? Object.keys(persistent).length : (window.__CODE_MAP__ ? Object.keys(window.__CODE_MAP__).length : 0);
                    badge.textContent = `Mapa: ${count} entradas`;
                } catch(e) { badge.textContent = 'Mapa: 0 entradas'; }
            } catch(e) { console.warn('openImportModal: codeMap status UI failed', e); }
            // Si ya existe mapa persistente, cargarlo y aplicarlo automáticamente
            let persistent = null;
            try { persistent = JSON.parse(localStorage.getItem('factora_code_map')||'{}'); } catch(e) { persistent = window.__CODE_MAP__ || null; }
            if (persistent && Object.keys(persistent).length > 0) {
                try { window.__CODE_MAP__ = Object.assign({}, window.__CODE_MAP__ || {}, persistent); } catch(e){}
                try { applyCodeMapToAll(); showNotification('Mapa de códigos aplicado automáticamente', 'success'); } catch(e){ console.warn('applyCodeMapToAll failed', e); }
            } else {
                // si no hay mapa, solicitar archivo al usuario
                try {
                    // abrir diálogo de archivo para que el usuario cargue el CSV
                    codeInput.value = null;
                    codeInput.click();
                } catch(e) { console.warn('Could not auto-open file dialog for code map', e); }
            }
        } catch(e) { console.warn('openImportModal: code map init failed', e); }

        modal.classList.add('active');
    }
}

// Cerrar modal de importación
function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Manejar drag over
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.borderColor = '#667eea';
    event.currentTarget.style.background = '#f8fafc';
}

// Manejar drop de archivo
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.style.borderColor = '#cbd5e1';
    event.currentTarget.style.background = 'transparent';
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Manejar selección de archivo
function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Procesar archivo
function processFile(file) {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    // Validar extensión
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        showNotification('Formato de archivo no soportado. Use .csv, .xlsx o .xls', 'danger');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        console.log('processFile: reader.onload triggered for', fileName);
        try {
            let data;
            
            if (fileExtension === 'csv') {
                // intentar parse a objetos; si headers malos, usar arrays y inferir columnas
                data = parseCSV(e.target.result);
                // si la mayoría de filas no tiene cliente/sucursal/codigo intentar fallback
                const temp = data.map(d => normalizeRow(d));
                const validCount = temp.filter(r => r.codigo && r.cliente && r.sucursal).length;
                if (validCount === 0) {
                    console.log('processFile: parseCSV produced 0 valid rows, attempting array-based inference');
                    const arrays = parseCSVToArrays(e.target.result);
                    window.rawArrays = arrays;
                    const objs = arraysToObjects(arrays);
                    const mapRes = inferColumnMapping(arrays);
                    const mapping = mapRes.mapping;
                    const headerUsed = !!mapRes.headerUsed;
                    // construir objetos a partir del mapping
                    const rowsToUse = headerUsed ? arrays.slice(1) : arrays;
                    const built = rowsToUse.map(row => {
                        const obj = {};
                        Object.keys(mapping).forEach(idx => {
                            const field = mapping[idx];
                            const val = row[idx] !== undefined ? row[idx] : '';
                            if (field === 'codigo') obj['codigo'] = val;
                            else if (field === 'sucursal') obj['sucursal'] = val;
                            else if (field === 'cliente') obj['cliente'] = val;
                            else if (field === 'numeric') {
                                // try to attach to totem if not already
                                obj['totem'] = (obj['totem'] || 0) + (parseInt(val) || 0);
                            }
                        });
                        return obj;
                    });
                    data = built;
                }
            } else {
                data = parseExcel(e.target.result);
                // si excel produce 0 válidos intentar sheet_to_json con header:1 y aplicar inferencia
                const tmp = data.map(d => normalizeRow(d));
                const validCountEx = tmp.filter(r => r.codigo && r.cliente && r.sucursal).length;
                if (validCountEx === 0) {
                    console.log('processFile: parseExcel produced 0 valid rows, attempting array-based inference');
                    const workbook = XLSX.read(e.target.result, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const arrays = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
                    window.rawArrays = arrays;
                    const mapRes = inferColumnMapping(arrays);
                    const mapping = mapRes.mapping;
                    const headerUsed = !!mapRes.headerUsed;
                    const rowsToUse = headerUsed ? arrays.slice(1) : arrays;
                    const built = rowsToUse.map(row => {
                        const obj = {};
                        Object.keys(mapping).forEach(idx => {
                            const field = mapping[idx];
                            const val = row[idx] !== undefined ? row[idx] : '';
                            if (field === 'codigo') obj['codigo'] = val;
                            else if (field === 'sucursal') obj['sucursal'] = val;
                            else if (field === 'cliente') obj['cliente'] = val;
                            else if (field === 'numeric') {
                                obj['totem'] = (obj['totem'] || 0) + (parseInt(val) || 0);
                            }
                        });
                        return obj;
                    });
                    data = built;
                }
            }
            console.log('processFile: parsed rows count =', Array.isArray(data) ? data.length : 'N/A');
            
            if (data && data.length > 0) {
                // Normalizar encabezados y valores, y conservar sólo campos permitidos
                const rawNormalizedData = data.map(d => normalizeRow(d));
                const rawAliased = rawNormalizedData.map(r => applyHeaderAlias(r));
                rawImportedData = rawAliased.map((r) => pickRowFields(r));
                // Exponer para debugging y para el mapeador UI
                window.rawNormalizedData = rawNormalizedData;
                window.rawAliased = rawAliased;
                window.rawImportedData = rawImportedData;
                const detectedHeaders = Object.keys(rawAliased[0] || {});
                // intentar aplicar mapeo automático; luego mostrar UI para ajustes manuales
                try { autoApplyBestMapping(); } catch (e) { console.warn('autoApplyBestMapping error', e); }
                // Guardar encabezados detectados para que el usuario abra el mapeador manualmente
                window.detectedHeaders = detectedHeaders || [];
                console.log('processFile: detectedHeaders set, count=', window.detectedHeaders.length);
                console.log('processFile: rawImportedData sample', rawImportedData.slice(0,3));

                // Limpiar valores comunes y normalizar texto (pero no eliminar filas):
                const cleanedAll = rawImportedData.map(r => {
                    const nr = {};
                    Object.keys(r).forEach(k => {
                        let v = r[k];
                        if (v === null || v === undefined) v = '';
                        if (typeof v === 'string') {
                            v = v.trim().replace(/\uFEFF/g, '');
                            try { v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch(e) {}
                            if (/^#?N\/?A$/i.test(v) || /^#?VALUE!?$/i.test(v) || /^n\.?a\.?$/i.test(v) || v === '-' || v === '--') v = '';
                        }
                        nr[k] = v;
                    });
                    return nr;
                });

                // Calcular filas válidas para el resumen pero permitir importar todas las filas limpiadas
                const validRows = cleanedAll.filter(r => r.codigo && r.cliente && r.sucursal);
                const invalidCount = cleanedAll.length - validRows.length;

                // Mantener importedData con TODAS las filas limpiadas (el import no bloqueará por faltantes)
                importedData = cleanedAll;
                window.rawImportedData = cleanedAll;

                // Aplicar mapeo automático y reparación automáticamente (sin mostrar mapeador)
                try {
                    // intentar aplicar auto-mapeo heurístico
                    const autoOk = autoApplyBestMapping();
                    // prefer mappedImportedData si autoOk, sino usar importedData
                    let rowsToRepair = (window.mappedImportedData && window.mappedImportedData.length>0) ? window.mappedImportedData : importedData;
                    if (typeof repairImportedRows === 'function') {
                        try { rowsToRepair = repairImportedRows(rowsToRepair); } catch(e) { console.warn('Automatic repairImportedRows failed', e); }
                    }
                    // persistir resultados para el proceso de import
                    window.mappedImportedData = rowsToRepair;
                    window.importedData = rowsToRepair;
                    importedData = rowsToRepair;
                    window.rawImportedData = rowsToRepair;
                    console.log('processFile: auto-applied mapping and repair, rows=', rowsToRepair.length);
                } catch(e) { console.warn('processFile: automatic mapping/repair failed', e); }

                // Si no hay filas válidas intentar reconstruir desde rawNormalizedData
                if (importedData.length === 0 && rawNormalizedData && rawNormalizedData.length > 0) {
                    console.log('processFile: no valid rows, attempting recovery from raw normalized rows');
                    const recovered = attemptRecoverFromRawNormalized(rawNormalizedData);
                    console.log('processFile: recovered rows count', recovered.length, 'sample', recovered.slice(0,3));
                    const recoveredFiltered = recovered; // keep recovered even if missing fields
                    if (recoveredFiltered.length > 0) {
                        importedData = recoveredFiltered;
                        window.rawImportedData = recoveredFiltered;
                    }
                }

                // Mostrar vista previa de las filas válidas y un resumen de inválidos
                showPreview(validRows, invalidCount, (window.rawImportedData || []).slice(0,5));

                // Mostrar siempre botón de importar si hay filas limpiadas
                const btn = document.getElementById('btnProcessImport');
                if (btn) btn.style.display = importedData.length > 0 ? 'block' : 'none';

                showNotification(`Archivo cargado: ${importedData.length} registros encontrados (${validRows.length} válidos, ${invalidCount} inválidos)`, importedData.length > 0 ? 'success' : 'danger');

                // No abrir mapeador manual: todo el mapeo y reparación se aplica automáticamente.
            } else {
                showNotification('No se encontraron datos en el archivo', 'danger');
            }
        } catch (error) {
            console.error('Error procesando archivo:', error);
            showNotification('Error al procesar el archivo: ' + error.message, 'danger');
        }
    };
    
    if (fileExtension === 'csv') {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// Parsear CSV
function parseCSV(text) {
    // Detectar delimitador (mayor ocurrencia entre tab, semicolon, comma, pipe)
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];
    const headerLine = lines[0];
    const delims = ['\t', ';', ',', '|'];
    let best = ',';
    let maxCount = 0;
    delims.forEach(d => {
        const cnt = (headerLine.split(new RegExp(d)).length - 1);
        if (cnt > maxCount) { maxCount = cnt; best = d; }
    });
    const delimiter = best === '\\t' ? '\t' : best;

    // Parsear líneas respetando comillas
    function parseCSVText(txt, delim) {
        const out = [];
        const allLines = txt.split(/\r?\n/).filter(l => l.trim() !== '');
        if (allLines.length === 0) return out;
        const headers = parseLine(allLines[0], delim).map(h => h.trim().replace(/^"|"$/g, ''));

        for (let i = 1; i < allLines.length; i++) {
            const values = parseLine(allLines[i], delim);
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = values[j] !== undefined ? values[j] : '';
            }
            out.push(obj);
        }
        return out;
    }

    function parseLine(line, delim) {
        const res = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
                else inQuotes = !inQuotes;
                continue;
            }
            if (!inQuotes && ch === delim) {
                res.push(cur);
                cur = '';
                continue;
            }
            cur += ch;
        }
        res.push(cur);
        return res;
    }

    try {
        // Intentar parseo con nuestro parser (más robusto para delimitadores y comillas)
        const parsed = parseCSVText(text, delimiter);
        console.log('parseCSV: parsed header count', Object.keys(parsed[0] || {}).length, 'rows', parsed.length);
        return parsed;
    } catch (e) {
        console.error('parseCSV fallback failed', e);
        return [];
    }
}

// Parse CSV a arrays (filas->columnas) respetando comillas
function parseCSVToArrays(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];

    function parseLineToArray(line) {
        const res = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
                else inQuotes = !inQuotes;
                continue;
            }
            // detect delimiter by majority if not in quotes
            if (!inQuotes && (ch === '\t' || ch === ',' || ch === ';' || ch === '|')) {
                res.push(cur);
                cur = '';
                continue;
            }
            cur += ch;
        }
        res.push(cur);
        return res.map(c => c.trim().replace(/^"|"$/g, ''));
    }

    return lines.map(parseLineToArray);
}

// Convertir arrays (primera fila cabecera opcional) a objetos
function arraysToObjects(arrays) {
    if (!arrays || arrays.length === 0) return [];
    const first = arrays[0];
    // Detectar si la primera fila parece header (tiene palabras/letters)
    const headerLikely = first.some(cell => /[A-Za-z\u00C0-\u017F]/.test(cell));
    let headers = [];
    let startIdx = 0;
    if (headerLikely) {
        headers = first.map(h => h || 'col');
        startIdx = 1;
    } else {
        headers = first.map((_, i) => 'col_' + i);
        startIdx = 0; // no header
    }

    const objs = [];
    for (let i = startIdx; i < arrays.length; i++) {
        const row = arrays[i];
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = row[j] !== undefined ? row[j] : '';
        }
        objs.push(obj);
    }
    return objs;
}

// Inferir mapeo de columnas por contenido (retorna objeto index->field)
function inferColumnMapping(arrays, sampleSize = 10) {
    // Try two modes: assume first row is header (skip it), or assume no header (use all rows)
    function computeScores(useHeader) {
        const samples = arrays.slice(0, Math.min(sampleSize + (useHeader?1:0), arrays.length));
        const dataRows = useHeader ? samples.slice(1) : samples.slice(0);
        const maxCols = Math.max(...samples.map(r => r.length));
        const cols = [];
        for (let c = 0; c < maxCols; c++) {
            cols[c] = dataRows.map(r => (r[c] !== undefined ? r[c] : ''));
        }

        function scoreCodigo(val) {
            if (!val) return 0;
            if (/^SOL[-_\s]?\d+/i.test(val)) return 5;
            if (/^PC\d+/i.test(val)) return 5;
            if (/^[A-Z]{1,3}\d{2,4}$/i.test(val)) return 3;
            return 0;
        }

        function scoreSucursal(val) {
            if (!val) return 0;
            if (/MALL|PLAZA|CENTRO|ALTO|STGO|RENCA|LA |PARQUE|LYON|SANTIAGO/i.test(val)) return 4;
            if (/[A-Za-z]+(\s+[A-Za-z]+)+/.test(val)) return 2;
            return 0;
        }

        function scoreCliente(val, clientsList) {
            if (!val) return 0;
            if (clientsList && clientsList.some(c => c.nombre && c.nombre.toString().toLowerCase() === String(val).toLowerCase())) return 4;
            if (/^[0-9]+$/.test(val)) return 2; // maybe client id
            if (/[A-Za-z]/.test(val) && val.length < 60) return 1;
            return 0;
        }

        const clientsList = _cachedClients || [];

        const scores = cols.map(colVals => {
            let scCodigo = 0, scSucursal = 0, scCliente = 0, scNumeric = 0;
            for (let v of colVals) {
                scCodigo += scoreCodigo(v);
                scSucursal += scoreSucursal(v);
                scCliente += scoreCliente(v, clientsList);
                if (/^[0-9]+$/.test(String(v))) scNumeric++;
            }
            return { scCodigo, scSucursal, scCliente, scNumeric };
        });

        const mapping = {};

        // pick codigo as highest scCodigo
        let bestCodigo = scores.map((s,i)=>({i,score:s.scCodigo})).sort((a,b)=>b.score-a.score)[0];
        if (bestCodigo && bestCodigo.score>0) mapping[bestCodigo.i] = 'codigo';

        // pick sucursal
        let bestSucursal = scores.map((s,i)=>({i,score:s.scSucursal})).sort((a,b)=>b.score-a.score)[0];
        if (bestSucursal && bestSucursal.score>0 && mapping[bestSucursal.i] !== 'codigo') mapping[bestSucursal.i] = 'sucursal';

        // pick cliente
        let bestCliente = scores.map((s,i)=>({i,score:s.scCliente})).sort((a,b)=>b.score-a.score)[0];
        if (bestCliente && bestCliente.score>0 && !Object.values(mapping).includes('cliente')) mapping[bestCliente.i] = 'cliente';

        // remaining numeric columns maybe equipment counts
        for (let i = 0; i < scores.length; i++) {
            if (mapping[i]) continue;
            if (scores[i].scNumeric > 0) {
                mapping[i] = 'numeric';
            }
        }

        // compute total score as metric
        const totalScore = scores.reduce((acc, s) => acc + s.scCodigo + s.scSucursal + s.scCliente, 0);
        return { mapping, totalScore };
    }

    const withHeader = computeScores(true);
    const withoutHeader = computeScores(false);

    // choose best
    if (withHeader.totalScore >= withoutHeader.totalScore) {
        return { mapping: withHeader.mapping, headerUsed: true };
    }
    return { mapping: withoutHeader.mapping, headerUsed: false };
}

// Intentar reconstruir filas válidas a partir de filas normalizadas sin mapeo correcto
function attemptRecoverFromRawNormalized(rows) {
    const recovered = [];
    for (let r of rows) {
        const out = { codigo: '', cliente: '', sucursal: '', tipo_solicitud: '', estado: '', tecnico: '', fecha_instalacion: '', totem: 0, tv_43: 0, tv_55: 0, tvbox: 0, soporte_brazo: 0, carcasa_ap: 0 };
        // Buscar posibles candidatos en las propiedades
        for (let k of Object.keys(r)) {
            const v = r[k];
            if (!v && v !== 0) continue;
            const s = String(v).trim();
            // codigo heuristics
            if (!out.codigo && /^\s*(SOL[-_\s]?\d+|PC\d+|[A-Z]{1,4}\d{2,4})\s*$/i.test(s)) {
                out.codigo = s;
                continue;
            }
            // sucursal heuristics
            if (!out.sucursal && /MALL|PLAZA|CENTRO|ALTO|STGO|RENCA|LYON|SANTIAGO|LA\s|VILLA|PUNTA|NORTE|OESTE/i.test(s)) {
                out.sucursal = s;
                continue;
            }
            // cliente heuristics (contains letters and not long)
            if (!out.cliente && /[A-Za-zÑñ]/.test(s) && s.length < 80 && !/^[0-9]+$/.test(s)) {
                out.cliente = s;
                continue;
            }
            // fecha
            if (!out.fecha_instalacion) {
                // ISO-like
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { out.fecha_instalacion = s; continue; }
                // dd/mm/yyyy or dd-mm-yyyy
                if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(s)) {
                    try {
                        const parts = s.split(/[\/-]/).map(p=>parseInt(p));
                        let dt = null;
                        if (parts[2] < 100) parts[2] += 2000;
                        dt = new Date(parts[2], parts[1]-1, parts[0]);
                        out.fecha_instalacion = dt.toISOString().split('T')[0];
                        continue;
                    } catch(e){}
                }
            }
            // equipos: if numeric
            if (/^[0-9]+$/.test(s)) {
                const n = parseInt(s);
                // assign to first available numeric slot
                if (!out.totem) { out.totem = n; continue; }
                if (!out.tv_43) { out.tv_43 = n; continue; }
                if (!out.tv_55) { out.tv_55 = n; continue; }
                if (!out.tvbox) { out.tvbox = n; continue; }
                if (!out.soporte_brazo) { out.soporte_brazo = n; continue; }
                if (!out.carcasa_ap) { out.carcasa_ap = n; continue; }
            }
            // técnico
            if (!out.tecnico && /[A-Za-z]+\s+[A-Za-z]+/.test(s) && s.length < 60) { out.tecnico = s; continue; }
        }
        recovered.push(out);
    }
    return recovered;
}

// Parsear Excel
function parseExcel(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, raw: false });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
    // Normalizar fechas que vengan como Date objects
    const normalized = data.map(row => {
        const out = {};
        Object.keys(row).forEach(k => {
            let v = row[k];
            if (v instanceof Date) {
                // convertir a YYYY-MM-DD
                try {
                    v = v.toISOString().split('T')[0];
                } catch (e) { v = '' }
            }
            out[k] = v;
        });
        return out;
    });
    console.log('parseExcel: sheet rows =', normalized.length, 'first headers =', Object.keys(normalized[0] || {}));
    return normalized;
}

// Reintentar sincronizar registros no sincronizados
async function syncUnsynced() {
    const unsynced = solicitudes.filter(s => s._synced === false);
    if (unsynced.length === 0) {
        showNotification('No hay registros pendientes de sincronizar', 'success');
        return;
    }

    const btn = document.getElementById('btnRetrySync');
    if (btn) btn.disabled = true;

    let syncedCount = 0;
    let failed = 0;
    for (let i = 0; i < solicitudes.length; i++) {
        const s = solicitudes[i];
        if (s._synced) continue;

        // Preparar payload similar a import
        const fecha = s.fecha_instalacion || new Date().toISOString().split('T')[0];
        const d = new Date(fecha);
        const mes = isNaN(d.getMonth()) ? (new Date()).getMonth() + 1 : d.getMonth() + 1;
        const anio = isNaN(d.getFullYear()) ? (new Date()).getFullYear() : d.getFullYear();

        const payload = {
            codigo_solicitud: s.codigo,
            cliente_id: null,
            sucursal_id: null,
            tipo_solicitud: mapTipoToBackend(s.tipo_solicitud || 'Instalación'),
            plataforma: s.plataforma || '',
            mes: mes,
            anio: anio,
            observaciones: s.observaciones || ''
        };

        try {
            // Intentar buscar cliente por nombre y crear si es necesario
            const clients = await fetchClients();
            let cliente = clients.find(c => c.nombre.toLowerCase() === s.cliente.toString().toLowerCase());
            if (cliente) payload.cliente_id = cliente.id;
            else payload.cliente_id = await createClientByName(s.cliente);

            // Buscar sucursal
            let sucursales = await fetchSucursales(payload.cliente_id);
            let suc = sucursales.find(x => x.nombre.toString().toLowerCase() === s.sucursal.toString().toLowerCase());
            if (suc) payload.sucursal_id = suc.id;
            else payload.sucursal_id = await createSucursal(payload.cliente_id, s.sucursal);

            const res = await createSolicitudApi(payload);
            if (res && res.success) {
                s._synced = true;
                // store remote id if backend returned it
                if (res.id) s._remote_id = res.id;
                syncedCount++;

                // If the local record indicates 'No Instalado' or has a reprogram date, send tecnica update
                try {
                    const needsNoInst = (String(s.estado || '').toLowerCase().includes('no instal')) || !!s.no_instalada;
                    const fr = s.fecha_reprogramada || null;
                    if (needsNoInst || fr) {
                        const tecPayload = { tecnica: {} };
                        if (needsNoInst) tecPayload.tecnica.no_instalada = true;
                        if (fr) tecPayload.tecnica.fecha_reprogramada = fr;
                        if (s.motivo_no_instalacion) tecPayload.tecnica.motivo_no_instalacion = s.motivo_no_instalacion;
                        const updateRes = await updateSolicitudApi(res.id, tecPayload);
                        if (updateRes && updateRes.success) {
                            console.log('tecnica update applied for', res.id);
                        } else {
                            console.warn('tecnica update failed for', res.id, updateRes);
                        }
                    }
                } catch (e) { console.error('post-create tecnica update error', e); }
            } else {
                failed++;
            }
        } catch (e) {
            console.error('syncUnsynced error', e);
            failed++;
        }
    }

    saveSolicitudesToStorage();
    renderSolicitudes();
    if (btn) btn.disabled = false;
    showNotification(`Sincronización completada: ${syncedCount} sincronizados, ${failed} fallidos`, syncedCount > 0 ? 'success' : 'danger');
}

// Normalizar claves y valores de una fila
function normalizeRow(row) {
    const normalized = {};
    Object.keys(row).forEach(k => {
        // limpiar BOM y espacios
        let key = k.toString().replace(/\uFEFF/g, '').trim();
        // quitar comillas y paréntesis
        key = key.replace(/\"/g, '').replace(/[\(\)"]/g, '');
        // normalizar acentos
        try { key = key.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch(e) {}
        // convertir a minúsculas y reemplazar cualquier bloque no alfanum por guion bajo
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

        let v = row[k];
        // manejar fechas en tipo Date (Excel) o números seriales
        if (v instanceof Date) {
            try { v = v.toISOString().split('T')[0]; } catch(e) { v = '' }
        }
        if (typeof v === 'number' && cleanKey && cleanKey.includes('fecha')) {
            // posible serial de Excel -> convertir a fecha
            try {
                // Excel serial date to JS date
                const serial = v;
                const utc_days = Math.floor(serial - 25569);
                const utc_value = utc_days * 86400;
                const date_info = new Date(utc_value * 1000);
                const fractional = serial - Math.floor(serial);
                const seconds = Math.round(86400 * fractional);
                date_info.setSeconds(seconds);
                v = date_info.toISOString().split('T')[0];
            } catch (e) { v = v.toString(); }
        }
        if (typeof v === 'string') v = v.trim();

        normalized[cleanKey] = v;
    });

    return normalized;
}

// Normalizar una clave de encabezado: quitar tildes, comillas, espacios -> guion bajo
function normalizeHeaderKey(key) {
    if (!key && key !== 0) return '';
    let k = String(key).replace(/\uFEFF/g, '').trim();
    k = k.replace(/\"/g, '').replace(/[\(\)"]/g, '');
    try { k = k.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch(e) {}
    k = k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return k;
}

// Mapa de alias (claves normalizadas -> clave canonica)
const HEADER_ALIAS_MAP = {
    'codigo_solicitud': 'codigo', 'codigo': 'codigo',
    'codigo_interno': 'codigo',
    'cliente': 'cliente',
    'sucursal': 'sucursal',
    'tipo_de_solicitud': 'tipo_solicitud', 'tipo_solicitud': 'tipo_solicitud', 'tipo': 'tipo_solicitud',
    'estado': 'estado',
    'tecnico_asignado': 'tecnico', 'tecnico': 'tecnico',
    'fecha_instalacion': 'fecha_instalacion', 'fecha_de_instalacion': 'fecha_instalacion', 'fecha': 'fecha_instalacion',
    'totem': 'totem', 'totems': 'totem',
    'tv_43': 'tv_43', 'tv_43_pulgadas': 'tv_43', 'tv43': 'tv_43', 'tv_43"': 'tv_43',
    'tv_55': 'tv_55', 'tv_55_pulgadas': 'tv_55', 'tv55': 'tv_55',
    'tvbox': 'tvbox', 'tv_box': 'tvbox',
    'soporte': 'soporte_brazo', 'soporte_brazo': 'soporte_brazo',
    'carcasa_ap': 'carcasa_ap',
    // extras
    'cant_totem': 'cant_totem', 'cant_totems': 'cant_totem', 'c_totem': 'cant_totem',
    'tv_32': 'tv_32', 'tv32': 'tv_32',
    'tv_40': 'tv_40', 'tv40': 'tv_40',
    'tv_50': 'tv_50', 'tv50': 'tv_50',
    'tv_65': 'tv_65', 'tv65': 'tv_65',
    'tv_cliente': 'tv_cliente', 'tv_cliente_count': 'tv_cliente',
    'tv_carteleria_digital': 'tv_carteleria_digital', 'carteleria': 'tv_carteleria_digital'
};

// Aplicar alias de headers a un objeto normalizado (keys limpias)
function applyHeaderAlias(normalizedRow) {
    const out = {};
    Object.keys(normalizedRow).forEach(k => {
        const mapped = HEADER_ALIAS_MAP[k] || (HEADER_ALIAS_MAP[k.trim()] || null);
        const newKey = mapped || k; // si no hay alias, conservar key normalizada
        out[newKey] = normalizedRow[k];
    });
    return out;
}

// Seleccionar solo los campos que usa Inventario y establecer defaults
function pickRowFields(row) {
    const allowed = [
        'codigo','cliente','sucursal','tipo_solicitud','estado','tecnico','fecha_instalacion',
        'totem','tv_43','tv_55','tvbox','soporte_brazo','carcasa_ap','plataforma','observaciones'
    ];

    // Mapear posibles variantes de nombres a las claves esperadas
    const aliases = {
        'codigo_interno': 'codigo', 'codigo': 'codigo',
        'cliente': 'cliente',
        'sucursal': 'sucursal',
        'tipo_solicitud': 'tipo_solicitud', 'tipo': 'tipo_solicitud',
        'pais': null,
        'status_despacho': null,
        'comentarios_de_seguimiento': null,
        'fecha_on_hold_cliente_vt': null,
        'fecha_ok_cliente_vt': null,
        'dias_on_hold_vt': null,
        'fecha_visita_tecnica': null,
        'horario_visita_tecnica': null,
        'fecha_on_hold_cliente_instalacion': null,
        'fecha_ok_cliente_instalacion': null,
        'comentarios_pre_instalacion': null,
        'dias_on_hold_instalacion': null,
        'fecha_instalacion': 'fecha_instalacion', 'mes': null, 'anio': null,
        'estado': 'estado', 'status_solicitud': 'estado',
        'horario_instalacion': null,
        'tecnico_asignado': 'tecnico', 'tecnico': 'tecnico',
        'status_solicitud': 'estado', 'motivo_instalacion_no_finalizada': null,
        'comentarios_instalacion': null,
        'cant_totem': 'totem', 'c_totem': 'totem', 'totem': 'totem',
        'version_totem': null, 'totem_sin_carcasa': null,
        'cant_carcasa_ap': 'carcasa_ap', 'carcasa_ap_ca1311': 'carcasa_ap',
        'cant_carcasa_sp': null, 'carcasa_sp_ca1411': null,'carcasa_pda': null,
        'tvbox': 'tvbox', 'dispositivo_carteleria_digital': null,
        'tv_32': null, 'tv_40': null, 'tv_43': 'tv_43', 'tv_50': null, 'tv_55': 'tv_55', 'tv_65': null
    };

    const out = {};
    // Initialize defaults
    allowed.forEach(k => {
        if (['totem','tv_43','tv_55','tvbox','soporte_brazo','carcasa_ap'].includes(k)) out[k] = 0;
        else if (k === 'fecha_instalacion') out[k] = null;
        else out[k] = '';
    });

    // Patrones para mapear encabezados imperfectos a las claves esperadas
    const patterns = [
        { re: /codig/, to: 'codigo' },
        { re: /client|cliente|nombre|razon/, to: 'cliente' },
        { re: /sucursal|branch/, to: 'sucursal' },
        { re: /tipo/, to: 'tipo_solicitud' },
        { re: /estado|status/, to: 'estado' },
        { re: /tecnic|tecnico|instalador/, to: 'tecnico' },
        { re: /fecha.*instal|fecha_instal/, to: 'fecha_instalacion' },
        { re: /totem|cant.*totem/, to: 'totem' },
        { re: /tv.*43|tv_43|43pulg|43/, to: 'tv_43' },
        { re: /tv.*55|tv_55|55pulg|55/, to: 'tv_55' },
        { re: /tvbox/, to: 'tvbox' },
        { re: /soporte.*brazo|soporte_brazo/, to: 'soporte_brazo' },
        { re: /carcasa.*ap|carcasa_ap|carcasaap/, to: 'carcasa_ap' }
    ];

    Object.keys(row).forEach(k => {
        let key = k; // already normalized by normalizeRow
        // si coincide exactamente
        if (allowed.includes(key)) { out[key] = row[k]; return; }

        // probar patrones
        const compact = key.replace(/[^a-z0-9]/g, '');
        for (let p of patterns) {
            try {
                if (p.re.test(key) || p.re.test(compact)) {
                    out[p.to] = row[k];
                    return;
                }
            } catch (e) { /* ignore invalid regex */ }
        }

        // caso adicional: columnas con numero y comillas como tv_43 etc
        const attempt = key.replace(/[^a-z0-9]/g,'');
        if (attempt.match(/tv43|43/)) { out['tv_43'] = row[k]; return; }
        if (attempt.match(/tv55|55/)) { out['tv_55'] = row[k]; return; }
        if (attempt.match(/totem/)) { out['totem'] = row[k]; return; }
        if (attempt.match(/tvbox/)) { out['tvbox'] = row[k]; return; }
        if (attempt.match(/soportebrazo/)) { out['soporte_brazo'] = row[k]; return; }
        if (attempt.match(/carcasaap|carcasa/)) { out['carcasa_ap'] = row[k]; return; }
    });

    // Ensure numeric fields are integers
    ['totem','tv_43','tv_55','tvbox','soporte_brazo','carcasa_ap'].forEach(nk => {
        const raw = out[nk];
        const numStr = raw === null || raw === undefined ? '' : String(raw).replace(/[^0-9\-]/g, '');
        const v = parseInt(numStr);
        out[nk] = isNaN(v) ? 0 : v;
    });

    // Capturar otras columnas de TVs o contadores y asignarlas explicitamente
    const extraKeys = ['tv_32','tv_40','tv_50','tv_65','tv_cliente','tv_carteleria_digital','cant_totem'];
    extraKeys.forEach(k => { out[k] = 0; });
    Object.keys(row).forEach(k => {
        const nk = normalizeHeaderKey(k);
        if (extraKeys.includes(nk)) {
            const v = parseInt(String(row[k] || '').replace(/[^0-9\-]/g,'')) || 0;
            out[nk] = v;
            if (nk === 'cant_totem') out['totem'] = (out['totem'] || 0) + v;
        }
    });

    // Fecha: normalizar a YYYY-MM-DD o null
    if (out['fecha_instalacion']) {
        const dstr = String(out['fecha_instalacion']).trim();
        const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(dstr);
        if (isoMatch) {
            out['fecha_instalacion'] = dstr;
        } else {
            // intentar parsear con Date (acepta muchos formatos) y dd/mm/yyyy
            const parsed = new Date(dstr);
            if (!isNaN(parsed.getTime())) {
                const y = parsed.getFullYear();
                const m = String(parsed.getMonth() + 1).padStart(2, '0');
                const day = String(parsed.getDate()).padStart(2, '0');
                out['fecha_instalacion'] = `${y}-${m}-${day}`;
            } else {
                const dms = dstr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
                if (dms) {
                    let dd = dms[1].padStart(2,'0');
                    let mm = dms[2].padStart(2,'0');
                    let yyyy = dms[3];
                    if (yyyy.length === 2) yyyy = '20'+yyyy;
                    out['fecha_instalacion'] = `${yyyy}-${mm}-${dd}`;
                } else {
                    out['fecha_instalacion'] = null;
                }
            }
        }
    } else {
        out['fecha_instalacion'] = null;
    }

    // Si cliente no fue detectado, intentar buscar en keys del objeto original (nombre, cliente, razon)
    if (!out.cliente || String(out.cliente).trim() === '') {
        for (let k of Object.keys(row)) {
            const nk = normalizeHeaderKey(k);
            const v = row[k];
            if (!v && v !== 0) continue;
            const s = String(v).trim();
            if (!s) continue;
            if (/cliente|client|nombre|razon/.test(nk) && !/^\d+$/.test(s) && s.length < 100) { out.cliente = s; break; }
        }
    }

    // Si tecnico no fue detectado, intentar buscar en keys del objeto original
    if (!out.tecnico || String(out.tecnico).trim() === '') {
        for (let k of Object.keys(row)) {
            const nk = normalizeHeaderKey(k);
            const v = row[k];
            if (!v && v !== 0) continue;
            const s = String(v).trim();
            if (!s) continue;
            if (/tecnic|tecnico|technician|instalador/.test(nk) && /[A-Za-zÑñ]+/.test(s) && s.length < 80) { out.tecnico = s; break; }
        }
    }

    return out;
}

// Finalizar fila importada: conservar solo campos solicitados y calcular objeto `equipos`
function finalizeImportedRow(raw) {
    try {
        const picked = pickRowFields(raw || {});
        // calcular equipos a partir de las claves relevantes
        const equipmentKeys = ['totem','tvbox','tv_32','tv_40','tv_43','tv_50','tv_55','tv_65','tv_cliente','tv_carteleria_digital','soporte_brazo','carcasa_ap'];
        const equipos = {};
        equipmentKeys.forEach(k => {
            let v = picked[k];
            if (v === undefined || v === null) v = 0;
            if (typeof v === 'string') v = parseInt(v.replace(/[^0-9\-]/g,'')) || 0;
            v = Number(v) || 0;
            equipos[k] = v;
            // remove from top-level to avoid duplication
            try { delete picked[k]; } catch(e){}
        });
        // Si existe cant_totem sumar a totem
        const cantTotem = picked['cant_totem'] !== undefined ? (parseInt(String(picked['cant_totem']).replace(/[^0-9\-]/g,''))||0) : 0;
        if (cantTotem) equipos['totem'] = (equipos['totem'] || 0) + cantTotem;
        // attach equipos
        picked.equipos = equipos;
        // asegurar campos base presentes
        const baseFields = ['codigo','cliente','sucursal','tipo_solicitud','estado','tecnico','fecha_instalacion','plataforma','observaciones'];
        const out = {};
        baseFields.forEach(f => { out[f] = picked[f] !== undefined ? picked[f] : (f === 'fecha_instalacion' ? null : ''); });
        out.equipos = picked.equipos;
        // sanitize final structure
        return sanitizeSolicitud(out);
    } catch (e) { console.warn('finalizeImportedRow failed', e); return sanitizeSolicitud({}); }
}

// =====================
// Helpers para API
// =====================
let _cachedClients = null;
let _cachedSucursales = {}; // { clienteId: [sucursales] }
// cache de nombres de cliente cuya creación falló (evitar repetir POSTs 404)
const _failedClientCreates = new Set();

async function fetchClients() {
    if (_cachedClients) return _cachedClients;
    const res = await fetch('/api/coordinacion/clientes/');
    const data = await res.json();
    _cachedClients = data;
    return data;
}

async function createClientByName(nombre) {
    const payload = { nombre: nombre, pais: 'Chile' };
    const res = await fetch('/api/coordinacion/clientes/create/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.success && data.id) {
        _cachedClients = null; // refrescar cache
        return data.id;
    }
    throw new Error(data.error || 'No se pudo crear cliente');
}

async function fetchSucursales(clienteId) {
    if (_cachedSucursales[clienteId]) return _cachedSucursales[clienteId];
    const res = await fetch(`/api/coordinacion/sucursales/?cliente=${clienteId}`);
    const data = await res.json();
    _cachedSucursales[clienteId] = data;
    return data;
}

async function createSucursal(clienteId, nombre) {
    // Generar código simple
    const codigo = nombre.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
    const payload = { cliente_id: clienteId, codigo: codigo, nombre: nombre };
    const res = await fetch('/api/coordinacion/sucursales/create/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.success && data.id) {
        _cachedSucursales[clienteId] = null; // refrescar cache
        return data.id;
    }
    throw new Error(data.error || 'No se pudo crear sucursal');
}

function mapTipoToBackend(tipo) {
    if (!tipo) return 'INSTALACION';
    const t = tipo.toString().toLowerCase();
    if (t.includes('reti')) return 'RETIRO';
    if (t.includes('pilo')) return 'PILOTO';
    return 'INSTALACION';
}

async function createSolicitudApi(payload) {
    try {
        console.log('createSolicitudApi payload:', payload);
        const res = await fetch('/api/coordinacion/solicitudes/create/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });
        const status = res.status;
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            data._status = status;
            console.log('createSolicitudApi response JSON:', data);
            return data;
        } catch (e) {
            console.warn('createSolicitudApi non-JSON response, status', status, text.slice(0,200));
            return { success: false, status: status, error: 'Respuesta no JSON', text: text };
        }
    } catch (e) {
        console.error('createSolicitudApi fetch error:', e);
        return { success: false, error: e.message };
    }
}

async function updateSolicitudApi(id, payload) {
    try {
        console.log('updateSolicitudApi id, payload:', id, payload);
        const res = await fetch(`/api/coordinacion/solicitudes/${id}/update/`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });
        const status = res.status;
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            data._status = status;
            console.log('updateSolicitudApi response JSON:', data);
            return data;
        } catch (e) {
            console.warn('updateSolicitudApi non-JSON response, status', status, text.slice(0,200));
            return { success: false, status: status, error: 'Respuesta no JSON', text: text };
        }
    } catch (e) {
        console.error('updateSolicitudApi fetch error:', e);
        return { success: false, error: e.message };
    }
}

// Mostrar vista previa
function showPreview(data, invalidCount = 0, rawSample = []) {
    const previewDiv = document.getElementById('import-preview');
    const contentDiv = document.getElementById('preview-content');
    console.log('showPreview: showing', data ? data.length : 0, 'valid rows, invalidCount=', invalidCount);
    const preview = (data || []).slice(0, 5); // Mostrar solo las primeras 5 filas válidas
    const finalizedPreview = preview.map(r => {
        try { return finalizeImportedRow(r); } catch(e) { return sanitizeSolicitud(r); }
    });
    let html = `<strong>Primeros ${finalizedPreview.length} registros válidos:</strong><br><br>`;

    finalizedPreview.forEach((row, index) => {
        const equipos = row.equipos || {};
        const totalEquipos = Object.values(equipos).reduce((a,b)=>a+ (Number(b)||0),0);
        const equiposResumen = Object.entries(equipos).filter(([k,v])=>v>0).map(([k,v])=>`${formatEquipoName(k)}: ${v}`).join(', ');
        html += `<div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px;">
            <strong>Registro ${index + 1}:</strong><br>
            Código: ${row.codigo || 'N/A'}<br>
            Cliente: ${row.cliente || 'N/A'}<br>
            Sucursal: ${row.sucursal || 'N/A'}<br>
            Tipo: ${row.tipo_solicitud || 'N/A'}<br>
            Técnico: ${row.tecnico || 'N/A'}<br>
            <small style="color:#475569;">Equipos: <strong>${totalEquipos}</strong> ${equiposResumen ? ' — ' + equiposResumen : ''}</small>
        </div>`;
    });

    if ((data || []).length > 5) {
        html += `<div style="color: #64748b; font-style: italic;">... y ${data.length - 5} registros más</div>`;
    }

    // Mostrar resumen de inválidos si hay
    if (invalidCount > 0) {
        html += `<hr style="margin:10px 0;">`;
        html += `<div style="color:#92400e; font-weight:600;">${invalidCount} registros inválidos (faltan codigo, cliente o sucursal). Muestra de primeras filas inválidas:</div>`;
        rawSample.forEach((r, i) => {
            const sample = (function(){ try { return finalizeImportedRow(r); } catch(e){ return sanitizeSolicitud(r); } })();
            const missing = [];
            if (!sample.codigo) missing.push('codigo');
            if (!sample.cliente) missing.push('cliente');
            if (!sample.sucursal) missing.push('sucursal');
            html += `<div style="margin-top:6px; padding:8px; background:#fff7ed; border-radius:4px;">Fila muestra ${i+1}: faltan: ${missing.join(', ')} — Cliente: ${sample.cliente||'N/A'}, Sucursal: ${sample.sucursal||'N/A'}, Código: ${sample.codigo||'N/A'}</div>`;
        });
    }

    contentDiv.innerHTML = html;
    // El mapeador manual está deshabilitado: el mapeo se aplica automáticamente
    previewDiv.style.display = 'block';
}

// Campos canónicos esperados para mapeo manual
const CANONICAL_FIELDS = ['codigo','cliente','sucursal','tipo_solicitud','estado','tecnico','fecha_instalacion','totem','tv_43','tv_55','tvbox','soporte_brazo','carcasa_ap'];

// Mostrar el mapeador de encabezados en la UI del modal
function showHeaderMapper(headers) {
    const mapper = document.getElementById('import-mapper');
    if (!mapper) return;
    const list = document.getElementById('mapper-list');
    if (!list) return;
    list.innerHTML = '';

    headers.forEach(h => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '6px';

        const lbl = document.createElement('div');
        lbl.style.width = '40%';
        lbl.textContent = h;

        const sel = document.createElement('select');
        sel.className = 'mapper-select';
        // Guardar la clave original y la normalizada
        sel.dataset.orig = h;
        sel.dataset.norm = normalizeHeaderKey(h);
        sel.style.width = '60%';

        // Opción por defecto: ignorar
        const optIgnore = document.createElement('option');
        optIgnore.value = 'ignore';
        optIgnore.textContent = 'Ignorar columna';
        sel.appendChild(optIgnore);

        // Agregar opciones canónicas
        CANONICAL_FIELDS.forEach(cf => {
            const o = document.createElement('option');
            o.value = cf; o.textContent = cf;
            sel.appendChild(o);
        });

        // Preseleccionar según alias si es posible
        const normalized = normalizeHeaderKey(h);
        const auto = HEADER_ALIAS_MAP[normalized] || HEADER_ALIAS_MAP[h] || null;
        if (auto) {
            try { sel.value = auto; } catch (e) { console.warn('showHeaderMapper preselect failed', e); }
        }

        row.appendChild(lbl);
        row.appendChild(sel);
        list.appendChild(row);
    });

    // Bind botones
    const btnApply = document.getElementById('btnApplyMapping');
    const btnAuto = document.getElementById('btnAutoMap');
    const btnPos = document.getElementById('btnMapByPos');
    if (btnApply) btnApply.onclick = applyHeaderMapping;
    if (btnAuto) btnAuto.onclick = autoMapHeaders;
    if (btnPos) btnPos.onclick = mapByPosition;

    mapper.style.display = 'block';
}

// Aplicar el mapping seleccionado por el usuario
function applyHeaderMapping() {
    const selects = document.querySelectorAll('.mapper-select');
    if (!selects || selects.length === 0) return;
    // Construir mapping normalizado: key = normalizeHeaderKey(orig) -> canonical field
    const mapping = {};
    selects.forEach(s => {
        const orig = s.dataset.orig || '';
        const norm = s.dataset.norm || normalizeHeaderKey(orig || '');
        const val = s.value;
        if (val && val !== 'ignore') mapping[norm] = val;
    });

    const source = window.rawAliased || window.rawNormalizedData || [];
    const mapped = source.map(r => {
        const out = {};
        Object.keys(r).forEach(origKey => {
            const nk = normalizeHeaderKey(origKey);
            const to = mapping[nk] || mapping[origKey];
            if (to) out[to] = r[origKey];
            else {
                // as a fallback, if origKey already matches a canonical field, copy it
                if (CANONICAL_FIELDS.includes(origKey)) out[origKey] = r[origKey];
            }
        });
        return out;
    });

    // Limpieza de valores comunes que rompen validación
    const cleaned = mapped.map(row => {
        const nr = {};
        Object.keys(row).forEach(k => {
            let v = row[k];
            if (v === null || v === undefined) { v = ''; }
            if (typeof v === 'string') {
                v = v.trim();
                if (/^#?N\/?A$/i.test(v) || /^n\.?a\.?$/i.test(v) || v === '-' || v === '--') v = '';
            }
            nr[k] = v;
        });
        return nr;
    });

    // Detectar y eliminar filas que resultaron ser la propia fila de encabezado parseada
    function isHeaderLike(row) {
        const codigo = String(row.codigo || '').toLowerCase();
        const cliente = String(row.cliente || '').toLowerCase();
        const sucursal = String(row.sucursal || '').toLowerCase();
        if (!codigo && !cliente && !sucursal) return false;
        if (/codig/.test(codigo) || /codigo/.test(codigo) || codigo.includes('codigo interno')) return true;
        if (/client|cliente/.test(cliente) || cliente.includes('cliente')) return true;
        if (/sucursal|branch/.test(sucursal) || sucursal.includes('sucursal')) return true;
        return false;
    }

    const filteredHeaderRows = cleaned.filter(r => !isHeaderLike(r));
    if (filteredHeaderRows.length !== cleaned.length) {
        console.log('applyHeaderMapping: removed', cleaned.length - filteredHeaderRows.length, 'header-like rows');
    }

    // Continuar con el flujo usando las filas limpiadas
    const coerced = filteredHeaderRows.map(m => pickRowFields(m));
    const valid = coerced.filter(r => r.codigo && r.cliente && r.sucursal);
    const invalidCount = coerced.length - valid.length;
    const rawSample = coerced.filter(r => !(r.codigo && r.cliente && r.sucursal)).slice(0,5);

    // Keep all coerced rows available for import (do not block on missing fields)
    window.mappedImportedData = coerced;
    window.importedData = coerced;
    try { importedData = coerced; } catch (e) { window.importedData = coerced; }
    console.log('applyHeaderMapping: valid rows=', valid.length, 'invalid=', invalidCount);
    showPreview(valid, invalidCount, rawSample);

    // Mostrar/habilitar botón de import si hay filas procesadas (incluso si algunas son incompletas)
    const btn = document.getElementById('btnProcessImport');
    if (btn) {
        btn.disabled = false;
        btn.style.display = coerced.length > 0 ? 'block' : 'none';
    }
}

// Intento de auto-mapeo heurístico y luego aplicar
function autoMapHeaders() {
    const selects = document.querySelectorAll('.mapper-select');
    if (!selects || selects.length === 0) return;
    selects.forEach(s => {
        const orig = s.dataset.orig || '';
        const n = s.dataset.norm || normalizeHeaderKey(orig);
        let chosen = null;
        if (HEADER_ALIAS_MAP[n]) chosen = HEADER_ALIAS_MAP[n];
        else if (/\bcod\b|codigo/.test(n)) chosen = 'codigo';
        else if (n.includes('cliente')) chosen = 'cliente';
        else if (n.includes('sucursal') || n.includes('branch')) chosen = 'sucursal';
        else if (n.includes('tipo')) chosen = 'tipo_solicitud';
        else if (n.includes('estado') || n.includes('status')) chosen = 'estado';
        else if (n.includes('tecnic')) chosen = 'tecnico';
        else if (n.includes('fecha')) chosen = 'fecha_instalacion';
        else if (n.includes('43') && n.includes('tv')) chosen = 'tv_43';
        else if (n.includes('55') && n.includes('tv')) chosen = 'tv_55';
        else if (n.includes('tvbox') || n.includes('tv_box') ) chosen = 'tvbox';
        else if (n.includes('totem')) chosen = 'totem';
        else if (n.includes('soporte')) chosen = 'soporte_brazo';
        else if (n.includes('carcasa')) chosen = 'carcasa_ap';

        if (chosen) {
            try { s.value = chosen; } catch (e) { console.warn('autoMap set value failed', e); }
        }
    });

    // Aplicar automáticamente después del auto-mapeo
    applyHeaderMapping();
}

// Mapear columnas por posición: columna0->codigo, 1->cliente, 2->sucursal, 3->tipo, 4->tecnico, 5->fecha_instalacion, siguientes -> equipos
function mapByPosition() {
    const selects = document.querySelectorAll('.mapper-select');
    if (!selects || selects.length === 0) return;
    const positionMap = ['codigo','cliente','sucursal','tipo_solicitud','tecnico','fecha_instalacion','totem','tv_43','tv_55','tvbox','soporte_brazo','carcasa_ap'];
    selects.forEach((s, idx) => {
        const choice = positionMap[idx] || 'ignore';
        try { s.value = choice; } catch (e) { console.warn('mapByPosition set failed', e); }
    });
    // Aplicar mapping resultante
    applyHeaderMapping();
}

// Construir filas a partir de arrays (headerUsed indica si la primera fila es cabecera)
function buildRowsFromArrays(arrays, mapping, headerUsed) {
    if (!arrays || arrays.length === 0) return [];
    const rows = [];
    const start = headerUsed ? 1 : 0;
    for (let i = start; i < arrays.length; i++) {
        const row = arrays[i] || [];
        const out = {};
        Object.keys(mapping).forEach(idx => {
            const pos = parseInt(idx, 10);
            if (!isNaN(pos)) {
                const field = mapping[idx];
                out[field] = row[pos] !== undefined ? row[pos] : '';
            }
        });
        rows.push(out);
    }
    return rows;
}

// Aplicar mapping a objetos (source: array de objetos con keys originales)
function applyMappingToObjects(mapping, source) {
    if (!source || source.length === 0) return [];
    const mapped = source.map(r => {
        const out = {};
        Object.keys(r).forEach(origKey => {
            const nk = normalizeHeaderKey(origKey);
            const to = mapping[nk] || mapping[origKey];
            if (to) out[to] = r[origKey];
            else if (CANONICAL_FIELDS.includes(origKey)) out[origKey] = r[origKey];
        });
        return out;
    });
    return mapped;
}

// Buscar filas relacionadas con un nombre de cliente (case-insensitive, maneja mayúsculas)
function findRowsByClientName(clientName) {
    if (!clientName) return [];
    const needle = String(clientName).trim().toLowerCase();
    const candidates = [];
    const sources = [window.rawImportedData, window.mappedImportedData, window.rawAliased, window.rawNormalizedData];
    const seen = new Set();
    sources.forEach(src => {
        if (!src || !Array.isArray(src)) return;
        src.forEach(r => {
            try {
                const keys = Object.keys(r || {});
                for (let k of keys) {
                    const v = r[k];
                    if (v === null || v === undefined) continue;
                    const sval = String(v).trim().toLowerCase();
                    if (sval.indexOf(needle) !== -1) {
                        const id = JSON.stringify(r);
                        if (!seen.has(id)) { seen.add(id); candidates.push(r); }
                        break;
                    }
                }
            } catch (e) { /* ignore row errors */ }
        });
    });
    return candidates;
}

// Exponer util en window para debugging en consola
try { window.findRowsByClientName = findRowsByClientName; } catch(e) {}

// Buscar filas por codigo interno y nombre de cliente (case-insensitive)
function findRowsByCodeAndClient(code, clientName) {
    if (!code) return [];
    const needleCode = String(code).trim().toLowerCase();
    const needleClient = clientName ? String(clientName).trim().toLowerCase() : null;
    const sources = [window.rawImportedData, window.mappedImportedData, window.rawAliased, window.rawNormalizedData];
    const results = [];
    const seen = new Set();
    sources.forEach(src => {
        if (!src || !Array.isArray(src)) return;
        src.forEach(r => {
            try {
                const serialized = JSON.stringify(r);
                if (seen.has(serialized)) return;
                const anyValues = Object.values(r || {}).map(v => v === null || v === undefined ? '' : String(v).toLowerCase());
                const codeMatch = anyValues.some(v => v.indexOf(needleCode) !== -1);
                const clientMatch = needleClient ? anyValues.some(v => v.indexOf(needleClient) !== -1) : true;
                if (codeMatch && clientMatch) { results.push(r); seen.add(serialized); }
            } catch (e) {}
        });
    });
    return results;
}

// Fixear filas importadas encontradas por codigo+cliente: asigna cliente y busca sucursal corta (ej. LYON)
function fixImportedRowByCode(code, clientName) {
    const rows = findRowsByCodeAndClient(code, clientName);
    if (!rows || rows.length === 0) return { ok: false, message: 'No se encontraron filas' };
    let fixed = 0;
    rows.forEach(r => {
        try {
            const prev = { cliente: r.cliente, sucursal: r.sucursal };
            r.cliente = clientName;
            // intentar detectar sucursal en los valores: short tokens or 'lyon'
            const vals = Object.values(r || {}).map(v => v===null||v===undefined? '': String(v).trim());
            const suc = vals.find(v => /^\d+$/.test(v) || /^[A-Z0-9\.\-]{1,6}$/.test(v) || /lyon|mall|plaza|centro|store|branch/i.test(v));
            if (suc) r.sucursal = suc;
            fixed++;
            console.log('fixImportedRowByCode: fixed row', code, prev, '->', { cliente: r.cliente, sucursal: r.sucursal });
        } catch(e) { console.warn('fixImportedRowByCode failed for row', r, e); }
    });
    // sync back to global imported arrays if present
    try { window.rawImportedData = window.rawImportedData || []; window.mappedImportedData = window.mappedImportedData || []; } catch(e) {}
    // also update importedData variable
    try { importedData = window.rawImportedData || window.mappedImportedData || importedData; } catch(e) {}
    // rerender preview/enable import button
    try {
        const btn = document.getElementById('btnProcessImport'); if (btn) { btn.style.display = 'block'; btn.disabled = false; }
        showNotification(`Se arreglaron ${fixed} fila(s) para ${code}`, 'success');
    } catch(e) {}
    return { ok: true, fixed };
}

try { window.findRowsByCodeAndClient = findRowsByCodeAndClient; window.fixImportedRowByCode = fixImportedRowByCode; } catch(e) {}

// Heurística para intentar reparar filas importadas cuando las columnas están desplazadas
function repairImportedRows(rows) {
    if (!rows || rows.length === 0) return rows;
    const repaired = [];
    const origAlias = window.rawAliased || window.rawNormalizedData || [];
    const codigoRe = /^\s*(SOL[-_\s]?\d+|PC\d+|[A-Z]{1,4}\d{2,6})\s*$/i;

    for (let i = 0; i < rows.length; i++) {
        const r = Object.assign({}, rows[i]);
        const orig = origAlias[i] || {};

        // Normalize strings
        Object.keys(r).forEach(k => { if (typeof r[k] === 'string') r[k] = r[k].trim(); });

        // Regla rápida: si el código es del tipo PC###, intentar extraer cliente/sucursal directamente desde orig
        try {
            const code = String(r.codigo || '').trim();
            if (/^PC\d+/i.test(code)) {
                // buscar valor que contenga 'falabella' o 'viajes' en orig
                let candidateClient = null;
                let candidateSucursal = null;
                Object.keys(orig).forEach(k => {
                    try {
                        const v = orig[k]; if (!v && v !== 0) return;
                        const s = String(v).trim(); if (!s) return;
                        const low = s.toLowerCase();
                        if (!candidateClient && (low.includes('falabella') || low.includes('viajes'))) candidateClient = s;
                        // pick short tokens or known sucursal tokens as sucursal
                        if (!candidateSucursal) {
                            if (/^\d+$/.test(s) || /^[A-Z\d\.\-]{1,6}$/.test(s) || /lyon|mall|plaza|centro|store|branch/i.test(s)) candidateSucursal = s;
                        }
                    } catch(e){}
                });
                if (candidateClient) {
                    console.log('repairImportedRows: PC-code rule - setting cliente for', code, '->', candidateClient);
                    r.cliente = candidateClient;
                    if (candidateSucursal) {
                        r.sucursal = candidateSucursal;
                        console.log('repairImportedRows: PC-code rule - setting sucursal for', code, '->', candidateSucursal);
                    }
                }
            }
        } catch(e){ console.warn('repairImportedRows: PC-code rule failed', e); }

        // Helper: determine if a candidate is a good client name
        function isGoodClientCandidate(s) {
            if (!s) return false;
            const v = String(s).trim();
            if (!v) return false;
            if (/^#?N\/\?A$/i.test(v)) return false;
            if (/^SOL[-_\s]?\d+/i.test(v)) return false;
            if (/^[0-9]+$/.test(v)) return false;
            const lower = v.toLowerCase();
            const words = v.split(/\s+/).filter(Boolean).length;
            const hasBrand = ['falabella','viajes','walmart','cencosud','smu','unimarc','ripley','sodimac','carrefour','hites'].some(bt => lower.includes(bt));
            if (hasBrand) return true;
            if (lower.includes('chile')) return true;
            if (words >= 2 && v.length > 4) return true;
            return false;
        }

        // If orig has an explicit cliente-like header, prefer that value immediately
        try {
            const origKeys = Object.keys(orig || {});
            for (let hk of origKeys) {
                const nk = normalizeHeaderKey(hk || '');
                if (nk && (nk.includes('client') || nk === 'cliente' || nk.includes('nombre') || nk.includes('razon'))) {
                    const cand = orig[hk];
                    if (isGoodClientCandidate(cand)) {
                        r.cliente = String(cand).trim();
                        console.log('repairImportedRows: set cliente from explicit header', hk, '->', r.cliente);
                        break;
                    }
                }
            }
        } catch (e) { /* ignore */ }

        // 1) If cliente missing, try to find a candidate in the repaired row first, then original raw fields
        if (!r.cliente || String(r.cliente).trim() === '') {
            // inspect keys already present in r (after previous mapping attempts)
            for (let k of Object.keys(r)) {
                const v = r[k];
                if (!v && v !== 0) continue;
                const nk = normalizeHeaderKey(k);
                const s = String(v).trim();
                if (!s) continue;
                // prefer explicit alias or header-like names but avoid single short tokens (e.g., 'LYON')
                const ali = HEADER_ALIAS_MAP[nk] || '';
                const lower = s.toLowerCase();
                const words = s.split(/\s+/).filter(Boolean).length;
                const hasBrand = ['falabella','viajes','walmart','cencosud','smu','unimarc','ripley','sodimac','carrefour','hites'].some(bt => lower.includes(bt));
                const looksLikeSucursal = /mall|plaza|centro|stgo|ren|renaca|lyon|store|branch|avenida|av\b/i.test(s);
                // accept if brand present or multi-word or contains 'chile' or lowercase letters, and not clearly a sucursal
                if ((ali === 'cliente' || /cliente|client|nombre|razon/.test(nk)) && !/^\d+$/.test(s) && s.length > 1 && s.length < 160) {
                    if (hasBrand || words >= 2 || /chile/.test(lower) || /[a-zñ]/.test(s)) {
                        if (!looksLikeSucursal) {
                            r.cliente = s;
                            console.log('repairImportedRows: set cliente from repaired key (preferred)', k, '->', s);
                            break;
                        }
                    }
                }
            }
            if (!r.cliente || String(r.cliente).trim() === '') {
                for (let k of Object.keys(orig)) {
                    const v = orig[k];
                    if (!v) continue;
                    const s = String(v).trim();
                    if (s.length > 2 && !/^#?N\/\?A$/i.test(s) && !codigoRe.test(s) && !/^[0-9]+$/.test(s)) {
                        r.cliente = s;
                        console.log('repairImportedRows: set cliente from', k, '->', s);
                        break;
                    }
                }
                // If still missing, attempt brand/keyword based detection (e.g., 'falabella', 'viajes', 'walmart')
                if (!r.cliente || String(r.cliente).trim() === '') {
                    const brandTokens = ['falabella','viajes','walmart','cencosud','smu','unimarc','ripley','sodimac','carrefour','hites'];
                    let bestCandidate = null;
                    function evaluateCandidate(val, key) {
                        if (!val) return null;
                        const s = String(val).trim();
                        if (!s || /^#?N\/\?A$/i.test(s) || codigoRe.test(s) || /^[0-9]+$/.test(s)) return null;
                        const lower = s.toLowerCase();
                        for (let bt of brandTokens) {
                            if (lower.includes(bt)) return { val: s, score: 100 + bt.length };
                        }
                        // prefer values including 'chile' or multi-word names
                        if (lower.includes('chile')) return { val: s, score: 80 };
                        if (s.split(/\s+/).length >= 2 && s.length > 6) return { val: s, score: 50 };
                        return null;
                    }

                    // check repaired row keys first
                    for (let k of Object.keys(r)) {
                        const cand = evaluateCandidate(r[k], k);
                        if (cand && (!bestCandidate || cand.score > bestCandidate.score)) bestCandidate = cand;
                    }
                    // then original raw fields
                    for (let k of Object.keys(orig)) {
                        const cand = evaluateCandidate(orig[k], k);
                        if (cand && (!bestCandidate || cand.score > bestCandidate.score)) bestCandidate = cand;
                    }
                    if (bestCandidate) {
                        r.cliente = bestCandidate.val;
                        console.log('repairImportedRows: set cliente by brand heuristic ->', r.cliente);
                    }
                }
            }
        }

        // 2) If sucursal is missing or looks numeric-only but there is a textual candidate, try to assign
        if (!r.sucursal || String(r.sucursal).trim() === '' || /^[0-9]+$/.test(String(r.sucursal).trim())) {
            for (let k of Object.keys(orig)) {
                const v = orig[k];
                if (!v) continue;
                const s = String(v).trim();
                if (s.length > 2 && /MALL|PLAZA|CENTRO|ALTO|STGO|RENCA|LA |PARQUE|LYON|SANTIAGO|VILLA|PERU|PERÚ|STORE|BRANCH/i.test(s)) {
                    r.sucursal = s;
                    console.log('repairImportedRows: set sucursal from', k, '->', s);
                    break;
                }
            }
        }

        // 3) Fecha: if missing, try to parse from any repaired-field first, then original field
        if (!r.fecha_instalacion) {
            for (let k of Object.keys(r)) {
                const v = r[k];
                if (!v) continue;
                const s = String(v).trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(s)) {
                    const temp = { fecha_instalacion: s };
                    const picked = pickRowFields(temp);
                    if (picked.fecha_instalacion) { r.fecha_instalacion = picked.fecha_instalacion; console.log('repairImportedRows: set fecha_instalacion from repaired key', k, '->', r.fecha_instalacion); break; }
                }
            }
            if (!r.fecha_instalacion) {
                for (let k of Object.keys(orig)) {
                    const v = orig[k];
                    if (!v) continue;
                    const s = String(v).trim();
                    if (/^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(s)) {
                        const temp = { fecha_instalacion: s };
                        const picked = pickRowFields(temp);
                        if (picked.fecha_instalacion) { r.fecha_instalacion = picked.fecha_instalacion; console.log('repairImportedRows: set fecha_instalacion from', k, '->', r.fecha_instalacion); break; }
                    }
                }
            }
        }

        // 3.5) Try mapping from original headers using HEADER_ALIAS_MAP and normalized header keys
        try {
            for (let k of Object.keys(orig)) {
                const v = orig[k];
                if (v === null || v === undefined) continue;
                const nk = normalizeHeaderKey(k);
                const mapped = HEADER_ALIAS_MAP[nk] || null;
                const s = String(v).trim();

                if (mapped === 'cliente' && (!r.cliente || String(r.cliente).trim() === '')) {
                    if (s && !/^#?N\/\?A$/i.test(s) && !codigoRe.test(s)) { r.cliente = s; console.log('repairImportedRows: mapped cliente from header', k, '->', s); }
                }
                if (mapped === 'tecnico' && (!r.tecnico || String(r.tecnico).trim() === '')) {
                    if (s && /[A-Za-zÑñ]+\s+[A-Za-zÑñ]+/.test(s)) { r.tecnico = s; console.log('repairImportedRows: mapped tecnico from header', k, '->', s); }
                }
                if (mapped === 'fecha_instalacion' && !r.fecha_instalacion) {
                    // reuse pickRowFields to coerce
                    const temp = { fecha_instalacion: s };
                    const picked = pickRowFields(temp);
                    if (picked.fecha_instalacion) { r.fecha_instalacion = picked.fecha_instalacion; console.log('repairImportedRows: mapped fecha_instalacion from header', k, '->', r.fecha_instalacion); }
                }

                // equipment aliases: if header maps to known equipment, set its numeric value
                const equipmentTargets = ['totem','tv_32','tv_40','tv_43','tv_50','tv_55','tv_65','tvbox','tv_cliente','tv_carteleria_digital','soporte_brazo','carcasa_ap','cant_totem'];
                if (mapped && equipmentTargets.includes(mapped)) {
                    const n = parseInt(String(s).replace(/[^0-9\-]/g,''));
                    if (!isNaN(n) && n !== 0) {
                        // if mapping is cant_totem, add to totem
                        if (mapped === 'cant_totem') {
                            r.totem = (parseInt(r.totem) || 0) + n;
                        } else {
                            r[mapped] = (parseInt(r[mapped]) || 0) + n;
                        }
                        console.log('repairImportedRows: mapped equipment', mapped, 'from', k, '->', n);
                    }
                }

                // fallback heuristics on normalized key name
                if (!mapped) {
                    if (!r.cliente && /client|cliente/.test(nk) && !/^#?N\/?A$/i.test(s) && !codigoRe.test(s)) { r.cliente = s; }
                    if (!r.tecnico && /tecnic/.test(nk) && /[A-Za-z]+\s+[A-Za-z]+/.test(s)) { r.tecnico = s; }
                    if (!r.fecha_instalacion && /fecha/.test(nk)) {
                        const temp = { fecha_instalacion: s };
                        const picked = pickRowFields(temp);
                        if (picked.fecha_instalacion) r.fecha_instalacion = picked.fecha_instalacion;
                    }
                    if (/tv|totem|tvbox|carcasa|soporte/.test(nk)) {
                        const n = parseInt(String(s).replace(/[^0-9\-]/g,''));
                        if (!isNaN(n) && n !== 0) {
                            if (/totem|cant_totem/.test(nk)) r.totem = (parseInt(r.totem) || 0) + n;
                            else if (/tv.*43|tv43|43/.test(nk)) r.tv_43 = (parseInt(r.tv_43) || 0) + n;
                            else if (/tv.*55|tv55|55/.test(nk)) r.tv_55 = (parseInt(r.tv_55) || 0) + n;
                            else if (/tvbox/.test(nk)) r.tvbox = (parseInt(r.tvbox) || 0) + n;
                            else if (/carcasa/.test(nk)) r.carcasa_ap = (parseInt(r.carcasa_ap) || 0) + n;
                            else if (/soporte/.test(nk)) r.soporte_brazo = (parseInt(r.soporte_brazo) || 0) + n;
                        }
                    }
                }
            }
        } catch (e) { console.warn('repairImportedRows: mapping pass failed', e); }

        // 4) Equipos: if total equipos is 0 but there are numeric values scattered, sum them
            // Validate cliente value: avoid short tokens (e.g., 'LYON') being used as cliente
            try {
                const clientValRaw = r.cliente ? String(r.cliente).trim() : '';
                const clientWords = clientValRaw.split(/\s+/).filter(Boolean).length;
                const looksLikeShortToken = clientValRaw && (clientValRaw.length <= 4 || clientWords === 1) && (/^[A-Z0-9\.\-]+$/.test(clientValRaw) || /^[0-9]+$/.test(clientValRaw));
                const looksLikeSucursal = clientValRaw && /mall|plaza|centro|stgo|ren|lyon|store|branch|avenida|av\b|sucursal/i.test(clientValRaw);
                if (clientValRaw && (looksLikeShortToken || looksLikeSucursal)) {
                    // try to find a better candidate in orig or r values (brand/multiword)
                    const brandTokens = ['falabella','viajes','walmart','cencosud','smu','unimarc','ripley','sodimac','carrefour','hites'];
                    let best = null;
                    function scoreCandidate(v) {
                        if (!v) return null;
                        const s = String(v).trim();
                        if (!s) return null;
                        if (/^#?N\/\?A$/i.test(s) || /^\s*$/i.test(s) || /^SOL[-_\s]?\d+/i.test(s)) return null;
                        const lower = s.toLowerCase();
                        let score = 0;
                        for (let bt of brandTokens) if (lower.includes(bt)) score += 100;
                        if (lower.includes('chile')) score += 50;
                        const words = s.split(/\s+/).filter(Boolean).length;
                        score += Math.min(50, words * 10);
                        if (/^[0-9]+$/.test(s)) return null;
                        if (/mall|plaza|centro|sucursal|store|branch|avenida|av\b/i.test(s)) score -= 30;
                        return { val: s, score };
                    }

                    // search repaired row r first
                    Object.keys(r).forEach(k => {
                        const cand = scoreCandidate(r[k]);
                        if (cand && (!best || cand.score > best.score)) best = cand;
                    });
                    // then original raw fields
                    Object.keys(orig).forEach(k => {
                        const cand = scoreCandidate(orig[k]);
                        if (cand && (!best || cand.score > best.score)) best = cand;
                    });
                    // also prefer any field whose header normalized key maps to cliente
                    Object.keys(orig).forEach(k => {
                        const nk = normalizeHeaderKey(k);
                        if (HEADER_ALIAS_MAP[nk] === 'cliente') {
                            const v = orig[k];
                            if (v && String(v).trim()) { best = { val: String(v).trim(), score: 1000 }; }
                        }
                    });

                    if (best && best.val) {
                        console.log('repairImportedRows: replacing cliente', r.cliente, 'with candidate', best.val);
                        r.cliente = best.val;
                    }
                }
            } catch (e) { console.warn('repairImportedRows: cliente validation failed', e); }

        const equipmentKeys = ['totem','tv_32','tv_40','tv_43','tv_50','tv_55','tv_65','tvbox','tv_cliente','tv_carteleria_digital','soporte_brazo','carcasa_ap'];
        let currentSum = equipmentKeys.reduce((s, key) => s + (parseInt(r[key]) || 0), 0);
        if (currentSum === 0) {
            // collect numeric-only values from orig (excluding codigo-like values)
            let extraSum = 0;
            for (let k of Object.keys(orig)) {
                const v = orig[k];
                if (v === null || v === undefined) continue;
                const s = String(v).trim();
                if (/^[0-9]+$/.test(s) && !codigoRe.test(s)) {
                    extraSum += parseInt(s);
                }
            }
            if (extraSum > 0) {
                // assign totem as fallback container
                r.totem = (parseInt(r.totem) || 0) + extraSum;
                console.log('repairImportedRows: aggregated extra numeric values into totem =', r.totem);
            }
        }

        // Ensure numeric coercion for equipment fields
        equipmentKeys.forEach(k => { r[k] = parseInt(String(r[k] || '').replace(/[^0-9\-]/g,'')) || 0; });

        // Detect if cliente and sucursal were swapped: prefer cliente as multi-word/brand and sucursal as short token or numeric
        try {
            const clienteRaw = r.cliente ? String(r.cliente).trim() : '';
            const sucursalRaw = r.sucursal ? String(r.sucursal).trim() : '';
            function looksLikeSucursalToken(s) {
                if (!s) return false;
                if (/^\d+$/.test(s)) return true; // numeric codes
                if (/^([A-Z\.\-]{1,6})$/.test(s) && s.length <= 6) return true; // short uppercase tokens like LYON
                if (/mall|plaza|centro|store|branch|sucursal|av\b|avenida|parque|station/i.test(s)) return true;
                return false;
            }
            function looksLikeClientName(s) {
                if (!s) return false;
                const lower = s.toLowerCase();
                if (lower.includes('viajes') || lower.includes('falabella') || lower.includes('walmart') || lower.includes('cencosud')) return true;
                const words = s.split(/\s+/).filter(Boolean).length;
                return words >= 2 && s.length > 4;
            }

            if (clienteRaw && sucursalRaw) {
                const clienteLooksSucursal = looksLikeSucursalToken(clienteRaw);
                const sucursalLooksClient = looksLikeClientName(sucursalRaw);
                const clienteIsShort = clienteRaw.length <= 6 && clienteRaw.split(/\s+/).length === 1;
                // If cliente looks like a sucursal token and sucursal looks like a client, swap
                if ((clienteLooksSucursal && sucursalLooksClient) || (clienteIsShort && looksLikeClientName(sucursalRaw))) {
                    const prevCliente = clienteRaw; const prevSucursal = sucursalRaw;
                    r.cliente = sucursalRaw;
                    r.sucursal = clienteRaw;
                    console.log('repairImportedRows: swapped cliente/sucursal (detected inversion):', prevCliente, '<->', prevSucursal);
                }
            }
        } catch (e) { console.warn('repairImportedRows: swap check failed', e); }

        // Regla específica: si cliente es un token corto (ej. LYON) y en los campos originales
        // aparece 'viajes' + 'falabella', usar ese valor como cliente (p.ej. 'VIAJES FALABELLA CHILE')
        try {
            const clienteRaw = r.cliente ? String(r.cliente).trim() : '';
            if (clienteRaw && clienteRaw.length <= 8 && clienteRaw.split(/\s+/).length === 1) {
                for (let k of Object.keys(orig)) {
                    const v = orig[k];
                    if (!v) continue;
                    const s = String(v).trim();
                    const lower = s.toLowerCase();
                    if (/viajes/.test(lower) && /falabella/.test(lower)) {
                        console.log('repairImportedRows: rule match - setting cliente from orig', s);
                        // si sucursal estaba vacío o igual al token corto, mantenerlo
                        const prev = { cliente: r.cliente, sucursal: r.sucursal };
                        r.cliente = s;
                        if (!r.sucursal || String(r.sucursal).trim().toUpperCase() === clienteRaw.toUpperCase()) r.sucursal = clienteRaw;
                        console.log('repairImportedRows: applied viajes-falabella rule, swapped if needed', prev, '->', { cliente: r.cliente, sucursal: r.sucursal });
                        break;
                    }
                }
            }
        } catch (e) { console.warn('repairImportedRows: viajes-falabella rule failed', e); }

        repaired.push(r);
    }
    console.log('repairImportedRows: completed repairs, before sample:', (rows||[]).slice(0,3), 'after sample:', repaired.slice(0,3));
    return repaired;
}

// Aplicar mapeo automático por codigo (p.ej. PC###) usando valores en rawAliased/rawNormalizedData
function applyAutoCodeMapping(rows) {
    if (!rows || rows.length === 0) return rows;
    const origAlias = window.rawAliased || window.rawNormalizedData || [];
    const allOrig = window.rawArrays || [];
    const brandTokens = ['falabella','viajes','walmart','cencosud','smu','unimarc','ripley','sodimac','carrefour','hites'];

    // Tabla determinista mínima por código -- puede extenderse desde localStorage o window.__CODE_MAP__
    const defaultMap = {
        'PC208': { cliente: 'VIAJES FALABELLA CHILE', sucursal: 'LYON' }
    };
    let storedMap = {};
    try {
        storedMap = window.__CODE_MAP__ || JSON.parse(localStorage.getItem('factora_code_map') || '{}') || {};
    } catch(e) { storedMap = window.__CODE_MAP__ || {}; }
    const CODE_MAP = Object.assign({}, defaultMap, storedMap);

    return rows.map((r, i) => {
        try {
            const copy = Object.assign({}, r);
            const code = String(copy.codigo || '').trim();
            if (!/^PC\d+/i.test(code)) return copy;

            // try using the same index in origAlias first
            let sourceRow = origAlias[i] || null;
            // fallback: search in rawAliased rows for a row that contains the code
            if (!sourceRow && Array.isArray(origAlias) && origAlias.length > 0) {
                for (let rr of origAlias) {
                    try {
                        const vals = Object.values(rr||{}).map(v => v===null||v===undefined? '': String(v).trim());
                        if (vals.some(v => v.toLowerCase() === code.toLowerCase() || v.toLowerCase().includes(code.toLowerCase()))) { sourceRow = rr; break; }
                    } catch(e){}
                }
            }
            // another fallback: if rawArrays present, search rows where any cell equals code
            if (!sourceRow && Array.isArray(allOrig) && allOrig.length > 0) {
                for (let arr of allOrig) {
                    try {
                        const vals = arr.map(c => String(c||'').trim());
                        if (vals.some(v => v.toLowerCase() === code.toLowerCase())) { sourceRow = Object.assign({}, {}); // create fake object from array
                            // heuristically assign possible client and sucursal from neighboring columns
                            const idx = vals.findIndex(v => v.toLowerCase() === code.toLowerCase());
                            sourceRow['col_code_idx'] = idx;
                            sourceRow['col_values'] = vals;
                            break;
                        }
                    } catch(e){}
                }
            }

            // extract candidate client and sucursal
            let candidateClient = null, candidateSucursal = null;
            if (sourceRow) {
                // if it's a object with keys
                if (sourceRow.col_values) {
                    const vals = sourceRow.col_values;
                    // pick next non-empty as client, and a short token as sucursal if present
                    for (let v of vals) {
                        if (!v) continue;
                        const low = v.toLowerCase();
                        if (!candidateClient && brandTokens.some(bt => low.includes(bt))) candidateClient = v;
                    }
                    // find short token
                    for (let v of vals) {
                        if (!v) continue;
                        if (/^\d+$/.test(v) || /^[A-Z0-9\.\-]{1,6}$/.test(v) || /lyon|mall|plaza|centro|store|branch/i.test(v)) { candidateSucursal = v; break; }
                    }
                } else {
                    Object.keys(sourceRow).forEach(k => {
                        try {
                            const v = sourceRow[k]; if (!v && v !== 0) return;
                            const s = String(v).trim(); if (!s) return;
                            const low = s.toLowerCase();
                            if (!candidateClient && brandTokens.some(bt => low.includes(bt))) candidateClient = s;
                            if (!candidateSucursal && (/^\d+$/.test(s) || /^[A-Z0-9\.\-]{1,6}$/.test(s) || /lyon|mall|plaza|centro|store|branch/i.test(s))) candidateSucursal = s;
                        } catch(e){}
                    });
                }
            }

            // if no candidateClient found yet, search any orig row values for multi-word names near the code
            if (!candidateClient && Array.isArray(origAlias)) {
                for (let rr of origAlias) {
                    try {
                        const vals = Object.values(rr||{}).map(v=>String(v||'').trim());
                        if (vals.some(v=>v.toLowerCase().includes(code.toLowerCase()))) {
                            for (let v of vals) {
                                const words = v.split(/\s+/).filter(Boolean).length;
                                if (words >= 2 && v.length > 4 && !/^\d+$/.test(v)) { candidateClient = v; break; }
                            }
                            if (candidateClient) break;
                        }
                    } catch(e){}
                }
            }

            // final fallback: check within the row r for multi-word values
            if (!candidateClient) {
                for (let k of Object.keys(r)) {
                    try {
                        const v = r[k]; if (!v) continue;
                        const s = String(v).trim(); const words = s.split(/\s+/).filter(Boolean).length;
                        if (words >= 2 && s.length > 4 && !/^\d+$/.test(s)) { candidateClient = s; break; }
                    } catch(e){}
                }
            }

            // Aplicar mapeo determinista si existe
            try {
                const key = (code||'').toString().trim().toUpperCase();
                if (CODE_MAP[key]) {
                    copy.cliente = CODE_MAP[key].cliente;
                    copy.sucursal = CODE_MAP[key].sucursal || copy.sucursal;
                    console.log('applyAutoCodeMapping: applied CODE_MAP for', key, CODE_MAP[key]);
                } else {
                    if (candidateClient) copy.cliente = candidateClient;
                    if (candidateSucursal) copy.sucursal = candidateSucursal;
                }
            } catch(e) { /* ignore */ }

            // Recalcular campos numéricos básicos por seguridad (totem/tv_* etc.)
            try {
                const numKeys = ['totem','tvbox','tv_32','tv_40','tv_43','tv_50','tv_55','tv_65','tv_cliente','tv_carteleria_digital','soporte_brazo','carcasa_ap','cant_totem'];
                numKeys.forEach(k => {
                    if (copy[k] === undefined || copy[k] === null) copy[k] = 0;
                    if (typeof copy[k] === 'string') copy[k] = parseInt(copy[k].replace(/[^0-9\-]/g,'')) || 0;
                    if (typeof copy[k] !== 'number') copy[k] = Number(copy[k]) || 0;
                });
            } catch(e) {}

            return copy;
        } catch (e) { return r; }
    });
}

// Corrige filas ya guardadas en localStorage usando CODE_MAP (o mapping pasado)
function fixImportedRowsInStorage(mapping) {
    try {
        const persistent = mapping || (function(){ try { return JSON.parse(localStorage.getItem('factora_code_map')||'{}'); } catch(e) { return {}; } })() || {};
        const stored = localStorage.getItem('factora_solicitudes');
        if (!stored) return { updated: 0 };
        let arr = JSON.parse(stored || '[]');
        let updated = 0;
        arr = arr.map(s => {
            try {
                if (!s || !s.codigo) return s;
                const key = String(s.codigo||'').trim().toUpperCase();
                if (persistent[key]) {
                    s.cliente = persistent[key].cliente;
                    s.sucursal = persistent[key].sucursal || s.sucursal;
                    // recalcular equipos si el objeto existe o si están en campos planos
                    s.equipos = s.equipos || {};
                    const keys = ['totem','tvbox','tv_32','tv_40','tv_43','tv_50','tv_55','tv_65','tv_cliente','tv_carteleria_digital','soporte_brazo','carcasa_ap','cant_totem'];
                    keys.forEach(k => {
                        let v = (s.equipos && s.equipos[k]) || s[k] || 0;
                        if (typeof v === 'string') v = parseInt(v.replace(/[^0-9\-]/g,'')) || 0;
                        v = Number(v) || 0;
                        if (k === 'cant_totem') s.equipos['totem'] = (s.equipos['totem'] || 0) + v;
                        else s.equipos[k] = v;
                    });
                    updated++;
                }
                return s;
            } catch(e) { return s; }
        });
        localStorage.setItem('factora_solicitudes', JSON.stringify(arr));
        // actualizar in-memory
        solicitudes = (arr || []).map(sanitizeSolicitud);
        try { window.mappedImportedData = window.mappedImportedData || []; } catch(e){}
        renderSolicitudes(); updateStats();
        return { updated };
    } catch(e) { console.warn('fixImportedRowsInStorage failed', e); return { updated: 0, error: String(e) }; }
}

// Exponer utilidad para consola
try { window.fixImportedRowsInStorage = fixImportedRowsInStorage; } catch(e) {}

// Guardar/actualizar mapa de códigos en localStorage y exponer utilidades
function setCodeMap(obj) {
    try {
        if (!obj || typeof obj !== 'object') throw new Error('map debe ser un objeto');
        window.__CODE_MAP__ = Object.assign({}, window.__CODE_MAP__ || {}, obj);
        localStorage.setItem('factora_code_map', JSON.stringify(window.__CODE_MAP__));
        return window.__CODE_MAP__;
    } catch(e) { console.warn('setCodeMap failed', e); return null; }
}

function addCodeMapEntry(code, cliente, sucursal) {
    try {
        if (!code) throw new Error('code required');
        const key = String(code).trim().toUpperCase();
        const map = window.__CODE_MAP__ || JSON.parse(localStorage.getItem('factora_code_map')||'{}') || {};
        map[key] = { cliente: String(cliente||'').trim(), sucursal: String(sucursal||'').trim() };
        window.__CODE_MAP__ = map;
        localStorage.setItem('factora_code_map', JSON.stringify(map));
        return map[key];
    } catch(e) { console.warn('addCodeMapEntry failed', e); return null; }
}

function loadCodeMapFromFile(file, cb) {
    try {
        if (!file) throw new Error('file required');
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const txt = e.target.result || '';
                const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
                const map = {};
                // esperar encabezado codigo,cliente,sucursal o sin encabezado
                for (let i = 0; i < lines.length; i++) {
                    const parts = lines[i].split(',').map(p=>p.trim());
                    if (parts.length < 2) continue;
                    // si primera fila parece header, omitir
                    if (i === 0 && /codigo/i.test(parts[0]) && /cliente/i.test(parts[1])) continue;
                    const key = String(parts[0]||'').toUpperCase();
                    const cliente = parts[1] || '';
                    const sucursal = parts[2] || '';
                    if (key) map[key] = { cliente: cliente, sucursal: sucursal };
                }
                setCodeMap(map);
                if (typeof cb === 'function') cb(null, map);
            } catch(err) { if (typeof cb === 'function') cb(err); }
        };
        reader.onerror = function(err) { if (typeof cb === 'function') cb(err); };
        reader.readAsText(file, 'utf-8');
    } catch(e) { if (typeof cb === 'function') cb(e); }
}

try { window.setCodeMap = setCodeMap; window.addCodeMapEntry = addCodeMapEntry; window.loadCodeMapFromFile = loadCodeMapFromFile; } catch(e) {}

// Aplicar mapeo por código a filas filtradas en memoria
function applyCodeMapToRows(code) {
    try {
        if (!code) throw new Error('code requerido');
        const key = String(code).trim().toUpperCase();
        const map = window.__CODE_MAP__ || JSON.parse(localStorage.getItem('factora_code_map')||'{}') || {};
        const entry = map[key];
        if (!entry) return { updated: 0, error: 'no mapping for ' + key };
        const rows = window.mappedImportedData || importedData || window.rawImportedData || [];
        let updated = 0;
        const newRows = (rows||[]).map(r => {
            try {
                if (!r || String(r.codigo||'').trim().toUpperCase() !== key) return r;
                r.cliente = entry.cliente;
                r.sucursal = entry.sucursal || r.sucursal;
                // finalizar fila: conservar solo campos solicitados y recalcular equipos
                const fin = finalizeImportedRow(r);
                updated++;
                return fin;
            } catch(e) { return r; }
        });
        // persistir en variables globales para UI
        try { window.mappedImportedData = newRows; importedData = newRows; window.rawImportedData = newRows; } catch(e){}
        return { updated };
    } catch(e) { return { updated: 0, error: String(e) }; }
}

// Aplicar todo el mapa a todas las filas en memoria
function applyCodeMapToAll() {
    try {
        const map = window.__CODE_MAP__ || JSON.parse(localStorage.getItem('factora_code_map')||'{}') || {};
        const rows = window.mappedImportedData || importedData || window.rawImportedData || [];
        let updated = 0;
        const newRows = (rows||[]).map(r => {
            try {
                const key = String(r.codigo||'').trim().toUpperCase();
                if (map[key]) {
                    const fin = finalizeImportedRow(Object.assign({}, r, { cliente: map[key].cliente, sucursal: map[key].sucursal || r.sucursal }));
                    updated++;
                    return fin;
                }
                return r;
            } catch(e) { return r; }
        });
        try { window.mappedImportedData = newRows; importedData = newRows; window.rawImportedData = newRows; } catch(e){}
        return { updated };
    } catch(e) { return { updated: 0, error: String(e) }; }
}

// Aplicar mapa persistente en localStorage a los registros almacenados (filtrar por code opcional)
function applyCodeMapToStorage(code) {
    try {
        const map = window.__CODE_MAP__ || JSON.parse(localStorage.getItem('factora_code_map')||'{}') || {};
        const stored = localStorage.getItem('factora_solicitudes');
        if (!stored) return { updated: 0 };
        let arr = JSON.parse(stored || '[]');
        let updated = 0;
        arr = arr.map(s => {
            try {
                if (!s || !s.codigo) return s;
                const key = String(s.codigo||'').trim().toUpperCase();
                if (code && String(code).trim().toUpperCase() !== key) return s;
                if (!map[key]) return s;
                const merged = Object.assign({}, s, { cliente: map[key].cliente, sucursal: map[key].sucursal || s.sucursal });
                const fin = finalizeImportedRow(merged);
                updated++;
                return fin;
            } catch(e) { return s; }
        });
        localStorage.setItem('factora_solicitudes', JSON.stringify(arr));
        solicitudes = (arr || []).map(sanitizeSolicitud);
        renderSolicitudes(); updateStats();
        return { updated };
    } catch(e) { return { updated: 0, error: String(e) }; }
}

try { window.applyCodeMapToRows = applyCodeMapToRows; window.applyCodeMapToAll = applyCodeMapToAll; window.applyCodeMapToStorage = applyCodeMapToStorage; } catch(e) {}

// Devuelve filas inválidas (faltan codigo, cliente o sucursal) de los datos mapeados en memoria
function getInvalidRows() {
    try {
        const rows = window.mappedImportedData || importedData || window.rawImportedData || [];
        const invalid = (rows || []).filter(r => {
            try { return !(r && r.codigo && r.cliente && r.sucursal); } catch(e){ return false; }
        }).map(r => {
            const copy = Object.assign({}, r);
            copy._invalid_reason = (!r.codigo ? 'codigo_missing' : '') + (!r.cliente ? (',cliente_missing') : '') + (!r.sucursal ? (',sucursal_missing') : '');
            return copy;
        });
        return invalid;
    } catch(e) { return []; }
}

// Descargar un arreglo de objetos como CSV
function downloadCSV(objects, filename) {
    try {
        if (!objects || objects.length === 0) return;
        const keys = Object.keys(objects[0]);
        const lines = [keys.join(',')];
        objects.forEach(o => {
            const row = keys.map(k => {
                const v = o[k] === undefined || o[k] === null ? '' : String(o[k]);
                // escapar comillas y comas
                if (v.includes(',') || v.includes('"') || v.includes('\n')) return '"' + v.replace(/"/g,'""') + '"';
                return v;
            }).join(',');
            lines.push(row);
        });
        const csv = lines.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'export.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch(e) { console.warn('downloadCSV failed', e); }
}

try { window.getInvalidRows = getInvalidRows; window.downloadCSV = downloadCSV; } catch(e) {}

// Diagnóstico y corrección rápida de datos importados
function diagnoseImportOptions(opts) {
    const o = Object.assign({ fix: false, saveMode: 'append', dedupe: false }, opts || {});
    try {
        const mapped = window.mappedImportedData || importedData || window.rawImportedData || [];
        const storedRaw = localStorage.getItem('factora_solicitudes');
        let stored = [];
        try { stored = JSON.parse(storedRaw || '[]'); } catch(e) { stored = []; }
        console.log('diagnoseImport: mappedImportedData count=', (mapped||[]).length, 'localStorage count=', stored.length);
        console.log('sample mapped (3):', (mapped||[]).slice(0,3));
        console.log('sample storage (3):', stored.slice(0,3));
        const invalidMapped = (mapped||[]).filter(r=> !(r && r.codigo && r.cliente && r.sucursal));
        console.log('diagnoseImport: invalid in mappedImportedData=', invalidMapped.length);

        if (!o.fix) return { mappedCount: (mapped||[]).length, storedCount: stored.length, invalidMapped: invalidMapped.length };

        // fix: re-finalize mapped rows and save
        const finalRows = (mapped||[]).map(r=> {
            try {
                if (window.InventarioImporter && typeof window.InventarioImporter.finalizeImportedRow === 'function') return window.InventarioImporter.finalizeImportedRow(r);
                return finalizeImportedRow(r);
            } catch(e) { return finalizeImportedRow(r); }
        });

        let toPersist = [];
        if (o.saveMode === 'replace') {
            toPersist = finalRows;
        } else {
            toPersist = stored.concat(finalRows);
        }

        if (o.dedupe) {
            const byCode = {};
            for (let i=0;i<toPersist.length;i++){
                const it = toPersist[i]; if (!it || !it.codigo) continue; byCode[String(it.codigo).trim()] = it;
            }
            toPersist = Object.keys(byCode).map(k=> byCode[k]);
        }

        try { localStorage.setItem('factora_solicitudes', JSON.stringify(toPersist)); } catch(e) { console.warn('diagnoseImport: save failed', e); }
        // refresh in-memory
        loadSolicitudesFromStorage(); renderSolicitudes(); updateStats();
        console.log('diagnoseImport: fix applied. persisted=', toPersist.length);
        return { fixed: true, persisted: toPersist.length };
    } catch(e) { console.error('diagnoseImport error', e); return { error: String(e) }; }
}

try { window.diagnoseImport = diagnoseImportOptions; } catch(e) {}

// Intentar aplicar el mejor mapeo posible automáticamente.
// Retorna true si aplicó un mapeo que produjo filas válidas (>0)
function autoApplyBestMapping() {
    const rawAliased = window.rawAliased || [];
    const rawNormalizedData = window.rawNormalizedData || [];
    const arrays = window.rawArrays || null;

    // Strategy 1: alias map sobre encabezados detectados
    if (rawAliased && rawAliased.length > 0) {
        const first = rawAliased[0];
        const mapping = {};
        Object.keys(first).forEach(k => {
            const nk = normalizeHeaderKey(k);
            const ali = HEADER_ALIAS_MAP[nk] || null;
            if (ali) mapping[nk] = ali;
        });
        if (Object.keys(mapping).length > 0) {
            console.log('autoApplyBestMapping: trying alias mapping', mapping);
            const mapped = applyMappingToObjects(mapping, rawAliased);
            // limpieza y coerción similar a applyHeaderMapping
            const cleaned = mapped.map(row => {
                const nr = {};
                Object.keys(row).forEach(k => {
                    let v = row[k];
                    if (v === null || v === undefined) v = '';
                    if (typeof v === 'string') v = v.trim();
                    if (/^#?N\/?A$/i.test(v) || /^n\.?a\.?$/i.test(v) || v === '-' || v === '--') v = '';
                    nr[k] = v;
                });
                return nr;
            });
            const coerced = cleaned.map(m => pickRowFields(m));
            const valid = coerced.filter(r => r.codigo && r.cliente && r.sucursal);
            if (coerced.length > 0) {
                window.mappedImportedData = coerced;
                try { importedData = coerced; } catch (e) { window.importedData = coerced; }
                console.log('autoApplyBestMapping: alias mapping result, valid=', valid.length, 'total=', coerced.length);
                showPreview(valid, coerced.length - valid.length, coerced.filter(r => !(r.codigo && r.cliente && r.sucursal)).slice(0,5));
                const btn = document.getElementById('btnProcessImport'); if (btn) { btn.style.display = 'block'; btn.disabled = false; }
                return true;
            }
        }
    }

    // Strategy 2: if arrays available, use inferColumnMapping
    if (arrays && arrays.length > 0) {
        console.log('autoApplyBestMapping: attempting inferColumnMapping on arrays');
        const mapRes = inferColumnMapping(arrays);
        const mapping = mapRes.mapping || {};
        const headerUsed = !!mapRes.headerUsed;
        if (Object.keys(mapping).length > 0) {
            const built = buildRowsFromArrays(arrays, mapping, headerUsed);
            const cleaned = built.map(r => {
                const nr = {};
                Object.keys(r).forEach(k => {
                    let v = r[k];
                    if (v === null || v === undefined) v = '';
                    if (typeof v === 'string') v = v.trim();
                    if (/^#?N\/?A$/i.test(v) || /^n\.?a\.?$/i.test(v) || v === '-' || v === '--') v = '';
                    nr[k] = v;
                });
                return nr;
            });
            const coerced = cleaned.map(m => pickRowFields(m));
            const valid = coerced.filter(r => r.codigo && r.cliente && r.sucursal);
            if (coerced.length > 0) {
                window.mappedImportedData = coerced;
                try { importedData = coerced; } catch (e) { window.importedData = coerced; }
                console.log('autoApplyBestMapping: inferColumnMapping result, valid=', valid.length, 'total=', coerced.length);
                showPreview(valid, coerced.length - valid.length, coerced.filter(r => !(r.codigo && r.cliente && r.sucursal)).slice(0,5));
                const btn = document.getElementById('btnProcessImport'); if (btn) { btn.style.display = 'block'; btn.disabled = false; }
                return true;
            }
        }
    }

    // Strategy 3: map by position (if arrays exist)
    if (arrays && arrays.length > 0) {
        console.log('autoApplyBestMapping: attempting map by position');
        // decide if first row is header
        const first = arrays[0] || [];
        const headerLikely = first.some(cell => /[A-Za-z\u00C0-\u017F]/.test(cell));
        const positionMap = {0:'codigo',1:'cliente',2:'sucursal',3:'tipo_solicitud',4:'tecnico',5:'fecha_instalacion',6:'totem',7:'tv_43',8:'tv_55',9:'tvbox',10:'soporte_brazo',11:'carcasa_ap'};
        const built = buildRowsFromArrays(arrays, positionMap, headerLikely);
        const cleaned = built.map(r => {
            const nr = {};
            Object.keys(r).forEach(k => {
                let v = r[k];
                if (v === null || v === undefined) v = '';
                if (typeof v === 'string') v = v.trim();
                if (/^#?N\/?A$/i.test(v) || /^n\.?a\.?/i.test(v) || v === '-' || v === '--') v = '';
                nr[k] = v;
            });
            return nr;
        });
        const coerced = cleaned.map(m => pickRowFields(m));
        const valid = coerced.filter(r => r.codigo && r.cliente && r.sucursal);
        if (coerced.length > 0) {
            window.mappedImportedData = coerced;
            try { importedData = coerced; } catch (e) { window.importedData = coerced; }
            console.log('autoApplyBestMapping: mapByPosition result, valid=', valid.length, 'total=', coerced.length);
            showPreview(valid, coerced.length - valid.length, coerced.filter(r => !(r.codigo && r.cliente && r.sucursal)).slice(0,5));
            const btn = document.getElementById('btnProcessImport'); if (btn) { btn.style.display = 'block'; btn.disabled = false; }
            return true;
        }
    }

    // Strategy 4: try shifted position mappings to handle misaligned columns
    if (arrays && arrays.length > 0) {
        console.log('autoApplyBestMapping: attempting shifted position mappings');
        const maxShift = 4;
        let best = {shift: 0, valid: 0, coerced: null};
        for (let s = -maxShift; s <= maxShift; s++) {
            const positionMapShifted = {};
            // For each possible column index in first row, map to field index = idx - s
            const maxCols = Math.max(...arrays.map(r => r.length));
            for (let c = 0; c < maxCols; c++) {
                const fieldIndex = c - s;
                const field = {
                    0:'codigo',1:'cliente',2:'sucursal',3:'tipo_solicitud',4:'tecnico',5:'fecha_instalacion',6:'totem',7:'tv_43',8:'tv_55',9:'tvbox',10:'soporte_brazo',11:'carcasa_ap'
                }[fieldIndex];
                if (field) positionMapShifted[c] = field;
            }
            const headerLikely = (arrays[0]||[]).some(cell => /[A-Za-z\u00C0-\u017F]/.test(cell));
            const built = buildRowsFromArrays(arrays, positionMapShifted, headerLikely);
            const cleaned = built.map(r => {
                const nr = {};
                Object.keys(r).forEach(k => {
                    let v = r[k];
                    if (v === null || v === undefined) v = '';
                    if (typeof v === 'string') v = v.trim();
                    if (/^#?N\/?A$/i.test(v) || /^n\.?a\.?$/i.test(v) || v === '-' || v === '--') v = '';
                    nr[k] = v;
                });
                return nr;
            });
            const coerced = cleaned.map(m => pickRowFields(m));
            const valid = coerced.filter(r => r.codigo && r.cliente && r.sucursal);
            if (valid.length > best.valid) {
                best = { shift: s, valid: valid.length, coerced: coerced };
            }
        }
        if (best.coerced && best.coerced.length > 0) {
            window.mappedImportedData = best.coerced;
            try { importedData = best.coerced; } catch(e) { window.importedData = best.coerced; }
            console.log('autoApplyBestMapping: shifted mapping result with shift', best.shift, 'valid=', best.valid, 'total=', best.coerced.length);
            showPreview(best.coerced.filter(r => r.codigo && r.cliente && r.sucursal), best.coerced.length - best.valid, best.coerced.filter(r => !(r.codigo && r.cliente && r.sucursal)).slice(0,5));
            const btn = document.getElementById('btnProcessImport'); if (btn) { btn.style.display = 'block'; btn.disabled = false; }
            return true;
        }
    }

    console.log('autoApplyBestMapping: no automatic mapping produced valid rows');
    return false;
}

// Procesar importación
async function processImport() {
    console.log('processImport called');
    // seleccionar origen de datos: preferir window.importedData o window.mappedImportedData
    let rows = window.importedData || window.mappedImportedData || window.rawImportedData || importedData || [];
    if (!rows || rows.length === 0) {
        showNotification('No hay datos para importar', 'danger');
        return;
    }

    // Intentar reparar filas con columnas desplazadas o valores mal ubicados
    try {
        if (typeof repairImportedRows === 'function') {
            console.log('processImport: running repairImportedRows on', rows.length, 'rows');
            rows = repairImportedRows(rows);
            // mantener sincronía con las variables globales usadas por otras partes
            try { importedData = rows; window.mappedImportedData = rows; window.rawImportedData = rows; } catch(e) {}
        }
    } catch (e) { console.warn('processImport: repairImportedRows failed', e); }

    // Aplicar mapeo por código automáticamente (p.ej. PC###)
    try {
        if (typeof applyAutoCodeMapping === 'function') {
            console.log('processImport: applying automatic code mapping for PC codes');
            const after = applyAutoCodeMapping(rows);
            if (after && Array.isArray(after)) {
                rows = after;
                try { importedData = rows; window.mappedImportedData = rows; window.rawImportedData = rows; } catch(e) {}
            }
        }
    } catch (e) { console.warn('processImport: applyAutoCodeMapping failed', e); }

    const resultDiv = document.getElementById('import-result');
    const messageDiv = document.getElementById('result-message');
    if (resultDiv) resultDiv.style.display = 'none';

    let importedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Preparar caches (no bloquear si el endpoint falla)
    try {
        await fetchClients();
    } catch (e) {
        console.warn('processImport: fetchClients failed, continuing with empty cache', e);
        _cachedClients = [];
    }

    // Ocultar mapeador y preview al iniciar la importación
    try { document.getElementById('import-mapper').style.display = 'none'; } catch(e) {}
    try { document.getElementById('import-preview').style.display = 'none'; } catch(e) {}

    const btn = document.getElementById('btnProcessImport');
    if (btn) { btn.disabled = true; }

    try {
        for (let i = 0; i < rows.length; i++) {
            const raw = rows[i] || {};
            const row = pickRowFields(raw);


            // Si falta código, generar uno temporal único
            if (!row.codigo || String(row.codigo).trim() === '') {
                row.codigo = `IMP-${Date.now()}-${i+1}`;
            }

            try {
                // Resolver/crear cliente solo si hay valor de cliente; si no, dejar en blanco y no intentar crear
                let clientes = await fetchClients();
                let cliente = null; let clienteId = null;
                const clienteVal = (row.cliente || '').toString().trim();
                if (clienteVal) {
                    if (/^[0-9]+$/.test(String(clienteVal))) {
                        cliente = clientes.find(c => String(c.id) === String(clienteVal));
                        if (cliente) { clienteId = cliente.id; row.cliente = cliente.nombre; }
                    }
                    if (!cliente) {
                        cliente = clientes.find(c => c.nombre && c.nombre.toLowerCase() === clienteVal.toLowerCase());
                        if (cliente) clienteId = cliente.id;
                    }
                    if (!clienteId) {
                        if (_failedClientCreates.has(clienteVal)) {
                            // Evitar reintentos para nombres ya fallidos
                            console.log('Skipping createClientByName for', clienteVal, '— previous attempts failed');
                        } else {
                            try {
                                clienteId = await createClientByName(clienteVal);
                            } catch(e) {
                                console.warn('No se pudo crear cliente:', e);
                                // si la llamada devolvió 404 u otro error, no volver a intentarlo
                                try { _failedClientCreates.add(clienteVal); } catch(err){ }
                            }
                        }
                    }
                } else {
                    // dejar cliente vacío y clienteId null
                    row.cliente = '';
                    clienteId = null;
                }

                // Sucursal (crear si no existe y si tenemos clienteId)
                let sucursalId = null;
                try {
                    if (clienteId) {
                        const sucursales = await fetchSucursales(clienteId);
                        const suc = sucursales.find(s => s.nombre && s.nombre.toString().toLowerCase() === String(row.sucursal || '').toLowerCase());
                        if (suc) sucursalId = suc.id;
                        else if (row.sucursal && String(row.sucursal).trim() !== '') {
                            sucursalId = await createSucursal(clienteId, row.sucursal);
                        }
                    }
                } catch (e) {
                    console.warn('Sucursal create/fetch error', e);
                }

                // Calcular equipos: sumar llaves relevantes
                const equipos = {
                    totem: parseInt(row.totem) || 0,
                    tvbox: parseInt(row.tvbox) || 0,
                    tv_32: parseInt(row.tv_32) || 0,
                    tv_40: parseInt(row.tv_40) || 0,
                    tv_43: parseInt(row.tv_43) || 0,
                    tv_50: parseInt(row.tv_50) || 0,
                    tv_55: parseInt(row.tv_55) || 0,
                    tv_65: parseInt(row.tv_65) || 0,
                    tv_cliente: parseInt(row.tv_cliente) || 0,
                    tv_carteleria_digital: parseInt(row.tv_carteleria_digital) || 0,
                    soporte_brazo: parseInt(row.soporte_brazo) || 0,
                    carcasa_ap: parseInt(row.carcasa_ap) || 0
                };

                // Payload backend
                const payload = {
                    codigo_solicitud: row.codigo,
                    cliente_id: clienteId,
                    sucursal_id: sucursalId,
                    tipo_solicitud: mapTipoToBackend(row.tipo_solicitud || row.tipo || 'Instalación'),
                    plataforma: row.plataforma || '',
                    mes: null,
                    anio: null,
                    observaciones: row.observaciones || ''
                };

                // Construir registro local para mostrar inmediatamente
                const solicitudLocal = {
                    codigo: row.codigo,
                    cliente: row.cliente,
                    sucursal: row.sucursal || '',
                    tipo_solicitud: (row.tipo_solicitud && row.tipo_solicitud.toString()) || (row.tipo && row.tipo.toString()) || 'Instalación',
                    estado: row.estado || 'Pendiente',
                    tecnico: row.tecnico || '',
                    fecha_instalacion: row.fecha_instalacion || null,
                    equipos: equipos,
                    _synced: false
                };

                if (SYNC_TO_BACKEND) {
                    try {
                        const res = await createSolicitudApi(payload);
                        if (res && res.success && (res.id || res.data || res.solicitud)) {
                            // si backend devuelve el objeto, usarlo; sino marcar como synced
                            solicitudLocal._synced = true;
                            if (res.solicitud) {
                                // usar estructura devuelta por backend si está
                                solicitudes.push(res.solicitud);
                            } else if (res.data) {
                                solicitudes.push(res.data);
                            } else {
                                solicitudLocal._imported = true;
                                solicitudes.push(solicitudLocal);
                            }
                            importedCount++;
                        } else {
                            // fallback: guardar localmente
                            solicitudLocal._imported = true;
                            solicitudes.push(solicitudLocal);
                            errorCount += (res && res.success) ? 0 : 0;
                            importedCount++;
                        }
                    } catch (e) {
                        solicitudLocal._imported = true;
                        solicitudes.push(solicitudLocal);
                        importedCount++;
                    }
                } else {
                    solicitudLocal._imported = true;
                    solicitudes.push(solicitudLocal);
                    importedCount++;
                }

                // Actualizar UI
                saveSolicitudesToStorage();
                renderSolicitudes();
                updateStats();

            } catch (errRow) {
                errors.push(`Fila ${i+2}: ${errRow && errRow.message ? errRow.message : String(errRow)}`);
                errorCount++;
            }
        }
    } catch (err) {
        console.error('processImport top-level error:', err);
        showNotification('Error al procesar importación: ' + (err && err.message ? err.message : err), 'danger');
    } finally {
        if (btn) { btn.disabled = false; }
    }

    // Mensaje resumen
    let message = `✅ ${importedCount} solicitudes importadas exitosamente.`;
    if (errorCount > 0) {
        message += `<br>⚠️ ${errorCount} registros con errores.`;
        if (errors.length > 0) {
            message += `<br><br><strong>Detalles de errores:</strong><br>`;
            message += errors.slice(0, 20).join('<br>');
            if (errors.length > 20) message += `<br>... y ${errors.length - 20} errores más`;
        }
    }
    if (messageDiv) messageDiv.innerHTML = message;
    if (resultDiv) resultDiv.style.display = 'block';

    // ocultar botón importar
    const btnHide = document.getElementById('btnProcessImport'); if (btnHide) btnHide.style.display = 'none';

    showNotification(`Importación completada: ${importedCount} exitosos, ${errorCount} errores`, importedCount > 0 ? 'success' : 'danger');

    // Al finalizar, asegurarse de ocultar mapeador y preview y refrescar la UI
    try { document.getElementById('import-mapper').style.display = 'none'; } catch(e) {}
    try { document.getElementById('import-preview').style.display = 'none'; } catch(e) {}
    // limpiar variable de import temporal
    try { importedData = []; window.mappedImportedData = []; window.rawImportedData = []; } catch(e) {}

    // Guardar cambios en storage; no recargar la página automáticamente
    try { saveSolicitudesToStorage(); } catch (e) { console.warn('saveSolicitudesToStorage failed', e); }
}

// ===== FUNCIONES PARA VER TEXTO COMPLETO =====
function openFullTextModal(text, title = 'Contenido Completo') {
    // Crear modal si no existe
    let modal = document.getElementById('fullTextModalOverlay');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fullTextModalOverlay';
        modal.className = 'full-text-modal-overlay';
        modal.onclick = (e) => {
            if (e.target === modal) closeFullTextModal();
        };
        
        const modalContent = document.createElement('div');
        modalContent.className = 'full-text-modal';
        
        modalContent.innerHTML = `
            <div class="full-text-modal-header">
                <h3>${escapeHtml(title)}</h3>
                <button class="full-text-modal-close" onclick="closeFullTextModal()">✕</button>
            </div>
            <div class="full-text-modal-content" id="fullTextContent"></div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }
    
    // Cargar contenido
    document.getElementById('fullTextContent').textContent = text;
    modal.classList.add('active');
}

function closeFullTextModal() {
    const modal = document.getElementById('fullTextModalOverlay');
    if (modal) modal.classList.remove('active');
}

// Crear elemento truncado con botón de ver completo
function createTruncatedTextElement(text, maxLength = 50) {
    if (text.length <= maxLength) {
        return text;
    }
    
    const truncated = text.substring(0, maxLength) + '...';
    const buttonId = 'btn-' + Math.random().toString(36).substr(2, 9);
    
    return `
        <span class="truncated-text-wrapper">
            <span class="truncated-text" title="${escapeHtml(text)}">${escapeHtml(truncated)}</span>
            <button class="view-full-text-btn" id="${buttonId}" title="Ver completo">👁️</button>
        </span>
    `.replace(buttonId, buttonId).replace('id="' + buttonId, 'onclick="openFullTextModal(\'' + escapeHtml(text).replace(/'/g, "\\'") + '\')" id="' + buttonId);
}

// Helper para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}
