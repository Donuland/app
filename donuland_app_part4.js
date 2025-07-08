/* ========================================
   DONULAND PART 4A - KALENDÁŘNÍ STAV A ZÁKLADNÍ FUNKCE
   Založeno na analýze skutečných dat ze Sheets
   ======================================== */

console.log('🍩 Donuland Part 4A loading...');

// ========================================
// GLOBÁLNÍ KALENDÁŘNÍ STAV
// ========================================

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
// ANALÝZA DAT ZE SHEETS - PŘESNÉ KATEGORIE
// ========================================

// ŽÁDNÝ categoryMap - používáme kategorie přesně jak jsou ve sloupci F
function normalizeCategory(category) {
    if (!category || !category.trim()) return 'ostatní';
    
    // Jen vyčistíme whitespace, ale zachováme přesný text
    const cleaned = category.trim();
    
    if (globalState.debugMode) {
        console.log(`🏷️ Category used as-is: "${category}" → "${cleaned}"`);
    }
    
    return cleaned;
}

// ========================================
// DATUM PARSING PRO DD.MM.YYYY FORMÁT
// ========================================

// KRITICKÁ FUNKCE: Parser pro český formát DD.MM.YYYY
function parseSheetDate(dateStr) {
    if (!dateStr || !dateStr.trim()) return null;
    
    console.log(`📅 Parsing date: "${dateStr}"`);
    
    // Očekáváme formát DD.MM.YYYY (např. "18.1.2025" nebo "18.1.2025")
    const czechDatePattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = dateStr.trim().match(czechDatePattern);
    
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        const isoDate = `${year}-${month}-${day}`;
        
        console.log(`✅ Czech date converted: "${dateStr}" → "${isoDate}"`);
        return isoDate;
    }
    
    // Fallback - možná už je v ISO formátu
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoPattern.test(dateStr.trim())) {
        console.log(`✅ Already ISO format: "${dateStr}"`);
        return dateStr.trim();
    }
    
    console.warn(`⚠️ Could not parse date: "${dateStr}"`);
    return null;
}

// ========================================
// STATUS DETERMINATION PODLE DNEŠNÍHO DATA
// ========================================

// Určení statusu události podle dnešního data
function determineEventStatus(dateFrom, dateTo) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Parse start date
        const parsedDateFrom = parseSheetDate(dateFrom);
        if (!parsedDateFrom) {
            console.warn('⚠️ Invalid dateFrom for status:', dateFrom);
            return 'unknown';
        }
        
        const eventStart = new Date(parsedDateFrom);
        eventStart.setHours(0, 0, 0, 0);
        
        // Parse end date (může být prázdné pro jednodenní akce)
        let eventEnd = eventStart;
        if (dateTo && dateTo.trim()) {
            const parsedDateTo = parseSheetDate(dateTo);
            if (parsedDateTo) {
                eventEnd = new Date(parsedDateTo);
                eventEnd.setHours(23, 59, 59, 999);
            }
        } else {
            // Jednodenní akce - end = start ale do konce dne
            eventEnd = new Date(eventStart);
            eventEnd.setHours(23, 59, 59, 999);
        }
        
        // Kontrola validity
        if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
            console.warn('⚠️ Invalid dates for status determination:', { dateFrom, dateTo });
            return 'unknown';
        }
        
        // Určení statusu
        if (eventEnd < today) {
            return 'completed';  // Akce už skončila
        } else if (eventStart <= today && today <= eventEnd) {
            return 'ongoing';    // Akce právě probíhá
        } else if (eventStart > today) {
            return 'planned';    // Akce je v budoucnosti
        } else {
            return 'unknown';
        }
        
    } catch (error) {
        console.error('❌ Error determining event status:', error);
        return 'unknown';
    }
}

// ========================================
// DATUM RANGE CHECK PRO KALENDÁŘ
// ========================================

// KLÍČOVÁ FUNKCE: Kontrola zda datum patří do rozsahu události
function isDateInEventRange(checkDateISO, eventDateFrom, eventDateTo) {
    if (!eventDateFrom) return false;
    
    // Parse event dates
    const parsedFrom = parseSheetDate(eventDateFrom);
    if (!parsedFrom) return false;
    
    let parsedTo = parsedFrom; // Default pro jednodenní akce
    if (eventDateTo && eventDateTo.trim()) {
        const parsed = parseSheetDate(eventDateTo);
        if (parsed) {
            parsedTo = parsed;
        }
    }
    
    // Přímé porovnání ISO stringů (nejbezpečnější)
    const inRange = checkDateISO >= parsedFrom && checkDateISO <= parsedTo;
    
    if (globalState.debugMode && inRange) {
        console.log(`✅ Date in range: ${checkDateISO} is in ${parsedFrom} - ${parsedTo}`);
    }
    
    return inRange;
}

// ========================================
// HELPER FUNKCE PRO UI
// ========================================

// Status text pro UI
function getStatusText(status) {
    const statusMap = {
        'completed': 'Dokončeno',
        'ongoing': 'Probíhá',
        'planned': 'Plánováno',
        'unknown': 'Neznámý'
    };
    return statusMap[status] || status;
}

// Source text pro UI
function getSourceText(source) {
    const sourceMap = {
        'sheets': 'Google Sheets',
        'prediction': 'AI Predikce',
        'manual': 'Manuálně přidáno'
    };
    return sourceMap[source] || source;
}

// Event key pro deduplikaci
function createEventKey(eventName, city, dateFrom) {
    if (!eventName || !city || !dateFrom) {
        console.warn('⚠️ Incomplete data for event key:', { eventName, city, dateFrom });
        return `incomplete-${Date.now()}-${Math.random()}`;
    }
    
    // Normalizace pro deduplikaci
    const normalizedName = eventName.toLowerCase().trim().replace(/\s+/g, '-');
    const normalizedCity = city.toLowerCase().trim().replace(/\s+/g, '-');
    const normalizedDate = parseSheetDate(dateFrom) || dateFrom;
    
    const key = `${normalizedName}-${normalizedCity}-${normalizedDate}`.replace(/[^a-z0-9-]/g, '');
    
    if (globalState.debugMode) {
        console.log(`🔑 Event key created: "${eventName}" + "${city}" + "${dateFrom}" → "${key}"`);
    }
    
    return key;
}

// ========================================
// ZÍSKÁNÍ UNIKÁTNÍCH HODNOT ZE SHEETS
// ========================================

// NOVÁ funkce - získej kategorie přímo ze Sheets dat
function getUniqueCategories() {
    const categories = new Set();
    
    if (globalState.historicalData && globalState.historicalData.length > 0) {
        globalState.historicalData.forEach(record => {
            if (record.category && record.category.trim()) {
                // Použij kategorii přesně jak je ve sloupci F
                const normalized = normalizeCategory(record.category);
                categories.add(normalized);
            }
        });
    }
    
    // Přidej kategorie z predikcí
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
    
    const result = Array.from(categories).sort();
    console.log(`📋 Found ${result.length} unique categories:`, result);
    
    return result;
}

