// Homework Challenge — ladder of 10 bots, best-of-3, manual or coded play.

import { DuelGame } from './game.js';
import { Renderer } from './render.js';
import { LEVELS } from './opponents.js';
import { revealSecret } from './secret.js';
import { TICK_MS } from './constants.js';

// ---------- persistence ----------
const LS = {
  get beaten() { return parseInt(localStorage.getItem('sl_ch_beaten') || '0', 10); },
  set beaten(v) { localStorage.setItem('sl_ch_beaten', String(v)); },
  get code() { return localStorage.getItem('sl_ch_code') || SAMPLES.blank; },
  set code(v) { localStorage.setItem('sl_ch_code', v); },
  get mode() { return localStorage.getItem('sl_ch_mode') || 'manual'; },
  set mode(v) { localStorage.setItem('sl_ch_mode', v); },
};

// ---------- starter bots kids can load ----------
const SAMPLES = {
  blank:
`// Write your snake's brain! Return 'UP', 'DOWN', 'LEFT' or 'RIGHT'.
//   state.me.body[0]  = your head  {x, y}
//   state.foods       = list of food {x, y}
//   state.others      = the rival snakes
//   state.board       = { width, height }
// This starter just heads toward the first food. Make it smarter!
function nextMove(state) {
  const head = state.me.body[0];
  const food = state.foods[0];
  if (food.x > head.x) return 'RIGHT';
  if (food.x < head.x) return 'LEFT';
  if (food.y > head.y) return 'DOWN';
  return 'UP';
}`,
  greedy:
`// Chases the nearest food but never steps somewhere deadly.
// Good for the early levels — but the Boss will trap you.
// Want to go further? Load the "Flood-fill starter".
function nextMove(state) {
  const head = state.me.body[0];
  const W = state.board.width, H = state.board.height;
  function deadly(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return true;
    for (const c of state.me.body) if (c.x === x && c.y === y) return true;
    for (const o of state.others) for (const c of o.body) if (c.x === x && c.y === y) return true;
    return false;
  }
  let f = state.foods[0], bd = 1e9;
  for (const g of state.foods) {
    const d = Math.abs(g.x - head.x) + Math.abs(g.y - head.y);
    if (d < bd) { bd = d; f = g; }
  }
  const M = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] };
  let best = state.me.direction, bestD = 1e9;
  for (const dir in M) {
    const nx = head.x + M[dir][0], ny = head.y + M[dir][1];
    if (deadly(nx, ny)) continue;
    const d = f ? Math.abs(nx - f.x) + Math.abs(ny - f.y) : 0;
    if (d < bestD) { bestD = d; best = dir; }
  }
  return best;
}`,
  flood:
`// A STRONG starting point. It counts how much open space each move leads
// into (flood fill) and refuses to trap itself. This is how the Boss thinks.
// Tweak the numbers, add food-racing or enemy-dodging, and beat levels 8-10!
function nextMove(state) {
  const head = state.me.body[0];
  const W = state.board.width, H = state.board.height;
  const myLen = state.me.body.length;

  const blocked = new Set();
  for (const s of [state.me, ...state.others])
    for (let i = 0; i < s.body.length - 1; i++) blocked.add(s.body[i].y * W + s.body[i].x);
  const dead = (x, y) => x < 0 || x >= W || y < 0 || y >= H || blocked.has(y * W + x);

  function space(x, y, cap = 200) {
    if (dead(x, y)) return 0;
    const seen = new Set([y * W + x]); const st = [[x, y]]; let n = 0;
    while (st.length && n < cap) {
      const [cx, cy] = st.pop(); n++;
      for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
        const k = (cy + dy) * W + (cx + dx);
        if (!dead(cx + dx, cy + dy) && !seen.has(k)) { seen.add(k); st.push([cx + dx, cy + dy]); }
      }
    }
    return n;
  }
  let f = state.foods[0], bd = 1e9;
  for (const g of state.foods) { const d = Math.abs(g.x-head.x)+Math.abs(g.y-head.y); if (d<bd){bd=d;f=g;} }

  const M = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] };
  let best = state.me.direction, bs = -1e9;
  for (const dir in M) {
    const nx = head.x + M[dir][0], ny = head.y + M[dir][1];
    if (dead(nx, ny)) continue;
    const room = space(nx, ny);
    let score = Math.min(room, myLen + 20) * 10;
    if (room <= myLen) score -= 1000;          // pocket = slow death
    if (f) score -= Math.abs(nx - f.x) + Math.abs(ny - f.y);
    if (score > bs) { bs = score; best = dir; }
  }
  return best;
}`,
};

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const ladderEl = $('ladder'), canvas = $('game'), banner = $('banner');
const levelTitle = $('levelTitle'), levelBlurb = $('levelBlurb'), tallyEl = $('tally');
const modeManualBtn = $('modeManual'), modeCodeBtn = $('modeCode');
const codePanel = $('codePanel'), botCodeEl = $('botCode'), botStatus = $('botStatus');
const playBtn = $('playBtn'), stopBtn = $('stopBtn');
const nudge = $('nudge'), nudgeBtn = $('nudgeBtn');
const modesRow = $('modesRow'), handOnly = $('handOnly'), floodSample = $('floodSample');
const joystick = $('joystick'), stick = joystick.querySelector('.joystick-stick');

