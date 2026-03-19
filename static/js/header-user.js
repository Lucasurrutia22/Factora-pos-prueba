/**
 * Header User - Gestión de información del usuario en el header
 * Actualiza el nombre del usuario y maneja el menú de usuario
 */

document.addEventListener('DOMContentLoaded', function() {
    updateHeaderUser();
    setupHeaderMenus();
});

function updateHeaderUser() {
    const userInfoElement = document.querySelector('[data-user-info]');
    const userNameElement = document.querySelector('.user-name');
    
    if (userInfoElement) {
        const userName = userInfoElement.getAttribute('data-user-info');
        if (userName && userNameElement) {
            userNameElement.textContent = userName;
        }
    }
}

function setupHeaderMenus() {
    // Configurar menúes desplegables
    const dropdownToggles = document.querySelectorAll('[data-dropdown-toggle]');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('data-dropdown-toggle');
            const dropdownMenu = document.getElementById(targetId);
            
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('active');
                
                // Cerrar otros menúes abiertos
                document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
                    if (menu.id !== targetId) {
                        menu.classList.remove('active');
                    }
                });
            }
        });
    });
    
    // Cerrar menúes al hacer click fuera
    document.addEventListener('click', function(e) {
        const dropdownMenus = document.querySelectorAll('.dropdown-menu.active');
        dropdownMenus.forEach(menu => {
            if (!menu.parentElement.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    });
}

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        window.location.href = '/logout/';
    }
}