// NOVÁ funkce - získej města přímo ze Sheets dat
function getUniqueCities() {
    const cities = new Set();
    
    if (globalState.historicalData && globalState.historicalData.length > 0) {
        globalState.historicalData.forEach(record => {
            if (record.city && record.city.trim()) {
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
// DEBUG FUNKCE PRO TESTOVÁNÍ
// ========================================

// Debug funkce pro testování date parsingu
function debugDateParsing() {
    console.group('🔍 DEBUG: Date Parsing Test');
    
    // Test data ze Sheets
    const testDates = [
        '18.1.2025',
        '25.1.2025',
        '8.2.2025',
        '9.2.2025',
        '14.2.2025'
    ];
    
    testDates.forEach(dateStr => {
        const parsed = parseSheetDate(dateStr);
        const status = parsed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} "${dateStr}" → "${parsed}"`);
    });
    
    console.groupEnd();
    
    return {
        testResults: testDates.map(d => ({
            original: d,
            parsed: parseSheetDate(d)
        })),
        timestamp: new Date().toISOString()
    };
}

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4ADebug = {
        debugDateParsing,
        testDateParse: (dateStr) => parseSheetDate(dateStr),
        testStatus: (dateFrom, dateTo) => determineEventStatus(dateFrom, dateTo),
        testEventKey: (name, city, date) => createEventKey(name, city, date),
        testDateRange: (checkDate, fromDate, toDate) => isDateInEventRange(checkDate, fromDate, toDate),
        getCategories: getUniqueCategories,
        getCities: getUniqueCities
    };
}

console.log('✅ Donuland Part 4A loaded successfully');
console.log('📅 Features: ✅ Czech date parsing (DD.MM.YYYY) ✅ Exact categories from Sheets ✅ Status determination');
console.log('🔧 Key changes: No category mapping, direct Sheets data usage, Czech date format support');
console.log('🧪 Debug: window.donulandPart4ADebug.debugDateParsing() to test date parsing');
console.log('📊 Data source: Columns D(city), E(event), F(category) exactly as in Sheets');

// Event pro signalizaci dokončení části 4A
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4aLoaded', { 
        timestamp: Date.now(),
        version: '2.0.0-sheets-accurate',
        features: ['czech-date-parsing', 'exact-categories', 'status-determination', 'unique-data-extraction'],
        dataFormat: 'DD.MM.YYYY from Sheets columns D,E,F'
    });
}
/* ========================================
   DONULAND PART 4B - ZÍSKÁVÁNÍ UDÁLOSTÍ PRO KALENDÁŘ
   Hlavní funkce pro načítání a filtrování událostí
   ======================================== */

console.log('🍩 Donuland Part 4B loading...');

// ========================================
// HLAVNÍ FUNKCE PRO ZÍSKÁNÍ UDÁLOSTÍ PRO DATUM
// ========================================

// KLÍČOVÁ FUNKCE: Získání všech událostí pro konkrétní datum
function getEventsForDate(date) {
    // Převeď datum na ISO string pro porovnání
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD formát
    const eventMap = new Map();
    
    if (globalState.debugMode) {
        console.log(`📅 Getting events for date: ${dateStr}`);
    }
    
    try {
        // 1. HISTORICKÉ AKCE z Google Sheets 
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            globalState.historicalData.forEach(record => {
                // Použij novou funkci pro kontrolu rozsahu
                if (isDateInEventRange(dateStr, record.dateFrom, record.dateTo)) {
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
                if (prediction.formData && isDateInEventRange(dateStr, prediction.formData.eventDateFrom, prediction.formData.eventDateTo)) {
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
                if (isDateInEventRange(dateStr, event.dateFrom, event.dateTo)) {
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
        // City filter
        if (calendarState.filters.city) {
            const filterCity = calendarState.filters.city.toLowerCase().trim();
            const eventCity = (event.city || '').toLowerCase().trim();
            if (eventCity !== filterCity) return false;
        }
        
        // Category filter
        if (calendarState.filters.category) {
            if (event.category !== calendarState.filters.category) return false;
        }
        
        // Status filter
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

// ========================================
// FUNKCE PRO ZÍSKÁNÍ UDÁLOSTÍ PRO CELÝ MĚSÍC
// ========================================

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
    return uniqueEvents.sort((a, b) => {
        const dateA = parseSheetDate(a.dateFrom) || a.dateFrom;
        const dateB = parseSheetDate(b.dateFrom) || b.dateFrom;
        return dateA.localeCompare(dateB);
    });
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

// ========================================
// FILTRY KALENDÁŘE
// ========================================

// Naplnění filter dropdownů s reálnými daty
function populateFilterDropdowns() {
    console.log('🔧 Populating filter dropdowns with real data...');
    
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
            
            // Mapování ikon pro kategorie (můžeme upravit podle skutečných kategorií ze Sheets)
            const categoryIcons = {
                'food festival': '🍔',
                'veletrh': '🍫',
                'koncert': '🎵',
                'kulturní akce': '🎭',
                'Sportovní akce (dospělí)': '🏃',
                'ostatní': '📅'
            };
            
            // Přidat kategorie
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                const icon = categoryIcons[category] || '📋';
                option.textContent = `${icon} ${category}`;
                categoryFilter.appendChild(option);
            });
            
            console.log(`📋 Category filter populated with ${categories.length} categories`);
        }
        
        console.log('✅ Filter dropdowns populated successfully');
        
    } catch (error) {
        console.error('❌ Error populating filter dropdowns:', error);
    }
}

// Aplikace filtrů na kalendář
function filterCalendar() {
    console.log('🔍 Applying calendar filters...');
    
    try {
        // Získej hodnoty filtrů
        const cityFilter = document.getElementById('cityFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
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

// Počítání filtrovaných událostí
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

// Vymazání filtrů
function clearCalendarFilters() {
    console.log('🧹 Clearing calendar filters...');
    
    try {
        const cityFilter = document.getElementById('cityFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (cityFilter) cityFilter.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        
        calendarState.filters = { city: '', category: '', status: '' };
        
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
// EVENT LISTENERS PRO FILTRY
// ========================================

// Nastavení event listenerů pro filtry
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
// DEBUG FUNKCE PRO PART 4B
// ========================================

// Debug funkce pro testování event načítání
function debugEventLoading() {
    console.group('🔍 DEBUG: Event Loading Test');
    
    // Test dnešního data
    const today = new Date();
    const todayEvents = getEventsForDate(today);
    console.log(`Today (${today.toISOString().split('T')[0]}):`, todayEvents.length, 'events');
    
    // Test měsíčních událostí
    const monthEvents = getEventsForCurrentMonth();
    console.log(`Current month:`, monthEvents.length, 'events');
    
    // Test filtračního systému
    const categories = getUniqueCategories();
    const cities = getUniqueCities();
    console.log(`Available categories:`, categories);
    console.log(`Available cities:`, cities);
    
    console.groupEnd();
    
    return {
        todayEvents: todayEvents.length,
        monthEvents: monthEvents.length,
        categories: categories.length,
        cities: cities.length,
        timestamp: new Date().toISOString()
    };
}

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4BDebug = {
        debugEventLoading,
        getEventsForDate,
        getEventsForCurrentMonth,
        populateFilterDropdowns,
        filterCalendar,
        clearCalendarFilters,
        testEventRange: (checkDate, fromDate, toDate) => isDateInEventRange(checkDate, fromDate, toDate),
        testFilters: () => {
            console.log('Current filters:', calendarState.filters);
            const totalEvents = getTotalFilteredEvents();
            console.log('Filtered events count:', totalEvents);
            return { filters: calendarState.filters, eventCount: totalEvents };
        }
    };
}

console.log('✅ Donuland Part 4B loaded successfully');
console.log('📅 Features: ✅ Event loading for calendar ✅ Multi-source events ✅ Smart filtering ✅ Deduplication');
console.log('🔧 Sources: Google Sheets + localStorage predictions + manual events');
console.log('🔍 Filters: City, Category, Status with real data from Sheets');
console.log('🧪 Debug: window.donulandPart4BDebug.debugEventLoading() to test event loading');

// Event pro signalizaci dokončení části 4B
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4bLoaded', { 
        timestamp: Date.now(),
        version: '2.0.0',
        features: ['event-loading', 'multi-source-events', 'smart-filtering', 'deduplication', 'real-data-filters']
    });
}
/* ========================================
   DONULAND PART 4C - KALENDÁŘNÍ RENDERING A UI
   Vykreslování kalendáře, barevný systém, UI komponenty
   ======================================== */

console.log('🍩 Donuland Part 4C loading...');

// ========================================
// HLAVNÍ FUNKCE PRO VYKRESLENÍ KALENDÁŘE
// ========================================

// HLAVNÍ funkce pro vykreslení kalendáře
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
// GENEROVÁNÍ DNÍ V MĚSÍCI
// ========================================

// Získání dnů v měsíci s událostmi
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
            events: getEventsForDate(date)
        });
    }
    
    // Dny současného měsíce
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        days.push({
            date: date,
            isCurrentMonth: true,
            events: getEventsForDate(date)
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
            events: getEventsForDate(date)
        });
    }
    
    if (globalState.debugMode) {
        const currentMonthDays = days.filter(d => d.isCurrentMonth);
        const totalEvents = days.reduce((sum, d) => sum + d.events.length, 0);
        console.log(`📊 Calendar stats: ${currentMonthDays.length} days in month, ${totalEvents} total events`);
    }
    
    return days;
}

// ========================================
// VYTVOŘENÍ KALENDÁŘNÍHO DNE
// ========================================

// Vytvoření prvku kalendářního dne
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

// Vytvoření elementu události
function createEventElement(event, date) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    
    // Získání barvy pro událost
    const colorInfo = getEventColor(event.title, event.status, event.category);
    
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
// BAREVNÝ SYSTÉM PRO UDÁLOSTI
// ========================================

// Získání barvy události podle statusu a kategorie
function getEventColor(eventName, status, category) {
    // PRIORITA 1: Status barvy (nejdůležitější)
    if (status === 'completed') {
        return {
            background: '#d4edda',
            border: '#28a745',
            textColor: '#155724',
            icon: '✅'
        };
    }
    
    if (status === 'ongoing') {
        return {
            background: '#fff3cd',
            border: '#ffc107',
            textColor: '#856404',
            icon: '🔥'
        };
    }
    
    // PRIORITA 2: Barvy podle kategorií (pro plánované akce)
    if (status === 'planned') {
        const categoryColors = {
            'food festival': {
                background: '#f8d7da',
                border: '#dc3545',
                textColor: '#721c24',
                icon: '🍔'
            },
            'veletrh': {
                background: '#e2e3ff',
                border: '#6f42c1',
                textColor: '#4a154b',
                icon: '🍫'
            },
            'koncert': {
                background: '#d1ecf1',
                border: '#17a2b8',
                textColor: '#0c5460',
                icon: '🎵'
            },
            'kulturní akce': {
                background: '#ffeaa7',
                border: '#fdcb6e',
                textColor: '#6c5ce7',
                icon: '🎭'
            },
            'Sportovní akce (dospělí)': {
                background: '#a8e6cf',
                border: '#00b894',
                textColor: '#00551a',
                icon: '🏃'
            },
            'ostatní': {
                background: '#e9ecef',
                border: '#6c757d',
                textColor: '#495057',
                icon: '📅'
            }
        };
        
        if (categoryColors[category]) {
            return categoryColors[category];
        }
    }
    
    // PRIORITA 3: Unikátní barvy podle názvu (fallback)
    const eventKey = eventName.toLowerCase().trim();
    
    if (!calendarState.eventColors.has(eventKey)) {
        // Inicializace palety pokud není
        if (calendarState.colorPalette.length === 0) {
            calendarState.colorPalette = generateColorPalette();
        }
        
        const hash = hashString(eventKey);
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

// Generování palety barev
function generateColorPalette() {
    const colors = [];
    
    // Základní sytá paleta
    const baseColors = [
        '#4285f4', '#ea4335', '#34a853', '#fbbc04', '#9c27b0', 
        '#ff6f00', '#795548', '#607d8b', '#e91e63', '#8bc34a',
        '#ff5722', '#3f51b5', '#009688', '#673ab7', '#2196f3',
        '#ff9800', '#4caf50', '#f44336', '#ffeb3b', '#9e9e9e'
    ];
    
    colors.push(...baseColors);
    
    // Generuj další barvy pomocí HSL
    for (let hue = 0; hue < 360; hue += 15) {
        colors.push(`hsl(${hue}, 70%, 55%)`);
    }
    
    console.log(`🎨 Generated color palette with ${colors.length} colors`);
    return colors;
}

// Hash funkce pro konzistentní barvy
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Převést na 32bit integer
    }
    return Math.abs(hash);
}

// ========================================
// HELPER FUNKCE PRO UI ELEMENTY
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

// Aktualizace seznamu událostí v měsíci
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

// Seskupení událostí podle data
function groupEventsByDate(events) {
    const groups = new Map();
    
    events.forEach(event => {
        const dateKey = parseSheetDate(event.dateFrom) || event.dateFrom;
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
            const colorInfo = getEventColor(event.title, event.status, event.category);
            const statusText = getStatusText(event.status);
            
            html += `
                <div class="month-event-item" 
                     style="border-left: 4px solid ${colorInfo.border}; background: ${colorInfo.background}20;"
                     onclick="openEventModal(${JSON.stringify(event).replace(/"/g, '&quot;')})" >
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
// DAY EVENTS POPUP
// ========================================

// Zobrazení popup s událostmi pro den
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
    `;
    
    const dateStr = date.toLocaleDateString('cs-CZ', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #667eea;">📅 ${dateStr}</h3>
            <button onclick="this.parentElement.parentElement.remove(); document.querySelector('.popup-backdrop')?.remove();" 
                    style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
    `;
    
    if (events.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📅</div>
                <h4>Žádné události v tento den</h4>
                <p>Klikněte na den v kalendáři pro přidání nové akce</p>
            </div>
        `;
    } else {
        events.forEach(event => {
            const colorInfo = getEventColor(event.title, event.status, event.category);
            html += `
                <div style="background: ${colorInfo.background}; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${colorInfo.border};">
                    <h4>${colorInfo.icon} ${escapeHtml(event.title)}</h4>
                    <p>📍 ${escapeHtml(event.city)} • 🏷️ ${escapeHtml(event.category)}</p>
                    <p><strong>Status:</strong> ${getStatusText(event.status)}</p>
                    ${event.sales ? `<p>🍩 <strong>Prodáno:</strong> ${formatNumber(event.sales)} ks</p>` : ''}
                    ${event.predictedSales ? `<p>🔮 <strong>Predikce:</strong> ${formatNumber(event.predictedSales)} ks</p>` : ''}
                </div>
            `;
        });
    }
    
    popup.innerHTML = html;
    
    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'popup-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
    `;
    backdrop.addEventListener('click', () => {
        popup.remove();
        backdrop.remove();
    });
    
    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
}

console.log('✅ Donuland Part 4C loaded successfully');
console.log('🎨 Features: ✅ Calendar rendering ✅ Color system ✅ Event elements ✅ Month events list ✅ Day popup');
console.log('🌈 Colors: Status-based (completed=green, ongoing=orange) + Category-based for planned events');
console.log('📅 UI: Hover effects, tooltips, more events indicator, responsive design');

// Event pro signalizaci dokončení části 4C
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4cLoaded', { 
        timestamp: Date.now(),
        version: '2.0.0',
        features: ['calendar-rendering', 'color-system', 'event-elements', 'month-events-list', 'day-popup', 'responsive-ui']
    });
}
/* ========================================
   DONULAND PART 4D - FINANČNÍ PŘEHLED
   Analytics s přesným výpočtem podle business modelů
   ======================================== */

console.log('🍩 Donuland Part 4D loading...');

// ========================================
// AKTUALIZACE CONFIG PRO NOVÉ SLOUPCE
// ========================================

// Rozšíření CONFIG o nové sloupce ze Sheets
if (typeof CONFIG !== 'undefined') {
    CONFIG.SHEETS_COLUMNS = {
        ...CONFIG.SHEETS_COLUMNS,
        BUSINESS_MODEL: 'I',        // Business model
        PRICE: 'L',                 // Cena donutu
        RENT: 'O',                  // Nájem
        EMPLOYEES: 'R',             // Počet zaměstnanců
        TRANSPORT: 'U',             // Doprava
        OTHER_COSTS: 'V'            // Ostatní náklady
    };
}

// ========================================
// HLAVNÍ FUNKCE PRO FINANČNÍ VÝPOČTY
// ========================================

// PŘESNÝ výpočet finančních dat podle business modelu
function calculateFinancials(record) {
    console.log('💼 Calculating financials for record:', record);
    
    const businessModel = record.businessModel || 'majitel';
    const sales = parseFloat(record.sales) || 0;
    const price = parseFloat(record.price) || 110;  // fallback na 110
    const employees = parseInt(record.employees) || 2;
    const transport = parseFloat(record.transport) || 0;
    const otherCosts = parseFloat(record.otherCosts) || 0;
    const rent = parseRentValue(record.rent) || 0;
    
    const revenue = sales * price;
    
    let financials = {
        revenue: revenue,
        productionCost: 0,
        laborCost: 0,
        transportCost: transport,
        rentCost: rent,
        otherCosts: otherCosts,
        totalCosts: 0,
        profit: 0,
        margin: 0,
        businessModel: businessModel
    };
    
    // VÝPOČET PODLE BUSINESS MODELU
    switch(businessModel.toLowerCase()) {
        case 'franšízant':
        case 'franchise':
            // Franšízant - jen výrobní náklad 32 Kč, žádné mzdy
            financials.productionCost = sales * 32;  // jen výrobní náklad
            financials.laborCost = 0;                // ❌ žádné mzdy
            break;
            
        case 'zaměstnanec':
        case 'employee':
            // Zaměstnanec - základní mzdy + 5% z obratu
            const baseLaborCost = employees * 10 * 150;  // základní mzdy
            const bonusFromRevenue = revenue * 0.05;     // + 5% z obratu
            financials.productionCost = sales * 32;
            financials.laborCost = baseLaborCost + bonusFromRevenue;
            break;
            
        case 'majitel':
        case 'owner':
        default:
            // Majitel - standardní náklady
            financials.productionCost = sales * 32;
            financials.laborCost = employees * 10 * 150;  // jen základní mzdy
            break;
    }
    
    // Celkové náklady
    financials.totalCosts = financials.productionCost + financials.laborCost + 
                           financials.transportCost + financials.rentCost + financials.otherCosts;
    
    // Zisk a marže
    financials.profit = financials.revenue - financials.totalCosts;
    financials.margin = financials.revenue > 0 ? (financials.profit / financials.revenue) * 100 : 0;
    
    if (globalState.debugMode) {
        console.log('💰 Financial calculation result:', financials);
    }
    
    return financials;
}

// ========================================
// PARSING NÁJMU Z RŮZNÝCH FORMÁTŮ
// ========================================

// Parser pro sloupec O (nájem) - různé formáty
function parseRentValue(rentStr) {
    if (!rentStr || !rentStr.toString().trim()) return 0;
    
    const rent = rentStr.toString().trim().toLowerCase();
    
    // Zdarma varianty
    if (rent === 'zdarma' || rent === 'free' || rent === '0' || rent === '-') {
        return 0;
    }
    
    // Pokus o extrakci číselné hodnoty
    const numberMatch = rent.match(/(\d+(?:[.,]\d+)?)/);
    if (numberMatch) {
        return parseFloat(numberMatch[1].replace(',', '.'));
    }
    
    // Procenta z obratu - vrátí 0, bude počítáno jinde
    if (rent.includes('%') || rent.includes('procent')) {
        console.log('⚠️ Percentage rent detected, needs special handling:', rent);
        return 0; // Procenta se počítají zvlášť
    }
    
    console.warn('⚠️ Could not parse rent value:', rent);
    return 0;
}

// ========================================
// HLAVNÍ FUNKCE PRO ANALYTICS DISPLAY
// ========================================

// HLAVNÍ funkce pro zobrazení finančního přehledu
function displayFinancialOverview() {
    console.log('📊 Displaying financial overview...');
    
    try {
        // Získej data pro finanční přehled
        const financialData = calculateOverallFinancials();
        const topEvents = getTopPerformingEvents(5);
        const businessModelStats = getBusinessModelStats();
        
        // Zobrazení jednotlivých sekcí
        displayOverallFinancialStats(financialData);
        displayTopPerformingEvents(topEvents);
        displayBusinessModelBreakdown(businessModelStats);
        displayMonthlyTrends(); // Zachováno z původního
        
        console.log('✅ Financial overview displayed successfully');
        
    } catch (error) {
        console.error('❌ Error displaying financial overview:', error);
        showNotification('❌ Chyba při zobrazení finančního přehledu', 'error');
    }
}

// ========================================
// VÝPOČET CELKOVÝCH FINANČNÍCH STATISTIK
// ========================================

// Výpočet celkových finančních dat
function calculateOverallFinancials() {
    console.log('💰 Calculating overall financials...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return {
            totalEvents: 0,
            totalRevenue: 0,
            totalCosts: 0,
            totalProfit: 0,
            averageMargin: 0,
            profitableEvents: 0
        };
    }
    
    // Filtruj pouze události s validními sales daty
    const validEvents = globalState.historicalData.filter(record => {
        return record.sales > 0 && record.eventName && record.city;
    });
    
    if (validEvents.length === 0) {
        return {
            totalEvents: globalState.historicalData.length,
            validEvents: 0,
            totalRevenue: 0,
            totalCosts: 0,
            totalProfit: 0,
            averageMargin: 0,
            profitableEvents: 0
        };
    }
    
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalProfit = 0;
    let profitableEvents = 0;
    const margins = [];
    
    // Projdi všechny validní události a vypočítej finansy
    validEvents.forEach(record => {
        const financials = calculateFinancials(record);
        
        totalRevenue += financials.revenue;
        totalCosts += financials.totalCosts;
        totalProfit += financials.profit;
        
        if (financials.profit > 0) {
            profitableEvents++;
        }
        
        if (financials.margin !== undefined) {
            margins.push(financials.margin);
        }
        
        if (globalState.debugMode) {
            console.log(`📈 Event "${record.eventName}": Revenue ${financials.revenue}, Profit ${financials.profit}`);
        }
    });
    
    const averageMargin = margins.length > 0 ? 
        margins.reduce((sum, margin) => sum + margin, 0) / margins.length : 0;
    
    const result = {
        totalEvents: globalState.historicalData.length,
        validEvents: validEvents.length,
        totalRevenue: totalRevenue,
        totalCosts: totalCosts,
        totalProfit: totalProfit,
        averageMargin: averageMargin,
        profitableEvents: profitableEvents,
        profitabilityRate: (profitableEvents / validEvents.length) * 100
    };
    
    console.log('💰 Overall financials calculated:', result);
    return result;
}

