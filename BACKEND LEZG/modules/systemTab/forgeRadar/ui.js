    // --- HELPER: RENDER THE FORGE FORM (ROBUST DATA PASSING) ---
  window.showForgeModal = function (overlay, questTarget, questReward) {
    if (typeof playSound === "function") playSound("win");

    // 1. RENDER UI
    overlay.innerHTML = `
    <div class="sys-modal" style="border:1px solid var(--accent); box-shadow:0 0 30px rgba(0,255,157,0.1); width: 480px;">
        <div class="crit-overlay"></div> 
        <div class="modal-inner">
            <div class="modal-title" style="color:var(--accent); justify-content:space-between; border-bottom:1px solid #222; padding-bottom:15px; margin-bottom:20px;">
                <span class="clean-tag">PROTOCOL FORGE</span>
                <div style="display:flex; gap:15px;">
                    <span class="clean-tag" style="color:#00ccff;">FLUX: ${fluxEnergy}/${MAX_FLUX}</span>
                    <span class="clean-tag" style="color:#666;">ENERGY: ${forgeEnergy}/3</span>
                </div>
            </div>
            
            <div class="mission-box" style="margin-bottom:25px;">
                <div>
                    <div class="mission-label">DIRECTIVE LOCKED</div>
                    <div class="mission-target">FIND: "${questTarget}"</div>
                </div>
                <div class="mission-xp">MAX +${questReward} DATA POINTS</div>
            </div>

            <div class="modal-body" style="padding-top:0;">
                <div class="form-stack">
                    <div class="f-group">
                        <label>PROTOCOL NAME</label>
                        <input id="nr-title" class="inp-std" placeholder="e.g. 'Standard ${questTarget} Setup'">
                    </div>
                    <div class="f-group">
                        <label>EVIDENCE (URL)</label>
                        <input id="nr-link" class="inp-std" placeholder="Paste Chart Link" autocomplete="off">
                        <div id="nr-preview" class="preview-box">
                            <div class="scan-line"></div>
                            <div class="preview-status">AWAITING UPLINK...</div>
                            <img id="nr-preview-img" class="preview-img" src="">
                        </div>
                    </div>
                    <div class="f-group">
                        <label>ANALYSIS NOTES</label>
                        <textarea id="nr-desc" class="inp-area" placeholder="Describe the structure..." style="height:60px;"></textarea>
                    </div>

                    <button id="btn-verify-mission" class="verify-btn" style="margin-top:15px; padding:12px; font-family:var(--font-mono); font-weight:bold; letter-spacing:1px;">
                        INITIATE VERIFICATION
                    </button>
                    
                    <div id="mission-success" class="verify-success" style="display:none; justify-content:center; text-align:center; flex-direction:column; gap:10px; margin-top:15px; padding:10px; background:rgba(0,0,0,0.3); border:1px dashed #333;"></div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-modal" id="btn-cancel-forge">CLOSE PANEL</button>
                <button class="btn-modal primary" id="btn-craft-rule" disabled style="opacity:0.5; display:none;">
                    ENCRYPT TO ARSENAL
                </button>
            </div>
        </div>
    </div>`;

    // --- 2. SETUP REFERENCES ---
    const linkInput = document.getElementById("nr-link");
    const previewBox = document.getElementById("nr-preview");
    const previewImg = document.getElementById("nr-preview-img");
    const statusText = previewBox.querySelector(".preview-status");
    const scanLine = previewBox.querySelector(".scan-line");
    const verifyBtn = document.getElementById("btn-verify-mission");
    const saveBtn = document.getElementById("btn-craft-rule");
    const successMsg = document.getElementById("mission-success");

    let earnedXP = 0;

    // --- 3. IMAGE PREVIEW ---
    linkInput.addEventListener("input", () => {
      const url = linkInput.value.trim();
      if (url.length < 5) {
        previewBox.style.display = "none";
        return;
      }
      previewBox.style.display = "block";
      previewBox.classList.remove("valid", "invalid");
      scanLine.style.display = "block";
      statusText.style.display = "flex";
      statusText.innerText = "ESTABLISHING UPLINK...";
      previewImg.style.opacity = "0";
      const img = new Image();
      img.onload = () => {
        previewImg.src = url;
        previewImg.style.opacity = "1";
        statusText.style.display = "none";
        scanLine.style.display = "none";
        previewBox.classList.add("valid");
      };
      img.onerror = () => {
        statusText.innerText = "SIGNAL LOST (INVALID URL)";
        statusText.style.color = "var(--error)";
        previewBox.classList.add("invalid");
      };
      img.src = url;
    });

    // --- 4. VERIFICATION LOGIC ---
    verifyBtn.onclick = async () => {
      const url = linkInput.value;
      if (url.length < 10) return sysNotify("URL REQUIRED", "error");

      verifyBtn.disabled = true;
      verifyBtn.innerHTML = "RUNNING STRUCTURAL ANALYSIS...";
      verifyBtn.style.opacity = "0.7";

      const analysis = await verifyChartWithAI(url, questTarget);

      if (!analysis || analysis.error) {
        verifyBtn.innerHTML = "CONNECTION ERROR";
        verifyBtn.style.color = "var(--error)";
        verifyBtn.disabled = false;
        return;
      }

      // Data Parsing
      const scoresObj = analysis.raw_scores || analysis.scores || {};
      const sorted = Object.entries(scoresObj).sort((a, b) => b[1] - a[1]);
      const topPattern = (sorted[0]?.[0] || "").toLowerCase();
      const topScore = Number(sorted[0]?.[1] || 0);
      const secondPattern = (sorted[1]?.[0] || "").toLowerCase();
      const secondScore = Number(sorted[1]?.[1] || 0);
      const missionTarget = questTarget.toLowerCase();

      // Grading Logic
      let grade = "ANALYSIS COMPLETE";
      let gradeColor = "#666";
      let feedbackText = "";
      let barPercent = 0;
      let rarity = "common"; // Local variable to hold result

      // SCENARIO A: SUCCESS
      if (
        topPattern.includes(missionTarget) ||
        missionTarget.includes(topPattern)
      ) {
        // Gamer Curve
        if (topScore >= 0.8) barPercent = 98;
        else if (topScore >= 0.6)
          barPercent = 85 + ((topScore - 0.6) / 0.2) * 12;
        else if (topScore >= 0.4)
          barPercent = 70 + ((topScore - 0.4) / 0.2) * 14;
        else barPercent = topScore * 200;

        barPercent = Math.min(Math.round(barPercent), 100);

        // XP Calc
        const multiplier = barPercent >= 80 ? 1.0 : barPercent / 100;
        earnedXP = Math.round(questReward * multiplier);
        if (earnedXP < 50) earnedXP = 50;

        // THEME MAPPING
        if (barPercent >= 90) {
          grade = "PURE ALPHA";
          gradeColor = "#00ccff";
          rarity = "legendary";
          feedbackText = `SIGNAL PURITY: MAX. "${missionTarget.toUpperCase()}" CONFIRMED.`;
        } else if (barPercent >= 75) {
          grade = "HIGH FIDELITY";
          gradeColor = "#ffd700";
          rarity = "epic";
          feedbackText = `STRONG CORRELATION WITH "${missionTarget.toUpperCase()}".`;
        } else {
          grade = "VALIDATED";
          gradeColor = "var(--accent)";
          rarity = "rare";
          feedbackText = `STRUCTURE MATCHES "${missionTarget.toUpperCase()}".`;
        }
      }

      // SCENARIO B: WEAK SIGNAL
      else if (
        (secondPattern.includes(missionTarget) ||
          missionTarget.includes(secondPattern)) &&
        topScore - secondScore < 0.25
      ) {
        grade = "WEAK SIGNAL";
        gradeColor = "#f4d35e";
        earnedXP = Math.round(questReward * 0.5);
        barPercent = 50;
        rarity = "common";
        feedbackText = `AMBIGUOUS. AI SEES "${topPattern.toUpperCase()}" BUT "${missionTarget.toUpperCase()}" IS PRESENT.`;
      }

      // SCENARIO C: FAILURE
      else {
        earnedXP = Math.round(questReward * 0.15);
        if (earnedXP < 15) earnedXP = 15;
        barPercent = (earnedXP / questReward) * 100; // Bar = Reward %
        grade = "NOISE DETECTED";
        gradeColor = "#ff8888";
        rarity = "common";
        feedbackText = `AI IDENTIFIED "${topPattern.toUpperCase()}". CHECK BIAS.`;
      }

      // Render Result
      verifyBtn.style.display = "none";
      successMsg.style.display = "flex";

      successMsg.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:12px; color:${gradeColor}; font-weight:bold; letter-spacing:1px;">${grade}</div>
                <div style="font-size:9px; color:#555;">CONFIDENCE: ${(topScore * 100).toFixed(0)}%</div>
            </div>
            <div style="font-size:10px; color:#ccc; margin-top:4px;">${feedbackText}</div>
            <div style="width:100%; height:6px; background:#111; border:1px solid #333; border-radius:3px; margin:10px 0; position:relative; overflow:hidden;">
                <div style="width:${barPercent}%; height:100%; background:${gradeColor}; box-shadow:0 0 15px ${gradeColor}; transition:width 1s ease;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-top:2px;">
                <div style="font-size:10px; font-family:var(--font-mono); color:#888;">REWARD EARNED</div>
                <div style="color:${gradeColor}; font-weight:800; font-size:16px;">+${earnedXP} DATA POINTS</div>
            </div>
        `;

      if (grade !== "NOISE DETECTED") {
        saveBtn.innerHTML = "ENCRYPT TO ARSENAL";
        saveBtn.style.borderColor = "var(--accent)";
        saveBtn.style.color = "var(--accent)";
      } else {
        saveBtn.innerHTML = "LOG AS LEARNING";
        saveBtn.style.borderColor = "#666";
        saveBtn.style.color = "#ccc";
      }

      // --- 🟢 VITAL FIX: Store Rarity directly on the button to prevent scope loss ---
      saveBtn.dataset.rarity = rarity;

      saveBtn.style.display = "block";
      saveBtn.disabled = false;
      saveBtn.style.opacity = "1";

      if (grade !== "NOISE DETECTED") playSound("win");
      else playSound("hover");
    };

    // --- 5. SAVE LOGIC (ROBUST) ---
    saveBtn.onclick = async () => {
      if (forgeEnergy <= 0) {
        sysNotify("INSUFFICIENT ENERGY. REST 4 HOURS.", "error");
        playSound("error");
        return;
      }

      saveBtn.disabled = true;
      saveBtn.innerText = "SAVING...";

      forgeEnergy--;
      systemData["s_forge_energy"] = forgeEnergy;
      systemData["s_last_forge_time"] = Date.now();

      delete systemData["active_mission_target"];
      delete systemData["active_mission_xp"];
      await saveData("system");
      updateStaminaUI();

      // RETRIEVE RARITY FROM BUTTON DATASET
      const finalRarity = saveBtn.dataset.rarity || "common";

      const ruleId = Date.now().toString();
      const newRule = {
        id: ruleId,
        section: "patterns",
        title:
          document.getElementById("nr-title").value || `${questTarget} Setup`,
        desc:
          document.getElementById("nr-desc").value ||
          `Verified ${questTarget}.`,
        pairs: "ALL",
        link: linkInput.value,
        rarity: finalRarity, // ✅ Uses the safe value
        isBounty: false,
        xpValue: earnedXP,
        createdAt: new Date().toISOString(),
      };

      playbookData.push(newRule);
      if (!isDemo) {
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
      }

      addXP(earnedXP);
      renderArsenal();

      // 6. SUCCESS OVERLAY
      // Map rarity to display name for the final screen
      const tierName =
        {
          legendary: "CLASSIFIED",
          epic: "ELITE",
          rare: "TACTICAL",
          common: "STANDARD",
        }[finalRarity] || "STANDARD";

      overlay.innerHTML = `
            <div class="sys-modal" style="width:400px; text-align:center; padding:30px; border:1px solid var(--accent); box-shadow:0 0 40px rgba(0,255,157,0.1);">
                <div class="crit-overlay active" style="opacity:0.3;"></div>
                <div style="font-size:18px; font-weight:800; color:#fff; letter-spacing:2px; margin-bottom:10px;">MISSION COMPLETE</div>
                <div class="clean-tag" style="color:var(--accent); font-size:14px; margin-bottom:20px;">+${earnedXP} DATA POINTS</div>
                
                <p style="color:#888; font-size:11px; margin-bottom:25px; line-height:1.5; font-family:var(--font-mono);">
                    Protocol data encrypted. Clearance Level: 
                    <strong style="color:#fff">${tierName}</strong>
                </p>
                
                <button class="btn-tech" style="width:100%; margin-bottom:10px;" onclick="window.downloadIntelCard('${ruleId}')">
                    GENERATE SHARE CARD
                </button>
                <button id="btn-close-final" class="btn-ghost" style="width:100%;">RETURN TO DASHBOARD</button>
            </div>
        `;

      document.getElementById("btn-close-final").onclick = () => {
        overlay.remove();
        playSound("click");
      };
      playSound("win");
    };

    document.getElementById("btn-cancel-forge").onclick = () =>
      overlay.remove();
  };