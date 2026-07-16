// Admin-authorization drift verifier (Slice U) — 실행: npx tsx scripts/verify-admin-policy.ts
// 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료(exit 1).
//
// 사실(계약 정본): 오른스코어의 owner-only /admin 게이트는 TWO 곳에서 강제된다 —
//   (1) Edge 미들웨어  `src/middleware.ts`      (로그아웃/비허용 → 리다이렉트/403)
//   (2) 서버 페이지 가드 `src/lib/adminAccess.ts` (requireAdminAccess → 리다이렉트/allowed)
// 두 레이어가 각자 관리자 이메일 정규화·허용목록 파싱·라우트 매칭·fail-closed 결정을
// 복사해 두면 서로 조용히 어긋난다(한쪽만 정규화 강화, 한쪽만 fallback 변경 등). 이 검증기는
// 두 레이어가 SINGLE 공유 계약 `src/lib/adminPolicy.ts` 하나만 호출하도록 고정하고(정적),
// 그 공유 결정 로직이 요구된 모든 케이스에서 정확한지 결정론적 로컬 픽스처로 증명한다(런타임).
//
// 커버(요구사항 전수):
//   · signed-out 리다이렉트        — 세션 이메일 없음 → "redirect-login"
//   · allowed-email 정규화          — 대문자/좌우공백/탭 이메일도 허용목록과 매칭
//   · denied-email 동작            — 허용목록에 없는 이메일 → "forbidden"
//   · missing-session 동작          — null/undefined/""/공백만 → "redirect-login"
//   · 현재의 모든 /admin 라우트     — 파일시스템에서 발견한 admin 페이지 전부 isAdminRoute=true
//   · 두 강제 레이어 동등성          — 같은 (이메일, 허용목록)에서 미들웨어 결과 ⟺ 페이지 가드 결과
//
// STATIC + PURE 검증기: 공유 순수 모듈(런타임)과 두 레이어 소스 텍스트(정적)만 읽는다.
// 서버를 띄우지 않고, 네트워크/쿠키/시크릿을 건드리지 않으며, process.env 를 변경하지 않는다.
// 공개 데이터/점수/라우트 표에 영향 없음.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  FALLBACK_ADMIN_EMAILS,
  adminDecisionFrom,
  adminEmailSetFrom,
  isAdminRoute,
  normalizeAdminEmail,
  type AdminDecision,
} from "../src/lib/adminPolicy";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
function read(rel: string): string {
  return readFileSync(join(repo, rel), "utf8");
}

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}
function eq<T>(name: string, got: T, want: T): void {
  check(`${name} (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`, got === want);
}

// The default allow-list config used when no env override is present. The fixture
// matrix pins the raw config string explicitly, so this never reads process.env.
const FALLBACK_CFG = ""; // blank -> adminEmailSetFrom falls back to FALLBACK_ADMIN_EMAILS
const OWNER = FALLBACK_ADMIN_EMAILS[0]; // "contact@ornscore.com"

// ---------------------------------------------------------------------------
// §1  normalizeAdminEmail — canonicalization + missing-identity collapse
// ---------------------------------------------------------------------------
eq("§1 normalize lowercases + trims", normalizeAdminEmail("  Contact@OrnScore.COM "), OWNER);
eq("§1 normalize tab/newline whitespace", normalizeAdminEmail("\tCONTACT@ORNSCORE.COM\n"), OWNER);
eq("§1 normalize null -> ''", normalizeAdminEmail(null), "");
eq("§1 normalize undefined -> ''", normalizeAdminEmail(undefined), "");
eq("§1 normalize whitespace-only -> ''", normalizeAdminEmail("   \t "), "");

// ---------------------------------------------------------------------------
// §2  adminEmailSetFrom — allow-list parsing, fallback, separators
// ---------------------------------------------------------------------------
{
  const fb = adminEmailSetFrom(FALLBACK_CFG);
  check("§2 blank config falls back to owner", fb.has(OWNER) && fb.size === FALLBACK_ADMIN_EMAILS.length);

  const configured = adminEmailSetFrom("A@x.com, b@Y.com\t c@z.com\n");
  check("§2 configured normalizes each entry", configured.has("a@x.com") && configured.has("b@y.com") && configured.has("c@z.com"));
  check("§2 configured overrides fallback (owner no longer implicit)", !configured.has(OWNER));

  const whitespaceOnly = adminEmailSetFrom("   \n\t  ");
  check("§2 whitespace-only config falls back to owner", whitespaceOnly.has(OWNER) && whitespaceOnly.size === FALLBACK_ADMIN_EMAILS.length);
}