// ========================================
// TOP PERFORMING EVENTS
// ========================================

// Získání nejúspěšnějších akcí podle zisku
function getTopPerformingEvents(limit = 5) {
    console.log('🏆 Getting top performing events...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return [];
    }
    
    const eventsWithFinancials = globalState.historicalData
        .filter(record => record.sales > 0 && record.eventName && record.city)
        .map(record => {
            const financials = calculateFinancials(record);
            return {
                name: record.eventName,
                city: record.city,
                category: normalizeCategory(record.category),
                dateFrom: record.dateFrom,
                businessModel: record.businessModel || 'majitel',
                ...financials
            };
        })
        .sort((a, b) => b.profit - a.profit) // Seřaď podle zisku sestupně
        .slice(0, limit);
    
    console.log(`🏆 Found ${eventsWithFinancials.length} top events:`, eventsWithFinancials);
    return eventsWithFinancials;
}

// ========================================
// BUSINESS MODEL STATISTIKY
// ========================================

// Statistiky podle business modelů
function getBusinessModelStats() {
    console.log('💼 Calculating business model stats...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return {};
    }
    
    const modelStats = new Map();
    
    globalState.historicalData
        .filter(record => record.sales > 0)
        .forEach(record => {
            const businessModel = record.businessModel || 'majitel';
            const financials = calculateFinancials(record);
            
            if (!modelStats.has(businessModel)) {
                modelStats.set(businessModel, {
                    name: businessModel,
                    eventsCount: 0,
                    totalRevenue: 0,
                    totalCosts: 0,
                    totalProfit: 0,
                    profitableEvents: 0,
                    margins: []
                });
            }
            
            const stats = modelStats.get(businessModel);
            stats.eventsCount++;
            stats.totalRevenue += financials.revenue;
            stats.totalCosts += financials.totalCosts;
            stats.totalProfit += financials.profit;
            stats.margins.push(financials.margin);
            
            if (financials.profit > 0) {
                stats.profitableEvents++;
            }
        });
    
    // Převeď na array a vypočítaj průměry
    const result = Array.from(modelStats.values()).map(stats => ({
        ...stats,
        averageRevenue: stats.eventsCount > 0 ? stats.totalRevenue / stats.eventsCount : 0,
        averageProfit: stats.eventsCount > 0 ? stats.totalProfit / stats.eventsCount : 0,
        averageMargin: stats.margins.length > 0 ? 
            stats.margins.reduce((sum, m) => sum + m, 0) / stats.margins.length : 0,
        profitabilityRate: stats.eventsCount > 0 ? 
            (stats.profitableEvents / stats.eventsCount) * 100 : 0
    }));
    
    console.log('💼 Business model stats:', result);
    return result;
}

