import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

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

/**
 * 실제 Supabase 조회. 오류는 throw 한다(빈 폴백을 캐시에 굳히지 않기 위함) —
 * 정상 결과(데이터 또는 정당한 빈 배열)만 unstable_cache 에 저장되고, 일시적 오류는
 * 캐시되지 않아 다음 요청에 재시도된다.
 */
async function fetchScoreHistory(ticker: string, days: number): Promise<ScorePoint[]> {
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

  if (error) throw error; // 일시적 오류는 캐시하지 않음 → 다음 요청에 재조회
  if (!data) return [];
  return data.map((r) => ({
    date: r.business_date as string,
    momentum: Number(r.momentum),
    flow: Number(r.flow),
    value: Number(r.value),
    vol: Number(r.vol),
    composite: Number(r.composite),
  }));
}

/**
 * 읽기 전용 daily_scores 조회를 ticker·days 키로 1시간 캐시(unstable_cache).
 * 페이지의 revalidate=3600 과 동일한 신선도. 점수 산식·데이터 무변경, 읽기 전용 조회만 캐시.
 *
 * 주의: Supabase 클라이언트의 no-store fetch 때문에 /stock/[ticker] 는 여전히 동적
 * 렌더로 분류되며, 이 래퍼만으로 정적 생성이 복원되지는 않는다(로컬 next start 검증).
 * 다만 프로덕션 Vercel Data Cache 에서는 같은 키 조회가 revalidate 창 안에서 중복
 * 제거되어 반복 요청의 원격 왕복 비용을 줄인다. 라우트를 완전 정적화하려면 점수
 * 히스토리를 '근거' 탭의 클라이언트 지연 패치로 옮겨야 한다(후속, AI_HANDOFF 참고).
 */
function cachedScoreHistory(ticker: string, days: number): Promise<ScorePoint[]> {
  return unstable_cache(
    () => fetchScoreHistory(ticker, days),
    ["score-history", ticker, String(days)],
    { revalidate: 3600, tags: ["score-history"] },
  )();
}

/** 특정 종목의 최근 N일 점수 히스토리. 조회 실패 시 빈 배열로 graceful degrade. */
export async function getScoreHistory(ticker: string, days = 30): Promise<ScorePoint[]> {
  try {
    return await cachedScoreHistory(ticker, days);
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
export interface MetricChange { momentum: number; flow: number; value: number; vol: number }

/** 지표별(추세·거래활성도·밸류·위험조정) 전일 대비 변화. daily_scores 최근 2영업일 기준. */
export async function getMetricChangesBatch(tickers: string[]): Promise<Record<string, MetricChange>> {
  if (tickers.length === 0) return {};
  try {
    const supabase = getClient();
    const { data } = await supabase
      .from("daily_scores")
      .select("ticker, business_date, momentum, flow, value, vol")
      .in("ticker", tickers)
      .order("business_date", { ascending: false });
    if (!data) return {};
    const byTicker = new Map<string, MetricChange[]>();
    for (const r of data) {
      const t = r.ticker as string;
      if (!byTicker.has(t)) byTicker.set(t, []);
      const arr = byTicker.get(t)!;
      if (arr.length < 2) arr.push({ momentum: Number(r.momentum), flow: Number(r.flow), value: Number(r.value), vol: Number(r.vol) });
    }
    const result: Record<string, MetricChange> = {};
    for (const [ticker, rows] of byTicker.entries()) {
      if (rows.length === 2) {
        result[ticker] = {
          momentum: rows[0].momentum - rows[1].momentum,
          flow: rows[0].flow - rows[1].flow,
          value: rows[0].value - rows[1].value,
          vol: rows[0].vol - rows[1].vol,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

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
