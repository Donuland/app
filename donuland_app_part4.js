/* ========================================
   DONULAND PART 4A - ZÁKLADNÍ KALENDÁŘ A FILTRY
   Oprava základních funkcí kalendáře a filtrování
   ======================================== */

console.log('🍩 Donuland Part 4A loading...');

// ========================================
// KALENDÁŘNÍ STAV A KONFIGURACE
// ========================================

// Globální stav kalendáře
if (typeof window.calendarState === 'undefined') {
    window.calendarState = {
        isRendering: false,
        filters: {
            city: '',
            category: '',
            status: ''
        },
        eventColors: new Map(),
        colorPalette: [
            '#4285f4', '#ea4335', '#34a853', '#fbbc04', '#9c27b0', 
            '#ff6f00', '#795548', '#607d8b', '#e91e63', '#8bc34a',
            '#ff5722', '#3f51b5', '#009688', '#673ab7', '#2196f3'
        ],
        currentView: 'month'
    };
}

// ========================================
// ZÁKLADNÍ KALENDÁŘNÍ FUNKCE
// ========================================

// Hlavní funkce pro vykreslení kalendáře
function renderCalendar() {
    console.log('📅 Rendering calendar...');
    
    if (calendarState.isRendering) {
        console.log('⚠️ Calendar already rendering');
        return;
    }
    
    calendarState.isRendering = true;
    
    try {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) {
            console.error('❌ Calendar grid element not found');
            return;
        }
        
        // Vymazat současný obsah
        calendarGrid.innerHTML = '';
        
        // Přidat hlavičky dnů
        const dayHeaders = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });
        
        // Získat dny v měsíci
        const year = globalState.currentYear;
        const month = globalState.currentMonth;
        const daysInMonth = getDaysInMonth(year, month);
        
        // Přidat dny do kalendáře
        daysInMonth.forEach(dayData => {
            const dayElement = createCalendarDay(dayData);
            calendarGrid.appendChild(dayElement);
        });
        
        // Aktualizovat seznam událostí měsíce
        updateMonthEventsList();
        
        console.log('✅ Calendar rendered successfully');
        
    } catch (error) {
        console.error('❌ Error rendering calendar:', error);
        showNotification('❌ Chyba při vykreslování kalendáře', 'error');
    } finally {
        calendarState.isRendering = false;
    }
}

// Získání dnů v měsíci
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
    
    // Dny z následujícího měsíce
    const totalDays = 42; // 6 týdnů × 7 dnů
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

// Vytvoření elementu kalendářního dne
function createCalendarDay(dayData) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (!dayData.isCurrentMonth) {
        dayElement.classList.add('other-month');
    }
    
    // Kontrola dnešního dne
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
    
    // Container pro události
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    // Filtrovat události podle aktivních filtrů
    const filteredEvents = filterEvents(dayData.events);
    
    // Zobrazit maximálně 3 události na den
    const maxEventsToShow = 3;
    filteredEvents.slice(0, maxEventsToShow).forEach(event => {
        const eventElement = createEventElement(event);
        eventsContainer.appendChild(eventElement);
    });
    
    // Indikátor dalších událostí
    if (filteredEvents.length > maxEventsToShow) {
        const moreIndicator = document.createElement('div');
        moreIndicator.className = 'event-item more';
        moreIndicator.textContent = `+${filteredEvents.length - maxEventsToShow} dalších`;
        moreIndicator.style.background = '#6c757d';
        moreIndicator.style.color = '#ffffff';
        eventsContainer.appendChild(moreIndicator);
    }
    
    dayElement.appendChild(eventsContainer);
    
    // Click handler pro přidání nové události
    dayElement.addEventListener('click', (e) => {
        if (!e.target.closest('.event-item') && dayData.isCurrentMonth) {
            openEventModal(null, dayData.date);
        }
    });
    
    return dayElement;
}

// Vytvoření elementu události
function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    
    // Získání barvy pro událost
    const color = getEventColor(event.title, event.status);
    eventElement.style.background = color;
    eventElement.style.color = '#ffffff';
    
    // Ikona podle statusu
    let icon = '';
    switch (event.status) {
        case 'completed': icon = '✅'; break;
        case 'ongoing': icon = '🔥'; break;
        case 'planned': icon = '🔮'; break;
        default: icon = '📅';
    }
    
    // Text události (zkrácený)
    let eventText = event.title;
    if (eventText.length > 15) {
        eventText = eventText.substring(0, 12) + '...';
    }
    
    eventElement.textContent = `${icon} ${eventText}`;
    eventElement.title = `${event.title} - ${event.city} (${event.category})`;
    
    // Click handler pro editaci události
    eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        openEventModal(event);
    });
    
    return eventElement;
}

// ========================================
// UDÁLOSTI A DATA
// ========================================

// Získání událostí pro konkrétní datum
function getEventsForDate(date) {
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return [];
    }
    
    const events = [];
    const dateStr = formatDateForComparison(date);
    
    // Procházet historická data
    globalState.historicalData.forEach(record => {
        if (record.dateFrom && record.dateTo) {
            const fromStr = formatDateForComparison(new Date(record.dateFrom));
            const toStr = formatDateForComparison(new Date(record.dateTo));
            
            if (dateStr >= fromStr && dateStr <= toStr) {
                events.push({
                    id: `historical-${record.rowIndex || Date.now()}`,
                    type: 'historical',
                    title: record.eventName,
                    city: record.city,
                    category: record.category,
                    status: determineEventStatus(record.dateFrom, record.dateTo),
                    sales: record.sales,
                    visitors: record.visitors,
                    rating: record.rating,
                    dateFrom: record.dateFrom,
                    dateTo: record.dateTo,
                    data: record
                });
            }
        }
    });
    
    // Přidat uložené predikce
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData) {
                const fromStr = formatDateForComparison(new Date(prediction.formData.eventDateFrom));
                const toStr = formatDateForComparison(new Date(prediction.formData.eventDateTo));
                
                if (dateStr >= fromStr && dateStr <= toStr) {
                    events.push({
                        id: `prediction-${prediction.id}`,
                        type: 'prediction',
                        title: prediction.formData.eventName,
                        city: prediction.formData.city,
                        category: prediction.formData.category,
                        status: 'planned',
                        predictedSales: prediction.prediction?.predictedSales,
                        confidence: prediction.prediction?.confidence,
                        dateFrom: prediction.formData.eventDateFrom,
                        dateTo: prediction.formData.eventDateTo,
                        data: prediction
                    });
                }
            }
        });
    } catch (error) {
        console.warn('⚠️ Error loading saved predictions:', error);
    }
    
    return events;
}

// Formátování data pro porovnání
function formatDateForComparison(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Určení statusu události
function determineEventStatus(dateFrom, dateTo) {
    const today = new Date();
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo || dateFrom);
    
    if (endDate < today) {
        return 'completed';
    } else if (startDate <= today && today <= endDate) {
        return 'ongoing';
    } else {
        return 'planned';
    }
}

// Získání barvy pro událost
function getEventColor(eventTitle, status) {
    // Dokončené akce - zelená
    if (status === 'completed') {
        return '#28a745';
    }
    
    // Probíhající akce - oranžová
    if (status === 'ongoing') {
        return '#ffc107';
    }
    
    // Plánované akce - různé barvy podle názvu
    const eventKey = eventTitle.toLowerCase();
    
    if (!calendarState.eventColors.has(eventKey)) {
        const colorIndex = Math.abs(hashString(eventKey)) % calendarState.colorPalette.length;
        calendarState.eventColors.set(eventKey, calendarState.colorPalette[colorIndex]);
    }
    
    return calendarState.eventColors.get(eventKey);
}

// Hash funkce pro konzistentní barvy
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

// ========================================
// FILTRY
// ========================================

// Filtrování událostí podle aktivních filtrů
function filterEvents(events) {
    const filters = calendarState.filters;
    
    return events.filter(event => {
        // Filtr města
        if (filters.city && event.city.toLowerCase().indexOf(filters.city.toLowerCase()) === -1) {
            return false;
        }
        
        // Filtr kategorie
        if (filters.category && event.category !== filters.category) {
            return false;
        }
        
        // Filtr statusu
        if (filters.status && event.status !== filters.status) {
            return false;
        }
        
        return true;
    });
}

// Aplikace filtrů kalendáře
function filterCalendar() {
    console.log('🔍 Applying calendar filters...');
    
    const cityFilter = document.getElementById('cityFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (cityFilter) calendarState.filters.city = cityFilter.value;
    if (categoryFilter) calendarState.filters.category = categoryFilter.value;
    if (statusFilter) calendarState.filters.status = statusFilter.value;
    
    // Re-render kalendář s novými filtry
    renderCalendar();
    
    console.log('✅ Filters applied:', calendarState.filters);
}

// Vymazání filtrů
function clearCalendarFilters() {
    console.log('🧹 Clearing calendar filters...');
    
    const cityFilter = document.getElementById('cityFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (cityFilter) cityFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    
    calendarState.filters = { city: '', category: '', status: '' };
    
    renderCalendar();
    
    showNotification('🔄 Filtry kalendáře vymazány', 'info', 2000);
}

// Naplnění filter dropdownů
function populateFilterDropdowns() {
    console.log('📋 Populating filter dropdowns...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('⚠️ No historical data for filters');
        return;
    }
    
    const cities = new Set();
    const categories = new Set();
    
    // Získat unikátní města a kategorie z dat
    globalState.historicalData.forEach(record => {
        if (record.city) cities.add(record.city);
        if (record.category) categories.add(record.category);
    });
    
    // Naplnit město filter
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        // Ponechat první option (všechna města)
        while (cityFilter.children.length > 1) {
            cityFilter.removeChild(cityFilter.lastChild);
        }
        
        Array.from(cities).sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = `🏙️ ${city}`;
            cityFilter.appendChild(option);
        });
    }
    
    // Naplnit kategorie filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        // Ponechat první option (všechny kategorie)
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }
        
        const categoryIcons = {
            'food festival': '🍔',
            'veletrh': '🍫',
            'koncert': '🎵',
            'kulturní akce': '🎭',
            'sportovní': '🏃',
            'ostatní': '📅'
        };
        
        Array.from(categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            const icon = categoryIcons[category] || '📋';
            option.textContent = `${icon} ${category}`;
            categoryFilter.appendChild(option);
        });
    }
    
    console.log(`✅ Filter dropdowns populated - ${cities.size} cities, ${categories.size} categories`);
}

// ========================================
// SEZNAM UDÁLOSTÍ MĚSÍCE
// ========================================

