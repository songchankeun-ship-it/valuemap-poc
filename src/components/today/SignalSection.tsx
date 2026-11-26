import { SignalStockCard, type SignalStockVM } from "./SignalStockCard";

// Real signal rows stay legible without a second card grid.
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
    <section className="research-signal-group">
      <div className="flex items-baseline gap-2 mb-2 flex-wrap">
        <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{caption}</span>
      </div>

      {items.length > 0 ? (
        <div className="research-signal-list">
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
