// Pure view-model derivations for the owner-only /admin/traffic numeric dashboard
// shell (built on the TrafficMetricsProvider contract in ./adminTrafficMetrics).
//
// WHAT THIS IS
// -----------
// The dashboard shell renders whatever a TrafficMetricsProvider returns. When a
// provider reports `ready`, the shell must turn the raw summary (route-view
// buckets + funnel stage counts) into the three things an operator reads during
// the first-72h launch review: (1) summary totals, (2) funnel CONVERSION ratios,
// (3) a compact cross-window comparison of funnel SHAPE. Those derivations are
// isolated here as pure functions so they can be unit-verified without React/DOM
// (scripts/verify-admin-traffic-view.ts) and so the page component stays a thin
// renderer.
//
// TRUTHFULNESS RULES (no invented values)
//   - Every number is derived ONLY from the provider's summary counts. This
//     module never fabricates, back-fills, or defaults a missing count.
//   - A ratio whose denominator is 0 is `null` ("no basis to compute"), NEVER 0.
//     The renderer shows `null` as "—", so 0/0 can never masquerade as "0%".
//   - Cross-window comparison compares entry-SHARE (a ratio), not raw magnitude:
//     the reporting windows differ in length (24h vs 72h), so comparing totals
//     directly would mislead. Comparing funnel shape is the honest read.

import type {
  RouteViewMetric,
  TrafficMetricWindow,
  TrafficMetricsSummary,
} from "./adminTrafficMetrics";

// A conversion rate in [0, ∞), or `null` when it cannot be computed truthfully
// (non-finite input or a zero/negative denominator — divide-by-zero). Returning
// `null` instead of 0 keeps "no basis to compute" distinct from a real "0%".
export function conversionRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator <= 0) return null;
  return numerator / denominator;
}

// One funnel stage with its two conversion reads. Both rates are `null` for the
// entry stage (nothing precedes it) and wherever the base count is 0.
export type FunnelStageView = {
  key: string;
  count: number;
  isEntry: boolean;
  // count / previous stage count — the step-to-step drop-off.
  stepRate: number | null;
  // count / entry stage count — the share of entries reaching this stage.
  entryRate: number | null;
};

// The full derived view for one reporting window.
export type TrafficSummaryView = {
  window: TrafficMetricWindow;
  // Sum of every route-view bucket over the window.
  totalRouteViews: number;
  // Route buckets sorted by views desc (routeKind asc for ties). Zero-view
  // buckets are kept — an honest 0, not hidden.
  routeViews: RouteViewMetric[];
  // The funnel entry stage count (first stage), the denominator for entryRate.
  entryCount: number;
  stages: FunnelStageView[];
};

// Derive the view model from a ready summary. Pure: same input → same output,
// no wall-clock, no network, no mutation of the input.
export function toTrafficSummaryView(summary: TrafficMetricsSummary): TrafficSummaryView {
  const totalRouteViews = summary.routeViews.reduce((sum, rv) => sum + rv.views, 0);
  const routeViews = [...summary.routeViews].sort(
    (a, b) => b.views - a.views || a.routeKind.localeCompare(b.routeKind),
  );
  const entryCount = summary.funnel.length > 0 ? summary.funnel[0].count : 0;
  const stages: FunnelStageView[] = summary.funnel.map((stage, i) => {
    const isEntry = i === 0;
    const prevCount = i > 0 ? summary.funnel[i - 1].count : 0;
    return {
      key: stage.key,
      count: stage.count,
      isEntry,
      stepRate: isEntry ? null : conversionRate(stage.count, prevCount),
      entryRate: isEntry ? null : conversionRate(stage.count, entryCount),
    };
  });
  return { window: summary.window, totalRouteViews, routeViews, entryCount, stages };
}

// One row of the compact cross-window comparison: a funnel stage's entry-share
// under each window. Either side is `null` when that window lacks the stage or
// its entry count is 0.
export type WindowComparisonRow = {
  key: string;
  primaryRate: number | null;
  comparisonRate: number | null;
};

// Align two derived views stage-by-stage into a compact comparison of funnel
// SHAPE (entry-share per stage). Stage order follows the primary view, then any
// primary-absent stages from the comparison view appended in their own order.
// The entry stage (entryRate null on both sides) is intentionally kept so the
// table row set matches the funnel; the renderer shows its rate as "—" (base).
export function buildWindowComparison(
  primary: TrafficSummaryView,
  comparison: TrafficSummaryView,
): WindowComparisonRow[] {
  const byKey = new Map<string, WindowComparisonRow>();
  const order: string[] = [];
  const ensure = (key: string): WindowComparisonRow => {
    let row = byKey.get(key);
    if (!row) {
      row = { key, primaryRate: null, comparisonRate: null };
      byKey.set(key, row);
      order.push(key);
    }
    return row;
  };
  for (const stage of primary.stages) ensure(stage.key).primaryRate = stage.entryRate;
  for (const stage of comparison.stages) ensure(stage.key).comparisonRate = stage.entryRate;
  return order.map((key) => byKey.get(key)!);
}
