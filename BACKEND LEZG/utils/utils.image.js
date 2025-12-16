 
 
window.compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 600;
          const scaleSize = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Compress to JPEG at 60% quality
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
      };
    });
  };

window.getDirectImageURL = function(rawUrl) {
    // SAFETY CHECK: Ensure it is a string
    if (!rawUrl || typeof rawUrl !== 'string') {
        console.warn("getDirectImageURL received non-string:", rawUrl);
        return ""; 
    }

    // A. Handle TradingView Snapshot Links
    const tvMatch = rawUrl.match(/tradingview\.com\/x\/([a-zA-Z0-9]+)\/?/);
    if (tvMatch && tvMatch[1]) {
        const id = tvMatch[1];
        const firstChar = id.charAt(0).toLowerCase();
        return `https://s3.tradingview.com/snapshots/${firstChar}/${id}.png`;
    }

    // B. Handle Imgur Links
    if (rawUrl.includes("imgur.com") && !rawUrl.match(/\.(jpg|jpeg|png|gif)$/)) {
        return rawUrl + ".jpeg";
    }

    return rawUrl;
}

window.verifyChartWithAI = async function(imageUrl, targetPattern) {
    try {
        // Safety check before processing
        if (!imageUrl || typeof imageUrl !== 'string') {
            throw new Error("Invalid Image URL provided");
        }

        console.log("📡 INITIALIZING AI UPLINK:", imageUrl);

        const directUrl = getDirectImageURL(imageUrl);
        
        // Proxy URL
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(directUrl)}&output=jpg`;
        const imgResp = await fetch(proxyUrl);
        
        if (!imgResp.ok) throw new Error("Image Source Unreachable (404)");

        const blob = await imgResp.blob();
        if (blob.size < 1000) throw new Error("Image Data Corrupted (File too small)");

        const formData = new FormData();
        formData.append("file", blob, "chart.jpg");

        // Use window.AI_API_URL to ensure scope
        const apiResp = await fetch(window.AI_API_URL, {
            method: "POST",
            body: formData,
        });

        if (!apiResp.ok) {
            throw new Error(`AI Backend Error: ${apiResp.status}`);
        }

        const result = await apiResp.json();
        console.log("✅ DATA RECEIVED:", result);
        return result;

    } catch (e) {
        console.error("❌ AI PIPELINE FAILURE:", e);
        return { error: true, msg: "CONNECTION FAILED" };
    }
};

window.zoomImage = function(url) {
    const overlay = document.createElement("div");
    overlay.className = "img-zoom-overlay";
    // Added title to indicate closing behavior
    overlay.title = "CLICK ANYWHERE TO CLOSE";

    // IMPORTANT: Removed 'onclick="event.stopPropagation()"' from image so clicks bubble up
    overlay.innerHTML = `<img src="${url}" class="img-zoom-content">`;

    // Close on background OR image click
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
  };