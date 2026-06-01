# Snake Lab — Camp Lessons

A camp curriculum built around the three Snake games in this repo. Format: **play + lecture**. Kids play the running game on their iPads; the instructor uses the game as a live demo to teach concepts. Kids don't do free-form tuning — every code interaction is instructor-led.

> **For the full project plan, read [VISION.md](VISION.md).**
> **For the AI assistant guide, read [CLAUDE.md](CLAUDE.md).**

## Course overview

| # | Version | Title | Time | Big idea |
|---|---------|-------|------|----------|
| 1 | v1-classic | The Snake is an Array | 45–60 min | Game state is just data. The screen is a picture of that data. |
| 2 | v1-classic | Code is a Map | 45–60 min | We split code into files. Each file has one job. |
| 3 | v2-arena | *TBD — written after v2 is built* | — | — |
| 4 | v3-coder | *TBD — written after v3 is built* | — | — |
| 5 | v3-coder | *TBD — tournament/capstone* | — | — |

## Instructor setup (do once before camp)

1. Each kid has a device that can run `v1-classic` (iPad, Chromebook, or laptop).
2. Serve the game on the local network so all kids can hit the same URL:
   ```bash
   cd snake-lab/v1-classic
   python3 -m http.server 8080 --bind 0.0.0.0
   ```
   Tell kids: open `http://<instructor-mac-ip>:8080`.
3. Instructor needs a Mac with the code open in an editor + a projector or screen-share.
4. For the DevTools demo (Lesson 1), instructor uses Safari/Chrome on the projector. Optionally: enable Safari Web Inspector on the iPads (Settings → Safari → Advanced → Web Inspector) and attach over USB so kids can poke at their own game.

---

## Lesson 1 — The Snake is an Array (45–60 min)

> **Big idea:** Everything you see — the snake, the food, the score — is just numbers in memory. The game loop reads those numbers 8 times a second and paints them on the screen. If you change the numbers, the picture changes.

### What kids will learn
- A "snake" in code is a **list of cells**, not a creature.
- The game has a **tick** — every 130ms, the computer redraws everything.
- DevTools is a **window into the game's brain** — you can see the snake's body as an actual list.

### Part 1 — Play (10 min)
- Kids open the game on their iPads.
- Goal: get to score 100.
- Things to notice (call out before they start):
  - The head looks different from the body — it has eyes.
  - There's a tiny **minimap** on the side showing food they can't see.
  - The world is bigger than the screen — you have to *explore*.

### Part 2 — Lecture: "What IS the snake?" (20 min)

Project `v1-classic/js/Snake.js` on the screen.

**Show the constructor.** Walk through it slowly:
```js
constructor(startX, startY, length = INITIAL_SNAKE_LENGTH) {
  this.body = [];
  for (let i = 0; i < length; i++) {
    this.body.push({ x: startX - i, y: startY });
  }
  this.direction = 'RIGHT';
}
```

**Translate to plain English:**
> "The snake has a property called `body`. It's a list. Each thing in the list is a *cell* — a little object with an `x` and a `y`. The first item (`body[0]`) is the **head**. The rest are the body."

**Pause for a question to the room:**
> *"If `body` is a list with 3 items, and we want a snake of length 10, what would `body.length` be?"*

Now switch to `Game.js` and show `tick()`:
```js
tick() {
  if (this.over) return;
  const next = this.snake.nextHead();
  const eatenIndex = this.foods.findIndex(f => f.x === next.x && f.y === next.y);
  const willEat = eatenIndex !== -1;
  this.snake.step(willEat);
  if (this.snake.isDead()) { ... }
  if (willEat) { this.score += POINTS_PER_FOOD; ... }
  this.draw();
}
```

**Translate:**
> "Every 130 milliseconds, the computer does these six things. Look ahead. Check for food. Take a step. Check if we died. Maybe count the food. Redraw the screen. Then it sleeps for 130ms and does it again. That's the **game loop**."

Now show `snake.step()`:
```js
step(grow = false) {
  const next = this.nextHead();
  this.direction = this.pendingDirection;
  this.body.unshift(next);
  if (!grow) this.body.pop();
}
```

**The "aha" moment:**
> "The snake doesn't actually move. Every tick, we **add a new head at the front** of the list and **remove the tail from the back**. That looks like movement on the screen. **Growing = skipping the 'remove tail' step.** That's why eating food makes the snake longer — we keep the tail."

Write on the board:
```
move = add head + remove tail
grow = add head + KEEP tail
```

### Part 3 — Hands-on: DevTools spy (10–15 min)

