  // 1. Start the Wizard
  window.startWeeklyWizard = function () {
    if (typeof playSound === "function") playSound("click");

    // -- PHASE 1: UI TRANSITION TO LOADING --
    const btn = document.getElementById("btn-start-audit");
    const staticIcon = document.getElementById("wiz-static-icon");
    const spinner = document.getElementById("wiz-loading-spinner");
    const text = document.getElementById("wiz-start-text");
    const startView = document.getElementById("review-start-view");
    const wizardView = document.getElementById("review-wizard");

    // Hide Button & Icon, Show Spinner
    if (btn) btn.style.display = "none";
    if (staticIcon) staticIcon.style.display = "none";
    if (spinner) spinner.style.display = "block";

    // Update Status Text
    if (text) {
      text.innerHTML = `
            WEEKLY_AUDIT<br>
            <span style="color:var(--accent);">[ STATUS: EXECUTING... ]</span><br>
            <span style="color:#666">PARSING TRADE LOGS...</span>
        `;
    }

    // -- PHASE 2: WAIT & CALCULATE (1.5s Delay) --
    setTimeout(() => {
      console.log("--- INITIATING WEEKLY AUDIT ---");

      // A. Robust Data Fetching
      let sourceData = [];
      if (
        typeof window.allTrades !== "undefined" &&
        Array.isArray(window.allTrades)
      ) {
        sourceData = window.allTrades;
      } else if (typeof allTrades !== "undefined" && Array.isArray(allTrades)) {
        sourceData = allTrades;
      }

      // B. Filter for Last 7 Days
      const now = new Date();
      now.setHours(23, 59, 59, 999);

      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);

      const recentTrades = sourceData.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= lastWeek && tDate <= now;
      });

      console.log(
        `Audit found ${recentTrades.length} trades from last 7 days.`,
      );

      // C. Analysis Logic
      let wins = 0,
        losses = 0,
        totalR = 0,
        disciplineTotal = 0;
      let bestTrade = { rr: -999, pair: "", date: "" };
      let worstTrade = { rr: 999, pair: "", discipline: 100, date: "" };

      recentTrades.forEach((t) => {
        const rr = parseFloat(t.rr || 0);

        // Normalize discipline score
        let disc = 0;
        if (t.discipline) disc = parseInt(t.discipline);
        else if (t.protocolScore) disc = parseInt(t.protocolScore);

        totalR += rr;
        disciplineTotal += disc;

        if (t.res === "WIN") wins++;
        if (t.res === "LOSS") losses++;

        // Best Trade Logic
        if (rr > bestTrade.rr) bestTrade = t;

        // Worst Trade Logic
        if (disc < worstTrade.discipline) {
          worstTrade = t;
        } else if (
          disc === worstTrade.discipline &&
          t.res === "LOSS" &&
          rr < worstTrade.rr
        ) {
          worstTrade = t;
        }
      });

      const totalTrades = wins + losses;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const avgDisc = totalTrades > 0 ? disciplineTotal / totalTrades : 0;

      // D. Archetype Logic
      let archetype = "THE RECRUIT";
      let subColor = "#888";

      if (totalTrades === 0) {
        archetype = "THE OBSERVER";
        subColor = "#666";
      } else if (avgDisc >= 90 && winRate >= 60) {
        archetype = "THE SNIPER";
        subColor = "var(--accent)";
      } else if (avgDisc >= 90 && totalTrades > 5) {
        archetype = "THE GRINDER";
        subColor = "#00ccff";
      } else if (avgDisc < 60) {
        archetype = "THE GAMBLER";
        subColor = "var(--error)";
      } else if (totalR < -2) {
        archetype = "THE BLEEDER";
        subColor = "#ff5500";
      } else if (winRate > 50) {
        archetype = "THE OPERATOR";
        subColor = "#fff";
      }

      // E. Populate UI
      const archEl = document.getElementById("wiz-archetype");
      const statsEl = document.getElementById("wiz-stats");

      if (archEl) {
        archEl.innerText = archetype;
        archEl.style.color = subColor;
      }

      if (statsEl) {
        if (totalTrades === 0) {
          statsEl.innerHTML = "NO DATA LOGGED THIS CYCLE.";
        } else {
          statsEl.innerHTML = `
                    <span style="color:var(--accent)">${totalTrades}</span> TRADES <span style="color:#444">|</span> 
                    <span style="color:${totalR >= 0 ? "var(--accent)" : "var(--error)"}">${totalR.toFixed(1)}R</span> P&L <span style="color:#444">|</span> 
                    <span style="color:#fff">${avgDisc}%</span> ADHERENCE
                `;
        }
      }

      // --- F. VISUAL INJECTION ---
      window.tempBestTrade =
        bestTrade.pair && bestTrade.rr !== -999 ? bestTrade : null;
      window.tempWorstTrade =
        worstTrade.pair && worstTrade.rr !== 999 ? worstTrade : null;

      // Populate Win Slide
      populateWizardSlide("win", window.tempBestTrade);
      // Populate Loss Slide
      populateWizardSlide("loss", window.tempWorstTrade);

      // G. FORCE VIEW SWITCH (Hidden until now)
      startView.style.display = "none";
      wizardView.style.display = "flex";

      // Reset Start View (for next time)
      if (btn) btn.style.display = "block";
      if (staticIcon) staticIcon.style.display = "block";
      if (spinner) spinner.style.display = "none";
      if (text)
        text.innerHTML = `WEEKLY_AUDIT<br><span style="color:#444;">[ STATUS: PENDING ]</span><br>SYSTEM WILL ANALYZE LOGS, ASSIGN ARCHETYPE, AND EXTRACT KEY PERFORMANCE INDICATORS.`;

      // Navigate to first slide
      window.nextReviewStep("step-archetype");
      if (typeof playSound === "function") playSound("win");
    }, 1500); // 1.5 Second Loading Delay
  };

      // 3. Navigation Helper
  window.nextReviewStep = function (stepId) {
    if (typeof playSound === "function") playSound("click");
    document
      .querySelectorAll(".review-step")
      .forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(stepId);
    if (target) target.classList.add("active");
  };

      window.saveWinDebrief = function () {
    const refInput = document.getElementById("wiz-win-reflection");
    const val = refInput.value.trim();

    // 1. STRICT VALIDATION: STOP IF EMPTY
    if (val.length < 5) {
      // Require at least 5 characters
      sysNotify("REFLECTION REQUIRED", "error");
      playSound("error");

      // Visual cue
      refInput.style.borderColor = "var(--error)";
      refInput.focus();

      // Remove error color when they start typing
      refInput.addEventListener(
        "input",
        function () {
          this.style.borderColor = "#333";
        },
        { once: true },
      );

      return; // <--- THIS STOPS THEM FROM MOVING FORWARD
    }

    // 2. Save Text to Hidden Field
    const hiddenInput = document.getElementById("hidden_w_win");
    if (window.tempBestTrade) {
      hiddenInput.value = `[ ${window.tempBestTrade.pair} +${window.tempBestTrade.rr}R ]\n${val}`;
    } else {
      hiddenInput.value = val;
    }

    // 3. Save Image URL
    const hiddenImg = document.getElementById("hidden_w_win_img");
    if (window.tempBestTrade) {
      hiddenImg.value =
        window.tempBestTrade.screenshot ||
        window.tempBestTrade.chart ||
        window.tempBestTrade.link ||
        "";
    } else {
      hiddenImg.value = "";
    }

    // 4. Proceed
    if (typeof playSound === "function") playSound("win");
    window.nextReviewStep("step-mistake");
  };

      window.saveMistakeDebrief = function () {
    const refInput = document.getElementById("wiz-mistake-reflection");
    const val = refInput.value.trim();

    // 1. STRICT VALIDATION: STOP IF EMPTY
    if (val.length < 5) {
      sysNotify("ROOT CAUSE REQUIRED", "error");
      playSound("error");

      refInput.style.borderColor = "var(--error)";
      refInput.focus();

      refInput.addEventListener(
        "input",
        function () {
          this.style.borderColor = "#333";
        },
        { once: true },
      );

      return; // <--- STOP HERE
    }

    // 2. Save to Hidden Field (Pre-save)
    const hiddenErr = document.getElementById("hidden_w_err");
    let mistakeText = "";
    if (window.tempWorstTrade) {
      mistakeText = `[ ${window.tempWorstTrade.pair} (Score: ${window.tempWorstTrade.discipline}%) ]\n${val}`;
    } else {
      mistakeText = val;
    }
    hiddenErr.value = mistakeText;

    // 3. Save Image
    const hiddenImg = document.getElementById("hidden_w_err_img");
    if (window.tempWorstTrade) {
      hiddenImg.value =
        window.tempWorstTrade.screenshot ||
        window.tempWorstTrade.chart ||
        window.tempWorstTrade.link ||
        "";
    } else {
      hiddenImg.value = "";
    }

    // 4. Proceed
    if (typeof playSound === "function") playSound("click");
    window.nextReviewStep("step-focus");
  };

      // 5. Manual Override Toggle
  window.manualOverride = function (type) {
    if (type === "win") {
      document.getElementById("wiz-win-img-container").style.display = "none";
      document.getElementById("wiz-win-data").innerHTML =
        "<strong style='color:#555'>MANUAL OVERRIDE ENGAGED</strong>";
      document.getElementById("wiz-win-reflection").placeholder =
        "Input trade details and reflection here...";
      document.getElementById("wiz-win-reflection").value = "";
      document.getElementById("wiz-win-reflection").focus();
      window.tempBestTrade = null;
    }
    if (type === "loss") {
      document.getElementById("wiz-loss-img-container").style.display = "none";
      document.getElementById("wiz-loss-data").innerHTML =
        "<strong style='color:#555'>MANUAL OVERRIDE ENGAGED</strong>";
      document.getElementById("wiz-mistake-reflection").placeholder =
        "Describe the mistake and root cause...";
      document.getElementById("wiz-mistake-reflection").focus();
      window.tempWorstTrade = null;
    }
  };

      window.finalizeWeeklyReview = function () {
    // 1. Get Data
    const mistakeRef = document.getElementById("wiz-mistake-reflection").value;
    const focusVal = document.getElementById("wiz-focus-input").value;

    // Validation
    if (mistakeRef.length < 3 || focusVal.length < 3) {
      if (typeof sysNotify === "function")
        sysNotify("COMPLETE ALL FIELDS", "error");
      return;
    }

    // 2. Save Text
    const hiddenErr = document.getElementById("hidden_w_err");
    const hiddenFocus = document.getElementById("hidden_w_focus");

    let mistakeText = "";
    if (window.tempWorstTrade) {
      mistakeText = `[ ${window.tempWorstTrade.pair} (Score: ${window.tempWorstTrade.discipline}%) ]\n${mistakeRef}`;
    } else {
      mistakeText =
        mistakeRef.length > 0 ? mistakeRef : "No significant errors recorded.";
    }

    if (hiddenErr) hiddenErr.value = mistakeText;
    if (hiddenFocus) hiddenFocus.value = focusVal;

    // 3. NEW: Save Image URL
    const hiddenImg = document.getElementById("hidden_w_err_img");
    if (
      window.tempWorstTrade &&
      (window.tempWorstTrade.screenshot || window.tempWorstTrade.chart)
    ) {
      hiddenImg.value =
        window.tempWorstTrade.screenshot || window.tempWorstTrade.chart;
    } else {
      hiddenImg.value = "";
    }

    // 4. Trigger Save
    const saveBtn = document.getElementById("btn-save-weekly");
    if (saveBtn) {
      const legacy = document.getElementById("legacy-review-form");
      const wiz = document.getElementById("review-wizard");
      if (legacy) legacy.style.display = "block";
      if (wiz) wiz.style.display = "none";
      saveBtn.click();
    }
  };

      window.finalizeWeeklyReview = function () {
      const mistakeRef = document.getElementById("wiz-mistake-reflection").value;
      const focusVal = document.getElementById("wiz-focus-input").value;
  
      if (mistakeRef.length < 3 || focusVal.length < 3) {
        if (typeof sysNotify === "function")
          sysNotify("COMPLETE ALL FIELDS", "error");
        return;
      }
  
      // Save Text
      const hiddenErr = document.getElementById("hidden_w_err");
      const hiddenFocus = document.getElementById("hidden_w_focus");
  
      let mistakeText = "";
      if (window.tempWorstTrade) {
        mistakeText = `[ ${window.tempWorstTrade.pair} (Score: ${window.tempWorstTrade.discipline}%) ]\n${mistakeRef}`;
      } else {
        mistakeText =
          mistakeRef.length > 0 ? mistakeRef : "No significant errors.";
      }
  
      hiddenErr.value = mistakeText;
      hiddenFocus.value = focusVal;
  
      // --- NEW: Save Image URL ---
      const hiddenImg = document.getElementById("hidden_w_err_img");
      if (window.tempWorstTrade) {
        hiddenImg.value =
          window.tempWorstTrade.screenshot ||
          window.tempWorstTrade.chart ||
          window.tempWorstTrade.link ||
          "";
      } else {
        hiddenImg.value = "";
      }
  
      // CLICK SAVE BUTTON
      const saveBtn = document.getElementById("btn-save-weekly");
      if (saveBtn) {
        // Temporarily show form so validation passes if needed
        const legacy = document.getElementById("legacy-review-form");
        const wiz = document.getElementById("review-wizard");
        if (legacy) legacy.style.display = "block";
        if (wiz) wiz.style.display = "none";
  
        saveBtn.click();
      }
    };