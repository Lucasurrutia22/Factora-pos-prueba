// =============================================
// FACTORA POS - Sistema de Login con 2FA
// =============================================

// Usuarios demo con configuración 2FA
const users = {
    admin: { password: 'admin123', role: 'Administrador', twofa: true },
    vendedor: { password: 'vendedor123', role: 'Vendedor', twofa: true },
    bodega: { password: 'bodega123', role: 'Jefe de Bodega', twofa: true }
};

// Estado de la aplicación
let appState = {
    currentUser: null,
    generatedCode: null,
    codeExpiry: null,
    timerInterval: null,
    attempts: 0,
    maxAttempts: 3
};

// Elementos del DOM
const elements = {
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    loginForm: document.getElementById('loginForm'),
    twofaForm: document.getElementById('twofaForm'),
    alertContainer: document.getElementById('alertContainer'),
    alertContainer2FA: document.getElementById('alertContainer2FA'),
    userHint: document.getElementById('userHint'),
    timerProgress: document.getElementById('timerProgress'),
    timerCount: document.getElementById('timerCount'),
    resendCode: document.getElementById('resendCode'),
    backToLogin: document.getElementById('backToLogin'),
    welcomeMessage: document.getElementById('welcomeMessage'),
    codeDigits: document.querySelectorAll('.code-digit'),
    verifyBtn: document.querySelector('.btn-verify')
};

// =============================================
// Utilidades
// =============================================

function showAlert(container, message, type = 'danger') {
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        danger: '<i class="fas fa-exclamation-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>'
    };
    container.innerHTML = `<div class="alert-${type}">${icons[type] || ''} ${message}</div>`;
    if (type !== 'success') {
        setTimeout(() => { container.innerHTML = ''; }, 4000);
    }
}

function clearAlerts() {
    elements.alertContainer.innerHTML = '';
    elements.alertContainer2FA.innerHTML = '';
}

function switchStep(stepNumber) {
    clearAlerts();
    document.querySelectorAll('.auth-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step${stepNumber}`).classList.add('active');
}

function generateCode() {
    // Código de prueba fijo para desarrollo
    return '123123';
}

function maskEmail(email) {
    if (!email || !email.includes('@')) return '***@***.com';
    const [user, domain] = email.split('@');
    const maskedUser = user.substring(0, 2) + '***';
    return `${maskedUser}@${domain}`;
}

function maskUsername(username) {
    if (!username || username.length < 3) return '***';
    return username.substring(0, 2) + '*'.repeat(username.length - 2);
}

// =============================================
// Toggle Password Visibility
// =============================================

document.querySelector('.toggle-password')?.addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});

// =============================================
// Step 1: Login Form
// =============================================

elements.loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Buscar en usuarios del sistema (localStorage)
    const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
    const usernameLower = username.toLowerCase();
    
    let foundUser = storedUsers.find(u => 
        (u.username && u.username.toLowerCase() === usernameLower) || 
        (u.email && u.email.toLowerCase() === usernameLower) ||
        (u.name && u.name.toLowerCase() === usernameLower)
    );

    let isDemo = false;
    
    if (foundUser && foundUser.password === password) {
        const roleMap = { 'admin': 'Administrador', 'vendedor': 'Vendedor', 'bodega': 'Jefe de Bodega' };
        appState.currentUser = {
            username: foundUser.name || foundUser.username,
            role: roleMap[foundUser.role] || foundUser.role,
            email: foundUser.email,
            id: foundUser.id,
            twofa: foundUser.twofa !== false // Por defecto 2FA está activo
        };
    } else if (users[username] && users[username].password === password) {
        isDemo = true;
        appState.currentUser = {
            username: username,
            role: users[username].role,
            email: `${username}@factora.local`,
            twofa: users[username].twofa
        };
    } else {
        showAlert(elements.alertContainer, 'Usuario o contraseña incorrectos', 'danger');
        return;
    }

    // Verificar si el dispositivo es de confianza
    const trustedDevices = JSON.parse(localStorage.getItem('trusted_devices') || '{}');
    const deviceKey = `device_${appState.currentUser.username}`;
    const trustedUntil = trustedDevices[deviceKey];
    
    if (trustedUntil && new Date(trustedUntil) > new Date()) {
        // Dispositivo de confianza, saltar 2FA
        completeLogin();
        return;
    }

    // Verificar si 2FA está habilitado
    if (appState.currentUser.twofa) {
        initiate2FA();
    } else {
        completeLogin();
    }
});

