# Snake Lab — Camp Lessons

A 3-day camp curriculum built around the three Snake games in this repo. Format: **play + lecture**. Kids play the running game on their iPads; the instructor uses the game as a live demo to teach concepts.

The first two lessons move fast on purpose — they cover the v1 + v2 fundamentals so we can spend the meat of camp on what's really exciting: bots that play for you, strategies you can tune, and a bot that **learns by itself**.

> **For the full project plan, read [../README.md](../README.md).**
> **For the AI assistant guide, read [../CLAUDE.md](../CLAUDE.md).**
> **For the pre-camp instructor checklist, read [PREP.md](PREP.md).**

## What the camp teaches, honestly

Three threads run through the week. By the end, every kid can finish all three sentences.

| Thread | Where it happens | What the kid takes home |
|---|---|---|
| **Build with AI** | L3 onward — Claude/ChatGPT as a coding partner | "I asked an AI for help. It worked." |
| **Think like AI** | L4 — design a strategy as numbers (weights) | "A strategy is just numbers I can tune." |
| **Watch AI learn** | L5 — Q-learning bot improves over rounds | "A bot can do my tuning by itself." |

The bots kids build are not magic. They are normal code — that's the point. We earn the "AI" label by being honest about what's foundation and what's the real thing.

## Camp agenda (3 days + bonus Saturday)

Two lessons per day, no filler. Every session is structured.

| Day | Session | Topic | Time | Lesson |
|-----|---------|-------|------|--------|
| **1 — Foundations** | AM | The snake is data, code is a map | ~1.5 h | **L1** |
| | PM | Two computers talk, the bot's brain | ~1.5 h | **L2** |
| **2 — Bots + AI** | AM | Hello, AI — meet your coding partner | ~1.5 h | **L3** |
| | PM | Strategy — you tune the bot by hand | ~1.5 h | **L4** |
| **3 — Learn + Compete** | AM | The bot tunes itself (Q-learning) | ~1.5 h | **L5** |
| | PM | Tournament + parents demo | ~1.5 h | **L6** |
| **Bonus — Saturday** | All day | 👑 King + 🌫️ Fog play, **parents welcome** | ~3 h | (family play) |
| **Take-home** | anytime | 🏆 Homework Challenge (10-level bot ladder) → 🎓 Secret Lesson | — | (self-paced) |

## Instructor setup (do once before camp)

1. Each kid has an iPad (or Chromebook / laptop) on the camp WiFi.
2. **Day 1** — serve v1 locally:
   ```bash
   cd snake-lab/v1-classic
   python3 server.py 8080
   ```
   Tell kids: open `http://<instructor-mac-ip>:8080`.
3. **Day 2+3** — serve v2 and v3 locally too (different ports so v1 can stay running):
   ```bash
   cd snake-lab/v2-arena
   PORT=8081 node server.js

   cd snake-lab/v3-coder
   PORT=8082 node server.js
   ```
4. After-camp play is at **https://snake-lab-arena.onrender.com** (v2) and **https://snake-lab-coder.onrender.com** (v3) — first hit takes ~30s while Render wakes the machine.
5. Have a projector or screen share so the instructor can walk through code live.
6. **For L3+**: have Claude.ai or ChatGPT open on the projector, signed in, ready to demo.

---

## Lesson 1 — The Snake is Data, Code is a Map (60–75 min · v1-classic)

> **Big idea:** Everything you see — the snake, the food, the score — is just numbers in memory. The game loop reads those numbers 8 times a second and paints them on the screen. Code is split into files; each file does one job. We're going to **see** all of this.

This is a deliberately quick pass through what used to be two lessons. Kids who code don't need to dwell here; we move on to the exciting stuff.

### What kids will learn
- A "snake" in code is a **list of cells**, not a creature.
- The game has a **tick** — every 130ms, redraw.
- DevTools is a **window into the game's brain** — you can see the snake as actual data.
- Code is **split into files** so each file does one job.

### Part 1 — Play (8 min)
- Kids open the game on their iPads. Goal: score 100.
- Notice: head looks different from body. There's a minimap. The world is bigger than the screen.

### Part 2 — Lecture: "What IS the snake?" (15 min)

Project `v1-classic/js/Snake.js`. Walk through the constructor:
```js
constructor(startX, startY, length = INITIAL_SNAKE_LENGTH) {
  this.body = [];
  for (let i = 0; i < length; i++) {
    this.body.push({ x: startX - i, y: startY });
  }
  this.direction = 'RIGHT';
}
```

> "The snake has a `body`. It's a list. Each thing in the list is a *cell* — an object with an `x` and `y`. `body[0]` is the head. The rest is the body."

Now `Game.tick()` — the game loop. Skip the details, just narrate:
> "Every 130 milliseconds, the computer does this. Look ahead. Check for food. Step. Check death. Maybe count. Redraw. Sleep. Repeat."

Show `snake.step()` and land **the** insight:
> "The snake doesn't actually move. We **add a new head at the front** and **remove the tail from the back**. That looks like movement. **Growing = skipping the 'remove tail' step.**"

