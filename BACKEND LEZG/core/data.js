//data
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

window.loadSandboxData = function() {
    const d = new Date();
    const fmt = (offset) => {
      const n = new Date(d);
      n.setDate(d.getDate() - offset);
      return n.toISOString().split("T")[0];
    };

    allTrades = [
      {
        id: 101,
        date: fmt(10),
        pair: "EURUSD",
        sess: "NY",
        setup: "Breakout",
        res: "WIN",
        rr: "2.5",
        score: "5",
        discipline: "100",
        notes: "Perfect retest of weekly high.",
      },
      {
        id: 102,
        date: fmt(9),
        pair: "GBPJPY",
        sess: "LDN",
        setup: "Reversal",
        res: "LOSS",
        rr: "-1",
        score: "3",
        discipline: "80",
        notes: "Entered too early, FOMO.",
      },
      {
        id: 103,
        date: fmt(8),
        pair: "XAUUSD",
        sess: "NY",
        setup: "Pullback",
        res: "WIN",
        rr: "3.2",
        score: "5",
        discipline: "100",
        notes: "Gold respecting the 50EMA.",
      },
      {
        id: 104,
        date: fmt(7),
        pair: "EURUSD",
        sess: "ASIA",
        setup: "Range",
        res: "BE",
        rr: "0",
        score: "4",
        discipline: "90",
        notes: "Moved to BE before news.",
      },
      {
        id: 105,
        date: fmt(6),
        pair: "US30",
        sess: "NY",
        setup: "Breakout",
        res: "WIN",
        rr: "1.8",
        score: "4",
        discipline: "100",
        notes: "Quick scalp on open.",
      },
      {
        id: 106,
        date: fmt(5),
        pair: "GBPJPY",
        sess: "LDN",
        setup: "Breakout",
        res: "WIN",
        rr: "2.0",
        score: "5",
        discipline: "100",
        notes: "Clean breakout.",
      },
      {
        id: 107,
        date: fmt(2),
        pair: "BTCUSD",
        sess: "NY",
        setup: "Reversal",
        res: "LOSS",
        rr: "-1",
        score: "2",
        discipline: "50",
        notes: "Revenge trade attempt.",
      },
    ];

    systemData = {
      s_style: "Intraday Scalping",
      s_pairs: "EURUSD, GBPJPY, XAUUSD",
      s_setups: "Breakout, Reversal, Range",
      s_risk: "1.0",
      s_max_loss: "3",
    };

    playbookData = [
      {
        id: 1,
        section: "entry",
        title: "Break & Retest",
        desc: "Wait for a clean break of the level, then a retest with rejection wicks.",
        pairs: "EURUSD, GBPJPY",
        link: "",
      },
      {
        id: 2,
        section: "entry",
        title: "Supply Zone Rejection",
        desc: "HTF Supply zone. Look for M15 shift in structure.",
        pairs: "XAUUSD",
        link: "https://images.unsplash.com/photo-1611974765270-ca1258634369?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      },
      {
        id: 3,
        section: "conditions",
        title: "No High Impact News",
        desc: "Do not enter 15 mins before/after Red Folder news.",
        pairs: "ALL",
        link: "",
      },
      {
        id: 4,
        section: "mistakes",
        title: "FOMO Chasing",
        desc: "Never enter if the move has already gone > 10 pips from the level.",
        pairs: "ALL",
        link: "",
      },
      {
        id: 5,
        section: "patterns",
        title: "Double Top",
        desc: "Classic reversal pattern at key resistance.",
        pairs: "US30",
        link: "",
      },
    ];

    weeklyData = {
      current_focus: "WAIT FOR CANDLE CLOSE",
      next_unlock: Date.now() + 86400000,
      history: [
        {
          date: fmt(1),
          win: "Held the Gold runner to TP.",
          err: "Revenge traded on Tuesday.",
          focus: "Patience at key levels.",
        },
      ],
    };

    renderAll();
    sysNotify("SANDBOX DATA LOADED", "success");
  }


window.loadData = async function() {
    if (!currentUser || !currentPortfolioId) return;

    // 1. CLEAR GLOBAL VARIABLES (Reset state)
    allTrades = [];
    checklistData = {};
    systemData = {};
    weeklyData = { history: [] };
    window.plannedTrades = [];
    window.openTrades = [];
    playbookData = [];

    // 2. FORCE IMMEDIATE UI CLEAR (The Fix)
    // This wipes the tables/charts INSTANTLY so you don't see old data while loading
    renderAll();

    // ✅ NEW: Load inbox and start expiration checker
    loadInbox();
    checkPlanExpirations();

    el("loader").style.display = "flex";
    const root = `users/${currentUser.uid}/portfolios/${currentPortfolioId}/features`;

    // 3. LOAD JOURNAL
    try {
      const journalSnap = await getDoc(doc(db, root, "journal"));
      if (journalSnap.exists()) {
        const d = journalSnap.data();
        allTrades = d.list || [];
        checklistData = d.chk || {};
      }
    } catch (e) {
      console.error("Journal Load Error", e);
    }

    // 4. LOAD SYSTEM CONFIG
    try {
      const sysSnap = await getDoc(doc(db, root, "system"));
      if (sysSnap.exists()) systemData = sysSnap.data();
    } catch (e) {
      console.error("System Load Error", e);
    }

    // 5. LOAD WEEKLY REVIEW
    try {
      const weekSnap = await getDoc(doc(db, root, "weekly"));
      if (weekSnap.exists()) weeklyData = weekSnap.data();
    } catch (e) {
      console.error("Weekly Load Error", e);
    }

    // 6. LOAD PLAYBOOK
    try {
      const pbSnap = await getDocs(
        collection(
          db,
          "users",
          currentUser.uid,
          "portfolios",
          currentPortfolioId,
          "playbook",
        ),
      );
      if (!pbSnap.empty) {
        pbSnap.forEach((doc) =>
          playbookData.push({ id: doc.id, ...doc.data() }),
        );
      }
    } catch (e) {
      console.error("Playbook Load Error", e);
    }

    // 7. LOAD PLANS
    try {
      const planSnap = await getDoc(doc(db, root, "tradePlans"));
      if (planSnap.exists()) {
        window.plannedTrades = planSnap.data().list || [];
      }
    } catch (e) {
      console.error("Plans Load Error", e);
    }

    // 8. LOAD OPEN TRADES
    try {
      const openSnap = await getDoc(doc(db, root, "openTrades"));
      if (openSnap.exists()) {
        window.openTrades = openSnap.data().list || [];
      }
    } catch (e) {
      console.error("Open Trades Load Error", e);
    }

    // 9. FINAL RENDER (Show the new data)
    renderAll();

    el("loader").style.display = "none";
    sysNotify(`SYNC COMPLETE: ${allTrades.length} LOGS`, "success");
  }

window.saveData = async function(type) {
    if (!currentUser) return sysNotify("SAVE FAILED: NOT LOGGED IN", "error");
    if (!currentPortfolioId)
      return sysNotify("SAVE FAILED: NO PORTFOLIO LINKED", "error");

    if (isDemo) {
      // ✅ Fixed quote here
      console.log("ℹ️ Demo Mode: Data saved to memory only.");
      return;
    }

    const loader = el("loader");
    if (loader) loader.style.display = "flex";

    try {
      const root = `users/${currentUser.uid}/portfolios/${currentPortfolioId}/features`;
      console.log(`💾 SAVING [${type}] TO: ${root}`);

      if (type === "journal") {
        if (!Array.isArray(allTrades)) allTrades = [];
        await setDoc(doc(db, root, "journal"), {
          list: allTrades,
          chk: checklistData || {},
        });
      }

      if (type === "system")
        await setDoc(doc(db, root, "system"), systemData || {});
      if (type === "weekly")
        await setDoc(doc(db, root, "weekly"), weeklyData || {});
      if (type === "plans")
        await setDoc(doc(db, root, "tradePlans"), {
          list: window.plannedTrades || [],
        });
      if (type === "openTrades")
        await setDoc(doc(db, root, "openTrades"), {
          list: window.openTrades || [],
        });
    } catch (e) {
      console.error("❌ CRITICAL SAVE ERROR:", e);
      sysNotify("DATABASE ERROR: " + e.code, "error");
    }

    if (loader) loader.style.display = "none";
  }