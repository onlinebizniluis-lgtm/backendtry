// === MODULES MASTER FILE ===
// This file imports all feature modules in the correct order

// 1. Dashboard (Must load first - provides analytics and charts)
import './dashboard/dashboard.js';

// 2. Terminal (Depends on dashboard data)
import './terminal/terminal.js';

// 3. System Tab (Depends on terminal functions)
import './systemTab/system.js';

// 4. Calculator (Independent module)
import './calculator/calculator.js';

// 5. Debriefs (Depends on system data)
import './debriefs/debriefs.js';

// 6. Inbox (Depends on terminal and system data)
import './inbox/inbox.js';

console.log('✅ All modules loaded');