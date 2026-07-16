// Regression guard for the future numeric-dashboard typed boundary.
// Run: npx tsx scripts/verify-admin-traffic-metrics.ts (exits non-zero on FAIL).
//
// src/lib/adminTrafficMetrics.ts is a typed landing spot for a FUTURE in-admin
// traffic dashboard (Option C in the telemetry plan). It ships no collection and
// no live call, but its contract is only safe if it stays consistent with the
// existing analytics sources of truth. This verifier asserts:
//   1. Route buckets cover every ROUTE_KIND (no route drifts out of the board).
//   2. Every funnel event name really exists in the canonical event map doc
//      (a renamed/removed event can't silently leave a dead funnel stage).
//   3. The funnel is structurally sane (unique keys, every stage has an event).
//   4. The default provider reports `not_configured` for every window, makes no
//      call, and is never mistaken for `ready`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DASHBOARD_ROUTE_KINDS,
  FUNNEL_EVENT_NAMES,
  FUNNEL_STAGE_DEFS,
  SAMPLE_TRAFFIC_METRICS_FIXTURE,
  TRAFFIC_METRIC_WINDOWS,
  buildTrafficMetricsSummary,
  createFixtureTrafficMetricsProvider,
  findUnsafeSummaryProblems,
  isTrafficMetricWindow,
  isTrafficMetricsReady,
  notConfiguredTrafficMetricsProvider,
  type TrafficMetricWindow,
} from "../src/lib/adminTrafficMetrics";
import { ROUTE_KINDS } from "../src/lib/routeAnalytics";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

// --- 1. Route buckets cover every route kind (single source of truth) --------

check(
  "DASHBOARD_ROUTE_KINDS equals ROUTE_KINDS exactly",
  DASHBOARD_ROUTE_KINDS.length === ROUTE_KINDS.length &&
    DASHBOARD_ROUTE_KINDS.every((k, i) => k === ROUTE_KINDS[i]),
);

// --- 2. Every funnel event exists in the canonical event map -----------------

const EVENT_MAP_PATH = join(__dirname, "..", "docs", "ornscore-analytics-event-map-2026-07-12.md");
const eventMapText = readFileSync(EVENT_MAP_PATH, "utf8");
// Table rows look like: | `event_name` | Source | ... — pull the first backticked
// token of each row as a documented event name.
const documentedEvents = new Set<string>();
for (const line of eventMapText.split(/\r?\n/)) {
  const m = line.match(/^\|\s*`([a-z0-9_]+)`/);
  if (m) documentedEvents.add(m[1]);
}
check("event map yielded a non-trivial event set", documentedEvents.size >= 10);

for (const event of FUNNEL_EVENT_NAMES) {
  check(`funnel event "${event}" is documented in the event map`, documentedEvents.has(event));
}

// --- 3. Structural sanity on the funnel --------------------------------------

check("funnel stage keys are unique", new Set(FUNNEL_STAGE_DEFS.map((s) => s.key)).size === FUNNEL_STAGE_DEFS.length);
for (const stage of FUNNEL_STAGE_DEFS) {
  check(`funnel stage "${stage.key}" has at least one event`, stage.events.length > 0);
}

check("at least one reporting window is defined", TRAFFIC_METRIC_WINDOWS.length > 0);
check("reporting windows are unique", new Set(TRAFFIC_METRIC_WINDOWS).size === TRAFFIC_METRIC_WINDOWS.length);

// --- 4. Default provider is a safe, no-call empty state ----------------------

async function checkProvider(): Promise<void> {
  for (const window of TRAFFIC_METRIC_WINDOWS) {
    const result = await notConfiguredTrafficMetricsProvider.getSummary(window);
    check(`default provider reports not_configured for ${window}`, result.status === "not_configured");
    check(`default provider is not ready for ${window}`, isTrafficMetricsReady(result) === false);
    check(
      `default provider gives a reason for ${window}`,
      result.status === "not_configured" && result.reason.length > 0,
    );
  }
}

// --- 5. Bounded-window guard -------------------------------------------------

for (const window of TRAFFIC_METRIC_WINDOWS) {
  check(`isTrafficMetricWindow accepts declared window "${window}"`, isTrafficMetricWindow(window));
}
for (const bad of ["1h", "24H", "365d", "", "all"]) {
  check(`isTrafficMetricWindow rejects out-of-range window "${bad}"`, isTrafficMetricWindow(bad) === false);
}

// --- 6. Safety guard: a built summary is safe; tampered ones are rejected -----

const builtSummary = buildTrafficMetricsSummary(
  "24h",
  { home: 10, stock_detail: 5 },
  { entry: 12, discover_to_detail: 4 },
);
check("buildTrafficMetricsSummary yields a summary with zero problems", findUnsafeSummaryProblems(builtSummary).length === 0);
check(
  "built summary carries one bucket per dashboard route kind",
  builtSummary.routeViews.length === DASHBOARD_ROUTE_KINDS.length,
);
check("built summary carries one funnel stage per canonical def", builtSummary.funnel.length === FUNNEL_STAGE_DEFS.length);

