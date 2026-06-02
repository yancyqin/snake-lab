import { PLAYER_COLORS, POINTS_PER_FOOD, FUNNY_NAMES } from './constants.js';
import { Renderer } from './render.js';

const params = new URLSearchParams(location.search);
const roomFromUrl = params.get('room');

if (roomFromUrl) {
  startGame(roomFromUrl);
} else {
  startLobby();
}

// ============ LOBBY ============

function startLobby() {
  document.getElementById('lobby').classList.remove('hidden');
  document.getElementById('gameScreen').classList.add('hidden');

  // Random funny default name if there's no saved one yet — kid can edit
  let savedName = sessionStorage.getItem('snakeName');
  if (!savedName) {
    savedName = randomFunnyName();
    sessionStorage.setItem('snakeName', savedName);
  }
  const savedColor = sessionStorage.getItem('snakeColor') || PLAYER_COLORS[0];

  const nameInput     = document.getElementById('nameInput');
  const colorPicker   = document.getElementById('colorPicker');
  const roomList      = document.getElementById('roomList');
  const createBtn     = document.getElementById('createRoomBtn');
  const teacherToggle = document.getElementById('teacherToggle');

  // Teacher mode is one of several room settings (future: fog, king, ...).
  // Each is an orthogonal checkbox. Selected = applied when CREATING a room.
  teacherToggle.checked = sessionStorage.getItem('teacherMode') === '1';
  function applySettingsUI() {
    teacherToggle.closest('.setting-row').classList.toggle('checked', teacherToggle.checked);
  }
  applySettingsUI();
  teacherToggle.addEventListener('change', () => {
    sessionStorage.setItem('teacherMode', teacherToggle.checked ? '1' : '0');
    applySettingsUI();
  });

  nameInput.value = savedName;
  nameInput.addEventListener('input', () => {
    sessionStorage.setItem('snakeName', nameInput.value);
  });

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
      li.textContent = 'No rooms yet — tap Create to start one';
      roomList.appendChild(li);
      return;
    }
    for (const r of list) {
      const li = document.createElement('li');
      const full = r.players >= r.max;
      const badge = r.hasHost ? '<span class="room-mode">👨‍🏫 TEACHER</span>' : '';
      li.innerHTML = `
        <span class="room-name">${badge}${escapeHtml(r.name)}</span>
        <span style="display:flex; gap:10px; align-items:center;">
          <span class="room-count${full ? ' full' : ''}">${r.players}/${r.max}</span>
          <button ${full ? 'class="disabled" disabled' : ''} data-room="${escapeHtml(r.name)}">${full ? 'Full' : 'Join'}</button>
        </span>`;
      const btn = li.querySelector('button');
      // Joining an existing room is always as a player. Host slot was claimed at room creation.
      if (!full) btn.addEventListener('click', () => joinRoom(r.name, false));
      roomList.appendChild(li);
    }
  }
  refreshRooms();
  const refreshTimer = setInterval(refreshRooms, 3000);

  createBtn.addEventListener('click', () => {
    joinRoom(randomRoomName(), teacherToggle.checked);
  });

  function joinRoom(roomName, asHost = false) {
    clearInterval(refreshTimer);
    const url = new URL(location.href);
    url.searchParams.set('room', roomName);
    if (asHost) url.searchParams.set('host', '1');
    location.href = url.toString();
  }
}

function randomRoomName() {
  const adj = ['fast', 'snappy', 'happy', 'fuzzy', 'sneaky', 'bouncy', 'shiny', 'cosmic'];
  const n = ['cobra', 'viper', 'mamba', 'python', 'asp', 'boa', 'adder', 'racer'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  return `${pick(adj)}-${pick(n)}`;
}

function randomFunnyName() {
  return FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)];
}

// ============ GAME ============

