/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 2A
   Data loading ze Sheets a Distance calculation
   ======================================== */

console.log('🍩 Donuland Part 2A loading...');

// ========================================
// DATA LOADING ZE SHEETS
// ========================================

// Hlavní funkce pro načtení dat
async function loadData() {
    console.log('📊 Starting data loading...');
    
    if (globalState.isLoading) {
        console.log('⚠️ Data loading already in progress');
        return;
    }
    
    globalState.isLoading = true;
    globalState.dataLoadAttempts++;
    
    updateStatus('loading', 'Načítám historická data...');
    updateLoadButton('loading');
    showLoadingOverlay('Načítám data z Google Sheets...');
    
    try {
        performanceMonitor.start('dataLoading');
        
        // Pokus o načtení dat
        const data = await fetchSheetsData();
        const parsedData = parseSheetData(data);
        
        globalState.historicalData = parsedData;
        globalState.lastDataLoad = Date.now();
        
        // Aktualizace UI
        updateStatus('online', `Načteno ${parsedData.length} záznamů`);
        updateLoadButton('success');
        
        // Naplnění autocomplete seznamů
        populateAutocompleteOptions();
        
        // Zobrazení historických dat pokud je formulář vyplněn
        if (validateRequiredFields().valid) {
            updateHistoricalDisplay();
        }
        
        showNotification(`✅ Úspěšně načteno ${parsedData.length} historických záznamů`, 'success');
        
        console.log(`✅ Data loaded successfully: ${parsedData.length} records`);
        performanceMonitor.end('dataLoading');
        
        eventBus.emit('dataLoaded', { 
            count: parsedData.length, 
            data: parsedData 
        });
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        
        updateStatus('offline', 'Chyba při načítání dat');
        updateLoadButton('error');
        
        showNotification(`❌ Chyba při načítání dat: ${error.message}`, 'error');
        
        globalState.errors.push({
            type: 'data_loading',
            message: error.message,
            timestamp: new Date().toISOString(),
            attempt: globalState.dataLoadAttempts
        });
        
        eventBus.emit('dataLoadError', error);
        
    } finally {
        globalState.isLoading = false;
        hideLoadingOverlay();
    }
}

