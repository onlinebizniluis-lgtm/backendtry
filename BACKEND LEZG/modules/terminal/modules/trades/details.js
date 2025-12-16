    function viewOpenTradeDetailModal(tradeId) {
    const trade = window.openTrades.find((t) => t.id === tradeId);
    if (!trade) {
      console.error("Trade not found:", tradeId);
      return sysNotify("Trade not found", "error");
    }

    const overlay = document.createElement("div");
    overlay.className = "sys-modal-overlay";

    // Calculate time open
    const now = Date.now();
    const timeSince = now - trade.openTime;
    const hoursOpen = Math.floor(timeSince / (1000 * 60 * 60));
    const minsOpen = Math.floor((timeSince % (1000 * 60 * 60)) / (1000 * 60));
    const openedText =
      hoursOpen > 0
        ? `${hoursOpen} HR${hoursOpen > 1 ? "S" : ""}`
        : `${minsOpen} MIN${minsOpen !== 1 ? "S" : ""}`;

    // Sanitize notes
    const safeNotes = (trade.notes || "None")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Check if valid URL
    const hasChart = trade.screenshot && trade.screenshot.trim().length > 0;
    const isValidUrl =
      hasChart &&
      (trade.screenshot.startsWith("http://") ||
        trade.screenshot.startsWith("https://"));

    let imgHtml = hasChart
      ? `<img src="${trade.screenshot}" class="detail-img" style="cursor:zoom-in;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
         <div class="empty-img" style="display:none">IMAGE LOAD FAILED</div>`
      : `<div class="empty-img">NO CHART DATA LINKED</div>`;

    let openBtn =
      hasChart && isValidUrl
        ? `<button id="btn-open-chart" class="btn-modal primary">OPEN CHART IN TAB</button>`
        : "";

    overlay.innerHTML = `
        <div class="sys-modal wide">
            <div class="modal-inner">
                <div class="modal-title">
                    TRADE DETAILS
                </div>
                <div class="modal-body">
                    <div class="detail-row">
                        <span class="detail-lbl">PAIR:</span>
                        <span class="detail-val">${trade.pair || "-"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-lbl">DIRECTION:</span>
                        <span class="detail-val">${trade.direction || "N/A"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-lbl">SESSION:</span>
                        <span class="detail-val">${trade.sess || "N/A"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-lbl">STRATEGY:</span>
                        <span class="detail-val">${trade.setup || "-"}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-lbl">TIME OPEN:</span>
                        <span class="detail-val">${openedText}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-lbl">NOTES:</span>
                        <span class="detail-val" style="white-space:pre-wrap;">${safeNotes}</span>
                    </div>
                    ${imgHtml}
                </div>
                <div class="modal-actions">
                    <button id="btn-close-detail" class="btn-modal">CLOSE</button>
                    ${openBtn}
                </div>
            </div>
        </div>
    `;

    // Close on background click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 200);
      }
    };

    document.body.appendChild(overlay);
    playSound("hover");

    // Image zoom handler
    const img = overlay.querySelector(".detail-img");
    if (img) {
      img.onclick = () => window.zoomImage(trade.screenshot);
    }

    // Close button
    document.getElementById("btn-close-detail").onclick = () => {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 200);
    };

    // Open chart button (if exists)
    const chartBtn = document.getElementById("btn-open-chart");
    if (chartBtn) {
      chartBtn.onclick = () => {
        if (isValidUrl) {
          window.open(trade.screenshot, "_blank");
        } else {
          playSound("error");
          sysNotify("INVALID LINK FORMAT", "error");
        }
      };
    }
  }

  window.viewOpenTradeDetailModal = viewOpenTradeDetailModal;