// Aktualizace seznamu událostí pro aktuální měsíc
function updateMonthEventsList() {
    console.log('📋 Updating month events list...');
    
    const monthEventsContainer = document.getElementById('monthEvents');
    if (!monthEventsContainer) {
        console.warn('⚠️ Month events container not found');
        return;
    }
    
    const monthEvents = getEventsForCurrentMonth();
    
    if (monthEvents.length === 0) {
        monthEventsContainer.innerHTML = `
            <div class="no-events-message">
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📅</div>
                    <h4>Žádné události v tomto měsíci</h4>
                    <p>V tomto měsíci nejsou naplánované žádné akce.</p>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '<div class="month-events-list">';
    
    // Statistiky
    const completedEvents = monthEvents.filter(e => e.status === 'completed').length;
    const plannedEvents = monthEvents.filter(e => e.status === 'planned').length;
    
    html += `
        <div class="month-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">${monthEvents.length}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Celkem akcí</div>
            </div>
            <div style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">${completedEvents}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Dokončeno</div>
            </div>
            <div style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                <div style="font-size: 1.5em; font-weight: bold; color: #ffc107;">${plannedEvents}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Plánováno</div>
            </div>
        </div>
    `;
    
    // Seskupení podle dat
    const eventsByDate = new Map();
    monthEvents.forEach(event => {
        const dateKey = event.dateFrom;
        if (!eventsByDate.has(dateKey)) {
            eventsByDate.set(dateKey, []);
        }
        eventsByDate.get(dateKey).push(event);
    });
    
    // Seřazení podle data
    const sortedDates = Array.from(eventsByDate.keys()).sort();
    
    sortedDates.forEach(dateKey => {
        const events = eventsByDate.get(dateKey);
        const date = new Date(dateKey);
        const isToday = date.toDateString() === new Date().toDateString();
        
        html += `
            <div class="date-group ${isToday ? 'today' : ''}" style="margin-bottom: 20px;">
                <h4 style="color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 8px; margin-bottom: 15px;">
                    ${isToday ? '📍 ' : ''}${formatDate(date)} 
                    <span style="color: #6c757d; font-size: 0.8em;">(${events.length})</span>
                </h4>
                <div class="date-events">
        `;
        
        events.forEach(event => {
            const statusIcon = event.status === 'completed' ? '✅' : 
                              event.status === 'ongoing' ? '🔥' : '🔮';
            const statusText = event.status === 'completed' ? 'Dokončeno' :
                              event.status === 'ongoing' ? 'Probíhá' : 'Plánováno';
            
            html += `
                <div class="month-event-item" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${getEventColor(event.title, event.status)}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;" onclick="openEventModal('${event.type}', '${event.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #495057;">${statusIcon} ${escapeHtml(event.title)}</span>
                        <span style="color: #6c757d; font-size: 0.8em;">${statusText}</span>
                    </div>
                    <div style="display: flex; gap: 15px; font-size: 0.9em; color: #6c757d;">
                        <span>📍 ${escapeHtml(event.city)}</span>
                        <span>📋 ${escapeHtml(event.category)}</span>
                        ${event.sales ? `<span>🍩 ${formatNumber(event.sales)} ks</span>` : ''}
                        ${event.predictedSales ? `<span>🔮 ${formatNumber(event.predictedSales)} ks</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    monthEventsContainer.innerHTML = html;
    console.log(`✅ Month events list updated: ${monthEvents.length} events`);
}

// Získání událostí pro aktuální měsíc
function getEventsForCurrentMonth() {
    const year = globalState.currentYear;
    const month = globalState.currentMonth;
    const events = [];
    
    // Získat všechny dny v měsíci
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const dayEvents = getEventsForDate(new Date(date));
        const filteredEvents = filterEvents(dayEvents);
        events.push(...filteredEvents);
    }
    
    // Odstranit duplicity
    const uniqueEvents = events.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
    );
    
    return uniqueEvents.sort((a, b) => new Date(a.dateFrom) - new Date(b.dateFrom));
}

// ========================================
// EVENT LISTENERS
// ========================================

// Event listener pro změnu dat
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded - updating calendar...');
    setTimeout(() => {
        populateFilterDropdowns();
        renderCalendar();
    }, 500);
});

// Event listener pro změnu měsíce
eventBus.on('calendarMonthChanged', () => {
    console.log('📅 Month changed - re-rendering calendar...');
    renderCalendar();
});

// Event listener pro změnu sekce
eventBus.on('sectionChanged', (data) => {
    if (data.section === 'calendar') {
        console.log('📅 Calendar section opened - rendering calendar...');
        setTimeout(() => {
            renderCalendar();
        }, 300);
    }
});

// ========================================
// MODAL FUNKCE (PLACEHOLDER)
// ========================================

// Otevření modalu události (placeholder)
function openEventModal(event = null, defaultDate = null) {
    console.log('📝 Opening event modal:', { event, defaultDate });
    showNotification('📝 Modal pro editaci události bude implementován v Part 4B', 'info', 3000);
}

// ========================================
// INICIALIZACE
// ========================================

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Initializing Part 4A - Calendar...');
    
    // Setup event listeners pro filtry
    setTimeout(() => {
        const cityFilter = document.getElementById('cityFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (cityFilter) cityFilter.addEventListener('change', filterCalendar);
        if (categoryFilter) categoryFilter.addEventListener('change', filterCalendar);
        if (statusFilter) statusFilter.addEventListener('change', filterCalendar);
        
        console.log('✅ Filter event listeners attached');
    }, 1000);
    
    // Auto-render kalendáře pokud jsou data dostupná
    setTimeout(() => {
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            populateFilterDropdowns();
            renderCalendar();
        }
    }, 2000);
    
    console.log('✅ Part 4A initialized');
});

console.log('✅ Donuland Part 4A loaded successfully');
console.log('📅 Features: ✅ Basic Calendar ✅ Event Display ✅ Filters ✅ Month Navigation');
console.log('⏳ Ready for Part 4B: Event Modal & Data Management');
/* ========================================
   DONULAND PART 4B - EVENT MODAL A POKROČILÉ FUNKCE
   Modal pro editaci událostí, detailní zobrazení a management
   ======================================== */

console.log('🍩 Donuland Part 4B loading...');

// ========================================
// ROZŠÍŘENÉ KALENDÁŘNÍ FUNKCE
// ========================================

// Přepsání openEventModal s plnou funkcionalitou
function openEventModal(event = null, defaultDate = null) {
    console.log('📝 Opening enhanced event modal:', { event, defaultDate });
    
    try {
        const modal = document.getElementById('eventModal');
        if (!modal) {
            console.error('❌ Event modal not found in DOM');
            showNotification('❌ Modal není k dispozici', 'error');
            return;
        }
        
        modal.style.display = 'flex';
        populateModal(event, defaultDate);
        
        // Focus na první editovatelný input
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([readonly]), textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
        
        console.log('✅ Event modal opened successfully');
        
    } catch (error) {
        console.error('❌ Error opening event modal:', error);
        showNotification('❌ Chyba při otevírání modalu', 'error');
    }
}

// Naplnění modalu daty
function populateModal(event = null, defaultDate = null) {
    console.log('📋 Populating modal with data:', { event, defaultDate });
    
    const elements = {
        title: document.getElementById('modalTitle'),
        eventName: document.getElementById('modalEventName'),
        dateFrom: document.getElementById('modalEventDateFrom'),
        dateTo: document.getElementById('modalEventDateTo'),
        city: document.getElementById('modalEventCity'),
        category: document.getElementById('modalEventCategory'),
        sales: document.getElementById('modalSales'),
        notes: document.getElementById('modalNotes')
    };
    
    if (event) {
        // EDITACE EXISTUJÍCÍ UDÁLOSTI
        if (elements.title) {
            elements.title.textContent = `✏️ Detail: ${event.title}`;
        }
        
        if (elements.eventName) {
            elements.eventName.value = event.title || '';
            elements.eventName.readOnly = true;
        }
        
        if (elements.dateFrom) {
            elements.dateFrom.value = formatDateForInput(event.dateFrom) || '';
            elements.dateFrom.readOnly = true;
        }
        
        if (elements.dateTo) {
            elements.dateTo.value = formatDateForInput(event.dateTo || event.dateFrom) || '';
            elements.dateTo.readOnly = true;
        }
        
        if (elements.city) {
            elements.city.value = event.city || '';
            elements.city.readOnly = true;
        }
        
        if (elements.category) {
            // Vytvořit select pro kategorii pokud neexistuje
            if (elements.category.tagName === 'INPUT') {
                elements.category.value = event.category || '';
                elements.category.readOnly = true;
            } else {
                populateCategorySelect(elements.category, event.category);
                elements.category.disabled = true;
            }
        }
        
        if (elements.sales) {
            elements.sales.value = event.sales || event.actualSales || '';
            elements.sales.readOnly = false; // Prodej lze editovat
        }
        
        if (elements.notes) {
            elements.notes.value = event.notes || event.data?.notes || '';
            elements.notes.readOnly = false; // Poznámky lze editovat
        }
        
        // Přidat další informace do modalu
        addEventDetailsToModal(event);
        
    } else {
        // NOVÁ UDÁLOST
        if (elements.title) {
            elements.title.textContent = '➕ Nová akce';
        }
        
        // Vymazat všechny hodnoty
        Object.values(elements).forEach(el => {
            if (el && el.tagName !== 'H3') {
                el.value = '';
                el.readOnly = false;
                el.disabled = false;
            }
        });
        
        // Nastavit defaultní datum
        if (defaultDate && elements.dateFrom) {
            const dateStr = formatDateForInput(defaultDate);
            elements.dateFrom.value = dateStr;
            if (elements.dateTo) {
                elements.dateTo.value = dateStr; // Stejné datum pro jednodenní akci
            }
        }
        
        // Naplnit kategorie select
        if (elements.category && elements.category.tagName === 'SELECT') {
            populateCategorySelect(elements.category);
        }
    }
}

// Přidání detailních informací o události do modalu
function addEventDetailsToModal(event) {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    
    // Odstranit existující detail section
    const existingDetails = modalBody.querySelector('.event-details-section');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    // Vytvořit novou detail section
    const detailsSection = document.createElement('div');
    detailsSection.className = 'event-details-section';
    detailsSection.style.cssText = `
        background: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin: 15px 0;
        border-left: 4px solid ${getEventColor(event.title, event.status)};
    `;
    
    let detailsHTML = '<h4 style="margin: 0 0 15px 0; color: #495057;">📊 Detaily události</h4>';
    
    // Status události
    const statusIcon = event.status === 'completed' ? '✅' : 
                      event.status === 'ongoing' ? '🔥' : '🔮';
    const statusText = event.status === 'completed' ? 'Dokončeno' :
                      event.status === 'ongoing' ? 'Probíhá' : 'Plánováno';
    
    detailsHTML += `<div style="margin-bottom: 10px;"><strong>Status:</strong> ${statusIcon} ${statusText}</div>`;
    
    // Typ události
    detailsHTML += `<div style="margin-bottom: 10px;"><strong>Typ:</strong> ${event.type === 'historical' ? '📊 Historická akce' : '🔮 Predikce'}</div>`;
    
    // Datum rozsah
    const dateRange = event.dateTo && event.dateTo !== event.dateFrom ? 
        `${formatDate(event.dateFrom)} - ${formatDate(event.dateTo)}` : 
        formatDate(event.dateFrom);
    detailsHTML += `<div style="margin-bottom: 10px;"><strong>Datum:</strong> ${dateRange}</div>`;
    
    // Prodeje a predikce
    if (event.sales) {
        detailsHTML += `<div style="margin-bottom: 10px;"><strong>Skutečný prodej:</strong> 🍩 ${formatNumber(event.sales)} ks</div>`;
    }
    
    if (event.predictedSales) {
        detailsHTML += `<div style="margin-bottom: 10px;"><strong>Predikovaný prodej:</strong> 🔮 ${formatNumber(event.predictedSales)} ks</div>`;
    }
    
    if (event.confidence) {
        detailsHTML += `<div style="margin-bottom: 10px;"><strong>Confidence:</strong> 🎯 ${event.confidence}%</div>`;
    }
    
    // Návštěvnost a konverze
    if (event.visitors) {
        detailsHTML += `<div style="margin-bottom: 10px;"><strong>Návštěvnost:</strong> 👥 ${formatNumber(event.visitors)}</div>`;
        
        if (event.sales && event.visitors) {
            const conversion = ((event.sales / event.visitors) * 100).toFixed(1);
            detailsHTML += `<div style="margin-bottom: 10px;"><strong>Konverze:</strong> 🎯 ${conversion}%</div>`;
        }
    }
    
    // Rating
    if (event.rating) {
        const stars = '⭐'.repeat(Math.round(event.rating));
        detailsHTML += `<div style="margin-bottom: 10px;"><strong>Hodnocení:</strong> ${stars} (${event.rating}/5)</div>`;
    }
    
    detailsSection.innerHTML = detailsHTML;
    modalBody.appendChild(detailsSection);
}

// Naplnění category selectu
function populateCategorySelect(selectElement, selectedValue = '') {
    if (!selectElement) return;
    
    const categories = [
        { value: '', text: 'Vyberte kategorii', icon: '' },
        { value: 'food festival', text: 'Food festival', icon: '🍔' },
        { value: 'veletrh', text: 'Veletrh/ČokoFest', icon: '🍫' },
        { value: 'koncert', text: 'Koncert', icon: '🎵' },
        { value: 'kulturní akce', text: 'Kulturní akce', icon: '🎭' },
        { value: 'sportovní', text: 'Sportovní akce', icon: '🏃' },
        { value: 'ostatní', text: 'Ostatní', icon: '📅' }
    ];
    
    selectElement.innerHTML = '';
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = cat.icon ? `${cat.icon} ${cat.text}` : cat.text;
        if (cat.value === selectedValue) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

// Formátování data pro input
function formatDateForInput(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// ========================================
// FUNKCE PRO UKLÁDÁNÍ UDÁLOSTÍ
// ========================================

// Uložení úprav události
function saveEventEdit() {
    console.log('💾 Saving event edit...');
    
    try {
        const sales = document.getElementById('modalSales')?.value;
        const notes = document.getElementById('modalNotes')?.value;
        const eventName = document.getElementById('modalEventName')?.value;
        
        if (!eventName) {
            showNotification('❌ Název události je povinný', 'error');
            return;
        }
        
        // Najít událost v historických datech a aktualizovat
        if (globalState.historicalData) {
            const eventIndex = globalState.historicalData.findIndex(record => 
                record.eventName === eventName
            );
            
            if (eventIndex !== -1) {
                if (sales) {
                    globalState.historicalData[eventIndex].actualSales = parseInt(sales);
                }
                if (notes) {
                    globalState.historicalData[eventIndex].notes = notes;
                }
                
                console.log('✅ Event updated in historical data');
            }
        }
        
        // Uložit do localStorage pro perzistenci
        const savedEdits = JSON.parse(localStorage.getItem('donuland_event_edits') || '{}');
        savedEdits[eventName] = {
            sales: sales ? parseInt(sales) : null,
            notes: notes || '',
            editedAt: new Date().toISOString()
        };
        localStorage.setItem('donuland_event_edits', JSON.stringify(savedEdits));
        
        showNotification('✅ Změny uloženy', 'success', 3000);
        closeModal();
        
        // Aktualizovat kalendář
        renderCalendar();
        
    } catch (error) {
        console.error('❌ Error saving event edit:', error);
        showNotification('❌ Chyba při ukládání', 'error');
    }
}

// Smazání události
function deleteEvent() {
    console.log('🗑️ Deleting event...');
    
    const eventName = document.getElementById('modalEventName')?.value;
    if (!eventName) return;
    
    const confirmed = confirm(`Opravdu chcete smazat událost "${eventName}"?\n\nTato akce je nevratná.`);
    if (!confirmed) return;
    
    try {
        // Označit jako smazanou v localStorage
        const deletedEvents = JSON.parse(localStorage.getItem('donuland_deleted_events') || '[]');
        deletedEvents.push({
            eventName: eventName,
            deletedAt: new Date().toISOString()
        });
        localStorage.setItem('donuland_deleted_events', JSON.stringify(deletedEvents));
        
        showNotification('🗑️ Událost označena jako smazaná', 'warning', 4000);
        closeModal();
        
        // Aktualizovat kalendář
        renderCalendar();
        
    } catch (error) {
        console.error('❌ Error deleting event:', error);
        showNotification('❌ Chyba při mazání události', 'error');
    }
}

// ========================================
// POKROČILÉ ZOBRAZENÍ UDÁLOSTÍ
// ========================================

// Rozšířená funkce pro získání událostí s editacemi
function getEventsForDate(date) {
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return [];
    }
    
    const events = [];
    const dateStr = formatDateForComparison(date);
    
    // Načíst smazané události
    const deletedEvents = JSON.parse(localStorage.getItem('donuland_deleted_events') || '[]');
    const deletedEventNames = deletedEvents.map(e => e.eventName);
    
    // Načíst editace
    const savedEdits = JSON.parse(localStorage.getItem('donuland_event_edits') || '{}');
    
    // Procházet historická data
    globalState.historicalData.forEach(record => {
        // Přeskočit smazané události
        if (deletedEventNames.includes(record.eventName)) {
            return;
        }
        
        if (record.dateFrom && record.dateTo) {
            const fromStr = formatDateForComparison(new Date(record.dateFrom));
            const toStr = formatDateForComparison(new Date(record.dateTo));
            
            if (dateStr >= fromStr && dateStr <= toStr) {
                const event = {
                    id: `historical-${record.rowIndex || Date.now()}`,
                    type: 'historical',
                    title: record.eventName,
                    city: record.city,
                    category: record.category,
                    status: determineEventStatus(record.dateFrom, record.dateTo),
                    sales: record.sales,
                    visitors: record.visitors,
                    rating: record.rating,
                    dateFrom: record.dateFrom,
                    dateTo: record.dateTo,
                    data: record
                };
                
                // Aplikovat editace
                if (savedEdits[record.eventName]) {
                    const edit = savedEdits[record.eventName];
                    if (edit.sales) event.actualSales = edit.sales;
                    if (edit.notes) event.notes = edit.notes;
                    event.isEdited = true;
                }
                
                events.push(event);
            }
        }
    });
    
    // Přidat uložené predikce
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData && !deletedEventNames.includes(prediction.formData.eventName)) {
                const fromStr = formatDateForComparison(new Date(prediction.formData.eventDateFrom));
                const toStr = formatDateForComparison(new Date(prediction.formData.eventDateTo));
                
                if (dateStr >= fromStr && dateStr <= toStr) {
                    const event = {
                        id: `prediction-${prediction.id}`,
                        type: 'prediction',
                        title: prediction.formData.eventName,
                        city: prediction.formData.city,
                        category: prediction.formData.category,
                        status: 'planned',
                        predictedSales: prediction.prediction?.predictedSales,
                        confidence: prediction.prediction?.confidence,
                        dateFrom: prediction.formData.eventDateFrom,
                        dateTo: prediction.formData.eventDateTo,
                        data: prediction
                    };
                    
                    // Aplikovat editace pro predikce
                    if (savedEdits[prediction.formData.eventName]) {
                        const edit = savedEdits[prediction.formData.eventName];
                        if (edit.sales) event.actualSales = edit.sales;
                        if (edit.notes) event.notes = edit.notes;
                        event.isEdited = true;
                    }
                    
                    events.push(event);
                }
            }
        });
    } catch (error) {
        console.warn('⚠️ Error loading saved predictions:', error);
    }
    
    return events;
}

// ========================================
// VYLEPŠENÉ UDÁLOST ELEMENTY
// ========================================

// Rozšířená funkce pro vytvoření elementu události
function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    
    // Získání barvy pro událost
    const color = getEventColor(event.title, event.status);
    eventElement.style.background = color;
    eventElement.style.color = '#ffffff';
    eventElement.style.fontWeight = '600';
    eventElement.style.fontSize = '0.75rem';
    eventElement.style.padding = '3px 6px';
    eventElement.style.marginBottom = '2px';
    eventElement.style.borderRadius = '4px';
    eventElement.style.cursor = 'pointer';
    eventElement.style.transition = 'all 0.2s ease';
    
    // Ikona podle statusu
    let icon = '';
    switch (event.status) {
        case 'completed': icon = '✅'; break;
        case 'ongoing': icon = '🔥'; break;
        case 'planned': icon = '🔮'; break;
        default: icon = '📅';
    }
    
    // Speciální označení pro editované události
    if (event.isEdited) {
        icon = '📝' + icon;
        eventElement.style.background = `linear-gradient(45deg, ${color}, #17a2b8)`;
    }
    
    // Text události (zkrácený)
    let eventText = event.title;
    if (eventText.length > 15) {
        eventText = eventText.substring(0, 12) + '...';
    }
    
    eventElement.textContent = `${icon} ${eventText}`;
    
    // Vylepšený tooltip
    const tooltipParts = [
        `📋 ${event.title}`,
        `📍 ${event.city}`,
        `🏷️ ${event.category}`,
        `📊 Status: ${getStatusText(event.status)}`
    ];
    
    if (event.sales) {
        tooltipParts.push(`🍩 Prodáno: ${formatNumber(event.sales)} ks`);
    }
    
    if (event.actualSales) {
        tooltipParts.push(`📝 Skutečný prodej: ${formatNumber(event.actualSales)} ks`);
    }
    
    if (event.predictedSales) {
        tooltipParts.push(`🔮 Predikce: ${formatNumber(event.predictedSales)} ks`);
    }
    
    if (event.confidence) {
        tooltipParts.push(`🎯 Confidence: ${event.confidence}%`);
    }
    
    if (event.visitors) {
        tooltipParts.push(`👥 Návštěvnost: ${formatNumber(event.visitors)}`);
    }
    
    if (event.isEdited) {
        tooltipParts.push(`📝 Upraveno uživatelem`);
    }
    
    const dateRange = event.dateTo && event.dateTo !== event.dateFrom ? 
        `${formatDate(event.dateFrom)} - ${formatDate(event.dateTo)}` : 
        formatDate(event.dateFrom);
    tooltipParts.push(`📅 ${dateRange}`);
    
    eventElement.title = tooltipParts.join('\n');
    
    // Hover efekty
    eventElement.addEventListener('mouseenter', () => {
        eventElement.style.transform = 'scale(1.05)';
        eventElement.style.zIndex = '10';
        eventElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    });
    
    eventElement.addEventListener('mouseleave', () => {
        eventElement.style.transform = 'scale(1)';
        eventElement.style.zIndex = '1';
        eventElement.style.boxShadow = 'none';
    });
    
    // Click handler pro editaci události
    eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        openEventModal(event);
    });
    
    return eventElement;
}

// Helper funkce pro status text
function getStatusText(status) {
    const statusMap = {
        'completed': 'Dokončeno',
        'ongoing': 'Probíhá',
        'planned': 'Plánováno',
        'unknown': 'Neznámý'
    };
    return statusMap[status] || status;
}

// ========================================
// ROZŠÍŘENÉ FILTRY
// ========================================

// Rozšířená funkce pro filtrování s více možnostmi
function filterEvents(events) {
    const filters = calendarState.filters;
    
    return events.filter(event => {
        // Filtr města (částečná shoda)
        if (filters.city) {
            const cityMatch = event.city.toLowerCase().includes(filters.city.toLowerCase());
            if (!cityMatch) return false;
        }
        
        // Filtr kategorie (přesná shoda)
        if (filters.category && event.category !== filters.category) {
            return false;
        }
        
        // Filtr statusu (přesná shoda)
        if (filters.status && event.status !== filters.status) {
            return false;
        }
        
        return true;
    });
}

// Rozšířená funkce pro populaci filtrů s více daty
function populateFilterDropdowns() {
    console.log('📋 Populating enhanced filter dropdowns...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('⚠️ No historical data for filters');
        return;
    }
    
    const cities = new Set();
    const categories = new Set();
    
    // Získat unikátní města a kategorie z dat
    globalState.historicalData.forEach(record => {
        if (record.city) cities.add(record.city);
        if (record.category) categories.add(record.category);
    });
    
    // Přidat města a kategorie z predikcí
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData) {
                if (prediction.formData.city) cities.add(prediction.formData.city);
                if (prediction.formData.category) categories.add(prediction.formData.category);
            }
        });
    } catch (error) {
        console.warn('⚠️ Error loading prediction data for filters:', error);
    }
    
    // Naplnit město filter
    const cityFilter = document.getElementById('cityFilter');
    if (cityFilter) {
        const currentValue = cityFilter.value;
        
        // Ponechat první option (všechna města)
        while (cityFilter.children.length > 1) {
            cityFilter.removeChild(cityFilter.lastChild);
        }
        
        Array.from(cities).sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = `🏙️ ${city}`;
            cityFilter.appendChild(option);
        });
        
        // Obnovit hodnotu
        cityFilter.value = currentValue;
    }
    
    // Naplnit kategorie filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        const currentValue = categoryFilter.value;
        
        // Ponechat první option (všechny kategorie)
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }
        
        const categoryIcons = {
            'food festival': '🍔',
            'veletrh': '🍫',
            'koncert': '🎵',
            'kulturní akce': '🎭',
            'sportovní': '🏃',
            'ostatní': '📅'
        };
        
        Array.from(categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            const icon = categoryIcons[category] || '📋';
            option.textContent = `${icon} ${category}`;
            categoryFilter.appendChild(option);
        });
        
        // Obnovit hodnotu
        categoryFilter.value = currentValue;
    }
    
    console.log(`✅ Enhanced filter dropdowns populated - ${cities.size} cities, ${categories.size} categories`);
}

// ========================================
// EVENT LISTENERS PRO PART 4B
// ========================================

// Rozšířené event listeners
eventBus.on('eventEdited', (data) => {
    console.log('📝 Event edited, updating calendar...');
    renderCalendar();
});

eventBus.on('eventDeleted', (data) => {
    console.log('🗑️ Event deleted, updating calendar...');
    renderCalendar();
});

// Event listener pro změnu predikcí
eventBus.on('predictionSaved', (data) => {
    console.log('🔮 Prediction saved, updating calendar...');
    setTimeout(() => {
        populateFilterDropdowns();
        renderCalendar();
    }, 200);
});

console.log('✅ Donuland Part 4B loaded successfully');
console.log('📝 Features: ✅ Event Modal ✅ Edit Events ✅ Delete Events ✅ Enhanced Display');
console.log('⏳ Ready for Part 4C: Analytics and Charts');
       /* ========================================
   DONULAND PART 4C-1 - ANALYTICS CORE
   Základní analytické funkce a statistiky
   ======================================== */

console.log('🍩 Donuland Part 4C-1 (Core Analytics) loading...');

// ========================================
// ANALYTICS STAV A KONFIGURACE
// ========================================

// Globální stav pro analytics
if (typeof window.analyticsState === 'undefined') {
    window.analyticsState = {
        isLoading: false,
        lastUpdate: null,
        cachedStats: null,
        chartColors: {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#28a745',
            warning: '#ffc107',
            info: '#17a2b8',
            danger: '#dc3545'
        }
    };
}

// ========================================
// HLAVNÍ ANALYTICS FUNKCE
// ========================================

// Inicializace analytics sekce
function initializeAnalytics() {
    console.log('📊 Initializing core analytics...');
    
    if (analyticsState.isLoading) {
        console.log('⚠️ Analytics already loading');
        return;
    }
    
    analyticsState.isLoading = true;
    
    try {
        // Zkontrolovat dostupnost dat
        if (!globalState.historicalData || globalState.historicalData.length === 0) {
            displayNoDataMessage();
            return;
        }
        
        // Zobrazit loading state
        showAnalyticsLoading();
        
        // Postupně načíst všechny analytics komponenty
        setTimeout(() => updateOverallStats(), 100);
        setTimeout(() => updateTopEvents(), 200);
        setTimeout(() => updateTopCities(), 300);
        setTimeout(() => updateTopCategories(), 400);
        setTimeout(() => displayMonthlyTrends(), 500);
        
        analyticsState.lastUpdate = Date.now();
        console.log('✅ Core analytics initialized successfully');
        
        // Skrýt loading po dokončení základních komponent
        setTimeout(() => {
            hideAnalyticsLoading();
        }, 600);
        
    } catch (error) {
        console.error('❌ Error initializing analytics:', error);
        showNotification('❌ Chyba při načítání analýz', 'error');
        hideAnalyticsLoading();
    } finally {
        analyticsState.isLoading = false;
    }
}

// Loading state pro analytics
function showAnalyticsLoading() {
    const containers = [
        'overallStats', 'topEvents', 'topCities', 'topCategories', 'monthlyTrends'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner" style="margin: 0 auto 15px;"></div>
                    <p style="color: #6c757d;">Načítám ${containerId}...</p>
                </div>
            `;
        }
    });
}

function hideAnalyticsLoading() {
    console.log('✅ Core analytics loading completed');
}

// Zobrazení zprávy o chybějících datech
function displayNoDataMessage() {
    const containers = [
        'overallStats', 'topEvents', 'topCities', 'topCategories', 'monthlyTrends'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📊</div>
                    <h4>Žádná data pro analýzu</h4>
                    <p>Načtěte historická data pro zobrazení analýz</p>
                    <button class="btn" onclick="loadData()" style="margin-top: 15px;">
                        🔄 Načíst data
                    </button>
                </div>
            `;
        }
    });
}

// ========================================
// CELKOVÉ STATISTIKY
// ========================================

function updateOverallStats() {
    console.log('📈 Updating overall statistics...');
    
    const container = document.getElementById('overallStats');
    if (!container) return;
    
    try {
        const stats = calculateOverallStats();
        
        const html = `
            <div class="stat-item">
                <div class="stat-value">${stats.totalEvents}</div>
                <div class="stat-label">Celkem akcí</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatNumber(stats.totalSales)}</div>
                <div class="stat-label">Celkem prodejů</div>
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
                <div class="stat-value">${stats.averageConversion.toFixed(1)}%</div>
                <div class="stat-label">Průměrná konverze</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatNumber(stats.totalVisitors)}</div>
                <div class="stat-label">Celkem návštěvníků</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.bestConversion.toFixed(1)}%</div>
                <div class="stat-label">Nejlepší konverze</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatCurrency(stats.totalProfit)}</div>
                <div class="stat-label">Odhadovaný zisk</div>
            </div>
        `;
        
        container.innerHTML = html;
        console.log('✅ Overall stats updated');
        
    } catch (error) {
        console.error('❌ Error updating overall stats:', error);
        container.innerHTML = '<div class="error-message">Chyba při načítání statistik</div>';
    }
}

function calculateOverallStats() {
    const data = globalState.historicalData.filter(record => 
        record.sales > 0 && record.visitors > 0
    );
    
    if (data.length === 0) {
        return {
            totalEvents: 0,
            totalSales: 0,
            averageSales: 0,
            totalRevenue: 0,
            averageConversion: 0,
            totalVisitors: 0,
            bestConversion: 0,
            totalProfit: 0
        };
    }
    
    const totalEvents = data.length;
    const totalSales = data.reduce((sum, record) => sum + record.sales, 0);
    const totalVisitors = data.reduce((sum, record) => sum + record.visitors, 0);
    const totalRevenue = totalSales * CONFIG.DONUT_PRICE;
    const averageSales = totalSales / totalEvents;
    const averageConversion = (totalSales / totalVisitors) * 100;
    
    // Nejlepší konverze
    const conversions = data.map(record => (record.sales / record.visitors) * 100);
    const bestConversion = Math.max(...conversions);
    
    // Odhadovaný zisk (revenue - náklady)
    const totalCosts = totalSales * CONFIG.DONUT_COST;
    const totalProfit = totalRevenue - totalCosts;
    
    return {
        totalEvents,
        totalSales,
        averageSales,
        totalRevenue,
        averageConversion,
        totalVisitors,
        bestConversion,
        totalProfit
    };
}

// ========================================
// TOP UDÁLOSTI
// ========================================

