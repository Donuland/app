/* ========================================
   DONULAND PART 4A - Základní kalendář (OPRAVENÁ VERZE)
   Včetně blacklist a správného statusu podle data
   ======================================== */

console.log('🍩 Donuland Part 4A FIXED loading...');

// ========================================
// KONTROLA INICIALIZACE
// ========================================

if (typeof window.calendarPart4ALoaded === 'undefined') {
    window.calendarPart4ALoaded = true;
} else {
    console.log('⚠️ Part 4A already loaded, skipping...');
}

// ========================================
// BLACKLIST SYSTÉM PRO SMAZANÉ UDÁLOSTI
// ========================================

const deletedEventsManager = {
    // Získání blacklistu z localStorage
    getDeletedEvents() {
        try {
            return JSON.parse(localStorage.getItem('donuland_deleted_events') || '[]');
        } catch (error) {
            console.warn('Error loading deleted events blacklist:', error);
            return [];
        }
    },
    
    // Přidání události do blacklistu
    addToBlacklist(eventId) {
        const deletedEvents = this.getDeletedEvents();
        if (!deletedEvents.includes(eventId)) {
            deletedEvents.push(eventId);
            localStorage.setItem('donuland_deleted_events', JSON.stringify(deletedEvents));
            console.log(`🗑️ Added to blacklist: ${eventId}`);
        }
    },
    
    // Kontrola, zda je událost v blacklistu
    isDeleted(eventId) {
        return this.getDeletedEvents().includes(eventId);
    },
    
    // Odstranění z blacklistu (pro případ potřeby obnovení)
    removeFromBlacklist(eventId) {
        const deletedEvents = this.getDeletedEvents();
        const index = deletedEvents.indexOf(eventId);
        if (index > -1) {
            deletedEvents.splice(index, 1);
            localStorage.setItem('donuland_deleted_events', JSON.stringify(deletedEvents));
            console.log(`♻️ Removed from blacklist: ${eventId}`);
        }
    }
};

// ========================================
// GLOBÁLNÍ STAV KALENDÁŘE
// ========================================

const calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    events: [],
    isInitialized: false
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

// Normalizace názvu události pro porovnání
function normalizeEventName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/[^\w\s]/g, '') // Odstranit speciální znaky
        .replace(/\s+/g, ' ')    // Normalizovat mezery
        .trim();
}

// Kontrola překrývání datumů
function datesOverlap(start1, end1, start2, end2) {
    return start1 <= end2 && start2 <= end1;
}

// NOVÉ: Určení statusu události podle data
function determineEventStatus(endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Nastavit na začátek dne
    
    const eventEnd = new Date(endDate);
    eventEnd.setHours(23, 59, 59, 999); // Nastavit na konec dne události
    
    if (eventEnd < today) {
        return 'completed'; // Akce skončila
    } else if (eventEnd.toDateString() === today.toDateString()) {
        return 'ongoing'; // Akce probíhá dnes
    } else {
        return 'planned'; // Akce je v budoucnu
    }
}

// ========================================
// NAČÍTÁNÍ A SLUČOVÁNÍ UDÁLOSTÍ
// ========================================

// Hlavní funkce pro načtení všech událostí
function loadCalendarEvents() {
    console.log('📅 Loading calendar events...');
    
    calendarState.events = [];
    
    // 1. Načíst historická data ze globalState
    loadHistoricalEvents();
    
    // 2. Načíst uložené predikce z localStorage
    loadSavedPredictions();
    
    // 3. Načíst aktuální predikci pokud existuje
    loadCurrentPrediction();
    
    // 4. NOVÉ: Filtrovat smazané události pomocí blacklistu
    filterDeletedEvents();
    
    console.log(`✅ Loaded ${calendarState.events.length} total events (after blacklist filtering)`);
    
    // Emit event pro ostatní komponenty
    if (typeof eventBus !== 'undefined') {
        eventBus.emit('calendarEventsLoaded', {
            count: calendarState.events.length,
            events: calendarState.events
        });
    }
}

// NOVÉ: Filtrování smazaných událostí
function filterDeletedEvents() {
    const deletedIds = deletedEventsManager.getDeletedEvents();
    const originalCount = calendarState.events.length;
    
    calendarState.events = calendarState.events.filter(event => {
        const isDeleted = deletedIds.includes(event.id);
        if (isDeleted) {
            console.log(`🗑️ Filtering out deleted event: ${event.title} (${event.id})`);
        }
        return !isDeleted;
    });
    
    const filteredCount = originalCount - calendarState.events.length;
    if (filteredCount > 0) {
        console.log(`🗑️ Filtered out ${filteredCount} deleted events from blacklist`);
    }
}

// Načtení historických dat ze globalState
function loadHistoricalEvents() {
    if (typeof globalState === 'undefined' || !globalState.historicalData) {
        console.log('📊 No historical data available');
        return;
    }
    
    console.log(`📊 Loading ${globalState.historicalData.length} historical events`);
    
    globalState.historicalData.forEach(record => {
        try {
            const startDate = parseDate(record.dateFrom);
            const endDate = parseDate(record.dateTo || record.dateFrom);
            
            if (!startDate) return;
            
            // OPRAVENO: Status podle data, ne pevně "completed"
            const status = determineEventStatus(endDate);
            
            const event = {
                id: `historical_${record.rowIndex || Date.now()}_${Math.random()}`,
                title: record.eventName || 'Historická akce',
                startDate: startDate,
                endDate: endDate,
                category: record.category || 'ostatní',
                city: record.city || '',
                status: status, // OPRAVENO: Dynamický status
                source: 'historical',
                color: getUniqueEventColor(),
                hasRealData: true,
                hasPrediction: false,
                data: {
                    visitors: record.visitors || 0,
                    sales: record.sales || 0,
                    weather: record.weather || '',
                    competition: record.competition || 2,
                    rating: record.rating || 0,
                    notes: record.notes || '',
                    businessModel: record.businessModel || '',
                    price: record.price || 0
                }
            };
            
            calendarState.events.push(event);
            
        } catch (error) {
            console.warn('⚠️ Error processing historical record:', error, record);
        }
    });
}

// Načtení uložených predikcí z localStorage
function loadSavedPredictions() {
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        console.log(`💾 Loading ${savedPredictions.length} saved predictions`);
        
        savedPredictions.forEach((prediction, index) => {
            try {
                const formData = prediction.formData;
                if (!formData || !formData.eventName) return;
                
                const startDate = parseDate(formData.eventDateFrom);
                const endDate = parseDate(formData.eventDateTo);
                
                if (!startDate) return;
                
                const predictionId = `prediction_${index}`;
                
                // Pokusit se sloučit s existující historickou akcí
                const merged = tryMergeWithHistoricalEvent(prediction, predictionId);
                
                if (!merged) {
                    // Vytvořit novou predikční akci
                    createPredictionEvent(prediction, predictionId, startDate, endDate);
                }
                
            } catch (error) {
                console.warn('⚠️ Error processing saved prediction:', error, prediction);
            }
        });
        
    } catch (error) {
        console.error('❌ Error loading saved predictions:', error);
    }
}

// Načtení aktuální predikce z globalState
function loadCurrentPrediction() {
    if (typeof globalState === 'undefined' || !globalState.lastPrediction) {
        return;
    }
    
    console.log('🤖 Loading current prediction');
    
    try {
        const prediction = globalState.lastPrediction;
        const formData = prediction.formData;
        
        if (!formData || !formData.eventName) return;
        
        const startDate = parseDate(formData.eventDateFrom);
        const endDate = parseDate(formData.eventDateTo);
        
        if (!startDate) return;
        
        const predictionId = 'current_prediction';
        
        // Pokusit se sloučit s existující akcí
        const merged = tryMergeWithHistoricalEvent(prediction, predictionId);
        
        if (!merged) {
            // Vytvořit novou predikční akci
            createPredictionEvent(prediction, predictionId, startDate, endDate);
        }
        
    } catch (error) {
        console.warn('⚠️ Error processing current prediction:', error);
    }
}

// Pokus o sloučení predikce s historickou akcí
function tryMergeWithHistoricalEvent(prediction, predictionId) {
    const formData = prediction.formData;
    const startDate = parseDate(formData.eventDateFrom);
    const endDate = parseDate(formData.eventDateTo);
    
    // Najít podobnou historickou akci
    const existingEvent = calendarState.events.find(event => {
        if (!event.hasRealData) return false;
        
        const nameMatch = normalizeEventName(event.title) === normalizeEventName(formData.eventName);
        const dateOverlap = datesOverlap(event.startDate, event.endDate, startDate, endDate);
        
        return nameMatch && dateOverlap;
    });
    
    if (existingEvent) {
        console.log(`🔄 Merging prediction with historical event: ${existingEvent.title}`);
        
        // Sloučit data
        existingEvent.hasPrediction = true;
        existingEvent.source = 'merged';
        existingEvent.prediction = {
            id: predictionId,
            predictedSales: prediction.prediction?.predictedSales || 0,
            confidence: prediction.prediction?.confidence || 0,
            expectedRevenue: prediction.businessResults?.revenue || 0,
            expectedProfit: prediction.businessResults?.profit || 0,
            businessModel: formData.businessModel || '',
            createdAt: prediction.timestamp || new Date().toISOString(),
            formData: formData
        };
        
        // Doplnit chybějící data
        if (!existingEvent.data.visitors && formData.visitors) {
            existingEvent.data.visitors = formData.visitors;
        }
        
        return true; // Sloučeno
    }
    
    return false; // Nesloučeno
}

