import Link from "next/link";
import { dataMetadata, realStockPool, formatBizDateShort, isDataStale } from "@/lib/realStocks";
import { isSuspect } from "@/lib/dataQuality";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { getRecentSignals } from "@/lib/recentSignals";
import { fmtWon } from "@/lib/format";
import { compositeOf } from "@/lib/score";
import { volumeSpikeCount } from "@/lib/homeSnapshot";
import { HomeHero } from "@/components/home/HomeHero";
import { MarketSnapshotCards } from "@/components/home/MarketSnapshotCards";
import { TopCandidateSection } from "@/components/home/TopCandidateSection";
import type { StockCandidate } from "@/components/home/StockCandidateCard";
import { DisclosureSignalSection } from "@/components/home/DisclosureSignalSection";
import type { DisclosureSignalVM } from "@/components/home/DisclosureSignalCard";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { RiskNotice } from "@/components/home/RiskNotice";

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

function pickTopSignals(n: number, all: RecentSignal[]): RecentSignal[] {
  // 종목별 최강 신호 1개씩만
  const byStock = new Map<string, RecentSignal>();
  for (const s of all) {
    const code = s.disclosure?.stock_code;
    if (!code) continue;
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

// 4지표 중 강한 2개를 "라벨 점수" 칩으로 — 점수만 보여주지 않고 강점 근거를 함께 표시.
function strongMetrics(s: { momentum: number; flow: number; value: number; vol: number }): string[] {
  const items = [
    { label: "추세", v: s.momentum },
    { label: "거래활성도", v: s.flow },
    { label: "밸류", v: s.value },
    { label: "위험조정", v: s.vol },
  ];
  return items
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map((x) => x.label + " " + Math.round(x.v));
}

// 탐색 언어 기반 주의 문구 — '추천'이 아니라 '확인 필요'를 안내.
function riskNote(s: { value: number; vol: number }, r3m: number | null): string {
  if (r3m !== null && r3m >= 80) return "최근 상승폭이 커서 진입 전 급등 사유 확인 필요";
  if (s.vol < 45) return "변동성이 큰 편이라 진입 시점과 비중 분할 검토 필요";
  if (s.value < 40) return "밸류 지표가 낮아 고평가 여부 원문 재무 확인 필요";
  return "점수 근거가 된 지표와 원문 공시·재무를 함께 확인 필요";
}

const CHECK_POINT: Record<string, string> = {
  treasury_buy: "자기주식 취득 규모와 목적을 원문에서 확인 필요",
  insider_buy: "보유 변동의 매수·매도 방향과 규모는 본문 확인 필요",
  correction: "정정 사유와 변경된 수치를 원문에서 확인 필요",
  single_contract: "계약 규모와 직전 매출 대비 비율을 원문에서 확인 필요",
  capital_raise: "발행 규모와 자금 사용 목적을 원문에서 확인 필요",
};

export const metadata = {
  title: "오른스코어 — 한국 주식 탐색 도구 | 138개 종목 데이터 분석",
  description: "코스피·코스닥 138개 종목의 모멘텀·거래활성도·밸류에이션·변동성을 한 화면에서 비교하세요. PER·PBR·ROE·배당수익률·DART 공시 신호까지 — 종목 탐색 시간을 줄이는 데이터 도구.",
  keywords: ["한국주식", "테마주", "종목분석", "코스피", "코스닥", "PER", "PBR", "ROE", "배당주", "공시", "DART", "퀀트", "밸류에이션", "모멘텀"],
  authors: [{ name: "필로소디" }],
  openGraph: {
    title: "오른스코어 — 한국 주식 탐색 도구",
    description: "138개 종목의 모멘텀·거래활성도·밸류에이션·변동성·공시 신호를 한 화면에서. 종목 탐색 시간을 데이터로 줄여드립니다.",
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
  const top5 = pickTopStocks(5);
  const topSignals = pickTopSignals(3, (recentSig.signals as unknown as RecentSignal[]) ?? []);
  const dataAsOf = formatBizDateShort(dataMetadata.asOfBusinessDate);
  const dataStale = isDataStale(dataMetadata.asOfBusinessDate);

  // ── 오늘의 데이터 요약 통계 (후보 리스트와 동일한 !isSuspect 필터로 내부 일관) ──
  const strongCount = realStockPool.filter((s) => compositeOf(s) >= 80 && !isSuspect(s)).length;
  const spikeCount = volumeSpikeCount(realStockPool);
  const upCount = realStockPool.filter((s) => s.changePct > 0).length;
  const downCount = realStockPool.filter((s) => s.changePct < 0).length;
  const signalCount = recentSig.signalCount ?? (recentSig.signals?.length ?? 0);

  // ── 후보 카드 뷰모델 ──
  const candidates: StockCandidate[] = top5.map((s, i) => {
    const r3m = typeof s.returns?.r3m === "number" ? s.returns.r3m : null;
    return {
      rank: i + 1,
      name: s.name,
      ticker: s.ticker,
      priceLabel: fmtWon(s.currentPrice),
      changePct: s.changePct,
      r3m,
      score: Math.round(compositeOf(s)),
      metrics: strongMetrics(s),
      riskNote: riskNote(s, r3m),
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
      checkPoint: CHECK_POINT[s.signalType] ?? "공시 원문에서 세부 내용 확인 필요",
      inUniv: universeTickers.has(code),
      code,
      dartUrl: "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=" + s.disclosure.rcept_no,
    };
  });

  return (
    <div className="space-y-5 md:space-y-7">
      <WelcomeOnboarding />

      <HomeHero
        dataAsOf={dataAsOf}
        dataStale={dataStale}
        totalCount={dataMetadata.count}
        strongCount={strongCount}
        volumeSpikeCount={spikeCount}
        signalCount={signalCount}
        upCount={upCount}
        downCount={downCount}
      />

      <MarketSnapshotCards
        totalCount={dataMetadata.count}
        strongCount={strongCount}
        volumeSpikeCount={spikeCount}
        signalCount={signalCount}
      />

      <TopCandidateSection candidates={candidates} />

      <DisclosureSignalSection signals={signalVMs} />

      <HowItWorksSection />

      <RiskNotice />

      <section className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <strong className="text-zinc-700 dark:text-zinc-300">데이터 출처:</strong> KRX 일별 종가 (FinanceDataReader), Naver Finance PER/PBR/ROE, yfinance 보조 지표, DART 공시 실데이터. {dataMetadata.count}개 종목 · 매일 갱신 · 데이터 기준 {dataAsOf} 장마감.
        <div className="mt-3 flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
          <Link href="/about" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">서비스 소개</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">이용약관</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300 underline">개인정보처리방침</Link>
        </div>
      </section>
    </div>
  );
}
