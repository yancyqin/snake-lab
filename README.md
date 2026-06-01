# snake-lab 🐍

**[Play online →](https://yancyqin.github.io/snake-lab/)**

A three-version snake game built as a vibe-coding learning journey. The goal: kids learn modern web development by building a real game from scratch with AI assistance, then extending it to multiplayer and programmable bots.

This project follows the same pattern as [`lucasgame`](../lucasgame/) (tower defense). The plan and design decisions live in [docs/VISION.md](docs/VISION.md) — read that before making structural changes.

## The three versions

| | What | Stack | How to run |
|---|---|---|---|
| **v1-classic** | Single-player snake | Static HTML + vanilla JS | `cd v1-classic && python3 server.py 8080` |
| **v2-arena** | Multiplayer snake (humans) | Node.js + `ws` | (instructions in `v2-arena/`) |
| **v3-coder** | Programmable bots — paste JS code, bots compete | Node.js + `ws` | (instructions in `v3-coder/`) |

Each version is its own folder and runs standalone.

## Status

**v1-classic** and **v2-arena** are done. **v3-coder** is next. See [docs/VISION.md](docs/VISION.md) for the full roadmap.

## Docs

- [docs/VISION.md](docs/VISION.md) — project plan, locked design decisions, build status
- [docs/IDEAS.md](docs/IDEAS.md) — future tune-ups parked here
- [docs/camp/LESSONS.md](docs/camp/LESSONS.md) — full 3-day camp curriculum
- [docs/camp/PREP.md](docs/camp/PREP.md) — instructor pre-camp checklist

## Built by

A kid + dad + AI, continuing the pattern from `lucasgame`.
