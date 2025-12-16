//auth

import { signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, updateDoc, getDoc, setDoc, getDocs, collection, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ... rest of your auth.js code ...

// --- DEFINE LOGOUT GLOBAL HELPER (Top of Script) ---
  window.logoutUser = () => {
    console.log("Logging out...");
    // Check if auth is initialized
    if (auth) {
      signOut(auth)
        .then(() => window.location.reload())
        .catch((error) => {
          console.error("Logout Error:", error);
          // Force reload even if firebase fails
          window.location.reload();
        });
    } else {
      window.location.reload();
    }
  };
  // 2. SUBMIT RENEWAL REQUEST (UPDATED)
  window.submitRenewal = async () => {
    const refInput = document.getElementById("renew-ref");
    const fileInput = document.getElementById("renew-receipt"); // New Input
    const btn = document.getElementById("btn-renew");

    if (!refInput || !refInput.value.trim()) {
      sysNotify("INVALID REFERENCE ID", "error");
      return;
    }

    btn.innerText = "PROCESSING...";
    btn.disabled = true;

    let receiptBase64 = "";

    // 1. Compress Image if uploaded
    if (fileInput && fileInput.files[0]) {
      btn.innerText = "COMPRESSING...";
      try {
        receiptBase64 = await compressImage(fileInput.files[0]);
      } catch (e) {
        console.error("Image Error:", e);
      }
    }

    btn.innerText = "TRANSMITTING...";

    try {
      // 2. Update Database
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        status: "pending",
        paymentRef: refInput.value.trim(),
        paymentProof: receiptBase64, // Save Image String
        isRenewal: true,
        updatedAt: new Date().toISOString(),
      });

      sysNotify("REQUEST SENT. STANDBY FOR HQ.", "success");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      console.error(e);
      sysNotify("ERROR: " + e.message, "error");
      btn.innerText = "SUBMIT RENEWAL REQUEST";
      btn.disabled = false;
    }
  };

  
  // --- BOOTLOADER SEQUENCE (CENTERED) ---
window.playBootSequence = async function(onComplete) {
    const screen = document.getElementById("boot-screen");
    const text = document.getElementById("boot-text");
    const lines = [
      "ESTABLISHING UPLINK...",
      "LOADING ASSET LIBRARY...",
      "VERIFYING PROTOCOLS...",
      "CALCULATING RISK METRICS...",
      "ACCESS GRANTED.",
    ];

    screen.style.display = "flex";
    text.innerHTML = "";

    for (let line of lines) {
      const p = document.createElement("div");
      p.className = "boot-line";
      p.innerText = "> " + line;
      text.appendChild(p);
      await new Promise((r) => setTimeout(r, 300));
    }

    await new Promise((r) => setTimeout(r, 500));
    screen.style.opacity = "0";
    screen.style.transition = "opacity 0.5s";
    setTimeout(() => {
      screen.style.display = "none";
      screen.style.opacity = "1";
      onComplete();
    }, 500);
  }

  window.generateNewBounty = function() {
    // AI Compatible Targets
    const targets = ["UPTREND", "DOWNTREND", "CONSOLIDATION"];
    
    // Pick one randomly
    currentBounty = targets[Math.floor(Math.random() * targets.length)];
    
    // Save to system data
    systemData['s_bounty'] = currentBounty;
    saveData('system'); // Saves to Firebase/Local
    
    // Update UI immediately
    const bountyEl = document.getElementById('bounty-target');
    if(bountyEl) bountyEl.innerText = `HUNT: "FIND ${currentBounty}"`;
}


    // --- UPDATED BRIDGE: Fixes ID Display (Last 4 Digits) ---
