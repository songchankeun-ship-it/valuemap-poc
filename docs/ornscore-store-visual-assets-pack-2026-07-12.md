# ORNScore Store Visual Assets Pack - 2026-07-12

Scope: local-only store visual asset preparation. This pack creates real UI screenshot drafts and records the remaining feature graphic, Apple screenshot, and PWA manifest screenshot gates. It does not submit to Play Console/App Store Connect, generate signing keys, publish `assetlinks.json`, deploy, push, or change account/remote state.

## Official Baseline Checked

- Google Play preview assets: app icon, feature graphic, screenshots, short description, and preview video requirements.
  - https://support.google.com/googleplay/android-developer/answer/9866151
- Apple App Store Connect screenshot specifications: exact accepted iPhone/iPad screenshot sizes and one-to-ten screenshot rule.
  - https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/
- Web app manifest `screenshots`: optional member for app-store/PWA previews; `src` is required and labels are encouraged.
  - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/screenshots

## What Was Produced Locally

Six draft phone screenshots were captured from a local production build at `http://127.0.0.1:4677`, using a 540x960 mobile viewport. They are real ORNScore UI, not fake marketing mockups.

Directory:

```text
docs/store-assets/2026-07-12/google-play-draft/
```

| File | Route | Draft caption | Alt text |
| --- | --- | --- | --- |
| `phone-01-home.jpg` | `/` | 오늘 볼 종목을 빠르게 좁히기 | ORNScore home screen showing stock discovery summary, search, and data date. |
| `phone-02-stocks.jpg` | `/stocks` | 조건에 맞는 한국 주식 탐색 | Stock explorer screen with filters and candidate list entry points. |
| `phone-03-stock-detail.jpg` | `/stock/005930` | 점수 근거와 데이터 품질 확인 | Samsung Electronics detail screen showing score, rank, strengths, and data quality. |
| `phone-04-disclosures.jpg` | `/disclosures` | DART 공시 신호를 한곳에서 | Disclosure signal screen showing DART categories and collection scope. |
| `phone-05-compare.jpg` | `/compare` | 후보 종목을 나란히 비교 | Compare screen explaining how to add and review multiple stock candidates. |
| `phone-06-status.jpg` | `/status` | 데이터 기준일과 원본 확인 | Data status screen showing source freshness and verification context. |

## Local Screenshot Validation

Generated file check:

```text
phone-01-home.jpg          532x946  45142 bytes  dim_ok=True  ratio_ok=True  size_ok=True
phone-02-stocks.jpg        532x946  49057 bytes  dim_ok=True  ratio_ok=True  size_ok=True
phone-03-stock-detail.jpg  532x946  50274 bytes  dim_ok=True  ratio_ok=True  size_ok=True
phone-04-disclosures.jpg   532x946  56293 bytes  dim_ok=True  ratio_ok=True  size_ok=True
phone-05-compare.jpg       532x946  45822 bytes  dim_ok=True  ratio_ok=True  size_ok=True
phone-06-status.jpg        532x946  43002 bytes  dim_ok=True  ratio_ok=True  size_ok=True
```

Browser capture checks:

- Each route loaded on local prod with no fatal client error marker.
- Each captured page had no horizontal overflow at the capture width.
- The stock-detail screenshot was re-captured after the skeleton state disappeared (`skeletonCount=0`).

## Google Play Readiness

Current draft state:

- Basic screenshot requirements: six JPEG screenshots, each over 320 px on the short side, under 3840 px on the long side, and under 8 MB.
- Minimum count: met for phone screenshot drafts.
- Content: real app UI only; no fake device frames, no store badges, no ranking/price/download claims.

Still recommended before final upload:

- Capture final Android standalone/TWA screenshots at higher resolution, ideally 1080x1920 portrait, so the listing is eligible for more Google Play recommendation/promotion surfaces.
- Use the same six-screen story unless the logged-in watchlist flow is ready with a reviewer-safe account.
- Re-check text legibility at store thumbnail size.

## Feature Graphic Plan

Google Play requires a feature graphic to publish the store listing.

Required shape:

- `1024x500`
- JPEG or 24-bit PNG with no alpha
- Keep important content centered to avoid cutoff.
- Avoid ranking, price, promotion, Play Store badges, or time-sensitive claims.

Recommended ORNScore composition:

- Background: clean off-white or very light neutral, not pure white.
- Left: cropped real UI from `phone-01-home.jpg` or `phone-03-stock-detail.jpg`.
- Right: short Korean value line, for example `한국 주식 후보를 데이터로 좁히기`.
- Footer/small line: `투자 추천이 아닌 탐색 도구`.
- Avoid using "무료", "1위", "TOP", "수익률 보장", "지금 다운로드".

This slice did not generate a feature graphic because the final one should be a deliberate design asset, not an accidental browser screenshot crop.

## Apple App Store Status

The generated `532x946` JPEGs are not Apple App Store Connect upload assets. Apple requires screenshots that match supported device pixel sizes exactly.

For iPhone-first iOS work, prepare one of these sets from a real iOS simulator/device after the iOS wrapper path is decided:

- 6.9-inch display examples: `1260x2736`, `1290x2796`, or `1320x2868` portrait depending on the target device generation.
- 6.5-inch fallback: `1284x2778` or `1242x2688` portrait.
- 6.1-inch examples: `1179x2556`, `1170x2532`, `1125x2436`, or `1080x2340` portrait.

Do not upload the Google Play draft screenshots to App Store Connect.

## Manifest Screenshots Decision

Do not add `screenshots[]` to `src/app/manifest.ts` yet.

Reason:

- The current assets live under `docs/` as local evidence, not `public/` as final production assets.
- PWA manifest screenshots should be stable, public, and intentionally selected. Adding draft references would either create broken URLs or prematurely ship low-resolution listing drafts.

When final public screenshots are ready:

1. Copy final assets under `public/store/screenshots/`.
2. Add `screenshots` entries to `src/app/manifest.ts` with `src`, `sizes`, `type`, `form_factor: "narrow"`, and `label`.
3. Re-run `npm run app:check`, `npm run build`, and local `verify:local`.

## Next Local Slice

If continuing locally before owner console work, create a real 1024x500 feature-graphic source and export path. Keep it generated from actual ORNScore UI and conservative copy, then verify exact dimensions and no-alpha/format before considering it upload-ready.
