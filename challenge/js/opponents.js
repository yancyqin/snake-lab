// The 10 opponent bots, weakest → strongest.
//
// Every bot is a plain `nextMove(state)` function — the SAME shape you write
// your own bot in. That's on purpose: if a level is beating you, open this
// file and read how it thinks. Scouting the enemy is allowed. 🔎
//
// state = { me:{body,direction,alive}, foods:[{x,y}], others:[{body,...}],
//           board:{width,height}, tick }

// ---------- shared helpers ----------
const DIRS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const STEP = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };

function cellAfter(head, dir) {
  const [dx, dy] = STEP[dir];
  return { x: head.x + dx, y: head.y + dy };
}
function nearestFood(p, foods) {
  let best = null, bd = Infinity;
  for (const f of foods) {
    const d = Math.abs(f.x - p.x) + Math.abs(f.y - p.y);
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}
// Build the set of blocked cells (all bodies minus tails, which slide away).
function blockedSet(state) {
  const W = state.board.width;
  const blocked = new Set();
  const all = [state.me, ...state.others];
  for (const s of all)
    for (let i = 0; i < s.body.length - 1; i++)
      blocked.add(s.body[i].y * W + s.body[i].x);
  return blocked;
}
function makeDead(state, blocked) {
  const W = state.board.width, H = state.board.height;
  return (x, y) => x < 0 || x >= W || y < 0 || y >= H || blocked.has(y * W + x);
}
// Flood fill: how many open cells are reachable from (x,y)? (capped for speed)
function floodSpace(x, y, dead, W, cap = 220) {
  if (dead(x, y)) return 0;
  const seen = new Set([y * W + x]);
  const stack = [[x, y]];
  let n = 0;
  while (stack.length && n < cap) {
    const [cx, cy] = stack.pop(); n++;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = cx + dx, ny = cy + dy, k = ny * W + nx;
      if (!dead(nx, ny) && !seen.has(k)) { seen.add(k); stack.push([nx, ny]); }
    }
  }
  return n;
}
function foeHead(state) {
  const o = state.others[0];
  return o && o.alive ? o.body[0] : null;
}
function foeLen(state) { const o = state.others[0]; return o ? o.body.length : 0; }

// ===================================================================
// LEVEL 1 — Random Randy: flails. Walks into walls. Free win.
// ===================================================================
function randy(state) {
  return DIRS[Math.floor(Math.random() * DIRS.length)];
}

// ===================================================================
// LEVEL 2 — Greedy Gus: sprints at the nearest food. Never checks for death.
// ===================================================================
function gus(state) {
  const head = state.me.body[0];
  const f = nearestFood(head, state.foods);
  if (!f) return state.me.direction;
  const dx = f.x - head.x, dy = f.y - head.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'RIGHT' : 'LEFT';
  return dy > 0 ? 'DOWN' : 'UP';
}

// ===================================================================
// LEVEL 3 — Careful Carl: chases food but won't step somewhere deadly.
// ===================================================================
function carl(state) {
  const head = state.me.body[0];
  const blocked = blockedSet(state);
  const dead = makeDead(state, blocked);
  const f = nearestFood(head, state.foods) || head;
  let best = null, bd = Infinity;
  for (const dir of DIRS) {
    const p = cellAfter(head, dir);
    if (dead(p.x, p.y)) continue;
    const d = Math.abs(p.x - f.x) + Math.abs(p.y - f.y);
    if (d < bd) { bd = d; best = dir; }
  }
  return best || state.me.direction;
}

// ===================================================================
// LEVEL 4 — Wally: like Carl, but dislikes hugging walls (fewer corner traps).
// ===================================================================
function wally(state) {
  const head = state.me.body[0];
  const W = state.board.width, H = state.board.height;
  const blocked = blockedSet(state);
  const dead = makeDead(state, blocked);
  const f = nearestFood(head, state.foods) || head;
  let best = null, bs = -Infinity;
  for (const dir of DIRS) {
    const p = cellAfter(head, dir);
    if (dead(p.x, p.y)) continue;
    const distToFood = Math.abs(p.x - f.x) + Math.abs(p.y - f.y);
    const edge = Math.min(p.x, W - 1 - p.x, p.y, H - 1 - p.y); // 0 at wall, bigger in the open
    const score = -distToFood + edge * 0.6;
    if (score > bs) { bs = score; best = dir; }
  }
  return best || state.me.direction;
}

// ===================================================================
// LEVEL 5 — Tuned Tina: weighs food, safety, and open space together.
// ===================================================================
function tina(state) {
  const head = state.me.body[0];
  const W = state.board.width;
  const blocked = blockedSet(state);
  const dead = makeDead(state, blocked);
  const f = nearestFood(head, state.foods) || head;
  let best = null, bs = -Infinity;
  for (const dir of DIRS) {
    const p = cellAfter(head, dir);
    if (dead(p.x, p.y)) continue;
    let open = 0;
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) if (!dead(p.x + dx, p.y + dy)) open++;
    const distToFood = Math.abs(p.x - f.x) + Math.abs(p.y - f.y);
    const score = -distToFood * 1.0 + open * 2.5;   // tuned weights
    if (score > bs) { bs = score; best = dir; }
  }
  return best || state.me.direction;
}

