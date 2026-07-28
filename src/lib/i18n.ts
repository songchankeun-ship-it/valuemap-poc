export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";
export const LANG_STORAGE_KEY = "ornscore.locale";
export const LANG_COOKIE = "ornscore_locale";

export function normalizeLocale(value: string | null | undefined): Locale {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "en" || normalized.startsWith("en-") ? "en" : "ko";
}

export type NavKey =
  | "today"
  | "stocks"
  | "disclosures"
  | "backtest"
  | "pricing"
  | "watchlist"
  | "compare"
  | "history"
  | "metricsGuide"
  | "about"
  | "more";

// 모바일 하단 바처럼 폭이 좁은 곳에서 쓰는 축약 라벨 키(설계서 §12.2).
// 데스크톱/드로어는 역할이 드러나는 긴 라벨(nav)을, 하단 바는 이 짧은 라벨(navShort)을 쓴다.
export type NavShortKey = "today" | "stocks" | "watchlist" | "disclosures";

export const commonCopy = {
  ko: {
    brand: "오른스코어",
    language: {
      label: "언어",
      ko: "KO",
      en: "EN",
      koFull: "한국어",
      enFull: "English",
    },
    nav: {
      // 역할이 드러나는 데스크톱/드로어 라벨(설계서 §12.1). 홈(로고), /today, /stocks 가
      // 서로 다른 단어로 구분되도록 "오늘 브리핑"/"종목 찾기"로 명시한다.
      today: "오늘 브리핑",
      stocks: "종목 찾기",
      disclosures: "공시",
      backtest: "검증 연구",
      pricing: "서비스 안내",
      watchlist: "관심종목",
      compare: "비교",
      history: "분석 기록",
      metricsGuide: "도움말",
      about: "서비스 소개",
      more: "더보기",
    },
    // 모바일 하단 바 축약 라벨(설계서 §12.2): 오늘 · 찾기 · 관심 · 공시.
    navShort: {
      today: "오늘",
      stocks: "찾기",
      watchlist: "관심",
      disclosures: "공시",
    },
    auth: {
      login: "로그인",
      start: "시작하기",
      // 로그아웃 상태의 1차 CTA — 목적지는 /login이지만 재방문 로그인과 구분되게 '동기화 의도'를 드러낸다(Slice J).
      syncStart: "관심종목 동기화",
      loginStart: "로그인 / 시작하기",
      loggedIn: "로그인 됨",
      logout: "로그아웃",
      accountMenu: "계정 메뉴",
      menuWatchlist: "관심 종목",
      menuCompare: "비교 목록",
      menuNotifications: "알림 설정",
      menuDataDeletion: "데이터 삭제 요청",
      loggingOut: "로그아웃 중...",
      syncCta: "로그인하고 여러 기기에서 동기화하기",
      syncLocalNote: "관심 종목은 지금 이 기기에 저장돼 있어요. 로그인하면 다른 기기에서도 이어집니다.",
      welcomeToast: {
        title: "로그인 완료!",
        body: "관심 종목과 비교 목록이 자동 동기화됩니다.",
        close: "닫기",
      },
    },
    chrome: {
      home: "홈",
      openMenu: "메뉴 열기",
      closeMenu: "메뉴 닫기",
      theme: "테마",
      beta: "베타",
      primaryNavLabel: "주요 메뉴",
      bottomNavLabel: "하단 바로가기",
      drawerNavLabel: "전체 메뉴",
      explorationNotice:
        "이 도구는 투자 추천이 아니라 탐색 우선순위를 정하는 분석 도구입니다.",
    },
    footer: {
      dataPrefix: "데이터",
      marketClose: "장마감",
      metricsPrefix: "산식",
      dataStatus: "데이터 상태",
      dataNormal: "정상",
      dataStale: "갱신 지연 확인",
      disclaimer: "오른스코어 — 투자 권유가 아닌 탐색 도구입니다",
      about: "서비스 소개",
      pricing: "베타 안내",
      terms: "이용약관",
      privacy: "개인정보",
      dataDeletion: "데이터 삭제",
      report: "오류 신고",
      betaFeedback: "베타 의견",
      code: "코드",
    },
    search: {
      placeholder: "종목명·코드 검색",
      placeholderHero: "종목명·코드 검색 (예: 삼성전자, 005930)",
      empty: "일치하는 종목이나 테마가 없습니다",
      emptyCoverageLine: (n: number) =>
        `오른스코어는 현재 약 ${n}개 종목만 분석 대상입니다. 전체 시장이 아니라 데이터 검증을 마친 종목부터 단계적으로 넓히고 있어요.`,
      emptyCoverageCta: "분석 대상 종목 둘러보기 →",
      emptyExamplesLabel: "이렇게 검색해볼 수 있어요",
      viewAllInList: (q: string) => `‘${q}’ 검색 결과 전체를 목록에서 보기 →`,
      scorePrefix: "종합",
      scoreAria: (score: number, label: string) => `종합 점수 ${score}점, ${label}`,
      theme: "테마",
      help: "↑↓ 이동 · Enter 선택 · Esc 닫기",
      countSuffix: "건",
    },
  },
  en: {
    brand: "OrnScore",
    language: {
      label: "Language",
      ko: "KO",
      en: "EN",
      koFull: "Korean",
      enFull: "English",
    },
    nav: {
      // Role-forward desktop/drawer labels (spec §12.1) so home, /today and
      // /stocks read as three distinct destinations.
      today: "Today briefing",
      stocks: "Find stocks",
      disclosures: "Disclosures",
      backtest: "Validation research",
      pricing: "Service info",
      watchlist: "Watchlist",
      compare: "Compare",
      history: "Analysis history",
      metricsGuide: "Help",
      about: "About",
      more: "More",
    },
    // Compact mobile bottom-bar labels (spec §12.2).
    navShort: {
      today: "Today",
      stocks: "Find",
      watchlist: "Saved",
      disclosures: "Filings",
    },
    auth: {
      login: "Log in",
      start: "Start",
      // Logged-out primary CTA — routes to /login but reads as sync intent, distinct from returning-user log in (Slice J).
      syncStart: "Sync watchlist",
      loginStart: "Log in / Start",
      loggedIn: "Signed in",
      logout: "Log out",
      accountMenu: "Account menu",
      menuWatchlist: "Watchlist",
      menuCompare: "Compare list",
      menuNotifications: "Notification settings",
      menuDataDeletion: "Data deletion",
      loggingOut: "Signing out...",
      syncCta: "Log in to sync across your devices",
      syncLocalNote: "Your watchlist is saved on this device for now. Log in to carry it over to your other devices.",
      welcomeToast: {
        title: "You're signed in!",
        body: "Your watchlist and comparison list now sync automatically.",
        close: "Dismiss",
      },
    },
    chrome: {
      home: "Home",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      theme: "Theme",
      beta: "Beta",
      primaryNavLabel: "Primary navigation",
      bottomNavLabel: "Bottom navigation",
      drawerNavLabel: "Full menu",
      explorationNotice:
        "OrnScore is an analysis tool for prioritizing research, not investment advice.",
    },
    footer: {
      dataPrefix: "Data",
      marketClose: "market close",
      metricsPrefix: "Formula",
      dataStatus: "Data status",
      dataNormal: "normal",
      dataStale: "delayed update",
      disclaimer: "OrnScore is an exploration tool, not investment advice",
      about: "About",
      pricing: "Beta info",
      terms: "Terms",
      privacy: "Privacy",
      dataDeletion: "Data deletion",
      report: "Report issue",
      betaFeedback: "Beta feedback",
      code: "Code",
    },
    search: {
      placeholder: "Search by name or code",
      placeholderHero: "Search by name or code (e.g. Samsung, 005930)",
      empty: "No matching stocks or themes",
      emptyCoverageLine: (n: number) =>
        `OrnScore currently analyzes about ${n} stocks — a curated set, not the whole market, expanding gradually as data is verified.`,
      emptyCoverageCta: "Browse covered stocks →",
      emptyExamplesLabel: "Try one of these",
      viewAllInList: (q: string) => `See all ‘${q}’ results in the list →`,
      scorePrefix: "Score",
      scoreAria: (score: number, label: string) => `Composite score ${score}, ${label}`,
      theme: "Theme",
      help: "↑↓ Move · Enter select · Esc close",
      countSuffix: " results",
    },
  },
} as const satisfies Record<Locale, unknown>;

