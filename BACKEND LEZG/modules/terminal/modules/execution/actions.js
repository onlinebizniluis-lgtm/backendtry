const openTradeBtn = document.getElementById("btn-open-trade");

    // === CORRECTED OPEN TRADE BUTTON HANDLER ===
  if (openTradeBtn) {
    // Remove any existing listeners by cloning
    const cleanBtn = openTradeBtn.cloneNode(true);
    openTradeBtn.parentNode.replaceChild(cleanBtn, openTradeBtn);

    cleanBtn.addEventListener("click", () => {
      // ---- CHECK 1: Must be logged in
      if (!currentUser || currentUser.uid === "guest") {
        playSound("error");
        sysNotify("LOGIN REQUIRED — Please sign in to continue.", "error");
        return;
      }

      // ---- CHECK 3: Planned trades must exist
      if (!window.plannedTrades || window.plannedTrades.length === 0) {
        playSound("error");
        sysNotify("NO ACTIVE PLANS — Prepare a trade plan first.", "error");
        return;
      }

      // ---- CHECK 5: Max open trades rule
      const maxOpen = parseInt(systemData["s_max_open"] || 999);
      const currentOpenTrades = (window.openTrades || []).length;

      if (currentOpenTrades >= maxOpen) {
        playSound("error");
        sysNotify(
          `OPEN TRADE LIMIT REACHED — ${currentOpenTrades}/${maxOpen} active trades.`,
          "error",
        );
        return;
      }

      // ---- ALL GOOD → Open Selection Modal
      playSound("win");

      // FIX: Call the actual function that handles population and event binding
      openTradeModal();
    });
  }

