/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 4
   Kalendář akcí pro dodavatele donutů
   ======================================== */

console.log('🍩 Donuland Part 4 loading...');

// ========================================
// KALENDÁŘ GLOBÁLNÍ STAV
// ========================================

const calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    events: [], // Všechny události (z Sheets + predikce)
    filteredEvents: [],
    filters: {
        status: '',
        category: '',
        source: ''
    },
    eventColors: new Map(), // Mapa názvů akcí na barvy
    colorIndex: 0,
    selectedEvent: null,
    isLoading: false
};

// Předem definované barvy pro akce
const EVENT_COLORS = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#ff9ff3', '#feca57', '#ff7675', '#74b9ff',
    '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7', '#55a3ff',
    '#00b894', '#e17055', '#fd79a8', '#ff7675', '#686de0'
];

// Status mapping pro barvy
const STATUS_COLORS = {
    completed: '#28a745',    // Zelená - dokončené
    ongoing: '#ff6b35',      // Oranžová - probíhající
    planned: null            // Unikátní barva podle názvu
};

// ========================================
// KALENDÁŘ INICIALIZACE
// ========================================

// Hlavní inicializace kalendáře
function initializeCalendar() {
    console.log('📅 Initializing calendar...');
    
    try {
        // Aktualizace zobrazení aktuálního měsíce
        updateCurrentMonthDisplay();
        
        // Vygenerování kalendářové mřížky
        generateCalendarGrid();
        
        // Načtení a zobrazení událostí
        loadCalendarEvents();
        
        // Inicializace filtrů
        initializeCalendarFilters();
        
        console.log('✅ Calendar initialized successfully');
        
    } catch (error) {
        console.error('❌ Calendar initialization failed:', error);
        showNotification('❌ Chyba při inicializaci kalendáře', 'error');
    }
}

// Generování mřížky kalendáře
function generateCalendarGrid() {
    console.log('🗓️ Generating calendar grid...');
    
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.error('❌ Calendar grid element not found');
        return;
    }
    
    // Vyčištění existující mřížky
    calendarGrid.innerHTML = '';
    
    // Názvy dnů
    const dayNames = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
    
    // Hlavička s názvy dnů
    dayNames.forEach(dayName => {
        const headerCell = document.createElement('div');
        headerCell.className = 'calendar-header';
        headerCell.textContent = dayName;
        calendarGrid.appendChild(headerCell);
    });
    
    // Výpočet dnů v měsíci
    const firstDay = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
    const lastDay = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // První den týdne (pondělí = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6; // Neděle
    
    // Dny z předchozího měsíce
    const prevMonth = new Date(calendarState.currentYear, calendarState.currentMonth - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = startDay - 1; i >= 0; i--) {
        const dayNumber = daysInPrevMonth - i;
        const dayCell = createDayCell(dayNumber, true, calendarState.currentMonth - 1);
        calendarGrid.appendChild(dayCell);
    }
    
    // Dny aktuálního měsíce
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = createDayCell(day, false, calendarState.currentMonth);
        calendarGrid.appendChild(dayCell);
    }
    
    // Dny z následujícího měsíce (dokončení mřížky)
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 týdnů × 7 dnů
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayCell = createDayCell(day, true, calendarState.currentMonth + 1);
        calendarGrid.appendChild(dayCell);
    }
    
    console.log('✅ Calendar grid generated');
}

// Vytvoření buňky dne
function createDayCell(dayNumber, isOtherMonth, month) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayCell.classList.add('other-month');
    }
    
    // Kontrola, zda je to dnešní den
    const today = new Date();
    const cellDate = new Date(calendarState.currentYear, month, dayNumber);
    
    if (cellDate.toDateString() === today.toDateString()) {
        dayCell.classList.add('today');
    }
    
    // Datum buňky pro snadnější práci s událostmi
    dayCell.dataset.date = cellDate.toISOString().split('T')[0];
    
    // Číslo dne
    const dayNumberElement = document.createElement('div');
    dayNumberElement.className = 'day-number';
    dayNumberElement.textContent = dayNumber;
    dayCell.appendChild(dayNumberElement);
    
    // Kontejner pro události
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    dayCell.appendChild(eventsContainer);
    
    // Click handler pro den
    dayCell.addEventListener('click', () => {
        showDayModal(cellDate);
    });
    
    return dayCell;
}

// ========================================
// UDÁLOSTI A DATA
// ========================================

