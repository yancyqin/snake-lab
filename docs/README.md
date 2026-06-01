# snake-lab docs

This folder collects everything that isn't code or deploy config. Code lives in `v1-classic/`, `v2-arena/`, `v3-coder/`. The project plan lives in the [repo root README](../README.md).

## What's here

| File | What it's for | Who reads it |
|---|---|---|
| [LESSONS.md](LESSONS.md) | The full 3-day camp curriculum (L1–L6) | Instructor, week before camp |
| [PREP.md](PREP.md) | Pre-camp checklist — posters, hex codes, port table, feedback form | Instructor, day before camp |
| [IDEAS.md](IDEAS.md) | Future tune-ups — things tried and removed, things not yet tried | Whoever's looking for "what's next" |

## Conventions

- Cross-cutting docs live in `docs/` (flat — no subfolders).
- Per-version docs (how to run v1, v2, v3) live next to the code as `v*/README.md`.
- Code references in docs use absolute repo paths like `v2-arena/server.js` — easier to copy-paste into a terminal.
- File names use uppercase to match the GitHub `README` / `LICENSE` tradition.

## Related files at the repo root

These can't move (GitHub / Render / Claude Code expect them at the root):

- [`../README.md`](../README.md) — the project's source of truth (was VISION.md too — now merged in)
- `../index.html` — GitHub Pages landing
- `../render.yaml` — Render.com deploy blueprint
- [`../CLAUDE.md`](../CLAUDE.md) — AI assistant guide