const renderer = new Renderer(canvas);

// ---------- level gates ----------
const MAX_LEVEL = LEVELS.length;
const CODE_UNLOCK = 2;            // L1 is hand-play only; code mode appears at L2
const GREEDY_SAMPLE_UNLOCK = 4;   // the Greedy+Safe starter button appears at L4
const FLOOD_SAMPLE_UNLOCK = 7;    // the (strong) Flood-fill starter appears at L7

// ---------- state ----------
let level = Math.min(LS.beaten + 1, MAX_LEVEL);
let userMode = LS.mode;   // the mode the kid CHOSE (manual/code)
let mode = 'manual';      // the mode actually in effect this level (game loop reads this)
let foeBots = [];         // the opponent bot fn(s) for the current level
let game = new DuelGame();
let running = false, tickTimer = null;
let youWins = 0, foeWins = 0, gameNo = 0;
let manualDir = null, manualLosses = 0;
let kidBot = null;

// ---------- ladder ----------
function buildLadder() {
  ladderEl.innerHTML = '';
  for (const L of LEVELS) {
    const beaten = L.n <= LS.beaten;
    const unlocked = L.n <= LS.beaten + 1;
    const chip = document.createElement('button');
    chip.className = 'chip' + (beaten ? ' beaten' : '') + (L.n === level ? ' current' : '') + (unlocked ? '' : ' locked');
    chip.innerHTML = `<span class="lv">L${L.n}</span> ${L.emoji} ${L.name}`;
    if (unlocked) chip.addEventListener('click', () => selectLevel(L.n));
    ladderEl.appendChild(chip);
  }
}

function selectLevel(n) {
  stopMatch();
  level = n;
  youWins = foeWins = gameNo = 0;
  manualLosses = 0;
  nudge.classList.add('hidden');
  const L = LEVELS[n - 1];
  foeBots = L.foes || [L.fn];                 // 1 opponent normally, several on expert levels
  game = new DuelGame(foeBots.length);        // rebuild the arena with the right snake count
  levelTitle.textContent = `Level ${n} — ${L.emoji} ${L.name}`;
  levelBlurb.textContent = L.blurb;
  renderModeUI();
  updateTally();
  showBanner('', `Best of 3 — press ▶ Play`, '');
  buildLadder();
}

// Show/hide code mode + the starter buttons depending on the level.
function renderModeUI() {
  const codeAllowed = level >= CODE_UNLOCK;
  mode = codeAllowed ? userMode : 'manual';        // forced to manual on Level 1
  modesRow.classList.toggle('hidden', !codeAllowed);
  handOnly.classList.toggle('hidden', codeAllowed);
  modeManualBtn.classList.toggle('active', mode === 'manual');
  modeCodeBtn.classList.toggle('active', mode === 'code');
  codePanel.classList.toggle('hidden', mode !== 'code');
  // starter buttons unlock progressively; the "Start from:" row hides if neither is available
  const greedyOK = level >= GREEDY_SAMPLE_UNLOCK;
  const floodOK  = level >= FLOOD_SAMPLE_UNLOCK;
  greedySample.classList.toggle('hidden', !greedyOK);
  floodSample.classList.toggle('hidden', !floodOK);
  samplesRow.classList.toggle('hidden', !(greedyOK || floodOK));
  if (mode !== 'manual') nudge.classList.add('hidden');
}

function updateTally() {
  const hearts = (w) => '🟢'.repeat(w) + '⚪'.repeat(2 - w);
  const foeLabel = foeBots.length > 1 ? `${foeBots.length} Foes` : 'Foe';
  tallyEl.textContent = `You ${hearts(youWins)}  vs  ${hearts(foeWins)} ${foeLabel}`;
}

