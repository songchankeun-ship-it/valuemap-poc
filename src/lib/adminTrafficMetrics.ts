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

// -----------------------------------------------------------------------------
// Fixture-backed provider + safety guard
// -----------------------------------------------------------------------------
// The default provider above proves "a dashboard can render with no live call".
// The pieces below prove the *other* half of the contract: that when a provider
// DOES return numbers, the exact shape a future dashboard binds to is (a) bounded
// to the declared reporting windows, (b) structurally pinned to the analytics
// sources of truth, and (c) carries NO free-form field a user identifier could
// ride in. They add no collection and no network call — a fixture provider is the
// deterministic stand-in a real Option-C adapter (server-side Vercel pull) must
// later satisfy, and the test surface for the dashboard's ready/empty branches.

const TRAFFIC_METRIC_WINDOW_SET: ReadonlySet<string> = new Set(TRAFFIC_METRIC_WINDOWS);

// Runtime bound check: a window value arriving from an untyped edge (query param,
// stored preference) is confirmed to be one of the declared windows before use.
export function isTrafficMetricWindow(value: string): value is TrafficMetricWindow {
  return TRAFFIC_METRIC_WINDOW_SET.has(value);
}

// Canonical funnel stage keys, derived (not copied) from the stage defs.
export const FUNNEL_STAGE_KEYS: readonly string[] = FUNNEL_STAGE_DEFS.map((s) => s.key);

// The CLOSED public vocabulary every string in a summary must be drawn from.
// A summary has no free-form text field by design; this set is the machine-checkable
// proof of that: window enums + the fixed route-view event + public route kinds +
// funnel stage keys + already-public event names. Any string outside it is treated
// as a potential identifier leak and rejected (fail closed).
export const SAFE_SUMMARY_VOCABULARY: ReadonlySet<string> = new Set<string>([
  ...TRAFFIC_METRIC_WINDOWS,
  ROUTE_VIEW_EVENT,
  ...DASHBOARD_ROUTE_KINDS,
  ...FUNNEL_STAGE_KEYS,
  ...FUNNEL_EVENT_NAMES,
]);

// Build a summary whose route buckets and funnel stages are derived from the
// single-source contracts, so the structure cannot drift from ROUTE_KINDS /
// FUNNEL_STAGE_DEFS. Only the numeric counts vary — everything else is pinned.
// Missing counts default to 0 (a bucket a window simply had no views for).
export function buildTrafficMetricsSummary(
  window: TrafficMetricWindow,
  routeViewCounts: Readonly<Record<string, number>> = {},
  funnelCounts: Readonly<Record<string, number>> = {},
): TrafficMetricsSummary {
  return {
    window,
    routeViewEvent: ROUTE_VIEW_EVENT,
    routeViews: DASHBOARD_ROUTE_KINDS.map((routeKind) => ({
      routeKind,
      views: routeViewCounts[routeKind] ?? 0,
    })),
    funnel: FUNNEL_STAGE_DEFS.map((stage) => ({
      key: stage.key,
      events: stage.events,
      count: funnelCounts[stage.key] ?? 0,
    })),
  };
}

function isCount(n: unknown): boolean {
  return typeof n === "number" && Number.isFinite(n) && Number.isInteger(n) && n >= 0;
}

// Gather every STRING primitive a summary carries. Counts (numbers) are ignored;
// only strings could carry an identifier, and all of them must be vocabulary.
function collectSummaryStrings(summary: TrafficMetricsSummary): string[] {
  const out: string[] = [summary.window, summary.routeViewEvent];
  for (const rv of summary.routeViews) out.push(rv.routeKind);
  for (const stage of summary.funnel) {
    out.push(stage.key, ...stage.events);
  }
  return out;
}

// Validate a candidate summary against the contract. Returns a list of problems;
// an empty list means the summary is bounded, structurally pinned, and free of
// any string outside the closed public vocabulary (i.e. safe to render / emit).
// This is the enforcement point behind "no user-identifying payloads".
export function findUnsafeSummaryProblems(summary: TrafficMetricsSummary): string[] {
  const problems: string[] = [];

  if (!isTrafficMetricWindow(summary.window)) {
    problems.push(`window "${summary.window}" is not a bounded reporting window`);
  }
  if (summary.routeViewEvent !== ROUTE_VIEW_EVENT) {
    problems.push(`routeViewEvent must be "${ROUTE_VIEW_EVENT}"`);
  }

  // Route buckets: each is a known public route kind, unique, with a valid count.
  const seenKinds = new Set<string>();
  for (const rv of summary.routeViews) {
    if (!DASHBOARD_ROUTE_KINDS.includes(rv.routeKind)) {
      problems.push(`routeKind "${rv.routeKind}" is not a known public route kind`);
    }
    if (seenKinds.has(rv.routeKind)) problems.push(`routeKind "${rv.routeKind}" is duplicated`);
    seenKinds.add(rv.routeKind);
    if (!isCount(rv.views)) problems.push(`views for "${rv.routeKind}" must be a non-negative integer`);
  }

  // Funnel: each stage is a canonical stage whose events are pinned to the defs.
  const defByKey = new Map<string, readonly string[]>(FUNNEL_STAGE_DEFS.map((s) => [s.key, s.events]));
  const seenStages = new Set<string>();
  for (const stage of summary.funnel) {
    const def = defByKey.get(stage.key);
    if (!def) {
      problems.push(`funnel stage "${stage.key}" is not a canonical stage`);
      continue;
    }
    if (seenStages.has(stage.key)) problems.push(`funnel stage "${stage.key}" is duplicated`);
    seenStages.add(stage.key);
    if (stage.events.length !== def.length || !stage.events.every((e, i) => e === def[i])) {
      problems.push(`funnel stage "${stage.key}" events drifted from the canonical definition`);
    }
    if (!isCount(stage.count)) problems.push(`count for stage "${stage.key}" must be a non-negative integer`);
  }

  // No-identifier guarantee: every string in the payload is public vocabulary.
  for (const str of collectSummaryStrings(summary)) {
    if (!SAFE_SUMMARY_VOCABULARY.has(str)) {
      problems.push(`summary carries a string outside the safe public vocabulary: "${str}"`);
    }
  }

  return problems;
}

