/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 3A
   UI Display & Results Visualization
   ======================================== */

console.log('🍩 Donuland Part 3A loading...');

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
// EVENT LISTENERS PRO PART 3A
// ========================================

// Event listener pro vypočítanou predikci
eventBus.on('predictionCalculated', (predictionData) => {
    console.log('🎯 Prediction calculated, displaying results');
    displayPredictionResults(predictionData);
});

// Event listener pro změnu formuláře
eventBus.on('formChanged', (formData) => {
    // Aktualizace placeholder statusu
    updateFieldsStatus();
    
    // Pokud formulář není validní, zobrazit placeholder
    const validation = validateRequiredFields();
    if (!validation.valid) {
        displayPredictionPlaceholder();
        hideActionButtons();
    }
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
    displayPredictionPlaceholder();
    
    // Skrytí action buttons na začátku
    hideActionButtons();
    
    console.log('✅ Part 3A UI initialized');
});

// ========================================
// FINALIZACE PART 3A
// ========================================

console.log('✅ Donuland Part 3A loaded successfully');
console.log('🎨 Features: ✅ Results Display ✅ Factors Breakdown ✅ Business Analysis ✅ Recommendations');
console.log('🎯 UI States: Placeholder → Loading → Results/Error');
console.log('💡 Interactive: Field status tracking + Action buttons');
console.log('⏳ Ready for Part 3B: Form Enhancements & Validation');

// Event pro signalizaci dokončení části 3A
eventBus.emit('part3aLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['results-display', 'factors-breakdown', 'business-analysis', 'recommendations-display', 'loading-states', 'error-handling']
});
/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 3B
   Form Enhancements & Advanced Validation
   ======================================== */

console.log('🍩 Donuland Part 3B loading...');

// ========================================
// ENHANCED FORM VALIDATION
// ========================================

// Vylepšená validace formuláře (oprava chyby validateForm)
function validateRequiredFields() {
    console.log('🔍 Validating form fields...');
    
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
        const isValid = validateField(element, field);
        
        if (!isValid.valid) {
            allValid = false;
            errors.push(...isValid.errors);
            markFieldAsError(element, isValid.errors);
        } else {
            markFieldAsValid(element);
        }
    });
    
    // Speciální validace
    const specialValidation = performSpecialValidation();
    if (!specialValidation.valid) {
        allValid = false;
        errors.push(...specialValidation.errors);
    }
    
    // Update global validation state
    globalState.formValid = allValid;
    
    return { valid: allValid, errors: errors };
}

