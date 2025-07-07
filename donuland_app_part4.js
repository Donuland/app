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
   DONULAND PART 4C - KOMPLETNÍ ANALYTICS
   Dokončené analytické funkce a vizualizace dat
   ======================================== */

console.log('🍩 Donuland Part 4C (COMPLETE) loading...');

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
const originalInitializeAnalytics = initializeAnalytics;
window.initializeAnalytics = withPerformanceMonitoring(originalInitializeAnalytics, 'initializeAnalytics');

const originalDisplayMonthlyTrends = displayMonthlyTrends;
window.displayMonthlyTrends = withPerformanceMonitoring(originalDisplayMonthlyTrends, 'displayMonthlyTrends');

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
                    case 'overall-stats':
                        updateOverallStats();
                        break;
                    case 'monthly-trends':
                        displayMonthlyTrends();
                        break;
                    case 'top-events':
                        updateTopEvents();
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

// Aplikace error recovery na všechny analytics funkce
const analyticsComponents = [
    { func: updateOverallStats, name: 'overall-stats' },
    { func: updateTopEvents, name: 'top-events' },
    { func: updateTopCities, name: 'top-cities' },
    { func: updateTopCategories, name: 'top-categories' },
    { func: displayMonthlyTrends, name: 'monthly-trends' },
    { func: updatePredictionAccuracy, name: 'prediction-accuracy' },
    { func: updateWeatherImpact, name: 'weather-impact' }
];

