const SAVE_KEY = "vibe_coder_save_v1";

const DEFAULT_STATE = () => ({
  money: 0,
  stars: 0,
  users: 0,
  energy: 100,
  focus: 100,
  hype: 50,
  sanity: 80,
  totalProjects: 0,
  totalDeploys: 0,
  playTime: 0,
  upgrades: {},
  projects: [],
  activeProject: null,
  lastTick: Date.now(),
  lastEvent: 0,
  seenWelcome: false,
  stats: {
    bestProject: null,
    totalEarned: 0,
    bugsFixed: 0,
    promptsSent: 0,
  },
});

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return DEFAULT_STATE();
    const parsed = JSON.parse(raw);
    const defaults = DEFAULT_STATE();
    return {
      ...defaults,
      ...parsed,
      upgrades: { ...defaults.upgrades, ...(parsed.upgrades || {}) },
      stats: { ...defaults.stats, ...(parsed.stats || {}) },
      projects: Array.isArray(parsed.projects) ? parsed.projects : defaults.projects,
    };
  } catch {
    return DEFAULT_STATE();
  }
}

function saveState(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function applyDecay(state, elapsedSec) {
  const m = calcMultipliers(state);

  const energyDrain = 0.03 * (1 + m.energyDrain);
  const sanityDrain = 0.02 * (1 + m.sanityDrain);
  const hypeDrain = 0.015;
  const focusDrain = 0.025;

  state.energy = clamp(state.energy - elapsedSec * energyDrain + elapsedSec * m.energyRegen);
  state.sanity = clamp(state.sanity - elapsedSec * sanityDrain + elapsedSec * m.sanityRegen);
  state.hype = clamp(state.hype - elapsedSec * hypeDrain);
  state.focus = clamp(state.focus - elapsedSec * focusDrain + elapsedSec * m.focusRegen);

  state.playTime += elapsedSec;

  const passiveIncome = calcPassiveIncome(state, m);
  state.money += passiveIncome.money * elapsedSec;
  state.stars += passiveIncome.stars * elapsedSec;
  state.users += passiveIncome.users * elapsedSec;
  state.stats.totalEarned += passiveIncome.money * elapsedSec;
}

function calcPassiveIncome(state, m) {
  let money = 0;
  let stars = 0;
  let users = 0;

  for (const p of state.projects) {
    if (p.status !== "live") continue;
    const type = PROJECT_TYPES.find((t) => t.id === p.typeId);
    if (!type) continue;
    const age = Math.min(p.level || 1, 10);
    money += (type.baseMoney * 0.1 * age) * m.passive * m.money;
    stars += (type.baseStars * 0.02 * age) * m.passive;
    users += (type.baseUsers * 0.05 * age) * m.passive * m.users;
  }

  return { money, stars, users };
}

function canStartProject(state, typeId) {
  const type = PROJECT_TYPES.find((t) => t.id === typeId);
  if (!type) return { ok: false, reason: "unknown" };

  const rank = getRank(state.stars);
  if (rank.id < type.unlockRank) return { ok: false, reason: "rank" };

  const m = calcMultipliers(state);
  const energyNeed = type.energy * m.energyCost;
  if (state.energy < energyNeed) return { ok: false, reason: "energy" };
  if (state.focus < type.focus) return { ok: false, reason: "focus" };

  if (state.activeProject) return { ok: false, reason: "busy" };

  return { ok: true, type, energyNeed };
}

function startProject(state, typeId) {
  const check = canStartProject(state, typeId);
  if (!check.ok) return check;

  const { type, energyNeed } = check;
  const m = calcMultipliers(state);

  state.energy = clamp(state.energy - energyNeed);
  state.focus = clamp(state.focus - type.focus);

  const speedMult = 1 + m.speed;
  const duration = type.duration / speedMult;

  state.activeProject = {
    typeId,
    progress: 0,
    duration,
    quality: 0.5 + Math.random() * 0.3 + m.vibeBonus,
    bugs: Math.floor(Math.random() * 3),
  };

  return { ok: true };
}

function tickProject(state, dt) {
  if (!state.activeProject) return null;

  const proj = state.activeProject;
  proj.progress += dt;

  if (proj.progress >= proj.duration) {
    return finishProject(state);
  }
  return null;
}

function finishProject(state) {
  const proj = state.activeProject;
  if (!proj) return null;

  const type = PROJECT_TYPES.find((t) => t.id === proj.typeId);
  const m = calcMultipliers(state);
  const quality = clamp(proj.quality * 100, 30, 150) / 100;
  const hypeBonus = 1 + state.hype / 100;

  const stars = Math.floor(type.baseStars * quality * m.stars * hypeBonus);
  const money = Math.floor(type.baseMoney * quality * m.money * hypeBonus);
  const users = Math.floor(type.baseUsers * quality * m.users * hypeBonus);

  state.stars += stars;
  state.money += money;
  state.users += users;
  state.hype = clamp(state.hype + 10);
  state.totalProjects += 1;
  state.stats.totalEarned += money;

  const finished = {
    id: Date.now(),
    typeId: proj.typeId,
    name: type.name,
    emoji: type.emoji,
    stars,
    money,
    users,
    quality,
    bugs: proj.bugs,
    status: "done",
    level: 1,
  };

  state.projects.unshift(finished);
  if (state.projects.length > 50) state.projects.pop();

  if (!state.stats.bestProject || stars > state.stats.bestProject.stars) {
    state.stats.bestProject = { name: type.name, stars };
  }

  const oldRank = getRank(state.stars - stars);
  const newRank = getRank(state.stars);
  const rankedUp = newRank.id > oldRank.id;

  state.activeProject = null;

  return { finished, stars, money, users, rankedUp, newRank };
}

function deployProject(state, projectId) {
  const proj = state.projects.find((p) => p.id === projectId);
  if (!proj || proj.status === "live") return { ok: false };

  const m = calcMultipliers(state);
  const success = Math.random() < 0.7 + proj.quality * 0.2 + m.deploySpeed;

  if (success) {
    proj.status = "live";
    proj.deployedAt = Date.now();
    state.totalDeploys += 1;
    state.hype = clamp(state.hype + 15);
    state.stars += Math.floor(proj.stars * 0.3);
    return { ok: true, success: true };
  }

  proj.bugs += 1;
  state.sanity = clamp(state.sanity - 10);
  return { ok: true, success: false };
}

function buyUpgrade(state, upgradeId) {
  const up = UPGRADES.find((u) => u.id === upgradeId);
  if (!up) return { ok: false };

  const lvl = getUpgradeLevel(state, upgradeId);
  if (lvl >= up.maxLevel) return { ok: false, reason: "max" };

  const cost = getUpgradeCost(up, lvl);
  if (state.money < cost) return { ok: false, reason: "money" };

  state.money -= cost;
  state.upgrades[upgradeId] = lvl + 1;
  return { ok: true, level: lvl + 1, cost };
}

function drinkCoffee(state) {
  if (state.money < 5) return { ok: false, reason: "money" };
  state.money -= 5;
  state.energy = clamp(state.energy + 25);
  state.focus = clamp(state.focus + 10);
  return { ok: true };
}

function takeBreak(state) {
  state.energy = clamp(state.energy + 15);
  state.sanity = clamp(state.sanity + 20);
  state.hype = clamp(state.hype - 5);
  state.focus = clamp(state.focus + 15);
  return { ok: true };
}

function randomEvent(state) {
  const now = Date.now();
  if (now - state.lastEvent < 30000) return null;
  if (Math.random() > 0.02) return null;

  state.lastEvent = now;
  const ev = pickRandom(EVENTS);
  const result = { text: ev.text };

  if (ev.stars) state.stars += ev.stars;
  if (ev.money) state.money = Math.max(0, state.money + ev.money);
  if (ev.users) state.users += ev.users;
  if (ev.hype) state.hype = clamp(state.hype + ev.hype);
  if (ev.sanity) state.sanity = clamp(state.sanity + ev.sanity);
  if (ev.focus) state.focus = clamp(state.focus + ev.focus);
  if (ev.energy) state.energy = clamp(state.energy + ev.energy);

  return result;
}

function addMiniGameBonus(state, score) {
  if (!state.activeProject) return;

  const bonus = score / 100;
  state.activeProject.quality = Math.max(0, Math.min(1.5, state.activeProject.quality + bonus));
  state.activeProject.progress += bonus * 0.5;
  state.stats.promptsSent += 1;
  state.hype = clamp(state.hype + score / 20);
}