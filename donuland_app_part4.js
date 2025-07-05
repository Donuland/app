/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 4 REFACTORED
   Rozděleno do sekcí A-E pro lepší údržbu a kompatibilitu
   ======================================== */

console.log('🍩 Donuland Part 4 REFACTORED loading...');

/* ========================================
   PART 4A: CALENDAR CORE & STATE
   Základní kalendářní funkcionalita a stav
   ======================================== */

// Kalendář globální stav
const calendarState = {
    currentEvents: [],
    filteredEvents: [],
    eventColors: new Map(), // Mapování názvu akce na barvu
    colorPalette: [], // Vygenerované barvy
    filters: {
        city: '',
        category: '',
        status: ''
    },
    isRendering: false,
    lastColorIndex: 0 // Pro rotaci barev
};

// Generování neomezené palety barev
function generateColorPalette() {
    const colors = [];
    const saturation = 70;
    const lightness = 60;
    
    // Generuj barvy s 30° rozdílem v hue
    for (let i = 0; i < 360; i += 30) {
        colors.push(`hsl(${i}, ${saturation}%, ${lightness}%)`);
    }
    
    // Pro více než 12 akcí, variuj saturaci a světlost
    for (let i = 0; i < 360; i += 45) {
        colors.push(`hsl(${i}, 85%, 45%)`); // Tmavší varianta
        colors.push(`hsl(${i}, 55%, 75%)`); // Světlejší varianta
    }
    
    return colors;
}

// Hash funkce pro konzistentní přiřazení barev
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Převést na 32bit integer
    }
    return Math.abs(hash);
}

// Získání barvy pro akci
function getEventColor(eventName, date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    
    // Dokončené akce - jednotná žlutá barva
    if (eventDate < today) {
        return {
            background: '#fff3cd',
            border: '#ffeaa7',
            textColor: '#856404',
            icon: '✅'
        };
    }
    
    // Plánované akce - unikátní barvy
    const eventKey = eventName.toLowerCase().trim();
    
    if (!calendarState.eventColors.has(eventKey)) {
        // Inicializace palety pokud není
        if (calendarState.colorPalette.length === 0) {
            calendarState.colorPalette = generateColorPalette();
        }
        
        // Přiřaď barvu založenou na hash
        const hash = hashString(eventKey);
        const colorIndex = hash % calendarState.colorPalette.length;
        const color = calendarState.colorPalette[colorIndex];
        
        calendarState.eventColors.set(eventKey, {
            background: color,
            border: color,
            textColor: '#ffffff',
            icon: '🔮'
        });
    }
    
    return calendarState.eventColors.get(eventKey);
}

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

/* ========================================
   PART 4B: EVENTS PROCESSING & DEDUPLICATION
   Zpracování událostí a odstranění duplicit
   ======================================== */

