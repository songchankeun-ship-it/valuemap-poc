/**
 * 다국어 v2 — 데이터 신뢰 레이어의 "크롬"(UI 칩/제목/버튼) 문구.
 * 클라이언트 컴포넌트가 stocks.json 번들 없이 읽도록 데이터 파생 문자열과 분리한다.
 * 데이터 파생값(상태 라벨·출처 사용처·제한·고지)은 dataStatus.ts의 dataStatusByLocale에서 온다.
 */
import type { Locale } from "@/lib/i18n";

/** DataTrustModal / DataTrustBar 내부 정적 라벨. */
export const trustModalCopy = {
  ko: {
    trigger: "데이터 기준 보기",
    title: "데이터 기준과 출처",
    close: "닫기",
    secDate: "기준일",
    secSources: "출처",
    secMetrics: "산식",
    secStatus: "상태",
    secLimits: "제한",
    secNotice: "투자 고지",
    priceBasis: "가격·점수 기준일",
    metricsApplied: "적용",
    metricsDesc: "현재 운영 중인 지표 계산식 버전입니다.",
    marketClose: "장마감",
  },
  en: {
    trigger: "Data basis",
    title: "Data basis & sources",
    close: "Close",
    secDate: "As of",
    secSources: "Sources",
    secMetrics: "Formula",
    secStatus: "Status",
    secLimits: "Limits",
    secNotice: "Disclaimer",
    priceBasis: "Price · score as of",
    metricsApplied: "applied",
    metricsDesc: "The metric formula version currently in operation.",
    marketClose: "market close",
  },
} as const satisfies Record<Locale, unknown>;

/** 앱 헤더 하단 데이터 상태 바 + 종목 수 칩. */
export const headerBarCopy = {
  ko: {
    dataBasis: "데이터 기준일",
    marketClose: "장마감",
    preparing: "데이터 준비 중",
    bizDaysAgo: (n: number) => `· ${n}영업일 전`,
    stocksCount: (n: number) => `${n}개 종목`,
  },
  en: {
    dataBasis: "Data as of",
    marketClose: "market close",
    preparing: "Data being prepared",
    bizDaysAgo: (n: number) => `· ${n} business days ago`,
    stocksCount: (n: number) => `${n} stocks`,
  },
} as const satisfies Record<Locale, unknown>;
