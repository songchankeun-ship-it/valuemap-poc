# ORNScore Real-Device App QA Checklist - 2026-07-12

Scope: manual real-device QA for the current PWA/TWA-ready web app. This checklist does not require Play Console submission, app signing changes, assetlinks publishing, app-store account work, deployment, or remote repository writes.

## Prerequisites

- Public site or local tunnel is reachable over HTTPS.
- Current app packaging gate is understood: `npm run app:check` passes with one expected external WAIT until real Android SHA-256 assetlinks data exists.
- Tester has one Android phone with Chrome installed.
- Optional later pass: iPhone Safari home-screen install. iOS native wrapper remains deferred.

## Android Chrome Install Flow

Use the public production URL when validating launch readiness. Use a local tunnel only for pre-release checks.

1. Open `https://ornscore.com/` in Android Chrome.
2. Confirm the header and first screen are readable without horizontal scrolling.
3. Open Chrome menu and choose app install/add-to-home-screen if available.
4. Install ORNScore.
5. Launch from the home-screen icon.
6. Confirm the app opens in standalone/full-screen app mode, not just a normal browser tab.
7. Confirm the app name and icon are recognizable on the launcher.

Pass condition: installable flow is available or Chrome gives a clear add-to-home-screen path; launched app keeps ORNScore identity and does not show browser UI as the primary surface.

## Core Route Pass

Run these in the installed app surface:

| Route | What to check | Pass condition |
| --- | --- | --- |
| `/` | Home summary, navigation, search entry | Main value proposition is visible and tappable controls fit. |
| `/stocks` | Search/filter list | Search and topic links work; no horizontal overflow. |
| `/stock/005930` | Stock detail | Summary reads first; compare/watchlist buttons are usable. |
| `/watchlist` | Empty/local state | Non-login/local-save guidance is calm and clear. |
| `/compare` | Empty and selected state | Empty guidance and compare tray do not overlap. |
| `/disclosures` | Disclosure list/cards | Type cards and caution copy are readable. |
| `/guide/metrics` | Methodology | Non-advisory framing is visible. |
| `/status` | Data status | source/date/verification sections are readable. |
| `/privacy` | Privacy/legal | contact email and analytics/privacy wording are present. |
| `/offline` | Offline guidance | Offline guidance appears without pretending data is cached. |

## Standalone Behavior

- Rotate portrait/landscape once and return to portrait.
- Tap the header navigation and back button.
- Open a stock detail from global search.
- Open a topic page from `/stocks`, then open one stock from that topic.
- Add and remove one watchlist item.
- Add and remove one compare item.
- Confirm toasts do not cover the next required action.
- Confirm safe-area/header spacing is acceptable around the phone status bar and gesture area.

## Login Return Check

Only run this if the test account is available.

1. From standalone app mode, open `/watchlist` or tap a login/start CTA.
2. Sign in.
3. Confirm the app returns to the intended page rather than a blank page or unrelated route.
4. Sign out or clear the session after testing.

Pass condition: auth return does not break standalone navigation. If OAuth provider restrictions appear, document the exact redirect/error screen and device/browser.

## Offline Check

1. Open the app online and visit `/offline`.
2. Turn on airplane mode.
3. Refresh or relaunch.
4. Confirm the product does not imply stale finance data is available.
5. Turn connectivity back on and reload `/status`.

Pass condition: failure state is honest and recoverable; no stale price/score cache is presented as fresh.

## Evidence To Capture

Capture screenshots or short screen recordings for:

- Home-screen icon after install.
- Standalone app launch first screen.
- `/stocks` mobile view.
- `/stock/005930` summary view.
- `/watchlist` empty/local state.
- `/compare` empty state.
- `/status` verification section.
- Any failed login or install prompt state.

## Known Owner-Only Gate

The real Android TWA verification still needs:

- Final package id, currently documented as `com.ornscore.app`.
- Real Play App Signing SHA-256 fingerprint or real signing keystore fingerprint.
- Generated `public/.well-known/assetlinks.json` from the real fingerprint.
- Re-run of `npm run app:check` showing zero external waits.

Do not publish placeholder assetlinks or claim Play Store readiness until those items are complete.
