import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CAMPAIGN_SESSION_STORAGE_KEY,
  isCampaignSource,
  resolveCampaignSession,
} from "../src/lib/campaignSession";
import {
  buildTrafficMetricsSummary,
  findUnsafeSummaryProblems,
  GROWTH_OUTCOME_DEFS,
} from "../src/lib/adminTrafficMetrics";
import { toTrafficSummaryView } from "../src/lib/adminTrafficView";

assert.equal(CAMPAIGN_SESSION_STORAGE_KEY, "ornscore_campaign_session_v1");
assert.equal(isCampaignSource("threads"), true);
assert.equal(isCampaignSource("email=user@example.com"), false);

assert.deepEqual(resolveCampaignSession("?ref=threads", null), {
  campaign: "threads",
  shouldPersist: true,
});
assert.deepEqual(resolveCampaignSession("", "threads"), {
  campaign: "threads",
  shouldPersist: false,
});
assert.deepEqual(resolveCampaignSession("?ref=share", "threads"), {
  campaign: "share",
  shouldPersist: true,
});
assert.deepEqual(resolveCampaignSession("?ref=raw-email", "threads"), {
  campaign: "threads",
  shouldPersist: false,
});
assert.deepEqual(resolveCampaignSession("", "raw-email"), {
  campaign: undefined,
  shouldPersist: false,
});

const summary = buildTrafficMetricsSummary(
  "24h",
  { stock_detail: 10 },
  { entry: 10, discover_to_detail: 5, action_intent: 3 },
  { threads: 6, share: 4 },
  { compare: 3, save: 2, return: 1, share: 1 },
  {
    threads: { compare: 2, save: 1, return: 1, share: 0 },
    share: { compare: 1, save: 1, return: 0, share: 1 },
  },
);
assert.deepEqual(findUnsafeSummaryProblems(summary), []);
assert.equal(summary.campaignOutcomes.length, 9);
assert.ok(summary.campaignOutcomes.every((row) => row.outcomes.length === GROWTH_OUTCOME_DEFS.length));

const view = toTrafficSummaryView(summary);
assert.equal(view.campaignOutcomes[0].campaign, "threads");
assert.equal(view.campaignOutcomes[0].total, 4);
assert.equal(view.campaignOutcomes.find((row) => row.campaign === "share")?.total, 3);

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const clientAnalytics = source("src/lib/clientAnalytics.ts");
const campaignSession = source("src/lib/campaignSession.ts");
const adminPage = source("src/app/admin/traffic/page.tsx");
const eventMap = source("docs/ornscore-analytics-event-map-2026-07-12.md");

assert.match(clientAnalytics, /campaignContextFromWindow/);
assert.match(campaignSession, /window\.sessionStorage/);
assert.doesNotMatch(campaignSession, /window\.localStorage/);
assert.match(adminPage, /캠페인별 행동 건수/);
assert.match(eventMap, /same-tab session attribution/i);

console.log("PASS growth sprint 3: allow-listed same-tab attribution and campaign-to-outcome matrix");