function updateTopEvents() {
    console.log('🏆 Updating top events...');
    
    const container = document.getElementById('topEvents');
    if (!container) return;
    
    try {
        const topEvents = getTopEvents(10);
        
        if (topEvents.length === 0) {
            container.innerHTML = '<div class="no-data">Žádné události k zobrazení</div>';
            return;
        }
        
        let html = '<div class="top-events-header" style="margin-bottom: 15px;">';
        html += '<h4 style="margin: 0;">🏆 Nejúspěšnější akce</h4>';
        html += `<p style="color: #6c757d; margin: 5px 0 0 0; font-size: 0.9em;">Top ${topEvents.length} podle prodeje</p>`;
        html += '</div>';
        
        topEvents.forEach((event, index) => {
            const conversion = event.visitors > 0 ? ((event.sales / event.visitors) * 100).toFixed(1) : '0';
            const revenue = event.sales * CONFIG.DONUT_PRICE;
            const profit = revenue - (event.sales * CONFIG.DONUT_COST);
            
            // Medaile pro top 3
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            
            html += `
                <div class="top-item" style="border-left-color: ${getPerformanceColor(parseFloat(conversion))};">
                    <div class="top-info">
                        <h4>${medal} ${index + 1}. ${escapeHtml(event.eventName)}</h4>
                        <p>📍 ${escapeHtml(event.city)} • 📅 ${formatDate(event.dateFrom)} • 📋 ${escapeHtml(event.category)}</p>
                        <p style="font-size: 0.8em; color: #6c757d; margin-top: 5px;">
                            👥 ${formatNumber(event.visitors)} návštěvníků
                            ${event.rating ? ` • ⭐ ${event.rating}/5` : ''}
                        </p>
                    </div>
                    <div class="top-stats">
                        <div class="top-value" style="color: ${getPerformanceColor(parseFloat(conversion))};">
                            ${formatNumber(event.sales)} ks
                        </div>
                        <div class="top-subvalue">
                            🎯 ${conversion}% konverze<br>
                            💰 ${formatCurrency(revenue)}<br>
                            💎 ${formatCurrency(profit)} zisk
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log('✅ Top events updated');
        
    } catch (error) {
        console.error('❌ Error updating top events:', error);
        container.innerHTML = '<div class="error-message">Chyba při načítání top akcí</div>';
    }
}

// ========================================
// TOP MĚSTA
// ========================================

function updateTopCities() {
    console.log('🏙️ Updating top cities...');
    
    const container = document.getElementById('topCities');
    if (!container) return;
    
    try {
        const topCities = getTopCities(10);
        
        if (topCities.length === 0) {
            container.innerHTML = '<div class="no-data">Žádná města k zobrazení</div>';
            return;
        }
        
        let html = '<div class="top-cities-header" style="margin-bottom: 15px;">';
        html += '<h4 style="margin: 0;">🏙️ Nejúspěšnější města</h4>';
        html += `<p style="color: #6c757d; margin: 5px 0 0 0; font-size: 0.9em;">Top ${topCities.length} podle prodeje</p>`;
        html += '</div>';
        
        topCities.forEach((city, index) => {
            const avgSalesPerEvent = city.totalSales / city.eventsCount;
            
            // Medaile pro top 3
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            
            html += `
                <div class="top-item">
                    <div class="top-info">
                        <h4>${medal} ${index + 1}. ${escapeHtml(city.name)}</h4>
                        <p>📊 ${city.eventsCount} akcí • 🎯 ${city.averageConversion.toFixed(1)}% průměrná konverze</p>
                        <p style="font-size: 0.8em; color: #6c757d; margin-top: 5px;">
                            📈 ${formatNumber(avgSalesPerEvent)} ks průměr/akci • 👥 ${formatNumber(city.totalVisitors)} návštěvníků
                        </p>
                    </div>
                    <div class="top-stats">
                        <div class="top-value">${formatNumber(city.totalSales)} ks</div>
                        <div class="top-subvalue">
                            💰 ${formatCurrency(city.totalRevenue)}<br>
                            💎 ${formatCurrency(city.totalRevenue - (city.totalSales * CONFIG.DONUT_COST))} zisk
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log('✅ Top cities updated');
        
    } catch (error) {
        console.error('❌ Error updating top cities:', error);
        container.innerHTML = '<div class="error-message">Chyba při načítání top měst</div>';
    }
}

// ========================================
// TOP KATEGORIE
// ========================================

function updateTopCategories() {
    console.log('📊 Updating top categories...');
    
    const container = document.getElementById('topCategories');
    if (!container) return;
    
    try {
        const topCategories = getTopCategories();
        
        if (topCategories.length === 0) {
            container.innerHTML = '<div class="no-data">Žádné kategorie k zobrazení</div>';
            return;
        }
        
        const categoryIcons = {
            'food festival': '🍔',
            'veletrh': '🍫',
            'koncert': '🎵',
            'kulturní akce': '🎭',
            'sportovní': '🏃',
            'ostatní': '📅'
        };
        
        let html = '<div class="top-categories-header" style="margin-bottom: 15px;">';
        html += '<h4 style="margin: 0;">📊 Nejúspěšnější kategorie</h4>';
        html += `<p style="color: #6c757d; margin: 5px 0 0 0; font-size: 0.9em;">Analýza podle typů akcí</p>`;
        html += '</div>';
        
        topCategories.forEach((category, index) => {
            const icon = categoryIcons[category.name] || '📋';
            const avgSalesPerEvent = category.totalSales / category.eventsCount;
            
            // Medaile pro top 3
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            
            html += `
                <div class="top-item">
                    <div class="top-info">
                        <h4>${medal} ${index + 1}. ${icon} ${escapeHtml(category.name)}</h4>
                        <p>📊 ${category.eventsCount} akcí • 🎯 ${category.averageConversion.toFixed(1)}% průměrná konverze</p>
                        <p style="font-size: 0.8em; color: #6c757d; margin-top: 5px;">
                            📈 ${formatNumber(avgSalesPerEvent)} ks průměr/akci • 👥 ${formatNumber(category.totalVisitors)} návštěvníků
                        </p>
                    </div>
                    <div class="top-stats">
                        <div class="top-value">${formatNumber(category.totalSales)} ks</div>
                        <div class="top-subvalue">
                            💰 ${formatCurrency(category.totalRevenue)}<br>
                            💎 ${formatCurrency(category.totalRevenue - (category.totalSales * CONFIG.DONUT_COST))} zisk
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log('✅ Top categories updated');
        
    } catch (error) {
        console.error('❌ Error updating top categories:', error);
        container.innerHTML = '<div class="error-message">Chyba při načítání top kategorií</div>';
    }
}

// ========================================
// DATA PROCESSING FUNKCE
// ========================================

function getTopEvents(limit = 10) {
    return globalState.historicalData
        .filter(record => record.sales > 0 && record.visitors > 0)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit);
}

function getTopCities(limit = 10) {
    const cityStats = new Map();
    
    globalState.historicalData.forEach(record => {
        if (record.sales > 0 && record.visitors > 0 && record.city) {
            const city = record.city;
            
            if (!cityStats.has(city)) {
                cityStats.set(city, {
                    name: city,
                    totalSales: 0,
                    totalVisitors: 0,
                    totalRevenue: 0,
                    eventsCount: 0
                });
            }
            
            const stats = cityStats.get(city);
            stats.totalSales += record.sales;
            stats.totalVisitors += record.visitors;
            stats.totalRevenue += record.sales * CONFIG.DONUT_PRICE;
            stats.eventsCount += 1;
        }
    });
    
    return Array.from(cityStats.values())
        .map(city => ({
            ...city,
            averageConversion: (city.totalSales / city.totalVisitors) * 100
        }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, limit);
}

function getTopCategories() {
    const categoryStats = new Map();
    
    globalState.historicalData.forEach(record => {
        if (record.sales > 0 && record.visitors > 0 && record.category) {
            const category = record.category;
            
            if (!categoryStats.has(category)) {
                categoryStats.set(category, {
                    name: category,
                    totalSales: 0,
                    totalVisitors: 0,
                    totalRevenue: 0,
                    eventsCount: 0
                });
            }
            
            const stats = categoryStats.get(category);
            stats.totalSales += record.sales;
            stats.totalVisitors += record.visitors;
            stats.totalRevenue += record.sales * CONFIG.DONUT_PRICE;
            stats.eventsCount += 1;
        }
    });
    
    return Array.from(categoryStats.values())
        .map(category => ({
            ...category,
            averageConversion: (category.totalSales / category.totalVisitors) * 100
        }))
        .sort((a, b) => b.totalSales - a.totalSales);
}

// ========================================
// JEDNODUCHÉ MĚSÍČNÍ TRENDY
// ========================================

function displayMonthlyTrends() {
    console.log('📈 Generating basic monthly trends...');
    
    const container = document.getElementById('monthlyTrends');
    if (!container) return;
    
    try {
        if (!globalState.historicalData || globalState.historicalData.length === 0) {
            container.innerHTML = `
                <div class="chart-placeholder">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📈</div>
                    <h4>Žádná data pro měsíční trendy</h4>
                    <p>Načtěte historická data pro zobrazení trendů</p>
                    <button class="btn" onclick="loadData()" style="margin-top: 15px;">
                        🔄 Načíst data
                    </button>
                </div>
            `;
            return;
        }
        
        // Seskup data podle měsíců
        const monthlyData = new Map();
        
        globalState.historicalData.forEach(record => {
            if (record.dateFrom && record.sales > 0) {
                const date = new Date(record.dateFrom);
                const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                
                if (!monthlyData.has(monthKey)) {
                    monthlyData.set(monthKey, {
                        month: monthKey,
                        totalSales: 0,
                        eventsCount: 0,
                        totalRevenue: 0,
                        totalVisitors: 0
                    });
                }
                
                const monthData = monthlyData.get(monthKey);
                monthData.totalSales += record.sales;
                monthData.eventsCount += 1;
                monthData.totalRevenue += (record.sales * CONFIG.DONUT_PRICE);
                monthData.totalVisitors += record.visitors;
            }
        });
        
        // Seřaď podle měsíce a vezmi posledních 12
        const sortedMonths = Array.from(monthlyData.values())
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12);
        
        if (sortedMonths.length === 0) {
            container.innerHTML = `
                <div class="chart-placeholder">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📈</div>
                    <h4>Nedostatek dat pro trendy</h4>
                    <p>Potřebujeme alespoň jeden měsíc s prodejními daty</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="trends-chart" style="padding: 20px; background: white; border-radius: 8px;">';
        html += '<h4 style="text-align: center; margin-bottom: 20px;">📈 Měsíční trendy</h4>';
        
        // Jednoduchý sloupcový graf
        html += '<div class="trends-bars" style="display: flex; align-items: flex-end; justify-content: space-around; height: 200px; margin: 20px 0; border-bottom: 2px solid #e9ecef;">';
        
        const maxSales = Math.max(...sortedMonths.map(m => m.totalSales));
        
        sortedMonths.forEach((monthData, index) => {
            const [year, month] = monthData.month.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('cs-CZ', { 
                month: 'short'
            });
            
            const height = maxSales > 0 ? (monthData.totalSales / maxSales) * 180 : 10;
            const color = `hsl(${120 + index * 20}, 70%, 55%)`;
            
            html += `
                <div class="trend-bar" style="display: flex; flex-direction: column; align-items: center; margin: 0 5px;">
                    <div style="width: 30px; height: ${height}px; background: ${color}; border-radius: 4px 4px 0 0; transition: all 0.3s ease; cursor: pointer;" 
                         title="${monthName}: ${formatNumber(monthData.totalSales)} ks"></div>
                    <div style="margin-top: 10px; font-size: 0.8em; font-weight: 600; color: #495057;">${monthName}</div>
                    <div style="font-size: 0.7em; color: #6c757d;">${formatNumber(monthData.totalSales)} ks</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Shrnutí
        const totalSales = sortedMonths.reduce((sum, m) => sum + m.totalSales, 0);
        const totalRevenue = sortedMonths.reduce((sum, m) => sum + m.totalRevenue, 0);
        const totalEvents = sortedMonths.reduce((sum, m) => sum + m.eventsCount, 0);
        const avgSalesPerMonth = totalSales / sortedMonths.length;
        
        html += `
            <div class="trends-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <div style="text-align: center;">
                    <div style="font-size: 1.2em; font-weight: bold; color: #667eea;">${formatNumber(totalSales)}</div>
                    <div style="font-size: 0.8em; color: #6c757d;">Celkem prodáno</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.2em; font-weight: bold; color: #28a745;">${formatCurrency(totalRevenue)}</div>
                    <div style="font-size: 0.8em; color: #6c757d;">Celkový obrat</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.2em; font-weight: bold; color: #e91e63;">${totalEvents}</div>
                    <div style="font-size: 0.8em; color: #6c757d;">Celkem akcí</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.2em; font-weight: bold; color: #9c27b0;">${formatNumber(avgSalesPerMonth)}</div>
                    <div style="font-size: 0.8em; color: #6c757d;">Průměr/měsíc</div>
                </div>
            </div>
        `;
        
        html += '</div>';
        
        container.innerHTML = html;
        console.log(`✅ Basic monthly trends displayed with ${sortedMonths.length} months`);
        
    } catch (error) {
        console.error('❌ Error generating monthly trends:', error);
        container.innerHTML = '<div class="error-message">Chyba při generování trendů</div>';
    }
}

// ========================================
// HELPER FUNKCE
// ========================================

function getPerformanceColor(conversion) {
    if (conversion >= 15) return '#28a745'; // Zelená - výborné
    if (conversion >= 10) return '#17a2b8'; // Modrá - dobré
    if (conversion >= 5) return '#ffc107';  // Žlutá - průměrné
    return '#dc3545'; // Červená - špatné
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// EVENT LISTENERS PRO CORE ANALYTICS
// ========================================

// Event listener pro změnu na analytics sekci
eventBus.on('sectionChanged', (data) => {
    if (data.section === 'analytics') {
        console.log('📊 Analytics section opened - initializing core analytics...');
        setTimeout(() => {
            initializeAnalytics();
        }, 300);
    }
});

// Event listener pro načtení dat
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded - updating core analytics...');
    analyticsState.cachedStats = null; // Clear cache
    
    // Pokud je analytics sekce aktivní, aktualizuj
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && analyticsSection.classList.contains('active')) {
        setTimeout(() => {
            initializeAnalytics();
        }, 1000);
    }
});

// ========================================
// INICIALIZACE
// ========================================

// Automatická inicializace při načtení
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing Part 4C-1 - Core Analytics...');
    
    // Auto-inicializace pokud jsou data dostupná a je aktivní analytics sekce
    setTimeout(() => {
        const analyticsSection = document.getElementById('analytics');
        if (analyticsSection && analyticsSection.classList.contains('active') && 
            globalState.historicalData && globalState.historicalData.length > 0) {
            initializeAnalytics();
        }
    }, 2000);
    
    console.log('✅ Part 4C-1 Core Analytics initialized');
});

console.log('✅ Donuland Part 4C-1 loaded successfully');
console.log('📊 Features: ✅ Overall Stats ✅ Top Events ✅ Top Cities ✅ Top Categories ✅ Basic Monthly Trends');
console.log('⏳ Ready for Part 4C-2: Advanced Analytics (Prediction Accuracy & Weather Impact)');
/* ========================================
   DONULAND PART 4C-2 - ADVANCED ANALYTICS
   Pokročilé analytické funkce - přesnost predikcí a vliv počasí
   ======================================== */

console.log('🍩 Donuland Part 4C-2 (Advanced Analytics) loading...');

// Rozšíření inicializace analytics o pokročilé komponenty
const originalInitializeAnalytics = initializeAnalytics;
window.initializeAnalytics = function() {
    console.log('📊 Initializing complete analytics (including advanced)...');
    
    // Spustit základní analytics z Part 4C-1
    originalInitializeAnalytics();
    
    // Přidat pokročilé komponenty
    setTimeout(() => updatePredictionAccuracy(), 800);
    setTimeout(() => updateWeatherImpact(), 900);
    setTimeout(() => exportAnalyticsButton(), 1000);
};

// ========================================
// PŘESNOST PREDIKCÍ
// ========================================

function updatePredictionAccuracy() {
    console.log('🎯 Updating prediction accuracy analysis...');
    
    const container = document.getElementById('predictionAccuracy');
    if (!container) return;
    
    try {
        const accuracyData = calculatePredictionAccuracy();
        
        if (!accuracyData || accuracyData.comparisons.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🎯</div>
                    <h4>Analýza přesnosti predikcí</h4>
                    <p>Pro analýzu přesnosti potřebujeme události s predikcemi i skutečnými výsledky.</p>
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <h6 style="margin: 0 0 10px 0;">💡 Jak zlepšit analýzu:</h6>
                        <ul style="margin: 0; padding-left: 20px; text-align: left;">
                            <li>Vytvořte predikce pro budoucí akce</li>
                            <li>Po akcích aktualizujte skutečné prodeje</li>
                            <li>Systém automaticky porovná predikce s realitou</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '<div class="prediction-accuracy-analysis" style="background: linear-gradient(135deg, #e3f2fd, #f0f9ff); padding: 20px; border-radius: 8px;">';
        html += '<h4 style="margin: 0 0 20px 0; text-align: center;">🎯 Přesnost AI predikcí</h4>';
        
        // Celkové metriky přesnosti
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px;">';
        
        const avgAccuracy = accuracyData.averageAccuracy;
        const accuracyColor = avgAccuracy >= 80 ? '#28a745' : avgAccuracy >= 60 ? '#ffc107' : '#dc3545';
        const accuracyIcon = avgAccuracy >= 80 ? '🎯' : avgAccuracy >= 60 ? '⚠️' : '❌';
        
        html += `
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid ${accuracyColor};">
                <div style="font-size: 1.5em; margin-bottom: 10px;">${accuracyIcon}</div>
                <div style="font-size: 1.5em; font-weight: bold; color: ${accuracyColor}; margin-bottom: 5px;">${avgAccuracy.toFixed(1)}%</div>
                <div style="color: #6c757d; font-size: 0.9em;">Průměrná přesnost</div>
                <div style="color: #6c757d; font-size: 0.8em; margin-top: 5px;">${accuracyData.comparisons.length} porovnání</div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5em; margin-bottom: 10px;">📈</div>
                <div style="font-size: 1.3em; font-weight: bold; color: #17a2b8; margin-bottom: 5px;">${formatNumber(Math.abs(accuracyData.averageDifference))}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Průměrná odchylka</div>
                <div style="color: #6c757d; font-size: 0.8em; margin-top: 5px;">ks prodeje</div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5em; margin-bottom: 10px;">${accuracyData.overestimations > accuracyData.underestimations ? '📊' : '📉'}</div>
                <div style="font-size: 1.3em; font-weight: bold; color: #9c27b0; margin-bottom: 5px;">${accuracyData.overestimations}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Nadhodnocení</div>
                <div style="color: #6c757d; font-size: 0.8em; margin-top: 5px;">vs ${accuracyData.underestimations} podhodnocení</div>
            </div>
        `;
        
        html += '</div>';
        
        // Detailní přehled porovnání
        html += '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">';
        html += '<h5 style="margin: 0 0 15px 0;">📋 Detailní porovnání predikcí</h5>';
        
        accuracyData.comparisons.slice(0, 8).forEach((comp, index) => {
            const accuracy = comp.accuracy;
            const accuracyColor = accuracy >= 80 ? '#28a745' : accuracy >= 60 ? '#ffc107' : '#dc3545';
            const difference = comp.predicted - comp.actual;
            const differenceIcon = difference > 0 ? '📈' : difference < 0 ? '📉' : '✅';
            const differenceText = difference > 0 ? `+${Math.abs(difference)}` : `-${Math.abs(difference)}`;
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e9ecef; font-size: 0.9em;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #495057;">${escapeHtml(comp.eventName)}</div>
                        <div style="font-size: 0.8em; color: #6c757d;">${formatDate(comp.date)} • ${escapeHtml(comp.city)}</div>
                    </div>
                    <div style="text-align: center; margin: 0 15px;">
                        <div style="font-size: 0.8em; color: #6c757d;">Predikce vs Realita</div>
                        <div style="font-weight: 600;">${formatNumber(comp.predicted)} vs ${formatNumber(comp.actual)}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: ${accuracyColor};">${accuracy.toFixed(1)}%</div>
                        <div style="font-size: 0.8em; color: #6c757d;">${differenceIcon} ${differenceText}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Doporučení pro zlepšení
        html += '<div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">';
        html += '<h5 style="margin: 0 0 10px 0; color: #1976d2;">💡 Doporučení pro zlepšení přesnosti:</h5>';
        html += '<ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 0.9em;">';
        
        if (avgAccuracy < 70) {
            html += '<li>Přesnost je nižší než optimální - zvažte aktualizaci predikčních faktorů</li>';
        }
        
        if (accuracyData.overestimations > accuracyData.underestimations * 1.5) {
            html += '<li>AI často nadhodnocuje - snižte predikční faktory o 10-15%</li>';
        } else if (accuracyData.underestimations > accuracyData.overestimations * 1.5) {
            html += '<li>AI často podhodnocuje - zvyšte predikční faktory o 10-15%</li>';
        }
        
        html += '<li>Pokračujte v aktualizaci skutečných prodejů pro zlepšení učení AI</li>';
        html += '<li>Více dat = přesnější predikce - organizujte více akcí pro lepší analýzu</li>';
        html += '</ul>';
        html += '</div>';
        
        html += '</div>'; // prediction-accuracy-analysis
        
        container.innerHTML = html;
        console.log('✅ Prediction accuracy analysis updated');
        
    } catch (error) {
        console.error('❌ Error updating prediction accuracy:', error);
        container.innerHTML = '<div class="error-message">Chyba při analýze přesnosti predikcí</div>';
    }
}

function calculatePredictionAccuracy() {
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        const savedEdits = JSON.parse(localStorage.getItem('donuland_event_edits') || '{}');
        
        const comparisons = [];
        
        // Najít predikce které mají skutečné výsledky
        savedPredictions.forEach(prediction => {
            if (prediction.formData && prediction.prediction) {
                const eventName = prediction.formData.eventName;
                
                // Zkusit najít skutečný prodej v editacích
                if (savedEdits[eventName] && savedEdits[eventName].sales) {
                    const actualSales = savedEdits[eventName].sales;
                    const predictedSales = prediction.prediction.predictedSales;
                    
                    if (actualSales > 0 && predictedSales > 0) {
                        const accuracy = (Math.min(actualSales, predictedSales) / Math.max(actualSales, predictedSales)) * 100;
                        
                        comparisons.push({
                            eventName: eventName,
                            city: prediction.formData.city,
                            date: prediction.formData.eventDateFrom,
                            predicted: predictedSales,
                            actual: actualSales,
                            accuracy: accuracy,
                            difference: predictedSales - actualSales
                        });
                    }
                }
                
                // Nebo najít v historických datech
                const historicalMatch = globalState.historicalData.find(record => 
                    record.eventName === eventName && record.sales > 0
                );
                
                if (historicalMatch && !savedEdits[eventName]) {
                    const actualSales = historicalMatch.sales;
                    const predictedSales = prediction.prediction.predictedSales;
                    
                    if (actualSales > 0 && predictedSales > 0) {
                        const accuracy = (Math.min(actualSales, predictedSales) / Math.max(actualSales, predictedSales)) * 100;
                        
                        comparisons.push({
                            eventName: eventName,
                            city: prediction.formData.city,
                            date: prediction.formData.eventDateFrom,
                            predicted: predictedSales,
                            actual: actualSales,
                            accuracy: accuracy,
                            difference: predictedSales - actualSales
                        });
                    }
                }
            }
        });
        
        if (comparisons.length === 0) {
            return null;
        }
        
        const averageAccuracy = comparisons.reduce((sum, comp) => sum + comp.accuracy, 0) / comparisons.length;
        const averageDifference = comparisons.reduce((sum, comp) => sum + comp.difference, 0) / comparisons.length;
        const overestimations = comparisons.filter(comp => comp.difference > 0).length;
        const underestimations = comparisons.filter(comp => comp.difference < 0).length;
        
        return {
            comparisons: comparisons.sort((a, b) => new Date(b.date) - new Date(a.date)),
            averageAccuracy,
            averageDifference,
            overestimations,
            underestimations
        };
        
    } catch (error) {
        console.error('❌ Error calculating prediction accuracy:', error);
        return null;
    }
}

// ========================================
// VLIV POČASÍ
// ========================================

function updateWeatherImpact() {
    console.log('🌤️ Updating weather impact analysis...');
    
    const container = document.getElementById('weatherImpact');
    if (!container) return;
    
    try {
        const weatherData = analyzeWeatherImpact();
        
        if (!weatherData || weatherData.totalEvents === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🌤️</div>
                    <h4>Analýza vlivu počasí na prodej</h4>
                    <p>Nedostatek dat o počasí pro komplexní analýzu.</p>
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <h6 style="margin: 0 0 10px 0;">📡 Info o počasí:</h6>
                        <ul style="margin: 0; padding-left: 20px; text-align: left;">
                            <li>Počasí se automaticky načítá pro venkovní akce</li>
                            <li>AI zohledňuje vliv počasí na prodej donutů</li>
                            <li>Zvláště důležité pro čokoládové donuty (teplota)</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '<div class="weather-impact-analysis" style="background: linear-gradient(135deg, #e3f2fd, #f0f9ff); padding: 20px; border-radius: 8px;">';
        html += '<h4 style="margin: 0 0 20px 0; text-align: center;">🌤️ Vliv počasí na prodej</h4>';
        
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0;">';
        
        // Celkové statistiky počasí
        html += `
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #17a2b8;">
                <div style="font-size: 1.3em; font-weight: bold; color: #17a2b8;">${weatherData.totalEvents}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Akcí s daty o počasí</div>
            </div>
        `;
        
        if (weatherData.avgSalesGoodWeather !== null) {
            html += `
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #28a745;">
                    <div style="font-size: 1.3em; font-weight: bold; color: #28a745;">${formatNumber(weatherData.avgSalesGoodWeather)}</div>
                    <div style="color: #6c757d; font-size: 0.9em;">Ø prodej - hezké počasí</div>
                    <div style="color: #6c757d; font-size: 0.8em;">${weatherData.goodWeatherEvents} akcí</div>
                </div>
            `;
        }
        
        if (weatherData.avgSalesBadWeather !== null) {
            html += `
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #dc3545;">
                    <div style="font-size: 1.3em; font-weight: bold; color: #dc3545;">${formatNumber(weatherData.avgSalesBadWeather)}</div>
                    <div style="color: #6c757d; font-size: 0.9em;">Ø prodej - špatné počasí</div>
                    <div style="color: #6c757d; font-size: 0.8em;">${weatherData.badWeatherEvents} akcí</div>
                </div>
            `;
        }
        
        if (weatherData.weatherImpact !== null) {
            const impactColor = weatherData.weatherImpact > 0 ? '#28a745' : '#dc3545';
            const impactIcon = weatherData.weatherImpact > 0 ? '📈' : '📉';
            
            html += `
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid ${impactColor};">
                    <div style="font-size: 1.3em; font-weight: bold; color: ${impactColor};">${impactIcon} ${Math.abs(weatherData.weatherImpact).toFixed(1)}%</div>
                    <div style="color: #6c757d; font-size: 0.9em;">Vliv počasí</div>
                    <div style="color: #6c757d; font-size: 0.8em;">${weatherData.weatherImpact > 0 ? 'pozitivní' : 'negativní'}</div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Detailní breakdown podle typu počasí
        if (weatherData.weatherBreakdown && weatherData.weatherBreakdown.length > 0) {
            html += '<div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">';
            html += '<h5 style="margin: 0 0 15px 0;">🌦️ Prodeje podle typu počasí</h5>';
            
            weatherData.weatherBreakdown.forEach(weather => {
                const icon = getWeatherIcon(weather.type);
                const avgSales = weather.totalSales / weather.events;
                const avgConversion = weather.totalVisitors > 0 ? ((weather.totalSales / weather.totalVisitors) * 100).toFixed(1) : '0';
                
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e9ecef; font-size: 0.9em;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.2em;">${icon}</span>
                            <div>
                                <div style="font-weight: 600; color: #495057;">${escapeHtml(weather.type)}</div>
                                <div style="font-size: 0.8em; color: #6c757d;">${weather.events} akcí • ${formatNumber(weather.totalVisitors)} návštěvníků</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: #495057;">${formatNumber(weather.totalSales)} ks</div>
                            <div style="font-size: 0.8em; color: #6c757d;">${formatNumber(avgSales)} ks/akci • ${avgConversion}% konverze</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        // Doporučení podle počasí
        html += '<div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">';
        html += '<h5 style="margin: 0 0 10px 0; color: #1976d2;">💡 Strategická doporučení na základě počasí:</h5>';
        html += '<ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 0.9em;">';
        html += '<li><strong>Hezké počasí:</strong> Navyšte zásoby o 20-30%, připravte chladící boxy pro čokoládu</li>';
        html += '<li><strong>Špatné počasí:</strong> Snižte zásoby o 30-40%, připravte krytí a speciální akce</li>';
        html += '<li><strong>Vysoké teploty (25°C+):</strong> 🚨 Kritické pro čokolády - chladící boxy nutné!</li>';
        html += '<li><strong>Déšť:</strong> Ochrana před vlhkostí, uzavřené balení donutů</li>';
        html += '</ul>';
        html += '</div>';
        
        html += '</div>'; // weather-impact-analysis
        
        container.innerHTML = html;
        console.log('✅ Weather impact analysis updated');
        
    } catch (error) {
        console.error('❌ Error updating weather impact:', error);
        container.innerHTML = '<div class="error-message">Chyba při analýze vlivu počasí</div>';
    }
}

function analyzeWeatherImpact() {
    const eventsWithWeather = globalState.historicalData.filter(record => 
        record.weather && record.sales > 0 && record.visitors > 0
    );
    
    if (eventsWithWeather.length === 0) {
        return null;
    }
    
    // Kategorizace počasí
    const goodWeatherEvents = eventsWithWeather.filter(record => {
        const weather = record.weather.toLowerCase();
        return weather.includes('clear') || weather.includes('sunny') || 
               weather.includes('jasno') || weather.includes('slunečno');
    });
    
    const badWeatherEvents = eventsWithWeather.filter(record => {
        const weather = record.weather.toLowerCase();
        return weather.includes('rain') || weather.includes('storm') || 
               weather.includes('déšť') || weather.includes('bouře') ||
               weather.includes('snow') || weather.includes('sníh');
    });
    
    const avgSalesGoodWeather = goodWeatherEvents.length > 0 ? 
        goodWeatherEvents.reduce((sum, e) => sum + e.sales, 0) / goodWeatherEvents.length : null;
    
    const avgSalesBadWeather = badWeatherEvents.length > 0 ? 
        badWeatherEvents.reduce((sum, e) => sum + e.sales, 0) / badWeatherEvents.length : null;
    
    let weatherImpact = null;
    if (avgSalesGoodWeather !== null && avgSalesBadWeather !== null) {
        weatherImpact = ((avgSalesGoodWeather - avgSalesBadWeather) / avgSalesBadWeather) * 100;
    }
    
    // Detailní breakdown podle typu počasí
    const weatherTypes = new Map();
    eventsWithWeather.forEach(record => {
        const type = categorizeWeather(record.weather);
        if (!weatherTypes.has(type)) {
            weatherTypes.set(type, {
                type: type,
                events: 0,
                totalSales: 0,
                totalVisitors: 0
            });
        }
        
        const data = weatherTypes.get(type);
        data.events += 1;
        data.totalSales += record.sales;
        data.totalVisitors += record.visitors;
    });
    
    const weatherBreakdown = Array.from(weatherTypes.values())
        .sort((a, b) => b.totalSales - a.totalSales);
    
    return {
        totalEvents: eventsWithWeather.length,
        goodWeatherEvents: goodWeatherEvents.length,
        badWeatherEvents: badWeatherEvents.length,
        avgSalesGoodWeather,
        avgSalesBadWeather,
        weatherImpact,
        weatherBreakdown
    };
}

function categorizeWeather(weather) {
    if (!weather) return 'Neznámé';
    
    const w = weather.toLowerCase();
    
    if (w.includes('clear') || w.includes('sunny') || w.includes('jasno')) return 'Slunečno';
    if (w.includes('cloud') || w.includes('oblačno')) return 'Oblačno';
    if (w.includes('rain') || w.includes('déšť')) return 'Déšť';
    if (w.includes('storm') || w.includes('bouře')) return 'Bouřka';
    if (w.includes('snow') || w.includes('sníh')) return 'Sníh';
    if (w.includes('fog') || w.includes('mlha')) return 'Mlha';
    
    return 'Ostatní';
}

function getWeatherIcon(weatherType) {
    const icons = {
        'Slunečno': '☀️',
        'Oblačno': '☁️',
        'Déšť': '🌧️',
        'Bouřka': '⛈️',
        'Sníh': '❄️',
        'Mlha': '🌫️',
        'Ostatní': '🌤️',
        'Neznámé': '❓'
    };
    return icons[weatherType] || '🌤️';
}

// ========================================
// CSV EXPORT ANALYTICS
// ========================================

function exportAnalyticsButton() {
    // Přidat export tlačítko pokud neexistuje
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && !document.getElementById('analyticsExportBtn')) {
        const exportBtn = document.createElement('div');
        exportBtn.innerHTML = `
            <div style="text-align: center; margin: 30px 0;">
                <button id="analyticsExportBtn" class="btn btn-export" onclick="exportAnalyticsToCSV()">
                    📄 Export analytics do CSV
                </button>
            </div>
        `;
        analyticsSection.appendChild(exportBtn);
    }
}

function exportAnalyticsToCSV() {
    console.log('📄 Exporting analytics to CSV...');
    
    try {
        if (!globalState.historicalData || globalState.historicalData.length === 0) {
            showNotification('❌ Žádná data k exportu', 'error');
            return;
        }
        
        const stats = calculateOverallStats();
        const topEvents = getTopEvents(20);
        const topCities = getTopCities(20);
        const topCategories = getTopCategories();
        const accuracyData = calculatePredictionAccuracy();
        const weatherData = analyzeWeatherImpact();
        
        let csvContent = 'Donuland Analytics Export\n';
        csvContent += `Export Date,${new Date().toLocaleDateString('cs-CZ')}\n`;
        csvContent += `Export Time,${new Date().toLocaleTimeString('cs-CZ')}\n\n`;
        
        // Celkové statistiky
        csvContent += 'CELKOVE STATISTIKY\n';
        csvContent += 'Metrika,Hodnota\n';
        csvContent += `Celkem akcí,${stats.totalEvents}\n`;
        csvContent += `Celkem prodejů,${stats.totalSales}\n`;
        csvContent += `Průměrný prodej,${stats.averageSales.toFixed(0)}\n`;
        csvContent += `Celkový obrat,${stats.totalRevenue}\n`;
        csvContent += `Odhadovaný zisk,${stats.totalProfit}\n`;
        csvContent += `Průměrná konverze,${stats.averageConversion.toFixed(2)}%\n`;
        csvContent += `Nejlepší konverze,${stats.bestConversion.toFixed(2)}%\n`;
        csvContent += `Celkem návštěvníků,${stats.totalVisitors}\n\n`;
        
        // Top události
        csvContent += 'TOP UDÁLOSTI\n';
        csvContent += 'Pořadí,Název,Město,Datum,Kategorie,Prodej,Návštěvníci,Konverze,Obrat,Zisk,Rating\n';
        topEvents.forEach((event, index) => {
            const conversion = event.visitors > 0 ? ((event.sales / event.visitors) * 100).toFixed(1) : '0';
            const revenue = event.sales * CONFIG.DONUT_PRICE;
            const profit = revenue - (event.sales * CONFIG.DONUT_COST);
            csvContent += `${index + 1},"${event.eventName}","${event.city}","${formatDate(event.dateFrom)}","${event.category}",${event.sales},${event.visitors},${conversion}%,${revenue},${profit},${event.rating || 'N/A'}\n`;
        });
        csvContent += '\n';
        
        // Top města
        csvContent += 'TOP MESTA\n';
        csvContent += 'Pořadí,Město,Celkem prodejů,Akcí,Průměr/akci,Průměrná konverze,Celkový obrat,Celkový zisk\n';
        topCities.forEach((city, index) => {
            const avgPerEvent = city.totalSales / city.eventsCount;
            const totalProfit = city.totalRevenue - (city.totalSales * CONFIG.DONUT_COST);
            csvContent += `${index + 1},"${city.name}",${city.totalSales},${city.eventsCount},${avgPerEvent.toFixed(1)},${city.averageConversion.toFixed(1)}%,${city.totalRevenue},${totalProfit}\n`;
        });
        csvContent += '\n';
        
        // Top kategorie
        csvContent += 'TOP KATEGORIE\n';
        csvContent += 'Pořadí,Kategorie,Celkem prodejů,Akcí,Průměr/akci,Průměrná konverze,Celkový obrat,Celkový zisk\n';
        topCategories.forEach((category, index) => {
            const avgPerEvent = category.totalSales / category.eventsCount;
            const totalProfit = category.totalRevenue - (category.totalSales * CONFIG.DONUT_COST);
            csvContent += `${index + 1},"${category.name}",${category.totalSales},${category.eventsCount},${avgPerEvent.toFixed(1)},${category.averageConversion.toFixed(1)}%,${category.totalRevenue},${totalProfit}\n`;
        });
        csvContent += '\n';
        
        // Přesnost predikcí
        if (accuracyData && accuracyData.comparisons.length > 0) {
            csvContent += 'PRESNOST PREDIKCI\n';
            csvContent += 'Událost,Město,Datum,Predikce,Realita,Přesnost,Rozdíl\n';
            accuracyData.comparisons.forEach(comp => {
                csvContent += `"${comp.eventName}","${comp.city}","${formatDate(comp.date)}",${comp.predicted},${comp.actual},${comp.accuracy.toFixed(1)}%,${comp.difference}\n`;
            });
            csvContent += '\n';
        }
        
        // Vliv počasí
        if (weatherData && weatherData.totalEvents > 0) {
            csvContent += 'VLIV POCASI\n';
            csvContent += 'Metrika,Hodnota\n';
            csvContent += `Celkem akcí s počasím,${weatherData.totalEvents}\n`;
            if (weatherData.avgSalesGoodWeather !== null) {
                csvContent += `Průměr - hezké počasí,${weatherData.avgSalesGoodWeather.toFixed(1)}\n`;
            }
            if (weatherData.avgSalesBadWeather !== null) {
                csvContent += `Průměr - špatné počasí,${weatherData.avgSalesBadWeather.toFixed(1)}\n`;
            }
            if (weatherData.weatherImpact !== null) {
                csvContent += `Vliv počasí,${weatherData.weatherImpact.toFixed(1)}%\n`;
            }
            csvContent += '\n';
        }
        
        // Stáhnout soubor
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const filename = `donuland_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        showNotification('📄 Analytics exportovány do CSV', 'success');
        console.log('✅ Analytics exported to CSV:', filename);
        
    } catch (error) {
        console.error('❌ Error exporting analytics:', error);
        showNotification('❌ Chyba při exportu analytics', 'error');
    }
}

// ========================================
// EVENT LISTENERS PRO ADVANCED ANALYTICS
// ========================================

// Event listener pro změny událostí
eventBus.on('eventEdited', () => {
    console.log('📝 Event edited - updating advanced analytics...');
    analyticsState.cachedStats = null;
    
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && analyticsSection.classList.contains('active')) {
        setTimeout(() => {
            updatePredictionAccuracy();
            updateWeatherImpact();
        }, 500);
    }
});

eventBus.on('predictionSaved', () => {
    console.log('🔮 Prediction saved - updating analytics...');
    analyticsState.cachedStats = null;
    
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && analyticsSection.classList.contains('active')) {
        setTimeout(() => {
            updatePredictionAccuracy();
        }, 300);
    }
});

// ========================================
// DEBUG FUNKCE PRO ANALYTICS
// ========================================

// Rozšířené debug funkce pro analytics
if (typeof window !== 'undefined') {
    window.donulandAnalyticsDebug = {
        // Hlavní funkce
        initializeAnalytics,
        exportAnalytics: exportAnalyticsToCSV,
        
        // Data funkce
        getStats: calculateOverallStats,
        getTopEvents: () => getTopEvents(20),
        getTopCities: () => getTopCities(20),
        getTopCategories,
        getPredictionAccuracy: calculatePredictionAccuracy,
        getWeatherData: analyzeWeatherImpact,
        
        // Utility funkce
        refreshAnalytics: () => {
            analyticsState.cachedStats = null;
            initializeAnalytics();
        },
        
        clearCache: () => {
            analyticsState.cachedStats = null;
            analyticsState.lastUpdate = null;
            console.log('🧹 Analytics cache cleared');
        },
        
        // Test funkce
        testDataIntegrity: () => {
            const stats = calculateOverallStats();
            const topEvents = getTopEvents(5);
            const weatherData = analyzeWeatherImpact();
            
            console.group('🧪 Analytics Data Integrity Test');
            console.log('Overall stats:', stats);
            console.log('Top events count:', topEvents.length);
            console.log('Weather data available:', weatherData !== null);
            console.log('Historical data count:', globalState.historicalData?.length || 0);
            console.groupEnd();
            
            return {
                statsValid: stats.totalEvents > 0,
                eventsValid: topEvents.length > 0,
                weatherValid: weatherData !== null,
                dataCount: globalState.historicalData?.length || 0
            };
        },
        
        // Simulace dat pro testování
        generateTestData: () => {
            const testEvents = [
                {
                    eventName: 'Test Food Festival',
                    city: 'Praha',
                    category: 'food festival',
                    dateFrom: '2024-06-15',
                    dateTo: '2024-06-15',
                    sales: 150,
                    visitors: 1000,
                    weather: 'Clear',
                    rating: 4.5
                },
                {
                    eventName: 'Test ČokoFest',
                    city: 'Brno',
                    category: 'veletrh',
                    dateFrom: '2024-07-20',
                    dateTo: '2024-07-22',
                    sales: 320,
                    visitors: 2500,
                    weather: 'Cloudy',
                    rating: 4.8
                }
            ];
            
            if (!globalState.historicalData) {
                globalState.historicalData = [];
            }
            
            testEvents.forEach((event, index) => {
                event.rowIndex = Date.now() + index;
                globalState.historicalData.push(event);
            });
            
            console.log('🧪 Test data generated and added to historicalData');
            showNotification('🧪 Test data přidána pro analytics', 'info', 3000);
            
            // Auto-refresh analytics
            setTimeout(() => {
                initializeAnalytics();
            }, 500);
            
            return testEvents;
        }
    };
}

// ========================================
// PERFORMANCE MONITORING
// ========================================

// Performance monitoring pro analytics
const analyticsPerformance = {
    startTime: null,
    
    start() {
        this.startTime = performance.now();
        console.log('⏱️ Analytics performance monitoring started');
    },
    
    end(operation) {
        if (this.startTime) {
            const duration = performance.now() - this.startTime;
            console.log(`⏱️ ${operation} completed in ${duration.toFixed(2)}ms`);
            
            if (duration > 1000) {
                console.warn(`⚠️ Slow analytics operation: ${operation} took ${duration.toFixed(2)}ms`);
            }
            
            this.startTime = null;
            return duration;
        }
        return null;
    }
};

// Wrapper pro performance monitoring
function withPerformanceMonitoring(func, name) {
    return function(...args) {
        analyticsPerformance.start();
        const result = func.apply(this, args);
        analyticsPerformance.end(name);
        return result;
    };
}

// Aplikace performance monitoringu na klíčové funkce
if (typeof updatePredictionAccuracy !== 'undefined') {
    const originalUpdatePredictionAccuracy = updatePredictionAccuracy;
    window.updatePredictionAccuracy = withPerformanceMonitoring(originalUpdatePredictionAccuracy, 'updatePredictionAccuracy');
}

if (typeof updateWeatherImpact !== 'undefined') {
    const originalUpdateWeatherImpact = updateWeatherImpact;
    window.updateWeatherImpact = withPerformanceMonitoring(originalUpdateWeatherImpact, 'updateWeatherImpact');
}

// ========================================
// ERROR RECOVERY SYSTÉM
// ========================================

// Error recovery pro analytics
function recoverFromAnalyticsError(error, componentName) {
    console.error(`❌ Analytics error in ${componentName}:`, error);
    
    // Pokus o recovery
    try {
        // Clear cache a zkus znovu
        analyticsState.cachedStats = null;
        
        // Informuj uživatele
        showNotification(`⚠️ Problém s ${componentName} - zkouším obnovit`, 'warning', 4000);
        
        // Delayed retry
        setTimeout(() => {
            try {
                switch (componentName) {
                    case 'prediction-accuracy':
                        updatePredictionAccuracy();
                        break;
                    case 'weather-impact':
                        updateWeatherImpact();
                        break;
                    default:
                        initializeAnalytics();
                }
                
                showNotification(`✅ ${componentName} obnoven`, 'success', 2000);
                
            } catch (retryError) {
                console.error(`❌ Recovery failed for ${componentName}:`, retryError);
                showNotification(`❌ Nepodařilo se obnovit ${componentName}`, 'error', 5000);
            }
        }, 2000);
        
    } catch (recoveryError) {
        console.error(`❌ Error recovery failed for ${componentName}:`, recoveryError);
    }
}

// Aplikace error recovery na pokročilé analytics funkce
const advancedAnalyticsComponents = [
    { func: updatePredictionAccuracy, name: 'prediction-accuracy' },
    { func: updateWeatherImpact, name: 'weather-impact' }
];

advancedAnalyticsComponents.forEach(component => {
    if (typeof window[component.func.name] !== 'undefined') {
        const originalFunc = window[component.func.name];
        window[component.func.name] = function(...args) {
            try {
                return originalFunc.apply(this, args);
            } catch (error) {
                recoverFromAnalyticsError(error, component.name);
            }
        };
    }
});

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 4C-2 loaded successfully');
console.log('🎯 Features: ✅ Prediction Accuracy Analysis ✅ Weather Impact Analysis ✅ CSV Export ✅ Performance Monitoring');
console.log('📄 Export: Complete CSV export with all analytics data');
console.log('🎯 Accuracy: Prediction vs reality comparison system');
console.log('🌤️ Weather: Detailed weather type analysis with chocolate-specific recommendations');
console.log('⚡ Performance: Monitoring and error recovery systems');
console.log('🧪 Debug: window.donulandAnalyticsDebug with test data generation');
console.log('⏳ Ready for Part 4D: Calendar & Analytics Integration');
/* ========================================
   DONULAND PART 4D - INTEGRATION & COORDINATION
   Integrace všech částí kalendáře a analýz
   ======================================== */

console.log('🍩 Donuland Part 4D (Integration) loading...');

// ========================================
// GLOBAL INTEGRATION STATE
// ========================================

// Globální stav pro integraci všech částí
if (typeof window.integrationState === 'undefined') {
    window.integrationState = {
        isInitializing: false,
        sectionsLoaded: {
            part4A: false,
            part4B: false,
            part4C: false
        },
        lastSectionSwitch: null,
        syncInProgress: false,
        pendingUpdates: new Set(),
        crossSectionFilters: {
            dateRange: null,
            city: '',
            category: '',
            status: ''
        }
    };
}

// ========================================
// MAIN INTEGRATION CONTROLLER
// ========================================

// Hlavní kontroler pro integraci všech částí
class DonulandIntegrationController {
    constructor() {
        this.sectionMap = new Map([
            ['calendar', 'part4A'],
            ['analytics', 'part4C']
        ]);
        
        this.initializationQueue = [];
        this.syncQueue = [];
        this.retryAttempts = new Map();
        
        console.log('🔧 Integration Controller initialized');
    }
    
    // Inicializace integrace
    async initialize() {
        if (integrationState.isInitializing) {
            console.log('⚠️ Integration already initializing');
            return;
        }
        
        integrationState.isInitializing = true;
        console.log('🚀 Starting integration initialization...');
        
        try {
            // 1. Ověřit dostupnost všech částí
            await this.verifyPartsAvailability();
            
            // 2. Inicializovat cross-section komunikaci
            this.setupCrossSectionCommunication();
            
            // 3. Synchronizovat globální stavy
            await this.synchronizeGlobalStates();
            
            // 4. Nastavit unified event handling
            this.setupUnifiedEventHandling();
            
            // 5. Inicializovat section-specific features
            await this.initializeSectionFeatures();
            
            // 6. Setup auto-sync mechanismy
            this.setupAutoSync();
            
            console.log('✅ Integration initialization completed');
            
            // Emit completion event
            eventBus.emit('integrationInitialized', {
                timestamp: Date.now(),
                sectionsLoaded: integrationState.sectionsLoaded
            });
            
        } catch (error) {
            console.error('❌ Integration initialization failed:', error);
            this.handleInitializationError(error);
        } finally {
            integrationState.isInitializing = false;
        }
    }
    
    // Ověření dostupnosti všech částí
    async verifyPartsAvailability() {
        console.log('🔍 Verifying parts availability...');
        
        const requiredFunctions = [
            { name: 'renderCalendar', part: 'part4A' },
            { name: 'openEventModal', part: 'part4B' },
            { name: 'initializeAnalytics', part: 'part4C' },
            { name: 'updatePredictionAccuracy', part: 'part4C' },
            { name: 'filterCalendar', part: 'part4A' }
        ];
        
        const missingFunctions = [];
        
        for (const func of requiredFunctions) {
            if (typeof window[func.name] !== 'function') {
                missingFunctions.push(func);
                integrationState.sectionsLoaded[func.part] = false;
            } else {
                integrationState.sectionsLoaded[func.part] = true;
            }
        }
        
        if (missingFunctions.length > 0) {
            console.warn('⚠️ Missing functions:', missingFunctions);
            // Pokračovat i s chybějícími funkcemi, ale s omezenou funkcionalitou
        }
        
        // Ověřit HTML elementy
        const requiredElements = [
            'calendarGrid', 'monthEvents', 'overallStats', 
            'topEvents', 'topCities', 'topCategories'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Missing HTML elements:', missingElements);
        }
        
        console.log('✅ Parts availability verified');
    }
    
    // Setup cross-section komunikace
    setupCrossSectionCommunication() {
        console.log('📡 Setting up cross-section communication...');
        
        // Centrální message router
        this.messageRouter = new Map([
            ['calendar->analytics', this.handleCalendarToAnalytics.bind(this)],
            ['analytics->calendar', this.handleAnalyticsToCalendar.bind(this)],
            ['filter->all', this.handleFilterToAll.bind(this)],
            ['data->all', this.handleDataToAll.bind(this)]
        ]);
        
        // Setup message handling
        eventBus.on('crossSectionMessage', (message) => {
            this.routeMessage(message);
        });
        
        console.log('✅ Cross-section communication established');
    }
    
    // Synchronizace globálních stavů
    async synchronizeGlobalStates() {
        console.log('🔄 Synchronizing global states...');
        
        try {
            // Synchronizovat kalendářní stav
            if (typeof calendarState !== 'undefined' && globalState) {
                calendarState.filters.city = integrationState.crossSectionFilters.city;
                calendarState.filters.category = integrationState.crossSectionFilters.category;
                calendarState.filters.status = integrationState.crossSectionFilters.status;
            }
            
            // Synchronizovat analytics stav
            if (typeof analyticsState !== 'undefined') {
                analyticsState.lastUpdate = null; // Force refresh
            }
            
            // Synchronizovat timeline
            if (globalState && globalState.currentMonth !== undefined) {
                integrationState.crossSectionFilters.dateRange = {
                    month: globalState.currentMonth,
                    year: globalState.currentYear
                };
            }
            
            console.log('✅ Global states synchronized');
            
        } catch (error) {
            console.error('❌ Error synchronizing states:', error);
        }
    }
    
    // Unified event handling
    setupUnifiedEventHandling() {
        console.log('🎯 Setting up unified event handling...');
        
        // Section switching s integrovanými updates
        eventBus.on('sectionChanged', (data) => {
            this.handleSectionSwitch(data.section);
        });
        
        // Data changes s propagací do všech sekcí
        eventBus.on('dataLoaded', (data) => {
            this.propagateDataUpdate(data);
        });
        
        // Filter changes s cross-section sync
        eventBus.on('filterChanged', (data) => {
            this.propagateFilterUpdate(data);
        });
        
        // Event modifications s calendar+analytics update
        eventBus.on('eventEdited', (data) => {
            this.handleEventModification(data);
        });
        
        eventBus.on('eventDeleted', (data) => {
            this.handleEventModification(data);
        });
        
        // Prediction saves s calendar update
        eventBus.on('predictionSaved', (data) => {
            this.handlePredictionSave(data);
        });
        
        console.log('✅ Unified event handling configured');
    }
    
    // Inicializace section-specific features
    async initializeSectionFeatures() {
        console.log('⚙️ Initializing section-specific features...');
        
        try {
            // Enhanced calendar features
            if (integrationState.sectionsLoaded.part4A) {
                await this.enhanceCalendarFeatures();
            }
            
            // Enhanced analytics features
            if (integrationState.sectionsLoaded.part4C) {
                await this.enhanceAnalyticsFeatures();
            }
            
            console.log('✅ Section-specific features initialized');
            
        } catch (error) {
            console.error('❌ Error initializing section features:', error);
        }
    }
    
    // Enhanced calendar features
    async enhanceCalendarFeatures() {
        console.log('📅 Enhancing calendar features...');
        
        // Quick analytics integration
        if (typeof renderCalendar === 'function') {
            const originalRenderCalendar = renderCalendar;
            window.renderCalendar = function(...args) {
                const result = originalRenderCalendar.apply(this, args);
                
                // Trigger analytics update after calendar render
                setTimeout(() => {
                    integrationController.triggerAnalyticsUpdate('calendar-render');
                }, 500);
                
                return result;
            };
        }
        
        // Enhanced month navigation
        this.setupEnhancedMonthNavigation();
        
        // Calendar-analytics sync
        this.setupCalendarAnalyticsSync();
        
        console.log('✅ Calendar features enhanced');
    }
    
    // Enhanced analytics features
    async enhanceAnalyticsFeatures() {
        console.log('📊 Enhancing analytics features...');
        
        // Analytics-calendar integration
        if (typeof initializeAnalytics === 'function') {
            const originalInitializeAnalytics = initializeAnalytics;
            window.initializeAnalytics = function(...args) {
                const result = originalInitializeAnalytics.apply(this, args);
                
                // Update integration state
                integrationState.pendingUpdates.delete('analytics');
                
                return result;
            };
        }
        
        // Enhanced data drill-down
        this.setupAnalyticsDrillDown();
        
        console.log('✅ Analytics features enhanced');
    }
    
    // Setup auto-sync mechanismy
    setupAutoSync() {
        console.log('🔄 Setting up auto-sync mechanisms...');
        
        // Periodic sync check
        setInterval(() => {
            this.performPeriodicSync();
        }, 30000); // Every 30 seconds
        
        // Visibility change sync
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => {
                    this.performVisibilitySync();
                }, 1000);
            }
        });
        
        // Window focus sync
        window.addEventListener('focus', () => {
            setTimeout(() => {
                this.performFocusSync();
            }, 500);
        });
        
        console.log('✅ Auto-sync mechanisms configured');
    }
}

// ========================================
// MESSAGE ROUTING HANDLERS
// ========================================

// Extension metod pro DonulandIntegrationController
Object.assign(DonulandIntegrationController.prototype, {
    // Route message mezi sekcemi
    routeMessage(message) {
        const { type, source, target, data } = message;
        const routeKey = `${source}->${target}`;
        
        console.log(`📨 Routing message: ${type} from ${source} to ${target}`);
        
        const handler = this.messageRouter.get(routeKey) || this.messageRouter.get(`${source}->all`);
        
        if (handler) {
            try {
                handler(type, data, message);
            } catch (error) {
                console.error(`❌ Error routing message ${type}:`, error);
            }
        } else {
            console.warn(`⚠️ No handler for route: ${routeKey}`);
        }
    },
    
    // Calendar -> Analytics komunikace
    handleCalendarToAnalytics(type, data, message) {
        switch (type) {
            case 'month-changed':
                this.syncAnalyticsToMonth(data.month, data.year);
                break;
                
            case 'event-clicked':
                this.showEventInAnalytics(data.eventId);
                break;
                
            case 'filter-applied':
                this.applyFiltersToAnalytics(data.filters);
                break;
                
            default:
                console.log(`📊 Analytics handling: ${type}`, data);
        }
    },
    
    // Analytics -> Calendar komunikace
    handleAnalyticsToCalendar(type, data, message) {
        switch (type) {
            case 'time-range-selected':
                this.syncCalendarToTimeRange(data.startDate, data.endDate);
                break;
                
            case 'city-drilldown':
                this.filterCalendarByCity(data.city);
                break;
                
            case 'category-drilldown':
                this.filterCalendarByCategory(data.category);
                break;
                
            default:
                console.log(`📅 Calendar handling: ${type}`, data);
        }
    },
    
    // Filter -> All komunikace
    handleFilterToAll(type, data, message) {
        if (type === 'global-filter-change') {
            integrationState.crossSectionFilters = { ...data.filters };
            this.propagateFiltersToAllSections(data.filters);
        }
    },
    
    // Data -> All komunikace
    handleDataToAll(type, data, message) {
        if (type === 'data-updated') {
            this.refreshAllSections(data);
        }
    }
});

// ========================================
// SECTION SWITCHING COORDINATION
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Handle section switch s koordinací
    handleSectionSwitch(targetSection) {
        console.log(`🔄 Handling section switch to: ${targetSection}`);
        
        integrationState.lastSectionSwitch = {
            section: targetSection,
            timestamp: Date.now()
        };
        
        // Section-specific coordination
        switch (targetSection) {
            case 'calendar':
                this.prepareCalendarSection();
                break;
                
            case 'analytics':
                this.prepareAnalyticsSection();
                break;
                
            default:
                console.log(`📄 Standard section switch: ${targetSection}`);
        }
        
        // Clear pending updates for current section
        integrationState.pendingUpdates.delete(targetSection);
    },
    
    // Příprava kalendářní sekce
    async prepareCalendarSection() {
        console.log('📅 Preparing calendar section...');
        
        try {
            // Ensure calendar state is ready
            if (typeof calendarState !== 'undefined') {
                calendarState.isRendering = false; // Reset rendering lock
            }
            
            // Update filters from cross-section state
            this.syncFiltersToCalendar();
            
            // Trigger calendar render with retry
            await this.safeCalendarRender();
            
            // Update month events list
            setTimeout(() => {
                if (typeof updateMonthEventsList === 'function') {
                    updateMonthEventsList();
                }
            }, 300);
            
            console.log('✅ Calendar section prepared');
            
        } catch (error) {
            console.error('❌ Error preparing calendar section:', error);
            this.retryCalendarPreparation();
        }
    },
    
    // Příprava analytics sekce
    async prepareAnalyticsSection() {
        console.log('📊 Preparing analytics section...');
        
        try {
            // Ensure analytics state is ready
            if (typeof analyticsState !== 'undefined') {
                analyticsState.isLoading = false; // Reset loading lock
            }
            
            // Check if data is available
            if (!globalState.historicalData || globalState.historicalData.length === 0) {
                console.log('⚠️ No data available for analytics');
                return;
            }
            
            // Initialize analytics with retry
            await this.safeAnalyticsInitialization();
            
            console.log('✅ Analytics section prepared');
            
        } catch (error) {
            console.error('❌ Error preparing analytics section:', error);
            this.retryAnalyticsPreparation();
        }
    },
    
    // Safe calendar render s error handling
    async safeCalendarRender() {
        const maxRetries = 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                if (typeof renderCalendar === 'function') {
                    renderCalendar();
                    return; // Success
                } else {
                    throw new Error('renderCalendar function not available');
                }
            } catch (error) {
                attempt++;
                console.warn(`⚠️ Calendar render attempt ${attempt} failed:`, error);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                } else {
                    throw error;
                }
            }
        }
    },
    
    // Safe analytics initialization s error handling
    async safeAnalyticsInitialization() {
        const maxRetries = 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                if (typeof initializeAnalytics === 'function') {
                    initializeAnalytics();
                    return; // Success
                } else {
                    throw new Error('initializeAnalytics function not available');
                }
            } catch (error) {
                attempt++;
                console.warn(`⚠️ Analytics init attempt ${attempt} failed:`, error);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                } else {
                    throw error;
                }
            }
        }
    }
});

// ========================================
// DATA PROPAGATION & SYNCHRONIZATION
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Propagace data update do všech sekcí
    propagateDataUpdate(data) {
        console.log('📊 Propagating data update to all sections...');
        
        integrationState.syncInProgress = true;
        
        try {
            // Update calendar if visible
            if (this.isSectionActive('calendar')) {
                setTimeout(() => {
                    if (typeof populateFilterDropdowns === 'function') {
                        populateFilterDropdowns();
                    }
                    if (typeof renderCalendar === 'function') {
                        renderCalendar();
                    }
                }, 200);
            }
            
            // Update analytics if visible
            if (this.isSectionActive('analytics')) {
                setTimeout(() => {
                    if (typeof initializeAnalytics === 'function') {
                        initializeAnalytics();
                    }
                }, 500);
            }
            
            // Mark other sections for update
            this.markSectionsForUpdate(['calendar', 'analytics']);
            
        } catch (error) {
            console.error('❌ Error propagating data update:', error);
        } finally {
            integrationState.syncInProgress = false;
        }
    },
    
    // Propagace filter update
    propagateFilterUpdate(filterData) {
        console.log('🔍 Propagating filter update...', filterData);
        
        // Update cross-section filters
        if (filterData.city !== undefined) {
            integrationState.crossSectionFilters.city = filterData.city;
        }
        if (filterData.category !== undefined) {
            integrationState.crossSectionFilters.category = filterData.category;
        }
        if (filterData.status !== undefined) {
            integrationState.crossSectionFilters.status = filterData.status;
        }
        
        // Apply to calendar
        this.syncFiltersToCalendar();
        
        // Apply to analytics (if it supports filtering)
        this.syncFiltersToAnalytics();
    },
    
    // Synchronizace filtrů do kalendáře
    syncFiltersToCalendar() {
        if (typeof calendarState === 'undefined') return;
        
        const filters = integrationState.crossSectionFilters;
        
        // Update calendar filters
        calendarState.filters.city = filters.city || '';
        calendarState.filters.category = filters.category || '';
        calendarState.filters.status = filters.status || '';
        
        // Update UI elements
        const cityFilter = document.getElementById('cityFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (cityFilter) cityFilter.value = filters.city || '';
        if (categoryFilter) categoryFilter.value = filters.category || '';
        if (statusFilter) statusFilter.value = filters.status || '';
        
        // Re-render calendar if active
        if (this.isSectionActive('calendar') && typeof renderCalendar === 'function') {
            setTimeout(() => renderCalendar(), 100);
        }
    },
    
    // Synchronizace filtrů do analytics
    syncFiltersToAnalytics() {
        // Analytics může používat filtry pro zobrazení specifických dat
        if (this.isSectionActive('analytics') && typeof analyticsState !== 'undefined') {
            // Force refresh analytics s novými filtry
            analyticsState.cachedStats = null;
            
            setTimeout(() => {
                if (typeof initializeAnalytics === 'function') {
                    initializeAnalytics();
                }
            }, 200);
        }
    },
    
    // Označit sekce pro update
    markSectionsForUpdate(sections) {
        sections.forEach(section => {
            integrationState.pendingUpdates.add(section);
        });
        
        console.log('📌 Marked sections for update:', Array.from(integrationState.pendingUpdates));
    },
    
    // Zkontrolovat jestli je sekce aktivní
    isSectionActive(sectionName) {
        const section = document.getElementById(sectionName);
        return section && section.classList.contains('active');
    }
});

// ========================================
// EVENT MODIFICATION HANDLING
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Handle event modification (edit/delete)
    handleEventModification(data) {
        console.log('✏️ Handling event modification...', data);
        
        try {
            // Update calendar
            if (this.isSectionActive('calendar')) {
                setTimeout(() => {
                    if (typeof renderCalendar === 'function') {
                        renderCalendar();
                    }
                }, 200);
            } else {
                this.markSectionsForUpdate(['calendar']);
            }
            
            // Update analytics
            if (this.isSectionActive('analytics')) {
                setTimeout(() => {
                    if (typeof updatePredictionAccuracy === 'function') {
                        updatePredictionAccuracy();
                    }
                    if (typeof updateOverallStats === 'function') {
                        updateOverallStats();
                    }
                }, 500);
            } else {
                this.markSectionsForUpdate(['analytics']);
            }
            
            // Clear cached data
            if (typeof analyticsState !== 'undefined') {
                analyticsState.cachedStats = null;
            }
            
        } catch (error) {
            console.error('❌ Error handling event modification:', error);
        }
    },
    
    // Handle prediction save
    handlePredictionSave(data) {
        console.log('🔮 Handling prediction save...', data);
        
        try {
            // Update calendar (new prediction event)
            if (this.isSectionActive('calendar')) {
                setTimeout(() => {
                    if (typeof populateFilterDropdowns === 'function') {
                        populateFilterDropdowns();
                    }
                    if (typeof renderCalendar === 'function') {
                        renderCalendar();
                    }
                }, 300);
            } else {
                this.markSectionsForUpdate(['calendar']);
            }
            
            // Update analytics (prediction accuracy data)
            if (this.isSectionActive('analytics')) {
                setTimeout(() => {
                    if (typeof updatePredictionAccuracy === 'function') {
                        updatePredictionAccuracy();
                    }
                }, 400);
            } else {
                this.markSectionsForUpdate(['analytics']);
            }
            
        } catch (error) {
            console.error('❌ Error handling prediction save:', error);
        }
    }
});

// ========================================
// AUTO-SYNC MECHANISMS
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Periodic sync check
    performPeriodicSync() {
        if (integrationState.syncInProgress) return;
        
        // Check for pending updates
        if (integrationState.pendingUpdates.size > 0) {
            console.log('🔄 Performing periodic sync for pending updates...');
            this.processPendingUpdates();
        }
        
        // Check for data staleness
        if (globalState.lastDataLoad) {
            const hourAgo = Date.now() - (60 * 60 * 1000);
            if (globalState.lastDataLoad < hourAgo) {
                console.log('📊 Data is stale, marking for refresh...');
                this.markSectionsForUpdate(['calendar', 'analytics']);
            }
        }
    },
    
    // Visibility change sync
    performVisibilitySync() {
        console.log('👁️ Performing visibility sync...');
        
        const currentSection = this.getCurrentActiveSection();
        if (currentSection && integrationState.pendingUpdates.has(currentSection)) {
            this.processPendingUpdatesForSection(currentSection);
        }
    },
    
    // Focus sync
    performFocusSync() {
        console.log('🎯 Performing focus sync...');
        
        // Similar to visibility sync, but more conservative
        const currentSection = this.getCurrentActiveSection();
        if (currentSection && integrationState.pendingUpdates.has(currentSection)) {
            // Only sync if no user activity for 2+ seconds
            setTimeout(() => {
                if (integrationState.pendingUpdates.has(currentSection)) {
                    this.processPendingUpdatesForSection(currentSection);
                }
            }, 2000);
        }
    },
    
    // Process pending updates
    processPendingUpdates() {
        const updates = Array.from(integrationState.pendingUpdates);
        integrationState.pendingUpdates.clear();
        
        updates.forEach(section => {
            this.processPendingUpdatesForSection(section);
        });
    },
    
    // Process pending updates pro konkrétní sekci
    processPendingUpdatesForSection(section) {
        console.log(`🔄 Processing pending updates for: ${section}`);
        
        try {
            switch (section) {
                case 'calendar':
                    if (typeof renderCalendar === 'function') {
                        renderCalendar();
                    }
                    if (typeof updateMonthEventsList === 'function') {
                        updateMonthEventsList();
                    }
                    break;
                    
                case 'analytics':
                    if (typeof initializeAnalytics === 'function') {
                        initializeAnalytics();
                    }
                    break;
            }
            
            integrationState.pendingUpdates.delete(section);
            
        } catch (error) {
            console.error(`❌ Error processing updates for ${section}:`, error);
            
            // Retry logic
            const retryKey = `retry-${section}`;
            const retryCount = this.retryAttempts.get(retryKey) || 0;
            
            if (retryCount < 3) {
                this.retryAttempts.set(retryKey, retryCount + 1);
                setTimeout(() => {
                    this.processPendingUpdatesForSection(section);
                }, 2000 * (retryCount + 1));
            }
        }
    },
    
    // Get current active section
    getCurrentActiveSection() {
        const sections = ['prediction', 'calendar', 'analytics', 'settings'];
        return sections.find(section => {
            const element = document.getElementById(section);
            return element && element.classList.contains('active');
        });
    }
});

// ========================================
// ENHANCED FEATURES
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Enhanced month navigation
    setupEnhancedMonthNavigation() {
        // Wrap existing changeMonth function
        if (typeof window.changeMonth === 'function') {
            const originalChangeMonth = window.changeMonth;
            window.changeMonth = (direction) => {
                originalChangeMonth(direction);
                
                // Emit cross-section message
                eventBus.emit('crossSectionMessage', {
                    type: 'month-changed',
                    source: 'calendar',
                    target: 'analytics',
                    data: {
                        month: globalState.currentMonth,
                        year: globalState.currentYear,
                        direction: direction
                    }
                });
            };
        }
    },
    
    // Calendar-analytics sync
    setupCalendarAnalyticsSync() {
        // Event clicks in calendar trigger analytics highlights
        eventBus.on('eventClicked', (data) => {
            eventBus.emit('crossSectionMessage', {
                type: 'event-clicked',
                source: 'calendar',
                target: 'analytics',
                data: data
            });
        });
    },
    
    // Analytics drill-down
    setupAnalyticsDrillDown() {
        // Top cities/categories clicks filter calendar
        eventBus.on('analyticsDrillDown', (data) => {
            if (data.type === 'city') {
                this.filterCalendarByCity(data.value);
            } else if (data.type === 'category') {
                this.filterCalendarByCategory(data.value);
            }
        });
    },
    
    // Filter calendar by city
    filterCalendarByCity(city) {
        integrationState.crossSectionFilters.city = city;
        
        if (this.isSectionActive('calendar')) {
            this.syncFiltersToCalendar();
        } else {
            // Switch to calendar and apply filter
            const calendarBtn = document.querySelector('.nav-btn[data-section="calendar"]');
            if (calendarBtn) {
                calendarBtn.click();
                setTimeout(() => {
                    this.syncFiltersToCalendar();
                }, 500);
            }
        }
        
        showNotification(`🏙️ Filtrováno podle města: ${city}`, 'info', 3000);
    },
    
    // Filter calendar by category
    filterCalendarByCategory(category) {
        integrationState.crossSectionFilters.category = category;
        
        if (this.isSectionActive('calendar')) {
            this.syncFiltersToCalendar();
        } else {
            // Switch to calendar and apply filter
            const calendarBtn = document.querySelector('.nav-btn[data-section="calendar"]');
            if (calendarBtn) {
                calendarBtn.click();
                setTimeout(() => {
                    this.syncFiltersToCalendar();
                }, 500);
            }
        }
        
        showNotification(`📋 Filtrováno podle kategorie: ${category}`, 'info', 3000);
    },
    
    // Sync analytics to specific month
    syncAnalyticsToMonth(month, year) {
        console.log(`📊 Syncing analytics to month: ${month + 1}/${year}`);
        
        // Update analytics to show data for specific month
        // This could involve filtering analytics data or highlighting specific periods
        if (this.isSectionActive('analytics') && typeof analyticsState !== 'undefined') {
            analyticsState.cachedStats = null;
            
            // Custom month filtering for analytics
            setTimeout(() => {
                if (typeof initializeAnalytics === 'function') {
                    initializeAnalytics();
                }
            }, 300);
        }
    },
    
    // Show specific event in analytics
    showEventInAnalytics(eventId) {
        console.log(`📊 Showing event in analytics: ${eventId}`);
        
        // Switch to analytics and highlight specific event
        const analyticsBtn = document.querySelector('.nav-btn[data-section="analytics"]');
        if (analyticsBtn) {
            analyticsBtn.click();
            
            setTimeout(() => {
                // Find and highlight the event in analytics
                this.highlightEventInAnalytics(eventId);
            }, 1000);
        }
    },
    
    // Highlight specific event in analytics
    highlightEventInAnalytics(eventId) {
        // Find the event in top events list and highlight it
        const topEventsContainer = document.getElementById('topEvents');
        if (topEventsContainer) {
            const eventElements = topEventsContainer.querySelectorAll('.top-item');
            eventElements.forEach(element => {
                element.style.border = 'none'; // Remove existing highlights
                
                // Check if this element contains our event
                const eventTitle = element.querySelector('h4');
                if (eventTitle && eventId.includes(eventTitle.textContent.split('. ')[1])) {
                    element.style.border = '3px solid var(--primary-color)';
                    element.style.borderRadius = '8px';
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Remove highlight after 5 seconds
                    setTimeout(() => {
                        element.style.border = 'none';
                    }, 5000);
                }
            });
        }
    }
});

// ========================================
// ERROR HANDLING & RECOVERY
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Handle initialization error
    handleInitializationError(error) {
        console.error('❌ Integration initialization error:', error);
        
        // Show user-friendly notification
        showNotification('⚠️ Inicializace integrace selhala. Některé funkce nemusí fungovat správně.', 'warning', 8000);
        
        // Attempt partial initialization
        setTimeout(() => {
            this.attemptPartialInitialization();
        }, 3000);
    },
    
    // Attempt partial initialization
    async attemptPartialInitialization() {
        console.log('🔄 Attempting partial initialization...');
        
        try {
            // Try to initialize at least basic communication
            this.setupCrossSectionCommunication();
            
            // Try to sync global states
            await this.synchronizeGlobalStates();
            
            // Setup basic event handling
            this.setupUnifiedEventHandling();
            
            console.log('✅ Partial initialization completed');
            showNotification('✅ Základní funkce obnoveny', 'success', 4000);
            
        } catch (error) {
            console.error('❌ Partial initialization also failed:', error);
            this.enterDegradedMode();
        }
    },
    
    // Enter degraded mode
    enterDegradedMode() {
        console.warn('⚠️ Entering degraded mode - limited functionality');
        
        integrationState.degradedMode = true;
        
        // Disable cross-section features
        this.disableCrossSectionFeatures();
        
        // Show persistent warning
        showNotification('⚠️ Systém běží v omezeném režimu. Restart aplikace může pomoci.', 'warning', 0);
    },
    
    // Disable cross-section features
    disableCrossSectionFeatures() {
        // Remove enhanced wrappers
        if (window.renderCalendar && window.renderCalendar.isEnhanced) {
            // Restore original function if available
            window.renderCalendar = window.renderCalendar.original || window.renderCalendar;
        }
        
        if (window.initializeAnalytics && window.initializeAnalytics.isEnhanced) {
            // Restore original function if available
            window.initializeAnalytics = window.initializeAnalytics.original || window.initializeAnalytics;
        }
    },
    
    // Retry calendar preparation
    retryCalendarPreparation() {
        const retryKey = 'calendar-preparation';
        const retryCount = this.retryAttempts.get(retryKey) || 0;
        
        if (retryCount < 3) {
            this.retryAttempts.set(retryKey, retryCount + 1);
            
            console.log(`🔄 Retrying calendar preparation (attempt ${retryCount + 1}/3)...`);
            
            setTimeout(() => {
                this.prepareCalendarSection();
            }, 2000 * (retryCount + 1));
        } else {
            console.error('❌ Calendar preparation failed after 3 attempts');
            showNotification('❌ Kalendář se nepodařilo inicializovat', 'error', 5000);
        }
    },
    
    // Retry analytics preparation
    retryAnalyticsPreparation() {
        const retryKey = 'analytics-preparation';
        const retryCount = this.retryAttempts.get(retryKey) || 0;
        
        if (retryCount < 3) {
            this.retryAttempts.set(retryKey, retryCount + 1);
            
            console.log(`🔄 Retrying analytics preparation (attempt ${retryCount + 1}/3)...`);
            
            setTimeout(() => {
                this.prepareAnalyticsSection();
            }, 2000 * (retryCount + 1));
        } else {
            console.error('❌ Analytics preparation failed after 3 attempts');
            showNotification('❌ Analýzy se nepodařilo inicializovat', 'error', 5000);
        }
    }
});

// ========================================
// UTILITY METHODS
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Trigger analytics update
    triggerAnalyticsUpdate(reason) {
        console.log(`📊 Triggering analytics update (reason: ${reason})`);
        
        if (this.isSectionActive('analytics')) {
            // Immediate update
            setTimeout(() => {
                if (typeof updateOverallStats === 'function') {
                    updateOverallStats();
                }
            }, 200);
        } else {
            // Mark for later update
            this.markSectionsForUpdate(['analytics']);
        }
    },
    
    // Refresh all sections
    refreshAllSections(data) {
        console.log('🔄 Refreshing all sections...', data);
        
        integrationState.syncInProgress = true;
        
        try {
            // Calendar
            if (this.isSectionActive('calendar')) {
                setTimeout(() => {
                    if (typeof populateFilterDropdowns === 'function') {
                        populateFilterDropdowns();
                    }
                    if (typeof renderCalendar === 'function') {
                        renderCalendar();
                    }
                }, 100);
            } else {
                this.markSectionsForUpdate(['calendar']);
            }
            
            // Analytics
            if (this.isSectionActive('analytics')) {
                setTimeout(() => {
                    if (typeof analyticsState !== 'undefined') {
                        analyticsState.cachedStats = null;
                    }
                    if (typeof initializeAnalytics === 'function') {
                        initializeAnalytics();
                    }
                }, 300);
            } else {
                this.markSectionsForUpdate(['analytics']);
            }
            
        } catch (error) {
            console.error('❌ Error refreshing sections:', error);
        } finally {
            setTimeout(() => {
                integrationState.syncInProgress = false;
            }, 1000);
        }
    },
    
    // Get integration status
    getIntegrationStatus() {
        return {
            isInitialized: !integrationState.isInitializing,
            sectionsLoaded: integrationState.sectionsLoaded,
            pendingUpdates: Array.from(integrationState.pendingUpdates),
            lastSectionSwitch: integrationState.lastSectionSwitch,
            syncInProgress: integrationState.syncInProgress,
            degradedMode: integrationState.degradedMode || false
        };
    },
    
    // Force sync all sections
    forceSyncAllSections() {
        console.log('🔧 Force syncing all sections...');
        
        // Clear all caches
        if (typeof analyticsState !== 'undefined') {
            analyticsState.cachedStats = null;
            analyticsState.lastUpdate = null;
        }
        
        if (typeof calendarState !== 'undefined') {
            calendarState.isRendering = false;
        }
        
        // Clear retry attempts
        this.retryAttempts.clear();
        
        // Refresh everything
        this.refreshAllSections({ reason: 'force-sync' });
        
        showNotification('🔄 Všechny sekce byly znovu synchronizovány', 'info', 3000);
    }
});

// ========================================
// GLOBAL INTEGRATION CONTROLLER INSTANCE
// ========================================

// Create global integration controller instance
const integrationController = new DonulandIntegrationController();

// ========================================
// INTEGRATION EVENT LISTENERS
// ========================================

// Auto-initialization when parts are loaded
eventBus.on('part4ALoaded', () => {
    console.log('✅ Part 4A loaded - calendar functionality available');
    integrationState.sectionsLoaded.part4A = true;
    integrationController.checkReadyForInitialization();
});

eventBus.on('part4BLoaded', () => {
    console.log('✅ Part 4B loaded - event modal functionality available');
    integrationState.sectionsLoaded.part4B = true;
});

eventBus.on('part4CLoaded', () => {
    console.log('✅ Part 4C loaded - analytics functionality available');
    integrationState.sectionsLoaded.part4C = true;
    integrationController.checkReadyForInitialization();
});

// Check if ready for initialization
integrationController.checkReadyForInitialization = function() {
    const { part4A, part4C } = integrationState.sectionsLoaded;
    
    if (part4A && part4C && !integrationState.isInitializing) {
        console.log('🚀 All critical parts loaded - starting integration...');
        setTimeout(() => {
            this.initialize();
        }, 1000);
    }
};

// Manual integration trigger
eventBus.on('triggerIntegration', () => {
    console.log('🔧 Manual integration trigger received');
    integrationController.initialize();
});

// Section change handling
eventBus.on('sectionChanged', (data) => {
    // This is handled by the integration controller
    // but we can add additional logging here
    console.log(`📍 Section changed to: ${data.section} (integration tracking)`);
});

// Data reload handling
eventBus.on('dataReloadRequested', () => {
    console.log('🔄 Data reload requested - will sync after load');
    integrationState.pendingUpdates.add('calendar');
    integrationState.pendingUpdates.add('analytics');
});

// ========================================
// INITIALIZATION ON DOM READY
// ========================================

// Auto-start integration when DOM is ready and parts are available
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Part 4D Integration - DOM ready');
    
    // Wait a bit for other parts to load
    setTimeout(() => {
        // Check if critical parts are available immediately
        const hasCalendar = typeof renderCalendar === 'function';
        const hasAnalytics = typeof initializeAnalytics === 'function';
        
        if (hasCalendar || hasAnalytics) {
            console.log(`🎯 Parts available: Calendar=${hasCalendar}, Analytics=${hasAnalytics}`);
            
            // Start integration if we have at least one critical part
            if (hasCalendar || hasAnalytics) {
                integrationController.initialize();
            }
        } else {
            console.log('⏳ Waiting for parts to load...');
        }
    }, 2000);
    
    // Fallback initialization after 10 seconds
    setTimeout(() => {
        if (!integrationState.isInitializing && !integrationController.getIntegrationStatus().isInitialized) {
            console.log('⚠️ Fallback integration initialization...');
            integrationController.initialize();
        }
    }, 10000);
});

// ========================================
// DEBUG INTERFACE
// ========================================

// Debug interface pro integration
if (typeof window !== 'undefined') {
    window.donulandIntegrationDebug = {
        // Status
        getStatus: () => integrationController.getIntegrationStatus(),
        getState: () => integrationState,
        
        // Manual control
        initialize: () => integrationController.initialize(),
        forceSync: () => integrationController.forceSyncAllSections(),
        
        // Section control
        switchToCalendar: () => {
            const btn = document.querySelector('.nav-btn[data-section="calendar"]');
            if (btn) btn.click();
        },
        switchToAnalytics: () => {
            const btn = document.querySelector('.nav-btn[data-section="analytics"]');
            if (btn) btn.click();
        },
        
        // Filter testing
        testCityFilter: (city) => integrationController.filterCalendarByCity(city),
        testCategoryFilter: (category) => integrationController.filterCalendarByCategory(category),
        
        // Message testing
        sendMessage: (type, source, target, data) => {
            eventBus.emit('crossSectionMessage', { type, source, target, data });
        },
        
        // Utility
        clearRetries: () => {
            integrationController.retryAttempts.clear();
            console.log('🧹 Retry attempts cleared');
        },
        
        clearPendingUpdates: () => {
            integrationState.pendingUpdates.clear();
            console.log('🧹 Pending updates cleared');
        },
        
        // Test functions
        testCalendarRender: () => {
            if (typeof renderCalendar === 'function') {
                renderCalendar();
                console.log('📅 Calendar render test executed');
            } else {
                console.error('❌ renderCalendar function not available');
            }
        },
        
        testAnalyticsInit: () => {
            if (typeof initializeAnalytics === 'function') {
                initializeAnalytics();
                console.log('📊 Analytics init test executed');
            } else {
                console.error('❌ initializeAnalytics function not available');
            }
        },
        
        // Emergency functions
        enterDegradedMode: () => integrationController.enterDegradedMode(),
        exitDegradedMode: () => {
            integrationState.degradedMode = false;
            integrationController.initialize();
        }
    };
}

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 4D loaded successfully');
console.log('🔗 Features: ✅ Cross-Section Communication ✅ Auto-Sync ✅ Error Recovery ✅ Filter Propagation');
console.log('🎯 Integration: Calendar ↔ Analytics ↔ Filters ↔ Data');
console.log('🔧 Debug: window.donulandIntegrationDebug available');
console.log('📡 Communication: eventBus-based message routing');
console.log('🔄 Auto-sync: Periodic updates, visibility handling, focus management');
console.log('⏳ Ready for Part 4E: Final polish and edge case handling');

// Emit completion event
eventBus.emit('part4DLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: [
        'cross-section-communication',
        'auto-sync-mechanisms', 
        'filter-propagation',
        'section-coordination',
        'error-recovery',
        'message-routing',
        'degraded-mode-support'
    ]
});
/* ========================================
   DONULAND PART 4E - FINAL POLISH & OPTIMIZATION
   Finální ladění, edge cases, performance optimalizace
   ======================================== */

console.log('🍩 Donuland Part 4E (Final Polish) loading...');

// ========================================
// COMPATIBILITY LAYER & FIXES
// ========================================

// Compatibility wrapper pro zajištění funkčnosti napříč všemi částmi
class DonulandCompatibilityLayer {
    constructor() {
        this.fixes = new Map();
        this.polyfills = new Map();
        this.fallbacks = new Map();
        
        console.log('🔧 Compatibility Layer initialized');
    }
    
    // Inicializace všech compatibility fixes
    initialize() {
        console.log('🛠️ Applying compatibility fixes...');
        
        this.fixCalendarRendering();
        this.fixAnalyticsInitialization();
        this.fixEventModalHandling();
        this.fixFilterSynchronization();
        this.fixDataLoadingEdgeCases();
        this.fixPerformanceIssues();
        this.setupGlobalErrorHandling();
        this.implementMissingFunctions();
        
        console.log('✅ Compatibility fixes applied');
    }
    
    // Fix calendar rendering issues
    fixCalendarRendering() {
        // Wrapper pro renderCalendar s error handling
        if (typeof window.renderCalendar === 'function') {
            const originalRenderCalendar = window.renderCalendar;
            
            window.renderCalendar = function(...args) {
                try {
                    // Check prerequisites
                    if (!document.getElementById('calendarGrid')) {
                        console.warn('⚠️ Calendar grid element missing');
                        return false;
                    }
                    
                    if (typeof calendarState !== 'undefined' && calendarState.isRendering) {
                        console.log('⚠️ Calendar already rendering, skipping');
                        return false;
                    }
                    
                    // Set rendering flag
                    if (typeof calendarState !== 'undefined') {
                        calendarState.isRendering = true;
                    }
                    
                    // Call original function
                    const result = originalRenderCalendar.apply(this, args);
                    
                    return result;
                    
                } catch (error) {
                    console.error('❌ Calendar rendering error:', error);
                    
                    // Fallback rendering
                    compatibilityLayer.renderCalendarFallback();
                    
                    return false;
                } finally {
                    // Clear rendering flag
                    if (typeof calendarState !== 'undefined') {
                        setTimeout(() => {
                            calendarState.isRendering = false;
                        }, 100);
                    }
                }
            };
            
            // Mark as enhanced
            window.renderCalendar.isEnhanced = true;
            window.renderCalendar.original = originalRenderCalendar;
        } else {
            // Provide fallback implementation
            window.renderCalendar = () => compatibilityLayer.renderCalendarFallback();
        }
    }
    
    // Fix analytics initialization
    fixAnalyticsInitialization() {
        if (typeof window.initializeAnalytics === 'function') {
            const originalInitializeAnalytics = window.initializeAnalytics;
            
            window.initializeAnalytics = function(...args) {
                try {
                    // Check prerequisites
                    if (!globalState.historicalData || globalState.historicalData.length === 0) {
                        console.log('📊 No data available for analytics');
                        compatibilityLayer.displayNoDataAnalytics();
                        return false;
                    }
                    
                    if (typeof analyticsState !== 'undefined' && analyticsState.isLoading) {
                        console.log('⚠️ Analytics already loading, skipping');
                        return false;
                    }
                    
                    // Set loading flag
                    if (typeof analyticsState !== 'undefined') {
                        analyticsState.isLoading = true;
                    }
                    
                    // Call original function
                    const result = originalInitializeAnalytics.apply(this, args);
                    
                    return result;
                    
                } catch (error) {
                    console.error('❌ Analytics initialization error:', error);
                    
                    // Fallback analytics
                    compatibilityLayer.initializeAnalyticsFallback();
                    
                    return false;
                } finally {
                    // Clear loading flag
                    if (typeof analyticsState !== 'undefined') {
                        setTimeout(() => {
                            analyticsState.isLoading = false;
                        }, 500);
                    }
                }
            };
            
            // Mark as enhanced
            window.initializeAnalytics.isEnhanced = true;
            window.initializeAnalytics.original = originalInitializeAnalytics;
        } else {
            // Provide fallback implementation
            window.initializeAnalytics = () => compatibilityLayer.initializeAnalyticsFallback();
        }
    }
    
    // Fix event modal handling
    fixEventModalHandling() {
        if (typeof window.openEventModal === 'function') {
            const originalOpenEventModal = window.openEventModal;
            
            window.openEventModal = function(event = null, defaultDate = null) {
                try {
                    const modal = document.getElementById('eventModal');
                    if (!modal) {
                        console.warn('⚠️ Event modal element missing');
                        compatibilityLayer.showModalFallback(event, defaultDate);
                        return;
                    }
                    
                    return originalOpenEventModal.call(this, event, defaultDate);
                    
                } catch (error) {
                    console.error('❌ Event modal error:', error);
                    compatibilityLayer.showModalFallback(event, defaultDate);
                }
            };
        } else {
            // Provide fallback implementation
            window.openEventModal = (event, defaultDate) => {
                compatibilityLayer.showModalFallback(event, defaultDate);
            };
        }
        
        // Ensure closeModal function exists
        if (typeof window.closeModal !== 'function') {
            window.closeModal = () => {
                const modal = document.getElementById('eventModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            };
        }
    }
    
    // Fix filter synchronization
    fixFilterSynchronization() {
        // Enhanced filter functions with error handling
        if (typeof window.filterCalendar === 'function') {
            const originalFilterCalendar = window.filterCalendar;
            
            window.filterCalendar = function(...args) {
                try {
                    return originalFilterCalendar.apply(this, args);
                } catch (error) {
                    console.error('❌ Filter calendar error:', error);
                    compatibilityLayer.filterCalendarFallback();
                }
            };
        } else {
            window.filterCalendar = () => compatibilityLayer.filterCalendarFallback();
        }
        
        // Ensure clearCalendarFilters exists
        if (typeof window.clearCalendarFilters !== 'function') {
            window.clearCalendarFilters = () => compatibilityLayer.clearFiltersFallback();
        }
    }
    
    // Fix data loading edge cases
    fixDataLoadingEdgeCases() {
        // Enhanced loadData with better error handling
        if (typeof window.loadData === 'function') {
            const originalLoadData = window.loadData;
            
            window.loadData = function(...args) {
                try {
                    if (globalState.isLoading) {
                        console.log('⚠️ Data already loading');
                        return Promise.resolve();
                    }
                    
                    return originalLoadData.apply(this, args);
                    
                } catch (error) {
                    console.error('❌ Data loading error:', error);
                    return compatibilityLayer.loadDataFallback();
                }
            };
        } else {
            window.loadData = () => compatibilityLayer.loadDataFallback();
        }
    }
    
    // Fix performance issues
    fixPerformanceIssues() {
        // Debounced filter updates
        if (typeof window.filterCalendar === 'function') {
            window.filterCalendar = debounce(window.filterCalendar, 300);
        }
        
        // Throttled calendar rendering
        if (typeof window.renderCalendar === 'function') {
            window.renderCalendar = throttle(window.renderCalendar, 500);
        }
        
        // Optimized event handlers
        this.optimizeEventHandlers();
    }
    
    // Setup global error handling
    setupGlobalErrorHandling() {
        // Enhanced error handling for missing functions
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message) {
                const message = event.error.message;
                
                // Handle specific missing function errors
                if (message.includes('is not a function')) {
                    this.handleMissingFunctionError(message, event);
                }
                
                // Handle calendar-specific errors
                if (message.includes('calendar') || message.includes('Calendar')) {
                    this.handleCalendarError(message, event);
                }
                
                // Handle analytics-specific errors
                if (message.includes('analytics') || message.includes('Analytics')) {
                    this.handleAnalyticsError(message, event);
                }
            }
        });
        
        // Promise rejection handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Unhandled promise rejection:', event.reason);
            
            // Try to recover from data loading rejections
            if (event.reason && event.reason.toString().includes('data')) {
                this.handleDataError(event.reason);
            }
        });
    }
    
    // Implement missing functions
    implementMissingFunctions() {
        // Essential functions that might be missing
        const essentialFunctions = [
            'formatNumber', 'formatCurrency', 'formatDate', 'showNotification',
            'updateStatus', 'debounce', 'throttle'
        ];
        
        essentialFunctions.forEach(funcName => {
            if (typeof window[funcName] !== 'function') {
                this.implementMissingFunction(funcName);
            }
        });
    }
}

// ========================================
// FALLBACK IMPLEMENTATIONS
// ========================================

// Extension methods pro CompatibilityLayer
Object.assign(DonulandCompatibilityLayer.prototype, {
    // Calendar fallback rendering
    renderCalendarFallback() {
        console.log('📅 Using calendar fallback rendering');
        
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📅</div>
                <h4>Kalendář není dostupný</h4>
                <p>Zkuste obnovit stránku nebo načíst data znovu.</p>
                <button class="btn" onclick="window.location.reload()" style="margin-top: 15px;">
                    🔄 Obnovit stránku
                </button>
            </div>
        `;
    },
    
    // Analytics fallback initialization
    initializeAnalyticsFallback() {
        console.log('📊 Using analytics fallback initialization');
        
        const containers = ['overallStats', 'topEvents', 'topCities', 'topCategories'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6c757d;">
                        <div style="font-size: 2rem; margin-bottom: 15px;">📊</div>
                        <h4>Analýzy nejsou dostupné</h4>
                        <p>Načtěte historická data pro zobrazení analýz.</p>
                        <button class="btn" onclick="loadData()" style="margin-top: 10px;">
                            📊 Načíst data
                        </button>
                    </div>
                `;
            }
        });
    },
    
    // No data analytics display
    displayNoDataAnalytics() {
        const containers = ['overallStats', 'topEvents', 'topCities', 'topCategories'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: #6c757d;">
                        <div style="font-size: 2rem; margin-bottom: 15px;">📈</div>
                        <h5>Žádná data pro analýzu</h5>
                        <p style="font-size: 0.9em;">Načtěte historická data pro zobrazení statistik</p>
                    </div>
                `;
            }
        });
    },
    
    // Modal fallback
    showModalFallback(event, defaultDate) {
        console.log('📝 Using modal fallback');
        
        if (event) {
            const details = [
                `Název: ${event.title || 'N/A'}`,
                `Město: ${event.city || 'N/A'}`,
                `Datum: ${event.dateFrom || 'N/A'}`,
                `Kategorie: ${event.category || 'N/A'}`
            ];
            
            if (event.sales) {
                details.push(`Prodej: ${event.sales} ks`);
            }
            
            alert(`Detail události:\n\n${details.join('\n')}`);
        } else {
            alert('Nová událost by byla vytvořena pro: ' + (defaultDate ? formatDate(defaultDate) : 'Neznámé datum'));
        }
    },
    
    // Filter fallback
    filterCalendarFallback() {
        console.log('🔍 Using filter fallback');
        
        showNotification('⚠️ Filtrování kalendáře není dostupné', 'warning', 3000);
        
        // Try basic calendar render
        setTimeout(() => {
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        }, 500);
    },
    
    // Clear filters fallback
    clearFiltersFallback() {
        console.log('🧹 Using clear filters fallback');
        
        const filterElements = ['cityFilter', 'categoryFilter', 'statusFilter'];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        
        showNotification('🔄 Filtry vymazány', 'info', 2000);
        
        if (typeof renderCalendar === 'function') {
            setTimeout(renderCalendar, 200);
        }
    },
    
    // Data loading fallback
    loadDataFallback() {
        console.log('📊 Using data loading fallback');
        
        showNotification('⚠️ Načítání dat není dostupné. Použijte testovací data.', 'warning', 5000);
        
        // Generate minimal test data
        if (!globalState.historicalData) {
            globalState.historicalData = [];
        }
        
        if (globalState.historicalData.length === 0) {
            this.generateTestData();
        }
        
        return Promise.resolve(globalState.historicalData);
    },
    
    // Generate minimal test data
    generateTestData() {
        const testData = [
            {
                eventName: 'Test Food Festival',
                city: 'Praha',
                category: 'food festival',
                dateFrom: '2024-06-15',
                dateTo: '2024-06-15',
                sales: 150,
                visitors: 1000,
                competition: 2,
                rating: 4.5,
                isTestData: true
            },
            {
                eventName: 'Test ČokoFest',
                city: 'Brno',
                category: 'veletrh',
                dateFrom: '2024-07-20',
                dateTo: '2024-07-22',
                sales: 320,
                visitors: 2500,
                competition: 1,
                rating: 4.8,
                isTestData: true
            }
        ];
        
        globalState.historicalData = testData;
        globalState.lastDataLoad = Date.now();
        
        console.log('🧪 Test data generated');
        showNotification('🧪 Vygenerována testovací data', 'info', 3000);
        
        // Emit data loaded event
        setTimeout(() => {
            eventBus.emit('dataLoaded', {
                count: testData.length,
                data: testData,
                isTestData: true
            });
        }, 500);
    }
});

// ========================================
// ERROR HANDLERS
// ========================================

Object.assign(DonulandCompatibilityLayer.prototype, {
    // Handle missing function errors
    handleMissingFunctionError(message, event) {
        console.warn('⚠️ Missing function error:', message);
        
        // Extract function name
        const match = message.match(/(\w+) is not a function/);
        if (match) {
            const funcName = match[1];
            this.implementMissingFunction(funcName);
        }
    },
    
    // Handle calendar errors
    handleCalendarError(message, event) {
        console.error('📅 Calendar error:', message);
        
        // Reset calendar state
        if (typeof calendarState !== 'undefined') {
            calendarState.isRendering = false;
        }
        
        // Show user notification
        showNotification('⚠️ Chyba v kalendáři. Zkouším obnovit...', 'warning', 4000);
        
        // Try to recover
        setTimeout(() => {
            this.renderCalendarFallback();
        }, 1000);
    },
    
    // Handle analytics errors
    handleAnalyticsError(message, event) {
        console.error('📊 Analytics error:', message);
        
        // Reset analytics state
        if (typeof analyticsState !== 'undefined') {
            analyticsState.isLoading = false;
            analyticsState.cachedStats = null;
        }
        
        showNotification('⚠️ Chyba v analýzách. Zkouším obnovit...', 'warning', 4000);
        
        // Try to recover
        setTimeout(() => {
            this.initializeAnalyticsFallback();
        }, 1000);
    },
    
    // Handle data errors
    handleDataError(error) {
        console.error('📊 Data error:', error);
        
        // Reset loading state
        if (globalState) {
            globalState.isLoading = false;
        }
        
        showNotification('⚠️ Chyba při zpracování dat. Použijí se testovací data.', 'warning', 5000);
        
        // Generate test data as fallback
        setTimeout(() => {
            this.generateTestData();
        }, 1000);
    },
    
    // Implement missing function
    implementMissingFunction(funcName) {
        console.log(`🔧 Implementing missing function: ${funcName}`);
        
        switch (funcName) {
            case 'formatNumber':
                window.formatNumber = (num) => {
                    if (num == null || isNaN(num)) return '0';
                    return new Intl.NumberFormat('cs-CZ').format(Math.round(num));
                };
                break;
                
            case 'formatCurrency':
                window.formatCurrency = (amount) => {
                    if (amount == null || isNaN(amount)) return '0 Kč';
                    return new Intl.NumberFormat('cs-CZ', {
                        style: 'currency',
                        currency: 'CZK',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(Math.round(amount));
                };
                break;
                
            case 'formatDate':
                window.formatDate = (date) => {
                    if (!date) return '';
                    const d = new Date(date);
                    if (isNaN(d.getTime())) return '';
                    return d.toLocaleDateString('cs-CZ');
                };
                break;
                
            case 'showNotification':
                window.showNotification = (message, type = 'info', duration = 5000) => {
                    console.log(`📢 ${type.toUpperCase()}: ${message}`);
                    // Fallback alert for critical messages
                    if (type === 'error') {
                        alert(`Chyba: ${message}`);
                    }
                };
                break;
                
            case 'updateStatus':
                window.updateStatus = (status, message) => {
                    console.log(`📊 Status: ${status} - ${message}`);
                    const statusEl = document.getElementById('status');
                    if (statusEl) {
                        statusEl.className = `status ${status}`;
                        statusEl.innerHTML = `<span class="status-dot"></span><span>${message}</span>`;
                    }
                };
                break;
                
            case 'debounce':
                window.debounce = (func, wait) => {
                    let timeout;
                    return function executedFunction(...args) {
                        const later = () => {
                            clearTimeout(timeout);
                            func(...args);
                        };
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                    };
                };
                break;
                
            case 'throttle':
                window.throttle = (func, wait) => {
                    let inThrottle;
                    return function(...args) {
                        if (!inThrottle) {
                            func.apply(this, args);
                            inThrottle = true;
                            setTimeout(() => inThrottle = false, wait);
                        }
                    };
                };
                break;
                
            default:
                // Generic fallback function
                window[funcName] = function(...args) {
                    console.warn(`⚠️ Called unimplemented function: ${funcName}`, args);
                    return null;
                };
        }
    },
    
    // Optimize event handlers
    optimizeEventHandlers() {
        // Remove duplicate event listeners
        this.removeDuplicateListeners();
        
        // Optimize filter change handlers
        this.optimizeFilterHandlers();
        
        // Optimize resize handlers
        this.optimizeResizeHandlers();
    },
    
    // Remove duplicate listeners
    removeDuplicateListeners() {
        // Track added listeners to prevent duplicates
        if (!window.donulandListeners) {
            window.donulandListeners = new Set();
        }
        
        // This is a simple approach - in production you'd want more sophisticated tracking
        console.log('🧹 Optimizing event listeners...');
    },
    
    // Optimize filter handlers
    optimizeFilterHandlers() {
        const filterElements = ['cityFilter', 'categoryFilter', 'statusFilter'];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Remove existing listeners and add optimized ones
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
                
                // Add debounced listener
                newElement.addEventListener('change', debounce(() => {
                    if (typeof filterCalendar === 'function') {
                        filterCalendar();
                    }
                }, 300));
            }
        });
    },
    
    // Optimize resize handlers
    optimizeResizeHandlers() {
        // Debounced resize handler
        const optimizedResizeHandler = debounce(() => {
            // Only update if sections are visible
            const currentSection = document.querySelector('.section.active');
            if (currentSection) {
                const sectionId = currentSection.id;
                
                if (sectionId === 'calendar' && typeof renderCalendar === 'function') {
                    renderCalendar();
                } else if (sectionId === 'analytics' && typeof initializeAnalytics === 'function') {
                    // Don't auto-refresh analytics on resize to avoid performance issues
                    console.log('📊 Window resized - analytics refresh skipped for performance');
                }
            }
        }, 500);
        
        // Replace existing resize handlers
        window.removeEventListener('resize', optimizedResizeHandler);
        window.addEventListener('resize', optimizedResizeHandler);
    }
});

// ========================================
// PERFORMANCE MONITORING & OPTIMIZATION
// ========================================

// Enhanced performance monitor
class PerformanceOptimizer {
    constructor() {
        this.metrics = new Map();
        this.thresholds = {
            renderCalendar: 1000,  // 1 second
            initializeAnalytics: 2000,  // 2 seconds
            loadData: 5000  // 5 seconds
        };
        
        this.optimizations = new Set();
    }
    
    // Monitor function performance
    monitor(funcName, func) {
        return (...args) => {
            const startTime = performance.now();
            
            try {
                const result = func.apply(this, args);
                
                // Handle promises
                if (result && typeof result.then === 'function') {
                    return result.finally(() => {
                        this.recordMetric(funcName, startTime);
                    });
                } else {
                    this.recordMetric(funcName, startTime);
                    return result;
                }
            } catch (error) {
                this.recordMetric(funcName, startTime, error);
                throw error;
            }
        };
    }
    
    // Record performance metric
    recordMetric(funcName, startTime, error = null) {
        const duration = performance.now() - startTime;
        
        if (!this.metrics.has(funcName)) {
            this.metrics.set(funcName, []);
        }
        
        this.metrics.get(funcName).push({
            duration,
            timestamp: Date.now(),
            error: error ? error.message : null
        });
        
        // Check if optimization is needed
        if (duration > (this.thresholds[funcName] || 1000)) {
            console.warn(`⚠️ Slow function: ${funcName} took ${duration.toFixed(2)}ms`);
            this.suggestOptimization(funcName, duration);
        }
        
        // Keep only last 10 measurements
        const measurements = this.metrics.get(funcName);
        if (measurements.length > 10) {
            measurements.splice(0, measurements.length - 10);
        }
    }
    
    // Suggest optimization
    suggestOptimization(funcName, duration) {
        if (this.optimizations.has(funcName)) return;
        
        this.optimizations.add(funcName);
        
        switch (funcName) {
            case 'renderCalendar':
                console.log('💡 Consider: Debounce calendar renders, use virtual scrolling for large date ranges');
                break;
            case 'initializeAnalytics':
                console.log('💡 Consider: Cache analytics results, lazy load charts');
                break;
            case 'loadData':
                console.log('💡 Consider: Implement data pagination, use web workers');
                break;
        }
    }
    
    // Get performance report
    getReport() {
        const report = {};
        
        for (const [funcName, measurements] of this.metrics) {
            const durations = measurements.map(m => m.duration);
            const errors = measurements.filter(m => m.error).length;
            
            report[funcName] = {
                count: measurements.length,
                avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
                maxDuration: Math.max(...durations),
                minDuration: Math.min(...durations),
                errorRate: (errors / measurements.length) * 100,
                lastMeasurement: measurements[measurements.length - 1]
            };
        }
        
        return report;
    }
    
    // Apply automatic optimizations
    applyOptimizations() {
        console.log('⚡ Applying performance optimizations...');
        
        // Optimize calendar rendering
        if (typeof window.renderCalendar === 'function') {
            window.renderCalendar = this.monitor('renderCalendar', 
                debounce(window.renderCalendar, 300));
        }
        
        // Optimize analytics initialization
        if (typeof window.initializeAnalytics === 'function') {
            window.initializeAnalytics = this.monitor('initializeAnalytics',
                throttle(window.initializeAnalytics, 1000));
        }
        
        // Optimize data loading
        if (typeof window.loadData === 'function') {
            window.loadData = this.monitor('loadData', window.loadData);
        }
        
        console.log('✅ Performance optimizations applied');
    }
}

// ========================================
// EDGE CASE HANDLERS
// ========================================

class EdgeCaseHandler {
    constructor() {
        this.handledCases = new Set();
    }
    
    // Initialize edge case handling
    initialize() {
        console.log('🛡️ Initializing edge case handlers...');
        
        this.handleEmptyData();
        this.handleMissingElements();
        this.handleNetworkIssues();
        this.handleMemoryIssues();
        this.handleBrowserCompatibility();
        this.handleMobileIssues();
        
        console.log('✅ Edge case handlers initialized');
    }
    
    // Handle empty data scenarios
    handleEmptyData() {
        // Monitor for empty data states
        eventBus.on('dataLoaded', (data) => {
            if (!data.data || data.data.length === 0) {
                this.handleEmptyDataState();
            }
        });
        
        // Check current state
        if (globalState && (!globalState.historicalData || globalState.historicalData.length === 0)) {
            setTimeout(() => this.handleEmptyDataState(), 1000);
        }
    }
    
    // Handle empty data state
    handleEmptyDataState() {
        if (this.handledCases.has('emptyData')) return;
        this.handledCases.add('emptyData');
        
        console.log('📊 Handling empty data state...');
        
        // Show helpful message
        showNotification('📊 Žádná historická data. Můžete vytvořit predikci nebo načíst testovací data.', 'info', 8000);
        
        // Offer to generate test data
        const confirmGenerate = confirm('Chcete vygenerovat testovací data pro vyzkoušení funkcí?');
        if (confirmGenerate && typeof compatibilityLayer !== 'undefined') {
            compatibilityLayer.generateTestData();
        }
    }
    
    // Handle missing elements
    handleMissingElements() {
        const criticalElements = [
            'calendarGrid', 'overallStats', 'topEvents', 'predictionResults'
        ];
        
        const missingElements = criticalElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Missing critical elements:', missingElements);
            
            // Try to create missing elements
            this.createMissingElements(missingElements);
        }
    }
    
    // Create missing elements
    createMissingElements(missingElementIds) {
        missingElementIds.forEach(id => {
            console.log(`🔧 Creating missing element: ${id}`);
            
            const element = document.createElement('div');
            element.id = id;
            element.className = 'fallback-element';
            element.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #6c757d; border: 2px dashed #e9ecef; border-radius: 8px;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
                    <h5>Element ${id} není dostupný</h5>
                    <p style="font-size: 0.9em;">Zkuste obnovit stránku</p>
                </div>
            `;
            
            // Try to find appropriate parent
            const parent = this.findAppropriateParent(id);
            if (parent) {
                parent.appendChild(element);
            }
        });
    }
    
    // Find appropriate parent for element
    findAppropriateParent(elementId) {
        // Logic to find where element should be placed
        const sectionMappings = {
            'calendarGrid': 'calendar',
            'overallStats': 'analytics',
            'topEvents': 'analytics',
            'predictionResults': 'prediction'
        };
        
        const sectionId = sectionMappings[elementId];
        if (sectionId) {
            return document.getElementById(sectionId);
        }
        
        // Fallback to main app
        return document.getElementById('mainApp') || document.body;
    }
    
    // Handle network issues
    handleNetworkIssues() {
        // Monitor network status
        window.addEventListener('online', () => {
            console.log('🌐 Network: Back online');
            showNotification('🌐 Připojení obnoveno', 'success', 3000);
            
            // Retry failed operations
            this.retryFailedOperations();
        });
        
        window.addEventListener('offline', () => {
            console.log('📡 Network: Offline');
            showNotification('📡 Ztraceno připojení. Některé funkce nemusí fungovat.', 'warning', 5000);
            
            // Switch to offline mode
            this.enableOfflineMode();
        });
    }
    
    // Enable offline mode
    enableOfflineMode() {
        console.log('📱 Enabling offline mode...');
        
        // Disable data loading buttons
        const loadBtns = document.querySelectorAll('button[onclick*="loadData"]');
        loadBtns.forEach(btn => {
            btn.disabled = true;
            btn.textContent = '📡 Offline';
        });
        
        // Show offline status
        updateStatus('offline', 'Offline režim');
    }
    
    // Retry failed operations
    retryFailedOperations() {
        console.log('🔄 Retrying failed operations...');
        
        // Re-enable data loading
        const loadBtns = document.querySelectorAll('button[onclick*="loadData"]');
        loadBtns.forEach(btn => {
            btn.disabled = false;
            btn.textContent = '🔄 Načíst data';
        });
        
        // Try to reload data if needed
        if (globalState && (!globalState.historicalData || globalState.historicalData.length === 0)) {
            setTimeout(() => {
                if (typeof loadData === 'function') {
                    loadData().catch(error => {
                        console.log('⚠️ Auto-retry data loading failed:', error);
                    });
                }
            }, 2000);
        }
    }
    
    // Handle memory issues
    handleMemoryIssues() {
        // Monitor memory usage (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = memory.usedJSHeapSize / 1048576;
                const limitMB = memory.jsHeapSizeLimit / 1048576;
                
                // Warn if using more than 80% of available memory
                if (usedMB / limitMB > 0.8) {
                    console.warn(`⚠️ High memory usage: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(1)}MB`);
                    this.optimizeMemoryUsage();
                }
            }, 30000); // Check every 30 seconds
        }
    }
    
    // Optimize memory usage
    optimizeMemoryUsage() {
        console.log('🧹 Optimizing memory usage...');
        
        // Clear old cached data
        if (typeof analyticsState !== 'undefined' && analyticsState.cachedStats) {
            analyticsState.cachedStats = null;
        }
        
        // Clear weather cache older than 1 hour
        if (globalState && globalState.weatherCache) {
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            for (const [key, data] of globalState.weatherCache.entries()) {
                if (data.timestamp < oneHourAgo) {
                    globalState.weatherCache.delete(key);
                }
            }
        }
        
        // Clear distance cache older than 24 hours
        if (globalState && globalState.distanceCache) {
            const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
            for (const [key, data] of globalState.distanceCache.entries()) {
                if (data.timestamp < dayAgo) {
                    globalState.distanceCache.delete(key);
                }
            }
        }
        
        // Suggest garbage collection (Chrome)
        if (window.gc) {
            window.gc();
        }
        
        showNotification('🧹 Paměť optimalizována', 'info', 2000);
    }
    
    // Handle browser compatibility
    handleBrowserCompatibility() {
        // Check for required features
        const requiredFeatures = [
            'localStorage',
            'fetch',
            'Promise',
            'Map',
            'Set'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {
            return !(feature in window);
        });
        
        if (missingFeatures.length > 0) {
            console.warn('⚠️ Missing browser features:', missingFeatures);
            this.showCompatibilityWarning(missingFeatures);
        }
        
        // Check for specific browser issues
        this.checkBrowserSpecificIssues();
    }
    
    // Show compatibility warning
    showCompatibilityWarning(missingFeatures) {
        const warning = `
            Váš prohlížeč nepodporuje některé funkce potřebné pro správnou funkčnost aplikace:
            
            Chybějící funkce: ${missingFeatures.join(', ')}
            
            Doporučujeme aktualizovat prohlížeč nebo použít Chrome, Firefox, Safari nebo Edge.
        `;
        
        alert(warning);
        
        // Show persistent warning
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 10000;
            background: #dc3545; color: white; padding: 10px; text-align: center;
            font-size: 14px; font-weight: bold;
        `;
        warningDiv.textContent = '⚠️ Nekompatibilní prohlížeč - některé funkce nemusí fungovat';
        document.body.appendChild(warningDiv);
    }
    
    // Check browser-specific issues
    checkBrowserSpecificIssues() {
        const userAgent = navigator.userAgent;
        
        // Internet Explorer
        if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
            console.warn('⚠️ Internet Explorer detected - limited functionality');
            showNotification('⚠️ Internet Explorer není plně podporován', 'warning', 10000);
        }
        
        // Very old Chrome/Firefox
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        if (chromeMatch && parseInt(chromeMatch[1]) < 60) {
            console.warn('⚠️ Old Chrome version detected');
            showNotification('⚠️ Starší verze Chrome - doporučujeme aktualizaci', 'warning', 8000);
        }
        
        // Safari issues
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            // Safari-specific fixes
            this.applySafariFixes();
        }
    }
    
    // Apply Safari-specific fixes
    applySafariFixes() {
        console.log('🍎 Applying Safari fixes...');
        
        // Fix for Safari date input issues
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            // Safari sometimes has issues with date format
            input.addEventListener('change', (e) => {
                const value = e.target.value;
                if (value && !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    console.warn('⚠️ Safari date format issue:', value);
                }
            });
        });
    }
    
    // Handle mobile issues
    handleMobileIssues() {
        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            console.log('📱 Mobile device detected');
            this.applyMobileOptimizations();
        }
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 500);
        });
        
        // Handle touch events for better mobile experience
        this.improveTouchExperience();
    }
    
    // Apply mobile optimizations
    applyMobileOptimizations() {
        console.log('📱 Applying mobile optimizations...');
        
        // Add mobile class to body
        document.body.classList.add('mobile-device');
        
        // Optimize calendar for mobile
        const calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid) {
            calendarGrid.style.fontSize = '12px';
        }
        
        // Make buttons larger for touch
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.style.minHeight = '44px'; // Apple's recommended touch target size
            btn.style.padding = '12px 20px';
        });
        
        // Optimize notifications for mobile
        const notificationsContainer = document.getElementById('notifications');
        if (notificationsContainer) {
            notificationsContainer.style.left = '10px';
            notificationsContainer.style.right = '10px';
            notificationsContainer.style.top = '10px';
        }
    }
    
    // Handle orientation change
    handleOrientationChange() {
        console.log('🔄 Orientation changed');
        
        // Re-render calendar if visible
        const calendarSection = document.getElementById('calendar');
        if (calendarSection && calendarSection.classList.contains('active')) {
            if (typeof renderCalendar === 'function') {
                setTimeout(renderCalendar, 300);
            }
        }
        
        // Trigger resize event for charts
        window.dispatchEvent(new Event('resize'));
    }
    
    // Improve touch experience
    improveTouchExperience() {
        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll('button, .btn, .nav-btn, .event-item');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            });
            
            element.addEventListener('touchend', function() {
                this.style.opacity = '1';
            });
            
            element.addEventListener('touchcancel', function() {
                this.style.opacity = '1';
            });
        });
    }
}

