/* ========================================
   DONULAND MANAGEMENT SYSTEM - APP.JS ČÁST 3A (1/2)
   Vzdálenosti, UI zobrazení
   ======================================== */

// ========================================
// VZDÁLENOSTI A MAPY
// ========================================

// Aktualizace vzdálenosti od Prahy
async function updateDistance() {
    const city = document.getElementById('city').value.trim();
    const distanceInput = document.getElementById('distance');
    
    if (!city || !distanceInput) return;
    
    try {
        distanceInput.value = 'Počítám...';
        const distance = await calculateDistance('Praha', city);
        distanceInput.value = distance ? `${distance} km` : 'Neznámá';
    } catch (error) {
        console.warn('Chyba při výpočtu vzdálenosti:', error);
        distanceInput.value = getFallbackDistance(city);
    }
}

// Výpočet vzdálenosti mezi městy
async function calculateDistance(from, to) {
    const cacheKey = `${from}-${to}`;
    
    // Kontrola cache
    if (globalData.distanceCache.has(cacheKey)) {
        return globalData.distanceCache.get(cacheKey);
    }
    
    // Fallback vzdálenosti pro česká města od Prahy
    const fallbackDistances = {
        'praha': 0,
        'brno': 195,
        'ostrava': 350,
        'plzeň': 90,
        'liberec': 100,
        'olomouc': 280,
        'hradec králové': 110,
        'pardubice': 100,
        'české budějovice': 150,
        'ústí nad labem': 75,
        'karlovy vary': 130,
        'jihlava': 125,
        'havířov': 365,
        'kladno': 25,
        'most': 80,
        'opava': 340,
        'frýdek-místek': 330,
        'karviná': 370,
        'teplice': 85,
        'děčín': 100
    };
    
    const cityNormalized = removeDiacritics(to.toLowerCase());
    
    // Hledání nejpodobnějšího města
    for (const [knownCity, distance] of Object.entries(fallbackDistances)) {
        if (cityNormalized.includes(knownCity) || knownCity.includes(cityNormalized)) {
            globalData.distanceCache.set(cacheKey, distance);
            return distance;
        }
    }
    
    // Pokus o Google Maps API
    try {
        const mapsKey = document.getElementById('mapsKey').value || CONFIG.MAPS_API_KEY;
        if (mapsKey && mapsKey !== 'demo') {
            const distance = await getDistanceFromMapsAPI(from, to, mapsKey);
            if (distance) {
                globalData.distanceCache.set(cacheKey, distance);
                return distance;
            }
        }
    } catch (error) {
        console.warn('Maps API selhal:', error);
    }
    
    // Default pro neznámá města
    const estimatedDistance = 150;
    globalData.distanceCache.set(cacheKey, estimatedDistance);
    return estimatedDistance;
}

// Fallback vzdálenost podle názvu města
function getFallbackDistance(city) {
    const cityLower = removeDiacritics(city.toLowerCase());
    
    if (cityLower.includes('praha')) return '0 km';
    if (cityLower.includes('brno')) return '195 km';
    if (cityLower.includes('ostrava')) return '350 km';
    if (cityLower.includes('plzeň') || cityLower.includes('plzen')) return '90 km';
    if (cityLower.includes('liberec')) return '100 km';
    if (cityLower.includes('olomouc')) return '280 km';
    
    return '150 km'; // Průměrná vzdálenost
}

// Google Maps Distance Matrix API
async function getDistanceFromMapsAPI(from, to, apiKey) {
    try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(from)}&destinations=${encodeURIComponent(to)}&units=metric&language=cs&key=${apiKey}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const mapsData = JSON.parse(data.contents);
        
        if (mapsData.status === 'OK' && mapsData.rows[0]?.elements[0]?.status === 'OK') {
            const distanceMeters = mapsData.rows[0].elements[0].distance.value;
            return Math.round(distanceMeters / 1000); // Převod na km
        }
    } catch (error) {
        console.warn('Maps API chyba:', error);
    }
    
    return null;
}

// ========================================
// UI ZOBRAZENÍ VÝSLEDKŮ
// ========================================