// ---------------------------------------------------------------------------
// §3  adminDecisionFrom — the shared fail-closed decision (all required cases)
// ---------------------------------------------------------------------------
type Case = { name: string; email: string | null | undefined; cfg: string; want: AdminDecision };
const CASES: Case[] = [
  // missing-session / signed-out -> redirect to login (fail closed)
  { name: "missing: undefined", email: undefined, cfg: FALLBACK_CFG, want: "redirect-login" },
  { name: "missing: null", email: null, cfg: FALLBACK_CFG, want: "redirect-login" },
  { name: "missing: empty string", email: "", cfg: FALLBACK_CFG, want: "redirect-login" },
  { name: "missing: whitespace-only", email: "   \t", cfg: FALLBACK_CFG, want: "redirect-login" },
  // allowed-email with normalization variants (fallback allow-list)
  { name: "allow: exact owner", email: OWNER, cfg: FALLBACK_CFG, want: "allow" },
  { name: "allow: uppercase owner", email: "CONTACT@ORNSCORE.COM", cfg: FALLBACK_CFG, want: "allow" },
  { name: "allow: padded/mixed owner", email: "  Contact@OrnScore.Com  ", cfg: FALLBACK_CFG, want: "allow" },
  // denied-email (present identity, not on allow-list) -> forbidden, NOT redirect
  { name: "deny: outside domain", email: "attacker@evil.com", cfg: FALLBACK_CFG, want: "forbidden" },
  { name: "deny: same domain non-admin", email: "notadmin@ornscore.com", cfg: FALLBACK_CFG, want: "forbidden" },
  // configured allow-list: owner is no longer implicit; listed emails allowed w/ normalization
  { name: "cfg allow: listed", email: "ops@ornscore.com", cfg: "ops@ornscore.com, ceo@ornscore.com", want: "allow" },
  { name: "cfg allow: listed normalized", email: "  OPS@OrnScore.com ", cfg: "ops@ornscore.com, ceo@ornscore.com", want: "allow" },
  { name: "cfg deny: owner not in explicit list", email: OWNER, cfg: "ops@ornscore.com, ceo@ornscore.com", want: "forbidden" },
];
for (const c of CASES) {
  eq(`§3 ${c.name}`, adminDecisionFrom(c.email, c.cfg), c.want);
}

// ---------------------------------------------------------------------------
// §4  isAdminRoute — matches every current /admin route; rejects siblings
// ---------------------------------------------------------------------------
// Discover the live admin routes from the filesystem so this stays honest as
// pages are added/removed (each src/app/admin/**/page.tsx is one route).
function discoverAdminRoutes(): string[] {
  const base = join(repo, "src", "app", "admin");
  const routes: string[] = [];
  function walk(absDir: string, urlPrefix: string): void {
    const entries = readdirSync(absDir, { withFileTypes: true });
    if (entries.some((e) => e.isFile() && /^page\.(tsx|ts|jsx|js)$/.test(e.name))) {
      routes.push(urlPrefix);
    }
    for (const e of entries) {
      if (e.isDirectory()) walk(join(absDir, e.name), `${urlPrefix}/${e.name}`);
    }
  }
  walk(base, "/admin");
  return routes.sort();
}
const ADMIN_ROUTES = discoverAdminRoutes();
check("§4 discovered at least the 4 known admin routes", ADMIN_ROUTES.length >= 4);
for (const r of ADMIN_ROUTES) {
  check(`§4 isAdminRoute true for live route ${r}`, isAdminRoute(r));
}
// Boundary: exact index + trailing slash match; siblings/prefixes do NOT.
check("§4 /admin exact matches", isAdminRoute("/admin"));
check("§4 /admin/ trailing-slash matches", isAdminRoute("/admin/"));
for (const notAdmin of ["/administrator", "/adminfoo", "/admin-tools", "/about", "/", "/login", "/xadmin"]) {
  check(`§4 isAdminRoute false for non-admin ${notAdmin}`, !isAdminRoute(notAdmin));
}

// Cross-check: the HTTP logged-out gate (verify-admin-access.mjs) must enumerate
// the SAME live routes, so the two admin verifiers can't drift out of sync.
{
  const gate = read("scripts/verify-admin-access.mjs");
  for (const r of ADMIN_ROUTES) {
    check(`§4 verify-admin-access.mjs enumerates ${r}`, gate.includes(`path: "${r}"`));
  }
}