```
move = add head + remove tail
grow = add head + KEEP tail
```

### Part 3 — Hands-on: DevTools spy (10 min)

Instructor demos on the projector. In DevTools Console:
```js
game.snake.body         // the actual snake!
game.snake.body.length
game.foods              // every food
game.score
```

Play 5 seconds. Run `game.snake.body` again. The numbers changed — the list moved.

**Mind-blow** (optional):
```js
game.snake.body.unshift({ x: 30, y: 30 })
```
The snake teleported. The data IS the snake.

### Part 4 — Lecture: "5 files, 5 jobs" (10 min)

Show the folder tree on the screen:
```
v1-classic/
  index.html       ← The Screen
  js/
    constants.js   ← Numbers we can change
    Snake.js       ← Only snake things
    Food.js        ← Only food things
    Game.js        ← The Boss (runs the tick, knows everyone)
```

**Key principle:** "Each file does ONE job. The Boss coordinates everyone."

**Then live-change a color.** Open `constants.js`, change `snakeHead`, reload — every kid's snake is now whatever color. "We changed ONE number. The whole game looks different."

### Part 5 — Wrap-up question (5 min)

> *"If the snake is just a list of cells, and the game just adds to the front and removes from the back — how does it know when you died?"*

Lead them to `Snake.isDead()`:
```js
isDead() { return this.hitWall() || this.hitSelf(); }
```
> "Two ways to die. Head went off the world. Or head landed on its own body. The body never kills itself — we only check the head."

### Instructor notes
- This used to be two lessons (L1+L2 in the old curriculum). It's now one fast pass. **Don't get bogged down** in JavaScript syntax (`unshift`, `pop`, `findIndex`). Translate to English: "add to the front," "remove from the back."
- The DevTools peek is the keeper from old L1. The color change is the keeper from old L2. Everything else can be skimmed.
- If a kid asks "why 130ms?" — point at `TICK_MS = 130` in `constants.js`. "That number controls speed. Lower = faster. Mess with it at home."
- If DevTools doesn't work on iPads, project one kid's screen via USB and let the room shout commands.

---

## Lesson 2 — Two Computers + the Bot's Brain (60–75 min · v2-arena)

> **Big idea:** v1 was all on your iPad. Now we add a **server** — one computer in the middle that everyone connects to. That server holds the truth, syncs every player, and runs the bot you play against. The bot is just code we can read.

Compressed from old L3+L4. We blow through the server concept quickly because everyone today knows the internet exists; we spend the saved time on **reading actual bot code** because that's the bridge to L3.

### What kids will learn
- **Client vs server** — your iPad is the client; one laptop is the server.
- **What a WebSocket is** — a phone line that stays open.
- **What messages fly between them** — they can see them in DevTools (or [PROTOCOL.md](PROTOCOL.md)).
- **The bot is one function** — `botMove` — and they can read it.

### Part 1 — Play v2 (5 min)

Instructor projects the v2 lobby. Picks a funny default name + color. Hits **+ Create new room** → lands in `cosmic-viper` or whatever.

> "Who wants to join my room?"

Kids open the URL, see the room in the list, click Join. **Chaos.** 6–8 snakes in one room. Round restarts whenever a new kid joins.

After ~5 min — pause. Ask:
> *"When I die, you can still see me. When you eat food, MY iPad knows. How does your iPad know what's happening on mine?"*

Hold the question. The rest of the lesson answers it.

### Part 2 — Lecture: "The phone call" (15 min)

Whiteboard:
```
   [iPad 1]            [iPad 2]            [iPad 3]
       \                  |                  /
           --------> [ MAC: SERVER ] <--------
                  (the truth lives here)
```

> "Your iPad is a **client**. One laptop is the **server**. Every client connects to the same server. The server is the truth."

**Show the terminal where `node server.js` is running.** It logs each kid joining live:
```
[room cosmic-viper] +p1 Curly #4ade80 (1/8)
[room cosmic-viper] +p2 Wiggles #fbbf24 (2/8)
```

**Phone call basics**, in two messages:

**iPad → server (the ONLY thing your iPad ever asks for):**
```json
{ "type": "direction", "dir": "UP" }
```
> "Every swipe = this message. That's it. You can ONLY ask to turn. The server decides everything else."

**Server → iPad (the big one, every 130ms):**
```json
{ "type": "state", "tick": 42, "snakes": [...], "foods": [...], "scores": {...} }
```
> "This is the truth. Your iPad's only job is to draw what's in here. Every snake's body, every food, every score — it all comes from this."

Each snake in `snakes` looks like:
```json
{ "id": "p1", "name": "Curly", "color": "#4ade80",
  "body": [{"x":23,"y":33},{"x":23,"y":32}, ...],
  "direction": "DOWN", "alive": true, "isBot": false }
```

(`body[0]` is the head. `isBot: true` flags the auto-bot, and its entry in `scores` carries an extra `smartness` field.)

Other messages (join, end, restart) — list in [PROTOCOL.md](PROTOCOL.md), don't dwell.

### Part 3 — Hands-on: peek at the phone call (10 min)

