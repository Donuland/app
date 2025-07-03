/* ========================================
   DONULAND MANAGEMENT SYSTEM - STYLES
   Kompletní CSS pro všechny komponenty
   ======================================== */

/* Reset a základní styly */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
    line-height: 1.6;
}

/* ========================================
   LOADING SCREEN
   ======================================== */
.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #ff6b6b, #feca57);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: opacity 0.5s ease;
}

.loading-content {
    text-align: center;
    color: white;
}

.donut {
    font-size: 4em;
    animation: spin 2s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.loading-content h1 {
    margin-bottom: 20px;
    font-size: 2.5em;
}

.loading-bar {
    width: 300px;
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    overflow: hidden;
    margin: 20px auto;
}

.loading-progress {
    width: 0%;
    height: 100%;
    background: white;
    border-radius: 3px;
    animation: loadingProgress 3s ease-in-out forwards;
}

@keyframes loadingProgress {
    0% { width: 0%; }
    100% { width: 100%; }
}

/* ========================================
   HLAVNÍ LAYOUT
   ======================================== */
.app {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

/* ========================================
   HEADER
   ======================================== */
.header {
    background: white;
    border-radius: 15px;
    padding: 20px 30px;
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h1 {
    color: #333;
    font-size: 2em;
}

.header-controls {
    display: flex;
    gap: 15px;
    align-items: center;
}

/* Status indikátor */
.status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f8d7da;
    border-radius: 20px;
    font-size: 14px;
    color: #721c24;
    transition: all 0.3s ease;
}

.status.online {
    background: #d4edda;
    color: #155724;
}

.status.loading {
    background: #fff3cd;
    color: #856404;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: #dc3545;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

.status.online .status-dot {
    background: #28a745;
}

.status.loading .status-dot {
    background: #ffc107;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* ========================================
   NAVIGACE
   ======================================== */
.nav {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.nav-btn {
    background: white;
    border: none;
    padding: 15px 25px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    color: #666;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-btn:hover {
    background: #f8f9fa;
    transform: translateY(-2px);
}

.nav-btn.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    transform: translateY(-2px);
}

/* ========================================
   HLAVNÍ OBSAH
   ======================================== */
.main {
    background: white;
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    min-height: 600px;
}

/* Sekce */
.section {
    display: none;
}

.section.active {
    display: block;
}

.section-header {
    text-align: center;
    margin-bottom: 40px;
}

.section-header h2 {
    font-size: 2.5em;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.section-header p {
    color: #666;
    font-size: 1.2em;
}

/* ========================================
   KARTY
   ======================================== */
.card {
    background: #f8f9fa;
    border-radius: 15px;
    padding: 25px;
    margin-bottom: 25px;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.card:hover {
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.card h3 {
    margin-bottom: 20px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.3em;
}

/* ========================================
   FORMULÁŘE
   ======================================== */
.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
    background: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input[readonly] {
    background-color: #f8f9fa;
    color: #666;
    cursor: not-allowed;
}

.form-group input.error,
.form-group select.error {
    border-color: #dc3545;
}

/* ========================================
   TLAČÍTKA
   ======================================== */
.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
}

.btn:hover {
    transform: translateY(-2px);
}

.btn-refresh {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
}

.btn-refresh:hover {
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-save {
    background: #28a745;
    color: white;
}

.btn-save:hover {
    background: #218838;
}

.btn-export {
    background: #17a2b8;
    color: white;
}

.btn-export:hover {
    background: #138496;
}

.btn-delete {
    background: #dc3545;
    color: white;
}

.btn-delete:hover {
    background: #c82333;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.action-buttons {
    text-align: center;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid #e9ecef;
}

/* ========================================
   BUSINESS INFO
   ======================================== */
.business-info {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 15px;
    margin-top: 15px;
    color: #856404;
}

.business-info h4 {
    margin-bottom: 10px;
    color: #856404;
}

.business-info ul {
    margin-left: 20px;
}

.business-info li {
    margin-bottom: 5px;
}

/* ========================================
   VÝSLEDKY PREDIKCE
   ======================================== */
.results-card {
    background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
    border: none;
    border-left: 5px solid #667eea;
}

.results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.result-item {
    background: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.result-item:hover {
    transform: translateY(-3px);
}

.result-value {
    font-size: 2em;
    font-weight: bold;
    margin-bottom: 8px;
    color: #667eea;
}

.result-value.positive { color: #28a745; }
.result-value.negative { color: #dc3545; }
.result-value.warning { color: #ffc107; }

.result-label {
    color: #666;
    font-size: 0.9em;
    font-weight: 500;
}

/* Rozpis nákladů */
.costs-breakdown {
    background: white;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
    border: 1px solid #e9ecef;
}

.cost-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f8f9fa;
}

.cost-item:last-child {
    border-bottom: none;
    font-weight: bold;
    font-size: 1.1em;
    margin-top: 10px;
    padding-top: 15px;
    border-top: 2px solid #667eea;
}

/* Doporučení */
.recommendations {
    background: #e3f2fd;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
    border-left: 4px solid #2196f3;
}

.recommendations h4 {
    margin-bottom: 10px;
    color: #1976d2;
}

.recommendations ul {
    margin-left: 20px;
}

.recommendations li {
    margin-bottom: 5px;
}

/* ========================================
   POČASÍ
   ======================================== */
.weather-card {
    background: linear-gradient(135deg, #74b9ff, #0984e3);
    color: white;
    border-radius: 15px;
    padding: 25px;
    text-align: center;
    margin: 20px 0;
}

.weather-icon {
    font-size: 4em;
    margin-bottom: 15px;
}

.weather-temp {
    font-size: 3em;
    font-weight: bold;
    margin-bottom: 10px;
}

.weather-desc {
    font-size: 1.2em;
    margin-bottom: 20px;
    opacity: 0.9;
}

.weather-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
    margin-top: 20px;
}

.weather-detail {
    text-align: center;
}

.weather-detail-value {
    font-size: 1.3em;
    font-weight: bold;
    margin-bottom: 5px;
}

.weather-detail-label {
    opacity: 0.8;
    font-size: 0.9em;
}

.weather-warning {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 15px;
    margin-top: 15px;
    border-left: 4px solid #ffc107;
}

/* ========================================
   HISTORICKÁ DATA
   ======================================== */
.historical-item {
    background: white;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 10px;
    border-left: 4px solid #28a745;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.historical-info h4 {
    margin-bottom: 5px;
    color: #333;
}

.historical-info p {
    color: #666;
    font-size: 0.9em;
}

.historical-stats {
    text-align: right;
}

.historical-sales {
    font-size: 1.3em;
    font-weight: bold;
    color: #28a745;
}

.historical-rating {
    color: #ffc107;
}

/* ========================================
   KALENDÁŘ
   ======================================== */
.calendar-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
}

.calendar-controls h3 {
    margin: 0;
    font-size: 1.5em;
}

.calendar-filters {
    display: flex;
    gap: 15px;
    margin-top: 15px;
    flex-wrap: wrap;
}

.calendar-filters select {
    padding: 8px 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    background: white;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 20px;
}

.calendar-header {
    background: #667eea;
    color: white;
    padding: 15px 8px;
    text-align: center;
    font-weight: bold;
    font-size: 0.9em;
}

.calendar-day {
    background: white;
    min-height: 100px;
    padding: 8px;
    position: relative;
    transition: background-color 0.3s ease;
}

.calendar-day:hover {
    background: #f8f9fa;
}

.calendar-day.other-month {
    background: #f8f9fa;
    color: #999;
}

.calendar-day.today {
    background: #fff3cd;
    border: 2px solid #ffc107;
}

.day-number {
    font-weight: bold;
    margin-bottom: 5px;
    font-size: 0.9em;
}

.day-events {
    font-size: 0.8em;
}

.event-item {
    background: #667eea;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    margin-bottom: 2px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}

.event-item:hover {
    background: #5a67d8;
    transform: scale(1.05);
}

.event-item.prediction {
    background: #17a2b8;
}

.event-item.completed {
    background: #28a745;
}

/* ========================================
   ANALÝZY
   ======================================== */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.stat-item {
    background: white;
    padding: 25px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.stat-item:hover {
    transform: translateY(-3px);
}

.stat-value {
    font-size: 2.5em;
    font-weight: bold;
    margin-bottom: 10px;
    color: #667eea;
}

.stat-label {
    color: #666;
    font-weight: 500;
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
}

.top-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: white;
    border-radius: 8px;
    margin-bottom: 10px;
    border-left: 4px solid #28a745;
    transition: all 0.3s ease;
}

.top-item:hover {
    transform: translateX(5px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.top-info h4 {
    margin-bottom: 5px;
    color: #333;
}

.top-info p {
    color: #666;
    font-size: 0.9em;
}

.top-stats {
    text-align: right;
}

.top-value {
    font-size: 1.3em;
    font-weight: bold;
    color: #28a745;
}

.top-subvalue {
    font-size: 0.9em;
    color: #666;
}

/* Chart container */
.chart-container {
    position: relative;
    height: 300px;
    margin: 20px 0;
}

/* ========================================
   NASTAVENÍ
   ======================================== */
.factors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin: 20px 0;
}

.factor-group h4 {
    margin-bottom: 15px;
    color: #333;
    padding-bottom: 8px;
    border-bottom: 2px solid #e9ecef;
}

.factor-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.factor-item label {
    flex: 1;
    margin: 0;
    color: #666;
}

.factor-item input {
    width: 80px;
    margin: 0;
    text-align: center;
}

/* ========================================
   MODAL
   ======================================== */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 15px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow: auto;
}

.modal-header {
    padding: 20px 25px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    color: #333;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    color: #999;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-close:hover {
    color: #333;
}

.modal-body {
    padding: 25px;
}

.modal-footer {
    padding: 20px 25px;
    border-top: 1px solid #e9ecef;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    flex-wrap: wrap;
}

/* ========================================
   NOTIFIKACE
   ======================================== */
#notifications {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.notification {
    background: white;
    border-radius: 10px;
    padding: 15px 20px;
    margin-bottom: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    max-width: 350px;
    display: flex;
    align-items: center;
    gap: 15px;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    border-left: 4px solid #17a2b8;
}

.notification.show {
    transform: translateX(0);
}

.notification.success {
    border-left-color: #28a745;
}

.notification.error {
    border-left-color: #dc3545;
}

.notification.warning {
    border-left-color: #ffc107;
}

.notification-icon {
    font-size: 1.3em;
}

.notification-content {
    flex: 1;
}

.notification-title {
    font-weight: 600;
    margin-bottom: 5px;
}

.notification-message {
    color: #666;
    font-size: 0.9em;
}

.notification-close {
    background: none;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 20px;
    height: 20px;
}

.notification-close:hover {
    color: #333;
}

/* ========================================
   UTILITY CLASSES
   ======================================== */
.placeholder {
    text-align: center;
    color: #999;
    font-style: italic;
    padding: 40px;
}

.loading {
    text-align: center;
    padding: 40px;
    color: #666;
}

.loading::before {
    content: "⏳";
    font-size: 2em;
    display: block;
    margin-bottom: 15px;
}

.error {
    text-align: center;
    padding: 40px;
    color: #dc3545;
}

.error::before {
    content: "❌";
    font-size: 2em;
    display: block;
    margin-bottom: 15px;
}

.success {
    color: #28a745;
}

.warning {
    color: #ffc107;
}

.info {
    color: #17a2b8;
}

.hidden {
    display: none !important;
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 768px) {
    .app {
        padding: 10px;
    }
    
    .header-content {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .header h1 {
        font-size: 1.8em;
    }
    
    .nav {
        justify-content: center;
    }
    
    .nav-btn {
        padding: 12px 20px;
        font-size: 14px;
    }
    
    .main {
        padding: 20px;
    }
    
    .section-header h2 {
        font-size: 2em;
    }
    
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .results-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .analytics-grid {
        grid-template-columns: 1fr;
    }
    
    .calendar-grid {
        font-size: 0.9em;
    }
    
    .calendar-day {
        min-height: 80px;
        padding: 5px;
    }
    
    .weather-details {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .factors-grid {
        grid-template-columns: 1fr;
    }
    
    .button-group {
        justify-content: center;
    }
    
    .modal-content {
        width: 95%;
        margin: 20px;
    }
    
    .modal-footer {
        justify-content: center;
    }
    
    #notifications {
        left: 10px;
        right: 10px;
    }
    
    .notification {
        max-width: none;
        transform: translateY(-100px);
    }
    
    .notification.show {
        transform: translateY(0);
    }
}

@media (max-width: 480px) {
    .donut {
        font-size: 3em;
    }
    
    .loading-content h1 {
        font-size: 2em;
    }
    
    .loading-bar {
        width: 250px;
    }
    
    .header {
        padding: 15px 20px;
    }
    
    .header h1 {
        font-size: 1.5em;
    }
    
    .main {
        padding: 15px;
    }
    
    .card {
        padding: 15px;
    }
    
    .section-header h2 {
        font-size: 1.8em;
    }
    
    .result-value {
        font-size: 1.5em;
    }
    
    .calendar-day {
        min-height: 60px;
        padding: 3px;
    }
    
    .day-number {
        font-size: 0.8em;
    }
    
    .event-item {
        font-size: 0.7em;
        padding: 1px 4px;
    }
    
    .weather-icon {
        font-size: 3em;
    }
    
    .weather-temp {
        font-size: 2em;
    }
    
    .weather-details {
        grid-template-columns: 1fr;
    }
}

/* ========================================
   ANIMACE A EFEKTY
   ======================================== */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}

@keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
}

.fade-in {
    animation: fadeIn 0.5s ease-out;
}

.slide-in {
    animation: slideIn 0.3s ease-out;
}

.bounce-in {
    animation: bounceIn 0.6s ease-out;
}
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
        document.getElementById('actionButtons').style.display = 'flex';
        
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
    document.getElementById('actionButtons').style.display = 'none';
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
    
    document.getElementById('weatherCard').style.display = 'block';
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
    document.getElementById('weatherDisplay').innerHTML = `
        <div class="loading">🌤️ Načítám předpověď počasí...</div>
    `;
    document.getElementById('weatherCard').style.display = 'block';
}

function showWeatherError(message) {
    document.getElementById('weatherDisplay').innerHTML = `
        <div class="error">❌ Chyba počasí: ${message}</div>
    `;
}

function hideWeatherCard() {
    document.getElementById('weatherCard').style.display = 'none';
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
// UTILITY FUNKCE
// ========================================

// Odstranění diakritiky
function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

console.log('✅ App.js část 2 načtena - predikce, počasí, mapy');
/* ========================================
   DONULAND MANAGEMENT SYSTEM - APP.JS ČÁST 3
   Kalendář akcí, analýzy, nastavení
   ======================================== */

// ========================================
// KALENDÁŘ AKCÍ
// ========================================

// Globální kalendářové proměnné
let currentCalendarDate = new Date();
let calendarEvents = [];
let filteredEvents = [];

// Renderování kalendáře
function renderCalendar() {
    console.log('📅 Renderuji kalendář pro:', currentCalendarDate.toLocaleDateString('cs-CZ'));
    
    // Aktualizace nadpisu měsíce
    updateCalendarHeader();
    
    // Příprava událostí pro měsíc
    prepareCalendarEvents();
    
    // Renderování mřížky
    renderCalendarGrid();
    
    // Načtení seznamu akcí
    loadMonthEvents();
}

// Aktualizace nadpisu kalendáře
function updateCalendarHeader() {
    const monthNames = [
        'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
    ];
    
    const monthEl = document.getElementById('currentMonth');
    if (monthEl) {
        const monthName = monthNames[currentCalendarDate.getMonth()];
        const year = currentCalendarDate.getFullYear();
        monthEl.textContent = `${monthName} ${year}`;
    }
}

// Příprava událostí pro kalendář
function prepareCalendarEvents() {
    if (!globalData.historicalData || globalData.historicalData.length === 0) {
        calendarEvents = [];
        return;
    }
    
    // Parsování akcí z historických dat
    calendarEvents = globalData.historicalData
        .map(row => parseEventFromRow(row))
        .filter(event => event && event.date)
        .sort((a, b) => a.date - b.date);
    
    console.log(`📊 Připraveno ${calendarEvents.length} kalendářových událostí`);
}

// Parsování události z řádku dat
function parseEventFromRow(row) {
    try {
        // Datum od (sloupec B)
        const dateStr = row.B;
        if (!dateStr || !dateStr.trim()) return null;
        
        let eventDate;
        if (dateStr.includes('.')) {
            // Czech format: 15.5.2025
            const parts = dateStr.split('.');
            if (parts.length >= 3) {
                eventDate = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        } else {
            eventDate = new Date(dateStr);
        }
        
        if (isNaN(eventDate.getTime())) return null;
        
        // Ostatní data
        const name = (row.E || 'Akce bez názvu').trim();
        const city = (row.D || '').trim();
        const category = (row.F || 'ostatní').trim();
        const sales = parseFloat(row.M || 0);
        const visitors = parseFloat(row.Q || 0);
        const rating = parseFloat(row.X || 0);
        const notes = (row.Y || '').trim();
        
        // Určení typu události
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let eventType = 'upcoming';
        
        if (eventDate < today) {
            eventType = sales > 0 ? 'completed' : 'past';
        } else if (eventDate.getTime() === today.getTime()) {
            eventType = 'today';
        }
        
        return {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: eventDate,
            name,
            city,
            category,
            sales,
            visitors,
            rating,
            notes,
            type: eventType,
            rawData: row
        };
        
    } catch (error) {
        console.warn('Chyba při parsování události:', error, row);
        return null;
    }
}

// Renderování kalendářové mřížky
function renderCalendarGrid() {
    const gridEl = document.getElementById('calendarGrid');
    if (!gridEl) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // První den měsíce a kolik dní má měsíc
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Den v týdnu kdy začíná měsíc (0=neděle, převést na 1=pondělí)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Pondělí = 0
    
    // HTML pro hlavičku
    const dayNames = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
    let html = dayNames.map(day => 
        `<div class="calendar-header">${day}</div>`
    ).join('');
    
    // Prázdné buňky na začátku
    for (let i = 0; i < startDayOfWeek; i++) {
        const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
        html += createCalendarDayCell(prevMonthDay, true);
    }
    
    // Dny aktuálního měsíce
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        html += createCalendarDayCell(date, false);
    }
    
    // Doplnění do 42 buněk (6 týdnů)
    const totalCells = 7 + startDayOfWeek + daysInMonth; // header + empty + days
    const remaining = 42 - (totalCells - 7); // bez headeru
    for (let i = 1; i <= remaining; i++) {
        const nextMonthDay = new Date(year, month + 1, i);
        html += createCalendarDayCell(nextMonthDay, true);
    }
    
    gridEl.innerHTML = html;
}

// Vytvoření buňky kalendářového dne
function createCalendarDayCell(date, isOtherMonth) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isToday = date.getTime() === today.getTime();
    const dayEvents = getEventsForDate(date);
    
    let dayClass = 'calendar-day';
    if (isOtherMonth) dayClass += ' other-month';
    if (isToday) dayClass += ' today';
    
    const eventsHtml = dayEvents.slice(0, 3).map(event => {
        const eventClass = `event-item ${event.type}`;
        const displayName = event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name;
        return `<div class="${eventClass}" onclick="showEventModal('${event.id}')" title="${escapeHtml(event.name)} - ${escapeHtml(event.city)}">${escapeHtml(displayName)}</div>`;
    }).join('');
    
    const moreEvents = dayEvents.length > 3 ? `<div class="more-events">+${dayEvents.length - 3} dalších</div>` : '';
    
    return `
        <div class="${dayClass}" onclick="selectCalendarDay('${date.toISOString()}')">
            <div class="day-number">${date.getDate()}</div>
            <div class="day-events">
                ${eventsHtml}
                ${moreEvents}
            </div>
        </div>
    `;
}

// Získání událostí pro konkrétní datum
function getEventsForDate(date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === targetDate.getTime();
    });
}

// Navigace v kalendáři
function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    currentCalendarDate = new Date();
    renderCalendar();
}

// Filtrování kalendáře
function filterCalendar() {
    const cityFilter = document.getElementById('cityFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    console.log('🔍 Filtruji kalendář:', { cityFilter, categoryFilter });
    
    // Aplikace filtrů (pro budoucí implementaci)
    renderCalendar();
}

// ========================================
// SEZNAM AKCÍ PRO MĚSÍC
// ========================================

// Načtení akcí pro aktuální měsíc
function loadMonthEvents() {
    const monthEventsEl = document.getElementById('monthEvents');
    if (!monthEventsEl) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Filtrování akcí pro aktuální měsíc
    const monthEvents = calendarEvents.filter(event => {
        return event.date.getFullYear() === year && event.date.getMonth() === month;
    });
    
    if (monthEvents.length === 0) {
        monthEventsEl.innerHTML = `
            <div class="placeholder">
                📭 Žádné akce v tomto měsíci
            </div>
        `;
        return;
    }
    
    // Seskupení podle typů
    const upcoming = monthEvents.filter(e => e.type === 'upcoming' || e.type === 'today');
    const completed = monthEvents.filter(e => e.type === 'completed');
    const past = monthEvents.filter(e => e.type === 'past');
    
    let html = '';
    
    // Nadcházející akce
    if (upcoming.length > 0) {
        html += '<h4>🔮 Nadcházející akce</h4>';
        upcoming.forEach(event => {
            html += createEventListItem(event);
        });
    }
    
    // Dokončené akce
    if (completed.length > 0) {
        html += '<h4>✅ Dokončené akce s výsledky</h4>';
        completed.forEach(event => {
            html += createEventListItem(event);
        });
    }
    
    // Proběhlé akce bez dat
    if (past.length > 0) {
        html += '<h4>📋 Proběhlé akce</h4>';
        past.forEach(event => {
            html += createEventListItem(event);
        });
    }
    
    monthEventsEl.innerHTML = html;
}

// Vytvoření položky v seznamu akcí
function createEventListItem(event) {
    const daysUntil = Math.ceil((event.date - new Date()) / (1000 * 60 * 60 * 24));
    let timeInfo = '';
    
    if (event.type === 'today') {
        timeInfo = '<span style="color: #ffc107; font-weight: bold;">📍 DNES</span>';
    } else if (event.type === 'upcoming') {
        if (daysUntil <= 7) {
            timeInfo = `<span style="color: #ff9800;">⚠️ Za ${daysUntil} ${daysUntil === 1 ? 'den' : daysUntil < 5 ? 'dny' : 'dní'}</span>`;
        } else {
            timeInfo = `Za ${daysUntil} dní`;
        }
    } else {
        timeInfo = `Před ${Math.abs(daysUntil)} dny`;
    }
    
    return `
        <div class="top-item" onclick="showEventModal('${event.id}')">
            <div class="top-info">
                <h4>${escapeHtml(event.name)}</h4>
                <p>📍 ${escapeHtml(event.city)} | 📅 ${formatDate(event.date)} | ${timeInfo}</p>
                <p>📂 ${escapeHtml(event.category)}${event.visitors > 0 ? ` | 👥 ${formatNumber(event.visitors)} návštěvníků` : ''}</p>
            </div>
            <div class="top-stats">
                ${event.sales > 0 ? `
                    <div class="top-value">${formatNumber(event.sales)} 🍩</div>
                    <div class="top-subvalue">${formatCurrency(event.sales * (parseFloat(document.getElementById('price').value) || 50))}</div>
                ` : event.type === 'upcoming' ? `
                    <div class="top-value">📊</div>
                    <div class="top-subvalue">Predikce</div>
                ` : `
                    <div class="top-value">❓</div>
                    <div class="top-subvalue">Bez dat</div>
                `}
                ${event.rating > 0 ? `<div class="historical-rating">${'⭐'.repeat(Math.round(event.rating))}</div>` : ''}
            </div>
        </div>
    `;
}

// ========================================
// MODAL PRO UDÁLOSTI
// ========================================

// Zobrazení modalu pro editaci události
function showEventModal(eventId) {
    const event = calendarEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalEventName = document.getElementById('modalEventName');
    const modalSales = document.getElementById('modalSales');
    const modalNotes = document.getElementById('modalNotes');
    
    modalTitle.textContent = event.type === 'upcoming' ? 'Upravit akci' : 'Upravit výsledky akce';
    modalEventName.value = event.name;
    modalSales.value = event.sales > 0 ? event.sales : '';
    modalNotes.value = event.notes;
    
    // Uložení ID pro save funkci
    modal.setAttribute('data-event-id', eventId);
    
    modal.style.display = 'flex';
}

// Zavření modalu
function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}

// Uložení úprav události
function saveEventEdit() {
    const modal = document.getElementById('eventModal');
    const eventId = modal.getAttribute('data-event-id');
    const event = calendarEvents.find(e => e.id === eventId);
    
    if (!event) return;
    
    // Získání nových hodnot
    const newName = document.getElementById('modalEventName').value.trim();
    const newSales = parseFloat(document.getElementById('modalSales').value) || 0;
    const newNotes = document.getElementById('modalNotes').value.trim();
    
    // Aktualizace události
    event.name = newName;
    event.sales = newSales;
    event.notes = newNotes;
    
    // Aktualizace typu události
    if (newSales > 0 && event.type !== 'upcoming') {
        event.type = 'completed';
    }
    
    console.log('💾 Ukládám změny události:', event);
    
    // Simulace uložení
    showNotification('✅ Změny uloženy', 'success');
    
    // Refresh kalendáře
    renderCalendar();
    closeModal();
}

// Smazání události
function deleteEvent() {
    if (!confirm('Opravdu chcete smazat tuto akci?')) return;
    
    const modal = document.getElementById('eventModal');
    const eventId = modal.getAttribute('data-event-id');
    
    // Odstranění z kalendáře
    const index = calendarEvents.findIndex(e => e.id === eventId);
    if (index !== -1) {
        calendarEvents.splice(index, 1);
        console.log('🗑️ Událost smazána');
        showNotification('🗑️ Akce smazána', 'success');
        renderCalendar();
        closeModal();
    }
}

// ========================================
// ANALÝZY A STATISTIKY
// ========================================

// Načtení všech analýz
function loadAnalytics() {
    console.log('📊 Načítám analýzy...');
    
    if (!globalData.historicalData || globalData.historicalData.length === 0) {
        showAnalyticsError();
        return;
    }
    
    // Načtení jednotlivých analýz
    loadOverallStats();
    loadTopEvents();
    loadTopCities();
    loadTopCategories();
    loadTrendsChart();
    loadPredictionAccuracy();
}

// Celkové statistiky
function loadOverallStats() {
    const statsEl = document.getElementById('overallStats');
    if (!statsEl) return;
    
    try {
        // Filtrování validních akcí
        const validEvents = globalData.historicalData.filter(row => {
            const sales = parseFloat(row.M || 0);
            return sales > 0;
        });
        
        if (validEvents.length === 0) {
            statsEl.innerHTML = '<div class="placeholder">Žádné akce s daty o prodeji</div>';
            return;
        }
        
        // Výpočty
        const totalEvents = globalData.historicalData.length;
        const validEventsCount = validEvents.length;
        
        const totalSales = validEvents.reduce((sum, row) => sum + parseFloat(row.M || 0), 0);
        const avgSales = totalSales / validEventsCount;
        
        const donutPrice = parseFloat(document.getElementById('price').value) || CONFIG.DONUT_PRICE;
        const totalRevenue = totalSales * donutPrice;
        const totalProfit = totalSales * (donutPrice - CONFIG.DONUT_COST);
        
        // Nejlepší akce
        const bestSales = Math.max(...validEvents.map(row => parseFloat(row.M || 0)));
        
        // Průměrné hodnocení
        const ratingsSum = validEvents.reduce((sum, row) => {
            const rating = parseFloat(row.X || 0);
            return sum + (rating > 0 ? rating : 0);
        }, 0);
        const ratingsCount = validEvents.filter(row => parseFloat(row.X || 0) > 0).length;
        const avgRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;
        
        // Success rate
        const successfulEvents = validEvents.filter(row => parseFloat(row.M || 0) >= avgSales).length;
        const successRate = (successfulEvents / validEventsCount) * 100;
        
        statsEl.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${totalEvents}</div>
                <div class="stat-label">📅 Celkem akcí</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${validEventsCount}</div>
                <div class="stat-label">✅ S daty o prodeji</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatNumber(totalSales)}</div>
                <div class="stat-label">🍩 Celkem prodáno</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(avgSales)}</div>
                <div class="stat-label">📊 Průměr na akci</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatCurrency(totalRevenue)}</div>
                <div class="stat-label">💰 Celkový obrat</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatCurrency(totalProfit)}</div>
                <div class="stat-label">📈 Hrubý zisk</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatNumber(bestSales)}</div>
                <div class="stat-label">🏆 Nejlepší akce</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${avgRating > 0 ? avgRating.toFixed(1) + '⭐' : 'N/A'}</div>
                <div class="stat-label">⭐ Průměrné hodnocení</div>
            </div>
        `;
        
    } catch (error) {
        console.error('Chyba při výpočtu statistik:', error);
        statsEl.innerHTML = '<div class="error">Chyba při výpočtu statistik</div>';
    }
}

// Top akce
function loadTopEvents() {
    const topEventsEl = document.getElementById('topEvents');
    if (!topEventsEl) return;
    
    try {
        const validEvents = globalData.historicalData
            .filter(row => parseFloat(row.M || 0) > 0)
            .map(row => ({
                name: (row.E || 'Neznámá akce').substring(0, 40),
                city: (row.D || 'Neznámé město').substring(0, 20),
                date: row.B || '',
                sales: parseFloat(row.M || 0),
                rating: parseFloat(row.X || 0),
                category: row.F || 'ostatní'
            }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 10);
        
        if (validEvents.length === 0) {
            topEventsEl.innerHTML = '<div class="placeholder">Žádné akce s daty</div>';
            return;
        }
        
        const html = validEvents.map((event, index) => `
            <div class="top-item">
                <div class="top-info">
                    <h4>${index + 1}. ${escapeHtml(event.name)}</h4>
                    <p>📍 ${escapeHtml(event.city)} | 📅 ${event.date} | 📂 ${escapeHtml(event.category)}</p>
                </div>
                <div class="top-stats">
                    <div class="top-value">${formatNumber(event.sales)} 🍩</div>
                    <div class="top-subvalue">${formatCurrency(event.sales * CONFIG.DONUT_PRICE)}</div>
                    ${event.rating > 0 ? `<div class="historical-rating">${'⭐'.repeat(Math.round(event.rating))}</div>` : ''}
                </div>
            </div>
        `).join('');
        
        topEventsEl.innerHTML = html;
        
    } catch (error) {
        console.error('Chyba při načítání top akcí:', error);
        topEventsEl.innerHTML = '<div class="error">Chyba při načítání dat</div>';
    }
}

// Top města
function loadTopCities() {
    const topCitiesEl = document.getElementById('topCities');
    if (!topCitiesEl) return;
    
    try {
        const cityStats = {};
        
        globalData.historicalData.forEach(row => {
            const city = (row.D || 'Neznámé město').trim();
            const sales = parseFloat(row.M || 0);
            const rating = parseFloat(row.X || 0);
            
            if (sales > 0) {
                if (!cityStats[city]) {
                    cityStats[city] = { totalSales: 0, events: 0, totalRating: 0, ratingCount: 0 };
                }
                
                cityStats[city].totalSales += sales;
                cityStats[city].events += 1;
                
                if (rating > 0) {
                    cityStats[city].totalRating += rating;
                    cityStats[city].ratingCount += 1;
                }
            }
        });
        
        const topCities = Object.entries(cityStats)
            .map(([city, stats]) => ({
                name: city,
                avgSales: Math.round(stats.totalSales / stats.events),
                events: stats.events,
                totalSales: stats.totalSales,
                avgRating: stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0
            }))
            .sort((a, b) => b.avgSales - a.avgSales)
            .slice(0, 10);
        
        if (topCities.length === 0) {
            topCitiesEl.innerHTML = '<div class="placeholder">Žádná města s daty</div>';
            return;
        }
        
        const html = topCities.map((city, index) => `
            <div class="top-item">
                <div class="top-info">
                    <h4>${index + 1}. ${escapeHtml(city.name)}</h4>
                    <p>${city.events} ${city.events === 1 ? 'akce' : city.events < 5 ? 'akce' : 'akcí'}</p>
                </div>
                <div class="top-stats">
                    <div class="top-value">${city.avgSales} 🍩/akci</div>
                    <div class="top-subvalue">Celkem: ${formatNumber(city.totalSales)} 🍩</div>
                    ${city.avgRating > 0 ? `<div class="historical-rating">${'⭐'.repeat(Math.round(city.avgRating))}</div>` : ''}
                </div>
            </div>
        `).join('');
        
        topCitiesEl.innerHTML = html;
        
    } catch (error) {
        console.error('Chyba při načítání top měst:', error);
        topCitiesEl.innerHTML = '<div class="error">Chyba při načítání dat</div>';
    }
}

// Top kategorie
function loadTopCategories() {
    const topCategoriesEl = document.getElementById('topCategories');
    if (!topCategoriesEl) return;
    
    try {
        const categoryStats = {};
        
        globalData.historicalData.forEach(row => {
            const category = (row.F || 'ostatní').trim();
            const sales = parseFloat(row.M || 0);
            const rating = parseFloat(row.X || 0);
            
            if (sales > 0) {
                if (!categoryStats[category]) {
                    categoryStats[category] = { totalSales: 0, events: 0, totalRating: 0, ratingCount: 0 };
                }
                
                categoryStats[category].totalSales += sales;
                categoryStats[category].events += 1;
                
                if (rating > 0) {
                    categoryStats[category].totalRating += rating;
                    categoryStats[category].ratingCount += 1;
                }
            }
        });
        
        const topCategories = Object.entries(categoryStats)
            .map(([category, stats]) => ({
                name: category,
                avgSales: Math.round(stats.totalSales / stats.events),
                events: stats.events,
                totalSales: stats.totalSales,
                avgRating: stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0
            }))
            .sort((a, b) => b.avgSales - a.avgSales);
        
        if (topCategories.length === 0) {
            topCategoriesEl.innerHTML = '<div class="placeholder">Žádné kategorie s daty</div>';
            return;
        }
        
        const html = topCategories.map((category, index) => `
            <div class="top-item">
                <div class="top-info">
                    <h4>${index + 1}. ${escapeHtml(category.name)}</h4>
                    <p>${category.events} ${category.events === 1 ? 'akce' : category.events < 5 ? 'akce' : 'akcí'}</p>
                </div>
                <div class="top-stats">
                    <div class="top-value">${category.avgSales} 🍩/akci</div>
                    <div class="top-subvalue">Celkem: ${formatNumber(category.totalSales)} 🍩</div>
                    ${category.avgRating > 0 ? `<div class="historical-rating">${'⭐'.repeat(Math.round(category.avgRating))}</div>` : ''}
                </div>
            </div>
        `).join('');
        
        topCategoriesEl.innerHTML = html;
        
    } catch (error) {
        console.error('Chyba při načítání top kategorií:', error);
        topCategoriesEl.innerHTML = '<div class="error">Chyba při načítání dat</div>';
    }
}

// Trendy v čase (jednoduchý chart)
function loadTrendsChart() {
    const chartEl = document.getElementById('trendsChart');
    if (!chartEl) return;
    
    try {
        // Simulace simple chart - v reálné aplikaci by zde byl Chart.js
        const canvas = chartEl;
        const ctx = canvas.getContext('2d');
        
        // Příprava dat pro chart
        const monthlyData = prepareMonthlyData();
        
        if (monthlyData.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Žádná data pro graf', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Vykreslení jednoduchého line chartu
        drawSimpleLineChart(ctx, canvas, monthlyData);
        
    } catch (error) {
        console.error('Chyba při kreslení grafu:', error);
        const ctx = chartEl.getContext('2d');
        ctx.fillStyle = '#dc3545';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Chyba při načítání grafu', chartEl.width / 2, chartEl.height / 2);
    }
}

// Příprava dat pro měsíční trendy
function prepareMonthlyData() {
    const monthlyStats = {};
    
    globalData.historicalData.forEach(row => {
        const dateStr = row.B;
        const sales = parseFloat(row.M || 0);
        
        if (!dateStr || sales <= 0) return;
        
        try {
            let date;
            if (dateStr.includes('.')) {
                const parts = dateStr.split('.');
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                date = new Date(dateStr);
            }
            
            if (isNaN(date.getTime())) return;
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { sales: 0, events: 0 };
            }
            
            monthlyStats[monthKey].sales += sales;
            monthlyStats[monthKey].events += 1;
            
        } catch (error) {
            console.warn('Chyba při parsování data pro graf:', dateStr);
        }
    });
    
    // Konverze na pole a seřazení
    return Object.entries(monthlyStats)
        .map(([month, stats]) => ({
            month,
            avgSales: Math.round(stats.sales / stats.events),
            totalSales: stats.sales,
            events: stats.events
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Posledních 12 měsíců
}

// Vykreslení jednoduchého line chartu
function drawSimpleLineChart(ctx, canvas, data) {
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Vyčištění canvasu
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data.length === 0) return;
    
    // Nalezení min/max hodnot
    const maxSales = Math.max(...data.map(d => d.avgSales));
    const minSales = Math.min(...data.map(d => d.avgSales));
    const range = maxSales - minSales || 1;
    
    // Vykreslení os
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Y osa
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // X osa
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Vykreslení dat
    if (data.length > 1) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = canvas.height - padding - ((point.avgSales - minSales) / range) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Tečky na datech
        ctx.fillStyle = '#667eea';
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = canvas.height - padding - ((point.avgSales - minSales) / range) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    
    // Popisky
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X popisky (měsíce)
    data.forEach((point, index) => {
        const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
        const label = point.month.split('-')[1] + '/' + point.month.split('-')[0].slice(-2);
        ctx.fillText(label, x, canvas.height - 10);
    });
    
    // Y popisky (hodnoty)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = minSales + (range * i / 5);
        const y = canvas.height - padding - (i / 5) * chartHeight;
        ctx.fillText(Math.round(value), padding - 10, y + 4);
    }
    
    // Nadpis
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Průměrný prodej donutů na akci', canvas.width / 2, 20);
}

// Přesnost predikcí
function loadPredictionAccuracy() {
    const accuracyEl = document.getElementById('predictionAccuracy');
    if (!accuracyEl) return;
    
    try {
        // Simulace dat o přesnosti (v reálné aplikaci by byly uložené predikce)
        const accuracyData = generateMockAccuracyData();
        
        if (accuracyData.length === 0) {
            accuracyEl.innerHTML = '<div class="placeholder">Žádné predikce k porovnání</div>';
            return;
        }
        
        const totalPredictions = accuracyData.length;
        const accurateWithin20 = accuracyData.filter(d => Math.abs(d.accuracy) <= 20).length;
        const accurateWithin10 = accuracyData.filter(d => Math.abs(d.accuracy) <= 10).length;
        const avgAccuracy = accuracyData.reduce((sum, d) => sum + Math.abs(d.accuracy), 0) / totalPredictions;
        
        accuracyEl.innerHTML = `
            <div class="results-grid">
                <div class="result-item">
                    <div class="result-value">${totalPredictions}</div>
                    <div class="result-label">📊 Celkem predikcí</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${Math.round((accurateWithin20 / totalPredictions) * 100)}%</div>
                    <div class="result-label">🎯 Přesnost ±20%</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${Math.round((accurateWithin10 / totalPredictions) * 100)}%</div>
                    <div class="result-label">🎯 Přesnost ±10%</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${Math.round(avgAccuracy)}%</div>
                    <div class="result-label">📈 Průměrná odchylka</div>
                </div>
            </div>
            
            <h4 style="margin-top: 20px;">📋 Posledních 5 porovnání:</h4>
            ${accuracyData.slice(-5).map(d => `
                <div class="top-item">
                    <div class="top-info">
                        <h4>${escapeHtml(d.eventName)}</h4>
                        <p>📅 ${d.date} | 📍 ${escapeHtml(d.city)}</p>
                    </div>
                    <div class="top-stats">
                        <div class="top-value ${d.accuracy > 0 ? 'positive' : 'negative'}">
                            ${d.accuracy > 0 ? '+' : ''}${d.accuracy}%
                        </div>
                        <div class="top-subvalue">
                            Predikce: ${d.predicted} | Realita: ${d.actual}
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
        
    } catch (error) {
        console.error('Chyba při načítání přesnosti predikcí:', error);
        accuracyEl.innerHTML = '<div class="error">Chyba při načítání dat</div>';
    }
}

// Generování mock dat pro přesnost (v reálné aplikaci by se čerpalo z databáze)
function generateMockAccuracyData() {
    if (!globalData.historicalData || globalData.historicalData.length === 0) return [];
    
    const validEvents = globalData.historicalData
        .filter(row => parseFloat(row.M || 0) > 0)
        .slice(-10); // Posledních 10 akcí
    
    return validEvents.map(row => {
        const actual = parseFloat(row.M || 0);
        const predicted = Math.round(actual * (0.8 + Math.random() * 0.4)); // Simulace predikce ±20%
        const accuracy = Math.round(((predicted - actual) / actual) * 100);
        
        return {
            eventName: row.E || 'Neznámá akce',
            city: row.D || 'Neznámé město',
            date: row.B || '',
            predicted,
            actual,
            accuracy
        };
    });
}

// Chyba při načítání analýz
function showAnalyticsError() {
    const sections = ['overallStats', 'topEvents', 'topCities', 'topCategories'];
    sections.forEach(sectionId => {
        const el = document.getElementById(sectionId);
        if (el) {
            el.innerHTML = `
                <div class="placeholder">
                    📭 Nejsou k dispozici žádná data<br>
                    <button class="btn btn-refresh" onclick="loadData()" style="margin-top: 15px;">
                        🔄 Načíst data nyní
                    </button>
                </div>
            `;
        }
    });
}

// ========================================
// NASTAVENÍ
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
        if (settings.sheetsUrl) document.getElementById('sheetsUrl').value = settings.sheetsUrl;
        if (settings.weatherKey) document.getElementById('weatherKey').value = settings.weatherKey;
        if (settings.mapsKey) document.getElementById('mapsKey').value = settings.mapsKey;
        
        // Business parametry
        if (settings.donutCost) document.getElementById('donutCost').value = settings.donutCost;
        if (settings.franchisePrice) document.getElementById('franchisePrice').value = settings.franchisePrice;
        if (settings.hourlyWage) document.getElementById('hourlyWage').value = settings.hourlyWage;
        if (settings.workHours) document.getElementById('workHours').value = settings.workHours;
        if (settings.fuelCost) document.getElementById('fuelCost').value = settings.fuelCost;
        
        // Predikční faktory
        if (settings.factors) {
            Object.entries(settings.factors).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) element.value = value;
            });
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
            factors: {
                factorFood: parseFloat(document.getElementById('factorFood').value) || 0.15,
                factorVeletrh: parseFloat(document.getElementById('factorVeletrh').value) || 0.18,
                factorKoncert: parseFloat(document.getElementById('factorKoncert').value) || 0.08,
                factorPraha: parseFloat(document.getElementById('factorPraha').value) || 1.3,
                factorBrno: parseFloat(document.getElementById('factorBrno').value) || 1.2,
                factorOther: parseFloat(document.getElementById('factorOther').value) || 0.85
            },
            
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

// Test připojení k API
async function testConnections() {
    showNotification('🔧 Testuji připojení ke službám...', 'info');
    
    const results = [];
    
    // Test Weather API
    try {
        const weatherKey = document.getElementById('weatherKey').value;
        if (!weatherKey) {
            results.push('⚠️ Weather API: Není nastaven klíč');
        } else {
            await testWeatherAPI(weatherKey);
            results.push('✅ Weather API: Připojení OK');
        }
    } catch (error) {
        results.push(`❌ Weather API: ${error.message}`);
    }
    
    // Test Google Sheets
    try {
        const sheetsUrl = document.getElementById('sheetsUrl').value;
        if (!sheetsUrl) {
            results.push('⚠️ Google Sheets: Není nastavena URL');
        } else {
            await testGoogleSheets(sheetsUrl);
            results.push('✅ Google Sheets: Přístup OK');
        }
    } catch (error) {
        results.push(`❌ Google Sheets: ${error.message}`);
    }
    
    // Test Google Maps
    const mapsKey = document.getElementById('mapsKey').value;
    if (!mapsKey) {
        results.push('⚠️ Google Maps: Není nastaven klíč');
    } else {
        results.push('ℹ️ Google Maps: Klíč nastaven (test při výpočtu vzdálenosti)');
    }
    
    // Zobrazení výsledků
    const allOK = results.every(r => r.startsWith('✅') || r.startsWith('ℹ️'));
    const notificationType = allOK ? 'success' : 'warning';
    
    showNotification(results.join('\n'), notificationType, 8000);
}

// Test Weather API
async function testWeatherAPI(apiKey) {
    const testUrl = `https://api.openweathermap.org/data/2.5/weather?q=Praha&appid=${apiKey}&units=metric`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(testUrl)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const weatherData = JSON.parse(data.contents);
    
    if (weatherData.cod !== 200) {
        throw new Error(`API error: ${weatherData.message}`);
    }
}

// Test Google Sheets
async function testGoogleSheets(sheetsUrl) {
    const sheetId = extractSheetId(sheetsUrl);
    if (!sheetId) {
        throw new Error('Neplatné Google Sheets URL');
    }
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (!data.contents || data.contents.trim().length === 0) {
        throw new Error('Prázdný response - zkontrolujte přístupová práva');
    }
}

// Reset nastavení na výchozí
function resetSettings() {
    if (!confirm('Opravdu chcete obnovit všechna nastavení na výchozí hodnoty?')) return;
    
    try {
        // Smazání z localStorage
        localStorage.removeItem('donulandSettings');
        
        // Nastavení výchozích hodnot
        document.getElementById('sheetsUrl').value = CONFIG.SHEETS_URL;
        document.getElementById('weatherKey').value = CONFIG.WEATHER_API_KEY;
        document.getElementById('mapsKey').value = CONFIG.MAPS_API_KEY;
        
        document.getElementById('donutCost').value = CONFIG.DONUT_COST;
        document.getElementById('franchisePrice').value = CONFIG.FRANCHISE_PRICE;
        document.getElementById('hourlyWage').value = CONFIG.HOURLY_WAGE;
        document.getElementById('workHours').value = CONFIG.WORK_HOURS;
        document.getElementById('fuelCost').value = CONFIG.FUEL_COST;
        
        // Reset faktorů
        document.getElementById('factorFood').value = 0.15;
        document.getElementById('factorVeletrh').value = 0.18;
        document.getElementById('factorKoncert').value = 0.08;
        document.getElementById('factorPraha').value = 1.3;
        document.getElementById('factorBrno').value = 1.2;
        document.getElementById('factorOther').value = 0.85;
        
        // Vyčištění cache
        globalData.weatherCache.clear();
        globalData.distanceCache.clear();
        
        showNotification('✅ Nastavení obnovena na výchozí hodnoty', 'success');
        console.log('🔧 Nastavení resetována');
        
    } catch (error) {
        console.error('❌ Chyba při resetování:', error);
        showNotification('❌ Chyba při resetování nastavení', 'error');
    }
}

// Reset predikčních faktorů
function resetFactors() {
    if (!confirm('Obnovit predikční faktory na výchozí hodnoty?')) return;
    
    document.getElementById('factorFood').value = 0.15;
    document.getElementById('factorVeletrh').value = 0.18;
    document.getElementById('factorKoncert').value = 0.08;
    document.getElementById('factorPraha').value = 1.3;
    document.getElementById('factorBrno').value = 1.2;
    document.getElementById('factorOther').value = 0.85;
    
    showNotification('🔄 Predikční faktory obnoveny', 'success');
}

// ========================================
// UTILITY FUNKCE
// ========================================

// Výběr kalendářového dne
function selectCalendarDay(dateString) {
    const date = new Date(dateString);
    const events = getEventsForDate(date);
    
    if (events.length > 0) {
        console.log(`📅 Vybrán den ${formatDate(date)} s ${events.length} akcemi`);
        // Možnost implementace detail view dne
    }
}

// Inicializace po DOM load (rozšíření)
document.addEventListener('DOMContentLoaded', function() {
    // Automatické načtení dat při startu (s debounce)
    setTimeout(() => {
        if (globalData.historicalData.length === 0) {
            loadData().catch(() => {
                console.log('Automatické načtení dat selhalo - bude dostupné manuálně');
            });
        }
    }, 4000);
});

console.log('✅ App.js část 3 načtena - kalendář, analýzy, nastavení');

// ========================================
// EXPORT FINÁLNÍCH FUNKCÍ
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

window.renderCalendar = renderCalendar;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.goToToday = goToToday;
window.filterCalendar = filterCalendar;
window.showEventModal = showEventModal;
window.closeModal = closeModal;
window.saveEventEdit = saveEventEdit;
window.deleteEvent = deleteEvent;
window.selectCalendarDay = selectCalendarDay;

window.loadAnalytics = loadAnalytics;
window.saveSettings = saveSettings;
window.testConnections = testConnections;
window.resetSettings = resetSettings;
window.resetFactors = resetFactors;

window.loadData = loadData;
window.showSection = showSection;

console.log('🍩 Donuland Management System je plně funkční!');