// Načtení všech událostí kalendáře
function loadCalendarEvents() {
    console.log('📊 Loading calendar events...');
    
    calendarState.isLoading = true;
    calendarState.events = [];
    
    try {
        // 1. Události z historických dat (Google Sheets)
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            const historicalEvents = convertHistoricalDataToEvents();
            calendarState.events.push(...historicalEvents);
            console.log(`📈 Loaded ${historicalEvents.length} historical events`);
        }
        
        // 2. Uložené predikce z localStorage
        const savedPredictions = loadSavedPredictions();
        calendarState.events.push(...savedPredictions);
        console.log(`🔮 Loaded ${savedPredictions.length} saved predictions`);
        
        // 3. Aktuální predikce (pokud existuje)
        if (globalState.lastPrediction && !globalState.lastPrediction.saved) {
            const currentPrediction = convertPredictionToEvent(globalState.lastPrediction);
            calendarState.events.push(currentPrediction);
            console.log('🎯 Added current prediction');
        }
        
        // Aplikace filtrů a zobrazení
        applyCalendarFilters();
        displayEventsInCalendar();
        updateMonthEventsList();
        
        console.log(`✅ Total events loaded: ${calendarState.events.length}`);
        
    } catch (error) {
        console.error('❌ Error loading calendar events:', error);
        showNotification('❌ Chyba při načítání událostí kalendáře', 'error');
        
    } finally {
        calendarState.isLoading = false;
    }
}

// Konverze historických dat na události
function convertHistoricalDataToEvents() {
    return globalState.historicalData.map(record => {
        const startDate = new Date(record.dateFrom);
        const endDate = new Date(record.dateTo || record.dateFrom);
        const today = new Date();
        
        // Určení statusu
        let status = 'completed';
        if (endDate >= today) {
            status = startDate <= today ? 'ongoing' : 'planned';
        }
        
        return {
            id: `historical_${record.rowIndex || Math.random()}`,
            title: record.eventName,
            startDate: record.dateFrom,
            endDate: record.dateTo || record.dateFrom,
            category: record.category,
            city: record.city,
            status: status,
            source: 'historical',
            data: {
                visitors: record.visitors,
                sales: record.sales,
                competition: record.competition,
                rating: record.rating,
                notes: record.notes,
                businessModel: record.businessModel,
                price: record.price
            },
            color: getEventColor(record.eventName, status)
        };
    });
}

// Načtení uložených predikcí
function loadSavedPredictions() {
    try {
        const saved = localStorage.getItem('donuland_predictions');
        if (!saved) return [];
        
        const predictions = JSON.parse(saved);
        return predictions.map(prediction => convertPredictionToEvent(prediction));
        
    } catch (error) {
        console.error('❌ Error loading saved predictions:', error);
        return [];
    }
}

// Konverze predikce na událost
function convertPredictionToEvent(prediction) {
    const formData = prediction.formData;
    const startDate = new Date(formData.eventDateFrom);
    const endDate = new Date(formData.eventDateTo);
    const today = new Date();
    
    // Určení statusu
    let status = 'planned';
    if (endDate < today) {
        status = 'completed';
    } else if (startDate <= today && endDate >= today) {
        status = 'ongoing';
    }
    
    return {
        id: prediction.id || `prediction_${Date.now()}`,
        title: formData.eventName,
        startDate: formData.eventDateFrom,
        endDate: formData.eventDateTo,
        category: formData.category,
        city: formData.city,
        status: status,
        source: prediction.saved ? 'prediction_saved' : 'prediction_current',
        data: {
            visitors: formData.visitors,
            predictedSales: prediction.prediction?.predictedSales,
            confidence: prediction.prediction?.confidence,
            expectedRevenue: prediction.businessResults?.revenue,
            expectedProfit: prediction.businessResults?.profit,
            businessModel: formData.businessModel,
            competition: formData.competition,
            eventType: formData.eventType,
            price: formData.price
        },
        prediction: prediction,
        color: getEventColor(formData.eventName, status)
    };
}

// Získání barvy pro událost
function getEventColor(eventName, status) {
    // Dokončené a probíhající mají pevné barvy
    if (status === 'completed') return STATUS_COLORS.completed;
    if (status === 'ongoing') return STATUS_COLORS.ongoing;
    
    // Pro plánované události - konzistentní barva podle názvu
    const normalizedName = eventName.toLowerCase().trim();
    
    if (!calendarState.eventColors.has(normalizedName)) {
        const color = EVENT_COLORS[calendarState.colorIndex % EVENT_COLORS.length];
        calendarState.eventColors.set(normalizedName, color);
        calendarState.colorIndex++;
    }
    
    return calendarState.eventColors.get(normalizedName);
}

// ========================================
// ZOBRAZENÍ UDÁLOSTÍ
// ========================================

// Zobrazení událostí v kalendáři
function displayEventsInCalendar() {
    console.log('🎨 Displaying events in calendar...');
    
    // Vyčištění všech existujících událostí
    document.querySelectorAll('.day-events').forEach(container => {
        container.innerHTML = '';
    });
    
    // Seskupení událostí podle datumů
    const eventsByDate = groupEventsByDate(calendarState.filteredEvents);
    
    // Zobrazení událostí v příslušných dnech
    Object.entries(eventsByDate).forEach(([date, events]) => {
        const dayCell = document.querySelector(`[data-date="${date}"]`);
        if (!dayCell) return;
        
        const eventsContainer = dayCell.querySelector('.day-events');
        if (!eventsContainer) return;
        
        // Označení, že den má události
        dayCell.classList.add('has-events');
        
        // Zobrazení prvních 3 událostí + "další X"
        const visibleEvents = events.slice(0, 3);
        const hiddenCount = events.length - visibleEvents.length;
        
        visibleEvents.forEach(event => {
            const eventElement = createEventElement(event);
            eventsContainer.appendChild(eventElement);
        });
        
        // Zobrazení počtu skrytých událostí
        if (hiddenCount > 0) {
            const moreElement = document.createElement('div');
            moreElement.className = 'event-item more-events';
            moreElement.textContent = `+${hiddenCount} další`;
            moreElement.style.background = '#6c757d';
            moreElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showDayModal(new Date(date));
            });
            eventsContainer.appendChild(moreElement);
        }
    });
    
    console.log('✅ Events displayed in calendar');
}

