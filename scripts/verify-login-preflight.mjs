// SSR-stable /login preflight verification for OrnScore (OAuth release gate).
//
// The automated, repo-local half of the OAuth release checklist
// (docs/ornscore-oauth-preflight-checklist.md). It fetches the representative
// /login states against an ALREADY-RUNNING server (local prod preview OR an
// owner-provided URL) and asserts only SSR-STABLE expectations — the properties
// that are present in the server-rendered HTML because /login is a Dynamic
// (server-rendered on demand) route, so useSearchParams() resolves server-side
// and the full form (not the Suspense skeleton) is in the initial HTML.
//
// It DELIBERATELY does not, and can not, exercise a real provider round-trip:
// clicking Kakao/Google/Naver, magic-link email delivery, and /auth/callback
// return-to-next remain an OWNER GATE (a live browser + real consoles). This
// gate only proves the repo-local UI contract that must hold BEFORE that manual
// pass is worth doing.
//
// What it asserts per state (all derived from the running server's HTML only):
//   (a) HTTP 200,
//   (b) NONE of the critical runtime-failure markers appear,
//   (c) the baseline enabled provider buttons render (Kakao + Google labels),
//   (d) Naver renders in the expected provider state:
//       - every URL defaults to strict planned/"검수 중" mode,
//       - an owner may explicitly request enabled mode only after review approval,
//   (e) required per-state copy renders (previous-page context, contextFallback,
//       friendly Korean error text),
//   (f) NO raw provider error string leaks (e.g. "provider is not enabled"),
//   (g) lang="ko" is present and there is NO KO/EN toggle (hreflang / lang="en"
//       / LanguageSwitcher) — public v1 is Korean-only.
//
// Privacy: this script PRINTS NO PRIVATE VALUES. It never reads env secrets and
// never echoes HTML bodies — only the route path, HTTP status, OK/FAIL, and
// generic reason strings (e.g. 'missing "카카오로 시작하기"').
//
// Like verify:routes / smoke:check this is a REAL gate: it prints a per-state
// table and exits 1 on any failure or if the base server is unreachable; exits 0
// when all pass. It only measures an already-running server; never starts/stops one.
//
// Usage:
//   npm run build
//   npx next start -p 4463            # a dedicated high port (NOT 3000 / NOT AI Center 4310)
//   npm run verify:login-preflight -- --base http://localhost:4463
//   # env form (flag wins over env):
//   VERIFY_BASE_URL=http://localhost:4463 node scripts/verify-login-preflight.mjs
//   # deliberate negative self-check (prove the gate can FAIL): point --login-path
//   # at a page that is NOT the login form; every state then FAILs and it exits 1:
//   node scripts/verify-login-preflight.mjs --base http://localhost:4463 --login-path /about
//   # provider-state override:
//   node scripts/verify-login-preflight.mjs --base https://ornscore.com --naver-state either

// --- args -------------------------------------------------------------------
function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

const BASE = (argValue("--base", process.env.VERIFY_BASE_URL) || "http://localhost:4463").replace(/\/+$/, "");
// Mount path of the login form. Default "/login"; override ONLY to run the
// deliberate negative self-check (e.g. --login-path /about proves the asserts bite).
const LOGIN_PATH = argValue("--login-path", "/login").replace(/\/+$/, "") || "/login";

function normalizeNaverState(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "planned" || normalized === "enabled" || normalized === "either") return normalized;
  console.error(`Invalid --naver-state "${value}". Expected planned, enabled, or either.`);
  process.exit(2);
}

const NAVER_STATE = normalizeNaverState(
  argValue("--naver-state", process.env.VERIFY_NAVER_STATE || "planned"),
);

// --- shared marker contracts ------------------------------------------------
// Critical runtime-failure markers (shared contract with smoke-check/verify-routes).
const CRITICAL_MARKERS = [
  "Application error",
  "Hydration failed",
  "Cannot read properties",
  "ReferenceError:",
  "Unhandled",
  "Minified React error",
];

// KO/EN toggle markers: none may appear. Public v1 is Korean-only (DEFAULT_LOCALE="ko").
const TOGGLE_MARKERS = ["hreflang", 'lang="en"', "LanguageSwitcher"];

// Raw provider/config error strings that friendlyAuthError() must translate away.
// If any of these leak into the rendered HTML, the friendly-error contract broke.
const RAW_PROVIDER_ERROR_MARKERS = [
  "provider is not enabled",
  "Unsupported provider",
  "unsupported provider",
  "validation_failed",
  "provider_disabled",
];

// Baseline buttons that must be present in EVERY /login state. Naver can be
// planned locally or enabled in production, so it is checked separately below.
const ENABLED_BUTTON_MARKERS = ["카카오로 시작하기", "구글로 시작하기"];
const NAVER_ENABLED_MARKER = "네이버로 시작하기";
const NAVER_PLANNED_MARKER = "검수 중";