// --- shared survival core (levels 6-9 differ only by these knobs) ---
//   cap    = how far the flood fill looks (deeper = sees traps sooner = stronger)
//   foodW  = how eagerly it chases food (LOWER = stays compact = survives longer)
//   dodge  = whether it avoids cells the foe's head could jump into
// The single biggest strength knob is `cap`: a deeper look-ahead almost never
// walks into a trap a shallower one misses.
function survivalMove(state, { cap, foodW, dodge }) {
  const head = state.me.body[0];
  const W = state.board.width;
  const myLen = state.me.body.length;
  const blocked = blockedSet(state);
  const dead = makeDead(state, blocked);
  const f = nearestFood(head, state.foods);

  const headRisk = new Map();
  if (dodge) {
    const fh = foeHead(state);
    if (fh) {
      const pen = foeLen(state) >= myLen ? 900 : 150;
      for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
        const k = (fh.y + dy) * W + (fh.x + dx);
        headRisk.set(k, Math.max(headRisk.get(k) || 0, pen));
      }
    }
  }

  let best = null, bs = -Infinity;
  for (const dir of DIRS) {
    const p = cellAfter(head, dir);
    if (dead(p.x, p.y)) continue;
    const room = floodSpace(p.x, p.y, dead, W, cap);
    let score = room * 10;                      // maximize open space (not just "enough")
    if (room <= myLen) score -= 3000;           // a pocket is a slow death
    score -= headRisk.get(p.y * W + p.x) || 0;
    if (f) score -= (Math.abs(p.x - f.x) + Math.abs(p.y - f.y)) * foodW;
    if (score > bs) { bs = score; best = dir; }
  }
  return best || state.me.direction;
}

// The 6-10 tier all share the survival core above, tuned by two honest knobs:
//   - cap   : how deep the flood fill looks (shallow = misses far-away traps)
//   - foodW : how hard it chases food. Greedy bots get long and trap themselves;
//             patient ones stay compact and outlive you.
//
// Important truth (and a great lesson): past a point, "smarter" stops helping.
// A bot that looks deeply AND eats patiently is near the skill ceiling of this
// game — which is exactly why the top levels are a real wall. The jump that
// matters most is L5 → L6: that's where you MUST start using flood fill.

// LEVEL 6 — Scout: shallow flood, eats greedily. Spots only nearby traps.
function scout(state)      { return survivalMove(state, { cap: 12,  foodW: 1.3, dodge: false }); }
// LEVEL 7 — Pathfinder: deeper look, and starts dodging your head.
function pathfinder(state) { return survivalMove(state, { cap: 35,  foodW: 1.1, dodge: true  }); }
// LEVEL 8 — The Boss: deep flood, careful eater. *** The wall. Code or lose. ***
function boss(state)       { return survivalMove(state, { cap: 90,  foodW: 0.9, dodge: true  }); }
// LEVEL 9 — Hunter: very deep — barely misses a trap.
function hunter(state)     { return survivalMove(state, { cap: 200, foodW: 0.7, dodge: true  }); }
// LEVEL 10 — Grandmaster: looks the furthest ahead and never overreaches for
//   food. The most patient, deepest survivor — it just refuses to die.
function grandmaster(state){ return survivalMove(state, { cap: 350, foodW: 0.45, dodge: true }); }

// ---------- the ladder ----------
export const LEVELS = [
  { n: 1,  name: 'Random Randy',  emoji: '🎲', fn: randy,
    blurb: 'Flails in random directions and walks into walls. A warm-up.' },
  { n: 2,  name: 'Greedy Gus',    emoji: '🍎', fn: gus,
    blurb: 'Sprints at the nearest food and never checks for danger.' },
  { n: 3,  name: 'Careful Carl',  emoji: '🛟', fn: carl,
    blurb: 'Chases food but refuses to step somewhere deadly.' },
  { n: 4,  name: 'Wally',         emoji: '🧱', fn: wally,
    blurb: 'Like Carl, but keeps away from walls so it traps itself less.' },
  { n: 5,  name: 'Tuned Tina',    emoji: '🎚️', fn: tina,
    blurb: 'Balances food, safety, and open space with tuned weights.' },
  { n: 6,  name: 'Scout',         emoji: '🔦', fn: scout,
    blurb: 'First bot that uses FLOOD FILL — it avoids dead-end pockets.' },
  { n: 7,  name: 'Pathfinder',    emoji: '🧭', fn: pathfinder,
    blurb: 'Flood fill plus dodging wherever your head might go next.' },
  { n: 8,  name: 'The Boss',      emoji: '👑', fn: boss,
    blurb: 'A space-aware survivor. By hand, you will lose. Time to code.' },
  { n: 9,  name: 'Hunter',        emoji: '🎯', fn: hunter,
    blurb: 'The Boss, but it wins food races and crowds you when it is bigger.' },
  { n: 10, name: 'Grandmaster',   emoji: '🏆', fn: grandmaster,
    blurb: 'Boss + space denial: it squeezes your room while keeping its own.' },
];
