/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 4A (OPRAVENO)
   Calendar Implementation s lepším barevným rozlišením
   ======================================== */

console.log('🍩 Donuland Part 4A (FIXED) loading...');

// ========================================
// KALENDÁŘ GLOBÁLNÍ STAV
// ========================================

const calendarState = {
    currentEvents: [],
    filteredEvents: [],
    filters: {
        city: '',
        category: '',
        status: ''
    },
    isRendering: false
};

// ========================================
// HLAVNÍ KALENDÁŘ FUNKCE
// ========================================

// Hlavní funkce pro vykreslení kalendáře - OPRAVENO
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
        
        // Aktualizace seznamu akcí pro měsíc
        updateMonthEventsList();
        
        console.log(`✅ Calendar rendered for ${month + 1}/${year}`);
        
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

// OPRAVENO: Získání událostí pro konkrétní datum s lepším sloučením
function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const events = [];
    const eventMap = new Map(); // Pro detekci duplicit
    
    try {
        // 1. Historické akce z globálních dat (dokončené)
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            globalState.historicalData.forEach(record => {
                if (isDateInRange(dateStr, record.dateFrom, record.dateTo)) {
                    const eventKey = `${record.eventName}-${record.city}-${record.dateFrom}`.toLowerCase();
                    
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
                        eventKey: eventKey
                    };
                    
                    eventMap.set(eventKey, event);
                }
            });
        }
        
        // 2. Uložené predikce z localStorage (plánované nebo dokončené)
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData && isDateInRange(dateStr, prediction.formData.eventDateFrom, prediction.formData.eventDateTo)) {
                const eventKey = `${prediction.formData.eventName}-${prediction.formData.city}-${prediction.formData.eventDateFrom}`.toLowerCase();
                
                // Zkontroluj, zda už existuje historická akce se stejným klíčem
                if (eventMap.has(eventKey)) {
                    // Přidej predikci k existující historické akci
                    const existingEvent = eventMap.get(eventKey);
                    existingEvent.hasPrediction = true;
                    existingEvent.predictionData = prediction;
                    existingEvent.predictedSales = prediction.prediction?.predictedSales;
                } else {
                    // Vytvoř novou predikční akci
                    const status = prediction.actualSales && prediction.actualSales > 0 ? 'completed' : 'planned';
                    
                    const event = {
                        id: `prediction-${prediction.id}`,
                        type: 'prediction',
                        status: status,
                        title: prediction.formData.eventName,
                        city: prediction.formData.city,
                        category: prediction.formData.category,
                        predictedSales: prediction.prediction?.predictedSales,
                        actualSales: prediction.actualSales,
                        visitors: prediction.formData.visitors,
                        dateFrom: prediction.formData.eventDateFrom,
                        dateTo: prediction.formData.eventDateTo,
                        data: prediction,
                        eventKey: eventKey
                    };
                    
                    eventMap.set(eventKey, event);
                }
            }
        });
        
        // 3. Manuálně přidané události
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            if (isDateInRange(dateStr, event.dateFrom, event.dateTo)) {
                const eventKey = `${event.eventName}-${event.city}-${event.dateFrom}`.toLowerCase();
                
                if (!eventMap.has(eventKey)) {
                    const eventDate = new Date(event.dateFrom);
                    const today = new Date();
                    const status = eventDate <= today ? 'completed' : 'planned';
                    
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
                        dateTo: event.dateTo,
                        data: event,
                        eventKey: eventKey
                    };
                    
                    eventMap.set(eventKey, newEvent);
                }
            }
        });
        
    } catch (error) {
        console.warn('⚠️ Error getting events for date:', dateStr, error);
    }
    
    // Aplikace filtrů
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

// Kontrola, zda datum spadá do rozsahu
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
// VYTVOŘENÍ KALENDÁŘNÍCH PRVKŮ - OPRAVENO
// ========================================

// OPRAVENO: Vytvoření prvku kalendářního dne s lepším barevným rozlišením
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
    
    // Seznam událostí s barevným rozlišením
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    dayData.events.slice(0, 3).forEach(event => { // Max 3 události viditelné
        const eventElement = document.createElement('div');
        
        // OPRAVENO: Lepší barevné rozlišení podle typu a statusu
        let eventClass = 'event-item';
        let backgroundColor = '#6c757d'; // default šedá
        
        if (event.type === 'historical') {
            backgroundColor = '#28a745'; // zelená pro dokončené historické
            eventClass += ' historical completed';
        } else if (event.type === 'prediction') {
            if (event.status === 'completed') {
                backgroundColor = '#17a2b8'; // modrá pro dokončené predikce
                eventClass += ' prediction completed';
            } else {
                backgroundColor = '#ffc107'; // žlutá pro plánované predikce
                eventClass += ' prediction planned';
            }
        } else if (event.type === 'manual') {
            if (event.status === 'completed') {
                backgroundColor = '#6f42c1'; // fialová pro dokončené manuální
                eventClass += ' manual completed';
            } else {
                backgroundColor = '#fd7e14'; // oranžová pro plánované manuální
                eventClass += ' manual planned';
            }
        }
        
        // Speciální označení pro akce s predikcí
        if (event.hasPrediction) {
            eventClass += ' has-prediction';
            // Gradient pro akce s predikcí
            backgroundColor = 'linear-gradient(45deg, #28a745, #17a2b8)';
        }
        
        eventElement.className = eventClass;
        eventElement.style.background = backgroundColor;
        eventElement.textContent = event.title;
        eventElement.title = `${event.title} - ${event.city} (${event.status === 'completed' ? 'Dokončeno' : 'Plánováno'})`;
        
        // Click handler pro editaci
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
        moreIndicator.addEventListener('click', (e) => {
            e.stopPropagation();
            showDayEventsPopup(dayData.date, dayData.events);
        });
        eventsContainer.appendChild(moreIndicator);
    }
    
    dayElement.appendChild(eventsContainer);
    
    // Click handler pro přidání události
    dayElement.addEventListener('click', () => {
        if (dayData.isCurrentMonth) {
            openEventModal(null, dayData.date);
        }
    });
    
    return dayElement;
}

// OPRAVENO: Zobrazení popup s událostmi pro den
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
        max-width: 400px;
        max-height: 500px;
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #667eea;">📅 ${dateStr}</h3>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
    `;
    
    events.forEach(event => {
        // OPRAVENO: Lepší ikony a barvy podle typu
        let typeIcon, typeLabel, backgroundColor;
        
        if (event.type === 'historical') {
            typeIcon = '📊';
            typeLabel = 'Historická (dokončeno)';
            backgroundColor = '#d4edda';
        } else if (event.type === 'prediction') {
            typeIcon = event.status === 'completed' ? '✅' : '🔮';
            typeLabel = event.status === 'completed' ? 'Predikce (dokončeno)' : 'Predikce (plánováno)';
            backgroundColor = event.status === 'completed' ? '#d1ecf1' : '#fff3cd';
        } else {
            typeIcon = event.status === 'completed' ? '✅' : '📝';
            typeLabel = event.status === 'completed' ? 'Manuální (dokončeno)' : 'Manuální (plánováno)';
            backgroundColor = event.status === 'completed' ? '#e2e3ea' : '#fdeaea';
        }
        
        const sales = event.sales || event.actualSales || event.predictedSales || 0;
        const salesText = event.type === 'prediction' && !event.actualSales ? 
            `🔮 ${formatNumber(event.predictedSales)} ks (predikce)` : 
            `🍩 ${formatNumber(sales)} ks`;
        
        // Označení pro akce s predikcí
        const predictionBadge = event.hasPrediction ? 
            '<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">+ Predikce</span>' : '';
        
        html += `
            <div style="background: ${backgroundColor}; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #667eea;">
                <h4 style="margin: 0 0 8px; color: #333;">${escapeHtml(event.title)}${predictionBadge}</h4>
                <p style="margin: 0 0 5px; font-size: 0.9em; color: #666;">
                    ${typeIcon} ${typeLabel} • ${escapeHtml(event.city)} • ${escapeHtml(event.category)}
                </p>
                <div style="font-size: 0.8em; color: #555;">
                    ${salesText} • 👥 ${formatNumber(event.visitors)} návštěvníků
                </div>
                <button onclick="openEventModalFromPopup('${event.type}', '${event.id}'); this.closest('.day-events-popup').remove();" 
                        style="margin-top: 8px; padding: 4px 8px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                    ✏️ Detail
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    popup.innerHTML = html;
    
    // Backdrop
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

// Helper funkce pro otevření modalu z popup
function openEventModalFromPopup(eventType, eventId) {
    // Najdi událost podle typu a ID
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
                    visitors: prediction.formData.visitors,
                    dateFrom: prediction.formData.eventDateFrom,
                    dateTo: prediction.formData.eventDateTo,
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

// ========================================
// EVENT LISTENERS PRO KALENDÁŘ
// ========================================

// Event listener pro změnu měsíce (již existuje v Part 1)
eventBus.on('calendarMonthChanged', (data) => {
    console.log('📅 Calendar month changed:', data);
    renderCalendar();
});

// Event listener pro dnes
eventBus.on('calendarTodayRequested', () => {
    console.log('📅 Calendar today requested');
    renderCalendar();
});

// Event listener pro resize
eventBus.on('calendarResizeRequested', () => {
    console.log('📅 Calendar resize requested');
    setTimeout(() => {
        renderCalendar();
    }, 100);
});

// Event listener pro požadavek na kalendář
eventBus.on('calendarRequested', () => {
    console.log('📅 Calendar section requested');
    
    // Aktualizace kalendáře když je sekce zobrazena
    setTimeout(() => {
        updateCalendarFilters();
        renderCalendar();
    }, 100);
});

// Event listener pro aktualizaci dat
eventBus.on('dataLoaded', () => {
    console.log('📅 Data loaded, updating calendar');
    setTimeout(() => {
        updateCalendarFilters();
        renderCalendar();
    }, 500);
});

eventBus.on('dataUpdated', () => {
    console.log('📅 Data updated, refreshing calendar');
    setTimeout(() => {
        updateCalendarFilters();
        renderCalendar();
    }, 100);
});

// Event listener pro zavření modalu (rozšíření z Part 1)
eventBus.on('modalClosed', () => {
    // Refresh kalendáře po zavření modalu
    setTimeout(() => {
        renderCalendar();
    }, 100);
});

// ========================================
// INICIALIZACE KALENDÁŘE
// ========================================

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Initializing Calendar Part 4A (FIXED)...');
    
    // Přidání event listenerů pro filtry
    const cityFilter = document.getElementById('cityFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (cityFilter) cityFilter.addEventListener('change', filterCalendar);
    if (categoryFilter) categoryFilter.addEventListener('change', filterCalendar);
    if (statusFilter) statusFilter.addEventListener('change', filterCalendar);
    
    // Připravení kalendáře pokud jsou data již načtena
    if (globalState.historicalData && globalState.historicalData.length > 0) {
        setTimeout(() => {
            updateCalendarFilters();
            renderCalendar();
        }, 1000);
    }
    
    console.log('✅ Calendar Part 4A (FIXED) initialized');
});

// ========================================
// FINALIZACE ČÁST 4A
// ========================================

console.log('✅ Donuland Part 4A (FIXED) loaded successfully');
console.log('📅 Features: ✅ Better Color Coding ✅ Event Merging ✅ Historical+Prediction Integration');
console.log('🎨 Colors: Green=Historical, Blue/Yellow=Prediction, Purple/Orange=Manual, Gradient=Has Prediction');
console.log('⏳ Ready for Part 4B: Modal & Events Management');

// Event pro signalizaci dokončení části 4A
eventBus.emit('part4aLoaded', { 
    timestamp: Date.now(),
    version: '2.0.0',
    features: ['calendar-rendering', 'better-color-coding', 'event-merging', 'prediction-integration']
});
/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 4B
   Modal & Events Management
   Kompletní verze pro správu událostí v kalendáři
   ======================================== */

console.log('🍩 Donuland Part 4B loading...');

// ========================================
// MODAL PRO UDÁLOSTI
// ========================================

// Rozšíření openModal funkce z Part 1 pro kalendář
const originalOpenModal = window.openModal || function() {};

