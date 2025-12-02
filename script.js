// Wizard's Cozy Tower - Gamified Interactive Version
const STATE_KEY = "WizardCozyTower_v1";

// Game State
const state = {
  mana: 0,
  scrolls: 0,
  manaRate: 0.5,
  wisdomLevel: 1,
  cozyScore: 50,
  timeOfDay: 'evening',
  candleCount: 3,
  soundEnabled: true,
  particlesEnabled: true,
  totalClicks: 0,
  booksRead: 0,
  upgrades: {},
  achievements: {},
  lastSave: Date.now()
};

// Upgrades Config
const upgradesConfig = [
  {
    id: 'candle_power',
    name: 'Candle Enchantment',
    icon: '🕯️',
    desc: 'Candles generate more mana',
    baseCost: 50,
    costMult: 1.5,
    effect: () => state.manaRate += 0.3,
    costType: 'mana'
  },
  {
    id: 'bookshelf',
    name: 'Ancient Bookshelf',
    icon: '📚',
    desc: 'Unlock more wisdom from books',
    baseCost: 100,
    costMult: 1.8,
    effect: () => state.cozyScore += 10,
    costType: 'mana'
  },
  {
    id: 'crystal_ball',
    name: 'Crystal Ball',
    icon: '🔮',
    desc: 'Passive mana generation',
    baseCost: 200,
    costMult: 2.0,
    effect: () => state.manaRate += 0.5,
    costType: 'mana'
  },
  {
    id: 'magic_carpet',
    name: 'Flying Carpet',
    icon: '🧞',
    desc: 'Gather scrolls automatically',
    baseCost: 20,
    costMult: 1.6,
    effect: () => state.scrolls += 5,
    costType: 'scrolls'
  },
  {
    id: 'moon_ritual',
    name: 'Moon Ritual',
    icon: '🌙',
    desc: 'Night time bonus mana',
    baseCost: 300,
    costMult: 2.2,
    effect: () => state.manaRate += 1.0,
    costType: 'mana'
  },
  {
    id: 'cozy_chair',
    name: 'Velvet Reading Chair',
    icon: '🛋️',
    desc: 'Increase tower coziness',
    baseCost: 150,
    costMult: 1.7,
    effect: () => state.cozyScore += 15,
    costType: 'mana'
  }
];

// Achievements Config
const achievementsConfig = [
  { id: 'first_click', name: 'First Spark', icon: '✨', desc: 'Click a candle', check: () => state.totalClicks >= 1 },
  { id: 'book_worm', name: 'Book Worm', icon: '📖', desc: 'Read 5 books', check: () => state.booksRead >= 5 },
  { id: 'mana_hoarder', name: 'Mana Hoarder', icon: '💎', desc: 'Collect 1000 mana', check: () => state.mana >= 1000 },
  { id: 'wisdom_seeker', name: 'Wisdom Seeker', icon: '🧙', desc: 'Reach wisdom level 10', check: () => state.wisdomLevel >= 10 },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', desc: 'Use night mode', check: () => state.timeOfDay === 'night' },
  { id: 'cozy_master', name: 'Cozy Master', icon: '🏡', desc: 'Reach 100 cozy score', check: () => state.cozyScore >= 100 },
  { id: 'collector', name: 'Scroll Collector', icon: '📜', desc: 'Collect 100 scrolls', check: () => state.scrolls >= 100 },
  { id: 'clicker', name: 'Enthusiast', icon: '👆', desc: 'Click 100 times', check: () => state.totalClicks >= 100 }
];

// Canvas & Animation
let canvas, ctx;
let canvasWidth, canvasHeight;
let particles = [];
let candleFlames = [];
let time = 0;
let bookFloat = 0;

// Clickable zones
let clickableZones = {
  candles: [],
  book: null,
  window: null
};

// Audio (SFX only, no ambience)
let candleSfx, bookSfx, windowSfx;

// DOM Elements
const manaAmountEl = document.getElementById('manaAmount');
const scrollsAmountEl = document.getElementById('scrollsAmount');
const manaRateEl = document.getElementById('manaRate');
const wisdomLevelEl = document.getElementById('wisdomLevel');
const cozyScoreEl = document.getElementById('cozyScore');
const upgradesListEl = document.getElementById('upgradesList');
const achievementsListEl = document.getElementById('achievementsList');
const candleSlider = document.getElementById('candleSlider');
const candleCountEl = document.getElementById('candleCount');
const soundToggle = document.getElementById('soundToggle');
const particlesToggle = document.getElementById('particlesToggle');
const clickFeedbackEl = document.getElementById('clickFeedback');
const welcomeCard = document.getElementById('welcomeCard');
const dismissWelcome = document.getElementById('dismissWelcome');
const bookModal = document.getElementById('bookModal');
const closeBookModal = document.getElementById('closeBookModal');
const bookTextEl = document.getElementById('bookText');
const resetBtn = document.getElementById('resetBtn');

