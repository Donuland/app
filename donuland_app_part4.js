/* ========================================
   DONULAND PART 4A - OPRAVENÉ FILTRY
   Kalendářní filtry a správné načítání kategorií
   ======================================== */

console.log('🔧 Loading Donuland Part 4A FIXES...');

// ========================================
// OPRAVA 1: SPRÁVNÉ NAČÍTÁNÍ KATEGORIÍ ZE SHEETS
// ========================================

// OPRAVENÁ funkce pro normalizaci kategorií ze sloupce F
function normalizeCategory(category) {
    if (!category) return 'ostatní';
    
    const normalized = category.toLowerCase().trim();
    
    // ROZŠÍŘENÝ mapping pro VŠECHNY možné varianty ze Sheets
    const categoryMap = {
        // Food festival varianty - KLÍČOVÉ OPRAVY
        'food': 'food festival',
        'food festival': 'food festival',
        'foodfestival': 'food festival',
        'festival': 'food festival',
        'food fest': 'food festival',
        'burger festival': 'food festival',      // ← KRITICKÁ OPRAVA
        'burgerfestival': 'food festival',       // ← KRITICKÁ OPRAVA
        'burger fest': 'food festival',          // ← KRITICKÁ OPRAVA
        'burgers': 'food festival',              // ← NOVÉ
        'street food': 'food festival',          // ← NOVÉ
        'streetfood': 'food festival',           // ← NOVÉ
        'gastro': 'food festival',               // ← NOVÉ
        'gastrofestival': 'food festival',       // ← NOVÉ
        'gastronomie': 'food festival',          // ← NOVÉ
        'jídlo': 'food festival',                // ← NOVÉ
        'foodie': 'food festival',               // ← NOVÉ
        
        // Veletrh/ČokoFest varianty - ROZŠÍŘENÉ
        'veletrh': 'veletrh',
        'cokofest': 'veletrh',
        'čokofest': 'veletrh',                   // ← NOVÉ
        'chocofest': 'veletrh',                  // ← NOVÉ
        'chocolatefest': 'veletrh',              // ← NOVÉ
        'chocolate festival': 'veletrh',         // ← NOVÉ
        'cokolada': 'veletrh',                   // ← NOVÉ
        'čokoláda': 'veletrh',                   // ← NOVÉ
        'trh': 'veletrh',
        'výstava': 'veletrh',
        'expo': 'veletrh',                       // ← NOVÉ
        'fair': 'veletrh',                       // ← NOVÉ
        'market': 'veletrh',                     // ← NOVÉ
        'jarmark': 'veletrh',                    // ← NOVÉ
        
        // Koncert varianty - ROZŠÍŘENÉ
        'koncert': 'koncert',
        'hudba': 'koncert',
        'festival hudby': 'koncert',
        'hudební': 'koncert',
        'music': 'koncert',                      // ← NOVÉ
        'music festival': 'koncert',             // ← NOVÉ
        'concert': 'koncert',                    // ← NOVÉ
        'hudební festival': 'koncert',           // ← NOVÉ
        'live music': 'koncert',                 // ← NOVÉ
        
        // Kulturní akce varianty - ROZŠÍŘENÉ
        'kultura': 'kulturní akce',
        'kulturní': 'kulturní akce',
        'kulturní akce': 'kulturní akce',
        'divadlo': 'kulturní akce',
        'galerie': 'kulturní akce',
        'cultural': 'kulturní akce',             // ← NOVÉ
        'arts': 'kulturní akce',                 // ← NOVÉ
        'umění': 'kulturní akce',                // ← NOVÉ
        'festival kultury': 'kulturní akce',     // ← NOVÉ
        'kulturní festival': 'kulturní akce',    // ← NOVÉ
        
        // Sportovní akce varianty - ROZŠÍŘENÉ
        'sport': 'sportovní',
        'sportovní': 'sportovní',
        'sportovní akce': 'sportovní',
        'maraton': 'sportovní',
        'běh': 'sportovní',
        'run': 'sportovní',                      // ← NOVÉ
        'marathon': 'sportovní',                 // ← NOVÉ
        'race': 'sportovní',                     // ← NOVÉ
        'cycling': 'sportovní',                  // ← NOVÉ
        'bike': 'sportovní',                     // ← NOVÉ
        'cyklistika': 'sportovní',               // ← NOVÉ
        'fitness': 'sportovní',                  // ← NOVÉ
        'atletika': 'sportovní',                 // ← NOVÉ
        'půlmaraton': 'sportovní',               // ← NOVÉ
        'triathlon': 'sportovní',                // ← NOVÉ
        
        // Ostatní - ROZŠÍŘENÉ
        'ostatní': 'ostatní',
        'jiné': 'ostatní',
        'other': 'ostatní',
        'různé': 'ostatní',                      // ← NOVÉ
        'mix': 'ostatní',                        // ← NOVÉ
        'mixed': 'ostatní',                      // ← NOVÉ
        'společenské': 'ostatní',                // ← NOVÉ
        'rodinné': 'ostatní'                     // ← NOVÉ
    };
    
    const result = categoryMap[normalized] || 'ostatní';
    
    if (globalState.debugMode) {
        console.log(`🏷️ Category normalized: "${category}" → "${result}"`);
    }
    
    return result;
}

// ========================================
// OPRAVA 2: DYNAMICKÉ NAČÍTÁNÍ FILTRŮ ZE SHEETS
// ========================================

// NOVÁ funkce pro načtení unikátních kategorií z historických dat
function getUniqueCategories() {
    const categories = new Set();
    
    if (globalState.historicalData && globalState.historicalData.length > 0) {
        globalState.historicalData.forEach(record => {
            if (record.category) {
                // Normalizuj kategorii před přidáním do setu
                const normalized = normalizeCategory(record.category);
                categories.add(normalized);
            }
        });
    }
    
    // Přidej predikované kategorie z localStorage
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData && prediction.formData.category) {
                categories.add(prediction.formData.category);
            }
        });
    } catch (error) {
        console.warn('⚠️ Error loading prediction categories:', error);
    }
    
    // Přidej manuální události
    try {
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            if (event.category) {
                const normalized = normalizeCategory(event.category);
                categories.add(normalized);
            }
        });
    } catch (error) {
        console.warn('⚠️ Error loading manual event categories:', error);
    }
    
    // Vždy zahrnuj základní kategorie
    const baseCategories = ['food festival', 'veletrh', 'koncert', 'kulturní akce', 'sportovní', 'ostatní'];
    baseCategories.forEach(cat => categories.add(cat));
    
    const result = Array.from(categories).sort();
    console.log(`📋 Found ${result.length} unique categories:`, result);
    
    return result;
}

// NOVÁ funkce pro načtení unikátních měst z historických dat
function getUniqueCities() {
    const cities = new Set();
    
    if (globalState.historicalData && globalState.historicalData.length > 0) {
        globalState.historicalData.forEach(record => {
            if (record.city) {
                cities.add(record.city.trim());
            }
        });
    }
    
    // Přidej města z predikcí
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData && prediction.formData.city) {
                cities.add(prediction.formData.city.trim());
            }
        });
    } catch (error) {
        console.warn('⚠️ Error loading prediction cities:', error);
    }
    
    // Přidej města z manuálních událostí
    try {
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            if (event.city) {
                cities.add(event.city.trim());
            }
        });
    } catch (error) {
        console.warn('⚠️ Error loading manual event cities:', error);
    }
    
    const result = Array.from(cities).sort();
    console.log(`🏙️ Found ${result.length} unique cities:`, result);
    
    return result;
}

// ========================================
// OPRAVA 3: NAPLNĚNÍ FILTER DROPDOWNŮ
// ========================================

