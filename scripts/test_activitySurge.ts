// activitySurge 단일 소스 회귀 가드 (Slice A) — 실행: npx tsx scripts/test_activitySurge.ts
// 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// /today의 '거래활성도 급증'은 요약 KPI 카드·브리핑 숫자·표시 목록 세 곳에 나타난다.
// 과거에는 각각 다른 필터(ratio||flow / flow>=70 / ratio||flow+suspect제외)로 세어 한 라벨이
// 서로 다른 집단을 가리켰다. 이 테스트는 (1) 단일 결과의 count===items.length 불변식과
// (2) 페이지/컴포넌트 소스에 독립적인 재계산이 되살아나지 않았는지를 함께 고정한다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { activitySurge, isActivitySurge, VOLUME_SPIKE_RATIO } from "../src/lib/homeSnapshot";
import type { RealStock } from "../src/lib/realStocks";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");

// 최소 종목 팩토리 — activitySurge가 읽는 필드(flow/flowStats/per/pbr/roe)만 채우고 나머지는 캐스팅.
function stock(p: {
  ticker: string;
  flow: number;
  ratio?: number;
  per?: number;
  pbr?: number;
  roe?: number;
}): RealStock {
  return {
    ticker: p.ticker,
    name: p.ticker,
    flow: p.flow,
    flowStats: p.ratio === undefined ? {} : { ratio: p.ratio },
    per: p.per ?? 12,
    pbr: p.pbr ?? 1.2,
    roe: p.roe ?? 10,
  } as unknown as RealStock;
}

// ── A. 비어있지 않은 상태: ratio 급증 + flow 폴백 급증 + 미달 + 이상데이터 혼합 ──
{
  const pool = [
    stock({ ticker: "RATIO_HIT", flow: 60, ratio: 2.0 }), // ratio>=1.5 → 급증
    stock({ ticker: "FLOW_HIT", flow: 80 }), // ratio 결측, flow>=75 → 급증
    stock({ ticker: "RATIO_MISS", flow: 90, ratio: 1.0 }), // ratio<1.5(우선) → 미급증(flow 무시됨)
    stock({ ticker: "BELOW", flow: 50 }), // ratio 결측, flow<75 → 미급증
    stock({ ticker: "SUSPECT", flow: 95, ratio: 3.0, roe: 90 }), // 급증이지만 이상데이터 → 제외
  ];
  const r = activitySurge(pool);
  check("A: count === items.length", r.count === r.items.length);
  check("A: count is 2 (suspect excluded, misses excluded)", r.count === 2);
  check("A: suspect never appears in items", !r.items.some((s) => s.ticker === "SUSPECT"));
  check("A: only qualifying tickers present", r.items.every((s) => s.ticker === "RATIO_HIT" || s.ticker === "FLOW_HIT"));
  check("A: sorted by flow desc", r.items[0].flow >= r.items[r.items.length - 1].flow && r.items[0].ticker === "FLOW_HIT");

  // 독립 재계산 방지의 근거: 옛 브리핑 임계값(flow>=70)은 다른 집단을 센다 → 반드시 단일 소스여야 함.
  const legacyFlow70 = pool.filter((s) => s.flow >= 70).length; // RATIO_MISS, FLOW_HIT, SUSPECT = 3
  check("A: legacy flow>=70 count diverges from unified count", legacyFlow70 !== r.count);
}

// ── B. 제로 상태: 아무도 급증 기준 미달 ──
{
  const pool = [
    stock({ ticker: "LOW1", flow: 40, ratio: 1.0 }),
    stock({ ticker: "LOW2", flow: 60 }),
  ];
  const r = activitySurge(pool);
  check("B: zero-state count === items.length", r.count === r.items.length);
  check("B: zero-state count is 0", r.count === 0);
  check("B: zero-state items empty", r.items.length === 0);
}

// ── C. 빈 풀 ──
{
  const r = activitySurge([]);
  check("C: empty pool count === items.length === 0", r.count === 0 && r.items.length === 0);
}

// ── D. 판정식 단일성: isActivitySurge 경계(ratio 우선, 결측 시 flow 폴백) ──
{
  check("D: ratio at threshold surges", isActivitySurge(stock({ ticker: "x", flow: 0, ratio: VOLUME_SPIKE_RATIO })));
  check("D: ratio below threshold does not surge", !isActivitySurge(stock({ ticker: "x", flow: 99, ratio: VOLUME_SPIKE_RATIO - 0.01 })));
  check("D: flow fallback surges when ratio missing", isActivitySurge(stock({ ticker: "x", flow: 75 })));
  check("D: flow below fallback does not surge", !isActivitySurge(stock({ ticker: "x", flow: 74 })));
}

// ── E. 소스 가드: 독립 재계산이 되살아나면 실패 ──
{
  const page = readFileSync(join(repo, "src/app/today/page.tsx"), "utf8");
  const content = readFileSync(join(repo, "src/components/today/TodayContent.tsx"), "utf8");

  // 단일 소스: activitySurge를 정확히 한 번만 호출.
  const surgeCalls = (page.match(/activitySurge\(/g) ?? []).length;
  check("E: page calls activitySurge exactly once", surgeCalls === 1);

  // 옛 경쟁 임계값(flow>=70)이 카운트로 되살아나면 실패.
  check("E: no legacy flow>=70 count in page", !/s\.flow\s*>=\s*70/.test(page));
  // 옛 별도 카운트 변수/헬퍼가 되살아나면 실패.
  check("E: no volumeSpikeCount recount in page", !/volumeSpikeCount\s*\(/.test(page));
  check("E: no separate flowSurgeCount in page", !/flowSurgeCount/.test(page));
  check("E: no inline VOLUME_SPIKE threshold in page", !/VOLUME_SPIKE_(RATIO|FLOW)/.test(page));

  // 컴포넌트: KPI와 브리핑이 하나의 activitySurgeCount prop만 소비(별개 prop 두 개 금지).
  check("E: component exposes single activitySurgeCount prop", /activitySurgeCount/.test(content));
  check("E: no legacy spikeCount prop in component", !/props\.spikeCount/.test(content));
  check("E: no legacy flowSurgeCount prop in component", !/props\.flowSurgeCount/.test(content));
  // KPI 카드와 브리핑 숫자가 같은 prop을 렌더 — 두 렌더 지점 모두 activitySurgeCount 참조.
  const propRefs = (content.match(/props\.activitySurgeCount/g) ?? []).length;
  check("E: both render locations consume activitySurgeCount", propRefs >= 2);
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("PASS: activitySurge single-source contract (non-empty, zero-state, count===items.length, no independent recount)");
