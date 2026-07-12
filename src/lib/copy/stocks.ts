/**
 * 다국어 v2 — /stocks (발견) 화면의 "크롬"(UI 라벨/버튼/안내) 문구.
 * ko = 현재 한국어 그대로(동작 불변), en = 보수적·비자문(non-advisory) 번역.
 * 종목명/티커/업종/테마/출처/숫자 등 데이터값은 절대 번역하지 않는다(소스 그대로).
 */
import type { Locale } from "@/lib/i18n";

export const stocksCopy = {
  ko: {
    // ── 페이지 헤더 ──
    headerTitle: "발견",
    matchCount: (n: number, total: number) => ({ a: `검색·필터 결과 ${n}개 `, b: `/ 분석 대상 ${total}종목` }),
    // 기본 품질 필터(PER≤200·PBR≤30)만 켜진 순수 기본 상태에서 헤더에 쓰는 문구
    qualityHeadline: (shown: number, total: number) => ({ a: `기본 품질 필터 ${shown}개 `, b: `/ 분석 대상 ${total}종목` }),
    viewAllToggle: (total: number) => `전체 ${total}개 보기`,
    backToDefaultToggle: "기본 품질 보기",
    // 결과 리스트 접근성(랜드마크 라벨·목록 제목·바로가기) — 무JS/스크린리더에서도 목록 시작을 명확히 안내
    resultsRegionLabel: "종목 목록",
    resultsHeading: (shown: number, total: number) => `종목 목록 · 분석 대상 ${total}종목 내 ${shown}개`,
    skipToList: "종목 목록 바로가기",
    headerDesc: (total: number) => `질문·필터로 먼저 볼 후보를 좁혀보세요.`,
    searchIntent: {
      title: "많이 찾는 탐색어",
      body:
        "주식 스크리닝, 종목 검색, PER/PBR/ROE 비교, 저평가 주식 찾기, 배당수익률 높은 주식, 코스피·코스닥 종목 분석을 같은 목록에서 좁혀볼 수 있습니다.",
    },
    marketCloseSuffix: "장마감",
    metricsPrefix: "Metrics",
    dataStaleLabel: "갱신 지연",
    dataNormalLabel: "데이터 정상",
    notAdvice: "투자 추천 아님 · 탐색 도구",
    baseScreenNote: (excluded: number) =>
      `기본 화면은 PER 200 이하 · PBR 30 이하만 표시하며, 제외 ${excluded}개는 위 ‘전체 보기’로 볼 수 있어요.`,

    // ── 검색 ──
    searchPlaceholder: "종목명 · 코드로 바로 검색",
    entry: {
      label: "빠른 진입",
      watchlist: "관심종목",
      recentSearchPrefix: "최근 검색 ",
      recentViewedPrefix: "최근 본 ",
      popularPrefix: "대표 후보 ",
    },

    // ── 질문형 프리셋 섹션 ──
    questionHeading: "어떤 종목을 찾고 있나요?",
    // 질문형 시작 + 더 좁히는 방법을 한 줄로(초보자 길잡이)
    questionDesc: "질문을 고르면 조건이 자동 적용돼요 · 더 좁히려면 빠른 프리셋·상세 필터",
    expectedResults: (n: number) => ({ a: "예상 결과 ", b: `${n}개` }),

    // ── 빠른 프리셋 ──
    quickPresetsLabel: "빠른 프리셋",
    quickPresetsHint: "— 지표로 바로 좁히기",
    collapse: "접기 ▴",
    expand: "펼치기 ▾",
    quickTitle: (desc: string, n: number) => `${desc} · 예상 ${n}개`,

    // ── 내 검색 조건(저장/알림) ──
    mySearchLabel: "내 검색 조건",
    saveCurrent: "+ 현재 조건 저장",
    alertThis: "이 조건 알림",
    savedEmpty: "자주 쓰는 필터 조합을 저장해 한 번에 불러올 수 있어요. 로그인하면 기기 간 동기화돼요.",
    removeSaved: "삭제",
    defaultSavedName: "내 검색 조건",
    saveNameAria: "저장할 검색 조건 이름",
    saveNamePlaceholder: "예: 저PER 배당주",
    saveNameSubmit: "저장",
    saveNameCancel: "취소",
    defaultAlertName: "내 조건 알림",
    alertNameSuffix: "알림",
    alertNameAria: "조건 알림 이름",
    alertNamePlaceholder: "예: 저PER 배당주 신규",
    alertNameSubmit: "알림 만들기",
    alertNameCancel: "취소",
    alertLoginRequired: "조건 알림은 로그인 후 받을 수 있어요. 현재는 이메일 발송, 카카오톡 알림은 준비 중입니다.",
    alertLoginCta: "로그인",

    // ── prompt / confirm / alert ──
    promptSaveName: "이 검색 조건의 이름을 정해주세요 (예: 저PER 배당주)",
    promptAlertName: "알림 이름을 정해주세요 (예: 저PER 배당주 신규)",
    confirmAlertLogin: "조건 알림은 로그인 후 받을 수 있어요 (현재는 이메일 발송, 카카오톡 알림 준비 중). 로그인하러 갈까요?",
    alertCreated: "알림을 등록했어요. 조건에 새 종목이 들어오면 알려드릴게요 (현재는 이메일 발송, 카카오톡 알림 준비 중). (설정 > 알림에서 관리)",
    alertFailed: "등록에 실패했어요. 잠시 후 다시 시도해주세요.",
    confirmReset: "모든 조건을 초기화할까요?",

    // ── 정렬 ──
    sortAria: "정렬 기준",
    sortGroupScore: "ORNSCORE 점수",
    sortGroupFinance: "재무 지표",
    sortGroupMove: "움직임·위험",
    sortOpt: {
      compositeDesc: "종합점수 높은순",
      momentumDesc: "추세 높은순",
      valueDesc: "밸류 높은순",
      volDesc: "위험조정 높은순",
      flowDesc: "거래활성도 높은순",
      roeDesc: "ROE 높은순",
      perAsc: "PER 낮은순",
      pbrAsc: "PBR 낮은순",
      divDesc: "배당수익률 높은순",
      capDesc: "시가총액 큰순",
      r3mDesc: "3개월 상승률 높은순",
    },

    // ── 필터 열기/보기 ──
    filterShort: "필터",
    openFilterAria: "상세 필터 열기",
    closeFilter: "필터 닫기 ▴",
    openFilter: "필터 열기 ▾",
    appliedFilterAria: (n: number) => `적용된 필터 ${n}개`,
    viewModeAria: "보기 방식",
    viewCard: "카드형",
    viewTable: "표형",
    viewCardHint: "초보자용 · 왜 후보인지·먼저 확인할 점 중심",
    viewTableHint: "숙련자용 · 지표·재무 열을 한눈에 스캔",

    // ── 현재 조건 요약 바 ──
    currentCond: "현재 조건",
    matchCountShort: (n: number, total: number) => ({ a: `검색·필터 결과 ${n} `, b: `/ 분석 대상 ${total}종목` }),
    // 현재 조건 블록 3행: 기본 품질 필터 / 상세 필터 / 정렬 (기본 품질과 사용자 상세를 명확히 분리)
    qualityRowOn: "기본 품질 필터: PER ≤ 200, PBR ≤ 30",
    qualityRowOff: "기본 품질 필터: 해제됨 (전체 보기)",
    detailRowLabel: "상세 필터",
    detailRowNone: "없음",
    sortRowLabel: "정렬",
    backToDefaultReset: "기본 화면으로 초기화",
    noDetailFilter: "적용된 사용자 상세 필터 없음",
    removeFilterAria: (label: string) => `${label} 필터 제거`,
    saveCond: "조건 저장",
    alertCondShort: "이 조건 알림",
    reset: "초기화",

    // ── 모바일 약어 안내 ──
    legendMore: "자세히",

    // ── 결과 없음 ──
    emptyTitle: "조건에 맞는 종목이 없습니다.",
    emptyStrong: (label: string) => ({ pre: "", label, post: " 때문에 지금 범위에 드는 종목이 없습니다.", line2: "이 조건만 완화하거나 전체를 초기화해 다시 탐색해보세요." }),
    emptyLoose: "필터를 조금 완화하거나 초기화하면 더 많은 후보를 볼 수 있습니다.",
    // 검색어만 있고 결과가 없을 때(철자 확인·검색어 지우기 유도)
    emptySearchTitle: (query: string) => `‘${query}’에 맞는 종목이 없어요.`,
    emptySearchHint: "종목명·코드 철자를 확인하거나 검색어를 지워보세요.",
    clearSearch: "검색어 지우기",
    relaxStrongest: "가장 강한 조건 완화",
    viewAll: "전체 종목 보기",
    themeQualityEmptyTitle: (theme: string) => `${theme} 테마 종목은 있지만 기본 품질 필터에서 제외됐어요.`,
    themeQualityEmptyHint: (excluded: number, total: number) =>
      `현재 소속 ${total}개 종목 중 ${excluded}개가 PER/PBR 기본 상한 밖이라 결과 목록에서 빠졌습니다.`,
    themeQualityReasonTitle: "제외 이유",
    themeQualityPerReason: (value: string) => `PER ${value}배 > 200배`,
    themeQualityPbrReason: (value: string) => `PBR ${value}배 > 30배`,
    themeQualityMore: (n: number) => `외 ${n}개 종목도 기본 품질 필터 밖입니다.`,
    themeQualityAction: "필터를 풀고 보기",
    themeQualityCaveat: "필터 해제는 표시 범위를 넓히는 동작이며 투자 판단이 아닙니다.",
    themeNoMatchTitle: (theme: string) => `${theme} 테마와 연결된 실데이터 종목이 없습니다.`,
    themeNoMatchHint: "테마명이 바뀌었거나 현재 138개 분석 대상에 포함되지 않았을 수 있습니다. 종목명·코드 검색으로 확인해보세요.",
    themeNoMatchAction: "종목 검색으로 이동",

    // ── 결과 푸터 ──
    topCapNote: (n: number, total: number) => `분석 대상 ${total}종목 내 조건에 맞는 ${n}개 중 상위 100개만 표시 · 조건을 좁히면 비교하기 쉬워요.`,

    // ── 상세 필터 패널 ──
    filterDetailTitle: "상세 필터",
    // 필터 조절 중 실시간 예상 결과 수(패널 상단 고정)
    filterLiveCount: (n: number, total: number) => ({ a: `예상 결과 ${n}개 `, b: `/ 분석 대상 ${total}종목` }),
    closeDrawerView: (n: number) => `${n}개 보기`,
    labelMarket: "시장",
    labelMarketCap: "시가총액",
    sectionMetrics: "ORNSCORE 지표",
    sectionFinance: "재무",
    minLabel: (label: string) => `최소 ${label}`,
    minRoe: "최소 ROE",
    minDivYield: "최소 배당수익률",
    perRange: "PER 범위",
    pbrRange: "PBR 범위",
    noMaxPlaceholder: "상한 없음",
    excludeLossLabel: "적자 기업 제외",
    excludeLossHint: "(EPS > 0)",
    sectorLabel: "업종",
    sectorClear: "업종 해제",
    sectorHint: "업종은 내부 분류 기준입니다. 테마 조건과 별도로 적용됩니다.",
    themeLabel: "테마",
    themeSelected: (n: number) => `(${n}개 선택)`,
    themeClear: "선택 초기화",
    themeSearchPlaceholder: "테마 검색...",
    popularThemes: (n: number) => `인기 테마 ${n}개`,
    noTheme: "일치하는 테마가 없습니다",
    showAllThemes: (n: number) => `전체 테마 보기 (${n}개) →`,
    showPopularThemes: "← 인기 테마만 보기",
    resetAllFilters: "필터 전체 초기화",

    // ── 시장/시총 옵션 ──
    capOpt: { all: "전체", large: "대형 5조+", mid: "중형 1~5조", small: "소형 1조-" },
    marketOpt: { all: "전체", KOSPI: "코스피", KOSDAQ: "코스닥" },

    // ── 점수 지표 라벨(슬라이더·배지 공용) ──
    metric: { composite: "종합점수", momentum: "추세", flow: "거래활성도", value: "밸류", vol: "위험조정" },

    // ── 활성 칩 접두어 ──
    chip: {
      market: "시장 ",
      cap: "시총 ",
      composite: "종합 ",
      mom: "추세 ",
      flow: "거래활성도 ",
      val: "밸류 ",
      vol: "위험조정 ",
      roe: "ROE ",
      div: "배당 ",
      loss: "적자 제외",
      sector: "업종: ",
      theme: "테마: ",
    },

    // ── 정렬 배지(프리셋 조건 표시용) ──
    sortBadge: {
      compositeScore: "종합점수순",
      momentum: "추세순",
      flow: "거래활성도순",
      value: "밸류순",
      vol: "위험조정순",
      roe: "ROE순",
      per: "PER 낮은순",
      pbr: "PBR 낮은순",
      dividendYield: "배당순",
      marketCap: "시총순",
      r3m: "3개월 상승률순",
    },

    // ── 조건 배지(badgesFromConfig) ──
    badge: {
      composite: (v: number) => `종합 ${v}+`,
      momentum: (v: number) => `추세 ${v}+`,
      flow: (v: number) => `거래활성도 ${v}+`,
      value: (v: number) => `밸류 ${v}+`,
      vol: (v: number) => `위험조정 ${v}+`,
      perMax: (v: number) => `PER ${v}↓`,
      pbrMax: (v: number) => `PBR ${v}↓`,
      roe: (v: number) => `ROE ${v}%+`,
      div: (v: number) => `배당 ${v}%+`,
      large: "대형주",
      mid: "중형주",
      small: "소형주",
      excludeLoss: "적자 제외",
    },

    // ── 현재 조건 설명(describeConditions) ──
    describeQuestion: (label: string, explain: string) => `"${label}" 조건은 ${explain}`,
    describeQuick: (label: string, desc: string) => `빠른 프리셋 "${label}" — ${desc}.`,
    describeSector: (sector: string) => `${sector} 업종 종목 중 조건에 맞는 후보를 보고 있습니다.`,
    describeTheme: (themes: string) => `${themes} 테마에 속한 종목 중 조건에 맞는 후보를 보고 있습니다.`,
    describeManual: "사용자가 직접 설정한 PER, PBR, ROE, 시가총액 등 조건으로 후보를 좁혔습니다.",
    describeAll: (shown: number, total: number) =>
      shown < total
        ? `현재 ${shown}개 종목을 종합점수 기준으로 보고 있습니다. 전체 ${total}개를 보려면 기본 품질 필터를 해제하세요.`
        : `전체 ${total}개 종목을 종합점수 기준으로 보고 있습니다.`,

    // ── 가장 강한 조건(strongestConstraint) ──
    cons: {
      composite: (v: number) => `종합점수 ${v}+ 조건`,
      momentum: (v: number) => `추세 ${v}+ 조건`,
      flow: (v: number) => `거래활성도 ${v}+ 조건`,
      value: (v: number) => `밸류 ${v}+ 조건`,
      vol: (v: number) => `위험조정 ${v}+ 조건`,
      perMax: (v: number) => `PER ${v}↓ 조건`,
      pbrMax: (v: string) => `PBR ${v}↓ 조건`,
      roe: (v: number) => `ROE ${v}%+ 조건`,
      div: (v: string) => `배당 ${v}%+ 조건`,
      sector: (name: string) => `${name} 업종 조건`,
      themes: (n: number) => `선택한 테마(${n}개) 조건`,
      cap: "시가총액 구간 조건",
      excludeLoss: "적자 제외 조건",
      market: "시장 조건",
    },

    // ── 질문형 프리셋(QUESTION_PRESETS) ──
    qPreset: {
      "q-cheap-active": { label: "싸 보이는 종목", desc: "밸류 점수가 높은 후보를 먼저 봅니다.", explain: "밸류 점수가 높은 후보를 먼저 보여줍니다." },
      "q-active-interest": { label: "최근 관심이 늘어난 종목", desc: "거래활성도 점수가 높은 후보를 봅니다.", explain: "거래활성도 점수가 높은 후보를 보여줍니다." },
      "q-strong-trend": { label: "흐름이 강한 종목", desc: "추세 점수가 높은 후보를 봅니다.", explain: "추세 점수가 높은 후보를 보여줍니다.", caution: "추세는 빠르게 식을 수 있어 상승 사유 확인이 필요합니다." },
      "q-dividend-stable": { label: "배당/안정형 종목", desc: "배당, 밸류, 위험조정 조건을 함께 봅니다.", explain: "배당, 밸류, 위험조정 조건을 함께 적용한 후보를 보여줍니다." },
      "q-small-value": { label: "숨은 소형주", desc: "소형주 안에서 밸류 점수가 있는 후보를 봅니다.", explain: "소형주 안에서 밸류 점수가 있는 후보를 보여줍니다." },
    } as Record<string, { label: string; desc: string; explain: string; caution?: string }>,

    // ── 빠른 프리셋(PRESETS) ──
    preset: {
      lowper: { label: "저평가", desc: "PER 15 이하 · 밸류 정렬" },
      momentum: { label: "추세 강세", desc: "추세 강한 종목 · 종합 60+" },
      lowpbr: { label: "저PBR", desc: "PBR 1.0 이하 · 밸류 정렬" },
      "value-momentum": { label: "밸류+추세", desc: "두 지표 모두 우호적 · 종합 70+" },
      balanced: { label: "균형 종목", desc: "종합 80+" },
      roe: { label: "ROE 우수", desc: "ROE 15%+ · ROE 정렬" },
      dividend: { label: "배당 있음", desc: "배당 1%+ · 배당 정렬" },
      bigcap: { label: "대형주", desc: "대형 5조+ · 시총 정렬" },
      smallcap: { label: "소형주", desc: "소형 1조- · 밸류 정렬" },
      surge: { label: "급등 위험", desc: "3개월 상승률 높은순 · 급등 사유 확인" },
      active: { label: "거래 급증", desc: "거래활성도 높은순" },
    } as Record<string, { label: string; desc: string }>,

    // ── 카드 라벨 ──
    card: {
      cap: "시총",
      perDash: "—",
      strength: "강점",
      warning: "주의",
      neutral: "지표가 대체로 중립 범위예요 — 상세에서 직접 확인해 보세요",
      tip: { momentum: "추세(모멘텀)", flow: "거래활성도(거래)", value: "밸류(저평가)", vol: "위험조정(변동성조정)" },
      abbr: { momentum: "추", flow: "거", value: "저", vol: "위" },
    },

    // ── 모바일 약어 범례 ──
    legend: { momentum: "추", flow: "거", value: "밸", vol: "위", momentumFull: "추세", flowFull: "거래활성도", valueFull: "밸류", volFull: "위험조정" },

    // ── 표(StockResultsTable) ──
    table: {
      name: "종목명",
      sector: "업종",
      price: "현재가",
      change: "등락률",
      composite: "종합점수",
      momentum: "추세",
      flow: "거래활성도",
      value: "밸류",
      vol: "위험조정",
      per: "PER",
      pbr: "PBR",
      roe: "ROE",
      div: "배당",
      signal: "신호",
      action: "액션",
      view: "확인",
      sectorEtc: "기타",
    },

    // ── 신호 칩(deriveSignals) ──
    signal: {
      strongTrend: "추세 강함",
      activeTrade: "거래 활발",
      undervalued: "저평가 가능",
      goodRisk: "위험 대비 양호",
      weakTrend: "추세 약함",
      lowTrade: "거래 부진",
      valueBurden: "밸류 부담",
      highVol: "변동성 큼",
      priceFalling: "가격 하락 중",
      surgeCaution: "급등 주의",
    },

    // ── 종목별 가격 기준일 지연 배지(목록/카드) ──
    dataLag: {
      badge: "데이터 지연",
      tooltip: "이 종목 주가는 전체 기준일보다 과거입니다(최신 배치 미반영). 순위·점수 해석 시 주의하세요.",
    },
  },
  en: {
    // ── Page header ──
    headerTitle: "Find stocks to review today",
    matchCount: (n: number, total: number) => ({ a: `Filtered results ${n} `, b: `/ within ${total} analyzed` }),
    qualityHeadline: (shown: number, total: number) => ({ a: `Default quality filter ${shown} `, b: `/ within ${total} analyzed` }),
    viewAllToggle: (total: number) => `View all ${total}`,
    backToDefaultToggle: "Default view",
    // Results-list accessibility (landmark label · list heading · skip link) — surface the list start for no-JS/screen readers
    resultsRegionLabel: "Stock list",
    resultsHeading: (shown: number, total: number) => `Stock list · ${shown} within ${total} analyzed`,
    skipToList: "Skip to stock list",
    headerDesc: (total: number) => `Use questions or filters to narrow down candidates to look at first.`,
    searchIntent: {
      title: "Common search intents",
      body:
        "Use one list to narrow Korean stock screening, stock search, PER/PBR/ROE comparison, undervalued stock ideas, dividend-yield screens, and KOSPI/KOSDAQ stock analysis.",
    },
    marketCloseSuffix: "market close",
    metricsPrefix: "Metrics",
    dataStaleLabel: "Update delayed",
    dataNormalLabel: "Data current",
    notAdvice: "Not investment advice · research tool",
    baseScreenNote: (excluded: number) =>
      `The default view shows only PER ≤ 200 and PBR ≤ 30; the ${excluded} excluded appear via "View all" above.`,

    // ── Search ──
    searchPlaceholder: "Search by name · ticker",
    entry: {
      label: "Quick entry",
      watchlist: "Watchlist",
      recentSearchPrefix: "Recent search ",
      recentViewedPrefix: "Recently viewed ",
      popularPrefix: "Starter pick ",
    },

    // ── Question presets ──
    questionHeading: "What kind of stock are you looking for?",
    // Question start + how to narrow, one line (beginner orientation)
    questionDesc: "Pick a question and filters apply automatically · narrow further with quick presets or detailed filters",
    expectedResults: (n: number) => ({ a: "Expected results ", b: `${n}` }),

    // ── Quick presets ──
    quickPresetsLabel: "Quick presets",
    quickPresetsHint: "— narrow by metric instantly",
    collapse: "Collapse ▴",
    expand: "Expand ▾",
    quickTitle: (desc: string, n: number) => `${desc} · ~${n}`,

    // ── My searches (save / alert) ──
    mySearchLabel: "My searches",
    saveCurrent: "+ Save current",
    alertThis: "Alert on this",
    savedEmpty: "Save filter combinations you use often and recall them in one tap. Sign in to sync across devices.",
    removeSaved: "Remove",
    defaultSavedName: "My search",
    saveNameAria: "Saved search name",
    saveNamePlaceholder: "e.g., Low PER dividend stocks",
    saveNameSubmit: "Save",
    saveNameCancel: "Cancel",
    defaultAlertName: "My condition alert",
    alertNameSuffix: "alert",
    alertNameAria: "Condition alert name",
    alertNamePlaceholder: "e.g., New low-PER dividend stocks",
    alertNameSubmit: "Create alert",
    alertNameCancel: "Cancel",
    alertLoginRequired: "Condition alerts are delivered after sign-in. Email is available for now; KakaoTalk alerts are in the works.",
    alertLoginCta: "Sign in",

    // ── prompt / confirm / alert ──
    promptSaveName: "Name this search (e.g., Low PER dividend stocks)",
    promptAlertName: "Name this alert (e.g., New low-PER dividend stocks)",
    confirmAlertLogin: "Condition alerts are delivered after sign-in (email for now; KakaoTalk alerts in the works). Go sign in?",
    alertCreated: "Alert saved. We'll notify you when a new stock matches (email for now; KakaoTalk alerts in the works). (Manage in Settings > Alerts)",
    alertFailed: "Couldn't save. Please try again in a moment.",
    confirmReset: "Reset all conditions?",

    // ── Sort ──
    sortAria: "Sort by",
    sortGroupScore: "ORNSCORE",
    sortGroupFinance: "Financials",
    sortGroupMove: "Movement · Risk",
    sortOpt: {
      compositeDesc: "Composite score, high to low",
      momentumDesc: "Trend, high to low",
      valueDesc: "Value, high to low",
      volDesc: "Risk-adjusted, high to low",
      flowDesc: "Trading activity, high to low",
      roeDesc: "ROE, high to low",
      perAsc: "PER, low to high",
      pbrAsc: "PBR, low to high",
      divDesc: "Dividend yield, high to low",
      capDesc: "Market cap, large to small",
      r3mDesc: "3-month return, high to low",
    },

    // ── Filter open / view ──
    filterShort: "Filters",
    openFilterAria: "Open detailed filters",
    closeFilter: "Close filters ▴",
    openFilter: "Open filters ▾",
    appliedFilterAria: (n: number) => `${n} filters applied`,
    viewModeAria: "View mode",
    viewCard: "Cards",
    viewTable: "Table",
    viewCardHint: "For beginners · why it's a candidate & what to check",
    viewTableHint: "For advanced scanning · metrics & financials at a glance",

    // ── Current condition bar ──
    currentCond: "Current conditions",
    matchCountShort: (n: number, total: number) => ({ a: `Results ${n} `, b: `/ within ${total} analyzed` }),
    qualityRowOn: "Default quality filter: PER ≤ 200, PBR ≤ 30",
    qualityRowOff: "Default quality filter: Off (viewing all)",
    detailRowLabel: "Detail filters",
    detailRowNone: "None",
    sortRowLabel: "Sort",
    backToDefaultReset: "Reset to default view",
    noDetailFilter: "No user detail filters applied",
    removeFilterAria: (label: string) => `Remove ${label} filter`,
    saveCond: "Save",
    alertCondShort: "Alert",
    reset: "Reset",

    // ── Mobile legend ──
    legendMore: "Details",

    // ── Empty ──
    emptyTitle: "No stocks match these conditions.",
    emptyStrong: (label: string) => ({ pre: "The ", label, post: " is strong, so no stocks fall in the current range.", line2: "Try relaxing just this condition, or reset everything and search again." }),
    emptyLoose: "Relax or reset the filters to see more candidates.",
    // Query typed but nothing matches (check spelling / clear search)
    emptySearchTitle: (query: string) => `No stocks match ‘${query}’.`,
    emptySearchHint: "Check the spelling of the name or ticker, or clear the search.",
    clearSearch: "Clear search",
    relaxStrongest: "Relax strongest condition",
    viewAll: "View all stocks",
    themeQualityEmptyTitle: (theme: string) => `${theme} has stocks, but the default quality filter is hiding them.`,
    themeQualityEmptyHint: (excluded: number, total: number) =>
      `${excluded} of ${total} theme stocks are outside the default PER/PBR caps, so they are not shown in the result list.`,
    themeQualityReasonTitle: "Reason hidden",
    themeQualityPerReason: (value: string) => `PER ${value} > 200`,
    themeQualityPbrReason: (value: string) => `PBR ${value} > 30`,
    themeQualityMore: (n: number) => `${n} more stocks are also outside the default quality filter.`,
    themeQualityAction: "View without filter",
    themeQualityCaveat: "Turning this off only broadens the display range; it is not investment advice.",
    themeNoMatchTitle: (theme: string) => `No live data stocks are linked to the ${theme} theme.`,
    themeNoMatchHint: "The theme name may have changed, or it may not be part of the current 138-stock universe. Try searching by stock name or ticker.",
    themeNoMatchAction: "Go to stock search",

    // ── Results footer ──
    topCapNote: (n: number, total: number) => `Within ${total} analyzed, showing the top 100 of ${n} matches · narrow the conditions to compare more easily.`,

    // ── Detailed filter panel ──
    filterDetailTitle: "Detailed filters",
    // Live expected result count while adjusting filters (pinned at panel top)
    filterLiveCount: (n: number, total: number) => ({ a: `Expected ${n} `, b: `/ within ${total} analyzed` }),
    closeDrawerView: (n: number) => `View ${n}`,
    labelMarket: "Market",
    labelMarketCap: "Market cap",
    sectionMetrics: "ORNSCORE metrics",
    sectionFinance: "Financials",
    minLabel: (label: string) => `Min ${label}`,
    minRoe: "Min ROE",
    minDivYield: "Min dividend yield",
    perRange: "PER range",
    pbrRange: "PBR range",
    noMaxPlaceholder: "No max",
    excludeLossLabel: "Exclude loss-making",
    excludeLossHint: "(EPS > 0)",
    sectorLabel: "Sector",
    sectorClear: "Clear sector",
    sectorHint: "Sectors use OrnScore's internal grouping and apply separately from theme filters.",
    themeLabel: "Themes",
    themeSelected: (n: number) => `(${n} selected)`,
    themeClear: "Clear selection",
    themeSearchPlaceholder: "Search themes...",
    popularThemes: (n: number) => `${n} popular themes`,
    noTheme: "No matching themes",
    showAllThemes: (n: number) => `View all themes (${n}) →`,
    showPopularThemes: "← Popular themes only",
    resetAllFilters: "Reset all filters",

    // ── Market / cap options ──
    capOpt: { all: "All", large: "Large 5T+", mid: "Mid 1–5T", small: "Small <1T" },
    marketOpt: { all: "All", KOSPI: "KOSPI", KOSDAQ: "KOSDAQ" },

    // ── Score metric labels ──
    metric: { composite: "Composite", momentum: "Trend", flow: "Trading activity", value: "Value", vol: "Risk-adjusted" },

    // ── Active chip prefixes ──
    chip: {
      market: "Market ",
      cap: "Cap ",
      composite: "Composite ",
      mom: "Trend ",
      flow: "Trading activity ",
      val: "Value ",
      vol: "Risk-adjusted ",
      roe: "ROE ",
      div: "Dividend ",
      loss: "Exclude loss",
      sector: "Sector: ",
      theme: "Theme: ",
    },

    // ── Sort badges ──
    sortBadge: {
      compositeScore: "by composite",
      momentum: "by trend",
      flow: "by trading activity",
      value: "by value",
      vol: "by risk-adjusted",
      roe: "by ROE",
      per: "by PER, low first",
      pbr: "by PBR, low first",
      dividendYield: "by dividend",
      marketCap: "by market cap",
      r3m: "by 3-month return",
    },

    // ── Condition badges ──
    badge: {
      composite: (v: number) => `Composite ${v}+`,
      momentum: (v: number) => `Trend ${v}+`,
      flow: (v: number) => `Trading activity ${v}+`,
      value: (v: number) => `Value ${v}+`,
      vol: (v: number) => `Risk-adjusted ${v}+`,
      perMax: (v: number) => `PER ${v}↓`,
      pbrMax: (v: number) => `PBR ${v}↓`,
      roe: (v: number) => `ROE ${v}%+`,
      div: (v: number) => `Dividend ${v}%+`,
      large: "Large cap",
      mid: "Mid cap",
      small: "Small cap",
      excludeLoss: "Exclude loss",
    },

    // ── Describe conditions ──
    describeQuestion: (label: string, explain: string) => `"${label}" — ${explain}`,
    describeQuick: (label: string, desc: string) => `Quick preset "${label}" — ${desc}.`,
    describeSector: (sector: string) => `Showing candidates in the ${sector} sector that match the conditions.`,
    describeTheme: (themes: string) => `Showing candidates that match the conditions among stocks in the ${themes} theme.`,
    describeManual: "You've narrowed the candidates with custom PER, PBR, ROE, market cap and other conditions.",
    describeAll: (shown: number, total: number) =>
      shown < total
        ? `You're viewing ${shown} stocks by composite score. To see all ${total}, turn off the default quality filter.`
        : `Viewing all ${total} stocks by composite score.`,

    // ── Strongest constraint ──
    cons: {
      composite: (v: number) => `Composite ${v}+ condition`,
      momentum: (v: number) => `Trend ${v}+ condition`,
      flow: (v: number) => `Trading activity ${v}+ condition`,
      value: (v: number) => `Value ${v}+ condition`,
      vol: (v: number) => `Risk-adjusted ${v}+ condition`,
      perMax: (v: number) => `PER ${v}↓ condition`,
      pbrMax: (v: string) => `PBR ${v}↓ condition`,
      roe: (v: number) => `ROE ${v}%+ condition`,
      div: (v: string) => `Dividend ${v}%+ condition`,
      sector: (name: string) => `${name} sector condition`,
      themes: (n: number) => `Selected themes (${n}) condition`,
      cap: "Market cap range condition",
      excludeLoss: "Exclude loss-making condition",
      market: "Market condition",
    },

    // ── Question presets ──
    qPreset: {
      "q-cheap-active": { label: "Looks inexpensive", desc: "Start with candidates that score well on value.", explain: "shows candidates that score well on value." },
      "q-active-interest": { label: "Interest rising lately", desc: "Start with higher trading-activity scores.", explain: "shows candidates with higher trading-activity scores." },
      "q-strong-trend": { label: "Strong flow", desc: "Start with higher trend scores.", explain: "shows candidates with higher trend scores.", caution: "Trends can cool quickly; check what drove the move." },
      "q-dividend-stable": { label: "Dividend/stable", desc: "Combine dividend, value, and risk-adjusted conditions.", explain: "combines dividend, value, and risk-adjusted conditions." },
      "q-small-value": { label: "Hidden small caps", desc: "Look inside small caps with usable value scores.", explain: "shows small-cap candidates with usable value scores." },
    } as Record<string, { label: string; desc: string; explain: string; caution?: string }>,

    // ── Quick presets ──
    preset: {
      lowper: { label: "Undervalued", desc: "PER ≤ 15 · sorted by value" },
      momentum: { label: "Strong trend", desc: "Strong trend · composite 60+" },
      lowpbr: { label: "Low PBR", desc: "PBR ≤ 1.0 · sorted by value" },
      "value-momentum": { label: "Value + trend", desc: "Both metrics favorable · composite 70+" },
      balanced: { label: "Balanced", desc: "Composite 80+" },
      roe: { label: "Strong ROE", desc: "ROE 15%+ · sorted by ROE" },
      dividend: { label: "Pays dividend", desc: "Dividend 1%+ · sorted by dividend" },
      bigcap: { label: "Large cap", desc: "Large 5T+ · sorted by market cap" },
      smallcap: { label: "Small cap", desc: "Small <1T · sorted by value" },
      surge: { label: "Surge risk", desc: "Highest 3-month gain · check surge reason" },
      active: { label: "Trading spike", desc: "Highest trading activity" },
    } as Record<string, { label: string; desc: string }>,

    // ── Card labels ──
    card: {
      cap: "Cap",
      perDash: "—",
      strength: "Strengths",
      warning: "Caution",
      neutral: "Metrics are mostly in a neutral range — open detail to check yourself",
      tip: { momentum: "Trend (momentum)", flow: "Trading activity", value: "Value (undervalued)", vol: "Risk-adjusted (volatility-adjusted)" },
      abbr: { momentum: "T", flow: "A", value: "V", vol: "R" },
    },

    // ── Mobile legend ──
    legend: { momentum: "T", flow: "A", value: "V", vol: "R", momentumFull: "Trend", flowFull: "Trading activity", valueFull: "Value", volFull: "Risk-adjusted" },

    // ── Table ──
    table: {
      name: "Name",
      sector: "Sector",
      price: "Price",
      change: "Change",
      composite: "Composite",
      momentum: "Trend",
      flow: "Trading activity",
      value: "Value",
      vol: "Risk-adj.",
      per: "PER",
      pbr: "PBR",
      roe: "ROE",
      div: "Div",
      signal: "Signals",
      action: "Action",
      view: "View",
      sectorEtc: "Other",
    },

    // ── Signal chips ──
    signal: {
      strongTrend: "Strong trend",
      activeTrade: "Active trading",
      undervalued: "Possibly undervalued",
      goodRisk: "Sound vs. risk",
      weakTrend: "Weak trend",
      lowTrade: "Sluggish trading",
      valueBurden: "Value burden",
      highVol: "High volatility",
      priceFalling: "Price falling",
      surgeCaution: "Surge caution",
    },

    // ── Per-stock price-date lag badge (list/card) ──
    dataLag: {
      badge: "Data delayed",
      tooltip: "This stock's price is older than the site reference date (not in the latest batch). Interpret its rank/score with care.",
    },
  },
} as const satisfies Record<Locale, unknown>;

export type StocksCopy = (typeof stocksCopy)[Locale];
