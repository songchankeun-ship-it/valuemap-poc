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
  realStockPool,
} from "@/lib/realStocks";
import { isSuspect } from "@/lib/dataQuality";
import type { Locale } from "@/lib/i18n";

export type DataStatusKind = "normal" | "partial" | "delayed" | "limited" | "error";

/** 산식 버전 단일 기준값 — 빌드/검증 단언과 화면 표기가 모두 이 값을 따른다. */
export const EXPECTED_METRICS_VERSION = "2.4";

/** 산식 변경 이력 페이지 경로 (설계서 §13). */
export const metricsChangelogPath = "/guide/metrics/changelog";

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
    meaning: "공시는 최신 200건 내에서만 분석합니다.",
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

/**
 * 원본 소스 직접 확인 경로(evidence cockpit) — 사용자가 오른스코어 수치를 공식 원출처에서
 * 직접 교차 확인할 수 있는 외부 링크. URL은 이곳에서 단일 관리하고, 표시 문구(이름·용도)는
 * 로케일별 statusCopy.verifySources에서 읽는다(클라이언트 번들에 stocks.json 미포함 유지).
 * 비자문 원칙: "확인·대조" 용도만 안내하며 매수·매도 판단을 유도하지 않는다.
 */
export type VerificationSourceId = "krx" | "naver" | "dart";

export interface VerificationSource {
  id: VerificationSourceId;
  /** 공식 원출처 홈/검색 진입점(새 탭 이동). */
  url: string;
}