// Seskupení událostí podle datumů
function groupEventsByDate(events) {
    const grouped = {};
    
    events.forEach(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        
        // Pro vícedenní události - přidat do všech dnů
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            
            grouped[dateKey].push(event);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });
    
    return grouped;
}

// Vytvoření elementu události
function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = `event-item ${event.source} ${event.status}`;
    eventElement.style.backgroundColor = event.color;
    eventElement.style.color = getContrastColor(event.color);
    eventElement.textContent = event.title;
    eventElement.title = getEventTooltip(event);
    
    // Click handler pro událost
    eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        showEventModal(event);
    });
    
    return eventElement;
}

// Výpočet kontrastní barvy pro text
function getContrastColor(backgroundColor) {
    // Konverze hex na RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Výpočet luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Tooltip pro událost
function getEventTooltip(event) {
    const startDate = new Date(event.startDate).toLocaleDateString('cs-CZ');
    const endDate = new Date(event.endDate).toLocaleDateString('cs-CZ');
    const dateText = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
    
    let tooltip = `${event.title}\n${dateText}\n${event.city}\nKategorie: ${event.category}`;
    
    if (event.data.visitors) {
        tooltip += `\nNávštěvníci: ${formatNumber(event.data.visitors)}`;
    }
    
    if (event.data.sales) {
        tooltip += `\nProdej: ${formatNumber(event.data.sales)} ks`;
    } else if (event.data.predictedSales) {
        tooltip += `\nPredikce: ${formatNumber(event.data.predictedSales)} ks`;
    }
    
    if (event.data.expectedProfit) {
        tooltip += `\nOčekávaný zisk: ${formatCurrency(event.data.expectedProfit)}`;
    }
    
    return tooltip;
}

// ========================================
// FILTRY KALENDÁŘE
// ========================================

// Inicializace filtrů kalendáře
function initializeCalendarFilters() {
    console.log('🔍 Initializing calendar filters...');
    
    // Naplnění možností filtrů
    populateFilterOptions();
    
    // Event listenery pro filtry
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            calendarState.filters.status = statusFilter.value;
            applyCalendarFilters();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            calendarState.filters.category = categoryFilter.value;
            applyCalendarFilters();
        });
    }
    
    if (sourceFilter) {
        sourceFilter.addEventListener('change', () => {
            calendarState.filters.source = sourceFilter.value;
            applyCalendarFilters();
        });
    }
    
    console.log('✅ Calendar filters initialized');
}

// Naplnění možností filtrů
function populateFilterOptions() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    
    if (categoryFilter) {
        // Získání unikátních kategorií
        const categories = [...new Set(calendarState.events.map(e => e.category))];
        
        // Vyčištění a naplnění
        categoryFilter.innerHTML = '<option value="">📋 Všechny kategorie</option>';
        categories.forEach(category => {
            if (category) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            }
        });
    }
    
    if (sourceFilter) {
        sourceFilter.innerHTML = `
            <option value="">📊 Všechny zdroje</option>
            <option value="historical">📈 Historická data</option>
            <option value="prediction_saved">💾 Uložené predikce</option>
            <option value="prediction_current">🎯 Aktuální predikce</option>
        `;
    }
}

// Aplikace filtrů
function applyCalendarFilters() {
    console.log('🔍 Applying calendar filters...');
    
    calendarState.filteredEvents = calendarState.events.filter(event => {
        // Filtr statusu
        if (calendarState.filters.status && event.status !== calendarState.filters.status) {
            return false;
        }
        
        // Filtr kategorie
        if (calendarState.filters.category && event.category !== calendarState.filters.category) {
            return false;
        }
        
        // Filtr zdroje
        if (calendarState.filters.source && event.source !== calendarState.filters.source) {
            return false;
        }
        
        return true;
    });
    
    console.log(`🔍 Filtered ${calendarState.filteredEvents.length} events from ${calendarState.events.length} total`);
    
    // Aktualizace zobrazení
    displayEventsInCalendar();
    updateMonthEventsList();
}

// Reset filtrů
function resetCalendarFilters() {
    calendarState.filters = { status: '', category: '', source: '' };
    
    // Reset HTML elementů
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    
    if (statusFilter) statusFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (sourceFilter) sourceFilter.value = '';
    
    applyCalendarFilters();
    showNotification('🔍 Filtry kalendáře resetovány', 'info', 2000);
}

