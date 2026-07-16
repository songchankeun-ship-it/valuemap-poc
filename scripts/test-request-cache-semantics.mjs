// Focused self-test for scripts/verify-request-cache-semantics.mjs (Slice C).
// Proves the pure contract helpers actually catch a synchronous-params regression
// and a silently-undeclared GET handler, accept the correct async/explicit forms,
// and that the REAL repo currently satisfies both contracts.
//
// Offline, deterministic, no network/server. Uses a throwaway temp app tree so the
// synthetic fixtures never touch src/app.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  analyzeAsyncParams,
  classifyRouteHandlers,
  auditGetCacheContract,
  checkAll,
  ROOT,
} from "./verify-request-cache-semantics.mjs";

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}`);
  }
}

// --- fixture builder -------------------------------------------------------
const tmp = mkdtempSync(join(tmpdir(), "ornscore-slicec-"));
function fixture(relPath, content) {
  const abs = join(tmp, relPath);
  mkdirSync(join(abs, ".."), { recursive: true });
  writeFileSync(abs, content, "utf8");
  return abs;
}

// (1) async params — a synchronous params type must be flagged.
const syncPage = fixture("stock/[ticker]/page.tsx", `
interface PageProps { params: { ticker: string }; }
export default async function P({ params }: PageProps) { const { ticker } = params; return ticker; }
`);
// (2) async params — correct Promise + await passes.
const asyncPage = fixture("theme/[slug]/page.tsx", `
interface PageProps { params: Promise<{ slug: string }>; }
export default async function P({ params }: PageProps) { const { slug } = await params; return slug; }
`);
// (3) async params — Promise typed but never awaited must be flagged.
const notAwaited = fixture("topics/[slug]/page.tsx", `
interface PageProps { params: Promise<{ slug: string }>; }
export default async function P({ params }: PageProps) { return String(params); }
`);
// (4) a commented-out sync params must NOT count (strip comments).
const commented = fixture("blog/[slug]/page.tsx", `
// interface PageProps { params: { slug: string }; }
export default function P() { return null; }
`);

const ap = analyzeAsyncParams([syncPage, asyncPage, notAwaited, commented]);
check("flags synchronous params type", ap.violations.some((v) => v.includes("/stock/[ticker]") && v.includes("synchronously")));
check("accepts Promise params + await", !ap.violations.some((v) => v.includes("/theme/[slug]")));
check("flags Promise params never awaited", ap.violations.some((v) => v.includes("/topics/[slug]") && v.includes("never awaited")));
check("ignores commented-out sync params", !ap.violations.some((v) => v.includes("/blog/[slug]")));
// Fixtures live in a temp dir (not the real src/app), so urlFromFile prefixes the
// tmp path; assert on the meaningful suffix + prop rather than the exact URL.
check("records covered Promise props", ap.covered.some((c) => c.url.includes("/theme/[slug]") && c.prop === "params"));

// (5) GET cache contract — undeclared, no dynamic input => flagged.
const bareGet = fixture("api/constant/route.ts", `
import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ ok: true }); }
`);
// (6) reads dynamic input (req.url) => OK without declaration.
const dynGet = fixture("api/search/route.ts", `
export async function GET(req: Request) { const u = new URL(req.url); return Response.json({ q: u.searchParams.get("q") }); }
`);
// (7) declares force-static => OK.
const staticGet = fixture("api/themes/route.ts", `
export const dynamic = "force-static";
export async function GET() { return Response.json({ items: [] }); }
`);
// (8) POST-only handler is not a GET cache concern.
const postOnly = fixture("api/waitlist/route.ts", `
export async function POST(req: Request) { return Response.json({ ok: true }); }
`);

const rows = classifyRouteHandlers([bareGet, dynGet, staticGet, postOnly]);
const getViol = auditGetCacheContract(rows);
check("flags undeclared no-input GET handler", getViol.some((v) => v.includes("/api/constant")));
check("accepts GET that reads dynamic input", !getViol.some((v) => v.includes("/api/search")));
check("accepts GET with force-static declaration", !getViol.some((v) => v.includes("/api/themes")));
check("POST-only handler is not classified as GET", !rows.some((r) => r.url === "/api/waitlist"));
check("dynamic-input row is marked readsDynamicInput", rows.find((r) => r.url.includes("/api/search"))?.readsDynamicInput === true);
check("force-static row records cacheMode", rows.find((r) => r.url.includes("/api/themes"))?.cacheMode === "force-static");

rmSync(tmp, { recursive: true, force: true });

// (9) THE REAL REPO must satisfy both contracts right now.
const real = checkAll(ROOT);
check("real repo: zero async-params violations", real.asyncParams.violations.length === 0);
check("real repo: zero GET cache-contract violations", real.getViolations.length === 0);
check("real repo: /api/themes GET declares force-static", real.getRows.some((r) => r.url === "/api/themes" && r.cacheMode === "force-static"));
check("real repo: at least one Promise-typed request prop covered", real.asyncParams.covered.length >= 5);

console.log(`\n${pass}/${pass + fail} checks passed.`);
process.exit(fail ? 1 : 0);
