// DST-aware session clock (robust) — preserves .active glow + .opening-soon behavior
window.updateSessionClock = function (opts = {}) {
  const now = new Date();
  const debug = opts.debug || false;

  // Helper: get date parts (year, month, day, hour, minute, second) for "now" in given timezone
  function tzPartsForNow(timeZone) {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const map = {};
    parts.forEach((p) => {
      if (p.type && p.value != null) map[p.type] = p.value;
    });
    return {
      year: parseInt(map.year, 10),
      month: parseInt(map.month, 10),
      day: parseInt(map.day, 10),
      hour: parseInt(map.hour, 10),
      minute: parseInt(map.minute, 10),
      second: parseInt(map.second, 10),
    };
  }

  // Convert a MARKET local hour (e.g. 8) in a timezone to UTC minutes (0..1439)
  function getUtcMinutesForLocalHour(timeZone, localHour) {
    // 1) Get the date parts for "now" in that timezone
    const p = tzPartsForNow(timeZone);

    // 2) Compute epoch ms of the timezone's current local time as if it were UTC
    //    (this is the "as-if-UTC" representation of the same wall-clock)
    const tzAsIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);

    // 3) The actual epoch for "now" (real UTC ms)
    const trueNowEpoch = now.getTime();

    // 4) Offset (ms) that relates a local wall-clock in that tz to real UTC
    const offsetMs = tzAsIfUtc - trueNowEpoch;
    //    (if offsetMs > 0 => tz local clock ahead of UTC; <0 => behind UTC)

    // 5) Epoch for the desired local hour in that tz (interpret as UTC, then shift by offset)
    const desiredAsIfUtc = Date.UTC(p.year, p.month - 1, p.day, localHour, 0, 0);
    const desiredRealEpoch = desiredAsIfUtc - offsetMs;

    // 6) Convert back to UTC hour/minute for that epoch
    const dt = new Date(desiredRealEpoch);
    return dt.getUTCHours() * 60 + dt.getUTCMinutes();
  }

  // Market session definitions (local market times)
  const sessions = [
    { id: "sess-syd", name: "SYDNEY", tz: "Australia/Sydney", openLocal: 10, closeLocal: 19 },
    { id: "sess-tok", name: "TOKYO",  tz: "Asia/Tokyo",        openLocal: 9,  closeLocal: 18 },
    { id: "sess-ldn", name: "LONDON", tz: "Europe/London",     openLocal: 8,  closeLocal: 17 },
    { id: "sess-ny",  name: "NEW YORK",tz: "America/New_York", openLocal: 8,  closeLocal: 17 },
  ];

  const utcNow = now.getUTCHours() * 60 + now.getUTCMinutes();

  // Clear previous visuals first (so only one glows)
  sessions.forEach((s) => {
    const el = document.getElementById(s.id);
    if (!el) return;
    el.classList.remove("active");
    el.classList.remove("opening-soon");
    const status = el.querySelector(".sess-status");
    if (status) status.style.opacity = "0.3";
  });

  // Compute per session
  sessions.forEach((sess) => {
    const el = document.getElementById(sess.id);
    if (!el) return;

    const openUTC = getUtcMinutesForLocalHour(sess.tz, sess.openLocal);
    const closeUTC = getUtcMinutesForLocalHour(sess.tz, sess.closeLocal);

    if (debug) console.log(sess.name, "openUTC:", openUTC, "closeUTC:", closeUTC);

    // Determine open state (handle midnight crossing)
    let isOpen;
    if (openUTC < closeUTC) {
      isOpen = utcNow >= openUTC && utcNow < closeUTC;
    } else {
      isOpen = utcNow >= openUTC || utcNow < closeUTC;
    }

    // Choose the target (closing if open, opening if closed)
    let target = isOpen ? closeUTC : openUTC;
    let diff = target - utcNow;
    if (diff < 0) diff += 1440; // next day

    const h = Math.floor(diff / 60);
    const m = diff % 60;
    const timeStr = `${h}H ${m}M`;

    const timeEl = el.querySelector(".sess-time");
    const statusEl = el.querySelector(".sess-status");
    if (!timeEl) return;

    if (isOpen) {
      el.classList.add("active");
      el.classList.remove("opening-soon");
      if (statusEl) statusEl.style.opacity = "1";

      const label = h === 0 && m < 60 ? "CLOSING SOON:" : "CLOSES IN:";
      timeEl.innerHTML = `<span class="sess-timer">${label} ${timeStr}</span>`;
    } else {
      el.classList.remove("active");
      if (statusEl) statusEl.style.opacity = "0.3";

      if (h === 0) {
        el.classList.add("opening-soon");
        timeEl.innerHTML = `<span class="sess-timer" style="color:#f4d35e">OPENS IN: ${timeStr}</span>`;
      } else {
        el.classList.remove("opening-soon");
        timeEl.innerHTML = `<span class="sess-timer">OPENS IN: ${timeStr}</span>`;
      }
    }
  });
};

// Run immediately + every minute
updateSessionClock();
setInterval(updateSessionClock, 60000);