// Validace jednotlivého pole
function validateField(element, fieldConfig) {
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

// Speciální validace (datumy, business logika)
function performSpecialValidation() {
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
        
        // Varování pro akce v minulosti
        if (dateFromObj < today) {
            // Není chyba, ale upozornění
            showNotification('⚠️ Akce je naplánována v minulosti', 'warning', 3000);
        }
    }
    
    // Validace business logiky
    const businessModel = document.getElementById('businessModel').value;
    const rentType = document.getElementById('rentType').value;
    
    // Specifické validace podle rent type
    if (rentType === 'fixed') {
        const fixedRent = parseFloat(document.getElementById('fixedRent')?.value || 0);
        if (fixedRent <= 0) {
            errors.push('Fixní nájem musí být vyšší než 0 Kč');
            markFieldAsError(document.getElementById('fixedRent'), ['Neplatná hodnota']);
        }
    }
    
    if (rentType === 'percentage') {
        const percentage = parseFloat(document.getElementById('percentage')?.value || 0);
        if (percentage <= 0 || percentage > 50) {
            errors.push('Procenta z obratu musí být mezi 1-50%');
            markFieldAsError(document.getElementById('percentage'), ['Neplatná hodnota']);
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
        errors.push('Cena donut by měla být mezi 30-100 Kč');
        markFieldAsError(document.getElementById('price'), ['Neobvyklá cena']);
    }
    
    return { valid: errors.length === 0, errors };
}

// Označení pole jako chybné
function markFieldAsError(element, errors) {
    if (!element) return;
    
    element.classList.add('error');
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
    
    // Přidání success ikony (dočasně)
    element.style.backgroundImage = 'url("data:image/svg+xml;charset=utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 8 8\'><path fill=\'%2328a745\' d=\'M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z\'/></svg>")';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundPosition = 'right 10px center';
    element.style.backgroundSize = '16px';
    
    // Odstranění ikony po 2 sekundách
    setTimeout(() => {
        element.style.backgroundImage = '';
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
            validateSingleField(element);
            updatePredictionTrigger();
        }, 300);
        
        // Event listeners
        element.addEventListener('input', debouncedValidation);
        element.addEventListener('change', () => {
            validateSingleField(element);
            updatePredictionTrigger();
        });
        
        element.addEventListener('blur', () => {
            validateSingleField(element);
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

// Validace jednoho pole
function validateSingleField(element) {
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
    
    const result = validateField(element, fieldConfig);
    
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
    setupCitySuggestions();
    
    // Návrhy pro názvy akcí
    setupEventNameSuggestions();
    
    // Auto-kategorization na základě názvu
    setupAutoCategorizationk();
    
    // Smart defaults
    setupSmartDefaults();
}

// Návrhy měst z historických dat
function setupCitySuggestions() {
    const cityInput = document.getElementById('city');
    if (!cityInput) return;
    
    cityInput.addEventListener('input', debounce(() => {
        const value = cityInput.value.toLowerCase().trim();
        if (value.length < 2) return;
        
        // Najít podobná města v historických datech
        const suggestions = globalState.historicalData
            .map(record => record.city)
            .filter(city => city && city.toLowerCase().includes(value))
            .filter((city, index, self) => self.indexOf(city) === index) // unique
            .slice(0, 5);
        
        if (suggestions.length > 0) {
            showCitySuggestions(cityInput, suggestions);
        }
    }, 300));
}

// Zobrazení návrhů měst
function showCitySuggestions(input, suggestions) {
    // Odstranění starých návrhů
    const existingSuggestions = document.querySelector('.city-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    // Vytvoření nových návrhů
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'city-suggestions';
    suggestionsDiv.innerHTML = suggestions.map(city => 
        `<div class="suggestion-item" onclick="selectCitySuggestion('${escapeHtml(city)}')">${escapeHtml(city)}</div>`
    ).join('');
    
    input.parentElement.appendChild(suggestionsDiv);
    
    // Auto-hide po 5 sekundách
    setTimeout(() => {
        if (suggestionsDiv.parentElement) {
            suggestionsDiv.remove();
        }
    }, 5000);
}

// Výběr návrhu města
function selectCitySuggestion(city) {
    const cityInput = document.getElementById('city');
    if (cityInput) {
        cityInput.value = city;
        cityInput.dispatchEvent(new Event('change'));
        
        // Odstranění návrhů
        const suggestions = document.querySelector('.city-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
    }
}

// Auto-kategorizace na základě názvu akce
function setupAutoCategorizationk() {
    const eventNameInput = document.getElementById('eventName');
    const categorySelect = document.getElementById('category');
    
    if (!eventNameInput || !categorySelect) return;
    
    eventNameInput.addEventListener('input', debounce(() => {
        const name = eventNameInput.value.toLowerCase();
        
        // Už je kategorie vybraná? Nepřepisuj
        if (categorySelect.value) return;
        
        // Klíčová slova pro kategorie
        const categoryKeywords = {
            'food festival': ['food', 'fest', 'gastro', 'jídlo', 'kulinář', 'chuť', 'gurmán'],
            'veletrh': ['veletrh', 'výstava', 'trh', 'čoko', 'chocolate', 'jarmark'],
            'koncert': ['koncert', 'hudba', 'festival', 'music', 'kapela', 'zpěv'],
            'kulturní akce': ['kultura', 'divadlo', 'muzeum', 'galerie', 'umění', 'výstava'],
            'sportovní': ['sport', 'běh', 'maraton', 'závod', 'turnaj', 'pohár']
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
    }, 500));
}

// Smart defaults na základě kontextu
function setupSmartDefaults() {
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
        }, 1000));
    }
}

// ========================================
// FORM PROGRESS INDICATOR
// ========================================

// Ukazatel pokroku vyplňování formuláře
function updateFormProgress() {
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
    
    // Aktualizace progress baru (pokud existuje)
    const progressBar = document.querySelector('.form-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    const progressText = document.querySelector('.form-progress-text');
    if (progressText) {
        progressText.textContent = `${completedFields}/${requiredFields.length} polí vyplněno`;
    }
    
    return { progress, completedFields, totalFields: requiredFields.length };
}

// ========================================
// FORM AUTO-SAVE
// ========================================

// Automatické ukládání formuláře do localStorage
function setupAutoSave() {
    console.log('💾 Setting up auto-save...');
    
    const formElements = document.querySelectorAll('input, select, textarea');
    
    const debouncedSave = debounce(() => {
        saveFormToLocalStorage();
    }, 2000);
    
    formElements.forEach(element => {
        element.addEventListener('input', debouncedSave);
        element.addEventListener('change', debouncedSave);
    });
    
    // Načtení při startu
    loadFormFromLocalStorage();
}

// Uložení formuláře do localStorage
function saveFormToLocalStorage() {
    try {
        const formData = gatherFormData();
        const saveData = {
            formData: formData,
            timestamp: Date.now(),
            url: window.location.href
        };
        
        localStorage.setItem('donuland_form_autosave', JSON.stringify(saveData));
        console.log('💾 Form auto-saved');
        
    } catch (error) {
        console.error('❌ Auto-save failed:', error);
    }
}

// Načtení formuláře z localStorage
function loadFormFromLocalStorage() {
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
        
        // Načtení dat do formuláře (pouze pokud jsou pole prázdná)
        Object.keys(formData).forEach(key => {
            const element = document.getElementById(key);
            if (element && !element.value && formData[key]) {
                element.value = formData[key];
            }
        });
        
        console.log('📥 Form data restored from auto-save');
        showNotification('📥 Formulář obnovem z auto-save', 'info', 3000);
        
    } catch (error) {
        console.error('❌ Auto-load failed:', error);
        localStorage.removeItem('donuland_form_autosave');
    }
}

// ========================================
// PREDICTION TRIGGER OPTIMIZATION
// ========================================

// Optimalizovaný trigger pro predikci
function updatePredictionTrigger() {
    // Debounced predikce - spustí se až po dokončení psaní
    if (globalState.predictionTimeout) {
        clearTimeout(globalState.predictionTimeout);
    }
    
    globalState.predictionTimeout = setTimeout(() => {
        const validation = validateRequiredFields();
        
        if (validation.valid) {
            // Emit event pro predikci
            eventBus.emit('formValidAndReady');
            
            // Pokud nejsou spuštěny jiné operace, spustit predikci
            if (!globalState.isLoadingPrediction && !globalState.isLoadingWeather) {
                eventBus.emit('triggerPrediction');
            }
        } else {
            // Form není validní, zobrazit placeholder
            eventBus.emit('formNotValid', validation.errors);
        }
        
        // Aktualizace progress
        updateFormProgress();
        
    }, 500); // 500ms delay
}

// ========================================
// EVENT LISTENERS PRO PART 3B
// ========================================

// Event listeners pro enhanced validation
eventBus.on('formValidAndReady', () => {
    console.log('✅ Form is valid and ready for prediction');
    updateFieldsStatus();
});

eventBus.on('formNotValid', (errors) => {
    console.log('❌ Form validation failed:', errors);
    updateFieldsStatus();
    displayPredictionPlaceholder();
});

// Event pro změnu business modelu
eventBus.on('businessModelChanged', (data) => {
    updateBusinessInfo();
    validateRequiredFields();
});

// Event pro změnu rent type
eventBus.on('rentTypeChanged', (data) => {
    updateRentFields();
    validateRequiredFields();
});

// Event pro změnu event type
eventBus.on('eventTypeChanged', (data) => {
    updateWeatherCard();
    validateRequiredFields();
});

// ========================================
// INICIALIZACE PART 3B
// ========================================

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Initializing Part 3B Form Enhancements...');
    
    // Nastavení enhanced validation
    setupRealTimeValidation();
    
    // Nastavení smart suggestions
    setupSmartSuggestions();
    
    // Nastavení auto-save
    setupAutoSave();
    
    // První validace
    setTimeout(() => {
        validateRequiredFields();
        updateFormProgress();
    }, 1000);
    
    console.log('✅ Part 3B Form Enhancements initialized');
});

// ========================================
// FINALIZACE PART 3B
// ========================================

console.log('✅ Donuland Part 3B loaded successfully');
console.log('📝 Features: ✅ Enhanced Validation ✅ Real-time Feedback ✅ Smart Suggestions ✅ Auto-save');
console.log('🧠 Smart features: Auto-categorization + City suggestions + Smart defaults');
console.log('⚡ Real-time: Field validation + Progress tracking + Debounced prediction trigger');
console.log('⏳ Ready for Part 3C: Advanced UI Components');

// Event pro signalizaci dokončení části 3B
eventBus.emit('part3bLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['enhanced-validation', 'real-time-feedback', 'smart-suggestions', 'auto-save', 'progress-tracking']
});
/* ========================================
   DONULAND MANAGEMENT SYSTEM - PART 3C
   Advanced UI Components & Interactions
   ======================================== */

