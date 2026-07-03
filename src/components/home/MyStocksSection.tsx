"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Clock, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/copy/home";
import { getWatchlist } from "@/lib/watchlist";
import { getRecentViews } from "@/lib/recentViews";
import { fmtRelativeTime } from "@/lib/format";

// 홈 대시보드의 재방문 개인화 진입점 — 관심 종목·최근 본 종목을 컴팩트 행으로 이어보게 한다.
// 서버/마운트 전에는 null(하이드레이션 불일치 방지), 로딩 중 스켈레톤, 데이터 없으면 차분한 빈 상태.
// 점수 로직은 건드리지 않고 서버가 넘긴 풀 룩업(name·sector·score·changePct)만 사용한다.

export interface PoolEntry {
  name: string;
  sector: string;
  score: number;
  changePct: number;
}

type Row = {
  ticker: string;
  source: "watchlist" | "recent";
  // 최근 본 종목 행에만 실린다(관심 종목 행은 업종을 그대로 표시). ms 타임스탬프.
  viewedAt?: number;
} & PoolEntry;

export function MyStocksSection({ lookup }: { lookup: Record<string, PoolEntry> }) {
  const { locale } = useLanguage();
  const t = homeCopy[locale].myStocks;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let active = true;

    async function build() {
      // 관심 종목(우선) → 최근 본 종목(중복 제거) 순으로 최대 8개 행. 저장소 차단 시 graceful.
      const seen = new Set<string>();
      const next: Row[] = [];
      try {
        const wl = await getWatchlist();
        for (const item of wl) {
          if (seen.has(item.ticker)) continue;
          const entry = lookup[item.ticker];
          if (!entry) continue; // 분석 대상 외(룩업에 없음)면 건너뜀
          seen.add(item.ticker);
          next.push({ ticker: item.ticker, source: "watchlist", ...entry });
        }
      } catch {
        // 관심 종목 조회 실패 — 최근 본 종목만으로 진행
      }
      try {
        const recent = getRecentViews();
        for (const rv of recent) {
          if (seen.has(rv.ticker)) continue;
          const entry = lookup[rv.ticker];
          if (!entry) continue;
          seen.add(rv.ticker);
          next.push({ ticker: rv.ticker, source: "recent", viewedAt: rv.viewedAt, ...entry });
        }
      } catch {
        // 최근 본 종목 조회 실패 — 있는 데이터만 사용
      }
      if (active) {
        setRows(next.slice(0, 8));
        setLoading(false);
      }
    }
    build();

    // 무한 로딩 방지 — 8초 후 강제 종료(관심 종목 리더가 Supabase를 거칠 수 있음)
    const timeout = setTimeout(() => { if (active) setLoading(false); }, 8000);

    function refresh() { build(); }
    window.addEventListener("watchlist-changed", refresh);
    window.addEventListener("recent-views-changed", refresh);

    return () => {
      active = false;
      clearTimeout(timeout);
      window.removeEventListener("watchlist-changed", refresh);
      window.removeEventListener("recent-views-changed", refresh);
    };
  }, [mounted, lookup]);

  // 서버·마운트 전에는 렌더하지 않아 하이드레이션 불일치를 피한다.
  if (!mounted) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mb-2.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="shrink-0 text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded px-1.5 py-0.5 whitespace-nowrap tabular-nums">1 · {t.stepEyebrow}</span>
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            <Heart className="w-4 h-4 text-pink-600 dark:text-pink-500 shrink-0" fill="currentColor" />
            {t.heading}
          </h2>
        </div>
        {rows.length > 0 ? (
          <Link prefetch={false} href="/watchlist" className="text-[12px] font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap">
            {t.viewAll}
          </Link>
        ) : (
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.sub}</span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" aria-busy="true" aria-label={t.loading}>
          {[0, 1].map((i) => (
            <div key={i} className="h-[52px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-5 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          <p className="break-words">{t.emptyLine}</p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <Link prefetch={false} href="/stocks" className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline">
              {t.emptyExplore} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link prefetch={false} href="/watchlist" className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:underline">
              {t.emptyWatchlist}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rows.map((r) => (
            <li key={r.ticker}>
              <Link
                prefetch={false}
                href={"/stock/" + r.ticker}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-sm transition group"
              >
                <span
                  className={"inline-flex items-center justify-center w-5 h-5 rounded shrink-0 " + (r.source === "watchlist" ? "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400")}
                  aria-hidden="true"
                >
                  {r.source === "watchlist" ? <Heart className="w-3 h-3" fill="currentColor" /> : <Clock className="w-3 h-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {r.name}
                  </span>
                  <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {r.source === "recent" && r.viewedAt !== undefined
                      ? `${t.recentLabel} · ${fmtRelativeTime(r.viewedAt, { locale, absolute: "md" })}`
                      : `${r.source === "watchlist" ? t.watchlistLabel : t.recentLabel} · ${r.sector}`}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13px] font-bold tabular-nums text-zinc-900 dark:text-zinc-100" aria-label={t.scoreAria(r.score)}>
                    {r.score}
                  </span>
                  <span
                    className={"block text-[11px] font-medium tabular-nums " + (r.changePct >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}
                    aria-label={t.changeAria(r.changePct)}
                  >
                    {r.changePct >= 0 ? "▲" : "▼"}{Math.abs(r.changePct).toFixed(2)}%
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 ? (
        <div className="mt-2.5 flex items-center gap-x-3 gap-y-1 flex-wrap text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{t.nextPrompt}</span>
          <Link prefetch={false} href="#today-candidates" className="inline-flex items-center gap-1 min-h-[44px] py-2 font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap">
            {t.nextCandidates} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link prefetch={false} href="/disclosures" className="inline-flex items-center gap-1 min-h-[44px] py-2 font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap">
            {t.nextDisclosures} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
