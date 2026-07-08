const RANKS = [
  { id: 0, name: "Стажёр", stars: 0, emoji: "🐣" },
  { id: 1, name: "Джун", stars: 50, emoji: "☕" },
  { id: 2, name: "Вайбкодер", stars: 500, emoji: "✨" },
  { id: 3, name: "Сеньор", stars: 5000, emoji: "🔥" },
  { id: 4, name: "10x Engineer", stars: 50000, emoji: "🚀" },
  { id: 5, name: "Tech Bro", stars: 500000, emoji: "💎" },
];

const PROJECT_TYPES = [
  {
    id: "todo",
    name: "Todo App",
    emoji: "📝",
    energy: 8,
    focus: 5,
    baseStars: 3,
    baseMoney: 2,
    baseUsers: 1,
    duration: 4,
    unlockRank: 0,
    desc: "Классика. Ещё один todo — и мир спасён.",
  },
  {
    id: "landing",
    name: "Лендинг",
    emoji: "🌐",
    energy: 12,
    focus: 8,
    baseStars: 8,
    baseMoney: 5,
    baseUsers: 4,
    duration: 6,
    unlockRank: 0,
    desc: "Hero section, gradient, CTA. Profit.",
  },
  {
    id: "ai_wrapper",
    name: "AI Wrapper",
    emoji: "🤖",
    energy: 18,
    focus: 12,
    baseStars: 25,
    baseMoney: 15,
    baseUsers: 20,
    duration: 8,
    unlockRank: 1,
    desc: "GPT + кнопка. Инвесторы в восторге.",
  },
  {
    id: "saas",
    name: "Micro-SaaS",
    emoji: "💰",
    energy: 28,
    focus: 20,
    baseStars: 60,
    baseMoney: 40,
    baseUsers: 80,
    duration: 12,
    unlockRank: 2,
    desc: "$9/мес за то, что Excel делает бесплатно.",
  },
  {
    id: "mobile",
    name: "Мобилка",
    emoji: "📱",
    energy: 35,
    focus: 25,
    baseStars: 120,
    baseMoney: 70,
    baseUsers: 200,
    duration: 15,
    unlockRank: 3,
    desc: "React Native + 47 permissions.",
  },
  {
    id: "startup",
    name: "Стартап",
    emoji: "🏢",
    energy: 50,
    focus: 35,
    baseStars: 400,
    baseMoney: 250,
    baseUsers: 1000,
    duration: 20,
    unlockRank: 4,
    desc: "Pitch deck готов. Runway — 3 месяца.",
  },
];

const UPGRADES = [
  {
    id: "keyboard",
    name: "Мехклава",
    emoji: "⌨️",
    category: "gear",
    baseCost: 50,
    costMult: 1.6,
    maxLevel: 10,
    effect: { focusRegen: 0.02, vibeBonus: 0.05 },
    desc: "+фокус, +качество вайба",
  },
  {
    id: "monitor",
    name: "4K монитор",
    emoji: "🖥️",
    category: "gear",
    baseCost: 120,
    costMult: 1.7,
    maxLevel: 8,
    effect: { starsMult: 0.08, usersMult: 0.05 },
    desc: "Больше пикселей — больше звёзд",
  },
  {
    id: "cursor_pro",
    name: "Cursor Pro",
    emoji: "⚡",
    category: "ai",
    baseCost: 200,
    costMult: 2.0,
    maxLevel: 5,
    effect: { energyCost: -0.08, speedMult: 0.15 },
    desc: "AI пишет, ты вайбишь",
  },
  {
    id: "claude",
    name: "Claude Opus",
    emoji: "🧠",
    category: "ai",
    baseCost: 500,
    costMult: 2.2,
    maxLevel: 5,
    effect: { starsMult: 0.12, moneyMult: 0.1 },
    desc: "Меньше галлюцинаций. Теоретически.",
  },
  {
    id: "coffee",
    name: "Кофемашина",
    emoji: "☕",
    category: "life",
    baseCost: 80,
    costMult: 1.5,
    maxLevel: 10,
    effect: { energyRegen: 0.04, sanityDrain: -0.02 },
    desc: "Энергия не кончается (почти)",
  },
  {
    id: "chair",
    name: "Геймерское кресло",
    emoji: "🪑",
    category: "life",
    baseCost: 150,
    costMult: 1.6,
    maxLevel: 6,
    effect: { sanityRegen: 0.03, energyDrain: -0.02 },
    desc: "RGB сиденье = +продуктивность",
  },
  {
    id: "intern",
    name: "Стажёр",
    emoji: "👶",
    category: "team",
    baseCost: 300,
    costMult: 2.5,
    maxLevel: 5,
    effect: { passiveMult: 0.15, deploySpeed: 0.1 },
    desc: "Делает скучные таски за тебя",
  },
  {
    id: "cofounder",
    name: "Кофаундер",
    emoji: "🤝",
    category: "team",
    baseCost: 2000,
    costMult: 3.0,
    maxLevel: 3,
    effect: { passiveMult: 0.35, starsMult: 0.2 },
    desc: "50% equity, 200% хайпа",
  },
];

