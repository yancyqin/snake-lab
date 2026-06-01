import { PLAYER_COLORS } from './constants.js';
import { Renderer } from './render.js';

const params = new URLSearchParams(location.search);
const roomFromUrl = params.get('room');

// ---- Pick screen based on URL ----
if (roomFromUrl) {
  startGame(roomFromUrl);
} else {
  startLobby();
}

// ============ LOBBY ============

function startLobby() {
  document.getElementById('lobby').classList.remove('hidden');
  document.getElementById('gameScreen').classList.add('hidden');

  // Restore name + color from sessionStorage if present
  const savedName  = sessionStorage.getItem('snakeName')  || '';
  const savedColor = sessionStorage.getItem('snakeColor') || PLAYER_COLORS[0];

  const nameInput   = document.getElementById('nameInput');
  const colorPicker = document.getElementById('colorPicker');
  const roomList    = document.getElementById('roomList');
  const newRoomInput= document.getElementById('newRoomInput');
  const createBtn   = document.getElementById('createRoomBtn');

  nameInput.value = savedName;
  nameInput.addEventListener('input', () => {
    sessionStorage.setItem('snakeName', nameInput.value);
  });

  // Build color swatches
  let selectedColor = savedColor;
  function renderSwatches() {
    colorPicker.innerHTML = '';
    for (const c of PLAYER_COLORS) {
      const sw = document.createElement('button');
      sw.className = 'color-swatch' + (c === selectedColor ? ' selected' : '');
      sw.style.background = c;
      sw.title = c;
      sw.addEventListener('click', () => {
        selectedColor = c;
        sessionStorage.setItem('snakeColor', c);
        renderSwatches();
      });
      colorPicker.appendChild(sw);
    }
  }
  renderSwatches();

  // Fetch rooms + re-fetch every 3s
  async function refreshRooms() {
    try {
      const res = await fetch('/api/rooms');
      const list = await res.json();
      renderRoomList(list);
    } catch (e) { /* ignore */ }
  }
  function renderRoomList(list) {
    roomList.innerHTML = '';
    if (list.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No rooms yet — create one below';
      roomList.appendChild(li);
      return;
    }
    for (const r of list) {
      const li = document.createElement('li');
      const full = r.players >= r.max;
      li.innerHTML = `
        <span class="room-name">${escapeHtml(r.name)}</span>
        <span style="display:flex; gap:10px; align-items:center;">
          <span class="room-count${full ? ' full' : ''}">${r.players}/${r.max}</span>
          <button ${full ? 'class="disabled" disabled' : ''} data-room="${escapeAttr(r.name)}">${full ? 'Full' : 'Join'}</button>
        </span>`;
      const btn = li.querySelector('button');
      if (!full) btn.addEventListener('click', () => joinRoom(r.name));
      roomList.appendChild(li);
    }
  }
  refreshRooms();
  const refreshTimer = setInterval(refreshRooms, 3000);

  createBtn.addEventListener('click', () => {
    const name = sanitizeRoomName(newRoomInput.value) || randomRoomName();
    joinRoom(name);
  });
  newRoomInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createBtn.click();
  });

  function joinRoom(roomName) {
    clearInterval(refreshTimer);
    const url = new URL(location.href);
    url.searchParams.set('room', roomName);
    location.href = url.toString();
  }
}

function sanitizeRoomName(s) {
  return (s || '').replace(/[^\p{L}\p{N}_\-]/gu, '').slice(0, 20);
}
function randomRoomName() {
  const adj = ['fast', 'snappy', 'happy', 'fuzzy', 'sneaky', 'bouncy', 'shiny', 'cosmic'];
  const n = ['cobra', 'viper', 'mamba', 'python', 'asp', 'boa', 'adder', 'racer'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  return `${pick(adj)}-${pick(n)}`;
}

// ============ GAME ============

function startGame(room) {
  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');

  const cleanRoom = (room || 'lobby').slice(0, 32);
  document.getElementById('roomName').textContent = cleanRoom;

  const name  = sessionStorage.getItem('snakeName')  || '';
  const color = sessionStorage.getItem('snakeColor') || PLAYER_COLORS[0];

  const qs = new URLSearchParams({ room: cleanRoom });
  if (name)  qs.set('name', name);
  if (color) qs.set('color', color);
  const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${wsProto}://${location.host}?${qs.toString()}`;

  const canvas   = document.getElementById('game');
  const minimap  = document.getElementById('minimap');
  const scoreEl  = document.getElementById('scoreboard');
  const statusEl = document.getElementById('status');

  const renderer = new Renderer(canvas, minimap);

  let myId = null;
  let lastState = null;
  let obstacles = [];   // sent once on welcome

  const ws = new WebSocket(wsUrl);
  ws.onopen = () => setStatus('Connecting...', 'info');

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'welcome') {
      myId = msg.playerId;
      obstacles = msg.obstacles || [];
      setStatus('', '');
    } else if (msg.type === 'rejected') {
      const reason = msg.reason === 'full' ? 'This room is full (8/8). Pick another.' : 'Could not join.';
      alert(reason);
      location.href = '/';
    } else if (msg.type === 'state') {
      lastState = msg;
      renderer.draw(msg, myId, obstacles);
      updateScoreboard(msg.scores, msg.snakes);
    } else if (msg.type === 'roundOver') {
      showRoundOver(msg.winner);
    }
  };

  ws.onerror = () => setStatus('Connection error. Refresh to retry.', 'lose');
  ws.onclose = (e) => {
    if (e.code === 4001) {
      alert('Room is full (8/8). Pick another.');
      location.href = '/';
    } else {
      setStatus('Disconnected. Refresh to retry.', 'lose');
    }
  };

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

  function updateScoreboard(scores, snakes) {
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

  // Input
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
    if (Math.abs(dx) > Math.abs(dy)) sendDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    else                              sendDirection(dy > 0 ? 'DOWN' : 'UP');
  }, { passive: false });

  // Leave button
  document.getElementById('leaveBtn').addEventListener('click', () => {
    ws.close();
    location.href = '/';
  });

  // Expose for DevTools
  window.snakeArena = { ws, get state() { return lastState; }, get myId() { return myId; } };
}

// ---- helpers ----
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
