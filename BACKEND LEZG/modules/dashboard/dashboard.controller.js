// THIS IS THE MAIN CONTROLLER FOR THE DASHBOARD PAGE

window.updateDashboard = function() {
    // 1. FILTER DATA BY TIME
    let data = [...allTrades].sort((a, b) => a.id - b.id);

    // Default state if undefined
    if (typeof dashFilterState === "undefined") {
      window.dashFilterState = { mode: "all" };
    }

    const now = new Date();
    now.setHours(23, 59, 59, 999); // Include today

    if (dashFilterState.mode === "days") {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - dashFilterState.days);
      cutoff.setHours(0, 0, 0, 0);

      data = data.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= cutoff && tDate <= now;
      });
    } else if (
      dashFilterState.mode === "custom" &&
      dashFilterState.start &&
      dashFilterState.end
    ) {
      const start = new Date(dashFilterState.start);
      start.setHours(0, 0, 0, 0);

      const end = new Date(dashFilterState.end);
      end.setHours(23, 59, 59, 999);

      data = data.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= start && tDate <= end;
      });
    }

    // 2. UPDATE FOCUS
    const focusEl = document.getElementById("dash-focus");
    if (focusEl) {
      focusEl.innerText =
        weeklyData && weeklyData["current_focus"]
          ? weeklyData["current_focus"]
          : "NO DIRECTIVE SET. UPDATE WEEKLY REVIEW.";
    }

    // 3. ZERO-STATE RESET
    if (!data.length) {
      el("kpi-equity").innerText = "0.0R";
      el("kpi-equity").style.color = "#fff";
      el("kpi-wr").innerText = "0%";
      el("kpi-pf").innerText = "0.00";
      el("kpi-avg").innerText = "0.0R";
      el("kpi-dd").innerText = "0.0R";

      el("chart-svg-host").innerHTML =
        '<div style="color:#444;text-align:center;padding-top:140px;font-family:var(--font-mono);">NO DATA</div>';
      el("setup-wrapper").innerHTML =
        '<div style="color:#444;text-align:center;padding-top:140px;font-family:var(--font-mono);">NO DATA</div>';

      el("kpi-pair").innerHTML =
        '<span style="color:#444; font-size:14px;">--</span>';
      el("bar-pair").style.width = "0%";
      el("card-best-pair").removeAttribute("data-tooltip");

      el("kpi-sess").innerHTML =
        '<span style="color:#444; font-size:14px;">--</span>';
      el("bar-sess").style.width = "0%";
      el("card-best-sess").removeAttribute("data-tooltip");

      document.getElementById("dow-chart").innerHTML =
        '<div style="width:100%; text-align:center; color:#444; font-size:9px; margin-top:20px;">AWAITING DATA</div>';
      document.getElementById("form-ticker").innerHTML =
        '<div style="width:100%; text-align:center; color:#444; font-size:9px; margin-top:20px;">NO TRADES YET</div>';

      document.getElementById("mom-signal").innerText = "NEUTRAL";
      document.getElementById("mom-signal").style.color = "#888";
      document.getElementById("val-cur-streak").innerText = "0";
      document.getElementById("val-exp-streak").innerText = "-";

      // ✅ Pass empty array to reset meter
      updateDisciplineMeter([]);

      return;
    }

    // 4. CALCULATE METRICS
    let wins = 0,
      total = data.length,
      equity = 0,
      grossP = 0,
      grossL = 0;
    let peak = 0;
    let maxDD = 0;

    const pairStats = {};
    const sessStats = {};

    const points = data.map((t) => {
      let r = t.res === "WIN" ? parseFloat(t.rr) : t.res === "LOSS" ? -1 : 0;
      equity += r;

      if (equity > peak) peak = equity;
      const currentDD = peak - equity;
      if (currentDD > maxDD) maxDD = currentDD;

      if (!pairStats[t.pair]) pairStats[t.pair] = { r: 0, w: 0, t: 0 };
      pairStats[t.pair].t++;
      pairStats[t.pair].r += r;

      if (!sessStats[t.sess]) sessStats[t.sess] = { r: 0, w: 0, t: 0 };
      sessStats[t.sess].t++;
      sessStats[t.sess].r += r;

      if (t.res === "WIN") {
        wins++;
        grossP += r;
        pairStats[t.pair].w++;
        sessStats[t.sess].w++;
      }
      if (t.res === "LOSS") {
        grossL += Math.abs(r);
      }

      return { id: t.id, val: equity, r: r };
    });

    // 5. BEST PAIR / SESSION (FIXED: ONLY SHOW IF POSITIVE)
    let bestPair = "-";
    let bestPairObj = { r: -999999, w: 0, t: 0 }; // Start extremely low

    Object.keys(pairStats).forEach((k) => {
      const s = pairStats[k];
      // Calculate Win Rates for tie-breaking
      const curWR = s.t > 0 ? s.w / s.t : 0;
      const bestWR = bestPairObj.t > 0 ? bestPairObj.w / bestPairObj.t : 0;

      // Logic: Net R is King. If Net R is equal, higher Win Rate wins.
      if (s.r > bestPairObj.r || (s.r === bestPairObj.r && curWR > bestWR)) {
        bestPair = k;
        bestPairObj = s;
      }
    });

    let bestSess = "-";
    let bestSessObj = { r: -999999, w: 0, t: 0 };

    Object.keys(sessStats).forEach((k) => {
      const s = sessStats[k];
      const curWR = s.t > 0 ? s.w / s.t : 0;
      const bestWR = bestSessObj.t > 0 ? bestSessObj.w / bestSessObj.t : 0;

      if (s.r > bestSessObj.r || (s.r === bestSessObj.r && curWR > bestWR)) {
        bestSess = k;
        bestSessObj = s;
      }
    });

    const pf = grossL > 0 ? (grossP / grossL).toFixed(2) : grossP.toFixed(2);
    const winPct = wins / total;
    const avgWin = wins > 0 ? (grossP / wins).toFixed(2) : 0;

    // 6. RENDER DATA
    el("kpi-equity").innerText =
      (equity > 0 ? "+" : "") + equity.toFixed(1) + "R";
    el("kpi-equity").style.color = equity >= 0 ? "#fff" : "var(--error)";

    el("kpi-wr").innerText = Math.round(winPct * 100) + "%";
    el("kpi-pf").innerText = pf;
    el("kpi-avg").innerText = avgWin + "R";
    el("kpi-dd").innerText =
      maxDD === 0 ? "0.0R" : "-" + maxDD.toFixed(1) + "R";

    // --- FIX: ONLY SHOW IF PROFITABLE (> 0) ---
    if (bestPair !== "-" && bestPairObj.r > 0) {
      const pairWinRate = Math.round((bestPairObj.w / bestPairObj.t) * 100);
      const pairFreq = (bestPairObj.t / total) * 100;
      el("kpi-pair").innerHTML =
        `${bestPair} <span style="font-size:10px; color:var(--accent)">(${bestPairObj.r.toFixed(1)}R)</span>`;
      el("bar-pair").style.width = pairFreq + "%";
      el("card-best-pair").setAttribute(
        "data-tooltip",
        `Win Rate: ${pairWinRate}% (${bestPairObj.w}/${bestPairObj.t})`,
      );
    } else {
      // Fallback if no profitable pair exists
      el("kpi-pair").innerHTML =
        '<span style="color:#444; font-size:14px;">--</span>';
      el("bar-pair").style.width = "0%";
      el("card-best-pair").removeAttribute("data-tooltip");
    }

    // --- FIX: ONLY SHOW IF PROFITABLE (> 0) ---
    if (bestSess !== "-" && bestSessObj.r > 0) {
      const sessWinRate = Math.round((bestSessObj.w / bestSessObj.t) * 100);
      const sessFreq = (bestSessObj.t / total) * 100;
      el("kpi-sess").innerHTML =
        `${bestSess} <span style="font-size:10px; color:var(--accent)">(${bestSessObj.r.toFixed(1)}R)</span>`;
      el("bar-sess").style.width = sessFreq + "%";
      el("card-best-sess").setAttribute(
        "data-tooltip",
        `Win Rate: ${sessWinRate}% (${bestSessObj.w}/${bestSessObj.t})`,
      );
    } else {
      // Fallback if no profitable session exists
      el("kpi-sess").innerHTML =
        '<span style="color:#444; font-size:14px;">--</span>';
      el("bar-sess").style.width = "0%";
      el("card-best-sess").removeAttribute("data-tooltip");
    }

    // Charts & Analytics
    drawSvgChart(
      points.map((p) => p.val),
      "chart-svg-host",
      points,
    );

    const setupStats = {};
    data.forEach((t) => {
      const s = t.setup || "Unknown";
      if (!setupStats[s]) setupStats[s] = { w: 0, t: 0, r: 0 };

      setupStats[s].t++;

      // Calculate R for specific setup
      let rVal = 0;
      if (t.res === "WIN") {
        setupStats[s].w++;
        rVal = parseFloat(t.rr || 0);
      } else if (t.res === "LOSS") {
        rVal = -1; // Assuming -1R per loss
      }
      setupStats[s].r += rVal;
    });

    // Pass enriched data to the new drawBarChart function
    drawBarChart(
      Object.keys(setupStats).map((k) => ({
        label: k,
        val: Math.round((setupStats[k].w / setupStats[k].t) * 100),
        count: setupStats[k].t,
        netR: setupStats[k].r,
      })),
      "setup-wrapper",
    );
    updateAdvancedAnalytics(data);

    // ✅ ADDED: This line was missing in your previous code
    updateDisciplineMeter(data);

    initRiskSearch();
    initEntrySearch();
  }
