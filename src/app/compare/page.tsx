// /compare — 종목 비교 페이지
import Link from "next/link";
import { getAllStocks } from "@/lib/mockData";
import { CompareClient } from "@/components/CompareClient";

export const metadata = {
  title: "종목 비교 — 밸류맵",
  description: "선택한 종목들의 지표·재무 데이터를 한눈에 비교.",
};

export default function ComparePage() {
  const allStocks = getAllStocks();

  // 비교용 최소 정보만 직렬화
  const stockMap = Object.fromEntries(
    allStocks.map((s) => [
      s.ticker,
      {
        ticker: s.ticker,
        name: s.name,
        currentPrice: s.currentPrice,
        changePct: s.changePct,
        marketCap: s.marketCap,
        per: s.per,
        pbr: s.pbr,
        roe: s.roe,
        dividendYield: s.dividendYield,
        momentum: s.momentum,
        flow: s.flow,
        value: s.value,
        vol: s.vol,
        neglectScore: s.neglectScore,
        themes: s.themes,
      },
    ])
  );

  return (
    <div className="space-y-4">
      <nav className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
        <Link href="/" className="hover:text-zinc-700">홈</Link>
        <span>›</span>
        <span className="text-zinc-900 dark:text-zinc-100">종목 비교</span>
      </nav>

      <header>
        <h1 className="text-xl font-medium mb-1">종목 비교</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          종목 페이지에서 "비교에 추가" 한 종목들을 나란히 봅니다.
          자체 지표 4종 + 재무 + 수익률.
        </p>
      </header>

      <CompareClient stockMap={stockMap} />
    </div>
  );
}
