/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 1
   Core systém, globální objekty, inicializace
   ======================================== */

console.log('🍩 Donuland Part 1 loading...');

// ========================================
// GLOBÁLNÍ KONFIGURACE
// ========================================

const CONFIG = {
    // API klíče a URL - ověřené funkční
    SHEETS_URL: 'https://docs.google.com/spreadsheets/d/1LclCz9hb0hlb1D92OyVqk6Cbam7PRK6KgAzGgiGs6iE/edit?usp=sharing',
    WEATHER_API_KEY: 'c2fb0e86623880dc86162892b0fd9c95',
    MAPS_API_KEY: 'AIzaSyBTTA_MKa6FrxKpkcd7c5-d3FnC6FBLVTc',
    
    // Business parametry
    DONUT_PRICE: 110,
    DONUT_COST: 32,
    FRANCHISE_PRICE: 52,
    HOURLY_WAGE: 150,
    WORK_HOURS: 10,
    FUEL_COST: 15,
    
    // Predikční faktory pro AI
    CATEGORY_FACTORS: {
        'food festival': 0.15,      // 15% konverze
        'veletrh': 0.18,           // 18% konverze (nejlepší)
        'koncert': 0.08,           // 8% konverze (nejhorší)
        'kulturní akce': 0.12,     // 12% konverze
        'sportovní': 0.10,         // 10% konverze
        'ostatní': 0.10            // 10% konverze (default)
    },
    
    // Faktory podle měst
    CITY_FACTORS: {
        'praha': 1.3,              // Praha má 30% vyšší prodej
        'brno': 1.2,               // Brno má 20% vyšší prodej
        'ostrava': 1.0,            // Ostrava je baseline
        'plzeň': 0.9,              // Menší města mají nižší prodej
        'liberec': 0.8,
        'olomouc': 0.85,
        'default': 0.85            // Pro neznámá města
    },
    
    // Faktory podle konkurence
    COMPETITION_FACTORS: {
        1: 1.2,  // Malá konkurence = +20%
        2: 1.0,  // Střední konkurence = baseline
        3: 0.7   // Velká konkurence = -30%
    },
    
    // Limity pro predikci
    MIN_CONVERSION: 0.02,          // Minimálně 2% konverze
    MAX_CONVERSION: 0.40,          // Maximálně 40% konverze
    MIN_SALES: 20,                 // Minimálně 20 ks prodeje
    
    // Cache nastavení
    WEATHER_CACHE_TIME: 30 * 60 * 1000,  // 30 minut
    DISTANCE_CACHE_TIME: 24 * 60 * 60 * 1000,  // 24 hodin
    
    // Google Sheets sloupce (dle vaší struktury)
    SHEETS_COLUMNS: {
        DATE_FROM: 'B',         // Datum od
        DATE_TO: 'C',           // Datum do  
        CITY: 'D',              // Lokalita
        EVENT_NAME: 'E',        // Název akce
        CATEGORY: 'F',          // Kategorie
        SALES: 'N',             // Reálně prodáno (klíčové!)
        VISITORS: 'Q',          // Návštěvnost
        WEATHER: 'R',           // Počasí
        COMPETITION: 'W',       // Konkurence (1-3)
        RATING: 'X',            // Hodnocení (1-5)
        NOTES: 'Y'              // Poznámka
    }
};

// ========================================
// GLOBÁLNÍ STAV APLIKACE
// ========================================

const globalState = {
    // Data a cache
    historicalData: [],
    weatherCache: new Map(),
    distanceCache: new Map(),
    googleMapsLoaded: false,
    
    // Loading stavy
    isLoading: false,
    isLoadingWeather: false,
    isLoadingPrediction: false,
    isLoadingDistance: false,
    
    // Metadata
    lastDataLoad: null,
    dataLoadAttempts: 0,
    
    // UI stavy
    currentSection: 'prediction',
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    
    // Formulář data
    lastFormData: null,
    lastPrediction: null,
    
    // Google Maps objekty
    autocomplete: null,
    placesService: null,
    distanceService: null,
    
    // Chyby a logy
    errors: [],
    debugMode: false
};

// ========================================
// EVENT BUS PRO KOMUNIKACI MEZI KOMPONENTY
// ========================================

