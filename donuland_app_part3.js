/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 3A (OPRAVENO)
   UI Display & Results Visualization
   ======================================== */

console.log('🍩 Donuland Part 3A (Fixed) loading...');

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
        // Generování doporučení
        const recommendations = generateRecommendations(formData, prediction, businessResults);
        
        // Hlavní výsledky
        const mainResultsHtml = generateMainResults(prediction, businessResults);
        
        // Faktory breakdown
        const factorsHtml = generateFactorsBreakdown(prediction.factors);
        
        // Business breakdown
        const businessHtml = generateBusinessBreakdown(businessResults);
        
        // Doporučení
        const recommendationsHtml = generateRecommendationsHtml(recommendations);
        
        // Sestavení celého HTML
        const html = `
            <div class="prediction-results-container">
                ${mainResultsHtml}
                ${factorsHtml}
                ${businessHtml}
                ${recommendationsHtml}
            </div>
        `;
        
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

// Generování hlavních výsledků
function generateMainResults(prediction, businessResults) {
    const sales = prediction.predictedSales;
    const confidence = prediction.confidence;
    const revenue = businessResults.revenue;
    const profit = businessResults.profit;
    const roi = businessResults.roi;
    const margin = businessResults.margin;
    
    // Určení barvy podle ziskovosti
    let profitColor = '#28a745'; // Zelená
    let profitIcon = '✅';
    
    if (profit <= 0) {
        profitColor = '#dc3545'; // Červená
        profitIcon = '❌';
    } else if (profit < 1000) {
        profitColor = '#ffc107'; // Žlutá
        profitIcon = '⚠️';
    }
    
    // Určení barvy podle confidence
    let confidenceColor = '#28a745';
    if (confidence < 60) confidenceColor = '#ffc107';
    if (confidence < 40) confidenceColor = '#dc3545';
    
    return `
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
                    <div class="result-value" style="color: ${roi > 20 ? '#28a745' : roi > 0 ? '#ffc107' : '#dc3545'};">${roi.toFixed(1)}%</div>
                    <div class="result-label">ROI</div>
                </div>
                
                <div class="result-item">
                    <div class="result-icon">📊</div>
                    <div class="result-value" style="color: ${margin > 30 ? '#28a745' : margin > 15 ? '#ffc107' : '#dc3545'};">${margin.toFixed(1)}%</div>
                    <div class="result-label">Marže</div>
                </div>
            </div>
        </div>
    `;
}

