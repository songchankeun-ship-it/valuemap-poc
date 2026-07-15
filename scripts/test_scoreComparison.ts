// 날짜 인지 점수 비교 기준(basis) 순수 회귀 테스트 (Slice B) — 실행: npx tsx scripts/test_scoreComparison.ts
// 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// 과거 getScoreChangesBatch/getMetricChangesBatch 는 daily_scores 최근 2행을 무조건 "전일(어제)"로
// 부르며 날짜를 버렸다. 두 행은 실제로 여러 거래일 떨어져 있을 수 있으므로, 이 테스트는 로컬 마켓 날짜
// 시퀀스에 대조한 분류(전 거래일 / N거래일 전 / 최근 저장 데이터 / 비교 불가)와 라벨을 순수 함수로 고정한다.
// 필수 케이스: consecutive · skipped · unknown · mixed-date · empty-history.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  type ComparisonBasis,
  marketDateSequence,
  classifyComparisonBasis,
  sharedComparisonBasis,
  comparisonBasisLabel,
  comparisonBasisDateHint,
  UNAVAILABLE_BASIS,
} from "../src/lib/scoreComparison";

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");

// 대표 마켓 날짜 시퀀스(최신순) — 07-11(금)·07-14(월)·07-15(화). 주말 건너뜀은 거래일 인접으로 취급.
const MARKET = ["2026-07-15", "2026-07-14", "2026-07-11"];

// ── 1. consecutive: 인접 두 거래일 → 전 거래일 ──
{
  const b = classifyComparisonBasis("2026-07-15", "2026-07-14", MARKET);
  check("consecutive → previous-trading-day", b.kind === "previous-trading-day");
  check("consecutive carries both dates", b.kind === "previous-trading-day" && b.toDate === "2026-07-15" && b.fromDate === "2026-07-14");
  // 주말을 건너뛴 07-14↔07-11 도 시퀀스상 인접 → 전 거래일(달력일 3일차라도).
  const wk = classifyComparisonBasis("2026-07-14", "2026-07-11", MARKET);
  check("weekend-adjacent → previous-trading-day", wk.kind === "previous-trading-day");
}

// ── 2. skipped: 한 거래일 건너뜀(간격 2) → N거래일 전 ──
{
  const b = classifyComparisonBasis("2026-07-15", "2026-07-11", MARKET);
  check("skipped → n-trading-days-ago", b.kind === "n-trading-days-ago");
  check("skipped reports gap of 2", b.kind === "n-trading-days-ago" && b.tradingDaysAgo === 2);
  check("skipped carries both dates", b.kind === "n-trading-days-ago" && b.toDate === "2026-07-15" && b.fromDate === "2026-07-11");
}

// ── 3. unknown: 날짜가 시퀀스에 없음 → 최근 저장 데이터(간격 불명, 날짜는 유지) ──
{
  const b = classifyComparisonBasis("2026-07-15", "2026-06-30", MARKET);
  check("unknown (from not in market) → recent-stored", b.kind === "recent-stored");
  check("unknown recent-stored keeps dates", b.kind === "recent-stored" && b.fromDate === "2026-06-30" && b.toDate === "2026-07-15");
  // 순서 뒤집힘(from 이 to 보다 최신)도 안전하게 recent-stored 로.
  const rev = classifyComparisonBasis("2026-07-11", "2026-07-15", MARKET);
  check("reversed order → recent-stored", rev.kind === "recent-stored");
  // 빈 마켓 시퀀스(단일 종목 상세) → 항상 recent-stored + 날짜 유지.
  const solo = classifyComparisonBasis("2026-07-15", "2026-07-14", []);
  check("empty market sequence → recent-stored", solo.kind === "recent-stored" && solo.fromDate === "2026-07-14");
}

// ── 4. mixed-date: 종목마다 커버리지가 달라 basis 가 섞임 ──
{
  // 두 종목의 날짜 합집합에서 시퀀스를 만들면, 중간 날짜(07-14)를 놓친 종목 B 는 자연히 N거래일 전이 된다.
  const seq = marketDateSequence(["2026-07-15", "2026-07-14", "2026-07-14", "2026-07-11", "2026-07-15"]);
  check("marketDateSequence dedupes+sorts desc", seq.length === 3 && seq[0] === "2026-07-15" && seq[2] === "2026-07-11");
  const stockA = classifyComparisonBasis("2026-07-15", "2026-07-14", seq); // 연속
  const stockB = classifyComparisonBasis("2026-07-15", "2026-07-11", seq); // 07-14 결측 → 간격 2
  check("mixed: stock A previous-trading-day", stockA.kind === "previous-trading-day");
  check("mixed: stock B n-trading-days-ago(2)", stockB.kind === "n-trading-days-ago" && stockB.tradingDaysAgo === 2);
  // 섞이면 하나의 "전 거래일"이라 단정하지 않고 recent-stored 로 축약(가장 최근 창의 날짜 유지).
  const shared = sharedComparisonBasis([stockA, stockB]);
  check("mixed shared basis → recent-stored (no false previous-day)", shared.kind === "recent-stored");
  check("mixed shared basis keeps a real to-date", shared.kind === "recent-stored" && shared.toDate === "2026-07-15");
  // 균일하면(모두 동일 종류·동일 날짜) 그 기준 그대로 유지.
  const uniform = sharedComparisonBasis([stockA, classifyComparisonBasis("2026-07-15", "2026-07-14", seq)]);
  check("uniform shared basis → previous-trading-day", uniform.kind === "previous-trading-day");
}