const eventBus = {
    events: new Map(),
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    },
    
    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event ${event}:`, error);
                    globalState.errors.push({
                        type: 'event',
                        event: event,
                        message: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }
    },
    
    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
};

// ========================================
// UTILITY FUNKCE
// ========================================

// Debounce funkce pro omezení počtu volání
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle funkce pro omezení frekvence volání
function throttle(func, wait) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, wait);
        }
    };
}

// Formátování čísel pro české prostředí
function formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) {
        return '0';
    }
    return new Intl.NumberFormat('cs-CZ').format(Math.round(number));
}

// Formátování měny
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0 Kč';
    }
    return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(amount));
}

// Formátování data
function formatDate(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
        return '';
    }
    
    return date.toLocaleDateString('cs-CZ');
}

// Formátování času
function formatTime(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
        return '';
    }
    
    return date.toLocaleTimeString('cs-CZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Escape HTML pro bezpečnost
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Odstranění diakritiky pro porovnávání
function removeDiacritics(str) {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Generování unikátního ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Deep clone objektu
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
}

// ========================================
// VALIDACE A FORMS
// ========================================

// Validace povinných polí
function validateRequiredFields() {
    const requiredFields = [
        'eventName', 'category', 'city', 'eventDateFrom', 'eventDateTo', 
        'visitors', 'competition', 'eventType', 'businessModel', 'rentType'
    ];
    
    let allValid = true;
    const errors = [];
    
    requiredFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            const value = element.value.trim();
            
            if (!value) {
                allValid = false;
                element.classList.add('error');
                errors.push(`${fieldId} je povinné pole`);
            } else {
                element.classList.remove('error');
            }
        }
    });
    
    // Speciální validace - datum do >= datum od
    const dateFrom = document.getElementById('eventDateFrom').value;
    const dateTo = document.getElementById('eventDateTo').value;
    
    if (dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom)) {
        allValid = false;
        document.getElementById('eventDateTo').classList.add('error');
        errors.push('Datum do musí být stejné nebo pozdější než datum od');
    }
    
    // Validace návštěvnosti
    const visitors = parseInt(document.getElementById('visitors').value);
    if (visitors && (visitors < 50 || visitors > 100000)) {
        allValid = false;
        document.getElementById('visitors').classList.add('error');
        errors.push('Návštěvnost musí být mezi 50 a 100 000');
    }
    
    return { valid: allValid, errors: errors };
}

// Sběr dat z formuláře
function gatherFormData() {
    const formData = {
        // Základní údaje
        eventName: document.getElementById('eventName').value.trim(),
        category: document.getElementById('category').value,
        city: document.getElementById('city').value.trim(),
        eventDateFrom: document.getElementById('eventDateFrom').value,
        eventDateTo: document.getElementById('eventDateTo').value,
        visitors: parseInt(document.getElementById('visitors').value) || 0,
        competition: parseInt(document.getElementById('competition').value) || 2,
        eventType: document.getElementById('eventType').value,
        businessModel: document.getElementById('businessModel').value,
        rentType: document.getElementById('rentType').value,
        
        // Náklady
        price: parseFloat(document.getElementById('price').value) || CONFIG.DONUT_PRICE,
        fixedRent: parseFloat(document.getElementById('fixedRent').value) || 0,
        percentage: parseFloat(document.getElementById('percentage').value) || 0,
        mixedFixed: parseFloat(document.getElementById('mixedFixed').value) || 0,
        mixedPercentage: parseFloat(document.getElementById('mixedPercentage').value) || 0,
        
        // Automaticky vypočítané
        distance: document.getElementById('distance').value || '0 km',
        
        // Metadata
        timestamp: new Date().toISOString(),
        multiDay: null // Bude vypočítáno
    };
    
    // Vypočítat jestli je vícedenní
    if (formData.eventDateFrom && formData.eventDateTo) {
        const daysDiff = Math.ceil((new Date(formData.eventDateTo) - new Date(formData.eventDateFrom)) / (1000 * 60 * 60 * 24));
        formData.multiDay = daysDiff > 0;
        formData.durationDays = daysDiff + 1; // +1 protože i stejný den = 1 den
    }
    
    return formData;
}

// ========================================
// NOTIFIKACE SYSTÉM
// ========================================

let notificationCounter = 0;

function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notifications') || createNotificationContainer();
    
    const notificationId = `notification-${++notificationCounter}`;
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.id = notificationId;
    
    // Ikony podle typu
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const icon = icons[type] || icons.info;
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <div class="notification-title">${type.toUpperCase()}</div>
            <div class="notification-message">${escapeHtml(message)}</div>
        </div>
        <button class="notification-close" onclick="closeNotification('${notificationId}')">&times;</button>
    `;
    
    container.appendChild(notification);
    
    // Animace zobrazení
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Automatické zavření
    if (duration > 0) {
        setTimeout(() => {
            closeNotification(notificationId);
        }, duration);
    }
    
    console.log(`📢 Notification: ${type} - ${message}`);
    
    // Emit event
    eventBus.emit('notificationShown', { type, message, duration });
    
    return notificationId;
}

