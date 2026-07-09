// /stocks 필터 URL 의 색인(robots/canonical) 동작 검증 게이트.
//
// generateMetadata({ searchParams }) 가 방출하는 <head> 의 robots meta 와 canonical link 를
// 실제 SSR HTML 에서 확인한다. verify-routes.mjs 는 visible text 만 보므로 head 메타를 못 잡는다 —
// 이 스크립트는 raw HTML 을 파싱해 다음 계약을 강제한다:
//   - 기본 /stocks 와 단일 업종/테마(결과 존재) 페이지는 색인 대상(noindex 아님) + 올바른 canonical.
//   - 0건 조합 / 자유 검색어(q) / 다축 조합 / 과다·미인식 파라미터 URL 은 noindex + canonical=/stocks.
// 이미 실행 중인 서버만 측정하며, 서버를 켜거나 끄지 않는다. 실패 시 exit 1.
//
// Usage:
//   npm run build
//   npx next start -p 4489
//   node scripts/verify-stocks-seo.mjs --base http://localhost:4489
//   # env form (flag wins over env):
//   VERIFY_BASE_URL=http://localhost:4489 node scripts/verify-stocks-seo.mjs

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

const BASE = (argValue("--base", process.env.VERIFY_BASE_URL) || "http://localhost:4489").replace(/\/+$/, "");
const SITE = "https://ornscore.com";

// --- head parsing -----------------------------------------------------------
function headOf(html) {
  const m = html.match(/<head[\s\S]*?<\/head>/i);
  return m ? m[0] : html;
}

// robots meta content (Next emits <meta name="robots" content="noindex, follow"/>).
function robotsContent(html) {
  const head = headOf(html);
  const m = head.match(/<meta[^>]*name=["']robots["'][^>]*>/i);
  if (!m) return null;
  const c = m[0].match(/content=["']([^"']*)["']/i);
  return c ? c[1].toLowerCase() : "";
}

function isNoindex(html) {
  const c = robotsContent(html);
  return c != null && c.includes("noindex");
}

// canonical href (Next emits <link rel="canonical" href="https://ornscore.com/stocks"/>).
function canonicalHref(html) {
  const head = headOf(html);
  const m = head.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  const c = m[0].match(/href=["']([^"']*)["']/i);
  return c ? c[1] : "";
}

// --- expected cases ---------------------------------------------------------
// Each case asserts the intended robots + canonical for one /stocks URL. Values
// come straight from the acceptance checks: normal pages indexable, degenerate
// filter combinations conservative (noindex + canonical=/stocks).
// Real dataset values: "반도체" is a theme; sectorOf() emits the composite "반도체·IT부품".
const VALID_THEME = "반도체";
const VALID_SECTOR = "반도체·IT부품";

const CASES = [
  {
    label: "plain /stocks (baseline, must stay indexable)",
    path: "/stocks",
    expectIndexable: true,
    expectCanonical: `${SITE}/stocks`,
  },
  {
    label: "single valid sector (meaningful simple filter, indexable, self-canonical)",
    path: "/stocks?sector=" + encodeURIComponent(VALID_SECTOR),
    expectIndexable: true,
    expectCanonical: `${SITE}/stocks?sector=${encodeURIComponent(VALID_SECTOR)}`,
  },
  {
    label: "single valid theme (meaningful simple filter, indexable, self-canonical)",
    path: "/stocks?theme=" + encodeURIComponent(VALID_THEME),
    expectIndexable: true,
    expectCanonical: `${SITE}/stocks?theme=${encodeURIComponent(VALID_THEME)}`,
  },
  {
    label: "free-text search q (infinite URL space -> noindex, canonical=/stocks)",
    path: "/stocks?q=" + encodeURIComponent("삼성"),
    expectIndexable: false,
    expectCanonical: `${SITE}/stocks`,
  },
  {
    label: "zero-result theme (nonexistent -> noindex, canonical=/stocks)",
    path: "/stocks?theme=" + encodeURIComponent("존재하지않는테마xyz"),
    expectIndexable: false,
    expectCanonical: `${SITE}/stocks`,
  },
  {
    label: "multi-axis theme+q (2 filter dimensions -> noindex, canonical=/stocks)",
    path: "/stocks?theme=" + encodeURIComponent(VALID_THEME) + "&q=" + encodeURIComponent("삼성"),
    expectIndexable: false,
    expectCanonical: `${SITE}/stocks`,
  },
  {
    label: "valid sector + extra unknown params (over-parameterized -> noindex, canonical=/stocks)",
    path: "/stocks?sector=" + encodeURIComponent(VALID_SECTOR) + "&utm_source=ad&utm_medium=cpc",
    expectIndexable: false,
    expectCanonical: `${SITE}/stocks`,
  },
];

// Choose real theme/sector values from the running server so the "valid single filter"
// cases can't go stale against the dataset. We probe the sector explorer HTML once.
async function fetchHtml(path) {
  // No query-string cache-buster here: the query string IS under test (an extra ?v=
  // token would itself count as an over-parameterized URL). Dynamic /stocks SSR renders
  // per-request, and no-cache headers cover any local caching.
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { "cache-control": "no-cache", pragma: "no-cache", expires: "0" },
  });
  const body = await res.text();
  return { status: res.status, body };
}

async function main() {
  console.log("OrnScore /stocks filter SEO verification (real gate; exits 1 on any failure)");
  console.log(`base=${BASE}  cases=${CASES.length}`);
  console.log("");

  const results = [];
  for (const c of CASES) {
    // eslint-disable-next-line no-await-in-loop
    let status, body;
    try {
      // eslint-disable-next-line no-await-in-loop
      ({ status, body } = await fetchHtml(c.path));
    } catch (err) {
      results.push({ ...c, ok: false, unreachable: true, reasons: [`request failed: ${String(err?.message ?? err)}`] });
      continue;
    }
    const reasons = [];
    if (status !== 200) reasons.push(`status ${status} (expected 200)`);

    const noindex = isNoindex(body);
    if (c.expectIndexable && noindex) reasons.push(`unexpected noindex (robots="${robotsContent(body)}") — must stay indexable`);
    if (!c.expectIndexable && !noindex) reasons.push(`missing noindex (robots="${robotsContent(body)}") — degenerate URL must be noindex`);

    const canonical = canonicalHref(body);
    if (canonical !== c.expectCanonical) reasons.push(`canonical "${canonical}" (expected "${c.expectCanonical}")`);

    results.push({ ...c, ok: reasons.length === 0, status, reasons });
  }

  const anyUnreachable = results.some((r) => r.unreachable);
  for (const r of results) {
    console.log(`${r.ok ? "OK  " : "FAIL"}  ${r.label}`);
    if (!r.ok) for (const reason of r.reasons) console.log(`        ${reason}`);
  }
  console.log("");

  if (anyUnreachable) {
    console.log(`Could not reach one or more URLs -- is a server running at ${BASE}?`);
    console.log("Hint: npm run build && npx next start -p 4489   (then re-run with --base http://localhost:4489)");
  }

  const failed = results.filter((r) => !r.ok);
  const passed = results.length - failed.length;
  console.log(`Summary: ${passed}/${results.length} cases OK.`);
  if (failed.length) {
    console.log("STOCKS SEO VERIFICATION FAILED.");
    process.exit(1);
  }
  console.log("STOCKS SEO VERIFICATION PASSED.");
  process.exit(0);
}

main();
