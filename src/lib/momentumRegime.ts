// 모멘텀 국면(regime) 결정적 분류 — 순수 함수.
//
// 목적: 종목 상세의 추세(모멘텀) 점수 한 줄 해석은 점수 하나만 보고 만든 "한 문장"이라
//   1개월과 6개월이 서로 반대로 움직이는 상황(예: 장기 강세·단기 약세)을 하나로 뭉개 버린다.
//   이 헬퍼는 이미 계산된 1·3·6개월 수익률(returns.r1m/r3m/r6m)의 부호만으로 국면을
//   결정적으로 분류해, 장·단기 흐름이 어긋날 때 그 대비를 그대로 노출하게 한다.
//
// 원칙:
//  - 점수 계산식(metrics.ts/score.ts)과 무관 — 표시용 파생만. 종합 점수·모멘텀 점수 무변경.
//  - 존재하는 수익률만 사용. 단기(1M)·장기(6M) 중 하나라도 결측이면 unavailable(지어내지 않음).
//  - |수익률| < MOMENTUM_FLAT_EPS(%) 는 "방향 없음(flat)"으로 본다(작은 노이즈를 상승/하락으로 과장 금지).

export type HorizonDir = "up" | "flat" | "down";

export type MomentumRegimeKey =
  | "strengthening" // 단기·장기 모두(또는 한쪽 상승 + 다른 쪽 중립) 상승 흐름
  | "longUpShortDown" // 장기 강세·단기 약세 — 장기 상승 속 단기 조정(대비)
  | "longDownShortUp" // 장기 약세·단기 반등 — 하락 추세 속 단기 되돌림(대비)
  | "weakening" // 단기·장기 모두(또는 한쪽 하락 + 다른 쪽 중립) 하락 흐름
  | "sideways" // 단기·장기 모두 방향 없음
  | "unavailable"; // 1M 또는 6M 수익률 결측 — 국면 판정 보류

export interface MomentumRegime {
  key: MomentumRegimeKey;
  /** 최근 1개월 방향. */
  shortDir: HorizonDir;
  /** 최근 3개월 방향(보조 — 대비 서술에만 사용). */
  midDir: HorizonDir;
  /** 최근 6개월 방향. */
  longDir: HorizonDir;
  /** 단기·장기 방향이 서로 반대인가(=한 문장으로 뭉뚱그리면 안 되는 국면). */
  divergent: boolean;
}

/** |수익률|이 이 값(%) 미만이면 방향 없음(flat)으로 본다. */
export const MOMENTUM_FLAT_EPS = 2;

export interface MomentumReturns {
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
}

/** 한 기간 수익률 → 방향. 결측/비유한이면 null. */
function dirOf(r: number | null | undefined): HorizonDir | null {
  if (r == null || !Number.isFinite(r)) return null;
  if (r >= MOMENTUM_FLAT_EPS) return "up";
  if (r <= -MOMENTUM_FLAT_EPS) return "down";
  return "flat";
}

/**
 * 1·3·6개월 수익률 부호로 모멘텀 국면을 결정적으로 분류한다.
 * 판정은 단기(1M) vs 장기(6M) 방향의 3×3 조합을 모두 덮는다(3M은 보조 서술용).
 * 점수·순위 계산과 무관한 표시 파생이며, 같은 입력이면 항상 같은 결과(순수·결정적).
 */
export function classifyMomentumRegime(returns?: MomentumReturns | null): MomentumRegime {
  const shortDir = dirOf(returns?.r1m);
  const midDirRaw = dirOf(returns?.r3m);
  const longDir = dirOf(returns?.r6m);

  // 단기·장기 중 하나라도 없으면 국면을 판정하지 않는다.
  if (shortDir === null || longDir === null) {
    return {
      key: "unavailable",
      shortDir: shortDir ?? "flat",
      midDir: midDirRaw ?? "flat",
      longDir: longDir ?? "flat",
      divergent: false,
    };
  }
  const midDir = midDirRaw ?? "flat";

  let key: MomentumRegimeKey;
  if (longDir === "up" && shortDir === "down") key = "longUpShortDown";
  else if (longDir === "down" && shortDir === "up") key = "longDownShortUp";
  else if (longDir === "flat" && shortDir === "flat") key = "sideways";
  else if (longDir !== "down" && shortDir !== "down" && (longDir === "up" || shortDir === "up"))
    key = "strengthening";
  else key = "weakening";

  const divergent = key === "longUpShortDown" || key === "longDownShortUp";
  return { key, shortDir, midDir, longDir, divergent };
}
