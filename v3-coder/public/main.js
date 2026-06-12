import { PLAYER_COLORS, POINTS_PER_FOOD, FUNNY_NAMES, WORLD_COLS, WORLD_ROWS } from './constants.js';
import { Renderer } from './render.js';
import { createEditor } from './editor.js';
import { translate } from './errors.js';

const DEFAULT_BOT_CODE = `// Your bot. Edit me!
// state.me     = { body: [{x,y}, ...], direction: 'UP', alive: true }
// state.foods  = [{x,y}, ...]
// state.others = [ { body, direction, alive }, ... ]
// state.board  = { width: 60, height: 60 }
// state.tick   = number
// Return one of: 'UP', 'DOWN', 'LEFT', 'RIGHT'

function nextMove(state) {
  return 'RIGHT';
}
`;

// 💡 hint ladder (academy pattern): one tier per click, never auto-shown.
const HINTS = [
  'Start from a sample and read it line by line. <b>Random</b> flails, <b>Greedy</b> chases food, <b>Safe</b> looks before it steps, <b>Tunable</b> mixes those ideas with weights you can tune.',
  'Survival first: before you return a direction, check the square it leads to. Off the board (<code>state.board</code>)? Inside YOUR body or someone else\'s? Then don\'t go there.',
  'Don\'t take the first safe move — score all four: closer to the nearest food = points up, danger or tight space = points down. Return the winner.',
];

function wireHints(btn, box) {
  let tier = 0;
  btn.addEventListener('click', () => {
    if (tier >= HINTS.length) return;
    box.hidden = false;
    const p = document.createElement('p');
    p.innerHTML = `💡 <b>Hint ${tier + 1}:</b> ${HINTS[tier]}`;
    box.appendChild(p);
    tier++;
    btn.textContent = tier >= HINTS.length ? '💡 That\'s every hint' : `💡 Hint (${tier}/${HINTS.length} used)`;
    if (tier >= HINTS.length) btn.disabled = true;
  });
}

// Syntax-only check — compiles the code but never runs it, so a half-typed
// line can't hang the page. "Is nextMove defined?" is checked at deploy time.
function checkSyntax(code) {
  try { new Function(code); return null; }
  catch (e) { return translate(e); }
}

// Friendly error first, raw truth in small print (academy style).
function showLint(el, err) {
  el.textContent = '';
  if (!err) return;
  const f = document.createElement('span');
  f.className = 'friendly';
  f.textContent = err.friendly;
  const r = document.createElement('span');
  r.className = 'raw';
  r.textContent = err.raw;
  el.append(f, r);
}

const params = new URLSearchParams(location.search);
const roomFromUrl = params.get('room');

if (roomFromUrl) {
  startGame(roomFromUrl);
} else {
  startLobby();
}

// ============ LOBBY ============

