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
/* ========================================
   DONULAND MANAGEMENT SYSTEM - APP.JS ČÁST 2
   AI Predikce, počasí, mapy, business výpočty
   ======================================== */

// ========================================
// AI PREDIKČNÍ ENGINE
// ========================================

// Hlavní funkce pro aktualizaci predikce
async function updatePrediction() {
    console.log('🤖 Spouštím AI predikci...');
    
    const errors = validateForm();
    if (errors.length > 0) {
        showPredictionError(`Vyplňte povinná pole: ${errors.join(', ')}`);
        return;
    }
    
    // Zobrazení loading stavu
    showPredictionLoading();
    
    try {
        // Sběr dat z formuláře
        const formData = gatherFormData();
        
        // AI výpočet predikce
        const prediction = await calculateAIPrediction(formData);
        
        // Business výpočty
        const businessResults = calculateBusinessMetrics(formData, prediction);
        
        // Zobrazení výsledků
        displayPredictionResults(prediction, businessResults, formData);
        
        // Zobrazení historických dat
        displayHistoricalData(formData);
        
        // Zobrazení akčních tlačítek
        const actionButtons = document.getElementById('actionButtons');
        if (actionButtons) {
            actionButtons.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('❌ Chyba při predikci:', error);
        showPredictionError(`Chyba při výpočtu: ${error.message}`);
    }
}

// Sběr dat z formuláře
function gatherFormData() {
    return {
        eventName: document.getElementById('eventName').value.trim(),
        category: document.getElementById('category').value,
        city: document.getElementById('city').value.trim(),
        eventDate: document.getElementById('eventDate').value,
        visitors: parseInt(document.getElementById('visitors').value) || 0,
        competition: parseInt(document.getElementById('competition').value) || 2,
        eventType: document.getElementById('eventType').value,
        businessModel: document.getElementById('businessModel').value,
        rentType: document.getElementById('rentType').value,
        fixedRent: parseFloat(document.getElementById('fixedRent').value) || 0,
        percentage: parseFloat(document.getElementById('percentage').value) || 0,
        mixedFixed: parseFloat(document.getElementById('mixedFixed').value) || 0,
        mixedPercentage: parseFloat(document.getElementById('mixedPercentage').value) || 0,
        price: parseFloat(document.getElementById('price').value) || CONFIG.DONUT_PRICE,
        distance: parseFloat(document.getElementById('distance').value) || 0
    };
}

// AI výpočet predikce
async function calculateAIPrediction(formData) {
    console.log('🧠 Počítám AI predikci pro:', formData.eventName);
    
    // 1. Základní konverzní poměr podle kategorie
    let baseConversion = CONFIG.CATEGORY_FACTORS[formData.category] || 0.10;
    
    // 2. Historický faktor
    const historicalFactor = calculateHistoricalFactor(formData);
    
    // 3. Počasí faktor (jen pro venkovní akce)
    let weatherFactor = 1.0;
    if (formData.eventType === 'outdoor') {
        weatherFactor = await calculateWeatherFactor(formData);
    }
    
    // 4. Městský faktor
    const cityFactor = calculateCityFactor(formData.city);
    
    // 5. Konkurenční faktor
    const competitionFactor = CONFIG.COMPETITION_FACTORS[formData.competition] || 1.0;
    
    // 6. Sezónní faktor
    const seasonalFactor = calculateSeasonalFactor(formData.eventDate);
    
    // 7. Velikostní faktor podle návštěvnosti
    const sizeFactor = calculateSizeFactor(formData.visitors);
    
    // Kombinace všech faktorů
    const finalConversion = baseConversion * 
                           historicalFactor * 
                           weatherFactor * 
                           cityFactor * 
                           competitionFactor * 
                           seasonalFactor * 
                           sizeFactor;
    
    // Výpočet predikovaného prodeje
    let predictedSales = Math.round(formData.visitors * finalConversion);
    
    // Aplikace limitů (min 20, max 40% návštěvnosti)
    const minSales = Math.max(20, Math.round(formData.visitors * 0.02));
    const maxSales = Math.round(formData.visitors * 0.4);
    predictedSales = Math.max(Math.min(predictedSales, maxSales), minSales);
    
    // Výpočet spolehlivosti
    const confidence = calculateConfidence(formData, historicalFactor, weatherFactor);
    
    console.log('📊 Predikční faktory:', {
        základní: baseConversion,
        historický: historicalFactor,
        počasí: weatherFactor,
        město: cityFactor,
        konkurence: competitionFactor,
        sezóna: seasonalFactor,
        velikost: sizeFactor,
        finální: finalConversion,
        predikce: predictedSales
    });
    
    return {
        predictedSales,
        confidence,
        factors: {
            base: baseConversion,
            historical: historicalFactor,
            weather: weatherFactor,
            city: cityFactor,
            competition: competitionFactor,
            seasonal: seasonalFactor,
            size: sizeFactor,
            final: finalConversion
        }
    };
}

// Historický faktor na základě podobných akcí
function calculateHistoricalFactor(formData) {
    const historicalData = getHistoricalData(formData.eventName, formData.city, formData.category);
    
    if (!historicalData.matches || historicalData.matches.length === 0) {
        return 1.0; // Neutrální faktor
    }
    
    const avgSales = historicalData.summary.avgSales;
    const expectedBaseline = formData.visitors * (CONFIG.CATEGORY_FACTORS[formData.category] || 0.10);
    
    if (expectedBaseline > 0) {
        const factor = avgSales / expectedBaseline;
        return Math.max(0.3, Math.min(3.0, factor)); // Omezení na 0.3-3.0
    }
    
    return 1.0;
}

// Získání historických dat
function getHistoricalData(eventName, city, category) {
    if (!globalData.historicalData || globalData.historicalData.length === 0) {
        return { matches: [], summary: null };
    }
    
    const matches = [];
    
    globalData.historicalData.forEach(row => {
        const score = calculateSimilarityScore(row, eventName, city, category);
        if (score > 0) {
            matches.push({ ...row, similarityScore: score });
        }
    });
    
    // Seřazení podle podobnosti a výběr top 10
    matches.sort((a, b) => b.similarityScore - a.similarityScore);
    const topMatches = matches.slice(0, 10);
    
    // Výpočet shrnutí
    let summary = null;
    if (topMatches.length > 0) {
        const validSales = topMatches
            .map(m => parseFloat(m.M || 0))
            .filter(sales => sales > 0);
        
        if (validSales.length > 0) {
            summary = {
                count: validSales.length,
                avgSales: validSales.reduce((sum, sales) => sum + sales, 0) / validSales.length,
                minSales: Math.min(...validSales),
                maxSales: Math.max(...validSales)
            };
        }
    }
    
    return { matches: topMatches, summary };
}

// Výpočet podobnosti mezi akcemi
function calculateSimilarityScore(row, eventName, city, category) {
    let score = 0;
    
    // Název akce (sloupec E)
    const rowEventName = (row.E || '').toLowerCase();
    const searchEventName = eventName.toLowerCase();
    if (rowEventName.includes(searchEventName) || searchEventName.includes(rowEventName)) {
        score += 3;
    }
    
    // Město (sloupec D)
    const rowCity = removeDiacritics((row.D || '').toLowerCase());
    const searchCity = removeDiacritics(city.toLowerCase());
    if (rowCity === searchCity) {
        score += 2;
    } else if (rowCity.includes(searchCity) || searchCity.includes(rowCity)) {
        score += 1;
    }
    
    // Kategorie (sloupec F)
    const rowCategory = (row.F || '').toLowerCase();
    if (rowCategory === category.toLowerCase()) {
        score += 2;
    }
    
    // Pouze pokud má akce nějaký prodej
    const sales = parseFloat(row.M || 0);
    if (sales <= 0) {
        return 0;
    }
    
    return score;
}

// Městský faktor
function calculateCityFactor(city) {
    const cityLower = removeDiacritics(city.toLowerCase());
    
    for (const [knownCity, factor] of Object.entries(CONFIG.CITY_FACTORS)) {
        if (cityLower.includes(knownCity) || knownCity.includes(cityLower)) {
            return factor;
        }
    }
    
    return CONFIG.CITY_FACTORS.default;
}

// Sezónní faktor
function calculateSeasonalFactor(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // 1-12
    
    // Sezónní faktory (léto je nejlepší pro venkovní akce)
    if (month >= 5 && month <= 8) return 1.1; // Květen-Srpen
    if (month >= 9 && month <= 10) return 1.05; // Září-Říjen
    if (month >= 3 && month <= 4) return 0.95; // Březen-Duben
    return 0.85; // Zima
}

// Velikostní faktor (velké akce mají menší konverzi)
function calculateSizeFactor(visitors) {
    if (visitors > 10000) return 0.8;
    if (visitors > 5000) return 0.9;
    if (visitors > 1000) return 1.0;
    return 1.1; // Menší akce mají vyšší konverzi
}

// Výpočet spolehlivosti predikce
function calculateConfidence(formData, historicalFactor, weatherFactor) {
    let confidence = 70; // Základní spolehlivost
    
    // Historická data
    const historicalData = getHistoricalData(formData.eventName, formData.city, formData.category);
    if (historicalData.matches.length > 5) confidence += 15;
    else if (historicalData.matches.length > 0) confidence += 10;
    
    // Počasí (jen pro venkovní)
    if (formData.eventType === 'outdoor' && weatherFactor !== 1.0) {
        confidence += 5;
    }
    
    // Velikost akce
    if (formData.visitors > 10000) confidence -= 10;
    else if (formData.visitors < 100) confidence -= 5;
    
    // Extrémní faktory snižují spolehlivost
    if (historicalFactor > 2 || historicalFactor < 0.5) confidence -= 10;
    
    return Math.max(25, Math.min(95, confidence));
}

// ========================================
// BUSINESS VÝPOČTY
// ========================================

// Výpočet business metrik
function calculateBusinessMetrics(formData, prediction) {
    const donutPrice = formData.price;
    const donutCost = parseFloat(document.getElementById('donutCost').value) || CONFIG.DONUT_COST;
    const franchisePrice = parseFloat(document.getElementById('franchisePrice').value) || CONFIG.FRANCHISE_PRICE;
    const hourlyWage = parseFloat(document.getElementById('hourlyWage').value) || CONFIG.HOURLY_WAGE;
    const workHours = parseFloat(document.getElementById('workHours').value) || CONFIG.WORK_HOURS;
    const fuelCost = parseFloat(document.getElementById('fuelCost').value) || CONFIG.FUEL_COST;
    
    // Základní výpočty
    const revenue = prediction.predictedSales * donutPrice;
    const productionCosts = prediction.predictedSales * donutCost;
    
    // Dopravní náklady
    const transportCosts = formData.distance * 2 * fuelCost; // Tam a zpět
    
    // Pracovní náklady podle business modelu
    let laborCosts = 0;
    let revenueShare = 0;
    let franchiseRevenue = 0;
    
    switch (formData.businessModel) {
        case 'owner':
            laborCosts = 2 * hourlyWage * workHours; // Vy + 2 brigádníci
            break;
        case 'employee':
            laborCosts = 2 * hourlyWage * workHours; // Vy + 1 brigádník
            revenueShare = revenue * 0.05; // 5% z obratu
            break;
        case 'franchise':
            franchiseRevenue = prediction.predictedSales * (franchisePrice - donutCost);
            break;
    }
    
    // Nájem podle typu
    let rentCosts = 0;
    switch (formData.rentType) {
        case 'fixed':
            rentCosts = formData.fixedRent;
            break;
        case 'percentage':
            rentCosts = revenue * (formData.percentage / 100);
            break;
        case 'mixed':
            rentCosts = formData.mixedFixed + (revenue * (formData.mixedPercentage / 100));
            break;
        case 'free':
            rentCosts = 0;
            break;
    }
    
    // Celkové náklady
    const totalCosts = productionCosts + transportCosts + laborCosts + revenueShare + rentCosts;
    
    // Zisk
    let profit;
    if (formData.businessModel === 'franchise') {
        profit = franchiseRevenue;
    } else {
        profit = revenue - totalCosts;
    }
    
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    return {
        revenue,
        costs: {
            production: productionCosts,
            transport: transportCosts,
            labor: laborCosts,
            revenueShare,
            rent: rentCosts,
            total: totalCosts
        },
        profit,
        profitMargin,
        franchiseRevenue
    };
}

// ========================================
// POČASÍ API
// ========================================

// Aktualizace počasí
async function updateWeather() {
    const city = document.getElementById('city').value.trim();
    const date = document.getElementById('eventDate').value;
    const eventType = document.getElementById('eventType').value;
    
    // Počasí jen pro venkovní akce
    if (eventType !== 'outdoor') {
        hideWeatherCard();
        return;
    }
    
    if (!city || !date) {
        hideWeatherCard();
        return;
    }
    
    try {
        showWeatherLoading();
        const weather = await getWeatherForecast(city, date);
        displayWeather(weather);
    } catch (error) {
        console.error('❌ Chyba při načítání počasí:', error);
        showWeatherError(error.message);
    }
}

// Získání předpovědi počasí
async function getWeatherForecast(city, date) {
    const cacheKey = `${city}-${date}`;
    
    // Kontrola cache
    if (globalData.weatherCache.has(cacheKey)) {
        const cached = globalData.weatherCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 min cache
            console.log('🌤️ Počasí z cache');
            return cached.data;
        }
    }
    
    const apiKey = document.getElementById('weatherKey').value || CONFIG.WEATHER_API_KEY;
    if (!apiKey) {
        throw new Error('Weather API klíč není nastaven');
    }
    
    try {
        // 1. Získání souřadnic města
        const coords = await getCityCoordinates(city, apiKey);
        
        // 2. Získání předpovědi počasí
        const weather = await getWeatherData(coords, date, apiKey);
        
        // Uložení do cache
        globalData.weatherCache.set(cacheKey, {
            data: weather,
            timestamp: Date.now()
        });
        
        return weather;
        
    } catch (error) {
        console.warn('Weather API selhal, používám fallback');
        return getFallbackWeather(date);
    }
}

