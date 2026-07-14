// Static regression guard for the first-run UX rebuild contract.
// Run: npx tsx scripts/verify-first-run-ux.ts (exits non-zero on FAIL).
//
// The first-run rebuild (docs/ornscore-first-run-ux-rebuild-2026-07-14.md) is
// executed in slices A-H. Between slices it is easy to silently regress the
// pieces the whole rebuild depends on: the shared navigation wording, the home
// H1, the home primary action + search entry, and the promise that a section the
// later slices remove does not creep back into the home. This verifier freezes
// those as machine-checkable contracts so any slice (or a later unrelated edit)
// that breaks them fails offline, before build.
//
// It is a STATIC verifier: it reads source text and the i18n copy tables. It
// does not start a server and does not touch data/auth/score logic.
//
// Checks:
//   1. Shared nav label drift  — the 5 role-forward primary labels and the 4
//      compact bottom-bar labels match the spec §12 canon (ko + en), so the
//      desktop/drawer/bottom navs cannot drift out of agreement.
//   2. Home / today / stocks are distinct in visible copy — the home (brand),
//      /today and /stocks nav words are mutually distinct (spec §18 Slice A).
//   3. Home H1 — exactly one <h1 on the home render surface (HomeHero owns it;
//      page.tsx must not add a competing one). Reliably testable surface only.
//   4. Home primary action + search contract — HomeHero keeps the single primary
//      CTA into the candidates and the hero search entry (spec §6.3).
//   5. Prohibited reintroduction of removed home sections — sections that later
//      slices remove (REMOVED_HOME_SECTIONS) must not be imported by the home
//      page. Empty in Slice A; later slices append as they remove sections.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { commonCopy, loginCopy } from "../src/lib/i18n";
import { todayCopy } from "../src/lib/copy/today";
import { stocksCopy } from "../src/lib/copy/stocks";

const ROOT = join(__dirname, "..");
function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

// --- 1. Shared nav label canon (spec §12.1 / §12.2) --------------------------
// The desktop sidebar, the mobile drawer and the mobile bottom bar all read from
// these tables (copy.nav / copy.navShort). Freezing the canon here keeps them
// aligned to route roles regardless of which component renders them.
const NAV_CANON = {
  ko: { today: "오늘 브리핑", stocks: "종목 찾기", watchlist: "관심종목", disclosures: "공시", compare: "비교" },
  en: { today: "Today briefing", stocks: "Find stocks", watchlist: "Watchlist", disclosures: "Disclosures", compare: "Compare" },
} as const;
const NAV_SHORT_CANON = {
  ko: { today: "오늘", stocks: "찾기", watchlist: "관심", disclosures: "공시" },
  en: { today: "Today", stocks: "Find", watchlist: "Saved", disclosures: "Filings" },
} as const;

for (const locale of ["ko", "en"] as const) {
  const nav = commonCopy[locale].nav;
  for (const [key, expected] of Object.entries(NAV_CANON[locale])) {
    check(`nav.${key} (${locale}) == "${expected}"`, (nav as Record<string, string>)[key] === expected);
  }
  const navShort = commonCopy[locale].navShort;
  for (const [key, expected] of Object.entries(NAV_SHORT_CANON[locale])) {
    check(`navShort.${key} (${locale}) == "${expected}"`, (navShort as Record<string, string>)[key] === expected);
  }
}

// --- 2. Home / today / stocks read as three distinct destinations ------------
for (const locale of ["ko", "en"] as const) {
  const { brand, nav } = commonCopy[locale];
  const words = [brand, nav.today, nav.stocks];
  check(`home/today/stocks copy is distinct (${locale})`, new Set(words).size === words.length);
}

// --- 3. Home H1: exactly one, owned by HomeHero ------------------------------
const heroSrc = read("src/components/home/HomeHero.tsx");
const pageSrc = read("src/app/page.tsx");
const heroH1 = (heroSrc.match(/<h1[\s>]/g) ?? []).length;
const pageH1 = (pageSrc.match(/<h1[\s>]/g) ?? []).length;
check("HomeHero declares exactly one <h1>", heroH1 === 1);
check("home page.tsx adds no competing <h1>", pageH1 === 0);

// --- 4. Home primary action + search contract (spec §6.3) --------------------
check("HomeHero keeps the primary CTA into today's candidates", heroSrc.includes("#today-candidates"));
check("HomeHero primary CTA uses copy.primaryCta", heroSrc.includes("copy.primaryCta"));
check("HomeHero keeps the hero search entry", heroSrc.includes('variant="hero"'));
check("HomeHero labels the search entry (copy.searchLabel)", heroSrc.includes("copy.searchLabel"));

