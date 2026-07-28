// Regression guard for the sanitized `route_view_public` classifier.
// Run: npx tsx scripts/verify-route-analytics.ts (exits non-zero on any FAIL).
//
// Verifies three things about src/lib/routeAnalytics.ts:
//   1. Each representative path maps to the expected routeKind + safe props.
//   2. Every property key emitted stays inside SAFE_ROUTE_PROP_KEYS.
//   3. Privacy: raw query text, emails, full URLs, and /admin paths never leak
//      into the emitted props, whatever junk rides along in the query string.
import {
  FALLBACK_ROUTE_KIND,
  ROUTE_CLASSIFIERS,
  ROUTE_KINDS,
  SAFE_ROUTE_PROP_KEYS,
  classifyRoute,
  type RouteAnalyticsProps,
} from "../src/lib/routeAnalytics";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const SAFE_KEYS = new Set<string>(SAFE_ROUTE_PROP_KEYS);

// (path, expected result). `null` means the route must not be tracked.
const CASES: Array<{ path: string; expect: RouteAnalyticsProps | null }> = [
  { path: "/", expect: { routeKind: "home" } },
  { path: "/stocks", expect: { routeKind: "stocks", hasQuery: false, hasFilters: false } },
  { path: "/stocks?q=samsung", expect: { routeKind: "stocks", hasQuery: true, hasFilters: false } },
  { path: "/stocks?sector=IT", expect: { routeKind: "stocks", hasQuery: false, hasFilters: true } },
  { path: "/stocks?themes=ai&sort=score", expect: { routeKind: "stocks", hasQuery: false, hasFilters: true } },
  { path: "/stock/005930", expect: { routeKind: "stock_detail", ticker: "005930" } },
  { path: "/topics/dividend", expect: { routeKind: "topic", topic: "dividend" } },
  { path: "/compare", expect: { routeKind: "compare", compareCount: 0 } },
  { path: "/compare?stocks=005930,000660", expect: { routeKind: "compare", compareCount: 2 } },
  { path: "/watchlist", expect: { routeKind: "watchlist" } },
  { path: "/today", expect: { routeKind: "today" } },
  { path: "/disclosures", expect: { routeKind: "disclosures" } },
  { path: "/backtest", expect: { routeKind: "backtest" } },
  { path: "/guide/metrics", expect: { routeKind: "metrics_guide" } },
  { path: "/login", expect: { routeKind: "login", hasQuery: false } },
  { path: "/login?next=/watchlist", expect: { routeKind: "login", hasQuery: true } },
  { path: "/pricing", expect: { routeKind: "pricing" } },
  { path: "/beta", expect: { routeKind: "beta" } },
  { path: "/about", expect: { routeKind: "about" } },
  { path: "/status", expect: { routeKind: "status" } },
  { path: "/some/unknown/page", expect: { routeKind: FALLBACK_ROUTE_KIND } },
  // Operations/admin surface must never be tracked.
  { path: "/admin", expect: null },
  { path: "/admin/traffic", expect: null },
  { path: "/admin/users?email=a@b.com", expect: null },
];

function splitPath(full: string): { pathname: string; search: string } {
  const q = full.indexOf("?");
  return q === -1 ? { pathname: full, search: "" } : { pathname: full.slice(0, q), search: full.slice(q) };
}

function sameProps(a: RouteAnalyticsProps, b: RouteAnalyticsProps): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) return false;
  }
  return true;
}

const exercisedKinds = new Set<string>();

for (const { path, expect } of CASES) {
  const { pathname, search } = splitPath(path);
  const got = classifyRoute(pathname, search);

  if (expect === null) {
    check(`${path} → not tracked`, got === null);
    continue;
  }
  if (got === null) {
    check(`${path} → tracked`, false);
    continue;
  }

  check(`${path} → props match`, sameProps(got, expect));
  exercisedKinds.add(got.routeKind);

  // Every emitted key must be in the safe allow-list.
  for (const key of Object.keys(got)) {
    check(`${path} key "${key}" is safe`, SAFE_KEYS.has(key));
  }
}

// Privacy stress test: cram sensitive junk into the query string and assert the
// emitted values never echo any of it back.
const SENSITIVE = ["s3cr3t-search-term", "user@example.com", "https://evil.example"];
const stressQuery = `?q=${SENSITIVE[0]}&email=${encodeURIComponent(SENSITIVE[1])}&ref=${encodeURIComponent(SENSITIVE[2])}`;
for (const base of ["/stocks", "/compare", "/login", "/stock/005930"]) {
  const props = classifyRoute(base, stressQuery);
  const serialized = JSON.stringify(props ?? {});
  for (const secret of SENSITIVE) {
    check(`${base}${stressQuery} does not leak "${secret}"`, !serialized.includes(secret));
  }
}

// Coverage: every classifier kind (+fallback) is exercised by a case above, so a
// newly added route can't silently ship untested.
for (const kind of ROUTE_KINDS) {
  check(`routeKind "${kind}" is covered by a test case`, exercisedKinds.has(kind));
}
check(
  "classifier kinds are unique",
  new Set(ROUTE_CLASSIFIERS.map((c) => c.kind)).size === ROUTE_CLASSIFIERS.length,
);

if (failed > 0) {
  console.error(`route-analytics verification FAILED (${failed} check${failed === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log(`PASS route-analytics: ${CASES.length} cases, ${ROUTE_KINDS.length} route kinds covered`);
