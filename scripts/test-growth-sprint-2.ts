import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildWatchlistRoutineSnapshot,
  diffWatchlistRoutineSnapshot,
  parseWatchlistRoutineSnapshot,
} from "../src/lib/watchlistRoutine";
import {
  RECENT_COMPARE_MAX_AGE_MS,
  pickRecentCompareCandidate,
  recentCompareHref,
} from "../src/lib/recentCompare";

const checkedAt = "2026-11-17T09:00:00.000Z";
const snapshot = buildWatchlistRoutineSnapshot(
  [
    { ticker: "005930", compositeScore: 66.4, signalType: "contract" },
    { ticker: "000660", compositeScore: 70, signalType: null },
    { ticker: "bad", compositeScore: 99, signalType: "ignored" },
  ],
  checkedAt,
);

assert.deepEqual(Object.keys(snapshot.stocks), ["000660", "005930"]);
assert.equal(snapshot.stocks["005930"].score, 66);
assert.deepEqual(parseWatchlistRoutineSnapshot(JSON.stringify(snapshot)), snapshot);
assert.equal(
  parseWatchlistRoutineSnapshot(JSON.stringify({ ...snapshot, stocks: { "005930": { score: "66", signalType: null } } })),
  null,
);

const changes = diffWatchlistRoutineSnapshot(snapshot, [
  { ticker: "005930", compositeScore: 70.2, signalType: "contract" },
  { ticker: "000660", compositeScore: 70, signalType: "buyback" },
  { ticker: "035420", compositeScore: 62, signalType: null },
]);
assert.equal(changes.length, 3);
assert.deepEqual(changes.find((change) => change.ticker === "005930"), {
  ticker: "005930",
  addedSinceLastCheck: false,
  scoreDelta: 4,
  signalChanged: false,
});
assert.equal(changes.find((change) => change.ticker === "000660")?.signalChanged, true);
assert.equal(changes.find((change) => change.ticker === "035420")?.addedSinceLastCheck, true);

const now = Date.parse("2026-11-17T10:00:00.000Z");
const candidate = pickRecentCompareCandidate(
  "005930",
  [
    { ticker: "005930", name: "삼성전자", viewedAt: now - 1_000 },
    { ticker: "000660", name: "SK하이닉스", viewedAt: now - 2_000 },
    { ticker: "035420", name: "NAVER", viewedAt: now - 3_000 },
  ],
  now,
);
assert.equal(candidate?.ticker, "000660");
assert.equal(
  pickRecentCompareCandidate(
    "005930",
    [{ ticker: "000660", name: "SK하이닉스", viewedAt: now - RECENT_COMPARE_MAX_AGE_MS - 1 }],
    now,
  ),
  null,
);
assert.equal(recentCompareHref("005930", "000660"), "/compare?stocks=005930%2C000660");

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const stockPage = source("src/app/stock/[ticker]/page.tsx");
const comparePage = source("src/app/compare/[pair]/page.tsx");
const topicPage = source("src/app/topics/[slug]/page.tsx");
const compareImage = source("src/app/compare/[pair]/opengraph-image.tsx");
const topicImage = source("src/app/topics/[slug]/opengraph-image.tsx");
const stockImage = source("src/app/stock/[ticker]/opengraph-image.tsx");
const imageFonts = source("src/lib/ogImageFonts.ts");
const fontLicense = source("assets/fonts/OFL.txt");
const watchlist = source("src/components/WatchlistClient.tsx");
const metrics = source("src/lib/adminTrafficMetrics.ts");

assert.match(stockPage, /RecentComparePrompt/);
assert.match(compareImage, /new ImageResponse/);
assert.match(topicImage, /new ImageResponse/);
for (const imageSource of [stockImage, compareImage, topicImage]) {
  assert.match(imageSource, /getOgImageFonts/);
}
assert.match(imageFonts, /readFile/);
assert.match(imageFonts, /process\.cwd\(\)/);
assert.match(fontLicense, /SIL OPEN FONT LICENSE/);
assert.doesNotMatch(comparePage, /ornscore-og-1200x630\.jpg/);
assert.doesNotMatch(topicPage, /ornscore-og-1200x630\.jpg/);
assert.match(watchlist, /ornscore_watchlist_routine_snapshot_v1/);
for (const token of ["campaignViews", "growthOutcomes", "stock_recent_compare_open"]) {
  assert.ok(metrics.includes(token), `admin traffic contract must include ${token}`);
}

console.log("PASS growth sprint 2: campaign/outcome contract, contextual compare, dynamic OG, and watchlist deltas");
