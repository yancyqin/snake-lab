# Ideas — future tune-ups

A place to park ideas we tried, decided against, or might revisit. Not committed plans — these are the "we could…" list.

> For pre-camp instructor checklist see [PREP.md](PREP.md) — that's actionable. This file is for "could be fun someday."

## Tried, removed (might come back as opt-in)

### Predator NPCs

We had an immortal predator that chased the nearest snake every 2 ticks. **Removed in v2.2** because it dominated solo play and overshadowed the core human-vs-bot mechanic. Worth keeping as an **optional "hard mode"** toggled per room — drop in a new checkbox in the lobby's room-settings panel (like 👑 King and 👨‍🏫 Teacher already are).

Implementation reference: see commit `97a37bf` (file `v2-arena/bot.js` had `predatorMove`, `game.js` had `spawnPredators` / `this.predators`).

### Static obstacles (rocks)

18 rocks scattered around the world, lethal on touch. **Removed in v2.2** because they made navigation cluttered and felt arbitrary. Worth revisiting as **"maze mode"** — pre-designed labyrinth layouts instead of random scatter, so it feels deliberate.

Implementation reference: same commit. `Game.generateObstacles()` + `Snake.hitCells()` + obstacle rendering in `render.js`.

## Not yet tried — worth doing later

### Smooth tick interpolation
Snakes currently snap cell-to-cell every 130ms. Could lerp positions at 60fps for buttery movement. Client-side only; server stays cell-grid. Tricky bit: handling growth ticks where the body length changes mid-interpolation. Probably worth it once v3 is shipped.

### Power-up foods
Different food types with effects: **golden** (worth 50), **slow** (snake moves at half speed for N ticks), **shrink** (lose 2 cells), **ghost** (pass through self once). Each is a new entry in `constants.js` foods + a new icon/color.

### Wrap-around walls
Toggle per room: instead of dying at the wall, snake comes out the other side. Implemented as a `step()` mode flag in `Snake`. Less stressful for younger kids.

### Tournament / leaderboard
Persistent score across rounds within a room. Top-3 leaderboard shown at end of each round. Resets when room empties.

### Sound effects
Crisp blip on eat, descending tone on death. Web Audio API, no library. Mute toggle in lobby.

### Snake skins
Beyond color: striped, polka-dot, scaly textures. Implementation: SVG pattern fills per snake, or just a few procedural patterns.

### Spectator mode
When you die mid-round, freely pan the camera around to watch the remaining snakes. Currently the camera locks to your dead snake's last position.

### Replay / round recap
Record state snapshots during a round, replay them at 0.25× speed when round ends. Great for the teacher mode in v3.

### Mobile-friendly D-pad fallback
Some kids swipe inconsistently. An optional on-screen D-pad overlay (toggled in lobby) might help.

## Done — moved out of "long-shot" because we shipped them

### ✅ Hot-reload kids' code in v3 without leaving the round
Shipped — the in-game **Edit bot** modal swaps the `nextMove` function in place. Game keeps running, no ws disconnect, no lobby trip. Also persists module-level state via the factory pattern (so a learning bot's `qTable` survives the swap).

### ✅ Tunable strategy bot
Shipped as `tunable.js` sample. 4 weights (food, safety, blocking, open) right at the top. L4 is built around this — kids tune by hand.

### ✅ Self-learning bot
Shipped as `learning.js` sample. Q-learning, 144-state × 4-action table, ε-greedy with decay, persists across ticks via closure. L5 lesson explains the loop. Foundation for the "watch AI learn" claim on the flyer.

## Long-shot ideas — not yet tried

### Bot vs bot benchmarking (v3)
Standalone mode: pit two bots against each other 100 times, report win rate. Especially useful with `learning.js` — train it overnight, then benchmark against `safe.js` to quantify "how much did it learn?" Useful for kids to test deterministically without humans in the loop.

### Q-table live visualizer
A side panel during a Learning-bot run that shows the actual Q-table — situation grid colored by which action is best, updating live. Would turn the abstract "bot's brain" idea into a thing kids can *see* fill in. Mentioned in L5 as a future demo.

### Persist Q-table to localStorage between sessions
Right now the Learning bot's brain lives in the textarea closure — refresh = fresh bot. Could save `qTable` to `localStorage` so a kid's bot "remembers" across days. Tradeoff: harder to teach "this is the bot's only memory" if the memory is invisible to them.

### AI opponent variants in v3
Pre-built opponent bots at different difficulty levels ("Easy Eric", "Medium Maya", "Hard Hannah") so kids can practice against named characters before going head-to-head. Now partly covered by sample bots (random / greedy / safe / tunable / learning), but a clearer ladder would be nice.

### "Train your bot overnight" mode
Headless mode that runs `learning.js` against itself at high tick rate (no rendering, no 130ms wait) for thousands of rounds. Kid wakes up to a trained Q-table they can deploy. Real ML pipeline in a kid-sized package.
