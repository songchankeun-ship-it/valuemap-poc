// Public SEO surface verification for OrnScore launch (release gate).
//
// The automated, repo-local proof that the crawl surface we ship at launch is
// the one we intend: the dynamic /sitemap.xml (src/app/sitemap.ts) and
// /robots.txt (src/app/robots.ts) emit the RIGHT routes, exclude the wrong ones,
// and stay internally consistent. verify:stocks-seo already covers per-page head
// robots/canonical; this gate covers the two SITE-WIDE crawl-control files that
// no other gate parses. It fetches both from an ALREADY-RUNNING server and
// enforces the launch contract:
//
//   SITEMAP (/sitemap.xml)
//     - every important public route is listed (home, today, stocks, compare,
//       disclosures, backtest, guide/metrics, pricing, about, terms, privacy,
//       data-deletion) — a missing one silently drops it from indexing,
//     - the three dynamic families are represented (>=1 each of /stock/,
//       /theme/, /topics/) so the 138 detail pages actually made it in,
//     - NO owner-only / private / API route leaks in (/admin, /login, /auth,
//       /api, /settings, /watchlist, /history) — those must never be advertised
//       to crawlers,
//     - host hygiene: every <loc> is an absolute https://ornscore.com URL (no
//       localhost / http / preview-host leak) and there are no duplicates,
//     - deterministic <lastmod>: one data-derived date for the whole file (never
//       a per-request/build clock) — recomputed from the shipped stocks.json and
//       compared, so a dynamic new Date() leak fails locally (Slice H).
//
//   ROBOTS (/robots.txt)
//     - points crawlers at the canonical sitemap (Sitemap: .../sitemap.xml) and
//       declares the canonical Host,
//     - Allow: / keeps the public site crawlable (no accidental site-wide block),
//     - Disallow covers the private prefixes (/api/, /auth/, /login, /settings/,
//       /watchlist, /history) so logged-in-only surfaces stay out of the index.
//
//   CROSS-CONSISTENCY
//     - nothing robots Disallows may also appear as an indexable <loc> in the
//       sitemap (the "excluded or noindexed" contract, enforced across the two
//       files at once).
//
// It only MEASURES an already-running server; it never starts or stops one
// (protects the always-on AI Center listener on :4310). It reads no secrets,
// sends no cookies, calls no live search/console API, and prints only route
// paths + OK/FAIL + generic reasons. Like its sibling gates it prints a table
// and sets a non-zero exit code on any failure or if the server is unreachable.
//
// Usage:
//   npm run build
//   npx next start -p 4471            # dedicated high port (NOT 3000 / NOT 4310)
//   npm run verify:public-seo -- --base http://localhost:4471
//   # env form (flag wins over env):
//   VERIFY_BASE_URL=http://localhost:4471 node scripts/verify-public-seo.mjs

// --- args -------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

const BASE = (argValue("--base", process.env.VERIFY_BASE_URL) || "http://localhost:4471").replace(/\/+$/, "");
const SITE = "https://ornscore.com";

// --- deterministic lastmod expectation (Slice H) ----------------------------
// The sitemap's <lastmod> must be a pure function of the local dataset, never the
// request/build clock. We recompute the SAME deterministic date the app derives
// (src/app/sitemap.ts deterministicLastModified) straight from the shipped data
// file, then assert every emitted <lastmod> equals it. If a `new Date()` (or any
// per-request value) leaks back in, the emitted lastmod stops matching the data
// date and this gate fails locally.
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = argValue("--data", resolve(__dirname, "..", "public", "data", "stocks.json"));

