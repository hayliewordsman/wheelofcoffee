"""Draws the Wheel of Coffee launcher icon at every Android density.

Usage: python3 tools/make_icon.py   (writes android/res/drawable-*/ic_launcher.png)
"""
import math
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
WEDGES = ["#e3342f", "#f6851f", "#f9d71c", "#38b24a", "#1f78d1", "#8e44ad", "#ec5fa3"]
SPECIAL = {5: "#111111", 17: "#111111", 11: "#fafafa", 23: "#fafafa"}


def draw(size=1024):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = size / 2
    R = size * 0.47
    d.ellipse([c - R, c - R, c + R, c + R], fill="#e8b45a", outline="#7a4a1c", width=int(size * 0.02))
    r = R * 0.88
    vi = 0
    for i in range(24):
        a0 = -90 + i * 15
        col = SPECIAL.get(i)
        if col is None:
            col = WEDGES[vi % len(WEDGES)]
            vi += 1
        d.pieslice([c - r, c - r, c + r, c + r], a0, a0 + 15, fill=col, outline="#3a1d0c", width=int(size * 0.006))
    for i in range(24):
        a = math.radians(-90 + i * 15)
        pr = r * 0.95
        x, y = c + math.cos(a) * pr, c + math.sin(a) * pr
        s = size * 0.012
        d.ellipse([x - s, y - s, x + s, y + s], fill="#fff3cf")
    # coffee hub
    h = r * 0.42
    d.ellipse([c - h, c - h, c + h, c + h], fill="#5a3014", outline="#e8b45a", width=int(size * 0.025))
    # cup
    cw, ch = h * 0.95, h * 0.7
    top = c - ch * 0.35
    d.rounded_rectangle([c - cw / 2, top, c + cw / 2, top + ch], radius=int(ch * 0.28), fill="#fff3dc")
    d.rectangle([c - cw / 2, top, c + cw / 2, top + ch * 0.3], fill="#fff3dc")
    hw = cw * 0.28
    d.ellipse([c + cw / 2 - hw * 0.45, top + ch * 0.15, c + cw / 2 + hw * 0.75, top + ch * 0.7],
              outline="#fff3dc", width=int(size * 0.025))
    d.ellipse([c - cw / 2 + cw * 0.06, top - ch * 0.08, c + cw / 2 - cw * 0.06, top + ch * 0.14], fill="#7a4220")
    # steam
    for dx in (-0.22, 0.0, 0.22):
        x = c + cw * dx
        d.arc([x - h * 0.08, top - h * 0.55, x + h * 0.08, top - h * 0.3], 90, 270, fill="#fff3dc", width=int(size * 0.016))
        d.arc([x - h * 0.08, top - h * 0.33, x + h * 0.08, top - h * 0.08], 270, 90, fill="#fff3dc", width=int(size * 0.016))
    # pointer
    pw = size * 0.06
    d.polygon([(c - pw, c - R - size * 0.01), (c + pw, c - R - size * 0.01), (c, c - R + size * 0.1)],
              fill="#ffd447", outline="#5a3311")
    return img


def main():
    big = draw()
    for name, px in SIZES.items():
        out = os.path.join(ROOT, "android", "res", "drawable-" + name)
        os.makedirs(out, exist_ok=True)
        big.resize((px, px), Image.LANCZOS).save(os.path.join(out, "ic_launcher.png"))
    big.resize((512, 512), Image.LANCZOS).save(os.path.join(ROOT, "www", "icon.png"))


if __name__ == "__main__":
    main()
