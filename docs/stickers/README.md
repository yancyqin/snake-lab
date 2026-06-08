# Snake Lab — Prize Stickers

Three-tier prize stickers awarded for milestone clears in the challenge ladder. Same coiled-snake mark across all three so they read as a set; ring color / decoration changes per tier.

| Tier | Visual cues | Suggested use |
|---|---|---|
| **Silver** | chrome ring, slate field, **1 star** | early milestone clear (e.g. challenge L4) |
| **Gold** | sunburst spikes, gold ring, amber field, **crown + 2 stars** | mid milestone (e.g. L6 or L8) |
| **Diamond** | platinum ring, hexagonal facet outline, cyan field, **gem + 3 stars + sparkles** | top prize (L10 / Apex) |

## Files

- `silver.svg`, `gold.svg`, `diamond.svg` — vector originals, 500×500 viewBox, transparent background
- `silver.png`, `gold.png`, `diamond.png` — 500×500 raster renders
- `index.html` — side-by-side preview (serve via `python3 -m http.server` from `snake-lab/` and visit `/docs/stickers/`)

## Re-rendering the PNGs

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for tier in silver gold diamond; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --default-background-color=00000000 --window-size=500,500 \
    --screenshot="${tier}.png" "file://$PWD/${tier}.svg"
done
```

For a larger print-ready render bump `--window-size` (e.g. `1500,1500`).