const EVENTS = [
  { text: "🔥 Проект залетел на Hacker News!", stars: 50, hype: 15 },
  { text: "💀 Production упал в пятницу вечером", sanity: -20, money: -30 },
  { text: "🐛 AI сгенерил бесконечный цикл", focus: -15, sanity: -10 },
  { text: "⭐ Кто-то поставил звезду на GitHub!", stars: 5, hype: 5 },
  { text: "💸 Клиент оплатил инвойс!", money: 100 },
  { text: "📢 Твит про вайбкодинг набрал 10k", users: 200, hype: 20 },
  { text: "😴 3 часа дебага CSS — это норма", sanity: -8 },
  { text: "🎉 Vercel deploy прошёл с первого раза!", hype: 25, sanity: 10 },
  { text: "🚨 npm audit: 847 vulnerabilities", sanity: -12 },
  { text: "🏆 Product Hunt #1 of the day!", stars: 200, users: 500, money: 300 },
];

const PROMPTS = [
  "сделай красиво",
  "добавь анимации",
  "fix the bug",
  "сделай как у Apple",
  "добавь dark mode",
  "задеплой на vercel",
  "перепиши на rust",
  "добавь AI фичу",
  "сделай responsive",
  "оптимизируй performance",
  "добавь auth через google",
  "сгенери README",
];

const MESSAGES = {
  vibe_start: [
    "Окей, щас на вайбе напишем...",
    "Промпт — это 90% работы",
    "Код пишет AI, glory — моя",
    "Ship it and pray",
  ],
  deploy_ok: [
    "Задеплоилось! Магия.",
    "main в проде. Всё под контролем.",
    "It works on my machine ✅",
  ],
  deploy_fail: [
    "CI/CD красный. Классика.",
    "Забыл .env — опять.",
    "Works locally though...",
  ],
  low_energy: ["Нужен кофе...", "Мозг отключился", "Ctrl+Z жизни"],
  low_sanity: ["Зачем я вообще кодю?", "Может в бариста?", "Ещё один todo app..."],
  rank_up: ["Новый ранг! Вайб растёт.", "Level up! GitHub дрожит."],
};

function getRank(stars) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (stars >= r.stars) rank = r;
  }
  return rank;
}

function getUpgradeCost(upgrade, level) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));
}

function getUpgradeLevel(state, id) {
  return state.upgrades[id] || 0;
}

function calcMultipliers(state) {
  const m = {
    stars: 1,
    money: 1,
    users: 1,
    passive: 1,
    speed: 1,
    energyCost: 1,
    focusRegen: 0,
    energyRegen: 0,
    sanityRegen: 0,
    sanityDrain: 0,
    energyDrain: 0,
    vibeBonus: 0,
    deploySpeed: 0,
  };

  for (const up of UPGRADES) {
    const lvl = getUpgradeLevel(state, up.id);
    if (!lvl) continue;
    for (const [key, val] of Object.entries(up.effect)) {
      if (key.includes("Drain") || key.includes("Cost")) {
        m[key] += val * lvl;
      } else if (key.includes("Regen") || key.includes("Bonus") || key.includes("Speed")) {
        m[key] += val * lvl;
      } else {
        m[key] += val * lvl;
      }
    }
  }

  const hypeBonus = 1 + state.hype / 200;
  m.stars *= hypeBonus;
  m.users *= hypeBonus;

  return m;
}

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}