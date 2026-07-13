# ORNScore Real-Device App QA Checklist

Created 2026-07-12. **Refined 2026-07-14** ([codex]) — added first-class **Keyboard Search**, **Contact/Support**, and **Safe-Area** sections; strengthened **Watchlist local-save persistence**; corrected the **offline honesty** note to match the code (no service worker is registered). Values below are pulled from source so the tester checks against reality, not guesses.

Scope: manual real-device QA for the current PWA/TWA-ready web app (the "app-like web experience"). This checklist does **not** require Play Console submission, app signing changes, assetlinks publishing, app-store account work, deployment, or remote repository writes. Automated coverage (SSR 200, anchors, invariants) already lives in `smoke:check` / `verify:routes`; this doc only covers the **real-device visual/interaction** gate that automation cannot reach.

Related runbooks (do not duplicate):
- `ornscore-real-device-390px-qa-2026-07-06.md` — per-route 390px pixel runbook (home/discovery/detail/status/price/login/watchlist).
- `ornscore-app-mode-mobile-qa-2026-07-11.md` — app-mode-only surfaces (`/about` `/offline` `/login` `/settings/notifications` `/privacy` `/terms`).

This checklist is organized around the eight app-like-experience areas the owner must sign off before store readiness.

## Prerequisites

- Public site or local tunnel is reachable over HTTPS (PWA install and `mailto:` need a real device browser).
- App packaging gate understood: `npm run app:check` passes with one expected external WAIT until real Android SHA-256 assetlinks data exists.
- One Android phone with Chrome. Test viewport reference: **390×844**.
- Optional later pass: iPhone Safari home-screen install. iOS native wrapper remains deferred.

---

## 1. Install / Open From Home Screen

Use the public production URL for launch readiness; a local tunnel only for pre-release checks.

1. Open `https://ornscore.com/` in Android Chrome.
2. First screen is readable with **no horizontal scrolling**.
3. Chrome menu → Install app / Add to Home screen is offered (manifest is served from `/manifest.webmanifest` via `src/app/manifest.ts`).
4. Install, then launch from the home-screen icon.
5. Home-screen identity matches the manifest:
   - Icon is the maskable ORNScore mark (`icon-512-maskable.png`), not a browser-screenshot tile.
   - Launcher label reads **오른스코어** (manifest `short_name`).
6. If offered, long-press the icon and confirm app shortcuts appear: **오늘 / 종목 / 공시** (manifest `shortcuts`).

Pass condition: an install / add-to-home-screen path is available, and the installed icon + name keep ORNScore identity.

## 2. Standalone Display

1. Launch from the home-screen icon (not from a browser tab).
2. App opens in **standalone / full-screen** mode (manifest `display: "standalone"`) — the Chrome address bar and tab UI are **not** the primary surface.
3. Orientation: manifest requests **portrait** (`orientation: "portrait"`). Rotate the phone to landscape once — confirm the app either stays portrait or, if the OS forces rotation, does not break the header/bottom-nav layout — then return to portrait.
4. Header stays sticky at the top; the mobile bottom nav (5 tabs) stays fixed at the bottom.
5. Back gesture / bottom-nav navigation moves between routes without dropping to a blank page or exposing browser chrome.

Pass condition: launched app behaves as an app surface, not a tab; navigation stays inside the standalone shell.

## 3. Safe Area (notch / status bar / gesture bar)

The app opts into `viewportFit: "cover"` (`src/app/layout.tsx`) and pads with `env(safe-area-inset-*)`. Verify on a notch/gesture-bar device:

- **Top**: header content clears the status bar / notch — header uses `pt-[env(safe-area-inset-top)]` (`AppHeader.tsx`). No title or logo hidden under the notch.
- **Bottom**: the fixed bottom nav clears the home-indicator / gesture bar — it reserves `pb-[env(safe-area-inset-bottom)]` (`MobileBottomNav.tsx`). Tab labels are not clipped by the gesture area.
- **Floating elements** sit above the safe area, not under it:
  - Watchlist "added" toast (`AddToWatchlistButton.tsx`, offset `bottom-[calc(3.5rem + env(safe-area-inset-bottom))]`).
  - Compare tray (`CompareTray.tsx`).
- Main scroll region reserves bottom space so the last row is not hidden behind the bottom nav (`pb-[calc(4rem + env(safe-area-inset-bottom))]`).

Pass condition: no content is hidden behind the notch, status bar, or gesture bar in standalone mode.

## 4. Keyboard Search (on-screen keyboard)

Search input is a `type="search"` combobox (`GlobalSearch.tsx`) in the header and hero. On a real device the on-screen keyboard is the main risk automation cannot see.

1. Tap the header search field — on-screen keyboard opens and the field stays visible (not hidden behind the keyboard).
2. Type a query (e.g. `삼성` / `005930`) — the results panel opens **above the keyboard** and is scrollable; result rows are tappable at ≥44px targets.
3. Layout does not jump or leave a large blank gap when the keyboard opens/closes; the fixed bottom nav does not overlap the open results panel awkwardly.
4. Enter / the keyboard "Go" key navigates to the highlighted result; arrow-key/selection state is intact.
5. Dismiss the keyboard (tap outside / back) — the panel closes cleanly and the field blurs. Pressing Esc/back on an **empty-result** panel still closes it (regression fixed in Task 158).
6. On `/stocks`, the list search/filter behaves the same and produces no horizontal overflow while typing.

