    // RENEW: Extend expiration (FIXED)
  window.renewTradePlan = async (planId) => {
    console.log("🔄 RENEW called for plan:", planId);

    // Find the plan INDEX (not just the plan object)
    const planIndex = window.plannedTrades.findIndex((p) => p.id === planId);

    if (planIndex === -1) {
      console.error("❌ Plan not found!");
      return;
    }

    const plan = window.plannedTrades[planIndex];

    console.log("Before:", {
      expiration: new Date(plan.expiration),
      hoursLeft: Math.floor((plan.expiration - Date.now()) / (1000 * 60 * 60)),
    });

    if (
      await sysConfirm(
        "RENEW PLAN",
        `Extend expiration by ${plan.expireHours} hours?`,
      )
    ) {
      // Calculate new expiration FROM CURRENT EXPIRATION (not from now)
      const additionalTime = plan.expireHours * 60 * 60 * 1000;
      const newExpiration = plan.expiration + additionalTime; // ← FIXED!

      // Update the plan directly in the array
      window.plannedTrades[planIndex].expiration = newExpiration;

      console.log("After:", {
        expiration: new Date(window.plannedTrades[planIndex].expiration),
        hoursLeft: Math.floor(
          (window.plannedTrades[planIndex].expiration - Date.now()) /
            (1000 * 60 * 60),
        ),
        hoursAdded: plan.expireHours,
      });

      // Save to database
      await saveData("plans");

      // Re-render the UI
      renderPlannedTrades();

      sysNotify("PLAN RENEWED", "success");
      playSound("hover");
    }
  };

  // ABORT: Delete plan
  window.abortTradePlan = async (planId) => {
    console.log("Abort called for plan:", planId);
    console.log("Current plans:", window.plannedTrades);

    if (
      await sysConfirm(
        "ABORT PLAN",
        "Delete this trade plan? This action cannot be undone.",
        true,
      )
    ) {
      window.plannedTrades = window.plannedTrades.filter(
        (p) => p.id !== planId,
      );
      await saveData("plans");
      renderPlannedTrades();
      sysNotify("PLAN ABORTED", "error");
      playSound("error");
    }
  };

     window.renewTradePlan = async (planId) => {
    console.log("🔄 RENEW called for plan:", planId);

    // Find the plan INDEX (not just the plan object)
    const planIndex = window.plannedTrades.findIndex((p) => p.id === planId);

    if (planIndex === -1) {
      console.error("❌ Plan not found!");
      return;
    }

    const plan = window.plannedTrades[planIndex];

    console.log("Before:", {
      expiration: new Date(plan.expiration),
      hoursLeft: Math.floor((plan.expiration - Date.now()) / (1000 * 60 * 60)),
    });

    if (
      await sysConfirm(
        "RENEW PLAN",
        `Extend expiration by ${plan.expireHours} hours?`,
      )
    ) {
      // Calculate new expiration FROM CURRENT EXPIRATION (not from now)
      const additionalTime = plan.expireHours * 60 * 60 * 1000;
      const newExpiration = plan.expiration + additionalTime; // ← FIXED!

      // Update the plan directly in the array
      window.plannedTrades[planIndex].expiration = newExpiration;

      console.log("After:", {
        expiration: new Date(window.plannedTrades[planIndex].expiration),
        hoursLeft: Math.floor(
          (window.plannedTrades[planIndex].expiration - Date.now()) /
            (1000 * 60 * 60),
        ),
        hoursAdded: plan.expireHours,
      });

      // Save to database
      await saveData("plans");

      // Re-render the UI
      renderPlannedTrades();

      sysNotify("PLAN RENEWED", "success");
      playSound("hover");
    }
  };

      window.abortTradePlan = async (planId) => {
    if (
      await sysConfirm(
        "ABORT PLAN",
        "Delete this trade plan? This action cannot be undone.",
        true,
      )
    ) {
      window.plannedTrades = window.plannedTrades.filter(
        (p) => p.id !== planId,
      );
      await saveData("plans");
      renderPlannedTrades();
      sysNotify("PLAN ABORTED", "error");
      playSound("error");
    }
  };
  
  

