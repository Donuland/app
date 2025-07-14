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
                    price: record.price || 110
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