function openEventModal(event = null, date = null) {
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
    
    // Vymazání předchozích dat
    modal.removeAttribute('data-event-id');
    modal.removeAttribute('data-event-type');
    
    if (event) {
        // Editace existující události
        modalTitle.textContent = 'Detail akce';
        modalEventName.value = event.title || '';
        modalEventDateFrom.value = event.dateFrom || '';
        modalEventDateTo.value = event.dateTo || '';
        modalEventCity.value = event.city || '';
        
        if (event.type === 'historical') {
            modalSales.value = event.sales || '';
            modalSales.placeholder = 'Reálně prodáno (ks)';
            modalNotes.value = event.data.notes || '';
        } else if (event.type === 'prediction') {
            modalSales.value = event.data.actualSales || '';
            modalSales.placeholder = `Predikováno: ${event.predictedSales || 0} ks`;
            modalNotes.value = event.data.notes || '';
        } else if (event.type === 'manual') {
            modalSales.value = event.sales || '';
            modalSales.placeholder = 'Prodáno (ks)';
            modalNotes.value = event.data.notes || '';
        }
        
        modal.setAttribute('data-event-id', event.id);
        modal.setAttribute('data-event-type', event.type);
        
        // Readonly pro historické záznamy (kromě prodeje a poznámek)
        if (event.type === 'historical') {
            modalEventName.readOnly = true;
            modalEventDateFrom.readOnly = true;
            modalEventDateTo.readOnly = true;
            modalEventCity.readOnly = true;
        } else {
            modalEventName.readOnly = false;
            modalEventDateFrom.readOnly = false;
            modalEventDateTo.readOnly = false;
            modalEventCity.readOnly = false;
        }
        
    } else if (date) {
        // Nová událost
        modalTitle.textContent = 'Přidat akci';
        modalEventName.value = '';
        modalEventDateFrom.value = date.toISOString().split('T')[0];
        modalEventDateTo.value = date.toISOString().split('T')[0];
        modalEventCity.value = '';
        modalSales.value = '';
        modalSales.placeholder = 'Prodáno (ks)';
        modalNotes.value = '';
        
        // Vše editovatelné pro novou událost
        modalEventName.readOnly = false;
        modalEventDateFrom.readOnly = false;
        modalEventDateTo.readOnly = false;
        modalEventCity.readOnly = false;
    }
    
    modal.style.display = 'flex';
    console.log('📝 Event modal opened:', { event, date });
}

// ========================================
// ULOŽENÍ A SMAZÁNÍ UDÁLOSTÍ
// ========================================

// Uložení změn události
function saveEventEdit() {
    const modal = document.getElementById('eventModal');
    if (!modal) return;
    
    const eventId = modal.getAttribute('data-event-id');
    const eventType = modal.getAttribute('data-event-type');
    const modalSales = document.getElementById('modalSales');
    const modalNotes = document.getElementById('modalNotes');
    const modalEventName = document.getElementById('modalEventName');
    const modalEventDateFrom = document.getElementById('modalEventDateFrom');
    const modalEventDateTo = document.getElementById('modalEventDateTo');
    const modalEventCity = document.getElementById('modalEventCity');
    
    const sales = parseInt(modalSales.value) || 0;
    const notes = modalNotes.value.trim();
    
    try {
        if (eventType === 'historical' && eventId) {
            // Aktualizace historických dat (pouze v memory)
            const historicalIndex = globalState.historicalData.findIndex(record => 
                `historical-${record.rowIndex}` === eventId
            );
            
            if (historicalIndex !== -1) {
                globalState.historicalData[historicalIndex].sales = sales;
                globalState.historicalData[historicalIndex].notes = notes;
                
                showNotification('✅ Historická akce aktualizována (pouze lokálně)', 'success');
                console.log('📝 Historical event updated:', globalState.historicalData[historicalIndex]);
            }
            
        } else if (eventType === 'prediction' && eventId) {
            // Aktualizace uložené predikce
            const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
            const predictionIndex = savedPredictions.findIndex(pred => 
                `prediction-${pred.id}` === eventId
            );
            
            if (predictionIndex !== -1) {
                savedPredictions[predictionIndex].actualSales = sales;
                savedPredictions[predictionIndex].notes = notes;
                savedPredictions[predictionIndex].completed = sales > 0;
                savedPredictions[predictionIndex].updatedAt = new Date().toISOString();
                
                localStorage.setItem('donuland_predictions', JSON.stringify(savedPredictions));
                
                showNotification('✅ Predikce aktualizována', 'success');
                console.log('📝 Prediction updated:', savedPredictions[predictionIndex]);
            }
            
        } else if (eventType === 'manual' && eventId) {
            // Aktualizace manuální události
            const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
            const eventIndex = manualEvents.findIndex(event => 
                `manual-${event.id}` === eventId
            );
            
            if (eventIndex !== -1) {
                manualEvents[eventIndex].eventName = modalEventName.value.trim();
                manualEvents[eventIndex].dateFrom = modalEventDateFrom.value;
                manualEvents[eventIndex].dateTo = modalEventDateTo.value;
                manualEvents[eventIndex].city = modalEventCity.value.trim();
                manualEvents[eventIndex].sales = sales;
                manualEvents[eventIndex].notes = notes;
                manualEvents[eventIndex].updatedAt = new Date().toISOString();
                
                localStorage.setItem('donuland_manual_events', JSON.stringify(manualEvents));
                
                showNotification('✅ Akce aktualizována', 'success');
                console.log('📝 Manual event updated:', manualEvents[eventIndex]);
            }
            
        } else {
            // Nová manuální událost
            const newEvent = {
                id: generateId(),
                eventName: modalEventName.value.trim(),
                dateFrom: modalEventDateFrom.value,
                dateTo: modalEventDateTo.value,
                city: modalEventCity.value.trim(),
                category: 'ostatní',
                sales: sales,
                notes: notes,
                createdAt: new Date().toISOString(),
                type: 'manual'
            };
            
            const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
            manualEvents.push(newEvent);
            localStorage.setItem('donuland_manual_events', JSON.stringify(manualEvents));
            
            showNotification('✅ Nová akce přidána', 'success');
            console.log('➕ Manual event added:', newEvent);
        }
        
        // Refresh kalendáře a analýz
        renderCalendar();
        updateCalendarFilters();
        closeModal();
        
        // Trigger analytics refresh
        eventBus.emit('dataUpdated');
        
    } catch (error) {
        console.error('❌ Error saving event:', error);
        showNotification('❌ Chyba při ukládání události', 'error');
    }
}

// Smazání události
function deleteEvent() {
    const modal = document.getElementById('eventModal');
    if (!modal) return;
    
    const eventId = modal.getAttribute('data-event-id');
    const eventType = modal.getAttribute('data-event-type');
    
    if (!eventId || !eventType) {
        showNotification('❌ Nelze identifikovat událost ke smazání', 'error');
        return;
    }
    
    if (!confirm('Opravdu chcete smazat tuto akci?')) {
        return;
    }
    
    try {
        if (eventType === 'historical') {
            showNotification('❌ Historické akce nelze smazat', 'error');
            return;
            
        } else if (eventType === 'prediction') {
            // Smazání uložené predikce
            const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
            const filteredPredictions = savedPredictions.filter(pred => 
                `prediction-${pred.id}` !== eventId
            );
            
            localStorage.setItem('donuland_predictions', JSON.stringify(filteredPredictions));
            showNotification('🗑️ Predikce smazána', 'info');
            
        } else if (eventType === 'manual') {
            // Smazání manuální události
            const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
            const filteredEvents = manualEvents.filter(event => 
                `manual-${event.id}` !== eventId
            );
            
            localStorage.setItem('donuland_manual_events', JSON.stringify(filteredEvents));
            showNotification('🗑️ Akce smazána', 'info');
        }
        
        renderCalendar();
        updateCalendarFilters();
        closeModal();
        eventBus.emit('dataUpdated');
        
    } catch (error) {
        console.error('❌ Error deleting event:', error);
        showNotification('❌ Chyba při mazání události', 'error');
    }
}

// ========================================
// FILTRACE KALENDÁŘE
// ========================================

// Filtrace kalendáře
function filterCalendar() {
    const cityFilter = document.getElementById('cityFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (!cityFilter || !categoryFilter || !statusFilter) return;
    
    calendarState.filters = {
        city: cityFilter.value,
        category: categoryFilter.value,
        status: statusFilter.value
    };
    
    console.log('🔍 Filtering calendar:', calendarState.filters);
    
    // Re-render kalendáře s aplikovanými filtry
    renderCalendar();
}

// Aktualizace filter options
function updateCalendarFilters() {
    const cityFilter = document.getElementById('cityFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (!cityFilter || !categoryFilter) return;
    
    try {
        // Získání unikátních měst a kategorií
        const cities = new Set();
        const categories = new Set();
        
        // Z historických dat
        if (globalState.historicalData) {
            globalState.historicalData.forEach(record => {
                if (record.city) cities.add(record.city);
                if (record.category) categories.add(record.category);
            });
        }
        
        // Z predikcí
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData) {
                if (prediction.formData.city) cities.add(prediction.formData.city);
                if (prediction.formData.category) categories.add(prediction.formData.category);
            }
        });
        
        // Z manuálních událostí
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            if (event.city) cities.add(event.city);
            if (event.category) categories.add(event.category);
        });
        
        // Aktualizace city filtru
        const currentCityValue = cityFilter.value;
        cityFilter.innerHTML = '<option value="">🏙️ Všechna města</option>';
        Array.from(cities).sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            if (city === currentCityValue) option.selected = true;
            cityFilter.appendChild(option);
        });
        
        // Aktualizace category filtru
        const currentCategoryValue = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">📋 Všechny kategorie</option>';
        Array.from(categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === currentCategoryValue) option.selected = true;
            categoryFilter.appendChild(option);
        });
        
        console.log(`🔄 Calendar filters updated: ${cities.size} cities, ${categories.size} categories`);
        
    } catch (error) {
        console.error('❌ Error updating calendar filters:', error);
    }
}

// ========================================
// SEZNAM AKCÍ PRO MĚSÍC
// ========================================

// Aktualizace seznamu akcí pro měsíc
function updateMonthEventsList() {
    const monthEventsDiv = document.getElementById('monthEvents');
    if (!monthEventsDiv) return;
    
    try {
        const year = globalState.currentYear;
        const month = globalState.currentMonth;
        
        // Získání všech akcí v měsíci
        const monthEvents = [];
        
        // Historické akce
        if (globalState.historicalData) {
            globalState.historicalData.forEach(record => {
                if (record.dateFrom) {
                    const eventFromDate = new Date(record.dateFrom + 'T00:00:00');
                    const eventToDate = new Date((record.dateTo || record.dateFrom) + 'T00:00:00');
                    
                    // Kontrola, zda akce zasahuje do aktuálního měsíce
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);
                    
                    if (eventFromDate <= monthEnd && eventToDate >= monthStart) {
                        monthEvents.push({
                            type: 'historical',
                            status: 'completed',
                            date: eventFromDate,
                            title: record.eventName,
                            city: record.city,
                            category: record.category,
                            sales: record.sales,
                            visitors: record.visitors,
                            dateFrom: record.dateFrom,
                            dateTo: record.dateTo || record.dateFrom,
                            data: record
                        });
                    }
                }
            });
        }
        
        // Predikce
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData && prediction.formData.eventDateFrom) {
                const eventFromDate = new Date(prediction.formData.eventDateFrom + 'T00:00:00');
                const eventToDate = new Date((prediction.formData.eventDateTo || prediction.formData.eventDateFrom) + 'T00:00:00');
                
                // Kontrola, zda akce zasahuje do aktuálního měsíce
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                
                if (eventFromDate <= monthEnd && eventToDate >= monthStart) {
                    const status = prediction.actualSales && prediction.actualSales > 0 ? 'completed' : 'planned';
                    
                    monthEvents.push({
                        type: 'prediction',
                        status: status,
                        date: eventFromDate,
                        title: prediction.formData.eventName,
                        city: prediction.formData.city,
                        category: prediction.formData.category,
                        predictedSales: prediction.prediction?.predictedSales,
                        actualSales: prediction.actualSales,
                        visitors: prediction.formData.visitors,
                        dateFrom: prediction.formData.eventDateFrom,
                        dateTo: prediction.formData.eventDateTo || prediction.formData.eventDateFrom,
                        data: prediction
                    });
                }
            }
        });
        
        // Manuální události
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            if (event.dateFrom) {
                const eventFromDate = new Date(event.dateFrom + 'T00:00:00');
                const eventToDate = new Date((event.dateTo || event.dateFrom) + 'T00:00:00');
                
                // Kontrola, zda akce zasahuje do aktuálního měsíce
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                
                if (eventFromDate <= monthEnd && eventToDate >= monthStart) {
                    const today = new Date();
                    const status = eventFromDate <= today ? 'completed' : 'planned';
                    
                    monthEvents.push({
                        type: 'manual',
                        status: status,
                        date: eventFromDate,
                        title: event.eventName,
                        city: event.city,
                        category: event.category || 'ostatní',
                        sales: event.sales,
                        visitors: event.visitors || 0,
                        dateFrom: event.dateFrom,
                        dateTo: event.dateTo || event.dateFrom,
                        data: event
                    });
                }
            }
        });
        
        // Řazení podle data
        monthEvents.sort((a, b) => a.date - b.date);
        
        if (monthEvents.length === 0) {
            monthEventsDiv.innerHTML = `
                <div class="events-placeholder">
                    <p>📅 Žádné akce v tomto měsíci</p>
                    <button class="btn" onclick="openEventModal(null, new Date(${year}, ${month}, 1))">
                        ➕ Přidat akci
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '<div class="month-events-list">';
        
        monthEvents.forEach(event => {
            const dateStr = event.date.toLocaleDateString('cs-CZ');
            const typeIcon = event.type === 'historical' ? '📊' : event.type === 'prediction' ? '🔮' : '📝';
            const typeLabel = event.type === 'historical' ? 'Dokončeno' : event.type === 'prediction' ? 'Predikce' : 'Manuální';
            const sales = event.type === 'prediction' ? (event.actualSales || event.predictedSales) : event.sales;
            
            // Status indikátor
            const statusIcon = event.status === 'completed' ? '✅' : '🔮';
            const statusClass = event.status === 'completed' ? 'completed' : 'planned';
            
            // Duration info pro vícedenní akce
            let durationInfo = '';
            if (event.dateFrom !== event.dateTo) {
                const fromDate = new Date(event.dateFrom);
                const toDate = new Date(event.dateTo);
                const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
                durationInfo = ` (${daysDiff} dnů)`;
            }
            
            // Status pro predikce
            let statusInfo = '';
            if (event.type === 'prediction' && event.actualSales > 0) {
                const accuracy = Math.abs(1 - Math.abs(event.predictedSales - event.actualSales) / event.actualSales) * 100;
                const accuracyColor = accuracy > 80 ? '#28a745' : accuracy > 60 ? '#ffc107' : '#dc3545';
                statusInfo = `<span style="color: ${accuracyColor}; font-weight: 600;">Přesnost: ${accuracy.toFixed(0)}%</span>`;
            }
            
            html += `
                <div class="month-event-item ${event.type} ${statusClass}">
                    <div class="event-date">
                        <div class="event-day">${event.date.getDate()}</div>
                        <div class="event-month">${event.date.toLocaleDateString('cs-CZ', { month: 'short' })}</div>
                        <div class="event-status">${statusIcon}</div>
                    </div>
                    <div class="event-details">
                        <h4>${escapeHtml(event.title)}${durationInfo}</h4>
                        <p>${typeIcon} ${typeLabel} • ${escapeHtml(event.city)} • ${escapeHtml(event.category)}</p>
                        <div class="event-stats">
                            <span>🍩 ${formatNumber(sales)} ks</span>
                            <span>👥 ${formatNumber(event.visitors)} návštěvníků</span>
                            ${statusInfo}
                        </div>
                        <div class="event-dates">
                            <small>📅 ${formatDate(event.dateFrom)} - ${formatDate(event.dateTo)}</small>
                        </div>
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-small" onclick="openEventModalFromList('${event.type}', '${event.data.id || event.data.rowIndex}')">
                            ✏️ Detail
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        monthEventsDiv.innerHTML = html;
        
        console.log(`📅 Month events list updated: ${monthEvents.length} events`);
        
    } catch (error) {
        console.error('❌ Error updating month events list:', error);
        monthEventsDiv.innerHTML = `
            <div class="events-placeholder">
                <p style="color: #dc3545;">❌ Chyba při načítání akcí</p>
            </div>
        `;
    }
}