// Generování breakdown faktorů
function generateFactorsBreakdown(factors) {
    return `
        <div class="factors-breakdown">
            <h4>🧠 Rozklad AI faktorů</h4>
            <div class="factors-explanation">
                <p>Finální konverze: <strong>${(factors.final * 100).toFixed(2)}%</strong> návštěvníků koupí donut</p>
            </div>
            
            <div class="factors-grid">
                <div class="factor-item">
                    <div class="factor-name">📋 Kategorie</div>
                    <div class="factor-value">${(factors.base * 100).toFixed(1)}%</div>
                    <div class="factor-bar">
                        <div class="factor-fill" style="width: ${factors.base * 100}%"></div>
                    </div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-name">📊 Historické data</div>
                    <div class="factor-value">${(factors.historical * 100).toFixed(0)}%</div>
                    <div class="factor-bar">
                        <div class="factor-fill" style="width: ${Math.min(factors.historical * 50, 100)}%; background-color: ${factors.historical > 1 ? '#28a745' : factors.historical < 1 ? '#dc3545' : '#6c757d'}"></div>
                    </div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-name">🏙️ Město</div>
                    <div class="factor-value">${(factors.city * 100).toFixed(0)}%</div>
                    <div class="factor-bar">
                        <div class="factor-fill" style="width: ${Math.min(factors.city * 50, 100)}%; background-color: ${factors.city > 1 ? '#28a745' : factors.city < 1 ? '#dc3545' : '#6c757d'}"></div>
                    </div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-name">🏪 Konkurence</div>
                    <div class="factor-value">${(factors.competition * 100).toFixed(0)}%</div>
                    <div class="factor-bar">
                        <div class="factor-fill" style="width: ${Math.min(factors.competition * 50, 100)}%; background-color: ${factors.competition > 1 ? '#28a745' : factors.competition < 1 ? '#dc3545' : '#6c757d'}"></div>
                    </div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-name">📅 Sezóna</div>
                    <div class="factor-value">${(factors.seasonal * 100).toFixed(0)}%</div>
                    <div class="factor-bar">
                        <div class="factor-fill" style="width: ${Math.min(factors.seasonal * 50, 100)}%; background-color: ${factors.seasonal > 1 ? '#28a745' : factors.seasonal < 1 ? '#dc3545' : '#6c757d'}"></div>
                    </div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-name">👥 Velikost akce</div>
                    <div class="factor-value">${(factors.size * 100).toFixed(0)}%</div>
                    <div class="factor-bar">
                        <div class="factor-fill" style="width: ${Math.min(factors.size * 50, 100)}%; background-color: ${factors.size > 1 ? '#28a745' : factors.size < 1 ? '#dc3545' : '#6c757d'}"></div>
                    </div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-name">🌤️ Počasí</div>
                    <div class="factor-value">${(factors.weather * 100).toFixed(0)}%</div>
                    <div class="factor-bar">
                        <div class="factor-fill" style="width: ${Math.min(factors.weather * 50, 100)}%; background-color: ${factors.weather > 1 ? '#28a745' : factors.weather < 1 ? '#dc3545' : '#6c757d'}"></div>
                    </div>
                </div>
                
                <div class="factor-item">
                    <div class="factor-name">⏰ Délka akce</div>
                    <div class="factor-value">${(factors.duration * 100).toFixed(0)}%</div>
                    <div class="factor-bar">
                        <div class="factor-fill" style="width: ${Math.min(factors.duration * 50, 100)}%; background-color: ${factors.duration > 1 ? '#28a745' : factors.duration < 1 ? '#dc3545' : '#6c757d'}"></div>
                    </div>
                </div>
            </div>
            
            <div class="factors-note">
                <small>💡 Faktory >100% zvyšují prodej, <100% snižují. Zelená = pozitivní, červená = negativní vliv.</small>
            </div>
        </div>
    `;
}

