// Game State
const STATE_KEY = "StudyWizardRPG_v1";

const state = {
  ink: 0,
  wisdom: 0,
  clickPower: 1,
  studyBoonActive: false,
  studyBoonTime: 0,
  passiveUpgrades: {},
  clickUpgrades: {},
  characters: {}
};

// Character configs - they level up visually!
const characterConfigs = [
  {
    id: 'apprentice',
    name: 'Apprentice Scholar',
    baseCost: 50,
    baseRate: 0.5,
    desc: 'A young mage learning the ways'
  },
  {
    id: 'scholar',
    name: 'Castle Scholar',
    baseCost: 300,
    baseRate: 2.5,
    desc: 'Dedicated to ancient texts'
  },
  {
    id: 'mage',
    name: 'Tower Mage',
    baseCost: 1500,
    baseRate: 12,
    desc: 'Channels arcane energies'
  },
  {
    id: 'archmage',
    name: 'Archmage',
    baseCost: 8000,
    baseRate: 60,
    desc: 'Master of mystical arts'
  },
  {
    id: 'timeLord',
    name: 'Time Lord',
    baseCost: 40000,
    baseRate: 300,
    desc: 'Bends time itself to study'
  }
];

const passiveUpgradeConfigs = [
  { id: 'candlelight', name: 'Candlelight', baseCost: 15, rate: 0.2, desc: 'Cozy illumination' },
  { id: 'scrolls', name: 'Ancient Scrolls', baseCost: 60, rate: 0.5, desc: 'Whispers of knowledge' },
  { id: 'desk', name: 'Reading Desk', baseCost: 180, rate: 1.2, desc: 'Study sanctuary' },
  { id: 'gallery', name: 'Upper Gallery', baseCost: 480, rate: 2.8, desc: 'More library space' },
  { id: 'window', name: 'Astral Window', baseCost: 1300, rate: 6.5, desc: 'Starlight flows in' },
  { id: 'quill_passive', name: 'Enchanted Quill', baseCost: 3500, rate: 15, desc: 'Writes on its own' },
  { id: 'spell', name: 'Time Spell', baseCost: 9000, rate: 35, desc: 'Dilates time' },
  { id: 'tome', name: 'Ancient Tome', baseCost: 25000, rate: 80, desc: 'Self-writing grimoire' }
];

const clickUpgradeConfigs = [
  { id: 'quill', name: 'Basic Quill', baseCost: 10, power: 1, desc: 'Better writing tool' },
  { id: 'silver', name: 'Silver Ink', baseCost: 100, power: 3, desc: 'Magical fluid' },
  { id: 'pen', name: 'Magic Pen', baseCost: 800, power: 8, desc: 'Enchanted implement' },
  { id: 'staff', name: 'Wizard Staff', baseCost: 5000, power: 20, desc: 'Pure magical power' }
];

