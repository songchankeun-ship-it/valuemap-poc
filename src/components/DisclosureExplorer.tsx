"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, ExternalLink, ArrowRight, AlertTriangle, RefreshCw, Inbox, Info, ChevronDown, FileCheck2 } from "lucide-react";
import { SignalGuideExpand } from "./SignalGuideExpand";
import { findGuideByLabel } from "@/lib/signalGuide";
import { DISCLOSURE_TYPE_ORDER, typeMetaOf } from "@/lib/disclosureType";
import { isCorrectionFiling } from "@/lib/disclosureHierarchy";
import { dartFilingUrl, selectDisclosureHighlights } from "@/lib/disclosureHighlights";
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

function filingDate(value: string) {
  return /^\d{8}$/.test(value) ? `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}` : value;
}

function FilingSource({ filing, t }: { filing: GroupedSignal; t: ExplorerCopy }) {
  const href = dartFilingUrl(filing.representative.disclosure.rcept_no);
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={t.viewSourceAria(filing.corp_name)} className="research-filings-source">
      {t.viewSource}<ExternalLink size={15} aria-hidden="true" />
    </a>
  ) : <span className="research-filings-source-missing">{t.unavailableSource}</span>;
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
      aria-pressed={added}
      aria-label={added ? t.watchRemoveAriaFor(name) : t.watchAddAriaFor(name)}
      className={`research-filings-control ${FOCUS_RING}`}
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
    // 정정 여부는 disclosureHierarchy 단일 소스로 결정론 판별(디텍터·배지와 동일).
    const isRevision = isCorrectionFiling(sig.disclosure.report_nm);
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
  const isSample = data.source?.startsWith("sample") ?? false;
  const collectedAt = isSample ? null : fmtKST(data.fetchedAt);
  const collectedSource = sourceLabel(data.source, t);
  const disclosureBasis = isSample ? t.sourceSample : [collectedAt ?? t.collectedAtUnknown, collectedSource].filter(Boolean).join(" · ");
  const priceScoreBasis = `${formatBizDateLong(dataMetadata.asOfBusinessDate)} ${t.marketClose}`;
  const highlights = selectDisclosureHighlights(filtered);
  const tabs = [
    { key: "all", label: t.tabAll, count: typeScopeBase.length },
    { key: "watchlist", label: t.tabWatchlist, count: watchlistCount },
    ...DISCLOSURE_TYPE_ORDER.map((type) => ({
      key: type,
      label: typeMetaOf(type).shortLabel,
      count: signalCounts[type] ?? 0,
    })),
  ];

  return (
    <div className="space-y-4">
      {isSample ? (
        <p className="research-filings-sample"><Info size={15} aria-hidden="true" />{t.sampleNotice}</p>
      ) : null}

      <section className="research-filings-priority" aria-labelledby="disclosure-priority-heading">
        <div className="research-filings-priority-heading">
          <FileCheck2 size={20} aria-hidden="true" />
          <div>
            <h2 id="disclosure-priority-heading">{t.priorityTitle}</h2>
            <p>{t.priorityRule}</p>
          </div>
        </div>
        {highlights.length > 0 ? (
          <ul className="research-filings-priority-list">
            {highlights.map((g) => (
              <li key={g.key}>
                <div className="research-filings-identity">
                  <p className="research-filings-meta">
                    <strong>{g.corp_name}</strong>
                    <span>{g.signalLabel}</span>
                    <span className="tabular-nums">{filingDate(g.rcept_dt_latest)}</span>
                  </p>
                  <p className="research-filing-title">{g.representative.disclosure.report_nm}</p>
                </div>
                <FilingSource filing={g} t={t} />
              </li>
            ))}
          </ul>
        ) : <p className="research-filings-priority-empty">{t.priorityEmpty}</p>}
      </section>

      <section className="research-filings-toolbar" aria-label={t.title}>
        <div className="research-filings-controls">
          <div role="group" aria-label={t.periodGroupAria} className="research-filings-options">
            {[3, 7, 14, 30].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className="research-filings-control">
                {t.dayUnit(d)}
              </button>
            ))}
          </div>
          {!isWatchTab ? (
            <div role="group" aria-label={t.scopeGroupAria} className="research-filings-options">
              {([
                { key: "universe", label: t.scopeUniverse, count: universeCount },
                { key: "all", label: t.scopeAll, count: grouped.length },
              ] as const).map((opt) => (
                <button key={opt.key} type="button" onClick={() => setScope(opt.key)} aria-pressed={scope === opt.key} className="research-filings-control">
                  {opt.label}<span className="tabular-nums">{opt.count}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div role="group" aria-label={t.typeGroupAria} className="research-filings-options">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setFilterType(tab.key)} aria-pressed={filterType === tab.key} className="research-filings-control">
              {tab.label}<span className="tabular-nums">{tab.count}</span>
            </button>
          ))}
        </div>

        <dl className="research-filings-basis">
          <div><dt>{t.disclosureCollectionBasis}</dt><dd>{disclosureBasis}</dd></div>
          <div><dt>{t.priceScoreBasis}</dt><dd>{priceScoreBasis}</dd></div>
        </dl>
        <span role="note" aria-label={t.periodScopeBadgeAria} className="research-filings-limit">
          <Info size={14} aria-hidden="true" />{t.periodScopeBadge}
        </span>
      </section>

      <div className="research-band-heading">
        <h2>{t.resultTitle}</h2>
        <span className="text-xs text-[var(--muted)]" role="status">
          {t.listCount(filtered.length)} · {t.dateOrder}
        </span>
      </div>
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
            const { disclosure, direction, note } = g.representative;
            const meta = typeMetaOf(g.signalType);
            const Icon = meta.Icon;
            const desc = t.descriptions[g.signalLabel] || t.descFallback;
            const guide = findGuideByLabel(g.signalLabel);
            const checkPoint = guide?.checkPoints?.[0] ?? desc;
            const code = g.stock_code;
            const inUniverse = code !== undefined && universeSet.has(code);
            const filer = disclosure.flr_nm && disclosure.flr_nm !== g.corp_name ? disclosure.flr_nm : null;
            return (
              <article key={g.key} className="research-filing">
                <div className="research-filing-head">
                  <div className="research-filings-identity">
                    <p className="research-filings-meta">
                      <span className="research-filings-type"><Icon size={15} aria-hidden="true" />{g.signalType === "correction" ? g.signalLabel : meta.label} · {t.autoClassified}</span>
                      <span className="tabular-nums">{filingDate(g.rcept_dt_latest)} {t.submitted}</span>
                      {g.count > 1 || g.hasRevision ? <span>{g.hasRevision ? t.revisionIncluded : ""}{t.countUnit(g.count)}</span> : null}
                    </p>
                    <p className="research-filing-company">
                      {g.signalType === "insider_buy" && filer ? <small>{t.targetCompanyLabel}</small> : null}
                      <strong>{g.corp_name}</strong>{code ? <small className="font-mono">{code}</small> : null}
                    </p>
                    <h3 className="research-filing-title">{disclosure.report_nm}</h3>
                    {filer || direction ? (
                      <p className="research-filing-extra">
                        {filer ? <span>{t.reporterLabel} {filer}</span> : null}
                        {direction ? <span>{directionLabel(direction, t)}</span> : null}
                      </p>
                    ) : null}
                  </div>
                  <FilingSource filing={g} t={t} />
                </div>

                <div className="research-filings-check">
                  <strong>{t.checkLabel}</strong><p>{checkPoint}</p>
                </div>
                <div className="research-filings-row-tools">
                  {guide ? (
                    <SignalGuideExpand
                      guide={guide}
                      ariaLabel={t.explainAria(g.corp_name, g.signalLabel)}
                      openLabel={t.expandLabel}
                      closeLabel={t.collapseLabel}
                      context={note && note !== desc ? <p>{note}</p> : undefined}
                    />
                  ) : note && note !== desc ? (
                    <details className="research-filings-footnotes">
                      <summary><ChevronDown size={15} aria-hidden="true" />{t.expandLabel}</summary>
                      <p>{note}</p>
                    </details>
                  ) : null}
                  {code && inUniverse ? (
                    <div className="research-filings-options">
                      <Link href={`/stock/${code}`} aria-label={t.viewStockAria(g.corp_name)} className="research-filings-control">
                        {t.viewStock}<ArrowRight size={15} aria-hidden="true" />
                      </Link>
                      <WatchlistToggle code={code} name={g.corp_name} t={t} />
                    </div>
                  ) : code ? <span className="research-filing-extra">{t.notInUniverse}</span> : null}
                </div>
              </article>
            );
          })
        )}
      </div>

      <details className="research-filings-footnotes">
        <summary><ChevronDown size={15} aria-hidden="true" />{t.topNoticeTitle}</summary>
        <ul>{t.topNoticeBullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
      </details>
    </div>
  );
}