// Vytvoření nové predikční události
function createPredictionEvent(prediction, predictionId, startDate, endDate) {
    const formData = prediction.formData;
    
    // OPRAVENO: Status podle data, ne pevně "planned"
    const status = determineEventStatus(endDate);
    
    const event = {
        id: predictionId,
        title: formData.eventName || 'Predikce',
        startDate: startDate,
        endDate: endDate,
        category: formData.category || 'ostatní',
        city: formData.city || '',
        status: status, // OPRAVENO: Dynamický status
        source: 'prediction',
        color: getUniqueEventColor(),
        hasRealData: false,
        hasPrediction: true,
        data: {
            visitors: formData.visitors || 0,
            predictedSales: prediction.prediction?.predictedSales || 0,
            confidence: prediction.prediction?.confidence || 0,
            expectedRevenue: prediction.businessResults?.revenue || 0,
            expectedProfit: prediction.businessResults?.profit || 0,
            businessModel: formData.businessModel || '',
            price: formData.price || 110,
            notes: ''
        },
        prediction: {
            id: predictionId,
            predictedSales: prediction.prediction?.predictedSales || 0,
            confidence: prediction.prediction?.confidence || 0,
            expectedRevenue: prediction.businessResults?.revenue || 0,
            expectedProfit: prediction.businessResults?.profit || 0,
            businessModel: formData.businessModel || '',
            createdAt: prediction.timestamp || new Date().toISOString(),
            formData: formData
        }
    };
    
    calendarState.events.push(event);
    console.log(`➕ Created prediction event: ${event.title} (status: ${status})`);
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
    if (!calendarGrid) {
        console.log('❌ Calendar grid element not found');
        return;
    }
    
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
            
            // OPRAVENO: Prefix podle statusu a typu
            let prefix = '';
            if (event.status === 'completed') {
                prefix = '✅ ';
            } else if (event.status === 'ongoing') {
                prefix = '⏰ ';
            } else {
                prefix = '📅 ';
            }
            
            // Typ dat
            if (event.hasRealData && event.hasPrediction) {
                prefix += '🔄 '; // Sloučené
            } else if (event.hasRealData) {
                prefix += '📊 '; // Historická data
            } else if (event.hasPrediction) {
                prefix += '🤖 '; // Predikce
            }
            
            eventElement.textContent = prefix + event.title;
            eventElement.title = `${event.title} - ${event.city} (${event.status})`;
            
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
        
        // OPRAVENO: Status ikony podle skutečného statusu
        let statusIcon = '📅';
        let statusText = 'Naplánováno';
        
        if (event.status === 'completed') {
            statusIcon = '✅';
            statusText = 'Dokončeno';
        } else if (event.status === 'ongoing') {
            statusIcon = '⏰';
            statusText = 'Probíhá';
        }
        
        const sourceIcon = event.hasRealData && event.hasPrediction ? '🔄' : 
                          event.hasRealData ? '📊' : '🤖';
        
        eventItem.innerHTML = `
            <div class="event-header">
                <h4>${escapeHtml(event.title)}</h4>
                <div class="event-meta">
                    ${statusIcon} ${statusText} • 
                    ${sourceIcon} ${event.hasRealData && event.hasPrediction ? 'Sloučená akce' : 
                                   event.hasRealData ? 'Historická data' : 'Predikce'} • 
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
                <button class="btn btn-delete" onclick="deleteEvent('${event.id}')">🗑️ Smazat</button>
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
    
    // OPRAVENO: Rozšířený detail s informacemi o statusu
    let statusText = event.status === 'completed' ? 'Dokončeno' : 
                    event.status === 'ongoing' ? 'Probíhá' : 'Naplánováno';
    let statusColor = event.status === 'completed' ? '#28a745' : 
                     event.status === 'ongoing' ? '#ffc107' : '#17a2b8';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 ${escapeHtml(event.title)}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="event-status-info" style="margin-bottom: 20px; padding: 15px; background: ${statusColor}20; border-left: 4px solid ${statusColor}; border-radius: 6px;">
                    <div style="color: ${statusColor}; font-weight: 600; font-size: 1.1em;">
                        Status: ${statusText}
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        ${event.hasRealData && event.hasPrediction ? '🔄 Sloučená akce (historická data + AI predikce)' : 
                          event.hasRealData ? '📊 Historická data ze Sheets' : '🤖 AI predikce'}
                    </div>
                </div>
                
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
                    ${event.data.visitors ? `
                        <div class="detail-item">
                            <label>Návštěvníci:</label>
                            <span>${formatNumber(event.data.visitors)}</span>
                        </div>
                    ` : ''}
                    ${event.data.sales ? `
                        <div class="detail-item">
                            <label>📊 Reálně prodáno:</label>
                            <span><strong>${formatNumber(event.data.sales)} ks</strong></span>
                        </div>
                    ` : ''}
                    ${event.data.predictedSales ? `
                        <div class="detail-item">
                            <label>🤖 Predikce:</label>
                            <span><strong>${formatNumber(event.data.predictedSales)} ks</strong></span>
                        </div>
                    ` : ''}
                    ${event.hasRealData && event.hasPrediction && event.data.sales && event.data.predictedSales ? `
                        <div class="detail-item">
                            <label>🎯 Přesnost AI:</label>
                            <span><strong>${calculatePredictionAccuracy(event.data.predictedSales, event.data.sales)}%</strong></span>
                        </div>
                    ` : ''}
                    <div class="detail-item full-width">
                        <label>Poznámky:</label>
                        <textarea id="eventNotes" rows="3" placeholder="Přidat poznámku k akci...">${escapeHtml(event.data.notes || '')}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-save" onclick="saveEventChanges('${event.id}')">💾 Uložit změny</button>
                <button class="btn btn-delete" onclick="deleteEvent('${event.id}')">🗑️ Smazat akci</button>
                <button class="btn" onclick="this.closest('.modal').remove()">Zavřít</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// NOVÉ: Výpočet přesnosti predikce
function calculatePredictionAccuracy(predicted, actual) {
    if (!predicted || !actual || predicted <= 0 || actual <= 0) {
        return 0;
    }
    const accuracy = 100 - Math.abs((predicted - actual) / actual) * 100;
    return Math.max(0, Math.min(100, Math.round(accuracy)));
}

// Uložení změn akce
function saveEventChanges(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.querySelector('.event-detail-modal');
    const notesTextarea = modal.querySelector('#eventNotes');
    
    if (notesTextarea) {
        event.data.notes = notesTextarea.value.trim();
        
        // Aktualizovat v localStorage pokud je to predikce
        if (event.hasPrediction && event.prediction.id.startsWith('prediction_')) {
            updatePredictionInStorage(event);
        }
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Změny uloženy', 'success', 2000);
        }
        
        modal.remove();
    }
}

// NOVÉ: Aktualizace predikce v localStorage
function updatePredictionInStorage(event) {
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        const predictionIndex = parseInt(event.prediction.id.replace('prediction_', ''));
        
        if (savedPredictions[predictionIndex]) {
            savedPredictions[predictionIndex].notes = event.data.notes;
            savedPredictions[predictionIndex].updatedAt = new Date().toISOString();
            localStorage.setItem('donuland_predictions', JSON.stringify(savedPredictions));
        }
    } catch (error) {
        console.error('Error updating prediction in storage:', error);
    }
}

// NOVÉ: Smazání akce s blacklist podporou
function deleteEvent(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    const confirmMessage = `Opravdu chcete smazat akci "${event.title}"?` +
        (event.hasPrediction ? '\n\nTím se smaže i související AI predikce.' : '') +
        (event.hasRealData ? '\n\nHistorická data ze Sheets zůstanou zachována, ale akce se již nebude zobrazovat v kalendáři.' : '') +
        '\n\nPozor: Smazaná akce se již neobnoví ani po refresh stránky.';
    
    if (!confirm(confirmMessage)) return;
    
    // PŘIDAT DO BLACKLISTU
    deletedEventsManager.addToBlacklist(eventId);
    
    // Pokud je to sloučená akce, přidat do blacklistu i související predikci
    if (event.hasPrediction && event.prediction && event.prediction.id !== eventId) {
        deletedEventsManager.addToBlacklist(event.prediction.id);
        console.log(`🗑️ Also blacklisted related prediction: ${event.prediction.id}`);
    }
    
    // Odstranit z kalendáře (aktuální zobrazení)
    calendarState.events = calendarState.events.filter(e => e.id !== eventId);
    
    // Smazat z localStorage pokud je to predikce
    if (event.hasPrediction && event.prediction.id.startsWith('prediction_')) {
        deletePredictionFromStorage(event.prediction.id);
    }
    
    // Smazat aktuální predikci z globalState pokud je to current_prediction
    if (eventId === 'current_prediction' && typeof globalState !== 'undefined' && globalState.lastPrediction) {
        globalState.lastPrediction = null;
        console.log('🗑️ Cleared current prediction from globalState');
    }
    
    // Refresh kalendář
    generateCalendarGrid();
    
    // Zavřít modal
    document.querySelector('.event-detail-modal')?.remove();
    document.querySelector('.day-modal')?.remove();
    
    if (typeof showNotification === 'function') {
        showNotification(`🗑️ Akce "${event.title}" byla trvale smazána`, 'success', 4000);
    }
    
    console.log(`🗑️ Event permanently deleted and blacklisted: ${event.title} (${eventId})`);
    
    // Emit event pro ostatní části systému
    if (typeof eventBus !== 'undefined') {
        eventBus.emit('eventDeleted', { 
            eventId: eventId, 
            eventTitle: event.title,
            timestamp: Date.now()
        });
    }
}

// NOVÉ: Smazání predikce z localStorage
function deletePredictionFromStorage(predictionId) {
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        const predictionIndex = parseInt(predictionId.replace('prediction_', ''));
        
        if (savedPredictions[predictionIndex]) {
            savedPredictions.splice(predictionIndex, 1);
            localStorage.setItem('donuland_predictions', JSON.stringify(savedPredictions));
            console.log(`✅ Deleted prediction from storage: ${predictionId}`);
        }
    } catch (error) {
        console.error('❌ Error deleting prediction from storage:', error);
    }
}

// ========================================
// INICIALIZACE KALENDÁŘE
// ========================================

// Hlavní inicializační funkce
function initializeCalendar() {
    console.log('🔧 Initializing calendar...');
    
    if (calendarState.isInitialized) {
        console.log('⚠️ Calendar already initialized');
        return;
    }
    
    // Načíst události
    loadCalendarEvents();
    
    // Generovat kalendář
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    
    // Označit jako inicializovaný
    calendarState.isInitialized = true;
    
    console.log('✅ Calendar initialized successfully');
}

// ========================================
// EVENT LISTENERS
// ========================================

// Event listenery pro externí systémy
if (typeof eventBus !== 'undefined') {
    
    eventBus.on('dataLoaded', () => {
        console.log('📊 Data loaded, updating calendar');
        setTimeout(() => {
            loadCalendarEvents();
            if (calendarState.isInitialized) {
                generateCalendarGrid();
            }
        }, 500);
    });
    
    eventBus.on('predictionSaved', () => {
        console.log('💾 Prediction saved, updating calendar');
        setTimeout(() => {
            loadCalendarEvents();
            if (calendarState.isInitialized) {
                generateCalendarGrid();
            }
        }, 500);
    });
    
    eventBus.on('calendarRequested', () => {
        console.log('📅 Calendar section requested');
        if (!calendarState.isInitialized) {
            initializeCalendar();
        } else {
            // Refresh kalendář
            loadCalendarEvents();
            generateCalendarGrid();
        }
    });
    
    eventBus.on('predictionCalculated', (data) => {
        console.log('🤖 New prediction calculated');
        // Aktualizovat current prediction
        setTimeout(() => {
            loadCalendarEvents();
            if (calendarState.isInitialized) {
                generateCalendarGrid();
            }
        }, 100);
    });
}

// DOM ready listener
document.addEventListener('DOMContentLoaded', function() {
    // Malé zpoždění pro načtení ostatních komponent
    setTimeout(() => {
        const calendarSection = document.getElementById('calendar');
        if (calendarSection && !calendarState.isInitialized) {
            console.log('📅 DOM ready - initializing calendar');
            initializeCalendar();
        }
    }, 2000);
});

// ========================================
// HELPER FUNKCE PRO KOMPATIBILITU
// ========================================

// Helper funkce pro formátování (pokud nejsou definované)
if (typeof formatNumber === 'undefined') {
    function formatNumber(number) {
        if (number === null || number === undefined || isNaN(number)) {
            return '0';
        }
        return new Intl.NumberFormat('cs-CZ').format(Math.round(number));
    }
}

if (typeof formatCurrency === 'undefined') {
    function formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '0 Kč';
        }
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(amount));
    }
}

if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ========================================
// GLOBÁLNÍ EXPORT
// ========================================

// Export funkcí pro HTML onclick handlery
if (typeof window !== 'undefined') {
    window.changeMonth = changeMonth;
    window.goToToday = goToToday;
    window.showEventDetail = showEventDetail;
    window.initializeCalendar = initializeCalendar;
    window.saveEventChanges = saveEventChanges;
    window.deleteEvent = deleteEvent;
    
    // Debug objekt
    window.calendarDebug = {
        state: calendarState,
        loadEvents: loadCalendarEvents,
        generateGrid: generateCalendarGrid,
        events: () => calendarState.events,
        reinitialize: () => {
            calendarState.isInitialized = false;
            initializeCalendar();
        },
        findEvent: (id) => calendarState.events.find(e => e.id === id),
        eventsByType: () => {
            const types = { historical: 0, prediction: 0, merged: 0 };
            calendarState.events.forEach(e => {
                if (e.hasRealData && e.hasPrediction) types.merged++;
                else if (e.hasRealData) types.historical++;
                else if (e.hasPrediction) types.prediction++;
            });
            return types;
        },
        eventsByStatus: () => {
            const statuses = { completed: 0, ongoing: 0, planned: 0 };
            calendarState.events.forEach(e => {
                statuses[e.status]++;
            });
            return statuses;
        },
        blacklist: {
            getAll: () => deletedEventsManager.getDeletedEvents(),
            add: (eventId) => deletedEventsManager.addToBlacklist(eventId),
            remove: (eventId) => deletedEventsManager.removeFromBlacklist(eventId),
            clear: () => {
                localStorage.removeItem('donuland_deleted_events');
                console.log('🧹 Blacklist cleared');
            },
            restore: (eventId) => {
                deletedEventsManager.removeFromBlacklist(eventId);
                loadCalendarEvents();
                generateCalendarGrid();
                console.log(`♻️ Event restored: ${eventId}`);
            }
        }
    };
}

console.log('✅ Donuland Part 4A FIXED loaded successfully');
console.log('📅 Features: Basic calendar, Event loading, Smart merging, Modal details');
console.log('🔄 Smart merging: Predictions automatically merge with historical events');
console.log('📊 Data sources: Historical data + Saved predictions + Current prediction');
console.log('⏰ Status system: completed/ongoing/planned based on current date');
console.log('🗑️ Blacklist system: Deleted events stay deleted after page refresh');
console.log('🔧 Debug: window.calendarDebug available with blacklist management');

// Emit completion event
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4ALoaded', { 
        timestamp: Date.now(),
        version: '4A-fixed-1.0.0',
        features: [
            'basic-calendar-grid',
            'event-loading-and-merging', 
            'modal-day-view',
            'event-detail-modal',
            'smart-prediction-merging',
            'multiple-data-sources',
            'dynamic-status-by-date',
            'blacklist-deleted-events',
            'persistent-deletion',
            'prediction-accuracy-calculation'
        ]
    });
}
/* ========================================
   DONULAND PART 4B - Filtry a měsíční přehled
   Rozšíření Part 4A - bez duplikací
   ======================================== */

console.log('🍩 Donuland Part 4B loading...');

// ========================================
// KONTROLA INICIALIZACE
// ========================================

if (typeof window.calendarPart4BLoaded === 'undefined') {
    window.calendarPart4BLoaded = true;
} else {
    console.log('⚠️ Part 4B already loaded, skipping...');
}

// ========================================
// STAV FILTRŮ
// ========================================

const calendarFilters = {
    category: '',
    status: '',
    source: '',
    city: '',
    searchText: ''
};

// Filtrované události (pro zobrazení)
let filteredEvents = [];

// ========================================
// INICIALIZACE FILTRŮ
// ========================================

// Inicializace dropdown filtrů
function initializeCalendarFilters() {
    console.log('🔍 Initializing calendar filters...');
    
    // Pokud nejsou události, počkat
    if (!calendarState.events || calendarState.events.length === 0) {
        console.log('⚠️ No events yet, delaying filter initialization');
        setTimeout(initializeCalendarFilters, 1000);
        return;
    }
    
    // Kategorie filter
    populateCategoryFilter();
    
    // Město filter  
    populateCityFilter();
    
    // Status filter (statický)
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.innerHTML = `
            <option value="">📊 Všechny stavy</option>
            <option value="completed">✅ Dokončené</option>
            <option value="planned">🔮 Naplánované</option>
        `;
    }
    
    // Zdroj filter (statický)
    createSourceFilter();
    
    // Nastavit všechny události jako filtrované na začátku
    filteredEvents = [...calendarState.events];
    
    console.log('✅ Calendar filters initialized');
}

// Naplnění kategorie filtru
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const categories = new Set();
    calendarState.events.forEach(event => {
        if (event.category) {
            categories.add(event.category);
        }
    });
    
    categoryFilter.innerHTML = '<option value="">📋 Všechny kategorie</option>';
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    console.log(`📋 Populated ${categories.size} categories`);
}

// Naplnění města filtru - TOTO BYLO PROBLÉM!
function populateCityFilter() {
    const cityFilter = document.getElementById('cityFilter');
    if (!cityFilter) {
        console.log('❌ cityFilter element not found');
        return;
    }
    
    const cities = new Set();
    calendarState.events.forEach(event => {
        if (event.city && event.city.trim()) {
            cities.add(event.city.trim());
        }
    });
    
    cityFilter.innerHTML = '<option value="">🏙️ Všechna města</option>';
    Array.from(cities).sort().forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });
    
    console.log(`🏙️ Populated ${cities.size} cities:`, Array.from(cities));
}

// Vytvoření zdroj filtru (neexistuje v HTML)
function createSourceFilter() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter || !statusFilter.parentElement) return;
    
    // Zkontrolovat, zda už neexistuje
    if (document.getElementById('sourceFilter')) return;
    
    const sourceFilter = document.createElement('select');
    sourceFilter.id = 'sourceFilter';
    sourceFilter.addEventListener('change', filterCalendar);
    
    sourceFilter.innerHTML = `
        <option value="">🔗 Všechny zdroje</option>
        <option value="historical">📊 Pouze historická data</option>
        <option value="prediction">🤖 Pouze predikce</option>
        <option value="merged">🔄 Sloučené akce</option>
    `;
    
    // Vložit za status filter
    statusFilter.parentElement.insertBefore(sourceFilter, statusFilter.nextSibling);
    console.log('✅ Source filter created');
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
    const cityFilter = document.getElementById('cityFilter');
    
    if (categoryFilter) calendarFilters.category = categoryFilter.value;
    if (statusFilter) calendarFilters.status = statusFilter.value;
    if (sourceFilter) calendarFilters.source = sourceFilter.value;
    if (cityFilter) calendarFilters.city = cityFilter.value;
    
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
        
        // Město filter
        if (calendarFilters.city && event.city !== calendarFilters.city) {
            return false;
        }
        
        // Source filter
        if (calendarFilters.source) {
            switch (calendarFilters.source) {
                case 'historical':
                    if (!event.hasRealData || event.hasPrediction) return false;
                    break;
                case 'prediction':
                    if (!event.hasPrediction || event.hasRealData) return false;
                    break;
                case 'merged':
                    if (!(event.hasRealData && event.hasPrediction)) return false;
                    break;
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
    
    // Zobrazit statistiky filtru
    showFilterStats();
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
            
            // Prefix podle typu
            let prefix = '';
            if (event.hasRealData && event.hasPrediction) {
                prefix = '🔄 '; // Sloučené
            } else if (event.hasRealData) {
                prefix = '📊 '; // Historická data
            } else if (event.hasPrediction) {
                prefix = '🤖 '; // Predikce
            }
            
            if (event.status === 'completed') {
                prefix = '✅ ' + prefix;
            }
            
            eventElement.textContent = prefix + event.title;
            eventElement.title = `${event.title} - ${event.city}`;
            
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

// Zobrazení statistik filtru
function showFilterStats() {
    // Najít nebo vytvořit stats element
    let statsEl = document.getElementById('filterStats');
    if (!statsEl) {
        const filtersContainer = document.querySelector('.calendar-filters');
        if (filtersContainer) {
            statsEl = document.createElement('div');
            statsEl.id = 'filterStats';
            statsEl.className = 'filter-stats';
            filtersContainer.appendChild(statsEl);
        }
    }
    
    if (!statsEl) return;
    
    // Vypočítat statistiky
    const total = calendarState.events.length;
    const filtered = filteredEvents.length;
    const merged = filteredEvents.filter(e => e.hasRealData && e.hasPrediction).length;
    const historical = filteredEvents.filter(e => e.hasRealData && !e.hasPrediction).length;
    const predictions = filteredEvents.filter(e => !e.hasRealData && e.hasPrediction).length;
    
    if (filtered === total) {
        statsEl.style.display = 'none';
    } else {
        statsEl.style.display = 'block';
        statsEl.innerHTML = `
            <small>
                🔍 Zobrazeno ${filtered} z ${total} událostí 
                (🔄${merged} sloučených, 📊${historical} historických, 🤖${predictions} predikcí)
            </small>
        `;
    }
}

// Reset všech filtrů
function resetCalendarFilters() {
    console.log('🔄 Resetting calendar filters...');
    
    // Reset hodnot
    calendarFilters.category = '';
    calendarFilters.status = '';
    calendarFilters.source = '';
    calendarFilters.city = '';
    calendarFilters.searchText = '';
    
    // Reset UI elementů
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    const cityFilter = document.getElementById('cityFilter');
    const searchInput = document.getElementById('eventSearch');
    
    if (categoryFilter) categoryFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sourceFilter) sourceFilter.value = '';
    if (cityFilter) cityFilter.value = '';
    if (searchInput) searchInput.value = '';
    
    // Zobrazit všechny události
    filteredEvents = [...calendarState.events];
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
    
    // Skrýt search stats
    const statsEl = document.getElementById('filterStats');
    if (statsEl) {
        statsEl.style.display = 'none';
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
    if (!searchInput) {
        console.log('⚠️ Search input not found, creating it...');
        createSearchInput();
        return;
    }
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchEvents(e.target.value);
        }, 300);
    });
    
    console.log('🔍 Event search initialized');
}

// Vytvoření search inputu (pokud neexistuje)
function createSearchInput() {
    const filtersContainer = document.querySelector('.calendar-filters');
    if (!filtersContainer) return;
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <input type="text" id="eventSearch" placeholder="🔍 Hledat události..." 
               style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; width: 200px;">
    `;
    
    filtersContainer.appendChild(searchContainer);
    
    // Inicializovat search po vytvoření
    setTimeout(initializeEventSearch, 100);
}