// Helper funkce pro otevření modalu ze seznamu
function openEventModalFromList(eventType, eventId) {
    let event = null;
    
    try {
        if (eventType === 'historical') {
            const record = globalState.historicalData.find(r => r.rowIndex == eventId);
            if (record) {
                event = {
                    id: `historical-${record.rowIndex}`,
                    type: 'historical',
                    title: record.eventName,
                    city: record.city,
                    category: record.category,
                    sales: record.sales,
                    visitors: record.visitors,
                    dateFrom: record.dateFrom,
                    dateTo: record.dateTo,
                    data: record
                };
            }
        } else if (eventType === 'prediction') {
            const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
            const prediction = savedPredictions.find(p => p.id === eventId);
            if (prediction) {
                event = {
                    id: `prediction-${prediction.id}`,
                    type: 'prediction',
                    title: prediction.formData.eventName,
                    city: prediction.formData.city,
                    category: prediction.formData.category,
                    predictedSales: prediction.prediction?.predictedSales,
                    visitors: prediction.formData.visitors,
                    dateFrom: prediction.formData.eventDateFrom,
                    dateTo: prediction.formData.eventDateTo,
                    data: prediction
                };
            }
        } else if (eventType === 'manual') {
            const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
            const manualEvent = manualEvents.find(e => e.id === eventId);
            if (manualEvent) {
                event = {
                    id: `manual-${manualEvent.id}`,
                    type: 'manual',
                    title: manualEvent.eventName,
                    city: manualEvent.city,
                    category: manualEvent.category,
                    sales: manualEvent.sales,
                    visitors: manualEvent.visitors,
                    dateFrom: manualEvent.dateFrom,
                    dateTo: manualEvent.dateTo,
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
        console.error('❌ Error opening event modal from list:', error);
        showNotification('❌ Chyba při otevírání detailu události', 'error');
    }
}

// ========================================
// EXPORT A SPRÁVA DAT
// ========================================

// Export všech dat do CSV
function exportAllData() {
    console.log('📤 Exporting all data...');
    
    try {
        const csvData = [];
        
        // CSV header
        csvData.push([
            'Typ', 'Název akce', 'Město', 'Kategorie', 'Datum od', 'Datum do',
            'Návštěvnost', 'Prodej', 'Konkurence', 'Rating', 'Poznámky',
            'Predikováno', 'Přesnost (%)', 'Status'
        ].join(','));
        
        // Historická data
        if (globalState.historicalData) {
            globalState.historicalData.forEach(record => {
                const row = [
                    'Historická',
                    `"${record.eventName || ''}"`,
                    `"${record.city || ''}"`,
                    `"${record.category || ''}"`,
                    record.dateFrom || '',
                    record.dateTo || '',
                    record.visitors || 0,
                    record.sales || 0,
                    record.competition || '',
                    record.rating || '',
                    `"${record.notes || ''}"`,
                    '',
                    '',
                    'Dokončeno'
                ].join(',');
                csvData.push(row);
            });
        }
        
        // Predikce
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData) {
                const accuracy = prediction.actualSales && prediction.prediction?.predictedSales ?
                    (Math.abs(1 - Math.abs(prediction.prediction.predictedSales - prediction.actualSales) / prediction.actualSales) * 100).toFixed(1) : '';
                
                const row = [
                    'Predikce',
                    `"${prediction.formData.eventName || ''}"`,
                    `"${prediction.formData.city || ''}"`,
                    `"${prediction.formData.category || ''}"`,
                    prediction.formData.eventDateFrom || '',
                    prediction.formData.eventDateTo || '',
                    prediction.formData.visitors || 0,
                    prediction.actualSales || 0,
                    prediction.formData.competition || '',
                    '',
                    `"${prediction.notes || ''}"`,
                    prediction.prediction?.predictedSales || 0,
                    accuracy,
                    prediction.actualSales > 0 ? 'Dokončeno' : 'Plánováno'
                ].join(',');
                csvData.push(row);
            }
        });
        
        // Manuální události
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            const status = new Date(event.dateFrom) <= new Date() ? 'Dokončeno' : 'Plánováno';
            
            const row = [
                'Manuální',
                `"${event.eventName || ''}"`,
                `"${event.city || ''}"`,
                `"${event.category || ''}"`,
                event.dateFrom || '',
                event.dateTo || '',
                event.visitors || 0,
                event.sales || 0,
                '',
                '',
                `"${event.notes || ''}"`,
                '',
                '',
                status
            ].join(',');
            csvData.push(row);
        });
        
        // Stažení CSV
        const csvContent = csvData.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const filename = `donuland_export_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`📄 Data exportována: ${filename}`, 'success');
        console.log('✅ All data exported successfully');
        
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        showNotification('❌ Chyba při exportu dat', 'error');
    }
}

// Vymazání cache
function clearCache() {
    if (!confirm('Opravdu chcete vymazat všechna lokální data a cache?')) {
        return;
    }
    
    try {
        // Vymazání všech cache
        globalState.weatherCache.clear();
        globalState.distanceCache.clear();
        
        // Vymazání localStorage dat (kromě nastavení)
        localStorage.removeItem('donuland_predictions');
        localStorage.removeItem('donuland_manual_events');
        
        // Reset globálního stavu
        globalState.historicalData = [];
        globalState.lastDataLoad = null;
        globalState.lastPrediction = null;
        
        // Refresh UI
        renderCalendar();
        updateCalendarFilters();
        updateAnalytics();
        
        showNotification('🧹 Cache a lokální data vymazána', 'info');
        console.log('🧹 Cache cleared successfully');
        
        eventBus.emit('dataCleared');
        
    } catch (error) {
        console.error('❌ Error clearing cache:', error);
        showNotification('❌ Chyba při mazání cache', 'error');
    }
}

// Test připojení k API
function testConnections() {
    console.log('🔧 Testing API connections...');
    
    const testResults = {
        sheets: false,
        weather: false,
        maps: false
    };
    
    showNotification('🔧 Testuji připojení k API...', 'info', 10000);
    
    // Test Google Sheets
    testGoogleSheets()
        .then(result => {
            testResults.sheets = result;
            console.log('📊 Sheets test:', result ? 'OK' : 'FAILED');
            
            // Test Weather API
            return testWeatherAPI();
        })
        .then(result => {
            testResults.weather = result;
            console.log('🌤️ Weather test:', result ? 'OK' : 'FAILED');
            
            // Test Google Maps API
            return testGoogleMapsAPI();
        })
        .then(result => {
            testResults.maps = result;
            console.log('🗺️ Maps test:', result ? 'OK' : 'FAILED');
            
            // Zobrazení výsledků
            displayTestResults(testResults);
        })
        .catch(error => {
            console.error('❌ Connection test failed:', error);
            showNotification('❌ Test připojení selhal', 'error');
        });
}

// Test Google Sheets připojení
async function testGoogleSheets() {
    try {
        const sheetsUrl = document.getElementById('sheetsUrl')?.value || CONFIG.SHEETS_URL;
        const sheetId = extractSheetId(sheetsUrl);
        
        if (!sheetId) return false;
        
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
        const response = await fetchWithTimeout(csvUrl, {}, 5000);
        
        return response.ok && response.status === 200;
    } catch (error) {
        console.error('Sheets test error:', error);
        return false;
    }
}

// Test Weather API připojení
async function testWeatherAPI() {
    try {
        const apiKey = document.getElementById('weatherKey')?.value || CONFIG.WEATHER_API_KEY;
        
        if (!apiKey || apiKey === 'demo') return false;
        
        const testUrl = `https://api.openweathermap.org/data/2.5/weather?q=Praha,CZ&appid=${apiKey}`;
        const response = await fetchWithTimeout(testUrl, {}, 5000);
        
        return response.ok && response.status === 200;
    } catch (error) {
        console.error('Weather test error:', error);
        return false;
    }
}

// Test Google Maps API připojení
async function testGoogleMapsAPI() {
    try {
        // Test, zda je Google Maps API načteno
        if (!window.google || !window.google.maps) {
            return false;
        }
        
        // Test geocoding služby
        const geocoder = new google.maps.Geocoder();
        
        return new Promise((resolve) => {
            geocoder.geocode({ address: 'Praha, Czech Republic' }, (results, status) => {
                resolve(status === google.maps.GeocoderStatus.OK);
            });
        });
    } catch (error) {
        console.error('Maps test error:', error);
        return false;
    }
}

// Zobrazení výsledků testů
function displayTestResults(results) {
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    let message = `📊 Test připojení dokončen: ${passedTests}/${totalTests} úspěšných\n\n`;
    
    message += `📊 Google Sheets: ${results.sheets ? '✅ OK' : '❌ FAILED'}\n`;
    message += `🌤️ Weather API: ${results.weather ? '✅ OK' : '❌ FAILED'}\n`;
    message += `🗺️ Google Maps: ${results.maps ? '✅ OK' : '❌ FAILED'}`;
    
    const alertType = passedTests === totalTests ? 'success' : 
                     passedTests > 0 ? 'warning' : 'error';
    
    showNotification(message, alertType, 15000);
    
    // Doporučení při selhání
    if (passedTests < totalTests) {
        setTimeout(() => {
            showNotification('💡 Zkontrolujte API klíče v nastavení', 'info', 10000);
        }, 1000);
    }
}

// Resetování nastavení na výchozí
function resetSettings() {
    if (!confirm('Opravdu chcete obnovit všechna nastavení na výchozí hodnoty?')) {
        return;
    }
    
    try {
        // Vymazání uložených nastavení
        localStorage.removeItem('donuland_settings');
        
        // Načtení výchozích nastavení
        const defaultSettings = getDefaultSettings();
        
        // Aktualizace formuláře
        populateSettingsForm(defaultSettings);
        
        // Aktualizace globální konfigurace
        updateGlobalConfig(defaultSettings);
        
        // Uložení výchozích nastavení
        settingsState.currentSettings = defaultSettings;
        settingsState.hasUnsavedChanges = true;
        
        showNotification('🔄 Nastavení obnovena na výchozí hodnoty', 'info');
        console.log('🔄 Settings reset to defaults');
        
        eventBus.emit('settingsReset', defaultSettings);
        
    } catch (error) {
        console.error('❌ Error resetting settings:', error);
        showNotification('❌ Chyba při resetování nastavení', 'error');
    }
}

