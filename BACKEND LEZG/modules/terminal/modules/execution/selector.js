 window.openTradeModal = function () {
    const modal = document.getElementById("openTradeModal");
    const list = document.getElementById("openTradeList");
    const proceed = document.getElementById("btnProceedOpen");

    if (!modal || !list || !proceed)
      return console.error("Missing Modal Elements");

    // Reset UI
    list.innerHTML = "";
    proceed.disabled = true;
    proceed.style.display = "none";
    window.selectedTradePlan = null;

    const plans = window.plannedTrades || [];

    if (plans.length === 0) {
      list.innerHTML = `<div style="padding:20px; text-align:center; opacity:0.6; color:#888;">No planned trades available.</div>`;
    } else {
      plans.forEach((plan) => {
        const item = document.createElement("div");
        item.className = "select-plan-card";

        // Calculate expiry
        const hoursLeft = Math.floor(
          (plan.expiration - Date.now()) / (1000 * 60 * 60),
        );
        const expireColor =
          hoursLeft < 6 ? "var(--error)" : hoursLeft < 12 ? "#f4d35e" : "#666";

        // Badges
        const isLong = plan.direction === "LONG";
        const dirColor = isLong ? "var(--accent)" : "var(--error)";
        const dirArrow = isLong ? "▲" : "▼";
        const dirBadge = `<span style="color:${dirColor}; border:1px solid ${dirColor}; font-size:9px; padding:1px 5px; border-radius:3px; margin-left:8px; background:rgba(0,0,0,0.3); font-weight:bold;">${dirArrow} ${plan.direction}</span>`;

        // Image
        const hasChart = plan.screenshot && plan.screenshot.trim().length > 0;
        const imgHtml = hasChart
          ? `<img src="${plan.screenshot}" class="select-plan-thumb" onerror="this.style.display='none'">`
          : `<div class="select-plan-no-img">NO CHART</div>`;

        item.innerHTML = `
                ${imgHtml}
                <div class="select-plan-details">
                    <div class="select-plan-header">
                        <div style="font-size:13px; color:#fff; font-weight:700; display:flex; align-items:center;">
                            ${plan.pair} ${dirBadge}
                        </div>
                        <div style="font-family:var(--font-mono); font-size:9px; color:${expireColor}; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">
                            ${hoursLeft}h LEFT
                        </div>
                    </div>
                    <div style="font-size:10px; color:var(--accent); font-family:var(--font-mono); opacity:0.8; margin-top:4px;">
                        ${(plan.setup || "GENERAL").toUpperCase()} <span style="color:#444">|</span> ${(plan.sess || "ANY").toUpperCase()}
                    </div>
                    <div style="font-size:10px; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">
                        ${plan.notes || "No notes provided..."}
                    </div>
                </div>
            `;

        // --- Make the whole card behave as an Execute action ---
        item.onclick = () => {
          playSound("hover");

          // Close the plan selection modal
          closeOpenTradeModal();

          // Delay a little so modal closes cleanly before execution modal opens
          setTimeout(() => {
            executeTradePlanDirect(plan.id);
          }, 150);
        };
        list.appendChild(item);
      });
    }

    // Close Listeners
    const closeFunc = (e) => {
      if (e) e.stopPropagation();
      modal.classList.add("hidden");
      modal.style.display = "none";
    };
    document.getElementById("closeOpenTradeModal").onclick = closeFunc;
    document.getElementById("closeOpenTradeModalBtn").onclick = closeFunc;

    // --- PROCEED BUTTON (This connects to the Master Function) ---
    proceed.onclick = () => {
      const hiddenExec = proceed.querySelector('[data-action="execute"]');
      if (!hiddenExec) return;
      hiddenExec.click();
      closeOpenTradeModal();
    };

    modal.classList.remove("hidden");
    modal.style.display = "flex";
  };