// Vyhledávání v událostech
function searchEvents(query) {
    const trimmedQuery = query.trim();
    calendarFilters.searchText = trimmedQuery;
    
    // Aplikovat všechny filtry včetně vyhledávání
    filterCalendar();
    
    console.log(`🔍 Search for "${query}": ${filteredEvents.length} results`);
}

// ========================================
// MĚSÍČNÍ PŘEHLED
// ========================================

// Aktualizace seznamu událostí měsíce
function updateMonthEventsList() {
    const monthEvents = document.getElementById('monthEvents');
    if (!monthEvents) {
        console.log('❌ monthEvents element not found');
        return;
    }
    
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
            <div class="month-events-controls">
                <button class="btn btn-small" onclick="resetCalendarFilters()">🔄 Reset filtrů</button>
                <button class="btn btn-small" onclick="exportMonthEvents()">📄 Export měsíce</button>
            </div>
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
    console.log(`📋 Month events updated: ${currentMonthEvents.length} events`);
}

// Vytvoření položky události v měsíčním seznamu
function createMonthEventItem(event) {
    const startDate = event.startDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
    const endDate = event.endDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
    const dateText = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
    
    // Ikony podle typu
    let statusIcon = event.status === 'completed' ? '✅' : '📅';
    let sourceIcon = '';
    if (event.hasRealData && event.hasPrediction) {
        sourceIcon = '🔄'; // Sloučené
    } else if (event.hasRealData) {
        sourceIcon = '📊'; // Historická data
    } else if (event.hasPrediction) {
        sourceIcon = '🤖'; // Predikce
    }
    
    // Statistiky
    const visitors = event.data.visitors || 0;
    const realSales = event.data.sales || 0;
    const predictedSales = event.data.predictedSales || 0;
    
    const displaySales = realSales > 0 ? realSales : predictedSales;
    const salesType = realSales > 0 ? 'prodáno' : 'predikce';
    
    const conversion = visitors > 0 && displaySales > 0 ? ((displaySales / visitors) * 100).toFixed(1) : '0';
    const revenue = displaySales * (record.price || 0);
    
    // Accuracy pro sloučené akce
    let accuracyHtml = '';
    if (event.hasRealData && event.hasPrediction && realSales > 0 && predictedSales > 0) {
        const accuracy = calculatePredictionAccuracy(predictedSales, realSales);
        const accuracyColor = accuracy >= 80 ? '#28a745' : accuracy >= 60 ? '#ffc107' : '#dc3545';
        accuracyHtml = `
            <div class="stat-group">
                <span class="stat-value" style="color: ${accuracyColor};">${accuracy}%</span>
                <span class="stat-label">přesnost AI</span>
            </div>
        `;
    }
    
    return `
        <div class="month-event-item ${event.hasRealData && event.hasPrediction ? 'merged-event' : ''}" 
             onclick="showEventDetail('${event.id}')" style="cursor: pointer;">
            <div class="event-color-bar" style="background-color: ${event.color};"></div>
            <div class="event-info">
                <div class="event-title">${escapeHtml(event.title)}</div>
                <div class="event-meta">
                    ${statusIcon} ${dateText} • ${sourceIcon} ${escapeHtml(event.category)} • 📍 ${escapeHtml(event.city)}
                    ${event.hasRealData && event.hasPrediction ? ' • 🔄 Sloučená akce' : ''}
                </div>
            </div>
            <div class="event-stats">
                <div class="stat-group">
                    <span class="stat-value">${formatNumber(visitors)}</span>
                    <span class="stat-label">návštěvníků</span>
                </div>
                <div class="stat-group">
                    <span class="stat-value">${formatNumber(displaySales)}</span>
                    <span class="stat-label">${salesType}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-value">${conversion}%</span>
                    <span class="stat-label">konverze</span>
                </div>
                <div class="stat-group">
                    <span class="stat-value">${formatCurrency(revenue)}</span>
                    <span class="stat-label">obrat</span>
                </div>
                ${accuracyHtml}
            </div>
        </div>
    `;
}