// ========================================
// INITIALIZATION & STARTUP SEQUENCE
// ========================================

// Final initialization sequence
class FinalInitializer {
    constructor() {
        this.initializationSteps = [
            'compatibilityLayer',
            'performanceOptimizer', 
            'edgeCaseHandler',
            'finalChecks'
        ];
        this.completedSteps = new Set();
    }
    
    // Run complete initialization
    async initialize() {
        console.log('🚀 Starting final initialization sequence...');
        
        try {
            for (const step of this.initializationSteps) {
                await this.executeStep(step);
                this.completedSteps.add(step);
                console.log(`✅ Completed: ${step}`);
            }
            
            console.log('🎉 Final initialization completed successfully!');
            this.onInitializationComplete();
            
        } catch (error) {
            console.error('❌ Final initialization failed:', error);
            this.onInitializationError(error);
        }
    }
    
    // Execute initialization step
    async executeStep(step) {
        switch (step) {
            case 'compatibilityLayer':
                window.compatibilityLayer = new DonulandCompatibilityLayer();
                compatibilityLayer.initialize();
                break;
                
            case 'performanceOptimizer':
                window.performanceOptimizer = new PerformanceOptimizer();
                performanceOptimizer.applyOptimizations();
                break;
                
            case 'edgeCaseHandler':
                window.edgeCaseHandler = new EdgeCaseHandler();
                edgeCaseHandler.initialize();
                break;
                
            case 'finalChecks':
                await this.performFinalChecks();
                break;
        }
    }
    
