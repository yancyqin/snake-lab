# Homework Challenge 🏆

An after-camp, single-player **ladder of 13 bots** (10 main + a 3-level expert
gauntlet). Beat each level (best of 3) to unlock the next. Play by hand with the
joystick/keyboard, **or** write a JavaScript bot that plays for you. Two hidden
rewards wait at Levels 8 and 10.

**Static, client-side, no server.** Lives under the same GitHub Pages site as
v1, so it loads instantly (no Render cold-start) and even works offline once
loaded. Progress saves in `localStorage` on the device.

- **Play:** [yancyqin.github.io/snake-lab/challenge/](https://yancyqin.github.io/snake-lab/challenge/)

## How it works

- 1v1 duel on a 24×24 board. Classic snake rules (wall / any body / head-on-head
  all kill). Last snake alive wins a game; first to 2 games wins the level.
- **Manual mode** (🎮): floating joystick (touch) + arrow keys / WASD.
- **Code mode** (🤖): same `nextMove(state)` API as v3-coder. **Unlocks at
  Level 2** — Level 1 is hand-play only, just to learn the controls.
- **Starter bots unlock progressively:** Levels 2–3 start from a blank skeleton
  (write a tiny bot vs a weak foe). **Greedy+Safe** appears at **Level 4**. The
  much stronger **Flood-fill starter** appears at **Level 7** — it's powerful
  enough to trivialize the mid levels, so you don't get it for free early.
- The arc on purpose: you can win the early levels by hand, but **The Boss
  (L8)** is the wall where reflexes stop working and you have to write a bot.
  After two manual losses on a level where code is available, a nudge offers to
  switch you to code mode.
- **Why levels 11–13 add opponents instead of "smarter" bots:** a single
  full-board flood-fill survivor is the skill ceiling — you can't reliably
  out-think one, only match it (that's the L10 trophy). So the expert gauntlet
  raises the bar the only way that genuinely works: **more snakes at once.**
  Last snake alive wins; being outnumbered is the real test.

## The 10 opponents

| # | Name | What it does |
|---|------|--------------|
| 1 | 🎲 Random Randy | Flails randomly, walks into walls. |
| 2 | 🍎 Greedy Gus | Sprints at food, ignores danger. |
| 3 | 🛟 Careful Carl | Greedy but won't step somewhere deadly. |
| 4 | 🧱 Wally | Carl + avoids hugging walls. |
| 5 | 🎚️ Tuned Tina | Balances food, safety, open space. |
| 6 | 🔦 Scout | First **flood-fill** bot (shallow look). |
| 7 | 🧭 Pathfinder | Deeper flood fill + dodges your head. |
| 8 | 👑 The Boss | Deep flood fill. **The wall — code or lose.** |
| 9 | 🎯 Hunter | Very deep look; barely misses a trap. |
| 10 | 🏆 Grandmaster | Floods the whole board — the 1v1 skill ceiling. |
| 11 | 👥 The Duo | **1 v 2.** Two strong bots at once. |
| 12 | 👨‍👩‍👦 The Trio | **1 v 3.** Three opponents; the board crowds fast. |
| 13 | 🐝 The Swarm | **1 v 3 Grandmasters.** The ultimate test. |

The opponents live in [`js/opponents.js`](js/opponents.js) — all written with the
**same `nextMove(state)` API kids use**. Reading them to figure out how to beat
them is encouraged. Scouting is allowed. 🔎

## Files

```
challenge/
  index.html        page, styles, layout
  js/
    constants.js    board / cell / tick / colors
    game.js         DuelGame — 2-snake local match + collision rules
    opponents.js    the 10 bots (weak → strong)
    render.js       full-board canvas drawing (no camera)
    secret.js       the two reward reveals (scrambled, not plaintext)
    main.js         ladder UI, best-of-3, manual + code input, localStorage
```

## A note on the secrets (for grown-ups)

GitHub Pages is static — nothing is truly hidden from a determined browser.
The two reward sentences are XOR-scrambled + base64 and only un-scrambled the
instant a level is genuinely beaten, so they're not sitting in plain sight.
A kid skilled enough to extract them by reading the code has used exactly the
DevTools skills the camp teaches — so that's a win too. The real check is
human: the win screen shows a timestamp + how it was beaten, and the award is
claimed in person.

## Reset progress

Clear it from the browser console:

```js
localStorage.removeItem('sl_ch_beaten');
localStorage.removeItem('sl_ch_code');
localStorage.removeItem('sl_ch_mode');
```
