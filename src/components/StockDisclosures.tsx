"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { stockDisclosuresCopy } from "@/lib/copy/stockDetail";
import type { Locale } from "@/lib/i18n";

interface SignalInfo {
  signalType: string;
  signalLabel: string;
  strength: number;
  note: string;
  direction?: "긍정 가능" | "부정 가능" | "확인 필요";
}

interface DisclosureItem {
  corp_name: string;
  report_nm: string;
  rcept_no: string;
  flr_nm: string;
  rcept_dt: string;
  url: string;
  signal: SignalInfo | null;
}

interface ApiResponse {
  ticker: string;
  count: number;
  disclosures: DisclosureItem[];
  signalCount: number;
  signalsByType: Record<string, number>;
  source: string;
  fetchedAt?: string;
  note?: string;
}

const SIGNAL_BG: Record<string, string> = {
  "자기주식 취득 결의": "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  "임원·주요주주 보유 변동": "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  "정정공시": "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  "단일판매·공급계약": "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  "유상증자 발행": "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  "전환사채 발행": "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  "신주인수권부사채 발행": "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
};

function getBadgeClass(label: string): string {
  return SIGNAL_BG[label] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700";
}

function SourceBadge({ source, t }: { source: string; t: (typeof stockDisclosuresCopy)[Locale] }) {
  if (source === "live") return <span title={t.sourceLiveTitle} className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-medium">{t.sourceLive}</span>;
  if (source === "cache") return <span title={t.sourceCacheTitle} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium">{t.sourceCache}</span>;
  if (source.startsWith("sample")) return <span title={t.sourceSampleTitle} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">{t.sourceSample}</span>;
  return null;
}

// 수집 출처 라벨 — SourceBadge와 동일 매핑(실시간/저장본/예시 표본)
function sourceLabel(source: string | undefined, t: (typeof stockDisclosuresCopy)[Locale]): string | null {
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

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function StockDisclosures({ ticker }: { ticker: string }) {
  const { locale } = useLanguage();
  const t = stockDisclosuresCopy[locale];
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // '다시 시도' 시 이 값을 증가시켜 fetch effect를 재실행한다(DisclosureExplorer와 동일 패턴).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch("/api/disclosures/" + ticker + "?days=90&limit=20")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.error) setError(j.error);
        else setData(j);
      })
      .catch((e) => {
        if (alive) setError((e as Error).message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [ticker, reloadKey]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">{t.title}</div>
        <div className="space-y-2">
          <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    // 에러 표현은 DisclosureExplorer 오류 카드와 동일한 시각 언어(경고 아이콘 + rose 테두리 + 다시 시도).
    // 원문 에러 메시지는 노출하지 않고 안내 문구(t.loadError)만 보여준다. 다시 시도는 reloadKey만 증가.
    return (
      <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 rounded-lg p-4">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">{t.title}</div>
        <div className="text-center py-4">
          <AlertTriangle className="w-8 h-8 text-rose-400 dark:text-rose-500 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">{t.loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-md text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            {t.loadRetry}
          </button>
        </div>
      </div>
    );
  }

  const signalEntries = Object.entries(data.signalsByType);
  const items = data.disclosures.slice(0, 10);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t.title}</span>
          <SourceBadge source={data.source} t={t} />
        </div>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {t.summaryPrefix} · {t.summaryDisclosures} {data.count}{t.summaryDisclosuresUnit} · {t.summarySignals} {data.signalCount}{t.summarySignalsUnit}
        </span>
      </div>
      {/* 수집 범위 고지 — 전체 공시 이력처럼 오해되지 않게 상시 노출 */}
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 -mt-2 mb-2 leading-relaxed">
        {t.scopeNote}
      </p>
      {(() => {
        const when = fmtKST(data.fetchedAt);
        const src = sourceLabel(data.source, t);
        if (!when && !src) return null;
        const parts: string[] = [t.collectedPrefix];
        parts.push(when ?? t.collectedUnknown);
        if (src) parts.push(src);
        return (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 -mt-2 mb-3 tabular-nums">{parts.join(" · ")}</p>
        );
      })()}

      {data.count === 0 ? (
        <div className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center">
          <p>{t.emptyTitle}</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 leading-relaxed">{t.emptySub}</p>
        </div>
      ) : (
        <div>
          {signalEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              {signalEntries.map((entry) => (
                <span
                  key={entry[0]}
                  className={"text-[11px] px-2 py-0.5 rounded min-w-0 break-words " + getBadgeClass(entry[0])}
                >
                  {entry[0]} {entry[1]}
                </span>
              ))}
            </div>
          ) : null}
          <ol className="relative ml-1 border-l border-zinc-200 dark:border-zinc-800">
            {items.map((d) => {
              const dir = d.signal?.direction;
              // 방향은 긍정/부정 valence(호재/악재) 대신 사실(장내매수/매도 단서) 또는 '방향 확인 필요'로만 표기.
              const dirLabel = dir === "긍정 가능" ? t.dirBuy : dir === "부정 가능" ? t.dirSell : t.dirCheck;
              const dotColor = !d.signal
                ? "bg-zinc-300 dark:bg-zinc-600"
                : dir && dir !== "확인 필요"
                ? "bg-slate-400 dark:bg-slate-500"
                : "bg-amber-500";
              return (
                <li key={d.rcept_no} className="ml-4 pb-4 last:pb-0">
                  <span
                    className={"absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900 " + dotColor}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => openExternal(d.url)}
                    className="w-full text-left -mx-2 px-2 py-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:bg-zinc-100 dark:active:bg-zinc-800 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {d.signal ? (
                          <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium " + getBadgeClass(d.signal.signalLabel)}>
                            {d.signal.signalLabel} · {t.autoClassified}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            DART
                          </span>
                        )}
                        {d.signal?.direction ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {dirLabel}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">
                        {d.rcept_dt.slice(0, 4)}.{d.rcept_dt.slice(4, 6)}.{d.rcept_dt.slice(6, 8)}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 break-words leading-snug">{d.report_nm}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{d.flr_nm}</div>
                    {d.signal?.note ? (
                      <div className="mt-1.5 flex gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-md px-2 py-1.5 leading-relaxed">
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">{t.checkLabel}</span>
                        <span className="break-words line-clamp-2">{d.signal.note}</span>
                      </div>
                    ) : null}
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                      {t.dartOriginal}
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {data.note ? (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3 italic">{data.note}</p>
      ) : null}
    </div>
  );
}
