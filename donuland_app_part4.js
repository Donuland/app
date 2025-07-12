/* ========================================
   DONULAND PART 4A - Základní kalendář CLEAN
   Nový, čistý kód bez duplikací
   ======================================== */

console.log('🍩 Donuland Part 4A CLEAN loading...');

// ========================================
// GLOBÁLNÍ STAV A KONTROLA INICIALIZACE
// ========================================

// Kontrolní flagy pro prevenci duplikací
// let calendarInitialized = false; // Moved to Part 4C to avoid conflicts

// Globální stav kalendáře
const calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    events: []
};

// Paleta barev pro události
const EVENT_COLORS = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', 
    '#ff9ff3', '#feca57', '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8'
];

let eventColorIndex = 0;

// ========================================
// UTILITY FUNKCE
// ========================================

// Parsování data z různých formátů
function parseDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    
    // YYYY-MM-DD formát
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateStr + 'T12:00:00');
    }
    
    // DD.MM.YYYY formát
    if (dateStr.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
        const [day, month, year] = dateStr.split('.');
        return new Date(year, month - 1, day, 12, 0, 0);
    }
    
    return new Date(dateStr);
}

// Formátování data na YYYY-MM-DD
function formatDateKey(date) {
    if (!date) return '';
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
}

// Získání unikátní barvy pro událost
function getUniqueEventColor() {
    const color = EVENT_COLORS[eventColorIndex % EVENT_COLORS.length];
    eventColorIndex++;
    return color;
}

// ========================================
// NAČÍTÁNÍ UDÁLOSTÍ
// ========================================

