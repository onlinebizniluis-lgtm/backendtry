   async function savePlaybookRule(data) {
    if (isDemo) {
      data.id = Date.now();
      playbookData.push(data);
      renderPlaybook();
      sysNotify("RULE ADDED (SANDBOX)", "success");
      return;
    }
    try {
      // --- NEW PATH: PORTFOLIO SPECIFIC ---
      await setDoc(
        doc(
          collection(
            db,
            "users",
            currentUser.uid,
            "portfolios",
            currentPortfolioId,
            "playbook",
          ),
        ),
        { ...data, createdAt: new Date().toISOString() },
      );
      loadData(); // Reload
      sysNotify("RULE SAVED", "success");
    } catch (e) {
      sysNotify("SAVE FAILED", "error");
    }
  }