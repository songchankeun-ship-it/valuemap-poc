/**
 * 시장 데이터 신선도 판정 — "파이프라인 정상"과 "최신 시세 반영"을 분리하기 위한 순수 헬퍼.
 *
 * 배경(출시 QA): 데이터 상태가 "정상"으로만 보이면, 금요일 장마감 이후에 들어온 사용자가
 * 전 거래일(목) 종가를 최신으로 오해할 수 있다. "정상"은 생성 파이프라인이 죽지 않았다는 뜻이지
 * "가장 최근 거래일 종가가 반영됐다"는 뜻이 아니다. 이 둘을 화면에서 반드시 분리한다.
 *
 * 이 모듈은 stocks.json 등 무거운 데이터를 import하지 않는 순수 함수만 노출한다
 * (클라이언트 번들 경량 유지). 판정은 데이터 기준일(YYYYMMDD)과 현재 시각(KST)만으로 결정론적이다.
 * 공휴일 캘린더는 없으므로 "마지막 KRX 거래일"은 평일(월~금) 근사이며, 뒤처짐이 1영업일이고
 * 오늘 장마감 수집 시점을 지난 경우에만 awaiting_close로 완화 판정한다(휴장일 오탐 최소화).
 */
import type { Locale } from "@/lib/i18n";

export type MarketFreshnessState = "fresh" | "awaiting_close" | "stale" | "unknown";

export interface MarketFreshness {
  state: MarketFreshnessState;
  /** 오늘(KST) 기준 종가가 이미 수집돼 있어야 할 예상 거래일 YYYYMMDD(평일 근사). 판정 불가 시 null. */
  expectedTradingDate: string | null;
  /** 데이터 기준일이 예상 거래일보다 며칠(평일) 뒤처졌는지. 판정 불가 시 null. */
  tradingDaysBehind: number | null;
  /** 오늘(KST)이 평일이고 장마감 수집 컷오프를 지났는지. */
  afterClose: boolean;
}

/**
 * KRX 정규장 마감(15:30 KST) 이후, 일일 데이터 수집(장마감 후 배치)이 당일 종가를 반영할 것으로
 * 기대하는 KST 시각. 이 시각 전에는 "오늘 종가가 아직 없다"가 정상이므로 신선도 경고를 내지 않는다.
 */
export const COLLECTION_CUTOFF_MINUTES = 19 * 60 + 30; // 19:30 KST

function kstParts(now: Date) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return {
    y: kst.getUTCFullYear(),
    m: kst.getUTCMonth() + 1,
    d: kst.getUTCDate(),
    weekday: kst.getUTCDay(), // 0=일 .. 6=토
    minutes: kst.getUTCHours() * 60 + kst.getUTCMinutes(),
  };
}

function ymd(y: number, m: number, d: number): string {
  return `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`;
}

function isWeekend(dt: Date): boolean {
  const wd = dt.getUTCDay();
  return wd === 0 || wd === 6;
}

/**
 * 데이터 기준일(asOf, YYYYMMDD)과 현재 시각으로 시장 데이터 신선도를 판정한다.
 * - fresh: asOf가 예상 거래일과 같거나(또는 앞섬) → 최신 반영.
 * - awaiting_close: 오늘 평일 장마감 컷오프를 지났지만 asOf가 직전 거래일 → 오늘 종가 수집 전(경미).
 * - stale: 그 밖에 2영업일 이상 뒤처짐 → 파이프라인 갱신 지연.
 */