// Reset faktorů na výchozí
function resetFactors() {
    if (!confirm('Opravdu chcete obnovit všechny AI faktory na výchozí hodnoty?')) {
        return;
    }
    
    try {
        // Kategorie faktory
        setInputValue('factorFood', 0.15);
        setInputValue('factorVeletrh', 0.18);
        setInputValue('factorKoncert', 0.08);
        setInputValue('factorKultura', 0.12);
        setInputValue('factorSport', 0.10);
        setInputValue('factorOstatni', 0.10);
        
        // Městské faktory
        setInputValue('factorPraha', 1.3);
        setInputValue('factorBrno', 1.2);
        setInputValue('factorOstrava', 1.0);
        setInputValue('factorOther', 0.85);
        
        // Aktualizace zobrazení
        updateFactorDisplays();
        
        settingsState.hasUnsavedChanges = true;
        
        showNotification('🧠 AI faktory obnoveny na výchozí hodnoty', 'info');
        console.log('🧠 AI factors reset to defaults');
        
    } catch (error) {
        console.error('❌ Error resetting factors:', error);
        showNotification('❌ Chyba při resetování faktorů', 'error');
    }
}

// Helper funkce pro použití v HTML
function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

// ========================================
// SPRÁVA STATS
// ========================================

// Aktualizace statistik dat
function updateDataStats() {
    const dataCountEl = document.getElementById('dataCount');
    const lastLoadEl = document.getElementById('lastLoad');
    
    if (dataCountEl) {
        const totalRecords = globalState.historicalData?.length || 0;
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]').length;
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]').length;
        
        dataCountEl.textContent = `${totalRecords} hist. + ${savedPredictions} pred. + ${manualEvents} man.`;
    }
    
    if (lastLoadEl && globalState.lastDataLoad) {
        const lastLoadDate = new Date(globalState.lastDataLoad);
        lastLoadEl.textContent = lastLoadDate.toLocaleString('cs-CZ');
    } else if (lastLoadEl) {
        lastLoadEl.textContent = 'Nikdy';
    }
}

// ========================================
// EVENT LISTENERS PRO PART 4B
// ========================================

// Event listener pro aktualizaci dat
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded, updating stats and filters');
    updateDataStats();
    updateCalendarFilters();
});

eventBus.on('dataUpdated', () => {
    console.log('📊 Data updated, refreshing stats');
    updateDataStats();
    updateCalendarFilters();
});

eventBus.on('dataCleared', () => {
    console.log('🧹 Data cleared, resetting stats');
    updateDataStats();
    updateCalendarFilters();
});

// ========================================
// INICIALIZACE PART 4B
// ========================================

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Initializing Part 4B - Modal & Events Management...');
    
    // Aktualizace statistik při startu
    setTimeout(() => {
        updateDataStats();
        updateCalendarFilters();
    }, 1000);
    
    // Event listeners pro změny v input polích (detekce unsaved changes)
    const settingsInputs = document.querySelectorAll('#settings input, #settings select, #settings textarea');
    settingsInputs.forEach(input => {
        input.addEventListener('change', () => {
            settingsState.hasUnsavedChanges = true;
            console.log('⚠️ Unsaved changes detected');
        });
        
        // Speciální handler pro faktory
        if (input.id && input.id.startsWith('factor')) {
            input.addEventListener('input', () => {
                updateFactorDisplays();
            });
        }
    });
    
    // Varování před odchodem s neuloženými změnami
    window.addEventListener('beforeunload', (e) => {
        if (settingsState.hasUnsavedChanges) {
            const message = 'Máte neuložené změny v nastavení. Opravdu chcete opustit stránku?';
            e.returnValue = message;
            return message;
        }
    });
    
    console.log('✅ Part 4B initialized successfully');
});

// ========================================
// POMOCNÉ FUNKCE
// ========================================

