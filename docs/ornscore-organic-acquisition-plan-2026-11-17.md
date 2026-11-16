# ORNScore organic acquisition plan

Date: 2026-11-17 (Asia/Seoul)
Decision window: next 30 days
Primary outcome: qualified search visits that continue from a topic or comparison page to a stock detail, comparison, or saved condition

## 1. Decision

Do not broaden promotion indiscriminately yet. ORNScore already has search impressions, but the largest exposed page is not earning clicks and Naver currently reports only a small indexed surface. The immediate sequence is:

1. Repair click-through rate on the high-impression low-PER intent.
2. Strengthen crawlable links among the nine topic pages.
3. Scale only comparison pages and topic pages that demonstrate real query demand.
4. Add a small number of relevant external mentions, each pointing to the best matching landing page rather than always linking to Home.
5. Review the same 30-day report before creating more indexable pages.

The product promise stays unchanged: no return forecast or target price. ORNScore compares evidence and shows the next verification order.

## 2. Verified baseline

Source: Naver Search Advisor, `https://ornscore.com`, recent 30 days, PC + Mobile, last updated 2026-11-15.

| Metric | Current |
| --- | ---: |
| Clicks | 8 |
| Impressions | 1,200 |
| Average CTR | 0.7% |
| Indexed pages reported in crawl status | 15 |
| Crawl-limited pages | 0 |
| Excluded pages | 0 |
| SEO diagnosis issues | 0 |
| External pages linking to ORNScore | 1 |
| Linking domain | `disquiet.io` |
| ORNScore pages linked from that domain | 64 |

Interpretation:

- This is not a pure awareness-zero problem. Naver is already showing ORNScore.
- There is no reported crawl restriction or SEO diagnosis defect.
- The main bottlenecks are low result-page selection, a narrow indexed surface, and weak domain diversity outside ORNScore.
- One Disquiet product page creates many links, but it is still only one referring page on one domain. More pages from the same domain are not equivalent to broader authority.

Google Search Console is not yet a usable measurement source. In the signed-in account, the `sc-domain:ornscore.com` property appears as unverified, so Google query and landing-page data must not be inferred from Naver data.

## 3. Highest-value query evidence

### Low-PER intent

The visible low-PER variants total at least 554 impressions and 1 click, approximately 0.18% CTR.

| Query variant | Clicks | Impressions | CTR |
| --- | ---: | ---: | ---: |
| `저 per 종목` | 0 | 440 | 0% |
| `저per` | 0 | 43 | 0% |
| `저per주식` | 0 | 21 | 0% |
| `저per주` | 0 | 16 | 0% |
| `저per종목` | 0 | 14 | 0% |
| `per 낮은 주식` | 0 | 10 | 0% |
| `저per 종목` | 0 | 9 | 0% |
| `저평가 per주식 종목` | 1 | 1 | 100% |

The corresponding landing page, `/topics/low-per-stocks`, received 652 impressions and 1 click (0.2% CTR). This is the first experiment because it has enough volume to measure and the user intent matches the existing product honestly.

### Comparison intent

The strongest landing page is `/compare/247540-vs-066970`: 203 impressions, 3 clicks, 1.5% CTR. Related visible queries include:

| Query | Clicks | Impressions | CTR |
| --- | ---: | ---: | ---: |
| `에코프로 에코프로비엠 비교` | 1 | 54 | 1.9% |
| `엘앤에프 에코프로 비교` | 1 | 7 | 14.3% |
| `에코프로 엘앤에프비교` | 0 | 16 | 0% |
| `에코프로 vs 에코프로비엠` | 0 | 13 | 0% |
| `에코프로 에코프로비교` | 0 | 10 | 0% |

Comparison pages fit ORNScore's differentiation better than generic score pages: they answer a concrete choice without pretending to forecast a winner. New pairs should be added only when the query data names both companies and the pair is supported by the public 138-stock universe.

### Other promising intents