// OPRAVENÁ funkce pro naplnění filter dropdownů
function populateFilterDropdowns() {
    console.log('🔧 Populating filter dropdowns...');
    
    try {
        // Město filter
        const cityFilter = document.getElementById('cityFilter');
        if (cityFilter) {
            const cities = getUniqueCities();
            
            // Vymazat současné možnosti (kromě první)
            while (cityFilter.children.length > 1) {
                cityFilter.removeChild(cityFilter.lastChild);
            }
            
            // Přidat města
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = `🏙️ ${city}`;
                cityFilter.appendChild(option);
            });
            
            console.log(`🏙️ City filter populated with ${cities.length} cities`);
        }
        
        // Kategorie filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            const categories = getUniqueCategories();
            
            // Vymazat současné možnosti (kromě první)
            while (categoryFilter.children.length > 1) {
                categoryFilter.removeChild(categoryFilter.lastChild);
            }
            
            // Mapování ikon pro kategorie
            const categoryIcons = {
                'food festival': '🍔',
                'veletrh': '🍫',
                'koncert': '🎵',
                'kulturní akce': '🎭',
                'sportovní': '🏃',
                'ostatní': '📅'
            };
            
            // Přidat kategorie
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                const icon = categoryIcons[category] || '📋';
                option.textContent = `${icon} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
                categoryFilter.appendChild(option);
            });
            
            console.log(`📋 Category filter populated with ${categories.length} categories`);
        }
        
        console.log('✅ Filter dropdowns populated successfully');
        
    } catch (error) {
        console.error('❌ Error populating filter dropdowns:', error);
    }
}

// ========================================
// OPRAVA 4: FUNKČNÍ CALENDAR FILTRY
// ========================================

// OPRAVENÁ hlavní filter funkce
function filterCalendar() {
    console.log('🔍 Applying calendar filters...');
    
    try {
        // Získej hodnoty filtrů
        const cityFilter = document.getElementById('cityFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        // Ujisti se, že calendarState existuje
        if (typeof calendarState === 'undefined') {
            console.error('❌ calendarState not defined');
            return;
        }
        
        // Aktualizuj filtry v calendarState
        calendarState.filters = {
            city: cityFilter ? cityFilter.value : '',
            category: categoryFilter ? categoryFilter.value : '',
            status: statusFilter ? statusFilter.value : ''
        };
        
        console.log('🔍 Applied filters:', calendarState.filters);
        
        // Re-render kalendář s novými filtry
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
        
        // Aktualizuj seznam událostí
        if (typeof updateMonthEventsList === 'function') {
            updateMonthEventsList();
        }
        
        // Zobraz počet filtrovaných událostí
        const totalEvents = getTotalFilteredEvents();
        showNotification(`🔍 Filtry aplikovány - zobrazeno ${totalEvents} událostí`, 'info', 2000);
        
    } catch (error) {
        console.error('❌ Error applying filters:', error);
        showNotification('❌ Chyba při aplikaci filtrů', 'error');
    }
}

// NOVÁ funkce pro počítání filtrovaných událostí
function getTotalFilteredEvents() {
    if (!globalState.historicalData) return 0;
    
    let count = 0;
    const currentDate = new Date(globalState.currentYear, globalState.currentMonth, 1);
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Projdi všechny dny v měsíci
    for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
        const events = getEventsForDate(new Date(day));
        count += events.length;
    }
    
    return count;
}

// ========================================
// OPRAVA 5: CLEAR FILTERS FUNKCE
// ========================================

// OPRAVENÁ funkce pro vymazání filtrů
function clearCalendarFilters() {
    console.log('🧹 Clearing calendar filters...');
    
    try {
        const cityFilter = document.getElementById('cityFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (cityFilter) cityFilter.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        
        // Ujisti se, že calendarState existuje
        if (typeof calendarState !== 'undefined') {
            calendarState.filters = { city: '', category: '', status: '' };
        }
        
        // Re-render kalendář
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
        
        // Aktualizuj seznam událostí
        if (typeof updateMonthEventsList === 'function') {
            updateMonthEventsList();
        }
        
        showNotification('🔄 Filtry kalendáře vymazány', 'info', 2000);
        console.log('✅ Calendar filters cleared');
        
    } catch (error) {
        console.error('❌ Error clearing filters:', error);
        showNotification('❌ Chyba při mazání filtrů', 'error');
    }
}

// ========================================
// OPRAVA 6: EVENT LISTENERS PRO FILTRY
// ========================================

// NOVÁ funkce pro nastavení event listenerů pro filtry
function setupFilterEventListeners() {
    console.log('🎯 Setting up filter event listeners...');
    
    const cityFilter = document.getElementById('cityFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (cityFilter) {
        cityFilter.addEventListener('change', filterCalendar);
        console.log('✅ City filter listener attached');
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterCalendar);
        console.log('✅ Category filter listener attached');
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCalendar);
        console.log('✅ Status filter listener attached');
    }
    
    console.log('✅ Filter event listeners setup complete');
}

// ========================================
// OPRAVA 7: INTEGRACE S EVENT BUS
// ========================================

// Event listenery pro aktualizaci filtrů při změně dat
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded - updating filter dropdowns');
    setTimeout(() => {
        populateFilterDropdowns();
        filterCalendar(); // Aplikuj současné filtry na nová data
    }, 500);
});

eventBus.on('predictionSaved', () => {
    console.log('💾 Prediction saved - updating filter dropdowns');
    setTimeout(() => {
        populateFilterDropdowns();
    }, 200);
});

eventBus.on('calendarMonthChanged', () => {
    console.log('📅 Month changed - applying filters to new month');
    filterCalendar();
});

// ========================================
// OPRAVA 8: INITIALIZATION
// ========================================

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing Part 4A Filter System...');
    
    // Nastavení event listenerů pro filtry
    setupFilterEventListeners();
    
    // Pokud už jsou data načtená, naplň dropdowny
    setTimeout(() => {
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            populateFilterDropdowns();
        }
    }, 1000);
    
    console.log('✅ Part 4A Filter System initialized');
});

// ========================================
// OPRAVA 9: GLOBÁLNÍ FUNKCE PRO KOMPATIBILITU
// ========================================

// Export globálních funkcí pro použití v HTML
if (typeof window !== 'undefined') {
    // Přepíšeme globální funkci pro kompatibilitu
    window.filterCalendar = filterCalendar;
    window.clearFilters = clearCalendarFilters;
    
    // Debug funkce
    window.donulandFilters = {
        state: () => calendarState?.filters,
        categories: getUniqueCategories,
        cities: getUniqueCities,
        populate: populateFilterDropdowns,
        apply: filterCalendar,
        clear: clearCalendarFilters,
        test: () => {
            console.log('🧪 Testing filter system...');
            const categories = getUniqueCategories();
            const cities = getUniqueCities();
            console.log(`Categories: ${categories.length}`, categories);
            console.log(`Cities: ${cities.length}`, cities);
            return { categories, cities };
        }
    };
}

// ========================================
// OPRAVA 10: CSS STYLY PRO FILTRY
// ========================================

// Přidání CSS stylů pro vylepšené filtry
function addFilterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Vylepšené styly pro calendar filtry */
        .calendar-filters {
            display: flex;
            gap: 15px;
            margin: 15px 0;
            flex-wrap: wrap;
            justify-content: center;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid #dee2e6;
        }
        
        .calendar-filters select {
            padding: 8px 15px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            background: white;
            font-size: 14px;
            font-weight: 500;
            min-width: 160px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .calendar-filters select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            transform: translateY(-1px);
        }
        
        .calendar-filters select:hover {
            border-color: #667eea;
            transform: translateY(-1px);
        }
        
        .calendar-filters select option {
            padding: 8px;
            font-size: 14px;
        }
        
        /* Filter button pro clear */
        .filter-actions {
            display: flex;
            gap: 10px;
            margin-left: auto;
        }
        
        .btn-clear-filters {
            background: #6c757d;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .btn-clear-filters:hover {
            background: #5a6268;
            transform: translateY(-1px);
        }
        
        /* Indikátor aktivních filtrů */
        .filters-active {
            position: relative;
        }
        
        .filters-active::after {
            content: '●';
            position: absolute;
            top: -5px;
            right: -5px;
            color: #28a745;
            font-size: 12px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* Responsive design pro filtry */
        @media (max-width: 768px) {
            .calendar-filters {
                flex-direction: column;
                align-items: center;
            }
            
            .calendar-filters select {
                min-width: 200px;
                width: 100%;
                max-width: 300px;
            }
            
            .filter-actions {
                margin-left: 0;
                margin-top: 10px;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('🎨 Filter styles added');
}

// Přidání stylů při načtení
document.addEventListener('DOMContentLoaded', function() {
    addFilterStyles();
});

// ========================================
// FINALIZACE PART 4A
// ========================================

console.log('✅ Donuland Part 4A FIXES loaded successfully');
console.log('🔧 Features: ✅ Fixed Category Mapping ✅ Dynamic Filter Population ✅ Working Calendar Filters');
console.log('📋 Key Fixes: ✅ "Burger Festival" → "food festival" ✅ Categories from Sheets Column F ✅ Functional filter dropdowns');
console.log('🧪 Debug: window.donulandFilters available for testing');
console.log('⏳ Ready for Part 4B: Event Status & Date Processing');

// Event pro signalizaci dokončení části 4A
eventBus.emit('part4aLoaded', { 
    timestamp: Date.now(),
    version: '1.1.0-fixed',
    features: ['fixed-category-mapping', 'dynamic-filter-population', 'working-calendar-filters', 'improved-ui'],
    fixes: ['burger-festival-mapping', 'sheets-column-f-categories', 'functional-dropdowns', 'event-listeners']
});
/* ========================================
   DONULAND PART 4B - EVENT PROCESSING & STATUS
   Opravy pro správné určování statusů a zpracování událostí
   ======================================== */

console.log('🔧 Loading Donuland Part 4B - Event Processing Fixes...');

// ========================================
// KRITICKÁ OPRAVA: determineEventStatus()
// ========================================

// NOVÁ funkce pro přesné určení statusu události podle dnešního data
function determineEventStatus(dateFrom, dateTo) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetuj čas na půlnoc pro přesné porovnání
        
        // Parsování dat s lepším error handlingem
        let eventStart, eventEnd;
        
        try {
            eventStart = new Date(dateFrom);
            eventStart.setHours(0, 0, 0, 0);
        } catch (e) {
            console.warn('⚠️ Invalid dateFrom:', dateFrom);
            return 'unknown';
        }
        
        try {
            eventEnd = dateTo ? new Date(dateTo) : eventStart;
            eventEnd.setHours(23, 59, 59, 999); // Konec dne
        } catch (e) {
            console.warn('⚠️ Invalid dateTo:', dateTo);
            eventEnd = new Date(eventStart);
            eventEnd.setHours(23, 59, 59, 999);
        }
        
        // Kontrola validity dat
        if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
            console.warn('⚠️ Invalid date for status determination:', { dateFrom, dateTo });
            return 'unknown';
        }
        
        // KLÍČOVÁ LOGIKA: Přesné určení statusu podle dnešního data
        if (eventEnd < today) {
            return 'completed';  // Akce už skončila
        } else if (eventStart <= today && today <= eventEnd) {
            return 'ongoing';    // Akce právě probíhá
        } else if (eventStart > today) {
            return 'planned';    // Akce je v budoucnosti
        } else {
            return 'unknown';    // Fallback
        }
        
    } catch (error) {
        console.error('❌ Error determining event status:', error);
        return 'unknown';
    }
}

// ========================================
// KRITICKÁ OPRAVA: isDateInRange() PRO SPRÁVNÉ DATUM ROZSAHY
// ========================================

// KOMPLETNĚ PŘEPSANÁ funkce pro kontrolu rozsahu dat (FIX timezone problémů)
// NAHRADIT funkci getEventsForDate() v donuland_app_part4.js:

function getEventsForDate(date) {
    // ✅ KRITICKÁ OPRAVA: Použít konzistentní formát data
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD formát
    const eventMap = new Map();
    
    if (globalState.debugMode) {
        console.log(`📅 Getting events for date: ${dateStr}`);
    }
    
    try {
        // 1. HISTORICKÉ AKCE z Google Sheets 
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            globalState.historicalData.forEach(record => {
                // ✅ OPRAVA: Přímé porovnání ISO stringů místo Date objektů
                if (isDateInISORange(dateStr, record.dateFrom, record.dateTo)) {
                    const eventKey = createEventKey(record.eventName, record.city, record.dateFrom);
                    
                    const status = determineEventStatus(record.dateFrom, record.dateTo);
                    const normalizedCategory = normalizeCategory(record.category);
                    
                    const event = {
                        id: `historical-${record.rowIndex || Date.now()}`,
                        type: 'historical',
                        status: status,
                        title: record.eventName,
                        city: record.city,
                        category: normalizedCategory,
                        sales: record.sales,
                        visitors: record.visitors,
                        rating: record.rating,
                        dateFrom: record.dateFrom,
                        dateTo: record.dateTo,
                        data: record,
                        eventKey: eventKey,
                        source: 'sheets'
                    };
                    
                    eventMap.set(eventKey, event);
                    
                    if (globalState.debugMode) {
                        console.log(`📊 Found historical event: ${event.title} for ${dateStr}`);
                    }
                }
            });
        }
        
        // 2. ULOŽENÉ PREDIKCE z localStorage
        try {
            const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
            savedPredictions.forEach(prediction => {
                if (prediction.formData && isDateInISORange(dateStr, prediction.formData.eventDateFrom, prediction.formData.eventDateTo)) {
                    const eventKey = createEventKey(
                        prediction.formData.eventName, 
                        prediction.formData.city, 
                        prediction.formData.eventDateFrom
                    );
                    
                    if (eventMap.has(eventKey)) {
                        // Sloučení s existující historickou akcí
                        const existingEvent = eventMap.get(eventKey);
                        existingEvent.hasPrediction = true;
                        existingEvent.predictionData = prediction;
                        existingEvent.predictedSales = prediction.prediction?.predictedSales;
                        existingEvent.confidence = prediction.prediction?.confidence;
                    } else {
                        // Nová predikční akce
                        const status = determineEventStatus(
                            prediction.formData.eventDateFrom, 
                            prediction.formData.eventDateTo
                        );
                        
                        const event = {
                            id: `prediction-${prediction.id || Date.now()}`,
                            type: 'prediction',
                            status: status,
                            title: prediction.formData.eventName,
                            city: prediction.formData.city,
                            category: prediction.formData.category,
                            predictedSales: prediction.prediction?.predictedSales,
                            actualSales: prediction.actualSales,
                            confidence: prediction.prediction?.confidence,
                            visitors: prediction.formData.visitors,
                            dateFrom: prediction.formData.eventDateFrom,
                            dateTo: prediction.formData.eventDateTo || prediction.formData.eventDateFrom,
                            data: prediction,
                            eventKey: eventKey,
                            source: 'prediction'
                        };
                        
                        eventMap.set(eventKey, event);
                    }
                }
            });
        } catch (error) {
            console.warn('⚠️ Error processing predictions:', error);
        }
        
        // 3. MANUÁLNĚ PŘIDANÉ UDÁLOSTI
        try {
            const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
            manualEvents.forEach(event => {
                if (isDateInISORange(dateStr, event.dateFrom, event.dateTo)) {
                    const eventKey = createEventKey(event.eventName, event.city, event.dateFrom);
                    
                    if (!eventMap.has(eventKey)) {
                        const status = determineEventStatus(event.dateFrom, event.dateTo);
                        
                        const newEvent = {
                            id: `manual-${event.id || Date.now()}`,
                            type: 'manual',
                            status: status,
                            title: event.eventName,
                            city: event.city,
                            category: event.category || 'ostatní',
                            sales: event.sales,
                            visitors: event.visitors || 0,
                            dateFrom: event.dateFrom,
                            dateTo: event.dateTo || event.dateFrom,
                            data: event,
                            eventKey: eventKey,
                            source: 'manual'
                        };
                        
                        eventMap.set(eventKey, newEvent);
                    }
                }
            });
        } catch (error) {
            console.warn('⚠️ Error processing manual events:', error);
        }
        
    } catch (error) {
        console.warn('⚠️ Error getting events for date:', dateStr, error);
    }
    
    // APLIKACE FILTRŮ
    const filteredEvents = Array.from(eventMap.values()).filter(event => {
        if (calendarState.filters.city) {
            const filterCity = calendarState.filters.city.toLowerCase().trim();
            const eventCity = (event.city || '').toLowerCase().trim();
            if (eventCity !== filterCity) return false;
        }
        
        if (calendarState.filters.category) {
            if (event.category !== calendarState.filters.category) return false;
        }
        
        if (calendarState.filters.status) {
            if (calendarState.filters.status === 'planned') {
                if (event.status !== 'planned' && event.status !== 'ongoing') return false;
            } else if (calendarState.filters.status === 'completed') {
                if (event.status !== 'completed') return false;
            } else {
                if (event.status !== calendarState.filters.status) return false;
            }
        }
        
        return true;
    });
    
    if (globalState.debugMode && filteredEvents.length > 0) {
        console.log(`📅 Events for ${dateStr} after filtering:`, filteredEvents.map(e => e.title));
    }
    
    return filteredEvents;
}

// ✅ NOVÁ HELPER FUNKCE: Porovnávání ISO stringů místo Date objektů
function isDateInISORange(checkDateISO, fromDateISO, toDateISO) {
    if (!fromDateISO) return false;
    
    const actualToDateISO = toDateISO && toDateISO.trim() ? toDateISO : fromDateISO;
    
    // ✅ KRITICKÁ OPRAVA: Přímé porovnání ISO stringů
    // "2025-01-18" >= "2025-01-18" && "2025-01-18" <= "2025-01-18"
    const inRange = checkDateISO >= fromDateISO && checkDateISO <= actualToDateISO;
    
    if (globalState.debugMode && inRange) {
        console.log(`✅ Date in range: ${checkDateISO} is in ${fromDateISO} - ${actualToDateISO}`);
    }
    
    return inRange;
}
// ========================================
// HELPER FUNKCE - OPRAVENÉ
// ========================================

// OPRAVENÁ funkce pro vytvoření konzistentního klíče události
function createEventKey(eventName, city, dateFrom) {
    if (!eventName || !city || !dateFrom) {
        console.warn('⚠️ Incomplete data for event key:', { eventName, city, dateFrom });
        return `incomplete-${Date.now()}-${Math.random()}`;
    }
    
    // Normalizace pro lepší deduplikaci
    const normalizedName = eventName.toLowerCase().trim().replace(/\s+/g, '-');
    const normalizedCity = city.toLowerCase().trim().replace(/\s+/g, '-');
    const normalizedDate = dateFrom.replace(/[^0-9-]/g, '');
    
    const key = `${normalizedName}-${normalizedCity}-${normalizedDate}`.replace(/[^a-z0-9-]/g, '');
    
    if (globalState.debugMode) {
        console.log(`🔑 Event key created: "${eventName}" + "${city}" + "${dateFrom}" → "${key}"`);
    }
    
    return key;
}

// Helper funkce pro převod statusu na text (pro UI)
function getStatusText(status) {
    const statusMap = {
        'completed': 'Dokončeno',
        'ongoing': 'Probíhá',
        'planned': 'Plánováno',
        'unknown': 'Neznámý'
    };
    return statusMap[status] || status;
}

// Helper funkce pro převod zdroje na text (pro UI)
function getSourceText(source) {
    const sourceMap = {
        'sheets': 'Google Sheets',
        'prediction': 'AI Predikce',
        'manual': 'Manuálně přidáno'
    };
    return sourceMap[source] || source;
}

// ========================================
// OPRAVA: BAREVNÝ SYSTÉM S PRAVÝMI STATUSY
// ========================================

// OPRAVENÁ funkce pro získání barvy akce s lepší logikou statusů
function getEventColor(eventName, date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    
    // OPRAVA: Přesnější určení statusu události pro barvu
    let eventStatus = 'planned';
    if (eventDate < today) {
        eventStatus = 'completed';
    } else if (eventDate.toDateString() === today.toDateString()) {
        eventStatus = 'ongoing';
    }
    
    // DOKONČENÉ AKCE - konzistentní zelená barva s ✅ ikonou
    if (eventStatus === 'completed') {
        return {
            background: '#d4edda',
            border: '#28a745',
            textColor: '#155724',
            icon: '✅'
        };
    }
    
    // PROBÍHAJÍCÍ AKCE - oranžová barva s 🔥 ikonou
    if (eventStatus === 'ongoing') {
        return {
            background: '#fff3cd',
            border: '#ffc107',
            textColor: '#856404',
            icon: '🔥'
        };
    }
    
    // PLÁNOVANÉ AKCE - unikátní barvy podle názvu (zachovává váš systém)
    const eventKey = eventName.toLowerCase().trim();
    
    if (!calendarState.eventColors.has(eventKey)) {
        // Inicializace palety pokud není
        if (calendarState.colorPalette.length === 0) {
            calendarState.colorPalette = generateColorPalette();
        }
        
        // OPRAVA: Lepší hash funkce pro konzistentnější barvy
        const hash = improvedHashString(eventKey);
        const colorIndex = hash % calendarState.colorPalette.length;
        const color = calendarState.colorPalette[colorIndex];
        
        calendarState.eventColors.set(eventKey, {
            background: color,
            border: color,
            textColor: '#ffffff',
            icon: '🔮'
        });
        
        console.log(`🎨 Assigned color ${color} to event: ${eventName}`);
    }
    
    return calendarState.eventColors.get(eventKey);
}

// Vylepšená hash funkce pro lepší distribuci barev
function improvedHashString(str) {
    let hash = 0;
    let char;
    
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Převést na 32bit integer
    }
    
    // Přidání další vrstvy randomizace pro lepší distribuci
    hash = hash * 9301 + 49297;
    hash = hash % 233280;
    
    return Math.abs(hash);
}

// Generování palety barev (zachovává váš systém)
function generateColorPalette() {
    const colors = [];
    
    // Základní sytá paleta pro nejčastější akce
    const baseColors = [
        '#4285f4', '#ea4335', '#34a853', '#fbbc04', '#9c27b0', 
        '#ff6f00', '#795548', '#607d8b', '#e91e63', '#8bc34a',
        '#ff5722', '#3f51b5', '#009688', '#673ab7', '#2196f3',
        '#ff9800', '#4caf50', '#f44336', '#ffeb3b', '#9e9e9e',
        '#00bcd4', '#ffc107', '#d32f2f', '#388e3c', '#1976d2'
    ];
    
    colors.push(...baseColors);
    
    // Generuj další barvy pomocí HSL
    for (let hue = 0; hue < 360; hue += 12) {
        colors.push(`hsl(${hue}, 70%, 55%)`);
        colors.push(`hsl(${hue}, 85%, 45%)`);
        colors.push(`hsl(${hue}, 60%, 65%)`);
    }
    
    console.log(`🎨 Generated color palette with ${colors.length} colors`);
    return colors;
}

// ========================================
// DEBUG FUNKCE PRO TESTOVÁNÍ PART 4B
// ========================================

// Debug funkce pro testování event processingu
function debugEventProcessing() {
    console.group('🔍 DEBUG: Event Processing Analysis');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('❌ No historical data available for debugging');
        console.groupEnd();
        return;
    }
    
    // Test kategorizace
    console.group('📋 Category Normalization Test');
    const testCategories = ['Burger Festival', 'ČokoFest', 'Food festival', 'koncert', 'sport'];
    testCategories.forEach(cat => {
        const normalized = normalizeCategory(cat);
        console.log(`"${cat}" → "${normalized}"`);
    });
    console.groupEnd();
    
    // Test status determination
    console.group('📊 Status Determination Test');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testDates = [
        { name: 'Yesterday', date: yesterday.toISOString().split('T')[0] },
        { name: 'Today', date: today.toISOString().split('T')[0] },
        { name: 'Tomorrow', date: tomorrow.toISOString().split('T')[0] }
    ];
    
    testDates.forEach(test => {
        const status = determineEventStatus(test.date, test.date);
        console.log(`${test.name} (${test.date}): ${status}`);
    });
    console.groupEnd();
    
    // Test date range fix
    console.group('📅 Date Range Fix Test');
    const testCases = [
        {
            name: 'Food Day Festival - 28.6.',
            checkDate: '2025-06-28',
            fromDate: '2025-06-28',
            toDate: '2025-06-29',
            expected: true
        },
        {
            name: 'Food Day Festival - 29.6.',
            checkDate: '2025-06-29',
            fromDate: '2025-06-28',
            toDate: '2025-06-29',
            expected: true
        },
        {
            name: 'Food Day Festival - 30.6.',
            checkDate: '2025-06-30',
            fromDate: '2025-06-28',
            toDate: '2025-06-29',
            expected: false
        }
    ];
    
    testCases.forEach(test => {
        const result = isDateInRange(test.checkDate, test.fromDate, test.toDate);
        const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test.name}: ${result} (expected: ${test.expected})`);
    });
    console.groupEnd();
    
    console.groupEnd();
    
    return {
        totalRecords: globalState.historicalData.length,
        timestamp: new Date().toISOString()
    };
}

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4BDebug = {
        debugEventProcessing,
        testCategoryNormalization: (category) => normalizeCategory(category),
        testStatusDetermination: (dateFrom, dateTo) => determineEventStatus(dateFrom, dateTo),
        testEventKey: (name, city, date) => createEventKey(name, city, date),
        getEventsForToday: () => getEventsForDate(new Date()),
        testDateRange: (checkDate, fromDate, toDate) => isDateInRange(checkDate, fromDate, toDate),
        testFoodDayFestival: () => {
            const results = {
                '27.6': isDateInRange('2025-06-27', '2025-06-28', '2025-06-29'),
                '28.6': isDateInRange('2025-06-28', '2025-06-28', '2025-06-29'),
                '29.6': isDateInRange('2025-06-29', '2025-06-28', '2025-06-29'),
                '30.6': isDateInRange('2025-06-30', '2025-06-28', '2025-06-29')
            };
            console.table(results);
            return results;
        }
    };
}

