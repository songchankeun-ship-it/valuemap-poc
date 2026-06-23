import { ShieldAlert } from "lucide-react";

// 투자 추천 아님 · 탐색 도구 고지 — 모바일에서도 접히지 않고 항상 노출.
export function RiskNotice() {
  const items = [
    {
      title: "투자 추천이 아닙니다",
      body: "오른스코어는 특정 종목의 매수·매도를 권하지 않습니다. 오늘 먼저 살펴볼 탐색 후보를 데이터로 정리할 뿐입니다.",
    },
    {
      title: "과거 데이터 기반입니다",
      body: "모든 점수와 신호는 과거 가격·재무·공시 데이터에서 계산됩니다. 점수가 높다고 미래 수익을 보장하지 않습니다.",
    },
    {
      title: "최종 판단은 사용자 책임입니다",
      body: "원문 공시, 재무, 차트를 직접 확인한 뒤 투자 여부는 본인이 결정해야 합니다.",
    },
  ];
  return (
    <section className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" strokeWidth={2} />
        <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-300">투자 추천 아님 · 탐색 도구 고지</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.title} className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-amber-100 dark:border-amber-900/40 p-3">
            <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{it.title}</div>
            <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
