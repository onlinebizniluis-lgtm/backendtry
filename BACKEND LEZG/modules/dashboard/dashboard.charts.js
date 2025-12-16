// DASHBOARD CHART RENDERING FUNCTIONS


// =========================================================================
// FINAL JS FIX V4: drawSvgChart (Raw Numbers + Data Points/Dots)
// =========================================================================

window.drawSvgChart = function (dataValues, containerId, metaData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Handle Empty State (unchanged)
    if (!dataValues || dataValues.length < 1) {
        container.innerHTML = `
            <div style="height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; color:#444;">
                <svg style="width:40px; height:40px; stroke:#333; margin-bottom:10px;" viewBox="0 0 24 24" fill="none" stroke-width="1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <span style="font-family:var(--font-mono); font-size:10px; letter-spacing:1px;">AWAITING DATA</span>
            </div>`;
        container.classList.remove('negative-equity');
        return;
    }

    // 2. Setup Dimensions and Scaling (Symmetrical Zero-Centered)
    const containerWidth = container.clientWidth - 50; 
    const containerHeight = container.clientHeight - 25; 

    const width = containerWidth;
    const height = containerHeight;

    const padding = { top: 20, bottom: 20, left: 0, right: 0 };
    const values = [0, ...dataValues];
    const meta = [{ id: "START", r: 0, date: metaData[0]?.date || '' }, ...metaData]; 

    // Determine the largest absolute deviation from zero for symmetrical scaling
    const rawMinVal = Math.min(...values);
    const rawMaxVal = Math.max(...values);
    const maxDeviation = Math.max(Math.abs(rawMinVal), Math.abs(rawMaxVal), 1);
    
    const symmetricalMinVal = -maxDeviation;
    const symmetricalMaxVal = maxDeviation;
    const symmetricalRange = symmetricalMaxVal - symmetricalMinVal;

    // Scaling functions
    const getY = (val) =>
        height -
        padding.bottom -
        ((val - symmetricalMinVal) / symmetricalRange) * (height - (padding.top + padding.bottom));
    
    const getX = (index) => (index / (values.length - 1)) * width;
    const zeroY = getY(0);

    // 3. SEMANTIC COLOR LOGIC (THE FIX)
    const lastVal = values[values.length - 1];
    const isLineNeg = lastVal < 0; 
    const colorAccent = 'var(--accent)';
    const colorError = 'var(--error)';
    const lineStroke = isLineNeg ? colorError : colorAccent;
    const lineFilter = isLineNeg ? `drop-shadow(0 0 4px ${colorError})` : `drop-shadow(0 0 4px ${colorAccent})`;
    const areaFillUrl = isLineNeg ? 'url(#chartGradientNeg)' : 'url(#chartGradient)';

    // 4. Gradient Definitions (Must be inside SVG)
    const defs = `
        <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${colorAccent}" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="${colorAccent}" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="chartGradientNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${colorError}" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="${colorError}" stop-opacity="0"/>
            </linearGradient>
        </defs>
    `;

    // 5. Path Data
    const points = values.map((val, i) => `${getX(i)},${getY(val)}`);
    const linePathD = `M ${points.join(" L ")}`;
    const areaPathD = `${linePathD} L ${width},${height} L 0,${height} Z`;

    // 6. AXIS LABEL GENERATION

    // A. Y-Axis (Raw Number Value - REMOVING 'R')
    let yAxisLabelsHtml = '';
    const numYLabels = 5;
    const yStep = symmetricalRange / (numYLabels - 1);
    
    for (let i = 0; i < numYLabels; i++) {
        const val = symmetricalMinVal + i * yStep;
        const topPos = getY(val); 
        
        yAxisLabelsHtml += `
            <div class="chart-axis-label" style="top: ${topPos + 25}px; left: 0px; transform: translateY(-50%); text-align: right; width: 45px; color:${val > 0 ? colorAccent : val < 0 ? colorError : '#ccc'};">
                ${val.toFixed(1)}
            </div>
        `;
    }

    // B. X-Axis (Date) Labels (unchanged)
    let xAxisLabelsHtml = '';
    const numXLabels = 4;
    
    for (let i = 0; i < numXLabels; i++) {
        const index = Math.round(i * (values.length - 1) / (numXLabels - 1));
        if (index >= values.length) continue;
        
        const dateStr = meta[index].date || '';
        if (!dateStr) continue;
        
        const dateLabel = dateStr.substring(dateStr.lastIndexOf('-') + 1);
        const leftPos = getX(index) + 50; 
        
        xAxisLabelsHtml += `
            <div class="chart-axis-label" style="top: ${height + 25}px; left: ${leftPos}px; transform: translateX(-50%);">
                ${dateLabel}
            </div>
        `;
    }

    // 7. Data Points/Dots Generation (NEW FEATURE)
    let dataPointsHtml = '';
    // Skip the first point (which is always 0, for aesthetic reasons)
    for (let i = 1; i < values.length; i++) {
        const cx = getX(i);
        const cy = getY(values[i]);
        const dotColor = values[i] > values[i - 1] ? colorAccent : colorError; // Color based on Win/Loss step
        
        dataPointsHtml += `
            <circle cx="${cx}" cy="${cy}" r="2" 
                fill="${dotColor}" 
                stroke="#000" 
                stroke-width="1"
                filter="drop-shadow(0 0 1px #000)"
                class="data-point-marker" />
        `;
    }


    // --- 8. Build Final HTML Structure ---
    container.innerHTML = `
        <div id="chart-axis-labels" style="position: absolute; inset: 0;">
            ${yAxisLabelsHtml}
            ${xAxisLabelsHtml}
        </div>

        <div id="chart-svg-host" style="position: absolute; top: 25px; right: 0; bottom: 25px; left: 50px; width: ${width}px; height: ${height}px;">
            <svg class="tech-chart" width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                ${defs}

                <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" class="grid-line" style="stroke:#1a1a1a;" />
                <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" class="grid-line" style="stroke:#1a1a1a;" />
                
                <line x1="0" y1="${zeroY}" x2="${width}" y2="${zeroY}" class="zero-line" style="stroke:#666;"/>

                <path d="${areaPathD}" class="area-path" style="fill: ${areaFillUrl};" />
                <path d="${linePathD}" class="line-path" style="stroke: ${lineStroke}; filter: ${lineFilter}; stroke-width: 2;" />

                ${dataPointsHtml}

                <line class="crosshair-x" id="ch-x" y1="0" y2="${height}" style="display:none; stroke:#444; stroke-dasharray:4;"/>
                <circle class="hover-point" id="ch-dot" r="4" style="display:none; fill:#000; stroke:#fff; stroke-width:2;" />
                
                <circle cx="${getX(values.length - 1)}" cy="${getY(values[values.length - 1])}" r="3" class="pulse-dot" style="fill: ${lineStroke};" />
            </svg>
        </div>
        
        <div id="chart-hud" class="chart-hud">
            <div class="hud-row"><span>REF ID</span><span class="hud-val" id="hud-id">#000</span></div>
            <div class="hud-row"><span>OUTCOME</span><span class="hud-val" id="hud-res">0R</span></div>
            <div style="height:1px; background:#333; margin:6px 0;"></div>
            <div class="hud-row">
                <span style="color:#fff;">NET EQUITY</span>
                <span class="hud-val" id="hud-total" style="font-size:12px;">0.0</span>
            </div>
        </div>
    `;

    // 9. Interaction Logic Setup (Re-attached)
    if (isLineNeg) {
        container.classList.add('negative-equity');
    } else {
        container.classList.remove('negative-equity');
    }
    
    const svgHost = container.querySelector('#chart-svg-host');
    const hud = container.querySelector("#chart-hud");
    const dot = container.querySelector("#ch-dot");
    const line = container.querySelector("#ch-x");
    const els = {
        id: container.querySelector("#hud-id"),
        res: container.querySelector("#hud-res"),
        total: container.querySelector("#hud-total"),
    };

    if (svgHost) {
        svgHost.onmousemove = (e) => {
            const rect = svgHost.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;

            const index = Math.round((mouseX / width) * (values.length - 1));
            if (index < 0 || index >= values.length) return;

            const cx = getX(index);
            const cy = getY(values[index]);
            const data = meta[index];
            const val = values[index];

            dot.setAttribute("cx", cx);
            dot.setAttribute("cy", cy);
            dot.style.display = "block";

            line.setAttribute("x1", cx);
            line.setAttribute("x2", cx);
            line.style.display = "block";

            hud.style.display = "block";

            if (data.id === "START") {
                els.id.innerText = "START";
                els.res.innerText = "-";
                els.res.className = "hud-val";
            } else {
                const shortId =
                    String(data.id).length > 8
                        ? "#" + String(data.id).slice(-4)
                        : "#" + data.id;
                els.id.innerText = shortId;
                const r = parseFloat(data.r || 0);
                // Note: The HUD still shows 'R' for the trade outcome (r-value) for context, 
                // but the final equity total (els.total) does not.
                els.res.innerText = (r > 0 ? "+" : "") + r + "R"; 
                els.res.className =
                    r > 0 ? "hud-val pos" : r < 0 ? "hud-val neg" : "hud-val";
            }
            
            els.total.innerText = val.toFixed(1); // REMOVED 'R'
            els.total.style.color = val >= 0 ? "#fff" : colorError; 

            // HUD Positioning logic adjusted for the new chart area
            let posX = e.clientX - rect.left + 20 + 50; 
            let posY = e.clientY - rect.top + 20 + 25; 

            const hudW = hud.offsetWidth || 150;
            const hudH = hud.offsetHeight || 80;

            if (posX + hudW > container.clientWidth) {
                posX = e.clientX - rect.left - hudW + 50 - 15;
            }
            if (posY + hudH > container.clientHeight) {
                posY = e.clientY - rect.top - hudH + 25 - 15;
            }

            // Apply global positioning relative to the container
            hud.style.top = posY + "px";
            hud.style.left = posX + "px";
        };

        svgHost.onmouseleave = () => {
            if (hud) hud.style.display = "none";
            if (dot) dot.style.display = "none";
            if (line) line.style.display = "none";
        };
    }
};
  