window.openTradeModal = function () {
    const modal = document.getElementById("openTradeModal");
    const list = document.getElementById("openTradeList");
    const proceed = document.getElementById("btnProceedOpen");

    // --- Safety Check ---
    if (!modal || !list || !proceed) {
      console.error(
        "CRITICAL: Open Trade Modal elements missing. Check HTML IDs.",
      );
      return;
    }

    // 1. Reset UI
    list.innerHTML = "";
    proceed.disabled = true;
    proceed.style.display = "none";
    window.selectedTradePlan = null;

    // 2. Populate List
    const plans = window.plannedTrades || [];

    if (plans.length === 0) {
      list.innerHTML = `<div style="padding:20px; text-align:center; opacity:0.6; color:#888;">No planned trades available.</div>`;
    } else {
      plans.forEach((plan) => {
        const item = document.createElement("div");
        item.className = "select-plan-card"; // Relies on the CSS added previously

        // --- Time Left Logic ---
        const hoursLeft = Math.floor(
          (plan.expiration - Date.now()) / (1000 * 60 * 60),
        );
        const expireColor =
          hoursLeft < 6 ? "var(--error)" : hoursLeft < 12 ? "#f4d35e" : "#666";

        // --- Direction Badge Logic ---
        const isLong = plan.direction === "LONG";
        const dirColor = isLong ? "var(--accent)" : "var(--error)";
        const dirArrow = isLong ? "▲" : "▼";
        // Compact badge for inside the title
        const dirBadge = `<span style="color:${dirColor}; border:1px solid ${dirColor}; font-size:9px; padding:1px 5px; border-radius:3px; margin-left:8px; background:rgba(0,0,0,0.3); font-weight:bold;">${dirArrow} ${plan.direction}</span>`;

        // --- Image Logic ---
        const hasChart = plan.screenshot && plan.screenshot.trim().length > 0;
        const imgHtml = hasChart
          ? `<img src="${plan.screenshot}" class="select-plan-thumb" onerror="this.style.display='none'">`
          : `<div class="select-plan-no-img">NO CHART</div>`;

        // --- RENDER HTML (The Requested Block) ---
        item.innerHTML = `
                ${imgHtml}
                
                <div class="select-plan-details">
                    <!-- Top Row: Pair & Direction -->
                    <div class="select-plan-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:13px; color:#fff; font-weight:700; letter-spacing:0.5px; display:flex; align-items:center;">
                            ${plan.pair} 
                            ${dirBadge}
                        </div>
                        <div style="font-family:var(--font-mono); font-size:9px; color:${expireColor}; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">
                            ${hoursLeft}h LEFT
                        </div>
                    </div>

                    <!-- Middle Row: Strategy & Session -->
                    <div style="font-size:10px; color:var(--accent); font-family:var(--font-mono); opacity:0.8; letter-spacing:0.5px;">
                        ${(plan.setup || "GENERAL").toUpperCase()} <span style="color:#444">|</span> ${(plan.sess || "ANY").toUpperCase()}
                    </div>

                    <!-- Bottom Row: Notes (Truncated cleanly) -->
                    <div style="font-size:10px; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">
                        ${plan.notes || "No notes provided..."}
                    </div>
                </div>
            `;

        // --- Click Event ---
        // --- Make the whole card behave as an Execute action ---
        item.onclick = () => {
          playSound("hover");

          // Close the plan selection modal
          closeOpenTradeModal();

          // Delay a little so modal closes cleanly before execution modal opens
          setTimeout(() => {
            executeTradePlanDirect(plan.id);
          }, 150);
        };

        list.appendChild(item);
      });
    }

    // 3. FORCE-ATTACH CLOSE LISTENERS
    const closeX = document.getElementById("closeOpenTradeModal");
    const closeBtn = document.getElementById("closeOpenTradeModalBtn");

    if (closeX)
      closeX.onclick = (e) => {
        e.stopPropagation();
        closeOpenTradeModal();
        playSound("click");
      };
    if (closeBtn)
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeOpenTradeModal();
        playSound("click");
      };

    // Proceed Button Logic
    proceed.onclick = () => {
      const hiddenExec = proceed.querySelector('[data-action="execute"]');
      if (!hiddenExec) return;
      hiddenExec.click();
      closeOpenTradeModal();
    };

    // Background Click Close
    modal.onclick = (e) => {
      if (e.target.id === "openTradeModal") {
        closeOpenTradeModal();
      }
    };

    // 4. Show Modal
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }

  
window.closeOpenTradeModal = function () {
    const modal = document.getElementById("openTradeModal");
    if (!modal) return;

    // 1. Hide Visuals
    modal.classList.add("hidden");
    modal.style.display = "none";

    // 2. Reset Selection State
    window.selectedTradePlan = null;

    // 3. Reset Proceed Button
    const proceedBtn = document.getElementById("btnProceedOpen");
    if (proceedBtn) {
      proceedBtn.disabled = true;
      proceedBtn.style.opacity = "0.5"; // Visual feedback
    }

    // 4. Clear active highlights
    document
      .querySelectorAll(".select-plan-item")
      .forEach((i) => i.classList.remove("active"));
  }

    window.closeOpenTrade = async function (tradeId) {
    const trade = window.openTrades.find((t) => t.id === tradeId);
    if (!trade) return;

    // Fallbacks
    const dPair = trade.pair || "UNKNOWN";
    const dDir = trade.direction || "LONG";
    const dSess = trade.sess || "LDN";

    // Colors
    const isLong = dDir === "LONG";
    const dirColor = isLong ? "var(--accent)" : "var(--error)";
    const dirBg = isLong ? "rgba(0, 255, 157, 0.1)" : "rgba(255, 68, 68, 0.1)";
    const dirBorder = isLong
      ? "rgba(0, 255, 157, 0.3)"
      : "rgba(255, 68, 68, 0.3)";

    // Create Modal Elements
    const overlay = document.createElement("div");
    overlay.className = "sys-modal-overlay";

    overlay.innerHTML = `
        <div class="sys-modal" style="width:500px; overflow:hidden; border-radius:4px;">
            
            <!-- 1. HEADER -->
            <div class="exec-header">
                <div class="exec-header-info">
                    <span class="exec-label">CLOSING POSITION</span>
                    <div class="exec-asset">
                        ${dPair}
                        <span style="font-size:10px; font-family:var(--font-mono); color:${dirColor}; border:1px solid ${dirColor}; padding:2px 6px; border-radius:3px; background:${dirBg};">
                            ${isLong ? "▲" : "▼"} ${dDir}
                        </span>
                    </div>
                </div>
                <button id="close-exit-modal" style="background:none; border:none; color:#444; cursor:pointer; font-size:14px;">✕</button>
            </div>

            <!-- 2. BODY -->
            <div class="exec-body">
                
                <!-- Summary Card -->
                <div class="close-summary-card">
                    <div>
                        <div class="close-stat-label">STRATEGY</div>
                        <div class="close-stat-val" style="color:var(--accent);">${trade.setup || "General"}</div>
                    </div>
                    <div>
                        <div class="close-stat-label">SESSION</div>
                        <div class="close-stat-val">${dSess}</div>
                    </div>
                    <div style="grid-column: span 2; border-top:1px solid #1a1a1a; padding-top:8px; margin-top:4px;">
                        <div class="close-stat-label">ORIGINAL NOTES</div>
                        <div class="close-stat-val" style="font-size:11px; color:#888; font-weight:400; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${trade.notes || "No entry notes."}
                        </div>
                    </div>
                </div>

                <!-- Input Grid -->
                <div class="exec-grid-row">
                    <div class="exec-group">
                        <label>TRADE OUTCOME</label>
                        <select id="exit-result" class="exec-input">
                            <option value="" disabled selected>-- SELECT --</option>
                            <option value="WIN">WIN</option>
                            <option value="LOSS">LOSS</option>
                            <option value="BE">BREAKEVEN</option>
                        </select>
                    </div>
                    <div class="exec-group">
                        <label>REALIZED R</label>
                        <input type="number" id="exit-rr" class="exec-input" step="0.1" placeholder="0.0">
                    </div>
                </div>

                <!-- Notes -->
                <div class="exec-group">
                    <label>EXECUTION REVIEW</label>
                    <textarea id="exit-notes" class="exec-input" placeholder="REQUIRED: What dictated the exit? Any mistakes?"></textarea>
                </div>

                <!-- Chart -->
                <div class="exec-group">
                    <label>EXIT CHART (OPTIONAL)</label>
                    <input id="exit-chart" class="exec-input" placeholder="Paste TradingView link">
                </div>

            </div>

            <!-- 3. FOOTER -->
            <div class="exec-footer">
                <button id="btn-cancel-exit" class="btn-exec-cancel">CANCEL</button>
                <button id="btn-confirm-exit" class="btn-exec-primary" disabled style="opacity:0.5; filter:grayscale(100%);">
                    <span>🔒</span> INPUTS REQUIRED
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    playSound("hover");

    // --- LOGIC: References ---
    const resSel = document.getElementById("exit-result");
    const rrInp = document.getElementById("exit-rr");
    const notesInp = document.getElementById("exit-notes");
    const chartInp = document.getElementById("exit-chart");
    const confirmBtn = document.getElementById("btn-confirm-exit");
    const closeBtn = document.getElementById("close-exit-modal");
    const cancelBtn = document.getElementById("btn-cancel-exit");

    // --- LOGIC: Validation Function ---
    const validateExit = () => {
      let isValid = true;

      // 1. Outcome Selected?
      if (resSel.value === "") isValid = false;

      // 2. RR Entered?
      if (rrInp.value === "") isValid = false;

      // 3. Notes Entered? (Min 3 chars)
      if (notesInp.value.trim().length < 3) isValid = false;

      // Update Button
      if (isValid) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.style.filter = "none";
        confirmBtn.innerHTML = `<span>✔</span> CONFIRM & LOG`;
        confirmBtn.style.boxShadow = "0 0 15px rgba(0, 255, 157, 0.2)";
      } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.style.filter = "grayscale(100%)";
        confirmBtn.innerHTML = `<span>🔒</span> INPUTS REQUIRED`;
        confirmBtn.style.boxShadow = "none";
      }
    };

    // --- LOGIC: Auto-Fill RR ---
    resSel.addEventListener("change", () => {
      if (resSel.value === "LOSS") {
        rrInp.value = "-1";
        // We allow editing in case it's a partial loss (-0.5)
      } else if (resSel.value === "BE") {
        rrInp.value = "0";
        rrInp.disabled = true; // BE is always 0
      } else {
        rrInp.value = "";
        rrInp.disabled = false;
        rrInp.focus(); // Jump to RR input for wins
      }
      validateExit();
    });

    // --- LOGIC: Listeners ---
    rrInp.addEventListener("input", validateExit);
    notesInp.addEventListener("input", validateExit);

    // --- LOGIC: Close/Cancel ---
    const closeFunc = () => {
      overlay.remove();
      playSound("cancel");
    };
    closeBtn.onclick = closeFunc;
    cancelBtn.onclick = closeFunc;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeFunc();
    };

    // --- LOGIC: Confirm Action ---
    // --- LOGIC: Confirm Action ---
    confirmBtn.onclick = async () => {
      // 1. LOCK
      window.toggleProcessing(true, "FINALIZING TRADE...");

      try {
        const res = resSel.value;
        const rr = rrInp.value;
        const notes = notesInp.value;
        const finalChart = chartInp.value || trade.screenshot || "";

        const exitDate = getLocalDate();
        const carriedScore =
          trade.discipline !== undefined ? parseInt(trade.discipline) : 0;
        const carriedChecklist = trade.checklist || [];

        const logEntry = {
          id: Date.now(),
          date: exitDate,
          pair: dPair,
          direction: dDir,
          sess: dSess,
          setup: trade.setup || "General",
          res: res,
          rr: rr,
          score: trade.confidence || "0",
          notes: `[ENTRY] ${trade.notes || "-"}\n[EXIT] ${notes}`,
          chart: finalChart,
          entryChart: trade.screenshot || "",
          discipline: carriedScore,
          checklist: carriedChecklist,
        };

        if (!Array.isArray(allTrades)) allTrades = [];
        allTrades.push(logEntry);

        // Remove from open
        window.openTrades = window.openTrades.filter((t) => t.id !== tradeId);

        // AWAIT SAVES
        await saveData("journal");
        await saveData("openTrades");

        renderAll();
        overlay.remove();

        sysNotify(res === "WIN" ? "TRADE WON 🎯" : "TRADE LOGGED", "success");
        playSound("win");
      } catch (e) {
        console.error(e);
        sysNotify("CLOSING FAILED", "error");
      } finally {
        // 2. UNLOCK
        window.toggleProcessing(false);
      }
    };
  };