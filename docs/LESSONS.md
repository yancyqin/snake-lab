# Snake Lab — Camp Lessons

A 3-day camp curriculum built around the three Snake games in this repo. Format: **play + lecture**. Kids play the running game on their iPads; the instructor uses the game as a live demo to teach concepts. Kids don't do free-form tuning — every code interaction is instructor-led.

> **For the full project plan, read [../README.md](../README.md).**
> **For the AI assistant guide, read [../CLAUDE.md](../CLAUDE.md).**
> **For the pre-camp instructor checklist, read [PREP.md](PREP.md).**

## Camp agenda (3 days, 6 sessions)

| Day | Session | Topic | Time | Lessons |
|-----|---------|-------|------|---------|
| **1 — Hello Snake** | AM | Intros, play v1, learn how the snake works | ~2.5 h | **L1, L2** |
| | PM | Try v2 — multiplayer chaos | ~1.5 h | (free play) |
| **2 — Snake Arena** | AM | How the server works, the bot's brain | ~2.5 h | **L3, L4** |
| | PM | Try v3 — watch sample bots play | ~1.5 h | (free play) |
| **3 — Code Your Snake** | AM | Write your own bot | ~2.5 h | **L5** |
| | PM | Tournament, reflection, parents demo | ~1.5 h | **L6** |

## Instructor setup (do once before camp)

1. Each kid has an iPad (or Chromebook / laptop) on the camp WiFi.
2. **Day 1** — serve v1 locally:
   ```bash
   cd snake-lab/v1-classic
   python3 server.py 8080
   ```
   Tell kids: open `http://<instructor-mac-ip>:8080`.
3. **Day 2+3** — serve v2 (and later v3) locally too:
   ```bash
   cd snake-lab/v2-arena
   node server.js
   ```
   Kids open `http://<instructor-mac-ip>:8080` (different port if v1 still running).
4. After-camp play is available at **https://snake-lab-arena.onrender.com** (v2) — first hit takes ~30s while Render wakes the machine.
5. Have a projector or screen share so the instructor can walk through code live.
6. Have the code open in an editor on the projected screen — `Snake.js`, `Game.js`, `server.js`, etc.

---

## Lesson 1 — The Snake is an Array (45–60 min · v1-classic)

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

## Lesson 2 — Code is a Map (45–60 min · v1-classic)

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

## Day 1 PM — Try v2 (free play, ~60–90 min)

No new lesson. The point is **exposure** — kids see multiplayer snake before we explain it.

**Suggested flow:**
1. Instructor projects v2 lobby. Picks a funny default name. Picks a color.
2. Hits **+ Create new room** → lands in `cosmic-viper` or whatever.
3. Asks: "OK, who wants to join my room?" Kids open the same URL, see the room in the list, click Join.
4. **Chaos.** 6-8 snakes in one room. Round restarts whenever a new kid joins.
5. After 20-30 min, instructor calls out: "Notice anything weird? When I die, you can still see me. When you eat food, I see your length grow. How does my iPad know what's happening on yours?"
6. Don't answer. Park the question for Day 2 morning.

The **mystery is the lesson** — kids leave Day 1 wondering "how do our games stay in sync?" Tomorrow's L3 answers it.

---

## Lesson 3 — Two Computers Talk (70 min · v2-arena)

> **Big idea:** When you played v2 yesterday, your iPad and every other iPad were all talking to **one computer in the middle** — the server. The server holds the truth about the game. Everyone connects to it.

**Reference for the instructor:** [PROTOCOL.md](PROTOCOL.md) lists every message type with examples. Kids should see real JSON in this lesson, not just metaphors.