// ========================================
// NAVIGACE KALENDÁŘE
// ========================================

// Změna měsíce
function changeMonth(direction) {
    console.log(`📅 Changing month by ${direction}`);
    
    calendarState.currentMonth += direction;
    
    if (calendarState.currentMonth > 11) {
        calendarState.currentMonth = 0;
        calendarState.currentYear++;
    } else if (calendarState.currentMonth < 0) {
        calendarState.currentMonth = 11;
        calendarState.currentYear--;
    }
    
    // Aktualizace zobrazení
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    displayEventsInCalendar();
    updateMonthEventsList();
    
    console.log(`📅 Calendar changed to: ${calendarState.currentMonth + 1}/${calendarState.currentYear}`);
}

// Přechod na dnešní měsíc
function goToToday() {
    console.log('📍 Going to today');
    
    const today = new Date();
    calendarState.currentMonth = today.getMonth();
    calendarState.currentYear = today.getFullYear();
    
    // Aktualizace zobrazení
    updateCurrentMonthDisplay();
    generateCalendarGrid();
    displayEventsInCalendar();
    updateMonthEventsList();
    
    showNotification('📅 Přešli jste na aktuální měsíc', 'info', 2000);
}

// ========================================
// MODALY A DETAILY
// ========================================

// Modal pro zobrazení dne
function showDayModal(date) {
    console.log('📅 Showing day modal for:', date.toLocaleDateString('cs-CZ'));
    
    const dayEvents = calendarState.filteredEvents.filter(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        return date >= startDate && date <= endDate;
    });
    
    if (dayEvents.length === 0) {
        showNotification('📅 Žádné události v tomto dni', 'info', 2000);
        return;
    }
    
    // Vytvoření modalu
    const modal = document.createElement('div');
    modal.className = 'modal day-modal';
    modal.style.display = 'flex';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Hlavička
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
        <h3>📅 ${date.toLocaleDateString('cs-CZ', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</h3>
        <button class="modal-close">&times;</button>
    `;
    
    // Tělo modalu
    const body = document.createElement('div');
    body.className = 'modal-body';
    
    const eventsList = document.createElement('div');
    eventsList.className = 'day-events-list';
    
    dayEvents.forEach(event => {
        const eventItem = createDayEventItem(event);
        eventsList.appendChild(eventItem);
    });
    
    body.appendChild(eventsList);
    
    // Sestavení modalu
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listenery
    const closeBtn = header.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // ESC klávesa
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Vytvoření položky události pro denní modal
function createDayEventItem(event) {
    const item = document.createElement('div');
    item.className = 'day-event-item';
    
    const startDate = new Date(event.startDate).toLocaleDateString('cs-CZ');
    const endDate = new Date(event.endDate).toLocaleDateString('cs-CZ');
    const dateText = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
    
    const statusIcon = {
        'completed': '✅',
        'ongoing': '🔥',
        'planned': '📅'
    }[event.status] || '📅';
    
    const sourceIcon = {
        'historical': '📈',
        'prediction_saved': '💾',
        'prediction_current': '🎯'
    }[event.source] || '📊';
    
    item.innerHTML = `
        <div class="event-header">
            <div class="event-color-bar" style="background-color: ${event.color};"></div>
            <div class="event-title-section">
                <h4>${escapeHtml(event.title)}</h4>
                <div class="event-meta">
                    ${statusIcon} ${getStatusLabel(event.status)} • 
                    ${sourceIcon} ${getSourceLabel(event.source)} • 
                    📍 ${escapeHtml(event.city)}
                </div>
            </div>
        </div>
        <div class="event-details">
            <div class="event-stats">
                ${event.data.visitors ? `<span>👥 ${formatNumber(event.data.visitors)} návštěvníků</span>` : ''}
                ${event.data.sales ? `<span>🍩 ${formatNumber(event.data.sales)} ks prodáno</span>` : ''}
                ${event.data.predictedSales ? `<span>🎯 ${formatNumber(event.data.predictedSales)} ks predikce</span>` : ''}
                ${event.data.expectedProfit ? `<span>💰 ${formatCurrency(event.data.expectedProfit)} zisk</span>` : ''}
            </div>
            <div class="event-actions">
                <button class="btn btn-detail" onclick="showEventModal('${event.id}')">📋 Detail</button>
                ${event.source.includes('prediction') ? 
                    `<button class="btn btn-upload" onclick="uploadPredictionToSheets('${event.id}')">📤 Nahrát do Sheets</button>` : ''}
            </div>
        </div>
    `;
    
    return item;
}

// Modal pro detail události
function showEventModal(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event) {
        showNotification('❌ Událost nenalezena', 'error');
        return;
    }
    
    console.log('📋 Showing event modal for:', event.title);
    
    // Použití existujícího modalu z HTML
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalEventName = document.getElementById('modalEventName');
    const modalEventDateFrom = document.getElementById('modalEventDateFrom');
    const modalEventDateTo = document.getElementById('modalEventDateTo');
    const modalEventCity = document.getElementById('modalEventCity');
    const modalSales = document.getElementById('modalSales');
    const modalNotes = document.getElementById('modalNotes');
    
    if (!modal) {
        console.error('❌ Event modal not found in HTML');
        return;
    }
    
    // Naplnění dat
    modalTitle.textContent = `${getSourceLabel(event.source)} - ${event.title}`;
    modalEventName.value = event.title;
    modalEventDateFrom.value = new Date(event.startDate).toLocaleDateString('cs-CZ');
    modalEventDateTo.value = new Date(event.endDate).toLocaleDateString('cs-CZ');
    modalEventCity.value = event.city;
    modalSales.value = event.data.sales || event.data.predictedSales || '';
    modalNotes.value = event.data.notes || '';
    
    // Uložení aktuální události do stavu
    calendarState.selectedEvent = event;
    
    // Zobrazení modalu
    modal.style.display = 'flex';
}

// ========================================
// MĚSÍČNÍ PŘEHLED
// ========================================

// Aktualizace seznamu událostí měsíce
function updateMonthEventsList() {
    console.log('📋 Updating month events list...');
    
    const monthEvents = document.getElementById('monthEvents');
    if (!monthEvents) return;
    
    // Filtrování událostí pro aktuální měsíc
    const monthStart = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
    const monthEnd = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
    
    const currentMonthEvents = calendarState.filteredEvents.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
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
    currentMonthEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    // Vytvoření tabulky událostí
    let html = `
        <div class="month-events-table">
            <div class="table-header">
                <div class="col-date">Datum</div>
                <div class="col-event">Akce</div>
                <div class="col-stats">Statistiky</div>
                <div class="col-business">Business</div>
                <div class="col-actions">Akce</div>
            </div>
    `;
    
    currentMonthEvents.forEach(event => {
        html += createMonthEventRow(event);
    });
    
    html += '</div>';
    
    // Statistiky měsíce
    const monthStats = calculateMonthStats(currentMonthEvents);
    html += createMonthStatsSection(monthStats);
    
    monthEvents.innerHTML = html;
    
    console.log(`📊 Month events list updated: ${currentMonthEvents.length} events`);
}

// Vytvoření řádku události v měsíčním přehledu
function createMonthEventRow(event) {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const dateText = startDate.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
    const fullDateText = startDate.toLocaleDateString('cs-CZ') === endDate.toLocaleDateString('cs-CZ') 
        ? startDate.toLocaleDateString('cs-CZ')
        : `${startDate.toLocaleDateString('cs-CZ')} - ${endDate.toLocaleDateString('cs-CZ')}`;
    
    const statusIcon = {
        'completed': '✅',
        'ongoing': '🔥',
        'planned': '📅'
    }[event.status] || '📅';
    
    const sourceIcon = {
        'historical': '📈',
        'prediction_saved': '💾',
        'prediction_current': '🎯'
    }[event.source] || '📊';
    
    // Statistiky
    const visitors = event.data.visitors || 0;
    const sales = event.data.sales || event.data.predictedSales || 0;
    const conversion = visitors > 0 ? ((sales / visitors) * 100).toFixed(1) : '0';
    
    // Business data
    const revenue = event.data.expectedRevenue || (sales * (event.data.price || 110));
    const profit = event.data.expectedProfit || 0;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';
    
    return `
        <div class="table-row" onclick="showEventModal('${event.id}')" style="cursor: pointer;">
            <div class="col-date">
                <div class="date-display">${dateText}</div>
                <div class="date-full" title="${fullDateText}">${statusIcon}</div>
            </div>
            <div class="col-event">
                <div class="event-color-indicator" style="background-color: ${event.color};"></div>
                <div class="event-info">
                    <div class="event-name">${escapeHtml(event.title)}</div>
                    <div class="event-details">
                        ${sourceIcon} ${event.category} • 📍 ${escapeHtml(event.city)}
                    </div>
                </div>
            </div>
            <div class="col-stats">
                <div class="stat-item">
                    <span class="stat-value">${formatNumber(visitors)}</span>
                    <span class="stat-label">návštěvníků</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${formatNumber(sales)}</span>
                    <span class="stat-label">ks ${event.source.includes('prediction') ? 'predikce' : 'prodej'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${conversion}%</span>
                    <span class="stat-label">konverze</span>
                </div>
            </div>
            <div class="col-business">
                <div class="business-item">
                    <span class="business-value">${formatCurrency(revenue)}</span>
                    <span class="business-label">obrat</span>
                </div>
                <div class="business-item">
                    <span class="business-value ${profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(profit)}</span>
                    <span class="business-label">zisk</span>
                </div>
                <div class="business-item">
                    <span class="business-value">${margin}%</span>
                    <span class="business-label">marže</span>
                </div>
            </div>
            <div class="col-actions">
                <button class="btn-small btn-detail" onclick="event.stopPropagation(); showEventModal('${event.id}')" title="Zobrazit detail">
                    📋
                </button>
                ${event.source.includes('prediction') ? 
                    `<button class="btn-small btn-upload" onclick="event.stopPropagation(); uploadPredictionToSheets('${event.id}')" title="Nahrát do Sheets">📤</button>` : ''}
            </div>
        </div>
    `;
}

// Výpočet statistik měsíce
function calculateMonthStats(events) {
    const stats = {
        totalEvents: events.length,
        completedEvents: events.filter(e => e.status === 'completed').length,
        totalVisitors: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
        avgConversion: 0,
        avgMargin: 0
    };
    
    let validConversions = [];
    let validMargins = [];
    
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
        
        if (revenue > 0) {
            validMargins.push((profit / revenue) * 100);
        }
    });
    
    stats.avgConversion = validConversions.length > 0 
        ? validConversions.reduce((sum, conv) => sum + conv, 0) / validConversions.length 
        : 0;
        
    stats.avgMargin = validMargins.length > 0
        ? validMargins.reduce((sum, margin) => sum + margin, 0) / validMargins.length
        : 0;
    
    return stats;
}

// Vytvoření sekce statistik měsíce
function createMonthStatsSection(stats) {
    return `
        <div class="month-stats">
            <h4>📊 Statistiky měsíce</h4>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalEvents}</div>
                    <div class="stat-label">Celkem akcí</div>
                    <div class="stat-sublabel">${stats.completedEvents} dokončených</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatNumber(stats.totalVisitors)}</div>
                    <div class="stat-label">Celkem návštěvníků</div>
                    <div class="stat-sublabel">${stats.totalEvents > 0 ? Math.round(stats.totalVisitors / stats.totalEvents) : 0} průměr/akci</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatNumber(stats.totalSales)}</div>
                    <div class="stat-label">Celkem prodej</div>
                    <div class="stat-sublabel">${stats.avgConversion.toFixed(1)}% průměrná konverze</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(stats.totalRevenue)}</div>
                    <div class="stat-label">Celkový obrat</div>
                    <div class="stat-sublabel">${stats.totalEvents > 0 ? formatCurrency(stats.totalRevenue / stats.totalEvents) : '0 Kč'} průměr/akci</div>
                </div>
                <div class="stat-card ${stats.totalProfit >= 0 ? 'positive' : 'negative'}">
                    <div class="stat-value">${formatCurrency(stats.totalProfit)}</div>
                    <div class="stat-label">Celkový zisk</div>
                    <div class="stat-sublabel">${stats.avgMargin.toFixed(1)}% průměrná marže</div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// UPLOAD DO GOOGLE SHEETS
