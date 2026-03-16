// Bodega.js - formato y estilo similar a Inventario.js
// Gestiona listado y acciones básicas de la sección Bodega

// Modal helpers (copiados del estilo de Inventario.js)
function openModalById(id) { const m=document.getElementById(id); if(m) m.classList.add('active'); }
function closeModalById(id) { const m=document.getElementById(id); if(m) m.classList.remove('active'); }

// Fallback para escapeHtml si no se ha cargado la utilidad global desde otro script
if (typeof escapeHtml !== 'function') {
    function escapeHtml(str){
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// Estado local
let bodegaProducts = [];
let currentBodegaPage = 1;
let currentBodegaEditId = null;
// Context for manual entry editing
let currentManualEdit = null; // { category: 'equipos', index: 0 }

// Cargar productos desde la API (misma endpoint que Inventario)
async function loadBodegaProductsFromAPI() {
    // DESACTIVADO: Solo usar datos manuales de los cuadros de entrada
    console.log('⚠️  loadBodegaProductsFromAPI desactivado. Solo se usan datos manuales.');
    bodegaProducts = [];
}

function setupBodegaEventListeners() {
    // IMPORTANTE: NO limpiar localStorage - preservar datos entre sesiones
    // Los datos se cargarán automáticamente desde localStorage en renderManualTables()
    
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    if (prev) prev.addEventListener('click', ()=>{ if(currentBodegaPage>1){ currentBodegaPage--; updateBodegaTable(); } });
    if (next) next.addEventListener('click', ()=>{ const max=Math.ceil(bodegaProducts.length/10)||1; if(currentBodegaPage<max){ currentBodegaPage++; updateBodegaTable(); } });

    const addBtn = document.getElementById('addBodegaBtn'); if(addBtn) addBtn.addEventListener('click',(e)=>{ e.preventDefault(); openModalById('bodegaAddModal'); });
    const clearDates = document.getElementById('clearDatesBtn'); if(clearDates) clearDates.addEventListener('click', ()=>{ document.getElementById('startDate').value=''; document.getElementById('endDate').value=''; console.log('⚠️  Función desactivada - Sistema manual únicamente'); });

    // Manual entry forms (no mezcla con API)
    const formEquipos = document.getElementById('formAddEquipos');
    if (formEquipos) formEquipos.addEventListener('submit', (e)=>{
        e.preventDefault();
        try {
            const code = document.getElementById('equiposCode').value;
            const name = document.getElementById('equiposName').value;
            const qtyRaw = document.getElementById('equiposQty').value;
            const qty = normalizarCantidad(qtyRaw);
            const value = document.getElementById('equiposValue').value;
            
            if (!code) {
                alert('Por favor ingrese el código identificador');
                return;
            }
            if (!name) {
                alert('Por favor ingrese el nombre del equipo');
                return;
            }
            if (!value) {
                alert('Por favor ingrese el valor');
                return;
            }
            
            addManualEntry('equipos', name, qty, value, code);
            closeModalById('addEquiposModal');
            formEquipos.reset();
        } catch(err) {
            console.error('Error en formulario equipos:', err);
            alert('Error: ' + err.message);
        }
    });

    const formMateriales = document.getElementById('formAddMateriales');
    if (formMateriales) formMateriales.addEventListener('submit', (e)=>{
        e.preventDefault();
        try {
            const name = document.getElementById('materialesName').value;
            const qtyRaw = document.getElementById('materialesQty').value;
            const qty = normalizarCantidad(qtyRaw);
            const value = document.getElementById('materialesValue').value;
            
            if (!name) {
                alert('Por favor ingrese el nombre del material');
                return;
            }
            if (!value) {
                alert('Por favor ingrese el valor');
                return;
            }
            
            addManualEntry('materiales', name, qty, value);
            closeModalById('addMaterialesModal');
            formMateriales.reset();
        } catch(err) {
            console.error('Error en formulario materiales:', err);
            alert('Error: ' + err.message);
        }
    });

    const formRepuestos = document.getElementById('formAddRepuestos');
    if (formRepuestos) formRepuestos.addEventListener('submit', (e)=>{
        e.preventDefault();
        try {
            const name = document.getElementById('repuestosName').value;
            const qtyRaw = document.getElementById('repuestosQty').value;
            const qty = normalizarCantidad(qtyRaw);
            const value = document.getElementById('repuestosValue').value;
            
            if (!name) {
                alert('Por favor ingrese el nombre del repuesto');
                return;
            }
            if (!value) {
                alert('Por favor ingrese el valor');
                return;
            }
            
            addManualEntry('repuestos', name, qty, value);
            closeModalById('addRepuestosModal');
            formRepuestos.reset();
        } catch(err) {
            console.error('Error en formulario repuestos:', err);
            alert('Error: ' + err.message);
        }
    });

    // Ensure manual entries are seeded from template if localStorage empty
    seedManualEntriesFromTemplate();
    // Render and sync after listeners are attached
    renderManualTables();
    updateBodegaStats(); // Asegurar que los totales se calculan
    // ⚠️ Sin sincronización automática - solo sistema manual
    console.log('✅ Setup completado - Esperando entradas manuales');
}

// If localStorage has no manual entries, seed from the static template rows present in HTML
// ⚠️ DESACTIVADO - Solo usar sistema manual de entrada
function seedManualEntriesFromTemplate(){
    console.log('⚠️  seedManualEntriesFromTemplate desactivado - Solo sistema manual de entrada');
    return;
}

// Obtener entradas del servidor y sincronizar con localStorage
// ⚠️ DESACTIVADO - Solo usar sistema manual de entrada
async function fetchServerEntriesAndSync(){
    console.log('⚠️  fetchServerEntriesAndSync desactivado - Solo sistema manual de entrada');
    return;
}

function updateBodegaTable() {
    const tbody = document.getElementById('reportTableBody'); if(!tbody) return; tbody.innerHTML = '';
    const perPage = 10; const start=(currentBodegaPage-1)*perPage; const pageData = bodegaProducts.slice(start,start+perPage);
    pageData.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(p.nombre)}</td>
            <td>${escapeHtml(p.unidad)}</td>
            <td>${escapeHtml(p.bodega)}</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>${p.stock}</td>
            <td>$${Number(p.precio||0).toLocaleString()}</td>
            <td>$${((p.precio||0)*p.stock).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
    const pageInfo = document.getElementById('pageInfo'); if(pageInfo) pageInfo.textContent = `Página ${currentBodegaPage} de ${Math.max(1,Math.ceil(bodegaProducts.length/perPage))}`;
}

// Actualizar estadísticas basadas en datos manuales agregados (Equipos, Materiales, Repuestos)
function updateBodegaStatsFromManual(){
    const obj = getManualEntries();
    // Sumar todos los valores de las tres categorías
    const allItems = [...(obj.equipos || []), ...(obj.materiales || []), ...(obj.repuestos || [])];
    const totalValor = allItems.reduce((s, item) => s + (Number(item.value) || 0), 0);
    const totalUnidades = allItems.length; // Cantidad de items agregados
    
    // Actualizar elementos del DOM
    const totalBox = document.getElementById('totalBox'); 
    if(totalBox) totalBox.textContent = 'TOTAL $' + totalValor.toLocaleString();
    
    const totalSalesEl = document.getElementById('totalSales'); 
    if(totalSalesEl) totalSalesEl.textContent = '$' + totalValor.toLocaleString();
    
    const totalUnitsEl = document.getElementById('totalUnits'); 
    if(totalUnitsEl) totalUnitsEl.textContent = totalUnidades + ' items';
}

function updateBodegaStats(){
    try {
        // Combinar datos de API + datos manuales
        const apiTotalValor = bodegaProducts.reduce((s,p)=> {
            const precio = Number(p.precio) || 0;
            const stock = Number(p.stock) || 0;
            return s + (precio * stock);
        }, 0);
        const apiTotalUnidades = bodegaProducts.reduce((s,p)=> s + (Number(p.stock)||0), 0);
        
        // Obtener datos manuales
        const obj = getManualEntries();
        if (!obj) {
            console.warn('⚠️ getManualEntries retornó null/undefined');
            return;
        }
        
        const manualItems = [...(obj.equipos || []), ...(obj.materiales || []), ...(obj.repuestos || [])];
        console.log(`✨ updateBodegaStats - Procesando ${manualItems.length} items manuales`, manualItems);
        
        const manualTotalValor = manualItems.reduce((s, item) => {
            if (!item) return s;
            const qty = Number(item.qty) || 1;
            const val = Number(item.value) || 0;
            const subtotal = qty * val;
            console.log(`   Item: ${item.name || 'sin nombre'}, qty=${qty}, value=${val}, subtotal=${subtotal}`);
            return s + subtotal;
        }, 0);
        
        const manualTotalUnidades = manualItems.reduce((s, item) => s + (Number(item.qty) || 1), 0);
        
        // Combinar totales
        const totalValor = apiTotalValor + manualTotalValor;
        const totalUnidades = apiTotalUnidades + manualTotalUnidades;
        
        console.log(`📊 Actualizar Stats - API: $${apiTotalValor}, Manual: $${manualTotalValor}, Total: $${totalValor}, Unidades: ${totalUnidades}`);
        
        // Actualizar elementos del DOM
        const totalBox = document.getElementById('totalBox'); 
        if(totalBox) {
            const formatted = formatCurrency(totalValor);
            console.log(`   ✅ Actualizando totalBox a: "TOTAL ${formatted}"`);
            totalBox.textContent = 'TOTAL ' + formatted;
        } else {
            console.warn('   ⚠️ No encontré elemento #totalBox');
        }
        
        const totalSalesEl = document.getElementById('totalSales'); 
        if(totalSalesEl) {
            totalSalesEl.textContent = formatCurrency(totalValor);
        }
        
        const totalUnitsEl = document.getElementById('totalUnits'); 
        if(totalUnitsEl) {
            totalUnitsEl.textContent = totalUnidades + ' unidades';
        }
    } catch(err) {
        console.error('❌ Error en updateBodegaStats:', err);
    }
}

// Inicialización Principal - ORDEN CORRECTO PARA RECUPERAR DATOS
document.addEventListener('DOMContentLoaded', ()=>{
    // Inicializar si estamos en la plantilla Bodega (dashboard-container presente)
    if (!document.querySelector('.dashboard-container')) return;
    
    console.log('⏳ Iniciando Bodega...');
    
    // PASO 1: Cargar datos desde localStorage
    const savedData = getManualEntries();
    console.log('📦 Datos cargados desde localStorage:', savedData);
    
    // PASO 2: Renderizar tablas (esto carga los datos guardados)
    renderManualTables();
    
    // PASO 3: Actualizar estadísticas
    updateBodegaStats();
    
    // PASO 4: Configurar event listeners
    setupBodegaEventListeners();
    
    // PASO 5: Mensaje de confirmación
    console.log('✅ Bodega iniciada - Sistema MANUAL de entrada únicamente');
    console.log(`📊 Items cargados: ${Object.values(savedData).reduce((sum, arr) => sum + arr.length, 0)} artículos`);
});

// Exponer para debugging
window.loadBodegaProductsFromAPI = loadBodegaProductsFromAPI;
window.updateBodegaTable = updateBodegaTable;

/* --- Entradas manuales por categoría (persistencia local) --- */

// NOTA IMPORTANTE: cleanLocalStorageIfEmpty() fue ELIMINADA
// Causaba pérdida de datos al borrar localStorage cuando las tablas HTML estaban vacías
// Los datos se preservan correctamente en localStorage entre sesiones

function getManualEntries(){
    try{ return JSON.parse(localStorage.getItem('bodega_manual_entries')||'{"equipos":[],"materiales":[],"repuestos":[]}'); }catch(e){ return {equipos:[],materiales:[],repuestos:[]}; }
}

// Función dedicada para validar y normalizar cantidad (mín: 1, máx: ilimitado)
function normalizarCantidad(inputValue) {
    // Convertir a string primero
    const str = String(inputValue || '').trim();
    
    // Si está vacío, retorna 1
    if (!str) {
        return 1;
    }
    
    // Convertir a número
    const num = parseFloat(str);
    
    // Si no es válido, retorna 1
    if (isNaN(num) || !isFinite(num) || num < 1) {
        return 1;
    }
    
    // Retornar el número tal cual
    return num;
}

function saveManualEntries(obj){ 
    // Validar que obj tiene la estructura correcta
    if (!obj.equipos) obj.equipos = [];
    if (!obj.materiales) obj.materiales = [];
    if (!obj.repuestos) obj.repuestos = [];
    
    const jsonStr = JSON.stringify(obj);
    localStorage.setItem('bodega_manual_entries', jsonStr);
    
    return true;
}
function addManualEntry(category, name, qty, value, code){
    try {
        const quantity = qty || 1;
        const numeric = (value && !isNaN(value)) ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : 0;
        
        const obj = getManualEntries();
        if(!obj[category]) obj[category] = [];
        
        // Agregar código si se proporciona (solo para equipos)
        const entry = {name: name, qty: quantity, value: numeric, server_id: null};
        if (code && category === 'equipos') {
            entry.code = code;
        }
        
        obj[category].push(entry);
        
        if (!saveManualEntries(obj)) {
            alert('Error al guardar en localStorage');
            return;
        }
        
        renderManualTables();
        updateBodegaStats();
        
        const postData = {categoria: category, nombre: name, cantidad: quantity, valor: numeric};
        if (code && category === 'equipos') {
            postData.codigo = code;
        }
        
        fetch('/reportes/api/bodega-entries/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(postData)
        }).catch(e => {});
    } catch(err) {
        console.error('Error en addManualEntry:', err);
        throw err;
    }
}
function deleteManualEntry(category, index){
    const obj = getManualEntries();
    if(!obj[category]) return;
    const item = obj[category][index];
    // Si tiene server_id, intentar borrar en servidor
    (async ()=>{
        let ok=false;
        if(item && item.server_id){
            try{
                const resp = await fetch('/reportes/api/bodega-entries/'+item.server_id+'/', { method: 'DELETE' });
                ok = resp.ok;
            }catch(e){ console.warn('DELETE falló', e); }
        }
        // Siempre eliminar localmente (si falla server, quedará fuera de UI hasta sincronizar)
        obj[category].splice(index,1);
        saveManualEntries(obj);
        renderManualTables();
        updateBodegaStats(); // Actualizar métricas
    })();
}
// Edit existing manual entry: open modal prefilled
function editManualEntry(category, index){
    const obj = getManualEntries();
    const item = (obj[category] && obj[category][index]) ? obj[category][index] : null;
    if(!item) return;
    currentManualEdit = { category: category, index: index };
    if(category === 'equipos'){
        document.getElementById('equiposName').value = item.name;
        document.getElementById('equiposQty').value = item.qty || 1;
        document.getElementById('equiposValue').value = item.value;
        openModalById('addEquiposModal');
    } else if(category === 'materiales'){
        document.getElementById('materialesName').value = item.name;
        document.getElementById('materialesQty').value = item.qty || 1;
        document.getElementById('materialesValue').value = item.value;
        openModalById('addMaterialesModal');
    } else if(category === 'repuestos'){
        document.getElementById('repuestosName').value = item.name;
        document.getElementById('repuestosQty').value = item.qty || 1;
        document.getElementById('repuestosValue').value = item.value;
        openModalById('addRepuestosModal');
    }
}

// Update manual entry (local + server)
async function updateManualEntry(category, index, name, qty, value){
    const obj = getManualEntries();
    if(!obj[category] || !obj[category][index]) return;
    const item = obj[category][index];
    
    // Normalizar cantidad - permitir números decimales y grandes
    let quantity = parseFloat(qty) || 1;
    if(quantity < 0.1) quantity = 1;
    quantity = Math.round(quantity * 100) / 100; // Redondear a 2 decimales
    
    // validate/parse value
    let numeric = null;
    if (typeof value === 'number') numeric = value;
    else if (typeof value === 'string'){
        const cleaned = value.replace(/[^0-9\-.,]/g, '').replace(/\./g, '').replace(/,/g, '.');
        numeric = parseFloat(cleaned);
    }
    if (!isFinite(numeric) || numeric === null) { alert('Valor inválido.'); return; }

    // If has server_id try PUT
    if(item && item.server_id){
        try{
            const resp = await fetch('/reportes/api/bodega-entries/'+item.server_id+'/', {
                method: 'PUT',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ categoria: category, nombre: name, valor: Number(numeric), cantidad: quantity })
            });
            if(resp.ok){ const data = await resp.json(); if(data && data.result){ item.name = data.result.nombre || name; item.qty = data.result.cantidad || quantity; item.value = data.result.valor || Number(numeric); item.server_id = data.result.id || item.server_id; }
            }
        }catch(e){ console.warn('updateManualEntry server PUT failed', e); }
    } else {
        // local-only entry: update fields
        item.name = name; item.qty = quantity; item.value = Number(numeric);
    }
    obj[category][index] = item;
    saveManualEntries(obj);
    renderManualTables();
    updateBodegaStats(); // Actualizar métricas
}