// Hlavní funkce pro načtení všech událostí
function loadCalendarEvents() {
    console.log('📅 Loading calendar events...');
    
    calendarState.events = [];
    eventColorIndex = 0;
    
    // 1. Historická data ze Sheets
    if (typeof globalState !== 'undefined' && globalState.historicalData) {
        globalState.historicalData.forEach((record, index) => {
            const startDate = parseDate(record.dateFrom);
            const endDate = parseDate(record.dateTo || record.dateFrom);
            
            if (startDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                calendarState.events.push({
                    id: 'historical_' + index,
                    title: record.eventName || 'Neznámá akce',
                    startDate: startDate,
                    endDate: endDate,
                    category: record.category || 'ostatní',
                    city: record.city || '',
                    status: endDate < today ? 'completed' : 'planned',
                    source: 'historical',
                    color: getUniqueEventColor(),
                    data: {
                        visitors: record.visitors || 0,
                        sales: record.sales || 0,
                        competition: record.competition || 2,
                        rating: record.rating || 0,
                        notes: record.notes || '',
                        businessModel: record.businessModel || '',
                        price: record.price || 110
                    }
                });
            }
        });
    }
    
    // 2. Uložené predikce z localStorage
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach((prediction, index) => {
            if (prediction.formData) {
                const formData = prediction.formData;
                const startDate = parseDate(formData.eventDateFrom);
                const endDate = parseDate(formData.eventDateTo);
                
                if (startDate) {
                    calendarState.events.push({
                        id: 'prediction_' + index,
                        title: formData.eventName || 'Predikce',
                        startDate: startDate,
                        endDate: endDate,
                        category: formData.category || 'ostatní',
                        city: formData.city || '',
                        status: 'planned',
                        source: 'prediction',
                        color: getUniqueEventColor(),
                        data: {
                            visitors: formData.visitors || 0,
                            predictedSales: prediction.prediction?.predictedSales || 0,
                            confidence: prediction.prediction?.confidence || 0,
                            expectedRevenue: prediction.businessResults?.revenue || 0,
                            expectedProfit: prediction.businessResults?.profit || 0,
                            businessModel: formData.businessModel || '',
                            price: formData.price || 110
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.warn('⚠️ Error loading predictions:', error);
    }
    
    // 3. Aktuální predikce (pokud není uložena)
    if (typeof globalState !== 'undefined' && globalState.lastPrediction && 
        !globalState.lastPrediction.saved && globalState.lastPrediction.formData) {
        
        const formData = globalState.lastPrediction.formData;
        const startDate = parseDate(formData.eventDateFrom);
        const endDate = parseDate(formData.eventDateTo);
        
        if (startDate) {
            calendarState.events.push({
                id: 'current_prediction',
                title: formData.eventName || 'Aktuální predikce',
                startDate: startDate,
                endDate: endDate,
                category: formData.category || 'ostatní',
                city: formData.city || '',
                status: 'planned',
                source: 'current',
                color: getUniqueEventColor(),
                data: {
                    visitors: formData.visitors || 0,
                    predictedSales: globalState.lastPrediction.prediction?.predictedSales || 0,
                    confidence: globalState.lastPrediction.prediction?.confidence || 0,
                    expectedRevenue: globalState.lastPrediction.businessResults?.revenue || 0,
                    expectedProfit: globalState.lastPrediction.businessResults?.profit || 0,
                    businessModel: formData.businessModel || '',
                    price: formData.price || 110
                }
            });
        }
    }
    
    console.log(`✅ Loaded ${calendarState.events.length} calendar events`);
}

// ========================================
// GENEROVÁNÍ KALENDÁŘE
// ========================================

// Aktualizace zobrazení aktuálního měsíce
function updateCurrentMonthDisplay() {
    const monthNames = [
        'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
    ];
    
    const currentMonthElement = document.getElementById('currentMonth');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${monthNames[calendarState.currentMonth]} ${calendarState.currentYear}`;
    }
}

// Generování kalendářové mřížky
function generateCalendarGrid() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Hlavička s názvy dnů
    const dayNames = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
    dayNames.forEach(dayName => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = dayName;
        calendarGrid.appendChild(header);
    });
    
    // První den měsíce
    const firstDay = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
    const lastDay = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Kolik prázdných buněk na začátku (pondělí = 0)
    let startEmpty = firstDay.getDay() - 1;
    if (startEmpty < 0) startEmpty = 6; // Neděle
    
    // Předchozí měsíc
    const prevMonth = new Date(calendarState.currentYear, calendarState.currentMonth, 0);
    for (let i = startEmpty - 1; i >= 0; i--) {
        const dayNumber = prevMonth.getDate() - i;
        const dayCell = createDayCell(dayNumber, true, calendarState.currentMonth - 1);
        calendarGrid.appendChild(dayCell);
    }
    
    // Aktuální měsíc
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = createDayCell(day, false, calendarState.currentMonth);
        calendarGrid.appendChild(dayCell);
    }
    
    // Následující měsíc (do 42 buněk)
    const totalCells = calendarGrid.children.length - 7; // -7 pro hlavičku
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayCell = createDayCell(day, true, calendarState.currentMonth + 1);
        calendarGrid.appendChild(dayCell);
    }
    
    displayEventsInCalendar();
}

// Vytvoření buňky dne
function createDayCell(dayNumber, isOtherMonth, month) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayCell.classList.add('other-month');
    }
    
    // Datum buňky
    const cellDate = new Date(calendarState.currentYear, month, dayNumber);
    const dateKey = formatDateKey(cellDate);
    dayCell.dataset.date = dateKey;
    
    // Dnes
    const today = new Date();
    if (formatDateKey(cellDate) === formatDateKey(today)) {
        dayCell.classList.add('today');
    }
    
    // Číslo dne
    const dayNumberEl = document.createElement('div');
    dayNumberEl.className = 'day-number';
    dayNumberEl.textContent = dayNumber;
    dayCell.appendChild(dayNumberEl);
    
    // Kontejner pro události
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    dayCell.appendChild(eventsContainer);
    
    // Klik na den
    dayCell.addEventListener('click', () => {
        showDayModal(cellDate);
    });
    
    return dayCell;
}

// Zobrazení událostí v kalendáři
function displayEventsInCalendar() {
    // Vyčištění všech událostí
    document.querySelectorAll('.day-events').forEach(container => {
        container.innerHTML = '';
    });
    
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('has-events');
    });
    
    // Seskupení událostí podle datumů
    const eventsByDate = {};
    
    calendarState.events.forEach(event => {
        const startDate = event.startDate;
        const endDate = event.endDate;
        
        // Pro vícedenní události
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = formatDateKey(currentDate);
            
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            
            eventsByDate[dateKey].push(event);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });
    
    // Zobrazení v kalendáři
    Object.entries(eventsByDate).forEach(([dateKey, events]) => {
        const dayCell = document.querySelector(`[data-date="${dateKey}"]`);
        if (!dayCell) return;
        
        const eventsContainer = dayCell.querySelector('.day-events');
        if (!eventsContainer) return;
        
        dayCell.classList.add('has-events');
        
        // Zobrazit max 3 události + počet zbývajících
        const visibleEvents = events.slice(0, 3);
        const hiddenCount = events.length - visibleEvents.length;
        
        visibleEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            eventElement.style.backgroundColor = event.color;
            eventElement.style.color = '#fff';
            eventElement.textContent = event.title;
            eventElement.title = `${event.title} - ${event.city}`;
            
            // Ikona pro dokončené akce
            if (event.status === 'completed') {
                eventElement.textContent = '✓ ' + event.title;
            }
            
            eventsContainer.appendChild(eventElement);
        });
        
        // Počet dalších akcí
        if (hiddenCount > 0) {
            const moreElement = document.createElement('div');
            moreElement.className = 'event-item more-events';
            moreElement.style.backgroundColor = '#6c757d';
            moreElement.style.color = '#fff';
            moreElement.textContent = `+${hiddenCount} další`;
            eventsContainer.appendChild(moreElement);
        }
    });
}

// ========================================
// NAVIGACE KALENDÁŘE
// ========================================

// Změna měsíce
function changeMonth(direction) {
    calendarState.currentMonth += direction;
    
    if (calendarState.currentMonth > 11) {
        calendarState.currentMonth = 0;
        calendarState.currentYear++;
    } else if (calendarState.currentMonth < 0) {
        calendarState.currentMonth = 11;
        calendarState.currentYear--;
    }
    
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    
    console.log(`📅 Calendar changed to: ${calendarState.currentMonth + 1}/${calendarState.currentYear}`);
}

// Přechod na dnešní měsíc
function goToToday() {
    const today = new Date();
    calendarState.currentMonth = today.getMonth();
    calendarState.currentYear = today.getFullYear();
    
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    
    if (typeof showNotification === 'function') {
        showNotification('📅 Přešli jste na aktuální měsíc', 'info', 2000);
    }
}

// ========================================
// MODAL FUNKCIONALITA
// ========================================

// Modal se všemi akcemi daného dne
function showDayModal(date) {
    const dateKey = formatDateKey(date);
    const dayEvents = calendarState.events.filter(event => {
        const startKey = formatDateKey(event.startDate);
        const endKey = formatDateKey(event.endDate);
        return dateKey >= startKey && dateKey <= endKey;
    });
    
    if (dayEvents.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('📅 Žádné události v tomto dni', 'info', 2000);
        }
        return;
    }
    
    // Vytvoření modalu
    const modal = document.createElement('div');
    modal.className = 'modal day-modal';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>📅 ${date.toLocaleDateString('cs-CZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })} (${dayEvents.length} akcí)</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="day-events-list"></div>
        </div>
    `;
    
    const eventsList = modalContent.querySelector('.day-events-list');
    
    dayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'day-event-item';
        eventItem.style.borderLeft = `4px solid ${event.color}`;
        
        const statusIcon = event.status === 'completed' ? '✅' : '📅';
        const sourceIcon = event.source === 'historical' ? '📈' : event.source === 'prediction' ? '💾' : '🎯';
        
        eventItem.innerHTML = `
            <div class="event-header">
                <h4>${escapeHtml(event.title)}</h4>
                <div class="event-meta">
                    ${statusIcon} ${event.status === 'completed' ? 'Dokončeno' : 'Naplánováno'} • 
                    ${sourceIcon} ${event.source === 'historical' ? 'Historická data' : 'Predikce'} • 
                    📍 ${escapeHtml(event.city)} • 📋 ${escapeHtml(event.category)}
                </div>
            </div>
            <div class="event-stats">
                ${event.data.visitors ? `<span>👥 ${formatNumber(event.data.visitors)} návštěvníků</span>` : ''}
                ${event.data.sales ? `<span>🍩 ${formatNumber(event.data.sales)} ks prodáno</span>` : ''}
                ${event.data.predictedSales ? `<span>🎯 ${formatNumber(event.data.predictedSales)} ks predikce</span>` : ''}
            </div>
            <div class="event-actions">
                <button class="btn btn-detail" onclick="showEventDetail('${event.id}')">📋 Detail</button>
            </div>
        `;
        
        eventsList.appendChild(eventItem);
    });
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Zavření modalu
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Detail konkrétní akce
function showEventDetail(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    // Zavřít předchozí modal
    document.querySelectorAll('.day-modal').forEach(modal => modal.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal event-detail-modal';
    modal.style.display = 'flex';
    
    const isCompleted = event.status === 'completed';
    const isPrediction = event.source !== 'historical';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 ${escapeHtml(event.title)}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="event-detail-grid">
                    <div class="detail-item">
                        <label>Název akce:</label>
                        <span>${escapeHtml(event.title)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Kategorie:</label>
                        <span>${escapeHtml(event.category)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Město:</label>
                        <span>${escapeHtml(event.city)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Datum:</label>
                        <span>${event.startDate.toLocaleDateString('cs-CZ')} - ${event.endDate.toLocaleDateString('cs-CZ')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Návštěvníci:</label>
                        <span>${formatNumber(event.data.visitors)}</span>
                    </div>
                    ${isCompleted ? `
                        <div class="detail-item">
                            <label>Reálně prodáno:</label>
                            <span>${formatNumber(event.data.sales || 0)} ks</span>
                        </div>
                    ` : `
                        <div class="detail-item">
                            <label>Predikce prodeje:</label>
                            <span>${formatNumber(event.data.predictedSales || 0)} ks</span>
                        </div>
                        <div class="detail-item">
                            <label>Confidence:</label>
                            <span>${event.data.confidence || 0}%</span>
                        </div>
                    `}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="this.closest('.modal').remove()">Zavřít</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ========================================
// HLAVNÍ INICIALIZACE
// ========================================

// Hlavní inicializační funkce
function initializeCalendar() {
    if (calendarInitialized) {
        console.log('⚠️ Calendar already initialized, skipping...');
        return;
    }
    
    console.log('🔧 Initializing calendar...');
    
    loadCalendarEvents();
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    
    calendarInitialized = true;
    console.log('✅ Calendar initialization complete');
}

// ========================================
// EVENT LISTENERS
// ========================================

// Event listenery pro externí systémy
if (typeof eventBus !== 'undefined') {
    
    eventBus.on('dataLoaded', () => {
        console.log('📊 Data loaded, updating calendar');
        setTimeout(() => {
            if (calendarInitialized) {
                loadCalendarEvents();
                generateCalendarGrid();
            } else {
                initializeCalendar();
            }
        }, 500);
    });
    
    eventBus.on('predictionSaved', () => {
        console.log('💾 Prediction saved, updating calendar');
        setTimeout(() => {
            loadCalendarEvents();
            if (calendarInitialized) {
                generateCalendarGrid();
            }
        }, 500);
    });
    
    eventBus.on('calendarRequested', () => {
        console.log('📅 Calendar section requested');
        if (!calendarInitialized) {
            initializeCalendar();
        }
    });
}

// DOM ready listener
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (document.getElementById('calendar') && !calendarInitialized) {
            console.log('📅 DOM ready - calendar section found');
            initializeCalendar();
        }
    }, 2000);
});

// ========================================
// GLOBÁLNÍ EXPORT
// ========================================

// Export funkcí pro HTML onclick handlery
if (typeof window !== 'undefined') {
    window.changeMonth = changeMonth;
    window.goToToday = goToToday;
    window.showEventDetail = showEventDetail;
    window.initializeCalendar = initializeCalendar;
    
    // Debug
    window.calendarDebug = {
        state: calendarState,
        initialized: () => calendarInitialized,
        reinit: () => {
            calendarInitialized = false;
            initializeCalendar();
        }
    };
}

console.log('✅ Donuland Part 4A CLEAN loaded successfully');
console.log('📅 Basic calendar features: Events display, Navigation, Modal details');
console.log('🔧 Debug: window.calendarDebug available');
/* ========================================
   DONULAND PART 4B - Filtry a měsíční přehled CLEAN
   Přidat na konec Part 4A
   ======================================== */

console.log('🍩 Donuland Part 4B CLEAN loading...');

// ========================================
// STAV FILTRŮ
// ========================================

// Stav filtrů
const calendarFilters = {
    category: '',
    status: '',
    source: '',
    searchText: ''
};

// Filtrované události
let filteredEvents = [];

// Kategorie ze Sheets
const CATEGORIES = [
    'food festival',
    'veletrh', 
    'koncert',
    'kulturní akce',
    'sportovní',
    'ostatní'
];

// ========================================
// INICIALIZACE FILTRŮ
// ========================================

// Inicializace dropdown filtrů
function initializeCalendarFilters() {
    console.log('🔍 Initializing calendar filters...');
    
    // Kategorie filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">📋 Všechny kategorie</option>';
        
        // Dynamické kategorie z aktuálních událostí
        const eventCategories = [...new Set(calendarState.events.map(e => e.category))].sort();
        eventCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.innerHTML = `
            <option value="">📊 Všechny stavy</option>
            <option value="completed">✅ Dokončené</option>
            <option value="planned">🔮 Naplánované</option>
        `;
    }
    
    // Source filter
    const sourceFilter = document.getElementById('sourceFilter');
    if (sourceFilter) {
        sourceFilter.innerHTML = `
            <option value="">🔗 Všechny zdroje</option>
            <option value="historical">📈 Historická data</option>
            <option value="prediction">💾 Predikce</option>
        `;
    }
    
    console.log('✅ Calendar filters initialized');
}

// ========================================
// FILTROVACÍ LOGIKA
// ========================================

// Hlavní filtrovací funkce
function filterCalendar() {
    console.log('🔍 Filtering calendar events...');
    
    // Načtení hodnot z filtrů
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    
    if (categoryFilter) calendarFilters.category = categoryFilter.value;
    if (statusFilter) calendarFilters.status = statusFilter.value;
    if (sourceFilter) calendarFilters.source = sourceFilter.value;
    
    // Aplikace filtrů
    filteredEvents = calendarState.events.filter(event => {
        // Kategorie filter
        if (calendarFilters.category && event.category !== calendarFilters.category) {
            return false;
        }
        
        // Status filter
        if (calendarFilters.status && event.status !== calendarFilters.status) {
            return false;
        }
        
        // Source filter
        if (calendarFilters.source) {
            if (calendarFilters.source === 'historical' && event.source !== 'historical') {
                return false;
            }
            if (calendarFilters.source === 'prediction' && event.source === 'historical') {
                return false;
            }
        }
        
        // Text search filter
        if (calendarFilters.searchText) {
            const searchableText = [
                event.title,
                event.category,
                event.city,
                event.data.notes || ''
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(calendarFilters.searchText.toLowerCase())) {
                return false;
            }
        }
        
        return true;
    });
    
    // Zobrazení filtrovaných událostí
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
    
    console.log(`🔍 Filtered ${filteredEvents.length} events from ${calendarState.events.length} total`);
}

// Zobrazení filtrovaných událostí v kalendáři
function displayFilteredEventsInCalendar() {
    // Vyčištění všech událostí
    document.querySelectorAll('.day-events').forEach(container => {
        container.innerHTML = '';
    });
    
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('has-events');
    });
    
    // Seskupení filtrovaných událostí podle datumů
    const eventsByDate = {};
    
    filteredEvents.forEach(event => {
        const startDate = event.startDate;
        const endDate = event.endDate;
        
        // Pro vícedenní události
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = formatDateKey(currentDate);
            
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            
            eventsByDate[dateKey].push(event);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });
    
    // Zobrazení v kalendáři
    Object.entries(eventsByDate).forEach(([dateKey, events]) => {
        const dayCell = document.querySelector(`[data-date="${dateKey}"]`);
        if (!dayCell) return;
        
        const eventsContainer = dayCell.querySelector('.day-events');
        if (!eventsContainer) return;
        
        dayCell.classList.add('has-events');
        
        // Zobrazit max 3 události + počet zbývajících
        const visibleEvents = events.slice(0, 3);
        const hiddenCount = events.length - visibleEvents.length;
        
        visibleEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            eventElement.style.backgroundColor = event.color;
            eventElement.style.color = '#fff';
            eventElement.textContent = event.title;
            eventElement.title = `${event.title} - ${event.city}`;
            
            // Ikona pro dokončené akce
            if (event.status === 'completed') {
                eventElement.textContent = '✓ ' + event.title;
            }
            
            eventsContainer.appendChild(eventElement);
        });
        
        // Počet dalších akcí
        if (hiddenCount > 0) {
            const moreElement = document.createElement('div');
            moreElement.className = 'event-item more-events';
            moreElement.style.backgroundColor = '#6c757d';
            moreElement.style.color = '#fff';
            moreElement.textContent = `+${hiddenCount} další`;
            eventsContainer.appendChild(moreElement);
        }
    });
}

// Reset všech filtrů
function resetCalendarFilters() {
    console.log('🔄 Resetting calendar filters...');
    
    calendarFilters.category = '';
    calendarFilters.status = '';
    calendarFilters.source = '';
    calendarFilters.searchText = '';
    
    // Reset UI elementů
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    const searchInput = document.getElementById('eventSearch');
    
    if (categoryFilter) categoryFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sourceFilter) sourceFilter.value = '';
    if (searchInput) searchInput.value = '';
    
    // Zobrazit všechny události
    filteredEvents = [...calendarState.events];
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
    
    // Skrýt search stats
    const searchStats = document.getElementById('searchStats');
    if (searchStats) {
        searchStats.style.display = 'none';
    }
    
    if (typeof showNotification === 'function') {
        showNotification('🔍 Filtry resetovány', 'info', 2000);
    }
}

// ========================================
// VYHLEDÁVÁNÍ
// ========================================

// Inicializace vyhledávání
function initializeEventSearch() {
    const searchInput = document.getElementById('eventSearch');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchEvents(e.target.value);
        }, 300);
    });
    
    // Clear search button
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            searchEvents('');
        });
    }
    
    console.log('🔍 Event search initialized');
}

