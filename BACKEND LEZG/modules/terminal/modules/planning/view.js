window.renderPlannedTrades = function () { 
    const container = document.getElementById("plannedTradeList");
    if (!container) return;

    // Block guests
    if (!currentUser || currentUser.uid === "guest" || isDemo) {
      container.innerHTML = `<div class="empty-msg">Login required to view trade plans.</div>`;
      return;
    }

    // Check portfolio
    if (!currentPortfolioId) {
      container.innerHTML = `<div class="empty-msg">Select a portfolio to view plans.</div>`;
      return;
    }

    const plans = window.plannedTrades || [];

    // Filter expired
    const now = Date.now();
    const activePlans = plans.filter((p) => p.expiration > now);

    if (activePlans.length !== plans.length) {
      window.plannedTrades = activePlans;
      saveData("plans");
    }

    if (activePlans.length === 0) {
      container.innerHTML = `<div class="empty-msg">No active trade plans.</div>`;
      return;
    }

    // Render cards
    container.innerHTML = activePlans
      .map((plan) => {
        const expiresIn = plan.expiration - now;
        const hoursLeft = Math.floor(expiresIn / (1000 * 60 * 60));
        const expireText = hoursLeft < 1 ? "< 1 HR" : `${hoursLeft} HRS`;
        const expireColor =
          hoursLeft < 6
            ? "var(--error)"
            : hoursLeft < 12
              ? "#f4d35e"
              : "var(--accent)";

        const hasChart = plan.screenshot && plan.screenshot.trim().length > 0;

        // --- NEW: DIRECTION LOGIC ---
        const isLong = plan.direction === "LONG";
        const dirColor = isLong ? "var(--accent)" : "var(--error)";
        const dirArrow = isLong ? "▲" : "▼";
        const dirBadge = `<span style="color:${dirColor}; border:1px solid ${dirColor}; font-size:9px; padding:2px 6px; border-radius:3px; margin-left:8px; background:rgba(0,0,0,0.4);">${dirArrow} ${plan.direction}</span>`;

        return `
        <div class="planned-card trade-card">
            <div class="plan-badge">${plan.discipline || 0}%</div>
            
            <div class="planned-info">
                <!-- UPDATED: Pair now includes Direction Badge -->
                <div class="pair" style="display:flex; align-items:center;">
                    ${plan.pair} ${dirBadge}
                </div>
                <div class="meta">${plan.setup} • ${plan.sess}</div>
                <div class="meta" style="color:${expireColor}; margin-top:4px;">
                    ⏱ EXPIRES: ${expireText}
                </div>
            </div>

            ${
              hasChart
                ? `
            <img src="${plan.screenshot}" 
            alt="chart" 
            class="plan-thumb trade-img"
            onclick='openImagePreview("${plan.screenshot}", ${JSON.stringify(plan).replace(/"/g, "&quot;")})' />
            `
                : `<div class="no-chart-placeholder">NO CHART</div>`
            }

            <div class="plan-notes">${plan.notes || "No notes"}</div>

            <div class="plan-actions">
                <button class="btn-plan btn-execute" data-plan-id="${plan.id}" data-action="execute">EXECUTE</button>
                <button class="btn-plan" data-plan-id="${plan.id}" data-action="renew">RENEW</button>
                <button class="btn-plan btn-abort" data-plan-id="${plan.id}" data-action="abort">ABORT</button>
            </div>
        </div>`;
      })
      .join("");

    // ---- ATTACH EVENT LISTENERS AFTER RENDER ----
    attachPlanActionListeners();

    // ---- SMART VISIBILITY RULES ----
    const count = activePlans.length;
    const navContainer =
      document.getElementById("carouselNav") ||
      document.getElementById("plannedControls");
    const toggleBtnContainer = document.getElementById("toggle-view");

    if (count <= 1) {
      if (navContainer) navContainer.style.display = "none";
      if (toggleBtnContainer) toggleBtnContainer.style.display = "none";
    } else {
      if (navContainer) navContainer.style.display = "flex";
      if (toggleBtnContainer) toggleBtnContainer.style.display = "inline-block";
    }

    // ---- APPLY COMPACT MODE ----
    container.classList.add("compact");

    // ---- HOOK BUTTONS AFTER RENDER + SNAP ----
    const next = document.getElementById("carouselNext");
    const prev = document.getElementById("carouselPrev");

    if (next && prev) {
      const cardWidth = 380;
      next.onclick = () => {
        container.scrollLeft += cardWidth;
        setTimeout(() => snapToNearest(container, cardWidth), 220);
      };
      prev.onclick = () => {
        container.scrollLeft -= cardWidth;
        setTimeout(() => snapToNearest(container, cardWidth), 220);
      };
    }

    // ---- EXPANDED VIEW TOGGLE ----
    const toggleBtn = document.getElementById("toggle-view");
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        if (container.classList.contains("compact")) {
          container.classList.remove("compact");
          container.classList.add("expanded");
          toggleBtn.innerText = "COMPACT VIEW";
        } else {
          container.classList.remove("expanded");
          container.classList.add("compact");
          toggleBtn.innerText = "EXPANDED VIEW";
        }
      };
    }
  }

  
    window.renderPlannedTrades = function () {
    const container = document.getElementById("plannedTradeList");
    const navDiv = document.getElementById("carouselNav");

    if (!container) return;

    // 1. Auth Check
    if (!currentUser || currentUser.uid === "guest" || isDemo) {
      container.style.display = "block";
      container.innerHTML = `<div class="empty-slot-container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span>LOGIN REQUIRED</span></div>`;
      if (navDiv) navDiv.style.display = "none";
      return;
    }

    const plans = window.plannedTrades || [];
    const now = Date.now();
    const activePlans = plans.filter((p) => p.expiration > now);

    // 2. EMPTY STATE (TECH BOX - NO EMOJI)
    if (activePlans.length === 0) {
      container.style.display = "block";
      container.innerHTML = `
            <div class="empty-slot-container">
                <!-- FOLDER SVG ICON -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                <span style="font-weight:700;">NO ACTIVE PLANS</span>
                <span style="font-size:9px; color:#333; margin-top:4px;">INITIATE NEW SEQUENCE BELOW</span>
            </div>
        `;
      container.classList.remove("compact");

      // HIDE ARROWS
      if (navDiv) navDiv.style.setProperty("display", "none", "important");
      return;
    }

    // 3. RENDER CARDS
    container.style.display = "flex";
    container.innerHTML = activePlans
      .map((plan) => {
        const hoursLeft = Math.floor(
          (plan.expiration - now) / (1000 * 60 * 60),
        );
        const expireColor = hoursLeft < 6 ? "var(--error)" : "var(--accent)";
        const hasChart = plan.screenshot && plan.screenshot.trim().length > 0;
        const isLong = plan.direction === "LONG";
        const dirColor = isLong ? "var(--accent)" : "var(--error)";
        const dirBadge = `<span style="color:${dirColor}; border:1px solid ${dirColor}; font-size:9px; padding:2px 6px; border-radius:3px; margin-left:8px; background:rgba(0,0,0,0.4);">${isLong ? "▲" : "▼"} ${plan.direction}</span>`;

        return `
        <div class="planned-card trade-card">
            <div class="plan-badge">${plan.discipline || 0}%</div>
            <div class="planned-info">
                <div class="pair" style="display:flex; align-items:center;">${plan.pair} ${dirBadge}</div>
                <div class="meta">${plan.setup} • ${plan.sess}</div>
                <div class="meta" style="color:${expireColor}; margin-top:4px;">⏱ EXPIRES: ${hoursLeft}H</div>
            </div>
            ${hasChart ? `<img src="${plan.screenshot}" class="plan-thumb trade-img" onclick='openImagePreview("${plan.screenshot}")' />` : `<div class="no-chart-placeholder">NO VISUAL DATA</div>`}
            <div class="plan-notes">${plan.notes || "No notes"}</div>
            <div class="plan-actions">
                <button class="btn-plan btn-execute" data-plan-id="${plan.id}" data-action="execute">EXECUTE</button>
                <button class="btn-plan" data-plan-id="${plan.id}" data-action="renew">RENEW</button>
                <button class="btn-plan btn-abort" data-plan-id="${plan.id}" data-action="abort">ABORT</button>
            </div>
        </div>`;
      })
      .join("");

    container.classList.add("compact");

    // 4. SMART ARROWS (Show only if > 1 item)
    if (navDiv) {
      navDiv.style.setProperty(
        "display",
        activePlans.length > 1 ? "flex" : "none",
        "important",
      );
    }
    attachPlanActionListeners();
  };

  window.attachPlanActionListeners = function () {
  document.querySelectorAll(".plan-actions button").forEach((btn) => {
    const planId = btn.dataset.planId;
    const action = btn.dataset.action;

    btn.onclick = () => {
      playSound("click");

      if (action === "execute") openExecutionModal(planId);
      if (action === "renew") renewTradePlan(planId);
      if (action === "abort") abortTradePlan(planId);
    };
  });
};

    function attachPlanEvents() {
    document.querySelectorAll(".plan-thumb").forEach((img) => {
      img.onclick = () => openImageModal(img.dataset.img);
    });

    document.querySelectorAll(".plan-actions button").forEach((btn) => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      btn.onclick = null;
      btn.onclick = () => {
        if (action === "execute") executeTradePlan(id);
        if (action === "renew") renewTradePlan(id);
        if (action === "abort") abortTradePlan(id);

        overlay.remove();
        playSound("click");
      };
    });
  }
  function openImageModal(src) {
    const modal = document.getElementById("imgPreviewModal");
    const img = document.getElementById("imgPreviewTarget");

    img.src = src;
    img.dataset.scale = "1";
    img.style.transform = "scale(1)";

    modal.classList.remove("hidden");
    modal.style.display = "flex"; // 🔹 force show only here

    // Scroll to zoom
    img.onwheel = (e) => {
      e.preventDefault();
      let scale = parseFloat(img.dataset.scale || "1");
      scale += e.deltaY < 0 ? 0.25 : -0.25;
      scale = Math.min(Math.max(scale, 1), 6);
      img.dataset.scale = scale.toFixed(2);
      img.style.transform = `scale(${scale})`;
    };
  }

  document.querySelectorAll(".planned-card")
    .forEach((c) => c.classList.remove("active"));
