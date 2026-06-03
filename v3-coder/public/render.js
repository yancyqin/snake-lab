import {
  CELL_SIZE as BASE_CELL_SIZE,
  VIEW_COLS as BASE_VIEW_COLS,
  VIEW_ROWS as BASE_VIEW_ROWS,
  WORLD_COLS, WORLD_ROWS, COLORS, FOG_RADIUS,
} from './constants.js';

// --- tiny color helpers (so we don't add a dependency) ---
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
  constructor(canvas, minimap, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimap = minimap;
    this.miniCtx = minimap.getContext('2d');
    this._bgGrad = null;
    this._applyView(opts);
  }

  // Pick the visible area + cell size. Player view follows the head;
  // teacher view ("fullWorld") shows the whole 60×60 map at once.
  _applyView(opts = {}) {
    if (opts.fullWorld) {
      this.viewCols = WORLD_COLS;
      this.viewRows = WORLD_ROWS;
      this.cellSize = 18;                       // 60×18 = 1080px — the whole map, big enough to read across the room
      if (this.minimap) this.minimap.style.display = 'none';
    } else {
      this.viewCols = BASE_VIEW_COLS;
      this.viewRows = BASE_VIEW_ROWS;
      this.cellSize = BASE_CELL_SIZE;
      if (this.minimap) this.minimap.style.display = '';
    }
    this.canvas.width  = this.viewCols * this.cellSize;
    this.canvas.height = this.viewRows * this.cellSize;
    this.minimap.width  = WORLD_COLS * 3;
    this.minimap.height = WORLD_ROWS * 3;
    this._bgGrad = null;                        // canvas resized → regenerate gradient
  }

  setFullWorld(fullWorld) {
    this._applyView({ fullWorld });
  }

  // `popups` is an array of { cellX, cellY, text, color, startTime } (ms)
  // `now` is performance.now()
  draw(state, myId, popups, now, opts = {}) {
    const mySnake = state.snakes.find(s => s.id === myId);
    const focus = mySnake ? mySnake.body[0] : { x: WORLD_COLS / 2, y: WORLD_ROWS / 2 };
    const camX = Math.max(0, Math.min(WORLD_COLS - this.viewCols, focus.x - Math.floor(this.viewCols / 2)));
    const camY = Math.max(0, Math.min(WORLD_ROWS - this.viewRows, focus.y - Math.floor(this.viewRows / 2)));

    this._drawWorld(state, camX, camY, myId, popups, now);
    // Fog overlay — applied AFTER drawing the world so visible cells stay sharp.
    // Only when fogMode is on and I have an alive snake to center the radius on.
    if (opts.fogMode && mySnake && mySnake.alive) {
      this._drawFog(mySnake.body[0], camX, camY, opts.fogRadius || FOG_RADIUS);
    }
    this._drawMinimap(state, camX, camY);
  }

  _drawFog(head, camX, camY, radiusCells) {
    const ctx = this.ctx;
    const W = this.viewCols * this.cellSize;
    const H = this.viewRows * this.cellSize;
    const cx = (head.x - camX) * this.cellSize + this.cellSize / 2;
    const cy = (head.y - camY) * this.cellSize + this.cellSize / 2;
    const inner = radiusCells * this.cellSize * 0.78;
    const outer = radiusCells * this.cellSize * 1.05;
    const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    grad.addColorStop(0, 'rgba(7, 7, 14, 0)');
    grad.addColorStop(1, 'rgba(7, 7, 14, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  _drawWorld(state, camX, camY, myId, popups, now) {
    const ctx = this.ctx;
    const W = this.viewCols * this.cellSize;
    const H = this.viewRows * this.cellSize;

    // Background — radial gradient (warmer in center, darker at edges)
    if (!this._bgGrad) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
      g.addColorStop(0, COLORS.bgNear);
      g.addColorStop(1, COLORS.bgFar);
      this._bgGrad = g;
    }
    ctx.fillStyle = this._bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid — much less prominent than v2.1
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.viewCols; i++) {
      const x = i * this.cellSize + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let j = 0; j <= this.viewRows; j++) {
      const y = j * this.cellSize + 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // World edges
    ctx.strokeStyle = COLORS.worldEdge;
    ctx.lineWidth = 4;
    if (camX === 0)                       { ctx.beginPath(); ctx.moveTo(2, 0);     ctx.lineTo(2, H);     ctx.stroke(); }
    if (camX === WORLD_COLS - this.viewCols)  { ctx.beginPath(); ctx.moveTo(W - 2, 0); ctx.lineTo(W - 2, H); ctx.stroke(); }
    if (camY === 0)                       { ctx.beginPath(); ctx.moveTo(0, 2);     ctx.lineTo(W, 2);     ctx.stroke(); }
    if (camY === WORLD_ROWS - this.viewRows)  { ctx.beginPath(); ctx.moveTo(0, H - 2); ctx.lineTo(W, H - 2); ctx.stroke(); }

    // Food — pulsing circles with a soft glow halo
    const t = now / 1000;
    for (const f of state.foods) {
      if (!this._inView(f.x, f.y, camX, camY)) continue;
      const cx = (f.x - camX) * this.cellSize + this.cellSize / 2;
      const cy = (f.y - camY) * this.cellSize + this.cellSize / 2;
      // Per-food phase offset so they don't all pulse in lockstep
      const phase = t * 2.5 + (f.x * 0.7 + f.y * 0.5);
      const pulse = 0.85 + 0.15 * Math.sin(phase);
      const baseR = this.cellSize * 0.32;
      const r = baseR * pulse;

      // Glow halo
      ctx.fillStyle = COLORS.foodGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.0, 0, Math.PI * 2);
      ctx.fill();
      // Solid core
      ctx.fillStyle = COLORS.food;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snakes — dead first so alive ones cover them
    const ordered = [...state.snakes].sort((a, b) => (a.alive === b.alive ? 0 : a.alive ? 1 : -1));
    for (const s of ordered) {
      this._drawSnake(s, camX, camY, s.id === myId);
    }
    ctx.globalAlpha = 1.0;

    // Score popups (drawn on top of everything)
    this._drawPopups(popups, camX, camY, now);
  }

  _drawSnake(s, camX, camY, isMe) {
    const ctx = this.ctx;
    const alive = s.alive;
    ctx.globalAlpha = alive ? 1.0 : 0.35;

    // --- Body as continuous rounded path ---
    if (s.body.length >= 2) {
      // Outer stroke (dark outline)
      ctx.strokeStyle = COLORS.bodyOutline;
      ctx.lineWidth = this.cellSize * 0.92;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this._tracePath(s.body, camX, camY);
      ctx.stroke();

      // Inner stroke (snake color)
      ctx.strokeStyle = s.color;
      ctx.lineWidth = this.cellSize * 0.78;
      this._tracePath(s.body, camX, camY);
      ctx.stroke();
    } else {
      // Single-cell snake — draw a dot
      const c = s.body[0];
      if (this._inView(c.x, c.y, camX, camY)) {
        const cx = (c.x - camX) * this.cellSize + this.cellSize / 2;
        const cy = (c.y - camY) * this.cellSize + this.cellSize / 2;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(cx, cy, this.cellSize * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // In fog mode the server may send a partial snake (only the cells within
    // my radius). `headVisible: false` means body[0] is NOT the real head —
    // it's just the first visible body cell. We skip the head decoration and
    // the name letters because we don't know which cell is which.
    const hasHead = s.headVisible !== false;

    // --- Name letters along the body (only when head is visible — we know
    // which cell is body[1], body[2], etc.) ---
    const labelName = (s.name || '').toUpperCase();
    if (hasHead && labelName && s.body.length > 1) {
      const padded = labelName + ' ';
      ctx.fillStyle = COLORS.bodyText;
      ctx.font = `bold ${Math.floor(this.cellSize * 0.5)}px -apple-system, system-ui, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 1; i < s.body.length; i++) {
        const cell = s.body[i];
        if (!this._inView(cell.x, cell.y, camX, camY)) continue;
        const char = padded[(i - 1) % padded.length];
        if (char === ' ') continue;
        const cx = (cell.x - camX) * this.cellSize + this.cellSize / 2;
        const cy = (cell.y - camY) * this.cellSize + this.cellSize / 2;
        ctx.fillText(char, cx, cy + 1);
      }
    }

    // --- Head on top (only if we know which cell is the head) ---
    if (hasHead) {
      const head = s.body[0];
      if (this._inView(head.x, head.y, camX, camY)) {
        this._drawHead(head, s, camX, camY, isMe);
      }
    }
  }

  _tracePath(body, camX, camY) {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < body.length; i++) {
      const c = body[i];
      const x = (c.x - camX) * this.cellSize + this.cellSize / 2;
      const y = (c.y - camY) * this.cellSize + this.cellSize / 2;
      if (i === 0) ctx.moveTo(x, y);
      else         ctx.lineTo(x, y);
    }
  }

  _drawHead(head, snake, camX, camY, isMe) {
    const ctx = this.ctx;
    const cx = (head.x - camX) * this.cellSize + this.cellSize / 2;
    const cy = (head.y - camY) * this.cellSize + this.cellSize / 2;
    const r = this.cellSize * 0.48;

    // Outer outline
    ctx.fillStyle = darken(snake.color, 0.35);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
    ctx.fill();

    // Main fill
    ctx.fillStyle = snake.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // My-snake aura — soft glow ring around head
    if (isMe && snake.alive) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Eyes — switch to X eyes if dead
    if (!snake.alive) {
      this._drawDeadEyes(cx, cy, snake.direction, r);
    } else {
      this._drawLiveEyes(cx, cy, snake.direction, r);
    }
  }

  _drawLiveEyes(cx, cy, dir, r) {
    const ctx = this.ctx;
    const E = Math.max(3, Math.floor(this.cellSize / 7));   // eye size
    const fwd = r * 0.45;                                // distance from center toward facing edge
    const side = r * 0.45;                               // perpendicular spread

    // Compute eye positions based on direction
    let e1, e2;
    if (dir === 'RIGHT') { e1 = [cx + fwd, cy - side]; e2 = [cx + fwd, cy + side]; }
    if (dir === 'LEFT')  { e1 = [cx - fwd, cy - side]; e2 = [cx - fwd, cy + side]; }
    if (dir === 'UP')    { e1 = [cx - side, cy - fwd]; e2 = [cx + side, cy - fwd]; }
    if (dir === 'DOWN')  { e1 = [cx - side, cy + fwd]; e2 = [cx + side, cy + fwd]; }

    // White sclera
    ctx.fillStyle = '#fef2f2';
    ctx.beginPath(); ctx.arc(e1[0], e1[1], E, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2[0], e2[1], E, 0, Math.PI * 2); ctx.fill();
    // Dark pupil (offset slightly forward)
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
    const E = Math.max(3, Math.floor(this.cellSize / 7));

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
    const LIFETIME = 900;  // ms
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of popups) {
      const age = now - p.startTime;
      if (age > LIFETIME) continue;
      if (!this._inView(p.cellX, p.cellY, camX, camY)) continue;
      const progress = age / LIFETIME;
      const alpha = Math.max(0, 1 - progress);
      const drift = progress * 36;     // pixels upward over the lifetime
      const sx = (p.cellX - camX) * this.cellSize + this.cellSize / 2;
      const sy = (p.cellY - camY) * this.cellSize + this.cellSize / 2 - drift;
      ctx.font = `bold 18px -apple-system, system-ui, sans-serif`;
      // Shadow then text for legibility on bright body cells
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
    ctx.strokeRect(camX * sx + 0.5, camY * sy + 0.5, this.viewCols * sx, this.viewRows * sy);
  }

  _inView(x, y, camX, camY) {
    return x >= camX && x < camX + this.viewCols && y >= camY && y < camY + this.viewRows;
  }
}