// Načtení dat z Google Sheets
async function fetchSheetsData() {
    const sheetsUrl = document.getElementById('sheetsUrl')?.value || CONFIG.SHEETS_URL;
    
    if (!sheetsUrl) {
        throw new Error('Google Sheets URL není nastavena');
    }
    
    // Extrakce Sheet ID z URL
    const sheetId = extractSheetId(sheetsUrl);
    if (!sheetId) {
        throw new Error('Neplatná Google Sheets URL');
    }
    
    // Sestavení CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    
    console.log('📡 Fetching data from:', csvUrl);
    
    try {
        // Pokus o přímý fetch
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.length < 50) {
            throw new Error('Prázdná nebo neplatná odpověď ze Sheets');
        }
        
        return csvText;
        
    } catch (error) {
        console.log('⚠️ Direct fetch failed, trying with CORS proxy...');
        
        // Fallback přes CORS proxy
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`;
        
        const proxyResponse = await fetch(proxyUrl);
        if (!proxyResponse.ok) {
            throw new Error(`Proxy request failed: ${proxyResponse.status}`);
        }
        
        const proxyData = await proxyResponse.json();
        
        if (!proxyData.contents) {
            throw new Error('Proxy vrátil prázdná data');
        }
        
        return proxyData.contents;
    }
}

// Extrakce Sheet ID z URL
function extractSheetId(url) {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

// Parsování CSV dat ze Sheets
function parseSheetData(csvText) {
    console.log('📝 Parsing CSV data...');
    
    const lines = csvText.split('\n');
    const data = [];
    
    // První řádek je header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Jednoduchý CSV parser (může být vylepšen pro složitější data)
        const values = parseCSVLine(line);
        
        if (values.length >= headers.length) {
            const record = {};
            
            // Mapování podle sloupců (A=0, B=1, C=2, atd.)
            headers.forEach((header, index) => {
                record[String.fromCharCode(65 + index)] = values[index] ? values[index].trim().replace(/"/g, '') : '';
            });
            
            // Pouze záznamy s validními daty
            if (record.B && record.C && record.D && record.E && record.M) {
                // Validace a čištění dat
                record.dateFrom = parseDate(record.B);
                record.dateTo = parseDate(record.C);
                record.city = record.D;
                record.eventName = record.E;
                record.category = record.F || 'ostatní';
                record.sales = parseFloat(record.M) || 0;
                record.visitors = parseFloat(record.Q) || 0;
                record.weather = record.R || '';
                record.competition = parseInt(record.W) || 2;
                record.rating = parseFloat(record.X) || 0;
                record.notes = record.Y || '';
                
                // Pouze záznamy s pozitivním prodejem
                if (record.sales > 0) {
                    data.push(record);
                }
            }
        }
    }
    
    console.log(`📊 Parsed ${data.length} valid records`);
    return data;
}

// Jednoduchý CSV line parser
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Parsování data z různých formátů
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Čeští formáty: 15.6.2025, 15/6/2025
    const czechMatch = dateStr.match(/(\d{1,2})[\./](\d{1,2})[\./](\d{4})/);
    if (czechMatch) {
        const [, day, month, year] = czechMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // ISO formát: 2025-06-15
    const isoMatch = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        return dateStr;
    }
    
    return null;
}

// ========================================
// AUTOCOMPLETE NAPLNĚNÍ
// ========================================

// Naplnění autocomplete seznamů z historických dat
function populateAutocompleteOptions() {
    console.log('📝 Populating autocomplete options...');
    
    const eventNames = new Set();
    
    globalState.historicalData.forEach(record => {
        if (record.eventName) {
            eventNames.add(record.eventName);
        }
    });
    
    // Naplnění event names datalist
    const eventNamesDatalist = document.getElementById('eventNames');
    if (eventNamesDatalist) {
        eventNamesDatalist.innerHTML = '';
        
        Array.from(eventNames).sort().forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            eventNamesDatalist.appendChild(option);
        });
    }
    
    console.log(`✅ Populated ${eventNames.size} event names`);
}

// ========================================
// DISTANCE CALCULATION
// ========================================

// Aktualizace vzdálenosti
async function updateDistance() {
    const city = document.getElementById('city').value.trim();
    const distanceInput = document.getElementById('distance');
    
    if (!city || !distanceInput) {
        console.log('⚠️ City or distance input missing');
        return;
    }
    
    if (globalState.isLoadingDistance) {
        console.log('⚠️ Distance calculation already in progress');
        return;
    }
    
    globalState.isLoadingDistance = true;
    
    try {
        distanceInput.value = 'Počítám...';
        distanceInput.classList.add('calculating');
        
        const distance = await calculateDistance('Praha', city);
        distanceInput.value = distance ? `${distance} km` : 'Neznámá';
        
        eventBus.emit('distanceCalculated', { distance, city });
        
    } catch (error) {
        console.warn('⚠️ Distance calculation failed:', error);
        distanceInput.value = getFallbackDistance(city);
        
    } finally {
        distanceInput.classList.remove('calculating');
        globalState.isLoadingDistance = false;
    }
}

// Výpočet vzdálenosti mezi městy
async function calculateDistance(from, to) {
    const cacheKey = `${from}-${to}`;
    
    // Kontrola cache
    const cached = globalState.distanceCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CONFIG.DISTANCE_CACHE_TIME) {
        console.log('📦 Using cached distance');
        return cached.distance;
    }
    
    try {
        // Pokus o Google Maps Distance Matrix API
        if (globalState.googleMapsLoaded && globalState.distanceService) {
            const distance = await getDistanceFromMapsAPI(from, to);
            if (distance) {
                globalState.distanceCache.set(cacheKey, {
                    distance: distance,
                    timestamp: Date.now()
                });
                return distance;
            }
        }
        
        // Fallback na předdefinované vzdálenosti
        const fallbackDistance = getFallbackDistanceNumber(to);
        
        globalState.distanceCache.set(cacheKey, {
            distance: fallbackDistance,
            timestamp: Date.now()
        });
        
        return fallbackDistance;
        
    } catch (error) {
        console.error('Distance calculation error:', error);
        return getFallbackDistanceNumber(to);
    }
}

// Google Maps Distance Matrix API
async function getDistanceFromMapsAPI(from, to) {
    return new Promise((resolve, reject) => {
        if (!globalState.distanceService) {
            reject(new Error('Distance service not initialized'));
            return;
        }
        
        globalState.distanceService.getDistanceMatrix({
            origins: [from + ', Czech Republic'],
            destinations: [to + ', Czech Republic'],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false
        }, (response, status) => {
            if (status === google.maps.DistanceMatrixStatus.OK) {
                const element = response.rows[0].elements[0];
                
                if (element.status === 'OK') {
                    const distanceKm = Math.round(element.distance.value / 1000);
                    console.log(`🗺️ Distance from Maps API: ${distanceKm} km`);
                    resolve(distanceKm);
                } else {
                    reject(new Error(`Distance element status: ${element.status}`));
                }
            } else {
                reject(new Error(`Distance matrix status: ${status}`));
            }
        });
    });
}

// Fallback vzdálenosti pro česká města
function getFallbackDistanceNumber(city) {
    const cityNormalized = removeDiacritics(city.toLowerCase());
    
    const fallbackDistances = {
        'praha': 0,
        'brno': 195,
        'ostrava': 350,
        'plzen': 90,
        'liberec': 100,
        'olomouc': 280,
        'hradec kralove': 110,
        'pardubice': 100,
        'ceske budejovice': 150,
        'usti nad labem': 75,
        'karlovy vary': 130,
        'jihlava': 125,
        'havirov': 365,
        'kladno': 25,
        'most': 80,
        'opava': 340,
        'frydek mistek': 330,
        'karvina': 370,
        'teplice': 85,
        'decin': 100
    };
    
    // Hledání nejpodobnějšího města
    for (const [knownCity, distance] of Object.entries(fallbackDistances)) {
        if (cityNormalized.includes(knownCity) || knownCity.includes(cityNormalized)) {
            return distance;
        }
    }
    
    // Default pro neznámá města
    return 150;
}

// Fallback vzdálenost s jednotkami
function getFallbackDistance(city) {
    const distance = getFallbackDistanceNumber(city);
    return `${distance} km`;
}

// ========================================
// HISTORICKÁ DATA ZOBRAZENÍ
// ========================================

// Aktualizace historických dat v UI
function updateHistoricalDisplay() {
    const formData = gatherFormData();
    
    if (!formData.eventName && !formData.city && !formData.category) {
        console.log('⚠️ Insufficient data for historical display');
        return;
    }
    
    const historicalData = getHistoricalData(formData.eventName, formData.city, formData.category);
    displayHistoricalData(historicalData, formData);
}

// Získání relevantních historických dat
function getHistoricalData(eventName, city, category) {
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return { matches: [], summary: null };
    }
    
    // Najít podobné akce s váženým skóre
    const matches = globalState.historicalData.map(record => {
        let score = 0;
        
        // Název akce (40%)
        if (eventName && record.eventName) {
            if (record.eventName.toLowerCase().includes(eventName.toLowerCase()) || 
                eventName.toLowerCase().includes(record.eventName.toLowerCase())) {
                score += 40;
            }
        }
        
        // Město (30%)
        if (city && record.city) {
            if (removeDiacritics(record.city.toLowerCase()) === removeDiacritics(city.toLowerCase())) {
                score += 30;
            } else if (record.city.toLowerCase().includes(city.toLowerCase()) || 
                       city.toLowerCase().includes(record.city.toLowerCase())) {
                score += 15;
            }
        }
        
        // Kategorie (30%)
        if (category && record.category) {
            if (record.category === category) {
                score += 30;
            }
        }
        
        return {
            ...record,
            similarityScore: score
        };
    })
    .filter(record => record.similarityScore > 20) // Minimální podobnost
    .sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Summary statistiky
    let summary = null;
    if (matches.length > 0) {
        const sales = matches.map(m => m.sales);
        summary = {
            count: matches.length,
            avgSales: sales.reduce((sum, s) => sum + s, 0) / sales.length,
            maxSales: Math.max(...sales),
            minSales: Math.min(...sales)
        };
    }
    
    return {
        matches: matches.slice(0, 10), // Top 10 matches
        summary: summary
    };
}

// Zobrazení historických dat v UI
function displayHistoricalData(historicalData, formData) {
    const historicalCard = document.getElementById('historicalCard');
    const historicalDiv = document.getElementById('historicalData');
    
    if (!historicalData.matches || historicalData.matches.length === 0) {
        if (historicalCard) historicalCard.style.display = 'none';
        return;
    }
    
    if (historicalCard) historicalCard.style.display = 'block';
    
    const topMatches = historicalData.matches.slice(0, 5);
    
    let html = '';
    
    if (historicalData.summary) {
        html += `
            <div class="historical-summary" style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4>📊 Shrnutí podobných akcí (${historicalData.summary.count} akcí)</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-top: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #1976d2;">${Math.round(historicalData.summary.avgSales)}</div>
                        <div style="font-size: 0.9em; color: #666;">Průměrný prodej</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #388e3c;">${historicalData.summary.maxSales}</div>
                        <div style="font-size: 0.9em; color: #666;">Nejlepší výsledek</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #f57c00;">${historicalData.summary.minSales}</div>
                        <div style="font-size: 0.9em; color: #666;">Nejhorší výsledek</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '<h4>🔍 Nejpodobnější akce:</h4>';
    
    topMatches.forEach((match, index) => {
        const sales = match.sales || 0;
        const eventName = match.eventName || 'Neznámá akce';
        const city = match.city || 'Neznámé město';
        const date = match.dateTo || match.dateFrom || 'Neznámé datum';
        const visitors = match.visitors || 0;
        const conversion = visitors > 0 ? ((sales / visitors) * 100).toFixed(1) : '0';
        
        html += `
            <div class="historical-item">
                <div class="historical-info">
                    <h4>${escapeHtml(eventName)}</h4>
                    <p>${escapeHtml(city)} • ${formatDate(date)} • ${formatNumber(visitors)} návštěvníků</p>
                    <p style="color: #666; font-size: 0.8em;">Podobnost: ${'★'.repeat(Math.min(5, Math.max(1, Math.round(match.similarityScore / 20))))}${'☆'.repeat(5 - Math.min(5, Math.max(1, Math.round(match.similarityScore / 20))))}</p>
                </div>
                <div class="historical-stats">
                    <div class="historical-sales">${formatNumber(sales)} ks</div>
                    <div style="font-size: 0.9em; color: #666;">${conversion}% konverze</div>
                </div>
            </div>
        `;
    });
    
    if (historicalDiv) {
        historicalDiv.innerHTML = html;
    }
    
    console.log(`📈 Historical data displayed: ${topMatches.length} matches`);
}

