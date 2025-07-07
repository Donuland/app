/* ========================================
   DONULAND PART 4A - OPRAVENÝ KALENDÁŘ
   Funkční kalendář bez testovacích dat a alert zpráv
   ======================================== */

console.log('🍩 Donuland Part 4A (Fixed) loading...');

// ========================================
// KALENDÁŘNÍ STAV - POUZE POKUD NEEXISTUJE
// ========================================

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
// UDÁLOSTI A DATA - POUZE REÁLNÁ DATA
// ========================================

// Získání událostí pro konkrétní datum
function getEventsForDate(date) {
    // POUZE pokud existují historická data
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
    
    // Přidat uložené predikce POUZE pokud existují
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        if (savedPredictions.length > 0) {
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
        }
    } catch (error) {
        // Tiše ignorovat chyby s localStorage
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
}

// Naplnění filter dropdownů
function populateFilterDropdowns() {
    console.log('📋 Populating filter dropdowns...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('ℹ️ No historical data for filters');
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
                    <p>V tomto měsíci nejsou evidované žádné akce.</p>
                    <p style="font-size: 0.9em; margin-top: 15px;">
                        💡 <strong>Tip:</strong> Načtěte historická data nebo vytvořte novou predikci
                    </p>
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
// MODAL FUNKCE (PLACEHOLDER)
// ========================================

// Otevření modalu události (placeholder)
function openEventModal(event = null, defaultDate = null) {
    console.log('📝 Opening event modal:', { event, defaultDate });
    
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'flex';
        // Modal bude implementován v Part 4B
    } else {
        console.log('Modal bude implementován v Part 4B');
    }
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
        } else {
            // Vykreslit prázdný kalendář
            renderCalendar();
        }
    }, 2000);
    
    console.log('✅ Part 4A initialized');
});

console.log('✅ Donuland Part 4A (Fixed) loaded successfully');
console.log('📅 Features: ✅ Basic Calendar ✅ Event Display ✅ Filters ✅ Month Navigation ✅ No Test Data ✅ No Alerts');
console.log('⏳ Ready for Part 4B: Event Modal & Data Management');

// Event pro signalizaci dokončení části 4A
eventBus.emit('part4ALoaded', { 
    timestamp: Date.now(),
    version: '1.1.0',
    features: ['calendar', 'filters', 'month-navigation', 'events-display', 'no-test-data']
});
/* ========================================
   DONULAND PART 4B - OPRAVENÝ EVENT MODAL
   Modal pro editaci událostí bez chyb a s lepší funkcionalitou
   ======================================== */

console.log('🍩 Donuland Part 4B (Fixed) loading...');

// ========================================
// ROZŠÍŘENÉ KALENDÁŘNÍ FUNKCE
// ========================================

// Přepsání openEventModal s plnou funkcionalitou
function openEventModal(event = null, defaultDate = null) {
    console.log('📝 Opening enhanced event modal:', { event, defaultDate });
    
    try {
        const modal = document.getElementById('eventModal');
        if (!modal) {
            console.warn('⚠️ Event modal not found in DOM');
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
        
        if (elements.sales) {
            elements.sales.value = event.sales || event.actualSales || '';
            elements.sales.readOnly = false; // Prodej lze editovat
        }
        
        if (elements.notes) {
            elements.notes.value = event.notes || (event.data && event.data.notes) || '';
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
                if (el.value !== undefined) {
                    el.value = '';
                }
                if (el.readOnly !== undefined) {
                    el.readOnly = false;
                }
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
        
        // Skrýt detail section pro nové události
        removeEventDetailsFromModal();
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

// Odstranění detail section z modalu
function removeEventDetailsFromModal() {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    
    const existingDetails = modalBody.querySelector('.event-details-section');
    if (existingDetails) {
        existingDetails.remove();
    }
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
        try {
            const savedEdits = JSON.parse(localStorage.getItem('donuland_event_edits') || '{}');
            savedEdits[eventName] = {
                sales: sales ? parseInt(sales) : null,
                notes: notes || '',
                editedAt: new Date().toISOString()
            };
            localStorage.setItem('donuland_event_edits', JSON.stringify(savedEdits));
        } catch (e) {
            console.warn('⚠️ Could not save to localStorage:', e);
        }
        
        showNotification('✅ Změny uloženy', 'success', 3000);
        closeModal();
        
        // Aktualizovat kalendář
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
        
        // Emit event pro ostatní komponenty
        eventBus.emit('eventEdited', {
            eventName: eventName,
            sales: sales,
            notes: notes
        });
        
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
        try {
            const deletedEvents = JSON.parse(localStorage.getItem('donuland_deleted_events') || '[]');
            deletedEvents.push({
                eventName: eventName,
                deletedAt: new Date().toISOString()
            });
            localStorage.setItem('donuland_deleted_events', JSON.stringify(deletedEvents));
        } catch (e) {
            console.warn('⚠️ Could not save to localStorage:', e);
        }
        
        showNotification('🗑️ Událost označena jako smazaná', 'warning', 4000);
        closeModal();
        
        // Aktualizovat kalendář
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
        
        // Emit event pro ostatní komponenty
        eventBus.emit('eventDeleted', {
            eventName: eventName
        });
        
    } catch (error) {
        console.error('❌ Error deleting event:', error);
        showNotification('❌ Chyba při mazání události', 'error');
    }
}

// ========================================
// POKROČILÉ ZOBRAZENÍ UDÁLOSTÍ
// ========================================

// Rozšířená funkce pro získání událostí s editacemi
function getEventsForDateEnhanced(date) {
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return [];
    }
    
    const events = [];
    const dateStr = formatDateForComparison(date);
    
    // Načíst smazané události
    let deletedEventNames = [];
    try {
        const deletedEvents = JSON.parse(localStorage.getItem('donuland_deleted_events') || '[]');
        deletedEventNames = deletedEvents.map(e => e.eventName);
    } catch (e) {
        // Ignorovat chyby localStorage
    }
    
    // Načíst editace
    let savedEdits = {};
    try {
        savedEdits = JSON.parse(localStorage.getItem('donuland_event_edits') || '{}');
    } catch (e) {
        // Ignorovat chyby localStorage
    }
    
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
function createEventElementEnhanced(event) {
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

// Rozšířená funkce pro populaci filtrů s více daty
function populateFilterDropdownsEnhanced() {
    console.log('📋 Populating enhanced filter dropdowns...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('ℹ️ No historical data for filters');
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
// MODAL UTILITY FUNKCE
// ========================================

// Zavření modalu
function closeModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'none';
        eventBus.emit('modalClosed');
    }
}

// ========================================
// EVENT LISTENERS PRO PART 4B
// ========================================

// Event listener pro změnu predikcí
eventBus.on('predictionSaved', (data) => {
    console.log('🔮 Prediction saved, updating calendar...');
    setTimeout(() => {
        if (typeof populateFilterDropdowns === 'function') {
            populateFilterDropdowns();
        }
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
    }, 200);
});

// Event listener pro aktualizaci po editaci události
eventBus.on('eventEdited', (data) => {
    console.log('📝 Event edited, refreshing displays...');
    setTimeout(() => {
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
        // Aktualizovat analytics pokud je aktivní
        if (typeof initializeAnalytics === 'function') {
            const analyticsSection = document.getElementById('analytics');
            if (analyticsSection && analyticsSection.classList.contains('active')) {
                initializeAnalytics();
            }
        }
    }, 300);
});

// Event listener pro aktualizace po smazání události
eventBus.on('eventDeleted', (data) => {
    console.log('🗑️ Event deleted, refreshing displays...');
    setTimeout(() => {
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
        if (typeof populateFilterDropdowns === 'function') {
            populateFilterDropdowns();
        }
    }, 300);
});

// ========================================
// INICIALIZACE PART 4B
// ========================================

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Initializing Part 4B - Event Modal...');
    
    // Setup modal event listeners
    const modal = document.getElementById('eventModal');
    if (modal) {
        // Click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
    }
    
    // Setup form validation pro modal
    const modalSales = document.getElementById('modalSales');
    if (modalSales) {
        modalSales.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 0) {
                e.target.value = 0;
            }
        });
    }
    
    console.log('✅ Part 4B initialized');
});