DevTools → Network → WS → click the connection → Messages. Watch JSON fly by every 130ms. Or in the Console:
```js
window.snakeArena.state.tick
window.snakeArena.state.snakes.length
window.snakeArena.state.foods
```
> "No secrets. Your iPad sees exactly what every iPad sees."

### Part 4 — Lecture: "The bot is one function" (20 min)

Now the **bridge** to tomorrow's lesson on writing your own bot.

Project `v2-arena/bot.js`, the function `botMove`:
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

> "Every tick, the bot rolls a dice. If it rolls below `smartness`, it picks a smart move. Otherwise random. At length 10 it's 100% smart. By length 30 it's totally random — that's why you can catch up to it."

Then show `smartMove`:
```js
function smartMove(bot, allSnakes, foods) {
  const food = nearestFood(head, foods);
  const candidates = validDirs(bot.direction).map(dir => {
    const nh = nextHeadIn(dir, head);
    return { dir, deadly: isDeadly(nh, allSnakes), distToFood: ... };
  });
  const safe = candidates.filter(c => !c.deadly);
  if (safe.length === 0) return candidates[0]?.dir || bot.direction;
  safe.sort((a, b) => a.distToFood - b.distToFood);
  return safe[0].dir;
}
```

**Walk through:** find food, list the 4 possible moves, drop deadly ones, pick the one closest to food.

> "That's the whole brain. Find food, don't die. It's about 30 lines. It's just **code you could write**."

This is the cue: **tomorrow you'll write your own.**

### Part 5 — Wrap-up question (5 min)

> *"If I close my laptop, what happens to the games?"*

All games stop. The server is the truth. (Which is why we deploy to Render so kids can keep playing.)

### Instructor notes
- This used to be two lessons (L3+L4). It's one now. **Less time on what's a port / what's JSON** — kids today have a vibe for the internet already. **More time reading `smartMove`** because that's the bridge to L3.
- If a kid asks "why is it called WebSocket?" — "regular web pages: you ask, you get an answer, hang up. WebSocket: phone stays open." Move on.
- The terminal log is the demo for Part 2. Kids LOVE seeing their join show up. Make the font big.

---

## Lesson 3 — Hello, AI (60–75 min · v3-coder)

> **Big idea:** You're going to write code. You're not going to write it alone. You'll have an AI sitting next to you — Claude or ChatGPT — to ask questions, fix your mistakes, and suggest ideas. Today you meet your coding partner.

This is the NEW lesson — the one that earns the "Build with AI" line on the flyer. Kids see a real AI session, then everyone does one.

### What kids will learn
- v3-coder works: textarea + `nextMove(state)` + run.
- How to ask Claude/ChatGPT for code help **like an engineer** (paste the code, paste the error, ask why).
- That an AI is a partner, not a magic-answer button.

### Part 1 — Play the sample bots (10 min)

Project v3 lobby. Walk through the 5 sample buttons:
- **Random** — picks a dice each tick. Dies in 5 seconds. Funny.
- **Greedy** — chases nearest food. Crashes into walls eventually.
- **Safe** — chases food AND avoids death. The champion sample.
- **Tunable** — tomorrow's lesson; preview it now.
- **Learning** — tomorrow afternoon's lesson; preview it now.

Kids join a room with their pick. Watch them play.

> "Each of these is a **function** that returns `'UP' / 'DOWN' / 'LEFT' / 'RIGHT'`. About 30 lines each. Let's read one with the help of a friend."

### Part 2 — Lecture: "Reading code with an AI" (10 min)

Switch the projector to **Claude.ai** (or ChatGPT). New chat. Paste in `greedy.js` — all 30 lines. Type:

> *"Explain this code to me as if I'm 10 years old. What does each section do?"*

Watch Claude reply line by line. Pause and ask the room: "Does that match what you thought it did?"

Now ask Claude:

> *"What happens if the closest food is on the other side of a wall? Will this bot get there?"*

Claude reasons through it. Kids see how an AI can think *with* you about code that's open in front of you.

**Then the punchline:**
> "I'm not asking Claude to write the bot for me. I'm asking Claude to help ME think about the code. That's the difference between using AI to skip the work, and using AI to learn faster. We'll do both this week."

### Part 3 — Lecture: "The shape of YOUR bot" (10 min)

Back to the v3 lobby. Project the textarea. Type the smallest possible bot:
```js
function nextMove(state) {
  return 'RIGHT';
}
```

> "Every 130ms, your function gets called with `state`. It returns a direction. That's it."

Project the `state` shape as a poster:
```js
state = {
  me:     { body: [{x, y}, ...], direction: 'UP', alive: true },
  foods:  [ {x, y}, ... ],
  others: [ { body, direction, alive }, ... ],
  board:  { width: 60, height: 60 },
  tick:   42
}
```

**Connect to yesterday:** "Remember the `state` message the server sends every 130ms? Your `nextMove(state)` gets that, with `me` peeled out for you. You're a tiny version of the bot we read in L2."

### Part 4 — Hands-on: build a bot with AI together (20 min)

Instructor drives the projector. Open a fresh Claude/ChatGPT chat. Prompt:

> *"I'm writing a snake bot in JavaScript for a kids' coding camp. The bot is a function `nextMove(state)` that returns 'UP', 'DOWN', 'LEFT', or 'RIGHT'. `state.me.body` is the snake's body, `state.foods` is a list of food cells with x,y. The board is 60x60. Write me a bot that avoids walls and goes toward the nearest food. Keep it under 30 lines. Explain it as you go."*

Watch the AI write the bot. Paste it into the v3 textarea. Click **+ Create new room**. **It runs.**

If it crashes (it will eventually), copy the error from the bot status box, paste it back to Claude:
> *"It said `Cannot read property 'x' of undefined`. What does that mean?"*

Claude debugs. Kids see the loop: write → run → break → ask → fix.

### Part 5 — Kids' first AI conversation (15 min)

Each kid opens Claude.ai or ChatGPT on their iPad/laptop. (For kids without an account, pair them up or share the instructor's session on the projector and rotate kids.)

Their assignment: ask the AI to write a bot that does something **silly** —
- "A bot that always tries to spell my name with its body"
- "A bot that runs away from food"
- "A bot that only turns left"
- "A bot that follows the longest other snake"

Then paste, run, see what happens. Iterate.

**The AI is the partner**, but kids are still the boss. They decide what the bot should do. They debug what it actually does.

### Part 6 — Wrap-up: "What does AI do well, what does it not?" (5 min)

Round-robin. Each kid says one thing:
- "AI is good at ____."
- "AI is bad at ____."

Common answers and the instructor's affirmation:
- ✅ Good at: explaining code, finding bugs, writing first drafts, suggesting ideas.
- ❌ Bad at: knowing what YOU want, understanding the game without you describing it, fixing things it can't see (so paste the code).

**The takeaway** to write on the board:
> **Show your AI everything. Then ask the right question.**

### Instructor notes
- The **biggest skill** this lesson teaches isn't JavaScript — it's how to be a good partner to an AI. Modeling it well matters more than the bot quality.
- Watch for kids who let the AI do everything ("write me a bot"). Push back: "Cool, what does line 12 do?" Goal: kids understand the code they ship.
- If a kid says "the AI was wrong" — celebrate it. AIs make mistakes; spotting them is the skill.
- If parents ask "is this safe?" — show them: the kid pastes code into Claude, copies the answer, runs it locally. No personal info ever leaves the chat. Don't have kids paste *anything* about themselves into the AI.
- If you don't have Claude / ChatGPT accounts for every kid, the projector + instructor demo gets 80% of the value. Each kid does ONE round at the projector while others watch.

---

## Lesson 4 — Strategy: You Tune the Bot (75 min · v3-coder)

> **Big idea:** A bot isn't just "go to food" — it's a **strategy**. Should you eat or block? Stay safe or take risks? A strategy is just numbers, and you can tune those numbers. **What you're doing right now is what machine learning does — just by hand.**

This is the NEW second new lesson. Heart of the camp's "think like AI" thread.

### What kids will learn
- The `tunable.js` sample — a strategy bot with four weights.
- Multi-objective decisions: food vs safety vs blocking vs open space.
- That **you are the gradient** — tweaking numbers, watching results, tweaking again.
- The link: "what you just did is what ML does."

### Part 1 — Play the Tunable bot (10 min)

Each kid clicks the **Tunable** sample button in the lobby. The code loads — the four weights are right at the top:
```js
const W_FOOD     = 1.0;
const W_SAFETY   = 5.0;
const W_BLOCKING = 0.0;
const W_OPEN     = 0.5;
```

Don't change anything yet. Just create a room and play. The bot is competent — it survives, eats food.

### Part 2 — Lecture: "Scoring every move" (15 min)

Project `tunable.js`. Show the scoring section:
```js
score =
    W_FOOD     * -foodDistance(pos.x, pos.y)      // closer food = higher
  + W_SAFETY   *  1                                // staying alive
  + W_BLOCKING *  nearOpponentHead(pos.x, pos.y)   // crowding enemies
  + W_OPEN     *  openCount(pos.x, pos.y);         // room to move
```

> "Every tick, the bot looks at all 4 possible moves. For each, it computes a SCORE using these 4 ingredients. Highest score wins."

**Walk through one example.** Project a paused game (or whiteboard the situation): head at (30, 30), food at (35, 30), wall to the north.

Score each direction by hand. Show how each weight pulls the answer.

> "If I make `W_FOOD = 5` and `W_SAFETY = 1`, the bot will dive at food even when it's a little risky. If I do the opposite, the bot is a coward — it'll circle in open space and ignore food."

### Part 3 — Hands-on: tune your bot (25 min)

Each kid opens the **Edit bot** modal (in-game) and changes the weights. Suggested experiments to write on the whiteboard:

| If you want | Try |
|---|---|
| Reckless eater | `W_FOOD = 5`, `W_SAFETY = 1` |
| Cautious snake | `W_FOOD = 1`, `W_SAFETY = 10` |
| Bully | `W_BLOCKING = 5`, see if you can corner snakes |
| Explorer | `W_OPEN = 5`, `W_FOOD = 0.1` (just wanders in open space) |
| Original | The defaults |

Kids run, watch, **observe**:
- How long did your bot survive?
- How many foods did it eat?
- What was its longest length?

**Pause every 5 minutes** for the room. "Lucas — what's your bot doing? Pickle — yours?"

This is the core loop: **change weights → run → observe → change again.** Kids feel that loop in their fingers.

### Part 4 — Mini-tournament with kids' tuned bots (15 min)

Each kid commits to their best weights. Instructor creates a teacher-mode room. All kids join. Run 3 rounds.

Track on a whiteboard:
| Kid | W_FOOD | W_SAFETY | W_BLOCKING | W_OPEN | Best round |
|---|---|---|---|---|---|

Observations to call out:
- "The kid with extreme weights died fast OR won big — there's no middle. Why?"
- "Balanced weights mostly survived but rarely won. Why?"
- "The bot that won — what made its weights special?"

### Part 5 — Land the punchline (10 min)

Project the whiteboard tally. Then say:

> "What you just did — try numbers, watch what happens, pick better numbers, run again — has a name. It's how **machine learning** works. The math version of you adjusts millions of numbers, but the loop is the same. After lunch, we'll show you a bot that does this loop by itself."

Optional: ask the AI in front of the class:
> *"In 2 sentences, explain to a 10-year-old how a machine learning model gets trained."*

Watch Claude's answer line up with what just happened on the whiteboard.

**Write on the board:**
> **You are the gradient.**

### Instructor notes
- The biggest risk is kids tweaking weights too fast and not watching. Force at least 30 seconds of observation between tweaks.
- If a kid wants to add a 5th weight (`W_TAIL_CHASING`?), let them. Show how to add it to the scoring formula. Bonus points for kids who invent a metric.
- Don't say "machine learning" in Parts 1–4. Save it for Part 5. The reveal is the lesson.
- This lesson runs short or long depending on the room. Plan for 60 min minimum, 90 max. Leave time before L5.

---

## Lesson 5 — The Bot Learns by Itself (75 min · v3-coder)

> **Big idea:** Yesterday you tuned weights by hand. Today we hand the tuning over to the bot itself. It plays a game, dies, plays again, and **gets a little better every round**. That's reinforcement learning.

This is the NEW third new lesson — the payoff for L4.

### What kids will learn
- The `learning.js` bot uses a **Q-table** — for each situation, how good is each action?
- After every move, the bot **updates the table** based on what happened (reward).
- The bot **explores** at first (random) and **exploits** what it learned (best move) later.
- After ~10 rounds, the bot is visibly smarter than it started.

### Part 1 — Watch the bot be bad (10 min)

Each kid clicks the **Learning** sample button. Creates a room. Plays.

The first 30 seconds: **the bot is terrible.** It runs into walls. It does random circles. Kids laugh.

> "Look at this thing. It can't even stay alive. But — keep watching."

After 2–3 minutes (5–10 deaths and restarts), the bot stops crashing into walls. By 5 minutes, it starts eating food on purpose.

**Don't explain yet.** Just have them watch.

### Part 2 — Lecture: "The Q-table" (20 min)

Project `learning.js`. Show the brain:
```js
let qTable = {};   // { situationKey: { UP: ?, DOWN: ?, LEFT: ?, RIGHT: ? } }
```

> "The bot keeps a notebook. For each SITUATION it's seen, the notebook has 4 numbers — one for each direction. The number says 'how good has it been to go that way from here?'"

**Show how a situation is encoded.** The state-key looks like `1,0|2`:
- `1,0` = food is to the right
- `|2` = danger is to the left (a wall or body)

> "9 food directions × 16 danger combinations = 144 situations. That's all. Small enough that the bot's whole brain fits on one page."

**The learning rule.** Show the Bellman update:
```js
qTable[lastKey][lastAction] =
  prev + ALPHA * (reward + GAMMA * futureBest - prev);
```

Don't explain the math. Explain the **intention**:

> "After every move, the bot looks at the situation it ended up in. If it ate food — reward! +10. Mark the move that got us here as 'good.' If it died — -50. Mark that move as 'bad.' Next time we're in a similar situation, the bot remembers."

Whiteboard the loop:
```
1. See situation
2. Pick a move
3. Make the move
4. See what happened (got food? died? nothing?)
5. Update the notebook
6. Repeat
```

> "**This is the loop.** Yesterday YOU were the loop — you'd play, observe, tweak weights, replay. The bot does the same thing. It plays, observes, tweaks numbers in its notebook, plays again."

### Part 3 — Explore vs Exploit (10 min)

Project the ε-greedy line:
```js
const epsilon = Math.max(0.05, Math.pow(0.92, games));
if (Math.random() < epsilon) {
  action = dirs[Math.floor(Math.random() * dirs.length)];
} else {
  action = dirs.reduce((best, d) => q[d] > q[best] ? d : best);
}
```

> "Two strategies in one bot. **Explore** — pick a random move. **Exploit** — pick the best move I know. Early on (game 1), the bot explores almost 100% of the time. By game 30, it's exploring only 8% of the time. It's settled into 'I know what works.'"

**The tradeoff to teach:** if the bot ONLY exploits, it gets stuck on the first thing that worked. If it ONLY explores, it never uses what it learned. You need both.

> "This is a real life pattern too. Pick the new restaurant or the one you know is good?"

### Part 4 — Hands-on: peek at the bot's notebook (15 min)

In DevTools Console while the Learning bot is playing:
```js
// The bot's brain lives in the textarea code, so we have to peek another way:
// click "Edit bot", scroll down, and the live Q-table is at the top.
```

(Or — if there's time — instructor adds a tiny "log qTable" line to the bot in the modal, applies, and kids see the table grow in the console.)

For each kid:
- Count entries: `Object.keys(qTable).length` — how many situations the bot has seen
- Find the most-confident state: the situation where one direction's Q-value is way higher than the others
- Watch a new entry appear when you go somewhere new

> "The bot has filled in ~100 of the 144 entries by now. The rest are situations it hasn't seen — it doesn't know what to do there yet."

### Part 5 — Mini-tournament: hand-tuned vs self-learning (15 min)

Instructor creates a teacher-mode room. Kids paste **two bots** in two browser tabs — their best Tunable bot from L4, and the Learning bot.

Run 3 rounds. Who wins?

Honest expectation: the Tunable bots probably beat the Learning bots in a short tournament — Learning needs ~30+ games to really get good, and we've only played a few. **That's a great teaching moment.**

> "Why did the Tunable bots win? Because YOU had already done the learning. You played hundreds of games yesterday tuning your brain. The Learning bot has only had a few minutes."

Ask the room:
> *"If we left the Learning bot playing overnight — what would happen?"*

Land it: machine learning needs **time** and **data**. The same way kids needed time to tune their weights, the bot needs time to fill in its table.

### Part 6 — Wrap-up (5 min)

Three sentences on the board, fill them in:
1. "A bot is just _____." (code / a function)
2. "A strategy is just _____." (numbers / weights)
3. "Machine learning is just _____." (tuning the numbers by playing)

Then:
> "Tomorrow's tournament uses any bot you want. Tunable. Learning. The one Claude helped you write. Pick your strongest one — and may the best `nextMove()` win."

### Instructor notes
- This lesson can land flat if the Learning bot doesn't visibly improve. Make sure rooms have at least 1 other snake to "die against" so deaths happen fast (= more learning per minute). Solo room learns too slow.
- Don't use the words "reinforcement learning" until late in the lesson if at all. Build the intuition first, name it after.
- The honest tournament outcome (Tunable beats Learning short-term) IS the lesson — don't oversell. Real ML takes time.
- If a kid asks "could the bot get smarter than me?" — yes, with enough games. Real game-playing ML (AlphaGo, etc.) beats world champions. That's where they could go in high school / college. Plant the seed.
- Watch out for kids who refresh the page mid-learning — wipes the qTable. The Q-table lives in the bot's closure; refresh = fresh bot. Tell them: don't refresh during a Learning run!

---

## Lesson 6 — Tournament + What's Next (90 min · v3-coder)

> **Big idea:** Your bot vs everyone else's bot. Bring your strongest. Whether it's Tunable, Learning, or one you co-wrote with Claude — may the best `nextMove()` win.

### What kids will do
- Polish their bots (and pick which one to bring).
- One head-to-head tournament.
- Reflect. Demo to parents.

### Part 1 — Pick your bot, final tweaks (15 min)

Kids open v3, click **Edit bot**, decide.
- **Tunable** with your weights — predictable, reliable.
- **Learning** — bring whatever brain it built up; play a few warm-up rounds to fill in fresh situations.
- **Hand-rolled with Claude** — your own strategy, whatever it does.

Things to check:
- Does it return only `'UP' / 'DOWN' / 'LEFT' / 'RIGHT'`? (Bot status will say "Bad return" if not.)
- Does it handle empty `state.others`? (Solo room — no opponents.)
- Does it crash? (Status box shows the error message.)

Each kid creates a fresh solo room. If their bot dies in <30 seconds against the auto-bot, fix it before the tournament.

### Part 2 — Tournament (45 min) — in **teacher mode**

**Instructor creates the tournament room in Teacher mode** (lobby → Teacher checkbox → Create). Land in the room as host with no snake, Host Controls panel showing.

Share the room name (e.g. `final`). Each kid joins — server sends a 5s `restartCountdown` each time, so everyone enters cleanly.

Once all are in, **project the room.** Run 5 rounds with the host controls:

- **Pause** mid-round when something interesting happens — "Pickle's bot is about to hit a wall. What should it do?"
- **Step** one tick to see the next move without resuming. Great for debugging out loud.
- **Slower** (🐢) to ~200ms/tick so kids can follow what each bot is doing.
- **Faster** (🐇) when things drag.
- **Reset** to force the next round early.

Keep score on a whiteboard:

| Round | 🥇 1st (+3) | 🥈 2nd (+2) | 🥉 3rd (+1) |
|---|---|---|---|
| 1–5 | | | |

After 5 rounds, totals = tournament rank.

**Between rounds**, call out observations:
- "Pickle's bot — did you see it pause near the wall? That was W_SAFETY pulling it back."
- "Tofu's Learning bot did NOT crash even once this round. The notebook is paying off."
- "Sir Hiss is going in circles. What happened to its strategy?"

This is the **best teaching moment of camp** — strategies are visible, bots are tagged with names, pause-and-narrate makes every move a lesson.

### Part 3 — Discussion (15 min)

Round-robin questions:
1. **Which bot won? Why do you think it won?**
2. **If you had one more day, what would you add?**
3. **What surprised you about your own bot?**
4. **What was the hardest part of this whole camp?**

Capture answers on a whiteboard photo — feeds retro and parent communication.

### Part 4 — Parents arrive (15 min)

Each kid demos their bot **for 30 seconds**. Format:
> "Hi, I'm Lucas. My bot is called Tofu. It's a Tunable bot — I set W_BLOCKING to 3 so it crowds opponents. It came in 2nd in our tournament. *(start a solo game on the projector)* Watch it eat."

Then **one final tournament run** — all bots, one room, in front of parents. Loud cheering encouraged.

**Wrap with the future:**
> "All of this is on GitHub. Your code is in your iPad's browser memory — if you want to keep your bot, copy-paste it somewhere safe. Snake Coder lives at https://snake-lab-coder.onrender.com so you can keep playing at home. And Saturday — you and your parents are invited back for the bonus day."

### Instructor notes
- Project the **server terminal log** during the tournament. The "+player joined" and "round over" lines fly by — kids love seeing their name.
- **Pause early and often.** First time a bot does something unexpected — pause. Ask: "What did it see?" Then `window.snakeCoder.state` in DevTools shows the exact state the bot was looking at.
- If a Learning bot looks dumb — it might be because it hasn't seen enough situations yet. Mention this; don't pause to "fix" it.
- Don't pause the game to fix a visibly broken bot. The visible failure is its own lesson. Note for post-round.
- Small prize for 1st place (sticker, lollipop). Mostly symbolic — recognition is the prize.
- For parent demos, prepare a 1-paragraph card for each kid: bot name, color, one-sentence description, one thing they tried that didn't work. A story, not a brag.
- After parents leave, hand out the feedback form (see [PREP.md](PREP.md)).

### What's next (for the kids who want to keep going)
- **Add features to v3** — different food types, walls, larger world. Old IDEAS like obstacles + predators are parked in [IDEAS.md](IDEAS.md).
- **Build their own game** — same pattern: `index.html` + `js/` + state + render loop. Mention `lucasgame` and `snake-lab` as templates.
- **Read other people's bots** — Battlesnake.com is the next stop for serious snake-bot programmers. Real tournaments, real prize money.
- **Train a real ML bot** — what they saw in L5 is a baby version. Real RL uses neural networks and runs for millions of games. Search "OpenAI Gym" or "stable-baselines3" when they're ready for Python.

---

## Bonus — Saturday (~3 hours · family play)

> **Vibe:** Camp officially ended Friday. Saturday is the victory lap. Parents are invited, kids show off their bots, and we unlock the two crazier game modes we held back from the main curriculum.

No new lecture. Two new game modes — both are checkboxes in the lobby's **Room Settings** panel.

### 👑 King snake mode

Slither.io-style. The **bigger snake always wins**:
- **Head-on-head:** bigger eats smaller and absorbs their length. Equal length → both die.
- **Head-on-body:** if you're at least as long, you eat them. If you're smaller, **you pass through** — no death.
- **Self pass-through:** you can also pass through your own body. No more dying because you turned into your own tail.
- Wall is still always fatal.

Strategy shift: small snakes can dart through bigger snakes' bodies safely, but should NEVER head-butt a bigger one. Big snakes can hunt smaller ones — block them into walls, charge their heads. Equal-length face-offs are pure mutual destruction, so timing matters when two giants meet.

### 🌫️ Fog of war mode

Each snake only sees **8 cells around its own head**. The rest of the world is fog. The minimap reflects fog too.

Strategy shift: in v3, kids' bots get a filtered `state.others` and `state.foods`. Tunable bots that thrived in full-view fail without exploration; Learning bots see different situations than yesterday and have to re-learn.

### Suggested running order

| Time | What |
|------|------|
| 0:00–0:15 | Parents arrive. Recap the week with a 3-slide story (or hand them a printed "What Lucas built" card). |
| 0:15–0:45 | **King-mode v2 tournament** — humans only. Kids vs parents. Longest snake at the end of 3 rounds wins. Use **Slower** to make it watchable. |
| 0:45–1:15 | **King-mode v3 tournament** — kids' bots compete. Parents bet on whose bot wins. |
| 1:15–1:30 | Snack break ☕ |
| 1:30–2:15 | **Fog-mode v3 tournament** — same bots, fog enabled. Watch rankings shuffle. Pause and ask: "How would you add fog-awareness to your bot? Ask Claude!" |
| 2:15–2:45 | **Mixed mode finale** — King + Fog + Teacher, all on. Pure chaos. |
| 2:45–3:00 | Group photo, "Snake Lab graduate" certificates (optional), reminder that the games stay live online. |

### Setup notes for the instructor

- **One room per tournament**, instructor hosts in Teacher mode so they can pause and explain.
- For king-mode v2, kids and parents play with fingers. iPads charged.
- For v3 tournaments, kids paste their bot code from earlier in the week. Tell them to bring a USB stick, GitHub Gist, or screenshot of their bot — sessionStorage may have cleared.
- Project the running terminal — Saturday's most fun moment is "+player joined" lines rolling in as parents type their names.
- Have a leaderboard whiteboard ready (same format as L6).

### Parent FAQ (be ready for these)

- **"How does my kid keep their bot?"** — Copy-paste the code from the Edit-bot modal into Notes or email it to themselves.
- **"Can they play this at home?"** — Yes. v1 at https://yancyqin.github.io/snake-lab/, v2 at https://snake-lab-arena.onrender.com, v3 at https://snake-lab-coder.onrender.com.
- **"How did they build this?"** — Show them README.md + LESSONS.md. Mention `lucasgame` as the precursor.
- **"Was this actually AI? Or just coding?"** — Honest answer: kids used AI (Claude/ChatGPT) as a coding partner, built bots that range from hand-tuned strategies to a tiny self-learning Q-learning bot. Foundations of AI, all real. Not "they used ChatGPT to do their homework."

### Why this day is worth doing

- **Kids ship a bot in front of their parents.** Turns "summer activity" into "I am someone who codes."
- **Fog mode is the strategy unlock** — bots that just chase food die; bots that explore win. Kids see *why* their strategy work matters.
- **King mode is the chaos unlock** — pure fun, parents get it instantly ("oh, like Slither.io!").
- **The two modes together** turn the same game we learned all week into something the kids haven't quite seen before. Camp ends on "there's still more to discover" instead of "we're done."

---

## After Camp — Homework Challenge & Secret Lesson

The camp doesn't have to end on Saturday. Two take-home pieces keep the
motivated kids going, self-paced, at home.

### 🏆 Homework Challenge

A static single-player site (no server, loads instantly, progress saved on the
device): **[yancyqin.github.io/snake-lab/challenge/](https://yancyqin.github.io/snake-lab/challenge/)**.

- A ladder of **10 bots** (Random Randy → Grandmaster) plus an expert level
  (**Apex**). Beat each level **best of 3** to unlock the next.
- **Play by hand** (joystick/keyboard) on the early levels, or **write a bot**
  (same `nextMove(state)` API as v3). Coding unlocks at Level 2; the
  Greedy+Safe starter at Level 4; the Flood-fill starter at Level 7.
- The arc on purpose: hand-play works early, but **Level 8 (The Boss)** is the
  wall where reflexes stop working and you have to code.
- **Level 11 (Apex)** is bot-only with a copy-proof gate: win one game, then
  your bot plays Apex 100 headless games and must win **at least 10% more than
  it loses** — copying Apex only ties, so you have to genuinely out-think it.

**Milestone rewards.** Clearing certain levels reveals a hidden **Bible-verse
reward** on screen (the kid shows it to the instructor to claim a prize):
levels **4, 6, 8, 10, and 11** each have one. (The verse list is in the
instructor's private reference, not in the public repo — see PREP.)

### 🎓 Secret Lesson — *earned, not scheduled*

Clearing **Level 10** unlocks the **[Secret Lesson](SECRET_LESSON.md)** — an
advanced, outside-the-camp session on how to beat **Apex (Level 11)**. It
teaches the ideas (the draw-fortress ceiling, reading an aggressive opponent,
**space control**) and the method (**machine-learning tuning** — random search
+ hill climbing, i.e. "you are the gradient," automated). It teaches the *how*,
not the answer bot — the kid still builds and tunes their own.

This is the real payoff of the whole AI thread: a kid who reaches it has gone
from "playing snake" to "training an AI to beat another AI."

## Glossary

- **Tick** — one step of the game loop. In Snake, every 130ms.
- **Cell** — one square on the grid. Has an `x` (column) and `y` (row).
- **Head** — the first cell of the snake (`body[0]`).
- **Camera** — the top-left world cell that's currently shown on screen.
- **World vs View** — the world is everything (60×60). The view is what fits on screen (24×24).
- **Client** — your iPad. Runs `public/main.js`.
- **Server** — Mr. Yancy's laptop. Runs `server.js`. Holds the truth.
- **WebSocket** — the "phone line" between client and server. Stays open all game.
- **Bot** — code that decides moves instead of a human.
- **State** — the snapshot of the world the server sends every tick: snakes, foods, scores.
- **AI as partner** — using Claude / ChatGPT to help write code, debug, and learn. NOT to do the work for you.
- **Weight** — a number you tune to change how the bot behaves (L4).
- **Q-table** — a notebook the Learning bot keeps: situation → how good each move is (L5).
- **Reward** — the bot gets +10 for food, -50 for dying. Shapes what it learns.
- **Explore vs Exploit** — try something new vs use what you know. The Learning bot mixes both.