// Vytvoření kontejneru pro notifikace
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
}

// Zavření notifikace
function closeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }
}

// ========================================
// STATUS MANAGEMENT
// ========================================

// Aktualizace status indikátoru
function updateStatus(status, message) {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;
    
    // Odstranění všech status tříd
    statusEl.className = 'status';
    statusEl.classList.add(status);
    
    // Aktualizace obsahu
    statusEl.innerHTML = `
        <span class="status-dot"></span>
        <span>${escapeHtml(message)}</span>
    `;
    
    console.log(`📊 Status updated: ${status} - ${message}`);
    
    // Emit event pro jiné komponenty
    eventBus.emit('statusChanged', { status, message, timestamp: Date.now() });
}

// Aktualizace load tlačítka
function updateLoadButton(state, customText = null) {
    const loadBtn = document.getElementById('loadBtn');
    const parentButton = loadBtn ? loadBtn.parentElement : null;
    
    if (!loadBtn || !parentButton) return;
    
    switch (state) {
        case 'loading':
            loadBtn.innerHTML = '⏳ Načítám...';
            parentButton.disabled = true;
            parentButton.classList.add('loading');
            break;
            
        case 'success':
            loadBtn.innerHTML = '✅ Data načtena';
            parentButton.disabled = false;
            parentButton.classList.remove('loading');
            
            // Návrat na původní text po 3 sekundách
            setTimeout(() => {
                if (loadBtn.innerHTML === '✅ Data načtena') {
                    loadBtn.innerHTML = '🔄 Načíst data';
                }
            }, 3000);
            break;
            
        case 'error':
            loadBtn.innerHTML = '❌ Chyba při načítání';
            parentButton.disabled = false;
            parentButton.classList.remove('loading');
            
            // Návrat na původní text po 4 sekundách
            setTimeout(() => {
                if (loadBtn.innerHTML === '❌ Chyba při načítání') {
                    loadBtn.innerHTML = '🔄 Načíst data';
                }
            }, 4000);
            break;
            
        case 'custom':
            if (customText) {
                loadBtn.innerHTML = customText;
                parentButton.disabled = false;
                parentButton.classList.remove('loading');
            }
            break;
            
        default:
            loadBtn.innerHTML = '🔄 Načíst data';
            parentButton.disabled = false;
            parentButton.classList.remove('loading');
    }
}

// ========================================
// LOADING MANAGEMENT
// ========================================

// Zobrazení/skrytí loading overlay
function showLoadingOverlay(text = 'Načítám data...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    if (overlay) {
        if (loadingText) loadingText.textContent = text;
        overlay.style.display = 'flex';
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Skrytí loading screen
function hideLoadingScreen() {
    console.log('🎬 Hiding loading screen...');
    
    const loadingScreen = document.getElementById('loadingScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loadingScreen && mainApp) {
        // Fade out loading screen
        loadingScreen.style.opacity = '0';
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainApp.style.display = 'block';
            mainApp.classList.add('fade-in');
            
            // Emit event o dokončení načtení
            eventBus.emit('appLoaded', { timestamp: Date.now() });
            
            console.log('✅ App is now visible and ready');
        }, 500);
    }
}

// ========================================
// INICIALIZACE CORE SYSTÉMU
// ========================================

