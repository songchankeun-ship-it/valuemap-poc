"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, ExternalLink, ArrowRight } from "lucide-react";
import { SignalGuideExpand } from "./SignalGuideExpand";
import { DisclosureSummaryCards } from "./disclosures/DisclosureSummaryCards";
import { findGuideByLabel } from "@/lib/signalGuide";
import { DISCLOSURE_TYPE_ORDER, typeMetaOf } from "@/lib/disclosureType";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/watchlist";
import { useLanguage } from "@/components/LanguageProvider";
import { disclosureExplorerCopy } from "@/lib/copy/disclosures";

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

// 첫 문장만 추출(마침표 기준) — 길면 잘라 카드가 길어지지 않게.
function firstSentence(s: string): string {
  const trimmed = s.trim();
  const m = trimmed.match(/^[^.。!?]*[.。!?]/);
  return (m ? m[0] : trimmed).trim();
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
function WatchlistToggle({ code, t }: { code: string; t: ExplorerCopy }) {
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
      aria-label={added ? t.watchRemoveAria : t.watchAddAria}
      className={"inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium border transition disabled:opacity-50 " +
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

// ISO → KST(서울) 표기. 명시적 timeZone으로 SSR/CSR 일관.
function fmtKST(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(d);
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
  const [filterType, setFilterType] = useState<string>("all");
  // 분석 대상만 / 전체 시장 (설계서 §15 / [P1-4]). 기본은 '전체 시장' — 기존 동작 보존.
  const [scope, setScope] = useState<"universe" | "all">("all");
  const firstRender = useRef(true);

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
        if (j.error) setError(j.error);
        else setData(j);
      })
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [days]);

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
              <div className="h-4 w-1/3 bg-zinc-200 rounded mb-2 animate-pulse" />
              <div className="h-3 w-1/4 bg-zinc-100 rounded mb-2 animate-pulse" />
              <div className="h-3 w-2/3 bg-zinc-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-lg p-4 text-sm text-rose-700 dark:text-rose-400">
        {t.errorPrefix}{error || t.errorUnknown}
      </div>
    );
  }

  const grouped = groupSignals(data.signals);
  // 분석 대상만 보기: 유니버스에 든 종목 공시만. 카운트·배지도 같은 범위로 일관.
  const scoped = scope === "all" ? grouped : grouped.filter((g) => g.stock_code && universeSet.has(g.stock_code));
  const universeCount = grouped.filter((g) => g.stock_code && universeSet.has(g.stock_code)).length;
  const filtered = filterType === "all" ? scoped : scoped.filter((g) => g.signalType === filterType);
  const signalCounts = scoped.reduce<Record<string, number>>((acc, g) => {
    acc[g.signalType] = (acc[g.signalType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <header className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">{t.title}<span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />{t.within200}</span></h2>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {t.summary(days, data.signalCount, scope === "all", scoped.length)}
          </div>
        </div>
        {(() => {
          const when = fmtKST(data.fetchedAt);
          const src = sourceLabel(data.source, t);
          if (!when && !src) return null;
          const parts: string[] = [t.collectedAt];
          parts.push(when ?? t.collectedAtUnknown);
          if (src) parts.push(src);
          return (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 tabular-nums">{parts.join(" · ")}</p>
          );
        })()}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
          {t.infoNote(days)}
        </p>

        <div className="flex gap-2 flex-wrap mb-3">
          {[3, 7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={"px-3 py-1.5 text-xs rounded-md border transition " +
                (days === d
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500")}
            >
              {t.dayUnit(d)}
            </button>
          ))}
          {/* 기간 버튼 옆 반복 배지 — 기간을 바꿔도 '선택 기간 전체 공시'가 아님을 다시 고지 */}
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />{t.periodScopeBadge}
          </span>
        </div>

        {/* 분석 대상만 / 전체 시장 (설계서 §15) — 홈은 분석 대상 중심, 공시 페이지는 전체 시장 탐색까지 */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{t.scopeLabel}</span>
            <div
              role="group"
              aria-label={t.scopeGroupAria}
              className="inline-flex rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-0.5"
            >
              {([
                { key: "all", label: t.scopeAll, count: grouped.length },
                { key: "universe", label: t.scopeUniverse, count: universeCount },
              ] as const).map((opt) => {
                const active = scope === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setScope(opt.key)}
                    aria-pressed={active}
                    className={"inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-md text-xs font-medium transition " +
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

        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={"text-[11px] px-2.5 py-1 rounded-full border transition " +
              (filterType === "all"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500")}
          >
            {t.filterAll(scoped.length)}
          </button>
          {DISCLOSURE_TYPE_ORDER.map((type) => {
            const meta = typeMetaOf(type);
            const count = signalCounts[type] ?? 0;
            const active = filterType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                disabled={count === 0}
                className={"inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition " +
                  (active
                    ? meta.badgeBg + " " + meta.badgeText + " " + meta.badgeBorder + " font-semibold"
                    : count === 0
                    ? "bg-white dark:bg-zinc-900 text-zinc-300 dark:text-zinc-600 border-zinc-100 dark:border-zinc-800 cursor-default"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400")}
              >
                <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + (count === 0 ? "bg-zinc-300 dark:bg-zinc-600" : meta.dot)} aria-hidden="true" />
                {meta.shortLabel} {count}
              </button>
            );
          })}
        </div>
      </header>

      <DisclosureSummaryCards counts={signalCounts} days={days} total={scoped.length} />

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-12 space-y-3">
            <div>{t.empty}</div>
            {filterType !== "all" ? (
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className="text-xs px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition"
              >
                {t.emptyReset}
              </button>
            ) : null}
          </div>
        ) : (
          filtered.map((g) => {
            const meta = typeMetaOf(g.signalType);
            const Icon = meta.Icon;
            const desc = t.descriptions[g.signalLabel] || t.descFallback;
            const guide = findGuideByLabel(g.signalLabel);
            const checkLine = guide?.checkPoints?.[0] ?? null;
            const cautionLine = firstSentence(
              guide?.cautionNote ?? t.cautionFallbackByType[g.signalType] ?? t.cautionFallback,
            );
            const dt = g.rcept_dt_latest;
            const date = dt.length >= 8 ? dt.slice(0, 4) + "." + dt.slice(4, 6) + "." + dt.slice(6, 8) : dt;
            return (
              <div key={g.key} className={"bg-white dark:bg-zinc-900 border-l-4 border-y border-r rounded-lg p-3 md:p-4 transition hover:shadow-sm " + meta.cardBorder}>
                {/* 상단: 타입 아이콘 + 텍스트 배지 + 방향/건수 */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {g.hasRevision ? t.revisionIncluded : ""}{t.countUnit(g.count)}
                    </span>
                  ) : null}
                </div>

                {/* 종목명 · 코드 · 제출일 */}
                <div className="flex items-baseline gap-2 flex-wrap mb-1.5 min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 break-words">{g.corp_name}</span>
                  {g.stock_code ? (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">{g.stock_code}</span>
                  ) : null}
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">{date} {t.submitted}</span>
                  {g.representative.disclosure.flr_nm ? (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-[160px]">· {g.representative.disclosure.flr_nm}</span>
                  ) : null}
                </div>

                {/* 한 줄 의미 */}
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1.5 leading-relaxed break-words">{desc}</p>
                {g.representative.note && g.representative.note !== desc ? (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5 leading-relaxed break-words">{g.representative.note}</p>
                ) : null}

                {/* 확인할 것 — 중립 확인 포인트 */}
                {checkLine ? (
                  <div className="flex gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-md px-2.5 py-1.5 mb-2 leading-relaxed">
                    <span className="font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">{t.checkLabel}</span>
                    <span className="break-words">{checkLine}</span>
                  </div>
                ) : null}

                {/* 주의 — 호재/악재 단정이 아닌 한계·유의점 (확인할 것과 시각적으로 분리) */}
                <div className="flex gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md px-2.5 py-1.5 mb-3 leading-relaxed">
                  <span className="font-semibold text-amber-700 dark:text-amber-400 shrink-0">{t.cautionLabel}</span>
                  <span className="break-words">{cautionLine}</span>
                </div>

                {/* 액션 행 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openExternal(g.representative.disclosure.url)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/50 active:bg-blue-200 transition"
                  >
                    {t.viewSource} <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                  </button>
                  {g.stock_code && universeSet.has(g.stock_code) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => goToStock(g.stock_code!)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 transition"
                      >
                        {t.viewStock} <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                      </button>
                      <WatchlistToggle code={g.stock_code} t={t} />
                    </>
                  ) : null}
                </div>
                {/* 상태 배지는 '원문 보기' 액션과 DOM·시각·텍스트 추출에서 분리 — 버튼 줄 아래 별도 줄(재검수 P2-3) */}
                {g.stock_code && !universeSet.has(g.stock_code) ? (
                  <div className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">{t.notInUniverse}</div>
                ) : null}
                {/* 이 공시 이해하기 — 차별점 */}
                {guide ? <SignalGuideExpand guide={guide} url={g.representative.disclosure.url} /> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}