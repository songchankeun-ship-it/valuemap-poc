import Link from "next/link";

export interface ThemeCardProps {
  slug: string;
  name: string;
  stockCount: number;
  neglectScore: number;
}

export function ThemeCard({ slug, name, stockCount, neglectScore }: ThemeCardProps) {
  const intensity = Math.min(neglectScore, 100);
  return (
    <Link
      href={`/theme/${slug}`}
      className="group relative block bg-white border border-zinc-200 rounded-xl p-3.5 hover:border-brand-400 hover:shadow-card hover:-translate-y-0.5 transition-all overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 to-brand-600 opacity-60"
        style={{ width: `${intensity}%` }}
      />
      <div className="text-sm font-semibold text-zinc-900 mb-1 tracking-tight">{name}</div>
      <div className="text-[11px] text-zinc-500 mb-2.5">{stockCount}개 종목</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-brand-600 tabular-nums">{neglectScore}</span>
        <span className="text-[10px] text-zinc-400">/100</span>
      </div>
      <div className="text-[10px] text-zinc-400 mt-0.5">소외 점수</div>
    </Link>
  );
}
