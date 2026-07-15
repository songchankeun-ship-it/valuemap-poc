/**
 * 점수·지표 변화의 "비교 기준(basis)" 판정 — 순수(의존성 없음) 모듈.
 *
 * 공개 재감사 Slice B: daily_scores 최근 2행을 무조건 "전일(어제)"로 부르던 계약 실패를 고친다.
 * 저장된 두 행은 실제로 여러 거래일 떨어져 있을 수 있으므로, 로컬에 실재하는 마켓 날짜 시퀀스에
 * 대조해 (1) 전 거래일, (2) N거래일 전, (3) 최근 저장 데이터(간격 불명), (4) 비교 불가로 분류하고
 * 날짜를 델타와 함께 실어 나른다. 이 파일은 Supabase/Next 등 외부 의존이 전혀 없어 순수 테스트가 가능하다.
 */

export type ComparisonBasisKind =
  | "previous-trading-day"
  | "n-trading-days-ago"
  | "recent-stored"
  | "unavailable";

/** 비교 기준 — 항상 실제 비교 날짜(가능할 때)를 함께 싣는다. */
export type ComparisonBasis =
  | { readonly kind: "previous-trading-day"; readonly fromDate: string; readonly toDate: string }
  | {
      readonly kind: "n-trading-days-ago";
      readonly tradingDaysAgo: number;
      readonly fromDate: string;
      readonly toDate: string;
    }
  | { readonly kind: "recent-stored"; readonly fromDate: string; readonly toDate: string }
  | { readonly kind: "unavailable" };

export const UNAVAILABLE_BASIS: ComparisonBasis = { kind: "unavailable" };

/** 비교 기준이 실제 날짜를 갖는 종류인지(unavailable 이 아닌지). */
export function basisHasDates(
  basis: ComparisonBasis,
): basis is Exclude<ComparisonBasis, { kind: "unavailable" }> {
  return basis.kind !== "unavailable";
}

/**
 * 로컬에 실재하는 마켓 날짜 시퀀스를 만든다 — 중복 제거 후 최신순(내림차순).
 * YYYY-MM-DD 고정 포맷이라 사전식 정렬이 곧 날짜 정렬이다. 빈 값/비문자열은 무시하며 입력 순서를 가정하지 않는다.
 */
export function marketDateSequence(dates: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const d of dates) {
    if (typeof d === "string" && d.length > 0) seen.add(d);
  }
  return Array.from(seen).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

/**
 * 한 종목의 (최신 날짜 toDate, 이전 날짜 fromDate) 쌍을 마켓 날짜 시퀀스에 대조해 분류한다.
 * - 둘 중 하나라도 없거나 같은 날짜면 → unavailable(간격 없음, 비교 대상 아님).
 * - 두 날짜가 시퀀스에서 바로 인접(간격 1) → 전 거래일.
 * - 간격 N(≥2) → N거래일 전.
 * - 시퀀스에서 위치를 못 찾거나 순서가 어긋나면 → 최근 저장 데이터(간격 불명, 그래도 날짜는 싣는다).
 */
export function classifyComparisonBasis(
  toDate: string | null | undefined,
  fromDate: string | null | undefined,
  marketDates: readonly string[],
): ComparisonBasis {
  if (!toDate || !fromDate) return UNAVAILABLE_BASIS;
  if (toDate === fromDate) return UNAVAILABLE_BASIS;
  const iTo = marketDates.indexOf(toDate);
  const iFrom = marketDates.indexOf(fromDate);
  // 시퀀스는 최신순 → 유효한 fromDate 는 더 과거이므로 인덱스가 더 커야 한다(iFrom > iTo).
  if (iTo === -1 || iFrom === -1 || iFrom <= iTo) {
    return { kind: "recent-stored", fromDate, toDate };
  }
  const gap = iFrom - iTo;
  if (gap === 1) return { kind: "previous-trading-day", fromDate, toDate };
  return { kind: "n-trading-days-ago", tradingDaysAgo: gap, fromDate, toDate };
}

/**
 * 여러 종목의 개별 기준을 화면 상단 한 줄 카피용 "공유 기준" 하나로 축약한다.
 * - 판정 가능한 기준이 없으면 → unavailable.
 * - 모든 종목이 동일 종류·동일 날짜면 → 그 기준 그대로.
 * - 종목마다 다르면(mixed-date) → 하나의 "전 거래일"이라 단정하지 않고, 본 것 중 가장 최근 저장 창을
 *   'recent-stored'로 이름 붙인다(날짜는 유지, 거짓 전일 주장 금지).
 */
export function sharedComparisonBasis(bases: readonly ComparisonBasis[]): ComparisonBasis {
  const defined = bases.filter(basisHasDates);
  if (defined.length === 0) return UNAVAILABLE_BASIS;
  const first = defined[0];
  const uniform = defined.every(
    (b) => b.kind === first.kind && b.toDate === first.toDate && b.fromDate === first.fromDate,
  );
  if (uniform) return first;
  let newest = defined[0];
  for (const b of defined) {
    if (b.toDate > newest.toDate) newest = b;
  }
  return { kind: "recent-stored", fromDate: newest.fromDate, toDate: newest.toDate };
}

type BasisLang = "ko" | "en";

/** 짧은 기준 라벨(날짜 없음) — 캡션·요약 문장에 끼워 넣는다. */
export function comparisonBasisLabel(basis: ComparisonBasis, lang: BasisLang): string {
  switch (basis.kind) {
    case "previous-trading-day":
      return lang === "en" ? "vs. the previous trading day" : "전 거래일 대비";
    case "n-trading-days-ago":
      return lang === "en"
        ? `vs. ${basis.tradingDaysAgo} trading days ago`
        : `${basis.tradingDaysAgo}거래일 전 대비`;
    case "recent-stored":
      return lang === "en" ? "vs. recent stored data" : "최근 저장 데이터 대비";
    case "unavailable":
      return lang === "en" ? "no comparison basis yet" : "비교 기준 없음";
  }
}

/**
 * 날짜를 실은 기준 힌트 — 종목 상세 등 실제 비교 날짜를 반드시 보여줘야 하는 자리.
 * 언제나 실제 fromDate(MM-DD)를 밝히고, 간격을 알면 괄호로 덧붙인다("어제"라고 뭉뚱그리지 않는다).
 */
export function comparisonBasisDateHint(basis: ComparisonBasis, lang: BasisLang): string {
  if (basis.kind === "unavailable") {
    return lang === "en" ? "insufficient score history" : "점수 이력 부족";
  }
  const md = basis.fromDate.length >= 10 ? basis.fromDate.slice(5) : basis.fromDate;
  switch (basis.kind) {
    case "previous-trading-day":
      return lang === "en" ? `vs. ${md} (previous trading day)` : `${md} 대비 (전 거래일)`;
    case "n-trading-days-ago":
      return lang === "en"
        ? `vs. ${md} (${basis.tradingDaysAgo} trading days ago)`
        : `${md} 대비 (${basis.tradingDaysAgo}거래일 전)`;
    case "recent-stored":
      return lang === "en" ? `vs. ${md} (recent stored)` : `${md} 대비`;
  }
}