// ========================================
// EVENT LISTENERS PRO PART 2A
// ========================================

// Event listenery pro automatické spouštění funkcí
eventBus.on('cityChanged', (data) => {
    console.log('🏙️ City changed, updating distance');
    updateDistance();
});

eventBus.on('formChanged', (formData) => {
    console.log('📝 Form changed, updating historical data');
    updateHistoricalDisplay();
});

eventBus.on('placeSelected', (place) => {
    console.log('📍 Place selected from Google Maps:', place.name);
    
    // Auto-trigger distance calculation
    setTimeout(() => {
        updateDistance();
    }, 500);
});

eventBus.on('dataLoadRequested', () => {
    loadData();
});

eventBus.on('dataReloadRequested', () => {
    loadData();
});

eventBus.on('autoDataLoadRequested', () => {
    loadData().catch(error => {
        console.warn('⚠️ Automatic data loading failed:', error);
        showNotification('Automatické načtení dat selhalo. Zkuste tlačítko "Načíst data".', 'warning', 8000);
    });
});

// ========================================
// FINALIZACE PART 2A
// ========================================

console.log('✅ Donuland Part 2A loaded successfully');
console.log('📊 Features: ✅ Data Loading ✅ Distance Calculation ✅ Historical Analysis');
console.log('⏳ Ready for Part 2B: Weather API + AI Prediction');

// Event pro signalizaci dokončení části 2A
eventBus.emit('part2aLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['data-loading', 'distance-calculation', 'historical-analysis']
});
/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 2B
   Weather API pro vícedenní akce + AI Prediction
   ======================================== */

console.log('🍩 Donuland Part 2B loading...');

// ========================================
// WEATHER API PRO VÍCEDENNÍ AKCE
// ========================================

// Hlavní funkce pro aktualizace počasí
async function updateWeather() {
    const city = document.getElementById('city').value.trim();
    const dateFrom = document.getElementById('eventDateFrom').value;
    const dateTo = document.getElementById('eventDateTo').value;
    
    if (!city || !dateFrom || !dateTo) {
        console.log('⚠️ City or dates missing for weather update');
        return;
    }
    
    // Pouze pro outdoor akce
    const eventType = document.getElementById('eventType').value;
    if (eventType !== 'outdoor') {
        console.log('📍 Indoor event, skipping weather');
        return;
    }
    
    if (globalState.isLoadingWeather) {
        console.log('⚠️ Weather loading already in progress');
        return;
    }
    
    globalState.isLoadingWeather = true;
    
    try {
        console.log(`🌤️ Loading weather for ${city} from ${dateFrom} to ${dateTo}`);
        
        // Načtení počasí pro celou dobu akce
        const weatherData = await fetchMultiDayWeatherData(city, dateFrom, dateTo);
        
        // Agregace počasí pro celou akce
        const aggregatedWeather = aggregateWeatherData(weatherData);
        
        // Zobrazení v UI
        displayMultiDayWeather(weatherData, aggregatedWeather);
        
        // Uložení pro predikci
        globalState.lastWeatherData = {
            daily: weatherData,
            aggregated: aggregatedWeather,
            timestamp: Date.now()
        };
        
        // Emit event pro predikci
        eventBus.emit('weatherLoaded', aggregatedWeather);
        
        console.log('✅ Multi-day weather loaded successfully');
        
    } catch (error) {
        console.error('❌ Weather loading failed:', error);
        showNotification(`⚠️ Nepodařilo se načíst počasí: ${error.message}`, 'warning');
        
        // Zobrazit fallback počasí
        displayFallbackWeather(city, dateFrom, dateTo);
        
    } finally {
        globalState.isLoadingWeather = false;
    }
}

