/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 4A
   Barevný systém a základní kalendářní funkcionalita
   ======================================== */

console.log('🍩 Donuland Part 4A (Colors) loading...');

// ========================================
// KALENDÁŘ GLOBÁLNÍ STAV
// ========================================

const calendarState = {
    currentEvents: [],
    filteredEvents: [],
    eventColors: new Map(), // Mapování názvu akce na barvu
    colorPalette: [], // Vygenerované barvy
    filters: {
        city: '',
        category: '',
        status: ''
    },
    isRendering: false
};

// ========================================
// BAREVNÝ SYSTÉM
// ========================================

// Generování neomezené palety barev
function generateColorPalette() {
    const colors = [];
    
    // Základní sytá paleta pro nejčastější akce
    const baseColors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', 
        '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#8bc34a',
        '#ff5722', '#607d8b', '#795548', '#009688', '#673ab7',
        '#ff9800', '#4caf50', '#2196f3', '#ffeb3b', '#9c27b0',
        '#00bcd4', '#ff6f00', '#d32f2f', '#388e3c', '#1976d2'
    ];
    
    // Přidej základní barvy
    colors.push(...baseColors);
    
    // Generuj další barvy pomocí HSL pro neomezenou škálu
    for (let hue = 0; hue < 360; hue += 15) {
        colors.push(`hsl(${hue}, 75%, 55%)`); // Sytá verze
        colors.push(`hsl(${hue}, 60%, 45%)`); // Tmavší verze
        colors.push(`hsl(${hue}, 85%, 65%)`); // Světlejší verze
    }
    
    console.log(`🎨 Generated color palette with ${colors.length} colors`);
    return colors;
}

// Hash funkce pro konzistentní přiřazení barev
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Převést na 32bit integer
    }
    return Math.abs(hash);
}

// Hlavní funkce pro získání barvy akce
function getEventColor(eventName, date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    
    // DOKONČENÉ AKCE - jednotná žlutá barva
    if (eventDate < today) {
        return {
            background: '#fff3cd',
            border: '#ffc107',
            textColor: '#856404',
            icon: '✅'
        };
    }
    
    // PLÁNOVANÉ AKCE - unikátní barvy podle názvu
    const eventKey = eventName.toLowerCase().trim();
    
    if (!calendarState.eventColors.has(eventKey)) {
        // Inicializace palety pokud není
        if (calendarState.colorPalette.length === 0) {
            calendarState.colorPalette = generateColorPalette();
        }
        
        // Přiřaď barvu založenou na hash funkci
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

// ========================================
// UPRAVENÉ KALENDÁŘNÍ FUNKCE
// ========================================

// Hlavní funkce pro vykreslení kalendáře - UPDATED
function renderCalendar() {
    if (calendarState.isRendering) {
        console.log('⚠️ Calendar already rendering, skipping...');
        return;
    }
    
    console.log('📅 Rendering calendar with NEW COLOR SYSTEM...');
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
        
        // Získání dnů v měsíci
        const year = globalState.currentYear;
        const month = globalState.currentMonth;
        const daysInMonth = getDaysInMonth(year, month);
        
        // Přidání dnů s novým barevným systémem
        daysInMonth.forEach(dayData => {
            const dayElement = createCalendarDay(dayData);
            calendarGrid.appendChild(dayElement);
        });
        
        console.log(`✅ Calendar rendered with color system for ${month + 1}/${year}`);
        
    } catch (error) {
        console.error('❌ Error rendering calendar:', error);
        showNotification('❌ Chyba při vykreslování kalendáře', 'error');
    } finally {
        calendarState.isRendering = false;
    }
}

// Získání dnů v měsíci s událostmi
function getDaysInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysFromPrevMonth = (firstDay.getDay() + 6) % 7; // Pondělí = 0
    
    const days = [];
    
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
    
    // Dny z následujícího měsíce (do úplných 42 dnů)
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
    
    return days;
}

// ========================================
// CSS STYLY PRO NOVÉ BARVY
// ========================================

