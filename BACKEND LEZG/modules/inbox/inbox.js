//INBOX

  window.checkPlanExpirations = function() {
    if (!window.plannedTrades || window.plannedTrades.length === 0) return;

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const fourHours = 4 * 60 * 60 * 1000;

    window.plannedTrades.forEach((plan) => {
      const timeLeft = plan.expiration - now;

      // 1 hour warning (add to inbox if not already there)
      if (timeLeft > 0 && timeLeft <= oneHour) {
        const existing = inboxItems.find(
          (i) => i.planId === plan.id && i.type === "warning",
        );
        if (!existing) {
          inboxItems.push({
            id: Date.now() + Math.random(),
            planId: plan.id,
            type: "warning",
            // 🔧 FIX: clone the plan correctly
            plan: { ...plan },
            createdAt: now,
            message: `${plan.pair} plan expires in less than 1 hour`,
          });
          playSound("hover");
        }
      }

      // Expired (move to inbox)
      if (timeLeft <= 0) {
        const existing = null; // allow re-triggering for testing and renewal logic
        if (!existing) {
          inboxItems.push({
            id: Date.now() + Math.random(),
            planId: plan.id,
            type: "expired",
            // 🔧 FIX: clone the plan correctly
            plan: { ...plan },
            createdAt: now,
            deleteAt: now + fourHours, // Auto-delete in 4 hours
            message: `${plan.pair} plan has expired`,
          });

          // Remove from planned trades
          window.plannedTrades = window.plannedTrades.filter(
            (p) => p.id !== plan.id,
          );
          saveData("plans");
          renderPlannedTrades();

          sysNotify(`PLAN EXPIRED: ${plan.pair}`, "error");
          playSound("error");
        }
      }
    });

    // Auto-delete old expired items (4 hours after expiration)
    inboxItems = inboxItems.filter((item) => {
      if (item.type === "expired" && item.deleteAt) {
        return now < item.deleteAt;
      }
      return true;
    });

    // Remove warnings for plans that were renewed/deleted
    inboxItems = inboxItems.filter((item) => {
      if (item.type === "warning") {
        const stillExists = window.plannedTrades?.find(
          (p) => p.id === item.planId,
        );
        return stillExists;
      }
      return true;
    });

    saveInbox();
    updateInboxUI();
  }
  function renderInbox() {
    const container = document.getElementById("inbox-list");
    if (!container) return;

    let items = [...inboxItems];

    // Apply filter
    if (inboxFilter === "warning")
      items = items.filter((i) => i.type === "warning");
    if (inboxFilter === "expired")
      items = items.filter((i) => i.type === "expired");

    // Sort: expired first, then by creation time
    items.sort((a, b) => {
      if (a.type === "expired" && b.type !== "expired") return -1;
      if (a.type !== "expired" && b.type === "expired") return 1;
      return b.createdAt - a.createdAt;
    });

    if (items.length === 0) {
      container.innerHTML = `
            <div class="empty-inbox">
                <svg style="width:40px; height:40px; opacity:0.3; margin-bottom:10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <div>NO NOTIFICATIONS</div>
            </div>`;
      return;
    }

    const now = Date.now();

    container.innerHTML = items
      .map((item) => {
        const plan = item.plan;
        const isExpired = item.type === "expired";

        // Calculate countdown
        let countdownHTML = "";
        if (isExpired && item.deleteAt) {
          const timeLeft = item.deleteAt - now;
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
          const minsLeft = Math.floor(
            (timeLeft % (1000 * 60 * 60)) / (1000 * 60),
          );
          countdownHTML = `<div class="countdown-timer">AUTO-DELETE IN: ${hoursLeft}H ${minsLeft}M</div>`;
        } else {
          const timeLeft = plan.expiration - now;
          const minsLeft = Math.floor(timeLeft / (1000 * 60));
          countdownHTML = `<div class="countdown-timer" style="background:rgba(244,211,94,0.1); color:#f4d35e;">EXPIRES IN: ${minsLeft} MIN</div>`;
        }

        // Direction badge
        const isLong = plan.direction === "LONG";
        const dirColor = isLong ? "var(--accent)" : "var(--error)";
        const dirBadge = `<span style="color:${dirColor}; font-size:10px; border:1px solid ${dirColor}; padding:2px 6px; border-radius:3px;">${plan.direction}</span>`;

        return `
        <div class="inbox-item ${item.type}">
            <div class="inbox-info">
                <div class="inbox-title">
                    ${plan.pair} ${dirBadge}
                    <span style="font-size:10px; opacity:0.6;">| ${plan.setup}</span>
                </div>
                <div class="inbox-meta">
                    ${isExpired ? "⚠️ EXPIRED" : "EXPIRING SOON"} — Created: ${new Date(plan.createdAt).toLocaleString()}
                </div>
                ${countdownHTML}
            </div>
            <div class="inbox-actions">
                ${
                  isExpired
                    ? `
                    <button class="btn-sm" onclick="window.renewFromInbox('${item.id}')" style="border-color:var(--accent); color:var(--accent);">RENEW</button>
                    <button class="btn-sm" onclick="window.deleteFromInbox('${item.id}')" style="border-color:var(--error); color:var(--error);">DELETE</button>
                `
                    : `
                    <button class="btn-sm" onclick="window.viewPlanFromInbox('${item.planId}')" style="border-color:var(--accent); color:var(--accent);">VIEW</button>
                `
                }
            </div>
        </div>`;
      })
      .join("");
  }

    function updateInboxUI() {
    const badge = document.getElementById("inbox-badge");
    const counter = document.getElementById("inbox-counter");
    const count = inboxItems.length;

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-block" : "none";
    }

    if (counter) {
      counter.textContent = `${count} NOTIFICATION${count !== 1 ? "S" : ""}`;
    }

    // ❌ remove: renderInbox();  ← this was causing the loop
  }
  window.filterInbox = function (type, btn) {
    inboxFilter = type;

    if (btn && btn.parentElement) {
      const siblings = btn.parentElement.querySelectorAll(".btn-sm");
      siblings.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    }

    renderInbox();
    playSound("hover");
  };
  window.renewFromInbox = async (inboxId) => {
    const item = inboxItems.find((i) => i.id === inboxId);
    if (!item) return;

    const plan = item.plan;

    // Check capacity (respect open trade limit)
    const maxOpen = parseInt(systemData["s_max_open"] || 999);
    const currentOpen = (window.openTrades || []).length;

    if (currentOpen >= maxOpen) {
      playSound("error");
      return sysNotify(
        `CAPACITY FULL — Close trades first (${currentOpen}/${maxOpen})`,
        "error",
      );
    }

    if (
      await sysConfirm(
        "RENEW PLAN",
        `Extend ${plan.pair} by ${plan.expireHours || 24} hours?`,
      )
    ) {
      // Restore to planned trades with new expiration
      const newExpiration =
        Date.now() + (plan.expireHours || 24) * 60 * 60 * 1000;
      const renewedPlan = {
        // 🔧 FIX: spread original plan fields
        ...plan,
        expiration: newExpiration,
        createdAt: Date.now(), // Update creation time
      };

      // 🔧 FIX: correct array spread when re-adding to plannedTrades
      window.plannedTrades = [...(window.plannedTrades || []), renewedPlan];

      // Remove from inbox
      inboxItems = inboxItems.filter((i) => i.id !== inboxId);

      await saveData("plans");
      saveInbox();

      renderPlannedTrades();
      updateInboxUI();

      sysNotify("PLAN RENEWED", "success");
      playSound("win");
    }
  };

    window.deleteFromInbox = async (inboxId) => {
    if (
      await sysConfirm("DELETE NOTIFICATION", "Remove this from inbox?", true)
    ) {
      inboxItems = inboxItems.filter((i) => i.id !== inboxId);
      saveInbox();
      updateInboxUI();
      sysNotify("NOTIFICATION DELETED", "success");
    }
  };

    window.viewPlanFromInbox = (planId) => {
    // Switch to terminal tab and highlight the plan
    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));
    document.querySelector('[data-target="tab-term"]').classList.add("active");

    document.querySelectorAll(".view-section").forEach((s) => {
      s.style.display = "none";
      s.classList.remove("active");
    });

    const termTab = document.getElementById("tab-term");
    if (termTab) {
      termTab.style.display = "block";
      termTab.classList.add("active");
    }

    // Highlight the card briefly
    setTimeout(() => {
      const card = document
        .querySelector(`[data-plan-id="${planId}"]`)
        ?.closest(".planned-card");
      if (card) {
        card.style.border = "2px solid var(--accent)";
        card.style.boxShadow = "0 0 20px rgba(0,255,157,0.3)";
        card.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(() => {
          card.style.border = "";
          card.style.boxShadow = "";
        }, 2000);
      }
    }, 300);
  };

    // Save inbox to localStorage (inbox is portfolio-specific)
  window.saveInbox = function() {
    if (isDemo) return;
    if (!currentUser || !currentPortfolioId) return;

    const key = `inbox_${currentUser.uid}_${currentPortfolioId}`;
    localStorage.setItem(key, JSON.stringify(inboxItems));
  }

  // Load inbox from localStorage
  window.loadInbox = function() {
    if (isDemo) {
      inboxItems = [];
      return;
    }
    if (!currentUser || !currentPortfolioId) return;

    const key = `inbox_${currentUser.uid}_${currentPortfolioId}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        inboxItems = JSON.parse(saved);
      } catch (e) {
        inboxItems = [];
      }
    } else {
      inboxItems = [];
    }

    updateInboxUI();
  }