console.log('✅ Donuland Part 4B (Fixed) loaded successfully');
console.log('📝 Features: ✅ Event Modal ✅ Edit Events ✅ Delete Events ✅ Enhanced Display ✅ LocalStorage Integration ✅ Validation');
console.log('⏳ Ready for Part 4C: Analytics optimization');

// Event pro signalizaci dokončení části 4B
eventBus.emit('part4BLoaded', { 
    timestamp: Date.now(),
    version: '1.1.0',
    features: ['event-modal', 'edit-events', 'delete-events', 'enhanced-display', 'localstorage-integration']
});
/* ========================================
   DONULAND PART 4C - OPRAVENÉ ANALYTICS
   Funkční analytické funkce bez testovacích dat a s lepším performance
   ======================================== */

console.log('🍩 Donuland Part 4C (Fixed) loading...');

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
        },
        hasInitialized: false
    };
}

// ========================================
// HLAVNÍ ANALYTICS FUNKCE
// ========================================

// Inicializace analytics sekce
function initializeAnalytics() {
    console.log('📊 Initializing analytics...');
    
    if (analyticsState.isLoading) {
        console.log('⚠️ Analytics already loading');
        return;
    }
    
    analyticsState.isLoading = true;
    
    try {
        // Zkontrolovat dostupnost dat
        if (!globalState.historicalData || globalState.historicalData.length === 0) {
            displayNoDataMessage();
            analyticsState.isLoading = false;
            return;
        }
        
        // Postupně načíst všechny analytics komponenty
        const initPromises = [
            () => updateOverallStats(),
            () => updateTopEvents(),
            () => updateTopCities(), 
            () => updateTopCategories(),
            () => displayMonthlyTrends(),
            () => updatePredictionAccuracy(),
            () => updateWeatherImpact()
        ];
        
        // Postupné načítání s malými intervaly pro lepší UX
        initPromises.forEach((initFn, index) => {
            setTimeout(() => {
                try {
                    initFn();
                } catch (error) {
                    console.error(`❌ Error in analytics component ${index}:`, error);
                }
            }, index * 100);
        });
        
        analyticsState.lastUpdate = Date.now();
        analyticsState.hasInitialized = true;
        
        console.log('✅ Analytics initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing analytics:', error);
        displayAnalyticsError();
    } finally {
        setTimeout(() => {
            analyticsState.isLoading = false;
        }, 1000);
    }
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
                    <p>Načtěte historická data z Google Sheets pro zobrazení analýz</p>
                    <button class="btn" onclick="loadData()" style="margin-top: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        🔄 Načíst data
                    </button>
                </div>
            `;
        }
    });
}

// Zobrazení chyby analytics
function displayAnalyticsError() {
    const containers = [
        'overallStats', 'topEvents', 'topCities', 'topCategories', 
        'monthlyTrends', 'predictionAccuracy', 'weatherImpact'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #dc3545;">
                    <div style="font-size: 2rem; margin-bottom: 15px;">❌</div>
                    <h5>Chyba při načítání analýz</h5>
                    <p style="font-size: 0.9em;">Zkuste obnovit stránku nebo načíst data znovu</p>
                    <button class="btn" onclick="initializeAnalytics()" style="margin-top: 10px; background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        🔄 Zkusit znovu
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
            container.innerHTML = '<div class="no-data" style="text-align: center; padding: 30px; color: #6c757d;">Žádné události k zobrazení</div>';
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
                <div class="top-item" style="border-left-color: ${getPerformanceColor(parseFloat(conversion))}; display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                    <div class="top-info">
                        <h4 style="margin: 0 0 5px 0; color: #495057;">${medal} ${index + 1}. ${escapeHtml(event.eventName)}</h4>
                        <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 0.9em;">📍 ${escapeHtml(event.city)} • 📅 ${formatDate(event.dateFrom)} • 📋 ${escapeHtml(event.category)}</p>
                        <p style="font-size: 0.8em; color: #6c757d; margin: 0;">
                            👥 ${formatNumber(event.visitors)} návštěvníků
                            ${event.rating ? ` • ⭐ ${event.rating}/5` : ''}
                        </p>
                    </div>
                    <div class="top-stats" style="text-align: right;">
                        <div class="top-value" style="color: ${getPerformanceColor(parseFloat(conversion))}; font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">
                            ${formatNumber(event.sales)} ks
                        </div>
                        <div class="top-subvalue" style="font-size: 0.8em; color: #6c757d;">
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
            container.innerHTML = '<div class="no-data" style="text-align: center; padding: 30px; color: #6c757d;">Žádná města k zobrazení</div>';
            return;
        }
        
        let html = '<div class="top-cities-header" style="margin-bottom: 15px;">';
        html += '<h4 style="margin: 0;">🏙️ Nejúspěšnější města</h4>';
        html += `<p style="color: #6c757d; margin: 5px 0 0 0; font-size: 0.9em;">Top ${topCities.length} podle prodeje</p>`;
        html += '</div>';
        
        topCities.forEach((city, index) => {
            const avgPerEvent = city.totalSales / city.eventsCount;
            
            // Medaile pro top 3
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            
            html += `
                <div class="top-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #667eea; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                    <div class="top-info">
                        <h4 style="margin: 0 0 5px 0; color: #495057;">${medal} ${index + 1}. ${escapeHtml(city.name)}</h4>
                        <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 0.9em;">📊 ${city.eventsCount} akcí • 🎯 ${city.averageConversion.toFixed(1)}% průměrná konverze</p>
                        <p style="font-size: 0.8em; color: #6c757d; margin: 0;">
                            📈 ${formatNumber(avgPerEvent)} ks průměr/akci • 👥 ${formatNumber(city.totalVisitors)} návštěvníků
                        </p>
                    </div>
                    <div class="top-stats" style="text-align: right;">
                        <div class="top-value" style="color: #667eea; font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">${formatNumber(city.totalSales)} ks</div>
                        <div class="top-subvalue" style="font-size: 0.8em; color: #6c757d;">
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
            container.innerHTML = '<div class="no-data" style="text-align: center; padding: 30px; color: #6c757d;">Žádné kategorie k zobrazení</div>';
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
            const avgPerEvent = category.totalSales / category.eventsCount;
            
            // Medaile pro top 3
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            
            html += `
                <div class="top-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #28a745; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                    <div class="top-info">
                        <h4 style="margin: 0 0 5px 0; color: #495057;">${medal} ${index + 1}. ${icon} ${escapeHtml(category.name)}</h4>
                        <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 0.9em;">📊 ${category.eventsCount} akcí • 🎯 ${category.averageConversion.toFixed(1)}% průměrná konverze</p>
                        <p style="font-size: 0.8em; color: #6c757d; margin: 0;">
                            📈 ${formatNumber(avgPerEvent)} ks průměr/akci • 👥 ${formatNumber(category.totalVisitors)} návštěvníků
                        </p>
                    </div>
                    <div class="top-stats" style="text-align: right;">
                        <div class="top-value" style="color: #28a745; font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">${formatNumber(category.totalSales)} ks</div>
                        <div class="top-subvalue" style="font-size: 0.8em; color: #6c757d;">
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
// MĚSÍČNÍ TRENDY - VYLEPŠENÉ
// ========================================

function displayMonthlyTrends() {
    console.log('📈 Generating monthly trends...');
    
    const container = document.getElementById('monthlyTrends');
    if (!container) return;
    
    try {
        if (!globalState.historicalData || globalState.historicalData.length === 0) {
            container.innerHTML = `
                <div class="chart-placeholder" style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📈</div>
                    <h4>Žádná data pro měsíční trendy</h4>
                    <p>Načtěte historická data pro zobrazení trendů</p>
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
                <div class="chart-placeholder" style="text-align: center; padding: 40px;">
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
        html += '<div class="trends-bars" style="display: flex; align-items: flex-end; justify-content: space-around; height: 200px; margin: 20px 0; border-bottom: 2px solid #e9ecef; overflow-x: auto;">';
        
        const maxSales = Math.max(...sortedMonths.map(m => m.totalSales));
        
        sortedMonths.forEach((monthData, index) => {
            const [year, month] = monthData.month.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('cs-CZ', { 
                month: 'short'
            });
            
            const height = maxSales > 0 ? (monthData.totalSales / maxSales) * 180 : 10;
            const color = `hsl(${200 + index * 15}, 70%, 55%)`;
            
            html += `
                <div class="trend-bar" style="display: flex; flex-direction: column; align-items: center; margin: 0 5px; cursor: pointer;" title="${monthName} ${year}: ${formatNumber(monthData.totalSales)} ks prodáno na ${monthData.eventsCount} akcích">
                    <div style="width: 30px; height: ${height}px; background: ${color}; border-radius: 4px 4px 0 0; transition: all 0.3s ease; min-height: 5px;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
                    <div style="margin-top: 10px; font-size: 0.8em; font-weight: 600; color: #495057;">${monthName}</div>
                    <div style="font-size: 0.7em; color: #6c757d;">${formatNumber(monthData.totalSales)}</div>
                    <div style="font-size: 0.6em; color: #6c757d;">${monthData.eventsCount} akcí</div>
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
        console.log(`✅ Monthly trends displayed with ${sortedMonths.length} months`);
        
    } catch (error) {
        console.error('❌ Error generating monthly trends:', error);
        container.innerHTML = '<div class="error-message">Chyba při generování trendů</div>';
    }
}

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
                            <li>Po akcích aktualizujte skutečné prodeje v kalendáři</li>
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
                <div style="font-size: 1.2em; margin-bottom: 10px;">📈</div>
                <div style="font-size: 1.3em; font-weight: bold; color: #17a2b8; margin-bottom: 5px;">${accuracyData.overestimations}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Nadhodnocení</div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.2em; margin-bottom: 10px;">📉</div>
                <div style="font-size: 1.3em; font-weight: bold; color: #fd7e14; margin-bottom: 5px;">${accuracyData.underestimations}</div>
                <div style="color: #6c757d; font-size: 0.9em;">Podhodnocení</div>
            </div>
        `;
        
        html += '</div>';
        
        // Posledních 5 porovnání
        if (accuracyData.comparisons.length > 0) {
            html += '<h5 style="margin: 20px 0 10px 0;">📋 Nejnovější porovnání:</h5>';
            
            accuracyData.comparisons.slice(0, 5).forEach(comp => {
                const accuracyColor = comp.accuracy >= 80 ? '#28a745' : comp.accuracy >= 60 ? '#ffc107' : '#dc3545';
                const diffIcon = comp.difference > 0 ? '📈' : '📉';
                const diffColor = comp.difference > 0 ? '#17a2b8' : '#fd7e14';
                
                html += `
                    <div style="background: white; padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 3px solid ${accuracyColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${escapeHtml(comp.eventName)}</strong>
                                <div style="font-size: 0.8em; color: #6c757d;">${escapeHtml(comp.city)} • ${formatDate(comp.date)}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: ${accuracyColor}; font-weight: bold;">${comp.accuracy.toFixed(1)}%</div>
                                <div style="font-size: 0.8em; color: ${diffColor};">${diffIcon} ${Math.abs(comp.difference)} ks</div>
                            </div>
                        </div>
                        <div style="font-size: 0.8em; color: #6c757d; margin-top: 5px;">
                            Predikce: ${formatNumber(comp.predicted)} ks • Skutečnost: ${formatNumber(comp.actual)} ks
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        
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
                            <li>Zvláště důležité pro čokoládové donuty (teplota > 24°C)</li>
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
        
        if (weatherData.weatherBreakdown) {
            Object.entries(weatherData.weatherBreakdown).forEach(([weather, data]) => {
                const icon = getWeatherIcon(weather);
                const avgSales = data.totalSales / data.count;
                
                html += `
                    <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5em; margin-bottom: 5px;">${icon}</div>
                        <div style="font-size: 1.1em; font-weight: bold; color: #495057;">${formatNumber(avgSales)}</div>
                        <div style="color: #6c757d; font-size: 0.8em;">Průměr při ${weather}</div>
                        <div style="color: #6c757d; font-size: 0.7em;">${data.count} akcí</div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        html += '</div>';
        
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
    
    // Seskupit podle počasí
    const weatherBreakdown = {};
    
    eventsWithWeather.forEach(record => {
        const weather = record.weather.toLowerCase();
        
        if (!weatherBreakdown[weather]) {
            weatherBreakdown[weather] = {
                count: 0,
                totalSales: 0,
                totalVisitors: 0
            };
        }
        
        weatherBreakdown[weather].count++;
        weatherBreakdown[weather].totalSales += record.sales;
        weatherBreakdown[weather].totalVisitors += record.visitors;
    });
    
    return {
        totalEvents: eventsWithWeather.length,
        weatherBreakdown: weatherBreakdown
    };
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

// Získání ikony podle počasí
function getWeatherIcon(main) {
    const weather = main.toLowerCase();
    if (weather.includes('clear') || weather.includes('sun')) return '☀️';
    if (weather.includes('cloud')) return '☁️';
    if (weather.includes('rain')) return '🌧️';
    if (weather.includes('drizzle')) return '🌦️';
    if (weather.includes('snow')) return '❄️';
    if (weather.includes('storm')) return '⛈️';
    return '🌤️';
}

// ========================================
// EVENT LISTENERS PRO ANALYTICS
// ========================================

// Event listener pro změnu na analytics sekci
eventBus.on('sectionChanged', (data) => {
    if (data.section === 'analytics') {
        console.log('📊 Analytics section opened - initializing analytics...');
        setTimeout(() => {
            initializeAnalytics();
        }, 300);
    }
});

// Event listener pro načtení dat
eventBus.on('dataLoaded', () => {
    console.log('📊 Data loaded - updating analytics...');
    analyticsState.cachedStats = null; // Clear cache
    
    // Pokud je analytics sekce aktivní, aktualizuj
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && analyticsSection.classList.contains('active')) {
        setTimeout(() => {
            initializeAnalytics();
        }, 1000);
    }
});

// Event listener pro editaci událostí
eventBus.on('eventEdited', () => {
    console.log('📝 Event edited - refreshing analytics...');
    analyticsState.cachedStats = null;
    
    const analyticsSection = document.getElementById('analytics');
    if (analyticsSection && analyticsSection.classList.contains('active')) {
        setTimeout(() => {
            if (analyticsState.hasInitialized) {
                // Pouze aktualizovat komponenty které mohou být ovlivněny
                updateOverallStats();
                updatePredictionAccuracy();
            }
        }, 500);
    }
});

// ========================================
// INICIALIZACE
// ========================================

// Automatická inicializace při načtení
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing Part 4C - Analytics...');
    
    // Auto-inicializace pokud jsou data dostupná a je aktivní analytics sekce
    setTimeout(() => {
        const analyticsSection = document.getElementById('analytics');
        if (analyticsSection && analyticsSection.classList.contains('active') && 
            globalState.historicalData && globalState.historicalData.length > 0) {
            initializeAnalytics();
        }
    }, 2000);
    
    console.log('✅ Part 4C Analytics initialized');
});

console.log('✅ Donuland Part 4C (Fixed) loaded successfully');
console.log('📊 Features: ✅ Overall Stats ✅ Top Events ✅ Top Cities ✅ Top Categories ✅ Enhanced Monthly Trends ✅ Prediction Accuracy ✅ Weather Impact ✅ Performance Optimized');
console.log('⏳ Ready for Part 4D: Final Integration');

// Event pro signalizaci dokončení části 4C
eventBus.emit('part4CLoaded', { 
    timestamp: Date.now(),
    version: '1.1.0',
    features: ['overall-stats', 'top-events', 'top-cities', 'top-categories', 'enhanced-monthly-trends', 'prediction-accuracy', 'weather-impact', 'performance-optimized']
});em; font-weight: bold; color: #667eea;">${formatNumber(totalSales)}</div>
                    <div style="font-size: 0.8em; color: #6c757d;">Celkem prodáno</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.2em; font-weight: bold; color: #28a745;">${formatCurrency(totalRevenue)}</div>
                    <div style="font-size: 0.8em; color: #6c757d;">Celkový obrat</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.2
   /* ========================================
   DONULAND PART 4D - FINÁLNÍ INTEGRACE
   Kompletní integrace kalendáře a analýz bez chyb
   ======================================== */

console.log('🍩 Donuland Part 4D (Final Integration) loading...');

// ========================================
// GLOBAL INTEGRATION STATE
// ========================================

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
        },
        initialized: false
    };
}