window.attachPlanActionListeners = function() {
  
  // Execute Button (Calls the Master Function)
    document.querySelectorAll('[data-action="execute"]').forEach((btn) => {
      const planId = btn.getAttribute("data-plan-id");

      // Remove old listener and create new clean one
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.onclick = (e) => {
        e.stopPropagation();

        // Direct inline call instead of relying on window
        executeTradePlanDirect(planId);
      };
    });

    // Renew Button
    document.querySelectorAll('[data-action="renew"]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        window.renewTradePlan(parseInt(btn.getAttribute("data-plan-id")));
      };
    });

    // Abort Button
    document.querySelectorAll('[data-action="abort"]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        window.abortTradePlan(parseInt(btn.getAttribute("data-plan-id")));
      };
    });
  }

window.attachOpenTradeListeners = function() {
        // Remove old listeners by getting fresh references
    const container = document.getElementById("openTradesList");
    if (!container) return;

    // Use event delegation on the container
    container.querySelectorAll("[data-action]").forEach((element) => {
      const tradeId = parseInt(element.getAttribute("data-trade-id"));
      const action = element.getAttribute("data-action");

      if (action === "view-detail") {
        element.onclick = (e) => {
          e.stopPropagation();
          viewOpenTradeDetailModal(tradeId);
        };
      }

      if (action === "close") {
        element.onclick = (e) => {
          e.stopPropagation();
          closeOpenTrade(tradeId);
        };
      }
    });
  }
