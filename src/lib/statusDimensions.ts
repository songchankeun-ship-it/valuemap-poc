/**
 * 사용자 향(user-facing) 데이터 상태 차원 — 순수(무거운 데이터 import 없음) 빌더.
 *
 * 공개 재감사 Slice C: 공개 /status가 단일 "정상(초록)" 하나로 뭉뚱그리던 상태를,
 * 사용자가 실제로 알아야 할 6개 차원으로 분리한다. 각 차원은 명시적 날짜(또는 범위)와
 * ok / limited(범위 제한) / attention(확인 필요) 상태를 함께 싣는다.
 *   1) 가격 신선도(price)        — 전역 기준일·지연·오늘 마감 수집 대기
 *   2) 점수 신선도(score)        — 점수 계산 시각·산식 버전
 *   3) 점수 이력 연속성(history) — Slice B 비교 기준(전 거래일/N거래일 전/최근 저장/불가)
 *   4) 재무 완성도(financial)    — PER·PBR 결측 종목 비율
 *   5) 공시 범위(disclosure)     — DART 수집 창·최대 건수(설계상 범위 제한)
 *   6) 테마·거래활성도 가용성(themeFlow) — 테마 부여·거래활성도 산출 종목 수(테마는 휴리스틱)
 *
 * GitHub Actions·daily_scores·cron·코드 기대 산식 버전 같은 구현 세부는 이 차원에 넣지 않는다
 * (그런 내부 세부는 보호된 /admin/status 로 이동). 값은 서버가 직렬화해 넘긴 입력에서만 파생하며
 * 런타임 데이터를 지어내지 않는다. 외부 의존이 없어 순수 테스트(scripts/test_statusDimensions.ts)가 가능하다.
 */
import type { Locale } from "./i18n";
import {
  classifyComparisonBasis,
  comparisonBasisLabel,
  marketDateSequence,
  type ComparisonBasis,
  type ComparisonBasisKind,
} from "./scoreComparison";

/** 차원 상태: 정상 / 범위 제한 / 확인 필요. 색은 의미의 유일 수단이 아니며 항상 라벨을 동반한다. */
export type DimensionState = "ok" | "limited" | "attention";

export type StatusDimensionKey =
  | "price"
  | "score"
  | "history"
  | "financial"
  | "disclosure"
  | "themeFlow";

/** 서버가 계산해 직렬화로 넘기는 차원 입력(무거운 데이터·런타임 시각 의존은 여기서 제외). */
export interface StatusDimensionInput {
  /** 가격 신선도: 전역 기준일 라벨·지연 여부·오늘 마감 수집 대기(클라 신선도 훅)·경과 표기. */
  price: { asOfLabel: string; stale: boolean; awaitingClose: boolean; ageLabel: string };
  /** 점수 신선도: 점수 계산 시각 라벨(KST)·산식 버전 라벨·생성 메타 존재 여부. */
  score: { computedLabel: string; metricsVersionLabel: string; generated: boolean };
  /** 점수 이력 연속성: 이력 스냅샷의 기준일들(YYYYMMDD)과 항목 수 — Slice B 시퀀스로 분류. */
  history: { asOfDates: readonly string[]; entryCount: number };
  /** 재무 완성도: PER·PBR 결측 종목 수·전체·임계 초과 여부. */
  financial: { missing: number; universe: number; overThreshold: boolean };
  /** 공시 범위: 수집 창(일)·최대 건수. 설계상 항상 범위 제한. */
  disclosure: { windowDays: number; maxFilings: number };
  /** 테마·거래활성도 가용성: 테마 부여 종목 수·거래활성도 산출 종목 수·전체(테마는 휴리스틱 분류). */
  themeFlow: { themedCount: number; flowCount: number; universe: number };
}

/** 화면에 렌더할 차원 1개(직렬화 가능). */
export interface StatusDimension {
  key: StatusDimensionKey;
  label: string;
  state: DimensionState;
  stateLabel: string;
  /** 사용자에게 보여줄 명시적 날짜/범위(없으면 null). */
  asOf: string | null;
  detail: string;
  /** 점수 이력 연속성만: Slice B basis 종류(테스트·디버그 가시성). */
  basisKind?: ComparisonBasisKind;
}

