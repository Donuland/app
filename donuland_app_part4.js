/* ========================================
   DONULAND PART 4A - KRITICKÉ OPRAVY
   Datum parsing a kategorie podle skutečných dat ze Sheets
   ======================================== */

console.log('🔧 Loading Donuland Part 4A - CRITICAL FIXES...');

// ========================================
// KRITICKÁ OPRAVA 1: DATUM PARSING
// ========================================

// KOMPLETNĚ PŘEPSANÁ funkce pro parsing českých dat ze Sheets
function parseSheetDate(dateStr) {
    if (!dateStr || !dateStr.trim()) return null;
    
    console.log(`📅 Parsing date: "${dateStr}"`);
    
    // KLÍČOVÁ OPRAVA: Rozpoznání formátů ze Sheets
    // Formáty ze Sheets: "18.1.2025", "28.6.2025", "8.2.2025"
    const czechDatePattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = dateStr.trim().match(czechDatePattern);
    
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0'); 
        const year = match[3];
        const isoDate = `${year}-${month}-${day}`;
        
        // KRITICKÁ OPRAVA: Validace data s poledním časem (eliminuje timezone problémy)
        const testDate = new Date(isoDate + 'T12:00:00');
        if (!isNaN(testDate.getTime())) {
            console.log(`✅ Czech date converted: "${dateStr}" → "${isoDate}"`);
            return isoDate;
        } else {
            console.warn(`⚠️ Invalid date created: "${isoDate}"`);
            return null;
        }
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
// KRITICKÁ OPRAVA 2: KATEGORIE ZE SHEETS
// ========================================

// NOVÁ funkce - přesné kategorie podle skutečných dat ze Sheets sloupce F
function normalizeCategory(category) {
    if (!category || !category.trim()) return 'Ostatní';
    
    const original = category.trim();
    console.log(`🏷️ Processing category: "${original}"`);
    
    // PŘESNÉ mapování podle Google Sheets sloupce F:
    // Skutečné hodnoty ze Sheets: "Sportovní akce (dospělí)", "veletrh", "food festival"
    const categoryMap = {
        // Sportovní akce varianty
        'Sportovní akce (dospělí)': 'Sportovní akce',
        'sportovní akce (dospělí)': 'Sportovní akce',
        'SPORTOVNÍ AKCE (DOSPĚLÍ)': 'Sportovní akce',
        'sportovní akce': 'Sportovní akce',
        'sportovní': 'Sportovní akce',
        
        // Veletrh varianty  
        'veletrh': 'Veletrh',
        'Veletrh': 'Veletrh',
        'VELETRH': 'Veletrh',
        
        // Food festival varianty
        'food festival': 'Food Festival',
        'Food festival': 'Food Festival', 
        'FOOD FESTIVAL': 'Food Festival',
        'food': 'Food Festival',
        'Food': 'Food Festival',
        
        // Další možné kategorie
        'koncert': 'Koncert',
        'Koncert': 'Koncert',
        'KONCERT': 'Koncert',
        
        'kulturní akce': 'Kulturní akce',
        'Kulturní akce': 'Kulturní akce',
        'kulturní': 'Kulturní akce',
        
        // Ostatní
        'ostatní': 'Ostatní',
        'Ostatní': 'Ostatní'
    };
    
    // Zkus najít přesnou shodu
    if (categoryMap[original]) {
        const normalized = categoryMap[original];
        console.log(`🏷️ Category mapped: "${original}" → "${normalized}"`);
        return normalized;
    }
    
    // Pokud nenajde přesnou shodu, vrať originál (ale s velkým písmenem)
    const capitalized = original.charAt(0).toUpperCase() + original.slice(1).toLowerCase();
    console.log(`🏷️ Category kept as-is: "${original}" → "${capitalized}"`);
    return capitalized;
}

// ========================================
// KRITICKÁ OPRAVA 3: DATUM RANGE CHECK
// ========================================

// OPRAVENÁ funkce pro kontrolu zda datum patří do rozsahu události
function isDateInEventRange(checkDateISO, eventDateFrom, eventDateTo) {
    if (!eventDateFrom) return false;
    
    // Parse event dates pomocí OPRAVENÉ funkce
    const parsedFrom = parseSheetDate(eventDateFrom);
    if (!parsedFrom) {
        if (globalState.debugMode) {
            console.warn(`⚠️ Cannot parse dateFrom: "${eventDateFrom}"`);
        }
        return false;
    }
    
    // Pro dateTo - pokud není nebo je prázdné, použij dateFrom (jednodenní akce)
    let parsedTo = parsedFrom;
    if (eventDateTo && eventDateTo.trim() && eventDateTo !== eventDateFrom) {
        const parsed = parseSheetDate(eventDateTo);
        if (parsed) {
            parsedTo = parsed;
        }
    }
    
    // KLÍČOVÁ OPRAVA: Přímé porovnání ISO stringů (nejbezpečnější způsob)
    const inRange = checkDateISO >= parsedFrom && checkDateISO <= parsedTo;
    
    if (globalState.debugMode && inRange) {
        console.log(`✅ Date "${checkDateISO}" is in range ${parsedFrom} - ${parsedTo}`);
    }
    
    return inRange;
}

// ========================================
// KRITICKÁ OPRAVA 4: STATUS DETERMINATION
// ========================================

// OPRAVENÁ funkce pro určení statusu události podle dnešního data
function determineEventStatus(dateFrom, dateTo) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Půlnoc pro přesné porovnání
        
        // Parse start date
        const parsedDateFrom = parseSheetDate(dateFrom);
        if (!parsedDateFrom) {
            console.warn('⚠️ Invalid dateFrom for status:', dateFrom);
            return 'unknown';
        }
        
        const eventStart = new Date(parsedDateFrom + 'T00:00:00');
        
        // Parse end date (může být prázdné pro jednodenní akce)
        let eventEnd = new Date(eventStart);
        if (dateTo && dateTo.trim() && dateTo !== dateFrom) {
            const parsedDateTo = parseSheetDate(dateTo);
            if (parsedDateTo) {
                eventEnd = new Date(parsedDateTo + 'T23:59:59');
            } else {
                eventEnd.setHours(23, 59, 59, 999);
            }
        } else {
            eventEnd.setHours(23, 59, 59, 999);
        }
        
        // Kontrola validity
        if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
            console.warn('⚠️ Invalid dates for status determination:', { dateFrom, dateTo });
            return 'unknown';
        }
        
        // KLÍČOVÁ LOGIKA: Určení statusu
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
// OPRAVA 5: ZÍSKÁNÍ UNIKÁTNÍCH KATEGORIÍ
// ========================================

