
    window.changeConfigStep = function (direction) {
    const newStep = currentConfigStep + direction;

    // Boundary Checks
    if (newStep < 1 || newStep > totalConfigSteps) return;

    // Validation (Prevent moving forward if empty)
    if (direction === 1) {
      const currentContainer = document.getElementById(
        `c-step-${currentConfigStep}`,
      );
      // Select inputs but EXCLUDE the strategy builder text box
      const inputs = currentContainer.querySelectorAll(
        "input:not(#strat-input-field), textarea",
      );

      let valid = true;
      inputs.forEach((i) => {
        // Check if value is empty
        if (!i.value.trim()) {
          // For hidden inputs (like the strategy list), show a generic error
          if (i.type === "hidden") {
            // Only error if the list is actually empty
            valid = false;
          } else {
            // For visible inputs, highlight them red
            i.style.borderBottomColor = "var(--error)";
            valid = false;
            i.addEventListener(
              "input",
              function () {
                this.style.borderBottomColor = "#333";
              },
              { once: true },
            );
          }
        }
      });

      if (!valid) {
        sysNotify("FIELD REQUIRED", "error");
        if (typeof playSound === "function") playSound("error");
        return;
      }
    }

    // Hide Current
    document
      .getElementById(`c-step-${currentConfigStep}`)
      .classList.remove("active");

    // Update State
    currentConfigStep = newStep;

    // Show New
    document
      .getElementById(`c-step-${currentConfigStep}`)
      .classList.add("active");

    // Update Progress Dots
    for (let i = 1; i <= totalConfigSteps; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (dot) {
        dot.classList.remove("active", "passed");
        if (i === currentConfigStep) dot.classList.add("active");
        if (i < currentConfigStep) dot.classList.add("passed");
      }
    }

    // Handle Buttons
    const nextBtn = document.getElementById("wiz-next");
    const prevBtn = document.getElementById("wiz-prev");

    if (prevBtn)
      prevBtn.style.visibility = currentConfigStep === 1 ? "hidden" : "visible";

    // Hide "Next" on last step
    if (nextBtn) {
      if (currentConfigStep === totalConfigSteps) {
        nextBtn.style.display = "none";
      } else {
        nextBtn.style.display = "block";
      }
    }

    if (typeof playSound === "function") playSound("hover");
  };

  
  window.addXP = function(amount) {
    // 1. Sanity Check: Prevent massive jumps
    if (amount > 1000) {
      console.warn("Suspicious XP gain detected. Action blocked.");
      sysNotify("SYSTEM ALERT: ANOMALY DETECTED", "error");
      return;
    }

    playerXP += amount;
    systemData["s_xp"] = playerXP;
    saveData("system");
    calculateLevel();
    sysNotify(`+${amount} DATA POINTS UPLOADED`, "success");
    playSound("win");
  }

      // REPLACE YOUR EXISTING initArsenal FUNCTION WITH THIS
