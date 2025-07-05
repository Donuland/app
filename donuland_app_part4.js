/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 4A
   Calendar Implementation
   Navazuje na Part 1, 2, 3
   ======================================== */

console.log('🍩 Donuland Part 4A loading...');

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

// Získání událostí pro konkrétní datum
function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const events = [];
    
    try {
        // Historické akce z globálních dat
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            globalState.historicalData.forEach(record => {
                if (isDateInRange(dateStr, record.dateFrom, record.dateTo)) {
                    events.push({
                        id: `historical-${record.rowIndex}`,
                        type: 'historical',
                        title: record.eventName,
                        city: record.city,
                        category: record.category,
                        sales: record.sales,
                        visitors: record.visitors,
                        rating: record.rating,
                        dateFrom: record.dateFrom,
                        dateTo: record.dateTo,
                        data: record
                    });
                }
            });
        }
        
        // Uložené predikce z localStorage
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData && isDateInRange(dateStr, prediction.formData.eventDateFrom, prediction.formData.eventDateTo)) {
                events.push({
                    id: `prediction-${prediction.id}`,
                    type: 'prediction',
                    title: prediction.formData.eventName,
                    city: prediction.formData.city,
                    category: prediction.formData.category,
                    predictedSales: prediction.prediction.predictedSales,
                    visitors: prediction.formData.visitors,
                    dateFrom: prediction.formData.eventDateFrom,
                    dateTo: prediction.formData.eventDateTo,
                    data: prediction
                });
            }
        });
        
        // Manuálně přidané události
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            if (isDateInRange(dateStr, event.dateFrom, event.dateTo)) {
                events.push({
                    id: `manual-${event.id}`,
                    type: 'manual',
                    title: event.eventName,
                    city: event.city,
                    category: event.category || 'ostatní',
                    sales: event.sales,
                    visitors: event.visitors || 0,
                    dateFrom: event.dateFrom,
                    dateTo: event.dateTo,
                    data: event
                });
            }
        });
        
    } catch (error) {
        console.warn('⚠️ Error getting events for date:', dateStr, error);
    }
    
    // Aplikace filtrů
    return events.filter(event => {
        if (calendarState.filters.city && event.city !== calendarState.filters.city) return false;
        if (calendarState.filters.category && event.category !== calendarState.filters.category) return false;
        if (calendarState.filters.status) {
            if (calendarState.filters.status === 'planned' && event.type === 'historical') return false;
            if (calendarState.filters.status === 'completed' && event.type !== 'historical') return false;
        }
        return true;
    });
}

// Kontrola, zda datum spadá do rozsahu
function isDateInRange(checkDate, fromDate, toDate) {
    if (!fromDate || !toDate) return false;
    
    try {
        const check = new Date(checkDate);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        return check >= from && check <= to;
    } catch (error) {
        console.warn('⚠️ Date parsing error:', { checkDate, fromDate, toDate });
        return false;
    }
}

// ========================================
// VYTVOŘENÍ KALENDÁŘNÍCH PRVKŮ
// ========================================

