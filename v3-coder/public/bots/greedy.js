// greedy.js — chases the nearest food. Doesn't care about dying.
// Beats random easily. Loses to safe because it crashes into walls eventually.
//
// The shape of state:
//   state.me     = { body: [{x,y}, ...], direction: 'UP', alive: true }
//   state.foods  = [{x,y}, ...]
//   state.others = [ { body, direction, alive }, ... ]
//   state.board  = { width: 60, height: 60 }
//   state.tick   = number
//
// Return one of: 'UP', 'DOWN', 'LEFT', 'RIGHT'

function nextMove(state) {
  const head = state.me.body[0];

  // Find the closest food (Manhattan distance)
  let nearest = state.foods[0];
  let nearestD = Math.abs(nearest.x - head.x) + Math.abs(nearest.y - head.y);
  for (const f of state.foods) {
    const d = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
    if (d < nearestD) { nearest = f; nearestD = d; }
  }

  // Move toward it. Prefer horizontal if it's further horizontally; vertical otherwise.
  const dx = nearest.x - head.x;
  const dy = nearest.y - head.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'RIGHT' : 'LEFT';
  } else {
    return dy > 0 ? 'DOWN' : 'UP';
  }
}