// Vyhledávání v událostech
function searchEvents(query) {
    const trimmedQuery = query.trim();
    
    calendarFilters.searchText = trimmedQuery;
    
    // Aplikovat všechny filtry včetně vyhledávání
    filterCalendar();
    
    // Update search stats
    const searchStats = document.getElementById('searchStats');
    if (searchStats) {
        if (trimmedQuery) {
            searchStats.textContent = `🔍 Nalezeno ${filteredEvents.length} výsledků pro "${query}"`;
            searchStats.style.display = 'block';
        } else {
            searchStats.style.display = 'none';
        }
    }
    
    console.log(`🔍 Search for "${query}": ${filteredEvents.length} results`);
}

// ========================================
// MĚSÍČNÍ PŘEHLED
// ========================================

// Aktualizace seznamu událostí měsíce
function updateMonthEventsList() {
    const monthEvents = document.getElementById('monthEvents');
    if (!monthEvents) return;
    
    console.log('📋 Updating month events list...');
    
    // Filtrování událostí pro aktuální měsíc
    const monthStart = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
    const monthEnd = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
    
    const currentMonthEvents = filteredEvents.filter(event => {
        const eventStart = event.startDate;
        const eventEnd = event.endDate;
        return (eventStart <= monthEnd && eventEnd >= monthStart);
    });
    
    if (currentMonthEvents.length === 0) {
        monthEvents.innerHTML = `
            <div class="events-placeholder">
                <p>📅 Žádné události v tomto měsíci</p>
                <p><small>Zkuste změnit filtry nebo přidat novou akci</small></p>
                <button class="btn btn-small" onclick="resetCalendarFilters()">🔄 Reset filtrů</button>
            </div>
        `;
        return;
    }
    
    // Seřazení podle data
    currentMonthEvents.sort((a, b) => a.startDate - b.startDate);
    
    // Vytvoření seznamu
    let html = `
        <div class="month-events-header">
            <h4>📋 Akce v měsíci (${currentMonthEvents.length})</h4>
            <button class="btn btn-small" onclick="resetCalendarFilters()">🔄 Reset filtrů</button>
        </div>
        <div class="month-events-list">
    `;
    
    currentMonthEvents.forEach(event => {
        html += createMonthEventItem(event);
    });
    
    html += '</div>';
    
    // Statistiky měsíce
    html += createMonthStats(currentMonthEvents);
    
    monthEvents.innerHTML = html;
}