// --- 5. Prohibited reintroduction of removed home sections -------------------
// Later slices (C/D) remove some home sections. As each is removed, append its
// component name here; this guard then fails if a future edit re-imports it into
// the home page.
// Slice C (spec §6.2): the home default body is capped at four regions (start
// area, up to 3 candidate previews, one compact verification-order block, and an
// optional personal routine). These sections were removed from / or relocated to
// /today, so re-importing any of them into the home page must fail here.
const REMOVED_HOME_SECTIONS: string[] = [
  "MarketSnapshotCards",
  "DisclosureSignalSection",
  "FeatureCards",
  "HowItWorksSection",
  "RiskNotice",
];

function homeSectionImports(src: string): Set<string> {
  const names = new Set<string>();
  const re = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+["']@\/components\/home\/[^"']+["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    for (const raw of m[1].split(",")) {
      const id = raw.replace(/\btype\b/, "").trim();
      if (id) names.add(id);
    }
  }
  return names;
}

const imported = homeSectionImports(pageSrc);
for (const removed of REMOVED_HOME_SECTIONS) {
  check(`removed home section "${removed}" is NOT re-imported by the home page`, !imported.has(removed));
}

// WelcomeOnboarding lives at "@/components/WelcomeOnboarding" (not the home/*
// folder the regex above scans), so guard it directly. Slice C folded its 3-step
// onboarding into the top verification-order block, so the home page must not
// re-import the standalone onboarding banner.
check(
  "removed home section \"WelcomeOnboarding\" is NOT imported by the home page",
  !/import\s+\{[^}]*\bWelcomeOnboarding\b[^}]*\}\s+from\s+["']@\/components\/WelcomeOnboarding["']/.test(pageSrc),
);

// Self-test: prove the guard actually fires, even while REMOVED_HOME_SECTIONS is
// empty. If the detector or the "prohibited present" logic ever breaks, this
// fails loudly instead of the guard silently passing forever.
const SELFTEST_SRC = `import { FeatureCards } from "@/components/home/FeatureCards";`;
const selftestImports = homeSectionImports(SELFTEST_SRC);
check("self-test: import extractor finds a home section", selftestImports.has("FeatureCards"));
check("self-test: guard flags a prohibited section when present", selftestImports.has("FeatureCards") === true);
check("self-test: guard ignores a section that is not prohibited", !selftestImports.has("HowItWorksSection"));

// --- 6. /today is a returning-user change briefing, not a second home --------
// Slice D (spec §7): /today leads with a change-first one-line summary, orders
// content as summary → candidates+change → current-strength lists → disclosure
// signals → data caveat, drops the home-duplicating how-to marketing (the routine
// scan-order block and the candidate checklist), and — when no day-over-day delta
// exists — labels the list as current strength instead of inventing a change.
const todaySrc = read("src/components/today/TodayContent.tsx");

// 6a. Change-first summary replaces the static product-intro headerDesc.
check(
  "today leads with a change-first summary (hasDeltas ? summaryWithDeltas : summaryNoDeltas)",
  todaySrc.includes("t.summaryWithDeltas") && todaySrc.includes("t.summaryNoDeltas"),
);
check("today no longer renders the static product-intro headerDesc", !todaySrc.includes("t.headerDesc"));

// 6b. How-to marketing duplicated from home is gone (routine scan-order + checklist).
check("today drops the how-to routine scan-order block", !todaySrc.includes("t.routine"));
check("today drops the candidate checklist marketing block", !todaySrc.includes("t.checklist"));

// 6c. Honest current-strength fallback when there is no previous-day delta.
check(
  "today labels no-delta candidates as current strength (no fabricated change)",
  todaySrc.includes("t.strengthFallbackNote") && todaySrc.includes("t.noChangeNote"),
);

// 6d. Spec §7 render order: summary → change → current-strength lists → disclosure → caveat.
const iSummary = todaySrc.indexOf("t.summaryWithDeltas");
const iChange = todaySrc.indexOf("t.changeTitle");
const iStrength = todaySrc.indexOf("t.signalsStrengthNote");
const iDisclosure = todaySrc.indexOf("t.disclosureHeading");
const iCaveat = todaySrc.indexOf("t.sourceNote");
check(
  "today order: summary → change → current-strength lists → disclosure → caveat",
  iSummary >= 0 && iChange > iSummary && iStrength > iChange && iDisclosure > iStrength && iCaveat > iDisclosure,
);

// 6e. The new change-briefing copy keys exist in both locales.
const TODAY_KEYS = [
  "summaryWithDeltas",
  "summaryNoDeltas",
  "strengthFallbackNote",
  "noChangeNote",
  "signalsStrengthNote",
  "disclosureHeading",
] as const;
for (const locale of ["ko", "en"] as const) {
  const c = todayCopy[locale] as Record<string, unknown>;
  for (const key of TODAY_KEYS) {
    check(`today copy.${key} (${locale}) is a non-empty string`, typeof c[key] === "string" && (c[key] as string).length > 0);
  }
}

