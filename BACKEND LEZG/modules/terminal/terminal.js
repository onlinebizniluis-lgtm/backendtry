// =========================
// MASTER APP ENTRY POINT
// =========================

// ---------- CORE ----------
import "./core/init.js";

// ---------- UI GLOBALS ----------
import "./ui/media.js";

// ---------- PLANNING MODULE ----------
import "./modules/planning/logic.js";
import "./modules/planning/ui.js";
import "./modules/planning/view.js";

// ---------- EXECUTION MODULE ----------
import "./modules/execution/actions.js";
import "./modules/execution/forms.js";
import "./modules/execution/selector.js";

// ---------- TRADES MODULE ----------
import "./modules/trades/actions.js";
import "./modules/trades/details.js";
import "./modules/trades/view.js";
