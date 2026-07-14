// Typed boundary sketch for a FUTURE numeric owner traffic dashboard.
//
// WHAT THIS IS (and is NOT)
// -------------------------
// This module adds NO data collection, NO network calls, and NO new data model.
// It only fixes the *shape* of the summary a future in-admin dashboard would
// render, and the adapter interface a future provider must implement — e.g. a
// server-side Vercel Analytics API pull ("Option C" in
// docs/ornscore-admin-traffic-telemetry-plan.md §3). Until an owner wires such a
// provider (an owner gate: vendor token + new server route + retention policy),
// the default provider reports an explicit `not_configured` empty state, so a
// dashboard can render safely today WITHOUT ever making an outside call.
//
// Why pre-build the boundary now: the telemetry plan recommends Option C when the
// owner wants (A) login activity and (B) anonymous traffic on one admin screen.
// Fixing the result union + provider interface + funnel up front means that
// future integration is a single typed adapter implementation, not a redesign,
// and the "no live call today" empty state is a compile-time guarantee rather
// than prose.
//
// Design mirrors src/lib/routeAnalytics.ts + src/lib/clickAnalytics.ts:
//   - Only SAFE, already-public dimensions are ever named (routeKind, public
//     ticker/topic slug, fixed funnel event names). No PII, no raw text, no
//     email/query/message — same privacy line as the event map.
//   - Route buckets are DERIVED from ROUTE_KINDS (single source of truth) so a
//     newly added public route can't silently drift out of the dashboard
//     contract; scripts/verify-admin-traffic-metrics.ts enforces this.

import { ROUTE_KINDS, ROUTE_VIEW_EVENT } from "./routeAnalytics";

// Reporting windows a future dashboard would offer. Launch review leans on the
// 24h/72h windows (see the first-72h playbook); 7d/30d are for later trend.
export const TRAFFIC_METRIC_WINDOWS = ["24h", "72h", "7d", "30d"] as const;
export type TrafficMetricWindow = (typeof TRAFFIC_METRIC_WINDOWS)[number];

// One route-kind bucket with its numeric view count over the window. `routeKind`
// is always one of ROUTE_KINDS (see DASHBOARD_ROUTE_KINDS).
export type RouteViewMetric = {
  routeKind: string;
  views: number;
};

// A launch-funnel stage: an ordered step whose volume is read from one or more
// canonical events. Every name in `events` must exist in the analytics event map
// (docs/ornscore-analytics-event-map-2026-07-12.md) — the verifier asserts this.
export type FunnelStageMetric = {
  key: string;
  events: readonly string[];
  count: number;
};

// The full numeric payload a "ready" dashboard would render. All numbers are
// placeholders describing shape only — this module never populates them.
export type TrafficMetricsSummary = {
  window: TrafficMetricWindow;
  routeViewEvent: typeof ROUTE_VIEW_EVENT;
  routeViews: RouteViewMetric[];
  funnel: FunnelStageMetric[];
};

// Discriminated result union. `not_configured` is the current, local reality:
// no vendor provider is wired, so the dashboard shows an explicit empty state
// instead of a broken/absent call. `unavailable` is the transient failure branch
// a real provider would return on a vendor timeout/error (so the dashboard
// degrades to a message, never a crash).
export type TrafficMetricsResult =
  | { status: "ready"; summary: TrafficMetricsSummary }
  | { status: "not_configured"; reason: string }
  | { status: "unavailable"; reason: string };

// The adapter a future numeric dashboard depends on. A real implementation would
// pull aggregates server-side at request time and NOT self-store them (Option C:
// cache-only, no new Supabase table). Keeping this async and result-typed means
// the dashboard code can be written once against this interface today.
export interface TrafficMetricsProvider {
  readonly id: string;
  getSummary(window: TrafficMetricWindow): Promise<TrafficMetricsResult>;
}

// Canonical launch funnel — mirrors the /admin/traffic "출시 후 24–72시간" review
// order and docs/ornscore-launch-analytics-first-72h-playbook.md. Single typed
// source so the future dashboard, the admin page, and the playbook can't drift.
// Stage volumes read from these already-public event names (never their props).
export const FUNNEL_STAGE_DEFS = [
  { key: "entry", events: [ROUTE_VIEW_EVENT] },
  { key: "discover_to_detail", events: ["home_candidate_open", "search_result_open", "topic_stock_open"] },
  { key: "action_intent", events: ["compare_toggle", "watchlist_toggle"] },
  { key: "account_intent", events: ["auth_cta_click"] },
] as const;

// Flat set of every event name the funnel references (verified against the map).
export const FUNNEL_EVENT_NAMES: readonly string[] = FUNNEL_STAGE_DEFS.flatMap((s) => s.events);

// Every routeKind the dashboard must carry a bucket for — derived, not copied.
export const DASHBOARD_ROUTE_KINDS: readonly string[] = ROUTE_KINDS;

// The single reason string the default empty state reports, pointing operators
// at where the real numbers live today and what wiring the numeric view requires.
export const NOT_CONFIGURED_REASON =
  "No traffic-metrics provider is wired. Anonymous traffic lives in the external Vercel Analytics dashboard today; a numeric in-admin view is an owner gate (vendor API token + server route + retention policy — see docs/ornscore-admin-traffic-telemetry-plan.md Option C).";

// Default provider: always reports the not-configured empty state and makes ZERO
// network calls. The safe local default a dashboard binds to until an owner wires
// a real provider — so shipping the dashboard shell adds no outside dependency.
export const notConfiguredTrafficMetricsProvider: TrafficMetricsProvider = {
  id: "not-configured",
  async getSummary() {
    return { status: "not_configured", reason: NOT_CONFIGURED_REASON };
  },
};

// Narrow helper so dashboard code can branch to the numeric view vs the empty
// state without re-implementing the union check at every call site.
export function isTrafficMetricsReady(
  result: TrafficMetricsResult,
): result is Extract<TrafficMetricsResult, { status: "ready" }> {
  return result.status === "ready";
}