// ========================================
// UI DISPLAY FUNKCE
// ========================================

// Zobrazení celkových finančních statistik
function displayOverallFinancialStats(financialData) {
    const container = document.getElementById('overallStats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="financial-stats-grid">
            <div class="stat-item revenue">
                <div class="stat-icon">💰</div>
                <div class="stat-value">${formatCurrency(financialData.totalRevenue)}</div>
                <div class="stat-label">Celkový obrat</div>
            </div>
            
            <div class="stat-item costs">
                <div class="stat-icon">💸</div>
                <div class="stat-value">${formatCurrency(financialData.totalCosts)}</div>
                <div class="stat-label">Celkové náklady</div>
            </div>
            
            <div class="stat-item profit ${financialData.totalProfit > 0 ? 'positive' : 'negative'}">
                <div class="stat-icon">${financialData.totalProfit > 0 ? '✅' : '❌'}</div>
                <div class="stat-value">${formatCurrency(financialData.totalProfit)}</div>
                <div class="stat-label">Celkový zisk</div>
            </div>
            
            <div class="stat-item margin">
                <div class="stat-icon">📊</div>
                <div class="stat-value">${financialData.averageMargin.toFixed(1)}%</div>
                <div class="stat-label">Průměrná marže</div>
            </div>
            
            <div class="stat-item events">
                <div class="stat-icon">📅</div>
                <div class="stat-value">${financialData.validEvents}</div>
                <div class="stat-label">Akcí s daty</div>
            </div>
            
            <div class="stat-item profitability">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">${financialData.profitabilityRate.toFixed(1)}%</div>
                <div class="stat-label">Ziskovost</div>
            </div>
        </div>
    `;
}

// Zobrazení top performing events
function displayTopPerformingEvents(topEvents) {
    const container = document.getElementById('topEvents');
    if (!container) return;
    
    if (topEvents.length === 0) {
        container.innerHTML = `
            <div class="analytics-placeholder">
                <p>📊 Žádné akce s finančními daty k analýze</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    topEvents.forEach((event, index) => {
        const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const profitClass = event.profit > 0 ? 'positive' : 'negative';
        
        html += `
            <div class="top-item financial-item">
                <div class="top-info">
                    <h4>${rankIcon} ${escapeHtml(event.name)}</h4>
                    <p>📍 ${escapeHtml(event.city)} • 📋 ${escapeHtml(event.category)}</p>
                    <p><small>💼 ${escapeHtml(event.businessModel)} • 📅 ${formatDate(event.dateFrom)}</small></p>
                </div>
                <div class="top-stats financial-stats">
                    <div class="top-value ${profitClass}">${formatCurrency(event.profit)}</div>
                    <div class="top-subvalue">Obrat: ${formatCurrency(event.revenue)}</div>
                    <div class="top-subvalue">Marže: ${event.margin.toFixed(1)}%</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Zobrazení business model breakdown
function displayBusinessModelBreakdown(businessModelStats) {
    const container = document.getElementById('businessModelStats');
    if (!container) {
        // Vytvoř container pokud neexistuje
        const analyticsGrid = document.querySelector('.analytics-grid');
        if (analyticsGrid) {
            const newCard = document.createElement('div');
            newCard.className = 'card';
            newCard.innerHTML = `
                <h3>💼 Podle business modelů</h3>
                <div id="businessModelStats"></div>
            `;
            analyticsGrid.appendChild(newCard);
            return displayBusinessModelBreakdown(businessModelStats);
        }
        return;
    }
    
    if (businessModelStats.length === 0) {
        container.innerHTML = `
            <div class="analytics-placeholder">
                <p>💼 Žádná data podle business modelů</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    businessModelStats.forEach(model => {
        const modelIcon = {
            'majitel': '🏪',
            'zaměstnanec': '👨‍💼',
            'franšízant': '🤝'
        }[model.name] || '💼';
        
        const profitClass = model.totalProfit > 0 ? 'positive' : 'negative';
        
        html += `
            <div class="business-model-item">
                <div class="model-header">
                    <h4>${modelIcon} ${model.name}</h4>
                    <span class="events-count">${model.eventsCount} akcí</span>
                </div>
                <div class="model-stats">
                    <div class="model-stat">
                        <span class="stat-label">Celkový zisk:</span>
                        <span class="stat-value ${profitClass}">${formatCurrency(model.totalProfit)}</span>
                    </div>
                    <div class="model-stat">
                        <span class="stat-label">Průměrný zisk:</span>
                        <span class="stat-value">${formatCurrency(model.averageProfit)}</span>
                    </div>
                    <div class="model-stat">
                        <span class="stat-label">Průměrná marže:</span>
                        <span class="stat-value">${model.averageMargin.toFixed(1)}%</span>
                    </div>
                    <div class="model-stat">
                        <span class="stat-label">Ziskovost:</span>
                        <span class="stat-value">${model.profitabilityRate.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// PLACEHOLDER - zachováno z původního Part 4
function displayMonthlyTrends() {
    const container = document.getElementById('monthlyTrends');
    if (!container) return;
    
    container.innerHTML = `
        <div class="chart-placeholder">
            <p>📈 Měsíční trendy finančních výsledků</p>
            <p><small>Tato funkce bude implementována v budoucí verzi</small></p>
        </div>
    `;
}

// ========================================
// EVENT LISTENERS PRO ANALYTICS
// ========================================

// Event listeners pro finanční přehled
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded - updating financial overview');
    setTimeout(() => {
        displayFinancialOverview();
    }, 1000);
});

eventBus.on('sectionChanged', (data) => {
    if (data.section === 'analytics') {
        console.log('📊 Analytics section opened - refreshing financial data');
        setTimeout(() => {
            displayFinancialOverview();
        }, 500);
    }
});

eventBus.on('analyticsRequested', () => {
    console.log('📊 Financial analytics requested');
    displayFinancialOverview();
});

console.log('✅ Donuland Part 4D loaded successfully');
console.log('💰 Features: ✅ Business model calculations ✅ Financial overview ✅ Top events by profit ✅ Model breakdown');
console.log('🔧 Business models: franšízant (no labor), zaměstnanec (+5% revenue), majitel (standard)');
console.log('📊 Analytics: Revenue, costs, profit, margin with real Sheets data');

// Event pro signalizaci dokončení části 4D
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4dLoaded', { 
        timestamp: Date.now(),
        version: '2.0.0-financial',
        features: ['business-model-calculations', 'financial-overview', 'top-events-profit', 'model-breakdown', 'rent-parsing']
    });
}
/* ========================================
   DONULAND PART 4E - MODAL SYSTÉM PRO UDÁLOSTI
   Kompletní modal s finančními údaji a Google Sheets export
   ======================================== */

console.log('🍩 Donuland Part 4E loading...');

// ========================================
// HLAVNÍ FUNKCE PRO MODAL
// ========================================

// HLAVNÍ funkce pro otevření event modalu
function openEventModal(event = null, defaultDate = null) {
    console.log('📝 Opening event modal:', { event, defaultDate });
    
    try {
        let modal = document.getElementById('eventModal');
        
        // Pokud modal neexistuje, vytvoř ho
        if (!modal) {
            modal = createEventModal();
            document.body.appendChild(modal);
        }
        
        // Zobraz modal
        modal.style.display = 'flex';
        modal.classList.add('enhanced-modal');
        
        // Naplň modal daty
        if (event) {
            populateModalWithEvent(event);
        } else {
            populateModalForNewEvent(defaultDate);
        }
        
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

// ========================================
// VYTVOŘENÍ MODAL STRUKTURY
// ========================================

// Vytvoření kompletního modal elementu
function createEventModal() {
    const modal = document.createElement('div');
    modal.id = 'eventModal';
    modal.className = 'modal enhanced-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
        <div class="modal-content enhanced-content">
            <div class="modal-header">
                <h3 id="modalTitle">Detail události</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body enhanced-body">
                <!-- Základní informace -->
                <div class="modal-section">
                    <h4>📋 Základní údaje</h4>
                    <div class="modal-grid">
                        <div class="form-group">
                            <label>Název akce</label>
                            <input type="text" id="modalEventName" readonly>
                        </div>
                        <div class="form-group">
                            <label>Kategorie</label>
                            <input type="text" id="modalCategory" readonly>
                        </div>
                        <div class="form-group">
                            <label>Město</label>
                            <input type="text" id="modalCity" readonly>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <input type="text" id="modalStatus" readonly>
                        </div>
                        <div class="form-group">
                            <label>Datum od</label>
                            <input type="text" id="modalDateFrom" readonly>
                        </div>
                        <div class="form-group">
                            <label>Datum do</label>
                            <input type="text" id="modalDateTo" readonly>
                        </div>
                        <div class="form-group">
                            <label>Návštěvnost</label>
                            <input type="text" id="modalVisitors" readonly>
                        </div>
                        <div class="form-group">
                            <label>Business model</label>
                            <input type="text" id="modalBusinessModel" readonly>
                        </div>
                    </div>
                </div>
                
                <!-- Prodejní data -->
                <div class="modal-section">
                    <h4>💰 Prodejní údaje</h4>
                    <div class="modal-grid">
                        <div class="form-group">
                            <label>Reálně prodáno (ks)</label>
                            <input type="number" id="modalSales" placeholder="Zadejte skutečný prodej">
                        </div>
                        <div class="form-group">
                            <label>Predikovaný prodej (ks)</label>
                            <input type="text" id="modalPredictedSales" readonly>
                        </div>
                        <div class="form-group">
                            <label>Cena za kus (Kč)</label>
                            <input type="text" id="modalPrice" readonly>
                        </div>
                        <div class="form-group">
                            <label>Konverze (%)</label>
                            <input type="text" id="modalConversion" readonly>
                        </div>
                        <div class="form-group">
                            <label>Confidence (%)</label>
                            <input type="text" id="modalConfidence" readonly>
                        </div>
                        <div class="form-group">
                            <label>Hodnocení (1-5)</label>
                            <input type="number" id="modalRating" min="1" max="5">
                        </div>
                    </div>
                </div>
                
                <!-- Finanční přehled -->
                <div class="modal-section" id="modalFinancialSection">
                    <h4>📊 Finanční přehled</h4>
                    <div id="modalFinancialData">
                        <!-- Naplní se dynamicky -->
                    </div>
                </div>
                
                <!-- Počasí (pro outdoor akce) -->
                <div class="modal-section" id="modalWeatherSection" style="display: none;">
                    <h4>🌤️ Počasí</h4>
                    <div id="modalWeatherData">
                        <!-- Naplní se dynamicky -->
                    </div>
                </div>
                
                <!-- Poznámky -->
                <div class="modal-section">
                    <h4>📝 Dodatečné informace</h4>
                    <div class="modal-grid">
                        <div class="form-group full-width">
                            <label>Poznámky</label>
                            <textarea id="modalNotes" rows="3" placeholder="Volitelná poznámka k akci..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Zdroj dat</label>
                            <input type="text" id="modalSource" readonly>
                        </div>
                        <div class="form-group">
                            <label>Poslední aktualizace</label>
                            <input type="text" id="modalLastUpdated" readonly>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer enhanced-footer">
                <!-- Tlačítka se naplní dynamicky -->
            </div>
        </div>
    `;
    
    return modal;
}

// ========================================
// NAPLNĚNÍ MODALU PRO EXISTUJÍCÍ UDÁLOST
// ========================================

// Naplnění modalu daty existující události
function populateModalWithEvent(event) {
    console.log('📋 Populating modal with event data:', event);
    
    // Základní údaje
    const elements = {
        title: document.getElementById('modalTitle'),
        eventName: document.getElementById('modalEventName'),
        category: document.getElementById('modalCategory'),
        city: document.getElementById('modalCity'),
        status: document.getElementById('modalStatus'),
        dateFrom: document.getElementById('modalDateFrom'),
        dateTo: document.getElementById('modalDateTo'),
        visitors: document.getElementById('modalVisitors'),
        businessModel: document.getElementById('modalBusinessModel')
    };
    
    // Naplnění základních údajů
    if (elements.title) {
        const statusIcon = getStatusIcon(event.status);
        const typeIcon = getEventTypeIcon(event.type);
        elements.title.textContent = `${statusIcon}${typeIcon} ${event.title}`;
    }
    
    if (elements.eventName) elements.eventName.value = event.title || '';
    if (elements.category) elements.category.value = event.category || '';
    if (elements.city) elements.city.value = event.city || '';
    if (elements.status) {
        elements.status.value = getStatusText(event.status);
        elements.status.className = `status-input ${event.status}`;
    }
    if (elements.dateFrom) elements.dateFrom.value = formatDateForInput(event.dateFrom) || '';
    if (elements.dateTo) elements.dateTo.value = formatDateForInput(event.dateTo || event.dateFrom) || '';
    if (elements.visitors) elements.visitors.value = formatNumber(event.visitors || 0);
    if (elements.businessModel) elements.businessModel.value = getBusinessModelLabel(event.data?.businessModel || 'majitel');
    
    // Prodejní údaje
    populateSalesData(event);
    
    // Finanční přehled
    populateFinancialData(event);
    
    // Počasí (pokud je outdoor)
    populateWeatherData(event);
    
    // Dodatečné informace
    populateAdditionalData(event);
    
    // Nastavení tlačítek
    setupModalButtons(event);
}

// ========================================
// NAPLNĚNÍ PRODEJNÍCH ÚDAJŮ
// ========================================

// Naplnění prodejních dat
function populateSalesData(event) {
    const elements = {
        sales: document.getElementById('modalSales'),
        predictedSales: document.getElementById('modalPredictedSales'),
        price: document.getElementById('modalPrice'),
        conversion: document.getElementById('modalConversion'),
        confidence: document.getElementById('modalConfidence'),
        rating: document.getElementById('modalRating')
    };
    
    // Skutečný prodej (editovatelný)
    if (elements.sales) {
        elements.sales.value = event.sales || event.actualSales || '';
        elements.sales.placeholder = 'Zadejte skutečný prodej po akci';
    }
    
    // Predikovaný prodej
    if (elements.predictedSales && event.predictedSales) {
        elements.predictedSales.value = formatNumber(event.predictedSales);
    }
    
    // Cena
    if (elements.price) {
        const price = event.data?.price || CONFIG.DONUT_PRICE;
        elements.price.value = `${price} Kč`;
    }
    
    // Konverze
    if (elements.conversion && event.visitors && (event.sales || event.actualSales)) {
        const sales = event.sales || event.actualSales;
        const conversion = (sales / event.visitors) * 100;
        elements.conversion.value = `${conversion.toFixed(2)}%`;
        elements.conversion.className = `conversion-value ${conversion > 15 ? 'excellent' : conversion > 10 ? 'good' : conversion > 5 ? 'ok' : 'poor'}`;
    }
    
    // Confidence
    if (elements.confidence && event.confidence) {
        elements.confidence.value = `${event.confidence}%`;
    }
    
    // Hodnocení (editovatelné)
    if (elements.rating) {
        elements.rating.value = event.rating || '';
    }
}

// ========================================
// NAPLNĚNÍ FINANČNÍCH DAT
// ========================================

// Naplnění finančního přehledu
function populateFinancialData(event) {
    const container = document.getElementById('modalFinancialData');
    if (!container) return;
    
    // Zkus vypočítat finansy pokud máme dostatečná data
    let financials = null;
    
    if (event.data && (event.sales || event.actualSales)) {
        // Vytvoř temporary record pro výpočet
        const tempRecord = {
            ...event.data,
            sales: event.sales || event.actualSales || event.predictedSales || 0
        };
        financials = calculateFinancials(tempRecord);
    } else if (event.sales || event.predictedSales) {
        // Základní výpočet bez detailních dat
        const sales = event.sales || event.predictedSales || 0;
        const price = event.data?.price || CONFIG.DONUT_PRICE;
        financials = {
            revenue: sales * price,
            productionCost: sales * 32,
            laborCost: 2 * 10 * 150, // Default
            totalCosts: (sales * 32) + (2 * 10 * 150),
            profit: (sales * price) - ((sales * 32) + (2 * 10 * 150)),
            margin: 0,
            businessModel: 'majitel'
        };
        financials.margin = financials.revenue > 0 ? (financials.profit / financials.revenue) * 100 : 0;
    }
    
    if (financials) {
        container.innerHTML = generateFinancialHTML(financials);
        container.parentElement.style.display = 'block';
    } else {
        container.innerHTML = `
            <div class="financial-placeholder">
                <p>💰 Finanční data nejsou k dispozici</p>
                <p><small>Zadejte skutečný prodej pro výpočet finančních metrik</small></p>
            </div>
        `;
    }
}

// Generování HTML pro finanční data
function generateFinancialHTML(financials) {
    const profitClass = financials.profit > 0 ? 'positive' : 'negative';
    const profitIcon = financials.profit > 0 ? '✅' : '❌';
    
    return `
        <div class="financial-overview">
            <div class="financial-grid">
                <div class="financial-item revenue">
                    <div class="financial-icon">💰</div>
                    <div class="financial-details">
                        <div class="financial-label">Obrat</div>
                        <div class="financial-value">${formatCurrency(financials.revenue)}</div>
                    </div>
                </div>
                
                <div class="financial-item costs">
                    <div class="financial-icon">💸</div>
                    <div class="financial-details">
                        <div class="financial-label">Náklady</div>
                        <div class="financial-value">${formatCurrency(financials.totalCosts)}</div>
                    </div>
                </div>
                
                <div class="financial-item profit ${profitClass}">
                    <div class="financial-icon">${profitIcon}</div>
                    <div class="financial-details">
                        <div class="financial-label">Zisk</div>
                        <div class="financial-value">${formatCurrency(financials.profit)}</div>
                    </div>
                </div>
                
                <div class="financial-item margin">
                    <div class="financial-icon">📊</div>
                    <div class="financial-details">
                        <div class="financial-label">Marže</div>
                        <div class="financial-value">${financials.margin.toFixed(1)}%</div>
                    </div>
                </div>
            </div>
            
            <div class="costs-breakdown">
                <h5>📋 Rozpis nákladů</h5>
                <div class="breakdown-items">
                    <div class="breakdown-item">
                        <span class="breakdown-label">🍩 Výroba:</span>
                        <span class="breakdown-value">${formatCurrency(financials.productionCost)}</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">👨‍💼 Mzdy:</span>
                        <span class="breakdown-value">${formatCurrency(financials.laborCost)}</span>
                    </div>
                    ${financials.transportCost ? `
                    <div class="breakdown-item">
                        <span class="breakdown-label">🚗 Doprava:</span>
                        <span class="breakdown-value">${formatCurrency(financials.transportCost)}</span>
                    </div>
                    ` : ''}
                    ${financials.rentCost ? `
                    <div class="breakdown-item">
                        <span class="breakdown-label">🏢 Nájem:</span>
                        <span class="breakdown-value">${formatCurrency(financials.rentCost)}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="business-model-info">
                    <small>💼 Model: <strong>${financials.businessModel}</strong></small>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// POČASÍ A DODATEČNÉ ÚDAJE
// ========================================

// Naplnění počasí dat (pokud outdoor)
function populateWeatherData(event) {
    const weatherSection = document.getElementById('modalWeatherSection');
    const weatherContainer = document.getElementById('modalWeatherData');
    
    if (!weatherSection || !weatherContainer) return;
    
    // Určení zda je outdoor akce
    const isOutdoor = determineEventType(event) === 'outdoor';
    
    if (!isOutdoor) {
        weatherSection.style.display = 'none';
        return;
    }
    
    weatherSection.style.display = 'block';
    
    // Zobraz základní weather info nebo placeholder
    if (event.data?.weather) {
        weatherContainer.innerHTML = generateWeatherHTML(event.data.weather);
    } else {
        weatherContainer.innerHTML = `
            <div class="weather-placeholder">
                <p>🌤️ Počasí pro venkovní akci</p>
                <p><small>Data o počasí nejsou k dispozici</small></p>
            </div>
        `;
    }
}

// Generování HTML pro počasí
function generateWeatherHTML(weatherData) {
    return `
        <div class="weather-info">
            <div class="weather-summary">
                <span class="weather-icon">${getWeatherIcon(weatherData.main || 'Clear')}</span>
                <span class="weather-temp">${weatherData.temp || 'N/A'}°C</span>
                <span class="weather-desc">${weatherData.description || 'Neznámé'}</span>
            </div>
            ${weatherData.temp > 24 ? `
            <div class="weather-warning">
                🔥 <strong>Varování:</strong> Vysoká teplota může způsobit tání čokolády!
            </div>
            ` : ''}
            ${weatherData.main === 'Rain' ? `
            <div class="weather-warning">
                🌧️ <strong>Pozor:</strong> Déšť snižuje návštěvnost venkovních akcí!
            </div>
            ` : ''}
        </div>
    `;
}

// Naplnění dodatečných údajů
function populateAdditionalData(event) {
    const elements = {
        notes: document.getElementById('modalNotes'),
        source: document.getElementById('modalSource'),
        lastUpdated: document.getElementById('modalLastUpdated')
    };
    
    if (elements.notes) {
        elements.notes.value = event.notes || event.data?.notes || '';
    }
    
    if (elements.source) {
        elements.source.value = getSourceText(event.source);
        elements.source.className = `source-input ${event.source}`;
    }
    
    if (elements.lastUpdated) {
        const updateTime = event.data?.timestamp || event.data?.loadedAt || new Date().toISOString();
        elements.lastUpdated.value = formatDateTime(updateTime);
    }
}

// ========================================
// MODAL BUTTONS A AKCE
// ========================================

// Nastavení tlačítek modalu
function setupModalButtons(event) {
    const modalFooter = document.querySelector('.modal-footer');
    if (!modalFooter) return;
    
    modalFooter.innerHTML = `
        <button class="btn btn-save" onclick="saveEventChanges('${event.id}', '${event.type}')">
            💾 Uložit změny
        </button>
        <button class="btn btn-export" onclick="exportEventToSheets('${event.id}', '${event.type}')">
            📤 Přidat do Google Sheets
        </button>
        <button class="btn btn-info" onclick="duplicateAsPrediction('${event.id}', '${event.type}')">
            📋 Kopírovat jako predikci
        </button>
        <button class="btn btn-delete" onclick="deleteEvent('${event.id}', '${event.type}')">
            🗑️ Smazat akci
        </button>
        <button class="btn" onclick="closeModal()">
            Zavřít
        </button>
    `;
}

// ========================================
// MODAL AKCE FUNKCE
// ========================================

// Uložení změn v modalu
function saveEventChanges(eventId, eventType) {
    console.log('💾 Saving event changes:', { eventId, eventType });
    
    const salesInput = document.getElementById('modalSales');
    const notesInput = document.getElementById('modalNotes');
    const ratingInput = document.getElementById('modalRating');
    
    const changes = {};
    
    if (salesInput && salesInput.value) {
        changes.actualSales = parseFloat(salesInput.value) || 0;
        console.log('💰 New actual sales:', changes.actualSales);
    }
    
    if (notesInput) {
        changes.notes = notesInput.value || '';
        console.log('📝 New notes:', changes.notes);
    }
    
    if (ratingInput && ratingInput.value) {
        changes.rating = parseInt(ratingInput.value) || 0;
        console.log('⭐ New rating:', changes.rating);
    }
    
    // Uložení podle typu události
    if (eventType === 'prediction') {
        savePredictionChanges(eventId, changes);
    } else if (eventType === 'manual') {
        saveManualEventChanges(eventId, changes);
    } else {
        // Pro historické události uložíme jako override
        saveHistoricalEventOverride(eventId, changes);
    }
    
    closeModal();
    renderCalendar(); // Refresh kalendář
    showNotification('✅ Změny byly uloženy', 'success');
}

// Export události do Google Sheets (placeholder)
function exportEventToSheets(eventId, eventType) {
    console.log('📤 Exporting event to Google Sheets:', { eventId, eventType });
    showNotification('📤 Export do Google Sheets bude implementován v Part 5', 'info');
}

// Duplikace jako predikce
function duplicateAsPrediction(eventId, eventType) {
    console.log('📋 Duplicating as prediction:', { eventId, eventType });
    
    closeModal();
    
    // Najdi událost a zkopíruj data do prediction formuláře
    const event = findEventById(eventId, eventType);
    if (event) {
        fillPredictionFormFromEvent(event);
        
        // Přepni na prediction sekci
        const predictionBtn = document.querySelector('.nav-btn[data-section="prediction"]');
        if (predictionBtn) {
            predictionBtn.click();
        }
        
        showNotification('📋 Data zkopírována do formuláře predikce', 'success');
    }
}

// Smazání události
function deleteEvent(eventId, eventType) {
    if (!confirm('Opravdu chcete smazat tuto událost?\n\nTato akce je nevratná.')) {
        return;
    }
    
    console.log('🗑️ Deleting event:', { eventId, eventType });
    
    // Logika pro smazání podle typu
    if (eventType === 'prediction') {
        deletePredictionEvent(eventId);
    } else if (eventType === 'manual') {
        deleteManualEvent(eventId);
    } else {
        showNotification('❌ Historické události ze Sheets nelze smazat', 'warning');
        return;
    }
    
    closeModal();
    renderCalendar();
    showNotification('✅ Událost byla smazána', 'success');
}

// Zavření modalu
function closeModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ========================================
// HELPER FUNKCE PRO MODAL
// ========================================

// Určení typu události
function determineEventType(event) {
    if (event.category === 'koncert' || event.category === 'kulturní akce') {
        return 'indoor';
    }
    return 'outdoor'; // Default
}

// Helper funkce pro business model label
function getBusinessModelLabel(businessModel) {
    const labels = {
        'majitel': '🏪 Majitel',
        'zaměstnanec': '👨‍💼 Zaměstnanec',
        'franšízant': '🤝 Franšízant',
        'owner': '🏪 Majitel',
        'employee': '👨‍💼 Zaměstnanec',
        'franchise': '🤝 Franšízant'
    };
    return labels[businessModel] || businessModel;
}

// Ostatní helper funkce z předchozích částí
function getStatusIcon(status) {
    const icons = {
        'completed': '✅',
        'ongoing': '🔥',
        'planned': '🔮',
        'unknown': '❓'
    };
    return icons[status] || '📅';
}

function getEventTypeIcon(type) {
    const icons = {
        'historical': '📊',
        'prediction': '🤖',
        'manual': '📝'
    };
    return icons[type] || '📅';
}

function formatDateForInput(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
        const parsed = parseSheetDate(date);
        return parsed || date;
    }
    
    if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    return '';
}

function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('cs-CZ');
}

// Placeholder funkce pro novou událost
function populateModalForNewEvent(defaultDate) {
    // Placeholder - bude implementováno pokud bude potřeba
    console.log('📝 New event modal not implemented yet');
}

console.log('✅ Donuland Part 4E loaded successfully');
console.log('📝 Features: ✅ Complete event modal ✅ Financial breakdown ✅ Weather info ✅ Edit capabilities');
console.log('💰 Financial: Real-time calculations with business model logic');
console.log('🔧 Actions: Save changes, export to Sheets, duplicate as prediction, delete');

// Event pro signalizaci dokončení části 4E
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4eLoaded', { 
        timestamp: Date.now(),
        version: '2.0.0',
        features: ['complete-event-modal', 'financial-breakdown', 'weather-info', 'edit-capabilities', 'action-buttons']
    });
}
/* ========================================
   DONULAND PART 4F - INICIALIZACE A EVENT LISTENERS
   Finální část - event listeners, inicializace, CSS styly
   ======================================== */

console.log('🍩 Donuland Part 4F loading...');

// ========================================
// EVENT LISTENERS PRO KALENDÁŘ
// ========================================

// Event listeners pro data loading
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded - initializing calendar');
    
    // Inicializace color palette
    if (!calendarState.colorPalette || calendarState.colorPalette.length === 0) {
        calendarState.colorPalette = generateColorPalette();
    }
    
    // Naplnění filter dropdownů
    setTimeout(() => {
        populateFilterDropdowns();
        renderCalendar();
    }, 500);
});