window.initArsenal = function() {
    const now = Date.now();
    let dataChanged = false; // Flag to track if we need to auto-save repairs

    // --- 1. DATA POINTS ---
    playerXP = parseInt(systemData["s_xp"] || 0);
    calculateLevel();

    // --- 2. WEEKLY BOUNTY LOGIC ---
    const day = new Date().getDay();
    const diffToMon = new Date().getDate() - day + (day === 0 ? -6 : 1);
    const lastMonday = new Date(new Date().setDate(diffToMon)).setHours(
      0,
      0,
      0,
      0,
    );
    const lastGen = systemData["s_bounty_gen_date"] || 0;

    if (lastGen < lastMonday) {
      generateNewBounty();
      systemData["s_bounty_unlocked"] = false;
      systemData["s_bounty_gen_date"] = now;
      dataChanged = true;
    } else {
      currentBounty = systemData["s_bounty"] || "UPTREND";
    }

    // --- 3. ENERGY (EXECUTION) CALCULATION [WITH REPAIR] ---
    let storedEnergy =
      systemData["s_forge_energy"] !== undefined
        ? parseInt(systemData["s_forge_energy"])
        : MAX_ENERGY;
    let lastForgeTime = parseInt(systemData["s_last_forge_time"]);

    // >> CORRUPTION CHECK 1: If time is NaN, Missing, or Future <<
    if (!lastForgeTime || isNaN(lastForgeTime) || lastForgeTime > now) {
      console.warn("⚠️ REPAIRING CORRUPTED ENERGY TIMER");
      lastForgeTime = now;
      storedEnergy = MAX_ENERGY; // Default to full if data broken
      systemData["s_last_forge_time"] = now;
      systemData["s_forge_energy"] = MAX_ENERGY;
      dataChanged = true;
    }

    if (storedEnergy < MAX_ENERGY) {
      const passed = now - lastForgeTime;
      const gained = Math.floor(passed / ENERGY_COOLDOWN);

      if (gained > 0) {
        storedEnergy += gained;
        if (storedEnergy >= MAX_ENERGY) {
          storedEnergy = MAX_ENERGY;
        } else {
          // Advance timestamp without losing partial progress
          lastForgeTime += gained * ENERGY_COOLDOWN;
        }
        systemData["s_forge_energy"] = storedEnergy;
        systemData["s_last_forge_time"] = lastForgeTime;
        dataChanged = true;
      }
    }
    forgeEnergy = storedEnergy;

    // --- 4. FLUX (SCANNING) CALCULATION [WITH REPAIR] ---
    let storedFlux =
      systemData["s_flux_energy"] !== undefined
        ? parseInt(systemData["s_flux_energy"])
        : MAX_FLUX;
    let lastRerollTime = parseInt(systemData["s_last_reroll_time"]);

    // >> CORRUPTION CHECK 2: If time is NaN, Missing, or Future <<
    if (!lastRerollTime || isNaN(lastRerollTime) || lastRerollTime > now) {
      console.warn("⚠️ REPAIRING CORRUPTED FLUX TIMER");
      lastRerollTime = now;
      storedFlux = MAX_FLUX; // Default to full if data broken
      systemData["s_flux_energy"] = MAX_FLUX;
      systemData["s_last_reroll_time"] = now;
      dataChanged = true;
    }

    if (storedFlux < MAX_FLUX) {
      const passedFlux = now - lastRerollTime;
      const fluxGained = Math.floor(passedFlux / FLUX_COOLDOWN);

      if (fluxGained > 0) {
        storedFlux += fluxGained;
        if (storedFlux >= MAX_FLUX) {
          storedFlux = MAX_FLUX;
        } else {
          lastRerollTime += fluxGained * FLUX_COOLDOWN;
        }
        systemData["s_flux_energy"] = storedFlux;
        systemData["s_last_reroll_time"] = lastRerollTime;
        dataChanged = true;
      }
    }
    fluxEnergy = storedFlux;

    // --- SAVE REPAIRS IF NEEDED ---
    if (dataChanged) {
      saveData("system");
    }

    // UI Render
    updateBountyUI();
    updateStaminaUI();
    renderArsenal();
  };

      window.initStrategyBuilder = function() {
    const rawData = systemData["s_setups"] || "";

    // Split by comma or newline, clean up empty strings
    if (rawData) {
      strategyTags = rawData
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else {
      strategyTags = [];
    }

    renderStrategyTags();
  }

    document.getElementById("btn-add-strat-tag").addEventListener("click", () => {
    const input = document.getElementById("strat-input-field");
    const val = input.value.trim().toUpperCase(); // Force Uppercase for consistency

    if (!val) return;

    if (strategyTags.includes(val)) {
      sysNotify("STRATEGY ALREADY EXISTS", "error");
      return;
    }

    strategyTags.push(val);
    input.value = ""; // Clear input
    renderStrategyTags();
    playSound("hover");
  });
  document.getElementById("strat-input-field")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter")
        document.getElementById("btn-add-strat-tag").click();
    });

       // === UNLOCK WEEKLY BOUNTY (ANIMATION & COST) ===
  window.unlockWeeklyBounty = async function () {
    // 1. Check Cost (3 Flux)
    if (fluxEnergy < 3) {
      if (typeof playSound === "function") playSound("error");
      sysNotify(
        `INSUFFICIENT FLUX. REQUIRED: 3 | CURRENT: ${fluxEnergy}`,
        "error",
      );
      return;
    }

    if (
      !(await sysConfirm(
        "DECRYPT WEEKLY SIGNAL",
        "This requires significant computing power.<br><b>COST: 3 FLUX</b><br><br>Proceed with decryption?",
        false,
      ))
    ) {
      return;
    }

    // 2. Deduct Flux & Save State
    if (typeof playSound === "function") playSound("click");

    fluxEnergy -= 3;
    systemData["s_flux_energy"] = fluxEnergy;
    systemData["s_last_reroll_time"] = Date.now(); // Reset timer logic

    systemData["s_bounty_unlocked"] = true; // UNLOCK PERMANENTLY FOR WEEK

    await saveData("system");
    updateStaminaUI(); // Update bars immediately

    // 3. PLAY "GOLDEN CIPHER" ANIMATION
    const overlay = document.createElement("div");
    overlay.className = "sys-modal-overlay";
    document.body.appendChild(overlay);

    overlay.innerHTML = `
        <div class="sys-modal" style="width: 450px; border:1px solid #ffd700; box-shadow: 0 0 50px rgba(255, 215, 0, 0.2); background:#050505;">
            <div class="quest-reveal-container" style="display:block; border:none; background:transparent; padding:40px;">
                
                <!-- GOLD RADAR -->
                <div class="gold-radar">
                    <div class="gold-sweep"></div>
                </div>
                
                <div class="cipher-text" id="cipher-output">
                    00000000
                </div>
                
                <div class="quest-sub" style="color:#eebb00; margin-top:15px; font-weight:bold;">
                    BREAKING ENCRYPTION LAYERS...
                </div>
                
                <div style="width:100%; height:4px; background:#222; margin-top:20px; border-radius:2px;">
                    <div id="cipher-bar" style="width:0%; height:100%; background:#ffd700; box-shadow:0 0 10px #ffd700; transition:width 0.1s linear;"></div>
                </div>
            </div>
        </div>
    `;

    // 4. ANIMATION LOGIC (Scramble Text)
    const output = document.getElementById("cipher-output");
    const bar = document.getElementById("cipher-bar");
    const targetText = currentBounty.toUpperCase(); // e.g. "UPTREND"
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let progress = 0;

    const interval = setInterval(() => {
      progress += 2; // Speed
      bar.style.width = progress + "%";

      // Scramble Effect
      let scrambled = "";
      for (let i = 0; i < targetText.length; i++) {
        if (i * (100 / targetText.length) < progress) {
          scrambled += targetText[i]; // Reveal char
        } else {
          scrambled += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      output.innerText = scrambled;

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          // Done. Close animation and refresh UI to show the unlocked button.
          overlay.remove();
          if (typeof playSound === "function") playSound("win");
          sysNotify("SIGNAL DECRYPTED. CONTRACT AVAILABLE.", "success");
          initArsenal(); // Re-render to show the "Open Contract" button

          // Optional: Auto-open the contract immediately
          setTimeout(() => window.openWeeklyBountyModal(currentBounty), 500);
        }, 800);
      }
    }, 30); // Fast ticks
  };

    // Ensure Arsenal Inits
  const _prevLoad = loadData;
  loadData = async function () {
    await _prevLoad();
    initArsenal();
  };
  
    // 4. Remove Function
  window.removeStrategyTag = (index) => {
    strategyTags.splice(index, 1);
    renderStrategyTags();
    playSound("click");
  };
