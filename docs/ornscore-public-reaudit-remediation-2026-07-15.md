# ORNScore Public Reaudit Remediation Plan

- Date: 2026-07-15
- Source review: `C:\Users\dongy\OneDrive\바탕 화면\ornscore_site_reaudit_feedback_2026-07-15.md`
- Canonical workspace: `C:\dev\OrnScore`
- Goal: restore public trust by making every visible number, label, and limitation traceable to one calculation contract.

## 1. Decision

The reaudit is not a request for another broad visual redesign. Its highest-value findings are contract failures:

1. one concept is counted through different filters on the same page;
2. the score-history query discards dates and assumes the latest two rows are consecutive trading days;
3. the production metric uses volume while several public explanations still say turnover value;
4. a mixed relative score is described as absolute;
5. generated summaries are shown without enough provenance;
6. public status exposes implementation details but not the missing date a user needs;
7. stable search metadata, legal/data-rights records, and methodology evidence lag the product surface.

The batch therefore fixes trust contracts first, then interpretation and workflow, and only then adds validation infrastructure. No task may invent unavailable data to make a card look complete.

## 2. Baseline Audit

The following are confirmed gaps in the tested source, not copied assumptions from the feedback:

- `/today` computes `spikeCount`, `flowSurgeCount`, and the visible activity list through different filters.
- `getScoreChangesBatch` and `getMetricChangesBatch` keep only numeric values; comparison dates are not returned or validated.
- `scripts/compute_metrics.py` and `src/lib/metrics.ts` calculate trading activity from volume, while `scoreBasis.ts`, `homeSnapshot.ts`, and alert copy still refer to turnover value.
- public copy still contains `0~100 절대값`, `점수는 절대 해석`, and English equivalents.
- `/today` renders stored AI insight with headline/date but no constituent/source/calculation contract.
- public score-detail copy still labels the completion surface as data trust rather than input-data completeness.
- risk detail already exposes volatility and drawdown, and same-sector value already exists; these should be clarified and surfaced, not reimplemented as new scoring formulas.
- the previous first-run UX batch already simplified home and mobile discovery. This plan does not repeat that work.

## 3. Non-Negotiable Invariants

- Work only in the canonical repository and local AI Center task branches.
- Preserve the existing four score formulas, equal weights, `metricsVersion`, 138-stock universe, generated market data, DART collection, auth providers, scheduled jobs, and package dependencies unless a slice explicitly says otherwise.
- Do not change Supabase schema, RLS, provider settings, secrets, DNS, Search Console, hosting, app-store consoles, or outside accounts.
- Do not publish, push, deploy, request reindexing, or perform external legal/account actions in this batch.
- Do not claim legal clearance or data redistribution rights. Unknown means `unverified`, with an owner review item.
- Do not fabricate disclosure amounts, confidence, related filings, history dates, or theme provenance.
- Keep Korean and English public copy synchronized where both exist.
- Every implementation slice ends with a focused regression check, the repository's required gates, a local `[codex]` commit, and handoff updates.

## 4. Ordered Slices

### Slice A - One activity-surge object on Today (P0)

Create one typed activity-surge result that owns the filter, items, and count. Market status, briefing summary, and visible list must consume that same result. Remove the competing `flow >= 70` count from the activity-surge label or rename it if it represents a genuinely different concept.

Acceptance:

- one filter implementation;
- `count === items.length` for non-empty and zero states;
- the same count is rendered in every activity-surge location;
- a focused verifier fails if independent counting returns.

### Slice B - Date-aware score comparison basis (P0)

Return comparison dates with score and metric deltas. Classify each comparison against the stock's local market-date sequence as previous trading day, N trading days ago, recent stored data, or unavailable. Do not label two arbitrary stored rows as yesterday.

Acceptance:

- date-bearing result types;
- safe Korean/English labels based on the actual gap;
- no delta when the basis cannot be established safely;
- Today, stock detail, watchlist, and notification examples use the shared basis contract;
- tests include 1-day, skipped-day, unknown, mixed-date, and empty history cases.

### Slice C - User-facing status dimensions (P0)

Split public status into price freshness, score freshness, score-history continuity, financial completeness, disclosure scope, and theme/flow availability. Move internal implementation details to the existing protected admin status surface.

Acceptance:

- no GitHub workflow, table name, cron, or expected code-version detail on public `/status`;
- explicit dates and limited/attention states instead of one global green state;
- history continuity consumes Slice B's semantics where available;
- admin protection remains unchanged.

### Slice D - Trading activity means volume everywhere (P0)

Audit the six layers named by the reaudit: calculation input, data/API field semantics, guide, cards, detail factors/tooltips, and fixtures/verifiers. The current formula is volume, so public and developer wording must say volume. Generic persisted keys may remain for compatibility, but their semantics must be documented once.

Acceptance:

- no public trading-activity explanation calls the input turnover value;
- direction and investor identity remain explicitly out of scope;
- a focused contract verifier scans the agreed source surfaces.

### Slice E - Hide untraceable generated Today insight (P0)

Until a stored insight has typed provenance for sources, constituents, calculation time, and rule/model roles, do not fetch or render it on the public Today page. Preserve storage code for a future provenance-aware implementation.

Acceptance:

- no opaque generated summary on `/today`;
- no unnecessary insight fetch on that route;
- a verifier prevents accidental reintroduction without provenance fields.

### Slice F - Comparative score and input completeness language (P0)

Replace absolute-score claims with `0~100 comparative scale` language and clearly state that some metrics are relative to the current universe. Rename public data-trust labels to input-data completeness and state that completeness does not prove future performance or source accuracy.

Acceptance:

- guide, detail intro, priority card, score basis, tooltips, and English copy agree;
- no targeted absolute-score phrase remains;
- rank and score remain visibly distinct without claiming score independence from the universe.

### Slice G - Momentum regime, risk meaning, and sector context (P1)

Add deterministic momentum regime labels from existing 1/3/6-month returns, including long-term strength with short-term weakness. Rename the risk-adjusted surface to past return-to-volatility efficiency and keep absolute volatility/max drawdown adjacent. Make the already-computed same-sector value context easy to reach; do not change the composite formula.

Acceptance:

- contradictory short/long horizons are visible, not flattened into one positive sentence;
- high risk-adjusted score cannot read as a safety score;
- sector value remains a separate reference, not a new composite input;
- pure helper tests cover regime boundaries.

### Slice H - Stable stock SEO metadata (P0)

Remove changing price/score values from stock titles and descriptions. Keep stable ticker/name/analysis-topic metadata, canonical URLs, and controlled aliases for former company names. Audit sitemap `lastmod` behavior and filter/query indexing rules locally.

Acceptance:

- source verifier rejects dynamic price/score metadata;
- canonical/noindex rules remain deterministic;
- former names are aliases only, not the canonical display name;
- live reindexing remains an owner action.

### Slice I - Stock discovery density and terminology (P1)

Keep the prior mobile filter-sheet work. Change misleading `basic quality filter` wording to extreme-value exclusion, show 20 results initially, and provide an explicit finite continuation action. Keep search and result count above optional presets.

Acceptance:

- first render is bounded to 20 rows/cards;
- continuation is accessible and does not reset filters;
- zero-result recovery remains intact;
- no SEO-style filler paragraph displaces the workflow.

### Slice J - Compare start and auth CTA clarity (P1)

Simplify compare entry to first stock, second stock, recent stocks, same-sector examples, and watchlist selection. Remove or demote cross-sector presets without a comparison rationale. In the shared header, make the logged-out sync CTA and returning-user login action distinguishable rather than two names for the same destination.

Acceptance:

- one obvious empty-state start path;
- presets are same-sector or explain their rationale;
- local, logged-out compare behavior remains available;
- auth routes and provider behavior are unchanged.

### Slice K - Disclosure information hierarchy (P1)

Reduce repeated collection disclaimers and elevate available filing date, type, original link, correction status, and classification basis. Display amount/ratio, confidence, or related filing only when the source data actually provides it; otherwise omit the field rather than synthesize it.

Acceptance:

- `2건` cannot ambiguously mean both filings and categories;
- correction classification is deterministic from available metadata;
- original DART access remains prominent;
- tests cover missing optional fields and correction filings.

### Slice L - Privacy, terms, deletion, and data-rights record (P1/P2)

Align deletion/retention statements across privacy and data-deletion pages. Keep the current free-beta terms primary and move speculative paid-service policy out of the currently applicable terms. Add a data-rights matrix with source, access path, fields, display/redistribution status, attribution, retention, fallback, evidence link/version, review date, and owner action. Mark unknowns as unverified.

Acceptance:

- no invented legal entity, address, region, retention period, or license conclusion;
- immediate deletion and legally required exception wording no longer contradict;
- current free-beta conditions are easy to distinguish from future policy;
- the matrix separates KRX, DART, Naver/FDR, and Yahoo/yfinance.

### Slice M - Methodology research surface and honest backtest label (P2)

Rename the public lab to validation research and strengthen the banner that its historical experiment is not validation of the current composite. Add a deterministic local methodology audit for metric correlation, contribution, equal-weight alternatives, and one-metric ablation on available snapshots. Clearly list forward-return, cost, turnover, confidence-interval, sector-neutral, and out-of-sample evidence that cannot be produced from the present data.

Acceptance:

- no public claim that the existing backtest validates the current score;
- audit output is reproducible and labels cross-sectional analysis correctly;
- missing forward history fails closed or reports unavailable, never substitutes current data.

### Slice N - Final reaudit recertification (release remains separate)

Consolidate the new focused verifiers into a finite local reaudit command and run the complete local gate set. Verify public routes, status semantics, admin redirects, SEO contracts, mobile/desktop overflow where supported, and all P0 source contracts. Record owner-gated residuals separately.

Acceptance:

- TypeScript, metric verification, focused reaudit verifiers, diff check, replacement-character scan, build, and local production verification all pass;
- task handoff maps every reaudit item to completed, owner-gated, or deliberately deferred with a reason;
- no publication is performed by this batch.

## 5. Required Validation Per Slice

Minimum for every slice:

```text
npx tsc --noEmit
$env:PYTHONUTF8='1'; python scripts\verify_metrics.py
git diff --check
U+FFFD scan on edited files
```

For UI, routing, metadata, or public-copy changes also run:

```text
npm run build
npm run verify:local -- --base http://127.0.0.1:<free-port> --no-perf
```

Use only the temporary server/listener started by the task. Do not terminate broad `node.exe` processes.

## 6. Owner-Gated Residuals

The local queue can prepare evidence but cannot complete these external decisions:

- Search Console reindex requests and cache observation;
- legal review of investment-advice presentation and final operator details;
- commercial-use and redistribution clearance from each data provider;
- real Supabase session/OAuth transaction checks and account deletion execution;
- new database schema, RLS, retention jobs, or stored event tables;
- app-store console declarations and real-device store testing;
- public push/deployment/release approval.

## 7. Batch Completion Rule

The batch is complete when Slices A-N are locally completed with no pending approvals or failed runs, the worktree is clean, and the final handoff states exactly which external owner actions remain. Public release is a separate explicit decision after review.