// Helper funkce pro extrakci Sheet ID (duplikát z Part 2, ale potřebný zde)
function extractSheetId(url) {
    const patterns = [
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
        /^([a-zA-Z0-9-_]+)$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

// Helper funkce pro timeout fetch (duplikát, ale potřebný)
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Helper funkce pro výchozí nastavení (potřebuje být definována zde pro testy)
function getDefaultSettings() {
    return {
        // API nastavení
        sheetsUrl: CONFIG.SHEETS_URL,
        weatherKey: CONFIG.WEATHER_API_KEY,
        mapsKey: CONFIG.MAPS_API_KEY,
        
        // Business parametry
        donutCost: CONFIG.DONUT_COST,
        franchisePrice: CONFIG.FRANCHISE_PRICE,
        hourlyWage: CONFIG.HOURLY_WAGE,
        workHours: CONFIG.WORK_HOURS,
        fuelCost: CONFIG.FUEL_COST,
        
        // Predikční faktory - kategorie
        factorFood: CONFIG.CATEGORY_FACTORS['food festival'],
        factorVeletrh: CONFIG.CATEGORY_FACTORS['veletrh'],
        factorKoncert: CONFIG.CATEGORY_FACTORS['koncert'],
        factorKultura: CONFIG.CATEGORY_FACTORS['kulturní akce'],
        factorSport: CONFIG.CATEGORY_FACTORS['sportovní'],
        factorOstatni: CONFIG.CATEGORY_FACTORS['ostatní'],
        
        // Predikční faktory - města
        factorPraha: CONFIG.CITY_FACTORS['praha'],
        factorBrno: CONFIG.CITY_FACTORS['brno'],
        factorOstrava: CONFIG.CITY_FACTORS['ostrava'],
        factorOther: CONFIG.CITY_FACTORS['default'],
        
        // Ostatní nastavení
        autoRefresh: true,
        notifications: true,
        debugMode: false,
        language: 'cs'
    };
}

// Helper pro aktualizaci zobrazení faktorů
function updateFactorDisplays() {
    // Kategorie faktory
    updateFactorDisplay('factorFood', 'Food festival');
    updateFactorDisplay('factorVeletrh', 'Veletrh/ČokoFest');
    updateFactorDisplay('factorKoncert', 'Koncert');
    updateFactorDisplay('factorKultura', 'Kulturní akce');
    updateFactorDisplay('factorSport', 'Sportovní akce');
    updateFactorDisplay('factorOstatni', 'Ostatní');
    
    // Městské faktory
    updateFactorDisplay('factorPraha', 'Praha', true);
    updateFactorDisplay('factorBrno', 'Brno', true);
    updateFactorDisplay('factorOstrava', 'Ostrava', true);
    updateFactorDisplay('factorOther', 'Ostatní města', true);
}

function updateFactorDisplay(factorId, label, isMultiplier = false) {
    const input = document.getElementById(factorId);
    const span = input?.parentElement?.querySelector('span');
    
    if (input && span) {
        const value = parseFloat(input.value) || 0;
        if (isMultiplier) {
            span.textContent = `${value.toFixed(1)}×`;
        } else {
            span.textContent = `${(value * 100).toFixed(0)}%`;
        }
    }
}

// Helper pro aktualizaci globální konfigurace (základní verze)
function updateGlobalConfig(settings) {
    console.log('🔧 Updating global configuration (basic)...');
    
    // Aktualizace CONFIG objektu
    CONFIG.SHEETS_URL = settings.sheetsUrl;
    CONFIG.WEATHER_API_KEY = settings.weatherKey;
    CONFIG.MAPS_API_KEY = settings.mapsKey;
    
    CONFIG.DONUT_COST = settings.donutCost;
    CONFIG.FRANCHISE_PRICE = settings.franchisePrice;
    CONFIG.HOURLY_WAGE = settings.hourlyWage;
    CONFIG.WORK_HOURS = settings.workHours;
    CONFIG.FUEL_COST = settings.fuelCost;
    
    console.log('✅ Basic global config updated');
}

// Helper pro populaci formuláře (základní verze)
function populateSettingsForm(settings) {
    console.log('📝 Populating settings form (basic)...');
    
    // Základní populace - rozšířeno v Part 5
    setInputValue('sheetsUrl', settings.sheetsUrl);
    setInputValue('weatherKey', settings.weatherKey);
    setInputValue('mapsKey', settings.mapsKey);
    
    console.log('✅ Basic form populated');
}

// ========================================
// FINALIZACE ČÁST 4B
// ========================================

console.log('✅ Donuland Part 4B loaded successfully');
console.log('📝 Features: ✅ Event Modal ✅ CRUD Operations ✅ Calendar Filters ✅ Month Events List ✅ Data Export ✅ API Testing');
console.log('💾 Storage: ✅ Historical Data ✅ Predictions ✅ Manual Events ✅ Cache Management');
console.log('🔗 Connected to Parts 1,2,3,4A via eventBus and globalState');
console.log('⏳ Ready for Part 4C: Analytics Implementation');

// Event pro signalizaci dokončení části 4B
eventBus.emit('part4bLoaded', { 
    timestamp: Date.now(),
    version: '2.0.0',
    features: [
        'event-modal', 'crud-operations', 'calendar-filters', 'month-events-list', 
        'data-export', 'cache-management', 'api-testing', 'settings-helpers',
        'data-stats', 'unsaved-changes-detection'
    ]
});
/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 4C (COMPLETE)
   Analytics Implementation (Kompletní a opraveno)
   ======================================== */

console.log('🍩 Donuland Part 4C (COMPLETE) loading...');

// ========================================
// ANALÝZY GLOBÁLNÍ STAV
// ========================================

const analyticsState = {
    overallStats: null,
    topEvents: [],
    topCities: [],
    topCategories: [],
    monthlyTrends: [],
    predictionAccuracy: null,
    weatherImpact: null,
    isCalculating: false,
    lastCalculated: null
};

// ========================================
// HLAVNÍ ANALÝZY FUNKCE
// ========================================

// Hlavní funkce pro aktualizaci analýz
function updateAnalytics() {
    if (analyticsState.isCalculating) {
        console.log('⚠️ Analytics already calculating, skipping...');
        return;
    }
    
    console.log('📊 Updating analytics...');
    console.log('📊 Historical data available:', globalState.historicalData?.length || 0);
    
    analyticsState.isCalculating = true;
    
    try {
        if (!globalState.historicalData || globalState.historicalData.length === 0) {
            console.log('📊 No historical data, showing placeholder');
            displayAnalyticsPlaceholder();
            return;
        }
        
        // Zobrazení loading stavu
        displayAnalyticsLoading();
        
        // Výpočet všech analýz
        performanceMonitor.start('analytics');
        
        analyticsState.overallStats = calculateOverallStats();
        analyticsState.topEvents = calculateTopEvents();
        analyticsState.topCities = calculateTopCities();
        analyticsState.topCategories = calculateTopCategories();
        analyticsState.monthlyTrends = calculateMonthlyTrends();
        analyticsState.predictionAccuracy = calculatePredictionAccuracy();
        analyticsState.weatherImpact = calculateWeatherImpact();
        
        console.log('📊 Analytics calculated:', analyticsState.overallStats);
        
        // Zobrazení všech analýz
        displayOverallStats();
        displayTopResults();
        displayMonthlyTrends();
        displayPredictionAccuracy();
        displayWeatherImpact();
        
        analyticsState.lastCalculated = Date.now();
        
        performanceMonitor.end('analytics');
        console.log('✅ Analytics updated successfully');
        
        eventBus.emit('analyticsUpdated', {
            timestamp: analyticsState.lastCalculated,
            stats: analyticsState.overallStats
        });
        
    } catch (error) {
        console.error('❌ Error updating analytics:', error);
        displayAnalyticsError(error.message);
        showNotification('❌ Chyba při výpočtu analýz', 'error');
    } finally {
        analyticsState.isCalculating = false;
    }
}

// ========================================
// VÝPOČTY STATISTIK
// ========================================

// Výpočet celkových statistik
function calculateOverallStats() {
    console.log('📊 Calculating overall stats...');
    
    const validEvents = globalState.historicalData.filter(record => 
        record.sales > 0 && record.visitors > 0 && record.eventName && record.city
    );
    
    console.log('📊 Valid events for stats:', validEvents.length);
    
    if (validEvents.length === 0) {
        return {
            totalEvents: 0,
            totalSales: 0,
            averageSales: 0,
            totalRevenue: 0,
            averageConversion: 0,
            topMonth: null,
            bestCategory: null
        };
    }
    
    const totalSales = validEvents.reduce((sum, record) => sum + record.sales, 0);
    const totalVisitors = validEvents.reduce((sum, record) => sum + (record.visitors || 0), 0);
    const averageSales = Math.round(totalSales / validEvents.length);
    const totalRevenue = totalSales * CONFIG.DONUT_PRICE;
    const averageConversion = totalVisitors > 0 ? ((totalSales / totalVisitors) * 100) : 0;
    
    // Najít nejlepší měsíc
    const monthlyStats = {};
    validEvents.forEach(record => {
        if (record.dateFrom) {
            const date = new Date(record.dateFrom);
            const monthKey = date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { sales: 0, events: 0 };
            }
            monthlyStats[monthKey].sales += record.sales;
            monthlyStats[monthKey].events += 1;
        }
    });
    
    const topMonth = Object.keys(monthlyStats).reduce((best, month) => 
        !best || monthlyStats[month].sales > monthlyStats[best].sales ? month : best
    , null);
    
    // Najít nejlepší kategorii
    const categoryStats = {};
    validEvents.forEach(record => {
        if (record.category) {
            if (!categoryStats[record.category]) {
                categoryStats[record.category] = { sales: 0, events: 0 };
            }
            categoryStats[record.category].sales += record.sales;
            categoryStats[record.category].events += 1;
        }
    });
    
    const bestCategory = Object.keys(categoryStats).reduce((best, category) => 
        !best || categoryStats[category].sales > categoryStats[best].sales ? category : best
    , null);
    
    const result = {
        totalEvents: validEvents.length,
        totalSales: totalSales,
        averageSales: averageSales,
        totalRevenue: totalRevenue,
        averageConversion: averageConversion.toFixed(1),
        topMonth: topMonth,
        bestCategory: bestCategory
    };
    
    console.log('📊 Overall stats calculated:', result);
    return result;
}

// Top události
function calculateTopEvents() {
    const validEvents = globalState.historicalData.filter(record => 
        record.sales > 0 && record.visitors > 0 && record.eventName && record.city
    );
    
    return validEvents
        .map(record => ({
            name: record.eventName,
            city: record.city,
            category: record.category,
            sales: record.sales,
            visitors: record.visitors,
            conversion: ((record.sales / record.visitors) * 100).toFixed(1),
            revenue: record.sales * CONFIG.DONUT_PRICE,
            date: record.dateFrom,
            rating: record.rating || 0
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);
}

// Top města
function calculateTopCities() {
    const cityStats = {};
    
    globalState.historicalData.forEach(record => {
        if (record.sales > 0 && record.city) {
            if (!cityStats[record.city]) {
                cityStats[record.city] = {
                    city: record.city,
                    totalSales: 0,
                    totalEvents: 0,
                    totalVisitors: 0,
                    totalRevenue: 0,
                    categories: new Set()
                };
            }
            
            cityStats[record.city].totalSales += record.sales;
            cityStats[record.city].totalEvents += 1;
            cityStats[record.city].totalVisitors += record.visitors || 0;
            cityStats[record.city].totalRevenue += record.sales * CONFIG.DONUT_PRICE;
            if (record.category) {
                cityStats[record.city].categories.add(record.category);
            }
        }
    });
    
    return Object.values(cityStats)
        .map(city => ({
            ...city,
            averageSales: Math.round(city.totalSales / city.totalEvents),
            averageConversion: city.totalVisitors > 0 ? 
                ((city.totalSales / city.totalVisitors) * 100).toFixed(1) : '0',
            categoriesCount: city.categories.size
        }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10);
}

// Top kategorie
function calculateTopCategories() {
    const categoryStats = {};
    
    globalState.historicalData.forEach(record => {
        if (record.sales > 0 && record.category) {
            if (!categoryStats[record.category]) {
                categoryStats[record.category] = {
                    category: record.category,
                    totalSales: 0,
                    totalEvents: 0,
                    totalVisitors: 0,
                    totalRevenue: 0,
                    cities: new Set()
                };
            }
            
            categoryStats[record.category].totalSales += record.sales;
            categoryStats[record.category].totalEvents += 1;
            categoryStats[record.category].totalVisitors += record.visitors || 0;
            categoryStats[record.category].totalRevenue += record.sales * CONFIG.DONUT_PRICE;
            if (record.city) {
                categoryStats[record.category].cities.add(record.city);
            }
        }
    });
    
    return Object.values(categoryStats)
        .map(category => ({
            ...category,
            averageSales: Math.round(category.totalSales / category.totalEvents),
            averageConversion: category.totalVisitors > 0 ? 
                ((category.totalSales / category.totalVisitors) * 100).toFixed(1) : '0',
            citiesCount: category.cities.size
        }))
        .sort((a, b) => b.totalSales - a.totalSales);
}

// Měsíční trendy
function calculateMonthlyTrends() {
    const monthlyStats = {};
    
    globalState.historicalData.forEach(record => {
        if (record.sales > 0 && record.dateFrom) {
            const date = new Date(record.dateFrom);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {
                    month: monthKey,
                    monthName: date.toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long' }),
                    totalSales: 0,
                    totalEvents: 0,
                    totalVisitors: 0,
                    totalRevenue: 0
                };
            }
            
            monthlyStats[monthKey].totalSales += record.sales;
            monthlyStats[monthKey].totalEvents += 1;
            monthlyStats[monthKey].totalVisitors += record.visitors || 0;
            monthlyStats[monthKey].totalRevenue += record.sales * CONFIG.DONUT_PRICE;
        }
    });
    
    return Object.values(monthlyStats)
        .map(month => ({
            ...month,
            averageSales: Math.round(month.totalSales / month.totalEvents),
            averageConversion: month.totalVisitors > 0 ? 
                ((month.totalSales / month.totalVisitors) * 100).toFixed(1) : '0'
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Posledních 12 měsíců
}

// Přesnost predikcí
function calculatePredictionAccuracy() {
    const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
    const completedPredictions = savedPredictions.filter(pred => 
        pred.actualSales && pred.actualSales > 0 && pred.prediction && pred.prediction.predictedSales
    );
    
    if (completedPredictions.length === 0) {
        return {
            totalPredictions: savedPredictions.length,
            completedPredictions: 0,
            averageAccuracy: 0,
            accuracyRanges: { excellent: 0, good: 0, fair: 0, poor: 0 },
            details: []
        };
    }
    
    const accuracies = completedPredictions.map(pred => {
        const predicted = pred.prediction.predictedSales;
        const actual = pred.actualSales;
        const accuracy = Math.abs(1 - Math.abs(predicted - actual) / actual) * 100;
        return {
            eventName: pred.formData.eventName,
            predicted: predicted,
            actual: actual,
            accuracy: Math.max(0, Math.min(100, accuracy)),
            difference: actual - predicted,
            date: pred.formData.eventDateFrom
        };
    });
    
    const averageAccuracy = accuracies.reduce((sum, acc) => sum + acc.accuracy, 0) / accuracies.length;
    
    // Skupiny přesnosti
    const accuracyRanges = {
        excellent: accuracies.filter(acc => acc.accuracy >= 90).length,
        good: accuracies.filter(acc => acc.accuracy >= 70 && acc.accuracy < 90).length,
        fair: accuracies.filter(acc => acc.accuracy >= 50 && acc.accuracy < 70).length,
        poor: accuracies.filter(acc => acc.accuracy < 50).length
    };
    
    return {
        totalPredictions: savedPredictions.length,
        completedPredictions: completedPredictions.length,
        averageAccuracy: averageAccuracy.toFixed(1),
        accuracyRanges: accuracyRanges,
        details: accuracies.sort((a, b) => b.accuracy - a.accuracy)
    };
}

// Vliv počasí na prodej
function calculateWeatherImpact() {
    const weatherEvents = globalState.historicalData.filter(record => 
        record.sales > 0 && record.weather && record.visitors > 0
    );
    
    if (weatherEvents.length === 0) {
        return {
            totalAnalyzed: 0,
            weatherTypes: [],
            averageImpact: 0,
            recommendations: []
        };
    }
    
    const weatherStats = {};
    
    weatherEvents.forEach(record => {
        const weatherType = normalizeWeatherType(record.weather);
        const conversion = (record.sales / record.visitors) * 100;
        
        if (!weatherStats[weatherType]) {
            weatherStats[weatherType] = {
                type: weatherType,
                events: 0,
                totalSales: 0,
                totalVisitors: 0,
                conversions: []
            };
        }
        
        weatherStats[weatherType].events += 1;
        weatherStats[weatherType].totalSales += record.sales;
        weatherStats[weatherType].totalVisitors += record.visitors;
        weatherStats[weatherType].conversions.push(conversion);
    });
    
    // Výpočet průměrů a porovnání
    const weatherTypes = Object.values(weatherStats).map(weather => ({
        ...weather,
        averageConversion: weather.conversions.reduce((sum, conv) => sum + conv, 0) / weather.conversions.length,
        averageSales: Math.round(weather.totalSales / weather.events)
    }));
    
    // Baseline (průměr všech)
    const overallAverage = weatherTypes.reduce((sum, w) => sum + w.averageConversion, 0) / weatherTypes.length;
    
    weatherTypes.forEach(weather => {
        weather.impact = ((weather.averageConversion - overallAverage) / overallAverage * 100).toFixed(1);
        weather.impactType = weather.averageConversion > overallAverage ? 'positive' : 'negative';
    });
    
    // Doporučení
    const recommendations = generateWeatherRecommendations(weatherTypes);
    
    return {
        totalAnalyzed: weatherEvents.length,
        weatherTypes: weatherTypes.sort((a, b) => b.averageConversion - a.averageConversion),
        averageImpact: overallAverage.toFixed(1),
        recommendations: recommendations
    };
}

// Normalizace typu počasí
function normalizeWeatherType(weather) {
    if (!weather) return 'neznámé';
    
    const weatherLower = weather.toLowerCase();
    
    if (weatherLower.includes('slun') || weatherLower.includes('jasn')) return 'slunečno';
    if (weatherLower.includes('déšť') || weatherLower.includes('dest')) return 'déšť';
    if (weatherLower.includes('oblač') || weatherLower.includes('zatažen')) return 'oblačno';
    if (weatherLower.includes('sníh') || weatherLower.includes('snez')) return 'sníh';
    if (weatherLower.includes('bouř') || weatherLower.includes('bour')) return 'bouřky';
    if (weatherLower.includes('vítr') || weatherLower.includes('vetr')) return 'větrno';
    
    return 'ostatní';
}

// Generování doporučení počasí
function generateWeatherRecommendations(weatherTypes) {
    const recommendations = [];
    
    if (weatherTypes.length === 0) return recommendations;
    
    const bestWeather = weatherTypes[0];
    const worstWeather = weatherTypes[weatherTypes.length - 1];
    
    if (bestWeather) {
        recommendations.push({
            type: 'success',
            title: `Nejlepší počasí: ${bestWeather.type}`,
            text: `Průměrná konverze ${bestWeather.averageConversion.toFixed(1)}% (+${bestWeather.impact}% oproti průměru)`
        });
    }
    
    if (worstWeather && worstWeather !== bestWeather) {
        recommendations.push({
            type: 'warning',
            title: `Nejhorší počasí: ${worstWeather.type}`,
            text: `Průměrná konverze ${worstWeather.averageConversion.toFixed(1)}% (${worstWeather.impact}% oproti průměru)`
        });
    }
    
    // Specifická doporučení
    const rain = weatherTypes.find(w => w.type === 'déšť');
    if (rain && rain.impactType === 'negative') {
        recommendations.push({
            type: 'info',
            title: 'Strategie pro deštivé dny',
            text: 'Připravte krytí pro stánek a marketingové akce pro přilákání zákazníků.'
        });
    }
    
    const sun = weatherTypes.find(w => w.type === 'slunečno');
    if (sun && sun.impactType === 'positive') {
        recommendations.push({
            type: 'success',
            title: 'Využijte slunečné dny',
            text: 'Slunečné počasí je ideální - zvažte navýšení zásob a marketingové aktivity.'
        });
    }
    
    return recommendations;
}

// ========================================
// ZOBRAZENÍ ANALÝZ
// ========================================

// Zobrazení celkových statistik
function displayOverallStats() {
    const overallStatsDiv = document.getElementById('overallStats');
    if (!overallStatsDiv || !analyticsState.overallStats) {
        console.log('⚠️ Overall stats div not found or no stats');
        return;
    }
    
    const stats = analyticsState.overallStats;
    console.log('📊 Displaying overall stats:', stats);
    
    overallStatsDiv.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${formatNumber(stats.totalEvents)}</div>
            <div class="stat-label">Celkem akcí</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${formatNumber(stats.totalSales)}</div>
            <div class="stat-label">Celkem prodáno</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${formatNumber(stats.averageSales)}</div>
            <div class="stat-label">Průměrný prodej</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${formatCurrency(stats.totalRevenue)}</div>
            <div class="stat-label">Celkový obrat</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.averageConversion}%</div>
            <div class="stat-label">Průměrná konverze</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.bestCategory || 'N/A'}</div>
            <div class="stat-label">Nejlepší kategorie</div>
        </div>
    `;
    
    console.log('📊 Overall stats displayed successfully');
}

// Zobrazení top výsledků
function displayTopResults() {
    displayTopEvents();
    displayTopCities();
    displayTopCategories();
}

// Top události
function displayTopEvents() {
    const topEventsDiv = document.getElementById('topEvents');
    if (!topEventsDiv) return;
    
    if (!analyticsState.topEvents || analyticsState.topEvents.length === 0) {
        topEventsDiv.innerHTML = '<div class="analytics-placeholder"><p>📊 Žádné události k analýze</p></div>';
        return;
    }
    
    let html = '';
    analyticsState.topEvents.slice(0, 5).forEach((event, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const dateStr = event.date ? formatDate(event.date) : 'N/A';
        
        html += `
            <div class="top-item">
                <div class="top-info">
                    <h4>${medal} ${escapeHtml(event.name)}</h4>
                    <p>${escapeHtml(event.city)} • ${escapeHtml(event.category)} • ${dateStr}</p>
                    ${event.rating > 0 ? `<div class="event-rating">${'⭐'.repeat(Math.round(event.rating))} (${event.rating}/5)</div>` : ''}
                </div>
                <div class="top-stats">
                    <div class="top-value">${formatNumber(event.sales)} ks</div>
                    <div class="top-subvalue">${event.conversion}% konverze</div>
                    <div class="top-subvalue">${formatCurrency(event.revenue)}</div>
                </div>
            </div>
        `;
    });
    
    topEventsDiv.innerHTML = html;
    console.log('🏆 Top events displayed:', analyticsState.topEvents.length);
}

// Top města
function displayTopCities() {
    const topCitiesDiv = document.getElementById('topCities');
    if (!topCitiesDiv || !analyticsState.topCities.length) {
        if (topCitiesDiv) {
            topCitiesDiv.innerHTML = '<div class="analytics-placeholder"><p>🏙️ Žádná města k analýze</p></div>';
        }
        return;
    }
    
    let html = '';
    analyticsState.topCities.slice(0, 5).forEach((city, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        html += `
            <div class="top-item">
                <div class="top-info">
                    <h4>${medal} ${escapeHtml(city.city)}</h4>
                    <p>${city.totalEvents} akcí • ${city.categoriesCount} kategorií</p>
                </div>
                <div class="top-stats">
                    <div class="top-value">${formatNumber(city.totalSales)} ks</div>
                    <div class="top-subvalue">⌀ ${city.averageSales} ks/akci</div>
                    <div class="top-subvalue">${city.averageConversion}% konverze</div>
                </div>
            </div>
        `;
    });
    
    topCitiesDiv.innerHTML = html;
}

// Top kategorie
function displayTopCategories() {
    const topCategoriesDiv = document.getElementById('topCategories');
    if (!topCategoriesDiv || !analyticsState.topCategories.length) {
        if (topCategoriesDiv) {
            topCategoriesDiv.innerHTML = '<div class="analytics-placeholder"><p>📊 Žádné kategorie k analýze</p></div>';
        }
        return;
    }
    
    let html = '';
    analyticsState.topCategories.forEach((category, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        html += `
            <div class="top-item">
                <div class="top-info">
                    <h4>${medal} ${escapeHtml(category.category)}</h4>
                    <p>${category.totalEvents} akcí • ${category.citiesCount} měst</p>
                </div>
                <div class="top-stats">
                    <div class="top-value">${formatNumber(category.totalSales)} ks</div>
                    <div class="top-subvalue">⌀ ${category.averageSales} ks/akci</div>
                    <div class="top-subvalue">${category.averageConversion}% konverze</div>
                </div>
            </div>
        `;
    });
    
    topCategoriesDiv.innerHTML = html;
}

// Zobrazení měsíčních trendů
function displayMonthlyTrends() {
    const monthlyTrendsDiv = document.getElementById('monthlyTrends');
    if (!monthlyTrendsDiv || !analyticsState.monthlyTrends.length) {
        if (monthlyTrendsDiv) {
            monthlyTrendsDiv.innerHTML = '<div class="chart-placeholder"><p>📈 Nedostatek dat pro trendy</p></div>';
        }
        return;
    }
    
    // Jednoduchý grafický displej (bez knihoven)
    const trends = analyticsState.monthlyTrends;
    const maxSales = Math.max(...trends.map(t => t.totalSales));
    
    let html = `
        <div class="trends-chart">
            <h4 style="margin-bottom: 20px;">📈 Vývoj prodejů podle měsíců</h4>
            <div class="trends-bars">
    `;
    
    trends.forEach(trend => {
        const heightPercent = (trend.totalSales / maxSales) * 100;
        const barColor = trend.totalSales > trend.averageSales ? '#28a745' : '#6c757d';
        
        html += `
            <div class="trend-bar-container">
                <div class="trend-bar" style="height: ${heightPercent}%; background: ${barColor};" 
                     title="${trend.monthName}: ${formatNumber(trend.totalSales)} ks">
                </div>
                <div class="trend-label">${trend.monthName.split(' ')[0]}</div>
                <div class="trend-value">${formatNumber(trend.totalSales)}</div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="trends-summary" style="margin-top: 20px;">
                <p><strong>Celkem za období:</strong> ${formatNumber(trends.reduce((sum, t) => sum + t.totalSales, 0))} ks</p>
                <p><strong>Nejlepší měsíc:</strong> ${trends.reduce((best, t) => t.totalSales > best.totalSales ? t : best).monthName}</p>
            </div>
        </div>
    `;
    
    monthlyTrendsDiv.innerHTML = html;
}

// Zobrazení přesnosti predikcí
function displayPredictionAccuracy() {
    const accuracyDiv = document.getElementById('predictionAccuracy');
    if (!accuracyDiv || !analyticsState.predictionAccuracy) return;
    
    const accuracy = analyticsState.predictionAccuracy;
    
    if (accuracy.completedPredictions === 0) {
        accuracyDiv.innerHTML = `
            <div class="accuracy-placeholder">
                <p>🎯 Zatím žádné dokončené predikce</p>
                <p><small>Pro analýzu přesnosti potřebujeme alespoň jednu dokončenou predikci s reálnými výsledky.</small></p>
            </div>
        `;
        return;
    }
    
    const accuracyColor = accuracy.averageAccuracy > 80 ? '#28a745' : 
                         accuracy.averageAccuracy > 60 ? '#ffc107' : '#dc3545';
    
    let html = `
        <div class="accuracy-overview">
            <div class="accuracy-main">
                <div class="accuracy-circle" style="border-color: ${accuracyColor};">
                    <span style="color: ${accuracyColor};">${accuracy.averageAccuracy}%</span>
                </div>
                <h4>Průměrná přesnost</h4>
                <p>${accuracy.completedPredictions} z ${accuracy.totalPredictions} predikcí dokončeno</p>
            </div>
            
            <div class="accuracy-breakdown">
                <div class="accuracy-range excellent">
                    <span class="range-label">Výborná (90%+)</span>
                    <span class="range-count">${accuracy.accuracyRanges.excellent}</span>
                </div>
                <div class="accuracy-range good">
                    <span class="range-label">Dobrá (70-89%)</span>
                    <span class="range-count">${accuracy.accuracyRanges.good}</span>
                </div>
                <div class="accuracy-range fair">
                    <span class="range-label">Průměrná (50-69%)</span>
                    <span class="range-count">${accuracy.accuracyRanges.fair}</span>
                </div>
                <div class="accuracy-range poor">
                    <span class="range-label">Slabá (<50%)</span>
                    <span class="range-count">${accuracy.accuracyRanges.poor}</span>
                </div>
            </div>
        </div>
    `;
    
    // Detaily nejlepších predikcí
    if (accuracy.details.length > 0) {
        html += `
            <div class="accuracy-details">
                <h5>🎯 Nejpřesnější predikce:</h5>
                <div class="accuracy-list">
        `;
        
        accuracy.details.slice(0, 5).forEach(detail => {
            const accuracyClass = detail.accuracy >= 90 ? 'excellent' : 
                                 detail.accuracy >= 70 ? 'good' : 
                                 detail.accuracy >= 50 ? 'fair' : 'poor';
            
            html += `
                <div class="accuracy-item ${accuracyClass}">
                    <div class="accuracy-info">
                        <h6>${escapeHtml(detail.eventName)}</h6>
                        <p>${formatDate(detail.date)}</p>
                    </div>
                    <div class="accuracy-numbers">
                        <div class="accuracy-percent">${detail.accuracy.toFixed(0)}%</div>
                        <div class="accuracy-comparison">
                            🔮 ${formatNumber(detail.predicted)} → 🍩 ${formatNumber(detail.actual)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    accuracyDiv.innerHTML = html;
}

// Zobrazení vlivu počasí
function displayWeatherImpact() {
    const weatherDiv = document.getElementById('weatherImpact');
    if (!weatherDiv || !analyticsState.weatherImpact) return;
    
    const weather = analyticsState.weatherImpact;
    
    if (weather.totalAnalyzed === 0) {
        weatherDiv.innerHTML = `
            <div class="weather-impact-placeholder">
                <p>🌤️ Nedostatek dat o počasí</p>
                <p><small>Pro analýzu vlivu počasí potřebujeme alespoň několik akcí s údaji o počasí.</small></p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="weather-impact-overview">
            <div class="weather-summary">
                <h4>🌤️ Analýza vlivu počasí na prodej</h4>
                <p>Analyzováno <strong>${weather.totalAnalyzed} akcí</strong> s údaji o počasí</p>
                <p>Průměrná konverze: <strong>${weather.averageImpact}%</strong></p>
            </div>
            
            <div class="weather-types-grid">
    `;
    
    weather.weatherTypes.forEach(type => {
        const impactIcon = type.impactType === 'positive' ? '📈' : '📉';
        const impactClass = type.impactType === 'positive' ? 'positive-impact' : 'negative-impact';
        const impactColor = type.impactType === 'positive' ? '#28a745' : '#dc3545';
        
        html += `
            <div class="weather-type-item ${impactClass}">
                <div class="weather-type-header">
                    <h5>${getWeatherIcon(type.type)} ${type.type}</h5>
                    <span class="weather-impact-badge" style="color: ${impactColor};">
                        ${impactIcon} ${type.impact}%
                    </span>
                </div>
                <div class="weather-type-stats">
                    <div class="weather-stat">
                        <span class="stat-label">Akcí:</span>
                        <span class="stat-value">${type.events}</span>
                    </div>
                    <div class="weather-stat">
                        <span class="stat-label">Konverze:</span>
                        <span class="stat-value">${type.averageConversion.toFixed(1)}%</span>
                    </div>
                    <div class="weather-stat">
                        <span class="stat-label">Průměr prodej:</span>
                        <span class="stat-value">${formatNumber(type.averageSales)} ks</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Doporučení
    if (weather.recommendations.length > 0) {
        html += `
            <div class="weather-recommendations">
                <h5>💡 Doporučení pro různé počasí:</h5>
                <div class="recommendations-list">
        `;
        
        weather.recommendations.forEach(rec => {
            const recClass = rec.type === 'success' ? 'success' : 
                           rec.type === 'warning' ? 'warning' : 'info';
            
            html += `
                <div class="recommendation-item ${recClass}">
                    <h6>${rec.title}</h6>
                    <p>${rec.text}</p>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    html += '</div>';
    weatherDiv.innerHTML = html;
}

// Helper funkce pro weather ikony
function getWeatherIcon(weatherType) {
    const icons = {
        'slunečno': '☀️',
        'oblačno': '☁️',
        'déšť': '🌧️',
        'sníh': '❄️',
        'bouřky': '⛈️',
        'větrno': '💨',
        'ostatní': '🌤️',
        'neznámé': '❓'
    };
    return icons[weatherType] || '🌤️';
}

// ========================================
// LOADING A PLACEHOLDER STAVY
// ========================================

// Zobrazení loading stavu pro analýzy
function displayAnalyticsLoading() {
    const sections = ['overallStats', 'topEvents', 'topCities', 'topCategories', 'monthlyTrends', 'predictionAccuracy', 'weatherImpact'];
    
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.innerHTML = `
                <div class="analytics-loading">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <p>Počítám analýzy...</p>
                </div>
            `;
        }
    });
}

// Zobrazení placeholder pro analýzy
function displayAnalyticsPlaceholder() {
    const overallStatsDiv = document.getElementById('overallStats');
    if (overallStatsDiv) {
        overallStatsDiv.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">-</div>
                <div class="stat-label">Celkem akcí</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">-</div>
                <div class="stat-label">Celkem prodejů</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">-</div>
                <div class="stat-label">Průměrný prodej</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">-</div>
                <div class="stat-label">Celkový obrat</div>
            </div>
        `;
    }
    
    const sections = [
        { id: 'topEvents', text: '📊 Načtěte historická data pro analýzu nejúspěšnějších akcí' },
        { id: 'topCities', text: '🏙️ Načtěte historická data pro analýzu nejlepších měst' },
        { id: 'topCategories', text: '📊 Načtěte historická data pro analýzu kategorií' },
        { id: 'monthlyTrends', text: '📈 Nedostatek dat pro zobrazení trendů' },
        { id: 'predictionAccuracy', text: '🎯 Zatím žádné dokončené predikce k analýze' },
        { id: 'weatherImpact', text: '🌤️ Nedostatek dat o počasí pro analýzu' }
    ];
    
    sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
            element.innerHTML = `
                <div class="analytics-placeholder">
                    <p>${section.text}</p>
                </div>
            `;
        }
    });
}

// Zobrazení chyby analýz
function displayAnalyticsError(errorMessage) {
    const sections = ['overallStats', 'topEvents', 'topCities', 'topCategories', 'monthlyTrends', 'predictionAccuracy', 'weatherImpact'];
    
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.innerHTML = `
                <div class="analytics-error">
                    <p>❌ Chyba při výpočtu: ${escapeHtml(errorMessage)}</p>
                    <button class="btn" onclick="updateAnalytics()">🔄 Zkusit znovu</button>
                </div>
            `;
        }
    });
}

// ========================================
// CSS STYLY PRO ANALÝZY
// ========================================

// Přidání CSS stylů pro analýzy
function addAnalyticsStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Analytics Loading */
        .analytics-loading {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
        }
        
        .analytics-loading .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        /* Trends Chart */
        .trends-chart {
            padding: 20px;
        }
        
        .trends-bars {
            display: flex;
            justify-content: space-between;
            align-items: end;
            height: 200px;
            gap: 10px;
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(to top, #f8f9fa 0%, #f8f9fa 100%);
            border-radius: 8px;
            position: relative;
        }
        
        .trends-bars::before {
            content: '';
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            height: 1px;
            background: #dee2e6;
        }
        
        .trend-bar-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            max-width: 60px;
        }
        
        .trend-bar {
            width: 100%;
            min-height: 5px;
            background: #667eea;
            border-radius: 4px 4px 0 0;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .trend-bar:hover {
            opacity: 0.8;
            transform: scaleY(1.05);
        }
        
        .trend-label {
            font-size: 0.75rem;
            color: #6c757d;
            margin-top: 8px;
            text-align: center;
            transform: rotate(-45deg);
            white-space: nowrap;
        }
        
        .trend-value {
            font-size: 0.7rem;
            color: #495057;
            font-weight: 600;
            margin-top: 5px;
        }
        
        .trends-summary {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        
        /* Prediction Accuracy */
        .accuracy-overview {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 30px;
            margin-bottom: 25px;
        }
        
        .accuracy-main {
            text-align: center;
        }
        
        .accuracy-circle {
            width: 120px;
            height: 120px;
            border: 8px solid #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            position: relative;
        }
        
        .accuracy-circle span {
            font-size: 2rem;
            font-weight: 700;
        }
        
        .accuracy-breakdown {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
        }
        
        .accuracy-range {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        
        .accuracy-range.excellent {
            background: #d4edda;
            color: #155724;
        }
        
        .accuracy-range.good {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .accuracy-range.fair {
            background: #fff3cd;
            color: #856404;
        }
        
        .accuracy-range.poor {
            background: #f8d7da;
            color: #721c24;
        }
        
        .range-count {
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .accuracy-details {
            margin-top: 20px;
        }
        
        .accuracy-list {
            display: grid;
            gap: 10px;
        }
        
        .accuracy-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .accuracy-item.excellent {
            background: #d4edda;
            border-left-color: #28a745;
        }
        
        .accuracy-item.good {
            background: #d1ecf1;
            border-left-color: #17a2b8;
        }
        
        .accuracy-item.fair {
            background: #fff3cd;
            border-left-color: #ffc107;
        }
        
        .accuracy-item.poor {
            background: #f8d7da;
            border-left-color: #dc3545;
        }
        
        .accuracy-info h6 {
            margin: 0 0 5px;
            font-size: 0.9rem;
            color: #495057;
        }
        
        .accuracy-info p {
            margin: 0;
            font-size: 0.8rem;
            color: #6c757d;
        }
        
        .accuracy-numbers {
            text-align: right;
        }
        
        .accuracy-percent {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .accuracy-comparison {
            font-size: 0.8rem;
            color: #6c757d;
        }
        
        /* Weather Impact */
        .weather-impact-overview {
            padding: 20px;
        }
        
        .weather-summary {
            text-align: center;
            margin-bottom: 25px;
            padding: 20px;
            background: linear-gradient(135deg, #e3f2fd, #f0f9ff);
            border-radius: 10px;
        }
        
        .weather-types-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .weather-type-item {
            background: white;
            border-radius: 10px;
            padding: 20px;
            border-left: 4px solid #667eea;
            transition: all 0.3s ease;
        }
        
        .weather-type-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .weather-type-item.positive-impact {
            border-left-color: #28a745;
            background: linear-gradient(135deg, #d4edda, #ffffff);
        }
        
        .weather-type-item.negative-impact {
            border-left-color: #dc3545;
            background: linear-gradient(135deg, #f8d7da, #ffffff);
        }
        
        .weather-type-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .weather-type-header h5 {
            margin: 0;
            font-size: 1.1rem;
            color: #495057;
        }
        
        .weather-impact-badge {
            font-weight: 700;
            font-size: 0.9rem;
        }
        
        .weather-type-stats {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
        }
        
        .weather-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9rem;
        }
        
        .weather-stat .stat-label {
            color: #6c757d;
        }
        
        .weather-stat .stat-value {
            font-weight: 600;
            color: #495057;
        }
        
        .weather-recommendations {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
        }
        
        .recommendations-list {
            display: grid;
            gap: 15px;
            margin-top: 15px;
        }
        
        .recommendation-item {
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #17a2b8;
        }
        
        .recommendation-item.success {
            background: #d4edda;
            border-left-color: #28a745;
        }
        
        .recommendation-item.warning {
            background: #fff3cd;
            border-left-color: #ffc107;
        }
        
        .recommendation-item.info {
            background: #d1ecf1;
            border-left-color: #17a2b8;
        }
        
        .recommendation-item h6 {
            margin: 0 0 8px;
            font-size: 0.95rem;
            color: #495057;
        }
        
        .recommendation-item p {
            margin: 0;
            font-size: 0.85rem;
            color: #6c757d;
            line-height: 1.4;
        }
        
        /* Event Rating */
        .event-rating {
            margin-top: 5px;
            font-size: 0.8rem;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .accuracy-overview {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .weather-types-grid {
                grid-template-columns: 1fr;
            }
            
            .trends-bars {
                height: 150px;
                gap: 5px;
            }
            
            .trend-label {
                font-size: 0.6rem;
            }
            
            .accuracy-circle {
                width: 100px;
                height: 100px;
            }
            
            .accuracy-circle span {
                font-size: 1.5rem;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ========================================
// EVENT LISTENERS PRO ANALÝZY
// ========================================

// Event listener pro požadavek na analýzy
eventBus.on('analyticsRequested', () => {
    console.log('📊 Analytics section requested');
    setTimeout(() => {
        updateAnalytics();
    }, 100);
});

// Event listener pro aktualizaci dat
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded, updating analytics');
    setTimeout(() => {
        updateAnalytics();
    }, 500);
});

eventBus.on('dataUpdated', () => {
    console.log('📊 Data updated, refreshing analytics');
    setTimeout(() => {
        updateAnalytics();
    }, 100);
});

// Event listener pro uložení predikce
eventBus.on('predictionSaved', () => {
    console.log('📊 Prediction saved, updating accuracy analytics');
    // Aktualizovat pouze sekci přesnosti predikcí
    if (analyticsState.lastCalculated) {
        analyticsState.predictionAccuracy = calculatePredictionAccuracy();
        displayPredictionAccuracy();
    }
});

// Event listener pro resize analýz
eventBus.on('analyticsResizeRequested', () => {
    console.log('📊 Analytics resize requested');
    // Zde by se mohly přepočítat velikosti grafů
    setTimeout(() => {
        if (analyticsState.lastCalculated) {
            displayMonthlyTrends();
        }
    }, 100);
});

// ========================================
// EXPORT ANALÝZ
// ========================================

// Export analýz do CSV
function exportAnalytics() {
    console.log('📤 Exporting analytics...');
    
    if (!analyticsState.overallStats) {
        showNotification('❌ Žádné analýzy k exportu. Načtěte nejprve data.', 'error');
        return;
    }
    
    try {
        const csvData = [];
        
        // Header
        csvData.push('Donuland Analytics Export');
        csvData.push(`Export Date: ${new Date().toLocaleString('cs-CZ')}`);
        csvData.push('');
        
        // Overall Stats
        csvData.push('=== CELKOVÉ STATISTIKY ===');
        csvData.push(`Celkem akcí,${analyticsState.overallStats.totalEvents}`);
        csvData.push(`Celkem prodáno,${analyticsState.overallStats.totalSales}`);
        csvData.push(`Průměrný prodej,${analyticsState.overallStats.averageSales}`);
        csvData.push(`Celkový obrat,${analyticsState.overallStats.totalRevenue}`);
        csvData.push(`Průměrná konverze,${analyticsState.overallStats.averageConversion}%`);
        csvData.push(`Nejlepší kategorie,${analyticsState.overallStats.bestCategory || 'N/A'}`);
        csvData.push('');
        
        // Top Events
        if (analyticsState.topEvents.length > 0) {
            csvData.push('=== TOP UDÁLOSTI ===');
            csvData.push('Pořadí,Název,Město,Kategorie,Prodej,Konverze,Obrat,Datum');
            analyticsState.topEvents.forEach((event, index) => {
                csvData.push(`${index + 1},"${event.name}","${event.city}","${event.category}",${event.sales},${event.conversion}%,${event.revenue},"${formatDate(event.date)}"`);
            });
            csvData.push('');
        }
        
        // Top Cities
        if (analyticsState.topCities.length > 0) {
            csvData.push('=== TOP MĚSTA ===');
            csvData.push('Pořadí,Město,Celkem prodej,Počet akcí,Průměrný prodej,Konverze');
            analyticsState.topCities.forEach((city, index) => {
                csvData.push(`${index + 1},"${city.city}",${city.totalSales},${city.totalEvents},${city.averageSales},${city.averageConversion}%`);
            });
            csvData.push('');
        }
        
        // Monthly Trends
        if (analyticsState.monthlyTrends.length > 0) {
            csvData.push('=== MĚSÍČNÍ TRENDY ===');
            csvData.push('Měsíc,Prodej,Počet akcí,Průměrný prodej,Konverze');
            analyticsState.monthlyTrends.forEach(trend => {
                csvData.push(`"${trend.monthName}",${trend.totalSales},${trend.totalEvents},${trend.averageSales},${trend.averageConversion}%`);
            });
            csvData.push('');
        }
        
        // Prediction Accuracy
        if (analyticsState.predictionAccuracy && analyticsState.predictionAccuracy.completedPredictions > 0) {
            csvData.push('=== PŘESNOST PREDIKCÍ ===');
            csvData.push(`Průměrná přesnost,${analyticsState.predictionAccuracy.averageAccuracy}%`);
            csvData.push(`Dokončené predikce,${analyticsState.predictionAccuracy.completedPredictions}`);
            csvData.push(`Celkem predikcí,${analyticsState.predictionAccuracy.totalPredictions}`);
            csvData.push('');
            
            if (analyticsState.predictionAccuracy.details.length > 0) {
                csvData.push('Událost,Datum,Predikováno,Skutečnost,Přesnost');
                analyticsState.predictionAccuracy.details.forEach(detail => {
                    csvData.push(`"${detail.eventName}","${formatDate(detail.date)}",${detail.predicted},${detail.actual},${detail.accuracy.toFixed(1)}%`);
                });
                csvData.push('');
            }
        }
        
        // Weather Impact
        if (analyticsState.weatherImpact && analyticsState.weatherImpact.totalAnalyzed > 0) {
            csvData.push('=== VLIV POČASÍ ===');
            csvData.push(`Analyzované akce,${analyticsState.weatherImpact.totalAnalyzed}`);
            csvData.push(`Průměrná konverze,${analyticsState.weatherImpact.averageImpact}%`);
            csvData.push('');
            
            csvData.push('Typ počasí,Počet akcí,Průměrná konverze,Vliv,Průměrný prodej');
            analyticsState.weatherImpact.weatherTypes.forEach(weather => {
                csvData.push(`"${weather.type}",${weather.events},${weather.averageConversion.toFixed(1)}%,${weather.impact}%,${weather.averageSales}`);
            });
        }
        
        // Download CSV
        const csvContent = csvData.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const filename = `donuland_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`📊 Analýzy exportovány: ${filename}`, 'success');
        console.log('✅ Analytics exported successfully');
        
    } catch (error) {
        console.error('❌ Error exporting analytics:', error);
        showNotification('❌ Chyba při exportu analýz', 'error');
    }
}

// Funkce dostupná globálně pro použití v HTML
window.exportAnalytics = exportAnalytics;

// ========================================
// INICIALIZACE PART 4C
// ========================================

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing Part 4C - Analytics Implementation...');
    
    // Přidání CSS stylů
    addAnalyticsStyles();
    
    // Zobrazení placeholder na začátku
    setTimeout(() => {
        displayAnalyticsPlaceholder();
    }, 100);
    
    // Přidání export tlačítka do analytics sekce (pokud neexistuje)
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection) {
        const existingButton = analyticsSection.querySelector('.export-analytics-btn');
        if (!existingButton) {
            const sectionHeader = analyticsSection.querySelector('.section-header');
            if (sectionHeader) {
                const exportButton = document.createElement('button');
                exportButton.className = 'btn btn-export export-analytics-btn';
                exportButton.onclick = exportAnalytics;
                exportButton.innerHTML = '📤 Export analýz';
                exportButton.style.marginTop = '15px';
                sectionHeader.appendChild(exportButton);
            }
        }
    }
    
    console.log('✅ Part 4C initialized successfully');
});

// ========================================
// FINALIZACE ČÁST 4C
// ========================================

console.log('✅ Donuland Part 4C (COMPLETE) loaded successfully');
console.log('📊 Features: ✅ Overall Stats ✅ Top Rankings ✅ Monthly Trends ✅ Prediction Accuracy ✅ Weather Impact Analysis');
console.log('📈 Charts: ✅ Trend Bars ✅ Accuracy Circle ✅ Weather Grid ✅ Performance Metrics');
console.log('📤 Export: ✅ Complete Analytics CSV Export ✅ All Data Sections');
console.log('🎨 Styling: ✅ Responsive Design ✅ Loading States ✅ Error Handling');
console.log('🔗 Integration: ✅ Connected to Parts 1,2,3,4A,4B via eventBus');
console.log('⏳ System Complete: All 4 parts loaded and integrated');

// Event pro signalizaci dokončení části 4C
eventBus.emit('part4cLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: [
        'overall-statistics', 'top-rankings', 'monthly-trends', 'prediction-accuracy-analysis',
        'weather-impact-analysis', 'analytics-export', 'responsive-charts', 'loading-states',
        'error-handling', 'real-time-updates', 'performance-monitoring'
    ]
});

