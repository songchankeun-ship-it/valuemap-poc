import { dataMetadata, realStockPool, formatBizDateShort, isDataStale } from "@/lib/realStocks";
import { isSuspect } from "@/lib/dataQuality";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { getRecentSignals } from "@/lib/recentSignals";
import { fmtWon } from "@/lib/format";
import { compositeOf } from "@/lib/score";
import { sectorOf } from "@/lib/sector";
import { volumeSpikeCount } from "@/lib/homeSnapshot";
import { HomeHero } from "@/components/home/HomeHero";
import { MarketSnapshotCards } from "@/components/home/MarketSnapshotCards";
import { TopCandidateSection } from "@/components/home/TopCandidateSection";
import type { StockCandidate } from "@/components/home/StockCandidateCard";
import { MyStocksSection, type PoolEntry } from "@/components/home/MyStocksSection";
import { DisclosureSignalSection } from "@/components/home/DisclosureSignalSection";
import type { DisclosureSignalVM } from "@/components/home/DisclosureSignalCard";
import { FeatureCards } from "@/components/home/FeatureCards";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { RiskNotice } from "@/components/home/RiskNotice";
import { HomeDataSourceFooter } from "@/components/home/HomeDataSourceFooter";
import type { StrongMetric, RiskKind, MetricKey } from "@/lib/copy/home";

interface RecentSignal {
  signalType: string;
  signalLabel: string;
  strength: number;
  disclosure: {
    corp_name: string;
    stock_code: string;
    report_nm: string;
    rcept_no: string;
    rcept_dt: string;
  };
}

// 캐시 갱신: 1시간 (정적 빌드 캐시가 너무 오래 안 갱신되는 문제 방지)
export const revalidate = 3600;

function pickTopSignals(n: number, all: RecentSignal[], universe?: Set<string>): RecentSignal[] {
  // 종목별 최강 신호 1개씩만. universe가 주어지면 분석 대상 종목 공시만(설계서 §15 — 홈은 분석 대상 중심).
  const byStock = new Map<string, RecentSignal>();
  for (const s of all) {
    const code = s.disclosure?.stock_code;
    if (!code) continue;
    if (universe && !universe.has(code)) continue;
    const cur = byStock.get(code);
    if (!cur || s.strength > cur.strength) byStock.set(code, s);
  }
  return Array.from(byStock.values())
    .sort((a, b) => b.strength - a.strength)
    .slice(0, n);
}

function pickTopStocks(n: number) {
  return [...realStockPool]
    .filter((s) => compositeOf(s) > 0 && !isSuspect(s))
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
  description: "코스피·코스닥 138개 종목의 추세·거래활성도·밸류·위험조정을 한 화면에서 비교하세요. PER·PBR·ROE·배당수익률·DART 공시 신호까지 — 종목 탐색 시간을 줄이는 데이터 도구.",
  keywords: ["한국주식", "테마주", "종목분석", "코스피", "코스닥", "PER", "PBR", "ROE", "배당주", "공시", "DART", "퀀트", "밸류에이션", "모멘텀"],
  authors: [{ name: "필로소디" }],
  openGraph: {
    title: "오른스코어 — 한국 주식 탐색 도구",
    description: "138개 종목의 추세·거래활성도·밸류·위험조정·공시 신호를 한 화면에서. 종목 탐색 시간을 데이터로 줄여드립니다.",
    url: "https://ornscore.com",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "오른스코어 — 한국 주식 탐색 도구",
    description: "138개 종목의 4대 지표 · 공시 신호를 한 화면에서. 종목 탐색을 데이터로 좁혀보세요.",
  },
  alternates: {
    canonical: "https://ornscore.com",
  },
};

export default async function HomePage() {
  const recentSig = await getRecentSignals(7);
  const universeTickers = new Set(realStockPool.map((x) => x.ticker));
  const topCandidates = pickTopStocks(3);
  const topSignals = pickTopSignals(3, (recentSig.signals as unknown as RecentSignal[]) ?? [], universeTickers);
  const dataAsOf = formatBizDateShort(dataMetadata.asOfBusinessDate);
  const dataStale = isDataStale(dataMetadata.asOfBusinessDate);

  // ── 내 종목(관심·최근 본) 이어보기용 경량 룩업 — 이미 계산된 풀에서 파생(신규 점수 계산 없음) ──
  const poolLookup: Record<string, PoolEntry> = {};
  for (const s of realStockPool) {
    poolLookup[s.ticker] = {
      name: s.name,
      sector: sectorOf(s.themes),
      score: displayCompositeScore(s),
      changePct: s.changePct,
    };
  }

  // ── 오늘의 데이터 요약 통계 (후보 리스트와 동일한 !isSuspect 필터로 내부 일관) ──
  const strongCount = realStockPool.filter((s) => displayCompositeScore(s) >= 80 && !isSuspect(s)).length;
  const spikeCount = volumeSpikeCount(realStockPool);
  const signalCount = recentSig.signalCount ?? (recentSig.signals?.length ?? 0);

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
      sector: sectorOf(s.themes),
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

  // ── 공시 신호 카드 뷰모델 (note는 호재/악재 표현이 섞일 수 있어 중립 확인 포인트로 대체) ──
  const signalVMs: DisclosureSignalVM[] = topSignals.map((s) => {
    const code = s.disclosure.stock_code;
    const date = s.disclosure.rcept_dt;
    const fmtDate = date.length === 8 ? date.slice(4, 6) + "." + date.slice(6, 8) : date;
    return {
      rceptNo: s.disclosure.rcept_no,
      signalType: s.signalType,
      signalLabel: s.signalLabel,
      corpName: s.disclosure.corp_name,
      reportNm: s.disclosure.report_nm,
      dateLabel: fmtDate + " · DART",
      inUniv: universeTickers.has(code),
      code,
      dartUrl: "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=" + s.disclosure.rcept_no,
    };
  });

  return (
    <div className="space-y-5 md:space-y-7">
      <HomeHero
        dataAsOf={dataAsOf}
        dataStale={dataStale}
        totalCount={dataMetadata.count}
        strongCount={strongCount}
        volumeSpikeCount={spikeCount}
        signalCount={signalCount}
        previewCandidates={candidates.slice(0, 3)}
      />

      <MarketSnapshotCards
        totalCount={dataMetadata.count}
        strongCount={strongCount}
        volumeSpikeCount={spikeCount}
        signalCount={signalCount}
      />

      <TopCandidateSection candidates={candidates} />

      <DisclosureSignalSection signals={signalVMs} universeCount={dataMetadata.count} />

      <WelcomeOnboarding />

      <MyStocksSection lookup={poolLookup} />

      <FeatureCards strongCount={strongCount} signalCount={signalCount} />

      <HowItWorksSection />

      <RiskNotice />

      <HomeDataSourceFooter count={dataMetadata.count} dataAsOf={dataAsOf} />
    </div>
  );
}