This is the magic moment. Kids see the abstract concept as concrete data.

**Setup:** instructor demonstrates on the projector first, then kids try on their device (if they have DevTools), or call out commands for the instructor to type.

In DevTools Console, type:
```js
game.snake.body
```
**Expected:** `[{x: 30, y: 30}, {x: 29, y: 30}, {x: 28, y: 30}]` — the actual snake!

Then try:
```js
game.snake.body.length         // length of the snake
game.snake.head()              // just the head cell
game.foods                     // all 10 foods, with x and y
game.score                     // current score
```

**Watch it change live:**
> "Now play for 5 seconds, then run `game.snake.body` again. What's different?"

The `x` and `y` numbers have changed. The list moved.

**Mind-blow** (optional, only if kids are following well):
```js
game.snake.body.unshift({ x: 30, y: 30 })
```
The snake just teleported a cell! (It'll behave weirdly after this — that's fine, it shows the data IS the snake.)

### Part 4 — Wrap-up question (5 min)

Ask the room:
> *"If the snake is just a list of cells, and the game just keeps adding to the front and removing from the back — how does the game know when you DIED?"*

Lead them to: **the game checks the head every tick.**

Project `Snake.isDead()`:
```js
isDead() {
  return this.hitWall() || this.hitSelf();
}
```

> "Two ways to die. The head went off the world. Or the head landed on its own body. We only check the head — the body never kills itself, because the snake can't turn 180° in one step."

