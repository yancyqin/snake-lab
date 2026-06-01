import {
  CELL_SIZE, WORLD_COLS, WORLD_ROWS, VIEW_COLS, VIEW_ROWS,
  TICK_MS, COLORS, POINTS_PER_FOOD, FOOD_COUNT,
} from './constants.js';
import { Snake } from './Snake.js';
import { Food } from './Food.js';

export class Game {
  constructor(canvas, minimap, scoreEl, gameOverEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimap = minimap;
    this.miniCtx = minimap.getContext('2d');
    this.scoreEl = scoreEl;
    this.gameOverEl = gameOverEl;

    canvas.width = VIEW_COLS * CELL_SIZE;
    canvas.height = VIEW_ROWS * CELL_SIZE;
    minimap.width = WORLD_COLS * 3;   // 3 pixels per world cell
    minimap.height = WORLD_ROWS * 3;

    this._bindKeys();
    this._bindTouch();
    this.reset();
  }

  reset() {
    const cx = Math.floor(WORLD_COLS / 2);
    const cy = Math.floor(WORLD_ROWS / 2);
    this.snake = new Snake(cx, cy);
    this.foods = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
      const f = new Food();
      f.spawn(this.snake, this.foods);
      this.foods.push(f);
    }
    this.score = 0;
    this.over = false;
    this.gameOverEl.style.display = 'none';
    this._updateScore();

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.draw();
  }

  tick() {
    if (this.over) return;

    const next = this.snake.nextHead();
    const eatenIndex = this.foods.findIndex(f => f.x === next.x && f.y === next.y);
    const willEat = eatenIndex !== -1;

    this.snake.step(willEat);

    if (this.snake.isDead()) {
      this.over = true;
      clearInterval(this.timer);
      this.gameOverEl.style.display = 'block';
      this.draw();
      return;
    }

    if (willEat) {
      this.score += POINTS_PER_FOOD;
      this._updateScore();
      this.foods[eatenIndex].spawn(this.snake, this.foods);
    }

    this.draw();
  }

  // Camera position — top-left world cell shown on screen.
  // Clamped so we never scroll past the world edge.
  cameraX() {
    const half = Math.floor(VIEW_COLS / 2);
    return Math.max(0, Math.min(WORLD_COLS - VIEW_COLS, this.snake.head().x - half));
  }
  cameraY() {
    const half = Math.floor(VIEW_ROWS / 2);
    return Math.max(0, Math.min(WORLD_ROWS - VIEW_ROWS, this.snake.head().y - half));
  }

  draw() {
    this._drawWorld();
    this._drawMinimap();
  }

  _drawWorld() {
    const ctx = this.ctx;
    const camX = this.cameraX();
    const camY = this.cameraY();
    const W = VIEW_COLS * CELL_SIZE;
    const H = VIEW_ROWS * CELL_SIZE;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, W, H);

    // Grid lines (the +0.5 keeps lines crisp at 1px width)
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= VIEW_COLS; i++) {
      const x = i * CELL_SIZE + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let j = 0; j <= VIEW_ROWS; j++) {
      const y = j * CELL_SIZE + 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // World edges — only drawn if the camera is up against them
    ctx.strokeStyle = COLORS.worldEdge;
    ctx.lineWidth = 4;
    if (camX === 0)                       { ctx.beginPath(); ctx.moveTo(2, 0);     ctx.lineTo(2, H);     ctx.stroke(); }
    if (camX === WORLD_COLS - VIEW_COLS)  { ctx.beginPath(); ctx.moveTo(W - 2, 0); ctx.lineTo(W - 2, H); ctx.stroke(); }
    if (camY === 0)                       { ctx.beginPath(); ctx.moveTo(0, 2);     ctx.lineTo(W, 2);     ctx.stroke(); }
    if (camY === WORLD_ROWS - VIEW_ROWS)  { ctx.beginPath(); ctx.moveTo(0, H - 2); ctx.lineTo(W, H - 2); ctx.stroke(); }

    // Food (only the ones visible)
    ctx.fillStyle = COLORS.food;
    for (const food of this.foods) {
      if (!this._inView(food.x, food.y, camX, camY)) continue;
      const sx = (food.x - camX) * CELL_SIZE;
      const sy = (food.y - camY) * CELL_SIZE;
      ctx.fillRect(sx + 3, sy + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    }

    // Snake (only the cells visible)
    this.snake.body.forEach((cell, i) => {
      if (!this._inView(cell.x, cell.y, camX, camY)) return;
      const sx = (cell.x - camX) * CELL_SIZE;
      const sy = (cell.y - camY) * CELL_SIZE;
      if (i === 0) {
        this._drawHead(sx, sy);
      } else {
        ctx.fillStyle = COLORS.snakeBody;
        ctx.fillRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
    });
  }

  _drawHead(sx, sy) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.snakeHead;
    ctx.fillRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2);

    // Eyes — position depends on direction so the snake "looks" where it's going.
    // Positions are computed from CELL_SIZE so the eyes scale if you change it.
    ctx.fillStyle = COLORS.snakeEye;
    const E      = Math.max(3, Math.floor(CELL_SIZE / 6));     // eye size
    const back   = Math.floor(CELL_SIZE * 0.15);               // dist from trailing edge to eye
    const fwd    = CELL_SIZE - E - back;                       // dist from leading edge to eye corner
    const near   = Math.floor(CELL_SIZE * 0.22);               // top/left eye offset
    const far    = CELL_SIZE - near - E;                       // bottom/right eye offset

    const eyes = {
      RIGHT: [[sx + fwd,  sy + near], [sx + fwd,  sy + far]],
      LEFT:  [[sx + back, sy + near], [sx + back, sy + far]],
      UP:    [[sx + near, sy + back], [sx + far,  sy + back]],
      DOWN:  [[sx + near, sy + fwd],  [sx + far,  sy + fwd]],
    }[this.snake.direction];
    eyes.forEach(([ex, ey]) => ctx.fillRect(ex, ey, E, E));
  }

  _drawMinimap() {
    const ctx = this.miniCtx;
    const w = this.minimap.width;
    const h = this.minimap.height;
    const sx = w / WORLD_COLS;   // pixels per world cell
    const sy = h / WORLD_ROWS;

    ctx.fillStyle = COLORS.minimapBg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = COLORS.minimapFood;
    for (const food of this.foods) {
      ctx.fillRect(food.x * sx, food.y * sy, Math.max(sx, 2), Math.max(sy, 2));
    }

    ctx.fillStyle = COLORS.minimapSnake;
    for (const cell of this.snake.body) {
      ctx.fillRect(cell.x * sx, cell.y * sy, sx, sy);
    }

    // Viewport rectangle — shows what part of the world is on the main screen
    ctx.strokeStyle = COLORS.minimapView;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      this.cameraX() * sx + 0.5,
      this.cameraY() * sy + 0.5,
      VIEW_COLS * sx,
      VIEW_ROWS * sy,
    );
  }

  _inView(x, y, camX, camY) {
    return x >= camX && x < camX + VIEW_COLS && y >= camY && y < camY + VIEW_ROWS;
  }

  _updateScore() {
    this.scoreEl.textContent = `Score: ${this.score}`;
  }

  _bindKeys() {
    const map = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
    };
    document.addEventListener('keydown', (e) => {
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      this.snake.setDirection(dir);
    });
  }

  _bindTouch() {
    // Swipe gesture detection on the canvas — for iPad / phone.
    // The shorter axis is ignored; whichever direction you swiped further wins.
    let startX = 0, startY = 0;
    const MIN_SWIPE = 20;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const absX = Math.abs(dx), absY = Math.abs(dy);
      if (Math.max(absX, absY) < MIN_SWIPE) return;
      if (absX > absY) {
        this.snake.setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        this.snake.setDirection(dy > 0 ? 'DOWN' : 'UP');
      }
    }, { passive: false });
  }
}
