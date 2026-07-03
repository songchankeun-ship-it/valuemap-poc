// 숫자 표시 포맷 공통 유틸 — 전 화면 동일 규칙으로 통일.
// 직접 toLocaleString/toFixed 쓰지 말고 여기 함수를 쓸 것.

import type { Locale } from "@/lib/i18n";

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

/**
 * 상대 시각 표기. 최근 본 종목·요약 기록 등 "언제였는지" 표시를 한곳으로 통일한다.
 * - `input`: 밀리초 숫자 또는 파싱 가능한 날짜 문자열(ISO 등). 비정상값은 — 반환.
 * - ko: 방금 전 / N분 전 / N시간 전 / N일 전, en: just now / Nm ago / Nh ago / Nd ago.
 * - 7일 이상이면 `absolute`에 따라 `toLocaleDateString`으로 폴백("md"=월/일, "ymd"=연/월/일).
 */
export function fmtRelativeTime(
  input: number | string,
  opts: { locale?: Locale; absolute?: "md" | "ymd" } = {},
): string {
  const { locale = "ko", absolute = "md" } = opts;
  const ms = new Date(input).getTime();
  if (!Number.isFinite(ms)) return DASH; // Invalid Date 방어
  const isEn = locale === "en";
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 1) return isEn ? "just now" : "방금 전";
  if (min < 60) return isEn ? `${min}m ago` : `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return isEn ? `${hr}h ago` : `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return isEn ? `${day}d ago` : `${day}일 전`;
  const dateOpts: Intl.DateTimeFormatOptions =
    absolute === "ymd"
      ? { year: "numeric", month: "short", day: "numeric" }
      : { month: "short", day: "numeric" };
  return new Date(ms).toLocaleDateString(isEn ? "en-US" : "ko-KR", dateOpts);
}