export const VERIFICATION_SOURCES: VerificationSource[] = [
  { id: "krx", url: "https://data.krx.co.kr/" },
  { id: "naver", url: "https://finance.naver.com/" },
  { id: "dart", url: "https://dart.fss.or.kr/dsab001/main.do" },
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

// ── 도메인별 실판정 (설계서 §12 / §17.3) ────────────────────────────────
// 재무: PER/PBR가 결측(0 또는 비숫자)인 종목 비율로 partial 판정. 임계 3% 초과 시 일부 지연.
const FINANCIAL_MISSING_THRESHOLD = 0.03;
const universeSize = realStockPool.length || 1;
const missingFinancials = realStockPool.filter(
  (s) => !(typeof s.per === "number" && s.per > 0) || !(typeof s.pbr === "number" && s.pbr > 0),
).length;
const financialMissingRate = missingFinancials / universeSize;
const financialStatus: DataStatusKind =
  financialMissingRate > FINANCIAL_MISSING_THRESHOLD ? "partial" : "normal";

// 산식: 버전 메타가 없으면 점검 필요(error), 있으면 정상.
const metricsStatus: DataStatusKind = metricsVersion ? "normal" : "error";

// ── 앱 내부 자동 점검 파생값 (설계서 §45 / §46) ──────────────────────────
// 운영자가 /status에서 바로 보는 "최근 자동 점검" 요약. 런타임 데이터를 지어내지 않고
// 빌드에 포함된 stocks.json 풀에서 실제 계산한 값만 노출한다.
// - 검증 보류(suspect): PER·PBR·ROE 극단값으로 Top·오늘 후보에서 제외되는 종목 수.
// - 결측: PER·PBR가 비어 밸류 해석 신뢰도가 낮은 종목 수(missingFinancials 재사용).
// - 산식 일치: stocks.json 메타 버전이 기대 버전(EXPECTED_METRICS_VERSION)과 같은지.
const suspectCount = realStockPool.filter((s) => isSuspect(s)).length;
const metricsVersionMatch = metricsVersion === EXPECTED_METRICS_VERSION;

export interface DomainStatus {
  key: "price" | "financial" | "disclosure" | "metrics";
  label: string;
  status: DataStatusKind;
  statusLabel: string;
  meaning: string;
  detail: string;
}

/**
 * 데이터 종류별 상태 — /status 분리 표기와 신뢰 모달이 함께 읽는 단일 소스.
 * 가격은 전역 status(normal/delayed)를 재사용하고, 재무는 결측률로 실판정한다.
 * 공시는 항상 limited(최신 200건 제한), 산식은 버전 메타 유무로 판정한다.
 */
export const domainStatuses: DomainStatus[] = [
  {
    key: "price",
    label: "가격·점수",
    status,
    statusLabel: statusMeta.label,
    meaning: statusMeta.meaning,
    detail: `${formatBizDateLong(asOf)} 장마감 · KRX`,
  },
  {
    key: "financial",
    label: "재무 지표",
    status: financialStatus,
    statusLabel: DATA_STATUS_META[financialStatus].label,
    meaning: DATA_STATUS_META[financialStatus].meaning,
    detail:
      missingFinancials > 0
        ? `Naver Finance · PER·PBR 결측 ${missingFinancials}종목 / ${universeSize}`
        : `Naver Finance · 결측 없음 (${universeSize}종목)`,
  },
  {
    key: "disclosure",
    label: "공시",
    status: "limited",
    statusLabel: DATA_STATUS_META.limited.label,
    meaning: DATA_STATUS_META.limited.meaning,
    detail: "DART · 최근 7일 · 최신 200건 내",
  },
  {
    key: "metrics",
    label: "산식",
    status: metricsStatus,
    statusLabel: DATA_STATUS_META[metricsStatus].label,
    meaning:
      metricsStatus === "error"
        ? "산식 버전 메타가 없어 확인이 필요합니다."
        : `현재 운영 산식 ${metricsVersion ? `Metrics ${metricsVersion}` : "—"} 기준입니다.`,
    detail: metricsVersion ? `Metrics ${metricsVersion}` : "버전 메타 없음",
  },
];

// ── 페이지별 제한 문구 단일 소스 (limits·knownLimits가 같은 문자열을 공유) ──
const LIMIT_DISCLOSURE = "공시는 성능·비용을 위해 최신 200건 내에서만 분석합니다.";
const LIMIT_BACKTEST =
  "백테스트는 아이디어 검증용 시뮬레이션이며 현재 종합 점수의 성과 검증 결과가 아닙니다.";

/** 운영자·사용자가 한눈에 보는 "알려진 제한" 항목 (이미 문서화된 사실만 모음). */
export interface KnownLimit {
  title: string;
  detail: string;
}

/**
 * 알려진 제한 — /status·신뢰 모달이 같은 정의를 읽는 단일 소스.
 * 새 제약을 만들지 않고, 이미 코드/문서에 있는 사실(공시 200건·백테스트 한계·밸류 표본·업종 휴리스틱·검증 보류)만 정리한다.
 */
export const knownLimits: KnownLimit[] = [
  {
    title: "종목 커버리지",
    detail: `현재 분석 대상은 ${dataMetadata.count}종목이며, 전체 상장 종목이 아닙니다. KOSPI200·KOSDAQ150·주요 ETF부터 단계적으로 확대할 예정이며, 데이터 품질 검증이 끝난 종목만 순차 추가합니다.`,
  },
  {
    title: "공시 분석 범위",
    detail: `${LIMIT_DISCLOSURE} 선택한 기간 전체 공시가 아니라 코스피·코스닥 각 최신 100건(합 200건) 안에서 추출합니다.`,
  },
  {
    title: "백테스트 한계",
    detail: `${LIMIT_BACKTEST} 생존편향(시점별 유니버스 미반영)은 후속 과제입니다.`,
  },
  {
    title: "밸류 업종 기준",
    detail:
      "업종 내 밸류는 동일 업종 PER·PBR 피어가 4종목 이상일 때만 제공하며, 표본이 부족하면 전체 풀 기준 점수만 표시합니다.",
  },
  {
    title: "업종 분류 방식",
    detail:
      "업종 구분은 KRX 공식 업종코드가 아니라 테마 기반 휴리스틱이며, 공식 코드 연동은 후속 과제입니다.",
  },
  {
    title: "검증 보류 종목",
    detail:
      "PER·PBR·ROE가 극단값인 종목은 검증 보류로 표시하고 오늘 후보·Top 목록에서 제외합니다.",
  },
];

/** 앱 내부 자동 점검 요약 — /status "최근 자동 점검"이 읽는 실측 값(런타임 날조 없음). */
export interface SelfCheck {
  /** 검증 보류(suspect) 종목 수 — Top·오늘 후보에서 제외. */
  suspectCount: number;
  /** PER·PBR 결측 종목 수(밸류 해석 신뢰도 낮음). */
  missingFinancialsCount: number;
  /** 분석 대상 전체 종목 수. */
  universeCount: number;
  /** stocks.json 산식 버전이 기대 버전과 일치하는지. */
  metricsVersionMatch: boolean;
  /** 기대 산식 버전(코드 단일 기준). */
  expectedMetricsVersion: string;
  /** stocks.json에 기록된 실제 산식 버전(없으면 undefined). */
  actualMetricsVersion: string | undefined;
}

const selfCheck: SelfCheck = {
  suspectCount,
  missingFinancialsCount: missingFinancials,
  universeCount: universeSize,
  metricsVersionMatch,
  expectedMetricsVersion: EXPECTED_METRICS_VERSION,
  actualMetricsVersion: metricsVersion,
};

/** 데이터 오류 신고 접수 메일 주소(단일 소스). */
export const reportEmail = "contact@ornscore.com";

/** 오류 신고 시 포함하면 확인이 빨라지는 항목 — 화면 체크리스트와 메일 본문이 같은 정의를 쓴다. */
export interface DataIssueField {
  label: string;
  hint: string;
}

export const dataIssueReportFields: DataIssueField[] = [
  { label: "종목명 · 코드", hint: "예: 삼성전자 005930" },
  { label: "항목(가격·재무·공시·점수)", hint: "어떤 데이터가 이상한지" },
  { label: "이상한 값과 기대값", hint: "보이는 값 / 맞다고 생각하는 값" },
  { label: "발견 화면 URL", hint: "문제를 본 페이지 주소" },
  { label: "연락 방법", hint: "회신받을 이메일(선택)" },
];

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

  /** 데이터 종류별 분리 상태 (가격/재무/공시/산식) — /status 확장이 읽는다. */
  domainStatuses,

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
    /** 공통 고지 3줄 단일 소스 — 홈 RiskNotice가 이 문구를 노출한다. */
    disclaimer: [
      "오른스코어는 투자 추천이 아닌 데이터 기반 탐색 도구입니다.",
      "모든 점수와 신호는 참고 정보이며, 매수·매도 추천이 아닙니다.",
      "최종 투자 판단과 책임은 사용자 본인에게 있습니다.",
    ],
  },

  /** 페이지별 제한 요약 (설계서 §10.4 / §10.5). */
  limits: {
    disclosure: LIMIT_DISCLOSURE,
    backtest: LIMIT_BACKTEST,
  },

  /** 알려진 제한 목록 (설계서 §3.3 / §10) — /status·신뢰 모달 공용. */
  knownLimits,

  /** 앱 내부 자동 점검 요약 (설계서 §45) — /status "최근 자동 점검"이 읽는 실측 값. */
  selfCheck,

  /** 데이터 오류 신고 접수 메일 (설계서 §46). */
  reportEmail,
} as const;