// Načtení počasí pro vícedenní akci
async function fetchMultiDayWeatherData(city, dateFrom, dateTo) {
    const apiKey = document.getElementById('weatherKey')?.value || CONFIG.WEATHER_API_KEY;
    
    if (!apiKey || apiKey === 'demo') {
        throw new Error('Weather API klíč není nastaven');
    }
    
    // Vytvoření seznamu dnů
    const days = getDateRange(dateFrom, dateTo);
    console.log(`📅 Fetching weather for ${days.length} days:`, days);
    
    const weatherPromises = days.map(async (date, index) => {
        const cacheKey = `${city}-${date}`;
        
        // Check cache
        const cached = globalState.weatherCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CONFIG.WEATHER_CACHE_TIME) {
            console.log(`📦 Using cached weather for ${date}`);
            return { date, ...cached.data };
        }
        
        try {
            const today = new Date();
            const eventDate = new Date(date);
            const daysDiff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
            
            let weather;
            
            if (daysDiff > 5) {
                // Pro vzdálené budoucí akce použijeme sezónní odhad
                weather = generateSeasonalWeather(city, eventDate);
            } else if (daysDiff >= 0) {
                // Předpověď pro následujících 5 dní
                weather = await fetchWeatherForecast(city, apiKey, daysDiff);
            } else {
                // Historické datum - sezónní odhad
                weather = generateSeasonalWeather(city, eventDate);
            }
            
            // Cache result
            globalState.weatherCache.set(cacheKey, {
                data: weather,
                timestamp: Date.now()
            });
            
            return { date, ...weather };
            
        } catch (error) {
            console.warn(`⚠️ Weather for ${date} failed, using seasonal fallback`);
            const fallback = generateSeasonalWeather(city, new Date(date));
            return { date, ...fallback, isFallback: true };
        }
    });
    
    const results = await Promise.all(weatherPromises);
    return results;
}

// Vytvoření rozsahu dat
function getDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);
    
    while (currentDate <= lastDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

// Načtení předpovědi počasí pro konkrétní den
async function fetchWeatherForecast(city, apiKey, daysAhead) {
    const url = daysAhead === 0 
        ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=cs`
        : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=cs`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (daysAhead === 0) {
            // Aktuální počasí
            return {
                main: data.weather[0].main,
                description: data.weather[0].description,
                temp: Math.round(data.main.temp),
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                windSpeed: data.wind?.speed || 0,
                icon: data.weather[0].icon,
                isFallback: false
            };
        } else {
            // Předpověď - najít nejbližší den
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + daysAhead);
            
            const forecast = data.list.find(item => {
                const itemDate = new Date(item.dt * 1000);
                return itemDate.getDate() === targetDate.getDate();
            });
            
            if (forecast) {
                return {
                    main: forecast.weather[0].main,
                    description: forecast.weather[0].description,
                    temp: Math.round(forecast.main.temp),
                    humidity: forecast.main.humidity,
                    pressure: forecast.main.pressure,
                    windSpeed: forecast.wind?.speed || 0,
                    icon: forecast.weather[0].icon,
                    isFallback: false
                };
            } else {
                throw new Error('Forecast data not found');
            }
        }
        
    } catch (error) {
        console.error('Weather API error:', error);
        throw error;
    }
}

// Generování sezónního počasí
function generateSeasonalWeather(city, date) {
    const month = date.getMonth();
    
    // Sezónní průměry pro ČR
    const seasonalData = {
        temp: [0, 2, 7, 13, 18, 21, 23, 22, 18, 12, 6, 2][month],
        weather: month >= 5 && month <= 8 ? 'Clear' : month >= 11 || month <= 2 ? 'Clouds' : 'Clouds'
    };
    
    return {
        main: seasonalData.weather,
        description: seasonalData.weather === 'Clear' ? 'jasno' : 'oblačno',
        temp: seasonalData.temp + Math.round((Math.random() - 0.5) * 8), // ±4°C variace
        humidity: 60 + Math.round((Math.random() - 0.5) * 30),
        pressure: 1013 + Math.round((Math.random() - 0.5) * 40),
        windSpeed: 2 + Math.random() * 4,
        icon: seasonalData.weather === 'Clear' ? '01d' : '03d',
        isFallback: true
    };
}

// Agregace počasí pro celou akci
function aggregateWeatherData(dailyWeather) {
    if (!dailyWeather || dailyWeather.length === 0) {
        return null;
    }
    
    // Průměrná teplota
    const avgTemp = Math.round(
        dailyWeather.reduce((sum, day) => sum + day.temp, 0) / dailyWeather.length
    );
    
    // Nejhorší počasí rozhoduje (priorita: bouřka > déšť > sníh > oblačno > jasno)
    const weatherPriority = {
        'Thunderstorm': 5,
        'Rain': 4,
        'Drizzle': 3,
        'Snow': 3,
        'Clouds': 2,
        'Clear': 1
    };
    
    const worstWeather = dailyWeather.reduce((worst, day) => {
        const dayPriority = weatherPriority[day.main] || 1;
        const worstPriority = weatherPriority[worst.main] || 1;
        return dayPriority > worstPriority ? day : worst;
    });
    
    // Průměrná vlhkost a tlak
    const avgHumidity = Math.round(
        dailyWeather.reduce((sum, day) => sum + day.humidity, 0) / dailyWeather.length
    );
    
    const avgPressure = Math.round(
        dailyWeather.reduce((sum, day) => sum + day.pressure, 0) / dailyWeather.length
    );
    
    // Nejvyšší rychlost větru
    const maxWindSpeed = Math.max(...dailyWeather.map(day => day.windSpeed));
    
    // Počet problematických dnů pro čokoládové donuty
    const badWeatherDays = dailyWeather.filter(day => 
        day.main === 'Rain' || day.main === 'Thunderstorm' || day.temp < 5 || day.temp > 24
    ).length;
    
    return {
        avgTemp: avgTemp,
        main: worstWeather.main,
        description: worstWeather.description,
        humidity: avgHumidity,
        pressure: avgPressure,
        windSpeed: maxWindSpeed,
        icon: worstWeather.icon,
        badWeatherDays: badWeatherDays,
        totalDays: dailyWeather.length,
        isFallback: dailyWeather.some(day => day.isFallback)
    };
}

