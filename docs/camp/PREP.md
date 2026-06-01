# Camp prep — checklist

Pre-camp checklist for the instructor. Surfaced from the L1–L6 lesson plans. Run through this the week before, again the night before, again on the morning of Day 1.

For the actual lesson content see [LESSONS.md](LESSONS.md). For the broader project plan see [../VISION.md](../VISION.md).

## A week before

- [ ] **Print the hex code reference sheet** — 1-page handout. Used in **L2** when kids pick their snake color.
  ```
  red    #ef4444    purple #a855f7    teal  #34d399
  blue   #3b82f6    pink   #ec4899    green #4ade80
  yellow #eab308    orange #f97316
  ```
- [ ] **Print the client/server diagram poster** (for L3) — the "iPads → Mr. Yancy's laptop" picture. Faster than redrawing it live.
- [ ] **Print the smartness curve poster** (for L4) — `length` vs `smartness`: flat at 1.0 until length 10, linear drop to 0 by length 30. Reusable for v3 later.
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
- [ ] **Start the right server(s)**:
  - Day 1 AM/PM: v1 on 8080, v2 on 8081
  - Day 2 AM/PM: v2 on 8081, (v3 on 8082 if available)
  - Day 3 AM/PM: v3 on 8082
- [ ] **Open the editor on the projector** with the lesson's target file(s) ready (`Snake.js` for L1, `Game.js` for L2, `server.js`+`bot.js` for L3/L4, etc.).
- [ ] **Open a fresh terminal** in the projected window so kids can see "+player joined" log lines fly by (L3's killer demo).

## During camp

- [ ] After each session, jot down what landed and what flopped — file under "lessons learned" so next year's camp is better.
- [ ] Take photos of kids' iPad screens with permission — useful for a recap email to parents.

## After camp

- [ ] Send parents a recap email with photos + the feedback form
- [ ] Open a fresh GitHub issue or note for "what to change in next year's curriculum" — feeds back into [IDEAS.md](../IDEAS.md)