// Zobrazení výsledků predikce
function displayPredictionResults(prediction, businessResults, formData) {
    console.log('📊 Zobrazuji výsledky predikce...');
    
    const resultsDiv = document.getElementById('predictionResults');
    
    // Určení barvy na základě zisku
    let profitClass = 'positive';
    if (businessResults.profit < 0) profitClass = 'negative';
    else if (businessResults.profit < 5000) profitClass = 'warning';
    
    // Confidence styling
    let confidenceClass = 'positive';
    if (prediction.confidence < 60) confidenceClass = 'warning';
    if (prediction.confidence < 40) confidenceClass = 'negative';
    
    const html = `
        <div class="results-grid">
            <div class="result-item">
                <div class="result-value">${formatNumber(prediction.predictedSales)}</div>
                <div class="result-label">Predikovaný prodej (ks)</div>
            </div>
            
            <div class="result-item">
                <div class="result-value">${formatCurrency(businessResults.revenue)}</div>
                <div class="result-label">Očekávaný obrat</div>
            </div>
            
            <div class="result-item">
                <div class="result-value ${profitClass}">${formatCurrency(businessResults.profit)}</div>
                <div class="result-label">Očekávaný zisk</div>
            </div>
            
            <div class="result-item">
                <div class="result-value ${confidenceClass}">${prediction.confidence}%</div>
                <div class="result-label">Spolehlivost predikce</div>
            </div>
        </div>
        
        <div class="costs-breakdown">
            <h4>💰 Rozpis nákladů a zisku</h4>
            
            <div class="cost-item">
                <span>Obrat (${prediction.predictedSales} × ${formatCurrency(formData.price)})</span>
                <span>${formatCurrency(businessResults.revenue)}</span>
            </div>
            
            <div class="cost-item">
                <span>Výrobní náklady</span>
                <span>-${formatCurrency(businessResults.costs.production)}</span>
            </div>
            
            <div class="cost-item">
                <span>Dopravní náklady (${formData.distance} km)</span>
                <span>-${formatCurrency(businessResults.costs.transport)}</span>
            </div>
            
            <div class="cost-item">
                <span>Pracovní náklady</span>
                <span>-${formatCurrency(businessResults.costs.labor)}</span>
            </div>
            
            ${businessResults.costs.revenueShare > 0 ? `
            <div class="cost-item">
                <span>Podíl z obratu (5%)</span>
                <span>-${formatCurrency(businessResults.costs.revenueShare)}</span>
            </div>
            ` : ''}
            
            <div class="cost-item">
                <span>Nájem (${getRentTypeText(formData.rentType)})</span>
                <span>-${formatCurrency(businessResults.costs.rent)}</span>
            </div>
            
            <div class="cost-item">
                <span><strong>Celkový zisk</strong></span>
                <span><strong class="${profitClass}">${formatCurrency(businessResults.profit)}</strong></span>
            </div>
        </div>
        
        ${generateRecommendations(prediction, businessResults, formData)}
        
        ${displayPredictionFactors(prediction.factors)}
    `;
    
    resultsDiv.innerHTML = html;
}

// Získání textu typu nájmu
function getRentTypeText(rentType) {
    switch (rentType) {
        case 'fixed': return 'fixní';
        case 'percentage': return '% z obratu';
        case 'mixed': return 'fixní + %';
        case 'free': return 'zdarma';
        default: return 'neznámý';
    }
}

