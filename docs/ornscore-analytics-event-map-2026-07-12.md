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
| `search_result_open` | Global search result click/Enter | `source`, `resultType`, `ticker`, `theme`, `queryLength` | User found a stock/theme through autocomplete. |
| `search_view_all` | Global search "view all" row | `source`, `queryLength`, `resultCount` | User broadens autocomplete into `/stocks?q=...`. |
| `search_empty_open_stocks` | Global search empty state CTA | `source`, `queryLength`, `stockCount` | User searches something outside autocomplete and opens the explorer. |
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
| `watchlist_csv_export` | `/watchlist` CSV export button | `count`, `loggedIn`, `sort` | User exports their current watchlist locally as a CSV file. |
| `watchlist_meta_update` | `/watchlist` local group/note controls | `field`, `ticker`, `hasValue`, `loggedIn` | User updates browser-local watchlist metadata; note text and custom labels are not sent. |
| `watchlist_group_filter_change` | `/watchlist` local group filter chips | `filter`, `count`, `loggedIn` | User narrows the visible watchlist by all/ungrouped/group; raw group labels are not sent. |
| `saved_filter_watchlist_open` | `/watchlist` saved-filter card | `count`, `hasQuery`, `hasSector`, `themeCount` | User opens `/stocks` from a saved filter; no saved-filter name or raw query is sent. |
| `saved_filter_watchlist_remove` | `/watchlist` saved-filter remove button | `count`, `hasQuery`, `hasSector`, `themeCount` | User removes a saved filter from the routine page; no saved-filter name or raw query is sent. |
| `saved_filter_watchlist_rename` | `/watchlist` saved-filter rename form | `count`, `hasQuery`, `hasSector`, `themeCount` | User renames a saved filter from the routine page; no saved-filter name or raw query is sent. |
| `saved_filter_empty_recent_search_open` | `/watchlist` saved-filter empty-state recent-search chip | `index`, `count` | User opens `/stocks?q=...` from a recent-search chip to create a saved filter; raw search text is not sent. |
| `saved_filter_empty_starter_open` | `/watchlist` saved-filter empty-state starter link | `kind` | User opens a starter discovery route when there are no saved filters or recent searches; no raw query text is sent. |
| `saved_filter_notification_settings_open` | `/watchlist` saved-filter header action | `count` | User opens notification settings from the saved-filter routine section; no saved-filter names, conditions, or raw query text are sent. |
| `stock_recent_change_basis_open` | Stock detail recent-change basis header link | `ticker`, `target` | User opens the score-basis section from the recent-change header; no score values, labels, or free-form text are sent. |
| `stock_recent_change_card_open` | Stock detail recent-change summary card | `ticker`, `kind`, `tone`, `target` | User opens one of the recent-change summary cards; no score values, labels, raw text, or free-form text are sent. |
| `stock_recent_change_priority_open` | Stock detail recent-change priority action | `ticker`, `kind`, `tone`, `target` | User follows the single prioritized recent-change evidence link; no score values, labels, or free-form text are sent. |
| `stock_checklist_next_open` | Stock detail checklist next-step CTA | `ticker`, `step` | User follows the next unchecked checklist item; only ticker and fixed checklist step id are sent. |
| `stock_checklist_routine_open` | Stock detail checklist completion CTA | `ticker` | User finishes the local stock checklist and opens the personal routine page. |
| `auth_cta_click` | Header login/start links | `source`, `hasNext`, `path` | User begins account/login flow. |
| `report_data_issue_open` | Data issue form open | `ticker` | User starts a data quality report. |
| `report_data_issue_submit` | Data issue form submit | `category`, `ticker`, `hasEmail` | User submits a data quality report attempt. |
| `report_data_issue_result` | Data issue form result | `result`, `category`, `ticker` | Submission outcome without message/email content. |

## Implementation Notes

- `src/lib/clientAnalytics.ts` wraps `track()` and swallows analytics errors.
- `src/components/analytics/AnalyticsEventTracker.tsx` captures server-rendered links/buttons that opt in with `data-analytics-event`.
- Client-only flows call `trackEvent()` directly where the product action result is known.
- The first review target after deploy is not raw traffic volume. It is funnel shape: topic page -> stock detail, search -> stock detail, compare/watchlist intent, and login CTA intent.