// Vytvoření položky události v měsíčním seznamu
function createMonthEventItem(event) {
    const startDate = event.startDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
    const endDate = event.endDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
    const dateText = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
    
    const statusIcon = event.status === 'completed' ? '✅' : '📅';
    const sourceIcon = event.source === 'historical' ? '📈' : event.source === 'prediction' ? '💾' : '🎯';
    
    // Statistiky
    const visitors = event.data.visitors || 0;
    const sales = event.data.sales || event.data.predictedSales || 0;
    const conversion = visitors > 0 ? ((sales / visitors) * 100).toFixed(1) : '0';
    
    // Business data
    const revenue = event.data.expectedRevenue || (sales * (event.data.price || 110));
    
    return `
        <div class="month-event-item" onclick="showEventDetail('${event.id}')" style="cursor: pointer;">
            <div class="event-color-bar" style="background-color: ${event.color};"></div>
            <div class="event-info">
                <div class="event-title">${escapeHtml(event.title)}</div>
                <div class="event-meta">
                    ${statusIcon} ${dateText} • ${sourceIcon} ${escapeHtml(event.category)} • 📍 ${escapeHtml(event.city)}
                </div>
            </div>
            <div class="event-stats">
                <div class="stat-group">
                    <span class="stat-value">${formatNumber(visitors)}</span>
                    <span class="stat-label">návštěvníků</span>
                </div>
                <div class="stat-group">
                    <span class="stat-value">${formatNumber(sales)}</span>
                    <span class="stat-label">${event.source === 'historical' ? 'prodáno' : 'predikce'}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-value">${conversion}%</span>
                    <span class="stat-label">konverze</span>
                </div>
                <div class="stat-group">
                    <span class="stat-value">${formatCurrency(revenue)}</span>
                    <span class="stat-label">obrat</span>
                </div>
            </div>
        </div>
    `;
}

// Statistiky měsíce
function createMonthStats(events) {
    const stats = {
        totalEvents: events.length,
        completedEvents: events.filter(e => e.status === 'completed').length,
        totalVisitors: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0
    };
    
    let validConversions = [];
    
    events.forEach(event => {
        const visitors = event.data.visitors || 0;
        const sales = event.data.sales || event.data.predictedSales || 0;
        const revenue = event.data.expectedRevenue || (sales * (event.data.price || 110));
        const profit = event.data.expectedProfit || 0;
        
        stats.totalVisitors += visitors;
        stats.totalSales += sales;
        stats.totalRevenue += revenue;
        stats.totalProfit += profit;
        
        if (visitors > 0) {
            validConversions.push((sales / visitors) * 100);
        }
    });
    
    const avgConversion = validConversions.length > 0 
        ? validConversions.reduce((sum, conv) => sum + conv, 0) / validConversions.length 
        : 0;
    
    const avgMargin = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue) * 100 : 0;
    
    return `
        <div class="month-stats">
            <h4>📊 Statistiky měsíce</h4>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.totalEvents}</div>
                    <div class="stat-label">Celkem akcí</div>
                    <div class="stat-sublabel">${stats.completedEvents} dokončených</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatNumber(stats.totalVisitors)}</div>
                    <div class="stat-label">Celkem návštěvníků</div>
                    <div class="stat-sublabel">${stats.totalEvents > 0 ? Math.round(stats.totalVisitors / stats.totalEvents) : 0} průměr/akci</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatNumber(stats.totalSales)}</div>
                    <div class="stat-label">Celkem prodej</div>
                    <div class="stat-sublabel">${avgConversion.toFixed(1)}% průměrná konverze</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatCurrency(stats.totalRevenue)}</div>
                    <div class="stat-label">Celkový obrat</div>
                    <div class="stat-sublabel">${stats.totalEvents > 0 ? formatCurrency(stats.totalRevenue / stats.totalEvents) : '0 Kč'} průměr/akci</div>
                </div>
                <div class="stat-card ${stats.totalProfit >= 0 ? 'positive' : 'negative'}">
                    <div class="stat-number">${formatCurrency(stats.totalProfit)}</div>
                    <div class="stat-label">Celkový zisk</div>
                    <div class="stat-sublabel">${avgMargin.toFixed(1)}% průměrná marže</div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// ROZŠÍŘENÍ PŮVODNÍCH FUNKCÍ
// ========================================

// Rozšíření loadCalendarEvents o inicializaci filtrů
const originalLoadCalendarEvents = loadCalendarEvents;
loadCalendarEvents = function() {
    originalLoadCalendarEvents();
    
    // Po načtení událostí inicializovat filtry
    initializeCalendarFilters();
    
    // Nastavit všechny události jako filtrované na začátku
    filteredEvents = [...calendarState.events];
};

// Rozšíření changeMonth o aktualizaci filtrů
const originalChangeMonth = changeMonth;
changeMonth = function(direction) {
    originalChangeMonth(direction);
    
    // Po změně měsíce aktualizovat filtrované zobrazení
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
};

// Rozšíření goToToday o aktualizaci filtrů
const originalGoToToday = goToToday;
goToToday = function() {
    originalGoToToday();
    
    // Po přechodu na dnes aktualizovat filtrované zobrazení
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
};

// Rozšíření showDayModal pro filtrované události
const originalShowDayModal = showDayModal;
showDayModal = function(date) {
    const dateKey = formatDateKey(date);
    const dayEvents = filteredEvents.filter(event => {
        const startKey = formatDateKey(event.startDate);
        const endKey = formatDateKey(event.endDate);
        return dateKey >= startKey && dateKey <= endKey;
    });
    
    if (dayEvents.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('📅 Žádné události v tomto dni (po filtrování)', 'info', 2000);
        }
        return;
    }
    
    // Zbytek stejný jako původní funkce, ale s filteredEvents
    const modal = document.createElement('div');
    modal.className = 'modal day-modal';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>📅 ${date.toLocaleDateString('cs-CZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })} (${dayEvents.length} akcí)</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="day-events-list"></div>
        </div>
    `;
    
    const eventsList = modalContent.querySelector('.day-events-list');
    
    dayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'day-event-item';
        eventItem.style.borderLeft = `4px solid ${event.color}`;
        
        const statusIcon = event.status === 'completed' ? '✅' : '📅';
        const sourceIcon = event.source === 'historical' ? '📈' : event.source === 'prediction' ? '💾' : '🎯';
        
        eventItem.innerHTML = `
            <div class="event-header">
                <h4>${escapeHtml(event.title)}</h4>
                <div class="event-meta">
                    ${statusIcon} ${event.status === 'completed' ? 'Dokončeno' : 'Naplánováno'} • 
                    ${sourceIcon} ${event.source === 'historical' ? 'Historická data' : 'Predikce'} • 
                    📍 ${escapeHtml(event.city)} • 📋 ${escapeHtml(event.category)}
                </div>
            </div>
            <div class="event-stats">
                ${event.data.visitors ? `<span>👥 ${formatNumber(event.data.visitors)} návštěvníků</span>` : ''}
                ${event.data.sales ? `<span>🍩 ${formatNumber(event.data.sales)} ks prodáno</span>` : ''}
                ${event.data.predictedSales ? `<span>🎯 ${formatNumber(event.data.predictedSales)} ks predikce</span>` : ''}
                ${event.data.expectedProfit ? `<span>💰 ${formatCurrency(event.data.expectedProfit)} zisk</span>` : ''}
            </div>
            <div class="event-actions">
                <button class="btn btn-detail" onclick="showEventDetail('${event.id}')">📋 Detail</button>
            </div>
        `;
        
        eventsList.appendChild(eventItem);
    });
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Zavření modalu
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
};