// =============================================
// Step 2: 2FA Verification
// =============================================

function initiate2FA() {
    // Generar nuevo código
    appState.generatedCode = generateCode();
    appState.codeExpiry = Date.now() + 60000; // 60 segundos
    appState.attempts = 0;
    
    // Mostrar hint del usuario
    elements.userHint.textContent = maskUsername(appState.currentUser.username);
    
    // Limpiar inputs
    elements.codeDigits.forEach(input => {
        input.value = '';
        input.classList.remove('filled', 'error');
    });
    elements.verifyBtn.disabled = true;
    
    // Cambiar a step 2
    switchStep(2);
    
    // Iniciar timer
    startTimer();
    
    // Enfocar primer input
    setTimeout(() => elements.codeDigits[0].focus(), 100);
    
    // Mostrar código en consola (para demo - en producción se enviaría por SMS/Email)
    console.log('%c🔐 Código 2FA: ' + appState.generatedCode, 'color: #2563eb; font-size: 18px; font-weight: bold;');
    
    // Mostrar notificación de intentos disponibles
    showAlert(elements.alertContainer2FA, `Tienes ${appState.maxAttempts} intentos para ingresar el código`, 'warning');
}

function startTimer() {
    let timeLeft = 60;
    elements.timerProgress.style.width = '100%';
    elements.timerProgress.classList.remove('warning');
    elements.resendCode.disabled = true;
    
    if (appState.timerInterval) clearInterval(appState.timerInterval);
    
    appState.timerInterval = setInterval(() => {
        timeLeft--;
        elements.timerCount.textContent = timeLeft;
        elements.timerProgress.style.width = `${(timeLeft / 60) * 100}%`;
        
        if (timeLeft <= 15) {
            elements.timerProgress.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(appState.timerInterval);
            appState.generatedCode = null;
            elements.resendCode.disabled = false;
            showAlert(elements.alertContainer2FA, 'El código ha expirado. Solicita uno nuevo.', 'warning');
        }
    }, 1000);
}

// Manejo de inputs de código
elements.codeDigits.forEach((input, index) => {
    input.addEventListener('input', function(e) {
        // Solo permitir números
        this.value = this.value.replace(/[^0-9]/g, '');
        
        if (this.value.length === 1) {
            this.classList.add('filled');
            this.classList.remove('error');
            
            // Mover al siguiente input
            if (index < elements.codeDigits.length - 1) {
                elements.codeDigits[index + 1].focus();
            }
        }
        
        // Verificar si todos los campos están llenos
        checkCodeComplete();
    });
    
    input.addEventListener('keydown', function(e) {
        // Backspace para retroceder
        if (e.key === 'Backspace' && this.value === '' && index > 0) {
            elements.codeDigits[index - 1].focus();
            elements.codeDigits[index - 1].value = '';
            elements.codeDigits[index - 1].classList.remove('filled');
        }
        
        // Enter para enviar
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!elements.verifyBtn.disabled) {
                elements.twofaForm.dispatchEvent(new Event('submit'));
            }
        }
    });
    
    // Permitir pegar código completo
    input.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData).getData('text');
        const digits = pastedData.replace(/[^0-9]/g, '').split('').slice(0, 6);
        
        digits.forEach((digit, i) => {
            if (elements.codeDigits[i]) {
                elements.codeDigits[i].value = digit;
                elements.codeDigits[i].classList.add('filled');
            }
        });
        
        if (digits.length === 6) {
            elements.codeDigits[5].focus();
        }
        
        checkCodeComplete();
    });
});

function checkCodeComplete() {
    const code = Array.from(elements.codeDigits).map(input => input.value).join('');
    elements.verifyBtn.disabled = code.length !== 6;
}

