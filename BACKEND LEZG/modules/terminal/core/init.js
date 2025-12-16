document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (typeof currentUser !== "undefined" &&
        typeof currentPortfolioId !== "undefined" &&
        typeof loadInbox === "function" &&
        typeof checkPlanExpirations === "function") {

      if (currentUser && currentPortfolioId) {
        loadInbox();
        checkPlanExpirations();
      }
    }
  }, 1000);
});

  
  // Also check when page loads
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      if (currentUser && currentPortfolioId) {
        loadInbox();
        checkPlanExpirations();
      }
    }, 2000);
  });
window.moveRiskModuleIntoModal = function () {
    if (riskModule && modalBody && !modalBody.contains(riskModule)) {
      document.getElementById("tab-posCalc").appendChild(riskModule);
    }
  }

      function snapToNearest(container, width) {
    const position = container.scrollLeft;
    const snap = Math.round(position / width) * width;
    container.scrollTo({ left: snap, behavior: "smooth" });
  }

  window.moveRiskModuleIntoModal = function () {
  if (typeof riskModule === "undefined" || typeof modalBody === "undefined") return;

  if (!modalBody.contains(riskModule)) {
    document.getElementById("tab-posCalc").appendChild(riskModule);
  }
};