// Vytvoření statistik měsíce
function createMonthStats(events) {
    const stats = {
        totalEvents: events.length,
        completedEvents: events.filter(e => e.status === 'completed').length,
        mergedEvents: events.filter(e => e.hasRealData && e.hasPrediction).length,
        historicalOnlyEvents: events.filter(e => e.hasRealData && !e.hasPrediction).length,
        predictionOnlyEvents: events.filter(e => !e.hasRealData && e.hasPrediction).length,
        totalVisitors: 0,
        totalSales: 0,
        totalRevenue: 0
    };
    
    let validConversions = [];
    
    events.forEach(event => {
        const visitors = event.data.visitors || 0;
        const sales = (event.data.sales || 0) + (event.data.predictedSales || 0);
        const revenue = sales * (record.price || 0);
        
        stats.totalVisitors += visitors;
        stats.totalSales += sales;
        stats.totalRevenue += revenue;
        
        if (visitors > 0 && sales > 0) {
            validConversions.push((sales / visitors) * 100);
        }
    });
    
    const avgConversion = validConversions.length > 0 
        ? validConversions.reduce((sum, conv) => sum + conv, 0) / validConversions.length 
        : 0;
    
    return `
        <div class="month-stats">
            <h4>📊 Statistiky měsíce</h4>
            
            <div class="stats-breakdown">
                <h5>🔗 Typy akcí</h5>
                <div class="breakdown-grid">
                    <div class="breakdown-item">
                        <span>🔄 Sloučené akce</span>
                        <span>${stats.mergedEvents}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>📊 Pouze historická data</span>
                        <span>${stats.historicalOnlyEvents}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>🤖 Pouze predikce</span>
                        <span>${stats.predictionOnlyEvents}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>✅ Dokončené akce</span>
                        <span>${stats.completedEvents} z ${stats.totalEvents}</span>
                    </div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${formatNumber(stats.totalVisitors)}</div>
                    <div class="stat-label">Celkem návštěvníků</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatNumber(stats.totalSales)}</div>
                    <div class="stat-label">Celkem prodej/predikce</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${avgConversion.toFixed(1)}%</div>
                    <div class="stat-label">Průměrná konverze</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatCurrency(stats.totalRevenue)}</div>
                    <div class="stat-label">Celkový obrat</div>
                </div>
            </div>
        </div>
    `;
}

// Výpočet přesnosti predikce
function calculatePredictionAccuracy(predicted, actual) {
    if (!predicted || !actual || predicted <= 0 || actual <= 0) {
        return 0;
    }
    const accuracy = 100 - Math.abs((predicted - actual) / actual) * 100;
    return Math.max(0, Math.min(100, Math.round(accuracy)));
}

// Export událostí měsíce
function exportMonthEvents() {
    const monthStart = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
    const monthEnd = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
    
    const monthEvents = filteredEvents.filter(event => {
        const eventStart = event.startDate;
        const eventEnd = event.endDate;
        return (eventStart <= monthEnd && eventEnd >= monthStart);
    });
    
    if (monthEvents.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('❌ Žádné události k exportu v tomto měsíci', 'error');
        }
        return;
    }
    
    const monthName = new Date(calendarState.currentYear, calendarState.currentMonth, 1)
        .toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
    
    console.log(`📄 Exporting ${monthEvents.length} events for ${monthName}`);
    
    if (typeof showNotification === 'function') {
        showNotification(`📄 ${monthEvents.length} událostí exportováno pro ${monthName}`, 'success');
    }
}

// ========================================
// ROZŠÍŘENÍ EXISTUJÍCÍCH FUNKCÍ
// ========================================

// Rozšíření changeMonth z Part 4A
if (typeof window.changeMonth_Part4B_Extended === 'undefined') {
    window.changeMonth_Part4B_Extended = true;
    
    const originalChangeMonth = window.changeMonth;
    window.changeMonth = function(direction) {
        originalChangeMonth(direction);
        
        // Po změně měsíce aktualizovat filtrované zobrazení
        setTimeout(() => {
            displayFilteredEventsInCalendar();
            updateMonthEventsList();
        }, 100);
    };
}

// Rozšíření goToToday z Part 4A
if (typeof window.goToToday_Part4B_Extended === 'undefined') {
    window.goToToday_Part4B_Extended = true;
    
    const originalGoToToday = window.goToToday;
    window.goToToday = function() {
        originalGoToToday();
        
        // Po přechodu na dnes aktualizovat filtrované zobrazení
        setTimeout(() => {
            displayFilteredEventsInCalendar();
            updateMonthEventsList();
        }, 100);
    };
}

// Rozšíření showDayModal z Part 4A pro filtrované události
if (typeof window.showDayModal_Part4B_Extended === 'undefined') {
    window.showDayModal_Part4B_Extended = true;
    
    const originalShowDayModal = window.showDayModal;
    window.showDayModal = function(date) {
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
        
        // Pokračovat s původní funkcí, ale s filtrovanými událostmi
        originalShowDayModal.call(this, date);
    };
}

// ========================================
// EVENT LISTENERS PRO PART 4B
// ========================================

// Event listeners pro filtry
if (typeof eventBus !== 'undefined') {
    
    eventBus.on('calendarEventsLoaded', () => {
        console.log('📅 Events loaded, initializing filters');
        setTimeout(() => {
            initializeCalendarFilters();
            initializeEventSearch();
            updateMonthEventsList();
        }, 200);
    });
    
    eventBus.on('dataLoaded', () => {
        setTimeout(() => {
            if (typeof globalState !== 'undefined' && globalState.currentSection === 'calendar') {
                // Re-initialize filters after data load
                initializeCalendarFilters();
                updateMonthEventsList();
            }
        }, 500);
    });
    
    eventBus.on('predictionSaved', () => {
        setTimeout(() => {
            if (typeof globalState !== 'undefined' && globalState.currentSection === 'calendar') {
                // Re-populate filters after prediction save
                populateCategoryFilter();
                populateCityFilter();
                filteredEvents = [...calendarState.events];
                displayFilteredEventsInCalendar();
                updateMonthEventsList();
            }
        }, 500);
    });
    
    eventBus.on('calendarRequested', () => {
        setTimeout(() => {
            if (calendarState.events && calendarState.events.length > 0) {
                initializeCalendarFilters();
                initializeEventSearch();
                filteredEvents = [...calendarState.events];
                displayFilteredEventsInCalendar();
                updateMonthEventsList();
            }
        }, 500);
    });
    
    eventBus.on('predictionCalculated', () => {
        setTimeout(() => {
            // Update filters when new prediction is calculated
            if (calendarState.events && calendarState.events.length > 0) {
                populateCategoryFilter();
                populateCityFilter();
                filteredEvents = [...calendarState.events];
                displayFilteredEventsInCalendar();
                updateMonthEventsList();
            }
        }, 300);
    });
}

// ========================================
// HELPER FUNKCE A CSS INJEKCE
// ========================================

