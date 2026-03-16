// Verificar sesión
const user = JSON.parse(sessionStorage.getItem('factora_user') || 'null');
if (!user) {
    window.location.href = '/';
}

document.getElementById('welcomeText').textContent = user.username || 'Admin Usuario';
document.getElementById('roleText').textContent = user.role || 'Administrador';
document.getElementById('userAvatar').textContent = (user.username || 'A').charAt(0);

// Toggle dropdown menu
function toggleProfileMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const userProfile = document.querySelector('.user-profile-wrapper');
    
    if (userProfile && !userProfile.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// logoutSession provided centrally in js/auth.js

// Open user profile
function openUserProfile(event) {
    event.preventDefault();
    const currentUser = JSON.parse(sessionStorage.getItem('factora_user') || 'null') || { username: 'Admin Usuario', email: '', role: 'Administrador' };
    document.getElementById('profileUsername').value = currentUser.username || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profileRole').value = currentUser.role || 'Administrador';
    openModalById('userProfileModal');
}

// Open settings
function openSettings(event) {
    event.preventDefault();
    const settings = JSON.parse(localStorage.getItem('factora_settings') || 'null') || { theme: 'light', notifications: true };
    document.getElementById('settingTheme').value = settings.theme || 'light';
    document.getElementById('settingNotifications').checked = !!settings.notifications;
    openModalById('settingsModal');
}

// Modal helpers
function openModalById(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

function closeModalById(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

function saveUserProfile(e) {
    e.preventDefault();
    const username = document.getElementById('profileUsername').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const role = document.getElementById('profileRole').value;

    const userData = { username, email, role };
    sessionStorage.setItem('factora_user', JSON.stringify(userData));

    // Update header
    const welcomeEl = document.getElementById('welcomeText');
    const roleEl = document.getElementById('roleText');
    const avatarEl = document.getElementById('userAvatar');
    if (welcomeEl) welcomeEl.textContent = username;
    if (roleEl) roleEl.textContent = role;
    if (avatarEl) avatarEl.textContent = username.charAt(0) || 'A';

    closeModalById('userProfileModal');
}

function saveSettings(e) {
    e.preventDefault();
    const theme = document.getElementById('settingTheme').value;
    const notifications = document.getElementById('settingNotifications').checked;
    const settings = { theme, notifications };
    localStorage.setItem('factora_settings', JSON.stringify(settings));

    applyTheme(theme);
    closeModalById('settingsModal');
}

function applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('theme-dark');
    else document.body.classList.remove('theme-dark');
}

// Apply theme on load
const savedSettings = JSON.parse(localStorage.getItem('factora_settings') || 'null');
if (savedSettings && savedSettings.theme) applyTheme(savedSettings.theme);

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadGeneralSettings();
    loadThemeSettings();
    loadNotificationSettings();
});

// Save general settings
function saveGeneralSettings(e) {
    e.preventDefault();
    const companyName = document.getElementById('companyName').value;
    const supportEmail = document.getElementById('supportEmail').value;
    const phone = document.getElementById('phone').value;
    
    const generalSettings = { companyName, supportEmail, phone };
    localStorage.setItem('general_settings', JSON.stringify(generalSettings));
    
    alert('Configuración general guardada correctamente');
}

// Save theme settings
function saveThemeSettings(e) {
    e.preventDefault();
    const theme = document.getElementById('themeSelect').value;
    applyTheme(theme);
    localStorage.setItem('factora_settings', JSON.stringify({ theme, notifications: true }));
    alert('Tema aplicado correctamente');
}

// Save notification settings
function saveNotificationSettings(e) {
    e.preventDefault();
    const ventasNotif = document.getElementById('notifVentas').checked;
    const stockNotif = document.getElementById('notifStock').checked;
    const emailNotif = document.getElementById('notifEmail').checked;
    
    const notifSettings = { ventasNotif, stockNotif, emailNotif };
    localStorage.setItem('notification_settings', JSON.stringify(notifSettings));
    
    alert('Preferencias de notificaciones guardadas');
}

// Load general settings
function loadGeneralSettings() {
    const settings = JSON.parse(localStorage.getItem('general_settings') || 'null');
    if (settings) {
        document.getElementById('companyName').value = settings.companyName || '';
        document.getElementById('supportEmail').value = settings.supportEmail || '';
        document.getElementById('phone').value = settings.phone || '';
    }
}

// Load theme settings
function loadThemeSettings() {
    const settings = JSON.parse(localStorage.getItem('factora_settings') || 'null');
    if (settings && settings.theme) {
        document.getElementById('themeSelect').value = settings.theme;
    }
}

// Load notification settings
function loadNotificationSettings() {
    const settings = JSON.parse(localStorage.getItem('notification_settings') || 'null');
    if (settings) {
        document.getElementById('notifVentas').checked = !!settings.ventasNotif;
        document.getElementById('notifStock').checked = !!settings.stockNotif;
        document.getElementById('notifEmail').checked = !!settings.emailNotif;
    }
}
