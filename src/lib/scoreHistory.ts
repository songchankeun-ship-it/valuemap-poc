import { createClient } from "@supabase/supabase-js";

export interface ScorePoint {
  date: string; // YYYY-MM-DD
  momentum: number;
  flow: number;
  value: number;
  vol: number;
  composite: number;
}

/** 서버 사이드에서 사용 — 익명 키로 충분 (RLS가 모든 사용자 SELECT 허용) */
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/** 특정 종목의 최근 N일 점수 히스토리 */
export async function getScoreHistory(ticker: string, days = 30): Promise<ScorePoint[]> {
  try {
    const supabase = getClient();
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("daily_scores")
      .select("business_date, momentum, flow, value, vol, composite")
      .eq("ticker", ticker)
      .gte("business_date", sinceStr)
      .order("business_date", { ascending: true });

    if (error || !data) return [];
    return data.map((r) => ({
      date: r.business_date as string,
      momentum: Number(r.momentum),
      flow: Number(r.flow),
      value: Number(r.value),
      vol: Number(r.vol),
      composite: Number(r.composite),
    }));
  } catch {
    return [];
  }
}

/** 특정 종목의 어제 대비 변화량 */
export async function getScoreChange(ticker: string): Promise<{
  yesterdayComposite: number | null;
  todayComposite: number | null;
  delta: number | null;
} | null> {
  try {
    const supabase = getClient();
    const { data } = await supabase
      .from("daily_scores")
      .select("business_date, composite")
      .eq("ticker", ticker)
      .order("business_date", { ascending: false })
      .limit(2);

    if (!data || data.length < 1) return null;

    const today = data[0] ? Number(data[0].composite) : null;
    const yesterday = data[1] ? Number(data[1].composite) : null;
    const delta = today !== null && yesterday !== null ? today - yesterday : null;

    return {
      todayComposite: today,
      yesterdayComposite: yesterday,
      delta,
    };
  } catch {
    return null;
  }
}

/** 여러 종목의 어제 대비 변화량 일괄 조회 */
export async function getScoreChangesBatch(tickers: string[]): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};
  try {
    const supabase = getClient();
    // 최근 2 영업일 데이터
    const { data } = await supabase
      .from("daily_scores")
      .select("ticker, business_date, composite")
      .in("ticker", tickers)
      .order("business_date", { ascending: false });

    if (!data) return {};

    // ticker별로 최근 2개씩 모으기
    const byTicker = new Map<string, number[]>();
    for (const r of data) {
      const t = r.ticker as string;
      if (!byTicker.has(t)) byTicker.set(t, []);
      const arr = byTicker.get(t)!;
      if (arr.length < 2) arr.push(Number(r.composite));
    }

    const result: Record<string, number> = {};
    for (const [ticker, scores] of byTicker.entries()) {
      if (scores.length === 2) {
        result[ticker] = scores[0] - scores[1];
      }
    }
    return result;
  } catch {
    return {};
  }
}
