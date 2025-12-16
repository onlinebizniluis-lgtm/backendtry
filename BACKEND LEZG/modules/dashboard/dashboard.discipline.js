// PROTOCOL SCORE DASHBOARD UPDATER


window.updateProtocolScore = function() {
    try {
      // Use only CLOSED/ARCHIVED trades for KPI — ignore planned & open trades
      const closedTrades = (allTrades || []).filter((t) => {
        if (!t) return false;
        if (t.status && String(t.status).toLowerCase() === "closed")
          return true;
        if (
          t.res &&
          ["WIN", "LOSS", "BE"].includes(String(t.res).toUpperCase())
        )
          return true;
        return false;
      });

      // Empty state handling
      const elDiscVal = document.querySelector(".disc-value");
      const elDiscRing = document.querySelector(".disc-ring");
      const freqFill = document.querySelector(".freq-fill");

      if (!closedTrades.length) {
        if (elDiscVal) elDiscVal.textContent = "—";
        if (elDiscRing)
          elDiscRing.style.background =
            "conic-gradient(var(--accent) 0%, var(--border) 0%)";
        if (freqFill) freqFill.style.width = "0%";
        return;
      }

      // Compute numeric scores array (tolerant to different field names)
      const scores = closedTrades.map((t) => {
        if (typeof t.protocolScore !== "undefined")
          return Number(t.protocolScore) || 0;
        if (typeof t.discipline !== "undefined")
          return Number(t.discipline) || 0;
        if (t.checklist && Array.isArray(t.checklist)) {
          const vals = t.checklist.map((c) => {
            const v = String(c.val || "").toLowerCase();
            if (v === "yes") return 1;
            if (v === "neutral" || v === "maybe") return 0.5;
            return 0;
          });
          const sum = vals.reduce((a, b) => a + b, 0);
          return Math.round((sum / (vals.length || 1)) * 100);
        }
        return 0;
      });

      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      // Update UI visuals
      if (elDiscVal) elDiscVal.textContent = `${avg}%`;
      if (elDiscRing)
        elDiscRing.style.background = `conic-gradient(var(--accent) ${avg}%, var(--border) ${avg}%)`;
      if (freqFill) freqFill.style.width = `${avg}%`;
    } catch (err) {
      console.error("updateProtocolScore error:", err);
    }
  }