window.renderPlanningChecklist = function () {
      const container = document.getElementById("checklist-module");
    if (!container) return;

    // Define items
    const items = [
      { id: "c_bias", label: "HTF BIAS ALIGNED" },
      { id: "c_level", label: "KEY LEVEL REACTION" },
      { id: "c_setup", label: "SETUP VALID" },
      { id: "c_rr", label: "RR > 1:2" },
      { id: "c_news", label: "NO HIGH IMPACT NEWS" },
      { id: "c_mind", label: "MENTAL STATE OPTIMAL" },
    ];

    // Build HTML (Default to Neutral '/')
    let html = `<div class="checklist-stack">`;
    items.forEach((item) => {
      html += `
        <div class="chk-item" style="border-bottom:1px solid #1a1a1a; padding:10px 0;">
            <span class="chk-label" style="font-size:11px; color:#ccc;">${item.label}</span>
            <div class="toggle-wrap" data-key="${item.id}" style="width:140px;">
                <button class="tgl-btn" data-val="yes">YES</button>
                <button class="tgl-btn active" data-val="neutral">/</button>
                <button class="tgl-btn" data-val="no">NO</button>
            </div>
        </div>`;
    });
    html += `</div><div id="checklist-feedback" class="status-bar" style="margin-top:15px; border:1px solid #333; color:#666;">AWAITING INPUTS...</div>`;

    container.innerHTML = html;

    // Attach Listeners
    container.querySelectorAll(".tgl-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const wrap = e.target.closest(".toggle-wrap");
        if (!wrap) return;

        // Toggle Logic
        wrap
          .querySelectorAll(".tgl-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");

        // Run Validation on Click
        validateChecklistCompletion();
      };
    });

    // ➤ THE FIX IS HERE:
    // Force validation immediately to calculate 0% score and apply the lock.
    validateChecklistCompletion();
  }

window.validateChecklistCompletion = function () {
    const wraps = document.querySelectorAll("#checklist-module .toggle-wrap");
    const fb = document.getElementById("checklist-feedback");
    if (!wraps) return;

    let total = 0;
    let answered = 0;
    let yesCount = 0;

    wraps.forEach((wrap) => {
      // Only consider visible / active checklist items
      if (
        wrap &&
        (wrap.offsetParent !== null ||
          getComputedStyle(wrap).display !== "none")
      ) {
        total++;
        const activeBtn = wrap.querySelector(".tgl-btn.active");
        const val = activeBtn
          ? (activeBtn.dataset.val || "").toLowerCase()
          : "neutral";

        // "Neutral" counts as not answered
        if (val === "yes" || val === "no") answered++;
        if (val === "yes") yesCount++;
      }
    });

    const score = total > 0 ? Math.round((yesCount / total) * 100) : 0;
    window.currentChecklistScore = score;

    // Update feedback UI
    if (fb) {
      if (answered < total) {
        const remaining = total - answered;
        fb.innerText = `PENDING: ${remaining} ITEM${remaining > 1 ? "S" : ""} REMAINING`;
        fb.className = "status-bar bar-wait";
        fb.style.color = "#666";
        fb.style.borderColor = "#333";
        toggleInputsLock(true);
      } else {
        fb.innerText = `PROTOCOL SCORE: ${score}%`;
        fb.className = score === 100 ? "status-bar bar-ok" : "status-bar";
        fb.style.color =
          score === 100
            ? "var(--accent)"
            : score < 50
              ? "var(--error)"
              : "#fff";
        fb.style.borderColor =
          score === 100
            ? "var(--accent)"
            : score < 50
              ? "var(--error)"
              : "#fff";
        toggleInputsLock(false);
      }
    } else {
      // If feedback element missing, still toggle lock state sensibly
      if (answered < total) toggleInputsLock(true);
      else toggleInputsLock(false);
    }
  }

  