Pass condition: search is fully usable with the on-screen keyboard up; no clipped input, no trapped panel, no layout break.

## 5. Watchlist Local Save (persistence)

Watchlist is saved locally for logged-out users under `localStorage` key `ornscore_watchlist` (`src/lib/watchlist.ts`; legacy `valuemap_watchlist` is migrated once).

1. Logged out, open `/stock/005930` and add it to the watchlist — confirmation toast appears (and, when logged out, the "track score/disclosure changes" one-line rationale).
2. Open `/watchlist` — the saved stock is listed; empty-state guidance is calm and non-login-gated.
3. Remove one item and use **undo** — the item returns.
4. **Persistence across relaunch**: fully close the standalone app and relaunch from the home-screen icon → the saved stock is still there (proves local persistence, not just in-memory).
5. Add/remove one compare item and confirm the compare tray and watchlist do not conflict.

Pass condition: local watchlist survives relaunch without an account; add/remove/undo all behave; no data loss on close.

## 6. Offline Fallback (honesty gate)

**Important — read before testing.** A service worker is **intentionally not registered** (deferred to avoid caching stale finance data; see `src/app/manifest.ts` and `app-roadmap.md`). Consequences for QA:

- The `/offline` route is a **static guidance page**, reachable while online. It is *not* served from a cache on a cold offline relaunch, because no SW is caching routes.
- So an installed PWA offline relaunch will show the platform's own offline error (Chrome/TWA), not the styled `/offline` page. The TWA wrapper's configured offline screen is an **owner gate**, not verifiable here.
- The single hard requirement: **nothing pretends stale finance data is available offline.**

Steps:
1. Online, visit `/offline` and confirm the copy is honest (network required; does not claim cached scores/prices exist).
2. Enable airplane mode, then refresh / relaunch.
3. Confirm no screen shows old prices/scores as if fresh; the failure state is honest and recoverable.
4. Turn connectivity back on, reload `/status`, and confirm data/date/verification sections load.

Pass condition: failure state is honest and recoverable; no stale price/score cache is presented as fresh. Record the exact offline screen (Chrome dino vs styled page) for the owner.

## 7. Login Boundary

Run only if a test account is available.

1. From standalone app mode, open `/watchlist` or tap a login/start CTA (`/login`).
2. Sign in (magic link or Kakao).
3. App returns to the intended page, not a blank page or unrelated route; the local watchlist merges into the account (migration keys `ornscore_watchlist_migrated`).
4. Sign out / clear the session after testing.

Pass condition: auth return does not break standalone navigation and does not lose the local watchlist. If OAuth provider restrictions appear (in-app-browser blocks, redirect errors), record the exact redirect/error screen + device/browser — provider config is an owner gate.

## 8. Contact / Support Path

There is no in-app contact form; support is by email. Verify the path a real user would take is reachable and functional on-device:

1. Reach the email from a legal/info route:
   - `/privacy` — `contact@ornscore.com` appears (data-subject request line + 연락처 line).
   - `/terms` — 제8조 (문의) links `contact@ornscore.com`.
2. Tap the `mailto:contact@ornscore.com` link — the device email composer opens with the address prefilled (this only works on a real device, not desktop headless).
3. Confirm the email is spelled `contact@ornscore.com` consistently (no typo, no placeholder).

Pass condition: a logged-out user can find and launch a working contact email from at least `/privacy` and `/terms`.

---

## Core Route Pass (quick regression sweep)

Run inside the installed app surface:

| Route | What to check | Pass condition |
| --- | --- | --- |
| `/` | Home summary, nav, search entry | Value proposition visible; tappable controls fit. |
| `/stocks` | Search/filter list | Search/topic links work; no horizontal overflow. |
| `/stock/005930` | Stock detail | Summary reads first; compare/watchlist buttons usable. |
| `/watchlist` | Empty/local state | Local-save guidance is calm and clear. |
| `/compare` | Empty and selected state | Empty guidance and compare tray do not overlap. |
| `/disclosures` | Disclosure list/cards | Type cards and caution copy readable. |
| `/guide/metrics` | Methodology | Non-advisory framing visible. |
| `/status` | Data status | source/date/verification readable. |
| `/privacy` | Privacy/legal | contact email + analytics/privacy wording present. |
| `/terms` | Terms | 제8조 문의 contact email present. |
| `/offline` | Offline guidance | Honest; does not pretend data is cached. |

## Evidence To Capture

- Home-screen icon after install (§1).
- Standalone launch first screen (§2).
- Notch/gesture-bar device showing header + bottom nav safe-area clearance (§3).
- Search with on-screen keyboard open + results panel (§4).
- `/watchlist` local state before and after relaunch (§5).
- Offline screen after airplane-mode relaunch — actual screen shown (§6).
- Any failed login / OAuth block state (§7).
- `mailto:` composer opened from `/privacy` (§8).

## Known Owner-Only Gate

Real Android TWA verification still needs (do not fake):

- Final package id, currently documented as `com.ornscore.app`.
- Real Play App Signing SHA-256 fingerprint (or real keystore fingerprint).
- Generated `public/.well-known/assetlinks.json` from the real fingerprint.
- Re-run of `npm run app:check` showing zero external waits.
- TWA offline-screen configuration (see §6) and real-device 390×844 pixel sign-off.

Do not publish placeholder assetlinks or claim Play Store readiness until those items are complete.
