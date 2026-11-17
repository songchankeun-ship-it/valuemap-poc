import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");

const COMPARISON_PAIRS = [
  ["005930", "000660"],
  ["032830", "085620"],
  ["000990", "042700"],
  ["247540", "066970"],
  ["055550", "105560"],
  ["105560", "086790"],
  ["006400", "373220"],
];

function channelUrl(path, campaign = "threads") {
  const url = new URL(path, "https://ornscore.com");
  url.searchParams.set("ref", campaign);
  return url.toString();
}

function num(value, digits = 1) {
  return Number(value).toFixed(digits);
}

function conjunctionParticle(word) {
  const last = String(word).trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? "과" : "와";
}

function validStocks(payload) {
  if (!payload || !Array.isArray(payload.stocks) || payload.stocks.length === 0) {
    throw new Error("stocks.json must contain a non-empty stocks array");
  }
  return payload.stocks;
}

function rotatedPair(stocks, asOfBusinessDate) {
  const byTicker = new Map(stocks.map((stock) => [stock.ticker, stock]));
  const seed = Number(String(asOfBusinessDate).replace(/\D/g, "")) || 0;
  for (let offset = 0; offset < COMPARISON_PAIRS.length; offset += 1) {
    const pair = COMPARISON_PAIRS[(seed + offset) % COMPARISON_PAIRS.length];
    const a = byTicker.get(pair[0]);
    const b = byTicker.get(pair[1]);
    if (a && b) return { a, b, slug: `${pair[0]}-vs-${pair[1]}` };
  }
  throw new Error("No curated comparison pair is present in the current stock universe");
}

function strongestContrast(a, b) {
  const metrics = [
    { key: "momentum", label: "추세" },
    { key: "flow", label: "거래활성도" },
    { key: "value", label: "밸류" },
    { key: "volScore", label: "위험조정" },
  ];
  return metrics
    .map((metric) => ({
      ...metric,
      a: Number(a[metric.key]),
      b: Number(b[metric.key]),
      gap: Math.abs(Number(a[metric.key]) - Number(b[metric.key])),
    }))
    .filter((metric) => Number.isFinite(metric.a) && Number.isFinite(metric.b))
    .sort((left, right) => right.gap - left.gap || left.key.localeCompare(right.key))[0];
}

export function buildGrowthContent(payload) {
  const stocks = validStocks(payload);
  const asOf = String(payload.asOfBusinessDate ?? "");
  const pair = rotatedPair(stocks, asOf);
  const contrast = strongestContrast(pair.a, pair.b);

  const lowPer = stocks
    .filter((stock) => Number(stock.per) > 0 && Number.isFinite(Number(stock.roe)) && stock.valueNA !== true)
    .sort((a, b) => Number(a.per) - Number(b.per) || String(a.ticker).localeCompare(String(b.ticker)))
    .slice(0, 3);

  const active = stocks
    .filter((stock) => Number(stock.flowStats?.ratio) > 0)
    .sort((a, b) => Number(b.flowStats.ratio) - Number(a.flowStats.ratio) || String(a.ticker).localeCompare(String(b.ticker)))
    .slice(0, 3);

  if (lowPer.length < 3 || active.length < 3 || !contrast) {
    throw new Error("Current stock payload cannot support all three growth content formats");
  }

  const higher = contrast.a >= contrast.b ? pair.a : pair.b;
  const lower = higher === pair.a ? pair.b : pair.a;
  const higherValue = higher === pair.a ? contrast.a : contrast.b;
  const lowerValue = lower === pair.a ? contrast.a : contrast.b;

  return {
    asOfBusinessDate: asOf,
    metricsVersion: String(payload.metricsVersion ?? "unknown"),
    universeCount: stocks.length,
    formats: [
      {
        id: "neutral-comparison",
        title: `${pair.a.name} vs ${pair.b.name}: 점수보다 차이를 먼저 보기`,
        hook: `${pair.a.name}${conjunctionParticle(pair.a.name)} ${pair.b.name}, 같은 잣대로 보면 어디가 가장 다를까요?`,
        body: [
          `가장 큰 차이는 ${contrast.label}입니다. ${higher.name} ${num(higherValue)}점, ${lower.name} ${num(lowerValue)}점입니다.`,
          "높고 낮음은 우열이나 매수·매도 판단이 아닙니다. 업종 차이와 최근 공시, 재무 원문을 함께 확인해야 합니다.",
          "오른스코어는 전망 대신 같은 기준의 숫자와 다음 확인 순서를 보여줍니다.",
        ],
        url: channelUrl(`/compare/${pair.slug}`),
      },
      {
        id: "screen-and-check",
        title: "PER이 낮은 후보 3개와 다음 확인 순서",
        hook: "PER이 낮다는 이유만으로 저평가라고 볼 수 있을까요?",
        body: [
          ...lowPer.map((stock) => `${stock.name}(${stock.ticker}) PER ${num(stock.per)}배 · ROE ${num(stock.roe)}%`),
          "먼저 이익의 지속성, 같은 업종 안의 차이, 최근 공시를 확인하세요. 낮은 PER은 시작점이지 결론이 아닙니다.",
        ],
        url: channelUrl("/topics/low-per-stocks"),
      },
      {
        id: "activity-change",
        title: "거래 관심이 커진 종목 3개와 확인할 이유",
        hook: "최근 5일 평균 거래량이 평소보다 커진 종목은 무엇일까요?",
        body: [
          ...active.map((stock) => `${stock.name}(${stock.ticker}) 최근/20일 거래량 ${num(stock.flowStats.ratio, 2)}배`),
          "거래량 증가는 관심 변화일 뿐 상승 전망이 아닙니다. 가격 흐름과 공시 원문에서 이유를 확인하세요.",
        ],
        url: channelUrl("/today"),
      },
    ],
  };
}

export function formatGrowthContentMarkdown(packet) {
  const lines = [
    `# ORNScore 성장 콘텐츠 초안`,
    "",
    `- 데이터 기준: ${packet.asOfBusinessDate}`,
    `- 분석 범위: ${packet.universeCount}종목`,
    `- Metrics: ${packet.metricsVersion}`,
    "- 용도: Threads 게시 전 운영자 검토용. 자동 게시하지 않음.",
  ];

  for (const [index, format] of packet.formats.entries()) {
    lines.push("", `## ${index + 1}. ${format.title}`, "", format.hook, "");
    for (const paragraph of format.body) lines.push(paragraph);
    lines.push("", format.url);
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const payload = JSON.parse(readFileSync(join(repo, "public", "data", "stocks.json"), "utf8"));
  const packet = buildGrowthContent(payload);
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    return;
  }
  process.stdout.write(formatGrowthContentMarkdown(packet));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