// ── 다국어 v2: 영어 표시 레이어 ─────────────────────────────────────────
// 날짜·숫자·상태 종류(DataStatusKind)는 동일하게 두고 라벨·의미·상세 문구만 영어로 제공한다.
// dataStatus(한국어)와 같은 구조라 TrustLayer·/status가 로케일만 바꿔 읽는다.
// 라벨 문자열을 넓힌(widened) 구조 타입으로, ko 리터럴 객체와 en 객체가 모두 대입 가능하다.
export interface LocalizedDataStatus {
  globalAsOfDate: string | undefined;
  globalAsOfLabel: string;
  marketDateLabel: string;
  businessDaysSince: number | null;
  dataStale: boolean;
  status: DataStatusKind;
  statusLabel: string;
  statusMeaning: string;
  statusTone: DataStatusKind;
  domainStatuses: readonly DomainStatus[];
  universeCount: number;
  metricsVersion: string | undefined;
  metricsVersionLabel: string;
  metricsEffectiveDate: string | undefined;
  sources: readonly DataSource[];
  notices: { investment: string; score: string; disclaimer: readonly string[] };
  limits: { disclosure: string; backtest: string };
  knownLimits: readonly KnownLimit[];
  selfCheck: SelfCheck;
  reportEmail: string;
}

