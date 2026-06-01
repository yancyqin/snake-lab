import { WORLD_COLS, WORLD_ROWS, BOT_SMART_UNTIL, BOT_DUMB_RAMP } from './public/constants.js';

const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

// Returns a number in [0, 1]: 1 = always picks the best move, 0 = always picks at random.
// The bot is fully smart until BOT_SMART_UNTIL cells long, then degrades linearly
// to 0 over the next BOT_DUMB_RAMP cells. That's the "very smart, then dumber"
// requirement: bot dominates early, gets catchable as it grows.
export function computeSmartness(length) {
  if (length <= BOT_SMART_UNTIL) return 1.0;
  return Math.max(0, 1 - (length - BOT_SMART_UNTIL) / BOT_DUMB_RAMP);
}

export function botMove(bot, allSnakes, foods) {
  const smartness = computeSmartness(bot.body.length);
  if (Math.random() < smartness) {
    return smartMove(bot, allSnakes, foods);
  } else {
    return safeRandomMove(bot, allSnakes);
  }
}

function nextHeadIn(dir, head) {
  const n = { x: head.x, y: head.y };
  if (dir === 'UP')    n.y -= 1;
  if (dir === 'DOWN')  n.y += 1;
  if (dir === 'LEFT')  n.x -= 1;
  if (dir === 'RIGHT') n.x += 1;
  return n;
}

function isDeadly(pos, allSnakes) {
  if (pos.x < 0 || pos.x >= WORLD_COLS || pos.y < 0 || pos.y >= WORLD_ROWS) return true;
  for (const snake of allSnakes) {
    if (!snake.alive) continue;
    // Exclude the tail since it'll move out of the way next tick (unless the snake is about to eat — but we don't know yet).
    // For safety we treat the last cell as still occupied — gives slightly cautious bot.
    for (let i = 0; i < snake.body.length; i++) {
      if (snake.body[i].x === pos.x && snake.body[i].y === pos.y) return true;
    }
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

function smartMove(bot, allSnakes, foods) {
  const head = bot.body[0];
  const food = nearestFood(head, foods);
  const candidates = validDirs(bot.direction).map(dir => {
    const nh = nextHeadIn(dir, head);
    return {
      dir,
      deadly: isDeadly(nh, allSnakes),
      distToFood: food ? Math.abs(nh.x - food.x) + Math.abs(nh.y - food.y) : 0,
    };
  });

  const safe = candidates.filter(c => !c.deadly);
  if (safe.length === 0) {
    return candidates[0]?.dir || bot.direction;  // doomed
  }
  safe.sort((a, b) => a.distToFood - b.distToFood);
  return safe[0].dir;
}

function safeRandomMove(bot, allSnakes) {
  const head = bot.body[0];
  const candidates = validDirs(bot.direction).filter(d => !isDeadly(nextHeadIn(d, head), allSnakes));
  if (candidates.length === 0) return bot.direction;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
