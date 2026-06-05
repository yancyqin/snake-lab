# 🎓 Secret Lesson — Beating the Hunter (Apex)

> **Earned, not scheduled.** This lesson is *outside the 3-day camp*. A kid
> unlocks it by clearing **Level 10** of the Homework Challenge. It's the
> advanced track: how to out-think **Level 11 (Apex)** — the bot-only level
> whose gate is "your bot must win at least 10% more than it loses over 100
> games vs Apex."
>
> This teaches the **ideas and the method**. It does **not** hand over the
> answer bot — the kid still builds and tunes their own. (The instructor's
> private reference solution lives in the separate `snake-lab-ml` repo.)

## Why this lesson exists

By Level 10 the kid has written a real bot. Level 11 looks impossible:
- You can't beat Apex by *surviving better* — two good survival bots just draw
  forever (the "draw fortress").
- You can't beat it by *copying* it — a mirror match nets ~0%.

So Level 11 forces the one move left: **find your opponent's weakness and
exploit it.** That's a genuinely new skill, and it's the bridge to how real AI
research works.

## Big idea

> A strong general strategy isn't always the answer. Sometimes you win by
> **studying one specific opponent and exploiting how it thinks.** And when you
> can't find the exploit by hand, you let the **computer search for it** —
> that's machine learning.

## What the kid will learn

1. **The skill ceiling & the draw fortress** — why "just survive" tops out at a draw.
2. **Read the opponent** — Apex is *aggressive*: it survives, then presses toward
   you and cuts off your escape. Aggression is a weakness you can bait.
3. **Relative space (space control)** — the counter idea: don't just keep your
   own room, pick the move that maximizes *(my space − Apex's space)*. Apex
   chases and gives up territory; you take it and wall Apex in.
4. **Tuning by machine** — turn the strategy into a few numbers (weights), then
   let a search loop find good values by playing thousands of games. This is L4
   ("you are the gradient") handed entirely to the computer.

## Part 1 — See the draw fortress (10 min)

Run the kid's best Level-10 bot against Apex a bunch of times (or use the L11
"100-game test" readout). Point out: **mostly draws, almost no wins.** Ask:
> "If you can't out-survive it, and you can't copy it… what's left?"

Lead them to: **find what Apex does badly.**

## Part 2 — Read the hunter (10 min)

Apex's code is open ([`challenge/js/opponents.js`](../challenge/js/opponents.js),
the `apex` function). Read it together. The key lines:
```js
score += (20 - d) * 2;   // press toward you
score += (-d) * 1.5;     // ...and cut off your escape
```
> "Apex always moves *toward* you. A bot that always chases can be **led**.
> If you back away and leave it less room than you, where does it end up?"

## Part 3 — The counter idea: relative space (15 min)

Introduce the one new term on top of everything they already know:
```
score = (my reachable space)  −  (the foe's reachable space)
```
They already compute flood-fill space (Level 6+). Now compute it **twice** —
once for themselves, once for the opponent — and prefer moves that grow the
*gap*. Survival still comes first (don't trap yourself), but among safe moves,
**squeeze the hunter.**

Have them add this term to their bot and watch a few games. It should start
*winning*, not just drawing.

> Honest note worth telling them: this "space-denial" trick **loses** to a calm
> survivor — it only works *because* Apex is aggressive. **The counter is built
> for one specific opponent.** That's a real idea in games and AI.

## Part 4 — Let the computer tune it (20 min)

Now the ML payoff. Their bot has a handful of knobs (how much to weight space,
relative space, food, staying off walls…). Instead of guessing:

1. **Make the knobs variables** (e.g. `wSpace`, `wDeny`, `wFood`, …).
2. **Score a setting** by playing N games vs Apex and counting (wins − losses).
3. **Search:**
   - **Random search** — try many random settings, keep the best. (Explore.)
   - **Hill climbing** — nudge one knob a little; keep the change if it scored
     better, otherwise undo it. Repeat. (Exploit.)

> "Yesterday *you* were the gradient — you changed numbers and watched. Now the
> computer does it thousands of times an hour. That's machine learning: a
> score, and a search for the numbers that make the score go up."

If a laptop is handy, run a real tuner (the instructor's `snake-lab-ml/tune.mjs`
shows one) and **watch the win rate climb live** — e.g. 28% → 50% → 65% → past
the gate. Then talk about the honest part: a lucky short run can look amazing,
so we **re-test the best setting over many more games** to get the true number.

## Part 5 — Beat the gate (remainder)

Drop the tuned bot into Level 11, win one game, and watch the 100-game test
run. Cross the **+10% net** line → the reward unlocks.

## Where this points (for the kid who's hooked)

- This is exactly how game-playing AI is built: a **policy** (your weights), a
  **score** (win rate), and a **search/learning** loop that improves the policy.
- Real systems use fancier searches (gradient descent, evolution strategies,
  reinforcement learning) and millions of games — but the shape is identical.
- Next stops: Battlesnake (real bot tournaments), and Python tools like
  OpenAI Gym / stable-baselines3 when they want to go deeper.

## Instructor notes

- **Don't give the answer bot.** The whole value is the kid deriving the
  space-denial idea and tuning it. Nudge with questions, not code.
- It's fine if they don't pass on day one. "Tune overnight and try again" is the
  authentic experience.
- Keep it honest: name the ceiling, name that the counter is opponent-specific,
  name that short runs are noisy. Those caveats *are* the AI literacy.
- The private reference solution + tuner are in `snake-lab-ml` — for **your**
  eyes, to understand the target. Resist showing it.