export const homeHeroCopy = {
  ko: {
    badge: "오른스코어 · 무료 베타",
    dataPrefix: "데이터 기준",
    marketClose: "장마감",
    delayed: "갱신 지연",
    normal: "정상",
    titleBefore: "오른스코어로",
    titleAccent: "오늘 확인할 한국 주식 후보를",
    titleAfter: "줄여보세요.",
    description:
      "가격 흐름, 거래활성도, 밸류와 공시 신호를 함께 보고 왜 확인할 후보인지 정리합니다.",
    primaryCta: "오늘 후보 3개 보기",
    secondaryCta: "지표 이해하기",
    note: "투자 추천이 아니라 확인 순서를 돕는 탐색 도구입니다.",
    stockSearch: "종목명·코드 검색",
    browseAll: "전체 종목에서 찾기",
    searchLabel: "종목명 또는 코드로 바로 찾기",
    searchExamplePrefix: "예",
    searchCodeNote: "코드로도 검색",
    pulse: {
      ariaLabel: "오늘 시장 단면",
      title: "오늘 시장 단면",
      caption: "같은 장마감 데이터 기준",
      coverage: "분석 종목",
      strong: "종합 80+",
      activity: "거래활성도 급증",
      up: "상승 종목",
      unit: "개",
    },
    previewRelation: (strong: number, shown: number) =>
      `종합 80↑ ${strong}개 중 먼저 볼 ${shown}개`,
    previewTitle: "오늘 먼저 볼 후보",
    previewFilter: "검증 보류 제외",
    previewLead: "1번 후보",
    previewScoreLabel: "탐색점수",
    empty: "후보 데이터를 준비 중입니다.",
    kpiSignals: "공시 신호",
    kpiVolume: "거래활성도 급증",
    kpiStrong: "종합 80↑",
    footerPrefix: "분석 종목",
    footerSuffix: "개 · 영업일 장마감 후 자동 갱신 · 가격 Naver 전달/FDR · 공시 DART",
  },
  en: {
    badge: "OrnScore · Free beta",
    dataPrefix: "Data as of",
    marketClose: "market close",
    delayed: "delayed",
    normal: "normal",
    titleBefore: "OrnScore narrows the",
    titleAccent: "Korean stocks worth checking",
    titleAfter: "today.",
    description:
      "It reads price trend, trading activity, value and disclosure signals together to explain why a stock is worth checking.",
    primaryCta: "See today's 3 candidates",
    secondaryCta: "Understand metrics",
    note: "A research tool that helps you decide what to check next — not investment advice.",
    stockSearch: "Search by name or code",
    browseAll: "Find in all stocks",
    searchLabel: "Find any stock by name or code",
    searchExamplePrefix: "Try",
    searchCodeNote: "codes work too",
    pulse: {
      ariaLabel: "Today's market cross-section",
      title: "Today's market cross-section",
      caption: "One market-close data basis",
      coverage: "Analyzed",
      strong: "Composite 80+",
      activity: "Activity spikes",
      up: "Advancers",
      unit: "",
    },
    previewRelation: (strong: number, shown: number) =>
      `${shown} shown first of ${strong} scoring 80+`,
    previewTitle: "Candidates to check first",
    previewFilter: "Pending verification excluded",
    previewLead: "First candidate",
    previewScoreLabel: "ORNScore",
    empty: "Candidate data is being prepared.",
    kpiSignals: "Disclosure signals",
    kpiVolume: "Activity spikes",
    kpiStrong: "Composite 80+",
    footerPrefix: "Analyzed",
    footerSuffix: "stocks · Updated after market close · Price delivered via Naver/FDR · Disclosures via DART",
  },
} as const satisfies Record<Locale, unknown>;