const DATA_STATUS_META_EN: Record<DataStatusKind, { label: string; meaning: string }> = {
  normal: { label: "Data normal", meaning: "Key data is up to date as of the reference date." },
  partial: { label: "Partial delay", meaning: "Financial data for some stocks may not be current." },
  delayed: { label: "Update delayed", meaning: "Price data is from the previous business day." },
  limited: { label: "Limited collection", meaning: "Disclosures are analyzed only within the latest 200 filings." },
  error: { label: "Check needed", meaning: "Some data could not be generated and needs review." },
};

const DATA_SOURCES_EN_USAGE: Record<string, string> = {
  krx: "Used for price, volume, and close-based calculations.",
  naver: "Used for PER, PBR, ROE, dividend, and other financial metrics.",
  yfinance: "Used for supplementary price data and time-series validation.",
  dart: "Used for disclosure text and disclosure-signal classification.",
};

const LIMIT_DISCLOSURE_EN =
  "For performance and cost, disclosures are analyzed only within the latest 200 filings.";
const LIMIT_BACKTEST_EN =
  "Backtests are idea-validation simulations, not a performance verification of the current composite score.";

const knownLimitsEn: KnownLimit[] = [
  {
    title: "Stock coverage",
    detail: `Currently ${dataMetadata.count} stocks are analyzed — not all listed companies. Coverage expands gradually from KOSPI 200, KOSDAQ 150, and major ETFs, adding only stocks that pass data-quality checks.`,
  },
  {
    title: "Disclosure scope",
    detail: `${LIMIT_DISCLOSURE_EN} Signals come from the latest 100 filings each on KOSPI and KOSDAQ (200 total), not every filing in the selected period.`,
  },
  {
    title: "Backtest limits",
    detail: `${LIMIT_BACKTEST_EN} Survivorship bias (no point-in-time universe) is a follow-up task.`,
  },
  {
    title: "Sector valuation basis",
    detail:
      "In-sector valuation is shown only when a sector has 4 or more PER·PBR peers; with too few samples, only the full-pool score is shown.",
  },
  {
    title: "Sector classification",
    detail:
      "Sectors use a theme-based heuristic, not official KRX sector codes; official-code integration is a follow-up task.",
  },
  {
    title: "Pending-verification stocks",
    detail:
      "Stocks with extreme PER·PBR·ROE are marked pending verification and excluded from today's candidates and Top lists.",
  },
];

const domainLabelEn: Record<DomainStatus["key"], string> = {
  price: "Price · Score",
  financial: "Financial metrics",
  disclosure: "Disclosures",
  metrics: "Formula",
};

const domainStatusesEn: DomainStatus[] = [
  {
    key: "price",
    label: domainLabelEn.price,
    status,
    statusLabel: DATA_STATUS_META_EN[status].label,
    meaning: DATA_STATUS_META_EN[status].meaning,
    detail: `${formatBizDateLong(asOf)} market close · KRX`,
  },
  {
    key: "financial",
    label: domainLabelEn.financial,
    status: financialStatus,
    statusLabel: DATA_STATUS_META_EN[financialStatus].label,
    meaning: DATA_STATUS_META_EN[financialStatus].meaning,
    detail:
      missingFinancials > 0
        ? `Naver Finance · PER·PBR missing for ${missingFinancials} of ${universeSize} stocks`
        : `Naver Finance · no missing values (${universeSize} stocks)`,
  },
  {
    key: "disclosure",
    label: domainLabelEn.disclosure,
    status: "limited",
    statusLabel: DATA_STATUS_META_EN.limited.label,
    meaning: DATA_STATUS_META_EN.limited.meaning,
    detail: "DART · last 7 days · within the latest 200 filings",
  },
  {
    key: "metrics",
    label: domainLabelEn.metrics,
    status: metricsStatus,
    statusLabel: DATA_STATUS_META_EN[metricsStatus].label,
    meaning:
      metricsStatus === "error"
        ? "Formula version metadata is missing and needs review."
        : `Currently based on ${metricsVersion ? `Metrics ${metricsVersion}` : "—"}.`,
    detail: metricsVersion ? `Metrics ${metricsVersion}` : "No version metadata",
  },
];

