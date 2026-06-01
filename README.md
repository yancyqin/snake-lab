# snake-lab 🐍

A three-version snake game built as a vibe-coding learning journey. The goal: kids learn modern web development by building a real game from scratch with AI assistance, then extending it to multiplayer and programmable bots.

This project follows the same pattern as [`lucasgame`](../lucasgame/) (tower defense). The plan and design decisions live in [VISION.md](VISION.md) — read that before making structural changes.

## The three versions

| | What | Stack | How to run |
|---|---|---|---|
| **v1-classic** | Single-player snake | Static HTML + vanilla JS | `cd v1-classic && python3 -m http.server 8080` |
| **v2-arena** | Multiplayer snake (humans) | Node.js + `ws` | (instructions in `v2-arena/`) |
| **v3-coder** | Programmable bots — paste JS code, bots compete | Node.js + `ws` | (instructions in `v3-coder/`) |

Each version is its own folder and runs standalone.

## Status

Currently building **v1-classic**. See [VISION.md](VISION.md) for the full roadmap.

## Lessons

A 5-ish-lesson curriculum (`LESSONS.md`) will be written **after** the games stabilize — the code comes first, lessons are distilled from it.

## Built by

A kid + dad + AI, continuing the pattern from `lucasgame`.
