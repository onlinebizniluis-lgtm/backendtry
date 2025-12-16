//Calculator

  window.initRiskSearch = function() {

    const els = {
      bal: document.getElementById("re-bal"),
      risk: document.getElementById("re-risk"),
      search: document.getElementById("re-search"),
      dropdown: document.getElementById("re-dropdown"),
      pipVal: document.getElementById("re-pipval"),
      sl: document.getElementById("re-sl"),
      lots: document.getElementById("re-lots"),
      cash: document.getElementById("re-cash"),
      applyBtn: document.getElementById("btn-apply-risk"),
    };

    if (!els.search) return;

    const pairs = [
      "EURUSD",
      "GBPUSD",
      "AUDUSD",
      "NZDUSD",
      "USDCAD",
      "USDCHF",
      "USDJPY",
      "GBPJPY",
      "EURJPY",
      "XAUUSD",
      "US30",
      "NAS100",
      "SPX500",
      "BTCUSD",
      "ETHUSD",
    ];

    const getDynamicPipValue = (pair, price) => {
      // A. INDICES (1 Point = 1 Dollar usually on 1.0 Lot standard contract)
      if (["US30", "NAS100", "SPX500", "GER30"].includes(pair)) return 1;

      // B. GOLD (10 cents move = 1 pip usually, depends on broker. Standard is 1.00 move = $100 on 1 lot? No, usually 1.00 move = 10 pips = $10)
      // Standard Forex Broker Logic: 1 Lot on Gold ($1 move) = $100 P&L? No, usually $10/pip.
      // Let's stick to: 1 Pip (0.10 move) = $1 on 1 Lot.
      // So a $1.00 move (10 pips) = $10.
      // Formula: Lots = Risk / (StopPoints * PipValue)
      if (pair === "XAUUSD") return 10; // $1.00 move = 10 units of currency

      // C. JPY PAIRS
      if (pair.endsWith("JPY")) return 1000 / price;

      // D. USD PAIRS
      if (pair.endsWith("USD")) return 10; // Standard Lot ($10/pip)

      // E. CROSSES
      if (pair.endsWith("CAD")) return 10 / 1.35; // Approx
      if (pair.endsWith("GBP")) return 13;

      return 10; // Default fallback
    };

    // SEARCH LISTENER
    els.search.addEventListener("input", (e) => {
      const term = e.target.value.toUpperCase();
      els.dropdown.innerHTML = "";
      if (term.length < 1) {
        els.dropdown.style.display = "none";
        return;
      }

      const matches = pairs.filter((p) => p.includes(term));
      if (matches.length > 0) {
        els.dropdown.style.display = "block";
        matches.forEach((pair) => {
          const div = document.createElement("div");
          div.className = "search-item";
          div.innerHTML = `${pair}`;
          div.onclick = async () => {
            els.search.value = pair;
            els.dropdown.style.display = "none";
            const oldTxt = els.applyBtn.innerText;
            els.applyBtn.innerText = "FETCHING...";
            els.lots.innerText = "...";

            const price = await getCurrentPrice(pair);

            if (price) {
              sysNotify(`LIVE: ${price.toFixed(2)}`, "success");
              const pVal = getDynamicPipValue(pair, price);
              els.pipVal.value = pVal;
              calculate();
            } else {
              sysNotify("PRICE FETCH FAILED", "error");
              els.lots.innerText = "ERR";
            }
            els.applyBtn.innerText = oldTxt;
          };
          els.dropdown.appendChild(div);
        });
      } else {
        els.dropdown.style.display = "none";
      }
    });

    // CALCULATION
    const calculate = () => {
      const bal = parseFloat(els.bal.value) || 0;
      const riskPct = parseFloat(els.risk.value) || 0;
      const sl = parseFloat(els.sl.value) || 0;
      const pVal = parseFloat(els.pipVal.value) || 10;

      if (bal > 0 && riskPct > 0 && sl > 0) {
        const riskCash = bal * (riskPct / 100);
        // Formula: Lots = CashRisk / (StopLoss * PipValue)
        const lots = riskCash / (sl * pVal);

        els.lots.innerText = lots.toFixed(2);
        els.cash.innerText = "$" + riskCash.toFixed(2);
      } else {
        els.lots.innerText = "0.00";
        els.cash.innerText = "$0.00";
      }
    };

    [els.bal, els.risk, els.sl].forEach((el) =>
      el.addEventListener("input", calculate),
    );

    // Auto-fill Balance from System Data if available
    // (Optional: if you save balance in systemData)
  }
  // --- NEW: RISK BRIDGE LISTENER (PAIR ONLY) ---
  const applyBtn = document.getElementById("btn-apply-risk");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const pair = document.getElementById("re-search").value;

      // A. Auto-fill the Pair ONLY
      if (pair) {
        document.querySelector('[data-key="j_pair"]').value = pair;
        sysNotify("PAIR APPLIED", "success");
        playSound("hover");
      } else {
        sysNotify("NO PAIR SELECTED", "info");
      }
    });
  }

    document.addEventListener("click", (e) => {
    if (e.target.id === "btn-apply-risk") {
      const pair = document.getElementById("re-search").value;
      const tPair = document.querySelector('[data-key="j_pair"]');
      const tPlanPair = document.getElementById("entry-pair");

      if (pair) {
        if (tPair) tPair.value = pair;
        if (tPlanPair) tPlanPair.value = pair;

        // Switch tab to Terminal automatically
        document.querySelector('[data-target="tab-term"]').click();

        sysNotify("DATA SENT TO TERMINAL", "success");
      } else {
        sysNotify("NO ASSET SELECTED", "error");
      }
    }
  });

