// 거래활성도(trading-activity) 소스 계약 가드 (Slice D) — 실행: npx tsx scripts/test_tradingActivityContract.ts
// 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// 사실(계약 정본): 거래활성도 지표의 계산 입력은 **주식 체결 수량(share volume, 거래량)**이며
// 거래대금(turnover value, 원)이 아니다. 이 지표는 가격 방향(상승/하락)이나 매매 주체(외국인/기관 등)를
// 인코딩하지 않는다. 재검수(2026-07-15)에서 계산은 거래량인데 일부 상세/카드/알림 문구가 거래대금으로
// 설명하던 계약 불일치가 확인되었다. 이 테스트는 재검수가 지정한 표면
// (계산 입력 · 타입 의미 · 가이드 · 카드 · 상세 팩터/툴팁 · 알림 · 픽스처)에서
// (1) 입력을 거래대금으로 부르는 문구가 되살아나지 않는지, (2) 거래량 표기와
// 방향/매매 주체 범위-밖 고지가 유지되는지를 함께 고정한다.
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

// 스캔 대상 = 재검수가 지정한 공개/개발 표면.
const SURFACES = {
  metrics: read("src/lib/metrics.ts"),
  computeMetrics: read("scripts/compute_metrics.py"),
  realStocks: read("src/lib/realStocks.ts"),
  scoreBasis: read("src/lib/scoreBasis.ts"),
  homeSnapshot: read("src/lib/homeSnapshot.ts"),
  today: read("src/lib/copy/today.ts"),
  guide: read("src/lib/copy/metricsGuide.ts"),
  tooltip: read("src/components/ScoreTooltip.tsx"),
  readings: read("src/lib/metricReadings.ts"),
  alertCatalog: read("src/lib/alertCatalog.ts"),
  alertCards: read("src/components/notifications/AlertExampleCards.tsx"),
};

// ── 1. 계산 입력 = 거래량(volume), 거래대금 아님 ──────────────────────────────
// metrics.ts: flowScore는 거래량 배열을 받는다.
check("1a: flowScore takes a volumes array", /flowScore\(\s*volumes\s*:/.test(SURFACES.metrics));
check("1a: metrics flow doc names 거래량", /거래활성도[\s\S]{0,200}거래량/.test(SURFACES.metrics));
// compute_metrics.py: 실제 입력은 df["Volume"]이고, 주석이 거래량/거래대금-아님을 명시.
check("1b: calc_flow reads df Volume column", /def calc_flow[\s\S]{0,400}vols = df\["Volume"\]/.test(SURFACES.computeMetrics));
check("1b: calc_flow comment says share volume, not turnover", /거래량[\s\S]{0,120}거래대금[\s\S]{0,40}(아님|아니)/.test(SURFACES.computeMetrics));

// ── 2. 타입 의미는 한 곳(realStocks.ts flowStats)에서만 정의 ───────────────────
const flowStatsDoc = SURFACES.realStocks;
check("2a: flowStats doc names share volume / 거래량", /share volume, 거래량/.test(flowStatsDoc));
check("2b: flowStats doc clarifies not turnover value", /거래대금[\s\S]{0,40}(아니|아님)/.test(flowStatsDoc));
check("2c: flowStats doc states direction/buyer out of scope", /가격 방향[\s\S]{0,60}매매 주체/.test(flowStatsDoc));
// 호환 필드명은 유지(의미만 문서화).
check("2d: compat field names retained", /recent5dAvg\?: number; recent20dAvg\?: number; ratio\?: number/.test(flowStatsDoc));

// ── 3. 입력을 거래대금으로 부르는 문구가 공개 표면에서 사라졌는지 ────────────────
// 재검수에서 실제 문제였던 "입력=거래대금" 시그니처. (가이드의 "거래대금…미반영" 부정문은 대상 아님)
const FORBIDDEN: Array<[string, RegExp]> = [
  ["평균 거래대금", /평균\s*거래대금/],
  ["거래대금 비율", /거래대금\s*비율/],
  ["거래대금 추세", /거래대금\s*추세/],
  ["거래대금이 평소", /거래대금이\s*평소/],
  ["거래대금·관심", /거래대금\s*[·]\s*관심/],
  ["turnover and interest", /turnover and interest/i],
  ["higher-than-usual turnover", /higher-?than-?usual turnover/i],
];
const PUBLIC_SURFACES: Array<[string, string]> = [
  ["scoreBasis", SURFACES.scoreBasis],
  ["homeSnapshot", SURFACES.homeSnapshot],
  ["today", SURFACES.today],
  ["tooltip", SURFACES.tooltip],
  ["readings", SURFACES.readings],
  ["alertCatalog", SURFACES.alertCatalog],
  ["alertCards", SURFACES.alertCards],
];
for (const [fname, body] of PUBLIC_SURFACES) {
  for (const [label, re] of FORBIDDEN) {
    check(`3: ${fname} does not describe input as turnover ("${label}")`, !re.test(body));
  }
}

// ── 4. 표면별 거래량 표기가 유지되는지(회귀 시 실패) ──────────────────────────
// 상세 근거 팩터(scoreBasis).
check("4a: score-basis flow factor label uses 거래량", /최근 5일\/20일 평균 거래량/.test(SURFACES.scoreBasis));
// Today 카드 카피(ko+en).
check("4b: today card caption (ko) uses 거래량", /거래량[·].*관심/.test(SURFACES.today) || /거래량·관심/.test(SURFACES.today));
check("4b: today card caption (en) uses trading volume", /trading volume/i.test(SURFACES.today));
// 알림 카피(catalog + example).
check("4c: alert catalog uses 거래량", /거래량이\s*평소/.test(SURFACES.alertCatalog));
check("4c: alert example card uses 거래량", /거래량이\s*평소의/.test(SURFACES.alertCards));

// ── 5. 가격 방향·매매 주체는 범위 밖(공개 문구가 명시) ───────────────────────────
// 가이드: 한계에 가격 방향 + 수급(외국인/기관) 미반영.
check("5a: guide states 가격 방향 out of scope", /가격 방향/.test(SURFACES.guide));
check("5b: guide states investor-type (수급) out of scope", /수급\(외국인\/기관\)/.test(SURFACES.guide));
// 상세 툴팁: 가격 방향 + 매매 주체.
check("5c: flow tooltip states 가격 방향 out of scope", /가격 방향[\s\S]{0,80}매매 주체/.test(SURFACES.tooltip));
// 알림: 가격 방향 + 매매 주체(누가 사고파는지).
check("5d: alert catalog states direction + buyer identity out of scope", /가격 방향[\s\S]{0,40}(매매 주체|사고파)/.test(SURFACES.alertCatalog));
check("5e: alert example states direction + buyer identity out of scope", /가격 방향[\s\S]{0,40}매매 주체/.test(SURFACES.alertCards));
// Today 카드 카피가 방향/매매 주체 아님을 명시(ko+en).
check("5f: today card (ko) states not direction/buyer", /가격 방향\/매매 주체 아님/.test(SURFACES.today));
check("5f: today card (en) states not direction/buyer", /not price direction or buyer identity/i.test(SURFACES.today));

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(
  "PASS: trading-activity source contract (input=share volume everywhere; no turnover-value input wording; direction/buyer identity out of scope; typed semantics documented once)",
);
