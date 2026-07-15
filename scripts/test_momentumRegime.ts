// 모멘텀 국면 경계 + 위험조정/업종밸류 공개 카피 계약 가드 (Slice G)
// 실행: npx tsx scripts/test_momentumRegime.ts — 성공 시 PASS 1줄, 실패 시 FAIL 출력 후 비정상 종료.
//
// 사실(계약 정본): 추세(모멘텀) 국면은 이미 계산된 1·3·6개월 수익률의 부호로만 결정적으로 분류한다
// (momentumRegime.ts, 점수 계산과 무관). 재검수 Slice G는 (1) 장기 강세·단기 약세처럼 장·단기가
// 어긋나는 국면이 한 문장으로 뭉개지지 않고 그대로 보여야 하고, (2) 위험조정 점수가 '안전(저위험)
// 점수'로 읽히지 않도록 '과거 수익-변동성 효율'로 개명하며 절대 변동성·최대낙폭을 인접 노출하고,
// (3) 이미 계산된 같은 업종 밸류 컨텍스트가 쉽게 닿는 위치에 있어야 한다고 요구한다.
// 이 테스트는 (A) 순수 경계 분류와 (B) 그 공개 카피 계약을 함께 고정한다. 점수식·산식 무변경.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  classifyMomentumRegime,
  MOMENTUM_FLAT_EPS,
  type MomentumRegimeKey,
} from "../src/lib/momentumRegime";
import { scoreBasisCopy } from "../src/lib/copy/stockDetail";

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

const EPS = MOMENTUM_FLAT_EPS; // 2
const BIG = 10;

// ── A. 순수 경계 분류 ──────────────────────────────────────────────
// A1. 대표 4국면 + sideways
check("A1 both up → strengthening", classifyMomentumRegime({ r1m: BIG, r3m: BIG, r6m: BIG }).key === "strengthening");
check("A1 both down → weakening", classifyMomentumRegime({ r1m: -BIG, r3m: -BIG, r6m: -BIG }).key === "weakening");
check("A1 long up short down → longUpShortDown", classifyMomentumRegime({ r1m: -BIG, r3m: BIG, r6m: BIG }).key === "longUpShortDown");
check("A1 long down short up → longDownShortUp", classifyMomentumRegime({ r1m: BIG, r3m: -BIG, r6m: -BIG }).key === "longDownShortUp");
check("A1 both flat → sideways", classifyMomentumRegime({ r1m: 0, r3m: 0, r6m: 0 }).key === "sideways");

// A2. divergent 플래그 — 장·단기 어긋남에서만 true
check("A2 longUpShortDown divergent", classifyMomentumRegime({ r1m: -BIG, r6m: BIG }).divergent === true);
check("A2 longDownShortUp divergent", classifyMomentumRegime({ r1m: BIG, r6m: -BIG }).divergent === true);
check("A2 strengthening not divergent", classifyMomentumRegime({ r1m: BIG, r6m: BIG }).divergent === false);
check("A2 weakening not divergent", classifyMomentumRegime({ r1m: -BIG, r6m: -BIG }).divergent === false);
check("A2 sideways not divergent", classifyMomentumRegime({ r1m: 0, r6m: 0 }).divergent === false);

// A3. flat epsilon 경계 — |r| == EPS 는 방향 있음, |r| < EPS 는 flat
check("A3 r1m == +EPS is up (both up → strengthening)", classifyMomentumRegime({ r1m: EPS, r6m: BIG }).shortDir === "up");
check("A3 r1m just below +EPS is flat", classifyMomentumRegime({ r1m: EPS - 0.01, r6m: BIG }).shortDir === "flat");
check("A3 r1m == -EPS is down → longUpShortDown", classifyMomentumRegime({ r1m: -EPS, r6m: BIG }).key === "longUpShortDown");
check("A3 r1m just above -EPS is flat (not divergent)", classifyMomentumRegime({ r1m: -EPS + 0.01, r6m: BIG }).key === "strengthening");
check("A3 r6m == +EPS long up", classifyMomentumRegime({ r1m: BIG, r6m: EPS }).longDir === "up");

// A4. flat 이 섞인 조합(단기/장기 한쪽만 flat) — 9칸 전부 결정적
check("A4 long up short flat → strengthening", classifyMomentumRegime({ r1m: 0, r6m: BIG }).key === "strengthening");
check("A4 long flat short up → strengthening", classifyMomentumRegime({ r1m: BIG, r6m: 0 }).key === "strengthening");
check("A4 long down short flat → weakening", classifyMomentumRegime({ r1m: 0, r6m: -BIG }).key === "weakening");
check("A4 long flat short down → weakening", classifyMomentumRegime({ r1m: -BIG, r6m: 0 }).key === "weakening");

// A5. 결측 → unavailable (지어내지 않음)
check("A5 missing r6m → unavailable", classifyMomentumRegime({ r1m: BIG }).key === "unavailable");
check("A5 missing r1m → unavailable", classifyMomentumRegime({ r6m: BIG }).key === "unavailable");
check("A5 null returns → unavailable", classifyMomentumRegime(null).key === "unavailable");
check("A5 NaN r1m → unavailable", classifyMomentumRegime({ r1m: NaN, r6m: BIG }).key === "unavailable");
check("A5 unavailable not divergent", classifyMomentumRegime({ r1m: BIG }).divergent === false);

