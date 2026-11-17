import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildTopicCompareStart, TOPIC_COMPARE_LIMIT } from "../src/lib/topicCompare";
import { sanitizeClickProps } from "../src/lib/clickAnalytics";
import { FUNNEL_STAGE_DEFS, GROWTH_OUTCOME_DEFS } from "../src/lib/adminTrafficMetrics";

assert.equal(TOPIC_COMPARE_LIMIT, 3);
assert.deepEqual(
  buildTopicCompareStart([
    { ticker: "005930" },
    { ticker: "000660" },
    { ticker: "005930" },
    { ticker: "bad" },
    { ticker: "035420" },
    { ticker: "051910" },
  ]),
  {
    tickers: ["005930", "000660", "035420"],
    href: "/compare?stocks=005930%2C000660%2C035420",
  },
);
assert.equal(buildTopicCompareStart([{ ticker: "005930" }, { ticker: "bad" }]), null);

assert.deepEqual(
  sanitizeClickProps("topic_compare_start", {
    topic: "low-per-stocks",
    count: 3,
    tickers: "005930,000660,035420",
    email: "user@example.com",
  }),
  { topic: "low-per-stocks", count: 3 },
);
assert.deepEqual(
  sanitizeClickProps("compare_curated_interactive_open", { count: 2, pair: "005930-vs-000660" }),
  { count: 2 },
);

const actionIntent = FUNNEL_STAGE_DEFS.find((stage) => stage.key === "action_intent");
const compareOutcome = GROWTH_OUTCOME_DEFS.find((outcome) => outcome.key === "compare");
for (const event of ["topic_compare_start", "compare_curated_interactive_open"] as const) {
  assert.ok(actionIntent?.events.includes(event), `${event} must count as action intent`);
  assert.ok(compareOutcome?.events.includes(event), `${event} must count as a compare outcome`);
}

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const topicPage = source("src/app/topics/[slug]/page.tsx");
const comparePage = source("src/app/compare/[pair]/page.tsx");
const adminPage = source("src/app/admin/traffic/page.tsx");
const eventMap = source("docs/ornscore-analytics-event-map-2026-07-12.md");

assert.match(topicPage, /buildTopicCompareStart/);
assert.match(topicPage, /data-analytics-event="topic_compare_start"/);
assert.match(topicPage, /앞의 \{compareStart\.tickers\.length\}개 비교/);
assert.match(comparePage, /data-analytics-event="compare_curated_interactive_open"/);
for (const event of ["topic_compare_start", "compare_curated_interactive_open"] as const) {
  assert.ok(adminPage.includes(event), `admin event map must include ${event}`);
  assert.ok(eventMap.includes(`\`${event}\``), `analytics event map must include ${event}`);
}

console.log("PASS growth sprint 4: search-intent pages open a bounded, attributable comparison flow");
