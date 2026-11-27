// 종목 상세의 "점수 다음 행동" 계약 가드.
// 점수 계산은 바꾸지 않고, 가장 먼저 확인할 근거 한 가지와 해당 탭을 결정론적으로 안내한다.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyConclusion } from "../src/lib/conclusion";
import { valuationBasisOf } from "../src/lib/financialEvidence";
import { readingsOf } from "../src/lib/metricReadings";
import { buildTodayCandidateEvidence, snapshotIsoDate, verifiedPreviousSession } from "../src/lib/todayCandidateEvidence";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const read = (rel: string): string => readFileSync(join(repo, rel), "utf8");

let failed = 0;
function check(name: string, cond: boolean): void {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}

const flow = classifyConclusion({ momentum: 66, flow: 32, value: 60, vol: 98 });
check("weak activity gives a concrete volume check", flow.riskNote.includes("5일 평균 거래량") && flow.riskNote.includes("20일 평균"));
check("weak activity links to the summary/chart tab", flow.nextHref === "#summary");

const value = classifyConclusion({ momentum: 66, flow: 60, value: 32, vol: 98 });
check("weak value names PER and PBR", value.riskNote.includes("PER·PBR"));
check("weak value links to financials", value.nextHref === "#financials");

const momentum = classifyConclusion({ momentum: 32, flow: 60, value: 60, vol: 98 });
check("weak trend names 1- and 3-month flow", momentum.riskNote.includes("1개월·3개월"));
check("weak trend links to the summary/chart tab", momentum.nextHref === "#summary");

const risk = classifyConclusion({ momentum: 66, flow: 60, value: 60, vol: 32 });
check("weak risk-adjusted names actual swings and drawdown", risk.riskNote.includes("주가 출렁임") && risk.riskNote.includes("최대낙폭"));
check("weak risk-adjusted links to the summary/chart tab", risk.nextHref === "#summary");

const neutral = classifyConclusion({ momentum: 60, flow: 60, value: 60, vol: 60 });
check("neutral result asks for a recent disclosure check", neutral.riskNote.includes("최근 공시"));
check("neutral result links to disclosures", neutral.nextHref === "#disclosures");

check("a confirmed replacement is not measured valuation", valuationBasisOf({ per: null, pbr: null, valueNA: true }) === "three-factors");
check("unknown weighting is not inferred from a missing multiple", valuationBasisOf({ per: 15, pbr: null }) === "unavailable");
check("invalid multiples do not establish a valuation", valuationBasisOf({ per: Infinity, pbr: 1 }) === "unavailable");
check("positive multiples keep measured valuation", valuationBasisOf({ per: 15, pbr: 1 }) === "measured");
const noValuation = { momentum: 60, flow: 60, value: 10, vol: 60, valuationUnavailable: true };
check("missing valuation does not send users to financials based on a synthetic low score",
  classifyConclusion(noValuation).nextHref === "#disclosures");
check("the beginner interpretation does not report a synthetic valuation",
  !readingsOf({ ...noValuation, per: 0, pbr: 0, roe: 0 }).some(({ label }) => label === "밸류"));
const comparison = read("src/components/CompareClient.tsx");
check("comparison guards the valuation bar and explains the three-factor composite",
  comparison.includes('key === "value" && s.valuationBasis !== "measured"') &&
  comparison.includes('s.valuationBasis === "three-factors"') && comparison.includes("basis.threeFactors"));
check("comparison uses separate close and financial bases",
  comparison.includes("s.priceDate ?? basis.unverifiedCloseDate") &&
  comparison.includes("basis.financialPeriod") && comparison.includes("basis.financialSources"));

const summaryCard = read("src/components/stock/ConclusionSummaryCard.tsx");
check("top conclusion renders the direct next-action copy", summaryCard.includes("riskNote"));
check("top conclusion links directly to the selected evidence tab", summaryCard.includes("href={nextHref}"));

const about = read("src/app/about/page.tsx");
check(
  "about page uses the common data date",
  about.includes("formatBizDateLong(dataMetadata.asOfBusinessDate)") &&
    about.includes("데이터 기준 {dataAsOf} 장마감"),
);
check(
  "about page states the no-forecast positioning",
  about.includes("상승 확률을 계산하거나 특정 미래 가격을 제시하지 않습니다") &&
    about.includes("왜 눈에 띄는지와 다음에 무엇을 확인할지"),
);

const homeCopy = read("src/lib/i18n.ts");
check(
  "home starts from data rather than a forecast claim",
  homeCopy.includes("전망 대신 숫자로") &&
    homeCopy.includes("오늘 먼저 볼 종목을 줄여줍니다") &&
    homeCopy.includes("미래 수익률이나 상승 확률을 예측하지 않습니다"),
);

const homePage = read("src/app/page.tsx");
check("home metadata preserves the same positioning", homePage.includes("수익률 전망·상승 확률 대신"));

const beta = read("src/components/BetaProgramClient.tsx");
check("beta feedback already confirms how the response helps", beta.includes("이 의견은 다음 개선 순서를 정하는 데 바로 반영할게요."));

