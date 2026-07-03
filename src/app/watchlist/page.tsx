import { WatchlistClient } from "@/components/WatchlistClient";
import { getAllStocks } from "@/lib/mockData";
import { createClient } from "@/lib/supabase/server";
import recentSignalsRaw from "../../../public/disclosure-samples/recent-signals.json";
import { compositeOf } from "@/lib/score";
import { getScoreChangesBatch } from "@/lib/scoreHistory";
import type { StockForMatch } from "@/lib/matchConfig";
import { realStockPool } from "@/lib/realStocks";

export const metadata = {
  title: "관심 종목 — 오른스코어",
  robots: { index: false, follow: false },
};

interface RawSignal {
  signalType?: string;
  signalLabel?: string;
  strength?: number;
  disclosure?: { stock_code?: string };
}

/** 서버 SSR 원격 호출이 렌더를 막지 않도록 짧은 타임아웃과 경쟁시키고, 초과 시
 *  폴백으로 넘어간다(today/page.tsx·stock/[ticker]/page.tsx 와 동일 패턴). 점수
 *  델타는 목록의 보조 표시라, 원격(Supabase) 조회가 느리거나 실패하면 빈 델타로
 *  graceful degrade 하고 관심 종목 목록 자체는 영향받지 않는다. 정상(특히 캐시
 *  적중) 시에는 타임아웃 한참 전에 반환되어 동작 무변경. */
async function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export default async function WatchlistPage() {
  const allStocks = getAllStocks().map((s) => ({
    ticker: s.ticker,
    name: s.name,
    momentum: s.momentum,
    flow: s.flow,
    value: s.value,
    vol: s.vol,
    compositeScore: Math.round(compositeOf(s)),
  }));

  // 저장 필터 실시간 충족 수 계산용 — 알림 cron(evaluate-alerts)과 동일한 StockForMatch 매핑 재사용
  const matchPool: StockForMatch[] = realStockPool.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    per: s.per,
    pbr: s.pbr,
    roe: s.roe,
    dividendYield: s.dividendYield ?? 0,
    eps: s.eps ?? 0,
    score: Math.round(compositeOf(s)),
    momentum: s.momentum,
    flow: s.flow,
    value: s.value,
    vol: s.vol,
    marketCap: s.marketCap,
    market: s.market ?? "KOSPI",
    themes: s.themes,
  }));

  const tickerToDelta = await withTimeout(
    getScoreChangesBatch(allStocks.map((s) => s.ticker)),
    4000,
    {} as Record<string, number>,
  );

  // ticker → 최강 신호 매핑
  const signals = ((recentSignalsRaw as { signals?: RawSignal[] }).signals ?? []);
  const tickerToSignal: Record<string, { signalLabel: string; signalType: string; strength: number }> = {};
  for (const s of signals) {
    const code = s.disclosure?.stock_code;
    if (!code || !s.signalLabel || !s.signalType) continue;
    const cur = tickerToSignal[code];
    const strength = s.strength ?? 0;
    if (!cur || strength > cur.strength) {
      tickerToSignal[code] = { signalLabel: s.signalLabel, signalType: s.signalType, strength };
    }
  }

  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isLoggedIn = !!data.user;
  } catch {
    // ignore
  }

  return (
    <div className="max-w-3xl mx-auto px-0 md:px-4 py-4 md:py-8">
      <header className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">관심 종목</h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed break-words">
          담은 종목의 점수 변화·공시 신호를 이 화면에서 바로 추적해요.{" "}
          {isLoggedIn
            ? "로그인 됨 — 여러 기기에서 같은 목록이 보입니다."
            : "현재는 이 브라우저에만 저장됩니다. 로그인하면 여러 기기에서 이어볼 수 있어요."}
        </p>
      </header>
      <WatchlistClient allStocks={allStocks} matchPool={matchPool} tickerToSignal={tickerToSignal} tickerToDelta={tickerToDelta} isLoggedIn={isLoggedIn} />

      {/* JS 미실행(정적 렌더·검색엔진·스크립트 오류) 시 빈 화면/로딩 고착 방지 fallback */}
      <noscript>
        <div className="mt-2 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 md:p-8 text-center">
          <p className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1.5">아직 관심 종목이 없습니다</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm mx-auto leading-relaxed">
            종목 상세에서 ‘관심 종목’을 누르면 여기에 모아 매일 점수 변화와 공시 신호를 추적할 수 있어요.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 max-w-md mx-auto">
            <a href="/stocks" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold">
              종목 찾기
            </a>
            <a href="/today" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium">
              오늘 후보 보기
            </a>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
            로그인하면 여러 기기에서 관심 종목을 이어볼 수 있습니다.
          </p>
        </div>
      </noscript>
    </div>
  );
}
