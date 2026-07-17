// OrnScore SEO release gate — Slice E of docs/ornscore-seo-authority-plan-2026-07-18.md.
//
// WHY THIS EXISTS
// ---------------
// Slices A–D built the search surface (contract registry, real-data topics + legacy
// theme retirement, curated /compare/[pair] landings, env-driven ownership tags).
// Several finite local gates already exist (test:seo-contract, verify:stocks-seo,
// verify:public-seo, test:comparison-pages). This is the ONE release DECISION that
// runs them together against a local production server AND adds the missing
// publication proof: the live build actually serves the exact commit we intend to
// deploy. It answers a single question before search-engine submission:
//
//   "Is every indexable URL backed by real data, owned by exactly one canonical
//    intent, reachable through server-rendered links, emitting stable metadata and
//    the right JSON-LD/noindex rules — AND is the running server the EXACT commit
//    SHA I am about to publish?"
//
// WHAT IT COVERS (all finite, all local)
//   1. contract integrity     — reuses verifySeoContract() (Slice A source of truth):
//                               canonical ownership, mock-backed indexing exclusions,
//                               curated pair allowlist, legacy-theme migration map.
//   2. robots.txt             — reuses verify-public-seo checkRobots().
//   3. sitemap.xml            — reuses verify-public-seo checkSitemap() + a contract⇄
//                               sitemap drift check (curated pairs + topics present,
//                               legacy /theme/* absent).
//   4. topic authority        — every real /topics/* is 200, self-canonical, indexable,
//                               emits CollectionPage JSON-LD, links real /stock/ pages.
//   5. retired theme behavior — active legacy /theme/* permanently redirect (308) to
//                               their /topics/*; the mock-only theme (robot) is noindex,
//                               not self-canonical, and exposes no mock stocks to index.
//   6. curated comparisons    — each of the seven /compare/<pair> is 200, self-canonical,
//                               indexable, emits BreadcrumbList JSON-LD, links both
//                               stocks + the interactive compare view, and its title +
//                               description equal the STABLE (volatile-free) metadata.
//   7. arbitrary pair exclusion — reverse/arbitrary /compare/* are noindex and NOT
//                               self-canonical (no alternate indexable page).
//   8. metadata volatility    — no price/score value leaks into any title/description.
//   9. deployment-marker SHA  — reuses buildExpected()/runCanary()/extractBuildMarker()
//                               (Slice B route/marker helpers). A MISSING or STALE
//                               expected SHA is a HARD FAILURE for publication, never a
//                               warning: the gate must prove the live footer build
//                               marker equals the expected commit before submission.
//
// SAFETY: it only MEASURES an already-running local server with bounded read-only GETs
// (reusing the Slice B bounded fetch). It never starts/stops a server (protects the
// always-on AI Center listener on :4310), reads no secrets, sends no cookies, calls no
// live Search Console / Search Advisor API, and refuses to print secret-shaped evidence.
// Like its sibling gates it prints a table and sets a non-zero exit code on any failure.
//
// USAGE (one documented command, against a local production build):
//   npm run build
//   VERCEL_GIT_COMMIT_SHA=$(git rev-parse HEAD) npx next start -p 4473
//   npm run verify:seo-release -- --base http://localhost:4473 --sha $(git rev-parse HEAD)
// A missing/invalid --sha fails the publication decision (exit 1) by design.
//
// The pure evaluators + decideMarker + decideRelease are exported for the finite
// offline self-test (scripts/test_seoRelease.ts), which drives them with positive and
// negative fixtures (stale SHA, duplicate canonical ownership, mock-backed indexing,
// arbitrary pair exposure, volatile metadata) and a task-owned loopback mock server.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Reuse the Slice B route + deployment-marker helpers (bounded fetch, expected-state
// derivation, the route canary, and the footer build-marker extractor) instead of
// re-implementing any of them, so this gate is held to the same bounds and marker
// contract as every other route artifact.
import {
  fetchBounded,
  buildExpected,
  runCanary,
  DEFAULT_ROUTES,
  DEFAULT_BOUNDS as CANARY_BOUNDS,
} from "./verify-route-canary.mjs";
// Reuse the public SEO robots/sitemap contract (single source of truth for the two
// site-wide crawl-control files) rather than duplicating the parse/check logic.
import {
  checkRobots,
  checkSitemap,
  checkCrossConsistency,
  sitemapLocs,
  pathOf,
} from "./verify-public-seo.mjs";
// Reuse the framework-baseline secret detector so no credential-shaped value is printed.
import { looksLikeSecret } from "./verify-framework-baseline.mjs";

