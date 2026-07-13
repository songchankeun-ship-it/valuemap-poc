# ORNScore Play Console Action Pack - 2026-07-13

Purpose: one-page owner action sheet for moving ORNScore from the live web/PWA state toward the first Android Google Play listing. This does not create a Play Console app, upload assets, submit declarations, generate signing keys, publish `assetlinks.json`, push, deploy, or change account settings.

## Current Launch State

- Live web app: `https://ornscore.com`
- Public contact email: `contact@ornscore.com`
- Privacy policy: `https://ornscore.com/privacy`
- Terms: `https://ornscore.com/terms`
- Data/account deletion URL: `https://ornscore.com/data-deletion`
- Android first path: TWA, default package id `com.ornscore.app`
- Local readiness: PWA manifest/icons/store draft screenshots/feature graphic/listing copy are prepared.
- Known remaining hard gate: real Play app-signing SHA-256 fingerprint for `assetlinks.json`.

## Copy Into Play Console

### App Name

```text
오른스코어
```

### Short Description

```text
한국 주식 후보를 점수·공시·재무 지표로 빠르게 좁히는 탐색 도구
```

### Full Description

```text
오른스코어는 한국 개인 투자자가 오늘 어떤 종목부터 살펴볼지 빠르게 좁힐 수 있도록 돕는 데이터 기반 주식 탐색 도구입니다.

추세, 거래활성도, 밸류, 위험조정 네 가지 자체 지표와 PER, PBR, ROE, 배당수익률, DART 공시 신호를 한 화면에서 함께 볼 수 있습니다. 종목 상세에서는 점수 근거, 데이터 품질, 공시 링크, 업종 비교, 관심 종목 저장을 확인할 수 있습니다.

주요 기능

- 오늘의 후보 종목과 시장 브리핑
- 종목 탐색, 필터, 비교
- 종목별 점수 근거와 초보자 해석
- DART 공시 신호와 원문 링크
- 관심 종목 저장과 로그인 기반 동기화
- 데이터 기준일, 산식 버전, 데이터 한계 공개

오른스코어는 투자 추천이나 매수·매도 권유를 제공하지 않습니다. 모든 점수와 신호는 공개 데이터와 자체 산식에 따른 참고 정보이며, 최종 투자 판단과 책임은 사용자 본인에게 있습니다.
```

### Store Details

| Field | Value |
| --- | --- |
| Category | Finance |
| Website | `https://ornscore.com` |
| Developer email | `contact@ornscore.com` |
| Privacy policy | `https://ornscore.com/privacy` |
| Data deletion URL | `https://ornscore.com/data-deletion` |
| Phone | Leave blank unless the owner wants it public. |

## Review Notes

```text
ORNScore is a Korean stock data exploration tool. It provides public-market reference data, score explanations, DART disclosure links, watchlist storage, and comparison views.

It does not provide investment advice, buy/sell recommendations, brokerage, trading execution, personal loans, payments, cryptocurrency wallets/exchanges, gambling, or paid in-app purchases.

Most public pages can be reviewed without logging in:
- https://ornscore.com/
- https://ornscore.com/stocks
- https://ornscore.com/stock/005930
- https://ornscore.com/disclosures
- https://ornscore.com/compare
- https://ornscore.com/status
- https://ornscore.com/privacy
- https://ornscore.com/terms

Some account features, such as synced watchlist data and notification settings, require sign-in. If Google reviewers require a logged-in test path, the owner will provide a dedicated reviewer account separately in Play Console. Do not store reviewer credentials in the repository.
```

## App Content Answers To Recheck Manually

These are owner-console answers, not automatic submissions.

| Area | Current ORNScore position |
| --- | --- |
| Ads | No ad network or ad display in the current product. |
| Target audience | Not made for children or families. Finance/data exploration for general adult users. |
| News app | No. ORNScore is not a news publisher. |
| Restricted access | Public pages are open; synced watchlist and notification settings require login. |
| Financial features | Finance-related reference data only. No trading, brokerage, loan, payment, insurance, crypto wallet/exchange, or personalized financial advice. |
| Monetization | No paid app, in-app purchase, subscription, or paid feature in the current app. |
| Data safety | Mirror `https://ornscore.com/privacy`; do not under-disclose login/account/hosting/email/analytics data. |

If Play Console gives a financial-feature explanation box, use:

```text
ORNScore provides public Korean stock reference data, screening signals, DART disclosure links, and watchlist/comparison tools for research prioritization. It does not execute trades, manage user portfolios, provide personalized financial advice, offer loans, process payments, sell insurance, or provide cryptocurrency wallet/exchange functionality.
```

## Assets Already Prepared

| Asset | Path |
| --- | --- |
| App icon 512 | `public/icon-512.png` |
| Launcher icon 192 | `public/icon-192.png` |
| Maskable icon | `public/icon-512-maskable.png` |
| Apple touch icon | `public/apple-touch-icon.png` |
| Google Play screenshot drafts | `docs/store-assets/2026-07-12/google-play-draft/` |
| Google Play feature graphic draft | `docs/store-assets/2026-07-12/google-play-feature-graphic/feature-graphic-google-play-1024x500.jpg` |
| Public share image | `public/social/ornscore-og-1200x630.jpg` |

Before final upload, owner/design should review screenshots and the feature graphic. If possible, recapture final Android standalone/TWA screenshots at higher resolution after the TWA shell is built.

## What The Owner Must Do In Console

1. Finish Play Developer account/payment/address/profile verification.
2. Create the app as an Android app, not a game.
3. Use package id `com.ornscore.app` unless the owner deliberately chooses a final alternate before app creation.
4. Enable/use Play App Signing.
5. After app creation, open Play Console -> App integrity -> App signing key certificate.
6. Copy the **app-signing key SHA-256** fingerprint, not the upload-key fingerprint.
7. Send the package id and app-signing SHA-256 back to Codex.

## Send Back To Codex

```text
package id: com.ornscore.app
app-signing SHA-256: <AA:BB:... real 32-byte fingerprint from Play Console>
upload-key SHA-256, optional: <for reference only>
Play account verification status: complete / pending / blocked
```

Then Codex can run:

```powershell
npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<real app-signing SHA-256>" --dry-run
npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<real app-signing SHA-256>"
npm run app:check
```

Only after that should `public/.well-known/assetlinks.json` be committed and deployed.

## No-Go

- Do not generate placeholder `assetlinks.json`.
- Do not use the upload-key SHA-256 if Play App Signing provides a separate app-signing SHA-256.
- Do not add Play Store badges or "available on Google Play" copy before the listing is live.
- Do not put reviewer credentials in the repository.
- Do not claim investment recommendation, guaranteed returns, trading execution, or portfolio management.

## Related Detailed Docs

- `docs/google-play-listing-worksheet-2026-07-12.md`
- `docs/app-store-submission-pack.md`
- `docs/ornscore-store-release-preflight-2026-07-12.md`
- `docs/ornscore-android-twa-owner-checklist.md`
- `docs/ornscore-android-assetlinks-owner-kit.md`
