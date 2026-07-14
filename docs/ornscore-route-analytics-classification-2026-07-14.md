# ORNScore `route_view_public` Classification Map — 2026-07-14

Purpose: give future agents a single, verifiable view of **which public path emits
which safe analytics properties**, so the sanitized route signal can be extended
without accidentally leaking raw input.

Source of truth: `src/lib/routeAnalytics.ts` (pure, no React/DOM). The tracker
component `src/components/analytics/AnalyticsEventTracker.tsx` just imports
`classifyRoute()` + `ROUTE_VIEW_EVENT` and fires one event per public route view.

## Safe property allow-list

`SAFE_ROUTE_PROP_KEYS` is the **only** set of keys `route_view_public` may emit:

`routeKind`, `ticker`, `topic`, `hasQuery`, `hasFilters`, `compareCount`

The verification script asserts no classifier can produce a key outside this list.
Ticker and topic are public identifiers (path segments); the boolean/count props
only report **presence or size**, never the raw value.

## Path → routeKind → safe props

| Path pattern | `routeKind` | Extra safe props | Notes |
| --- | --- | --- | --- |
| `/` | `home` | — | |
| `/stocks` | `stocks` | `hasQuery`, `hasFilters` | `hasQuery` = `q` present; `hasFilters` = any of `sector`/`themes`/`market`/`sort` present. Raw query text is **not** sent. |
| `/stock/:ticker` | `stock_detail` | `ticker` | Public ticker path segment only. |
| `/topics/:slug` | `topic` | `topic` | Public topic slug only. |
| `/compare` | `compare` | `compareCount` | Count of comma-separated `stocks` entries; raw list not sent. |
| `/watchlist` | `watchlist` | — | |
| `/today` | `today` | — | |
| `/disclosures` | `disclosures` | — | |
| `/backtest` | `backtest` | — | |
| `/guide/metrics` | `metrics_guide` | — | |
| `/login` | `login` | `hasQuery` | `hasQuery` = `next` or `error` present; the redirect target/URL is **not** sent. |
| `/pricing` | `pricing` | — | |
| `/about` | `about` | — | |
| `/status` | `status` | — | |
| any other public path | `other_public` | — | Fallback so unmapped routes still count without leaking the path. |
| `/admin/**` | *(not tracked)* | — | `classifyRoute()` returns `null`; operations surface is never tracked. |

## What is never sent

- Raw search text (`q=…`), report/free-form input, email or account identifiers.
- Full URLs, redirect targets (`next=…`), or query values of any kind.
- Operations/admin paths (`/admin/**` → `null`).

## Verify

```
npm run verify:route-analytics     # tsx scripts/verify-route-analytics.ts
```

The script imports the real helper and asserts: (1) each representative path maps
to the expected props, (2) every emitted key is in `SAFE_ROUTE_PROP_KEYS`, (3) a
privacy stress query (`?q=…secret…&email=…&ref=https://…`) never echoes into the
emitted values, and (4) every `routeKind` is covered by a test case. It runs
offline (no server, no network) and exits non-zero on any failure.

**When you add or rename a route classifier**, update: the `ROUTE_CLASSIFIERS`
table in `src/lib/routeAnalytics.ts`, a case in `scripts/verify-route-analytics.ts`
(coverage check will fail otherwise), this table, and the `route_view_public` row
in `docs/ornscore-analytics-event-map-2026-07-12.md`.
