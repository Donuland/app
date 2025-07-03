/* ========================================
   DONULAND MANAGEMENT SYSTEM - APP.JS ČÁST 3
   Vzdálenost, UI funkce, zobrazení výsledků, nastavení
   ======================================== */

// ========================================
// VZDÁLENOST (GOOGLE MAPS)
// ========================================

// Aktualizace vzdálenosti
async function updateDistance() {
    const city = document.getElementById('city').value.trim();
    const distanceInput = document.getElementById('distance');
    
    if (!city) {
        distanceInput.value = '';
        return;
    }
    
    const cacheKey = `praha-${city.toLowerCase()}`;
    
    // Cache kontrola
    if (globalData.distanceCache.has(cacheKey)) {
        const cached = globalData.distanceCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24h cache
            distanceInput.value = cached.data;
            return;
        }
    }
    
    try {
        distanceInput.value = 'Počítám...';
        const distance = await calculateDistance('Praha', city);
        distanceInput.value = distance;
        
        // Cache
        globalData.distanceCache.set(cacheKey, {
            data: distance,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('Chyba při výpočtu vzdálenosti:', error);
        distanceInput.value = getFallbackDistance(city);
    }
}

// Výpočet vzdálenosti
async function calculateDistance(fromCity, toCity) {
    const apiKey = document.getElementById('mapsKey').value || CONFIG.MAPS_API_KEY;
    if (!apiKey) {
        return getFallbackDistance(toCity);
    }
    
    const origin = encodeURIComponent(`${fromCity}, Czech Republic`);
    const destination = encodeURIComponent(`${toCity}, Czech Republic`);
    
    const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=metric&key=${apiKey}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(mapsUrl)}`;
    
    try {
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const mapsData = JSON.parse(data.contents);
        
        if (mapsData.status === 'OK' && mapsData.rows[0]?.elements[0]?.status === 'OK') {
            const distanceInKm = Math.round(mapsData.rows[0].elements[0].distance.value / 1000);
            return distanceInKm;
        }
    } catch (error) {
        console.warn('Maps API selhal:', error);
    }
    
    return getFallbackDistance(toCity);
}

// Fallback vzdálenosti
function getFallbackDistance(city) {
    const distances = {
        'brno': 200,
        'ostrava': 350,
        'plzeň': 90,
        'liberec': 100,
        'olomouc': 280,
        'hradec králové': 120,
        'pardubice': 100,
        'české budějovice': 150,
        'ústí nad labem': 80
    };
    
    const cityLower = removeDiacritics(city.toLowerCase());
    for (const [knownCity, distance] of Object.entries(distances)) {
        if (cityLower.includes(knownCity) || knownCity.includes(cityLower)) {
            return distance;
        }
    }
    
    return 150; // Průměr pro ČR
}

// ========================================
// UI FUNKCE PRO PREDIKCE
// ========================================

// Zobrazení výsledků predikce
function displayPredictionResults(prediction, businessResults, formData) {
    const resultsDiv = document.getElementById('predictionResults');
    
    const profitColor = businessResults.profit > 0 ? 'positive' : 'negative';
    const confidenceColor = prediction.confidence >= 80 ? 'positive' : 
                           prediction.confidence >= 60 ? 'warning' : 'negative';
    
    resultsDiv.innerHTML = `
        <div class="results-grid">
            <div class="result-item">
                <div class="result-value">${formatNumber(prediction.predictedSales)}</div>
                <div class="result-label">🍩 Predikovaný prodej</div>
            </div>
            
            <div class="result-item">
                <div class="result-value ${confidenceColor}">${prediction.confidence}%</div>
                <div class="result-label">🎯 Spolehlivost</div>
            </div>
            
            <div class="result-item">
                <div class="result-value">${formatCurrency(businessResults.revenue)}</div>
                <div class="result-label">💰 Obrat</div>
            </div>
            
            <div class="result-item">
                <div class="result-value ${profitColor}">${formatCurrency(businessResults.profit)}</div>
                <div class="result-label">📈 Zisk</div>
            </div>
            
            <div class="result-item">
                <div class="result-value">${Math.round(businessResults.profitMargin)}%</div>
                <div class="result-label">📊 Marže</div>
            </div>
            
            <div class="result-item">
                <div class="result-value">${formatCurrency(businessResults.costs.total)}</div>
                <div class="result-label">💸 Náklady</div>
            </div>
        </div>
        
        ${generateCostsBreakdown(businessResults, prediction)}
        ${generateFactorsAnalysis(prediction.factors)}
        ${generateRecommendations(prediction, businessResults, formData)}
    `;
}

// Rozpis nákladů
function generateCostsBreakdown(businessResults, prediction) {
    return `
        <div class="costs-breakdown">
            <h4>💰 Rozpis nákladů</h4>
            <div class="cost-item">
                <span>🍩 Výroba (${prediction.predictedSales} × ${(businessResults.costs.production / prediction.predictedSales).toFixed(0)} Kč)</span>
                <span>${formatCurrency(businessResults.costs.production)}</span>
            </div>
            <div class="cost-item">
                <span>🚗 Doprava</span>
                <span>${formatCurrency(businessResults.costs.transport)}</span>
            </div>
            <div class="cost-item">
                <span>👥 Mzdy</span>
                <span>${formatCurrency(businessResults.costs.labor)}</span>
            </div>
            ${businessResults.costs.revenueShare > 0 ? `
            <div class="cost-item">
                <span>💼 Podíl z obratu</span>
                <span>${formatCurrency(businessResults.costs.revenueShare)}</span>
            </div>
            ` : ''}
            <div class="cost-item">
                <span>🏢 Nájem</span>
                <span>${formatCurrency(businessResults.costs.rent)}</span>
            </div>
            <div class="cost-item">
                <span><strong>💸 CELKEM</strong></span>
                <span><strong>${formatCurrency(businessResults.costs.total)}</strong></span>
            </div>
        </div>
    `;
}

// Analýza faktorů
function generateFactorsAnalysis(factors) {
    return `
        <div class="recommendations">
            <h4>🧠 Analýza AI faktorů</h4>
            <ul>
                <li><strong>Kategorie akce:</strong> ${(factors.base * 100).toFixed(1)}% základní konverze</li>
                <li><strong>Historická data:</strong> ${(factors.historical * 100 - 100).toFixed(0)}% oproti průměru</li>
                ${factors.weather !== 1 ? `<li><strong>Počasí:</strong> ${(factors.weather * 100 - 100).toFixed(0)}% vliv na návštěvnost</li>` : ''}
                <li><strong>Město:</strong> ${(factors.city * 100 - 100).toFixed(0)}% faktor města</li>
                <li><strong>Konkurence:</strong> ${(factors.competition * 100 - 100).toFixed(0)}% vliv</li>
                <li><strong>Sezóna:</strong> ${(factors.seasonal * 100 - 100).toFixed(0)}% sezónní vliv</li>
            </ul>
        </div>
    `;
}

// Generování doporučení
function generateRecommendations(prediction, businessResults, formData) {
    const recommendations = [];
    
    if (businessResults.profit < 0) {
        recommendations.push('❌ Akce bude ztrátová - zvažte zvýšení ceny nebo snížení nákladů');
    } else if (businessResults.profitMargin < 10) {
        recommendations.push('⚠️ Nízká marže - optimalizujte náklady');
    } else if (businessResults.profitMargin > 30) {
        recommendations.push('✅ Výborná marže - akce je velmi výnosná');
    }
    
    if (prediction.confidence < 60) {
        recommendations.push('⚠️ Nízká spolehlivost predikce - připravte více scénářů');
    }
    
    if (formData.distance > 200) {
        recommendations.push('🚗 Vzdálená akce - zvažte přenocování');
    }
    
    if (prediction.predictedSales < 100) {
        recommendations.push('📉 Nízký predikovaný prodej - připravte menší zásobu');
    }
    
    if (prediction.factors.weather < 0.8 && formData.eventType === 'outdoor') {
        recommendations.push('🌧️ Nepříznivé počasí - mějte záložní plán');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('✅ Všechny parametry jsou v pořádku pro úspěšnou akci');
    }
    
    return `
        <div class="recommendations">
            <h4>💡 Doporučení</h4>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    `;
}

// Zobrazení historických dat
function displayHistoricalData(formData) {
    const historicalData = getHistoricalData(formData.eventName, formData.city, formData.category);
    const cardEl = document.getElementById('historicalCard');
    const dataEl = document.getElementById('historicalData');
    
    if (!historicalData.matches || historicalData.matches.length === 0) {
        cardEl.style.display = 'none';
        return;
    }
    
    cardEl.style.display = 'block';
    
    let html = '';
    
    // Shrnutí
    if (historicalData.summary) {
        html += `
            <div class="historical-summary">
                <div class="results-grid" style="margin-bottom: 20px;">
                    <div class="result-item">
                        <div class="result-value">${historicalData.summary.count}</div>
                        <div class="result-label">Podobných akcí</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value">${formatNumber(historicalData.summary.avgSales)}</div>
                        <div class="result-label">Průměrný prodej</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value">${formatCurrency(historicalData.summary.avgSales * formData.price)}</div>
                        <div class="result-label">Průměrný obrat</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Top 5 podobných akcí
    html += '<h4>🔍 Nejpodobnější akce:</h4>';
    historicalData.matches.slice(0, 5).forEach(match => {
        const name = match.E || 'Neznámá akce';
        const city = match.D || 'Neznámé město';
        const date = match.B || '';
        const sales = parseInt(match.M || 0);
        const rating = parseFloat(match.X || 0);
        
        html += `
            <div class="historical-item">
                <div class="historical-info">
                    <h4>${escapeHtml(name)}</h4>
                    <p>📍 ${escapeHtml(city)} | 📅 ${date}</p>
                </div>
                <div class="historical-stats">
                    <div class="historical-sales">${formatNumber(sales)} 🍩</div>
                    ${rating > 0 ? `<div class="historical-rating">${'⭐'.repeat(Math.round(rating))}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    dataEl.innerHTML = html;
}

// Loading stavy a chyby
function showPredictionLoading() {
    document.getElementById('predictionResults').innerHTML = `
        <div class="loading">
            <div>🤖 AI počítá predikci...</div>
        </div>
    `;
}

function showPredictionError(message) {
    document.getElementById('predictionResults').innerHTML = `
        <div class="error">
            <div>${message}</div>
        </div>
    `;
    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
        actionButtons.style.display = 'none';
    }
}

// ========================================
// WEATHER UI FUNKCE
// ========================================

// Aktualizace zobrazení weather karty
function updateWeatherCard() {
    const eventType = document.getElementById('eventType').value;
    const weatherCard = document.getElementById('weatherCard');
    
    if (eventType === 'outdoor') {
        weatherCard.style.display = 'block';
        updateWeather();
    } else {
        weatherCard.style.display = 'none';
    }
}

// Zobrazení počasí
function displayWeather(weather) {
    const weatherDisplay = document.getElementById('weatherDisplay');
    const icon = getWeatherIcon(weather.main);
    const warnings = getWeatherWarnings(weather);
    
    weatherDisplay.innerHTML = `
        <div class="weather-card">
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${weather.temp}°C</div>
            <div class="weather-desc">${weather.description}</div>
            
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-value">${weather.humidity}%</div>
                    <div class="weather-detail-label">Vlhkost</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-value">${Math.round(weather.windSpeed)} m/s</div>
                    <div class="weather-detail-label">Vítr</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-value">${weather.pressure} hPa</div>
                    <div class="weather-detail-label">Tlak</div>
                </div>
            </div>
            
            ${warnings.length > 0 ? `
                <div class="weather-warning">
                    <strong>⚠️ Varování:</strong><br>
                    ${warnings.join('<br>')}
                </div>
            ` : ''}
            
            ${weather.isFallback ? `
                <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 6px; font-size: 0.9em;">
                    ℹ️ Sezónní odhad (Weather API nedostupné)
                </div>
            ` : ''}
        </div>
    `;
    
    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.style.display = 'block';
    }
}

