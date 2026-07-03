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
      today: "오늘",
      stocks: "종목 찾기",
      disclosures: "공시 신호",
      backtest: "백테스트",
      pricing: "베타 안내",
      watchlist: "관심 종목",
      compare: "비교",
      history: "분석 기록",
      metricsGuide: "지표 가이드",
      about: "서비스 소개",
      more: "더보기",
    },
    auth: {
      login: "로그인",
      start: "시작하기",
      loginStart: "로그인 / 시작하기",
      loggedIn: "로그인 됨",
      logout: "로그아웃",
      accountMenu: "계정 메뉴",
      menuWatchlist: "관심 종목",
      menuCompare: "비교 목록",
      menuNotifications: "알림 설정",
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
      report: "오류 신고",
      code: "코드",
    },
    search: {
      placeholder: "종목·테마 검색",
      empty: "일치하는 종목이나 테마가 없습니다",
      emptyCoverageLine: (n: number) =>
        `오른스코어는 현재 약 ${n}개 종목만 분석 대상입니다. 전체 시장이 아니라 데이터 검증을 마친 종목부터 단계적으로 넓히고 있어요.`,
      emptyCoverageCta: "분석 대상 종목 둘러보기 →",
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
      today: "Today",
      stocks: "Find stocks",
      disclosures: "Disclosures",
      backtest: "Backtest",
      pricing: "Beta info",
      watchlist: "Watchlist",
      compare: "Compare",
      history: "Analysis history",
      metricsGuide: "Metric guide",
      about: "About",
      more: "More",
    },
    auth: {
      login: "Log in",
      start: "Start",
      loginStart: "Log in / Start",
      loggedIn: "Signed in",
      logout: "Log out",
      accountMenu: "Account menu",
      menuWatchlist: "Watchlist",
      menuCompare: "Compare list",
      menuNotifications: "Notification settings",
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
      report: "Report issue",
      code: "Code",
    },
    search: {
      placeholder: "Search stocks or themes",
      empty: "No matching stocks or themes",
      emptyCoverageLine: (n: number) =>
        `OrnScore currently analyzes about ${n} stocks — a curated set, not the whole market, expanding gradually as data is verified.`,
      emptyCoverageCta: "Browse covered stocks →",
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
    titleBefore: "오늘 볼 한국 주식,",
    titleAccent: "점수로 먼저",
    titleAfter: "좁혀보세요.",
    description:
      "추세 · 거래활성도 · 밸류 · 위험조정 · 공시 신호를 한 화면에 정리해, 오늘 먼저 확인할 탐색 우선순위를 보여주는 데이터 도구입니다.",
    primaryCta: "오늘 후보 보기 →",
    secondaryCta: "지표 이해하기",
    note: "오른스코어는 투자 추천이 아닌, 한국 주식 탐색·분석 무료 도구입니다.",
    stockSearch: "종목 직접 찾기 →",
    previewTitle: "오늘의 탐색 후보",
    previewFilter: "검증 보류 제외",
    empty: "후보 데이터를 준비 중입니다.",
    kpiSignals: "공시 신호",
    kpiVolume: "거래활성도 급증",
    kpiStrong: "종합 80↑",
    footerPrefix: "분석 종목",
    footerSuffix: "개 · 영업일 장마감 후 자동 갱신 · KRX · Naver · DART",
  },
  en: {
    badge: "OrnScore · Free beta",
    dataPrefix: "Data as of",
    marketClose: "market close",
    delayed: "delayed",
    normal: "normal",
    titleBefore: "Find Korean stocks",
    titleAccent: "worth checking",
    titleAfter: "by score.",
    description:
      "Trend, trading activity, valuation, risk-adjusted momentum, and disclosure signals are organized into one research-first dashboard.",
    primaryCta: "View today's candidates →",
    secondaryCta: "Understand metrics",
    note: "OrnScore is a free Korean-stock research tool, not investment advice.",
    stockSearch: "Search stocks →",
    previewTitle: "Today's candidates",
    previewFilter: "Pending verification excluded",
    empty: "Candidate data is being prepared.",
    kpiSignals: "Disclosure signals",
    kpiVolume: "Activity spikes",
    kpiStrong: "Composite 80+",
    footerPrefix: "Analyzed",
    footerSuffix: "stocks · Updated after market close on business days · KRX · Naver · DART",
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
    title: "오른스코어 로그인",
    emailOnlyLead: "로그인 없이도 탐색·분석은 그대로 쓸 수 있어요. 이메일로 로그인 링크를 받으세요.",
    lead: (providers: string) =>
      `로그인 없이도 탐색·분석은 그대로 쓸 수 있어요. ${providers}로 시작하거나 이메일로 로그인 링크를 받으세요.`,
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
    emailLabel: "이메일로 로그인",
    sending: "발송 중...",
    getLink: "로그인 링크 받기",
    noAds: "로그인 링크 외에 광고성 메일은 보내지 않습니다.",
    noAdsSecond: "알림 메일도 사용자가 직접 설정할 때만 발송됩니다.",
    benefitsTitle: "로그인은 선택이에요 — 하면 이런 걸 무료로 쓸 수 있어요",
    benefits: [
      "관심 종목을 여러 기기에서 이어보기",
      "비교 목록 영구 저장",
      "알림 설정과 기록 보관",
      "관심 종목 공시 알림 (등록 시 · 무료)",
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
      provider: "현재 이 로그인 방식은 설정 중이에요. 카카오·구글·네이버 또는 이메일로 로그인해 주세요.",
      rateLimit: "요청이 많아요. 잠시 후 다시 시도해 주세요.",
      invalidEmail: "이메일 주소를 다시 확인해 주세요.",
      unknown: "로그인 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.",
    },
  },
  en: {
    backHome: "Home",
    backPrevious: "Previous page",
    title: "Log in to OrnScore",
    emailOnlyLead: "Browsing and analysis stay open without login. Get a sign-in link by email.",
    lead: (providers: string) =>
      `Browsing and analysis stay open without login. Start with ${providers}, or get a sign-in link by email.`,
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
    emailLabel: "Sign in with email",
    sending: "Sending...",
    getLink: "Get sign-in link",
    noAds: "We do not send promotional email just because you sign in.",
    noAdsSecond: "Notification email is sent only when you explicitly enable it.",
    benefitsTitle: "Login is optional — with a free account you can",
    benefits: [
      "Keep your watchlist across devices",
      "Save comparison lists",
      "Save notification settings and records",
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
      provider: "This sign-in method is still being configured. Try Kakao, Google, Naver, or email.",
      rateLimit: "Too many requests. Please try again shortly.",
      invalidEmail: "Please check the email address.",
      unknown: "Something went wrong while signing in. Please try again shortly.",
    },
  },
} as const satisfies Record<Locale, unknown>;