// Přidání CSS stylů pro pokročilé barvy
function addColorSystemStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Pokročilé barvy pro události */
        .event-item.has-prediction {
            position: relative;
            background: linear-gradient(45deg, var(--primary-color), var(--info-color)) !important;
            animation: predictionGlow 2s ease-in-out infinite alternate;
            font-weight: 700 !important;
        }
        
        @keyframes predictionGlow {
            0% { box-shadow: 0 0 5px rgba(23, 162, 184, 0.5); }
            100% { box-shadow: 0 0 15px rgba(23, 162, 184, 0.8); }
        }
        
        .event-item.completed {
            opacity: 0.85;
            font-style: italic;
            border-style: solid;
        }
        
        .event-item.planned {
            font-weight: 700;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Vylepšení calendar day */
        .calendar-day.has-events {
            border-left: 4px solid var(--primary-color);
            position: relative;
        }
        
        .calendar-day.has-events::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 8px;
            height: 8px;
            background: var(--primary-color);
            border-radius: 50%;
            margin: 2px;
        }
        
        /* Event items s lepším spacingem */
        .day-events .event-item {
            margin-bottom: 2px;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.75rem;
            line-height: 1.2;
            cursor: pointer;
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
        }
        
        .day-events .event-item:hover {
            transform: scale(1.05);
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        /* Color preview debug */
        .color-debug {
            position: fixed;
            top: 100px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            max-width: 200px;
        }
        
        .color-sample {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin: 2px;
            border-radius: 3px;
            border: 1px solid #ccc;
            cursor: pointer;
        }
    `;
    
    document.head.appendChild(style);
    console.log('🎨 Color system styles added');
}

// ========================================
// DEBUG FUNKCE
// ========================================

// Debug funkce pro testování barev
function debugColorSystem() {
    const debugDiv = document.createElement('div');
    debugDiv.className = 'color-debug';
    debugDiv.innerHTML = `
        <div><strong>🎨 Color System Debug</strong></div>
        <div>Cached colors: ${calendarState.eventColors.size}</div>
        <div>Palette size: ${calendarState.colorPalette.length}</div>
        <div style="margin-top: 10px;">
            <strong>Sample colors:</strong><br>
            ${calendarState.colorPalette.slice(0, 10).map((color, i) => 
                `<span class="color-sample" style="background: ${color};" title="${color}"></span>`
            ).join('')}
        </div>
        <div style="margin-top: 10px;">
            <button onclick="this.parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer;">Close</button>
        </div>
    `;
    
    // Odstraň předchozí debug
    const existing = document.querySelector('.color-debug');
    if (existing) existing.remove();
    
    document.body.appendChild(debugDiv);
    
    console.log('🎨 Color debug panel shown');
}

// ========================================
// GLOBÁLNÍ FUNKCE PRO DEBUG
// ========================================

if (typeof window !== 'undefined') {
    window.donulandColors = {
        getState: () => calendarState,
        getColors: () => calendarState.eventColors,
        testColor: (name, date) => getEventColor(name, date || new Date()),
        showDebug: debugColorSystem,
        clearColors: () => {
            calendarState.eventColors.clear();
            console.log('🧹 Colors cleared');
        },
        generateSample: () => {
            const samples = ['Burger Fest', 'ČokoFest', 'Food Festival', 'Vintage Run'];
            samples.forEach(name => {
                const color = getEventColor(name, new Date());
                console.log(`${name}: ${color.background}`);
            });
        }
    };
}

// ========================================
// INICIALIZACE
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Initializing Part 4A (Colors)...');
    
    // Přidání stylů
    addColorSystemStyles();
    
    console.log('✅ Part 4A (Colors) initialized');
});

console.log('✅ Donuland Part 4A (Colors) loaded successfully');
console.log('🎨 Features: ✅ Color Palette ✅ Hash-based Assignment ✅ Completed/Planned Distinction');
console.log('🔧 Debug: window.donulandColors available');
console.log('⏳ Ready for Part 4B: Event Processing & Deduplication');

// Event pro signalizaci dokončení části 4A
eventBus.emit('part4aLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['color-system', 'hash-assignment', 'completed-planned-colors', 'debug-tools']
});
/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 4B
   Event Processing & Deduplication
   ======================================== */

console.log('🍩 Donuland Part 4B (Events) loading...');

// ========================================
// EVENT PROCESSING & DEDUPLICATION
// ========================================

// Získání událostí pro konkrétní datum s pokročilou deduplicí
function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const eventMap = new Map(); // Pro detekci duplicit
    
    try {
        // 1. HISTORICKÉ AKCE z globálních dat (ze Sheets)
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            globalState.historicalData.forEach(record => {
                if (isDateInRange(dateStr, record.dateFrom, record.dateTo)) {
                    const eventKey = createEventKey(record.eventName, record.city, record.dateFrom);
                    
                    const event = {
                        id: `historical-${record.rowIndex}`,
                        type: 'historical',
                        status: 'completed',
                        title: record.eventName,
                        city: record.city,
                        category: record.category,
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
                }
            });
        }
        
        // 2. ULOŽENÉ PREDIKCE z localStorage
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData && isDateInRange(dateStr, prediction.formData.eventDateFrom, prediction.formData.eventDateTo)) {
                const eventKey = createEventKey(
                    prediction.formData.eventName, 
                    prediction.formData.city, 
                    prediction.formData.eventDateFrom
                );
                
                // KONTROLA DUPLICIT: Zkontroluj, zda už existuje historická akce se stejným klíčem
                if (eventMap.has(eventKey)) {
                    // SLOUČENÍ: Přidej predikci k existující historické akci
                    const existingEvent = eventMap.get(eventKey);
                    existingEvent.hasPrediction = true;
                    existingEvent.predictionData = prediction;
                    existingEvent.predictedSales = prediction.prediction?.predictedSales;
                    existingEvent.confidence = prediction.prediction?.confidence;
                    console.log(`🔗 Merged prediction with historical event: ${existingEvent.title}`);
                } else {
                    // NOVÁ PREDIKCE: Vytvoř novou predikční akci
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const eventDate = new Date(prediction.formData.eventDateFrom);
                    eventDate.setHours(0, 0, 0, 0);
                    
                    const status = prediction.actualSales && prediction.actualSales > 0 ? 'completed' : 
                                  eventDate < today ? 'completed' : 'planned';
                    
                    const event = {
                        id: `prediction-${prediction.id}`,
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
        
        // 3. MANUÁLNĚ PŘIDANÉ UDÁLOSTI
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            if (isDateInRange(dateStr, event.dateFrom, event.dateTo)) {
                const eventKey = createEventKey(event.eventName, event.city, event.dateFrom);
                
                if (!eventMap.has(eventKey)) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const eventDate = new Date(event.dateFrom);
                    eventDate.setHours(0, 0, 0, 0);
                    
                    const status = eventDate < today ? 'completed' : 'planned';
                    
                    const newEvent = {
                        id: `manual-${event.id}`,
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
        console.warn('⚠️ Error getting events for date:', dateStr, error);
    }
    
    // APLIKACE FILTRŮ
    const filteredEvents = Array.from(eventMap.values()).filter(event => {
        // Filtr města
        if (calendarState.filters.city && event.city !== calendarState.filters.city) return false;
        
        // Filtr kategorie
        if (calendarState.filters.category && event.category !== calendarState.filters.category) return false;
        
        // Filtr statusu
        if (calendarState.filters.status) {
            if (calendarState.filters.status === 'planned' && event.status !== 'planned') return false;
            if (calendarState.filters.status === 'completed' && event.status !== 'completed') return false;
        }
        
        return true;
    });
    
    return filteredEvents;
}

// ========================================
// HELPER FUNKCE PRO EVENT PROCESSING
// ========================================

// Vytvoření konzistentního klíče pro událost (pro detekci duplicit)
function createEventKey(eventName, city, dateFrom) {
    return `${eventName}-${city}-${dateFrom}`.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

// Kontrola, zda datum spadá do rozsahu události
function isDateInRange(checkDate, fromDate, toDate) {
    if (!fromDate || !toDate) return false;
    
    try {
        const check = new Date(checkDate + 'T00:00:00');
        const from = new Date(fromDate + 'T00:00:00');
        const to = new Date(toDate + 'T00:00:00');
        
        // Kontrola validity dat
        if (isNaN(check.getTime()) || isNaN(from.getTime()) || isNaN(to.getTime())) {
            return false;
        }
        
        // Datum musí být mezi from a to (včetně)
        return check >= from && check <= to;
    } catch (error) {
        console.warn('⚠️ Date parsing error:', { checkDate, fromDate, toDate });
        return false;
    }
}

// ========================================
// VYLEPŠENÉ VYTVOŘENÍ KALENDÁŘNÍHO DNE
// ========================================

// Vytvoření prvku kalendářního dne s pokročilým barevným schématem
function createCalendarDay(dayData) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (!dayData.isCurrentMonth) {
        dayElement.classList.add('other-month');
    }
    
    // Kontrola, zda je to dnes
    const today = new Date();
    if (dayData.date.toDateString() === today.toDateString()) {
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
    
    // Seznam událostí s pokročilým barevným rozlišením
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    dayData.events.slice(0, 3).forEach(event => { // Max 3 události viditelné
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        
        // ZÍSKÁNÍ BARVY PRO UDÁLOST
        const colorInfo = getEventColor(event.title, dayData.date);
        
        // APLIKACE BAREV A STYLŮ
        eventElement.style.background = colorInfo.background;
        eventElement.style.borderLeft = `3px solid ${colorInfo.border}`;
        eventElement.style.color = colorInfo.textColor;
        eventElement.style.fontWeight = '600';
        eventElement.style.fontSize = '0.75rem';
        
        // Text události s ikonami
        let eventText = event.title;
        
        // SPECIÁLNÍ OZNAČENÍ PRO AKCE S PREDIKCÍ
        if (event.hasPrediction) {
            eventText = '🔮📊 ' + eventText;
            // Gradient pro akce s predikcí
            eventElement.style.background = `linear-gradient(45deg, ${colorInfo.background}, #17a2b8)`;
            eventElement.classList.add('has-prediction');
        } else if (event.status === 'completed') {
            eventText = colorInfo.icon + ' ' + eventText;
        } else {
            eventText = colorInfo.icon + ' ' + eventText;
        }
        
        eventElement.textContent = eventText;
        
        // Detailní tooltip s informacemi
        const tooltipInfo = [
            `${event.title}`,
            `📍 ${event.city}`,
            `📊 ${event.category}`,
            event.sales ? `🍩 ${formatNumber(event.sales)} ks` : '',
            event.predictedSales ? `🔮 Predikce: ${formatNumber(event.predictedSales)} ks` : '',
            event.confidence ? `🎯 Confidence: ${event.confidence}%` : '',
            `📅 ${formatDate(event.dateFrom)} - ${formatDate(event.dateTo)}`,
            `📋 ${event.status === 'completed' ? 'Dokončeno' : 'Plánováno'}`,
            event.source ? `📂 Zdroj: ${event.source}` : ''
        ].filter(Boolean).join('\n');
        
        eventElement.title = tooltipInfo;
        
        // CSS třídy pro různé typy a stavy
        if (event.status === 'completed') {
            eventElement.classList.add('completed');
        } else {
            eventElement.classList.add('planned');
        }
        
        // Označení podle typu zdroje
        eventElement.classList.add(event.type || 'unknown');
        
        // Click handler pro editaci události
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            openEventModal(event);
        });
        
        eventsContainer.appendChild(eventElement);
    });
    
    // Indikátor dalších událostí
    if (dayData.events.length > 3) {
        const moreIndicator = document.createElement('div');
        moreIndicator.className = 'event-item more';
        moreIndicator.textContent = `+${dayData.events.length - 3} dalších`;
        moreIndicator.style.background = '#6c757d';
        moreIndicator.style.color = '#ffffff';
        moreIndicator.style.fontWeight = '600';
        moreIndicator.addEventListener('click', (e) => {
            e.stopPropagation();
            showDayEventsPopup(dayData.date, dayData.events);
        });
        eventsContainer.appendChild(moreIndicator);
    }
    
    dayElement.appendChild(eventsContainer);
    
    // Click handler pro přidání nové události
    dayElement.addEventListener('click', () => {
        if (dayData.isCurrentMonth) {
            openEventModal(null, dayData.date);
        }
    });
    
    return dayElement;
}