// Generování doporučení
function generateRecommendations(prediction, businessResults, formData) {
    const recommendations = [];
    
    // Doporučení na základě zisku
    if (businessResults.profit < 0) {
        recommendations.push('⚠️ Akce by byla ztrátová! Zvažte zvýšení ceny nebo snížení nákladů.');
        recommendations.push('💡 Zkuste vyjednat lepší podmínky nájmu nebo najít levnější dopravu.');
    } else if (businessResults.profit < 5000) {
        recommendations.push('⚠️ Nízký zisk. Zvažte optimalizaci nákladů nebo vyšší cenu.');
    } else if (businessResults.profit > 20000) {
        recommendations.push('🎉 Výborná příležitost! Vysoký očekávaný zisk.');
    }
    
    // Doporučení na základě confidence
    if (prediction.confidence < 50) {
        recommendations.push('📊 Nízká spolehlivost predikce. Buďte opatrní a připravte záložní plán.');
    }
    
    // Doporučení na základě počasí
    if (formData.eventType === 'outdoor') {
        recommendations.push('🌤️ Venkovní akce - sledujte předpověď počasí před akcí.');
    }
    
    // Doporučení na základě vzdálenosti
    if (formData.distance > 200) {
        recommendations.push('🚗 Dlouhá doprava zvyšuje náklady. Zvažte ubytování nebo jiný způsob dopravy.');
    }
    
    // Doporučení na základě business modelu
    if (formData.businessModel === 'franchise') {
        recommendations.push('🤝 Franšíza - nižší riziko, ale i nižší zisk. Hodí se pro začátečníky.');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('✅ Všechny parametry vypadají dobře!');
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

// Zobrazení predikčních faktorů
function displayPredictionFactors(factors) {
    return `
        <div class="factors-display">
            <h4>🧠 Predikční faktory</h4>
            <div class="factors-grid">
                <div class="factor-item">
                    <span>Základní konverze:</span>
                    <span>${(factors.base * 100).toFixed(1)}%</span>
                </div>
                <div class="factor-item">
                    <span>Historický faktor:</span>
                    <span>${factors.historical.toFixed(2)}×</span>
                </div>
                <div class="factor-item">
                    <span>Počasí faktor:</span>
                    <span>${factors.weather.toFixed(2)}×</span>
                </div>
                <div class="factor-item">
                    <span>Městský faktor:</span>
                    <span>${factors.city.toFixed(2)}×</span>
                </div>
                <div class="factor-item">
                    <span>Konkurence:</span>
                    <span>${factors.competition.toFixed(2)}×</span>
                </div>
                <div class="factor-item">
                    <span>Sezóna:</span>
                    <span>${factors.seasonal.toFixed(2)}×</span>
                </div>
                <div class="factor-item">
                    <span>Velikost akce:</span>
                    <span>${factors.size.toFixed(2)}×</span>
                </div>
                <div class="factor-item" style="border-top: 2px solid #667eea; padding-top: 10px; margin-top: 10px;">
                    <span><strong>Celková konverze:</strong></span>
                    <span><strong>${(factors.final * 100).toFixed(1)}%</strong></span>
                </div>
            </div>
        </div>
    `;
}

// Zobrazení historických dat
function displayHistoricalData(formData) {
    const historicalData = getHistoricalData(formData.eventName, formData.city, formData.category);
    const historicalCard = document.getElementById('historicalCard');
    const historicalDiv = document.getElementById('historicalData');
    
    if (!historicalData.matches || historicalData.matches.length === 0) {
        historicalCard.style.display = 'none';
        return;
    }
    
    historicalCard.style.display = 'block';
    
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
        const sales = parseFloat(match.M || 0);
        const eventName = match.E || 'Neznámá akce';
        const city = match.D || 'Neznámé město';
        const date = match.C || 'Neznámé datum';
        const visitors = parseFloat(match.K || 0);
        const conversion = visitors > 0 ? ((sales / visitors) * 100).toFixed(1) : '0';
        
        html += `
            <div class="historical-item">
                <div class="historical-info">
                    <h4>${escapeHtml(eventName)}</h4>
                    <p>${escapeHtml(city)} • ${formatDate(date)} • ${formatNumber(visitors)} návštěvníků</p>
                    <p style="color: #666; font-size: 0.8em;">Podobnost: ${'★'.repeat(Math.min(5, Math.max(1, Math.round(match.similarityScore))))}${'☆'.repeat(5 - Math.min(5, Math.max(1, Math.round(match.similarityScore))))}</p>
                </div>
                <div class="historical-stats">
                    <div class="historical-sales">${formatNumber(sales)} ks</div>
                    <div style="font-size: 0.9em; color: #666;">${conversion}% konverze</div>
                </div>
            </div>
        `;
    });
    
    historicalDiv.innerHTML = html;
}

// Zobrazení počasí
function displayWeather(weather) {
    const weatherDisplay = document.getElementById('weatherDisplay');
    const weatherCard = document.getElementById('weatherCard');
    
    if (!weatherDisplay || !weatherCard) return;
    
    weatherCard.style.display = 'block';
    
    // Ikona podle podmínek
    let icon = '☀️';
    if (weather.main === 'Clouds') icon = '☁️';
    else if (weather.main === 'Rain') icon = '🌧️';
    else if (weather.main === 'Drizzle') icon = '🌦️';
    else if (weather.main === 'Snow') icon = '❄️';
    else if (weather.main === 'Thunderstorm') icon = '⛈️';
    else if (weather.main === 'Clear') icon = '☀️';
    
    // Výpočet weather faktoru pro zobrazení
    const impact = getWeatherImpactFactor(weather);
    let impactText = 'Neutrální vliv';
    let impactColor = '#666';
    
    if (impact > 1.05) {
        impactText = 'Pozitivní vliv na prodej';
        impactColor = '#28a745';
    } else if (impact < 0.85) {
        impactText = 'Negativní vliv na prodej';
        impactColor = '#dc3545';
    }
    
    // Varování před špatným počasím
    let warningHtml = '';
    if (weather.main === 'Rain' || weather.main === 'Thunderstorm' || weather.temp < 5) {
        warningHtml = `
            <div class="weather-warning">
                ⚠️ <strong>Varování:</strong> Nepříznivé počasí může výrazně snížit návštěvnost venkovních akcí. 
                Zvažte přípravu zastřešení nebo přesun akce.
            </div>
        `;
    }
    
    const html = `
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
                <div class="weather-detail">
                    <div class="weather-detail-value" style="color: ${impactColor};">${(impact * 100 - 100).toFixed(0)}%</div>
                    <div class="weather-detail-label">Vliv na prodej</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 15px; color: ${impactColor}; font-weight: 600;">
                ${impactText}
            </div>
            
            ${weather.isFallback ? '<div style="text-align: center; margin-top: 10px; font-size: 0.9em; opacity: 0.8;">⚠️ Odhad na základě sezóny</div>' : ''}
            
            ${warningHtml}
        </div>
    `;
    
    weatherDisplay.innerHTML = html;
}