// Formateo de moneda con símbolo y separador de miles (Pesos Chilenos)
function formatCurrency(value){
    try{ 
        return '$' + Number(value).toLocaleString('es-CL', {maximumFractionDigits: 0, minimumFractionDigits: 0}); 
    }catch(e){ 
        return String(value); 
    }
}

// Ajustar renderizado para mostrar valores formateados con emojis

function renderManualTables(){
    const obj = getManualEntries();
    const equiposBody = document.getElementById('equiposBody');
    const matBody = document.getElementById('materialesBody');
    const repBody = document.getElementById('repuestosBody');
    
    // Renderizar Equipos (con código)
    if(equiposBody){ 
        equiposBody.innerHTML = ''; 
        obj.equipos.forEach((it,i)=>{ 
            const tr=document.createElement('tr');
            const codeDisplay = it.code ? `<span style="background:#f0f0f0; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:12px;">${escapeHtml(it.code)}</span>` : '-';
            const totalValue = (Number(it.qty) || 1) * (Number(it.value) || 0);
            tr.innerHTML=`<td>${codeDisplay}</td><td>${escapeHtml(it.name)}</td><td style="text-align:center;">${Number(it.qty) || 1}</td><td style="display:flex; align-items:center; gap:6px;"><span style="flex:1; text-align:center;">${formatCurrency(totalValue)}</span> <button class="btn-link" onclick="editManualEntry('equipos',${i})" style="font-size:16px; margin:0 2px;">✏️</button> <button class="btn-link" onclick="deleteManualEntry('equipos',${i})" style="font-size:16px; color:#ef4444; margin:0 2px;">❌</button></td>`; 
            equiposBody.appendChild(tr); 
        }); 
    }
    
    // Renderizar Materiales
    if(matBody){ 
        matBody.innerHTML = ''; 
        obj.materiales.forEach((it,i)=>{ 
            const tr=document.createElement('tr'); 
            const totalValue = (Number(it.qty) || 1) * (Number(it.value) || 0);
            tr.innerHTML=`<td>${escapeHtml(it.name)}</td><td style="text-align:center;">${Number(it.qty) || 1}</td><td style="display:flex; align-items:center; gap:6px;"><span style="flex:1; text-align:center;">${formatCurrency(totalValue)}</span> <button class="btn-link" onclick="editManualEntry('materiales',${i})" style="font-size:16px; margin:0 2px;">✏️</button> <button class="btn-link" onclick="deleteManualEntry('materiales',${i})" style="font-size:16px; color:#ef4444; margin:0 2px;">❌</button></td>`; 
            matBody.appendChild(tr); 
        }); 
    }
    
    // Renderizar Repuestos
    if(repBody){ 
        repBody.innerHTML = ''; 
        obj.repuestos.forEach((it,i)=>{ 
            const tr=document.createElement('tr'); 
            const totalValue = (Number(it.qty) || 1) * (Number(it.value) || 0);
            tr.innerHTML=`<td>${escapeHtml(it.name)}</td><td style="text-align:center;">${Number(it.qty) || 1}</td><td style="display:flex; align-items:center; gap:6px;"><span style="flex:1; text-align:center;">${formatCurrency(totalValue)}</span> <button class="btn-link" onclick="editManualEntry('repuestos',${i})" style="font-size:16px; margin:0 2px;">✏️</button> <button class="btn-link" onclick="deleteManualEntry('repuestos',${i})" style="font-size:16px; color:#ef4444; margin:0 2px;">❌</button></td>`; 
            repBody.appendChild(tr); 
        }); 
    }
    
    // Actualizar gráficos después de renderizar
    updateCharts();
}

