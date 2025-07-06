/* ========================================
   DONULAND PART 4 - CHYBĚJÍCÍ ZÁKLADNÍ STRUKTURA
   Přidej tohle na ZAČÁTEK souboru donuland_app_part4.js
   ======================================== */

console.log('🍩 Donuland Part 4 - Adding missing calendar structure...');

// ========================================
// CHYBĚJÍCÍ GLOBÁLNÍ KALENDÁŘNÍ STAV
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
// CHYBĚJÍCÍ RENDER FUNKCE
// ========================================

// Hlavní funkce pro vykreslení kalendáře
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
        
        // Získání dnů v měsíci
        const year = globalState.currentYear;
        const month = globalState.currentMonth;
        const daysInMonth = getDaysInMonth(year, month);
        
        // Přidání dnů
        daysInMonth.forEach(dayData => {
            const dayElement = createCalendarDay(dayData);
            calendarGrid.appendChild(dayElement);
        });
        
        console.log(`✅ Calendar rendered for ${month + 1}/${year}`);
        
    } catch (error) {
        console.error('❌ Error rendering calendar:', error);
        showNotification('❌ Chyba při vykreslování kalendáře', 'error');
    } finally {
        calendarState.isRendering = false;
    }
}

// ========================================
// CHYBĚJÍCÍ CSS ANIMACE
// ========================================

function addCalendarAnimationCSS() {
    const style = document.createElement('style');
    style.textContent = `
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
        
        .calendar-grid {
            animation: fadeIn 0.5s ease-out;
        }
        
        .calendar-day {
            transition: all 0.3s ease;
        }
        
        .calendar-day:hover {
            transform: scale(1.02);
            z-index: 5;
        }
    `;
    
    document.head.appendChild(style);
}

// ========================================
// CHYBĚJÍCÍ FILTER FUNKCE
// ========================================

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
    updateMonthEventsList();
    showNotification('🔄 Filtry kalendáře vymazány', 'info', 2000);
}

// ========================================
// CHYBĚJÍCÍ MODAL FUNKCE (PLACEHOLDER)
// ========================================

function openEventModal(event = null, defaultDate = null) {
    console.log('📝 Opening event modal:', { event, defaultDate });
    // Tato funkce bude implementována v part4E
    showNotification('ℹ️ Event modal - will be implemented in part 4E', 'info');
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
    showNotification('📋 Kopírování predikce - will be implemented in part 4E', 'info');
}

// ========================================
// CHYBĚJÍCÍ HELPER FUNKCE
// ========================================

// Pokud formatNumber není definováno
if (typeof formatNumber === 'undefined') {
    function formatNumber(number) {
        if (number === null || number === undefined || isNaN(number)) {
            return '0';
        }
        return new Intl.NumberFormat('cs-CZ').format(Math.round(number));
    }
}

// Pokud formatDate není definováno
if (typeof formatDate === 'undefined') {
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
}

// Pokud escapeHtml není definováno
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Pokud showNotification není definováno
if (typeof showNotification === 'undefined') {
    function showNotification(message, type = 'info', duration = 3000) {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Jednoduchá implementace pro fallback
        if (window.alert && type === 'error') {
            alert('Chyba: ' + message);
        }
    }
}

// ========================================
// INICIALIZACE PO NAČTENÍ
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Initializing calendar system...');
    
    // Přidání CSS animací
    addCalendarAnimationCSS();
    
    // Inicializace color palette
    if (calendarState.colorPalette.length === 0) {
        calendarState.colorPalette = generateColorPalette();
    }
    
    // Automatické vykreslení kalendáře po 2 sekundách
    setTimeout(() => {
        console.log('🔄 Auto-rendering calendar...');
        
        // Ověř, že globalState existuje
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
        
        // Pokud existuje updateMonthEventsList
        if (typeof updateMonthEventsList === 'function') {
            updateMonthEventsList();
        }
        
    }, 2000);
    
    console.log('✅ Calendar system initialized');
});

// ========================================
// EXPORT DEBUG FUNKCÍ
// ========================================

if (typeof window !== 'undefined') {
    window.donulandCalendar = {
        state: calendarState,
        render: renderCalendar,
        clear: clearFilters,
        testRender: () => {
            console.log('🧪 Testing calendar render...');
            calendarState.isRendering = false; // Reset flag
            renderCalendar();
        }
    };
}

console.log('🔧 Missing calendar structure added successfully');
console.log('📅 Calendar should now render automatically in 2 seconds');
console.log('🧪 Test manually: window.donulandCalendar.testRender()');
/* ========================================
   DONULAND PART 4A - OPRAVY
   Barevný systém a základní kalendářní funkcionalita
   ======================================== */

console.log('🔧 Loading Donuland Part 4A FIXES...');

// ========================================
// OPRAVA: VYLEPŠENÝ BAREVNÝ SYSTÉM
// ========================================

