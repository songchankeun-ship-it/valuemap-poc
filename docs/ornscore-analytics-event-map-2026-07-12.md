# ORNScore Analytics Event Map - 2026-07-12

Purpose: measure whether public launch traffic can move from discovery to actual product actions without adding a new vendor, account, or external configuration. The implementation uses the existing Vercel Analytics package already mounted in `src/app/layout.tsx`.

## Privacy Rules

- Do not send raw search text.
- Do not send report message text, email addresses, names, or free-form user input.
- Public identifiers such as stock tickers and topic slugs are allowed.
- Event tracking must never block navigation, form submission, watchlist saves, or compare actions.
- External analytics/account settings remain owner-only.

## Event Names

| Event | Source | Properties | Meaning |
| --- | --- | --- | --- |
| `route_view_public` | Root client analytics tracker | `routeKind`, `ticker`, `topic`, `hasQuery`, `hasFilters`, `compareCount` | Sanitized public route visit signal for launch review. Admin routes are excluded; raw search text, full URLs, and auth/account identifiers are not sent. |
| `search_result_open` | Global search result click/Enter | `source`, `resultType`, `ticker`, `theme`, `queryLength` | User found a stock/theme through autocomplete. |
| `search_view_all` | Global search "view all" row | `source`, `queryLength`, `resultCount` | User broadens autocomplete into `/stocks?q=...`. |
| `search_empty_open_stocks` | Global search empty state CTA | `source`, `queryLength`, `stockCount` | User searches something outside autocomplete and opens the explorer. |
| `home_candidate_open` | Home "오늘의 후보" card primary CTA | `ticker`, `rank`, `slot` | User opens stock detail from a home today-candidate card; only the public ticker, fixed rank, and layout slot (`featured`/`list`) are sent. |
| `topic_link_click` | `/stocks` topic links | `source`, `topic` | User enters a search-intent landing page. |
| `topic_stock_open` | `/topics/[slug]` stock links | `topic`, `ticker` | Topic page successfully drives stock-detail exploration. |
| `topic_all_stocks_click` | `/topics/[slug]` "전체 탐색" CTA | `topic` | User moves from landing page to broader explorer. |
| `topic_saved_filter_start` | `/topics/[slug]` saved-filter handoff CTA | `topic`, `filtered` | User moves from a topic landing page toward saving a reusable stock filter. |
| `compare_toggle` | Add/remove compare button | `action`, `ticker`, `compact` | User attempts to build a comparison set. |
| `compare_toast_open` | Compare toast link | `ticker` | User follows a compare add/remove toast to `/compare`. |
| `compare_tray_open` | Floating compare tray CTA | `count` | User opens `/compare` after collecting candidates. |
| `compare_tray_reset` | Floating compare tray reset | `count` | User clears a comparison set. |
| `watchlist_toggle` | Add/remove/undo watchlist button | `action`, `ticker`, `compact`, `loggedOut` | User saves or removes a watchlist candidate. |
| `watchlist_detail_open` | Stock detail saved-state CTA | `ticker` | User opens `/watchlist` from a stock that is already saved. |
| `watchlist_toast_open` | Watchlist toast link | `ticker` | User follows save toast to `/watchlist`. |
| `watchlist_login_cta` | Watchlist logged-out guidance | `ticker` | User sees local-save value and chooses login. |
| `watchlist_recent_stock_open` | `/watchlist` recent-view row | `ticker`, `rank` | User reopens a recently viewed stock from the routine page; stock names and raw browsing text are not sent. |
| `watchlist_recent_clear` | `/watchlist` recent-view clear button | `count` | User clears local recent-view history from the routine page; no tickers, names, or raw browsing text are sent. |
| `watchlist_recent_search_open` | `/watchlist` recent-search chip | `index`, `count` | User reopens `/stocks?q=...` from the routine page; raw search text is not sent. |
| `watchlist_csv_export` | `/watchlist` CSV export button | `count`, `loggedIn`, `sort` | User exports their current watchlist locally as a CSV file. |
| `watchlist_meta_update` | `/watchlist` local group/note controls | `field`, `ticker`, `hasValue`, `loggedIn` | User updates browser-local watchlist metadata; note text and custom labels are not sent. |
| `watchlist_group_filter_change` | `/watchlist` local group filter chips | `filter`, `count`, `loggedIn` | User narrows the visible watchlist by all/ungrouped/group; raw group labels are not sent. |
| `saved_filter_watchlist_open` | `/watchlist` saved-filter card | `count`, `hasQuery`, `hasSector`, `themeCount` | User opens `/stocks` from a saved filter; no saved-filter name or raw query is sent. |
| `saved_filter_watchlist_remove` | `/watchlist` saved-filter remove button | `count`, `hasQuery`, `hasSector`, `themeCount` | User removes a saved filter from the routine page; no saved-filter name or raw query is sent. |
| `saved_filter_watchlist_rename` | `/watchlist` saved-filter rename form | `count`, `hasQuery`, `hasSector`, `themeCount` | User renames a saved filter from the routine page; no saved-filter name or raw query is sent. |
| `saved_filter_empty_recent_search_open` | `/watchlist` saved-filter empty-state recent-search chip | `index`, `count` | User opens `/stocks?q=...` from a recent-search chip to create a saved filter; raw search text is not sent. |
| `saved_filter_empty_starter_open` | `/watchlist` saved-filter empty-state starter link | `kind` | User opens a starter discovery route when there are no saved filters or recent searches; no raw query text is sent. |
| `saved_filter_notification_settings_open` | `/watchlist` saved-filter header action | `count` | User opens notification settings from the saved-filter routine section; no saved-filter names, conditions, or raw query text are sent. |
| `saved_filter_add_open` | `/watchlist` saved-filter header action | `count` | User opens `/stocks` from the saved-filter routine section to add another condition; no saved-filter names, conditions, or raw query text are sent. |
| `stock_recent_change_basis_open` | Stock detail recent-change basis header link | `ticker`, `target` | User opens the score-basis section from the recent-change header; no score values, labels, or free-form text are sent. |
| `stock_recent_change_card_open` | Stock detail recent-change summary card | `ticker`, `kind`, `tone`, `target` | User opens one of the recent-change summary cards; no score values, labels, raw text, or free-form text are sent. |
| `stock_recent_change_priority_open` | Stock detail recent-change priority action | `ticker`, `kind`, `tone`, `target` | User follows the single prioritized recent-change evidence link; no score values, labels, or free-form text are sent. |
| `stock_recent_change_track_open` | Stock detail recent-change "관심 목록에서 변화 추적" CTA | `ticker`, `target` | User moves from the recent-change footer to `/watchlist` to track the change; only public ticker and fixed `target` (`watchlist`) are sent. |
| `stock_recent_change_checklater_open` | Stock detail recent-change "확인 체크리스트에 남기기" CTA | `ticker`, `target` | User jumps to the summary checklist to note the change for later; only public ticker and fixed `target` (`summary`) are sent. |
| `stock_checklist_next_open` | Stock detail checklist next-step CTA | `ticker`, `step` | User follows the next unchecked checklist item; only ticker and fixed checklist step id are sent. |
| `stock_checklist_routine_open` | Stock detail checklist completion CTA | `ticker` | User finishes the local stock checklist and opens the personal routine page. |
| `stock_checklist_reset` | Stock detail local checklist reset button | `ticker`, `done`, `total` | User clears local checklist progress for one stock; no checklist labels, notes, or free-form text are sent. |
| `auth_cta_click` | Header login/start links | `source`, `hasNext`, `path` | User begins account/login flow. |
| `report_data_issue_open` | Data issue form open | `ticker` | User starts a data quality report. |
| `report_data_issue_submit` | Data issue form submit | `category`, `ticker`, `hasEmail` | User submits a data quality report attempt. |
| `report_data_issue_result` | Data issue form result | `result`, `category`, `ticker` | Submission outcome without message/email content. |