async function startLobby() {
  document.getElementById('lobby').classList.remove('hidden');
  document.getElementById('gameScreen').classList.add('hidden');

  let savedName = sessionStorage.getItem('snakeName');
  if (!savedName) {
    savedName = randomFunnyName();
    sessionStorage.setItem('snakeName', savedName);
  }
  const savedColor = sessionStorage.getItem('snakeColor') || PLAYER_COLORS[0];
  const savedCode  = sessionStorage.getItem('botCode')    || DEFAULT_BOT_CODE;

  const nameInput     = document.getElementById('nameInput');
  const colorPicker   = document.getElementById('colorPicker');
  const roomList      = document.getElementById('roomList');
  const createBtn     = document.getElementById('createRoomBtn');
  const teacherToggle = document.getElementById('teacherToggle');
  const kingToggle    = document.getElementById('kingToggle');
  const fogToggle     = document.getElementById('fogToggle');
  const botCodePanel  = document.getElementById('botCodePanel');

  // Room settings — orthogonal checkboxes. Each applies at room CREATION.
  // Teacher → no bot, host controls. Bot code panel hides.
  teacherToggle.checked = sessionStorage.getItem('teacherMode') === '1';
  kingToggle.checked    = sessionStorage.getItem('kingMode')    === '1';
  fogToggle.checked     = sessionStorage.getItem('fogMode')     === '1';
  function applySettingsUI() {
    teacherToggle.closest('.setting-row').classList.toggle('checked', teacherToggle.checked);
    kingToggle.closest('.setting-row').classList.toggle('checked', kingToggle.checked);
    fogToggle.closest('.setting-row').classList.toggle('checked', fogToggle.checked);
    botCodePanel.classList.toggle('hidden', teacherToggle.checked);
  }
  applySettingsUI();
  teacherToggle.addEventListener('change', () => {
    sessionStorage.setItem('teacherMode', teacherToggle.checked ? '1' : '0');
    applySettingsUI();
  });
  kingToggle.addEventListener('change', () => {
    sessionStorage.setItem('kingMode', kingToggle.checked ? '1' : '0');
    applySettingsUI();
  });
  fogToggle.addEventListener('change', () => {
    sessionStorage.setItem('fogMode', fogToggle.checked ? '1' : '0');
    applySettingsUI();
  });

  nameInput.value = savedName;
  nameInput.addEventListener('input', () => {
    sessionStorage.setItem('snakeName', nameInput.value);
  });

  // The academy editor: CodeMirror when the CDN answers, a textarea offline.
  // Every keystroke saves; after a pause we compile-check and show a kid-
  // friendly message under the editor.
  const lintEl = document.getElementById('lobbyLint');
  let lintTimer = null;
  const editor = await createEditor(document.getElementById('botCodeHost'), savedCode, () => {
    sessionStorage.setItem('botCode', editor.get());
    clearTimeout(lintTimer);
    lintTimer = setTimeout(() => showLint(lintEl, checkSyntax(editor.get())), 600);
  });
  wireHints(document.getElementById('lobbyHintBtn'), document.getElementById('lobbyHintBox'));

  // Sample bot buttons — fetch the .js file and paste it in
  document.querySelectorAll('#botCodePanel .sample').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.sample;
      try {
        const res = await fetch(`/bots/${name}.js`);
        const code = await res.text();
        editor.set(code);
        sessionStorage.setItem('botCode', code);
        showLint(lintEl, null);
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
      const badges =
        (r.hasHost  ? '<span class="room-mode">👨‍🏫</span>' : '') +
        (r.kingMode ? '<span class="room-mode">👑</span>'   : '') +
        (r.fogMode  ? '<span class="room-mode">🌫️</span>'  : '');
      li.innerHTML = `
        <span class="room-name">${badges}${escapeHtml(r.name)}</span>
        <span style="display:flex; gap:10px; align-items:center;">
          <span class="room-count${full ? ' full' : ''}">${r.players}/${r.max}</span>
          <button ${full ? 'class="disabled" disabled' : ''} data-room="${escapeHtml(r.name)}">${full ? 'Full' : 'Join'}</button>
        </span>`;
      const btn = li.querySelector('button');
      if (!full) btn.addEventListener('click', () => joinRoom(r.name, false, false, false));
      roomList.appendChild(li);
    }
  }
  refreshRooms();
  const refreshTimer = setInterval(refreshRooms, 3000);

  createBtn.addEventListener('click', () => {
    joinRoom(randomRoomName(), teacherToggle.checked, kingToggle.checked, fogToggle.checked);
  });

  function joinRoom(roomName, asHost = false, asKing = false, asFog = false) {
    clearInterval(refreshTimer);
    const url = new URL(location.href);
    url.searchParams.set('room', roomName);
    if (asHost) url.searchParams.set('host', '1');
    if (asKing) url.searchParams.set('king', '1');
    if (asFog)  url.searchParams.set('fog', '1');
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

  // Room-mode flags from URL — only honored on FIRST connection (room creation).
  const urlParams = new URLSearchParams(location.search);
  const requestedHost = urlParams.get('host') === '1';
  const requestedKing = urlParams.get('king') === '1';
  const requestedFog  = urlParams.get('fog')  === '1';

  const qs = new URLSearchParams({ room: cleanRoom });
  if (name)  qs.set('name', name);
  if (color) qs.set('color', color);
  if (requestedHost) qs.set('host', '1');
  if (requestedKing) qs.set('king', '1');
  if (requestedFog)  qs.set('fog',  '1');
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
  function setBotStatus(kind, label, detail, raw) {
    botStatusEl.className = 'bot-status ' + kind;
    botStatusLabel.textContent = label;
    botStatusDetail.textContent = detail || '';
    if (raw) {
      const r = document.createElement('span');
      r.className = 'raw';
      r.textContent = raw;
      botStatusDetail.appendChild(r);
    }
  }
  function deployBot() {
    try {
      // The user code must contain `function nextMove(state) { ... }`.
      // We run the user code ONCE inside a fresh factory function and
      // capture `nextMove`. This way any `let`/`const` the kid declares
      // at the top of their file (e.g. a Q-table for a learning bot)
      // persists across calls via closure, instead of resetting every tick.
      const factory = new Function(code + '\n;return nextMove;');
      userBotFn = factory();
      if (typeof userBotFn !== 'function') {
        throw new Error('No function nextMove(state) defined');
      }
      setBotStatus('ok', 'Bot ready', '');
    } catch (e) {
      userBotFn = null;
      const t = translate(e);
      setBotStatus('err', 'Syntax error', t.friendly, t.raw);
    }
  }
  deployBot();

  function runBot(state) {
    if (isHost) return;            // host has no snake; nothing to control
    if (!userBotFn) return;
    const me = state.snakes.find(s => s.id === myId);
    if (!me || !me.alive) return;
    const botState = {
      // me: this player's snake, peeled out of the wire `snakes` array
      me: { body: me.body, direction: me.direction, alive: me.alive },
      // foods: passed through from wire `state.foods` (same name, fog-filtered if fog mode)
      foods: state.foods,
      // others: wire `snakes` minus me, with scoreboard fields (id/name/color/isBot) stripped
      others: state.snakes
        .filter(s => s.id !== myId)
        .map(s => ({ body: s.body, direction: s.direction, alive: s.alive })),
      // board: injected from constants so the bot doesn't have to import them
      board: { width: WORLD_COLS, height: WORLD_ROWS },
      tick: state.tick,
    };
    let dir;
    try {
      dir = userBotFn(botState);
    } catch (e) {
      const t = translate(e);
      setBotStatus('err', 'Crashed', t.friendly, t.raw);
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
  let isHost = false;
  let kingMode = false;
  let fogMode = false;
  let fogRadius = 8;
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

  const kingBadge = document.getElementById('kingBadge');
  const fogBadge  = document.getElementById('fogBadge');
  function applyModeUI() {
    hostPanel.classList.toggle('hidden', !isHost);
    pausedBanner.classList.toggle('hidden', !paused || isHost);
    pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
    tickRateLabel.textContent = `${tickRate}ms`;
    if (kingBadge) kingBadge.classList.toggle('hidden', !kingMode);
    if (fogBadge)  fogBadge.classList.toggle('hidden',  !fogMode);
    // Host has no bot — hide the status box AND the Edit bot button
    botStatusEl.classList.toggle('hidden', isHost);
    document.getElementById('editBotBtn').style.display = isHost ? 'none' : '';
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
      isHost    = !!msg.isHost;
      kingMode  = !!msg.kingMode;
      fogMode   = !!msg.fogMode;
      fogRadius =  msg.fogRadius || 8;
      paused    = !!msg.paused;
      tickRate  =  msg.tickRate || 130;
      // Teacher view: show the whole 60×60 world; player view: 24×24 follow-cam.
      renderer.setFullWorld(isHost);
      applyModeUI();
      setStatus('', '');
    } else if (msg.type === 'modeChange') {
      if (typeof msg.paused === 'boolean')   paused = msg.paused;
      if (typeof msg.tickRate === 'number')  tickRate = msg.tickRate;
      applyModeUI();
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
    if (lastState) renderer.draw(lastState, myId, popups, now, { fogMode, fogRadius });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---- Leave + Edit (in-game, no disconnect) ----
  let leaving = false;
  document.getElementById('leaveBtn').addEventListener('click', () => {
    leaving = true;
    ws.close();
    location.href = '/';
  });

  const editModal      = document.getElementById('editModal');
  const editError      = document.getElementById('editError');

  // The modal editor is created on first open (the academy editor: CodeMirror
  // when the CDN answers, a textarea offline). After that it's reused.
  let editEditor = null;
  let editLintTimer = null;

  async function showEditor() {
    const saved = sessionStorage.getItem('botCode') || code;
    showLint(editError, null);
    editModal.classList.remove('hidden');
    if (!editEditor) {
      editEditor = await createEditor(document.getElementById('editBotCodeHost'), saved, () => {
        clearTimeout(editLintTimer);
        editLintTimer = setTimeout(() => showLint(editError, checkSyntax(editEditor.get())), 600);
      });
    } else {
      editEditor.set(saved);
    }
  }
  function hideEditor() {
    editModal.classList.add('hidden');
  }
  wireHints(document.getElementById('modalHintBtn'), document.getElementById('modalHintBox'));

  document.getElementById('editBotBtn').addEventListener('click', showEditor);
  document.getElementById('modalCancelBtn').addEventListener('click', hideEditor);
  document.getElementById('modalApplyBtn').addEventListener('click', () => {
    if (!editEditor) return;   // editor still loading — nothing to apply yet
    const newCode = editEditor.get();
    try {
      // Same factory pattern as deployBot — run user code once, capture
      // nextMove. Closure preserves any module-level state the bot keeps.
      const factory = new Function(newCode + '\n;return nextMove;');
      const newFn = factory();
      if (typeof newFn !== 'function') {
        throw new Error('No function nextMove(state) defined');
      }
      // Hot-swap — game keeps running, next tick uses the new function
      userBotFn = newFn;
      sessionStorage.setItem('botCode', newCode);
      setBotStatus('ok', 'Bot updated', '');
      hideEditor();
    } catch (e) {
      showLint(editError, translate(e));
    }
  });

  // Sample bot buttons inside the modal — load the same .js as the lobby
  editModal.querySelectorAll('.sample').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!editEditor) return;
      try {
        const res = await fetch(`/bots/${btn.dataset.sample}.js`);
        editEditor.set(await res.text());
      } catch (_) {}
    });
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
