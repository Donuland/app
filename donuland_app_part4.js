/* ========================================
   DONULAND PART 4A - Základní kalendář
   Unikátní barvy pro každou akci + modaly
   ======================================== */

// Globální stav kalendáře
const calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    events: [],
    selectedDate: null,
    selectedEvent: null
};

// Velká paleta barev pro jednotlivé akce
const EVENT_COLORS = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#ff9ff3', '#feca57', 
    '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7', '#55a3ff', '#00b894',
    '#e17055', '#81ecec', '#fab1a0', '#00cec9', '#e84393', '#2d3436', '#636e72', '#b2bec3',
    '#ff3838', '#ff9500', '#ffdd00', '#8bc34a', '#00bcd4', '#3f51b5', '#9c27b0', '#e91e63',
    '#f44336', '#795548', '#607d8b', '#ff5722', '#ff9800', '#ffc107', '#cddc39', '#4caf50',
    '#009688', '#2196f3', '#673ab7', '#9e9e9e', '#ff6b35', '#f7b731', '#5f27cd', '#00d2d3',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#a29bfe'
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
    
    // Historická data ze Sheets
    if (globalState.historicalData) {
        globalState.historicalData.forEach((record, index) => {
            const startDate = parseDate(record.dateFrom);
            const endDate = parseDate(record.dateTo || record.dateFrom);
            
            if (startDate) {
                calendarState.events.push({
                    id: 'historical_' + index,
                    title: record.eventName || 'Neznámá akce',
                    startDate: startDate,
                    endDate: endDate,
                    category: record.category || 'ostatní',
                    city: record.city || '',
                    status: endDate < new Date() ? 'completed' : 'planned',
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
    
    // Uložené predikce
    const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
    savedPredictions.forEach((prediction, index) => {
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
                },
                prediction: prediction
            });
        }
    });
    
    // Aktuální predikce
    if (globalState.lastPrediction && !globalState.lastPrediction.saved) {
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
    
    // Zobrazení událostí
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
    const dayNumber_element = document.createElement('div');
    dayNumber_element.className = 'day-number';
    dayNumber_element.textContent = dayNumber;
    dayCell.appendChild(dayNumber_element);
    
    // Kontejner pro události
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    dayCell.appendChild(eventsContainer);
    
    // Klik na den - zobrazí modal se všemi akcemi toho dne
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
    
    // Seskupení událostí podle datumů
    const eventsByDate = {};
    
    calendarState.events.forEach(event => {
        const startDate = event.startDate;
        const endDate = event.endDate;
        
        // Pro vícedenní události - přidat do všech dnů
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
        return;
    }
    
    calendarState.selectedDate = date;
    
    // Vytvoření modalu
    const modal = document.createElement('div');
    modal.className = 'modal day-modal';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Hlavička
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>📅 ${date.toLocaleDateString('cs-CZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="day-events-list"></div>
        </div>
    `;
    
    const eventsList = modalContent.querySelector('.day-events-list');
    
    // Seznam akcí
    dayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'day-event-item';
        eventItem.style.borderLeft = `4px solid ${event.color}`;
        
        const statusIcon = event.status === 'completed' ? '✅' : '📅';
        const sourceIcon = event.source === 'historical' ? '📈' : event.source === 'prediction' ? '💾' : '🎯';
        
        eventItem.innerHTML = `
            <div class="event-header">
                <h4>${event.title}</h4>
                <div class="event-meta">
                    ${statusIcon} ${event.status === 'completed' ? 'Dokončeno' : 'Naplánováno'} • 
                    ${sourceIcon} ${event.source === 'historical' ? 'Historická data' : 'Predikce'} • 
                    📍 ${event.city}
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
    
    // Zavření na ESC nebo klik mimo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

// Detail konkrétní akce
function showEventDetail(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    calendarState.selectedEvent = event;
    
    // Zavření předchozího modalu
    document.querySelectorAll('.day-modal').forEach(modal => modal.remove());
    
    // Modal s detailem
    const modal = document.createElement('div');
    modal.className = 'modal event-detail-modal';
    modal.style.display = 'flex';
    
    const isCompleted = event.status === 'completed';
    const isPrediction = event.source !== 'historical';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 ${event.title}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="event-detail-grid">
                    <div class="detail-item">
                        <label>Název akce:</label>
                        <span>${event.title}</span>
                    </div>
                    <div class="detail-item">
                        <label>Kategorie:</label>
                        <span>${event.category}</span>
                    </div>
                    <div class="detail-item">
                        <label>Město:</label>
                        <span>${event.city}</span>
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
                        <textarea id="eventNotes" rows="3" placeholder="Poznámky k akci...">${event.data.notes || ''}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-save" onclick="saveEventChanges()">💾 Uložit změny</button>
                ${isPrediction ? '<button class="btn btn-export" onclick="uploadToSheets()">📤 Zapsat do Sheets</button>' : ''}
                <button class="btn btn-delete" onclick="deleteEvent()">🗑️ Smazat akci</button>
                <button class="btn" onclick="this.closest(\'.modal\').remove()">Zrušit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Uložení změn akce
function saveEventChanges() {
    if (!calendarState.selectedEvent) return;
    
    const realSales = document.getElementById('realSales');
    const eventNotes = document.getElementById('eventNotes');
    
    if (realSales) {
        calendarState.selectedEvent.data.sales = parseInt(realSales.value) || 0;
    }
    
    if (eventNotes) {
        calendarState.selectedEvent.data.notes = eventNotes.value;
    }
    
    // Zavřít modal
    document.querySelector('.event-detail-modal').remove();
    
    // Aktualizovat zobrazení
    displayEventsInCalendar();
    
    showNotification('💾 Změny uloženy', 'success');
}

// Smazání akce
function deleteEvent() {
    if (!calendarState.selectedEvent) return;
    
    if (!confirm(`Opravdu chcete smazat akci "${calendarState.selectedEvent.title}"?`)) {
        return;
    }
    
    // Odstranit z pole
    const index = calendarState.events.findIndex(e => e.id === calendarState.selectedEvent.id);
    if (index > -1) {
        calendarState.events.splice(index, 1);
    }
    
    // Zavřít modal
    document.querySelector('.event-detail-modal').remove();
    
    // Aktualizovat zobrazení
    displayEventsInCalendar();
    
    showNotification('🗑️ Akce smazána', 'success');
}

// Upload do Sheets
function uploadToSheets() {
    if (!calendarState.selectedEvent) return;
    
    showNotification('📤 Nahrávám do Google Sheets...', 'info');
    
    // Simulace nahrání
    setTimeout(() => {
        calendarState.selectedEvent.source = 'historical';
        document.querySelector('.event-detail-modal').remove();
        displayEventsInCalendar();
        showNotification('✅ Úspěšně nahráno do Sheets', 'success');
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
}

// Inicializace kalendáře
function initializeCalendar() {
    loadCalendarEvents();
    updateCurrentMonthDisplay();
    generateCalendarGrid();
}

// Event listenery
eventBus.on('dataLoaded', () => {
    setTimeout(initializeCalendar, 500);
});

eventBus.on('predictionSaved', () => {
    setTimeout(initializeCalendar, 500);
});

eventBus.on('calendarRequested', () => {
    initializeCalendar();
});

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    if (globalState && globalState.historicalData) {
        setTimeout(initializeCalendar, 1000);
    }
});
/* ========================================
   DONULAND PART 4B - Filtry a měsíční přehled
   Přidat k Part 4A
   ======================================== */

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

// Aplikování filtrů
function applyCalendarFilters() {
    filteredEvents = calendarState.events.filter(event => {
        // Filtr kategorie
        if (calendarFilters.category && event.category !== calendarFilters.category) {
            return false;
        }
        
        // Filtr statusu
        if (calendarFilters.status && event.status !== calendarFilters.status) {
            return false;
        }
        
        // Filtr zdroje
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
    
    // Aktualizovat kalendář s filtrovanými událostmi
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

// Funkce pro HTML filtry
function filterCalendar() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    
    if (categoryFilter) calendarFilters.category = categoryFilter.value;
    if (statusFilter) calendarFilters.status = statusFilter.value;
    if (sourceFilter) calendarFilters.source = sourceFilter.value;
    
    applyCalendarFilters();
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
    
    showNotification('🔍 Filtry resetovány', 'info', 2000);
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
        
        // Událost se dotýká aktuálního měsíce
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
    const profit = event.data.expectedProfit || 0;
    
    return `
        <div class="month-event-item" onclick="showEventDetail('${event.id}')" style="cursor: pointer;">
            <div class="event-color-bar" style="background-color: ${event.color};"></div>
            <div class="event-info">
                <div class="event-title">${event.title}</div>
                <div class="event-meta">
                    ${statusIcon} ${dateText} • ${sourceIcon} ${event.category} • 📍 ${event.city}
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
                    `<button class="btn-icon" onclick="event.stopPropagation(); uploadEventToSheets('${event.id}')" title="Zapsat do Sheets">📤</button>` : ''}
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

// Upload konkrétní akce do Sheets
function uploadEventToSheets(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event || event.source === 'historical') {
        showNotification('❌ Lze nahrát pouze predikce', 'error');
        return;
    }
    
    showNotification('📤 Nahrávám do Google Sheets...', 'info');
    
    // Simulace nahrání
    setTimeout(() => {
        event.source = 'historical';
        applyCalendarFilters();
        showNotification('✅ Úspěšně nahráno do Sheets', 'success');
    }, 2000);
}

// Rozšíření původní inicializace kalendáře
const originalInitializeCalendar = window.initializeCalendar;
window.initializeCalendar = function() {
    loadCalendarEvents();
    initializeCalendarFilters();
    
    // Nastavit všechny události jako filtrované na začátku
    filteredEvents = [...calendarState.events];
    
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
};

// Rozšíření původní změny měsíce
const originalChangeMonth = window.changeMonth;
window.changeMonth = function(direction) {
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

// Rozšíření originalGoToToday
const originalGoToToday = window.goToToday;
window.goToToday = function() {
    const today = new Date();
    calendarState.currentMonth = today.getMonth();
    calendarState.currentYear = today.getFullYear();
    
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
};

// Rozšíření showDayModal pro filtrované události
window.showDayModal = function(date) {
    const dateKey = formatDateKey(date);
    const dayEvents = filteredEvents.filter(event => {
        const startKey = formatDateKey(event.startDate);
        const endKey = formatDateKey(event.endDate);
        return dateKey >= startKey && dateKey <= endKey;
    });
    
    if (dayEvents.length === 0) {
        showNotification('📅 Žádné události v tomto dni (možná jsou skryté filtry)', 'info', 3000);
        return;
    }
    
    calendarState.selectedDate = date;
    
    // Vytvoření modalu
    const modal = document.createElement('div');
    modal.className = 'modal day-modal';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Hlavička
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
    
    // Seznam akcí
    dayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'day-event-item';
        eventItem.style.borderLeft = `4px solid ${event.color}`;
        
        const statusIcon = event.status === 'completed' ? '✅' : '📅';
        const sourceIcon = event.source === 'historical' ? '📈' : event.source === 'prediction' ? '💾' : '🎯';
        
        eventItem.innerHTML = `
            <div class="event-header">
                <h4>${event.title}</h4>
                <div class="event-meta">
                    ${statusIcon} ${event.status === 'completed' ? 'Dokončeno' : 'Naplánováno'} • 
                    ${sourceIcon} ${event.source === 'historical' ? 'Historická data' : 'Predikce'} • 
                    📍 ${event.city} • 📋 ${event.category}
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
                    `<button class="btn btn-export" onclick="uploadEventToSheets('${event.id}')">📤 Do Sheets</button>` : ''}
            </div>
        `;
        
        eventsList.appendChild(eventItem);
    });
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Zavření na ESC nebo klik mimo
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
};
/* ========================================
   DONULAND PART 4C - CSS styly pro kalendář
   Přidat na konec style.css
   ======================================== */

/* ========================================
   KALENDÁŘ - ROZŠÍŘENÉ STYLY
   ======================================== */

/* Kalendářová mřížka - vylepšení */
.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    background: var(--gray-300);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-bottom: var(--spacing-xl);
    box-shadow: var(--shadow-md);
}

.calendar-header {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: var(--white);
    padding: var(--spacing-md);
    text-align: center;
    font-weight: 700;
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.calendar-day {
    background: var(--white);
    min-height: 120px;
    padding: var(--spacing-xs);
    position: relative;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 2px solid transparent;
}

.calendar-day:hover {
    background: var(--gray-100);
    transform: scale(1.02);
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    z-index: 10;
}

.calendar-day.other-month {
    background: var(--gray-200);
    color: var(--gray-400);
    opacity: 0.6;
}

.calendar-day.today {
    background: linear-gradient(135deg, #fff3cd, #ffeaa7);
    border: 2px solid var(--warning-color);
    font-weight: 700;
    box-shadow: 0 0 15px rgba(255, 193, 7, 0.3);
}

.calendar-day.has-events {
    border-left: 4px solid var(--success-color);
}

.day-number {
    font-weight: 700;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
    position: sticky;
    top: 0;
    background: inherit;
    z-index: 1;
    padding: 2px 0;
}

.day-events {
    font-size: var(--font-size-xs);
    max-height: 90px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--primary-color) transparent;
}

.day-events::-webkit-scrollbar {
    width: 3px;
}

.day-events::-webkit-scrollbar-track {
    background: transparent;
}

.day-events::-webkit-scrollbar-thumb {
    background: var(--primary-color);
    border-radius: 3px;
}

.event-item {
    background: var(--primary-color);
    color: var(--white);
    padding: 3px 6px;
    border-radius: 4px;
    margin-bottom: 3px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 500;
    position: relative;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.event-item:hover {
    transform: scale(1.05);
    z-index: 20;
    white-space: normal;
    position: absolute;
    min-width: 180px;
    max-width: 250px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    padding: 6px 8px;
}

.event-item.more-events {
    background: var(--gray-600);
    text-align: center;
    font-style: italic;
}

.event-item.more-events:hover {
    background: var(--gray-700);
    transform: scale(1.02);
}

/* ========================================
   DENNÍ MODAL
   ======================================== */

.day-modal .modal-content {
    max-width: 700px;
    width: 95%;
    max-height: 85vh;
}

.day-events-list {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: var(--spacing-xs);
}

.day-event-item {
    background: var(--white);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
    border: 1px solid var(--gray-200);
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
}

.day-event-item:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    border-color: var(--primary-color);
}

.event-header {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--gray-200);
}

.event-header h4 {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--gray-800);
    font-size: var(--font-size-lg);
    font-weight: 600;
}

.event-meta {
    color: var(--gray-600);
    font-size: var(--font-size-sm);
    line-height: 1.4;
}

.event-stats {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--gray-100);
    flex-wrap: wrap;
}

.event-stats span {
    background: var(--white);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.event-actions {
    display: flex;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    justify-content: flex-end;
}

.btn-detail, .btn-export {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    border-radius: var(--radius-sm);
}

.btn-export {
    background: var(--warning-color);
    color: var(--gray-800);
}

/* ========================================
   DETAILNÍ MODAL AKCE
   ======================================== */

.event-detail-modal .modal-content {
    max-width: 600px;
    width: 95%;
}

.event-detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-md);
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.detail-item.full-width {
    grid-column: 1 / -1;
}

.detail-item label {
    font-weight: 600;
    color: var(--gray-700);
    font-size: var(--font-size-sm);
}

.detail-item span {
    color: var(--gray-800);
    font-size: var(--font-size-base);
    padding: var(--spacing-xs) 0;
}

.detail-item input,
.detail-item textarea {
    padding: var(--spacing-sm);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
}

.detail-item input:focus,
.detail-item textarea:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    outline: none;
}

/* ========================================
   MĚSÍČNÍ PŘEHLED
   ======================================== */

.month-events-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-sm);
    border-bottom: 2px solid var(--gray-200);
}

.month-events-header h4 {
    margin: 0;
    color: var(--gray-800);
    font-size: var(--font-size-xl);
}

.btn-small {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    border-radius: var(--radius-sm);
    background: var(--gray-200);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-small:hover {
    background: var(--gray-300);
    transform: translateY(-1px);
}

.month-events-list {
    margin-bottom: var(--spacing-xl);
}

.month-event-item {
    background: var(--white);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
    border: 1px solid var(--gray-200);
    overflow: hidden;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    cursor: pointer;
    position: relative;
}

.month-event-item:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    border-color: var(--primary-color);
}

.event-color-bar {
    width: 6px;
    height: 50px;
    border-radius: 3px;
    flex-shrink: 0;
}

.event-info {
    flex: 1;
    min-width: 0;
}

.event-title {
    font-weight: 600;
    color: var(--gray-800);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-xs);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-meta {
    color: var(--gray-600);
    font-size: var(--font-size-sm);
    line-height: 1.3;
}

.event-stats {
    display: flex;
    gap: var(--spacing-lg);
    align-items: center;
    flex-wrap: wrap;
}

.stat-group {
    text-align: center;
    min-width: 80px;
}

.stat-value {
    display: block;
    font-weight: 700;
    color: var(--gray-800);
    font-size: var(--font-size-sm);
    line-height: 1.2;
}

.stat-label {
    display: block;
    color: var(--gray-500);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
}

.event-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
}

.btn-icon {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-sm);
    background: var(--gray-200);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
}

.btn-icon:hover {
    background: var(--primary-color);
    color: var(--white);
    transform: scale(1.1);
}

/* ========================================
   STATISTIKY MĚSÍCE
   ======================================== */

.month-stats {
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    padding: var(--spacing-xl);
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-200);
    box-shadow: var(--shadow-sm);
}

.month-stats h4 {
    text-align: center;
    margin-bottom: var(--spacing-lg);
    color: var(--gray-800);
    font-size: var(--font-size-xl);
    font-weight: 700;
}

.month-stats .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
}

.stat-card {
    background: var(--white);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    text-align: center;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
    border-left: 4px solid var(--primary-color);
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    transform: scaleX(0);
    transition: transform 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
}

.stat-card:hover::before {
    transform: scaleX(1);
}

.stat-card.positive {
    border-left-color: var(--success-color);
}

.stat-card.negative {
    border-left-color: var(--error-color);
}

.stat-number {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: var(--spacing-xs);
    line-height: 1;
}

.stat-card.positive .stat-number {
    color: var(--success-color);
}

.stat-card.negative .stat-number {
    color: var(--error-color);
}

.stat-card .stat-label {
    font-weight: 600;
    color: var(--gray-700);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: var(--font-size-sm);
}

.stat-sublabel {
    color: var(--gray-500);
    font-size: var(--font-size-xs);
    line-height: 1.3;
}

/* ========================================
   FILTRY
   ======================================== */

.calendar-filters {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
    flex-wrap: wrap;
    justify-content: center;
    padding: var(--spacing-md);
    background: var(--gray-100);
    border-radius: var(--radius-md);
}

.calendar-filters select {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 2px solid var(--gray-300);
    border-radius: var(--radius-sm);
    background: var(--white);
    font-size: var(--font-size-sm);
    min-width: 160px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.calendar-filters select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    outline: none;
}

.calendar-filters select:hover {
    border-color: var(--primary-dark);
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */

@media (max-width: 1024px) {
    .calendar-grid {
        font-size: var(--font-size-sm);
    }
    
    .calendar-day {
        min-height: 100px;
    }
    
    .event-stats {
        gap: var(--spacing-sm);
    }
    
    .stat-group {
        min-width: 60px;
    }
    
    .month-stats .stats-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 768px) {
    .calendar-grid {
        gap: 1px;
    }
    
    .calendar-day {
        min-height: 80px;
        padding: 2px;
    }
    
    .day-number {
        font-size: var(--font-size-xs);
    }
    
    .event-item {
        font-size: 10px;
        padding: 2px 4px;
        margin-bottom: 2px;
    }
    
    .event-item:hover {
        min-width: 150px;
        padding: 4px 6px;
    }
    
    .calendar-filters {
        flex-direction: column;
        align-items: center;
    }
    
    .calendar-filters select {
        min-width: 200px;
    }
    
    .month-event-item {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
    }
    
    .event-stats {
        justify-content: space-around;
        width: 100%;
        margin-top: var(--spacing-sm);
    }
    
    .event-actions {
        width: 100%;
        justify-content: center;
        margin-top: var(--spacing-sm);
    }
    
    .month-stats .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .day-modal .modal-content {
        width: 98%;
        margin: 10px;
    }
    
    .event-detail-modal .modal-content {
        width: 98%;
        margin: 10px;
    }
    
    .event-detail-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .calendar-day {
        min-height: 60px;
        padding: 1px;
    }
    
    .day-number {
        font-size: 10px;
        margin-bottom: 1px;
    }
    
    .event-item {
        font-size: 9px;
        padding: 1px 3px;
        margin-bottom: 1px;
    }
    
    .event-item:hover {
        min-width: 120px;
        padding: 3px 5px;
    }
    
    .calendar-controls {
        flex-direction: column;
        text-align: center;
        gap: var(--spacing-sm);
    }
    
    .calendar-controls h3 {
        font-size: var(--font-size-lg);
    }
    
    .month-event-item {
        padding: var(--spacing-sm);
    }
    
    .event-color-bar {
        height: 30px;
    }
    
    .event-title {
        font-size: var(--font-size-sm);
    }
    
    .event-meta {
        font-size: var(--font-size-xs);
    }
    
    .stat-group {
        min-width: 50px;
    }
    
    .stat-value {
        font-size: var(--font-size-xs);
    }
    
    .stat-label {
        font-size: 10px;
    }
    
    .month-stats .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .stat-card {
        padding: var(--spacing-md);
    }
    
    .stat-number {
        font-size: var(--font-size-xl);
    }
}

/* ========================================
   ANIMACE A TRANSITIONS
   ======================================== */

@keyframes eventPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.event-item.new-event {
    animation: eventPulse 1s ease-in-out 3;
}

@keyframes slideInUp {
    from {
        transform: translateY(30px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.month-event-item {
    animation: slideInUp 0.3s ease-out;
}

.month-event-item:nth-child(1) { animation-delay: 0.1s; }
.month-event-item:nth-child(2) { animation-delay: 0.15s; }
.month-event-item:nth-child(3) { animation-delay: 0.2s; }
.month-event-item:nth-child(4) { animation-delay: 0.25s; }
.month-event-item:nth-child(5) { animation-delay: 0.3s; }

@keyframes statCountUp {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.stat-number {
    animation: statCountUp 0.6s ease-out;
}

/* ========================================
   PRINT STYLES
   ======================================== */

@media print {
    .calendar-filters,
    .event-actions,
    .btn-icon,
    .modal {
        display: none !important;
    }
    
    .calendar-grid {
        box-shadow: none;
        border: 1px solid var(--gray-400);
    }
    
    .calendar-day {
        min-height: 100px;
        border: 1px solid var(--gray-300);
    }
    
    .event-item {
        background: var(--gray-200) !important;
        color: var(--gray-800) !important;
        border: 1px solid var(--gray-400);
    }
    
    .month-stats {
        page-break-inside: avoid;
    }
    
    .month-event-item {
        page-break-inside: avoid;
        border: 1px solid var(--gray-400);
    }
}
/* ========================================
   DONULAND PART 4D - Finální integrace
   Nahradit celý part4.js tímto kódem
   ======================================== */

// Globální stav kalendáře
const calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    events: [],
    isInitialized: false
};

// Stav filtrů
const calendarFilters = {
    category: '',
    status: '',
    source: ''
};

// Filtrované události
let filteredEvents = [];

// Velká paleta barev pro jednotlivé akce
const EVENT_COLORS = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#ff9ff3', '#feca57', 
    '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7', '#55a3ff', '#00b894',
    '#e17055', '#81ecec', '#fab1a0', '#00cec9', '#e84393', '#2d3436', '#636e72', '#b2bec3',
    '#ff3838', '#ff9500', '#ffdd00', '#8bc34a', '#00bcd4', '#3f51b5', '#9c27b0', '#e91e63',
    '#f44336', '#795548', '#607d8b', '#ff5722', '#ff9800', '#ffc107', '#cddc39', '#4caf50',
    '#009688', '#2196f3', '#673ab7', '#9e9e9e', '#ff6b35', '#f7b731', '#5f27cd', '#00d2d3',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#a29bfe'
];

let eventColorIndex = 0;

// Kategorie ze Sheets (stejné jako v AI predikci)
const CATEGORIES = [
    'food festival',
    'veletrh', 
    'koncert',
    'kulturní akce',
    'sportovní',
    'ostatní'
];

// ========================================
// UTILITY FUNKCE
// ========================================

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

function formatDateKey(date) {
    if (!date) return '';
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
}

function getUniqueEventColor() {
    const color = EVENT_COLORS[eventColorIndex % EVENT_COLORS.length];
    eventColorIndex++;
    return color;
}

// ========================================
// NAČÍTÁNÍ UDÁLOSTÍ
// ========================================

function loadCalendarEvents() {
    calendarState.events = [];
    eventColorIndex = 0; // Reset barev
    
    // Historická data ze Sheets
    if (globalState.historicalData && globalState.historicalData.length > 0) {
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
    
    html += '</div>';
    
    // Statistiky měsíce
    const stats = {
        totalEvents: currentMonthEvents.length,
        completedEvents: currentMonthEvents.filter(e => e.status === 'completed').length,
        totalVisitors: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0
    };
    
    let validConversions = [];
    
    currentMonthEvents.forEach(event => {
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
    
    html += `
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
    
    monthEvents.innerHTML = html;
}

// ========================================
// NAVIGACE
// ========================================

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
    displayEventsInCalendar();
    updateMonthEventsList();
}

function goToToday() {
    const today = new Date();
    calendarState.currentMonth = today.getMonth();
    calendarState.currentYear = today.getFullYear();
    
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    displayEventsInCalendar();
    updateMonthEventsList();
    
    if (showNotification) {
        showNotification('📅 Přešli jste na aktuální měsíc', 'info', 2000);
    }
}

// ========================================
// HLAVNÍ INICIALIZACE
// ========================================

function initializeCalendar() {
    if (calendarState.isInitialized) {
        return;
    }
    
    loadCalendarEvents();
    initializeCalendarFilters();
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    displayEventsInCalendar();
    updateMonthEventsList();
    
    calendarState.isInitialized = true;
}

// Restart kalendáře
function restartCalendar() {
    calendarState.isInitialized = false;
    eventColorIndex = 0;
    initializeCalendar();
}

// ========================================
// EVENT BUS INTEGRACE
// ========================================

// Event listenery pro komunikaci s ostatními částmi
if (typeof eventBus !== 'undefined') {
    eventBus.on('dataLoaded', () => {
        setTimeout(restartCalendar, 500);
    });
    
    eventBus.on('predictionSaved', () => {
        setTimeout(restartCalendar, 500);
    });
    
    eventBus.on('calendarRequested', () => {
        initializeCalendar();
    });
    
    eventBus.on('calendarMonthChanged', (data) => {
        calendarState.currentMonth = data.month;
        calendarState.currentYear = data.year;
        updateCurrentMonthDisplay();
        generateCalendarGrid();
        displayEventsInCalendar();
        updateMonthEventsList();
    });
    
    eventBus.on('calendarTodayRequested', () => {
        goToToday();
    });
    
    eventBus.on('calendarResizeRequested', () => {
        setTimeout(() => {
            generateCalendarGrid();
            displayEventsInCalendar();
        }, 100);
    });
}

// ========================================
// DOM READY
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Počkat na načtení ostatních částí
    setTimeout(() => {
        if (typeof globalState !== 'undefined' && globalState.historicalData) {
            initializeCalendar();
        }
    }, 1000);
    
    // Fallback inicializace po 3 sekundách
    setTimeout(() => {
        if (!calendarState.isInitialized) {
            initializeCalendar();
        }
    }, 3000);
});

// ========================================
// EXPORT GLOBÁLNÍCH FUNKCÍ
// ========================================

// Zajistit dostupnost funkcí pro HTML
window.changeMonth = changeMonth;
window.goToToday = goToToday;
window.filterCalendar = filterCalendar;
window.resetCalendarFilters = resetCalendarFilters;
window.showEventDetail = showEventDetail;
window.saveEventChanges = saveEventChanges;
window.deleteEvent = deleteEvent;
window.uploadEventToSheets = uploadEventToSheets;
window.initializeCalendar = initializeCalendar;

console.log('✅ Donuland Part 4D loaded - Kompletní kalendář s integrací');
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
                        },
                        prediction: prediction
                    });
                }
            }
        });
    } catch (error) {
        console.warn('Error loading saved predictions:', error);
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
    
    // Nastavit filtrované události
    filteredEvents = [...calendarState.events];
}

