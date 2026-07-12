# ORNScore App/PWA Readiness Re-Audit - 2026-07-12

Scope: local-only readiness re-check after the public SEO topic pages and analytics event instrumentation. This does not perform Play Console work, app signing, account setup, assetlinks publishing, store submission, deployment, or remote changes.

## Current Result

`npm run app:check` passed on 2026-07-12 with the same expected external gate:

```text
app packaging check passed (1 external gate waiting)
WAIT public/.well-known/assetlinks.json not generated yet; needs real Android package + SHA-256 fingerprint
```

Meaning:

- PWA icon assets remain valid.
- `src/app/manifest.ts` still exposes the Korean app name, standalone display, `/` start URL/scope, `ko-KR`, and shortcuts for Today, Stocks, and Disclosures.
- iOS home-screen metadata and safe-area handling remain present.
- Offline guidance remains intentionally informational.
- Service worker registration remains intentionally absent to avoid stale finance data caches.
- Android TWA remains the first store path.
- iOS native wrapper remains deferred until owner Mac/Xcode/Apple Developer work is available.
- The only blocker is owner-provided Android package/signing information for real domain verification.

## Owner-Only Gate

Do not generate or commit `public/.well-known/assetlinks.json` until the owner has the real Android app-signing SHA-256 fingerprint.

Owner path:

1. Confirm package id, currently documented as `com.ornscore.app`.
2. Get the Play App Signing SHA-256 fingerprint from Play Console or the real signing keystore.
3. Preview:

```powershell
npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<REAL_SHA256>" --dry-run
```

4. Generate:

```powershell
npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<REAL_SHA256>"
```

5. Re-run `npm run app:check`; only then should the external gate become `0`.

## What Not To Do Automatically

- Do not create or modify Play Console accounts.
- Do not pay developer registration fees.
- Do not create app signing keys or upload keys.
- Do not publish placeholder assetlinks.
- Do not add a service worker without a fresh data-cache policy decision.
- Do not claim Play Store or App Store release before actual owner submission and approval.

## Next Local Follow-Up

The next useful local slice is a small app-install QA checklist page or doc for real-device manual testing: Android Chrome install prompt, standalone launch, safe-area/header, login return, `/stocks`, `/stock/005930`, `/watchlist`, `/compare`, `/offline`, and `/privacy`.