// ========================================
// ADDITIONAL HELPER FUNCTIONS
// ========================================

// Funkce pro aktualizaci konkrétní sekce analýz
function updateAnalyticsSection(sectionName) {
    console.log(`📊 Updating specific analytics section: ${sectionName}`);
    
    try {
        switch (sectionName) {
            case 'overall':
                analyticsState.overallStats = calculateOverallStats();
                displayOverallStats();
                break;
                
            case 'top':
                analyticsState.topEvents = calculateTopEvents();
                analyticsState.topCities = calculateTopCities();
                analyticsState.topCategories = calculateTopCategories();
                displayTopResults();
                break;
                
            case 'trends':
                analyticsState.monthlyTrends = calculateMonthlyTrends();
                displayMonthlyTrends();
                break;
                
            case 'accuracy':
                analyticsState.predictionAccuracy = calculatePredictionAccuracy();
                displayPredictionAccuracy();
                break;
                
            case 'weather':
                analyticsState.weatherImpact = calculateWeatherImpact();
                displayWeatherImpact();
                break;
                
            default:
                console.warn(`Unknown analytics section: ${sectionName}`);
        }
        
        console.log(`✅ Analytics section ${sectionName} updated successfully`);
        
    } catch (error) {
        console.error(`❌ Error updating analytics section ${sectionName}:`, error);
        showNotification(`❌ Chyba při aktualizaci sekce ${sectionName}`, 'error');
    }
}

