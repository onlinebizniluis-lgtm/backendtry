window.updateSystemUI = function(lock) {
    // 1) Hydrate inputs from systemData
    document.querySelectorAll(".sys-inp").forEach((i) => {
      if (systemData[i.dataset.key] !== undefined) {
        i.value = systemData[i.dataset.key];
      }
    });

    // 2) In demo mode, always unlocked
    if (isDemo) {
      setSysLock(false);
      return;
    }

    const hasData = Object.keys(systemData).length > 0;
    const nextUnlock = systemData["next_unlock"] || 0;
    // LOCK LOGIC: Locked if data exists AND current time is BEFORE unlock time
    // If "lock" argument is passed (from Force Unlock), respect it.
    const locked =
      lock !== undefined ? lock : hasData && Date.now() < nextUnlock;

    // 3) Apply lock overlay + disabled state
    setSysLock(locked);

    // 4) Progress bar + countdown (7-day cycle)
    if (locked && nextUnlock) {
      const totalDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
      const timeLeft = nextUnlock - Date.now();
      const timePassed = Math.max(0, totalDuration - timeLeft);
      const pct = Math.max(
        0,
        Math.min(100, (timePassed / totalDuration) * 100),
      );
      const daysLeft = Math.max(0, Math.ceil(timeLeft / 86400000));

      const bar = document.getElementById("strat-bar");
      const timer = document.getElementById("strat-timer");
      if (bar) bar.style.width = pct + "%";
      if (timer) {
        timer.innerText = `NEXT SYNC: ${daysLeft} DAY${daysLeft === 1 ? "" : "S"}`;
      }
    }
  }

  window.updateStaminaUI = function() {
    // 1. Green Energy (Execution Power)
    for (let i = 1; i <= MAX_ENERGY; i++) {
      const pip = document.getElementById(`stam-${i}`);
      if (pip) {
        if (i <= forgeEnergy) pip.classList.add("active");
        else pip.classList.remove("active");
      }
    }

    // Inject Energy Timer if missing
    const engLabel = document.querySelector(".stamina-label");
    if (engLabel && !document.getElementById("energy-timer")) {
      const timer = document.createElement("span");
      timer.id = "energy-timer";
      timer.className = "regen-timer energy";
      engLabel.appendChild(timer);
    }

    // 2. Flux (Scanning Power) - Dynamic Injection
    let fluxCont = document.getElementById("flux-container");

    if (!fluxCont) {
      const stamCont = document.querySelector(".stamina-container");
      if (stamCont) {
        const div = document.createElement("div");
        div.id = "flux-container";
        div.className = "flux-container";
        div.title = "Flux recharges +1 every 6 hours";

        const label = document.createElement("span");
        label.className = "flux-label";
        label.innerHTML = "FLUX";

        // Inject Flux Timer span immediately
        const timer = document.createElement("span");
        timer.id = "flux-timer";
        timer.className = "regen-timer flux";
        label.appendChild(timer);

        div.appendChild(label);

        for (let k = 1; k <= MAX_FLUX; k++) {
          const pip = document.createElement("div");
          pip.className = "flux-pip";
          pip.id = `flux-${k}`;
          div.appendChild(pip);
        }

        stamCont.insertAdjacentElement("afterend", div);
        fluxCont = div;
      }
    }

    // Update Flux Visuals
    for (let i = 1; i <= MAX_FLUX; i++) {
      const pip = document.getElementById(`flux-${i}`);
      if (pip) {
        if (i <= fluxEnergy) {
          pip.classList.add("active");
          pip.style.opacity = "1";
        } else {
          pip.classList.remove("active");
          pip.style.opacity = "0.3";
        }
      }
    }

    // 3. Update Button State
    const btn = document.getElementById("btn-forge-rule");
    if (btn) {
      if (fluxEnergy <= 0) {
        btn.style.opacity = "0.5";
        btn.innerHTML = "[ RADAR OFFLINE ]";
        btn.style.cursor = "not-allowed";
        btn.style.borderColor = "var(--error)";
        btn.style.color = "var(--error)";
      } else {
        btn.style.opacity = "1";
        btn.innerHTML = `MARKET RADAR <span style="font-size:9px; opacity:0.7; margin-left:5px;">[-1 FLUX]</span>`;
        btn.style.cursor = "pointer";
        btn.style.borderColor = "var(--accent)";
        btn.style.color = "var(--accent)";
      }
    }

    // START THE LIVE COUNTDOWN
    startRegenTicker();
  }

