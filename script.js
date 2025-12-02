// Wizard's Tower Study - Canvas + Timer PWA
const STATE_KEY = "WizardTowerStudy_v1";

// State
const state = {
  totalSessions: 0,
  todayMinutes: 0,
  lastStudyDate: null,
  streak: 0,
  timeOfDay: 'evening',
  candleCount: 3,
  soundEnabled: true,
  particlesEnabled: true
};

// Timer state
let timerMinutes = 25;
let timerSeconds = 0;
let timerRunning = false;
let timerInterval = null;

// Canvas elements
let canvas, ctx;
let canvasWidth, canvasHeight;
let particles = [];
let candleFlames = [];

// DOM elements
const timerDisplay = document.getElementById('timerDisplay');
const timerLabel = document.getElementById('timerLabel');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const totalSessionsEl = document.getElementById('totalSessions');
const todayTimeEl = document.getElementById('todayTime');
const streakEl = document.getElementById('streak');
const motivationText = document.getElementById('motivationText');
const realTimeEl = document.getElementById('realTime');
const candleSlider = document.getElementById('candleSlider');
const candleCountEl = document.getElementById('candleCount');
const soundToggle = document.getElementById('soundToggle');
const particlesToggle = document.getElementById('particlesToggle');
const aboutBtn = document.getElementById('aboutBtn');
const closeModal = document.getElementById('closeModal');
const aboutModal = document.getElementById('aboutModal');

// Motivational quotes
const quotes = [
  "The wizard studies with patience and dedication...",
  "Knowledge flows like ink across ancient parchment...",
  "Each moment of focus strengthens your magical prowess...",
  "The tower's wisdom grows with your effort...",
  "Ancient texts reveal secrets to the persistent...",
  "Your dedication illuminates the darkest mysteries...",
  "The stars align for those who seek knowledge...",
  "Magic thrives in the quiet hours of study...",
  "Concentration is the first spell to master...",
  "The tower remembers your diligence...",
  "Even the greatest wizards started with single pages...",
  "Your focus today shapes your mastery tomorrow..."
];

// Initialize
function init() {
  loadState();
  setupCanvas();
  setupEventListeners();
  updateDisplay();
  updateRealTime();
  setInterval(updateRealTime, 1000);
  animate();
  showRandomQuote();
}

// State management
function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      Object.assign(state, data);
      
      // Check if new day
      const today = new Date().toDateString();
      if (state.lastStudyDate !== today) {
        // Check if streak should continue (studied yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (state.lastStudyDate !== yesterday.toDateString()) {
          state.streak = 0; // Streak broken
        }
        state.todayMinutes = 0;
      }
      
      // Apply saved settings
      applySavedSettings();
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
}

function saveState() {
  try {
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
}

// Canvas setup
function setupCanvas() {
  canvas = document.getElementById('towerCanvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Initialize candle flames
  updateCandles();
}

function resizeCanvas() {
  canvasWidth = canvas.width = window.innerWidth;
  canvasHeight = canvas.height = window.innerHeight;
}

// Event listeners
function setupEventListeners() {
  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);
  
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      timerMinutes = parseInt(e.target.dataset.minutes);
      timerSeconds = 0;
      updateTimerDisplay();
    });
  });
  
  document.querySelectorAll('[data-time]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-time]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.timeOfDay = e.target.dataset.time;
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
  
  aboutBtn.addEventListener('click', () => {
    aboutModal.classList.add('active');
  });
  
  closeModal.addEventListener('click', () => {
    aboutModal.classList.remove('active');
  });
  
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
      aboutModal.classList.remove('active');
    }
  });
}

