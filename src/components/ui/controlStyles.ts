// 상호작용 컨트롤(버튼·링크·입력)의 공통 포커스 스타일 토큰.
// Tailwind 정적 스캔을 위해 전부 리터럴 문자열이며, 런타임 팔레트 합성은 하지 않는다.
// 표준 근거 — 저장소에 이미 존재하는 다수 패턴을 그대로 채택:
//   · 버튼 포커스 링(outline): HomeHero, StockCandidateCard, SignalStockCard
//   · 입력 포커스(테두리+옅은 링): StockSearchBox, StocksExplorer 검색, GlobalSearch

/** 밝은 배경 위 버튼/링크의 키보드 포커스 링(파랑 아웃라인). */
export const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

/** 색상(딥블루 등) 배경 위 버튼의 포커스 링(흰색 아웃라인). */
export const FOCUS_RING_ON_DARK =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** 입력 필드 공통 포커스(파랑 테두리 + 옅은 링). */
export const INPUT_FOCUS =
  "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40";
