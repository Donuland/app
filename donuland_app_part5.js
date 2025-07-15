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