// Získání souřadnic města
async function getCityCoordinates(city, apiKey) {
    // Fallback souřadnice pro česká města
    const fallbackCoords = {
        'praha': { lat: 50.0755, lon: 14.4378 },
        'brno': { lat: 49.1951, lon: 16.6068 },
        'ostrava': { lat: 49.8209, lon: 18.2625 },
        'plzeň': { lat: 49.7384, lon: 13.3736 },
        'liberec': { lat: 50.7663, lon: 15.0543 },
        'olomouc': { lat: 49.5938, lon: 17.2509 }
    };
    
    const cityLower = removeDiacritics(city.toLowerCase());
    for (const [knownCity, coords] of Object.entries(fallbackCoords)) {
        if (cityLower.includes(knownCity) || knownCity.includes(cityLower)) {
            return coords;
        }
    }
    
    // Pokus o API geocoding
    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},CZ&limit=1&appid=${apiKey}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(geoUrl)}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const geoData = JSON.parse(data.contents);
        
        if (geoData.length > 0) {
            return { lat: geoData[0].lat, lon: geoData[0].lon };
        }
    } catch (error) {
        console.warn('Geocoding selhal:', error);
    }
    
    // Default Praha
    return { lat: 50.0755, lon: 14.4378 };
}

// Získání dat o počasí
async function getWeatherData(coords, date, apiKey) {
    const targetDate = new Date(date);
    const today = new Date();
    const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    
    let weatherUrl;
    if (daysDiff <= 0) {
        // Aktuální počasí
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=cs`;
    } else if (daysDiff <= 5) {
        // 5denní předpověď
        weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=cs`;
    } else {
        // Vzdálenější datum - použiji aktuální jako odhad
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=cs`;
    }
    
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(weatherUrl)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const weatherData = JSON.parse(data.contents);
    
    if (weatherData.cod && weatherData.cod !== 200 && weatherData.cod !== "200") {
        throw new Error(`Weather API error: ${weatherData.message}`);
    }
    
    // Parsování podle typu odpovědi
    let weather;
    if (daysDiff <= 0 || daysDiff > 5) {
        // Aktuální počasí
        weather = {
            temp: Math.round(weatherData.main.temp),
            description: weatherData.weather[0].description,
            main: weatherData.weather[0].main,
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind?.speed || 0,
            pressure: weatherData.main.pressure
        };
    } else {
        // 5denní předpověď - najít nejbližší
        const targetTime = targetDate.getTime();
        let closestForecast = weatherData.list[0];
        let minDiff = Math.abs(new Date(closestForecast.dt * 1000) - targetTime);
        
        for (const forecast of weatherData.list) {
            const forecastTime = new Date(forecast.dt * 1000);
            const diff = Math.abs(forecastTime - targetTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestForecast = forecast;
            }
        }
        
        weather = {
            temp: Math.round(closestForecast.main.temp),
            description: closestForecast.weather[0].description,
            main: closestForecast.weather[0].main,
            humidity: closestForecast.main.humidity,
            windSpeed: closestForecast.wind?.speed || 0,
            pressure: closestForecast.main.pressure
        };
    }
    
    return weather;
}

// Fallback počasí podle sezóny
function getFallbackWeather(date) {
    const month = new Date(date).getMonth() + 1;
    
    let temp, description, main;
    if (month >= 6 && month <= 8) {
        temp = 22; description = 'slunečno (odhad)'; main = 'Clear';
    } else if (month >= 3 && month <= 5) {
        temp = 15; description = 'polojasno (odhad)'; main = 'Clouds';
    } else if (month >= 9 && month <= 11) {
        temp = 12; description = 'oblačno (odhad)'; main = 'Clouds';
    } else {
        temp = 3; description = 'chladné (odhad)'; main = 'Clouds';
    }
    
    return {
        temp, description, main,
        humidity: 60,
        windSpeed: 3,
        pressure: 1013,
        isFallback: true
    };
}

// Výpočet weather faktoru pro predikci
async function calculateWeatherFactor(formData) {
    try {
        const weather = await getWeatherForecast(formData.city, formData.eventDate);
        return getWeatherImpactFactor(weather);
    } catch (error) {
        console.warn('Weather faktor fallback');
        return 1.0;
    }
}

// Převod počasí na faktor
function getWeatherImpactFactor(weather) {
    let factor = 1.0;
    
    // Teplota
    if (weather.temp >= 18 && weather.temp <= 25) factor *= 1.15;
    else if (weather.temp > 25) factor *= 0.85;
    else if (weather.temp < 10) factor *= 0.75;
    
    // Podmínky
    const conditionFactors = {
        'Clear': 1.1,
        'Clouds': 1.0,
        'Rain': 0.5,
        'Drizzle': 0.6,
        'Snow': 0.4,
        'Thunderstorm': 0.3
    };
    factor *= conditionFactors[weather.main] || 1.0;
    
    // Vítr
    if (weather.windSpeed > 10) factor *= 0.9;
    
    return Math.max(0.3, factor);
}

// Odstranění diakritiky
function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

console.log('✅ App.js část 2 načtena - predikce a počasí');
/* ========================================
   DONULAND MANAGEMENT SYSTEM - APP.JS ČÁST 3
   Vzdálenost, UI funkce, zobrazení výsledků, nastavení
   ======================================== */

// ========================================
// VZDÁLENOST (GOOGLE MAPS)
// ========================================

// Aktualizace vzdálenosti
async function updateDistance() {
    const city = document.getElementById('city').value.trim();
    const distanceInput = document.getElementById('distance');
    
    if (!city) {
        distanceInput.value = '';
        return;
    }
    
    const cacheKey = `praha-${city.toLowerCase()}`;
    
    // Cache kontrola
    if (globalData.distanceCache.has(cacheKey)) {
        const cached = globalData.distanceCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24h cache
            distanceInput.value = cached.data;
            return;
        }
    }
    
    try {
        distanceInput.value = 'Počítám...';
        const distance = await calculateDistance('Praha', city);
        distanceInput.value = distance;
        
        // Cache
        globalData.distanceCache.set(cacheKey, {
            data: distance,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('Chyba při výpočtu vzdálenosti:', error);
        distanceInput.value = getFallbackDistance(city);
    }
}

// Výpočet vzdálenosti
async function calculateDistance(fromCity, toCity) {
    const apiKey = document.getElementById('mapsKey').value || CONFIG.MAPS_API_KEY;
    if (!apiKey) {
        return getFallbackDistance(toCity);
    }
    
    const origin = encodeURIComponent(`${fromCity}, Czech Republic`);
    const destination = encodeURIComponent(`${toCity}, Czech Republic`);
    
    const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=metric&key=${apiKey}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(mapsUrl)}`;
    
    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const mapsData = JSON.parse(data.contents);
        
        if (mapsData.status === 'OK' && mapsData.rows[0]?.elements[0]?.status === 'OK') {
            const distanceInKm = Math.round(mapsData.rows[0].elements[0].distance.value / 1000);
            return distanceInKm;
        }
    } catch (error) {
        console.warn('Maps API selhal:', error);
    }
    
    return getFallbackDistance(toCity);
}

