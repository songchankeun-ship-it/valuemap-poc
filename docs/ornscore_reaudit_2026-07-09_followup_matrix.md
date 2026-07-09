# ORNScore Reaudit Follow-Up Matrix — 2026-07-09

Source: `C:\Users\dongy\.codex\attachments\9c3d882c-9747-480d-b596-2675efffad18\pasted-text.txt`

This matrix exists so follow-up agents do not silently drop items from the public reaudit.

## Completed Before This Slice

- Launch blocker: `145995` no longer displays as 삼양홀딩스; 삼양홀딩스 uses `000070`.
- Launch blocker: `/compare?stocks=...` renders initial comparison content from the shared URL and warns on invalid codes.
- Stock SEO descriptions no longer include volatile score/PER/PBR numbers.
- Tied stock-detail ranks show 공동/T- rank copy.
- Privacy page no longer uses current waitlist wording.
- Public DART status copy no longer exposes `DART_API_KEY`.

## Completed In This Slice

- Full current universe audit against KRX listing: 138 stocks checked, missing 0, name mismatches 0, preferred/SPAC/ETF/ETN name hits 0.
- Corrected 11 code-name mismatches in `scripts/seed_tickers.txt` and `public/data/stocks.json`: 에스엠, NC, iM금융지주, HJ중공업, 녹십자홀딩스, HS효성첨단소재, 비에이치아이, 현대무벡스, 아모레퍼시픽홀딩스, HD건설기계, 씨앤씨인터내셔널.
- `fetch_stock_data.py` now fails when seed names differ from KRX official names.
- `verify_metrics.py` now fails when `stocks.json` names differ from `seed_tickers.txt`.
- `/disclosures` now defaults to `분석 대상만`; `전체 시장` is an explicit widening choice.
- `/disclosures` separates `가격·점수 기준` from `공시 수집 기준`.
- Repeated disclosure actions now include company-specific aria labels for stock detail, DART source, watchlist toggle, and the explanation expander.

## Completed In Search/Discovery Slice

- Home hero now includes a large `GlobalSearch` affordance fed by the 138-stock universe and real theme list.
- `GlobalSearch` now supports header/hero variants, unique combobox/listbox IDs through `useId()`, and a stable `data-search-variant` marker for viewport checks.
- `StockSearchBox` now exposes the proper combobox role, list autocomplete, and unique listbox IDs.
- Discovery result cards now show full metric names (`추세`, `거래활성도`, `밸류`, `위험조정`) while dense table/legend abbreviations remain unchanged.

## Completed In Stock Detail Compression Slice

- Stock-detail hero mobile order is now name/price → priority score/ranks/representative signals → quick links → detailed conclusion card.
- Long score-vs-rank explanatory text is collapsed behind `점수·순위 기준` so the first screen prioritizes score, ranks, top strength, and first-check signal.
- Stock-detail header, priority card, conclusion card, and quick-link strip spacing/radius were compressed without changing scoring, ranks, price, disclosure, or data logic.
- Browser checks confirmed `/stock/005930` quick links are in the first viewport on 390x844 and 1366x900, with detailed education blocks lower on the page.

## Completed In Watchlist Routine Slice

- `/watchlist` empty state now hands off recent-viewed stocks: an actionable "최근 본 종목 이어담기" list (up to 4) with one-tap add replaces the old text-only pointer, so returning non-savers continue from what they browsed.
- Sample and recent-handoff rows now show a today score-delta chip (▲/▼N, composite delta only, hidden when 0) so the first-run screen reads as a live routine, not a static list.
- "내 현황" now shows a lightweight change summary for logged-out users with no saved symbols but recent views ("최근 본 종목 오늘 변화: 점수가 움직인 종목 M / N").
- All additions reuse existing `tickerToDelta`/`recentViews`/`addToWatchlist`; storage, migration, scoring, and `metricsVersion` unchanged. Wording stays neutral (참고 정보 · 매수·매도 추천 아님).

## Completed In Compare Context Slice

- `/compare` result view now opens with a "먼저 무엇을 비교하는지" frame: same-vs-mixed sector line + factual chips (업종, PER 범위, 최근 공시 신호 종 수, 데이터 점검 권장 종 수). Descriptive/neutral, no recommendation.
- New "최근 공시 신호 · 데이터 점검" section per compared symbol: recent DART signals (label · 접수일 · 방향, links to 원문) from `getRecentSignals(14)` (live→sample fallback), plus `getDataWarnings`/`isSuspect` flags. Graceful "최근 공시 신호 없음" / "이상값 점검 통과" fallbacks when data is absent.
- Empty-state preview and noscript list now advertise the disclosure/check context; the stale "공시 화면에서 이어서 확인" pointer is replaced.
- Display-only: reuses `recentSignals`/`disclosure-signals`/`dataQuality`; no collection, scoring, dataset, or `metricsVersion` change. `/compare` gets `revalidate = 1800` matching `/disclosures`.