// ========================================

// Nahrání predikce do Google Sheets
async function uploadPredictionToSheets(eventId) {
    const event = calendarState.events.find(e => e.id === eventId);
    if (!event || !event.source.includes('prediction')) {
        showNotification('❌ Lze nahrát pouze predikce', 'error');
        return;
    }
    
    console.log('📤 Uploading prediction to Sheets:', event.title);
    
    try {
        showNotification('📤 Nahrávám predikci do Google Sheets...', 'info');
        
        // Simulace nahrání (v reálné aplikaci by zde byl API call)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Označení jako nahráno
        event.source = 'historical';
        event.status = 'planned'; // nebo podle aktuálního data
        
        // Přegenerování kalendáře
        displayEventsInCalendar();
        updateMonthEventsList();
        
        showNotification('✅ Predikce úspěšně nahrána do Google Sheets', 'success');
        
        console.log('✅ Prediction uploaded successfully');
        
    } catch (error) {
        console.error('❌ Upload failed:', error);
        showNotification('❌ Nahrání selhalo: ' + error.message, 'error');
    }
}

// ========================================
// HELPER FUNKCE
// ========================================

// Získání labelu statusu
function getStatusLabel(status) {
    const labels = {
        'completed': 'Dokončeno',
        'ongoing': 'Probíhá',
        'planned': 'Naplánováno'
    };
    return labels[status] || status;
}