// --- states -----------------------------------------------------------------
// Each state is a query variant of LOGIN_PATH plus the SSR-stable copy it must show.
const STATES = [
  {
    query: "",
    mustContain: [{ text: "홈으로", why: "root-origin login shows the '홈으로' back link" }],
    label: "/login",
  },
  {
    query: "?next=/watchlist",
    mustContain: [
      { text: "이전 페이지로", why: "internal-origin login shows the previous-page back link" },
      { text: "관심 종목을 여러 기기에서", why: "watchlist context copy renders" },
    ],
    label: "/login?next=/watchlist",
  },
  {
    query: "?next=/compare",
    mustContain: [{ text: "비교 목록을 저장하려면", why: "compare context copy renders" }],
    label: "/login?next=/compare",
  },
  {
    query: "?next=/stock/005930",
    mustContain: [
      { text: "이전 페이지로", why: "internal-origin login shows the previous-page back link" },
      { text: "로그인하면 저장한 관심 종목", why: "generic contextFallback copy renders for non-mapped paths" },
    ],
    label: "/login?next=/stock/005930",
  },
  {
    query: "?error=auth_callback_no_code&next=/watchlist",
    mustContain: [
      { text: "앱에서 로그인 후 돌아오지 못했어요", why: "friendly Korean no-code error renders" },
      { text: "이전 페이지로", why: "error state preserves the validated next back link" },
    ],
    label: "/login?error=auth_callback_no_code&next=/watchlist",
  },
];

// --- fetch + assert ---------------------------------------------------------
async function checkState(state) {
  const url = `${BASE}${LOGIN_PATH}${state.query}`;
  let res;
  let body;
  try {
    res = await fetch(url, {
      redirect: "manual",
      headers: { "cache-control": "no-cache", pragma: "no-cache", expires: "0" },
    });
    body = await res.text();
  } catch (err) {
    return {
      ...state,
      ok: false,
      unreachable: true,
      reasons: [`request failed: ${String(err && err.message ? err.message : err)}`],
    };
  }

  const reasons = [];

  // (a) status
  const status = res.status;
  if (status !== 200) reasons.push(`status ${status} (expected 200)`);

  // (b) no critical runtime markers
  const critHits = CRITICAL_MARKERS.filter((m) => body.includes(m));
  if (critHits.length) reasons.push(`critical marker(s): ${critHits.join(", ")}`);

  // (c) baseline enabled provider buttons present
  for (const m of ENABLED_BUTTON_MARKERS) {
    if (!body.includes(m)) reasons.push(`missing enabled provider button "${m}"`);
  }

  // (d) Naver provider state: strict planned on local, flexible on live unless overridden.
  const hasNaverEnabled = body.includes(NAVER_ENABLED_MARKER);
  const hasNaverPlanned = body.includes("네이버") && body.includes(NAVER_PLANNED_MARKER);
  if (NAVER_STATE === "planned" && !hasNaverPlanned) {
    reasons.push(`missing Naver planned-provider marker "${NAVER_PLANNED_MARKER}"`);
  }
  if (NAVER_STATE === "enabled" && !hasNaverEnabled) {
    reasons.push(`missing enabled provider button "${NAVER_ENABLED_MARKER}"`);
  }
  if (NAVER_STATE === "either" && !hasNaverPlanned && !hasNaverEnabled) {
    reasons.push(`missing Naver provider state: expected planned marker "${NAVER_PLANNED_MARKER}" or enabled button "${NAVER_ENABLED_MARKER}"`);
  }

  // (e) per-state copy present
  for (const anchor of state.mustContain ?? []) {
    if (!body.includes(anchor.text)) reasons.push(`missing "${anchor.text}" (${anchor.why})`);
  }

  // (f) no raw provider error leak
  const rawHits = RAW_PROVIDER_ERROR_MARKERS.filter((m) => body.includes(m));
  if (rawHits.length) reasons.push(`raw provider error leaked: ${rawHits.join(", ")}`);

  // (g) Korean-only, no KO/EN toggle
  const toggleHits = TOGGLE_MARKERS.filter((m) => body.includes(m));
  if (toggleHits.length) reasons.push(`KO/EN toggle marker(s): ${toggleHits.join(", ")}`);
  if (!body.includes('lang="ko"')) reasons.push(`missing lang="ko" (expected Korean-only SSR document)`);

  return { ...state, ok: reasons.length === 0, status, reasons };
}

// --- table helpers (mirror verify-routes) -----------------------------------
function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}
function padStart(str, width) {
  str = String(str);
  return str.length >= width ? str : " ".repeat(width - str.length) + str;
}

async function main() {
  console.log("OrnScore /login SSR preflight (repo-local gate; exits 1 on any failure)");
  console.log(`base=${BASE}  loginPath=${LOGIN_PATH}  states=${STATES.length}  naverState=${NAVER_STATE}`);
  console.log("NOTE: real provider round-trip / magic-link / callback remain an OWNER gate.");
  console.log("");

  const results = [];
  for (const state of STATES) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await checkState(state));
  }

  const anyUnreachable = results.some((r) => r.unreachable);

  const header = `${pad("state", 46)}${padStart("status", 8)}${pad("  ", 2)}${pad("result", 8)}`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) {
    const statusCell = r.unreachable ? "ERR" : r.status;
    const resultCell = r.ok ? "OK" : "FAIL";
    console.log(`${pad(r.label, 46)}${padStart(statusCell, 8)}${pad("  ", 2)}${pad(resultCell, 8)}`);
  }
  console.log("");

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log("Failures:");
    for (const r of failed) {
      for (const reason of r.reasons) console.log(`  FAIL ${r.label}: ${reason}`);
    }
    console.log("");
  }

  if (anyUnreachable) {
    console.log(`Could not reach one or more states -- is a server running at ${BASE}?`);
    console.log("Hint: npm run build && npx next start -p 4463   (then re-run with --base http://localhost:4463)");
  }

  const passed = results.length - failed.length;
  console.log(`Summary: ${passed}/${results.length} login states OK.`);

  if (failed.length) {
    console.log("LOGIN PREFLIGHT FAILED.");
    process.exit(1);
  }
  console.log("LOGIN PREFLIGHT PASSED.");
  process.exit(0);
}

main();
