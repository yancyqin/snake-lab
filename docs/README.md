# snake-lab docs

This folder collects everything that isn't code or deploy config. Code lives in `v1-classic/`, `v2-arena/`, `v3-coder/`.

## What's here

| File | What it's for | Who reads it |
|---|---|---|
| [VISION.md](VISION.md) | The 3-version game plan, locked decisions, build status | Anyone touching the project structure |
| [IDEAS.md](IDEAS.md) | Future tune-ups — things tried and removed, things not yet tried | Whoever's looking for "what's next" |
| [camp/LESSONS.md](camp/LESSONS.md) | The full 3-day camp curriculum (L1–L6) | Instructor, week before camp |
| [camp/PREP.md](camp/PREP.md) | Pre-camp checklist — posters, hex codes, port table, etc. | Instructor, day before camp |

## Conventions

- Cross-cutting docs live under `docs/`. Per-version docs (how to run v1, v2, v3) live next to the code as `v*/README.md`.
- File names use uppercase to match the GitHub `README` / `LICENSE` tradition.
- Code references in docs use absolute repo paths like `v2-arena/server.js`, not relative paths — easier to copy-paste into a terminal.

## Related files at the repo root

These can't move (GitHub / Render / Claude Code expect them at the root):

- `README.md` — the repo landing page
- `index.html` — GitHub Pages landing
- `render.yaml` — Render.com deploy blueprint
- `CLAUDE.md` — AI assistant guide
