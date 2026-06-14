// 종합점수 단일 공식 — 전 화면 동일 값 보장.
// stocks.json의 저장 compositeScore는 지표 재계산과 어긋날 수 있어,
// 표시·순위는 항상 현재 4지표 평균을 쓴다.

export interface ScoreParts {
  momentum: number;
  flow: number;
  value: number;
  vol: number;
}

/** 종합점수 원값(반올림 전). 4지표 단순평균. */
export function compositeOf(s: ScoreParts): number {
  return (s.momentum + s.flow + s.value + s.vol) / 4;
}
