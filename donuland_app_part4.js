/* ========================================
   DONULAND PART 4A - Základní kalendář CLEAN
   Opravená verze bez duplikací
   ======================================== */

console.log('🍩 Donuland Part 4A CLEAN loading...');

// ========================================
// GLOBÁLNÍ STAV A KONTROLA INICIALIZACE
// ========================================

// Kontrolní flagy pro prevenci duplikací - OPRAVENO
if (typeof window.calendarInitialized === 'undefined') {
    window.calendarInitialized = false;
}

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
// BLACKLIST SMAZANÝCH UDÁLOSTÍ
// ========================================

// Správa blacklistu smazaných událostí
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
    },
    
    // Vyčištění starých záznamů (volitelné)
    cleanupOldEntries() {
        // Můžeme později implementovat čištění starších než X dnů
    }
};

// ========================================
// NAČÍTÁNÍ UDÁLOSTÍ S PODPOROU SLUČOVÁNÍ A BLACKLISTU
// ========================================

// Hlavní funkce pro načtení všech událostí s inteligentním slučováním a blacklist kontrolou
function loadCalendarEvents() {
    console.log('📅 Loading calendar events with smart merging and blacklist...');
    
    calendarState.events = [];
    eventColorIndex = 0;
    
    // Získání blacklistu smazaných událostí
    const deletedEvents = deletedEventsManager.getDeletedEvents();
    console.log(`🗑️ Blacklist contains ${deletedEvents.length} deleted events`);
    
    // 1. Historická data ze Sheets (základní události) - kontrola blacklistu
    if (typeof globalState !== 'undefined' && globalState.historicalData) {
        globalState.historicalData.forEach((record, index) => {
            const eventId = 'historical_' + index;
            
            // KONTROLA BLACKLISTU - přeskočit smazané události
            if (deletedEventsManager.isDeleted(eventId)) {
                console.log(`⏭️ Skipping deleted historical event: ${eventId}`);
                return;
            }
            
            const startDate = parseDate(record.dateFrom);
            const endDate = parseDate(record.dateTo || record.dateFrom);
            
            if (startDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                calendarState.events.push({
                    id: eventId,
                    title: record.eventName || 'Neznámá akce',
                    startDate: startDate,
                    endDate: endDate,
                    category: record.category || 'ostatní',
                    city: record.city || '',
                    status: endDate < today ? 'completed' : 'planned',
                    source: 'historical',
                    color: getUniqueEventColor(),
                    hasRealData: true,
                    hasPrediction: false,
                    data: {
                        visitors: record.visitors || 0,
                        sales: record.sales || 0,
                        competition: record.competition || 2,
                        rating: record.rating || 0,
                        notes: record.notes || '',
                        businessModel: record.businessModel || '',
                        price: record.price || 110
                    },
                    prediction: null // Bude naplněno při slučování
                });
            }
        });
    }
    
    // 2. Slučování uložených predikcí s existujícími akcemi - kontrola blacklistu
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach((prediction, index) => {
            const predictionId = 'prediction_' + index;
            
            // KONTROLA BLACKLISTU - přeskočit smazané predikce
            if (deletedEventsManager.isDeleted(predictionId)) {
                console.log(`⏭️ Skipping deleted prediction: ${predictionId}`);
                return;
            }
            
            if (prediction.formData) {
                mergePredictionWithEvents(prediction, predictionId);
            }
        });
    } catch (error) {
        console.warn('⚠️ Error loading predictions:', error);
    }
    
    // 3. Slučování aktuální predikce - kontrola blacklistu
    if (typeof globalState !== 'undefined' && globalState.lastPrediction && 
        !globalState.lastPrediction.saved && globalState.lastPrediction.formData) {
        
        const currentPredictionId = 'current_prediction';
        
        // KONTROLA BLACKLISTU - přeskočit smazanou aktuální predikci
        if (!deletedEventsManager.isDeleted(currentPredictionId)) {
            mergePredictionWithEvents(globalState.lastPrediction, currentPredictionId);
        } else {
            console.log(`⏭️ Skipping deleted current prediction: ${currentPredictionId}`);
        }
    }
    
    console.log(`✅ Loaded ${calendarState.events.length} calendar events (with smart merging and blacklist filtering)`);
    console.log(`🗑️ Filtered out ${deletedEvents.length} deleted events`);
}

// Funkce pro slučování predikce s existující akcí nebo vytvoření nové
function mergePredictionWithEvents(prediction, predictionId) {
    const formData = prediction.formData;
    const startDate = parseDate(formData.eventDateFrom);
    const endDate = parseDate(formData.eventDateTo);
    
    if (!startDate) return;
    
    // Hledání existující akce se stejným názvem a překrývajícím se datem
    const existingEvent = calendarState.events.find(event => {
        const nameMatch = normalizeEventName(event.title) === normalizeEventName(formData.eventName);
        const dateOverlap = datesOverlap(event.startDate, event.endDate, startDate, endDate);
        return nameMatch && dateOverlap;
    });
    
    if (existingEvent) {
        // SLOUČIT s existující akcí
        console.log(`🔄 Merging prediction with existing event: ${existingEvent.title}`);
        
        existingEvent.hasPrediction = true;
        existingEvent.source = 'merged'; // Označit jako sloučenou
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
        
        // Aktualizovat některé údaje z predikce pokud nejsou v historických datech
        if (!existingEvent.data.visitors && formData.visitors) {
            existingEvent.data.visitors = formData.visitors;
        }
        if (!existingEvent.data.businessModel && formData.businessModel) {
            existingEvent.data.businessModel = formData.businessModel;
        }
        
    } else {
        // VYTVOŘIT novou akci (pouze predikce)
        console.log(`➕ Creating new prediction event: ${formData.eventName}`);
        
        calendarState.events.push({
            id: predictionId,
            title: formData.eventName || 'Predikce',
            startDate: startDate,
            endDate: endDate,
            category: formData.category || 'ostatní',
            city: formData.city || '',
            status: 'planned',
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
        });
    }
}

// Pomocné funkce pro slučování
function normalizeEventName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/[^\w\s]/g, '') // Odstranit speciální znaky
        .replace(/\s+/g, ' ')    // Normalizovat mezery
        .trim();
}