// ---------- banner ----------
function showBanner(cls, big, small) {
  banner.className = cls || '';
  banner.querySelector('.big').textContent = big || '';
  banner.querySelector('.small').textContent = small || '';
  banner.classList.remove('hidden');
}
function hideBanner() { banner.classList.add('hidden'); }

// ---------- bot compile ----------
function compile(code) {
  const factory = new Function(code + '\n;return nextMove;');
  const fn = factory();
  if (typeof fn !== 'function') throw new Error('No function nextMove(state) defined');
  return fn;
}
function setStatus(kind, msg) { botStatus.className = 'bot-status ' + kind; botStatus.textContent = msg; }
function deployKidBot() {
  try { kidBot = compile(botCodeEl.value); setStatus('ok', 'Bot ready ✓'); }
  catch (e) { kidBot = null; setStatus('err', 'Error: ' + e.message); }
}
function safeDir(fn, view, fallback) {
  try {
    const d = fn(view);
    if (d === 'UP' || d === 'DOWN' || d === 'LEFT' || d === 'RIGHT') return d;
  } catch (e) { /* bot crashed this tick — keep going */ }
  return fallback;
}

// ---------- match / game loop ----------
function startMatch() {
  if (mode === 'code') { deployKidBot(); if (!kidBot) return; }
  youWins = foeWins = gameNo = 0;
  updateTally();
  startGame();
}
function startGame() {
  game.reset();
  manualDir = game.you.direction;
  gameNo++;
  running = true;
  playBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  showBanner('', `Game ${gameNo}`, mode === 'manual' ? 'swipe / arrow keys' : 'your bot is driving');
  setTimeout(() => { if (running) hideBanner(); }, 700);
  scheduleTick();
}
function scheduleTick() { clearTimeout(tickTimer); tickTimer = setTimeout(tickOnce, TICK_MS); }

function tickOnce() {
  if (!running) return;
  const moves = new Array(game.snakes.length);
  // YOU are snake 0 — manual input or your bot.
  moves[0] = mode === 'manual'
    ? (manualDir || game.snakes[0].direction)
    : (kidBot ? safeDir(kidBot, game.viewFor(0), game.snakes[0].direction) : game.snakes[0].direction);
  // Opponents are snakes 1..N — each driven by its level bot.
  for (let i = 1; i < game.snakes.length; i++) {
    const s = game.snakes[i];
    moves[i] = s.alive ? safeDir(foeBots[i - 1], game.viewFor(i), s.direction) : s.direction;
  }
  game.step(moves);
  if (game.over) return endGame();
  scheduleTick();
}

function endGame() {
  running = false;
  const w = game.winner;
  if (w === 'draw') {
    showBanner('', 'Draw!', 'replaying…');
    setTimeout(() => { if (!running) startGame(); }, 1100);
    return;
  }
  if (w === 'you') youWins++; else foeWins++;
  updateTally();

  if (youWins === 2) return matchWon();
  if (foeWins === 2) return matchLost();

  showBanner(w === 'you' ? 'win' : 'lose', w === 'you' ? 'You win the round!' : 'Foe takes it', 'next game…');
  setTimeout(() => { if (!running) startGame(); }, 1200);
}

function matchWon() {
  running = false;
  playBtn.classList.remove('hidden'); stopBtn.classList.add('hidden');
  manualLosses = 0; nudge.classList.add('hidden');

  const newlyBeaten = level > LS.beaten;
  if (newlyBeaten) LS.beaten = level;
  buildLadder();

  if (level === 8 || level === 10) {
    showBanner('win', 'YOU BEAT ' + LEVELS[level - 1].name.toUpperCase() + '!', 'unlocking a secret…');
    setTimeout(() => showSecret(level), 900);
  } else {
    showBanner('win', 'Level cleared! ★', level < MAX_LEVEL ? 'Level ' + (level + 1) + ' unlocked' : 'You beat them all! 🐍👑');
    if (level < MAX_LEVEL) setTimeout(() => selectLevel(level + 1), 1600);
  }
}

function matchLost() {
  running = false;
  playBtn.classList.remove('hidden'); stopBtn.classList.add('hidden');
  showBanner('lose', 'Foe wins the match', 'press ▶ Play to try again');
  // Only nudge toward code mode if it's actually available at this level.
  if (mode === 'manual' && level >= CODE_UNLOCK) {
    manualLosses++;
    if (manualLosses >= 2) nudge.classList.remove('hidden');
  }
}

function stopMatch() {
  running = false;
  clearTimeout(tickTimer);
  playBtn.classList.remove('hidden'); stopBtn.classList.add('hidden');
}