console.log('🍩 Donuland Part 3C loading...');

// ========================================
// ADVANCED TOOLTIPS & HELP SYSTEM
// ========================================

// Inteligentní tooltip systém
function setupAdvancedTooltips() {
    console.log('💡 Setting up advanced tooltips...');
    
    const tooltipData = {
        'eventName': {
            title: 'Název akce',
            content: 'Zadejte přesný název akce. Systém automaticky vyhledá podobné akce v historii.',
            examples: ['Burger Fest Praha', 'ČokoFest Brno', 'Food Festival Ostrava']
        },
        'category': {
            title: 'Kategorie akce',
            content: 'Kategorie ovlivňuje základní konverzní poměr. Food festivaly mají nejwyšší konverzi.',
            stats: {
                'food festival': '15% konverze',
                'veletrh': '18% konverze (nejlepší)',
                'koncert': '8% konverze (nejhorší)'
            }
        },
        'visitors': {
            title: 'Očekávaná návštěvnost',
            content: 'Celkový počet návštěvníků za celou dobu akce. Větší akce mají vyšší konverzi.',
            formula: 'Predikovaný prodej = Návštěvnost × Konverzní faktory'
        },
        'competition': {
            title: 'Úroveň konkurence',
            content: 'Počet podobných food stánků na akci.',
            impact: {
                1: '+20% prodej (malá konkurence)',
                2: 'Baseline (střední konkurence)', 
                3: '-30% prodej (velká konkurence)'
            }
        },
        'price': {
            title: 'Prodejní cena donut',
            content: 'Optimální cena je 45-55 Kč. Vyšší cena = vyšší marže, ale nižší prodej.',
            recommendation: 'Doporučeno: 50 Kč'
        }
    };
    
    // Vytvoření tooltip elementů
    Object.keys(tooltipData).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            setupFieldTooltip(field, tooltipData[fieldId]);
        }
    });
}

