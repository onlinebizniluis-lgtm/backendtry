    window.filterPlaybook = (section, btn) => {
    currentPlaybookFilter = section;
    if (btn) {
      const sibs = btn.parentElement.querySelectorAll(".btn-sm");
      sibs.forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");
    }
    renderPlaybook();
    playSound("hover");
  };

    window.deleteRule = async (id) => {
    if (await sysConfirm("DELETE RULE", "Remove this rule?", true)) {
      if (isDemo) {
        playbookData = playbookData.filter((r) => r.id != id);
        renderPlaybook();
        return;
      }
      // --- NEW PATH: PORTFOLIO SPECIFIC ---
      await deleteDoc(
        doc(
          db,
          "users",
          currentUser.uid,
          "portfolios",
          currentPortfolioId,
          "playbook",
          id,
        ),
      );
      loadData(); // Reload
      sysNotify("RULE DELETED", "success");
    }
  };

  
    window.deleteRule = async (id) => {
    if (
      await sysConfirm(
        "PURGE PROTOCOL",
        "Deleting this will remove the gained XP. Proceed?",
        true,
      )
    ) {
      // 1. Fetch the rule first to see how much XP it was worth
      const docRef = doc(
        db,
        "users",
        currentUser.uid,
        "portfolios",
        currentPortfolioId,
        "playbook",
        id,
      );
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const xpToRemove = data.xpValue || 0; // We will save this value when creating

        // 2. Deduct XP
        if (xpToRemove > 0) {
          playerXP = Math.max(0, playerXP - xpToRemove);
          systemData["s_xp"] = playerXP;
          saveData("system");
          calculateLevel(); // Update UI rank immediately
          sysNotify(`PROTOCOL PURGED. -${xpToRemove} XP.`, "error");
        }

        // 3. Delete
        await deleteDoc(docRef);
        loadData();
      }
    }
  };