// Timer functions
function startTimer() {
  if (timerRunning) return;
  
  timerRunning = true;
  startBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-flex';
  timerLabel.textContent = 'Studying...';
  
  timerInterval = setInterval(() => {
    if (timerSeconds === 0) {
      if (timerMinutes === 0) {
        completeSession();
        return;
      }
      timerMinutes--;
      timerSeconds = 59;
    } else {
      timerSeconds--;
    }
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  startBtn.style.display = 'inline-flex';
  pauseBtn.style.display = 'none';
  timerLabel.textContent = 'Paused';
}

function resetTimer() {
  pauseTimer();
  timerMinutes = parseInt(document.querySelector('.preset-btn.active').dataset.minutes);
  timerSeconds = 0;
  timerLabel.textContent = 'Ready to Study';
  updateTimerDisplay();
}

function completeSession() {
  pauseTimer();
  
  // Update stats
  const sessionMinutes = parseInt(document.querySelector('.preset-btn.active').dataset.minutes);
  state.totalSessions++;
  state.todayMinutes += sessionMinutes;
  
  const today = new Date().toDateString();
  if (state.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (state.lastStudyDate === yesterday.toDateString()) {
      state.streak++;
    } else {
      state.streak = 1;
    }
    state.lastStudyDate = today;
  }
  
  saveState();
  updateDisplay();
  
  timerLabel.textContent = '✨ Session Complete! Well done, wizard!';
  showRandomQuote();
  
  // Reset for next session
  setTimeout(() => {
    resetTimer();
  }, 3000);
  
  // Celebration particles
  if (state.particlesEnabled) {
    for (let i = 0; i < 30; i++) {
      particles.push(new Particle(canvasWidth / 2, canvasHeight / 2, true));
    }
  }
}

function updateTimerDisplay() {
  const mins = String(timerMinutes).padStart(2, '0');
  const secs = String(timerSeconds).padStart(2, '0');
  timerDisplay.textContent = `${mins}:${secs}`;
}

// Display updates
function updateDisplay() {
  totalSessionsEl.textContent = state.totalSessions;
  
  const hours = Math.floor(state.todayMinutes / 60);
  const mins = state.todayMinutes % 60;
  todayTimeEl.textContent = `${hours}h ${mins}m`;
  
  streakEl.textContent = `${state.streak} day${state.streak !== 1 ? 's' : ''}`;
}

function updateRealTime() {
  const now = new Date();
  const hours = now.getHours() % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  realTimeEl.textContent = `${hours}:${minutes} ${ampm}`;
}

function showRandomQuote() {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  motivationText.textContent = quote;
}

// Canvas animation
function updateCandles() {
  candleFlames = [];
  const spacing = 80;
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
}

// Particle class
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
  
  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

// Get time of day colors
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

// Draw functions
function drawBackground() {
  const colors = getTimeColors();
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, colors.sky[0]);
  gradient.addColorStop(0.5, colors.sky[1]);
  gradient.addColorStop(1, colors.sky[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawStars() {
  const colors = getTimeColors();
  if (colors.stars > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const starCount = Math.floor(50 * colors.stars);
    for (let i = 0; i < starCount; i++) {
      const x = (i * 137.508) % canvasWidth; // golden angle
      const y = (i * 197.508) % (canvasHeight * 0.6);
      const size = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMoon() {
  const colors = getTimeColors();
  if (colors.moon) {
    const x = canvasWidth * 0.8;
    const y = canvasHeight * 0.2;
    const radius = 40;
    
    const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 250, 230, 1)');
    gradient.addColorStop(0.7, 'rgba(240, 235, 210, 0.8)');
    gradient.addColorStop(1, 'rgba(240, 235, 210, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon glow
    ctx.fillStyle = 'rgba(255, 250, 230, 0.1)';
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTower() {
  const centerX = canvasWidth / 2;
  const baseY = canvasHeight * 0.85;
  const towerWidth = Math.min(300, canvasWidth * 0.4);
  const towerHeight = canvasHeight * 0.6;
  
  // Tower body
  ctx.fillStyle = '#2a1810';
  ctx.beginPath();
  ctx.moveTo(centerX - towerWidth / 2, baseY);
  ctx.lineTo(centerX - towerWidth / 2.5, baseY - towerHeight);
  ctx.lineTo(centerX + towerWidth / 2.5, baseY - towerHeight);
  ctx.lineTo(centerX + towerWidth / 2, baseY);
  ctx.closePath();
  ctx.fill();
  
  // Tower shading
  const gradient = ctx.createLinearGradient(
    centerX - towerWidth / 2, baseY,
    centerX + towerWidth / 2, baseY
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(centerX - towerWidth / 2, baseY);
  ctx.lineTo(centerX - towerWidth / 2.5, baseY - towerHeight);
  ctx.lineTo(centerX + towerWidth / 2.5, baseY - towerHeight);
  ctx.lineTo(centerX + towerWidth / 2, baseY);
  ctx.closePath();
  ctx.fill();
  
  // Tower roof
  ctx.fillStyle = '#1a0f08';
  ctx.beginPath();
  ctx.moveTo(centerX - towerWidth / 2.2, baseY - towerHeight);
  ctx.lineTo(centerX, baseY - towerHeight - 60);
  ctx.lineTo(centerX + towerWidth / 2.2, baseY - towerHeight);
  ctx.closePath();
  ctx.fill();
  
  // Window
  const windowY = baseY - towerHeight * 0.6;
  const windowWidth = towerWidth * 0.35;
  const windowHeight = towerHeight * 0.25;
  
  // Window glow
  const windowGlow = ctx.createRadialGradient(
    centerX, windowY + windowHeight / 2, 0,
    centerX, windowY + windowHeight / 2, windowWidth
  );
  windowGlow.addColorStop(0, 'rgba(255, 180, 80, 0.4)');
  windowGlow.addColorStop(1, 'rgba(255, 180, 80, 0)');
  ctx.fillStyle = windowGlow;
  ctx.beginPath();
  ctx.arc(centerX, windowY + windowHeight / 2, windowWidth * 1.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Window frame
  ctx.fillStyle = '#8b5a3c';
  ctx.fillRect(
    centerX - windowWidth / 2,
    windowY,
    windowWidth,
    windowHeight
  );
  
  // Window panes
  ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
  ctx.fillRect(
    centerX - windowWidth / 2 + 5,
    windowY + 5,
    windowWidth - 10,
    windowHeight - 10
  );
  
  // Window cross
  ctx.fillStyle = '#5d3a22';
  ctx.fillRect(centerX - 2, windowY, 4, windowHeight);
  ctx.fillRect(
    centerX - windowWidth / 2,
    windowY + windowHeight / 2 - 2,
    windowWidth,
    4
  );
}

function drawDesk() {
  const centerX = canvasWidth / 2;
  const deskY = canvasHeight * 0.7;
  const deskWidth = 200;
  const deskHeight = 40;
  
  // Desk
  ctx.fillStyle = '#5d3a22';
  ctx.fillRect(centerX - deskWidth / 2, deskY, deskWidth, deskHeight);
  
  // Desk top
  ctx.fillStyle = '#8b5a3c';
  ctx.fillRect(centerX - deskWidth / 2, deskY, deskWidth, 8);
  
  // Papers
  ctx.fillStyle = 'rgba(245, 235, 220, 0.9)';
  ctx.fillRect(centerX - 60, deskY + 12, 50, 35);
  ctx.fillRect(centerX - 55, deskY + 10, 50, 35);
  
  // Ink bottle
  ctx.fillStyle = '#1a0a3e';
  ctx.beginPath();
  ctx.arc(centerX + 40, deskY + 25, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(centerX + 36, deskY + 18, 8, 7);
  
  // Quill
  ctx.strokeStyle = '#8b6f47';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX + 50, deskY + 30);
  ctx.lineTo(centerX + 65, deskY + 15);
  ctx.stroke();
  
  // Quill tip
  ctx.fillStyle = '#c9a86a';
  ctx.beginPath();
  ctx.moveTo(centerX + 65, deskY + 15);
  ctx.lineTo(centerX + 62, deskY + 20);
  ctx.lineTo(centerX + 68, deskY + 20);
  ctx.closePath();
  ctx.fill();
}

function drawCandles() {
  candleFlames.forEach(candle => {
    // Candle body
    ctx.fillStyle = '#f4f0e7';
    ctx.fillRect(candle.x - 6, candle.y, 12, 30);
    
    // Candle shading
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(candle.x - 6, candle.y, 3, 30);
    
    // Flame flicker
    candle.flicker += candle.speed;
    const flicker = Math.sin(candle.flicker) * 2;
    const flameHeight = 15 + flicker;
    const flameY = candle.y - flameHeight;
    
    // Flame glow
    const glowGradient = ctx.createRadialGradient(
      candle.x, flameY + 5, 0,
      candle.x, flameY + 5, 30
    );
    glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.6)');
    glowGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(candle.x, flameY + 5, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Flame
    const flameGradient = ctx.createRadialGradient(
      candle.x, flameY + flameHeight / 2, 0,
      candle.x, flameY + flameHeight / 2, 8
    );
    flameGradient.addColorStop(0, '#fff5d6');
    flameGradient.addColorStop(0.4, '#ffb347');
    flameGradient.addColorStop(1, '#ff6b35');
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.ellipse(candle.x, flameY + flameHeight / 2, 6, flameHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add particles
    if (state.particlesEnabled && Math.random() < 0.3) {
      particles.push(new Particle(candle.x, flameY));
    }
  });
}

function drawParticles() {
  if (!state.particlesEnabled) {
    particles = [];
    return;
  }
  
  particles = particles.filter(p => !p.isDead());
  particles.forEach(p => {
    p.update();
    p.draw();
  });
}

// Animation loop
function animate() {
  drawBackground();
  drawStars();
  drawMoon();
  drawTower();
  drawDesk();
  drawCandles();
  drawParticles();
  
  requestAnimationFrame(animate);
}

// Initialize on load
window.addEventListener('load', init);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}