// Získání událostí pro konkrétní datum s pokročilou deduplicí
function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    const events = [];
    const eventMap = new Map(); // Pro detekci duplicit
    
    try {
        // 1. Historické akce z globálních dat (dokončené)
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            globalState.historicalData.forEach(record => {
                if (isDateInRange(dateStr, record.dateFrom, record.dateTo)) {
                    const eventKey = createEventKey(record.eventName, record.city, record.dateFrom);
                    
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
                        eventKey: eventKey,
                        source: 'sheets'
                    };
                    
                    eventMap.set(eventKey, event);
                }
            });
        }
        
        // 2. Uložené predikce z localStorage
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.forEach(prediction => {
            if (prediction.formData && isDateInRange(dateStr, prediction.formData.eventDateFrom, prediction.formData.eventDateTo)) {
                const eventKey = createEventKey(
                    prediction.formData.eventName, 
                    prediction.formData.city, 
                    prediction.formData.eventDateFrom
                );
                
                // Zkontroluj, zda už existuje historická akce se stejným klíčem
                if (eventMap.has(eventKey)) {
                    // SLOUČENÍ: Přidej predikci k existující historické akci
                    const existingEvent = eventMap.get(eventKey);
                    existingEvent.hasPrediction = true;
                    existingEvent.predictionData = prediction;
                    existingEvent.predictedSales = prediction.prediction?.predictedSales;
                    existingEvent.confidence = prediction.prediction?.confidence;
                    console.log(`🔗 Merged prediction with historical event: ${existingEvent.title}`);
                } else {
                    // NOVÁ PREDIKCE: Vytvoř novou predikční akci
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const eventDate = new Date(prediction.formData.eventDateFrom);
                    eventDate.setHours(0, 0, 0, 0);
                    
                    const status = prediction.actualSales && prediction.actualSales > 0 ? 'completed' : 
                                  eventDate < today ? 'completed' : 'planned';
                    
                    const event = {
                        id: `prediction-${prediction.id}`,
                        type: 'prediction',
                        status: status,
                        title: prediction.formData.eventName,
                        city: prediction.formData.city,
                        category: prediction.formData.category,
                        predictedSales: prediction.prediction?.predictedSales,
                        actualSales: prediction.actualSales,
                        confidence: prediction.prediction?.confidence,
                        visitors: prediction.formData.visitors,
                        dateFrom: prediction.formData.eventDateFrom,
                        dateTo: prediction.formData.eventDateTo || prediction.formData.eventDateFrom,
                        data: prediction,
                        eventKey: eventKey,
                        source: 'prediction'
                    };
                    
                    eventMap.set(eventKey, event);
                }
            }
        });
        
        // 3. Manuálně přidané události
        const manualEvents = JSON.parse(localStorage.getItem('donuland_manual_events') || '[]');
        manualEvents.forEach(event => {
            if (isDateInRange(dateStr, event.dateFrom, event.dateTo)) {
                const eventKey = createEventKey(event.eventName, event.city, event.dateFrom);
                
                if (!eventMap.has(eventKey)) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const eventDate = new Date(event.dateFrom);
                    eventDate.setHours(0, 0, 0, 0);
                    
                    const status = eventDate < today ? 'completed' : 'planned';
                    
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
                        dateTo: event.dateTo || event.dateFrom,
                        data: event,
                        eventKey: eventKey,
                        source: 'manual'
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

// Vytvoření konzistentního klíče pro událost
function createEventKey(eventName, city, dateFrom) {
    return `${eventName}-${city}-${dateFrom}`.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
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

/* ========================================
   PART 4C: CALENDAR UI RENDERING
   Vykreslování kalendářního UI s novými barvami
   ======================================== */

// Vytvoření prvku kalendářního dne s pokročilým barevným schématem
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
    
    // Seznam událostí s pokročilým barevným rozlišením
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    dayData.events.slice(0, 3).forEach(event => { // Max 3 události viditelné
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        
        // Získání barvy pro událost
        const colorInfo = getEventColor(event.title, dayData.date);
        
        // Aplikace barev a stylů
        eventElement.style.background = colorInfo.background;
        eventElement.style.borderLeft = `3px solid ${colorInfo.border}`;
        eventElement.style.color = colorInfo.textColor;
        
        // Text události
        let eventText = event.title;
        
        // Přidání ikon podle typu a stavu
        if (event.hasPrediction) {
            eventText = '🔮📊 ' + eventText; // Akce s predikcí
        } else if (event.status === 'completed') {
            eventText = colorInfo.icon + ' ' + eventText;
        } else {
            eventText = colorInfo.icon + ' ' + eventText;
        }
        
        eventElement.textContent = eventText;
        
        // Tooltip s detaily
        const tooltipInfo = [
            `${event.title}`,
            `📍 ${event.city}`,
            `📊 ${event.category}`,
            event.sales ? `🍩 ${formatNumber(event.sales)} ks` : '',
            event.predictedSales ? `🔮 Predikce: ${formatNumber(event.predictedSales)} ks` : '',
            event.confidence ? `🎯 Confidence: ${event.confidence}%` : '',
            `📅 ${formatDate(event.dateFrom)} - ${formatDate(event.dateTo)}`,
            `📋 ${event.status === 'completed' ? 'Dokončeno' : 'Plánováno'}`,
            event.source ? `📂 Zdroj: ${event.source}` : ''
        ].filter(Boolean).join('\n');
        
        eventElement.title = tooltipInfo;
        
        // Speciální CSS třídy pro různé typy
        if (event.hasPrediction) {
            eventElement.classList.add('has-prediction');
        }
        if (event.status === 'completed') {
            eventElement.classList.add('completed');
        } else {
            eventElement.classList.add('planned');
        }
        
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
        moreIndicator.style.color = '#ffffff';
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
        max-width: 500px;
        max-height: 600px;
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
        <div style="max-height: 400px; overflow-y: auto;">
    `;
    
    events.forEach(event => {
        const colorInfo = getEventColor(event.title, date);
        
        // Typ a label
        let typeIcon = colorInfo.icon;
        let typeLabel = event.status === 'completed' ? 'Dokončeno' : 'Plánováno';
        let backgroundColor = colorInfo.background;
        
        if (event.type === 'historical') {
            typeLabel = 'Historická (ze Sheets)';
        } else if (event.type === 'prediction') {
            typeLabel = event.status === 'completed' ? 'Predikce (dokončeno)' : 'Predikce (plánováno)';
        } else {
            typeLabel = event.status === 'completed' ? 'Manuální (dokončeno)' : 'Manuální (plánováno)';
        }
        
        const sales = event.sales || event.actualSales || event.predictedSales || 0;
        const salesText = event.type === 'prediction' && !event.actualSales ? 
            `🔮 ${formatNumber(event.predictedSales)} ks (predikce)` : 
            `🍩 ${formatNumber(sales)} ks`;
        
        // Označení pro akce s predikcí
        const predictionBadge = event.hasPrediction ? 
            '<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">🔮 + Predikce</span>' : '';
        
        // Confidence badge
        const confidenceBadge = event.confidence ? 
            `<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">🎯 ${event.confidence}%</span>` : '';
        
        html += `
            <div style="background: ${backgroundColor}; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid ${colorInfo.border}; color: ${colorInfo.textColor};">
                <h4 style="margin: 0 0 8px; color: ${colorInfo.textColor};">${escapeHtml(event.title)}${predictionBadge}${confidenceBadge}</h4>
                <p style="margin: 0 0 5px; font-size: 0.9em; opacity: 0.9;">
                    ${typeIcon} ${typeLabel} • ${escapeHtml(event.city)} • ${escapeHtml(event.category)}
                </p>
                <div style="font-size: 0.8em; opacity: 0.8;">
                    ${salesText} • 👥 ${formatNumber(event.visitors)} návštěvníků
                </div>
                <button onclick="openEventModalFromPopup('${event.type}', '${event.id}'); this.closest('.day-events-popup').remove();" 
                        style="margin-top: 8px; padding: 4px 8px; background: rgba(255,255,255,0.2); color: ${colorInfo.textColor}; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer; font-size: 0.8em;">
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

/* ========================================
   PART 4D: ANALYTICS FIXES
   Oprava analytics funkcí
   ======================================== */

// OPRAVENÁ funkce pro výpočet celkových statistik
function calculateOverallStats() {
    console.log('📊 Calculating overall stats (FIXED VERSION)...');
    
    // Debug: Zkontroluj vstupní data
    console.log('📊 Input data check:', {
        totalRecords: globalState.historicalData?.length || 0,
        sampleRecord: globalState.historicalData?.[0]
    });
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('📊 No historical data available');
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
    
    // OPRAVA: Flexibilnější filtrování validních událostí
    const validEvents = globalState.historicalData.filter(record => {
        const hasValidSales = record.sales && record.sales > 0;
        const hasValidVisitors = record.visitors && record.visitors > 0;
        const hasBasicInfo = record.eventName && record.city;
        
        // Debug každý záznam
        if (globalState.debugMode) {
            console.log('📊 Record validation:', {
                eventName: record.eventName,
                sales: record.sales,
                visitors: record.visitors,
                isValid: hasValidSales && hasValidVisitors && hasBasicInfo
            });
        }
        
        return hasValidSales && hasValidVisitors && hasBasicInfo;
    });
    
    console.log('📊 Valid events after filtering:', {
        total: validEvents.length,
        sample: validEvents.slice(0, 3)
    });
    
    if (validEvents.length === 0) {
        console.log('📊 No valid events found after filtering');
        return {
            totalEvents: globalState.historicalData.length,
            totalSales: 0,
            averageSales: 0,
            totalRevenue: 0,
            averageConversion: 0,
            topMonth: null,
            bestCategory: null
        };
    }
    
    // Výpočty
    const totalSales = validEvents.reduce((sum, record) => sum + (record.sales || 0), 0);
    const totalVisitors = validEvents.reduce((sum, record) => sum + (record.visitors || 0), 0);
    const averageSales = Math.round(totalSales / validEvents.length);
    const totalRevenue = totalSales * CONFIG.DONUT_PRICE;
    const averageConversion = totalVisitors > 0 ? ((totalSales / totalVisitors) * 100) : 0;
    
    // Najít nejlepší měsíc
    const monthlyStats = {};
    validEvents.forEach(record => {
        if (record.dateFrom) {
            try {
                const date = new Date(record.dateFrom);
                if (!isNaN(date.getTime())) {
                    const monthKey = date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
                    
                    if (!monthlyStats[monthKey]) {
                        monthlyStats[monthKey] = { sales: 0, events: 0 };
                    }
                    monthlyStats[monthKey].sales += record.sales || 0;
                    monthlyStats[monthKey].events += 1;
                }
            } catch (error) {
                console.warn('Date parsing error for record:', record);
            }
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
            categoryStats[record.category].sales += record.sales || 0;
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
        averageConversion: parseFloat(averageConversion.toFixed(1)),
        topMonth: topMonth,
        bestCategory: bestCategory
    };
    
    console.log('📊 Overall stats calculated (FIXED):', result);
    return result;
}

// Přepsání původní funkce v analyticsState
if (typeof window !== 'undefined') {
    // Náhrada původní funkce novější verzí
    window.calculateOverallStatsFixed = calculateOverallStats;
}

/* ========================================
   PART 4E: MODAL & EVENT MANAGEMENT
   Rozšířená správa událostí a modálů
   ======================================== */

// Helper funkce pro otevření modalu z popup
function openEventModalFromPopup(eventType, eventId) {
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

// Aktualizace kalendářních filtrů
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

// Aktualizace seznamu akcí pro měsíc
function updateMonthEventsList() {
    const monthEventsDiv = document.getElementById('monthEvents');
    if (!monthEventsDiv) return;
    
    try {
        const year = globalState.currentYear;
        const month = globalState.currentMonth;
        
        // Získání všech akcí v měsíci
        const monthEvents = [];
        
        // Procházej každý den v měsíci a shromáždi události
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayEvents = getEventsForDate(date);
            
            dayEvents.forEach(event => {
                // Přidej pouze pokud ještě není v seznamu (prevence duplicit)
                const exists = monthEvents.find(existing => existing.eventKey === event.eventKey);
                if (!exists) {
                    monthEvents.push({
                        ...event,
                        date: date
                    });
                }
            });
        }
        
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
            const colorInfo = getEventColor(event.title, event.date);
            
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
            
            // Predikční badge
            const predictionBadge = event.hasPrediction ? 
                '<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-left: 5px;">🔮 + Predikce</span>' : '';
            
            const sales = event.sales || event.actualSales || event.predictedSales || 0;
            
            html += `
                <div class="month-event-item ${event.type} ${statusClass}" style="border-left: 4px solid ${colorInfo.border};">
                    <div class="event-date">
                        <div class="event-day">${event.date.getDate()}</div>
                        <div class="event-month">${event.date.toLocaleDateString('cs-CZ', { month: 'short' })}</div>
                        <div class="event-status">${statusIcon}</div>
                    </div>
                    <div class="event-details">
                        <h4 style="color: ${colorInfo.border};">${colorInfo.icon} ${escapeHtml(event.title)}${durationInfo}${predictionBadge}</h4>
                        <p>${escapeHtml(event.city)} • ${escapeHtml(event.category)} • ${event.source || 'neznámý zdroj'}</p>
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
    // Používá stejnou logiku jako openEventModalFromPopup
    openEventModalFromPopup(eventType, eventId);
}

/* ========================================
   EVENT LISTENERS A INTEGRACE
   ======================================== */

// Event listeners pro kalendář
eventBus.on('calendarMonthChanged', (data) => {
    console.log('📅 Calendar month changed:', data);
    renderCalendar();
});

eventBus.on('calendarTodayRequested', () => {
    console.log('📅 Calendar today requested');
    renderCalendar();
});

eventBus.on('calendarResizeRequested', () => {
    console.log('📅 Calendar resize requested');
    setTimeout(() => {
        renderCalendar();
    }, 100);
});

eventBus.on('calendarRequested', () => {
    console.log('📅 Calendar section requested');
    setTimeout(() => {
        updateCalendarFilters();
        renderCalendar();
    }, 100);
});

eventBus.on('dataLoaded', () => {
    console.log('📅 Data loaded, updating calendar and analytics');
    setTimeout(() => {
        updateCalendarFilters();
        renderCalendar();
        
        // OPRAVA: Použij opravenou funkci pro overall stats
        if (typeof analyticsState !== 'undefined') {
            analyticsState.overallStats = calculateOverallStats();
            if (typeof displayOverallStats !== 'undefined') {
                displayOverallStats();
            }
        }
    }, 500);
});

eventBus.on('dataUpdated', () => {
    console.log('📅 Data updated, refreshing calendar and analytics');
    setTimeout(() => {
        updateCalendarFilters();
        renderCalendar();
        
        // OPRAVA: Aktualizuj i analytics
        if (typeof analyticsState !== 'undefined') {
            analyticsState.overallStats = calculateOverallStats();
            if (typeof displayOverallStats !== 'undefined') {
                displayOverallStats();
            }
        }
    }, 100);
});

eventBus.on('modalClosed', () => {
    setTimeout(() => {
        renderCalendar();
    }, 100);
});

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Initializing Part 4 REFACTORED...');
    
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
            
            // OPRAVA: Spusť opravenou analytics funkci
            if (typeof analyticsState !== 'undefined') {
                analyticsState.overallStats = calculateOverallStats();
                if (typeof displayOverallStats !== 'undefined') {
                    displayOverallStats();
                }
            }
        }, 1000);
    }
    
    console.log('✅ Part 4 REFACTORED initialized');
});

