import { WORLD_COLS, WORLD_ROWS, INITIAL_SNAKE_LENGTH } from './constants.js';

export class Snake {
  constructor(startX, startY, length = INITIAL_SNAKE_LENGTH) {
    // Head at body[0], body extends behind to the left (we start moving RIGHT)
    this.body = [];
    for (let i = 0; i < length; i++) {
      this.body.push({ x: startX - i, y: startY });
    }
    this.direction = 'RIGHT';
    this.pendingDirection = 'RIGHT';
  }

  // Player asked to turn. Ignore 180-degree reversals (can't turn back on yourself).
  setDirection(dir) {
    const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (opposite[dir] === this.direction) return;
    this.pendingDirection = dir;
  }

  // Where the head WOULD be after one more step. Doesn't actually move.
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

  // Move one cell. If `grow` is true, the tail stays (snake gets longer).
  step(grow = false) {
    const next = this.nextHead();
    this.direction = this.pendingDirection;
    this.body.unshift(next);
    if (!grow) this.body.pop();
  }

  head() {
    return this.body[0];
  }

  hitWall() {
    const h = this.head();
    return h.x < 0 || h.x >= WORLD_COLS || h.y < 0 || h.y >= WORLD_ROWS;
  }

  hitSelf() {
    const h = this.head();
    return this.body.slice(1).some(c => c.x === h.x && c.y === h.y);
  }

  isDead() {
    return this.hitWall() || this.hitSelf();
  }

  occupies(x, y) {
    return this.body.some(c => c.x === x && c.y === y);
  }
}
