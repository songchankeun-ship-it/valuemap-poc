"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, ExternalLink, ArrowRight, AlertTriangle, RefreshCw, Inbox, Info } from "lucide-react";
import { SignalGuideExpand } from "./SignalGuideExpand";
import { findGuideByLabel } from "@/lib/signalGuide";
import { DISCLOSURE_TYPE_ORDER, typeMetaOf } from "@/lib/disclosureType";
import { addToWatchlist, removeFromWatchlist, isInWatchlist, getWatchlist } from "@/lib/watchlist";
import { useLanguage } from "@/components/LanguageProvider";
import { disclosureExplorerCopy } from "@/lib/copy/disclosures";
import { FOCUS_RING } from "@/components/ui/controlStyles";
import { dataMetadata, formatBizDateLong } from "@/lib/realStocks";

type ExplorerCopy = (typeof disclosureExplorerCopy)[keyof typeof disclosureExplorerCopy];

interface DisclosureItem {
  corp_name: string;
  corp_code?: string;
  stock_code?: string;
  report_nm: string;
  rcept_no: string;
  flr_nm: string;
  rcept_dt: string;
  url: string;
  rm?: string;
}

interface DisclosureSignal {
  signalType: string;
  signalLabel: string;
  disclosure: DisclosureItem;
  strength: number;
  note: string;
  direction?: "긍정 가능" | "부정 가능" | "확인 필요";
}

export interface ApiResponse {
  days: number;
  totalDisclosures: number;
  signalCount: number;
  signals: DisclosureSignal[];
  source?: string;
  fetchedAt?: string;
}

interface GroupedSignal {
  key: string;
  corp_name: string;
  stock_code?: string;
  signalLabel: string;
  signalType: string;
  strength: number;
  representative: DisclosureSignal;
  count: number;
  hasRevision: boolean;
  rcept_dt_latest: string;
}

