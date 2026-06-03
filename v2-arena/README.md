# v2-arena

Multiplayer snake. Up to 8 humans per room. If only one human, a bot fills in — **the bot is very smart until it grows past length 10, then gets progressively dumber.**

## Run locally

```bash
cd v2-arena
npm install
node server.js
# → http://localhost:8080
```

For LAN play (kids on iPads / phones on the same WiFi):
```bash
PORT=8080 node server.js
# kids open http://<your-mac-ip>:8080
# e.g.  http://192.168.1.42:8080
```

To put friends in the same room, share a URL with `?room=name`:
```
http://localhost:8080/?room=campfire
```
No room specified → default room `lobby`.

## Deploying

### For camp (no deploy needed)
Run `node server.js` on the instructor's Mac. Kids connect to `http://<mac-ip>:8080` on the camp WiFi. Find your IP in System Settings → Network → Wi-Fi → Details.

### Between camp days / from home — Render.com (free)

The repo has a `render.yaml` at the root. On render.com → **New +** → **Blueprint** → connect this repo. Render reads the blueprint, builds the Dockerfile in `v2-arena/`, gives you a URL like `https://snake-lab-arena.onrender.com`.

- Auto-deploys on every push to `main`
- Sleeps after 15 min idle (free tier) — first hit after sleep is ~30s
- Subsequent connections within the session are fast
- WebSockets just work

## Architecture

```
server.js   — HTTP static + WebSocket entry. One Game per room.
game.js     — Game class. Runs the tick loop, manages players/bot/foods.
snake.js    — Snake class. Same shape as v1, plus hitOther() for collisions between snakes.
bot.js      — Bot AI. computeSmartness(length) — 1.0 until length 10, linear drop to 0 by length 30.
public/
  index.html       — Client landing
  constants.js     — Shared with server (filesystem path)
  main.js          — Client entry: connect ws, send input, update UI
  render.js        — Canvas + minimap drawing
```

## Protocol

**Client → Server:**
```json
{ "type": "direction", "dir": "UP" }
{ "type": "name", "name": "Yancy" }
```

**Server → Client:**
```json
{ "type": "welcome", "playerId": "p1", "world": {...}, "view": {...}, "tickMs": 130 }
{ "type": "state", "tick": 42, "snakes": [...], "foods": [...], "scores": {...} }
{ "type": "roundOver", "winner": "Snake 1" }
```

Server is the source of truth. Client only renders.

## Bot smartness model

| Bot length | Smartness | Behavior |
|---|---|---|
| 3–10 | 100% | Always picks the safe move closest to nearest food |
| 11–29 | drops linearly | Picks safe-and-greedy with that probability, otherwise picks any safe direction at random |
| 30+ | 0% | Pure random walk (still avoids immediate suicide if it can) |

Tune `BOT_SMART_UNTIL` and `BOT_DUMB_RAMP` in `public/constants.js`.

## Why a server?

Snake state updates every 130ms — way too fast for HTTP polling, and keeping 8 browsers in sync requires one source of truth. Server is the simplest mental model: kids see `node server.js` running in the terminal, see "+player joined" log lines, see "round over" when someone wins. That's also the Lesson 3 demo.
