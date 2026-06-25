// 최근 본 종목 — RecentViewTracker가 기록한 localStorage를 읽는 단일 소스.
// 관심 종목 페이지(WatchlistClient)와 비교 시작 화면(CompareClient)이 같은 리더를 공유한다.

export interface RecentView {
  ticker: string;
  name: string;
  viewedAt: string;
}

const RECENT_KEY = "ornscore_recent_views";
const LEGACY_RECENT_KEY = "valuemap_recent_views";

/**
 * 최근 본 종목 목록을 SSR-safe하게 읽는다(레거시 `valuemap_recent_views` 키 폴백, 최근 10개).
 * 저장은 RecentViewTracker가 담당하며 여기서는 읽기만 한다(날조 없음).
 */
export function getRecentViews(): RecentView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY) ?? localStorage.getItem(LEGACY_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 10);
  } catch {
    return [];
  }
}