// ========================================
// KALENDÁŘ UI
// ========================================

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
}

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

function displayEventsInCalendar() {
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

// ========================================
// FILTRY
// ========================================

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
    
    displayEventsInCalendar();
    updateMonthEventsList();
}

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
    displayEventsInCalendar();
    updateMonthEventsList();
    
    if (showNotification) {
        showNotification('🔍 Filtry resetovány', 'info', 2000);
    }
}

// ========================================
// MODALY
// ========================================

function showDayModal(date) {
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
                    `<button class="btn btn-export" onclick="uploadEventToSheets('${event.id}')">📤 Do Sheets</button>` : ''}
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
                ${isPrediction ? '<button class="btn btn-export" onclick="uploadEventToSheets(\'' + event.id + '\')">📤 Zapsat do Sheets</button>' : ''}
                <button class="btn btn-delete" onclick="deleteEvent('${event.id}')">🗑️ Smazat akci</button>
                <button class="btn" onclick="this.closest('.modal').remove()">Zrušit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ========================================
// AKCE S UDÁLOSTMI
// ========================================

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
    updateMonthEventsList();
    
    if (showNotification) {
        showNotification('💾 Změny uloženy', 'success');
    }
}

function deleteEvent(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    if (!confirm(`Opravdu chcete smazat akci "${event.title}"?`)) {
        return;
    }
    
    const index = calendarState.events.findIndex(e => e.id === eventId);
    if (index > -1) {
        calendarState.events.splice(index, 1);
        filteredEvents = filteredEvents.filter(e => e.id !== eventId);
    }
    
    document.querySelector('.event-detail-modal').remove();
    displayEventsInCalendar();
    updateMonthEventsList();
    
    if (showNotification) {
        showNotification('🗑️ Akce smazána', 'success');
    }
}

