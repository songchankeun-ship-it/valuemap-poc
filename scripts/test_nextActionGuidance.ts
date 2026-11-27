// 종목 상세의 "점수 다음 행동" 계약 가드.
// 점수 계산은 바꾸지 않고, 가장 먼저 확인할 근거 한 가지와 해당 탭을 결정론적으로 안내한다.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyConclusion } from "../src/lib/conclusion";
import { valuationBasisOf } from "../src/lib/financialEvidence";
import { readingsOf } from "../src/lib/metricReadings";

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

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log(
  "PASS: stock-detail next-action guidance (one concrete check + correct evidence tab), common About date, and useful beta confirmation",
);
