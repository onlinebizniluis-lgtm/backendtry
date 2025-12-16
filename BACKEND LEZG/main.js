//main
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


  // --- NEW: SMART DEFAULTS ---
  function setSmartSession() {
    const h = new Date().getUTCHours();
    const sessInput = document.querySelector('[data-key="j_sess"]');
    if (sessInput) {
      if (h >= 8 && h < 13) sessInput.value = "LDN";
      else if (h >= 13 && h < 22) sessInput.value = "NY";
      else sessInput.value = "ASIA";
    }
  }
  // Call on load
  setTimeout(setSmartSession, 1000);

    document.getElementById("trading-os-root").addEventListener("change", (e) => {
    if (e.target.dataset.key === "j_res") {
      const val = e.target.value,
        rr = document.querySelector('.inp-std[data-key="j_rr"]');
      if (val === "LOSS") {
        rr.value = "-1";
        rr.disabled = true;
        rr.style.opacity = "0.5";
      } else if (val === "BE") {
        rr.value = "0";
        rr.disabled = true;
      } else {
        rr.disabled = false;
        rr.style.opacity = "1";
        if (rr.value === "-1" || rr.value === "0") rr.value = "";
      }
    }
  });


    document.getElementById("trading-os-root").addEventListener("input", (e) => {
    if (e.target.id === "filter-pair" || e.target.id === "filter-res")
      renderLogbook();
  });


window.renderAll = function() {
    renderLogbook();
    updateChecklistUI();

    // updateDashboard calls updateDisciplineMeter internally using Closed Trades
    updateDashboard();

    updateSystemUI();
    updateWeeklyUI();
    checkKillSwitch();
    updateSetupDropdown();
    renderPlaybook();
    renderOpenTrades();

    // Render planned trades only for logged-in users
    if (currentUser && currentUser.uid !== "guest" && currentPortfolioId) {
      renderPlannedTrades();
    }
  }
window.resetUI = function() {
    allTrades = [];
    checklistData = {};
    systemData = {};
    weeklyData = { history: [] };
    playbookData = [];

    // ✅ Destroy Chart Instance on Reset
    if (equityChart) {
      equityChart.remove();
      equityChart = null;
      equitySeries = null;
    }

    renderAll();
  }

  // --- POPULATE ALL STRATEGY DROPDOWNS ---
window.updateSetupDropdown = function() {
    // 1. Get Strategies from System Data
    const setupsRaw =
      systemData && systemData["s_setups"]
        ? systemData["s_setups"]
        : "Breakout\nReversal\nTrend";
    let setupList = [];

    // Handle newlines or commas cleanly
    if (setupsRaw.includes("\n")) {
      setupList = setupsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else {
      setupList = setupsRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    // 2. Generate HTML Options
    const optionsHTML = setupList
      .map((s) => `<option value="${s}">${s}</option>`)
      .join("");

    // 3. ALL TARGET DROPDOWNS (expanded list)
    const targets = [
      "term-setup-select", // Terminal tab
      "plan_setup", // Planning modal
      "execution_strategy", // Execution modal
      "j_setup", // ← THIS WAS MISSING (Trade Entry by data-key)
    ];

    // Update ALL dropdowns
    targets.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML =
          '<option value="">-- Select Setup --</option>' + optionsHTML;
      }
    });

    // Also update by selector (backup method)
    document.querySelectorAll('select[data-key="j_setup"]').forEach((el) => {
      el.innerHTML =
        '<option value="">-- Select Setup --</option>' + optionsHTML;
    });
  }

    // Helper: get next Monday 00:00 for Global Parameters unlock
  function getNextSystemUnlock() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

    // Days until *next* Monday (if today is Monday, jump 7 days ahead)
    let daysUntilMon = (1 - day + 7) % 7;
    if (daysUntilMon === 0) daysUntilMon = 7;

    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMon);
    next.setHours(0, 0, 0, 0);
    return next.getTime();
  }

