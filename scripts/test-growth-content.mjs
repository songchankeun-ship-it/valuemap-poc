import { buildGrowthContent, formatGrowthContentMarkdown } from "./generate-growth-content.mjs";

let failed = 0;
function check(name, condition) {
  if (condition) return;
  failed += 1;
  console.error(`FAIL: ${name}`);
}

function stock(ticker, name, per, roe, ratio, scores = {}) {
  return {
    ticker,
    name,
    per,
    roe,
    valueNA: false,
    momentum: scores.momentum ?? 50,
    flow: scores.flow ?? 50,
    value: scores.value ?? 50,
    volScore: scores.volScore ?? 50,
    flowStats: { ratio },
  };
}

const fixture = {
  asOfBusinessDate: "20261116",
  metricsVersion: "2.4",
  stocks: [
    stock("005930", "삼성생명", 12, 8, 1.1, { momentum: 20, flow: 40, value: 60, volScore: 80 }),
    stock("000660", "미래에셋생명", 10, 12, 1.2, { momentum: 80, flow: 50, value: 40, volScore: 50 }),
    stock("111111", "가나다", 3, 5, 2.5),
    stock("222222", "라마바", 4, 6, 3.5),
    stock("333333", "사아자", 5, 7, 4.5),
  ],
};

const first = buildGrowthContent(fixture);
const second = buildGrowthContent(fixture);
const markdown = formatGrowthContentMarkdown(first);

check("generator is deterministic", JSON.stringify(first) === JSON.stringify(second));
check("exactly three repeatable formats are generated", first.formats.length === 3);
check("format ids are stable", first.formats.map((item) => item.id).join(",") === "neutral-comparison,screen-and-check,activity-change");
check("every draft has a Threads-attributed URL", first.formats.every((item) => item.url.includes("ref=threads")));
check("comparison copy stays neutral", first.formats[0].body.some((line) => line.includes("우열이나 매수·매도 판단이 아닙니다")));
check("comparison hook uses the correct Korean conjunction particle", first.formats[0].hook.startsWith("삼성생명과 미래에셋생명"));
check("low-PER copy states the next checks", first.formats[1].body.some((line) => line.includes("이익의 지속성") && line.includes("최근 공시")));
check("activity copy rejects a forecast interpretation", first.formats[2].body.some((line) => line.includes("상승 전망이 아닙니다")));
check("markdown labels the output as manual-review only", markdown.includes("자동 게시하지 않음"));

if (failed > 0) {
  console.error(`growth-content test FAILED (${failed})`);
  process.exit(1);
}

console.log("PASS growth-content: deterministic 3-format packet, attributed links, and neutral next-check copy");