function startGame(room) {
  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');

  const cleanRoom = (room || 'lobby').slice(0, 32);
  document.getElementById('roomName').textContent = cleanRoom;

  const name  = sessionStorage.getItem('snakeName')  || '';
  const color = sessionStorage.getItem('snakeColor') || PLAYER_COLORS[0];

  // host=1 in the URL → this connection wants the host slot (claimed by first connection only)
  const urlParams = new URLSearchParams(location.search);
  const requestedHost = urlParams.get('host') === '1';

  const qs = new URLSearchParams({ room: cleanRoom });
  if (name)  qs.set('name', name);
  if (color) qs.set('color', color);
  if (requestedHost) qs.set('host', '1');
  const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${wsProto}://${location.host}?${qs.toString()}`;

  const canvas   = document.getElementById('game');
  const minimap  = document.getElementById('minimap');
  const scoreEl  = document.getElementById('scoreboard');
  const statusEl = document.getElementById('status');

  const renderer = new Renderer(canvas, minimap);

  let myId = null;
  let isHost = false;
  let paused = false;
  let tickRate = 130;
  let lastState = null;
  let prevSnakes = null;
  const popups = [];

  // ---- Host UI elements ----
  const hostPanel     = document.getElementById('hostPanel');
  const pausedBanner  = document.getElementById('pausedBanner');
  const pauseBtn      = document.getElementById('pauseBtn');
  const tickRateLabel = document.getElementById('tickRateLabel');

  function applyModeUI() {
    hostPanel.classList.toggle('hidden', !isHost);
    pausedBanner.classList.toggle('hidden', !paused || isHost);
    pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
    tickRateLabel.textContent = `${tickRate}ms`;
  }

  function sendHostMsg(type, extra = {}) {
    if (!isHost || ws.readyState !== 1) return;
    ws.send(JSON.stringify({ type, ...extra }));
  }
  pauseBtn.addEventListener('click', () => sendHostMsg(paused ? 'resume' : 'pause'));
  document.getElementById('stepBtn').addEventListener('click', () => sendHostMsg('step'));
  document.getElementById('slowBtn').addEventListener('click', () => sendHostMsg('setTickRate', { ms: Math.min(1500, tickRate + 70) }));
  document.getElementById('fastBtn').addEventListener('click', () => sendHostMsg('setTickRate', { ms: Math.max(60,   tickRate - 30) }));
  document.getElementById('resetBtn').addEventListener('click', () => sendHostMsg('reset'));

  const ws = new WebSocket(wsUrl);
  ws.onopen = () => setStatus('Connecting...', 'info');

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'welcome') {
      myId = msg.playerId;
      isHost   = !!msg.isHost;
      paused   = !!msg.paused;
      tickRate =  msg.tickRate || 130;
      applyModeUI();
      setStatus('', '');
    } else if (msg.type === 'modeChange') {
      if (typeof msg.paused === 'boolean')   paused = msg.paused;
      if (typeof msg.tickRate === 'number')  tickRate = msg.tickRate;
      applyModeUI();
    } else if (msg.type === 'rejected') {
      alert(msg.reason === 'full' ? 'This room is full (8/8). Pick another.' : 'Could not join.');
      location.href = '/';
    } else if (msg.type === 'state') {
      // Detect eats: snake whose body grew since last tick
      if (prevSnakes) {
        const prevById = new Map(prevSnakes.map(s => [s.id, s]));
        for (const ns of msg.snakes) {
          const ps = prevById.get(ns.id);
          if (ps && ns.body.length > ps.body.length && ns.alive) {
            popups.push({
              cellX: ns.body[0].x,
              cellY: ns.body[0].y,
              text: `+${POINTS_PER_FOOD}`,
              color: ns.color,
              startTime: performance.now(),
            });
          }
        }
      }
      lastState = msg;
      prevSnakes = msg.snakes.map(s => ({ id: s.id, body: s.body.slice(), alive: s.alive }));
      updateScoreboard(msg.scores, msg.snakes);
    } else if (msg.type === 'roundOver') {
      showRoundOver(msg.winner);
    } else if (msg.type === 'restartCountdown') {
      const secs = Math.round((msg.delay || 5000) / 1000);
      const who = msg.joiner || 'A new player';
      setStatus(`${who} joined! New round in ${secs}s...`, 'info');
      setTimeout(() => setStatus('', ''), msg.delay);
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
        ? `<span class="label">${Math.round(s.smartness * 100)}%</span>`
        : '';
      el.innerHTML = `<span class="name-cell">${escapeHtml(s.name)}</span>${smart}<strong>${s.score}</strong>`;
      scoreEl.appendChild(el);
    }
  }

  // RAF loop — keeps food pulsing and popups animating between state arrivals
  function loop() {
    const now = performance.now();
    // Drop popups older than their lifetime
    while (popups.length && now - popups[0].startTime > 900) popups.shift();
    if (lastState) renderer.draw(lastState, myId, popups, now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

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

  document.getElementById('leaveBtn').addEventListener('click', () => {
    ws.close();
    location.href = '/';
  });

  window.snakeArena = { ws, get state() { return lastState; }, get myId() { return myId; } };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
