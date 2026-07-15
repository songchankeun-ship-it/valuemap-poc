// Metrics 2.5.1 TypeScript 계약 가드 (Slice J) — 실행: npx tsx scripts/test_metrics251_contracts.ts
// 성공 시 PASS 요약, 실패 시 FAIL 출력 후 비정상 종료.
//
// 증명 항목(작업 지시):
//   (1) generated-contract freshness — python export --check + node generator --check 가 드리프트 없음
//   (2) null handling — 결측 점수를 50 등으로 대체하지 않고 null 전파
//   (3) enum exhaustiveness — 모든 자격 사유/read 상태가 안정 라벨로 매핑(assertNever 컴파일 가드 + 런타임)
//   (4) checksum metadata presence — 체크섬/모집단 해시 결측 시 계약 위반으로 거부
//   (5) compile safety — tsc(전역)로 별도 검증; 여기선 reader 가 저장값만 소비함을 정적 확인
//   (6) 정적 가드 — scripts/metrics251/* 가 점수 산식을 import/구현하지 않음
//   (7) 버전 경계 — src/lib/metrics.ts(2.4 공개 호환)가 정직히 라벨되고 2.5.1 reader 가 이를 쓰지 않음
//
// STATIC/계약 검증기: 로컬 소스·계약 파일만 읽고, freshness 는 자식 프로세스로 --check 를 돌린다.
// 공개 데이터·서버·점수 로직을 건드리지 않는다.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  ELIGIBILITY_REASONS,
  READ_STATUSES,
  FACTOR_KEYS,
  CHECKSUM_METADATA,
  REQUIRED_KEYS,
  CONTRACT_SOURCE_HASHES,
  type EligibilityReason,
} from "./metrics251/contracts.generated";
import {
  readSnapshot,
  assertChecksumMetadata,
  compositeScoreOrNull,
  factorScoreOrNull,
  isRankingEligible,
  eligibilityReasonLabelKey,
  readStatusSeverity,
  isExcludingReason,
  readComparisonCapabilities,
  anyComparisonLayerAvailable,
  ContractViolation,
  READS_STORED_SCORES_ONLY,
  type CandidateSnapshot,
} from "./metrics251/reader";

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
function throws(name: string, fn: () => unknown): void {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  check(name, threw);
}

// ── 유효한 저장 스냅샷 픽스처(체크섬/모집단 해시 포함, 결측 factor 포함) ──────────
function validSnapshot(): CandidateSnapshot {
  return {
    engineVersion: "2.5.1",
    configHash: "cfg-hash",
    inputManifestHash: "input-hash",
    marketDate: "2026-07-15",
    sourceDates: { prices: "2026-07-15", volumes: "2026-07-15", fundamentals: null },
    runState: "QA_PASSED",
    stocks: [
      {
        ticker: "005930",
        factors: {
          momentum: { factor: "momentum", reason: "VALID", raw: 3.2, score: 71.0 },
          activity: { factor: "activity", reason: "VALID", raw: 1.1, score: 55.0 },
          value: { factor: "value", reason: "MISSING_INPUT", raw: null, score: null },
          riskAdjusted: { factor: "riskAdjusted", reason: "VALID", raw: 0.4, score: 60.0 },
        },
        compositeScore: null, // 밸류 결측 → 종합 보류(대체 금지)
        rankingEligible: false,
        eligibilityReasons: { value: "MISSING_INPUT" },
      },
    ],
    factorPopulations: {
      momentum: { count: 138, hash: "m-hash" },
      activity: { count: 138, hash: "a-hash" },
      value: { count: 137, hash: "v-hash" },
      riskAdjusted: { count: 138, hash: "r-hash" },
    },
    rankingPopulation: { count: 137, hash: "rank-hash" },
    eligibilityReasonCounts: { MISSING_INPUT: 1 },
  };
}

// ── (1) freshness — 자식 프로세스로 --check ─────────────────────────────────────
function runCheck(name: string, cmd: string, args: string[]): void {
  try {
    execFileSync(cmd, args, { cwd: repo, stdio: "pipe" });
    check(name, true);
  } catch (err) {
    failed++;
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`FAIL: ${name}\n  ${detail}`);
  }
}
runCheck("freshness: python contract export --check", "python", [
  "scripts/metrics251_contract_export.py",
  "--check",
]);
runCheck("freshness: node generator --check", "node", ["scripts/gen_metrics251_contracts.mjs", "--check"]);