// OPRAVENÁ funkce pro získání barvy akce s lepší logikou
function getEventColor(eventName, date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    
    // OPRAVA: Přesnější určení statusu události
    let eventStatus = 'planned';
    if (eventDate < today) {
        eventStatus = 'completed';
    } else if (eventDate.toDateString() === today.toDateString()) {
        eventStatus = 'ongoing';
    }
    
    // DOKONČENÉ AKCE - konzistentní zelená barva
    if (eventStatus === 'completed') {
        return {
            background: '#d4edda',
            border: '#28a745',
            textColor: '#155724',
            icon: '✅'
        };
    }
    
    // PROBÍHAJÍCÍ AKCE - oranžová barva
    if (eventStatus === 'ongoing') {
        return {
            background: '#fff3cd',
            border: '#ffc107',
            textColor: '#856404',
            icon: '🔥'
        };
    }
    
    // PLÁNOVANÉ AKCE - unikátní barvy podle názvu
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

// NOVÁ: Vylepšená hash funkce pro lepší distribuci barev
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

// OPRAVENÁ funkce pro generování palety s lepšími barvami
function generateColorPalette() {
    const colors = [];
    
    // ROZŠÍŘENÁ základní sytá paleta pro nejčastější akce
    const baseColors = [
        // Světlé a příjemné barvy pro lepší čitelnost
        '#4285f4', '#ea4335', '#34a853', '#fbbc04', '#9c27b0', 
        '#ff6f00', '#795548', '#607d8b', '#e91e63', '#8bc34a',
        '#ff5722', '#3f51b5', '#009688', '#673ab7', '#2196f3',
        '#ff9800', '#4caf50', '#f44336', '#ffeb3b', '#9e9e9e',
        '#00bcd4', '#ffc107', '#d32f2f', '#388e3c', '#1976d2',
        // Přidání dalších harmonických barev
        '#7b1fa2', '#c2185b', '#d84315', '#f57c00', '#689f38',
        '#0097a7', '#5d4037', '#455a64', '#512da8', '#303f9f'
    ];
    
    // Přidej základní barvy
    colors.push(...baseColors);
    
    // OPRAVA: Generuj další barvy pomocí HSL s lepšími parametry
    for (let hue = 0; hue < 360; hue += 12) { // Menší kroky pro jemnější přechody
        // Více variant každé barvy
        colors.push(`hsl(${hue}, 70%, 55%)`); // Sytá verze
        colors.push(`hsl(${hue}, 85%, 45%)`); // Tmavší verze
        colors.push(`hsl(${hue}, 60%, 65%)`); // Světlejší verze
    }
    
    console.log(`🎨 Generated IMPROVED color palette with ${colors.length} colors`);
    return colors;
}

// ========================================
// OPRAVA: VYLEPŠENÉ VYTVOŘENÍ KALENDÁŘNÍHO DNE
// ========================================

// OPRAVENÁ funkce pro vytvoření prvku kalendářního dne
function createCalendarDay(dayData) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (!dayData.isCurrentMonth) {
        dayElement.classList.add('other-month');
    }
    
    // OPRAVA: Přesnější kontrola dnešního dne
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
    
    // OPRAVA: Seznam událostí s vylepšeným barevným rozlišením
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    // OPRAVA: Zobrazit více událostí (až 4 místo 3)
    dayData.events.slice(0, 4).forEach(event => {
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
        eventElement.style.padding = '3px 6px';
        eventElement.style.marginBottom = '2px';
        eventElement.style.borderRadius = '4px';
        eventElement.style.cursor = 'pointer';
        eventElement.style.transition = 'all 0.2s ease';
        
        // OPRAVA: Text události s lepšími ikonami podle statusu
        let eventText = event.title;
        let statusIcon = colorInfo.icon;
        
        // SPECIÁLNÍ OZNAČENÍ PRO RŮZNÉ TYPY AKCÍ
        if (event.hasPrediction) {
            statusIcon = '🔮📊';
            // Gradient pro akce s predikcí
            eventElement.style.background = `linear-gradient(45deg, ${colorInfo.background}, #e3f2fd)`;
            eventElement.classList.add('has-prediction');
        }
        
        // OPRAVA: Zkrácení textu pro lepší zobrazení
        const maxLength = 20;
        if (eventText.length > maxLength) {
            eventText = eventText.substring(0, maxLength - 3) + '...';
        }
        
        eventElement.textContent = `${statusIcon} ${eventText}`;
        
        // OPRAVA: Vylepšený tooltip s více informacemi
        const tooltipInfo = [
            `📋 ${event.title}`,
            `📍 ${event.city}`,
            `🏷️ ${event.category}`,
            event.sales ? `🍩 Prodáno: ${formatNumber(event.sales)} ks` : '',
            event.predictedSales ? `🔮 Predikce: ${formatNumber(event.predictedSales)} ks` : '',
            event.confidence ? `🎯 Confidence: ${event.confidence}%` : '',
            event.visitors ? `👥 Návštěvnost: ${formatNumber(event.visitors)}` : '',
            `📅 ${formatDate(event.dateFrom)}${event.dateTo && event.dateTo !== event.dateFrom ? ` - ${formatDate(event.dateTo)}` : ''}`,
            `📊 Status: ${getStatusText(event.status)}`,
            event.source ? `📂 Zdroj: ${getSourceText(event.source)}` : ''
        ].filter(Boolean).join('\n');
        
        eventElement.title = tooltipInfo;
        
        // CSS třídy pro různé typy a stavy
        eventElement.classList.add(event.status || 'unknown');
        eventElement.classList.add(event.type || 'unknown');
        
        // OPRAVA: Hover efekt
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
        
        // Click handler pro editaci události
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('📅 Event clicked:', event);
            openEventModal(event);
        });
        
        eventsContainer.appendChild(eventElement);
    });
    
    // OPRAVA: Indikátor dalších událostí s lepším stylem
    if (dayData.events.length > 4) {
        const moreIndicator = document.createElement('div');
        moreIndicator.className = 'event-item more';
        moreIndicator.textContent = `+${dayData.events.length - 4} dalších`;
        moreIndicator.style.background = '#6c757d';
        moreIndicator.style.color = '#ffffff';
        moreIndicator.style.fontWeight = '600';
        moreIndicator.style.padding = '3px 6px';
        moreIndicator.style.borderRadius = '4px';
        moreIndicator.style.fontSize = '0.7rem';
        moreIndicator.style.cursor = 'pointer';
        moreIndicator.style.textAlign = 'center';
        
        moreIndicator.addEventListener('click', (e) => {
            e.stopPropagation();
            showDayEventsPopup(dayData.date, dayData.events);
        });
        
        eventsContainer.appendChild(moreIndicator);
    }
    
    dayElement.appendChild(eventsContainer);
    
    // OPRAVA: Click handler pro přidání nové události
    dayElement.addEventListener('click', () => {
        if (dayData.isCurrentMonth) {
            console.log('📅 Day clicked for new event:', dayData.date);
            openEventModal(null, dayData.date);
        }
    });
    
    return dayElement;
}

