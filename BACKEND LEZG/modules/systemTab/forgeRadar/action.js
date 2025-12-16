 // === MASTER MARKET RADAR LISTENER (FIXED PERSISTENCE) ===
  setTimeout(() => {
    const forgeBtn = document.getElementById("btn-forge-rule");
    if (forgeBtn) {
      // Clone button to ensure no duplicate listeners exist
      const newForgeBtn = forgeBtn.cloneNode(true);
      forgeBtn.parentNode.replaceChild(newForgeBtn, forgeBtn);

      newForgeBtn.addEventListener("click", async () => {
        // 1. CHECK BALANCE
        if (fluxEnergy <= 0) {
          if (typeof playSound === "function") playSound("error");
          return sysNotify("FLUX DEPLETED. RECHARGE REQUIRED.", "error");
        }

        if (typeof playSound === "function") playSound("click");

        // 2. CHECK TIMER STATE BEFORE SPENDING
        const isFull = fluxEnergy >= MAX_FLUX;

        // 3. DEDUCT FLUX
        fluxEnergy--;
        systemData["s_flux_energy"] = fluxEnergy;

        // 4. SET TIMER ANCHOR IF WE JUST DROPPED FROM MAX
        // If we were not full, the timer is already running; don't touch it.
        if (isFull) {
          systemData["s_last_reroll_time"] = Date.now();
        }

        // 5. SAVE IMMEDIATELY
        await saveData("system");

        // 6. UPDATE UI
        updateStaminaUI();

        // 7. GENERATE NEW DATA
        const possibleQuests = ["UPTREND", "DOWNTREND", "CONSOLIDATION"];
        const randomQuest =
          possibleQuests[Math.floor(Math.random() * possibleQuests.length)];
        const randomXP = Math.floor(Math.random() * 101) + 100;

        systemData["active_mission_target"] = randomQuest;
        systemData["active_mission_xp"] = randomXP;
        // No need to save again here, we saved above, but saving systemData is cheap
        saveData("system");

        // 8. SHOW RADAR ANIMATION
        const overlay = document.createElement("div");
        overlay.className = "sys-modal-overlay";
        document.body.appendChild(overlay);

        overlay.innerHTML = `
                <div class="sys-modal" style="width: 400px; border:1px solid #333; box-shadow: 0 0 40px rgba(0,0,0,0.5);">
                    <div class="quest-reveal-container" style="display:block; border:none; background:transparent;">
                        <div class="radar-scanner">
                            <div class="radar-sweep"></div>
                        </div>
                        <div class="quest-glitch-text" id="quest-ticker" style="color:var(--accent); text-shadow:0 0 10px var(--accent); font-size:18px;">
                            SCANNING SECTOR...
                        </div>
                        <div class="quest-sub" style="color:#666;">FLUX CONSUMED [-1]. ACQUIRING TARGET.</div>
                    </div>
                </div>
            `;

        // ANIMATION TIMER
        const ticker = document.getElementById("quest-ticker");
        const targets = [
          "UPTREND",
          "DOWNTREND",
          "CONSOLIDATION",
          "STRUCTURE",
          "LIQUIDITY",
        ];
        let ticks = 0;

        const interval = setInterval(() => {
          ticker.innerText =
            targets[Math.floor(Math.random() * targets.length)];
          ticks++;
          if (ticks >= 12) {
            clearInterval(interval);
            showForgeModal(overlay, randomQuest, randomXP);
          }
        }, 100);
      });
    }
  }, 500);