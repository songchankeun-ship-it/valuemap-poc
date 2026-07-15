// 사용자 향 상태 6차원(Slice C) 순수 회귀 + 공개 상태 계약 스캔 — 실행: npx tsx scripts/test_statusDimensions.ts
// 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// 배경: 공개 /status 가 단일 "정상(초록)" 하나로 상태를 뭉뚱그리고, GitHub Actions·daily_scores·cron·
// 코드 기대 산식 버전 같은 내부 구현 세부를 노출하던 계약 실패를 고친다. 이 테스트는
//  (1) buildStatusDimensions 가 6차원을 명시적 날짜 + ok/limited/attention 상태로 분리하는지,
//  (2) 점수 이력 연속성이 Slice B classifyComparisonBasis 의미를 실제로 소비하는지,
//  (3) 공개 상태 표면(copy/status.ts·StatusContent.tsx)에서 내부 구현 세부가 사라지고
//      그 세부가 보호된 /admin/status 로 이동했는지를 결정적으로 고정한다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildStatusDimensions,
  historyContinuityBasis,
  overallDimensionState,
  type StatusDimensionInput,
} from "../src/lib/statusDimensions";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");

// 기본 입력(모두 정상): 가격 최신·점수 생성됨·이력 연속·재무 결측 없음·테마/거래활성도 전량.
function baseInput(): StatusDimensionInput {
  return {
    price: { asOfLabel: "2026.07.15 (수)", stale: false, awaitingClose: false, ageLabel: "" },
    score: { computedLabel: "2026-07-15 18:40", metricsVersionLabel: "Metrics 2.4", generated: true },
    history: { asOfDates: ["20260715", "20260714"], entryCount: 2 },
    financial: { missing: 0, universe: 138, overThreshold: false },
    disclosure: { windowDays: 7, maxFilings: 200 },
    themeFlow: { themedCount: 138, flowCount: 138, universe: 138 },
  };
}

function byKey(dims: ReturnType<typeof buildStatusDimensions>) {
  return Object.fromEntries(dims.map((d) => [d.key, d]));
}

// ── 1. 6차원 존재 + 순서 고정 ──
{
  const dims = buildStatusDimensions(baseInput(), "ko");
  check("exactly 6 dimensions", dims.length === 6);
  check(
    "dimension keys/order",
    dims.map((d) => d.key).join(",") === "price,score,history,financial,disclosure,themeFlow",
  );
}

// ── 2. 가격 신선도: fresh→ok / awaiting_close→limited / stale→attention, 명시적 날짜 노출 ──
{
  const fresh = byKey(buildStatusDimensions(baseInput(), "ko")).price;
  check("price fresh → ok", fresh.state === "ok");
  check("price shows explicit as-of date", fresh.asOf === "2026.07.15 (수)");

  const awaiting = baseInput();
  awaiting.price.awaitingClose = true;
  check("price awaiting-close → limited", byKey(buildStatusDimensions(awaiting, "ko")).price.state === "limited");

  const stale = baseInput();
  stale.price.stale = true;
  check("price stale → attention", byKey(buildStatusDimensions(stale, "ko")).price.state === "attention");
}

// ── 3. 점수 신선도: 생성됨→ok(시각·산식 병기) / 미생성→attention ──
{
  const ok = byKey(buildStatusDimensions(baseInput(), "ko")).score;
  check("score generated → ok", ok.state === "ok");
  check("score carries computed time as-of", ok.asOf === "2026-07-15 18:40 KST");
  check("score detail mentions metrics version", ok.detail.includes("Metrics 2.4"));

  const missing = baseInput();
  missing.score.generated = false;
  const s = byKey(buildStatusDimensions(missing, "ko")).score;
  check("score not generated → attention", s.state === "attention");
  check("score not generated → no as-of", s.asOf === null);
}

// ── 4. 점수 이력 연속성: Slice B basis 소비 (전 거래일→ok / N거래일 전→limited / 부족→limited) ──
{
  // 연속 두 기준일 → 전 거래일 → ok, from→to 날짜 노출.
  const cont = byKey(buildStatusDimensions(baseInput(), "ko")).history;
  check("history consecutive → ok", cont.state === "ok");
  check("history basisKind previous-trading-day", cont.basisKind === "previous-trading-day");
  check("history shows from→to dates", cont.asOf === "07-14 → 07-15");

  // 조밀한 이력(3개 기준일)도 최신 두 스냅샷은 자기 시퀀스 안에서 인접 → 전 거래일 → ok(연속성 있음).
  // (달력 간격 자체의 N거래일 판정은 Slice B classifyComparisonBasis 가 직접 담당 — test_scoreComparison.)
  const dense = baseInput();
  dense.history.asOfDates = ["20260715", "20260714", "20260713"];
  dense.history.entryCount = 3;
  const dn = byKey(buildStatusDimensions(dense, "ko")).history;
  check("history dense → ok (continuous)", dn.state === "ok");
  check("history dense basisKind previous-trading-day", dn.basisKind === "previous-trading-day");

  // 이력 1건 이하 → 비교 불가 → limited(축적 중), 날짜 없음.
  const sparse = baseInput();
  sparse.history.asOfDates = ["20260715"];
  sparse.history.entryCount = 1;
  const sp = byKey(buildStatusDimensions(sparse, "ko")).history;
  check("history <2 entries → limited", sp.state === "limited");
  check("history <2 entries basis unavailable", sp.basisKind === "unavailable");
  check("history <2 entries → no as-of", sp.asOf === null);

  // 빈 이력(로컬 기본) → 비교 불가.
  const empty = baseInput();
  empty.history.asOfDates = [];
  empty.history.entryCount = 0;
  check("history empty → limited", byKey(buildStatusDimensions(empty, "ko")).history.state === "limited");

  // historyContinuityBasis 가 Slice B ComparisonBasis 를 직접 반환(의미 재사용 증거).
  check("historyContinuityBasis consecutive → previous-trading-day", historyContinuityBasis(["20260715", "20260714"]).kind === "previous-trading-day");
  check("historyContinuityBasis single → unavailable", historyContinuityBasis(["20260715"]).kind === "unavailable");
}