export const welcomeOnboardingCopy = {
  ko: {
    toggle: "처음 사용 가이드 열기/닫기",
    mobileTitle: "처음 오셨어요? 3단계 가이드 보기",
    close: "안내 닫기",
    heading: "처음 오셨나요? 3단계로 사용해보세요",
    steps: [
      {
        title: "오늘의 후보 종목 보기",
        body: "여러 지표가 두루 좋은 상위 5개 종목부터 살펴보세요.",
        mobileBody: "여러 지표가 두루 좋은 상위 5개부터 확인",
      },
      {
        title: "지표 의미 이해하기",
        body: "점수 옆 (?)를 누르면 각 지표가 무슨 뜻인지 바로 볼 수 있어요.",
        mobileBody: "점수 옆 (?)로 각 지표가 무슨 뜻인지 보기",
      },
      {
        title: "알림 받기 (선택)",
        body: "관심 종목에 ❤를 누르면 새 공시 신호가 뜰 때 이메일로 알려드려요.",
        mobileBody: "관심 종목에 ❤ 등록 → 새 공시 신호 시 이메일",
      },
    ],
    notice:
      "⚠ 본 도구는 매수·매도 추천이 아니라 데이터 기반 탐색 우선순위를 제공합니다.",
    noticeLong:
      "⚠ 본 도구는 매수·매도 추천이 아니라 데이터 기반 탐색 우선순위를 제공합니다. 투자 결정은 본인이 직접.",
    go: "가기 →",
  },
  en: {
    toggle: "Open or close first-time guide",
    mobileTitle: "New here? See the 3-step guide",
    close: "Close guide",
    heading: "New to OrnScore? Start in 3 steps",
    steps: [
      {
        title: "View today's candidates",
        body: "Start with the top 5 stocks that score well across metrics.",
        mobileBody: "Start with the top 5 that score well overall",
      },
      {
        title: "Understand the metrics",
        body: "Tap the (?) beside a score to see what each metric means.",
        mobileBody: "Use the (?) beside scores to see what they mean",
      },
      {
        title: "Enable alerts (optional)",
        body: "Tap ❤ on a stock to get an email when new disclosure signals appear.",
        mobileBody: "Save stocks → get email when new disclosure signals appear",
      },
    ],
    notice:
      "⚠ OrnScore provides data-based research priorities, not buy or sell recommendations.",
    noticeLong:
      "⚠ OrnScore provides data-based research priorities, not buy or sell recommendations. Investment decisions are yours.",
    go: "Go →",
  },
} as const satisfies Record<Locale, unknown>;

