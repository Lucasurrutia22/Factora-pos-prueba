// Inventario Importer (clean version)
// Self-contained importer to parse CSV, normalize headers, apply code map, preview and import to localStorage

(function(){
    'use strict';

    const STORAGE_KEY = 'factora_solicitudes';
    const CODE_MAP_KEY = 'factora_code_map';

    function normalizeHeaderKey(key){
        if (key === undefined || key === null) return '';
        let k = String(key).replace(/\uFEFF/g,'').trim();
        try { k = k.normalize('NFD').replace(/[\u0300-\u036f]/g,''); } catch(e){}
        k = k.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
        return k;
    }

    const HEADER_ALIAS_MAP = {
        'codigo_interno':'codigo','codigo':'codigo','codigo_solicitud':'codigo',
        'cliente':'cliente','cliente_nombre':'cliente',
        'sucursal':'sucursal','branch':'sucursal',
        'tipo':'tipo_solicitud','tipo_solicitud':'tipo_solicitud','estado':'estado',
        'tecnico':'tecnico','tecnico_asignado':'tecnico',
        'fecha_instalacion':'fecha_instalacion','fecha':'fecha_instalacion',
        'totem':'totem','cant_totem':'cant_totem','tvbox':'tvbox',
        'tv_32':'tv_32','tv_40':'tv_40','tv_43':'tv_43','tv_50':'tv_50','tv_55':'tv_55','tv_65':'tv_65',
        'tv_cliente':'tv_cliente','tv_carteleria_digital':'tv_carteleria_digital',
        'soporte_brazo':'soporte_brazo','carcasa_ap':'carcasa_ap'
    };

    function parseCSV(text){
        // Basic RFC4180 parser
        const rows = [];
        let cur = '';
        let row = [];
        let inQuotes = false;
        for (let i=0;i<text.length;i++){
            const ch = text[i];
            const nxt = text[i+1];
            if (ch === '"'){
                if (inQuotes && nxt === '"') { cur += '"'; i++; continue; }
                inQuotes = !inQuotes; continue;
            }
            if (!inQuotes && (ch === '\n' || (ch === '\r' && text[i+1] === '\n'))){
                if (ch === '\r' && text[i+1] === '\n') { /* windows pair, skip */ }
                row.push(cur); rows.push(row); cur=''; row=[]; if (ch === '\r' && text[i+1]==='\n') i++; continue;
            }
            if (!inQuotes && ch === ',') { row.push(cur); cur=''; continue; }
            cur += ch;
        }
        // push last
        if (cur !== '' || row.length>0) { row.push(cur); rows.push(row); }
        return rows;
    }

    function arraysToObjects(arrays){
        if (!arrays || arrays.length === 0) return [];
        const header = arrays[0].map(h=>String(h||'').trim());
        const items = [];
        for (let i=1;i<arrays.length;i++){
            const r = arrays[i];
            const obj = {};
            for (let c=0;c<header.length;c++){ obj[normalizeHeaderKey(header[c])]= (r[c]===undefined? '': r[c]); }
            items.push(obj);
        }
        return items;
    }

    function mapAliases(obj){
        const out = {};
        Object.keys(obj||{}).forEach(k=>{
            const nk = normalizeHeaderKey(k);
            const ali = HEADER_ALIAS_MAP[nk] || nk;
            out[ali] = obj[k];
        });
        return out;
    }

    function pickRowFields(row){
        const mapped = mapAliases(row||{});
        const out = {};
        out.codigo = (mapped.codigo||'').toString().trim();
        out.cliente = (mapped.cliente||'').toString().trim();
        out.sucursal = (mapped.sucursal||'').toString().trim();
        out.tipo_solicitud = (mapped.tipo_solicitud||'Instalación').toString().trim();
        out.estado = (mapped.estado||'Pendiente').toString().trim();
        out.tecnico = (mapped.tecnico||'').toString().trim();
        out.fecha_instalacion = (mapped.fecha_instalacion||null);
        // equipos fields (keep numeric or zero)
        const keys = ['totem','tvbox','tv_32','tv_40','tv_43','tv_50','tv_55','tv_65','tv_cliente','tv_carteleria_digital','soporte_brazo','carcasa_ap','cant_totem'];
        keys.forEach(k=>{
            let v = mapped[k] || mapped[k.toUpperCase()] || 0;
            if (typeof v === 'string') v = v.replace(/[^0-9\-]/g,'');
            v = parseInt(v) || 0; out[k]=v;
        });
        return out;
    }

    function finalizeImportedRow(raw){
        const picked = pickRowFields(raw||{});
        const equipmentKeys = ['totem','tvbox','tv_32','tv_40','tv_43','tv_50','tv_55','tv_65','tv_cliente','tv_carteleria_digital','soporte_brazo','carcasa_ap'];
        const equipos = {};
        equipmentKeys.forEach(k=>{ equipos[k] = Number(picked[k])||0; });
        // add cant_totem to totem
        equipos.totem = (equipos.totem||0) + (Number(picked.cant_totem)||0);
        const out = {
            codigo: picked.codigo || ('IMP-'+Date.now()),
            cliente: picked.cliente || '',
            sucursal: picked.sucursal || '',
            tipo_solicitud: picked.tipo_solicitud || 'Instalación',
            estado: picked.estado || 'Pendiente',
            tecnico: picked.tecnico || '',
            fecha_instalacion: (function(d){ if (!d) return null; const dt = new Date(String(d)); if (isNaN(dt.getTime())) return null; return dt.toISOString().split('T')[0]; })(picked.fecha_instalacion),
            equipos: equipos,
            _imported: true,
            _synced: false
        };
        return out;
    }

    function loadCodeMap(){
        try{ return JSON.parse(localStorage.getItem(CODE_MAP_KEY)||'{}'); }catch(e){ return {}; }
    }
    function saveCodeMap(map){ try{ localStorage.setItem(CODE_MAP_KEY, JSON.stringify(map||{})); return true;}catch(e){return false;} }
    function addCodeMapEntry(code, cliente, sucursal){
        const key = String(code||'').trim().toUpperCase(); if (!key) return false; const m=loadCodeMap(); m[key]={cliente: (cliente||'').toString(), sucursal: (sucursal||'').toString()}; saveCodeMap(m); return true;
    }

    function loadCodeMapFromFile(file, cb){
        const r = new FileReader(); r.onload = function(e){ try{ const text = e.target.result||''; const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean); const map={}; for(let i=0;i<lines.length;i++){ const parts = lines[i].split(','); if (i===0 && /codigo/i.test(parts[0]) && /cliente/i.test(parts[1])) continue; const key = (parts[0]||'').toString().trim().toUpperCase(); if (!key) continue; map[key]={cliente: (parts[1]||'').trim(), sucursal: (parts[2]||'').trim()}; } saveCodeMap(map); if (cb) cb(null,map); }catch(er){ if (cb) cb(er); } }; r.onerror = function(e){ if (cb) cb(e); }; r.readAsText(file||new Blob()); }

    function applyCodeMapToRow(row){
        try{
            const map = loadCodeMap(); const key = String(row.codigo||'').trim().toUpperCase(); if (map[key]){ row.cliente = map[key].cliente; row.sucursal = map[key].sucursal || row.sucursal; }
            return finalizeImportedRow(row);
        }catch(e){ return finalizeImportedRow(row); }
    }

    function getInvalidRows(rows){ return (rows||[]).filter(r=> !(r && r.codigo && r.cliente && r.sucursal)).map(r=>Object.assign({},r)); }

    function downloadCSVFromObjects(objects, filename){ if (!objects||objects.length===0) return; const keys = Object.keys(objects[0]); const lines=[keys.join(',')]; objects.forEach(o=>{ lines.push(keys.map(k=>{ const v = o[k]===undefined||o[k]===null? '': String(o[k]); if (v.includes(',')||v.includes('"')||v.includes('\n')) return '"'+v.replace(/"/g,'""')+'"'; return v; }).join(',')); }); const csv = lines.join('\r\n'); const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename||'export.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000); }

    function saveRowsToLocalStorage(rows){ try{ const cur = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); const merged = cur.concat(rows||[]); localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); return true;}catch(e){ console.warn('saveRowsToLocalStorage failed', e); return false; } }

    function processFileSimple(file, cb){
        const reader = new FileReader(); reader.onload = function(e){ try{
            const text = e.target.result || '';
            const arrays = parseCSV(text);
            // decide if first row header
            const header = arrays[0] || [];
            const hasHeader = header.some(cell => /[A-Za-z]/.test(String(cell||'')));
            let objects = [];
            if (hasHeader) objects = arraysToObjects(arrays);
            else {
                // create default headers positions
                const positionMap = ['codigo','cliente','sucursal','tipo_solicitud','tecnico','fecha_instalacion','totem','tv_43','tv_55','tvbox','soporte_brazo','carcasa_ap'];
                for (let r=0;r<arrays.length;r++){
                    const arr = arrays[r]; const obj={}; for (let c=0;c<arr.length;c++){ const field = positionMap[c] || ('col_'+c); obj[field]=arr[c]; } objects.push(obj);
                }
            }
            // map aliases and pick fields
            const coerced = objects.map(o=> pickRowFields(o));
            // attempt to apply code map for known codes
            const applied = coerced.map((r)=> applyCodeMapToRow(r));
            // finalize
            const finalized = applied.map(f=> finalizeImportedRow(f));
            if (cb) cb(null, { arrays: arrays, objects: objects, coerced: coerced, finalized: finalized });
        }catch(err){ if (cb) cb(err); } };
        reader.onerror = function(err){ if (cb) cb(err); };
        reader.readAsText(file,'utf-8');
    }

    // Expose minimal UI helpers
    window.InventarioImporter = {
        parseCSVText: parseCSV,
        processFile: processFileSimple,
        downloadCSVFromObjects: downloadCSVFromObjects,
        loadCodeMapFromFile: loadCodeMapFromFile,
        addCodeMapEntry: addCodeMapEntry,
        loadCodeMap: loadCodeMap,
        applyCodeMapToRow: applyCodeMapToRow,
        finalizeImportedRow: finalizeImportedRow,
        saveRowsToLocalStorage: saveRowsToLocalStorage,
        getInvalidRows: getInvalidRows,
        STORAGE_KEY: STORAGE_KEY,
        CODE_MAP_KEY: CODE_MAP_KEY
    };

})();