// Hlavní inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍩 Donuland Management System - Starting...');
    console.log('📅 Current date:', new Date().toLocaleDateString('cs-CZ'));
    
    try {
        // 1. Inicializace základních komponent
        initializeCore();
        
        // 2. Načtení uložených nastavení
        loadSettings();
        
        // 3. Inicializace UI elementů
        initializeUI();
        
        // 4. Setup event listenerů
        setupEventListeners();
        
        // 5. Spuštění loading sekvence
        startLoadingSequence();
        
        console.log('✅ Application initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        showNotification('Chyba při inicializaci aplikace', 'error');
        globalState.errors.push({
            type: 'initialization',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
});

// Inicializace základních komponent
function initializeCore() {
    console.log('🔧 Initializing core components...');
    
    // Kontrola požadovaných HTML elementů
    const requiredElements = [
        'loadingScreen', 'mainApp', 'status', 'predictionResults',
        'eventName', 'category', 'city', 'eventDateFrom', 'eventDateTo', 'visitors',
        'competition', 'eventType', 'businessModel', 'rentType'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        throw new Error(`Missing required HTML elements: ${missingElements.join(', ')}`);
    }
    
    // Nastavení výchozích hodnot
    setDefaultFormValues();
    
    // Inicializace cache storage
    initializeCache();
    
    // Setup debug režimu
    if (window.location.search.includes('debug=true')) {
        globalState.debugMode = true;
        console.log('🐛 Debug mode enabled');
    }
    
    console.log('✅ Core components initialized');
}

// Nastavení výchozích hodnot formuláře
function setDefaultFormValues() {
    console.log('📝 Setting default form values...');
    
    // Datum akce - 7 dní do budoucna
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dateString = nextWeek.toISOString().split('T')[0];
    
    const eventDateFromInput = document.getElementById('eventDateFrom');
    const eventDateToInput = document.getElementById('eventDateTo');
    
    if (eventDateFromInput && !eventDateFromInput.value) {
        eventDateFromInput.value = dateString;
    }
    if (eventDateToInput && !eventDateToInput.value) {
        eventDateToInput.value = dateString; // Stejné datum pro jednodenní akci
    }
    
    // Výchozí cena donut
    const priceInput = document.getElementById('price');
    if (priceInput && !priceInput.value) {
        priceInput.value = CONFIG.DONUT_PRICE;
    }
    
    console.log('✅ Default form values set');
}

// Inicializace cache systému
function initializeCache() {
    console.log('💾 Initializing cache system...');
    
    // Vyčištění starých cache dat
    const now = Date.now();
    
    // Kontrola weather cache
    for (const [key, data] of globalState.weatherCache.entries()) {
        if (now - data.timestamp > CONFIG.WEATHER_CACHE_TIME) {
            globalState.weatherCache.delete(key);
        }
    }
    
    // Kontrola distance cache
    for (const [key, data] of globalState.distanceCache.entries()) {
        if (now - data.timestamp > CONFIG.DISTANCE_CACHE_TIME) {
            globalState.distanceCache.delete(key);
        }
    }
    
    console.log(`💾 Cache initialized - Weather: ${globalState.weatherCache.size}, Distance: ${globalState.distanceCache.size}`);
}

// ========================================
// UI INICIALIZACE
// ========================================

// Inicializace uživatelského rozhraní
function initializeUI() {
    console.log('🎨 Initializing UI components...');
    
    // Inicializace navigace
    initializeNavigation();
    
    // Inicializace formulářových prvků
    initializeFormElements();
    
    // Nastavení aktuálního měsíce v kalendáři
    updateCurrentMonthDisplay();
    
    // Inicializace status indikátoru
    updateStatus('offline', 'Systém inicializován');
    
    // Skrytí weather karty (dokud není outdoor akce)
    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.style.display = 'none';
    }
    
    // Skrytí historických dat (dokud nejsou načtena)
    const historicalCard = document.getElementById('historicalCard');
    if (historicalCard) {
        historicalCard.style.display = 'none';
    }
    
    console.log('✅ UI components initialized');
}

// Inicializace navigace mezi sekcemi
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = button.getAttribute('data-section');
            
            if (sectionId && sectionId !== globalState.currentSection) {
                showSection(sectionId);
                
                // Aktualizace aktivního tlačítka
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Uložení aktuální sekce
                globalState.currentSection = sectionId;
                
                // Emit event pro jiné komponenty
                eventBus.emit('sectionChanged', { section: sectionId });
                
                console.log(`📍 Switched to section: ${sectionId}`);
            }
        });
    });
}

// Zobrazení konkrétní sekce
function showSection(sectionId) {
    console.log(`🔄 Showing section: ${sectionId}`);
    
    // Skrytí všech sekcí
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Zobrazení vybrané sekce s animací
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.classList.add('fade-in');
        
        // Speciální akce pro jednotlivé sekce
        switch (sectionId) {
            case 'calendar':
                // Bude implementováno v part4
                eventBus.emit('calendarRequested');
                break;
            case 'analytics':
                // Bude implementováno v part4
                eventBus.emit('analyticsRequested');
                break;
            case 'settings':
                // Bude implementováno v part5
                eventBus.emit('settingsRequested');
                break;
        }
    } else {
        console.error(`❌ Section not found: ${sectionId}`);
    }
}

// Inicializace formulářových prvků
function initializeFormElements() {
    console.log('📝 Initializing form elements...');
    
    // Přidání change listenerů pro automatickou predikci
    const formElements = [
        'eventName', 'category', 'city', 'eventDateFrom', 'eventDateTo', 'visitors',
        'competition', 'eventType', 'businessModel', 'rentType',
        'fixedRent', 'percentage', 'mixedFixed', 'mixedPercentage', 'price'
    ];
    
    formElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', debounce(() => {
                const validation = validateRequiredFields();
                if (validation.valid) {
                    // Trigger predikci - bude implementováno v part3
                    eventBus.emit('formChanged', gatherFormData());
                }
            }, 500));
            
            // Přidání focus/blur efektů
            element.addEventListener('focus', () => {
                element.parentElement.classList.add('focused');
            });
            
            element.addEventListener('blur', () => {
                element.parentElement.classList.remove('focused');
            });
        }
    });
    
    // Speciální handlery pro konkrétní prvky
    setupSpecialFormHandlers();
    
    console.log('✅ Form elements initialized');
}

