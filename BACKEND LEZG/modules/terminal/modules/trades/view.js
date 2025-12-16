  window.renderOpenTrades = function () {
    const container = document.getElementById("openTradesList");
    const navDiv = document.getElementById("openNavControls");

    if (!container) return;

    if (!currentUser || currentUser.uid === "guest" || isDemo) {
      container.style.display = "block";
      container.innerHTML = `<div class="empty-slot-container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span>LOGIN REQUIRED</span></div>`;
      if (navDiv) navDiv.style.display = "none";
      return;
    }

    const trades = window.openTrades || [];

    // 1. EMPTY STATE (TECH BOX - NO EMOJI)
    if (trades.length === 0) {
      container.style.display = "block";
      container.innerHTML = `
            <div class="empty-slot-container">
                <!-- PULSE ICON SVG -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                <span style="font-weight:700;">NO POSITIONS DETECTED</span>
                <span style="font-size:9px; color:#333; margin-top:4px;">MARKET FLAT</span>
            </div>
        `;
      container.classList.remove("compact");

      // HIDE ARROWS
      if (navDiv) navDiv.style.setProperty("display", "none", "important");
      return;
    }

    // 2. RENDER CARDS
    container.style.display = "flex";
    container.innerHTML = trades
      .map((trade) => {
        const now = Date.now();
        const timeSince = now - trade.openTime;
        const hoursOpen = Math.floor(timeSince / (1000 * 60 * 60));
        const minsOpen = Math.floor(
          (timeSince % (1000 * 60 * 60)) / (1000 * 60),
        );
        const openedText =
          hoursOpen > 0 ? `${hoursOpen}H ${minsOpen}M` : `${minsOpen} MIN`;

        const isLong = trade.direction === "LONG";
        const dirColor = isLong ? "var(--accent)" : "var(--error)";
        const dirBadge = `<span style="color:${dirColor}; border:1px solid ${dirColor}; font-size:9px; padding:2px 6px; border-radius:3px; margin-left:8px; background:rgba(0,0,0,0.4);">${isLong ? "▲" : "▼"} ${trade.direction}</span>`;
        const hasChart =
          trade.screenshot && trade.screenshot.startsWith("http");
        const conf = parseInt(trade.confidence || 0);
        let gradeColor =
          conf >= 8 ? "var(--accent)" : conf >= 5 ? "#f4d35e" : "var(--error)";

        return `
        <div class="planned-card trade-card">
            <div class="plan-badge" style="color:${gradeColor}; border-color:${gradeColor};">CONF: ${conf}/10</div>
            <div class="planned-info">
                <div class="pair" style="display:flex; align-items:center;">${trade.pair} ${dirBadge}</div>
                <div class="meta">${trade.setup || "General"} • ${trade.sess || "N/A"}</div>
                <div class="meta" style="color:var(--accent); margin-top:4px;">⏱ RUNTIME: ${openedText}</div>
            </div>
            ${hasChart ? `<img src="${trade.screenshot}" class="plan-thumb trade-img" onclick='openImagePreview("${trade.screenshot}")' />` : `<div class="no-chart-placeholder">NO VISUAL DATA</div>`}
            <div class="plan-notes">${trade.notes || "No notes"}</div>
            <div class="plan-actions">
                <button class="btn-plan btn-execute" data-trade-id="${trade.id}" data-action="close">CLOSE</button>
                <button class="btn-plan" data-trade-id="${trade.id}" data-action="view-detail">DETAILS</button>
            </div>
        </div>`;
      })
      .join("");

    container.classList.add("compact");

    // 3. SMART ARROWS (Show only if > 1 item)
    if (navDiv) {
      navDiv.style.setProperty(
        "display",
        trades.length > 1 ? "flex" : "none",
        "important",
      );
    }
    attachOpenTradeListeners();
  };