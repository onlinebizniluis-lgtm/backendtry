    // --- MODIFIED MODAL SYSTEM (CLICK OUTSIDE TO CLOSE) ---
  window.sysConfirm = (title, message, isDanger = false) => {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sys-modal-overlay";

      overlay.innerHTML = `
            <div class="sys-modal">
                <div class="modal-inner">
                    <div class="modal-title">
                        <span style="color:${isDanger ? "var(--error)" : "var(--accent)"}">⚠</span> ${title}
                    </div>
                    <div class="modal-body">${message}</div>
                    <div class="modal-actions">
                        <button id="modal-cancel" class="btn-modal">CANCEL</button>
                        <button id="modal-ok" class="btn-modal ${isDanger ? "danger" : "primary"}">CONFIRM</button>
                    </div>
                </div>
            </div>
        `;

      document.body.appendChild(overlay);
      playSound("hover");

      const cancelBtn = document.getElementById("modal-cancel");
      const okBtn = document.getElementById("modal-ok");

      // --- SINGLE SOURCE CLICK HANDLERS (no duplicates) ---
      cancelBtn.onclick = () => {
        playSound("click");
        overlay.remove();
        resolve(false);
      };

      okBtn.onclick = () => {
        playSound("win");
        overlay.remove();
        resolve(true);
      };

      // clicking outside = cancel
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      };
    });
  };

  
window.openCalendar = function() {
    let pickDate = new Date();
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sys-modal-overlay";
      const render = () => {
        const year = pickDate.getFullYear(),
          month = pickDate.getMonth(),
          firstDay = new Date(year, month, 1).getDay(),
          daysInMonth = new Date(year, month + 1, 0).getDate();
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
        let gridHtml = "";
        for (let i = 0; i < firstDay; i++)
          gridHtml += `<div class="cal-day empty"></div>`;
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
          gridHtml += `<div class="cal-day" data-date="${dateStr}">${d}</div>`;
        }
        overlay.innerHTML = `<div class="sys-modal"><div class="modal-inner"><div class="modal-title"><span>📅</span> SELECT DATE</div><div class="cal-header"><button id="cal-prev" class="cal-btn">&#9664;</button><span style="font-weight:bold; color:#fff;">${monthNames[month]} ${year}</span><button id="cal-next" class="cal-btn">&#9654;</button></div><div class="cal-grid"><div class="cal-day-header">S</div><div class="cal-day-header">M</div><div class="cal-day-header">T</div><div class="cal-day-header">W</div><div class="cal-day-header">T</div><div class="cal-day-header">F</div><div class="cal-day-header">S</div>${gridHtml}</div><div class="modal-actions" style="margin-top:20px;"><button id="cal-cancel" class="btn-modal">CANCEL</button></div></div></div>`;
      };
      render();
      document.body.appendChild(overlay);
      playSound("hover");

      const close = (val) => {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 200);
        resolve(val);
      };

      // Close on background click
      overlay.onclick = (e) => {
        if (e.target === overlay) close(null);
      };

      overlay.addEventListener("click", (e) => {
        if (e.target.id === "cal-prev") {
          pickDate.setMonth(pickDate.getMonth() - 1);
          render();
          playSound("hover");
        }
        if (e.target.id === "cal-next") {
          pickDate.setMonth(pickDate.getMonth() + 1);
          render();
          playSound("hover");
        }
        if (e.target.id === "cal-cancel") {
          close(null);
        }
        if (
          e.target.classList.contains("cal-day") &&
          !e.target.classList.contains("empty")
        ) {
          playSound("win");
          close(e.target.dataset.date);
        }
      });
    });
  }
