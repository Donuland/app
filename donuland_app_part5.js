/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 5A
   Analytics & Statistics - Období filtr + Finanční výpočty + KPI Dashboard
   ======================================== */

console.log('🍩 Donuland Part 5A loading...');

// ========================================
// KONTROLA INICIALIZACE
// ========================================

if (typeof window.analyticsPart5ALoaded === 'undefined') {
    window.analyticsPart5ALoaded = true;
} else {
    console.log('⚠️ Part 5A already loaded, skipping...');
}

// ========================================
// ANALYTICS KONFIGURACE
// ========================================

const ANALYTICS_CONFIG = {
    // Business parametry (kompatibilní s CONFIG z Part 1)
    PRODUCTION_COST: 32,         // Kč za donut (výroba)
    HOURLY_WAGE: 150,            // Kč/hodina (mzda)
    WORK_HOURS: 10,              // hodin na akci
    TRANSPORT_COST_PER_KM: 15,   // Kč/km (doprava)
    FRANCHISE_PRICE: 52,         // Franšízová nákupní cena
    
    // Business modely (mapping ze Sheets)
    BUSINESS_MODELS: {
        'majitel': 'majitel',
        'zaměstnanec': 'zaměstnanec', 
        'franšízant': 'franšízant',
        'franchisee': 'franšízant',      // fallback
        'employee': 'zaměstnanec',       // fallback
        'owner': 'majitel'               // fallback
    },
    
    // Období presets
    PERIOD_PRESETS: {
        'week': 7,
        'month': 30,
        'quarter': 90,
        'year': 365
    },
    
    // Cache nastavení
    CACHE_TIME: 5 * 60 * 1000  // 5 minut
};

// ========================================
// GLOBÁLNÍ STAV ANALYTICS
// ========================================

const analyticsState = {
    // Období filtr
    periodFrom: null,
    periodTo: null,
    currentPreset: null,
    
    // Data
    filteredData: [],
    kpiMetrics: null,
    
    // Loading states
    isLoading: false,
    isCalculating: false,
    
    // Cache
    lastCalculation: null,
    lastDataHash: null,
    
    // UI state
    isInitialized: false,
    currentView: 'dashboard'
};

// ========================================
// FINANČNÍ VÝPOČTOVÉ FUNKCE
// ========================================

// Hlavní funkce pro výpočet finančních metrik akce
function calculateFinancials(record) {
    console.log('💰 Calculating financials for:', record.eventName || 'Unknown Event');
    
    try {
        // Základní data
        const sales = parseInt(record.sales) || 0;
        const price = parseFloat(record.price) || 110; // fallback na 110 Kč
        const employees = parseInt(record.employees) || 2;
        const businessModel = normalizeBusinessModel(record.businessModel);
        
        // Základní obrat
        const revenue = sales * price;
        
        if (sales === 0 || revenue === 0) {
            return createEmptyFinancials();
        }
        
        // Výpočet nákladů podle business modelu
        const costs = calculateCostsByBusinessModel(record, sales, revenue, employees, businessModel);
        
        // Celkové náklady
        const totalCosts = costs.production + costs.labor + costs.transport + costs.rent + costs.other;
        
        // Zisk a metriky
        const profit = revenue - totalCosts;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        const roi = totalCosts > 0 ? (profit / totalCosts) * 100 : 0;
        
        const result = {
            // Základní údaje
            sales: sales,
            price: price,
            revenue: revenue,
            businessModel: businessModel,
            
            // Rozpis nákladů
            costs: {
                production: costs.production,
                labor: costs.labor,
                transport: costs.transport,
                rent: costs.rent,
                other: costs.other,
                total: totalCosts
            },
            
            // Klíčové metriky
            profit: profit,
            margin: margin,
            roi: roi,
            
            // Metadata
            isValid: true,
            calculatedAt: new Date().toISOString(),
            employeeCount: employees
        };
        
        console.log('✅ Financial calculation completed:', {
            revenue: formatCurrency(revenue),
            totalCosts: formatCurrency(totalCosts),
            profit: formatCurrency(profit),
            margin: `${margin.toFixed(1)}%`
        });
        
        return result;
        
    } catch (error) {
        console.error('❌ Error calculating financials:', error);
        return createEmptyFinancials();
    }
}

// Výpočet nákladů podle business modelu
function calculateCostsByBusinessModel(record, sales, revenue, employees, businessModel) {
    // Společné náklady
    const transportCost = calculateTransportCost(record);
    const rentCost = parseRentCost(record.rent, revenue);
    const otherCost = parseFloat(record.otherCosts) || 0;
    
    let productionCost = 0;
    let laborCost = 0;
    
    switch (businessModel) {
        case 'majitel':
            // Majitel: výrobní náklady + mzdy brigádníků (bez vlastní mzdy)
            productionCost = sales * ANALYTICS_CONFIG.PRODUCTION_COST;
            laborCost = employees * ANALYTICS_CONFIG.WORK_HOURS * ANALYTICS_CONFIG.HOURLY_WAGE;
            break;
            
        case 'zaměstnanec':
            // Zaměstnanec: výrobní náklady + mzdy + 5% bonus z obratu
            productionCost = sales * ANALYTICS_CONFIG.PRODUCTION_COST;
            const baseLaborCost = (employees + 1) * ANALYTICS_CONFIG.WORK_HOURS * ANALYTICS_CONFIG.HOURLY_WAGE; // +1 za zaměstnance
            const bonusFromRevenue = revenue * 0.05; // 5% z obratu
            laborCost = baseLaborCost + bonusFromRevenue;
            break;
            
        case 'franšízant':
            // Franšízant: vyšší nákupní cena, bez mzdových nákladů
            productionCost = sales * ANALYTICS_CONFIG.FRANCHISE_PRICE; // 52 Kč místo 32 Kč
            laborCost = 0; // Žádné mzdy
            break;
            
        default:
            console.warn('⚠️ Unknown business model, using "majitel" as fallback:', businessModel);
            productionCost = sales * ANALYTICS_CONFIG.PRODUCTION_COST;
            laborCost = employees * ANALYTICS_CONFIG.WORK_HOURS * ANALYTICS_CONFIG.HOURLY_WAGE;
    }
    
    return {
        production: productionCost,
        labor: laborCost,
        transport: transportCost,
        rent: rentCost,
        other: otherCost
    };
}

// Normalizace business modelu
function normalizeBusinessModel(businessModelStr) {
    if (!businessModelStr) return 'majitel';
    
    const normalized = businessModelStr.toLowerCase().trim();
    return ANALYTICS_CONFIG.BUSINESS_MODELS[normalized] || 'majitel';
}

// Parsing nákladů na nájem
function parseRentCost(rentString, revenue) {
    if (!rentString) return 0;
    
    const rentStr = rentString.toString().toLowerCase().trim();
    
    // Zdarma
    if (rentStr === 'zdarma' || rentStr === '0' || rentStr === '') {
        return 0;
    }
    
    try {
        // Kombinace: "2000 + 10%" nebo "2000+10%"
        const mixedMatch = rentStr.match(/(\d+)\s*\+\s*(\d+)%/);
        if (mixedMatch) {
            const fixedPart = parseFloat(mixedMatch[1]);
            const percentagePart = (parseFloat(mixedMatch[2]) / 100) * revenue;
            console.log(`💰 Mixed rent: ${fixedPart} + ${mixedMatch[2]}% of ${formatCurrency(revenue)} = ${formatCurrency(fixedPart + percentagePart)}`);
            return fixedPart + percentagePart;
        }
        
        // Procenta: "15%"
        const percentageMatch = rentStr.match(/(\d+)%/);
        if (percentageMatch) {
            const percentage = parseFloat(percentageMatch[1]) / 100;
            const result = revenue * percentage;
            console.log(`💰 Percentage rent: ${percentageMatch[1]}% of ${formatCurrency(revenue)} = ${formatCurrency(result)}`);
            return result;
        }
        
        // Fixní částka: "5000"
        const fixedAmount = parseFloat(rentStr);
        if (!isNaN(fixedAmount)) {
            console.log(`💰 Fixed rent: ${formatCurrency(fixedAmount)}`);
            return fixedAmount;
        }
        
    } catch (error) {
        console.warn('⚠️ Error parsing rent cost:', rentString, error);
    }
    
    console.warn('⚠️ Could not parse rent cost, using 0:', rentString);
    return 0;
}

// Výpočet dopravních nákladů
function calculateTransportCost(record) {
    // Pokud je transport už vypočítaný ve sloupci U, použít ho
    if (record.transport && !isNaN(record.transport)) {
        const transportCost = parseFloat(record.transport);
        if (transportCost > 0) {
            console.log(`🚗 Transport from sheet: ${formatCurrency(transportCost)}`);
            return transportCost;
        }
    }
    
    // Jinak spočítat ze vzdálenosti
    const distance = extractDistanceNumber(record.distance || '0 km');
    const transportCost = distance * ANALYTICS_CONFIG.TRANSPORT_COST_PER_KM * 2; // Tam a zpět
    
    console.log(`🚗 Calculated transport: ${distance}km × ${ANALYTICS_CONFIG.TRANSPORT_COST_PER_KM} × 2 = ${formatCurrency(transportCost)}`);
    return transportCost;
}

// Vytvoření prázdných finančních dat pro chybové stavy
function createEmptyFinancials() {
    return {
        sales: 0,
        price: 0,
        revenue: 0,
        businessModel: 'majitel',
        costs: {
            production: 0,
            labor: 0,
            transport: 0,
            rent: 0,
            other: 0,
            total: 0
        },
        profit: 0,
        margin: 0,
        roi: 0,
        isValid: false,
        calculatedAt: new Date().toISOString(),
        employeeCount: 0
    };
}

