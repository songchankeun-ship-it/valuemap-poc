from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[4]
SOURCE_SCREENSHOT = ROOT / "docs/store-assets/2026-07-12/google-play-draft/phone-03-stock-detail.jpg"
OUTPUT = ROOT / "public/social/ornscore-og-1200x630.jpg"

WIDTH = 1200
HEIGHT = 630


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts") / name,
        Path("C:/Windows/Fonts/malgun.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


FONT_REGULAR = font("malgun.ttf", 36)
FONT_BOLD = font("malgunbd.ttf", 36)
FONT_HEAVY = font("malgunbd.ttf", 74)
FONT_BRAND = font("malgunbd.ttf", 32)
FONT_SUB = font("malgun.ttf", 31)
FONT_CHIP = font("malgunbd.ttf", 19)
FONT_FOOTER = font("malgun.ttf", 22)


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def make_background() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#f4f8fb")
    pixels = image.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            tx = x / (WIDTH - 1)
            ty = y / (HEIGHT - 1)
            base = (
                lerp(250, 231, tx * 0.65 + ty * 0.2),
                lerp(253, 243, tx * 0.45 + ty * 0.25),
                lerp(255, 249, tx * 0.35 + ty * 0.3),
            )
            cyan = max(0.0, 1.0 - (((x - 940) / 330) ** 2 + ((y - 85) / 220) ** 2))
            pixels[x, y] = (
                min(255, base[0] + round(8 * cyan)),
                min(255, base[1] + round(18 * cyan)),
                min(255, base[2] + round(24 * cyan)),
            )
    return image


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def draw_shadow(base: Image.Image, xy: tuple[int, int], size: tuple[int, int], radius: int) -> None:
    shadow = Image.new("RGBA", (size[0] + 80, size[1] + 80), (0, 0, 0, 0))
    mask = rounded_mask(size, radius)
    shadow.paste((25, 45, 75, 54), (40, 40), mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    base.paste(shadow, (xy[0] - 40, xy[1] - 28), shadow)


def draw_text_lines(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    lines: list[str],
    typeface: ImageFont.ImageFont,
    fill: str,
    line_gap: int,
) -> int:
    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=typeface, fill=fill)
        bbox = draw.textbbox((x, y), line, font=typeface)
        y += bbox[3] - bbox[1] + line_gap
    return y


def draw_chip(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, fill: str = "#ffffff") -> int:
    pad_x = 20
    pad_y = 11
    bbox = draw.textbbox((0, 0), text, font=FONT_CHIP)
    width = bbox[2] - bbox[0] + pad_x * 2
    height = bbox[3] - bbox[1] + pad_y * 2
    draw.rounded_rectangle((x, y, x + width, y + height), radius=10, fill=fill, outline="#dce5ee", width=1)
    draw.text((x + pad_x, y + pad_y - 1), text, font=FONT_CHIP, fill="#223047")
    return x + width + 12


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas = make_background().convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    # Subtle grid, kept very faint so thumbnail text remains readable.
    grid = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(grid)
    for x in range(0, WIDTH, 36):
        grid_draw.line((x, 0, x, HEIGHT), fill=(22, 34, 51, 7), width=1)
    for y in range(0, HEIGHT, 36):
        grid_draw.line((0, y, WIDTH, y), fill=(22, 34, 51, 7), width=1)
    canvas.alpha_composite(grid)

    # Brand mark.
    draw.rounded_rectangle((72, 64, 128, 120), radius=16, fill="#1766d1")
    draw.text((91, 72), "O", font=FONT_BOLD, fill="#ffffff")
    draw.text((148, 72), "오른스코어", font=FONT_BRAND, fill="#172033")

    # Main copy.
    draw_text_lines(
        draw,
        (72, 168),
        ["한국 주식 후보를", "데이터로 좁히기"],
        FONT_HEAVY,
        "#172033",
        6,
    )
    draw_text_lines(
        draw,
        (74, 352),
        ["점수 근거 · DART 공시 · 데이터 기준일을", "한 화면에서 확인합니다."],
        FONT_SUB,
        "#536174",
        8,
    )

    chip_y = 468
    chip_x = 74
    chip_x = draw_chip(draw, chip_x, chip_y, "138개 종목")
    chip_x = draw_chip(draw, chip_x, chip_y, "자체 지표 4종")
    draw_chip(draw, chip_x, chip_y, "투자 추천 아님", "#f8fcfb")

    draw.text((76, 567), "ornscore.com", font=FONT_FOOTER, fill="#536174")

    # Real UI panel.
    panel_x, panel_y = 738, 48
    panel_w, panel_h = 390, 534
    draw_shadow(canvas, (panel_x, panel_y), (panel_w, panel_h), 26)
    draw.rounded_rectangle((panel_x, panel_y, panel_x + panel_w, panel_y + panel_h), radius=26, fill="#ffffff", outline="#d6e0ea", width=1)

    screenshot = Image.open(SOURCE_SCREENSHOT).convert("RGB")
    shot_w = panel_w
    shot_h = round(screenshot.height * (shot_w / screenshot.width))
    screenshot = screenshot.resize((shot_w, shot_h), Image.Resampling.LANCZOS)
    crop = screenshot.crop((0, 0, shot_w, panel_h))
    mask = rounded_mask((panel_w, panel_h), 26)
    canvas.paste(crop.convert("RGBA"), (panel_x, panel_y), mask)

    # Data badge floats over the UI card edge.
    badge_x, badge_y = 638, 448
    draw_shadow(canvas, (badge_x, badge_y), (240, 92), 16)
    draw.rounded_rectangle((badge_x, badge_y, badge_x + 240, badge_y + 92), radius=16, fill=(248, 253, 251, 245), outline="#cfe9df", width=1)
    draw.text((badge_x + 22, badge_y + 18), "공개 데이터 기반", font=FONT_CHIP, fill="#0f6f51")
    draw.text((badge_x + 22, badge_y + 50), "종목 탐색", font=FONT_BRAND, fill="#155f49")

    canvas.convert("RGB").save(OUTPUT, "JPEG", quality=92, optimize=True, progressive=False)
    print(f"wrote {OUTPUT}")


if __name__ == "__main__":
    main()
