// === DASHBOARD MASTER FILE ===
// This file imports all dashboard modules in the correct order

// 1. Charts (Must load first - provides chart rendering functions)
import './dashboard.charts.js';

// 2. Analytics (Depends on chart functions)
import './dashboard.analytics.js';

// 3. Discipline (Depends on analytics data)
import './dashboard.discipline.js';

// 4. Filters (Depends on analytics functions)
import './dashboard.filters.js';

// 5. Sessions (Depends on filter data)
import './dashboard.sessions.js';

// 6. Controller (Must load LAST - orchestrates everything)
import './dashboard.controller.js';

console.log('✅ Dashboard modules loaded');