// Setup speciálních form handlerů
function setupSpecialFormHandlers() {
    const eventTypeSelect = document.getElementById('eventType');
    if (eventTypeSelect) {
        eventTypeSelect.addEventListener('change', () => {
            updateWeatherCard();
            eventBus.emit('eventTypeChanged', { type: eventTypeSelect.value });
        });
    }
    
    const businessModelSelect = document.getElementById('businessModel');
    if (businessModelSelect) {
        businessModelSelect.addEventListener('change', () => {
            updateBusinessInfo();
            eventBus.emit('businessModelChanged', { model: businessModelSelect.value });
        });
    }
    
    const rentTypeSelect = document.getElementById('rentType');
    if (rentTypeSelect) {
        rentTypeSelect.addEventListener('change', () => {
            updateRentFields();
            eventBus.emit('rentTypeChanged', { type: rentTypeSelect.value });
        });
    }
    
    const cityInput = document.getElementById('city');
    if (cityInput) {
        cityInput.addEventListener('change', () => {
            // Trigger distance calculation a weather - bude v part2
            eventBus.emit('cityChanged', { city: cityInput.value });
        });
    }
    
    // Auto-copy datum od do datum do
    const dateFromInput = document.getElementById('eventDateFrom');
    const dateToInput = document.getElementById('eventDateTo');
    
    if (dateFromInput && dateToInput) {
        dateFromInput.addEventListener('change', () => {
            if (!dateToInput.value || dateToInput.value < dateFromInput.value) {
                dateToInput.value = dateFromInput.value; // Auto-nastavit stejné datum
            }
            eventBus.emit('dateChanged');
        });
    }
}

// ========================================
// EVENT LISTENERS SETUP
// ========================================

// Nastavení globálních event listenerů
function setupEventListeners() {
    console.log('🎯 Setting up event listeners...');
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Window resize handler
    window.addEventListener('resize', debounce(handleWindowResize, 250));
    
    // Network status monitoring
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Before unload warning (pokud jsou neuložené změny)
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Click outside modal to close
    document.addEventListener('click', handleModalOutsideClick);
    
    // Error handling
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    console.log('✅ Event listeners configured');
}

// Keyboard shortcuts handler
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S - Uložit predikci
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (globalState.currentSection === 'prediction' && globalState.lastPrediction) {
            eventBus.emit('savePredictionRequested');
        }
    }
    
    // Ctrl/Cmd + E - Export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (globalState.currentSection === 'prediction' && globalState.lastPrediction) {
            eventBus.emit('exportPredictionRequested');
        }
    }
    
    // Escape - Zavřít modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl/Cmd + R - Reload data
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        eventBus.emit('dataReloadRequested');
    }
}

// Network status handlers
function handleOnlineStatus() {
    console.log('🌐 Network: Online');
    updateStatus('online', 'Online - připojeno');
    showNotification('🌐 Internetové připojení obnoveno', 'success', 3000);
    
    // Zkusit znovu načíst data pokud se nezdařilo offline
    if (globalState.historicalData.length === 0) {
        setTimeout(() => {
            eventBus.emit('dataReloadRequested');
        }, 1000);
    }
}

function handleOfflineStatus() {
    console.log('📡 Network: Offline');
    updateStatus('offline', 'Offline - bez připojení');
    showNotification('📡 Ztraceno internetové připojení', 'warning', 5000);
}

// Visibility change handler
function handleVisibilityChange() {
    if (document.hidden) {
        console.log('👁️ Page hidden');
    } else {
        console.log('👁️ Page visible');
        
        // Zkontrolovat, zda nejsou data starší než 1 hodinu
        if (globalState.lastDataLoad) {
            const hourAgo = Date.now() - (60 * 60 * 1000);
            if (globalState.lastDataLoad < hourAgo) {
                console.log('📊 Data are old, refreshing...');
                eventBus.emit('dataReloadRequested');
            }
        }
    }
}

// Before unload handler
function handleBeforeUnload(e) {
    // Pokud jsou neuložené změny v predikci, varovat uživatele
    if (globalState.lastPrediction && !globalState.lastPrediction.saved) {
        const message = 'Máte neuloženou predikci. Opravdu chcete opustit stránku?';
        e.returnValue = message;
        return message;
    }
}

