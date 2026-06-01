// Shared between server and client (via the filesystem path).
// Tweak these to change how the arena feels.

export const CELL_SIZE = 32;
export const WORLD_COLS = 60;
export const WORLD_ROWS = 60;
export const VIEW_COLS = 24;
export const VIEW_ROWS = 24;
export const TICK_MS = 130;

export const INITIAL_SNAKE_LENGTH = 3;
export const FOOD_COUNT = 18;            // more than v1 — multiple snakes eat
export const POINTS_PER_FOOD = 10;
export const MAX_PLAYERS = 8;
export const RESTART_DELAY_MS = 3000;

// Bot smartness: full smart up to length 10, then drops linearly to 0 by length 30
export const BOT_SMART_UNTIL = 10;
export const BOT_DUMB_RAMP = 20;

// Hazards
export const OBSTACLE_COUNT = 18;        // static rocks scattered around the world
export const PREDATOR_BASE_COUNT = 1;    // 1 predator always
export const PREDATOR_PER_N_PLAYERS = 4; // +1 predator per 4 players
export const PREDATOR_LENGTH = 3;
export const PREDATOR_MOVE_EVERY = 2;    // predator moves every Nth tick (slower than snakes)

// Customization
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

export const BOT_COLOR = '#94a3b8';      // slate gray
export const PREDATOR_COLOR = '#b91c1c'; // deep red — clearly hazardous
export const OBSTACLE_COLOR = '#475569'; // slate stone

export const COLORS = {
  background:   '#1a1a2e',
  grid:         '#22223a',
  snakeEye:     '#0f0f1a',
  food:         '#ef4444',
  worldEdge:    '#64748b',
  obstacle:     '#475569',
  obstacleBorder: '#334155',
  predatorEye:  '#fef2f2',     // bright white-red — angry
  minimapBg:    '#0f0f1a',
  minimapFood:  '#ef4444',
  minimapView:  '#94a3b8',
  minimapObstacle: '#475569',
  bodyText:     '#0f0f1a',     // dark text on bright body
};