// Injected identifier in a route kind must be caught (no-PII guarantee).
const leakedIdentifier = {
  ...builtSummary,
  routeViews: [...builtSummary.routeViews, { routeKind: "user@example.com", views: 1 }],
};
check("guard rejects a summary carrying a non-vocabulary string (identifier leak)", findUnsafeSummaryProblems(leakedIdentifier).length > 0);

// Negative / non-integer counts must be caught.
const badCount = {
  ...builtSummary,
  funnel: builtSummary.funnel.map((s, i) => (i === 0 ? { ...s, count: -3 } : s)),
};
check("guard rejects a negative funnel count", findUnsafeSummaryProblems(badCount).length > 0);

// Drifted funnel events must be caught.
const driftedEvents = {
  ...builtSummary,
  funnel: builtSummary.funnel.map((s, i) => (i === 0 ? { ...s, events: ["not_a_real_event"] } : s)),
};
check("guard rejects funnel events drifted from the canonical definition", findUnsafeSummaryProblems(driftedEvents).length > 0);

// Out-of-range window on the summary itself must be caught.
const badWindow = { ...builtSummary, window: "1h" as TrafficMetricWindow };
check("guard rejects a summary with an out-of-range window", findUnsafeSummaryProblems(badWindow).length > 0);

// --- 7. Fixture-backed provider: deterministic ready / unavailable branches ---

async function checkFixtureProvider(): Promise<void> {
  const provider = createFixtureTrafficMetricsProvider(SAMPLE_TRAFFIC_METRICS_FIXTURE);
  check("fixture provider exposes the fixture id", provider.id === SAMPLE_TRAFFIC_METRICS_FIXTURE.id);

  // 24h: ready + passes the safety guard + is deterministic across calls.
  const first = await provider.getSummary("24h");
  const second = await provider.getSummary("24h");
  check("fixture provider returns ready for 24h", first.status === "ready");
  check("fixture provider ready result is recognized by isTrafficMetricsReady", isTrafficMetricsReady(first));
  if (first.status === "ready") {
    check("fixture 24h summary passes the safety guard", findUnsafeSummaryProblems(first.summary).length === 0);
    check("fixture 24h summary window matches request", first.summary.window === "24h");
  }
  check(
    "fixture provider is deterministic (identical result for repeated 24h call)",
    JSON.stringify(first) === JSON.stringify(second),
  );

  // 72h: also ready.
  const w72 = await provider.getSummary("72h");
  check("fixture provider returns ready for 72h", w72.status === "ready");

  // 7d: modeled vendor timeout -> unavailable with a reason.
  const w7d = await provider.getSummary("7d");
  check("fixture provider returns unavailable for 7d (modeled timeout)", w7d.status === "unavailable");
  check("fixture 7d unavailable carries a reason", w7d.status === "unavailable" && w7d.reason.length > 0);

  // 30d: no fixture entry -> unavailable empty state, still not ready.
  const w30d = await provider.getSummary("30d");
  check("fixture provider returns unavailable for the absent 30d window", w30d.status === "unavailable");
  check("fixture provider never reports ready for the absent 30d window", isTrafficMetricsReady(w30d) === false);

  // Out-of-range window -> unavailable, never a throw.
  const oob = await provider.getSummary("1h" as TrafficMetricWindow);
  check("fixture provider degrades an out-of-range window to unavailable", oob.status === "unavailable");

  // Fail closed: a fixture whose summary carries a leaked identifier must not
  // surface as ready.
  const tampered = createFixtureTrafficMetricsProvider({
    id: "tampered-fixture",
    windows: {
      "24h": {
        kind: "ready",
        summary: {
          ...buildTrafficMetricsSummary("24h"),
          routeViews: [{ routeKind: "email:leak@example.com", views: 1 }],
        },
      },
    },
  });
  const tamperedResult = await tampered.getSummary("24h");
  check("fixture provider fails closed on an unsafe summary (never ready)", tamperedResult.status === "unavailable");
}

async function main(): Promise<void> {
  await checkProvider();
  await checkFixtureProvider();
  if (failed > 0) {
    console.error(`admin-traffic-metrics verification FAILED (${failed} check${failed === 1 ? "" : "s"})`);
    process.exit(1);
  }
  console.log(
    `PASS admin-traffic-metrics: ${DASHBOARD_ROUTE_KINDS.length} route kinds, ${FUNNEL_STAGE_DEFS.length} funnel stages, ${FUNNEL_EVENT_NAMES.length} funnel events checked against the event map; bounded-window guard, no-identifier summary guard, and the deterministic fixture provider (ready/unavailable/fail-closed) verified`,
  );
}

void main();
