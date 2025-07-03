/* ========================================
   DONULAND MANAGEMENT SYSTEM - APP.JS ČÁST 2
   AI Predikce, počasí, mapy, business výpočty
   ======================================== */

// ========================================
// AI PREDIKČNÍ ENGINE
// ========================================

// Hlavní funkce pro aktualizaci predikce
async function updatePrediction() {
    console.log('🤖 Spouštím AI predikci...');
    
    const errors = validateForm();
    if (errors.length > 0) {
        showPredictionError(`Vyplňte povinná pole: ${errors.join(', ')}`);
        return;
    }
    
    // Zobrazení loading stavu
    showPredictionLoading();
    
    try {
        // Sběr dat z formuláře
        const formData = gatherFormData();
        
        // AI výpočet predikce
        const prediction = await calculateAIPrediction(formData);
        
        // Business výpočty
        const businessResults = calculateBusinessMetrics(formData, prediction);
        
        // Zobrazení výsledků
        displayPredictionResults(prediction, businessResults, formData);
        
        // Zobrazení historických dat
        displayHistoricalData(formData);
        
        // Zobrazení akčních tlačítek
        const actionButtons = document.getElementById('actionButtons');
        if (actionButtons) {
            actionButtons.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('❌ Chyba při predikci:', error);
        showPredictionError(`Chyba při výpočtu: ${error.message}`);
    }
}

// Sběr dat z formuláře
function gatherFormData() {
    return {
        eventName: document.getElementById('eventName').value.trim(),
        category: document.getElementById('category').value,
        city: document.getElementById('city').value.trim(),
        eventDate: document.getElementById('eventDate').value,
        visitors: parseInt(document.getElementById('visitors').value) || 0,
        competition: parseInt(document.getElementById('competition').value) || 2,
        eventType: document.getElementById('eventType').value,
        businessModel: document.getElementById('businessModel').value,
        rentType: document.getElementById('rentType').value,
        fixedRent: parseFloat(document.getElementById('fixedRent').value) || 0,
        percentage: parseFloat(document.getElementById('percentage').value) || 0,
        mixedFixed: parseFloat(document.getElementById('mixedFixed').value) || 0,
        mixedPercentage: parseFloat(document.getElementById('mixedPercentage').value) || 0,
        price: parseFloat(document.getElementById('price').value) || CONFIG.DONUT_PRICE,
        distance: parseFloat(document.getElementById('distance').value) || 0
    };
}

// AI výpočet predikce
async function calculateAIPrediction(formData) {
    console.log('🧠 Počítám AI predikci pro:', formData.eventName);
    
    // 1. Základní konverzní poměr podle kategorie
    let baseConversion = CONFIG.CATEGORY_FACTORS[formData.category] || 0.10;
    
    // 2. Historický faktor
    const historicalFactor = calculateHistoricalFactor(formData);
    
    // 3. Počasí faktor (jen pro venkovní akce)
    let weatherFactor = 1.0;
    if (formData.eventType === 'outdoor') {
        weatherFactor = await calculateWeatherFactor(formData);
    }
    
    // 4. Městský faktor
    const cityFactor = calculateCityFactor(formData.city);
    
    // 5. Konkurenční faktor
    const competitionFactor = CONFIG.COMPETITION_FACTORS[formData.competition] || 1.0;
    
    // 6. Sezónní faktor
    const seasonalFactor = calculateSeasonalFactor(formData.eventDate);
    
    // 7. Velikostní faktor podle návštěvnosti
    const sizeFactor = calculateSizeFactor(formData.visitors);
    
    // Kombinace všech faktorů
    const finalConversion = baseConversion * 
                           historicalFactor * 
                           weatherFactor * 
                           cityFactor * 
                           competitionFactor * 
                           seasonalFactor * 
                           sizeFactor;
    
    // Výpočet predikovaného prodeje
    let predictedSales = Math.round(formData.visitors * finalConversion);
    
    // Aplikace limitů (min 20, max 40% návštěvnosti)
    const minSales = Math.max(20, Math.round(formData.visitors * 0.02));
    const maxSales = Math.round(formData.visitors * 0.4);
    predictedSales = Math.max(Math.min(predictedSales, maxSales), minSales);
    
    // Výpočet spolehlivosti
    const confidence = calculateConfidence(formData, historicalFactor, weatherFactor);
    
    console.log('📊 Predikční faktory:', {
        základní: baseConversion,
        historický: historicalFactor,
        počasí: weatherFactor,
        město: cityFactor,
        konkurence: competitionFactor,
        sezóna: seasonalFactor,
        velikost: sizeFactor,
        finální: finalConversion,
        predikce: predictedSales
    });
    
    return {
        predictedSales,
        confidence,
        factors: {
            base: baseConversion,
            historical: historicalFactor,
            weather: weatherFactor,
            city: cityFactor,
            competition: competitionFactor,
            seasonal: seasonalFactor,
            size: sizeFactor,
            final: finalConversion
        }
    };
}

// Historický faktor na základě podobných akcí
function calculateHistoricalFactor(formData) {
    const historicalData = getHistoricalData(formData.eventName, formData.city, formData.category);
    
    if (!historicalData.matches || historicalData.matches.length === 0) {
        return 1.0; // Neutrální faktor
    }
    
    const avgSales = historicalData.summary.avgSales;
    const expectedBaseline = formData.visitors * (CONFIG.CATEGORY_FACTORS[formData.category] || 0.10);
    
    if (expectedBaseline > 0) {
        const factor = avgSales / expectedBaseline;
        return Math.max(0.3, Math.min(3.0, factor)); // Omezení na 0.3-3.0
    }
    
    return 1.0;
}

// Získání historických dat
function getHistoricalData(eventName, city, category) {
    if (!globalData.historicalData || globalData.historicalData.length === 0) {
        return { matches: [], summary: null };
    }
    
    const matches = [];
    
    globalData.historicalData.forEach(row => {
        const score = calculateSimilarityScore(row, eventName, city, category);
        if (score > 0) {
            matches.push({ ...row, similarityScore: score });
        }
    });
    
    // Seřazení podle podobnosti a výběr top 10
    matches.sort((a, b) => b.similarityScore - a.similarityScore);
    const topMatches = matches.slice(0, 10);
    
    // Výpočet shrnutí
    let summary = null;
    if (topMatches.length > 0) {
        const validSales = topMatches
            .map(m => parseFloat(m.M || 0))
            .filter(sales => sales > 0);
        
        if (validSales.length > 0) {
            summary = {
                count: validSales.length,
                avgSales: validSales.reduce((sum, sales) => sum + sales, 0) / validSales.length,
                minSales: Math.min(...validSales),
                maxSales: Math.max(...validSales)
            };
        }
    }
    
    return { matches: topMatches, summary };
}

// Výpočet podobnosti mezi akcemi
function calculateSimilarityScore(row, eventName, city, category) {
    let score = 0;
    
    // Název akce (sloupec E)
    const rowEventName = (row.E || '').toLowerCase();
    const searchEventName = eventName.toLowerCase();
    if (rowEventName.includes(searchEventName) || searchEventName.includes(rowEventName)) {
        score += 3;
    }
    
    // Město (sloupec D)
    const rowCity = removeDiacritics((row.D || '').toLowerCase());
    const searchCity = removeDiacritics(city.toLowerCase());
    if (rowCity === searchCity) {
        score += 2;
    } else if (rowCity.includes(searchCity) || searchCity.includes(rowCity)) {
        score += 1;
    }
    
    // Kategorie (sloupec F)
    const rowCategory = (row.F || '').toLowerCase();
    if (rowCategory === category.toLowerCase()) {
        score += 2;
    }
    
    // Pouze pokud má akce nějaký prodej
    const sales = parseFloat(row.M || 0);
    if (sales <= 0) {
        return 0;
    }
    
    return score;
}

// Městský faktor
function calculateCityFactor(city) {
    const cityLower = removeDiacritics(city.toLowerCase());
    
    for (const [knownCity, factor] of Object.entries(CONFIG.CITY_FACTORS)) {
        if (cityLower.includes(knownCity) || knownCity.includes(cityLower)) {
            return factor;
        }
    }
    
    return CONFIG.CITY_FACTORS.default;
}

// Sezónní faktor
function calculateSeasonalFactor(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // 1-12
    
    // Sezónní faktory (léto je nejlepší pro venkovní akce)
    if (month >= 5 && month <= 8) return 1.1; // Květen-Srpen
    if (month >= 9 && month <= 10) return 1.05; // Září-Říjen
    if (month >= 3 && month <= 4) return 0.95; // Březen-Duben
    return 0.85; // Zima
}

// Velikostní faktor (velké akce mají menší konverzi)
function calculateSizeFactor(visitors) {
    if (visitors > 10000) return 0.8;
    if (visitors > 5000) return 0.9;
    if (visitors > 1000) return 1.0;
    return 1.1; // Menší akce mají vyšší konverzi
}

// Výpočet spolehlivosti predikce
function calculateConfidence(formData, historicalFactor, weatherFactor) {
    let confidence = 70; // Základní spolehlivost
    
    // Historická data
    const historicalData = getHistoricalData(formData.eventName, formData.city, formData.category);
    if (historicalData.matches.length > 5) confidence += 15;
    else if (historicalData.matches.length > 0) confidence += 10;
    
    // Počasí (jen pro venkovní)
    if (formData.eventType === 'outdoor' && weatherFactor !== 1.0) {
        confidence += 5;
    }
    
    // Velikost akce
    if (formData.visitors > 10000) confidence -= 10;
    else if (formData.visitors < 100) confidence -= 5;
    
    // Extrémní faktory snižují spolehlivost
    if (historicalFactor > 2 || historicalFactor < 0.5) confidence -= 10;
    
    return Math.max(25, Math.min(95, confidence));
}

// ========================================
// BUSINESS VÝPOČTY
// ========================================

// Výpočet business metrik
function calculateBusinessMetrics(formData, prediction) {
    const donutPrice = formData.price;
    const donutCost = parseFloat(document.getElementById('donutCost').value) || CONFIG.DONUT_COST;
    const franchisePrice = parseFloat(document.getElementById('franchisePrice').value) || CONFIG.FRANCHISE_PRICE;
    const hourlyWage = parseFloat(document.getElementById('hourlyWage').value) || CONFIG.HOURLY_WAGE;
    const workHours = parseFloat(document.getElementById('workHours').value) || CONFIG.WORK_HOURS;
    const fuelCost = parseFloat(document.getElementById('fuelCost').value) || CONFIG.FUEL_COST;
    
    // Základní výpočty
    const revenue = prediction.predictedSales * donutPrice;
    const productionCosts = prediction.predictedSales * donutCost;
    
    // Dopravní náklady
    const transportCosts = formData.distance * 2 * fuelCost; // Tam a zpět
    
    // Pracovní náklady podle business modelu
    let laborCosts = 0;
    let revenueShare = 0;
    let franchiseRevenue = 0;
    
    switch (formData.businessModel) {
        case 'owner':
            laborCosts = 2 * hourlyWage * workHours; // Vy + 2 brigádníci
            break;
        case 'employee':
            laborCosts = 2 * hourlyWage * workHours; // Vy + 1 brigádník
            revenueShare = revenue * 0.05; // 5% z obratu
            break;
        case 'franchise':
            franchiseRevenue = prediction.predictedSales * (franchisePrice - donutCost);
            break;
    }
    
    // Nájem podle typu
    let rentCosts = 0;
    switch (formData.rentType) {
        case 'fixed':
            rentCosts = formData.fixedRent;
            break;
        case 'percentage':
            rentCosts = revenue * (formData.percentage / 100);
            break;
        case 'mixed':
            rentCosts = formData.mixedFixed + (revenue * (formData.mixedPercentage / 100));
            break;
        case 'free':
            rentCosts = 0;
            break;
    }
    
    // Celkové náklady
    const totalCosts = productionCosts + transportCosts + laborCosts + revenueShare + rentCosts;
    
    // Zisk
    let profit;
    if (formData.businessModel === 'franchise') {
        profit = franchiseRevenue;
    } else {
        profit = revenue - totalCosts;
    }
    
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    return {
        revenue,
        costs: {
            production: productionCosts,
            transport: transportCosts,
            labor: laborCosts,
            revenueShare,
            rent: rentCosts,
            total: totalCosts
        },
        profit,
        profitMargin,
        franchiseRevenue
    };
}

// ========================================
// POČASÍ API
// ========================================

// Aktualizace počasí
async function updateWeather() {
    const city = document.getElementById('city').value.trim();
    const date = document.getElementById('eventDate').value;
    const eventType = document.getElementById('eventType').value;
    
    // Počasí jen pro venkovní akce
    if (eventType !== 'outdoor') {
        hideWeatherCard();
        return;
    }
    
    if (!city || !date) {
        hideWeatherCard();
        return;
    }
    
    try {
        showWeatherLoading();
        const weather = await getWeatherForecast(city, date);
        displayWeather(weather);
    } catch (error) {
        console.error('❌ Chyba při načítání počasí:', error);
        showWeatherError(error.message);
    }
}

// Získání předpovědi počasí
async function getWeatherForecast(city, date) {
    const cacheKey = `${city}-${date}`;
    
    // Kontrola cache
    if (globalData.weatherCache.has(cacheKey)) {
        const cached = globalData.weatherCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 min cache
            console.log('🌤️ Počasí z cache');
            return cached.data;
        }
    }
    
    const apiKey = document.getElementById('weatherKey').value || CONFIG.WEATHER_API_KEY;
    if (!apiKey) {
        throw new Error('Weather API klíč není nastaven');
    }
    
    try {
        // 1. Získání souřadnic města
        const coords = await getCityCoordinates(city, apiKey);
        
        // 2. Získání předpovědi počasí
        const weather = await getWeatherData(coords, date, apiKey);
        
        // Uložení do cache
        globalData.weatherCache.set(cacheKey, {
            data: weather,
            timestamp: Date.now()
        });
        
        return weather;
        
    } catch (error) {
        console.warn('Weather API selhal, používám fallback');
        return getFallbackWeather(date);
    }
}