const points = [
  { d: "2026-11-26", c: 100, v: 49 },
  { d: "2026-11-27", c: 110, v: 53 },
];
const asOf = snapshotIsoDate("20261127");
const previousDate = verifiedPreviousSession(asOf, [points, points]);
check("Today uses both market reference histories and rejects unproven dates",
  previousDate === "2026-11-26" && snapshotIsoDate("20260231") === null &&
    verifiedPreviousSession(asOf, [points, undefined]) === null &&
    verifiedPreviousSession(asOf, [points, [{ ...points[0], d: "2026-11-25" }, points[1]]]) === null);
const monday = [{ ...points[0], d: "2026-11-27" }, { ...points[1], d: "2026-11-30" }];
check("Today previous trading session crosses the weekend without substituting weekdays",
  verifiedPreviousSession("2026-11-30", [monday, monday]) === "2026-11-27");

const stored = { ticker: "005930", business_date: "2026-11-26", composite: "60.5", momentum: 62, flow: 35, value: 80, vol: 65 };
const input = {
  ticker: stored.ticker, asOf, previousDate, currentClose: 110, points, measuredValuation: true,
  current: { composite: 68.1, momentum: 61, flow: 64, value: 80, vol: 67 },
  previousScores: [stored], volumeStats: { recent5dAvg: 120, recent20dAvg: 100, ratio: 1.2 },
  filingSource: "unavailable", filings: [],
} satisfies Parameters<typeof buildTodayCandidateEvidence>[0];
const compared = buildTodayCandidateEvidence(input);
check("Today compares exact session scores and shows actual largest component move",
  compared.change.kind === "compared" && compared.change.before === 60.5 && compared.change.after === 68.1 &&
    compared.change.delta === 7.6 && compared.change.metrics.flow === 29 && compared.change.leadingMetric === "flow" &&
    compared.change.metrics.momentum === -1 && compared.change.metrics.value === 0 &&
    compared.next.kind === "flow" && compared.next.href === "/stock/005930#summary");
check("Today does not use older scores, another ticker, null or ambiguous duplicate scores",
  [
    [{ ...stored, business_date: "2026-11-25" }],
    [{ ...stored, ticker: "000660" }],
    [{ ...stored, composite: null }],
    [stored, stored],
    [],
  ].every((previousScores) => {
    const { change } = buildTodayCandidateEvidence({ ...input, previousScores });
    return change.kind === "missing" && change.reason === "score" && !("delta" in change);
  }));
const flat = buildTodayCandidateEvidence({ ...input, current: { ...input.current, composite: 60.5 } });
check("Today keeps valid unchanged separate from absent history", flat.change.kind === "compared" && flat.change.delta === 0);
const noHistoryPriceMove = buildTodayCandidateEvidence({ ...input, previousScores: [] });
check("A verified large close move guides the check even without stored scores",
  noHistoryPriceMove.change.kind === "missing" && noHistoryPriceMove.next.kind === "momentum");
const staleCandidate = buildTodayCandidateEvidence({ ...input, points: [points[0]] });
check("Today does not attach current volume or deltas to a stale candidate",
  staleCandidate.change.kind === "missing" && staleCandidate.change.reason === "prices" &&
    staleCandidate.volume === null && staleCandidate.next.href === "/stock/005930#basis");
const syntheticPrior = buildTodayCandidateEvidence({ ...input, previousScores: [{ ...stored, value: 54 }] });
const missingCurrent = buildTodayCandidateEvidence({ ...input, measuredValuation: false });
check("Today does not attribute a move to unverified valuation",
  [syntheticPrior, missingCurrent].every(({ change }) => change.kind === "compared" && change.metrics.value === undefined));
const filings = [{ disclosure: { stock_code: input.ticker, rcept_dt: "20261127", rcept_no: "20261127000333", report_nm: "fixture filing" } }];
const live = buildTodayCandidateEvidence({ ...input, filingSource: "live", filings });
const example = buildTodayCandidateEvidence({ ...input, filingSource: "sample", filings });
const malformed = buildTodayCandidateEvidence({ ...input, filingSource: "live", filings: [{ disclosure: { ...filings[0].disclosure, rcept_no: "20261126000333" } }] });
const spike = buildTodayCandidateEvidence({ ...input, filingSource: "live", filings, volumeStats: { recent5dAvg: 150, recent20dAvg: 100, ratio: 1.5 } });
check("Today next check uses only a same-date live filing and prioritizes actual volume spikes",
  live.next.kind === "filing" && live.next.href === "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20261127000333" &&
    example.next.kind !== "filing" && malformed.next.kind !== "filing" && spike.next.kind === "volume-spike");
check("Today requests scores only for the exact previous date",
  read("src/lib/scoreHistory.ts").includes('.eq("business_date", date)') &&
    read("src/app/today/page.tsx").includes("getCandidateScoresOn(top3.map((s) => s.ticker), previousDate)"));

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log(
  "PASS: stock-detail next-action guidance, exact-date briefing evidence and missing-data cases, common About date, and beta confirmation",
);
