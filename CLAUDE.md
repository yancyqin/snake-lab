# CLAUDE.md — AI Assistant Guide

This file is read by Claude Code when working in `snake-lab`. **Read [README.md](README.md) first** — it has the long-term plan and locked design decisions. Camp curriculum, instructor prep, and parked ideas live in [docs/](docs/).

## Project context

`snake-lab` is a **vibe-coding teaching project for kids**, modeled on `../lucasgame/`. The end goal is a 5-lesson curriculum that uses three progressively richer snake games as the substrate. Currently building **v1-classic** (single-player); v2-arena (multiplayer humans) and v3-coder (programmable bots, with a teacher mode) come after.

## How to run

```bash
# v1-classic (single player, static)
cd v1-classic
python3 server.py 8080         # adds Cache-Control: no-store so iPads don't hold stale JS
# open http://localhost:8080

# v2-arena, v3-coder — see their own folders (Node + ws)
```

## Architecture

Each version has its own folder. They share **no code** — each is a self-contained learning artifact. Patterns are reused (a kid reading v2 should recognize structures from v1), but files are not.

Inside each version:
```
v1-classic/
  index.html       — page, canvas, score, controls
  server.py        — local dev server with no-cache headers (so refreshes pick up new JS)
  js/
    constants.js   — CELL_SIZE, COLS, ROWS, TICK_MS, COLORS
    Snake.js       — Snake class
    Food.js        — Food class
    Game.js        — Game class (orchestrator) + game loop
```

## Stack (do not deviate without discussion)

- **Vanilla HTML / ES modules / `<canvas>`** for all clients — no frameworks, no build step
- **Node.js + `ws` package** for the v2 and v3 servers (raw WebSocket, no socket.io)
- **English only** for docs and code comments
- **One class per file**, named to match the filename (`Snake.js` exports `Snake`)
- **`constants.js`** holds the tunable data — sizes, colors, tick rates, scoring

## Teaching constraints — read carefully

This code is being read by a 12-year-old. Optimize accordingly:

- **Readability and teachability over cleverness.** A clear loop beats a clever reduce.
- **Small, single-concept edits.** Don't bundle a rename, a refactor, and a feature into one change.
- **Point to specific `file:line`** when explaining things. Show, don't paraphrase.
- **Explain the *why*, not just the *what*.**
- **Don't introduce new abstractions speculatively.** Patterns already in the code are the curriculum — adding a third pattern dilutes that.
- **No frameworks, no transpilers, no bundlers.** Open `index.html`, see what runs. That clarity is the point.
- **`console.log` is a legitimate teaching tool.** Don't strip them aggressively.

## Key patterns to highlight (when teaching, later)

- **Data → behavior** — modify `constants.js`, see the game change
- **Game loop** — `update() → draw() → repeat`
- **Classes as nouns** — `Snake` is a snake, `Food` is food
- **Encapsulation** — `snake.isDead()` hides the wall/self check
- **Single responsibility** — `Snake.js` doesn't know about food; `Game.js` does

## What lives where

| File | Holds | Doesn't hold |
|---|---|---|
| `constants.js` | numbers, colors, sizes | logic |
| `Snake.js` | snake state and methods | food, score, drawing the whole game |
| `Food.js` | food state | snake logic |
| `Game.js` | orchestration, loop, input, draw | low-level snake/food internals |
