import { Renderer } from './render.js';

const params = new URLSearchParams(location.search);
const room = (params.get('room') || 'lobby').slice(0, 32);
document.getElementById('roomName').textContent = room;

const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${wsProto}://${location.host}?room=${encodeURIComponent(room)}`;

const canvas   = document.getElementById('game');
const minimap  = document.getElementById('minimap');
const scoreEl  = document.getElementById('scoreboard');
const statusEl = document.getElementById('status');

const renderer = new Renderer(canvas, minimap);

let myId = null;
let lastState = null;

const ws = new WebSocket(wsUrl);

ws.onopen = () => setStatus('Connecting...', 'info');

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'welcome') {
    myId = msg.playerId;
    setStatus('', '');
  } else if (msg.type === 'state') {
    lastState = msg;
    renderer.draw(msg, myId);
    updateScoreboard(msg.scores, msg.snakes);
  } else if (msg.type === 'roundOver') {
    showRoundOver(msg.winner);
  }
};

ws.onerror = () => setStatus('Connection error. Refresh to retry.', 'lose');
ws.onclose = () => setStatus('Disconnected. Refresh to retry.', 'lose');

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = cls || '';
}

function showRoundOver(winner) {
  const mySnake = lastState?.snakes.find(s => s.id === myId);
  if (winner && mySnake && winner === mySnake.name) {
    setStatus(`You win! Next round in 3s...`, 'win');
  } else if (winner) {
    setStatus(`${winner} wins. Next round in 3s...`, 'lose');
  } else {
    setStatus(`Round over. Next round in 3s...`, 'info');
  }
  setTimeout(() => setStatus('', ''), 3000);
}

// --- Scoreboard ---
function updateScoreboard(scores, snakes) {
  // Map snake id → alive
  const aliveMap = new Map(snakes.map(s => [s.id, s.alive]));
  scoreEl.innerHTML = '';
  const order = Object.keys(scores).sort((a, b) => scores[b].score - scores[a].score);
  for (const id of order) {
    const s = scores[id];
    const alive = aliveMap.get(id) ?? false;
    const el = document.createElement('div');
    el.className = 'scoreItem' + (id === myId ? ' me' : '') + (alive ? '' : ' dead');
    el.style.borderLeftColor = s.color;
    const smart = s.isBot && s.smartness !== undefined
      ? ` <span class="label">${Math.round(s.smartness * 100)}% smart</span>`
      : '';
    el.innerHTML = `<span>${escapeHtml(s.name)}</span><strong>${s.score}</strong>${smart}`;
    scoreEl.appendChild(el);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// --- Input ---
function sendDirection(dir) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'direction', dir }));
}

const keyMap = {
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
  W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
};
document.addEventListener('keydown', (e) => {
  const d = keyMap[e.key];
  if (!d) return;
  e.preventDefault();
  sendDirection(d);
});

let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    sendDirection(dx > 0 ? 'RIGHT' : 'LEFT');
  } else {
    sendDirection(dy > 0 ? 'DOWN' : 'UP');
  }
}, { passive: false });

// Expose for DevTools — same pattern as v1.
window.snakeArena = { ws, get state() { return lastState; }, get myId() { return myId; } };