// ========================================
// INICIALIZACE PART 4B
// ========================================

// Rozšíření hlavní inicializace o Part 4B
const originalInitializeCalendar = initializeCalendar;
initializeCalendar = function() {
    if (calendarInitialized) {
        console.log('⚠️ Calendar already initialized, skipping...');
        return;
    }
    
    console.log('🔧 Initializing calendar with filters...');
    
    // Původní inicializace
    loadCalendarEvents();
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    
    // Part 4B rozšíření
    setTimeout(() => {
        initializeEventSearch();
        updateMonthEventsList();
    }, 500);
    
    calendarInitialized = true;
    console.log('✅ Calendar with filters initialization complete');
};

// ========================================
// GLOBÁLNÍ EXPORT PART 4B
// ========================================

// Export nových funkcí pro HTML
if (typeof window !== 'undefined') {
    window.filterCalendar = filterCalendar;
    window.resetCalendarFilters = resetCalendarFilters;
    window.searchEvents = searchEvents;
    
    // Update debug object
    if (window.calendarDebug) {
        window.calendarDebug.filters = calendarFilters;
        window.calendarDebug.filteredEvents = () => filteredEvents;
        window.calendarDebug.resetFilters = resetCalendarFilters;
    }
}

console.log('✅ Donuland Part 4B CLEAN loaded successfully');
console.log('🔍 Filter features: Category, Status, Source, Text search');
console.log('📋 Monthly overview: Event list, Statistics');
console.log('🔧 Extended: All Part 4A functions now work with filters');
/* ========================================
   DONULAND PART 4C - Pokročilé funkce kalendáře
   Přidat na konec Part 4A + 4B (donuland_app_part4.js)
   ======================================== */

console.log('🍩 Donuland Part 4C loading...');

// Flag pro kontrolu inicializace
let calendarInitialized = false;

// ========================================
// BULK OPERATIONS (Hromadné operace)
// ========================================

// Stav bulk operací
const bulkOperations = {
    selectedEvents: new Set(),
    
    // Toggle výběr události
    toggleEventSelection(eventId) {
        if (this.selectedEvents.has(eventId)) {
            this.selectedEvents.delete(eventId);
        } else {
            this.selectedEvents.add(eventId);
        }
        this.updateSelectionUI();
    },
    
    // Výběr všech filtrovaných událostí
    selectAll() {
        this.selectedEvents.clear();
        filteredEvents.forEach(event => {
            this.selectedEvents.add(event.id);
        });
        this.updateSelectionUI();
    },
    
    // Zrušit všechny výběry
    clearSelection() {
        this.selectedEvents.clear();
        this.updateSelectionUI();
    },
    
    // Aktualizace UI výběru
    updateSelectionUI() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (bulkActions && selectedCount) {
            if (this.selectedEvents.size > 0) {
                bulkActions.style.display = 'flex';
                selectedCount.textContent = this.selectedEvents.size;
            } else {
                bulkActions.style.display = 'none';
            }
        }
        
        // Aktualizace checkboxů v UI
        document.querySelectorAll('.event-checkbox').forEach(checkbox => {
            const eventId = checkbox.dataset.eventId;
            checkbox.checked = this.selectedEvents.has(eventId);
        });
    },
    
    // Export vybraných událostí
    exportSelected() {
        if (this.selectedEvents.size === 0) {
            if (typeof showNotification === 'function') {
                showNotification('❌ Nejsou vybrány žádné události', 'error');
            }
            return;
        }
        
        const selectedEventData = calendarState.events.filter(event => 
            this.selectedEvents.has(event.id)
        );
        
        exportEventsToCSV(selectedEventData);
        this.clearSelection();
        
        if (typeof showNotification === 'function') {
            showNotification(`📄 ${selectedEventData.length} událostí exportováno`, 'success');
        }
    },
    
    // Smazání vybraných událostí
    deleteSelected() {
        if (this.selectedEvents.size === 0) {
            if (typeof showNotification === 'function') {
                showNotification('❌ Nejsou vybrány žádné události', 'error');
            }
            return;
        }
        
        if (!confirm(`Opravdu chcete smazat ${this.selectedEvents.size} vybraných událostí?`)) {
            return;
        }
        
        // Odstranit z calendarState.events
        calendarState.events = calendarState.events.filter(event => 
            !this.selectedEvents.has(event.id)
        );
        
        // Aktualizovat filtrované události
        filteredEvents = filteredEvents.filter(event => 
            !this.selectedEvents.has(event.id)
        );
        
        const deletedCount = this.selectedEvents.size;
        this.clearSelection();
        
        // Refresh kalendář
        displayFilteredEventsInCalendar();
        updateMonthEventsList();
        
        if (typeof showNotification === 'function') {
            showNotification(`🗑️ ${deletedCount} událostí smazáno`, 'success');
        }
    }
};

// ========================================
// EXPORT FUNKCIONALITA
// ========================================

