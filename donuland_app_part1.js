/* ========================================
   DONULAND MANAGEMENT SYSTEM - APP.JS ČÁST 1
   Základní konfigurace, globální proměnné, inicializace
   ======================================== */

// ========================================
// GLOBÁLNÍ KONFIGURACE
// ========================================

const CONFIG = {
    // API klíče a URL
    SHEETS_URL: 'https://docs.google.com/spreadsheets/d/1LclCz9hb0hlb1D92OyVqk6Cbam7PRK6KgAzGgiGs6iE/edit?usp=sharing',
    WEATHER_API_KEY: 'c2fb0e86623880dc86162892b0fd9c95',
    MAPS_API_KEY: 'AIzaSyBTTA_MKa6FrxKpkcd7c5-d3FnC6FBLVTc',
    
    // Business parametry
    DONUT_PRICE: 50,
    DONUT_COST: 32,
    FRANCHISE_PRICE: 52,
    HOURLY_WAGE: 150,
    WORK_HOURS: 10,
    FUEL_COST: 15,
    
    // Predikční faktory
    CATEGORY_FACTORS: {
        'food festival': 0.15,
        'veletrh': 0.18,
        'koncert': 0.08,
        'kulturní akce': 0.12,
        'sportovní': 0.10,
        'ostatní': 0.10
    },
    
    CITY_FACTORS: {
        'praha': 1.3,
        'brno': 1.2,
        'ostrava': 1.0,
        'plzeň': 0.9,
        'liberec': 0.8,
        'olomouc': 0.85,
        'default': 0.85
    },
    
    COMPETITION_FACTORS: {
        1: 1.2,  // Malá konkurence
        2: 1.0,  // Střední konkurence
        3: 0.7   // Velká konkurence
    }
};

// ========================================
// GLOBÁLNÍ PROMĚNNÉ
// ========================================

const globalData = {
    historicalData: [],
    weatherCache: new Map(),
    distanceCache: new Map(),
    isLoading: false,
    lastDataLoad: null
};

// ========================================
// INICIALIZACE APLIKACE
// ========================================

// Loading screen a inicializace
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍩 Donuland Management System - Start');
    
    // Načtení uložených nastavení
    loadSettings();
    
    // Inicializace UI
    initializeUI();
    
    // Skrytí loading screen po 3 sekundách
    setTimeout(() => {
        hideLoadingScreen();
        // Automatické načtení dat po dalších 2 sekundách
        setTimeout(() => {
            if (globalData.historicalData.length === 0) {
                loadData().catch(() => {
                    console.log('Automatické načtení dat selhalo');
                });
            }
        }, 2000);
    }, 3000);
});

// Skrytí loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loadingScreen && mainApp) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainApp.style.display = 'block';
            mainApp.classList.add('fade-in');
        }, 500);
    }
}

// Inicializace UI elementů
function initializeUI() {
    console.log('🔧 Inicializuji UI...');
    
    // Navigace mezi sekcemi
    initializeNavigation();
    
    // Event listenery pro formuláře
    initializeFormListeners();
    
    // Nastavení výchozích hodnot
    setDefaultValues();
    
    // Inicializace kalendáře
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }
}

// Navigace mezi sekcemi
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section');
            showSection(sectionId);
            
            // Aktualizace aktivního tlačítka
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Speciální akce pro jednotlivé sekce
            if (sectionId === 'calendar' && typeof renderCalendar === 'function') {
                renderCalendar();
            } else if (sectionId === 'analytics' && typeof loadAnalytics === 'function') {
                loadAnalytics();
            }
        });
    });
}

// Zobrazení konkrétní sekce
function showSection(sectionId) {
    // Skrytí všech sekcí
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Zobrazení vybrané sekce
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.classList.add('fade-in');
    }
}

// Event listenery pro formuláře
function initializeFormListeners() {
    // Event listener pro změnu typu akce (indoor/outdoor)
    const eventTypeSelect = document.getElementById('eventType');
    if (eventTypeSelect) {
        eventTypeSelect.addEventListener('change', updateWeatherCard);
    }
    
    // Event listener pro změnu business modelu
    const businessModelSelect = document.getElementById('businessModel');
    if (businessModelSelect) {
        businessModelSelect.addEventListener('change', updateBusinessInfo);
    }
    
    // Event listener pro změnu typu nájmu
    const rentTypeSelect = document.getElementById('rentType');
    if (rentTypeSelect) {
        rentTypeSelect.addEventListener('change', updateRentFields);
    }
}