// ========================================
// INTEGRATION CONTROLLER
// ========================================

class DonulandIntegrationController {
    constructor() {
        this.sectionMap = new Map([
            ['calendar', 'part4A'],
            ['analytics', 'part4C']
        ]);
        
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.ready = false;
        
        console.log('🔧 Integration Controller initialized');
    }
    
    // Hlavní inicializace integrace
    async initialize() {
        if (integrationState.isInitializing || integrationState.initialized) {
            console.log('⚠️ Integration already initialized or in progress');
            return;
        }
        
        integrationState.isInitializing = true;
        console.log('🚀 Starting integration initialization...');
        
        try {
            // 1. Ověřit dostupnost částí
            await this.verifyPartsAvailability();
            
            // 2. Inicializovat komunikaci
            this.setupCrossSectionCommunication();
            
            // 3. Synchronizovat stavy
            await this.synchronizeGlobalStates();
            
            // 4. Setup event handling
            this.setupUnifiedEventHandling();
            
            // 5. Inicializovat section features
            await this.initializeSectionFeatures();
            
            integrationState.initialized = true;
            this.ready = true;
            
            console.log('✅ Integration initialization completed');
            
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
    
    // Ověření dostupnosti částí
    async verifyPartsAvailability() {
        console.log('🔍 Verifying parts availability...');
        
        const requiredFunctions = [
            { name: 'renderCalendar', part: 'part4A' },
            { name: 'openEventModal', part: 'part4B' },
            { name: 'initializeAnalytics', part: 'part4C' },
            { name: 'filterCalendar', part: 'part4A' },
            { name: 'populateFilterDropdowns', part: 'part4A' }
        ];
        
        for (const func of requiredFunctions) {
            if (typeof window[func.name] === 'function') {
                integrationState.sectionsLoaded[func.part] = true;
                console.log(`✅ ${func.name} available`);
            } else {
                console.warn(`⚠️ ${func.name} not available`);
                integrationState.sectionsLoaded[func.part] = false;
            }
        }
        
        // Ověřit HTML elementy
        const requiredElements = [
            'calendarGrid', 'monthEvents', 'overallStats', 
            'topEvents', 'topCities', 'topCategories',
            'monthlyTrends', 'predictionAccuracy', 'weatherImpact'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Missing HTML elements:', missingElements);
        }
        
        console.log('✅ Parts availability verified');
    }
    
    // Setup komunikace mezi sekcemi
    setupCrossSectionCommunication() {
        console.log('📡 Setting up cross-section communication...');
        
        // Event listener pro section changes
        eventBus.on('sectionChanged', (data) => {
            this.handleSectionSwitch(data.section);
        });
        
        // Data loading events
        eventBus.on('dataLoaded', (data) => {
            this.propagateDataUpdate(data);
        });
        
        // Form changes
        eventBus.on('formChanged', () => {
            this.handleFormChange();
        });
        
        // Event modifications
        eventBus.on('eventEdited', (data) => {
            this.handleEventModification('edited', data);
        });
        
        eventBus.on('eventDeleted', (data) => {
            this.handleEventModification('deleted', data);
        });
        
        // Prediction saves
        eventBus.on('predictionSaved', (data) => {
            this.handlePredictionSave(data);
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
        
        // Enhanced navigation handling
        this.setupEnhancedNavigation();
        
        // Auto-refresh mechanisms
        this.setupAutoRefresh();
        
        // Filter synchronization
        this.setupFilterSync();
        
        console.log('✅ Unified event handling configured');
    }
    
    // Enhanced navigace
    setupEnhancedNavigation() {
        // Wrap existing changeMonth function
        if (typeof window.changeMonth === 'function') {
            const originalChangeMonth = window.changeMonth;
            window.changeMonth = (direction) => {
                originalChangeMonth(direction);
                
                // Cross-section sync
                this.syncDateRange();
                
                // Update analytics if active
                if (this.isSectionActive('analytics')) {
                    setTimeout(() => {
                        this.refreshAnalytics('month-change');
                    }, 500);
                }
            };
        }
        
        // Wrap goToToday function
        if (typeof window.goToToday === 'function') {
            const originalGoToToday = window.goToToday;
            window.goToToday = () => {
                originalGoToToday();
                this.syncDateRange();
                
                if (this.isSectionActive('analytics')) {
                    setTimeout(() => {
                        this.refreshAnalytics('go-to-today');
                    }, 500);
                }
            };
        }
    }
    
    // Auto-refresh mechanisms
    setupAutoRefresh() {
        // Refresh analytics when calendar is updated
        eventBus.on('calendarRendered', () => {
            if (this.isSectionActive('analytics')) {
                setTimeout(() => {
                    this.refreshAnalytics('calendar-rendered');
                }, 1000);
            }
        });
        
        // Refresh calendar when predictions are saved
        eventBus.on('predictionSaved', () => {
            if (this.isSectionActive('calendar')) {
                setTimeout(() => {
                    this.refreshCalendar('prediction-saved');
                }, 500);
            }
        });
    }
    
    // Filter synchronization
    setupFilterSync() {
        // Enhanced filter handling
        if (typeof window.filterCalendar === 'function') {
            const originalFilterCalendar = window.filterCalendar;
            window.filterCalendar = () => {
                originalFilterCalendar();
                
                // Sync filters across sections
                this.syncFilters();
            };
        }
    }
    
    // Inicializace section features
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
        
        // Emit calendar rendered event
        if (typeof renderCalendar === 'function') {
            const originalRenderCalendar = renderCalendar;
            window.renderCalendar = function(...args) {
                const result = originalRenderCalendar.apply(this, args);
                
                eventBus.emit('calendarRendered', {
                    timestamp: Date.now()
                });
                
                return result;
            };
        }
        
        console.log('✅ Calendar features enhanced');
    }
    
    // Enhanced analytics features
    async enhanceAnalyticsFeatures() {
        console.log('📊 Enhancing analytics features...');
        
        // Enhanced analytics initialization
        if (typeof initializeAnalytics === 'function') {
            const originalInitializeAnalytics = initializeAnalytics;
            window.initializeAnalytics = function(...args) {
                const result = originalInitializeAnalytics.apply(this, args);
                
                integrationState.pendingUpdates.delete('analytics');
                
                eventBus.emit('analyticsInitialized', {
                    timestamp: Date.now()
                });
                
                return result;
            };
        }
        
        console.log('✅ Analytics features enhanced');
    }
}

// ========================================
// SECTION HANDLING
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Handle section switch
    handleSectionSwitch(targetSection) {
        console.log(`🔄 Handling section switch to: ${targetSection}`);
        
        integrationState.lastSectionSwitch = {
            section: targetSection,
            timestamp: Date.now()
        };
        
        // Section-specific handling
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
    
    // Prepare calendar section
    async prepareCalendarSection() {
        console.log('📅 Preparing calendar section...');
        
        try {
            // Reset calendar state
            if (typeof calendarState !== 'undefined') {
                calendarState.isRendering = false;
            }
            
            // Sync filters
            this.syncFiltersToCalendar();
            
            // Render calendar
            await this.safeCalendarRender();
            
            console.log('✅ Calendar section prepared');
            
        } catch (error) {
            console.error('❌ Error preparing calendar section:', error);
            this.retryCalendarPreparation();
        }
    },
    
    // Prepare analytics section
    async prepareAnalyticsSection() {
        console.log('📊 Preparing analytics section...');
        
        try {
            // Reset analytics state
            if (typeof analyticsState !== 'undefined') {
                analyticsState.isLoading = false;
            }
            
            // Check if data is available
            if (!globalState.historicalData || globalState.historicalData.length === 0) {
                console.log('ℹ️ No data available for analytics');
                return;
            }
            
            // Initialize analytics
            await this.safeAnalyticsInitialization();
            
            console.log('✅ Analytics section prepared');
            
        } catch (error) {
            console.error('❌ Error preparing analytics section:', error);
            this.retryAnalyticsPreparation();
        }
    },
    
    // Safe calendar render
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
    
    // Safe analytics initialization
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
// DATA SYNCHRONIZATION
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Propagate data update
    propagateDataUpdate(data) {
        console.log('📊 Propagating data update to all sections...');
        
        integrationState.syncInProgress = true;
        
        try {
            // Update calendar if active
            if (this.isSectionActive('calendar')) {
                setTimeout(() => {
                    this.refreshCalendar('data-update');
                }, 200);
            } else {
                integrationState.pendingUpdates.add('calendar');
            }
            
            // Update analytics if active
            if (this.isSectionActive('analytics')) {
                setTimeout(() => {
                    this.refreshAnalytics('data-update');
                }, 500);
            } else {
                integrationState.pendingUpdates.add('analytics');
            }
            
        } catch (error) {
            console.error('❌ Error propagating data update:', error);
        } finally {
            setTimeout(() => {
                integrationState.syncInProgress = false;
            }, 1000);
        }
    },
    
    // Handle form changes
    handleFormChange() {
        // Form changes primarily affect prediction section
        // No immediate action needed for calendar/analytics
        console.log('📝 Form changed - no immediate calendar/analytics update needed');
    },
    
    // Handle event modifications
    handleEventModification(type, data) {
        console.log(`📝 Event ${type}:`, data);
        
        // Update both calendar and analytics
        setTimeout(() => {
            if (this.isSectionActive('calendar')) {
                this.refreshCalendar(`event-${type}`);
            }
            
            if (this.isSectionActive('analytics')) {
                this.refreshAnalytics(`event-${type}`);
            }
        }, 300);
    },
    
    // Handle prediction saves
    handlePredictionSave(data) {
        console.log('🔮 Prediction saved:', data);
        
        // Update calendar filters and display
        setTimeout(() => {
            if (typeof populateFilterDropdowns === 'function') {
                populateFilterDropdowns();
            }
            
            if (this.isSectionActive('calendar')) {
                this.refreshCalendar('prediction-saved');
            }
        }, 200);
    },
    
    // Refresh calendar
    refreshCalendar(reason) {
        console.log(`📅 Refreshing calendar (reason: ${reason})`);
        
        try {
            if (typeof populateFilterDropdowns === 'function') {
                populateFilterDropdowns();
            }
            
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        } catch (error) {
            console.error('❌ Error refreshing calendar:', error);
        }
    },
    
    // Refresh analytics
    refreshAnalytics(reason) {
        console.log(`📊 Refreshing analytics (reason: ${reason})`);
        
        try {
            if (typeof analyticsState !== 'undefined') {
                analyticsState.cachedStats = null;
            }
            
            if (typeof initializeAnalytics === 'function') {
                initializeAnalytics();
            }
        } catch (error) {
            console.error('❌ Error refreshing analytics:', error);
        }
    }
});

// ========================================
// FILTER SYNCHRONIZATION
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Sync filters across sections
    syncFilters() {
        const cityFilter = document.getElementById('cityFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (cityFilter) integrationState.crossSectionFilters.city = cityFilter.value;
        if (categoryFilter) integrationState.crossSectionFilters.category = categoryFilter.value;
        if (statusFilter) integrationState.crossSectionFilters.status = statusFilter.value;
        
        console.log('🔍 Filters synchronized:', integrationState.crossSectionFilters);
    },
    
    // Sync filters to calendar
    syncFiltersToCalendar() {
        if (typeof calendarState === 'undefined') return;
        
        const filters = integrationState.crossSectionFilters;
        
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
    },
    
    // Sync date range
    syncDateRange() {
        if (globalState && globalState.currentMonth !== undefined) {
            integrationState.crossSectionFilters.dateRange = {
                month: globalState.currentMonth,
                year: globalState.currentYear
            };
        }
    }
});

// ========================================
// UTILITY METHODS
// ========================================

Object.assign(DonulandIntegrationController.prototype, {
    // Check if section is active
    isSectionActive(sectionName) {
        const section = document.getElementById(sectionName);
        return section && section.classList.contains('active');
    },
    
    // Get integration status
    getIntegrationStatus() {
        return {
            isInitialized: integrationState.initialized,
            isReady: this.ready,
            sectionsLoaded: integrationState.sectionsLoaded,
            pendingUpdates: Array.from(integrationState.pendingUpdates),
            lastSectionSwitch: integrationState.lastSectionSwitch,
            syncInProgress: integrationState.syncInProgress
        };
    },
    
    // Handle initialization error
    handleInitializationError(error) {
        console.error('❌ Integration initialization error:', error);
        
        // Attempt partial initialization
        setTimeout(() => {
            this.attemptPartialInitialization();
        }, 3000);
    },
    
    // Partial initialization fallback
    async attemptPartialInitialization() {
        console.log('🔄 Attempting partial initialization...');
        
        try {
            this.setupCrossSectionCommunication();
            await this.synchronizeGlobalStates();
            this.setupUnifiedEventHandling();
            
            integrationState.initialized = true;
            this.ready = true;
            
            console.log('✅ Partial initialization completed');
            
        } catch (error) {
            console.error('❌ Partial initialization also failed:', error);
        }
    },
    
    // Retry calendar preparation
    retryCalendarPreparation() {
        const retryKey = 'calendar-prep';
        const currentAttempts = this.retryAttempts.get(retryKey) || 0;
        
        if (currentAttempts < this.maxRetries) {
            this.retryAttempts.set(retryKey, currentAttempts + 1);
            
            setTimeout(() => {
                console.log(`🔄 Retrying calendar preparation (attempt ${currentAttempts + 1})`);
                this.prepareCalendarSection();
            }, 2000 * (currentAttempts + 1));
        } else {
            console.error('❌ Calendar preparation failed after max retries');
        }
    },
    
    // Retry analytics preparation
    retryAnalyticsPreparation() {
        const retryKey = 'analytics-prep';
        const currentAttempts = this.retryAttempts.get(retryKey) || 0;
        
        if (currentAttempts < this.maxRetries) {
            this.retryAttempts.set(retryKey, currentAttempts + 1);
            
            setTimeout(() => {
                console.log(`🔄 Retrying analytics preparation (attempt ${currentAttempts + 1})`);
                this.prepareAnalyticsSection();
            }, 2000 * (currentAttempts + 1));
        } else {
            console.error('❌ Analytics preparation failed after max retries');
        }
    }
});

// ========================================
// GLOBAL CONTROLLER INSTANCE
// ========================================

const integrationController = new DonulandIntegrationController();

// ========================================
// EVENT LISTENERS
// ========================================

// Part loading events
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

// Check readiness for initialization
integrationController.checkReadyForInitialization = function() {
    const { part4A, part4C } = integrationState.sectionsLoaded;
    
    if (part4A && part4C && !integrationState.isInitializing && !integrationState.initialized) {
        console.log('🚀 All critical parts loaded - starting integration...');
        setTimeout(() => {
            this.initialize();
        }, 1000);
    }
};

// Manual trigger
eventBus.on('triggerIntegration', () => {
    console.log('🔧 Manual integration trigger received');
    if (!integrationState.initialized) {
        integrationController.initialize();
    }
});

// Handle pending updates when switching sections
eventBus.on('sectionChanged', (data) => {
    if (integrationState.pendingUpdates.has(data.section)) {
        console.log(`📋 Processing pending updates for ${data.section}`);
        
        setTimeout(() => {
            if (data.section === 'calendar') {
                integrationController.refreshCalendar('pending-update');
            } else if (data.section === 'analytics') {
                integrationController.refreshAnalytics('pending-update');
            }
            
            integrationState.pendingUpdates.delete(data.section);
        }, 500);
    }
});

// ========================================
// INITIALIZATION
// ========================================

// Auto-start integration
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Part 4D Integration - DOM ready');
    