// NOVÁ funkce - správné kategorie ze Sheets
function getUniqueCategories() {
    const categories = new Set();
    
    if (globalState.historicalData && globalState.historicalData.length > 0) {
        globalState.historicalData.forEach(record => {
            if (record.category && record.category.trim()) {
                // Použij OPRAVENOU normalizaci
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
    
    // Přidej kategorie z manuálních událostí
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

// ========================================
// OPRAVA 6: ZÍSKÁNÍ UNIKÁTNÍCH MĚST
// ========================================

// NOVÁ funkce - města ze Sheets
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
// HELPER FUNKCE
// ========================================

// Helper funkce pro vytvoření event key
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

// Helper funkce pro status text
function getStatusText(status) {
    const statusMap = {
        'completed': 'Dokončeno',
        'ongoing': 'Probíhá',
        'planned': 'Plánováno',
        'unknown': 'Neznámý'
    };
    return statusMap[status] || status;
}

// Helper funkce pro source text
function getSourceText(source) {
    const sourceMap = {
        'sheets': 'Google Sheets',
        'prediction': 'AI Predikce',
        'manual': 'Manuálně přidáno'
    };
    return sourceMap[source] || source;
}

// ========================================
// DEBUG FUNKCE PRO TESTOVÁNÍ
// ========================================

// Debug funkce pro testování Part 4A oprav
function debugPart4AFixes() {
    console.group('🔍 DEBUG: Part 4A Fixes Test');
    
    // Test datum parsing
    console.group('📅 Date Parsing Test');
    const testDates = [
        '18.1.2025',   // Winter Run
        '25.1.2025',   // Winter Run České Budějovice
        '8.2.2025',    // Zabijačkové hodování
        '9.2.2025',    // Vepřové hody
        '14.2.2025'    // ČokoFest Ostrava
    ];
    
    testDates.forEach(dateStr => {
        const parsed = parseSheetDate(dateStr);
        const status = parsed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} "${dateStr}" → "${parsed}"`);
    });
    console.groupEnd();
    
    // Test kategorie normalizace
    console.group('🏷️ Category Normalization Test');
    const testCategories = [
        'Sportovní akce (dospělí)',
        'veletrh', 
        'food festival',
        'koncert',
        'ostatní'
    ];
    
    testCategories.forEach(cat => {
        const normalized = normalizeCategory(cat);
        console.log(`"${cat}" → "${normalized}"`);
    });
    console.groupEnd();
    
    // Test status determination
    console.group('📊 Status Test');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();
    const tomorrow = new Date(); 
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testStatusDates = [
        { name: 'Yesterday', date: yesterday.toISOString().split('T')[0].split('-').reverse().join('.') },
        { name: 'Today', date: today.toISOString().split('T')[0].split('-').reverse().join('.') },
        { name: 'Tomorrow', date: tomorrow.toISOString().split('T')[0].split('-').reverse().join('.') }
    ];
    
    testStatusDates.forEach(test => {
        const status = determineEventStatus(test.date, test.date);
        console.log(`${test.name} (${test.date}): ${status}`);
    });
    console.groupEnd();
    
    console.groupEnd();
    
    return {
        dateParsingOK: testDates.every(d => parseSheetDate(d) !== null),
        categoryMappingOK: testCategories.every(c => normalizeCategory(c) !== 'Ostatní'),
        timestamp: new Date().toISOString()
    };
}

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4ADebugFixed = {
        debugFixes: debugPart4AFixes,
        testDateParse: (dateStr) => parseSheetDate(dateStr),
        testCategoryNormalize: (category) => normalizeCategory(category),
        testStatus: (dateFrom, dateTo) => determineEventStatus(dateFrom, dateTo),
        testEventKey: (name, city, date) => createEventKey(name, city, date),
        testDateRange: (checkDate, fromDate, toDate) => isDateInEventRange(checkDate, fromDate, toDate),
        getCategories: getUniqueCategories,
        getCities: getUniqueCities
    };
}

console.log('✅ Donuland Part 4A FIXES loaded successfully');
console.log('🔧 CRITICAL FIXES: ✅ Czech date parsing (DD.MM.YYYY) ✅ Exact categories from Sheets ✅ Proper status determination');
console.log('📋 Key improvements: Fixed timezone issues, accurate category mapping, working date ranges');
console.log('🧪 Debug: window.donulandPart4ADebugFixed.debugFixes() to test all fixes');
console.log('📊 Data source: Google Sheets columns D(city), E(event), F(category) - now correctly processed');

// Event pro signalizaci dokončení Part 4A
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4aFixed', { 
        timestamp: Date.now(),
        version: '4A-FIXED',
        fixes: ['date-parsing', 'category-mapping', 'status-determination', 'data-ranges', 'unique-values']
    });
}
/* ========================================
   DONULAND PART 4B - OPRAVA BAREVNÉHO SYSTÉMU
   Unikátní barvy pro každou akci (ne podle kategorie!)
   ======================================== */

console.log('🔧 Loading Donuland Part 4B - UNIQUE COLORS FOR EVENTS...');

// ========================================
// GLOBÁLNÍ KALENDÁŘNÍ STAV PRO BARVY
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
// KRITICKÁ OPRAVA: UNIKÁTNÍ BARVY PRO KAŽDOU AKCI
// ========================================

// OPRAVENÁ funkce pro barvy událostí - každá akce má svou barvu
function getEventColor(eventName, status, category) {
    // PRIORITA 1: Status barvy pouze pro dokončené a probíhající
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
    
    // PRIORITA 2: UNIKÁTNÍ BARVY PRO KAŽDOU AKCI (planned i ostatní)
    // Klíč podle názvu akce - stejná akce = stejná barva ve všech dnech
    const eventKey = eventName.toLowerCase().trim();
    
    if (!calendarState.eventColors.has(eventKey)) {
        // Ujisti se, že color palette existuje
        if (!calendarState.colorPalette || calendarState.colorPalette.length === 0) {
            calendarState.colorPalette = generateColorPalette();
        }
        
        const hash = hashString(eventKey);
        const colorIndex = hash % calendarState.colorPalette.length;
        const baseColor = calendarState.colorPalette[colorIndex];
        
        // Vytvoř světlejší background a tmavší border pro lepší čitelnost
        calendarState.eventColors.set(eventKey, {
            background: baseColor + '25', // 25% opacity pro background
            border: baseColor,
            textColor: '#ffffff',
            icon: getEventIcon(category)
        });
        
        console.log(`🎨 Assigned unique color ${baseColor} to event: "${eventName}"`);
    }
    
    return calendarState.eventColors.get(eventKey);
}

// ========================================
// OPRAVA: IKONY PODLE KATEGORIE (ne barvy)
// ========================================

// Funkce pro ikony podle kategorie (barvy zůstávají unikátní)
function getEventIcon(category) {
    const categoryIcons = {
        'Sportovní akce': '🏃',
        'Veletrh': '🍫',
        'Food Festival': '🍔',
        'Koncert': '🎵',
        'Kulturní akce': '🎭',
        'Ostatní': '📅'
    };
    
    return categoryIcons[category] || '🔮';
}

// ========================================
// OPRAVA: VYLEPŠENÁ PALETA BAREV
// ========================================

// Vylepšená paleta s více kontrastními barvami
function generateColorPalette() {
    console.log('🎨 Generating enhanced unique color palette...');
    
    const colors = [];
    
    // Základní sytá paleta s dobrým kontrastem
    const baseColors = [
        // Modré odstíny
        '#2196F3', '#3F51B5', '#1976D2', '#0288D1', '#0097A7',
        // Zelené odstíny  
        '#4CAF50', '#8BC34A', '#388E3C', '#689F38', '#558B2F',
        // Červené/oranžové odstíny
        '#F44336', '#FF5722', '#FF9800', '#FF6F00', '#E65100',
        // Fialové odstíny
        '#9C27B0', '#673AB7', '#8E24AA', '#7B1FA2', '#6A1B9A',
        // Růžové odstíny
        '#E91E63', '#AD1457', '#C2185B', '#880E4F',
        // Hnědé/šedé odstíny
        '#795548', '#5D4037', '#607D8B', '#455A64',
        // Tyrkysové odstíny
        '#009688', '#00695C', '#26A69A', '#00ACC1',
        // Žluté/zlaté odstíny (pro lepší kontrast s bílým textem)
        '#FFA000', '#FF8F00', '#F57C00', '#EF6C00'
    ];
    
    colors.push(...baseColors);
    
    // Přidej HSL barvy s vysokým kontrastem
    for (let hue = 0; hue < 360; hue += 15) {
        // Vysoká saturace a střední světlost pro dobrý kontrast
        colors.push(`hsl(${hue}, 80%, 50%)`);
        colors.push(`hsl(${hue}, 70%, 45%)`);
        colors.push(`hsl(${hue}, 90%, 55%)`);
    }
    
    console.log(`🎨 Generated color palette with ${colors.length} unique colors`);
    return colors;
}

// ========================================
// OPRAVA: VYLEPŠENÁ HASH FUNKCE
// ========================================

// Vylepšená hash funkce pro lepší distribuci barev
function hashString(str) {
    let hash = 0;
    let char;
    
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Převést na 32bit integer
    }
    
    // Více vrstev randomizace pro lepší distribuci
    hash = hash * 9301 + 49297;
    hash = hash % 233280;
    hash = Math.abs(hash);
    
    // Přidej další randomizaci pro lepší rozložení
    hash = (hash * 16807) % 2147483647;
    
    return hash;
}

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
                // Použij novou funkce pro kontrolu rozsahu
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
// OPRAVA: EVENT ELEMENT S UNIKÁTNÍMI BARVAMI
// ========================================

// OPRAVENÁ funkce pro vytvoření event elementu
function createEventElement(event, date) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    
    // KLÍČOVÁ OPRAVA: Používej název akce pro unikátní barvy
    const colorInfo = getEventColor(event.title, event.status, event.category);
    
    if (globalState.debugMode) {
        console.log(`🎨 Event "${event.title}" assigned color:`, colorInfo);
    }
    
    // Aplikace barev
    eventElement.style.background = colorInfo.background;
    eventElement.style.borderLeft = `4px solid ${colorInfo.border}`;
    eventElement.style.color = colorInfo.textColor;
    eventElement.style.fontWeight = '600';
    eventElement.style.fontSize = '0.75rem';
    eventElement.style.padding = '4px 6px';
    eventElement.style.marginBottom = '2px';
    eventElement.style.borderRadius = '4px';
    eventElement.style.cursor = 'pointer';
    eventElement.style.transition = 'all 0.2s ease';
    eventElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    
    // Text události s ikonou
    let eventText = event.title;
    let statusIcon = colorInfo.icon;
    
    // Speciální označení pro události s predikcí
    if (event.hasPrediction) {
        statusIcon = '🔮';
        eventElement.style.background = `linear-gradient(45deg, ${colorInfo.background}, rgba(33, 150, 243, 0.2))`;
        eventElement.classList.add('has-prediction');
    }
    
    // Zkrácení textu pro lepší zobrazení
    const maxLength = 15;
    if (eventText.length > maxLength) {
        eventText = eventText.substring(0, maxLength - 3) + '...';
    }
    
    eventElement.textContent = `${statusIcon} ${eventText}`;
    
    // Vylepšený tooltip
    const tooltipInfo = createEventTooltip(event);
    eventElement.title = tooltipInfo;
    
    // CSS třídy pro styling
    eventElement.classList.add(event.status || 'unknown');
    eventElement.classList.add(event.type || 'unknown');
    eventElement.setAttribute('data-category', event.category || 'Ostatní');
    eventElement.setAttribute('data-event-name', event.title);
    
    // Hover efekty
    setupEventHoverEffects(eventElement);
    
    // Click handler pro editaci události
    eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('📅 Event clicked:', event);
        if (typeof openEventModal === 'function') {
            openEventModal(event);
        }
    });
    
    return eventElement;
}

// ========================================
// TOOLTIP A HOVER EFEKTY
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

// Vylepšené hover efekty
function setupEventHoverEffects(eventElement) {
    eventElement.addEventListener('mouseenter', () => {
        eventElement.style.transform = 'scale(1.05) translateY(-1px)';
        eventElement.style.zIndex = '10';
        eventElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        eventElement.style.borderLeftWidth = '5px';
    });
    
    eventElement.addEventListener('mouseleave', () => {
        eventElement.style.transform = 'scale(1) translateY(0)';
        eventElement.style.zIndex = '1';
        eventElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        eventElement.style.borderLeftWidth = '4px';
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
            
            // Mapování ikon pro kategorie
            const categoryIcons = {
                'Food Festival': '🍔',
                'Veletrh': '🍫',
                'Koncert': '🎵',
                'Kulturní akce': '🎭',
                'Sportovní akce': '🏃',
                'Ostatní': '📅'
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
        
        // Zobraz počet filtrovaných událostí
        const totalEvents = getTotalFilteredEvents();
        if (typeof showNotification === 'function') {
            showNotification(`🔍 Filtry aplikovány - zobrazeno ${totalEvents} událostí`, 'info', 2000);
        }
        
    } catch (error) {
        console.error('❌ Error applying filters:', error);
        if (typeof showNotification === 'function') {
            showNotification('❌ Chyba při aplikaci filtrů', 'error');
        }
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
        
        if (typeof showNotification === 'function') {
            showNotification('🔄 Filtry kalendáře vymazány', 'info', 2000);
        }
        console.log('✅ Calendar filters cleared');
        
    } catch (error) {
        console.error('❌ Error clearing filters:', error);
        if (typeof showNotification === 'function') {
            showNotification('❌ Chyba při mazání filtrů', 'error');
        }
    }
}

// ========================================
// DEBUG FUNKCE PRO TESTOVÁNÍ
// ========================================

// Debug funkce pro testování unikátních barev
function debugUniqueColors() {
    console.group('🔍 DEBUG: Unique Colors System Test');
    
    // Test různých akcí - každá by měla mít jinou barvu
    const testEvents = [
        'Winter Run',
        'ČokoFest', 
        'Food Day Festival',
        'Street Food',
        'Burger Festival',
        'Majáles',
        'Night Run',
        'Pivní slavnosti'
    ];
    
    console.log('🎨 Testing unique colors for events:');
    testEvents.forEach(eventName => {
        const colorInfo = getEventColor(eventName, 'planned', 'Food Festival');
        console.log(`"${eventName}": ${colorInfo.border} (${colorInfo.icon})`);
    });
    
    // Test stejných akcí - měly by mít stejnou barvu
    console.log('\n🔄 Testing consistency (same event should have same color):');
    const sameEventColors = [
        getEventColor('Winter Run', 'planned', 'Sportovní akce'),
        getEventColor('Winter Run', 'planned', 'Sportovní akce'),
        getEventColor('Winter Run', 'ongoing', 'Sportovní akce')
    ];
    
    const colorsMatch = sameEventColors.every(color => 
        color.border === sameEventColors[0].border
    );
    
    console.log(`Same event consistency: ${colorsMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    console.groupEnd();
    
    return {
        paletteSize: calendarState.colorPalette?.length || 0,
        cachedColors: calendarState.eventColors?.size || 0,
        consistency: colorsMatch
    };
}

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4BColorsFixed = {
        debugUniqueColors: debugUniqueColors,
        testEventColor: (name, status, category) => getEventColor(name, status, category),
        clearColorCache: () => {
            calendarState.eventColors.clear();
            console.log('🧹 Color cache cleared');
        },
        getColorStats: () => ({
            paletteSize: calendarState.colorPalette?.length || 0,
            cachedColors: calendarState.eventColors?.size || 0,
            colors: Array.from(calendarState.eventColors.entries())
        }),
        getEventsForDate: getEventsForDate,
        populateFilterDropdowns: populateFilterDropdowns,
        filterCalendar: filterCalendar
    };
}

console.log('✅ Donuland Part 4B UNIQUE COLORS loaded successfully');
console.log('🎨 SYSTEM: Each event gets unique color by name - same event = same color across all days');
console.log('🌈 Status colors: Completed=Green ✅, Ongoing=Orange 🔥, Others=Unique colors per event 🔮');
console.log('🧪 Debug: window.donulandPart4BColorsFixed.debugUniqueColors() to test color system');
console.log('📋 This fixes the gray planned events issue - each event will have its own color!');

// Event pro signalizaci dokončení Part 4B
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4bColorsFixed', { 
        timestamp: Date.now(),
        version: '4B-COLORS-FIXED',
        fixes: ['unique-event-colors', 'multi-day-consistency', 'enhanced-palette', 'better-contrast', 'event-loading', 'filtering-system']
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
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('calendarRendered', { 
                year, 
                month, 
                totalDays: daysInMonth.length,
                eventsCount: daysInMonth.reduce((sum, d) => sum + d.events.length, 0)
            });
        }
        
    } catch (error) {
        console.error('❌ Error rendering calendar:', error);
        if (typeof showNotification === 'function') {
            showNotification('❌ Chyba při vykreslování kalendáře', 'error');
        }
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
            if (typeof openEventModal === 'function') {
                openEventModal(null, dayData.date);
            }
        }
    });
    
    return dayElement;
}

// ========================================
// VYLEPŠENÝ INDIKÁTOR DALŠÍCH UDÁLOSTÍ
// ========================================

// Vylepšený indikátor pro více událostí
function createMoreEventsIndicator(dayData) {
    const additionalEvents = dayData.events.length - 4;
    
    const moreIndicator = document.createElement('div');
    moreIndicator.className = 'event-item more-events';
    moreIndicator.textContent = `+${additionalEvents} dalších`;
    
    // Styling pro "více událostí"
    moreIndicator.style.background = 'linear-gradient(135deg, #6c757d, #495057)';
    moreIndicator.style.color = '#ffffff';
    moreIndicator.style.fontWeight = '600';
    moreIndicator.style.padding = '4px 6px';
    moreIndicator.style.borderRadius = '4px';
    moreIndicator.style.fontSize = '0.7rem';
    moreIndicator.style.cursor = 'pointer';
    moreIndicator.style.textAlign = 'center';
    moreIndicator.style.border = '2px solid #495057';
    moreIndicator.style.marginTop = '2px';
    moreIndicator.style.transition = 'all 0.2s ease';
    
    // Hover efekt
    moreIndicator.addEventListener('mouseenter', () => {
        moreIndicator.style.background = 'linear-gradient(135deg, #495057, #343a40)';
        moreIndicator.style.transform = 'scale(1.05)';
    });
    
    moreIndicator.addEventListener('mouseleave', () => {
        moreIndicator.style.background = 'linear-gradient(135deg, #6c757d, #495057)';
        moreIndicator.style.transform = 'scale(1)';
    });
    
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
                     style="border-left: 4px solid ${colorInfo.border}; background: ${colorInfo.background};"
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

// ========================================
// KALENDÁŘNÍ NAVIGACE
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
    if (typeof eventBus !== 'undefined') {
        eventBus.emit('calendarMonthChanged', { 
            month: globalState.currentMonth, 
            year: globalState.currentYear 
        });
    }
    
    console.log(`📅 Calendar changed to: ${globalState.currentMonth + 1}/${globalState.currentYear}`);
    
    // Re-render kalendář
    renderCalendar();
}

// Přechod na dnešní měsíc
function goToToday() {
    const today = new Date();
    globalState.currentMonth = today.getMonth();
    globalState.currentYear = today.getFullYear();
    
    updateCurrentMonthDisplay();
    
    if (typeof eventBus !== 'undefined') {
        eventBus.emit('calendarTodayRequested');
    }
    
    if (typeof showNotification === 'function') {
        showNotification('📅 Přešli jste na aktuální měsíc', 'info', 2000);
    }
    
    // Re-render kalendář
    renderCalendar();
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
// CSS STYLY PRO KALENDÁŘ
// ========================================

// Přidání CSS stylů pro kalendář
function addCalendarStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Calendar specific styles */
        .month-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: linear-gradient(135deg, #e3f2fd, #f0f9ff);
            border-radius: 8px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
            color: #1976d2;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.85rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .date-group {
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .date-group.today {
            box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
            border: 2px solid #ffc107;
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
        
        .events-count {
            background: rgba(255,255,255,0.2);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8rem;
        }
        
        .date-events {
            background: white;
            padding: 10px;
        }
        
        .month-event-item {
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .month-event-item:hover {
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .event-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .event-title {
            font-weight: 600;
            font-size: 0.95rem;
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
            background: #e3f2fd;
            color: #1976d2;
        }
        
        .event-details {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            font-size: 0.85rem;
            color: #666;
        }
        
        .event-details span {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        
        .no-events-message {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .no-events-icon {
            font-size: 4rem;
            margin-bottom: 15px;
            opacity: 0.7;
        }
        
        .more-events {
            background: linear-gradient(135deg, #6c757d, #495057) !important;
            border: 2px solid #495057 !important;
        }
        
        .more-events:hover {
            background: linear-gradient(135deg, #495057, #343a40) !important;
            transform: scale(1.05) !important;
        }
        
        /* Responsive kalendář */
        @media (max-width: 768px) {
            .month-stats {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .event-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
            
            .event-details {
                flex-direction: column;
                gap: 5px;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('🎨 Calendar styles added');
}

// ========================================
// INICIALIZACE KALENDÁŘE
// ========================================

// Inicializace kalendáře při načtení
function initializeCalendar() {
    console.log('📅 Initializing calendar system...');
    
    try {
        // Přidání CSS stylů
        addCalendarStyles();
        
        // Nastavení event listenerů pro filtry
        if (typeof setupFilterEventListeners === 'function') {
            setupFilterEventListeners();
        }
        
        // Inicializace color palette
        if (!calendarState.colorPalette || calendarState.colorPalette.length === 0) {
            calendarState.colorPalette = generateColorPalette();
        }
        
        // Aktualizace měsíce display
        updateCurrentMonthDisplay();
        
        console.log('✅ Calendar system initialized');
        
    } catch (error) {
        console.error('❌ Error initializing calendar:', error);
        if (typeof showNotification === 'function') {
            showNotification('❌ Chyba při inicializaci kalendáře', 'error');
        }
    }
}

// ========================================
// EVENT LISTENERS PRO KALENDÁŘ
// ========================================

// Event listeners pro kalendář
if (typeof eventBus !== 'undefined') {
    eventBus.on('dataLoaded', () => {
        console.log('📊 Data loaded - updating calendar');
        setTimeout(() => {
            populateFilterDropdowns();
            renderCalendar();
        }, 500);
    });
    
    eventBus.on('sectionChanged', (data) => {
        if (data.section === 'calendar') {
            console.log('📅 Calendar section opened');
            setTimeout(() => {
                if (!calendarState.isRendering) {
                    renderCalendar();
                }
            }, 300);
        }
    });
}

// ========================================
// EXPORT PRO GLOBÁLNÍ POUŽITÍ
// ========================================

// Export funkcí pro použití v HTML
if (typeof window !== 'undefined') {
    // Globální funkce pro HTML onclick handlers
    window.changeMonth = changeMonth;
    window.goToToday = goToToday;
    window.filterCalendar = filterCalendar;
    window.clearFilters = clearCalendarFilters;
    window.renderCalendar = renderCalendar;
    
    // Debug funkce
    window.donulandPart4CDebug = {
        renderCalendar: renderCalendar,
        getDaysInMonth: getDaysInMonth,
        getEventsForCurrentMonth: getEventsForCurrentMonth,
        updateMonthEventsList: updateMonthEventsList,
        showDayEventsPopup: showDayEventsPopup,
        initializeCalendar: initializeCalendar,
        calendarState: () => calendarState
    };
}

// ========================================
// AUTO-INICIALIZACE
// ========================================

// Automatická inicializace při načtení
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 DOM loaded - initializing calendar...');
    
    // Počkat na globalState
    setTimeout(() => {
        if (typeof globalState !== 'undefined') {
            initializeCalendar();
            
            // Pokud jsou už data načtena, vykresli kalendář
            if (globalState.historicalData && globalState.historicalData.length > 0) {
                setTimeout(() => {
                    populateFilterDropdowns();
                    renderCalendar();
                }, 1000);
            }
        }
    }, 500);
});

console.log('✅ Donuland Part 4C loaded successfully');
console.log('🎨 Features: ✅ Calendar rendering ✅ Month events list ✅ Day popup ✅ Navigation ✅ Responsive UI');
console.log('📅 Calendar grid with unique event colors, hover effects, and mobile-friendly design');
console.log('🔧 Functions: renderCalendar(), changeMonth(), goToToday(), filterCalendar()');
console.log('🧪 Debug: window.donulandPart4CDebug for testing calendar functions');

// Event pro signalizaci dokončení části 4C
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4cLoaded', { 
        timestamp: Date.now(),
        version: '4C-RENDERING',
        features: ['calendar-rendering', 'month-events-list', 'day-popup', 'navigation', 'responsive-ui', 'auto-initialization']
    });
}
/* ========================================
   DONULAND PART 4D - FINANČNÍ ANALYTICS
   Analytics s přesným výpočtem podle business modelů ze Sheets
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
    const price = parseFloat(record.price) || 50;  // fallback na 50 Kč (ze Sheets)
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
        if (typeof showNotification === 'function') {
            showNotification('❌ Chyba při zobrazení finančního přehledu', 'error');
        }
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
// CSS STYLY PRO FINANČNÍ ANALYTICS
// ========================================

// Přidání CSS stylů pro finanční analytics
function addFinancialAnalyticsStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Financial Analytics Styles */
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
        
        .stat-item.positive .stat-value {
            color: #28a745;
        }
        
        .stat-item.negative .stat-value {
            color: #dc3545;
        }
        
        .financial-item {
            border-left: 4px solid #667eea;
        }
        
        .financial-stats {
            text-align: right;
        }
        
        .top-value.positive {
            color: #28a745;
        }
        
        .top-value.negative {
            color: #dc3545;
        }
        
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
        
        /* Responsive design */
        @media (max-width: 768px) {
            .financial-stats-grid {
                grid-template-columns: 1fr;
            }
            
            .model-stats {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('🎨 Financial analytics styles added');
}

// ========================================
// EVENT LISTENERS PRO ANALYTICS
// ========================================

// Event listeners pro finanční přehled
if (typeof eventBus !== 'undefined') {
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
}

// ========================================
// INICIALIZACE
// ========================================

// Inicializace finančních analytics
function initializeFinancialAnalytics() {
    console.log('💰 Initializing financial analytics...');
    
    try {
        // Přidání CSS stylů
        addFinancialAnalyticsStyles();
        
        // Pokud jsou data už načtena, zobraz přehled
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            setTimeout(() => {
                displayFinancialOverview();
            }, 500);
        }
        
        console.log('✅ Financial analytics initialized');
        
    } catch (error) {
        console.error('❌ Error initializing financial analytics:', error);
    }
}

// Auto-inicializace při načtení
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof globalState !== 'undefined') {
            initializeFinancialAnalytics();
        }
    }, 1000);
});

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandPart4DDebug = {
        calculateFinancials: calculateFinancials,
        calculateOverallFinancials: calculateOverallFinancials,
        getTopPerformingEvents: getTopPerformingEvents,
        getBusinessModelStats: getBusinessModelStats,
        displayFinancialOverview: displayFinancialOverview,
        parseRentValue: parseRentValue
    };
}

console.log('✅ Donuland Part 4D loaded successfully');
console.log('💰 Features: ✅ Business model calculations ✅ Financial overview ✅ Top events by profit ✅ Model breakdown');
console.log('🔧 Business models: franšízant (no labor), zaměstnanec (+5% revenue), majitel (standard)');
console.log('📊 Analytics: Revenue, costs, profit, margin with real Sheets data');
console.log('🧪 Debug: window.donulandPart4DDebug for testing financial calculations');

// Event pro signalizaci dokončení části 4D
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4dLoaded', { 
        timestamp: Date.now(),
        version: '4D-FINANCIAL',
        features: ['business-model-calculations', 'financial-overview', 'top-events-profit', 'model-breakdown', 'rent-parsing']
    });
}
