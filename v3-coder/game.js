import { Snake } from './snake.js';
import { botMove, computeSmartness } from './bot.js';
import {
  WORLD_COLS, WORLD_ROWS, VIEW_COLS, VIEW_ROWS,
  TICK_MS, FOOD_COUNT, POINTS_PER_FOOD,
  PLAYER_COLORS, BOT_COLOR, FUNNY_NAMES,
  MAX_PLAYERS, RESTART_DELAY_MS,
} from './public/constants.js';

// Identical to v2-arena/game.js. v3's bots are just clients that send
// `direction` messages from JavaScript instead of from a finger swipe.

function pickFunnyName() {
  return FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)];
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
  constructor(name) {
    this.name = name;
    this.players = new Map();
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
    this.timer = setInterval(() => this.update(), TICK_MS);
    log(this.name, 'started');
  }

  stop() {
    clearInterval(this.timer);
    log(this.name, 'stopped');
  }

  isEmpty() { return this.players.size === 0; }
  isFull()  { return this.players.size >= MAX_PLAYERS; }
  summary() { return { name: this.name, players: this.players.size, max: MAX_PLAYERS }; }

  addPlayer(ws, requestedName, requestedColor) {
    if (this.isFull()) return null;

    const id = `p${nextPlayerId++}`;
    const color = this.pickColor(requestedColor);
    this.usedColors.add(color);

    const player = {
      id, ws, color,
      name: this.sanitizeName(requestedName) || `Snake ${this.players.size + 1}`,
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
    });

    log(this.name, `+${id} ${player.name} ${color} (${this.players.size}/${MAX_PLAYERS})`);

    if (this.players.size >= 2 && !this.restarting) {
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
    this.usedColors.delete(p.color);
    this.players.delete(id);
    this.updateBotMembership();
    log(this.name, `-${id} (${this.players.size}/${MAX_PLAYERS})`);
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

  allSnakes() {
    const snakes = [];
    for (const p of this.players.values()) snakes.push(p.snake);
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

  handleMessage(player, msg) {
    if (msg.type === 'direction' && player.snake && player.snake.alive) {
      if (typeof msg.dir === 'string') player.snake.setDirection(msg.dir);
    }
  }

  update() {
    if (this.restarting) return;
    this.tick++;

    if (this.bot && this.bot.snake.alive) {
      const dir = botMove(this.bot.snake, this.allSnakes(), this.foods);
      this.bot.snake.setDirection(dir);
      this.bot.smartness = computeSmartness(this.bot.snake.body.length);
    }

    const alive = this.allSnakes().filter(s => s.alive);

    for (const s of alive) {
      const nh = s.nextHead();
      const foodIdx = this.foods.findIndex(f => f.x === nh.x && f.y === nh.y);
      s._willEat = foodIdx !== -1;
      s._foodIdx = foodIdx;
    }
    for (const s of alive) s.step(s._willEat);

    for (const s of alive) {
      if (s.hitWall() || s.hitSelf() || s.hitOther(this.allSnakes())) {
        s.alive = false;
      }
    }

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

    const total = this.players.size + (this.bot ? 1 : 0);
    const aliveCount = [...this.players.values()].filter(p => p.snake.alive).length
                     + (this.bot && this.bot.snake.alive ? 1 : 0);
    let over = false;
    if (total >= 2) { if (aliveCount <= 1) over = true; }
    else            { if (aliveCount === 0) over = true; }
    if (over) this.endRound();

    this.broadcastState();
  }

  endRound() {
    this.restarting = true;
    const survivors = [...this.players.values()].filter(p => p.snake.alive).map(p => p.snake);
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
    this.broadcast({
      type: 'state',
      tick: this.tick,
      snakes: this.allSnakes().map(s => s.serialize()),
      foods: this.foods,
      scores,
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