// Slice A source of truth + Slice C stable metadata (imported, never duplicated).
import {
  defaultContractInput,
  verifySeoContract,
  curatedComparisonPaths,
  CURATED_COMPARISON_PAIRS,
  legacyThemeRedirects,
  LEGACY_THEME_MIGRATION,
  indexableTopicSlugs,
  type ContractViolation,
} from "@/lib/seoContract";
import { comparisonMetadata } from "@/lib/comparison";

const SITE = "https://ornscore.com";

// ---------------------------------------------------------------------------
// bounded fetch wrapper (reuses Slice B fetchBounded + a shared request counter)
// ---------------------------------------------------------------------------
export interface FetchResult {
  ok: boolean; // transport succeeded (a 2xx/3xx/4xx response was read)
  status: number | null;
  body: string;
  chain: { status: number; location: string }[];
  error?: string;
}

// A generous but finite request budget for the whole behavioral sweep (topics +
// comparisons + excluded pairs + themes + robots/sitemap). The marker canary uses
// its own internal counter/bounds.
const HTTP_BOUNDS = Object.freeze({ ...CANARY_BOUNDS, maxRequests: 200 });

async function getPath(base: string, path: string, counter: { requests: number }): Promise<FetchResult> {
  let resp: {
    outcome: string;
    finalStatus?: number;
    chain?: { status: number; location: string }[];
    body?: string;
    message?: string;
  };
  try {
    resp = await fetchBounded(base + path, HTTP_BOUNDS, counter);
  } catch (err) {
    return { ok: false, status: null, body: "", chain: [], error: String((err as Error)?.message ?? err) };
  }
  if (resp.outcome === "timeout" || resp.outcome === "dns_tls_http") {
    return { ok: false, status: null, body: "", chain: resp.chain ?? [], error: resp.message ?? resp.outcome };
  }
  return {
    ok: true,
    status: typeof resp.finalStatus === "number" ? resp.finalStatus : null,
    body: resp.body ?? "",
    chain: resp.chain ?? [],
  };
}

// ---------------------------------------------------------------------------
// pure HTML head/body helpers (exported for the self-test). These read the pieces
// the reused helpers do not expose (noindex, canonical href, meta description,
// JSON-LD @type set, server-rendered link hrefs).
// ---------------------------------------------------------------------------
export function headOf(html: string): string {
  const m = html.match(/<head[\s\S]*?<\/head>/i);
  return m ? m[0] : html;
}

export function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tagAttr(tag: string, attr: string): string | null {
  const m = tag.match(new RegExp(`\\s${attr}=["']([^"']*)["']`, "i"));
  return m ? decodeHtml(m[1]) : null;
}

export function extractTitle(html: string): string | null {
  const m = headOf(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeHtml(m[1].trim()) : null;
}

export function robotsContent(html: string): string | null {
  const m = headOf(html).match(/<meta[^>]*name=["']robots["'][^>]*>/i);
  if (!m) return null;
  return (tagAttr(m[0], "content") ?? "").toLowerCase();
}

export function isNoindex(html: string): boolean {
  const c = robotsContent(html);
  return c != null && c.includes("noindex");
}

export function canonicalHref(html: string): string | null {
  const m = headOf(html).match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  return tagAttr(m[0], "href") ?? "";
}

export function metaDescription(html: string): string | null {
  const tags = headOf(html).match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = (tagAttr(tag, "name") ?? tagAttr(tag, "property") ?? "").toLowerCase();
    if (name === "description") return tagAttr(tag, "content") ?? "";
  }
  return null;
}

// Every @type string anywhere in the page's JSON-LD graphs.
export function jsonLdTypes(html: string): string[] {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (!node || typeof node !== "object") return;
    const rec = node as Record<string, unknown>;
    const t = rec["@type"];
    if (typeof t === "string") out.push(t);
    else if (Array.isArray(t)) for (const s of t) if (typeof s === "string") out.push(s);
    for (const k of Object.keys(rec)) if (k !== "@type") walk(rec[k]);
  };
  const scripts = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of scripts) {
    const raw = decodeHtml(m[1].trim());
    if (!raw) continue;
    try {
      walk(JSON.parse(raw));
    } catch {
      /* ignore unrelated malformed JSON-LD; callers assert the type they need is present */
    }
  }
  return out;
}

