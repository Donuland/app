/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 3
   UI Display & Results Visualization
   Pouze zobrazení výsledků z Part 2C
   ======================================== */

console.log('🍩 Donuland Part 3 loading...');

// ========================================
// PREDICTION RESULTS DISPLAY
// ========================================

// Hlavní funkce pro zobrazení výsledků predikce
function displayPredictionResults(predictionData) {
    console.log('🎯 Displaying prediction results...');
    
    const { formData, prediction, businessResults } = predictionData;
    const resultsDiv = document.getElementById('predictionResults');
    
    if (!resultsDiv) {
        console.error('❌ Results div not found');
        return;
    }
    
    try {
        // Generování HTML pro výsledky
        const html = generatePredictionHTML(prediction, businessResults, formData);
        resultsDiv.innerHTML = html;
        
        // Animace zobrazení
        resultsDiv.classList.add('fade-in');
        
        // Zobrazení action buttons
        showActionButtons();
        
        console.log('✅ Prediction results displayed successfully');
        
    } catch (error) {
        console.error('❌ Error displaying prediction results:', error);
        displayErrorResults(error.message);
    }
}

// Generování HTML pro predikci
function generatePredictionHTML(prediction, businessResults, formData) {
    const sales = prediction.predictedSales;
    const confidence = prediction.confidence;
    const revenue = businessResults.revenue;
    const profit = businessResults.profit;
    const roi = businessResults.roi;
    const margin = businessResults.margin;
    
    // Určení barev podle hodnot
    const confidenceColor = confidence > 70 ? '#28a745' : confidence > 40 ? '#ffc107' : '#dc3545';
    const profitColor = profit > 0 ? '#28a745' : '#dc3545';
    const profitIcon = profit > 0 ? '✅' : '❌';
    const roiColor = roi > 20 ? '#28a745' : roi > 0 ? '#ffc107' : '#dc3545';
    const marginColor = margin > 30 ? '#28a745' : margin > 15 ? '#ffc107' : '#dc3545';
    
    return `
        <div class="prediction-results-container">
            <!-- Hlavní výsledky -->
            <div class="main-results">
                <h3>🎯 Výsledky AI predikce</h3>
                
                <div class="results-grid">
                    <div class="result-item primary">
                        <div class="result-icon">🍩</div>
                        <div class="result-value">${formatNumber(sales)}</div>
                        <div class="result-label">Predikovaný prodej (ks)</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-icon">🎯</div>
                        <div class="result-value" style="color: ${confidenceColor};">${confidence}%</div>
                        <div class="result-label">Confidence predikce</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-icon">💰</div>
                        <div class="result-value">${formatCurrency(revenue)}</div>
                        <div class="result-label">Očekávaný obrat</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-icon">${profitIcon}</div>
                        <div class="result-value" style="color: ${profitColor};">${formatCurrency(profit)}</div>
                        <div class="result-label">Očekávaný zisk</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-icon">📈</div>
                        <div class="result-value" style="color: ${roiColor};">${roi.toFixed(1)}%</div>
                        <div class="result-label">ROI</div>
                    </div>
                    
                    <div class="result-item">
                        <div class="result-icon">📊</div>
                        <div class="result-value" style="color: ${marginColor};">${margin.toFixed(1)}%</div>
                        <div class="result-label">Marže</div>
                    </div>
                </div>
            </div>
            
            <!-- Faktory breakdown -->
            <div class="factors-breakdown">
                <h4>🧠 Rozklad AI faktorů</h4>
                <div class="factors-explanation">
                    <p>Finální konverze: <strong>${(prediction.factors.final * 100).toFixed(2)}%</strong> návštěvníků koupí donut</p>
                </div>
                
                <div class="factors-grid">
                    ${generateFactorItem('📋 Kategorie', prediction.factors.base)}
                    ${generateFactorItem('📊 Historické data', prediction.factors.historical)}
                    ${generateFactorItem('🏙️ Město', prediction.factors.city)}
                    ${generateFactorItem('🏪 Konkurence', prediction.factors.competition)}
                    ${generateFactorItem('📅 Sezóna', prediction.factors.seasonal)}
                    ${generateFactorItem('👥 Velikost akce', prediction.factors.size)}
                    ${generateFactorItem('🌤️ Počasí', prediction.factors.weather)}
                    ${generateFactorItem('⏰ Délka akce', prediction.factors.duration)}
                </div>
                
                <div class="factors-note">
                    <small>💡 Faktory >100% zvyšují prodej, <100% snižují. Zelená = pozitivní, červená = negativní vliv.</small>
                </div>
            </div>
            
            <!-- Business breakdown -->
            <div class="business-breakdown">
                <h4>💼 Finanční analýza</h4>
                
                <div class="business-summary">
                    <div class="business-metric">
                        <span class="metric-label">Break-even point:</span>
                        <span class="metric-value">${formatNumber(businessResults.breakeven)} ks</span>
                    </div>
                    <div class="business-metric">
                        <span class="metric-label">Business model:</span>
                        <span class="metric-value">${getBusinessModelLabel(businessResults.metadata.businessModel)}</span>
                    </div>
                    <div class="business-metric">
                        <span class="metric-label">Cena za kus:</span>
                        <span class="metric-value">${formatCurrency(businessResults.metadata.pricePerUnit)}</span>
                    </div>
                </div>
                
                <div class="costs-breakdown">
                    <h5>📊 Rozpis nákladů</h5>
                    <div class="costs-grid">
                        <div class="cost-item">
                            <div class="cost-icon">🍩</div>
                            <div class="cost-details">
                                <div class="cost-name">Výroba</div>
                                <div class="cost-value">${formatCurrency(businessResults.costs.production)}</div>
                            </div>
                        </div>
                        
                        <div class="cost-item">
                            <div class="cost-icon">👨‍💼</div>
                            <div class="cost-details">
                                <div class="cost-name">Mzdy</div>
                                <div class="cost-value">${formatCurrency(businessResults.costs.labor)}</div>
                            </div>
                        </div>
                        
                        <div class="cost-item">
                            <div class="cost-icon">🚗</div>
                            <div class="cost-details">
                                <div class="cost-name">Doprava</div>
                                <div class="cost-value">${formatCurrency(businessResults.costs.transport)}</div>
                            </div>
                        </div>
                        
                        <div class="cost-item">
                            <div class="cost-icon">🏢</div>
                            <div class="cost-details">
                                <div class="cost-name">Nájem</div>
                                <div class="cost-value">${formatCurrency(businessResults.costs.rent)}</div>
                            </div>
                        </div>
                        
                        ${businessResults.costs.revenueShare > 0 ? `
                        <div class="cost-item">
                            <div class="cost-icon">📊</div>
                            <div class="cost-details">
                                <div class="cost-name">% z obratu</div>
                                <div class="cost-value">${formatCurrency(businessResults.costs.revenueShare)}</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="costs-total">
                        <div class="total-row revenue">
                            <span>💰 Celkový obrat:</span>
                            <span>${formatCurrency(revenue)}</span>
                        </div>
                        <div class="total-row costs">
                            <span>💸 Celkové náklady:</span>
                            <span>${formatCurrency(businessResults.totalCosts)}</span>
                        </div>
                        <div class="total-row profit ${profit > 0 ? 'positive' : 'negative'}">
                            <span><strong>${profitIcon} Čistý zisk:</strong></span>
                            <span><strong>${formatCurrency(profit)}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Doporučení -->
            ${generateRecommendationsHTML(formData, prediction, businessResults)}
        </div>
    `;
}

// Helper funkce pro generování faktoru
function generateFactorItem(name, value) {
    const percentage = (value * 100).toFixed(0);
    const barWidth = Math.min(Math.abs(value - 1) * 100 + 50, 100);
    const barColor = value > 1 ? '#28a745' : value < 1 ? '#dc3545' : '#6c757d';
    
    return `
        <div class="factor-item">
            <div class="factor-name">${name}</div>
            <div class="factor-value">${percentage}%</div>
            <div class="factor-bar">
                <div class="factor-fill" style="width: ${barWidth}%; background-color: ${barColor};"></div>
            </div>
        </div>
    `;
}

// Helper funkce pro business model label
function getBusinessModelLabel(businessModel) {
    const labels = {
        'owner': '🏪 Majitel',
        'employee': '👨‍💼 Zaměstnanec',
        'franchise': '🤝 Franšíza'
    };
    return labels[businessModel] || businessModel;
}

// Generování doporučení HTML
function generateRecommendationsHTML(formData, prediction, businessResults) {
    // Použití funkce z Part 2C
    const recommendations = generateRecommendations(formData, prediction, businessResults);
    
    if (!recommendations || recommendations.length === 0) {
        return `
            <div class="recommendations">
                <h4>💡 Doporučení</h4>
                <div class="recommendation-item success">
                    <div class="recommendation-icon">✅</div>
                    <div class="recommendation-content">
                        <div class="recommendation-title">Výborné podmínky</div>
                        <div class="recommendation-text">Všechny faktory jsou optimální pro úspěšnou akci!</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    const recommendationsHtml = recommendations.map(rec => `
        <div class="recommendation-item ${rec.type}">
            <div class="recommendation-icon">${rec.icon}</div>
            <div class="recommendation-content">
                <div class="recommendation-title">${rec.title}</div>
                <div class="recommendation-text">${rec.text}</div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="recommendations">
            <h4>💡 Doporučení pro úspěšnou akci</h4>
            ${recommendationsHtml}
        </div>
    `;
}

// ========================================
// ERROR HANDLING
// ========================================

// Zobrazení chyby při predikci
function displayErrorResults(errorMessage) {
    const resultsDiv = document.getElementById('predictionResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="prediction-error">
            <div class="error-icon">❌</div>
            <h4>Chyba při výpočtu predikce</h4>
            <p>${escapeHtml(errorMessage)}</p>
            <button class="btn btn-retry" onclick="retryPrediction()">🔄 Zkusit znovu</button>
        </div>
    `;
}

// Retry predikce
function retryPrediction() {
    console.log('🔄 Retrying prediction...');
    
    const validation = validateRequiredFields();
    if (validation.valid) {
        updatePrediction();
    } else {
        showNotification('❌ Opravte chyby ve formuláři před opakováním', 'error');
    }
}

// ========================================
// ACTION BUTTONS
// ========================================

// Zobrazení action buttons
function showActionButtons() {
    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
        actionButtons.style.display = 'flex';
        actionButtons.classList.add('fade-in');
    }
}

// Skrytí action buttons
function hideActionButtons() {
    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) {
        actionButtons.style.display = 'none';
    }
}

// ========================================
// PLACEHOLDER DISPLAY
// ========================================

// Zobrazení placeholder při načtení
function displayPredictionPlaceholder() {
    const resultsDiv = document.getElementById('predictionResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="prediction-placeholder">
            <div class="placeholder-icon">🤖</div>
            <h4>Připraveno k analýze</h4>
            <p>Vyplňte všechna povinná pole označená * pro spuštění AI predikce prodeje</p>
            <div class="required-fields-list">
                <div class="field-status" id="status-eventName">📝 Název akce</div>
                <div class="field-status" id="status-category">📋 Kategorie</div>
                <div class="field-status" id="status-city">🏙️ Město</div>
                <div class="field-status" id="status-dates">📅 Datum akce</div>
                <div class="field-status" id="status-visitors">👥 Návštěvnost</div>
                <div class="field-status" id="status-competition">🏪 Konkurence</div>
                <div class="field-status" id="status-eventType">🏢 Typ akce</div>
                <div class="field-status" id="status-businessModel">💼 Business model</div>
                <div class="field-status" id="status-rentType">💰 Typ nájmu</div>
            </div>
        </div>
    `;
}

// Aktualizace statusu polí v placeholder
function updateFieldsStatus() {
    const formData = gatherFormData();
    
    const fields = [
        { id: 'status-eventName', condition: formData.eventName && formData.eventName.trim() },
        { id: 'status-category', condition: formData.category },
        { id: 'status-city', condition: formData.city && formData.city.trim() },
        { id: 'status-dates', condition: formData.eventDateFrom && formData.eventDateTo },
        { id: 'status-visitors', condition: formData.visitors > 0 },
        { id: 'status-competition', condition: formData.competition },
        { id: 'status-eventType', condition: formData.eventType },
        { id: 'status-businessModel', condition: formData.businessModel },
        { id: 'status-rentType', condition: formData.rentType }
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            if (field.condition) {
                element.classList.add('completed');
                element.style.color = '#28a745';
                if (!element.textContent.includes('✅')) {
                    element.textContent = '✅ ' + element.textContent.replace(/^[📝📋🏙️📅👥🏪🏢💼💰]\s/, '');
                }
            } else {
                element.classList.remove('completed');
                element.style.color = '#6c757d';
                element.textContent = element.textContent.replace('✅ ', '');
            }
        }
    });
}