// Zobrazení vícedenního počasí v UI
function displayMultiDayWeather(dailyWeather, aggregatedWeather) {
    const weatherDisplay = document.getElementById('weatherDisplay');
    const weatherCard = document.getElementById('weatherCard');
    
    if (!weatherDisplay || !weatherCard) return;
    
    weatherCard.style.display = 'block';
    
    // Ikona podle agregovaného počasí
    let icon = '☀️';
    if (aggregatedWeather.main === 'Clouds') icon = '☁️';
    else if (aggregatedWeather.main === 'Rain') icon = '🌧️';
    else if (aggregatedWeather.main === 'Drizzle') icon = '🌦️';
    else if (aggregatedWeather.main === 'Snow') icon = '❄️';
    else if (aggregatedWeather.main === 'Thunderstorm') icon = '⛈️';
    else if (aggregatedWeather.main === 'Clear') icon = '☀️';
    
    // Výpočet weather faktoru pro čokoládové donuty
    const impact = getChocolateWeatherImpactFactor(aggregatedWeather);
    let impactText = 'Neutrální vliv na prodej';
    let impactColor = '#666';
    
    if (impact > 1.05) {
        impactText = 'Pozitivní vliv na prodej';
        impactColor = '#28a745';
    } else if (impact < 0.85) {
        impactText = 'Negativní vliv na prodej';
        impactColor = '#dc3545';
    }
    
    // Varování před problematickým počasím
    let warningHtml = '';
    if (aggregatedWeather.badWeatherDays > 0) {
        const badDaysText = aggregatedWeather.badWeatherDays === 1 ? 'den' : 
                           aggregatedWeather.badWeatherDays < 5 ? 'dny' : 'dnů';
        
        warningHtml = `
            <div class="weather-warning">
                ⚠️ <strong>Varování:</strong> ${aggregatedWeather.badWeatherDays} ${badDaysText} z ${aggregatedWeather.totalDays} 
                má nepříznivé počasí pro prodej čokoládových donutů. 
                ${aggregatedWeather.avgTemp > 24 ? 'Vysoké teploty způsobí tání čokolády!' : ''}
                ${aggregatedWeather.main === 'Rain' || aggregatedWeather.main === 'Thunderstorm' ? 'Déšť sníží návštěvnost!' : ''}
            </div>
        `;
    }
    
    // Denní rozpis počasí
    let dailyHtml = '<div class="daily-weather-container" style="margin-top: 15px;">';
    dailyHtml += '<h5 style="margin-bottom: 10px;">📅 Denní předpověď:</h5>';
    dailyHtml += '<div style="display: flex; gap: 10px; overflow-x: auto; padding: 5px 0;">';
    
    dailyWeather.forEach(day => {
        const dayDate = new Date(day.date);
        const dayName = dayDate.toLocaleDateString('cs-CZ', { weekday: 'short' });
        const dayIcon = getWeatherIcon(day.main);
        
        // Barevné označení podle teploty pro čokoládu
        let tempColor = '#333';
        if (day.temp < 5) tempColor = '#3498db'; // Modrá - studeno
        else if (day.temp >= 18 && day.temp <= 24) tempColor = '#27ae60'; // Zelená - ideální
        else if (day.temp > 24) tempColor = '#e74c3c'; // Červená - horko (taje čokoláda)
        
        dailyHtml += `
            <div style="text-align: center; min-width: 80px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <div style="font-weight: bold; font-size: 0.9em;">${dayName}</div>
                <div style="font-size: 1.5em; margin: 5px 0;">${dayIcon}</div>
                <div style="font-weight: bold; color: ${tempColor};">${day.temp}°C</div>
                <div style="font-size: 0.8em; opacity: 0.8;">${day.description}</div>
                ${day.isFallback ? '<div style="font-size: 0.7em; opacity: 0.6;">*odhad</div>' : ''}
            </div>
        `;
    });
    
    dailyHtml += '</div></div>';
    
    const html = `
        <div class="weather-card">
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${aggregatedWeather.avgTemp}°C</div>
            <div class="weather-desc">Průměr ${aggregatedWeather.totalDays} dnů - ${aggregatedWeather.description}</div>
            
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-value">${aggregatedWeather.humidity}%</div>
                    <div class="weather-detail-label">Vlhkost</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-value">${Math.round(aggregatedWeather.windSpeed)} m/s</div>
                    <div class="weather-detail-label">Max vítr</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-value">${aggregatedWeather.pressure} hPa</div>
                    <div class="weather-detail-label">Tlak</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-value" style="color: ${impactColor};">${((impact - 1) * 100).toFixed(0)}%</div>
                    <div class="weather-detail-label">Vliv na prodej</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 15px; color: ${impactColor}; font-weight: 600;">
                ${impactText}
            </div>
            
            ${aggregatedWeather.isFallback ? '<div style="text-align: center; margin-top: 10px; font-size: 0.9em; opacity: 0.8;">⚠️ Obsahuje sezónní odhady</div>' : ''}
            
            ${warningHtml}
            
            ${dailyHtml}
        </div>
    `;
    
    weatherDisplay.innerHTML = html;
    
    console.log('🌤️ Multi-day weather displayed:', aggregatedWeather);
}

// Získání ikony podle počasí
function getWeatherIcon(main) {
    switch (main) {
        case 'Clear': return '☀️';
        case 'Clouds': return '☁️';
        case 'Rain': return '🌧️';
        case 'Drizzle': return '🌦️';
        case 'Snow': return '❄️';
        case 'Thunderstorm': return '⛈️';
        default: return '🌤️';
    }
}

// OPRAVENÝ výpočet vlivu počasí na prodej čokoládových donutů
function getChocolateWeatherImpactFactor(weather) {
    let factor = 1.0;
    
    // KRITICKÉ: Vliv teploty na čokoládové donuty
    if (weather.avgTemp >= 18 && weather.avgTemp <= 24) {
        factor *= 1.20; // IDEÁLNÍ teplota pro čokoládu (18-24°C)
    } else if (weather.avgTemp >= 15 && weather.avgTemp <= 27) {
        factor *= 1.05; // Přijatelná teplota
    } else if (weather.avgTemp > 24 && weather.avgTemp <= 27) {
        factor *= 0.85; // Začíná být problém s čokoládou
    } else if (weather.avgTemp > 27) {
        factor *= 0.60; // PROBLÉM: Čokoláda se začíná tavit
    } else if (weather.avgTemp > 30) {
        factor *= 0.40; // KRITICKÉ: Čokoláda se taje, rychlá zkáza
    } else if (weather.avgTemp < 5) {
        factor *= 0.75; // Studeno - lidé nechtějí sladké
    } else {
        factor *= 0.90; // Chladnější, ale ok
    }
    
    // Vliv počasí na návštěvnost
    switch (weather.main) {
        case 'Clear':
            factor *= 1.15; // Krásné počasí
            break;
        case 'Clouds':
            factor *= 0.95; // Oblačno - mírně horší
            break;
        case 'Rain':
        case 'Drizzle':
            factor *= 0.55; // Déšť - významně méně lidí
            break;
        case 'Thunderstorm':
            factor *= 0.35; // Bouřka - velmi málo lidí
            break;
        case 'Snow':
            factor *= 0.50; // Sníh - málo lidí venku
            break;
    }
    
    // Vliv větru
    if (weather.windSpeed > 8) {
        factor *= 0.80; // Silný vítr - nepříjemné pro venkovní akce
    }
    
    // Penalizace za více špatných dnů
    if (weather.badWeatherDays > 0) {
        const badDaysRatio = weather.badWeatherDays / weather.totalDays;
        factor *= (1 - badDaysRatio * 0.3); // Až -30% za 100% špatných dnů
    }
    
    return Math.max(0.2, Math.min(1.5, factor)); // Omezení na 20%-150%
}