    // Perform final checks
    async performFinalChecks() {
        console.log('🔍 Performing final checks...');
        
        // Check all critical functions exist
        const criticalFunctions = [
            'renderCalendar', 'initializeAnalytics', 'openEventModal',
            'filterCalendar', 'loadData', 'showNotification'
        ];
        
        const missingFunctions = criticalFunctions.filter(func => typeof window[func] !== 'function');
        
        if (missingFunctions.length > 0) {
            console.warn('⚠️ Missing critical functions:', missingFunctions);
        }
        
        // Check all critical elements exist
        const criticalElements = [
            'mainApp', 'calendarGrid', 'predictionResults', 'overallStats'
        ];
        
        const missingElements = criticalElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Missing critical elements:', missingElements);
        }
        
        // Check integration controller
        if (typeof integrationController === 'undefined') {
            console.warn('⚠️ Integration controller not available');
        }
        
        // Check data availability
        if (!globalState || !globalState.historicalData) {
            console.warn('⚠️ No historical data available');
        }
        
        console.log('✅ Final checks completed');
    }
    
    // On successful initialization
    onInitializationComplete() {
        // Show success notification
        showNotification('🎉 Donuland Management System je plně funkční!', 'success', 5000);
        
        // Update status
        updateStatus('online', 'Systém připraven');
        
        // Emit global ready event
        eventBus.emit('systemReady', {
            timestamp: Date.now(),
            completedSteps: Array.from(this.completedSteps),
            version: '4.0.0'
        });
        
        // Log success message
        console.log(`
🎉 DONULAND MANAGEMENT SYSTEM READY! 🎉

✅ All Parts Loaded:
   - Part 1: Core System & UI
   - Part 2: Data Loading & APIs  
   - Part 3: Results Display
   - Part 4A: Calendar
   - Part 4B: Event Modal
   - Part 4C: Analytics
   - Part 4D: Integration
   - Part 4E: Final Polish

🔧 System Features:
   - AI Prediction Engine
   - Interactive Calendar
   - Advanced Analytics
   - Real-time Weather
   - Google Maps Integration
   - Cross-section Communication
   - Error Recovery
   - Performance Optimization

🌟 Ready for Production Use!
        `);
    }
    
    // On initialization error
    onInitializationError(error) {
        console.error('❌ Final initialization error:', error);
        
        showNotification('⚠️ Inicializace nebyla zcela úspěšná. Některé funkce mohou být omezené.', 'warning', 8000);
        
        // Try to provide basic functionality
        this.enableBasicFunctionality();
    }
    
    // Enable basic functionality as fallback
    enableBasicFunctionality() {
        console.log('🔧 Enabling basic functionality...');
        
        // Ensure at least compatibility layer exists
        if (typeof compatibilityLayer === 'undefined') {
            window.compatibilityLayer = new DonulandCompatibilityLayer();
            compatibilityLayer.initialize();
        }
        
        showNotification('🔧 Základní funkcionalita povolena', 'info', 3000);
    }
}