// ========================================
// LOADING STATES
// ========================================

// Zobrazení loading stavu
function displayPredictionLoading() {
    const resultsDiv = document.getElementById('predictionResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="prediction-loading">
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
            <h4>🤖 AI počítá predikci...</h4>
            <p>Analyzuji historická data, počasí a všechny faktory</p>
            <div class="loading-steps">
                <div class="loading-step active">📊 Načítám historická data</div>
                <div class="loading-step">🌤️ Analyzuji počasí</div>
                <div class="loading-step">🧠 Počítám AI faktory</div>
                <div class="loading-step">💼 Kalkuluji business metriky</div>
                <div class="loading-step">🎯 Finalizuji predikci</div>
            </div>
        </div>
    `;
    
    // Animace kroků
    animateLoadingSteps();
}

// Animace loading kroků
function animateLoadingSteps() {
    const steps = document.querySelectorAll('.loading-step');
    let currentStep = 0;
    
    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            steps[currentStep].classList.add('active');
            if (currentStep > 0) {
                steps[currentStep - 1].classList.remove('active');
                steps[currentStep - 1].classList.add('completed');
            }
            currentStep++;
        } else {
            clearInterval(interval);
        }
    }, 500);
}

// ========================================
// CSS STYLES
// ========================================

// Přidání CSS stylů pro Part 3
function addPart3Styles() {
    const style = document.createElement('style');
    style.textContent = `
        .prediction-results-container {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        
        .factors-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .factor-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .factor-name {
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }
        
        .factor-value {
            font-size: 1.2em;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 8px;
        }
        
        .factor-bar {
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
        }
        
        .factor-fill {
            height: 100%;
            transition: width 0.8s ease;
        }
        
        .business-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .business-metric {
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        
        .metric-label {
            font-size: 0.9em;
            color: #666;
            display: block;
        }
        
        .metric-value {
            font-weight: 600;
            color: #333;
            font-size: 1.1em;
        }
        
        .costs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .cost-item {
            display: flex;
            align-items: center;
            gap: 12px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .cost-icon {
            font-size: 1.5em;
            flex-shrink: 0;
        }
        
        .cost-name {
            font-size: 0.9em;
            color: #666;
        }
        
        .cost-value {
            font-weight: 600;
            color: #333;
        }
        
        .costs-total {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #667eea;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .total-row:last-child {
            border-bottom: none;
            margin-top: 10px;
            padding-top: 15px;
            border-top: 2px solid #667eea;
        }
        
        .total-row.positive {
            color: #28a745;
        }
        
        .total-row.negative {
            color: #dc3545;
        }
        
        .recommendation-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 12px;
            border-left: 4px solid #17a2b8;
        }
        
        .recommendation-item.success {
            background: #d4edda;
            border-left-color: #28a745;
        }
        
        .recommendation-item.warning {
            background: #fff3cd;
            border-left-color: #ffc107;
        }
        
        .recommendation-item.error {
            background: #f8d7da;
            border-left-color: #dc3545;
        }
        
        .recommendation-icon {
            font-size: 1.3em;
            flex-shrink: 0;
        }
        
        .recommendation-title {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .recommendation-text {
            font-size: 0.95em;
            line-height: 1.4;
        }
        
        .prediction-loading {
            text-align: center;
            padding: 40px 20px;
        }
        
        .loading-steps {
            margin-top: 20px;
            text-align: left;
            max-width: 300px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .loading-step {
            padding: 8px 0;
            opacity: 0.5;
            transition: opacity 0.3s;
        }
        
        .loading-step.active {
            opacity: 1;
            font-weight: 600;
            color: #667eea;
        }
        
        .loading-step.completed {
            opacity: 0.7;
            color: #28a745;
        }
        
        .prediction-error {
            text-align: center;
            padding: 40px 20px;
            color: #dc3545;
        }
        
        .error-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        .btn-retry {
            margin-top: 20px;
            background: #dc3545;
            color: white;
        }
        
        @media (max-width: 768px) {
            .factors-grid {
                grid-template-columns: 1fr;
            }
            
            .business-summary {
                grid-template-columns: 1fr;
            }
            
            .costs-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ========================================
// EVENT LISTENERS - POUZE ZOBRAZENÍ
// ========================================

// Event listener pro vypočítanou predikci z Part 2C
eventBus.on('predictionCalculated', (predictionData) => {
    console.log('🎯 Part 3: Displaying prediction results');
    displayPredictionResults(predictionData);
});

// Event listener pro změnu formuláře - pouze aktualizace placeholder
eventBus.on('formChanged', (formData) => {
    const validation = validateRequiredFields();
    if (!validation.valid) {
        displayPredictionPlaceholder();
        updateFieldsStatus();
    }
});

// Event listener pro začátek výpočtu predikce
eventBus.on('predictionStarted', () => {
    console.log('🤖 Part 3: Showing loading state');
    displayPredictionLoading();
    hideActionButtons();
});

// Event listener pro chybu predikce
eventBus.on('predictionError', (error) => {
    console.log('❌ Part 3: Showing error state');
    displayErrorResults(error.message || 'Neznámá chyba při výpočtu predikce');
    hideActionButtons();
});

// ========================================
// INICIALIZACE
// ========================================

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Initializing Part 3 UI Display...');
    
    // Přidání CSS stylů
    addPart3Styles();
    
    // Zobrazení placeholder na začátku
    setTimeout(() => {
        displayPredictionPlaceholder();
        updateFieldsStatus();
    }, 100);
    
    // Skrytí action buttons na začátku
    hideActionButtons();
    
    console.log('✅ Part 3 UI Display initialized');
});

// ========================================
// FINALIZACE
// ========================================

console.log('✅ Donuland Part 3 loaded successfully');
console.log('🎨 Features: ✅ Results Display ✅ Factors Breakdown ✅ Business Analysis ✅ Recommendations');
console.log('🎯 UI States: Placeholder → Loading → Results/Error');
console.log('💡 Interactive: Field status tracking + Action buttons');
console.log('🔗 Connected to Part 2C via eventBus - NO conflicts with Part 1&2');

// Event pro signalizaci dokončení části 3
eventBus.emit('part3Loaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['results-display', 'factors-breakdown', 'business-analysis', 'recommendations-display', 'loading-states', 'error-handling']
});
