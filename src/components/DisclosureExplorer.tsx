"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, ExternalLink, ArrowRight } from "lucide-react";
import { SignalGuideExpand } from "./SignalGuideExpand";
import { DisclosureSummaryCards } from "./disclosures/DisclosureSummaryCards";
import { findGuideByLabel } from "@/lib/signalGuide";
import { DISCLOSURE_TYPE_ORDER, typeMetaOf } from "@/lib/disclosureType";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/watchlist";

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

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  "자기주식 취득 결의": "주주환원 관련 이벤트로 분류됨. 원문과 시세 반응 확인 권장.",
  "임원·주요주주 보유 변동": "소유상황보고서. 매수·매도·스톡옵션 등 방향은 본문 확인 필요(매수로 단정 금지).",
  "정정공시": "기존 공시 정정. 변경 사유와 내용은 원문 확인 권장.",
  "단일판매·공급계약": "계약 규모와 직전 매출 비율은 본문 확인 권장.",
  "유상증자 발행": "자금 사용 목적(시설 vs 운영)에 따라 영향 다름.",
  "전환사채 발행": "전환가/만기/규모는 본문 확인 필요.",
  "신주인수권부사채 발행": "신주인수권 행사가/만기/규모는 본문 확인 필요.",
};

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function goToStock(code: string) {
  window.location.href = "/stock/" + code;
}

// 공시 카드용 컴팩트 관심 토글 — 분석 대상(유니버스) 종목에만 노출
function WatchlistToggle({ code }: { code: string }) {
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
      aria-label={added ? "관심 종목에서 제거" : "관심 종목에 추가"}
      className={"inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium border transition disabled:opacity-50 " +
        (added
          ? "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-950/50"
          : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-pink-300 hover:text-pink-600 dark:hover:text-pink-400")}
    >
      <Heart className="w-3.5 h-3.5" fill={added ? "currentColor" : "none"} strokeWidth={added ? 0 : 1.8} />
      {added ? "관심 등록됨" : "관심"}
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

// 수집 출처 한글 라벨 — StockDisclosures의 SourceBadge와 동일 매핑(실시간/저장본/예시 표본)
function sourceKo(source?: string): string | null {
  if (!source) return null;
  if (source.startsWith("sample")) return "예시 표본";
  if (source === "live") return "실시간";
  if (source === "cache") return "저장본";
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
  const universeSet = new Set(universe);
  const [data, setData] = useState<ApiResponse | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialData?.days ?? 7);
  const [filterType, setFilterType] = useState<string>("all");
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
          <span>최근 {days}일 DART 공시를 불러오고 있습니다...</span>
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
        공시 데이터를 가져오지 못했습니다: {error || "알 수 없는 에러"}
      </div>
    );
  }

  const grouped = groupSignals(data.signals);
  const filtered = filterType === "all" ? grouped : grouped.filter((g) => g.signalType === filterType);
  const signalCounts = grouped.reduce<Record<string, number>>((acc, g) => {
    acc[g.signalType] = (acc[g.signalType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <header className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">공시 신호{data.totalDisclosures >= 200 ? <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />일부 결과 · 최신 200건</span> : null}</h2>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            최근 {days}일 · 조회 원본 {data.totalDisclosures}건 · 신호 추출 {data.signalCount}건 · 이벤트 묶음 {grouped.length}개
          </div>
        </div>
        {(() => {
          const when = fmtKST(data.fetchedAt);
          const src = sourceKo(data.source);
          if (!when && !src) return null;
          const parts = ["수집 기준"];
          parts.push(when ?? "수집 시각 미상");
          if (src) parts.push(src);
          return (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 tabular-nums">{parts.join(" · ")}</p>
          );
        })()}
        {data.totalDisclosures >= 200 ? (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
            ℹ 현재 오른스코어는 성능·비용을 위해 최신 공시 200건까지만 분석합니다. 선택한 기간의 전체 공시가 포함되지 않을 수 있습니다.
          </p>
        ) : null}

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
              {d}일
            </button>
          ))}
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
            전체 {grouped.length}
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

      <DisclosureSummaryCards counts={signalCounts} days={days} total={grouped.length} />

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-12">해당 신호가 없습니다.</div>
        ) : (
          filtered.map((g) => {
            const meta = typeMetaOf(g.signalType);
            const Icon = meta.Icon;
            const desc = SIGNAL_DESCRIPTIONS[g.signalLabel] || "원문과 시세 반응 함께 확인 권장.";
            const guide = findGuideByLabel(g.signalLabel);
            const checkLine = guide?.checkPoints?.[0] ?? null;
            const dt = g.rcept_dt_latest;
            const date = dt.length >= 8 ? dt.slice(0, 4) + "." + dt.slice(4, 6) + "." + dt.slice(6, 8) : dt;
            return (
              <div key={g.key} className={"bg-white dark:bg-zinc-900 border-l-4 border-y border-r rounded-lg p-3 md:p-4 transition hover:shadow-sm " + meta.cardBorder}>
                {/* 상단: 타입 아이콘 + 텍스트 배지 + 방향/건수 */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className={"inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium border " + meta.badgeBg + " " + meta.badgeText + " " + meta.badgeBorder}>
                    <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                    {meta.label} · 자동분류
                  </span>
                  {g.representative.direction ? (
                    <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium " + (g.representative.direction === "긍정 가능" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" : g.representative.direction === "부정 가능" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400")}>
                      방향 {g.representative.direction}
                    </span>
                  ) : null}
                  {g.count > 1 ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {g.hasRevision ? "정정 포함 " : ""}{g.count}건
                    </span>
                  ) : null}
                </div>

                {/* 종목명 · 코드 · 제출일 */}
                <div className="flex items-baseline gap-2 flex-wrap mb-1.5 min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 break-words">{g.corp_name}</span>
                  {g.stock_code ? (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">{g.stock_code}</span>
                  ) : null}
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">{date} 제출</span>
                  {g.representative.disclosure.flr_nm ? (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-[160px]">· {g.representative.disclosure.flr_nm}</span>
                  ) : null}
                </div>

                {/* 한 줄 의미 */}
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1.5 leading-relaxed break-words">{desc}</p>
                {g.representative.note && g.representative.note !== desc ? (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5 leading-relaxed break-words">{g.representative.note}</p>
                ) : null}

                {/* 확인할 것 — 구분된 주의 라인 */}
                {checkLine ? (
                  <div className="flex gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-md px-2.5 py-1.5 mb-3 leading-relaxed">
                    <span className="font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">확인할 것</span>
                    <span className="break-words">{checkLine}</span>
                  </div>
                ) : <div className="mb-3" />}

                {/* 액션 행 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openExternal(g.representative.disclosure.url)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/50 active:bg-blue-200 transition"
                  >
                    원문 보기 <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                  </button>
                  {g.stock_code && universeSet.has(g.stock_code) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => goToStock(g.stock_code!)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 transition"
                      >
                        종목 보기 <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                      </button>
                      <WatchlistToggle code={g.stock_code} />
                    </>
                  ) : g.stock_code ? (
                    <span className="inline-flex items-center px-3 py-2 text-[11px] text-zinc-400 dark:text-zinc-500">분석 대상 외 · DART 원문만</span>
                  ) : null}
                </div>
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