// 방향 표기 — 긍정/부정 valence(호재/악재) 대신 사실(장내매수/매도 단서) 또는 '방향 확인 필요'만.
function directionLabel(dir: string | undefined, t: ExplorerCopy): string {
  if (dir === "긍정 가능") return t.directionBuy;
  if (dir === "부정 가능") return t.directionSell;
  return t.directionUnknown;
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function goToStock(code: string) {
  window.location.href = "/stock/" + code;
}

// 공시 카드용 컴팩트 관심 토글 — 분석 대상(유니버스) 종목에만 노출
function WatchlistToggle({ code, name, t }: { code: string; name: string; t: ExplorerCopy }) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    isInWatchlist(code).then((r) => {
      if (mounted) {
        setAdded(r);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [code]);
  useEffect(() => {
    function onChange() { isInWatchlist(code).then(setAdded); }
    window.addEventListener("watchlist-changed", onChange);
    return () => window.removeEventListener("watchlist-changed", onChange);
  }, [code]);
  async function toggle() {
    if (loading) return;
    if (added) {
      setAdded(false); // 낙관적 업데이트
      await removeFromWatchlist(code);
    } else {
      setAdded(true); // 낙관적 업데이트
      await addToWatchlist(code);
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={added ? t.watchRemoveAriaFor(name) : t.watchAddAriaFor(name)}
      className={"inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium border transition disabled:opacity-50 disabled:cursor-not-allowed " + FOCUS_RING + " " +
        (added
          ? "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-950/50"
          : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-pink-300 hover:text-pink-600 dark:hover:text-pink-400")}
    >
      <Heart className="w-3.5 h-3.5" fill={added ? "currentColor" : "none"} strokeWidth={added ? 0 : 1.8} />
      {added ? t.watchAdded : t.watch}
    </button>
  );
}

function groupSignals(signals: DisclosureSignal[]): GroupedSignal[] {
  const groups = new Map<string, GroupedSignal>();
  for (const sig of signals) {
    const key = sig.disclosure.corp_name + "_" + sig.signalType;
    const isRevision = sig.disclosure.report_nm.includes("기재정정") || sig.disclosure.report_nm.includes("정정");
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        corp_name: sig.disclosure.corp_name,
        stock_code: sig.disclosure.stock_code,
        signalLabel: sig.signalLabel,
        signalType: sig.signalType,
        strength: sig.strength,
        representative: sig,
        count: 1,
        hasRevision: isRevision,
        rcept_dt_latest: sig.disclosure.rcept_dt,
      });
    } else {
      const g = groups.get(key)!;
      g.count++;
      if (isRevision) g.hasRevision = true;
      if (sig.disclosure.rcept_dt > g.rcept_dt_latest) {
        g.rcept_dt_latest = sig.disclosure.rcept_dt;
        g.representative = sig;
      }
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.rcept_dt_latest.localeCompare(a.rcept_dt_latest));
}

// 수집 출처 라벨 — StockDisclosures의 SourceBadge와 동일 매핑(실시간/저장본/예시 표본)
function sourceLabel(source: string | undefined, t: ExplorerCopy): string | null {
  if (!source) return null;
  if (source.startsWith("sample")) return t.sourceSample;
  if (source === "live") return t.sourceLive;
  if (source === "cache") return t.sourceCache;
  return null;
}

// ISO → KST(서울) 표기. 날짜 구분자는 공시 제출일과 동일한 점(YYYY.MM.DD HH:mm) 형식으로 통일.
// formatToParts로 조립해 Intl 로케일별 "2026. 07. 07." 표기 차이를 제거(SSR/CSR 일관, timeZone 명시).
function fmtKST(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
  } catch {
    return null;
  }
}

export function DisclosureExplorer({ initialData, universe = [] }: { initialData?: ApiResponse; universe?: string[] }) {
  const { locale } = useLanguage();
  const t = disclosureExplorerCopy[locale];
  const universeSet = new Set(universe);
  const [data, setData] = useState<ApiResponse | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialData?.days ?? 7);
  // 상단 탭: "all" | "watchlist" | 공시 유형(signalType). (설계서 §7-3)
  const [filterType, setFilterType] = useState<string>("all");
  // 분석 대상만 / 전체 시장 (설계서 §15 / [P1-4]). 기본은 제품이 점수를 산출하는 분석 대상.
  const [scope, setScope] = useState<"universe" | "all">("universe");
  // '내 관심종목' 탭용 — 관심 종목 티커 집합. watchlist-changed 이벤트로 동기화.
  const [watchTickers, setWatchTickers] = useState<Set<string>>(new Set());
  // '다시 시도' 시 이 값을 증가시켜 fetch effect를 재실행한다.
  const [reloadKey, setReloadKey] = useState(0);
  const firstRender = useRef(true);

  useEffect(() => {
    let mounted = true;
    function load() {
      getWatchlist().then((items) => {
        if (mounted) setWatchTickers(new Set(items.map((i) => i.ticker)));
      });
    }
    load();
    window.addEventListener("watchlist-changed", load);
    return () => {
      mounted = false;
      window.removeEventListener("watchlist-changed", load);
    };
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (initialData) return; // SSR 초기 데이터 사용 — 첫 fetch 생략
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetch("/api/disclosures/recent?days=" + days)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        // 원문 에러 메시지는 사용자에게 노출하지 않고 콘솔에만 남긴다.
        if (j.error) {
          console.error("[disclosures] API error:", j.error);
          setError("error");
        } else setData(j);
      })
      .catch((e) => {
        if (!alive) return;
        console.error("[disclosures] fetch failed:", e);
        setError("error");
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [days, reloadKey, initialData]);

  if (loading) {
    return (
      <div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>{t.loading(days)}</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded mb-2 animate-pulse" />
              <div className="h-3 w-1/4 bg-zinc-100 dark:bg-zinc-800/60 rounded mb-2 animate-pulse" />
              <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 rounded-lg p-6 md:p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400 dark:text-rose-500 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-sm md:text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1.5 break-words">{t.errorTitle}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm mx-auto leading-relaxed break-words">{t.errorHelp}</p>
        <div className="flex justify-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition ${FOCUS_RING}`}
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            {t.errorRetry}
          </button>
        </div>
      </div>
    );
  }

  const grouped = groupSignals(data.signals);
  const isWatchTab = filterType === "watchlist";
  // 유형/전체 탭의 기준 범위: 분석 대상만 / 전체 시장. '내 관심종목' 탭은 범위 토글과 무관하게 관심 집합만.
  const typeScopeBase = scope === "all" ? grouped : grouped.filter((g) => g.stock_code && universeSet.has(g.stock_code));
  const universeCount = grouped.filter((g) => g.stock_code && universeSet.has(g.stock_code)).length;
  const watchlistCount = grouped.filter((g) => g.stock_code && watchTickers.has(g.stock_code)).length;
  // 유형별 카운트(탭 배지) — 현재 범위 기준으로 일관.
  const signalCounts = typeScopeBase.reduce<Record<string, number>>((acc, g) => {
    acc[g.signalType] = (acc[g.signalType] || 0) + 1;
    return acc;
  }, {});
  // 표시할 카드 목록: 관심 탭이면 관심 집합, 아니면 범위 기준 후 유형 필터.
  const scoped = isWatchTab
    ? grouped.filter((g) => g.stock_code && watchTickers.has(g.stock_code))
    : typeScopeBase;
  const filtered = isWatchTab || filterType === "all" ? scoped : scoped.filter((g) => g.signalType === filterType);
  const collectedAt = fmtKST(data.fetchedAt);
  const collectedSource = sourceLabel(data.source, t);
  const disclosureBasis = [collectedAt ?? t.collectedAtUnknown, collectedSource].filter(Boolean).join(" · ");
  const priceScoreBasis = `${formatBizDateLong(dataMetadata.asOfBusinessDate)} ${t.marketClose}`;

  return (
    <div className="space-y-4">
      <header className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</h2>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
            <span className="tabular-nums">{t.summary(days, data.signalCount, scope === "all", scoped.length)}</span>
            <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">{t.missingFragment}</span>
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3 text-[11px] tabular-nums">
          <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-2.5 py-1.5">
            <dt className="text-zinc-500 dark:text-zinc-400">{t.priceScoreBasis}</dt>
            <dd className="font-medium text-zinc-700 dark:text-zinc-200 text-right">{priceScoreBasis}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-2.5 py-1.5">
            <dt className="text-zinc-500 dark:text-zinc-400">{t.disclosureCollectionBasis}</dt>
            <dd className="font-medium text-zinc-700 dark:text-zinc-200 text-right">{disclosureBasis}</dd>
          </div>
        </dl>
        <div className="flex gap-2 flex-wrap items-center mb-3">
          {[3, 7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={"px-3 py-1.5 text-xs rounded-md border transition " + FOCUS_RING + " " +
                (days === d
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500")}
            >
              {t.dayUnit(d)}
            </button>
          ))}
          {/* 기간 필터가 '전체 기간 공시'로 오해되지 않도록 항상 보이는 수집 범위 배지(컨트롤 아님) */}
          <span
            role="note"
            aria-label={t.periodScopeBadgeAria}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300"
          >
            <Info className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={1.8} aria-hidden="true" />
            {t.periodScopeBadge}
          </span>
        </div>

        {/* 상단 탭(§7-3) — 전체 / 내 관심종목 / 유형별. 유형색은 중립(호재·악재 배제), 가로 스크롤. */}
        <div
          role="group"
          aria-label={t.title}
          className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 mb-3"
        >
          {(() => {
            const tabs: { key: string; label: string; count: number; dot?: string }[] = [
              { key: "all", label: t.tabAll, count: typeScopeBase.length },
              { key: "watchlist", label: t.tabWatchlist, count: watchlistCount },
              ...DISCLOSURE_TYPE_ORDER.map((type) => ({
                key: type,
                label: typeMetaOf(type).shortLabel,
                count: signalCounts[type] ?? 0,
                dot: typeMetaOf(type).dot,
              })),
            ];
            return tabs.map((tab) => {
              const active = filterType === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterType(tab.key)}
                  aria-pressed={active}
                  className={"inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition " + FOCUS_RING + " " +
                    (active
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500")}
                >
                  {tab.dot ? (
                    <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + (active ? "bg-white/70 dark:bg-zinc-900/70" : tab.dot)} aria-hidden="true" />
                  ) : null}
                  {tab.label}
                  <span className={"tabular-nums text-[11px] px-1.5 py-0.5 rounded-full " +
                    (active
                      ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400")}>
                    {tab.count}
                  </span>
                </button>
              );
            });
          })()}
        </div>

        {/* 분석 대상만 / 전체 시장 (설계서 §15) — '내 관심종목' 탭에서는 숨김(관심 집합이 이미 범위) */}
        {!isWatchTab ? (
          <div className="mb-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{t.scopeLabel}</span>
              <div
                role="group"
                aria-label={t.scopeGroupAria}
                className="inline-flex rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-0.5"
              >
                {([
                  { key: "universe", label: t.scopeUniverse, count: universeCount },
                  { key: "all", label: t.scopeAll, count: grouped.length },
                ] as const).map((opt) => {
                  const active = scope === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setScope(opt.key)}
                      aria-pressed={active}
                      className={"inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-md text-xs font-medium transition " + FOCUS_RING + " " +
                        (active
                          ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-600"
                          : "bg-transparent text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100")}
                    >
                      {opt.label}
                      <span className={"tabular-nums text-[11px] px-1.5 py-0.5 rounded-full " +
                        (active
                          ? "bg-white/20 text-white"
                          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300")}>
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed break-words">
              <strong className="font-medium text-zinc-600 dark:text-zinc-300">{t.scopeUniverseStrong}</strong>{t.scopeUniverseDesc}<strong className="font-medium text-zinc-600 dark:text-zinc-300">{t.scopeAllStrong}</strong>{t.scopeAllDesc}
            </p>
          </div>
        ) : null}
      </header>

      {/* 카드 공통 경고 박스(재검수 5-4 밀도) — DART 원문/수집 제한/호재·악재 아님을 한곳에 모아 카드 반복 축소 */}
      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 leading-relaxed">
        <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">{t.topNoticeTitle}</p>
        <ul className="space-y-0.5">
          {t.topNoticeBullets.map((bullet, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-slate-400 shrink-0" aria-hidden="true">·</span>
              <span className="break-words">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 예시(샘플) 데이터 안내 — source가 "sample*"일 때만 카드 목록 위에 노출(재검수 P0C) */}
      {data.source?.startsWith("sample") ? (
        <div className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" strokeWidth={1.8} aria-hidden="true" />
          <span className="break-words">{t.sampleNotice}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          isWatchTab && watchTickers.size === 0 ? (
            // '내 관심종목' 탭 · 관심 종목 자체가 없음 → 담기 유도
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 md:p-8 text-center">
              <Heart className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm mx-auto leading-relaxed break-words">{t.watchlistEmpty}</p>
              <div className="flex justify-center flex-wrap gap-2">
                <a
                  href="/watchlist"
                  className={`inline-flex items-center gap-1 text-xs px-3.5 py-2 min-h-[44px] rounded-md bg-blue-600 text-white hover:bg-blue-700 transition ${FOCUS_RING}`}
                >
                  {t.watchlistEmptyCta} <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 md:p-8 text-center">
              <Inbox className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm mx-auto leading-relaxed break-words">{t.empty}</p>
              {filterType !== "all" || (scope === "universe" && !isWatchTab) ? (
                <div className="flex justify-center flex-wrap gap-2">
                  {scope === "universe" && !isWatchTab ? (
                    <button
                      type="button"
                      onClick={() => setScope("all")}
                      className={`inline-flex items-center text-xs px-3.5 py-2 min-h-[44px] rounded-md bg-blue-600 text-white hover:bg-blue-700 transition ${FOCUS_RING}`}
                    >
                      {t.emptyWidenScope}
                    </button>
                  ) : null}
                  {filterType !== "all" ? (
                    <button
                      type="button"
                      onClick={() => setFilterType("all")}
                      className={`inline-flex items-center text-xs px-3.5 py-2 min-h-[44px] rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition ${FOCUS_RING}`}
                    >
                      {t.emptyReset}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        ) : (
          filtered.map((g) => {
            const meta = typeMetaOf(g.signalType);
            const Icon = meta.Icon;
            const desc = t.descriptions[g.signalLabel] || t.descFallback;
            const guide = findGuideByLabel(g.signalLabel);
            const checkLine = guide?.checkPoints?.[0] ?? null;
            const checkPoint = checkLine ?? desc;
            const dt = g.rcept_dt_latest;
            const date = dt.length >= 8 ? dt.slice(0, 4) + "." + dt.slice(4, 6) + "." + dt.slice(6, 8) : dt;
            return (
              <div key={g.key} className={"bg-white dark:bg-zinc-900 border rounded-lg p-3 md:p-4 transition hover:shadow-sm " + meta.cardBorder}>
                {/* 상단: 공시 유형 / 제출일 / 자동분류 */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className={"inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium border " + meta.badgeBg + " " + meta.badgeText + " " + meta.badgeBorder}>
                      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                      {meta.label} · {t.autoClassified}
                    </span>
                    {g.representative.direction ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
                        {directionLabel(g.representative.direction, t)}
                      </span>
                    ) : null}
                    {g.count > 1 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium tabular-nums bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {g.hasRevision ? t.revisionIncluded : ""}{t.countUnit(g.count)}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">{date} {t.submitted}</span>
                </div>

                {/* 회사명 / 공시명 */}
                <div className="mb-2 min-w-0">
                  {(() => {
                    const flr = g.representative.disclosure.flr_nm;
                    // 보고자가 대상 회사와 다를 때만 제출자로 취급(회사 자체 제출 공시는 중복 표기 생략).
                    const reporterDiffers = Boolean(flr) && flr !== g.corp_name;
                    // 보유 변동(소유상황보고서)은 '대상 회사'와 '보고자'가 헷갈리므로 명시적으로 분리 표기한다.
                    if (g.signalType === "insider_buy" && reporterDiffers) {
                      return (
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">{t.targetCompanyLabel}</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 break-words">{g.corp_name}</span>
                            {g.stock_code ? (
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">{g.stock_code}</span>
                            ) : null}
                          </div>
                          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">{t.reporterLabel}</span>
                            <span className="text-xs text-zinc-600 dark:text-zinc-300 break-words">{flr}</span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 break-words">{g.corp_name}</span>
                        {g.stock_code ? (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">{g.stock_code}</span>
                        ) : null}
                        {reporterDiffers ? (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-[160px]">· {flr}</span>
                        ) : null}
                      </div>
                    );
                  })()}
                  <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug break-words line-clamp-2">
                    {g.representative.disclosure.report_nm}
                  </p>
                </div>

                {/* 자동분류 보조 해석 */}
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 leading-relaxed break-words">{desc}</p>
                {g.representative.note && g.representative.note !== desc ? (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 leading-relaxed break-words line-clamp-2">{g.representative.note}</p>
                ) : null}

                {/* 확인할 것 — 중립 확인 포인트 (반복 '주의' 문구는 상단 공통 경고 박스로 이동) */}
                <div className="flex gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-md px-2.5 py-1.5 mb-3 leading-relaxed">
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">{t.checkLabel}</span>
                  <span className="break-words">{checkPoint}</span>
                </div>

                {/* 액션 행 (§7-4): 종목 보기 → DART 원문 → 관심 */}
                <ul className="flex items-center gap-2 flex-wrap list-none">
                  {g.stock_code && universeSet.has(g.stock_code) ? (
                    <li>
                      <button
                        type="button"
                        onClick={() => goToStock(g.stock_code!)}
                        aria-label={t.viewStockAria(g.corp_name)}
                        className={`inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 transition ${FOCUS_RING}`}
                      >
                        {t.viewStock} <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                      </button>
                    </li>
                  ) : null}
                  <li>
                    <button
                      type="button"
                      onClick={() => openExternal(g.representative.disclosure.url)}
                      aria-label={t.viewSourceAria(g.corp_name)}
                      className={`inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/50 active:bg-blue-200 transition ${FOCUS_RING}`}
                    >
                      {t.viewSource} <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </li>
                  {g.stock_code && universeSet.has(g.stock_code) ? (
                    <li>
                      <WatchlistToggle code={g.stock_code} name={g.corp_name} t={t} />
                    </li>
                  ) : null}
                </ul>
                {/* 상태 배지는 'DART 원문' 액션과 DOM·시각·텍스트 추출에서 분리 — 버튼 줄 아래 별도 줄(재검수 P2-3) */}
                {g.stock_code && !universeSet.has(g.stock_code) ? (
                  <div className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">{t.notInUniverse}</div>
                ) : null}
                {/* 이 공시 이해하기 — 차별점 */}
                {guide ? (
                  <SignalGuideExpand
                    guide={guide}
                    url={g.representative.disclosure.url}
                    ariaLabel={t.explainAria(g.corp_name, g.signalLabel)}
                    sourceAriaLabel={t.explainSourceAria(g.corp_name)}
                  />
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* 제한 안내(§7-5) — 카드 목록 아래로 이동(재검수 P0C). 목록이 비어 있으면 빈 상태와 경쟁하지 않도록 숨김. */}
      {filtered.length > 0 ? (
        <div className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" strokeWidth={1.8} aria-hidden="true" />
          <span className="break-words">{t.limitBanner}</span>
        </div>
      ) : null}
    </div>
  );
}