// Generování business breakdown
function generateBusinessBreakdown(businessResults) {
    const { revenue, costs, totalCosts, profit, breakeven, metadata } = businessResults;
    
    return `
        <div class="business-breakdown">
            <h4>💼 Finanční analýza</h4>
            
            <div class="business-summary">
                <div class="business-metric">
                    <span class="metric-label">Break-even point:</span>
                    <span class="metric-value">${formatNumber(breakeven)} ks</span>
                </div>
                <div class="business-metric">
                    <span class="metric-label">Business model:</span>
                    <span class="metric-value">${getBusinessModelLabel(metadata.businessModel)}</span>
                </div>
                <div class="business-metric">
                    <span class="metric-label">Cena za kus:</span>
                    <span class="metric-value">${formatCurrency(metadata.pricePerUnit)}</span>
                </div>
            </div>
            
            <div class="costs-breakdown">
                <h5>📊 Rozpis nákladů</h5>
                <div class="costs-grid">
                    <div class="cost-item">
                        <div class="cost-icon">🍩</div>
                        <div class="cost-details">
                            <div class="cost-name">Výroba</div>
                            <div class="cost-value">${formatCurrency(costs.production)}</div>
                        </div>
                    </div>
                    
                    <div class="cost-item">
                        <div class="cost-icon">👨‍💼</div>
                        <div class="cost-details">
                            <div class="cost-name">Mzdy</div>
                            <div class="cost-value">${formatCurrency(costs.labor)}</div>
                        </div>
                    </div>
                    
                    <div class="cost-item">
                        <div class="cost-icon">🚗</div>
                        <div class="cost-details">
                            <div class="cost-name">Doprava</div>
                            <div class="cost-value">${formatCurrency(costs.transport)}</div>
                        </div>
                    </div>
                    
                    <div class="cost-item">
                        <div class="cost-icon">🏢</div>
                        <div class="cost-details">
                            <div class="cost-name">Nájem</div>
                            <div class="cost-value">${formatCurrency(costs.rent)}</div>
                        </div>
                    </div>
                    
                    ${costs.revenueShare > 0 ? `
                    <div class="cost-item">
                        <div class="cost-icon">📊</div>
                        <div class="cost-details">
                            <div class="cost-name">% z obratu</div>
                            <div class="cost-value">${formatCurrency(costs.revenueShare)}</div>
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
                        <span>${formatCurrency(totalCosts)}</span>
                    </div>
                    <div class="total-row profit ${profit > 0 ? 'positive' : 'negative'}">
                        <span><strong>${profit > 0 ? '✅' : '❌'} Čistý zisk:</strong></span>
                        <span><strong>${formatCurrency(profit)}</strong></span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generování doporučení HTML
function generateRecommendationsHtml(recommendations) {
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
// UTILITY FUNCTIONS
// ========================================

// Získání labelu pro business model
function getBusinessModelLabel(businessModel) {
    const labels = {
        'owner': '🏪 Majitel',
        'employee': '👨‍💼 Zaměstnanec',
        'franchise': '🤝 Franšíza'
    };
    
    return labels[businessModel] || businessModel;
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
// EVENT LISTENERS PRO PART 3A (OPRAVENO)
// ========================================

// Event listener pro vypočítanou predikci
eventBus.on('predictionCalculated', (predictionData) => {
    console.log('🎯 Prediction calculated, displaying results');
    displayPredictionResults(predictionData);
});

// Event listener pro začátek prediction loading
eventBus.on('predictionStarted', () => {
    console.log('🤖 Prediction started, showing loading');
    displayPredictionLoading();
    hideActionButtons();
});

// Event listener pro chybu predikce
eventBus.on('predictionError', (error) => {
    console.log('❌ Prediction error, showing error message');
    displayErrorResults(error.message || 'Neznámá chyba při výpočtu predikce');
    hideActionButtons();
});

// ========================================
// INICIALIZACE PART 3A
// ========================================

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Initializing Part 3A UI...');
    
    // Zobrazení placeholder na začátku
    setTimeout(() => {
        displayPredictionPlaceholder();
    }, 100);
    
    // Skrytí action buttons na začátku
    hideActionButtons();
    
    console.log('✅ Part 3A UI initialized');
});

// ========================================
// FINALIZACE PART 3A
// ========================================

console.log('✅ Donuland Part 3A (Fixed) loaded successfully');
console.log('🎨 Features: ✅ Results Display ✅ Factors Breakdown ✅ Business Analysis ✅ Recommendations');
console.log('🎯 UI States: Placeholder → Loading → Results/Error');
console.log('💡 Interactive: Field status tracking + Action buttons');
console.log('⏳ Ready for Part 3B: Enhanced Validation & Form Features');

// Event pro signalizaci dokončení části 3A
eventBus.emit('part3aLoaded', { 
    timestamp: Date.now(),
    version: '1.1.0',
    features: ['results-display', 'factors-breakdown', 'business-analysis', 'recommendations-display', 'loading-states', 'error-handling']
});
/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 3B (OPRAVENO)
   Enhanced Validation & Smart Form Features
   ======================================== */

console.log('🍩 Donuland Part 3B (Fixed) loading...');

// ========================================
// ENHANCED FORM VALIDATION (OPRAVENO)
// ========================================

// Vylepšená validace formuláře s opravou konfliktu
function validateRequiredFieldsEnhanced() {
    console.log('🔍 Enhanced validation running...');
    
    const requiredFields = [
        { id: 'eventName', name: 'Název akce', minLength: 3 },
        { id: 'category', name: 'Kategorie' },
        { id: 'city', name: 'Město/Lokalita', minLength: 2 },
        { id: 'eventDateFrom', name: 'Datum od' },
        { id: 'eventDateTo', name: 'Datum do' },
        { id: 'visitors', name: 'Návštěvnost', min: 50, max: 100000 },
        { id: 'competition', name: 'Konkurence' },
        { id: 'eventType', name: 'Typ akce' },
        { id: 'businessModel', name: 'Business model' },
        { id: 'rentType', name: 'Typ nájmu' }
    ];
    
    let allValid = true;
    const errors = [];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        const isValid = validateSingleFieldEnhanced(element, field);
        
        if (!isValid.valid) {
            allValid = false;
            errors.push(...isValid.errors);
            markFieldAsError(element, isValid.errors);
        } else {
            markFieldAsValid(element);
        }
    });
    
    // Speciální validace
    const specialValidation = performSpecialValidationEnhanced();
    if (!specialValidation.valid) {
        allValid = false;
        errors.push(...specialValidation.errors);
    }
    
    return { valid: allValid, errors: errors };
}

