# Camp prep — checklist

Pre-camp checklist for the instructor. Surfaced from the L1–L6 lesson plans. Run through this the week before, again the night before, again on the morning of Day 1.

For the actual lesson content see [LESSONS.md](LESSONS.md). For the broader project plan see [../README.md](../README.md).

## A week before

- [ ] **Print the hex code reference sheet** — 1-page handout. Used in **L1** when kids pick their snake color.
  ```
  red    #ef4444    purple #a855f7    teal  #34d399
  blue   #3b82f6    pink   #ec4899    green #4ade80
  yellow #eab308    orange #f97316
  ```
- [ ] **Print the client/server diagram poster** (for L2) — the "iPads → Mr. Yancy's laptop" picture. Faster than redrawing it live.
- [ ] **Print the `state` shape poster** (for L3) — the `{ me, food, others, board, tick }` block. Kids look at it constantly while writing bots.
- [ ] **Print the strategy-weights poster** (for L4) — table of the 4 weights (`W_FOOD`, `W_SAFETY`, `W_BLOCKING`, `W_OPEN`) with what each one does. Used during the "tune your bot" hands-on.
- [ ] **Have AI-partner accounts ready** (for L3 onward) — Claude.ai or ChatGPT, signed in on the projector. If kids will use AI on their own devices, decide ahead: shared instructor session on the projector (rotate kids) or individual accounts (need parent signoff).
- [ ] **Decide the DevTools strategy** for Lesson 1's hands-on. Two paths:
  - **Set up Safari Web Inspector on every iPad** ahead of time (Settings → Safari → Advanced → Web Inspector). Then USB-attach each iPad to a Mac during the lesson and kids drive their own DevTools.
  - **Instructor drives DevTools on the projector**, kids call out commands. Simpler, less hardware coordination.
- [ ] **Test on an actual iPad** — not just the desktop preview. Touch behavior, font sizes, and the screen layout all differ on a real device.
- [ ] **Prepare a 5-question feedback form** — paper or a Google Form to send home. Suggested questions:
  1. What was your favorite lesson and why?
  2. What was the hardest part?
  3. What would you change about your snake?
  4. What would you want to build next?
  5. Anything you want to tell us?

## Day before

- [ ] **Update the repo** from `main`. Verify `node server.js` starts cleanly in `v2-arena/` and `python3 server.py` works in `v1-classic/`.
- [ ] **Plan the port table** so v1, v2, and v3 can run side-by-side:
  | Version | Port | Command |
  |---|---|---|
  | v1-classic | 8080 | `python3 server.py 8080` |
  | v2-arena | 8081 | `PORT=8081 node server.js` |
  | v3-coder | 8082 | `PORT=8082 node server.js` (when shipped) |
- [ ] **Confirm parents demo logistics** — who's coming, what time, where. Pick a memorable room name to share (e.g. `family-night`).
- [ ] **Charge iPads** and the instructor's MacBook.

## Morning of each day

- [ ] **Find the Mac's local IP** — `System Settings → Network → Wi-Fi → Details → IP Address`. Write it on the whiteboard. Kids type `http://<that-ip>:<port>` to join.
- [ ] **Start the right server(s)** — easiest path is "start all three on Day 1, leave them up all week":
  - Day 1 AM (L1): v1 on 8080
  - Day 1 PM (L2): v2 on 8081
  - Day 2 AM (L3) + Day 2 PM (L4) + Day 3 (L5, L6): v3 on 8082
- [ ] **Open the editor on the projector** with the lesson's target file(s) ready:
  - L1 — `v1-classic/js/Snake.js`, `Game.js`, `constants.js`
  - L2 — `v2-arena/server.js`, `bot.js` (especially `botMove` + `smartMove`)
  - L3 — Claude.ai or ChatGPT tab + the v3 lobby with `greedy.js` loaded
  - L4 — `v3-coder/public/bots/tunable.js` open, with the 4 weights highlighted at the top
  - L5 — `v3-coder/public/bots/learning.js` open, scrolled to the `qTable` and Bellman update
- [ ] **Open a fresh terminal** in the projected window so kids can see "+player joined" log lines fly by (L2's killer demo).
- [ ] **Have [PROTOCOL.md](PROTOCOL.md) open in a tab** for L2 — the JSON examples land harder when you can also project the raw doc.
- [ ] **Sign into Claude.ai / ChatGPT on the projector** before L3. New chat ready. Have one warm-up prompt typed but not sent (e.g. "Explain this code as if I'm 10 years old") so the demo lands smoothly.

## During camp

- [ ] After each session, jot down what landed and what flopped — file under "lessons learned" so next year's camp is better.
- [ ] Take photos of kids' iPad screens with permission — useful for a recap email to parents.

## Friday afternoon — set up Saturday bonus day

The week ends with **L6 tournament Friday PM**. Then there's a **bonus Saturday** with parents (see [LESSONS.md](LESSONS.md) — "Bonus — Saturday").

- [ ] **Invite parents** — short message, e.g.:
  > "Saturday 10am–1pm: kids show off their snake bots, then we unlock 👑 King mode (snake eats snake) and 🌫️ Fog of war. Families welcome to play. Lab address: [...]."
- [ ] **Make sure kids saved their bot code.** Friday's sessionStorage may clear. Have kids paste their bot into Notes / email it to themselves / send to a shared Slack/Discord. **A kid showing up Saturday with no bot is the saddest scenario** — engineer around it.
- [ ] **Print "Snake Lab graduate" certificates** (optional, nice touch). One per kid.
- [ ] **Pre-stage room names** so kids don't have to invent them on the spot — e.g. `kings`, `fog-finals`, `family`, `chaos`.

## Saturday morning (bonus day)

- [ ] Pull latest code (in case any last-minute fixes landed).
- [ ] Start v2 + v3 servers locally (same port table as the rest of the week).
- [ ] Write the Mac's IP on the whiteboard. Add a column for each tournament's room name.
- [ ] Have a snack table — kids and parents will be here for ~3 hours.
- [ ] Open the leaderboard whiteboard (same format as L6).
- [ ] Charge the projector / screencast device. Saturday's a long play day.

## After camp

- [ ] Send parents a recap email with photos + the feedback form
- [ ] Open a fresh GitHub issue or note for "what to change in next year's curriculum" — feeds back into [IDEAS.md](../IDEAS.md)
