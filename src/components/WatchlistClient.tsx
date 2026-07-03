"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, X, Clock, ArrowRight, SlidersHorizontal, LayoutDashboard, Bell } from "lucide-react";
import { StockSearchBox } from "@/components/StockSearchBox";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  type WatchlistItem,
} from "@/lib/watchlist";
import { getRecentViews, type RecentView } from "@/lib/recentViews";
import { listSavedSearches, type SavedSearch, type SavedSearchConfig } from "@/lib/savedSearches";
import { matchesConfig, type StockForMatch } from "@/lib/matchConfig";
import { useLanguage } from "@/components/LanguageProvider";
import { commonCopy } from "@/lib/i18n";
import { fmtRelativeTime } from "@/lib/format";
import { FOCUS_RING } from "@/components/ui/controlStyles";

const RECENT_KEY = "ornscore_recent_views";
const VIEW_KEY = "ornscore_watchlist_view";
const LEGACY_VIEW_KEY = "valuemap_watchlist_view";

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
  if (c.themes && c.themes.length > 0) {
    parts.push(c.themes.slice(0, 2).join("·") + (c.themes.length > 2 ? ` 외 ${c.themes.length - 2}` : ""));
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
}: {
  allStocks: StockInfo[];
  matchPool?: StockForMatch[];
  tickerToSignal?: Record<string, SignalInfo>;
  tickerToDelta?: Record<string, number>;
  isLoggedIn?: boolean;
}) {
  const { locale } = useLanguage();
  const authCopy = commonCopy[locale].auth;
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState<"simple" | "analysis">("simple");
  const [hydrated, setHydrated] = useState(false);
  // 방금 제거한 종목 — 실수로 뺀 경우 되돌리기(5초 자동 소멸, compare와 동일 패턴)
  const [undoStock, setUndoStock] = useState<{ ticker: string; name: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHydrated(true);
    // 시크릿 모드·저장소 차단 환경에서 localStorage 접근이 예외를 던질 수 있어 방어
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem(VIEW_KEY) ?? localStorage.getItem(LEGACY_VIEW_KEY) : null;
      if (v === "analysis" || v === "simple") setView(v);
    } catch {
      // 저장소 사용 불가 — 기본 보기(simple) 유지
    }
  }, []);

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

    window.addEventListener("watchlist-changed", onWatchlistChange);
    window.addEventListener("recent-views-changed", onRecentChange);
    window.addEventListener("saved-searches-changed", onSavedChange);
    window.addEventListener("storage", onSavedChange);

    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
      window.removeEventListener("watchlist-changed", onWatchlistChange);
      window.removeEventListener("recent-views-changed", onRecentChange);
      window.removeEventListener("saved-searches-changed", onSavedChange);
      window.removeEventListener("storage", onSavedChange);
    };
  }, []);

  // 언마운트 시 대기 중인 되돌리기 타이머 해제
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

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

  const hasAnything = watchlist.length > 0 || recent.length > 0 || savedSearches.length > 0;

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <Heart className="w-4 h-4 text-pink-600" fill="currentColor" />
            관심 종목
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              {watchlist.length}개
            </span>
          </h2>
          {watchlist.length > 0 ? (
            <div className="flex gap-0.5 text-[11px] bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
              <button type="button" onClick={() => changeView("simple")} className={"px-2.5 py-1 rounded-md transition " + (view === "simple" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm" : "text-zinc-500 dark:text-zinc-400")}>간단</button>
              <button type="button" onClick={() => changeView("analysis")} className={"px-2.5 py-1 rounded-md transition " + (view === "analysis" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm" : "text-zinc-500 dark:text-zinc-400")}>분석</button>
            </div>
          ) : null}
        </div>

        {/* 로그아웃 상태에서 관심 종목이 이미 있을 때 — 이 기기 저장·로그인 시 이어짐 안내(부드러운 정보 배너, 압박·닫기 없음) */}
        {!isLoggedIn && watchlist.length > 0 ? (
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
        ) : null}

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

        {watchlist.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 md:p-8 text-center">
            <Heart className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1.5">아직 관심 종목이 없습니다</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm mx-auto leading-relaxed">
              종목을 저장하면 매일 <strong className="text-zinc-700 dark:text-zinc-300">점수 변화</strong>와 <strong className="text-zinc-700 dark:text-zinc-300">공시 신호</strong>를 한곳에서 추적할 수 있어요. ♥ 버튼이나 아래 검색으로 추가하세요.
            </p>
            <div className="mb-4">
              <StockSearchBox stocks={allStocks} onPick={(t) => { void addToWatchlist(t); }} placeholder="관심 종목 검색해서 추가" />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 max-w-md mx-auto">
              <Link href="/stocks" className={`flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition ${FOCUS_RING}`}>
                종목 탐색하러 가기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/today" className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition ${FOCUS_RING}`}>
                오늘의 후보 보기
              </Link>
            </div>
            {!isLoggedIn ? (
              <Link href="/login?next=/watchlist" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                {authCopy.syncCta} <ArrowRight className="w-3 h-3" />
              </Link>
            ) : null}
            <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">많이 보는 종목:</span>
              {[["005930", "삼성전자"], ["000660", "SK하이닉스"], ["005380", "현대차"]].map(([t, n]) => (
                <Link key={t} href={"/stock/" + t} className="text-[11px] px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-pink-400 dark:hover:border-pink-600 transition">{n}</Link>
              ))}
            </div>
          </div>
        ) : (
          <ul className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
            {watchlist.map((item) => {
              const info = allStocks.find((s) => s.ticker === item.ticker);
              const name = info?.name ?? item.ticker;
              const signal = tickerToSignal[item.ticker];
              return (
                <li key={item.ticker} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
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
                  <button
                    type="button"
                    onClick={() => handleRemove(item.ticker, name)}
                    className="ml-2 flex items-center justify-center min-h-[44px] min-w-[44px] text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition shrink-0"
                    aria-label={`${name} 관심 종목에서 제거`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
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
      <section>
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
    </div>
  );
}
