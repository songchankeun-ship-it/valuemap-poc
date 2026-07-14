import { allThemes, dataMetadata, realStockPool, formatBizDateShort, isDataStale } from "@/lib/realStocks";
import { isSuspect } from "@/lib/dataQuality";
import { getPriceLagSummary } from "@/lib/priceLag";
import { fmtWon } from "@/lib/format";
import { compositeOf } from "@/lib/score";
import { sectorOf } from "@/lib/sector";
import { HomeHero } from "@/components/home/HomeHero";
import { TopCandidateSection } from "@/components/home/TopCandidateSection";
import type { StockCandidate } from "@/components/home/StockCandidateCard";
import { MyStocksSection, type PoolEntry } from "@/components/home/MyStocksSection";
import { HomeDataSourceFooter } from "@/components/home/HomeDataSourceFooter";
import type { StrongMetric, RiskKind, MetricKey } from "@/lib/copy/home";
import { brandKeywords, disclosureKeywords, metricKeywords, stockDiscoveryKeywords, uniqueKeywords } from "@/lib/seoKeywords";

// 캐시 갱신: 1시간 (정적 빌드 캐시가 너무 오래 안 갱신되는 문제 방지)
export const revalidate = 3600;

// 첫 방문 UX 대정리 Slice C(설계서 §6.2): 홈 기본 본문을 네 구간(시작 영역 · 실제 후보
// 미리보기 최대 3개 · 확인 순서 · 조건부 개인 루틴)으로 제한한다. 시장 스냅샷 카드/공시 목록/
// 온보딩/기능 소개/사용법/큰 위험 고지는 홈 기본 흐름에서 제거하거나 /today·상세로 이동시켰다.
// 공시 신호(getRecentSignals)와 시장 요약 통계(volumeSpikeCount)는 홈에서 더는 렌더하지
// 않으므로 여기서 계산하지 않는다(데이터/점수 산식 무변경, /today가 변화 중심으로 담당).

// 오늘 후보·Top 목록 정책(재검수 P0 #2):
//  - 검증 보류(isSuspect) 종목 제외(기존)
//  - 가격 기준일이 전역 기준일보다 과거인(최신 배치 미반영) 종목 제외(exclude)
// 이유: 금융 서비스에서 "틀린 종목 하나"가 전체 점수 신뢰를 무너뜨린다. 지연 종목은 최신 종가가
// 반영되지 않아 순위·점수 해석이 왜곡될 수 있으므로, 대표 후보 카드에서는 보수적으로 제외한다.
// (전체 목록 /stocks 에서는 제외하지 않고 '데이터 지연' 배지로 표시해 탐색 가능성은 유지한다.)
function pickTopStocks(n: number, exclude: Set<string>) {
  return [...realStockPool]
    .filter((s) => compositeOf(s) > 0 && !isSuspect(s) && !exclude.has(s.ticker))
    .sort((a, b) => compositeOf(b) - compositeOf(a))
    .slice(0, n);
}

// 홈의 "80+" 카운트는 카드에 보이는 정수 점수와 같은 기준을 쓴다.
function displayCompositeScore(s: Parameters<typeof compositeOf>[0]): number {
  return Math.round(compositeOf(s));
}

// 4지표 중 강한 2개를 "라벨 점수" 칩으로 — key+값만 넘기고 라벨은 클라이언트에서 현지화.
function strongMetrics(s: { momentum: number; flow: number; value: number; vol: number }): StrongMetric[] {
  const items: StrongMetric[] = [
    { key: "momentum", value: Math.round(s.momentum) },
    { key: "flow", value: Math.round(s.flow) },
    { key: "value", value: Math.round(s.value) },
    { key: "vol", value: Math.round(s.vol) },
  ];
  return items.sort((a, b) => b.value - a.value).slice(0, 2);
}

// 후보 카드 "왜 후보인지" 근거용 — 강한 지표의 전체 풀 상대순위(종목 상세의 rankOf/topPctOf와 동일 산식).
// 이미 계산된 4지표 점수에서만 파생하며 점수 계산식은 건드리지 않는다.
const poolN = realStockPool.length;
function metricValue(p: { momentum: number; flow: number; value: number; vol: number }, key: MetricKey): number {
  return key === "momentum" ? p.momentum : key === "flow" ? p.flow : key === "value" ? p.value : p.vol;
}
function metricRank(val: number, key: MetricKey): number {
  return realStockPool.filter((p) => metricValue(p, key) > val).length + 1;
}
function metricTopPct(val: number, key: MetricKey): number {
  const better = realStockPool.filter((p) => metricValue(p, key) > val).length;
  return Math.max(1, Math.round(((better + 1) / poolN) * 100));
}

// 탐색 언어 기반 주의 문구 종류 — 문장은 클라이언트에서 현지화(원시 점수로 분기만).
function riskKindOf(s: { value: number; vol: number }, r3m: number | null): RiskKind {
  if (r3m !== null && r3m >= 80) {
    // 급등 정도·변동성에 따라 문구를 나눠 같은 주의 문장이 반복되지 않게 한다(모두 확인·검토 톤).
    if (r3m >= 150) return "surgeXl";
    if (r3m >= 120) return "surgeL";
    if (s.vol < 45) return "surgeVol";
    return "surge";
  }
  if (s.vol < 45) return "volHigh";
  if (s.value < 40) return "valueLow";
  return "default";
}