function expectedLastmodIso() {
  let meta;
  try {
    meta = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return null; // cannot load dataset -> skip strict equality, only structural checks apply
  }
  const iso = meta?.generatedAt;
  if (iso) {
    // Python dataset jobs emit a timezone-less ISO datetime in Korea time.
    // Normalize it explicitly so this verifier agrees across KST local runs
    // and UTC production environments. Explicit Z/offset values stay intact.
    const explicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(iso);
    const localIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(iso);
    const normalized = explicitZone ? iso : localIso ? `${iso}+09:00` : null;
    if (normalized) {
      const d = new Date(normalized);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  const biz = meta?.asOfBusinessDate;
  if (biz && /^\d{8}$/.test(biz)) {
    const d = new Date(`${biz.slice(0, 4)}-${biz.slice(4, 6)}-${biz.slice(6, 8)}T00:00:00+09:00`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

// --- contract ---------------------------------------------------------------
// Important public routes that MUST appear in the sitemap. Kept in sync with the
// staticPages list in src/app/sitemap.ts — a route silently dropped from that
// array would never get indexed, and this is the tripwire.
const REQUIRED_SITEMAP_PATHS = [
  "/",
  "/today",
  "/stocks",
  "/compare",
  "/disclosures",
  "/backtest",
  "/guide/metrics",
  "/pricing",
  "/about",
  "/terms",
  "/privacy",
  "/data-deletion",
];

// The three dynamic route families the sitemap generates from real data. Each
// must contribute at least one URL, proving the data-driven mapping still runs
// (a broken import would yield zero and silently shrink the index).
const REQUIRED_DYNAMIC_PREFIXES = [
  { label: "stock detail (/stock/...)", prefix: "/stock/" },
  { label: "theme (/theme/...)", prefix: "/theme/" },
  { label: "topic (/topics/...)", prefix: "/topics/" },
];

// Owner-only / private / machine routes that must NEVER be advertised to
// crawlers via the sitemap. A <loc> whose path equals one of these or starts
// with "<prefix>/" is a leak. (/admin is guarded server-side and absent from
// robots.ts on purpose, but it must still never appear in the sitemap.)
const FORBIDDEN_SITEMAP_PREFIXES = [
  "/admin",
  "/login",
  "/auth",
  "/api",
  "/settings",
  "/watchlist",
  "/history",
];

// Private prefixes robots.txt must Disallow. Kept in sync with src/app/robots.ts.
const REQUIRED_ROBOTS_DISALLOW = ["/api/", "/auth/", "/login", "/settings/", "/watchlist", "/history"];

// --- fetch ------------------------------------------------------------------
// connection:close so no keep-alive socket lingers into teardown — on Windows a
// lingering handle trips a libuv UV_HANDLE_CLOSING abort at exit, which would
// corrupt the exit code the verify:local orchestrator reads via spawnSync.
async function fetchText(path) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { "cache-control": "no-cache", pragma: "no-cache", expires: "0", connection: "close" },
  });
  const body = await res.text();
  return { status: res.status, body };
}

// --- sitemap parsing --------------------------------------------------------
function sitemapLocs(xml) {
  const out = [];
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
    out.push(
      m[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim(),
    );
  }
  return out;
}

function sitemapLastmods(xml) {
  const out = [];
  for (const m of xml.matchAll(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/gi)) {
    out.push(m[1].trim());
  }
  return out;
}

function pathOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

function matchesPrefix(path, prefix) {
  // "/admin" matches "/admin" and "/admin/anything" but NOT "/administrators".
  return path === prefix || path.startsWith(`${prefix}/`);
}

// --- robots parsing ---------------------------------------------------------
function parseRobots(text) {
  const disallow = [];
  const allow = [];
  let sitemap = null;
  let host = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "disallow") disallow.push(value);
    else if (key === "allow") allow.push(value);
    else if (key === "sitemap") sitemap = value;
    else if (key === "host") host = value;
  }
  return { disallow, allow, sitemap, host };
}