// Funkce pro získání analytics dat pro API nebo další použití
function getAnalyticsData() {
    return {
        overall: analyticsState.overallStats,
        topEvents: analyticsState.topEvents,
        topCities: analyticsState.topCities,
        topCategories: analyticsState.topCategories,
        monthlyTrends: analyticsState.monthlyTrends,
        predictionAccuracy: analyticsState.predictionAccuracy,
        weatherImpact: analyticsState.weatherImpact,
        lastCalculated: analyticsState.lastCalculated,
        metadata: {
            version: '1.0.0',
            algorithm: 'v2.1-chocolate',
            timestamp: new Date().toISOString(),
            dataPoints: globalState.historicalData?.length || 0
        }
    };
}

// Funkce pro import analytics dat
function importAnalyticsData(data) {
    try {
        if (data && typeof data === 'object') {
            analyticsState.overallStats = data.overall || null;
            analyticsState.topEvents = data.topEvents || [];
            analyticsState.topCities = data.topCities || [];
            analyticsState.topCategories = data.topCategories || [];
            analyticsState.monthlyTrends = data.monthlyTrends || [];
            analyticsState.predictionAccuracy = data.predictionAccuracy || null;
            analyticsState.weatherImpact = data.weatherImpact || null;
            analyticsState.lastCalculated = data.lastCalculated || null;
            
            // Zobrazit importovaná data
            displayOverallStats();
            displayTopResults();
            displayMonthlyTrends();
            displayPredictionAccuracy();
            displayWeatherImpact();
            
            showNotification('✅ Analytics data importována', 'success');
            console.log('✅ Analytics data imported successfully');
            
            eventBus.emit('analyticsImported', data);
        }
    } catch (error) {
        console.error('❌ Error importing analytics data:', error);
        showNotification('❌ Chyba při importu analytics dat', 'error');
    }
}