// Canvas setup
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let lastTick = performance.now();

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Particle class
class Particle {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.vy = -2;
    this.opacity = 1;
    this.life = 60;
  }

  update() {
    this.y += this.vy;
    this.opacity -= 0.016;
    this.life--;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = '#f4d794';
    ctx.font = 'bold 24px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// Draw character on canvas with level progression
function drawCharacter(count) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Character evolves as you hire more
  let color = '#6b4423';
  let size = 60;
  let glow = 0;

  if (count > 50) {
    color = '#f4d794';
    size = 100;
    glow = 30;
  } else if (count > 20) {
    color = '#c4a574';
    size = 85;
    glow = 20;
  } else if (count > 5) {
    color = '#8b6433';
    size = 70;
    glow = 10;
  }

  // Glow effect
  if (glow > 0) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size + 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Main character
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
  ctx.fill();

  // Hat
  ctx.fillStyle = '#3a1a4a';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - size);
  ctx.lineTo(centerX - size * 0.6, centerY - size * 0.3);
  ctx.lineTo(centerX + size * 0.6, centerY - size * 0.3);
  ctx.closePath();
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#f4e8d8';
  ctx.beginPath();
  ctx.arc(centerX - size * 0.3, centerY - size * 0.1, size * 0.15, 0, Math.PI * 2);
  ctx.arc(centerX + size * 0.3, centerY - size * 0.1, size * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#1a0f0a';
  ctx.beginPath();
  ctx.arc(centerX - size * 0.3, centerY - size * 0.1, size * 0.08, 0, Math.PI * 2);
  ctx.arc(centerX + size * 0.3, centerY - size * 0.1, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

// Animation loop
function animate() {
  ctx.fillStyle = '#1a0f0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floating sparkles
  const time = Date.now() * 0.001;
  for (let i = 0; i < 8; i++) {
    const x = (Math.sin(time * 0.5 + i * 1.2) * 0.4 + 0.5) * canvas.width;
    const y = (Math.cos(time * 0.7 + i * 1.5) * 0.4 + 0.5) * canvas.height;
    const size = Math.sin(time * 2 + i) * 2 + 3;

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#f4d794';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw main character
  const totalCharacters = Object.values(state.characters).reduce((a, b) => a + b, 0);
  drawCharacter(totalCharacters);

  // Particles
  particles = particles.filter(p => {
    const alive = p.update();
    if (alive) p.draw(ctx);
    return alive;
  });

  requestAnimationFrame(animate);
}
animate();

// Click handler
canvas.addEventListener('click', (e) => {
  const power = calculateClickPower();
  state.ink += power;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  particles.push(new Particle(x, y, `+${power.toFixed(1)}`));

  updateDisplay();
  saveState();
});

// Calculate rates
function calculateClickPower() {
  let power = 1;
  clickUpgradeConfigs.forEach(cfg => {
    const level = state.clickUpgrades[cfg.id] || 0;
    power += cfg.power * level;
  });
  power *= (1 + state.wisdom * 0.02);
  return power;
}

function calculateInkRate() {
  let rate = 0.2;

  // Passive upgrades
  passiveUpgradeConfigs.forEach(cfg => {
    const level = state.passiveUpgrades[cfg.id] || 0;
    rate += cfg.rate * level;
  });

  // Characters
  characterConfigs.forEach(cfg => {
    const count = state.characters[cfg.id] || 0;
    rate += cfg.baseRate * count;
  });

  // Bonuses
  if (state.studyBoonActive) rate *= 1.5;
  rate *= (1 + state.wisdom * 0.05);

  return rate;
}

function getCost(baseCost, level) {
  return Math.floor(baseCost * Math.pow(1.15, level));
}

// Character SVG generator with unique designs for each character type
function getCharacterSVG(charId, count) {
  const lvl = count > 10 ? 2 : count > 3 ? 1 : 0;

  const designs = {
    apprentice: {
      colors: {
        base: ['#8b6433', '#a48964', '#c4a574'],
        robe: ['#4a3425', '#5a4435', '#6a5445'],
        hat: ['#6b4423', '#7b5433', '#8b6443']
      },
      svg: (c) => `
        <circle cx="50" cy="55" r="38" fill="${c.base}"/>
        <rect x="30" y="50" width="40" height="50" fill="${c.robe}" rx="5"/>
        <polygon points="50,15 25,45 75,45" fill="${c.hat}"/>
        <circle cx="38" cy="48" r="6" fill="#f4e8d8"/>
        <circle cx="62" cy="48" r="6" fill="#f4e8d8"/>
        <circle cx="38" cy="48" r="3" fill="#1a0f0a"/>
        <circle cx="62" cy="48" r="3" fill="#1a0f0a"/>
        <rect x="42" y="65" width="16" height="4" fill="${c.robe}" rx="2"/>
        <line x1="35" y1="70" x2="35" y2="85" stroke="${c.robe}" stroke-width="3"/>
        <line x1="65" y1="70" x2="65" y2="85" stroke="${c.robe}" stroke-width="3"/>
      `
    },
    scholar: {
      colors: {
        base: ['#6b5a4a', '#8b7a6a', '#ab9a8a'],
        robe: ['#2a4a3a', '#3a5a4a', '#4a6a5a'],
        book: ['#8b4513', '#a0522d', '#bc6c3d']
      },
      svg: (c) => `
        <circle cx="50" cy="55" r="38" fill="${c.base}"/>
        <rect x="28" y="48" width="44" height="52" fill="${c.robe}" rx="6"/>
        <circle cx="50" cy="25" r="18" fill="${c.base}"/>
        <rect x="32" y="20" width="36" height="12" fill="${c.robe}"/>
        <circle cx="40" cy="50" r="6" fill="#f4e8d8"/>
        <circle cx="60" cy="50" r="6" fill="#f4e8d8"/>
        <circle cx="40" cy="50" r="3" fill="#1a0f0a"/>
        <circle cx="60" cy="50" r="3" fill="#1a0f0a"/>
        <rect x="35" y="70" width="12" height="18" fill="${c.book}" rx="2"/>
        <line x1="35" y1="75" x2="47" y2="75" stroke="#f4e8d8" stroke-width="1"/>
        <line x1="35" y1="80" x2="47" y2="80" stroke="#f4e8d8" stroke-width="1"/>
        <line x1="35" y1="85" x2="47" y2="85" stroke="#f4e8d8" stroke-width="1"/>
        <circle cx="50" cy="60" r="3" fill="${c.robe}"/>
      `
    },
    mage: {
      colors: {
        base: ['#7a5a8a', '#9a7aaa', '#ba9aca'],
        robe: ['#3a1a4a', '#4a2a5a', '#5a3a6a'],
        orb: ['#6a4a7a', '#8a6a9a', '#aa8aba']
      },
      svg: (c) => `
        <circle cx="50" cy="55" r="38" fill="${c.base}"/>
        <rect x="25" y="45" width="50" height="55" fill="${c.robe}" rx="8"/>
        <polygon points="50,8 20,38 80,38" fill="${c.robe}"/>
        <circle cx="50" cy="15" r="8" fill="${c.orb}"/>
        <circle cx="37" cy="47" r="7" fill="#f4e8d8"/>
        <circle cx="63" cy="47" r="7" fill="#f4e8d8"/>
        <circle cx="37" cy="47" r="3.5" fill="#1a0f0a"/>
        <circle cx="63" cy="47" r="3.5" fill="#1a0f0a"/>
        <rect x="20" y="65" width="15" height="30" fill="${c.robe}" rx="3"/>
        <circle cx="27" cy="93" r="5" fill="${c.orb}"/>
        <path d="M 45 63 Q 50 68 55 63" stroke="#1a0f0a" stroke-width="2" fill="none"/>
        <circle cx="30" cy="55" r="2" fill="${c.orb}"/>
        <circle cx="70" cy="55" r="2" fill="${c.orb}"/>
      `
    },
    archmage: {
      colors: {
        base: ['#d4a574', '#e4b584', '#f4c594'],
        robe: ['#4a1a5a', '#5a2a6a', '#6a3a7a'],
        crystal: ['#8a4a9a', '#aa6aba', '#ca8ada']
      },
      svg: (c) => `
        <circle cx="50" cy="55" r="40" fill="${c.base}"/>
        <rect x="22" y="43" width="56" height="57" fill="${c.robe}" rx="10"/>
        <polygon points="50,5 15,35 85,35" fill="${c.robe}"/>
        <circle cx="50" cy="12" r="10" fill="${c.crystal}"/>
        <circle cx="36" cy="46" r="8" fill="#f4e8d8"/>
        <circle cx="64" cy="46" r="8" fill="#f4e8d8"/>
        <circle cx="36" cy="46" r="4" fill="#6a3a7a"/>
        <circle cx="64" cy="46" r="4" fill="#6a3a7a"/>
        <rect x="15" y="60" width="20" height="35" fill="${c.robe}" rx="4"/>
        <polygon points="25,95 20,88 30,88" fill="${c.crystal}"/>
        <circle cx="50" cy="65" r="4" fill="${c.crystal}"/>
        <circle cx="42" cy="72" r="3" fill="${c.crystal}"/>
        <circle cx="58" cy="72" r="3" fill="${c.crystal}"/>
        <rect x="45" y="78" width="10" height="3" fill="${c.crystal}" rx="1"/>
        <path d="M 42 60 Q 50 65 58 60" stroke="#6a3a7a" stroke-width="2" fill="none"/>
      `
    },
    timeLord: {
      colors: {
        base: ['#4a6a8a', '#5a7a9a', '#6a8aaa'],
        robe: ['#1a2a3a', '#2a3a4a', '#3a4a5a'],
        time: ['#6a8a9a', '#7a9aaa', '#8aaaba']
      },
      svg: (c) => `
        <circle cx="50" cy="55" r="42" fill="${c.base}"/>
        <rect x="20" y="40" width="60" height="60" fill="${c.robe}" rx="12"/>
        <polygon points="50,2 10,32 90,32" fill="${c.robe}"/>
        <circle cx="50" cy="10" r="12" fill="${c.time}"/>
        <line x1="50" y1="10" x2="50" y2="5" stroke="${c.robe}" stroke-width="2"/>
        <line x1="50" y1="10" x2="55" y2="10" stroke="${c.robe}" stroke-width="2"/>
        <circle cx="35" cy="45" r="9" fill="#f4e8d8"/>
        <circle cx="65" cy="45" r="9" fill="#f4e8d8"/>
        <circle cx="35" cy="45" r="5" fill="#1a2a3a"/>
        <circle cx="65" cy="45" r="5" fill="#1a2a3a"/>
        <rect x="12" y="58" width="25" height="38" fill="${c.robe}" rx="5"/>
        <circle cx="24" cy="95" r="7" fill="${c.time}"/>
        <line x1="24" y1="95" x2="24" y2="90" stroke="${c.robe}" stroke-width="1.5"/>
        <line x1="24" y1="95" x2="27" y2="95" stroke="${c.robe}" stroke-width="1.5"/>
        <circle cx="50" cy="65" r="8" fill="${c.time}"/>
        <circle cx="38" cy="75" r="4" fill="${c.time}"/>
        <circle cx="62" cy="75" r="4" fill="${c.time}"/>
        <circle cx="50" cy="82" r="5" fill="${c.time}"/>
        <path d="M 40 58 Q 50 63 60 58" stroke="#1a2a3a" stroke-width="3" fill="none"/>
        <circle cx="25" cy="48" r="2" fill="${c.time}"/>
        <circle cx="75" cy="48" r="2" fill="${c.time}"/>
        <circle cx="20" cy="60" r="2" fill="${c.time}"/>
        <circle cx="80" cy="60" r="2" fill="${c.time}"/>
      `
    }
  };

  const design = designs[charId];
  if (!design) return '';

  const colors = {
    base: design.colors.base[lvl],
    robe: design.colors.robe[lvl],
    hat: design.colors.hat ? design.colors.hat[lvl] : design.colors.robe[lvl],
    book: design.colors.book ? design.colors.book[lvl] : design.colors.robe[lvl],
    orb: design.colors.orb ? design.colors.orb[lvl] : design.colors.robe[lvl],
    crystal: design.colors.crystal ? design.colors.crystal[lvl] : design.colors.robe[lvl],
    time: design.colors.time ? design.colors.time[lvl] : design.colors.robe[lvl]
  };

  return `<svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">${design.svg(colors)}</svg>`;
}

// Rendering
function updateDisplay() {
  document.getElementById('inkDisplay').textContent = Math.floor(state.ink).toLocaleString();
  document.getElementById('wisdomDisplay').textContent = state.wisdom.toLocaleString();
  document.getElementById('rateDisplay').textContent = calculateInkRate().toFixed(1);

  const estimatedWisdom = Math.floor(Math.sqrt(state.ink / 500));
  document.getElementById('prestigeValue').textContent = estimatedWisdom;
  document.getElementById('prestigeBonus').textContent = 
    `+${(state.wisdom * 5).toFixed(0)}% Ink/sec · +${(state.wisdom * 2).toFixed(0)}% click power`;
}

function renderCharacters() {
  const grid = document.getElementById('characterGrid');
  grid.innerHTML = '';

  characterConfigs.forEach(cfg => {
    const count = state.characters[cfg.id] || 0;
    const cost = getCost(cfg.baseCost, count);
    const canAfford = state.ink >= cost;

    const item = document.createElement('div');
    item.className = 'character-item';
    item.innerHTML = `
      <div class="character-avatar">
        ${getCharacterSVG(cfg.id, count)}
      </div>
      <div class="character-name">${cfg.name}</div>
      <div class="character-count">× ${count}</div>
      <div class="character-production">${(cfg.baseRate * count).toFixed(1)} Ink/sec</div>
      <button class="hire-btn" ${!canAfford ? 'disabled' : ''}>
        Hire: ${cost.toLocaleString()}
      </button>
    `;

    item.querySelector('button').addEventListener('click', () => {
      if (state.ink >= cost) {
        state.ink -= cost;
        state.characters[cfg.id] = count + 1;
        updateDisplay();
        renderCharacters();
        saveState();
      }
    });

    grid.appendChild(item);
  });
}

function renderPassiveUpgrades() {
  const container = document.getElementById('passiveUpgrades');
  container.innerHTML = '';

  passiveUpgradeConfigs.forEach(cfg => {
    const level = state.passiveUpgrades[cfg.id] || 0;
    const cost = getCost(cfg.baseCost, level);
    const canAfford = state.ink >= cost;

    const item = document.createElement('div');
    item.className = 'upgrade-item';
    item.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-title">${cfg.name} ${level > 0 ? `Lv.${level}` : ''}</div>
        <div class="upgrade-desc">${cfg.desc}</div>
        <div class="upgrade-stats">+${cfg.rate.toFixed(1)} Ink/sec</div>
      </div>
      <button class="upgrade-btn" ${!canAfford ? 'disabled' : ''}>
        ${cost.toLocaleString()}
      </button>
    `;

    item.querySelector('button').addEventListener('click', () => {
      if (state.ink >= cost) {
        state.ink -= cost;
        state.passiveUpgrades[cfg.id] = level + 1;
        updateDisplay();
        renderPassiveUpgrades();
        saveState();
      }
    });

    container.appendChild(item);
  });
}

function renderClickUpgrades() {
  const container = document.getElementById('clickUpgrades');
  container.innerHTML = '';

  clickUpgradeConfigs.forEach(cfg => {
    const level = state.clickUpgrades[cfg.id] || 0;
    const cost = getCost(cfg.baseCost, level);
    const canAfford = state.ink >= cost;

    const item = document.createElement('div');
    item.className = 'upgrade-item';
    item.innerHTML = `
      <div class="upgrade-info">
        <div class="upgrade-title">${cfg.name} ${level > 0 ? `Lv.${level}` : ''}</div>
        <div class="upgrade-desc">${cfg.desc}</div>
        <div class="upgrade-stats">+${cfg.power} per click</div>
      </div>
      <button class="upgrade-btn" ${!canAfford ? 'disabled' : ''}>
        ${cost.toLocaleString()}
      </button>
    `;

    item.querySelector('button').addEventListener('click', () => {
      if (state.ink >= cost) {
        state.ink -= cost;
        state.clickUpgrades[cfg.id] = level + 1;
        updateDisplay();
        renderClickUpgrades();
        saveState();
      }
    });

    container.appendChild(item);
  });
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.remove('active');
      if (p.id === tab) p.classList.add('active');
    });
  });
});

// Study Boon
document.getElementById('studyBtn').addEventListener('click', () => {
  if (!state.studyBoonActive) {
    state.studyBoonActive = true;
    state.studyBoonTime = 25 * 60;
    saveState();
    updateStudyUI();
  }
});

function updateStudyUI() {
  const btn = document.getElementById('studyBtn');
  const fill = document.getElementById('timerFill');

  if (state.studyBoonActive) {
    const m = Math.floor(state.studyBoonTime / 60);
    const s = Math.floor(state.studyBoonTime % 60);
    btn.textContent = `Active: ${m}:${s.toString().padStart(2, '0')}`;
    btn.disabled = true;
    const pct = (state.studyBoonTime / (25 * 60)) * 100;
    fill.style.width = pct + '%';
  } else {
    btn.textContent = 'Begin Study Session';
    btn.disabled = false;
    fill.style.width = '0%';
  }
}

// Prestige
document.getElementById('prestigeBtn').addEventListener('click', () => {
  const gain = Math.floor(Math.sqrt(state.ink / 500));
  if (gain === 0) return;

  if (confirm(`Restore the Archive for ${gain} Wisdom Pages? This resets Ink and upgrades.`)) {
    state.wisdom += gain;
    state.ink = 0;
    state.passiveUpgrades = {};
    state.clickUpgrades = {};
    state.studyBoonActive = false;
    state.studyBoonTime = 0;
    // Characters persist!

    saveState();
    updateDisplay();
    renderPassiveUpgrades();
    renderClickUpgrades();
    updateStudyUI();
  }
});

// Game loop
function gameTick() {
  const now = performance.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;

  // Income
  const rate = calculateInkRate();
  state.ink += rate * dt;

  // Study timer
  if (state.studyBoonActive) {
    state.studyBoonTime = Math.max(0, state.studyBoonTime - dt);
    if (state.studyBoonTime === 0) {
      state.studyBoonActive = false;
    }
    updateStudyUI();
  }

  updateDisplay();
}

setInterval(gameTick, 100);
setInterval(saveState, 5000);

// Save/Load
function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const data = localStorage.getItem(STATE_KEY);
    if (data) {
      const loaded = JSON.parse(data);
      Object.assign(state, loaded);
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
}

// Initialize
loadState();
updateDisplay();
renderCharacters();
renderPassiveUpgrades();
renderClickUpgrades();
updateStudyUI();