/* ========================================
   CSS EXTENSIONS PRO NOVÉ FUNKCE
   ======================================== */

// Přidání CSS stylů pro nové funkce
function addPart4RefactoredStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Pokročilé barvy pro události */
        .event-item.has-prediction {
            position: relative;
            background: linear-gradient(45deg, var(--primary-color), var(--info-color)) !important;
            animation: predictionGlow 2s ease-in-out infinite alternate;
        }
        
        @keyframes predictionGlow {
            0% { box-shadow: 0 0 5px rgba(23, 162, 184, 0.5); }
            100% { box-shadow: 0 0 15px rgba(23, 162, 184, 0.8); }
        }
        
        .event-item.completed {
            opacity: 0.8;
            border-style: solid;
        }
        
        .event-item.planned {
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Vylepšení pro day events popup */
        .day-events-popup {
            backdrop-filter: blur(10px);
            animation: popupSlideIn 0.3s ease-out;
        }
        
        @keyframes popupSlideIn {
            from { 
                opacity: 0; 
                transform: translate(-50%, -60%) scale(0.9); 
            }
            to { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1); 
            }
        }
        
        /* Barevné rozlišení v month events */
        .month-event-item {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .month-event-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .month-event-item:hover::before {
            left: 100%;
        }
        
        /* Debug mode styly */
        .debug-info {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            max-width: 300px;
        }
        
        .color-palette-preview {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            margin-top: 5px;
        }
        
        .color-palette-preview .color-sample {
            width: 20px;
            height: 20px;
            border-radius: 3px;
            border: 1px solid #ccc;
        }
        
        /* Responsive vylepšení */
        @media (max-width: 768px) {
            .day-events-popup {
                width: 95%;
                max-height: 80vh;
                left: 2.5% !important;
                right: 2.5% !important;
                transform: translateY(-50%) !important;
            }
            
            .month-event-item {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .event-actions {
                margin-top: 10px;
                align-self: stretch;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Spusť přidání stylů při načtení
document.addEventListener('DOMContentLoaded', function() {
    addPart4RefactoredStyles();
});

/* ========================================
   DEBUG A TESTING FUNKCE
   ======================================== */

// Debug funkce pro testování barev
function debugColors() {
    if (!globalState.debugMode) return;
    
    const debugDiv = document.createElement('div');
    debugDiv.className = 'debug-info';
    debugDiv.innerHTML = `
        <div><strong>🎨 Color Debug</strong></div>
        <div>Cached colors: ${calendarState.eventColors.size}</div>
        <div>Palette size: ${calendarState.colorPalette.length}</div>
        <div class="color-palette-preview">
            ${calendarState.colorPalette.slice(0, 12).map(color => 
                `<div class="color-sample" style="background: ${color};" title="${color}"></div>`
            ).join('')}
        </div>
    `;
    
    // Odstraň předchozí debug info
    const existing = document.querySelector('.debug-info');
    if (existing) existing.remove();
    
    document.body.appendChild(debugDiv);
    
    // Auto-hide po 10 sekundách
    setTimeout(() => {
        if (debugDiv.parentElement) {
            debugDiv.remove();
        }
    }, 10000);
}

// Global funkce pro debug
if (typeof window !== 'undefined') {
    window.donulandPart4Debug = {
        getCalendarState: () => calendarState,
        getEventColors: () => calendarState.eventColors,
        generateTestEvent: (name, date) => getEventColor(name, date),
        showColorDebug: debugColors,
        clearColors: () => {
            calendarState.eventColors.clear();
            renderCalendar();
        }
    };
}

/* ========================================
   FINALIZACE
   ======================================== */

console.log('✅ Donuland Part 4 REFACTORED loaded successfully');
console.log('🎨 Features: ✅ Advanced Color System ✅ Event Deduplication ✅ Fixed Analytics ✅ Enhanced UI');
console.log('📊 Analytics Fix: ✅ calculateOverallStats() repaired');
console.log('🎯 Calendar: ✅ Unique colors ✅ Completed/Planned distinction ✅ Prediction merging');
console.log('🔧 Debug: window.donulandPart4Debug available');

// Event pro signalizaci dokončení refactored části 4
eventBus.emit('part4RefactoredLoaded', { 
    timestamp: Date.now(),
    version: '2.0.0',
    features: [
        'advanced-color-system', 'event-deduplication', 'analytics-fixes', 
        'enhanced-ui', 'prediction-merging', 'debug-tools'
    ]
});