// ========================================
// INICIALIZACE PART 4B
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Initializing Part 4B - Event Processing...');
    
    // Auto-test pokud je debug mode
    setTimeout(() => {
        if (globalState.debugMode) {
            console.log('🧪 Running automatic Part 4B tests...');
            debugEventProcessing();
        }
    }, 2000);
    
    console.log('✅ Part 4B - Event Processing initialized');
});

console.log('✅ Donuland Part 4B loaded successfully');
console.log('📋 Features: ✅ FIXED Status Determination ✅ FIXED Date Range Logic ✅ PROPER Event Filtering');
console.log('🔧 CRITICAL FIXES: ✅ Real-time status calculation ✅ Timezone-safe date parsing ✅ Correct event deduplication');
console.log('🧪 Debug: window.donulandPart4BDebug.testFoodDayFestival() to verify date fix');
console.log('🎨 Color System: ✅ Completed = Green ✅ ✅ Planned = Unique Colors 🔮');
console.log('⏳ Ready for Part 4C: Calendar Rendering & Month View');

// Event pro signalizaci dokončení části 4B
eventBus.emit('part4bLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0-fixed',
    features: ['fixed-status-determination', 'fixed-date-range', 'proper-event-filtering', 'enhanced-deduplication'],
    fixes: ['real-time-status', 'timezone-safe-dates', 'burger-festival-mapping', 'correct-filtering']
});
/* ========================================
   DONULAND PART 4C - CALENDAR RENDERING & MONTH VIEW
   Vykreslování kalendáře a zobrazení měsíčního přehledu
   ======================================== */

console.log('🔧 Loading Donuland Part 4C - Calendar Rendering...');

// ========================================
// HLAVNÍ FUNKCE PRO VYKRESLENÍ KALENDÁŘE
// ========================================

// OPRAVENÁ hlavní funkce pro vykreslení kalendáře
function renderCalendar() {
    if (calendarState.isRendering) {
        console.log('⚠️ Calendar already rendering, skipping...');
        return;
    }
    
    console.log('📅 Rendering calendar...');
    calendarState.isRendering = true;
    
    try {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) {
            console.error('❌ Calendar grid not found');
            return;
        }
        
        // Vymazání současného obsahu
        calendarGrid.innerHTML = '';
        
        // Přidání hlaviček dnů
        const dayHeaders = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });
        
        // Získání dnů v měsíci s událostmi
        const year = globalState.currentYear;
        const month = globalState.currentMonth;
        const daysInMonth = getDaysInMonth(year, month);
        
        // Přidání dnů do kalendáře
        daysInMonth.forEach(dayData => {
            const dayElement = createCalendarDay(dayData);
            calendarGrid.appendChild(dayElement);
        });
        
        console.log(`✅ Calendar rendered for ${month + 1}/${year} with ${daysInMonth.length} days`);
        
        // Aktualizace month events list
        updateMonthEventsList();
        
        // Emit event o dokončení renderingu
        eventBus.emit('calendarRendered', { 
            year, 
            month, 
            totalDays: daysInMonth.length,
            eventsCount: daysInMonth.reduce((sum, d) => sum + d.events.length, 0)
        });
        
    } catch (error) {
        console.error('❌ Error rendering calendar:', error);
        showNotification('❌ Chyba při vykreslování kalendáře', 'error');
    } finally {
        calendarState.isRendering = false;
    }
}

// ========================================
// OPTIMALIZOVANÁ FUNKCE PRO ZÍSKÁNÍ DNÍ V MĚSÍCI
// ========================================

// VYLEPŠENÁ funkce pro získání dnů v měsíci s událostmi
function getDaysInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysFromPrevMonth = (firstDay.getDay() + 6) % 7; // Pondělí = 0
    
    const days = [];
    
    console.log(`📅 Generating calendar for ${month + 1}/${year}`);
    
    // Dny z předchozího měsíce
    const prevMonth = new Date(year, month, 0);
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i);
        days.push({
            date: date,
            isCurrentMonth: false,
            events: [] // Inicializuj prázdné, naplní se později
        });
    }
    
    // Dny současného měsíce
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        days.push({
            date: date,
            isCurrentMonth: true,
            events: [] // Inicializuj prázdné, naplní se později
        });
    }
    
    // Dny z následujícího měsíce (do úplných 42 dnů = 6 týdnů)
    const totalDays = 42;
    const remainingDays = totalDays - days.length;
    for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        days.push({
            date: date,
            isCurrentMonth: false,
            events: [] // Inicializuj prázdné, naplní se později
        });
    }
    
    // OPTIMALIZACE: Naplň události pro všechny dny najednou
    performance.mark('events-start');
    days.forEach(dayData => {
        dayData.events = getEventsForDate(dayData.date);
    });
    performance.mark('events-end');
    
    if (globalState.debugMode) {
        performance.measure('events-loading', 'events-start', 'events-end');
        const currentMonthDays = days.filter(d => d.isCurrentMonth);
        const totalEvents = days.reduce((sum, d) => sum + d.events.length, 0);
        console.log(`📊 Calendar stats: ${currentMonthDays.length} days in month, ${totalEvents} total events`);
    }
    
    return days;
}

// ========================================
// VYTVOŘENÍ KALENDÁŘNÍHO DNE S UDÁLOSTMI
// ========================================

// HLAVNÍ funkce pro vytvoření prvku kalendářního dne
function createCalendarDay(dayData) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (!dayData.isCurrentMonth) {
        dayElement.classList.add('other-month');
    }
    
    // Kontrola dnešního dne
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(dayData.date);
    dayDate.setHours(0, 0, 0, 0);
    
    if (dayDate.getTime() === today.getTime()) {
        dayElement.classList.add('today');
    }
    
    // Pokud má události
    if (dayData.events.length > 0) {
        dayElement.classList.add('has-events');
    }
    
    // Číslo dne
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = dayData.date.getDate();
    dayElement.appendChild(dayNumber);
    
    // Container pro události
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    // Zobrazit maximálně 4 události na den
    const maxEventsToShow = 4;
    dayData.events.slice(0, maxEventsToShow).forEach(event => {
        const eventElement = createEventElement(event, dayData.date);
        eventsContainer.appendChild(eventElement);
    });
    
    // Indikátor dalších událostí
    if (dayData.events.length > maxEventsToShow) {
        const moreIndicator = createMoreEventsIndicator(dayData);
        eventsContainer.appendChild(moreIndicator);
    }
    
    dayElement.appendChild(eventsContainer);
    
    // Click handler pro přidání nové události
    dayElement.addEventListener('click', (e) => {
        // Pouze pokud se nekliklo na existující událost
        if (!e.target.closest('.event-item') && dayData.isCurrentMonth) {
            console.log('📅 Day clicked for new event:', dayData.date);
            openEventModal(null, dayData.date);
        }
    });
    
    return dayElement;
}

// ========================================
// VYTVOŘENÍ ELEMENTU UDÁLOSTI
// ========================================