// Nastavení tooltip pro konkrétní pole
function setupFieldTooltip(field, data) {
    const container = field.parentElement;
    
    // Přidání help ikony
    const helpIcon = document.createElement('div');
    helpIcon.className = 'field-help-icon';
    helpIcon.innerHTML = '❓';
    helpIcon.title = 'Klikněte pro nápovědu';
    
    container.style.position = 'relative';
    container.appendChild(helpIcon);
    
    // Event listeners
    helpIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        showAdvancedTooltip(helpIcon, data, field.id);
    });
    
    // Hover effect
    helpIcon.addEventListener('mouseenter', () => {
        helpIcon.style.transform = 'scale(1.2)';
    });
    
    helpIcon.addEventListener('mouseleave', () => {
        helpIcon.style.transform = 'scale(1)';
    });
}

// Zobrazení pokročilého tooltip
function showAdvancedTooltip(trigger, data, fieldId) {
    // Odstranění existujícího tooltip
    const existing = document.querySelector('.advanced-tooltip');
    if (existing) {
        existing.remove();
    }
    
    // Vytvoření tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'advanced-tooltip';
    
    let content = `
        <div class="tooltip-header">
            <h4>${data.title}</h4>
            <button class="tooltip-close" onclick="closeAdvancedTooltip()">×</button>
        </div>
        <div class="tooltip-content">
            <p>${data.content}</p>
    `;
    
    // Přidání příkladů
    if (data.examples) {
        content += `
            <div class="tooltip-examples">
                <strong>Příklady:</strong>
                <ul>
                    ${data.examples.map(ex => `<li>${ex}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Přidání statistik
    if (data.stats) {
        content += `
            <div class="tooltip-stats">
                <strong>Konverzní poměry:</strong>
                <ul>
                    ${Object.entries(data.stats).map(([key, value]) => 
                        `<li><span class="stat-category">${key}:</span> <span class="stat-value">${value}</span></li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }
    
    // Přidání dopadů
    if (data.impact) {
        content += `
            <div class="tooltip-impact">
                <strong>Vliv na prodej:</strong>
                <ul>
                    ${Object.entries(data.impact).map(([key, value]) => 
                        `<li><span class="impact-level">${key}:</span> <span class="impact-value">${value}</span></li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }
    
    // Přidání formule
    if (data.formula) {
        content += `
            <div class="tooltip-formula">
                <strong>Výpočet:</strong>
                <code>${data.formula}</code>
            </div>
        `;
    }
    
    // Přidání doporučení
    if (data.recommendation) {
        content += `
            <div class="tooltip-recommendation">
                <strong>💡 ${data.recommendation}</strong>
            </div>
        `;
    }
    
    content += '</div>';
    tooltip.innerHTML = content;
    
    // Pozicování
    document.body.appendChild(tooltip);
    positionTooltip(tooltip, trigger);
    
    // Animace
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'scale(0.8)';
    
    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'scale(1)';
    });
    
    // Auto-close po 10 sekundách
    setTimeout(() => {
        closeAdvancedTooltip();
    }, 10000);
}

// Pozicování tooltip
function positionTooltip(tooltip, trigger) {
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = triggerRect.left + window.scrollX;
    let top = triggerRect.bottom + window.scrollY + 10;
    
    // Kontrola překročení okraje
    if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 20;
    }
    
    if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
        top = triggerRect.top + window.scrollY - tooltipRect.height - 10;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

// Zavření tooltip
function closeAdvancedTooltip() {
    const tooltip = document.querySelector('.advanced-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (tooltip.parentElement) {
                tooltip.remove();
            }
        }, 200);
    }
}

// ========================================
// FORM PROGRESS VISUALIZATION
// ========================================