// ========================================
// NOVÉ: HELPER FUNKCE PRO LEPŠÍ UX
// ========================================

// Helper funkce pro převod statusu na text
function getStatusText(status) {
    const statusMap = {
        'completed': 'Dokončeno',
        'ongoing': 'Probíhá',
        'planned': 'Plánováno',
        'unknown': 'Neznámý'
    };
    return statusMap[status] || status;
}

// Helper funkce pro převod zdroje na text
function getSourceText(source) {
    const sourceMap = {
        'sheets': 'Google Sheets',
        'prediction': 'AI Predikce',
        'manual': 'Manuálně přidáno'
    };
    return sourceMap[source] || source;
}

// ========================================
// OPRAVA: CSS STYLY PRO VYLEPŠENÉ BARVY
// ========================================

// OPRAVENÁ funkce pro přidání CSS stylů
function addColorSystemStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* OPRAVENÉ pokročilé barvy pro události */
        .event-item.has-prediction {
            position: relative;
            background: linear-gradient(45deg, var(--primary-color), var(--info-color)) !important;
            animation: predictionGlow 2s ease-in-out infinite alternate;
            font-weight: 700 !important;
            border: 2px solid rgba(23, 162, 184, 0.5) !important;
        }
        
        @keyframes predictionGlow {
            0% { box-shadow: 0 0 5px rgba(23, 162, 184, 0.5); }
            100% { box-shadow: 0 0 15px rgba(23, 162, 184, 0.8); }
        }
        
        .event-item.completed {
            opacity: 0.9;
            border-style: solid !important;
            border-width: 2px !important;
        }
        
        .event-item.ongoing {
            animation: ongoingPulse 2s infinite;
            font-weight: 700;
            border-width: 3px !important;
        }
        
        @keyframes ongoingPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        .event-item.planned {
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* OPRAVENÉ vylepšení calendar day */
        .calendar-day.has-events {
            border-left: 4px solid var(--primary-color);
            position: relative;
        }
        
        .calendar-day.has-events::before {
            content: '';
            position: absolute;
            top: 2px;
            right: 2px;
            width: 8px;
            height: 8px;
            background: var(--primary-color);
            border-radius: 50%;
            box-shadow: 0 0 4px rgba(102, 126, 234, 0.5);
        }
        
        .calendar-day.today.has-events::before {
            background: var(--warning-color);
            animation: todayPulse 1.5s infinite;
        }
        
        @keyframes todayPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        
        /* OPRAVENÉ event items s lepším spacingem */
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
        }
        
        .day-events .event-item:hover {
            transform: scale(1.05) translateY(-1px);
            z-index: 10;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            white-space: normal;
            position: relative;
            min-height: auto;
        }
        
        /* NOVÉ: Source indicators */
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
        
        /* OPRAVENÉ enhanced tooltips */
        .event-item:hover {
            position: relative;
            z-index: 100;
        }
        
        /* NOVÉ: Mobile responsive improvements */
        @media (max-width: 768px) {
            .day-events .event-item {
                font-size: 0.7rem;
                padding: 2px 4px;
            }
            
            .calendar-day {
                min-height: 80px;
            }
            
            .day-number {
                font-size: 0.9rem;
            }
        }
        
        /* NOVÉ: Better contrast for accessibility */
        .event-item {
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .event-item[style*="color: #ffffff"] {
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
    `;
    
    document.head.appendChild(style);
    console.log('🎨 IMPROVED color system styles added');
}

// ========================================
// OPRAVA: DEBUG FUNKCE
// ========================================

// OPRAVENÁ debug funkce pro testování barev
function debugColorSystem() {
    const debugDiv = document.createElement('div');
    debugDiv.className = 'color-debug';
    debugDiv.innerHTML = `
        <div><strong>🎨 Color System Debug (FIXED)</strong></div>
        <div>Cached colors: ${calendarState.eventColors.size}</div>
        <div>Palette size: ${calendarState.colorPalette.length}</div>
        <div>Events in calendar: ${document.querySelectorAll('.event-item').length}</div>
        <div style="margin-top: 10px;">
            <strong>Sample colors:</strong><br>
            ${calendarState.colorPalette.slice(0, 10).map((color, i) => 
                `<span class="color-sample" style="background: ${color}; width: 20px; height: 20px; display: inline-block; margin: 2px; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;" title="${color}"></span>`
            ).join('')}
        </div>
        <div style="margin-top: 10px;">
            <button onclick="this.parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Close</button>
            <button onclick="calendarState.eventColors.clear(); renderCalendar(); this.parentElement.remove();" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-left: 5px;">Reset Colors</button>
        </div>
    `;
    
    // Odstraň předchozí debug
    const existing = document.querySelector('.color-debug');
    if (existing) existing.remove();
    
    // Styling pro debug panel
    debugDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 10px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 250px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        border: 1px solid #333;
    `;
    
    document.body.appendChild(debugDiv);
    
    console.log('🎨 IMPROVED color debug panel shown');
}

// ========================================
// OPRAVA: GLOBÁLNÍ FUNKCE PRO DEBUG
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
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        },
        generateSample: () => {
            const samples = ['Burger Fest', 'ČokoFest', 'Food Festival', 'Vintage Run', 'Street Food Market'];
            samples.forEach(name => {
                const color = getEventColor(name, new Date());
                console.log(`${name}: ${color.background}`);
            });
        },
        testAllStatuses: () => {
            const testEvent = 'Test Event';
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            console.log('Completed:', getEventColor(testEvent, yesterday));
            console.log('Ongoing:', getEventColor(testEvent, today));
            console.log('Planned:', getEventColor(testEvent, tomorrow));
        }
    };
}

