import { StockCandidateCard, type StockCandidate } from "@/components/home/StockCandidateCard";

// 오늘의 Top 3 — 일반 리스트가 아니라 홈과 동일한 큰 후보 카드로 보여준다(설계서 §7.4).
// 점수 게이지·4지표 막대·강점/주의·CTA를 갖춘 StockCandidateCard를 재사용해 시각 톤을 홈과 통일.
export function TodayTopSection({ candidates }: { candidates: StockCandidate[] }) {
  return (
    <section id="today-top3" className="scroll-mt-20">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">오늘의 Top 3</h2>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">종합점수 상위 · 탐색 우선순위</span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
        여러 지표에서 상대적으로 강점이 확인된 오늘의 탐색 우선 후보입니다. 매수 추천이 아니라 먼저 살펴볼 순서를 제안합니다.
      </p>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {candidates.map((c) => (
            <StockCandidateCard key={c.ticker} c={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          표시할 후보 데이터를 준비 중입니다. 잠시 후 다시 확인해 주세요.
        </div>
      )}
    </section>
  );
}
