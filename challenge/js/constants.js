// Snake Lab — Homework Challenge
// Numbers that control the 1v1 duel. Tweak and see what changes!

export const BOARD = 24;          // 24×24 cells — tight enough that skill (not luck) decides it
export const CELL = 26;           // pixels per cell → 624×624 canvas (whole board visible, no camera)
export const FOODS = 5;           // food on the board at once
export const INIT_LEN = 3;        // starting snake length
export const TICK_MS = 130;       // ms per move (same speed for you and the foe — fair fight)
export const TICK_CAP = 1000;     // if both survive this many ticks, the LONGER snake wins

export const COLORS = {
  bgFar:    '#0c0c18',
  bgNear:   '#1e2042',
  grid:     '#1d1d33',
  wall:     '#64748b',
  food:     '#ef4444',
  foodGlow: 'rgba(239, 68, 68, 0.35)',
  you:      '#4ade80',   // your snake — green
  foe:      '#f97316',   // the opponent — orange
  eye:      '#0f0f1a',
  bodyText: '#0f0f1a',
  outline:  'rgba(0, 0, 0, 0.35)',
};