// ========================================
// AKTUALIZACE UI FUNKCÍ
// ========================================

// Aktualizace weather karty podle typu akce
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

// Aktualizace business info
function updateBusinessInfo() {
    const businessModel = document.getElementById('businessModel').value;
    const businessInfo = document.getElementById('businessInfo');
    
    if (!businessModel) {
        businessInfo.style.display = 'none';
        return;
    }
    
    businessInfo.style.display = 'block';
    
    let html = '';
    
    switch (businessModel) {
        case 'owner':
            html = `
                <h4>🏪 Režim majitele</h4>
                <ul>
                    <li>Vy jako majitel + 2 brigádníci</li>
                    <li>Mzda: ${CONFIG.HOURLY_WAGE} Kč/hodina na osobu</li>
                    <li>Celý zisk zůstává vám</li>
                    <li>Nejvyšší riziko, ale i nejvyšší zisk</li>
                </ul>
            `;
            break;
        case 'employee':
            html = `
                <h4>👨‍💼 Režim zaměstnance</h4>
                <ul>
                    <li>Vy jako zaměstnanec + 1 brigádník</li>
                    <li>Mzda: ${CONFIG.HOURLY_WAGE} Kč/hodina</li>
                    <li>Dodatečně 5% z celkového obratu</li>
                    <li>Nižší riziko, střední zisk</li>
                </ul>
            `;
            break;
        case 'franchise':
            html = `
                <h4>🤝 Franšízový režim</h4>
                <ul>
                    <li>Nákup donutů za ${CONFIG.FRANCHISE_PRICE} Kč/ks</li>
                    <li>Prodej za vámi stanovenou cenu</li>
                    <li>Bez mzdových nákladů</li>
                    <li>Nejnižší riziko, ale i nejnižší zisk</li>
                </ul>
            `;
            break;
    }
    
    businessInfo.innerHTML = html;
}

// Aktualizace polí nájmu
function updateRentFields() {
    const rentType = document.getElementById('rentType').value;
    
    // Skrytí všech polí
    document.getElementById('fixedRentGroup').style.display = 'none';
    document.getElementById('percentageGroup').style.display = 'none';
    document.getElementById('mixedFixedGroup').style.display = 'none';
    document.getElementById('mixedPercentageGroup').style.display = 'none';
    
    // Zobrazení podle typu
    switch (rentType) {
        case 'fixed':
            document.getElementById('fixedRentGroup').style.display = 'block';
            break;
        case 'percentage':
            document.getElementById('percentageGroup').style.display = 'block';
            break;
        case 'mixed':
            document.getElementById('mixedFixedGroup').style.display = 'block';
            document.getElementById('mixedPercentageGroup').style.display = 'block';
            break;
    }
}

console.log('✅ App.js část 3A načtena - vzdálenosti a UI zobrazení');
/* ========================================
   DONULAND MANAGEMENT SYSTEM - APP.JS ČÁST 3B (2/2)
   Export/save, nastavení, utility funkce
   ======================================== */

// ========================================
// EXPORT A SAVE FUNKCE
// ========================================

// Uložení predikce
function savePrediction() {
    console.log('💾 Ukládám predikci...');
    
    try {
        // Sběr aktuálních dat
        const formData = gatherFormData();
        const errors = validateForm();
        
        if (errors.length > 0) {
            showNotification(`Nelze uložit: ${errors.join(', ')}`, 'error');
            return;
        }
        
        // Vytvoření záznamu
        const predictionRecord = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            eventName: formData.eventName,
            category: formData.category,
            city: formData.city,
            eventDate: formData.eventDate,
            visitors: formData.visitors,
            competition: formData.competition,
            eventType: formData.eventType,
            businessModel: formData.businessModel,
            rentType: formData.rentType,
            rentData: {
                fixed: formData.fixedRent,
                percentage: formData.percentage,
                mixedFixed: formData.mixedFixed,
                mixedPercentage: formData.mixedPercentage
            },
            price: formData.price,
            distance: formData.distance,
            predictedSales: null, // Bude dopočítáno
            actualSales: null,
            notes: '',
            status: 'planned'
        };
        
        // Uložení do localStorage
        const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
        savedPredictions.push(predictionRecord);
        localStorage.setItem('donuland_predictions', JSON.stringify(savedPredictions));
        
        showNotification('✅ Predikce byla úspěšně uložena', 'success');
        
        // Refresh kalendáře
        if (typeof updateCalendar === 'function') {
            updateCalendar();
        }
        
    } catch (error) {
        console.error('❌ Chyba při ukládání:', error);
        showNotification('❌ Chyba při ukládání predikce', 'error');
    }
}

