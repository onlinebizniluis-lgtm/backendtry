
window.renderPlaybook = function() {
    const container = document.getElementById("playbook-scroll-container");
    if (!container) return;

    // Helper to generate a single card HTML with GRID STYLING
    const makeCard = (item) => {
      const isImg =
        item.link &&
        (item.link.match(/\.(jpeg|jpg|gif|png)$/i) ||
          item.link.includes("tradingview.com/x/"));
      let m = "";
      if (isImg)
        m = `<div class="strat-img-box" onclick="window.zoomImage('${item.link}')"><img src="${item.link}" class="strat-img"></div>`;
      else if (item.link)
        m = `<a href="${item.link}" target="_blank" class="btn-link" style="display:block;text-align:right;margin-top:5px;color:var(--accent);">[ VIEW LINK ↗ ]</a>`;

      return `
          <div class="strat-card">
              <div class="strat-title">
                  <span>${item.title}</span>
                  <button onclick="deleteRule('${item.id}')" class="strat-del-btn">✕</button>
              </div>
              <div class="strat-desc">${item.desc}</div>
              ${m}
              <div class="strat-meta">
                  <span>PAIRS: ${item.pairs || "ALL"}</span>
              </div>
          </div>
         `;
    };

    if (currentPlaybookFilter === "all") {
      // Render All Categories Sequentially
      const sections = [
        { k: "entry", l: "ENTRY PROTOCOLS" },
        { k: "exit", l: "EXIT PROTOCOLS" },
        { k: "conditions", l: "CONDITIONS" },
        { k: "patterns", l: "PATTERNS" },
        { k: "mistakes", l: "MISTAKES" },
      ];

      let fullHtml = "";
      let hasAny = false;

      sections.forEach((sec) => {
        const items = playbookData.filter((p) => p.section === sec.k);
        if (items.length > 0) {
          hasAny = true;
          fullHtml += `<div class="strat-section-header">${sec.l}</div>`;
          fullHtml += `<div class="strat-grid">${items.map(makeCard).join("")}</div>`;
        }
      });

      container.innerHTML = hasAny
        ? fullHtml
        : `<div style="text-align:center; padding:20px; color:#444;">PLAYBOOK IS EMPTY</div>`;
    } else {
      // Render Specific Section
      const filtered = playbookData.filter(
        (p) => p.section === currentPlaybookFilter,
      );
      if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#444;">NO RULES DEFINED FOR THIS SECTION</div>`;
      } else {
        container.innerHTML = `<div class="strat-grid">${filtered.map(makeCard).join("")}</div>`;
      }
    }
  }
  
      // Strat Intel Button (OPTIMIZED FOR READABILITY)
    const stratBtnNew = document.getElementById("btn-strat-intel");
    if (stratBtnNew) {
      const cleanBtn = stratBtnNew.cloneNode(true);
      stratBtnNew.parentNode.replaceChild(cleanBtn, stratBtnNew);
      cleanBtn.addEventListener("click", () => {
        if (playbookData.length === 0)
          return sysNotify("PLAYBOOK EMPTY", "error");
        playSound("hover");
  
        const renderSec = (name, code) => {
          const items = playbookData.filter((p) => p.section === code);
          if (!items.length) return "";
  
          const gridHtml = items
            .map((i) => {
              const isImg =
                i.link &&
                (i.link.match(/\.(jpeg|jpg|gif|png)$/i) ||
                  i.link.includes("tradingview.com/x/"));
              let m = "";
              // Clean Grid Image (WITH CONTAIN)
              if (isImg)
                m = `<div class="strat-img-box" onclick="window.zoomImage('${i.link}')"><img src="${i.link}" class="strat-img"></div>`;
              else if (i.link)
                m = `<a href="${i.link}" target="_blank" class="btn-link" style="display:block;text-align:right;margin-top:5px;color:var(--accent);">[ VIEW LINK ↗ ]</a>`;
  
              return `
                      <div class="strat-card">
                          <div class="strat-title">${i.title}</div>
                          <div class="strat-desc">${i.desc}</div>
                          ${m}
                          <div class="strat-meta"><span>${i.pairs}</span></div>
                      </div>`;
            })
            .join("");
  
          return `<div class="strat-section-header">${name}</div><div class="strat-grid">${gridHtml}</div>`;
        };
  
        const html = `
               <div style="margin-bottom:10px; font-size:10px; color:#666; font-family:var(--font-mono);">
                   SYSTEM: <span style="color:#fff">${systemData["s_style"] || "N/A"}</span> | 
                   RISK: <span style="color:var(--accent)">${systemData["s_risk"] || "-"}%</span>
               </div>
               ${renderSec("🛑 ENTRY PROTOCOLS", "entry")}
               ${renderSec("🎯 EXIT PROTOCOLS", "exit")}
               ${renderSec("⚡ CONDITIONS", "conditions")}
               ${renderSec("📐 PATTERNS", "patterns")}
               ${renderSec("⚠ MISTAKES", "mistakes")}
            `;
  
        const overlay = document.createElement("div");
        overlay.className = "sys-modal-overlay";
        // Increased width to 800px to accommodate the 2-column grid comfortably
        overlay.innerHTML = `<div class="sys-modal wide" style="width:800px;"><div class="modal-inner" style="max-height:85vh;"><div class="modal-title">📂 STRAT INTEL</div><div class="modal-body" style="overflow-y:auto; padding-right:5px;">${html}</div><div class="modal-actions"><button class="btn-modal" onclick="this.closest('.sys-modal-overlay').remove()">CLOSE INTEL</button></div></div></div>`;
  
        // Close on background click
        overlay.onclick = (e) => {
          if (e.target === overlay) overlay.remove();
        };
  
        document.body.appendChild(overlay);
      });
    }