// --- checks -----------------------------------------------------------------
function checkSitemap(status, xml) {
  const reasons = [];
  if (status !== 200) reasons.push(`status ${status} (expected 200)`);

  const locs = sitemapLocs(xml);
  if (locs.length === 0) {
    reasons.push("no <loc> entries parsed — sitemap empty or not XML");
    return { reasons, locs, paths: [] };
  }

  const paths = [];
  const seen = new Set();
  const dupes = new Set();
  for (const url of locs) {
    // Host hygiene: absolute https ornscore.com only, no preview/localhost leak.
    if (!url.startsWith(`${SITE}/`) && url !== SITE) {
      reasons.push(`non-canonical <loc> "${url}" (must be under ${SITE})`);
    }
    if (/^http:\/\//i.test(url) || /localhost|127\.0\.0\.1/i.test(url)) {
      reasons.push(`insecure/local <loc> "${url}"`);
    }
    if (seen.has(url)) dupes.add(url);
    seen.add(url);
    const p = pathOf(url);
    if (p) paths.push(p);
  }
  for (const d of dupes) reasons.push(`duplicate <loc> "${d}"`);

  // Required public routes present.
  const pathSet = new Set(paths);
  for (const req of REQUIRED_SITEMAP_PATHS) {
    if (!pathSet.has(req)) reasons.push(`missing required public route "${req}" from sitemap`);
  }

  // Dynamic families represented.
  for (const { label, prefix } of REQUIRED_DYNAMIC_PREFIXES) {
    if (!paths.some((p) => p.startsWith(prefix))) {
      reasons.push(`no ${label} URLs in sitemap — dynamic mapping produced zero entries`);
    }
  }

  // Private/owner routes must be absent.
  for (const p of paths) {
    for (const bad of FORBIDDEN_SITEMAP_PREFIXES) {
      if (matchesPrefix(p, bad)) reasons.push(`forbidden private route "${p}" leaked into sitemap (matches "${bad}")`);
    }
  }

  // Deterministic <lastmod> (Slice H): every entry must carry the data-derived
  // date, identical across the whole file — never a per-request/build clock value.
  const lastmods = sitemapLastmods(xml);
  if (lastmods.length === 0) {
    reasons.push("no <lastmod> entries parsed — sitemap must carry a deterministic last-modified date");
  } else {
    const uniqueLastmods = [...new Set(lastmods)];
    if (uniqueLastmods.length > 1) {
      reasons.push(`non-uniform <lastmod> values ${JSON.stringify(uniqueLastmods)} — must be one deterministic data-derived date`);
    }
    const expected = expectedLastmodIso();
    if (expected == null) {
      reasons.push(`cannot derive expected lastmod from ${DATA_PATH} — dataset missing generatedAt/asOfBusinessDate`);
    } else {
      const wrong = uniqueLastmods.filter((v) => v !== expected);
      if (wrong.length) {
        reasons.push(`<lastmod> ${JSON.stringify(wrong)} != expected data date "${expected}" — likely a clock or timezone normalization leak`);
      }
    }
  }

  return { reasons, locs, paths };
}

function checkRobots(status, text) {
  const reasons = [];
  if (status !== 200) reasons.push(`status ${status} (expected 200)`);

  const { disallow, allow, sitemap, host } = parseRobots(text);

  // Sitemap pointer.
  if (!sitemap) reasons.push("missing Sitemap directive");
  else if (sitemap.replace(/\/+$/, "") !== `${SITE}/sitemap.xml`) {
    reasons.push(`Sitemap "${sitemap}" (expected "${SITE}/sitemap.xml")`);
  }

  // Canonical host (Next emits the value we pass in robots.ts).
  if (!host) reasons.push("missing Host directive");
  else if (!host.includes("ornscore.com")) reasons.push(`Host "${host}" is not ornscore.com`);

  // Site must stay crawlable — Allow: / present and no site-wide block.
  if (!allow.includes("/")) reasons.push('missing "Allow: /" — public site must stay crawlable');
  if (disallow.includes("/")) reasons.push('"Disallow: /" blocks the entire site');

  // Private prefixes disallowed.
  for (const req of REQUIRED_ROBOTS_DISALLOW) {
    if (!disallow.includes(req)) reasons.push(`missing "Disallow: ${req}" — private surface would be crawlable`);
  }

  return { reasons, disallow, allow, sitemap, host };
}

