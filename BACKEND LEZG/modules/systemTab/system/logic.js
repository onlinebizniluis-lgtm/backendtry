  
  // Add this to your main System initialization or a distinct state file
window.forgeEnergy = 3;
window.fluxEnergy = 8;
window.MAX_ENERGY = 3;
window.MAX_FLUX = 8;
window.strategyTags = []; 
window.currentConfigStep = 1;
window.totalConfigSteps = 4;
window.regenInterval = null; // For the ticker
  
  
  
window.setSysLock = function (l) {
    document.querySelectorAll(".sys-inp").forEach((i) => (i.disabled = l));
    const ov = el("params-overlay");
    const st = el("params-status");
    if (ov) ov.style.display = l ? "flex" : "none";
    if (st) {
      st.innerText = l ? "LOCKED" : "UNLOCKED";
      st.classList.toggle("locked", l);
    }
  }
    window.calculateLevel = function() {
    if (isNaN(playerXP)) playerXP = 0;
    // Calculation remains the same (Square Root curve)
    const newLevel = Math.floor(Math.sqrt(playerXP / 100)) + 1;

    if (newLevel > playerLevel && playerLevel !== 1) {
      const overlay = document.getElementById("lvl-up-overlay");
      const titleText = overlay.querySelector(".reward-title");
      const rankText = document.getElementById("lvl-up-rank");
      if (overlay) {
        // REBRANDED LEVEL UP SCREEN
        titleText.innerText = "SYSTEM UPGRADE"; // Was "LEVEL UP!"
        rankText.innerText = `CLEARANCE TIER ${newLevel} GRANTED`;
        overlay.classList.add("active");
        playSound("win");
        setTimeout(() => overlay.classList.remove("active"), 3000);
      }
    }
    playerLevel = newLevel;

    // RANK NAMES (Quant / Spec-Ops Theme)
    let rank = "JUNIOR ANALYST";
    if (playerLevel >= 5) rank = "FIELD OPERATOR";
    if (playerLevel >= 10) rank = "RISK SPECIALIST";
    if (playerLevel >= 20) rank = "HEAD TRADER";
    if (playerLevel >= 50) rank = "MARKET MAKER";

    const lvlEl = document.getElementById("player-level");
    const rankEl = document.getElementById("player-rank");
    if (lvlEl) lvlEl.innerText = playerLevel;
    if (rankEl) rankEl.innerText = rank;

    const currentLevelBaseXP = Math.pow(playerLevel - 1, 2) * 100;
    const nextLevelXP = Math.pow(playerLevel, 2) * 100;
    const levelSpan = nextLevelXP - currentLevelBaseXP;
    const progress = playerXP - currentLevelBaseXP;
    const pct = Math.min(100, Math.max(0, (progress / levelSpan) * 100));

    const bar = document.getElementById("xp-bar");
    const txt = document.getElementById("xp-text");
    if (bar) bar.style.width = `${pct}%`;

    // REBRANDED TEXT: "DP" instead of "XP"
    if (txt) txt.innerText = `${Math.floor(progress)} / ${levelSpan} DATA PTS`;
  }

    // --- NEW FUNCTION: LIVE COUNTDOWN LOGIC ---
window.startRegenTicker = function () {
    if (window.regenInterval) clearInterval(window.regenInterval);

    const updateTimers = () => {
      const now = Date.now();

      // --- ENERGY CALC ---
      const eTimer = document.getElementById("energy-timer");
      if (eTimer) {
        if (forgeEnergy >= MAX_ENERGY) {
          eTimer.innerText = "[FULL]";
        } else {
          const lastForge = systemData["s_last_forge_time"] || now;
          // Determine how many intervals have passed since last use
          const timePassed = now - lastForge;
          const intervalsPassed = Math.floor(timePassed / ENERGY_COOLDOWN);
          // Calculate when the *next* point arrives
          const nextTime = lastForge + (intervalsPassed + 1) * ENERGY_COOLDOWN;
          const diff = nextTime - now;

          // Formatting
          const h = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          eTimer.innerText = `[+1 IN ${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}]`;

          // Auto-refresh logic if timer hits 0
          if (diff <= 1000) initArsenal();
        }
      }

      // --- FLUX CALC ---
      const fTimer = document.getElementById("flux-timer");
      if (fTimer) {
        if (fluxEnergy >= MAX_FLUX) {
          fTimer.innerText = "[FULL]";
        } else {
          const lastRoll = systemData["s_last_reroll_time"] || now;
          const timePassed = now - lastRoll;
          const intervalsPassed = Math.floor(timePassed / FLUX_COOLDOWN);
          const nextTime = lastRoll + (intervalsPassed + 1) * FLUX_COOLDOWN;
          const diff = nextTime - now;

          const h = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          fTimer.innerText = `[+1 IN ${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}]`;

          if (diff <= 1000) initArsenal();
        }
      }
    };

    updateTimers(); // Run once immediately
    window.regenInterval = setInterval(updateTimers, 1000); // Repeat every second
  }
  