// Funkce pro reset analytics
function resetAnalytics() {
    console.log('🔄 Resetting analytics...');
    
    analyticsState.overallStats = null;
    analyticsState.topEvents = [];
    analyticsState.topCities = [];
    analyticsState.topCategories = [];
    analyticsState.monthlyTrends = [];
    analyticsState.predictionAccuracy = null;
    analyticsState.weatherImpact = null;
    analyticsState.lastCalculated = null;
    
    displayAnalyticsPlaceholder();
    
    showNotification('🔄 Analytics resetovány', 'info');
    console.log('✅ Analytics reset completed');
    
    eventBus.emit('analyticsReset');
}

// Funkce pro validaci analytics dat
function validateAnalyticsData() {
    const issues = [];
    
    // Kontrola historických dat
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        issues.push('Žádná historická data pro analýzu');
    } else {
        const validRecords = globalState.historicalData.filter(record => 
            record.sales > 0 && record.visitors > 0 && record.eventName && record.city
        );
        
        if (validRecords.length < 3) {
            issues.push('Nedostatek validních záznamů pro spolehlivou analýzu (minimum 3)');
        }
        
        if (validRecords.length < globalState.historicalData.length * 0.5) {
            issues.push('Více než 50% záznamů má neúplná nebo nevalidní data');
        }
    }
    
    // Kontrola predikcí
    const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
    const completedPredictions = savedPredictions.filter(pred => 
        pred.actualSales && pred.actualSales > 0
    );
    
    if (savedPredictions.length === 0) {
        issues.push('Žádné uložené predikce pro analýzu přesnosti');
    } else if (completedPredictions.length === 0) {
        issues.push('Žádné dokončené predikce s reálnými výsledky');
    }
    
    // Kontrola weather dat
    const weatherRecords = globalState.historicalData?.filter(record => 
        record.weather && record.sales > 0
    ) || [];
    
    if (weatherRecords.length < 5) {
        issues.push('Nedostatek záznamů s údaji o počasí pro weather analýzu');
    }
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        summary: {
            totalRecords: globalState.historicalData?.length || 0,
            validRecords: globalState.historicalData?.filter(r => r.sales > 0 && r.visitors > 0).length || 0,
            savedPredictions: savedPredictions.length,
            completedPredictions: completedPredictions.length,
            weatherRecords: weatherRecords.length
        }
    };
}

// Funkce pro zobrazení validation reportu
function displayValidationReport() {
    const validation = validateAnalyticsData();
    
    let message = `📊 Analytics Data Validation Report\n\n`;
    message += `Celkem záznamů: ${validation.summary.totalRecords}\n`;
    message += `Validní záznamy: ${validation.summary.validRecords}\n`;
    message += `Uložené predikce: ${validation.summary.savedPredictions}\n`;
    message += `Dokončené predikce: ${validation.summary.completedPredictions}\n`;
    message += `Záznamy s počasím: ${validation.summary.weatherRecords}\n\n`;
    
    if (validation.isValid) {
        message += '✅ Data jsou připravena pro analýzu';
        showNotification(message, 'success', 8000);
    } else {
        message += '⚠️ Nalezené problémy:\n';
        validation.issues.forEach(issue => {
            message += `• ${issue}\n`;
        });
        showNotification(message, 'warning', 10000);
    }
    
    console.log('📊 Validation report:', validation);
    return validation;
}

// ========================================
// PERFORMANCE MONITORING PRO ANALÝZY
// ========================================

// Enhanced performance monitoring
const analyticsPerformanceMonitor = {
    metrics: new Map(),
    
    startOperation(operationName) {
        this.metrics.set(operationName, {
            startTime: performance.now(),
            memoryStart: performance.memory ? performance.memory.usedJSHeapSize : 0
        });
    },
    
    endOperation(operationName) {
        const metric = this.metrics.get(operationName);
        if (metric) {
            const endTime = performance.now();
            const memoryEnd = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            const result = {
                duration: endTime - metric.startTime,
                memoryDelta: memoryEnd - metric.memoryStart,
                timestamp: new Date().toISOString()
            };
            
            console.log(`⏱️ Analytics ${operationName}: ${result.duration.toFixed(2)}ms, Memory: ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
            
            this.metrics.delete(operationName);
            return result;
        }
        return null;
    },
    
    getMetrics() {
        return Array.from(this.metrics.entries()).map(([name, data]) => ({
            operation: name,
            duration: performance.now() - data.startTime,
            inProgress: true
        }));
    }
};

// ========================================
// GLOBÁLNÍ FUNKCE PRO EXPORT
// ========================================

// Export funkcí pro globální použití
window.donulandAnalytics = {
    update: updateAnalytics,
    updateSection: updateAnalyticsSection,
    export: exportAnalytics,
    getData: getAnalyticsData,
    importData: importAnalyticsData,
    reset: resetAnalytics,
    validate: validateAnalyticsData,
    showValidationReport: displayValidationReport,
    state: analyticsState,
    monitor: analyticsPerformanceMonitor
};

// ========================================
// AUTO-UPDATE FUNKCE
// ========================================

// Automatická aktualizace analýz při změnách dat
let analyticsUpdateTimeout = null;

function scheduleAnalyticsUpdate(delay = 1000) {
    if (analyticsUpdateTimeout) {
        clearTimeout(analyticsUpdateTimeout);
    }
    
    analyticsUpdateTimeout = setTimeout(() => {
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            updateAnalytics();
        }
        analyticsUpdateTimeout = null;
    }, delay);
}

// Event listeners pro automatické aktualizace
eventBus.on('historicalDataChanged', () => {
    console.log('📊 Historical data changed, scheduling analytics update');
    scheduleAnalyticsUpdate(500);
});

eventBus.on('predictionCompleted', () => {
    console.log('📊 Prediction completed, updating accuracy section');
    scheduleAnalyticsUpdate(200);
});

eventBus.on('manualEventAdded', () => {
    console.log('📊 Manual event added, updating analytics');
    scheduleAnalyticsUpdate(300);
});

// ========================================
// DEBUG A TESTING FUNKCE
// ========================================

if (typeof window !== 'undefined' && window.donulandDebug) {
    // Rozšíření debug objektu o analytics funkce
    window.donulandDebug.analytics = {
        getState: () => analyticsState,
        updateNow: () => updateAnalytics(),
        updateSection: (section) => updateAnalyticsSection(section),
        validate: () => validateAnalyticsData(),
        export: () => exportAnalytics(),
        reset: () => resetAnalytics(),
        
        // Test funkce
        generateTestData: () => {
            const testData = [];
            for (let i = 0; i < 20; i++) {
                testData.push({
                    eventName: `Test Event ${i + 1}`,
                    city: ['Praha', 'Brno', 'Ostrava'][i % 3],
                    category: ['food festival', 'veletrh', 'koncert'][i % 3],
                    sales: Math.floor(Math.random() * 500) + 100,
                    visitors: Math.floor(Math.random() * 5000) + 1000,
                    dateFrom: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    weather: ['slunečno', 'oblačno', 'déšť'][i % 3],
                    rating: Math.floor(Math.random() * 5) + 1
                });
            }
            
            globalState.historicalData = testData;
            updateAnalytics();
            showNotification('🧪 Test data generated and analytics updated', 'info');
        },
        
        performanceTest: () => {
            console.log('🧪 Running analytics performance test...');
            const start = performance.now();
            
            for (let i = 0; i < 10; i++) {
                updateAnalytics();
            }
            
            const end = performance.now();
            console.log(`🧪 Performance test completed: ${(end - start).toFixed(2)}ms for 10 iterations`);
            showNotification(`🧪 Performance test: ${((end - start) / 10).toFixed(2)}ms per update`, 'info');
        }
    };
}

console.log('🎉 Donuland Analytics System fully loaded and ready!');
console.log('🔧 Debug functions available at: window.donulandDebug.analytics');
console.log('📊 Global functions available at: window.donulandAnalytics');
console.log('⚡ Auto-update: Enabled for real-time analytics');
console.log('🚀 System Status: All parts integrated and operational');
