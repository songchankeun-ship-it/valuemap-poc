// 최근 본 종목 — RecentViewTracker가 기록한 localStorage를 읽는 단일 소스.
// 관심 종목 페이지(WatchlistClient)와 비교 시작 화면(CompareClient)이 같은 리더를 공유한다.

export interface RecentView {
  ticker: string;
  name: string;
  // RecentViewTracker는 Date.now()(밀리초 숫자)로 기록한다. 과거 버전이 ISO 문자열을
  // 남겼을 수 있어 읽을 때 숫자로 정규화한다(getRecentViews 참고).
  viewedAt: number;
}

const RECENT_KEY = "ornscore_recent_views";
const LEGACY_RECENT_KEY = "valuemap_recent_views";

// viewedAt을 숫자(ms)로 정규화한다. 숫자면 그대로, ISO 문자열이면 Date.parse,
// 그 외에는 비정상으로 보고 NaN을 돌려 상위에서 걸러내게 한다.
function normalizeViewedAt(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n; // 숫자 문자열("1700000000000")
    return Date.parse(value); // ISO 문자열 → ms (실패 시 NaN)
  }
  return NaN;
}

/**
 * 최근 본 종목 목록을 SSR-safe하게 읽는다(레거시 `valuemap_recent_views` 키 폴백, 최근 10개).
 * 저장은 RecentViewTracker가 담당하며 여기서는 읽기만 한다(날조 없음).
 * viewedAt은 숫자(ms)로 정규화하고, 형식이 깨졌거나 비유한 값은 버린다.
 */
export function getRecentViews(): RecentView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY) ?? localStorage.getItem(LEGACY_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned: RecentView[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const { ticker, name } = item as { ticker?: unknown; name?: unknown };
      if (typeof ticker !== "string" || typeof name !== "string") continue;
      const viewedAt = normalizeViewedAt((item as { viewedAt?: unknown }).viewedAt);
      if (!Number.isFinite(viewedAt)) continue;
      cleaned.push({ ticker, name, viewedAt });
    }
    return cleaned.slice(0, 10);
  } catch {
    return [];
  }
}