// Event listeners pro kalendářní navigaci
eventBus.on('calendarMonthChanged', (data) => {
    console.log('📅 Month changed - rendering calendar');
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

// Event listeners pro sekce changes
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

// Event listeners pro predikce
eventBus.on('predictionSaved', () => {
    console.log('💾 Prediction saved - updating calendar');
    setTimeout(() => {
        populateFilterDropdowns();
        renderCalendar();
    }, 200);
});

// ========================================
// HELPER FUNKCE PRO SAVE/DELETE ACTIONS
// ========================================

// Uložení změn v predikci
function savePredictionChanges(predictionId, changes) {
    try {
        const predictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        const predictionIndex = predictions.findIndex(p => p.id === predictionId);
        
        if (predictionIndex >= 0) {
            // Aktualizuj predikci
            Object.assign(predictions[predictionIndex], changes);
            predictions[predictionIndex].lastModified = new Date().toISOString();
            
            localStorage.setItem('donuland_predictions', JSON.stringify(predictions));
            console.log('✅ Prediction changes saved');
        }
    } catch (error) {
        console.error('❌ Error saving prediction changes:', error);
    }
}

// Uložení změn v manuální události
function saveManualEventChanges(eventId, changes) {
    try {
        const events = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        const eventIndex = events.findIndex(e => e.id === eventId);
        
        if (eventIndex >= 0) {
            Object.assign(events[eventIndex], changes);
            events[eventIndex].lastModified = new Date().toISOString();
            
            localStorage.setItem('donuland_manual_events', JSON.stringify(events));
            console.log('✅ Manual event changes saved');
        }
    } catch (error) {
        console.error('❌ Error saving manual event changes:', error);
    }
}

// Uložení override pro historickou událost
function saveHistoricalEventOverride(eventId, changes) {
    try {
        const overrides = JSON.parse(localStorage.getItem('donuland_historical_overrides') || '{}');
        overrides[eventId] = {
            ...changes,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('donuland_historical_overrides', JSON.stringify(overrides));
        console.log('✅ Historical event override saved');
    } catch (error) {
        console.error('❌ Error saving historical override:', error);
    }
}

// Smazání predikce
function deletePredictionEvent(predictionId) {
    try {
        const predictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        const filtered = predictions.filter(p => p.id !== predictionId);
        
        localStorage.setItem('donuland_predictions', JSON.stringify(filtered));
        console.log('✅ Prediction deleted');
    } catch (error) {
        console.error('❌ Error deleting prediction:', error);
    }
}

// Smazání manuální události
function deleteManualEvent(eventId) {
    try {
        const events = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        const filtered = events.filter(e => e.id !== eventId);
        
        localStorage.setItem('donuland_manual_events', JSON.stringify(filtered));
        console.log('✅ Manual event deleted');
    } catch (error) {
        console.error('❌ Error deleting manual event:', error);
    }
}

// Nalezení události podle ID
function findEventById(eventId, eventType) {
    const allEvents = getEventsForCurrentMonth();
    return allEvents.find(event => event.id === eventId && event.type === eventType);
}

// Naplnění prediction formuláře z události
function fillPredictionFormFromEvent(event) {
    const fields = {
        'eventName': event.title,
        'city': event.city,
        'category': event.category,
        'visitors': event.visitors,
        'eventDateFrom': parseSheetDate(event.dateFrom) || event.dateFrom,
        'eventDateTo': parseSheetDate(event.dateTo || event.dateFrom) || event.dateFrom
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element && value) {
            element.value = value;
            
            // Trigger change event pro automatickou predikci
            if (['eventName', 'category', 'city'].includes(fieldId)) {
                const changeEvent = new Event('change', { bubbles: true });
                element.dispatchEvent(changeEvent);
            }
        }
    });
}

// ========================================
// KALENDÁŘNÍ NAVIGACE FUNKCE
// ========================================

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
    
    // Emit event o změně měsíce
    eventBus.emit('calendarMonthChanged', { 
        month: globalState.currentMonth, 
        year: globalState.currentYear 
    });
    
    console.log(`📅 Calendar changed to: ${globalState.currentMonth + 1}/${globalState.currentYear}`);
}