// 생성물 헤더에 임베드된 소스 해시가 실제 소스 바이트와 일치(자기 일관성).
import { createHash } from "node:crypto";
function sha256File(rel: string): string {
  return createHash("sha256").update(readFileSync(join(repo, rel))).digest("hex");
}
check(
  "freshness: embedded contract.json hash matches",
  CONTRACT_SOURCE_HASHES.contractJson === sha256File("config/metrics/2.5.1.contract.json")
);
check(
  "freshness: embedded projection schema hash matches",
  CONTRACT_SOURCE_HASHES.projectionSchema === sha256File("config/metrics/2.5.1.projection.schema.json")
);

// 생성된 enum 이 계약 정본(contract.json)과 정확히 일치.
const contractJson = JSON.parse(read("config/metrics/2.5.1.contract.json")) as {
  enums: { eligibilityReasons: string[]; factorKeys: string[]; readStatuses: string[] };
  requiredKeys: Record<string, string[]>;
};
check(
  "freshness: eligibility reasons match contract",
  JSON.stringify([...ELIGIBILITY_REASONS]) === JSON.stringify(contractJson.enums.eligibilityReasons)
);
check(
  "freshness: factor keys match contract",
  JSON.stringify([...FACTOR_KEYS]) === JSON.stringify(contractJson.enums.factorKeys)
);
check(
  "freshness: required snapshot keys match contract",
  JSON.stringify([...REQUIRED_KEYS.snapshot]) === JSON.stringify(contractJson.requiredKeys.snapshot)
);

// ── (2) null handling — 결측을 50 등으로 대체하지 않고 null 전파 ────────────────
const snap = validSnapshot();
const stock = snap.stocks[0];
check("null: composite withheld → null", compositeScoreOrNull(stock) === null);
check("null: missing value factor → null (no 50 fill)", factorScoreOrNull(stock, "value") === null);
check("null: valid factor → stored number", factorScoreOrNull(stock, "momentum") === 71.0);
check("null: rankingEligible false when a factor missing", isRankingEligible(stock) === false);
// 소스 텍스트에 50/평균 fallback 이 없어야 함(대체 금지 가드).
const readerSrc = read("scripts/metrics251/reader.ts");
check("null: reader has no `?? 50` fallback", !/\?\?\s*50\b/.test(readerSrc));
check("null: reader has no `|| 50` fallback", !/\|\|\s*50\b/.test(readerSrc));

// ── (3) enum exhaustiveness — 모든 멤버가 안정 라벨로 매핑, UNKNOWN 없음 ─────────
const labelKeys = new Set<string>();
for (const reason of ELIGIBILITY_REASONS) {
  const key = eligibilityReasonLabelKey(reason);
  check(`enum: ${reason} → non-empty label`, typeof key === "string" && key.length > 0);
  check(`enum: ${reason} label not UNKNOWN`, !/unknown/i.test(key));
  labelKeys.add(key);
}
check("enum: eligibility labels unique", labelKeys.size === ELIGIBILITY_REASONS.length);
for (const status of READ_STATUSES) {
  const sev = readStatusSeverity(status);
  check(`enum: read status ${status} → finite severity`, Number.isFinite(sev));
}
// 알 수 없는 값은 던진다(런타임 방어).
throws("enum: unknown eligibility reason throws", () =>
  eligibilityReasonLabelKey("NOT_A_REASON" as EligibilityReason)
);
// 제외/비제외 분리 정확성.
check("enum: MISSING_INPUT is excluding", isExcludingReason("MISSING_INPUT") === true);
check("enum: VALID is non-excluding", isExcludingReason("VALID") === false);
check("enum: QUALITY_WARNING is non-excluding", isExcludingReason("QUALITY_WARNING") === false);

// ── (4) checksum metadata presence — 결측이면 거부 ──────────────────────────────
assertChecksumMetadata(snap); // 유효 → 통과
check("checksum: valid snapshot passes readSnapshot", readSnapshot(validSnapshot()).configHash === "cfg-hash");
throws("checksum: empty configHash rejected", () => {
  const bad = validSnapshot();
  bad.configHash = "";
  assertChecksumMetadata(bad);
});
throws("checksum: missing population hash rejected", () => {
  const bad = validSnapshot();
  delete (bad.factorPopulations.value as { hash?: string }).hash;
  assertChecksumMetadata(bad);
});
throws("checksum: missing ranking hash rejected", () => {
  const bad = validSnapshot();
  delete (bad.rankingPopulation as { hash?: string }).hash;
  assertChecksumMetadata(bad);
});
throws("checksum: readSnapshot rejects missing required key", () => {
  const bad = validSnapshot() as unknown as Record<string, unknown>;
  delete bad.inputManifestHash;
  readSnapshot(bad);
});
// contract.json 이 필수 체크섬 키를 실제로 선언하는지(계약 자기 검증).
check(
  "checksum: contract declares snapshot hash keys",
  CHECKSUM_METADATA.snapshotHashKeys.includes("configHash") &&
    CHECKSUM_METADATA.snapshotHashKeys.includes("inputManifestHash")
);
check("checksum: ContractViolation is used", new ContractViolation("x").name === "ContractViolation");