// ========================================
// INICIALIZACE PART 4A
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Initializing Part 4A (FIXED Colors)...');
    
    // Přidání stylů
    addColorSystemStyles();
    
    // Inicializace palety
    if (calendarState.colorPalette.length === 0) {
        calendarState.colorPalette = generateColorPalette();
    }
    
    console.log('✅ Part 4A (FIXED Colors) initialized');
});

console.log('✅ Donuland Part 4A FIXES loaded successfully');
console.log('🎨 Features: ✅ FIXED Color Palette ✅ IMPROVED Hash Assignment ✅ ENHANCED Status Colors');
console.log('🔧 Debug: window.donulandColors available with test functions');
console.log('⏳ Ready for Part 4B: FIXED Event Processing & Deduplication');

// Event pro signalizaci dokončení oprav části 4A
eventBus.emit('part4aFixed', { 
    timestamp: Date.now(),
    version: '1.1.0-fixed',
    features: ['fixed-color-system', 'improved-hash-assignment', 'enhanced-status-colors', 'better-debug-tools'],
    fixes: ['status-based-colors', 'improved-hash-function', 'better-event-display', 'enhanced-tooltips']
});
/* ========================================
   DONULAND PART 4B - OPRAVY
   Event Processing & Deduplication
   ======================================== */

console.log('🔧 Loading Donuland Part 4B FIXES...');

// ========================================
// PRIORITA 1: OPRAVA normalizeCategory()
// ========================================

// KOMPLETNĚ OPRAVENÁ funkce pro normalizaci kategorií ze Sheets
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
// PRIORITA 1: NOVÁ FUNKCE determineEventStatus()
// ========================================

// KOMPLETNĚ NOVÁ funkce pro přesné určení statusu události
function determineEventStatus(dateFrom, dateTo) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetuj čas na půlnoc
        
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
            eventEnd = eventStart;
            eventEnd.setHours(23, 59, 59, 999);
        }
        
        // Kontrola validity dat
        if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
            console.warn('⚠️ Invalid date for status determination:', { dateFrom, dateTo });
            return 'unknown';
        }
        
        // KLÍČOVÁ LOGIKA: Přesné určení statusu
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
// PRIORITA 1: KOMPLETNÍ OPRAVA getEventsForDate()
// ========================================

// ZCELA PŘEPSANÁ funkce pro získání událostí s OPRAVENÝMI statusy
function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const eventMap = new Map(); // Pro detekci duplicit
    
    if (globalState.debugMode) {
        console.log(`📅 Getting events for date: ${dateStr}`);
    }
    
    try {
        // 1. HISTORICKÉ AKCE z globálních dat (ze Sheets) - KOMPLETNÍ OPRAVA
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            globalState.historicalData.forEach(record => {
                if (isDateInRange(dateStr, record.dateFrom, record.dateTo)) {
                    const eventKey = createEventKey(record.eventName, record.city, record.dateFrom);
                    
                    // KRITICKÁ OPRAVA: SPRÁVNÉ určení statusu podle SKUTEČNÉHO data
                    const status = determineEventStatus(record.dateFrom, record.dateTo);
                    
                    // KRITICKÁ OPRAVA: Použij opravenou normalizeCategory
                    const normalizedCategory = normalizeCategory(record.category);
                    
                    const event = {
                        id: `historical-${record.rowIndex}`,
                        type: 'historical',
                        status: status,  // ← OPRAVENO: Skutečný status místo "completed"
                        title: record.eventName,
                        city: record.city,
                        category: normalizedCategory, // ← OPRAVENO: Použij správnou normalizaci
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
                        console.log(`📊 Historical event: ${event.title} - Status: ${status} - Category: ${normalizedCategory}`);
                    }
                }
            });
        }
        
        // 2. ULOŽENÉ PREDIKCE z localStorage - OPRAVENÉ
        try {
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
                        
                        if (globalState.debugMode) {
                            console.log(`🔗 Merged prediction with historical event: ${existingEvent.title}`);
                        }
                    } else {
                        // NOVÁ PREDIKCE: Vytvoř novou predikční akci
                        // KRITICKÁ OPRAVA: SPRÁVNÉ určení statusu podle data
                        const status = determineEventStatus(
                            prediction.formData.eventDateFrom, 
                            prediction.formData.eventDateTo
                        );
                        
                        const event = {
                            id: `prediction-${prediction.id}`,
                            type: 'prediction',
                            status: status,  // ← OPRAVENO: Skutečný status místo "planned"
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
                        
                        if (globalState.debugMode) {
                            console.log(`🔮 Prediction event: ${event.title} - Status: ${status}`);
                        }
                    }
                }
            });
        } catch (error) {
            console.warn('⚠️ Error processing predictions:', error);
        }
        
        // 3. MANUÁLNĚ PŘIDANÉ UDÁLOSTI - OPRAVENÉ
        try {
            const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
            manualEvents.forEach(event => {
                if (isDateInRange(dateStr, event.dateFrom, event.dateTo)) {
                    const eventKey = createEventKey(event.eventName, event.city, event.dateFrom);
                    
                    if (!eventMap.has(eventKey)) {
                        // KRITICKÁ OPRAVA: SPRÁVNÉ určení statusu podle data
                        const status = determineEventStatus(event.dateFrom, event.dateTo);
                        
                        const newEvent = {
                            id: `manual-${event.id}`,
                            type: 'manual',
                            status: status,  // ← OPRAVENO: Skutečný status
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
                        
                        if (globalState.debugMode) {
                            console.log(`✏️ Manual event: ${newEvent.title} - Status: ${status}`);
                        }
                    }
                }
            });
        } catch (error) {
            console.warn('⚠️ Error processing manual events:', error);
        }
        
    } catch (error) {
        console.warn('⚠️ Error getting events for date:', dateStr, error);
    }
    
    // APLIKACE FILTRŮ - OPRAVENÉ
    const filteredEvents = Array.from(eventMap.values()).filter(event => {
        // Filtr města - case insensitive
        if (calendarState.filters.city) {
            const filterCity = calendarState.filters.city.toLowerCase().trim();
            const eventCity = (event.city || '').toLowerCase().trim();
            if (eventCity !== filterCity) return false;
        }
        
        // Filtr kategorie - přesné porovnání
        if (calendarState.filters.category) {
            if (event.category !== calendarState.filters.category) return false;
        }
        
        // KRITICKÁ OPRAVA: Filtr statusu - zahrnout "ongoing" do "planned"
        if (calendarState.filters.status) {
            if (calendarState.filters.status === 'planned') {
                // "Planned" zahrnuje i "ongoing" akce
                if (event.status !== 'planned' && event.status !== 'ongoing') return false;
            } else if (calendarState.filters.status === 'completed') {
                if (event.status !== 'completed') return false;
            } else {
                // Přesné porovnání pro ostatní statusy
                if (event.status !== calendarState.filters.status) return false;
            }
        }
        
        return true;
    });
    
    if (globalState.debugMode && filteredEvents.length > 0) {
        console.log(`📅 Events for ${dateStr} after filtering:`, filteredEvents.map(e => ({
            title: e.title,
            status: e.status,
            category: e.category,
            source: e.source
        })));
    }
    
    return filteredEvents;
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