// Wisdom quotes for books
const wisdomQuotes = [
  "Magic is not in spells, but in understanding the world around you.",
  "A wizard's greatest power is patience and observation.",
  "The tower remembers all who study within its walls.",
  "Knowledge shared is knowledge doubled.",
  "In stillness, the universe reveals its secrets.",
  "Every flame holds a story, every shadow a lesson.",
  "Time flows differently when one is absorbed in learning.",
  "The stars are but distant candles in the cosmic library."
];

// UI themes for time of day
const uiThemes = {
  evening: {
    cardBg: "linear-gradient(135deg, #2f2336, #47325b)",
    cardBorder: "rgba(255, 255, 255, 0.06)",
    cardShadow: "0 18px 35px rgba(0, 0, 0, 0.45)"
  },
  night: {
    cardBg: "linear-gradient(135deg, #151322, #27233d)",
    cardBorder: "rgba(180, 210, 255, 0.1)",
    cardShadow: "0 20px 40px rgba(0, 0, 30, 0.6)"
  },
  dawn: {
    cardBg: "linear-gradient(135deg, #4e3151, #8a4f6b)",
    cardBorder: "rgba(255, 220, 230, 0.2)",
    cardShadow: "0 18px 35px rgba(40, 5, 30, 0.5)"
  }
};

// Initialize
function init() {
  loadState();
  setupCanvas();
  setupAudio();        // only SFX now
  setupEventListeners();
  updateDisplay();
  renderUpgrades();
  renderAchievements();
  updateUIThemeForTime();

  // Check if first time
  if (state.totalClicks === 0) {
    welcomeCard.classList.remove('hidden');
  } else {
    welcomeCard.classList.add('hidden');
  }

  // Start game loop
  setInterval(gameLoop, 100);
  animate();
}

// Audio setup (SFX only)
function setupAudio() {
  try {
    candleSfx = new Audio('audio/candle_click.wav');
    candleSfx.volume = 0.6;

    bookSfx = new Audio('audio/book_page.wav');
    bookSfx.volume = 0.6;

    windowSfx = new Audio('audio/window_chime.wav');
    windowSfx.volume = 0.5;
  } catch (e) {
    console.warn('Audio init failed:', e);
  }
}

function playSfx(audio) {
  if (!state.soundEnabled || !audio) return;
  try {
    audio.currentTime = 0;
    audio.play();
  } catch (e) {
    // ignore
  }
}

// State Management
function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(state, data);

      // ensure new keys exist
      upgradesConfig.forEach(up => {
        if (typeof state.upgrades[up.id] !== 'number') {
          state.upgrades[up.id] = 0;
        }
      });
      achievementsConfig.forEach(ach => {
        if (typeof state.achievements[ach.id] !== 'boolean') {
          state.achievements[ach.id] = false;
        }
      });

      applySavedSettings();
    } else {
      // Initialize upgrades/achievements
      upgradesConfig.forEach(up => {
        state.upgrades[up.id] = 0;
      });
      achievementsConfig.forEach(ach => {
        state.achievements[ach.id] = false;
      });
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
}