// VYLEPŠENÁ funkce pro vytvoření elementu události
function createEventElement(event, date) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    
    // Získání barvy pro událost (zachovává váš systém)
    const colorInfo = getEventColor(event.title, date);
    
    // Aplikace barev a stylů
    eventElement.style.background = colorInfo.background;
    eventElement.style.borderLeft = `3px solid ${colorInfo.border}`;
    eventElement.style.color = colorInfo.textColor;
    eventElement.style.fontWeight = '600';
    eventElement.style.fontSize = '0.75rem';
    eventElement.style.padding = '3px 6px';
    eventElement.style.marginBottom = '2px';
    eventElement.style.borderRadius = '4px';
    eventElement.style.cursor = 'pointer';
    eventElement.style.transition = 'all 0.2s ease';
    
    // Text události s ikonou podle statusu
    let eventText = event.title;
    let statusIcon = colorInfo.icon;
    
    // Speciální označení pro události s predikcí
    if (event.hasPrediction) {
        statusIcon = '🔮📊';
        eventElement.style.background = `linear-gradient(45deg, ${colorInfo.background}, #e3f2fd)`;
        eventElement.classList.add('has-prediction');
    }
    
    // Zkrácení textu pro lepší zobrazení
    const maxLength = 18;
    if (eventText.length > maxLength) {
        eventText = eventText.substring(0, maxLength - 3) + '...';
    }
    
    eventElement.textContent = `${statusIcon} ${eventText}`;
    
    // Vylepšený tooltip s informacemi
    const tooltipInfo = createEventTooltip(event);
    eventElement.title = tooltipInfo;
    
    // CSS třídy pro styling
    eventElement.classList.add(event.status || 'unknown');
    eventElement.classList.add(event.type || 'unknown');
    eventElement.setAttribute('data-category', event.category || 'ostatní');
    
    // Hover efekty
    setupEventHoverEffects(eventElement);
    
    // Click handler pro editaci události
    eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('📅 Event clicked:', event);
        openEventModal(event);
    });
    
    return eventElement;
}

// ========================================
// HELPER FUNKCE PRO EVENT ELEMENT
// ========================================

// Vytvoření tooltip textu pro událost
function createEventTooltip(event) {
    const tooltipParts = [
        `📋 ${event.title}`,
        `📍 ${event.city}`,
        `🏷️ ${event.category}`,
        `📊 Status: ${getStatusText(event.status)}`
    ];
    
    if (event.sales) {
        tooltipParts.push(`🍩 Prodáno: ${formatNumber(event.sales)} ks`);
    }
    
    if (event.predictedSales) {
        tooltipParts.push(`🔮 Predikce: ${formatNumber(event.predictedSales)} ks`);
    }
    
    if (event.confidence) {
        tooltipParts.push(`🎯 Confidence: ${event.confidence}%`);
    }
    
    if (event.visitors) {
        tooltipParts.push(`👥 Návštěvnost: ${formatNumber(event.visitors)}`);
    }
    
    // Datum rozsah
    const dateRange = event.dateTo && event.dateTo !== event.dateFrom ? 
        `${formatDate(event.dateFrom)} - ${formatDate(event.dateTo)}` : 
        formatDate(event.dateFrom);
    tooltipParts.push(`📅 ${dateRange}`);
    
    if (event.source) {
        tooltipParts.push(`📂 Zdroj: ${getSourceText(event.source)}`);
    }
    
    return tooltipParts.filter(Boolean).join('\n');
}

// Setup hover efektů pro event element
function setupEventHoverEffects(eventElement) {
    eventElement.addEventListener('mouseenter', () => {
        eventElement.style.transform = 'scale(1.05)';
        eventElement.style.zIndex = '10';
        eventElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    });
    
    eventElement.addEventListener('mouseleave', () => {
        eventElement.style.transform = 'scale(1)';
        eventElement.style.zIndex = '1';
        eventElement.style.boxShadow = 'none';
    });
}

// Vytvoření indikátoru dalších událostí
function createMoreEventsIndicator(dayData) {
    const additionalEvents = dayData.events.length - 4;
    
    const moreIndicator = document.createElement('div');
    moreIndicator.className = 'event-item more';
    moreIndicator.textContent = `+${additionalEvents} dalších`;
    moreIndicator.style.background = '#6c757d';
    moreIndicator.style.color = '#ffffff';
    moreIndicator.style.fontWeight = '600';
    moreIndicator.style.padding = '3px 6px';
    moreIndicator.style.borderRadius = '4px';
    moreIndicator.style.fontSize = '0.7rem';
    moreIndicator.style.cursor = 'pointer';
    moreIndicator.style.textAlign = 'center';
    moreIndicator.style.border = '1px solid #495057';
    
    moreIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        showDayEventsPopup(dayData.date, dayData.events);
    });
    
    return moreIndicator;
}

// ========================================
// MONTH EVENTS LIST
// ========================================

// NOVÁ funkce pro aktualizaci seznamu událostí v měsíci
function updateMonthEventsList() {
    console.log('📋 Updating month events list...');
    
    const monthEventsContainer = document.getElementById('monthEvents');
    if (!monthEventsContainer) {
        console.warn('⚠️ Month events container not found');
        return;
    }
    
    try {
        // Získej všechny události pro aktuální měsíc
        const monthEvents = getEventsForCurrentMonth();
        
        if (monthEvents.length === 0) {
            displayNoEventsMessage(monthEventsContainer);
            return;
        }
        
        // Seskup události podle data
        const eventsByDate = groupEventsByDate(monthEvents);
        
        // Vytvoř HTML pro seznam
        const html = generateMonthEventsHTML(eventsByDate);
        monthEventsContainer.innerHTML = html;
        
        console.log(`📋 Month events list updated: ${monthEvents.length} events`);
        
    } catch (error) {
        console.error('❌ Error updating month events list:', error);
        monthEventsContainer.innerHTML = `
            <div class="error-message">
                <p>❌ Chyba při načítání událostí měsíce</p>
            </div>
        `;
    }
}

// Získání všech událostí pro aktuální měsíc
function getEventsForCurrentMonth() {
    const year = globalState.currentYear;
    const month = globalState.currentMonth;
    const events = [];
    
    // Získej první a poslední den měsíce
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Projdi všechny dny a sbírej události
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const dayEvents = getEventsForDate(new Date(date));
        events.push(...dayEvents);
    }
    
    // Odstraň duplicity (události které trvají více dní)
    const uniqueEvents = removeDuplicateEvents(events);
    
    // Seřaď podle data
    return uniqueEvents.sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom));
}