// Export predikce
function exportPrediction() {
    console.log('📄 Exportuji predikci...');
    
    try {
        const formData = gatherFormData();
        const errors = validateForm();
        
        if (errors.length > 0) {
            showNotification(`Nelze exportovat: ${errors.join(', ')}`, 'error');
            return;
        }
        
        // Vytvoření CSV dat
        const csvData = generateCSVExport(formData);
        
        // Download souboru
        downloadFile(csvData, `donuland_predikce_${formData.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        
        showNotification('📄 Export dokončen', 'success');
        
    } catch (error) {
        console.error('❌ Chyba při exportu:', error);
        showNotification('❌ Chyba při exportu', 'error');
    }
}

// Generování CSV exportu
function generateCSVExport(formData) {
    const headers = [
        'Datum exportu',
        'Název akce',
        'Kategorie',
        'Město',
        'Datum akce',
        'Návštěvnost',
        'Konkurence',
        'Typ akce',
        'Business model',
        'Typ nájmu',
        'Cena donuts',
        'Vzdálenost',
        'Predikovaný prodej',
        'Očekávaný obrat',
        'Očekávaný zisk'
    ];
    
    // Přepočítání aktuálních výsledků
    const prediction = { predictedSales: 0, confidence: 0 }; // Zjednodušeno pro export
    const businessResults = calculateBusinessMetrics(formData, prediction);
    
    const values = [
        new Date().toLocaleDateString('cs-CZ'),
        formData.eventName,
        formData.category,
        formData.city,
        formatDate(formData.eventDate),
        formData.visitors,
        formData.competition,
        formData.eventType,
        formData.businessModel,
        formData.rentType,
        formData.price,
        formData.distance,
        prediction.predictedSales,
        businessResults.revenue,
        businessResults.profit
    ];
    
    // Vytvoření CSV
    const csvRows = [
        headers.join(';'),
        values.map(value => `"${value}"`).join(';')
    ];
    
    return csvRows.join('\n');
}

// Download souboru
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Generování unikátního ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========================================
// NASTAVENÍ A KONFIGURACE
// ========================================

// Uložení nastavení
function saveSettings() {
    console.log('⚙️ Ukládám nastavení...');
    
    try {
        const settings = {
            // API nastavení
            sheetsUrl: document.getElementById('sheetsUrl').value,
            weatherKey: document.getElementById('weatherKey').value,
            mapsKey: document.getElementById('mapsKey').value,
            
            // Business parametry
            donutCost: parseFloat(document.getElementById('donutCost').value) || CONFIG.DONUT_COST,
            franchisePrice: parseFloat(document.getElementById('franchisePrice').value) || CONFIG.FRANCHISE_PRICE,
            hourlyWage: parseFloat(document.getElementById('hourlyWage').value) || CONFIG.HOURLY_WAGE,
            workHours: parseFloat(document.getElementById('workHours').value) || CONFIG.WORK_HOURS,
            fuelCost: parseFloat(document.getElementById('fuelCost').value) || CONFIG.FUEL_COST,
            
            // Predikční faktory
            categoryFactors: {
                'food festival': parseFloat(document.getElementById('factorFood').value) || 0.15,
                'veletrh': parseFloat(document.getElementById('factorVeletrh').value) || 0.18,
                'koncert': parseFloat(document.getElementById('factorKoncert').value) || 0.08
            },
            
            cityFactors: {
                'praha': parseFloat(document.getElementById('factorPraha').value) || 1.3,
                'brno': parseFloat(document.getElementById('factorBrno').value) || 1.2,
                'default': parseFloat(document.getElementById('factorOther').value) || 0.85
            }
        };
        
        // Uložení do localStorage
        localStorage.setItem('donuland_settings', JSON.stringify(settings));
        
        // Aktualizace globální konfigurace
        updateGlobalConfig(settings);
        
        showNotification('✅ Nastavení uloženo', 'success');
        
    } catch (error) {
        console.error('❌ Chyba při ukládání nastavení:', error);
        showNotification('❌ Chyba při ukládání nastavení', 'error');
    }
}

// Načtení nastavení
function loadSettings() {
    try {
        const saved = localStorage.getItem('donuland_settings');
        if (!saved) return;
        
        const settings = JSON.parse(saved);
        
        // Načtení API nastavení
        if (settings.sheetsUrl) document.getElementById('sheetsUrl').value = settings.sheetsUrl;
        if (settings.weatherKey) document.getElementById('weatherKey').value = settings.weatherKey;
        if (settings.mapsKey) document.getElementById('mapsKey').value = settings.mapsKey;
        
        // Načtení business parametrů
        if (settings.donutCost) document.getElementById('donutCost').value = settings.donutCost;
        if (settings.franchisePrice) document.getElementById('franchisePrice').value = settings.franchisePrice;
        if (settings.hourlyWage) document.getElementById('hourlyWage').value = settings.hourlyWage;
        if (settings.workHours) document.getElementById('workHours').value = settings.workHours;
        if (settings.fuelCost) document.getElementById('fuelCost').value = settings.fuelCost;
        
        // Načtení faktorů
        if (settings.categoryFactors) {
            const factors = settings.categoryFactors;
            if (factors['food festival']) document.getElementById('factorFood').value = factors['food festival'];
            if (factors['veletrh']) document.getElementById('factorVeletrh').value = factors['veletrh'];
            if (factors['koncert']) document.getElementById('factorKoncert').value = factors['koncert'];
        }
        
        if (settings.cityFactors) {
            const factors = settings.cityFactors;
            if (factors['praha']) document.getElementById('factorPraha').value = factors['praha'];
            if (factors['brno']) document.getElementById('factorBrno').value = factors['brno'];
            if (factors['default']) document.getElementById('factorOther').value = factors['default'];
        }
        
        // Aktualizace globální konfigurace
        updateGlobalConfig(settings);
        
        console.log('✅ Nastavení načteno');
        
    } catch (error) {
        console.error('❌ Chyba při načítání nastavení:', error);
    }
}

// Aktualizace globální konfigurace
function updateGlobalConfig(settings) {
    if (settings.donutCost) CONFIG.DONUT_COST = settings.donutCost;
    if (settings.franchisePrice) CONFIG.FRANCHISE_PRICE = settings.franchisePrice;
    if (settings.hourlyWage) CONFIG.HOURLY_WAGE = settings.hourlyWage;
    if (settings.workHours) CONFIG.WORK_HOURS = settings.workHours;
    if (settings.fuelCost) CONFIG.FUEL_COST = settings.fuelCost;
    
    if (settings.categoryFactors) {
        Object.assign(CONFIG.CATEGORY_FACTORS, settings.categoryFactors);
    }
    
    if (settings.cityFactors) {
        Object.assign(CONFIG.CITY_FACTORS, settings.cityFactors);
    }
}

// Reset nastavení
function resetSettings() {
    if (!confirm('Opravdu chcete obnovit výchozí nastavení? Všechny změny budou ztraceny.')) {
        return;
    }
    
    try {
        // Smazání uložených nastavení
        localStorage.removeItem('donuland_settings');
        
        // Obnovení výchozích hodnot v UI
        document.getElementById('sheetsUrl').value = CONFIG.SHEETS_URL;
        document.getElementById('weatherKey').value = CONFIG.WEATHER_API_KEY;
        document.getElementById('mapsKey').value = CONFIG.MAPS_API_KEY;
        
        document.getElementById('donutCost').value = 32;
        document.getElementById('franchisePrice').value = 52;
        document.getElementById('hourlyWage').value = 150;
        document.getElementById('workHours').value = 10;
        document.getElementById('fuelCost').value = 15;
        
        resetFactors();
        
        showNotification('✅ Nastavení obnoveno na výchozí hodnoty', 'success');
        
    } catch (error) {
        console.error('❌ Chyba při resetu nastavení:', error);
        showNotification('❌ Chyba při resetu nastavení', 'error');
    }
}

// Reset faktorů
function resetFactors() {
    document.getElementById('factorFood').value = 0.15;
    document.getElementById('factorVeletrh').value = 0.18;
    document.getElementById('factorKoncert').value = 0.08;
    document.getElementById('factorPraha').value = 1.3;
    document.getElementById('factorBrno').value = 1.2;
    document.getElementById('factorOther').value = 0.85;
}

// Test připojení
async function testConnections() {
    console.log('🔧 Testuji připojení...');
    
    const testResults = {
        sheets: false,
        weather: false,
        maps: false
    };
    
    showNotification('🔧 Testuji připojení...', 'info', 0);
    
    // Test Google Sheets
    try {
        const sheetsUrl = document.getElementById('sheetsUrl').value;
        const sheetId = extractSheetId(sheetsUrl);
        if (sheetId) {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
                testResults.sheets = true;
            }
        }
    } catch (error) {
        console.warn('Sheets test failed:', error);
    }
    
    // Test Weather API
    try {
        const weatherKey = document.getElementById('weatherKey').value;
        if (weatherKey && weatherKey !== 'demo') {
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=Praha&appid=${weatherKey}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(weatherUrl)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const data = await response.json();
                const weatherData = JSON.parse(data.contents);
                if (weatherData.cod === 200) {
                    testResults.weather = true;
                }
            }
        }
    } catch (error) {
        console.warn('Weather test failed:', error);
    }
    
    // Test Maps API
    try {
        const mapsKey = document.getElementById('mapsKey').value;
        if (mapsKey && mapsKey !== 'demo') {
            const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=Praha&destinations=Brno&key=${mapsKey}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(mapsUrl)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const data = await response.json();
                const mapsData = JSON.parse(data.contents);
                if (mapsData.status === 'OK') {
                    testResults.maps = true;
                }
            }
        }
    } catch (error) {
        console.warn('Maps test failed:', error);
    }
    
    // Zobrazení výsledků
    let message = 'Výsledky testů připojení:\n';
    message += `📊 Google Sheets: ${testResults.sheets ? '✅ OK' : '❌ Chyba'}\n`;
    message += `🌤️ Weather API: ${testResults.weather ? '✅ OK' : '❌ Chyba'}\n`;
    message += `🗺️ Maps API: ${testResults.maps ? '✅ OK' : '❌ Chyba'}`;
    
    const allOk = testResults.sheets && testResults.weather && testResults.maps;
    showNotification(message, allOk ? 'success' : 'warning', 8000);
}

// ========================================
// KALENDÁŘ A ANALÝZY
// ========================================

// Aktualizace kalendáře (zjednodušená implementace)
function updateCalendar() {
    console.log('📅 Aktualizuji kalendář...');
    
    // Získání uložených predikcí
    const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
    
    // Vytvoření kalendářního zobrazení by zde bylo implementováno
    // Pro ukázku pouze logování
    console.log(`📅 Nalezeno ${savedPredictions.length} uložených predikcí`);
}

// Analýza dat (zjednodušená implementace)
function updateAnalytics() {
    console.log('📊 Aktualizuji analýzy...');
    
    if (!globalData.historicalData || globalData.historicalData.length === 0) {
        console.log('📊 Žádná data pro analýzu');
        return;
    }
    
    // Základní statistiky
    const totalEvents = globalData.historicalData.length;
    const totalSales = globalData.historicalData
        .map(row => parseFloat(row.M || 0))
        .reduce((sum, sales) => sum + sales, 0);
    
    const avgSales = totalEvents > 0 ? totalSales / totalEvents : 0;
    
    console.log(`📊 Analýza: ${totalEvents} akcí, ${Math.round(totalSales)} prodejů celkem, ${Math.round(avgSales)} průměrně`);
    
    // Aktualizace UI by zde byla implementována
    const overallStats = document.getElementById('overallStats');
    if (overallStats) {
        overallStats.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${totalEvents}</div>
                <div class="stat-label">Celkem akcí</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatNumber(Math.round(totalSales))}</div>
                <div class="stat-label">Celkem prodejů</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatNumber(Math.round(avgSales))}</div>
                <div class="stat-label">Průměrný prodej</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatCurrency(Math.round(totalSales * CONFIG.DONUT_PRICE))}</div>
                <div class="stat-label">Celkový obrat</div>
            </div>
        `;
    }
}

// ========================================
// HELPER FUNKCE PRO UI
// ========================================

// Přepínání sekcí s animací
function switchSection(sectionId) {
    // Skrytí všech sekcí
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.opacity = '0';
    });
    
    // Zobrazení vybrané sekce s animací
    setTimeout(() => {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.opacity = '1';
            targetSection.classList.add('fade-in');
        }
    }, 150);
    
    // Speciální akce pro jednotlivé sekce
    switch (sectionId) {
        case 'calendar':
            updateCalendar();
            break;
        case 'analytics':
            updateAnalytics();
            break;
    }
}

