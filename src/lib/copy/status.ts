/**
 * 다국어 v2 — /status 페이지 및 데이터 상태 표시 표면의 "크롬"(페이지 제목/섹션 헤딩/소스 행 이름/푸터/신고 문구) 문구.
 * 클라이언트 컴포넌트가 stocks.json 번들 없이 읽도록 데이터 파생 문자열과 분리한다.
 * 데이터 파생값(상태 라벨·도메인 상태·출처 사용처·제한·고지·자동 점검 수치)은 dataStatus.ts의 dataStatusByLocale에서 온다.
 * ko = 화면 그대로(verbatim), en = 충실 번역. 금융 문구는 양쪽 모두 보수적·비자문(투자 추천 아님).
 * 출처/제품명(KRX·Naver·DART·FinanceDataReader·Supabase·GitHub Actions·daily_scores)·날짜·숫자·산식 버전 표기는 원형 유지.
 */
import type { Locale } from "@/lib/i18n";

/** /status 페이지 본문 크롬 — 헤더/스냅샷/섹션 헤딩/소스 행 이름·상세/푸터. */
export const statusCopy = {
  ko: {
    backHome: "← 홈으로",
    pageTitle: "데이터 상태",
    pageSubtitle: "파이프라인 신선도와 데이터 소스 상태를 투명하게 공개합니다.",

    // 인페이지 목차(TOC)
    toc: {
      snapshot: "스냅샷",
      domains: "종류별 상태",
      limits: "알려진 제한",
      selfcheck: "자동 점검",
      sources: "데이터 소스",
      report: "오류 신고",
    },

    // 스냅샷 섹션
    snapshotHeading: "현재 데이터 스냅샷",
    snapshotOk: "정상",
    snapshotStale: "갱신 지연 가능",
    snapshotPriceDate: "가격 기준일",
    snapshotScoreTime: "점수 계산 시각",
    snapshotMetricsVersion: "산식 버전",
    snapshotUniverse: "분석 대상",
    daysAgo: (n: number) => ` (${n}일 전)`,
    stocksUnit: (n: number) => `${n}종목`,
    snapshotNotePrefix:
      "가격·점수는 마지막 배치 기준이고, 공시는 페이지를 열 때 DART에서 라이브 조회합니다. 산식 버전은 코드 기대값(",
    snapshotNoteMid: ")과 ",
    snapshotMatch: "일치합니다",
    snapshotMismatch: "불일치 — 점검이 필요합니다",
    snapshotNoteSuffix: ".",
    scoreTimeBatchNote: "장마감 후 배치",
    scoreTimeUtcLabel: "원본 배치",
    dataCadenceNote:
      "가격·점수 데이터는 한국거래소 영업일 장마감 후 갱신되며, 주말·휴장일에는 마지막 정상 영업일 데이터가 유지됩니다.",

    // 데이터 종류별 상태
    domainsHeading: "데이터 종류별 상태",
    domainsChangelogPrefix: "산식이 바뀌면 ",
    domainsChangelogLink: "산식 변경 이력",
    domainsChangelogSuffix: "에 기록합니다.",

    // 알려진 제한
    limitsHeading: "알려진 제한",

    // 최근 자동 점검
    selfcheckHeading: "최근 자동 점검 요약",
    selfcheckSuspect: "검증 보류 종목",
    selfcheckSuspectNote: "Top·오늘 후보에서 제외",
    selfcheckMissing: "PER·PBR 결측",
    selfcheckMissingNote: "밸류 해석 신뢰도 낮음",
    selfcheckVersion: "산식 버전 일치",
    selfcheckMatch: "일치",
    selfcheckMismatch: "불일치",
    selfcheckVersionNote: (v: string) => `${v} 기준`,
    selfcheckFootnote:
      "이 수치는 현재 빌드에 포함된 데이터 풀에서 즉시 계산한 값입니다. 현재는 배포 시점 기준의 스냅샷 점검 결과를 제공하며, 점검 이력과 재수집 상태도 앞으로 단계적으로 공개할 예정입니다.",

    // 데이터 소스
    sourcesHeading: "데이터 소스",
    sources: {
      price: { name: "가격·지표 (FinanceDataReader)", detail: "GitHub Actions 매일 평일 자동 갱신" },
      quote: { name: "현재가 (네이버 지연 시세)", detail: "페이지 열 때 실시간 조회 (참고용)" },
      disclosure: { name: "공시 (DART)", detail: "라이브 조회 (DART_API_KEY 필요)" },
      alert: {
        name: "KRX 시장경보",
        detailActive: (n: number) => `활성 ${n}종목`,
        detailIdle: "보류 — 무료 공식 소스 없음(인프라만 준비)",
      },
      scores: { name: "점수 변화 (Supabase daily_scores)", detail: "장 마감 후 cron 저장" },
    },

    // 푸터 + 하단 링크
    footerNote:
      "데이터는 평일마다 장 마감 후 클라우드(GitHub Actions)에서 자동 갱신됩니다. 갱신 실패 시 직전 정상 데이터가 유지되며, 새 데이터는 자동 검증(정합성·브랜드)을 통과한 경우에만 반영됩니다. 모든 점수·순위는 종가 기준이며 투자 추천이 아닙니다.",
    linkMetricsGuide: "지표 계산 방식 보기 →",
    linkChangelog: "산식 변경 이력 →",
  },
  en: {
    backHome: "← Home",
    pageTitle: "Data status",
    pageSubtitle: "We transparently disclose pipeline freshness and data-source status.",

    toc: {
      snapshot: "Snapshot",
      domains: "Status by type",
      limits: "Known limits",
      selfcheck: "Self-check",
      sources: "Data sources",
      report: "Report issue",
    },

    snapshotHeading: "Current data snapshot",
    snapshotOk: "Normal",
    snapshotStale: "Update may be delayed",
    snapshotPriceDate: "Price as of",
    snapshotScoreTime: "Score computed at",
    snapshotMetricsVersion: "Formula version",
    snapshotUniverse: "Coverage",
    daysAgo: (n: number) => ` (${n} days ago)`,
    stocksUnit: (n: number) => `${n} stocks`,
    snapshotNotePrefix:
      "Prices and scores are from the last batch; disclosures are fetched live from DART when the page opens. The formula version ",
    snapshotNoteMid: " the code's expected value (",
    snapshotMatch: "matches",
    snapshotMismatch: "does not match — review needed",
    snapshotNoteSuffix: ").",
    scoreTimeBatchNote: "after market-close batch",
    scoreTimeUtcLabel: "Source batch",
    dataCadenceNote:
      "Price/score data updates after KRX market close on business days; on weekends/holidays the last business-day data is carried forward.",

    domainsHeading: "Status by data type",
    domainsChangelogPrefix: "When the formula changes, we record it in the ",
    domainsChangelogLink: "formula changelog",
    domainsChangelogSuffix: ".",

    limitsHeading: "Known limits",

    selfcheckHeading: "Latest self-check summary",
    selfcheckSuspect: "Pending-verification stocks",
    selfcheckSuspectNote: "Excluded from Top and today's candidates",
    selfcheckMissing: "PER·PBR missing",
    selfcheckMissingNote: "Lower confidence in valuation reading",
    selfcheckVersion: "Formula version match",
    selfcheckMatch: "Match",
    selfcheckMismatch: "Mismatch",
    selfcheckVersionNote: (v: string) => `as of ${v}`,
    selfcheckFootnote:
      "These figures are computed instantly from the data pool included in the current build. For now we provide deploy-time snapshot check results, and we plan to progressively disclose check history and re-collection status over time.",

    sourcesHeading: "Data sources",
    sources: {
      price: { name: "Price · metrics (FinanceDataReader)", detail: "Auto-updated every weekday via GitHub Actions" },
      quote: { name: "Current price (Naver delayed quote)", detail: "Fetched live on page load (reference only)" },
      disclosure: { name: "Disclosures (DART)", detail: "Live query (DART_API_KEY required)" },
      alert: {
        name: "KRX market alerts",
        detailActive: (n: number) => `${n} stocks active`,
        detailIdle: "On hold — no free official source (infrastructure only)",
      },
      scores: { name: "Score changes (Supabase daily_scores)", detail: "Saved via cron after market close" },
    },

    footerNote:
      "Data is auto-updated in the cloud (GitHub Actions) after market close on weekdays. If an update fails, the last good data is kept, and new data is applied only after passing automated checks (consistency and branding). All scores and rankings are based on closing prices and are not investment advice.",
    linkMetricsGuide: "See how metrics are calculated →",
    linkChangelog: "Formula changelog →",
  },
} as const satisfies Record<Locale, unknown>;