window.checkKillSwitch = function() {
    const lim = parseInt(systemData["s_max_loss"]);
    const today = new Date().toLocaleDateString("en-CA");
    const losses = allTrades.filter(
      (t) => t.date === today && t.res === "LOSS",
    ).length;
    el("loss-counter").innerText = `LOSS: ${losses} / ${lim || "-"}`;
    el("loss-counter").style.color =
      lim && losses >= lim - 1 ? "var(--error)" : "var(--text-dim)";
    if (lim && losses >= lim) {
      el("ks-overlay").style.display = "flex";
      playSound("error");
      if (!timerInterval)
        timerInterval = setInterval(() => {
          const n = new Date(),
            e = new Date(n);
          e.setHours(24, 0, 0, 0);
          const d = e - n;
          el("ks-timer").innerText =
            `${Math.floor(d / 3600000)}:${Math.floor((d % 3600000) / 60000)}:${Math.floor((d % 60000) / 1000)}`;
        }, 1000);
    } else {
      el("ks-overlay").style.display = "none";
    }
  }

    // Find your existing updateSystemUI function and add initStrategyBuilder() to the end of it.
  const _oldUpdateSys = updateSystemUI;
  updateSystemUI = function (lock) {
    if (_oldUpdateSys) _oldUpdateSys(lock);
    initStrategyBuilder(); // <--- INJECT BUILDER LOAD
  };

    window.initEntrySearch = function() {
    const search = document.getElementById("entry-pair");
    const dropdown = document.getElementById("entry-pair-results");
    if (!search) return;

    // EXPANDED LIST
    const assets = [
      { s: "EURUSD" },
      { s: "GBPUSD" },
      { s: "AUDUSD" },
      { s: "NZDUSD" },
      { s: "USDCAD" },
      { s: "USDCHF" },
      { s: "USDJPY" },
      { s: "EURGBP" },
      { s: "EURJPY" },
      { s: "EURAUD" },
      { s: "EURNZD" },
      { s: "EURCAD" },
      { s: "EURCHF" },
      { s: "GBPJPY" },
      { s: "GBPAUD" },
      { s: "GBPNZD" },
      { s: "GBPCAD" },
      { s: "GBPCHF" },
      { s: "AUDJPY" },
      { s: "NZDJPY" },
      { s: "CADJPY" },
      { s: "CHFJPY" },
      { s: "AUDNZD" },
      { s: "AUDCAD" },
      { s: "AUDCHF" },
      { s: "NZDCAD" },
      { s: "NZDCHF" },
      { s: "CADCHF" },
      { s: "XAUUSD" },
      { s: "XAGUSD" },
      { s: "US30" },
      { s: "NAS100" },
      { s: "SPX500" },
      { s: "GER30" },
      { s: "BTCUSD" },
      { s: "ETHUSD" },
      { s: "SOLUSD" },
      { s: "XRPUSD" },
    ];

    search.addEventListener("input", (e) => {
      const term = e.target.value.toUpperCase();
      dropdown.innerHTML = "";
      if (term.length < 1) {
        dropdown.style.display = "none";
        return;
      }

      const matches = assets.filter((a) => a.s.includes(term));
      if (matches.length > 0) {
        dropdown.style.display = "block";
        matches.forEach((m) => {
          const div = document.createElement("div");
          div.className = "search-item";
          div.innerText = m.s;
          div.onclick = () => {
            search.value = m.s;
            dropdown.style.display = "none";
          };
          dropdown.appendChild(div);
        });
      } else {
        dropdown.style.display = "none";
      }
    });

    document.addEventListener("click", (e) => {
      if (!search.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }

    window.addEventListener("DOMContentLoaded", () => {
    const checklist = document.getElementById("checklist-module");
    const targetChecklist = document.getElementById("tab-checklist");

    if (checklist && targetChecklist) {
      targetChecklist.appendChild(checklist);
    }
  });
  
  const tabs = document.querySelectorAll(".plan-tab");
  const sections = document.querySelectorAll(".plan-section"); // <--- ADD THIS LINE
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));

      // Activate clicked tab
      tab.classList.add("active");

      // Hide all sections
      sections.forEach((sec) => sec.classList.remove("active"));

      // Show the matching content based on data attribute
      const sectionID = tab.dataset.section;
      const targetSection = document.querySelector(`#tab-${sectionID}`);

      if (targetSection) {
        targetSection.classList.add("active");
      }
    });
  });

    setInterval(() => {
    if (currentUser && currentPortfolioId && !isDemo) {
      checkPlanExpirations();
    }
  }, 60000);

    document.getElementById("trading-os-root").addEventListener("click", async (e) => {
      const btn = e.target.closest("button"),
        input = e.target.closest("input"),
        tag = e.target.closest(".status-tag");
      if (input && input.id === "j_date_display") {
        const date = await openCalendar();
        if (date) input.value = date;
      }
      if (btn) playSound("hover");

      if (btn && btn.id === "view-list") {
        logViewMode = "list";
        el("view-list").classList.add("active");
        el("view-cal").classList.remove("active");
        renderLogbook();
      }
      if (btn && btn.id === "view-cal") {
        logViewMode = "cal";
        el("view-cal").classList.add("active");
        el("view-list").classList.remove("active");
        renderLogbook();
      }
      if (btn && btn.dataset.range) {
        document
          .querySelectorAll("[data-range]")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        logViewRange = btn.dataset.range;
        renderLogbook();
      }
      if (btn && btn.id === "log-cal-prev") {
        logCalDate.setMonth(logCalDate.getMonth() - 1);
        renderLogbook();
      }
      if (btn && btn.id === "log-cal-next") {
        logCalDate.setMonth(logCalDate.getMonth() + 1);
        renderLogbook();
      }

      if (
        tag &&
        tag.id === "params-status" &&
        tag.classList.contains("locked")
      ) {
        if (
          await sysConfirm("SYSTEM OVERRIDE", "Force unlock Strategy Settings?")
        ) {
          document
            .querySelectorAll(".sys-inp")
            .forEach((i) => (i.disabled = false));
          el("params-overlay").style.display = "none";
          tag.classList.remove("locked");
          tag.innerText = "UNLOCKED";
          sysNotify("PROTOCOL OVERRIDDEN", "success");
        }
      }
      if (
        tag &&
        tag.id === "weekly-status" &&
        tag.classList.contains("locked")
      ) {
        if (
          await sysConfirm("SYSTEM OVERRIDE", "Unlock Weekly Review early?")
        ) {
          document
            .querySelectorAll(".wk-inp")
            .forEach((i) => (i.disabled = false));
          el("weekly-overlay").style.display = "none";
          tag.classList.remove("locked");
          tag.innerText = "UNLOCKED";
          sysNotify("PROTOCOL OVERRIDDEN", "success");
        }
      }

      if (!btn) return;
      const id = btn.id;

if (id === "btn-login") {
    const emailVal = el("inp-email").value.trim();
    const passVal = el("inp-pass").value.trim();

    // 1. Validate Inputs locally first
    if (!emailVal || !passVal) {
        playSound("error");
        sysNotify("ENTER EMAIL AND PASSWORD", "error");
        return;
    }

    msg.innerText = "VERIFYING...";
    
    try {
        await signInWithEmailAndPassword(
            auth,
            emailVal,
            passVal
        );
        // Success is handled by onAuthStateChanged listener
    } catch (err) {
        console.error("Login Failed:", err);
        msg.innerText = "ACCESS DENIED";
        
        // Give specific feedback
        if(err.code === "auth/wrong-password") sysNotify("INVALID PASSWORD", "error");
        else if(err.code === "auth/user-not-found") sysNotify("USER NOT FOUND", "error");
        else if(err.code === "auth/invalid-email") sysNotify("INVALID EMAIL FORMAT", "error");
        else sysNotify("LOGIN FAILED", "error");
        
        playSound("error");
    }
}

      // PORTFOLIO BRIDGE EVENTS
      if (id === "btn-create-port") createPortfolio();
      if (id === "btn-logout-bridge") {
        signOut(auth);
        location.reload();
      }

      // 1. OPEN BRIDGE (Switch Portfolio)
      if (id === "btn-switch-port") {
        if (!currentUser || currentUser.uid === "guest" || isDemo) {
          playSound("error");
          sysNotify(
            "LOGIN REQUIRED — Portfolio switching is unavailable in guest mode.",
            "error",
          );
          return;
        }
        el("app-shell").style.display = "none";
        initBridge();
      }

      // 2. RETURN TO DASHBOARD (Cancel Switch)
      if (id === "btn-back-bridge") {
        // Only return if we actually have a portfolio loaded in memory
        if (currentPortfolioId) {
          el("portfolio-bridge").style.display = "none";
          el("app-shell").style.display = "flex";
          playSound("cancel"); // Optional audio feedback
        } else {
          sysNotify("NO PORTFOLIO ACTIVE", "error");
          initBridge(); // Force stay on bridge if state is lost
        }
      }
      if (id === "btn-guest") {
        // RUN BOOTLOADER
        playBootSequence(() => {
          isDemo = true;
          currentUser = { uid: "guest" };
          el("auth-module").style.display = "none";
          el("app-shell").style.display = "flex";
          el("active-port-name").innerText = "GUEST MODE (SANDBOX)";
          loadSandboxData();
          updateSystemUI();
          updateWeeklyUI();

          // ✅ FIX 1
          el("j_date_display").value = getLocalDate();
          el("date-display").innerText = getLocalDate(); // Also fix the top bar

          playSound("win");
        });
      }
      if (id === "btn-logout") {
        signOut(auth);
        location.reload();
      }
      if (btn.classList.contains("nav-btn") && id !== "btn-logout") {
        document
          .querySelectorAll(".nav-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".view-section").forEach((s) => {
          s.style.display = "none";
          s.classList.remove("active");
        });
        const target = el(btn.dataset.target);
        if (target) {
          target.style.display = "block";
          target.classList.add("active");
        }
      }

      if (btn.classList.contains("tgl-btn")) {
        checklistData[btn.parentElement.dataset.key] = btn.dataset.val;
        saveData("journal");
        updateChecklistUI();
      }
      if (id === "btn-reset-chk") {
        checklistData = {};
        saveData("journal");
        updateChecklistUI();
        sysNotify("PROTOCOLS RESET", "info");
      }

      // FIND THIS SECTION IN YOUR SCRIPT (approx line 2150) AND REPLACE IT:

      if (id === "btn-save-trade") {
        // 1. Define Helper to get values
        const getVal = (k) => {
          const i = document.querySelector(`[data-key="${k}"]`);
          return i ? i.value.trim() : "";
        };

        // 2. Define Required Keys based on Mode
        let requiredKeys =
          window.planningMode === true
            ? ["j_pair", "j_sess", "j_setup", "j_date", "j_direction"]
            : [
                "j_pair",
                "j_sess",
                "j_setup",
                "j_date",
                "j_res",
                "j_rr",
                "j_direction",
              ];

        // 3. ENHANCED VALIDATION LOGIC
        let errorField = null;
        let errorName = "";

        for (const k of requiredKeys) {
          // Find element by data-key (e.g., j_pair) or ID (fallback)
          const el =
            document.querySelector(`[data-key="${k}"]`) ||
            document.getElementById(k);

          // Skip check if element doesn't exist or is hidden via CSS
          if (!el || el.offsetParent === null) continue;

          let isInvalid = false;

          // Check Select Dropdowns
          if (el.tagName === "SELECT") {
            if (
              el.selectedIndex === 0 ||
              el.value === "" ||
              el.value === "SELECT"
            )
              isInvalid = true;
          }
          // Check Inputs/Textareas
          else if (!el.value.trim()) {
            isInvalid = true;
          }

          if (isInvalid) {
            errorField = el;
            // Try to find the label text for the error message
            const label = el.closest(".f-group")?.querySelector("label");
            errorName = label ? label.innerText : k.toUpperCase();
            break; // Stop at the first error
          }
        }

        // 4. IF ERROR FOUND: VISUAL FEEDBACK
        if (errorField) {
          playSound("error");

          // Highlight the field red
          errorField.style.borderColor = "var(--error)";
          errorField.style.boxShadow = "0 0 10px rgba(255, 68, 68, 0.2)";

          // Remove red border when user starts typing/selecting
          const removeError = function () {
            this.style.borderColor = "#333";
            this.style.boxShadow = "none";
          };
          errorField.addEventListener("input", removeError, { once: true });
          errorField.addEventListener("change", removeError, { once: true });

          // Scroll to field if needed
          errorField.scrollIntoView({ behavior: "smooth", block: "center" });

          return sysNotify(`REQUIRED: ${errorName}`, "error");
        }

          // 5. LOCK SCREEN BEFORE SAVING
        window.toggleProcessing(
          true,
          window.planningMode
            ? "ENCRYPTING PLAN..."
            : "COMMITTING TO LEDGER...",
        );

        try {
          // Calculate Discipline Score
          let yesCount = 0;
          let totalChecks = 0;
          const finalChecklistArray = [];
          document
            .querySelectorAll("#checklist-module .toggle-wrap")
            .forEach((w) => {
              totalChecks++;
              const activeBtn = w.querySelector(".tgl-btn.active");
              const val = activeBtn
                ? activeBtn.dataset.val || "neutral"
                : "neutral";
              if (val === "yes") yesCount++;
              finalChecklistArray.push({ key: w.dataset.key, val: val });
            });
          const disciplineScore =
            totalChecks > 0 ? Math.round((yesCount / totalChecks) * 100) : 0;

          // --- SAVE LOGIC ---
          if (window.planningMode === true) {
            const expireHours = parseInt(
              document.getElementById("plan_expiration")?.value || 24,
            );
            const plan = {
              id: Date.now(),
              pair: getVal("j_pair"),
              direction: getVal("j_direction"),
              sess: getVal("j_sess"),
              setup: getVal("j_setup"),
              notes: getVal("j_notes"),
              screenshot: getVal("j_chart"),
              expiration: new Date(
                Date.now() + expireHours * 60 * 60 * 1000,
              ).getTime(),
              expireHours: expireHours,
              discipline: disciplineScore,
              checklist: finalChecklistArray,
              createdAt: Date.now(),
              status: "pending",
            };

            if (!window.plannedTrades) window.plannedTrades = [];
            window.plannedTrades.unshift(plan);

            await saveData("plans");

            renderPlannedTrades();
            closePlanningModal();
            playSound("win");
            sysNotify("TRADE PLAN SAVED", "success");
          } else {
            // Journal Save Logic
            const trade = {
              id: Date.now(),
              pair: getVal("j_pair"),
              sess: getVal("j_sess"),
              setup: getVal("j_setup"),
              direction: getVal("j_direction"),
              res: getVal("j_res"),
              rr: parseFloat(getVal("j_rr") || 0),
              notes: getVal("j_notes"),
              screenshot: getVal("j_chart"),
              date: getVal("j_date"),
              createdAt: Date.now(),
              status: "closed",
              discipline: disciplineScore,
              checklist: finalChecklistArray,
            };

            if (!window.allTrades) window.allTrades = [];
            window.allTrades.unshift(trade);

            await saveData("journal");

            renderLogbook();
            updateDisciplineMeter(window.allTrades);
            playSound("win");
            sysNotify("TRADE SAVED", "success");
          }
        } catch (e) {
          console.error(e);
          sysNotify("SAVE FAILED. CHECK CONSOLE.", "error");
        } finally {
          window.toggleProcessing(false);
        }
      }

      // -------------------------------------------------------------------------------
      // --- STRATEGY VALIDATION ---
      // --- UPDATED SAVE STRATEGY LISTENER ---
      const saveStratBtn = document.getElementById("btn-save-strat");

      // Remove old listeners to be safe (Clone Node trick)
      const newSaveStratBtn = saveStratBtn.cloneNode(true);
      saveStratBtn.parentNode.replaceChild(newSaveStratBtn, saveStratBtn);

      newSaveStratBtn.addEventListener("click", async () => {
        // 1. Validation Loop
        let missing = false;
        document.querySelectorAll(".sys-inp").forEach((el) => {
          // Skip hidden fields if any
          if (el.offsetParent !== null && !el.value.trim()) {
            el.style.borderColor = "var(--error)";
            el.addEventListener(
              "input",
              function () {
                this.style.borderColor = "#333";
              },
              { once: true },
            );
            missing = true;
          }
        });

        // Capacity Validation
        const maxPlannedEl = document.getElementById("maxPlannedTrades");
        const maxOpenEl = document.getElementById("maxOpenTrades");
        if (!maxPlannedEl.value) {
          maxPlannedEl.style.borderColor = "var(--error)";
          missing = true;
        }
        if (!maxOpenEl.value) {
          maxOpenEl.style.borderColor = "var(--error)";
          missing = true;
        }

        if (missing) {
          playSound("error");
          return sysNotify("COMPLETE ALL FIELDS BEFORE LOCKING", "error");
        }

        // 2. Calculate Next Monday
        const nextUnlockTime = getNextSystemUnlock();
        const unlockDateStr = new Date(nextUnlockTime).toDateString(); // e.g., "Mon Dec 25 2023"

        // 3. SCARY CONFIRMATION MODAL
        const confirmMsg = `
        <span style="color:#fff">You are about to commit these parameters to the blockchain ledger.</span><br><br>
        SYSTEM WILL LOCK UNTIL:<br>
        <strong style="color:var(--accent); font-size:14px;">${unlockDateStr} (00:00)</strong>
        <br><br>
        <span style="color:#888; font-size:10px;">Ensure you have not entered dummy data. Changes are impossible until the timer expires.</span>
    `;

        // Only proceed if they click YES
        if (await sysConfirm("CONFIRM PROTOCOL LOCK", confirmMsg, true)) {
          // 4. Save Logic
          document
            .querySelectorAll(".sys-inp")
            .forEach((i) => (systemData[i.dataset.key] = i.value));
          systemData["s_max_planned"] = maxPlannedEl.value;
          systemData["s_max_open"] = maxOpenEl.value;
          systemData["next_unlock"] = nextUnlockTime;

          await saveData("system");

          checkKillSwitch();
          updateSystemUI();
          updateSetupDropdown();

          playSound("win");
          sysNotify("SYSTEM LOCKED. GOOD HUNTING.", "success");
        }
      });

      if (id === "btn-save-weekly") {
        let missing = false;

        // Validation: Only check text fields, ignore images (as they are optional/hidden)
        document.querySelectorAll(".wk-inp").forEach((el) => {
          if (el.id.includes("_img")) return; // Skip image inputs
          if (!el.value.trim()) {
            el.style.borderColor = "var(--error)";
            el.addEventListener(
              "input",
              function () {
                this.style.borderColor = "#333";
              },
              { once: true },
            );
            missing = true;
          }
        });

        if (missing) return sysNotify("COMPLETE REVIEW", "error");

        // Gather Inputs
        const wInputs = {};
        document
          .querySelectorAll(".wk-inp")
          .forEach((i) => (wInputs[i.dataset.key] = i.value));

        // Update Data Object
        weeklyData["current_focus"] = wInputs["w_focus"];
        weeklyData["next_unlock"] = Date.now() + 7 * 24 * 60 * 60 * 1000;

        if (!weeklyData.history) weeklyData.history = [];

        // --- PUSH TO HISTORY (INCLUDING IMAGES) ---
        weeklyData.history.unshift({
          date: new Date().toLocaleDateString(),
          win: wInputs["w_win"],
          winImg: wInputs["w_win_img"] || "", // Save URL
          err: wInputs["w_err"],
          errImg: wInputs["w_err_img"] || "", // Save URL
          focus: wInputs["w_focus"],
        });

        saveData("weekly");
        updateWeeklyUI();
        updateDashboard();
        sysNotify("REVIEW ARCHIVED", "success");
      }

      if (id === "btn-export") {
        if (!allTrades.length) return sysNotify("NO DATA", "error");
        let csv =
          "data:text/csv;charset=utf-8,ID,DATE,PAIR,SESSION,SETUP,OUTCOME,RR,SCORE,NOTES,CHART\n";
        allTrades.forEach(
          (t) =>
            (csv +=
              [
                t.id,
                t.date,
                t.pair,
                t.sess,
                t.setup,
                t.res,
                t.rr,
                t.score,
                `"${(t.notes || "").replace(/"/g, '""')}"`,
                t.chart,
              ].join(",") + "\n"),
        );
        const link = document.createElement("a");
        link.href = encodeURI(csv);
        link.download = `log_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        sysNotify("EXPORT GENERATED", "success");
      }
      // ✅ FIXED DELETION LOGIC (Correct Save Key)
      if (btn.classList.contains("btn-del")) {
        e.stopPropagation();

        const idToDelete = Number(btn.dataset.id); // Ensure number type

        if (
          await sysConfirm(
            "CONFIRM DELETION",
            "Purge this record permanently?",
            true,
          )
        ) {
          // Filter out the item
          allTrades = allTrades.filter((t) => Number(t.id) !== idToDelete);

          // SAVE USING 'journal' (This was the error: 'allTrades')
          await saveData("journal");

          renderAll();
          sysNotify("RECORD PURGED", "success");
          playSound("error");
        }
      }
    });

      document.getElementById("log-body").addEventListener("click", (e) => {
    if (e.target.closest(".btn-del")) return;
    const row = e.target.closest("tr");
    if (row && row.dataset.id) viewTradeDetail(parseInt(row.dataset.id));
  });
  // Hook into update
// Hook into update
  const _prevDash = window.updateDashboard;
  window.updateDashboard = function () {
    if (_prevDash) _prevDash();
    if (window.initRiskSearch) window.initRiskSearch();
    if (window.initEntrySearch) window.initEntrySearch();
  };

  