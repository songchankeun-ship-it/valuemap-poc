import { SignalStockCard, type SignalStockVM } from "./SignalStockCard";

// 신호별 종목 섹션 (설계서 §7.5). 데스크톱 3열 그리드 / 모바일 카드 스택(가로 오버플로우 없음).
// 데이터가 없는 섹션은 억지로 채우지 않고 빈 상태 안내를 보여준다.
export function SignalSection({
  title,
  caption,
  items,
  footnote,
  emptyText,
}: {
  title: string;
  caption: string;
  items: SignalStockVM[];
  footnote?: string;
  emptyText: string;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-2 flex-wrap">
        <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{caption}</span>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
          {items.map((s) => (
            <SignalStockCard key={s.ticker} s={s} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-4 py-6 text-center text-[12px] text-zinc-500 dark:text-zinc-400">
          {emptyText}
        </div>
      )}

      {footnote ? (
        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">{footnote}</p>
      ) : null}
    </section>
  );
}