window.closeExecutionModal = function () {
    const modal = document.getElementById("tradeInputs_execution");
    if (modal) {
      modal.style.display = "none";
      modal.classList.add("hidden");
    }

    // Clear form fields
    const entryInput = document.getElementById("execution_entry");
    const confInput = document.getElementById("execution_confidence");
    const confLabel = document.getElementById("execution_conf_value");
    const notesInput = document.getElementById("execution_notes");
    const chartInput = document.getElementById("execution_chart");

    if (entryInput) entryInput.value = "";
    if (confInput) {
      confInput.value = 5;
      if (confLabel) confLabel.textContent = "5/10";
    }
    if (notesInput) notesInput.value = "";
    if (chartInput) chartInput.value = "";

    window.currentPlan = null;
  }

  
  window.executeTradePlan = async function (planId) {
    console.log("🚀 OPENING EXECUTION MODAL FOR PLAN:", planId);

    // 1. Robust ID Find (String vs Number safe)
    const plan =
      window.plannedTrades.find((p) => String(p.id) === String(planId)) ||
      window.activePlans?.find((p) => String(p.id) === String(planId));

    if (!plan) {
      console.error("Plan ID not found:", planId);
      return sysNotify("ERROR: Plan not found. Refresh page.", "error");
    }

    // 2. Set Context
    window.currentPlan = plan;

    // 3. Find Modal Elements
    const execModal = document.getElementById("tradeInputs_execution");
    const execEntry = document.getElementById("execution_entry");

    if (!execModal) return sysNotify("Execution Modal HTML Missing", "error");

    // 4. Pre-fill Data
    const execDir = document.getElementById("execution_direction");
    const execNotes = document.getElementById("execution_notes");
    const execChart = document.getElementById("execution_chart");

    if (execDir) execDir.value = plan.direction || "LONG";

    // Nice context notes
    if (execNotes) {
      execNotes.value = `EXECUTING: ${plan.pair} (${plan.setup})\n\nPLAN NOTES: ${plan.notes || ""}`;
    }

    if (execChart && plan.screenshot) execChart.value = plan.screenshot;

    // 5. AUTO-FILL LIVE PRICE (But keep it editable)
    if (execEntry) {
      // Show loading state
      execEntry.value = "Fetching...";
      execEntry.disabled = true;
      execEntry.style.opacity = "0.6";

      // Fetch current market price
      getCurrentPrice(plan.pair)
        .then((price) => {
          execEntry.disabled = false;
          execEntry.style.opacity = "1";

          if (price) {
            execEntry.value = formatPrice(price, plan.pair);
            execEntry.style.color = "var(--accent)";
            execEntry.style.fontWeight = "600";

            // Add visual indicator
            execEntry.setAttribute(
              "placeholder",
              `Live: ${formatPrice(price, plan.pair)}`,
            );

            sysNotify(
              `LIVE PRICE: ${formatPrice(price, plan.pair)}`,
              "success",
            );
          } else {
            execEntry.value = "";
            execEntry.placeholder = "Enter price manually";
            execEntry.style.color = "#fff";
            sysNotify("Price fetch failed - enter manually", "error");
          }
        })
        .catch((error) => {
          execEntry.disabled = false;
          execEntry.style.opacity = "1";
          execEntry.value = "";
          execEntry.placeholder = "Enter price manually";
          console.error("Price fetch error:", error);
        });
    }

    // Clear SL/TP (user will set these)
    if (document.getElementById("execution_sl"))
      document.getElementById("execution_sl").value = "";
    if (document.getElementById("execution_tp"))
      document.getElementById("execution_tp").value = "";
    // 6. Show Modal
    execModal.style.display = "flex";
    // --- Ensure execution modal can close properly ---
    const closeExecBtn = document.getElementById("close-execution-modal");
    const cancelExecBtn = document.getElementById("btn-cancel-execution");

    function closeExecutionModal() {
      execModal.style.display = "none";
      playSound("cancel");
    }

    if (closeExecBtn) closeExecBtn.onclick = closeExecutionModal;
    if (cancelExecBtn) cancelExecBtn.onclick = closeExecutionModal;

    // 7. Focus & Init
    if (execEntry) setTimeout(() => execEntry.focus(), 100);

    // Reset Slider
    const slider = document.getElementById("execution_confidence");
    const label = document.getElementById("execution_conf_value");
    if (slider && label) {
      slider.value = 5;
      label.textContent = "5/10";
      slider.oninput = () => (label.textContent = `${slider.value}/10`);
    }

    // 8. Close Handler (Background Click)
    execModal.onclick = (e) => {
      if (e.target === execModal) execModal.style.display = "none";
    };

    playSound("win");
  };

        document.addEventListener("DOMContentLoaded", () => {
    // 'X' Button
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

    // 'Cancel' Button
    const cancelBtn = document.getElementById("btn-cancel-execution");
    if (cancelBtn) {
      const newCancel = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
      newCancel.onclick = (e) => {
        e.stopPropagation();
        window.closeExecutionModal();
      };
    }

    // Background Click
    const modal = document.getElementById("tradeInputs_execution");
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) window.closeExecutionModal();
      };
    }
  });

    // --- STEP 1: EXECUTE BUTTON (Carries Score from Plan to Open Trade) ---
  document.addEventListener("DOMContentLoaded", () => {
    const confirmExecBtn = document.getElementById("btn-save-execution");
    if (!confirmExecBtn) return;

    // Clear old listeners to prevent duplicates
    const cleanConfirm = confirmExecBtn.cloneNode(true);
    confirmExecBtn.parentNode.replaceChild(cleanConfirm, confirmExecBtn);

    cleanConfirm.addEventListener("click", async () => {
      if (!window.currentPlan)
        return sysNotify("ERROR: No active plan context.", "error");

      // 1. LOCK SCREEN
      window.toggleProcessing(true, "EXECUTING ORDER...");

      try {
        const finalSess =
          document.getElementById("execution_session").value || "LDN";
        const finalDir =
          document.getElementById("execution_direction")?.value || "LONG";
        const finalNotes =
          document.getElementById("execution_notes")?.value || "";
        const finalChart =
          document.getElementById("execution_chart")?.value || "";
        const finalConf =
          document.getElementById("execution_confidence")?.value || "5";

        const carriedChecklist = window.currentPlan.checklist || [];
        const carriedScore =
          window.currentPlan.discipline !== undefined
            ? parseInt(window.currentPlan.discipline)
            : 0;

        const newOpenTrade = {
          id: Date.now(), // Generate ID here
          planId: window.currentPlan.id,
          pair: window.currentPlan.pair,
          sess: finalSess,
          setup: window.currentPlan.setup,
          direction: finalDir,
          confidence: finalConf,
          notes: finalNotes,
          screenshot: finalChart,
          status: "OPEN",
          openTime: Date.now(),
          discipline: carriedScore,
          checklist: carriedChecklist,
        };

        if (!window.openTrades) window.openTrades = [];
        window.openTrades.unshift(newOpenTrade);

        // Remove from planned
        window.plannedTrades = window.plannedTrades.filter(
          (p) => String(p.id) !== String(window.currentPlan.id),
        );

        // AWAIT BOTH SAVES
        await saveData("plans");
        await saveData("openTrades");

        if (typeof renderPlannedTrades === "function") renderPlannedTrades();
        if (typeof renderOpenTrades === "function") renderOpenTrades();

        document.getElementById("tradeInputs_execution").style.display = "none";
        sysNotify("TRADE IS LIVE", "success");
        playSound("win");
      } catch (e) {
        console.error(e);
        sysNotify("EXECUTION FAILED", "error");
      } finally {
        // 2. UNLOCK
        window.toggleProcessing(false);
      }
    });
  });

    // 3. Ensure Save Button calls the Wipe function on success
  const confirmExecBtn = document.getElementById("btn-save-execution");
  if (confirmExecBtn) {
    // We add a listener that runs AFTER the main logic to clean up
    confirmExecBtn.addEventListener("click", () => {
      // Give the main logic 200ms to save data, then wipe
      setTimeout(() => {
        if (
          document.getElementById("tradeInputs_execution").style.display ===
          "none"
        ) {
          window.closeExecutionModal();
        }
      }, 200);
    });
  }

  