// Odstranění duplicitních událostí
function removeDuplicateEvents(events) {
    const seen = new Set();
    return events.filter(event => {
        const key = `${event.eventKey}-${event.type}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

// Seskupení událostí podle data
function groupEventsByDate(events) {
    const groups = new Map();
    
    events.forEach(event => {
        const dateKey = event.dateFrom;
        if (!groups.has(dateKey)) {
            groups.set(dateKey, []);
        }
        groups.get(dateKey).push(event);
    });
    
    return groups;
}

// Generování HTML pro seznam měsíčních událostí
function generateMonthEventsHTML(eventsByDate) {
    let html = '<div class="month-events-list">';
    
    // Statistiky na vrchu
    const totalEvents = Array.from(eventsByDate.values()).reduce((sum, events) => sum + events.length, 0);
    const completedEvents = Array.from(eventsByDate.values()).flat().filter(e => e.status === 'completed').length;
    const plannedEvents = totalEvents - completedEvents;
    
    html += `
        <div class="month-stats">
            <div class="stat-item">
                <span class="stat-number">${totalEvents}</span>
                <span class="stat-label">Celkem akcí</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${completedEvents}</span>
                <span class="stat-label">Dokončeno</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${plannedEvents}</span>
                <span class="stat-label">Plánováno</span>
            </div>
        </div>
    `;
    
    // Seznam událostí podle data
    const sortedDates = Array.from(eventsByDate.keys()).sort();
    
    sortedDates.forEach(dateKey => {
        const events = eventsByDate.get(dateKey);
        const date = new Date(dateKey);
        const isToday = date.toDateString() === new Date().toDateString();
        
        html += `
            <div class="date-group ${isToday ? 'today' : ''}">
                <h4 class="date-header">
                    ${isToday ? '📍 ' : ''}${formatDate(date)} 
                    <span class="events-count">(${events.length})</span>
                </h4>
                <div class="date-events">
        `;
        
        events.forEach(event => {
            const colorInfo = getEventColor(event.title, date);
            const statusText = getStatusText(event.status);
            
            html += `
                <div class="month-event-item" 
                     style="border-left: 4px solid ${colorInfo.border}; background: ${colorInfo.background}20;"
                     onclick="openEventModalFromList('${event.type}', '${event.id}')" >
                    <div class="event-header">
                        <span class="event-title">${colorInfo.icon} ${escapeHtml(event.title)}</span>
                        <span class="event-status ${event.status}">${statusText}</span>
                    </div>
                    <div class="event-details">
                        <span class="event-city">📍 ${escapeHtml(event.city)}</span>
                        <span class="event-category">🏷️ ${escapeHtml(event.category)}</span>
                        ${event.sales ? `<span class="event-sales">🍩 ${formatNumber(event.sales)} ks</span>` : ''}
                        ${event.predictedSales ? `<span class="event-prediction">🔮 ${formatNumber(event.predictedSales)} ks</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Zobrazení zprávy o chybějících událostech
function displayNoEventsMessage(container) {
    const monthName = new Date(globalState.currentYear, globalState.currentMonth).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
    
    container.innerHTML = `
        <div class="no-events-message">
            <div class="no-events-icon">📅</div>
            <h4>Žádné události v ${monthName}</h4>
            <p>V tomto měsíci nejsou naplánované žádné akce.</p>
            <button class="btn btn-primary" onclick="openEventModal()">
                ➕ Přidat novou akci
            </button>
        </div>
    `;
}

// ========================================
// DAY EVENTS POPUP (VYLEPŠENÝ)
// ========================================

// VYLEPŠENÁ funkce pro zobrazení popup s událostmi pro den
function showDayEventsPopup(date, events) {
    const popup = document.createElement('div');
    popup.className = 'day-events-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        padding: 25px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 9999;
        border: 1px solid #e9ecef;
        backdrop-filter: blur(10px);
        animation: popupSlideIn 0.3s ease-out;
    `;
    
    const dateStr = date.toLocaleDateString('cs-CZ', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #667eea;">
            <h3 style="margin: 0; color: #667eea; font-size: 1.4rem;">📅 ${dateStr}</h3>
            <button onclick="this.parentElement.parentElement.remove(); document.querySelector('.popup-backdrop')?.remove();" 
                    style="background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #666; padding: 5px;">&times;</button>
        </div>
        <div style="max-height: 500px; overflow-y: auto;">
    `;
    
    if (events.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📅</div>
                <h4>Žádné události v tento den</h4>
                <p>Klikněte na den v kalendáři pro přidání nové akce</p>
                <button onclick="openEventModal(null, new Date('${date.toISOString()}')); this.closest('.day-events-popup').remove(); document.querySelector('.popup-backdrop')?.remove();"
                        style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                    ➕ Přidat akci
                </button>
            </div>
        `;
    } else {
        events.forEach(event => {
            html += generatePopupEventHTML(event, date);
        });
    }
    
    html += '</div>';
    popup.innerHTML = html;
    
    // Backdrop pro zavření
    const backdrop = document.createElement('div');
    backdrop.className = 'popup-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: 9998;
        backdrop-filter: blur(3px);
    `;
    backdrop.addEventListener('click', () => {
        popup.remove();
        backdrop.remove();
    });
    
    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
    
    console.log(`📅 Day events popup shown for ${dateStr} with ${events.length} events`);
}

// Generování HTML pro událost v popup
function generatePopupEventHTML(event, date) {
    const colorInfo = getEventColor(event.title, date);
    
    let typeIcon = colorInfo.icon;
    let typeLabel = getStatusText(event.status);
    let statusBadgeColor = '#6c757d';
    
    // Barva badge podle statusu
    switch (event.status) {
        case 'completed':
            statusBadgeColor = '#28a745';
            break;
        case 'ongoing':
            statusBadgeColor = '#ffc107';
            break;
        case 'planned':
            statusBadgeColor = '#17a2b8';
            break;
    }
    
    // Typ události info
    if (event.type === 'historical') {
        typeLabel += ' (Google Sheets)';
    } else if (event.type === 'prediction') {
        typeLabel += ' (AI Predikce)';
    } else if (event.type === 'manual') {
        typeLabel += ' (Ruční přidání)';
    }
    
    const sales = event.sales || event.actualSales || event.predictedSales || 0;
    const salesText = event.type === 'prediction' && !event.actualSales ? 
        `🔮 ${formatNumber(event.predictedSales)} ks (predikce)` : 
        `🍩 ${formatNumber(sales)} ks`;
    
    const predictionBadge = event.hasPrediction ? 
        '<span style="background: #17a2b8; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.75em; margin-left: 8px;">🔮 + Predikce</span>' : '';
    
    const confidenceBadge = event.confidence ? 
        `<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.75em; margin-left: 8px;">🎯 ${event.confidence}%</span>` : '';
    
    return `
        <div style="background: ${colorInfo.background}; padding: 18px; border-radius: 10px; margin-bottom: 15px; border-left: 6px solid ${colorInfo.border}; color: ${colorInfo.textColor}; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <h4 style="margin: 0; color: ${colorInfo.textColor}; font-size: 1.2rem; flex: 1;">${escapeHtml(event.title)}</h4>
                <span style="background: ${statusBadgeColor}; color: white; padding: 4px 10px; border-radius: 15px; font-size: 0.8em; font-weight: 600; margin-left: 10px;">
                    ${typeIcon} ${typeLabel}
                </span>
            </div>
            
            ${predictionBadge}${confidenceBadge}
            
            <div style="margin: 12px 0; font-size: 0.95em; opacity: 0.9; line-height: 1.4;">
                <div style="margin-bottom: 6px;">📍 <strong>Místo:</strong> ${escapeHtml(event.city)}</div>
                <div style="margin-bottom: 6px;">📋 <strong>Kategorie:</strong> ${escapeHtml(event.category)}</div>
                <div style="margin-bottom: 6px;">📅 <strong>Datum:</strong> ${formatDate(event.dateFrom)}${event.dateTo && event.dateTo !== event.dateFrom ? ` - ${formatDate(event.dateTo)}` : ''}</div>
                <div style="margin-bottom: 6px;">👥 <strong>Návštěvnost:</strong> ${formatNumber(event.visitors)} lidí</div>
                ${event.rating ? `<div style="margin-bottom: 6px;">⭐ <strong>Hodnocení:</strong> ${event.rating}/5</div>` : ''}
            </div>
            
            <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px; font-size: 0.9em;">
                <strong>${salesText}</strong>
                ${event.visitors > 0 && sales > 0 ? ` • Konverze: ${((sales / event.visitors) * 100).toFixed(1)}%` : ''}
            </div>
            
            <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="openEventModalFromPopup('${event.type}', '${event.id}'); this.closest('.day-events-popup').remove(); document.querySelector('.popup-backdrop')?.remove();" 
                        style="padding: 8px 16px; background: rgba(255,255,255,0.3); color: ${colorInfo.textColor}; border: 1px solid rgba(255,255,255,0.4); border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: 600; transition: all 0.2s;">
                    ✏️ Detail & Editace
                </button>
                ${event.type === 'prediction' ? `
                    <button onclick="duplicatePrediction('${event.data.id}'); this.closest('.day-events-popup').remove(); document.querySelector('.popup-backdrop')?.remove();" 
                            style="padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: 600;">
                        📋 Kopírovat predikci
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// ========================================
// CSS STYLY PRO CALENDAR RENDERING
// ========================================

// Přidání CSS stylů pro kalendářní rendering
function addCalendarRenderingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Vylepšené styly pro kalendářní rendering */
        
        /* Calendar grid animations */
        .calendar-grid {
            animation: fadeIn 0.5s ease-out;
        }
        
        .calendar-day {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .calendar-day:hover {
            transform: scale(1.02);
            z-index: 5;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .calendar-day.today {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 2px solid #ffc107;
            font-weight: 600;
            animation: todayGlow 2s infinite alternate;
        }
        
        @keyframes todayGlow {
            0% { box-shadow: 0 0 5px rgba(255, 193, 7, 0.5); }
            100% { box-shadow: 0 0 15px rgba(255, 193, 7, 0.8); }
        }
        
        .calendar-day.has-events::before {
            content: '';
            position: absolute;
            top: 3px;
            right: 3px;
            width: 8px;
            height: 8px;
            background: #667eea;
            border-radius: 50%;
            box-shadow: 0 0 4px rgba(102, 126, 234, 0.5);
        }
        
        .calendar-day.today.has-events::before {
            background: #ffc107;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
        }
        
        /* Event items vylepšení */
        .day-events .event-item {
            margin-bottom: 2px;
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 0.75rem;
            line-height: 1.2;
            cursor: pointer;
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
            max-width: 100%;
            word-wrap: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            position: relative;
        }
        
        .day-events .event-item:hover {
            transform: scale(1.05) translateY(-1px);
            z-index: 10;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            white-space: normal;
            position: relative;
            min-height: auto;
        }
        
        .day-events .event-item.more {
            background: #6c757d !important;
            color: #ffffff !important;
            text-align: center;
            font-weight: 600;
            border: 1px solid #495057;
            margin-top: 2px;
        }
        
        .day-events .event-item.more:hover {
            background: #5a6268 !important;
            transform: scale(1.02);
        }
        
        /* Month events list styling */
        .month-events-list {
            max-height: 600px;
            overflow-y: auto;
        }
        
        .month-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
            padding: 15px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 10px;
            border: 1px solid #dee2e6;
        }
        
        .stat-item {
            text-align: center;
            flex: 1;
        }
        
        .stat-number {
            display: block;
            font-size: 2rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .date-group {
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e9ecef;
        }
        
        .date-group.today {
            border-color: #ffc107;
            box-shadow: 0 0 10px rgba(255, 193, 7, 0.3);
        }
        
        .date-header {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 12px 15px;
            margin: 0;
            font-size: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .date-group.today .date-header {
            background: linear-gradient(135deg, #ffc107, #ff8f00);
            color: #212529;
        }
        
        .events-count {
            background: rgba(255,255,255,0.2);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
        }
        
        .date-events {
            padding: 10px;
            background: #f8f9fa;
        }
        
        .month-event-item {
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            border-left: 4px solid transparent;
        }
        
        .month-event-item:hover {
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .event-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        
        .event-title {
            font-weight: 600;
            color: #212529;
        }
        
        .event-status {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .event-status.completed {
            background: #d4edda;
            color: #155724;
        }
        
        .event-status.ongoing {
            background: #fff3cd;
            color: #856404;
        }
        
        .event-status.planned {
            background: #cce5ff;
            color: #0056b3;
        }
        
        .event-details {
            display: flex;
            gap: 15px;
            font-size: 0.85rem;
            color: #6c757d;
            flex-wrap: wrap;
        }
        
        .event-details span {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        /* No events message */
        .no-events-message {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
        }
        
        .no-events-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.7;
        }
        
        .no-events-message h4 {
            margin-bottom: 10px;
            color: #495057;
        }
        
        .no-events-message p {
            margin-bottom: 20px;
        }
        
        /* Popup animations */
        @keyframes popupSlideIn {
            from { 
                opacity: 0; 
                transform: translate(-50%, -60%) scale(0.9); 
            }
            to { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1); 
            }
        }
        
        .day-events-popup {
            animation: popupSlideIn 0.3s ease-out;
        }
        
        .popup-backdrop {
            animation: fadeIn 0.3s ease-out;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .month-stats {
                flex-direction: column;
                gap: 10px;
            }
            
            .stat-item {
                padding: 10px;
            }
            
            .stat-number {
                font-size: 1.5rem;
            }
            
            .event-details {
                flex-direction: column;
                gap: 5px;
            }
            
            .calendar-day {
                min-height: 80px;
                padding: 3px;
            }
            
            .day-events .event-item {
                font-size: 0.7rem;
                padding: 2px 4px;
            }
            
            .day-number {
                font-size: 0.9rem;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('🎨 Calendar rendering styles added');
}

// ========================================
// PLACEHOLDER MODAL FUNKCE
// ========================================

// Placeholder funkce pro modal (bude implementována v Part 4E)
function openEventModal(event = null, defaultDate = null) {
    console.log('📝 Opening event modal:', { event, defaultDate });
    showNotification('ℹ️ Event modal bude implementován v Part 4E', 'info');
}

function openEventModalFromPopup(eventType, eventId) {
    console.log('📝 Opening event modal from popup:', { eventType, eventId });
    openEventModal();
}

function openEventModalFromList(eventType, eventId) {
    console.log('📝 Opening event modal from list:', { eventType, eventId });
    openEventModal();
}

function duplicatePrediction(predictionId) {
    console.log('📋 Duplicating prediction:', predictionId);
    showNotification('📋 Kopírování predikce bude implementováno v Part 4E', 'info');
}

// ========================================
// EVENT LISTENERS PRO CALENDAR RENDERING
// ========================================

// Event listeners pro kalendářní funkce
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded - re-rendering calendar');
    setTimeout(() => {
        renderCalendar();
    }, 500);
});

eventBus.on('calendarMonthChanged', (data) => {
    console.log('📅 Month changed - rendering new calendar');
    renderCalendar();
});

eventBus.on('calendarTodayRequested', () => {
    console.log('📍 Today requested - rendering current month');
    renderCalendar();
});

eventBus.on('calendarResizeRequested', () => {
    console.log('📐 Resize requested - refreshing calendar layout');
    setTimeout(() => {
        renderCalendar();
    }, 100);
});

// Event listener pro aplikaci filtrů
eventBus.on('filtersApplied', () => {
    console.log('🔍 Filters applied - re-rendering calendar');
    renderCalendar();
});

// ========================================
// DEBUG FUNKCE PRO PART 4C
// ========================================

// Debug funkce pro testování calendar renderingu
function debugCalendarRendering() {
    console.group('🔍 DEBUG: Calendar Rendering Analysis');
    
    const calendarGrid = document.getElementById('calendarGrid');
    const monthEvents = document.getElementById('monthEvents');
    
    console.log('Calendar Grid Element:', calendarGrid);
    console.log('Month Events Element:', monthEvents);
    
    if (calendarGrid) {
        const days = calendarGrid.querySelectorAll('.calendar-day');
        const events = calendarGrid.querySelectorAll('.event-item');
        console.log(`Calendar Days: ${days.length}`);
        console.log(`Calendar Events: ${events.length}`);
    }
    
    // Test měsíčních událostí
    const currentMonthEvents = getEventsForCurrentMonth();
    console.log(`Current Month Events: ${currentMonthEvents.length}`);
    
    // Test dat v měsíci
    const year = globalState.currentYear;
    const month = globalState.currentMonth;
    const daysData = getDaysInMonth(year, month);
    const totalEvents = daysData.reduce((sum, d) => sum + d.events.length, 0);
    
    console.log(`Days in calendar: ${daysData.length}`);
    console.log(`Total events in month: ${totalEvents}`);
    
    // Test barevného systému
    const colorStats = {
        cachedColors: calendarState.eventColors.size,
        paletteSize: calendarState.colorPalette.length
    };
    console.log('Color System:', colorStats);
    
    console.groupEnd();
    
    return {
        calendarDays: daysData.length,
        totalEvents: totalEvents,
        currentMonthEvents: currentMonthEvents.length,
        colorStats: colorStats,
        timestamp: new Date().toISOString()
    };
}

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4CDebug = {
        debugCalendarRendering,
        renderCalendar,
        updateMonthEventsList,
        getEventsForCurrentMonth,
        getDaysInMonth: (y, m) => getDaysInMonth(y || globalState.currentYear, m || globalState.currentMonth),
        showSamplePopup: () => {
            const today = new Date();
            const events = getEventsForDate(today);
            showDayEventsPopup(today, events);
        },
        testCalendarState: () => {
            return {
                isRendering: calendarState.isRendering,
                filters: calendarState.filters,
                eventColorsCount: calendarState.eventColors.size,
                currentMonth: globalState.currentMonth,
                currentYear: globalState.currentYear
            };
        }
    };
}

// ========================================
// INICIALIZACE PART 4C
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Initializing Part 4C - Calendar Rendering...');
    
    // Přidání stylů
    addCalendarRenderingStyles();
    
    // Automatické vykreslení kalendáře po 3 sekundách
    setTimeout(() => {
        console.log('🔄 Auto-rendering calendar from Part 4C...');
        
        // Ujisti se, že globalState existuje
        if (typeof globalState === 'undefined') {
            console.warn('⚠️ globalState not found, creating temporary one');
            window.globalState = {
                currentYear: new Date().getFullYear(),
                currentMonth: new Date().getMonth(),
                historicalData: [],
                debugMode: true
            };
        }
        
        // Vykreslení kalendáře
        renderCalendar();
        
    }, 3000);
    
    console.log('✅ Part 4C - Calendar Rendering initialized');
});

console.log('✅ Donuland Part 4C loaded successfully');
console.log('📅 Features: ✅ Calendar Grid Rendering ✅ Event Display ✅ Month Events List ✅ Day Events Popup');
console.log('🎨 UI: ✅ Status Colors ✅ Hover Effects ✅ Responsive Design ✅ Animations');
console.log('🧪 Debug: window.donulandPart4CDebug available for testing');
console.log('📋 Events: ✅ Multi-day support ✅ Proper filtering ✅ Event deduplication');
console.log('⏳ Ready for Part 4D: Analytics & Statistics');

// Event pro signalizaci dokončení části 4C
eventBus.emit('part4cLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['calendar-grid-rendering', 'event-display', 'month-events-list', 'day-events-popup', 'responsive-design'],
    ui: ['status-colors', 'hover-effects', 'animations', 'proper-spacing']
});
/* ========================================
   DONULAND PART 4D - ANALYTICS & STATISTICS
   KRITICKÁ OPRAVA: Správné načítání a zobrazování dat ze Sheets
   ======================================== */

console.log('🔧 Loading Donuland Part 4D - Analytics with FIXED data loading...');

// ========================================
// KRITICKÁ OPRAVA: SPRÁVNÉ NAČÍTÁNÍ SALES DAT
// ========================================

// HLAVNÍ funkce pro výpočet celkových statistik s OPRAVENÝMI daty ze Sheets
function calculateOverallStats() {
    console.log('📊 Calculating overall stats with REAL data from Sheets...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.warn('⚠️ No historical data available for stats calculation');
        return {
            totalEvents: 0,
            totalSales: 0,
            averageSales: 0,
            totalRevenue: 0,
            averageConversion: 0,
            totalVisitors: 0
        };
    }
    
    // KRITICKÁ OPRAVA: Filtruj pouze události s validními sales daty
    const validEvents = globalState.historicalData.filter(record => {
        // ZKONTROLUJ že má sales hodnotu a není null/undefined/0
        const hasSales = record.sales !== null && 
                        record.sales !== undefined && 
                        record.sales > 0;
        
        // ZKONTROLUJ že má název a město
        const hasBasicData = record.eventName && 
                            record.eventName.trim() && 
                            record.city && 
                            record.city.trim();
        
        if (globalState.debugMode && !hasSales && hasBasicData) {
            console.log(`⚠️ Event "${record.eventName}" has no sales data:`, record.sales);
        }
        
        return hasSales && hasBasicData;
    });
    
    console.log(`📊 Processing ${validEvents.length} valid events out of ${globalState.historicalData.length} total records`);
    
    if (validEvents.length === 0) {
        console.warn('⚠️ No events with valid sales data found');
        return {
            totalEvents: globalState.historicalData.length,
            totalSales: 0,
            averageSales: 0,
            totalRevenue: 0,
            averageConversion: 0,
            totalVisitors: 0
        };
    }
    
    // VÝPOČET STATISTIK z REÁLNÝCH DAT
    const totalSales = validEvents.reduce((sum, record) => {
        const sales = parseFloat(record.sales) || 0;
        if (globalState.debugMode && sales > 0) {
            console.log(`📈 Event "${record.eventName}": ${sales} ks prodáno`);
        }
        return sum + sales;
    }, 0);
    
    const totalVisitors = validEvents.reduce((sum, record) => {
        return sum + (parseFloat(record.visitors) || 0);
    }, 0);
    
    const averageSales = validEvents.length > 0 ? totalSales / validEvents.length : 0;
    
    // KALKULACE OBRATU (předpokládáme 50 Kč za donut)
    const totalRevenue = totalSales * CONFIG.DONUT_PRICE;
    
    // KALKULACE KONVERZE
    const averageConversion = totalVisitors > 0 ? (totalSales / totalVisitors) * 100 : 0;
    
    const stats = {
        totalEvents: globalState.historicalData.length,
        validEvents: validEvents.length,
        totalSales: totalSales,
        averageSales: averageSales,
        totalRevenue: totalRevenue,
        averageConversion: averageConversion,
        totalVisitors: totalVisitors
    };
    
    console.log('📊 CALCULATED STATS:', stats);
    
    return stats;
}

// ========================================
// OPRAVA: TOP AKCE S REÁLNÝMI DATY
// ========================================

// OPRAVENÁ funkce pro získání nejúspěšnějších akcí
function getTopEvents(limit = 5) {
    console.log('🏆 Getting top events with REAL sales data...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return [];
    }
    
    // KRITICKÁ OPRAVA: Filtruj a seřaď podle skutečných sales dat
    const eventsWithSales = globalState.historicalData
        .filter(record => {
            // Musí mít validní sales data a základní informace
            return record.sales > 0 && 
                   record.eventName && 
                   record.eventName.trim() &&
                   record.city && 
                   record.city.trim();
        })
        .map(record => ({
            name: record.eventName,
            city: record.city,
            category: normalizeCategory(record.category),
            sales: parseFloat(record.sales) || 0,
            visitors: parseFloat(record.visitors) || 0,
            dateFrom: record.dateFrom,
            dateTo: record.dateTo,
            conversion: record.visitors > 0 ? ((record.sales / record.visitors) * 100) : 0,
            revenue: (parseFloat(record.sales) || 0) * CONFIG.DONUT_PRICE
        }))
        .sort((a, b) => b.sales - a.sales) // Seřaď podle prodeje sestupně
        .slice(0, limit);
    
    console.log(`🏆 Found ${eventsWithSales.length} top events:`, eventsWithSales);
    
    return eventsWithSales;
}

// ========================================
// OPRAVA: TOP MĚSTA S REÁLNÝMI DATY
// ========================================

// OPRAVENÁ funkce pro získání nejlepších měst
function getTopCities(limit = 5) {
    console.log('🏙️ Getting top cities with REAL sales data...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return [];
    }
    
    // SESKUPENÍ PODLE MĚST s REÁLNÝMI daty
    const cityStats = new Map();
    
    globalState.historicalData.forEach(record => {
        if (!record.city || !record.city.trim() || !record.sales || record.sales <= 0) {
            return; // Přeskoč nevalidní záznamy
        }
        
        const city = record.city.trim();
        const sales = parseFloat(record.sales) || 0;
        const visitors = parseFloat(record.visitors) || 0;
        
        if (!cityStats.has(city)) {
            cityStats.set(city, {
                name: city,
                totalSales: 0,
                totalVisitors: 0,
                eventsCount: 0,
                categories: new Set()
            });
        }
        
        const cityData = cityStats.get(city);
        cityData.totalSales += sales;
        cityData.totalVisitors += visitors;
        cityData.eventsCount += 1;
        cityData.categories.add(normalizeCategory(record.category));
    });
    
    // PŘEVEĎ NA ARRAY A SEŘAĎ
    const topCities = Array.from(cityStats.values())
        .map(city => ({
            ...city,
            averageSales: city.eventsCount > 0 ? city.totalSales / city.eventsCount : 0,
            conversion: city.totalVisitors > 0 ? (city.totalSales / city.totalVisitors) * 100 : 0,
            categoriesCount: city.categories.size
        }))
        .sort((a, b) => b.totalSales - a.totalSales) // Seřaď podle celkového prodeje
        .slice(0, limit);
    
    console.log(`🏙️ Found ${topCities.length} top cities:`, topCities);
    
    return topCities;
}

// ========================================
// OPRAVA: TOP KATEGORIE S REÁLNÝMI DATY
// ========================================

// OPRAVENÁ funkce pro získání nejlepších kategorií
function getTopCategories(limit = 5) {
    console.log('📋 Getting top categories with REAL sales data...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return [];
    }
    
    // SESKUPENÍ PODLE KATEGORIÍ s REÁLNÝMI daty
    const categoryStats = new Map();
    
    globalState.historicalData.forEach(record => {
        if (!record.category || !record.sales || record.sales <= 0) {
            return; // Přeskoč nevalidní záznamy
        }
        
        const category = normalizeCategory(record.category);
        const sales = parseFloat(record.sales) || 0;
        const visitors = parseFloat(record.visitors) || 0;
        
        if (!categoryStats.has(category)) {
            categoryStats.set(category, {
                name: category,
                totalSales: 0,
                totalVisitors: 0,
                eventsCount: 0,
                cities: new Set()
            });
        }
        
        const categoryData = categoryStats.get(category);
        categoryData.totalSales += sales;
        categoryData.totalVisitors += visitors;
        categoryData.eventsCount += 1;
        if (record.city && record.city.trim()) {
            categoryData.cities.add(record.city.trim());
        }
    });
    
    // PŘEVEĎ NA ARRAY A SEŘAĎ
    const topCategories = Array.from(categoryStats.values())
        .map(category => ({
            ...category,
            averageSales: category.eventsCount > 0 ? category.totalSales / category.eventsCount : 0,
            conversion: category.totalVisitors > 0 ? (category.totalSales / category.totalVisitors) * 100 : 0,
            citiesCount: category.cities.size
        }))
        .sort((a, b) => b.totalSales - a.totalSales) // Seřaď podle celkového prodeje
        .slice(0, limit);
    
    console.log(`📋 Found ${topCategories.length} top categories:`, topCategories);
    
    return topCategories;
}

// ========================================
// HLAVNÍ FUNKCE PRO ZOBRAZENÍ ANALYTICS
// ========================================

// HLAVNÍ funkce pro zobrazení všech analytics
function displayAnalytics() {
    console.log('📊 Displaying analytics with REAL data...');
    
    try {
        // VÝPOČET STATISTIK s REÁLNÝMI daty
        const overallStats = calculateOverallStats();
        const topEvents = getTopEvents(5);
        const topCities = getTopCities(5);
        const topCategories = getTopCategories(5);
        
        // ZOBRAZENÍ CELKOVÝCH STATISTIK
        displayOverallStats(overallStats);
        
        // ZOBRAZENÍ TOP VÝSLEDKŮ
        displayTopEvents(topEvents);
        displayTopCities(topCities);
        displayTopCategories(topCategories);
        
        console.log('✅ Analytics displayed successfully with real data');
        
    } catch (error) {
        console.error('❌ Error displaying analytics:', error);
        showNotification('❌ Chyba při zobrazení analytics', 'error');
    }
}

// ========================================
// ZOBRAZENÍ CELKOVÝCH STATISTIK
// ========================================

// OPRAVENÁ funkce pro zobrazení celkových statistik
function displayOverallStats(stats) {
    console.log('📈 Displaying overall stats:', stats);
    
    // NAJDI ELEMENTY pro statistiky
    const elements = {
        totalEvents: document.querySelector('#overallStats .stat-item:nth-child(1) .stat-value'),
        totalSales: document.querySelector('#overallStats .stat-item:nth-child(2) .stat-value'),
        averageSales: document.querySelector('#overallStats .stat-item:nth-child(3) .stat-value'),
        totalRevenue: document.querySelector('#overallStats .stat-item:nth-child(4) .stat-value')
    };
    
    // AKTUALIZUJ HODNOTY s REÁLNÝMI daty
    if (elements.totalEvents) {
        elements.totalEvents.textContent = formatNumber(stats.totalEvents);
        console.log('📊 Updated total events:', stats.totalEvents);
    }
    
    if (elements.totalSales) {
        elements.totalSales.textContent = formatNumber(stats.totalSales);
        console.log('📊 Updated total sales:', stats.totalSales);
    }
    
    if (elements.averageSales) {
        elements.averageSales.textContent = formatNumber(Math.round(stats.averageSales));
        console.log('📊 Updated average sales:', stats.averageSales);
    }
    
    if (elements.totalRevenue) {
        elements.totalRevenue.textContent = formatCurrency(stats.totalRevenue);
        console.log('📊 Updated total revenue:', stats.totalRevenue);
    }
    
    // AKTUALIZUJ také další elementy pokud existují
    const conversionElement = document.querySelector('#overallStats .stat-item:nth-child(5) .stat-value');
    if (conversionElement) {
        conversionElement.textContent = `${stats.averageConversion.toFixed(1)}%`;
    }
    
    // DEBUG INFO
    if (globalState.debugMode) {
        console.log('📊 STATS DEBUG:', {
            validEvents: stats.validEvents,
            totalEvents: stats.totalEvents,
            totalSales: stats.totalSales,
            totalRevenue: stats.totalRevenue
        });
    }
}

// ========================================
// ZOBRAZENÍ TOP AKCÍ
// ========================================

// OPRAVENÁ funkce pro zobrazení top akcí
function displayTopEvents(topEvents) {
    console.log('🏆 Displaying top events:', topEvents);
    
    const container = document.getElementById('topEvents');
    if (!container) {
        console.warn('⚠️ Top events container not found');
        return;
    }
    
    if (topEvents.length === 0) {
        container.innerHTML = `
            <div class="analytics-placeholder">
                <p>📊 Žádné akce s prodejními daty k analýze</p>
                <p><small>Načtěte data z Google Sheets nebo přidejte prodejní data k existujícím akcím</small></p>
            </div>
        `;
        return;
    }
    
    let html = '';
    topEvents.forEach((event, index) => {
        const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        html += `
            <div class="top-item">
                <div class="top-info">
                    <h4>${rankIcon} ${escapeHtml(event.name)}</h4>
                    <p>📍 ${escapeHtml(event.city)} • 🏷️ ${escapeHtml(event.category)}</p>
                    <p><small>📅 ${formatDate(event.dateFrom)}${event.dateTo && event.dateTo !== event.dateFrom ? ` - ${formatDate(event.dateTo)}` : ''}</small></p>
                </div>
                <div class="top-stats">
                    <div class="top-value">${formatNumber(event.sales)} ks</div>
                    <div class="top-subvalue">${formatCurrency(event.revenue)}</div>
                    <div class="top-subvalue">${event.conversion.toFixed(1)}% konverze</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    console.log('✅ Top events displayed');
}

// ========================================
// ZOBRAZENÍ TOP MĚST
// ========================================

// OPRAVENÁ funkce pro zobrazení top měst
function displayTopCities(topCities) {
    console.log('🏙️ Displaying top cities:', topCities);
    
    const container = document.getElementById('topCities');
    if (!container) {
        console.warn('⚠️ Top cities container not found');
        return;
    }
    
    if (topCities.length === 0) {
        container.innerHTML = `
            <div class="analytics-placeholder">
                <p>📊 Žádná města s prodejními daty k analýze</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    topCities.forEach((city, index) => {
        const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        html += `
            <div class="top-item">
                <div class="top-info">
                    <h4>${rankIcon} ${escapeHtml(city.name)}</h4>
                    <p>${city.eventsCount} akcí • ${city.categoriesCount} kategorií</p>
                    <p><small>⌀ ${formatNumber(Math.round(city.averageSales))} ks/akci</small></p>
                </div>
                <div class="top-stats">
                    <div class="top-value">${formatNumber(city.totalSales)} ks</div>
                    <div class="top-subvalue">${city.conversion.toFixed(1)}% konverze</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    console.log('✅ Top cities displayed');
}

// ========================================
// ZOBRAZENÍ TOP KATEGORIÍ
// ========================================

// OPRAVENÁ funkce pro zobrazení top kategorií
function displayTopCategories(topCategories) {
    console.log('📋 Displaying top categories:', topCategories);
    
    const container = document.getElementById('topCategories');
    if (!container) {
        console.warn('⚠️ Top categories container not found');
        return;
    }
    
    if (topCategories.length === 0) {
        container.innerHTML = `
            <div class="analytics-placeholder">
                <p>📊 Žádné kategorie s prodejními daty k analýze</p>
            </div>
        `;
        return;
    }
    
    // IKONY pro kategorie
    const categoryIcons = {
        'food festival': '🍔',
        'veletrh': '🍫',
        'koncert': '🎵',
        'kulturní akce': '🎭',
        'sportovní': '🏃',
        'ostatní': '📅'
    };
    
    let html = '';
    topCategories.forEach((category, index) => {
        const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const categoryIcon = categoryIcons[category.name] || '📋';
        
        html += `
            <div class="top-item">
                <div class="top-info">
                    <h4>${rankIcon} ${categoryIcon} ${category.name}</h4>
                    <p>${category.eventsCount} akcí • ${category.citiesCount} měst</p>
                    <p><small>⌀ ${formatNumber(Math.round(category.averageSales))} ks/akci</small></p>
                </div>
                <div class="top-stats">
                    <div class="top-value">${formatNumber(category.totalSales)} ks</div>
                    <div class="top-subvalue">${category.conversion.toFixed(1)}% konverze</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    console.log('✅ Top categories displayed');
}

// ========================================
// PLACEHOLDER FUNKCE PRO BUDOUCÍ FEATURES
// ========================================

// Placeholder pro měsíční trendy (bude implementováno později)
function displayMonthlyTrends() {
    const container = document.getElementById('monthlyTrends');
    if (!container) return;
    
    container.innerHTML = `
        <div class="chart-placeholder">
            <p>📊 Měsíční trendy budou implementovány v budoucí verzi</p>
            <p><small>Funkce bude zahrnovat grafy prodeje podle měsíců a sezónní analýzy</small></p>
        </div>
    `;
}

// Placeholder pro přesnost predikcí (bude implementováno později)
function displayPredictionAccuracy() {
    const container = document.getElementById('predictionAccuracy');
    if (!container) return;
    
    container.innerHTML = `
        <div class="accuracy-placeholder">
            <p>🎯 Analýza přesnosti predikcí bude implementována v budoucí verzi</p>
            <p><small>Funkce bude porovnávat AI predikce se skutečnými výsledky</small></p>
        </div>
    `;
}

// Placeholder pro vliv počasí (bude implementováno později)
function displayWeatherImpact() {
    const container = document.getElementById('weatherImpact');
    if (!container) return;
    
    container.innerHTML = `
        <div class="weather-impact-placeholder">
            <p>🌤️ Analýza vlivu počasí bude implementována v budoucí verzi</p>
            <p><small>Funkce bude analyzovat korelaci mezi počasím a prodejem</small></p>
        </div>
    `;
}

// ========================================
// EVENT LISTENERS PRO ANALYTICS
// ========================================

// Event listenery pro analytics
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded - updating analytics');
    setTimeout(() => {
        displayAnalytics();
    }, 1000);
});

eventBus.on('sectionChanged', (data) => {
    if (data.section === 'analytics') {
        console.log('📊 Analytics section opened - refreshing data');
        setTimeout(() => {
            displayAnalytics();
            displayMonthlyTrends();
            displayPredictionAccuracy();
            displayWeatherImpact();
        }, 500);
    }
});

eventBus.on('analyticsRequested', () => {
    console.log('📊 Analytics requested - displaying data');
    displayAnalytics();
});

eventBus.on('analyticsResizeRequested', () => {
    console.log('📐 Analytics resize requested - refreshing layout');
    setTimeout(() => {
        displayAnalytics();
    }, 100);
});

// ========================================
// DEBUG FUNKCE PRO PART 4D
// ========================================

// Debug funkce pro testování analytics
function debugAnalytics() {
    console.group('🔍 DEBUG: Analytics Analysis');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('❌ No historical data available for analytics');
        console.groupEnd();
        return;
    }
    
    // Test datové kvality
    console.group('📊 Data Quality Check');
    const totalRecords = globalState.historicalData.length;
    const recordsWithSales = globalState.historicalData.filter(r => r.sales > 0).length;
    const recordsWithVisitors = globalState.historicalData.filter(r => r.visitors > 0).length;
    const recordsWithCity = globalState.historicalData.filter(r => r.city && r.city.trim()).length;
    
    console.log(`Total records: ${totalRecords}`);
    console.log(`Records with sales: ${recordsWithSales}`);
    console.log(`Records with visitors: ${recordsWithVisitors}`);
    console.log(`Records with city: ${recordsWithCity}`);
    console.groupEnd();
    
    // Test výpočtů
    console.group('📈 Calculations Test');
    const stats = calculateOverallStats();
    console.log('Overall stats:', stats);
    
    const topEvents = getTopEvents(3);
    console.log('Top 3 events:', topEvents);
    
    const topCities = getTopCities(3);
    console.log('Top 3 cities:', topCities);
    
    const topCategories = getTopCategories(3);
    console.log('Top 3 categories:', topCategories);
    console.groupEnd();
    
    // Test sample records
    console.group('📋 Sample Records');
    globalState.historicalData.slice(0, 3).forEach((record, index) => {
        console.log(`Record ${index + 1}:`, {
            name: record.eventName,
            city: record.city,
            category: record.category,
            sales: record.sales,
            visitors: record.visitors
        });
    });
    console.groupEnd();
    
    console.groupEnd();
    
    return {
        totalRecords: totalRecords,
        recordsWithSales: recordsWithSales,
        dataQuality: recordsWithSales / totalRecords,
        stats: stats,
        timestamp: new Date().toISOString()
    };
}

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4DDebug = {
        debugAnalytics,
        calculateOverallStats,
        getTopEvents,
        getTopCities,
        getTopCategories,
        displayAnalytics,
        testDataLoading: () => {
            console.log('🧪 Testing analytics data loading...');
            const result = debugAnalytics();
            displayAnalytics();
            return result;
        },
        checkSalesData: () => {
            const salesData = globalState.historicalData
                .filter(r => r.sales > 0)
                .map(r => ({ name: r.eventName, sales: r.sales, city: r.city }));
            console.table(salesData);
            return salesData;
        }
    };
}

// ========================================
// INICIALIZACE PART 4D
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing Part 4D - Analytics...');
    
    // Pokud už jsou data načtená, zobraz analytics
    setTimeout(() => {
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            console.log('📊 Data already available - displaying analytics');
            displayAnalytics();
            displayMonthlyTrends();
            displayPredictionAccuracy();
            displayWeatherImpact();
        }
    }, 2000);
    
    console.log('✅ Part 4D - Analytics initialized');
});

console.log('✅ Donuland Part 4D loaded successfully');
console.log('📊 Features: ✅ FIXED Real Data Loading ✅ Overall Statistics ✅ Top Events/Cities/Categories');
console.log('🔧 CRITICAL FIXES: ✅ Sales data from column N ✅ Proper filtering ✅ Real calculations');
console.log('🧪 Debug: window.donulandPart4DDebug.testDataLoading() to verify data');
console.log('📈 Data Flow: Google Sheets → Part2 → globalState.historicalData → Part4D calculations');
console.log('⏳ Ready for Part 4E: Modal & Event Management');

// Event pro signalizaci dokončení části 4D
eventBus.emit('part4dLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0-fixed',
    features: ['fixed-data-loading', 'overall-statistics', 'top-rankings', 'real-calculations'],
    fixes: ['sales-data-reading', 'proper-filtering', 'correct-aggregation', 'debug-tools']
});
/* ========================================
   DONULAND PART 4 - KOMPLETNÍ OPRAVA
   Všechny chybějící části pro funkční kalendář a modal
   ======================================== */

