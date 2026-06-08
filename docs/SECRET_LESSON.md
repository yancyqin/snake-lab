# 🎓 Secret Lesson — Beating the Hunter (Achilles)

> **Earned, not scheduled.** Outside the 3-day camp. A kid unlocks it by
> clearing **Level 10**. It's the advanced track: how to beat **Level 11
> (Achilles)** — the bot-only level whose gate is "your bot must win at least
> 10% more than it loses over 100 games."
>
> This page is the **public teaser**. The full walkthrough — the exact weakness,
> the step-by-step, and the answer bot — is in the instructor's **private**
> `snake-lab-ml` repo (so it isn't a spoiler sitting in the open). Instructor:
> read that before teaching.

## Why this lesson exists

By Level 10 the kid has written a real bot. Level 11 looks impossible:
- You can't beat Achilles by **surviving better** — two good survival bots just
  draw forever (the "draw fortress").
- You can't beat it by **copying** it — a mirror match nets ~0%.

So Level 11 forces the one move left: **find the one mistake your opponent
always makes, and exploit it.** That's a genuinely new skill — and it's how
real AI gets its surprises.

## Big idea

> When you can't out-play an opponent head-on, **study it until you find the
> situation where it slips up.** And when you let a *computer* search for a way
> to win, it won't invent a noble strategy — it'll find that slip-up and abuse
> it. In AI that shortcut has a name: **reward hacking** (the optimizer games a
> flaw in its world instead of playing "properly"). Achilles even has a heel.

## How to teach it (high level)

1. **See the draw fortress.** Run the kid's L10 bot vs Achilles a few times —
   mostly draws. "Surviving isn't enough."
2. **Watch — slowly.** Use the 🐢 tick-speed control (3–5s) and play Achilles by
   hand (L11 has a 🎮 practice mode). Tell the kid: *don't try to win — just
   watch the hunter and look for the one moment it does something dumb.* Let
   them notice the pattern themselves.
3. **Name the weakness, then exploit it on purpose** (details in the private
   guide). Do it by hand a few times until it's reliable.
4. **Turn it into a bot** — or, like a real ML system, let a search loop tune
   the bot's numbers and watch the win rate climb. (See `tune.mjs` in the
   private repo: random search + hill climbing — L4's "you are the gradient,"
   automated.)
5. **Beat the gate:** win one game, then pass the 100-game test (net > +10%).

## Level 12 — Apex (the next frontier)

The weakness is so central that there's a **patched** version: **Apex (Level
12).** It closes the hole, so the trick that beats Achilles fails — the bot that
beats Achilles *loses* to Apex. Beating Apex may need something genuinely new,
or it may be the true ceiling. An open challenge.

## Instructor notes

- The **full detail lives in `snake-lab-ml`** (private): `SECRET_LESSON.md` (the
  exact weakness + walkthrough), `counter-bot.js` (the answer), `tune.mjs` (the
  ML search), `verify.mjs` (proof). Keep it private.
- Lead the kid to **rediscover** the weakness by slowing the game and watching —
  don't hand it over, and don't hand over the bot.
- Teach the honest framing: the ML didn't get "smart," it found a flaw and
  abused it. **Reward hacking / specification gaming** is a real, important AI
  idea — not a footnote.
