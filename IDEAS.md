# Ideas — future tune-ups

A place to park ideas we tried, decided against, or might revisit. Not committed plans — these are the "we could…" list.

## Tried, removed (might come back as opt-in)

### Predator NPCs

We had an immortal predator that chased the nearest snake every 2 ticks. **Removed in v2.2** because it dominated solo play and overshadowed the core human-vs-bot mechanic. Worth keeping as an **optional "hard mode"** toggled per room — show a checkbox in the lobby like "🦂 Predator mode."

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

## Long-shot ideas

### Hot-reload kids' code in v3 without leaving the round
Currently the kid would deploy, the bot would join, etc. A "reload bot" button that swaps the function in-place would let kids iterate faster.

### Bot vs bot benchmarking (v3)
Standalone mode: pit two bots against each other 100 times, report win rate. Useful for kids to test their bot deterministically without humans in the loop.

### AI opponent variants in v3
Pre-built opponent bots at different difficulty levels ("Easy Eric", "Medium Maya", "Hard Hannah") so kids can practice against named characters before going head-to-head.
