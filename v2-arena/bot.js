import { WORLD_COLS, WORLD_ROWS, BOT_SMART_UNTIL, BOT_DUMB_RAMP } from './public/constants.js';

const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

// Bot smartness curve. 1.0 = always picks the smart move, 0.0 = pure random.
// The "very smart, then dumber" requirement: full smart until length 10,
// then drops linearly to 0 over the next 20 cells.
export function computeSmartness(length) {
  if (length <= BOT_SMART_UNTIL) return 1.0;
  return Math.max(0, 1 - (length - BOT_SMART_UNTIL) / BOT_DUMB_RAMP);
}

export function botMove(bot, allSnakes, foods, obstacles = []) {
  const smartness = computeSmartness(bot.body.length);
  if (Math.random() < smartness) {
    return smartMove(bot, allSnakes, foods, obstacles);
  } else {
    return safeRandomMove(bot, allSnakes, obstacles);
  }
}

// Predator AI — chases the nearest non-predator snake. Avoids walls.
// Doesn't care about obstacles (will collide and die, but predators are immortal so it's fine).
export function predatorMove(predator, allSnakes) {
  const head = predator.body[0];
  const targets = allSnakes.filter(s => s.alive && !s.isPredator);
  if (targets.length === 0) return predator.direction;

  // Nearest target
  let nearest = targets[0];
  let nearestD = Math.abs(nearest.body[0].x - head.x) + Math.abs(nearest.body[0].y - head.y);
  for (const t of targets.slice(1)) {
    const d = Math.abs(t.body[0].x - head.x) + Math.abs(t.body[0].y - head.y);
    if (d < nearestD) { nearest = t; nearestD = d; }
  }
  const targetHead = nearest.body[0];

  const candidates = validDirs(predator.direction).map(dir => {
    const nh = nextHeadIn(dir, head);
    const inBounds = nh.x >= 0 && nh.x < WORLD_COLS && nh.y >= 0 && nh.y < WORLD_ROWS;
    const dist = Math.abs(nh.x - targetHead.x) + Math.abs(nh.y - targetHead.y);
    return { dir, inBounds, dist };
  });

  const inBounds = candidates.filter(c => c.inBounds);
  if (inBounds.length === 0) return predator.direction;
  inBounds.sort((a, b) => a.dist - b.dist);
  return inBounds[0].dir;
}

// --- helpers ---

function nextHeadIn(dir, head) {
  const n = { x: head.x, y: head.y };
  if (dir === 'UP')    n.y -= 1;
  if (dir === 'DOWN')  n.y += 1;
  if (dir === 'LEFT')  n.x -= 1;
  if (dir === 'RIGHT') n.x += 1;
  return n;
}

function isDeadly(pos, allSnakes, obstacles = []) {
  if (pos.x < 0 || pos.x >= WORLD_COLS || pos.y < 0 || pos.y >= WORLD_ROWS) return true;
  for (const snake of allSnakes) {
    if (!snake.alive) continue;
    for (let i = 0; i < snake.body.length; i++) {
      if (snake.body[i].x === pos.x && snake.body[i].y === pos.y) return true;
    }
  }
  for (const o of obstacles) {
    if (o.x === pos.x && o.y === pos.y) return true;
  }
  return false;
}

function nearestFood(head, foods) {
  if (foods.length === 0) return null;
  let best = null;
  let bestD = Infinity;
  for (const f of foods) {
    const d = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
    if (d < bestD) { best = f; bestD = d; }
  }
  return best;
}

function validDirs(currentDir) {
  return ['UP', 'DOWN', 'LEFT', 'RIGHT'].filter(d => OPPOSITE[d] !== currentDir);
}

function smartMove(bot, allSnakes, foods, obstacles) {
  const head = bot.body[0];
  const food = nearestFood(head, foods);
  const candidates = validDirs(bot.direction).map(dir => {
    const nh = nextHeadIn(dir, head);
    return {
      dir,
      deadly: isDeadly(nh, allSnakes, obstacles),
      distToFood: food ? Math.abs(nh.x - food.x) + Math.abs(nh.y - food.y) : 0,
    };
  });
  const safe = candidates.filter(c => !c.deadly);
  if (safe.length === 0) return candidates[0]?.dir || bot.direction;
  safe.sort((a, b) => a.distToFood - b.distToFood);
  return safe[0].dir;
}

function safeRandomMove(bot, allSnakes, obstacles) {
  const head = bot.body[0];
  const candidates = validDirs(bot.direction).filter(d => !isDeadly(nextHeadIn(d, head), allSnakes, obstacles));
  if (candidates.length === 0) return bot.direction;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
