# ORNScore Growth Sprint 2 - 2026-11-17

## Decision

Sprint 2 strengthens one existing loop instead of opening another channel:

`campaign entry -> stock detail -> compare/save -> return -> share`

The goal is to make the next useful action obvious, make return visits more
valuable, and make each acquisition source measurable without inventing traffic
numbers. This sprint does not change score formulas, the public dataset, the
138-stock universe, Metrics 2.4, authentication, workflows, or provider/runtime
configuration.

## Product Changes

1. **Campaign and outcome contract**
   - The owner dashboard can receive the existing allow-listed campaign counts.
   - Four decision outcomes are fixed: compare, save, return, and share.
   - The page renders zero only when a verified payload says zero. It does not
     call a provider or fabricate a numeric dashboard.
2. **Contextual comparison**
   - After two distinct stock details are viewed within seven days, the current
     stock page offers a direct comparison with the most recent peer.
   - `stock_recent_compare_open` sends only two public tickers.
3. **Useful return routine**
   - Completing a watchlist check stores a browser-local versioned snapshot.
   - The next check can explain new items, rounded score changes, and signal
     changes. The snapshot is bounded to 100 six-digit tickers.
4. **Share previews that carry evidence**
   - Stock, curated comparison, and topic routes generate their own 1200x630
     PNG with current route data and a non-advisory disclaimer.
   - Local Pretendard files prevent Korean glyph failures in server-generated
     images. The bundled font remains under SIL Open Font License 1.1.
5. **Release protection**
   - A focused offline contract test covers comparison selection, snapshot
     parsing/diffing, analytics vocabulary, route-owned OG images, and font
     licensing.
   - A live gate fetches all three OG families and verifies HTTP 200, PNG
     content type/signature, minimum payload size, and exact 1200x630 size.

## Measurement Contract

| Outcome | Included events | Interpretation |
| --- | --- | --- |
| Compare | `compare_toggle`, `stock_recent_compare_open` | A visitor starts a side-by-side decision flow. |
| Save | `watchlist_toggle` | A visitor saves or changes a candidate for later review. |
| Return | `watchlist_routine_complete` | A visitor completes the repeat-review routine. |
| Share | `stock_share`, `compare_share` | A visitor deliberately distributes evidence. |

These are event totals, not unique people and not conversion rates. Campaign
attribution uses only the fixed `route_view_public.campaign` allow-list. Raw
queries, names, notes, emails, URLs, and free-form text remain excluded.

## Privacy And Storage

- Recent-view comparison history and watchlist snapshots stay in browser local
  storage. They are not sent as analytics payloads.
- Analytics receives only fixed enums, booleans/counts, and public tickers.
- The sprint adds no cookie, account field, external vendor, or server-side
  personal-history store.

## Release And Review

1. Run `npm run build` with the normal deployment environment.
2. Start that exact build locally and run
   `npm run release:preflight -- --base <local-base> --no-perf`.
3. Fast-forward the three local growth commits only after the owner approves
   the exact commit list and production impact.
4. Verify the deployed SHA, the three OG routes, stock-detail mobile layout,
   and the standard route-health suite.
5. Read campaign and outcome evidence after a meaningful measurement window;
   do not add a third sprint merely because the first days are quiet.

The owner-only external action remains publication or paid distribution. This
repository work neither posts content nor changes Vercel, search-console, or
analytics account settings.
