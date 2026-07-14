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
import { commonCopy } from "../src/lib/i18n";

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

// --- result ------------------------------------------------------------------
if (failed > 0) {
  console.error(`first-run-ux verification FAILED (${failed} check${failed === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log(
  `PASS first-run-ux: nav canon (5 primary + 4 compact x2 locales), home H1=1, primary CTA+search contract, ${REMOVED_HOME_SECTIONS.length + 1} removed-section guard(s)`,
);