// Modal outside click handler
function handleModalOutsideClick(e) {
    const modal = document.getElementById('eventModal');
    if (modal && modal.style.display === 'flex' && e.target === modal) {
        closeModal();
    }
}

// Global error handlers
function handleGlobalError(e) {
    console.error('🚨 Global error:', e.error);
    globalState.errors.push({
        type: 'javascript',
        message: e.error.message,
        stack: e.error.stack,
        timestamp: new Date().toISOString()
    });
    
    if (globalState.debugMode) {
        showNotification(`JS Error: ${e.error.message}`, 'error', 10000);
    }
}

function handleUnhandledRejection(e) {
    console.error('🚨 Unhandled promise rejection:', e.reason);
    globalState.errors.push({
        type: 'promise',
        message: e.reason.toString(),
        timestamp: new Date().toISOString()
    });
    
    if (globalState.debugMode) {
        showNotification(`Promise Error: ${e.reason}`, 'error', 10000);
    }
}

// Window resize handler
function handleWindowResize() {
    // Aktualizace layoutu pro kalendář a grafy
    if (globalState.currentSection === 'calendar') {
        eventBus.emit('calendarResizeRequested');
    }
    
    if (globalState.currentSection === 'analytics') {
        eventBus.emit('analyticsResizeRequested');
    }
}

// ========================================
// BUSINESS INFO A RENT FIELDS
// ========================================

// Aktualizace business info karty
function updateBusinessInfo() {
    const businessModel = document.getElementById('businessModel').value;
    const businessInfo = document.getElementById('businessInfo');
    
    if (!businessModel || !businessInfo) {
        if (businessInfo) businessInfo.style.display = 'none';
        return;
    }
    
    businessInfo.style.display = 'block';
    
    let html = '';
    
    switch (businessModel) {
        case 'owner':
            html = `
                <h4>🏪 Režim majitele</h4>
                <ul>
                    <li>Vy jako majitel + 2 brigádníci</li>
                    <li>Mzda: ${CONFIG.HOURLY_WAGE} Kč/hodina na osobu</li>
                    <li>Celý zisk zůstává vám</li>
                    <li><strong>Nejvyšší riziko, ale i nejvyšší zisk</strong></li>
                </ul>
            `;
            break;
            
        case 'employee':
            html = `
                <h4>👨‍💼 Režim zaměstnance</h4>
                <ul>
                    <li>Vy jako zaměstnanec + 1 brigádník</li>
                    <li>Mzda: ${CONFIG.HOURLY_WAGE} Kč/hodina</li>
                    <li>Dodatečně 5% z celkového obratu</li>
                    <li><strong>Střední riziko i zisk</strong></li>
                </ul>
            `;
            break;
            
        case 'franchise':
            html = `
                <h4>🤝 Franšízový režim</h4>
                <ul>
                    <li>Nákup donutů za ${CONFIG.FRANCHISE_PRICE} Kč/ks</li>
                    <li>Prodej za vámi stanovenou cenu</li>
                    <li>Bez mzdových nákladů pro vás</li>
                    <li><strong>Nejnižší riziko, ale i nejnižší zisk</strong></li>
                </ul>
            `;
            break;
    }
    
    businessInfo.innerHTML = html;
    console.log(`💼 Business model updated: ${businessModel}`);
}

// Aktualizace polí nájmu podle typu
function updateRentFields() {
    const rentType = document.getElementById('rentType').value;
    
    // Skrytí všech polí nájmu
    const rentFields = [
        'fixedRentGroup', 'percentageGroup', 
        'mixedFixedGroup', 'mixedPercentageGroup'
    ];
    
    rentFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.display = 'none';
        }
    });
    
    // Zobrazení relevantních polí podle typu
    switch (rentType) {
        case 'fixed':
            const fixedGroup = document.getElementById('fixedRentGroup');
            if (fixedGroup) fixedGroup.style.display = 'block';
            break;
            
        case 'percentage':
            const percentageGroup = document.getElementById('percentageGroup');
            if (percentageGroup) percentageGroup.style.display = 'block';
            break;
            
        case 'mixed':
            const mixedFixed = document.getElementById('mixedFixedGroup');
            const mixedPercentage = document.getElementById('mixedPercentageGroup');
            if (mixedFixed) mixedFixed.style.display = 'block';
            if (mixedPercentage) mixedPercentage.style.display = 'block';
            break;
            
        case 'free':
            // Pro zdarma nájem se nezobrazuje nic extra
            break;
    }
    
    console.log(`💰 Rent type changed to: ${rentType}`);
}