// A6. r3m 은 보조(midDir) — 결측이어도 분류는 1M/6M 로 성립, 존재 시 midDir 반영
check("A6 r3m absent still classifies", classifyMomentumRegime({ r1m: BIG, r6m: BIG }).key === "strengthening");
check("A6 r3m absent → midDir flat", classifyMomentumRegime({ r1m: BIG, r6m: BIG }).midDir === "flat");
check("A6 r3m down → midDir down", classifyMomentumRegime({ r1m: BIG, r3m: -BIG, r6m: BIG }).midDir === "down");

// A7. 결정성 — 같은 입력이면 항상 같은 결과
{
  const a = classifyMomentumRegime({ r1m: -3, r3m: 4, r6m: 12 });
  const b = classifyMomentumRegime({ r1m: -3, r3m: 4, r6m: 12 });
  check("A7 deterministic", a.key === b.key && a.divergent === b.divergent && a.shortDir === b.shortDir);
}

// ── B. 공개 카피 계약 ──────────────────────────────────────────────
const KEYS: MomentumRegimeKey[] = [
  "strengthening",
  "longUpShortDown",
  "longDownShortUp",
  "weakening",
  "sideways",
  "unavailable",
];

// B1. 국면 카피 한/영 완비 — 모든 키에 label·note 존재(빈 문자열 금지)
for (const loc of ["ko", "en"] as const) {
  const rg = scoreBasisCopy[loc].momentumRegime;
  check(`B1 ${loc} caption present`, !!rg.caption && rg.caption.length > 0);
  check(`B1 ${loc} prefix present`, !!rg.prefix && rg.prefix.length > 0);
  for (const k of KEYS) {
    const e = rg.labels[k];
    check(`B1 ${loc} ${k} label`, !!e && e.label.length > 0);
    check(`B1 ${loc} ${k} note`, !!e && e.note.length > 0);
  }
}

// B2. 장·단기 대비가 한 문장으로 뭉개지지 않고 label/note 에 그대로 보인다
{
  const koUp = scoreBasisCopy.ko.momentumRegime.labels.longUpShortDown;
  check("B2 ko longUpShortDown label shows 장기+단기", koUp.label.includes("장기") && koUp.label.includes("단기"));
  check("B2 ko longUpShortDown note shows 장기+단기", koUp.note.includes("장기") && koUp.note.includes("단기"));
  const enUp = scoreBasisCopy.en.momentumRegime.labels.longUpShortDown;
  check("B2 en longUpShortDown shows long+short", /long-term/i.test(enUp.label) && /short-term/i.test(enUp.label));
  const koDown = scoreBasisCopy.ko.momentumRegime.labels.longDownShortUp;
  check("B2 ko longDownShortUp label shows 장기+단기", koDown.label.includes("장기") && koDown.label.includes("단기"));
}

// B3. 국면이 실제로 렌더되는지(ScoreBasisBreakdown) — momentum 파트 + divergent 강조
{
  const bd = read("src/components/stock/ScoreBasisBreakdown.tsx");
  check("B3 breakdown renders momentumRegime", bd.includes("momentumRegime") && bd.includes('part.kind === "momentum"'));
  check("B3 breakdown highlights divergent", bd.includes("divergent"));
  const sb = read("src/lib/scoreBasis.ts");
  check("B3 scoreBasis attaches regime", sb.includes("classifyMomentumRegime") && sb.includes("momentumPart.regime"));
}

// B4. 위험조정 → '과거 수익-변동성 효율' 개명 + '안전 점수 아님' 고지(툴팁·가이드)
{
  const tip = read("src/components/ScoreTooltip.tsx");
  const guide = read("src/lib/copy/metricsGuide.ts");
  check("B4 tooltip renamed efficiency", tip.includes("과거 수익-변동성 효율"));
  check("B4 tooltip not-a-safety", tip.includes("안전") && tip.includes("위험 상세"));
  check("B4 guide ko efficiency", guide.includes("과거 수익-변동성 효율"));
  check("B4 guide ko not-a-safety", guide.includes("안전(저위험) 점수가 아닙니다"));
  check("B4 guide en efficiency", /past return-to-volatility efficiency/i.test(guide));
  check("B4 guide en not-a-safety", /not a safety \(low-risk\) score/i.test(guide));
  // 절대 변동성·최대낙폭 인접(위험 상세) 참조가 개명 표면에 남아있음
  check("B4 tooltip references absolute vol/mdd", tip.includes("최대낙폭"));
  check("B4 guide references absolute vol/mdd", guide.includes("최대낙폭") || /max drawdown/i.test(guide));
}

// B5. 같은 업종 밸류 컨텍스트가 쉽게 닿는 위치(근거 탭·항상 노출) + 앵커
{
  const page = read("src/app/stock/[ticker]/page.tsx");
  const intro = read("src/components/stock/StockDetailIntro.tsx");
  check("B5 sector-value anchor id", intro.includes('id="sector-value"'));
  check("B5 SectorValueCard rendered in page", page.includes("<SectorValueCard"));
  // 근거 탭(기본/첫 탭)으로 이동했음을 마커 주석으로 고정(요약 탭 접힘 details 밖)
  check("B5 sector value moved to basis tab", page.includes("근거 탭(기본/첫 탭)"));
}

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log("PASS: momentum-regime boundaries + risk-efficiency/sector-value public copy");