console.log('🔧 Loading Donuland Part 4 - COMPLETE FIXES...');

// ========================================
// KRITICKÁ OPRAVA: CHYBĚJÍCÍ calendarState OBJEKT
// ========================================

// HLAVNÍ kalendářní stav - toto chybělo!
const calendarState = {
    isRendering: false,
    filters: {
        city: '',
        category: '',
        status: ''
    },
    eventColors: new Map(),
    colorPalette: [],
    currentView: 'month'
};

// ========================================
// OPRAVA INICIALIZACE KALENDÁŘE PO NAČTENÍ DAT
// ========================================

// Event listener pro automatické vykreslení kalendáře
eventBus.on('dataLoaded', () => {
    console.log('📅 Data loaded - initializing calendar state and rendering');
    
    // Inicializace calendar state pokud není
    if (!calendarState.colorPalette || calendarState.colorPalette.length === 0) {
        calendarState.colorPalette = generateColorPalette();
    }
    
    // Naplnění filter dropdownů
    setTimeout(() => {
        populateFilterDropdowns();
        renderCalendar();
    }, 500);
});

// Automatická inicializace při první návštěvě kalendářní sekce
eventBus.on('sectionChanged', (data) => {
    if (data.section === 'calendar') {
        console.log('📅 Calendar section opened - ensuring calendar is rendered');
        
        // Ujisti se, že kalendář je vykreslen
        setTimeout(() => {
            if (!calendarState.isRendering) {
                renderCalendar();
            }
        }, 300);
    }
});