/** 데이터 오류 신고 진입점(ReportDataIssue) 크롬 — 헤딩/체크리스트 안내/버튼/저장 안내. */
export const reportIssueCopy = {
  ko: {
    heading: "데이터 오류 신고",
    intro:
      "가격·재무·공시·점수에서 잘못된 값이나 분류 오류를 발견하면 알려주세요. 아래 정보를 함께 적어주시면 확인이 빠릅니다.",
    mailButton: "메일로 신고하기",
    autofillPrefix: "메일 본문에 현재 데이터 기준일(",
    autofillMid: ")·산식(",
    autofillSuffix: ")이 자동으로 채워집니다.",
    storeNote:
      "앱 내 신고 저장을 시도하고, 저장이 안 되면 위 메일로 안내합니다. 접수된 신고는 관리자가 데이터 상태를 확인합니다.",
  },
  en: {
    heading: "Report a data issue",
    intro:
      "If you find an incorrect value or misclassification in price, financial, disclosure, or score data, let us know. Including the details below helps us verify faster.",
    mailButton: "Report by email",
    autofillPrefix: "The email body is auto-filled with the current data reference date (",
    autofillMid: ") and formula (",
    autofillSuffix: ").",
    storeNote:
      "In-app reports are saved when possible; if saving fails, you'll be directed to the email above. Submitted reports are reviewed by an administrator.",
  },
} as const satisfies Record<Locale, unknown>;

