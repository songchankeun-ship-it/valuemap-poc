# ORNScore Google Play Feature Graphic Draft

Scope: local-only Google Play feature graphic draft. This folder does not upload assets to Play Console, change store metadata, publish app binaries, deploy, push, or change account/signing state.

## Files

| File | Purpose |
| --- | --- |
| `feature-graphic.html` | Reproducible 1024x500 source composition. It uses the real ORNScore stock-detail UI screenshot from `../google-play-draft/phone-03-stock-detail.jpg`. |
| `feature-graphic-google-play-1024x500.jpg` | Exported Google Play feature graphic draft. |

## Copy Guardrails

Visible copy:

- `한국 주식 후보를 데이터로 좁히기`
- `점수 근거 · 공시 신호 · 데이터 기준일을 한 화면에서 확인합니다.`
- `투자 추천이 아닌 탐색 도구`

Avoided on purpose:

- Ranking or performance claims such as `1위`, `TOP`, `수익률 보장`, `목표가`.
- Price or promotion claims such as `무료`, discounts, or limited-time offers.
- Store availability calls such as `지금 다운로드`.
- Play Store / App Store badges before the app is live in those stores.

## Export Validation

Local validation result:

```text
feature-graphic-google-play-1024x500.jpg
format=JPEG
mode=RGB
size=1024x500
bytes=61114
alpha=False
```

This meets the Google Play feature graphic baseline recorded in `docs/ornscore-store-visual-assets-pack-2026-07-12.md`: `1024x500`, JPEG or 24-bit PNG, no alpha.

## Re-Export Notes

1. Open `feature-graphic.html` from a local-only static server with a `1024x500` viewport.
2. Capture exactly the viewport rectangle.
3. Save as `feature-graphic-google-play-1024x500.jpg`.
4. Re-run `npm run app:check` to verify the documented asset path and image dimensions.
