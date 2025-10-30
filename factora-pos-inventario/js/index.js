// Usuarios demo
const users = {
    admin: { password: 'admin123', role: 'Administrador' },
    vendedor: { password: 'vendedor123', role: 'Vendedor' },
    bodega: { password: 'bodega123', role: 'Jefe de Bodega' }
};

const loginForm = document.getElementById('loginForm');
const alertContainer = document.getElementById('alertContainer');

function showAlert(message, type = 'danger') {
    alertContainer.innerHTML = `<div class="alert-${type}">${message}</div>`;
    setTimeout(() => { alertContainer.innerHTML = ''; }, 3500);
}

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (users[username] && users[username].password === password) {
        // guardar sesión (temporal)
        sessionStorage.setItem('factora_user', JSON.stringify({ username, role: users[username].role }));
        if (document.getElementById('rememberMe').checked) {
            localStorage.setItem('factora_user_remember', JSON.stringify({ username, role: users[username].role }));
        }
        showAlert(`Bienvenido ${users[username].role}. Redirigiendo...`, 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
    } else {
        showAlert('Usuario o contraseña incorrectos.');
    }
});

// auto-login desde remember
window.addEventListener('DOMContentLoaded', () => {
    const remembered = localStorage.getItem('factora_user_remember');
    if (remembered) {
        sessionStorage.setItem('factora_user', remembered);
        window.location.href = 'dashboard.html';
    }
});