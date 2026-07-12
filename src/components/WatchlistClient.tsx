"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, X, Clock, ArrowRight, SlidersHorizontal, LayoutDashboard, Bell, ArrowUpDown, Scale, Search, Download } from "lucide-react";
import { StockSearchBox } from "@/components/StockSearchBox";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  type WatchlistItem,
} from "@/lib/watchlist";
import { addToCompare, COMPARE_MAX } from "@/lib/compare";
import { getRecentViews, type RecentView } from "@/lib/recentViews";
import { listSavedSearches, type SavedSearch, type SavedSearchConfig } from "@/lib/savedSearches";
import { matchesConfig, type StockForMatch } from "@/lib/matchConfig";
import { useLanguage } from "@/components/LanguageProvider";
import { commonCopy } from "@/lib/i18n";
import { fmtRelativeTime } from "@/lib/format";
import { buildWatchlistCsv, watchlistCsvFilename } from "@/lib/watchlistCsv";
import {
  WATCHLIST_GROUP_OPTIONS,
  WATCHLIST_META_CHANGED_EVENT,
  WATCHLIST_NOTE_MAX_LENGTH,
  attachWatchlistMeta,
  readWatchlistMeta,
  setWatchlistMetaForTicker,
  writeWatchlistMeta,
  type WatchlistMeta,
  type WatchlistMetaByTicker,
} from "@/lib/watchlistMeta";
import { trackEvent } from "@/lib/clientAnalytics";
import { FOCUS_RING } from "@/components/ui/controlStyles";

const RECENT_KEY = "ornscore_recent_views";
const VIEW_KEY = "ornscore_watchlist_view";
const LEGACY_VIEW_KEY = "valuemap_watchlist_view";
const SORT_KEY = "ornscore_watchlist_sort";
const GROUP_FILTER_KEY = "ornscore_watchlist_group_filter";
const GROUP_FILTER_ALL = "__all__";
const GROUP_FILTER_UNGROUPED = "__ungrouped__";
// StocksExplorer가 저장하는 최근 검색어 키를 그대로 읽어(표시 전용) 루틴 화면에서 재검색으로 잇는다.
const RECENT_SEARCH_KEY = "ornscore_recent_stock_searches";

type SortKey = "recent" | "change" | "score" | "name";
type GroupFilterKey = string;
const SORT_LABELS: Record<SortKey, string> = {
  recent: "최신순",
  change: "변화순",
  score: "점수순",
  name: "가나다순",
};
const SORT_ORDER: SortKey[] = ["recent", "change", "score", "name"];

function groupFilterKind(value: GroupFilterKey): "all" | "ungrouped" | "group" {
  if (value === GROUP_FILTER_ALL) return "all";
  if (value === GROUP_FILTER_UNGROUPED) return "ungrouped";
  return "group";
}

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

const CAP_LABELS: Record<string, string> = { large: "대형주", mid: "중형주", small: "소형주" };

/** 저장 필터 조건을 짧은 자연어로 요약(표시용, 산식·점수 무관) */
function describeConfig(c: SavedSearchConfig): string {
  const parts: string[] = [];
  if (c.query) parts.push(`"${c.query}"`);
  if (c.minComposite) parts.push(`종합 ${c.minComposite}점+`);
  if (c.valueMin) parts.push(`밸류 ${c.valueMin}+`);
  if (c.momentumMin) parts.push(`추세 ${c.momentumMin}+`);
  if (c.flowMin) parts.push(`거래활성도 ${c.flowMin}+`);
  if (c.volMin) parts.push(`위험조정 ${c.volMin}+`);
  if (c.roeMin) parts.push(`ROE ${c.roeMin}%+`);
  if (c.divYieldMin) parts.push(`배당 ${c.divYieldMin}%+`);
  if (c.perMax) parts.push(`PER ${c.perMax}↓`);
  if (c.pbrMax) parts.push(`PBR ${c.pbrMax}↓`);
  if (c.capBucket && c.capBucket !== "all" && CAP_LABELS[c.capBucket]) parts.push(CAP_LABELS[c.capBucket]);
  if (c.market && c.market !== "all") parts.push(c.market);
  if (c.excludeLoss) parts.push("적자 제외");
  if (c.sector) parts.push(`업종: ${c.sector}`);
  if (c.themes && c.themes.length > 0) {
    parts.push("테마: " + c.themes.slice(0, 2).join("·") + (c.themes.length > 2 ? ` 외 ${c.themes.length - 2}` : ""));
  }
  return parts.length > 0 ? parts.join(" · ") : "조건 지정 없음(전체)";
}

type StockInfo = {
  ticker: string;
  name: string;
  momentum?: number;
  flow?: number;
  value?: number;
  vol?: number;
  compositeScore?: number;
};

type SignalInfo = {
  signalLabel: string;
  signalType: string;
  strength: number;
};

const SIGNAL_TONE: Record<string, string> = {
  treasury_buy: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  insider_buy: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  correction: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  single_contract: "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900",
  capital_raise: "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-900",
};

