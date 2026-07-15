import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import {
  type ComparisonBasis,
  UNAVAILABLE_BASIS,
  marketDateSequence,
  classifyComparisonBasis,
  sharedComparisonBasis,
} from "@/lib/scoreComparison";

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

/**
 * @deprecated 미사용 · 최근 2행을 무조건 "어제(yesterday)"로 부르는 옛 계약. 날짜 인지 비교가 필요하면
 * getScoreChangesBatch(basis 포함) 또는 scoreComparison.classifyComparisonBasis 를 사용한다(공개 재감사 Slice B).
 */
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

/** 여러 종목의 최근 저장 2행 기준 변화량 일괄 조회 */
export interface MetricChange { momentum: number; flow: number; value: number; vol: number }

/**
 * 지표 변화 + 비교 날짜(basis) 를 함께 싣는 항목. 델타가 어느 두 날짜 사이 값인지가 함께 이동한다
 * — 최근 2행을 무조건 "어제"로 부르지 않기 위함(공개 재감사 Slice B).
 */
export interface MetricChangeEntry extends MetricChange {
  fromDate: string;
  toDate: string;
  basis: ComparisonBasis;
}

/** 종합 점수 델타 + 비교 날짜(basis). */
export interface ScoreDelta {
  delta: number;
  fromDate: string;
  toDate: string;
  basis: ComparisonBasis;
}

/**
 * 배치 결과 공통 골격 — 종목별 항목, 이 조회에서 실재한 마켓 날짜 시퀀스, 화면 상단 한 줄용 공유 기준.
 * marketDates 는 요청한 모든 종목의 business_date 합집합(최신순)으로, 특정 종목이 하루를 건너뛰면
 * 그 종목의 basis 는 자연히 'N거래일 전'으로 분류된다(로컬 마켓 캘린더).
 */
export interface ScoreChangesBatch {
  byTicker: Record<string, ScoreDelta>;
  marketDates: string[];
  sharedBasis: ComparisonBasis;
}
export interface MetricChangesBatch {
  byTicker: Record<string, MetricChangeEntry>;
  marketDates: string[];
  sharedBasis: ComparisonBasis;
}

export const EMPTY_SCORE_CHANGES_BATCH: ScoreChangesBatch = {
  byTicker: {},
  marketDates: [],
  sharedBasis: UNAVAILABLE_BASIS,
};
export const EMPTY_METRIC_CHANGES_BATCH: MetricChangesBatch = {
  byTicker: {},
  marketDates: [],
  sharedBasis: UNAVAILABLE_BASIS,
};

/** 지표별(추세·거래활성도·밸류·위험조정) 최근 저장 2행 변화 + 비교 날짜. daily_scores 기준. */
export async function getMetricChangesBatch(tickers: string[]): Promise<MetricChangesBatch> {
  if (tickers.length === 0) return EMPTY_METRIC_CHANGES_BATCH;
  try {
    const supabase = getClient();
    const { data } = await supabase
      .from("daily_scores")
      .select("ticker, business_date, momentum, flow, value, vol")
      .in("ticker", tickers)
      .order("business_date", { ascending: false });
    if (!data) return EMPTY_METRIC_CHANGES_BATCH;
    const marketDates = marketDateSequence(data.map((r) => r.business_date as string));
    type Row = MetricChange & { date: string };
    const byTicker = new Map<string, Row[]>();
    for (const r of data) {
      const t = r.ticker as string;
      if (!byTicker.has(t)) byTicker.set(t, []);
      const arr = byTicker.get(t)!;
      if (arr.length < 2) {
        arr.push({
          date: r.business_date as string,
          momentum: Number(r.momentum),
          flow: Number(r.flow),
          value: Number(r.value),
          vol: Number(r.vol),
        });
      }
    }
    const result: Record<string, MetricChangeEntry> = {};
    for (const [ticker, rows] of byTicker.entries()) {
      if (rows.length === 2) {
        result[ticker] = {
          momentum: rows[0].momentum - rows[1].momentum,
          flow: rows[0].flow - rows[1].flow,
          value: rows[0].value - rows[1].value,
          vol: rows[0].vol - rows[1].vol,
          toDate: rows[0].date,
          fromDate: rows[1].date,
          basis: classifyComparisonBasis(rows[0].date, rows[1].date, marketDates),
        };
      }
    }
    const sharedBasis = sharedComparisonBasis(Object.values(result).map((e) => e.basis));
    return { byTicker: result, marketDates, sharedBasis };
  } catch {
    return EMPTY_METRIC_CHANGES_BATCH;
  }
}

/** 종합 점수의 최근 저장 2행 변화 + 비교 날짜 일괄 조회. */
export async function getScoreChangesBatch(tickers: string[]): Promise<ScoreChangesBatch> {
  if (tickers.length === 0) return EMPTY_SCORE_CHANGES_BATCH;
  try {
    const supabase = getClient();
    const { data } = await supabase
      .from("daily_scores")
      .select("ticker, business_date, composite")
      .in("ticker", tickers)
      .order("business_date", { ascending: false });

    if (!data) return EMPTY_SCORE_CHANGES_BATCH;

    const marketDates = marketDateSequence(data.map((r) => r.business_date as string));
    // ticker별로 최근 2행(점수+날짜) 모으기
    const byTicker = new Map<string, { composite: number; date: string }[]>();
    for (const r of data) {
      const t = r.ticker as string;
      if (!byTicker.has(t)) byTicker.set(t, []);
      const arr = byTicker.get(t)!;
      if (arr.length < 2) arr.push({ composite: Number(r.composite), date: r.business_date as string });
    }

    const result: Record<string, ScoreDelta> = {};
    for (const [ticker, rows] of byTicker.entries()) {
      if (rows.length === 2) {
        result[ticker] = {
          delta: rows[0].composite - rows[1].composite,
          toDate: rows[0].date,
          fromDate: rows[1].date,
          basis: classifyComparisonBasis(rows[0].date, rows[1].date, marketDates),
        };
      }
    }
    const sharedBasis = sharedComparisonBasis(Object.values(result).map((e) => e.basis));
    return { byTicker: result, marketDates, sharedBasis };
  } catch {
    return EMPTY_SCORE_CHANGES_BATCH;
  }
}
