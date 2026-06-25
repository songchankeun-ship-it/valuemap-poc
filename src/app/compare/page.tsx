// /compare — 종목 비교 페이지
import Link from "next/link";
import { realStockPool } from "@/lib/realStocks";
import { compositeOf } from "@/lib/score";
import { isSuspect } from "@/lib/dataQuality";
import { sectorOf } from "@/lib/sector";
import { CompareClient } from "@/components/CompareClient";

export const metadata = {
  title: "종목 비교 — 오른스코어",
  description: "선택한 종목들의 지표·재무 데이터를 한눈에 비교.",
};

export default function ComparePage() {
  const allStocks = realStockPool;

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
        returns: s.returns ?? {},
      },
    ])
  );

  // 오늘 Top 5 — 홈과 동일 기준(종합점수 상위 · 검증 보류 제외)
  const top5 = [...allStocks]
    .filter((s) => compositeOf(s) > 0 && !isSuspect(s))
    .sort((a, b) => compositeOf(b) - compositeOf(a))
    .slice(0, 5)
    .map((s) => ({ ticker: s.ticker, name: s.name }));

  // 추천 비교 세트 — 실데이터만 사용. 같은 업종(sector) 내 종합점수 상위 종목을
  // 묶어 "같은 업종끼리 나란히 보기" 시작점을 제공한다(가짜 세트 생성 안 함).
  const bySector = new Map<string, typeof allStocks>();
  for (const s of allStocks) {
    if (!(compositeOf(s) > 0) || isSuspect(s)) continue;
    const sector = sectorOf(s.themes);
    if (!sector || sector === "기타") continue;
    const arr = bySector.get(sector) ?? [];
    arr.push(s);
    bySector.set(sector, arr);
  }
  const recommendedSets = Array.from(bySector.entries())
    .filter(([, arr]) => arr.length >= 2)
    .map(([sector, arr]) => {
      const picks = [...arr]
        .sort((a, b) => compositeOf(b) - compositeOf(a))
        .slice(0, 4);
      return {
        label: sector,
        tickers: picks.map((s) => s.ticker),
        names: picks.map((s) => s.name),
      };
    })
    // 피어가 가장 많이 모이는(=비교 의미가 큰) 업종 우선, 상위 3세트만 노출
    .sort((a, b) => b.tickers.length - a.tickers.length)
    .slice(0, 3);

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

      <CompareClient stockMap={stockMap} top5={top5} recommendedSets={recommendedSets} />
    </div>
  );
}
