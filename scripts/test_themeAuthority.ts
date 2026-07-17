// 실데이터 topic authority + 레거시 theme 은퇴 계약(정적·유한) — SEO authority Slice B.
// 실행: npx tsx scripts/test_themeAuthority.ts — 성공 시 PASS 1줄, 실패 시 FAIL 후 비정상 종료.
//
// 이 테스트가 고정하는 것:
//   1) bio-stocks / shipbuilding-stocks topic 이 실데이터(realStockPool)로 뒷받침되고
//      seoTopics 에 실재한다(모의 종목 아님).
//   2) 레거시 theme 은퇴: battery·semi-materials·bio·shipbuilding 은 authoritative
//      /topics/* 로 영구(308) 리다이렉트되고(next.config), robot 은 리다이렉트 없이
//      noindex 로만 남는다. next.config 리다이렉트 목록 = seoContract 정본과 정합.
//   3) 은퇴한 /theme/* 은 sitemap 에서 완전히 제거된다(모의 종목/집계를 색인 근거로 노출 금지).
//   4) 레거시 theme 라우트는 실데이터만 렌더한다(모의 폴백 없음). noindex 처리/실매칭 0건이면
//      메타가 index:false 를 방출하고, self-canonical 을 두지 않는다(동작 검증).
// 점수식·데이터·공개 재무 계산은 바꾸지 않는다(계약·라우트 은퇴만).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getSeoTopic, seoTopics } from "../src/lib/seoTopics";
import { realStockPool } from "../src/lib/realStocks";
import {
  LEGACY_THEME_MIGRATION,
  legacyThemeRedirectTarget,
  isNoindexLegacyTheme,
  legacyThemeRedirects,
} from "../src/lib/seoContract";
import { generateMetadata } from "../src/app/theme/[slug]/page";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
function read(rel: string): string {
  return readFileSync(join(repo, rel), "utf8");
}

function esc(s: string): string {
  return s.replace(/[/-]/g, (c) => "\\" + c);
}

async function robotsIndexOf(slug: string): Promise<boolean | undefined> {
  const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
  return (meta as { robots?: { index?: boolean } }).robots?.index;
}