// ── 5. empty-history: 행이 없거나 하나뿐 / 같은 날짜 → 비교 불가 ──
{
  check("null from → unavailable", classifyComparisonBasis("2026-07-15", null, MARKET).kind === "unavailable");
  check("null to → unavailable", classifyComparisonBasis(undefined, "2026-07-14", MARKET).kind === "unavailable");
  check("same date → unavailable", classifyComparisonBasis("2026-07-15", "2026-07-15", MARKET).kind === "unavailable");
  check("no defined bases → shared unavailable", sharedComparisonBasis([UNAVAILABLE_BASIS, UNAVAILABLE_BASIS]).kind === "unavailable");
  check("empty basis list → shared unavailable", sharedComparisonBasis([]).kind === "unavailable");
}

// ── 6. 라벨/힌트: 각 종류에서 "전일/어제"라 단정하지 않고 실제 기준을 표현(ko/en) ──
{
  const prev: ComparisonBasis = { kind: "previous-trading-day", fromDate: "2026-07-14", toDate: "2026-07-15" };
  const nAgo: ComparisonBasis = { kind: "n-trading-days-ago", tradingDaysAgo: 3, fromDate: "2026-07-10", toDate: "2026-07-15" };
  const recent: ComparisonBasis = { kind: "recent-stored", fromDate: "2026-07-14", toDate: "2026-07-15" };
  check("label prev ko", comparisonBasisLabel(prev, "ko") === "전 거래일 대비");
  check("label prev en", comparisonBasisLabel(prev, "en") === "vs. the previous trading day");
  check("label nAgo ko has count", comparisonBasisLabel(nAgo, "ko") === "3거래일 전 대비");
  check("label nAgo en has count", comparisonBasisLabel(nAgo, "en") === "vs. 3 trading days ago");
  check("label recent ko", comparisonBasisLabel(recent, "ko") === "최근 저장 데이터 대비");
  check("label unavailable ko", comparisonBasisLabel(UNAVAILABLE_BASIS, "ko") === "비교 기준 없음");
  // 힌트는 항상 실제 날짜(MM-DD)를 밝힌다.
  check("hint recent shows real date", comparisonBasisDateHint(recent, "ko") === "07-14 대비");
  check("hint nAgo shows date + gap", comparisonBasisDateHint(nAgo, "ko") === "07-10 대비 (3거래일 전)");
  check("hint unavailable ko", comparisonBasisDateHint(UNAVAILABLE_BASIS, "ko") === "점수 이력 부족");
  // 어떤 라벨도 "어제/yesterday"라는 단정 표현을 쓰지 않는다.
  const allLabels = [prev, nAgo, recent, UNAVAILABLE_BASIS].flatMap((b) => [comparisonBasisLabel(b, "ko"), comparisonBasisLabel(b, "en")]);
  check("no label claims 'yesterday/어제'", allLabels.every((l) => !/어제|yesterday/i.test(l)));
}

// ── 7. 소스 가드: 배치 read 가 basis 계약을 실제로 소비하고, today 카피가 basis 인지형으로 남아있는지 ──
{
  const scoreHist = readFileSync(join(repo, "src/lib/scoreHistory.ts"), "utf8");
  check("scoreHistory imports classifyComparisonBasis", /classifyComparisonBasis/.test(scoreHist));
  check("scoreHistory computes sharedBasis", /sharedComparisonBasis/.test(scoreHist));
  check("score batch carries basis field", /basis:\s*classifyComparisonBasis/.test(scoreHist));

  const todayCopy = readFileSync(join(repo, "src/lib/copy/today.ts"), "utf8");
  // 요약/캡션/순위 카피가 basis 라벨을 받는 함수형이어야 한다(정적 "전일 대비" 하드코딩 복귀 금지).
  check("today summaryWithDeltas is basis-aware fn", /summaryWithDeltas:\s*\(basis/.test(todayCopy));
  check("today rankRisers is basis-aware fn", /rankRisers:\s*\(basis/.test(todayCopy));
  check("today copy has no hardcoded '전일 대비' string", !/전일 대비/.test(todayCopy));
  check("today copy has no removed changeCaption key", !/changeCaption/.test(todayCopy));

  const todayContent = readFileSync(join(repo, "src/components/today/TodayContent.tsx"), "utf8");
  check("TodayContent consumes comparisonBasis prop", /props\.comparisonBasis/.test(todayContent));
  check("TodayContent derives basisLabel", /comparisonBasisLabel\(/.test(todayContent));
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log(
  "PASS: date-aware comparison basis (consecutive, skipped, unknown, mixed-date, empty-history, labels, source contract)",
);