export function computeMarketFreshness(asOf: string | undefined, now: Date): MarketFreshness {
  const unknown: MarketFreshness = {
    state: "unknown",
    expectedTradingDate: null,
    tradingDaysBehind: null,
    afterClose: false,
  };
  if (!asOf || !/^\d{8}$/.test(asOf)) return unknown;

  const { y, m, d, minutes } = kstParts(now);
  // KST 자정을 UTC Date로 표현해 날짜 산술을 로컬 타임존과 무관하게 수행한다.
  const todayKst = new Date(Date.UTC(y, m - 1, d));
  const afterCutoff = minutes >= COLLECTION_CUTOFF_MINUTES;
  const todayIsWeekday = !isWeekend(todayKst);
  const afterClose = todayIsWeekday && afterCutoff;

  // 오늘(KST) 이하에서 가장 최근 평일.
  const lastWeekday = new Date(todayKst);
  while (isWeekend(lastWeekday)) {
    lastWeekday.setUTCDate(lastWeekday.getUTCDate() - 1);
  }
  const lastIsToday = lastWeekday.getTime() === todayKst.getTime();

  // 종가가 이미 수집돼 있어야 할 "예상 거래일".
  // 오늘이 평일이라도 아직 장마감 수집 컷오프 전이면 오늘 종가는 기대 대상이 아니므로 직전 평일을 예상일로 본다.
  const expected = new Date(lastWeekday);
  if (lastIsToday && !afterCutoff) {
    do {
      expected.setUTCDate(expected.getUTCDate() - 1);
    } while (isWeekend(expected));
  }
  const expectedYmd = ymd(expected.getUTCFullYear(), expected.getUTCMonth() + 1, expected.getUTCDate());

  if (asOf === expectedYmd) {
    return { state: "fresh", expectedTradingDate: expectedYmd, tradingDaysBehind: 0, afterClose };
  }

  const asOfDate = new Date(
    Date.UTC(Number(asOf.slice(0, 4)), Number(asOf.slice(4, 6)) - 1, Number(asOf.slice(6, 8))),
  );
  if (Number.isNaN(asOfDate.getTime())) return unknown;

  // 데이터 기준일이 예상 거래일보다 오히려 앞서면(빌드가 미래 배치를 담은 경우 등) 비정상 아님 → fresh.
  if (asOfDate.getTime() >= expected.getTime()) {
    return { state: "fresh", expectedTradingDate: expectedYmd, tradingDaysBehind: 0, afterClose };
  }

  // asOf가 예상 거래일보다 며칠(평일) 뒤처졌는지.
  let behind = 0;
  const cursor = new Date(asOfDate);
  while (cursor.getTime() < expected.getTime()) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (!isWeekend(cursor)) behind += 1;
  }

  // 정확히 1거래일 뒤처졌고 오늘 평일 장마감 컷오프를 지난 상황 → "오늘 장마감 데이터 수집 전".
  // 파이프라인 실패가 아니라 당일 종가 반영 대기이므로 경미(warning) 처리한다.
  if (behind === 1 && afterClose) {
    return { state: "awaiting_close", expectedTradingDate: expectedYmd, tradingDaysBehind: 1, afterClose };
  }

  return { state: "stale", expectedTradingDate: expectedYmd, tradingDaysBehind: behind, afterClose };
}

/**
 * 신선도 상태별 표시 문구(로케일). 날짜/숫자/상태 종류는 동일하게 두고 라벨·의미만 로케일 분기.
 * 투자자문 표현 없이 탐색/확인/한계 어휘만 사용한다.
 */
export const marketFreshnessCopy = {
  ko: {
    /** 배지 소형 라벨(신선도 = awaiting_close). */
    awaitingBadge: "전 거래일 기준",
    /** 헤더/홈 짧은 보조 문구. */
    awaitingShort: "오늘 마감 수집 전",
    /** /status 등 한 줄 설명. */
    awaitingNote: "오늘 장마감 데이터 수집 전",
    awaitingDetail:
      "지금 표시된 가격·점수는 전 거래일 종가 기준입니다. 오늘 장마감 데이터는 장 종료 후 배치에서 반영됩니다.",
    freshShort: "최신 거래일 반영",
    staleNote: "갱신 지연 · 확인 필요",
    /** 파이프라인 정상 ≠ 최신 시세 — 신뢰 분리 핵심 문구. */
    pipelineVsLatest:
      "‘데이터 정상’은 생성 파이프라인이 정상 동작했다는 뜻이며, 표시된 가격이 실시간 최신 시세라는 의미는 아닙니다.",
  },
  en: {
    awaitingBadge: "Prior trading day",
    awaitingShort: "today's close pending",
    awaitingNote: "Today's market-close data not yet collected",
    awaitingDetail:
      "The prices and scores shown are from the previous trading day's close. Today's market-close data is applied in the after-close batch.",
    freshShort: "Latest trading day reflected",
    staleNote: "Update delayed · needs review",
    pipelineVsLatest:
      "“Data normal” means the generation pipeline ran without failure; it does not mean the prices shown are the latest real-time quote.",
  },
} as const satisfies Record<Locale, unknown>;
