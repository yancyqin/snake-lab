import { WORLD_COLS, WORLD_ROWS, INITIAL_SNAKE_LENGTH } from './public/constants.js';

// Identical to v2-arena/snake.js. v3 doesn't add new snake state; the
// only difference vs v2 is who picks `direction` (a bot fn instead of a finger).

const BEHIND = {
  RIGHT: { dx: -1, dy: 0 },
  LEFT:  { dx:  1, dy: 0 },
  UP:    { dx: 0,  dy: 1 },
  DOWN:  { dx: 0,  dy: -1 },
};

export class Snake {
  constructor(id, startX, startY, direction = 'RIGHT', length = INITIAL_SNAKE_LENGTH, options = {}) {
    this.id = id;
    this.body = [];
    const off = BEHIND[direction];
    for (let i = 0; i < length; i++) {
      this.body.push({ x: startX + off.dx * i, y: startY + off.dy * i });
    }
    this.direction = direction;
    this.pendingDirection = direction;
    this.alive = true;
    this.isBot = options.isBot || false;
    this.name = '';
    this.color = '#4ade80';
  }

  setDirection(dir) {
    const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (opposite[dir] === this.direction) return;
    this.pendingDirection = dir;
  }

  nextHead() {
    const head = this.body[0];
    const next = { x: head.x, y: head.y };
    const dir = this.pendingDirection;
    if (dir === 'UP')    next.y -= 1;
    if (dir === 'DOWN')  next.y += 1;
    if (dir === 'LEFT')  next.x -= 1;
    if (dir === 'RIGHT') next.x += 1;
    return next;
  }

  step(grow = false) {
    const next = this.nextHead();
    this.direction = this.pendingDirection;
    this.body.unshift(next);
    if (!grow) this.body.pop();
  }

  head() { return this.body[0]; }

  hitWall() {
    const h = this.head();
    return h.x < 0 || h.x >= WORLD_COLS || h.y < 0 || h.y >= WORLD_ROWS;
  }

  hitSelf() {
    const h = this.head();
    return this.body.slice(1).some(c => c.x === h.x && c.y === h.y);
  }

  hitOther(others) {
    const h = this.head();
    for (const other of others) {
      if (other === this) continue;
      if (other.body.some(c => c.x === h.x && c.y === h.y)) return true;
    }
    return false;
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      body: this.body,
      direction: this.direction,
      alive: this.alive,
      isBot: this.isBot,
    };
  }
}
