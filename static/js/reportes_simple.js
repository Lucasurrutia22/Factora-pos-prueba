// Reportes simple - conectado a inventario
// Carga solicitudes con equipos y datos_red desde /inventario/api/coordinacion/solicitudes/
(function(){
    function $(id){ return document.getElementById(id); }

    function escapeHtml(str){
        return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    async function fetchSolicitudes(tipo){
        let url = '/inventario/api/coordinacion/solicitudes/';
        if (tipo) url += '?tipo=' + encodeURIComponent(tipo);
        try{
            const res = await fetch(url, { credentials: 'same-origin' });
            if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
            const data = await res.json();
            // aceptar tanto array como paginado {results:[]}
            return Array.isArray(data) ? data : (data.results || []);
        }catch(err){
            console.error('fetchSolicitudes error', err);
            return [];
        }
    }

    function buildEquiposHtml(equipos){
        if (!Array.isArray(equipos) || equipos.length===0) return '';
        const rows = equipos.map(e => {
            const tipo = e.tipo || e.tipo_equipo || e.nombre || e.descripcion || '';
            const qty = e.cantidad || e.cant || 1;
            const extra = e.numero_serie ? ' SN:'+escapeHtml(e.numero_serie) : '';
            return `${escapeHtml(tipo)} x${qty}${extra}`;
        });
        return '<pre style="white-space:pre-wrap; margin:0;">'+escapeHtml(rows.join('\n'))+'</pre>';
    }

    function renderTable(rows){
        const thead = $('simpleReportTableHeader');
        const tbody = $('simpleReportTableBody');
        if (!thead || !tbody) return;
        thead.innerHTML = ['Código','Cliente','Sucursal','Fecha','Técnico','Estado','Equipos','Datos Red'].map(h=>`<th>${h}</th>`).join('');
        tbody.innerHTML = '';

        rows.forEach(r=>{
            const tr = document.createElement('tr');
            const codigo = r.numero_solicitud || r.codigo_solicitud || r.codigo || r.id || '';
            const cliente = r.cliente_nombre || (r.cliente && (r.cliente.nombre || r.cliente)) || '';
            const sucursal = r.sucursal_nombre || (r.sucursal && (r.sucursal.nombre || r.sucursal)) || '';
            const fecha = (r.coordinacion_tecnica && r.coordinacion_tecnica.fecha_instalacion) || r.fecha_solicitada || r.fecha || '';
            const tecnico = (r.coordinacion_tecnica && (r.coordinacion_tecnica.tecnico || r.coordinacion_tecnica.tecnico_nombre)) || r.tecnico_asignado || '';
            const estado = r.estado || r.estado_display || '';
            const equiposHtml = buildEquiposHtml(r.equipos);
            const datosRed = r.datos_red || r.datosRed || '';

            tr.innerHTML = [`<td>${escapeHtml(codigo)}</td>`,`<td>${escapeHtml(cliente)}</td>`,`<td>${escapeHtml(sucursal)}</td>`,`<td>${escapeHtml(fecha)}</td>`,`<td>${escapeHtml(tecnico)}</td>`,`<td>${escapeHtml(estado)}</td>`,`<td>${equiposHtml}</td>`,`<td>${escapeHtml(datosRed)}</td>`].join('');
            tbody.appendChild(tr);
        });
    }

    async function loadAndRender(){
        const tipoSel = $('solicitudTipo');
        const tipo = tipoSel ? tipoSel.value : '';
        const rows = await fetchSolicitudes(tipo);
        renderTable(rows);
        const countEl = $('simpleReportCount');
        if (countEl) countEl.textContent = rows.length + ' solicitudes';
    }

    function exportCSV(){
        const thead = $('simpleReportTableHeader');
        const tbody = $('simpleReportTableBody');
        if (!thead || !tbody) return;
        const headers = Array.from(thead.querySelectorAll('th')).map(th=>th.textContent);
        const rows = Array.from(tbody.querySelectorAll('tr')).map(tr=> Array.from(tr.querySelectorAll('td')).map(td=>td.textContent));
        let csv = headers.join(',') + '\n';
        rows.forEach(r => { csv += r.map(c => '"'+(String(c).replace(/"/g,'""'))+'"').join(',') + '\n'; });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'reportes_solicitudes_'+(new Date().toISOString().slice(0,10))+'.csv';
        link.click();
    }

    document.addEventListener('DOMContentLoaded', ()=>{
        const tipoSel = $('solicitudTipo');
        if (tipoSel) tipoSel.addEventListener('change', loadAndRender);
        const refreshBtn = $('simpleReportRefresh');
        if (refreshBtn) refreshBtn.addEventListener('click', loadAndRender);
        const exportBtn = $('simpleReportExport');
        if (exportBtn) exportBtn.addEventListener('click', exportCSV);
        loadAndRender();
    });

// reportes_simple.js: reportes module removed; this file is a stub to avoid broken references.
console.warn('reportes_simple.js: reportes module removed; file is a stub.');
