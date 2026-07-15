// Today AI 인사이트 프로버넌스 가드 (Slice E) — 실행: npx tsx scripts/test_todayInsightProvenance.ts
// 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// 사실(계약 정본): 저장된 일일 AI 인사이트(daily_insights)는 헤드라인·본문·주목점만 갖고
// 있을 뿐, "이 문장이 어떤 데이터에서 나왔는가"를 사용자가 추적할 수 있는 타입화된 프로버넌스가
// 없다. 재검수(2026-07-15)는 다음 네 가지가 갖춰지기 전에는 공개 /today 에서 이 요약을 조회·표시하지
// 말라고 지정했다:
//   (1) 출처(sources)        — 어떤 데이터 소스에서 나온 주장인가(타입화)
//   (2) 구성종목(constituents) — 어떤 종목/테마를 근거로 삼았는가
//   (3) 계산시각(calculatedAt) — 어느 시점 데이터로 계산했는가(생성 타임스탬프와 구분)
//   (4) 규칙/모델 역할(rule/model roles) — 어디까지 결정적 규칙이고 어디부터 LLM 생성인가
//
// 이 가드는 "프로버넌스 계약이 없는 동안에는 공개 표면에 인사이트가 되살아나지 못한다"를 고정한다.
// 계약(ThemeInsightOutput 의 네 필드)이 실제로 추가되면 게이트가 자동으로 열려 재도입을 허용한다.
// 즉 이 테스트는 계약을 강제하는 게이트이지, 재도입 자체를 영구 금지하는 것이 아니다.
//
// 생성·저장 코드(generateThemeInsight/getLatestStoredInsight/cron)는 대상이 아니다 — 보존 확인만 한다.
//
// STATIC 검증기: 소스 텍스트만 읽는다. 서버·데이터·점수 로직을 건드리지 않는다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

const todayPage = read("src/app/today/page.tsx");
const todayContent = read("src/components/today/TodayContent.tsx");
const themeInsight = read("src/lib/prompts/theme-insight.ts");
const aiInsight = read("src/lib/ai-insight.ts");

// ── 1. 프로버넌스 계약이 존재하는가? ────────────────────────────────────────────
// ThemeInsightOutput 타입(공개에 실릴 인사이트의 형태)이 네 가지 타입화된 프로버넌스 필드를
// 모두 선언할 때에만 계약이 충족된 것으로 본다. 필드 이름은 계약의 정본이므로 정확히 요구한다.
const outputType = (() => {
  const m = themeInsight.match(/export interface ThemeInsightOutput\s*\{[\s\S]*?\n\}/);
  return m ? m[0] : "";
})();
const hasSources = /\bsources\s*:/.test(outputType);
const hasConstituents = /\bconstituents\s*:/.test(outputType);
const hasCalculatedAt = /\bcalculatedAt\s*:/.test(outputType);
const hasRoles = /\bruleRole\s*:/.test(outputType) && /\bmodelRole\s*:/.test(outputType);
const provenanceContractPresent = hasSources && hasConstituents && hasCalculatedAt && hasRoles;

// ── 2. 계약이 없는 동안: 공개 /today 는 인사이트를 조회·표시하지 않는다 ──────────────
// 조회(getLatestStoredInsight 호출)와 표시(aiInsight 소비) 두 경로 모두 막는다.
if (!provenanceContractPresent) {
  check(
    "2a: today page must NOT fetch stored insight until provenance contract exists",
    !/getLatestStoredInsight/.test(todayPage),
  );
  check(
    "2b: today page must NOT pass an aiInsight prop until provenance contract exists",
    !/\baiInsight\s*=/.test(todayPage),
  );
  check(
    "2c: today content must NOT declare an aiInsight prop until provenance contract exists",
    !/\baiInsight\s*:/.test(todayContent),
  );
  check(
    "2d: today content must NOT render an insight (props.aiInsight) until provenance contract exists",
    !/props\.aiInsight/.test(todayContent),
  );
} else {
  // 계약이 갖춰졌다면 게이트를 열되, 재도입 시 네 필드를 실제로 표면까지 실어야 함을 기록한다.
  console.log(
    "NOTE: provenance contract present (sources/constituents/calculatedAt/rule+model roles) — public reintroduction is now permitted; ensure the /today surface renders these fields.",
  );
}

// ── 3. 생성·저장 코드는 보존되어야 한다(미래의 프로버넌스 대응 구현을 위해) ──────────────
// Slice E 는 표시를 제거하되 저장/생성 파이프라인은 보존한다.
check("3a: storage helper getLatestStoredInsight retained", /export async function getLatestStoredInsight/.test(aiInsight));
check("3b: generator generateThemeInsight retained", /export async function generateThemeInsight/.test(aiInsight));

// ── 4. 대체용 가짜/일반 카드로 바꾸지 않았는가(근거 없는 설명 카드 금지) ────────────────
// 인사이트를 없앤 자리에 '오늘의 AI 요약' 헤딩 등 새 일반 카드를 넣지 않았는지 최소 확인.
check("4a: no reintroduced AI-summary heading label on today content", !/aiThemeSummary/.test(todayContent));

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(
  provenanceContractPresent
    ? "PASS: today insight provenance gate OPEN (contract present); storage code preserved."
    : "PASS: today insight provenance gate CLOSED — no public fetch/render of untraceable insight; storage code preserved; no filler card.",
);