// Aktualizace weather karty podle typu akce
function updateWeatherCard() {
    const eventType = document.getElementById('eventType').value;
    const weatherCard = document.getElementById('weatherCard');
    
    if (!weatherCard) return;
    
    if (eventType === 'outdoor') {
        weatherCard.style.display = 'block';
        
        // Zkusit načíst počasí pokud jsou vyplněny city a date
        const city = document.getElementById('city').value;
        const dateFrom = document.getElementById('eventDateFrom').value;
        
        if (city && dateFrom) {
            eventBus.emit('weatherUpdateRequested', { city, date: dateFrom });
        }
    } else {
        weatherCard.style.display = 'none';
    }
    
    console.log(`🌤️ Event type changed to: ${eventType}`);
}

// ========================================
// KALENDÁŘ FUNKCE (ZÁKLADNÍ)
// ========================================

// Aktualizace zobrazení aktuálního měsíce
function updateCurrentMonthDisplay() {
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        const monthNames = [
            'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
            'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
        ];
        
        const monthName = monthNames[globalState.currentMonth];
        currentMonthElement.textContent = `${monthName} ${globalState.currentYear}`;
    }
}

// Změna měsíce v kalendáři
function changeMonth(direction) {
    globalState.currentMonth += direction;
    
    if (globalState.currentMonth > 11) {
        globalState.currentMonth = 0;
        globalState.currentYear++;
    } else if (globalState.currentMonth < 0) {
        globalState.currentMonth = 11;
        globalState.currentYear--;
    }
    
    updateCurrentMonthDisplay();
    
    // Aktualizace kalendáře pokud je aktivní
    if (globalState.currentSection === 'calendar') {
        eventBus.emit('calendarMonthChanged', { 
            month: globalState.currentMonth, 
            year: globalState.currentYear 
        });
    }
    
    console.log(`📅 Calendar changed to: ${globalState.currentMonth + 1}/${globalState.currentYear}`);
}

// Přechod na dnešní měsíc
function goToToday() {
    const today = new Date();
    globalState.currentMonth = today.getMonth();
    globalState.currentYear = today.getFullYear();
    
    updateCurrentMonthDisplay();
    
    if (globalState.currentSection === 'calendar') {
        eventBus.emit('calendarTodayRequested');
    }
    
    showNotification('📅 Přešli jste na aktuální měsíc', 'info', 2000);
}

// ========================================
// MODAL MANAGEMENT
// ========================================

// Zavření modalu
function closeModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'none';
        eventBus.emit('modalClosed');
    }
}

// Otevření modalu
function openModal(eventData = null) {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'flex';
        
        if (eventData) {
            // Naplnění dat do modalu
            const nameInput = document.getElementById('modalEventName');
            const dateFromInput = document.getElementById('modalEventDateFrom');
            const dateToInput = document.getElementById('modalEventDateTo');
            const cityInput = document.getElementById('modalEventCity');
            
            if (nameInput) nameInput.value = eventData.eventName || '';
            if (dateFromInput) dateFromInput.value = eventData.dateFrom || '';
            if (dateToInput) dateToInput.value = eventData.dateTo || '';
            if (cityInput) cityInput.value = eventData.city || '';
        }
        
        eventBus.emit('modalOpened', eventData);
    }
}

// ========================================
// LOADING SEKVENCE
// ========================================

// Spuštění loading sekvence
function startLoadingSequence() {
    console.log('⏳ Starting loading sequence...');
    
    // Zobrazení loading screen na 3 sekundy
    setTimeout(() => {
        hideLoadingScreen();
        
        // Po skrytí loading screen automaticky načíst data
        setTimeout(() => {
            if (globalState.historicalData.length === 0) {
                eventBus.emit('autoDataLoadRequested');
            }
        }, 1500);
        
    }, 3000);
}

// ========================================
// SETTINGS MANAGEMENT
// ========================================