// Validace jednotlivého pole s enhanced funkcemi
function validateSingleFieldEnhanced(element, fieldConfig) {
    if (!element) {
        return { valid: false, errors: [`Pole ${fieldConfig.name} nebylo nalezeno`] };
    }
    
    const value = element.value.trim();
    const errors = [];
    
    // Základní povinnost
    if (!value) {
        errors.push(`${fieldConfig.name} je povinné pole`);
        return { valid: false, errors };
    }
    
    // Minimální délka pro textová pole
    if (fieldConfig.minLength && value.length < fieldConfig.minLength) {
        errors.push(`${fieldConfig.name} musí mít alespoň ${fieldConfig.minLength} znaků`);
    }
    
    // Číselné rozsahy
    if (fieldConfig.min !== undefined || fieldConfig.max !== undefined) {
        const numValue = parseFloat(value);
        
        if (isNaN(numValue)) {
            errors.push(`${fieldConfig.name} musí být číslo`);
        } else {
            if (fieldConfig.min !== undefined && numValue < fieldConfig.min) {
                errors.push(`${fieldConfig.name} musí být alespoň ${fieldConfig.min}`);
            }
            if (fieldConfig.max !== undefined && numValue > fieldConfig.max) {
                errors.push(`${fieldConfig.name} nesmí být více než ${fieldConfig.max}`);
            }
        }
    }
    
    return { valid: errors.length === 0, errors };
}

// Speciální validace s enhanced funkcemi
function performSpecialValidationEnhanced() {
    const errors = [];
    
    // Validace datumů
    const dateFrom = document.getElementById('eventDateFrom').value;
    const dateTo = document.getElementById('eventDateTo').value;
    
    if (dateFrom && dateTo) {
        const dateFromObj = new Date(dateFrom);
        const dateToObj = new Date(dateTo);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Datum do musí být >= datum od
        if (dateToObj < dateFromObj) {
            errors.push('Datum do nesmí být dříve než datum od');
            markFieldAsError(document.getElementById('eventDateTo'), ['Neplatné datum']);
        }
        
        // Varování pro příliš vzdálené budoucí akce
        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
        
        if (dateFromObj > maxFutureDate) {
            errors.push('Akce je příliš daleko v budoucnosti (max 1 rok)');
        }
        
        // Info pro akce v minulosti (není chyba)
        if (dateFromObj < today) {
            setTimeout(() => {
                showNotification('⚠️ Akce je naplánována v minulosti', 'warning', 3000);
            }, 100);
        }
    }
    
    // Validace business logiky
    const rentType = document.getElementById('rentType').value;
    
    // Specifické validace podle rent type
    if (rentType === 'fixed') {
        const fixedRent = parseFloat(document.getElementById('fixedRent')?.value || 0);
        if (fixedRent <= 0) {
            errors.push('Fixní nájem musí být vyšší než 0 Kč');
            const fixedRentEl = document.getElementById('fixedRent');
            if (fixedRentEl) markFieldAsError(fixedRentEl, ['Neplatná hodnota']);
        }
    }
    
    if (rentType === 'percentage') {
        const percentage = parseFloat(document.getElementById('percentage')?.value || 0);
        if (percentage <= 0 || percentage > 50) {
            errors.push('Procenta z obratu musí být mezi 1-50%');
            const percentageEl = document.getElementById('percentage');
            if (percentageEl) markFieldAsError(percentageEl, ['Neplatná hodnota']);
        }
    }
    
    if (rentType === 'mixed') {
        const mixedFixed = parseFloat(document.getElementById('mixedFixed')?.value || 0);
        const mixedPercentage = parseFloat(document.getElementById('mixedPercentage')?.value || 0);
        
        if (mixedFixed <= 0 && mixedPercentage <= 0) {
            errors.push('Kombinovaný nájem musí mít alespoň jednu hodnotu > 0');
        }
    }
    
    // Validace ceny
    const price = parseFloat(document.getElementById('price')?.value || 0);
    if (price < 30 || price > 100) {
        // Není chyba, jen upozornění
        setTimeout(() => {
            showNotification('💡 Neobvyklá cena - doporučeno 45-55 Kč', 'info', 3000);
        }, 100);
    }
    
    return { valid: errors.length === 0, errors };
}