// ========================================
// OBDOBÍ FILTR FUNKCE
// ========================================

// Inicializace období filtru
function initializePeriodFilter() {
    console.log('📅 Initializing period filter...');
    
    // Nastavit výchozí období (poslední 3 měsíce)
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    analyticsState.periodFrom = threeMonthsAgo;
    analyticsState.periodTo = today;
    analyticsState.currentPreset = null; // custom range
    
    // Aktualizovat UI inputy
    updatePeriodInputs();
    
    console.log('✅ Period filter initialized:', {
        from: analyticsState.periodFrom.toLocaleDateString('cs-CZ'),
        to: analyticsState.periodTo.toLocaleDateString('cs-CZ')
    });
}

// Nastavení přednastavených období
function setPeriodPreset(preset) {
    console.log(`📅 Setting period preset: ${preset}`);
    
    const today = new Date();
    let fromDate = new Date();
    
    switch (preset) {
        case 'week':
            fromDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            fromDate.setMonth(today.getMonth() - 1);
            break;
        case 'quarter':
            fromDate.setMonth(today.getMonth() - 3);
            break;
        case 'year':
            fromDate.setFullYear(today.getFullYear() - 1);
            break;
        case 'all':
            fromDate = new Date('2020-01-01'); // Dostatečně daleko v minulosti
            break;
        default:
            console.warn('⚠️ Unknown preset:', preset);
            return;
    }
    
    analyticsState.periodFrom = fromDate;
    analyticsState.periodTo = new Date(today); // Copy
    analyticsState.currentPreset = preset;
    
    updatePeriodInputs();
    filterDataAndRecalculate();
    
    // Vizuální feedback
    updatePresetButtons(preset);
    
    showNotification(`📅 Období nastaveno: ${preset === 'all' ? 'Všechna data' : formatPeriodLabel(preset)}`, 'info', 2000);
}

// Nastavení vlastního období z date inputů
function setCustomPeriod() {
    const fromInput = document.getElementById('analyticsDateFrom');
    const toInput = document.getElementById('analyticsDateTo');
    
    if (!fromInput || !toInput) {
        console.warn('⚠️ Period inputs not found');
        return;
    }
    
    if (!fromInput.value || !toInput.value) {
        console.warn('⚠️ Both dates must be selected');
        showNotification('⚠️ Vyberte oba datumy', 'warning', 3000);
        return;
    }
    
    const fromDate = new Date(fromInput.value + 'T00:00:00');
    const toDate = new Date(toInput.value + 'T23:59:59');
    
    if (fromDate > toDate) {
        console.warn('⚠️ From date is after to date');
        showNotification('⚠️ Datum "od" musí být před datem "do"', 'warning', 3000);
        return;
    }
    
    analyticsState.periodFrom = fromDate;
    analyticsState.periodTo = toDate;
    analyticsState.currentPreset = null; // custom range
    
    filterDataAndRecalculate();
    updatePresetButtons(null); // Deselect all presets
    
    const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
    showNotification(`📅 Vlastní období: ${daysDiff} dní`, 'info', 2000);
    
    console.log('📅 Custom period set:', {
        from: fromDate.toLocaleDateString('cs-CZ'),
        to: toDate.toLocaleDateString('cs-CZ'),
        days: daysDiff
    });
}

// Aktualizace date inputů v UI
function updatePeriodInputs() {
    const fromInput = document.getElementById('analyticsDateFrom');
    const toInput = document.getElementById('analyticsDateTo');
    
    if (fromInput && analyticsState.periodFrom) {
        fromInput.value = formatDateKey(analyticsState.periodFrom);
    }
    if (toInput && analyticsState.periodTo) {
        toInput.value = formatDateKey(analyticsState.periodTo);
    }
}

// Aktualizace preset tlačítek
function updatePresetButtons(activePreset) {
    document.querySelectorAll('.period-preset-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.preset === activePreset) {
            btn.classList.add('active');
        }
    });
}

// Filtrování dat podle období
function filterDataByPeriod() {
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        console.log('📊 No historical data to filter');
        analyticsState.filteredData = [];
        return [];
    }
    
    if (!analyticsState.periodFrom || !analyticsState.periodTo) {
        console.log('📅 No period set, using all data');
        analyticsState.filteredData = [...globalState.historicalData];
        return analyticsState.filteredData;
    }
    
    console.log(`📅 Filtering data by period: ${analyticsState.periodFrom.toLocaleDateString('cs-CZ')} - ${analyticsState.periodTo.toLocaleDateString('cs-CZ')}`);
    
    const filtered = globalState.historicalData.filter(record => {
        // Použít dateTo pro filtrování (akce je dokončená k tomuto datu)
        const eventDate = parseDate(record.dateTo || record.dateFrom);
        if (!eventDate) return false;
        
        // Pouze dokončené akce s reálnými daty
        if (!record.sales || record.sales <= 0) return false;
        
        return eventDate >= analyticsState.periodFrom && eventDate <= analyticsState.periodTo;
    });
    
    analyticsState.filteredData = filtered;
    
    console.log(`📊 Filtered ${filtered.length} records from ${globalState.historicalData.length} total`);
    return filtered;
}

// ========================================
// KPI VÝPOČTY A METRIKY
// ========================================

