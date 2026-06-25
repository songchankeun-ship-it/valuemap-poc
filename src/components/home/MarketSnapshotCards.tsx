import Link from "next/link";
import { Database, Award, Activity, FileText } from "lucide-react";

interface MarketSnapshotCardsProps {
  totalCount: number;
  strongCount: number;
  volumeSpikeCount: number;
  signalCount: number;
}

// 오늘의 시장 스냅샷 — 4개 카드(데스크톱 4열, 모바일 2열).
export function MarketSnapshotCards({ totalCount, strongCount, volumeSpikeCount, signalCount }: MarketSnapshotCardsProps) {
  const cards = [
    { icon: Database, tone: "text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800", title: "분석 종목", value: `${totalCount}개`, sub: "실데이터 기반", href: "/stocks" },
    { icon: Award, tone: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40", title: "종합 80+ 후보", value: `${strongCount}개`, sub: "여러 지표에서 강점 확인", href: "/stocks" },
    { icon: Activity, tone: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40", title: "거래활성도 급증", value: `${volumeSpikeCount}개`, sub: "평소보다 거래 관심 증가", href: "/stocks" },
    { icon: FileText, tone: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40", title: "공시 신호", value: `${signalCount}건`, sub: "DART · 최신 200건 내", href: "/disclosures" },
  ];
  return (
    <section>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">오늘의 시장 스냅샷</h2>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">장마감 데이터 요약</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ icon: Icon, tone, title, value, sub, href }) => (
          <Link
            key={title}
            prefetch={false}
            href={href}
            className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-sm transition"
          >
            <div className={"w-8 h-8 rounded-md flex items-center justify-center mb-3 " + tone}>
              <Icon className="w-4 h-4" strokeWidth={1.9} />
            </div>
            <div className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-tight">{title}</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 leading-none">{value}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-tight">{sub}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
