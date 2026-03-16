// Verificar sesión
const user = JSON.parse(sessionStorage.getItem('factora_user') || 'null');
if (!user) {
    window.location.href = '/';
}

// Actualizar header con datos del usuario
const displayName = user.username || 'Admin Usuario';
const displayRole = user.role || 'Administrador';

document.getElementById('welcomeText').textContent = displayName;
document.getElementById('roleText').textContent = displayRole;
document.getElementById('userAvatar').textContent = displayName.charAt(0).toUpperCase();

// Actualizar dropdown si existe
const dropdownName = document.querySelector('.dropdown-name');
if (dropdownName) {
    dropdownName.textContent = displayName;
}

const dropdownRole = document.querySelector('.dropdown-role');
if (dropdownRole) {
    dropdownRole.textContent = displayRole;
}

// Users data
let users = JSON.parse(localStorage.getItem('system_users') || 'null') || [
    {
        id: 1,
        name: 'Admin Usuario',
        username: 'admin',
        email: 'admin@factora.com',
        password: 'admin123',
        role: 'admin',
        status: 'activo',
        lastLogin: '-'
    }
];

let currentEditingUserId = null;

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
    if (m) m.style.display = 'flex';
}

function closeModalById(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
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
    updateUsersTable();
});

// Update users table
function updateUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    const countEl = document.getElementById('userCount');
    
    tbody.innerHTML = '';
    
    users.forEach(u => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${u.id}</strong></td>
            <td><strong>${u.name}</strong></td>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td>
                <span class="badge ${u.status === 'activo' ? 'active' : 'inactive'}">
                    ${u.status === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${u.lastLogin || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="editUser(${u.id})">✏️</button>
                    <button class="btn-action delete" onclick="deleteUser(${u.id})">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    countEl.textContent = users.length;
}

// Open add user modal
function openAddUserModal() {
    currentEditingUserId = null;
    document.getElementById('userForm').reset();
    document.getElementById('userModalTitle').textContent = 'Nuevo Usuario';
    document.getElementById('userStatus').value = 'activo';
    openModalById('userModal');
}

// Edit user
function editUser(id) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    
    currentEditingUserId = id;
    document.getElementById('userName').value = u.name;
    document.getElementById('userEmail').value = u.email;
    document.getElementById('userUsername').value = u.username;
    document.getElementById('userRole').value = u.role;
    document.getElementById('userStatus').value = u.status;
    // leave password blank for security; entering a password will update it
    document.getElementById('userPassword').value = '';
    document.getElementById('userModalTitle').textContent = 'Editar Usuario';
    openModalById('userModal');
}

// Delete user
function deleteUser(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    
    users = users.filter(u => u.id !== id);
    localStorage.setItem('system_users', JSON.stringify(users));
    updateUsersTable();
}

// Handle user submit
function handleUserSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const username = document.getElementById('userUsername').value.trim();
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;
    const password = document.getElementById('userPassword').value.trim();
    
    // Validate required fields
    if (!name || !email || !username || !password || !role) {
        alert('Por favor completa todos los campos requeridos.');
        return;
    }
    
    // Generate correlative IDs
    const getNextId = () => {
        if (users.length === 0) return 1;
        const maxId = Math.max(...users.map(u => u.id));
        return maxId + 1;
    };
    
    if (currentEditingUserId) {
        const idx = users.findIndex(u => u.id === currentEditingUserId);
        if (idx >= 0) {
            // Update fields; only change password if provided
            users[idx] = { ...users[idx], name, email, username, role, status };
            if (password && password.length > 0) users[idx].password = password;
        }
    } else {
        // Check if username or email already exist
        if (users.some(u => u.username === username)) {
            alert('El nombre de usuario ya existe.');
            return;
        }
        if (users.some(u => u.email === email)) {
            alert('El correo ya está registrado.');
            return;
        }
        
        users.push({
            id: getNextId(),
            name,
            email,
            username,
            password,
            role,
            status,
            lastLogin: '-'
        });
    }
    
    localStorage.setItem('system_users', JSON.stringify(users));
    updateUsersTable();
    closeModalById('userModal');
    document.getElementById('userForm').reset();
    alert('Usuario guardado exitosamente');
}

// Search users
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchUsers');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = users.filter(u => 
                u.name.toLowerCase().includes(term) ||
                u.username.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term)
            );
            
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';
            
            filtered.forEach(u => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${u.id}</strong></td>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.username}</td>
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td>
                        <span class="badge ${u.status === 'activo' ? 'active' : 'inactive'}">
                            ${u.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>${u.lastLogin || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action edit" onclick="editUser(${u.id})">✏️</button>
                            <button class="btn-action delete" onclick="deleteUser(${u.id})">🗑️</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
    }
});