async function main(): Promise<void> {
  const realTickers = new Set(realStockPool.map((s) => s.ticker));

  // ── 1. bio / shipbuilding topic 이 실데이터로 뒷받침된다 ───────────
  for (const slug of ["bio-stocks", "shipbuilding-stocks"]) {
    const topic = getSeoTopic(slug);
    check(`1 topic "${slug}" exists in seoTopics`, topic !== undefined);
    if (!topic) continue;
    const picked = topic.stockSelector();
    check(`1 topic "${slug}" selects >=1 real stock`, picked.length > 0);
    check(
      `1 topic "${slug}" only selects real-universe tickers`,
      picked.every((s) => realTickers.has(s.ticker)),
    );
    check(`1 topic "${slug}" links into the /topics family`, topic.stocksHref.length > 0);
  }

  // bio 는 바이오·제약, shipbuilding 은 조선 실데이터가 실제로 존재해야 한다.
  const bioReal = realStockPool.filter((s) => s.themes.some((t) => t.includes("바이오") || t.includes("제약")));
  const shipReal = realStockPool.filter((s) => s.themes.some((t) => t.includes("조선")));
  check("1 bio has real backing stocks", bioReal.length > 0);
  check("1 shipbuilding has real backing stocks", shipReal.length > 0);

  // ── 2. 레거시 theme 은퇴 처리 맵 ──────────────────────────────────
  check("2 battery -> /topics/battery-stocks", legacyThemeRedirectTarget("battery") === "/topics/battery-stocks");
  check("2 semi-materials -> /topics/semiconductor-stocks", legacyThemeRedirectTarget("semi-materials") === "/topics/semiconductor-stocks");
  check("2 bio -> /topics/bio-stocks", legacyThemeRedirectTarget("bio") === "/topics/bio-stocks");
  check("2 shipbuilding -> /topics/shipbuilding-stocks", legacyThemeRedirectTarget("shipbuilding") === "/topics/shipbuilding-stocks");
  // robot 은 리다이렉트하지 않고 noindex 로만 남는다.
  check("2 robot is NOT redirected", legacyThemeRedirectTarget("robot") === null);
  check("2 robot is noindex", isNoindexLegacyTheme("robot"));
  // 각 리다이렉트 대상 topic 은 실재해야 한다(깨진 이관 금지).
  for (const { from, to } of legacyThemeRedirects()) {
    const slug = to.replace("/topics/", "");
    check(`2 redirect target topic "${slug}" exists (${from} -> ${to})`, getSeoTopic(slug) !== undefined);
  }

  // ── 3. next.config 영구 리다이렉트가 seoContract 정본과 정합 ───────
  const nextConfig = read("next.config.mjs");
  check("3 next.config declares permanent redirects", /permanent:\s*true/.test(nextConfig));
  for (const { from, to } of legacyThemeRedirects()) {
    const declared = new RegExp(`source:\\s*['"]${esc(from)}['"][\\s\\S]{0,120}?destination:\\s*['"]${esc(to)}['"]`);
    check(`3 next.config redirects ${from} -> ${to}`, declared.test(nextConfig));
  }
  // robot 은 next.config 리다이렉트 목록에 없어야 한다.
  check("3 next.config does NOT redirect /theme/robot", !/\/theme\/robot/.test(nextConfig));

  // ── 4. sitemap 에서 은퇴한 /theme/* 완전 제거 ─────────────────────
  const sitemapSrc = read("src/app/sitemap.ts");
  check("4 sitemap emits no /theme/ URL", !/\$\{SITE\}\/theme\//.test(sitemapSrc));
  check("4 sitemap no longer imports mockTopNeglectedThemes", !/mockTopNeglectedThemes/.test(sitemapSrc));
  // 색인 대상 테마 의도는 실데이터 topicPages 가 소유한다.
  check("4 sitemap still emits topic pages", /\$\{SITE\}\/topics\//.test(sitemapSrc));
  const topicSlugs = new Set(seoTopics.map((t) => t.slug));
  check("4 bio-stocks topic will be in sitemap via seoTopics", topicSlugs.has("bio-stocks"));
  check("4 shipbuilding-stocks topic will be in sitemap via seoTopics", topicSlugs.has("shipbuilding-stocks"));

  // ── 5. 레거시 theme 라우트: 실데이터만, 모의 폴백 없음 ────────────
  const themePageSrc = read("src/app/theme/[slug]/page.tsx");
  check("5 theme page does not fall back to mock stocks", !/getStocksInTheme|mockStocksInTheme/.test(themePageSrc));
  check("5 theme page renders only real-universe stocks", /realStockPool\.filter/.test(themePageSrc));
  check("5 theme page permanently redirects retired themes", /permanentRedirect/.test(themePageSrc));
  // 모의 집계(레이더/기간수익률/composite) 렌더를 제거했다.
  check("5 theme page drops mock aggregate radar", !/RadarChart/.test(themePageSrc));
  check("5 theme page drops mock aggregate returns", !/ReturnCell/.test(themePageSrc));
  check("5 theme page has no mock composite/return fields", !/theme\.(compositeScore|return1y|momentum|flow|vol)\b/.test(themePageSrc));

  // ── 6. robot 메타 = noindex (동작 검증) ───────────────────────────
  const robotMeta = await generateMetadata({ params: Promise.resolve({ slug: "robot" }) });
  check("6 robot metadata is noindex", (await robotsIndexOf("robot")) === false);
  check(
    "6 robot metadata drops self-canonical when noindex",
    (robotMeta as { alternates?: { canonical?: string } }).alternates?.canonical === undefined,
  );
  // 리다이렉트 theme 도 색인 대상이 아님(메타도 noindex 신호).
  check("6 battery (redirected) metadata is noindex", (await robotsIndexOf("battery")) === false);

  // ── 7. 자기검증: 계약 정본 자체가 정합 ────────────────────────────
  check("7 all five legacy themes still have a disposition", (() => {
    const keys = Object.keys(LEGACY_THEME_MIGRATION);
    return ["battery", "semi-materials", "bio", "shipbuilding", "robot"].every((s) => keys.includes(s));
  })());

  if (failed > 0) {
    console.error(`\n${failed} check(s) FAILED`);
    process.exit(1);
  }
  console.log(
    "PASS: real-data topic authority (bio-stocks, shipbuilding-stocks) + legacy /theme/* retirement (permanent redirects, robot noindex, sitemap removal, no mock fallback)",
  );
}

main();
