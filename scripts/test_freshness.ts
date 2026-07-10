// freshness.ts 단위 assertion — computeMarketFreshness 상태 경계 고정(동작 회귀 가드).
// 실행: npx tsx scripts/test_freshness.ts (실패 시 비정상 종료, 성공 시 PASS 1줄).
//
// 핵심 분리: "파이프라인 정상"과 "최신 시세 반영"은 다르다.
// - 금요일 장마감 이후(수집 컷오프 경과) 전 거래일 데이터만 있으면 awaiting_close(경미), 정상 아님.
// - 오늘 종가가 반영됐거나 아직 장중/컷오프 전이면 fresh.
// - 2영업일 이상 뒤처지면 stale(파이프라인 지연).
import { computeMarketFreshness, type MarketFreshnessState } from "../src/lib/freshness";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

// KST 벽시계 시각 → Date(UTC = KST - 9h). computeMarketFreshness가 내부에서 +9h 하여 KST를 복원한다.
function kst(y: number, mo: number, d: number, h: number, min: number): Date {
  return new Date(Date.UTC(y, mo - 1, d, h - 9, min));
}

function state(asOf: string | undefined, now: Date): MarketFreshnessState {
  return computeMarketFreshness(asOf, now).state;
}

// 2026-07-09 목, 07-10 금, 07-11 토, 07-12 일, 07-13 월.
// A. 금 장마감 이후(20:00), 데이터는 전 거래일(목) → 오늘 마감 수집 전.
check("Fri after cutoff, prev-day data → awaiting_close", state("20260709", kst(2026, 7, 10, 20, 0)) === "awaiting_close");
// B. 금 장중(10:00, 컷오프 전), 데이터는 목 → 아직 오늘 종가 기대 대상 아님 → fresh.
check("Fri before cutoff, prev-day data → fresh", state("20260709", kst(2026, 7, 10, 10, 0)) === "fresh");
// C. 금 장마감 이후, 데이터가 오늘(금) → fresh.
check("Fri after cutoff, today data → fresh", state("20260710", kst(2026, 7, 10, 20, 0)) === "fresh");
// D. 토요일, 데이터가 금 → 마지막 거래일 반영 → fresh.
check("Sat, Fri data → fresh", state("20260710", kst(2026, 7, 11, 12, 0)) === "fresh");
// E. 토요일, 데이터가 목(금 누락) → 파이프라인 지연 → stale.
check("Sat, Thu data (Fri missing) → stale", state("20260709", kst(2026, 7, 11, 12, 0)) === "stale");
// F. 월 장마감 이후, 데이터가 금 → 오늘(월) 마감 수집 전 → awaiting_close.
check("Mon after cutoff, Fri data → awaiting_close", state("20260710", kst(2026, 7, 13, 20, 0)) === "awaiting_close");
// G. 월 장마감 이후, 데이터가 목(2영업일 뒤) → stale.
check("Mon after cutoff, Thu data (2 biz days) → stale", state("20260709", kst(2026, 7, 13, 20, 0)) === "stale");
// H. asOf 없음/형식 오류 → unknown.
check("undefined asOf → unknown", state(undefined, kst(2026, 7, 10, 20, 0)) === "unknown");
check("malformed asOf → unknown", state("2026-07-09", kst(2026, 7, 10, 20, 0)) === "unknown");
// I. 데이터가 예상 거래일보다 앞섬(미래 배치) → 비정상 아님 → fresh.
check("asOf ahead of expected → fresh", state("20260713", kst(2026, 7, 10, 20, 0)) === "fresh");

// tradingDaysBehind / expectedTradingDate 스팟 체크.
const a = computeMarketFreshness("20260709", kst(2026, 7, 10, 20, 0));
check("awaiting expectedTradingDate = today(Fri)", a.expectedTradingDate === "20260710");
check("awaiting tradingDaysBehind = 1", a.tradingDaysBehind === 1);
check("awaiting afterClose = true", a.afterClose === true);

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}
console.log("PASS: freshness (13 assertions)");
