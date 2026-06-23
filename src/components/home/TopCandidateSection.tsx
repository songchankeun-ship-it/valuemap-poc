import { StockCandidateCard, type StockCandidate } from "./StockCandidateCard";

// 오늘 추가 확인 후보 섹션 — 홈에서 가장 중요한 영역.
export function TopCandidateSection({ candidates }: { candidates: StockCandidate[] }) {
  return (
    <section id="today-candidates" className="scroll-mt-20">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">오늘 추가 확인 후보</h2>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">종합점수 상위 · 검증 보류 제외</span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
        종합점수 상위 종목 중 검증 보류 종목을 제외해, 오늘 먼저 살펴볼 후보를 정리했습니다.
      </p>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {candidates.map((c) => (
            <StockCandidateCard key={c.ticker} c={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          표시할 후보 데이터를 준비 중입니다. 잠시 후 다시 확인해 주세요.
        </div>
      )}

      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
        여러 지표에서 상대적으로 강점이 확인된 종목입니다. 점수가 높다고 매수 추천을 의미하지 않으며, 원문 공시와 재무를 함께 확인해야 합니다.
      </p>
    </section>
  );
}
