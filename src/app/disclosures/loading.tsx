export default function DisclosuresLoading() {
  return (
    <div className="research-desk research-disclosure space-y-4" aria-busy="true" aria-label="공시 신호 불러오는 중">
      <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      <div className="h-9 w-36 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />

      <div className="research-filings-priority">
        <div className="research-filings-priority-heading min-h-[64px] items-center">
          <div className="h-5 w-36 rounded bg-white/15 animate-pulse" />
        </div>
        <ul className="research-filings-priority-list">
          {[1, 2, 3].map((i) => (
            <li key={i} className="min-h-[64px] items-center">
              <div className="space-y-1.5">
                <div className="h-3 w-24 max-w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-48 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              </div>
              <div className="h-11 w-20 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            </li>
          ))}
        </ul>
      </div>

      <div className="research-filings-toolbar min-h-[88px]">
        <div className="research-filings-options">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