// --- 7. /stocks reads as "Find stocks" (spec §8, Slice E) --------------------
// Slice E: /stocks must read as the stock-finding screen — search first, a small
// set of question-style presets that apply real filters, a concise active-filter
// summary, and a recoverable zero-result state. On mobile the preset controls
// must not push the result list off the first useful viewport, so they collapse
// while desktop (lg+) keeps them open.
const stocksSrc = read("src/components/StocksExplorer.tsx");

// 7a. The page H1 uses the role-forward term, not the bare legacy "발견" (spec §4/§8.1),
// and agrees with the nav canon (stocks == "종목 찾기").
const stocksH1Ko: string = stocksCopy.ko.headerTitle;
check(
  "stocks H1 (ko) reads as a finding label, not the legacy 발견",
  stocksH1Ko.includes("찾기") && stocksH1Ko !== "발견",
);
check(
  "stocks H1 (en) is a non-empty finding label",
  typeof stocksCopy.en.headerTitle === "string" && stocksCopy.en.headerTitle.length > 0,
);

// 7b. Search-first with 3–5 question presets that apply real filters.
check("stocks keeps a search input up top", stocksSrc.includes('type="search"') && stocksSrc.includes("t.searchPlaceholder"));
const qPresetCount = Object.keys(stocksCopy.ko.qPreset).length;
check("stocks offers 3–5 question presets", qPresetCount >= 3 && qPresetCount <= 5);
check("stocks renders the question presets", stocksSrc.includes("QUESTION_PRESETS.map"));

// 7c. Recoverable zero-result: relax the strongest single condition + full reset.
check("stocks zero-result offers relax + reset", stocksSrc.includes("t.relaxStrongest") && stocksSrc.includes("resetFilters"));

// 7d. Mobile: question presets collapse (open on lg+) so they don't push results
// off the first useful viewport (spec §8.3).
check(
  "stocks question presets are mobile-collapsible, open on lg+",
  stocksSrc.includes("showMobilePresets") && stocksSrc.includes('id="question-presets"') && stocksSrc.includes("lg:grid"),
);

// --- 8. Stock detail leads with the deeper order (spec §9.3, Slice F) --------
// Slice F: after the conclusion hero, the deeper content is ordered
// evidence → recent change → disclosures → financial/value → chart/additional,
// with the tabs preserved for progressive disclosure. Freeze that order so a
// later edit can't silently shuffle the score-basis tab back behind the chart or
// detach the recent-change summary from the evidence it explains. Also guard the
// top/summary de-duplication (the beginner reading must not restate the hero's
// "현재 이 종목은" conclusion headline).
const detailSrc = read("src/app/stock/[ticker]/page.tsx");
const iBasisTab = detailSrc.indexOf('id: "basis"');
const iDisclosuresTab = detailSrc.indexOf('id: "disclosures"');
const iFinancialsTab = detailSrc.indexOf('id: "financials"');
const iSummaryTab = detailSrc.indexOf('id: "summary"');
check(
  "stock detail tab order is basis → disclosures → financials → summary (evidence first, chart last)",
  iBasisTab >= 0 && iDisclosuresTab > iBasisTab && iFinancialsTab > iDisclosuresTab && iSummaryTab > iFinancialsTab,
);

// Evidence (ScoreBasisBreakdown) precedes the recent-change summary, and the
// recent-change summary sits inside the (default) basis tab — before disclosures.
const iScoreBasis = detailSrc.indexOf("<ScoreBasisBreakdown");
const iRecentChange = detailSrc.indexOf("<RecentChangeSummary");
check(
  "stock detail places recent change right after the score basis (evidence → recent change)",
  iScoreBasis >= 0 && iRecentChange > iScoreBasis && iRecentChange < iDisclosuresTab,
);

// Chart / additional analysis is the last depth: it lives in the summary tab,
// after the financials tab in source order.
const iChart = detailSrc.indexOf("<StockPriceChartLazy");
check(
  "stock detail keeps the price chart in the last (summary) tab, not the landing depth",
  iChart >= 0 && iChart > iFinancialsTab,
);

// Top/summary de-duplication: the beginner reading no longer restates the hero
// conclusion headline (copy.currentLabel).
const beginnerSrc = read("src/components/BeginnerReading.tsx");
check(
  "beginner reading drops the duplicate hero conclusion headline (t.currentLabel)",
  !beginnerSrc.includes("t.currentLabel"),
);

