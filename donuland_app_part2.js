/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 2
   Data loading, Google Maps Distance, Weather API, AI Prediction
   ======================================== */

console.log('🍩 Donuland Part 2 loading...');

// ========================================
// GOOGLE SHEETS DATA LOADING
// ========================================

// Hlavní funkce pro načtení dat z Google Sheets
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
        
        const csvData = await fetchSheetsData();
        const parsedData = parseSheetData(csvData);
        const cleanData = validateAndCleanData(parsedData);
        
        globalState.historicalData = cleanData;
        globalState.lastDataLoad = Date.now();
        
        populateAutocompleteOptions();
        updateStatus('online', `Načteno ${cleanData.length} záznamů`);
        updateLoadButton('success');
        
        const historicalCard = document.getElementById('historicalCard');
        if (historicalCard && cleanData.length > 0) {
            historicalCard.style.display = 'block';
        }
        
        updateDataStats();
        showNotification(`✅ Úspěšně načteno ${cleanData.length} historických záznamů`, 'success', 4000);
        
        console.log(`✅ Data loaded successfully: ${cleanData.length} records`);
        performanceMonitor.end('dataLoading');
        
        eventBus.emit('dataLoaded', { 
            count: cleanData.length, 
            data: cleanData,
            timestamp: globalState.lastDataLoad
        });
        
        if (validateRequiredFields().valid) {
            eventBus.emit('triggerPrediction');
        }
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        
        updateStatus('offline', `Chyba: ${error.message}`);
        updateLoadButton('error');
        showNotification(`❌ Nepodařilo se načíst data: ${error.message}`, 'error', 8000);
        
        globalState.errors.push({
            type: 'data_loading',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            attempt: globalState.dataLoadAttempts
        });
        
        eventBus.emit('dataLoadError', {
            error: error.message,
            attempt: globalState.dataLoadAttempts
        });
        
    } finally {
        globalState.isLoading = false;
        hideLoadingOverlay();
    }
}