window.toggleInputsLock = function (isLocked) {
  
  const inputTab = document.getElementById("tab-inputs");
    if (!inputTab) return;

    inputTab.style.position = "relative";
    inputTab.style.minHeight = "300px";

    let overlay = document.getElementById("inputs-lock-overlay");

    if (isLocked) {
      // Disable inputs
      inputTab
        .querySelectorAll("input, select, textarea, button")
        .forEach((el) => {
          // FIX: Only store the previous state if we haven't stored it already.
          if (!el.dataset.hasOwnProperty("_prevDisabled")) {
            el.dataset._prevDisabled = el.disabled ? "1" : "0";
          }

          el.disabled = true;
          el.style.pointerEvents = "none";
        });

      // Show Overlay
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "inputs-lock-overlay";
        overlay.className = "lock-overlay";
        overlay.style.zIndex = "50";
        overlay.innerHTML = `
                <div class="lock-box" onclick="this.classList.add('access-denied'); setTimeout(()=>this.classList.remove('access-denied'),400);">
                    <div class="lock-icon-container">
                        <svg style="width:40px; height:40px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <h2 style="margin:0 0 8px 0; font-family:var(--font-mono); color:#884444; letter-spacing:1px;">PROTOCOL INCOMPLETE</h2>
                    <div style="font-size:12px; color:#bba; max-width:320px; line-height:1.4; text-align:center;">
                        Answer all checklist items to unlock trade inputs.
                    </div>
                </div>
            `;
        inputTab.appendChild(overlay);
      } else {
        overlay.style.display = "flex";
        overlay.style.opacity = "1";
      }
    } else {
      // Enable inputs (Unlock)
      inputTab
        .querySelectorAll("input, select, textarea, button")
        .forEach((el) => {
          // Restore original state
          if (el.dataset._prevDisabled === "0") {
            el.disabled = false;
          }
          // Clear the memory so it resets for next time
          delete el.dataset._prevDisabled;
          el.style.pointerEvents = "auto";
        });

      // Hide Overlay
      if (overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 200);
      }
    }
  }

  window.updateChecklistUI = function() {
    let total = 0;
    let yesCount = 0;

    // Count the scores
    document.querySelectorAll(".toggle-wrap").forEach((w) => {
      total++;
      const v = checklistData[w.dataset.key];
      if (v === "yes") yesCount++;

      // Visual Toggle Buttons
      w.querySelectorAll(".tgl-btn").forEach((b) => {
        const isActive = b.dataset.val === v;
        b.style.background = isActive
          ? v === "yes"
            ? "var(--accent)"
            : "var(--error)"
          : "transparent";
        b.style.color = isActive ? "#000" : "#555";
        if (isActive) b.style.fontWeight = "800";
      });
    });

    const pct = total > 0 ? Math.round((yesCount / total) * 100) : 0;

    // 1. Update Progress Bar
    if (el("chk-progress")) {
      el("chk-progress").style.width = pct + "%";
      el("chk-progress").style.background =
        pct === 100 ? "var(--accent)" : "var(--error)";
      el("chk-progress").style.boxShadow =
        pct === 100 ? "0 0 15px var(--accent)" : "none";
    }

    // 2. Update Text Status
    const statusEl = el("exec-status");
    if (statusEl) {
      statusEl.innerText =
        pct === 100
          ? "READY TO EXECUTE (100%)"
          : `PROTOCOL INCOMPLETE (${pct}%)`;
      statusEl.className = `status-bar ${pct === 100 ? "bar-ok" : "bar-wait"}`;
      if (pct < 100) statusEl.style.borderColor = "var(--error)";
    }

    // 3. UPDATE BUTTON STATE (The "Bypass" Logic)
    const saveBtn = el("btn-save-trade");
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.style.cursor = "pointer";
      saveBtn.style.opacity = "1";
      saveBtn.style.transition = "0.3s all";

      if (pct === 100) {
        saveBtn.innerText = "COMMIT RECORD";
        saveBtn.style.background = "var(--accent)";
        saveBtn.style.color = "#000";
        saveBtn.style.border = "none";
      } else {
        saveBtn.innerText = `BYPASS PROTOCOL (${pct}%)`;
        saveBtn.style.background = "transparent";
        saveBtn.style.color = "var(--error)";
        saveBtn.style.border = "1px solid var(--error)";
      }
    }
  }

  function executePlan(id) {
    sysNotify(`EXECUTE → ${id}`, "success");
  }
  function renewPlan(id) {
    sysNotify(`RENEW → ${id}`, "info");
  }
  function abortPlan(id) {
    let trades = JSON.parse(localStorage.getItem("plannedTrades") || "[]");
    trades = trades.filter((t) => t.id !== id);
    localStorage.setItem("plannedTrades", JSON.stringify(trades));
    renderPlannedTrades();

    sysNotify("Plan Removed", "error");
  }

window.executePlan = executePlan;
window.renewPlan = renewPlan;
window.abortPlan = abortPlan;