### Instructor notes
- Don't get bogged down in JavaScript syntax (`unshift`, `pop`, `findIndex`). Translate to plain English: "add to the front," "remove from the back," "find a match."
- If a kid asks "why 130 milliseconds?" — open `constants.js`, point at `TICK_MS = 130`, say "that number controls how fast. Lower = faster. Try 60 or 300 at home." (Don't get them tuning during the lesson — save it.)
- If DevTools doesn't work on the iPad, have one kid mirror their screen and let the room shout commands.

---

## Lesson 2 — Code is a Map (45–60 min)

> **Big idea:** Real code is split into files. Each file does ONE thing. Then we connect them. Today we follow a swipe all the way from the iPad screen to the snake actually turning.

### What kids will learn
- **Modularity** — why we have 5 files instead of 1.
- **The path of an event** — what happens between "I swipe" and "the snake turns."
- **Why there's a `pendingDirection`** — the buffer that prevents instant death.

### Part 1 — Play (5 min)
- Quick rounds. Notice: when you swipe, the snake doesn't turn *instantly* — it turns on the next tick. Why?

### Part 2 — Lecture: "5 files, 5 jobs" (15 min)

Show the folder tree on the screen:
```
v1-classic/
  index.html       ← The Screen (what you see)
  js/
    constants.js   ← The Dial Board (numbers we can change)
    Snake.js       ← The Snake (only knows snake things)
    Food.js        ← The Food (only knows food things)
    Game.js        ← The Boss (coordinates everyone, runs the tick)
```

**Ask the room first:** *"If we have a file called `Snake.js`, what do you think is in it?"*

Open each file briefly. Show the top 5–10 lines. Confirm or correct guesses.

**Key principle:**
> "Each file does ONE job. `Snake.js` doesn't know about food. `Food.js` doesn't know about the snake's direction. The only file that knows about everyone is `Game.js` — the boss."

**Why split them?** Two reasons:
1. **It's easier to find things.** "Where's the rule that the snake dies?" → `Snake.js`. "Where's the score?" → `Game.js`.
2. **You can change one without breaking the others.** Adding a new food type doesn't risk breaking how the snake moves.

### Part 3 — Lecture: "Where does a swipe go?" (15–20 min)

The big code-tracing moment. Project `Game.js` and walk through what happens on a swipe right.

**Step 1.** Browser fires a `touchstart` event when your finger touches the canvas.
**Step 2.** `_bindTouch()` records where your finger started.
**Step 3.** On `touchend`, it computes the swipe — `dx` (horizontal) and `dy` (vertical).
**Step 4.** Whichever is bigger wins. If `dx > 0`, it's a swipe RIGHT.
```js
this.snake.setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
```
**Step 5.** Snake stores it as `pendingDirection`. **NOT `direction` yet!**
```js
setDirection(dir) {
  const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
  if (opposite[dir] === this.direction) return;   // refuse 180° flips
  this.pendingDirection = dir;
}
```
**Step 6.** *Nothing happens visually yet.* The snake is still moving in its old direction.

**Pause.** Ask the room:
> *"If I swipe right, when does the snake actually turn?"*

**Step 7.** Up to 130ms later, `tick()` fires.
**Step 8.** Inside `snake.step()`, this line runs:
```js
this.direction = this.pendingDirection;   // NOW the direction changes
```
**Step 9.** New head is computed using the new direction. The snake turns. Screen updates.

**The "aha" moment:**
> "Inputs arrive *between* ticks. We can't move the snake the moment you swipe — we have to wait for the next tick. So we **remember** the swipe in `pendingDirection`. Then the tick applies it."

**Counter-example to drive it home:**
> "What if we didn't have `pendingDirection`? Suppose you press DOWN, then UP really fast — within one tick. The snake would set direction to DOWN, then immediately to UP, and on the next tick move UP into its own body. **Instant death.** The buffer prevents that."

(Also explain the 180° check — even with the buffer, we refuse direct reversals.)

### Part 4 — Lecture: World vs View (10 min)

Project the running game. Point at the minimap.

> "How big is the world?"

Open `constants.js`:
```js
export const WORLD_COLS = 60;
export const WORLD_ROWS = 60;
export const VIEW_COLS = 24;
export const VIEW_ROWS = 24;
```

> "The **world** is 60 by 60 cells. The **view** is 24 by 24. You only see about a *sixth* of the world at a time. The minimap shows the whole thing."

Project `Game.cameraX()`:
```js
cameraX() {
  const half = Math.floor(VIEW_COLS / 2);
  return Math.max(0, Math.min(WORLD_COLS - VIEW_COLS, this.snake.head().x - half));
}
```

> "The camera tries to keep the snake in the middle of the view. `Math.max(0, ...)` means never scroll off the left side. `Math.min(WORLD - VIEW, ...)` means never scroll off the right side. So the camera follows you, but **stops at the edges**."

Demonstrate: walk the snake to the right wall. The camera scrolls right, then stops. The bright gray wall appears.

### Part 5 — Hands-on: Change a color (10 min)

The instructor opens `constants.js` on the projector. Highlights the `COLORS` block:
```js
export const COLORS = {
  background:   '#1a1a2e',
  grid:         '#22223a',
  snakeHead:    '#4ade80',   // ← let's change this!
  snakeBody:    '#22c55e',
  ...
};
```

Each kid picks a color. (Have a list of color names → hex codes on the board: red `#ef4444`, blue `#3b82f6`, yellow `#eab308`, purple `#a855f7`, pink `#ec4899`, orange `#f97316`.)

Instructor changes the file on the projector, saves, reloads — kids reload their iPads. **Every kid's snake is now their color.**

> "We changed ONE number. The whole game looks different. That's what we mean when we say **data drives behavior**."

### Part 6 — Wrap-up question (5 min)

> *"If we wanted the snake to come out the OTHER side instead of dying when it hits a wall, which file would we change? Which function?"*

Lead them to `Snake.js`, the `hitWall()` function — and beyond that, the `step()` function (where we'd wrap the coordinates instead of letting them go out of bounds).

**Tease the future:**
> "We won't change it today. But this is how every new feature gets added — figure out which file owns the rule, then change the rule."

### Instructor notes
- The pendingDirection trace is the hardest part. Slow way down. Draw it on a whiteboard if needed: swipe → setDirection → pendingDirection → tick → direction changes → snake moves.
- For the color change, pre-pick the hex codes so kids aren't fumbling.
- If a kid asks "why is the world bigger than the view?" — say "because exploring is more fun. The minimap helps you find food without seeing the whole thing." (This sets up the spatial/strategy concept for later when bots have to navigate in v3.)

---

## Lessons 3, 4, 5 — TBD

To be written after `v2-arena` and `v3-coder` are built. Same play+lecture format. Expected topics:
- **L3 (v2-arena):** Two computers talking to each other — what's a WebSocket?
- **L4 (v3-coder):** A program that plays the game for you — writing `nextMove(state)`.
- **L5 (v3-coder, capstone):** Tournament. Each kid's bot competes. Teacher-hosted, paused between rounds to discuss strategy.

---

## Glossary

- **Tick** — one step of the game loop. In Snake, every 130ms.
- **Cell** — one square on the grid. Has an `x` (column) and `y` (row).
- **Head** — the first cell of the snake (`body[0]`).
- **Camera** — the top-left world cell that's currently shown on screen.
- **World vs View** — the world is everything (60×60). The view is what fits on screen (24×24).
- **pendingDirection** — the direction we'll apply on the next tick. Lets us buffer player input.
