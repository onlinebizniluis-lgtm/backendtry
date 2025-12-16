  
  
  // --- GLOBAL LOCK HELPER ---
  window.toggleProcessing = function (show, msg = "PROCESSING...") {
    const el = document.getElementById("global-processing-overlay");
    const txt = document.getElementById("processing-text");
    if (show) {
      if (txt) txt.innerText = msg;
      if (el) el.style.display = "flex";
    } else {
      if (el) el.style.display = "none";
    }
  };

  window.el = (id) => document.getElementById(id);
window.msg = document.getElementById("feedback-msg"); // Define directly to be safe

    // ✅ HELPER: Get Local Date (YYYY-MM-DD) ignoring UTC
window.getLocalDate = function() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

      window.formatTime = function(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;

    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  

    window.formatPrice = function(price, pair) {
    if (!price) return "";

    // Crypto: 2-8 decimals depending on price
    if (pair.match(/BTC|ETH|SOL/)) {
      if (price > 1000) return price.toFixed(2);
      if (price > 1) return price.toFixed(4);
      return price.toFixed(8);
    }

    // Forex: 5 decimals (pips)
    if (pair.length === 6 && pair.includes("USD")) {
      return price.toFixed(5);
    }

    // Stocks/Indices: 2 decimals
    return price.toFixed(2);
  }