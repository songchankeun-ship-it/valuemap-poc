/**
 * 전역 데이터 신뢰 레이어 단일 소스 (설계서 ornscore_data_trust_badge_spec_v1 §15).
 *
 * 모든 화면의 데이터 기준일·산식 버전·데이터 상태·출처·제한·고지를 이 객체 하나에서 읽는다.
 * 값은 stocks.json 메타데이터(dataMetadata)에서 파생하며, 스펙의 예시 날짜를 하드코딩하지 않는다.
 * - 기준일/신선도: realStocks의 asOfBusinessDate + isDataStale 재사용 (화면 간 동일 판정 보장).
 * - 산식 버전 표기는 metricsVersionLabel 하나로 통일 ("Metrics 2.4").
 */
import {
  dataMetadata,
  formatBizDateLong,
  formatBizDateMobile,
  businessDaysSince,
  isDataStale,
} from "@/lib/realStocks";

export type DataStatusKind = "normal" | "partial" | "delayed" | "limited" | "error";

/** 상태별 라벨·짧은 의미·색상 토큰. 색상은 의미 전달의 유일 수단이 아니며 항상 텍스트를 동반한다. */
export const DATA_STATUS_META: Record<
  DataStatusKind,
  { label: string; meaning: string; tone: DataStatusKind }
> = {
  normal: {
    label: "데이터 정상",
    meaning: "주요 데이터가 기준일에 맞게 갱신되었습니다.",
    tone: "normal",
  },
  partial: {
    label: "일부 지연",
    meaning: "일부 종목의 재무 데이터가 최신 기준이 아닐 수 있습니다.",
    tone: "partial",
  },
  delayed: {
    label: "갱신 지연",
    meaning: "가격 데이터가 직전 영업일 기준입니다.",
    tone: "delayed",
  },
  limited: {
    label: "제한 수집",
    meaning: "공시는 최신 200건까지만 분석합니다.",
    tone: "limited",
  },
  error: {
    label: "점검 필요",
    meaning: "일부 데이터 생성에 문제가 있어 확인이 필요합니다.",
    tone: "error",
  },
};

export interface DataSource {
  id: string;
  label: string;
  usage: string;
}

/** 데이터 출처별 사용 목적 (설계서 §9). */
export const DATA_SOURCES: DataSource[] = [
  { id: "krx", label: "KRX", usage: "가격·거래량·종가 계산에 사용합니다." },
  { id: "naver", label: "Naver Finance", usage: "PER·PBR·ROE·배당 등 재무 지표에 사용합니다." },
  { id: "yfinance", label: "yfinance", usage: "보조 가격 데이터와 시계열 검증에 사용합니다." },
  { id: "dart", label: "DART", usage: "공시 원문과 공시 신호 분류에 사용합니다." },
];

/** generatedAt(ISO) → "YYYY.MM.DD" (산식 적용일 파생용). 형식 불명 시 undefined. */
function isoToDotDate(iso?: string): string | undefined {
  if (!iso || iso.length < 10) return undefined;
  const y = iso.slice(0, 4);
  const mo = iso.slice(5, 7);
  const da = iso.slice(8, 10);
  if (!/^\d{4}$/.test(y) || !/^\d{2}$/.test(mo) || !/^\d{2}$/.test(da)) return undefined;
  return `${y}.${mo}.${da}`;
}

// ── 파생 값 ────────────────────────────────────────────────────────────
const asOf = dataMetadata.asOfBusinessDate; // YYYYMMDD | undefined
const stale = isDataStale(asOf);
const status: DataStatusKind = stale ? "delayed" : "normal";
const statusMeta = DATA_STATUS_META[status];
const metricsVersion = dataMetadata.metricsVersion; // "2.4" | undefined
const bizDays = businessDaysSince(asOf);

/**
 * 전역 데이터 신뢰 객체. 모든 신뢰 배지/모달/푸터가 이 객체를 읽는다.
 * 백테스트·공시 등 페이지별 기준이 다른 데이터는 별도 표기하며 여기서 전역 기준일을 덮지 않는다.
 */
export const dataStatus = {
  /** 가격·점수 기준 영업일 (YYYYMMDD). */
  globalAsOfDate: asOf,
  /** "2026.06.16 (화)" — 헤더·모달·푸터 정식 표기. */
  globalAsOfLabel: formatBizDateLong(asOf),
  /** "06.16(화)" — 모바일 압축 표기. */
  marketDateLabel: formatBizDateMobile(asOf),
  /** 기준일로부터 경과 영업일(월~금). 불명 시 null. */
  businessDaysSince: bizDays,
  dataStale: stale,

  status,
  statusLabel: statusMeta.label,
  statusMeaning: statusMeta.meaning,
  statusTone: statusMeta.tone,

  universeCount: dataMetadata.count,

  metricsVersion,
  /** 전 화면 단일 표기 — "Metrics 2.4". */
  metricsVersionLabel: metricsVersion ? `Metrics ${metricsVersion}` : "Metrics —",
  /** 산식 적용일 — 전용 필드가 없어 생성 시각에서 파생(스펙상 잔여 리스크). */
  metricsEffectiveDate: isoToDotDate(dataMetadata.generatedAt),

  sources: DATA_SOURCES,

  notices: {
    investment: "오른스코어는 투자 추천이 아니라 종목 탐색 시간을 줄이는 데이터 도구입니다.",
    score: "점수는 같은 분석 풀 안에서의 상대 위치이며 미래 수익률을 의미하지 않습니다.",
  },

  /** 페이지별 제한 요약 (설계서 §10.4 / §10.5). */
  limits: {
    disclosure: "공시는 성능·비용을 위해 최신 200건까지만 분석합니다.",
    backtest: "백테스트는 아이디어 검증용 시뮬레이션이며 현재 종합점수의 성과 검증 결과가 아닙니다.",
  },
} as const;

export type DataStatus = typeof dataStatus;
