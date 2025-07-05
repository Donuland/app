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