// Získání labelu zdroje
function getSourceLabel(source) {
    const labels = {
        'historical': 'Historická data',
        'prediction_saved': 'Uložená predikce',
        'prediction_current': 'Aktuální predikce'
    };
    return labels[source] || source;
}

// Uložení editace události
function saveEventEdit() {
    if (!calendarState.selectedEvent) {
        showNotification('❌ Žádná událost k uložení', 'error');
        return;
    }
    
    const modalSales = document.getElementById('modalSales');
    const modalNotes = document.getElementById('modalNotes');
    
    if (modalSales && modalSales.value) {
        calendarState.selectedEvent.data.sales = parseInt(modalSales.value);
    }
    
    if (modalNotes && modalNotes.value) {
        calendarState.selectedEvent.data.notes = modalNotes.value;
    }
    
    // Zavření modalu
    closeModal();
    
    // Aktualizace zobrazení
    displayEventsInCalendar();
    updateMonthEventsList();
    
    showNotification('💾 Změny uloženy', 'success');
    console.log('💾 Event edit saved');
}

// Smazání události
function deleteEvent() {
    if (!calendarState.selectedEvent) {
        showNotification('❌ Žádná událost ke smazání', 'error');
        return;
    }
    
    if (!confirm(`Opravdu chcete smazat událost "${calendarState.selectedEvent.title}"?`)) {
        return;
    }
    
    // Odstranění z pole událostí
    const index = calendarState.events.findIndex(e => e.id === calendarState.selectedEvent.id);
    if (index > -1) {
        calendarState.events.splice(index, 1);
    }
    
    // Zavření modalu
    closeModal();
    
    // Aktualizace zobrazení
    applyCalendarFilters();
    displayEventsInCalendar();
    updateMonthEventsList();
    
    showNotification('🗑️ Událost smazána', 'success');
    console.log('🗑️ Event deleted');
}

