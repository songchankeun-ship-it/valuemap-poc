/**
 * 다국어 v2 — /disclosures(공시 신호) 화면의 "크롬"(UI 칩/제목/버튼/안내) 문구.
 * 회사명·티커·날짜·DART 원문 보고서명은 번역하지 않고 원형을 유지한다.
 * 비자문 원칙: 호재/악재·매수/매도 권유 표현 금지(양 언어 동일).
 */
import type { Locale } from "@/lib/i18n";

/** 서버 페이지에서 추출한 인트로(브레드크럼/헤더/안내) — DisclosuresIntro에서 사용. */
export const disclosuresIntroCopy = {
  ko: {
    breadcrumbHome: "홈",
    breadcrumbCurrent: "공시 신호",
    returnToday: "오늘 대시보드",
    returnWatchlist: "관심 종목",
    limitedBadge: "최신 200건 내",
    title: "공시 신호",
    desc: "기본은 오른스코어 분석 대상 종목만 보여주고, 필요하면 전체 시장으로 넓힐 수 있어요. 코스피·코스닥 최신 100건씩(합 200건) 안에서 확인이 필요한 내용을 유형별로 정리합니다.",
    collapseSummary: "수집 범위 — 코스피·코스닥 최신 100건씩",
    collapseBody:
      "선택한 기간 전체 공시가 아니라, 코스피·코스닥 각 최신 100건(합 200건)에서 자동 추출한 신호입니다. 표시는 최대 50건이며, 선택한 기간의 전체 공시가 포함되지 않아 일부 공시가 누락될 수 있습니다.",
    typeGuide: {
      title: "주요 공시 유형",
      items: [
        "자사주 취득·자기주식 처분 공시는 규모, 기간, 목적, 소각 여부를 확인합니다.",
        "임원·주요주주 보유변동은 매수·매도 방향과 보고자, 대상 회사를 분리해 봅니다.",
        "정정공시, 단일판매·공급계약, 전환사채·유상증자 공시는 원문 수치와 기존 재무 흐름을 함께 봅니다.",
      ],
    },
    bottomNote:
      "본 페이지의 신호는 DART 공시 보고서명 매칭 기반 1차 필터입니다. 본문 확인 + 시세 추이 검토 후 판단하세요. 투자 권유가 아닙니다.",
  },
  en: {
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Disclosure signals",
    returnToday: "Today",
    returnWatchlist: "Watchlist",
    limitedBadge: "Within latest 200",
    title: "Disclosure signals",
    desc: "By default, this page shows only OrnScore's analyzed universe; you can widen it to the whole market. We group items to review within the latest 100 KOSPI and 100 KOSDAQ filings (200 total).",
    collapseSummary: "Collection scope — latest 100 KOSPI + 100 KOSDAQ",
    collapseBody:
      "These are not all disclosures in the selected period. They are signals auto-extracted from the latest 100 KOSPI and 100 KOSDAQ filings (200 total). At most 50 are shown, and because not every filing in the period is included, some disclosures may be missing.",
    typeGuide: {
      title: "Key disclosure types",
      items: [
        "For treasury-share buybacks or disposals, check size, period, purpose, and whether cancellation is planned.",
        "For officer or major-shareholder ownership changes, separate buy/sell direction, reporter, and target company.",
        "For corrections, large supply contracts, convertible bonds, or paid-in capital increases, compare source figures with the existing financial trend.",
      ],
    },
    bottomNote:
      "Signals on this page are a first-pass filter based on matching DART disclosure report titles. Review the full text and price trend before deciding. This is not investment advice.",
  },
} as const satisfies Record<Locale, unknown>;