/** 데이터 오류 신고 인앱 폼(ReportDataIssueForm) 크롬 — 라벨/상태/버튼/플레이스홀더. */
export const reportFormCopy = {
  ko: {
    openButton: "앱에서 바로 신고하기 (선택) →",
    successTitle: "신고가 접수됐어요. 확인 후 반영하겠습니다. 감사합니다.",
    categoryLabel: "분류",
    categories: {
      price: "가격·거래량",
      financial: "재무(PER·PBR·ROE)",
      disclosure: "공시",
      score: "점수·순위",
      sector: "업종 분류",
      other: "기타",
    },
    tickerLabel: "종목명·코드 (선택)",
    tickerPlaceholder: "예: 삼성전자 005930",
    messageLabel: "내용",
    messagePlaceholder: "어떤 값이 어떻게 잘못됐는지 적어주세요.",
    emailLabel: "회신용 이메일 (선택)",
    emailPlaceholder: "답변이 필요하면 입력",
    submit: "신고 보내기",
    submitting: "보내는 중…",
    close: "닫기",
    errorTooShort: "신고 내용을 5자 이상 적어주세요.",
    errorSaveFail: "저장에 실패했어요. 위 메일 버튼으로 신고해주세요.",
    errorNetwork: "네트워크 오류예요. 위 메일 버튼으로 신고해주세요.",
    footnote: (asOf: string, version: string) =>
      `기준일 ${asOf} · 산식 ${version}이(가) 함께 저장됩니다. 저장이 안 되면 위 메일 버튼으로 신고해주세요.`,
  },
  en: {
    openButton: "Report directly in the app (optional) →",
    successTitle: "Your report was received. We'll review and apply it. Thank you.",
    categoryLabel: "Category",
    categories: {
      price: "Price · volume",
      financial: "Financial (PER·PBR·ROE)",
      disclosure: "Disclosure",
      score: "Score · ranking",
      sector: "Sector classification",
      other: "Other",
    },
    tickerLabel: "Stock name · code (optional)",
    tickerPlaceholder: "e.g., Samsung Electronics 005930",
    messageLabel: "Details",
    messagePlaceholder: "Describe which value is wrong and how.",
    emailLabel: "Reply email (optional)",
    emailPlaceholder: "Enter if you'd like a reply",
    submit: "Send report",
    submitting: "Sending…",
    close: "Close",
    errorTooShort: "Please write at least 5 characters.",
    errorSaveFail: "Saving failed. Please report via the email button above.",
    errorNetwork: "Network error. Please report via the email button above.",
    footnote: (asOf: string, version: string) =>
      `Data as of ${asOf} · formula ${version} is saved with your report. If saving fails, please use the email button above.`,
  },
} as const satisfies Record<Locale, unknown>;

/** 홈 RiskNotice 크롬 — 헤딩 + 3개 카드 제목(본문은 dataStatus.notices.disclaimer에서 온다). */
export const riskNoticeCopy = {
  ko: {
    heading: "투자 추천 아님 · 탐색 도구 고지",
    titles: ["투자 추천이 아닙니다", "점수·신호는 참고 정보입니다", "최종 판단은 사용자 책임입니다"],
  },
  en: {
    heading: "Not investment advice · exploration-tool notice",
    titles: [
      "This is not investment advice",
      "Scores and signals are reference information",
      "The final decision is the user's responsibility",
    ],
  },
} as const satisfies Record<Locale, unknown>;

/** 오늘 페이지 상단 데이터 상태 바(TodayStatusBar) 크롬 — 필드 라벨 + 고정 문구. */
export const todayStatusBarCopy = {
  ko: {
    ariaLabel: "데이터 상태",
    dataStatus: "데이터 상태",
    priceBasis: "주가 기준",
    marketClose: "장마감",
    disclosureBasis: "공시 기준",
    recentUpdate: "최근 업데이트",
    metricsVersion: "산식 버전",
  },
  en: {
    ariaLabel: "Data status",
    dataStatus: "Data status",
    priceBasis: "Price as of",
    marketClose: "market close",
    disclosureBasis: "Disclosure as of",
    recentUpdate: "Recently updated",
    metricsVersion: "Formula version",
  },
} as const satisfies Record<Locale, unknown>;
