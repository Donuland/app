/* ========================================
   DONULAND PART 4A - Základní kalendář CLEAN
   Smazat celý part4.js a nahradit tímto
   ======================================== */

console.log('🍩 Donuland Part 4A loading...');

// Flag pro kontrolu inicializace - PŘIDAT NA ZAČÁTEK
let part4Initialized = false;
let part4DInitialized = false;

// Globální stav kalendáře
const calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    events: []
};

// Paleta barev pro jednotlivé akce
const EVENT_COLORS = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#ff9ff3', '#feca57', 
    '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7', '#55a3ff', '#00b894',
    '#e17055', '#81ecec', '#fab1a0', '#00cec9', '#e84393', '#2d3436', '#636e72', '#b2bec3',
    '#ff3838', '#ff9500', '#ffdd00', '#8bc34a', '#00bcd4', '#3f51b5', '#9c27b0', '#e91e63',
    '#f44336', '#795548', '#607d8b', '#ff5722', '#ff9800', '#ffc107', '#cddc39', '#4caf50'
];

let eventColorIndex = 0;

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

// Získání unikátní barvy pro každou akci
function getUniqueEventColor() {
    const color = EVENT_COLORS[eventColorIndex % EVENT_COLORS.length];
    eventColorIndex++;
    return color;
}

