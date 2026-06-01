import { Snake } from './snake.js';
import { botMove, computeSmartness, predatorMove } from './bot.js';
import {
  WORLD_COLS, WORLD_ROWS, VIEW_COLS, VIEW_ROWS,
  TICK_MS, FOOD_COUNT, POINTS_PER_FOOD,
  PLAYER_COLORS, BOT_COLOR, PREDATOR_COLOR,
  MAX_PLAYERS, RESTART_DELAY_MS,
  OBSTACLE_COUNT, PREDATOR_BASE_COUNT, PREDATOR_PER_N_PLAYERS,
  PREDATOR_LENGTH, PREDATOR_MOVE_EVERY,
} from './public/constants.js';

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

const PREDATOR_SPAWNS = [
  { x: 30, y: 30, dir: 'RIGHT' },
  { x: 5,  y: 5,  dir: 'DOWN'  },
];

let nextPlayerId = 1;
const log = (room, ...args) => console.log(`[room ${room}]`, ...args);

export class Game {
  constructor(name) {
    this.name = name;
    this.players = new Map();   // id → { id, ws, name, color, snake, score }
    this.bot = null;            // { snake, score, smartness }
    this.predators = [];        // array of Snake (isPredator: true)
    this.foods = [];
    this.obstacles = [];
    this.tick = 0;
    this.timer = null;
    this.restarting = false;
    this.removeBotNextRound = false;
    this.usedColors = new Set();
  }

  start() {
    this.generateObstacles();
    this.spawnFoods();
    this.spawnPredators();
    this.timer = setInterval(() => this.update(), TICK_MS);
    log(this.name, 'started');
  }

  stop() {
    clearInterval(this.timer);
    log(this.name, 'stopped');
  }

  isEmpty() {
    return this.players.size === 0;
  }

  isFull() {
    return this.players.size >= MAX_PLAYERS;
  }

  // Public summary for the lobby /api/rooms endpoint
  summary() {
    return {
      name: this.name,
      players: this.players.size,
      max: MAX_PLAYERS,
    };
  }

  // ---- Membership ----

  addPlayer(ws, requestedName, requestedColor) {
    if (this.isFull()) return null;

    const id = `p${nextPlayerId++}`;
    const color = this.pickColor(requestedColor);
    this.usedColors.add(color);

    const player = {
      id,
      ws,
      name: this.sanitizeName(requestedName) || `Snake ${this.players.size + 1}`,
      color,
      snake: null,
      score: 0,
    };
    this.buildSnake(player);
    this.players.set(id, player);
    this.updateBotMembership();

    this.send(ws, {
      type: 'welcome',
      playerId: id,
      world: { cols: WORLD_COLS, rows: WORLD_ROWS },
      view:  { cols: VIEW_COLS,  rows: VIEW_ROWS },
      tickMs: TICK_MS,
      obstacles: this.obstacles,
    });

    log(this.name, `+${id} ${player.name} ${color} (${this.players.size}/${MAX_PLAYERS})`);
    return player;
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (!p) return;
    this.usedColors.delete(p.color);
    this.players.delete(id);
    this.updateBotMembership();
    log(this.name, `-${id} (${this.players.size}/${MAX_PLAYERS})`);
  }

  sanitizeName(name) {
    if (typeof name !== 'string') return '';
    // Keep letters, digits, basic punctuation. Strip control chars. Cap length.
    return name.replace(/[^\p{L}\p{N}\s_.\-]/gu, '').trim().slice(0, 12);
  }

  pickColor(requested) {
    // Prefer the requested color if not already taken; otherwise pick the first free one.
    if (requested && PLAYER_COLORS.includes(requested) && !this.usedColors.has(requested)) {
      return requested;
    }
    return PLAYER_COLORS.find(c => !this.usedColors.has(c)) || PLAYER_COLORS[0];
  }

  updateBotMembership() {
    // Bot only when there's exactly 1 human (lonely solo player)
    if (this.players.size === 1 && !this.bot) {
      this.spawnBot();
      log(this.name, 'bot joined');
    } else if (this.players.size >= 2 && this.bot) {
      this.removeBotNextRound = true;
    } else if (this.players.size === 0) {
      this.bot = null;
    }
  }

  spawnBot() {
    const spawn = this.pickSpawn();
    const snake = new Snake('bot', spawn.x, spawn.y, spawn.dir, undefined, { isBot: true });
    snake.name = 'Bot';
    snake.color = BOT_COLOR;
    this.bot = { snake, score: 0, smartness: 1.0 };
  }

  spawnPredators() {
    this.predators = [];
    const count = PREDATOR_BASE_COUNT + Math.floor(this.players.size / PREDATOR_PER_N_PLAYERS);
    for (let i = 0; i < count && i < PREDATOR_SPAWNS.length; i++) {
      const s = PREDATOR_SPAWNS[i];
      const pred = new Snake(`predator${i}`, s.x, s.y, s.dir, PREDATOR_LENGTH, { isPredator: true });
      pred.name = 'Predator';
      pred.color = PREDATOR_COLOR;
      this.predators.push(pred);
    }
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

  // ---- World content ----

  generateObstacles() {
    this.obstacles = [];
    // Don't put obstacles within 4 cells of any spawn point
    const tooClose = (x, y) => SPAWN_POSITIONS.some(s => Math.abs(s.x - x) <= 4 && Math.abs(s.y - y) <= 4);
    let tries = 0;
    while (this.obstacles.length < OBSTACLE_COUNT && tries < 500) {
      tries++;
      const x = Math.floor(Math.random() * WORLD_COLS);
      const y = Math.floor(Math.random() * WORLD_ROWS);
      if (tooClose(x, y)) continue;
      if (this.obstacles.some(o => o.x === x && o.y === y)) continue;
      this.obstacles.push({ x, y });
    }
  }

  allSnakes() {
    const snakes = [];
    for (const p of this.players.values()) snakes.push(p.snake);
    if (this.bot) snakes.push(this.bot.snake);
    for (const p of this.predators) snakes.push(p);
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
      if (this.obstacles.some(o => o.x === x && o.y === y)) continue;
      if (this.allSnakes().some(s => s.body.some(c => c.x === x && c.y === y))) continue;
      return { x, y };
    }
    return { x: 0, y: 0 }; // pathological fallback
  }