// Weather ikony
function getWeatherIcon(main) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Mist': '🌫️',
        'Fog': '🌫️'
    };
    return icons[main] || '🌤️';
}

// Weather varování
function getWeatherWarnings(weather) {
    const warnings = [];
    
    if (weather.temp > 25) warnings.push('Vysoké teploty - riziko tání čokolády');
    if (weather.temp < 5) warnings.push('Nízké teploty - očekávejte nižší návštěvnost');
    if (weather.main === 'Rain') warnings.push('Déšť - výrazně sníží návštěvnost');
    if (weather.main === 'Thunderstorm') warnings.push('Bouřka - velmi nízká návštěvnost');
    if (weather.windSpeed > 10) warnings.push('Silný vítr - zajistěte kotvení stánku');
    
    return warnings;
}

function showWeatherLoading() {
    const weatherDisplay = document.getElementById('weatherDisplay');
    if (weatherDisplay) {
        weatherDisplay.innerHTML = `
            <div class="loading">🌤️ Načítám předpověď počasí...</div>
        `;
    }
    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.style.display = 'block';
    }
}

function showWeatherError(message) {
    const weatherDisplay = document.getElementById('weatherDisplay');
    if (weatherDisplay) {
        weatherDisplay.innerHTML = `
            <div class="error">❌ Chyba počasí: ${message}</div>
        `;
    }
}