// Zobrazení fallback počasí pro vícedenní akci
function displayFallbackWeather(city, dateFrom, dateTo) {
    const days = getDateRange(dateFrom, dateTo);
    const fallbackDaily = days.map(date => ({
        date,
        ...generateSeasonalWeather(city, new Date(date)),
        isFallback: true
    }));
    
    const aggregated = aggregateWeatherData(fallbackDaily);
    displayMultiDayWeather(fallbackDaily, aggregated);
    
    // Uložení fallback dat
    globalState.lastWeatherData = {
        daily: fallbackDaily,
        aggregated: aggregated,
        timestamp: Date.now()
    };
}

// ========================================
// AI PREDIKČNÍ ALGORITMUS
// ========================================

// Hlavní funkce pro predikci
function calculatePrediction(formData) {
    console.log('🤖 Calculating AI prediction...');
    
    performanceMonitor.start('prediction');
    
    try {
        // 1. Základní faktory
        const baseConversion = getBaseCategoryFactor(formData.category);
        
        // 2. Historické faktory
        const historicalFactor = getHistoricalFactor(formData);
        
        // 3. Městský faktor
        const cityFactor = getCityFactor(formData.city);
        
        // 4. Faktor konkurence
        const competitionFactor = getCompetitionFactor(formData.competition);
        
        // 5. Sezónní faktor
        const seasonalFactor = getSeasonalFactor(formData.eventDateFrom);
        
        // 6. Faktor velikosti akce
        const sizeFactor = getSizeFactor(formData.visitors);
        
        // 7. Weather faktor (pokud je outdoor) - OPRAVENÝ pro čokoládu
        let weatherFactor = 1.0;
        if (formData.eventType === 'outdoor' && globalState.lastWeatherData) {
            weatherFactor = getChocolateWeatherImpactFactor(globalState.lastWeatherData.aggregated);
        }
        
        // 8. Faktor délky akce
        const durationFactor = getDurationFactor(formData.durationDays || 1);
        
        // Finální výpočet
        const finalConversion = Math.min(CONFIG.MAX_CONVERSION, 
            Math.max(CONFIG.MIN_CONVERSION, 
                baseConversion * historicalFactor * cityFactor * competitionFactor * 
                seasonalFactor * sizeFactor * weatherFactor * durationFactor
            )
        );
        
        const predictedSales = Math.max(CONFIG.MIN_SALES, 
            Math.round(formData.visitors * finalConversion)
        );
        
        // Confidence calculation
        const confidence = calculateConfidence(formData, {
            historical: historicalFactor,
            weather: weatherFactor,
            base: baseConversion
        });
        
        const result = {
            predictedSales: predictedSales,
            confidence: confidence,
            factors: {
                base: baseConversion,
                historical: historicalFactor,
                city: cityFactor,
                competition: competitionFactor,
                seasonal: seasonalFactor,
                size: sizeFactor,
                weather: weatherFactor,
                duration: durationFactor,
                final: finalConversion
            },
            metadata: {
                algorithm: 'v2.1-chocolate',
                timestamp: new Date().toISOString(),
                dataPoints: globalState.historicalData.length,
                weatherDays: globalState.lastWeatherData ? globalState.lastWeatherData.daily.length : 0
            }
        };
        
        console.log('🎯 Prediction result:', result);
        performanceMonitor.end('prediction');
        
        return result;
        
    } catch (error) {
        console.error('❌ Prediction calculation error:', error);
        performanceMonitor.end('prediction');
        
        globalState.errors.push({
            type: 'prediction',
            message: error.message,
            timestamp: new Date().toISOString()
        });
        
        // Fallback predikce
        return {
            predictedSales: Math.round(formData.visitors * 0.1),
            confidence: 30,
            factors: {
                base: 0.1,
                historical: 1.0,
                city: 1.0,
                competition: 1.0,
                seasonal: 1.0,
                size: 1.0,
                weather: 1.0,
                duration: 1.0,
                final: 0.1
            },
            metadata: {
                algorithm: 'fallback',
                timestamp: new Date().toISOString(),
                error: error.message
            }
        };
    }
}

// Získání základního faktoru kategorie
function getBaseCategoryFactor(category) {
    return CONFIG.CATEGORY_FACTORS[category] || CONFIG.CATEGORY_FACTORS['ostatní'];
}

// Historický faktor na základě podobných akcí
function getHistoricalFactor(formData) {
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return 1.0; // Neutral pokud nejsou data
    }
    
    // Najít podobné akce
    const similarEvents = findSimilarEvents(formData);
    
    if (similarEvents.length === 0) {
        return 1.0;
    }
    
    // Vypočítat průměrnou konverzi podobných akcí
    const avgConversion = similarEvents.reduce((sum, event) => {
        return sum + (event.sales / event.visitors);
    }, 0) / similarEvents.length;
    
    const baseConversion = getBaseCategoryFactor(formData.category);
    
    // Poměr skutečné vs očekávané konverze
    return Math.max(0.5, Math.min(2.0, avgConversion / baseConversion));
}

// Najít podobné akce v historických datech
function findSimilarEvents(formData) {
    return globalState.historicalData.filter(event => {
        let score = 0;
        
        // Kategorie (nejvyšší váha)
        if (event.category === formData.category) score += 40;
        
        // Město
        if (removeDiacritics(event.city.toLowerCase()) === removeDiacritics(formData.city.toLowerCase())) {
            score += 30;
        }
        
        // Podobná velikost (±50%)
        if (event.visitors > 0) {
            const sizeDiff = Math.abs(event.visitors - formData.visitors) / formData.visitors;
            if (sizeDiff <= 0.5) score += 20;
            else if (sizeDiff <= 1.0) score += 10;
        }
        
        // Podobná sezóna (±2 měsíce)
        if (event.dateFrom) {
            const eventMonth = new Date(event.dateFrom).getMonth();
            const formMonth = new Date(formData.eventDateFrom).getMonth();
            const monthDiff = Math.abs(eventMonth - formMonth);
            if (monthDiff <= 2 || monthDiff >= 10) score += 10; // 10 = 12-2 pro December-February
        }
        
        return score >= 50; // Minimální podobnost 50%
    });
}

