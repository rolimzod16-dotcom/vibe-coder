(function () {
  let state = loadState();
  let lastFrame = performance.now();
  let currentTab = "code";

  const els = {
    money: document.getElementById("money"),
    stars: document.getElementById("stars"),
    users: document.getElementById("users"),
    rankBadge: document.getElementById("rank-badge"),
    passiveLabel: document.getElementById("passive-label"),
    energyFill: document.querySelector('[data-stat="energy"] .stat-fill'),
    focusFill: document.querySelector('[data-stat="focus"] .stat-fill'),
    hypeFill: document.querySelector('[data-stat="hype"] .stat-fill'),
    sanityFill: document.querySelector('[data-stat="sanity"] .stat-fill'),
    workspace: document.getElementById("workspace"),
    progressBar: document.getElementById("progress-bar"),
    progressLabel: document.getElementById("progress-label"),
    projectName: document.getElementById("project-name"),
    toast: document.getElementById("toast"),
    overlay: document.getElementById("overlay"),
    overlayTitle: document.getElementById("overlay-title"),
    overlayText: document.getElementById("overlay-text"),
    overlayExtra: document.getElementById("overlay-extra"),
    overlayBtn: document.getElementById("overlay-btn"),
    tabPanels: document.querySelectorAll(".tab-panel"),
    tabBtns: document.querySelectorAll(".tab-btn"),
    projectList: document.getElementById("project-list"),
    shopList: document.getElementById("shop-list"),
    statsPanel: document.getElementById("stats-panel"),
    typeList: document.getElementById("type-list"),
    vibeBtn: document.getElementById("vibe-btn"),
    coffeeBtn: document.getElementById("coffee-btn"),
    breakBtn: document.getElementById("break-btn"),
    mgLayer: document.getElementById("minigame-layer"),
    mgCanvas: document.getElementById("minigame-canvas"),
    mgClose: document.getElementById("minigame-close"),
    charEmoji: document.getElementById("char-emoji"),
    charStatus: document.getElementById("char-status"),
    bubble: document.getElementById("bubble"),
  };

  const miniGame = new PromptMiniGame(els.mgCanvas, onMiniGameEnd);

  function toast(text, duration = 2800) {
    els.toast.textContent = text;
    els.toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => els.toast.classList.add("hidden"), duration);
  }

  function say(text, duration = 3000) {
    els.bubble.textContent = text;
    els.bubble.classList.remove("hidden");
    clearTimeout(say._t);
    say._t = setTimeout(() => els.bubble.classList.add("hidden"), duration);
  }

  function showOverlay(title, text, extraHtml, onClose) {
    els.overlayTitle.textContent = title;
    els.overlayText.textContent = text;
    if (extraHtml) {
      els.overlayExtra.innerHTML = extraHtml;
      els.overlayExtra.classList.remove("hidden");
    } else {
      els.overlayExtra.classList.add("hidden");
      els.overlayExtra.innerHTML = "";
    }
    els.overlay.classList.remove("hidden");
    const close = () => {
      els.overlay.classList.add("hidden");
      els.overlayBtn.removeEventListener("click", close);
      onClose?.();
    };
    els.overlayBtn.addEventListener("click", close);
    return close;
  }

  function switchTab(tab) {
    currentTab = tab;
    els.tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    els.tabPanels.forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
    if (tab === "projects") renderProjects();
    if (tab === "shop") renderShop();
    if (tab === "stats") renderStats();
    if (tab === "code") renderTypes();
  }

  function updateHeader() {
    const rank = getRank(state.stars);
    els.money.textContent = `$${formatNum(state.money)}`;
    els.stars.textContent = `⭐ ${formatNum(state.stars)}`;
    els.users.textContent = `👥 ${formatNum(state.users)}`;
    els.rankBadge.textContent = `${rank.emoji} ${rank.name}`;

    const m = calcMultipliers(state);
    const passive = calcPassiveIncome(state, m);
    els.passiveLabel.textContent = `+$${formatNum(passive.money)}/s · +${formatNum(passive.stars)}⭐/s`;
  }

  function updateStats() {
    const stats = ["energy", "focus", "hype", "sanity"];
    stats.forEach((key) => {
      const fill = document.querySelector(`[data-stat="${key}"] .stat-fill`);
      fill.style.width = `${state[key]}%`;
      const el = document.querySelector(`[data-stat="${key}"]`);
      el.dataset.low = state[key] < 25 ? "true" : "false";
    });
  }

  function updateWorkspace() {
    const rank = getRank(state.stars);
    els.charEmoji.textContent = rank.emoji;

    if (state.activeProject) {
      const type = PROJECT_TYPES.find((t) => t.id === state.activeProject.typeId);
      const pct = Math.min(100, (state.activeProject.progress / state.activeProject.duration) * 100);
      els.projectName.textContent = `${type.emoji} ${type.name}`;
      els.progressBar.style.width = `${pct}%`;
      els.progressLabel.textContent = `${Math.floor(pct)}% · quality ${Math.floor(state.activeProject.quality * 100)}%`;
      els.charStatus.textContent = "вайбит...";
      els.workspace.classList.add("coding");
      els.vibeBtn.textContent = "🎮 Vibe Harder";
      els.vibeBtn.disabled = false;
    } else {
      els.projectName.textContent = "Нет активного проекта";
      els.progressBar.style.width = "0%";
      els.progressLabel.textContent = "Выбери тип проекта";
      els.charStatus.textContent = "idle";
      els.workspace.classList.remove("coding");
      els.vibeBtn.textContent = "✨ Vibe Code";
      els.vibeBtn.disabled = false;
    }
  }

  function renderTypes() {
    const rank = getRank(state.stars);
    els.typeList.innerHTML = PROJECT_TYPES.map((type) => {
      const locked = rank.id < type.unlockRank;
      const check = canStartProject(state, type.id);
      const disabled = locked || !check.ok;
      return `
        <button class="type-card ${disabled ? "disabled" : ""}" data-type="${type.id}" ${disabled ? "disabled" : ""}>
          <span class="type-emoji">${locked ? "🔒" : type.emoji}</span>
          <div class="type-info">
            <strong>${type.name}</strong>
            <small>${locked ? `Нужен ранг: ${RANKS[type.unlockRank].name}` : type.desc}</small>
            <span class="type-cost">⚡${type.energy} 🎯${type.focus}</span>
          </div>
        </button>
      `;
    }).join("");

    els.typeList.querySelectorAll("[data-type]").forEach((btn) => {
      btn.addEventListener("click", () => startProjectFlow(btn.dataset.type));
    });
  }

  function renderProjects() {
    if (!state.projects.length) {
      els.projectList.innerHTML = `<p class="empty">Пока пусто. Создай первый проект!</p>`;
      return;
    }

    els.projectList.innerHTML = state.projects.map((p) => {
      const type = PROJECT_TYPES.find((t) => t.id === p.typeId);
      const statusLabel = p.status === "live" ? "🟢 LIVE" : "📦 Готов";
      const deployBtn = p.status !== "live"
        ? `<button class="small-btn deploy-btn" data-deploy="${p.id}">🚀 Deploy</button>`
        : `<span class="live-badge">+$${formatNum(type.baseMoney * 0.1)}/s</span>`;
      return `
        <div class="project-card ${p.status}">
          <span class="proj-emoji">${p.emoji}</span>
          <div class="proj-info">
            <strong>${p.name}</strong>
            <small>⭐${p.stars} · $${p.money} · 👥${p.users} · ${statusLabel}</small>
          </div>
          ${deployBtn}
        </div>
      `;
    }).join("");

    els.projectList.querySelectorAll("[data-deploy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = deployProject(state, Number(btn.dataset.deploy));
        if (!result.ok) return;
        if (result.success) {
          toast(pickRandom(MESSAGES.deploy_ok));
          say("Production green ✅");
        } else {
          toast(pickRandom(MESSAGES.deploy_fail));
          say("Rollback when?");
        }
        saveState(state);
        renderProjects();
        updateHeader();
      });
    });
  }

  function renderShop() {
    const categories = ["gear", "ai", "life", "team"];
    const labels = { gear: "🛠 Железо", ai: "🤖 AI", life: "🏠 Лайфстайл", team: "👥 Команда" };

    els.shopList.innerHTML = categories.map((cat) => {
      const items = UPGRADES.filter((u) => u.category === cat);
      const cards = items.map((up) => {
        const lvl = getUpgradeLevel(state, up.id);
        const maxed = lvl >= up.maxLevel;
        const cost = getUpgradeCost(up, lvl);
        const canBuy = !maxed && state.money >= cost;
        return `
          <button class="shop-card ${canBuy ? "" : "disabled"}" data-upgrade="${up.id}" ${canBuy ? "" : "disabled"}>
            <span class="shop-emoji">${up.emoji}</span>
            <div class="shop-info">
              <strong>${up.name} <span class="lvl">Lv.${lvl}/${up.maxLevel}</span></strong>
              <small>${up.desc}</small>
              <span class="shop-cost">${maxed ? "MAX" : `$${formatNum(cost)}`}</span>
            </div>
          </button>
        `;
      }).join("");
      return `<div class="shop-section"><h3>${labels[cat]}</h3>${cards}</div>`;
    }).join("");

    els.shopList.querySelectorAll("[data-upgrade]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const result = buyUpgrade(state, btn.dataset.upgrade);
        if (result.ok) {
          toast(`Куплено! Lv.${result.level}`);
          saveState(state);
          renderShop();
          updateHeader();
        }
      });
    });
  }

  function renderStats() {
    const rank = getRank(state.stars);
    const m = calcMultipliers(state);
    const passive = calcPassiveIncome(state, m);
    const live = state.projects.filter((p) => p.status === "live").length;

    els.statsPanel.innerHTML = `
      <div class="stat-grid">
        <div class="stat-box"><span>Ранг</span><strong>${rank.emoji} ${rank.name}</strong></div>
        <div class="stat-box"><span>Проектов</span><strong>${state.totalProjects}</strong></div>
        <div class="stat-box"><span>Деплоев</span><strong>${state.totalDeploys}</strong></div>
        <div class="stat-box"><span>LIVE проектов</span><strong>${live}</strong></div>
        <div class="stat-box"><span>Всего заработано</span><strong>$${formatNum(state.stats.totalEarned)}</strong></div>
        <div class="stat-box"><span>Промптов</span><strong>${state.stats.promptsSent}</strong></div>
        <div class="stat-box"><span>Пассив $/s</span><strong>${formatNum(passive.money)}</strong></div>
        <div class="stat-box"><span>Время игры</span><strong>${Math.floor(state.playTime / 60)}м</strong></div>
      </div>
      ${state.stats.bestProject ? `<p class="best">🏆 Лучший: ${state.stats.bestProject.name} (${state.stats.bestProject.stars}⭐)</p>` : ""}
      <h3>Ранги</h3>
      <div class="rank-list">
        ${RANKS.map((r) => `<div class="rank-row ${state.stars >= r.stars ? "unlocked" : ""}">${r.emoji} ${r.name} — ${formatNum(r.stars)}⭐</div>`).join("")}
      </div>
    `;
  }

  function startProjectFlow(typeId) {
    const result = startProject(state, typeId);
    if (!result.ok) {
      if (result.reason === "energy") toast(pickRandom(MESSAGES.low_energy));
      else if (result.reason === "focus") toast("Мало фокуса — попей кофе");
      else if (result.reason === "rank") toast("Ранг слишком низкий");
      else if (result.reason === "busy") toast("Уже вайбишь другой проект");
      return;
    }
    say(pickRandom(MESSAGES.vibe_start));
    saveState(state);
    updateWorkspace();
    renderTypes();
    switchTab("code");
  }

  function openMiniGame() {
    if (!state.activeProject) {
      switchTab("code");
      toast("Сначала выбери проект!");
      return;
    }
    els.mgLayer.classList.remove("hidden");
    miniGame.start();
  }

  function onMiniGameEnd(score) {
    els.mgLayer.classList.add("hidden");
    addMiniGameBonus(state, score);
    toast(`Vibe score: ${score}! +quality`);
    saveState(state);
    updateWorkspace();

    const result = tickProject(state, 0);
    if (result) handleProjectDone(result);
  }

  function handleProjectDone(result) {
    const { finished, stars, money, users, rankedUp, newRank } = result;
    let extra = `<div class="result-card">${finished.emoji} +${stars}⭐ +$${money} +${users}👥</div>`;
    if (rankedUp) {
      extra += `<div class="rank-up">${newRank.emoji} Новый ранг: ${newRank.name}!</div>`;
      toast(pickRandom(MESSAGES.rank_up));
    }
    showOverlay("Проект готов! 🎉", `${finished.name} собран на вайбе.`, extra);
    saveState(state);
    updateAll();
  }

  function updateAll() {
    updateHeader();
    updateStats();
    updateWorkspace();
    if (currentTab === "code") renderTypes();
    if (currentTab === "projects") renderProjects();
    if (currentTab === "shop") renderShop();
    if (currentTab === "stats") renderStats();
  }

  function gameLoop(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.5);
    lastFrame = now;

    applyDecay(state, dt);

    if (state.activeProject) {
      const result = tickProject(state, dt);
      if (result) handleProjectDone(result);
    }

    const ev = randomEvent(state);
    if (ev) toast(ev.text, 4000);

    updateHeader();
    updateStats();
    updateWorkspace();

    if (state.activeProject && currentTab === "code") {
      const pct = Math.min(100, (state.activeProject.progress / state.activeProject.duration) * 100);
      els.progressBar.style.width = `${pct}%`;
      els.progressLabel.textContent = `${Math.floor(pct)}% · quality ${Math.floor(state.activeProject.quality * 100)}%`;
    }

    saveState(state);
    requestAnimationFrame(gameLoop);
  }

  els.tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  els.vibeBtn.addEventListener("click", openMiniGame);

  els.coffeeBtn.addEventListener("click", () => {
    const r = drinkCoffee(state);
    if (!r.ok) toast("Нет $5 на кофе");
    else {
      toast("☕ Кофеин в крови");
      saveState(state);
      updateStats();
      updateHeader();
    }
  });

  els.breakBtn.addEventListener("click", () => {
    takeBreak(state);
    toast("🧘 Перерыв. Sanity restored.");
    saveState(state);
    updateStats();
  });

  els.mgClose.addEventListener("click", () => {
    miniGame.end(miniGame.score);
  });

  if (!state.seenWelcome) {
    state.seenWelcome = true;
    saveState(state);
    showOverlay(
      "Vibe Coder Simulator ✨",
      "Структура как у симулятора блогера, но ты — вайбкодер. Создавай проекты, апгрейди сетап, деплой в прод и копи звёзды на GitHub.",
      `<ul class="tips">
        <li>📱 Выбери тип проекта → вайби (мини-игра с промптами)</li>
        <li>🚀 Задеплой готовые проекты для пассивного дохода</li>
        <li>🛒 Покупай Cursor Pro, мехклаву и кофаундера</li>
        <li>☕ Кофе и перерывы восстанавливают ресурсы</li>
      </ul>`
    );
  }

  switchTab("code");
  updateAll();
  requestAnimationFrame(gameLoop);
})();