## Completed In Backtest Framing Slice

- `/backtest` (real-data `BacktestClient`) now leads the header with a prominent "먼저 읽기 · 이 실험의 한계와 주의점 확인 →" CTA anchoring to `#backtest-limits` — the first obvious action reads limitations before results.
- `#backtest-limits` wraps the date-mismatch notice + risk/limitations list, so the CTA lands at the top of the old-vs-current caveat cluster (`scroll-mt-4`).
- The "마지막 리밸런싱 구성 예시" holdings list is now a `<details>` collapsed by default (summary keeps the `현재 추천 아님` badge + `펼쳐 보기` hint), so the pick-list no longer competes with the caveat message; content is still one tap away.
- Display-only: backtest calculations, dates, source data, and result numbers unchanged. No new copy about the old-vs-current relationship (already covered by `BacktestDateMismatchNotice` + amber badge + 3-date footer) to avoid overexplaining.

## Completed In Filter SEO Slice

- `/stocks` `generateMetadata` now computes a server-side `resultCount` (theme/sector/q axes, mirroring `matchesConfig`) and a `conservativeIndex` flag. Degenerate URLs get `robots: { index:false, follow:true }` + `canonical: /stocks`: zero-result combinations (nonexistent theme/sector/query), free-text `q` search (infinite URL space), 2+ filter dimensions, or any over-parameterized/unknown-param URL.
- Meaningful simple pages stay indexable with a self-referencing canonical: plain `/stocks` (`canonical: /stocks`), a single valid sector (`canonical: /stocks?sector=…`), and a single valid theme (`canonical: /stocks?theme=…`). Legacy `?theme=<sectorName>` URLs now consolidate onto the canonical `?sector=<sectorName>` form.
- Display/metadata-only: no change to stock data, filtering semantics, scoring, or `metricsVersion`. New gate `scripts/verify-stocks-seo.mjs` (`npm run verify:stocks-seo`) asserts the robots/canonical contract from live SSR HTML across 7 representative URLs.

## Completed In Chart Marker Layer Slice

- `StockPriceChart` now renders a non-invasive marker layer computed purely from the price points it already receives — no new data collection, API calls, props, or scoring change. Markers recompute per visible range via `useMemo` so chart performance and the summary-first flow are preserved.
- Implemented marker types (first meaningful set): **flow spike** (거래량 급증 — days ≥ 2.5× the trailing 20-business-day volume average, strongest 3 kept) and **drawdown** (고점 대비 저점 — deepest point below the running peak when ≤ −10%, 1 kept). Both are derivable from close/volume alone, so they render for representative stocks (verified 042700/139130/078930 show both, 005930/000660 show drawdown) and gracefully omit when nothing qualifies (n<5, no spike, drawdown > −10%).
- Mobile clutter guard: markers capped (≤3 flow + 1 drawdown), a legend appears only when markers exist, and a `지점 숨기기/보기` toggle lets users hide the layer. Markers live inside the existing fixed-height SVG viewBox, so they add no layout height and cannot overlap adjacent content; the legend row uses `flex-wrap`. Hovering a marker enriches the existing date/volume readout with its detail.

## Remaining Code Work
- Chart markers — remaining types: **score movement**, **DART filing**, and **3M warning** markers. These need date-aligned event data threaded into the chart (score history from Supabase `daily_scores`, disclosures from `/api/disclosures/[ticker]`, 3M surge/warning from `getDataWarnings`), unlike the price-derived flow/drawdown markers already shipped. The marker scaffold (`ChartMarker`/`MARKER_META`/marker layer + legend + toggle) is in place to extend; the text-based `StockEventTimeline` already surfaces score+disclosure events separately.

## External Or Owner-Gated Work

- Google Search Console: request re-indexing for home, stocks/discovery, disclosures, compare, and top stock pages after deploy.
- Legal review: confirm privacy handling for cross-border processors, retention, withdrawal/deletion, and notification opt-out matches the actual product behavior.
- Full backtest pipeline: automatic recalculation and point-in-time universe work remain a larger research/data task.

## Verification Notes

- KRX master audit was run locally through FinanceDataReader after the corrections and returned: `stocks 138 missing 0 mismatches 0 excluded_name_hits 0`.
- Seed audit returned: `seed 143 krx_name_mismatches 0`.