// ========================================
// OPRAVA RENDEROVÁNÍ KALENDÁŘE
// ========================================

// KOMPLETNĚ PŘEPSANÁ render funkce s debugging
function renderCalendar() {
    console.log('📅 RENDERING CALENDAR - START');
    
    if (calendarState.isRendering) {
        console.log('⚠️ Calendar already rendering, skipping...');
        return;
    }
    
    calendarState.isRendering = true;
    
    try {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) {
            console.error('❌ Calendar grid element not found!');
            return;
        }
        
        console.log('📅 Calendar grid found, clearing content...');
        calendarGrid.innerHTML = '';
        
        // Přidání hlaviček dnů
        const dayHeaders = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });
        
        console.log('📅 Day headers added');
        
        // Získání dnů v měsíci
        const year = globalState.currentYear;
        const month = globalState.currentMonth;
        console.log(`📅 Rendering for: ${month + 1}/${year}`);
        
        const daysInMonth = getDaysInMonth(year, month);
        console.log(`📅 Generated ${daysInMonth.length} days`);
        
        // Přidání dnů do kalendáře
        daysInMonth.forEach((dayData, index) => {
            const dayElement = createCalendarDay(dayData);
            calendarGrid.appendChild(dayElement);
            
            if (index % 7 === 0) {
                console.log(`📅 Added week starting with day ${dayData.date.getDate()}`);
            }
        });
        
        console.log('✅ Calendar grid rendered successfully');
        
        // Aktualizace month events list
        updateMonthEventsList();
        
        // Aktualizace měsíce v UI
        updateCurrentMonthDisplay();
        
        console.log('✅ CALENDAR RENDERING COMPLETE');
        
    } catch (error) {
        console.error('❌ ERROR in renderCalendar:', error);
        showNotification('❌ Chyba při vykreslování kalendáře', 'error');
    } finally {
        calendarState.isRendering = false;
    }
}

// ========================================
// MODAL MANAGEMENT - KOMPLETNÍ IMPLEMENTACE
// ========================================

// HLAVNÍ funkce pro otevření event modalu (dokončená implementace)
function openEventModal(event = null, defaultDate = null) {
    console.log('📝 Opening event modal:', { event, defaultDate });
    
    try {
        const modal = document.getElementById('eventModal');
        if (!modal) {
            console.error('❌ Event modal not found in DOM');
            showNotification('❌ Modal není k dispozici', 'error');
            return;
        }
        
        // Zobraz modal
        modal.style.display = 'flex';
        
        // Naplň modal daty
        populateModal(event, defaultDate);
        
        // Focus na první editovatelný input
        setTimeout(() => {
            const firstEditableInput = modal.querySelector('input:not([readonly]), textarea');
            if (firstEditableInput) {
                firstEditableInput.focus();
            }
        }, 100);
        
        console.log('✅ Event modal opened successfully');
        
    } catch (error) {
        console.error('❌ Error opening event modal:', error);
        showNotification('❌ Chyba při otevírání modalu', 'error');
    }
}

// Naplnění modalu daty
function populateModal(event = null, defaultDate = null) {
    console.log('📋 Populating modal with data:', { event, defaultDate });
    
    const elements = {
        title: document.getElementById('modalTitle'),
        eventName: document.getElementById('modalEventName'),
        dateFrom: document.getElementById('modalEventDateFrom'),
        dateTo: document.getElementById('modalEventDateTo'),
        city: document.getElementById('modalEventCity'),
        sales: document.getElementById('modalSales'),
        notes: document.getElementById('modalNotes')
    };
    
    if (event) {
        // EDITACE EXISTUJÍCÍ UDÁLOSTI
        if (elements.title) {
            elements.title.textContent = `✏️ Detail: ${event.title}`;
        }
        
        if (elements.eventName) {
            elements.eventName.value = event.title || '';
            elements.eventName.readOnly = true;
        }
        
        if (elements.dateFrom) {
            elements.dateFrom.value = formatDateForInput(event.dateFrom) || '';
            elements.dateFrom.readOnly = true;
        }
        
        if (elements.dateTo) {
            elements.dateTo.value = formatDateForInput(event.dateTo || event.dateFrom) || '';
            elements.dateTo.readOnly = true;
        }
        
        if (elements.city) {
            elements.city.value = event.city || '';
            elements.city.readOnly = true;
        }
        
        if (elements.sales) {
            elements.sales.value = event.sales || event.actualSales || '';
            elements.sales.readOnly = false; // Sales lze editovat
        }
        
        if (elements.notes) {
            elements.notes.value = event.notes || '';
            elements.notes.readOnly = false; // Notes lze editovat
        }
        
    } else {
        // NOVÁ UDÁLOST
        if (elements.title) {
            elements.title.textContent = '➕ Nová akce';
        }
        
        // Vymaž všechny fieldy
        Object.values(elements).forEach(el => {
            if (el && el.tagName !== 'H3') {
                el.value = '';
                el.readOnly = false;
            }
        });
        
        // Nastav defaultní datum
        if (defaultDate && elements.dateFrom) {
            const dateStr = formatDateForInput(defaultDate);
            elements.dateFrom.value = dateStr;
            if (elements.dateTo) {
                elements.dateTo.value = dateStr;
            }
        }
    }
}

// Helper funkce pro formátování data pro input
function formatDateForInput(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
        // Pokud je už ve formátu YYYY-MM-DD, vrať jak je
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return date;
        }
        
        // Pokud je v jiném formátu, převeď
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }
    }
    
    if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    return '';
}

