"""Render brand concept SVGs against both theme backgrounds on macOS."""

from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parent
PREVIEWS = ROOT / "previews"
PREVIEWS.mkdir(exist_ok=True)

for name in ("sonar-whale", "the-dive", "c-monogram"):
    source = (ROOT / f"{name}.svg").read_text()
    for theme, background, foreground in (
        ("abyss", "#06151e", "#e4fbf6"),
        ("surface", "#e9f4f1", "#113743"),
    ):
        svg = source.replace("currentColor", foreground)
        svg = svg.replace(
            'viewBox="0 0 128 128"',
            'width="512" height="512" viewBox="0 0 128 128"',
            1,
        )
        svg = svg.replace(
            ">", f'><rect width="128" height="128" fill="{background}"/>', 1
        )
        with tempfile.TemporaryDirectory() as temporary:
            temp_svg = Path(temporary) / "preview.svg"
            temp_svg.write_text(svg)
            subprocess.run(
                ["sips", "-s", "format", "png", str(temp_svg), "--out", str(PREVIEWS / f"{name}-{theme}.png")],
                check=True,
                stdout=subprocess.DEVNULL,
            )
