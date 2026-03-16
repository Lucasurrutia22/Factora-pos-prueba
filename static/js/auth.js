// Centralized auth helpers
(function(window){
    function logoutSession(event) {
        try { if (event && typeof event.preventDefault === 'function') event.preventDefault(); } catch(e){}
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            // Remove only session/auth related data. Do NOT delete inventory/product data by default.
            try { sessionStorage.removeItem('factora_user'); } catch(e){}
            try { localStorage.removeItem('userToken'); } catch(e){}
            try { localStorage.removeItem('userData'); } catch(e){}
            // Redirect to login
            window.location.href = '/';
        }
    }

    // Expose globally
    window.logoutSession = logoutSession;
    // Attach handlers to any logout links to be defensive
    document.addEventListener('DOMContentLoaded', function() {
        try {
            const els = document.querySelectorAll('.dropdown-item.logout');
            els.forEach(el => {
                // Avoid adding duplicate listeners
                if (!el.__logoutBound) {
                    el.addEventListener('click', function(e) {
                        logoutSession(e);
                    });
                    el.__logoutBound = true;
                }
            });
        } catch (e) {
            // ignore
            console.debug('auth.js: no logout elements found or error attaching handlers', e);
        }
    });
})(window);