export const loginCopy = {
  ko: {
    backHome: "홈으로",
    backPrevious: "이전 페이지로",
    title: "관심종목과 기록을 여러 기기에서 이어보세요",
    emailOnlyLead: "로그인 없이도 공개 탐색과 이 기기 저장(관심·비교)은 그대로 돼요. 이메일로 로그인 링크를 받으세요.",
    lead: (providers: string) =>
      `로그인 없이도 공개 탐색과 이 기기 저장(관심·비교)은 그대로 돼요. ${providers}로 시작하거나 이메일로 로그인 링크를 받으세요.`,
    contexts: {
      "/history": "요약 기록을 보려면 로그인하세요. 로그인 후 자동으로 돌아갑니다.",
      "/watchlist": "관심 종목을 여러 기기에서 이어보려면 로그인하세요.",
      "/compare": "비교 목록을 저장하려면 로그인하세요.",
      "/settings/notifications": "알림을 설정하려면 로그인하세요.",
    },
    contextFallback: "로그인하면 저장한 관심 종목·탐색 상태가 그대로 유지되고, 로그인 후 보던 화면으로 다시 돌아갑니다.",
    sentTitle: "로그인 링크를 보냈어요",
    sentBodyPrefix: "",
    sentBodySuffix: "로 메일을 발송했습니다. 메일함에서 링크를 클릭하면 자동으로 로그인됩니다.",
    spam: "메일이 오지 않으면 스팸함을 확인해주세요.",
    plannedTitle: "설정이 필요한 로그인 방식이에요",
    plannedNote: "준비 중",
    legalPrefix: "계속하면",
    legalTerms: "이용약관",
    legalAnd: "과 ",
    legalPrivacy: "개인정보처리방침",
    legalSuffix: "에 동의하게 됩니다.",
    or: "또는",
    emailLabel: "이메일 주소",
    emailHelp: "이 주소로 로그인 링크를 보내드립니다.",
    sending: "발송 중...",
    getLink: "로그인 링크 받기",
    noAds: "로그인 링크 외에 광고성 메일은 보내지 않습니다.",
    noAdsSecond: "알림 메일도 사용자가 직접 설정할 때만 발송됩니다.",
    benefitsTitle: "로그인하면 가능해요",
    benefitsLocalNote: "관심 종목·비교·저장 필터는 로그인 없이 지금 이 기기에서 바로 돼요. 로그인은 이 기록을 여러 기기·알림으로 넓혀줘요:",
    benefits: [
      "관심 종목을 여러 기기에서 이어보기",
      "비교 목록 저장하기",
      "관심 종목 공시 알림 받기",
    ],
    loading: "로딩 중...",
    providers: {
      kakao: { name: "카카오", label: "카카오로 시작하기", redirecting: "카카오로 이동 중..." },
      google: { name: "구글", label: "구글로 시작하기", redirecting: "구글로 이동 중..." },
      "custom:naver": { name: "네이버", label: "네이버로 시작하기", redirecting: "네이버로 이동 중..." },
      apple: { name: "Apple", label: "Apple로 시작하기", redirecting: "Apple로 이동 중..." },
    },
    errors: {
      noCode: "앱에서 로그인 후 돌아오지 못했어요. 다시 시도하거나 브라우저에서 로그인해 주세요.",
      callback: "로그인 처리 중 문제가 발생했어요. 다시 시도해 주세요.",
      provider: "현재 이 로그인 방식은 설정 중이에요. 카카오·구글 또는 이메일로 로그인해 주세요.",
      rateLimit: "요청이 많아요. 잠시 후 다시 시도해 주세요.",
      invalidEmail: "이메일 주소를 다시 확인해 주세요.",
      unknown: "로그인 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.",
    },
  },
  en: {
    backHome: "Home",
    backPrevious: "Previous page",
    title: "Keep your watchlist and history across devices",
    emailOnlyLead: "Public exploration and on-device saving (watchlist, compare) stay open without login. Get a sign-in link by email.",
    lead: (providers: string) =>
      `Public exploration and on-device saving stay open without login. Start with ${providers}, or get a sign-in link by email.`,
    contexts: {
      "/history": "Log in to view saved summaries. You will return here after signing in.",
      "/watchlist": "Log in to keep your watchlist synced across devices.",
      "/compare": "Log in to save comparison lists.",
      "/settings/notifications": "Log in to manage notifications.",
    },
    contextFallback: "Log in to keep your saved watchlist and exploration state, and you'll return to where you were.",
    sentTitle: "Sign-in link sent",
    sentBodyPrefix: "We sent an email to ",
    sentBodySuffix: ". Click the link in your inbox to sign in automatically.",
    spam: "If you do not see it, check your spam folder.",
    plannedTitle: "This sign-in method still needs setup.",
    plannedNote: "Setup needed",
    legalPrefix: "By continuing, you agree to the",
    legalTerms: "Terms",
    legalAnd: " and ",
    legalPrivacy: "Privacy Policy",
    legalSuffix: ".",
    or: "or",
    emailLabel: "Email address",
    emailHelp: "We'll send a sign-in link to this address.",
    sending: "Sending...",
    getLink: "Get sign-in link",
    noAds: "We do not send promotional email just because you sign in.",
    noAdsSecond: "Notification email is sent only when you explicitly enable it.",
    benefitsTitle: "With login, you can",
    benefitsLocalNote: "Watchlist, compare, and saved filters already work on this device without login. Login extends them across devices and to alerts:",
    benefits: [
      "Keep your watchlist across devices",
      "Save comparison lists",
      "Get watchlist disclosure alerts when enabled",
    ],
    loading: "Loading...",
    providers: {
      kakao: { name: "Kakao", label: "Continue with Kakao", redirecting: "Redirecting to Kakao..." },
      google: { name: "Google", label: "Continue with Google", redirecting: "Redirecting to Google..." },
      "custom:naver": { name: "Naver", label: "Continue with Naver", redirecting: "Redirecting to Naver..." },
      apple: { name: "Apple", label: "Continue with Apple", redirecting: "Redirecting to Apple..." },
    },
    errors: {
      noCode: "The app could not return after sign-in. Try again or sign in from the browser.",
      callback: "Something went wrong while completing sign-in. Please try again.",
      provider: "This sign-in method is still being configured. Try Kakao, Google, or email.",
      rateLimit: "Too many requests. Please try again shortly.",
      invalidEmail: "Please check the email address.",
      unknown: "Something went wrong while signing in. Please try again shortly.",
    },
  },
} as const satisfies Record<Locale, unknown>;

