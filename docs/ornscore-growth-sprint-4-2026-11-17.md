# ORNScore Growth Sprint 4 - 2026-11-17

## Decision

Sprint 4 improves the highest-evidence activation path already available:

`search-intent topic -> bounded comparison -> stock evidence/save`

The 2026-11-15 Naver baseline showed that topic pages already receive search
impressions. This sprint does not open another acquisition channel. It reduces
the work between arriving on a topic page and starting a useful product action.

## Product Change

- Every topic page deterministically selects the first three distinct valid
  six-digit tickers from its existing sorted candidate list.
- When at least two valid candidates exist, the primary action opens those
  candidates in the existing interactive comparison.
- The prior saved-filter action remains available but is visually secondary.
- Curated pair pages now identify the existing handoff into interactive compare
  as a measurable comparison action.
- Copy says the candidates are the first displayed rows, not recommendations or
  expected winners.

## Measurement Contract

Two delegated events were added:

| Event | Safe properties | Meaning |
| --- | --- | --- |
| `topic_compare_start` | `topic`, `count` | A topic visitor starts a bounded two/three-stock comparison. |
| `compare_curated_interactive_open` | `count` | A curated-pair visitor continues into the adjustable comparison. |

Both events count toward `action_intent` and the independent `compare` growth
outcome. Sprint 3 adds only the allow-listed same-tab campaign enum. Individual
topic CTA tickers, pair slugs, URLs, referrers, and free-form values are not sent
by these events.

## Decision Rule

After a real provider is approved and connected:

1. If topic entries exist and `topic_compare_start` stays near zero, revisit the
   topic promise and candidate explanation before adding more pages.
2. If comparison starts rise but detail/save actions do not, improve the
   comparison-to-evidence handoff instead of buying more traffic.
3. Add another acquisition channel only after one current topic or campaign has
   a visible downstream action path.

## Frozen Boundaries

Public data, Metrics 2.4, the 138-stock universe, score formulas, topic ranking,
auth, workflows, dependencies, provider/runtime values, hosting, and outside
accounts remain unchanged. No post, paid campaign, search submission, or
analytics-provider configuration was performed.

## Verification

- `npm run test:growth-sprint-4`
- `npm run verify:click-analytics`
- `npm run verify:admin-traffic-metrics`
- `npx tsc --noEmit`
- Next production build: 194/194 pages
- Release preflight: 20/20
- Local route health: 6/6
- Dynamic OG live gate: 3/3
- Desktop 1280px and mobile 390px topic CTA: visible, no document overflow
- Topic CTA navigation: three valid candidates rendered in `/compare`
