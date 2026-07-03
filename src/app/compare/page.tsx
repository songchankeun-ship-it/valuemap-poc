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

  // 추천 비교 세트 — (1) 큐레이션한 "A vs B" 동종 피어 쌍을 우선 노출하고
  // (2) 같은 업종(sector) 그룹을 중복 업종 제외하고 보충한다. 전부 실데이터만 쓰며,
  // 결측·검증 보류(isSuspect) 종목이 들어간 쌍/그룹은 만들지 않는다(가짜 세트 없음).
  const byTicker = new Map(allStocks.map((s) => [s.ticker, s]));

  // 의미 있는 동종 피어 쌍. 두 종목이 모두 풀에 존재하고 검증 보류가 아닐 때만 노출한다.
  const CURATED_PAIRS: ReadonlyArray<readonly [string, string]> = [
    ["005930", "000660"], // 삼성전자 vs SK하이닉스 (반도체 대형주)
    ["032830", "085620"], // 삼성생명 vs 미래에셋생명 (생명보험)
    ["000990", "042700"], // DB하이텍 vs 한미반도체 (반도체 소부장)
    ["247540", "066970"], // 에코프로비엠 vs 엘앤에프 (2차전지 소재 — 검증 보류면 자동 제외)
  ];
  const curatedSets = CURATED_PAIRS.map(([a, b]) => {
    const sa = byTicker.get(a);
    const sb = byTicker.get(b);
    if (!sa || !sb || isSuspect(sa) || isSuspect(sb)) return null;
    return {
      label: `${sa.name} vs ${sb.name}`,
      tickers: [sa.ticker, sb.ticker],
      names: [sa.name, sb.name],
    };
  }).filter((x): x is { label: string; tickers: string[]; names: string[] } => x !== null);

  // 큐레이션 쌍이 이미 커버한 업종은 보충에서 제외(중복 방지)
  const curatedSectors = new Set(
    curatedSets.flatMap((set) => set.tickers.map((t) => sectorOf(byTicker.get(t)!.themes)))
  );

  // 같은 업종(sector) 그룹 — 검증 보류 제외, 큐레이션이 다루지 않은 업종만 보충
  const bySector = new Map<string, typeof allStocks>();
  for (const s of allStocks) {
    if (!(compositeOf(s) > 0) || isSuspect(s)) continue;
    const sector = sectorOf(s.themes);
    if (!sector || sector === "기타" || curatedSectors.has(sector)) continue;
    const arr = bySector.get(sector) ?? [];
    arr.push(s);
    bySector.set(sector, arr);
  }
  const sectorSets = Array.from(bySector.entries())
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
    // 피어가 가장 많이 모이는(=비교 의미가 큰) 업종 우선
    .sort((a, b) => b.tickers.length - a.tickers.length);

  // 큐레이션 쌍 우선 + 업종 그룹 보충, 스캔 가능하도록 총 4세트로 제한
  const recommendedSets = [...curatedSets, ...sectorSets].slice(0, 4);

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
          비교 기준은 자체 지표 4종 + 재무 + 수익률이며, 탐색용입니다.
        </p>
      </header>

      <CompareClient stockMap={stockMap} top5={top5} recommendedSets={recommendedSets} />

      {/* JS 미실행(정적 렌더·검색엔진·스크립트 오류) 시 빈 화면 방지 fallback */}
      <noscript>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 md:p-8 text-center">
          <div className="text-2xl mb-2">📊</div>
          <h2 className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">비교할 종목이 아직 없습니다</h2>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed mb-4">
            종목 상세에서 ‘비교에 추가’를 누르거나, 아래에서 종목을 찾아 담아보세요.
            <strong className="text-zinc-700 dark:text-zinc-300"> 최소 2개 · 최대 4개</strong>를 고르면 나란히 비교합니다.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 max-w-md mx-auto">
            <a href="/stocks" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold">
              종목 찾기
            </a>
            <a href="/today" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium">
              오늘 후보에서 고르기
            </a>
          </div>
        </div>
      </noscript>
    </div>
  );
}
