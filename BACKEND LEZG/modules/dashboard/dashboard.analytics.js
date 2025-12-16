// ADVANCED ANALYTICS DASHBOARD UPDATER


window.updateAdvancedAnalytics = function(data) {
    if (!data || data.length === 0) return;

    // --- FIXED: CALCULATE STREAK (FULL DATASET) ---
    const sorted = [...data].sort((a, b) => b.id - a.id);

    let currentStreak = 0;
    let streakType = ""; // "WIN" or "LOSS"
    let winCount = 0;

    if (sorted.length > 0) {
      // Initialize with the most recent trade
      streakType = sorted[0].res;

      // Loop through to count streak
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].res === streakType) {
          currentStreak++;
        } else {
          break; // Stop counting when type changes
        }
        if (sorted[i].res === "WIN") winCount++;
      }
    }

    // Determine Display Text
    const streakEl = document.getElementById("val-cur-streak");
    if (streakEl) {
      streakEl.innerText = currentStreak;
      streakEl.style.color =
        streakType === "WIN"
          ? "var(--accent)"
          : streakType === "LOSS"
            ? "var(--error)"
            : "#fff";
    }

    // --- NEW: CALCULATE EXPECTED STREAK (MATH FORMULA) ---
    const totalTrades = sorted.length;
    // Probability of Loss (approximate based on actual data)
    const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
    const lossRate = 1 - winRate;

    // Formula: abs( log(N) / log(P_loss) )
    let expMaxStreak = 0;
    if (lossRate > 0 && lossRate < 1 && totalTrades > 0) {
      expMaxStreak = Math.abs(Math.log(totalTrades) / Math.log(lossRate));
    }

    const expEl = document.getElementById("val-exp-streak");
    if (expEl) {
      expEl.innerText = Math.round(expMaxStreak);
    }

    // --- A. DAY OF WEEK LOGIC (NOW WITH RICH HOVER) ---
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const dayStats = [0, 0, 0, 0, 0, 0, 0]; // Accumulate R
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    data.forEach((t) => {
      const d = new Date(t.date);
      const dayIdx = new Date(
        d.valueOf() + d.getTimezoneOffset() * 60000,
      ).getDay();

      let r = 0;
      if (t.res === "WIN") r = parseFloat(t.rr);
      if (t.res === "LOSS") r = -1;

      if (!isNaN(dayIdx)) {
        dayStats[dayIdx] += r;
        dayCounts[dayIdx]++;
      }
    });

    const maxR = Math.max(...dayStats.map(Math.abs)); // For scaling
    let dowHtml = "";

    // Render Mon(1) to Fri(5) only for clean look (expand loop to 0-6 if crypto)
    for (let i = 1; i <= 5; i++) {
      const val = dayStats[i];
      const height = maxR > 0 ? (Math.abs(val) / maxR) * 35 : 1; // 35px max height
      const isBest = val === Math.max(...dayStats.slice(1, 6)) && val > 0;
      const isNeg = val < 0;
      const colorClass = isBest ? "best" : isNeg ? "neg" : "";

      // Create the bar column
      // We add onmouseenter to trigger the same tooltip logic
      const barId = `dow-col-${i}`;
      dowHtml += `
            <div id="${barId}" class="dow-col ${colorClass}">
                <div class="dow-val" style="color:${val > 0 ? "var(--accent)" : val < 0 ? "var(--error)" : "#444"}">${val > 0 ? "+" : ""}${val.toFixed(1)}</div>
                <div class="dow-bar" style="height:${Math.max(2, height)}px"></div>
                <div class="dow-lbl">${days[i]}</div>
            </div>`;

      // Deferred Listener attachment (hacky but works in string loop)
      setTimeout(() => {
        const el = document.getElementById(barId);
        if (el) {
          el.onmouseenter = (e) => {
            const tt = document.getElementById("ticker-tooltip");
            tt.innerHTML = `
                          <div class="tt-row"><span>DAY</span><span class="tt-val" style="color:var(--accent)">${days[i]}</span></div>
                          <div class="tt-row"><span>NET P&L</span><span class="tt-val" style="color:${val >= 0 ? "var(--accent)" : "var(--error)"}">${val.toFixed(1)}R</span></div>
                          <div class="tt-row"><span>VOLUME</span><span class="tt-val">${dayCounts[i]} Trades</span></div>
                      `;
            tt.style.display = "block";
            tt.style.left = e.clientX + 10 + "px";
            tt.style.top = e.clientY + 10 + "px";
          };
          el.onmouseleave = () => {
            document.getElementById("ticker-tooltip").style.display = "none";
          };
          el.onmousemove = (e) => {
            const tt = document.getElementById("ticker-tooltip");
            tt.style.left = e.clientX + 15 + "px";
            tt.style.top = e.clientY + 15 + "px";
          };
        }
      }, 500);
    }
    document.getElementById("dow-chart").innerHTML = dowHtml;

    // --- B. FORM TICKER LOGIC (WITH HOVER CARD) ---
    // Sort by date/ID descending (newest first) then take first 10 for VISUALS
    const recent = sorted.slice(0, 10);

    // Clear old event listeners by creating fresh HTML
    const container = document.getElementById("form-ticker");
    container.innerHTML = "";

    recent.forEach((t, index) => {
      let cls = "";
      let txt = "-";
      if (t.res === "WIN") {
        cls = "W";
        txt = "W";
      } else if (t.res === "LOSS") {
        cls = "L";
        txt = "L";
      } else {
        txt = "BE";
      }

      const div = document.createElement("div");
      div.className = `form-pill ${cls}`;
      div.innerText = txt;

      // CLICK ACTION (Full Modal)
      div.onclick = () => viewTradeDetail(t.id);

      // HOVER ACTION (Quick Intel)
      div.onmouseenter = (e) => {
        const tt = document.getElementById("ticker-tooltip");
        if (!tt) return;

        // Populate Tooltip
        tt.innerHTML = `
                  <div class="tt-row"><span>PAIR</span><span class="tt-val" style="color:var(--accent)">${t.pair}</span></div>
                  <div class="tt-row"><span>SETUP</span><span class="tt-val">${t.setup || "-"}</span></div>
                  <div class="tt-row"><span>RESULT</span><span class="tt-val" style="color:${t.res === "WIN" ? "var(--accent)" : "var(--error)"}">${t.rr}R</span></div>
                  <div class="tt-row"><span>DATE</span><span class="tt-val" style="color:#666">${t.date}</span></div>
              `;

        tt.style.display = "block";
        tt.style.left = e.clientX + 10 + "px";
        tt.style.top = e.clientY + 10 + "px";
      };

      div.onmouseleave = () => {
        const tt = document.getElementById("ticker-tooltip");
        if (tt) tt.style.display = "none";
      };

      // Move tooltip with mouse
      div.onmousemove = (e) => {
        const tt = document.getElementById("ticker-tooltip");
        if (tt) {
          tt.style.left = e.clientX + 15 + "px";
          tt.style.top = e.clientY + 15 + "px";
        }
      };

      container.appendChild(div);
    });

    // Momentum Signal (Based on last 3)
    const momEl = document.getElementById("mom-signal");
    if (recent.length > 2) {
      if (recent[0].res === "WIN" && recent[1]?.res === "WIN") {
        momEl.innerText = "HOT HAND 🔥";
        momEl.style.color = "var(--accent)";
      } else if (recent[0].res === "LOSS" && recent[1]?.res === "LOSS") {
        momEl.innerText = "COLD ❄️";
        momEl.style.color = "var(--error)";
      } else {
        momEl.innerText = "NEUTRAL";
        momEl.style.color = "#888";
      }
    }

    // CALL DISCIPLINE METER (Passing the filtered dataset)
    updateDisciplineMeter(data);
  }