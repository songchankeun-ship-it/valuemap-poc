// Regression guard for the /admin/traffic numeric dashboard shell's pure
// view-model layer (src/lib/adminTrafficView.ts).
// Run: npx tsx scripts/verify-admin-traffic-view.ts (exits non-zero on FAIL).
//
// The dashboard shell renders whatever a TrafficMetricsProvider returns; when a
// provider is `ready`, these pure functions turn the summary into totals, funnel
// conversion ratios, and a cross-window shape comparison. This verifier asserts
// the derivations are (a) faithful to the counts, (b) never fabricate a value
// (divide-by-zero → null, not 0), and (c) align windows correctly. It complements
// scripts/verify-admin-traffic-metrics.ts (which guards the provider/contract).
import {
  buildTrafficMetricsSummary,
  SAMPLE_TRAFFIC_METRICS_FIXTURE,
  FUNNEL_STAGE_DEFS,
  DASHBOARD_ROUTE_KINDS,
} from "../src/lib/adminTrafficMetrics";
import {
  buildWindowComparison,
  conversionRate,
  toTrafficSummaryView,
} from "../src/lib/adminTrafficView";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}
// Float compare with a small epsilon.
function approx(a: number | null, b: number, eps = 1e-9): boolean {
  return a !== null && Math.abs(a - b) < eps;
}

// --- 1. conversionRate: faithful ratio + divide-by-zero guard ----------------

check("conversionRate computes a normal ratio", approx(conversionRate(180, 400), 0.45));
check("conversionRate returns null for a zero denominator (no 0/0 as 0%)", conversionRate(0, 0) === null);
check("conversionRate returns null for a zero denominator with a live numerator", conversionRate(5, 0) === null);
check("conversionRate returns null for a negative denominator", conversionRate(5, -1) === null);
check("conversionRate returns null for non-finite input", conversionRate(Number.NaN, 10) === null);
check("conversionRate returns 0 for an honest zero numerator over a real base", conversionRate(0, 10) === 0);

// --- 2. toTrafficSummaryView: totals + funnel ratios on real fixture counts ---

// Mirror SAMPLE_TRAFFIC_METRICS_FIXTURE 24h counts.
const routeCounts24 = { home: 120, stocks: 80, stock_detail: 140, topic: 40, compare: 20 };
const funnelCounts24 = { entry: 400, discover_to_detail: 180, action_intent: 60, account_intent: 18 };
const summary24 = buildTrafficMetricsSummary("24h", routeCounts24, funnelCounts24);
const view24 = toTrafficSummaryView(summary24);

const expectedRouteTotal = DASHBOARD_ROUTE_KINDS.reduce(
  (sum, k) => sum + ((routeCounts24 as Record<string, number>)[k] ?? 0),
  0,
);
check("totalRouteViews equals the sum of every route bucket", view24.totalRouteViews === expectedRouteTotal);
check("totalRouteViews matches the four populated buckets (400)", view24.totalRouteViews === 400);
check(
  "route buckets are sorted by views descending",
  view24.routeViews.every((rv, i) => i === 0 || view24.routeViews[i - 1].views >= rv.views),
);
check("top route bucket is stock_detail (140)", view24.routeViews[0].routeKind === "stock_detail" && view24.routeViews[0].views === 140);
check("view keeps one bucket per dashboard route kind (zeros retained)", view24.routeViews.length === DASHBOARD_ROUTE_KINDS.length);

check("entryCount is the first funnel stage count", view24.entryCount === 400);
check("stage count matches the funnel def count", view24.stages.length === FUNNEL_STAGE_DEFS.length);

const entryStage = view24.stages[0];
check("entry stage is flagged isEntry", entryStage.isEntry === true);
check("entry stage has null stepRate (nothing precedes it)", entryStage.stepRate === null);
check("entry stage has null entryRate (self-ratio suppressed)", entryStage.entryRate === null);

const discover = view24.stages[1];
check("discover_to_detail entryRate = 180/400 = 0.45", approx(discover.entryRate, 0.45));
check("discover_to_detail stepRate = 180/400 = 0.45 (prev is entry)", approx(discover.stepRate, 0.45));

