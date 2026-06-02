import { PLAYER_COLORS, POINTS_PER_FOOD, FUNNY_NAMES, WORLD_COLS, WORLD_ROWS } from './constants.js';
import { Renderer } from './render.js';

const DEFAULT_BOT_CODE = `// Your bot. Edit me!
// state.me   = { body: [{x,y}, ...], direction: 'UP', alive: true }
// state.food = [{x,y}, ...]
// state.others = [ { body, direction, alive }, ... ]
// state.board = { width: 60, height: 60 }
// state.tick  = number
// Return one of: 'UP', 'DOWN', 'LEFT', 'RIGHT'

function nextMove(state) {
  return 'RIGHT';
}
`;

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

  let savedName = sessionStorage.getItem('snakeName');
  if (!savedName) {
    savedName = randomFunnyName();
    sessionStorage.setItem('snakeName', savedName);
  }
  const savedColor = sessionStorage.getItem('snakeColor') || PLAYER_COLORS[0];
  const savedCode  = sessionStorage.getItem('botCode')    || DEFAULT_BOT_CODE;

  const nameInput   = document.getElementById('nameInput');
  const colorPicker = document.getElementById('colorPicker');
  const botCode     = document.getElementById('botCode');
  const roomList    = document.getElementById('roomList');
  const createBtn   = document.getElementById('createRoomBtn');

  nameInput.value = savedName;
  nameInput.addEventListener('input', () => {
    sessionStorage.setItem('snakeName', nameInput.value);
  });

  botCode.value = savedCode;
  botCode.addEventListener('input', () => {
    sessionStorage.setItem('botCode', botCode.value);
  });
  // Make Tab insert two spaces, like a code editor
  botCode.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const s = botCode.selectionStart, t = botCode.selectionEnd;
    botCode.value = botCode.value.substring(0, s) + '  ' + botCode.value.substring(t);
    botCode.selectionStart = botCode.selectionEnd = s + 2;
    sessionStorage.setItem('botCode', botCode.value);
  });

  // Sample bot buttons — fetch the .js file and paste it in
  document.querySelectorAll('.sample').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.sample;
      try {
        const res = await fetch(`/bots/${name}.js`);
        const code = await res.text();
        botCode.value = code;
        sessionStorage.setItem('botCode', code);
      } catch (e) {
        alert('Could not load sample bot: ' + e.message);
      }
    });
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
      li.innerHTML = `
        <span class="room-name">${escapeHtml(r.name)}</span>
        <span style="display:flex; gap:10px; align-items:center;">
          <span class="room-count${full ? ' full' : ''}">${r.players}/${r.max}</span>
          <button ${full ? 'class="disabled" disabled' : ''} data-room="${escapeHtml(r.name)}">${full ? 'Full' : 'Join'}</button>
        </span>`;
      const btn = li.querySelector('button');
      if (!full) btn.addEventListener('click', () => joinRoom(r.name));
      roomList.appendChild(li);
    }
  }
  refreshRooms();
  const refreshTimer = setInterval(refreshRooms, 3000);

  createBtn.addEventListener('click', () => joinRoom(randomRoomName()));

  function joinRoom(roomName) {
    clearInterval(refreshTimer);
    const url = new URL(location.href);
    url.searchParams.set('room', roomName);
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
  const code  = sessionStorage.getItem('botCode')    || DEFAULT_BOT_CODE;

  const qs = new URLSearchParams({ room: cleanRoom });
  if (name)  qs.set('name', name);
  if (color) qs.set('color', color);
  const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${wsProto}://${location.host}?${qs.toString()}`;

  const canvas      = document.getElementById('game');
  const minimap     = document.getElementById('minimap');
  const scoreEl     = document.getElementById('scoreboard');
  const statusEl    = document.getElementById('status');
  const botStatusEl = document.getElementById('botStatus');
  const botStatusLabel  = botStatusEl.querySelector('.label');
  const botStatusDetail = document.getElementById('botStatusDetail');

  const renderer = new Renderer(canvas, minimap);

  // ---- Bot harness ----
  // Wrap the user's code in a function we can call with `state`. The user's
  // code defines nextMove(state); we evaluate it once at startup so syntax
  // errors show before the game starts.
  let userBotFn = null;
  function setBotStatus(kind, label, detail) {
    botStatusEl.className = 'bot-status ' + kind;
    botStatusLabel.textContent = label;
    botStatusDetail.textContent = detail || '';
  }
  function deployBot() {
    try {
      // The user code must contain `function nextMove(state) { ... }`.
      // We append a return that invokes it, then build the Function.
      userBotFn = new Function('state', code + '\nreturn nextMove(state);');
      setBotStatus('ok', 'Bot ready', '');
    } catch (e) {
      userBotFn = null;
      setBotStatus('err', 'Syntax error', e.message);
    }
  }
  deployBot();

  function runBot(state) {
    if (!userBotFn) return;
    const me = state.snakes.find(s => s.id === myId);
    if (!me || !me.alive) return;
    const botState = {
      me: { body: me.body, direction: me.direction, alive: me.alive },
      food: state.foods,
      others: state.snakes
        .filter(s => s.id !== myId)
        .map(s => ({ body: s.body, direction: s.direction, alive: s.alive })),
      board: { width: WORLD_COLS, height: WORLD_ROWS },
      tick: state.tick,
    };
    let dir;
    try {
      dir = userBotFn(botState);
    } catch (e) {
      setBotStatus('err', 'Crashed', e.message);
      return;
    }
    if (!['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(dir)) {
      setBotStatus('err', 'Bad return', `Expected UP/DOWN/LEFT/RIGHT, got ${JSON.stringify(dir)}`);
      return;
    }
    setBotStatus('ok', `Sent: ${dir}`, `tick ${state.tick}`);
    sendDirection(dir);
  }

  // ---- Networking ----
  let myId = null;
  let lastState = null;
  let prevSnakes = null;
  const popups = [];

  const ws = new WebSocket(wsUrl);
  ws.onopen = () => setStatus('Connecting...', 'info');

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'welcome') {
      myId = msg.playerId;
      setStatus('', '');
    } else if (msg.type === 'rejected') {
      alert(msg.reason === 'full' ? 'Room is full (8/8). Pick another.' : 'Could not join.');
      location.href = '/';
    } else if (msg.type === 'state') {
      if (prevSnakes) {
        const prevById = new Map(prevSnakes.map(s => [s.id, s]));
        for (const ns of msg.snakes) {
          const ps = prevById.get(ns.id);
          if (ps && ns.body.length > ps.body.length && ns.alive) {
            popups.push({
              cellX: ns.body[0].x, cellY: ns.body[0].y,
              text: `+${POINTS_PER_FOOD}`, color: ns.color,
              startTime: performance.now(),
            });
          }
        }
      }
      lastState = msg;
      prevSnakes = msg.snakes.map(s => ({ id: s.id, body: s.body.slice(), alive: s.alive }));
      updateScoreboard(msg.scores, msg.snakes);
      // RUN THE BOT
      runBot(msg);
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
    } else if (!leaving) {
      setStatus('Disconnected. Refresh to retry.', 'lose');
    }
  };

  function setStatus(text, cls) { statusEl.textContent = text; statusEl.className = cls || ''; }

  function showRoundOver(winner) {
    const mySnake = lastState?.snakes.find(s => s.id === myId);
    if (winner && mySnake && winner === mySnake.name) {
      setStatus(`Your bot won! Next round in 3s...`, 'win');
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

  function sendDirection(dir) {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'direction', dir }));
  }

  // ---- Render loop ----
  function loop() {
    const now = performance.now();
    while (popups.length && now - popups[0].startTime > 900) popups.shift();
    if (lastState) renderer.draw(lastState, myId, popups, now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---- Leave + Edit ----
  let leaving = false;
  document.getElementById('leaveBtn').addEventListener('click', () => {
    leaving = true;
    ws.close();
    location.href = '/';
  });
  document.getElementById('editBotBtn').addEventListener('click', () => {
    leaving = true;
    ws.close();
    // Code is already in sessionStorage; lobby will pick it up
    location.href = '/';
  });

  window.snakeCoder = {
    ws,
    get state() { return lastState; },
    get myId() { return myId; },
    get botFn() { return userBotFn; },
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