function saveState() {
  try {
    state.lastSave = Date.now();
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

function applySavedSettings() {
  candleSlider.value = state.candleCount;
  candleCountEl.textContent = state.candleCount;
  soundToggle.checked = state.soundEnabled;
  particlesToggle.checked = state.particlesEnabled;

  document.querySelectorAll('[data-time]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.time === state.timeOfDay);
  });

  updateUIThemeForTime();
}

// Game Loop
function gameLoop() {
  // Generate mana
  state.mana += state.manaRate / 10;

  // Auto-save every 5 seconds
  if (Date.now() - state.lastSave > 5000) {
    saveState();
  }

  updateDisplay();
  checkAchievements();
}

// Display Updates
function updateDisplay() {
  manaAmountEl.textContent = Math.floor(state.mana);
  scrollsAmountEl.textContent = state.scrolls;
  manaRateEl.textContent = state.manaRate.toFixed(1) + ' / sec';
  wisdomLevelEl.textContent = state.wisdomLevel;
  cozyScoreEl.textContent = state.cozyScore;
}

function showClickFeedback(x, y, text) {
  clickFeedbackEl.textContent = text;
  clickFeedbackEl.style.left = x + 'px';
  clickFeedbackEl.style.top = y + 'px';
  clickFeedbackEl.style.opacity = '1';
  clickFeedbackEl.style.animation = 'none';

  setTimeout(() => {
    clickFeedbackEl.style.animation = 'floatUp 1s ease forwards';
  }, 10);
}

// Upgrades
function renderUpgrades() {
  upgradesListEl.innerHTML = '';

  upgradesConfig.forEach(upgrade => {
    const level = state.upgrades[upgrade.id] || 0;
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));
    const canAfford = upgrade.costType === 'mana' ? state.mana >= cost : state.scrolls >= cost;

    const item = document.createElement('div');
    item.classList.add('upgrade-item');
    if (!canAfford) {
      item.classList.add('locked');
    } else {
      item.classList.add('affordable'); // for glow styling
    }

    item.innerHTML = `
      <div class="upgrade-header">
        <div class="upgrade-name">${upgrade.icon} ${upgrade.name}</div>
        <div class="upgrade-level">Lv. ${level}</div>
      </div>
      <div class="upgrade-desc">${upgrade.desc}</div>
      <div class="upgrade-footer">
        <div class="upgrade-cost">
          ${upgrade.costType === 'mana' ? '✨' : '📜'} ${cost}
        </div>
        <button class="upgrade-btn" ${canAfford ? '' : 'disabled'}>
          Upgrade
        </button>
      </div>
    `;

    const btn = item.querySelector('.upgrade-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const affordable = upgrade.costType === 'mana' ? state.mana >= cost : state.scrolls >= cost;
      if (affordable) {
        purchaseUpgrade(upgrade, cost);
      }
    });

    upgradesListEl.appendChild(item);
  });
}

function purchaseUpgrade(upgrade, cost) {
  if (upgrade.costType === 'mana') {
    state.mana -= cost;
  } else {
    state.scrolls -= cost;
  }

  state.upgrades[upgrade.id] = (state.upgrades[upgrade.id] || 0) + 1;
  upgrade.effect();

  playSfx(candleSfx);

  // Celebration particles from center
  if (state.particlesEnabled) {
    for (let i = 0; i < 20; i++) {
      particles.push(new Particle(canvasWidth / 2, canvasHeight / 2, true));
    }
  }

  saveState();
  renderUpgrades();
  updateDisplay();
}

// Achievements
function checkAchievements() {
  let newUnlock = false;

  achievementsConfig.forEach(ach => {
    if (!state.achievements[ach.id] && ach.check()) {
      state.achievements[ach.id] = true;
      newUnlock = true;
      state.cozyScore += 5;
    }
  });

  if (newUnlock) {
    renderAchievements();
    saveState();
    updateUIThemeForTime();
  }
}

function renderAchievements() {
  achievementsListEl.innerHTML = '';

  achievementsConfig.forEach(ach => {
    const unlocked = state.achievements[ach.id];

    const item = document.createElement('div');
    item.className = 'achievement-item' + (unlocked ? ' unlocked' : ' locked');

    item.innerHTML = `
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-name">${ach.name}</div>
      <div class="achievement-desc">${ach.desc}</div>
    `;

    achievementsListEl.appendChild(item);
  });
}