// Every href in the page body (server-rendered internal links).
export function bodyLinks(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*\shref=["']([^"']+)["']/gi)) out.push(decodeHtml(m[1]));
  return out;
}

// Volatile-metadata detector: a stable SEO title/description must not carry a price
// (72,000원 / 72000 won), a score (87점 / "점수 87"), a percentage, or a multiplier
// (12.3배) — those change with every data refresh and would churn the canonical text.
// Six-digit stock tickers and the neutral 0~100 metric-name mentions are allowed via
// the caller comparing against the KNOWN stable string; this scanner is the extra
// tripwire for free-form text.
const VOLATILE_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "원 price", re: /\d[\d,]*\s*원/ },
  { label: "억/조 amount", re: /\d[\d,.]*\s*(?:억원|조원|억|조)/ },
  { label: "점 score", re: /\d+\s*점/ },
  { label: "배 multiple", re: /\d+(?:\.\d+)?\s*배/ },
  { label: "percent", re: /\d+(?:\.\d+)?\s*%/ },
];

export function volatileHits(text: string): string[] {
  if (!text) return [];
  return VOLATILE_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.label);
}

// ---------------------------------------------------------------------------
// check result type
// ---------------------------------------------------------------------------
export interface CheckResult {
  label: string;
  ok: boolean;
  reasons: string[];
}

