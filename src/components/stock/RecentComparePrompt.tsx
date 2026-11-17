"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, GitCompare } from "lucide-react";
import { FOCUS_RING } from "@/components/ui/controlStyles";
import { getRecentViews, type RecentView } from "@/lib/recentViews";
import { pickRecentCompareCandidate, recentCompareHref } from "@/lib/recentCompare";

export function RecentComparePrompt({ ticker, name }: { ticker: string; name: string }) {
  const [candidate, setCandidate] = useState<RecentView | null>(null);

  useEffect(() => {
    function refresh() {
      setCandidate(pickRecentCompareCandidate(ticker, getRecentViews()));
    }
    refresh();
    window.addEventListener("recent-views-changed", refresh);
    return () => window.removeEventListener("recent-views-changed", refresh);
  }, [ticker]);

  if (!candidate) return null;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900 dark:bg-blue-950/20">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <GitCompare className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          두 종목을 이어서 봤어요
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
          최근 본 {name}, {candidate.name} 두 종목을 같은 기준으로 나란히 확인해 보세요. 점수 차이는 결론이 아니라 확인 순서입니다.
        </p>
      </div>
      <Link
        href={recentCompareHref(ticker, candidate.ticker)}
        data-analytics-event="stock_recent_compare_open"
        data-analytics-ticker={ticker}
        data-analytics-peer-ticker={candidate.ticker}
        className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 ${FOCUS_RING}`}
      >
        나란히 비교
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
