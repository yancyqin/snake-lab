import { Snake } from './snake.js';
import { botMove, computeSmartness } from './bot.js';
import {
  WORLD_COLS, WORLD_ROWS, VIEW_COLS, VIEW_ROWS,
  TICK_MS, FOOD_COUNT, POINTS_PER_FOOD,
  PLAYER_COLORS, BOT_COLOR, FUNNY_NAMES,
  MAX_PLAYERS, RESTART_DELAY_MS, FOG_RADIUS,
} from './public/constants.js';

function pickFunnyName() {
  return FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)];
}

// Build a fog-filtered view of the world from a specific player's perspective.
// Returns { snakes, foods } — only cells within FOG_RADIUS of the viewer's head.
// The viewer's own snake is always fully visible.
function filterStateForPlayer(viewerSnake, allSerializedSnakes, allFoods) {
  const head = viewerSnake.body[0];
  const r2 = FOG_RADIUS * FOG_RADIUS;
  const inFog = (x, y) => {
    const dx = x - head.x, dy = y - head.y;
    return dx * dx + dy * dy <= r2;
  };
  const snakes = [];
  for (const s of allSerializedSnakes) {
    if (s.id === viewerSnake.id) { snakes.push(s); continue; }   // see myself fully
    const visible = s.body.filter(c => inFog(c.x, c.y));
    if (visible.length === 0) continue;                          // nothing of this snake visible
    snakes.push({
      ...s,
      body: visible,
      headVisible: inFog(s.body[0].x, s.body[0].y),
      partial: visible.length < s.body.length,
    });
  }
  const foods = allFoods.filter(f => inFog(f.x, f.y));
  return { snakes, foods };
}

const SPAWN_POSITIONS = [
  { x: 12, y: 30, dir: 'RIGHT' },
  { x: 48, y: 30, dir: 'LEFT'  },
  { x: 30, y: 12, dir: 'DOWN'  },
  { x: 30, y: 48, dir: 'UP'    },
  { x: 15, y: 15, dir: 'DOWN'  },
  { x: 45, y: 15, dir: 'DOWN'  },
  { x: 15, y: 45, dir: 'UP'    },
  { x: 45, y: 45, dir: 'UP'    },
];

let nextPlayerId = 1;
const log = (room, ...args) => console.log(`[room ${room}]`, ...args);

export class Game {
  constructor(name, options = {}) {
    this.name = name;
    // Orthogonal room flags. Locked at room creation (set by the first connection).
    this.hostId = null;              // set when the first connection claims host=1
    this.hostLocked = false;         // after first connect, host slot is closed
    this.kingMode = !!options.king;  // snake-eat-snake: killer absorbs victim — but only if killer.length >= victim.length
    this.fogMode  = !!options.fog;   // fog of war: per-player visibility radius
    this.paused = false;
    this.tickRate = TICK_MS;
    this.players = new Map();        // includes the host (with isHost: true, snake: null)
    this.bot = null;
    this.foods = [];
    this.tick = 0;
    this.timer = null;
    this.restarting = false;
    this.removeBotNextRound = false;
    this.usedColors = new Set();
  }

  start() {
    this.spawnFoods();
    this._startTimer();
    log(this.name, 'started');
  }

