# snake-lab — Vision

The long-term plan for this project. **Read this before making structural changes.** Everything below was agreed up-front; deviations should be discussed, not assumed.

## Goal

A three-version snake game used as the backbone of a **5-lesson "vibe coding" curriculum** for kids — modeled on `../lucasgame/` (tower defense built by a 12-year-old + dad + AI). The lessons themselves are written **after** the games stabilize; the code is the curriculum's substrate, not the other way around.

## The three versions

Each version lives in its own folder and runs standalone. A kid never needs to read v2 to play v1.

### v1-classic — Single-player snake
- Static HTML / vanilla JS / ES modules / canvas
- No server (open with `python3 -m http.server`)
- Classic snake mechanics: grid, food, score, die on wall or self
- The foundation. Everything in v2 and v3 reuses these patterns.

### v2-arena — Multiplayer snake (humans)
- Up to **8 humans per room**, each on their own keyboard/browser
- **Node.js + `ws`** WebSocket server
- Rooms joined via URL param (`?room=foo`) — no accounts, no lobby UI
- Each player controls a snake. Snakes can collide with each other.
- Server is the source of truth for game state.

### v3-coder — Programmable bots
- Up to **8 bots per room**. Each player writes a JavaScript function:
  ```js
  function nextMove(state) {
    // state.me = { body: [{x,y}, ...], direction }
    // state.food = [{x,y}, ...]
    // state.others = [...]   // visibility configured per room
    // state.board = { width, height }
    // state.tick = number
    return 'UP'; // or 'DOWN' | 'LEFT' | 'RIGHT'
  }
  ```
- Code is pasted into a **textarea on the page** and runs in **that player's own browser** (no untrusted code on the server). Browser sends the resulting move to the server each tick.
- **Two modes:**
  - **Regular** — open room. When a new player joins, the game restarts (with a brief countdown so existing players aren't ambushed).
  - **Teacher** — teacher hosts. Teacher can **pause / resume / step one tick / change tick rate / reset / pick opponent visibility (full bodies vs. heads-only)**. Lets the teacher freeze the game mid-action and ask "what should your bot do here?"
- Ships with 3 sample bots: `random`, `greedy` (chase nearest food), `safe` (avoid walls + self). Students copy and tweak.

## Stack decisions (locked)

| | Choice |
|---|---|
| Client | Vanilla HTML / ES modules / canvas — no frameworks |
| Server (v2, v3) | Node.js + `ws` package |
| Bot execution | Player's own browser (not server) |
| Docs language | English only |
| Bilingual? | No (lucasgame is; this isn't, for speed) |

## Build order

1. **v1-classic** — get the snake fundamentals solid
2. **v2-arena** — add server, multi-snake, rooms
3. **v3-coder** — swap keyboard input for bot function, add teacher controls (server logic reused from v2)
4. **LESSONS.md** — written last, distilled from the working code

## Status

- [x] Vision agreed
- [x] v1-classic — playable, verified in browser (movement, eating, growth, wall/self collision, game-over, restart, big world w/ camera + minimap, touch controls, responsive)
- [ ] v2-arena
- [ ] v3-coder (regular + teacher)
- [~] LESSONS.md — L1 + L2 drafted for v1-classic (play+lecture format); L3-L5 pending v2/v3 build
- [ ] COMMON_MISTAKES.md
- [ ] Deploy v1 + v3-coder client to GitHub Pages (v2 + v3 server stay local)

## Camp format

Camp lessons are **play + lecture**, not workbook. Kids don't do free-form tuning — every code interaction is instructor-led. See [LESSONS.md](LESSONS.md) for the curriculum so far.

## Open issues to revisit

- **v3-regular restart countdown** — proposed 5 seconds after new join before reset. Confirm during v3 build.
- **Bot timeout** — if `nextMove()` infinite-loops, browser hangs. Decide on Web Worker isolation vs. timeout race when we build v3.
- **Spectator mode** — when a snake dies in v2/v3, does the player just watch or get respawned? Decide during v2 build.

## Teaching constraints (carried over from lucasgame)

- **Readability and teachability over cleverness.**
- Small, single-concept edits over rewrites.
- Point to specific file:line; explain *why*, not just *what*.
- Don't introduce new abstractions speculatively — the existing patterns are the curriculum.
- ES modules with one class per file. `constants.js` holds tunable data.
