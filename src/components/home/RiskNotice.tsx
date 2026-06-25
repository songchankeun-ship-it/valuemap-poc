import { ShieldAlert } from "lucide-react";
import { dataStatus } from "@/lib/dataStatus";

// 투자 추천 아님 · 탐색 도구 고지 — 모바일에서도 접히지 않고 항상 노출.
// 본문 3줄은 전역 dataStatus.notices.disclaimer 단일 소스에서 읽는다.
export function RiskNotice() {
  const titles = ["투자 추천이 아닙니다", "점수·신호는 참고 정보입니다", "최종 판단은 사용자 책임입니다"];
  const items = dataStatus.notices.disclaimer.map((body, i) => ({
    title: titles[i] ?? "",
    body,
  }));
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