## Implementation Notes

- `src/lib/clientAnalytics.ts` wraps `track()` and swallows analytics errors.
- `src/components/analytics/AnalyticsEventTracker.tsx` sends one sanitized `route_view_public` event per public route view and captures server-rendered links/buttons that opt in with `data-analytics-event`.
- Delegated click props pass through the allow-list `src/lib/clickAnalytics.ts` (`CLICK_EVENT_PROP_KEYS`, `sanitizeClickProps`) before reaching the vendor: only keys listed for that event are emitted, so a stray `data-analytics-*` attribute (email, raw query, free-form label) can never leak. It is verified offline by `npm run verify:click-analytics`, which also scans component source to fail on any `data-analytics-event`/attribute that has no contract entry.

### Adding or changing a delegated click event (checklist)

Any link/button that opts in with `data-analytics-event` fans out to four places — update all four so the offline gate stays green:

1. **Component** — add `data-analytics-event="<name>"` plus only fixed, public `data-analytics-*` attributes (public identifiers like `ticker`/`topic`/`kind`/`target`, fixed enums, counts/ranks/booleans). Never bind raw search text, emails, names, notes, or other free-form input.
2. **Contract** — add/adjust the `<name>: [...keys]` row in `CLICK_EVENT_PROP_KEYS` (`src/lib/clickAnalytics.ts`). Kebab attribute suffixes map to camelCase keys (`data-analytics-has-next` → `hasNext`). Keys must avoid the sensitive-substring denylist (`FORBIDDEN_PROP_KEY_SUBSTRINGS`).
3. **Event map** — add/adjust the matching row in the Event Names table above.
4. **Verify** — run `npm run verify:click-analytics` (source usage ↔ contract ↔ denylist) and `npx tsc --noEmit`. The runtime guard drops any attribute not in the contract even if a step is missed, but the verifier is what catches the drift at build time.
- The `route_view_public` path→safe-props classification lives in the pure helper `src/lib/routeAnalytics.ts` (`classifyRoute`, `ROUTE_CLASSIFIERS`, `SAFE_ROUTE_PROP_KEYS`). It is verified offline by `npm run verify:route-analytics` and mapped path-by-path in `docs/ornscore-route-analytics-classification-2026-07-14.md`. Update all four (helper, verify case, classification doc, the row above) when adding or renaming a route.
- Client-only flows call `trackEvent()` directly where the product action result is known.
- The first review target after deploy is not raw traffic volume. It is funnel shape: topic page -> stock detail, search -> stock detail, compare/watchlist intent, and login CTA intent.
- `src/app/admin/traffic/page.tsx` is an owner-only (`requireAdminAccess`, `robots: noindex`) operator overview that restates these event groups compactly and links to the Vercel Analytics dashboard. It calls no outside API and stores nothing; it is display-only. When an event is added/renamed here, update its `EVENT_GROUPS` list too.
- The first 24–72 hour review order (which surfaces to open, which events matter first, healthy vs concerning shapes, and what a direct in-app numeric dashboard would still require from the owner) is written in `docs/ornscore-launch-analytics-first-72h-playbook.md`. `src/app/admin/traffic/page.tsx` carries a compact inline summary of that order and cites the doc as the canonical source.
