// Notifications shared module
(function(){
    'use strict';

    // Load notifications from localStorage, seed sample if empty.
    function loadNotificationsStore() {
        const stored = localStorage.getItem('notifications');
        let notes = stored ? JSON.parse(stored) : [];
        if (!notes || notes.length === 0) {
            notes = [{
                id: 'n_' + Date.now(),
                title: 'Bienvenido a FACTORA POS',
                message: 'Notificaciones activas. Aquí verás alertas de ventas y stock.',
                type: 'Otro',
                time: new Date().toLocaleString(),
                read: false
            }];
            localStorage.setItem('notifications', JSON.stringify(notes));
        }
        return notes;
    }

    // Expose in window
    window._factora_notifications = loadNotificationsStore();

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderNotifications() {
        const list = document.getElementById('notificationsList');
        const dropdown = document.getElementById('notificationsDropdown');
        if (!list || !dropdown) return;

        const notes = window._factora_notifications || [];
        if (notes.length === 0) {
            list.innerHTML = '<div style="padding:16px; color:#64748b; text-align:center">No hay notificaciones</div>';
            return;
        }

        // helper to select icon and class based on type
        function iconForType(type) {
            const t = (type || '').toLowerCase();
            switch(t) {
                case 'venta': return {icon:'🛒', cls:'venta'};
                case 'compra': return {icon:'📥', cls:'compra'};
                case 'inventario': return {icon:'📦', cls:'inventario'};
                case 'rma': return {icon:'🔧', cls:'rma'};
                case 'movimiento': return {icon:'📋', cls:'movimiento'};
                case 'stock': return {icon:'⚠️', cls:'inventario'};
                default: return {icon:'🔔', cls:'otro'};
            }
        }

        list.innerHTML = notes.map(n => {
            const meta = iconForType(n.type);
            return `\n            <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">\n                <div class="ni-row">\n                    <div class="ni-icon ${meta.cls}">${meta.icon}</div>\n                    <div class="ni-content">\n                        <div class="ni-title">${escapeHtml(n.title || 'Notificación')}</div>\n                        <div class="ni-msg">${escapeHtml(n.message || '')}</div>\n                        <div class="ni-time">${escapeHtml(n.time || '')}</div>\n                    </div>\n                    <div class="ni-actions">\n                        <button class="btn-small btn-secondary" data-action="mark" data-id="${n.id}">Marcar leída</button>\n                    </div>\n                </div>\n            </div>\n        `;
        }).join('');

        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function(e) {
                const id = this.getAttribute('data-id');
                markNotificationRead(id);
            });
        });

        list.querySelectorAll('[data-action="mark"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                markNotificationRead(id);
            });
        });
    }

    function updateNotificationCount() {
        const countEl = document.getElementById('notificationCount');
        if (!countEl) return;
        const notes = window._factora_notifications || [];
        const unread = notes.filter(n => !n.read).length;
        if (unread > 0) {
            countEl.style.display = 'inline-flex';
            countEl.textContent = unread > 99 ? '99+' : String(unread);
        } else {
            countEl.style.display = 'none';
            countEl.textContent = '';
        }
    }

    // Public methods
    window.loadNotifications = function() {
        window._factora_notifications = loadNotificationsStore();
        renderNotifications();
        updateNotificationCount();
    };

    window.toggleNotifications = function(e) {
        if (e) e.stopPropagation();
        const dropdown = document.getElementById('notificationsDropdown');
        if (!dropdown) return;
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
            window.loadNotifications();
        }
    };

    window.markNotificationRead = function(id) {
        if (!id) return;
        const notes = window._factora_notifications || [];
        const idx = notes.findIndex(n => String(n.id) === String(id));
        if (idx === -1) return;
        notes[idx].read = true;
        localStorage.setItem('notifications', JSON.stringify(notes));
        window._factora_notifications = notes;
        renderNotifications();
        updateNotificationCount();
    };

    window.clearAllNotifications = function() {
        const notes = window._factora_notifications || [];
        notes.forEach(n => n.read = true);
        localStorage.setItem('notifications', JSON.stringify(notes));
        window._factora_notifications = notes;
        renderNotifications();
        updateNotificationCount();
    };

    // API: addNotification({title,message,type}) -> pushes new unread notification
    window.addNotification = function(obj) {
        const note = {
            id: 'n_' + Date.now(),
            title: obj.title || 'Notificación',
            message: obj.message || '',
            type: obj.type || 'Otro',
            time: new Date().toLocaleString(),
            read: false
        };
        window._factora_notifications = window._factora_notifications || [];
        window._factora_notifications.unshift(note);
        localStorage.setItem('notifications', JSON.stringify(window._factora_notifications));
        updateNotificationCount();
        renderNotifications();
    };

    // Close notifications dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notificationsDropdown');
        const wrapper = document.querySelector('.notification-badge');
        if (!dropdown || !wrapper) return;
        if (!wrapper.contains(e.target)) dropdown.classList.remove('show');
    });

    // Auto-init on DOMContentLoaded if bell exists
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('notificationBell')) {
            window.loadNotifications();
        }
    });
})();
