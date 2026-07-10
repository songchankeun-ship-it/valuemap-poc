/**
 * 종목별 가격 기준일 지연 감지 — 서버 전용 파생 헬퍼.
 *
 * 배경(출시 QA · 재검수 P0 #2): 전체 서비스 기준일(`dataMetadata.asOfBusinessDate`)은 최신인데
 * 특정 종목의 가격 시계열(`public/data/prices/{ticker}.json`)만 직전 거래일에 머무는 경우가 있다.
 * 예) 삼양홀딩스(000070)는 종목 가격이 전역 기준일보다 1영업일 과거일 수 있다. 종목 상세는 이미
 * 이 지연을 안내(Task 108)하지만, 목록/카드/상태 표면에는 반영되지 않아 "이 종목도 최신"으로
 * 오해될 수 있다. 이 헬퍼는 기존 데이터만 읽어 지연 종목을 집계한다(수집 코드·점수식·데이터셋 무변경).
 *
 * fs를 사용하는 서버 전용 모듈이므로 클라이언트 컴포넌트에서 import하지 말 것.
 * 결과는 프로세스 단위로 메모이즈(빌드/ISR 1회 계산). 판정은 순수 날짜 비교이며,
 * 종목 가격의 마지막 거래일이 전역 기준일보다 "과거"일 때만 지연으로 본다(미래·동일은 정상).
 */
import fs from "fs";
import path from "path";
import { realStockPool, dataMetadata } from "@/lib/realStocks";

export interface LaggedSymbol {
  ticker: string;
  name: string;
  /** 이 종목 가격 시계열의 마지막 거래일 YYYYMMDD. */
  priceDate: string;
  /** 전역 기준일보다 몇 영업일(평일) 과거인지. */
  businessDaysBehind: number;
}

export interface PriceLagSummary {
  /** 전역 기준일 YYYYMMDD(비교 기준). 판정 불가 시 null. */
  referenceDate: string | null;
  /** 지연 종목 수. */
  count: number;
  /** 지연 종목 상세(기준일 과거 순 → 티커 순). */
  lagged: LaggedSymbol[];
  /** 지연 종목 티커만(목록/후보 필터용 경량 배열). */
  laggedTickers: string[];
}

const EMPTY: PriceLagSummary = { referenceDate: null, count: 0, lagged: [], laggedTickers: [] };

function isYmd(s: string | null | undefined): s is string {
  return !!s && /^\d{8}$/.test(s);
}

/** from(과거) 다음 평일부터 to(포함)까지의 평일 수. from >= to면 0. */
function businessDaysBetween(fromYmd: string, toYmd: string): number {
  const toDate = (v: string) =>
    new Date(Date.UTC(Number(v.slice(0, 4)), Number(v.slice(4, 6)) - 1, Number(v.slice(6, 8))));
  const from = toDate(fromYmd);
  const to = toDate(toYmd);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from.getTime() >= to.getTime()) {
    return 0;
  }
  let behind = 0;
  const cursor = new Date(from);
  while (cursor.getTime() < to.getTime()) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const wd = cursor.getUTCDay();
    if (wd !== 0 && wd !== 6) behind += 1;
  }
  return behind;
}

/** 종목 가격 파일의 마지막 거래일 YYYYMMDD. 없거나 형식 오류면 null. */
function lastPriceDate(ticker: string): string | null {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "prices", `${ticker}.json`);
    if (!fs.existsSync(filePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
      to?: string;
      points?: { d?: string }[];
    };
    const raw = parsed?.to ?? (parsed?.points?.length ? parsed.points[parsed.points.length - 1]?.d : null);
    const digits = raw ? raw.replace(/-/g, "") : null;
    return isYmd(digits) ? digits : null;
  } catch {
    return null;
  }
}

let cache: PriceLagSummary | null = null;

/**
 * 전역 기준일보다 가격 기준일이 과거인 종목을 집계한다. 결과는 메모이즈된다.
 * 분석 대상 풀(realStockPool)의 종목만 검사한다.
 */
export function getPriceLagSummary(): PriceLagSummary {
  if (cache) return cache;
  const reference = dataMetadata.asOfBusinessDate;
  if (!isYmd(reference)) {
    cache = EMPTY;
    return cache;
  }
  const lagged: LaggedSymbol[] = [];
  for (const s of realStockPool) {
    const priceDate = lastPriceDate(s.ticker);
    if (!priceDate) continue; // 파일 없음/형식 오류 → 판정 불가(정상 취급, 상세 페이지와 동일)
    if (priceDate >= reference) continue; // 동일·미래 → 정상
    lagged.push({
      ticker: s.ticker,
      name: s.name,
      priceDate,
      businessDaysBehind: businessDaysBetween(priceDate, reference),
    });
  }
  lagged.sort((a, b) => (a.priceDate === b.priceDate ? a.ticker.localeCompare(b.ticker) : a.priceDate.localeCompare(b.priceDate)));
  cache = {
    referenceDate: reference,
    count: lagged.length,
    lagged,
    laggedTickers: lagged.map((l) => l.ticker),
  };
  return cache;
}