  // ---- Messaging ----

  handleMessage(player, msg) {
    if (msg.type === 'direction' && player.snake && player.snake.alive) {
      if (typeof msg.dir === 'string') player.snake.setDirection(msg.dir);
    }
  }

  // ---- Tick ----

  update() {
    if (this.restarting) return;
    this.tick++;

    // Bot picks direction (every tick)
    if (this.bot && this.bot.snake.alive) {
      const dir = botMove(this.bot.snake, this.allSnakes(), this.foods, this.obstacles);
      this.bot.snake.setDirection(dir);
      this.bot.smartness = computeSmartness(this.bot.snake.body.length);
    }

    // Predators pick direction (every PREDATOR_MOVE_EVERY ticks)
    const predatorTurn = this.tick % PREDATOR_MOVE_EVERY === 0;
    if (predatorTurn) {
      for (const p of this.predators) {
        if (!p.alive) continue;
        const dir = predatorMove(p, this.allSnakes());
        p.setDirection(dir);
      }
    }

    // Determine who actually moves this tick (snakes always; predators on their turn)
    const moving = this.allSnakes().filter(s => s.alive && (!s.isPredator || predatorTurn));

    // Peek next head, check for food
    for (const s of moving) {
      const nh = s.nextHead();
      const foodIdx = (s.isPredator) ? -1 : this.foods.findIndex(f => f.x === nh.x && f.y === nh.y);
      s._willEat = foodIdx !== -1;
      s._foodIdx = foodIdx;
    }

    // Step
    for (const s of moving) {
      s.step(s._willEat);
    }

    // Collisions — predators don't die; everyone else can
    for (const s of moving) {
      if (s.isPredator) continue;
      if (s.hitWall() || s.hitSelf() || s.hitOther(this.allSnakes()) || s.hitCells(this.obstacles)) {
        s.alive = false;
      }
    }

    // Award food to alive non-predators
    const eatenIdxs = new Set();
    for (const s of moving) {
      if (!s.alive || s.isPredator) continue;
      if (s._willEat) {
        eatenIdxs.add(s._foodIdx);
        const p = [...this.players.values()].find(p => p.snake === s);
        if (p) p.score += POINTS_PER_FOOD;
        else if (this.bot && this.bot.snake === s) this.bot.score += POINTS_PER_FOOD;
      }
    }
    for (const idx of [...eatenIdxs].sort((a, b) => b - a)) {
      this.foods.splice(idx, 1);
    }
    while (this.foods.length < FOOD_COUNT) this.foods.push(this.makeFood());

    // End-of-round
    const competitors = this.players.size + (this.bot ? 1 : 0);
    const aliveCompetitors = [...this.players.values()].filter(p => p.snake.alive).length
                           + (this.bot && this.bot.snake.alive ? 1 : 0);
    let roundOver = false;
    if (competitors >= 2) {
      if (aliveCompetitors <= 1) roundOver = true;
    } else {
      if (aliveCompetitors === 0) roundOver = true;
    }
    if (roundOver) this.endRound();

    this.broadcastState();
  }

  endRound() {
    this.restarting = true;
    const aliveHumans = [...this.players.values()].filter(p => p.snake.alive);
    const aliveBot = this.bot && this.bot.snake.alive ? [this.bot.snake] : [];
    const winners = [...aliveHumans.map(p => p.snake), ...aliveBot];
    const winner = winners.length === 1 ? winners[0].name : null;
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
    for (const p of this.players.values()) {
      this.buildSnake(p);
      p.score = 0;
    }
    if (this.players.size === 1 && !this.bot) {
      this.spawnBot();
      log(this.name, 'bot joined');
    }
    if (this.bot) {
      const spawn = this.pickSpawn();
      this.bot.snake = new Snake('bot', spawn.x, spawn.y, spawn.dir, undefined, { isBot: true });
      this.bot.snake.name = 'Bot';
      this.bot.snake.color = BOT_COLOR;
      this.bot.score = 0;
    }
    this.spawnPredators();
    this.spawnFoods();
    // Note: obstacles persist across rounds (the world's terrain stays)
    this.tick = 0;
    this.restarting = false;
    log(this.name, 'restarted');
  }

  broadcastState() {
    const scores = {};
    for (const p of this.players.values()) {
      scores[p.id] = { name: p.name, color: p.color, score: p.score, isBot: false };
    }
    if (this.bot) {
      scores['bot'] = {
        name: 'Bot',
        color: BOT_COLOR,
        score: this.bot.score,
        isBot: true,
        smartness: this.bot.smartness,
      };
    }
    this.broadcast({
      type: 'state',
      tick: this.tick,
      snakes: this.allSnakes().map(s => s.serialize()),
      foods: this.foods,
      scores,
      // obstacles sent once on welcome — but include here too in case client reconnected
    });
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