// Přechod na dnešní měsíc
function goToToday() {
    const today = new Date();
    globalState.currentMonth = today.getMonth();
    globalState.currentYear = today.getFullYear();
    
    updateCurrentMonthDisplay();
    
    eventBus.emit('calendarTodayRequested');
    
    showNotification('📅 Přešli jste na aktuální měsíc', 'info', 2000);
}

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

// ========================================
// CSS STYLY PRO CALENDAR PART 4
// ========================================

// Přidání CSS stylů pro Part 4
function addPart4Styles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Enhanced Modal Styles */
        .enhanced-modal .modal-content {
            max-width: 900px;
            max-height: 90vh;
        }
        
        .enhanced-body {
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .modal-section {
            margin-bottom: 25px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid var(--primary-color);
        }
        
        .modal-section h4 {
            margin: 0 0 15px 0;
            color: var(--primary-color);
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .modal-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .modal-grid .form-group.full-width {
            grid-column: 1 / -1;
        }
        
        /* Status input styling */
        .status-input.completed {
            background: #d4edda;
            color: #155724;
            border-color: #28a745;
            font-weight: 600;
        }
        
        .status-input.ongoing {
            background: #fff3cd;
            color: #856404;
            border-color: #ffc107;
            font-weight: 600;
        }
        
        .status-input.planned {
            background: #cce5ff;
            color: #0056b3;
            border-color: #17a2b8;
            font-weight: 600;
        }
        
        /* Source input styling */
        .source-input.sheets {
            background: #e8f5e8;
            border-color: #28a745;
        }
        
        .source-input.prediction {
            background: #e3f2fd;
            border-color: #2196f3;
        }
        
        .source-input.manual {
            background: #fff3e0;
            border-color: #ff9800;
        }
        
        /* Conversion value styling */
        .conversion-value.excellent {
            background: #d4edda;
            color: #155724;
            font-weight: 700;
        }
        
        .conversion-value.good {
            background: #e3f2fd;
            color: #1976d2;
            font-weight: 600;
        }
        
        .conversion-value.ok {
            background: #fff3cd;
            color: #856404;
            font-weight: 600;
        }
        
        .conversion-value.poor {
            background: #f8d7da;
            color: #721c24;
            font-weight: 600;
        }
        
        /* Financial Overview Styles */
        .financial-overview {
            background: white;
            border-radius: 8px;
            padding: 15px;
            border: 1px solid #e9ecef;
        }
        
        .financial-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .financial-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        
        .financial-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .financial-item.positive {
            background: linear-gradient(135deg, #d4edda, #c3e6cb);
            border: 1px solid #28a745;
        }
        
        .financial-item.negative {
            background: linear-gradient(135deg, #f8d7da, #f5c6cb);
            border: 1px solid #dc3545;
        }
        
        .financial-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
        }
        
        .financial-details {
            flex: 1;
        }
        
        .financial-label {
            font-size: 0.85rem;
            color: var(--gray-600);
            margin-bottom: 2px;
        }
        
        .financial-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--gray-800);
        }
        
        /* Costs Breakdown */
        .costs-breakdown {
            background: #f1f3f4;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
        }
        
        .costs-breakdown h5 {
            margin: 0 0 10px 0;
            color: var(--gray-700);
        }
        
        .breakdown-items {
            display: grid;
            gap: 8px;
        }
        
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .breakdown-item:last-child {
            border-bottom: none;
        }
        
        .breakdown-label {
            font-size: 0.9rem;
            color: var(--gray-600);
        }
        
        .breakdown-value {
            font-weight: 600;
            color: var(--gray-800);
        }
        
        .business-model-info {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: var(--gray-600);
        }
        
        /* Weather Info Styles */
        .weather-info {
            background: linear-gradient(135deg, #74b9ff, #0984e3);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .weather-summary {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .weather-icon {
            font-size: 2rem;
        }
        
        .weather-temp {
            font-size: 1.5rem;
            font-weight: 700;
        }
        
        .weather-desc {
            font-size: 1rem;
            opacity: 0.9;
        }
        
        .weather-warning {
            background: rgba(255, 193, 7, 0.2);
            border-radius: 4px;
            padding: 8px;
            margin-top: 10px;
            border-left: 3px solid #ffc107;
            font-size: 0.9rem;
        }
        
        .weather-placeholder {
            text-align: center;
            padding: 20px;
            color: var(--gray-500);
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        /* Business Model Stats */
        .business-model-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid var(--primary-color);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .model-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .model-header h4 {
            margin: 0;
            color: var(--gray-800);
        }
        
        .events-count {
            background: var(--primary-color);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .model-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
        }
        
        .model-stat {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        
        .model-stat .stat-label {
            color: var(--gray-600);
            font-size: 0.9rem;
        }
        
        .model-stat .stat-value {
            font-weight: 600;
            color: var(--gray-800);
        }
        
        .model-stat .stat-value.positive {
            color: var(--success-color);
        }
        
        .model-stat .stat-value.negative {
            color: var(--error-color);
        }
        
        /* Enhanced action buttons */
        .enhanced-footer {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
        }
        
        .enhanced-footer .btn {
            flex: 1;
            min-width: 120px;
            margin: 0;
        }
        
        .enhanced-footer .btn:last-child {
            flex: 0;
            min-width: 80px;
        }
        
        /* Financial stats grid enhancements */
        .financial-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .financial-stats-grid .stat-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }
        
        .financial-stats-grid .stat-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .financial-stats-grid .stat-icon {
            font-size: 2.5rem;
            opacity: 0.8;
        }
        
        .financial-stats-grid .stat-value {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 5px;
            line-height: 1;
        }
        
        .financial-stats-grid .stat-label {
            font-size: 0.9rem;
            color: var(--gray-600);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .enhanced-modal .modal-content {
                width: 95%;
                max-width: none;
                margin: 10px;
                max-height: 95vh;
            }
            
            .modal-grid {
                grid-template-columns: 1fr;
            }
            
            .financial-grid {
                grid-template-columns: 1fr;
            }
            
            .enhanced-footer {
                flex-direction: column;
            }
            
            .enhanced-footer .btn {
                width: 100%;
                margin-bottom: 5px;
            }
            
            .financial-stats-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('🎨 Part 4 styles added');
}

// ========================================
// INICIALIZACE PART 4
// ========================================

// Hlavní inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Initializing Donuland Part 4 Complete System...');
    
    try {
        // Přidání CSS stylů
        addPart4Styles();
        
        // Ujisti se, že globalState existuje
        if (typeof globalState === 'undefined') {
            console.warn('⚠️ globalState not defined, creating basic one');
            window.globalState = {
                currentYear: new Date().getFullYear(),
                currentMonth: new Date().getMonth(),
                historicalData: [],
                debugMode: window.location.search.includes('debug=true')
            };
        }
        
        // Nastavení event listenerů pro filtry
        setupFilterEventListeners();
        
        // Inicializace color palette
        if (!calendarState.colorPalette || calendarState.colorPalette.length === 0) {
            calendarState.colorPalette = generateColorPalette();
        }
        
        // Aktualizace měsíce display
        updateCurrentMonthDisplay();
        
        // Automatické vykreslení kalendáře po 3 sekundách (pokud jsou data)
        setTimeout(() => {
            if (globalState.historicalData && globalState.historicalData.length > 0) {
                console.log('🔄 Auto-rendering calendar with existing data...');
                populateFilterDropdowns();
                renderCalendar();
            } else {
                console.log('📊 Waiting for data to be loaded...');
            }
        }, 3000);
        
        console.log('✅ Part 4 Complete System initialized');
        
    } catch (error) {
        console.error('❌ Error initializing Part 4:', error);
        showNotification('❌ Chyba při inicializaci kalendáře', 'error');
    }
});

// ========================================
// DEBUG FUNKCE PRO CELÝ PART 4
// ========================================

// Kompletní debug funkce pro Part 4
function debugPart4Complete() {
    console.group('🔍 DEBUG: Part 4 Complete System');
    
    // Test kalendářního stavu
    console.log('Calendar State:', calendarState);
    console.log('Global State:', {
        currentMonth: globalState.currentMonth,
        currentYear: globalState.currentYear,
        dataCount: globalState.historicalData?.length || 0
    });
    
    // Test elementů v DOM
    const elements = {
        calendarGrid: document.getElementById('calendarGrid'),
        cityFilter: document.getElementById('cityFilter'),
        categoryFilter: document.getElementById('categoryFilter'),
        monthEvents: document.getElementById('monthEvents'),
        overallStats: document.getElementById('overallStats')
    };
    
    console.log('DOM Elements:', Object.entries(elements).map(([key, el]) => ({
        [key]: el ? 'EXISTS' : 'MISSING'
    })));
    
    // Test dat
    const categories = getUniqueCategories();
    const cities = getUniqueCities();
    const todayEvents = getEventsForDate(new Date());
    
    console.log('Data Analysis:', {
        categories: categories.length,
        cities: cities.length,
        todayEvents: todayEvents.length
    });
    
    // Test finančních výpočtů
    if (globalState.historicalData?.length > 0) {
        const financials = calculateOverallFinancials();
        console.log('Financial Overview:', financials);
    }
    
    console.groupEnd();
    
    return {
        calendarState,
        dataCount: globalState.historicalData?.length || 0,
        categories: categories.length,
        cities: cities.length,
        todayEvents: todayEvents.length,
        timestamp: new Date().toISOString()
    };
}

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4Debug = {
        // Complete system debug
        debugComplete: debugPart4Complete,
        
        // Individual part debugs
        debugDateParsing: () => window.donulandPart4ADebug?.debugDateParsing(),
        debugEventLoading: () => window.donulandPart4BDebug?.debugEventLoading(),
        
        // Test functions
        testCalendar: () => {
            renderCalendar();
            return 'Calendar rendered';
        },
        testModal: (event = null) => {
            openEventModal(event);
            return 'Modal opened';
        },
        testFilters: () => {
            populateFilterDropdowns();
            return 'Filters populated';
        },
        
        // State inspection
        getState: () => ({ calendarState, globalState }),
        getEvents: () => getEventsForCurrentMonth(),
        getFinancials: () => calculateOverallFinancials(),
        
        // Utils
        forceRender: () => {
            calendarState.isRendering = false;
            renderCalendar();
        },
        clearCache: () => {
            calendarState.eventColors.clear();
            console.log('Event colors cache cleared');
        }
    };
}

