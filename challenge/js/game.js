// DuelGame — a local, client-side 1v1 snake match. No server.
// Two snakes step at the same time; classic snake rules decide who dies.
//
// Rules (same as v1/v2 "regular" mode — NOT king mode):
//   - hit a wall            → dead
//   - hit any snake's body  → dead (your own or the foe's)
//   - head-on-head          → BOTH dead
//   - eat food              → grow (don't drop the tail this step)
//
// Win of a single game:
//   - one snake dead, other alive  → the alive one wins
//   - both dead same tick          → draw
//   - both alive at TICK_CAP       → longer snake wins (tie = draw)

import { BOARD, FOODS, INIT_LEN, TICK_CAP } from './constants.js';

const OPP = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
const STEP = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };

function makeSnake(x, y, dir) {
  // body[0] = head; tail extends opposite the facing direction
  const [dx, dy] = STEP[dir];
  const body = [];
  for (let i = 0; i < INIT_LEN; i++) body.push({ x: x - dx * i, y: y - dy * i });
  return { body, direction: dir, pending: dir, alive: true, grow: false };
}

export class DuelGame {
  constructor() { this.reset(); }

  reset() {
    // You spawn on the left facing right; the foe on the right facing left.
    const midY = Math.floor(BOARD / 2);
    this.you = makeSnake(6, midY, 'RIGHT');
    this.foe = makeSnake(BOARD - 7, midY, 'LEFT');
    this.foods = [];
    this.tick = 0;
    this.over = false;
    this.winner = null;            // 'you' | 'foe' | 'draw'
    for (let i = 0; i < FOODS; i++) this._spawnFood();
  }

  _occupied(x, y) {
    for (const s of [this.you, this.foe])
      for (const c of s.body) if (c.x === x && c.y === y) return true;
    for (const f of this.foods) if (f.x === x && f.y === y) return true;
    return false;
  }

  _spawnFood() {
    let x, y, tries = 0;
    do {
      x = Math.floor(Math.random() * BOARD);
      y = Math.floor(Math.random() * BOARD);
    } while (this._occupied(x, y) && ++tries < 200);
    this.foods.push({ x, y });
  }

  // Ask a snake to turn. 180° reversals are ignored (you can't turn back on yourself).
  setDir(who, dir) {
    if (!STEP[dir]) return;
    const s = who === 'you' ? this.you : this.foe;
    if (OPP[dir] === s.direction) return;
    s.pending = dir;
  }

  // The state object a bot sees — identical shape to v3's nextMove(state).
  viewFor(who) {
    const me  = who === 'you' ? this.you : this.foe;
    const oth = who === 'you' ? this.foe : this.you;
    return {
      me:    { body: me.body.map(c => ({ ...c })), direction: me.direction, alive: me.alive },
      foods: this.foods.map(f => ({ ...f })),
      others: [{ body: oth.body.map(c => ({ ...c })), direction: oth.direction, alive: oth.alive }],
      board: { width: BOARD, height: BOARD },
      tick:  this.tick,
    };
  }

  // Advance one tick. youDir / foeDir are the chosen moves this tick.
  step(youDir, foeDir) {
    if (this.over) return;
    this.setDir('you', youDir);
    this.setDir('foe', foeDir);
    this.tick++;

    // 1) Move both snakes (apply pending dir, add head, drop tail unless growing).
    for (const s of [this.you, this.foe]) {
      if (!s.alive) continue;
      s.direction = s.pending;
      const [dx, dy] = STEP[s.direction];
      const head = { x: s.body[0].x + dx, y: s.body[0].y + dy };
      s.body.unshift(head);

      // Eat? (check against current foods BEFORE removing — both snakes see the same board)
      const fi = this.foods.findIndex(f => f.x === head.x && f.y === head.y);
      s.grow = fi !== -1;
      s._ateIdx = fi;
      if (!s.grow) s.body.pop();
    }

    // Remove eaten food + respawn (after both moved, so a shared cell is handled once).
    const eaten = new Set();
    for (const s of [this.you, this.foe]) if (s.alive && s._ateIdx >= 0) eaten.add(s._ateIdx);
    [...eaten].sort((a, b) => b - a).forEach(i => this.foods.splice(i, 1));
    while (this.foods.length < FOODS) this._spawnFood();

    // 2) Collisions — evaluate AFTER both have moved (simultaneous).
    const you = this.you, foe = this.foe;
    const hx = you.body[0], fxh = foe.body[0];
    const inWall = (h) => h.x < 0 || h.x >= BOARD || h.y < 0 || h.y >= BOARD;
    const onBody = (h, body, skipHead) => body.some((c, i) => (skipHead ? i > 0 : true) && c.x === h.x && c.y === h.y);

    const headOnHead = you.alive && foe.alive && hx.x === fxh.x && hx.y === fxh.y;

    if (you.alive) {
      if (inWall(hx) || onBody(hx, you.body, true) || onBody(hx, foe.body, false) || headOnHead) you.alive = false;
    }
    if (foe.alive) {
      if (inWall(fxh) || onBody(fxh, foe.body, true) || onBody(fxh, you.body, false) || headOnHead) foe.alive = false;
    }

    // 3) Decide the game outcome.
    if (!you.alive || !foe.alive) {
      this.over = true;
      if (!you.alive && !foe.alive) this.winner = 'draw';
      else if (!you.alive)          this.winner = 'foe';
      else                          this.winner = 'you';
    } else if (this.tick >= TICK_CAP) {
      this.over = true;
      if (you.body.length > foe.body.length) this.winner = 'you';
      else if (foe.body.length > you.body.length) this.winner = 'foe';
      else this.winner = 'draw';
    }
  }
}
