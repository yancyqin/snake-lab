// Draws the whole 30×30 board at once — no camera, so you always see both
// snakes. Your snake is green, the opponent is orange.

import { BOARD, CELL, COLORS } from './constants.js?v=20260608';  // keep ?v= in sync (see index.html)

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = BOARD * CELL;
    canvas.height = BOARD * CELL;
    this._bg = null;
  }

  draw(game, now) {
    const ctx = this.ctx;
    const W = BOARD * CELL, H = BOARD * CELL;

    // Background gradient (cached)
    if (!this._bg) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
      g.addColorStop(0, COLORS.bgNear);
      g.addColorStop(1, COLORS.bgFar);
      this._bg = g;
    }
    ctx.fillStyle = this._bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD; i++) {
      const x = i * CELL + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      const y = i * CELL + 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Walls (the deadly border)
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // Food — pulsing glowing dots
    const t = now / 1000;
    for (const f of game.foods) {
      const cx = f.x * CELL + CELL / 2, cy = f.y * CELL + CELL / 2;
      const pulse = 0.85 + 0.15 * Math.sin(t * 2.5 + f.x * 0.7 + f.y * 0.5);
      const r = CELL * 0.32 * pulse;
      ctx.fillStyle = COLORS.foodGlow;
      ctx.beginPath(); ctx.arc(cx, cy, r * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLORS.food;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }

    // Snakes — dead first so survivors draw on top; YOU last so you're always visible.
    const order = [...game.snakes].sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? 1 : -1;
      if (a.isYou !== b.isYou) return a.isYou ? 1 : -1;
      return 0;
    });
    for (const s of order) this._snake(s, s.color);
  }

  _snake(s, color) {
    const ctx = this.ctx;
    ctx.globalAlpha = s.alive ? 1 : 0.3;
    const pt = (c) => [c.x * CELL + CELL / 2, c.y * CELL + CELL / 2];

    if (s.body.length >= 2) {
      // dark outline then colored core, as one rounded stroke
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = COLORS.outline; ctx.lineWidth = CELL * 0.9;
      this._trace(s.body); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = CELL * 0.74;
      this._trace(s.body); ctx.stroke();
    }

    // Head
    const [hx, hy] = pt(s.body[0]);
    const r = CELL * 0.46;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill();
    // eyes (or X if dead)
    const E = Math.max(2, CELL / 8), off = r * 0.42;
    const dir = s.direction;
    const perp = (dir === 'LEFT' || dir === 'RIGHT') ? [0, off] : [off, 0];
    const fwd  = { UP: [0, -off], DOWN: [0, off], LEFT: [-off, 0], RIGHT: [off, 0] }[dir];
    const e1 = [hx + fwd[0] - perp[0], hy + fwd[1] - perp[1]];
    const e2 = [hx + fwd[0] + perp[0], hy + fwd[1] + perp[1]];
    if (s.alive) {
      ctx.fillStyle = '#fef2f2';
      for (const e of [e1, e2]) { ctx.beginPath(); ctx.arc(e[0], e[1], E, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = COLORS.eye;
      for (const e of [e1, e2]) { ctx.beginPath(); ctx.arc(e[0], e[1], E * 0.55, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.strokeStyle = COLORS.eye; ctx.lineWidth = 2;
      for (const e of [e1, e2]) {
        ctx.beginPath();
        ctx.moveTo(e[0] - E, e[1] - E); ctx.lineTo(e[0] + E, e[1] + E);
        ctx.moveTo(e[0] + E, e[1] - E); ctx.lineTo(e[0] - E, e[1] + E);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  _trace(body) {
    const ctx = this.ctx;
    ctx.beginPath();
    body.forEach((c, i) => {
      const x = c.x * CELL + CELL / 2, y = c.y * CELL + CELL / 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
  }
}