// OPRAVENÁ funkce pro kontrolu, zda datum spadá do rozsahu události
function isDateInRange(checkDate, fromDate, toDate) {
    if (!fromDate) {
        if (globalState.debugMode) {
            console.warn('⚠️ Missing fromDate for range check:', { checkDate, fromDate, toDate });
        }
        return false;
    }
    
    // Pokud není toDate, použij fromDate
    const actualToDate = toDate || fromDate;
    
    try {
        const check = new Date(checkDate + 'T00:00:00');
        const from = new Date(fromDate + 'T00:00:00');
        const to = new Date(actualToDate + 'T23:59:59');
        
        // Kontrola validity dat
        if (isNaN(check.getTime()) || isNaN(from.getTime()) || isNaN(to.getTime())) {
            if (globalState.debugMode) {
                console.warn('⚠️ Invalid dates in range check:', { checkDate, fromDate, actualToDate });
            }
            return false;
        }
        
        // Datum musí být mezi from a to (včetně)
        const inRange = check >= from && check <= to;
        
        if (globalState.debugMode && inRange) {
            console.log(`📅 Date in range: ${checkDate} is between ${fromDate} and ${actualToDate}`);
        }
        
        return inRange;
        
    } catch (error) {
        console.warn('⚠️ Date parsing error in range check:', { checkDate, fromDate, actualToDate, error });
        return false;
    }
}

// ========================================
// OPRAVA: VYLEPŠENÉ VYTVOŘENÍ KALENDÁŘNÍHO DNE
// ========================================

// AKTUALIZOVANÁ funkce pro vytvoření prvku kalendářního dne s OPRAVENÝMI statusy
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
    
    // OPRAVENÝ seznam událostí s SPRÁVNÝMI statusy
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    dayData.events.slice(0, 4).forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        
        // ZÍSKÁNÍ BARVY PRO UDÁLOST s OPRAVENÝMI statusy
        const colorInfo = getEventColor(event.title, dayData.date);
        
        // APLIKACE BAREV A STYLŮ
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
        
        // OPRAVENÝ text události s SPRÁVNÝMI ikonami podle statusu
        let eventText = event.title;
        let statusIcon;
        
        // KLÍČOVÁ OPRAVA: Ikony podle SKUTEČNÉHO statusu
        switch (event.status) {
            case 'completed':
                statusIcon = '✅';
                break;
            case 'ongoing':
                statusIcon = '🔥';
                break;
            case 'planned':
                statusIcon = '🔮';
                break;
            default:
                statusIcon = '❓';
        }
        
        // SPECIÁLNÍ OZNAČENÍ PRO RŮZNÉ TYPY AKCÍ
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
        
        // OPRAVENÝ tooltip s AKTUÁLNÍMI informacemi
        const tooltipInfo = [
            `📋 ${event.title}`,
            `📍 ${event.city}`,
            `🏷️ ${event.category}`,
            `📊 Status: ${getStatusText(event.status)}`,
            event.sales ? `🍩 Prodáno: ${formatNumber(event.sales)} ks` : '',
            event.predictedSales ? `🔮 Predikce: ${formatNumber(event.predictedSales)} ks` : '',
            event.confidence ? `🎯 Confidence: ${event.confidence}%` : '',
            event.visitors ? `👥 Návštěvnost: ${formatNumber(event.visitors)}` : '',
            `📅 ${formatDate(event.dateFrom)}${event.dateTo && event.dateTo !== event.dateFrom ? ` - ${formatDate(event.dateTo)}` : ''}`,
            `📂 Zdroj: ${getSourceText(event.source)}`
        ].filter(Boolean).join('\n');
        
        eventElement.title = tooltipInfo;
        
        // CSS třídy pro různé typy a stavy
        eventElement.classList.add(event.status || 'unknown');
        eventElement.classList.add(event.type || 'unknown');
        
        // Hover efekt
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
        
        // Click handler pro editaci události
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('📅 Event clicked:', event);
            openEventModal(event);
        });
        
        eventsContainer.appendChild(eventElement);
    });
    
    // Indikátor dalších událostí
    if (dayData.events.length > 4) {
        const moreIndicator = document.createElement('div');
        moreIndicator.className = 'event-item more';
        moreIndicator.textContent = `+${dayData.events.length - 4} dalších`;
        moreIndicator.style.background = '#6c757d';
        moreIndicator.style.color = '#ffffff';
        moreIndicator.style.fontWeight = '600';
        moreIndicator.style.padding = '3px 6px';
        moreIndicator.style.borderRadius = '4px';
        moreIndicator.style.fontSize = '0.7rem';
        moreIndicator.style.cursor = 'pointer';
        moreIndicator.style.textAlign = 'center';
        
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
            console.log('📅 Day clicked for new event:', dayData.date);
            openEventModal(null, dayData.date);
        }
    });
    
    return dayElement;
}

