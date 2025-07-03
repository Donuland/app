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
