// random.js — the dumbest possible bot.
// Picks a random direction every tick. Doesn't avoid walls. Doesn't chase food.
// Lives a few seconds, dies funny. Good starting point: read the API, see the shape.

function nextMove(state) {
  const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  return dirs[Math.floor(Math.random() * dirs.length)];
}