// ── 5. 재무 완성도: 결측 0→ok / 결측>0→limited / 임계 초과→attention ──
{
  check("financial no gaps → ok", byKey(buildStatusDimensions(baseInput(), "ko")).financial.state === "ok");

  const some = baseInput();
  some.financial.missing = 2;
  check("financial some missing → limited", byKey(buildStatusDimensions(some, "ko")).financial.state === "limited");

  const over = baseInput();
  over.financial.missing = 30;
  over.financial.overThreshold = true;
  check("financial over threshold → attention", byKey(buildStatusDimensions(over, "ko")).financial.state === "attention");
}

// ── 6. 공시 범위: 항상 limited(설계상 범위 제한), 창·건수 노출 ──
{
  const disc = byKey(buildStatusDimensions(baseInput(), "ko")).disclosure;
  check("disclosure always limited", disc.state === "limited");
  check("disclosure detail shows window+cap", disc.detail.includes("7") && disc.detail.includes("200"));
}

// ── 7. 테마·거래활성도 가용성: 전량→ok / 일부 결측→limited(테마 휴리스틱 명시) ──
{
  const full = byKey(buildStatusDimensions(baseInput(), "ko")).themeFlow;
  check("themeFlow full → ok", full.state === "ok");
  check("themeFlow notes heuristic", full.detail.includes("휴리스틱"));

  const partial = baseInput();
  partial.themeFlow.themedCount = 130;
  check("themeFlow partial → limited", byKey(buildStatusDimensions(partial, "ko")).themeFlow.state === "limited");
}

// ── 8. 종합 상태: 단일 초록 금지 — limited/attention 이 하나라도 있으면 그 상태로 승격 ──
{
  const allLimited = baseInput();
  // disclosure 는 언제나 limited 이므로 baseInput 종합은 최소 limited 여야 한다(단일 초록 방지).
  check("overall base is limited (disclosure always limited)", overallDimensionState(buildStatusDimensions(allLimited, "ko")) === "limited");

  const attn = baseInput();
  attn.price.stale = true;
  check("overall with attention → attention", overallDimensionState(buildStatusDimensions(attn, "ko")) === "attention");
}

// ── 9. 로케일: en 라벨도 상태 문자열을 갖고, "yesterday/어제" 단정을 쓰지 않는다 ──
{
  const en = buildStatusDimensions(baseInput(), "en");
  check("en has 6 dims", en.length === 6);
  check("en state labels present", en.every((d) => ["Normal", "Limited", "Attention"].includes(d.stateLabel)));
  const enText = en.map((d) => d.detail + d.label).join(" ");
  check("no 'yesterday' claim in en dimensions", !/yesterday/i.test(enText));
}

// ── 10. 공개 상태 계약 스캔: 내부 구현 세부가 공개 표면에서 사라졌는지 ──
{
  const publicCopy = readFileSync(join(repo, "src/lib/copy/status.ts"), "utf8");
  const publicContent = readFileSync(join(repo, "src/components/status/StatusContent.tsx"), "utf8");
  const publicSurface = publicCopy + "\n" + publicContent;

  // 배너 토큰: GitHub 워크플로 / 테이블명 / cron / 코드 기대값 대조 — 공개 표면에 있으면 안 된다.
  check("public status has no 'GitHub'", !/GitHub/i.test(publicSurface));
  check("public status has no 'daily_scores' table name", !/daily_scores/.test(publicSurface));
  check("public status has no 'cron'", !/\bcron\b/i.test(publicSurface));
  check("public status has no 'Supabase'", !/Supabase/i.test(publicSurface));
  check("public status has no '코드 기대값' compare", !/코드 기대값/.test(publicSurface));
  check("public status has no 'expected value' compare", !/expected value/i.test(publicSurface));
  check("public status has no 'data_reports' table name", !/data_reports/.test(publicSurface));

  // 공개 표면이 실제로 6차원 빌더를 소비하는지(단일 초록 대체 증거).
  check("StatusContent imports buildStatusDimensions", /buildStatusDimensions/.test(publicContent));
  check("StatusContent renders dimensions.map", /dimensions\.map\(/.test(publicContent));
  check("StatusContent no longer renders domainStatuses.map", !/domainStatuses\.map\(/.test(publicContent));
}

// ── 11. 이동 확인: 내부 구현 세부가 보호된 /admin/status 로 옮겨졌는지 + 관리자 보호 유지 ──
{
  const admin = readFileSync(join(repo, "src/app/admin/status/page.tsx"), "utf8");
  check("admin status keeps GitHub Actions detail", /GitHub Actions/.test(admin));
  check("admin status keeps daily_scores detail", /daily_scores/.test(admin));
  check("admin status keeps cron detail", /cron/.test(admin));
  check("admin status keeps expected metrics version compare", /코드 기대값/.test(admin));
  check("admin auth gate unchanged", /requireAdminAccess\(/.test(admin) && /admin\.allowed/.test(admin));
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(
  "PASS: user-facing status dimensions (6 dims, explicit dates, Slice B history continuity, public-status contract, admin relocation)",
);
