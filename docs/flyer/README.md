# Camp flyer

1-page printable advertisements for the Snake Lab Coding Camp. Two language versions, same layout.

| Language | PDF | Source |
|---|---|---|
| English | [snake-lab-camp.pdf](snake-lab-camp.pdf) | [make_flyer.py](make_flyer.py) |
| 中文(简体) | [snake-lab-camp-zh.pdf](snake-lab-camp-zh.pdf) | [make_flyer_zh.py](make_flyer_zh.py) |

The Chinese version uses reportlab's built-in CIDFont `STSong-Light` (no extra font install needed). STSong-Light has no bold variant in the standard set, so the AI-thread emphasis in the hero pitch is rendered in dark green instead of bold.

## Editing

Open `make_flyer.py` (English) or `make_flyer_zh.py` (Chinese) and look for these fields:

| Find | Change to |
|---|---|
| `"Jun 24–26, 2026 · Wed–Fri"` / `"2026 年 6 月 24 – 26 日(周三 – 周五)"` | Actual dates |
| `"$120 – $150 · lunch included"` / `"$120 – $150,含午餐"` | Final price |
| `"Yancy's home"` / `"Yancy 家"` | Actual address |
| `"yancyqin@gmail.com"` | Whatever email parents should write to |
| The `curriculum` list | What each day teaches — keep the AI thread visible |
| The `takeaways` list | What each kid leaves with |

Then regenerate (either or both):

```bash
pip install reportlab     # one-time
cd docs/flyer
python3 make_flyer.py     # English
python3 make_flyer_zh.py  # 中文
```

The PDFs rebuild in this same folder.

**Keep the two language files in sync.** When you change dates / price / location / curriculum, update both scripts. Each is self-contained — there's no shared content module — to keep the typography decisions independent (e.g. Chinese gets `STSong-Light` everywhere; English keeps Helvetica).