// Načtení dat z Google Sheets s lepším error handling
async function fetchSheetsData() {
    const sheetsUrl = document.getElementById('sheetsUrl')?.value || CONFIG.SHEETS_URL;
    
    if (!sheetsUrl) {
        throw new Error('Google Sheets URL není nastavena');
    }
    
    const sheetId = extractSheetId(sheetsUrl);
    if (!sheetId) {
        throw new Error('Neplatná Google Sheets URL');
    }
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    
    console.log('📡 Fetching data from:', csvUrl);
    
    try {
        // Přímé načtení s CORS
        const response = await fetchWithTimeout(csvUrl, {
            headers: {
                'Accept': 'text/csv',
                'User-Agent': 'Donuland-System/1.0'
            }
        }, 15000);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        if (!csvText || csvText.length < 50) {
            throw new Error('Prázdná nebo neplatná odpověď ze Sheets');
        }
        
        console.log('✅ CSV data fetched directly, length:', csvText.length);
        return csvText;
        
    } catch (error) {
        console.log('⚠️ Direct fetch failed, trying with CORS proxy...');
        
        // Fallback na CORS proxy
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`;
        
        try {
            const proxyResponse = await fetchWithTimeout(proxyUrl, {}, 20000);
            if (!proxyResponse.ok) {
                throw new Error(`Proxy request failed: ${proxyResponse.status}`);
            }
            
            const proxyData = await proxyResponse.json();
            
            if (!proxyData.contents) {
                throw new Error('Proxy vrátil prázdná data');
            }
            
            console.log('✅ Data fetched via proxy');
            return proxyData.contents;
            
        } catch (proxyError) {
            console.error('❌ Proxy fetch also failed:', proxyError);
            throw new Error(`Nepodařilo se načíst data ani přímo ani přes proxy: ${error.message}`);
        }
    }
}

// Fetch s timeout
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

// Extrakce Sheet ID z URL
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

// Parsování CSV dat ze Sheets
function parseSheetData(csvText) {
    console.log('📝 Parsing CSV data...');
    
    const lines = csvText.split('\n');
    if (lines.length < 2) {
        throw new Error('CSV neobsahuje dostatečná data');
    }
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        
        if (values.length < 10) continue;
        
        try {
            const record = {};
            
            // Mapování podle CONFIG.SHEETS_COLUMNS (A=0, B=1, C=2, ...)
            record.dateFrom = getColumnValue(values, 'B');
            record.dateTo = getColumnValue(values, 'C');
            record.city = getColumnValue(values, 'D');
            record.eventName = getColumnValue(values, 'E');
            record.category = getColumnValue(values, 'F');
            record.sales = parseFloat(getColumnValue(values, 'N')) || 0;
            record.visitors = parseFloat(getColumnValue(values, 'Q')) || 0;
            record.weather = getColumnValue(values, 'R') || '';
            record.competition = parseInt(getColumnValue(values, 'W')) || 2;
            record.rating = parseFloat(getColumnValue(values, 'X')) || 0;
            record.notes = getColumnValue(values, 'Y') || '';
            record.businessModel = getColumnValue(values, 'I');
            record.price = parseFloat(getColumnValue(values, 'L')) || 110;
            record.rent = getColumnValue(values, 'O');
            record.employees = parseInt(getColumnValue(values, 'R')) || 2;
            record.transport = parseFloat(getColumnValue(values, 'U')) || 0;
            record.otherCosts = parseFloat(getColumnValue(values, 'V')) || 0;
            
            if (record.eventName && record.city && record.dateFrom) {
                record.rowIndex = i;
                record.originalData = values;
                data.push(record);
            }
            
        } catch (error) {
            console.warn(`⚠️ Error parsing row ${i}:`, error);
            continue;
        }
    }
    
    console.log(`📊 Parsed ${data.length} records from ${lines.length - 1} lines`);
    return data;
}

// CSV line parser s podporou quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            if (line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = false;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
        
        i++;
    }
    
    result.push(current);
    return result;
}

// Získání hodnoty ze sloupce podle písmene
function getColumnValue(values, columnLetter) {
    const columnIndex = columnLetterToIndex(columnLetter);
    
    if (columnIndex < values.length) {
        let value = values[columnIndex];
        value = value.replace(/^"|"$/g, '').trim();
        return value;
    }
    
    return '';
}

// Převod písmene sloupce na index (A=0, B=1, etc.)
function columnLetterToIndex(letter) {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
        index = index * 26 + (letter.charCodeAt(i) - 65 + 1);
    }
    return index - 1;
}

// Validace a čištění dat
function validateAndCleanData(rawData) {
    console.log('🧹 Validating and cleaning data...');
    
    const cleanData = [];
    
    for (const row of rawData) {
        try {
            if (!row.eventName || !row.city || !row.dateFrom) {
                continue;
            }
            
            const cleanRow = {
                ...row,
                dateFrom: normalizeDateString(row.dateFrom),
                dateTo: normalizeDateString(row.dateTo) || normalizeDateString(row.dateFrom),
                city: normalizeCity(row.city),
                eventName: row.eventName.trim(),
                category: row.category ? row.category.trim() : 'ostatní',
                sales: Math.max(0, row.sales || 0),
                visitors: Math.max(0, row.visitors || 0),
                competition: Math.min(3, Math.max(1, row.competition || 2)),
                rating: Math.min(5, Math.max(0, row.rating || 0)),
                isValid: true,
                loadedAt: new Date().toISOString()
            };
            
            if (cleanRow.dateFrom && cleanRow.dateTo) {
                const daysDiff = Math.ceil((new Date(cleanRow.dateTo) - new Date(cleanRow.dateFrom)) / (1000 * 60 * 60 * 24));
                cleanRow.multiDay = daysDiff > 0;
                cleanRow.durationDays = daysDiff + 1;
            } else {
                cleanRow.multiDay = false;
                cleanRow.durationDays = 1;
            }
            
            if (cleanRow.dateFrom && cleanRow.eventName && cleanRow.city) {
                cleanData.push(cleanRow);
            }
            
        } catch (error) {
            console.warn('⚠️ Error cleaning row:', error, row);
            continue;
        }
    }
    
    console.log(`✅ Cleaned data: ${cleanData.length} valid rows from ${rawData.length} total`);
    return cleanData;
}

// Normalizace dat
// NAHRADIT funkci normalizeDateString() v donuland_app_part2.js:

function normalizeDateString(dateStr) {
    if (!dateStr) return null;
    
    console.log(`🔍 Parsing date: "${dateStr}"`);
    
    const formats = [
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/,  // DD.MM.YYYY (české datum)
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY  
        /(\d{4})-(\d{1,2})-(\d{1,2})/,    // YYYY-MM-DD (už správný)
        /(\d{1,2})-(\d{1,2})-(\d{4})/,    // DD-MM-YYYY
    ];
    
    for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
            if (format.source.includes('\\d{4}-')) {
                // YYYY-MM-DD formát - už je správný
                console.log(`✅ Already ISO format: ${dateStr}`);
                return dateStr;
            } else {
                // DD.MM.YYYY nebo DD/MM/YYYY - převést na YYYY-MM-DD
                const day = match[1].padStart(2, '0');
                const month = match[2].padStart(2, '0');
                const year = match[3];
                const isoDate = `${year}-${month}-${day}`;
                console.log(`🔄 Converted: "${dateStr}" → "${isoDate}"`);
                return isoDate;
            }
        }
    }
    
    // Pokud žádný formát nesedí, zkus přímo Date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        const result = date.toISOString().split('T')[0];
        console.log(`📅 Date parsing fallback: "${dateStr}" → "${result}"`);
        return result;
    }
    
    console.warn(`⚠️ Could not parse date: "${dateStr}"`);
    return null;
}

function normalizeCity(city) {
    if (!city) return '';
    
    return city
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(/^./, c => c.toUpperCase());
}

function normalizeCategory(category) {
    if (!category) return 'ostatní';
    
    const normalized = category.toLowerCase().trim();
    
    // ✅ JEDNODUCHÝ mapping jen pro zkrácení názvů
    const categoryMap = {
        'sportovní akce (dospělí)': 'sportovní',
        'sportovní akce': 'sportovní',
        'veletrh': 'veletrh',
        'food festival': 'food festival', 
        'koncert': 'koncert',
        'ostatní': 'ostatní'
    };
    
    return categoryMap[normalized] || 'ostatní';
}

// Autocomplete pro názvy akcí
function populateAutocompleteOptions() {
    console.log('📝 Populating autocomplete options...');
    
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return;
    }
    
    const eventNames = new Set();
    
    globalState.historicalData.forEach(record => {
        if (record.eventName) {
            eventNames.add(record.eventName);
        }
    });
    
    const eventNamesDatalist = document.getElementById('eventNames');
    if (eventNamesDatalist) {
        eventNamesDatalist.innerHTML = '';
        
        Array.from(eventNames).sort().forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            eventNamesDatalist.appendChild(option);
        });
        
        console.log(`✅ Populated ${eventNames.size} event names`);
    }
}

function updateDataStats() {
    const dataCountEl = document.getElementById('dataCount');
    const lastLoadEl = document.getElementById('lastLoad');
    
    if (dataCountEl) {
        dataCountEl.textContent = globalState.historicalData.length.toString();
    }
    
    if (lastLoadEl && globalState.lastDataLoad) {
        const lastLoadDate = new Date(globalState.lastDataLoad);
        lastLoadEl.textContent = lastLoadDate.toLocaleString('cs-CZ');
    }
}

// ========================================
// GOOGLE MAPS DISTANCE CALCULATION
// ========================================

// Aktualizace vzdálenosti při změně města
async function updateDistance() {
    const cityInput = document.getElementById('city');
    const distanceInput = document.getElementById('distance');
    
    if (!cityInput || !distanceInput) {
        console.log('⚠️ City or distance input missing');
        return;
    }
    
    const city = cityInput.value.trim();
    if (!city) {
        distanceInput.value = '';
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
        
        // PRIORITA: Google Maps API
        const distanceData = await calculateDistanceFromGoogleMaps(city);
        
        if (distanceData && distanceData.distance) {
            distanceInput.value = distanceData.distance;
        } else {
            // Fallback pouze pokud Google Maps nefunguje
            distanceInput.value = getOfflineFallbackDistance(city);
        }
        
        eventBus.emit('distanceCalculated', { 
            distance: distanceInput.value,
            city: city 
        });
        
        console.log(`📏 Distance updated: ${distanceInput.value}`);
        
    } catch (error) {
        console.warn('⚠️ Distance calculation failed:', error);
        distanceInput.value = getOfflineFallbackDistance(city);
        
    } finally {
        distanceInput.classList.remove('calculating');
        globalState.isLoadingDistance = false;
    }
}

// HLAVNÍ: Výpočet vzdálenosti pomocí Google Maps
async function calculateDistanceFromGoogleMaps(cityName) {
    const cacheKey = `praha-${cityName.toLowerCase().trim()}`;
    
    // Kontrola cache
    const cached = globalState.distanceCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CONFIG.DISTANCE_CACHE_TIME) {
        console.log('📦 Using cached distance');
        return cached.data;
    }
    
    // Kontrola dostupnosti Google Maps API
    if (!globalState.googleMapsLoaded || !window.google || !globalState.distanceService) {
        console.log('⚠️ Google Maps not available, using offline fallback');
        throw new Error('Google Maps API not available');
    }
    
    try {
        const distanceData = await getDistanceFromMapsAPI('Praha', cityName);
        
        if (distanceData) {
            // Cache result
            globalState.distanceCache.set(cacheKey, {
                data: distanceData,
                timestamp: Date.now()
            });
            
            return distanceData;
        }
        
        throw new Error('No distance data from Google Maps');
        
    } catch (error) {
        console.error('❌ Google Maps distance calculation error:', error);
        throw error;
    }
}

// Google Maps Distance Matrix API
async function getDistanceFromMapsAPI(fromCity, toCity) {
    return new Promise((resolve, reject) => {
        if (!globalState.distanceService) {
            reject(new Error('Distance service not initialized'));
            return;
        }
        
        const service = globalState.distanceService;
        
        service.getDistanceMatrix({
            origins: [`${fromCity}, Česká republika`],
            destinations: [`${toCity}, Česká republika`],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false
        }, (response, status) => {
            
            if (status === google.maps.DistanceMatrixStatus.OK) {
                const element = response.rows[0]?.elements[0];
                
                if (element && element.status === 'OK') {
                    const distanceData = {
                        distance: element.distance.text,
                        duration: element.duration.text,
                        distanceValue: element.distance.value, // meters
                        durationValue: element.duration.value, // seconds
                        status: 'success',
                        method: 'google_maps'
                    };
                    
                    console.log('🗺️ Distance from Google Maps:', distanceData);
                    resolve(distanceData);
                } else {
                    console.log(`⚠️ Distance element status: ${element?.status}`);
                    reject(new Error(`Distance element status: ${element?.status || 'unknown'}`));
                }
            } else {
                console.log(`⚠️ Distance matrix status: ${status}`);
                reject(new Error(`Distance matrix status: ${status}`));
            }
        });
    });
}

// FALLBACK: Pouze pro offline režim (minimální seznam)
function getOfflineFallbackDistance(city) {
    const cityNormalized = removeDiacritics(city.toLowerCase().trim());
    
    // POUZE základní česká města - zbytek se spočítá přes Google Maps
    const basicDistances = {
        'praha': '0 km',
        'brno': '195 km',
        'ostrava': '350 km', 
        'plzen': '90 km',
        'liberec': '100 km',
        'olomouc': '280 km'
    };
    
    if (basicDistances[cityNormalized]) {
        return basicDistances[cityNormalized];
    }
    
    // Default pokud Google Maps nefunguje a město není v základním seznamu
    console.log(`⚠️ Using default distance for unknown city: ${city}`);
    return '150 km'; // Průměr ČR
}

// ========================================
// WEATHER API
// ========================================

// Hlavní funkce pro aktualizaci počasí
async function updateWeather() {
    const city = document.getElementById('city').value.trim();
    const dateFrom = document.getElementById('eventDateFrom').value;
    const dateTo = document.getElementById('eventDateTo').value;
    const eventType = document.getElementById('eventType').value;
    
    if (!city || !dateFrom || !dateTo) {
        console.log('⚠️ City or dates missing for weather update');
        hideWeatherCard();
        return;
    }
    
    // Pouze pro outdoor akce
    if (eventType !== 'outdoor') {
        console.log('📍 Indoor event, skipping weather');
        hideWeatherCard();
        globalState.lastWeatherData = null;
        return;
    }
    
    if (globalState.isLoadingWeather) {
        console.log('⚠️ Weather loading already in progress');
        return;
    }
    
    globalState.isLoadingWeather = true;
    
    try {
        console.log(`🌤️ Loading weather for ${city} from ${dateFrom} to ${dateTo}`);
        
        showWeatherCard();
        displayWeatherLoading();
        
        // Načtení počasí pro všechny dny akce
        const weatherData = await fetchMultiDayWeatherData(city, dateFrom, dateTo);
        
        // Agregace pro celou akci
        const aggregatedWeather = aggregateWeatherData(weatherData);
        
        // Zobrazení v UI
        displayMultiDayWeather(weatherData, aggregatedWeather);
        
        // Uložení pro predikci
        globalState.lastWeatherData = {
            daily: weatherData,
            aggregated: aggregatedWeather,
            timestamp: Date.now()
        };
        
        eventBus.emit('weatherLoaded', {
            aggregated: aggregatedWeather,
            daily: weatherData
        });
        
        console.log('✅ Multi-day weather loaded successfully');
        
    } catch (error) {
        console.error('❌ Weather loading failed:', error);
        showNotification(`⚠️ Nepodařilo se načíst počasí: ${error.message}`, 'warning');
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
                // Vzdálené budoucí akce - sezónní odhad
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
        ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},CZ&appid=${apiKey}&units=metric&lang=cs`
        : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},CZ&appid=${apiKey}&units=metric&lang=cs`;
    
    try {
        const response = await fetchWithTimeout(url, {}, 10000);
        
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
        temp: [1, 3, 8, 13, 18, 21, 23, 22, 18, 12, 6, 2][month],
        weather: month >= 5 && month <= 8 ? 'Clear' : month >= 11 || month <= 2 ? 'Clouds' : 'Clouds',
        humidity: [85, 80, 70, 65, 60, 65, 70, 70, 75, 80, 85, 85][month],
        wind: [4.2, 4.0, 4.5, 3.8, 3.5, 3.2, 3.0, 3.1, 3.4, 3.8, 4.1, 4.3][month]
    };
    
    return {
        main: seasonalData.weather,
        description: seasonalData.weather === 'Clear' ? 'jasno' : 'oblačno',
        temp: seasonalData.temp + Math.round((Math.random() - 0.5) * 8), // ±4°C variace
        humidity: seasonalData.humidity + Math.round((Math.random() - 0.5) * 20),
        pressure: 1013 + Math.round((Math.random() - 0.5) * 40),
        windSpeed: seasonalData.wind + (Math.random() - 0.5) * 2,
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
    
    // 🍫 KLÍČOVÉ: Počet problematických dnů pro čokoládové donuty
    const badWeatherDays = dailyWeather.filter(day => 
        day.main === 'Rain' || day.main === 'Thunderstorm' || 
        day.temp < 5 || day.temp > 24  // Čokoláda se začíná tavit nad 24°C
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

// 🍫 ČOKOLÁDOVÉ DONUTY - WEATHER FAKTORY
function getChocolateWeatherImpactFactor(weather) {
    let factor = 1.0;
    
    // 🔥 KRITICKÉ: Vliv teploty na čokoládové donuty
    if (weather.avgTemp >= 18 && weather.avgTemp <= 24) {
        factor *= 1.20; // ✅ IDEÁLNÍ teplota pro čokoládu (18-24°C)
    } else if (weather.avgTemp >= 15 && weather.avgTemp < 18) {
        factor *= 1.05; // Chladnější, ale ok
    } else if (weather.avgTemp > 24 && weather.avgTemp <= 27) {
        factor *= 0.85; // ⚠️ Začíná být problém s čokoládou
    } else if (weather.avgTemp > 27 && weather.avgTemp <= 30) {
        factor *= 0.60; // 🔥 PROBLÉM: Čokoláda se začíná tavit
    } else if (weather.avgTemp > 30) {
        factor *= 0.40; // 🚨 KRITICKÉ: Čokoláda se taje, rychlá zkáza
    } else if (weather.avgTemp < 5) {
        factor *= 0.75; // ❄️ Studeno - lidé nechtějí sladké
    } else {
        factor *= 0.90; // Chladnější, ale přijatelné
    }
    
    // Vliv počasí na návštěvnost
    switch (weather.main) {
        case 'Clear':
            factor *= 1.15; // ☀️ Krásné počasí
            break;
        case 'Clouds':
            factor *= 0.95; // ☁️ Oblačno - mírně horší
            break;
        case 'Rain':
        case 'Drizzle':
            factor *= 0.55; // 🌧️ Déšť - významně méně lidí
            break;
        case 'Thunderstorm':
            factor *= 0.35; // ⛈️ Bouřka - velmi málo lidí
            break;
        case 'Snow':
            factor *= 0.50; // ❄️ Sníh - málo lidí venku
            break;
    }
    
    // Vliv větru
    if (weather.windSpeed > 8) {
        factor *= 0.80; // 💨 Silný vítr - nepříjemné pro venkovní akce
    }
    
    // Penalizace za více špatných dnů
    if (weather.badWeatherDays > 0) {
        const badDaysRatio = weather.badWeatherDays / weather.totalDays;
        factor *= (1 - badDaysRatio * 0.3); // Až -30% za 100% špatných dnů
    }
    
    return Math.max(0.2, Math.min(1.5, factor)); // Omezení na 20%-150%
}

// ========================================
// WEATHER UI ZOBRAZENÍ
// ========================================

// Zobrazení weather karty
function showWeatherCard() {
    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.style.display = 'block';
    }
}

// Skrytí weather karty
function hideWeatherCard() {
    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.style.display = 'none';
    }
    globalState.lastWeatherData = null;
}

// Zobrazení loading stavu
function displayWeatherLoading() {
    const weatherDisplay = document.getElementById('weatherDisplay');
    if (!weatherDisplay) return;
    
    weatherDisplay.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div class="spinner" style="margin: 0 auto 15px;"></div>
            <p>Načítám předpověď počasí...</p>
        </div>
    `;
}

