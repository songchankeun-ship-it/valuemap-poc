"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bot, X, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import {
  getAnalysisHistory,
  deleteAnalysis,
  type AnalysisRecord,
} from "@/lib/aiHistory";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-blue-600";
  return "text-zinc-500";
}

export function HistoryClient() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    function load() {
      getAnalysisHistory().then((data) => {
        if (mounted) {
          setRecords(data);
          setLoading(false);
        }
      });
    }
    load();

    function onChange() {
      load();
    }
    window.addEventListener("ai-analyses-changed", onChange);
    return () => {
      mounted = false;
      window.removeEventListener("ai-analyses-changed", onChange);
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("이 요약 기록을 삭제할까요?")) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    await deleteAnalysis(id);
  }

  if (loading) {
    return (
      <ul className="space-y-3" aria-busy="true" aria-label="요약 기록 불러오는 중">
        {[0, 1, 2].map((i) => (
          <li key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-2" />
                <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
              <div className="h-8 w-10 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse shrink-0" />
            </div>
            <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-2" />
            <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </li>
        ))}
      </ul>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 rounded-lg p-10 text-center">
        <Bot className="w-8 h-8 text-zinc-300 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">아직 요약 기록이 없어요</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          공개 베타에서는 요약 기록 기능을 전면에 노출하지 않습니다.
        </p>
        <Link
          href="/stocks"
          className="inline-block px-4 py-2 bg-zinc-900 text-white rounded-md text-xs font-medium hover:bg-zinc-800 transition"
        >
          종목 둘러보기 →
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {records.map((r) => {
        const isOpen = expanded === r.id;
        return (
          <li key={r.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <Link href={`/stock/${r.ticker}`} className="flex-1 min-w-0 group">
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums font-mono">{r.ticker}</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 truncate">
                  {r.tickerName ?? r.ticker}
                </div>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className={`text-2xl font-bold tabular-nums ${scoreColor(r.analysis.finalScore)}`}>
                    {r.analysis.finalScore}
                  </div>
                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500">/100</div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-red-600 transition"
                  aria-label="삭제"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3 leading-relaxed">
              {r.analysis.oneLineSummary}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatTime(r.createdAt)}
              </span>
              {r.source ? (
                <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600 dark:text-zinc-400 text-[10px]">
                  {r.source}
                </span>
              ) : null}
              {r.model ? <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">{r.model}</span> : null}
            </div>

            <button
              onClick={() => setExpanded(isOpen ? null : r.id)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {isOpen ? (
                <>
                  접기 <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  자세히 보기 <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>

            {isOpen ? (
              <div className="mt-3 space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <Section title="자체 지표 해석">{r.analysis.scoreInterpretation}</Section>
                <Section title="재무 핵심">{r.analysis.financialContext}</Section>
                <Section title="테마 맥락">{r.analysis.themeContext}</Section>
                {r.analysis.disclosureInsight ? (
                  <Section title="최근 공시 시사점">{r.analysis.disclosureInsight}</Section>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded p-2.5">
                    <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">
                      호재 3
                    </div>
                    <ul className="text-xs space-y-1 text-emerald-900 dark:text-emerald-200">
                      {r.analysis.positives.map((p, i) => (
                        <li key={i} className="flex gap-1">
                          <span className="opacity-60">{i + 1}.</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-2.5">
                    <div className="text-[10px] font-semibold text-red-700 dark:text-red-400 mb-1.5 uppercase tracking-wide">
                      리스크 3
                    </div>
                    <ul className="text-xs space-y-1 text-red-900 dark:text-red-200">
                      {r.analysis.risks.map((p, i) => (
                        <li key={i} className="flex gap-1">
                          <span className="opacity-60">{i + 1}.</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded">
                  {r.analysis.finalNote}
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
        {title}
      </div>
      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{children}</p>
    </div>
  );
}
