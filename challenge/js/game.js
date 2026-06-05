// DuelGame — a local, client-side snake match: YOU vs one or more opponents.
// No server. All snakes step at the same time; classic snake rules decide deaths.
//
// Rules (classic — NOT king mode):
//   - hit a wall                  → dead
//   - hit any LIVING snake's body → dead (your own or anyone else's)
//   - head-on-head                → all snakes in that cell die
//   - eat food                    → grow (keep the tail this step)
//   - a dead snake's body vanishes (it stops being an obstacle)
//
// One game's winner:
//   - exactly one snake alive            → that snake wins
//   - all die same tick                  → draw
//   - reach TICK_CAP with >1 alive        → the strictly-longest alive wins
//                                           (you tie for longest → draw)

import { BOARD, FOODS, INIT_LEN, TICK_CAP, COLORS } from './constants.js';

const OPP  = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
const STEP = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };

// Spawn spots, spread around the board. Index 0 is always YOU.
const SPAWNS = [
  { x: 6,          y: BOARD >> 1, dir: 'RIGHT' },
  { x: BOARD - 7,  y: BOARD >> 1, dir: 'LEFT'  },
  { x: BOARD >> 1, y: 6,          dir: 'DOWN'  },
  { x: BOARD >> 1, y: BOARD - 7,  dir: 'UP'    },
];

function makeSnake(spawn, color, isYou) {
  const [dx, dy] = STEP[spawn.dir];
  const body = [];
  for (let i = 0; i < INIT_LEN; i++) body.push({ x: spawn.x - dx * i, y: spawn.y - dy * i });
  return { body, direction: spawn.dir, pending: spawn.dir, alive: true, grow: false, color, isYou };
}

export class DuelGame {
  // foeCount = how many opponents (1 for the normal ladder, 2-3 for expert levels)
  constructor(foeCount = 1) { this.foeCount = foeCount; this.reset(); }

  reset() {
    this.snakes = [];
    this.snakes.push(makeSnake(SPAWNS[0], COLORS.you, true));
    for (let i = 0; i < this.foeCount; i++) {
      this.snakes.push(makeSnake(SPAWNS[(i + 1) % SPAWNS.length], COLORS.foes[i % COLORS.foes.length], false));
    }
    this.foods = [];
    this.tick = 0;
    this.over = false;
    this.winner = null;            // 'you' | 'foe' | 'draw'
    for (let i = 0; i < FOODS; i++) this._spawnFood();
  }

  get you() { return this.snakes[0]; }

  _occupied(x, y) {
    for (const s of this.snakes) for (const c of s.body) if (c.x === x && c.y === y) return true;
    for (const f of this.foods) if (f.x === x && f.y === y) return true;
    return false;
  }
  _spawnFood() {
    let x, y, tries = 0;
    do { x = Math.floor(Math.random() * BOARD); y = Math.floor(Math.random() * BOARD); }
    while (this._occupied(x, y) && ++tries < 200);
    this.foods.push({ x, y });
  }

  setDir(i, dir) {
    if (!STEP[dir]) return;
    const s = this.snakes[i];
    if (!s || !s.alive) return;
    if (OPP[dir] === s.direction) return;   // no 180° reversal
    s.pending = dir;
  }

  // The state a bot sees from snake i's view. Same shape as v3's nextMove(state).
  // `others` lists only LIVING opponents (dead snakes vanish from the board).
  viewFor(i) {
    const me = this.snakes[i];
    const others = [];
    for (let j = 0; j < this.snakes.length; j++) {
      if (j === i || !this.snakes[j].alive) continue;
      const s = this.snakes[j];
      others.push({ body: s.body.map(c => ({ ...c })), direction: s.direction, alive: s.alive });
    }
    return {
      me:    { body: me.body.map(c => ({ ...c })), direction: me.direction, alive: me.alive },
      foods: this.foods.map(f => ({ ...f })),
      others,
      board: { width: BOARD, height: BOARD },
      tick:  this.tick,
    };
  }

  // Advance one tick. `moves` is an array aligned with this.snakes.
  step(moves) {
    if (this.over) return;
    for (let i = 0; i < this.snakes.length; i++) this.setDir(i, moves[i]);
    this.tick++;

    // 1) Move every living snake.
    for (const s of this.snakes) {
      if (!s.alive) continue;
      s.direction = s.pending;
      const [dx, dy] = STEP[s.direction];
      const head = { x: s.body[0].x + dx, y: s.body[0].y + dy };
      s.body.unshift(head);
      const fi = this.foods.findIndex(f => f.x === head.x && f.y === head.y);
      s.grow = fi !== -1;
      s._ate = fi;
      if (!s.grow) s.body.pop();
    }

    // Remove eaten food + respawn.
    const eaten = new Set();
    for (const s of this.snakes) if (s.alive && s._ate >= 0) eaten.add(s._ate);
    [...eaten].sort((a, b) => b - a).forEach(i => this.foods.splice(i, 1));
    while (this.foods.length < FOODS) this._spawnFood();

    // 2) Resolve collisions simultaneously (against post-move bodies of LIVING snakes).
    const inWall = (h) => h.x < 0 || h.x >= BOARD || h.y < 0 || h.y >= BOARD;
    const deaths = this.snakes.map(() => false);
    for (let i = 0; i < this.snakes.length; i++) {
      const s = this.snakes[i];
      if (!s.alive) continue;
      const h = s.body[0];
      if (inWall(h)) { deaths[i] = true; continue; }
      for (let j = 0; j < this.snakes.length; j++) {
        const o = this.snakes[j];
        if (!o.alive) continue;
        if (j !== i && o.body[0].x === h.x && o.body[0].y === h.y) { deaths[i] = true; break; } // head-on-head
        const skip = (j === i) ? 1 : 0;                                                          // skip own head
        let hit = false;
        for (let k = skip; k < o.body.length; k++) if (o.body[k].x === h.x && o.body[k].y === h.y) { hit = true; break; }
        if (hit) { deaths[i] = true; break; }
      }
    }
    this.snakes.forEach((s, i) => { if (deaths[i]) s.alive = false; });

    // 3) Outcome.
    const alive = this.snakes.filter(s => s.alive);
    const you = this.you;
    if (alive.length <= 1) {
      this.over = true;
      if (alive.length === 0) this.winner = 'draw';
      else this.winner = alive[0].isYou ? 'you' : 'foe';
    } else if (this.tick >= TICK_CAP) {
      this.over = true;
      const maxLen = Math.max(...alive.map(s => s.body.length));
      const topCount = alive.filter(s => s.body.length === maxLen).length;
      if (you.alive && you.body.length === maxLen && topCount === 1) this.winner = 'you';
      else if (you.alive && you.body.length === maxLen) this.winner = 'draw';
      else this.winner = 'foe';
    }
  }
}