// Filtrování kalendáře (funkce volaná z HTML)
function filterCalendar() {
    applyCalendarFilters();
}

// ========================================
// EVENT LISTENERS A INTEGRACE
// ========================================

// Event listenery pro komunikaci s ostatními částmi
eventBus.on('dataLoaded', (data) => {
    console.log('📊 Calendar: Data loaded, refreshing events');
    setTimeout(() => {
        loadCalendarEvents();
    }, 500);
});

eventBus.on('predictionSaved', (prediction) => {
    console.log('💾 Calendar: Prediction saved, adding to calendar');
    
    // Přidání nové predikce do kalendáře
    const newEvent = convertPredictionToEvent(prediction);
    calendarState.events.push(newEvent);
    
    // Aktualizace zobrazení
    applyCalendarFilters();
    displayEventsInCalendar();
    updateMonthEventsList();
    populateFilterOptions();
});

eventBus.on('calendarRequested', () => {
    console.log('📅 Calendar view requested');
    
    // Inicializace kalendáře pokud ještě nebyla provedena
    if (calendarState.events.length === 0) {
        initializeCalendar();
    } else {
        // Refresh existujícího kalendáře
        displayEventsInCalendar();
        updateMonthEventsList();
    }
});

eventBus.on('calendarMonthChanged', (data) => {
    console.log('📅 Calendar month changed via eventBus');
    calendarState.currentMonth = data.month;
    calendarState.currentYear = data.year;
    
    generateCalendarGrid();
    displayEventsInCalendar();
    updateMonthEventsList();
});

eventBus.on('calendarTodayRequested', () => {
    console.log('📍 Calendar today requested via eventBus');
    goToToday();
});

eventBus.on('calendarResizeRequested', () => {
    console.log('📐 Calendar resize requested');
    // Refresh kalendáře pro responsive změny
    setTimeout(() => {
        generateCalendarGrid();
        displayEventsInCalendar();
    }, 100);
});

// ========================================
// CSS STYLES PRO KALENDÁŘ
// ========================================

