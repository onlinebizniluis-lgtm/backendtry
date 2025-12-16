//DEBRIEFS

window.renderLogbook = function() {
    const fPair = el("filter-pair")
      ? el("filter-pair").value.toUpperCase()
      : "";
    const fRes = el("filter-res") ? el("filter-res").value : "ALL";
    const now = new Date();

    // Filter
    let filtered = allTrades.filter((t) => {
      const tDate = new Date(t.date);
      let timeMatch = true;
      if (logViewRange === "30")
        timeMatch = (now - tDate) / (1000 * 60 * 60 * 24) <= 30;
      return (
        timeMatch &&
        (fPair === "" || t.pair.includes(fPair)) &&
        (fRes === "ALL" || t.res === fRes)
      );
    });

    // Sort Newest First
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (logViewMode === "list") {
      el("log-list-view").style.display = "table";
      el("log-calendar-view").style.display = "none";

      // PAGINATION: Only show first 50
      const displayData = filtered.slice(0, 50);

      el("log-body").innerHTML = displayData
        .map(
          (t) => `
            <tr data-id="${t.id}" title="Click for Details">
                <td>${t.date}</td>
                <td>${t.pair}</td>
                <td>${t.setup || "-"}</td>
                <td><span class="badge ${t.res.toLowerCase()}">${t.res}</span></td>
                <td>${t.rr}R</td>
                <td><button data-id="${t.id}" class="btn-del">✕</button></td>
            </tr>`,
        )
        .join("");

      // Hint if more
      if (filtered.length > 50) {
        el("log-body").innerHTML +=
          `<tr><td colspan="6" style="text-align:center; color:#666; font-size:10px; padding:10px;">SHOWING RECENT 50 OF ${filtered.length} TRADES</td></tr>`;
      }
    } else {
      el("log-list-view").style.display = "none";
      el("log-calendar-view").style.display = "block";
      const year = logCalDate.getFullYear(),
        month = logCalDate.getMonth();
      const monthNames = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      el("log-cal-month").innerText = `${monthNames[month]} ${year}`;
      const firstDay = new Date(year, month, 1).getDay(),
        daysInMonth = new Date(year, month + 1, 0).getDate();
      let html = "";
      for (let i = 0; i < firstDay; i++)
        html += `<div class="log-cal-day" style="border:none;background:transparent;cursor:default;"></div>`;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
        const dayTrades = filtered.filter((t) => t.date === dateStr);
        let dayPL = 0;
        let count = dayTrades.length;
        dayTrades.forEach(
          (t) =>
            (dayPL +=
              t.res === "WIN" ? parseFloat(t.rr) : t.res === "LOSS" ? -1 : 0),
        );
        let plClass = dayPL > 0 ? "pl-pos" : dayPL < 0 ? "pl-neg" : "";
        let plStr =
          count > 0 ? `${dayPL > 0 ? "+" : ""}${dayPL.toFixed(1)}R` : "-";
        const safeJSON = JSON.stringify(dayTrades).replace(/"/g, "&quot;");
        const clickAction =
          count > 0 ? `window.viewDayDetails('${dateStr}', ${safeJSON})` : "";
        html += `<div class="log-cal-day" onclick="${clickAction}"><div class="log-cal-date">${d}</div><div class="log-cal-pl ${plClass}">${plStr}</div><div class="log-cal-count">${count} TRADES</div></div>`;
      }
      el("log-cal-grid").innerHTML = html;
    }
  }

  function viewTradeDetail(id) {
    const t = allTrades.find((x) => x.id === id);
    if (!t) return;
    const overlay = document.createElement("div");
    overlay.className = "sys-modal-overlay";

    // Sanitization
    const safeNotes = (t.notes || "None")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Check if valid URL
    const hasChart = t.chart && t.chart.trim().length > 0;
    const isValidUrl =
      hasChart &&
      (t.chart.startsWith("http://") || t.chart.startsWith("https://"));

    let imgHtml = hasChart
      ? `<img src="${t.chart}" class="detail-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"><div class="empty-img" style="display:none">IMAGE LOAD FAILED</div>`
      : `<div class="empty-img">NO CHART DATA LINKED</div>`;
    let openBtn = hasChart
      ? `<button id="btn-open-chart" class="btn-modal primary">OPEN CHART IN TAB</button>`
      : "";

    overlay.innerHTML = `<div class="sys-modal wide"><div class="modal-inner"><div class="modal-title"><span>🔍</span> TRADE ID: #${t.id}</div><div class="modal-body"><div class="detail-row"><span class="detail-lbl">DATE:</span> <span class="detail-val">${t.date}</span></div><div class="detail-row"><span class="detail-lbl">PAIR:</span> <span class="detail-val">${t.pair}</span></div><div class="detail-row"><span class="detail-lbl">SESSION:</span> <span class="detail-val">${t.sess}</span></div><div class="detail-row"><span class="detail-lbl">SETUP:</span> <span class="detail-val">${t.setup}</span></div><div class="detail-row"><span class="detail-lbl">RESULT:</span> <span class="detail-val"><span class="badge ${t.res.toLowerCase()}">${t.res}</span> (${t.rr}R)</span></div><div class="detail-row"><span class="detail-lbl">NOTES:</span> <span class="detail-val" style="font-size:10px; color:#aaa; white-space:pre-wrap;">${safeNotes}</span></div>${imgHtml}</div><div class="modal-actions"><button id="btn-close-detail" class="btn-modal">CLOSE</button>${openBtn}</div></div></div>`;

    // Close on background click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 200);
      }
    };

    document.body.appendChild(overlay);
    playSound("hover");
    document.getElementById("btn-close-detail").onclick = () => {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 200);
    };

    if (document.getElementById("btn-open-chart")) {
      document.getElementById("btn-open-chart").onclick = () => {
        if (isValidUrl) {
          window.open(t.chart, "_blank");
        } else {
          playSound("error");
          sysNotify("INVALID LINK FORMAT", "error");
        }
      };
    }
  }

    function viewDayDetails(dateStr, trades) {
    const overlay = document.createElement("div");
    overlay.className = "sys-modal-overlay";
    let html = trades
      .map(
        (t) =>
          `<div style="border-bottom:1px solid #222; padding:10px 0; display:flex; justify-content:space-between; cursor:pointer;" onclick="document.querySelector('.sys-modal-overlay').remove(); viewTradeDetail(${t.id})"><div style="color:#fff;">${t.pair} (${t.setup})</div><div style="font-weight:bold; color:${t.res === "WIN" ? "var(--accent)" : "var(--error)"}">${t.rr}R</div></div>`,
      )
      .join("");
    overlay.innerHTML = `<div class="sys-modal"><div class="modal-inner"><div class="modal-title">📅 ${dateStr}</div><div class="modal-body">${html || "No trades recorded."}</div><div class="modal-actions"><button onclick="this.closest('.sys-modal-overlay').remove()" class="btn-modal">CLOSE</button></div></div></div>`;

    // Close on background click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    };

    document.body.appendChild(overlay);
    playSound("hover");
  }
  window.viewDayDetails = viewDayDetails;
  window.viewTradeDetail = viewTradeDetail;

    