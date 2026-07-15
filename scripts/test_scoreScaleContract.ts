// 점수 척도·입력 완성도 카피 계약 가드 (Slice F) — 실행: npx tsx scripts/test_scoreScaleContract.ts
// 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// 사실(계약 정본): 종합 점수는 0~100 **비교 척도**다. 네 지표 중 추세(모멘텀)·밸류는 현재 유니버스
// 안에서의 백분위라 종목 구성이 바뀌면 값이 달라진다 — 고정된 절대 점수가 아니다. 재검수(2026-07-15)에서
// 일부 공개 카피가 점수를 "0~100 절대값" / "절대 해석" / "absolute read"로 설명해, 점수가 유니버스와
// 무관하다는 오해를 주던 계약 불일치가 확인되었다. 또한 완성도 배지의 라벨이 "데이터 신뢰"(정확성 함의)로
// 표기돼 있었다. 이 테스트는 재검수가 지정한 표면(가이드 · 상세 인트로/우선도 카드/점수 근거 · 툴팁)에서
// (1) 겨냥된 절대-점수 문구가 되살아나지 않는지, (2) 비교 척도 + 유니버스 의존 공개가 유지되는지,
// (3) 완성도 라벨이 "입력 데이터 완성도"로 바뀌고 정확성/수익 미보장 고지가 존재하는지,
// (4) 점수와 순위가 여전히 구별되는지를 함께 고정한다. 한/영 동기화도 검사한다.
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

// 스캔 대상 = 재검수가 지정한 점수-척도 표면.
const SURFACES = {
  guide: read("src/lib/copy/metricsGuide.ts"),
  stockDetail: read("src/lib/copy/stockDetail.ts"),
  tooltip: read("src/components/ScoreTooltip.tsx"),
};
const ALL: Array<[string, string]> = [
  ["guide", SURFACES.guide],
  ["stockDetail", SURFACES.stockDetail],
  ["tooltip", SURFACES.tooltip],
];

// ── 1. 겨냥된 절대-점수 문구가 모든 표면에서 사라졌는지 ─────────────────────────
// "절대 변동성"(risk detail, 합법 용어)·"절대 점수가 아니라/아닙니다"(부정문)는 대상 아님 —
// 아래 패턴은 점수를 절대값/절대 해석으로 단정하던 시그니처만 겨냥한다.
const FORBIDDEN: Array<[string, RegExp]> = [
  ["0~100 절대값", /0~100\s*절대값/],
  ["점수는 절대 해석", /점수는\s*절대\s*해석/],
  ["absolute value from 0 to 100", /absolute value from 0 to 100/i],
  ["absolute 0–100 value", /absolute\s*0[–\-]100\s*value/i],
  ["an absolute read", /an absolute read/i],
];
for (const [fname, body] of ALL) {
  for (const [label, re] of FORBIDDEN) {
    check(`1: ${fname} drops targeted absolute-score phrase ("${label}")`, !re.test(body));
  }
}

// ── 2. 비교 척도(comparative scale) 표현이 각 표면에 존재 ────────────────────────
check("2a: guide (ko) uses 비교 척도", /비교\s*척도/.test(SURFACES.guide));
check("2a: guide (en) uses comparative 0–100 scale", /comparative\s*0[–\-]100\s*scale/i.test(SURFACES.guide));
check("2b: stock-detail (ko) uses 비교 척도", /비교\s*척도/.test(SURFACES.stockDetail));
check("2b: stock-detail (en) uses comparative 0–100 scale", /comparative\s*0[–\-]100\s*scale/i.test(SURFACES.stockDetail));
check("2c: tooltip (composite) uses 비교 척도", /비교\s*척도/.test(SURFACES.tooltip));

// ── 3. 유니버스 의존 공개(추세·밸류는 현재 유니버스 백분위) ──────────────────────
// ko: 추세·밸류가 유니버스 내 백분위임을 밝힌다.
check("3a: guide (ko) discloses universe-relative 추세·밸류", /추세[·].*밸류[\s\S]{0,40}유니버스[\s\S]{0,20}백분위/.test(SURFACES.guide));
check("3a: stock-detail (ko) discloses universe-relative 추세·밸류", /추세[·].*밸류[\s\S]{0,20}유니버스[\s\S]{0,20}백분위/.test(SURFACES.stockDetail));
check("3a: tooltip (ko) discloses universe-relative 추세·밸류", /추세[·].*밸류[\s\S]{0,40}유니버스[\s\S]{0,20}백분위/.test(SURFACES.tooltip));
// en: trend·valuation are percentiles within the current universe.
check("3b: guide (en) discloses universe percentiles", /trend and valuation[\s\S]{0,60}percentiles?[\s\S]{0,30}universe/i.test(SURFACES.guide));
check("3b: stock-detail (en) discloses universe percentiles", /trend and valuation[\s\S]{0,60}(universe percentiles|percentiles[\s\S]{0,20}universe)/i.test(SURFACES.stockDetail));

// ── 4. 입력 데이터 완성도 라벨 + 정확성/수익 미보장 고지 ────────────────────────
// 완성도 배지 라벨이 신뢰(정확성 함의) → 입력 데이터 완성도로 개명됐는지.
check("4a: trust label renamed to 입력 데이터 완성도 (ko)", /trustLabel:\s*"입력 데이터 완성도"/.test(SURFACES.stockDetail));
check("4a: trust label renamed to Input-data completeness (en)", /trustLabel:\s*"Input-data completeness"/.test(SURFACES.stockDetail));
check("4b: no legacy 데이터 신뢰 trust label", !/trustLabel:\s*"데이터 신뢰"/.test(SURFACES.stockDetail));
check("4b: no legacy Data trust label", !/trustLabel:\s*"Data trust"/.test(SURFACES.stockDetail));
// 완성도가 원본 정확성·향후 수익을 보장하지 않음을 명시(ko+en).
check("4c: completeness note (ko) disclaims accuracy/returns", /완성도[\s\S]{0,40}정확성[\s\S]{0,20}수익[\s\S]{0,10}보장하지\s*않/.test(SURFACES.stockDetail));
check("4c: completeness note (en) disclaims accuracy/returns", /does not guarantee source-data accuracy or future returns/i.test(SURFACES.stockDetail));

// ── 5. 점수와 순위는 여전히 구별(순위=상대 위치) — 점수 독립성 주장 없이 ───────────
check("5a: stock-detail keeps 순위 as 상대 위치 (ko)", /순위는[\s\S]{0,20}상대\s*위치/.test(SURFACES.stockDetail));
check("5a: stock-detail keeps rank as relative position (en)", /rank is the relative position/i.test(SURFACES.stockDetail));
check("5b: guide keeps 상대순위 distinct (ko)", /상대순위/.test(SURFACES.guide));
check("5b: guide keeps relative rank distinct (en)", /relative rank/i.test(SURFACES.guide));

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(
  "PASS: score-scale + input-completeness copy contract (comparative 0–100 scale everywhere; universe-relative metrics disclosed; input-data completeness label with accuracy/returns disclaimer; score vs rank stays distinct; ko/en synced)",
);
