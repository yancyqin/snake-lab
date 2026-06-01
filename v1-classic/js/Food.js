import { WORLD_COLS, WORLD_ROWS } from './constants.js';

export class Food {
  constructor() {
    this.x = 0;
    this.y = 0;
  }

  // Place at a random cell that the snake — and any other foods — aren't on.
  spawn(snake, otherFoods = []) {
    let x, y;
    do {
      x = Math.floor(Math.random() * WORLD_COLS);
      y = Math.floor(Math.random() * WORLD_ROWS);
    } while (snake.occupies(x, y) || otherFoods.some(f => f.x === x && f.y === y));
    this.x = x;
    this.y = y;
  }
}