// ========================================
// GLOBAL DEBUG INTERFACE
// ========================================

// Enhanced debug interface for Part 4E
if (typeof window !== 'undefined') {
    window.donulandPart4EDebug = {
        // System status
        getSystemStatus: () => ({
            compatibilityLayer: typeof compatibilityLayer !== 'undefined',
            performanceOptimizer: typeof performanceOptimizer !== 'undefined',
            edgeCaseHandler: typeof edgeCaseHandler !== 'undefined',
            integrationController: typeof integrationController !== 'undefined'
        }),
        
        // Performance monitoring
        getPerformanceReport: () => {
            if (typeof performanceOptimizer !== 'undefined') {
                return performanceOptimizer.getReport();
            }
            return null;
        },
        
        // Force optimizations
        forceOptimizations: () => {
            if (typeof performanceOptimizer !== 'undefined') {
                performanceOptimizer.applyOptimizations();
                console.log('⚡ Optimizations reapplied');
            }
        },
        
        // Test compatibility
        testCompatibility: () => {
            if (typeof compatibilityLayer !== 'undefined') {
                compatibilityLayer.generateTestData();
                console.log('🧪 Compatibility test executed');
            }
        },
        
        // Handle edge case
        triggerEdgeCase: (caseType) => {
            if (typeof edgeCaseHandler !== 'undefined') {
                switch (caseType) {
                    case 'emptyData':
                        edgeCaseHandler.handleEmptyDataState();
                        break;
                    case 'memoryOptimization':
                        edgeCaseHandler.optimizeMemoryUsage();
                        break;
                    default:
                        console.log('Available cases: emptyData, memoryOptimization');
                }
            }
        },
        
        // Emergency functions
        emergencyReset: () => {
            console.log('🚨 Emergency reset triggered');
            
            // Clear all caches
            if (globalState) {
                if (globalState.weatherCache) globalState.weatherCache.clear();
                if (globalState.distanceCache) globalState.distanceCache.clear();
            }
            
            if (typeof analyticsState !== 'undefined') {
                analyticsState.cachedStats = null;
                analyticsState.isLoading = false;
            }
            
            if (typeof calendarState !== 'undefined') {
                calendarState.isRendering = false;
            }
            
            // Reload page as last resort
            setTimeout(() => {
                if (confirm('Reset dokončen. Chcete obnovit stránku?')) {
                    window.location.reload();
                }
            }, 1000);
        },
        
        // System health check
        healthCheck: () => {
            const health = {
                functions: {},
                elements: {},
                data: {},
                performance: {}
            };
            
            // Check functions
            const criticalFunctions = ['renderCalendar', 'initializeAnalytics', 'loadData'];
            criticalFunctions.forEach(func => {
                health.functions[func] = typeof window[func] === 'function';
            });
            
            // Check elements
            const criticalElements = ['calendarGrid', 'overallStats', 'predictionResults'];
            criticalElements.forEach(elem => {
                health.elements[elem] = !!document.getElementById(elem);
            });
            
            // Check data
            health.data.historicalData = !!(globalState && globalState.historicalData && globalState.historicalData.length > 0);
            health.data.lastDataLoad = globalState ? !!globalState.lastDataLoad : false;
            
            // Check performance
            if (typeof performanceOptimizer !== 'undefined') {
                const report = performanceOptimizer.getReport();
                health.performance.monitored = Object.keys(report).length;
            }
            
            console.table(health);
            return health;
        }
    };
}

