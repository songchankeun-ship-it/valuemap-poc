import Link from "next/link";

export interface DisclosureSignalVM {
  rceptNo: string;
  signalType: string;
  signalLabel: string;
  corpName: string;
  reportNm: string;
  dateLabel: string;
  checkPoint: string;
  inUniv: boolean;
  code: string;
  dartUrl: string;
}

const SIGNAL_TONE: Record<string, string> = {
  treasury_buy: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  insider_buy: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  correction: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  single_contract: "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900",
  capital_raise: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900",
};

// 오늘 먼저 볼 공시 신호 카드 — 호재/악재 판단이 아니라 '무엇을 확인할지'를 보여준다.
export function DisclosureSignalCard({ s }: { s: DisclosureSignalVM }) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className={"text-[10px] px-1.5 py-0.5 rounded border font-medium " + (SIGNAL_TONE[s.signalType] || "bg-zinc-50 text-zinc-700 border-zinc-200")}>
          {s.signalLabel}
        </span>
        {!s.inUniv ? <span className="text-[10px] text-zinc-400 dark:text-zinc-500">분석 대상 외</span> : null}
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums ml-auto">{s.dateLabel}</span>
      </div>
      <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{s.corpName}</div>
      <p className="text-[12px] text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-snug">{s.reportNm}</p>

      <div className="mt-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/40 px-2.5 py-2">
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5">확인 포인트</div>
        <p className="text-[11px] leading-snug text-zinc-700 dark:text-zinc-300">{s.checkPoint}</p>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {s.inUniv ? (
          <Link prefetch={false} href={"/stock/" + s.code} className="flex-1 text-center px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-400 dark:hover:border-blue-700 transition">
            종목 보기
          </Link>
        ) : null}
        <a href={s.dartUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 transition">
          DART 원문 ↗
        </a>
      </div>
    </div>
  );
}
