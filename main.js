// main.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
window.onresize = resize;

// Global game state
window.Game = {};
Game.state = {
  room: 'library',
  ink: 0,
  wisdom: 0,
  upgrades: {},
  furniture: [],
  familiars: [],
  avatar: null
};
Game.lastTime = 0;

// Main loop
function loop(ts) {
  const dt = (ts - Game.lastTime) / 1000;
  Game.lastTime = ts;
  Renderer.draw(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- INIT SYSTEMS ---
Rooms.load('library');
Familiars.spawn('cat');
Avatar.init();
UI.init();
Idle.init();
DragDrop.init(); // 👈 hook furniture into the game

// --- INPUT HANDLING (mouse + touch) ---

function getCanvasCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;

  if (evt.touches && evt.touches.length > 0) {
    clientX = evt.touches[0].clientX;
    clientY = evt.touches[0].clientY;
  } else {
    clientX = evt.clientX;
    clientY = evt.clientY;
  }

  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  return { x, y };
}

// Mouse
canvas.addEventListener('mousedown', (e) => {
  const { x, y } = getCanvasCoords(e);
  DragDrop.onPointerDown(x, y);
});

canvas.addEventListener('mousemove', (e) => {
  const { x, y } = getCanvasCoords(e);
  DragDrop.onPointerMove(x, y);
});

canvas.addEventListener('mouseup', () => {
  DragDrop.onPointerUp();
});

canvas.addEventListener('mouseleave', () => {
  DragDrop.onPointerUp();
});

// Touch
canvas.addEventListener('touchstart', (e) => {
  const { x, y } = getCanvasCoords(e);
  DragDrop.onPointerDown(x, y);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  const { x, y } = getCanvasCoords(e);
  DragDrop.onPointerMove(x, y);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => {
  DragDrop.onPointerUp();
});
