# Cachalot mark

The mark is a hand-traced vector recreation of the graphic in the two owner-provided screenshots dated 2026-09-28. It contains no wordmark or screenshot pixels. Three offset circular layers, a horizontal opening, and a four-point transparent cutout define its geometry.

## Files

- `cachalot-mark.svg`: vector master and exact palette sampled from the reference (`#33CFFF`, `#027BFF`, `#0237A6`).
- `cachalot-mark-light.svg`: named light-theme copy of the master for symmetric theme imports.
- `cachalot-mark-dark.svg`: same geometry with a brighter inner layer for dark surfaces.
- `cachalot-mark-mono-light.svg` and `cachalot-mark-mono-dark.svg`: single-color marks for restrained UI and template use.
- `png/light/` and `png/dark/`: transparent exports at 16, 32, 64, 128, 256, 512, and 1024 pixels.
- `preview-light.png` and `preview-dark.png`: theme comparison on opaque sample surfaces.

Use SVG whenever possible. Preserve the square viewBox, transparent opening, colors, and proportions. Never stretch. Keep clear space at least 10% of displayed mark width. At 16 pixels, prefer monochrome variant when exact layer distinctions are not legible.

On macOS, regenerate theme variants and PNG exports with `python3 assets/logo/generate_assets.py`. The script uses built-in `sips` and no third-party packages.