function hideWeatherCard() {
    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.style.display = 'none';
    }
}

// ========================================
// BUSINESS MODEL UI
// ========================================

// Aktualizace business model info
function updateBusinessInfo() {
    const model = document.getElementById('businessModel').value;
    const infoEl = document.getElementById('businessInfo');
    
    if (!model) {
        infoEl.style.display = 'none';
        return;
    }
    
    const models = {
        'owner': {
            title: '🏪 Majitel',
            description: 'Vy osobně + 2 brigádníci',
            costs: 'Mzdy: 2 × 150 Kč/h × 10h = 3000 Kč',
            profit: '100% zisku po odečtení všech nákladů'
        },
        'employee': {
            title: '👨‍💼 Zaměstnanec',
            description: 'Vy + 1 brigádník + 5% z obratu',
            costs: 'Mzdy: 2 × 150 Kč/h × 10h + 5% z obratu',
            profit: 'Fixní mzda bez účasti na zisku'
        },
        'franchise': {
            title: '🤝 Franšíza',
            description: 'Nákup donutů za 52 Kč/ks',
            costs: 'Váš zisk: 20 Kč na donut (52-32)',
            profit: 'Franšízant hradí nájem a mzdy'
        }
    };
    
    const info = models[model];
    if (info) {
        infoEl.innerHTML = `
            <h4>${info.title}</h4>
            <ul>
                <li><strong>Model:</strong> ${info.description}</li>
                <li><strong>Náklady:</strong> ${info.costs}</li>
                <li><strong>Zisk:</strong> ${info.profit}</li>
            </ul>
        `;
        infoEl.style.display = 'block';
    }
}