// ========================================
// POPUP PRO ZOBRAZENÍ VŠECH UDÁLOSTÍ DNE
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
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        max-width: 500px;
        max-height: 600px;
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #667eea;">📅 ${dateStr}</h3>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
    `;
    
    events.forEach(event => {
        const colorInfo = getEventColor(event.title, date);
        
        // Typ a label události
        let typeIcon = colorInfo.icon;
        let typeLabel = event.status === 'completed' ? 'Dokončeno' : 'Plánováno';
        
        if (event.type === 'historical') {
            typeLabel = 'Historická (ze Sheets)';
        } else if (event.type === 'prediction') {
            typeLabel = event.status === 'completed' ? 'Predikce (dokončeno)' : 'Predikce (plánováno)';
        } else if (event.type === 'manual') {
            typeLabel = event.status === 'completed' ? 'Manuální (dokončeno)' : 'Manuální (plánováno)';
        }
        
        const sales = event.sales || event.actualSales || event.predictedSales || 0;
        const salesText = event.type === 'prediction' && !event.actualSales ? 
            `🔮 ${formatNumber(event.predictedSales)} ks (predikce)` : 
            `🍩 ${formatNumber(sales)} ks`;
        
        // Speciální badges
        const predictionBadge = event.hasPrediction ? 
            '<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">🔮 + Predikce</span>' : '';
        
        const confidenceBadge = event.confidence ? 
            `<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">🎯 ${event.confidence}%</span>` : '';
        
        html += `
            <div style="background: ${colorInfo.background}; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid ${colorInfo.border}; color: ${colorInfo.textColor};">
                <h4 style="margin: 0 0 8px; color: ${colorInfo.textColor};">${escapeHtml(event.title)}${predictionBadge}${confidenceBadge}</h4>
                <p style="margin: 0 0 5px; font-size: 0.9em; opacity: 0.9;">
                    ${typeIcon} ${typeLabel} • ${escapeHtml(event.city)} • ${escapeHtml(event.category)}
                </p>
                <div style="font-size: 0.8em; opacity: 0.8;">
                    ${salesText} • 👥 ${formatNumber(event.visitors)} návštěvníků
                </div>
                <button onclick="openEventModalFromPopup('${event.type}', '${event.id}'); this.closest('.day-events-popup').remove();" 
                        style="margin-top: 8px; padding: 4px 8px; background: rgba(255,255,255,0.2); color: ${colorInfo.textColor}; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                    ✏️ Detail
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    popup.innerHTML = html;
    
    // Backdrop pro zavření
    const backdrop = document.createElement('div');
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
// CSS ROZŠÍŘENÍ PRO PART 4B
// ========================================

// Přidání CSS stylů pro popup a animace
function addEventProcessingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Day events popup animace */
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
        
        /* Event source indicators */
        .event-item.historical {
            border-left-width: 4px;
        }
        
        .event-item.prediction {
            border-left-style: dashed;
            border-left-width: 3px;
        }
        
        .event-item.manual {
            border-left-style: dotted;
            border-left-width: 3px;
        }
        
        /* Enhanced tooltips */
        .event-item[title]:hover::after {
            content: attr(title);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            white-space: pre-line;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            pointer-events: none;
        }
        
        /* Mobile responsive popup */
        @media (max-width: 768px) {
            .day-events-popup {
                width: 95% !important;
                max-height: 80vh !important;
                left: 2.5% !important;
                right: 2.5% !important;
                transform: translateY(-50%) !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('📋 Event processing styles added');
}

// ========================================
// INICIALIZACE PART 4B
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Initializing Part 4B (Events)...');
    
    // Přidání stylů
    addEventProcessingStyles();
    
    console.log('✅ Part 4B (Events) initialized');
});

console.log('✅ Donuland Part 4B (Events) loaded successfully');
console.log('📋 Features: ✅ Event Deduplication ✅ Source Merging ✅ Enhanced UI ✅ Detailed Popups');
console.log('🔗 Integration: Predikce + Historická data + Manuální události');
console.log('⏳ Ready for Part 4C: Calendar Filters & Month View');

// Event pro signalizaci dokončení části 4B
eventBus.emit('part4bLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['event-deduplication', 'source-merging', 'enhanced-ui', 'detailed-popups']
});
/* ========================================
  PART 4C: FILTRY A MĚSÍČNÍ PŘEHLED
  Pokročilé filtrace a seznam akcí pro měsíc
  ======================================== */

// Aktualizace kalendářních filtrů s pokročilými možnostmi
function updateCalendarFilters() {
   const cityFilter = document.getElementById('cityFilter');
   const categoryFilter = document.getElementById('categoryFilter');
   
   if (!cityFilter || !categoryFilter) {
       console.log('⚠️ Calendar filters not found in DOM');
       return;
   }
   
   try {
       // Získání unikátních měst a kategorií ze všech zdrojů
       const cities = new Set();
       const categories = new Set();
       
       // Z historických dat
       if (globalState.historicalData && globalState.historicalData.length > 0) {
           globalState.historicalData.forEach(record => {
               if (record.city) cities.add(record.city.trim());
               if (record.category) categories.add(record.category);
           });
       }
       
       // Z uložených predikcí
       try {
           const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
           savedPredictions.forEach(prediction => {
               if (prediction.formData) {
                   if (prediction.formData.city) cities.add(prediction.formData.city.trim());
                   if (prediction.formData.category) categories.add(prediction.formData.category);
               }
           });
       } catch (error) {
           console.warn('⚠️ Error reading predictions for filters:', error);
       }
       
       // Z manuálních událostí
       try {
           const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
           manualEvents.forEach(event => {
               if (event.city) cities.add(event.city.trim());
               if (event.category) categories.add(event.category);
           });
       } catch (error) {
           console.warn('⚠️ Error reading manual events for filters:', error);
       }
       
       // Aktualizace city filtru s zachováním current hodnoty
       const currentCityValue = cityFilter.value;
       cityFilter.innerHTML = '<option value="">🏙️ Všechna města</option>';
       
       Array.from(cities).sort((a, b) => a.localeCompare(b, 'cs')).forEach(city => {
           const option = document.createElement('option');
           option.value = city;
           option.textContent = city;
           if (city === currentCityValue) option.selected = true;
           cityFilter.appendChild(option);
       });
       
       // Aktualizace category filtru s zachováním current hodnoty
       const currentCategoryValue = categoryFilter.value;
       categoryFilter.innerHTML = '<option value="">📋 Všechny kategorie</option>';
       
       // Definované kategorie v preferovaném pořadí
       const orderedCategories = [
           'food festival', 'veletrh', 'koncert', 'kulturní akce', 'sportovní', 'ostatní'
       ];
       
       const categoryLabels = {
           'food festival': '🍔 Food festival',
           'veletrh': '🏢 Veletrh/ČokoFest',
           'koncert': '🎵 Koncert',
           'kulturní akce': '🎭 Kulturní akce',
           'sportovní': '⚽ Sportovní akce',
           'ostatní': '📋 Ostatní'
       };
       
       // Přidej kategorie v preferovaném pořadí
       orderedCategories.forEach(category => {
           if (categories.has(category)) {
               const option = document.createElement('option');
               option.value = category;
               option.textContent = categoryLabels[category] || category;
               if (category === currentCategoryValue) option.selected = true;
               categoryFilter.appendChild(option);
           }
       });
       
       // Přidej ostatní kategorie, které nejsou v ordered
       Array.from(categories).sort().forEach(category => {
           if (!orderedCategories.includes(category)) {
               const option = document.createElement('option');
               option.value = category;
               option.textContent = `📂 ${category}`;
               if (category === currentCategoryValue) option.selected = true;
               categoryFilter.appendChild(option);
           }
       });
       
       console.log(`🔄 Calendar filters updated: ${cities.size} cities, ${categories.size} categories`);
       
   } catch (error) {
       console.error('❌ Error updating calendar filters:', error);
       showNotification('Chyba při aktualizaci filtrů kalendáře', 'error');
   }
}

// Aplicace filtrů na kalendář
function filterCalendar() {
   const cityFilter = document.getElementById('cityFilter');
   const categoryFilter = document.getElementById('categoryFilter');
   const statusFilter = document.getElementById('statusFilter');
   
   if (!cityFilter || !categoryFilter || !statusFilter) {
       console.log('⚠️ Some calendar filters missing');
       return;
   }
   
   // Aktualizace filter stavu
   calendarState.filters = {
       city: cityFilter.value,
       category: categoryFilter.value,
       status: statusFilter.value
   };
   
   console.log('🔍 Filtering calendar:', calendarState.filters);
   
   // Zobrazení loading stavu
   const calendarGrid = document.getElementById('calendarGrid');
   if (calendarGrid) {
       calendarGrid.style.opacity = '0.5';
       calendarGrid.style.pointerEvents = 'none';
   }
   
   // Re-render kalendáře s aplikovanými filtry (s malým delay pro UX)
   setTimeout(() => {
       renderCalendar();
       
       // Obnovení vzhledu
       if (calendarGrid) {
           calendarGrid.style.opacity = '1';
           calendarGrid.style.pointerEvents = 'auto';
       }
       
       // Update counters v UI
       updateFilterCounters();
       
   }, 150);
}

// Počítadla filtrovaných výsledků
function updateFilterCounters() {
   try {
       const year = globalState.currentYear;
       const month = globalState.currentMonth;
       
       // Spočítej celkový počet událostí v měsíci
       let totalEvents = 0;
       let filteredEvents = 0;
       
       const daysInMonth = new Date(year, month + 1, 0).getDate();
       for (let day = 1; day <= daysInMonth; day++) {
           const date = new Date(year, month, day);
           
           // Všechny události (bez filtrů)
           const tempFilters = calendarState.filters;
           calendarState.filters = { city: '', category: '', status: '' };
           const allEvents = getEventsForDate(date);
           totalEvents += allEvents.length;
           
           // Filtrované události
           calendarState.filters = tempFilters;
           const filtered = getEventsForDate(date);
           filteredEvents += filtered.length;
       }
       
       // Aktualizace UI indikátorů
       const statusFilter = document.getElementById('statusFilter');
       if (statusFilter && filteredEvents !== totalEvents) {
           statusFilter.style.borderColor = '#ffc107';
           statusFilter.style.fontWeight = '600';
           
           // Tooltip s počtem
           statusFilter.title = `Zobrazeno: ${filteredEvents} z ${totalEvents} akcí`;
       } else if (statusFilter) {
           statusFilter.style.borderColor = '#ced4da';
           statusFilter.style.fontWeight = '400';
           statusFilter.title = '';
       }
       
       console.log(`📊 Filter counters: ${filteredEvents}/${totalEvents} events`);
       
   } catch (error) {
       console.warn('⚠️ Error updating filter counters:', error);
   }
}

// Vymazání všech filtrů
function clearFilters() {
   const cityFilter = document.getElementById('cityFilter');
   const categoryFilter = document.getElementById('categoryFilter');
   const statusFilter = document.getElementById('statusFilter');
   
   if (cityFilter) cityFilter.value = '';
   if (categoryFilter) categoryFilter.value = '';
   if (statusFilter) statusFilter.value = '';
   
   calendarState.filters = { city: '', category: '', status: '' };
   
   renderCalendar();
   showNotification('🔄 Filtry kalendáře vymazány', 'info', 2000);
}

// Aktualizace seznamu akcí pro aktuální měsíc
function updateMonthEventsList() {
   const monthEventsDiv = document.getElementById('monthEvents');
   if (!monthEventsDiv) {
       console.log('⚠️ Month events div not found');
       return;
   }
   
   try {
       const year = globalState.currentYear;
       const month = globalState.currentMonth;
       
       // Získání všech akcí v měsíci s respektováním filtrů
       const monthEvents = [];
       const eventKeys = new Set(); // Prevence duplicit
       
       // Procházej každý den v měsíci
       const daysInMonth = new Date(year, month + 1, 0).getDate();
       for (let day = 1; day <= daysInMonth; day++) {
           const date = new Date(year, month, day);
           const dayEvents = getEventsForDate(date);
           
           dayEvents.forEach(event => {
               // Přidej pouze pokud ještě není v seznamu (prevence duplicit)
               if (!eventKeys.has(event.eventKey)) {
                   eventKeys.add(event.eventKey);
                   monthEvents.push({
                       ...event,
                       date: date,
                       dateStr: date.toLocaleDateString('cs-CZ')
                   });
               }
           });
       }
       
       // Řazení podle data, pak podle názvu
       monthEvents.sort((a, b) => {
           const dateCompare = a.date - b.date;
           if (dateCompare !== 0) return dateCompare;
           return a.title.localeCompare(b.title, 'cs');
       });
       
       // Zobrazení seznamu
       if (monthEvents.length === 0) {
           monthEventsDiv.innerHTML = `
               <div class="events-placeholder">
                   <div style="text-align: center; padding: 40px 20px;">
                       <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.7;">📅</div>
                       <h4 style="margin-bottom: 10px; color: #666;">Žádné akce v tomto měsíci</h4>
                       <p style="color: #999; margin-bottom: 20px;">
                           ${calendarState.filters.city || calendarState.filters.category || calendarState.filters.status ? 
                             'Zkuste změnit filtry nebo' : ''} 
                           Přidejte novou akci kliknutím na den v kalendáři
                       </p>
                       ${calendarState.filters.city || calendarState.filters.category || calendarState.filters.status ? 
                         '<button class="btn" onclick="clearFilters()" style="margin-right: 10px;">🔄 Vymazat filtry</button>' : ''}
                       <button class="btn" onclick="openEventModal(null, new Date(${year}, ${month}, 1))">
                           ➕ Přidat akci
                       </button>
                   </div>
               </div>
           `;
           return;
       }
       
       // Generování HTML pro seznam
       let html = `
           <div class="month-events-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
               <div>
                   <h4 style="margin: 0; color: #667eea;">📋 ${monthEvents.length} akcí</h4>
                   <small style="color: #666;">
                       ${calendarState.filters.city || calendarState.filters.category || calendarState.filters.status ? 
                         '(filtrováno)' : `v ${new Date(year, month).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' })}`}
                   </small>
               </div>
               <div>
                   ${calendarState.filters.city || calendarState.filters.category || calendarState.filters.status ? 
                     '<button class="btn btn-small" onclick="clearFilters()">🔄 Vymazat filtry</button>' : ''}
                   <button class="btn btn-small" onclick="openEventModal(null, new Date(${year}, ${month}, 1))">➕ Přidat</button>
               </div>
           </div>
           <div class="month-events-list">
       `;
       
       monthEvents.forEach((event, index) => {
           const colorInfo = getEventColor(event.title, event.date);
           
           // Status indikátor a ikony
           const statusIcon = event.status === 'completed' ? '✅' : '🔮';
           const statusClass = event.status === 'completed' ? 'completed' : 'planned';
           const statusText = event.status === 'completed' ? 'Dokončeno' : 'Plánováno';
           
           // Duration info pro vícedenní akce
           let durationInfo = '';
           if (event.dateFrom !== event.dateTo) {
               const fromDate = new Date(event.dateFrom);
               const toDate = new Date(event.dateTo);
               const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
               durationInfo = ` <span style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 10px; font-size: 0.7em;">${daysDiff} dnů</span>`;
           }
           
           // Predikční informace
           const predictionBadge = event.hasPrediction ? 
               '<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">🔮 + Predikce</span>' : '';
           
           // Confidence badge
           const confidenceBadge = event.confidence ? 
               `<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">🎯 ${event.confidence}%</span>` : '';
           
           // Accuracy pro dokončené predikce
           let accuracyInfo = '';
           if (event.type === 'prediction' && event.status === 'completed' && event.actualSales > 0 && event.predictedSales > 0) {
               const accuracy = Math.abs(1 - Math.abs(event.predictedSales - event.actualSales) / event.actualSales) * 100;
               const accuracyColor = accuracy > 80 ? '#28a745' : accuracy > 60 ? '#ffc107' : '#dc3545';
               accuracyInfo = `<div style="color: ${accuracyColor}; font-weight: 600; font-size: 0.8em; margin-top: 5px;">📊 Přesnost predikce: ${accuracy.toFixed(0)}%</div>`;
           }
           
           const sales = event.sales || event.actualSales || event.predictedSales || 0;
           const salesType = event.type === 'prediction' && !event.actualSales ? 'predikce' : 'prodej';
           
           // Source označení
           const sourceLabels = {
               'sheets': '📊 Ze Sheets',
               'prediction': '🔮 Predikce',
               'manual': '✏️ Ruční'
           };
           const sourceLabel = sourceLabels[event.source] || '📂 Neznámý';
           
           html += `
               <div class="month-event-item ${event.type} ${statusClass}" 
                    style="border-left: 4px solid ${colorInfo.border}; background: ${colorInfo.background}; color: ${colorInfo.textColor}; 
                           display: flex; align-items: center; gap: 15px; padding: 15px; margin-bottom: 10px; border-radius: 8px; 
                           transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden;"
                    onclick="openEventModalFromList('${event.type}', '${event.data.id || event.data.rowIndex}')"
                    onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)'"
                    onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
                   
                   <div class="event-date" style="text-align: center; min-width: 60px; flex-shrink: 0;">
                       <div style="font-size: 1.5em; font-weight: bold; line-height: 1;">${event.date.getDate()}</div>
                       <div style="font-size: 0.7em; opacity: 0.8; text-transform: uppercase;">${event.date.toLocaleDateString('cs-CZ', { month: 'short' })}</div>
                       <div style="font-size: 1.2em; margin-top: 2px;">${statusIcon}</div>
                   </div>
                   
                   <div class="event-details" style="flex: 1; min-width: 0;">
                       <h4 style="margin: 0 0 5px; font-size: 1.1em; display: flex; align-items: center; flex-wrap: wrap; gap: 5px;">
                           ${colorInfo.icon} ${escapeHtml(event.title)}${durationInfo}${predictionBadge}${confidenceBadge}
                       </h4>
                       
                       <div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.85em; margin-bottom: 8px; opacity: 0.9;">
                           <span>📍 ${escapeHtml(event.city)}</span>
                           <span>📋 ${escapeHtml(event.category)}</span>
                           <span>${sourceLabel}</span>
                           <span>📊 ${statusText}</span>
                       </div>
                       
                       <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.8em;">
                           <span><strong>🍩 ${formatNumber(sales)} ks</strong> ${salesType}</span>
                           <span>👥 ${formatNumber(event.visitors)} návštěvníků</span>
                           ${event.rating ? `<span>⭐ ${event.rating}/5</span>` : ''}
                       </div>
                       
                       <div style="font-size: 0.75em; margin-top: 5px; opacity: 0.8;">
                           📅 ${formatDate(event.dateFrom)}${event.dateFrom !== event.dateTo ? ` - ${formatDate(event.dateTo)}` : ''}
                       </div>
                       
                       ${accuracyInfo}
                   </div>
                   
                   <div class="event-actions" style="display: flex; flex-direction: column; gap: 5px; align-items: center;">
                       <button class="btn btn-small" style="padding: 5px 10px; font-size: 0.7em; white-space: nowrap;"
                               onclick="event.stopPropagation(); openEventModalFromList('${event.type}', '${event.data.id || event.data.rowIndex}')">
                           ✏️ Detail
                       </button>
                       ${event.type === 'prediction' ? `
                           <button class="btn btn-small" style="padding: 5px 10px; font-size: 0.7em; background: #17a2b8; color: white;"
                                   onclick="event.stopPropagation(); duplicatePrediction('${event.data.id}')">
                               📋 Kopírovat
                           </button>
                       ` : ''}
                   </div>
               </div>
           `;
       });
       
       html += '</div>';
       monthEventsDiv.innerHTML = html;
       
       console.log(`📅 Month events list updated: ${monthEvents.length} events displayed`);
       
   } catch (error) {
       console.error('❌ Error updating month events list:', error);
       monthEventsDiv.innerHTML = `
           <div class="events-placeholder">
               <div style="text-align: center; padding: 40px 20px;">
                   <div style="color: #dc3545; font-size: 3rem; margin-bottom: 15px;">❌</div>
                   <h4 style="color: #dc3545;">Chyba při načítání akcí</h4>
                   <p style="color: #666;">Zkuste obnovit stránku nebo kontaktujte podporu</p>
                   <button class="btn" onclick="renderCalendar()">🔄 Zkusit znovu</button>
               </div>
           </div>
       `;
   }
}