// ---------- secret modal ----------
function showSecret(lv) {
  const s = revealSecret(lv);
  if (!s) return;
  const when = new Date().toLocaleString();
  const who = mode === 'code' ? 'your bot' : 'you (manual)';
  const back = document.createElement('div');
  back.className = 'backdrop';
  back.innerHTML = `
    <div class="modal">
      <div class="trophy">${lv === 10 ? '🏆' : '🎉'}</div>
      <h2>Level ${lv} cleared!</h2>
      <div class="verse">"${s.verse}"</div>
      <div class="ref">${s.ref}</div>
      <div class="claim">
        Show this screen to <b>Mr. Yancy</b> to claim your award.<br>
        Beaten by: <b>${who}</b> · ${when}
      </div>
      <button id="secretClose">Got it!</button>
    </div>`;
  document.body.appendChild(back);
  back.querySelector('#secretClose').addEventListener('click', () => {
    back.remove();
    selectLevel(Math.min(level + 1, MAX_LEVEL));
  });
}

// ---------- mode toggle ----------
function chooseMode(m) {
  userMode = m; LS.mode = m;
  renderModeUI();
}
modeManualBtn.addEventListener('click', () => chooseMode('manual'));
modeCodeBtn.addEventListener('click', () => chooseMode('code'));
nudgeBtn.addEventListener('click', () => { chooseMode('code'); codePanel.scrollIntoView({ behavior: 'smooth' }); });

// ---------- code panel wiring ----------
botCodeEl.value = LS.code;
botCodeEl.addEventListener('input', () => { LS.code = botCodeEl.value; });
botCodeEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const s = botCodeEl.selectionStart, t = botCodeEl.selectionEnd;
  botCodeEl.value = botCodeEl.value.slice(0, s) + '  ' + botCodeEl.value.slice(t);
  botCodeEl.selectionStart = botCodeEl.selectionEnd = s + 2;
  LS.code = botCodeEl.value;
});
document.querySelectorAll('.sample').forEach(b =>
  b.addEventListener('click', () => { botCodeEl.value = SAMPLES[b.dataset.sample]; LS.code = botCodeEl.value; deployKidBot(); }));
$('copyBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(botCodeEl.value); setStatus('ok', 'Copied to clipboard ✓'); }
  catch { setStatus('err', 'Copy failed — select all + copy by hand'); }
});

// ---------- controls ----------
playBtn.addEventListener('click', startMatch);
stopBtn.addEventListener('click', () => { stopMatch(); showBanner('', 'Stopped', 'press ▶ Play'); });

// ---------- manual input: keyboard ----------
const KEYS = { ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT',
               w:'UP', s:'DOWN', a:'LEFT', d:'RIGHT', W:'UP', S:'DOWN', A:'LEFT', D:'RIGHT' };
document.addEventListener('keydown', (e) => {
  if (mode !== 'manual' || !running) return;
  const d = KEYS[e.key];
  if (d) { e.preventDefault(); manualDir = d; }
});

// ---------- manual input: floating joystick ----------
const RING = 46, DEAD = 12;
let joyOX = 0, joyOY = 0, joyOn = false;
canvas.addEventListener('touchstart', (e) => {
  if (mode !== 'manual') return;
  e.preventDefault();
  const t = e.changedTouches[0], r = canvas.getBoundingClientRect();
  // scale from displayed px to nothing — joystick is positioned in display px
  joyOX = t.clientX - r.left; joyOY = t.clientY - r.top; joyOn = true;
  joystick.style.left = joyOX + 'px'; joystick.style.top = joyOY + 'px';
  stick.style.transform = 'translate(-50%, -50%)';
  joystick.classList.remove('hidden');
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  if (!joyOn) return;
  e.preventDefault();
  const t = e.changedTouches[0], r = canvas.getBoundingClientRect();
  let dx = (t.clientX - r.left) - joyOX, dy = (t.clientY - r.top) - joyOY;
  const dist = Math.hypot(dx, dy);
  let sx = dx, sy = dy;
  if (dist > RING) { sx = dx / dist * RING; sy = dy / dist * RING; }
  stick.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;
  if (dist < DEAD) return;
  manualDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP');
}, { passive: false });
const endJoy = () => { joyOn = false; joystick.classList.add('hidden'); };
canvas.addEventListener('touchend', (e) => { e.preventDefault(); endJoy(); }, { passive: false });
canvas.addEventListener('touchcancel', endJoy);

// ---------- render loop ----------
function frame(now) { renderer.draw(game, now); requestAnimationFrame(frame); }
requestAnimationFrame(frame);

// ---------- boot ----------
selectLevel(level);   // calls renderModeUI(), which sets the effective mode for this level