// ── (5) compile safety / stored-only — reader 는 저장값만 소비 ───────────────────
check("stored-only: marker exported", READS_STORED_SCORES_ONLY === true);
// capability 접근자는 저장 capability 를 그대로 읽는다(재계산 없음).
const caps = readComparisonCapabilities({
  raw: true,
  factorScore: { momentum: false, activity: false, value: false, riskAdjusted: false },
  compositeScore: false,
  rank: false,
});
check("stored-only: raw layer available reported", anyComparisonLayerAvailable(caps) === true);

// ── (6) 정적 가드 — 산식 import/구현 금지 ───────────────────────────────────────
// 주석은 실행되지 않으므로(가드는 코드 동작 대상) 스캔 전에 제거한다 — 문서 산문의 오탐 방지.
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}
const guardedSources: Array<[string, string]> = [
  ["reader.ts", stripComments(read("scripts/metrics251/reader.ts"))],
  ["contracts.generated.ts", stripComments(read("scripts/metrics251/contracts.generated.ts"))],
];
// 금지 import: 공개 2.4 산식·파이썬 엔진·컴퓨트 경로.
const BANNED_IMPORTS = [
  /from\s+["']@\/lib\/metrics["']/,
  /from\s+["'][^"']*\/lib\/metrics["']/,
  /require\(\s*["']@\/lib\/metrics["']\s*\)/,
  /metrics251_engine/,
  /compute_metrics/,
];
// 금지 산식 토큰(점수 재계산의 강한 신호). 필드명 "score"/"raw" 는 저장값 읽기이므로 허용.
const BANNED_FORMULA = [
  /Math\.sqrt/,
  /Math\.pow/,
  /Math\.log/,
  /\bpercentile\s*\(/i,
  /\bsharpe/i,
  /\bannualiz/i,
  /\bstdd?ev/i,
  /momentumRaw/,
  /returnPct/,
  /volumeRatio/,
];
for (const [label, src] of guardedSources) {
  for (const re of BANNED_IMPORTS) {
    check(`guard(${label}): no banned import ${re}`, !re.test(src));
  }
  for (const re of BANNED_FORMULA) {
    check(`guard(${label}): no formula token ${re}`, !re.test(src));
  }
  // reader/generated 는 오직 contracts.generated 또는 표준 라이브러리에서만 import(모듈 지정자 검사).
  const specifiers = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  for (const spec of specifiers) {
    const ok = spec === "./contracts.generated" || /^node:[a-z]+$/.test(spec);
    check(`guard(${label}): import only generated/std-lib → "${spec}"`, ok);
  }
}

// ── (7) 버전 경계 — 2.4 라벨 정직성 + reader 가 2.4 를 쓰지 않음 ─────────────────
const metrics24 = read("src/lib/metrics.ts");
check("boundary: metrics.ts labels Metrics 2.4", /Metrics 2\.4/.test(metrics24));
check("boundary: metrics.ts carries version-boundary tag", /@metricsVersionBoundary 2\.4-public/.test(metrics24));
check(
  "boundary: metrics.ts documents 2.5.1 readers must not import it",
  /scripts\/metrics251\//.test(metrics24)
);
// reader 는 src/lib/metrics 를 import 하지 않는다(주석 제거 후 정적 확인).
check("boundary: reader does not import metrics.ts", !/lib\/metrics/.test(stripComments(readerSrc)));

// ── 결과 ────────────────────────────────────────────────────────────────────────
if (failed > 0) {
  console.error(`\nFAIL: ${failed} 개 계약 검사 실패`);
  process.exit(1);
}
console.log(
  "PASS metrics251 contracts: freshness · null-handling · enum-exhaustiveness · checksum-presence · " +
    "no-formula-guard · 2.4 boundary — all green"
);