### What kids will learn
- **Client vs server** — your iPad is the client; my laptop is the server.
- **What a WebSocket is** — a phone line that stays open between client and server.
- **The new files in v2-arena/** — server-side files don't run on your iPad, they run on my laptop.
- **The actual messages** that fly between the two computers — they're JSON, they're readable, kids can see them in DevTools.

### Part 1 — Play (5 min) + the dangling question
Quick warm-up. Remind them of yesterday's mystery: how do iPads stay in sync?

### Part 2 — Lecture: "Two kinds of computers" (15 min)

Draw on the whiteboard:
```
   [iPad 1]            [iPad 2]            [iPad 3]
       \                  |                  /
        \                 |                 /
         \                |                /
          \               |               /
           --------> [ MAC ] <--------
                 (Mr. Yancy's laptop)
                  THE SERVER
```

> "Your iPad is a **client**. There can be many clients. My laptop running `node server.js` is the **server**. There's only one. Every client connects to the same server. The server is the **truth**. If the server says your snake is dead, your snake is dead — even if your iPad still shows it alive for a second."

**Show the projector's terminal where `node server.js` is running.** Kids see it logging:
```
[room cosmic-viper] +p1 Curly #4ade80 (1/8)
[room cosmic-viper] bot joined
[room cosmic-viper] +p2 Wiggles #fbbf24 (2/8)
[room cosmic-viper] restart in 5000ms (new player joined)
```

> "When you opened v2, that `+p1 Curly` line is YOU joining the server. Each line is something happening. Every kid here is in this log."

### Part 3 — Lecture: "What's in v2-arena/?" (15 min)

Project the folder tree:
```
v2-arena/
  server.js          ← runs on MY LAPTOP only — kids never see this run
  game.js            ← runs on the server
  snake.js           ← runs on the server (server is the boss of all snakes)
  bot.js             ← runs on the server (the bot's brain)
  public/            ← THIS is what your iPad downloads
    index.html
    main.js          ← runs on YOUR IPAD
    render.js        ← runs on YOUR IPAD (draws the snake)
    constants.js     ← shared between server and client
```

> "v1 had `js/` — that was all client-side. v2 has TWO sets of code. The stuff outside `public/` runs on my laptop. The stuff inside `public/` runs on your iPad. They talk to each other."

### Part 4 — Lecture: "What's a WebSocket? What gets said?" (20 min)

> "Normally when you visit a website, your iPad sends a question, the server sends an answer, then they hang up. Like sending a text. But for snake, we need them to talk **all the time**. So we use a **WebSocket** — it's like a phone call that stays open."

So **what do they say to each other?** Two things happen on this phone call:

**Your iPad → server:** only ONE kind of message, ever.
```json
{ "type": "direction", "dir": "UP" }
```
> "Every time you swipe, your iPad whispers this into the phone. That's it. You can ONLY ask to turn. You can't say 'give me food' or 'kill that snake.' The server decides everything."

**Server → your iPad:** lots of messages, but **one big one runs the show.** Every 130ms, the server broadcasts the whole game state to everyone:
```json
{
  "type": "state",
  "tick": 42,
  "snakes": [
    { "id": "p1", "name": "Curly",  "color": "#4ade80", "body": [...], "alive": true },
    { "id": "bot","name": "Snek",   "color": "#94a3b8", "body": [...], "alive": true }
  ],
  "foods": [ {"x":5,"y":10}, {"x":17,"y":42}, ... ],
  "scores": { "p1": {...}, "bot": {...} }
}
```
> "This is the **truth**. Your iPad's only job is to draw what's in here. If `snakes[0].body` changes, your snake moved. If a food disappears from `foods`, someone ate it. Everything you see on the screen comes from this message."

There are a few other server → client messages for special moments (when you join, when a round ends, when a new player joins, when the room is full). The full list is in **[PROTOCOL.md](PROTOCOL.md)** if you're curious.

### Part 5 — Hands-on: peek at the messages (10 min)

Now kids see the messages **live**. Two ways to look:

**(a) DevTools Network tab — see the raw phone call.**
1. Open DevTools (F12 or Right-click → Inspect)
2. **Network** tab → filter **WS** (WebSocket)
3. Click the open WebSocket connection
4. **Messages** sub-tab — every 130ms a new green/red line appears with the JSON payload
5. Click any `state` message → expand `snakes` → kids see THEIR snake's `body` cells

**(b) JS Console — poke at the last message.**
```js
window.snakeArena.state.tick           // current tick number — changes every 130ms
window.snakeArena.state.snakes.length  // how many snakes are in the room
window.snakeArena.state.foods          // every food in the world
window.snakeArena.state.scores         // the live scoreboard
window.snakeArena.myId                 // your own playerId
```

> "The server tells your iPad EVERYTHING, every 130ms. There are no secrets. You can see exactly what your iPad sees."

### Part 6 — Wrap-up question (5 min)

> *"What happens if Mr. Yancy closes his laptop?"*

Lead them to: **all the games stop**. The server is the truth — no server, no game. (This is also why we deploy v2 to render.com so kids can play after camp.)

**Tease v3:**
> "Tomorrow afternoon you'll see v3 — programmable snake. Same protocol, same messages. The only difference is: instead of *you* deciding which way to turn, *your code* decides. Your code sends `{type: 'direction', dir: 'UP'}` just like your finger does."

### Instructor notes
- Don't use the word "protocol" in the lecture. Use "phone call" or "what they say." The PROTOCOL.md file is for *you*; the kids hear it as a phone call.
- The terminal log is **the** demo for Part 2 — kids LOVE seeing their join show up as a log line. Make it big and readable.
- For Part 5, if iPads can't access DevTools, project ONE kid's session on the screen via Web Inspector over USB. Everyone watches; one kid drives.
- If a kid asks "what's a port?" — sidebar: "a port is like an apartment number on the same street address. Different programs on the same computer can each have their own port." Then move on.
- If a kid asks "is JSON a programming language?" — "no, it's just a way to write data so two computers can both read it. `{` opens a thing with properties, `[` opens a list. Same as JS object literals."

---

## Lesson 4 — The Bot's Brain (45 min · v2-arena)

> **Big idea:** The bot you play against is just code. It looks at the same game state you see, decides where to go, and sends a move. We can read its brain.

### What kids will learn
- The bot is **not magic** — it's a function that runs on the server every tick.
- **Smartness can be a number** — 1.0 means perfect play, 0.0 means random.
- The "bot gets dumber as it grows" rule is **one line of code** they can read.

### Part 1 — Play (5 min)
Solo room. Watch the bot. Notice it says "100% smart" in the scoreboard when it's short. After a couple of foods, watch the smartness number.

### Part 2 — Lecture: "Where does the bot decide?" (15 min)

Project `v2-arena/bot.js`. Walk through `botMove`:

```js
export function botMove(bot, allSnakes, foods) {
  const smartness = computeSmartness(bot.body.length);
  if (Math.random() < smartness) {
    return smartMove(bot, allSnakes, foods);
  } else {
    return safeRandomMove(bot, allSnakes);
  }
}
```

**Translate:**
> "Every tick, the bot rolls a dice. If it rolls below `smartness`, it picks the smart move — the direction that gets closest to food without dying. Otherwise it picks any direction that doesn't kill it. At 100% smart, it ALWAYS picks the smart move. At 0% smart, it ALWAYS rolls random."

Then `computeSmartness`:
```js
export function computeSmartness(length) {
  if (length <= BOT_SMART_UNTIL) return 1.0;
  return Math.max(0, 1 - (length - BOT_SMART_UNTIL) / BOT_DUMB_RAMP);
}
```

> "Until the bot is length 10, it's 100% smart. After length 10, it gets dumber by 5% per cell. By length 30, it's totally random."

Draw this on the whiteboard as a graph: x = length, y = smartness. Flat line at 1.0 until x=10, then linear drop to 0 at x=30.

### Part 3 — Lecture: "What does 'smart' even mean?" (15 min)

Project `smartMove`:
```js
function smartMove(bot, allSnakes, foods) {
  const head = bot.body[0];
  const food = nearestFood(head, foods);
  const candidates = validDirs(bot.direction).map(dir => {
    const nh = nextHeadIn(dir, head);
    return {
      dir,
      deadly: isDeadly(nh, allSnakes),
      distToFood: Math.abs(nh.x - food.x) + Math.abs(nh.y - food.y),
    };
  });
  const safe = candidates.filter(c => !c.deadly);
  if (safe.length === 0) return candidates[0]?.dir || bot.direction;
  safe.sort((a, b) => a.distToFood - b.distToFood);
  return safe[0].dir;
}
```

**Walk through, line by line:**
1. Find the nearest food.
2. For each direction we could go (excluding 180° reverse): figure out where the head would land, whether that's deadly, and how far from food.
3. Drop the deadly ones.
4. Pick the safe move that gets us closest to food.

> "That's it. That's the whole 'smart' brain. Find food, don't die. Just like how YOU play. The only difference is the bot is doing this math 8 times per second."

### Part 4 — Hands-on: Tune the bot (10 min)

Instructor opens `constants.js`:
```js
export const BOT_SMART_UNTIL = 10;
export const BOT_DUMB_RAMP = 20;
```

Change `BOT_SMART_UNTIL = 2`. Restart server. Bot is now dumb almost immediately.

Change `BOT_SMART_UNTIL = 50`. Bot stays smart even when really long. Now it's nearly unbeatable.

> "Two numbers control how mean the bot is. That's the whole knob."

### Part 5 — Wrap-up question (5 min)

> *"Tomorrow, you're going to write your OWN bot. What's the very simplest bot you can think of?"*

Possible answers:
- "Just go up forever." (Dies on top wall — funny.)
- "Always turn left." (Spirals into itself.)
- "Random direction each tick." (Lives a few seconds usually.)

Tease: "Tomorrow you'll get a textarea and write `function nextMove(state) { return 'UP' }`. We'll see whose bot lives longest."

### Instructor notes
- The whiteboard graph for smartness is the hook. Kids remember pictures.
- Don't dwell on `Math.random() < smartness`. "Roll a dice" is enough.
- If a kid asks "what if there are two foods at the same distance?" — show that `safe.sort(...)` picks the first one, which is whichever appears first in the foods list. Ties are arbitrary, which is fine.

---

## Day 2 PM — Try v3 (free play, ~60–90 min)

No new lesson. Same "exposure" pattern as Day 1 PM. Kids look at v3-coder and play with sample bots.

**Suggested flow:**
1. Project v3-coder. Show the new thing: there's a **textarea** with code in it.
2. Walk through the 3 sample bots in order:
   - **random.js** — "I roll a dice every tick"
   - **greedy.js** — "I always chase the nearest food"
   - **safe.js** — "I avoid walls and my own body"
3. Each kid joins a room and picks one sample bot. Their bot plays against the others.
4. After 20-30 min, ask: "Which bot won most? Why?"
5. Park the next question: "Could you write one that beats them all?" — tomorrow's lesson.

---

## Lesson 5 — Be the Bot (90 min · v3-coder)

> **Big idea:** A program can play the game for you. Today you write that program.

> ⚠️ Outline only — will be filled in once v3-coder ships.

### What kids will learn
- The shape of a bot function: `function nextMove(state) { return 'UP' }`
- What's in `state` (your snake, others, food, board, tick)
- How to think about "what should I do?" as code

### Suggested structure
1. **Recap the sample bots** from yesterday afternoon.
2. **Walk through `greedy.js` line by line** — the simplest "real" bot.
3. **Build a `greedy_safe.js` together** — combine greedy + don't crash.
4. **Kids fork it.** Each kid writes their own version, can change ONE thing:
   - "Mine chases the closest food, but avoids opponents heads"
   - "Mine goes to the food with the most other foods near it"
   - "Mine zigzags so it's harder to corner"
5. **Test in solo mode** — each kid plays their bot vs the built-in dumb bot.

### Open questions until v3 ships
- What's the exact `state` shape?
- How does the kid load/test their bot? Paste in textarea? Save to file?
- What sample bots ship with v3?

(These get nailed down when we build v3.)

---

## Lesson 6 — Tournament + What's Next (90 min · v3-coder)

> **Big idea:** Your bot vs everyone else's bot. May the best `nextMove()` win.

> ⚠️ Outline only — will be filled in once v3-coder ships.

### Structure (rough)
1. **Final tweaks** (15 min) — kids polish their bots.
2. **Tournament** (45 min) — instructor hosts a v3-coder room in **teacher mode**. All kids' bots join. Run 5 rounds, score persistent. Project the room.
3. **Discussion** (15 min):
   - Which bot won? Why?
   - What's a hack you'd add if you had another day?
   - What would you change about the rules?
4. **Parents arrive** (15 min):
   - Kids each demo their bot (30 seconds each).
   - One celebratory tournament run.

### Open questions
- Tournament format: round-robin? single elimination? "battle royale" with all bots in one room?
- Scoring: longest snake wins? most foods eaten? last alive?
- (Decide when v3 ships and we know what "winning" feels like.)

---

## Glossary

- **Tick** — one step of the game loop. In Snake, every 130ms.
- **Cell** — one square on the grid. Has an `x` (column) and `y` (row).
- **Head** — the first cell of the snake (`body[0]`).
- **Camera** — the top-left world cell that's currently shown on screen.
- **World vs View** — the world is everything (60×60). The view is what fits on screen (24×24).
- **pendingDirection** — the direction we'll apply on the next tick. Lets us buffer player input.
- **Client** — your iPad. Runs `public/main.js`. Draws the screen, sends inputs.
- **Server** — Mr. Yancy's laptop. Runs `server.js`. Holds the truth. Tells all clients what to draw.
- **WebSocket** — the "phone line" between client and server. Stays open all game.
- **Bot** — code that decides moves instead of a human. Lives in `bot.js` (v2) or in your textarea (v3).
- **Smartness** — a number from 0 to 1. 1 = always picks the best move. 0 = pure random.