// Vytvoření progress baru
function createFormProgressBar() {
    const header = document.querySelector('.section-header');
    if (!header) return;
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'form-progress-container';
    progressContainer.innerHTML = `
        <div class="form-progress-wrapper">
            <div class="form-progress-label">
                <span class="form-progress-text">0/10 polí vyplněno</span>
                <span class="form-progress-percentage">0%</span>
            </div>
            <div class="form-progress-track">
                <div class="form-progress-bar"></div>
            </div>
            <div class="form-progress-steps">
                <div class="progress-step" data-step="basic">📋 Základní údaje</div>
                <div class="progress-step" data-step="details">🎯 Detaily akce</div>
                <div class="progress-step" data-step="business">💼 Business model</div>
                <div class="progress-step" data-step="costs">💰 Náklady</div>
                <div class="progress-step" data-step="ready">🎉 Připraveno</div>
            </div>
        </div>
    `;
    
    header.appendChild(progressContainer);
    
    // Inicializace progress tracking
    updateFormProgressAdvanced();
}

// Pokročilé sledování progress
function updateFormProgressAdvanced() {
    const steps = {
        'basic': ['eventName', 'category', 'city'],
        'details': ['eventDateFrom', 'eventDateTo', 'visitors', 'competition'],
        'business': ['eventType', 'businessModel'],
        'costs': ['rentType', 'price'],
        'ready': [] // Speciální krok pro dokončení
    };
    
    let totalFields = 0;
    let completedFields = 0;
    let currentStep = 'basic';
    
    // Výpočet pokroku podle kroků
    Object.entries(steps).forEach(([stepName, fields]) => {
        totalFields += fields.length;
        
        let stepCompleted = 0;
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && element.value.trim()) {
                completedFields++;
                stepCompleted++;
            }
        });
        
        // Aktualizace UI kroku
        const stepElement = document.querySelector(`[data-step="${stepName}"]`);
        if (stepElement) {
            if (stepCompleted === fields.length && fields.length > 0) {
                stepElement.classList.add('completed');
                stepElement.classList.remove('active');
                currentStep = getNextStep(stepName);
            } else if (stepCompleted > 0) {
                stepElement.classList.add('active');
                stepElement.classList.remove('completed');
                currentStep = stepName;
            } else {
                stepElement.classList.remove('active', 'completed');
            }
        }
    });
    
    // Speciální kontrola pro "ready" krok
    const validation = validateRequiredFields();
    const readyStep = document.querySelector('[data-step="ready"]');
    if (readyStep) {
        if (validation.valid) {
            readyStep.classList.add('completed');
            readyStep.classList.remove('active');
        } else {
            readyStep.classList.remove('completed');
            if (completedFields >= totalFields * 0.8) {
                readyStep.classList.add('active');
            }
        }
    }
    
    // Aktualizace progress baru
    const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
    
    const progressBar = document.querySelector('.form-progress-bar');
    const progressText = document.querySelector('.form-progress-text');
    const progressPercentage = document.querySelector('.form-progress-percentage');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${completedFields}/${totalFields} polí vyplněno`;
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = `${Math.round(progress)}%`;
    }
    
    // Emit progress event
    eventBus.emit('formProgressChanged', {
        progress: progress,
        completedFields: completedFields,
        totalFields: totalFields,
        currentStep: currentStep,
        isValid: validation.valid
    });
    
    return { progress, completedFields, totalFields, currentStep };
}

// Získání dalšího kroku
function getNextStep(currentStep) {
    const stepOrder = ['basic', 'details', 'business', 'costs', 'ready'];
    const currentIndex = stepOrder.indexOf(currentStep);
    return stepOrder[currentIndex + 1] || 'ready';
}

// ========================================
// FIELD HIGHLIGHTING & FOCUS MANAGEMENT
// ========================================

// Inteligentní highlighting prázdných polí
function setupFieldHighlighting() {
    console.log('✨ Setting up field highlighting...');
    
    // Tlačítko pro highlight prázdných polí
    addHighlightButton();
    
    // Auto-highlight při pokusu o predikci s neúplným formulářem
    eventBus.on('formNotValid', (errors) => {
        highlightEmptyRequiredFields();
    });
}

// Přidání tlačítka pro highlight
function addHighlightButton() {
    const formHeader = document.querySelector('.card h3');
    if (!formHeader) return;
    
    const highlightBtn = document.createElement('button');
    highlightBtn.className = 'btn btn-highlight';
    highlightBtn.innerHTML = '✨ Označit prázdná pole';
    highlightBtn.onclick = highlightEmptyRequiredFields;
    
    formHeader.appendChild(highlightBtn);
}

// Označení prázdných povinných polí
function highlightEmptyRequiredFields() {
    const requiredFields = [
        'eventName', 'category', 'city', 'eventDateFrom', 'eventDateTo', 
        'visitors', 'competition', 'eventType', 'businessModel', 'rentType'
    ];
    
    let firstEmptyField = null;
    
    requiredFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            if (!element.value.trim()) {
                // Označení prázdného pole
                element.classList.add('highlight-empty');
                element.style.animation = 'fieldPulse 2s ease-in-out';
                
                if (!firstEmptyField) {
                    firstEmptyField = element;
                }
                
                // Odstranění highlight po 3 sekundách
                setTimeout(() => {
                    element.classList.remove('highlight-empty');
                    element.style.animation = '';
                }, 3000);
            } else {
                // Označení vyplněného pole
                element.classList.add('highlight-filled');
                setTimeout(() => {
                    element.classList.remove('highlight-filled');
                }, 1000);
            }
        }
    });
    
    // Scroll a focus na první prázdné pole
    if (firstEmptyField) {
        firstEmptyField.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        setTimeout(() => {
            firstEmptyField.focus();
        }, 500);
        
        showNotification(`📍 Skokem na první prázdné pole: ${firstEmptyField.previousElementSibling?.textContent || 'Neznámé pole'}`, 'info', 3000);
    }
}

// ========================================
// SMART FORM NAVIGATION
// ========================================

// Inteligentní navigace mezi poli
function setupSmartNavigation() {
    console.log('🧭 Setting up smart navigation...');
    
    const formElements = document.querySelectorAll('input, select, textarea');
    
    formElements.forEach((element, index) => {
        // Enter key navigation
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && element.tagName !== 'TEXTAREA') {
                e.preventDefault();
                
                // Najít další nevyplněné pole
                const nextField = findNextEmptyField(index, formElements);
                if (nextField) {
                    nextField.focus();
                    nextField.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                } else {
                    // Všechna pole vyplněna, zkusit predikci
                    const validation = validateRequiredFields();
                    if (validation.valid) {
                        eventBus.emit('triggerPrediction');
                        showNotification('🎉 Formulář kompletní! Spouštím predikci...', 'success', 3000);
                    }
                }
            }
        });
        
        // Tab trap pro lepší UX
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // Přidat visual feedback
                setTimeout(() => {
                    const focusedElement = document.activeElement;
                    if (focusedElement && focusedElement !== element) {
                        focusedElement.style.boxShadow = '0 0 10px rgba(102, 126, 234, 0.3)';
                        setTimeout(() => {
                            focusedElement.style.boxShadow = '';
                        }, 1000);
                    }
                }, 50);
            }
        });
    });
}

// Najít další prázdné pole
function findNextEmptyField(currentIndex, allElements) {
    // Hledání dopředu
    for (let i = currentIndex + 1; i < allElements.length; i++) {
        const element = allElements[i];
        if (isRequiredField(element) && !element.value.trim()) {
            return element;
        }
    }
    
    // Hledání od začátku
    for (let i = 0; i < currentIndex; i++) {
        const element = allElements[i];
        if (isRequiredField(element) && !element.value.trim()) {
            return element;
        }
    }
    
    return null;
}

// Kontrola zda je pole povinné
function isRequiredField(element) {
    const requiredIds = [
        'eventName', 'category', 'city', 'eventDateFrom', 'eventDateTo', 
        'visitors', 'competition', 'eventType', 'businessModel', 'rentType'
    ];
    
    return requiredIds.includes(element.id);
}

// ========================================
// DYNAMIC FIELD INTERACTIONS
// ========================================

// Dynamické interakce mezi poli
function setupDynamicInteractions() {
    console.log('🔄 Setting up dynamic interactions...');
    
    // Kategorie ovlivňuje doporučené ceny
    setupCategoryPriceInteraction();
    
    // Velikost akce ovlivňuje doporučení
    setupVisitorsSizeInteraction();
    
    // Business model ovlivňuje rent suggestions
    setupBusinessRentInteraction();
    
    // Počasí warnings pro outdoor akce
    setupWeatherWarnings();
}

// Interakce kategorie a ceny
function setupCategoryPriceInteraction() {
    const categorySelect = document.getElementById('category');
    const priceInput = document.getElementById('price');
    
    if (!categorySelect || !priceInput) return;
    
    const categoryPrices = {
        'food festival': { optimal: 55, range: '50-60 Kč', reason: 'Návštěvníci očekávají kvalitu' },
        'veletrh': { optimal: 60, range: '55-65 Kč', reason: 'Vyšší kupní síla návštěvníků' },
        'koncert': { optimal: 45, range: '40-50 Kč', reason: 'Mladší publikum, cenově citlivé' },
        'kulturní akce': { optimal: 50, range: '45-55 Kč', reason: 'Střední kupní síla' },
        'sportovní': { optimal: 48, range: '45-52 Kč', reason: 'Rychlé občerstvení během akce' }
    };
    
    categorySelect.addEventListener('change', () => {
        const category = categorySelect.value;
        const priceData = categoryPrices[category];
        
        if (priceData && (!priceInput.value || priceInput.value == CONFIG.DONUT_PRICE)) {
            priceInput.value = priceData.optimal;
            
            // Zobrazení doporučení
            showPriceRecommendation(priceInput, priceData);
        }
    });
}

// Zobrazení doporučení ceny
function showPriceRecommendation(priceInput, priceData) {
    // Odstranění starého doporučení
    const existingRec = priceInput.parentElement.querySelector('.price-recommendation');
    if (existingRec) {
        existingRec.remove();
    }
    
    // Nové doporučení
    const recommendation = document.createElement('div');
    recommendation.className = 'price-recommendation';
    recommendation.innerHTML = `
        <div class="recommendation-content">
            <span class="rec-icon">💡</span>
            <span class="rec-text">Doporučeno: ${priceData.range}</span>
            <span class="rec-reason">${priceData.reason}</span>
        </div>
    `;
    
    priceInput.parentElement.appendChild(recommendation);
    
    // Auto-remove po 5 sekundách
    setTimeout(() => {
        if (recommendation.parentElement) {
            recommendation.remove();
        }
    }, 5000);
}

// Interakce velikosti akce
function setupVisitorsSizeInteraction() {
    const visitorsInput = document.getElementById('visitors');
    if (!visitorsInput) return;
    
    visitorsInput.addEventListener('input', debounce(() => {
        const visitors = parseInt(visitorsInput.value);
        if (isNaN(visitors)) return;
        
        // Zobrazení kategorie velikosti
        showEventSizeCategory(visitorsInput, visitors);
        
        // Varování pro extrémní velikosti
        if (visitors > 50000) {
            showNotification('⚠️ Velmi velká akce! Zvažte dodatečný personál a logistiku.', 'warning', 5000);
        } else if (visitors < 100) {
            showNotification('💡 Malá akce. Franšízový model může být vhodnější.', 'info', 3000);
        }
    }, 1000));
}

// Zobrazení kategorie velikosti akce
function showEventSizeCategory(visitorsInput, visitors) {
    let category, description, color;
    
    if (visitors < 500) {
        category = 'Malá akce';
        description = 'Lokální událost, nižší konverze';
        color = '#ffc107';
    } else if (visitors < 2000) {
        category = 'Střední akce';
        description = 'Regionální dosah, standardní konverze';
        color = '#28a745';
    } else if (visitors < 10000) {
        category = 'Velká akce';
        description = 'Vysoký potenciál, vyšší konverze';
        color = '#17a2b8';
    } else {
        category = 'Mega akce';
        description = 'Extrémní potenciál, nejvyšší konverze';
        color = '#6f42c1';
    }
    
    // Odstranění staré kategorie
    const existingCategory = visitorsInput.parentElement.querySelector('.size-category');
    if (existingCategory) {
        existingCategory.remove();
    }
    
    // Nová kategorie
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'size-category';
    categoryDiv.innerHTML = `
        <span class="category-badge" style="background-color: ${color};">${category}</span>
        <span class="category-description">${description}</span>
    `;
    
    visitorsInput.parentElement.appendChild(categoryDiv);
}

// Business a rent interakce
function setupBusinessRentInteraction() {
    const businessSelect = document.getElementById('businessModel');
    const rentSelect = document.getElementById('rentType');
    
    if (!businessSelect || !rentSelect) return;
    
    businessSelect.addEventListener('change', () => {
        const businessModel = businessSelect.value;
        
        // Doporučení rent type podle business modelu
        const recommendations = {
            'owner': 'mixed', // Kombinace pro vlastníka
            'employee': 'percentage', // Procenta pro zaměstnance
            'franchise': 'free' // Často zdarma pro franšízu
        };
        
        if (recommendations[businessModel] && !rentSelect.value) {
            rentSelect.value = recommendations[businessModel];
            rentSelect.dispatchEvent(new Event('change'));
            
            showNotification(`💡 Auto-vybráno: ${getRentTypeLabel(recommendations[businessModel])} pro ${getBusinessModelLabel(businessModel)}`, 'info', 3000);
        }
    });
}

// Získání labelu pro rent type
function getRentTypeLabel(rentType) {
    const labels = {
        'fixed': 'Fixní nájem',
        'percentage': '% z obratu',
        'mixed': 'Kombinace',
        'free': 'Zdarma'
    };
    
    return labels[rentType] || rentType;
}

// ========================================
// QUICK ACTIONS & SHORTCUTS
// ========================================

// Rychlé akce a zkratky
function setupQuickActions() {
    console.log('⚡ Setting up quick actions...');
    
    // Tlačítko pro rychlé vyplnění demo dat
    addQuickFillButton();
    
    // Tlačítko pro reset formuláře
    addResetButton();
    
    // Tlačítko pro kopírování posledních údajů
    addCopyLastButton();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

// Tlačítko pro rychlé vyplnění
function addQuickFillButton() {
    const formHeader = document.querySelector('.card h3');
    if (!formHeader) return;
    
    const quickFillBtn = document.createElement('button');
    quickFillBtn.className = 'btn btn-demo';
    quickFillBtn.innerHTML = '🎭 Demo data';
    quickFillBtn.onclick = fillDemoData;
    quickFillBtn.title = 'Rychle vyplnit demo data pro testování';
    
    formHeader.appendChild(quickFillBtn);
}

// Vyplnění demo dat
function fillDemoData() {
    const demoData = {
        eventName: 'Burger Fest Praha',
        category: 'food festival',
        city: 'Praha',
        eventDateFrom: getDateInFuture(14),
        eventDateTo: getDateInFuture(16),
        visitors: '8000',
        competition: '2',
        eventType: 'outdoor',
        businessModel: 'owner',
        rentType: 'mixed',
        mixedFixed: '3000',
        mixedPercentage: '8',
        price: '55'
    };
    
    Object.entries(demoData).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            element.value = value;
            element.dispatchEvent(new Event('change'));
        }
    });
    
    showNotification('🎭 Demo data vyplněna', 'success', 2000);
}

// Získání data v budoucnosti
function getDateInFuture(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

// Tlačítko pro reset
function addResetButton() {
    const formHeader = document.querySelector('.card h3');
    if (!formHeader) return;
    
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-reset';
    resetBtn.innerHTML = '🔄 Reset';
    resetBtn.onclick = resetForm;
    resetBtn.title = 'Vymazat všechna data formuláře';
    
    formHeader.appendChild(resetBtn);
}

// Reset formuláře
function resetForm() {
    if (confirm('Opravdu chcete vymazat všechna data z formuláře?')) {
        const formElements = document.querySelectorAll('input, select, textarea');
        
        formElements.forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }
            
            // Reset styling
            element.classList.remove('error', 'valid');
        });
        
        // Reset business info cards
        updateBusinessInfo();
        updateRentFields();
        
        // Reset results
        displayPredictionPlaceholder();
        hideActionButtons();
        
        // Vymazání auto-save
        localStorage.removeItem('donuland_form_autosave');
        
        showNotification('🔄 Formulář resetován', 'info', 2000);
    }
}

// ========================================
// EVENT LISTENERS PRO PART 3C
// ========================================

// Event listeners pro advanced UI
eventBus.on('formProgressChanged', (data) => {
    console.log(`📊 Form progress: ${data.progress.toFixed(1)}% (${data.completedFields}/${data.totalFields})`);
    
    // Spouštění efektů podle pokroku
    if (data.progress >= 100 && data.isValid) {
        // Animace dokončení
        celebrateFormCompletion();
    }
});

// Oslava dokončení formuláře
function celebrateFormCompletion() {
    // Jednorázová animace
    if (globalState.formCompletionCelebrated) return;
    globalState.formCompletionCelebrated = true;
    
    showNotification('🎉 Formulář je kompletní! Připravuji predikci...', 'success', 4000);
    
    // Scroll k výsledkům
    setTimeout(() => {
        const resultsSection = document.getElementById('predictionResults');
        if (resultsSection) {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }, 1000);
}

// Event pro zavření tooltip při kliknutí mimo
document.addEventListener('click', (e) => {
    if (!e.target.closest('.advanced-tooltip') && !e.target.closest('.field-help-icon')) {
        closeAdvancedTooltip();
    }
});

// Event pro escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAdvancedTooltip();
    }
});

// ========================================
// INICIALIZACE PART 3C
// ========================================

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Initializing Part 3C Advanced UI...');
    
    // Vytvoření progress baru
    setTimeout(() => {
        createFormProgressBar();
    }, 500);
    
    // Nastavení tooltips
    setupAdvancedTooltips();
    
    // Nastavení field highlighting
    setupFieldHighlighting();
    
    // Nastavení smart navigation
    setupSmartNavigation();
    
    // Nastavení dynamic interactions
    setupDynamicInteractions();
    
    // Nastavení quick actions
    setupQuickActions();
    
    console.log('✅ Part 3C Advanced UI initialized');
});

// ========================================
// FINALIZACE PART 3C
// ========================================

console.log('✅ Donuland Part 3C loaded successfully');
console.log('🎨 Features: ✅ Advanced Tooltips ✅ Progress Visualization ✅ Smart Navigation ✅ Dynamic Interactions');
console.log('⚡ Quick Actions: Demo data + Reset + Copy last + Keyboard shortcuts');
console.log('✨ UX Enhancements: Field highlighting + Auto-recommendations + Smart defaults');
console.log('🎯 All Part 3 components ready - UI is now fully interactive!');

// Event pro signalizaci dokončení části 3C
eventBus.emit('part3cLoaded', { 
    timestamp: Date.now(),
    version: '1.0.0',
    features: ['advanced-tooltips', 'progress-visualization', 'smart-navigation', 'dynamic-interactions', 'quick-actions', 'field-highlighting']
});
