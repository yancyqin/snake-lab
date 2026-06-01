// Shared between server and client (via the filesystem path).
// Tweak these to change how the arena feels.

export const CELL_SIZE = 32;
export const WORLD_COLS = 60;
export const WORLD_ROWS = 60;
export const VIEW_COLS = 24;
export const VIEW_ROWS = 24;
export const TICK_MS = 130;

export const INITIAL_SNAKE_LENGTH = 3;
export const FOOD_COUNT = 15;            // a bit more than v1 — multiple snakes eat
export const POINTS_PER_FOOD = 10;
export const MAX_PLAYERS = 8;
export const RESTART_DELAY_MS = 3000;

// Bot smartness model:
// - while bot.length <= BOT_SMART_UNTIL  → always smart
// - then drops linearly to 0 over the next BOT_DUMB_RAMP cells
export const BOT_SMART_UNTIL = 10;
export const BOT_DUMB_RAMP = 20;

export const PLAYER_COLORS = [
  '#4ade80',  // green
  '#fbbf24',  // yellow
  '#f87171',  // red
  '#60a5fa',  // blue
  '#c084fc',  // purple
  '#fb923c',  // orange
  '#34d399',  // teal
  '#f472b6',  // pink
];

export const BOT_COLOR = '#94a3b8';  // slate gray — clearly different from humans

export const COLORS = {
  background:   '#1a1a2e',
  grid:         '#22223a',
  snakeEye:     '#0f0f1a',
  food:         '#ef4444',
  worldEdge:    '#64748b',
  minimapBg:    '#0f0f1a',
  minimapFood:  '#ef4444',
  minimapView:  '#94a3b8',
};