// Exponer utilidades
window.addManualEntry = addManualEntry;
window.deleteManualEntry = deleteManualEntry;
window.editManualEntry = editManualEntry;
window.updateManualEntry = updateManualEntry;
window.renderManualTables = renderManualTables;
window.updateBodegaStats = updateBodegaStats;
// Funciones de reinicio y limpieza
window.resetBodegaStorage = function() {
    localStorage.removeItem('bodega_manual_entries');
    location.reload();
};

window.resetBodegaCompletamente = async function() {
    if(!confirm('¿Estás seguro de que deseas resetear TODO a 0?\nEsto eliminará todos los equipos, materiales y repuestos ingresados.')) {
        return;
    }
    
    console.log('🔄 === INICIANDO RESETEO COMPLETO ===');
    
    // 0. Establecer flag de reseteo para evitar sincronización
    localStorage.setItem('bodega_reset_flag', 'true');
    localStorage.setItem('bodega_reset_time', Date.now().toString());
    
    // 1. Limpiar TODO el localStorage y sessionStorage
    console.log('💾 Limpiando localStorage y sessionStorage...');
    try {
        for(let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key && key.includes('bodega') && !key.includes('bodega_reset')) {
                localStorage.removeItem(key);
                console.log(`  ✓ Eliminado localStorage: ${key}`);
            }
        }
        for(let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if(key && key.includes('bodega')) {
                sessionStorage.removeItem(key);
                console.log(`  ✓ Eliminado sessionStorage: ${key}`);
            }
        }
        localStorage.removeItem('bodega_manual_entries');
        sessionStorage.removeItem('bodega_manual_entries');
    } catch(e) {
        console.error('Error limpiando almacenamiento:', e);
    }
    
    // 2. Limpiar datos en memoria
    console.log('🧠 Limpiando datos en memoria...');
    bodegaProducts = [];
    
    // 3. Limpiar el DOM manualmente
    console.log('🖥️  Limpiando DOM...');
    const equiposBody = document.getElementById('equiposBody');
    const matBody = document.getElementById('materialesBody');
    const repBody = document.getElementById('repuestosBody');
    
    if(equiposBody) equiposBody.innerHTML = '';
    if(matBody) matBody.innerHTML = '';
    if(repBody) repBody.innerHTML = '';
    
    // 4. Actualizar métricas a 0
    console.log('📊 Reseteando métricas...');
    updateBodegaStats();
    
    // 5. Intentar eliminar del servidor (API)
    console.log('📡 Eliminando datos del servidor...');
    try {
        const resp = await fetch('/reportes/api/bodega-entries/');
        if(resp.ok) {
            const data = await resp.json();
            const entries = data.results || data || [];
            
            console.log(`📋 Encontrados ${entries.length} registros en servidor`);
            
            if(Array.isArray(entries) && entries.length > 0) {
                for(const entry of entries) {
                    try {
                        const deleteResp = await fetch(`/reportes/api/bodega-entries/${entry.id}/`, { 
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        console.log(`  🗑️  ID ${entry.id}: ${deleteResp.ok ? '✓' : '✗ ' + deleteResp.status}`);
                    } catch(delError) {
                        console.error(`  ❌ Error eliminando ID ${entry.id}:`, delError);
                    }
                }
            }
        }
    } catch(e) { 
        console.error('⚠️  Error obteniendo registros del servidor:', e); 
    }
    
    console.log('✅ Reseteo completado. Recargando página...');
    setTimeout(() => {
        location.reload();
    }, 1000);
};

window.debugBodegaData = function() {
    console.log('=== DEBUG BODEGA DATA ===');
    
    // localStorage
    console.log('📦 localStorage bodega_manual_entries:', localStorage.getItem('bodega_manual_entries'));
    
    // sessionStorage
    console.log('📦 sessionStorage bodega_manual_entries:', sessionStorage.getItem('bodega_manual_entries'));
    
    // Parsed data
    console.log('📦 Parsed Local Storage:', getManualEntries());
    
    // bodegaProducts
    console.log('📦 bodegaProducts:', bodegaProducts);
    
    // DOM
    const equiposCount = document.querySelectorAll('#equiposBody tr').length;
    const matCount = document.querySelectorAll('#materialesBody tr').length;
    const repCount = document.querySelectorAll('#repuestosBody tr').length;
    console.log(`📋 DOM - Equipos: ${equiposCount}, Materiales: ${matCount}, Repuestos: ${repCount}`);
    
    // API call
    fetch('/reportes/api/bodega-entries/')
        .then(r => r.json())
        .then(data => console.log('📡 API /reportes/api/bodega-entries/:', data))
        .catch(e => console.error('❌ API error:', e));
};

/* ===== GRÁFICOS PROFESIONALES CON CHART.JS ===== */

let chartCategoryInstance = null;
let chartTrendInstance = null;

function getChartData() {
    const obj = getManualEntries();
    const categories = {
        equipos: obj.equipos || [],
        materiales: obj.materiales || [],
        repuestos: obj.repuestos || []
    };
    
    return {
        equipos: {
            items: categories.equipos,
            totalValue: categories.equipos.reduce((s, i) => s + (i.qty * i.value), 0),
            totalQty: categories.equipos.reduce((s, i) => s + i.qty, 0),
            count: categories.equipos.length
        },
        materiales: {
            items: categories.materiales,
            totalValue: categories.materiales.reduce((s, i) => s + (i.qty * i.value), 0),
            totalQty: categories.materiales.reduce((s, i) => s + i.qty, 0),
            count: categories.materiales.length
        },
        repuestos: {
            items: categories.repuestos,
            totalValue: categories.repuestos.reduce((s, i) => s + (i.qty * i.value), 0),
            totalQty: categories.repuestos.reduce((s, i) => s + i.qty, 0),
            count: categories.repuestos.length
        }
    };
}

function initCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const data = getChartData();
    const labels = ['Equipos', 'Materiales y cables', 'Repuestos'];
    const values = [data.equipos.totalValue, data.materiales.totalValue, data.repuestos.totalValue];
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899'];
    const borderColors = ['#1e40af', '#5b21b6', '#be185d'];
    
    // Destruir gráfico anterior si existe
    if (chartCategoryInstance) {
        chartCategoryInstance.destroy();
    }
    
    chartCategoryInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12, weight: '600' },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = values.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.label}: $${value.toLocaleString('es-CL', {maximumFractionDigits: 0})} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initTrendChart() {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    
    const data = getChartData();
    const labels = ['Equipos', 'Materiales y cables', 'Repuestos'];
    
    const valuesData = [
        data.equipos.totalValue,
        data.materiales.totalValue,
        data.repuestos.totalValue
    ];
    
    const quantityData = [
        data.equipos.totalQty,
        data.materiales.totalQty,
        data.repuestos.totalQty
    ];
    
    // Destruir gráfico anterior si existe
    if (chartTrendInstance) {
        chartTrendInstance.destroy();
    }
    
    chartTrendInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Valor Total ($)',
                    data: valuesData,
                    backgroundColor: '#3b82f6',
                    borderColor: '#1e40af',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y',
                    order: 2
                },
                {
                    label: 'Cantidad (unidades)',
                    data: quantityData,
                    backgroundColor: '#10b981',
                    borderColor: '#047857',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 12, weight: '600' },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'rect'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) {
                                return 'Valor: $' + context.parsed.y.toLocaleString('es-CL', {maximumFractionDigits: 0});
                            } else {
                                return 'Unidades: ' + context.parsed.y;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Valor Total ($)',
                        font: { size: 12, weight: '600' }
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) {
                                return '$' + (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                            return '$' + value;
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Cantidad (unidades)',
                        font: { size: 12, weight: '600' }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function generateAnalysisSummary() {
    const data = getChartData();
    
    const totalValue = data.equipos.totalValue + data.materiales.totalValue + data.repuestos.totalValue;
    const totalQty = data.equipos.totalQty + data.materiales.totalQty + data.repuestos.totalQty;
    
    const analysis = {
        totalValue: totalValue,
        totalQuantity: totalQty,
        totalItems: data.equipos.count + data.materiales.count + data.repuestos.count,
        categories: {
            equipos: {
                value: data.equipos.totalValue,
                qty: data.equipos.totalQty,
                items: data.equipos.count,
                percentage: totalValue > 0 ? ((data.equipos.totalValue / totalValue) * 100).toFixed(1) : 0,
                avgValue: data.equipos.count > 0 ? (data.equipos.totalValue / data.equipos.count).toFixed(0) : 0
            },
            materiales: {
                value: data.materiales.totalValue,
                qty: data.materiales.totalQty,
                items: data.materiales.count,
                percentage: totalValue > 0 ? ((data.materiales.totalValue / totalValue) * 100).toFixed(1) : 0,
                avgValue: data.materiales.count > 0 ? (data.materiales.totalValue / data.materiales.count).toFixed(0) : 0
            },
            repuestos: {
                value: data.repuestos.totalValue,
                qty: data.repuestos.totalQty,
                items: data.repuestos.count,
                percentage: totalValue > 0 ? ((data.repuestos.totalValue / totalValue) * 100).toFixed(1) : 0,
                avgValue: data.repuestos.count > 0 ? (data.repuestos.totalValue / data.repuestos.count).toFixed(0) : 0
            }
        }
    };
    
    // Actualizar panel HTML de análisis
    updateAnalysisPanel(analysis);
    
    // Log análisis en consola
    console.log('%c📊 ANÁLISIS DE BODEGA', 'color: #10b981; font-size: 14px; font-weight: bold;');
    console.log('%cTotal General: $' + totalValue.toLocaleString('es-CL'), 'color: #3b82f6; font-weight: bold;');
    console.log('%cTotal de Unidades: ' + totalQty + ' items', 'color: #8b5cf6; font-weight: bold;');
    console.log('%cTotal de Artículos: ' + analysis.totalItems, 'color: #ec4899; font-weight: bold;');
    
    console.log('%c\n📦 POR CATEGORÍA:', 'color: #f59e0b; font-weight: bold;');
    Object.entries(analysis.categories).forEach(([cat, stats]) => {
        console.log(`%c${cat.toUpperCase()}:`, 'color: #0f172a; font-weight: bold;');
        console.log(`  Valor: $${stats.value.toLocaleString('es-CL')} (${stats.percentage}%)`);
        console.log(`  Cantidad: ${stats.qty} unidades`);
        console.log(`  Artículos: ${stats.items}`);
        console.log(`  Valor Promedio: $${stats.avgValue}`);
    });
    
    return analysis;
}

function updateAnalysisPanel(analysis) {
    // Actualizar panel de Inversión por Categoría
    document.getElementById('equiposAnalysis').textContent = formatCurrency(analysis.categories.equipos.value);
    document.getElementById('equiposPercent').textContent = `(${analysis.categories.equipos.percentage}%)`;
    
    document.getElementById('materialesAnalysis').textContent = formatCurrency(analysis.categories.materiales.value);
    document.getElementById('materialesPercent').textContent = `(${analysis.categories.materiales.percentage}%)`;
    
    document.getElementById('repuestosAnalysis').textContent = formatCurrency(analysis.categories.repuestos.value);
    document.getElementById('repuestosPercent').textContent = `(${analysis.categories.repuestos.percentage}%)`;
    
    // Actualizar panel de Promedio por Categoría
    document.getElementById('equiposAvg').textContent = formatCurrency(analysis.categories.equipos.avgValue);
    document.getElementById('materialesAvg').textContent = formatCurrency(analysis.categories.materiales.avgValue);
    document.getElementById('repuestosAvg').textContent = formatCurrency(analysis.categories.repuestos.avgValue);
    
    // Actualizar panel de Unidades
    document.getElementById('equiposQty').textContent = analysis.categories.equipos.qty;
    document.getElementById('materialesQty').textContent = analysis.categories.materiales.qty;
    document.getElementById('repuestosQty').textContent = analysis.categories.repuestos.qty;
}

function updateCharts() {
    initCategoryChart();
    initTrendChart();
    generateAnalysisSummary();
}

/* ===== DIAGNÓSTICO Y RECUPERACIÓN DE DATOS ===== */

function verificarDatosGuardados() {
    console.log('%c🔍 VERIFICACIÓN DE DATOS GUARDADOS', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
    
    const stored = localStorage.getItem('bodega_manual_entries');
    if (!stored) {
        console.log('%c⚠️  No hay datos en localStorage', 'color: #ef4444; font-weight: bold;');
        return false;
    }
    
    try {
        const data = JSON.parse(stored);
        const totalItems = (data.equipos?.length || 0) + (data.materiales?.length || 0) + (data.repuestos?.length || 0);
        
        console.log('%c✅ localStorage contiene:', 'color: #10b981; font-weight: bold;');
        console.log(`  📦 Equipos: ${data.equipos?.length || 0} items`);
        console.log(`  📦 Materiales: ${data.materiales?.length || 0} items`);
        console.log(`  📦 Repuestos: ${data.repuestos?.length || 0} items`);
        console.log(`  📊 TOTAL: ${totalItems} items`);
        
        if (totalItems > 0) {
            console.log('%c✅ Los datos están seguros en localStorage', 'color: #10b981; font-weight: bold;');
            return true;
        }
    } catch (e) {
        console.error('%c❌ Error al leer localStorage:', 'color: #ef4444;', e);
        return false;
    }
}

function restaurarDatos() {
    console.log('%c📥 RESTAURANDO DATOS DESDE localStorage', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
    
    const data = getManualEntries();
    
    // Contar items
    const equiposCount = data.equipos?.length || 0;
    const materialesCount = data.materiales?.length || 0;
    const repuestosCount = data.repuestos?.length || 0;
    const totalItems = equiposCount + materialesCount + repuestosCount;
    
    if (totalItems === 0) {
        console.log('%c⚠️  No hay datos para restaurar', 'color: #f59e0b;');
        return false;
    }
    
    console.log(`%c📥 Restaurando ${totalItems} items...`, 'color: #f59e0b;');
    
    // Renderizar tablas
    renderManualTables();
    
    // Actualizar stats
    updateBodegaStats();
    
    console.log('%c✅ Datos restaurados exitosamente', 'color: #10b981; font-weight: bold;');
    
    return true;
}

window.verificarDatosGuardados = verificarDatosGuardados;
window.restaurarDatos = restaurarDatos;
function exportReportPDF() {
    console.log('📄 Generando PDF de Bodega...');
    
    const printElement = document.createElement('div');
    printElement.style.padding = '20px';
    printElement.style.backgroundColor = 'white';
    printElement.style.color = 'black';
    printElement.style.fontFamily = 'Arial, sans-serif';
    
    // Título del reporte
    const title = document.createElement('h1');
    title.textContent = 'REPORTE DE BODEGA';
    title.style.textAlign = 'center';
    title.style.marginBottom = '10px';
    title.style.color = '#333';
    title.style.borderBottom = '3px solid #d84315';
    title.style.paddingBottom = '10px';
    title.style.fontSize = '24px';
    printElement.appendChild(title);
    
    // Fecha de generación
    const dateInfo = document.createElement('p');
    dateInfo.textContent = `Fecha de generación: ${new Date().toLocaleString('es-CL')}`;
    dateInfo.style.fontSize = '12px';
    dateInfo.style.marginBottom = '20px';
    dateInfo.style.color = '#666';
    dateInfo.style.textAlign = 'center';
    printElement.appendChild(dateInfo);
    
    // TOTAL BOX
    const totalBox = document.getElementById('totalBox');
    if (totalBox) {
        const totalClone = document.createElement('div');
        totalClone.innerHTML = totalBox.innerHTML;
        totalClone.style.fontSize = '18px';
        totalClone.style.marginBottom = '20px';
        totalClone.style.padding = '15px';
        totalClone.style.fontWeight = 'bold';
        totalClone.style.textAlign = 'center';
        totalClone.style.backgroundColor = '#e9f7ee';
        totalClone.style.border = '2px solid #d84315';
        totalClone.style.borderRadius = '6px';
        printElement.appendChild(totalClone);
    }
    
    // Función auxiliar para formatear tablas
    function formatTable(table) {
        if (!table) return null;
        
        const tableClone = table.cloneNode(true);
        tableClone.style.width = '100%';
        tableClone.style.borderCollapse = 'collapse';
        tableClone.style.fontSize = '11px';
        tableClone.style.marginBottom = '20px';
        
        const rows = tableClone.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            
            // Remover última columna si contiene botones de acciones
            if (cells.length > 0) {
                const lastCell = cells[cells.length - 1];
                const cellText = lastCell.textContent.trim().toLowerCase();
                if (cellText === 'acciones' || cellText === '' || 
                    lastCell.innerHTML.includes('onclick') || 
                    lastCell.innerHTML.includes('<button')) {
                    lastCell.remove();
                }
            }
            
            // Limpiar botones dentro de cualquier celda (especialmente en "Total $")
            row.querySelectorAll('button').forEach(btn => btn.remove());
            
            // Si hay spans con botones junto a valores monetarios, extraer solo el valor
            row.querySelectorAll('td, th').forEach(cell => {
                // Si la celda tiene botones, mantener solo el primer span o valor
                if (cell.querySelector('button')) {
                    const spans = cell.querySelectorAll('span');
                    if (spans.length > 0) {
                        const valueText = spans[0].textContent;
                        cell.textContent = valueText;
                    }
                    cell.querySelectorAll('button').forEach(btn => btn.remove());
                }
            });
            
            // Estilos para filas
            row.style.borderBottom = '1px solid #ccc';
            if (rowIndex === 0) {
                row.style.backgroundColor = '#d84315';
                row.style.color = 'white';
                row.style.fontWeight = 'bold';
            } else {
                row.style.backgroundColor = rowIndex % 2 === 0 ? '#f9f9f9' : 'white';
            }
            
            row.querySelectorAll('td, th').forEach(cell => {
                cell.style.padding = '8px';
                cell.style.textAlign = 'center';
                cell.style.border = '1px solid #ddd';
            });
        });
        
        return tableClone;
    }
    
    // Buscar tablas en los report-card
    const cards = document.querySelectorAll('.report-card');
    console.log(`📊 Encontradas ${cards.length} secciones de reportes`);
    
    let tablesFound = 0;
    cards.forEach((card, index) => {
        const cardTitle = card.querySelector('h3');
        if (cardTitle) {
            const sectionTitle = document.createElement('h2');
            sectionTitle.textContent = cardTitle.textContent;
            sectionTitle.style.fontSize = '16px';
            sectionTitle.style.marginTop = '25px';
            sectionTitle.style.marginBottom = '12px';
            sectionTitle.style.color = '#333';
            sectionTitle.style.borderLeft = '4px solid #d84315';
            sectionTitle.style.paddingLeft = '10px';
            printElement.appendChild(sectionTitle);
        }
        
        const table = card.querySelector('table');
        if (table) {
            const formattedTable = formatTable(table);
            if (formattedTable) {
                printElement.appendChild(formattedTable);
                tablesFound++;
            }
        }
        
        // Agregar salto de página después de cada sección excepto la última
        if (index < cards.length - 1) {
            const pageBreak = document.createElement('div');
            pageBreak.style.pageBreakAfter = 'always';
            pageBreak.style.marginTop = '30px';
            printElement.appendChild(pageBreak);
        }
    });
    
    if (tablesFound === 0) {
        // Si no encontró tablas en cards, buscar en report-table
        const tables = document.querySelectorAll('.report-table');
        console.log(`📊 Buscando en report-table: ${tables.length} encontradas`);
        
        if (tables.length === 0) {
            alert('⚠️ No hay datos para exportar. Por favor agregue items primero.');
            return;
        }
        
        tables.forEach((table, index) => {
            const formattedTable = formatTable(table);
            if (formattedTable) {
                printElement.appendChild(formattedTable);
                tablesFound++;
            }
        });
    }
    
    if (tablesFound === 0) {
        alert('⚠️ No se encontraron tablas para exportar');
        return;
    }
    
    console.log(`✅ ${tablesFound} tablas formateadas para PDF`);
    
    // Guardar contenido original
    const originalContent = document.body.innerHTML;
    
    // Mostrar el contenido a imprimir
    document.body.innerHTML = printElement.outerHTML;
    
    // Abrir diálogo de impresión
    window.print();
    
    // Restaurar contenido después de la impresión
    setTimeout(() => {
        document.body.innerHTML = originalContent;
        // Recargar para restaurar los event listeners
        location.reload();
    }, 500);
}

window.exportReportPDF = exportReportPDF;