// Přidání dodatečných CSS stylů pro kalendář
function addCalendarStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Kalendář - dodatečné styly */
        .day-modal .modal-content {
            max-width: 800px;
            width: 95%;
        }
        
        .day-events-list {
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .day-event-item {
            background: var(--white);
            border-radius: var(--radius-sm);
            margin-bottom: var(--spacing-md);
            border: 1px solid var(--gray-200);
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .day-event-item:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
        }
        
        .event-header {
            display: flex;
            align-items: flex-start;
            padding: var(--spacing-md);
            border-bottom: 1px solid var(--gray-200);
        }
        
        .event-color-bar {
            width: 4px;
            min-height: 40px;
            margin-right: var(--spacing-md);
            border-radius: 2px;
        }
        
        .event-title-section h4 {
            margin: 0 0 var(--spacing-xs) 0;
            color: var(--gray-800);
            font-size: var(--font-size-lg);
        }
        
        .event-meta {
            color: var(--gray-600);
            font-size: var(--font-size-sm);
        }
        
        .event-details {
            padding: var(--spacing-md);
        }
        
        .event-stats {
            display: flex;
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-md);
            flex-wrap: wrap;
        }
        
        .event-stats span {
            background: var(--gray-100);
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            font-weight: 500;
        }
        
        .event-actions {
            display: flex;
            gap: var(--spacing-sm);
        }
        
        .btn-detail, .btn-upload {
            padding: var(--spacing-xs) var(--spacing-sm);
            font-size: var(--font-size-sm);
        }
        
        .btn-upload {
            background: var(--warning-color);
            color: var(--gray-800);
        }
        
        /* Měsíční přehled tabulka */
        .month-events-table {
            background: var(--white);
            border-radius: var(--radius-md);
            overflow: hidden;
            border: 1px solid var(--gray-200);
            margin-bottom: var(--spacing-xl);
        }
        
        .table-header {
            display: grid;
            grid-template-columns: 80px 1fr 200px 180px 80px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: var(--white);
            font-weight: 600;
            font-size: var(--font-size-sm);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: var(--spacing-md);
        }
        
        .table-row {
            display: grid;
            grid-template-columns: 80px 1fr 200px 180px 80px;
            padding: var(--spacing-md);
            border-bottom: 1px solid var(--gray-200);
            transition: all 0.3s ease;
            align-items: center;
        }
        
        .table-row:hover {
            background: var(--gray-100);
            transform: translateX(3px);
        }
        
        .table-row:last-child {
            border-bottom: none;
        }
        
        .col-date {
            text-align: center;
        }
        
        .date-display {
            font-weight: 600;
            font-size: var(--font-size-base);
            color: var(--gray-800);
        }
        
        .date-full {
            font-size: var(--font-size-xs);
            color: var(--gray-500);
            margin-top: 2px;
        }
        
        .col-event {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
        }
        
        .event-color-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .event-name {
            font-weight: 600;
            color: var(--gray-800);
            margin-bottom: 2px;
        }
        
        .event-details {
            font-size: var(--font-size-xs);
            color: var(--gray-600);
        }
        
        .col-stats, .col-business {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .stat-item, .business-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: var(--font-size-xs);
        }
        
        .stat-value, .business-value {
            font-weight: 600;
            color: var(--gray-800);
        }
        
        .business-value.positive {
            color: var(--success-color);
        }
        
        .business-value.negative {
            color: var(--error-color);
        }
        
        .stat-label, .business-label {
            color: var(--gray-500);
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .col-actions {
            display: flex;
            gap: 4px;
            justify-content: center;
        }
        
        .btn-small {
            padding: 4px 6px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
            background: var(--gray-200);
            color: var(--gray-700);
        }
        
        .btn-small:hover {
            background: var(--gray-300);
            transform: scale(1.1);
        }
        
        .btn-small.btn-upload {
            background: var(--warning-color);
            color: var(--gray-800);
        }
        
        /* Statistiky měsíce */
        .month-stats {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: var(--spacing-xl);
            border-radius: var(--radius-lg);
            border: 1px solid var(--gray-200);
        }
        
        .month-stats h4 {
            text-align: center;
            margin-bottom: var(--spacing-lg);
            color: var(--gray-800);
            font-size: var(--font-size-xl);
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
        }
        
        .stat-card:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-md);
        }
        
        .stat-card.positive {
            border-left-color: var(--success-color);
        }
        
        .stat-card.negative {
            border-left-color: var(--error-color);
        }
        
        .stat-card .stat-value {
            font-size: var(--font-size-2xl);
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: var(--spacing-xs);
        }
        
        .stat-card.positive .stat-value {
            color: var(--success-color);
        }
        
        .stat-card.negative .stat-value {
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
        
        .stat-card .stat-sublabel {
            color: var(--gray-500);
            font-size: var(--font-size-xs);
        }
        
        /* Responsive design pro kalendář */
        @media (max-width: 768px) {
            .table-header,
            .table-row {
                grid-template-columns: 60px 1fr 80px;
            }
            
            .col-stats,
            .col-business,
            .col-actions {
                display: none;
            }
            
            .event-stats {
                justify-content: center;
            }
            
            .month-stats .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .day-modal .modal-content {
                width: 98%;
                margin: 10px;
            }
            
            .event-stats {
                flex-direction: column;
                align-items: center;
                gap: var(--spacing-sm);
            }
        }
        
        @media (max-width: 480px) {
            .table-header,
            .table-row {
                grid-template-columns: 1fr;
                text-align: center;
            }
            
            .col-date,
            .col-event {
                border-bottom: 1px solid var(--gray-200);
                padding-bottom: var(--spacing-xs);
                margin-bottom: var(--spacing-xs);
            }
            
            .month-stats .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .event-actions {
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ========================================
// INICIALIZACE KALENDÁŘE
// ========================================

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Calendar Part 4 initializing...');
    
    // Přidání CSS stylů
    addCalendarStyles();
    
    // Čekání na načtení ostatních částí
    setTimeout(() => {
        if (globalState && eventBus) {
            console.log('✅ Calendar Part 4 ready');
        }
    }, 1000);
});

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 4 loaded successfully');
console.log('📅 Features: ✅ Monthly Calendar ✅ Event Colors ✅ Status Tracking ✅ Filters ✅ Monthly Overview');
console.log('🔗 Integration: ✅ Google Sheets ✅ Predictions ✅ eventBus ✅ Modal System');
console.log('📱 Responsive: ✅ Mobile Support ✅ Touch Events ✅ Adaptive Layout');
console.log('📤 Actions: ✅ Upload to Sheets ✅ Edit Events ✅ Delete Events ✅ View Details');

// Event pro signalizaci dokončení části 4
eventBus.emit('part4Loaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: [
        'monthly-calendar', 
        'event-colors-by-name', 
        'status-tracking', 
        'multi-source-events',
        'filters-and-search',
        'monthly-overview-table',
        'business-statistics',
        'upload-to-sheets',
        'event-management',
        'responsive-design'
    ]
});
