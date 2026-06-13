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

  // 6개월(약 126거래일) 수익률 — 수정주가·액면분할·합병 점검
  const pts = price?.points;
  if (pts && pts.length > 30) {
    const last = pts[pts.length - 1]?.c;
    const past = pts[Math.max(0, pts.length - 1 - 126)]?.c;
    if (last && past && past > 0) {
      const ret = (last - past) / past;
      if (Math.abs(ret) >= 1.5) {
        w.push(
          `6개월 수익률 ${ret >= 0 ? "+" : ""}${Math.round(ret * 100)}% — 수정주가·액면분할·합병 반영 여부 확인`,
        );
      }
    }
  }
  return w;
}