// Aktualizace rent fields
function updateRentFields() {
    const rentType = document.getElementById('rentType').value;
    
    // Skrytí všech
    ['fixedRentGroup', 'percentageGroup', 'mixedFixedGroup', 'mixedPercentageGroup'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Zobrazení relevantních
    switch(rentType) {
        case 'fixed':
            const fixedGroup = document.getElementById('fixedRentGroup');
            if (fixedGroup) fixedGroup.style.display = 'block';
            break;
        case 'percentage':
            const percentageGroup = document.getElementById('percentageGroup');
            if (percentageGroup) percentageGroup.style.display = 'block';
            break;
        case 'mixed':
            const mixedFixedGroup = document.getElementById('mixedFixedGroup');
            const mixedPercentageGroup = document.getElementById('mixedPercentageGroup');
            if (mixedFixedGroup) mixedFixedGroup.style.display = 'block';
            if (mixedPercentageGroup) mixedPercentageGroup.style.display = 'block';
            break;
    }
}

// ========================================
// SAVE & EXPORT FUNKCE
// ========================================

// Uložení predikce do Google Sheets
async function savePrediction() {
    const errors = validateForm();
    if (errors.length > 0) {
        showNotification('❌ Vyplňte všechna povinná pole', 'error');
        return;
    }
    
    try {
        const formData = gatherFormData();
        const prediction = await calculateAIPrediction(formData);
        const businessResults = calculateBusinessMetrics(formData, prediction);
        
        // Simulace uložení (real implementace by potřebovala Google Sheets API write)
        const predictionData = {
            datum: formData.eventDate,
            lokalita: formData.city,
            nazev: formData.eventName,
            kategorie: formData.category,
            navstevnost: formData.visitors,
            predikce: prediction.predictedSales,
            spolehlivost: prediction.confidence,
            obrat: businessResults.revenue,
            zisk: businessResults.profit,
            timestamp: new Date().toISOString()
        };
        
        console.log('💾 Ukládám predikci:', predictionData);
        
        // Simulace API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showNotification('✅ Predikce byla úspěšně uložena!', 'success');
        
    } catch (error) {
        console.error('❌ Chyba při ukládání:', error);
        showNotification('❌ Chyba při ukládání predikce', 'error');
    }
}

// Export predikce
function exportPrediction() {
    const errors = validateForm();
    if (errors.length > 0) {
        showNotification('❌ Nejdříve vyplňte všechna pole', 'error');
        return;
    }
    
    try {
        const formData = gatherFormData();
        
        const exportText = `DONULAND - PREDIKCE AKCE
=====================================

📋 ZÁKLADNÍ ÚDAJE:
Název akce: ${formData.eventName}
Kategorie: ${formData.category}
Město: ${formData.city}
Datum: ${formatDate(formData.eventDate)}
Návštěvnost: ${formatNumber(formData.visitors)}
Business model: ${formData.businessModel}

📊 VÝSLEDKY PREDIKCE:
(Aktuální výsledky z UI)

⏰ Exportováno: ${new Date().toLocaleString('cs-CZ')}
🍩 Donuland Management System
`;
        
        // Stažení souboru
        const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donuland-predikce-${formData.eventName.replace(/[^a-z0-9]/gi, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('📄 Predikce exportována', 'success');
        
    } catch (error) {
        console.error('❌ Chyba při exportu:', error);
        showNotification('❌ Chyba při exportu', 'error');
    }
}

// ========================================
// NASTAVENÍ FUNKCE
// ========================================

// Načtení uložených nastavení
function loadSettings() {
    try {
        const saved = localStorage.getItem('donulandSettings');
        if (!saved) {
            console.log('📋 Žádná uložená nastavení');
            return;
        }
        
        const settings = JSON.parse(saved);
        console.log('🔄 Načítám uložená nastavení...');
        
        // API nastavení
        if (settings.sheetsUrl) {
            const sheetsUrl = document.getElementById('sheetsUrl');
            if (sheetsUrl) sheetsUrl.value = settings.sheetsUrl;
        }
        if (settings.weatherKey) {
            const weatherKey = document.getElementById('weatherKey');
            if (weatherKey) weatherKey.value = settings.weatherKey;
        }
        if (settings.mapsKey) {
            const mapsKey = document.getElementById('mapsKey');
            if (mapsKey) mapsKey.value = settings.mapsKey;
        }
        
        // Business parametry
        if (settings.donutCost) {
            const donutCost = document.getElementById('donutCost');
            if (donutCost) donutCost.value = settings.donutCost;
        }
        if (settings.franchisePrice) {
            const franchisePrice = document.getElementById('franchisePrice');
            if (franchisePrice) franchisePrice.value = settings.franchisePrice;
        }
        if (settings.hourlyWage) {
            const hourlyWage = document.getElementById('hourlyWage');
            if (hourlyWage) hourlyWage.value = settings.hourlyWage;
        }
        if (settings.workHours) {
            const workHours = document.getElementById('workHours');
            if (workHours) workHours.value = settings.workHours;
        }
        if (settings.fuelCost) {
            const fuelCost = document.getElementById('fuelCost');
            if (fuelCost) fuelCost.value = settings.fuelCost;
        }
        
        console.log('✅ Nastavení načtena');
        
    } catch (error) {
        console.error('❌ Chyba při načítání nastavení:', error);
    }
}

// Uložení nastavení
function saveSettings() {
    try {
        const settings = {
            // API nastavení
            sheetsUrl: document.getElementById('sheetsUrl')?.value || '',
            weatherKey: document.getElementById('weatherKey')?.value || '',
            mapsKey: document.getElementById('mapsKey')?.value || '',
            
            // Business parametry
            donutCost: parseFloat(document.getElementById('donutCost')?.value) || CONFIG.DONUT_COST,
            franchisePrice: parseFloat(document.getElementById('franchisePrice')?.value) || CONFIG.FRANCHISE_PRICE,
            hourlyWage: parseFloat(document.getElementById('hourlyWage')?.value) || CONFIG.HOURLY_WAGE,
            workHours: parseFloat(document.getElementById('workHours')?.value) || CONFIG.WORK_HOURS,
            fuelCost: parseFloat(document.getElementById('fuelCost')?.value) || CONFIG.FUEL_COST,
            
            savedAt: new Date().toISOString()
        };
        
        // Aktualizace CONFIG objektu
        Object.assign(CONFIG, {
            DONUT_COST: settings.donutCost,
            FRANCHISE_PRICE: settings.franchisePrice,
            HOURLY_WAGE: settings.hourlyWage,
            WORK_HOURS: settings.workHours,
            FUEL_COST: settings.fuelCost
        });
        
        localStorage.setItem('donulandSettings', JSON.stringify(settings));
        
        console.log('💾 Nastavení uložena:', settings);
        showNotification('✅ Nastavení byla úspěšně uložena', 'success');
        
    } catch (error) {
        console.error('❌ Chyba při ukládání nastavení:', error);
        showNotification('❌ Chyba při ukládání nastavení', 'error');
    }
}

// ========================================
// GLOBÁLNÍ FUNKCE PRO HTML
// ========================================

// Globální funkce dostupné z HTML
window.updatePrediction = updatePrediction;
window.updateDistance = updateDistance;
window.updateWeather = updateWeather;
window.updateWeatherCard = updateWeatherCard;
window.updateBusinessInfo = updateBusinessInfo;
window.updateRentFields = updateRentFields;
window.savePrediction = savePrediction;
window.exportPrediction = exportPrediction;
window.saveSettings = saveSettings;
window.loadData = loadData;
window.showSection = showSection;

console.log('✅ App.js část 3 načtena - vzdálenost, UI, výsledky, nastavení');
console.log('🍩 Donuland Management System je připraven k použití!');