// Označení pole jako chybné
function markFieldAsError(element, errors) {
    if (!element) return;
    
    element.classList.add('error');
    element.classList.remove('valid');
    element.setAttribute('title', errors.join(', '));
    
    // Přidání chybové zprávy
    let errorDiv = element.parentElement.querySelector('.field-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        element.parentElement.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
        <span class="error-icon">⚠️</span>
        <span class="error-text">${errors[0]}</span>
    `;
    errorDiv.style.display = 'block';
}

// Označení pole jako validní
function markFieldAsValid(element) {
    if (!element) return;
    
    element.classList.remove('error');
    element.classList.add('valid');
    element.removeAttribute('title');
    
    // Odstranění chybové zprávy
    const errorDiv = element.parentElement.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    // Přidání success efektu (dočasně)
    element.style.borderColor = '#28a745';
    element.style.boxShadow = '0 0 0 2px rgba(40, 167, 69, 0.2)';
    
    // Odstranění po 2 sekundách
    setTimeout(() => {
        if (element.classList.contains('valid')) {
            element.style.borderColor = '';
            element.style.boxShadow = '';
        }
    }, 2000);
}

// ========================================
// REAL-TIME FORM VALIDATION
// ========================================

// Nastavení real-time validace
function setupRealTimeValidation() {
    console.log('⚡ Setting up real-time validation...');
    
    const formElements = document.querySelectorAll('input, select, textarea');
    
    formElements.forEach(element => {
        // Debounced validation při psaní
        const debouncedValidation = debounce(() => {
            validateAndTriggerUpdate(element);
        }, 300);
        
        // Event listeners
        element.addEventListener('input', debouncedValidation);
        element.addEventListener('change', () => {
            validateAndTriggerUpdate(element);
        });
        
        element.addEventListener('blur', () => {
            validateSingleFieldByElement(element);
        });
        
        element.addEventListener('focus', () => {
            // Odstranění error styling při focusu
            element.classList.remove('error');
            const errorDiv = element.parentElement.querySelector('.field-error');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        });
    });
    
    console.log('✅ Real-time validation setup complete');
}

// Validace a trigger update
function validateAndTriggerUpdate(element) {
    validateSingleFieldByElement(element);
    updatePredictionTriggerEnhanced();
}

// Validace jednoho pole podle elementu
function validateSingleFieldByElement(element) {
    if (!element || !element.id) return;
    
    // Najít konfiguraci pole
    const fieldConfigs = {
        'eventName': { name: 'Název akce', minLength: 3 },
        'category': { name: 'Kategorie' },
        'city': { name: 'Město/Lokalita', minLength: 2 },
        'eventDateFrom': { name: 'Datum od' },
        'eventDateTo': { name: 'Datum do' },
        'visitors': { name: 'Návštěvnost', min: 50, max: 100000 },
        'competition': { name: 'Konkurence' },
        'eventType': { name: 'Typ akce' },
        'businessModel': { name: 'Business model' },
        'rentType': { name: 'Typ nájmu' },
        'price': { name: 'Cena', min: 30, max: 100 }
    };
    
    const fieldConfig = fieldConfigs[element.id];
    if (!fieldConfig) return;
    
    const result = validateSingleFieldEnhanced(element, fieldConfig);
    
    if (result.valid) {
        markFieldAsValid(element);
    } else {
        markFieldAsError(element, result.errors);
    }
}

// ========================================
// SMART FORM SUGGESTIONS
// ========================================

// Inteligentní návrhy při psaní
function setupSmartSuggestions() {
    console.log('🧠 Setting up smart suggestions...');
    
    // Návrhy pro města na základě historických dat
    setupCitySuggestionsEnhanced();
    
    // Auto-kategorization na základě názvu
    setupAutoCategorizationEnhanced();
    
    // Smart defaults
    setupSmartDefaultsEnhanced();
}

// Enhanced návrhy měst z historických dat
function setupCitySuggestionsEnhanced() {
    const cityInput = document.getElementById('city');
    if (!cityInput) return;
    
    cityInput.addEventListener('input', debounce(() => {
        const value = cityInput.value.toLowerCase().trim();
        if (value.length < 2) return;
        
        // Najít podobná města v historických datech
        if (globalState.historicalData && globalState.historicalData.length > 0) {
            const suggestions = globalState.historicalData
                .map(record => record.city)
                .filter(city => city && city.toLowerCase().includes(value))
                .filter((city, index, self) => self.indexOf(city) === index) // unique
                .slice(0, 5);
            
            if (suggestions.length > 0) {
                showCitySuggestionsEnhanced(cityInput, suggestions);
            }
        }
    }, 300));
}

// Zobrazení návrhů měst
function showCitySuggestionsEnhanced(input, suggestions) {
    // Odstranění starých návrhů
    const existingSuggestions = document.querySelector('.city-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    // Vytvoření nových návrhů
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'city-suggestions';
    suggestionsDiv.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
    `;
    
    suggestionsDiv.innerHTML = suggestions.map(city => 
        `<div class="suggestion-item" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" 
              onclick="selectCitySuggestionEnhanced('${escapeHtml(city)}')"
              onmouseover="this.style.backgroundColor='#f5f5f5'"
              onmouseout="this.style.backgroundColor=''">${escapeHtml(city)}</div>`
    ).join('');
    
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(suggestionsDiv);
    
    // Auto-hide po 10 sekundách
    setTimeout(() => {
        if (suggestionsDiv.parentElement) {
            suggestionsDiv.remove();
        }
    }, 10000);
}

// Výběr návrhu města
function selectCitySuggestionEnhanced(city) {
    const cityInput = document.getElementById('city');
    if (cityInput) {
        cityInput.value = city;
        cityInput.dispatchEvent(new Event('change'));
        
        // Odstranění návrhů
        const suggestions = document.querySelector('.city-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
        
        // Trigger distance calculation
        eventBus.emit('cityChanged', { city: city });
    }
}

// Auto-kategorizace na základě názvu akce
function setupAutoCategorizationEnhanced() {
    const eventNameInput = document.getElementById('eventName');
    const categorySelect = document.getElementById('category');
    
    if (!eventNameInput || !categorySelect) return;
    
    eventNameInput.addEventListener('input', debounce(() => {
        const name = eventNameInput.value.toLowerCase();
        
        // Už je kategorie vybraná? Nepřepisuj
        if (categorySelect.value) return;
        
        // Klíčová slova pro kategorie
        const categoryKeywords = {
            'food festival': ['food', 'fest', 'gastro', 'jídlo', 'kulinář', 'chuť', 'gurmán', 'burger', 'pizza'],
            'veletrh': ['veletrh', 'výstava', 'trh', 'čoko', 'chocolate', 'jarmark', 'cokofest'],
            'koncert': ['koncert', 'hudba', 'festival', 'music', 'kapela', 'zpěv', 'band'],
            'kulturní akce': ['kultura', 'divadlo', 'muzeum', 'galerie', 'umění', 'výstava', 'film'],
            'sportovní': ['sport', 'běh', 'maraton', 'závod', 'turnaj', 'pohár', 'cyklo', 'fotbal']
        };
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => name.includes(keyword))) {
                categorySelect.value = category;
                categorySelect.dispatchEvent(new Event('change'));
                
                // Notifikace o auto-výběru
                showNotification(`🤖 Auto-vybráno: ${category}`, 'info', 2000);
                break;
            }
        }
    }, 1000));
}