// Canvas Setup
function setupCanvas() {
  canvas = document.getElementById('towerCanvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  updateCandles();
}

function resizeCanvas() {
  canvasWidth = canvas.width = window.innerWidth;
  canvasHeight = canvas.height = window.innerHeight;
  updateClickableZones();
}

function updateCandles() {
  candleFlames = [];
  const spacing = Math.min(100, canvasWidth / (state.candleCount + 2));
  const startX = canvasWidth / 2 - ((state.candleCount - 1) * spacing) / 2;
  const y = canvasHeight * 0.7;

  for (let i = 0; i < state.candleCount; i++) {
    candleFlames.push({
      x: startX + i * spacing,
      y: y,
      flicker: Math.random() * Math.PI * 2,
      speed: 0.05 + Math.random() * 0.05
    });
  }

  updateClickableZones();
}

function updateClickableZones() {
  // Candle zones - generous for touch
  clickableZones.candles = candleFlames.map(candle => ({
    x: candle.x - 40,
    y: candle.y - 100,
    width: 80,
    height: 140
  }));

  // Book zone (matches drawStudyRoom book, padded)
  const roomY = canvasHeight * 0.65;
  const bookX = canvasWidth / 2 - 85;
  const bookY = roomY + 20;
  clickableZones.book = {
    x: bookX - 10,
    y: bookY - 30,
    width: 190,
    height: 100
  };

  // Window zone (padded)
  const centerX = canvasWidth / 2;
  const baseY = canvasHeight;
  const towerHeight = canvasHeight * 0.75;
  const windowHeight = Math.min(140, canvasHeight * 0.18);
  const windowWidth = Math.min(120, canvasWidth * 0.15);
  const windowY = baseY - towerHeight * 0.55;

  clickableZones.window = {
    x: centerX - windowWidth / 2 - 10,
    y: windowY - 10,
    width: windowWidth + 20,
    height: windowHeight + 20
  };
}

// Event Listeners
function setupEventListeners() {
  // Canvas clicks
  canvas.addEventListener('click', handleCanvasClick);

  // Dismiss welcome
  dismissWelcome.addEventListener('click', () => {
    welcomeCard.classList.add('hidden');
    state.totalClicks++;
    saveState();
  });

  // Ambiance controls (time of day)
  document.querySelectorAll('[data-time]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-time]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.timeOfDay = e.target.dataset.time;
      updateUIThemeForTime();
      saveState();
    });
  });

  candleSlider.addEventListener('input', (e) => {
    state.candleCount = parseInt(e.target.value);
    candleCountEl.textContent = state.candleCount;
    updateCandles();
    saveState();
  });

  soundToggle.addEventListener('change', (e) => {
    state.soundEnabled = e.target.checked;
    saveState();
  });

  particlesToggle.addEventListener('change', (e) => {
    state.particlesEnabled = e.target.checked;
    saveState();
  });

  // Book modal
  closeBookModal.addEventListener('click', () => {
    bookModal.classList.remove('active');
  });

  bookModal.addEventListener('click', (e) => {
    if (e.target === bookModal) {
      bookModal.classList.remove('active');
    }
  });

  // Reset button
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your tower? This cannot be undone!')) {
      localStorage.removeItem(STATE_KEY);
      location.reload();
    }
  });
}

function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  state.totalClicks++;

  // Candle clicks
  clickableZones.candles.forEach((zone, index) => {
    if (x >= zone.x && x <= zone.x + zone.width &&
        y >= zone.y && y <= zone.y + zone.height) {
      handleCandleClick(candleFlames[index], e.clientX, e.clientY);
    }
  });

  // Book click
  const bookZone = clickableZones.book;
  if (bookZone && x >= bookZone.x && x <= bookZone.x + bookZone.width &&
      y >= bookZone.y && y <= bookZone.y + bookZone.height) {
    handleBookClick(e.clientX, e.clientY);
  }

  // Window click
  const windowZone = clickableZones.window;
  if (windowZone && x >= windowZone.x && x <= windowZone.x + windowZone.width &&
      y >= windowZone.y && y <= windowZone.y + windowZone.height) {
    handleWindowClick(e.clientX, e.clientY);
  }

  saveState();
}

function handleCandleClick(candle, screenX, screenY) {
  const manaGain = 5 + state.wisdomLevel;
  state.mana += manaGain;

  playSfx(candleSfx);

  showClickFeedback(screenX, screenY, `+${manaGain} ✨`);

  // Spawn particles
  if (state.particlesEnabled && candle) {
    for (let i = 0; i < 8; i++) {
      particles.push(new Particle(candle.x, candle.y - 30, false));
    }
  }

  updateDisplay();
}

function handleBookClick() {
  state.booksRead++;
  state.wisdomLevel++;
  state.scrolls += 10;

  playSfx(bookSfx);

  // Show book modal with random quote
  const quote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)];
  bookTextEl.innerHTML = `<p>"${quote}"</p>`;
  bookModal.classList.add('active');

  // Particles from book
  if (state.particlesEnabled) {
    const centerX = canvasWidth / 2 - 40;
    const roomY = canvasHeight * 0.65;
    const bookY = roomY + 20;
    for (let i = 0; i < 15; i++) {
      particles.push(new Particle(centerX, bookY, true));
    }
  }

  updateDisplay();
  saveState();
}