export const metadata = {
  title: "오른스코어 — 한국 주식 탐색 도구 | 138개 종목 데이터 분석",
  description: "한국 주식 스크리닝과 종목 검색을 한 화면에서. 코스피·코스닥 138개 종목의 추세·거래활성도·밸류·위험조정, PER·PBR·ROE·배당수익률, DART 공시 신호를 함께 확인하세요.",
  keywords: uniqueKeywords(brandKeywords, stockDiscoveryKeywords, metricKeywords, disclosureKeywords),
  authors: [{ name: "오른스코어 운영팀" }],
  openGraph: {
    title: "오른스코어 — 한국 주식 탐색 도구",
    description: "한국 주식 스크리닝 · 종목 검색 · PER/PBR/ROE · DART 공시 신호를 한 화면에서. 종목 탐색 시간을 데이터로 줄여드립니다.",
    url: "https://ornscore.com",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/social/ornscore-og-1200x630.jpg",
        width: 1200,
        height: 630,
        alt: "오른스코어 — 한국 주식 후보를 데이터로 좁히기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "오른스코어 — 한국 주식 탐색 도구",
    description: "한국 주식 스크리닝과 종목 검색, 4대 지표와 공시 신호를 한 화면에서.",
    images: ["/social/ornscore-og-1200x630.jpg"],
  },
  alternates: {
    canonical: "https://ornscore.com",
  },
};

export default async function HomePage() {
  // 가격 기준일 지연(최신 배치 미반영) 종목은 오늘 후보·Top 카드에서 제외(정책은 pickTopStocks 주석 참조).
  const laggedTickers = new Set(getPriceLagSummary().laggedTickers);
  const topCandidates = pickTopStocks(3, laggedTickers);
  const dataAsOf = formatBizDateShort(dataMetadata.asOfBusinessDate);
  const dataStale = isDataStale(dataMetadata.asOfBusinessDate);
  const searchStocks = realStockPool.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    themes: s.themes,
    compositeScore: displayCompositeScore(s),
  }));

  // ── 내 종목(관심·최근 본) 이어보기용 경량 룩업 — 이미 계산된 풀에서 파생(신규 점수 계산 없음) ──
  const poolLookup: Record<string, PoolEntry> = {};
  for (const s of realStockPool) {
    poolLookup[s.ticker] = {
      name: s.name,
      sector: sectorOf(s.themes, s.ticker),
      score: displayCompositeScore(s),
      changePct: s.changePct,
    };
  }

  // ── 오늘 후보 관계 문구용 통계 (후보 리스트와 동일한 !isSuspect 필터로 내부 일관) ──
  const strongCount = realStockPool.filter((s) => displayCompositeScore(s) >= 80 && !isSuspect(s)).length;

  // ── 후보 카드 뷰모델 ──
  const candidates: StockCandidate[] = topCandidates.map((s, i) => {
    const r3m = typeof s.returns?.r3m === "number" ? s.returns.r3m : null;
    const metrics = strongMetrics(s);
    // 가장 강한 지표의 전체 풀 상대순위 → 카드별로 다른 "근거" 한 줄(값 결측 시 null → noReason 폴백).
    const lead0 = metrics[0];
    const leadRaw = lead0 ? metricValue(s, lead0.key) : null;
    const lead =
      lead0 && leadRaw != null && Number.isFinite(leadRaw)
        ? { key: lead0.key, rank: metricRank(leadRaw, lead0.key), topPct: metricTopPct(leadRaw, lead0.key) }
        : null;
    return {
      rank: i + 1,
      name: s.name,
      ticker: s.ticker,
      sector: sectorOf(s.themes, s.ticker),
      priceLabel: fmtWon(s.currentPrice),
      changePct: s.changePct,
      r3m,
      score: displayCompositeScore(s),
      metrics,
      lead,
      m: {
        momentum: Math.round(s.momentum),
        flow: Math.round(s.flow),
        value: Math.round(s.value),
        vol: Math.round(s.vol),
      },
      riskKind: riskKindOf(s, r3m),
      highReturn: r3m !== null && r3m >= 80,
    };
  });
  const todayCompareHref =
    topCandidates.length >= 2
      ? `/compare?stocks=${topCandidates.slice(0, 3).map((s) => s.ticker).join(",")}`
      : undefined;

  // 홈 기본 본문 4구간(설계서 §6.2): 1) 시작 영역(HomeHero) · 2) 실제 후보 미리보기 최대 3개 +
  // 3) 확인 순서(TopCandidateSection이 카드 아래 컴팩트 가이드로 함께 렌더) · 4) 조건부 개인 루틴
  // (MyStocksSection은 로컬 관심/최근 데이터가 있을 때만 스스로 렌더). 하단은 짧은 비자문 + 데이터 출처.
  return (
    <div className="space-y-5 md:space-y-7">
      <HomeHero
        dataAsOf={dataAsOf}
        dataAsOfRaw={dataMetadata.asOfBusinessDate ?? ""}
        dataStale={dataStale}
        searchStocks={searchStocks}
        searchThemes={allThemes()}
      />

      <TopCandidateSection candidates={candidates} compareHref={todayCompareHref} strongCount={strongCount} />

      <MyStocksSection lookup={poolLookup} />

      <HomeDataSourceFooter count={dataMetadata.count} dataAsOf={dataAsOf} />
    </div>
  );
}