window.initBridge = async function() {
    el("loader").style.display = "flex";
    el("portfolio-bridge").style.display = "flex";
    el("app-shell").style.display = "none";

    if (currentPortfolioId) el("btn-back-bridge").style.display = "block";
    else el("btn-back-bridge").style.display = "none";

    const listEl = el("port-list");
    listEl.innerHTML =
      '<div style="color:#666;text-align:center;">SCANNING DATABANKS...</div>';

    try {
      const snap = await getDocs(
        collection(db, "users", currentUser.uid, "portfolios"),
      );
      listEl.innerHTML = "";

      if (snap.empty) {
        listEl.innerHTML =
          '<div style="padding:20px; text-align:center; color:var(--accent);">NO PORTFOLIOS FOUND.<br>INITIALIZE YOUR FIRST LINK BELOW.</div>';
      } else {
        snap.forEach((doc) => {
          const d = doc.data();
          // FIX: Use slice(-4) to get the changing last digits
          const uniqueId = doc.id.slice(-4);

          const div = document.createElement("div");
          div.className = "port-item";
          div.innerHTML = `
                  <div class="port-meta">
                      <span class="port-name">${d.name}</span>
                      <span style="font-family:var(--font-mono); opacity:0.5;">ID: #${uniqueId}</span>
                  </div>
                  <div class="port-del" onclick="event.stopPropagation(); window.deletePort('${doc.id}')">✕</div>
                `;
          div.onclick = () => loadPortfolio(doc.id, d.name);
          listEl.appendChild(div);
        });
      }
    } catch (e) {
      console.log(e);
      sysNotify("BRIDGE ERROR", "error");
    }

    el("loader").style.display = "none";
  }

  
  // --- UPDATED CREATE: Prevents Duplicate Names ---
window.createPortfolio = async function() {
    const plan = window.currentUserPlan || "basic";
    // Count existing items in the DOM
    const existingItems = document.querySelectorAll(".port-item");
    const existingCount = existingItems.length;

    // 1. Plan Limit Check
    let limit = 1;
    if (plan === "pro") limit = 3;
    if (plan === "elite") limit = 999;

    if (existingCount >= limit) {
      playSound("error");
      return sysNotify(
        `UPGRADE REQUIRED. ${plan.toUpperCase()} LIMIT REACHED (${limit}).`,
        "error",
      );
    }

    // 2. Name Validation
    const nameInput = el("new-port-name");
    const name = nameInput.value.trim().toUpperCase(); // Force uppercase for comparison

    if (!name) return sysNotify("NAME REQUIRED", "error");

    // 3. DUPLICATE CHECK (The Fix)
    let isDuplicate = false;
    existingItems.forEach((item) => {
      const existingName = item
        .querySelector(".port-name")
        .innerText.trim()
        .toUpperCase();
      if (existingName === name) isDuplicate = true;
    });

    if (isDuplicate) {
      playSound("error");
      nameInput.style.borderColor = "var(--error)";
      return sysNotify("PORTFOLIO NAME ALREADY EXISTS", "error");
    }

    // 4. Creation Logic
    el("loader").style.display = "flex";
    try {
      const newId = Date.now().toString();
      await setDoc(doc(db, "users", currentUser.uid, "portfolios", newId), {
        name: nameInput.value.trim(), // Save original casing
        created: new Date().toISOString(),
      });

      nameInput.value = "";
      nameInput.style.borderColor = "#333"; // Reset border

      sysNotify("PORTFOLIO INITIALIZED", "success");
      initBridge();
    } catch (e) {
      console.error(e);
      sysNotify("CREATION FAILED", "error");
    }
    el("loader").style.display = "none";
  }

  // DELETE PORTFOLIO (WITH MODAL)
  window.deletePort = async (pid) => {
    if (
      await sysConfirm(
        "DELETE PORTFOLIO",
        "This will wipe all data for this portfolio. Cannot be undone.",
        true,
      )
    ) {
      await deleteDoc(doc(db, "users", currentUser.uid, "portfolios", pid));
      initBridge();
      sysNotify("PORTFOLIO DELETED", "success");
    }
  };

  // ... rest of your existing code ...
