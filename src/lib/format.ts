// 숫자 표시 포맷 공통 유틸 — 전 화면 동일 규칙으로 통일.
// 직접 toLocaleString/toFixed 쓰지 말고 여기 함수를 쓸 것.

const DASH = "—";

/** 가격(원). 정수 반올림 + 천단위 콤마. 0·비정상값은 — */
export function fmtWon(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return DASH;
  return Math.round(n).toLocaleString("ko-KR") + "원";
}

/** 시가총액(raw 원 단위) → 1조 이상 'X.X조원', 미만 'N억원'. */
export function fmtMarketCap(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return DASH;
  const jo = n / 1_000_000_000_000;
  if (jo >= 1) return jo.toFixed(1) + "조원";
  const eok = n / 100_000_000;
  return Math.round(eok).toLocaleString("ko-KR") + "억원";
}

/** 퍼센트. signed=true면 양수에 + 부호. */
export function fmtPct(n: number, digits = 1, signed = false): string {
  if (!Number.isFinite(n)) return DASH;
  const v = n.toFixed(digits);
  return signed && n > 0 ? "+" + v + "%" : v + "%";
}

/** 배수(PER·PBR 등). */
export function fmtMultiple(n: number, digits = 1): string {
  if (!Number.isFinite(n) || n <= 0) return DASH;
  return n.toFixed(digits) + "배";
}

/** 점수(정수 반올림). */
export function fmtScore(n: number): string {
  if (!Number.isFinite(n)) return DASH;
  return String(Math.round(n));
}