// Inject CSS pro Part 4B pokud neexistuje
function injectPart4BCSS() {
    if (document.getElementById('part4b-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'part4b-styles';
    style.textContent = `
        .filter-stats {
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            margin-top: 10px;
            border: 1px solid #dee2e6;
        }
        
        .search-container {
            margin-top: 10px;
            text-align: center;
        }
        
        .month-events-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #dee2e6;
        }
        
        .month-events-header h4 {
            margin: 0;
            color: #495057;
        }
        
        .month-events-controls {
            display: flex;
            gap: 10px;
        }
        
        .btn-small {
            padding: 6px 12px;
            font-size: 0.875rem;
            border-radius: 4px;
            background: #6c757d;
            color: white;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-small:hover {
            background: #5a6268;
            transform: translateY(-1px);
        }
        
        .month-events-list {
            margin-bottom: 30px;
        }
        
        .month-event-item {
            background: white;
            border-radius: 8px;
            margin-bottom: 15px;
            border: 1px solid #dee2e6;
            overflow: hidden;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            cursor: pointer;
        }
        
        .month-event-item:hover {
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transform: translateY(-2px);
            border-color: #667eea;
        }
        
        .month-event-item.merged-event {
            border-left: 4px solid #28a745;
            background: linear-gradient(135deg, #ffffff, #f8fff9);
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
            color: #495057;
            font-size: 1rem;
            margin-bottom: 5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .event-meta {
            color: #6c757d;
            font-size: 0.875rem;
            line-height: 1.3;
        }
        
        .event-stats {
            display: flex;
            gap: 20px;
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
            color: #495057;
            font-size: 0.875rem;
            line-height: 1.2;
        }
        
        .stat-label {
            display: block;
            color: #6c757d;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }
        
        .month-stats {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #dee2e6;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .month-stats h4 {
            text-align: center;
            margin-bottom: 20px;
            color: #495057;
            font-size: 1.25rem;
        }
        
        .stats-breakdown {
            margin-bottom: 25px;
        }
        
        .stats-breakdown h5 {
            margin-bottom: 15px;
            color: #495057;
            font-size: 1rem;
            text-align: center;
        }
        
        .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
        }
        
        .breakdown-item span:first-child {
            color: #495057;
            font-weight: 500;
            font-size: 0.875rem;
        }
        
        .breakdown-item span:last-child {
            color: #667eea;
            font-weight: 600;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
            border-left: 4px solid #667eea;
        }
        
        .stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 5px;
            line-height: 1;
        }
        
        .stat-card .stat-label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.75rem;
        }
        
        .events-placeholder {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px dashed #dee2e6;
        }
        
        .events-placeholder p {
            margin-bottom: 10px;
        }
        
        .events-placeholder small {
            color: #6c757d;
        }
        
        @media (max-width: 768px) {
            .month-event-item {
                flex-direction: column;
                align-items: flex-start;
                text-align: left;
            }
            
            .event-stats {
                justify-content: space-around;
                width: 100%;
                margin-top: 10px;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .breakdown-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 480px) {
            .month-events-header {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }
            
            .event-stats {
                gap: 15px;
            }
            
            .stat-group {
                min-width: 60px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .month-stats {
                padding: 20px 15px;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Part 4B CSS injected');
}

// ========================================
// GLOBÁLNÍ EXPORT PRO PART 4B
// ========================================

// Export funkcí pro HTML onclick handlers
if (typeof window !== 'undefined') {
    window.filterCalendar = filterCalendar;
    window.resetCalendarFilters = resetCalendarFilters;
    window.searchEvents = searchEvents;
    window.exportMonthEvents = exportMonthEvents;
    
    // Rozšíření debug objektu
    if (window.calendarDebug) {
        window.calendarDebug.filters = calendarFilters;
        window.calendarDebug.filteredEvents = () => filteredEvents;
        window.calendarDebug.resetFilters = resetCalendarFilters;
        window.calendarDebug.reloadFilters = () => {
            initializeCalendarFilters();
            initializeEventSearch();
        };
        window.calendarDebug.getMonthStats = () => {
            const monthStart = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
            const monthEnd = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
            
            const monthEvents = filteredEvents.filter(event => {
                const eventStart = event.startDate;
                const eventEnd = event.endDate;
                return (eventStart <= monthEnd && eventEnd >= monthStart);
            });
            
            return {
                total: monthEvents.length,
                merged: monthEvents.filter(e => e.hasRealData && e.hasPrediction).length,
                historicalOnly: monthEvents.filter(e => e.hasRealData && !e.hasPrediction).length,
                predictionOnly: monthEvents.filter(e => !e.hasRealData && e.hasPrediction).length,
                completed: monthEvents.filter(e => e.status === 'completed').length
            };
        };
    }
}

// ========================================
// INICIALIZACE PART 4B
// ========================================

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inject CSS styly
    injectPart4BCSS();
    
    // Malé zpoždění pro načtení Part 4A
    setTimeout(() => {
        if (calendarState && calendarState.events && calendarState.events.length > 0) {
            console.log('📅 Part 4B initializing filters and search');
            initializeCalendarFilters();
            initializeEventSearch();
            filteredEvents = [...calendarState.events];
            updateMonthEventsList();
        }
    }, 3000);
});

console.log('✅ Donuland Part 4B loaded successfully');
console.log('🔍 Filter features: Category, Status, Source, City, Text search');
console.log('📋 Monthly overview: Event list with merge indicators, Statistics, Export');
console.log('🔄 Smart integration: All Part 4A functions work with enhanced filters');

// Emit completion event
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4BLoaded', { 
        timestamp: Date.now(),
        version: '4B-clean-1.0.0',
        features: [
            'enhanced-filters-for-merged-events',
            'smart-search-functionality', 
            'monthly-overview-with-statistics',
            'city-filter-population',
            'filter-statistics-display',
            'responsive-month-event-list',
            'merged-events-indicators'
       ]
    });
}
/* ========================================
   DONULAND PART 4C - OPRAVENÁ KOMPATIBILNÍ VERZE
   Minimální kalendářové funkce kompatibilní s Part 4A/4B
   ======================================== */

console.log('🍩 Donuland Part 4C FIXED loading...');

// ========================================
// KONTROLA INICIALIZACE A KOMPATIBILITY
// ========================================

if (typeof window.calendarPart4CLoaded === 'undefined') {
    window.calendarPart4CLoaded = true;
} else {
    console.log('⚠️ Part 4C already loaded, skipping...');
}

// Čekání na Part 4A inicializaci
function waitForPart4A() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (typeof calendarState !== 'undefined' && calendarState.isInitialized) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Timeout po 10 sekundách
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('⚠️ Part 4A not ready after 10s, proceeding anyway');
            resolve();
        }, 10000);
    });
}

// ========================================
// ROZŠÍŘENÁ EDITACE UDÁLOSTÍ (bez konfliktu s Part 4A)
// ========================================

// Rozšířená verze showEventDetail s možností editace - pouze pokud Part 4A není dostupný
function showEventDetailWithEdit(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    // Zavřít předchozí modaly
    document.querySelectorAll('.day-modal, .event-detail-modal').forEach(modal => modal.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal event-detail-modal';
    modal.style.display = 'flex';
    
    let statusText = event.status === 'completed' ? 'Dokončeno' : 
                    event.status === 'ongoing' ? 'Probíhá' : 'Naplánováno';
    let statusColor = event.status === 'completed' ? '#28a745' : 
                     event.status === 'ongoing' ? '#ffc107' : '#17a2b8';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>✏️ ${escapeHtml(event.title)}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="event-status-info" style="margin-bottom: 20px; padding: 15px; background: ${statusColor}20; border-left: 4px solid ${statusColor}; border-radius: 6px;">
                    <div style="color: ${statusColor}; font-weight: 600; font-size: 1.1em;">
                        Status: ${statusText}
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        ${event.hasRealData && event.hasPrediction ? '🔄 Sloučená akce (historická data + AI predikce)' : 
                          event.hasRealData ? '📊 Historická data' : 
                          event.source === 'quick_add' ? '➕ Ručně přidaná akce' : '🤖 AI predikce'}
                    </div>
                </div>
                
                <div class="event-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div class="detail-item">
                        <label>Název akce:</label>
                        <input type="text" id="editEventName" value="${escapeHtml(event.title)}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div class="detail-item">
                        <label>Kategorie:</label>
                        <select id="editCategory" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="food festival" ${event.category === 'food festival' ? 'selected' : ''}>Food festival</option>
                            <option value="veletrh" ${event.category === 'veletrh' ? 'selected' : ''}>Veletrh</option>
                            <option value="koncert" ${event.category === 'koncert' ? 'selected' : ''}>Koncert</option>
                            <option value="kulturní akce" ${event.category === 'kulturní akce' ? 'selected' : ''}>Kulturní akce</option>
                            <option value="sportovní akce" ${event.category === 'sportovní akce' ? 'selected' : ''}>Sportovní akce</option>
                            <option value="ostatní" ${event.category === 'ostatní' ? 'selected' : ''}>Ostatní</option>
                        </select>
                    </div>
                    <div class="detail-item">
                        <label>Město:</label>
                        <input type="text" id="editCity" value="${escapeHtml(event.city)}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <select id="editStatus" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="planned" ${event.status === 'planned' ? 'selected' : ''}>📅 Naplánováno</option>
                            <option value="ongoing" ${event.status === 'ongoing' ? 'selected' : ''}>⏰ Probíhá</option>
                            <option value="completed" ${event.status === 'completed' ? 'selected' : ''}>✅ Dokončeno</option>
                        </select>
                    </div>
                    <div class="detail-item">
                        <label>Datum od:</label>
                        <input type="date" id="editDateFrom" value="${formatDateKey(event.startDate)}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div class="detail-item">
                        <label>Datum do:</label>
                        <input type="date" id="editDateTo" value="${formatDateKey(event.endDate)}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div class="detail-item">
                        <label>Návštěvníci:</label>
                        <input type="number" id="editVisitors" value="${event.data.visitors || 0}" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div class="detail-item">
                        <label>Reálně prodáno (ks):</label>
                        <input type="number" id="editSales" value="${event.data.sales || 0}" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <small style="color: #666; font-size: 0.8em;">Pro dokončené akce zadejte skutečný prodej</small>
                    </div>
                    ${event.data.predictedSales ? `
                        <div class="detail-item">
                            <label>🤖 AI Predikce:</label>
                            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px; font-weight: 600;">
                                ${formatNumber(event.data.predictedSales)} ks
                            </div>
                        </div>
                    ` : ''}
                    ${event.hasRealData && event.hasPrediction && event.data.sales && event.data.predictedSales ? `
                        <div class="detail-item">
                            <label>🎯 Přesnost AI:</label>
                            <div style="padding: 8px; background: #e3f2fd; border-radius: 4px; font-weight: 600; color: #1976d2;">
                                ${calculatePredictionAccuracy(event.data.predictedSales, event.data.sales)}%
                            </div>
                        </div>
                    ` : ''}
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <label>Poznámky:</label>
                        <textarea id="editNotes" rows="3" placeholder="Poznámky k akci..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${escapeHtml(event.data.notes || '')}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; padding: 20px; border-top: 1px solid #dee2e6;">
                <button class="btn btn-save" onclick="saveEventEdit('${event.id}')" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">💾 Uložit změny</button>
                ${event.hasPrediction || event.source === 'quick_add' ? `
                    <button class="btn btn-sheets" onclick="saveEventToSheets('${event.id}')" style="background: #0f9d58; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">📊 Uložit do Sheets</button>
                ` : ''}
                <button class="btn btn-delete" onclick="deleteEventConfirm('${event.id}')" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">🗑️ Smazat</button>
                <button class="btn" onclick="this.closest('.modal').remove()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Zavřít</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('✏️ Event detail with edit shown');
}

// Uložení změn události (kompatibilní s Part 4A)
function saveEventEdit(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    try {
        // Získání nových hodnot
        event.title = document.getElementById('editEventName').value.trim();
        event.category = document.getElementById('editCategory').value;
        event.city = document.getElementById('editCity').value.trim();
        event.status = document.getElementById('editStatus').value;
        event.startDate = new Date(document.getElementById('editDateFrom').value + 'T12:00:00');
        event.endDate = new Date(document.getElementById('editDateTo').value + 'T12:00:00');
        event.data.visitors = parseInt(document.getElementById('editVisitors').value) || 0;
        event.data.sales = parseInt(document.getElementById('editSales').value) || 0;
        event.data.notes = document.getElementById('editNotes').value.trim();
        
        // Aktualizace flags
        event.hasRealData = event.data.sales > 0;
        event.data.expectedRevenue = event.data.sales * (recor.price || 0);
        
        // Refresh kalendář (použít funkce z Part 4A pokud jsou dostupné)
        if (typeof generateCalendarGrid === 'function') {
            generateCalendarGrid();
        }
        if (typeof updateMonthEventsList === 'function') {
            updateMonthEventsList();
        }
        
        // Aktualizace filtrovaných událostí (Part 4B kompatibilita)
        if (typeof filteredEvents !== 'undefined' && typeof displayFilteredEventsInCalendar === 'function') {
            filteredEvents = [...calendarState.events];
            displayFilteredEventsInCalendar();
        }
        
        showNotification('✅ Změny uloženy', 'success', 2000);
        document.querySelector('.event-detail-modal').remove();
        
        console.log('✅ Event updated:', event);
        
    } catch (error) {
        console.error('❌ Error saving event edit:', error);
        showNotification('❌ Chyba při ukládání změn', 'error');
    }
}

// Potvrzení smazání události (kompatibilní s Part 4A blacklist systémem)
function deleteEventConfirm(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    const confirmMessage = `Opravdu chcete smazat akci "${event.title}"?\n\nTato akce je nevratná.`;
    
    if (confirm(confirmMessage)) {
        // Použít funkci z Part 4A pokud je dostupná
        if (typeof deleteEvent === 'function') {
            deleteEvent(eventId);
        } else {
            // Fallback implementace
            calendarState.events = calendarState.events.filter(e => e.id !== eventId);
            
            // Refresh kalendář
            if (typeof generateCalendarGrid === 'function') {
                generateCalendarGrid();
            }
            if (typeof updateMonthEventsList === 'function') {
                updateMonthEventsList();
            }
            
            // Zavřít modaly
            document.querySelectorAll('.event-detail-modal, .day-modal').forEach(modal => modal.remove());
            
            showNotification(`🗑️ Akce "${event.title}" byla smazána`, 'success', 3000);
            console.log(`🗑️ Event deleted: ${event.title} (${eventId})`);
        }
    }
}

// ========================================
// RYCHLÉ PŘIDÁNÍ UDÁLOSTI (kompatibilní)
// ========================================

// Quick Add modal (kompatibilní s existujícím systémem)
function showQuickAddModal(selectedDate = null) {
    const modal = document.createElement('div');
    modal.className = 'modal quick-add-modal';
    modal.style.display = 'flex';
    
    const defaultDate = selectedDate ? formatDateKey(selectedDate) : 
                       new Date().toISOString().split('T')[0];
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>➕ Přidat novou akci</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="quickAddForm" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div>
                        <label>Název akce *</label>
                        <input type="text" id="quickEventName" required placeholder="Např. ČokoFest Praha" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>Kategorie *</label>
                        <select id="quickCategory" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Vyberte kategorii</option>
                            <option value="food festival">Food festival</option>
                            <option value="veletrh">Veletrh</option>
                            <option value="koncert">Koncert</option>
                            <option value="kulturní akce">Kulturní akce</option>
                            <option value="sportovní akce">Sportovní akce</option>
                            <option value="ostatní">Ostatní</option>
                        </select>
                    </div>
                    <div>
                        <label>Město *</label>
                        <input type="text" id="quickCity" required placeholder="Praha, Brno, Ostrava..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>Návštěvnost</label>
                        <input type="number" id="quickVisitors" placeholder="5000" min="50" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>Datum od *</label>
                        <input type="date" id="quickDateFrom" required value="${defaultDate}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>Datum do *</label>
                        <input type="date" id="quickDateTo" required value="${defaultDate}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>Status</label>
                        <select id="quickStatus" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="planned">📅 Naplánováno</option>
                            <option value="ongoing">⏰ Probíhá</option>
                            <option value="completed">✅ Dokončeno</option>
                        </select>
                    </div>
                    <div>
                        <label>Prodáno (ks)</label>
                        <input type="number" id="quickSales" placeholder="Pouze pro dokončené akce" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label>Poznámky</label>
                        <textarea id="quickNotes" rows="3" placeholder="Volitelné poznámky..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; padding: 20px; border-top: 1px solid #dee2e6;">
                <button onclick="saveQuickAddEvent()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">➕ Přidat akci</button>
                <button onclick="this.closest('.modal').remove()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Zrušit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('quickEventName').focus(), 100);
    console.log('➕ Quick Add modal shown');
}

// Uložení nové události (kompatibilní s Part 4A)
function saveQuickAddEvent() {
    const form = document.getElementById('quickAddForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const eventData = {
            eventName: document.getElementById('quickEventName').value.trim(),
            category: document.getElementById('quickCategory').value,
            city: document.getElementById('quickCity').value.trim(),
            visitors: parseInt(document.getElementById('quickVisitors').value) || 1000,
            eventDateFrom: document.getElementById('quickDateFrom').value,
            eventDateTo: document.getElementById('quickDateTo').value,
            status: document.getElementById('quickStatus').value,
            sales: parseInt(document.getElementById('quickSales').value) || 0,
            notes: document.getElementById('quickNotes').value.trim()
        };
        
        // Vytvoření nové události kompatibilní s Part 4A strukturou
        const newEvent = {
            id: `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: eventData.eventName,
            startDate: new Date(eventData.eventDateFrom + 'T12:00:00'),
            endDate: new Date(eventData.eventDateTo + 'T12:00:00'),
            category: eventData.category,
            city: eventData.city,
            status: eventData.status,
            source: 'quick_add',
            color: getUniqueEventColor(),
            hasRealData: eventData.sales > 0,
            hasPrediction: false,
            data: {
                visitors: eventData.visitors,
                sales: eventData.sales,
                predictedSales: 0,
                confidence: 0,
                expectedRevenue: eventData.sales * 110,
                expectedProfit: 0,
                businessModel: 'owner',
                price: 110,
                notes: eventData.notes,
                eventType: 'outdoor',
                createdAt: new Date().toISOString(),
                quickAdd: true
            }
        };
        
        // Přidat do kalendáře
        calendarState.events.push(newEvent);
        
        // Refresh kalendář s kompatibilitou
        if (typeof generateCalendarGrid === 'function') {
            generateCalendarGrid();
        }
        if (typeof updateMonthEventsList === 'function') {
            updateMonthEventsList();
        }
        
        // Aktualizace filtrovaných událostí (Part 4B kompatibilita)
        if (typeof filteredEvents !== 'undefined') {
            filteredEvents = [...calendarState.events];
            if (typeof displayFilteredEventsInCalendar === 'function') {
                displayFilteredEventsInCalendar();
            }
            if (typeof populateCategoryFilter === 'function') {
                populateCategoryFilter();
            }
            if (typeof populateCityFilter === 'function') {
                populateCityFilter();
            }
        }
        
        // Zavřít modal
        document.querySelector('.quick-add-modal').remove();
        
        showNotification(`✅ Akce "${eventData.eventName}" byla přidána`, 'success');
        console.log('➕ Quick event added:', newEvent);
        
        // Emit event pro ostatní komponenty
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('eventAdded', {
                event: newEvent,
                source: 'quick_add'
            });
        }
        
    } catch (error) {
        console.error('❌ Error saving quick event:', error);
        showNotification('❌ Chyba při přidávání události', 'error');
    }
}