window.loadPortfolio = async function(pid, name) {
  playBootSequence(() => {
      currentPortfolioId = pid;
      el("active-port-name").innerText = "LINKED: " + name.toUpperCase();
      el("portfolio-bridge").style.display = "none";
      el("app-shell").style.display = "flex";
      el("tab-dash").click();

      // ✅ FIX 2
      el("date-display").innerText = getLocalDate();
      el("j_date_display").value = getLocalDate();

      playSound("win");
      loadData();
    });
  }
  // --- UPDATED: LOAD DATA FOR SPECIFIC PORTFOLIO + MIGRATION CHECK ---

    // 2. Global Variables
  window.resetOTP = null;
  window.resetEmail = "";

  // 3. The Modal Opener (Attached to Window immediately)
  window.openResetModal = function () {
    console.log("FORCE OPEN: Reset Modal");
    const modal = document.getElementById("reset-flow-modal");

    if (!modal) {
      alert("System Error: Reset Modal HTML missing. Please check code.");
      return;
    }

    // Reset UI
    modal.style.display = "flex";

    // Hide all steps, show step 1
    document
      .querySelectorAll(".auth-step")
      .forEach((el) => (el.style.display = "none"));
    document.getElementById("rst-step-1").style.display = "block";

    // Clear Inputs
    if (document.getElementById("rst-email"))
      document.getElementById("rst-email").value = "";
    if (document.getElementById("rst-otp"))
      document.getElementById("rst-otp").value = "";
  };

    // 4. Switch Steps
  window.resetFlowStep = function (step) {
    document
      .querySelectorAll(".auth-step")
      .forEach((el) => (el.style.display = "none"));
    const target = document.getElementById("rst-step-" + step);
    if (target) target.style.display = "block";
  };

  // 5. Request OTP Logic
  window.requestOTP = function () {
    const emailEl = document.getElementById("rst-email");
    window.resetEmail = emailEl.value.trim();

    if (!window.resetEmail.includes("@")) {
      alert("Please enter a valid email.");
      return;
    }

    const btn = document.querySelector("#rst-step-1 button");
    const oldText = btn.innerText;
    btn.innerText = "SENDING...";
    btn.disabled = true;

    // Generate OTP
    window.resetOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Send Email
    emailjs
      .send("service_o5zh5qv", "template_pyy5d7p", {
        to_email: window.resetEmail,
        passcode: window.resetOTP,
        time: new Date().toLocaleString(),
      })
      .then(
        function () {
          btn.innerText = oldText;
          btn.disabled = false;
          window.resetFlowStep(2); // Move to Step 2
        },
        function (error) {
          btn.innerText = "FAILED";
          btn.disabled = false;
          alert("Email failed to send. Check console.");
          console.error("EmailJS Error:", error);
        },
      );
  };

  // 6. Verify OTP & Trigger Firebase
  window.verifyOTP = function () {
    const inputOTP = document.getElementById("rst-otp").value.trim();

    if (inputOTP !== window.resetOTP) {
      alert("INVALID CODE");
      return;
    }

    // OTP Match - Now trigger Firebase
    // We use dynamic import here so we don't need the module type
    import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js")
      .then((module) => {
        const auth = module.getAuth(); // Get existing auth instance
        return module.sendPasswordResetEmail(auth, window.resetEmail);
      })
      .then(() => {
        window.resetFlowStep(3); // Move to Success Step
      })
      .catch((error) => {
        console.error("Firebase Reset Error:", error);
        // Even if Firebase fails (e.g., user not found), we often show success to prevent email scraping,
        // but for this tool, let's show the error or just move to success.
        alert("Error sending reset link: " + error.message);
      });
  };

    // --- 2. AUTH CHECK, SECURITY GATEKEEPER & AUTO-EXPIRATION ---
  onAuthStateChanged(auth, async (user) => {
    const ADMIN_EMAIL = "luisdhaenielv@gmail.com";
    const getEl = (id) => document.getElementById(id);

    if (user) {
      console.log("User detected:", user.email);

      if (getEl("loader")) getEl("loader").style.display = "flex";
      if (getEl("auth-module")) getEl("auth-module").style.display = "none";

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          let userData = userDocSnap.data();

          // --- AUTO-EXPIRATION LOGIC ---
          // If they are approved, check if their time is up
          if (
            userData.status === "approved" &&
            userData.approvedAt &&
            user.email !== ADMIN_EMAIL
          ) {
            const cycleDays = 30; // Set your subscription length here
            const start = new Date(userData.approvedAt).getTime();
            const now = Date.now();
            const diffTime = Math.abs(now - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > cycleDays) {
              console.log("🚫 SUBSCRIPTION EXPIRED. UPDATING DB...");
              // Update DB to 'expired' automatically
              await updateDoc(userDocRef, { status: "expired" });
              userData.status = "expired"; // Force local status update to trigger block below
            }
          }
          // -----------------------------

          // CHECK STATUS (Approved Only)
          // --- ACCESS DENIED / RENEWAL HANDLER ---
          // --- ACCESS DENIED / RENEWAL HANDLER ---
          if (userData.status !== "approved" && user.email !== ADMIN_EMAIL) {
            if (getEl("loader")) getEl("loader").style.display = "none";

            // Default Message (for Pending users)
            let headerTitle = "ACCESS PENDING";
            let subText =
              "Your clearance is under review by HQ. Please standby.";
            let renewalFormHTML = "";

            // === IF EXPIRED OR REJECTED -> SHOW PRO RENEWAL UI ===
            if (
              userData.status === "expired" ||
              userData.status === "rejected"
            ) {
              // 1. Get Price
              const plan = userData.plan || "pro";
              const currency = userData.currency || "usd";

              const prices = {
                basic: { usd: "$15.00", php: "₱699.00" },
                pro: { usd: "$29.00", php: "₱1,299.00" },
                elite: { usd: "$49.00", php: "₱2,199.00" },
              };

              const price = prices[plan]
                ? currency === "php"
                  ? prices[plan].php
                  : prices[plan].usd
                : "Check Rate";

              // 2. Better Copywriting & Headers
              headerTitle = "SYSTEM PAUSED";
              subText = `You have built valuable data. You are ahead of 99% of traders.<br><span style="color:#fff;">Don't let your edge fade. Reactivate your command center.</span>`;

              // 3. High-End Renewal Form with FILE UPLOAD
              renewalFormHTML = `
                            <div style="margin: 25px 0; background:#0b0b0b; border:1px solid #222; border-radius:6px; overflow:hidden;">
                                <!-- Invoice Row -->
                                <div style="display:flex; justify-content:space-between; padding:15px; border-bottom:1px solid #222; align-items:center;">
                                    <div style="text-align:left;">
                                        <div style="font-size:9px; color:#666; letter-spacing:1px;">PLAN</div>
                                        <div style="font-size:12px; color:var(--accent); font-weight:bold; font-family:var(--font-mono);">${plan.toUpperCase()} CLEARANCE</div>
                                    </div>
                                    <div style="text-align:right;">
                                        <div style="font-size:9px; color:#666; letter-spacing:1px;">AMOUNT</div>
                                        <div style="font-size:14px; color:#fff; font-weight:bold; font-family:var(--font-mono);">${price}</div>
                                    </div>
                                </div>

                                <!-- Payment Details -->
                                <div style="padding:20px; background:rgba(0,255,157,0.02);">
                                    <div style="font-size:9px; color:#666; margin-bottom:8px; letter-spacing:1px;">TRANSFER VIA GCASH</div>
                                    <div style="font-size:20px; color:#fff; font-weight:800; letter-spacing:2px; font-family:var(--font-mono); text-shadow:0 0 10px rgba(255,255,255,0.1);">
                                        0945 354 6210
                                    </div>
                                </div>
                            </div>

                            <!-- Input Area -->
                            <div style="display:flex; gap:10px; flex-direction:column;">
                                <input id="renew-ref" type="text" placeholder="ENTER PAYMENT REF #" 
                                    style="width:100%; background:#111; border:1px solid #333; color:#fff; padding:14px; font-family:var(--font-mono); text-align:center; border-radius:4px; font-size:13px; letter-spacing:1px;">
                                
                                <!-- NEW: FILE UPLOAD -->
                                <div style="position:relative; border:1px dashed #333; border-radius:4px; padding:8px; background:#080808; display:flex; align-items:center;">
                                    <span style="font-size:9px; color:#666; margin-right:10px; white-space:nowrap;">EVIDENCE:</span>
                                    <input type="file" id="renew-receipt" accept="image/*" style="font-size:10px; color:#888; width:100%; cursor:pointer;">
                                </div>

                                <button id="btn-renew" class="btn-main" onclick="window.submitRenewal()" 
                                    style="width:100%; margin-top:5px; font-weight:800; letter-spacing:1px;">
                                    CONFIRM REACTIVATION
                                </button>
                            </div>
                        `;
            }

            // Render The Lock Screen
            const authMod = getEl("auth-module");
            authMod.style.display = "flex";
            authMod.innerHTML = `
                        <div class="terminal-box" style="text-align:center; padding:40px; max-width:480px; border:1px solid #333;">
                            <div style="color:${userData.status === "pending" ? "#666" : "var(--error)"}; font-size:40px; margin-bottom:15px;">
                                ${userData.status === "pending" ? "⏳" : "🔒"}
                            </div>
                            
                            <div class="term-title" style="color:#fff; font-size:16px; letter-spacing:2px; margin-bottom:10px;">
                                ${headerTitle}
                            </div>
                            
                            <p style="color:#888; font-size:13px; line-height:1.6; margin:0 auto; max-width:380px; font-family:'Inter', sans-serif;">
                                ${subText}
                            </p>
                            
                            ${renewalFormHTML}

                            <div style="margin-top:30px; padding-top:20px; border-top:1px solid #222; font-size:10px;">
                                <button class="btn-link" onclick="location.reload()" style="color:#666;">REFRESH SIGNAL</button>
                                <span style="color:#333; margin:0 10px;">|</span>
                                <button class="btn-link" onclick="window.logoutUser()" style="color:#666;">TERMINATE SESSION</button>
                            </div>
                        </div>
                    `;
            return; // Stop execution here
          }

          // Access Granted
          window.currentUserPlan = userData.plan || "basic";
          proceedToApp(user);
        } else {
          // --- MISSING DOCUMENT HANDLING (Auto-Fix Admin) ---
          if (user.email === ADMIN_EMAIL) {
            console.log("Admin detected. Creating DB Record...");
            await setDoc(userDocRef, {
              email: user.email,
              plan: "elite",
              status: "approved",
              role: "admin",
              createdAt: new Date().toISOString(),
              approvedAt: new Date().toISOString(),
              amountPaid: "0",
              paymentRef: "SYSTEM_OVERRIDE",
            });
            window.currentUserPlan = "elite";
            proceedToApp(user);
          } else {
            console.log("No user record found.");
            signOut(auth);
          }
        }
      } catch (error) {
        console.error("Auth Check Error:", error);
        alert("Login Error: " + error.message);
      }
    } else {
      // Not logged in
      currentUser = null;
      currentPortfolioId = null;
      if (!isDemo) {
        if (getEl("auth-module")) {
          getEl("auth-module").style.display = "flex";
          // If the lock screen was showing, reload to show login form
          if (!getEl("auth-module").querySelector("#inp-email")) {
            location.reload();
          }
        }
        if (getEl("portfolio-bridge"))
          getEl("portfolio-bridge").style.display = "none";
        if (getEl("app-shell")) getEl("app-shell").style.display = "none";
      }
    }
  });

  
  function proceedToApp(user) {
    currentUser = user;
    isDemo = false;
    const authMod = document.getElementById("auth-module");
    if (authMod) authMod.style.display = "none";
    initBridge();
  }
  window.logoutUser = () => {
    signOut(auth).then(() => location.reload());
  };
