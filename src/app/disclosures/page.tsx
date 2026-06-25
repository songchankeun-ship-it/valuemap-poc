import Link from "next/link";
import { DisclosureExplorer } from "@/components/DisclosureExplorer";
import { getRecentSignals } from "@/lib/recentSignals";
import { realStockPool } from "@/lib/realStocks";
import { DataStatusBadge } from "@/components/trust/badges";

export const metadata = {
  title: "공시 신호 — 오른스코어",
  description: "최근 7일 한국 상장사 공시에서 5가지 시장 신호만 추출. 자기주식·임원·주요주주 보유변동·정정·대형계약·증자.",
};

export const revalidate = 1800;

export default async function DisclosuresPage() {
  const initial = await getRecentSignals(7);
  const universe = realStockPool.map((s) => s.ticker);
  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1">
        <Link href="/">홈</Link>
        <span>›</span>
        <span className="text-gray-900 dark:text-zinc-100">공시 신호</span>
      </nav>

      <header>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-xl font-medium">공시 신호</h1>
          <DataStatusBadge
            tone="limited"
            label="제한 수집"
            className="text-[11px] rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5"
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          최근 7일 코스피·코스닥 공시에서 자체 추출한 <strong>5가지 시장 신호</strong>.
          자기주식 취득, 임원·주요주주 보유 변동, 손익 정정, 대형 계약, 유증/CB.
        </p>
      </header>

      {/* 기간/공시 필터 근처 — 수집 제한 보조 설명 (접근 가능한 visible note) */}
      <details className="text-xs text-gray-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2">
        <summary className="cursor-pointer select-none font-medium text-gray-700 dark:text-zinc-200">
          수집 범위 안내 — 최신 200건 내 분석
        </summary>
        <p className="mt-2 leading-relaxed text-gray-600 dark:text-zinc-400">
          선택한 기간 전체 공시가 아니라, 코스피·코스닥 각 최신 100건(합 200건)에서 자동 추출한 신호입니다.
          표시는 최대 50건이며, 선택한 기간의 전체 공시가 포함되지 않아 일부 공시가 누락될 수 있습니다.
        </p>
      </details>

      <DisclosureExplorer initialData={initial} universe={universe} />

      <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">
        본 페이지의 신호는 DART 공시 보고서명 매칭 기반 1차 필터입니다.
        본문 확인 + 시세 추이 검토 후 판단하세요. 투자 권유가 아닙니다.
      </p>
    </div>
  );
}