const dataStatusEn: LocalizedDataStatus = {
  globalAsOfDate: asOf,
  globalAsOfLabel: formatBizDateLong(asOf),
  marketDateLabel: formatBizDateMobile(asOf),
  businessDaysSince: bizDays,
  dataStale: stale,
  status,
  statusLabel: DATA_STATUS_META_EN[status].label,
  statusMeaning: DATA_STATUS_META_EN[status].meaning,
  statusTone: statusMeta.tone,
  domainStatuses: domainStatusesEn,
  universeCount: dataMetadata.count,
  metricsVersion,
  metricsVersionLabel: metricsVersion ? `Metrics ${metricsVersion}` : "Metrics —",
  metricsEffectiveDate: isoToDotDate(dataMetadata.generatedAt),
  sources: DATA_SOURCES.map((s) => ({ ...s, usage: DATA_SOURCES_EN_USAGE[s.id] ?? s.usage })),
  notices: {
    investment: "OrnScore is a data tool that reduces stock-research time — not investment advice.",
    score: "Scores are a relative position within the same analysis pool and do not imply future returns.",
    disclaimer: [
      "OrnScore is a data-based exploration tool, not investment advice.",
      "All scores and signals are reference information, not buy or sell recommendations.",
      "Final investment decisions and responsibility rest with you.",
    ],
  },
  limits: { disclosure: LIMIT_DISCLOSURE_EN, backtest: LIMIT_BACKTEST_EN },
  knownLimits: knownLimitsEn,
  selfCheck,
  reportEmail,
};

/** 로케일별 데이터 신뢰 객체 — ko는 기존 dataStatus(한국어), en은 영어 트윈. */
export const dataStatusByLocale: Record<Locale, LocalizedDataStatus> = {
  ko: dataStatus,
  en: dataStatusEn,
};

/** 로케일에 맞는 데이터 신뢰 객체를 반환(서버에서 직렬화 props로 클라이언트에 전달). */
export function localizedDataStatus(locale: Locale): LocalizedDataStatus {
  return dataStatusByLocale[locale] ?? dataStatus;
}

/** 오류 신고 포함 항목 — 영어. */
export const dataIssueReportFieldsEn: DataIssueField[] = [
  { label: "Stock name · code", hint: "e.g., Samsung Electronics 005930" },
  { label: "Field (price/financial/disclosure/score)", hint: "which data looks wrong" },
  { label: "Unexpected value and expected", hint: "value shown / value you expected" },
  { label: "Page URL where found", hint: "address of the page with the issue" },
  { label: "Contact method", hint: "email for a reply (optional)" },
];

export const dataIssueReportFieldsByLocale: Record<Locale, DataIssueField[]> = {
  ko: dataIssueReportFields,
  en: dataIssueReportFieldsEn,
};

/**
 * 데이터 오류 신고 mailto: 링크 — /status·/about·푸터가 같은 본문/기준일을 공유한다.
 * prefill에는 해당 화면에서 자동 채운 컨텍스트(종목·URL 등)를 넘긴다. 본문은 실제 줄바꿈(\n)을 쓴다.
 */
export function buildDataIssueMailto(opts?: {
  subject?: string;
  prefill?: string;
  locale?: Locale;
}): string {
  const locale: Locale = opts?.locale ?? "ko";
  const ds = dataStatusByLocale[locale] ?? dataStatus;
  const subject =
    opts?.subject ?? (locale === "en" ? "[OrnScore] Data issue report" : "[오른스코어] 데이터 오류 신고");
  const bodyLines =
    locale === "en"
      ? [
          "Stock name/code:",
          "Field (price/financial/disclosure/score):",
          "Unexpected value and expected:",
          "Page (URL):",
          "Contact (optional):",
        ]
      : [
          "종목명/코드:",
          "항목(가격/재무/공시/점수):",
          "이상한 값과 기대값:",
          "발견 화면(URL):",
          "연락 방법(선택):",
        ];
  if (opts?.prefill) {
    bodyLines.push("", opts.prefill);
  }
  bodyLines.push(
    "",
    locale === "en"
      ? `— Data as of: ${ds.globalAsOfLabel} · Formula ${ds.metricsVersionLabel}`
      : `— 데이터 기준일: ${ds.globalAsOfLabel} · 산식 ${ds.metricsVersionLabel}`,
  );
  const body = bodyLines.join("\n");
  return `mailto:${reportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export type DataStatus = typeof dataStatus;