// ========================================
// CSS ROZŠÍŘENÍ PRO PART 4B
// ========================================

// Přidání CSS stylů pro vylepšené event processing
function addEventProcessingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* OPRAVENÉ Event source indicators */
        .event-item.historical {
            border-left-width: 4px !important;
            border-left-style: solid !important;
        }
        
        .event-item.prediction {
            border-left-style: dashed !important;
            border-left-width: 3px !important;
        }
        
        .event-item.manual {
            border-left-style: dotted !important;
            border-left-width: 3px !important;
        }
        
        /* OPRAVENÉ status indicators */
        .event-item.completed {
            opacity: 0.9;
            border-right: 2px solid #28a745;
        }
        
        .event-item.ongoing {
            animation: ongoingGlow 2s infinite;
            border-right: 2px solid #ffc107;
        }
        
        @keyframes ongoingGlow {
            0%, 100% { box-shadow: 0 0 3px rgba(255, 193, 7, 0.5); }
            50% { box-shadow: 0 0 8px rgba(255, 193, 7, 0.8); }
        }
        
        .event-item.planned {
            border-right: 2px solid #17a2b8;
        }
        
        .event-item.unknown {
            opacity: 0.7;
            border-right: 2px solid #6c757d;
        }
        
        /* Enhanced tooltips with better positioning */
        .event-item[title]:hover {
            position: relative;
            z-index: 1000;
        }
        
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
            z-index: 1001;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
            margin-bottom: 5px;
        }
        
        /* Arrow for tooltip */
        .event-item[title]:hover::before {
            content: '';
            position: absolute;
            bottom: 95%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: rgba(0,0,0,0.9);
            z-index: 1001;
        }
        
        /* Mobile responsive event items */
        @media (max-width: 768px) {
            .event-item[title]:hover::after {
                position: fixed;
                bottom: 20px;
                left: 10px;
                right: 10px;
                max-width: none;
                transform: none;
            }
            
            .event-item[title]:hover::before {
                display: none;
            }
        }
        
        /* Debug indicators */
        .event-item.debug {
            outline: 2px dashed #ff0000;
        }
        
        .event-item.debug::after {
            content: 'DEBUG';
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff0000;
            color: white;
            font-size: 0.6rem;
            padding: 2px 4px;
            border-radius: 2px;
        }
        
        /* Category-based styling hints */
        .event-item[data-category="food festival"] {
            border-bottom: 2px solid #ff6b6b;
        }
        
        .event-item[data-category="veletrh"] {
            border-bottom: 2px solid #4ecdc4;
        }
        
        .event-item[data-category="koncert"] {
            border-bottom: 2px solid #45b7d1;
        }
        
        .event-item[data-category="kulturní akce"] {
            border-bottom: 2px solid #96ceb4;
        }
        
        .event-item[data-category="sportovní"] {
            border-bottom: 2px solid #ffeaa7;
        }
        
        .event-item[data-category="ostatní"] {
            border-bottom: 2px solid #ddd;
        }
    `;
    
    document.head.appendChild(style);
    console.log('📋 FIXED event processing styles added');
}

// ========================================
// OPRAVA: POPUP PRO ZOBRAZENÍ VŠECH UDÁLOSTÍ DNE
// ========================================

// OPRAVENÁ funkce pro zobrazení popup s událostmi pro den
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
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #666; padding: 5px;">&times;</button>
        </div>
        <div style="max-height: 500px; overflow-y: auto;">
    `;
    
    if (events.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📅</div>
                <h4>Žádné události v tento den</h4>
                <p>Klikněte na den v kalendáři pro přidání nové akce</p>
            </div>
        `;
    } else {
        events.forEach(event => {
            const colorInfo = getEventColor(event.title, date);
            
            // OPRAVENÉ typ a label události s SPRÁVNÝMI statusy
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
            
            // OPRAVENÉ speciální badges
            const predictionBadge = event.hasPrediction ? 
                '<span style="background: #17a2b8; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.75em; margin-left: 8px;">🔮 + Predikce</span>' : '';
            
            const confidenceBadge = event.confidence ? 
                `<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.75em; margin-left: 8px;">🎯 ${event.confidence}%</span>` : '';
            
            // Accuracy pro dokončené predikce
            let accuracyInfo = '';
            if (event.type === 'prediction' && event.status === 'completed' && event.actualSales > 0 && event.predictedSales > 0) {
                const accuracy = Math.abs(1 - Math.abs(event.predictedSales - event.actualSales) / event.actualSales) * 100;
                const accuracyColor = accuracy > 80 ? '#28a745' : accuracy > 60 ? '#ffc107' : '#dc3545';
                accuracyInfo = `
                    <div style="background: ${accuracyColor}; color: white; padding: 8px 12px; border-radius: 6px; margin-top: 10px; font-size: 0.85em;">
                        📊 Přesnost predikce: ${accuracy.toFixed(0)}% 
                        (predikce: ${formatNumber(event.predictedSales)}, skutečnost: ${formatNumber(event.actualSales)})
                    </div>
                `;
            }
            
            html += `
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
                    
                    ${accuracyInfo}
                    
                    <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="openEventModalFromPopup('${event.type}', '${event.id}'); this.closest('.day-events-popup').remove();" 
                                style="padding: 8px 16px; background: rgba(255,255,255,0.3); color: ${colorInfo.textColor}; border: 1px solid rgba(255,255,255,0.4); border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: 600; transition: all 0.2s;">
                            ✏️ Detail & Editace
                        </button>
                        ${event.type === 'prediction' ? `
                            <button onclick="duplicatePrediction('${event.data.id}'); this.closest('.day-events-popup').remove();" 
                                    style="padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: 600;">
                                📋 Kopírovat predikci
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    }
    
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

