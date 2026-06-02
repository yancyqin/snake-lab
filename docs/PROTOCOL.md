# snake-lab WebSocket protocol

This file documents the messages that flow between the client (your iPad) and the server (Mr. Yancy's laptop) in **v2-arena**. v3-coder will use the same protocol with a few teacher-mode additions.

Used both as a reference for v3 design and as supplemental material for **Lesson 3 — Two Computers Talk** ([LESSONS.md](LESSONS.md#lesson-3--two-computers-talk-60-min--v2-arena)).

## The big idea

> The server is the **truth**. Clients only render what they're told. Clients can only say one thing: "I want to turn."

Every other message flows server → client. Every 130ms, the server broadcasts a full snapshot of the game world to every client in the room.

## Connecting

The client opens a WebSocket at:
```
wss://snake-lab-arena.onrender.com/?room=demo&name=Curly&color=%234ade80
```

| URL param | Required | Notes |
|---|---|---|
| `room` | no — defaults to `lobby` | Server creates the room on the first connect |
| `name` | no | Sanitized server-side; max 12 chars; auto-assigned `Snake N` if missing |
| `color` | no | Must be one of the 8 `PLAYER_COLORS` hex codes; auto-picks an unused one if missing/taken |
| `host` | no — defaults to off | `host=1` claims the teacher slot. **Only the first connection to a room can claim host.** After anyone has joined, the host slot is locked closed. |
| `king` | no — defaults to off | `king=1` enables **king-snake mode** for the room. Only honored on first connect (when the room is created). When your head hits another snake's body: in regular mode the aggressor dies; in king mode the aggressor lives, the defender dies, and the aggressor absorbs the defender's length. Head-on-head: both die in either mode. |

If the room is full (8/8 — host doesn't count), the server sends a `rejected` message and closes with code `4001`.

## Client → Server

### From a player (regular client)

```json
{ "type": "direction", "dir": "UP" }
```

`dir` is one of `UP` / `DOWN` / `LEFT` / `RIGHT`. Sent on every swipe / arrow-key press (v2) or bot tick (v3). The server stores it as `pendingDirection` and applies on the next tick. A 180° reverse is silently dropped.

### From the host (teacher mode only)

Hosts don't have a snake, so they don't send `direction`. They send room-control messages:

```json
{ "type": "pause" }
{ "type": "resume" }
{ "type": "step" }                       // pause (if running) and advance one tick
{ "type": "setTickRate", "ms": 300 }     // clamped to [50, 2000]
{ "type": "reset" }                      // end the round now, restart in 1.5s
```

The server ignores `direction` from a host and ignores host messages from a player (silently dropped — no errors).

## Server → Client

Six message types.

### 1. `welcome` — once, on connection

```json
{
  "type": "welcome",
  "playerId": "p3",
  "isHost": false,
  "kingMode": false,
  "paused": false,
  "tickRate": 130,
  "world": { "cols": 60, "rows": 60 },
  "view":  { "cols": 24, "rows": 24 },
  "tickMs": 130
}
```

Your `playerId` is how you find yourself in later state messages. `isHost: true` means you're the teacher (no snake, control panel shown). `kingMode: true` means the room is in king-snake mode (eat-snake-to-grow). `paused` and `tickRate` reflect any changes the host has already made.

### 2. `state` — every tick (130ms)

The big one. Full snapshot of the game world. Goes to every client.

```json
{
  "type": "state",
  "tick": 42,
  "snakes": [
    {
      "id": "p3",
      "name": "Curly",
      "color": "#4ade80",
      "body": [{"x":22,"y":30},{"x":21,"y":30},{"x":20,"y":30}],
      "direction": "RIGHT",
      "alive": true,
      "isBot": false
    },
    {
      "id": "bot",
      "name": "Snek",
      "color": "#94a3b8",
      "body": [{"x":49,"y":21},{"x":49,"y":22},{"x":49,"y":23}],
      "direction": "UP",
      "alive": true,
      "isBot": true
    }
  ],
  "foods": [
    {"x":5,"y":10}, {"x":17,"y":42}, {"x":33,"y":8}
  ],
  "scores": {
    "p3":  { "name": "Curly", "color": "#4ade80", "score": 30, "isBot": false },
    "bot": { "name": "Snek",  "color": "#94a3b8", "score": 50, "isBot": true, "smartness": 1.0 }
  }
}
```

Notes:
- `body[0]` is always the head. Order matters (head → tail).
- Bots are flagged with `isBot: true`. Bot entries in `scores` carry an extra `smartness` field (0–1).
- `scores` is keyed by snake id, separate from the snakes array so the client can keep dead players in the scoreboard.

### 3. `roundOver` — round ends (someone wins or all dead)

```json
{ "type": "roundOver", "winner": "Curly" }
```

`winner` is the name of the last snake standing, or `null` if all died simultaneously. Client shows "X wins! Next round in 3s..." then clears. Server auto-restarts after `RESTART_DELAY_MS` (3000ms).

### 4. `restartCountdown` — a new player joined a 2+ room

```json
{ "type": "restartCountdown", "joiner": "Wiggles", "delay": 5000 }
```

Heads-up so existing players aren't ambushed. The bot leaves at the restart that follows. Same auto-restart mechanism, just a longer pause.

### 5. `rejected` — room is full

```json
{ "type": "rejected", "reason": "full" }
```

Sent right before the server closes the connection with code `4001`. Client alerts the user and returns to the lobby.

### 6. `modeChange` — room settings changed (teacher mode only)

```json
{ "type": "modeChange", "paused": true, "tickRate": 300 }
```

Broadcast to **all** clients in the room whenever the host pauses/resumes/changes the tick rate. Clients update their UI (show "PAUSED" banner, update tick-rate label).

## Quick reference table

| Direction | Type | When | Source code |
|---|---|---|---|
| C → S | URL params (room, name, color, mode, role) | once, at connect | URL |
| C → S | `direction` (player only) | per swipe/keypress/bot tick | `*/public/main.js` `sendDirection()` |
| C → S | `pause` / `resume` / `step` / `setTickRate` / `reset` (host only) | on button click | `*/public/main.js` host panel |
| S → C | `welcome` | once, on connect | `*/game.js` `addPlayer()` |
| S → C | `state` | every `tickRate` ms | `*/game.js` `broadcastState()` |
| S → C | `roundOver` | round end | `*/game.js` `endRound()` |
| S → C | `restartCountdown` | new player joining | `*/game.js` `addPlayer()` |
| S → C | `modeChange` | host changed mode/pause/tickRate | `*/game.js` `handleMessage()` |
| S → C | `rejected` | room full at connect | `*/server.js` |

## Why it's this shape

- **Server-authoritative.** Clients render, server decides. You can't cheat by modifying `game.snake.body` in DevTools — the server overwrites it on the next tick.
- **Full state every tick** (not deltas) — simpler to code, easy to debug ("just look at the last state"). Costs ~4 KB/tick at 8 snakes × length 20. At ~8 ticks/sec, that's ~32 KB/s. Fine on any network.
- **One client message type** — minimizes surface for bugs. Clients can ONLY say "I want to turn." Everything else is server-side.

## See the messages live (DevTools)

In Chrome/Safari, with the v2 game open:
1. **F12** (or Right-click → Inspect) → **Network** tab
2. Filter: **WS** (WebSocket)
3. Click the WebSocket connection that's open
4. **Messages** tab — you'll see green (sent by client) and red (received from server) messages with the JSON payload

You can also poke from the JS Console:
```js
window.snakeArena.ws         // the WebSocket object
window.snakeArena.state      // the most recent state message
window.snakeArena.myId       // your playerId
```

## v2 vs v3

The wire protocol is **identical** between v2-arena and v3-coder. Both implement:
- The player/host message types above
- Teacher mode + room-mode infrastructure

The only difference is **who sends the `direction` messages**:
- v2-arena: a human's finger (swipe) or keyboard
- v3-coder: a JavaScript `nextMove(state)` function running in the player's browser

The server doesn't know which. That's the elegance — and the punchline of Lesson 5.

**Not yet shipped** (parked in [IDEAS.md](IDEAS.md)):
- `setVisibility` host message — fog-of-war toggle
- `setKingMode` host message — eat-snake-to-grow toggle