// ========================================
// GLOBÁLNÍ FUNKCE PRO HTML KOMPATIBILITU
// ========================================

// Export funkcí pro použití v HTML onclick handlers
if (typeof window !== 'undefined') {
    window.changeMonth = changeMonth;
    window.goToToday = goToToday;
    window.filterCalendar = filterCalendar;
    window.clearFilters = clearCalendarFilters;
    window.openEventModal = openEventModal;
    window.closeModal = closeModal;
    window.saveEventChanges = saveEventChanges;
    window.exportEventToSheets = exportEventToSheets;
    window.duplicateAsPrediction = duplicateAsPrediction;
    window.deleteEvent = deleteEvent;
}

console.log('✅ Donuland Part 4F loaded successfully');
console.log('🎯 Features: ✅ Event listeners ✅ Calendar navigation ✅ Save/Delete actions ✅ CSS styles ✅ Debug tools');
console.log('🔧 Functions exported: changeMonth, goToToday, filterCalendar, openEventModal, etc.');
console.log('🧪 Debug: window.donulandPart4Debug.debugComplete() to test entire system');
console.log('📅 PART 4 COMPLETE - Full calendar system ready!');

// Event pro signalizaci dokončení celého Part 4
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4Loaded', { 
        timestamp: Date.now(),
        version: '2.0.0-complete',
        parts: ['4A-state', '4B-events', '4C-rendering', '4D-financial', '4E-modal', '4F-init'],
        features: [
            'czech-date-parsing', 'exact-categories', 'event-loading', 'smart-filtering',
            'calendar-rendering', 'color-system', 'financial-calculations', 'business-models',
            'complete-modal', 'weather-info', 'event-listeners', 'debug-tools'
        ]
    });
}

// Final celebration
console.log(`
🎉 CONGRATULATIONS! 🎉
📅 PART 4 COMPLETE SYSTEM LOADED SUCCESSFULLY

✅ Part 4A: Calendar state & basic functions
✅ Part 4B: Event loading & filtering  
✅ Part 4C: Calendar rendering & UI
✅ Part 4D: Financial overview & analytics
✅ Part 4E: Modal system & event details
✅ Part 4F: Initialization & event listeners

🚀 Calendar is now fully functional with:
   📊 Real data from Google Sheets
   💰 Business model calculations
   🎨 Smart color system
   📝 Complete event modals
   🔍 Advanced filtering
   📱 Mobile responsive design

Ready for Part 5: Google Sheets export! 🎯
`);