const STATE_LABEL: Record<Locale, Record<DimensionState, string>> = {
  ko: { ok: "정상", limited: "범위 제한", attention: "확인 필요" },
  en: { ok: "Normal", limited: "Limited", attention: "Attention" },
};

const DIMENSION_LABEL: Record<Locale, Record<StatusDimensionKey, string>> = {
  ko: {
    price: "가격 신선도",
    score: "점수 신선도",
    history: "점수 이력 연속성",
    financial: "재무 완성도",
    disclosure: "공시 범위",
    themeFlow: "테마·거래활성도 가용성",
  },
  en: {
    price: "Price freshness",
    score: "Score freshness",
    history: "Score-history continuity",
    financial: "Financial completeness",
    disclosure: "Disclosure scope",
    themeFlow: "Theme · trading-activity availability",
  },
};

/** YYYYMMDD → MM-DD(표시 전용). 형식 불명이면 원본 유지. */
function mmdd(ymd: string): string {
  return /^\d{8}$/.test(ymd) ? `${ymd.slice(4, 6)}-${ymd.slice(6, 8)}` : ymd;
}

/**
 * 점수 이력 스냅샷 기준일들을 Slice B 시퀀스로 분류해 연속성 basis 를 얻는다.
 * - 서로 다른 기준일이 2개 미만이면 → unavailable(비교할 이력 부족).
 * - 있으면 최신 두 기준일을 classifyComparisonBasis 로 분류(전 거래일/N거래일 전/최근 저장).
 * 마켓 캘린더가 곧 스냅샷 기준일 시퀀스라, 하루 건너뛴 이력은 자연히 'N거래일 전'이 된다.
 */
export function historyContinuityBasis(asOfDates: readonly string[]): ComparisonBasis {
  const seq = marketDateSequence(asOfDates);
  if (seq.length < 2) return { kind: "unavailable" };
  return classifyComparisonBasis(seq[0], seq[1], seq);
}

/** basis 종류 → 이력 연속성 차원 상태. 전 거래일만 정상, 나머지는 범위 제한(불가는 이력 축적 중). */
function historyState(kind: ComparisonBasisKind): DimensionState {
  return kind === "previous-trading-day" ? "ok" : "limited";
}

/**
 * 6개 사용자 향 상태 차원을 만든다(순수). 상태·라벨·상세·명시적 날짜만 파생하며 데이터를 지어내지 않는다.
 */
