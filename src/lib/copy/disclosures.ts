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
    limitedBadge: "제한 수집",
    title: "공시 신호",
    descLead: "최근 7일 코스피·코스닥 공시에서 자체 추출한 ",
    descStrong: "5가지 시장 신호",
    descTail: ". 자기주식 취득, 임원·주요주주 보유 변동, 손익 정정, 대형 계약, 유증/CB.",
    collapseSummary: "수집 범위 안내 — 최신 200건 내 분석",
    collapseBody:
      "선택한 기간 전체 공시가 아니라, 코스피·코스닥 각 최신 100건(합 200건)에서 자동 추출한 신호입니다. 표시는 최대 50건이며, 선택한 기간의 전체 공시가 포함되지 않아 일부 공시가 누락될 수 있습니다.",
    bottomNote:
      "본 페이지의 신호는 DART 공시 보고서명 매칭 기반 1차 필터입니다. 본문 확인 + 시세 추이 검토 후 판단하세요. 투자 권유가 아닙니다.",
  },
  en: {
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Disclosure signals",
    limitedBadge: "Limited collection",
    title: "Disclosure signals",
    descLead: "From the last 7 days of KOSPI·KOSDAQ disclosures, we extract ",
    descStrong: "5 market signals",
    descTail:
      ": treasury share buybacks, insider/major shareholder holdings changes, earnings corrections, large contracts, and rights/CB issuance.",
    collapseSummary: "Collection scope — analyzed within the latest 200 filings",
    collapseBody:
      "These are not all disclosures in the selected period. They are signals auto-extracted from the latest 100 KOSPI and 100 KOSDAQ filings (200 total). At most 50 are shown, and because not every filing in the period is included, some disclosures may be missing.",
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
    within200: "최신 200건 내",
    periodScopeBadge: "선택 기간 전체 아님 · 최신 200건 내",
    summary: (days: number, signalCount: number, scopeAll: boolean, groupCount: number) =>
      `최근 ${days}일 · 최신 200건 내 신호 ${signalCount}건 · ${scopeAll ? "이벤트 묶음" : "분석 대상 묶음"} ${groupCount}개`,
    collectedAt: "수집 기준",
    collectedAtUnknown: "수집 시각 미상",
    sourceSample: "예시 표본",
    sourceLive: "실시간",
    sourceCache: "저장본",
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
    scopeAllDesc: " = 분석 대상 외 종목까지 포함한 DART 전체 공시",
    // 타입 필터 '전체'
    filterAll: (count: number) => `전체 ${count}`,
    // 카드
    autoClassified: "자동분류",
    directionBuy: "장내매수 단서",
    directionSell: "장내매도·처분 단서",
    directionUnknown: "방향 확인 필요",
    revisionIncluded: "정정 포함 ",
    countUnit: (n: number) => `${n}건`,
    submitted: "제출",
    checkLabel: "확인할 것",
    cautionLabel: "주의:",
    viewSource: "원문 보기",
    viewStock: "종목 보기",
    notInUniverse: "분석 대상 외 · DART 원문만",
    descFallback: "원문과 시세 반응 함께 확인 권장.",
    cautionFallback: "원문에서 세부 수치·맥락 확인 필요.",
    // 관심(워치리스트) 토글
    watchRemoveAria: "관심 종목에서 제거",
    watchAddAria: "관심 종목에 추가",
    watchAdded: "관심 등록됨",
    watch: "관심",
    // 빈 상태
    empty: "지금 조건에 맞는 신호가 없습니다.",
    emptyReset: "필터를 해제하고 전체 신호 보기",
    emptyWidenScope: "전체 시장 공시까지 넓혀 보기",
    // 신호 라벨별 한 줄 의미(키=원문 signalLabel, 데이터 판별자 → 유지)
    descriptions: {
      "자기주식 취득 결의": "주주환원·주가 안정 관련 이벤트. 취득 규모·소각 여부 확인 필요.",
      "임원·주요주주 보유 변동": "주요 주주·임원 지분 변화. 매수·매도 방향 원문 확인 필요.",
      "정정공시": "기존 공시 내용 변경 확인 필요.",
      "단일판매·공급계약": "계약 규모의 매출 영향 확인 필요.",
      "유상증자 발행": "희석·자금조달 구조(용도·규모·가격) 확인 필요.",
      "전환사채 발행": "희석·자금조달 구조(용도·규모·가격) 확인 필요.",
      "신주인수권부사채 발행": "희석·자금조달 구조(용도·규모·가격) 확인 필요.",
    } as Record<string, string>,
    // 타입별 주의 폴백(키=signalType 판별자 → 유지)
    cautionFallbackByType: {
      treasury_buy: "취득 결의일 뿐 실제 매입은 천천히 진행되며, 소각 여부에 따라 의미가 달라집니다.",
      insider_buy: "여기 표시되는 '분류 신뢰도(자동분류 확신도)'는 호재 점수가 아니라 보고서를 맞게 분류했다는 확신 정도입니다. 매수/매도 방향은 DART 원문에서 확인하세요.",
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
    within200: "Within latest 200",
    periodScopeBadge: "Not the full period · within latest 200",
    summary: (days: number, signalCount: number, scopeAll: boolean, groupCount: number) =>
      `Last ${days} days · ${signalCount} signals within latest 200 · ${groupCount} ${scopeAll ? "event groups" : "analyzed groups"}`,
    collectedAt: "Collected as of",
    collectedAtUnknown: "Collection time unknown",
    sourceSample: "Sample data",
    sourceLive: "Live",
    sourceCache: "Cached",
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
    scopeAllDesc: " = all DART disclosures, including stocks outside the analyzed set",
    filterAll: (count: number) => `All ${count}`,
    autoClassified: "Auto-classified",
    directionBuy: "On-market buy clue",
    directionSell: "On-market sell·disposal clue",
    directionUnknown: "Direction to be confirmed",
    revisionIncluded: "incl. correction ",
    countUnit: (n: number) => `${n}`,
    submitted: "filed",
    checkLabel: "Check",
    cautionLabel: "Note:",
    viewSource: "View source",
    viewStock: "View stock",
    notInUniverse: "Outside analyzed set · DART source only",
    descFallback: "Review alongside the full text and price reaction.",
    cautionFallback: "Confirm detailed figures and context in the source.",
    watchRemoveAria: "Remove from watchlist",
    watchAddAria: "Add to watchlist",
    watchAdded: "In watchlist",
    watch: "Watch",
    empty: "No signals match right now.",
    emptyReset: "Clear filter and view all signals",
    emptyWidenScope: "Widen to whole-market disclosures",
    descriptions: {
      "자기주식 취득 결의":
        "Shareholder-return / price-stability event. Confirm buyback size and whether shares will be cancelled.",
      "임원·주요주주 보유 변동":
        "Change in major shareholder / insider holdings. Confirm buy or sell direction in the source.",
      "정정공시": "A change to a prior disclosure — confirm what was revised.",
      "단일판매·공급계약": "Confirm the contract's impact on revenue.",
      "유상증자 발행": "Confirm the dilution / financing structure (purpose, size, price).",
      "전환사채 발행": "Confirm the dilution / financing structure (purpose, size, price).",
      "신주인수권부사채 발행": "Confirm the dilution / financing structure (purpose, size, price).",
    } as Record<string, string>,
    cautionFallbackByType: {
      treasury_buy:
        "This is only a buyback resolution; actual purchases proceed gradually, and the meaning depends on whether shares are cancelled.",
      insider_buy:
        "The 'classification confidence (auto-classification certainty)' shown here is not a positivity score but how sure we are the report was categorized correctly. Confirm the buy/sell direction in the DART source.",
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
      `최근 ${days}일 공시를 5개 유형으로 자동 분류한 결과 · 전체 ${total}건. 호재/악재 판단이 아닌 분류입니다.`,
  },
  en: {
    recentCount: (days: number, count: number) => `Last ${days}d · ${count}`,
    noEvents: "No events",
    bottomNote: (days: number, total: number) =>
      `Auto-classified the last ${days} days of disclosures into 5 types · ${total} total. This is classification, not a positive/negative judgment.`,
  },
} as const satisfies Record<Locale, unknown>;