// Rozšíření showSection funkce
const originalShowSection = showSection;
showSection = function(sectionId) {
    switchSection(sectionId);
};

// Modal pro editaci akcí
function openEventModal(eventId) {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Načtení dat akce pokud existuje
        if (eventId) {
            const savedPredictions = JSON.parse(localStorage.getItem('donuland_predictions') || '[]');
            const event = savedPredictions.find(p => p.id === eventId);
            
            if (event) {
                document.getElementById('modalEventName').value = event.eventName;
                document.getElementById('modalSales').value = event.actualSales || '';
                document.getElementById('modalNotes').value = event.notes || '';
            }
        }
    }
}

function closeModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveEventEdit() {
    // Implementace uložení změn
    console.log('💾 Ukládám změny události...');
    closeModal();
}

function deleteEvent() {
    if (confirm('Opravdu chcete smazat tuto akci?')) {
        console.log('🗑️ Mažu událost...');
        closeModal();
    }
}

// ========================================
// ROZŠÍŘENÉ EVENT LISTENERY
// ========================================

// Posluchače pro pokročilé funkce
document.addEventListener('DOMContentLoaded', function() {
    // Automatické uložení při změnách (s debounce)
    let saveTimeout;
    
    function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            if (validateForm().length === 0) {
                console.log('🔄 Auto-save...');
                // Auto-save logika by zde byla implementována
            }
        }, 2000);
    }
    
    // Přidání event listenerů na všechny formulářové prvky
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('change', debouncedSave);
    });
    
    // Klávesové zkratky
    document.addEventListener('keydown', function(e) {
        // Ctrl+S pro uložení
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            savePrediction();
        }
        
        // Ctrl+E pro export
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportPrediction();
        }
        
        // Escape pro zavření modalu
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Kliknutí mimo modal pro zavření
    document.getElementById('eventModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
});

