// Stub: `bodega_v3.js` obsoleto — carga `Bodega.js` para mantener compatibilidad
console.warn('bodega_v3.js: obsoleto — cargando Bodega.js');
(function(){
    try{
        var s = document.createElement('script');
        s.src = '/static/js/Bodega.js?v=' + (new Date().getTime());
        s.defer = true;
        document.head.appendChild(s);
    }catch(e){ console.error('No se pudo cargar Bodega.js', e); }
})();