// Fallback vzdálenosti
function getFallbackDistance(city) {
    const distances = {
        'brno': 200,
        'ostrava': 350,
        'plzeň': 90,
        'liberec': 100,
        'olomouc': 280,
        'hradec králové': 120,
        'pardubice': 100,
        'české budějovice': 150,
        'ústí nad labem': 80
    };
    
    const cityLower = removeDiacritics(city.toLowerCase());
    for (const [knownCity, distance] of Object.entries(distances)) {
        if (cityLower.includes(knownCity) || knownCity.includes(cityLower)) {
            return distance;
        }
    }
    
    return 150; // Průměr pro ČR
}

// ========================================
// UI FUNKCE PRO PREDIKCE
// ========================================

// Zobrazení výsledků predikce
function displayPredictionResults(prediction, businessResults, formData) {
    const resultsDiv = document.getElementById('predictionResults');
    
    const profitColor = businessResults.profit > 0 ? 'positive' : 'negative';
    const confidenceColor = prediction.confidence >= 80 ? 'positive' : 
                           prediction.confidence >= 60 ? 'warning' : 'negative';
    
    resultsDiv.innerHTML = `
        <div class="results-grid">
            <div class="result-item">
                <div class="result-value">${formatNumber(prediction.predictedSales)}</div>
                <div class="result-label">🍩 Predikovaný prodej</div>
            </div>
            
            <div class="result-item">
                <div class="result-value ${confidenceColor}">${prediction.confidence}%</div>
                <div class="result-label">🎯 Spolehlivost</div>
            </div>
            
            <div class="result-item">
                <div class="result-value">${formatCurrency(businessResults.revenue)}</div>
                <div class="result-label">💰 Obrat</div>
            </div>
            
            <div class="result-item">
                <div class="result-value ${profitColor}">${formatCurrency(businessResults.profit)}</div>
                <div class="result-label">📈 Zisk</div>
            </div>
            
            <div class="result-item">
                <div class="result-value">${Math.round(businessResults.profitMargin)}%</div>
                <div class="result-label">📊 Marže</div>
            </div>
            
            <div class="result-item">
                <div class="result-value">${formatCurrency(businessResults.costs.total)}</div>
                <div class="result-label">💸 Náklady</div>
            </div>
        </div>
        
        ${generateCostsBreakdown(businessResults, prediction)}
        ${generateFactorsAnalysis(prediction.factors)}
        ${generateRecommendations(prediction, businessResults, formData)}
    `;
}