export function buildStatusDimensions(
  input: StatusDimensionInput,
  locale: Locale,
): StatusDimension[] {
  const sl = STATE_LABEL[locale];
  const dl = DIMENSION_LABEL[locale];
  const en = locale === "en";

  // 1) 가격 신선도 — 지연이면 확인 필요, 오늘 마감 수집 전이면 범위 제한, 그 외 정상.
  const priceState: DimensionState = input.price.stale
    ? "attention"
    : input.price.awaitingClose
      ? "limited"
      : "ok";
  const priceDetail = en
    ? `${input.price.asOfLabel} market close${input.price.ageLabel}` +
      (input.price.stale
        ? " · update may be delayed"
        : input.price.awaitingClose
          ? " · today's close not yet collected"
          : "")
    : `${input.price.asOfLabel} 장마감 기준${input.price.ageLabel}` +
      (input.price.stale
        ? " · 갱신 지연 가능"
        : input.price.awaitingClose
          ? " · 오늘 마감 수집 전"
          : "");

  // 2) 점수 신선도 — 생성 메타가 없으면 확인 필요, 있으면 정상. 산식 버전 라벨만 병기(코드 기대값 비교는 admin).
  const scoreState: DimensionState = input.score.generated ? "ok" : "attention";
  const scoreDetail = input.score.generated
    ? en
      ? `Computed ${input.score.computedLabel} KST · ${input.score.metricsVersionLabel}`
      : `${input.score.computedLabel} KST 계산 · ${input.score.metricsVersionLabel}`
    : en
      ? "No score-generation metadata — needs review"
      : "점수 생성 메타 없음 — 확인 필요";

  // 3) 점수 이력 연속성 — Slice B basis 를 그대로 소비.
  const basis = historyContinuityBasis(input.history.asOfDates);
  const histState = historyState(basis.kind);
  let histAsOf: string | null = null;
  let histDetail: string;
  if (basis.kind === "unavailable") {
    histDetail =
      input.history.entryCount < 2
        ? en
          ? "Not enough stored history to compare yet (accruing)"
          : "비교할 이력이 아직 부족합니다 (이력 축적 중)"
        : en
          ? "Comparison basis not established"
          : "비교 기준을 세울 수 없음";
  } else {
    histAsOf = `${mmdd(basis.fromDate)} → ${mmdd(basis.toDate)}`;
    histDetail = `${histAsOf} · ${comparisonBasisLabel(basis, en ? "en" : "ko")}`;
  }

  // 4) 재무 완성도 — 임계 초과면 확인 필요, 결측이 있으면 범위 제한, 없으면 정상.
  const finState: DimensionState = input.financial.overThreshold
    ? "attention"
    : input.financial.missing > 0
      ? "limited"
      : "ok";
  const finDetail =
    input.financial.missing === 0
      ? en
        ? `No PER·PBR gaps (${input.financial.universe} stocks)`
        : `PER·PBR 결측 없음 (${input.financial.universe}종목)`
      : (en
          ? `PER·PBR missing for ${input.financial.missing} of ${input.financial.universe} stocks`
          : `PER·PBR 결측 ${input.financial.missing}/${input.financial.universe}종목`) +
        (input.financial.overThreshold
          ? en
            ? " · lower valuation-reading confidence"
            : " · 밸류 해석 신뢰도 주의"
          : "");

  // 5) 공시 범위 — 성능·비용을 위해 설계상 항상 범위 제한.
  const discDetail = en
    ? `DART · last ${input.disclosure.windowDays} days · within the latest ${input.disclosure.maxFilings} filings`
    : `DART · 최근 ${input.disclosure.windowDays}일 · 최신 ${input.disclosure.maxFilings}건 내에서만 분석`;

  // 6) 테마·거래활성도 가용성 — 하나라도 결측이면 범위 제한. 테마는 휴리스틱 분류임을 명시.
  const tfFull =
    input.themeFlow.themedCount >= input.themeFlow.universe &&
    input.themeFlow.flowCount >= input.themeFlow.universe;
  const tfState: DimensionState = tfFull ? "ok" : "limited";
  const tfDetail = en
    ? `Theme ${input.themeFlow.themedCount}/${input.themeFlow.universe} · trading-activity ${input.themeFlow.flowCount}/${input.themeFlow.universe} · themes are heuristic`
    : `테마 ${input.themeFlow.themedCount}/${input.themeFlow.universe} · 거래활성도 ${input.themeFlow.flowCount}/${input.themeFlow.universe} · 테마는 휴리스틱 분류`;

  return [
    { key: "price", label: dl.price, state: priceState, stateLabel: sl[priceState], asOf: input.price.asOfLabel, detail: priceDetail },
    { key: "score", label: dl.score, state: scoreState, stateLabel: sl[scoreState], asOf: input.score.generated ? `${input.score.computedLabel} KST` : null, detail: scoreDetail },
    { key: "history", label: dl.history, state: histState, stateLabel: sl[histState], asOf: histAsOf, detail: histDetail, basisKind: basis.kind },
    { key: "financial", label: dl.financial, state: finState, stateLabel: sl[finState], asOf: null, detail: finDetail },
    { key: "disclosure", label: dl.disclosure, state: "limited", stateLabel: sl.limited, asOf: null, detail: discDetail },
    { key: "themeFlow", label: dl.themeFlow, state: tfState, stateLabel: sl[tfState], asOf: null, detail: tfDetail },
  ];
}

/** 여러 차원의 종합 상태 — 하나라도 확인 필요면 attention, 하나라도 제한이면 limited, 그 외 ok. */
export function overallDimensionState(dims: readonly StatusDimension[]): DimensionState {
  if (dims.some((d) => d.state === "attention")) return "attention";
  if (dims.some((d) => d.state === "limited")) return "limited";
  return "ok";
}
