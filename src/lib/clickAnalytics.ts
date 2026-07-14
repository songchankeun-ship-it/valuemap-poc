// Pure allow-list contract for the delegated `data-analytics-event` click events.
//
// This module has no React/DOM/window dependency so it can be unit-verified in
// isolation (see scripts/verify-click-analytics.ts). It mirrors the design of
// src/lib/routeAnalytics.ts: every documented click event is reduced to a small,
// fixed, public allow-list of property keys.
//
// AnalyticsEventTracker forwards a clicked element's `data-analytics-*` dataset
// to the analytics vendor. Without an allow-list, a stray attribute (e.g. an
// accidental `data-analytics-email`, `data-analytics-query`, or a free-form
// label) would leak. `sanitizeClickProps` drops any key not vouched for by the
// event's contract, so only fixed public attributes can ever be emitted.

export type ClickAnalyticsValue = string | number | boolean | null | undefined;
export type ClickAnalyticsProps = Record<string, ClickAnalyticsValue>;

// eventName -> the exact set of allowed public property keys.
//
// Keep this in lockstep with docs/ornscore-analytics-event-map-2026-07-12.md
// (one row per event) and with the `data-analytics-*` attributes actually placed
// in the components. The verifier asserts source usage never emits a key outside
// its event's list, and that no key names a sensitive concept (email, query,
// name, message, note, free-form text, ...).
//
// Only events wired through the DOM `data-analytics-event` delegation belong
// here. Client-only events emitted by direct `trackEvent()` calls (e.g.
// `compare_toggle`, `watchlist_toggle`, `search_result_open`) are sanitized at
// their call site and are intentionally out of scope for this contract.
export const CLICK_EVENT_PROP_KEYS: Record<string, readonly string[]> = {
  // Home funnel
  home_candidate_open: ["ticker", "rank", "slot"],
  home_mystocks_open: ["ticker", "source", "rank", "slot"],
  // Topic landing → explorer / detail
  topic_link_click: ["source", "topic"],
  topic_stock_open: ["topic", "ticker"],
  topic_all_stocks_click: ["topic"],
  topic_saved_filter_start: ["topic", "filtered"],
  // Compare intent
  compare_toast_open: ["ticker"],
  compare_tray_open: ["count"],
  // Watchlist intent
  watchlist_detail_open: ["ticker"],
  watchlist_toast_open: ["ticker"],
  watchlist_login_cta: ["ticker"],
  watchlist_recent_stock_open: ["ticker", "rank"],
  watchlist_recent_clear: ["count"],
  watchlist_recent_search_open: ["index", "count"],
  // Saved-filter routine
  saved_filter_empty_recent_search_open: ["index", "count"],
  saved_filter_empty_starter_open: ["kind"],
  saved_filter_notification_settings_open: ["count"],
  saved_filter_add_open: ["count"],
  // Stock detail recent-change evidence
  stock_recent_change_basis_open: ["ticker", "target"],
  stock_recent_change_card_open: ["ticker", "kind", "tone", "target"],
  stock_recent_change_priority_open: ["ticker", "kind", "tone", "target"],
  stock_recent_change_track_open: ["ticker", "target"],
  stock_recent_change_checklater_open: ["ticker", "target"],
  // Stock detail checklist
  stock_checklist_next_open: ["ticker", "step"],
  stock_checklist_routine_open: ["ticker"],
  stock_checklist_reset: ["ticker", "done", "total"],
  // Header auth CTA
  auth_cta_click: ["source", "hasNext", "path"],
};

// Substrings that must never appear in an allow-listed property key. This is a
// belt-and-suspenders guard against a future contract entry that would name a
// sensitive concept; the verifier fails the build if any key matches.
export const FORBIDDEN_PROP_KEY_SUBSTRINGS = [
  "email",
  "query",
  "message",
  "name",
  "note",
  "label",
  "text",
  "search",
  "address",
  "phone",
  "password",
  "token",
] as const;

/**
 * Reduce a delegated click event's raw dataset-derived props to the fixed,
 * public allow-list declared for that event.
 *
 * - Documented event: keep only keys present in `CLICK_EVENT_PROP_KEYS`.
 * - Unknown event: emit no props at all (the event name still counts, but no
 *   unvouched attribute rides along).
 *
 * The event name itself is never dropped here — navigation and event counting
 * are unaffected; only the property payload is narrowed.
 */
export function sanitizeClickProps(
  eventName: string,
  rawProps: ClickAnalyticsProps,
): ClickAnalyticsProps {
  const allowed = CLICK_EVENT_PROP_KEYS[eventName];
  if (!allowed) return {};

  const safe: ClickAnalyticsProps = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(rawProps, key)) {
      safe[key] = rawProps[key];
    }
  }
  return safe;
}