// Zobrazení vícedenního počasí v UI
function displayMultiDayWeather(dailyWeather, aggregatedWeather) {
    const weatherDisplay = document.getElementById('weatherDisplay');
    if (!weatherDisplay) return;
    
    const icon = getWeatherIcon(aggregatedWeather.main);
    
    // Výpočet weather faktoru pro čokoládové donuty
    const impact = getChocolateWeatherImpactFactor(aggregatedWeather);
    let impactText = 'Neutrální vliv na prodej';
    let impactColor = '#666';
    
    if (impact > 1.05) {
        impactText = '✅ Pozitivní vliv na prodej';
        impactColor = '#28a745';
    } else if (impact < 0.85) {
        impactText = '❌ Negativní vliv na prodej';
        impactColor = '#dc3545';
    }
    
    // 🍫 Varování před problematickým počasím pro čokoládu
    let warningHtml = '';
    if (aggregatedWeather.badWeatherDays > 0) {
        const badDaysText = aggregatedWeather.badWeatherDays === 1 ? 'den' : 
                           aggregatedWeather.badWeatherDays < 5 ? 'dny' : 'dnů';
        
        warningHtml = `
            <div class="weather-warning">
                ⚠️ <strong>Varování pro čokoládové donuty:</strong> ${aggregatedWeather.badWeatherDays} ${badDaysText} z ${aggregatedWeather.totalDays} 
                má nepříznivé podmínky.
                ${aggregatedWeather.avgTemp > 24 ? '<br>🔥 <strong>POZOR:</strong> Vysoké teploty způsobí tání čokolády!' : ''}
                ${aggregatedWeather.main === 'Rain' || aggregatedWeather.main === 'Thunderstorm' ? '<br>🌧️ Déšť sníží návštěvnost!' : ''}
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
        const dayNumber = dayDate.getDate();
        const dayIcon = getWeatherIcon(day.main);
        
        // 🍫 Barevné označení podle teploty pro čokoládu
        let tempColor = '#333';
        let tempWarning = '';
        if (day.temp < 5) {
            tempColor = '#3498db'; // Modrá - studeno
        } else if (day.temp >= 18 && day.temp <= 24) {
            tempColor = '#27ae60'; // Zelená - ideální pro čokoládu
            tempWarning = '✅';
        } else if (day.temp > 24 && day.temp <= 27) {
            tempColor = '#f39c12'; // Oranžová - začíná být problém
            tempWarning = '⚠️';
        } else if (day.temp > 27) {
            tempColor = '#e74c3c'; // Červená - čokoláda se taje
            tempWarning = '🔥';
        }
        
        dailyHtml += `
            <div style="text-align: center; min-width: 80px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                <div style="font-weight: bold; font-size: 0.9em;">${dayName}</div>
                <div style="font-size: 0.8em; opacity: 0.8;">${dayNumber}.</div>
                <div style="font-size: 1.5em; margin: 5px 0;">${dayIcon}</div>
                <div style="font-weight: bold; color: ${tempColor};">${tempWarning}${day.temp}°C</div>
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
    
    // Uložení fallback dat pro predikci
    globalState.lastWeatherData = {
        daily: fallbackDaily,
        aggregated: aggregated,
        timestamp: Date.now()
    };
    
    showNotification('⚠️ Použity sezónní odhady počasí', 'warning', 3000);
}

// ========================================
// AI PREDIKČNÍ ALGORITMUS
// ========================================

// Hlavní funkce pro výpočet predikce
function calculatePrediction(formData) {
    console.log('🤖 Calculating AI prediction...');
    
    performanceMonitor.start('prediction');
    
    try {
        // 1. Základní faktory kategorie
        const baseConversion = getBaseCategoryFactor(formData.category);
        
        // 2. Historické faktory z podobných akcí
        const historicalFactor = getHistoricalFactor(formData);
        
        // 3. Městský faktor
        const cityFactor = getCityFactor(formData.city);
        
        // 4. Faktor konkurence
        const competitionFactor = getCompetitionFactor(formData.competition);
        
        // 5. Sezónní faktor
        const seasonalFactor = getSeasonalFactor(formData.eventDateFrom);
        
        // 6. Faktor velikosti akce
        const sizeFactor = getSizeFactor(formData.visitors);
        
        // 7. Weather faktor (pokud je outdoor) - s čokoládovými faktory
        let weatherFactor = 1.0;
        if (formData.eventType === 'outdoor' && globalState.lastWeatherData) {
            weatherFactor = getChocolateWeatherImpactFactor(globalState.lastWeatherData.aggregated);
        }
        
        // 8. Faktor délky akce
        const durationFactor = getDurationFactor(formData.durationDays || 1);
        
        // Finální výpočet konverze
        const finalConversion = Math.min(CONFIG.MAX_CONVERSION, 
            Math.max(CONFIG.MIN_CONVERSION, 
                baseConversion * historicalFactor * cityFactor * competitionFactor * 
                seasonalFactor * sizeFactor * weatherFactor * durationFactor
            )
        );
        
        // Predikovaný prodej
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
    
    console.log(`📊 Found ${similarEvents.length} similar events for historical factor`);
    
    // Vypočítat průměrnou konverzi podobných akcí
    const conversions = [];
    similarEvents.forEach(event => {
        if (event.sales > 0 && event.visitors > 0) {
            conversions.push(event.sales / event.visitors);
        }
    });
    
    if (conversions.length === 0) {
        return 1.0;
    }
    
    const avgConversion = conversions.reduce((sum, conv) => sum + conv, 0) / conversions.length;
    const baseConversion = getBaseCategoryFactor(formData.category);
    
    // Poměr skutečné vs očekávané konverze
    const factor = Math.max(0.5, Math.min(2.0, avgConversion / baseConversion));
    
    console.log(`📈 Historical factor: ${factor.toFixed(2)} (avg conversion: ${(avgConversion * 100).toFixed(1)}%)`);
    return factor;
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
        } else if (event.city.toLowerCase().includes(formData.city.toLowerCase()) || 
                   formData.city.toLowerCase().includes(event.city.toLowerCase())) {
            score += 15;
        }
        
        // Podobná velikost (±50%)
        if (event.visitors > 0 && formData.visitors > 0) {
            const sizeDiff = Math.abs(event.visitors - formData.visitors) / formData.visitors;
            if (sizeDiff <= 0.5) score += 20;
            else if (sizeDiff <= 1.0) score += 10;
        }
        
        // Podobná sezóna (±2 měsíce)
        if (event.dateFrom && formData.eventDateFrom) {
            const eventMonth = new Date(event.dateFrom).getMonth();
            const formMonth = new Date(formData.eventDateFrom).getMonth();
            let monthDiff = Math.abs(eventMonth - formMonth);
            if (monthDiff > 6) monthDiff = 12 - monthDiff; // Handle year wrap
            if (monthDiff <= 2) score += 10;
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
// HISTORICKÁ DATA ANALÝZA
// ========================================

// Aktualizace historických dat v UI
function updateHistoricalDisplay() {
    const formData = gatherFormData();
    
    if (!formData.eventName && !formData.city && !formData.category) {
        console.log('⚠️ Insufficient data for historical display');
        hideHistoricalCard();
        return;
    }
    
    const historicalResults = getHistoricalData(formData);
    displayHistoricalData(historicalResults, formData);
}

// Získání relevantních historických dat
function getHistoricalData(formData) {
    if (!globalState.historicalData || globalState.historicalData.length === 0) {
        return { matches: [], summary: null };
    }
    
    // Najít podobné akce s váženým skóre
    const matches = globalState.historicalData.map(record => {
        let score = 0;
        let matchReasons = [];
        
        // Název akce (40%)
        if (formData.eventName && record.eventName) {
            const eventNameNorm = formData.eventName.toLowerCase();
            const recordNameNorm = record.eventName.toLowerCase();
            
            if (recordNameNorm.includes(eventNameNorm) || eventNameNorm.includes(recordNameNorm)) {
                score += 40;
                matchReasons.push('název akce');
            }
        }
        
        // Město (30%)
        if (formData.city && record.city) {
            const cityNorm = removeDiacritics(formData.city.toLowerCase());
            const recordCityNorm = removeDiacritics(record.city.toLowerCase());
            
            if (recordCityNorm === cityNorm) {
                score += 30;
                matchReasons.push('stejné město');
            } else if (recordCityNorm.includes(cityNorm) || cityNorm.includes(recordCityNorm)) {
                score += 15;
                matchReasons.push('podobné město');
            }
        }
        
        // Kategorie (30%)
        if (formData.category && record.category) {
            if (record.category === formData.category) {
                score += 30;
                matchReasons.push('stejná kategorie');
            }
        }
        
        // Podobná velikost (bonus 10%)
        if (formData.visitors && record.visitors) {
            const sizeDiff = Math.abs(record.visitors - formData.visitors) / formData.visitors;
            if (sizeDiff <= 0.3) {
                score += 10;
                matchReasons.push('podobná velikost');
            }
        }
        
        return {
            ...record,
            similarityScore: score,
            matchReasons: matchReasons
        };
    })
    .filter(record => record.similarityScore >= 20) // Minimální podobnost 20%
    .sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Summary statistiky
    let summary = null;
    if (matches.length > 0) {
        const sales = matches.map(m => m.sales).filter(s => s > 0);
        const visitors = matches.map(m => m.visitors).filter(v => v > 0);
        
        if (sales.length > 0) {
            summary = {
                count: matches.length,
                avgSales: sales.reduce((sum, s) => sum + s, 0) / sales.length,
                maxSales: Math.max(...sales),
                minSales: Math.min(...sales),
                avgVisitors: visitors.length > 0 ? visitors.reduce((sum, v) => sum + v, 0) / visitors.length : 0,
                avgConversion: visitors.length > 0 && sales.length > 0 ? 
                    (sales.reduce((sum, s) => sum + s, 0) / visitors.reduce((sum, v) => sum + v, 0)) * 100 : 0
            };
        }
    }
    
    return {
        matches: matches.slice(0, 10), // Top 10 matches
        summary: summary
    };
}

// Zobrazení historických dat v UI
function displayHistoricalData(historicalResults, formData) {
    const historicalCard = document.getElementById('historicalCard');
    const historicalDiv = document.getElementById('historicalData');
    
    if (!historicalResults.matches || historicalResults.matches.length === 0) {
        hideHistoricalCard();
        return;
    }
    
    if (historicalCard) historicalCard.style.display = 'block';
    
    const topMatches = historicalResults.matches.slice(0, 5);
    
    let html = '';
    
    // Summary sekce
    if (historicalResults.summary) {
        const summary = historicalResults.summary;
        html += `
            <div class="historical-summary">
                <h4>📊 Shrnutí podobných akcí (${summary.count} akcí)</h4>
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-top: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #1976d2;">${Math.round(summary.avgSales)}</div>
                        <div style="font-size: 0.9em; color: #666;">Průměrný prodej</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #388e3c;">${summary.maxSales}</div>
                        <div style="font-size: 0.9em; color: #666;">Nejlepší výsledek</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #f57c00;">${summary.minSales}</div>
                        <div style="font-size: 0.9em; color: #666;">Nejhorší výsledek</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.3em; font-weight: bold; color: #9c27b0;">${summary.avgConversion.toFixed(1)}%</div>
                        <div style="font-size: 0.9em; color: #666;">Průměrná konverze</div>
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
        const similarityStars = Math.min(5, Math.max(1, Math.round(match.similarityScore / 20)));
        
        // Barevné označení podle výkonu
        let performanceColor = '#666';
        if (conversion > 15) performanceColor = '#28a745'; // Zelená - výborné
        else if (conversion > 10) performanceColor = '#17a2b8'; // Modrá - dobré
        else if (conversion > 5) performanceColor = '#ffc107'; // Žlutá - průměrné
        else performanceColor = '#dc3545'; // Červená - špatné
        
        html += `
            <div class="historical-item">
                <div class="historical-info">
                    <h4>${escapeHtml(eventName)}</h4>
                    <p><strong>${escapeHtml(city)}</strong> • ${formatDate(date)} • ${formatNumber(visitors)} návštěvníků</p>
                    <p style="color: #666; font-size: 0.8em;">
                        Podobnost: ${'★'.repeat(similarityStars)}${'☆'.repeat(5 - similarityStars)} 
                        (${match.matchReasons.join(', ')})
                    </p>
                </div>
                <div class="historical-stats">
                    <div class="historical-sales" style="color: ${performanceColor};">${formatNumber(sales)} ks</div>
                    <div style="font-size: 0.9em; color: ${performanceColor};">${conversion}% konverze</div>
                </div>
            </div>
        `;
    });
    
    if (historicalDiv) {
        historicalDiv.innerHTML = html;
    }
    
    console.log(`📈 Historical data displayed: ${topMatches.length} matches`);
}

// Skrytí historical karty
function hideHistoricalCard() {
    const historicalCard = document.getElementById('historicalCard');
    if (historicalCard) {
        historicalCard.style.display = 'none';
    }
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
// GENEROVÁNÍ DOPORUČENÍ
// ========================================

// Generování doporučení na základě predikce
function generateRecommendations(formData, prediction, businessResults) {
    const recommendations = [];
    
    // Weather doporučení pro čokoládu
    if (formData.eventType === 'outdoor' && globalState.lastWeatherData) {
        const weather = globalState.lastWeatherData.aggregated;
        
        if (weather.avgTemp > 24) {
            recommendations.push({
                type: 'warning',
                icon: '🔥',
                title: 'Vysoká teplota - riziko tání čokolády',
                text: `Průměrná teplota ${weather.avgTemp}°C může způsobit tání čokolády. Doporučujeme chladící boxy nebo stín.`
            });
        }
        
        if (weather.main === 'Rain' || weather.main === 'Thunderstorm') {
            recommendations.push({
                type: 'warning',
                icon: '🌧️',
                title: 'Riziko deště',
                text: 'Připravte krytí pro stánek a záložní plán pro špatné počasí.'
            });
        }
        
        if (weather.badWeatherDays > weather.totalDays / 2) {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Více než polovina dnů s nepříznivým počasím',
                text: 'Zvažte přesunutí akce nebo dodatečné marketingové aktivity.'
            });
        }
    }
    
    // Business doporučení
    if (businessResults.roi < 20) {
        recommendations.push({
            type: 'warning',
            icon: '📉',
            title: 'Nízká návratnost investice',
            text: `ROI ${businessResults.roi.toFixed(1)}% je pod doporučenou hranicí 20%. Zvažte snížení nákladů nebo zvýšení ceny.`
        });
    }
    
    if (businessResults.margin < 30) {
        recommendations.push({
            type: 'info',
            icon: '💰',
            title: 'Optimalizace marže',
            text: `Marže ${businessResults.margin.toFixed(1)}% by mohla být vyšší. Zvažte optimalizaci nákladů.`
        });
    }
    
    // Predikční doporučení
    if (prediction.confidence < 60) {
        recommendations.push({
            type: 'info',
            icon: '🎯',
            title: 'Nízká confidence predikce',
            text: `Confidence ${prediction.confidence}% - málo historických dat. Výsledek může být méně přesný.`
        });
    }
    
    // Konkurence doporučení
    if (formData.competition === 3) {
        recommendations.push({
            type: 'warning',
            icon: '🏪',
            title: 'Vysoká konkurence',
            text: 'Připravte unikátní nabídku nebo speciální akce pro vyčnění mezi konkurencí.'
        });
    }
    
    // Sezónní doporučení
    const seasonalFactor = getSeasonalFactor(formData.eventDateFrom);
    if (seasonalFactor < 0.9) {
        recommendations.push({
            type: 'info',
            icon: '📅',
            title: 'Mimo sezónu',
            text: 'Akce je mimo hlavní sezónu. Zvažte dodatečné marketingové aktivity.'
        });
    }
    
    // Velikost akce doporučení
    if (formData.visitors > 20000) {
        recommendations.push({
            type: 'success',
            icon: '🎉',
            title: 'Velká akce - vysoký potenciál',
            text: 'Zvažte navýšení zásob a dodatečný personál pro zvládnutí velkého množství zákazníků.'
        });
    }
    
    // Vzdálenost doporučení
    const distance = extractDistanceNumber(formData.distance);
    if (distance > 200) {
        recommendations.push({
            type: 'warning',
            icon: '🚗',
            title: 'Dlouhá vzdálenost',
            text: `Vzdálenost ${distance} km znamená vysoké dopravní náklady. Zvažte vícedenní pobyt nebo kombinaci více akcí.`
        });
    }
    
    return recommendations;
}

// ========================================
// EVENT LISTENERS 
// ========================================

// Event listeners pro predikci a data loading
eventBus.on('formChanged', (formData) => {
    console.log('📝 Form changed, updating prediction and historical data');
    
    // Update historical display
    updateHistoricalDisplay();
    
    // Trigger predikce pokud je formulář validní
    if (validateRequiredFields().valid) {
        setTimeout(() => {
            updatePrediction();
        }, 300); // Malé zpoždění pro lepší UX
    }
});

eventBus.on('weatherLoaded', (weatherData) => {
    console.log('🌤️ Weather loaded, triggering prediction update');
    
    // Aktualizace predikce při načtení počasí
    if (validateRequiredFields().valid) {
        updatePrediction();
    }
});

eventBus.on('triggerPrediction', () => {
    console.log('🤖 Manual prediction trigger');
    updatePrediction();
});

eventBus.on('predictionUpdateRequested', () => {
    console.log('🔄 Prediction update requested');
    updatePrediction();
});

eventBus.on('dataLoaded', (data) => {
    console.log('📊 Data loaded, updating historical display');
    
    // Aktualizace historical display po načtení dat
    setTimeout(() => {
        updateHistoricalDisplay();
        
        // Trigger predikce pokud je formulář vyplněn
        if (validateRequiredFields().valid) {
            updatePrediction();
        }
    }, 500);
});

eventBus.on('businessModelChanged', (data) => {
    console.log('💼 Business model changed, updating prediction');
    
    if (validateRequiredFields().valid) {
        updatePrediction();
    }
});

eventBus.on('rentTypeChanged', (data) => {
    console.log('💰 Rent type changed, updating prediction');
    
    if (validateRequiredFields().valid) {
        updatePrediction();
    }
});

eventBus.on('distanceCalculated', (data) => {
    console.log('📏 Distance calculated, updating prediction');
    
    if (validateRequiredFields().valid) {
        updatePrediction();
    }
});

eventBus.on('cityChanged', (data) => {
    console.log('🏙️ City changed, updating distance and weather');
    updateDistance();
    updateWeather();
});

eventBus.on('dateChanged', () => {
    console.log('📅 Date changed, updating weather');
    updateWeather();
});

eventBus.on('eventTypeChanged', (data) => {
    console.log('🏢 Event type changed:', data.type);
    
    if (data.type === 'outdoor') {
        const city = document.getElementById('city').value;
        const dateFrom = document.getElementById('eventDateFrom').value;
        
        if (city && dateFrom) {
            updateWeather();
        }
    } else {
        hideWeatherCard();
        globalState.lastWeatherData = null;
    }
});

eventBus.on('placeSelected', (place) => {
    console.log('📍 Place selected, updating distance and weather');
    setTimeout(() => {
        updateDistance();
        updateWeather();
    }, 500);
});

eventBus.on('weatherUpdateRequested', (data) => {
    updateWeather();
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
// INICIALIZACE GOOGLE MAPS INTEGRATION
// ========================================

// Rozšíření původní Google Maps callback
const originalInitGoogleMaps = window.initGoogleMaps;
window.initGoogleMaps = function() {
    if (originalInitGoogleMaps) {
        originalInitGoogleMaps();
    }
    
    if (window.google && window.google.maps) {
        globalState.distanceService = new google.maps.DistanceMatrixService();
        console.log('🗺️ Distance service initialized in Part 2');
    }
};

// Inicializace při DOM ready
document.addEventListener('DOMContentLoaded', function() {
    if (globalState.googleMapsLoaded && window.google && window.google.maps) {
        globalState.distanceService = new google.maps.DistanceMatrixService();
        console.log('🗺️ Distance service initialized');
    }
});

// ========================================
// PLACEHOLDER FUNKCE PRO KOMPATIBILITU
// ========================================

// Export predikce do CSV
function exportPredictionToCSV() {
    if (!globalState.lastPrediction) {
        showNotification('❌ Žádná predikce k exportu', 'error');
        return;
    }
    
    const { formData, prediction, businessResults } = globalState.lastPrediction;
    
    // CSV header
    const csvData = [
        'Datum_exportu,Nazev_akce,Kategorie,Mesto,Datum_od,Datum_do,Navstevnost,Konkurence,Typ_akce,Business_model,Typ_najmu',
        'Predikce_prodej,Confidence,Obrat,Naklady_celkem,Zisk,ROI,Marze,Breakeven',
        'Faktor_zakladni,Faktor_historicky,Faktor_mesto,Faktor_konkurence,Faktor_sezonna,Faktor_velikost,Faktor_pocasi,Faktor_delka,Faktor_finalni'
    ];
    
    // Data řádky
    const row1 = [
        new Date().toLocaleDateString('cs-CZ'),
        formData.eventName,
        formData.category,
        formData.city,
        formData.eventDateFrom,
        formData.eventDateTo,
        formData.visitors,
        formData.competition,
        formData.eventType,
        formData.businessModel,
        formData.rentType
    ].join(',');
    
    const row2 = [
        prediction.predictedSales,
        prediction.confidence,
        businessResults.revenue,
        businessResults.totalCosts,
        businessResults.profit,
        businessResults.roi.toFixed(1),
        businessResults.margin.toFixed(1),
        businessResults.breakeven
    ].join(',');
    
    const row3 = [
        prediction.factors.base,
        prediction.factors.historical,
        prediction.factors.city,
        prediction.factors.competition,
        prediction.factors.seasonal,
        prediction.factors.size,
        prediction.factors.weather,
        prediction.factors.duration,
        prediction.factors.final
    ].join(',');
    
    csvData.push(row1, row2, row3);
    
    // Download
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const filename = `donuland_predikce_${formData.eventName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    showNotification('📄 Predikce exportována do CSV', 'success');
    console.log('✅ Prediction exported to CSV:', filename);
}

// Uložení predikce do localStorage
function savePredictionToStorage() {
    if (!globalState.lastPrediction) {
        showNotification('❌ Žádná predikce k uložení', 'error');
        return;
    }
    
    try {
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        
        const predictionToSave = {
            ...globalState.lastPrediction,
            id: generateId(),
            saved: true,
            savedAt: new Date().toISOString()
        };
        
        savedPredictions.push(predictionToSave);
        
        // Keep only last 50 predictions
        if (savedPredictions.length > 50) {
            savedPredictions.splice(0, savedPredictions.length - 50);
        }
        
        localStorage.setItem('donuland_predictions', JSON.stringify(savedPredictions));
        
        // Mark current prediction as saved
        globalState.lastPrediction.saved = true;
        
        showNotification('💾 Predikce uložena', 'success');
        console.log('✅ Prediction saved to localStorage');
        
        eventBus.emit('predictionSaved', predictionToSave);
        
    } catch (error) {
        console.error('❌ Error saving prediction:', error);
        showNotification('❌ Chyba při ukládání predikce', 'error');
    }
}

// Placeholder funkce pro savePrediction (volané z HTML)
function savePrediction() {
    console.log('💾 Save prediction requested');
    savePredictionToStorage();
}

// Placeholder funkce pro exportPrediction (volané z HTML)
function exportPrediction() {
    console.log('📄 Export prediction requested');
    exportPredictionToCSV();
}

// Override updateWeatherCard z part1 pro lepší integraci
function updateWeatherCard() {
    const eventType = document.getElementById('eventType').value;
    
    if (eventType === 'outdoor') {
        showWeatherCard();
        const city = document.getElementById('city').value;
        const dateFrom = document.getElementById('eventDateFrom').value;
        
        if (city && dateFrom) {
            updateWeather();
        }
    } else {
        hideWeatherCard();
        globalState.lastWeatherData = null;
    }
    
    console.log(`🌤️ Event type changed to: ${eventType}`);
}

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 2 loaded successfully');
console.log('📊 Features: ✅ Data Loading ✅ Google Maps Distance ✅ Multi-day Weather ✅ AI Prediction ✅ Historical Analysis ✅ Business Metrics');
console.log('🍫 Special: Chocolate temperature logic for weather impact on sales');
console.log('🤖 AI Algorithm: Base + Historical + City + Competition + Seasonal + Size + Weather + Duration');
console.log('🎯 Confidence: 20-95% based on data availability and factor stability');
console.log('⏳ Ready for Part 3: UI Display & Results Visualization');

eventBus.emit('part2Loaded', { 
    timestamp: Date.now(),
    version: '2.0.0',
    features: [
        'data-loading', 
        'google-maps-distance', 
        'multi-day-weather', 
        'chocolate-weather-logic',
        'ai-prediction-algorithm', 
        'historical-analysis', 
        'business-metrics',
        'recommendations-engine',
        'csv-export',
        'localstorage-save-load'
    ]
});
