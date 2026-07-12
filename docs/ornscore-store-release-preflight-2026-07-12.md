# 오른스코어 스토어 출시 프리플라이트 (2026-07-12)

Scope: this is a local handoff checklist for the Android TWA / store-submission path. It does not create a Play Console app, upload assets, submit declarations, generate signing keys, publish `assetlinks.json`, deploy, push, or change account/remote state.

Use this after the local asset and listing-prep work, before doing any owner-only console action.

## 1. Completed Local Prep

| Area | Status | Evidence |
|---|---:|---|
| App/PWA packaging checks | Ready except real Android `assetlinks.json` | `npm run app:check` passes with 1 expected external WAIT |
| Google Play listing copy | Draft ready | `docs/google-play-listing-worksheet-2026-07-12.md` |
| Store submission background | Draft ready | `docs/app-store-submission-pack.md` |
| Data/account deletion URL | Public route ready | `https://ornscore.com/data-deletion`, source route `/data-deletion` |
| Store draft screenshots | Local draft ready | `docs/store-assets/2026-07-12/google-play-draft/` |
| Google Play feature graphic | Draft ready | `docs/store-assets/2026-07-12/google-play-feature-graphic/feature-graphic-google-play-1024x500.jpg` |
| OG/Twitter share image | Ready in public assets | `public/social/ornscore-og-1200x630.jpg` |
| Store visual asset pack | Draft/evidence ready | `docs/ornscore-store-visual-assets-pack-2026-07-12.md` |
| Android package decision | Default locked, owner final confirm still required | `com.ornscore.app`, see `docs/ornscore-android-twa-owner-checklist.md` |
| Assetlinks owner kit | Procedure ready | `docs/ornscore-android-assetlinks-owner-kit.md` |

## 2. Owner-Only Gates

These are not automation tasks until the owner provides the real external inputs or explicitly approves a release action.

| Gate | Owner input needed | Automation rule |
|---|---|---|
| Play Developer account | payment/address/profile verification | Do not perform account/payment/profile changes. |
| Package id final confirmation | `com.ornscore.app` or a final alternate before app creation | Do not invent or change package id. |
| App signing SHA-256 | real Play app-signing key SHA-256 fingerprint | Do not generate placeholder `assetlinks.json`. |
| `assetlinks.json` | final package id + real app-signing SHA-256 | Only run `npm run app:assetlinks` after real values are supplied. |
| Final store screenshots | real standalone/TWA or device captures | Do not add `manifest.screenshots[]` until stable public screenshots exist. |
| Feature graphic approval | owner/design approval of current draft | Do not upload to Play Console automatically. |
| Reviewer/test access | test account or review path if required | Owner provides credentials/path; do not create secrets in docs. |
| Data safety / financial forms | owner confirmation of actual collection and policies | Drafts are guidance only; owner submits. |
| Public deployment | explicit owner approval | Do not push/deploy/promote from this checklist alone. |

## 3. No-Go Rules

- Do not commit fake or placeholder `public/.well-known/assetlinks.json`.
- Do not use upload-key SHA-256 where Play app-signing SHA-256 is required.
- Do not add Play/App Store badges or "available on store" copy before the app is actually live.
- Do not add store `screenshots[]` manifest entries that point to draft, local-only, or non-public files.
- Do not claim investment recommendation, return guarantee, ranking certainty, or trade execution.
- Do not reintroduce AI/provider claims unless the public feature and privacy policy are updated together.
- Do not change scoring formulas, generated stock data, DART collection, auth providers, or billing copy as part of store packaging.

## 4. Local Verification Before Any Release

Run these from `C:\Users\dongy\OneDrive\바탕 화면\valuemap-poc` after the owner-only asset/signing inputs are present and before requesting a public release.

```powershell
git status --short
npm run app:check
npx tsc --noEmit
$env:PYTHONUTF8='1'; $env:PYTHONIOENCODING='utf-8'; python scripts\verify_metrics.py
npm run build
git diff --check
```

If a local production server is started for route checks, stop only the exact listener process for that port afterward.

Recommended local release smoke once a prod server is up:

```powershell
npm run verify:local -- --base http://127.0.0.1:<port> --no-perf
```

After an approved public deployment:

```powershell
npm run verify:local -- --base https://ornscore.com --no-perf
```

## 5. Decision Tree

1. If the owner has not completed Play account/payment/address/profile verification: stop at documentation and local prep.
2. If the owner has not provided real app-signing SHA-256: do not create `assetlinks.json`.
3. If final screenshots are not ready: keep draft screenshots in docs only and keep `manifest.screenshots[]` empty.
4. If all owner inputs are ready: generate real `assetlinks.json`, run the local gates, then request explicit push/deploy approval.
5. If public deployment is approved and completed: run live `verify:local`, confirm `https://ornscore.com/.well-known/assetlinks.json` if generated, and update Search Console/sitemap only as an owner-approved external action.

## 6. Next Automation Entry

Safe local next slice:

- Review this preflight against the current repository state after any owner-provided Play Console values arrive.
- If no owner external inputs are available, do not keep polishing store-console docs endlessly; move to product work or wait for screenshots/signing/account data.

Owner-unblocked next slice:

- With final package id + real app-signing SHA-256, run:

```powershell
npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<real SHA-256>" --dry-run
npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<real SHA-256>"
npm run app:check
```

Then commit the real `public/.well-known/assetlinks.json` only if `app:check` passes and the owner approves the release path.