// Vytvoření prvku kalendářního dne
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
    
    // Seznam událostí
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    dayData.events.slice(0, 3).forEach(event => { // Max 3 události viditelné
        const eventElement = document.createElement('div');
        eventElement.className = `event-item ${event.type}`;
        eventElement.textContent = event.title;
        eventElement.title = `${event.title} - ${event.city}`;
        
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

// Zobrazení popup s událostmi pro den
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
        const typeIcon = event.type === 'historical' ? '📊' : event.type === 'prediction' ? '🔮' : '📝';
        const typeLabel = event.type === 'historical' ? 'Dokončeno' : event.type === 'prediction' ? 'Predikce' : 'Manuální';
        const sales = event.sales || event.predictedSales || 0;
        
        html += `
            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #667eea;">
                <h4 style="margin: 0 0 8px; color: #333;">${escapeHtml(event.title)}</h4>
                <p style="margin: 0 0 5px; font-size: 0.9em; color: #666;">
                    ${typeIcon} ${typeLabel} • ${escapeHtml(event.city)} • ${escapeHtml(event.category)}
                </p>
                <div style="font-size: 0.8em; color: #555;">
                    🍩 ${formatNumber(sales)} ks • 👥 ${formatNumber(event.visitors)} návštěvníků
                </div>
                <button onclick="openEventModal(${JSON.stringify(event).replace(/"/g, '&quot;')}); this.closest('.day-events-popup').remove();" 
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
                    const eventDate = new Date(record.dateFrom);
                    if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
                        monthEvents.push({
                            type: 'historical',
                            date: eventDate,
                            title: record.eventName,
                            city: record.city,
                            category: record.category,
                            sales: record.sales,
                            visitors: record.visitors,
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
                const eventDate = new Date(prediction.formData.eventDateFrom);
                if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
                    monthEvents.push({
                        type: 'prediction',
                        date: eventDate,
                        title: prediction.formData.eventName,
                        city: prediction.formData.city,
                        category: prediction.formData.category,
                        predictedSales: prediction.prediction.predictedSales,
                        actualSales: prediction.actualSales,
                        visitors: prediction.formData.visitors,
                        data: prediction
                    });
                }
            }
        });
        
        // Manuální události
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            if (event.dateFrom) {
                const eventDate = new Date(event.dateFrom);
                if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
                    monthEvents.push({
                        type: 'manual',
                        date: eventDate,
                        title: event.eventName,
                        city: event.city,
                        category: event.category || 'ostatní',
                        sales: event.sales,
                        visitors: event.visitors || 0,
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
            
            // Status pro predikce
            let statusInfo = '';
            if (event.type === 'prediction' && event.actualSales > 0) {
                const accuracy = Math.abs(1 - Math.abs(event.predictedSales - event.actualSales) / event.actualSales) * 100;
                const accuracyColor = accuracy > 80 ? '#28a745' : accuracy > 60 ? '#ffc107' : '#dc3545';
                statusInfo = `<span style="color: ${accuracyColor}; font-weight: 600;">Přesnost: ${accuracy.toFixed(0)}%</span>`;
            }
            
            html += `
                <div class="month-event-item ${event.type}">
                    <div class="event-date">
                        <div class="event-day">${event.date.getDate()}</div>
                        <div class="event-month">${event.date.toLocaleDateString('cs-CZ', { month: 'short' })}</div>
                    </div>
                    <div class="event-details">
                        <h4>${escapeHtml(event.title)}</h4>
                        <p>${typeIcon} ${typeLabel} • ${escapeHtml(event.city)} • ${escapeHtml(event.category)}</p>
                        <div class="event-stats">
                            <span>🍩 ${formatNumber(sales)} ks</span>
                            <span>👥 ${formatNumber(event.visitors)} návštěvníků</span>
                            ${statusInfo}
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
                    predictedSales: prediction.prediction.predictedSales,
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
    console.log('📅 Initializing Calendar Part 4A...');
    
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
    
    console.log('✅ Calendar Part 4A initialized');
});

// ========================================
// FINALIZACE ČÁST 4A
// ========================================

console.log('✅ Donuland Part 4A loaded successfully');
console.log('📅 Features: ✅ Calendar Rendering ✅ Event Management ✅ Month Events List ✅ Event Modal ✅ Filters');
console.log('🔗 Connected to Parts 1,2,3 via eventBus and globalState');
console.log('⏳ Ready for Part 4B: Analytics Implementation');

// Event pro signalizaci dokončení části 4A
eventBus.emit('part4aLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['calendar-rendering', 'event-management', 'month-events-list', 'event-modal', 'calendar-filters']
});
/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 4B
   Analytics Implementation
   Navazuje na Part 1, 2, 3, 4A
   ======================================== */