// Export událostí do CSV
function exportEventsToCSV(events = calendarState.events, filename = null) {
    if (!events || events.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('❌ Žádné události k exportu', 'error');
        }
        return;
    }
    
    console.log(`📄 Exporting ${events.length} events to CSV...`);
    
    // CSV hlavička
    const csvHeaders = [
        'Název akce',
        'Kategorie', 
        'Město',
        'Datum od',
        'Datum do',
        'Návštěvníci',
        'Prodej/Predikce',
        'Konverze',
        'Zdroj',
        'Stav',
        'Poznámky'
    ];
    
    // CSV řádky
    const csvRows = events.map(event => {
        const visitors = event.data.visitors || 0;
        const sales = event.data.sales || event.data.predictedSales || 0;
        const conversion = visitors > 0 ? ((sales / visitors) * 100).toFixed(2) : '0';
        
        return [
            escapeCSVValue(event.title),
            escapeCSVValue(event.category),
            escapeCSVValue(event.city),
            event.startDate.toLocaleDateString('cs-CZ'),
            event.endDate.toLocaleDateString('cs-CZ'),
            visitors,
            sales,
            conversion + '%',
            event.source === 'historical' ? 'Historická data' : 'Predikce',
            event.status === 'completed' ? 'Dokončeno' : 'Naplánováno',
            escapeCSVValue(event.data.notes || '')
        ].join(',');
    });
    
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const defaultFilename = filename || `donuland_kalendar_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = defaultFilename;
    link.click();
    
    URL.revokeObjectURL(link.href);
    
    console.log(`✅ Events exported to CSV: ${defaultFilename}`);
}

// Helper pro escapování CSV hodnot
function escapeCSVValue(value) {
    if (!value) return '';
    
    const stringValue = value.toString();
    
    // Pokud obsahuje čárku, uvozovky nebo nový řádek, obalit uvozovkami
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        // Escapovat uvozovky zdvojením
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
}

// ========================================
// QUICK ADD EVENT (Rychlé přidání akce)
// ========================================

// Zobrazení modalu pro rychlé přidání akce
function showQuickAddModal(date = null) {
    console.log('⚡ Opening quick add modal...');
    
    const modal = document.createElement('div');
    modal.className = 'modal quick-add-modal';
    modal.style.display = 'flex';
    
    const defaultDate = date || new Date();
    const dateString = defaultDate.toISOString().split('T')[0];
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>⚡ Rychlé přidání akce</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="quick-form">
                    <div class="form-group">
                        <label>Název akce *</label>
                        <input type="text" id="quickEventName" placeholder="Název akce..." required>
                    </div>
                    
                    <div class="form-group">
                        <label>Kategorie *</label>
                        <select id="quickCategory" required>
                            <option value="">Vyberte kategorii</option>
                            <option value="food festival">Food festival</option>
                            <option value="veletrh">Veletrh</option>
                            <option value="koncert">Koncert</option>
                            <option value="kulturní akce">Kulturní akce</option>
                            <option value="sportovní">Sportovní akce</option>
                            <option value="ostatní">Ostatní</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Město *</label>
                        <input type="text" id="quickCity" placeholder="Město..." required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Datum od *</label>
                            <input type="date" id="quickDateFrom" value="${dateString}" required>
                        </div>
                        <div class="form-group">
                            <label>Datum do *</label>
                            <input type="date" id="quickDateTo" value="${dateString}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Návštěvníci</label>
                            <input type="number" id="quickVisitors" placeholder="1000" min="50">
                        </div>
                        <div class="form-group">
                            <label>Predikovaný prodej</label>
                            <input type="number" id="quickSales" placeholder="150" min="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Poznámka</label>
                        <textarea id="quickNotes" rows="2" placeholder="Volitelná poznámka..."></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-save" onclick="saveQuickEvent()">⚡ Přidat akci</button>
                <button class="btn" onclick="this.closest('.modal').remove()">Zrušit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus na první input
    const nameInput = document.getElementById('quickEventName');
    if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }
    
    // Zavření na ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Zavření na click mimo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Uložení rychlé události
function saveQuickEvent() {
    const modal = document.querySelector('.quick-add-modal');
    if (!modal) return;
    
    console.log('💾 Saving quick event...');
    
    // Sběr dat z formuláře
    const eventName = document.getElementById('quickEventName').value.trim();
    const category = document.getElementById('quickCategory').value;
    const city = document.getElementById('quickCity').value.trim();
    const dateFrom = document.getElementById('quickDateFrom').value;
    const dateTo = document.getElementById('quickDateTo').value;
    const visitors = parseInt(document.getElementById('quickVisitors').value) || 0;
    const sales = parseInt(document.getElementById('quickSales').value) || 0;
    const notes = document.getElementById('quickNotes').value.trim();
    
    // Validace
    if (!eventName || !category || !city || !dateFrom || !dateTo) {
        if (typeof showNotification === 'function') {
            showNotification('❌ Vyplňte všechna povinná pole', 'error');
        }
        return;
    }
    
    if (new Date(dateTo) < new Date(dateFrom)) {
        if (typeof showNotification === 'function') {
            showNotification('❌ Datum do musí být stejné nebo pozdější než datum od', 'error');
        }
        return;
    }
    
    // Vytvoření nové události
    const newEvent = {
        id: 'quick_' + Date.now(),
        title: eventName,
        startDate: new Date(dateFrom + 'T12:00:00'),
        endDate: new Date(dateTo + 'T12:00:00'),
        category: category,
        city: city,
        status: 'planned',
        source: 'manual',
        color: getUniqueEventColor(),
        data: {
            visitors: visitors,
            predictedSales: sales,
            notes: notes,
            confidence: 0,
            businessModel: 'owner',
            price: 110
        }
    };
    
    // Přidání do kalendáře
    calendarState.events.push(newEvent);
    filteredEvents.push(newEvent);
    
    // Refresh UI
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
    
    // Zavření modalu
    modal.remove();
    
    if (typeof showNotification === 'function') {
        showNotification(`✅ Akce "${eventName}" byla přidána`, 'success');
    }
    
    console.log('✅ Quick event added:', newEvent);
}

// ========================================
// MONTH SELECTOR (Výběr měsíce/roku)
// ========================================

// Zobrazení selektoru měsíce
function showMonthSelector() {
    console.log('📅 Opening month selector...');
    
    const modal = document.createElement('div');
    modal.className = 'modal month-selector-modal';
    modal.style.display = 'flex';
    
    const currentYear = calendarState.currentYear;
    const currentMonth = calendarState.currentMonth;
    
    const monthNames = [
        'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
    ];
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📅 Přejít na měsíc</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="month-year-selector">
                    <div class="year-selector">
                        <h4>Rok</h4>
                        <div class="year-buttons">
                            ${[currentYear - 1, currentYear, currentYear + 1].map(year => `
                                <button class="year-btn ${year === currentYear ? 'active' : ''}" 
                                        data-year="${year}">${year}</button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="month-selector">
                        <h4>Měsíc</h4>
                        <div class="months-grid">
                            ${monthNames.map((name, index) => `
                                <button class="month-btn ${index === currentMonth ? 'active' : ''}" 
                                        data-month="${index}">${name}</button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-save" onclick="applyMonthSelection()">📅 Přejít</button>
                <button class="btn" onclick="this.closest('.modal').remove()">Zrušit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listenery pro výběr
    modal.querySelectorAll('.year-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    modal.querySelectorAll('.month-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Zavření na click mimo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Aplikace výběru měsíce
function applyMonthSelection() {
    const modal = document.querySelector('.month-selector-modal');
    if (!modal) return;
    
    const activeYear = modal.querySelector('.year-btn.active');
    const activeMonth = modal.querySelector('.month-btn.active');
    
    if (activeYear && activeMonth) {
        const year = parseInt(activeYear.dataset.year);
        const month = parseInt(activeMonth.dataset.month);
        
        calendarState.currentYear = year;
        calendarState.currentMonth = month;
        
        updateCurrentMonthDisplay();
        generateCalendarGrid();
        displayFilteredEventsInCalendar();
        updateMonthEventsList();
        
        modal.remove();
        
        if (typeof showNotification === 'function') {
            showNotification(`📅 Přešli jste na ${activeMonth.textContent} ${year}`, 'success', 2000);
        }
    }
}

// ========================================
// KEYBOARD SHORTCUTS (Klávesové zkratky)
// ========================================

// Zobrazení nápovědy klávesových zkratek
function showKeyboardShortcuts() {
    console.log('⌨️ Opening keyboard shortcuts help...');
    
    const modal = document.createElement('div');
    modal.className = 'modal shortcuts-modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>⌨️ Klávesové zkratky</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="shortcuts-grid">
                    <div class="shortcuts-section">
                        <h4>🗓️ Navigace</h4>
                        <div class="shortcut-item">
                            <div><kbd>←</kbd> <kbd>→</kbd></div>
                            <span>Předchozí/následující měsíc</span>
                        </div>
                        <div class="shortcut-item">
                            <div><kbd>T</kbd></div>
                            <span>Přejít na dnešní měsíc</span>
                        </div>
                        <div class="shortcut-item">
                            <div><kbd>G</kbd></div>
                            <span>Výběr měsíce/roku</span>
                        </div>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h4>📝 Události</h4>
                        <div class="shortcut-item">
                            <div><kbd>Ctrl</kbd> + <kbd>N</kbd></div>
                            <span>Rychlé přidání akce</span>
                        </div>
                        <div class="shortcut-item">
                            <div><kbd>Ctrl</kbd> + <kbd>A</kbd></div>
                            <span>Vybrat všechny události</span>
                        </div>
                        <div class="shortcut-item">
                            <div><kbd>Delete</kbd></div>
                            <span>Smazat vybrané události</span>
                        </div>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h4>🔍 Vyhledávání</h4>
                        <div class="shortcut-item">
                            <div><kbd>Ctrl</kbd> + <kbd>F</kbd></div>
                            <span>Zaměřit vyhledávání</span>
                        </div>
                        <div class="shortcut-item">
                            <div><kbd>Esc</kbd></div>
                            <span>Vymazat vyhledávání/filtry</span>
                        </div>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h4>📤 Export</h4>
                        <div class="shortcut-item">
                            <div><kbd>Ctrl</kbd> + <kbd>E</kbd></div>
                            <span>Export všech událostí</span>
                        </div>
                        <div class="shortcut-item">
                            <div><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd></div>
                            <span>Export vybraných událostí</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="this.closest('.modal').remove()">Zavřít</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Zavření na click mimo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Setup klávesových zkratek
function setupCalendarKeyboardShortcuts() {
    // Kontrola, zda už nejsou nastaveny
    if (window.calendarKeyboardSetup) {
        return;
    }
    
    console.log('⌨️ Setting up calendar keyboard shortcuts...');
    
    document.addEventListener('keydown', (e) => {
        // Pouze pokud není focus v input fieldu
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        // Pouze v kalendáři
        if (typeof globalState !== 'undefined' && globalState.currentSection !== 'calendar') {
            return;
        }
        
        // Ctrl/Cmd + N - Quick add event
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            showQuickAddModal();
        }
        
        // Ctrl/Cmd + E - Export události
        if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !e.shiftKey) {
            e.preventDefault();
            exportEventsToCSV(filteredEvents);
        }
        
        // Ctrl/Cmd + Shift + E - Export vybrané události
        if ((e.ctrlKey || e.metaKey) && e.key === 'E' && e.shiftKey) {
            e.preventDefault();
            bulkOperations.exportSelected();
        }
        
        // Ctrl/Cmd + F - Focus na search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('eventSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl/Cmd + A - Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            bulkOperations.selectAll();
        }
        
        // G - Go to month selector
        if (e.key === 'g' || e.key === 'G') {
            showMonthSelector();
        }
        
        // T - Go to today
        if (e.key === 't' || e.key === 'T') {
            goToToday();
        }
        
        // ← → - Navigate months
        if (e.key === 'ArrowLeft') {
            changeMonth(-1);
        }
        
        if (e.key === 'ArrowRight') {
            changeMonth(1);
        }
        
        // Delete - Delete selected events
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (bulkOperations.selectedEvents.size > 0) {
                e.preventDefault();
                bulkOperations.deleteSelected();
            }
        }
        
        // Escape - Clear selection and search
        if (e.key === 'Escape') {
            bulkOperations.clearSelection();
            
            // Clear search
            const searchInput = document.getElementById('eventSearch');
            if (searchInput && searchInput.value) {
                searchInput.value = '';
                searchEvents('');
            }
            
            // Reset filtry
            resetCalendarFilters();
        }
    });
    
    window.calendarKeyboardSetup = true;
    console.log('✅ Calendar keyboard shortcuts setup complete');
}

// ========================================
// SEARCH FUNCTIONALITY (Pokročilé vyhledávání)
// ========================================

// Globální vyhledávání v událostech
function searchEvents(query) {
    const trimmedQuery = query.trim().toLowerCase();
    
    if (!trimmedQuery) {
        // Použij existující filtry pokud není query
        filterCalendar();
        return;
    }
    
    console.log(`🔍 Searching events for: "${query}"`);
    
    // Pokročilé vyhledávání s operátory
    if (query.includes(':')) {
        filteredEvents = advancedSearch(query);
    } else {
        // Jednoduché vyhledávání
        filteredEvents = calendarState.events.filter(event => {
            const searchableText = [
                event.title,
                event.category,
                event.city,
                event.data.notes || ''
            ].join(' ').toLowerCase();
            
            return searchableText.includes(trimmedQuery);
        });
    }
    
    // Aplikovat stávající filtry
    filteredEvents = filteredEvents.filter(event => {
        if (calendarFilters.category && event.category !== calendarFilters.category) {
            return false;
        }
        
        if (calendarFilters.status && event.status !== calendarFilters.status) {
            return false;
        }
        
        if (calendarFilters.source) {
            if (calendarFilters.source === 'historical' && event.source !== 'historical') {
                return false;
            }
            if (calendarFilters.source === 'prediction' && event.source === 'historical') {
                return false;
            }
        }
        
        return true;
    });
    
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
    
    // Update search stats
    const searchStats = document.getElementById('searchStats');
    if (searchStats) {
        if (trimmedQuery) {
            searchStats.textContent = `🔍 Nalezeno ${filteredEvents.length} výsledků pro "${query}"`;
            searchStats.style.display = 'block';
        } else {
            searchStats.style.display = 'none';
        }
    }
    
    console.log(`🔍 Search completed: ${filteredEvents.length} results`);
}

// Pokročilé vyhledávání s operátory
function advancedSearch(query) {
    const trimmedQuery = query.trim().toLowerCase();
    
    if (!trimmedQuery) {
        return calendarState.events;
    }
    
    // Parse search operators
    const operators = {
        category: null,
        city: null,
        status: null,
        date: null,
        text: []
    };
    
    // Split query by spaces and parse operators
    const tokens = trimmedQuery.split(' ');
    
    tokens.forEach(token => {
        if (token.startsWith('category:')) {
            operators.category = token.substring(9);
        } else if (token.startsWith('city:')) {
            operators.city = token.substring(5);
        } else if (token.startsWith('status:')) {
            operators.status = token.substring(7);
        } else if (token.startsWith('date:')) {
            operators.date = token.substring(5);
        } else if (token.length > 0) {
            operators.text.push(token);
        }
    });
    
    // Filter events based on operators
    return calendarState.events.filter(event => {
        // Category filter
        if (operators.category && !event.category.toLowerCase().includes(operators.category)) {
            return false;
        }
        
        // City filter
        if (operators.city && !event.city.toLowerCase().includes(operators.city)) {
            return false;
        }
        
        // Status filter
        if (operators.status && event.status !== operators.status) {
            return false;
        }
        
        // Date filter
        if (operators.date) {
            const eventDate = event.startDate.toISOString().split('T')[0];
            if (!eventDate.includes(operators.date)) {
                return false;
            }
        }
        
        // Text search in title and notes
        if (operators.text.length > 0) {
            const searchableText = [
                event.title,
                event.data.notes || ''
            ].join(' ').toLowerCase();
            
            return operators.text.every(term => searchableText.includes(term));
        }
        
        return true;
    });
}

// ========================================
// UI INJECTION (Vložení UI komponent)
// ========================================

// Vytvoření action bar pro kalendář
function createCalendarActionBar() {
    if (document.querySelector('.calendar-action-bar')) {
        return; // Už existuje
    }
    
    const actionBar = document.createElement('div');
    actionBar.className = 'calendar-action-bar';
    
    actionBar.innerHTML = `
        <div class="action-bar-left">
            <button class="btn btn-small" onclick="showQuickAddModal()" title="Ctrl+N">
                ⚡ Rychlá akce
            </button>
            <button class="btn btn-small" onclick="showMonthSelector()" title="G">
                📅 Přejít na měsíc
            </button>
        </div>
        
        <div class="action-bar-center">
            <div class="calendar-search">
                <div class="search-input-container">
                    <input type="text" id="eventSearch" placeholder="🔍 Hledat události..." 
                           autocomplete="off" spellcheck="false">
                    <button id="clearSearch" class="clear-search-btn" title="Vymazat vyhledávání">&times;</button>
                </div>
                <div id="searchStats" class="search-stats" style="display: none;"></div>
            </div>
        </div>
        
        <div class="action-bar-right">
            <button class="btn btn-small" onclick="exportEventsToCSV(filteredEvents)" title="Ctrl+E">
                📄 Export
            </button>
            <button class="btn btn-small" onclick="showKeyboardShortcuts()">
                ⌨️ Zkratky
            </button>
            <button class="btn btn-small" onclick="bulkOperations.selectAll()">
                ☑️ Vybrat vše
            </button>
        </div>
    `;
    
    return actionBar;
}

// Vytvoření bulk actions toolbar
function createBulkActionsToolbar() {
    if (document.getElementById('bulkActions')) {
        return; // Už existuje
    }
    
    const toolbar = document.createElement('div');
    toolbar.id = 'bulkActions';
    toolbar.className = 'bulk-actions-toolbar';
    toolbar.style.display = 'none';
    
    toolbar.innerHTML = `
        <div class="bulk-info">
            <span id="selectedCount">0</span> vybraných událostí
        </div>
        <div class="bulk-buttons">
            <button class="btn btn-small" onclick="bulkOperations.exportSelected()">
                📄 Export vybraných
            </button>
            <button class="btn btn-small btn-delete" onclick="bulkOperations.deleteSelected()">
                🗑️ Smazat vybrané
            </button>
            <button class="btn btn-small" onclick="bulkOperations.clearSelection()">
                ❌ Zrušit výběr
            </button>
        </div>
    `;
    
    return toolbar;
}

// Inicializace event search
function initializeEventSearch() {
    const searchInput = document.getElementById('eventSearch');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchEvents(e.target.value);
        }, 300);
    });
    
    // Clear search
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            searchEvents('');
        });
    }
}

// Vložení rozšířených UI komponent
function injectEnhancedCalendarUI() {
    const calendarSection = document.getElementById('calendar');
    if (!calendarSection) {
        console.log('⚠️ Calendar section not found');
        return;
    }
    
    console.log('🎨 Injecting enhanced calendar UI...');
    
    // Najít kalendářovou kartu
    const calendarCards = calendarSection.querySelectorAll('.card');
    const calendarCard = calendarCards[1]; // Druhá karta (první je controls)
    
    if (calendarCard) {
        // Přidat action bar jako první element v kartě
        if (!document.querySelector('.calendar-action-bar')) {
            const actionBar = createCalendarActionBar();
            const firstChild = calendarCard.firstElementChild;
            calendarCard.insertBefore(actionBar, firstChild);
            console.log('✅ Action bar injected');
        }
        
        // Přidat bulk actions toolbar na konec karty
        if (!document.getElementById('bulkActions')) {
            const bulkActions = createBulkActionsToolbar();
            calendarCard.appendChild(bulkActions);
            console.log('✅ Bulk actions toolbar injected');
        }
    }
    
    console.log('✅ Enhanced calendar UI injected');
}

// ========================================
// ROZŠÍŘENÍ INICIALIZACE
// ========================================

// Rozšíření hlavní inicializace o Part 4C
const originalInitializeCalendar = initializeCalendar;
initializeCalendar = function() {
    if (calendarInitialized) {
        console.log('⚠️ Calendar already initialized, skipping...');
        return;
    }
    
    console.log('🔧 Initializing calendar with advanced features...');
    
    // Původní inicializace (Part 4A + 4B)
    originalInitializeCalendar();
    
    // Part 4C rozšíření
    setTimeout(() => {
        // Inject UI komponenty
        injectEnhancedCalendarUI();
        
        // Initialize search
        initializeEventSearch();
        
        // Setup keyboard shortcuts
        setupCalendarKeyboardShortcuts();
        
        calendarInitialized = true;
        console.log('✅ Calendar Part 4C enhancements loaded');
        
        // Show welcome notification
        if (typeof showNotification === 'function') {
            showNotification('🎉 Kalendář je připraven! Zkuste Ctrl+N pro rychlé přidání akce', 'success', 5000);
        }
    }, 1000);
};

// ========================================
// EVENT LISTENERS
// ========================================

// Event listeners pro Part 4C
if (typeof eventBus !== 'undefined') {
    eventBus.on('calendarRequested', () => {
        setTimeout(() => {
            if (!calendarInitialized) {
                initializeCalendar();
            }
        }, 500);
    });
    
    eventBus.on('dataLoaded', () => {
        setTimeout(() => {
            if (typeof globalState !== 'undefined' && globalState.currentSection === 'calendar') {
                loadCalendarEvents();
                filteredEvents = [...calendarState.events];
                displayFilteredEventsInCalendar();
                updateMonthEventsList();
                bulkOperations.clearSelection();
            }
        }, 500);
    });
    
    eventBus.on('predictionSaved', () => {
        setTimeout(() => {
            if (typeof globalState !== 'undefined' && globalState.currentSection === 'calendar') {
                loadCalendarEvents();
                filteredEvents = [...calendarState.events];
                displayFilteredEventsInCalendar();
                updateMonthEventsList();
            }
        }, 500);
    });
}

// ========================================
// GLOBAL EXPORTS
// ========================================

// Exportovat funkce pro HTML onclick handlers
if (typeof window !== 'undefined') {
    window.showQuickAddModal = showQuickAddModal;
    window.saveQuickEvent = saveQuickEvent;
    window.showMonthSelector = showMonthSelector;
    window.applyMonthSelection = applyMonthSelection;
    window.showKeyboardShortcuts = showKeyboardShortcuts;
    window.exportEventsToCSV = exportEventsToCSV;
    window.bulkOperations = bulkOperations;
    window.searchEvents = searchEvents;
    
    // Debug object
    window.donulandCalendarDebug = {
        calendarState,
        calendarFilters,
        filteredEvents,
        bulkOperations,
        searchEvents,
        advancedSearch,
        exportEventsToCSV,
        initializeCalendar,
        getStats: () => ({
            totalEvents: calendarState.events.length,
            filteredEvents: filteredEvents.length,
            selectedEvents: bulkOperations.selectedEvents.size,
            initialized: calendarInitialized
        })
    };
}

console.log('✅ Donuland Part 4C loaded successfully');
console.log('🗓️ Advanced Calendar Features:');
console.log('  ✅ Bulk Operations (select multiple events)');
console.log('  ✅ Quick Add Event (Ctrl+N)');
console.log('  ✅ Advanced Search (with operators like category:food)');
console.log('  ✅ Keyboard Shortcuts (Ctrl+N, Ctrl+E, G, T, arrows)');
console.log('  ✅ Month/Year Selector (G key)');
console.log('  ✅ CSV Export functionality');
console.log('⌨️  Press F12 → Console → try: window.donulandCalendarDebug');

// Emit completion event
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4CLoaded', { 
        timestamp: Date.now(),
        version: '1.0.0',
        features: [
            'bulk-operations',
            'quick-add-event', 
            'advanced-search-with-operators',
            'keyboard-shortcuts',
            'month-year-selector',
            'csv-export',
            'enhanced-ui-injection'
        ]
    });
}