analyticsComponents.forEach(component => {
    const originalFunc = component.func;
    window[component.func.name] = function(...args) {
        try {
            return originalFunc.apply(this, args);
        } catch (error) {
            recoverFromAnalyticsError(error, component.name);
        }
    };
});

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 4C COMPLETE loaded successfully');
console.log('📊 Features: ✅ Enhanced Overall Stats ✅ Top Rankings ✅ Interactive Monthly Trends ✅ Prediction Accuracy ✅ Comprehensive Weather Analysis');
console.log('📈 Charts: Interactive bar charts with tooltips and hover effects');
console.log('📄 Export: Complete CSV export with all analytics data');
console.log('🎯 Accuracy: Prediction vs reality comparison system');
console.log('🌤️ Weather: Detailed seasonal and weather type analysis');
console.log('⚡ Performance: Monitoring and error recovery systems');
console.log('🧪 Debug: window.donulandAnalyticsDebug with test data generation');
console.log('💾 Cache: Smart caching system for better performance');
console.log('📱 Responsive: Mobile-optimized charts and layouts');
console.log('⏳ Ready for Part 4D: Complete Calendar & Analytics Integration'); ========================================
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
    console.log('📊 Initializing complete analytics...');
    
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
        setTimeout(() => updatePredictionAccuracy(), 600);
        setTimeout(() => updateWeatherImpact(), 700);
        
        analyticsState.lastUpdate = Date.now();
        console.log('✅ Complete analytics initialized successfully');
        
        // Skrýt loading po dokončení
        setTimeout(() => {
            hideAnalyticsLoading();
        }, 800);
        
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
        'overallStats', 'topEvents', 'topCities', 'topCategories',
        'monthlyTrends', 'predictionAccuracy', 'weatherImpact'
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
        
        html += '</div>';
        
        // Detailní breakdown podle typu počasí
        if (weatherData.weatherBreakdown && weatherData.weatherBreakdown.length > 0) {
            html += '<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">';
            html += '<h5 style="margin: 0 0 15px 0;">🌦️ Prodeje podle typu počasí</h5>';
            
            weatherData.weatherBreakdown.forEach(weather => {
                const icon = getWeatherIcon(weather.type);
                const avgSales = weather.totalSales / weather.events;
                const avgConversion = weather.totalVisitors > 0 ? ((weather.totalSales / weather.totalVisitors) * 100).toFixed(1) : '0';
                
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.5em;">${icon}</span>
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
        
        // Sezónní analýza počasí
        if (weatherData.seasonalAnalysis) {
            html += '<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">';
            html += '<h5 style="margin: 0 0 15px 0;">📅 Sezónní vliv počasí</h5>';
            
            const seasons = [
                { name: 'Jaro', months: [3, 4, 5], icon: '🌸' },
                { name: 'Léto', months: [6, 7, 8], icon: '☀️' },
                { name: 'Podzim', months: [9, 10, 11], icon: '🍂' },
                { name: 'Zima', months: [12, 1, 2], icon: '❄️' }
            ];
            
            seasons.forEach(season => {
                const seasonData = weatherData.seasonalAnalysis[season.name.toLowerCase()];
                if (seasonData && seasonData.events > 0) {
                    const avgSales = seasonData.totalSales / seasonData.events;
                    const avgConversion = seasonData.totalVisitors > 0 ? 
                        ((seasonData.totalSales / seasonData.totalVisitors) * 100).toFixed(1) : '0';
                    
                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 1.5em;">${season.icon}</span>
                                <div>
                                    <div style="font-weight: 600; color: #495057;">${season.name}</div>
                                    <div style="font-size: 0.8em; color: #6c757d;">${seasonData.events} akcí • Ø teplota ${seasonData.avgTemp?.toFixed(1) || 'N/A'}°C</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; color: #495057;">${formatNumber(seasonData.totalSales)} ks</div>
                                <div style="font-size: 0.8em; color: #6c757d;">${formatNumber(avgSales)} ks/akci • ${avgConversion}% konverze</div>
                            </div>
                        </div>
                    `;
                }
            });
            
            html += '</div>';
        }
        
        // Doporučení podle počasí
        html += '<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 20px;">';
        html += '<h5 style="margin: 0 0 15px 0; color: #1976d2;">💡 Strategická doporučení na základě počasí:</h5>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">';
        
        // Doporučení pro dobré počasí
        html += `
            <div style="background: rgba(40, 167, 69, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                <h6 style="margin: 0 0 10px 0; color: #28a745;">☀️ Strategie pro hezké počasí</h6>
                <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 0.9em;">
                    <li>Navyšte zásoby o 20-30% oproti průměru</li>
                    <li>Připravte více chladících boxů pro čokoládové donuty</li>
                    <li>Marketingově využijte předpověď hezkého počasí</li>
                    <li>Zvažte venkovní prezentační stánek</li>
                </ul>
            </div>
        `;
        
        // Doporučení pro špatné počasí
        html += `
            <div style="background: rgba(220, 53, 69, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                <h6 style="margin: 0 0 10px 0; color: #dc3545;">🌧️ Strategie pro špatné počasí</h6>
                <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 0.9em;">
                    <li>Snižte zásoby o 30-40% oproti průměru</li>
                    <li>Připravte krytí a ochranu před deštěm</li>
                    <li>Zvažte speciální akce a slevy</li>
                    <li>Fokus na kvalitu místo kvantity</li>
                </ul>
            </div>
        `;
        
        html += '</div>';
        
        // Specifická doporučení pro čokoládové donuty
        html += '<div style="background: rgba(255, 193, 7, 0.1); padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #ffc107;">';
        html += '<h6 style="margin: 0 0 10px 0; color: #856404;">🍫 Speciální péče o čokoládové donuty</h6>';
        html += '<ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 0.9em;">';
        html += '<li><strong>15-24°C:</strong> ✅ Ideální teplota - čokoláda zůstává stabilní</li>';
        html += '<li><strong>25-27°C:</strong> ⚠️ Pozor - častější kontrola, více stínu</li>';
        html += '<li><strong>28°C+:</strong> 🚨 Kritické - chladící boxy nutné, rychlá spotřeba</li>';
        html += '<li><strong>Déšť:</strong> 💧 Ochrana před vlhkostí, uzavřené balení</li>';
        html += '</ul>';
        html += '</div>';
        
        html += '</div>';
        
        html += '</div>'; // weather-impact-analysis
        
        container.innerHTML = html;
        console.log('✅ Comprehensive weather impact analysis updated');
        
    } catch (error) {
        console.error('❌ Error updating weather impact:', error);
        container.innerHTML = '<div class="error-message">Chyba při komplexní analýze vlivu počasí</div>';
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
    
    // Sezónní analýza
    const seasonalAnalysis = {};
    const seasons = ['jaro', 'léto', 'podzim', 'zima'];
    seasons.forEach(season => {
        seasonalAnalysis[season] = {
            events: 0,
            totalSales: 0,
            totalVisitors: 0,
            totalTemp: 0
        };
    });
    
    eventsWithWeather.forEach(record => {
        if (record.dateFrom) {
            const date = new Date(record.dateFrom);
            const month = date.getMonth() + 1;
            
            let season;
            if (month >= 3 && month <= 5) season = 'jaro';
            else if (month >= 6 && month <= 8) season = 'léto';
            else if (month >= 9 && month <= 11) season = 'podzim';
            else season = 'zima';
            
            seasonalAnalysis[season].events += 1;
            seasonalAnalysis[season].totalSales += record.sales;
            seasonalAnalysis[season].totalVisitors += record.visitors;
        }
    });
    
    return {
        totalEvents: eventsWithWeather.length,
        goodWeatherEvents: goodWeatherEvents.length,
        badWeatherEvents: badWeatherEvents.length,
        avgSalesGoodWeather,
        avgSalesBadWeather,
        weatherImpact,
        weatherBreakdown,
        seasonalAnalysis
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
// HELPER FUNKCE PRO ANALYTICS
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
// ROZŠÍŘENÉ CSS STYLY PRO ANALYTICS
// ========================================

function addEnhancedAnalyticsStyles() {
    const style = document.createElement('style');
    style.id = 'enhanced-analytics-styles';
    style.textContent = `
        .monthly-trends-chart {
            padding: 25px;
            background: linear-gradient(135deg, #f8f9fa, #ffffff);
            border-radius: 12px;
            border: 1px solid #e9ecef;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .trends-container {
            margin: 20px 0;
        }
        
        .trends-chart-wrapper {
            background: #ffffff;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #dee2e6;
            position: relative;
        }
        
        .trends-bars {
            display: flex;
            justify-content: space-around;
            align-items: flex-end;
            min-height: 250px;
            padding: 10px 0;
            position: relative;
            overflow-x: auto;
        }
        
        .trends-bars::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 100%;
            background-image: 
                linear-gradient(to top, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px);
            background-size: 100% 25%, 50px 100%;
            pointer-events: none;
        }
        
        .trend-bar {
            transition: all 0.3s ease;
            cursor: pointer;
            min-height: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .trend-bar:hover {
            filter: brightness(1.1);
            transform: scale(1.1);
            z-index: 10;
        }
        
        .trend-month-container {
            min-width: 80px;
            position: relative;
        }
        
        .top-item {
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .top-item:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .prediction-accuracy-analysis,
        .weather-impact-analysis {
            background: linear-gradient(135deg, #e3f2fd, #f0f9ff);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #bbdefb;
        }
        
        .error-message {
            text-align: center;
            padding: 40px;
            color: #dc3545;
            background: #f8d7da;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #f5c6cb;
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e9ecef;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        #trendTooltip {
            background: rgba(0,0,0,0.9) !important;
            color: white !important;
            padding: 10px !important;
            border-radius: 5px !important;
            font-size: 0.8em !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
            max-width: 200px;
            word-wrap: break-word;
        }
        
        .trends-header {
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 15px;
        }
        
        .trends-legend {
            border: 1px solid #e9ecef;
        }
        
        .trends-summary {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        @media (max-width: 768px) {
            .trends-bars {
                padding: 10px;
                min-height: 200px;
            }
            
            .trend-month-container {
                min-width: 60px;
            }
            
            .trend-bar {
                width: 15px !important;
            }
            
            .trends-legend {
                flex-direction: column;
                gap: 10px;
            }
        }
        
        @media (max-width: 480px) {
            .monthly-trends-chart {
                padding: 15px;
            }
            
            .trends-bars {
                min-height: 150px;
            }
            
            .trend-bar {
                width: 12px !important;
            }
        }
    `;
    
    // Odstranit existující styly
    const existingStyle = document.getElementById('enhanced-analytics-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    document.head.appendChild(style);
}

// ========================================
// CSV EXPORT ROZŠÍŘENÝ
// ========================================

function exportAnalyticsToCSV() {
    console.log('📄 Exporting comprehensive analytics to CSV...');
    
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
        
        let csvContent = 'Donuland Comprehensive Analytics Export\n';
        csvContent += `Export Date,${new Date().toLocaleDateString('cs-CZ')}\n`;
        csvContent += `Export Time,${new Date().toLocaleTimeString('cs-CZ')}\n\n`;
        
        // Rozšířené celkové statistiky
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
        
        // Rozšířené top události
        csvContent += 'TOP UDÁLOSTI (TOP 20)\n';
        csvContent += 'Pořadí,Název,Město,Datum,Kategorie,Prodej,Návštěvníci,Konverze,Obrat,Zisk,Rating\n';
        topEvents.forEach((event, index) => {
            const conversion = event.visitors > 0 ? ((event.sales / event.visitors) * 100).toFixed(1) : '0';
            const revenue = event.sales * CONFIG.DONUT_PRICE;
            const profit = revenue - (event.sales * CONFIG.DONUT_COST);
            csvContent += `${index + 1},"${event.eventName}","${event.city}","${formatDate(event.dateFrom)}","${event.category}",${event.sales},${event.visitors},${conversion}%,${revenue},${profit},${event.rating || 'N/A'}\n`;
        });
        csvContent += '\n';
        
        // Rozšířené top města
        csvContent += 'TOP MĚSTA (TOP 20)\n';
        csvContent += 'Pořadí,Město,Celkem prodejů,Akcí,Průměr/akci,Průměrná konverze,Celkový obrat,Celkový zisk\n';
        topCities.forEach((city, index) => {
            const avgPerEvent = city.totalSales / city.eventsCount;
            const totalProfit = city.totalRevenue - (city.totalSales * CONFIG.DONUT_COST);
            csvContent += `${index + 1},"${city.name}",${city.totalSales},${city.eventsCount},${avgPerEvent.toFixed(1)},${city.averageConversion.toFixed(1)}%,${city.totalRevenue},${totalProfit}\n`;
        });
        csvContent += '\n';
        
        // Rozšířené top kategorie
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
        const filename = `donuland_complete_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        showNotification('📄 Kompletní analytics exportovány do CSV', 'success');
        console.log('✅ Complete analytics exported to CSV:', filename);
        
    } catch (error) {
        console.error('❌ Error exporting complete analytics:', error);
        showNotification('❌ Chyba při exportu analytics', 'error');
    }
}

// ========================================
// EVENT LISTENERS PRO KOMPLETNÍ ANALYTICS
// ========================================

// Event listener pro změnu na analytics sekci
eventBus.on('sectionChanged', (data) => {
    if (data.section === 'analytics') {
        console.log('📊 Analytics section opened - initializing complete analytics...');
        setTimeout(() => {
            addEnhancedAnalyticsStyles();
            initializeAnalytics();
        }, 300);
    }
});

// Event listener pro načtení dat
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded - updating complete analytics...');
    analyticsState.cachedStats = null; // Clear cache
    
    // Pokud je analytics sekce aktivní, aktualizuj
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && analyticsSection.classList.contains('active')) {
        setTimeout(() => {
            initializeAnalytics();
        }, 1000);
    }
});

// Event listener pro změny událostí
eventBus.on('eventEdited', () => {
    console.log('📝 Event edited - updating complete analytics...');
    analyticsState.cachedStats = null;
    
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && analyticsSection.classList.contains('active')) {
        setTimeout(() => {
            initializeAnalytics();
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
// INICIALIZACE A DEBUGGING
// ========================================

// Automatická inicializace při načtení
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing Part 4C - Complete Analytics...');
    
    // Přidat rozšířené styly pro analytics
    addEnhancedAnalyticsStyles();
    
    // Auto-inicializace pokud jsou data dostupná a je aktivní analytics sekce
    setTimeout(() => {
        const analyticsSection = document.getElementById('analytics');
        if (analyticsSection && analyticsSection.classList.contains('active') && 
            globalState.historicalData && globalState.historicalData.length > 0) {
            initializeAnalytics();
        }
    }, 2000);
    
    console.log('✅ Part 4C Complete initialized');
});

//
        }
    });
}

function hideAnalyticsLoading() {
    console.log('✅ Analytics loading completed');
}

// Zobrazení zprávy o chybějících datech
function displayNoDataMessage() {
    const containers = [
        'overallStats', 'topEvents', 'topCities', 'topCategories',
        'monthlyTrends', 'predictionAccuracy', 'weatherImpact'
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
// CELKOVÉ STATISTIKY (ROZŠÍŘENÉ)
// ========================================

function updateOverallStats() {
    console.log('📈 Updating comprehensive overall statistics...');
    
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
                <div class="stat-value">${formatNumber(stats.totalProfit)}</div>
                <div class="stat-label">Odhadovaný zisk</div>
            </div>
        `;
        
        container.innerHTML = html;
        console.log('✅ Comprehensive overall stats updated');
        
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
// TOP VÝSLEDKY (ROZŠÍŘENÉ)
// ========================================

function updateTopEvents() {
    console.log('🏆 Updating enhanced top events...');
    
    const container = document.getElementById('topEvents');
    if (!container) return;
    
    try {
        const topEvents = getTopEvents(15); // Více událostí
        
        if (topEvents.length === 0) {
            container.innerHTML = '<div class="no-data">Žádné události k zobrazení</div>';
            return;
        }
        
        let html = '<div class="top-events-header" style="margin-bottom: 15px;">';
        html += '<h4 style="margin: 0;">🏆 Top výkonné akce</h4>';
        html += `<p style="color: #6c757d; margin: 5px 0 0 0; font-size: 0.9em;">Seřazeno podle celkového prodeje z ${topEvents.length} nejlepších akcí</p>`;
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
        console.log('✅ Enhanced top events updated');
        
    } catch (error) {
        console.error('❌ Error updating top events:', error);
        container.innerHTML = '<div class="error-message">Chyba při načítání top akcí</div>';
    }
}

function updateTopCities() {
    console.log('🏙️ Updating enhanced top cities...');
    
    const container = document.getElementById('topCities');
    if (!container) return;
    
    try {
        const topCities = getTopCities(15);
        
        if (topCities.length === 0) {
            container.innerHTML = '<div class="no-data">Žádná města k zobrazení</div>';
            return;
        }
        
        let html = '<div class="top-cities-header" style="margin-bottom: 15px;">';
        html += '<h4 style="margin: 0;">🏙️ Nejúspěšnější města</h4>';
        html += `<p style="color: #6c757d; margin: 5px 0 0 0; font-size: 0.9em;">Seřazeno podle celkového prodeje ze ${topCities.length} měst</p>`;
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
        console.log('✅ Enhanced top cities updated');
        
    } catch (error) {
        console.error('❌ Error updating top cities:', error);
        container.innerHTML = '<div class="error-message">Chyba při načítání top měst</div>';
    }
}

function updateTopCategories() {
    console.log('📊 Updating enhanced top categories...');
    
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
        html += `<p style="color: #6c757d; margin: 5px 0 0 0; font-size: 0.9em;">Analýza výkonnosti podle typů akcí</p>`;
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
        console.log('✅ Enhanced top categories updated');
        
    } catch (error) {
        console.error('❌ Error updating top categories:', error);
        container.innerHTML = '<div class="error-message">Chyba při načítání top kategorií</div>';
    }
}

// ========================================
// ROZŠÍŘENÉ DATA PROCESSING
// ========================================

function getTopEvents(limit = 15) {
    return globalState.historicalData
        .filter(record => record.sales > 0 && record.visitors > 0)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit);
}

function getTopCities(limit = 15) {
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
// VYLEPŠENÝ MĚSÍČNÍ TRENDY GRAF
// ========================================

function displayMonthlyTrends() {
    console.log('📈 Generating enhanced monthly trends...');
    
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
                        totalVisitors: 0,
                        totalProfit: 0
                    });
                }
                
                const monthData = monthlyData.get(monthKey);
                monthData.totalSales += record.sales;
                monthData.eventsCount += 1;
                monthData.totalRevenue += (record.sales * CONFIG.DONUT_PRICE);
                monthData.totalVisitors += record.visitors;
                monthData.totalProfit += (record.sales * (CONFIG.DONUT_PRICE - CONFIG.DONUT_COST));
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
        
        let html = '<div class="monthly-trends-chart">';
        html += '<div class="trends-header" style="text-align: center; margin-bottom: 25px;">';
        html += '<h4 style="margin: 0 0 10px 0;">📈 Měsíční trendy prodeje a obratů</h4>';
        html += `<p style="color: #6c757d; margin: 0; font-size: 0.9em;">Analýza posledních ${sortedMonths.length} měsíců s daty</p>`;
        html += '</div>';
        
        // Graf jako interaktivní sloupce
        html += '<div class="trends-container">';
        html += '<div class="trends-chart-wrapper">';
        html += '<div class="trends-bars">';
        
        const maxSales = Math.max(...sortedMonths.map(m => m.totalSales));
        const maxRevenue = Math.max(...sortedMonths.map(m => m.totalRevenue));
        const maxProfit = Math.max(...sortedMonths.map(m => m.totalProfit));
        
        sortedMonths.forEach((monthData, index) => {
            const [year, month] = monthData.month.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('cs-CZ', { 
                month: 'long', 
                year: 'numeric' 
            });
            const shortMonthName = new Date(year, month - 1).toLocaleDateString('cs-CZ', { 
                month: 'short'
            });
            
            const salesHeight = maxSales > 0 ? (monthData.totalSales / maxSales) * 100 : 0;
            const revenueHeight = maxRevenue > 0 ? (monthData.totalRevenue / maxRevenue) * 90 : 0;
            const profitHeight = maxProfit > 0 ? (monthData.totalProfit / maxProfit) * 80 : 0;
            
            const avgConversion = monthData.totalVisitors > 0 ? 
                ((monthData.totalSales / monthData.totalVisitors) * 100).toFixed(1) : '0';
            
            // Barvy pro různé metriky
            const salesColor = `hsl(${120 + index * 15}, 70%, 55%)`;
            const revenueColor = `hsl(${200 + index * 10}, 70%, 55%)`;
            const profitColor = `hsl(${60 + index * 20}, 70%, 55%)`;
            
            html += `
                <div class="trend-month-container" style="display: flex; flex-direction: column; align-items: center; margin: 0 5px; position: relative;">
                    <div style="display: flex; gap: 3px; align-items: flex-end; height: 220px; margin-bottom: 15px;" 
                         onmouseover="showTrendTooltip('${monthName}', ${monthData.totalSales}, ${monthData.totalRevenue}, ${monthData.totalProfit}, ${monthData.eventsCount}, '${avgConversion}')"
                         onmouseout="hideTrendTooltip()">
                        <!-- Sloupec prodejů -->
                        <div class="trend-bar sales-bar" 
                             style="width: 18px; 
                                    height: ${salesHeight}%; 
                                    background: linear-gradient(to top, ${salesColor}, ${salesColor}90);
                                    border-radius: 3px 3px 0 0;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    border: 2px solid ${salesColor};" 
                             title="Prodeje: ${formatNumber(monthData.totalSales)} ks"
                             onmouseover="this.style.transform='scale(1.1)'"
                             onmouseout="this.style.transform='scale(1)'">
                        </div>
                        <!-- Sloupec obratů -->
                        <div class="trend-bar revenue-bar" 
                             style="width: 18px; 
                                    height: ${revenueHeight}%; 
                                    background: linear-gradient(to top, ${revenueColor}, ${revenueColor}90);
                                    border-radius: 3px 3px 0 0;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    border: 2px solid ${revenueColor};" 
                             title="Obrat: ${formatCurrency(monthData.totalRevenue)}"
                             onmouseover="this.style.transform='scale(1.1)'"
                             onmouseout="this.style.transform='scale(1)'">
                        </div>
                        <!-- Sloupec zisků -->
                        <div class="trend-bar profit-bar" 
                             style="width: 18px; 
                                    height: ${profitHeight}%; 
                                    background: linear-gradient(to top, ${profitColor}, ${profitColor}90);
                                    border-radius: 3px 3px 0 0;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    border: 2px solid ${profitColor};" 
                             title="Zisk: ${formatCurrency(monthData.totalProfit)}"
                             onmouseover="this.style.transform='scale(1.1)'"
                             onmouseout="this.style.transform='scale(1)'">
                        </div>
                    </div>
                    
                    <!-- Popisky -->
                    <div style="text-align: center; font-size: 0.8em;">
                        <div style="font-weight: 600; margin-bottom: 5px; color: #495057;">${shortMonthName}</div>
                        <div style="color: ${salesColor}; font-size: 0.7em; font-weight: 600;">${formatNumber(monthData.totalSales)} ks</div>
                        <div style="color: ${revenueColor}; font-size: 0.7em;">${formatCurrency(monthData.totalRevenue)}</div>
                        <div style="color: #6c757d; font-size: 0.7em;">${monthData.eventsCount} akcí</div>
                        <div style="color: #9c27b0; font-size: 0.7em; font-weight: 600;">${avgConversion}%</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>'; // trends-chart-wrapper
        
        // Rozšířená legenda
        html += `
            <div class="trends-legend" style="display: flex; justify-content: center; gap: 25px; margin: 20px 0; padding: 15px; background: rgba(248, 249, 250, 0.8); border-radius: 8px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 12px; background: linear-gradient(to right, hsl(135, 70%, 55%), hsl(135, 70%, 55%)90); border-radius: 3px; border: 1px solid hsl(135, 70%, 55%);"></div>
                    <span style="font-size: 0.9em; font-weight: 500;">Prodeje (ks)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 12px; background: linear-gradient(to right, hsl(210, 70%, 55%), hsl(210, 70%, 55%)90); border-radius: 3px; border: 1px solid hsl(210, 70%, 55%);"></div>
                    <span style="font-size: 0.9em; font-weight: 500;">Obraty (Kč)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 20px; height: 12px; background: linear-gradient(to right, hsl(80, 70%, 55%), hsl(80, 70%, 55%)90); border-radius: 3px; border: 1px solid hsl(80, 70%, 55%);"></div>
                    <span style="font-size: 0.9em; font-weight: 500;">Zisky (Kč)</span>
                </div>
            </div>
        `;
        
        html += '</div>'; // trends-container
        
        // Rozšířené souhrnné statistiky
        const totalSales = sortedMonths.reduce((sum, m) => sum + m.totalSales, 0);
        const totalRevenue = sortedMonths.reduce((sum, m) => sum + m.totalRevenue, 0);
        const totalEvents = sortedMonths.reduce((sum, m) => sum + m.eventsCount, 0);
        const totalVisitors = sortedMonths.reduce((sum, m) => sum + m.totalVisitors, 0);
        const totalProfit = sortedMonths.reduce((sum, m) => sum + m.totalProfit, 0);
        
        const avgSalesPerMonth = totalSales / sortedMonths.length;
        const avgRevenuePerMonth = totalRevenue / sortedMonths.length;
        const avgEventsPerMonth = totalEvents / sortedMonths.length;
        const avgProfitPerMonth = totalProfit / sortedMonths.length;
        const overallConversion = totalVisitors > 0 ? ((totalSales / totalVisitors) * 100).toFixed(1) : '0';
        
        // Trend analýza
        let trendDirection = '→';
        let trendColor = '#6c757d';
        let trendText = 'Stabilní';
        
        if (sortedMonths.length >= 3) {
            const recentSales = sortedMonths.slice(-3).reduce((sum, m) => sum + m.totalSales, 0) / 3;
            const olderSales = sortedMonths.slice(0, 3).reduce((sum, m) => sum + m.totalSales, 0) / 3;
            
            if (recentSales > olderSales * 1.1) {
                trendDirection = '📈';
                trendColor = '#28a745';
                trendText = 'Rostoucí trend';
            } else if (recentSales < olderSales * 0.9) {
                trendDirection = '📉';
                trendColor = '#dc3545';
                trendText = 'Klesající trend';
            }
        }
        
        html += `
            <div class="trends-summary" style="background: linear-gradient(135deg, #e3f2fd, #f0f9ff); padding: 25px; border-radius: 12px; margin-top: 25px; border: 1px solid #bbdefb;">
                <h5 style="margin: 0 0 20px 0; color: #1976d2; text-align: center; font-size: 1.1em;">📊 Detailní shrnutí za ${sortedMonths.length} měsíců</h5>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 8px; border: 1px solid rgba(25, 118, 210, 0.2);">
                        <div style="font-size: 1.4em; font-weight: 700; color: #1976d2; margin-bottom: 5px;">${formatNumber(totalSales)}</div>
                        <div style="font-size: 0.85em; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Celkem prodáno</div>
                        <div style="font-size: 0.75em; color: #9c27b0; font-weight: 600;">${formatNumber(Math.round(avgSalesPerMonth))}/měsíc</div>
                    </div>
                    
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 8px; border: 1px solid rgba(25, 118, 210, 0.2);">
                        <div style="font-size: 1.4em; font-weight: 700; color: #388e3c; margin-bottom: 5px;">${formatCurrency(totalRevenue)}</div>
                        <div style="font-size: 0.85em; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Celkový obrat</div>
                        <div style="font-size: 0.75em; color: #9c27b0; font-weight: 600;">${formatCurrency(avgRevenuePerMonth)}/měsíc</div>
                    </div>
                    
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 8px; border: 1px solid rgba(25, 118, 210, 0.2);">
                        <div style="font-size: 1.4em; font-weight: 700; color: #f57c00; margin-bottom: 5px;">${formatCurrency(totalProfit)}</div>
                        <div style="font-size: 0.85em; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Celkový zisk</div>
                        <div style="font-size: 0.75em; color: #9c27b0; font-weight: 600;">${formatCurrency(avgProfitPerMonth)}/měsíc</div>
                    </div>
                    
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 8px; border: 1px solid rgba(25, 118, 210, 0.2);">
                        <div style="font-size: 1.4em; font-weight: 700; color: #e91e63; margin-bottom: 5px;">${totalEvents}</div>
                        <div style="font-size: 0.85em; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Celkem akcí</div>
                        <div style="font-size: 0.75em; color: #9c27b0; font-weight: 600;">${avgEventsPerMonth.toFixed(1)}/měsíc</div>
                    </div>
                    
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 8px; border: 1px solid rgba(25, 118, 210, 0.2);">
                        <div style="font-size: 1.4em; font-weight: 700; color: #9c27b0; margin-bottom: 5px;">${overallConversion}%</div>
                        <div style="font-size: 0.85em; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Celková konverze</div>
                        <div style="font-size: 0.75em; color: #9c27b0; font-weight: 600;">${formatNumber(totalVisitors)} návštěvníků</div>
                    </div>
                    
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 8px; border: 1px solid ${trendColor};">
                        <div style="font-size: 1.4em; font-weight: 700; color: ${trendColor}; margin-bottom: 5px;">${trendDirection}</div>
                        <div style="font-size: 0.85em; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Trend</div>
                        <div style="font-size: 0.75em; color: ${trendColor}; font-weight: 600;">${trendText}</div>
                    </div>
                </div>
                
                <!-- Insights -->
                <div style="background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <h6 style="margin: 0 0 10px 0; color: #495057;">💡 Klíčová pozorování:</h6>
                    <ul style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 0.9em;">
                        <li>Nejúspěšnější měsíc: ${formatNumber(Math.max(...sortedMonths.map(m => m.totalSales)))} ks prodeje</li>
                        <li>Průměrná návratnost: ${((totalProfit / totalRevenue) * 100).toFixed(1)}% marže</li>
                        <li>Stabilita prodeje: ${((Math.min(...sortedMonths.map(m => m.totalSales)) / Math.max(...sortedMonths.map(m => m.totalSales))) * 100).toFixed(0)}% konzistence</li>
                        ${trendText !== 'Stabilní' ? `<li>Trend směřování: ${trendText.toLowerCase()} v posledních 3 měsících</li>` : ''}
                    </ul>
                </div>
            </div>
        `;
        
        html += '</div>'; // monthly-trends-chart
        
        container.innerHTML = html;
        
        console.log(`✅ Enhanced monthly trends displayed with ${sortedMonths.length} months`);
        
    } catch (error) {
        console.error('❌ Error generating enhanced monthly trends:', error);
        container.innerHTML = '<div class="error-message">Chyba při generování pokročilých trendů</div>';
    }
}

// Funkce pro tooltip trendů
function showTrendTooltip(monthName, sales, revenue, profit, events, conversion) {
    const tooltip = document.getElementById('trendTooltip');
    if (tooltip) {
        tooltip.innerHTML = `
            <strong>${monthName}</strong><br>
            🍩 Prodeje: ${formatNumber(sales)} ks<br>
            💰 Obrat: ${formatCurrency(revenue)}<br>
            💎 Zisk: ${formatCurrency(profit)}<br>
            📊 Akcí: ${events}<br>
            🎯 Konverze: ${conversion}%
        `;
        tooltip.style.display = 'block';
    }
}

function hideTrendTooltip() {
    const tooltip = document.getElementById('trendTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// ========================================
// ROZŠÍŘENÁ PŘESNOST PREDIKCÍ
// ========================================

function updatePredictionAccuracy() {
    console.log('🎯 Updating enhanced prediction accuracy...');
    
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
        
        let html = '<div class="prediction-accuracy-analysis">';
        html += '<h4 style="margin: 0 0 20px 0; text-align: center;">🎯 Přesnost AI predikcí</h4>';
        
        // Celkové metriky přesnosti
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">';
        
        const avgAccuracy = accuracyData.averageAccuracy;
        const accuracyColor = avgAccuracy >= 80 ? '#28a745' : avgAccuracy >= 60 ? '#ffc107' : '#dc3545';
        const accuracyIcon = avgAccuracy >= 80 ? '🎯' : avgAccuracy >= 60 ? '⚠️' : '❌';
        
        html += `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid ${accuracyColor};">
                <div style="font-size: 2em; margin-bottom: 10px;">${accuracyIcon}</div>
                <div style="font-size: 1.8em; font-weight: bold; color: ${accuracyColor}; margin-bottom: 5px;">${avgAccuracy.toFixed(1)}%</div>
                <div style="color: #6c757d; font-size: 0.9em;">Průměrná přesnost</div>
                <div style="color: #6c757d; font-size: 0.8em; margin-top: 5px;">${accuracyData.comparisons.length} porovnání</div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 2em; margin-bottom: 10px;">📈</div>
                <div style="font-size: 1.5em; font-weight: bold; color: #17a2b8; margin-bottom: 5px;">${formatNumber(Math.abs(accuracyData.averageDifference))}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Průměrná odchylka</div>
                <div style="color: #6c757d; font-size: 0.8em; margin-top: 5px;">ks prodeje</div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 2em; margin-bottom: 10px;">${accuracyData.overestimations > accuracyData.underestimations ? '📊' : '📉'}</div>
                <div style="font-size: 1.5em; font-weight: bold; color: #9c27b0; margin-bottom: 5px;">${accuracyData.overestimations}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Nadhodnocení</div>
                <div style="color: #6c757d; font-size: 0.8em; margin-top: 5px;">vs ${accuracyData.underestimations} podhodnocení</div>
            </div>
        `;
        
        html += '</div>';
        
        // Detailní přehled porovnání
        html += '<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
        html += '<h5 style="margin: 0 0 15px 0;">📋 Detailní porovnání predikcí</h5>';
        
        accuracyData.comparisons.slice(0, 10).forEach((comp, index) => {
            const accuracy = comp.accuracy;
            const accuracyColor = accuracy >= 80 ? '#28a745' : accuracy >= 60 ? '#ffc107' : '#dc3545';
            const difference = comp.predicted - comp.actual;
            const differenceIcon = difference > 0 ? '📈' : difference < 0 ? '📉' : '✅';
            const differenceText = difference > 0 ? `+${Math.abs(difference)}` : `-${Math.abs(difference)}`;
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #495057;">${escapeHtml(comp.eventName)}</div>
                        <div style="font-size: 0.8em; color: #6c757d;">${formatDate(comp.date)} • ${escapeHtml(comp.city)}</div>
                    </div>
                    <div style="text-align: center; margin: 0 20px;">
                        <div style="font-size: 0.9em; color: #6c757d;">Predikce vs Realita</div>
                        <div style="font-weight: 600;">${formatNumber(comp.predicted)} vs ${formatNumber(comp.actual)} ks</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: ${accuracyColor};">${accuracy.toFixed(1)}%</div>
                        <div style="font-size: 0.8em; color: #6c757d;">${differenceIcon} ${differenceText} ks</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Doporučení pro zlepšení
        html += '<div style="background: #e3f2fd; padding: 20px; border-radius: 8px;">';
        html += '<h5 style="margin: 0 0 15px 0; color: #1976d2;">💡 Doporučení pro zlepšení přesnosti</h5>';
        html += '<ul style="margin: 0; padding-left: 20px; color: #495057;">';
        
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
        console.log('✅ Enhanced prediction accuracy updated');
        
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
// KOMPLETNÍ VLIV POČASÍ
// ========================================

function updateWeatherImpact() {
    console.log('🌤️ Updating comprehensive weather impact analysis...');
    
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
        
        let html = '<div class="weather-impact-analysis">';
        html += '<h4 style="margin: 0 0 20px 0; text-align: center;">🌤️ Komplexní analýza vlivu počasí</h4>';
        
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">';
        
        // Celkové statistiky počasí
        html += `
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #17a2b8;">
                <div style="font-size: 1.5em; font-weight: bold; color: #17a2b8;">${weatherData.totalEvents}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Akcí s daty o počasí</div>
            </div>
        `;
        
        if (weatherData.avgSalesGoodWeather !== null) {
            html += `
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #28a745;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">${formatNumber(weatherData.avgSalesGoodWeather)}</div>
                    <div style="color: #6c757d; font-size: 0.9em;">Ø prodej - hezké počasí</div>
                    <div style="color: #6c757d; font-size: 0.8em;">${weatherData.goodWeatherEvents} akcí</div>
                </div>
            `;
        }
        
        if (weatherData.avgSalesBadWeather !== null) {
            html += `
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #dc3545;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #dc3545;">${formatNumber(weatherData.avgSalesBadWeather)}</div>
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
                    <div style="font-size: 1.5em; font-weight: bold; color: ${impactColor};">${impactIcon} ${Math.abs(weatherData.weatherImpact).toFixed(1)}%</div>
                    <div style="color: #6c757d; font-size: 0.9em;">Vliv počasí</div>
                    <div style="color: #6c757d; font-size: 0.8em;">${weatherData.weatherImpact > 0 ? 'pozitivní' : 'negativní'}</div>
                </div>
            `; trends-bars
        
        // Tooltip pro detaily
        html += '<div id="trendTooltip" style="display: none; position: absolute; background: rgba(0,0,0,0.9); color: white; padding: 10px; border-radius: 5px; font-size: 0.8em; z-index: 1000; pointer-events: none;"></div>';
        
        html += '</div>'; //