function handleWindowClick(screenX, screenY) {
  const scrollGain = 3;
  state.scrolls += scrollGain;

  playSfx(windowSfx);

  showClickFeedback(screenX, screenY, `+${scrollGain} 📜`);

  // Particles from window center
  if (state.particlesEnabled) {
    const centerX = canvasWidth / 2;
    const baseY = canvasHeight;
    const towerHeight = canvasHeight * 0.75;
    const windowY = baseY - towerHeight * 0.55;
    for (let i = 0; i < 5; i++) {
      particles.push(new Particle(centerX, windowY + 40, false));
    }
  }

  updateDisplay();
}

// Particle Class (style from Study script)
class Particle {
  constructor(x, y, celebrate = false) {
    this.x = x;
    this.y = y;
    this.celebrate = celebrate;

    if (celebrate) {
      this.vx = (Math.random() - 0.5) * 8;
      this.vy = (Math.random() - 0.5) * 8 - 2;
      this.life = 1;
      this.decay = 0.02;
      this.size = 3 + Math.random() * 3;
      this.color = `hsl(${Math.random() * 60 + 20}, 80%, 60%)`;
    } else {
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = -0.5 - Math.random() * 1;
      this.life = 1;
      this.decay = 0.01;
      this.size = 1 + Math.random() * 2;
      this.color = 'rgba(255, 200, 100, 0.8)';
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;

    if (!this.celebrate) {
      this.vx *= 0.99;
      this.vy *= 0.99;
    } else {
      this.vy += 0.2; // gravity
    }
  }

  isDead() {
    return this.life <= 0;
  }
}

// Color schemes
function getTimeColors() {
  const colors = {
    evening: {
      sky: ['#1a0f2e', '#2d1b3d', '#4a2c5e'],
      stars: 0.3,
      moon: true
    },
    night: {
      sky: ['#0a0514', '#150820', '#1f0d2e'],
      stars: 0.6,
      moon: true
    },
    dawn: {
      sky: ['#2d1b3d', '#5e3a5e', '#8b5a7d'],
      stars: 0.1,
      moon: false
    }
  };
  return colors[state.timeOfDay] || colors.evening;
}

// UI theme updater for stat cards & subtle header/footer tint
function updateUIThemeForTime() {
  const theme = uiThemes[state.timeOfDay] || uiThemes.evening;
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach(card => {
    card.style.background = theme.cardBg;
    card.style.borderColor = theme.cardBorder;
    card.style.boxShadow = theme.cardShadow;
  });

  const header = document.querySelector('.app-header');
  const footer = document.querySelector('.app-footer');
  if (header) {
    header.style.background = 'rgba(10, 5, 20, 0.75)';
    header.style.backdropFilter = 'blur(14px)';
  }
  if (footer) {
    footer.style.background = 'rgba(10, 5, 20, 0.75)';
    footer.style.backdropFilter = 'blur(12px)';
  }
}

// Drawing functions (modern, from Study script)

function drawBackground() {
  const timeColors = getTimeColors();

  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, timeColors.sky[0]);
  gradient.addColorStop(0.4, timeColors.sky[1]);
  gradient.addColorStop(1, timeColors.sky[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * canvasWidth;
    const y = Math.random() * canvasHeight;
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

function drawStars() {
  const timeColors = getTimeColors();
  if (timeColors.stars > 0) {
    const starCount = Math.floor(80 * timeColors.stars);

    for (let i = 0; i < starCount; i++) {
      const x = (i * 137.508) % canvasWidth;
      const y = (i * 197.508) % (canvasHeight * 0.6);
      const twinkle = Math.sin(time * 0.002 + i * 0.5) * 0.5 + 0.5;
      const size = (Math.sin(i) * 0.5 + 1) * 1.5;

      ctx.save();
      ctx.globalAlpha = twinkle * timeColors.stars * 0.8;

      const starGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      starGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
      starGlow.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
      starGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = starGlow;
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

function drawMoon() {
  const timeColors = getTimeColors();
  if (timeColors.moon) {
    const x = canvasWidth * 0.82;
    const y = canvasHeight * 0.18;
    const radius = Math.min(60, canvasWidth * 0.08);

    const outerGlow = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 3);
    outerGlow.addColorStop(0, 'rgba(255, 250, 230, 0.15)');
    outerGlow.addColorStop(0.5, 'rgba(255, 250, 230, 0.05)');
    outerGlow.addColorStop(1, 'rgba(255, 250, 230, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();

    const moonGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    moonGradient.addColorStop(0, '#fffdf5');
    moonGradient.addColorStop(0.7, '#fdf8e8');
    moonGradient.addColorStop(1, '#e8e0c8');
    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#c8c0a8';
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.2, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + radius * 0.25, y + radius * 0.15, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawTower() {
  const centerX = canvasWidth / 2;
  const baseY = canvasHeight;
  const towerWidth = Math.min(350, canvasWidth * 0.45);
  const towerHeight = canvasHeight * 0.75;

  // Tower shadow
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000000';
  ctx.filter = 'blur(30px)';
  ctx.beginPath();
  ctx.ellipse(centerX, baseY - 20, towerWidth * 0.6, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Tower body
  const towerGradient = ctx.createLinearGradient(centerX - towerWidth / 2, 0, centerX + towerWidth / 2, 0);
  towerGradient.addColorStop(0, '#1a1210');
  towerGradient.addColorStop(0.3, '#2a1f18');
  towerGradient.addColorStop(0.5, '#352820');
  towerGradient.addColorStop(0.7, '#2a1f18');
  towerGradient.addColorStop(1, '#1a1210');

  ctx.fillStyle = towerGradient;
  ctx.beginPath();
  ctx.moveTo(centerX - towerWidth / 2.2, baseY);
  ctx.lineTo(centerX - towerWidth / 3, baseY - towerHeight);
  ctx.lineTo(centerX + towerWidth / 3, baseY - towerHeight);
  ctx.lineTo(centerX + towerWidth / 2.2, baseY);
  ctx.closePath();
  ctx.fill();

  // Texture lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const y = baseY - (i * towerHeight / 20);
    const leftX = centerX - towerWidth / 2.2 + (i * towerWidth / 60);
    const rightX = centerX + towerWidth / 2.2 - (i * towerWidth / 60);
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.lineTo(rightX, y);
    ctx.stroke();
  }

  // Roof
  const roofGradient = ctx.createLinearGradient(0, baseY - towerHeight - 80, 0, baseY - towerHeight);
  roofGradient.addColorStop(0, '#1a0f0a');
  roofGradient.addColorStop(1, '#0d0805');
  ctx.fillStyle = roofGradient;
  ctx.beginPath();
  ctx.moveTo(centerX - towerWidth / 2.8, baseY - towerHeight);
  ctx.lineTo(centerX, baseY - towerHeight - 80);
  ctx.lineTo(centerX + towerWidth / 2.8, baseY - towerHeight);
  ctx.closePath();
  ctx.fill();

  // Roof edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - towerWidth / 2.8, baseY - towerHeight);
  ctx.lineTo(centerX, baseY - towerHeight - 80);
  ctx.stroke();
}

function drawWindow() {
  const centerX = canvasWidth / 2;
  const baseY = canvasHeight;
  const towerHeight = canvasHeight * 0.75;
  const windowY = baseY - towerHeight * 0.55;
  const windowWidth = Math.min(120, canvasWidth * 0.15);
  const windowHeight = Math.min(140, canvasHeight * 0.18);

  // Glow
  const glowSize = windowWidth * 2;
  const windowGlow = ctx.createRadialGradient(centerX, windowY + windowHeight / 2, 0, centerX, windowY + windowHeight / 2, glowSize);
  windowGlow.addColorStop(0, 'rgba(255, 190, 100, 0.4)');
  windowGlow.addColorStop(0.4, 'rgba(255, 160, 80, 0.15)');
  windowGlow.addColorStop(1, 'rgba(255, 140, 60, 0)');
  ctx.fillStyle = windowGlow;
  ctx.beginPath();
  ctx.arc(centerX, windowY + windowHeight / 2, glowSize, 0, Math.PI * 2);
  ctx.fill();

  // Frame outer
  ctx.fillStyle = '#4a3525';
  ctx.beginPath();
  ctx.roundRect(centerX - windowWidth / 2, windowY, windowWidth, windowHeight, [windowWidth / 2, windowWidth / 2, 8, 8]);
  ctx.fill();

  // Frame inner
  ctx.fillStyle = '#5d4435';
  ctx.beginPath();
  ctx.roundRect(centerX - windowWidth / 2 + 6, windowY + 6, windowWidth - 12, windowHeight - 12, [windowWidth / 2, windowWidth / 2, 4, 4]);
  ctx.fill();

  // Light / glass
  const lightGradient = ctx.createRadialGradient(
    centerX, windowY + windowHeight / 3, 0,
    centerX, windowY + windowHeight / 2, windowWidth / 2
  );
  lightGradient.addColorStop(0, '#ffe5b8');
  lightGradient.addColorStop(0.5, '#ffb870');
  lightGradient.addColorStop(1, '#ff9850');
  ctx.fillStyle = lightGradient;
  ctx.beginPath();
  ctx.roundRect(centerX - windowWidth / 2 + 10, windowY + 10, windowWidth - 20, windowHeight - 20, [windowWidth / 2, windowWidth / 2, 4, 4]);
  ctx.fill();

  // Divider
  ctx.strokeStyle = 'rgba(74, 53, 37, 0.8)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, windowY + 10);
  ctx.lineTo(centerX, windowY + windowHeight - 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(centerX - windowWidth / 2 + 10, windowY + windowHeight / 2);
  ctx.lineTo(centerX + windowWidth / 2 - 10, windowY + windowHeight / 2);
  ctx.stroke();

  // Reflection
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX - windowWidth / 4, windowY + windowHeight / 4, windowWidth / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStudyRoom() {
  const centerX = canvasWidth / 2;
  const roomY = canvasHeight * 0.65;
  const deskWidth = Math.min(280, canvasWidth * 0.35);

  // Desk
  const deskGradient = ctx.createLinearGradient(0, roomY, 0, roomY + 60);
  deskGradient.addColorStop(0, '#6b4a32');
  deskGradient.addColorStop(0.3, '#5d3f2a');
  deskGradient.addColorStop(1, '#3d2818');

  ctx.fillStyle = deskGradient;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.roundRect(centerX - deskWidth / 2, roomY, deskWidth, 60, 8);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Desk top highlight
  ctx.fillStyle = 'rgba(139, 106, 79, 0.3)';
  ctx.beginPath();
  ctx.roundRect(centerX - deskWidth / 2, roomY, deskWidth, 8, [8, 8, 0, 0]);
  ctx.fill();

  // Book
  bookFloat = Math.sin(time * 0.001) * 3;
  const bookY = roomY + 20 + bookFloat;

  // Shadow under book
  ctx.save();
  ctx.globalAlpha = 0.2 - bookFloat * 0.02;
  ctx.fillStyle = '#000000';
  ctx.filter = 'blur(8px)';
  ctx.beginPath();
  ctx.ellipse(centerX - 40, roomY + 40, 45, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Left page
  ctx.fillStyle = '#f9f3e8';
  ctx.beginPath();
  ctx.roundRect(centerX - 85, bookY - 10, 80, 60, [4, 0, 0, 4]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(139, 106, 79, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - 85, bookY - 10, 80, 60);

  // Right page
  ctx.fillStyle = '#f5ead8';
  ctx.beginPath();
  ctx.roundRect(centerX + 5, bookY - 10, 80, 60, [0, 4, 4, 0]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(139, 106, 79, 0.2)';
  ctx.strokeRect(centerX + 5, bookY - 10, 80, 60);

  // Text lines
  ctx.strokeStyle = 'rgba(100, 80, 60, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(centerX - 78, bookY + i * 8);
    ctx.lineTo(centerX - 15, bookY + i * 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + 12, bookY + i * 8);
    ctx.lineTo(centerX + 75, bookY + i * 8);
    ctx.stroke();
  }

  // Book glow
  const bookGlow = ctx.createRadialGradient(centerX - 40, bookY + 20, 0, centerX - 40, bookY + 20, 80);
  bookGlow.addColorStop(0, 'rgba(200, 160, 255, 0.15)');
  bookGlow.addColorStop(1, 'rgba(200, 160, 255, 0)');
  ctx.fillStyle = bookGlow;
  ctx.beginPath();
  ctx.arc(centerX - 40, bookY + 20, 80, 0, Math.PI * 2);
  ctx.fill();

  // Ink bottle
  const inkX = centerX + 90;
  const inkY = roomY + 25;

  ctx.fillStyle = '#1a0f2e';
  ctx.beginPath();
  ctx.roundRect(inkX, inkY, 24, 30, [2, 2, 6, 6]);
  ctx.fill();

  ctx.fillStyle = '#2d1850';
  ctx.beginPath();
  ctx.roundRect(inkX + 6, inkY - 6, 12, 8, [3, 3, 0, 0]);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#7b5adc';
  ctx.beginPath();
  ctx.arc(inkX + 8, inkY + 10, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Quill
  ctx.save();
  ctx.strokeStyle = '#d4a574';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(inkX + 30, inkY + 20);
  ctx.quadraticCurveTo(inkX + 45, inkY + 10, inkX + 55, inkY);
  ctx.stroke();

  ctx.fillStyle = '#8b7355';
  ctx.beginPath();
  ctx.moveTo(inkX + 55, inkY);
  ctx.lineTo(inkX + 50, inkY + 6);
  ctx.lineTo(inkX + 58, inkY + 4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(212, 165, 116, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    const px = inkX + 30 + t * 25;
    const py = inkY + 20 - t * 20;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 5, py + 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCandles() {
  candleFlames.forEach((candle, index) => {
    const flicker = Math.sin(time * 0.003 + index * 2) * 2;

    // Glow
    const glowSize = 60 + flicker * 5;
    const candleGlow = ctx.createRadialGradient(candle.x, candle.y - 15, 0, candle.x, candle.y - 15, glowSize);
    candleGlow.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
    candleGlow.addColorStop(0.5, 'rgba(255, 160, 80, 0.15)');
    candleGlow.addColorStop(1, 'rgba(255, 140, 60, 0)');
    ctx.fillStyle = candleGlow;
    ctx.beginPath();
    ctx.arc(candle.x, candle.y - 15, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const candleGradient = ctx.createLinearGradient(candle.x - 10, 0, candle.x + 10, 0);
    candleGradient.addColorStop(0, '#e8ddc4');
    candleGradient.addColorStop(0.5, '#f4f0e7');
    candleGradient.addColorStop(1, '#d0c2a4');
    ctx.fillStyle = candleGradient;
    ctx.beginPath();
    ctx.roundRect(candle.x - 10, candle.y, 20, 50, [2, 2, 4, 4]);
    ctx.fill();

    // Wax drip
    ctx.fillStyle = 'rgba(232, 221, 196, 0.8)';
    ctx.beginPath();
    ctx.ellipse(candle.x - 5, candle.y + 10, 3, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Flame
    const flameHeight = 20 + flicker;
    const flameY = candle.y - flameHeight;

    const flameGradient = ctx.createRadialGradient(candle.x, flameY + 10, 0, candle.x, flameY + 5, 12);
    flameGradient.addColorStop(0, '#fffdf5');
    flameGradient.addColorStop(0.3, '#ffe5b8');
    flameGradient.addColorStop(0.6, '#ffb870');
    flameGradient.addColorStop(1, 'rgba(255, 107, 53, 0)');

    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.ellipse(candle.x, flameY + 10, 8, flameHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8 + Math.sin(time * 0.005 + index) * 0.2;
    ctx.beginPath();
    ctx.ellipse(candle.x, flameY + 12, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Smoke particles
    if (state.particlesEnabled && Math.random() < 0.15) {
      particles.push(new Particle(candle.x + (Math.random() - 0.5) * 6, flameY));
    }
  });
}

// Vignette that responds to cozyScore
function drawVignette() {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight * 0.65;
  const radius = Math.max(canvasWidth, canvasHeight) * 0.8;

  const maxScore = 150;
  const t = Math.max(0, Math.min(1, state.cozyScore / maxScore));

  // Dark edges
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const darkGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.25, centerX, centerY, radius);
  darkGrad.addColorStop(0, `rgba(0, 0, 0, ${0.2 * (1 - t)})`);
  darkGrad.addColorStop(1, `rgba(0, 0, 0, ${0.75 + 0.1 * t})`);
  ctx.fillStyle = darkGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.restore();

  // Warm inner glow (stronger with cozyScore)
  ctx.save();
  ctx.globalAlpha = 0.25 * t;
  const warmGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.6);
  warmGrad.addColorStop(0, 'rgba(255, 200, 150, 0.7)');
  warmGrad.addColorStop(1, 'rgba(255, 200, 150, 0)');
  ctx.fillStyle = warmGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.restore();
}

function drawParticles() {
  if (!state.particlesEnabled) {
    particles = [];
    return;
  }

  particles = particles.filter(p => !p.isDead());
  particles.forEach(p => {
    p.update();

    ctx.save();
    ctx.globalAlpha = p.life * 0.8;

    const particleGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
    const outerColor = p.color.includes('0.8') ? p.color.replace('0.8', '0') : p.color;
    particleGlow.addColorStop(0, p.color);
    particleGlow.addColorStop(1, outerColor);
    ctx.fillStyle = particleGlow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.celebrate ? p.color : '#fffdf5';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

// Animation loop
function animate() {
  time++;

  drawBackground();
  drawStars();
  drawMoon();
  drawTower();
  drawWindow();
  drawStudyRoom();
  drawCandles();
  drawVignette();
  drawParticles();

  requestAnimationFrame(animate);
}

// Initialize
window.addEventListener('load', init);
