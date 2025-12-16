
window.updateWeeklyUI = function() {
    // 1. Hydrate Inputs
    document.querySelectorAll(".wk-inp").forEach((i) => {
      if (weeklyData[i.dataset.key]) i.value = weeklyData[i.dataset.key];
    });

    // 2. Lock Logic
    const l = !isDemo && Date.now() < (weeklyData["next_unlock"] || 0);
    document.querySelectorAll(".wk-inp").forEach((i) => (i.disabled = l));

    const overlay = document.getElementById("weekly-overlay");
    const statusBadge = document.getElementById("weekly-status");
    if (overlay) overlay.style.display = l ? "flex" : "none";
    if (statusBadge) {
      statusBadge.innerText = l ? "LOCKED" : "OPEN";
      statusBadge.classList.toggle("locked", l);
    }

    if (l) {
      const timeLeft = weeklyData["next_unlock"] - Date.now();
      const daysLeft = Math.ceil(timeLeft / 86400000);
      const pct = Math.max(
        0,
        Math.min(100, ((604800000 - timeLeft) / 604800000) * 100),
      );
      const bar = document.getElementById("weekly-bar");
      const timer = document.getElementById("weekly-timer");
      if (bar) bar.style.width = pct + "%";
      if (timer) timer.innerText = `SYSTEM RECHARGE: ${daysLeft} DAYS`;
    }

    // 3. RENDER ARCHIVE GRID
    const list = document.getElementById("weekly-archive-grid");
    const countEl = document.getElementById("archive-count");
    if (!list) return;

    const history = weeklyData.history || [];
    if (countEl) countEl.innerText = history.length;

    if (history.length === 0) {
      list.innerHTML = `<div class="empty-archive">NO DEBRIEFS RECORDED.<br><span style="font-size:10px;">COMPLETE A WEEKLY AUDIT IN THE 'SYSTEM' TAB.</span></div>`;
    } else {
      list.innerHTML = history
        .map((h, index) => {
          const repId = `REP-${new Date(h.date).getFullYear()}-${index + 100}`;

          // Check for images
          const winImgHtml = h.winImg
            ? `<div class="debrief-evidence" onclick="window.zoomImage('${h.winImg}')"><img src="${h.winImg}"></div>`
            : "";

          const errImgHtml = h.errImg
            ? `<div class="debrief-evidence" onclick="window.zoomImage('${h.errImg}')"><img src="${h.errImg}"></div>`
            : "";

          return `
            <div class="debrief-card">
                <div class="debrief-header">
                    <div class="debrief-date">${h.date}</div>
                    <div class="debrief-id">${repId}</div>
                </div>
                
                <div class="debrief-body">
                    <!-- PRIME EXECUTION -->
                    <div class="debrief-section win">
                        <div class="debrief-label"><div class="icon-success"></div> PRIME EXECUTION</div>
                        <div class="debrief-text">${h.win || "-"}</div>
                        ${winImgHtml}
                    </div>

                    <!-- PROTOCOL BREACH -->
                    <div class="debrief-section loss">
                        <div class="debrief-label"><div class="icon-fail"></div> PROTOCOL BREACH</div>
                        <div class="debrief-text" style="border-color:rgba(255,68,68,0.2); color:#ffaaaa;">${h.err || "-"}</div>
                        ${errImgHtml}
                    </div>
                </div>

                <div class="debrief-footer">
                    <div class="debrief-focus-label">FORWARD DIRECTIVE</div>
                    <div class="debrief-focus-val">"${(h.focus || "").toUpperCase()}"</div>
                </div>
            </div>`;
        })
        .join("");
    }
  }
   // === WEEKLY CONTRACT MODAL (FIXED CLOSE BUTTON + RENAMED) ===
  window.openWeeklyBountyModal = function (targetPattern) {
    if (typeof playSound === "function") playSound("click");

    const overlay = document.createElement("div");
    overlay.className = "sys-modal-overlay";
    document.body.appendChild(overlay);

    const MAX_REWARD = 500;

    // RENDER THE INITIAL INPUT SCREEN
    overlay.innerHTML = `
    <div class="sys-modal modal-weekly-theme" style="width: 500px;">
        <div class="modal-inner">
            <!-- HEADER -->
            <div class="modal-title text-gold" style="justify-content:space-between; border-bottom:1px solid #333;">
                <span>★ WEEKLY CONTRACT</span>
                <span style="font-size:10px; color:#fff; background:#ffd700; color:#000; padding:2px 6px; font-weight:bold;">MAX ${MAX_REWARD} DATA POINTS</span>
            </div>

            <div class="modal-body">
                <!-- BRIEFING -->
                <div style="margin-bottom:20px; padding:15px; border:1px dashed #ffd700; background:rgba(255,215,0,0.02);">
                    <div style="font-size:9px; color:#888; letter-spacing:1px; margin-bottom:5px;">PRIMARY OBJECTIVE</div>
                    <div style="font-size:18px; color:#fff; font-weight:800; font-family:var(--font-mono);">
                        LOCATE: <span class="text-gold">"${targetPattern}"</span>
                    </div>
                    <div style="font-size:10px; color:#666; margin-top:5px;">
                        <span style="color:var(--error);">⚠ WARNING:</span> Submission is final. Grading is immediate.
                    </div>
                </div>

                <!-- INPUT FORM -->
                <div class="form-stack">
                    <div class="f-group">
                        <label class="text-gold">EVIDENCE URL</label>
                        <input id="wb-link" class="inp-std border-gold" placeholder="Paste Chart Link..." autocomplete="off">
                        <div id="wb-preview" class="preview-box" style="border-color:#ffd700;">
                            <div class="scan-line" style="background:#ffd700; box-shadow:0 0 10px #ffd700;"></div>
                            <div class="preview-status text-gold">AWAITING INTEL...</div>
                            <img id="wb-preview-img" class="preview-img" src="">
                        </div>
                    </div>

                    <div class="f-group">
                        <label class="text-gold">TACTICAL NOTES</label>
                        <textarea id="wb-notes" class="inp-area border-gold" placeholder="Describe the market context..." style="height:70px;"></textarea>
                    </div>
                </div>

                <div id="wb-status-area" style="margin-top:15px; display:none; text-align:center; color:#ffd700; font-size:10px;"></div>
            </div>

            <!-- FOOTER -->
            <div class="modal-actions" style="border-top:1px solid #222; padding-top:15px;">
                <button class="btn-modal" id="btn-close-weekly">ABORT</button>
                <button class="btn-modal" id="btn-submit-weekly" style="background:rgba(255,215,0,0.1); border:1px solid #ffd700; color:#ffd700; font-weight:bold;">
                    SUBMIT FINAL REPORT
                </button>
            </div>
        </div>
    </div>`;

    // --- 1. IMAGE PREVIEW LOGIC ---
    const linkInput = document.getElementById("wb-link");
    const previewBox = document.getElementById("wb-preview");
    const previewImg = document.getElementById("wb-preview-img");
    const statusText = previewBox.querySelector(".preview-status");
    const scanLine = previewBox.querySelector(".scan-line");

    linkInput.addEventListener("input", () => {
      const url = linkInput.value.trim();
      if (url.length < 5) {
        previewBox.style.display = "none";
        return;
      }
      previewBox.style.display = "block";
      scanLine.style.display = "block";
      statusText.style.display = "flex";
      statusText.innerText = "VERIFYING LINK...";
      previewImg.style.opacity = "0";
      const img = new Image();
      img.onload = () => {
        previewImg.src = url;
        previewImg.style.opacity = "1";
        statusText.style.display = "none";
        scanLine.style.display = "none";
      };
      img.onerror = () => {
        statusText.innerText = "LINK CORRUPTED";
      };
      img.src = url;
    });

    // --- 2. SUBMISSION LOGIC ---
    const submitBtn = document.getElementById("btn-submit-weekly");
    const statusArea = document.getElementById("wb-status-area");
    const closeBtn = document.getElementById("btn-close-weekly");

    submitBtn.onclick = async () => {
      const url = linkInput.value;
      const notes = document.getElementById("wb-notes").value;

      if (url.length < 10) return sysNotify("MISSING EVIDENCE URL", "error");

      submitBtn.disabled = true;
      submitBtn.innerText = "GRADING...";
      statusArea.style.display = "block";
      statusArea.innerHTML = "ESTABLISHING AI UPLINK...";

      const analysis = await verifyChartWithAI(url, targetPattern);

      if (!analysis || analysis.error) {
        submitBtn.disabled = false;
        submitBtn.innerText = "RETRY SUBMISSION";
        statusArea.innerHTML = `<span style="color:var(--error)">ERROR: INVALID CHART DATA</span>`;
        playSound("error");
        return;
      }

      // --- SCORING LOGIC ---
      const scoresObj = analysis.raw_scores || analysis.scores || {};
      const sorted = Object.entries(scoresObj).sort((a, b) => b[1] - a[1]);
      const topPattern = (sorted[0]?.[0] || "").toLowerCase();
      const topScore = Number(sorted[0]?.[1] || 0);
      const secondPattern = (sorted[1]?.[0] || "").toLowerCase();
      const secondScore = Number(sorted[1]?.[1] || 0);
      const missionTarget = targetPattern.toLowerCase();

      let grade = "PROCESSING";
      let gradeColor = "#666";
      let earnedXP = 0;
      let barPercent = 0;
      let purityScore = 0;
      let resultTitle = "CONTRACT FULFILLED";
      let icon = "🏆";
      let internalRarity = "common";

      if (topScore >= 0.8) purityScore = 98 + Math.random() * 2;
      else if (topScore >= 0.6)
        purityScore = 85 + ((topScore - 0.6) / 0.2) * 12;
      else if (topScore >= 0.4)
        purityScore = 70 + ((topScore - 0.4) / 0.2) * 14;
      else purityScore = topScore * 200;
      purityScore = Math.min(Math.round(purityScore), 100);

      const isDirectHit =
        topPattern.includes(missionTarget) ||
        missionTarget.includes(topPattern);
      const isWeakSignal =
        (secondPattern.includes(missionTarget) ||
          missionTarget.includes(secondPattern)) &&
        topScore - secondScore < 0.25;

      if (isDirectHit) {
        barPercent = purityScore;
        const multiplier = purityScore >= 80 ? 1.0 : purityScore / 100;
        earnedXP = Math.round(MAX_REWARD * multiplier);
        if (earnedXP < 250) earnedXP = 250;

        if (purityScore >= 90) {
          grade = "CLASSIFIED";
          internalRarity = "legendary";
          gradeColor = "#ffd700";
        } else {
          grade = "ELITE";
          internalRarity = "epic";
          gradeColor = "#00ccff";
        }
        playSound("win");
      } else if (isWeakSignal) {
        grade = "TACTICAL";
        internalRarity = "rare";
        gradeColor = "#f4d35e";
        earnedXP = 250;
        barPercent = 50;
        resultTitle = "CONTRACT PARTIAL";
        icon = "⚠️";
        playSound("hover");
      } else {
        grade = "STANDARD";
        internalRarity = "common";
        gradeColor = "#ff8888";
        earnedXP = 75;
        barPercent = (75 / MAX_REWARD) * 100;
        resultTitle = "CONTRACT FAILED";
        icon = "🚫";
        playSound("error");
      }

      systemData["s_bounty_claimed_date"] = Date.now();
      await saveData("system");
      addXP(earnedXP);

      const ruleId = "WEEKLY-" + Date.now().toString();
      const newRule = {
        id: ruleId,
        section: "patterns",
        title: `WEEKLY: ${targetPattern}`,
        desc:
          notes ||
          `${grade} Grade execution on ${targetPattern}. Purity: ${purityScore}%`,
        pairs: "ALL",
        link: url,
        rarity: internalRarity,
        isBounty: true,
        xpValue: earnedXP,
        createdAt: new Date().toISOString(),
      };
      playbookData.push(newRule);

      
      if (!isDemo)
        await setDoc(
          doc(
            db,
            "users",
            currentUser.uid,
            "portfolios",
            currentPortfolioId,
            "playbook",
            ruleId,
          ),
          newRule,
        );
      initArsenal();

      // --- 3. RENDER RESULT ---
      overlay.querySelector(".modal-body").innerHTML = `
            <div style="text-align:center; padding:30px;">
                <div style="font-size:40px; margin-bottom:15px;">${icon}</div>
                <div style="color:${gradeColor}; font-size:18px; font-weight:800; letter-spacing:2px; margin-bottom:10px;">
                    ${resultTitle}
                </div>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; font-family:var(--font-mono); font-size:10px;">
                    <div style="background:#111; padding:8px; border:1px solid #333;">
                        <div style="color:#666;">CLEARANCE</div>
                        <div style="color:#fff; font-weight:bold;">${grade}</div>
                    </div>
                    <div style="background:#111; padding:8px; border:1px solid #333;">
                        <div style="color:#666;">POINTS ACQUIRED</div>
                        <div style="color:${gradeColor}; font-weight:bold;">+${earnedXP}</div>
                    </div>
                </div>

                <div style="width:100%; height:6px; background:#111; border:1px solid #333; border-radius:3px; margin-bottom:20px; position:relative; overflow:hidden;">
                    <div style="width:${barPercent}%; height:100%; background:${gradeColor}; box-shadow:0 0 15px ${gradeColor}; transition:width 1s ease;"></div>
                </div>

                <button class="btn-tech" style="width:100%; border-color:${gradeColor}; color:${gradeColor}; margin-bottom:10px;" onclick="window.downloadIntelCard('${ruleId}')">
                    GENERATE INTEL CARD
                </button>
                <!-- FIXED CLOSE BUTTON -->
                <button class="btn-ghost" style="width:100%;" onclick="this.closest('.sys-modal-overlay').remove()">
                    CLOSE
                </button>
            </div>
        `;
      // Remove old footer
      const footer = overlay.querySelector(".modal-actions");
      if (footer) footer.remove();
    };

    // Close logic
    closeBtn.onclick = () => overlay.remove();
  };