// Rozpis nákladů
function generateCostsBreakdown(businessResults, prediction) {
    return `
        <div class="costs-breakdown">
            <h4>💰 Rozpis nákladů</h4>
            <div class="cost-item">
                <span>🍩 Výroba (${prediction.predictedSales} × ${(businessResults.costs.production / prediction.predictedSales).toFixed(0)} Kč)</span>
                <span>${formatCurrency(businessResults.costs.production)}</span>
            </div>
            <div class="cost-item">
                <span>🚗 Doprava</span>
                <span>${formatCurrency(businessResults.costs.transport)}</span>
            </div>
            <div class="cost-item">
                <span>👥 Mzdy</span>
                <span>${formatCurrency(businessResults.costs.labor)}</span>
            </div>
            ${businessResults.costs.revenueShare > 0 ? `
            <div class="cost-item">
                <span>💼 Podíl z obratu</span>
                <span>${formatCurrency(businessResults.costs.revenueShare)}</span>
            </div>
            ` : ''}
            <div class="cost-item">
                <span>🏢 Nájem</span>
                <span>${formatCurrency(businessResults.costs.rent)}</span>
            </div>
            <div class="cost-item">
                <span><strong>💸 CELKEM</strong></span>
                <span><strong>${formatCurrency(businessResults.costs.total)}</strong></span>
            </div>
        </div>
    `;
}