// ========================================
// INICIALIZACE PART 4B
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Initializing Part 4B FIXES (Events)...');
    
    // Přidání stylů
    addEventProcessingStyles();
    
    console.log('✅ Part 4B FIXES (Events) initialized');
});

// ========================================
// DEBUG FUNKCE PRO PART 4B
// ========================================

// Debug funkce pro testování event processingu
function debugEventProcessing() {
    console.log('🔍 DEBUG: Event Processing Analysis');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('❌ No historical data available for debugging');
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
    
    // Test event keys
    console.group('🔑 Event Key Generation Test');
    const testEvents = [
        { name: 'Burger Festival', city: 'Praha', date: '2024-12-15' },
        { name: 'burger festival', city: 'praha', date: '2024-12-15' },
        { name: 'Burger  Festival', city: 'Praha ', date: '2024-12-15' }
    ];
    
    testEvents.forEach(event => {
        const key = createEventKey(event.name, event.city, event.date);
        console.log(`"${event.name}" + "${event.city}" + "${event.date}" → "${key}"`);
    });
    console.groupEnd();
    
    // Analýza skutečných dat
    console.group('📊 Real Data Analysis');
    const sampleData = globalState.historicalData.slice(0, 5);
    sampleData.forEach(record => {
        const normalized = normalizeCategory(record.category);
        const status = determineEventStatus(record.dateFrom, record.dateTo);
        console.log(`Event: ${record.eventName} | Category: ${record.category} → ${normalized} | Status: ${status}`);
    });
    console.groupEnd();
    
    return {
        totalRecords: globalState.historicalData.length,
        sampleProcessed: sampleData.length,
        timestamp: new Date().toISOString()
    };
}

// Export debug funkce
if (typeof window !== 'undefined') {
    window.donulandPart4BDebug = {
        debugEventProcessing,
        testCategoryNormalization: (category) => normalizeCategory(category),
        testStatusDetermination: (dateFrom, dateTo) => determineEventStatus(dateFrom, dateTo),
        testEventKey: (name, city, date) => createEventKey(name, city, date),
        getEventsForToday: () => getEventsForDate(new Date()),
        showSamplePopup: () => {
            const today = new Date();
            const events = getEventsForDate(today);
            showDayEventsPopup(today, events);
        }
    };
}

console.log('✅ Donuland Part 4B FIXES loaded successfully');
console.log('📋 Features: ✅ FIXED Category Normalization ✅ FIXED Status Determination ✅ FIXED Event Deduplication');
console.log('🔧 CRITICAL FIXES: ✅ Burger Festival → food festival ✅ Real-time status calculation ✅ Proper event filtering');
console.log('🐛 Debug: window.donulandPart4BDebug available');
console.log('⏳ Ready for Part 4C: FIXED Calendar Filters & Month View');

// Event pro signalizaci dokončení oprav části 4B
eventBus.emit('part4bFixed', { 
    timestamp: Date.now(),
    version: '1.1.0-fixed',
    features: ['fixed-category-normalization', 'fixed-status-determination', 'fixed-event-deduplication', 'enhanced-popup'],
    criticalFixes: ['burger-festival-mapping', 'real-time-status', 'proper-filtering', 'improved-tooltips']
});
/* ========================================
   DONULAND PART 4B - OPRAVA PROBLÉMU S DATUMY
   Kritická oprava pro správné zobrazení rozsahu akcí
   ======================================== */

console.log('🔧 Applying CRITICAL DATE FIX for Part 4B...');

// ========================================
// KRITICKÁ OPRAVA: isDateInRange()
// ========================================

// KOMPLETNĚ PŘEPSANÁ funkce pro kontrolu rozsahu dat
function isDateInRange(checkDate, fromDate, toDate) {
    if (!fromDate) {
        if (globalState.debugMode) {
            console.warn('⚠️ Missing fromDate for range check:', { checkDate, fromDate, toDate });
        }
        return false;
    }
    
    // Pokud není toDate, použij fromDate (jednodenní akce)
    const actualToDate = toDate && toDate.trim() ? toDate : fromDate;
    
    try {
        // KLÍČOVÁ OPRAVA: Vytvoř všechna data v LOCAL timezone bez času
        // Použij pouze datum bez času pro eliminaci timezone problémů
        const checkDateObj = new Date(checkDate + 'T12:00:00'); // Poledne = střed dne
        const fromDateObj = new Date(fromDate + 'T12:00:00');
        const toDateObj = new Date(actualToDate + 'T12:00:00');
        
        // Resetuj všechna data na stejný čas (poledne) pro konzistentní porovnání
        checkDateObj.setHours(12, 0, 0, 0);
        fromDateObj.setHours(12, 0, 0, 0);
        toDateObj.setHours(12, 0, 0, 0);
        
        // Kontrola validity dat
        if (isNaN(checkDateObj.getTime()) || isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
            if (globalState.debugMode) {
                console.warn('⚠️ Invalid dates in range check:', { 
                    checkDate, fromDate, actualToDate,
                    checkValid: !isNaN(checkDateObj.getTime()),
                    fromValid: !isNaN(fromDateObj.getTime()),
                    toValid: !isNaN(toDateObj.getTime())
                });
            }
            return false;
        }
        
        // KRITICKÁ LOGIKA: Datum musí být mezi from a to (VČETNĚ okrajů)
        const inRange = checkDateObj >= fromDateObj && checkDateObj <= toDateObj;
        
        if (globalState.debugMode) {
            console.log(`📅 Date range check: ${checkDate} between ${fromDate} and ${actualToDate} = ${inRange}`);
            console.log(`   Check: ${checkDateObj.toDateString()}`);
            console.log(`   From:  ${fromDateObj.toDateString()}`);
            console.log(`   To:    ${toDateObj.toDateString()}`);
        }
        
        return inRange;
        
    } catch (error) {
        console.warn('⚠️ Date parsing error in range check:', { 
            checkDate, fromDate, actualToDate, error: error.message 
        });
        return false;
    }
}