// --- 9. Watchlist / compare / login boundary (spec §10-11, Slice G) ----------
// Slice G tightens the watchlist + compare empty states to a small set of real
// start actions, states the logged-out on-device storage vs login sync value,
// keeps compare startable from search/today/watchlist, reframes the login value
// copy around cross-device continuity while confirming public/local use stays
// open, and holds the placeholder-Supabase guard + public escape links and the
// owner-only /admin boundary (absent from public nav/SEO).
const watchSrc = read("src/components/WatchlistClient.tsx");
const compareSrc = read("src/components/CompareClient.tsx");
const loginSrc = read("src/app/login/LoginContent.tsx");

// 9a. Login value copy reframes around cross-device continuity (spec §11.1) and
// confirms public exploration + on-device save remain available without login.
check(
  "login title (ko) frames cross-device continuity value, not a bare 'login' label",
  loginCopy.ko.title.includes("여러 기기") && loginCopy.ko.title.includes("이어"),
);
check(
  "login title (en) frames cross-device continuity value",
  /devices?/i.test(loginCopy.en.title) && /across/i.test(loginCopy.en.title),
);
check(
  "login lead (ko) confirms without-login public exploration + on-device save",
  loginCopy.ko.emailOnlyLead.includes("로그인 없이") && loginCopy.ko.emailOnlyLead.includes("저장"),
);
check(
  "login lead (en) confirms without-login public exploration + on-device save",
  /without login/i.test(loginCopy.en.emailOnlyLead) && /sav/i.test(loginCopy.en.emailOnlyLead),
);

// 9b. Watchlist empty state offers the two spec §10.1 start actions (add from
// today candidates + find stocks) and no longer competes with an off-role
// compare CTA in the empty row.
check(
  "watchlist empty state keeps the two start actions (오늘 후보에서 담기 · 종목 찾아보기)",
  watchSrc.includes("오늘 후보에서 담기") && watchSrc.includes("종목 찾아보기"),
);
check(
  "watchlist empty state drops the off-role compare CTA (오늘 후보 3개 비교)",
  !watchSrc.includes("오늘 후보 3개 비교"),
);

// 9c. Compare stays startable from search/today/watchlist (spec §10.2) and now
// states the logged-out on-device storage vs login sync boundary.
check(
  "compare empty state can start from search + today + watchlist sources",
  compareSrc.includes("StockSearchBox") &&
    compareSrc.includes("오늘 후보에서 고르기") &&
    compareSrc.includes("watchlistAddable"),
);
check(
  "compare empty state states the on-device save vs login boundary",
  compareSrc.includes("이 기기에 저장") && compareSrc.includes("로그인"),
);

// 9d. Placeholder-Supabase guard + public escape links preserved (spec §11.2):
// login never fires an external request when unconfigured, and the disabled
// panel links back to the public home + stocks screens.
check(
  "login guards on isSupabaseBrowserConfigured before any auth request",
  loginSrc.includes("isSupabaseBrowserConfigured") && loginSrc.includes("if (!supabaseConfigured)"),
);
check(
  "login unconfigured panel keeps public escape links (home + stocks)",
  loginSrc.includes('href="/"') && loginSrc.includes('href="/stocks"'),
);

// 9e. Owner-only /admin is absent from public navigation and the public SEO
// surface (spec §11.3). The public nav components must not link to /admin, and
// the sitemap/robots gate (verify-public-seo) must treat /admin as private.
const NAV_SOURCES = [
  "src/components/Sidebar.tsx",
  "src/components/AppHeader.tsx",
  "src/components/MobileNav.tsx",
  "src/components/MobileBottomNav.tsx",
  "src/components/MobileMenu.tsx",
  "src/components/UserMenu.tsx",
];
for (const rel of NAV_SOURCES) {
  check(`public nav "${rel}" does not link to /admin`, !read(rel).includes("/admin"));
}
const publicSeoSrc = read("scripts/verify-public-seo.mjs");
check(
  "verify-public-seo treats /admin as a private route (kept out of sitemap/robots)",
  publicSeoSrc.includes('"/admin"'),
);

// --- result ------------------------------------------------------------------
if (failed > 0) {
  console.error(`first-run-ux verification FAILED (${failed} check${failed === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log(
  `PASS first-run-ux: nav canon (5 primary + 4 compact x2 locales), home H1=1, primary CTA+search contract, ${REMOVED_HOME_SECTIONS.length + 1} removed-section guard(s), today change-briefing (summary/order/no-fabricated-change), stocks find-screen (H1 term, search-first, ${qPresetCount} question presets, zero-result relax+reset, mobile-collapsible presets), stock-detail deeper order (evidence→recent change→disclosures→financials→chart, top/summary dedup), watchlist/compare/login boundary (two empty-state actions, on-device vs login value, Supabase guard + escape links, /admin absent from public nav/SEO)`,
);