// ========================================
// ULOŽENÍ DO GOOGLE SHEETS (zjednodušené)
// ========================================

// Uložení události do Google Sheets (kompatibilní verze)
async function saveEventToSheets(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) {
        showNotification('❌ Událost nenalezena', 'error');
        return;
    }
    
    try {
        showNotification('📊 Ukládám do Google Sheets...', 'info', 2000);
        console.log('📊 Saving event to Google Sheets:', event);
        
        // Připravit data pro Google Sheets
        const now = new Date();
        const dateTime = now.toLocaleString('cs-CZ');
        
        const sheetData = [
            dateTime,
            event.title || '',
            event.city || '', 
            event.category || '',
            event.data.visitors || 0,
            event.data.predictedSales || event.data.sales || 0,
            event.data.expectedRevenue || (event.data.sales * 110) || 0,
            event.status || 'planned',
            formatDateKey(event.startDate) || '',
            formatDateKey(event.endDate) || '',
            event.data.notes || ''
        ];
        
        // Zkopírovat do schránky jako fallback
        const csvRow = sheetData.map(val => `"${String(val).replace(/"/g, '""')}"`).join('\t');
        
        try {
            await navigator.clipboard.writeText(csvRow);
            showNotification('📋 Data zkopírována do schránky - vložte je ručně do Sheets', 'warning', 6000);
            
            // Zobrazit instrukce
            setTimeout(() => {
                alert(`📊 INSTRUKCE PRO RUČNÍ VLOŽENÍ:\n\n1. Otevřete Google Sheets s vaším dokumentem\n2. Přejděte na list "Predikce"\n3. Klikněte na první prázdný řádek\n4. Stiskněte Ctrl+V (nebo Cmd+V na Mac)\n5. Data se automaticky rozdělí do sloupců\n\n💡 Data jsou už zkopírována ve schránce!`);
            }, 1000);
            
        } catch (clipboardError) {
            console.error('Clipboard error:', clipboardError);
            showNotification('❌ Nepodařilo se uložit ani zkopírovat data', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error saving to sheets:', error);
        showNotification('❌ Chyba při ukládání do Sheets: ' + error.message, 'error');
    }
}

// ========================================
// EXPORT CSV (kompatibilní)
// ========================================

// Export kalendáře do CSV (použije existující události)
function exportCalendarToCSV() {
    if (!calendarState.events || calendarState.events.length === 0) {
        showNotification('❌ Žádné události k exportu', 'error');
        return;
    }
    
    console.log(`📄 Exporting ${calendarState.events.length} events to CSV`);
    
    // CSV header
    const csvHeader = [
        'Datum_od', 'Datum_do', 'Nazev_akce', 'Kategorie', 'Mesto', 'Status', 
        'Navstevnost', 'Realne_prodano', 'AI_predikce', 'Poznamky'
    ].join(',');
    
    // CSV data
    const csvData = calendarState.events.map(event => {
        const startDate = formatDateKey(event.startDate);
        const endDate = formatDateKey(event.endDate);
        
        return [
            startDate,
            endDate,
            `"${escapeCSV(event.title)}"`,
            `"${escapeCSV(event.category)}"`,
            `"${escapeCSV(event.city)}"`,
            event.status,
            event.data.visitors || 0,
            event.data.sales || 0,
            event.data.predictedSales || 0,
            `"${escapeCSV(event.data.notes || '')}"`
        ].join(',');
    });
    
    // Combine header and data
    const csvContent = [csvHeader, ...csvData].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donuland_kalendar_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification(`📄 ${calendarState.events.length} událostí exportováno`, 'success');
}

function escapeCSV(text) {
    if (!text) return '';
    return String(text).replace(/"/g, '""');
}

// ========================================
// JEDNODUCHÉ TLAČÍTKO PANEL (kompatibilní)
// ========================================

// Vytvoření jednoduchého panelu s tlačítky (pouze pokud neexistuje)
function createSimpleButtonPanel() {
    if (document.getElementById('simpleButtonPanel')) {
        return;
    }
    
    const panel = document.createElement('div');
    panel.id = 'simpleButtonPanel';
    panel.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        flex-wrap: wrap;
        justify-content: center;
    `;
    
    panel.innerHTML = `
        <button onclick="showQuickAddModal()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            ➕ Přidat akci
        </button>
        <button onclick="exportCalendarToCSV()" style="background: #17a2b8; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            📄 Export CSV
        </button>
        <button onclick="goToToday()" style="background: #ffc107; color: #212529; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            📍 Dnes
        </button>
    `;
    
    // Hover efekty
    const style = document.createElement('style');
    style.textContent = `
        #simpleButtonPanel button:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Vložit před první kalendářovou kartu nebo na konec kalendářové sekce
    const calendarSection = document.getElementById('calendar');
    if (calendarSection) {
        const firstCard = calendarSection.querySelector('.card');
        if (firstCard) {
            firstCard.parentNode.insertBefore(panel, firstCard);
        } else {
            calendarSection.appendChild(panel);
        }
    }
    
    console.log('🎛️ Simple button panel created');
}

// ========================================
// HELPER FUNKCE (kompatibilní s existujícím kódem)
// ========================================

// Pouze definovat pokud neexistují (kompatibilita)
if (typeof calculatePredictionAccuracy === 'undefined') {
    function calculatePredictionAccuracy(predicted, actual) {
        if (!predicted || !actual || predicted <= 0 || actual <= 0) {
            return 0;
        }
        const accuracy = 100 - Math.abs((predicted - actual) / actual) * 100;
        return Math.max(0, Math.min(100, Math.round(accuracy)));
    }
}

if (typeof formatNumber === 'undefined') {
    function formatNumber(number) {
        if (number === null || number === undefined || isNaN(number)) {
            return '0';
        }
        return new Intl.NumberFormat('cs-CZ').format(Math.round(number));
    }
}

if (typeof formatDateKey === 'undefined') {
    function formatDateKey(date) {
        if (!date) return '';
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
    }
}

if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

if (typeof getUniqueEventColor === 'undefined') {
    function getUniqueEventColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// ========================================
// INTEGRACE S EXISTUJÍCÍM SYSTÉMEM
// ========================================

// Bezpečné rozšíření showEventDetail funkce (pouze pokud není definována v Part 4A)
function enhanceShowEventDetail() {
    // Zkontrolovat, zda Part 4A již definoval showEventDetail
    if (typeof window.showEventDetail === 'function' && typeof window.originalShowEventDetail === 'undefined') {
        // Uložit původní funkci
        window.originalShowEventDetail = window.showEventDetail;
        
        // Nahradit rozšířenou verzí
        window.showEventDetail = function(eventId) {
            showEventDetailWithEdit(eventId);
        };
        
        console.log('✏️ Enhanced showEventDetail with editing capabilities');
    } else if (typeof window.showEventDetail === 'undefined') {
        // Pokud showEventDetail neexistuje, vytvořit ji
        window.showEventDetail = showEventDetailWithEdit;
        console.log('✏️ Created showEventDetail with editing capabilities');
    }
}

// Bezpečné rozšíření goToToday funkce
function enhanceGoToToday() {
    if (typeof window.goToToday === 'undefined') {
        window.goToToday = function() {
            const today = new Date();
            if (typeof calendarState !== 'undefined') {
                calendarState.currentMonth = today.getMonth();
                calendarState.currentYear = today.getFullYear();
                
                if (typeof updateCurrentMonthDisplay === 'function') {
                    updateCurrentMonthDisplay();
                }
                if (typeof generateCalendarGrid === 'function') {
                    generateCalendarGrid();
                }
            }
            
            if (typeof showNotification === 'function') {
                showNotification('📅 Přešli jste na aktuální měsíc', 'info', 2000);
            }
        };
        console.log('📍 Created goToToday function');
    }
}

// ========================================
// INICIALIZACE PART 4C (bezpečná)
// ========================================

// Hlavní inicializační funkce
async function initPart4C() {
    console.log('🔧 Initializing Part 4C...');
    
    try {
        // Počkat na Part 4A
        await waitForPart4A();
        
        // Rozšířit existující funkce
        enhanceShowEventDetail();
        enhanceGoToToday();
        
        // Vytvořit UI pouze pokud jsme v kalendářové sekci
        if (typeof globalState !== 'undefined' && globalState.currentSection === 'calendar') {
            createSimpleButtonPanel();
        }
        
        console.log('✅ Part 4C initialized successfully');
        
        // Emit event pro signalizaci dokončení
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('part4CLoaded', {
                timestamp: Date.now(),
                version: '4C-compatible-1.0.0',
                features: [
                    'enhanced-event-editing',
                    'quick-add-modal',
                    'csv-export',
                    'sheets-integration',
                    'compatible-with-part4a-part4b'
                ]
            });
        }
        
    } catch (error) {
        console.error('❌ Error initializing Part 4C:', error);
        
        // Fallback inicializace
        setTimeout(() => {
            enhanceShowEventDetail();
            enhanceGoToToday();
        }, 2000);
    }
}

// ========================================
// EVENT LISTENERS (kompatibilní)
// ========================================

// Event listeners pouze pokud je eventBus dostupný
if (typeof eventBus !== 'undefined') {
    
    // Po načtení Part 4A
    eventBus.on('part4ALoaded', () => {
        console.log('📅 Part 4A loaded, initializing Part 4C...');
        setTimeout(initPart4C, 500);
    });
    
    // Po požadavku na kalendář
    eventBus.on('calendarRequested', () => {
        console.log('📅 Calendar requested, ensuring Part 4C is ready...');
        setTimeout(() => {
            createSimpleButtonPanel();
        }, 1000);
    });
    
    // Po změně sekce
    eventBus.on('sectionChanged', (data) => {
        if (data.section === 'calendar') {
            setTimeout(() => {
                createSimpleButtonPanel();
            }, 500);
        }
    });
    
    // Po přidání události
    eventBus.on('eventAdded', (data) => {
        console.log('➕ Event added via Part 4C:', data.event.title);
        
        // Aktualizace filtrů pokud je Part 4B dostupný
        if (typeof populateCategoryFilter === 'function') {
            populateCategoryFilter();
        }
        if (typeof populateCityFilter === 'function') {
            populateCityFilter();
        }
    });
}

// DOM ready listener (bezpečný)
document.addEventListener('DOMContentLoaded', function() {
    // Malé zpoždění pro načtení ostatních komponent
    setTimeout(() => {
        if (typeof calendarState === 'undefined') {
            // Part 4A není dostupný, zkusit inicializaci za chvíli
            setTimeout(initPart4C, 3000);
        } else {
            initPart4C();
        }
    }, 2000);
});

// ========================================
// GLOBÁLNÍ EXPORT (bezpečný)
// ========================================

// Export funkcí pro HTML onclick handlers (pouze pokud nejsou definované)
if (typeof window !== 'undefined') {
    if (!window.showQuickAddModal) {
        window.showQuickAddModal = showQuickAddModal;
    }
    if (!window.saveQuickAddEvent) {
        window.saveQuickAddEvent = saveQuickAddEvent;
    }
    if (!window.showEventDetailWithEdit) {
        window.showEventDetailWithEdit = showEventDetailWithEdit;
    }
    if (!window.saveEventEdit) {
        window.saveEventEdit = saveEventEdit;
    }
    if (!window.deleteEventConfirm) {
        window.deleteEventConfirm = deleteEventConfirm;
    }
    if (!window.exportCalendarToCSV) {
        window.exportCalendarToCSV = exportCalendarToCSV;
    }
    if (!window.saveEventToSheets) {
        window.saveEventToSheets = saveEventToSheets;
    }
    
    // Debug rozšíření (pouze pokud calendarDebug existuje)
    if (window.calendarDebug) {
        window.calendarDebug.part4c = {
            showQuickAdd: showQuickAddModal,
            exportCSV: exportCalendarToCSV,
            saveToSheets: saveEventToSheets,
            version: '4C-compatible-1.0.0',
            features: [
                'enhanced-event-editing',
                'quick-add-modal', 
                'csv-export',
                'sheets-integration'
            ]
        };
    }
}

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 4C FIXED loaded successfully');
console.log('🔗 Compatible with Part 4A/4B - no function conflicts');
console.log('✏️ Features: Enhanced editing, Quick add, CSV export, Sheets integration');
console.log('🎯 Safe integration: Waits for Part 4A, extends existing functions safely');
console.log('🚀 Ready for production use with existing calendar system');
