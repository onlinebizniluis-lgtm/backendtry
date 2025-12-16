

window.playSound = function(type) {
    const audio = document.getElementById(`sfx-${type}`);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.4;
      audio.play().catch((e) => {});
    }
};
  window.sysNotify = (msg, type = "info") => {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `sys-toast ${type}`;
    let icon = type === "error" ? "ERR >>" : "SYS >>";
    if (type === "success") icon = "OK >>";
    toast.innerHTML = `<span><strong style="margin-right:8px">${icon}</strong> ${msg}</span>`;
    container.appendChild(toast);
    if (type === "error" ? playSound("error") : playSound("hover"));
    setTimeout(() => {
      toast.style.animation =
        "toastSlideOut 0.3s cubic-bezier(0.3, 0, 1, 1) forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };