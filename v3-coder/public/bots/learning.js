// learning.js — a bot that LEARNS to play snake all by itself.
//
// Yesterday you tuned weights by hand. This bot does the same kind of
// tuning — but automatically, after every single move. It keeps a tiny
// "brain" of memory called a Q-TABLE: for each situation it has seen,
// how good has each action turned out to be?
//
// Reward signals (these shape what the bot learns):
//   +10  — ate a piece of food (good!)
//   -50  — died (very bad!)
//   -0.01 per tick — small "do something useful" pressure
//
// At first the bot is terrible — it explores randomly. After ~5 rounds
// it stops crashing into walls. After ~20 rounds it eats food on purpose.
//
// (Note: these `let` variables live for the whole match — they keep
// the brain alive across ticks. You only get a fresh brain when you
// click "Apply" in the editor.)

let qTable     = {};   // { situationKey: { UP: number, DOWN: number, LEFT: number, RIGHT: number } }
let lastKey    = null; // the situation we were in last tick
let lastAction = null; // the move we sent last tick
let lastLen    = 3;    // length last tick — so we can detect "ate food" or "I died"
let games      = 0;    // how many rounds the bot has played

// Hyperparameters — "knobs" you'd usually tweak when training.
const ALPHA = 0.2;     // learning rate (how much we trust each new update)
const GAMMA = 0.9;     // future-discount (how much we care about tomorrow's reward)

function nextMove(state) {
  const head = state.me.body[0];
  const W = state.board.width;
  const H = state.board.height;

  // ---- 1. describe the current situation as a tiny string ----
  // Two pieces of info:
  //   (a) where's the closest food, relative to me?  -1 / 0 / +1 in x and y
  //   (b) which of my 4 neighbors are deadly?  4 bits, packed 0..15
  // Total: 9 food directions × 16 danger patterns = 144 distinct situations.
  function deadly(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return true;
    for (const c of state.me.body) if (c.x === x && c.y === y) return true;
    for (const o of state.others) for (const c of o.body) if (c.x === x && c.y === y) return true;
    return false;
  }
  let nearest = state.foods[0];
  if (nearest) {
    let bd = Math.abs(nearest.x - head.x) + Math.abs(nearest.y - head.y);
    for (let i = 1; i < state.foods.length; i++) {
      const f = state.foods[i];
      const d = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
      if (d < bd) { nearest = f; bd = d; }
    }
  }
  const fx = nearest ? Math.sign(nearest.x - head.x) : 0;
  const fy = nearest ? Math.sign(nearest.y - head.y) : 0;
  const danger =
      (deadly(head.x,     head.y - 1) ? 8 : 0)   // UP
    | (deadly(head.x,     head.y + 1) ? 4 : 0)   // DOWN
    | (deadly(head.x - 1, head.y    ) ? 2 : 0)   // LEFT
    | (deadly(head.x + 1, head.y    ) ? 1 : 0);  // RIGHT
  const sKey = `${fx},${fy}|${danger}`;
  if (!qTable[sKey]) qTable[sKey] = { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 };

  // ---- 2. learn from what just happened ----
  // We know NOW how the previous move turned out, so we can update the
  // Q-value for (lastKey, lastAction). This is the Bellman update:
  //   Q(s,a)  ←  Q(s,a)  +  α * ( reward + γ * max Q(s', a')  -  Q(s,a) )
  if (lastKey !== null && lastAction !== null) {
    let reward;
    const curLen = state.me.body.length;
    if (curLen > lastLen) {
      reward = 10;          // ate food
    } else if (curLen < lastLen) {
      // Length suddenly back to 3 → the previous round ended in death.
      reward = -50;
      games += 1;
    } else {
      reward = -0.01;        // small per-tick cost (do something useful!)
    }
    const futureBest = Math.max(...Object.values(qTable[sKey]));
    const prev = qTable[lastKey][lastAction];
    qTable[lastKey][lastAction] = prev + ALPHA * (reward + GAMMA * futureBest - prev);
  }

  // ---- 3. pick an action (ε-greedy) ----
  // Sometimes pick a random action ("explore" — try things out).
  // Mostly pick the best one we know ("exploit" — use what we learned).
  // Exploration shrinks as we play more rounds.
  const epsilon = Math.max(0.05, Math.pow(0.92, games));
  const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  let action;
  if (Math.random() < epsilon) {
    action = dirs[Math.floor(Math.random() * dirs.length)];
  } else {
    const q = qTable[sKey];
    action = dirs.reduce((best, d) => q[d] > q[best] ? d : best);
  }

  // Remember this step so we can learn from it next tick.
  lastKey    = sKey;
  lastAction = action;
  lastLen    = state.me.body.length;
  return action;
}

// ---- Debug: peek at the bot's brain from DevTools Console ----
// `window.botBrain` is the live Q-table. Try these in DevTools Console
// after letting the bot play for a minute or two:
//
//   window.botBrain                       — the whole Q-table object
//   Object.keys(window.botBrain).length   — how many situations seen so far
//   window.botGames                       — rounds the bot has played
//   window.botBrain['1,0|0']              — Q-values when food is RIGHT, no danger
//                                            (UP/DOWN/LEFT/RIGHT scores)
//
// The bot does the assignment ONCE when the factory runs, so window.botBrain
// is the SAME object the bot keeps mutating — refreshing your view doesn't
// require re-querying anything fancy.
if (typeof window !== 'undefined') {
  window.botBrain = qTable;
  Object.defineProperty(window, 'botGames', { get: () => games, configurable: true });
}