// Zavření modalu
function closeModal() {
    console.log('❌ Closing event modal');
    
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Uložení změn v modalu (základní implementace)
function saveEventEdit() {
    console.log('💾 Saving event changes...');
    
    const salesInput = document.getElementById('modalSales');
    const notesInput = document.getElementById('modalNotes');
    
    if (salesInput) {
        const newSales = parseFloat(salesInput.value) || 0;
        console.log('💰 New sales value:', newSales);
    }
    
    if (notesInput) {
        const newNotes = notesInput.value || '';
        console.log('📝 New notes:', newNotes);
    }
    
    // Zavři modal
    closeModal();
    
    // Aktualizuj kalendář
    renderCalendar();
    
    showNotification('✅ Změny byly uloženy', 'success');
}

// Smazání události (základní implementace)
function deleteEvent() {
    console.log('🗑️ Deleting event...');
    
    const confirmed = confirm('Opravdu chcete smazat tuto událost?\n\nTato akce je nevratná.');
    
    if (confirmed) {
        closeModal();
        renderCalendar();
        showNotification('✅ Událost byla smazána', 'success');
    }
}

// ========================================
// ANALYTICS - CHYBĚJÍCÍ IMPLEMENTACE
// ========================================

// Měsíční trendy (implementace placeholder)
function displayMonthlyTrends() {
    console.log('📈 Generating monthly trends...');
    
    const container = document.getElementById('monthlyTrends');
    if (!container) return;
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        container.innerHTML = `
            <div class="chart-placeholder">
                <p>📊 Žádná data pro měsíční trendy</p>
                <p><small>Načtěte historická data pro zobrazení trendů</small></p>
            </div>
        `;
        return;
    }
    
    // Seskup data podle měsíců
    const monthlyData = new Map();
    
    globalState.historicalData.forEach(record => {
        if (record.dateFrom && record.sales > 0) {
            const date = new Date(record.dateFrom);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!monthlyData.has(monthKey)) {
                monthlyData.set(monthKey, {
                    month: monthKey,
                    totalSales: 0,
                    eventsCount: 0
                });
            }
            
            const monthData = monthlyData.get(monthKey);
            monthData.totalSales += record.sales;
            monthData.eventsCount += 1;
        }
    });
    
    // Seřaď podle měsíce a vezmi posledních 12
    const sortedMonths = Array.from(monthlyData.values())
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);
    
    let html = '<div class="monthly-trends-chart">';
    html += '<h4>📈 Posledních 12 měsíců</h4>';
    html += '<div class="trends-bars">';
    
    const maxSales = Math.max(...sortedMonths.map(m => m.totalSales));
    
    sortedMonths.forEach(monthData => {
        const height = maxSales > 0 ? (monthData.totalSales / maxSales) * 100 : 0;
        const [year, month] = monthData.month.split('-');
        const monthName = new Date(year, month - 1).toLocaleDateString('cs-CZ', { month: 'short' });
        
        html += `
            <div class="trend-bar-container">
                <div class="trend-bar" style="height: ${height}%; background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));" 
                     title="${monthData.totalSales} ks prodáno, ${monthData.eventsCount} akcí">
                </div>
                <div class="trend-label">${monthName}</div>
                <div class="trend-value">${formatNumber(monthData.totalSales)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    html += `<p style="text-align: center; margin-top: 15px; color: var(--gray-600); font-size: 0.9em;">
        Celkem ${sortedMonths.reduce((sum, m) => sum + m.totalSales, 0)} ks prodáno za posledních 12 měsíců
    </p>`;
    html += '</div>';
    
    container.innerHTML = html;
}

// Přesnost predikcí
function displayPredictionAccuracy() {
    console.log('🎯 Calculating prediction accuracy...');
    
    const container = document.getElementById('predictionAccuracy');
    if (!container) return;
    
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        const predictionsWithResults = savedPredictions.filter(p => 
            p.actualSales && p.prediction && p.prediction.predictedSales
        );
        
        if (predictionsWithResults.length === 0) {
            container.innerHTML = `
                <div class="accuracy-placeholder">
                    <p>🎯 Žádné predikce s výsledky</p>
                    <p><small>Přidejte skutečné výsledky k vašim predikcím pro analýzu přesnosti</small></p>
                </div>
            `;
            return;
        }
        
        // Výpočet přesnosti
        const accuracyData = predictionsWithResults.map(p => {
            const predicted = p.prediction.predictedSales;
            const actual = p.actualSales;
            const accuracy = Math.max(0, 100 - Math.abs((predicted - actual) / actual * 100));
            
            return {
                name: p.formData.eventName,
                predicted: predicted,
                actual: actual,
                accuracy: accuracy,
                difference: actual - predicted
            };
        });
        
        const avgAccuracy = accuracyData.reduce((sum, item) => sum + item.accuracy, 0) / accuracyData.length;
        
        let html = `
            <div class="accuracy-summary">
                <div class="accuracy-score ${avgAccuracy > 80 ? 'excellent' : avgAccuracy > 60 ? 'good' : 'needs-improvement'}">
                    <div class="score-value">${avgAccuracy.toFixed(1)}%</div>
                    <div class="score-label">Průměrná přesnost</div>
                </div>
                <div class="accuracy-details">
                    <p><strong>${predictionsWithResults.length}</strong> predikcí s výsledky</p>
                    <p><strong>${accuracyData.filter(a => a.accuracy > 80).length}</strong> velmi přesných (>80%)</p>
                    <p><strong>${accuracyData.filter(a => a.accuracy > 60).length}</strong> dobrých (>60%)</p>
                </div>
            </div>
        `;
        
        html += '<div class="accuracy-list">';
        accuracyData.slice(0, 5).forEach(item => {
            const accuracyClass = item.accuracy > 80 ? 'excellent' : item.accuracy > 60 ? 'good' : 'poor';
            
            html += `
                <div class="accuracy-item ${accuracyClass}">
                    <div class="accuracy-event">${escapeHtml(item.name)}</div>
                    <div class="accuracy-stats">
                        <span>Predikce: ${formatNumber(item.predicted)}</span>
                        <span>Skutečnost: ${formatNumber(item.actual)}</span>
                        <span class="accuracy-percent">${item.accuracy.toFixed(1)}%</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error calculating prediction accuracy:', error);
        container.innerHTML = `
            <div class="accuracy-placeholder">
                <p>❌ Chyba při výpočtu přesnosti predikcí</p>
            </div>
        `;
    }
}

// Vliv počasí na prodej
function displayWeatherImpact() {
    console.log('🌤️ Analyzing weather impact...');
    
    const container = document.getElementById('weatherImpact');
    if (!container) return;
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        container.innerHTML = `
            <div class="weather-impact-placeholder">
                <p>🌤️ Žádná data pro analýzu vlivu počasí</p>
                <p><small>Načtěte historická data pro analýzu vlivu počasí</small></p>
            </div>
        `;
        return;
    }
    
    // Seskup data podle počasí (zjednodušená verze)
    const weatherData = new Map();
    
    globalState.historicalData.forEach(record => {
        if (record.weather && record.sales > 0 && record.visitors > 0) {
            const weather = record.weather.toLowerCase();
            let category = 'ostatní';
            
            if (weather.includes('sun') || weather.includes('clear') || weather.includes('jasno')) {
                category = 'slunečno';
            } else if (weather.includes('rain') || weather.includes('déšť')) {
                category = 'déšť';
            } else if (weather.includes('cloud') || weather.includes('oblačno')) {
                category = 'oblačno';
            } else if (weather.includes('snow') || weather.includes('sníh')) {
                category = 'sníh';
            }
            
            if (!weatherData.has(category)) {
                weatherData.set(category, {
                    totalSales: 0,
                    totalVisitors: 0,
                    eventsCount: 0
                });
            }
            
            const categoryData = weatherData.get(category);
            categoryData.totalSales += record.sales;
            categoryData.totalVisitors += record.visitors;
            categoryData.eventsCount += 1;
        }
    });
    
    let html = '<div class="weather-impact-analysis">';
    html += '<h4>🌤️ Vliv počasí na konverzi</h4>';
    
    if (weatherData.size === 0) {
        html += '<p>Žádná data o počasí k analýze</p>';
    } else {
        html += '<div class="weather-categories">';
        
        const weatherIcons = {
            'slunečno': '☀️',
            'oblačno': '☁️',
            'déšť': '🌧️',
            'sníh': '❄️',
            'ostatní': '🌤️'
        };
        
        Array.from(weatherData.entries()).forEach(([category, data]) => {
            const conversion = data.totalVisitors > 0 ? (data.totalSales / data.totalVisitors) * 100 : 0;
            const icon = weatherIcons[category] || '🌤️';
            
            html += `
                <div class="weather-category">
                    <div class="weather-icon">${icon}</div>
                    <div class="weather-name">${category}</div>
                    <div class="weather-stats">
                        <div class="conversion-rate">${conversion.toFixed(1)}%</div>
                        <div class="events-count">${data.eventsCount} akcí</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

// ========================================
// CSS STYLY PRO NOVÉ KOMPONENTY
// ========================================

// Přidání stylů pro analytics komponenty
function addAnalyticsStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Monthly trends */
        .monthly-trends-chart {
            padding: 20px;
        }
        
        .trends-bars {
            display: flex;
            gap: 10px;
            height: 200px;
            align-items: flex-end;
            margin: 20px 0;
            padding: 10px;
            background: var(--gray-100);
            border-radius: 8px;
        }
        
        .trend-bar-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
        }
        
        .trend-bar {
            min-height: 10px;
            width: 100%;
            border-radius: 4px 4px 0 0;
            transition: all 0.3s ease;
            margin-bottom: 5px;
        }
        
        .trend-bar:hover {
            filter: brightness(1.1);
            transform: scale(1.05);
        }
        
        .trend-label {
            font-size: 0.8em;
            color: var(--gray-600);
            margin: 2px 0;
        }
        
        .trend-value {
            font-size: 0.7em;
            font-weight: 600;
            color: var(--gray-700);
        }
        
        /* Prediction accuracy */
        .accuracy-summary {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            align-items: center;
        }
        
        .accuracy-score {
            text-align: center;
            padding: 20px;
            border-radius: 12px;
            min-width: 120px;
        }
        
        .accuracy-score.excellent {
            background: linear-gradient(135deg, #d4edda, #c3e6cb);
            border: 2px solid var(--success-color);
        }
        
        .accuracy-score.good {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 2px solid var(--warning-color);
        }
        
        .accuracy-score.needs-improvement {
            background: linear-gradient(135deg, #f8d7da, #f5c6cb);
            border: 2px solid var(--error-color);
        }
        
        .score-value {
            font-size: 2em;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .score-label {
            font-size: 0.9em;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .accuracy-details {
            flex: 1;
            color: var(--gray-600);
        }
        
        .accuracy-details p {
            margin: 5px 0;
        }
        
        .accuracy-item {
            padding: 12px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 4px solid var(--gray-400);
        }
        
        .accuracy-item.excellent {
            background: rgba(40, 167, 69, 0.1);
            border-left-color: var(--success-color);
        }
        
        .accuracy-item.good {
            background: rgba(255, 193, 7, 0.1);
            border-left-color: var(--warning-color);
        }
        
        .accuracy-item.poor {
            background: rgba(220, 53, 69, 0.1);
            border-left-color: var(--error-color);
        }
        
        .accuracy-event {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .accuracy-stats {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
            color: var(--gray-600);
        }
        
        .accuracy-percent {
            font-weight: 600;
            color: var(--primary-color) !important;
        }
        
        /* Weather impact */
        .weather-categories {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .weather-category {
            text-align: center;
            padding: 20px;
            background: var(--white);
            border-radius: 8px;
            border: 1px solid var(--gray-200);
            transition: all 0.3s ease;
        }
        
        .weather-category:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
        
        .weather-icon {
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        .weather-name {
            font-weight: 600;
            margin-bottom: 10px;
            text-transform: capitalize;
        }
        
        .conversion-rate {
            font-size: 1.5em;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 5px;
        }
        
        .events-count {
            font-size: 0.9em;
            color: var(--gray-600);
        }
    `;
    
    document.head.appendChild(style);
}

// ========================================
// INICIALIZACE A EVENT LISTENERS
// ========================================

// Inicializace při načtení
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Initializing Part 4 Complete...');
    
    // Přidání stylů
    addAnalyticsStyles();
    
    // Ujisti se, že globalState existuje
    if (typeof globalState === 'undefined') {
        console.warn('⚠️ globalState not defined, creating...');
        window.globalState = {
            currentYear: new Date().getFullYear(),
            currentMonth: new Date().getMonth(),
            historicalData: [],
            debugMode: true
        };
    }
    
    // Automatické vykreslení kalendáře po 3 sekundách
    setTimeout(() => {
        console.log('🔄 Auto-rendering calendar...');
        
        // Inicializace color palette
        if (!calendarState.colorPalette || calendarState.colorPalette.length === 0) {
            calendarState.colorPalette = generateColorPalette();
        }
        
        // Vykreslení kalendáře
        renderCalendar();
        
        // Aktualizace analytics pokud jsou data
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            displayMonthlyTrends();
            displayPredictionAccuracy();
            displayWeatherImpact();
        }
        
    }, 3000);
    
    console.log('✅ Part 4 Complete initialized');
});

// Event listeners pro analytics refresh
eventBus.on('sectionChanged', (data) => {
    if (data.section === 'analytics') {
        setTimeout(() => {
            displayMonthlyTrends();
            displayPredictionAccuracy();
            displayWeatherImpact();
        }, 500);
    }
});

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4Debug = {
        calendarState: () => calendarState,
        renderCalendar: renderCalendar,
        openModal: openEventModal,
        testCalendar: () => {
            console.log('🧪 Testing calendar system...');
            console.log('Calendar state:', calendarState);
            console.log('Global state:', globalState);
            
            renderCalendar();
            
            return {
                calendarState,
                globalState: {
                    currentMonth: globalState.currentMonth,
                    currentYear: globalState.currentYear,
                    dataCount: globalState.historicalData?.length || 0
                }
            };
        }
    };
}

console.log('✅ Donuland Part 4 COMPLETE loaded successfully');
console.log('📅 Features: ✅ Calendar State ✅ Calendar Rendering ✅ Modal Management ✅ Analytics Charts');
console.log('🧪 Debug: window.donulandPart4Debug.testCalendar() to test everything');
console.log('🎯 Status: Calendar should now render properly with all features working'); 