- `/topics/undervalued-stocks`: 47 impressions, 2 clicks, 4.3% CTR.
- `/topics/high-roe-stocks`: 11 impressions, 1 click, 9.1% CTR.
- `/stock/352480`: 63 impressions, 1 click, 1.6% CTR.
- `/topics/shipbuilding-stocks`: 33 impressions, 0 clicks; `조선관련 주식 순위` added 7 impressions.
- Home: 70 impressions, 0 clicks.
- Metrics guide: 34 impressions, 0 clicks.

The undervalued and high-ROE pages should be preserved as controls. Do not rewrite every title at once; otherwise the next report cannot identify which change caused the result.

## 4. Landing-page priority

| Priority | Page | Evidence | Action |
| --- | --- | --- | --- |
| P0 | `/topics/low-per-stocks` | 652 impressions, 0.2% CTR | Match the exact `저PER 종목` language, state the 138-stock scope, and explain the next checks in the snippet and opening copy. |
| P0 | all `/topics/*` | only 15 pages reported indexed | Add server-rendered related-topic links so every topic is reachable from another topic without relying only on the sitemap. |
| P1 | `/compare/247540-vs-066970` | 203 impressions, 3 clicks | Keep stable, use as the comparison-format control, and distribute its direct URL when discussing the pair. |
| P1 | `/topics/undervalued-stocks` | 4.3% CTR | Preserve copy and create direct external mentions around valuation-check workflow. |
| P1 | `/topics/high-roe-stocks` | 9.1% CTR on small volume | Preserve copy; wait for more impressions before extrapolating. |
| P2 | `/topics/shipbuilding-stocks` | 33 impressions, 0 clicks | Revisit after the low-PER experiment or when query volume exceeds 100. |
| P2 | Home and metrics guide | 104 combined impressions, 0 clicks | Recheck after Naver refreshes the recently deployed evidence-first positioning. |

## 5. Implemented experiment

This batch changes only the P0 search surface:

- The low-PER title now begins with `저PER 종목 찾기` and states the live universe size.
- Its description and opening paragraph answer what is sorted, which values are excluded, and what to verify next.
- Exact spacing/case variants observed in Search Advisor are included in the page's keyword vocabulary without stuffing visible prose.
- Every topic page now renders four related-topic links, preferring the same category first.

No formula, public dataset, Metrics version, stock universe, authentication, workflow, package, or provider setting changes in this experiment.

## 6. Measurement contract

Check after at least 14 days and again after 30 days. Do not judge from daily noise.

| Metric | Baseline | 30-day decision threshold |
| --- | ---: | ---: |
| `/topics/low-per-stocks` CTR | 0.2% | at least 1.0% |
| `/topics/low-per-stocks` clicks | 1 | at least 6 at comparable impressions |
| Overall Naver CTR | 0.7% | at least 1.2% |
| Naver crawl-status indexed pages | 15 | at least 30 |
| External linking pages | 1 | at least 3 relevant pages across at least 2 domains |

Product-side quality checks:

- `topic_stock_open` from the low-PER topic should increase with clicks.
- Search visitors should reach a stock detail, comparison, or saved condition rather than bounce immediately.
- No page should imply that low PER alone means undervalued, safe, or likely to rise.

If impressions grow but CTR remains below 0.5%, revise the title/snippet once more. If CTR improves but downstream actions stay near zero, the next task is the landing-page answer and candidate-table flow, not more promotion.

## 7. Distribution rules

- Link to the page that answers the discussion: comparison URL for a pair, topic URL for a valuation screen, stock URL for one company.
- Lead with the method and next verification order, not a high score or expected return.
- Prefer one useful post or answer in a relevant context over repetitive link drops.
- Do not mass-generate thin stock pages or query variants. Finance is trust-sensitive, and every indexable page must add original, inspectable evidence.
- Do not buy traffic until one organic landing path shows both clicks and a downstream action.

## 8. Owner-only external step

Verify the Google Search Console domain property for `ornscore.com` in the correct Google account. This may require a DNS TXT record and is intentionally not performed as part of this local code batch. After verification and data accumulation, compare Google queries and landing pages with Naver before changing the next page.

Official reference points:

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google helpful, reliable, people-first content guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Naver content guidance: https://searchadvisor.naver.com/guide/content-basic
- Naver SEO report guidance: https://searchadvisor.naver.com/guide/report-seo