// One fixture entry per window: either a ready numeric summary or an explicit
// transient-failure branch (the shape a real vendor timeout/error would return).
export type FixtureWindowEntry =
  | { kind: "ready"; summary: TrafficMetricsSummary }
  | { kind: "unavailable"; reason: string };

export type TrafficMetricsFixture = {
  id: string;
  windows: Partial<Record<TrafficMetricWindow, FixtureWindowEntry>>;
};

// Reason a fixture provider reports when a window has no fixture entry at all —
// distinct from the vendor-timeout `unavailable`, but the same safe empty state.
export const FIXTURE_WINDOW_MISSING_REASON =
  "No fixture traffic data is defined for this reporting window.";

// A deterministic, offline TrafficMetricsProvider backed entirely by a static
// fixture. It never touches the network and never reads wall-clock time, so the
// same window always yields the same result — the exact property a future live
// adapter's tests need, and a safe local default for a dashboard shell demo.
//
// Result branches:
//   - out-of-range window  -> unavailable (bounded-window guard; never throws)
//   - no entry for window  -> unavailable (FIXTURE_WINDOW_MISSING_REASON)
//   - entry.kind unavailable -> unavailable (fixture-modeled vendor failure)
//   - entry.kind ready       -> ready ONLY if the summary passes the safety guard
//                               and its window matches; otherwise unavailable
//                               (fail closed — a fixture can never smuggle an
//                               unsafe or mislabeled payload to the dashboard).
export function createFixtureTrafficMetricsProvider(
  fixture: TrafficMetricsFixture,
): TrafficMetricsProvider {
  return {
    id: fixture.id,
    async getSummary(window: TrafficMetricWindow): Promise<TrafficMetricsResult> {
      if (!isTrafficMetricWindow(window)) {
        return { status: "unavailable", reason: `Unsupported reporting window "${String(window)}".` };
      }

      const entry = fixture.windows[window];
      if (!entry) {
        return { status: "unavailable", reason: FIXTURE_WINDOW_MISSING_REASON };
      }
      if (entry.kind === "unavailable") {
        return { status: "unavailable", reason: entry.reason };
      }

      if (entry.summary.window !== window) {
        return {
          status: "unavailable",
          reason: `Fixture summary window "${entry.summary.window}" does not match requested "${window}".`,
        };
      }
      const problems = findUnsafeSummaryProblems(entry.summary);
      if (problems.length > 0) {
        return { status: "unavailable", reason: `Fixture summary rejected by safety guard: ${problems[0]}` };
      }
      return { status: "ready", summary: entry.summary };
    },
  };
}

// A canonical sample fixture used by the verifier and available as a deterministic
// stand-in when demoing the dashboard shell. Counts are illustrative only (they
// describe a discovery -> action -> account funnel that narrows at each stage) and
// carry no real traffic. The 24h/72h windows are the launch-review focus; 7d models
// a vendor timeout; 30d is intentionally absent (missing-window empty state).
export const SAMPLE_TRAFFIC_METRICS_FIXTURE: TrafficMetricsFixture = {
  id: "sample-fixture",
  windows: {
    "24h": {
      kind: "ready",
      summary: buildTrafficMetricsSummary(
        "24h",
        { home: 120, stocks: 80, stock_detail: 140, topic: 40, compare: 20 },
        { entry: 400, discover_to_detail: 180, action_intent: 60, account_intent: 18 },
      ),
    },
    "72h": {
      kind: "ready",
      summary: buildTrafficMetricsSummary(
        "72h",
        { home: 300, stocks: 210, stock_detail: 360, topic: 110, compare: 55 },
        { entry: 1050, discover_to_detail: 470, action_intent: 160, account_intent: 44 },
      ),
    },
    "7d": {
      kind: "unavailable",
      reason: "Sample fixture models a vendor timeout at the 7d window.",
    },
    // "30d" intentionally omitted -> exercises the missing-window empty state.
  },
};