// Městský faktor
function getCityFactor(city) {
    const cityKey = removeDiacritics(city.toLowerCase());
    
    for (const [configCity, factor] of Object.entries(CONFIG.CITY_FACTORS)) {
        if (configCity === 'default') continue;
        
        if (cityKey.includes(configCity) || configCity.includes(cityKey)) {
            return factor;
        }
    }
    
    return CONFIG.CITY_FACTORS['default'];
}

// Faktor konkurence
function getCompetitionFactor(competition) {
    return CONFIG.COMPETITION_FACTORS[competition] || CONFIG.COMPETITION_FACTORS[2];
}

// Sezónní faktor
function getSeasonalFactor(dateStr) {
    if (!dateStr) return 1.0;
    
    const date = new Date(dateStr);
    const month = date.getMonth();
    
    // Sezónní faktory pro food business (0 = leden)
    const seasonalFactors = {
        0: 0.7,   // Leden - nízká aktivita
        1: 0.8,   // Únor
        2: 0.9,   // Březen - začátek sezóny
        3: 1.1,   // Duben
        4: 1.2,   // Květen - vysoká sezóna začíná
        5: 1.3,   // Červen - peak sezóna
        6: 1.3,   // Červenec - peak sezóna
        7: 1.3,   // Srpen - peak sezóna
        8: 1.1,   // Září - konec peak sezóny
        9: 1.0,   // Říjen
        10: 0.8,  // Listopad
        11: 0.9   // Prosinec - vánoční trhy
    };
    
    return seasonalFactors[month] || 1.0;
}

// Faktor velikosti akce
function getSizeFactor(visitors) {
    if (visitors < 500) return 0.8;        // Malé akce - nižší konverze
    if (visitors < 2000) return 1.0;       // Střední akce - normální konverze
    if (visitors < 10000) return 1.1;      // Velké akce - vyšší konverze
    return 1.2;                            // Mega akce - nejvyšší konverze
}

// Faktor délky akce
function getDurationFactor(durationDays) {
    if (durationDays <= 1) return 1.0;      // Jednodenní akce
    if (durationDays === 2) return 1.3;     // Víkendové akce
    if (durationDays === 3) return 1.5;     // Prodloužený víkend
    return 1.7;                              // Dlouhé festivaly
}

// Výpočet confidence
function calculateConfidence(formData, factors) {
    let confidence = 50; // Základní confidence
    
    // Historická data zvyšují confidence
    const similarEvents = findSimilarEvents(formData);
    if (similarEvents.length >= 5) confidence += 30;
    else if (similarEvents.length >= 2) confidence += 20;
    else if (similarEvents.length >= 1) confidence += 10;
    
    // Stabilní faktory zvyšují confidence
    if (factors.historical >= 0.8 && factors.historical <= 1.2) confidence += 10;
    if (factors.weather >= 0.9 && factors.weather <= 1.1) confidence += 5;
    
    // Počasí data zvyšují confidence
    if (globalState.lastWeatherData && !globalState.lastWeatherData.aggregated.isFallback) {
        confidence += 15; // Skutečná data z API
    }
    
    // Extrémní hodnoty snižují confidence
    if (formData.visitors > 50000 || formData.visitors < 100) confidence -= 15;
    if (factors.base < 0.05 || factors.base > 0.25) confidence -= 10;
    
    return Math.max(20, Math.min(95, confidence));
}

// ========================================
// BUSINESS METRICS CALCULATION
// ========================================

// Výpočet business metrik
function calculateBusinessMetrics(formData, prediction) {
    console.log('💼 Calculating business metrics...');
    
    const sales = prediction.predictedSales;
    const price = formData.price;
    const businessModel = formData.businessModel;
    
    // Základní obrat
    const revenue = sales * price;
    
    // Náklady podle business modelu
    let costs = {
        production: 0,
        labor: 0,
        transport: 0,
        rent: 0,
        revenueShare: 0
    };
    
    // Dopravní náklady
    const distanceKm = extractDistanceNumber(formData.distance);
    costs.transport = distanceKm * CONFIG.FUEL_COST * 2; // Tam a zpět
    
    // Náklady podle business modelu
    switch (businessModel) {
        case 'owner':
            costs.production = sales * CONFIG.DONUT_COST;
            costs.labor = 3 * CONFIG.HOURLY_WAGE * CONFIG.WORK_HOURS; // Vy + 2 brigádníci
            break;
            
        case 'employee':
            costs.production = sales * CONFIG.DONUT_COST;
            costs.labor = 2 * CONFIG.HOURLY_WAGE * CONFIG.WORK_HOURS; // Vy + 1 brigádník
            costs.revenueShare = revenue * 0.05; // 5% z obratu
            break;
            
        case 'franchise':
            costs.production = sales * CONFIG.FRANCHISE_PRICE; // Franšízová cena
            costs.labor = 0; // Bez mzdových nákladů
            break;
    }
    
    // Nájem podle typu
    costs.rent = calculateRentCost(formData, revenue);
    
    // Celkové náklady
    const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    
    // Zisk
    const profit = revenue - totalCosts;
    
    // ROI calculation
    const investment = costs.production + costs.labor + costs.transport + costs.rent;
    const roi = investment > 0 ? ((profit / investment) * 100) : 0;
    
    // Margin calculation
    const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;
    
    return {
        revenue: revenue,
        costs: costs,
        totalCosts: totalCosts,
        profit: profit,
        roi: roi,
        margin: margin,
        breakeven: Math.ceil(totalCosts / price), // Kolik ks na break-even
        metadata: {
            businessModel: businessModel,
            pricePerUnit: price,
            unitsRequired: sales,
            timestamp: new Date().toISOString()
        }
    };
}

// Výpočet nákladů na nájem
function calculateRentCost(formData, revenue) {
    const rentType = formData.rentType;
    
    switch (rentType) {
        case 'fixed':
            return formData.fixedRent || 0;
            
        case 'percentage':
            return revenue * ((formData.percentage || 0) / 100);
            
        case 'mixed':
            const fixed = formData.mixedFixed || 0;
            const percentage = revenue * ((formData.mixedPercentage || 0) / 100);
            return fixed + percentage;
            
        case 'free':
        default:
            return 0;
    }
}