// Nastavení výchozích hodnot
function setDefaultValues() {
    // Nastavení dnešního data + 7 dní jako výchozí
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        eventDateInput.value = nextWeek.toISOString().split('T')[0];
    }
    
    // Nastavení výchozí ceny
    const priceInput = document.getElementById('price');
    if (priceInput && !priceInput.value) {
        priceInput.value = CONFIG.DONUT_PRICE;
    }
}

// ========================================
// NAČÍTÁNÍ DAT Z GOOGLE SHEETS
// ========================================

// Hlavní funkce pro načtení dat
async function loadData() {
    console.log('📊 Načítám historická data...');
    
    if (globalData.isLoading) {
        console.log('⏳ Načítání již probíhá...');
        return;
    }
    
    globalData.isLoading = true;
    updateStatus('loading', 'Načítám data...');
    updateLoadButton('loading');
    
    try {
        const sheetsUrl = document.getElementById('sheetsUrl').value || CONFIG.SHEETS_URL;
        const sheetId = extractSheetId(sheetsUrl);
        
        if (!sheetId) {
            throw new Error('Neplatné Google Sheets URL');
        }
        
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`;
        
        console.log('🔗 Stahuji data z:', csvUrl);
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!data.contents) {
            throw new Error('Prázdná odpověď ze serveru');
        }
        
        // Parsování CSV dat
        const parsedData = parseCSVData(data.contents);
        
        if (parsedData.length === 0) {
            throw new Error('Žádná validní data nebyla nalezena');
        }
        
        // Uložení dat
        globalData.historicalData = parsedData;
        globalData.lastDataLoad = new Date();
        
        console.log(`✅ Načteno ${parsedData.length} záznamů`);
        
        // Aktualizace UI
        updateDataLists();
        updateStatus('online', `${parsedData.length} záznamů načteno`);
        updateLoadButton('success');
        showNotification('✅ Data úspěšně načtena', 'success');
        
        // Aktualizace predikce pokud jsou vyplněná data
        const eventName = document.getElementById('eventName').value;
        if (eventName && eventName.trim()) {
            updatePrediction();
        }
        
    } catch (error) {
        console.error('❌ Chyba při načítání dat:', error);
        updateStatus('offline', `Chyba: ${error.message}`);
        updateLoadButton('error');
        showNotification(`❌ Chyba při načítání: ${error.message}`, 'error');
    } finally {
        globalData.isLoading = false;
    }
}

// Extrakce Sheet ID z Google Sheets URL
function extractSheetId(url) {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

// Parsování CSV dat
function parseCSVData(csvText) {
    console.log('📝 Parsuji CSV data...');
    
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // První řádek obsahuje hlavičky
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    // Parsování dat (přeskočení hlavičky)
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue;
        
        // Vytvoření objektu s mapováním na písmena sloupců (A, B, C...)
        const row = {};
        values.forEach((value, index) => {
            const columnLetter = String.fromCharCode(65 + index); // A=65, B=66, ...
            row[columnLetter] = value ? value.trim() : '';
        });
        
        // Kontrola, zda řádek obsahuje alespoň nějaká data
        const hasData = Object.values(row).some(val => val && val.length > 0);
        if (hasData) {
            data.push(row);
        }
    }
    
    console.log(`📋 Parsováno ${data.length} řádků dat`);
    return data;
}

// Parsování jednotlivého řádku CSV
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Přeskočí další uvozovku
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// ========================================
// AKTUALIZACE UI ELEMENTŮ
// ========================================

// Aktualizace status indikátoru
function updateStatus(status, message) {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;
    
    statusEl.className = `status ${status}`;
    statusEl.innerHTML = `
        <span class="status-dot"></span>
        <span>${message}</span>
    `;
}

// Aktualizace load tlačítka
function updateLoadButton(state) {
    const loadBtn = document.getElementById('loadBtn');
    if (!loadBtn) return;
    
    switch (state) {
        case 'loading':
            loadBtn.innerHTML = '⏳ Načítám...';
            loadBtn.parentElement.disabled = true;
            break;
        case 'success':
            loadBtn.innerHTML = '✅ Data načtena';
            loadBtn.parentElement.disabled = false;
            setTimeout(() => {
                loadBtn.innerHTML = '🔄 Načíst data';
            }, 2000);
            break;
        case 'error':
            loadBtn.innerHTML = '❌ Chyba';
            loadBtn.parentElement.disabled = false;
            setTimeout(() => {
                loadBtn.innerHTML = '🔄 Načíst data';
            }, 3000);
            break;
        default:
            loadBtn.innerHTML = '🔄 Načíst data';
            loadBtn.parentElement.disabled = false;
    }
}

// Aktualizace datalistů pro autocomplete
function updateDataLists() {
    if (!globalData.historicalData || globalData.historicalData.length === 0) return;
    
    console.log('🔄 Aktualizuji datalisty...');
    
    // Seznam názvů akcí
    const eventNames = new Set();
    const cities = new Set();
    
    globalData.historicalData.forEach(row => {
        // Názvy akcí (sloupec E)
        const eventName = row.E;
        if (eventName && eventName.trim()) {
            eventNames.add(eventName.trim());
        }
        
        // Města (sloupec D)
        const city = row.D;
        if (city && city.trim()) {
            cities.add(city.trim());
        }
    });
    
    // Aktualizace datalistu pro názvy akcí
    const eventNamesDatalist = document.getElementById('eventNames');
    if (eventNamesDatalist) {
        eventNamesDatalist.innerHTML = Array.from(eventNames)
            .sort()
            .map(name => `<option value="${escapeHtml(name)}">`)
            .join('');
    }
    
    // Aktualizace datalistu pro města
    const citiesDatalist = document.getElementById('cities');
    if (citiesDatalist) {
        const existingCities = ['Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Hradec Králové', 'Pardubice', 'České Budějovice', 'Ústí nad Labem'];
        const allCities = new Set([...existingCities, ...cities]);
        
        citiesDatalist.innerHTML = Array.from(allCities)
            .sort()
            .map(city => `<option value="${escapeHtml(city)}">`)
            .join('');
    }
    
    console.log(`✅ Aktualizovány datalisty: ${eventNames.size} akcí, ${cities.size} měst`);
}

// ========================================
// NOTIFIKACE
// ========================================

// Zobrazení notifikace
function showNotification(message, type = 'info', duration = 5000) {
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">&times;</button>
    `;
    
    notificationsContainer.appendChild(notification);
    
    // Animace zobrazení
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Automatické zavření
    if (duration > 0) {
        setTimeout(() => closeNotification(notification.querySelector('.notification-close')), duration);
    }
}

// Ikony pro notifikace
function getNotificationIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Zavření notifikace
function closeNotification(closeButton) {
    const notification = closeButton.closest('.notification');
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// ========================================
// HELPER FUNKCE
// ========================================

// Escape HTML pro bezpečnost
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Formátování čísel
function formatNumber(number) {
    return new Intl.NumberFormat('cs-CZ').format(number);
}

// Formátování měny
function formatCurrency(amount) {
    return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        minimumFractionDigits: 0
    }).format(amount);
}

// Formátování data
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toLocaleDateString('cs-CZ');
}

// Validace formuláře
function validateForm() {
    const requiredFields = [
        { id: 'eventName', name: 'Název akce' },
        { id: 'category', name: 'Kategorie' },
        { id: 'city', name: 'Město' },
        { id: 'eventDate', name: 'Datum akce' },
        { id: 'visitors', name: 'Návštěvnost' },
        { id: 'competition', name: 'Konkurence' },
        { id: 'eventType', name: 'Typ akce' },
        { id: 'businessModel', name: 'Business model' },
        { id: 'rentType', name: 'Typ nájmu' }
    ];
    
    const errors = [];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value || element.value.trim() === '') {
            errors.push(field.name);
            if (element) element.classList.add('error');
        } else if (element) {
            element.classList.remove('error');
        }
    });
    
    return errors;
}

console.log('✅ App.js část 1 načtena - základní struktura');
