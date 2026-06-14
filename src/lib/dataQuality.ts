// 데이터 품질 경고 — 극단값(수정주가/일회성 이익/자본 왜곡 등) 런타임 감지.
// 데이터 재생성 없이 종목 상세에서 사용자에게 '점검 필요'를 투명하게 안내.
import type { PriceHistory } from "./priceHistory";

export interface QualityInput {
  per: number;
  pbr: number;
  roe: number;
}

/** 종목의 극단값/이상치 경고 목록 반환 (없으면 빈 배열) */
export function getDataWarnings(s: QualityInput, price?: PriceHistory | null): string[] {
  const w: string[] = [];

  if (s.per > 0 && s.per < 1) {
    w.push("PER 1배 미만 — 일회성 이익·자산 재평가 영향일 수 있어 본문 확인 필요");
  } else if (s.per >= 300) {
    w.push("PER 300배 이상 — 이익이 미미해 밸류 해석에 주의");
  }
  if (s.roe >= 80) {
    w.push("ROE 80% 이상 — 일회성 손익·자본 왜곡 가능성 확인");
  }
  if (s.pbr >= 20) {
    w.push("PBR 20배 이상 — 고평가 또는 자본 잠식 여부 확인");
  }

  // 단일일 급변(±32% 초과) 탐지 — 한국 상·하한가 ±30%를 넘는 하루 점프는
  // 액면분할·병합·미수정주가 신호. 누적 상승률만으로는 경고하지 않는다(실제 강세일 수 있음).
  const pts = price?.points;
  if (pts && pts.length > 30) {
    let maxJump = 0;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]?.c;
      const cur = pts[i]?.c;
      if (prev && cur && prev > 0) {
        const ch = cur / prev - 1;
        if (Math.abs(ch) > Math.abs(maxJump)) maxJump = ch;
      }
    }
    if (Math.abs(maxJump) > 0.32) {
      w.push(
        `하루 ${maxJump >= 0 ? "+" : ""}${Math.round(maxJump * 100)}% 급변 — 액면분할·병합 미반영 가능성, 수정주가 확인 필요`,
      );
    }
  }
  return w;
}

/** 데이터 완성도(%) — 핵심 필드가 얼마나 채워졌는지. 결측 많으면 점수 신뢰도↓를 투명하게. */
export function dataCompleteness(
  s: { per: number; pbr: number; roe: number; marketCap: number; currentPrice: number },
  price?: PriceHistory | null,
): number {
  const checks = [
    s.per > 0,
    s.pbr > 0,
    s.roe !== 0,
    s.marketCap > 0,
    s.currentPrice > 0,
    !!(price?.points && price.points.length >= 120),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

/** 풀 레벨 이상치 판정(stocks.json 필드만으로) — Top/오늘 후보에서 제외용.
 *  누적수익률(r6m)은 제외: 실제 강세주(삼성·SK 등)를 오탐하던 문제. 분할 아티팩트는
 *  종목 상세에서 가격 시계열의 단일일 급변(getDataWarnings)으로 별도 감지한다. */
export function isSuspect(s: { per: number; pbr: number; roe: number }): boolean {
  if (s.per > 0 && s.per < 1) return true;
  if (s.per >= 300) return true;
  if (s.roe >= 80) return true;
  if (s.pbr >= 20) return true;
  return false;
}
