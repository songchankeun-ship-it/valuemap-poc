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
  TRAFFIC_METRIC_WINDOWS,
  isTrafficMetricsReady,
  notConfiguredTrafficMetricsProvider,
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

async function main(): Promise<void> {
  await checkProvider();
  if (failed > 0) {
    console.error(`admin-traffic-metrics verification FAILED (${failed} check${failed === 1 ? "" : "s"})`);
    process.exit(1);
  }
  console.log(
    `PASS admin-traffic-metrics: ${DASHBOARD_ROUTE_KINDS.length} route kinds, ${FUNNEL_STAGE_DEFS.length} funnel stages, ${FUNNEL_EVENT_NAMES.length} funnel events checked against the event map`,
  );
}

void main();