function getEnteredCode() {
    return Array.from(elements.codeDigits).map(input => input.value).join('');
}

// Verificar código 2FA
elements.twofaForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const enteredCode = getEnteredCode();
    
    if (!appState.generatedCode) {
        showAlert(elements.alertContainer2FA, 'El código ha expirado. Solicita uno nuevo.', 'warning');
        return;
    }
    
    if (enteredCode === appState.generatedCode) {
        // Código correcto
        clearInterval(appState.timerInterval);
        
        // Guardar dispositivo de confianza si está marcado
        if (document.getElementById('trustDevice').checked) {
            const trustedDevices = JSON.parse(localStorage.getItem('trusted_devices') || '{}');
            const deviceKey = `device_${appState.currentUser.username}`;
            const trustUntil = new Date();
            trustUntil.setDate(trustUntil.getDate() + 30); // 30 días
            trustedDevices[deviceKey] = trustUntil.toISOString();
            localStorage.setItem('trusted_devices', JSON.stringify(trustedDevices));
        }
        
        completeLogin();
    } else {
        // Código incorrecto
        appState.attempts++;
        
        elements.codeDigits.forEach(input => {
            input.classList.add('error');
            input.classList.remove('filled');
        });
        
        if (appState.attempts >= appState.maxAttempts) {
            showAlert(elements.alertContainer2FA, 'Demasiados intentos fallidos. Volviendo al inicio.', 'danger');
            setTimeout(() => {
                resetLogin();
            }, 2000);
        } else {
            showAlert(elements.alertContainer2FA, `Código incorrecto. Intentos restantes: ${appState.maxAttempts - appState.attempts}`, 'danger');
            
            // Limpiar inputs después de la animación
            setTimeout(() => {
                elements.codeDigits.forEach(input => {
                    input.value = '';
                    input.classList.remove('error');
                });
                elements.codeDigits[0].focus();
                elements.verifyBtn.disabled = true;
            }, 400);
        }
    }
});

// Reenviar código
elements.resendCode.addEventListener('click', function() {
    appState.generatedCode = generateCode();
    appState.codeExpiry = Date.now() + 60000;
    appState.attempts = 0;
    
    // Limpiar inputs
    elements.codeDigits.forEach(input => {
        input.value = '';
        input.classList.remove('filled', 'error');
    });
    elements.verifyBtn.disabled = true;
    elements.codeDigits[0].focus();
    
    startTimer();
    
    console.log('%c🔐 Nuevo código 2FA: ' + appState.generatedCode, 'color: #2563eb; font-size: 18px; font-weight: bold;');
    showAlert(elements.alertContainer2FA, `Tienes ${appState.maxAttempts} intentos para ingresar el código`, 'warning');
});

// Volver al login
elements.backToLogin.addEventListener('click', function() {
    resetLogin();
});

function resetLogin() {
    clearInterval(appState.timerInterval);
    appState.currentUser = null;
    appState.generatedCode = null;
    appState.attempts = 0;
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    switchStep(1);
}

// =============================================
// Step 3: Login completo
// =============================================

function completeLogin() {
    // Cambiar a pantalla de éxito
    switchStep(3);
    
    elements.welcomeMessage.textContent = `Bienvenido, ${appState.currentUser.role}`;
    
    // Guardar sesión
    const sessionUser = {
        username: appState.currentUser.username,
        role: appState.currentUser.role,
        email: appState.currentUser.email,
        id: appState.currentUser.id,
        loginTime: new Date().toISOString()
    };
    
    sessionStorage.setItem('factora_user', JSON.stringify(sessionUser));
    
    if (document.getElementById('rememberMe').checked) {
        localStorage.setItem('factora_user_remember', JSON.stringify(sessionUser));
    }
    
    // Redirigir después de la animación
    setTimeout(() => {
        window.location.href = '/dashboard/';
    }, 2000);
}

// =============================================
// Auto-login desde remember
// =============================================

window.addEventListener('DOMContentLoaded', () => {
    const remembered = localStorage.getItem('factora_user_remember');
    if (remembered) {
        sessionStorage.setItem('factora_user', remembered);
        window.location.href = '/dashboard/';
    }
});