window.drawBarChart = function(data, id) {
    const c = document.getElementById(id);
    if (!c) return;

    // Empty State
    if (!data || !data.length) {
      c.innerHTML =
        '<div style="color:#444; text-align:center; padding-top:140px; font-family:var(--font-mono); font-size:10px;">NO DATA</div>';
      return;
    }

    // Sort by Win Rate desc
    data.sort((a, b) => b.val - a.val);

    // Clear Container
    c.innerHTML = "";

    // Create Wrapper
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "display:flex; flex-direction:column; gap:12px; padding:15px 10px;";

    data.forEach((d) => {
      // Row Container
      const row = document.createElement("div");
      row.style.cssText =
        "display:flex; align-items:center; font-size:10px; color:#ccc; cursor:help; transition:0.2s;";

      // Color Logic
      const isPositive = d.val >= 50;
      const barColor = isPositive ? "var(--accent)" : "var(--error)";
      const glow = isPositive ? `0 0 8px ${barColor}` : "none";

      row.innerHTML = `
            <div style="width:80px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:var(--font-mono);">${d.label}</div>
            <div style="flex:1; background:#111; height:6px; border-radius:2px; margin:0 10px; position:relative;">
                <div style="width:${d.val}%; background:${barColor}; height:100%; border-radius:2px; box-shadow:${glow}; transition:width 0.5s ease;"></div>
            </div>
            <div style="width:30px; text-align:right; font-weight:bold; font-family:var(--font-mono); color:${barColor};">${d.val}%</div>
        `;

      // --- HOVER INTERACTION ---
      row.onmouseenter = (e) => {
        // Highlight Row
        row.style.opacity = "1";
        row.style.transform = "translateX(2px)";

        const tt = document.getElementById("ticker-tooltip");
        if (tt) {
          tt.innerHTML = `
                    <div class="tt-row"><span>SETUP</span><span class="tt-val" style="color:var(--accent)">${d.label}</span></div>
                    <div class="tt-row"><span>WIN RATE</span><span class="tt-val">${d.val}%</span></div>
                    <div class="tt-row"><span>VOLUME</span><span class="tt-val">${d.count} Trades</span></div>
                    <div class="tt-row"><span>NET P&L</span><span class="tt-val" style="color:${d.netR >= 0 ? "var(--accent)" : "var(--error)"}">${d.netR > 0 ? "+" : ""}${d.netR.toFixed(1)}R</span></div>
                `;
          tt.style.display = "block";
          // Initial positioning
          tt.style.left = e.clientX + 15 + "px";
          tt.style.top = e.clientY + 15 + "px";
        }
      };

      row.onmousemove = (e) => {
        const tt = document.getElementById("ticker-tooltip");
        if (tt) {
          tt.style.left = e.clientX + 15 + "px";
          tt.style.top = e.clientY + 15 + "px";
        }
      };

      row.onmouseleave = () => {
        row.style.opacity = "";
        row.style.transform = "";
        const tt = document.getElementById("ticker-tooltip");
        if (tt) tt.style.display = "none";
      };

      wrapper.appendChild(row);
    });

    c.appendChild(wrapper);
  }