window.updateDisciplineMeter = function(trades) {
    const ring = document.getElementById("disc-ring-visual");
    const valText = document.getElementById("disc-val-text");
    const gradeText = document.getElementById("disc-grade-text");

    if (!ring || !valText || !gradeText) return;

    // 1. Filter: Only count trades that actually have a recorded score
    // We look at 'allTrades' (Closed trades) passed into this function
    const scoredTrades = trades.filter((t) => {
      return (
        t.discipline !== undefined &&
        t.discipline !== null &&
        t.discipline !== ""
      );
    });

    // 2. Zero State: If no closed trades with scores exist
    if (scoredTrades.length === 0) {
      valText.innerText = "--%";
      valText.style.color = "#666";
      gradeText.innerText = "NO DATA";
      gradeText.style.color = "#444";

      // Reset Ring
      ring.style.background = "none";
      ring.style.border = "4px solid #222";
      ring.style.boxShadow = "none";
      return;
    }

    // 3. Calculation: Average the scores
    let totalScore = 0;
    scoredTrades.forEach((t) => {
      // Handle string or number safely
      totalScore += parseInt(t.discipline || 0);
    });

    const avgScore = Math.round(totalScore / scoredTrades.length);

    // 4. Grading System
    let color = "var(--accent)";
    let grade = "ELITE";

    if (avgScore < 95) {
      color = "#b8dbd9";
      grade = "GOOD";
    }
    if (avgScore < 80) {
      color = "#f4d35e";
      grade = "SLIPPING";
    }
    if (avgScore < 60) {
      color = "#ee964b";
      grade = "UNDISCIPLINED";
    }
    if (avgScore < 40) {
      color = "var(--error)";
      grade = "RECKLESS";
    }

    // 5. Update UI
    valText.innerText = avgScore + "%";
    valText.style.color = color;
    gradeText.innerText = grade;
    gradeText.style.color = color;

    // Apply Conic Gradient Ring
    ring.style.border = "none";
    ring.style.background = `conic-gradient(${color} 0% ${avgScore}%, #222 ${avgScore}% 100%)`;
    ring.style.boxShadow = avgScore >= 90 ? `0 0 15px ${color}40` : "none";
  }

     window.updateDisciplineMeter = function (trades) {
    const ring = document.getElementById("disc-ring-visual");
    const valText = document.getElementById("disc-val-text");
    const gradeText = document.getElementById("disc-grade-text");

    if (!ring || !valText || !gradeText) return;

    // Filter: Only look at trades that have data we can score
    const validTrades = (trades || []).filter((t) => {
      // Has explicit score OR has checklist data to calculate from
      return (
        t.discipline !== undefined ||
        t.protocolScore !== undefined ||
        (Array.isArray(t.checklist) && t.checklist.length > 0)
      );
    });

    // --- ZERO STATE ---
    if (validTrades.length === 0) {
      valText.innerText = "--%";
      valText.style.color = "#666";
      gradeText.innerText = "NO DATA";
      gradeText.style.color = "#444";
      ring.style.background = "none";
      ring.style.border = "4px solid #222";
      ring.style.boxShadow = "none";
      return;
    }

    // --- SMART CALCULATION ---
    let totalScore = 0;
    let countedTrades = 0;

    validTrades.forEach((t) => {
      let score = 0;

      // 1. Try explicit discipline score
      if (t.discipline && parseInt(t.discipline) > 0) {
        score = parseInt(t.discipline);
      }
      // 2. Try legacy protocolScore
      else if (t.protocolScore && parseInt(t.protocolScore) > 0) {
        score = parseInt(t.protocolScore);
      }
      // 3. FALLBACK: Re-calculate from checklist array (Retroactive Fix)
      else if (Array.isArray(t.checklist) && t.checklist.length > 0) {
        let yes = 0;
        let total = 0;
        t.checklist.forEach((item) => {
          // Handle both object format {key, val} and legacy formats
          const val = (item.val || item.value || "").toLowerCase();
          if (val === "yes" || val === "no") total++;
          if (val === "yes") yes++;
        });
        if (total > 0) score = Math.round((yes / total) * 100);
      }

      totalScore += score;
      countedTrades++;
    });

    const avgScore =
      countedTrades > 0 ? Math.round(totalScore / countedTrades) : 0;

    // --- DETERMINE GRADE & COLOR ---
    let color = "var(--accent)";
    let grade = "ELITE";

    if (avgScore < 95) {
      color = "#b8dbd9";
      grade = "GOOD";
    }
    if (avgScore < 80) {
      color = "#f4d35e";
      grade = "SLIPPING";
    }
    if (avgScore < 60) {
      color = "#ee964b";
      grade = "UNDISCIPLINED";
    }
    if (avgScore < 40) {
      color = "var(--error)";
      grade = "RECKLESS";
    }

    // --- UPDATE DOM ---
    valText.innerText = avgScore + "%";
    valText.style.color = color;
    gradeText.innerText = grade;
    gradeText.style.color = color;

    // Update Ring Gradient
    ring.style.border = "none";
    ring.style.background = `conic-gradient(${color} 0% ${avgScore}%, #222 ${avgScore}% 100%)`;
    ring.style.boxShadow = avgScore >= 90 ? `0 0 15px ${color}40` : "none";
  };

    // Overwrite legacy function to redirect to correct logic
  window.updateProtocolScore = function () {
    if (typeof window.allTrades !== "undefined") {
      window.updateDisciplineMeter(window.allTrades);
    }
  };
  // 2. OVERWRITE LEGACY FUNCTION
  // This ensures that 'btn-save-trade' updates the dashboard correctly
  window.updateProtocolScore = function () {
    // Pass the global 'allTrades' (Journal) to the meter
    if (typeof window.allTrades !== "undefined") {
      window.updateDisciplineMeter(window.allTrades);
    }
  };