export function WatchlistClient({
  allStocks,
  matchPool = [],
  tickerToSignal = {},
  tickerToDelta = {},
  isLoggedIn = false,
  exampleStocks = [],
  todayCompareTickers = [],
}: {
  allStocks: StockInfo[];
  matchPool?: StockForMatch[];
  tickerToSignal?: Record<string, SignalInfo>;
  tickerToDelta?: Record<string, number>;
  isLoggedIn?: boolean;
  // 관심 종목이 비어 있을 때만 쓰는 예시 종목(서버에서 실제 필드로 결정적 선택 · isSuspect 제외 · 매수·매도 추천 아님)
  exampleStocks?: { ticker: string; name: string; reason: string }[];
  // 홈/비교 페이지와 같은 오늘 후보 상위 3개. 클릭 시 비교 화면으로만 이어지고 관심 종목에는 저장하지 않는다.
  todayCompareTickers?: string[];
}) {
  const { locale } = useLanguage();
  const authCopy = commonCopy[locale].auth;
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [watchlistMeta, setWatchlistMeta] = useState<WatchlistMetaByTicker>({});
  const watchlistMetaRef = useRef<WatchlistMetaByTicker>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState<"simple" | "analysis">("simple");
  const [sort, setSort] = useState<SortKey>("recent");
  const [groupFilter, setGroupFilter] = useState<GroupFilterKey>(GROUP_FILTER_ALL);
  const [hydrated, setHydrated] = useState(false);
  // 방금 제거한 종목 — 실수로 뺀 경우 되돌리기(5초 자동 소멸, compare와 동일 패턴)
  const [undoStock, setUndoStock] = useState<{ ticker: string; name: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 비교함 담기 피드백(3초 자동 소멸) — aria-live로 변화 안내, 담기 로직은 compare.ts 그대로
  const [compareNotice, setCompareNotice] = useState<string | null>(null);
  const compareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHydrated(true);
    // 시크릿 모드·저장소 차단 환경에서 localStorage 접근이 예외를 던질 수 있어 방어
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem(VIEW_KEY) ?? localStorage.getItem(LEGACY_VIEW_KEY) : null;
      if (v === "analysis" || v === "simple") setView(v);
    } catch {
      // 저장소 사용 불가 — 기본 보기(simple) 유지
    }
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem(SORT_KEY) : null;
      if (s === "recent" || s === "change" || s === "score" || s === "name") setSort(s);
    } catch {
      // 저장소 사용 불가 — 기본 정렬(recent) 유지
    }
    try {
      const g = typeof window !== "undefined" ? localStorage.getItem(GROUP_FILTER_KEY) : null;
      if (g === GROUP_FILTER_ALL || g === GROUP_FILTER_UNGROUPED || (g && g.length <= 40)) setGroupFilter(g);
    } catch {
      // 저장소 사용 불가 — 기본 그룹 필터(전체) 유지
    }
    setRecentSearches(readRecentSearches());
    const storedMeta = readWatchlistMeta();
    watchlistMetaRef.current = storedMeta;
    setWatchlistMeta(storedMeta);
  }, []);

  function changeSort(s: SortKey) {
    setSort(s);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SORT_KEY, s);
      } catch {
        // 저장 실패 — 이번 세션에는 정렬이 반영되지만 새로고침 시 복원되지 않음
      }
    }
  }

  function changeGroupFilter(next: GroupFilterKey, count: number) {
    setGroupFilter(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(GROUP_FILTER_KEY, next);
      } catch {
        // 저장 실패 — 이번 세션에는 필터가 반영되지만 새로고침 시 복원되지 않음
      }
    }
    trackEvent("watchlist_group_filter_change", {
      filter: groupFilterKind(next),
      count,
      loggedIn: isLoggedIn,
    });
  }

  function changeView(v: "simple" | "analysis") {
    setView(v);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(VIEW_KEY, v);
        localStorage.removeItem(LEGACY_VIEW_KEY);
      } catch {
        // 저장 실패 — 현재 세션에는 보기 전환이 반영되지만 새로고침 시 복원되지 않음
      }
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const wl = await getWatchlist();
        if (mounted) {
          setWatchlist(wl);
          setRecent(getRecentViews());
        }
      } catch {
        if (mounted) setLoadError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    listSavedSearches().then((r) => { if (mounted) setSavedSearches(r); }).catch(() => {});
    // 무한 로딩 방지 — 8초 후 강제 종료
    const loadTimeout = setTimeout(() => { if (mounted) setLoading(false); }, 8000);

    function onWatchlistChange() {
      getWatchlist().then((wl) => {
        if (mounted) setWatchlist(wl);
      });
    }
    function onRecentChange() {
      if (mounted) setRecent(getRecentViews());
    }
    function onSavedChange() {
      listSavedSearches().then((r) => { if (mounted) setSavedSearches(r); }).catch(() => {});
    }
    function onMetaChange() {
      if (!mounted) return;
      const storedMeta = readWatchlistMeta();
      watchlistMetaRef.current = storedMeta;
      setWatchlistMeta(storedMeta);
    }

    window.addEventListener("watchlist-changed", onWatchlistChange);
    window.addEventListener("recent-views-changed", onRecentChange);
    window.addEventListener("saved-searches-changed", onSavedChange);
    window.addEventListener("storage", onSavedChange);
    window.addEventListener(WATCHLIST_META_CHANGED_EVENT, onMetaChange);
    window.addEventListener("storage", onMetaChange);

    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
      window.removeEventListener("watchlist-changed", onWatchlistChange);
      window.removeEventListener("recent-views-changed", onRecentChange);
      window.removeEventListener("saved-searches-changed", onSavedChange);
      window.removeEventListener("storage", onSavedChange);
      window.removeEventListener(WATCHLIST_META_CHANGED_EVENT, onMetaChange);
      window.removeEventListener("storage", onMetaChange);
    };
  }, []);

  // 언마운트 시 대기 중인 되돌리기·비교 안내 타이머 해제
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      if (compareTimer.current) clearTimeout(compareTimer.current);
    };
  }, []);

  // 비교함에 담기 — compare.ts의 저장/제한 로직을 그대로 쓰고 결과만 안내(중복·최대치 정직 피드백)
  async function handleAddCompare(name: string, ticker: string) {
    const res = await addToCompare(ticker);
    const msg = res.ok
      ? res.reason === "already"
        ? `${name}은(는) 이미 비교함에 있어요.`
        : `${name}을(를) 비교함에 담았어요.`
      : res.reason === "max"
        ? `비교함은 최대 ${COMPARE_MAX}개까지 담을 수 있어요.`
        : "비교함에 담지 못했어요. 잠시 후 다시 시도해 주세요.";
    setCompareNotice(msg);
    if (compareTimer.current) clearTimeout(compareTimer.current);
    compareTimer.current = setTimeout(() => setCompareNotice(null), 3000);
  }

  async function handleRemove(ticker: string, name: string) {
    setWatchlist((prev) => prev.filter((i) => i.ticker !== ticker)); // 낙관적
    await removeFromWatchlist(ticker);
    // 방금 뺀 종목을 잠시 보관해 되돌릴 수 있게 안내
    setUndoStock({ ticker, name });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoStock(null), 5000);
  }

  // 제거 되돌리기 — 같은 낙관적 setState·이벤트 흐름으로 다시 담기
  async function undoRemove() {
    const target = undoStock;
    if (!target) return;
    setUndoStock(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    await addToWatchlist(target.ticker);
  }

  function clearRecent() {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
    window.dispatchEvent(new CustomEvent("recent-views-changed"));
  }

  function updateWatchlistMeta(ticker: string, patch: WatchlistMeta, shouldTrack = true) {
    const field = patch.group !== undefined ? "group" : "note";
    const value = patch.group ?? patch.note ?? "";
    const next = setWatchlistMetaForTicker(watchlistMetaRef.current, ticker, patch);
    watchlistMetaRef.current = next;
    setWatchlistMeta(next);
    writeWatchlistMeta(next);
    if (shouldTrack) {
      trackEvent("watchlist_meta_update", {
        field,
        ticker,
        hasValue: value.trim().length > 0,
        loggedIn: isLoggedIn,
      });
    }
  }

  function downloadWatchlistCsv() {
    if (watchlist.length === 0 || typeof window === "undefined") return;

    const csv = buildWatchlistCsv(sortedWatchlistWithMeta, allStocks);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = watchlistCsvFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    trackEvent("watchlist_csv_export", { count: watchlist.length, loggedIn: isLoggedIn, sort });
  }

  function matchCountOf(config: SavedSearchConfig): number {
    if (matchPool.length === 0) return 0;
    let n = 0;
    for (const s of matchPool) if (matchesConfig(s, config)) n += 1;
    return n;
  }

  if (!hydrated) return null;

  if (loading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="관심 종목 불러오는 중">
        {/* 내 현황 요약 카드 자리 */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
          <div className="flex items-stretch gap-2 flex-wrap">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 min-w-[90px] h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            ))}
          </div>
        </section>
        {/* 관심 종목 목록 자리 */}
        <section>
          <div className="h-5 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-4" />
          <ul className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
                  <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
                </div>
                <div className="h-6 w-6 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse shrink-0" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center space-y-2">
        <div>관심 종목을 불러오지 못했어요.</div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">일시적인 문제일 수 있어요. 잠시 후 다시 시도해 주세요.</p>
        <button onClick={() => window.location.reload()} className={`inline-flex items-center justify-center min-h-[44px] text-xs px-3.5 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition ${FOCUS_RING}`}>다시 시도</button>
      </div>
    );
  }

  // 관심 종목 점수 변화 요약(오늘 기준 · 중립 표현)
  let upCount = 0;
  let downCount = 0;
  let flatCount = 0;
  for (const item of watchlist) {
    const d = tickerToDelta[item.ticker];
    const r = d === undefined ? 0 : Math.round(d);
    if (r > 0) upCount += 1;
    else if (r < 0) downCount += 1;
    else flatCount += 1;
  }

  // 오늘 변화가 있는 종목 — 점수 델타 또는 공시 신호가 있는 관심 종목만(참고 표시, 매매 추천 아님)
  // 실제 존재하는 필드(종합 점수 델타·공시 신호)만 사용하고 지표별 델타는 만들지 않는다.
  const changed = watchlist
    .map((item) => {
      const info = allStocks.find((s) => s.ticker === item.ticker);
      const rawDelta = tickerToDelta[item.ticker];
      const delta = rawDelta === undefined ? 0 : Math.round(rawDelta);
      return {
        ticker: item.ticker,
        name: info?.name ?? item.ticker,
        delta,
        signal: tickerToSignal[item.ticker],
      };
    })
    .filter((c) => c.delta !== 0 || c.signal !== undefined)
    .sort((a, b) => {
      const byDelta = Math.abs(b.delta) - Math.abs(a.delta);
      if (byDelta !== 0) return byDelta;
      return (b.signal?.strength ?? 0) - (a.signal?.strength ?? 0);
    })
    .slice(0, 3);

  // 관심 종목 목록 정렬(표시 전용 · watchlist.ts 저장 순서는 건드리지 않음)
  const sortedWatchlist = [...watchlist].sort((a, b) => {
    if (sort === "recent") return b.addedAt.localeCompare(a.addedAt); // ISO 문자열 → 최신 추가 우선
    if (sort === "change") {
      const da = Math.abs(Math.round(tickerToDelta[a.ticker] ?? 0));
      const db = Math.abs(Math.round(tickerToDelta[b.ticker] ?? 0));
      if (db !== da) return db - da;
      return (tickerToSignal[b.ticker]?.strength ?? 0) - (tickerToSignal[a.ticker]?.strength ?? 0);
    }
    if (sort === "score") {
      const sa = allStocks.find((s) => s.ticker === a.ticker)?.compositeScore ?? -1;
      const sb = allStocks.find((s) => s.ticker === b.ticker)?.compositeScore ?? -1;
      return sb - sa;
    }
    // name — 가나다순(한글 로케일 비교)
    const na = allStocks.find((s) => s.ticker === a.ticker)?.name ?? a.ticker;
    const nb = allStocks.find((s) => s.ticker === b.ticker)?.name ?? b.ticker;
    return na.localeCompare(nb, "ko");
  });
  const sortedWatchlistWithMeta = attachWatchlistMeta(sortedWatchlist, watchlistMeta);
  const groupedWatchlistCount = sortedWatchlistWithMeta.filter((item) => item.group).length;
  const notedWatchlistCount = sortedWatchlistWithMeta.filter((item) => item.note).length;
  const ungroupedWatchlistCount = sortedWatchlistWithMeta.length - groupedWatchlistCount;
  const groupCounts = new Map<string, number>();
  for (const item of sortedWatchlistWithMeta) {
    if (!item.group) continue;
    groupCounts.set(item.group, (groupCounts.get(item.group) ?? 0) + 1);
  }
  const presetGroupSet = new Set<string>(WATCHLIST_GROUP_OPTIONS);
  const customGroups = Array.from(groupCounts.keys())
    .filter((group) => !presetGroupSet.has(group))
    .sort((a, b) => a.localeCompare(b, "ko"));
  const groupsInUse = [
    ...WATCHLIST_GROUP_OPTIONS.filter((group) => groupCounts.has(group)),
    ...customGroups,
  ];
  const groupFilterOptions: { value: GroupFilterKey; label: string; count: number }[] = [
    { value: GROUP_FILTER_ALL, label: "전체", count: sortedWatchlistWithMeta.length },
    ...(ungroupedWatchlistCount > 0 || groupFilter === GROUP_FILTER_UNGROUPED
      ? [{ value: GROUP_FILTER_UNGROUPED, label: "미분류", count: ungroupedWatchlistCount }]
      : []),
    ...groupsInUse.map((group) => ({ value: group, label: group, count: groupCounts.get(group) ?? 0 })),
  ];
  if (
    groupFilter !== GROUP_FILTER_ALL &&
    groupFilter !== GROUP_FILTER_UNGROUPED &&
    !groupFilterOptions.some((option) => option.value === groupFilter)
  ) {
    groupFilterOptions.push({ value: groupFilter, label: groupFilter, count: 0 });
  }
  const activeGroupFilter = groupFilterOptions.some((option) => option.value === groupFilter)
    ? groupFilter
    : GROUP_FILTER_ALL;
  const filteredWatchlist = sortedWatchlistWithMeta.filter((item) => {
    if (activeGroupFilter === GROUP_FILTER_ALL) return true;
    if (activeGroupFilter === GROUP_FILTER_UNGROUPED) return !item.group;
    return item.group === activeGroupFilter;
  });
  const activeGroupFilterLabel = groupFilterOptions.find((option) => option.value === activeGroupFilter)?.label ?? "전체";
  const showGroupFilters = watchlist.length > 0 && (groupedWatchlistCount > 0 || activeGroupFilter !== GROUP_FILTER_ALL);

  // 관심 종목 비교하기 CTA — 담아둔 종목 앞에서부터 최대 COMPARE_MAX개를 비교 화면에 시드
  const compareSeed = filteredWatchlist.slice(0, COMPARE_MAX).map((i) => i.ticker);
  const todayCompareHref =
    todayCompareTickers.length >= 2
      ? `/compare?stocks=${todayCompareTickers.slice(0, 3).join(",")}`
      : "/compare";

  const hasAnything = watchlist.length > 0 || recent.length > 0 || savedSearches.length > 0;

  // 오늘 점수 델타 칩(표시 전용 · 종합 점수 델타만 · 0이면 표시 안 함 · 매수·매도 추천 아님)
  const deltaChip = (ticker: string) => {
    const raw = tickerToDelta[ticker];
    const d = raw === undefined ? 0 : Math.round(raw);
    if (d === 0) return null;
    return (
      <span className={"shrink-0 inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded " + (d > 0 ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400")}>
        {d > 0 ? "▲" : "▼"}{Math.abs(d)}
      </span>
    );
  };
  // 최근 본 종목 중 오늘 점수가 움직인 개수 — 담은 종목이 없어도 루틴 요약을 보여주기 위한 참고 표시
  const recentMoved = recent.filter((r) => Math.round(tickerToDelta[r.ticker] ?? 0) !== 0).length;

  return (
    <div className="space-y-8">
      {/* 내 현황 요약 — 재방문 개인화 출발점 */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">내 현황</h2>
        </div>
        {!hasAnything ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed break-words">
            여기는 다시 방문했을 때 <strong className="text-zinc-800 dark:text-zinc-200">내 관심 종목·최근 본 종목·저장한 필터</strong>를 한곳에서 보는 개인 출발점이에요. 종목을 관심에 담거나 탐색 조건을 저장하면 다음 방문부터 이 화면이 채워집니다.
          </p>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-stretch gap-2 flex-wrap">
              {([
                ["관심 종목", watchlist.length],
                ["최근 본 종목", recent.length],
                ["저장한 필터", savedSearches.length],
              ] as const).map(([label, n]) => (
                <div key={label} className="flex-1 min-w-[90px] bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{n}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 break-keep">{label}</div>
                </div>
              ))}
            </div>
            {watchlist.length > 0 ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug break-words tabular-nums">
                <span className="text-zinc-500 dark:text-zinc-500">관심 종목 변화(오늘):</span>{" "}
                점수 오른 종목 <strong className="text-red-600 dark:text-red-400">{upCount}</strong> ·
                내린 종목 <strong className="text-blue-600 dark:text-blue-400">{downCount}</strong> ·
                변동 없음 <strong className="text-zinc-700 dark:text-zinc-300">{flatCount}</strong>
                <span className="block mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">점수 변화는 참고 정보이며 매수·매도 추천이 아닙니다.</span>
              </p>
            ) : recent.length > 0 ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug break-words tabular-nums">
                <span className="text-zinc-500 dark:text-zinc-500">최근 본 종목 오늘 변화:</span>{" "}
                점수가 움직인 종목 <strong className="text-zinc-800 dark:text-zinc-200">{recentMoved}</strong> / {recent.length}
                <span className="block mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">아래에서 바로 관심 종목에 담아 이 화면에서 추적을 시작할 수 있어요.</span>
              </p>
            ) : null}
          </div>
        )}
        {/* 알림 설정 연결 — 관심 종목·저장 필터 변화를 알림으로 (중립 안내, 압박 문구 없음) */}
        <Link
          href="/settings/notifications"
          className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-2.5 min-h-[44px] hover:border-blue-300 dark:hover:border-blue-800 transition group"
        >
          <span className="flex items-center gap-2 min-w-0 text-xs text-zinc-600 dark:text-zinc-300">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="break-words">관심 종목·저장 필터 변화를 알림으로 받기</span>
          </span>
          <span className="shrink-0 inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
            알림 설정 보기 <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
        {/* 지금 되는 것 vs 준비 중 — 담기 자체는 로컬 추적, 알림은 이메일만 동작(정직 프레이밍) */}
        <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug break-words">
          관심 종목을 담으면 점수 변화·공시 신호를 이 화면에서 바로 추적해요(별도 알림 없이 로컬 기록). 공시·조건 충족을 메일로도 받으려면 알림 설정에서 이메일 알림을 켜세요(임시·베타). 카카오톡·푸시 알림은 준비 중이에요.
        </p>
      </section>

      {/* 관심 종목 */}
      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <Heart className="w-4 h-4 text-pink-600" fill="currentColor" />
            관심 종목
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              {watchlist.length}개
            </span>
          </h2>
          {watchlist.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadWatchlistCsv}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition ${FOCUS_RING}`}
                aria-label="관심 종목 CSV 파일로 저장"
                title="CSV로 저장"
              >
                <Download className="h-3.5 w-3.5" />
                CSV 저장
              </button>
              <div className="flex gap-0.5 text-[11px] bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                <button type="button" onClick={() => changeView("simple")} aria-pressed={view === "simple"} className={"px-2.5 py-1 rounded-md transition " + (view === "simple" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm" : "text-zinc-500 dark:text-zinc-400")}>간단</button>
                <button type="button" onClick={() => changeView("analysis")} aria-pressed={view === "analysis"} className={"px-2.5 py-1 rounded-md transition " + (view === "analysis" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm" : "text-zinc-500 dark:text-zinc-400")}>분석</button>
              </div>
            </div>
          ) : null}
        </div>

        {/* 정렬 — 담아둔 종목을 오늘의 관심사대로 1탭 재배열(표시 전용, 저장 순서 무변경) */}
        {watchlist.length > 1 ? (
          <div className="mb-3 flex items-center gap-2 overflow-x-auto -mx-0.5 px-0.5 pb-0.5">
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <ArrowUpDown className="w-3.5 h-3.5" />정렬
            </span>
            <div className="flex shrink-0 gap-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5">
              {SORT_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => changeSort(k)}
                  aria-pressed={sort === k}
                  className={"min-h-[44px] px-3 rounded-md text-xs font-medium whitespace-nowrap transition " + (sort === k ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 dark:text-zinc-400")}
                >
                  {SORT_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* 그룹 필터 — 로컬 메타데이터만 사용해 화면 표시를 좁힌다. CSV는 전체 목록 기준 유지. */}
        {showGroupFilters ? (
          <div className="mb-3 flex items-center gap-2 overflow-x-auto -mx-0.5 px-0.5 pb-0.5">
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              그룹
            </span>
            <div className="flex shrink-0 gap-1" role="group" aria-label="관심 종목 그룹 필터">
              {groupFilterOptions.map((option) => {
                const active = activeGroupFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => changeGroupFilter(option.value, option.count)}
                    aria-pressed={active}
                    className={
                      "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition " +
                      (active
                        ? "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700")
                    }
                  >
                    <span>{option.label}</span>
                    <span className="tabular-nums text-[11px] text-zinc-400 dark:text-zinc-500">{option.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* 로그인 전/후 저장 안내 — 상태별 한 문장으로 통일(비로그인=이 기기 저장·로그인 시 이어짐, 로그인=다기기, 압박·팝업 없음) */}
        {!isLoggedIn ? (
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 px-3 py-2.5 text-xs">
            <span className="min-w-0 break-words text-blue-800 dark:text-blue-300 leading-snug">
              {authCopy.syncLocalNote}
            </span>
            <Link
              href="/login?next=/watchlist"
              className="inline-flex items-center gap-1 shrink-0 font-medium text-blue-700 dark:text-blue-400 hover:underline"
            >
              {authCopy.syncCta} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : watchlist.length > 0 ? (
          <p className="mb-3 text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug break-words">
            로그인 됨 · 여러 기기에서 같은 관심 종목을 이어봐요.
          </p>
        ) : null}

        {watchlist.length > 0 ? (
          <p className="mb-3 text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug break-words">
            그룹·메모는 이 브라우저에만 저장되고, CSV는 전체 관심 목록 기준으로 이 브라우저에서 만들어져요.
            {" "}
            그룹 지정 {groupedWatchlistCount}개 · 메모 {notedWatchlistCount}개
            {activeGroupFilter !== GROUP_FILTER_ALL ? <> · 현재 {activeGroupFilterLabel} {filteredWatchlist.length}개 표시</> : null}
          </p>
        ) : null}

        {/* 비교함 담기 피드백 — aria-live로 결과만 안내(3초) */}
        <div aria-live="polite">
          {compareNotice ? (
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 text-xs">
              <span className="min-w-0 break-keep text-zinc-600 dark:text-zinc-300">{compareNotice}</span>
              <Link href="/compare" className="inline-flex items-center gap-1 min-h-[44px] shrink-0 font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                비교함 보기 <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : null}
        </div>

        {/* 제거 되돌리기 — 실수로 뺀 종목을 다시 담기(aria-live로 변화 안내) */}
        <div aria-live="polite">
          {undoStock ? (
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 text-xs">
              <span className="min-w-0 break-keep text-zinc-600 dark:text-zinc-300">{undoStock.name} 관심 종목에서 제거됨</span>
              <button
                type="button"
                onClick={() => { void undoRemove(); }}
                className="inline-flex items-center min-h-[44px] shrink-0 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                실행 취소
              </button>
            </div>
          ) : null}
        </div>

        {/* 오늘 변화가 있는 종목 — 관심 종목이 있을 때 목록보다 먼저, 오늘의 변화부터 훑도록 */}
        {watchlist.length > 0 ? (
          changed.length > 0 ? (
            <div className="mb-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <div className="mb-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">오늘 변화가 있는 종목</div>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400 break-words">담아둔 종목의 점수·공시 변화를 모아봤어요.</p>
              <ul className="space-y-1">
                {changed.map((c) => (
                  <li key={c.ticker}>
                    <Link
                      href={`/stock/${c.ticker}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-2 min-h-[44px] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group"
                    >
                      <span className="min-w-0 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {c.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {/* 판정 가능한 범위만 라벨링 — 종합 점수 5점 이상 변동(기존 델타), 공시 발생(기존 신호). 지표별 급증은 표시 안 함(아래 고지) */}
                        {Math.abs(c.delta) >= 5 ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                            점수 5점+ 변동
                          </span>
                        ) : null}
                        {c.signal ? (
                          <span className={"text-[10px] px-1.5 py-0.5 rounded border font-medium " + (SIGNAL_TONE[c.signal.signalType] || "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700")}>
                            🔔 공시 발생 · {c.signal.signalLabel}
                          </span>
                        ) : null}
                        {c.delta !== 0 ? (
                          <span className={"inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded " + (c.delta > 0 ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400")}>
                            {c.delta > 0 ? "▲" : "▼"}{Math.abs(c.delta)}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 break-words">점수 변화는 참고 정보이며 매수·매도 추천이 아닙니다.</p>
              {/* 제한 고지 — 판정 가능한 항목만 표시. 거래활성도 급증 등 지표별 하루 변화는 일자별 지표 델타를 따로 기록하지 않아 표시하지 않는다(날조 없음). */}
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 break-words leading-snug">
                여기서는 종합 점수 5점 이상 변동과 공시 발생만 판정해 보여줘요. 거래활성도 급증처럼 지표별 하루 변화는 일자별 기록이 없어 아직 표시하지 않아요.
              </p>
            </div>
          ) : (
            <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400 break-words">오늘은 담아둔 종목에서 눈에 띄는 점수·공시 변화가 없어요.</p>
          )
        ) : null}

        {watchlist.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 md:p-8 text-center">
            <Heart className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1.5">아직 담은 종목이 없어요.</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm mx-auto leading-relaxed break-keep">
              관심에 담으면 <strong className="text-zinc-700 dark:text-zinc-300">점수 변화 · 공시 신호 · 저평가 여부</strong>를 이 화면에서 바로 확인할 수 있어요.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 max-w-2xl mx-auto">
              {exampleStocks.length > 0 ? (
                <a
                  href="#watchlist-samples"
                  className={`flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition whitespace-nowrap ${FOCUS_RING}`}
                >
                  <Heart className="w-3.5 h-3.5" /> 샘플 관심목록 보기
                </a>
              ) : null}
              <Link href={todayCompareHref} className={`flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-blue-400 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition whitespace-nowrap ${FOCUS_RING}`}>
                <Scale className="w-3.5 h-3.5" /> 오늘 후보 3개 비교
              </Link>
              <Link href="/stocks" className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition whitespace-nowrap ${FOCUS_RING}`}>
                종목 직접 찾기
              </Link>
            </div>
            {/* 자동 저장 없이 미리보기와 개별 추가만 제공한다. 사용자가 담기를 누른 종목만 이 기기에 저장된다. */}
            <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 break-keep">샘플은 미리보기예요. 개별 담기를 누른 종목만 이 기기에 저장됩니다.</p>
            {/* 최근 본 종목 이어담기 — 담지 않고 둘러본 종목을 빈 상태에서 바로 1탭 담기로 잇는다.
                (아래 스크롤 안내 대신 실제 액션. 담기를 누른 종목만 이 기기에 저장된다.) */}
            {recent.length > 0 ? (
              <div className="mt-5 text-left max-w-md mx-auto">
                <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <Clock className="w-3 h-3" /> 최근 본 종목 이어담기
                </div>
                <ul className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {recent.slice(0, 4).map((r) => (
                    <li key={r.ticker} className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <Link href={`/stock/${r.ticker}`} className="min-w-0 flex-1 group flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{r.name}</span>
                        {deltaChip(r.ticker)}
                      </Link>
                      <button
                        type="button"
                        onClick={() => { void addToWatchlist(r.ticker); }}
                        className={`shrink-0 inline-flex items-center gap-1 min-h-[44px] px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-pink-400 dark:hover:border-pink-600 hover:text-pink-600 dark:hover:text-pink-400 transition ${FOCUS_RING}`}
                        aria-label={`${r.name} 관심 종목에 담기`}
                      >
                        <Heart className="w-3.5 h-3.5" /> 담기
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 break-keep">최근 열어본 종목이에요 · 담기를 누른 종목만 이 기기에 저장됩니다.</p>
              </div>
            ) : null}
            {/* 예시 종목 — 서버에서 실제 필드로 뽑은 3개. 각 항목이 한 줄 근거와 1탭 담기 버튼을 가진다(매수·매도 추천 아님) */}
            {exampleStocks.length > 0 ? (
              <div id="watchlist-samples" className="mt-5 text-left max-w-md mx-auto scroll-mt-20">
                <div className="mb-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">담아볼 만한 예시</div>
                <ul className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {exampleStocks.map((ex) => (
                    <li key={ex.ticker} className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <Link href={`/stock/${ex.ticker}`} className="min-w-0 flex-1 group">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{ex.name}</span>
                          {deltaChip(ex.ticker)}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 break-keep">{ex.reason}</div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => { void addToWatchlist(ex.ticker); }}
                        className={`shrink-0 inline-flex items-center gap-1 min-h-[44px] px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-pink-400 dark:hover:border-pink-600 hover:text-pink-600 dark:hover:text-pink-400 transition ${FOCUS_RING}`}
                        aria-label={`${ex.name} 관심 종목에 담기`}
                      >
                        <Heart className="w-3.5 h-3.5" /> 관심 종목에 담기
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 break-keep">예시는 참고용이며 매수·매도 추천이 아닙니다.</p>
              </div>
            ) : null}
            <div className="mt-5 text-left max-w-md mx-auto">
              <div className="mb-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">검색해서 관심 종목에 담기</div>
              <StockSearchBox stocks={allStocks} onPick={(t) => { void addToWatchlist(t); }} placeholder="관심 종목 검색해서 추가" />
            </div>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-5 text-center">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">이 그룹에 표시할 종목이 없어요.</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 break-keep">그룹을 바꾸었거나 마지막 종목을 다른 그룹으로 옮긴 상태예요.</p>
            <button
              type="button"
              onClick={() => changeGroupFilter(GROUP_FILTER_ALL, sortedWatchlistWithMeta.length)}
              className={`mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition ${FOCUS_RING}`}
            >
              전체 보기
            </button>
          </div>
        ) : (
          <ul className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredWatchlist.map((item) => {
              const info = allStocks.find((s) => s.ticker === item.ticker);
              const name = info?.name ?? item.ticker;
              const signal = tickerToSignal[item.ticker];
              const groupInputId = `watchlist-${item.ticker}-group`;
              const noteInputId = `watchlist-${item.ticker}-note`;
              const note = item.note ?? "";
              return (
                <li key={item.ticker} className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/stock/${item.ticker}`}
                      className="flex-1 flex items-center gap-3 group min-w-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {name}
                          </span>
                          {signal ? (
                            <span className={"text-[10px] px-1.5 py-0.5 rounded border font-medium " + (SIGNAL_TONE[signal.signalType] || "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700")}>
                              🔔 {signal.signalLabel}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums flex items-center gap-1.5 flex-wrap">
                          <span>{item.ticker}</span>
                          {info?.compositeScore !== undefined ? (
                            <>
                              <span className="text-zinc-300 dark:text-zinc-600">·</span>
                              <span>점수 <strong className="text-zinc-700 dark:text-zinc-300">{info.compositeScore}</strong>{tickerToDelta[item.ticker] !== undefined && Math.round(tickerToDelta[item.ticker]) !== 0 ? <span className={"ml-0.5 " + (tickerToDelta[item.ticker] > 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>{tickerToDelta[item.ticker] > 0 ? "▲" : "▼"}{Math.abs(Math.round(tickerToDelta[item.ticker]))}</span> : null}</span>
                            </>
                          ) : null}
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          <span>추가 {fmtRelativeTime(item.addedAt, { locale, absolute: "md" })}</span>
                        </div>
                        {view === "analysis" && info ? (
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-1.5">
                            {([["추세", info.momentum], ["거래", info.flow], ["밸류", info.value], ["위험", info.vol]] as const).map(([l, v]) => (
                              <div key={l} className="bg-zinc-50 dark:bg-zinc-800/50 rounded px-1.5 py-1 text-center">
                                <div className="text-[9px] text-zinc-400 dark:text-zinc-500">{l}</div>
                                <div className="text-[11px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">{v !== undefined ? Math.round(v) : "—"}</div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => { void handleAddCompare(name, item.ticker); }}
                        className="flex items-center justify-center min-h-[44px] min-w-[44px] text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        aria-label={`${name} 비교함에 담기`}
                        title="비교함에 담기"
                      >
                        <Scale className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.ticker, name)}
                        className="flex items-center justify-center min-h-[44px] min-w-[44px] text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition"
                        aria-label={`${name} 관심 종목에서 제거`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
                    <label className="min-w-0" htmlFor={groupInputId}>
                      <span className="mb-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-500">그룹</span>
                      <select
                        id={groupInputId}
                        value={item.group ?? ""}
                        onChange={(event) => updateWatchlistMeta(item.ticker, { group: event.target.value })}
                        className={`min-h-[44px] w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 text-xs text-zinc-700 dark:text-zinc-200 ${FOCUS_RING}`}
                        aria-label={`${name} 관심 그룹`}
                      >
                        <option value="">미분류</option>
                        {WATCHLIST_GROUP_OPTIONS.map((group) => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </label>
                    <label className="min-w-0" htmlFor={noteInputId}>
                      <span className="mb-1 flex items-center justify-between gap-2 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                        <span>메모</span>
                        <span className="tabular-nums">{note.length}/{WATCHLIST_NOTE_MAX_LENGTH}</span>
                      </span>
                      <textarea
                        id={noteInputId}
                        value={note}
                        maxLength={WATCHLIST_NOTE_MAX_LENGTH}
                        rows={2}
                        onChange={(event) => updateWatchlistMeta(item.ticker, { note: event.target.value }, false)}
                        onBlur={(event) => {
                          trackEvent("watchlist_meta_update", {
                            field: "note",
                            ticker: item.ticker,
                            hasValue: event.currentTarget.value.trim().length > 0,
                            loggedIn: isLoggedIn,
                          });
                        }}
                        placeholder="확인할 포인트 메모"
                        className={`min-h-[44px] w-full resize-y rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 ${FOCUS_RING}`}
                        aria-label={`${name} 관심 메모`}
                      />
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* 관심 종목 비교하기 — 담아둔 종목 앞에서부터 최대 N개를 한 번에 비교 화면에 시드(1탭 이동) */}
        {filteredWatchlist.length > 1 ? (
          <div className="mt-3">
            <Link
              href={`/compare?stocks=${compareSeed.join(",")}`}
              className={`flex items-center justify-center gap-1.5 w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition ${FOCUS_RING}`}
            >
              <Scale className="w-4 h-4" /> 관심 종목 비교하기
            </Link>
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug break-words">
              {activeGroupFilter === GROUP_FILTER_ALL ? "앞에서부터" : `${activeGroupFilterLabel}에서 앞에서부터`} 최대 {COMPARE_MAX}개를 비교 화면에 담아요 · 비교는 참고용이며 매수·매도 추천이 아닙니다.
            </p>
          </div>
        ) : null}
      </section>

      {/* 저장한 필터 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            저장한 필터
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              {savedSearches.length}개
            </span>
          </h2>
          {savedSearches.length > 0 ? (
            <Link href="/stocks" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center gap-0.5">
              조건 추가 <ArrowRight className="w-3 h-3" />
            </Link>
          ) : null}
        </div>

        {savedSearches.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center">
            <SlidersHorizontal className="w-7 h-7 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1 max-w-sm mx-auto leading-relaxed">
              자주 쓰는 조건을 저장해 매번 다시 설정하지 않고 한 번에 불러와요.
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
              종목 탐색에서 조건을 정한 뒤 <strong className="text-zinc-700 dark:text-zinc-300">조건 저장</strong>을 누르면 여기에 쌓입니다. 로그인하면 여러 기기에서 같은 필터를 씁니다.
            </p>
            <Link href="/stocks" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              종목 탐색에서 조건 만들기 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <ul className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
            {savedSearches.map((sv) => {
              const count = matchCountOf(sv.config);
              return (
                <li key={sv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <Link href="/stocks" className="flex items-center justify-between gap-3 px-4 py-3 group">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {sv.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 break-words leading-snug mt-0.5">
                        {describeConfig(sv.config)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">{count}개</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">현재 조건 충족</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {savedSearches.length > 0 ? (
          <div className="mt-2 space-y-1">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug break-words">
              충족 종목 수는 현재 점수 기준 참고 정보예요 · 종목을 누르면 종목 탐색에서 저장한 필터를 불러올 수 있어요 · 매수·매도 추천이 아닙니다.
            </p>
            {/* 저장 필터 → 조건 충족 알림 다리(무료 기능 경로 일관 · 압박·매매 문구 없음) */}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug break-words">
              저장한 필터에 새 종목이 들어올 때 알림으로 받으려면{" "}
              <Link href="/settings/notifications" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">알림 설정의 조건 충족 알림</Link>
              에서 켜세요. 지금은 이메일로만 동작해요(임시·베타) · 카카오톡·푸시 알림은 준비 중.
            </p>
          </div>
        ) : null}
      </section>

      {/* 최근 본 종목 */}
      <section id="recent-views" className="scroll-mt-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <Clock className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            최근 본 종목
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              {recent.length}개
            </span>
          </h2>
          {recent.length > 0 ? (
            <button
              type="button"
              onClick={clearRecent}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
            >
              전체 삭제
            </button>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
              방문한 종목이 자동으로 기록돼 다시 찾기 쉬워요.
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
              종목 페이지를 한 번 열면 여기에 최근 10개까지 쌓입니다.
            </p>
            <Link href="/stocks" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              종목 탐색하러 가기 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <ul className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
            {recent.map((item) => (
              <li key={item.ticker} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <Link
                  href={`/stock/${item.ticker}`}
                  className="flex items-center justify-between px-4 py-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                      {item.ticker} · {fmtRelativeTime(item.viewedAt, { locale, absolute: "md" })}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 최근 검색 — 탐색에서 저장된 검색어를 그대로 눌러 재검색으로 잇기(표시 전용, 있을 때만) */}
      {recentSearches.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">최근 검색</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((term) => (
              <Link
                key={term}
                href={`/stocks?q=${encodeURIComponent(term)}`}
                className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition"
              >
                <Search className="w-3 h-3" />{term}
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug break-words">
            종목 탐색에서 검색한 내용이 이 기기에 저장돼요 · 누르면 탐색 화면에서 같은 검색으로 이어져요.
          </p>
        </section>
      ) : null}
    </div>
  );
}
