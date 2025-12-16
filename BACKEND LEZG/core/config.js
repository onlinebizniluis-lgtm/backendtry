// --- config.js ---

// 1. IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


// 2. CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyA44ovpUePULzQ_eD47qeg2de15PpDfjac",
    authDomain: "trading-journal-efe82.firebaseapp.com",
    projectId: "trading-journal-efe82",
    storageBucket: "trading-journal-efe82.firebasestorage.app",
    messagingSenderId: "202606837086",
    appId: "1:202606837086:web:6d453ac1be62ac8d0863cf",
    measurementId: "G-RJQ2F6CWNH",
};

const AI_API_URL = "https://tradingos-tradingos-clip.hf.space/predict";

// 3. INITIALIZE FIREBASE (Right here, right now)
let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ Firebase Initialized in Config");
} catch (e) {
    console.error("❌ Firebase Init Failed:", e);
}

// 4. ATTACH TO WINDOW (Make them Global)
window.app = app;
window.auth = auth;
window.db = db;
window.doc = doc;
window.setDoc = setDoc;
window.firebaseConfig = firebaseConfig;
window.AI_API_URL = AI_API_URL;

// 5. GLOBAL STATE VARIABLES (Attached to window)
window.currentUser = null;
window.currentPortfolioId = null;
window.allTrades = [];
window.checklistData = {};
window.systemData = {};
window.weeklyData = { history: [] };
window.timerInterval = null;
window.isDemo = false;

window.logViewMode = "list";
window.logViewRange = "all";
window.logCalDate = new Date();
window.dashRangeCount = "all";

window.playbookData = [];
window.currentArsenalFilter = "all";
window.currentPlaybookFilter = "all";

window.inboxItems = [];
window.inboxFilter = "all";

window.playerXP = 0;
window.playerLevel = 1;
window.currentBounty = "LOADING...";
window.strategyTags = [];

window.dashFilterState = {
    mode: "all",
    days: 0,
    start: null,
    end: null,
};