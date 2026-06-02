import {
  CELL_SIZE, WORLD_COLS, WORLD_ROWS, VIEW_COLS, VIEW_ROWS, COLORS,
} from './constants.js';

// Identical to v2-arena/public/render.js. The renderer doesn't care
// whether the snake is driven by a finger or a function.

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}
function withAlpha(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

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
    this._bgGrad = null;
  }

  draw(state, myId, popups, now) {
    const mySnake = state.snakes.find(s => s.id === myId);
    const focus = mySnake ? mySnake.body[0] : { x: WORLD_COLS / 2, y: WORLD_ROWS / 2 };
    const camX = Math.max(0, Math.min(WORLD_COLS - VIEW_COLS, focus.x - Math.floor(VIEW_COLS / 2)));
    const camY = Math.max(0, Math.min(WORLD_ROWS - VIEW_ROWS, focus.y - Math.floor(VIEW_ROWS / 2)));

    this._drawWorld(state, camX, camY, myId, popups, now);
    this._drawMinimap(state, camX, camY);
  }

  _drawWorld(state, camX, camY, myId, popups, now) {
    const ctx = this.ctx;
    const W = VIEW_COLS * CELL_SIZE;
    const H = VIEW_ROWS * CELL_SIZE;

    if (!this._bgGrad) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
      g.addColorStop(0, COLORS.bgNear);
      g.addColorStop(1, COLORS.bgFar);
      this._bgGrad = g;
    }
    ctx.fillStyle = this._bgGrad;
    ctx.fillRect(0, 0, W, H);

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

    ctx.strokeStyle = COLORS.worldEdge;
    ctx.lineWidth = 4;
    if (camX === 0)                       { ctx.beginPath(); ctx.moveTo(2, 0);     ctx.lineTo(2, H);     ctx.stroke(); }
    if (camX === WORLD_COLS - VIEW_COLS)  { ctx.beginPath(); ctx.moveTo(W - 2, 0); ctx.lineTo(W - 2, H); ctx.stroke(); }
    if (camY === 0)                       { ctx.beginPath(); ctx.moveTo(0, 2);     ctx.lineTo(W, 2);     ctx.stroke(); }
    if (camY === WORLD_ROWS - VIEW_ROWS)  { ctx.beginPath(); ctx.moveTo(0, H - 2); ctx.lineTo(W, H - 2); ctx.stroke(); }

    const t = now / 1000;
    for (const f of state.foods) {
      if (!this._inView(f.x, f.y, camX, camY)) continue;
      const cx = (f.x - camX) * CELL_SIZE + CELL_SIZE / 2;
      const cy = (f.y - camY) * CELL_SIZE + CELL_SIZE / 2;
      const phase = t * 2.5 + (f.x * 0.7 + f.y * 0.5);
      const pulse = 0.85 + 0.15 * Math.sin(phase);
      const baseR = CELL_SIZE * 0.32;
      const r = baseR * pulse;
      ctx.fillStyle = COLORS.foodGlow;
      ctx.beginPath(); ctx.arc(cx, cy, r * 2.0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLORS.food;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }

    const ordered = [...state.snakes].sort((a, b) => (a.alive === b.alive ? 0 : a.alive ? 1 : -1));
    for (const s of ordered) {
      this._drawSnake(s, camX, camY, s.id === myId);
    }
    ctx.globalAlpha = 1.0;

    this._drawPopups(popups, camX, camY, now);
  }

  _drawSnake(s, camX, camY, isMe) {
    const ctx = this.ctx;
    ctx.globalAlpha = s.alive ? 1.0 : 0.35;

    if (s.body.length >= 2) {
      ctx.strokeStyle = COLORS.bodyOutline;
      ctx.lineWidth = CELL_SIZE * 0.92;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this._tracePath(s.body, camX, camY);
      ctx.stroke();

      ctx.strokeStyle = s.color;
      ctx.lineWidth = CELL_SIZE * 0.78;
      this._tracePath(s.body, camX, camY);
      ctx.stroke();
    } else {
      const c = s.body[0];
      if (this._inView(c.x, c.y, camX, camY)) {
        const cx = (c.x - camX) * CELL_SIZE + CELL_SIZE / 2;
        const cy = (c.y - camY) * CELL_SIZE + CELL_SIZE / 2;
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(cx, cy, CELL_SIZE * 0.42, 0, Math.PI * 2); ctx.fill();
      }
    }

    const labelName = (s.name || '').toUpperCase();
    if (labelName && s.body.length > 1) {
      const padded = labelName + ' ';
      ctx.fillStyle = COLORS.bodyText;
      ctx.font = `bold ${Math.floor(CELL_SIZE * 0.5)}px -apple-system, system-ui, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 1; i < s.body.length; i++) {
        const cell = s.body[i];
        if (!this._inView(cell.x, cell.y, camX, camY)) continue;
        const char = padded[(i - 1) % padded.length];
        if (char === ' ') continue;
        const cx = (cell.x - camX) * CELL_SIZE + CELL_SIZE / 2;
        const cy = (cell.y - camY) * CELL_SIZE + CELL_SIZE / 2;
        ctx.fillText(char, cx, cy + 1);
      }
    }

    const head = s.body[0];
    if (this._inView(head.x, head.y, camX, camY)) {
      this._drawHead(head, s, camX, camY, isMe);
    }
  }

  _tracePath(body, camX, camY) {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < body.length; i++) {
      const c = body[i];
      const x = (c.x - camX) * CELL_SIZE + CELL_SIZE / 2;
      const y = (c.y - camY) * CELL_SIZE + CELL_SIZE / 2;
      if (i === 0) ctx.moveTo(x, y);
      else         ctx.lineTo(x, y);
    }
  }

  _drawHead(head, snake, camX, camY, isMe) {
    const ctx = this.ctx;
    const cx = (head.x - camX) * CELL_SIZE + CELL_SIZE / 2;
    const cy = (head.y - camY) * CELL_SIZE + CELL_SIZE / 2;
    const r = CELL_SIZE * 0.48;

    ctx.fillStyle = darken(snake.color, 0.35);
    ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = snake.color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    if (isMe && snake.alive) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();
    }

    if (!snake.alive) this._drawDeadEyes(cx, cy, snake.direction, r);
    else              this._drawLiveEyes(cx, cy, snake.direction, r);
  }

  _drawLiveEyes(cx, cy, dir, r) {
    const ctx = this.ctx;
    const E = Math.max(3, Math.floor(CELL_SIZE / 7));
    const fwd = r * 0.45;
    const side = r * 0.45;

    let e1, e2;
    if (dir === 'RIGHT') { e1 = [cx + fwd, cy - side]; e2 = [cx + fwd, cy + side]; }
    if (dir === 'LEFT')  { e1 = [cx - fwd, cy - side]; e2 = [cx - fwd, cy + side]; }
    if (dir === 'UP')    { e1 = [cx - side, cy - fwd]; e2 = [cx + side, cy - fwd]; }
    if (dir === 'DOWN')  { e1 = [cx - side, cy + fwd]; e2 = [cx + side, cy + fwd]; }

    ctx.fillStyle = '#fef2f2';
    ctx.beginPath(); ctx.arc(e1[0], e1[1], E, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2[0], e2[1], E, 0, Math.PI * 2); ctx.fill();
    const pupilOff = E * 0.35;
    const off = {
      RIGHT: [pupilOff, 0], LEFT: [-pupilOff, 0], UP: [0, -pupilOff], DOWN: [0, pupilOff],
    }[dir];
    ctx.fillStyle = COLORS.snakeEye;
    ctx.beginPath(); ctx.arc(e1[0] + off[0], e1[1] + off[1], E * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2[0] + off[0], e2[1] + off[1], E * 0.55, 0, Math.PI * 2); ctx.fill();
  }

  _drawDeadEyes(cx, cy, dir, r) {
    const ctx = this.ctx;
    const fwd = r * 0.45;
    const side = r * 0.45;
    const E = Math.max(3, Math.floor(CELL_SIZE / 7));

    let e1, e2;
    if (dir === 'RIGHT') { e1 = [cx + fwd, cy - side]; e2 = [cx + fwd, cy + side]; }
    if (dir === 'LEFT')  { e1 = [cx - fwd, cy - side]; e2 = [cx - fwd, cy + side]; }
    if (dir === 'UP')    { e1 = [cx - side, cy - fwd]; e2 = [cx + side, cy - fwd]; }
    if (dir === 'DOWN')  { e1 = [cx - side, cy + fwd]; e2 = [cx + side, cy + fwd]; }

    ctx.strokeStyle = COLORS.snakeEye;
    ctx.lineWidth = 2;
    const drawX = ([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - E, y - E); ctx.lineTo(x + E, y + E);
      ctx.moveTo(x + E, y - E); ctx.lineTo(x - E, y + E);
      ctx.stroke();
    };
    drawX(e1); drawX(e2);
  }

  _drawPopups(popups, camX, camY, now) {
    if (!popups || popups.length === 0) return;
    const ctx = this.ctx;
    const LIFETIME = 900;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of popups) {
      const age = now - p.startTime;
      if (age > LIFETIME) continue;
      if (!this._inView(p.cellX, p.cellY, camX, camY)) continue;
      const progress = age / LIFETIME;
      const alpha = Math.max(0, 1 - progress);
      const drift = progress * 36;
      const sx = (p.cellX - camX) * CELL_SIZE + CELL_SIZE / 2;
      const sy = (p.cellY - camY) * CELL_SIZE + CELL_SIZE / 2 - drift;
      ctx.font = `bold 18px -apple-system, system-ui, sans-serif`;
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.6})`;
      ctx.fillText(p.text, sx + 1, sy + 1);
      ctx.fillStyle = withAlpha(p.color || '#ffffff', alpha);
      ctx.fillText(p.text, sx, sy);
    }
  }

  _drawMinimap(state, camX, camY) {
    const ctx = this.miniCtx;
    const w = this.minimap.width;
    const h = this.minimap.height;
    const sx = w / WORLD_COLS;
    const sy = h / WORLD_ROWS;

    ctx.fillStyle = COLORS.minimapBg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = COLORS.minimapFood;
    for (const f of state.foods) {
      ctx.fillRect(f.x * sx, f.y * sy, Math.max(sx, 2), Math.max(sy, 2));
    }

    for (const s of state.snakes) {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.alive ? 1 : 0.3;
      for (const cell of s.body) {
        ctx.fillRect(cell.x * sx, cell.y * sy, sx, sy);
      }
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = COLORS.minimapView;
    ctx.lineWidth = 1;
    ctx.strokeRect(camX * sx + 0.5, camY * sy + 0.5, VIEW_COLS * sx, VIEW_ROWS * sy);
  }

  _inView(x, y, camX, camY) {
    return x >= camX && x < camX + VIEW_COLS && y >= camY && y < camY + VIEW_ROWS;
  }
}
