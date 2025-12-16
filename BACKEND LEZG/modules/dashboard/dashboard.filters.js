// DASHBOARD FILTERS AND RANGE SELECTION


window.setDashRange = (val, btn) => {
  if (val === "custom") {
    window.openCustomDashRangeModal();
    return;
  }

  dashRangeCount = val;

  if (btn && btn.parentElement) {
    const siblings = btn.parentElement.querySelectorAll(".btn-sm");
    siblings.forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
  }

  playSound("hover");
  updateDashboard();
};

  window.openCustomDashRangeModal = function () {
    const overlay = document.createElement("div");
    overlay.className = "sys-modal-overlay";

    const today = new Date().toISOString().split("T")[0];

    overlay.innerHTML = `
        <div class="sys-modal" style="width:300px; border:1px solid var(--accent);">
            <div class="modal-inner">
                <div class="modal-title">SELECT RANGE</div>
                <div class="modal-body" style="padding:10px 0;">
                    <div class="f-group">
                        <label>START DATE</label>
                        <input type="date" id="custom-start" class="inp-std" max="${today}">
                    </div>
                    <div class="f-group" style="margin-top:10px;">
                        <label>END DATE</label>
                        <input type="date" id="custom-end" class="inp-std" value="${today}" max="${today}">
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-modal" onclick="this.closest('.sys-modal-overlay').remove()">CANCEL</button>
                    <button class="btn-modal primary" id="btn-apply-custom">APPLY</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("btn-apply-custom").onclick = () => {
      const s = document.getElementById("custom-start").value;
      const e = document.getElementById("custom-end").value;

      if (!s || !e) return sysNotify("INVALID DATES", "error");

      dashFilterState = { mode: "custom", days: 0, start: s, end: e };

      // Update Label
      const label = document.getElementById("dash-date-label");
      if (label) label.innerText = `${s} TO ${e}`;

      updateDashboard();
      overlay.remove();
      if (typeof playSound === "function") playSound("win");
    };
  };