window.renderStrategyTags = function () {
    const container = document.getElementById("strat-list-display");
    const hiddenInput = document.getElementById("hidden_s_setups");
    if (!container || !hiddenInput) return;

    // Update Hidden Input (Comma separated for DB)
    hiddenInput.value = strategyTags.join(",");

    // Render UI
    if (strategyTags.length === 0) {
      container.innerHTML = `<div style="width:100%; text-align:center; color:#444; font-size:10px; padding-top:30px;">NO STRATEGIES DEFINED</div>`;
    } else {
      container.innerHTML = strategyTags
        .map(
          (tag, index) => `
            <div class="strat-tag">
                <span>●</span> ${tag}
                <div class="strat-tag-del" onclick="removeStrategyTag(${index})">✕</div>
            </div>
        `,
        )
        .join("");
    }
  }

window.updateBountyUI = function () {
    const bountyEl = document.getElementById("bounty-target");
    const bountyBox = document.querySelector(".bounty-box");

    if (!bountyEl || !bountyBox) return;

    // --- 1. TIME CALCULATIONS ---
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon...

    // Check if claimed this week (Since last Monday)
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const lastMonday = new Date(new Date().setDate(diffToMon)).setHours(
      0,
      0,
      0,
      0,
    );
    const lastClaim = systemData["s_bounty_claimed_date"] || 0;
    const isClaimed = lastClaim > lastMonday;

    // Calculate Time to Next Refresh (Next Monday)
    const daysUntilNextMon = (1 + 7 - day) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilNextMon);
    nextMonday.setHours(0, 0, 0, 0);

    const msUntilRefresh = nextMonday - now;
    const hoursLeft = Math.floor(msUntilRefresh / (1000 * 60 * 60));
    const daysLeft = Math.floor(hoursLeft / 24);
    const remHours = hoursLeft % 24;

    const isUnlocked = systemData["s_bounty_unlocked"] === true;

    // Clean up old elements
    const oldBtns = bountyBox.querySelectorAll("button");
    oldBtns.forEach((b) => b.remove());
    const defaultRewardDiv = bountyBox.querySelector(".bounty-reward");
    const headerTitle = bountyBox.querySelector("h3");

    // ============================================================
    // STATE 1: COOLDOWN (COMPLETED)
    // ============================================================
    if (isClaimed) {
      bountyBox.className = "bounty-box cooldown"; // Blue Stripes
      if (headerTitle) headerTitle.style.display = "none"; // Hide default header
      if (defaultRewardDiv) defaultRewardDiv.style.display = "none"; // Hide default reward

      bountyEl.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                
                <!-- LEFT: TIMER -->
                <div style="display:flex; flex-direction:column;">
                    <div style="font-family:var(--font-mono); font-size:10px; color:#00ccff; font-weight:bold; letter-spacing:1px; margin-bottom:2px;">
                        SYSTEM STANDBY
                    </div>
                    <div class="cooldown-timer-text">T-${daysLeft}D ${remHours}H</div>
                    <div class="cooldown-sub">AWAITING NEXT DIRECTIVE</div>
                </div>
                
                <!-- RIGHT: BADGE -->
                <div style="text-align:right;">
                    <div style="
                        background:rgba(0, 204, 255, 0.05); 
                        border:1px solid #00ccff; 
                        color:#00ccff; 
                        font-size:9px; 
                        padding:8px 12px; 
                        border-radius:2px; 
                        font-family:var(--font-mono); 
                        font-weight:800;
                        letter-spacing:1px;
                        box-shadow: 0 0 10px rgba(0, 204, 255, 0.1);
                    ">
                        MISSION ACCOMPLISHED
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================
    // STATE 2: LOCKED (ENCRYPTED)
    // ============================================================
    else if (!isUnlocked) {
      bountyBox.className = "bounty-box bounty-locked"; // Red Stripes
      if (headerTitle) headerTitle.style.display = "none";
      if (defaultRewardDiv) defaultRewardDiv.style.display = "none";

      bountyEl.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                
                <!-- LEFT: ENCRYPTED INFO -->
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="font-family:var(--font-mono); font-size:10px; color:var(--error); font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:6px;">
                        <span>⚠</span> WEEKLY CONTRACT DETECTED
                    </div>
                    <div class="locked-text" style="color:#444; background:rgba(0,0,0,0.3); width:fit-content;">
                        ██████████ <span style="color:#666; font-size:10px; letter-spacing:0;">[ ENCRYPTED SIGNAL ]</span>
                    </div>
                </div>

                <!-- RIGHT: ACTIONS -->
                <div class="locked-actions">
                    <div style="text-align:right; opacity:0.7; margin-right:10px;">
                        <div class="xp-tag" style="background:#221111; border:1px solid #442222; color:#ff6666;">+500 DATA POINTS</div>
                    </div>

                    <button class="btn-decrypt" onclick="window.unlockWeeklyBounty()" style="height:34px; display:flex; align-items:center; gap:8px; padding:0 15px;">
                        <span></span> DECRYPT <span style="opacity:0.6; font-size:8px; margin-left:2px;">(-3 FLUX)</span>
                    </button>
                </div>

            </div>
        `;
    }

    // ============================================================
    // STATE 3: ACTIVE (READY)
    // ============================================================
    else {
      bountyBox.className = "bounty-box"; // Gold Border
      bountyBox.style.borderColor = "#ffd700";
      bountyBox.style.background =
        "linear-gradient(45deg, rgba(255, 215, 0, 0.05) 0%, rgba(0, 0, 0, 0) 100%)";

      if (headerTitle) headerTitle.style.display = "none";
      if (defaultRewardDiv) defaultRewardDiv.style.display = "none";

      bountyEl.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                
                <!-- LEFT: TARGET -->
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <div style="font-family:var(--font-mono); font-size:10px; color:#ffd700; font-weight:bold; letter-spacing:1px;">
                        ★ WEEKLY CONTRACT ACTIVE
                    </div>
                    <div style="font-size:18px; color:#fff; font-weight:800; font-family:var(--font-mono); letter-spacing:1px;">
                        LOCATE: "${currentBounty.toUpperCase()}"
                    </div>
                </div>

                <!-- RIGHT: ACTION -->
                <div class="locked-actions">
                    <div style="text-align:right; margin-right:10px;">
                         <div class="xp-tag" style="background:rgba(255,215,0,0.1); border:1px solid #ffd700; color:#ffd700;">+500 DATA POINTS</div>
                    </div>
                    
                    <button class="bounty-btn-trigger" onclick="window.openWeeklyBountyModal('${currentBounty}')" style="height:34px; display:flex; align-items:center; gap:8px; padding:0 20px;">
                        INITIATE SCAN <span>►</span>
                    </button>
                </div>

            </div>
        `;
    }
  }

    // --- GENERATE SYSTEM ID CARD ---
  window.generateSystemCard = function () {
    if (!systemData || !systemData["s_style"]) {
      return sysNotify("SYSTEM NOT INITIALIZED", "error");
    }

    // 1. POPULATE DATA
    document.getElementById("sc-sys-name").innerText =
      systemData["s_style"] || "UNNAMED PROTOCOL";
    document.getElementById("sc-sys-risk").innerText =
      (systemData["s_risk"] || "1.0") + "%";
    document.getElementById("sc-sys-loss").innerText =
      (systemData["s_max_loss"] || "3") + " UNITS";

    const capPlanned = systemData["s_max_planned"] || "2";
    const capOpen = systemData["s_max_open"] || "1";
    document.getElementById("sc-sys-cap").innerText =
      `${capOpen} OPEN / ${capPlanned} PLAN`;

    // Get rank from the UI
    const currentRank = document.getElementById("player-rank")
      ? document.getElementById("player-rank").innerText
      : "OPERATOR";
    document.getElementById("sc-sys-rank").innerText = currentRank;

    // 2. POPULATE SETUPS LIST
    const setupsRaw = systemData["s_setups"] || "";
    let setupsList = [];
    if (setupsRaw.includes("\n")) {
      setupsList = setupsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else {
      setupsList = setupsRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    const setupsContainer = document.getElementById("sc-sys-setups");
    // Take top 5 setups to fit the card cleanly
    setupsContainer.innerHTML = setupsList
      .slice(0, 5)
      .map((s) => `<div class="sys-id-item">${s}</div>`)
      .join("");

    if (setupsList.length > 5) {
      setupsContainer.innerHTML += `<div class="sys-id-item" style="opacity:0.5; margin-top:5px;">+ ${setupsList.length - 5} ADDITIONAL MODELS</div>`;
    }

    // 3. RENDER
    sysNotify("GENERATING ID...", "info");
    const stage = document.getElementById("system-card-stage");

    // Slight delay to ensure DOM update
    setTimeout(() => {
      html2canvas(stage, {
        backgroundColor: "#050505",
        scale: 2, // High Resolution
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/jpeg", 0.9);

        // Show Preview Modal
        document.getElementById("sys-card-preview-img").src = imgData;
        document.getElementById("sys-card-modal").style.display = "flex";

        // Setup Download Button
        document.getElementById("btn-download-sys-card").onclick = () => {
          const link = document.createElement("a");
          link.download = `SYSTEM_ID_${systemData["s_style"].replace(/\s+/g, "_").toUpperCase()}.jpg`;
          link.href = imgData;
          link.click();
          sysNotify("LICENSE DOWNLOADED", "success");
        };

        playSound("win");
      });
    }, 200);
  };