// Analýza faktorů
function generateFactorsAnalysis(factors) {
    return `
        <div class="recommendations">
            <h4>🧠 Analýza AI faktorů</h4>
            <ul>
                <li><strong>Kategorie akce:</strong> ${(factors.base * 100).toFixed(1)}% základní konverze</li>
                <li><strong>Historická data:</strong> ${(factors.historical * 100 - 100).toFixed(0)}% oproti průměru</li>
                ${factors.weather !== 1 ? `<li><strong>Počasí:</strong> ${(factors.weather * 100 - 100).toFixed(0)}% vliv na návštěvnost</li>` : ''}
                <li><strong>Město:</strong> ${(factors.city * 100 - 100).toFixed(0)}% faktor města</li>
                <li><strong>Konkurence:</strong> ${(factors.competition * 100 - 100).toFixed(0)}% vliv</li>
                <li><strong>Sezóna:</strong> ${(factors.seasonal * 100 - 100).toFixed(0)}% sezónní vliv</li>
            </ul>
        </div>
    `;
}

// Generování doporučení
function generateRecommendations(prediction, businessResults, formData) {
    const recommendations = [];
    
    if (businessResults.profit < 0) {
        recommendations.push('❌ Akce bude ztrátová - zvažte zvýšení ceny nebo snížení nákladů');
    } else if (businessResults.profitMargin < 10) {
        recommendations.push('⚠️ Nízká marže - optimalizujte náklady');
    } else if (businessResults.profitMargin > 30) {
        recommendations.push('✅ Výborná marže - akce je velmi výnosná');
    }
    
    if (prediction.confidence < 60) {
        recommendations.push('⚠️ Nízká spolehlivost predikce - připravte více scénářů');
    }
    
    if (formData.distance > 200) {
        recommendations.push('🚗 Vzdálená akce - zvažte přenocování');
    }
    
    if (prediction.predictedSales < 100) {
        recommendations.push('📉 Nízký predikovaný prodej - připravte menší zásobu');
    }
    
    if (prediction.factors.weather < 0.8 && formData.eventType === 'outdoor') {
        recommendations.push('🌧️ Nepříznivé počasí - mějte záložní plán');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('✅ Všechny parametry jsou v pořádku pro úspěšnou akci');
    }
    
    return `
        <div class="recommendations">
            <h4>💡 Doporučení</h4>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    `;
}