const action = view24.stages[2];
check("action_intent entryRate = 60/400 = 0.15", approx(action.entryRate, 0.15));
check("action_intent stepRate = 60/180 (prev is discover)", approx(action.stepRate, 60 / 180));

const account = view24.stages[3];
check("account_intent entryRate = 18/400 = 0.045", approx(account.entryRate, 0.045));
check("account_intent stepRate = 18/60 = 0.3", approx(account.stepRate, 0.3));

// --- 3. Zero-entry funnel: ratios are null, never fabricated ------------------

const zeroEntry = toTrafficSummaryView(buildTrafficMetricsSummary("24h", {}, {}));
check("zero-entry funnel yields entryCount 0", zeroEntry.entryCount === 0);
check("zero-entry funnel totalRouteViews is 0", zeroEntry.totalRouteViews === 0);
check(
  "every non-entry stage rate is null when entry is 0 (no invented 0%)",
  zeroEntry.stages.slice(1).every((s) => s.entryRate === null),
);

// --- 4. Purity: derivation does not mutate its input -------------------------

const beforeJson = JSON.stringify(summary24);
toTrafficSummaryView(summary24);
check("toTrafficSummaryView does not mutate the summary", JSON.stringify(summary24) === beforeJson);
check(
  "toTrafficSummaryView is deterministic (same input → identical output)",
  JSON.stringify(view24) === JSON.stringify(toTrafficSummaryView(summary24)),
);

// --- 5. Cross-window comparison alignment ------------------------------------

const summary72 = buildTrafficMetricsSummary(
  "72h",
  { home: 300, stocks: 210, stock_detail: 360, topic: 110, compare: 55 },
  { entry: 1050, discover_to_detail: 470, action_intent: 160, account_intent: 44 },
);
const view72 = toTrafficSummaryView(summary72);
const comparison = buildWindowComparison(view24, view72);

check("comparison has one row per funnel stage", comparison.length === FUNNEL_STAGE_DEFS.length);
check(
  "comparison rows follow the canonical funnel stage order",
  comparison.every((row, i) => row.key === FUNNEL_STAGE_DEFS[i].key),
);
const discoverRow = comparison.find((r) => r.key === "discover_to_detail")!;
check("comparison primary rate = 24h discover entryRate (0.45)", approx(discoverRow.primaryRate, 0.45));
check("comparison comparison rate = 72h discover entryRate (470/1050)", approx(discoverRow.comparisonRate, 470 / 1050));
const entryRow = comparison.find((r) => r.key === "entry")!;
check("comparison entry row is null on both sides (base stage)", entryRow.primaryRate === null && entryRow.comparisonRate === null);

// A window that is missing on one side carries null there, without throwing.
const partial = buildWindowComparison(view24, toTrafficSummaryView(buildTrafficMetricsSummary("72h", {}, {})));
check("comparison keeps primary rates when the other window is empty", approx(partial.find((r) => r.key === "discover_to_detail")!.primaryRate, 0.45));
check("comparison shows null on the empty side (no fabrication)", partial.every((r) => r.comparisonRate === null));

// --- 6. Ready fixture round-trips through the view without loss ---------------

const fixture24 = SAMPLE_TRAFFIC_METRICS_FIXTURE.windows["24h"];
check("sample fixture 24h is a ready entry", fixture24?.kind === "ready");
if (fixture24?.kind === "ready") {
  const fView = toTrafficSummaryView(fixture24.summary);
  check("fixture-derived total equals 400", fView.totalRouteViews === 400);
  check("fixture-derived account_intent entryRate = 0.045", approx(fView.stages[3].entryRate, 0.045));
}

if (failed > 0) {
  console.error(`admin-traffic-view verification FAILED (${failed} check${failed === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log(
  `PASS admin-traffic-view: totals, funnel step/entry conversion ratios (divide-by-zero → null), zero-entry safety, purity, and cross-window shape comparison verified over ${FUNNEL_STAGE_DEFS.length} funnel stages`,
);