// Helper funkce pro duplikaci predikce
function duplicatePrediction(predictionId) {
   try {
       const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
       const prediction = savedPredictions.find(p => p.id === predictionId);
       
       if (!prediction) {
           showNotification('❌ Predikce nebyla nalezena', 'error');
           return;
       }
       
       // Kopírování formulářových dat do aktivního formuláře
       const formData = prediction.formData;
       
       // Základní údaje
       if (formData.eventName) document.getElementById('eventName').value = formData.eventName + ' (kopie)';
       if (formData.category) document.getElementById('category').value = formData.category;
       if (formData.city) document.getElementById('city').value = formData.city;
       if (formData.visitors) document.getElementById('visitors').value = formData.visitors;
       if (formData.competition) document.getElementById('competition').value = formData.competition;
       if (formData.eventType) document.getElementById('eventType').value = formData.eventType;
       if (formData.businessModel) document.getElementById('businessModel').value = formData.businessModel;
       if (formData.rentType) document.getElementById('rentType').value = formData.rentType;
       
       // Náklady
       if (formData.price) document.getElementById('price').value = formData.price;
       if (formData.fixedRent) document.getElementById('fixedRent').value = formData.fixedRent;
       if (formData.percentage) document.getElementById('percentage').value = formData.percentage;
       
       // Datum - nastavit na další týden
       const nextWeek = new Date();
       nextWeek.setDate(nextWeek.getDate() + 7);
       const dateString = nextWeek.toISOString().split('T')[0];
       document.getElementById('eventDateFrom').value = dateString;
       document.getElementById('eventDateTo').value = dateString;
       
       // Aktualizace business info a rent fields
       updateBusinessInfo();
       updateRentFields();
       updateWeatherCard();
       
       // Přepnutí na predikční sekci
       showSection('prediction');
       document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
       document.querySelector('.nav-btn[data-section="prediction"]').classList.add('active');
       globalState.currentSection = 'prediction';
       
       showNotification('✅ Predikce zkopírována do formuláře', 'success');
       
       // Scroll na začátek stránky
       window.scrollTo({ top: 0, behavior: 'smooth' });
       
   } catch (error) {
       console.error('❌ Error duplicating prediction:', error);
       showNotification('❌ Chyba při kopírování predikce', 'error');
   }
}

