# 🎓 Secret Lesson — Beating the Hunter (Apex)

> **Earned, not scheduled.** Outside the 3-day camp. A kid unlocks it by
> clearing **Level 10** of the Homework Challenge. It's the advanced track: how
> to beat **Level 11 (Apex)** — the bot-only level whose gate is "your bot must
> win at least 10% more than it loses over 100 games vs Apex."
>
> This teaches the real *idea* and the *method*. It does **not** hand over the
> answer bot — the kid still builds and tunes their own. (The instructor's
> private reference is in the separate `snake-lab-ml` repo.)

## Why this lesson exists

By Level 10 the kid has written a real bot. Level 11 looks impossible:
- You can't beat Apex by **surviving better** — two good survival bots just
  draw forever (the "draw fortress").
- You can't beat it by **copying** it — a mirror match nets ~0%.

So Level 11 forces the one move left: **find the opponent's blind spot and
exploit it.** That's a genuinely new skill — and it's exactly how real AI gets
its surprises.

## Big idea

> When you can't out-play an opponent head-on, **study it for a mistake it
> always makes.** Apex has one. And when you let a *computer* search for a way
> to win, it won't find the "noble" strategy — it'll find the mistake and abuse
> it. That shortcut has a name in AI: **reward hacking.**

## Apex's blind spot (the actual exploit)

Every snake bot here — Apex included — builds its danger map by treating each
snake's body **minus the tail** as blocked, because normally the tail slides
forward and frees that cell next tick. **But a snake that EATS doesn't shrink —
its tail stays put.** Apex never checks "is my target about to eat?"

So:
1. Apex is *aggressive* — it presses in and **tail-chases** you (follows right
   behind your tail).
2. Normally that's safe for it: your tail keeps moving out of the way.
3. **Eat a food at the moment Apex is on your tail** → you grow, your tail
   stays → Apex's head rams your body → **in classic rules the one that rams a
   body dies.** Apex kills itself.

You win by turning your own growth into a wall, exactly when the hunter is
committed to chasing.

## The machine-learning twist (the best part)

`tune.mjs` (instructor's `snake-lab-ml`) tunes a bot's weights by playing
thousands of games vs Apex, keeping whatever wins (random search + hill
climbing — L4's "you are the gradient," automated). When we ran it, it found a
winner at +21%. But here's the lesson: **it didn't discover a clever strategy —
it discovered Apex's tail blind spot and abused it.** Patch the blind spot and
the "winning" bot immediately *loses*.

That's **reward hacking**: an optimizer told only "win more" exploits a flaw in
its world instead of playing the intended way. It happens constantly in real
RL — agents glitch through walls, abuse physics bugs, game the score. Your kid
can watch it happen on a snake board.

## Lesson flow

1. **See the draw fortress (5 min).** Run the kid's L10 bot vs Apex a few times
   (or read the L11 "100-game" number). Mostly draws. "Surviving isn't enough."
2. **Watch Apex hunt — slowly (10 min).** Set the tick speed to 3–5s and play
   Apex by hand (L11 has a 🎮 practice mode). Notice it **follows your tail**.
3. **Spring the trap (10 min).** Lead Apex onto your tail, then steer onto a
   food. You grow; it rams you; it dies. Do it on purpose a few times.
4. **Turn it into a bot (20 min).** The hard part: a bot must *set up* the
   tail-chase and time the eat. Or — like the ML tuner — just let a search loop
   find the weights that make it happen, and watch the win rate climb.
5. **Beat the gate.** Win one game, then pass the 100-game test (>+10% net).

## Level 12 — Apex Prime (the next frontier)

The exploit is so central that we made a **patched** version: **Apex Prime
(Level 12)**. Prime checks whether you're next to food and, if so, stops
assuming your tail vacates — so the eat-and-ram trick **fails**. The bot that
beats Apex *loses* to Prime. Beating Prime may require something genuinely new
(or it may be the true ceiling — an open challenge).

## Instructor notes

- The exploit was found by the **instructor**, not a kid — your job is to lead
  the kid to *rediscover* it by slowing the game down and watching Apex chase.
  Ask "why did it run into you right after you ate?" Let them connect it.
- **Don't hand over the answer bot.** Guide with questions.
- Teach the honest framing: the ML didn't get "smart," it found a bug. That's a
  real and important AI idea (reward hacking / specification gaming), not a
  footnote.
- The private reference (`snake-lab-ml`: `counter-bot.js`, `tune.mjs`, the
  finding) is for **your** eyes. Apex Prime (L12) is the hardened rematch.