// Načtení nastavení z localStorage
function loadSettings() {
    try {
        const saved = localStorage.getItem('donuland_settings');
        if (!saved) {
            console.log('📝 No saved settings found, using defaults');
            return;
        }
        
        const settings = JSON.parse(saved);
        
        // Aktualizace globální konfigurace
        if (settings.donutCost) CONFIG.DONUT_COST = settings.donutCost;
        if (settings.franchisePrice) CONFIG.FRANCHISE_PRICE = settings.franchisePrice;
        if (settings.hourlyWage) CONFIG.HOURLY_WAGE = settings.hourlyWage;
        if (settings.workHours) CONFIG.WORK_HOURS = settings.workHours;
        if (settings.fuelCost) CONFIG.FUEL_COST = settings.fuelCost;
        
        if (settings.categoryFactors) {
            Object.assign(CONFIG.CATEGORY_FACTORS, settings.categoryFactors);
        }
        
        if (settings.cityFactors) {
            Object.assign(CONFIG.CITY_FACTORS, settings.cityFactors);
        }
        
        console.log('✅ Settings loaded from localStorage');
        eventBus.emit('settingsLoaded', settings);
        
    } catch (error) {
        console.error('❌ Error loading settings:', error);
        globalState.errors.push({
            type: 'settings',
            message: 'Failed to load settings: ' + error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// ========================================
// GOOGLE MAPS CALLBACK
// ========================================

// Callback funkce pro Google Maps API
window.initGoogleMaps = function() {
    console.log('🗺️ Google Maps API loaded');
    globalState.googleMapsLoaded = true;
    
    try {
        // Inicializace autocomplete
        const cityInput = document.getElementById('city');
        if (cityInput && window.google && window.google.maps) {
            globalState.autocomplete = new google.maps.places.Autocomplete(cityInput, {
                types: ['(cities)'],
                componentRestrictions: { country: 'CZ' }
            });
            
            // Event listener pro výběr místa
            globalState.autocomplete.addListener('place_changed', () => {
                const place = globalState.autocomplete.getPlace();
                if (place.geometry) {
                    console.log('📍 Place selected:', place.name);
                    eventBus.emit('placeSelected', {
                        name: place.name,
                        location: place.geometry.location,
                        formattedAddress: place.formatted_address
                    });
                }
            });
            
            // Inicializace Distance Service
            globalState.distanceService = new google.maps.DistanceMatrixService();
            
            console.log('✅ Google Maps autocomplete initialized');
            showNotification('🗺️ Google Maps připojeny', 'success', 3000);
        }
        
    } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
        showNotification('❌ Chyba při inicializaci Google Maps', 'error');
        globalState.errors.push({
            type: 'google_maps',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
    
    eventBus.emit('googleMapsLoaded');
};

// ========================================
// DEBUG A MONITORING
// ========================================

// Debug informace pro vývojáře
if (typeof window !== 'undefined') {
    window.donulandDebug = {
        // Přístup ke globálnímu stavu
        getState: () => globalState,
        getConfig: () => CONFIG,
        
        // Cache management
        clearCache: () => {
            globalState.weatherCache.clear();
            globalState.distanceCache.clear();
            console.log('🧹 All cache cleared');
            showNotification('🧹 Cache vymazána', 'info', 2000);
        },
        
        // Logs
        getErrors: () => globalState.errors,
        clearErrors: () => {
            globalState.errors = [];
            console.log('🗑️ Error log cleared');
        },
        
        // Force reload
        forceReload: () => {
            globalState.historicalData = [];
            globalState.lastDataLoad = null;
            eventBus.emit('dataReloadRequested');
        },
        
        // Event bus testing
        testEvent: (eventName, data) => {
            eventBus.emit(eventName, data);
        },
        
        // Export debug info
        exportDebugInfo: () => {
            const debugInfo = {
                state: globalState,
                config: CONFIG,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            const blob = new Blob([JSON.stringify(debugInfo, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `donuland-debug-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };
}

// Performance monitoring
const performanceMonitor = {
    marks: new Map(),
    
    start(name) {
        this.marks.set(name, performance.now());
    },
    
    end(name) {
        const start = this.marks.get(name);
        if (start) {
            const duration = performance.now() - start;
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
            this.marks.delete(name);
            return duration;
        }
        return null;
    }
};

// ========================================
// PLACEHOLDER FUNKCE PRO DALŠÍ ČÁSTI
// ========================================

// Tyto funkce budou implementovány v dalších částech

// Data loading - part2.js
function loadData() {
    console.log('📊 loadData() - will be implemented in part2');
    eventBus.emit('dataLoadRequested');
    return Promise.resolve();
}

// ========================================
// FINALIZACE
// ========================================

// Event listener pro dokončení načtení
eventBus.on('appLoaded', () => {
    console.log('🎉 Donuland app fully loaded');
    
    // Nastavení network status
    if (navigator.onLine) {
        updateStatus('online', 'Online - připojeno');
    } else {
        updateStatus('offline', 'Offline - bez připojení');
    }
});

// Log dokončení části 1
console.log('✅ Donuland Part 1 loaded successfully');
console.log('🔧 Core systems: ✅ Config ✅ State ✅ Events ✅ UI ✅ Navigation');
console.log('📚 Debug: window.donulandDebug available');
console.log('⏳ Ready for Part 2: Data loading + API integration');

// Event pro signalizaci dokončení části 1
eventBus.emit('part1Loaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['core', 'ui', 'navigation', 'events', 'notifications', 'google-maps']
});
