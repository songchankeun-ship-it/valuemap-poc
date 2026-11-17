# ORNScore Growth Sprint 1 — 2026-11-17

## Decision

This sprint is one measurable loop, not five unrelated improvements:

`discover -> understand -> compare/save -> return -> share -> new visit`

Canonical Korean value proposition:

> 오른스코어는 전망 대신 숫자로 오늘 먼저 볼 종목을 줄여줍니다.

The sprint does not change the 138-stock universe, public Metrics 2.4, formulas,
data rights posture, authentication, providers, schedules, packages, hosting, or
outside account settings. It does not auto-publish content or make investment
recommendations.

## 14-day outcome

Review at day 14 and again at day 30 because Naver Search Advisor reports with
roughly a one-week delay.

| Layer | 14-day target | Evidence |
| --- | ---: | --- |
| Qualified entry | 100 public route views from search-intent pages, `ref=threads`, or `ref=share` | Vercel `route_view_public`; Naver Search Advisor |
| Activation | 20 stock-detail opens and 10 compare/watchlist intents | `home_candidate_open`, `search_result_open`, `topic_stock_open`, `compare_toggle`, `watchlist_toggle` |
| Return habit | 5 completed watchlist reviews | `watchlist_routine_complete` |
| Referral | 5 share actions and 3 resulting share-attributed visits | `stock_share`, `compare_share`, `route_view_public(campaign=share)` |

These are event counts, not people. ORNScore deliberately does not add a user
identifier to anonymous analytics.

## 1. One-sentence reason to use ORNScore

The home H1 now states the user outcome directly. Supporting copy owns the
method (historical price, volume, value, risk-adjusted metrics, and disclosures)
and the safety boundary (no future-return or upside-probability prediction).

Use the same short sentence in profiles and outreach. Do not rotate the core
claim during this sprint; only hooks and examples change.

## 2. Three repeatable content formats

Generate a fresh, deterministic packet from the current public data:

```powershell
cd C:\dev\OrnScore-ops-20261116
npm run growth:content
```

The command prints drafts only. A human reviews and posts them.

1. **Neutral comparison**: one curated A-vs-B pair, the largest metric contrast,
   its limitation, and the stable comparison URL.
2. **Screen then check**: three positive low-PER candidates followed by the
   required checks (earnings durability, sector context, recent disclosures).
3. **Activity change**: three stocks with the largest recent/20-day volume ratio,
   followed by the reason-check reminder. Activity is never framed as upside.

Every generated link uses the fixed `ref=threads` campaign. The generator reads
the existing public snapshot and writes nothing.

## 3. Two acquisition channels only

### Channel A — Naver web search

Why: this is the only channel with measured intent already. The 2026-11-15
30-day baseline was 1,200 impressions, 8 clicks, and 0.7% CTR. The low-PER topic
alone had 652 impressions but only one click, so it is a real demand signal with
a weak selection rate, not a hypothetical channel.

For 14 days:

- Keep the existing low-PER, undervalued, high-ROE, and comparison pages useful
  and stable. Do not create thin keyword variants.
- Review page/query CTR at day 14 and day 30. Prioritize pages with impressions
  and weak CTR before creating new pages.
- Measure downstream detail/compare/watchlist actions, not rankings alone.

Official basis: [Naver exposure/click reporting](https://searchadvisor.naver.com/guide/report-expose-ctr)
and [content quality guidance](https://searchadvisor.naver.com/guide/content-basic).
Naver explicitly recommends useful, brand-relevant content and warns against
unrelated popular keywords or spam-like repetition.

### Channel B — Threads operator account

Why: it supports text, links, and native link-click insights, so the three
evidence-first formats can be tested without making a personal blog or posting
promotional links into communities with unclear self-promotion rules.

For 14 days:

- Publish six reviewed posts: each of the three formats twice.
- Use one finding, one limitation, and one next check per post. Put the link at
  the end. Do not paste the same copy into replies or mass-comment.
- Reply only when someone asks about the data or method. No price targets,
  probabilities, buy/sell calls, or urgency language.
- Compare Threads link clicks with ORNScore `campaign=threads` route entries.

Official basis: Meta states that Threads posts can include links and that
Insights reports visits to links shared in profiles or posts:
[Threads introduction](https://about.fb.com/news/2023/07/introducing-threads-new-app-text-sharing/)
and [Threads link insights](https://about.fb.com/news/2025/03/new-threads-features-more-personalized-experience-you-control/).

Disquiet remains a profile/backlink, not a weekly posting channel. GeekNews,
personal Naver Blog, and finance communities are out of Sprint 1 so effort is not
spread across audiences with weaker fit or unclear promotional norms.

## 4. Watchlist return loop

The watchlist already summarizes score/disclosure changes. Sprint 1 adds a local
review check-in:

- shows how many saved stocks have a visible change;
- stores only the last completion timestamp in the browser;
- emits `watchlist_routine_complete` with counts only;
- keeps the action useful without login, email, or a new database table.

This is the return promise: open ORNScore, review what changed, inspect only the
few stocks that need evidence, and mark the review complete.

## 5. Share and attribution loop

Stock details, interactive comparisons, and curated comparison pages now share
links carrying the fixed `ref=share` marker. The product records:

- `stock_share(method, ticker)`;
- `compare_share(method, count, surface)`;
- resulting `route_view_public(campaign=share)` entries;
- curated comparison entries as `routeKind=compare_pair` without sending the
  pair string.

This separates “someone pressed share” from “the shared link brought a visit.”
No names, free-form copy, full URLs, or account identifiers are sent.

## Operating cadence

| Day | Work |
| --- | --- |
| 1 | Record Vercel/Naver baseline. Generate packet. Post neutral comparison. |
| 3 | Post low-PER screen-and-check. Answer method questions only. |
| 5 | Post activity-change format. Inspect `threads` and `share` entries. |
| 8 | Regenerate from the latest data. Post second neutral comparison. |
| 10 | Post second screen-and-check. Check activation events, not likes. |
| 12 | Post second activity-change. Stop any hook attracting only price-prediction requests. |
| 14 | Review the funnel and choose one channel/format to double down on. |
| 30 | Read the delayed Naver result and decide whether another intent page is justified. |

## Stop and double-down rules

- Pause a Threads format after two posts if it produces zero attributed visits.
- Do not add another channel during the 14 days.
- Double down on a format only when it produces both entries and a downstream
  detail/compare/watchlist action.
- A high-impression page with weak CTR earns a title/description experiment. A
  zero-impression idea does not earn more engineering time yet.
- Likes, follower count, and pageviews without product action are diagnostics,
  not the sprint's success metric.

## Owner-only external steps

The repository work stops before publication. The owner decides whether to:

1. review and post each generated Threads draft;
2. inspect Threads link insights;
3. inspect Vercel custom events;
4. read the day-14/day-30 Naver Search Advisor report.

No account creation, post submission, DNS/search-console change, paid campaign,
or outside-service action is authorized by this document.