// Extrakce čísla vzdálenosti z textu
function extractDistanceNumber(distanceText) {
    if (!distanceText) return 150; // Default
    
    const match = distanceText.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 150;
}

// ========================================
// MAIN PREDICTION FUNCTION
// ========================================

// Hlavní funkce pro aktualizaci predikce
function updatePrediction() {
    console.log('🔄 Updating prediction...');
    
    if (globalState.isLoadingPrediction) {
        console.log('⚠️ Prediction already in progress');
        return;
    }
    
    const validation = validateRequiredFields();
    if (!validation.valid) {
        console.log('⚠️ Form validation failed:', validation.errors);
        return;
    }
    
    globalState.isLoadingPrediction = true;
    
    try {
        const formData = gatherFormData();
        
        // Výpočet predikce
        const prediction = calculatePrediction(formData);
        
        // Výpočet business metrik
        const businessResults = calculateBusinessMetrics(formData, prediction);
        
        // Uložení výsledků
        globalState.lastPrediction = {
            formData: formData,
            prediction: prediction,
            businessResults: businessResults,
            timestamp: Date.now(),
            saved: false
        };
        
        // Zobrazení výsledků - bude implementováno v part3
        eventBus.emit('predictionCalculated', {
            formData: formData,
            prediction: prediction,
            businessResults: businessResults
        });
        
        // Zobrazení action buttons
        const actionButtons = document.getElementById('actionButtons');
        if (actionButtons) {
            actionButtons.style.display = 'block';
        }
        
        console.log('✅ Prediction updated successfully');
        
    } catch (error) {
        console.error('❌ Prediction update failed:', error);
        showNotification(`❌ Chyba při výpočtu predikce: ${error.message}`, 'error');
        
    } finally {
        globalState.isLoadingPrediction = false;
    }
}

// ========================================
// EVENT LISTENERS PRO PART 2B
// ========================================

// Event listenery pro weather a predikci
eventBus.on('cityChanged', (data) => {
    console.log('🏙️ City changed, updating weather');
    updateWeather();
});

eventBus.on('dateChanged', () => {
    console.log('📅 Date changed, updating weather');
    updateWeather();
});

eventBus.on('formChanged', (formData) => {
    console.log('📝 Form changed, updating prediction');
    
    // Trigger predikce
    if (validateRequiredFields().valid) {
        updatePrediction();
    }
});

eventBus.on('placeSelected', (place) => {
    console.log('📍 Place selected, updating weather');
    
    // Auto-trigger weather loading
    setTimeout(() => {
        updateWeather();
    }, 500);
});

eventBus.on('weatherUpdateRequested', (data) => {
    updateWeather();
});

eventBus.on('weatherLoaded', (weatherData) => {
    console.log('🌤️ Weather loaded, triggering prediction update');
    
    // Aktualizace predikce při načtení počasí
    if (validateRequiredFields().valid) {
        updatePrediction();
    }
});

eventBus.on('eventTypeChanged', (data) => {
    console.log('🏢 Event type changed:', data.type);
    
    if (data.type === 'outdoor') {
        // Načtení počasí pro outdoor akce
        const city = document.getElementById('city').value;
        const dateFrom = document.getElementById('eventDateFrom').value;
        
        if (city && dateFrom) {
            updateWeather();
        }
    } else {
        // Vymazání weather dat pro indoor akce
        globalState.lastWeatherData = null;
        
        // Aktualizace predikce bez weather faktoru
        if (validateRequiredFields().valid) {
            updatePrediction();
        }
    }
});

// ========================================
// POMOCNÉ FUNKCE PRO BUSINESS LOGIC
// ========================================

// Získání posledního weather faktoru pro predikci
function getLastWeatherFactor() {
    if (globalState.lastWeatherData && globalState.lastWeatherData.aggregated) {
        return getChocolateWeatherImpactFactor(globalState.lastWeatherData.aggregated);
    }
    return 1.0; // Neutrální pokud není počasí
}

// Kontrola zda jsou potřeba počasí data
function needsWeatherData() {
    const eventType = document.getElementById('eventType').value;
    const city = document.getElementById('city').value;
    const dateFrom = document.getElementById('eventDateFrom').value;
    
    return eventType === 'outdoor' && city && dateFrom;
}

// Automatická aktualizace při změně event type
function updateWeatherCard() {
    const eventType = document.getElementById('eventType').value;
    const weatherCard = document.getElementById('weatherCard');
    
    if (!weatherCard) return;
    
    if (eventType === 'outdoor') {
        weatherCard.style.display = 'block';
        
        // Zkusit načíst počasí pokud jsou vyplněny údaje
        if (needsWeatherData()) {
            updateWeather();
        }
    } else {
        weatherCard.style.display = 'none';
        
        // Vymazat weather data
        globalState.lastWeatherData = null;
    }
    
    console.log(`🌤️ Event type changed to: ${eventType}`);
}

// Zobrazení základní předpovědi počasí (fallback)
function displayFallbackWeather(city, dateFrom, dateTo) {
    const days = getDateRange(dateFrom, dateTo);
    const fallbackDaily = days.map(date => ({
        date,
        ...generateSeasonalWeather(city, new Date(date)),
        isFallback: true
    }));
    
    const aggregated = aggregateWeatherData(fallbackDaily);
    displayMultiDayWeather(fallbackDaily, aggregated);
    
    // Uložení fallback dat pro predikci
    globalState.lastWeatherData = {
        daily: fallbackDaily,
        aggregated: aggregated,
        timestamp: Date.now()
    };
    
    showNotification('⚠️ Použity sezónní odhady počasí', 'warning', 3000);
}

// ========================================
// FINALIZACE PART 2B
// ========================================

console.log('✅ Donuland Part 2B loaded successfully');
console.log('🌤️ Features: ✅ Multi-day Weather ✅ Chocolate Temperature Logic ✅ AI Prediction ✅ Business Metrics');
console.log('🎯 Weather factors: 18-24°C = ideal, >24°C = chocolate melting problem');
console.log('⏳ Ready for Part 3: UI Display & Results Visualization');

// Event pro signalizaci dokončení části 2B
eventBus.emit('part2bLoaded', { 
    timestamp: Date.now(),
    version: '1.1.0',
    features: ['multi-day-weather', 'chocolate-temperature-logic', 'ai-prediction-v2', 'business-metrics']
});