// ========================================
// UTILITY FUNKCE
// ========================================

// Validace API klíčů
function validateApiKey(key, type) {
    if (!key || key === 'demo') return false;
    
    switch (type) {
        case 'weather':
            return /^[a-f0-9]{32}$/i.test(key);
        case 'maps':
            return /^[A-Za-z0-9_-]{39}$/.test(key);
        default:
            return key.length > 10;
    }
}

// Formátování času
function formatTime(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toLocaleTimeString('cs-CZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Formátování relativního času
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Dnes';
    if (days === 1) return 'Včera';
    if (days === -1) return 'Zítra';
    if (days > 0) return `Před ${days} dny`;
    return `Za ${Math.abs(days)} dní`;
}

// Kontrola síťového připojení
function checkNetworkStatus() {
    if (!navigator.onLine) {
        showNotification('🔌 Jste offline. Některé funkce nemusí fungovat.', 'warning');
        updateStatus('offline', 'Offline režim');
    }
}

// Event listenery pro síť
window.addEventListener('online', function() {
    showNotification('🌐 Připojení obnoveno', 'success');
    updateStatus('online', 'Online');
});

window.addEventListener('offline', function() {
    showNotification('🔌 Ztraceno internetové připojení', 'warning');
    updateStatus('offline', 'Offline');
});

// ========================================
// FINALIZACE A INICIALIZACE
// ========================================

// Rozšíření inicializace UI
const originalInitializeUI = initializeUI;
initializeUI = function() {
    originalInitializeUI();
    
    // Dodatečná inicializace
    console.log('🔧 Rozšířená inicializace UI...');
    
    // Kontrola síťového stavu
    checkNetworkStatus();
    
    // Načtení uložených predikcí pro kalendář
    updateCalendar();
    
    // Prvotní analýza dat
    setTimeout(() => {
        if (globalData.historicalData.length > 0) {
            updateAnalytics();
        }
    }, 1000);
};

// Debug funkcionalita (pouze pro vývoj)
window.donulandDebug = {
    showConfig: () => console.table(CONFIG),
    showData: () => console.log(globalData),
    clearCache: () => {
        globalData.weatherCache.clear();
        globalData.distanceCache.clear();
        console.log('🧹 Cache vymazána');
    },
    exportLogs: () => {
        const logs = {
            config: CONFIG,
            data: globalData,
            timestamp: new Date().toISOString()
        };
        downloadFile(JSON.stringify(logs, null, 2), 'donuland_debug.json', 'application/json');
    }
};

// Poslední kontrola při načtení
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 Donuland Management System - Kompletně načten');
    console.log('📚 Pro debug použijte: window.donulandDebug');
    
    // Validace HTML struktury
    const requiredElements = [
        'loadingScreen', 'mainApp', 'status', 'predictionResults',
        'eventName', 'category', 'city', 'eventDate'
    ];
    
    const missing = requiredElements.filter(id => !document.getElementById(id));
    if (missing.length > 0) {
        console.warn('⚠️ Chybějící HTML elementy:', missing);
    }
});

console.log('✅ App.js část 3B načtena - export/save a nastavení');
