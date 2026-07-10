// priceSummary.ts 단위 assertion — computePriceSummary 파생 수치 고정(회귀 가드).
// 실행: npx tsx scripts/test_priceSummary.ts (실패 시 비정상 종료, 성공 시 PASS 1줄).
//
// 접근성/SEO fallback 텍스트는 서버 렌더 수치라, 계산이 조용히 바뀌면 사용자가 보는
// 문구가 틀어진다. 3개월/1개월 등락률·최대낙폭·구간 등락률·기준일 경계를 고정한다.
import {
  computePriceSummary,
  computeChartEvents,
  signedPctText,
  TRADING_DAYS_3M,
  TRADING_DAYS_1M,
  SURGE_3M_THRESHOLD_PCT,
} from "../src/lib/priceSummary";
import type { PricePoint } from "../src/lib/priceHistory";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}
function near(a: number | null, b: number, eps = 0.05): boolean {
  return a !== null && Math.abs(a - b) < eps;
}

// 종가 배열 헬퍼(날짜는 순서만 의미).
function pts(closes: number[]): PricePoint[] {
  return closes.map((c, i) => ({ d: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`, c, v: 1000 }));
}

// A. 2점 미만 → 전부 null, tradingDays 유지.
{
  const s = computePriceSummary(pts([100]));
  check("single point → fullReturn null", s.fullReturnPct === null);
  check("single point → tradingDays 1", s.tradingDays === 1);
  check("single point → drawdown null", s.maxDrawdownPct === null);
}

// B. 짧은 상승 시계열(2점) → 구간 등락률만, 3M/1M은 부족 → null.
{
  const s = computePriceSummary(pts([100, 110]));
  check("2pt fullReturn +10%", near(s.fullReturnPct, 10));
  check("2pt return3m null (insufficient)", s.return3mPct === null);
  check("2pt return1m null (insufficient)", s.return1mPct === null);
  check("2pt lastClose 110", s.lastClose === 110);
  check("2pt no drawdown (monotonic up)", s.maxDrawdownPct === null);
}

// C. 단조 상승이면 낙폭 없음(null), 하락 구간이 있으면 최대낙폭 음수.
{
  const up = computePriceSummary(pts(Array.from({ length: 70 }, (_, i) => 100 + i)));
  check("monotonic up → drawdown null", up.maxDrawdownPct === null);
  // 100 고점 후 80까지 하락 → -20% 낙폭.
  const dip = computePriceSummary(pts([80, 90, 100, 95, 80, 85]));
  check("dip → maxDrawdown -20%", near(dip.maxDrawdownPct, -20));
}

// D. 충분한 이력에서 3M(63)·1M(21) 등락률 경계.
{
  // 길이 64: index 0..63. 마지막=index63. 3M 기준 index0, 1M 기준 index42.
  const closes = Array.from({ length: 64 }, (_, i) => 100 + i); // 100..163
  const s = computePriceSummary(pts(closes));
  // 3M: (163-100)/100 = +63%
  check("3M return present at length 64", near(s.return3mPct, 63));
  // 1M: index 63-21=42 → close 142 → (163-142)/142
  check("1M return present at length 64", near(s.return1mPct, ((163 - 142) / 142) * 100));
  check("TRADING_DAYS constants", TRADING_DAYS_3M === 63 && TRADING_DAYS_1M === 21);
}

// E. 정확히 3M 경계 미만(길이 63 → n-1=62 < 63)에서는 3M null.
{
  const s = computePriceSummary(pts(Array.from({ length: 63 }, (_, i) => 100 + i)));
  check("length 63 → return3m null (boundary)", s.return3mPct === null);
  check("length 63 → return1m present", s.return1mPct !== null);
}

// F. signedPctText 포맷.
check("signedPctText +", signedPctText(12.34) === "+12.3%");
check("signedPctText -", signedPctText(-4.5) === "-4.5%");
check("signedPctText zero → +0.0%", signedPctText(0) === "+0.0%");
check("signedPctText null", signedPctText(null) === null);

// G. from/to 날짜 전달.
{
  const s = computePriceSummary(pts([100, 101, 102]));
  check("fromDate first", s.fromDate === "2026-01-01");
  check("toDate last", s.toDate === "2026-01-03");
  check("tradingDays 3", s.tradingDays === 3);
}

// ── computeChartEvents (차트 마커 스캐폴드) ───────────────────────────────
// 날짜·거래량을 명시하는 헬퍼(급증 판정 검증용).
function dpts(rows: { d: string; c: number; v: number }[]): PricePoint[] {
  return rows.map((r) => ({ d: r.d, c: r.c, v: r.v }));
}
function seqDate(i: number): string {
  // 2026-01-01 부터 순차 증가(월/일 롤오버 단순 처리, 순서만 의미).
  const day = (i % 28) + 1;
  const month = Math.floor(i / 28) + 1;
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// H. 2점 미만 → 전부 빈 값.
{
  const e = computeChartEvents(pts([100]));
  check("events single → trough null", e.maxDrawdownTroughDate === null);
  check("events single → surge null", e.surge3m === null);
  check("events single → spike 0", e.volumeSpikeCount === 0);
}

// I. 고점→저점 낙폭 구간 날짜.
{
  // 100 → 120(고점, idx2) → 90(저점, idx4)
  const e = computeChartEvents(
    dpts([
      { d: "2026-01-01", c: 100, v: 1000 },
      { d: "2026-01-02", c: 110, v: 1000 },
      { d: "2026-01-03", c: 120, v: 1000 },
      { d: "2026-01-04", c: 100, v: 1000 },
      { d: "2026-01-05", c: 90, v: 1000 },
    ]),
  );
  check("events peak date = high", e.maxDrawdownPeakDate === "2026-01-03");
  check("events trough date = low", e.maxDrawdownTroughDate === "2026-01-05");
}

// J. 3개월 급등 구간 — 임계 이상일 때만.
{
  // length 64: idx0=100 → idx63=160 → +60% (임계 40 이상)
  const rising = computeChartEvents(
    dpts(Array.from({ length: 64 }, (_, i) => ({ d: seqDate(i), c: 100 + i, v: 1000 }))),
  );
  check("surge3m present when >= threshold", rising.surge3m !== null && rising.surge3m.pct >= SURGE_3M_THRESHOLD_PCT);
  check("surge3m fromDate/toDate set", !!rising.surge3m?.fromDate && !!rising.surge3m?.toDate);
  // length 64 flat → null.
  const flat = computeChartEvents(
    dpts(Array.from({ length: 64 }, (_, i) => ({ d: seqDate(i), c: 100, v: 1000 }))),
  );
  check("surge3m null when flat", flat.surge3m === null);
  // length 63(경계, n-1=62 < 63) → null.
  const short = computeChartEvents(
    dpts(Array.from({ length: 63 }, (_, i) => ({ d: seqDate(i), c: 100 + i * 2, v: 1000 }))),
  );
  check("surge3m null below 3m history", short.surge3m === null);
}

// K. 거래량 급증일 — baseline 20일 중앙값 3배 이상.
{
  const rows = Array.from({ length: 30 }, (_, i) => ({ d: seqDate(i), c: 100, v: 1000 }));
  rows[25].v = 5000; // 중앙값 1000 대비 5배 → 급증
  const e = computeChartEvents(dpts(rows));
  check("volume spike counted", e.volumeSpikeCount >= 1);
  check("recent spike date set", e.recentVolumeSpikeDate === rows[25].d);
  // 급증 없음.
  const calm = computeChartEvents(dpts(Array.from({ length: 30 }, (_, i) => ({ d: seqDate(i), c: 100, v: 1000 }))));
  check("no spike when volume flat", calm.volumeSpikeCount === 0 && calm.recentVolumeSpikeDate === null);
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}
console.log("PASS: priceSummary (35 assertions)");
