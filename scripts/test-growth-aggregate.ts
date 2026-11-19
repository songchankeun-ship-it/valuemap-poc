import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toTrafficDashboardState } from "../src/lib/adminTrafficView";
import {
  GROWTH_CAMPAIGNS, GROWTH_EVENTS, growthKey, MAX_GROWTH_BYTES, NO_ROUTE,
  parseGrowthEvent, projectGrowthEvent, type GrowthKey,
} from "../src/lib/growthAggregate";
import { handleGrowthAggregate } from "../src/lib/growthAggregateHandler";
import { readGrowthTraffic, type GrowthAggregateStore } from "../src/lib/growthAggregateReport";
import { ROUTE_KINDS } from "../src/lib/routeAnalytics";

const origin = "https://ornscore.example";
const now = new Date("2026-11-18T15:00:00.000Z");
const entry = { event: "route_view_public", campaign: "threads", routeKind: "stock_detail" } as const;
const compare = { event: "topic_compare_start", campaign: "threads", routeKind: NO_ROUTE } as const;
const stored: GrowthKey[] = [];
const increment = async (key: GrowthKey) => { stored.push(key); };
const json = JSON.stringify(entry);

function request(body: string | ReadableStream<Uint8Array>, headers = {}, query = "") {
  return new Request(`${origin}/api/growth-aggregate${query}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, "sec-fetch-site": "same-origin", ...headers },
    body,
    ...(typeof body === "string" ? {} : { duplex: "half" }),
  });
}

function verifyPacketEnums() {
  const sql = readFileSync("docs/sql/growth_aggregate.sql", "utf8");
  for (const [column, values] of [
    ["event", GROWTH_EVENTS], ["campaign", GROWTH_CAMPAIGNS], ["route_kind", ROUTE_KINDS],
  ] as const) {
    const list = sql.match(new RegExp(`\\b${column} in \\(([^)]+)\\)`))?.[1];
    assert.ok(list, column);
    assert.deepEqual([...list.matchAll(/'([^']+)'/g)].map((match) => match[1]).sort(), [...values].sort(), column);
  }
  assert.match(sql, /event <> 'route_view_public' and route_kind = 'none'/);
}

async function main() {
  verifyPacketEnums();
  assert.deepEqual(parseGrowthEvent(entry), entry);
  assert.equal(parseGrowthEvent({ ...entry, event: "other_public" }), null);
  assert.equal(parseGrowthEvent({ ...entry, event: "toString" }), null);
  assert.equal(parseGrowthEvent({ ...entry, campaign: ["share"] }), null);
  assert.equal(parseGrowthEvent({ ...entry, campaign: "Threads" }), null);
  assert.equal(parseGrowthEvent({ ...entry, routeKind: "none" }), null);
  assert.equal(parseGrowthEvent({ ...compare, routeKind: "stock_detail" }), null);
  assert.equal(parseGrowthEvent({ ...entry, event: "x".repeat(200) }), null);
  assert.equal(projectGrowthEvent("/admin/traffic", entry.event, entry), null);
  assert.equal(projectGrowthEvent("/stocks", "search_result_open", { resultType: "theme" }), null);
  assert.deepEqual(projectGrowthEvent("/stocks", "search_result_open", { resultType: "stock" }), {
    event: "search_result_open", campaign: "unattributed", routeKind: "none",
  });
  assert.deepEqual(projectGrowthEvent("/stock/123456", entry.event, { ...entry, ticker: "123456" }), entry);
  for (const field of ["cookie", "id", "ip", "userId", "accountId", "email", "referrer", "url", "query", "text", "note", "history", "timestamp", "count", "__proto__"]) {
    const body = JSON.stringify({ ...entry, [field]: "private@example.test" });
    assert.equal((await handleGrowthAggregate(request(body), origin, increment)).status, 400, field);
  }
  const oversize = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_GROWTH_BYTES));
      controller.enqueue(new Uint8Array(1));
      controller.close();
    },
  });
  assert.equal((await handleGrowthAggregate(request(oversize), origin, increment)).status, 400);
  assert.equal((await handleGrowthAggregate(request(json, { "content-length": "161" }), origin, increment)).status, 400);
  assert.equal((await handleGrowthAggregate(request(json, { "content-encoding": "gzip" }), origin, increment)).status, 400);
  assert.equal((await handleGrowthAggregate(request(json, {}, "?q=private"), origin, increment)).status, 400);
  assert.equal((await handleGrowthAggregate(request(json.replace("{", '{"campaign":"personal",')), origin, increment)).status, 400);
  assert.equal((await handleGrowthAggregate(request(json, { origin: "https://other.example" }), origin, increment)).status, 403);
  assert.equal((await handleGrowthAggregate(request(json, { "sec-fetch-site": "same-site" }), origin, increment)).status, 403);
  const missingOrigin = new Request(origin, { method: "POST", body: json });
  assert.equal((await handleGrowthAggregate(missingOrigin, origin, increment)).status, 403);
  assert.equal(stored.length, 0);
  assert.equal((await handleGrowthAggregate(request(json), origin, undefined)).status, 503);
  assert.equal((await handleGrowthAggregate(request(json), origin, async () => { throw new Error("private"); })).status, 503);
  const response = await handleGrowthAggregate(request(json), origin, increment, now);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(await response.text(), "");
  assert.deepEqual(stored, [{ day: "2026-11-19", ...entry }]);
  assert.deepEqual(growthKey(entry, new Date(now.getTime() - 1)), { day: "2026-11-18", ...entry });
  assert.deepEqual(growthKey(entry, new Date(now.getTime() + 1)), stored[0]);

  const rows = [
    { ...stored[0], count: 3 },
    { day: "2026-11-13", ...compare, count: 2 },
    { day: "2026-11-12", ...compare, count: 4 },
    { day: "2026-10-21", ...compare, campaign: "unattributed", count: 1 },
    { day: "2026-11-19", event: "stock_share", routeKind: NO_ROUTE, campaign: "share", count: 5 },
  ];
  const fake: GrowthAggregateStore = {
    increment,
    async read(from, through) {
      assert.equal(from, "2026-10-21");
      assert.equal(through, "2026-11-19");
      return rows;
    },
  };
  const reports = await readGrowthTraffic(fake, now);
  for (const [window, actions, attributed] of [["7d", 2, 2], ["30d", 7, 6]] as const) {
    const state = toTrafficDashboardState(reports[window]);
    assert.equal(state.status, "ready");
    assert.equal(state.summary.funnel.find(({ key }) => key === "entry")?.count, 3);
    assert.equal(state.summary.funnel.find(({ key }) => key === "action_intent")?.count, actions);
    assert.equal(state.summary.campaignOutcomes.find(({ campaign }) => campaign === "threads")
      ?.outcomes.find(({ key }) => key === "compare")?.count, attributed);
  }
  assert.equal(toTrafficDashboardState((await readGrowthTraffic(undefined, now))["7d"]).status, "not_configured");
  for (const invalid of [[...rows, rows[0]], [{ ...rows[0], routeKind: "/admin" }], [{ ...rows[0], count: -1 }], [{ ...rows[0], note: "private" }], [{ ...rows[0], day: "2026-10-20" }]]) {
    assert.equal(toTrafficDashboardState((await readGrowthTraffic({ ...fake, read: async () => invalid }, now))["30d"]).status, "error");
  }
  const error = await readGrowthTraffic({ ...fake, read: async () => { throw new Error("private"); } }, now);
  assert.equal(toTrafficDashboardState(error["7d"]).status, "error");
  assert.ok(!JSON.stringify(error).includes("private"));
  assert.equal(toTrafficDashboardState((await readGrowthTraffic({ ...fake, read: async () => [] }, now))["7d"]).status, "empty");
  const oldOnly = await readGrowthTraffic({ ...fake, read: async () => [rows[2]] }, now);
  assert.equal(toTrafficDashboardState(oldOnly["7d"]).status, "empty");
  assert.equal(toTrafficDashboardState(oldOnly["30d"]).status, "ready");
  console.log("Growth aggregate privacy, handler, packet vocabulary, and traffic state checks passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
