import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homeCopy } from "../src/lib/copy/home";
import { parseRecentViews, RECENT_VIEW_MAX_AGE_DAYS } from "../src/lib/recentViews";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(repo, path), "utf8");
let failed = 0;

function check(name: string, condition: boolean): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL: ${name}`);
}

const now = Date.UTC(2026, 10, 19, 12, 0, 0);
const day = 24 * 60 * 60 * 1000;
const recent = Array.from({ length: 12 }, (_, index) => ({
  ticker: String(index).padStart(6, "0"),
  name: `종목 ${index}`,
  viewedAt: index === 1 ? new Date(now - day).toISOString() : now - index * day,
}));
const parsed = parseRecentViews([
  ...recent.reverse(),
  { ticker: "OLD", name: "오래된 종목", viewedAt: now - (RECENT_VIEW_MAX_AGE_DAYS + 1) * day },
  { ticker: "FUTURE", name: "미래 종목", viewedAt: now + 2 * 60 * 1000 },
  { ticker: 123, name: "형식 오류", viewedAt: now },
], now);

check("recent views keep at most ten entries", parsed.length === 10);
check("recent views are sorted newest first", parsed[0]?.ticker === "000000" && parsed[9]?.ticker === "000009");
check("recent views expire after 90 days", !parsed.some((item) => item.ticker === "OLD"));
check("future and malformed recent views are rejected", !parsed.some((item) => item.ticker === "FUTURE"));

for (const locale of ["ko", "en"] as const) {
  const checks = homeCopy[locale].topCandidate.nextCheck;
  check(`${locale} candidate guidance covers four metrics`, Object.keys(checks).sort().join(",") === "flow,momentum,value,vol");
  check(`${locale} candidate guidance is metric-specific`, new Set(Object.values(checks)).size === 4);
}

const globals = read("src/app/globals.css");
const tabs = read("src/components/StockTabs.tsx");
const chart = read("src/components/ScoreHistoryChart.tsx");
const stockPage = read("src/app/stock/[ticker]/page.tsx");
const explorer = read("src/components/StocksExplorer.tsx");
const candidate = read("src/components/home/StockCandidateCard.tsx");
const preflight = read("scripts/release-preflight.mjs");
const baseline = JSON.parse(read("docs/ornscore-framework-migration-baseline-2026-07-16.json"));
const metadataRoutes: string[] = baseline?.facts?.sourceRoutes?.metadataRoutes ?? [];

check("shared app-header sticky offset is defined", globals.includes("--app-header-sticky-offset"));
check("stock tabs use the app-header sticky offset", tabs.includes("top-[var(--app-header-sticky-offset)]"));
check("score history receives and labels the public snapshot date", chart.includes("currentAsOf") && chart.includes("sourceDatesDiffer") && stockPage.includes("currentAsOf={dataMetadata.asOfBusinessDate}"));
check("mobile saved-search tools start behind an explicit disclosure", explorer.includes("showMobileSavedTools") && explorer.includes('aria-controls="stocks-saved-tools"'));
check("candidate guidance selects the weakest metric", candidate.includes("weakestMetric") && candidate.includes("topCandidate.nextCheck[weakestMetric]"));
check("release preflight blocks stale framework baselines", preflight.includes('{ name: "verify:framework-baseline"') && preflight.includes('"--freshness-only"'));
check("framework baseline includes compare OG metadata", metadataRoutes.includes("/compare/[pair]/opengraph-image"));
check("framework baseline includes topic OG metadata", metadataRoutes.includes("/topics/[slug]/opengraph-image"));

if (failed > 0) {
  console.error(`post-audit fixes FAILED (${failed})`);
  process.exit(1);
}

console.log("PASS post-audit fixes: fresh baseline, mobile sticky/saved-tools, source-date labels, metric guidance, and 90-day recents");
