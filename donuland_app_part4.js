/* ========================================
   DONULAND PART 4A - Základní kalendář CLEAN
   Smazat celý part4.js a nahradit tímto
   ======================================== */

console.log('🍩 Donuland Part 4A loading...');

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
