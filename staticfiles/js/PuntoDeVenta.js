// Punto de Venta (map-only) Module
(function() {
    'use strict';

    let selectedStore = 1;
    let map = null;
    let markers = {};
    let previewMarker = null;
    let previewCoords = null;

    // Store locations with coordinates - default stores
    let storeLocations = [
        { id: 1, name: 'Local Centro', address: 'Calle Principal 123, Centro', phone: '+1 234 567 8900', hours: '09:00 - 21:00', lat: 40.7128, lng: -74.0060 },
        { id: 2, name: 'Local Norte', address: 'Avenida del Norte 456, Zona Norte', phone: '+1 234 567 8901', hours: '09:00 - 21:00', lat: 40.7614, lng: -73.9776 },
        { id: 3, name: 'Local Sur', address: 'Boulevard del Sur 789, Zona Sur', phone: '+1 234 567 8902', hours: '09:00 - 21:00', lat: 40.6895, lng: -74.0447 },
        { id: 4, name: 'Local Este', address: 'Avenida del Este 321, Zona Este', phone: '+1 234 567 8903', hours: '10:00 - 20:00', lat: 40.7505, lng: -73.9934 },
        { id: 5, name: 'Local Santiago - Plaza de Armas', address: 'Plaza de Armas, Santiago, Chile', phone: '+56 2 2345 6789', hours: '10:00 - 20:00', lat: -33.4378, lng: -70.6505 }
    ];

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        loadStoresFromStorage();
        initializeMap();
        renderStoreCards();
    });

    // Load stores from localStorage
    function loadStoresFromStorage() {
        const stored = localStorage.getItem('storeLocations');
        if (stored) {
            storeLocations = JSON.parse(stored);
        } else {
            localStorage.setItem('storeLocations', JSON.stringify(storeLocations));
        }
    }

    // Save stores to localStorage
    function saveStoresToStorage() {
        localStorage.setItem('storeLocations', JSON.stringify(storeLocations));
    }

    // Geocode address and preview on map
    window.geocodeAddress = async function() {
        const address = document.getElementById('storeAddress').value;
        
        if (!address) {
            alert('Por favor ingresa una dirección primero');
            return;
        }

        const statusDiv = document.getElementById('geocodeStatus');
        statusDiv.innerHTML = '🔍 Buscando ubicación...';
        statusDiv.style.color = '#ffc107';

        try {
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
            
            const response = await fetch(geocodeUrl, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.length === 0) {
                statusDiv.innerHTML = '❌ No se encontró la ubicación. Intenta con una dirección más específica.';
                statusDiv.style.color = '#dc3545';
                previewCoords = null;
                return;
            }

            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            const displayName = data[0].display_name;

            previewCoords = { lat, lng };

            // Show preview marker on map
            if (previewMarker) {
                map.removeLayer(previewMarker);
            }
            
            previewMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'preview-marker',
                    html: `<div style="background: #28a745; color: white; padding: 5px 10px; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">📍 Nuevo Local</div>`,
                    iconSize: [100, 30],
                    iconAnchor: [50, 15]
                })
            }).addTo(map);

            map.flyTo([lat, lng], 15, { duration: 1.5 });

            statusDiv.innerHTML = `✅ Ubicación encontrada: ${displayName.substring(0, 60)}...`;
            statusDiv.style.color = '#28a745';

        } catch (error) {
            console.error('Error geocodificando:', error);
            statusDiv.innerHTML = '❌ Error al buscar. Verifica tu conexión a internet.';
            statusDiv.style.color = '#dc3545';
            previewCoords = null;
        }
    };

    // Handle new store form submission
    window.handleStoreSubmit = async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('storeName').value;
        const address = document.getElementById('storeAddress').value;
        const phone = document.getElementById('storePhone').value || '';
        const hours = document.getElementById('storeHours').value || '09:00 - 21:00';

        if (!name || !address) {
            alert('Por favor completa el nombre y la dirección');
            return;
        }

        // If no preview coords, geocode first
        if (!previewCoords) {
            const statusDiv = document.getElementById('geocodeStatus');
            statusDiv.innerHTML = '🔍 Buscando ubicación...';
            statusDiv.style.color = '#ffc107';

            try {
                const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
                
                const response = await fetch(geocodeUrl, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.length === 0) {
                    alert('No se pudo encontrar la ubicación. Por favor, haz clic en "Buscar en Mapa" primero.');
                    statusDiv.innerHTML = '';
                    return;
                }

                previewCoords = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            } catch (error) {
                alert('Error al buscar la ubicación. Verifica tu conexión a internet.');
                return;
            }
        }

        const nextId = storeLocations.length > 0 ? Math.max(...storeLocations.map(s => s.id)) + 1 : 1;

        const newStore = {
            id: nextId,
            name: name,
            address: address,
            phone: phone,
            hours: hours,
            lat: previewCoords.lat,
            lng: previewCoords.lng
        };

        storeLocations.push(newStore);
        saveStoresToStorage();

        // Remove preview marker
        if (previewMarker) {
            map.removeLayer(previewMarker);
            previewMarker = null;
        }

        // Add permanent marker to map
        addMarkerToMap(newStore);
        
        // Re-render store cards
        renderStoreCards();

        // Reset form and coords
        document.getElementById('storeForm').reset();
        document.getElementById('geocodeStatus').innerHTML = '';
        previewCoords = null;
        
        alert(`✅ Punto de venta "${name}" agregado exitosamente`);
    };

    // Add a single marker to the map
    function addMarkerToMap(store) {
        const marker = L.circleMarker([store.lat, store.lng], {
            radius: 18,
            fillColor: '#3b82f6',
            color: '#2563eb',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(map);

        const popupContent = `
            <div class="popup-content">
                <div class="popup-title">${store.name}</div>
                <div class="popup-address">📍 ${store.address}</div>
                <div class="popup-phone">☎️ ${store.phone}</div>
                <div class="popup-phone">⏰ ${store.hours}</div>
            </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', function() { selectStore(store.id); });

        const label = L.divIcon({ 
            html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:50%;color:white;font-weight:bold;">${store.id}</div>`, 
            iconSize: [36,36], 
            className: 'custom-icon' 
        });
        L.marker([store.lat, store.lng], { icon: label }).addTo(map);

        markers[store.id] = marker;
        
        // Center map on new store
        map.setView([store.lat, store.lng], 13);
    }

    // Render store cards dynamically
    function renderStoreCards() {
        const container = document.getElementById('storeCardsContainer');
        if (!container) return;

        container.innerHTML = storeLocations.map(store => `
            <div class="store-card ${selectedStore === store.id ? 'selected' : ''}" onclick="selectStore(${store.id})">
                <div class="store-header ${selectedStore === store.id ? 'active' : ''}">
                    <span class="store-number">${store.id}</span>
                    <span class="store-badge">Activo</span>
                </div>
                <div class="store-name">${store.name}</div>
                <div class="store-address">📍 ${store.address}</div>
                <div class="store-info">
                    <span>☎️ ${store.phone || 'N/A'}</span><br>
                    <span>⏰ ${store.hours || 'N/A'}</span>
                </div>
                <button onclick="event.stopPropagation(); deleteStore(${store.id})" 
                        style="margin-top: 10px; padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                    🗑️ Eliminar
                </button>
            </div>
        `).join('');
    }

    // Delete store
    window.deleteStore = function(storeId) {
        if (confirm('¿Estás seguro de eliminar este punto de venta?')) {
            storeLocations = storeLocations.filter(s => s.id !== storeId);
            saveStoresToStorage();
            
            // Remove marker from map
            if (markers[storeId]) {
                map.removeLayer(markers[storeId]);
                delete markers[storeId];
            }
            
            renderStoreCards();
            alert('Punto de venta eliminado');
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeMap();
    });

    // Initialize Leaflet map (centered and restricted to Chile)
    function initializeMap() {
        // Chile approximate bounds (south, west) to (north, east)
        const chileBounds = L.latLngBounds([[-56.0, -76.0], [-17.0, -66.0]]);

        // Center map on Chile and restrict panning to country bounds
        map = L.map('map', {
            maxBounds: chileBounds,
            maxBoundsViscosity: 0.9,
            minZoom: 4,
            maxZoom: 16
        }).setView([-33.45, -70.6667], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        storeLocations.forEach(store => {
            const marker = L.circleMarker([store.lat, store.lng], {
                radius: 18,
                fillColor: '#3b82f6',
                color: '#2563eb',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(map);

            const popupContent = `
                <div class="popup-content">
                    <div class="popup-title">${store.name}</div>
                    <div class="popup-address">📍 ${store.address}</div>
                    <div class="popup-phone">☎️ ${store.phone}</div>
                    <div class="popup-phone">⏰ ${store.hours}</div>
                </div>
            `;

            marker.bindPopup(popupContent);
            marker.on('click', function() { selectStore(store.id); });

            const label = L.divIcon({ html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:50%;color:white;font-weight:bold;">${store.id}</div>`, iconSize: [36,36], className: 'custom-icon' });
            L.marker([store.lat, store.lng], { icon: label }).addTo(map);

            markers[store.id] = marker;
        });

        highlightStoreOnMap(selectedStore);
    }

    // Select store (called from HTML onclick or marker click)
    window.selectStore = function(storeId) {
        selectedStore = storeId;

        // Update cards UI (find by .store-number)
        document.querySelectorAll('.store-card').forEach(card => {
            card.classList.remove('selected');
            const numEl = card.querySelector('.store-number');
            if (numEl && String(numEl.textContent).trim() === String(storeId)) {
                card.classList.add('selected');
            }
        });

        // Update selected store info if present
        const store = storeLocations.find(s => s.id === storeId);
        if (store) {
            const infoDiv = document.getElementById('selectedStoreInfo');
            if (infoDiv) {
                infoDiv.style.display = 'block';
                const nameEl = document.getElementById('selectedStoreName');
                const addrEl = document.getElementById('selectedStoreAddress');
                if (nameEl) nameEl.textContent = store.name;
                if (addrEl) addrEl.textContent = store.address;
            }
        }

        // Center map
        if (map && store) {
            map.setView([store.lat, store.lng], 13);
        }

        highlightStoreOnMap(storeId);
    };

    function highlightStoreOnMap(storeId) {
        Object.keys(markers).forEach(id => {
            const marker = markers[id];
            if (!marker) return;
            if (String(id) === String(storeId)) {
                marker.setStyle({ fillColor: '#10b981', color: '#059669', weight: 4, fillOpacity: 1 });
            } else {
                marker.setStyle({ fillColor: '#3b82f6', color: '#2563eb', weight: 3, fillOpacity: 0.9 });
            }
        });
    }
})();

// Global UI helpers (profile, modals)
window.toggleProfileMenu = function() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('show');
};

document.addEventListener('click', function(e) {
    const profileWrapper = document.querySelector('.user-profile-wrapper');
    const dropdown = document.getElementById('userDropdown');
    if (profileWrapper && !profileWrapper.contains(e.target) && dropdown) dropdown.classList.remove('show');
});

function openUserProfile(event) { if (event) event.preventDefault(); const modal = document.getElementById('userProfileModal'); if (modal) modal.style.display = 'flex'; }
function openSettings(event) { if (event) event.preventDefault(); const modal = document.getElementById('settingsModal'); if (modal) modal.style.display = 'flex'; }
function closeModalById(id) { const modal = document.getElementById(id); if (modal) modal.style.display = 'none'; }
