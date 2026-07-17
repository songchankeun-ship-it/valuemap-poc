// 검색엔진 소유권 검증 메타데이터 계약 테스트(정적·오프라인) — SEO Slice D.
// 실행: npx tsx scripts/test_seoOwnershipVerification.ts — 성공 시 PASS 1줄, 실패 시 FAIL 후 비정상 종료.
//
// 고정하는 계약:
//   1) 토큰 미설정/공백 → verification undefined (로컬 빌드는 토큰 없이 동작).
//   2) 합성(synthetic) 값 주입 → 정확한 google / naver-site-verification 태그 방출.
//   3) 루트 메타데이터(src/app/layout.tsx)가 ownershipVerification() 을 실제로 연결.
//   4) .env.example 은 두 placeholder 를 빈 값으로만 둔다(실토큰 커밋 금지).
//   5) 운영자 런북이 저장소 작업(Part A)과 운영자 전용 외부 작업(Part B)을 명확히 분리.
// 네트워크·브라우저·외부 서비스 호출 없음. 순수 함수 + 소스 텍스트 검사만.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  ownershipVerification,
  GOOGLE_SITE_VERIFICATION_ENV,
  NAVER_SITE_VERIFICATION_ENV,
  NAVER_VERIFICATION_META_NAME,
} from "../src/lib/seoVerification";

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

// ── 1) 미설정 → undefined (토큰 없이 빌드 가능) ──────────────────────────────
check("empty env → undefined", ownershipVerification({}) === undefined);
check(
  "only unrelated env → undefined",
  ownershipVerification({ PATH: "/usr/bin", NODE_ENV: "production" }) === undefined,
);

// ── 2) 공백/빈 문자열 → 미설정 취급 ─────────────────────────────────────────
check(
  "blank google (empty string) → undefined",
  ownershipVerification({ [GOOGLE_SITE_VERIFICATION_ENV]: "" }) === undefined,
);
check(
  "whitespace-only tokens → undefined",
  ownershipVerification({
    [GOOGLE_SITE_VERIFICATION_ENV]: "   ",
    [NAVER_SITE_VERIFICATION_ENV]: "\t\n",
  }) === undefined,
);

// ── 3) 합성 값 → 정확한 태그 방출 ───────────────────────────────────────────
const googleOnly = ownershipVerification({
  [GOOGLE_SITE_VERIFICATION_ENV]: "synthetic-google-token",
});
check("google-only emits google", googleOnly?.google === "synthetic-google-token");
check("google-only omits naver/other", googleOnly?.other === undefined);

const naverOnly = ownershipVerification({
  [NAVER_SITE_VERIFICATION_ENV]: "synthetic-naver-token",
});
check(
  "naver-only emits naver meta",
  (naverOnly?.other as Record<string, unknown> | undefined)?.[NAVER_VERIFICATION_META_NAME] ===
    "synthetic-naver-token",
);
check("naver-only omits google", naverOnly?.google === undefined);
check("naver meta name is naver-site-verification", NAVER_VERIFICATION_META_NAME === "naver-site-verification");

const both = ownershipVerification({
  [GOOGLE_SITE_VERIFICATION_ENV]: "  g-token  ", // 앞뒤 공백은 trim
  [NAVER_SITE_VERIFICATION_ENV]: "n-token",
});
check("both: google trimmed", both?.google === "g-token");
check(
  "both: naver present",
  (both?.other as Record<string, unknown> | undefined)?.[NAVER_VERIFICATION_META_NAME] === "n-token",
);

// ── 3b) 기본 인자 경로(process.env)도 동작 ──────────────────────────────────
const savedG = process.env[GOOGLE_SITE_VERIFICATION_ENV];
const savedN = process.env[NAVER_SITE_VERIFICATION_ENV];
try {
  delete process.env[GOOGLE_SITE_VERIFICATION_ENV];
  delete process.env[NAVER_SITE_VERIFICATION_ENV];
  check("default process.env unset → undefined", ownershipVerification() === undefined);
  process.env[GOOGLE_SITE_VERIFICATION_ENV] = "env-default-google";
  check(
    "default process.env set → emits google",
    ownershipVerification()?.google === "env-default-google",
  );
} finally {
  if (savedG === undefined) delete process.env[GOOGLE_SITE_VERIFICATION_ENV];
  else process.env[GOOGLE_SITE_VERIFICATION_ENV] = savedG;
  if (savedN === undefined) delete process.env[NAVER_SITE_VERIFICATION_ENV];
  else process.env[NAVER_SITE_VERIFICATION_ENV] = savedN;
}

// ── 4) layout.tsx 가 실제로 연결 ────────────────────────────────────────────
const layout = read("src/app/layout.tsx");
check("layout imports helper", /from "@\/lib\/seoVerification"/.test(layout));
check("layout wires verification field", /verification:\s*ownershipVerification\(\)/.test(layout));

// ── 5) .env.example placeholder 는 비어 있고 실토큰 없음 ─────────────────────
const envExample = read(".env.example");
check("env.example declares GOOGLE var", envExample.includes(GOOGLE_SITE_VERIFICATION_ENV));
check("env.example declares NAVER var", envExample.includes(NAVER_SITE_VERIFICATION_ENV));
// 각 변수는 빈 문자열("")로만 선언되어야 한다(실토큰 커밋 방지).
for (const varName of [GOOGLE_SITE_VERIFICATION_ENV, NAVER_SITE_VERIFICATION_ENV]) {
  const m = envExample.match(new RegExp(`^${varName}=(.*)$`, "m"));
  check(`env.example ${varName} present as assignment`, m !== null);
  check(`env.example ${varName} is blank placeholder`, m !== null && (m[1] === '""' || m[1] === "" || m[1] === "''"));
}

// ── 6) 운영자 런북: Part A(저장소) / Part B(운영자 전용 외부) 분리 + 순서 ────
const runbook = read("docs/ornscore-seo-ownership-verification-runbook-2026-07-18.md");
check("runbook has Part A repository section", /Part A — Repository work/.test(runbook));
check("runbook has Part B owner-only section", /Part B — Owner-only external checklist/.test(runbook));
check(
  "runbook marks Part B as NOT performed by this batch",
  /NOT performed by this batch/i.test(runbook),
);
// 계획 §Slice D 가 요구한 4개 운영자 순서 요소.
check("runbook: verify ownership step", /Verify ownership/i.test(runbook));
check("runbook: submit canonical sitemap step", /Submit the canonical sitemap/i.test(runbook));
check("runbook: inspect representative URLs step", /Inspect representative URLs/i.test(runbook));
check("runbook: record deployed commit marker step", /Record the deployed commit marker/i.test(runbook));
check("runbook names both env vars", runbook.includes(GOOGLE_SITE_VERIFICATION_ENV) && runbook.includes(NAVER_SITE_VERIFICATION_ENV));
check("runbook states no token committed", /never committed|absolute|절대 커밋|No real token is committed/i.test(runbook));

// ── 결과 ────────────────────────────────────────────────────────────────────
if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log("PASS: SEO ownership verification contract (Slice D)");