/** DisclosureExplorer(클라이언트) — 필터/카드/안내/빈 상태 문구. */
export const disclosureExplorerCopy = {
  ko: {
    // 로딩 / 에러
    loading: (days: number) => `최근 ${days}일 DART 공시를 불러오고 있습니다...`,
    errorPrefix: "공시 데이터를 가져오지 못했습니다: ",
    errorUnknown: "일시적인 오류",
    errorTitle: "공시 데이터를 잠시 불러오지 못했어요",
    errorHelp: "일시적인 네트워크 문제일 수 있어요. 잠시 후 다시 시도해 주세요.",
    errorRetry: "다시 시도",
    // 헤더
    title: "공시 신호",
    within200: "최신 수집 200건 내",
    periodScopeBadge: "최신 수집 200건 내",
    periodScopeBadgeAria:
      "수집 범위 제한 안내입니다. 선택한 기간 전체 공시가 아니라 코스피와 코스닥 최신 100건씩, 합 200건 안에서만 표시하며, 필터 컨트롤이 아닙니다.",
    // 결과 카운트 옆에 반복 고지하는 누락 안내 조각
    missingFragment: "누락 가능 · 코스피/코스닥 최신 100건씩 내",
    // 카드 위 공통 경고 박스 — 카드마다 반복되던 문구를 한곳에 모음
    topNoticeTitle: "공시 카드 공통 안내",
    topNoticeBullets: [
      "판단 전 DART 원문을 직접 확인하세요.",
      "수집 제한: 코스피/코스닥 최신 100건씩(합 200건) 안에서 최대 50건만 표시합니다.",
      "호재·악재 판단이 아니라 유형 분류·탐색 신호입니다.",
    ] as readonly string[],
    summary: (days: number, signalCount: number, scopeAll: boolean, groupCount: number) =>
      `최근 ${days}일 중 최신 200건 내 신호 ${signalCount}건 · ${scopeAll ? "이벤트 묶음" : "분석 대상 묶음"} ${groupCount}개`,
    collectedAt: "수집 기준",
    collectedAtUnknown: "수집 시각 미상",
    sourceSample: "예시 표본",
    sourceLive: "실시간",
    sourceCache: "저장본",
    priceScoreBasis: "가격·점수 기준",
    disclosureCollectionBasis: "공시 수집 기준",
    marketClose: "장마감",
    infoNote: (days: number) =>
      `ℹ 선택한 ${days}일 전체 공시가 아니라, 코스피·코스닥 각 최신 100건(합 200건)에서 자동 추출한 신호입니다. 표시는 최대 50건이며, 선택한 기간의 전체 공시가 포함되지 않을 수 있습니다.`,
    // 기간 필터
    dayUnit: (d: number) => `${d}일`,
    // 표시 범위
    scopeLabel: "표시 범위",
    scopeGroupAria: "공시 표시 범위",
    scopeAll: "전체 시장",
    scopeUniverse: "분석 대상만",
    scopeUniverseStrong: "분석 대상만",
    scopeUniverseDesc: " = 오른스코어가 점수를 산출하는 분석 대상 종목의 공시 · ",
    scopeAllStrong: "전체 시장",
    scopeAllDesc: " = 최신 수집 범위 내 분석 대상 외 종목까지 포함",
    // 타입 필터 '전체'
    filterAll: (count: number) => `전체 ${count}`,
    // 상단 탭(§7-3)
    tabAll: "전체",
    tabWatchlist: "내 관심종목",
    // 제한 안내 배너(§7-5) — 큰 안내 대신 작은 info 배너
    limitBanner: "선택 기간 전체가 아니라 코스피/코스닥 최신 100건씩(합 200건) 안의 최근 수집 공시입니다. 전체 이력은 DART에서 확인하세요.",
    // 예시(샘플) 데이터 안내 — source가 "sample*"일 때만 노출(재검수 P0C)
    sampleNotice: "현재 표시 데이터는 예시입니다. 실제 공시는 DART 원문에서 확인하세요.",
    // 관심종목 탭 빈 상태
    watchlistEmpty: "관심 종목에 담아두면 여기서 공시를 모아볼 수 있어요.",
    watchlistEmptyCta: "종목 담으러 가기",
    // 카드
    autoClassified: "자동분류",
    // 보유 변동(소유상황보고서)에서 '대상 회사'와 '보고자/제출자'를 분리 표기(혼동 방지)
    targetCompanyLabel: "대상 회사",
    reporterLabel: "보고자",
    directionBuy: "장내매수 단서",
    directionSell: "장내매도·처분 단서",
    directionUnknown: "방향 확인 필요",
    revisionIncluded: "정정 포함 ",
    countUnit: (n: number) => `${n}건`,
    submitted: "제출",
    checkLabel: "확인할 것",
    cautionLabel: "주의",
    viewSource: "DART 원문",
    viewStock: "종목 보기",
    viewSourceAria: (name: string) => `${name} DART 원문 열기`,
    viewStockAria: (name: string) => `${name} 종목 상세 보기`,
    explainAria: (name: string, label: string) => `${name} ${label} 공시 이해하기`,
    explainSourceAria: (name: string) => `${name} DART 원문 보기`,
    notInUniverse: "분석 대상 외 · DART 원문만",
    descFallback: "원문과 시세 반응을 함께 확인해 보세요.",
    cautionFallback: "원문에서 세부 수치와 맥락을 확인해야 합니다.",
    // 관심(워치리스트) 토글
    watchRemoveAria: "관심 종목에서 제거",
    watchAddAria: "관심 종목에 추가",
    watchRemoveAriaFor: (name: string) => `${name} 관심 종목에서 제거`,
    watchAddAriaFor: (name: string) => `${name} 관심 종목에 추가`,
    watchAdded: "관심 등록됨",
    watch: "관심",
    // 빈 상태
    empty: "지금 조건에 맞는 신호가 없습니다.",
    emptyReset: "필터를 해제하고 전체 신호 보기",
    emptyWidenScope: "분석 대상 외까지 넓혀 보기",
    // 신호 라벨별 한 줄 의미(키=원문 signalLabel, 데이터 판별자 → 유지)
    descriptions: {
      "자기주식 취득 결정": "회사가 자기주식을 직접 취득하기로 한 결정입니다. 취득 예정 수량·기간·목적과 시총 대비 규모를 원문에서 확인하세요.",
      "자사주 신탁계약 체결": "자기주식 취득을 신탁사에 위탁하는 계약 체결입니다. 신탁 규모와 계약 기간, 실제 취득 시점을 원문에서 확인하세요.",
      "자사주 신탁계약 해지": "자기주식 취득을 위탁했던 신탁계약을 끝낸다는 공시입니다. 신규 취득 결정이 아니며, 해지 사유와 실제 취득 완료 여부를 원문에서 확인하세요.",
      "자기주식 처분 결정": "보유 중인 자기주식을 처분한다는 공시입니다. 취득이 아닌 처분이며, 처분 목적·대상과 오버행 가능성을 원문에서 확인하세요.",
      "자기주식 취득 결의": "주주환원·주가 안정과 관련된 공시입니다. 취득 규모와 소각 여부를 확인하세요.",
      "임원·주요주주 보유 변동": "주요 주주·임원의 지분이 변동됐습니다. 매수·매도 방향을 원문에서 확인하세요.",
      "정정공시": "기존 공시 내용이 바뀌었습니다. 무엇이 정정됐는지 확인하세요.",
      "단일판매·공급계약": "규모가 큰 단일 계약입니다. 매출에 미치는 영향을 확인하세요.",
      "유상증자 발행": "지분 희석과 자금 조달 관련 공시입니다. 용도·규모·가격을 확인하세요.",
      "전환사채 발행": "지분 희석과 자금 조달 관련 공시입니다. 용도·규모·가격을 확인하세요.",
      "신주인수권부사채 발행": "지분 희석과 자금 조달 관련 공시입니다. 용도·규모·가격을 확인하세요.",
    } as Record<string, string>,
    // 타입별 주의 폴백(키=signalType 판별자 → 유지)
    cautionFallbackByType: {
      treasury_buy: "취득 결의일 뿐 실제 매입은 천천히 진행되며, 소각 여부에 따라 의미가 달라집니다.",
      insider_buy: "표시된 '분류 신뢰도(자동분류 확신도)'는 매수 신호가 아니라 보고서를 맞게 분류했다는 확신 정도이므로, 매수·매도 방향은 DART 원문에서 확인하세요.",
      correction: "정정이 잦은 회사는 공시 신뢰도가 떨어질 수 있어 종목 자체 신뢰도 점검이 필요합니다.",
      single_contract: "'계약 금액 = 이익'으로 단순 환산하지 마세요. 마진·거래처 정보가 빠질 수 있습니다.",
      capital_raise: "CB·신주인수권은 향후 주식 전환 시 잠재 매물이 될 수 있습니다.",
    } as Record<string, string>,
  },
  en: {
    loading: (days: number) => `Loading the last ${days} days of DART disclosures...`,
    errorPrefix: "Could not load disclosure data: ",
    errorUnknown: "A temporary error",
    errorTitle: "We couldn't load disclosure data just now",
    errorHelp: "This may be a temporary network issue. Please try again in a moment.",
    errorRetry: "Try again",
    title: "Disclosure signals",
    within200: "Within latest collected 200",
    periodScopeBadge: "Within latest collected 200",
    periodScopeBadgeAria:
      "Collection-scope limit. Shows only within the latest 100 KOSPI and 100 KOSDAQ filings, 200 total, not every filing in the selected period; this is not a filter control.",
    // Repeated missing-coverage note shown next to the result count
    missingFragment: "some may be missing · latest 100 KOSPI/KOSDAQ each",
    // Shared top warning box — hoists notes that used to repeat on every card
    topNoticeTitle: "Common notes for all disclosure cards",
    topNoticeBullets: [
      "Check the original DART filing yourself before deciding.",
      "Collection limit: at most 50 shown within the latest 100 KOSPI + 100 KOSDAQ filings (200 total).",
      "This is a type classification and exploration signal, not a good/bad judgment.",
    ] as readonly string[],
    summary: (days: number, signalCount: number, scopeAll: boolean, groupCount: number) =>
      `Last ${days} days, within latest 200 filings · ${signalCount} signals · ${groupCount} ${scopeAll ? "event groups" : "analyzed groups"}`,
    collectedAt: "Collected as of",
    collectedAtUnknown: "Collection time unknown",
    sourceSample: "Sample data",
    sourceLive: "Live",
    sourceCache: "Cached",
    priceScoreBasis: "Price/score basis",
    disclosureCollectionBasis: "Disclosure collection basis",
    marketClose: "market close",
    infoNote: (days: number) =>
      `ℹ These are not all disclosures for the selected ${days} days. They are auto-extracted from the latest 100 KOSPI and 100 KOSDAQ filings (200 total). At most 50 are shown, and not every filing in the period may be included.`,
    dayUnit: (d: number) => `${d}d`,
    scopeLabel: "Display scope",
    scopeGroupAria: "Disclosure display scope",
    scopeAll: "Whole market",
    scopeUniverse: "Analyzed only",
    scopeUniverseStrong: "Analyzed only",
    scopeUniverseDesc: " = disclosures from stocks OrnScore scores · ",
    scopeAllStrong: "Whole market",
    scopeAllDesc: " = includes stocks outside the analyzed set within the latest collected scope",
    filterAll: (count: number) => `All ${count}`,
    tabAll: "All",
    tabWatchlist: "My watchlist",
    limitBanner: "This is not the full selected period; it is the recent collected subset within the latest 100 KOSPI + 100 KOSDAQ filings (200 total). Check DART for the full history.",
    sampleNotice: "The data shown is example data. Check the actual filings in the DART source.",
    watchlistEmpty: "Add stocks to your watchlist to gather their filings here.",
    watchlistEmptyCta: "Go add stocks",
    autoClassified: "Auto-classified",
    // Ownership-change reports: separate the target company from the reporter/filer to avoid confusion
    targetCompanyLabel: "Target company",
    reporterLabel: "Reporter",
    directionBuy: "On-market buy clue",
    directionSell: "On-market sell·disposal clue",
    directionUnknown: "Direction to be confirmed",
    revisionIncluded: "incl. correction ",
    countUnit: (n: number) => `${n}`,
    submitted: "filed",
    checkLabel: "Check",
    cautionLabel: "Note",
    viewSource: "DART source",
    viewStock: "View stock",
    viewSourceAria: (name: string) => `Open ${name} DART source`,
    viewStockAria: (name: string) => `View ${name} stock detail`,
    explainAria: (name: string, label: string) => `Understand ${name} ${label} disclosure`,
    explainSourceAria: (name: string) => `Open ${name} DART source from explanation`,
    notInUniverse: "Outside analyzed set · DART source only",
    descFallback: "Review alongside the full text and price reaction.",
    cautionFallback: "Confirm detailed figures and context in the source.",
    watchRemoveAria: "Remove from watchlist",
    watchAddAria: "Add to watchlist",
    watchRemoveAriaFor: (name: string) => `Remove ${name} from watchlist`,
    watchAddAriaFor: (name: string) => `Add ${name} to watchlist`,
    watchAdded: "In watchlist",
    watch: "Watch",
    empty: "No signals match right now.",
    emptyReset: "Clear filter and view all signals",
    emptyWidenScope: "Include stocks outside coverage",
    descriptions: {
      "자기주식 취득 결정":
        "A decision to buy back the company's own shares directly. Confirm the planned quantity, period, purpose, and size vs. market cap in the source.",
      "자사주 신탁계약 체결":
        "A trust contract entrusting a buyback to a trustee. Confirm the trust size, contract period, and actual purchase timing in the source.",
      "자사주 신탁계약 해지":
        "This ends a previously signed buyback trust contract. It is not a new buyback decision; confirm the termination reason and whether purchases were actually completed.",
      "자기주식 처분 결정":
        "A decision to dispose of treasury shares held. This is a disposal, not an acquisition; confirm the purpose, recipients, and overhang risk in the source.",
      "자기주식 취득 결의":
        "This is a shareholder-return / price-stability event. Confirm the buyback size and whether shares will be cancelled.",
      "임원·주요주주 보유 변동":
        "Major shareholder / insider holdings changed. Confirm the buy or sell direction in the source.",
      "정정공시": "A prior disclosure was changed. Confirm what was revised.",
      "단일판매·공급계약": "This is a large single contract. Confirm its impact on revenue.",
      "유상증자 발행": "This is a dilution / financing disclosure. Confirm the structure (purpose, size, price).",
      "전환사채 발행": "This is a dilution / financing disclosure. Confirm the structure (purpose, size, price).",
      "신주인수권부사채 발행": "This is a dilution / financing disclosure. Confirm the structure (purpose, size, price).",
    } as Record<string, string>,
    cautionFallbackByType: {
      treasury_buy:
        "This is only a buyback resolution; actual purchases proceed gradually, and the meaning depends on whether shares are cancelled.",
      insider_buy:
        "The classification confidence shown here is not a buy signal but how sure we are the report was categorized correctly, so confirm the buy/sell direction in the DART source.",
      correction:
        "Companies that correct often may have lower disclosure reliability, so check the stock's own reliability.",
      single_contract:
        "Do not simply equate 'contract value = profit'. Margin and counterparty details may be missing.",
      capital_raise:
        "CBs and warrants can become potential supply once converted into shares later.",
    } as Record<string, string>,
  },
} as const satisfies Record<Locale, unknown>;

/** DisclosureSummaryCards(클라이언트) — 타입별 요약 카드 문구. */
export const disclosureSummaryCopy = {
  ko: {
    recentCount: (days: number, count: number) => `최근 ${days}일 · ${count}건`,
    noEvents: "이벤트 없음",
    bottomNote: (days: number, total: number) =>
      `최근 ${days}일 공시를 5개 유형으로 자동 분류한 결과입니다 · 전체 ${total}건. 좋고 나쁨을 판단한 것이 아니라 유형만 나눈 분류입니다.`,
  },
  en: {
    recentCount: (days: number, count: number) => `Last ${days}d · ${count}`,
    noEvents: "No events",
    bottomNote: (days: number, total: number) =>
      `Auto-classified the last ${days} days of disclosures into 5 types · ${total} total. This is a type classification, not a good/bad judgment.`,
  },
} as const satisfies Record<Locale, unknown>;