// Smart defaults na základě kontextu
function setupSmartDefaultsEnhanced() {
    // Auto-nastavení datumu do = datum od pro jednodenní akce
    const dateFromInput = document.getElementById('eventDateFrom');
    const dateToInput = document.getElementById('eventDateTo');
    
    if (dateFromInput && dateToInput) {
        dateFromInput.addEventListener('change', () => {
            if (!dateToInput.value && dateFromInput.value) {
                dateToInput.value = dateFromInput.value;
                dateToInput.dispatchEvent(new Event('change'));
            }
        });
    }
    
    // Smart business model doporučení
    const visitorsInput = document.getElementById('visitors');
    const businessModelSelect = document.getElementById('businessModel');
    
    if (visitorsInput && businessModelSelect) {
        visitorsInput.addEventListener('change', debounce(() => {
            const visitors = parseInt(visitorsInput.value);
            
            if (!businessModelSelect.value && visitors > 0) {
                let recommendedModel = 'owner'; // default
                
                if (visitors < 1000) {
                    recommendedModel = 'franchise'; // Menší riziko pro malé akce
                } else if (visitors > 10000) {
                    recommendedModel = 'owner'; // Vyšší zisk pro velké akce
                } else {
                    recommendedModel = 'employee'; // Střední cesta
                }
                
                businessModelSelect.value = recommendedModel;
                businessModelSelect.dispatchEvent(new Event('change'));
                
                const modelNames = {
                    'owner': 'Majitel',
                    'employee': 'Zaměstnanec', 
                    'franchise': 'Franšíza'
                };
                
                showNotification(`💡 Doporučeno: ${modelNames[recommendedModel]} pro ${formatNumber(visitors)} návštěvníků`, 'info', 3000);
            }
        }, 1500));
    }
}