function result(label: string, reasons: string[]): CheckResult {
  return { label, ok: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// pure evaluators (exported for the self-test — drive with fixture HTML)
// ---------------------------------------------------------------------------

// Static contract integrity (reuses verifySeoContract). Optionally accepts the live
// sitemap static paths to also assert drift. Returns violation code:detail strings.
export function evalContract(sitemapStaticPaths?: string[]): string[] {
  const input = defaultContractInput();
  const violations: ContractViolation[] = verifySeoContract(
    sitemapStaticPaths ? { ...input, sitemapStaticPaths } : input,
  );
  return violations.map((v) => `${v.code}: ${v.detail}`);
}

// Contract ⇄ live-sitemap drift for the dynamic families: every curated comparison
// path and every real topic must be present; no legacy /theme/* may appear.
export function evalSitemapContractDrift(sitemapPaths: string[]): string[] {
  const reasons: string[] = [];
  const set = new Set(sitemapPaths);
  for (const p of curatedComparisonPaths()) {
    if (!set.has(p)) reasons.push(`curated comparison "${p}" missing from sitemap`);
  }
  for (const slug of indexableTopicSlugs()) {
    if (!set.has(`/topics/${slug}`)) reasons.push(`real topic "/topics/${slug}" missing from sitemap`);
  }
  for (const p of sitemapPaths) {
    if (p === "/theme" || p.startsWith("/theme/")) reasons.push(`retired legacy theme "${p}" present in sitemap`);
  }
  return reasons;
}

// A real, indexable topic landing page.
export function evalTopic(html: string, slug: string, status: number | null): string[] {
  const reasons: string[] = [];
  if (status !== 200) reasons.push(`status ${status} (expected 200)`);
  if (!extractTitle(html)) reasons.push("missing non-empty <title>");
  if (isNoindex(html)) reasons.push("noindex on a real topic (must be indexable)");
  const canon = canonicalHref(html);
  const want = `${SITE}/topics/${slug}`;
  if (canon !== want) reasons.push(`canonical "${canon ?? "(none)"}" != self "${want}"`);
  if (!jsonLdTypes(html).includes("CollectionPage")) reasons.push("missing CollectionPage JSON-LD");
  if (!bodyLinks(html).some((h) => h.startsWith("/stock/") || h.includes("/stock/")))
    reasons.push("no server-rendered /stock/ links (topic not backed by real stocks)");
  const desc = metaDescription(html) ?? "";
  const vh = volatileHits(desc);
  if (vh.length) reasons.push(`volatile value(s) in description [${vh.join(", ")}]`);
  return reasons;
}

// A curated comparison landing page (must match the STABLE Slice C metadata exactly).
export function evalCuratedComparison(
  html: string,
  slug: string,
  status: number | null,
  expected: { title: string; description: string; a: string; b: string; interactive: string },
): string[] {
  const reasons: string[] = [];
  if (status !== 200) reasons.push(`status ${status} (expected 200)`);
  if (isNoindex(html)) reasons.push("noindex on a curated comparison (must be indexable)");
  const canon = canonicalHref(html);
  const want = `${SITE}/compare/${slug}`;
  if (canon !== want) reasons.push(`canonical "${canon ?? "(none)"}" != self "${want}"`);
  const title = extractTitle(html);
  if (title !== expected.title) reasons.push(`title "${title ?? "(none)"}" != stable "${expected.title}"`);
  const desc = metaDescription(html);
  if (desc !== expected.description) reasons.push(`description drifted from stable metadata`);
  for (const t of [title ?? "", desc ?? ""]) {
    const vh = volatileHits(t);
    if (vh.length) reasons.push(`volatile value(s) in metadata [${vh.join(", ")}]`);
  }
  if (!jsonLdTypes(html).includes("BreadcrumbList")) reasons.push("missing BreadcrumbList JSON-LD");
  const links = bodyLinks(html);
  if (!links.some((h) => h.includes(`/stock/${expected.a}`))) reasons.push(`missing link to /stock/${expected.a}`);
  if (!links.some((h) => h.includes(`/stock/${expected.b}`))) reasons.push(`missing link to /stock/${expected.b}`);
  if (!links.some((h) => h.includes(expected.interactive))) reasons.push(`missing interactive compare link ${expected.interactive}`);
  return reasons;
}

// A non-curated (arbitrary or reverse-order) comparison slug must NOT become an
// alternate indexable page: it is noindex AND not self-canonical.
export function evalExcludedComparison(html: string, slug: string, status: number | null): string[] {
  const reasons: string[] = [];
  if (status === null) reasons.push("no response");
  if (!isNoindex(html)) reasons.push("arbitrary/reverse pair is NOT noindex (would be indexable)");
  const canon = canonicalHref(html);
  const self = `${SITE}/compare/${slug}`;
  if (canon === self) reasons.push(`arbitrary/reverse pair has self-canonical "${self}" (alternate canonical)`);
  return reasons;
}

// The mock-only legacy theme (robot): 200, noindex, not self-canonical, and NOT
// exposing mock stocks as public evidence (renders the "not indexed" empty state).
export function evalThemeNoindex(html: string, slug: string, status: number | null): string[] {
  const reasons: string[] = [];
  if (status !== 200) reasons.push(`status ${status} (expected 200)`);
  if (!isNoindex(html)) reasons.push("mock-only theme is NOT noindex (mock stocks would be indexable)");
  const canon = canonicalHref(html);
  const self = `${SITE}/theme/${slug}`;
  if (canon === self) reasons.push(`mock-only theme has self-canonical "${self}"`);
  return reasons;
}

// An active legacy theme must permanently redirect to its authoritative topic.
export function evalRedirect(chain: { status: number; location: string }[], to: string): string[] {
  const reasons: string[] = [];
  const first = chain[0];
  if (!first) return [`expected permanent redirect to "${to}" but got no redirect`];
  if (first.status !== 301 && first.status !== 308) reasons.push(`redirect status ${first.status} (expected 301/308 permanent)`);
  let got = first.location;
  try {
    got = new URL(first.location, "http://x").pathname;
  } catch {
    got = first.location.split("?")[0];
  }
  const norm = (p: string) => p.replace(/\/+$/, "") || "/";
  if (norm(got) !== norm(to)) reasons.push(`redirect to "${got}" != expected "${to}"`);
  return reasons;
}

// ---------------------------------------------------------------------------
// deployment-marker SHA decision (reuses the runCanary report; see main()).
// A missing expected SHA or a stale/absent live marker is a HARD failure.
// ---------------------------------------------------------------------------
export interface CanaryReportLike {
  summary: { total: number; ok: number; failed: number; byClass: Record<string, number> };
  routes: { path: string; class: string; failures: { class: string; message: string }[] }[];
}

export function decideMarker(input: {
  shaProvided: boolean;
  canary: CanaryReportLike | null;
}): { ok: boolean; reason: string } {
  if (!input.shaProvided) {
    return { ok: false, reason: "no expected deployment SHA (--sha) — cannot verify the live build marker before publication" };
  }
  const canary = input.canary;
  if (!canary) return { ok: false, reason: "marker canary did not run" };
  if ((canary.summary.byClass.stale_marker ?? 0) > 0) {
    return { ok: false, reason: "STALE build served: live footer marker != expected SHA (an old build is still live)" };
  }
  const markerAbsent = canary.routes.some((r) => r.failures.some((f) => /marker absent/i.test(f.message)));
  if (markerAbsent) {
    return { ok: false, reason: "footer build marker ABSENT — start the server with VERCEL_GIT_COMMIT_SHA=<sha> so the deployed commit is provable" };
  }
  if (canary.summary.failed > 0) {
    return { ok: false, reason: "route canary reported failures (date/version/canonical/transport) — live surface not release-clean" };
  }
  return { ok: true, reason: "live footer build marker equals the expected deployment SHA on every checked route" };
}

// Overall release decision.
export function decideRelease(checks: CheckResult[]): boolean {
  return checks.length > 0 && checks.every((c) => c.ok);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function argValue(flag: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

function redact(u: string): string {
  try {
    const url = new URL(u);
    url.username = "";
    url.password = "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return u;
  }
}

// Run the COMPLETE release decision in-process (exported so the self-test can drive it
// end-to-end against a task-owned loopback mock, exactly like the continuity gates).
export async function runSeoRelease(opts: {
  base: string;
  sha: string;
  dataPath: string;
}): Promise<{ checks: CheckResult[]; canary: CanaryReportLike | null; released: boolean; shaValid: boolean; robotsOk: boolean; sitemapOk: boolean }> {
  const base = opts.base.replace(/\/+$/, "");
  const rawSha = (opts.sha || "").trim().toLowerCase();
  const shaValid = /^[0-9a-f]{7,40}$/.test(rawSha);
  const dataPath = opts.dataPath;

  const checks: CheckResult[] = [];
  const counter = { requests: 0 };

  // (1) static contract integrity — canonical ownership, mock-backed indexing
  // exclusions, curated pair allowlist, legacy-theme migration map.
  let sitemapPaths: string[] = [];

  // Fetch the two crawl-control files up front (needed for robots/sitemap + drift).
  const [robotsRes, sitemapRes] = await Promise.all([
    getPath(base, "/robots.txt", counter),
    getPath(base, "/sitemap.xml", counter),
  ]);

  if (sitemapRes.ok) {
    sitemapPaths = sitemapLocs(sitemapRes.body).map((u: string) => pathOf(u)).filter((p: string | null): p is string => !!p);
  }

  // Contract integrity: feed the live static sitemap paths so drift is caught too.
  const staticSitemapPaths = sitemapPaths.filter((p) => defaultContractInput().staticIndexablePaths.includes(p));
  checks.push(result("contract integrity (canonical ownership / mock-backed exclusions / curated pairs / migration map)", evalContract(staticSitemapPaths)));

  // (2) robots.txt
  if (!robotsRes.ok) checks.push(result("robots.txt reachable", [`request failed: ${robotsRes.error}`]));
  else checks.push(result("robots.txt contract", checkRobots(robotsRes.status, robotsRes.body).reasons));

  // (3) sitemap.xml + contract⇄sitemap drift
  if (!sitemapRes.ok) {
    checks.push(result("sitemap.xml reachable", [`request failed: ${sitemapRes.error}`]));
  } else {
    const sm = checkSitemap(sitemapRes.status, sitemapRes.body);
    checks.push(result(`sitemap.xml contract (${sm.locs.length} URLs)`, sm.reasons));
    checks.push(result("sitemap ⇄ contract drift (curated pairs + real topics present, legacy /theme absent)", evalSitemapContractDrift(sitemapPaths)));
    if (robotsRes.ok) {
      const rb = checkRobots(robotsRes.status, robotsRes.body);
      checks.push(result("sitemap/robots cross-consistency", checkCrossConsistency(sm.paths, rb.disallow)));
    }
  }

  // (4) topic authority
  {
    const reasons: string[] = [];
    for (const slug of indexableTopicSlugs()) {
      const res = await getPath(base, `/topics/${slug}`, counter);
      if (!res.ok) {
        reasons.push(`/topics/${slug}: request failed (${res.error})`);
        continue;
      }
      for (const r of evalTopic(res.body, slug, res.status)) reasons.push(`/topics/${slug}: ${r}`);
    }
    checks.push(result(`topic authority (${indexableTopicSlugs().length} real topics: indexable, self-canonical, CollectionPage JSON-LD, real stock links)`, reasons));
  }

  // (5) retired theme behavior — active redirects (308 → /topics/*)
  {
    const reasons: string[] = [];
    for (const { from, to } of legacyThemeRedirects()) {
      const res = await getPath(base, from, counter);
      if (!res.ok) {
        reasons.push(`${from}: request failed (${res.error})`);
        continue;
      }
      for (const r of evalRedirect(res.chain, to)) reasons.push(`${from}: ${r}`);
    }
    checks.push(result(`legacy theme redirects (${legacyThemeRedirects().length} permanent 308 → /topics/*)`, reasons));
  }

  // (5b) retired theme behavior — mock-only noindex themes (robot)
  {
    const reasons: string[] = [];
    const noindexThemes = Object.entries(LEGACY_THEME_MIGRATION)
      .filter(([, d]) => d.kind === "noindex")
      .map(([slug]) => slug);
    for (const slug of noindexThemes) {
      const res = await getPath(base, `/theme/${slug}`, counter);
      if (!res.ok) {
        reasons.push(`/theme/${slug}: request failed (${res.error})`);
        continue;
      }
      for (const r of evalThemeNoindex(res.body, slug, res.status)) reasons.push(`/theme/${slug}: ${r}`);
    }
    checks.push(result(`mock-only theme noindex (${noindexThemes.length}: no mock stock exposed to index)`, reasons));
  }

  // (6) curated comparison landings
  {
    const reasons: string[] = [];
    for (const pair of CURATED_COMPARISON_PAIRS) {
      const meta = comparisonMetadata(pair.slug);
      if (!meta) {
        reasons.push(`/compare/${pair.slug}: comparisonMetadata() returned null (registry/data mismatch)`);
        continue;
      }
      const res = await getPath(base, `/compare/${pair.slug}`, counter);
      if (!res.ok) {
        reasons.push(`/compare/${pair.slug}: request failed (${res.error})`);
        continue;
      }
      const expected = {
        title: meta.title,
        description: meta.description,
        a: pair.a,
        b: pair.b,
        interactive: `/compare?stocks=${pair.a},${pair.b}`,
      };
      for (const r of evalCuratedComparison(res.body, pair.slug, res.status, expected)) reasons.push(`/compare/${pair.slug}: ${r}`);
    }
    checks.push(result(`curated comparisons (${CURATED_COMPARISON_PAIRS.length}: indexable, self-canonical, stable metadata, BreadcrumbList JSON-LD, stock + interactive links)`, reasons));
  }

  // (7) arbitrary / reverse pair exclusion
  {
    const reasons: string[] = [];
    const first = CURATED_COMPARISON_PAIRS[0];
    const excluded = [
      { slug: `${first.a}-vs-035420`, kind: "arbitrary" }, // 035420 (NAVER) not paired with 005930
      { slug: `${first.b}-vs-${first.a}`, kind: "reverse" }, // reverse order of a curated pair
    ];
    for (const { slug, kind } of excluded) {
      const res = await getPath(base, `/compare/${slug}`, counter);
      if (!res.ok) {
        reasons.push(`/compare/${slug} (${kind}): request failed (${res.error})`);
        continue;
      }
      for (const r of evalExcludedComparison(res.body, slug, res.status)) reasons.push(`/compare/${slug} (${kind}): ${r}`);
    }
    checks.push(result("arbitrary/reverse pair exclusion (noindex + no alternate self-canonical)", reasons));
  }

  // (8) deployment-marker SHA match (reuses buildExpected + runCanary + the footer
  //     marker extractor). Missing or stale SHA is a HARD failure for publication.
  let canary: CanaryReportLike | null = null;
  if (shaValid) {
    try {
      const expected = buildExpected(dataPath, rawSha.slice(0, 7));
      canary = (await runCanary({ base, routes: DEFAULT_ROUTES, expected, bounds: CANARY_BOUNDS })) as unknown as CanaryReportLike;
    } catch (err) {
      canary = null;
      checks.push(result("deployment marker canary setup", [String((err as Error)?.message ?? err)]));
    }
  }
  const marker = decideMarker({ shaProvided: shaValid, canary });
  checks.push(result("deployment-marker SHA match (live footer build marker == expected commit)", marker.ok ? [] : [marker.reason]));

  return { checks, canary, released: decideRelease(checks), shaValid, robotsOk: robotsRes.ok, sitemapOk: sitemapRes.ok };
}

async function main(): Promise<void> {
  const base = (argValue("--base", process.env.VERIFY_BASE_URL) || "http://localhost:4473").replace(/\/+$/, "");
  const rawSha = (argValue("--sha", process.env.VERIFY_EXPECT_SHA) || "").trim().toLowerCase();
  const shaValid = /^[0-9a-f]{7,40}$/.test(rawSha);
  const dataPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "data", "stocks.json");

  console.log("OrnScore SEO release gate (finite, local; exits 1 on any failure or a missing/stale deployment SHA)");
  console.log(`base=${redact(base)}  sha=${shaValid ? rawSha.slice(0, 7) : "(missing/invalid)"}  (no live Search Console / no crawl / no server start)`);
  console.log("");

  const { checks, canary, released, robotsOk, sitemapOk } = await runSeoRelease({ base, sha: rawSha, dataPath });

  // No credential-shaped value may survive into the emitted evidence.
  if (looksLikeSecret(JSON.stringify(checks))) {
    console.error("FAIL: emitted evidence contains a secret-looking value; refusing to print.");
    process.exit(1);
  }

  for (const c of checks) {
    console.log(`${c.ok ? "OK  " : "FAIL"}  ${c.label}`);
    if (!c.ok) for (const r of c.reasons) console.log(`        ${r}`);
  }
  console.log("");
  if (canary) {
    console.log(`Route/marker canary: ${canary.summary.ok}/${canary.summary.total} routes OK  by-class: ${Object.entries(canary.summary.byClass).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  }
  if (!robotsOk || !sitemapOk) {
    console.log(`Could not reach robots/sitemap — is a production server running at ${redact(base)}?`);
    console.log("Hint: npm run build && VERCEL_GIT_COMMIT_SHA=$(git rev-parse HEAD) npx next start -p 4473");
  }

  const passed = checks.filter((c) => c.ok).length;
  console.log(`Summary: ${passed}/${checks.length} checks OK.`);
  console.log(released ? "SEO RELEASE GATE PASSED — the local build is publication-consistent for the expected SHA." : "SEO RELEASE GATE FAILED — do NOT publish/submit until every check is OK.");
  // Set exitCode and return (do not process.exit) so undici drains its sockets cleanly.
  process.exitCode = released ? 0 : 1;
}

// Only run the CLI when invoked directly, not when imported by the self-test.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
