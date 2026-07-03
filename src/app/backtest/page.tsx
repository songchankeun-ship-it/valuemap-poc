import Link from "next/link";
import { BacktestClient, type BacktestData } from "@/components/BacktestClient";
import { BacktestLimitBadges } from "@/components/BacktestLimitBadges";
import { BacktestRiskNotice } from "@/components/backtest/BacktestRiskNotice";
import rawResult from "../../../public/backtest-result.json";
import { realStockPool } from "@/lib/realStocks";
import { dataStatus } from "@/lib/dataStatus";

const backtestDescription =
  "실데이터 기반 가격 신호 전략 검증. 누적수익률·MDD·Sharpe·알파 공개.";

export const metadata = {
  title: "백테스트 — 오른스코어",
  description: backtestDescription,
  openGraph: {
    title: "백테스트 — 오른스코어",
    description: backtestDescription,
    url: "/backtest",
    siteName: "오른스코어",
    locale: "ko_KR",
    type: "website",
    // 페이지별 openGraph 정의 시 루트 opengraph-image 상속이 끊기므로 공용 공유 카드를 유지.
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "백테스트 — 오른스코어",
    description: backtestDescription,
  },
  alternates: { canonical: "/backtest" },
};

// backtest-result.json 은 mock(준비 중) 또는 실데이터 두 형태일 수 있음.
// realData 플래그가 켜진 경우에만 차트를 렌더링한다.
const result = rawResult as unknown as Partial<BacktestData>;

export default function BacktestPage() {
  const ready = !!result.realData && Array.isArray(result.strategies) && result.strategies.length > 0;

  if (ready) {
    const names: Record<string, string> = {};
    for (const st of realStockPool) names[st.ticker] = st.name;
    return <BacktestClient data={result as BacktestData} names={names} siteDataAsOf={dataStatus.globalAsOfLabel} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <header>
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">← 홈으로</Link>
        <h1 className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">실험 전략 백테스트</h1>
      </header>

      <BacktestLimitBadges />

      <BacktestRiskNotice />

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🚧</span>
          <div>
            <h2 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">실데이터 준비 중</h2>
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              5년치 KRX 일별 데이터로 가격 기반 신호 전략을 검증하는 엔진이 준비됐습니다.
              데이터 수집 후 <code className="px-1 rounded bg-amber-100 dark:bg-amber-900/50">python scripts/backtest/run_real.py</code> 를 실행하면
              이 페이지에 실제 누적 수익률·MDD·Sharpe·알파가 자동으로 표시됩니다.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-3">
              가짜 시뮬레이션 숫자를 보여주는 것보다, 실데이터가 준비되면 정직하게 공개하는 게 맞다고 생각합니다.
            </p>
          </div>
        </div>
      </div>

      <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
        <h3 className="font-semibold mb-3 text-zinc-900 dark:text-zinc-100">검증 전략 (가격 기반)</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-zinc-300">
          <li className="flex gap-2"><span className="text-gray-400">01.</span>모멘텀 점수 상위 10개 월별 리밸런싱 (추세 추종)</li>
          <li className="flex gap-2"><span className="text-gray-400">02.</span>변동성조정 점수 상위 10개 월별 리밸런싱 (위험조정)</li>
          <li className="flex gap-2"><span className="text-gray-400">03.</span>소외도(낙폭) 점수 상위 10개 월별 리밸런싱</li>
          <li className="flex gap-2"><span className="text-gray-400">04.</span>가격종합 점수 상위 10개 월별 리밸런싱 (균형)</li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-3 leading-relaxed">
          ※ 밸류·거래활성도 전략은 과거 시점의 펀더멘털·수급 데이터가 없어 백테스트에서 제외합니다.
          (현재 스냅샷을 과거에 적용하면 미래참조 편향이 생김)
        </p>
      </section>

      <section className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
        <strong className="text-gray-700 dark:text-zinc-300">사용 데이터:</strong> KRX 일별 종가 (FDR 경유). {realStockPool.length}개 종목.
        벤치마크는 분석 유니버스 {realStockPool.length}종목 동일가중 매수후보유 전략입니다 (KOSPI·KOSDAQ 같은 실제 시장지수가 아닙니다).
      </section>

      <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-700 dark:text-blue-400 border-t border-gray-200 dark:border-zinc-800 pt-4">
        <Link href="/guide/metrics" className="hover:underline">지표 계산 방식 보기 →</Link>
        <Link href="/status" className="hover:underline">데이터 상태 확인 →</Link>
      </nav>
    </div>
  );
}
