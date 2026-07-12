# ORNScore OG/Twitter Share Image

Scope: local-only public social share image preparation. This folder does not deploy, submit to a store, change account settings, alter external services, or publish release metadata by itself.

## Public Output

```text
public/social/ornscore-og-1200x630.jpg
```

This is the public image referenced by the root/home metadata and generic public-page `openGraph.images`.

## Source

```text
docs/store-assets/2026-07-12/social-share/generate-og-share.py
```

The generator uses the real ORNScore UI screenshot:

```text
docs/store-assets/2026-07-12/google-play-draft/phone-03-stock-detail.jpg
```

## Visible Copy

- `한국 주식 후보를 데이터로 좁히기`
- `점수 근거 · DART 공시 · 데이터 기준일을 한 화면에서 확인합니다.`
- `투자 추천 아님`
- `공개 데이터 기반 종목 탐색`

The image intentionally avoids ranking, return, target-price, free, discount, download, or store-badge claims.

## Validation

Local validation result:

```text
public/social/ornscore-og-1200x630.jpg
format=JPEG
mode=RGB
size=1200x630
bytes=112923
alpha=False
```

`npm run app:check` also validates the JPEG header, RGB component count, exact dimensions, file size, and metadata references.
