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

## Remaining Code Work
- Backtest lab: make “read limitations first” the first CTA and collapse the latest rebalance example by default.
- Filter SEO: set canonical/noindex rules for zero-result and highly parameterized `/stocks` filter combinations.
- Chart markers: add score move, DART filing, flow spike, 3M warning, and drawdown markers as a later chart slice.

## External Or Owner-Gated Work

- Google Search Console: request re-indexing for home, stocks/discovery, disclosures, compare, and top stock pages after deploy.
- Legal review: confirm privacy handling for cross-border processors, retention, withdrawal/deletion, and notification opt-out matches the actual product behavior.
- Full backtest pipeline: automatic recalculation and point-in-time universe work remain a larger research/data task.

## Verification Notes

- KRX master audit was run locally through FinanceDataReader after the corrections and returned: `stocks 138 missing 0 mismatches 0 excluded_name_hits 0`.
- Seed audit returned: `seed 143 krx_name_mismatches 0`.