// ========================================
// DOPLŇUJÍCÍ OPRAVA: parseSheetData()
// ========================================

// VYLEPŠENÁ funkce pro parsování dat ze Sheets s lepším date handlingem
function normalizeDateString(dateStr) {
    if (!dateStr) return null;
    
    // Trim whitespace
    dateStr = dateStr.toString().trim();
    
    // Různé formáty dat, které mohou přijít ze Sheets
    const formats = [
        // ISO formát (preferovaný)
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,          // YYYY-MM-DD
        
        // Evropské formáty
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,        // DD.MM.YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,        // DD/MM/YYYY  
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,          // DD-MM-YYYY
        
        // Americké formáty
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,        // MM/DD/YYYY
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,        // YYYY/MM/DD
    ];
    
    // Zkus ISO formát první
    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Zkus evropské formáty (DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY)
    const euroMatch = dateStr.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (euroMatch) {
        const [, day, month, year] = euroMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Zkus parsovat jako Date objekt
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            // Převeď na ISO format v local timezone
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (error) {
        console.warn('⚠️ Date parsing failed:', dateStr, error);
    }
    
    console.warn('⚠️ Could not parse date:', dateStr);
    return null;
}

// ========================================
// DEBUG FUNKCE PRO TESTOVÁNÍ OPRAVY
// ========================================

// Funkce pro testování date range s konkrétními daty
function testDateRangeFix() {
    console.group('🧪 Testing Date Range Fix');
    
    // Test case z screenshots: Food Day Festival (28.6. - 29.6.)
    const testCases = [
        {
            name: 'Food Day Festival - 27.6.',
            checkDate: '2025-06-27',
            fromDate: '2025-06-28',
            toDate: '2025-06-29',
            expected: false
        },
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
        },
        {
            name: 'Jednodenní akce - správný den',
            checkDate: '2025-06-15',
            fromDate: '2025-06-15',
            toDate: '2025-06-15',
            expected: true
        },
        {
            name: 'Jednodenní akce - špatný den',
            checkDate: '2025-06-16',
            fromDate: '2025-06-15',
            toDate: '2025-06-15',
            expected: false
        }
    ];
    
    testCases.forEach(test => {
        const result = isDateInRange(test.checkDate, test.fromDate, test.toDate);
        const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
        
        console.log(`${status} ${test.name}: ${result} (expected: ${test.expected})`);
        
        if (result !== test.expected) {
            console.error(`   Details: checkDate=${test.checkDate}, fromDate=${test.fromDate}, toDate=${test.toDate}`);
        }
    });
    
    console.groupEnd();
}

// ========================================
// OPRAVA getDaysInMonth() PRO LEPŠÍ PERFORMANCE
// ========================================

// OPTIMALIZOVANÁ funkce pro získání dnů v měsíci
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
    
    // Dny z následujícího měsíce (do úplných 42 dnů)
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
    
    // NOVÉ: Naplň události pro všechny dny najednou (optimalizace)
    days.forEach(dayData => {
        dayData.events = getEventsForDate(dayData.date);
    });
    
    if (globalState.debugMode) {
        const currentMonthDays = days.filter(d => d.isCurrentMonth);
        const totalEvents = days.reduce((sum, d) => sum + d.events.length, 0);
        console.log(`📅 Generated calendar: ${currentMonthDays.length} days in month, ${totalEvents} total events`);
    }
    
    return days;
}

// ========================================
// FORCE REFRESH KALENDÁŘE PO OPRAVĚ
// ========================================

// Funkce pro vynucení refresh kalendáře s opravenými daty
function forceCalendarRefresh() {
    console.log('🔄 Forcing calendar refresh with date fixes...');
    
    try {
        // Vymaž cache událostí
        if (typeof calendarState !== 'undefined') {
            calendarState.filteredEvents = [];
        }
        
        // Re-render kalendář
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
        
        // Update month events list
        if (typeof updateMonthEventsList === 'function') {
            updateMonthEventsList();
        }
        
        console.log('✅ Calendar refreshed with date fixes');
        
    } catch (error) {
        console.error('❌ Error refreshing calendar:', error);
    }
}

// ========================================
// PŘIDÁNÍ DEBUG NÁSTROJŮ
// ========================================

// Export debug funkcí pro testování
if (typeof window !== 'undefined') {
    window.donulandDateFix = {
        testDateRange: testDateRangeFix,
        isDateInRange: isDateInRange,
        normalizeDateString: normalizeDateString,
        forceRefresh: forceCalendarRefresh,
        
        // Test konkrétní akce z screenshots
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
// AUTOMATICKÉ SPUŠTĚNÍ TESTU
// ========================================

// Automaticky spusť test při načtení
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Date fix loaded, running automatic test...');
    
    setTimeout(() => {
        if (globalState.debugMode) {
            testDateRangeFix();
        }
        
        // Force refresh kalendáře
        forceCalendarRefresh();
    }, 1000);
});

console.log('✅ CRITICAL DATE FIX applied successfully');
console.log('🔧 Features: ✅ Fixed timezone issues ✅ Fixed date range logic ✅ Added comprehensive testing');
console.log('🧪 Test: window.donulandDateFix.testFoodDayFestival() to verify fix');
console.log('📅 The Food Day Festival should now appear ONLY on 28.6. and 29.6., NOT on 30.6.');

// Event pro signalizaci aplikování date fix
eventBus.emit('dateFix Applied', { 
    timestamp: Date.now(),
    version: 'date-fix-1.0',
    issue: 'Events appearing on wrong dates due to timezone/date parsing issues',
    solution: 'Improved date parsing with timezone-safe logic and comprehensive testing'
});