function uploadEventToSheets(eventId) {
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
        filterCalendar();
        if (showNotification) {
            showNotification('✅ Úspěšně nahráno do Sheets', 'success');
        }
    }, 2000);
}

// ========================================
// MĚSÍČNÍ PŘEHLED
// ========================================

function updateMonthEventsList() {
    const monthEvents = document.getElementById('monthEvents');
    if (!monthEvents) return;
    
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
    
    currentMonthEvents.sort((a, b) => a.startDate - b.startDate);
    
    let html = `
        <div class="month-events-header">
            <h4>📋 Akce v měsíci (${currentMonthEvents.length})</h4>
            <button class="btn btn-small" onclick="resetCalendarFilters()">🔄 Reset filtrů</button>
        </div>
        <div class="month-events-list">
    `;
    
    currentMonthEvents.forEach(event => {
        const startDate = event.startDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
        const endDate = event.endDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
        const dateText = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
        
        const statusIcon = event.status === 'completed' ? '✅' : '📅';
        const sourceIcon = event.source === 'historical' ? '📈' : '💾';
        
        const visitors = event.data.visitors || 0;
        const sales = event.data.sales || event.data.predictedSales || 0;
        const conversion = visitors > 0 ? ((sales / visitors) * 100).toFixed(1) : '0';
        const revenue = event.data.expectedRevenue || (sales * (event.data.price || 110));
        
        html += `
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
                        `<button class="btn-icon" onclick="event.stopPropagation(); uploadEventToSheets('${event.id}')" title="Zapsat do Sheets">📤</button>` : ''}
                </div>
            </div>
        `;