// ========================================
// FORM PROGRESS TRACKING
// ========================================

// Aktualizace pokroku formuláře
function updateFormProgressEnhanced() {
    const requiredFields = [
        'eventName', 'category', 'city', 'eventDateFrom', 'eventDateTo', 
        'visitors', 'competition', 'eventType', 'businessModel', 'rentType'
    ];
    
    let completedFields = 0;
    
    requiredFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element && element.value.trim()) {
            completedFields++;
        }
    });
    
    const progress = (completedFields / requiredFields.length) * 100;
    
    // Emit progress event
    eventBus.emit('formProgressChanged', {
        progress: progress,
        completedFields: completedFields,
        totalFields: requiredFields.length
    });
    
    return { progress, completedFields, totalFields: requiredFields.length };
}

// ========================================
// FORM AUTO-SAVE
// ========================================

// Automatické ukládání formuláře do localStorage
function setupAutoSaveEnhanced() {
    console.log('💾 Setting up enhanced auto-save...');
    
    const formElements = document.querySelectorAll('input, select, textarea');
    
    const debouncedSave = debounce(() => {
        saveFormToLocalStorageEnhanced();
    }, 3000);
    
    formElements.forEach(element => {
        element.addEventListener('input', debouncedSave);
        element.addEventListener('change', debouncedSave);
    });
    
    // Načtení při startu
    loadFormFromLocalStorageEnhanced();
}

// Uložení formuláře do localStorage
function saveFormToLocalStorageEnhanced() {
    try {
        const formData = gatherFormData();
        const saveData = {
            formData: formData,
            timestamp: Date.now(),
            url: window.location.href,
            version: '3b'
        };
        
        localStorage.setItem('donuland_form_autosave', JSON.stringify(saveData));
        console.log('💾 Enhanced form auto-saved');
        
    } catch (error) {
        console.error('❌ Enhanced auto-save failed:', error);
    }
}