// Výpočet hlavních KPI metrik
function calculateKPIMetrics(data = null) {
    console.log('📊 Calculating KPI metrics...');
    
    const records = data || analyticsState.filteredData;
    
    if (!records || records.length === 0) {
        console.log('📊 No data for KPI calculation');
        return createEmptyKPIMetrics();
    }
    
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalProfit = 0;
    let totalSales = 0;
    let validRecords = 0;
    
    const businessModelStats = {};
    const categoryStats = {};
    const cityStats = {};
    
    records.forEach(record => {
        const financials = calculateFinancials(record);
        
        if (!financials.isValid) return;
        
        validRecords++;
        totalRevenue += financials.revenue;
        totalCosts += financials.costs.total;
        totalProfit += financials.profit;
        totalSales += financials.sales;
        
        // Statistiky podle business modelu
        const bm = financials.businessModel;
        if (!businessModelStats[bm]) {
            businessModelStats[bm] = { count: 0, revenue: 0, profit: 0, costs: 0 };
        }
        businessModelStats[bm].count++;
        businessModelStats[bm].revenue += financials.revenue;
        businessModelStats[bm].profit += financials.profit;
        businessModelStats[bm].costs += financials.costs.total;
        
        // Statistiky podle kategorie
        const category = record.category || 'ostatní';
        if (!categoryStats[category]) {
            categoryStats[category] = { count: 0, revenue: 0, profit: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].revenue += financials.revenue;
        categoryStats[category].profit += financials.profit;
        
        // Statistiky podle města
        const city = record.city || 'Neznámé';
        if (!cityStats[city]) {
            cityStats[city] = { count: 0, revenue: 0, profit: 0, sales: 0 };
        }
        cityStats[city].count++;
        cityStats[city].revenue += financials.revenue;
        cityStats[city].profit += financials.profit;
        cityStats[city].sales += financials.sales;
    });
    
    // Výpočet průměrů a poměrů
    const avgSales = validRecords > 0 ? totalSales / validRecords : 0;
    const avgRevenue = validRecords > 0 ? totalRevenue / validRecords : 0;
    const avgProfit = validRecords > 0 ? totalProfit / validRecords : 0;
    const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const totalROI = totalCosts > 0 ? (totalProfit / totalCosts) * 100 : 0;
    
    const metrics = {
        // Základní metriky
        eventsCount: validRecords,
        totalSales: totalSales,
        totalRevenue: totalRevenue,
        totalCosts: totalCosts,
        totalProfit: totalProfit,
        
        // Průměry
        avgSales: avgSales,
        avgRevenue: avgRevenue,
        avgProfit: avgProfit,
        
        // Poměry
        totalMargin: totalMargin,
        totalROI: totalROI,
        
        // Detailní breakdown
        businessModelStats: businessModelStats,
        categoryStats: categoryStats,
        cityStats: cityStats,
        
        // Metadata
        calculatedAt: new Date().toISOString(),
        periodFrom: analyticsState.periodFrom,
        periodTo: analyticsState.periodTo,
        isValid: true
    };
    
    analyticsState.kpiMetrics = metrics;
    
    console.log('✅ KPI metrics calculated:', {
        events: validRecords,
        totalRevenue: formatCurrency(totalRevenue),
        totalProfit: formatCurrency(totalProfit),
        avgProfit: formatCurrency(avgProfit),
        margin: `${totalMargin.toFixed(1)}%`
    });
    
    return metrics;
}

// Vytvoření prázdných KPI metrik
function createEmptyKPIMetrics() {
    return {
        eventsCount: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalCosts: 0,
        totalProfit: 0,
        avgSales: 0,
        avgRevenue: 0,
        avgProfit: 0,
        totalMargin: 0,
        totalROI: 0,
        businessModelStats: {},
        categoryStats: {},
        cityStats: {},
        calculatedAt: new Date().toISOString(),
        periodFrom: null,
        periodTo: null,
        isValid: false
    };
}

// ========================================
// UI KOMPONENTY A ZOBRAZENÍ
// ========================================

// Vytvoření hlavního UI pro Analytics sekci
function createAnalyticsUI() {
    console.log('🎨 Creating Analytics UI...');
    
    const analyticsSection = document.getElementById('analytics');
    if (!analyticsSection) {
        console.error('❌ Analytics section not found');
        return;
    }
    
    // Zkontrolovat, zda už není UI vytvořené
    if (analyticsSection.querySelector('.analytics-toolbar')) {
        console.log('🎨 Analytics UI already exists');
        return;
    }
    
    // Vymazat placeholder obsah
    const existingContent = analyticsSection.querySelector('.section-header');
    if (existingContent && existingContent.nextElementSibling) {
        // Zachovat section-header, odstranit zbytek
        let nextEl = existingContent.nextElementSibling;
        while (nextEl) {
            const toRemove = nextEl;
            nextEl = nextEl.nextElementSibling;
            toRemove.remove();
        }
    }
    
    // Vytvořit nové UI
    const analyticsHTML = `
        <!-- Analytics Toolbar -->
        <div class="card analytics-toolbar">
            <h3>⚙️ Nastavení analýz</h3>
            <div class="toolbar-content">
                <!-- Období filtr -->
                <div class="period-filter">
                    <div class="period-inputs">
                        <div class="form-group">
                            <label>Datum od:</label>
                            <input type="date" id="analyticsDateFrom" onchange="setCustomPeriod()">
                        </div>
                        <div class="form-group">
                            <label>Datum do:</label>
                            <input type="date" id="analyticsDateTo" onchange="setCustomPeriod()">
                        </div>
                    </div>
                    
                    <div class="period-presets">
                        <button class="btn period-preset-btn" data-preset="week" onclick="setPeriodPreset('week')">
                            📅 Tento týden
                        </button>
                        <button class="btn period-preset-btn" data-preset="month" onclick="setPeriodPreset('month')">
                            📅 Měsíc
                        </button>
                        <button class="btn period-preset-btn active" data-preset="quarter" onclick="setPeriodPreset('quarter')">
                            📅 Čtvrtletí
                        </button>
                        <button class="btn period-preset-btn" data-preset="year" onclick="setPeriodPreset('year')">
                            📅 Rok
                        </button>
                        <button class="btn period-preset-btn" data-preset="all" onclick="setPeriodPreset('all')">
                            📅 Vše
                        </button>
                    </div>
                </div>
                
                <!-- Akce tlačítka -->
                <div class="analytics-actions">
                    <button class="btn btn-refresh" onclick="refreshAnalytics()">
                        🔄 Přepočítat
                    </button>
                    <button class="btn btn-export" onclick="exportAnalytics()">
                        📄 Export
                    </button>
                </div>
            </div>
        </div>
        
        <!-- KPI Dashboard -->
        <div class="card kpi-dashboard">
            <h3>📊 Klíčové metriky období</h3>
            <div id="kpiMetrics" class="kpi-grid">
                <!-- KPI karty se vygenerují dynamicky -->
            </div>
        </div>
        
        <!-- Loading/Empty States -->
        <div id="analyticsLoading" class="analytics-loading" style="display: none;">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Počítám analýzy...</p>
            </div>
        </div>
        
        <div id="analyticsEmpty" class="analytics-empty" style="display: none;">
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h4>Žádná data pro vybrané období</h4>
                <p>Zkuste změnit datum nebo načíst více historických dat</p>
                <button class="btn" onclick="setPeriodPreset('all')">📅 Zobrazit všechna data</button>
            </div>
        </div>
    `;
    
    analyticsSection.insertAdjacentHTML('beforeend', analyticsHTML);
    
    console.log('✅ Analytics UI created');
}

// Zobrazení KPI dashboardu
function displayKPIDashboard(metrics) {
    console.log('📊 Displaying KPI dashboard...');
    
    const kpiContainer = document.getElementById('kpiMetrics');
    if (!kpiContainer) {
        console.error('❌ KPI container not found');
        return;
    }
    
    if (!metrics || !metrics.isValid) {
        kpiContainer.innerHTML = '<div class="kpi-error">❌ Nelze vypočítat metriky</div>';
        return;
    }
    
    // Generování KPI karet
    const kpiCards = [
        {
            title: 'Počet akcí',
            value: formatNumber(metrics.eventsCount),
            icon: '🎯',
            color: 'primary',
            subtitle: 'dokončených'
        },
        {
            title: 'Celkový obrat',
            value: formatCurrency(metrics.totalRevenue),
            icon: '💰',
            color: 'success',
            subtitle: `avg ${formatCurrency(metrics.avgRevenue)}`
        },
        {
            title: 'Celkový zisk',
            value: formatCurrency(metrics.totalProfit),
            icon: metrics.totalProfit >= 0 ? '✅' : '❌',
            color: metrics.totalProfit >= 0 ? 'success' : 'error',
            subtitle: `avg ${formatCurrency(metrics.avgProfit)}`
        },
        {
            title: 'Celkové náklady',
            value: formatCurrency(metrics.totalCosts),
            icon: '💸',
            color: 'warning',
            subtitle: `avg ${formatCurrency(metrics.totalCosts / Math.max(metrics.eventsCount, 1))}`
        },
        {
            title: 'Průměrná marže',
            value: `${metrics.totalMargin.toFixed(1)}%`,
            icon: '📊',
            color: metrics.totalMargin >= 30 ? 'success' : metrics.totalMargin >= 15 ? 'warning' : 'error',
            subtitle: 'zisk/obrat'
        },
        {
            title: 'ROI',
            value: `${metrics.totalROI.toFixed(1)}%`,
            icon: '📈',
            color: metrics.totalROI >= 50 ? 'success' : metrics.totalROI >= 25 ? 'warning' : 'error',
            subtitle: 'návratnost'
        }
    ];
    
    const kpiHTML = kpiCards.map(card => `
        <div class="kpi-card ${card.color}">
            <div class="kpi-icon">${card.icon}</div>
            <div class="kpi-content">
                <div class="kpi-value">${card.value}</div>
                <div class="kpi-title">${card.title}</div>
                <div class="kpi-subtitle">${card.subtitle}</div>
            </div>
        </div>
    `).join('');
    
    kpiContainer.innerHTML = kpiHTML;
    
    // Zobrazit/skrýt loading a empty states
    hideElement('analyticsLoading');
    hideElement('analyticsEmpty');
    
    console.log('✅ KPI dashboard displayed');
}

// Hlavní funkce pro aktualizaci analytics
function updateAnalyticsDisplay() {
    console.log('🔄 Updating analytics display...');
    
    // Zobrazit loading
    showElement('analyticsLoading');
    hideElement('analyticsEmpty');
    
    try {
        // Filtrovat data podle období
        const filteredData = filterDataByPeriod();
        
        if (filteredData.length === 0) {
            hideElement('analyticsLoading');
            showElement('analyticsEmpty');
            
            // Vymazat KPI dashboard
            const kpiContainer = document.getElementById('kpiMetrics');
            if (kpiContainer) {
                kpiContainer.innerHTML = '<div class="kpi-empty">📊 Žádná data pro vybrané období</div>';
            }
            
            console.log('📊 No data for selected period');
            return;
        }
        
        // Vypočítat KPI metriky
        const metrics = calculateKPIMetrics(filteredData);
        
        // Zobrazit KPI dashboard
        displayKPIDashboard(metrics);
        
        // Skrýt loading
        hideElement('analyticsLoading');
        
        console.log('✅ Analytics display updated');
        
        // Emit event pro další části
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('analyticsUpdated', {
                metrics: metrics,
                filteredData: filteredData,
                timestamp: Date.now()
            });
        }
        
    } catch (error) {
        console.error('❌ Error updating analytics display:', error);
        hideElement('analyticsLoading');
        showNotification('❌ Chyba při výpočtu analýz', 'error');
    }
}

// Funkce pro refresh analytics
function refreshAnalytics() {
    console.log('🔄 Refreshing analytics...');
    analyticsState.lastCalculation = null; // Vymaž cache
    updateAnalyticsDisplay();
    showNotification('🔄 Analýzy přepočítány', 'info', 2000);
}

// Export analytics (placeholder pro Part 5B)
function exportAnalytics() {
    console.log('📄 Export analytics requested...');
    showNotification('📄 Export bude implementován v Part 5B', 'info', 3000);
}

// ========================================
// HELPER FUNKCE
// ========================================

// Kombinace filtrování a přepočtu
function filterDataAndRecalculate() {
    console.log('🔄 Filter data and recalculate...');
    updateAnalyticsDisplay();
}

// Formátování label pro období
function formatPeriodLabel(preset) {
    const labels = {
        'week': 'Poslední týden',
        'month': 'Poslední měsíc', 
        'quarter': 'Poslední čtvrtletí',
        'year': 'Poslední rok',
        'all': 'Všechna data'
    };
    return labels[preset] || preset;
}

// Extrakce čísla vzdálenosti z textu (kompatibilní s Part 2)
function extractDistanceNumber(distanceText) {
    if (!distanceText) return 0;
    const match = distanceText.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Zobrazení/skrytí elementů
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'block';
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
}

// Helper funkce pro formátování (kompatibilní s Part 1)
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

if (typeof formatDateKey === 'undefined') {
    function formatDateKey(date) {
        if (!date) return '';
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
    }
}

if (typeof parseDate === 'undefined') {
    function parseDate(dateStr) {
        if (!dateStr) return null;
        if (dateStr instanceof Date) return dateStr;
        
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return new Date(dateStr + 'T12:00:00');
        }
        
        if (dateStr.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
            const [day, month, year] = dateStr.split('.');
            return new Date(year, month - 1, day, 12, 0, 0);
        }
        
        return new Date(dateStr);
    }
}