  _startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.update(), this.tickRate);
  }

  stop() {
    clearInterval(this.timer);
    log(this.name, 'stopped');
  }

  isEmpty() {
    return this.players.size === 0;
  }

  // Players that actually take a snake slot (excludes the teacher)
  playerCount() {
    let n = 0;
    for (const p of this.players.values()) if (!p.isHost) n++;
    return n;
  }

  isFull() {
    return this.playerCount() >= MAX_PLAYERS;
  }

  summary() {
    return {
      name: this.name,
      players: this.playerCount(),
      max: MAX_PLAYERS,
      hasHost: this.hostId !== null,
      kingMode: this.kingMode,
      fogMode: this.fogMode,
    };
  }

  // ---- Membership ----

  addPlayer(ws, requestedName, requestedColor, requestedRole = 'player') {
    // Host slot is claimable by the FIRST connection asking for it.
    // After anyone has joined the room (as host or player), the slot is locked
    // — late arrivals are always players, never hosts.
    const wantsHost = requestedRole === 'host';
    const isHost = wantsHost && !this.hostLocked && this.hostId === null;
    this.hostLocked = true;

    if (!isHost && this.isFull()) return null;

    const id = `p${nextPlayerId++}`;
    const color = isHost ? '#cbd5e1' : this.pickColor(requestedColor);
    if (!isHost) this.usedColors.add(color);

    const player = {
      id,
      ws,
      name: this.sanitizeName(requestedName) || (isHost ? 'Teacher' : `Snake ${this.playerCount() + 1}`),
      color,
      isHost,
      snake: null,
      score: 0,
    };
    if (!isHost) {
      this.buildSnake(player);
    } else {
      this.hostId = id;
    }
    this.players.set(id, player);
    this.updateBotMembership();

    this.send(ws, {
      type: 'welcome',
      playerId: id,
      isHost,
      kingMode: this.kingMode,
      fogMode: this.fogMode,
      fogRadius: FOG_RADIUS,
      paused: this.paused,
      tickRate: this.tickRate,
      world: { cols: WORLD_COLS, rows: WORLD_ROWS },
      view:  { cols: VIEW_COLS,  rows: VIEW_ROWS },
      tickMs: TICK_MS,
    });

    log(this.name, `+${id} ${player.name} ${color} ${isHost ? '(HOST)' : ''} (${this.playerCount()}/${MAX_PLAYERS})`);

    // 2+ playing humans — restart the round in 5s for fairness (host doesn't count)
    if (!isHost && this.playerCount() >= 2 && !this.restarting) {
      this.restarting = true;
      const delay = 5000;
      this.broadcast({ type: 'restartCountdown', joiner: player.name, delay });
      setTimeout(() => this.restart(), delay);
      log(this.name, `restart in ${delay}ms (new player joined)`);
    }

    return player;
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (!p) return;
    if (!p.isHost) this.usedColors.delete(p.color);
    if (this.hostId === id) this.hostId = null;
    this.players.delete(id);
    this.updateBotMembership();
    log(this.name, `-${id} (${this.playerCount()}/${MAX_PLAYERS})`);
  }

  sanitizeName(name) {
    if (typeof name !== 'string') return '';
    return name.replace(/[^\p{L}\p{N}\s_.\-]/gu, '').trim().slice(0, 12);
  }

  pickColor(requested) {
    if (requested && PLAYER_COLORS.includes(requested) && !this.usedColors.has(requested)) {
      return requested;
    }
    return PLAYER_COLORS.find(c => !this.usedColors.has(c)) || PLAYER_COLORS[0];
  }

  updateBotMembership() {
    // Bot count uses playerCount (excludes host) — host doesn't count as a player
    if (this.playerCount() === 1 && !this.bot) {
      this.spawnBot();
      log(this.name, 'bot joined');
    } else if (this.playerCount() >= 2 && this.bot) {
      this.removeBotNextRound = true;
    } else if (this.playerCount() === 0) {
      this.bot = null;
    }
  }

  spawnBot() {
    const spawn = this.pickSpawn();
    const snake = new Snake('bot', spawn.x, spawn.y, spawn.dir, undefined, { isBot: true });
    snake.name = pickFunnyName();
    snake.color = BOT_COLOR;
    this.bot = { snake, score: 0, smartness: 1.0 };
  }

  buildSnake(player) {
    const spawn = this.pickSpawn();
    player.snake = new Snake(player.id, spawn.x, spawn.y, spawn.dir);
    player.snake.name = player.name;
    player.snake.color = player.color;
  }

  pickSpawn() {
    const taken = new Set();
    for (const p of this.players.values()) {
      if (p.snake) taken.add(`${p.snake.body[0].x},${p.snake.body[0].y}`);
    }
    if (this.bot) taken.add(`${this.bot.snake.body[0].x},${this.bot.snake.body[0].y}`);
    for (const s of SPAWN_POSITIONS) {
      if (!taken.has(`${s.x},${s.y}`)) return s;
    }
    return SPAWN_POSITIONS[0];
  }

  // ---- World ----

  allSnakes() {
    // Hosts don't have snakes — only real players + the auto-bot
    const snakes = [];
    for (const p of this.players.values()) {
      if (p.snake) snakes.push(p.snake);
    }
    if (this.bot) snakes.push(this.bot.snake);
    return snakes;
  }

  spawnFoods() {
    this.foods = [];
    while (this.foods.length < FOOD_COUNT) this.foods.push(this.makeFood());
  }

  makeFood() {
    let tries = 0;
    while (tries++ < 200) {
      const x = Math.floor(Math.random() * WORLD_COLS);
      const y = Math.floor(Math.random() * WORLD_ROWS);
      if (this.foods.some(f => f.x === x && f.y === y)) continue;
      if (this.allSnakes().some(s => s.body.some(c => c.x === x && c.y === y))) continue;
      return { x, y };
    }
    return { x: 0, y: 0 };
  }

  // ---- Messaging ----

  handleMessage(player, msg) {
    if (msg.type === 'direction' && !player.isHost && player.snake && player.snake.alive) {
      if (typeof msg.dir === 'string') player.snake.setDirection(msg.dir);
      return;
    }
    // ---- Host-only control messages ----
    if (!player.isHost) return;
    if (msg.type === 'pause') {
      if (!this.paused) {
        this.paused = true;
        this.broadcastModeChange();
        log(this.name, 'paused by host');
      }
    } else if (msg.type === 'resume') {
      if (this.paused) {
        this.paused = false;
        this.broadcastModeChange();
        log(this.name, 'resumed by host');
      }
    } else if (msg.type === 'step') {
      // Step pauses the game if it's running, then advances exactly one tick.
      // So a kid can hit Step without Pause first and the game stops where it lands.
      if (!this.paused) {
        this.paused = true;
        this.broadcastModeChange();
        log(this.name, 'paused by host (via step)');
      }
      this._tickOnce();
    } else if (msg.type === 'setTickRate' && typeof msg.ms === 'number') {
      this.tickRate = Math.max(50, Math.min(2000, Math.round(msg.ms)));
      this._startTimer();
      this.broadcastModeChange();
      log(this.name, `tickRate=${this.tickRate}ms`);
    } else if (msg.type === 'reset') {
      // Force-end the round right now (skips winner detection)
      this.restarting = true;
      this.broadcast({ type: 'roundOver', winner: null });
      setTimeout(() => this.restart(), 1500);
      log(this.name, 'reset by host');
    }
  }

  broadcastModeChange() {
    this.broadcast({
      type: 'modeChange',
      paused: this.paused,
      tickRate: this.tickRate,
    });
  }

  // ---- Tick ----

  update() {
    if (this.restarting || this.paused) return;
    this._tickOnce();
  }

  _tickOnce() {
    if (this.restarting) return;
    this.tick++;

    // Bot picks direction
    if (this.bot && this.bot.snake.alive) {
      const dir = botMove(this.bot.snake, this.allSnakes(), this.foods);
      this.bot.snake.setDirection(dir);
      this.bot.smartness = computeSmartness(this.bot.snake.body.length);
    }

    const alive = this.allSnakes().filter(s => s.alive);

    // Peek for food
    for (const s of alive) {
      const nh = s.nextHead();
      const foodIdx = this.foods.findIndex(f => f.x === nh.x && f.y === nh.y);
      s._willEat = foodIdx !== -1;
      s._foodIdx = foodIdx;
    }

    // Step
    for (const s of alive) s.step(s._willEat);

    // Collision detection.
    //
    //   wall          → dies in both modes
    //   self          → regular: dies.  king: pass-through (snake goes through itself)
    //   head-on-head  → regular: everyone in that cell dies.
    //                   king: bigger eats smaller, absorbs their length.
    //                         Tie at the top (≥2 snakes share the max length) → everyone dies.
    //   head-on-body  → regular: aggressor dies (classic snake rule).
    //                   king: if aggressor.length >= victim.length → aggressor LIVES,
    //                           victim dies, aggressor absorbs victim's length.
    //                         else (smaller) → pass-through (aggressor unhurt).
    //                         mutual head-on-body with EQUAL lengths → both die.
    //
    // Growths from king-mode absorption use pre-tick lengths and are applied at the very
    // end, so chain reactions don't compound mid-tick.

    // (a) Wall — always fatal.
    for (const s of alive) {
      if (s.hitWall()) s.alive = false;
    }
    // (b) Self — fatal in regular mode only. King mode allows self pass-through.
    if (!this.kingMode) {
      for (const s of alive) {
        if (s.alive && s.hitSelf()) s.alive = false;
      }
    }

    // (c) Group still-alive snakes by new head position to find head-on-head.
    const headAt = new Map();
    for (const s of alive) {
      if (!s.alive) continue;
      const key = `${s.body[0].x},${s.body[0].y}`;
      if (!headAt.has(key)) headAt.set(key, []);
      headAt.get(key).push(s);
    }

    // (d) Head-on-head resolution.
    const headHeadGrowths = [];  // { snake, growBy } — applied at the end
    for (const snakes of headAt.values()) {
      if (snakes.length < 2) continue;
      if (!this.kingMode) {
        for (const s of snakes) s.alive = false;
      } else {
        // King mode: bigger eats smaller. Tie at top length → everyone dies.
        let maxLen = -1;
        for (const s of snakes) if (s.body.length > maxLen) maxLen = s.body.length;
        const winners = snakes.filter(s => s.body.length === maxLen);
        if (winners.length > 1) {
          for (const s of snakes) s.alive = false;
        } else {
          const winner = winners[0];
          let growBy = 0;
          for (const s of snakes) {
            if (s === winner) continue;
            growBy += s.body.length;
            s.alive = false;
          }
          headHeadGrowths.push({ snake: winner, growBy });
        }
      }
    }

    // (e) Head-on-body aggressions — only from snakes that survived (a)–(d).
    const aggressions = [];  // [{aggressor, victim}]
    for (const s of alive) {
      if (!s.alive) continue;
      for (const other of alive) {
        if (other === s || !other.alive) continue;
        for (let i = 1; i < other.body.length; i++) {
          if (other.body[i].x === s.body[0].x && other.body[i].y === s.body[0].y) {
            aggressions.push({ aggressor: s, victim: other });
            break;
          }
        }
      }
    }

    // (f) Resolve head-on-body by mode.
    const bodyGrowths = [];
    if (!this.kingMode) {
      for (const a of aggressions) a.aggressor.alive = false;
    } else {
      // Mutual aggression with EQUAL length — both would eat each other, no winner → both die.
      const aggressorOf = new Map();
      for (const a of aggressions) aggressorOf.set(a.aggressor, a);
      const mutualBothEat = new Set();
      for (const a of aggressions) {
        const reverse = aggressorOf.get(a.victim);
        if (reverse && reverse.victim === a.aggressor
            && a.aggressor.body.length === a.victim.body.length) {
          mutualBothEat.add(a.aggressor);
          mutualBothEat.add(a.victim);
        }
      }
      for (const s of mutualBothEat) s.alive = false;

      for (const a of aggressions) {
        if (mutualBothEat.has(a.aggressor)) continue;
        if (!a.aggressor.alive) continue;
        if (!a.victim.alive) continue;
        if (a.aggressor.body.length >= a.victim.body.length) {
          // Big-enough aggressor eats victim.
          bodyGrowths.push({ aggressor: a.aggressor, victim: a.victim, growBy: a.victim.body.length });
          a.victim.alive = false;
        }
        // else: smaller aggressor passes through victim's body — no death, no growth.
      }
    }

    // (g) Apply all king-mode growths last so absorption never compounds mid-tick.
    for (const g of bodyGrowths) {
      if (!g.aggressor.alive) continue;
      const tail = g.aggressor.body[g.aggressor.body.length - 1];
      for (let i = 0; i < g.growBy; i++) {
        g.aggressor.body.push({ x: tail.x, y: tail.y });
      }
    }
    for (const g of headHeadGrowths) {
      if (!g.snake.alive) continue;
      const tail = g.snake.body[g.snake.body.length - 1];
      for (let i = 0; i < g.growBy; i++) {
        g.snake.body.push({ x: tail.x, y: tail.y });
      }
    }

    // Award food to survivors
    const eaten = new Set();
    for (const s of alive) {
      if (!s.alive || !s._willEat) continue;
      eaten.add(s._foodIdx);
      const p = [...this.players.values()].find(p => p.snake === s);
      if (p) p.score += POINTS_PER_FOOD;
      else if (this.bot && this.bot.snake === s) this.bot.score += POINTS_PER_FOOD;
    }
    for (const idx of [...eaten].sort((a, b) => b - a)) this.foods.splice(idx, 1);
    while (this.foods.length < FOOD_COUNT) this.foods.push(this.makeFood());

    // End of round — host doesn't count toward player totals.
    // If there are no real players at all (e.g. teacher alone waiting for kids),
    // we don't run end-of-round logic — the world idles peacefully.
    const total = this.playerCount() + (this.bot ? 1 : 0);
    if (this.playerCount() > 0) {
      const aliveCount = [...this.players.values()].filter(p => p.snake && p.snake.alive).length
                       + (this.bot && this.bot.snake.alive ? 1 : 0);
      let over = false;
      if (total >= 2) { if (aliveCount <= 1) over = true; }
      else            { if (aliveCount === 0) over = true; }
      if (over) this.endRound();
    }

    this.broadcastState();
  }

  endRound() {
    this.restarting = true;
    const survivors = [...this.players.values()]
      .filter(p => p.snake && p.snake.alive)
      .map(p => p.snake);
    if (this.bot && this.bot.snake.alive) survivors.push(this.bot.snake);
    const winner = survivors.length === 1 ? survivors[0].name : null;
    log(this.name, `round over (winner: ${winner ?? 'none'})`);
    this.broadcast({ type: 'roundOver', winner });
    setTimeout(() => this.restart(), RESTART_DELAY_MS);
  }

  restart() {
    if (this.removeBotNextRound) {
      this.bot = null;
      this.removeBotNextRound = false;
      log(this.name, 'bot removed');
    }
    // Respawn snakes for actual players; host stays snake-less
    for (const p of this.players.values()) {
      if (p.isHost) continue;
      this.buildSnake(p);
      p.score = 0;
    }
    if (this.playerCount() === 1 && !this.bot) {
      this.spawnBot();
      log(this.name, 'bot joined');
    }
    if (this.bot) {
      const spawn = this.pickSpawn();
      this.bot.snake = new Snake('bot', spawn.x, spawn.y, spawn.dir, undefined, { isBot: true });
      this.bot.snake.name = pickFunnyName();
      this.bot.snake.color = BOT_COLOR;
      this.bot.score = 0;
    }
    this.spawnFoods();
    this.tick = 0;
    this.restarting = false;
    log(this.name, 'restarted');
  }

  broadcastState() {
    const scores = {};
    for (const p of this.players.values()) {
      if (p.isHost) continue;  // host has no snake → not on the scoreboard
      scores[p.id] = { name: p.name, color: p.color, score: p.score, isBot: false };
    }
    if (this.bot) {
      scores['bot'] = {
        name: this.bot.snake.name,
        color: BOT_COLOR,
        score: this.bot.score,
        isBot: true,
        smartness: this.bot.smartness,
      };
    }
    const all = this.allSnakes();
    const allSnakesData = all.map(s => s.serialize());
    const baseMsg = { type: 'state', tick: this.tick, scores };

    // Fast path: no fog → everyone gets the same full state.
    if (!this.fogMode) {
      this.broadcast({ ...baseMsg, snakes: allSnakesData, foods: this.foods });
      return;
    }

    // Fog path: build a per-player filtered payload.
    // Host and dead snakes see everything (no fog).
    const fullPayload = JSON.stringify({ ...baseMsg, snakes: allSnakesData, foods: this.foods });
    for (const p of this.players.values()) {
      if (p.ws.readyState !== 1) continue;
      const seesAll = p.isHost || !p.snake || !p.snake.alive;
      if (seesAll) {
        p.ws.send(fullPayload);
        continue;
      }
      const filtered = filterStateForPlayer(p.snake, allSnakesData, this.foods);
      p.ws.send(JSON.stringify({ ...baseMsg, ...filtered }));
    }
  }

  broadcast(msg) {
    const data = JSON.stringify(msg);
    for (const p of this.players.values()) {
      if (p.ws.readyState === 1) p.ws.send(data);
    }
  }

  send(ws, msg) {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  }
}