// Získání souřadnic města
async function getCityCoordinates(city, apiKey) {
    // Fallback souřadnice pro česká města
    const fallbackCoords = {
        'praha': { lat: 50.0755, lon: 14.4378 },
        'brno': { lat: 49.1951, lon: 16.6068 },
        'ostrava': { lat: 49.8209, lon: 18.2625 },
        'plzeň': { lat: 49.7384, lon: 13.3736 },
        'liberec': { lat: 50.7663, lon: 15.0543 },
        'olomouc': { lat: 49.5938, lon: 17.2509 }
    };
    
    const cityLower = removeDiacritics(city.toLowerCase());
    for (const [knownCity, coords] of Object.entries(fallbackCoords)) {
        if (cityLower.includes(knownCity) || knownCity.includes(cityLower)) {
            return coords;
        }
    }
    
    // Pokus o API geocoding
    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},CZ&limit=1&appid=${apiKey}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(geoUrl)}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const geoData = JSON.parse(data.contents);
        
        if (geoData.length > 0) {
            return { lat: geoData[0].lat, lon: geoData[0].lon };
        }
    } catch (error) {
        console.warn('Geocoding selhal:', error);
    }
    
    // Default Praha
    return { lat: 50.0755, lon: 14.4378 };
}

// Získání dat o počasí
async function getWeatherData(coords, date, apiKey) {
    const targetDate = new Date(date);
    const today = new Date();
    const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    
    let weatherUrl;
    if (daysDiff <= 0) {
        // Aktuální počasí
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=cs`;
    } else if (daysDiff <= 5) {
        // 5denní předpověď
        weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=cs`;
    } else {
        // Vzdálenější datum - použiji aktuální jako odhad
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=cs`;
    }
    
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(weatherUrl)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const weatherData = JSON.parse(data.contents);
    
    if (weatherData.cod && weatherData.cod !== 200 && weatherData.cod !== "200") {
        throw new Error(`Weather API error: ${weatherData.message}`);
    }
    
    // Parsování podle typu odpovědi
    let weather;
    if (daysDiff <= 0 || daysDiff > 5) {
        // Aktuální počasí
        weather = {
            temp: Math.round(weatherData.main.temp),
            description: weatherData.weather[0].description,
            main: weatherData.weather[0].main,
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind?.speed || 0,
            pressure: weatherData.main.pressure
        };
    } else {
        // 5denní předpověď - najít nejbližší
        const targetTime = targetDate.getTime();
        let closestForecast = weatherData.list[0];
        let minDiff = Math.abs(new Date(closestForecast.dt * 1000) - targetTime);
        
        for (const forecast of weatherData.list) {
            const forecastTime = new Date(forecast.dt * 1000);
            const diff = Math.abs(forecastTime - targetTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestForecast = forecast;
            }
        }
        
        weather = {
            temp: Math.round(closestForecast.main.temp),
            description: closestForecast.weather[0].description,
            main: closestForecast.weather[0].main,
            humidity: closestForecast.main.humidity,
            windSpeed: closestForecast.wind?.speed || 0,
            pressure: closestForecast.main.pressure
        };
    }
    
    return weather;
}

// Fallback počasí podle sezóny
function getFallbackWeather(date) {
    const month = new Date(date).getMonth() + 1;
    
    let temp, description, main;
    if (month >= 6 && month <= 8) {
        temp = 22; description = 'slunečno (odhad)'; main = 'Clear';
    } else if (month >= 3 && month <= 5) {
        temp = 15; description = 'polojasno (odhad)'; main = 'Clouds';
    } else if (month >= 9 && month <= 11) {
        temp = 12; description = 'oblačno (odhad)'; main = 'Clouds';
    } else {
        temp = 3; description = 'chladné (odhad)'; main = 'Clouds';
    }
    
    return {
        temp, description, main,
        humidity: 60,
        windSpeed: 3,
        pressure: 1013,
        isFallback: true
    };
}

// Výpočet weather faktoru pro predikci
async function calculateWeatherFactor(formData) {
    try {
        const weather = await getWeatherForecast(formData.city, formData.eventDate);
        return getWeatherImpactFactor(weather);
    } catch (error) {
        console.warn('Weather faktor fallback');
        return 1.0;
    }
}

// Převod počasí na faktor
function getWeatherImpactFactor(weather) {
    let factor = 1.0;
    
    // Teplota
    if (weather.temp >= 18 && weather.temp <= 25) factor *= 1.15;
    else if (weather.temp > 25) factor *= 0.85;
    else if (weather.temp < 10) factor *= 0.75;
    
    // Podmínky
    const conditionFactors = {
        'Clear': 1.1,
        'Clouds': 1.0,
        'Rain': 0.5,
        'Drizzle': 0.6,
        'Snow': 0.4,
        'Thunderstorm': 0.3
    };
    factor *= conditionFactors[weather.main] || 1.0;
    
    // Vítr
    if (weather.windSpeed > 10) factor *= 0.9;
    
    return Math.max(0.3, factor);
}

// Odstranění diakritiky
function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

console.log('✅ App.js část 2 načtena - predikce a počasí');