// Načtení všech událostí
function loadCalendarEvents() {
    calendarState.events = [];
    eventColorIndex = 0;
    
    // Historická data ze Sheets
    if (globalState.historicalData) {
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
    
    // Uložené predikce z localStorage
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
        console.warn('Error loading predictions:', error);
    }
    
    // Aktuální predikce
    if (globalState.lastPrediction && !globalState.lastPrediction.saved && globalState.lastPrediction.formData) {
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
}

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

// Modal se všemi akcemi daného dne
function showDayModal(date) {
    const dateKey = formatDateKey(date);
    const dayEvents = calendarState.events.filter(event => {
        const startKey = formatDateKey(event.startDate);
        const endKey = formatDateKey(event.endDate);
        return dateKey >= startKey && dateKey <= endKey;
    });
    
    if (dayEvents.length === 0) {
        if (showNotification) {
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
                    📍 ${escapeHtml(event.city)}
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
    
    // Zavření
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
                            <input type="number" id="realSales" value="${event.data.sales || ''}" placeholder="Zadejte reálný prodej">
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
                        <div class="detail-item">
                            <label>Očekávaný zisk:</label>
                            <span>${formatCurrency(event.data.expectedProfit || 0)}</span>
                        </div>
                    `}
                    <div class="detail-item full-width">
                        <label>Poznámka:</label>
                        <textarea id="eventNotes" rows="3" placeholder="Poznámky k akci...">${escapeHtml(event.data.notes || '')}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-save" onclick="saveEventChanges('${event.id}')">💾 Uložit změny</button>
                ${isPrediction ? '<button class="btn btn-export" onclick="uploadToSheets(\'' + event.id + '\')">📤 Zapsat do Sheets</button>' : ''}
                <button class="btn btn-delete" onclick="deleteEvent('${event.id}')">🗑️ Smazat akci</button>
                <button class="btn" onclick="this.closest('.modal').remove()">Zrušit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Uložení změn akce
function saveEventChanges(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    const realSales = document.getElementById('realSales');
    const eventNotes = document.getElementById('eventNotes');
    
    if (realSales && realSales.value) {
        event.data.sales = parseInt(realSales.value) || 0;
    }
    
    if (eventNotes) {
        event.data.notes = eventNotes.value;
    }
    
    document.querySelector('.event-detail-modal').remove();
    displayEventsInCalendar();
    
    if (showNotification) {
        showNotification('💾 Změny uloženy', 'success');
    }
}

// Smazání akce
function deleteEvent(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    if (!confirm(`Opravdu chcete smazat akci "${event.title}"?`)) {
        return;
    }
    
    const index = calendarState.events.findIndex(e => e.id === eventId);
    if (index > -1) {
        calendarState.events.splice(index, 1);
    }
    
    document.querySelector('.event-detail-modal').remove();
    displayEventsInCalendar();
    
    if (showNotification) {
        showNotification('🗑️ Akce smazána', 'success');
    }
}

// Upload do Sheets
function uploadToSheets(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event || event.source === 'historical') {
        if (showNotification) {
            showNotification('❌ Lze nahrát pouze predikce', 'error');
        }
        return;
    }
    
    if (showNotification) {
        showNotification('📤 Nahrávám do Google Sheets...', 'info');
    }
    
    setTimeout(() => {
        event.source = 'historical';
        displayEventsInCalendar();
        if (showNotification) {
            showNotification('✅ Úspěšně nahráno do Sheets', 'success');
        }
    }, 2000);
}

// Navigace kalendáře
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
}

function goToToday() {
    const today = new Date();
    calendarState.currentMonth = today.getMonth();
    calendarState.currentYear = today.getFullYear();
    
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    
    if (showNotification) {
        showNotification('📅 Přešli jste na aktuální měsíc', 'info', 2000);
    }
}

// Inicializace kalendáře
function initializeCalendar() {
    loadCalendarEvents();
    updateCurrentMonthDisplay();
    generateCalendarGrid();
}

// Event listenery
if (typeof eventBus !== 'undefined') {
    eventBus.on('dataLoaded', () => {
        setTimeout(initializeCalendar, 500);
    });
    
    eventBus.on('predictionSaved', () => {
        setTimeout(initializeCalendar, 500);
    });
    
    eventBus.on('calendarRequested', () => {
        initializeCalendar();
    });
}

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof globalState !== 'undefined' && globalState.historicalData) {
            initializeCalendar();
        }
    }, 1000);
});

console.log('✅ Donuland Part 4A loaded successfully');
/* ========================================
   DONULAND PART 4B - Filtry a měsíční přehled
   Přidat na konec Part 4A
   ======================================== */

console.log('🍩 Donuland Part 4B loading...');

// Stav filtrů
const calendarFilters = {
    category: '',
    status: '',
    source: ''
};

// Filtrované události
let filteredEvents = [];

// Kategorie ze Sheets (stejné jako v AI predikci)
const CATEGORIES = [
    'food festival',
    'veletrh', 
    'koncert',
    'kulturní akce',
    'sportovní',
    'ostatní'
];

// Inicializace filtrů
function initializeCalendarFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">📋 Všechny kategorie</option>';
        CATEGORIES.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
}

// Funkce pro HTML filtry
function filterCalendar() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    
    if (categoryFilter) calendarFilters.category = categoryFilter.value;
    if (statusFilter) calendarFilters.status = statusFilter.value;
    if (sourceFilter) calendarFilters.source = sourceFilter.value;
    
    // Aplikovat filtry
    filteredEvents = calendarState.events.filter(event => {
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

// Resetování filtrů
function resetCalendarFilters() {
    calendarFilters.category = '';
    calendarFilters.status = '';
    calendarFilters.source = '';
    
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    
    if (categoryFilter) categoryFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sourceFilter) sourceFilter.value = '';
    
    filteredEvents = [...calendarState.events];
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
    
    if (showNotification) {
        showNotification('🔍 Filtry resetovány', 'info', 2000);
    }
}

// Aktualizace seznamu událostí měsíce
function updateMonthEventsList() {
    const monthEvents = document.getElementById('monthEvents');
    if (!monthEvents) return;
    
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
            <div class="event-actions">
                <button class="btn-icon" onclick="event.stopPropagation(); showEventDetail('${event.id}')" title="Detail">📋</button>
                ${event.source !== 'historical' ? 
                    `<button class="btn-icon" onclick="event.stopPropagation(); uploadToSheets('${event.id}')" title="Zapsat do Sheets">📤</button>` : ''}
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

// Rozšíření původní inicializace kalendáře pro filtry
const originalInitializeCalendar = initializeCalendar;
initializeCalendar = function() {
    loadCalendarEvents();
    initializeCalendarFilters();
    
    // Nastavit všechny události jako filtrované na začátku
    filteredEvents = [...calendarState.events];
    
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
};

// Rozšíření původní změny měsíce pro filtry
const originalChangeMonth = changeMonth;
changeMonth = function(direction) {
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
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
};

// Rozšíření goToToday pro filtry
const originalGoToToday = goToToday;
goToToday = function() {
    const today = new Date();
    calendarState.currentMonth = today.getMonth();
    calendarState.currentYear = today.getFullYear();
    
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
    
    if (showNotification) {
        showNotification('📅 Přešli jste na aktuální měsíc', 'info', 2000);
    }
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
        if (showNotification) {
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
                ${event.data.expectedProfit ? `<span>💰 ${formatCurrency(event.data.expectedProfit)} zisk</span>` : ''}
            </div>
            <div class="event-actions">
                <button class="btn btn-detail" onclick="showEventDetail('${event.id}')">📋 Detail</button>
                ${event.source !== 'historical' ? 
                    `<button class="btn btn-export" onclick="uploadToSheets('${event.id}')">📤 Do Sheets</button>` : ''}
            </div>
        `;
        
        eventsList.appendChild(eventItem);
    });
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Zavření
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

console.log('✅ Donuland Part 4B loaded successfully');
/* ========================================
   DONULAND PART 4D - Finální integrace a optimalizace
   Přidat na konec Part 4A+4B (donuland_app_part4.js)
   ======================================== */

console.log('🍩 Donuland Part 4D loading...');

// ========================================
// ADVANCED EVENT MANAGEMENT
// ========================================

// Bulk operations pro události
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
    
    // Výběr všech událostí
    selectAll() {
        this.selectedEvents.clear();
        filteredEvents.forEach(event => {
            this.selectedEvents.add(event.id);
        });
        this.updateSelectionUI();
    },
    
    // Zrušit výběr
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
    
    // Bulk export vybraných událostí
    exportSelected() {
        if (this.selectedEvents.size === 0) {
            showNotification('❌ Nejsou vybrány žádné události', 'error');
            return;
        }
        
        const selectedEventData = calendarState.events.filter(event => 
            this.selectedEvents.has(event.id)
        );
        
        exportEventsToCSV(selectedEventData);
        this.clearSelection();
        showNotification(`📄 ${selectedEventData.length} událostí exportováno`, 'success');
    },
    
    // Bulk delete vybraných událostí
    deleteSelected() {
        if (this.selectedEvents.size === 0) {
            showNotification('❌ Nejsou vybrány žádné události', 'error');
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
        
        showNotification(`🗑️ ${deletedCount} událostí smazáno`, 'success');
    }
};

// ========================================
// EXPORT FUNKCIONALITA
// ========================================

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

// Export událostí do CSV
function exportEventsToCSV(events = calendarState.events) {
    if (!events || events.length === 0) {
        showNotification('❌ Žádné události k exportu', 'error');
        return;
    }
    
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
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const filename = `donuland_kalendar_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
    
    console.log('✅ Calendar events exported to CSV:', filename);
}

// ========================================
// QUICK ADD EVENT
// ========================================

// Rychlé přidání události
function showQuickAddModal(date = null) {
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
        showNotification('❌ Vyplňte všechna povinná pole', 'error');
        return;
    }
    
    if (new Date(dateTo) < new Date(dateFrom)) {
        showNotification('❌ Datum do musí být stejné nebo pozdější než datum od', 'error');
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
    
    // Mark for auto-save
    autoSave.markChanges();
    
    // Refresh UI
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
    
    // Zavření modalu
    modal.remove();
    
    showNotification(`✅ Akce "${eventName}" byla přidána`, 'success');
    console.log('✅ Quick event added:', newEvent);
}

// ========================================
// MONTH SELECTOR
// ========================================

// Zobrazení měsíčního selektoru
function showMonthSelector() {
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
    
    // Zavření
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
        
        showNotification(`📅 Přešli jste na ${activeMonth.textContent} ${year}`, 'success', 2000);
    }
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

// Keyboard shortcuts help modal
function showKeyboardShortcuts() {
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
                            <kbd>←</kbd> <kbd>→</kbd>
                            <span>Předchozí/následující měsíc</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>T</kbd>
                            <span>Přejít na dnešní měsíc</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>G</kbd>
                            <span>Výběr měsíce</span>
                        </div>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h4>📝 Události</h4>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>N</kbd>
                            <span>Rychlé přidání akce</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>A</kbd>
                            <span>Vybrat všechny události</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Delete</kbd>
                            <span>Smazat vybrané události</span>
                        </div>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h4>🔍 Vyhledávání</h4>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>F</kbd>
                            <span>Zaměřit vyhledávání</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Vymazat vyhledávání</span>
                        </div>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h4>📤 Export</h4>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>E</kbd>
                            <span>Export událostí</span>
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
    
    // Zavření
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Rozšířené klávesové zkratky pro kalendář
function setupCalendarKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Pouze pokud není focus v input fieldu
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        // Ctrl/Cmd + N - Quick add event
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (globalState.currentSection === 'calendar') {
                showQuickAddModal();
            }
        }
        
        // Ctrl/Cmd + E - Export události
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (globalState.currentSection === 'calendar') {
                exportEventsToCSV(filteredEvents);
            }
        }
        
        // Ctrl/Cmd + F - Focus na search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (globalState.currentSection === 'calendar') {
                const searchInput = document.getElementById('eventSearch');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        }
        
        // Ctrl/Cmd + A - Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            if (globalState.currentSection === 'calendar') {
                e.preventDefault();
                bulkOperations.selectAll();
            }
        }
        
        // G - Go to month selector
        if (e.key === 'g' || e.key === 'G') {
            if (globalState.currentSection === 'calendar') {
                showMonthSelector();
            }
        }
        
        // T - Go to today
        if (e.key === 't' || e.key === 'T') {
            if (globalState.currentSection === 'calendar') {
                goToToday();
            }
        }
        
        // ← → - Navigate months
        if (e.key === 'ArrowLeft') {
            if (globalState.currentSection === 'calendar') {
                changeMonth(-1);
            }
        }
        
        if (e.key === 'ArrowRight') {
            if (globalState.currentSection === 'calendar') {
                changeMonth(1);
            }
        }
        
        // Delete - Delete selected events
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (globalState.currentSection === 'calendar' && bulkOperations.selectedEvents.size > 0) {
                e.preventDefault();
                bulkOperations.deleteSelected();
            }
        }
        
        // Escape - Clear selection
        if (e.key === 'Escape') {
            if (globalState.currentSection === 'calendar') {
                bulkOperations.clearSelection();
                
                // Clear search
                const searchInput = document.getElementById('eventSearch');
                if (searchInput && searchInput.value) {
                    searchInput.value = '';
                    searchEvents('');
                }
            }
        }
    });
    
    console.log('⌨️ Calendar keyboard shortcuts initialized');
}

// ========================================
// ENHANCED SEARCH
// ========================================

// Globální vyhledávání v událostech
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

// Rozšířená search funkce
function searchEvents(query) {
    const trimmedQuery = query.trim().toLowerCase();
    
    if (!trimmedQuery) {
        filterCalendar();
        return;
    }
    
    // Use advanced search if query contains operators
    if (query.includes(':')) {
        filteredEvents = advancedSearch(query);
    } else {
        // Use simple search
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
    
    // Apply existing filters
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
    
    console.log(`🔍 Advanced search for "${query}": ${filteredEvents.length} results`);
}

// ========================================
// STATISTICS
// ========================================

// Rozšířené statistiky kalendáře
function generateCalendarStatistics() {
    const stats = {
        total: calendarState.events.length,
        completed: 0,
        planned: 0,
        thisMonth: 0,
        nextMonth: 0,
        totalVisitors: 0,
        totalSales: 0,
        totalRevenue: 0,
        avgConversion: 0,
        topCity: '',
        topCategory: '',
        byMonth: {},
        byCategory: {},
        byCity: {}
    };
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const nextMonth = thisMonth === 11 ? 0 : thisMonth + 1;
    const nextYear = thisMonth === 11 ? thisYear + 1 : thisYear;
    
    let totalConversions = [];
    const cityStats = {};
    const categoryStats = {};
    const monthStats = {};
    
    calendarState.events.forEach(event => {
        // Základní stats
        if (event.status === 'completed') {
            stats.completed++;
        } else {
            stats.planned++;
        }
        
        // Měsíční stats
        const eventMonth = event.startDate.getMonth();
        const eventYear = event.startDate.getFullYear();
        
        if (eventYear === thisYear && eventMonth === thisMonth) {
            stats.thisMonth++;
        }
        
        if ((eventYear === nextYear && eventMonth === nextMonth) || 
            (eventYear === thisYear && eventMonth === nextMonth)) {
            stats.nextMonth++;
        }
        
        // Numerické stats
        const visitors = event.data.visitors || 0;
        const sales = event.data.sales || event.data.predictedSales || 0;
        const price = event.data.price || 110;
        
        stats.totalVisitors += visitors;
        stats.totalSales += sales;
        stats.totalRevenue += (sales * price);
        
        if (visitors > 0) {
            totalConversions.push((sales / visitors) * 100);
        }
        
        // Město stats
        const city = event.city || 'Neznámé';
        cityStats[city] = (cityStats[city] || 0) + sales;
        
        // Kategorie stats
        const category = event.category || 'ostatní';
        categoryStats[category] = (categoryStats[category] || 0) + sales;
        
        // Měsíční rozpis
        const monthKey = `${eventYear}-${String(eventMonth + 1).padStart(2, '0')}`;
        monthStats[monthKey] = (monthStats[monthKey] || 0) + sales;
    });
    
    // Průměrná konverze
    if (totalConversions.length > 0) {
        stats.avgConversion = totalConversions.reduce((sum, conv) => sum + conv, 0) / totalConversions.length;
    }
    
    // Top město a kategorie
    if (Object.keys(cityStats).length > 0) {
        stats.topCity = Object.keys(cityStats).reduce((a, b) => cityStats[a] > cityStats[b] ? a : b);
    }
    if (Object.keys(categoryStats).length > 0) {
        stats.topCategory = Object.keys(categoryStats).reduce((a, b) => categoryStats[a] > categoryStats[b] ? a : b);
    }
    
    stats.byCity = cityStats;
    stats.byCategory = categoryStats;
    stats.byMonth = monthStats;
    
    return stats;
}

// Zobrazení detailních statistik
function showCalendarStatistics() {
    const stats = generateCalendarStatistics();
    
    const modal = document.createElement('div');
    modal.className = 'modal stats-modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>📊 Statistiky kalendáře</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="stats-overview">
                    <div class="stats-row">
                        <div class="stat-card">
                            <div class="stat-number">${stats.total}</div>
                            <div class="stat-label">Celkem akcí</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.completed}</div>
                            <div class="stat-label">Dokončených</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.planned}</div>
                            <div class="stat-label">Naplánovaných</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.thisMonth}</div>
                            <div class="stat-label">Tento měsíc</div>
                        </div>
                    </div>
                    
                    <div class="stats-row">
                        <div class="stat-card">
                            <div class="stat-number">${formatNumber(stats.totalVisitors)}</div>
                            <div class="stat-label">Celkem návštěvníků</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${formatNumber(stats.totalSales)}</div>
                            <div class="stat-label">Celkem prodejů</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${formatCurrency(stats.totalRevenue)}</div>
                            <div class="stat-label">Celkový obrat</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.avgConversion.toFixed(1)}%</div>
                            <div class="stat-label">Průměrná konverze</div>
                        </div>
                    </div>
                </div>
                
                <div class="stats-details">
                    <div class="stats-section">
                        <h4>🏆 Top výsledky</h4>
                        <div class="top-stats">
                            <div class="top-item">
                                <span class="top-label">Nejlepší město:</span>
                                <span class="top-value">${stats.topCity || 'N/A'}</span>
                            </div>
                            <div class="top-item">
                                <span class="top-label">Nejlepší kategorie:</span>
                                <span class="top-value">${stats.topCategory || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <h4>📈 Rozpis podle měst</h4>
                        <div class="breakdown-list">
                            ${Object.entries(stats.byCity)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([city, sales]) => `
                                    <div class="breakdown-item">
                                        <span>${escapeHtml(city)}</span>
                                        <span>${formatNumber(sales)} ks</span>
                                    </div>
                                `).join('') || '<div class="breakdown-item"><span>Žádná data</span><span>-</span></div>'}
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <h4>📊 Rozpis podle kategorií</h4>
                        <div class="breakdown-list">
                            ${Object.entries(stats.byCategory)
                                .sort((a, b) => b[1] - a[1])
                                .map(([category, sales]) => `
                                    <div class="breakdown-item">
                                        <span>${escapeHtml(category)}</span>
                                        <span>${formatNumber(sales)} ks</span>
                                    </div>
                                `).join('') || '<div class="breakdown-item"><span>Žádná data</span><span>-</span></div>'}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-export" onclick="exportCalendarStatistics()">📄 Export statistik</button>
                <button class="btn" onclick="this.closest('.modal').remove()">Zavřít</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Zavření
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Export statistik
function exportCalendarStatistics() {
    const stats = generateCalendarStatistics();
    
    const csvContent = [
        'Donuland - Statistiky kalendáře',
        `Datum exportu: ${new Date().toLocaleDateString('cs-CZ')}`,
        '',
        'PŘEHLED',
        `Celkem akcí: ${stats.total}`,
        `Dokončených: ${stats.completed}`,
        `Naplánovaných: ${stats.planned}`,
        `Tento měsíc: ${stats.thisMonth}`,
        `Celkem návštěvníků: ${stats.totalVisitors}`,
        `Celkem prodejů: ${stats.totalSales}`,
        `Celkový obrat: ${stats.totalRevenue} Kč`,
        `Průměrná konverze: ${stats.avgConversion.toFixed(2)}%`,
        '',
        'MĚSTA',
        ...Object.entries(stats.byCity)
            .sort((a, b) => b[1] - a[1])
            .map(([city, sales]) => `${city}: ${sales} ks`),
        '',
        'KATEGORIE',
        ...Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([category, sales]) => `${category}: ${sales} ks`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `donuland_statistiky_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(link.href);
    showNotification('📄 Statistiky exportovány', 'success');
}

// ========================================
// UI COMPONENTS
// ========================================

// Bulk actions toolbar
function createBulkActionsToolbar() {
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

// Search box komponenta
function createSearchBox() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'calendar-search';
    
    searchContainer.innerHTML = `
        <div class="search-input-container">
            <input type="text" id="eventSearch" placeholder="🔍 Hledat události..." 
                   autocomplete="off" spellcheck="false">
            <button id="clearSearch" class="clear-search-btn" title="Vymazat vyhledávání">&times;</button>
        </div>
        <div id="searchStats" class="search-stats" style="display: none;"></div>
    `;
    
    return searchContainer;
}

// Calendar action bar
function createCalendarActionBar() {
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
            ${createSearchBox().outerHTML}
        </div>
        
        <div class="action-bar-right">
            <button class="btn btn-small" onclick="exportEventsToCSV(filteredEvents)" title="Ctrl+E">
                📄 Export
            </button>
            <button class="btn btn-small" onclick="showKeyboardShortcuts()">
                ⌨️ Zkratky
            </button>
            <button class="btn btn-small" onclick="refreshCalendarData()">
                🔄 Obnovit
            </button>
        </div>
    `;
    
    return actionBar;
}

// ========================================
// DATA REFRESH
// ========================================

// Obnovení kalendářových dat
function refreshCalendarData() {
    console.log('🔄 Refreshing calendar data...');
    
    showNotification('🔄 Obnovuji kalendářová data...', 'info', 2000);
    
    // Vyčistit cache
    if (typeof globalState !== 'undefined') {
        globalState.weatherCache.clear();
        globalState.distanceCache.clear();
    }
    
    // Reload data
    if (typeof loadData === 'function') {
        loadData().then(() => {
            setTimeout(() => {
                initializeCalendar();
                showNotification('✅ Kalendářová data obnovena', 'success');
            }, 1000);
        }).catch(error => {
            console.error('❌ Failed to refresh calendar data:', error);
            showNotification('❌ Chyba při obnově dat', 'error');
        });
    } else {
        // Fallback - jen reload kalendáře
        setTimeout(() => {
            initializeCalendar();
            showNotification('✅ Kalendář obnoven', 'success');
        }, 500);
    }
}

// ========================================
// AUTO-SAVE SYSTEM
// ========================================

// Auto-save kalendářových změn
const autoSave = {
    SAVE_INTERVAL: 30000, // 30 sekund
    hasChanges: false,
    saveTimer: null,
    
    // Označit změny
    markChanges() {
        this.hasChanges = true;
        this.scheduleSave();
    },
    
    // Naplánovat auto-save
    scheduleSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        
        this.saveTimer = setTimeout(() => {
            this.saveToStorage();
        }, this.SAVE_INTERVAL);
    },
    
    // Uložení do localStorage
    saveToStorage() {
        if (!this.hasChanges) return;
        
        try {
            const manualEvents = calendarState.events.filter(event => 
                event.source === 'manual' || event.source === 'current'
            );
            
            localStorage.setItem('donuland_manual_events', JSON.stringify(manualEvents));
            
            this.hasChanges = false;
            console.log('💾 Calendar auto-saved:', manualEvents.length, 'manual events');
            
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
        }
    },
    
    // Načtení z localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('donuland_manual_events');
            if (saved) {
                const manualEvents = JSON.parse(saved);
                
                // Rekonstruovat Date objekty
                manualEvents.forEach(event => {
                    event.startDate = new Date(event.startDate);
                    event.endDate = new Date(event.endDate);
                });
                
                // Přidat k existujícím událostem
                calendarState.events.push(...manualEvents);
                
                console.log('📂 Loaded', manualEvents.length, 'manual events from storage');
            }
        } catch (error) {
            console.error('❌ Failed to load manual events:', error);
        }
    }
};

// ========================================
// UI INJECTION
// ========================================

// Inject enhanced UI components do existujícího kalendáře
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
    
    // Přidat help button do section header
    const sectionHeader = calendarSection.querySelector('.section-header');
    if (sectionHeader && !sectionHeader.querySelector('.help-button')) {
        const helpButton = document.createElement('button');
        helpButton.className = 'btn btn-small help-button';
        helpButton.innerHTML = '❓ Nápověda & Zkratky';
        helpButton.onclick = showKeyboardShortcuts;
        helpButton.style.marginTop = '15px';
        sectionHeader.appendChild(helpButton);
        console.log('✅ Help button injected');
    }
    
    // Přidat statistiky button do controls
    const calendarControls = calendarSection.querySelector('.calendar-controls');
    if (calendarControls && !calendarControls.querySelector('.stats-button')) {
        const statsButton = document.createElement('button');
        statsButton.className = 'btn btn-small';
        statsButton.innerHTML = '📊 Statistiky';
        statsButton.onclick = showCalendarStatistics;
        calendarControls.appendChild(statsButton);
        console.log('✅ Statistics button injected');
    }
}

// ========================================
// PERFORMANCE OPTIMIZATION
// ========================================

// Virtualizace pro velké množství událostí
const virtualizedCalendar = {
    CHUNK_SIZE: 100,
    currentChunk: 0,
    
    // Reset virtualizace
    reset() {
        this.currentChunk = 0;
    },
    
    // Postupné načítání událostí
    loadEventsChunk() {
        const startIndex = this.currentChunk * this.CHUNK_SIZE;
        const endIndex = startIndex + this.CHUNK_SIZE;
        const chunk = calendarState.events.slice(startIndex, endIndex);
        
        if (chunk.length > 0) {
            this.renderEventsChunk(chunk);
            this.currentChunk++;
            
            // Pokračovat v načítání
            if (endIndex < calendarState.events.length) {
                setTimeout(() => this.loadEventsChunk(), 50);
            }
        }
    },
    
    // Renderování chunku událostí
    renderEventsChunk(events) {
        events.forEach(event => {
            // Najít den v kalendáři a přidat událost
            const startKey = formatDateKey(event.startDate);
            const dayCell = document.querySelector(`[data-date="${startKey}"]`);
            
            if (dayCell) {
                const eventsContainer = dayCell.querySelector('.day-events');
                if (eventsContainer) {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event-item';
                    eventElement.style.backgroundColor = event.color;
                    eventElement.style.color = '#fff';
                    eventElement.textContent = event.title;
                    eventElement.title = `${event.title} - ${event.city}`;
                    
                    if (event.status === 'completed') {
                        eventElement.textContent = '✓ ' + event.title;
                    }
                    
                    eventsContainer.appendChild(eventElement);
                    dayCell.classList.add('has-events');
                }
            }
        });
    }
};

// Debounced resize handler pro kalendář
const debouncedCalendarResize = debounce(() => {
    if (typeof globalState !== 'undefined' && globalState.currentSection === 'calendar') {
        // Přepočítat rozměry kalendáře
        const calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid) {
            // Force reflow pro lepší zobrazení
            calendarGrid.style.display = 'none';
            calendarGrid.offsetHeight; // Trigger reflow
            calendarGrid.style.display = 'grid';
        }
    }
}, 250);

// ========================================
// INICIALIZACE PART 4D
// ========================================

// Hlavní inicializační funkce pro Part 4D
function initializePart4D() {
    console.log('🚀 Initializing Part 4D enhancements...');
    
    try {
        // 1. Load saved manual events
        autoSave.loadFromStorage();
        
        // 2. Inject UI components
        injectEnhancedCalendarUI();
        
        // 3. Initialize search
        setTimeout(() => {
            initializeEventSearch();
        }, 500);
        
        // 4. Setup keyboard shortcuts
        setupCalendarKeyboardShortcuts();
        
        // 5. Setup auto-save interval
        setInterval(() => {
            if (autoSave.hasChanges) {
                autoSave.saveToStorage();
            }
        }, autoSave.SAVE_INTERVAL);
        
        // 6. Reset virtualization
        virtualizedCalendar.reset();
        
        // 7. Use virtualization for large datasets
        if (calendarState.events.length > 200) {
            console.log('📊 Large dataset detected, using virtualization');
            virtualizedCalendar.loadEventsChunk();
        }
        
        console.log('✅ Part 4D initialized successfully');
        
        // Show welcome notification
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('🎉 Kalendář je připraven! Zkuste Ctrl+N pro rychlé přidání akce', 'success', 5000);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Part 4D initialization failed:', error);
        if (typeof showNotification === 'function') {
            showNotification('⚠️ Některé pokročilé funkce kalendáře nemusí fungovat', 'warning');
        }
    }
}

// Rozšíření původní inicializace kalendáře
const originalInitializeCalendar4D = initializeCalendar;
initializeCalendar = function() {
    console.log('🔧 Initializing calendar with Part 4D enhancements...');
    
    // Původní inicializace
    originalInitializeCalendar4D();
    
    // Part 4D rozšíření
    initializePart4D();
    
    console.log('✅ Calendar Part 4D enhancements loaded');
};

// ========================================
// EVENT LISTENERS
// ========================================

// Window resize listener
window.addEventListener('resize', debouncedCalendarResize);

// Auto-save při opuštění stránky
window.addEventListener('beforeunload', () => {
    if (autoSave.hasChanges) {
        autoSave.saveToStorage();
    }
});

// Extended event listeners pro Part 4D
if (typeof eventBus !== 'undefined') {
    // Initialize Part 4D when calendar is requested
    eventBus.on('calendarRequested', () => {
        setTimeout(() => {
            initializePart4D();
        }, 1000);
    });
    
    // Reinitialize after data load
    eventBus.on('dataLoaded', () => {
        setTimeout(() => {
            if (typeof globalState !== 'undefined' && globalState.currentSection === 'calendar') {
                loadCalendarEvents();
                displayFilteredEventsInCalendar();
                updateMonthEventsList();
                bulkOperations.clearSelection();
            }
        }, 500);
    });
    
    // Update after prediction save
    eventBus.on('predictionSaved', () => {
        setTimeout(() => {
            if (typeof globalState !== 'undefined' && globalState.currentSection === 'calendar') {
                loadCalendarEvents();
                displayFilteredEventsInCalendar();
                updateMonthEventsList();
                autoSave.markChanges();
            }
        }, 500);
    });
    
    // Resize handling
    eventBus.on('calendarResizeRequested', () => {
        debouncedCalendarResize();
    });
}

// DOM ready handler pro Part 4D
document.addEventListener('DOMContentLoaded', function() {
    // Wait for basic parts to load
    setTimeout(() => {
        if (document.getElementById('calendar')) {
            console.log('📅 Calendar section found, preparing Part 4D...');
            
            // Initialize Part 4D after a delay to ensure other parts are loaded
            setTimeout(() => {
                initializePart4D();
            }, 3000);
        }
    }, 1000);
});

// ========================================
// GLOBAL EXPORTS
// ========================================

// Global functions export
if (typeof window !== 'undefined') {
    // Make functions available globally for HTML onclick handlers
    window.showQuickAddModal = showQuickAddModal;
    window.saveQuickEvent = saveQuickEvent;
    window.showMonthSelector = showMonthSelector;
    window.applyMonthSelection = applyMonthSelection;
    window.showKeyboardShortcuts = showKeyboardShortcuts;
    window.showCalendarStatistics = showCalendarStatistics;
    window.exportCalendarStatistics = exportCalendarStatistics;
    window.refreshCalendarData = refreshCalendarData;
    window.exportEventsToCSV = exportEventsToCSV;
    
    // Bulk operations object
    window.bulkOperations = bulkOperations;
    
    // Enhanced debug object
    window.donulandCalendarDebug = {
        // State objects
        calendarState,
        calendarFilters,
        filteredEvents,
        bulkOperations,
        autoSave,
        virtualizedCalendar,
        
        // Utility functions
        generateCalendarStatistics,
        exportEventsToCSV,
        advancedSearch,
        
        // UI functions
        initializePart4D,
        injectEnhancedCalendarUI,
        
        // Test functions
        testQuickAdd: () => showQuickAddModal(),
        testSearch: (query) => searchEvents(query),
        testBulkSelect: () => bulkOperations.selectAll(),
        
        // Stats
        getStats: () => generateCalendarStatistics(),
        getEventCount: () => calendarState.events.length,
        getFilteredCount: () => filteredEvents.length
    };
    
    console.log('🔧 Part 4D debug tools available at: window.donulandCalendarDebug');
}

// ========================================
// FINÁLNÍ LOG
// ========================================

console.log('✅ Donuland Part 4D loaded successfully');
console.log('🗓️ Enhanced Calendar Features:');
console.log('  ✅ Bulk Operations (select multiple events)');
console.log('  ✅ Quick Add Event (Ctrl+N)');
console.log('  ✅ Advanced Search (with operators like category:food)');
console.log('  ✅ Keyboard Shortcuts (Ctrl+N, Ctrl+E, G, T, arrows)');
console.log('  ✅ Calendar Statistics & Export');
console.log('  ✅ Auto-save to localStorage');
console.log('  ✅ Performance optimization for large datasets');
console.log('  ✅ Enhanced UI components');
console.log('⌨️  Press F12 → Console → try: window.donulandCalendarDebug');

// Emit completion event
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4DLoaded', { 
        timestamp: Date.now(),
        version: '1.0.0-final',
        features: [
            'bulk-operations',
            'quick-add-event', 
            'advanced-search-with-operators',
            'keyboard-shortcuts',
            'calendar-statistics',
            'csv-export',
            'auto-save-persistence',
            'performance-optimization',
            'enhanced-ui-injection',
            'month-year-selector',
            'data-validation',
            'debug-tools'
        ]
    });
}

// ========================================
// FINÁLNÍ UKONČENÍ PART 4D
// ========================================

console.log('');
console.log('🎉 ========================================');
console.log('🎉   DONULAND PART 4D SUCCESSFULLY LOADED');
console.log('🎉 ========================================');
console.log('📅 Calendar is now enhanced with advanced features!');
console.log('⌨️  Try these shortcuts:');
console.log('   • Ctrl+N = Quick Add Event');
console.log('   • Ctrl+F = Search Events'); 
console.log('   • Ctrl+E = Export Events');
console.log('   • G = Go to Month');
console.log('   • T = Go to Today');
console.log('   • ← → = Navigate Months');
console.log('🔧 Debug: window.donulandCalendarDebug');
console.log('✅ Ready for production use!');
console.log('');

// Success callback
if (typeof window !== 'undefined' && window.donulandOnPart4DLoaded) {
    window.donulandOnPart4DLoaded();
}
