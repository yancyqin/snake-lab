// All the numbers you can tweak to change how the game feels.
// Try changing them and see what happens!

export const CELL_SIZE = 32;

// The world is much bigger than what fits on screen.
// The camera follows the snake's head — only the visible cells are drawn.
export const WORLD_COLS = 60;
export const WORLD_ROWS = 60;
export const VIEW_COLS = 24;   // how many cells fit on the screen at once
export const VIEW_ROWS = 24;

export const TICK_MS = 130;    // how often the snake moves (lower = faster)

export const INITIAL_SNAKE_LENGTH = 3;
export const FOOD_COUNT = 10;
export const POINTS_PER_FOOD = 10;

export const COLORS = {
  background:   '#1a1a2e',
  grid:         '#22223a',
  snakeHead:    '#4ade80',
  snakeBody:    '#22c55e',
  snakeEye:     '#0f0f1a',
  food:         '#ef4444',
  worldEdge:    '#64748b',
  minimapBg:    '#0f0f1a',
  minimapSnake: '#4ade80',
  minimapFood:  '#ef4444',
  minimapView:  '#94a3b8',
};
