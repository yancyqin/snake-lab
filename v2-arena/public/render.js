import {
  CELL_SIZE, WORLD_COLS, WORLD_ROWS, VIEW_COLS, VIEW_ROWS, COLORS,
} from './constants.js';

export class Renderer {
  constructor(canvas, minimap) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimap = minimap;
    this.miniCtx = minimap.getContext('2d');
    canvas.width = VIEW_COLS * CELL_SIZE;
    canvas.height = VIEW_ROWS * CELL_SIZE;
    minimap.width = WORLD_COLS * 3;
    minimap.height = WORLD_ROWS * 3;
  }

  draw(state, myId, obstacles = []) {
    const mySnake = state.snakes.find(s => s.id === myId);
    const focus = mySnake ? mySnake.body[0] : { x: WORLD_COLS / 2, y: WORLD_ROWS / 2 };
    const camX = Math.max(0, Math.min(WORLD_COLS - VIEW_COLS, focus.x - Math.floor(VIEW_COLS / 2)));
    const camY = Math.max(0, Math.min(WORLD_ROWS - VIEW_ROWS, focus.y - Math.floor(VIEW_ROWS / 2)));

    this._drawWorld(state, obstacles, camX, camY, myId);
    this._drawMinimap(state, obstacles, camX, camY);
  }

  _drawWorld(state, obstacles, camX, camY, myId) {
    const ctx = this.ctx;
    const W = VIEW_COLS * CELL_SIZE;
    const H = VIEW_ROWS * CELL_SIZE;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, W, H);

    // Grid
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

    // World edges (highlighted when camera is against them)
    ctx.strokeStyle = COLORS.worldEdge;
    ctx.lineWidth = 4;
    if (camX === 0)                       { ctx.beginPath(); ctx.moveTo(2, 0);     ctx.lineTo(2, H);     ctx.stroke(); }
    if (camX === WORLD_COLS - VIEW_COLS)  { ctx.beginPath(); ctx.moveTo(W - 2, 0); ctx.lineTo(W - 2, H); ctx.stroke(); }
    if (camY === 0)                       { ctx.beginPath(); ctx.moveTo(0, 2);     ctx.lineTo(W, 2);     ctx.stroke(); }
    if (camY === WORLD_ROWS - VIEW_ROWS)  { ctx.beginPath(); ctx.moveTo(0, H - 2); ctx.lineTo(W, H - 2); ctx.stroke(); }

    // Obstacles (rocks)
    for (const o of obstacles) {
      if (!this._inView(o.x, o.y, camX, camY)) continue;
      const sx = (o.x - camX) * CELL_SIZE;
      const sy = (o.y - camY) * CELL_SIZE;
      this._drawRock(sx, sy);
    }

    // Food
    ctx.fillStyle = COLORS.food;
    for (const f of state.foods) {
      if (!this._inView(f.x, f.y, camX, camY)) continue;
      const sx = (f.x - camX) * CELL_SIZE;
      const sy = (f.y - camY) * CELL_SIZE;
      ctx.fillRect(sx + 4, sy + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    }

    // Snakes — draw dead first so alive ones are on top
    const ordered = [...state.snakes].sort((a, b) => (a.alive === b.alive ? 0 : a.alive ? 1 : -1));
    for (const s of ordered) {
      this._drawSnake(s, camX, camY, s.id === myId);
    }
    ctx.globalAlpha = 1.0;
  }

  _drawRock(sx, sy) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.obstacle;
    ctx.fillRect(sx + 2, sy + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    ctx.strokeStyle = COLORS.obstacleBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 3, sy + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    // Inner highlight for a tiny bit of depth
    ctx.fillStyle = '#64748b';
    ctx.fillRect(sx + 6, sy + 6, 4, 4);
  }

  _drawSnake(s, camX, camY, isMe) {
    const ctx = this.ctx;
    ctx.globalAlpha = s.alive ? 1.0 : 0.3;
    const labelName = (s.name || '').toUpperCase();

    for (let i = 0; i < s.body.length; i++) {
      const cell = s.body[i];
      if (!this._inView(cell.x, cell.y, camX, camY)) continue;
      const sx = (cell.x - camX) * CELL_SIZE;
      const sy = (cell.y - camY) * CELL_SIZE;

      if (i === 0) {
        this._drawHead(sx, sy, s, isMe);
      } else {
        // Body cell
        ctx.fillStyle = s.color;
        ctx.fillRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        // Predator body has a darker stripe for menace
        if (s.isPredator) {
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(sx + 4, sy + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        }

        // Name character — repeat across the body. Skip for unnamed (bots, predators).
        if (labelName && !s.isPredator && !s.isBot) {
          const char = labelName[(i - 1) % labelName.length];
          ctx.fillStyle = COLORS.bodyText;
          ctx.font = `bold ${Math.floor(CELL_SIZE * 0.55)}px -apple-system, system-ui, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(char, sx + CELL_SIZE / 2, sy + CELL_SIZE / 2 + 1);
        }
      }
    }
  }

  _drawHead(sx, sy, snake, isMe) {
    const ctx = this.ctx;
    ctx.fillStyle = snake.color;
    ctx.fillRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2);

    // White outline on MY snake's head so I can spot it instantly
    if (isMe) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1.5, sy + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
    }

    // Predator: darker inset + red eye whites (angry)
    if (snake.isPredator) {
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(sx + 4, sy + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    }

    // Eyes — parametric so they scale with CELL_SIZE
    const E    = Math.max(3, Math.floor(CELL_SIZE / 6));
    const back = Math.floor(CELL_SIZE * 0.15);
    const fwd  = CELL_SIZE - E - back;
    const near = Math.floor(CELL_SIZE * 0.22);
    const far  = CELL_SIZE - near - E;
    const eyes = {
      RIGHT: [[sx + fwd,  sy + near], [sx + fwd,  sy + far]],
      LEFT:  [[sx + back, sy + near], [sx + back, sy + far]],
      UP:    [[sx + near, sy + back], [sx + far,  sy + back]],
      DOWN:  [[sx + near, sy + fwd],  [sx + far,  sy + fwd]],
    }[snake.direction];
    ctx.fillStyle = snake.isPredator ? COLORS.predatorEye : COLORS.snakeEye;
    eyes.forEach(([ex, ey]) => ctx.fillRect(ex, ey, E, E));
  }

  _drawMinimap(state, obstacles, camX, camY) {
    const ctx = this.miniCtx;
    const w = this.minimap.width;
    const h = this.minimap.height;
    const sx = w / WORLD_COLS;
    const sy = h / WORLD_ROWS;

    ctx.fillStyle = COLORS.minimapBg;
    ctx.fillRect(0, 0, w, h);

    // Obstacles
    ctx.fillStyle = COLORS.minimapObstacle;
    for (const o of obstacles) {
      ctx.fillRect(o.x * sx, o.y * sy, Math.max(sx, 2), Math.max(sy, 2));
    }

    // Food
    ctx.fillStyle = COLORS.minimapFood;
    for (const f of state.foods) {
      ctx.fillRect(f.x * sx, f.y * sy, Math.max(sx, 2), Math.max(sy, 2));
    }

    // Snakes
    for (const s of state.snakes) {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.alive ? 1 : 0.3;
      for (const cell of s.body) {
        ctx.fillRect(cell.x * sx, cell.y * sy, sx, sy);
      }
    }
    ctx.globalAlpha = 1;

    // Viewport box
    ctx.strokeStyle = COLORS.minimapView;
    ctx.lineWidth = 1;
    ctx.strokeRect(camX * sx + 0.5, camY * sy + 0.5, VIEW_COLS * sx, VIEW_ROWS * sy);
  }

  _inView(x, y, camX, camY) {
    return x >= camX && x < camX + VIEW_COLS && y >= camY && y < camY + VIEW_ROWS;
  }
}
