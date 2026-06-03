// safe.js — greedy AND avoids walls and bodies.
// This is the strongest sample bot. Beat it and you're a real snake programmer.

function nextMove(state) {
  const head = state.me.body[0];
  const W = state.board.width;
  const H = state.board.height;

  // Find the closest food
  let nearest = state.foods[0];
  let nearestD = Math.abs(nearest.x - head.x) + Math.abs(nearest.y - head.y);
  for (const f of state.foods) {
    const d = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
    if (d < nearestD) { nearest = f; nearestD = d; }
  }

  // A cell is "deadly" if it's off the board or covered by ANY snake body
  function deadly(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return true;
    for (const cell of state.me.body) {
      if (cell.x === x && cell.y === y) return true;
    }
    for (const other of state.others) {
      for (const cell of other.body) {
        if (cell.x === x && cell.y === y) return true;
      }
    }
    return false;
  }

  // Score each of the 4 directions: distance to food, or Infinity if deadly
  const moves = {
    UP:    { x: head.x,     y: head.y - 1 },
    DOWN:  { x: head.x,     y: head.y + 1 },
    LEFT:  { x: head.x - 1, y: head.y     },
    RIGHT: { x: head.x + 1, y: head.y     },
  };

  let best = null;
  let bestD = Infinity;
  for (const [dir, pos] of Object.entries(moves)) {
    if (deadly(pos.x, pos.y)) continue;
    const d = Math.abs(pos.x - nearest.x) + Math.abs(pos.y - nearest.y);
    if (d < bestD) { best = dir; bestD = d; }
  }

  // If every direction is deadly we're toast — just keep going straight
  return best || state.me.direction;
}