// ── not-found.tsx (404) ──
// 없는 경로/분석 풀(138종목) 밖 종목일 때의 폴백. 매수/매도/추천/수익 표현 없음.
export const notFoundCopy = {
  ko: {
    title: "페이지를 찾을 수 없습니다",
    body1: "존재하지 않거나 분석 풀(138개 종목)에 포함되지 않은 종목일 수 있어요.",
    body2: "URL을 다시 확인하거나 종목 탐색에서 검색해보세요.",
    browseStocks: "종목 탐색",
    goHome: "홈으로",
  },
  en: {
    title: "Page not found",
    body1: "This may be a page that doesn't exist, or a stock outside the analysis pool (138 stocks).",
    body2: "Check the URL again, or search from stock explorer.",
    browseStocks: "Browse stocks",
    goHome: "Home",
  },
} as const satisfies Record<Locale, unknown>;

// ── offline/page.tsx (네트워크 필요 안내 · 설계서 PART H §24) ──
export const offlineCopy = {
  ko: {
    title: "네트워크가 필요해요",
    body: "오른스코어의 점수·공시·재무 데이터는 최신 상태를 불러오기 위해 인터넷 연결이 필요합니다. 연결을 확인한 뒤 다시 시도해주세요.",
    hint: "일부 화면은 마지막으로 저장된 데이터가 잠시 보일 수 있으나, 실제 기준일·시세와 다를 수 있습니다.",
    addTitle: "홈 화면에 추가",
    addBodyBefore: "모바일 브라우저 메뉴에서 ",
    addBodyStrong: "홈 화면에 추가",
    addBodyAfter:
      "(iOS: 공유 → 홈 화면에 추가 / Android: 메뉴 → 앱 설치)를 선택하면 앱처럼 실행할 수 있어요.",
    addNote:
      "홈 화면에 추가해도 실행은 더 빨라질 뿐, 점수·시세 데이터는 열 때마다 연결이 필요해요. 아직 오프라인 저장은 지원하지 않습니다.",
    retryButton: "다시 시도",
    homeButton: "홈으로 돌아가기",
  },
  en: {
    title: "You're offline",
    body: "OrnScore's score, disclosure, and financial data need an internet connection to load the latest state. Check your connection and try again.",
    hint: "Some screens may briefly show the last saved data, which can differ from the actual as-of date and prices.",
    addTitle: "Add to home screen",
    addBodyBefore: "In your mobile browser menu, choose ",
    addBodyStrong: "Add to Home Screen",
    addBodyAfter:
      " (iOS: Share → Add to Home Screen / Android: Menu → Install app) to launch it like an app.",
    addNote:
      "Adding to the home screen only makes launching faster — score and price data still need a connection each time you open it. Offline storage isn't supported yet.",
    retryButton: "Try again",
    homeButton: "Back to home",
  },
} as const satisfies Record<Locale, unknown>;

// ── error.tsx (route-segment 에러 바운더리 폴백) ──
// 렌더/데이터 표시 중 예기치 못한 예외가 던져졌을 때의 안내. 데이터 자체는 안전하며
// 일시적 표시 오류임을 차분히 전달한다. 매수/매도/추천/수익 등 금칙 표현 없음(시스템 상태 안내만).
export const errorCopy = {
  ko: {
    title: "일시적인 문제가 발생했어요",
    body1: "데이터는 안전하며, 화면을 그리는 중 일시적인 오류가 발생했어요.",
    body2: "잠시 후 다시 시도하면 대부분 정상적으로 표시됩니다.",
    retry: "다시 시도",
    goHome: "홈으로",
    persistHint: "문제가 계속되면 잠시 후 다시 시도하거나 새로고침해주세요.",
  },
  en: {
    title: "Something went wrong for a moment",
    body1: "Your data is safe — this is a temporary error while rendering the screen.",
    body2: "Trying again in a moment usually resolves it.",
    retry: "Try again",
    goHome: "Home",
    persistHint: "If it keeps happening, please try again shortly or refresh the page.",
  },
} as const satisfies Record<Locale, unknown>;