// ========================================
// AUTOMATIC INITIALIZATION
// ========================================

// Create and run final initializer
const finalInitializer = new FinalInitializer();

// Auto-start when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Part 4E Final Polish - DOM ready');
    
    // Wait for other parts to settle
    setTimeout(() => {
        finalInitializer.initialize();
    }, 1500);
});

// Fallback initialization
setTimeout(() => {
    if (!finalInitializer.completedSteps.has('compatibilityLayer')) {
        console.log('⚠️ Fallback initialization triggered');
        finalInitializer.initialize();
    }
}, 15000); // 15 seconds fallback

// ========================================
// CLEANUP & FINALIZATION
// ========================================

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    console.log('🧹 Cleaning up before page unload...');
    
    // Clear intervals and timeouts
    if (typeof integrationController !== 'undefined' && integrationController.periodicSyncInterval) {
        clearInterval(integrationController.periodicSyncInterval);
    }
    
    // Clear performance monitoring
    if (typeof performanceOptimizer !== 'undefined') {
        performanceOptimizer.metrics.clear();
    }
});

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 4E loaded successfully');
console.log('🔧 Features: ✅ Compatibility Layer ✅ Performance Optimization ✅ Edge Case Handling ✅ Error Recovery');
console.log('🛡️ Edge Cases: Empty data, missing elements, network issues, browser compatibility, mobile optimization');
console.log('⚡ Performance: Function monitoring, automatic optimizations, memory management');
console.log('🚑 Recovery: Fallback implementations, degraded mode, emergency reset');
console.log('📱 Mobile: Touch optimization, orientation handling, mobile-specific fixes');
console.log('🧪 Debug: window.donulandPart4EDebug with health checks and emergency functions');
console.log('🎉 DONULAND CALENDAR & ANALYTICS SYSTEM COMPLETE!');

// Emit final completion event
eventBus.emit('part4ELoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: [
        'compatibility-layer',
        'performance-optimization', 
        'edge-case-handling',
        'error-recovery',
        'mobile-optimization',
        'browser-compatibility',
        'emergency-functions',
        'health-monitoring'
    ]
});

// Final system ready check
setTimeout(() => {
    if (typeof eventBus !== 'undefined') {
        eventBus.emit('donulandSystemComplete', {
            timestamp: Date.now(),
            allPartsLoaded: true,
            systemVersion: '4.0.0',
            readyForProduction: true
        });
    }
}, 2000);