if (typeof showNotification === 'undefined') {
    function showNotification(message, type = 'info', duration = 3000) {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// ========================================
// INICIALIZACE A EVENT LISTENERS
// ========================================

// Hlavní inicializační funkce
function initializeAnalytics() {
    console.log('🔧 Initializing Analytics Part 5A...');
    
    if (analyticsState.isInitialized) {
        console.log('⚠️ Analytics already initialized');
        return;
    }
    
    try {
        // 1. Vytvořit UI
        createAnalyticsUI();
        
        // 2. Inicializovat období filtr
        initializePeriodFilter();
        
        // 3. Načíst a zobrazit data
        if (globalState && globalState.historicalData && globalState.historicalData.length > 0) {
            console.log(`📊 Found ${globalState.historicalData.length} historical records`);
            updateAnalyticsDisplay();
        } else {
            console.log('📊 No historical data yet, showing empty state');
            showElement('analyticsEmpty');
        }
        
        analyticsState.isInitialized = true;
        
        console.log('✅ Analytics Part 5A initialized successfully');
        
        // Emit completion event
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('analyticsInitialized', {
                timestamp: Date.now(),
                version: '5A-1.0.0'
            });
        }
        
    } catch (error) {
        console.error('❌ Error initializing analytics:', error);
        showNotification('❌ Chyba při inicializaci analýz', 'error');
    }
}

// Event listeners pro kompatibilitu s ostatními částmi
if (typeof eventBus !== 'undefined') {
    
    // Po načtení historických dat
    eventBus.on('dataLoaded', (data) => {
        console.log('📊 Historical data loaded, updating analytics');
        setTimeout(() => {
            if (analyticsState.isInitialized) {
                updateAnalyticsDisplay();
            }
        }, 500);
    });
    
    // Po požadavku na analytics sekci
    eventBus.on('analyticsRequested', () => {
        console.log('📊 Analytics section requested');
        if (!analyticsState.isInitialized) {
            setTimeout(initializeAnalytics, 100);
        } else {
            // Refresh při přepnutí na sekci
            updateAnalyticsDisplay();
        }
    });
    
    // Po změně sekce
    eventBus.on('sectionChanged', (data) => {
        if (data.section === 'analytics') {
            console.log('📊 Switched to analytics section');
            setTimeout(() => {
                if (!analyticsState.isInitialized) {
                    initializeAnalytics();
                } else {
                    updateAnalyticsDisplay();
                }
            }, 200);
        }
    });
    
    // Po uložení predikce
    eventBus.on('predictionSaved', () => {
        console.log('📊 Prediction saved, refreshing analytics');
        setTimeout(() => {
            if (analyticsState.isInitialized) {
                analyticsState.lastCalculation = null; // Vymaž cache
                updateAnalyticsDisplay();
            }
        }, 1000);
    });
}

// DOM ready listener
document.addEventListener('DOMContentLoaded', function() {
    // Malé zpoždění pro načtení ostatních komponent
    setTimeout(() => {
        // Inicializovat pouze pokud jsme v analytics sekci nebo máme data
        if (typeof globalState !== 'undefined' && 
            (globalState.currentSection === 'analytics' || 
             (globalState.historicalData && globalState.historicalData.length > 0))) {
            console.log('📊 DOM ready - initializing analytics');
            initializeAnalytics();
        }
    }, 2000);
});

// ========================================
// GLOBÁLNÍ EXPORT PRO HTML
// ========================================

// Export funkcí pro HTML onclick handlers
if (typeof window !== 'undefined') {
    window.setPeriodPreset = setPeriodPreset;
    window.setCustomPeriod = setCustomPeriod;
    window.refreshAnalytics = refreshAnalytics;
    window.exportAnalytics = exportAnalytics;
    window.initializeAnalytics = initializeAnalytics;
    
    // Debug objekt pro testing
    window.analyticsDebug = {
        state: analyticsState,
        config: ANALYTICS_CONFIG,
        
        // Test funkce
        testFinancialCalculation: (record) => {
            return calculateFinancials(record);
        },
        
        testRentParsing: (rentString, revenue) => {
            return parseRentCost(rentString, revenue);
        },
        
        getCurrentMetrics: () => {
            return analyticsState.kpiMetrics;
        },
        
        forceRecalculation: () => {
            analyticsState.lastCalculation = null;
            updateAnalyticsDisplay();
        },
        
        // Utility
        formatters: {
            currency: formatCurrency,
            number: formatNumber,
            date: formatDateKey
        }
    };
}

// ========================================
// CSS INJEKCE PRO PART 5A
// ========================================

// Přidání stylů pro Analytics UI
function injectAnalyticsCSS() {
    if (document.getElementById('analytics-part5a-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'analytics-part5a-styles';
    style.textContent = `
        /* Analytics Toolbar */
        .analytics-toolbar .toolbar-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .period-filter {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .period-inputs {
            display: flex;
            gap: 20px;
            align-items: end;
        }
        
        .period-inputs .form-group {
            margin-bottom: 0;
            min-width: 150px;
        }
        
        .period-presets {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .period-preset-btn {
            padding: 8px 16px;
            font-size: 0.875rem;
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        
        .period-preset-btn.active {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .analytics-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        /* KPI Dashboard */
        .kpi-dashboard {
            background: linear-gradient(135deg, #f8f9fa, #e3f2fd);
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .kpi-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border-left: 4px solid var(--primary-color);
        }
        
        .kpi-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        
        .kpi-card.success {
            border-left-color: var(--success-color);
        }
        
        .kpi-card.error {
            border-left-color: var(--error-color);
        }
        
        .kpi-card.warning {
            border-left-color: var(--warning-color);
        }
        
        .kpi-icon {
            font-size: 2rem;
            flex-shrink: 0;
        }
        
        .kpi-content {
            flex: 1;
        }
        
        .kpi-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--gray-800);
            margin-bottom: 4px;
            line-height: 1;
        }
        
        .kpi-title {
            font-weight: 600;
            color: var(--gray-700);
            margin-bottom: 2px;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .kpi-subtitle {
            font-size: 0.75rem;
            color: var(--gray-500);
            line-height: 1.2;
        }
        
        /* Loading & Empty States */
        .analytics-loading,
        .analytics-empty {
            text-align: center;
            padding: 60px 20px;
            color: var(--gray-500);
        }
        
        .analytics-loading .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid var(--gray-200);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        .empty-state {
            max-width: 400px;
            margin: 0 auto;
        }
        
        .empty-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.7;
        }
        
        .empty-state h4 {
            font-size: 1.25rem;
            margin-bottom: 10px;
            color: var(--gray-700);
        }
        
        .empty-state p {
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .kpi-empty,
        .kpi-error {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: var(--gray-500);
            font-style: italic;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .period-inputs {
                flex-direction: column;
                gap: 15px;
            }
            
            .period-presets {
                flex-direction: column;
            }
            
            .period-preset-btn {
                width: 100%;
            }
            
            .analytics-actions {
                flex-direction: column;
            }
            
            .kpi-grid {
                grid-template-columns: 1fr;
            }
            
            .kpi-card {
                padding: 15px;
            }
            
            .kpi-value {
                font-size: 1.25rem;
            }
        }
        
        @media (max-width: 480px) {
            .analytics-toolbar .toolbar-content {
                gap: 15px;
            }
            
            .kpi-card {
                flex-direction: column;
                text-align: center;
                gap: 10px;
            }
            
            .kpi-icon {
                font-size: 1.5rem;
            }
            
            .kpi-value {
                font-size: 1.1rem;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Analytics CSS injected');
}

// Inject CSS při načtení
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(injectAnalyticsCSS, 100);
});

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 5A loaded successfully');
console.log('📊 Features: Period filter, Financial calculations, KPI dashboard');
console.log('💰 Business models: Majitel, Zaměstnanec, Franšízant');
console.log('📅 Period presets: Week, Month, Quarter, Year, All');
console.log('🧮 Financial parsing: Rent (fixed/percentage/mixed), Transport, Other costs');
console.log('🔧 Debug: window.analyticsDebug available');

// Emit completion event
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part5ALoaded', { 
        timestamp: Date.now(),
        version: '5A-1.0.0',
        features: [
            'period-filter-with-presets',
            'financial-calculations-by-business-model',
            'rent-parsing-fixed-percentage-mixed',
            'transport-cost-calculation',
            'kpi-dashboard-6-metrics',
            'responsive-analytics-ui',
            'empty-loading-states',
            'event-bus-integration'
        ]
    });
}
/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 5B
   Analytics & Statistics - Detailní tabulka + Business model porovnání + Export
   ======================================== */

console.log('🍩 Donuland Part 5B loading...');

// ========================================
// KONTROLA INICIALIZACE
// ========================================

if (typeof window.analyticsPart5BLoaded === 'undefined') {
    window.analyticsPart5BLoaded = true;
} else {
    console.log('⚠️ Part 5B already loaded, skipping...');
}

// ========================================
// ROZŠÍŘENÍ ANALYTICS STATE
// ========================================

// Rozšířit existující analyticsState z Part 5A
if (typeof analyticsState !== 'undefined') {
    Object.assign(analyticsState, {
        // Tabulka state
        tableData: [],
        tableSortBy: 'dateTo',
        tableSortOrder: 'desc', // desc = nejnovější nahoře
        tableBusinessFilter: 'all',
        
        // Business model porovnání
        businessModelComparison: null,
        
        // Export state
        lastExportData: null,
        isExporting: false
    });
} else {
    console.error('❌ analyticsState from Part 5A not found!');
}

// ========================================
// TABULKA FUNKCIONALITA
// ========================================

// Příprava dat pro detailní tabulku
function prepareTableData(filteredData = null) {
    console.log('📋 Preparing table data...');
    
    const data = filteredData || analyticsState.filteredData;
    
    if (!data || data.length === 0) {
        analyticsState.tableData = [];
        return [];
    }
    
    const tableData = data.map(record => {
        const financials = calculateFinancials(record);
        
        return {
            // Identifikátory
            id: record.rowIndex || Math.random().toString(36),
            originalRecord: record,
            
            // Základní údaje
            eventName: record.eventName || 'Neznámá akce',
            city: record.city || 'Neznámé město',
            category: record.category || 'ostatní',
            dateFrom: parseDate(record.dateFrom),
            dateTo: parseDate(record.dateTo),
            
            // Business údaje
            businessModel: financials.businessModel,
            visitors: record.visitors || 0,
            sales: financials.sales,
            price: financials.price,
            
            // Finanční údaje
            revenue: financials.revenue,
            totalCosts: financials.costs.total,
            profit: financials.profit,
            margin: financials.margin,
            roi: financials.roi,
            
            // Rozpis nákladů
            productionCost: financials.costs.production,
            laborCost: financials.costs.labor,
            transportCost: financials.costs.transport,
            rentCost: financials.costs.rent,
            otherCosts: financials.costs.other,
            
            // Metadata
            isValid: financials.isValid,
            calculatedAt: financials.calculatedAt
        };
    }).filter(row => row.isValid);
    
    analyticsState.tableData = tableData;
    
    console.log(`📋 Table data prepared: ${tableData.length} valid rows`);
    return tableData;
}

// Řazení tabulky podle sloupce
function sortTable(sortBy, forceOrder = null) {
    console.log(`📋 Sorting table by: ${sortBy}`);
    
    if (!analyticsState.tableData || analyticsState.tableData.length === 0) {
        console.log('📋 No table data to sort');
        return;
    }
    
    // Určit směr řazení
    let sortOrder = forceOrder;
    if (!sortOrder) {
        // Pokud klikneme na stejný sloupec, změnit směr
        if (analyticsState.tableSortBy === sortBy) {
            sortOrder = analyticsState.tableSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            // Pro nový sloupec, výchozí směr podle typu
            sortOrder = ['dateFrom', 'dateTo', 'revenue', 'profit', 'margin', 'roi'].includes(sortBy) ? 'desc' : 'asc';
        }
    }
    
    analyticsState.tableSortBy = sortBy;
    analyticsState.tableSortOrder = sortOrder;
    
    // Řazení
    analyticsState.tableData.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        // Speciální handling pro datumy
        if (sortBy === 'dateFrom' || sortBy === 'dateTo') {
            aVal = aVal ? aVal.getTime() : 0;
            bVal = bVal ? bVal.getTime() : 0;
        }
        
        // Speciální handling pro čísla
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // String porovnání
        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();
        
        if (sortOrder === 'asc') {
            return aStr.localeCompare(bStr, 'cs-CZ');
        } else {
            return bStr.localeCompare(aStr, 'cs-CZ');
        }
    });
    
    // Aktualizovat zobrazení
    displayDetailedTable();
    updateTableSortIndicators();
    
    console.log(`✅ Table sorted by ${sortBy} ${sortOrder}`);
}

// Filtrování tabulky podle business modelu
function filterTableByBusinessModel(businessModel) {
    console.log(`📋 Filtering table by business model: ${businessModel}`);
    
    analyticsState.tableBusinessFilter = businessModel;
    
    // Aktualizovat zobrazení
    displayDetailedTable();
    updateBusinessModelFilter();
    
    const filteredCount = getFilteredTableData().length;
    showNotification(`📋 Zobrazeno ${filteredCount} akcí (${businessModel === 'all' ? 'všechny' : businessModel})`, 'info', 2000);
}

// Získání filtrovaných dat tabulky
function getFilteredTableData() {
    if (!analyticsState.tableData) return [];
    
    if (analyticsState.tableBusinessFilter === 'all') {
        return analyticsState.tableData;
    }
    
    return analyticsState.tableData.filter(row => 
        row.businessModel === analyticsState.tableBusinessFilter
    );
}

// ========================================
// BUSINESS MODEL POROVNÁNÍ
// ========================================

// Výpočet porovnání business modelů
function calculateBusinessModelComparison(data = null) {
    console.log('💼 Calculating business model comparison...');
    
    const records = data || analyticsState.filteredData;
    
    if (!records || records.length === 0) {
        analyticsState.businessModelComparison = null;
        return null;
    }
    
    const modelStats = {
        'majitel': { count: 0, revenue: 0, costs: 0, profit: 0, sales: 0 },
        'zaměstnanec': { count: 0, revenue: 0, costs: 0, profit: 0, sales: 0 },
        'franšízant': { count: 0, revenue: 0, costs: 0, profit: 0, sales: 0 }
    };
    
    records.forEach(record => {
        const financials = calculateFinancials(record);
        if (!financials.isValid) return;
        
        const model = financials.businessModel;
        if (modelStats[model]) {
            modelStats[model].count++;
            modelStats[model].revenue += financials.revenue;
            modelStats[model].costs += financials.costs.total;
            modelStats[model].profit += financials.profit;
            modelStats[model].sales += financials.sales;
        }
    });
    
    // Výpočet průměrů a metrik
    const comparison = {};
    Object.keys(modelStats).forEach(model => {
        const stats = modelStats[model];
        const count = stats.count || 1; // Avoid division by zero
        
        comparison[model] = {
            count: stats.count,
            totalRevenue: stats.revenue,
            totalCosts: stats.costs,
            totalProfit: stats.profit,
            totalSales: stats.sales,
            
            // Průměry
            avgRevenue: stats.revenue / count,
            avgCosts: stats.costs / count,
            avgProfit: stats.profit / count,
            avgSales: stats.sales / count,
            
            // Metriky
            margin: stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0,
            roi: stats.costs > 0 ? (stats.profit / stats.costs) * 100 : 0,
            
            // Efficiency metriky
            profitPerEvent: stats.profit / count,
            costEfficiency: stats.revenue > 0 ? (stats.costs / stats.revenue) * 100 : 0
        };
    });
    
    // Seřadit podle průměrného zisku
    const sortedComparison = Object.entries(comparison)
        .sort(([,a], [,b]) => b.avgProfit - a.avgProfit)
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
    
    analyticsState.businessModelComparison = sortedComparison;
    
    console.log('✅ Business model comparison calculated:', sortedComparison);
    return sortedComparison;
}

// ========================================
// UI ZOBRAZENÍ
// ========================================

// Vytvoření UI pro Part 5B
function createPart5BUI() {
    console.log('🎨 Creating Part 5B UI...');
    
    const analyticsSection = document.getElementById('analytics');
    if (!analyticsSection) {
        console.error('❌ Analytics section not found');
        return;
    }
    
    // Zkontrolovat, zda už není UI vytvořené
    if (analyticsSection.querySelector('.detailed-table-card')) {
        console.log('🎨 Part 5B UI already exists');
        return;
    }
    
    const part5BHTML = `
        <!-- Business Model Porovnání -->
        <div class="card business-model-comparison">
            <h3>💼 Porovnání business modelů</h3>
            <div id="businessModelComparison" class="business-models-grid">
                <!-- Business model karty se vygenerují dynamicky -->
            </div>
        </div>
        
        <!-- Detailní tabulka -->
        <div class="card detailed-table-card">
            <div class="table-header">
                <h3>📋 Detailní přehled všech akcí</h3>
                <div class="table-controls">
                    <select id="businessModelFilter" onchange="filterTableByBusinessModel(this.value)">
                        <option value="all">💼 Všechny modely</option>
                        <option value="majitel">🏪 Majitel</option>
                        <option value="zaměstnanec">👨‍💼 Zaměstnanec</option>
                        <option value="franšízant">🤝 Franšízant</option>
                    </select>
                    <button class="btn btn-export" onclick="exportDetailedTable()">
                        📄 Export CSV
                    </button>
                </div>
            </div>
            
            <div class="table-wrapper">
                <div id="detailedTableContainer">
                    <!-- Tabulka se vygeneruje dynamicky -->
                </div>
            </div>
        </div>
        
        <!-- Loading state pro tabulku -->
        <div id="tableLoading" class="table-loading" style="display: none;">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Připravuji tabulku...</p>
            </div>
        </div>
    `;
    
    analyticsSection.insertAdjacentHTML('beforeend', part5BHTML);
    
    console.log('✅ Part 5B UI created');
}

// Zobrazení business model porovnání
function displayBusinessModelComparison(comparison = null) {
    console.log('💼 Displaying business model comparison...');
    
    const container = document.getElementById('businessModelComparison');
    if (!container) {
        console.error('❌ Business model comparison container not found');
        return;
    }
    
    const data = comparison || analyticsState.businessModelComparison;
    
    if (!data) {
        container.innerHTML = '<div class="comparison-empty">💼 Nedostatek dat pro porovnání business modelů</div>';
        return;
    }
    
    const modelLabels = {
        'majitel': { title: '🏪 Majitel', color: 'primary' },
        'zaměstnanec': { title: '👨‍💼 Zaměstnanec', color: 'success' },
        'franšízant': { title: '🤝 Franšízant', color: 'warning' }
    };
    
    const cards = Object.entries(data).map(([model, stats]) => {
        const label = modelLabels[model] || { title: model, color: 'primary' };
        const hasData = stats.count > 0;
        
        if (!hasData) {
            return `
                <div class="business-model-card ${label.color} empty">
                    <div class="model-header">
                        <h4>${label.title}</h4>
                        <div class="model-count">0 akcí</div>
                    </div>
                    <div class="model-empty">
                        <p>Žádné akce v tomto období</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="business-model-card ${label.color}">
                <div class="model-header">
                    <h4>${label.title}</h4>
                    <div class="model-count">${stats.count} akcí</div>
                </div>
                
                <div class="model-metrics">
                    <div class="metric-row">
                        <span class="metric-label">Průměrný zisk:</span>
                        <span class="metric-value profit">${formatCurrency(stats.avgProfit)}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Průměrný obrat:</span>
                        <span class="metric-value">${formatCurrency(stats.avgRevenue)}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Průměrné náklady:</span>
                        <span class="metric-value">${formatCurrency(stats.avgCosts)}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Marže:</span>
                        <span class="metric-value ${stats.margin >= 30 ? 'positive' : stats.margin >= 15 ? 'neutral' : 'negative'}">${stats.margin.toFixed(1)}%</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">ROI:</span>
                        <span class="metric-value ${stats.roi >= 50 ? 'positive' : stats.roi >= 25 ? 'neutral' : 'negative'}">${stats.roi.toFixed(1)}%</span>
                    </div>
                </div>
                
                <div class="model-totals">
                    <div class="total-item">
                        <span>Celkový zisk:</span>
                        <span class="total-value">${formatCurrency(stats.totalProfit)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = cards;
    
    console.log('✅ Business model comparison displayed');
}

// Zobrazení detailní tabulky
function displayDetailedTable() {
    console.log('📋 Displaying detailed table...');
    
    const container = document.getElementById('detailedTableContainer');
    if (!container) {
        console.error('❌ Detailed table container not found');
        return;
    }
    
    const filteredData = getFilteredTableData();
    
    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = `
            <div class="table-empty">
                <div class="empty-icon">📋</div>
                <h4>Žádná data pro zobrazení</h4>
                <p>Zkuste změnit období nebo filtr business modelu</p>
            </div>
        `;
        return;
    }
    
    // Vytvoření tabulky
    const tableHTML = `
        <div class="responsive-table">
            <table class="detailed-table">
                <thead>
                    <tr>
                        <th onclick="sortTable('dateTo')" class="sortable">
                            Datum 
                            <span class="sort-indicator" data-column="dateTo"></span>
                        </th>
                        <th onclick="sortTable('eventName')" class="sortable">
                            Akce
                            <span class="sort-indicator" data-column="eventName"></span>
                        </th>
                        <th onclick="sortTable('city')" class="sortable">
                            Město
                            <span class="sort-indicator" data-column="city"></span>
                        </th>
                        <th onclick="sortTable('businessModel')" class="sortable">
                            Model
                            <span class="sort-indicator" data-column="businessModel"></span>
                        </th>
                        <th onclick="sortTable('sales')" class="sortable number">
                            Prodej
                            <span class="sort-indicator" data-column="sales"></span>
                        </th>
                        <th onclick="sortTable('revenue')" class="sortable number">
                            Obrat
                            <span class="sort-indicator" data-column="revenue"></span>
                        </th>
                        <th onclick="sortTable('totalCosts')" class="sortable number">
                            Náklady
                            <span class="sort-indicator" data-column="totalCosts"></span>
                        </th>
                        <th onclick="sortTable('profit')" class="sortable number">
                            Zisk
                            <span class="sort-indicator" data-column="profit"></span>
                        </th>
                        <th onclick="sortTable('margin')" class="sortable number">
                            Marže
                            <span class="sort-indicator" data-column="margin"></span>
                        </th>
                        <th onclick="sortTable('roi')" class="sortable number">
                            ROI
                            <span class="sort-indicator" data-column="roi"></span>
                        </th>
                        <th class="actions">Akce</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateTableRows(filteredData)}
                </tbody>
            </table>
        </div>
        
        <div class="table-footer">
            <div class="table-summary">
                Zobrazeno <strong>${filteredData.length}</strong> akcí
                ${analyticsState.tableBusinessFilter !== 'all' ? ` (filtr: ${analyticsState.tableBusinessFilter})` : ''}
            </div>
        </div>
    `;
    
    container.innerHTML = tableHTML;
    updateTableSortIndicators();
    
    console.log(`✅ Detailed table displayed with ${filteredData.length} rows`);
}

// Generování řádků tabulky
function generateTableRows(data) {
    return data.map(row => {
        const dateStr = row.dateTo ? formatDate(row.dateTo) : 'N/A';
        const businessModelIcon = {
            'majitel': '🏪',
            'zaměstnanec': '👨‍💼',
            'franšízant': '🤝'
        }[row.businessModel] || '💼';
        
        const profitClass = row.profit >= 0 ? 'positive' : 'negative';
        const marginClass = row.margin >= 30 ? 'positive' : row.margin >= 15 ? 'neutral' : 'negative';
        const roiClass = row.roi >= 50 ? 'positive' : row.roi >= 25 ? 'neutral' : 'negative';
        
        return `
            <tr onclick="showRowDetail('${row.id}')" class="table-row-clickable">
                <td data-label="Datum">${dateStr}</td>
                <td data-label="Akce" class="event-name">${escapeHtml(row.eventName)}</td>
                <td data-label="Město">${escapeHtml(row.city)}</td>
                <td data-label="Model">${businessModelIcon} ${row.businessModel}</td>
                <td data-label="Prodej" class="number">${formatNumber(row.sales)} ks</td>
                <td data-label="Obrat" class="number">${formatCurrency(row.revenue)}</td>
                <td data-label="Náklady" class="number">${formatCurrency(row.totalCosts)}</td>
                <td data-label="Zisk" class="number ${profitClass}">${formatCurrency(row.profit)}</td>
                <td data-label="Marže" class="number ${marginClass}">${row.margin.toFixed(1)}%</td>
                <td data-label="ROI" class="number ${roiClass}">${row.roi.toFixed(1)}%</td>
                <td data-label="Akce" class="actions">
                    <button class="btn-small" onclick="event.stopPropagation(); showRowDetail('${row.id}')" title="Detail">
                        👁️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Aktualizace indikátorů řazení
function updateTableSortIndicators() {
    // Vymazat všechny indikátory
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        indicator.textContent = '';
        indicator.className = 'sort-indicator';
    });
    
    // Nastavit aktivní indikátor
    const activeIndicator = document.querySelector(`[data-column="${analyticsState.tableSortBy}"]`);
    if (activeIndicator) {
        activeIndicator.textContent = analyticsState.tableSortOrder === 'asc' ? '↑' : '↓';
        activeIndicator.classList.add('active');
    }
}

// Aktualizace business model filtru
function updateBusinessModelFilter() {
    const filter = document.getElementById('businessModelFilter');
    if (filter) {
        filter.value = analyticsState.tableBusinessFilter;
    }
}

// ========================================
// DETAIL ŘÁDKU
// ========================================

// Zobrazení detailu řádku
function showRowDetail(rowId) {
    console.log(`👁️ Showing row detail for: ${rowId}`);
    
    const row = analyticsState.tableData.find(r => r.id === rowId);
    if (!row) {
        console.error('❌ Row not found:', rowId);
        return;
    }
    
    const originalRecord = row.originalRecord;
    
    // Vytvoření modalu s detailem
    const modal = document.createElement('div');
    modal.className = 'modal row-detail-modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 Detail akce: ${escapeHtml(row.eventName)}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-grid">
                    <!-- Základní údaje -->
                    <div class="detail-section">
                        <h4>📝 Základní údaje</h4>
                        <div class="detail-item">
                            <label>Název akce:</label>
                            <span>${escapeHtml(row.eventName)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Město:</label>
                            <span>${escapeHtml(row.city)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Kategorie:</label>
                            <span>${escapeHtml(row.category)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Datum:</label>
                            <span>${formatDate(row.dateFrom)} - ${formatDate(row.dateTo)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Business model:</label>
                            <span>${row.businessModel}</span>
                        </div>
                    </div>
                    
                    <!-- Prodejní údaje -->
                    <div class="detail-section">
                        <h4>🛒 Prodejní údaje</h4>
                        <div class="detail-item">
                            <label>Návštěvnost:</label>
                            <span>${formatNumber(row.visitors)} osob</span>
                        </div>
                        <div class="detail-item">
                            <label>Prodáno:</label>
                            <span>${formatNumber(row.sales)} ks</span>
                        </div>
                        <div class="detail-item">
                            <label>Cena za kus:</label>
                            <span>${formatCurrency(row.price)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Konverze:</label>
                            <span>${row.visitors > 0 ? ((row.sales / row.visitors) * 100).toFixed(1) : '0'}%</span>
                        </div>
                    </div>
                    
                    <!-- Finanční údaje -->
                    <div class="detail-section">
                        <h4>💰 Finanční údaje</h4>
                        <div class="detail-item highlight">
                            <label>Celkový obrat:</label>
                            <span class="value-large">${formatCurrency(row.revenue)}</span>
                        </div>
                        <div class="detail-item highlight">
                            <label>Celkové náklady:</label>
                            <span class="value-large">${formatCurrency(row.totalCosts)}</span>
                        </div>
                        <div class="detail-item highlight ${row.profit >= 0 ? 'positive' : 'negative'}">
                            <label>Čistý zisk:</label>
                            <span class="value-large">${formatCurrency(row.profit)}</span>
                        </div>
                    </div>
                    
                    <!-- Rozpis nákladů -->
                    <div class="detail-section">
                        <h4>📊 Rozpis nákladů</h4>
                        <div class="detail-item">
                            <label>Výroba:</label>
                            <span>${formatCurrency(row.productionCost)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Mzdy:</label>
                            <span>${formatCurrency(row.laborCost)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Doprava:</label>
                            <span>${formatCurrency(row.transportCost)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Nájem:</label>
                            <span>${formatCurrency(row.rentCost)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Ostatní:</label>
                            <span>${formatCurrency(row.otherCosts)}</span>
                        </div>
                    </div>
                    
                    <!-- Metriky -->
                    <div class="detail-section">
                        <h4>📈 Klíčové metriky</h4>
                        <div class="detail-item">
                            <label>Marže:</label>
                            <span class="${row.margin >= 30 ? 'positive' : row.margin >= 15 ? 'neutral' : 'negative'}">${row.margin.toFixed(1)}%</span>
                        </div>
                        <div class="detail-item">
                            <label>ROI:</label>
                            <span class="${row.roi >= 50 ? 'positive' : row.roi >= 25 ? 'neutral' : 'negative'}">${row.roi.toFixed(1)}%</span>
                        </div>
                        <div class="detail-item">
                            <label>Náklady/Obrat:</label>
                            <span>${row.revenue > 0 ? ((row.totalCosts / row.revenue) * 100).toFixed(1) : '0'}%</span>
                        </div>
                    </div>
                    
                    <!-- Poznámky -->
                    ${originalRecord.notes ? `
                    <div class="detail-section">
                        <h4>📝 Poznámky</h4>
                        <div class="detail-notes">${escapeHtml(originalRecord.notes)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-export" onclick="exportSingleEvent('${rowId}')">📄 Export</button>
                <button class="btn" onclick="this.closest('.modal').remove()">Zavřít</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    console.log('✅ Row detail modal displayed');
}

// ========================================
// EXPORT FUNKCIONALITA
// ========================================

// Export detailní tabulky do CSV
function exportDetailedTable() {
    console.log('📄 Exporting detailed table...');
    
    if (analyticsState.isExporting) {
        console.log('⚠️ Export already in progress');
        return;
    }
    
    analyticsState.isExporting = true;
    showNotification('📄 Připravuji export...', 'info', 2000);
    
    try {
        const data = getFilteredTableData();
        
        if (!data || data.length === 0) {
            showNotification('❌ Žádná data k exportu', 'error');
            analyticsState.isExporting = false;
            return;
        }
        
        // CSV hlavička
        const csvHeader = [
            'Datum_od',
            'Datum_do', 
            'Nazev_akce',
            'Mesto',
            'Kategorie',
            'Business_model',
            'Navstevnost',
            'Prodano_ks',
            'Cena_za_kus',
            'Konverze_procent',
            'Celkovy_obrat',
            'Naklady_vyroba',
            'Naklady_mzdy',
            'Naklady_doprava',
            'Naklady_najem',
            'Naklady_ostatni',
            'Celkove_naklady',
            'Cisty_zisk',
            'Marze_procent',
            'ROI_procent'
        ].join(',');
        
        // CSV data řádky
        const csvRows = data.map(row => {
            const conversion = row.visitors > 0 ? ((row.sales / row.visitors) * 100) : 0;
            
            return [
                formatDateKey(row.dateFrom) || '',
                formatDateKey(row.dateTo) || '',
                `"${escapeCSV(row.eventName)}"`,
                `"${escapeCSV(row.city)}"`,
                `"${escapeCSV(row.category)}"`,
                `"${escapeCSV(row.businessModel)}"`,
                row.visitors || 0,
                row.sales || 0,
                row.price || 0,
                conversion.toFixed(2),
                row.revenue || 0,
                row.productionCost || 0,
                row.laborCost || 0,
                row.transportCost || 0,
                row.rentCost || 0,
                row.otherCosts || 0,
                row.totalCosts || 0,
                row.profit || 0,
                row.margin?.toFixed(2) || 0,
                row.roi?.toFixed(2) || 0
            ].join(',');
        });
        
        // Kombinace hlavičky a dat
        const csvContent = [csvHeader, ...csvRows].join('\n');
        
        // Přidání BOM pro správné zobrazení českých znaků v Excelu
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        // Download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Název souboru s časovým razítkem
        const dateRange = analyticsState.periodFrom && analyticsState.periodTo ? 
            `_${formatDateKey(analyticsState.periodFrom)}_${formatDateKey(analyticsState.periodTo)}` : 
            `_${formatDateKey(new Date())}`;
        
        const businessFilter = analyticsState.tableBusinessFilter !== 'all' ? 
            `_${analyticsState.tableBusinessFilter}` : '';
        
        link.download = `donuland_analyza${dateRange}${businessFilter}.csv`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Uložit pro debug
        analyticsState.lastExportData = {
            filename: link.download,
            rowCount: data.length,
            exportedAt: new Date().toISOString()
        };
        
        showNotification(`📄 Export dokončen: ${data.length} akcí`, 'success');
        console.log(`✅ CSV exported: ${data.length} rows`);
        
    } catch (error) {
        console.error('❌ Export error:', error);
        showNotification('❌ Chyba při exportu CSV', 'error');
    } finally {
        analyticsState.isExporting = false;
    }
}

// Export jednotlivé akce
function exportSingleEvent(rowId) {
    console.log(`📄 Exporting single event: ${rowId}`);
    
    const row = analyticsState.tableData.find(r => r.id === rowId);
    if (!row) {
        showNotification('❌ Akce nenalezena', 'error');
        return;
    }
    
    // Vytvořit mini CSV pro jednu akci
    const csvContent = `Nazev_akce,Mesto,Datum,Business_model,Obrat,Naklady,Zisk,Marze
"${escapeCSV(row.eventName)}","${escapeCSV(row.city)}","${formatDateKey(row.dateTo)}","${escapeCSV(row.businessModel)}",${row.revenue},${row.totalCosts},${row.profit},${row.margin.toFixed(1)}%`;
    
    const blob = new Blob(['\uFEFF' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donuland_${row.eventName.replace(/[^a-z0-9]/gi, '_')}_${formatDateKey(row.dateTo)}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('📄 Export jednotlivé akce dokončen', 'success');
}

// Helper funkce pro escape CSV
function escapeCSV(text) {
    if (!text) return '';
    return String(text).replace(/"/g, '""');
}

// ========================================
// HLAVNÍ UPDATE FUNKCE
// ========================================

// Hlavní funkce pro aktualizaci Part 5B
function updatePart5BDisplay() {
    console.log('🔄 Updating Part 5B display...');
    
    // Zobrazit loading pro tabulku
    showElement('tableLoading');
    
    try {
        // Připravit data pro tabulku
        prepareTableData();
        
        // Vypočítat business model porovnání
        calculateBusinessModelComparison();
        
        // Zobrazit komponenty
        displayBusinessModelComparison();
        displayDetailedTable();
        
        // Skrýt loading
        hideElement('tableLoading');
        
        console.log('✅ Part 5B display updated');
        
    } catch (error) {
        console.error('❌ Error updating Part 5B display:', error);
        hideElement('tableLoading');
        showNotification('❌ Chyba při aktualizaci tabulky', 'error');
    }
}

// ========================================
// HELPER FUNKCE
// ========================================

// Zobrazení/skrytí elementů (kompatibilní s Part 5A)
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'block';
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
}

// Escape HTML (kompatibilní s ostatními částmi)
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Formátování data (kompatibilní s ostatními částmi)
if (typeof formatDate === 'undefined') {
    function formatDate(date) {
        if (!date) return '';
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        if (isNaN(date.getTime())) {
            return '';
        }
        
        return date.toLocaleDateString('cs-CZ');
    }
}

// ========================================
// INICIALIZACE PART 5B
// ========================================

// Hlavní inicializační funkce Part 5B
function initializePart5B() {
    console.log('🔧 Initializing Part 5B...');
    
    // Ověřit, že Part 5A je načten
    if (typeof analyticsState === 'undefined') {
        console.error('❌ Part 5A not loaded! Part 5B requires Part 5A.');
        setTimeout(initializePart5B, 1000); // Zkusit znovu za sekundu
        return;
    }
    
    try {
        // 1. Vytvořit UI
        createPart5BUI();
        
        // 2. Načíst a zobrazit data (pokud jsou dostupná)
        if (analyticsState.filteredData && analyticsState.filteredData.length > 0) {
            updatePart5BDisplay();
        }
        
        console.log('✅ Part 5B initialized successfully');
        
        // Emit completion event
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('part5BInitialized', {
                timestamp: Date.now(),
                version: '5B-1.0.0'
            });
        }
        
    } catch (error) {
        console.error('❌ Error initializing Part 5B:', error);
        showNotification('❌ Chyba při inicializaci detailní tabulky', 'error');
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

// Event listeners pro kompatibilitu s ostatními částmi
if (typeof eventBus !== 'undefined') {
    
    // Po aktualizaci analytics (z Part 5A)
    eventBus.on('analyticsUpdated', (data) => {
        console.log('📊 Analytics updated, updating Part 5B');
        setTimeout(() => {
            updatePart5BDisplay();
        }, 100);
    });
    
    // Po inicializaci analytics (z Part 5A)
    eventBus.on('analyticsInitialized', () => {
        console.log('📊 Analytics initialized, initializing Part 5B');
        setTimeout(() => {
            initializePart5B();
        }, 500);
    });
    
    // Po načtení dat
    eventBus.on('dataLoaded', () => {
        console.log('📊 Data loaded, updating Part 5B');
        setTimeout(() => {
            if (typeof analyticsState !== 'undefined' && analyticsState.isInitialized) {
                updatePart5BDisplay();
            }
        }, 1000);
    });
    
    // Po požadavku na analytics sekci
    eventBus.on('analyticsRequested', () => {
        console.log('📊 Analytics section requested, ensuring Part 5B is ready');
        setTimeout(() => {
            // Inicializovat Part 5B pokud ještě není
            if (!document.querySelector('.detailed-table-card')) {
                initializePart5B();
            }
        }, 1000);
    });
}

// DOM ready listener
document.addEventListener('DOMContentLoaded', function() {
    // Zpoždění pro načtení Part 5A
    setTimeout(() => {
        if (typeof analyticsState !== 'undefined' && analyticsState.isInitialized) {
            console.log('📊 DOM ready - initializing Part 5B');
            initializePart5B();
        }
    }, 3000);
});

// ========================================
// GLOBÁLNÍ EXPORT PRO HTML
// ========================================

// Export funkcí pro HTML onclick handlers
if (typeof window !== 'undefined') {
    window.sortTable = sortTable;
    window.filterTableByBusinessModel = filterTableByBusinessModel;
    window.showRowDetail = showRowDetail;
    window.exportDetailedTable = exportDetailedTable;
    window.exportSingleEvent = exportSingleEvent;
    window.initializePart5B = initializePart5B;
    
    // Rozšíření debug objektu
    if (window.analyticsDebug) {
        window.analyticsDebug.part5B = {
            state: analyticsState,
            
            // Test funkce
            testTableData: () => {
                return prepareTableData();
            },
            
            testBusinessComparison: () => {
                return calculateBusinessModelComparison();
            },
            
            forceTableUpdate: () => {
                updatePart5BDisplay();
            },
            
            getTableStats: () => {
                const data = getFilteredTableData();
                return {
                    totalRows: data.length,
                    businessModels: [...new Set(data.map(r => r.businessModel))],
                    dateRange: {
                        from: Math.min(...data.map(r => r.dateFrom?.getTime()).filter(Boolean)),
                        to: Math.max(...data.map(r => r.dateTo?.getTime()).filter(Boolean))
                    },
                    totals: {
                        revenue: data.reduce((sum, r) => sum + r.revenue, 0),
                        profit: data.reduce((sum, r) => sum + r.profit, 0),
                        costs: data.reduce((sum, r) => sum + r.totalCosts, 0)
                    }
                };
            }
        };
    }
}

// ========================================
// CSS INJEKCE PRO PART 5B
// ========================================

// Přidání stylů pro Part 5B UI
function injectPart5BCSS() {
    if (document.getElementById('analytics-part5b-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'analytics-part5b-styles';
    style.textContent = `
        /* Business Model Comparison */
        .business-model-comparison {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        }
        
        .business-models-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .business-model-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border-left: 6px solid var(--primary-color);
        }
        
        .business-model-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        
        .business-model-card.success {
            border-left-color: var(--success-color);
        }
        
        .business-model-card.warning {
            border-left-color: var(--warning-color);
        }
        
        .business-model-card.empty {
            opacity: 0.6;
            background: var(--gray-100);
        }
        
        .model-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--gray-200);
        }
        
        .model-header h4 {
            margin: 0;
            color: var(--gray-800);
            font-size: 1.1rem;
        }
        
        .model-count {
            background: var(--primary-color);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 600;
        }
        
        .business-model-card.success .model-count {
            background: var(--success-color);
        }
        
        .business-model-card.warning .model-count {
            background: var(--warning-color);
        }
        
        .model-metrics {
            margin-bottom: 15px;
        }
        
        .metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid var(--gray-100);
        }
        
        .metric-row:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            color: var(--gray-600);
            font-size: 0.875rem;
        }
        
        .metric-value {
            font-weight: 600;
            color: var(--gray-800);
        }
        
        .metric-value.profit {
            color: var(--success-color);
            font-weight: 700;
        }
        
        .metric-value.positive {
            color: var(--success-color);
        }
        
        .metric-value.neutral {
            color: var(--warning-color);
        }
        
        .metric-value.negative {
            color: var(--error-color);
        }
        
        .model-totals {
            background: var(--gray-100);
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
        }
        
        .total-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
        }
        
        .total-value {
            color: var(--success-color);
            font-weight: 700;
        }
        
        .model-empty {
            text-align: center;
            padding: 20px;
            color: var(--gray-500);
            font-style: italic;
        }
        
        .comparison-empty {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: var(--gray-500);
            font-style: italic;
        }
        
        /* Detailed Table */
        .detailed-table-card {
            background: white;
            overflow: hidden;
        }
        
        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .table-header h3 {
            margin: 0;
            color: var(--gray-800);
        }
        
        .table-controls {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .table-controls select {
            padding: 8px 12px;
            border: 1px solid var(--gray-300);
            border-radius: 6px;
            background: white;
            font-size: 0.875rem;
        }
        
        .table-wrapper {
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid var(--gray-200);
        }
        
        .responsive-table {
            width: 100%;
        }
        
        .detailed-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            font-size: 0.875rem;
        }
        
        .detailed-table th {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            white-space: nowrap;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .detailed-table th.number {
            text-align: right;
        }
        
        .detailed-table th.actions {
            text-align: center;
            width: 80px;
        }
        
        .detailed-table th.sortable {
            cursor: pointer;
            user-select: none;
            position: relative;
            transition: background-color 0.3s ease;
        }
        
        .detailed-table th.sortable:hover {
            background: var(--primary-dark);
        }
        
        .sort-indicator {
            margin-left: 5px;
            opacity: 0.7;
        }
        
        .sort-indicator.active {
            opacity: 1;
            font-weight: bold;
        }
        
        .detailed-table td {
            padding: 10px 8px;
            border-bottom: 1px solid var(--gray-200);
            vertical-align: middle;
        }
        
        .detailed-table td.number {
            text-align: right;
            font-weight: 500;
        }
        
        .detailed-table td.actions {
            text-align: center;
        }
        
        .detailed-table tr.table-row-clickable {
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        
        .detailed-table tr.table-row-clickable:hover {
            background: var(--gray-100);
        }
        
        .event-name {
            font-weight: 600;
            color: var(--gray-800);
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .positive {
            color: var(--success-color);
            font-weight: 600;
        }
        
        .negative {
            color: var(--error-color);
            font-weight: 600;
        }
        
        .neutral {
            color: var(--warning-color);
            font-weight: 600;
        }
        
        .btn-small {
            padding: 4px 8px;
            font-size: 0.75rem;
            border: none;
            border-radius: 4px;
            background: var(--gray-200);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-small:hover {
            background: var(--primary-color);
            color: white;
            transform: scale(1.1);
        }
        
        .table-footer {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--gray-200);
            text-align: center;
        }
        
        .table-summary {
            color: var(--gray-600);
            font-size: 0.875rem;
        }
        
        .table-empty {
            text-align: center;
            padding: 60px 20px;
            color: var(--gray-500);
        }
        
        .table-empty .empty-icon {
            font-size: 3rem;
            margin-bottom: 15px;
            opacity: 0.7;
        }
        
        .table-loading {
            text-align: center;
            padding: 40px 20px;
            color: var(--gray-500);
        }
        
        .table-loading .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--gray-200);
            border-top: 3px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        /* Row Detail Modal */
        .row-detail-modal .modal-content {
            max-width: 900px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .detail-section {
            background: var(--gray-100);
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid var(--primary-color);
        }
        
        .detail-section h4 {
            margin: 0 0 15px 0;
            color: var(--gray-800);
            font-size: 1rem;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--gray-300);
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid var(--gray-200);
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-item.highlight {
            background: white;
            padding: 12px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 4px solid var(--primary-color);
        }
        
        .detail-item.highlight.positive {
            border-left-color: var(--success-color);
            background: #f0fff4;
        }
        
        .detail-item.highlight.negative {
            border-left-color: var(--error-color);
            background: #fff5f5;
        }
        
        .detail-item label {
            color: var(--gray-600);
            font-size: 0.875rem;
            margin: 0;
        }
        
        .detail-item span {
            font-weight: 600;
            color: var(--gray-800);
        }
        
        .value-large {
            font-size: 1.1rem;
            font-weight: 700;
        }
        
        .detail-notes {
            background: white;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid var(--gray-200);
            font-style: italic;
            color: var(--gray-700);
            line-height: 1.4;
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
            .business-models-grid {
                grid-template-columns: 1fr;
            }
            
            .table-header {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
            
            .table-controls {
                justify-content: center;
            }
        }
        
        @media (max-width: 768px) {
            .detailed-table {
                font-size: 0.75rem;
            }
            
            .detailed-table th,
            .detailed-table td {
                padding: 8px 4px;
            }
            
            .event-name {
                max-width: 120px;
            }
            
            .detail-grid {
                grid-template-columns: 1fr;
            }
            
            .metric-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }
            
            .model-header {
                flex-direction: column;
                text-align: center;
                gap: 8px;
            }
        }
        
        @media (max-width: 480px) {
            /* Mobile table stack layout */
            .detailed-table,
            .detailed-table thead,
            .detailed-table tbody,
            .detailed-table th,
            .detailed-table td,
            .detailed-table tr {
                display: block;
            }
            
            .detailed-table thead tr {
                position: absolute;
                top: -9999px;
                left: -9999px;
            }
            
            .detailed-table tr {
                border: 1px solid var(--gray-200);
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 8px;
                background: white;
            }
            
            .detailed-table td {
                border: none;
                border-bottom: 1px solid var(--gray-200);
                position: relative;
                padding-left: 50%;
                text-align: right;
            }
            
            .detailed-table td:before {
                content: attr(data-label) ": ";
                position: absolute;
                left: 6px;
                width: 45%;
                padding-right: 10px;
                white-space: nowrap;
                text-align: left;
                font-weight: 600;
                color: var(--gray-600);
            }
            
            .detailed-table td.actions {
                text-align: center;
                padding-left: 6px;
            }
            
            .detailed-table td.actions:before {
                display: none;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Part 5B CSS injected');
}

// Inject CSS při načtení
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(injectPart5BCSS, 200);
});

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 5B loaded successfully');
console.log('📋 Features: Detailed table, Business model comparison, CSV export');
console.log('🔄 Table: Sortable columns, Business model filter, Row details');
console.log('💼 Comparison: 3 business models with metrics and totals');
console.log('📄 Export: Full CSV with all financial data + single event export');
console.log('📱 Responsive: Mobile-friendly table with stack layout');
console.log('🔧 Debug: window.analyticsDebug.part5B available');

// Emit completion event
if (typeof eventBus !== 'undefined') {
    eventBus.emit('part5BLoaded', { 
        timestamp: Date.now(),
        version: '5B-1.0.0',
        features: [
            'detailed-events-table',
            'sortable-columns-by-date-profit-margin-roi',
            'business-model-filter-and-comparison',
            'row-detail-modal-with-full-breakdown',
            'csv-export-with-all-financial-data',
            'single-event-export',
            'responsive-mobile-table-layout',
            'business-model-performance-cards',
            'profit-margin-roi-color-coding'
        ]
    });
}
