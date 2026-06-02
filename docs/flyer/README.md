# Camp flyer

A 1-page printable advertisement for the Snake Lab Coding Camp.

- **PDF:** [snake-lab-camp.pdf](snake-lab-camp.pdf) — print this
- **Source:** [make_flyer.py](make_flyer.py) — edit dates / price / email / contact, then re-run

## Editing

Open `make_flyer.py` and look for these strings:

| Find | Change to |
|---|---|
| `"To be announced (first trial run)"` | Actual dates (e.g. `"July 15 – 17, 2026"`) |
| `"$120 – $150 · lunch included"` | Final price |
| `"TBA"` (location) | Actual address |
| `"yqin@paciolan.com"` | Whatever email parents should write to |

Then regenerate:

```bash
pip install reportlab     # one-time
cd docs/flyer
python3 make_flyer.py
```

The PDF rebuilds in this same folder.
