import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(repo, path), "utf8");

let failed = 0;
function check(name, condition) {
  if (condition) return;
  failed += 1;
  console.error(`FAIL: ${name}`);
}

const i18n = read("src/lib/i18n.ts");
const share = read("src/components/EvidenceShareButton.tsx");
const stockShare = read("src/components/ShareButton.tsx");
const compare = read("src/components/CompareClient.tsx");
const pair = read("src/app/compare/[pair]/page.tsx");
const watchlist = read("src/components/WatchlistClient.tsx");
const route = read("src/lib/routeAnalytics.ts");
const eventMap = read("docs/ornscore-analytics-event-map-2026-07-12.md");
const sprint = read("docs/ornscore-growth-sprint-1-2026-11-17.md");

check(
  "home keeps one canonical outcome sentence",
  i18n.includes('titleAccent: "전망 대신 숫자로"') && i18n.includes('titleAfter: "오늘 먼저 볼 종목을 줄여줍니다."'),
);
check("share URLs use the fixed allow-listed campaign", route.includes('"share"') && share.includes("withGrowthShareRef(path)"));
check("stock share emits a bounded event", stockShare.includes('analytics={{ kind: "stock", ticker }}') && share.includes('trackEvent("stock_share"'));
check("interactive compare share emits a bounded event", compare.includes('surface: "interactive"') && share.includes('trackEvent("compare_share"'));
check("curated compare page has a share action", pair.includes('surface: "curated"') && pair.includes("curatedCompareSharePath(pair)"));
check(
  "watchlist check-in stays local and emits counts only",
  watchlist.includes("ROUTINE_CHECK_KEY") &&
    watchlist.includes('window.localStorage.setItem(ROUTINE_CHECK_KEY, checkedAt)') &&
    watchlist.includes('trackEvent("watchlist_routine_complete"') &&
    watchlist.includes("이번 점검 완료"),
);
check(
  "analytics map documents the complete growth loop",
  ["stock_share", "compare_share", "watchlist_routine_complete", "ref=share"].every((token) => eventMap.includes(token)),
);
check(
  "operating plan fixes two channels and prohibits automatic publication",
  sprint.includes("Channel A — Naver web search") &&
    sprint.includes("Channel B — Threads operator account") &&
    sprint.includes("does not auto-publish content"),
);

if (failed > 0) {
  console.error(`growth-sprint verification FAILED (${failed})`);
  process.exit(1);
}

console.log("PASS growth-sprint: positioning, 3-format engine, two-channel plan, return check-in, and attributed sharing loop");
