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
};

interface RawSignal {
  signalType?: string;
  signalLabel?: string;
  strength?: number;
  disclosure?: { stock_code?: string };
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
    marketCap: s.marketCap,
    market: s.market ?? "KOSPI",
    themes: s.themes,
  }));

  const tickerToDelta = await getScoreChangesBatch(allStocks.map((s) => s.ticker));

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
        <h1 className="text-lg md:text-xl font-bold text-zinc-900 mb-1">관심 종목</h1>
        <p className="text-xs text-zinc-600">
          {isLoggedIn
            ? "로그인 됨 — 여러 기기에서 같은 목록이 보입니다."
            : "현재는 이 브라우저에만 저장됩니다. 로그인하면 여러 기기에서 이어볼 수 있어요."}
        </p>
      </header>
      <WatchlistClient allStocks={allStocks} matchPool={matchPool} tickerToSignal={tickerToSignal} tickerToDelta={tickerToDelta} isLoggedIn={isLoggedIn} />
    </div>
  );
}
