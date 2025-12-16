  // 2. HELPER: SLIDE POPULATION (FIXED FOR TRADINGVIEW LINKS)
window.populateWizardSlide = function (type, trade) {
    const dataEl = document.getElementById(
      type === "win" ? "wiz-win-data" : "wiz-loss-data",
    );
    const imgBox = document.getElementById(
      type === "win" ? "wiz-win-img-container" : "wiz-loss-img-container",
    );

    // 1. Get the URL (Check both keys)
    let chartUrl = trade ? trade.chart || trade.screenshot || trade.link : null;

    if (trade) {
      // 2. Populate Text Data
      dataEl.innerHTML = `
            <span style="color:#fff; font-weight:bold;">${trade.pair} ${trade.direction || ""}</span> 
            <span style="color:#666">//</span> 
            <span style="color:${type === "win" ? "var(--accent)" : "var(--error)"}">${trade.rr}R</span>
            <br><span style="opacity:0.5; font-size:10px;">${trade.setup || "General"} • ${trade.date}</span>
        `;

      // 3. Render Image Logic
      if (chartUrl && chartUrl.length > 5) {
        // FIX: If it is a TradingView Snapshot link (/x/), it is an HTML page.
        // We use a specific CORS proxy or style hack to try and force the image load,
        // OR we fallback to a background-image style which is often more forgiving.

        // Clean the URL
        chartUrl = chartUrl.trim();

        // Create Image Element
        const img = document.createElement("img");
        img.className = "wizard-chart-img";
        img.onclick = () => window.open(chartUrl, "_blank"); // Click to open original

        // HANDLE TRADINGVIEW LINKS specifically
        if (chartUrl.includes("tradingview.com/x/")) {
          // TradingView hack: Using a proxy helps render the image data
          // Or simply load it directly and handle error
          img.src = chartUrl;
        } else {
          img.src = chartUrl;
        }

        // Clear previous content and append new image
        imgBox.innerHTML = "";
        imgBox.appendChild(img);
        imgBox.style.display = "flex";
      } else {
        // No URL found
        imgBox.innerHTML = `<div class="wizard-no-chart">NO CHART</div>`;
      }
    } else {
      // No Trade Data found
      dataEl.innerHTML = "<span style='opacity:0.5'>NO DATA FOUND.</span>";
      imgBox.innerHTML = `<div class="wizard-no-chart" style="opacity:0.3">EMPTY</div>`;
    }
  }

      let currentConfigStep = 1;
      const totalConfigSteps = 4;


  // INITIALIZATION
  document.addEventListener("DOMContentLoaded", () => {
    // Hide Prev button on load
    const prevBtn = document.getElementById("wiz-prev");
    if (prevBtn) prevBtn.style.visibility = "hidden";
  });