    // 2. RENDER ARSENAL (WITH TERMINOLOGY MAPPING)
  window.renderArsenal = function() {
    const container = document.getElementById("arsenal-grid");
    if (!container) return;
    container.innerHTML = "";

    if (playbookData.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#444; border:1px dashed #333; border-radius:6px;">ARSENAL EMPTY. FORGE YOUR FIRST PROTOCOL.</div>`;
      return;
    }

    const filter = window.currentArsenalFilter || "all";
    const items =
      filter === "all"
        ? playbookData
        : playbookData.filter((p) => p.section === filter);

    // --- TERMINOLOGY MAP ---
    const tierMap = {
      legendary: "CLASSIFIED", // Gold
      epic: "ELITE", // Purple
      rare: "TACTICAL", // Blue
      common: "STANDARD", // Grey
    };

    items.forEach((item) => {
      const rarities = [
        "common",
        "common",
        "common",
        "rare",
        "rare",
        "epic",
        "legendary",
      ];
      const hash = item.id.toString().charCodeAt(item.id.toString().length - 1);
      const rawRarity = item.rarity || rarities[hash % rarities.length];

      // GET DISPLAY NAME
      const displayRarity = tierMap[rawRarity.toLowerCase()] || "STANDARD";

      const defaultImg =
        "https://media.istockphoto.com/id/1365310330/vector/technical-algorithm-operator-vector-illustration.jpg?s=612x612&w=0&k=20&c=2e0mD9d-yqF3d1qX_u4d1f2d2d2d2d2d2d2d2d2d2d2";
      const imgUrl =
        item.link && item.link.startsWith("http") ? item.link : defaultImg;

      const card = document.createElement("div");
      // Keep rawRarity in class for colors, use displayRarity for text
      card.className = `codex-card ${rawRarity}`;

      let bountyHtml = "";
      if (item.isBounty) {
        bountyHtml = `<span style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.8); color:#ffd700; border:1px solid #ffd700; font-size:8px; padding:2px 4px; border-radius:2px; z-index:10;">★ CONTRACT</span>`;
      }

      card.innerHTML = `
            ${bountyHtml}
            <img src="${imgUrl}" class="codex-img" onerror="this.style.display='none'">
            <div class="codex-content">
                <div class="codex-type"><span>${item.section.toUpperCase()}</span><span style="color:var(--accent)">LVL ${playerLevel}</span></div>
                <div class="codex-title">${item.title}</div>
                <div class="codex-desc">${item.desc}</div>
            </div>
           <div class="codex-footer">
                <!-- UPDATED LABEL HERE -->
                <div class="rarity-pill">${displayRarity}</div>
                <div style="display:flex; gap:10px;">
                    <button class="strat-del-btn" style="color:#888;" title="Inspect & Share" onclick="event.stopPropagation(); window.openIntelPreview('${item.id}')">⎘</button>
                    <button class="strat-del-btn" style="background:none; border:none;" title="Delete Rule" onclick="event.stopPropagation(); window.deleteRule('${item.id}')">✕</button>
                </div>
            </div>`;

      card.onclick = () => window.openIntelPreview(item.id);
      container.appendChild(card);
    });
  }

     window.filterArsenal = function (section, btn) {
    window.currentArsenalFilter = section;
    if (btn && btn.parentElement) {
      btn.parentElement
        .querySelectorAll(".btn-sm")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    }
    renderArsenal();
    playSound("hover");
  };

      // 1. GENERATE SHARE CARD (With CORS Proxy Fix)
  window.downloadIntelCard = (ruleId) => {
    const rule = playbookData.find((r) => r.id === ruleId);
    if (!rule) return;

    const tierMap = {
      legendary: "CLASSIFIED",
      epic: "ELITE",
      rare: "TACTICAL",
      common: "STANDARD",
    };
    const rarityKey = rule.rarity ? rule.rarity.toLowerCase() : "common";
    const displayName = tierMap[rarityKey] || "STANDARD";

    const stage = document.getElementById("share-card-stage");
    stage.setAttribute("data-rarity", rarityKey);

    // --- CONTRACT SPECIFIC LOGIC FOR HIDDEN STAGE ---
    const typeLabel = document.getElementById("sc-type");

    // Remove existing badge
    const existingBadge = document.getElementById("sc-contract-badge");
    if (existingBadge) existingBadge.remove();

    if (rule.isBounty) {
      typeLabel.innerText = "WEEKLY CONTRACT";
      typeLabel.style.color = "#ffd700";
      typeLabel.style.textShadow = "0 0 10px rgba(255, 215, 0, 0.3)";

      const badge = document.createElement("div");
      badge.id = "sc-contract-badge";
      badge.className = "contract-badge";
      badge.innerText = "CONTRACT FULFILLED";
      stage.appendChild(badge);
    } else {
      typeLabel.innerText = rule.section;
      typeLabel.style.color = "var(--accent)";
      typeLabel.style.textShadow = "none";
    }

    // Populate Data
    document.getElementById("sc-rank").innerText =
      document.getElementById("player-rank").innerText;
    document.getElementById("sc-title").innerText = rule.title;
    document.getElementById("sc-desc").innerText = rule.desc;
    document.getElementById("sc-rarity").innerText = displayName;
    document.getElementById("sc-id").innerText =
      "#" + rule.id.toString().slice(-4);

    const imgEl = document.getElementById("sc-img");
    if (rule.link && rule.link.length > 5) {
      const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(rule.link);
      imgEl.crossOrigin = "anonymous";
      imgEl.src = proxyUrl;
      imgEl.style.display = "block";
    } else {
      imgEl.style.display = "none";
    }

    sysNotify("RENDERING INTEL CARD...", "info");

    setTimeout(() => {
      html2canvas(stage, {
        backgroundColor: "#050505",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `INTEL_${rule.title.replace(/\s+/g, "_").toUpperCase()}.jpg`;
          link.href = canvas.toDataURL("image/jpeg", 0.9);
          link.click();
          sysNotify("DOWNLOAD COMPLETE", "success");
        })
        .catch((err) => {
          console.error("Render Error:", err);
          sysNotify("RENDER FAILED", "error");
        });
    }, 1500);
  };

    // 1. OPEN PREVIEW MODAL
  window.openIntelPreview = (ruleId) => {
    const rule = playbookData.find((r) => r.id === ruleId);
    if (!rule) return;

    const tierMap = {
      legendary: "CLASSIFIED",
      epic: "ELITE",
      rare: "TACTICAL",
      common: "STANDARD",
    };
    const rarityKey = rule.rarity ? rule.rarity.toLowerCase() : "common";
    const displayName = tierMap[rarityKey] || "STANDARD";

    // --- SETUP VISUALS ---
    const cardEl = document.getElementById("intel-card-visual");
    const typeLabel = document.getElementById("i-type");

    // Reset Classes
    cardEl.className = "";
    if (rule.rarity) cardEl.classList.add(rule.rarity);

    // --- CONTRACT SPECIFIC LOGIC ---
    // Remove existing badge if present from previous opens
    const existingBadge = document.getElementById("i-contract-badge");
    if (existingBadge) existingBadge.remove();

    if (rule.isBounty) {
      // 1. Change Label
      typeLabel.innerText = "WEEKLY CONTRACT";
      typeLabel.style.color = "#ffd700"; // Gold Text
      typeLabel.style.textShadow = "0 0 10px rgba(255, 215, 0, 0.3)";

      // 2. Add Badge
      const badge = document.createElement("div");
      badge.id = "i-contract-badge";
      badge.className = "contract-badge";
      badge.innerText = "CONTRACT FULFILLED";
      cardEl.appendChild(badge);
    } else {
      // Standard Card
      typeLabel.innerText = rule.section;
      typeLabel.style.color = "var(--accent)";
      typeLabel.style.textShadow = "none";
    }

    // --- DATA POPULATION ---
    document.getElementById("i-rank").innerText =
      document.getElementById("player-rank").innerText;
    document.getElementById("i-title").innerText = rule.title;
    document.getElementById("i-desc").innerText = rule.desc;
    document.getElementById("i-rarity").innerText = displayName;
    document.getElementById("i-id").innerText =
      "#" + rule.id.toString().slice(-4);

    // Image Handling
    const imgEl = document.getElementById("intel-img-target");
    if (rule.link && rule.link.length > 5) {
      const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(rule.link);
      imgEl.src = proxyUrl;
      imgEl.style.display = "block";
    } else {
      imgEl.style.display = "none";
    }

    // Show Modal
    document.getElementById("intel-preview-modal").style.display = "flex";
    playSound("hover");

    // Setup Download Button
    const downloadBtn = document.getElementById("btn-download-intel");
    const newBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);

    newBtn.onclick = () => {
      newBtn.innerText = "RENDERING...";
      // Use html2canvas on the VISIBLE card (intel-card-visual)
      html2canvas(document.getElementById("intel-card-visual"), {
        backgroundColor: "#050505",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `INTEL_${rule.title.replace(/\s+/g, "_").toUpperCase()}.jpg`;
          link.href = canvas.toDataURL("image/jpeg", 0.9);
          link.click();
          newBtn.innerText = "⬇ DOWNLOAD CARD";
          sysNotify("DOWNLOAD COMPLETE", "success");
          playSound("win");
        })
        .catch((err) => {
          console.error(err);
          newBtn.innerText = "ERROR";
          sysNotify("RENDER ERROR", "error");
        });
    };
  };
 
    // Close on background click
  document.getElementById("intel-preview-modal").onclick = (e) => {
    if (e.target.id === "intel-preview-modal") {
      e.target.style.display = "none";
    }
  };