// Načtení formuláře z localStorage
function loadFormFromLocalStorageEnhanced() {
    try {
        const saved = localStorage.getItem('donuland_form_autosave');
        if (!saved) return;
        
        const saveData = JSON.parse(saved);
        const age = Date.now() - saveData.timestamp;
        
        // Načíst pouze pokud je mladší než 24 hodin
        if (age > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('donuland_form_autosave');
            return;
        }
        
        const formData = saveData.formData;
        let fieldsRestored = 0;
        
        // Načtení dat do formuláře (pouze pokud jsou pole prázdná)
        Object.keys(formData).forEach(key => {
            const element = document.getElementById(key);
            if (element && !element.value && formData[key]) {
                element.value = formData[key];
                fieldsRestored++;
            }
        });
        
        if (fieldsRestored > 0) {
            console.log(`📥 Form data restored: ${fieldsRestored} fields`);
            showNotification(`📥 Obnoveno ${fieldsRestored} polí z auto-save`, 'info', 3000);
        }
        
    } catch (error) {
        console.error('❌ Enhanced auto-load failed:', error);
        localStorage.removeItem('donuland_form_autosave');
    }
}

// ========================================
// PREDICTION TRIGGER OPTIMIZATION
// ========================================

// Optimalizovaný trigger pro predikci
function updatePredictionTriggerEnhanced() {
    // Debounced predikce - spustí se až po dokončení psaní
    if (globalState.predictionTimeoutEnhanced) {
        clearTimeout(globalState.predictionTimeoutEnhanced);
    }
    
    globalState.predictionTimeoutEnhanced = setTimeout(() => {
        // Použít původní validaci pro kompatibilitu
        const validation = validateRequiredFields();
        
        if (validation.valid) {
            // Aktualizace field status pro UI
            updateFieldsStatus();
            
            // Emit event pro predikci
            eventBus.emit('formValidAndReady');
            
            // Pokud nejsou spuštěny jiné operace, spustit predikci
            if (!globalState.isLoadingPrediction && !globalState.isLoadingWeather) {
                eventBus.emit('triggerPrediction');
            }
        } else {
            // Form není validní, zobrazit placeholder
            updateFieldsStatus();
            eventBus.emit('formNotValid', validation.errors);
        }
        
        // Aktualizace progress
        updateFormProgressEnhanced();
        
    }, 700); // 700ms delay pro lepší UX
}

// ========================================
// EVENT LISTENERS PRO PART 3B (OPRAVENO)
// ========================================

// Event listeners pro enhanced validation
eventBus.on('formValidAndReady', () => {
    console.log('✅ Enhanced form is valid and ready for prediction');
});

eventBus.on('formNotValid', (errors) => {
    console.log('❌ Enhanced form validation failed:', errors);
    displayPredictionPlaceholder();
});

// Event pro změnu formuláře s enhanced funkcemi
eventBus.on('formChanged', (formData) => {
    console.log('📝 Enhanced form changed handler');
    updateFormProgressEnhanced();
});

// Event pro progress změnu
eventBus.on('formProgressChanged', (data) => {
    console.log(`📊 Enhanced form progress: ${data.progress.toFixed(1)}%`);
});

// ========================================
// INICIALIZACE PART 3B
// ========================================

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Initializing Part 3B Enhanced Features...');
    
    // Malé zpoždění pro zajištění načtení předchozích částí
    setTimeout(() => {
        // Nastavení enhanced validation
        setupRealTimeValidation();
        
        // Nastavení smart suggestions
        setupSmartSuggestions();
        
        // Nastavení auto-save
        setupAutoSaveEnhanced();
        
        // První progress update
        updateFormProgressEnhanced();
        
        console.log('✅ Part 3B Enhanced Features initialized');
    }, 500);
});

// ========================================
// FINALIZACE PART 3B
// ========================================

console.log('✅ Donuland Part 3B (Fixed) loaded successfully');
console.log('📝 Features: ✅ Enhanced Validation ✅ Real-time Feedback ✅ Smart Suggestions ✅ Auto-save');
console.log('🧠 Smart features: Auto-categorization + City suggestions + Smart defaults');
console.log('⚡ Real-time: Field validation + Progress tracking + Debounced prediction trigger');
console.log('🔧 Fixed: No conflicts with Part 1&2, preserved Google Maps autocomplete');
console.log('⏳ Ready for Part 4: Calendar & Analytics');

// Event pro signalizaci dokončení části 3B
eventBus.emit('part3bLoaded', { 
    timestamp: Date.now(),
    version: '1.1.0',
    features: ['enhanced-validation', 'real-time-feedback', 'smart-suggestions', 'auto-save', 'progress-tracking', 'conflict-free']
});
