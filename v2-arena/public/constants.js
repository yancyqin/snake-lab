// Shared between server and client (via the filesystem path).
// Tweak these to change how the arena feels.

export const CELL_SIZE = 32;
export const WORLD_COLS = 60;
export const WORLD_ROWS = 60;
export const VIEW_COLS = 24;
export const VIEW_ROWS = 24;
export const TICK_MS = 130;

export const INITIAL_SNAKE_LENGTH = 3;
export const FOOD_COUNT = 18;
export const POINTS_PER_FOOD = 10;
export const MAX_PLAYERS = 8;
export const RESTART_DELAY_MS = 3000;

// Bot smartness: full smart up to length 10, then drops linearly to 0 by length 30
export const BOT_SMART_UNTIL = 10;
export const BOT_DUMB_RAMP = 20;

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

export const BOT_COLOR = '#94a3b8';      // slate gray — distinct from human colors

// Funny default names — used in the lobby (for humans) and the bot.
export const FUNNY_NAMES = [
  'Slinky', 'Wiggles', 'Hisstopher', 'Coily', 'Snek',
  'Noodle', 'Squiggle', 'Zigzag', 'Pickle', 'Wormy',
  'Sushi', 'Curly', 'Loopy', 'Pretzel', 'Mochi',
  'Pebbles', 'Tofu', 'Wasabi', 'Slither', 'Boopy',
  'Sir Hiss', 'Cap. Snek', 'Lord Bendy', 'Dr. Wiggle',
];

export const COLORS = {
  bgFar:        '#0c0c18',
  bgNear:       '#1e2042',      // radial gradient — darker at edges, slightly warmer in the middle
  grid:         '#1d1d33',
  snakeEye:     '#0f0f1a',
  food:         '#ef4444',
  foodGlow:     'rgba(239, 68, 68, 0.35)',
  worldEdge:    '#64748b',
  minimapBg:    '#0f0f1a',
  minimapFood:  '#ef4444',
  minimapView:  '#94a3b8',
  bodyText:     '#0f0f1a',
  bodyOutline:  'rgba(0, 0, 0, 0.35)',  // tinted edge around snake body
};
