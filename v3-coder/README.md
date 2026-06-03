# v3-coder

Snake arena where **each player writes a JavaScript function** that controls a snake. Bots compete head-to-head. Same wire protocol as [v2-arena](../v2-arena/); see [docs/PROTOCOL.md](../docs/PROTOCOL.md).

Live at **https://snake-lab-coder.onrender.com**.

## The bot API

Paste a function into the textarea in the lobby:

```js
function nextMove(state) {
  // state.me     = { body: [{x,y}, ...], direction: 'UP', alive: true }
  // state.foods  = [{x,y}, ...]
  // state.others = [ { body, direction, alive }, ... ]
  // state.board  = { width: 60, height: 60 }
  // state.tick   = number
  return 'UP';   // or 'DOWN' | 'LEFT' | 'RIGHT'
}
```

Every 130ms, the browser calls your function with the current state, and sends the resulting direction to the server (same `{type: 'direction', dir: '...'}` message as v2). The server is the source of truth — it owns collisions, scoring, etc.

Three sample bots ship in `public/bots/`:
- **random.js** — picks any direction. Doesn't last long.
- **greedy.js** — chases the nearest food. Crashes into walls eventually.
- **safe.js** — greedy AND avoids walls and bodies. The strongest sample.

## Run locally

```bash
cd v3-coder
npm install
node server.js
# → http://localhost:8080
```

For LAN play (kids on iPads/phones on the same WiFi):
```bash
PORT=8080 node server.js
# kids open  http://<your-mac-ip>:8080
```

Share a URL with `?room=name` to put friends in the same room:
```
http://localhost:8080/?room=campfire
```

## Architecture

```
server.js        — HTTP static + WebSocket. Identical to v2.
game.js          — Game class. Identical to v2.
snake.js         — Snake class. Identical to v2.
bot.js           — SERVER-side auto-bot for solo rooms (same smart-then-dumb as v2).
public/
  index.html     — Lobby with code textarea + game canvas.
  main.js        — Client. Bot harness runs user's nextMove() each state tick.
  render.js      — Canvas drawing. Identical to v2.
  constants.js   — Shared with server.
  bots/          — Sample bot files (random.js, greedy.js, safe.js).
```

The server **doesn't know** whether the `direction` messages are coming from a human swipe (v2) or a function call (v3). That's why v2 and v3 share 90% of the code: the wire format is identical.

## Bot execution

The user's code is wrapped in `new Function('state', code + '\nreturn nextMove(state);')` and called once per server tick. Errors are caught and shown in the bot-status sidebar.

Known limitation: a `while(true)` in the user code will freeze the browser. Web Worker isolation is parked in [docs/IDEAS.md](../docs/IDEAS.md).

## Deploy to Render

The blueprint is in [`../render.yaml`](../render.yaml). Same flow as v2:
- Push to GitHub
- Render auto-builds the Dockerfile from `v3-coder/`
- Site appears at `https://snake-lab-coder.onrender.com`

## Teacher mode (planned)

Not yet shipped. Will add: pause / resume / step one tick / set tick rate / reset / toggle opponent visibility (full bodies vs heads-only). Used in L6 tournament. Tracked in [docs/IDEAS.md](../docs/IDEAS.md) and the root [README.md](../README.md) status.