function datesOverlap(start1, end1, start2, end2) {
    return start1 <= end2 && start2 <= end1;
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
                ${event.prediction?.predictedSales ? `<span>🤖 ${formatNumber(event.prediction.predictedSales)} ks AI predikce</span>` : ''}
            </div>
            <div class="event-actions">
                <button class="btn btn-detail" onclick="showEventDetail('${event.id}')">📋 Detail</button>
                ${event.hasPrediction ? `<button class="btn btn-export" onclick="exportEventToSheets('${event.id}')">📤 Do Sheets</button>` : ''}
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

// Detail konkrétní akce s možností editace
function showEventDetail(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    // Zavřít předchozí modal
    document.querySelectorAll('.day-modal').forEach(modal => modal.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal event-detail-modal';
    modal.style.display = 'flex';
    
    const isCompleted = event.status === 'completed';
    const hasPrediction = event.hasPrediction;
    const hasRealData = event.hasRealData;
    
    // Určení zdrojů dat
    let sourceInfo = '';
    if (hasRealData && hasPrediction) {
        sourceInfo = '📊 Historická data + 🤖 AI predikce';
    } else if (hasRealData) {
        sourceInfo = '📊 Historická data ze Sheets';
    } else if (hasPrediction) {
        sourceInfo = '🤖 AI predikce';
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 ${escapeHtml(event.title)}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="event-source-info">
                    <p><strong>Zdroj dat:</strong> ${sourceInfo}</p>
                    ${hasPrediction ? `<p><small>AI predikce vytvořena: ${new Date(event.prediction.createdAt).toLocaleString('cs-CZ')}</small></p>` : ''}
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
                    <div class="detail-item">
                        <label>Návštěvníci:</label>
                        <span>${formatNumber(event.data.visitors)}</span>
                    </div>
                    
                    ${hasRealData && event.data.sales ? `
                        <div class="detail-item historical-data">
                            <label>📊 Reálně prodáno:</label>
                            <span><strong>${formatNumber(event.data.sales)} ks</strong></span>
                        </div>
                        <div class="detail-item historical-data">
                            <label>📊 Reálná konverze:</label>
                            <span><strong>${event.data.visitors > 0 ? ((event.data.sales / event.data.visitors) * 100).toFixed(1) : '0'}%</strong></span>
                        </div>
                    ` : ''}
                    
                    ${hasPrediction ? `
                        <div class="detail-item prediction-data">
                            <label>🤖 AI predikce prodeje:</label>
                            <span><strong>${formatNumber(event.prediction.predictedSales)} ks</strong></span>
                        </div>
                        <div class="detail-item prediction-data">
                            <label>🤖 Confidence predikce:</label>
                            <span><strong>${event.prediction.confidence}%</strong></span>
                        </div>
                        <div class="detail-item prediction-data">
                            <label>🤖 Očekávaný obrat:</label>
                            <span><strong>${formatCurrency(event.prediction.expectedRevenue)}</strong></span>
                        </div>
                        <div class="detail-item prediction-data">
                            <label>🤖 Očekávaný zisk:</label>
                            <span><strong>${formatCurrency(event.prediction.expectedProfit)}</strong></span></span>
                        </div>
                    ` : ''}
                    
                    ${hasRealData && hasPrediction && event.data.sales > 0 ? `
                        <div class="detail-item comparison-data">
                            <label>📈 Přesnost predikce:</label>
                            <span><strong>${calculatePredictionAccuracy(event.prediction.predictedSales, event.data.sales)}%</strong></span>
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
                ${hasPrediction ? `<button class="btn btn-export" onclick="exportEventToSheets('${event.id}')">📤 Export do Sheets</button>` : ''}
                <button class="btn btn-delete" onclick="deleteEvent('${event.id}')">🗑️ Smazat akci</button>
                <button class="btn" onclick="this.closest('.modal').remove()">Zavřít</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Výpočet přesnosti predikce
function calculatePredictionAccuracy(predicted, actual) {
    if (!predicted || !actual) return 0;
    const accuracy = 100 - Math.abs((predicted - actual) / actual) * 100;
    return Math.max(0, Math.round(accuracy));
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

// Aktualizace predikce v localStorage
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

// Smazání akce s blacklist podporou
function deleteEvent(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) return;
    
    const confirmMessage = `Opravdu chcete smazat akci "${event.title}"?` +
        (event.hasPrediction ? '\n\nTím se smaže i související AI predikce.' : '') +
        (event.hasRealData ? '\n\nHistorická data ze Sheets zůstanou zachována, ale akce se již nebude zobrazovat v kalendáři.' : '') +
        '\n\nPozor: Smazaná akce se již neobnoví ani po refresh stránky.';
    
    if (!confirm(confirmMessage)) return;
    
    // 🗑️ PŘIDAT DO BLACKLISTU - toto je klíčová změna
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

// Smazání predikce z localStorage
function deletePredictionFromStorage(predictionId) {
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        const predictionIndex = parseInt(predictionId.replace('prediction_', ''));
        
        if (savedPredictions[predictionIndex]) {
            savedPredictions.splice(predictionIndex, 1);
            localStorage.setItem('donuland_predictions', JSON.stringify(savedPredictions));
        }
    } catch (error) {
        console.error('Error deleting prediction from storage:', error);
    }
}

// Export akce do Google Sheets (placeholder funkce)
function exportEventToSheets(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event || !event.hasPrediction) return;
    
    // TODO: Implementovat skutečný export do Google Sheets
    console.log('📤 Exporting to Sheets:', event);
    
    if (typeof showNotification === 'function') {
        showNotification('📤 Export do Sheets - funkce bude implementována později', 'info', 4000);
    }
    
    // Placeholder pro budoucí implementaci
    // exportPredictionToGoogleSheets(event.prediction, event);
}

// ========================================
// HLAVNÍ INICIALIZACE
// ========================================

// Hlavní inicializační funkce - OPRAVENO
function initializeCalendar() {
    if (window.calendarInitialized) {
        console.log('⚠️ Calendar already initialized, skipping...');
        return;
    }
    
    console.log('🔧 Initializing calendar...');
    
    loadCalendarEvents();
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    
    window.calendarInitialized = true;
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
            if (window.calendarInitialized) {
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
            if (window.calendarInitialized) {
                generateCalendarGrid();
            }
        }, 500);
    });
    
    eventBus.on('calendarRequested', () => {
        console.log('📅 Calendar section requested');
        if (!window.calendarInitialized) {
            initializeCalendar();
        }
    });
}

// DOM ready listener
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (document.getElementById('calendar') && !window.calendarInitialized) {
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
    window.saveEventChanges = saveEventChanges;
    window.deleteEvent = deleteEvent;
    window.exportEventToSheets = exportEventToSheets;
    
    // Debug - rozšířený
    window.calendarDebug = {
        state: calendarState,
        initialized: () => window.calendarInitialized,
        reinit: () => {
            window.calendarInitialized = false;
            initializeCalendar();
        },
        findDuplicates: () => {
            // Debug funkce pro nalezení duplicit
            const duplicates = [];
            calendarState.events.forEach((event, index) => {
                const duplicateEvents = calendarState.events.filter((e, i) => 
                    i !== index && 
                    normalizeEventName(e.title) === normalizeEventName(event.title) &&
                    datesOverlap(e.startDate, e.endDate, event.startDate, event.endDate)
                );
                if (duplicateEvents.length > 0) {
                    duplicates.push({ original: event, duplicates: duplicateEvents });
                }
            });
            return duplicates;
        },
        // Nové debug funkce pro blacklist
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

console.log('✅ Donuland Part 4A CLEAN loaded successfully');
console.log('📅 Basic calendar features: Events display, Navigation, Modal details');
console.log('🔄 Smart merging: Automatic merging of predictions with historical events');
console.log('🗑️ Persistent deletion: Deleted events stay deleted after page refresh');
console.log('🔧 Debug: window.calendarDebug available with blacklist management');
/* ========================================
   DONULAND PART 4B - Filtry a měsíční přehled
   Pokračování Part 4A - bez duplikací
   ======================================== */

console.log('🍩 Donuland Part 4B loading...');

// ========================================
// STAV FILTRŮ A VYHLEDÁVÁNÍ
// ========================================

// Stav filtrů - rozšířený pro slučované akce
const calendarFilters = {
    category: '',
    status: '',
    source: '',
    searchText: '',
    hasRealData: '', // nový filtr
    hasPrediction: '' // nový filtr
};

// Filtrované události
let filteredEvents = [];

// ========================================
// INICIALIZACE FILTRŮ
// ========================================

// Inicializace dropdown filtrů s podporou slučovaných akcí
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
    
    // Source filter - rozšířený pro slučované akce
    const sourceFilter = document.getElementById('sourceFilter');
    if (sourceFilter) {
        sourceFilter.innerHTML = `
            <option value="">🔗 Všechny zdroje</option>
            <option value="historical">📊 Pouze historická data</option>
            <option value="prediction">🤖 Pouze AI predikce</option>
            <option value="merged">🔄 Sloučené (data + predikce)</option>
        `;
    }
    
    // Nový filtr - typ dat
    const dataTypeFilter = document.getElementById('dataTypeFilter');
    if (dataTypeFilter) {
        dataTypeFilter.innerHTML = `
            <option value="">💾 Všechny typy dat</option>
            <option value="hasRealData">📊 S reálnými daty</option>
            <option value="hasPrediction">🤖 S AI predikcí</option>
            <option value="both">🔄 S oběma typy</option>
        `;
    }
    
    console.log('✅ Calendar filters initialized');
}

// ========================================
// FILTROVACÍ LOGIKA
// ========================================

// Hlavní filtrovací funkce - rozšířená
function filterCalendar() {
    console.log('🔍 Filtering calendar events...');
    
    // Načtení hodnot z filtrů
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    const dataTypeFilter = document.getElementById('dataTypeFilter');
    
    if (categoryFilter) calendarFilters.category = categoryFilter.value;
    if (statusFilter) calendarFilters.status = statusFilter.value;
    if (sourceFilter) calendarFilters.source = sourceFilter.value;
    if (dataTypeFilter) calendarFilters.hasRealData = dataTypeFilter.value;
    
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
        
        // Source filter - rozšířený pro slučované akce
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
        
        // Data type filter
        if (calendarFilters.hasRealData) {
            switch (calendarFilters.hasRealData) {
                case 'hasRealData':
                    if (!event.hasRealData) return false;
                    break;
                case 'hasPrediction':
                    if (!event.hasPrediction) return false;
                    break;
                case 'both':
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
                event.data.notes || '',
                event.prediction?.formData?.businessModel || ''
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

// Zobrazení filtrovaných událostí v kalendáři - upraveno pro slučované akce
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
    
    // Zobrazení v kalendáři s rozšířenými indikátory
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
            
            // Rozšířené označení podle typu dat
            let prefix = '';
            if (event.hasRealData && event.hasPrediction) {
                prefix = '🔄 '; // Sloučené
            } else if (event.hasRealData) {
                prefix = '📊 '; // Pouze historická data
            } else if (event.hasPrediction) {
                prefix = '🤖 '; // Pouze predikce
            }
            
            // Ikona pro dokončené akce
            if (event.status === 'completed') {
                prefix = '✅ ' + prefix;
            }
            
            eventElement.textContent = prefix + event.title;
            eventElement.title = `${event.title} - ${event.city}` +
                (event.hasRealData && event.hasPrediction ? ' (Historická data + AI predikce)' : 
                 event.hasRealData ? ' (Historická data)' : 
                 event.hasPrediction ? ' (AI predikce)' : '');
            
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
    calendarFilters.hasRealData = '';
    calendarFilters.hasPrediction = '';
    
    // Reset UI elementů
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    const dataTypeFilter = document.getElementById('dataTypeFilter');
    const searchInput = document.getElementById('eventSearch');
    
    if (categoryFilter) categoryFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sourceFilter) sourceFilter.value = '';
    if (dataTypeFilter) dataTypeFilter.value = '';
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

// Vyhledávání v událostech - rozšířené
function searchEvents(query) {
    const trimmedQuery = query.trim();
    
    calendarFilters.searchText = trimmedQuery;
    
    // Aplikovat všechny filtry včetně vyhledávání
    filterCalendar();
    
    // Update search stats
    const searchStats = document.getElementById('searchStats');
    if (searchStats) {
        if (trimmedQuery) {
            const mergedCount = filteredEvents.filter(e => e.hasRealData && e.hasPrediction).length;
            const historicalOnlyCount = filteredEvents.filter(e => e.hasRealData && !e.hasPrediction).length;
            const predictionOnlyCount = filteredEvents.filter(e => !e.hasRealData && e.hasPrediction).length;
            
            let statsText = `🔍 Nalezeno ${filteredEvents.length} výsledků pro "${query}"`;
            if (mergedCount > 0 || historicalOnlyCount > 0 || predictionOnlyCount > 0) {
                statsText += ` (🔄${mergedCount} sloučených, 📊${historicalOnlyCount} historických, 🤖${predictionOnlyCount} predikcí)`;
            }
            
            searchStats.textContent = statsText;
            searchStats.style.display = 'block';
        } else {
            searchStats.style.display = 'none';
        }
    }
    
    console.log(`🔍 Search for "${query}": ${filteredEvents.length} results`);
}

// ========================================
// MĚSÍČNÍ PŘEHLED - ROZŠÍŘENÝ
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
    
    // Statistiky měsíce - rozšířené
    html += createEnhancedMonthStats(currentMonthEvents);
    
    monthEvents.innerHTML = html;
}

// Vytvoření položky události v měsíčním seznamu - rozšířené
function createMonthEventItem(event) {
    const startDate = event.startDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
    const endDate = event.endDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
    const dateText = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
    
    // Rozšířené ikony podle typu dat
    let statusIcon = event.status === 'completed' ? '✅' : '📅';
    let sourceIcon = '';
    if (event.hasRealData && event.hasPrediction) {
        sourceIcon = '🔄'; // Sloučené
    } else if (event.hasRealData) {
        sourceIcon = '📊'; // Historická data
    } else if (event.hasPrediction) {
        sourceIcon = '🤖'; // Predikce
    }
    
    // Statistiky - rozšířené pro slučované akce
    const visitors = event.data.visitors || 0;
    const realSales = event.data.sales || 0;
    const predictedSales = event.prediction?.predictedSales || event.data.predictedSales || 0;
    
    // Určení hlavního čísla prodeje pro zobrazení
    const displaySales = realSales > 0 ? realSales : predictedSales;
    const salesType = realSales > 0 ? 'prodáno' : 'predikce';
    
    const conversion = visitors > 0 && displaySales > 0 ? ((displaySales / visitors) * 100).toFixed(1) : '0';
    
    // Business data
    const revenue = event.prediction?.expectedRevenue || (displaySales * (event.data.price || 110));
    const profit = event.prediction?.expectedProfit || 0;
    
    // Accuracy indicator pokud máme oboje
    let accuracyHtml = '';
    if (event.hasRealData && event.hasPrediction && realSales > 0 && predictedSales > 0) {
        const accuracy = calculatePredictionAccuracy(predictedSales, realSales);
        const accuracyColor = accuracy >= 80 ? '#28a745' : accuracy >= 60 ? '#ffc107' : '#dc3545';
        accuracyHtml = `
            <div class="stat-group">
                <span class="stat-value" style="color: ${accuracyColor};">${accuracy}%</span>
                <span class="stat-label">přesnost</span>
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
                ${profit > 0 ? `
                <div class="stat-group">
                    <span class="stat-value">${formatCurrency(profit)}</span>
                    <span class="stat-label">zisk</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Rozšířené statistiky měsíce
function createEnhancedMonthStats(events) {
    const stats = {
        totalEvents: events.length,
        completedEvents: events.filter(e => e.status === 'completed').length,
        mergedEvents: events.filter(e => e.hasRealData && e.hasPrediction).length,
        historicalOnlyEvents: events.filter(e => e.hasRealData && !e.hasPrediction).length,
        predictionOnlyEvents: events.filter(e => !e.hasRealData && e.hasPrediction).length,
        totalVisitors: 0,
        totalRealSales: 0,
        totalPredictedSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
        accuracySum: 0,
        accuracyCount: 0
    };
    
    let validConversions = [];
    
    events.forEach(event => {
        const visitors = event.data.visitors || 0;
        const realSales = event.data.sales || 0;
        const predictedSales = event.prediction?.predictedSales || event.data.predictedSales || 0;
        const revenue = event.prediction?.expectedRevenue || (Math.max(realSales, predictedSales) * (event.data.price || 110));
        const profit = event.prediction?.expectedProfit || 0;
        
        stats.totalVisitors += visitors;
        stats.totalRealSales += realSales;
        stats.totalPredictedSales += predictedSales;
        stats.totalRevenue += revenue;
        stats.totalProfit += profit;
        
        // Přesnost predikce
        if (event.hasRealData && event.hasPrediction && realSales > 0 && predictedSales > 0) {
            const accuracy = calculatePredictionAccuracy(predictedSales, realSales);
            stats.accuracySum += accuracy;
            stats.accuracyCount++;
        }
        
        // Konverze
        const displaySales = realSales > 0 ? realSales : predictedSales;
        if (visitors > 0 && displaySales > 0) {
            validConversions.push((displaySales / visitors) * 100);
        }
    });
    
    const avgConversion = validConversions.length > 0 
        ? validConversions.reduce((sum, conv) => sum + conv, 0) / validConversions.length 
        : 0;
    
    const avgMargin = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue) * 100 : 0;
    const avgAccuracy = stats.accuracyCount > 0 ? stats.accuracySum / stats.accuracyCount : 0;
    
    return `
        <div class="month-stats enhanced">
            <h4>📊 Rozšířené statistiky měsíce</h4>
            
            <!-- Přehled typů akcí -->
            <div class="stats-breakdown">
                <h5>🔗 Typy akcí</h5>
                <div class="breakdown-grid">
                    <div class="breakdown-item">
                        <span>🔄 Sloučené akce (data + predikce)</span>
                        <span>${stats.mergedEvents}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>📊 Pouze historická data</span>
                        <span>${stats.historicalOnlyEvents}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>🤖 Pouze AI predikce</span>
                        <span>${stats.predictionOnlyEvents}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>✅ Dokončené akce</span>
                        <span>${stats.completedEvents} z ${stats.totalEvents}</span>
                    </div>
                </div>
            </div>
            
            <!-- Hlavní metriky -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${formatNumber(stats.totalVisitors)}</div>
                    <div class="stat-label">Celkem návštěvníků</div>
                    <div class="stat-sublabel">${stats.totalEvents > 0 ? Math.round(stats.totalVisitors / stats.totalEvents) : 0} průměr/akci</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatNumber(Math.max(stats.totalRealSales, stats.totalPredictedSales))}</div>
                    <div class="stat-label">Celkem prodej/predikce</div>
                    <div class="stat-sublabel">${avgConversion.toFixed(1)}% průměrná konverze</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatCurrency(stats.totalRevenue)}</div>
                    <div class="stat-label">Celkový obrat</div>
                    <div class="stat-sublabel">${avgMargin.toFixed(1)}% průměrná marže</div>
                </div>
                <div class="stat-card ${stats.totalProfit >= 0 ? 'positive' : 'negative'}">
                    <div class="stat-number">${formatCurrency(stats.totalProfit)}</div>
                    <div class="stat-label">Celkový zisk</div>
                    <div class="stat-sublabel">${stats.totalEvents > 0 ? formatCurrency(stats.totalProfit / stats.totalEvents) : '0 Kč'} průměr/akci</div>
                </div>
                ${avgAccuracy > 0 ? `
                <div class="stat-card accuracy">
                    <div class="stat-number">${avgAccuracy.toFixed(1)}%</div>
                    <div class="stat-label">Průměrná přesnost AI</div>
                    <div class="stat-sublabel">${stats.accuracyCount} porovnání</div>
                </div>
                ` : ''}
            </div>
            
            <!-- Srovnání reálných dat vs predikcí -->
            ${stats.totalRealSales > 0 && stats.totalPredictedSales > 0 ? `
            <div class="comparison-section">
                <h5>⚖️ Srovnání reálných dat vs AI predikcí</h5>
                <div class="comparison-grid">
                    <div class="comparison-item">
                        <span>📊 Celkem reálně prodáno</span>
                        <span>${formatNumber(stats.totalRealSales)} ks</span>
                    </div>
                    <div class="comparison-item">
                        <span>🤖 Celkem AI predikce</span>
                        <span>${formatNumber(stats.totalPredictedSales)} ks</span>
                    </div>
                    <div class="comparison-item ${stats.totalPredictedSales >= stats.totalRealSales ? 'positive' : 'negative'}">
                        <span>📈 Rozdíl predikce</span>
                        <span>${stats.totalPredictedSales >= stats.totalRealSales ? '+' : ''}${formatNumber(stats.totalPredictedSales - stats.totalRealSales)} ks</span>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Export událostí měsíce do CSV
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
    
    exportEventsToCSV(monthEvents, `donuland_kalendar_${monthName.replace(' ', '_')}.csv`);
    
    if (typeof showNotification === 'function') {
        showNotification(`📄 ${monthEvents.length} událostí exportováno pro ${monthName}`, 'success');
    }
}

// ========================================
// ROZŠÍŘENÍ PŮVODNÍCH FUNKCÍ
// ========================================

// Rozšíření originalLoadCalendarEvents z Part 4A
const originalLoadCalendarEventsB = typeof loadCalendarEvents !== 'undefined' ? loadCalendarEvents : function() {};

// Override loadCalendarEvents s inicializací filtrů
if (typeof window.loadCalendarEvents_Part4B_Loaded === 'undefined') {
    window.loadCalendarEvents_Part4B_Loaded = true;
    
    const originalLoadCalendarEvents_Part4A = loadCalendarEvents;
    loadCalendarEvents = function() {
        originalLoadCalendarEvents_Part4A();
        
        // Po načtení událostí inicializovat filtry
        setTimeout(() => {
            initializeCalendarFilters();
            // Nastavit všechny události jako filtrované na začátku
            filteredEvents = [...calendarState.events];
        }, 100);
    };
}

// ========================================
// GLOBÁLNÍ EXPORT
// ========================================

// Export nových funkcí pro HTML
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
// CSV EXPORT FUNKCE
// ========================================

// Export událostí do CSV - rozšířený pro slučované akce
function exportEventsToCSV(events = calendarState.events, filename = null) {
    if (!events || events.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('❌ Žádné události k exportu', 'error');
        }
        return;
    }
    
    console.log(`📄 Exporting ${events.length} events to CSV...`);
    
    // CSV hlavička - rozšířená
    const csvHeaders = [
        'Název akce',
        'Kategorie', 
        'Město',
        'Datum od',
        'Datum do',
        'Návštěvníci',
        'Reálný prodej',
        'AI predikce',
        'Reálná konverze %',
        'Predikovaná konverze %',
        'Přesnost AI %',
        'Typ dat',
        'Stav',
        'Očekávaný obrat',
        'Očekávaný zisk',
        'Business model',
        'Poznámky'
    ];
    
    // CSV řádky - rozšířené
    const csvRows = events.map(event => {
        const visitors = event.data.visitors || 0;
        const realSales = event.data.sales || 0;
        const predictedSales = event.prediction?.predictedSales || event.data.predictedSales || 0;
        
        const realConversion = visitors > 0 && realSales > 0 ? ((realSales / visitors) * 100).toFixed(2) : '';
        const predictedConversion = visitors > 0 && predictedSales > 0 ? ((predictedSales / visitors) * 100).toFixed(2) : '';
        
        const accuracy = event.hasRealData && event.hasPrediction && realSales > 0 && predictedSales > 0 
            ? calculatePredictionAccuracy(predictedSales, realSales) 
            : '';
        
        let dataType = '';
        if (event.hasRealData && event.hasPrediction) {
            dataType = 'Sloučené (data + predikce)';
        } else if (event.hasRealData) {
            dataType = 'Historická data';
        } else if (event.hasPrediction) {
            dataType = 'AI predikce';
        }
        
        return [
            escapeCSVValue(event.title),
            escapeCSVValue(event.category),
            escapeCSVValue(event.city),
            event.startDate.toLocaleDateString('cs-CZ'),
            event.endDate.toLocaleDateString('cs-CZ'),
            visitors,
            realSales || '',
            predictedSales || '',
            realConversion,
            predictedConversion,
            accuracy,
            dataType,
            event.status === 'completed' ? 'Dokončeno' : 'Naplánováno',
            event.prediction?.expectedRevenue || '',
            event.prediction?.expectedProfit || '',
            escapeCSVValue(event.prediction?.businessModel || event.data.businessModel || ''),
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
// EVENT LISTENERS PRO PART 4B
// ========================================

// Event listeners pro filtry a měsíční přehled
if (typeof eventBus !== 'undefined') {
    
    eventBus.on('dataLoaded', () => {
        setTimeout(() => {
            if (typeof globalState !== 'undefined' && globalState.currentSection === 'calendar') {
                loadCalendarEvents();
                filteredEvents = [...calendarState.events];
                displayFilteredEventsInCalendar();
                updateMonthEventsList();
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
    
    eventBus.on('calendarRequested', () => {
        setTimeout(() => {
            if (!window.calendarInitialized) {
                initializeCalendar();
            } else {
                loadCalendarEvents();
                initializeCalendarFilters();
                filteredEvents = [...calendarState.events];
                displayFilteredEventsInCalendar();
                updateMonthEventsList();
            }
        }, 500);
    });
    
    // Nový event pro aktualizaci po sloučení predikce
    eventBus.on('predictionMerged', (data) => {
        setTimeout(() => {
            loadCalendarEvents();
            filteredEvents = [...calendarState.events];
            displayFilteredEventsInCalendar();
            updateMonthEventsList();
            
            if (typeof showNotification === 'function') {
                showNotification(`🔄 Predikce byla sloučena s akcí "${data.eventName}"`, 'success', 4000);
            }
        }, 500);
    });
}

// ========================================
// ROZŠÍŘENÍ CHANGEMONTH A GOTOTODAY
// ========================================

// Rozšíření changeMonth z Part 4A pro aktualizaci filtrů
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

// Rozšíření goToToday z Part 4A pro aktualizaci filtrů
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

// ========================================
// ROZŠÍŘENÍ SHOWDAYMODAL PRO FILTRY
// ========================================

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
        
        // Vytvoření modalu s rozšířenými informacemi
        const modal = document.createElement('div');
        modal.className = 'modal day-modal';
        modal.style.display = 'flex';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Statistiky pro den
        const mergedCount = dayEvents.filter(e => e.hasRealData && e.hasPrediction).length;
        const historicalCount = dayEvents.filter(e => e.hasRealData && !e.hasPrediction).length;
        const predictionCount = dayEvents.filter(e => !e.hasRealData && e.hasPrediction).length;
        
        let dayStatsText = '';
        if (mergedCount > 0 || historicalCount > 0 || predictionCount > 0) {
            dayStatsText = `<small>(🔄${mergedCount} sloučených, 📊${historicalCount} historických, 🤖${predictionCount} predikcí)</small>`;
        }
        
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
                ${dayStatsText ? `<div class="day-stats">${dayStatsText}</div>` : ''}
                <div class="day-events-list"></div>
            </div>
        `;
        
        const eventsList = modalContent.querySelector('.day-events-list');
        
        dayEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'day-event-item';
            eventItem.style.borderLeft = `4px solid ${event.color}`;
            
            const statusIcon = event.status === 'completed' ? '✅' : '📅';
            let sourceIcon = '';
            let sourceText = '';
            
            if (event.hasRealData && event.hasPrediction) {
                sourceIcon = '🔄';
                sourceText = 'Sloučená akce (historická data + AI predikce)';
            } else if (event.hasRealData) {
                sourceIcon = '📊';
                sourceText = 'Historická data ze Sheets';
            } else if (event.hasPrediction) {
                sourceIcon = '🤖';
                sourceText = 'AI predikce';
            }
            
            eventItem.innerHTML = `
                <div class="event-header">
                    <h4>${escapeHtml(event.title)}</h4>
                    <div class="event-meta">
                        ${statusIcon} ${event.status === 'completed' ? 'Dokončeno' : 'Naplánováno'} • 
                        ${sourceIcon} ${sourceText} • 
                        📍 ${escapeHtml(event.city)} • 📋 ${escapeHtml(event.category)}
                    </div>
                </div>
                <div class="event-stats">
                    ${event.data.visitors ? `<span>👥 ${formatNumber(event.data.visitors)} návštěvníků</span>` : ''}
                    ${event.data.sales ? `<span>🍩 ${formatNumber(event.data.sales)} ks prodáno</span>` : ''}
                    ${event.prediction?.predictedSales ? `<span>🤖 ${formatNumber(event.prediction.predictedSales)} ks predikce</span>` : ''}
                    ${event.prediction?.expectedProfit ? `<span>💰 ${formatCurrency(event.prediction.expectedProfit)} zisk</span>` : ''}
                    ${event.hasPrediction ? `<span>📤 <button class="btn btn-small" onclick="exportEventToSheets('${event.id}')">Do Sheets</button></span>` : ''}
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
}

console.log('✅ Donuland Part 4B loaded successfully');
console.log('🔍 Filter features: Category, Status, Source (including merged), Data type, Text search');
console.log('📋 Enhanced monthly overview: Event list with merge indicators, Enhanced statistics, Accuracy tracking');
console.log('📄 CSV Export: Enhanced with prediction accuracy and merge status');
console.log('🔄 Smart integration: All Part 4A functions now work with enhanced filters and merged events');

// Event pro signalizaci dokončení části 4B
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4BLoaded', { 
        timestamp: Date.now(),
        version: '1.0.0',
        features: [
            'enhanced-filters-for-merged-events',
            'smart-search-with-prediction-data', 
            'enhanced-monthly-overview-with-accuracy',
            'csv-export-with-merge-status',
            'prediction-accuracy-tracking',
            'merged-events-indicators',
            'enhanced-statistics'
        ]
    });
}
/* ========================================
   DONULAND PART 4C - Pokročilé funkce kalendáře
   Pokračování Part 4A + 4B - bez duplikací
   ======================================== */

console.log('🍩 Donuland Part 4C loading...');

// ========================================
// BULK OPERATIONS (Hromadné operace)
// ========================================

// Stav bulk operací - rozšířený pro slučované akce
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
    
    // Výběr jen sloučených akcí
    selectMerged() {
        this.selectedEvents.clear();
        filteredEvents.forEach(event => {
            if (event.hasRealData && event.hasPrediction) {
                this.selectedEvents.add(event.id);
            }
        });
        this.updateSelectionUI();
        
        if (typeof showNotification === 'function') {
            showNotification(`✅ Vybráno ${this.selectedEvents.size} sloučených akcí`, 'success', 2000);
        }
    },
    
    // Výběr jen predikcí
    selectPredictions() {
        this.selectedEvents.clear();
        filteredEvents.forEach(event => {
            if (event.hasPrediction) {
                this.selectedEvents.add(event.id);
            }
        });
        this.updateSelectionUI();
        
        if (typeof showNotification === 'function') {
            showNotification(`🤖 Vybráno ${this.selectedEvents.size} akcí s predikcí`, 'success', 2000);
        }
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
                
                // Aktualizace informací o typech vybraných akcí
                this.updateSelectionInfo();
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
    
    // Aktualizace info o vybraných akcích
    updateSelectionInfo() {
        const selectedEventsData = calendarState.events.filter(event => 
            this.selectedEvents.has(event.id)
        );
        
        const mergedCount = selectedEventsData.filter(e => e.hasRealData && e.hasPrediction).length;
        const historicalCount = selectedEventsData.filter(e => e.hasRealData && !e.hasPrediction).length;
        const predictionCount = selectedEventsData.filter(e => !e.hasRealData && e.hasPrediction).length;
        
        const selectionInfo = document.getElementById('selectionInfo');
        if (selectionInfo) {
            selectionInfo.innerHTML = `
                <small>🔄${mergedCount} sloučených, 📊${historicalCount} historických, 🤖${predictionCount} predikcí</small>
            `;
        }
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
        
        exportEventsToCSV(selectedEventData, `donuland_vybrane_akce_${new Date().toISOString().split('T')[0]}.csv`);
        this.clearSelection();
        
        if (typeof showNotification === 'function') {
            showNotification(`📄 ${selectedEventData.length} vybraných událostí exportováno`, 'success');
        }
    },
    
    // Export jen predikcí k vložení do Sheets
    exportPredictionsToSheets() {
        const predictionsToExport = calendarState.events.filter(event => 
            this.selectedEvents.has(event.id) && event.hasPrediction
        );
        
        if (predictionsToExport.length === 0) {
            if (typeof showNotification === 'function') {
                showNotification('❌ Žádné vybrané akce s predikcí', 'error');
            }
            return;
        }
        
        // CSV speciálně pro vložení do Google Sheets predikčního listu
        const csvHeaders = [
            'Název akce',
            'Kategorie',
            'Město', 
            'Datum od',
            'Datum do',
            'Návštěvníci',
            'Predikovaný prodej',
            'Confidence %',
            'Očekávaný obrat',
            'Očekávaný zisk',
            'Business model',
            'Datum vytvoření predikce'
        ];
        
        const csvRows = predictionsToExport.map(event => [
            escapeCSVValue(event.title),
            escapeCSVValue(event.category),
            escapeCSVValue(event.city),
            event.startDate.toLocaleDateString('cs-CZ'),
            event.endDate.toLocaleDateString('cs-CZ'),
            event.data.visitors || 0,
            event.prediction?.predictedSales || 0,
            event.prediction?.confidence || 0,
            event.prediction?.expectedRevenue || 0,
            event.prediction?.expectedProfit || 0,
            escapeCSVValue(event.prediction?.businessModel || ''),
            new Date(event.prediction?.createdAt || Date.now()).toLocaleDateString('cs-CZ')
        ].join(','));
        
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `donuland_predikce_pro_sheets_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        this.clearSelection();
        
        if (typeof showNotification === 'function') {
            showNotification(`📤 ${predictionsToExport.length} predikcí připraveno pro Sheets`, 'success', 4000);
        }
    },
    
    // Hromadné smazání vybraných událostí
    deleteSelected() {
        if (this.selectedEvents.size === 0) {
            if (typeof showNotification === 'function') {
                showNotification('❌ Nejsou vybrány žádné události', 'error');
            }
            return;
        }
        
        const selectedEventsData = calendarState.events.filter(event => 
            this.selectedEvents.has(event.id)
        );
        
        const mergedCount = selectedEventsData.filter(e => e.hasRealData && e.hasPrediction).length;
        const historicalCount = selectedEventsData.filter(e => e.hasRealData && !e.hasPrediction).length;
        const predictionCount = selectedEventsData.filter(e => !e.hasRealData && e.hasPrediction).length;
        
        let confirmMessage = `Opravdu chcete smazat ${this.selectedEvents.size} vybraných událostí?\n\n`;
        confirmMessage += `🔄 ${mergedCount} sloučených akcí\n`;
        confirmMessage += `📊 ${historicalCount} historických akcí\n`;
        confirmMessage += `🤖 ${predictionCount} predikcí\n\n`;
        confirmMessage += `Pozor: Smazané akce se již neobnoví ani po refresh stránky!`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Smazat každou událost (využívá blacklist z Part 4A)
        const eventIds = Array.from(this.selectedEvents);
        eventIds.forEach(eventId => {
            const event = calendarState.events.find(e => e.id === eventId);
            if (event) {
                // Použij deleteEvent funkci z Part 4A (bez potvrzovacího dialogu)
                deletedEventsManager.addToBlacklist(eventId);
                
                // Pokud je to sloučená akce, přidat do blacklistu i související predikci
                if (event.hasPrediction && event.prediction && event.prediction.id !== eventId) {
                    deletedEventsManager.addToBlacklist(event.prediction.id);
                }
                
                // Smazat z localStorage pokud je to predikce
                if (event.hasPrediction && event.prediction.id.startsWith('prediction_')) {
                    deletePredictionFromStorage(event.prediction.id);
                }
            }
        });
        
        const deletedCount = this.selectedEvents.size;
        this.clearSelection();
        
        // Refresh kalendář
        loadCalendarEvents();
        generateCalendarGrid();
        displayFilteredEventsInCalendar();
        updateMonthEventsList();
        
        if (typeof showNotification === 'function') {
            showNotification(`🗑️ ${deletedCount} událostí trvale smazáno`, 'success', 4000);
        }
    }
};

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
                            <label>Očekávaný prodej</label>
                            <input type="number" id="quickSales" placeholder="150" min="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Poznámka</label>
                        <textarea id="quickNotes" rows="2" placeholder="Volitelná poznámka..."></textarea>
                    </div>
                    
                    <div class="quick-add-info">
                        <small>💡 Rychle přidaná akce bude označena jako plánovaná predikce. Můžete ji později upravit nebo smazat.</small>
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
    
    // Kontrola duplicit - zkontroluj zda už existuje podobná akce
    const startDate = parseDate(dateFrom);
    const endDate = parseDate(dateTo);
    
    const existingEvent = calendarState.events.find(event => {
        const nameMatch = normalizeEventName(event.title) === normalizeEventName(eventName);
        const dateOverlap = datesOverlap(event.startDate, event.endDate, startDate, endDate);
        return nameMatch && dateOverlap;
    });
    
    if (existingEvent) {
        const shouldMerge = confirm(`Akce "${eventName}" už existuje v podobném termínu.\n\nChcete sloučit informace s existující akcí?`);
        
        if (shouldMerge) {
            // Sloučit s existující akcí
            if (!existingEvent.hasPrediction) {
                existingEvent.hasPrediction = true;
                existingEvent.source = 'merged';
                existingEvent.prediction = {
                    id: 'quick_' + Date.now(),
                    predictedSales: sales,
                    confidence: 75, // Default confidence pro rychlé akce
                    expectedRevenue: sales * 110,
                    expectedProfit: sales * 30,
                    businessModel: 'owner',
                    createdAt: new Date().toISOString(),
                    notes: notes
                };
                
                // Aktualizovat data pokud nejsou vyplněna
                if (!existingEvent.data.visitors && visitors > 0) {
                    existingEvent.data.visitors = visitors;
                }
                if (notes && !existingEvent.data.notes) {
                    existingEvent.data.notes = notes;
                }
            }
            
            modal.remove();
            
            // Refresh zobrazení
            generateCalendarGrid();
            displayFilteredEventsInCalendar();
            updateMonthEventsList();
            
            if (typeof showNotification === 'function') {
                showNotification(`🔄 Informace sloučeny s existující akcí "${eventName}"`, 'success');
            }
            
            return;
        } else {
            // Pokračovat s vytvořením nové akce i přes duplicitu
        }
    }
    
    // Vytvoření nové události
    const quickEventId = 'quick_' + Date.now();
    const newEvent = {
        id: quickEventId,
        title: eventName,
        startDate: startDate,
        endDate: endDate,
        category: category,
        city: city,
        status: 'planned',
        source: 'manual',
        color: getUniqueEventColor(),
        hasRealData: false,
        hasPrediction: true,
        data: {
            visitors: visitors,
            predictedSales: sales,
            notes: notes,
            confidence: 75, // Default confidence pro rychlé akce
            businessModel: 'owner',
            price: 110
        },
        prediction: {
            id: quickEventId,
            predictedSales: sales,
            confidence: 75,
            expectedRevenue: sales * 110,
            expectedProfit: sales * 30,
            businessModel: 'owner',
            createdAt: new Date().toISOString(),
            formData: {
                eventName: eventName,
                category: category,
                city: city,
                eventDateFrom: dateFrom,
                eventDateTo: dateTo,
                visitors: visitors
            }
        }
    };
    
    // Přidání do kalendáře
    calendarState.events.push(newEvent);
    filteredEvents.push(newEvent);
    
    // Uložit do localStorage jako rychlou predikci
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.push({
            formData: newEvent.prediction.formData,
            prediction: {
                predictedSales: sales,
                confidence: 75
            },
            businessResults: {
                revenue: sales * 110,
                profit: sales * 30
            },
            timestamp: new Date().toISOString(),
            isQuickAdd: true
        });
        localStorage.setItem('donuland_predictions', JSON.stringify(savedPredictions));
    } catch (error) {
        console.warn('Error saving quick event to localStorage:', error);
    }
    
    // Refresh UI
    generateCalendarGrid();
    displayFilteredEventsInCalendar();
    updateMonthEventsList();
    
    // Zavření modalu
    modal.remove();
    
    if (typeof showNotification === 'function') {
        showNotification(`✅ Akce "${eventName}" byla rychle přidána`, 'success');
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
            <button class="btn btn-small" onclick="showQuickAddModal()">
                ⚡ Rychlá akce
            </button>
            <button class="btn btn-small" onclick="showMonthSelector()">
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
            <button class="btn btn-small" onclick="exportEventsToCSV(filteredEvents)">
                📄 Export
            </button>
            <button class="btn btn-small" onclick="bulkOperations.selectAll()">
                ☑️ Vybrat vše
            </button>
            <button class="btn btn-small" onclick="bulkOperations.selectMerged()">
                🔄 Sloučené
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
            <div id="selectionInfo"></div>
        </div>
        <div class="bulk-buttons">
            <button class="btn btn-small" onclick="bulkOperations.exportSelected()">
                📄 Export vybraných
            </button>
            <button class="btn btn-small btn-export" onclick="bulkOperations.exportPredictionsToSheets()">
                📤 Predikce → Sheets
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
if (typeof window.initializeCalendar_Part4C_Extended === 'undefined') {
    window.initializeCalendar_Part4C_Extended = true;
    
    const originalInitializeCalendar = window.initializeCalendar;
    window.initializeCalendar = function() {
        if (window.calendarInitialized) {
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
            
            // Initialize search (from Part 4B)
            if (typeof initializeEventSearch === 'function') {
                initializeEventSearch();
            }
            
            console.log('✅ Calendar Part 4C enhancements loaded');
            
            // Show welcome notification
            if (typeof showNotification === 'function') {
                showNotification('🎉 Pokročilý kalendář je připraven!', 'success', 3000);
            }
        }, 1000);
    };
}

// ========================================
// EVENT LISTENERS PRO PART 4C
// ========================================

// Event listeners pro pokročilé funkce
if (typeof eventBus !== 'undefined') {
    
    eventBus.on('calendarRequested', () => {
        setTimeout(() => {
            if (!window.calendarInitialized) {
                initializeCalendar();
            } else {
                // Zajistit, že UI komponenty jsou přítomny
                injectEnhancedCalendarUI();
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
                bulkOperations.clearSelection();
            }
        }, 500);
    });
    
    // Event po sloučení predikce
    eventBus.on('predictionMerged', (data) => {
        setTimeout(() => {
            loadCalendarEvents();
            filteredEvents = [...calendarState.events];
            displayFilteredEventsInCalendar();
            updateMonthEventsList();
            
            if (typeof showNotification === 'function') {
                showNotification(`🔄 Predikce byla sloučena s akcí "${data.eventName}"`, 'success', 4000);
            }
        }, 500);
    });
    
    // Event po smazání události
    eventBus.on('eventDeleted', (data) => {
        // Odstranit ze selection pokud byla vybrána
        bulkOperations.selectedEvents.delete(data.eventId);
        bulkOperations.updateSelectionUI();
    });
}

// ========================================
// ROZŠÍŘENÍ SHOWDAYMODAL PRO QUICK ADD
// ========================================

// Rozšíření showDayModal z Part 4B pro quick add možnost
if (typeof window.showDayModal_Part4C_Extended === 'undefined') {
    window.showDayModal_Part4C_Extended = true;
    
    const originalShowDayModal_Part4B = window.showDayModal;
    window.showDayModal = function(date) {
        const dateKey = formatDateKey(date);
        const dayEvents = filteredEvents.filter(event => {
            const startKey = formatDateKey(event.startDate);
            const endKey = formatDateKey(event.endDate);
            return dateKey >= startKey && dateKey <= endKey;
        });
        
        // Pokud nejsou žádné události, nabídnout quick add
        if (dayEvents.length === 0) {
            const shouldAddEvent = confirm(`Žádné události v tomto dni.\n\nChcete rychle přidat novou akci pro ${date.toLocaleDateString('cs-CZ')}?`);
            if (shouldAddEvent) {
                showQuickAddModal(date);
            }
            return;
        }
        
        // Pokračovat s původní funkcí
        originalShowDayModal_Part4B(date);
    };
}

// ========================================
// ROZŠÍŘENÍ CALENDAR GRID PRO BULK SELECTION
// ========================================

// Rozšíření createDayCell z Part 4A pro bulk selection
if (typeof window.createDayCell_Part4C_Extended === 'undefined') {
    window.createDayCell_Part4C_Extended = true;
    
    // Override zobrazení událostí pro přidání checkboxů
    const originalDisplayEventsInCalendar_Part4B = window.displayFilteredEventsInCalendar || displayFilteredEventsInCalendar;
    
    window.displayFilteredEventsInCalendar = function() {
        originalDisplayEventsInCalendar_Part4B();
        
        // Přidat checkboxy k událostem
        document.querySelectorAll('.event-item').forEach(eventElement => {
            if (!eventElement.classList.contains('more-events') && !eventElement.querySelector('.event-checkbox')) {
                // Najít související událost podle názvu a data
                const dayCell = eventElement.closest('.calendar-day');
                const dateKey = dayCell?.dataset.date;
                
                if (dateKey) {
                    const dayEvents = filteredEvents.filter(event => {
                        const startKey = formatDateKey(event.startDate);
                        const endKey = formatDateKey(event.endDate);
                        return dateKey >= startKey && dateKey <= endKey;
                    });
                    
                    // Pro jednoduchost přidat checkbox jen na první událost v dni
                    const isFirstEvent = eventElement === dayCell.querySelector('.event-item:not(.more-events)');
                    
                    if (isFirstEvent && dayEvents.length > 0) {
                        const event = dayEvents[0]; // První událost
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.className = 'event-checkbox';
                        checkbox.dataset.eventId = event.id;
                        checkbox.checked = bulkOperations.selectedEvents.has(event.id);
                        
                        checkbox.addEventListener('change', (e) => {
                            e.stopPropagation();
                            bulkOperations.toggleEventSelection(event.id);
                        });
                        
                        checkbox.addEventListener('click', (e) => {
                            e.stopPropagation();
                        });
                        
                        eventElement.style.position = 'relative';
                        eventElement.appendChild(checkbox);
                    }
                }
            }
        });
    };
}

// ========================================
// ROZŠÍŘENÍ MONTH EVENT ITEMS PRO BULK SELECTION
// ========================================

// Rozšíření createMonthEventItem z Part 4B pro checkboxy
if (typeof window.createMonthEventItem_Part4C_Extended === 'undefined') {
    window.createMonthEventItem_Part4C_Extended = true;
    
    const originalCreateMonthEventItem = window.createMonthEventItem;
    window.createMonthEventItem = function(event) {
        let html = originalCreateMonthEventItem(event);
        
        // Přidat checkbox do month event item
        const checkboxHtml = `
            <div class="month-event-checkbox">
                <input type="checkbox" class="event-checkbox" data-event-id="${event.id}" 
                       ${bulkOperations.selectedEvents.has(event.id) ? 'checked' : ''}
                       onchange="event.stopPropagation(); bulkOperations.toggleEventSelection('${event.id}')"
                       onclick="event.stopPropagation()">
            </div>
        `;
        
        // Vložit checkbox před event-stats
        html = html.replace('<div class="event-stats">', checkboxHtml + '<div class="event-stats">');
        
        return html;
    };
}

// ========================================
// HELPER FUNKCE PRO PART 4C
// ========================================

// Helper pro escapování CSV hodnot (pro případ že není v Part 4B)
if (typeof escapeCSVValue === 'undefined') {
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
}

// Helper pro smazání predikce z localStorage (pro případ že není v Part 4A)
if (typeof deletePredictionFromStorage === 'undefined') {
    function deletePredictionFromStorage(predictionId) {
        try {
            const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
            const predictionIndex = parseInt(predictionId.replace('prediction_', ''));
            
            if (savedPredictions[predictionIndex]) {
                savedPredictions.splice(predictionIndex, 1);
                localStorage.setItem('donuland_predictions', JSON.stringify(savedPredictions));
            }
        } catch (error) {
            console.error('Error deleting prediction from storage:', error);
        }
    }
}

// ========================================
// GLOBÁLNÍ EXPORT PRO PART 4C
// ========================================

// Export funkcí pro HTML onclick handlers
if (typeof window !== 'undefined') {
    window.showQuickAddModal = showQuickAddModal;
    window.saveQuickEvent = saveQuickEvent;
    window.showMonthSelector = showMonthSelector;
    window.applyMonthSelection = applyMonthSelection;
    window.bulkOperations = bulkOperations;
    
    // Rozšíření debug objektu
    if (window.calendarDebug) {
        window.calendarDebug.bulkOperations = bulkOperations;
        window.calendarDebug.quickAdd = {
            addEvent: (name, category, city, date) => {
                showQuickAddModal(date ? new Date(date) : new Date());
                setTimeout(() => {
                    if (name) document.getElementById('quickEventName').value = name;
                    if (category) document.getElementById('quickCategory').value = category;
                    if (city) document.getElementById('quickCity').value = city;
                }, 100);
            }
        };
        window.calendarDebug.getSelectedEvents = () => {
            return calendarState.events.filter(event => 
                bulkOperations.selectedEvents.has(event.id)
            );
        };
    }
}

console.log('✅ Donuland Part 4C loaded successfully');
console.log('🗓️ Advanced Calendar Features:');
console.log('  ✅ Bulk Operations (select multiple events with enhanced info)');
console.log('  ✅ Quick Add Event with smart duplicate detection');
console.log('  ✅ Month/Year Selector');
console.log('  ✅ Enhanced UI with action bars and bulk selection');
console.log('  ✅ Special export for Google Sheets predictions');
console.log('  ✅ Smart integration with Part 4A blacklist and Part 4B filters');
console.log('⚡ Features: Quick add, Bulk ops, Month selector, Enhanced UI');

// Emit completion event
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part4CLoaded', { 
        timestamp: Date.now(),
        version: '1.0.0',
        features: [
            'bulk-operations-with-merge-info',
            'quick-add-with-duplicate-detection', 
            'month-year-selector',
            'enhanced-ui-injection',
            'special-sheets-export',
            'smart-bulk-selection',
            'integration-with-blacklist-and-filters'
        ]
    });
}
