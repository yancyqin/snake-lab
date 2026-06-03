// tunable.js — a strategy bot you tune by hand.
//
// Every tick, this bot scores all 4 possible moves and picks the highest.
// The four WEIGHTS below decide what "highest" means. Try changing them!
//
//   W_FOOD     — how badly do I want to chase food?
//   W_SAFETY   — how badly do I want to NOT die?
//   W_BLOCKING — how much do I want to sit next to an enemy head?
//   W_OPEN     — how much do I prefer a spot with room to maneuver?
//
// Higher number = "I care more about this." Try W_FOOD = 5 and watch it
// dive at food. Try W_SAFETY = 0 and watch it run into a wall.
//
// What you're doing right now — picking better numbers based on what
// works — is exactly what machine learning does. We just do it by hand.

const W_FOOD     = 1.0;
const W_SAFETY   = 5.0;
const W_BLOCKING = 0.0;
const W_OPEN     = 0.5;

function nextMove(state) {
  const head = state.me.body[0];
  const W = state.board.width;
  const H = state.board.height;

  // ----- helpers -----
  // A cell is "deadly" if it's off the board or covered by any snake body.
  function deadly(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return true;
    for (const c of state.me.body) {
      if (c.x === x && c.y === y) return true;
    }
    for (const o of state.others) {
      for (const c of o.body) {
        if (c.x === x && c.y === y) return true;
      }
    }
    return false;
  }
  // Manhattan distance from (x,y) to the closest food.
  function foodDistance(x, y) {
    if (state.food.length === 0) return 999;
    let best = 999;
    for (const f of state.food) {
      const d = Math.abs(f.x - x) + Math.abs(f.y - y);
      if (d < best) best = d;
    }
    return best;
  }
  // How many of the 4 neighbors of (x,y) are NOT deadly?  Bigger = more room.
  function openCount(x, y) {
    let n = 0;
    if (!deadly(x + 1, y)) n++;
    if (!deadly(x - 1, y)) n++;
    if (!deadly(x, y + 1)) n++;
    if (!deadly(x, y - 1)) n++;
    return n;
  }
  // How many enemy heads are exactly 1 cell away from (x,y)?
  function nearOpponentHead(x, y) {
    let n = 0;
    for (const o of state.others) {
      if (!o.alive || !o.body[0]) continue;
      const h = o.body[0];
      if (Math.abs(h.x - x) + Math.abs(h.y - y) === 1) n++;
    }
    return n;
  }

  // ----- score each direction, pick the best -----
  const moves = {
    UP:    { x: head.x,     y: head.y - 1 },
    DOWN:  { x: head.x,     y: head.y + 1 },
    LEFT:  { x: head.x - 1, y: head.y     },
    RIGHT: { x: head.x + 1, y: head.y     },
  };

  let bestDir = state.me.direction;
  let bestScore = -Infinity;

  for (const [dir, pos] of Object.entries(moves)) {
    let score;
    if (deadly(pos.x, pos.y)) {
      // Almost-fatal: big negative score scaled by how much we hate dying.
      // (Not -Infinity, in case every direction is deadly — better to keep
      // moving than to throw.)
      score = -1000 * W_SAFETY;
    } else {
      score =
          W_FOOD     * -foodDistance(pos.x, pos.y)      // closer food = higher
        + W_SAFETY   *  1                                // staying alive
        + W_BLOCKING *  nearOpponentHead(pos.x, pos.y)   // crowding enemies
        + W_OPEN     *  openCount(pos.x, pos.y);         // room to move
    }
    if (score > bestScore) { bestScore = score; bestDir = dir; }
  }

  return bestDir;
}