// robots Disallow paths must not also be advertised as indexable sitemap URLs.
function checkCrossConsistency(sitemapPaths, robotsDisallow) {
  const reasons = [];
  for (const rule of robotsDisallow) {
    if (!rule || rule === "/") continue;
    const norm = rule.replace(/\/+$/, "") || "/";
    for (const p of sitemapPaths) {
      if (matchesPrefix(p, norm)) {
        reasons.push(`sitemap lists "${p}" but robots Disallows "${rule}" — pick one (exclude OR advertise)`);
      }
    }
  }
  return reasons;
}

// --- main -------------------------------------------------------------------
async function main() {
  console.log("OrnScore public SEO surface verification (real gate; exits 1 on any failure)");
  console.log(`base=${BASE}  files=/sitemap.xml,/robots.txt  (no live Search Console / no crawl)`);
  console.log("");

  let sitemapRes;
  let robotsRes;
  let unreachable = false;
  try {
    sitemapRes = await fetchText("/sitemap.xml");
  } catch (err) {
    unreachable = true;
    sitemapRes = { status: "ERR", body: "", error: String(err && err.message ? err.message : err) };
  }
  try {
    robotsRes = await fetchText("/robots.txt");
  } catch (err) {
    unreachable = true;
    robotsRes = { status: "ERR", body: "", error: String(err && err.message ? err.message : err) };
  }

  const results = [];

  if (sitemapRes.error) {
    results.push({ label: "/sitemap.xml reachable", ok: false, reasons: [`request failed: ${sitemapRes.error}`] });
  }
  if (robotsRes.error) {
    results.push({ label: "/robots.txt reachable", ok: false, reasons: [`request failed: ${robotsRes.error}`] });
  }

  let sitemapPaths = [];
  if (!sitemapRes.error) {
    const sm = checkSitemap(sitemapRes.status, sitemapRes.body);
    sitemapPaths = sm.paths;
    results.push({ label: `sitemap.xml contract (${sm.locs.length} URLs)`, ok: sm.reasons.length === 0, reasons: sm.reasons });
  }

  let robotsDisallow = [];
  if (!robotsRes.error) {
    const rb = checkRobots(robotsRes.status, robotsRes.body);
    robotsDisallow = rb.disallow;
    results.push({ label: "robots.txt contract", ok: rb.reasons.length === 0, reasons: rb.reasons });
  }

  if (!sitemapRes.error && !robotsRes.error) {
    const xReasons = checkCrossConsistency(sitemapPaths, robotsDisallow);
    results.push({ label: "sitemap/robots cross-consistency", ok: xReasons.length === 0, reasons: xReasons });
  }

  for (const r of results) {
    console.log(`${r.ok ? "OK  " : "FAIL"}  ${r.label}`);
    if (!r.ok) for (const reason of r.reasons) console.log(`        ${reason}`);
  }
  console.log("");

  if (unreachable) {
    console.log(`Could not reach one or more files -- is a server running at ${BASE}?`);
    console.log("Hint: npm run build && npx next start -p 4471   (then re-run with --base http://localhost:4471)");
  }

  const failed = results.filter((r) => !r.ok);
  const passed = results.length - failed.length;
  console.log(`Summary: ${passed}/${results.length} checks OK.`);
  if (failed.length) {
    console.log("PUBLIC SEO VERIFICATION FAILED.");
    // Set exitCode and return (not process.exit): let the loop drain in-flight
    // sockets cleanly on Windows while still surfacing the non-zero code.
    process.exitCode = 1;
    return;
  }
  console.log("PUBLIC SEO VERIFICATION PASSED.");
  process.exitCode = 0;
}

main();
