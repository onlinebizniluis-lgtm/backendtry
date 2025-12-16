 window.closeTrade = async function (tradeId) {
    const trade = window.openTrades.find((t) => t.id === tradeId);
    if (!trade) return;

    if (
      await sysConfirm(
        "CLOSE TRADE",
        `Close ${trade.pair} ${trade.direction}?<br><br>This will move the trade to your journal for final outcome recording.`,
        false,
      )
    ) {
      // Remove from open trades
      window.openTrades = window.openTrades.filter((t) => t.id !== tradeId);

      // Save updated list
      await saveData("openTrades");

      // Refresh UI
      renderOpenTrades();

      sysNotify("TRADE CLOSED - Record outcome in TERMINAL", "success");
      playSound("win");

      // Optional: Auto-switch to Terminal tab for logging
      setTimeout(() => {
        document
          .querySelectorAll(".nav-btn")
          .forEach((b) => b.classList.remove("active"));
        document
          .querySelector('[data-target="tab-term"]')
          .classList.add("active");
        document.querySelectorAll(".view-section").forEach((s) => {
          s.style.display = "none";
          s.classList.remove("active");
        });
        const termTab = document.getElementById("tab-term");
        if (termTab) {
          termTab.style.display = "block";
          termTab.classList.add("active");
        }
      }, 1500);
    }
  };

        // Close trade function
  window.closeTrade = async (tradeId) => {
    const trade = window.openTrades.find((t) => t.id === tradeId);
    if (!trade) return;

    if (
      await sysConfirm(
        "CLOSE TRADE",
        `Close ${trade.pair} with ${trade.pnlPercent > 0 ? "profit" : "loss"} of ${trade.pnlPercent.toFixed(2)}%?`,
      )
    ) {
      // Move to closed trades / journal
      window.openTrades = window.openTrades.filter((t) => t.id !== tradeId);

      // TODO: Add to journal with final P&L

      await saveData("openTrades");
      renderOpenTrades();
      sysNotify("TRADE CLOSED", "success");
    }
  };