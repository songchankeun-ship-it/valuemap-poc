// 공시 정보 위계(재검수 Slice K) — 반복되는 수집 범위 고지 대신 늘 확인 가능한 사실
// (제출일·공시 유형·DART 원문 링크·정정 여부·분류 근거)을 앞세우고, 금액·비율·신뢰도·연계
// 공시 같은 선택 필드는 원천 데이터가 실제로 제공할 때만 노출하기 위한 순수 판별 로직을 모은다.
//
// 이 모듈은 React·파일시스템·네트워크 의존이 없다(순수). 렌더 컴포넌트와 신호 디텍터가 같은
// 판별을 공유하도록 하여, 정정 분류가 곳곳에서 제각각 문자열 매칭되던 것을 하나로 고정한다.

/** 공시 신호 최소 형태 — 렌더/디텍터가 넘기는 구조만 받는다(라이브러리 결합 최소화). */
export interface DisclosureSignalLike {
  signalType?: string;
  signalLabel?: string;
  strength?: number;
  note?: string;
  direction?: string;
}

/**
 * 정정 공시 여부 — 오직 이용 가능한 메타데이터(공시 보고서명)만으로 결정론적으로 판별한다.
 * DART 보고서명에 '정정'이 들어가면 정정 공시다("기재정정"·"[정정]" 등 모두 '정정' 포함).
 * signalType과 독립이므로, 단일계약·유증 같은 다른 유형의 '정정'도 정정으로 표시할 수 있다.
 */
export function isCorrectionFiling(reportName: string | undefined | null): boolean {
  return typeof reportName === "string" && reportName.includes("정정");
}

/** 분류 근거 — 자동 유형 분류가 붙었으면 'auto', 원문만 있으면 'raw'(합성 라벨 금지). */
export function classificationBasisOf(signal: DisclosureSignalLike | null | undefined): "auto" | "raw" {
  return signal ? "auto" : "raw";
}

/** 방향 — 원천이 실제로 단서를 줄 때만. buy/sell은 명확 단서, unknown은 '확인 필요'(정직한 미상). */
export type DisclosureDirection = "buy" | "sell" | "unknown";

/**
 * 선택 필드 — 원천 데이터가 실제로 제공하는 값만 담는다(없으면 키 자체를 생략).
 * note(확인 포인트)와 direction(방향)만 다룬다. 금액·비율·신뢰도(strength) 같은 값은
 * 숫자로 합성해 노출하지 않으므로 여기서도 만들지 않는다 — 원천이 채운 note 문자열에만 실린다.
 */
export interface OptionalDisclosureFields {
  note?: string;
  direction?: DisclosureDirection;
}

export function presentOptionalFields(
  signal: DisclosureSignalLike | null | undefined
): OptionalDisclosureFields {
  const out: OptionalDisclosureFields = {};
  if (!signal) return out;
  const note = signal.note;
  if (typeof note === "string" && note.trim() !== "") out.note = note;
  const dir = signal.direction;
  if (dir === "긍정 가능") out.direction = "buy";
  else if (dir === "부정 가능") out.direction = "sell";
  else if (dir === "확인 필요") out.direction = "unknown";
  return out;
}
