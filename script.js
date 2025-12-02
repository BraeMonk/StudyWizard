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

// Modern design variables
let time = 0;
let bookFloat = 0;

// Draw functions - MODERN CLEAN VERSION
function drawBackground() {
  const timeColors = getTimeColors();
  
  // Smooth gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, timeColors.sky[0]);
  gradient.addColorStop(0.4, timeColors.sky[1]);
  gradient.addColorStop(1, timeColors.sky[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Subtle noise texture overlay
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
      
      // Star glow
      const starGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      starGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
      starGlow.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
      starGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = starGlow;
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Star core
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
    
    // Moon outer glow
    const outerGlow = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 3);
    outerGlow.addColorStop(0, 'rgba(255, 250, 230, 0.15)');
    outerGlow.addColorStop(0.5, 'rgba(255, 250, 230, 0.05)');
    outerGlow.addColorStop(1, 'rgba(255, 250, 230, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon body
    const moonGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    moonGradient.addColorStop(0, '#fffdf5');
    moonGradient.addColorStop(0.7, '#fdf8e8');
    moonGradient.addColorStop(1, '#e8e0c8');
    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon craters (subtle)
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
  
  // Tower body with gradient
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
  
  // Tower texture lines (stone blocks)
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
  
  // Tower roof
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
  
  // Roof edge highlight
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
  
  // Window warm glow (large)
  const glowSize = windowWidth * 2;
  const windowGlow = ctx.createRadialGradient(centerX, windowY + windowHeight / 2, 0, centerX, windowY + windowHeight / 2, glowSize);
  windowGlow.addColorStop(0, 'rgba(255, 190, 100, 0.4)');
  windowGlow.addColorStop(0.4, 'rgba(255, 160, 80, 0.15)');
  windowGlow.addColorStop(1, 'rgba(255, 140, 60, 0)');
  ctx.fillStyle = windowGlow;
  ctx.beginPath();
  ctx.arc(centerX, windowY + windowHeight / 2, glowSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Window frame (arched)
  ctx.fillStyle = '#4a3525';
  ctx.beginPath();
  ctx.roundRect(centerX - windowWidth / 2, windowY, windowWidth, windowHeight, [windowWidth / 2, windowWidth / 2, 8, 8]);
  ctx.fill();
  
  // Window inner frame
  ctx.fillStyle = '#5d4435';
  ctx.beginPath();
  ctx.roundRect(centerX - windowWidth / 2 + 6, windowY + 6, windowWidth - 12, windowHeight - 12, [windowWidth / 2, windowWidth / 2, 4, 4]);
  ctx.fill();
  
  // Window light (warm amber glow)
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
  
  // Window divider (cross)
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
  
  // Subtle window reflection
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
  
  // Desk with depth
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
  
  // Open book on desk (floating slightly)
  bookFloat = Math.sin(time * 0.001) * 3;
  const bookY = roomY + 20 + bookFloat;
  
  // Book shadow
  ctx.save();
  ctx.globalAlpha = 0.2 - bookFloat * 0.02;
  ctx.fillStyle = '#000000';
  ctx.filter = 'blur(8px)';
  ctx.beginPath();
  ctx.ellipse(centerX - 40, roomY + 40, 45, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Book left page
  ctx.fillStyle = '#f9f3e8';
  ctx.beginPath();
  ctx.roundRect(centerX - 85, bookY - 10, 80, 60, [4, 0, 0, 4]);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(139, 106, 79, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - 85, bookY - 10, 80, 60);
  
  // Book right page
  ctx.fillStyle = '#f5ead8';
  ctx.beginPath();
  ctx.roundRect(centerX + 5, bookY - 10, 80, 60, [0, 4, 4, 0]);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(139, 106, 79, 0.2)';
  ctx.strokeRect(centerX + 5, bookY - 10, 80, 60);
  
  // Book text lines (decorative)
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
  
  // Magical glow from book
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
  
  // Ink bottle neck
  ctx.fillStyle = '#2d1850';
  ctx.beginPath();
  ctx.roundRect(inkX + 6, inkY - 6, 12, 8, [3, 3, 0, 0]);
  ctx.fill();
  
  // Ink bottle highlight
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
  
  // Quill tip
  ctx.fillStyle = '#8b7355';
  ctx.beginPath();
  ctx.moveTo(inkX + 55, inkY);
  ctx.lineTo(inkX + 50, inkY + 6);
  ctx.lineTo(inkX + 58, inkY + 4);
  ctx.closePath();
  ctx.fill();
  
  // Quill feather detail
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
    
    // Candle glow
    const glowSize = 60 + flicker * 5;
    const candleGlow = ctx.createRadialGradient(candle.x, candle.y - 15, 0, candle.x, candle.y - 15, glowSize);
    candleGlow.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
    candleGlow.addColorStop(0.5, 'rgba(255, 160, 80, 0.15)');
    candleGlow.addColorStop(1, 'rgba(255, 140, 60, 0)');
    ctx.fillStyle = candleGlow;
    ctx.beginPath();
    ctx.arc(candle.x, candle.y - 15, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Candle body
    const candleGradient = ctx.createLinearGradient(candle.x - 10, 0, candle.x + 10, 0);
    candleGradient.addColorStop(0, '#e8ddc4');
    candleGradient.addColorStop(0.5, '#f4f0e7');
    candleGradient.addColorStop(1, '#d0c2a4');
    ctx.fillStyle = candleGradient;
    ctx.beginPath();
    ctx.roundRect(candle.x - 10, candle.y, 20, 50, [2, 2, 4, 4]);
    ctx.fill();
    
    // Candle wax drip
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
    
    // Flame core
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8 + Math.sin(time * 0.005 + index) * 0.2;
    ctx.beginPath();
    ctx.ellipse(candle.x, flameY + 12, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Add particles
    if (state.particlesEnabled && Math.random() < 0.15) {
      particles.push(new Particle(candle.x + (Math.random() - 0.5) * 6, flameY));
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
    
    ctx.save();
    ctx.globalAlpha = p.life * 0.8;
    
    // Particle glow
    const particleGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
    particleGlow.addColorStop(0, p.color);
    particleGlow.addColorStop(1, p.color.replace('0.8', '0'));
    ctx.fillStyle = particleGlow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Particle core
    ctx.fillStyle = p.celebrate ? p.color : '#fffdf5';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });
}

// Animation loop - UPDATED
function animate() {
  time++;
  
  drawBackground();
  drawStars();
  drawMoon();
  drawTower();
  drawWindow();
  drawStudyRoom();
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
