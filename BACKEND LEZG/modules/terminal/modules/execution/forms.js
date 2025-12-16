   // ---------- MASTER: enforceDirectionSessionInteraction (require user interaction) ----------
window.enforceDirectionSessionInteraction = function () {
    
    const dir = document.getElementById("execution_direction");
    const sess = document.getElementById("execution_session");
    const openBtn =
      document.getElementById("btn-open-trade") ||
      document.getElementById("btnExecuteTrade") ||
      document.querySelector('[data-action="open-trade"]');

    if (!openBtn || !dir || !sess) return;

    // start disabled unless plan intentionally provided both
    let dirTouched = false;
    let sessTouched = false;

    if (window.currentPlan) {
      if (window.currentPlan.direction) dirTouched = true;
      if (window.currentPlan.sess) sessTouched = true;
    }

    function checkUnlock() {
      if (dirTouched && sessTouched) {
        openBtn.disabled = false;
        openBtn.classList.remove("disabled");
        openBtn.style.opacity = "";
      } else {
        openBtn.disabled = true;
        openBtn.classList.add("disabled");
        openBtn.style.opacity = "0.5";
      }
    }

    // Add both click and change so default selection still requires interaction
    dir.addEventListener(
      "click",
      () => {
        dirTouched = true;
        checkUnlock();
      },
      { once: false },
    );
    dir.addEventListener(
      "change",
      () => {
        dirTouched = true;
        checkUnlock();
      },
      { once: false },
    );
    sess.addEventListener(
      "click",
      () => {
        sessTouched = true;
        checkUnlock();
      },
      { once: false },
    );
    sess.addEventListener(
      "change",
      () => {
        sessTouched = true;
        checkUnlock();
      },
      { once: false },
    );

    // Run once to set state
    checkUnlock();
  }

      // ---------- MASTER: STRICT EXECUTION (With Capacity Check) ----------
    // ---------- MASTER: STRICT EXECUTION (With Capacity Check) ----------
  window.executeTradePlanDirect = function (planId) {
    console.log("🚀 STRICT EXECUTION PROTOCOL:", planId);

    // 1. Basic Checks (Login & Portfolio)
    if (!currentUser || currentUser.uid === "guest") {
      playSound("error");
      return sysNotify("LOGIN REQUIRED", "error");
    }
    if (!currentPortfolioId) {
      playSound("error");
      return sysNotify("PORTFOLIO REQUIRED", "error");
    }

    // --- 🚨 NEW: CAPACITY CHECK 🚨 ---
    const maxOpen = parseInt(systemData["s_max_open"] || 999);
    const currentOpen = (window.openTrades || []).length;

    if (currentOpen >= maxOpen) {
      playSound("error");
      return sysNotify(
        `CAPACITY FULL (${currentOpen}/${maxOpen}) — Close a trade first.`,
        "error",
      );
    }
    // ---------------------------------

    // 2. Find the plan
    const plan =
      (window.plannedTrades || []).find(
        (p) => String(p.id) === String(planId),
      ) ||
      (window.activePlans || []).find((p) => String(p.id) === String(planId));

    if (!plan) return sysNotify("Plan not found.", "error");

    // 3. Set Context
    window.currentPlan = plan;

    // 4. Update Header
    const titleEl = document.getElementById("exec-dynamic-title");
    if (titleEl) {
      const isLong = plan.direction === "LONG";
      const dirColor = isLong ? "var(--accent)" : "var(--error)";
      const dirIcon = isLong ? "▲" : "▼";

      titleEl.innerHTML = `
            <span style="color:#fff;">${plan.pair}</span>
            <span style="
                font-size:10px; font-family:var(--font-mono); 
                color:${dirColor}; border:1px solid ${dirColor}; 
                padding:2px 6px; border-radius:3px; background:rgba(0,0,0,0.3);
            ">
                ${dirIcon} ${plan.direction}
            </span>
        `;
    }

    // 5. GET INPUT REFERENCES
    const modal = document.getElementById("tradeInputs_execution");
    const sessionSel = document.getElementById("execution_session");
    const dirSel = document.getElementById("execution_direction");
    const notesInput = document.getElementById("execution_notes");
    const chartInput = document.getElementById("execution_chart");
    const slider = document.getElementById("execution_confidence");
    const sliderLabel = document.getElementById("execution_conf_value");
    const btnExecute = document.getElementById("btn-save-execution");

    // 6. === WIPE DATA & RESET INPUTS ===
    sessionSel.innerHTML = `<option value="" selected disabled>-- SELECT --</option>
                            <option value="LDN">LONDON</option>
                            <option value="NY">NEW YORK</option>
                            <option value="ASIA">ASIAN</option>`;

    dirSel.innerHTML = `<option value="" selected disabled>-- SELECT --</option>
                        <option value="LONG">LONG</option>
                        <option value="SHORT">SHORT</option>`;

    notesInput.value = "";
    notesInput.placeholder = `PLAN NOTES: ${plan.notes.substring(0, 50)}...\n\n(REQUIRED: Confirm current thesis...)`;

    if (chartInput) chartInput.value = "";

    // 7. Slider Reset
    if (slider) {
      slider.value = 5;
      sliderLabel.innerText = "5/10";
      sliderLabel.style.color = "#666";
      slider.style.filter = "grayscale(100%) opacity(0.5)";
      slider.dataset.touched = "false";

      slider.oninput = () => {
        sliderLabel.innerText = `${slider.value}/10`;
        sliderLabel.style.color = "var(--accent)";
        slider.dataset.touched = "true";
        slider.style.filter = "none";
        validateForm();
      };
      // Also allow click-to-activate without moving
      slider.onpointerdown = () => {
        slider.dataset.touched = "true";
        slider.style.filter = "none";
        sliderLabel.style.color = "var(--accent)";
        validateForm();
      };
    }

    // 8. Validation Logic
    const validateForm = () => {
      let isValid = true;
      if (sessionSel.value === "") isValid = false;
      if (dirSel.value === "") isValid = false;
      if (notesInput.value.trim().length < 3) isValid = false; // Min 3 chars
      if (slider && slider.dataset.touched === "false") isValid = false;

      if (isValid) {
        btnExecute.disabled = false;
        btnExecute.style.opacity = "1";
        btnExecute.innerHTML = "<span>▶</span> EXECUTE TRADE";
        btnExecute.style.boxShadow = "0 0 15px rgba(0, 255, 157, 0.2)";
        btnExecute.style.filter = "none";
        btnExecute.style.cursor = "pointer";
      } else {
        btnExecute.disabled = true;
        btnExecute.style.opacity = "0.5";
        btnExecute.innerHTML = "<span>🔒</span> INPUTS REQUIRED";
        btnExecute.style.boxShadow = "none";
        btnExecute.style.filter = "grayscale(100%)";
        btnExecute.style.cursor = "not-allowed";
      }
    };

    sessionSel.onchange = validateForm;
    dirSel.onchange = validateForm;
    notesInput.oninput = validateForm;

    validateForm(); // Initial Lock

    // 9. Show Modal
    modal.style.display = "flex";
    modal.classList.remove("hidden");
    playSound("hover");
  };

    // 1. Redefine the Close Function to Wipe Data
  window.closeExecutionModal = function () {
    const modal = document.getElementById("tradeInputs_execution");
    if (modal) {
      modal.style.display = "none";
      modal.classList.add("hidden");
    }

    // --- AGGRESSIVE FIELD WIPE ---

    // Text Inputs
    const fieldsToClear = [
      "execution_entry",
      "execution_sl",
      "execution_tp",
      "execution_notes",
      "execution_chart",
    ];

    fieldsToClear.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    // Dropdowns (Reset to first option)
    const dropdownsToReset = [
      "execution_session",
      "execution_direction",
      "execution_strategy",
    ];

    dropdownsToReset.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.selectedIndex = 0;
    });

    // Reset Slider
    const slider = document.getElementById("execution_confidence");
    const label = document.getElementById("execution_conf_value");
    if (slider) slider.value = 5;
    if (label) label.textContent = "5/10";

    // Clear Context
    window.currentPlan = null;

    console.log("🧹 Execution inputs wiped clean.");
  };

    const confInput = document.getElementById("execution_confidence");
  const confLabel = document.getElementById("execution_conf_value");

  if (confInput && confLabel) {
    confInput.addEventListener("input", () => {
      confLabel.textContent = `${confInput.value}/10`;
    });
  }

        const closeBtn = document.getElementById("close-execution-modal");
    if (closeBtn) {
      // Clone to remove old listeners
      const newBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newBtn, closeBtn);
      newBtn.onclick = (e) => {
        e.stopPropagation();
        window.closeExecutionModal();
      };
    }

    
    document.addEventListener("DOMContentLoaded", () => {
    // Close button (X)
    const closeBtn = document.getElementById("close-execution-modal");
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeExecutionModal();
        playSound("click");
      };
    }

    // Cancel button
    const cancelBtn = document.getElementById("btn-cancel-execution");
    if (cancelBtn) {
      cancelBtn.onclick = (e) => {
        e.stopPropagation();
        closeExecutionModal();
        playSound("click");
      };
    }

    // Click outside to close
    const modal = document.getElementById("tradeInputs_execution");
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) {
          closeExecutionModal();
        }
      };
    }
  });

      // ESC key to close
  document.addEventListener("keydown", (e) => {
    const modal = document.getElementById("tradeInputs_execution");
    if (e.key === "Escape" && modal && modal.style.display === "flex") {
      closeExecutionModal();
    }
  });

    // Attach close button listener
  setTimeout(() => {
    const closeBtn = document.getElementById("close-execution-modal");
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeExecutionModal();
        playSound("click");
      };
    }
  }, 500);

      // Close on background click
  document.addEventListener("click", (e) => {
    const modal = document.getElementById("tradeInputs_execution");
    if (modal && e.target === modal) {
      closeExecutionModal();
    }
  });

  
  // Close on ESC key
  document.addEventListener("keydown", (e) => {
    const modal = document.getElementById("tradeInputs_execution");
    if (e.key === "Escape" && modal && modal.style.display === "flex") {
      closeExecutionModal();
    }
  });