    // Wait for other parts to load
    setTimeout(() => {
        const hasCalendar = typeof renderCalendar === 'function';
        const hasAnalytics = typeof initializeAnalytics === 'function';
        
        if (hasCalendar && hasAnalytics) {
            console.log('🎯 Both calendar and analytics available - starting integration');
            integrationController.initialize();
        } else {
            console.log(`⏳ Waiting for parts to load... Calendar: ${hasCalendar}, Analytics: ${hasAnalytics}`);
        }
    }, 2000);
    
    // Fallback initialization
    setTimeout(() => {
        if (!integrationState.initialized) {
            console.log('⚠️ Fallback integration initialization...');
            integrationController.initialize();
        }
    }, 10000);
});

// ========================================
// DEBUG INTERFACE
// ========================================

if (typeof window !== 'undefined') {
    window.donulandIntegrationDebug = {
        // Status
        getStatus: () => integrationController.getIntegrationStatus(),
        getState: () => integrationState,
        
        // Manual control
        initialize: () => integrationController.initialize(),
        
        // Section control
        switchToCalendar: () => {
            const btn = document.querySelector('.nav-btn[data-section="calendar"]');
            if (btn) btn.click();
        },
        switchToAnalytics: () => {
            const btn = document.querySelector('.nav-btn[data-section="analytics"]');
            if (btn) btn.click();
        },
        
        // Refresh control
        refreshCalendar: () => integrationController.refreshCalendar('manual'),
        refreshAnalytics: () => integrationController.refreshAnalytics('manual'),
        
        // Utility
        clearRetries: () => {
            integrationController.retryAttempts.clear();
            console.log('🧹 Retry attempts cleared');
        },
        
        clearPendingUpdates: () => {
            integrationState.pendingUpdates.clear();
            console.log('🧹 Pending updates cleared');
        },
        
        // Force sync
        syncAll: () => {
            integrationController.syncFilters();
            integrationController.syncDateRange();
            console.log('🔄 All synchronization forced');
        },
        
        // Test functions
        testCalendar: () => {
            if (typeof renderCalendar === 'function') {
                renderCalendar();
                console.log('📅 Calendar test executed');
            } else {
                console.error('❌ renderCalendar not available');
            }
        },
        
        testAnalytics: () => {
            if (typeof initializeAnalytics === 'function') {
                initializeAnalytics();
                console.log('📊 Analytics test executed');
            } else {
                console.error('❌ initializeAnalytics not available');
            }
        }
    };
}

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 4D (Final Integration) loaded successfully');
console.log('🔗 Features: ✅ Cross-Section Communication ✅ Auto-Sync ✅ Error Recovery ✅ Filter Sync ✅ Real-time Updates');
console.log('🎯 Integration: Calendar ↔ Analytics ↔ Filters ↔ Data ↔ Events');
console.log('🔧 Debug: window.donulandIntegrationDebug available');
console.log('🚀 System: Complete calendar and analytics integration ready');

// Emit completion
eventBus.emit('part4DLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: [
        'cross-section-communication',
        'auto-sync-mechanisms', 
        'filter-synchronization',
        'section-coordination',
        'error-recovery',
        'real-time-updates',
        'debug-interface'
    ]
});

console.log('🎉 DONULAND PART 4 (A+B+C+D) COMPLETE - Calendar & Analytics fully integrated!');