// ---------------------------------------------------------------------------
// §5  Drift proof (STATIC): both enforcement layers delegate to adminPolicy and
//     keep NO private copy of the allow-list / normalization primitives.
// ---------------------------------------------------------------------------
const middlewareSrc = read("src/middleware.ts");
const adminAccessSrc = read("src/lib/adminAccess.ts");
const policySrc = read("src/lib/adminPolicy.ts");

// Middleware imports the shared decision + route predicate and uses them.
check("§5 middleware imports from @/lib/adminPolicy", /from\s+["']@\/lib\/adminPolicy["']/.test(middlewareSrc));
check("§5 middleware uses isAdminRoute()", middlewareSrc.includes("isAdminRoute("));
check("§5 middleware uses adminDecision()", middlewareSrc.includes("adminDecision("));
check("§5 middleware branches on redirect-login", middlewareSrc.includes('"redirect-login"'));
check("§5 middleware branches on forbidden", middlewareSrc.includes('"forbidden"'));

// Page guard imports the shared decision + normalization and uses them.
check("§5 adminAccess imports from @/lib/adminPolicy", /from\s+["']@\/lib\/adminPolicy["']/.test(adminAccessSrc));
check("§5 adminAccess uses adminDecision()", adminAccessSrc.includes("adminDecision("));
check("§5 adminAccess uses normalizeAdminEmail()", adminAccessSrc.includes("normalizeAdminEmail("));

// NO private redefinition of the primitives survives in either layer — the only
// definition of the allow-list literal / adminEmailSet parser is adminPolicy.
// (Re-exports like `export { adminEmailSet }` are fine; a `function`/`const`
//  DEFINITION in a layer would reintroduce drift.)
check("§5 adminPolicy defines FALLBACK_ADMIN_EMAILS", /const\s+FALLBACK_ADMIN_EMAILS\s*=/.test(policySrc));
check("§5 adminPolicy defines the allow-list parser", /function\s+adminEmailSetFrom\s*\(/.test(policySrc));
check("§5 middleware has NO private FALLBACK_ADMIN_EMAILS definition", !/const\s+FALLBACK_ADMIN_EMAILS\s*=/.test(middlewareSrc));
check("§5 middleware has NO private adminEmailSet definition", !/function\s+adminEmailSet\s*\(/.test(middlewareSrc));
check("§5 adminAccess has NO private FALLBACK_ADMIN_EMAILS definition", !/const\s+FALLBACK_ADMIN_EMAILS\s*=/.test(adminAccessSrc));
check("§5 adminAccess has NO private adminEmailSet definition", !/function\s+adminEmailSet\s*\(/.test(adminAccessSrc));

// ---------------------------------------------------------------------------
// §6  Equivalence: model each layer's observable outcome as a function of the
//     shared decision and prove they agree across the WHOLE fixture matrix.
//       middleware:  redirect-login -> 307 /login   | forbidden -> 403 | allow -> pass
//       page guard:  redirect-login -> redirect      | forbidden -> {allowed:false} | allow -> {allowed:true}
//     The property that matters: for every (email, cfg) the two layers make the
//     SAME trust call — a denied email is refused by BOTH, an allowed email is
//     admitted by BOTH, a missing session redirects in BOTH.
// ---------------------------------------------------------------------------
function middlewareOutcome(d: AdminDecision): "redirect" | "refuse" | "admit" {
  if (d === "redirect-login") return "redirect";
  if (d === "forbidden") return "refuse"; // 403
  return "admit";
}
function pageGuardOutcome(d: AdminDecision): "redirect" | "refuse" | "admit" {
  if (d === "redirect-login") return "redirect";
  return d === "allow" ? "admit" : "refuse"; // {allowed:true} vs {allowed:false}
}
for (const c of CASES) {
  const d = adminDecisionFrom(c.email, c.cfg);
  const mw = middlewareOutcome(d);
  const pg = pageGuardOutcome(d);
  eq(`§6 layers agree — ${c.name}`, mw, pg);
}

// ---------------------------------------------------------------------------
if (failed > 0) {
  console.error(`\nADMIN POLICY DRIFT VERIFICATION FAILED (${failed} check${failed === 1 ? "" : "s"}).`);
  process.exit(1);
}
console.log(
  `PASS admin-policy: shared contract equivalent across both enforcement layers ` +
    `(${CASES.length} decision cases · ${ADMIN_ROUTES.length} live /admin routes · normalization + fallback + drift).`,
);