console.log('🍩 Donuland Part 4B loading...');

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
    analyticsState.isCalculating = true;
    
    try {
        if (!globalState.historicalData || globalState.historicalData.length === 0) {
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
    const validEvents = globalState.historicalData.filter(record => 
        record.sales > 0 && record.visitors > 0 && record.eventName && record.city
    );
    
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
    
    return {
        totalEvents: validEvents.length,
        totalSales: totalSales,
        averageSales: averageSales,
        totalRevenue: totalRevenue,
        averageConversion: averageConversion.toFixed(1),
        topMonth: topMonth,
        bestCategory: bestCategory
    };
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
            weatherTypes: {},
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
    if (!overallStatsDiv || !analyticsState.overallStats) return;
    
    const stats = analyticsState.overallStats;
    
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
    if (!topEventsDiv || !analyticsState.topEvents.length) {
        if (topEventsDiv) {
            topEventsDiv.innerHTML = '<div class="analytics-placeholder"><p>📊 Žádné události k analýze</p></div>';
        }
        return;
    }
    
    let html = '';
    analyticsState.topEvents.slice(0, 5).forEach((event, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const dateStr = event.date ? new Date(event.date).toLocaleDateString('cs-CZ') : 'N/A';
        
        html += `
            <div class="top-item">
                <div class="top-info">
                    <h4>${medal} ${escapeHtml(event.name)}</h4>
                    <p>${escapeHtml(event.city)} • ${escapeHtml(event.category)} • ${dateStr}</p>
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
    
    // Detaily nejlepších a nejhorších predikcí
    if (accuracy.details.length > 0) {
        html += `
            <div class="accuracy-details">
                <h5>🏆 Nejpřesnější predikce</h5>
        `;
        
        accuracy.details.slice(0, 3).forEach(detail => {
            const accuracyClass = detail.accuracy > 80 ? 'excellent' : detail.accuracy > 60 ? 'good' : 'fair';
            const dateStr = detail.date ? new Date(detail.date).toLocaleDateString('cs-CZ') : 'N/A';
            
            html += `
                <div class="accuracy-detail ${accuracyClass}">
                    <div class="detail-info">
                        <strong>${escapeHtml(detail.eventName)}</strong>
                        <small>${dateStr}</small>
                    </div>
                    <div class="detail-numbers">
                        <span>Předpověď: ${formatNumber(detail.predicted)} ks</span>
                        <span>Realita: ${formatNumber(detail.actual)} ks</span>
                        <span class="accuracy-percent">${detail.accuracy.toFixed(1)}%</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
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
                <p><small>Pro analýzu vlivu počasí potřebujeme více historických dat s informacemi o počasí.</small></p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="weather-impact-overview">
            <h4>🌤️ Vliv počasí na prodej</h4>
            <p>Analyzováno <strong>${weather.totalAnalyzed}</strong> akcí s údaji o počasí</p>
            <p>Průměrná konverze: <strong>${weather.averageImpact}%</strong></p>
        </div>
        
        <div class="weather-types">
    `;
    
    weather.weatherTypes.forEach(weatherType => {
        const impactIcon = weatherType.impactType === 'positive' ? '📈' : '📉';
        const impactColor = weatherType.impactType === 'positive' ? '#28a745' : '#dc3545';
        const weatherIcon = getWeatherIcon(weatherType.type);
        
        html += `
            <div class="weather-type-item">
                <div class="weather-type-header">
                    <span class="weather-icon">${weatherIcon}</span>
                    <strong>${weatherType.type}</strong>
                    <span class="weather-impact" style="color: ${impactColor};">
                        ${impactIcon} ${weatherType.impact}%
                    </span>
                </div>
                <div class="weather-type-stats">
                    <span>${weatherType.events} akcí</span>
                    <span>${weatherType.averageConversion.toFixed(1)}% konverze</span>
                    <span>⌀ ${weatherType.averageSales} ks/akci</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Doporučení
    if (weather.recommendations.length > 0) {
        html += '<div class="weather-recommendations"><h5>💡 Doporučení</h5>';
        weather.recommendations.forEach(rec => {
            const recIcon = rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
            html += `
                <div class="weather-recommendation ${rec.type}">
                    <strong>${recIcon} ${rec.title}</strong>
                    <p>${rec.text}</p>
                </div>
            `;
        });
        html += '</div>';
    }
    
    weatherDiv.innerHTML = html;
}

// Helper pro weather ikony
function getWeatherIconForType(type) {
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
    return icons[type] || '🌤️';
}

// ========================================
// LOADING A ERROR STAVY
// ========================================

// Zobrazení loading stavu analýz
function displayAnalyticsLoading() {
    const sections = ['overallStats', 'topEvents', 'topCities', 'topCategories', 'monthlyTrends', 'predictionAccuracy', 'weatherImpact'];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.innerHTML = `
                <div class="analytics-loading">
                    <div class="spinner"></div>
                    <p>Počítám analýzy...</p>
                </div>
            `;
        }
    });
}

