# snake-lab 🐍

**[Play online →](https://yancyqin.github.io/snake-lab/)**

A three-version snake game built as a vibe-coding learning journey for kids. Each version teaches more about programming — from a single-player classic to programmable bots competing in a tournament. Follows the same pattern as [`lucasgame`](../lucasgame/) (tower defense).

> **This is the project's source of truth.** Read it before making structural changes — it locks the design decisions. For the AI assistant guide, see [CLAUDE.md](CLAUDE.md). For the camp curriculum, see [docs/](docs/).

## Play

| | What | Stack | URL |
|---|---|---|---|
| **v1-classic** | Single-player snake | Static HTML + vanilla JS | https://yancyqin.github.io/snake-lab/ |
| **v2-arena** | Multiplayer snake (humans) | Node.js + `ws` | https://snake-lab-arena.onrender.com |
| **v3-coder** | Programmable bots | Node.js + `ws` | https://snake-lab-coder.onrender.com |

## The three versions

Each version lives in its own folder and runs standalone. A kid never needs to read v2 to play v1.

### v1-classic — Single-player snake
- Static HTML / vanilla JS / ES modules / canvas
- No server. Open with `python3 server.py 8080`.
- Classic snake mechanics: grid, food, score, die on wall or self.
- 60×60 world, 24×24 visible viewport, camera follows the head, minimap on the side.
- The foundation. Everything in v2 and v3 reuses these patterns.

### v2-arena — Multiplayer snake
- Up to **8 humans per room**, each on their own iPad/laptop.
- **Node.js + `ws`** WebSocket server. One process serves both the client (static `public/`) and the game (WebSocket upgrade).
- Lobby UI with name input (random funny default), color picker, room list.
- New player joining a 2+ room triggers a **5s restart countdown** — fair start, bot leaves.
- Solo room gets a bot that's **very smart until length 10, then dumber as it grows**. Hard to beat at first; catchable as it stretches out.
- Each snake's name is **painted in letters across the body** (with a one-cell gap before the name repeats). Fun identifier, also distinguishes head from tail.

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
  - **Regular** — open room. New joiners trigger a brief countdown so existing players aren't ambushed.
  - **Teacher** — teacher hosts. Can **pause / resume / step one tick / change tick rate / reset / pick opponent visibility (full bodies vs. heads-only)**. Lets the teacher freeze the game mid-action and ask "what should your bot do here?"
- Ships with 3 sample bots: `random`, `greedy` (chase nearest food), `safe` (avoid walls + self). Students copy and tweak.

## Stack (locked)

| | Choice |
|---|---|
| Client | Vanilla HTML / ES modules / `<canvas>` — no frameworks, no build step |
| Server (v2, v3) | Node.js + `ws` package |
| Bot execution (v3) | Player's own browser (not server) |
| Docs language | English only |
| Deploy | GitHub Pages for v1, Render.com for v2/v3 — both free |

## Status

- [x] v1-classic — playable, deployed to GitHub Pages
- [x] v2-arena — playable, deployed to Render
- [x] v3-coder — playable, deployed to Render
- [x] **Teacher mode** (v2 + v3) — host has no snake, controls pause/step/slower/faster/reset. Used in L6 tournament.
- [x] **King-snake mode** (v2 + v3) — orthogonal checkbox. Aggressor (head-into-body) eats: absorbs the victim's length, victim dies. Head-on-head still kills both.
- [x] **Fog of war** (v2 + v3) — orthogonal checkbox. Per-player state filtering: each client only sees cells within FOG_RADIUS of their head. v3 bots' `nextMove(state)` gets filtered `state.others` and `state.food`.
- [x] [docs/LESSONS.md](docs/LESSONS.md) — full 3-day camp curriculum (L1–L6)
- [x] [docs/PREP.md](docs/PREP.md) — instructor pre-camp checklist
- [x] [docs/PROTOCOL.md](docs/PROTOCOL.md) — WebSocket message reference (used in L3)
- [ ] `COMMON_MISTAKES.md` — retro-fit after first camp run

## Camp

A 3-day camp curriculum is built around these games. **Play + lecture** format — kids play the running game on their iPads; the instructor uses the game as a live demo to teach concepts. No free-form tuning — every code interaction is instructor-led.

```
Day 1  Hello Snake     AM: L1 + L2 (v1 walk-through)       PM: try v2
Day 2  Snake Arena     AM: L3 + L4 (server + bot)          PM: try v3
Day 3  Code Your Snake AM: L5 (write your bot)             PM: L6 tournament + parents demo
Sat    Bonus day       All day: 👑 King + 🌫️ Fog play, families welcome
```

See [docs/LESSONS.md](docs/LESSONS.md) for the full curriculum and [docs/PREP.md](docs/PREP.md) for the instructor checklist.

## Open issues to revisit

- **v3-regular restart countdown** — proposed 5 seconds, mirrors v2 behavior. Confirm during v3 build.
- **Bot timeout (v3)** — if `nextMove()` infinite-loops, browser hangs. Decide on Web Worker isolation vs. timeout race when we build v3.
- **Spectator mode** — when a snake dies mid-round, does the player just watch or get respawned? Decide during v3 build.

## Teaching constraints (carried over from lucasgame)

- **Readability and teachability over cleverness.**
- Small, single-concept edits over rewrites.
- Point to specific `file:line`; explain *why*, not just *what*.
- Don't introduce new abstractions speculatively — the existing patterns are the curriculum.
- ES modules with one class per file. `constants.js` holds tunable data.

## Docs

- [docs/README.md](docs/README.md) — what's where
- [docs/LESSONS.md](docs/LESSONS.md) — 3-day camp curriculum
- [docs/PREP.md](docs/PREP.md) — instructor pre-camp checklist
- [docs/PROTOCOL.md](docs/PROTOCOL.md) — every WebSocket message between client & server (used in L3)
- [docs/IDEAS.md](docs/IDEAS.md) — future tune-ups parked here

## Built by

A kid + dad + AI, continuing the pattern from [Lucas Game](https://yancyqin.github.io/lucasgame/).
