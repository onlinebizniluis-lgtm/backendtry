  function openPlanningModal() {
    // ========================================
    // 1. RESET ALL STATE
    // ========================================
    window.currentChecklistScore = 0;
    window.currentPlan = null;
    window.planningMode = true;

    // ========================================
    // 2. CLEAR ALL INPUT FIELDS
    // ========================================

    // Clear text inputs
    const clearInputs = ["entry-pair", "j_notes", "j_chart", "plan_expiration"];

    clearInputs.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    // Reset Direction to first option (not pre-selected)
    const dirSelect =
      document.querySelector('[data-key="j_direction"]') ||
      document.getElementById("j_direction");
    if (dirSelect) dirSelect.selectedIndex = 0; // "SELECT" option

    // Reset Session to first option
    const sessSelect =
      document.querySelector('[data-key="j_sess"]') ||
      document.getElementById("j_sess");
    if (sessSelect) sessSelect.selectedIndex = 0;

    // Reset Setup to first option
    const setupSelect =
      document.querySelector('[data-key="j_setup"]') ||
      document.getElementById("j_setup");
    if (setupSelect) setupSelect.selectedIndex = 0;

    // Reset Plan Expiration
    const expireSelect = document.getElementById("plan_expiration");
    if (expireSelect) expireSelect.selectedIndex = 0; // Default 24hrs

    // ========================================
    // 3. OPEN MODAL
    // ========================================
    applyPlanningModeUI();
    const planModal = document.getElementById("plan-modal");
    planModal.classList.remove("hidden");

 

    // attach confirm actions once
  const confirmBtn = document.getElementById("confirm-plan-btn");

  if (confirmBtn && !confirmBtn.dataset.bound) {
    confirmBtn.dataset.bound = "true";

    confirmBtn.onclick = () => {
      saveTradePlan();
      closePlanningModal();
      document.getElementById("confirm-plan-modal").classList.add("hidden");
      playSound("win");
      showToast("Trade plan saved.", "success");
    };
  }

  // close


    // ========================================
    // 4. POPULATE DROPDOWNS (AFTER clearing)
    // ========================================
    updateSetupDropdown();

    // ========================================
    // 5. RESET CHECKLIST TO NEUTRAL
    // ========================================
    if (typeof renderPlanningChecklist === "function") {
      renderPlanningChecklist(); // This will set all to "/"
    }

    // ========================================
    // 6. FORCE SWITCH TO CHECKLIST TAB
    // ========================================
    const chkTab = document.querySelector(
      '.plan-tab[data-section="checklist"]',
    );
    if (chkTab) chkTab.click();

    // ========================================
    // 7. SHOW/HIDE CORRECT FIELDS
    // ========================================
    // ========================================
    // 7. SHOW/HIDE CORRECT FIELDS
    // ========================================
    const allowed = [
      "entry-pair",
      "j_direction",
      "j_sess",
      "j_setup",
      "term-setup-select", // ← ADDED
      "j_date_display",
      "j_notes",
      "j_chart",
      "plan_expiration",
    ];

    document.querySelectorAll("#entry-module .f-group").forEach((row) => {
      const input = row.querySelector("input, select, textarea");
      if (input) {
        const key = input.id || input.getAttribute("data-key");
        row.style.display = allowed.includes(key) ? "block" : "none";
      }
    });

    // ✅ FORCE SHOW STRATEGY FIELD (Failsafe)
    const strategyField = document.querySelector(
      '#entry-module [data-key="j_setup"]',
    );
    if (strategyField) {
      const parentRow = strategyField.closest(".f-group");
      if (parentRow) {
        parentRow.style.display = "block";
        console.log("✅ Strategy field forced visible");
      }
    } else {
      console.error("❌ Strategy field not found in entry-module");
    }

    document.querySelectorAll("#entry-module .f-group").forEach((row) => {
      const input = row.querySelector("input, select, textarea");
      if (input) {
        const key = input.id || input.getAttribute("data-key");
        row.style.display = allowed.includes(key) ? "block" : "none";
      }
    });

    // ========================================
    // 8. INJECT EXPIRATION DROPDOWN (if missing)
    // ========================================
    if (!document.getElementById("plan_expiration")) {
      const setupField = document.querySelector('[data-key="j_setup"]');
      if (setupField) {
        const row = setupField.closest(".f-group");
        const expRow = document.createElement("div");
        expRow.className = "f-group";
        expRow.innerHTML = `
                <label>PLAN EXPIRATION</label>
                <select id="plan_expiration" class="inp-std">
                    <option value="24">24 Hours (Default)</option>
                    <option value="12">12 Hours</option>
                    <option value="48">48 Hours</option>
                    <option value="72">72 Hours</option>
                    <option value="168">1 Week</option>
                </select>`;
        row.after(expRow);
      }
    }

    // ========================================
    // 9. UPDATE PLACEHOLDER TEXT
    // ========================================
    const notesInput = document.querySelector('[data-key="j_notes"]');
    if (notesInput) {
      notesInput.placeholder =
        "Describe trade thesis: bias, entry trigger, invalidation, confidence.";
    }
  }

    function applyPlanningModeUI() {
    // Fields we hide when planning mode is active
    const hideList = ["j_res", "j_rr", "j_score"];

    hideList.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const parentRow = el.closest(".f-group");
      if (!parentRow) return;

      parentRow.style.display = window.planningMode ? "none" : "";
    });

    // Change commit button text depending on mode
    const btn = document.getElementById("btn-save-trade");
    if (btn) {
      btn.textContent = window.planningMode
        ? "SAVE TRADE PLAN"
        : "COMMIT RECORD";
    }
  }

  window.closePlanningModal = function() {
    if (typeof applyPlanningModeUI === "function") {
        applyPlanningModeUI();
    }

    window.planningMode = false; 

    // Re-select the element to be safe
    const planModal = document.getElementById("plan-modal");
    if (planModal) {
        planModal.classList.add("hidden");
    }
}


    const closePlanModal = document.getElementById("close-plan-modal");

  if (closePlanModal)
    closePlanModal.addEventListener("click", closePlanningModal);

    document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePlanningModal();
  });

    const initPlanBtn = document.getElementById("btn-init-plan");

  if (initPlanBtn) {
    initPlanBtn.onclick = () => {
      // ---- CHECK 1: Must be logged in
      if (!currentUser || currentUser.uid === "guest") {
        playSound("error");
        sysNotify("LOGIN REQUIRED — Please sign in to continue.", "error");
        return;
      }

      // ---- CHECK 2: Portfolio must exist
      if (!currentPortfolioId) {
        playSound("error");
        sysNotify(
          "PORTFOLIO REQUIRED — Select or create a portfolio to proceed.",
          "error",
        );
        return;
      }

      // ---- CHECK 3: System setup must be completed
      const ready =
        systemData &&
        systemData["s_style"] &&
        systemData["s_risk"] &&
        systemData["s_max_loss"] &&
        systemData["s_setups"];
      if (!ready) {
        playSound("error");
        sysNotify("SETUP INCOMPLETE — Configure your system first.", "error");

        // auto navigate to system tab
        document
          .querySelectorAll(".nav-btn")
          .forEach((b) => b.classList.remove("active"));
        document
          .querySelector('[data-target="tab-sys"]')
          .classList.add("active");
        document.querySelectorAll(".view-section").forEach((s) => {
          s.style.display = "none";
          s.classList.remove("active");
        });
        const sysTab = document.getElementById("tab-sys");
        if (sysTab) {
          sysTab.style.display = "block";
          sysTab.classList.add("active");
        }
        return;
      }

      // ---- 🆕 NEW CHECK 4: Max Planned Trades Restriction ----
      const maxPlanned = parseInt(systemData["s_max_planned"] || 999);
      const currentPlans = (window.plannedTrades || []).length;

      if (currentPlans >= maxPlanned) {
        playSound("error");
        sysNotify(
          `CAPACITY REACHED — You have ${currentPlans} planned trades. Execute or abort existing plans to add new ones. (Limit: ${maxPlanned})`,
          "error",
        );
        return;
      }

      // ---- ALL GREEN → open planning modal ----
      openPlanningModal();
    };
  }

  window.enablePlanningMode = function (pair) {
    window.planningMode = true;

    document.getElementById("tradeInputs_standard").style.display = "none";
    document.getElementById("tradeInputs_plan").style.display = "block";

    document.getElementById("plan_pair").value = pair || "";
  }

window.disablePlanningMode = function () {
    window.planningMode = false;

    document.getElementById("tradeInputs_standard").style.display = "block";
    document.getElementById("tradeInputs_plan").style.display = "none";
  }

  const riskModule = document.querySelector(".risk-container");
  const list = document.getElementById("plannedTradeList");
  const modalBody = document.getElementById("plan-modal-body");