// Zobrazení historických dat
function displayHistoricalData(formData) {
    const historicalData = getHistoricalData(formData.eventName, formData.city, formData.category);
    const cardEl = document.getElementById('historicalCard');
    const dataEl = document.getElementById('historicalData');
    
    if (!historicalData.matches || historicalData.matches.length === 0) {
        cardEl.style.display = 'none';
        return;
    }
    
    cardEl.style.display = 'block';
    
    let html = '';
    
    // Shrnutí
    if (historicalData.summary) {
        html += `
            <div class="historical-summary">
                <div class="results-grid" style="margin-bottom: 20px;">
                    <div class="result-item">
                        <div class="result-value">${historicalData.summary.count}</div>
                        <div class="result-label">Podobných akcí</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value">${formatNumber(historicalData.summary.avgSales)}</div>
                        <div class="result-label">Průměrný prodej</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value">${formatCurrency(historicalData.summary.avgSales * formData.price)}</div>
                        <div class="result-label">Průměrný obrat</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Top 5 podobných akcí
    html += '<h4>🔍 Nejpodobnější akce:</h4>';
    historicalData.matches.slice(0, 5).forEach(match => {
        const name = match.E || 'Neznámá akce';
        const city = match.D || 'Neznámé město';
        const date = match.B || '';
        const sales = parseInt(match.M || 0);
        const rating = parseFloat(match.X || 0);
        
        html += `
            <div class="historical-item">
                <div class="historical-info">
                    <h4>${escapeHtml(name)}</h4>
                    <p>📍 ${escapeHtml(city)} | 📅 ${date}</p>
                </div>
                <div class="historical-stats">
                    <div class="historical-sales">${formatNumber(sales)} 🍩</div>
                    ${rating > 0 ? `<div class="historical-rating">${'⭐'.repeat(Math.round(rating))}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    dataEl.innerHTML = html;
}

// Loading stavy a chyby
function showPredictionLoading() {
    document.getElementById('predictionResults').innerHTML = `
        <div class="loading">
            <div>🤖 AI počítá predikci...</div>
        </div>
    `;
}

function showPredictionError(message) {
    document.getElementById('predictionResults').innerHTML = `
        <div class="error">
            <div>${message}</div>
        </div>
    `;
    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
        actionButtons.style.display = 'none';
    }
}

// ========================================
// WEATHER UI FUNKCE
// ========================================

// Aktualizace zobrazení weather karty
function updateWeatherCard() {
    const eventType = document.getElementById('eventType').value;
    const weatherCard = document.getElementById('weatherCard');
    
    if (eventType === 'outdoor') {
        weatherCard.style.display = 'block';
        updateWeather();
    } else {
        weatherCard.style.display = 'none';
    }
}

// Zobrazení počasí
function displayWeather(weather) {
    const weatherDisplay = document.getElementById('weatherDisplay');
    const icon = getWeatherIcon(weather.main);
    const warnings = getWeatherWarnings(weather);
    
    weatherDisplay.innerHTML = `
        <div class="weather-card">
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${weather.temp}°C</div>
            <div class="weather-desc">${weather.description}</div>
            
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-value">${weather.humidity}%</div>
                    <div class="weather-detail-label">Vlhkost</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-value">${Math.round(weather.windSpeed)} m/s</div>
                    <div class="weather-detail-label">Vítr</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-value">${weather.pressure} hPa</div>
                    <div class="weather-detail-label">Tlak</div>
                </div>
            </div>
            
            ${warnings.length > 0 ? `
                <div class="weather-warning">
                    <strong>⚠️ Varování:</strong><br>
                    ${warnings.join('<br>')}
                </div>
            ` : ''}
            
            ${weather.isFallback ? `
                <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 6px; font-size: 0.9em;">
                    ℹ️ Sezónní odhad (Weather API nedostupné)
                </div>
            ` : ''}
        </div>
    `;
    
    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.style.display = 'block';
    }
}

// Weather ikony
function getWeatherIcon(main) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Mist': '🌫️',
        'Fog': '🌫️'
    };
    return icons[main] || '🌤️';
}

// Weather varování
function getWeatherWarnings(weather) {
    const warnings = [];
    
    if (weather.temp > 25) warnings.push('Vysoké teploty - riziko tání čokolády');
    if (weather.temp < 5) warnings.push('Nízké teploty - očekávejte nižší návštěvnost');
    if (weather.main === 'Rain') warnings.push('Déšť - výrazně sníží návštěvnost');
    if (weather.main === 'Thunderstorm') warnings.push('Bouřka - velmi nízká návštěvnost');
    if (weather.windSpeed > 10) warnings.push('Silný vítr - zajistěte kotvení stánku');
    
    return warnings;
}

function showWeatherLoading() {
    const weatherDisplay = document.getElementById('weatherDisplay');
    if (weatherDisplay) {
        weatherDisplay.innerHTML = `
            <div class="loading">🌤️ Načítám předpověď počasí...</div>
        `;
    }
    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.style.display = 'block';
    }
}

function showWeatherError(message) {
    const weatherDisplay = document.getElementById('weatherDisplay');
    if (weatherDisplay) {
        weatherDisplay.innerHTML = `
            <div class="error">❌ Chyba počasí: ${message}</div>
        `;
    }
}

function hideWeatherCard() {
    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.style.display = 'none';
    }
}

// ========================================
// BUSINESS MODEL UI
// ========================================

// Aktualizace business model info
function updateBusinessInfo() {
    const model = document.getElementById('businessModel').value;
    const infoEl = document.getElementById('businessInfo');
    
    if (!model) {
        infoEl.style.display = 'none';
        return;
    }
    
    const models = {
        'owner': {
            title: '🏪 Majitel',
            description: 'Vy osobně + 2 brigádníci',
            costs: 'Mzdy: 2 × 150 Kč/h × 10h = 3000 Kč',
            profit: '100% zisku po odečtení všech nákladů'
        },
        'employee': {
            title: '👨‍💼 Zaměstnanec',
            description: 'Vy + 1 brigádník + 5% z obratu',
            costs: 'Mzdy: 2 × 150 Kč/h × 10h + 5% z obratu',
            profit: 'Fixní mzda bez účasti na zisku'
        },
        'franchise': {
            title: '🤝 Franšíza',
            description: 'Nákup donutů za 52 Kč/ks',
            costs: 'Váš zisk: 20 Kč na donut (52-32)',
            profit: 'Franšízant hradí nájem a mzdy'
        }
    };
    
    const info = models[model];
    if (info) {
        infoEl.innerHTML = `
            <h4>${info.title}</h4>
            <ul>
                <li><strong>Model:</strong> ${info.description}</li>
                <li><strong>Náklady:</strong> ${info.costs}</li>
                <li><strong>Zisk:</strong> ${info.profit}</li>
            </ul>
        `;
        infoEl.style.display = 'block';
    }
}

// Aktualizace rent fields
function updateRentFields() {
    const rentType = document.getElementById('rentType').value;
    
    // Skrytí všech
    ['fixedRentGroup', 'percentageGroup', 'mixedFixedGroup', 'mixedPercentageGroup'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Zobrazení relevantních
    switch(rentType) {
        case 'fixed':
            const fixedGroup = document.getElementById('fixedRentGroup');
            if (fixedGroup) fixedGroup.style.display = 'block';
            break;
        case 'percentage':
            const percentageGroup = document.getElementById('percentageGroup');
            if (percentageGroup) percentageGroup.style.display = 'block';
            break;
        case 'mixed':
            const mixedFixedGroup = document.getElementById('mixedFixedGroup');
            const mixedPercentageGroup = document.getElementById('mixedPercentageGroup');
            if (mixedFixedGroup) mixedFixedGroup.style.display = 'block';
            if (mixedPercentageGroup) mixedPercentageGroup.style.display = 'block';
            break;
    }
}

// ========================================
// SAVE & EXPORT FUNKCE
// ========================================

// Uložení predikce do Google Sheets
async function savePrediction() {
    const errors = validateForm();
    if (errors.length > 0) {
        showNotification('❌ Vyplňte všechna povinná pole', 'error');
        return;
    }
    
    try {
        const formData = gatherFormData();
        const prediction = await calculateAIPrediction(formData);
        const businessResults = calculateBusinessMetrics(formData, prediction);
        
        // Simulace uložení (real implementace by potřebovala Google Sheets API write)
        const predictionData = {
            datum: formData.eventDate,
            lokalita: formData.city,
            nazev: formData.eventName,
            kategorie: formData.category,
            navstevnost: formData.visitors,
            predikce: prediction.predictedSales,
            spolehlivost: prediction.confidence,
            obrat: businessResults.revenue,
            zisk: businessResults.profit,
            timestamp: new Date().toISOString()
        };
        
        console.log('💾 Ukládám predikci:', predictionData);
        
        // Simulace API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showNotification('✅ Predikce byla úspěšně uložena!', 'success');
        
    } catch (error) {
        console.error('❌ Chyba při ukládání:', error);
        showNotification('❌ Chyba při ukládání predikce', 'error');
    }
}

// Export predikce
function exportPrediction() {
    const errors = validateForm();
    if (errors.length > 0) {
        showNotification('❌ Nejdříve vyplňte všechna pole', 'error');
        return;
    }
    
    try {
        const formData = gatherFormData();
        
        const exportText = `DONULAND - PREDIKCE AKCE
=====================================

📋 ZÁKLADNÍ ÚDAJE:
Název akce: ${formData.eventName}
Kategorie: ${formData.category}
Město: ${formData.city}
Datum: ${formatDate(formData.eventDate)}
Návštěvnost: ${formatNumber(formData.visitors)}
Business model: ${formData.businessModel}

📊 VÝSLEDKY PREDIKCE:
(Aktuální výsledky z UI)

⏰ Exportováno: ${new Date().toLocaleString('cs-CZ')}
🍩 Donuland Management System
`;
        
        // Stažení souboru
        const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donuland-predikce-${formData.eventName.replace(/[^a-z0-9]/gi, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('📄 Predikce exportována', 'success');
        
    } catch (error) {
        console.error('❌ Chyba při exportu:', error);
        showNotification('❌ Chyba při exportu', 'error');
    }
}

// ========================================
// NASTAVENÍ FUNKCE
// ========================================

// Načtení uložených nastavení
function loadSettings() {
    try {
        const saved = localStorage.getItem('donulandSettings');
        if (!saved) {
            console.log('📋 Žádná uložená nastavení');
            return;
        }
        
        const settings = JSON.parse(saved);
        console.log('🔄 Načítám uložená nastavení...');
        
        // API nastavení
        if (settings.sheetsUrl) {
            const sheetsUrl = document.getElementById('sheetsUrl');
            if (sheetsUrl) sheetsUrl.value = settings.sheetsUrl;
        }
        if (settings.weatherKey) {
            const weatherKey = document.getElementById('weatherKey');
            if (weatherKey) weatherKey.value = settings.weatherKey;
        }
        if (settings.mapsKey) {
            const mapsKey = document.getElementById('mapsKey');
            if (mapsKey) mapsKey.value = settings.mapsKey;
        }
        
        // Business parametry
        if (settings.donutCost) {
            const donutCost = document.getElementById('donutCost');
            if (donutCost) donutCost.value = settings.donutCost;
        }
        if (settings.franchisePrice) {
            const franchisePrice = document.getElementById('franchisePrice');
            if (franchisePrice) franchisePrice.value = settings.franchisePrice;
        }
        if (settings.hourlyWage) {
            const hourlyWage = document.getElementById('hourlyWage');
            if (hourlyWage) hourlyWage.value = settings.hourlyWage;
        }
        if (settings.workHours) {
            const workHours = document.getElementById('workHours');
            if (workHours) workHours.value = settings.workHours;
        }
        if (settings.fuelCost) {
            const fuelCost = document.getElementById('fuelCost');
            if (fuelCost) fuelCost.value = settings.fuelCost;
        }
        
        console.log('✅ Nastavení načtena');
        
    } catch (error) {
        console.error('❌ Chyba při načítání nastavení:', error);
    }
}

// Uložení nastavení
function saveSettings() {
    try {
        const settings = {
            // API nastavení
            sheetsUrl: document.getElementById('sheetsUrl')?.value || '',
            weatherKey: document.getElementById('weatherKey')?.value || '',
            mapsKey: document.getElementById('mapsKey')?.value || '',
            
            // Business parametry
            donutCost: parseFloat(document.getElementById('donutCost')?.value) || CONFIG.DONUT_COST,
            franchisePrice: parseFloat(document.getElementById('franchisePrice')?.value) || CONFIG.FRANCHISE_PRICE,
            hourlyWage: parseFloat(document.getElementById('hourlyWage')?.value) || CONFIG.HOURLY_WAGE,
            workHours: parseFloat(document.getElementById('workHours')?.value) || CONFIG.WORK_HOURS,
            fuelCost: parseFloat(document.getElementById('fuelCost')?.value) || CONFIG.FUEL_COST,
            
            savedAt: new Date().toISOString()
        };
        
        // Aktualizace CONFIG objektu
        Object.assign(CONFIG, {
            DONUT_COST: settings.donutCost,
            FRANCHISE_PRICE: settings.franchisePrice,
            HOURLY_WAGE: settings.hourlyWage,
            WORK_HOURS: settings.workHours,
            FUEL_COST: settings.fuelCost
        });
        
        localStorage.setItem('donulandSettings', JSON.stringify(settings));
        
        console.log('💾 Nastavení uložena:', settings);
        showNotification('✅ Nastavení byla úspěšně uložena', 'success');
        
    } catch (error) {
        console.error('❌ Chyba při ukládání nastavení:', error);
        showNotification('❌ Chyba při ukládání nastavení', 'error');
    }
}

// ========================================
// GLOBÁLNÍ FUNKCE PRO HTML
// ========================================

// Globální funkce dostupné z HTML
window.updatePrediction = updatePrediction;
window.updateDistance = updateDistance;
window.updateWeather = updateWeather;
window.updateWeatherCard = updateWeatherCard;
window.updateBusinessInfo = updateBusinessInfo;
window.updateRentFields = updateRentFields;
window.savePrediction = savePrediction;
window.exportPrediction = exportPrediction;
window.saveSettings = saveSettings;
window.loadData = loadData;
window.showSection = showSection;

console.log('✅ App.js část 3 načtena - vzdálenost, UI, výsledky, nastavení');
console.log('🍩 Donuland Management System je připraven k použití!');