// Zobrazení placeholder analýz
function displayAnalyticsPlaceholder() {
    const sections = [
        { id: 'overallStats', text: '📊 Načítám celkové statistiky...' },
        { id: 'topEvents', text: '🏆 Žádné události k analýze' },
        { id: 'topCities', text: '🏙️ Žádná města k analýze' },
        { id: 'topCategories', text: '📋 Žádné kategorie k analýze' },
        { id: 'monthlyTrends', text: '📈 Nedostatek dat pro trendy' },
        { id: 'predictionAccuracy', text: '🎯 Žádné predikce k analýze' },
        { id: 'weatherImpact', text: '🌤️ Nedostatek dat o počasí' }
    ];
    
    sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
            element.innerHTML = `
                <div class="analytics-placeholder">
                    <p>${section.text}</p>
                    <small>Data se načtou automaticky po importu historických záznamů</small>
                </div>
            `;
        }
    });
}

// Zobrazení chyby analýz
function displayAnalyticsError(errorMessage) {
    const sections = ['overallStats', 'topEvents', 'topCities', 'topCategories', 'monthlyTrends', 'predictionAccuracy', 'weatherImpact'];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.innerHTML = `
                <div class="analytics-error">
                    <p style="color: #dc3545;">❌ Chyba při výpočtu analýz</p>
                    <small>${escapeHtml(errorMessage)}</small>
                    <button class="btn" onclick="updateAnalytics()" style="margin-top: 10px;">
                        🔄 Zkusit znovu
                    </button>
                </div>
            `;
        }
    });
}

// ========================================
// EVENT LISTENERS PRO ANALÝZY
// ========================================

// Event listener pro požadavek na analýzy
eventBus.on('analyticsRequested', () => {
    console.log('📊 Analytics section requested');
    
    // Spuštění analýz při zobrazení sekce
    setTimeout(() => {
        updateAnalytics();
    }, 100);
});

// Event listener pro resize analýz
eventBus.on('analyticsResizeRequested', () => {
    console.log('📊 Analytics resize requested');
    // Možná budoucí implementace pro responzivní grafy
});

// Event listener pro aktualizaci dat
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded, updating analytics');
    setTimeout(() => {
        updateAnalytics();
    }, 1000);
});

eventBus.on('dataUpdated', () => {
    console.log('📊 Data updated, refreshing analytics');
    setTimeout(() => {
        updateAnalytics();
    }, 500);
});

// Event listener pro aktualizaci predikcí
eventBus.on('predictionSaved', () => {
    console.log('📊 Prediction saved, updating analytics');
    setTimeout(() => {
        updateAnalytics();
    }, 100);
});

// ========================================
// INICIALIZACE ANALÝZ
// ========================================

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing Analytics Part 4B...');
    
    // Zobrazení placeholder na začátku
    displayAnalyticsPlaceholder();
    
    // Spuštění analýz pokud jsou data již načtena
    if (globalState.historicalData && globalState.historicalData.length > 0) {
        setTimeout(() => {
            updateAnalytics();
        }, 2000);
    }
    
    console.log('✅ Analytics Part 4B initialized');
});

// ========================================
// FINALIZACE ČÁST 4B
// ========================================

console.log('✅ Donuland Part 4B loaded successfully');
console.log('📊 Features: ✅ Overall Stats ✅ Top Results ✅ Monthly Trends ✅ Prediction Accuracy ✅ Weather Impact');
console.log('🔗 Connected to Parts 1,2,3,4A via eventBus and globalState');
console.log('⏳ Ready for Part 5: Settings Implementation');

// Event pro signalizaci dokončení části 4B
eventBus.emit('part4bLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['overall-stats', 'top-results', 'monthly-trends', 'prediction-accuracy', 'weather-impact', 'analytics-charts']
});
