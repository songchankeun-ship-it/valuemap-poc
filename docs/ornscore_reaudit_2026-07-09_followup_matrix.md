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

## Remaining Code Work

- Global stock search prominence: add a larger home/header search affordance and consider mobile fixed search access.
- Discovery cards: use full metric names in card view while keeping compact abbreviations in dense table view.
- Stock detail compression: keep the first screen to name/price, priority score/rank, top strengths, key risks, and quick links before detailed education blocks.
- Watchlist empty state: add a stronger temporary/sample experience if the current sample preview still does not create enough first-run momentum.
- Compare table: add recent disclosure signals and warning flags; add a short “why compare these first” summary.
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