// Export akcí z aktuálního měsíce do CSV
function exportMonthEvents() {
   try {
       const year = globalState.currentYear;
       const month = globalState.currentMonth;
       const monthName = new Date(year, month).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
       
       // Získání akcí pro aktuální měsíc
       const monthEvents = [];
       const eventKeys = new Set();
       
       const daysInMonth = new Date(year, month + 1, 0).getDate();
       for (let day = 1; day <= daysInMonth; day++) {
           const date = new Date(year, month, day);
           const dayEvents = getEventsForDate(date);
           
           dayEvents.forEach(event => {
               if (!eventKeys.has(event.eventKey)) {
                   eventKeys.add(event.eventKey);
                   monthEvents.push(event);
               }
           });
       }
       
       if (monthEvents.length === 0) {
           showNotification('❌ Žádné akce k exportu v tomto měsíci', 'warning');
           return;
       }
       
       // CSV hlavička
       const csvData = [
           'Datum_od,Datum_do,Nazev_akce,Mesto,Kategorie,Status,Typ_zdroje,Prodej_ks,Predikce_ks,Navstevnost,Confidence,Rating,Poznamky'
       ];
       
       // Data řádky
       monthEvents.forEach(event => {
           const row = [
               event.dateFrom || '',
               event.dateTo || event.dateFrom || '',
               `"${(event.title || '').replace(/"/g, '""')}"`,
               `"${(event.city || '').replace(/"/g, '""')}"`,
               event.category || '',
               event.status || '',
               event.source || '',
               event.sales || event.actualSales || 0,
               event.predictedSales || '',
               event.visitors || 0,
               event.confidence || '',
               event.rating || '',
               `"${((event.data && event.data.notes) || '').replace(/"/g, '""')}"`
           ].join(',');
           
           csvData.push(row);
       });
       
       // Download
       const csvContent = csvData.join('\n');
       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
       const link = document.createElement('a');
       
       const filename = `donuland_akce_${monthName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
       
       link.href = URL.createObjectURL(blob);
       link.download = filename;
       link.click();
       
       showNotification(`📄 Export ${monthEvents.length} akcí dokončen`, 'success');
       console.log(`✅ Month events exported: ${filename}`);
       
   } catch (error) {
       console.error('❌ Error exporting month events:', error);
       showNotification('❌ Chyba při exportu akcí', 'error');
   }
}
/* ========================================
   PART 4D: ANALYTICS OPRAVY A VYLEPŠENÍ
   Oprava calculateOverallStats a analytics funkcí
   ======================================== */

// OPRAVENÁ funkce pro výpočet celkových statistik
function calculateOverallStats() {
    console.log('📊 Calculating overall stats (FIXED VERSION)...');
    
    // Debug: Zkontroluj vstupní data
    if (globalState.debugMode) {
        console.log('📊 Input data check:', {
            totalRecords: globalState.historicalData?.length || 0,
            sampleRecord: globalState.historicalData?.[0]
        });
    }
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('📊 No historical data available');
        return {
            totalEvents: 0,
            totalSales: 0,
            averageSales: 0,
            totalRevenue: 0,
            averageConversion: 0,
            topMonth: null,
            bestCategory: null,
            dataQuality: 'no_data'
        };
    }
    
    // OPRAVA: Flexibilnější filtrování validních událostí
    const validEvents = globalState.historicalData.filter(record => {
        const hasValidSales = record.sales && record.sales > 0;
        const hasValidVisitors = record.visitors && record.visitors > 0;
        const hasBasicInfo = record.eventName && record.city;
        const hasValidDate = record.dateFrom;
        
        // Debug každý záznam v debug módu
        if (globalState.debugMode && !hasValidSales) {
            console.log('📊 Invalid record (no sales):', {
                eventName: record.eventName,
                sales: record.sales,
                visitors: record.visitors
            });
        }
        
        return hasValidSales && hasValidVisitors && hasBasicInfo && hasValidDate;
    });
    
    console.log('📊 Valid events after filtering:', {
        total: validEvents.length,
        originalTotal: globalState.historicalData.length,
        validityRate: ((validEvents.length / globalState.historicalData.length) * 100).toFixed(1) + '%'
    });
    
    if (validEvents.length === 0) {
        console.log('📊 No valid events found after filtering');
        return {
            totalEvents: globalState.historicalData.length,
            totalSales: 0,
            averageSales: 0,
            totalRevenue: 0,
            averageConversion: 0,
            topMonth: null,
            bestCategory: null,
            dataQuality: 'invalid_data'
        };
    }
    
    // Výpočty s error handling
    const totalSales = validEvents.reduce((sum, record) => sum + (record.sales || 0), 0);
    const totalVisitors = validEvents.reduce((sum, record) => sum + (record.visitors || 0), 0);
    const averageSales = Math.round(totalSales / validEvents.length);
    const totalRevenue = totalSales * CONFIG.DONUT_PRICE;
    const averageConversion = totalVisitors > 0 ? ((totalSales / totalVisitors) * 100) : 0;
    
    // Najít nejlepší měsíc s error handling
    const monthlyStats = {};
    validEvents.forEach(record => {
        if (record.dateFrom) {
            try {
                const date = new Date(record.dateFrom);
                if (!isNaN(date.getTime())) {
                    const monthKey = date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
                    
                    if (!monthlyStats[monthKey]) {
                        monthlyStats[monthKey] = { sales: 0, events: 0, revenue: 0 };
                    }
                    monthlyStats[monthKey].sales += record.sales || 0;
                    monthlyStats[monthKey].events += 1;
                    monthlyStats[monthKey].revenue += (record.sales || 0) * CONFIG.DONUT_PRICE;
                }
            } catch (error) {
                console.warn('📊 Date parsing error for record:', record.eventName, error);
            }
        }
    });
    
    const topMonth = Object.keys(monthlyStats).reduce((best, month) => 
        !best || monthlyStats[month].sales > monthlyStats[best].sales ? month : best
    , null);
    
    // Najít nejlepší kategorii s dodatečnými statistikami
    const categoryStats = {};
    validEvents.forEach(record => {
        if (record.category) {
            const cat = record.category;
            if (!categoryStats[cat]) {
                categoryStats[cat] = { 
                    sales: 0, 
                    events: 0, 
                    visitors: 0, 
                    revenue: 0,
                    avgConversion: 0 
                };
            }
            categoryStats[cat].sales += record.sales || 0;
            categoryStats[cat].events += 1;
            categoryStats[cat].visitors += record.visitors || 0;
            categoryStats[cat].revenue += (record.sales || 0) * CONFIG.DONUT_PRICE;
        }
    });
    
    // Výpočet průměrné konverze pro každou kategorii
    Object.keys(categoryStats).forEach(cat => {
        const stats = categoryStats[cat];
        stats.avgConversion = stats.visitors > 0 ? ((stats.sales / stats.visitors) * 100) : 0;
    });
    
    const bestCategory = Object.keys(categoryStats).reduce((best, category) => 
        !best || categoryStats[category].sales > categoryStats[best].sales ? category : best
    , null);
    
    // Kvalita dat
    let dataQuality = 'excellent';
    const validityRate = validEvents.length / globalState.historicalData.length;
    if (validityRate < 0.5) dataQuality = 'poor';
    else if (validityRate < 0.8) dataQuality = 'fair';
    else if (validityRate < 0.95) dataQuality = 'good';
    
    const result = {
        totalEvents: validEvents.length,
        totalSales: totalSales,
        averageSales: averageSales,
        totalRevenue: totalRevenue,
        averageConversion: parseFloat(averageConversion.toFixed(1)),
        topMonth: topMonth,
        bestCategory: bestCategory,
        dataQuality: dataQuality,
        
        // Rozšířené statistiky
        totalVisitors: totalVisitors,
        validityRate: parseFloat((validityRate * 100).toFixed(1)),
        monthlyStats: monthlyStats,
        categoryStats: categoryStats,
        
        // Metadata
        calculatedAt: new Date().toISOString(),
        sourceDataCount: globalState.historicalData.length
    };
    
    console.log('📊 Overall stats calculated (FIXED):', result);
    return result;
}

// Opravená funkce pro zobrazení overall stats
function displayOverallStats() {
    try {
        const stats = calculateOverallStats();
        const overallStatsDiv = document.getElementById('overallStats');
        
        if (!overallStatsDiv) {
            console.warn('⚠️ Overall stats div not found');
            return;
        }
        
        // Určení barev podle kvality dat
        const qualityColors = {
            'excellent': '#28a745',
            'good': '#17a2b8', 
            'fair': '#ffc107',
            'poor': '#dc3545',
            'no_data': '#6c757d',
            'invalid_data': '#dc3545'
        };
        
        const qualityLabels = {
            'excellent': 'Výborná kvalita dat',
            'good': 'Dobrá kvalita dat',
            'fair': 'Průměrná kvalita dat', 
            'poor': 'Slabá kvalita dat',
            'no_data': 'Žádná data',
            'invalid_data': 'Neplatná data'
        };
        
        const qualityColor = qualityColors[stats.dataQuality] || '#6c757d';
        const qualityLabel = qualityLabels[stats.dataQuality] || 'Neznámá kvalita';
        
        overallStatsDiv.innerHTML = `
            <div class="stat-item">
                <div class="stat-value" style="color: ${qualityColor};">${formatNumber(stats.totalEvents)}</div>
                <div class="stat-label">Celkem akcí</div>
                <div class="stat-sublabel">${qualityLabel}</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #667eea;">${formatNumber(stats.totalSales)}</div>
                <div class="stat-label">Celkem prodejů</div>
                <div class="stat-sublabel">${formatNumber(stats.totalVisitors)} návštěvníků</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #28a745;">${formatNumber(stats.averageSales)}</div>
                <div class="stat-label">Průměrný prodej</div>
                <div class="stat-sublabel">${stats.averageConversion}% konverze</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #ff6b6b;">${formatCurrency(stats.totalRevenue)}</div>
                <div class="stat-label">Celkový obrat</div>
                <div class="stat-sublabel">${stats.topMonth || 'N/A'}</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #4ecdc4;">${stats.bestCategory || 'N/A'}</div>
                <div class="stat-label">Nejlepší kategorie</div>
                <div class="stat-sublabel">Nejvyšší prodeje</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #45b7d1;">${stats.validityRate}%</div>
                <div class="stat-label">Validita dat</div>
                <div class="stat-sublabel">${stats.sourceDataCount} záznamů celkem</div>
            </div>
        `;
        
        console.log('✅ Overall stats displayed successfully');
        
    } catch (error) {
        console.error('❌ Error displaying overall stats:', error);
        
        const overallStatsDiv = document.getElementById('overallStats');
        if (overallStatsDiv) {
            overallStatsDiv.innerHTML = `
                <div class="stat-item error">
                    <div class="stat-value" style="color: #dc3545;">❌</div>
                    <div class="stat-label">Chyba při výpočtu</div>
                    <div class="stat-sublabel">Zkuste obnovit data</div>
                </div>
            `;
        }
    }
}

// Přepsání původní funkce v analyticsState (pokud existuje)
if (typeof window !== 'undefined') {
    // Náhrada původní funkce novější verzí
    window.calculateOverallStatsFixed = calculateOverallStats;
    window.displayOverallStatsFixed = displayOverallStats;
}

// Oprava top events funkce
function calculateTopEvents() {
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return [];
    }
    
    const validEvents = globalState.historicalData.filter(record => 
        record.sales > 0 && record.eventName && record.city
    );
    
    return validEvents
        .sort((a, b) => (b.sales || 0) - (a.sales || 0))
        .slice(0, 10)
        .map(event => ({
            ...event,
            revenue: (event.sales || 0) * CONFIG.DONUT_PRICE,
            conversion: event.visitors > 0 ? ((event.sales / event.visitors) * 100) : 0
        }));
}

// Zobrazení top events s lepším formátováním
function displayTopEvents() {
    const topEvents = calculateTopEvents();
    const topEventsDiv = document.getElementById('topEvents');
    
    if (!topEventsDiv) return;
    
    if (topEvents.length === 0) {
        topEventsDiv.innerHTML = `
            <div class="analytics-placeholder">
                <p>📊 Žádné události k zobrazení</p>
                <p><small>Načtěte historická data pro zobrazení nejlepších akcí</small></p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="top-events-list">';
    
    topEvents.forEach((event, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const date = event.dateFrom ? formatDate(event.dateFrom) : 'Neznámé datum';
        
        html += `
            <div class="top-item" style="border-left-color: ${index < 3 ? '#ffd700' : '#28a745'};">
                <div class="top-info">
                    <h4>${medal} ${escapeHtml(event.eventName)}</h4>
                    <p>📍 ${escapeHtml(event.city)} • 📅 ${date} • 📊 ${escapeHtml(event.category)}</p>
                    <small>👥 ${formatNumber(event.visitors)} návštěvníků • ${event.conversion.toFixed(1)}% konverze</small>
                </div>
                <div class="top-stats">
                    <div class="top-value">${formatNumber(event.sales)} ks</div>
                    <div class="top-subvalue">${formatCurrency(event.revenue)}</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    topEventsDiv.innerHTML = html;
}

// Analytics refresh funkce
function refreshAnalytics() {
    console.log('📊 Refreshing analytics...');
    
    try {
        displayOverallStats();
        displayTopEvents();
        
        // Další analytics funkce pokud existují
        if (typeof displayTopCities === 'function') displayTopCities();
        if (typeof displayTopCategories === 'function') displayTopCategories();
        if (typeof displayMonthlyTrends === 'function') displayMonthlyTrends();
        
        showNotification('📊 Analytics aktualizovány', 'success', 2000);
        
    } catch (error) {
        console.error('❌ Error refreshing analytics:', error);
        showNotification('❌ Chyba při aktualizaci analytics', 'error');
    }
}
/* ========================================
  PART 4E: MODAL MANAGEMENT & EVENT LISTENERS
  Rozšířená správa událostí, modálů a finální integrace
  ======================================== */

// Helper funkce pro otevření modalu z popup
function openEventModalFromPopup(eventType, eventId) {
   let event = null;
   
   try {
       if (eventType === 'historical') {
           const rowIndex = eventId.replace('historical-', '');
           const record = globalState.historicalData.find(r => r.rowIndex == rowIndex);
           if (record) {
               event = {
                   id: eventId,
                   type: 'historical',
                   title: record.eventName,
                   city: record.city,
                   category: record.category,
                   sales: record.sales,
                   visitors: record.visitors,
                   dateFrom: record.dateFrom,
                   dateTo: record.dateTo,
                   rating: record.rating,
                   notes: record.notes,
                   data: record
               };
           }
       } else if (eventType === 'prediction') {
           const predictionId = eventId.replace('prediction-', '');
           const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
           const prediction = savedPredictions.find(p => p.id === predictionId);
           if (prediction) {
               event = {
                   id: eventId,
                   type: 'prediction',
                   title: prediction.formData.eventName,
                   city: prediction.formData.city,
                   category: prediction.formData.category,
                   predictedSales: prediction.prediction?.predictedSales,
                   actualSales: prediction.actualSales,
                   confidence: prediction.prediction?.confidence,
                   visitors: prediction.formData.visitors,
                   dateFrom: prediction.formData.eventDateFrom,
                   dateTo: prediction.formData.eventDateTo,
                   notes: prediction.notes,
                   data: prediction
               };
           }
       } else if (eventType === 'manual') {
           const manualId = eventId.replace('manual-', '');
           const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
           const manualEvent = manualEvents.find(e => e.id === manualId);
           if (manualEvent) {
               event = {
                   id: eventId,
                   type: 'manual',
                   title: manualEvent.eventName,
                   city: manualEvent.city,
                   category: manualEvent.category,
                   sales: manualEvent.sales,
                   visitors: manualEvent.visitors,
                   dateFrom: manualEvent.dateFrom,
                   dateTo: manualEvent.dateTo,
                   rating: manualEvent.rating,
                   notes: manualEvent.notes,
                   data: manualEvent
               };
           }
       }
       
       if (event) {
           openEventModal(event);
       } else {
           showNotification('❌ Událost nebyla nalezena', 'error');
       }
       
   } catch (error) {
       console.error('❌ Error opening event modal from popup:', error);
       showNotification('❌ Chyba při otevírání detailu události', 'error');
   }
}

// Helper funkce pro otevření modalu ze seznamu
function openEventModalFromList(eventType, eventId) {
   // Používá stejnou logiku jako openEventModalFromPopup
   openEventModalFromPopup(eventType, eventId);
}

// Rozšířená funkce pro otevření event modalu
function openEventModal(event = null, defaultDate = null) {
   const modal = document.getElementById('eventModal');
   const modalTitle = document.getElementById('modalTitle');
   const modalEventName = document.getElementById('modalEventName');
   const modalEventDateFrom = document.getElementById('modalEventDateFrom');
   const modalEventDateTo = document.getElementById('modalEventDateTo');
   const modalEventCity = document.getElementById('modalEventCity');
   const modalSales = document.getElementById('modalSales');
   const modalNotes = document.getElementById('modalNotes');
   
   if (!modal) {
       console.error('❌ Event modal not found');
       return;
   }
   
   try {
       // Vymazání předchozích dat
       if (modalEventName) modalEventName.value = '';
       if (modalEventDateFrom) modalEventDateFrom.value = '';
       if (modalEventDateTo) modalEventDateTo.value = '';
       if (modalEventCity) modalEventCity.value = '';
       if (modalSales) modalSales.value = '';
       if (modalNotes) modalNotes.value = '';
       
       if (event) {
           // Editace existující události
           if (modalTitle) modalTitle.textContent = `✏️ Detail: ${event.title}`;
           if (modalEventName) modalEventName.value = event.title || '';
           if (modalEventDateFrom) modalEventDateFrom.value = formatDateForInput(event.dateFrom);
           if (modalEventDateTo) modalEventDateTo.value = formatDateForInput(event.dateTo || event.dateFrom);
           if (modalEventCity) modalEventCity.value = event.city || '';
           if (modalSales) modalSales.value = event.sales || event.actualSales || '';
           if (modalNotes) modalNotes.value = event.notes || '';
           
           // Uložení reference na událost pro pozdější úpravu
           modal.dataset.eventType = event.type;
           modal.dataset.eventId = event.id;
           
           // Speciální obsah podle typu události
           const modalBody = modal.querySelector('.modal-body');
           if (modalBody) {
               // Přidání dodatečných informací podle typu
               let additionalInfo = '';
               
               if (event.type === 'prediction') {
                   additionalInfo = `
                       <div class="prediction-info" style="background: #e3f2fd; padding: 10px; border-radius: 5px; margin-top: 10px;">
                           <h5>🔮 Predikční data</h5>
                           <p><strong>Predikovaný prodej:</strong> ${formatNumber(event.predictedSales || 0)} ks</p>
                           <p><strong>Confidence:</strong> ${event.confidence || 0}%</p>
                           ${event.actualSales ? `<p><strong>Skutečný prodej:</strong> ${formatNumber(event.actualSales)} ks</p>` : ''}
                       </div>
                   `;
               } else if (event.type === 'historical') {
                   additionalInfo = `
                       <div class="historical-info" style="background: #d4edda; padding: 10px; border-radius: 5px; margin-top: 10px;">
                           <h5>📊 Historická data ze Sheets</h5>
                           <p><strong>Kategorie:</strong> ${event.category || 'N/A'}</p>
                           <p><strong>Návštěvnost:</strong> ${formatNumber(event.visitors || 0)}</p>
                           ${event.rating ? `<p><strong>Hodnocení:</strong> ${event.rating}/5 ⭐</p>` : ''}
                       </div>
                   `;
               }
               
               // Odstraň předchozí dodatečné info
               const existing = modalBody.querySelector('.prediction-info, .historical-info, .manual-info');
               if (existing) existing.remove();
               
               // Přidej nové info
               if (additionalInfo) {
                   modalBody.insertAdjacentHTML('beforeend', additionalInfo);
               }
           }
           
       } else if (defaultDate) {
           // Nová událost pro konkrétní datum
           if (modalTitle) modalTitle.textContent = '➕ Přidat novou akci';
           const dateStr = formatDateForInput(defaultDate);
           if (modalEventDateFrom) modalEventDateFrom.value = dateStr;
           if (modalEventDateTo) modalEventDateTo.value = dateStr;
           
           // Vymazání reference
           delete modal.dataset.eventType;
           delete modal.dataset.eventId;
       } else {
           // Nová událost bez konkrétního data
           if (modalTitle) modalTitle.textContent = '➕ Přidat novou akci';
           delete modal.dataset.eventType;
           delete modal.dataset.eventId;
       }
       
       // Zobrazení modalu
       modal.style.display = 'flex';
       
       // Focus na první input
       setTimeout(() => {
           if (modalEventName && !event) modalEventName.focus();
           else if (modalSales) modalSales.focus();
       }, 100);
       
       eventBus.emit('modalOpened', { event, defaultDate });
       
   } catch (error) {
       console.error('❌ Error opening event modal:', error);
       showNotification('❌ Chyba při otevírání modalu', 'error');
   }
}

// Uložení změn události
function saveEventEdit() {
   const modal = document.getElementById('eventModal');
   if (!modal) return;
   
   try {
       const modalEventName = document.getElementById('modalEventName');
       const modalEventDateFrom = document.getElementById('modalEventDateFrom');
       const modalEventDateTo = document.getElementById('modalEventDateTo');
       const modalEventCity = document.getElementById('modalEventCity');
       const modalSales = document.getElementById('modalSales');
       const modalNotes = document.getElementById('modalNotes');
       
       // Validace
       if (!modalEventName || !modalEventName.value.trim()) {
           showNotification('❌ Název akce je povinný', 'error');
           return;
       }
       
       const eventData = {
           eventName: modalEventName.value.trim(),
           dateFrom: modalEventDateFrom?.value || '',
           dateTo: modalEventDateTo?.value || modalEventDateFrom?.value || '',
           city: modalEventCity?.value.trim() || '',
           sales: parseInt(modalSales?.value) || 0,
           notes: modalNotes?.value.trim() || '',
           updatedAt: new Date().toISOString()
       };
       
       const eventType = modal.dataset.eventType;
       const eventId = modal.dataset.eventId;
       
       if (eventType && eventId) {
           // Aktualizace existující události
           updateExistingEvent(eventType, eventId, eventData);
       } else {
           // Vytvoření nové manuální události
           createNewManualEvent(eventData);
       }
       
       // Zavření modalu
       closeModal();
       
       // Refresh kalendáře a analytics
       setTimeout(() => {
           updateCalendarFilters();
           renderCalendar();
           refreshAnalytics();
       }, 100);
       
   } catch (error) {
       console.error('❌ Error saving event edit:', error);
       showNotification('❌ Chyba při ukládání změn', 'error');
   }
}

// Aktualizace existující události
function updateExistingEvent(eventType, eventId, eventData) {
   try {
       if (eventType === 'prediction') {
           // Aktualizace predikce
           const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
           const predictionIndex = savedPredictions.findIndex(p => p.id === eventId.replace('prediction-', ''));
           
           if (predictionIndex !== -1) {
               savedPredictions[predictionIndex].actualSales = eventData.sales;
               savedPredictions[predictionIndex].notes = eventData.notes;
               savedPredictions[predictionIndex].updatedAt = eventData.updatedAt;
               
               localStorage.setItem('donuland_predictions', JSON.stringify(savedPredictions));
               showNotification('✅ Predikce aktualizována', 'success');
           }
           
       } else if (eventType === 'manual') {
           // Aktualizace manuální události
           const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
           const eventIndex = manualEvents.findIndex(e => e.id === eventId.replace('manual-', ''));
           
           if (eventIndex !== -1) {
               Object.assign(manualEvents[eventIndex], eventData);
               localStorage.setItem('donuland_manual_events', JSON.stringify(manualEvents));
               showNotification('✅ Událost aktualizována', 'success');
           }
           
       } else if (eventType === 'historical') {
           showNotification('ℹ️ Historická data ze Sheets nelze editovat', 'info');
       }
       
   } catch (error) {
       console.error('❌ Error updating existing event:', error);
       showNotification('❌ Chyba při aktualizaci události', 'error');
   }
}

// Vytvoření nové manuální události
function createNewManualEvent(eventData) {
   try {
       const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
       
       const newEvent = {
           id: generateId(),
           ...eventData,
           category: 'ostatní', // Default kategorie
           visitors: 0, // Default návštěvnost
           rating: 0,
           createdAt: new Date().toISOString()
       };
       
       manualEvents.push(newEvent);
       localStorage.setItem('donuland_manual_events', JSON.stringify(manualEvents));
       
       showNotification('✅ Nová událost přidána', 'success');
       
       eventBus.emit('manualEventCreated', newEvent);
       
   } catch (error) {
       console.error('❌ Error creating manual event:', error);
       showNotification('❌ Chyba při vytváření události', 'error');
   }
}

// Smazání události
function deleteEvent() {
   const modal = document.getElementById('eventModal');
   if (!modal) return;
   
   const eventType = modal.dataset.eventType;
   const eventId = modal.dataset.eventId;
   
   if (!eventType || !eventId) {
       showNotification('❌ Nelze smazat - událost není identifikována', 'error');
       return;
   }
   
   if (!confirm('Opravdu chcete smazat tuto událost? Tuto akci nelze vrátit zpět.')) {
       return;
   }
   
   try {
       if (eventType === 'prediction') {
           // Smazání predikce
           const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
           const filteredPredictions = savedPredictions.filter(p => p.id !== eventId.replace('prediction-', ''));
           localStorage.setItem('donuland_predictions', JSON.stringify(filteredPredictions));
           showNotification('✅ Predikce smazána', 'success');
           
       } else if (eventType === 'manual') {
           // Smazání manuální události
           const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
           const filteredEvents = manualEvents.filter(e => e.id !== eventId.replace('manual-', ''));
           localStorage.setItem('donuland_manual_events', JSON.stringify(filteredEvents));
           showNotification('✅ Událost smazána', 'success');
           
       } else if (eventType === 'historical') {
           showNotification('❌ Historická data ze Sheets nelze smazat', 'error');
           return;
       }
       
       // Zavření modalu
       closeModal();
       
       // Refresh kalendáře
       setTimeout(() => {
           updateCalendarFilters();
           renderCalendar();
           refreshAnalytics();
       }, 100);
       
   } catch (error) {
       console.error('❌ Error deleting event:', error);
       showNotification('❌ Chyba při mazání události', 'error');
   }
}

// Helper funkce pro formátování data pro input
function formatDateForInput(dateStr) {
   if (!dateStr) return '';
   
   try {
       const date = new Date(dateStr);
       if (isNaN(date.getTime())) return '';
       
       return date.toISOString().split('T')[0];
   } catch (error) {
       console.warn('⚠️ Error formatting date for input:', dateStr);
       return '';
   }
}

// Bulk export všech dat
function exportAllData() {
   try {
       const allData = {
           historicalData: globalState.historicalData || [],
           predictions: JSON.parse(localStorage.getItem('donuland_predictions') || '[]'),
           manualEvents: JSON.parse(localStorage.getItem('donuland_manual_events') || '[]'),
           settings: JSON.parse(localStorage.getItem('donuland_settings') || '{}'),
           exportedAt: new Date().toISOString(),
           version: '4.0.0'
       };
       
       const blob = new Blob([JSON.stringify(allData, null, 2)], {
           type: 'application/json'
       });
       
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `donuland_backup_${new Date().toISOString().split('T')[0]}.json`;
       a.click();
       URL.revokeObjectURL(url);
       
       showNotification('📤 Backup všech dat dokončen', 'success');
       
   } catch (error) {
       console.error('❌ Error exporting all data:', error);
       showNotification('❌ Chyba při exportu dat', 'error');
   }
}

// Clear cache funkce
function clearCache() {
   if (!confirm('Opravdu chcete vymazat všechna cachovaná data? Toto neovlivní historická data ze Sheets.')) {
       return;
   }
   
   try {
       // Vymazání cache
       globalState.weatherCache.clear();
       globalState.distanceCache.clear();
       
       // Vymazání některých localStorage dat (ne všech!)
       localStorage.removeItem('donuland_cache');
       
       // Reset některých stavů
       globalState.lastDataLoad = null;
       
       showNotification('🧹 Cache vymazána', 'success');
       
   } catch (error) {
       console.error('❌ Error clearing cache:', error);
       showNotification('❌ Chyba při mazání cache', 'error');
   }
}

/* ========================================
  EVENT LISTENERS A FINÁLNÍ INTEGRACE
  ======================================== */

// Event listeners pro kalendář
eventBus.on('calendarMonthChanged', (data) => {
   console.log('📅 Calendar month changed:', data);
   setTimeout(() => {
       updateCalendarFilters();
       renderCalendar();
   }, 100);
});

eventBus.on('calendarTodayRequested', () => {
   console.log('📅 Calendar today requested');
   setTimeout(() => {
       updateCalendarFilters();
       renderCalendar();
   }, 100);
});

eventBus.on('calendarResizeRequested', () => {
   console.log('📅 Calendar resize requested');
   setTimeout(() => {
       renderCalendar();
   }, 200);
});

eventBus.on('calendarRequested', () => {
   console.log('📅 Calendar section requested');
   setTimeout(() => {
       updateCalendarFilters();
       renderCalendar();
   }, 100);
});

// Analytics event listeners
eventBus.on('analyticsRequested', () => {
   console.log('📊 Analytics section requested');
   setTimeout(() => {
       refreshAnalytics();
   }, 100);
});

// Data change event listeners
eventBus.on('dataLoaded', () => {
   console.log('📅 Data loaded, updating calendar and analytics');
   setTimeout(() => {
       updateCalendarFilters();
       renderCalendar();
       refreshAnalytics();
   }, 500);
});

eventBus.on('dataUpdated', () => {
   console.log('📅 Data updated, refreshing calendar and analytics');
   setTimeout(() => {
       updateCalendarFilters();
       renderCalendar();
       refreshAnalytics();
   }, 100);
});

// Modal event listeners
eventBus.on('modalClosed', () => {
   setTimeout(() => {
       renderCalendar();
   }, 100);
});

eventBus.on('manualEventCreated', () => {
   setTimeout(() => {
       updateCalendarFilters();
       renderCalendar();
       refreshAnalytics();
   }, 100);
});

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
   console.log('📅 Initializing Part 4E - Final Integration...');
   
   // Přidání event listenerů pro filtry
   const cityFilter = document.getElementById('cityFilter');
   const categoryFilter = document.getElementById('categoryFilter');
   const statusFilter = document.getElementById('statusFilter');
   
   if (cityFilter) {
       cityFilter.addEventListener('change', filterCalendar);
       console.log('✅ City filter listener added');
   }
   if (categoryFilter) {
       categoryFilter.addEventListener('change', filterCalendar);
       console.log('✅ Category filter listener added');
   }
   if (statusFilter) {
       statusFilter.addEventListener('change', filterCalendar);
       console.log('✅ Status filter listener added');
   }
   
   // Připravení kalendáře pokud jsou data již načtena
   if (globalState.historicalData && globalState.historicalData.length > 0) {
       console.log('📊 Historical data found, initializing calendar and analytics...');
       setTimeout(() => {
           updateCalendarFilters();
           renderCalendar();
           refreshAnalytics();
       }, 1000);
   } else {
       console.log('📊 No historical data yet, waiting for data load...');
   }
   
   console.log('✅ Part 4E initialized successfully');
});

/* ========================================
  CSS ROZŠÍŘENÍ PRO PART 4E
  ======================================== */

// Přidání CSS stylů pro rozšířené funkce
function addPart4EStyles() {
   const style = document.createElement('style');
   style.textContent = `
       /* Modal rozšíření */
       .prediction-info, .historical-info, .manual-info {
           border-radius: 6px;
           border: 1px solid rgba(0,0,0,0.1);
       }
       
       .prediction-info h5, .historical-info h5, .manual-info h5 {
           margin: 0 0 10px;
           font-size: 0.9em;
           font-weight: 600;
       }
       
       .prediction-info p, .historical-info p, .manual-info p {
           margin: 5px 0;
           font-size: 0.85em;
       }
       
       /* Month events header */
       .month-events-header {
           background: linear-gradient(135deg, #f8f9fa, #e9ecef);
           border-radius: 8px;
           padding: 15px !important;
           margin-bottom: 20px !important;
       }
       
       /* Enhanced buttons */
       .btn-small {
           padding: 6px 12px;
           font-size: 0.8em;
           border-radius: 4px;
       }
       
       /* Stat sublabel */
       .stat-sublabel {
           font-size: 0.7em;
           color: #666;
           margin-top: 3px;
           font-weight: normal;
       }
       
       /* Loading states pro filtry */
       .calendar-filters select:disabled {
           opacity: 0.6;
           cursor: not-allowed;
       }
       
       /* Enhanced hover effects */
       .month-event-item {
           border: 1px solid rgba(0,0,0,0.05);
       }
       
       .month-event-item:hover {
           border-color: rgba(102, 126, 234, 0.3);
       }
       
       /* Filter indicators */
       .calendar-filters select[style*="border-color: #ffc107"] {
           background-color: #fff3cd;
       }
       
       /* Error states */
       .stat-item.error .stat-value {
           animation: errorPulse 2s infinite;
       }
       
       @keyframes errorPulse {
           0%, 100% { opacity: 1; }
           50% { opacity: 0.7; }
       }
       
       /* Responsive improvements */
       @media (max-width: 768px) {
           .month-events-header {
               flex-direction: column;
               text-align: center;
               gap: 10px;
           }
           
           .month-event-item {
               flex-direction: column;
               align-items: flex-start;
               text-align: left;
           }
           
           .event-date {
               align-self: center;
               margin-bottom: 10px;
           }
           
           .event-actions {
               align-self: stretch;
               flex-direction: row;
               justify-content: center;
               gap: 10px;
               margin-top: 10px;
           }
       }
   `;
   
   document.head.appendChild(style);
}

// Spusť přidání stylů při načtení
document.addEventListener('DOMContentLoaded', function() {
   addPart4EStyles();
});

/* ========================================
  DEBUG A TESTING FUNKCE PRO PART 4E
  ======================================== */

// Debug funkce pro testování event managementu
function debugEventManagement() {
   if (!globalState.debugMode) return;
   
   const stats = {
       historical: globalState.historicalData?.length || 0,
       predictions: JSON.parse(localStorage.getItem('donuland_predictions') || '[]').length,
       manual: JSON.parse(localStorage.getItem('donuland_manual_events') || '[]').length,
       filters: calendarState.filters,
       currentMonth: `${globalState.currentMonth + 1}/${globalState.currentYear}`,
       eventColors: calendarState.eventColors.size
   };
   
   console.table(stats);
   return stats;
}

// Global funkce pro debugging
if (typeof window !== 'undefined') {
   window.donulandPart4E = {
       getEventStats: debugEventManagement,
       testModal: () => openEventModal(null, new Date()),
       exportData: exportAllData,
       clearAllCache: clearCache,
       refreshAll: () => {
           updateCalendarFilters();
           renderCalendar();
           refreshAnalytics();
       }
   };
}

/* ========================================
  FINALIZACE PART 4E
  ======================================== */

console.log('✅ Donuland Part 4E loaded successfully');
console.log('🎯 Features: ✅ Modal Management ✅ Event CRUD ✅ Bulk Operations ✅ Analytics Fixes');
console.log('📊 Integration: ✅ Calendar ↔ Analytics ✅ Filters ↔ Data ✅ Modal ↔ Storage');
console.log('🔧 Debug: window.donulandPart4E available');
console.log('📅 Full Part 4 COMPLETE - Calendar system fully functional!');

// Event pro signalizaci dokončení celé části 4
eventBus.emit('part4ELoaded', { 
   timestamp: Date.now(),
   version: '4.0.0-complete',
   features: [
       'modal-management', 'event-crud', 'bulk-operations', 'analytics-fixes',
       'final-integration', 'debug-tools', 'responsive-design'
   ]
});

// Celkový event pro Part 4 complete
eventBus.emit('part4Complete', {
   timestamp: Date.now(),
   parts: ['4A-colors', '4B-events', '4C-filters', '4D-analytics', '4E-integration'],
   totalFeatures: 25,
   status: 'fully-functional'
});
