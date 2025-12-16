  function openImagePreview(src, plan = null) {
    const overlay = document.createElement("div");
    overlay.className = "sys-modal-overlay";

    overlay.innerHTML = `
        <div class="sys-modal wide">
            <div class="modal-inner">

                <div class="modal-title">
                    TRADE PLAN VIEW
                </div>

                <div class="modal-body">

                    <img src="${src}" 
                         style="width:100%; max-height:60vh; border:1px solid var(--accent); border-radius:4px; margin-bottom:20px; cursor:zoom-in;" 
                         id="previewZoomImg"
                    >

                    ${
                      plan
                        ? `
                        <div class="detail-row">
                            <div class="detail-lbl">PAIR</div>
                            <div class="detail-val">${plan.pair || "-"}</div>
                        </div>

                        <div class="detail-row">
                            <div class="detail-lbl">SESSION</div>
<div class="detail-val">${plan.sess || "-"}</div>
                        </div>

                        <div class="detail-row">
                            <div class="detail-lbl">STRATEGY</div>
                            <div class="detail-val">${plan.setup || "-"}</div>
                        </div>

                        <div class="detail-row">
                            <div class="detail-lbl">NOTES</div>
                            <div class="detail-val" style="white-space:pre-wrap;">${plan.notes || "-"}</div>
                        </div>
                    `
                        : ""
                    }
                </div>

                <div class="modal-actions">
                    <button class="btn-modal" id="closeImagePreview">Close</button>
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Zoom behavior
    const img = document.getElementById("previewZoomImg");
    let scale = 1;

    img.onwheel = (e) => {
      e.preventDefault();
      scale += e.deltaY < 0 ? 0.2 : -0.2;
      if (scale < 1) scale = 1;
      if (scale > 5) scale = 5;
      img.style.transform = `scale(${scale})`;
      img.style.transition = "0.1s";
    };

    // Close events
    document.getElementById("closeImagePreview").onclick = () =>
      overlay.remove();
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };
  }
  window.openImagePreview = openImagePreview;

    window.addEventListener("DOMContentLoaded", () => {
    const entryModule = document.getElementById("entry-module");
    const targetInputs = document.getElementById("tab-inputs");

    if (entryModule && targetInputs) {
      targetInputs.appendChild(entryModule);
    }
  });

   const sections = document.querySelectorAll(".plan-section");




  // AUTO UPDATE VIEW ON PAGE LOAD + PLAN SAVE




  document.getElementById("imgPreviewModal").addEventListener("click", () => {
    const modal = document.getElementById("imgPreviewModal");
    modal.classList.add("hidden");
    modal.style.display = "none"; // 🔹 hard hide again
  });

  // ---------------- IMAGE ZOOM HANDLER ---------------- //
  document.addEventListener("click", function (e) {
    const modal = document.getElementById("imageZoomModal");
    const zoomImg = document.getElementById("zoomedImage");

    // Open modal when clicking an image
    if (
      e.target.classList.contains("trade-img") &&
      !e.target.closest(".planned-card") &&
      !e.target.closest(".trade-card")
    ) {
      zoomImg.src = e.target.src;
      modal.classList.remove("hidden");
      return;
    }

    // Close modal when clicking anywhere outside the image
    if (e.target === modal || e.target === zoomImg) {
      modal.classList.add("hidden");
    }
  });

  // ESC key closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.getElementById("imageZoomModal").classList.add("hidden");
    }
  });

  // allow ESC close
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.getElementById("imageZoomModal").classList.add("hidden");
    }
  });

  // Allow ESC to close modal
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.getElementById("imageZoomModal").classList.add("hidden");
      document.body.style.overflow = "auto";
    }
  });

  
  document.getElementById("imgPreviewModal").addEventListener("click", () => {
    document.getElementById("imgPreviewModal").classList.add("hidden");
  });
