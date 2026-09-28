"""Export Cachalot logo theme and size variants from the vector master."""

from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parent
MASTER = (ROOT / "cachalot-mark.svg").read_text()
SIZES = (16, 32, 64, 128, 256, 512, 1024)
PALETTES = {
    "light": ("#33cfff", "#027bff", "#0237a6"),
    "dark": ("#63dfff", "#258cff", "#316ad8"),
}


def recolor(source: str, colors: tuple[str, str, str]) -> str:
    for original, replacement in zip(PALETTES["light"], colors, strict=True):
        source = source.replace(original, replacement)
    return source


def rasterize(source: str, destination: Path, size: int) -> None:
    source = source.replace('width="1024" height="1024"', f'width="{size}" height="{size}"', 1)
    with tempfile.TemporaryDirectory() as temporary:
        svg = Path(temporary) / "mark.svg"
        svg.write_text(source)
        subprocess.run(
            ["sips", "-s", "format", "png", str(svg), "--out", str(destination)],
            check=True,
            stdout=subprocess.DEVNULL,
        )


for theme, palette in PALETTES.items():
    source = recolor(MASTER, palette)
    (ROOT / f"cachalot-mark-{theme}.svg").write_text(source)
    png_dir = ROOT / "png" / theme
    png_dir.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        rasterize(source, png_dir / f"cachalot-mark-{size}.png", size)

    background = "#f2f8fa" if theme == "light" else "#07131b"
    preview = source.replace(
        "  <g mask=",
        f'  <rect x="620" y="260" width="1100" height="1100" fill="{background}"/>\n  <g mask=',
        1,
    )
    rasterize(preview, ROOT / f"preview-{theme}.png", 512)

for name, color in (("light", "#123743"), ("dark", "#eafaff")):
    monochrome = recolor(MASTER, (color, color, color))
    (ROOT / f"cachalot-mark-mono-{name}.svg").write_text(monochrome)
