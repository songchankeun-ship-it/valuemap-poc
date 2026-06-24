import { dataStatus } from "@/lib/dataStatus";
import { DataStatusBadge, AsOfDateBadge, MetricsVersionBadge } from "@/components/trust/badges";

// 오늘 페이지 최상단 데이터 상태 바 (설계서 §7.2 / §16.4).
// 전역 dataStatus 단일 소스만 읽어 데이터 상태·주가 기준일·공시 기준·산식 버전을 한 줄로 보여준다.
// 데스크톱은 가로 한 줄, 모바일(≤390px)은 자연 줄바꿈으로 압축된다.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
      {children}
    </span>
  );
}

function Divider() {
  return <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700" aria-hidden="true">·</span>;
}

export function TodayStatusBar() {
  return (
    <section
      aria-label="데이터 상태"
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 md:px-4 md:py-3"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] md:text-xs">
        <Field label="데이터 상태">
          <DataStatusBadge tone={dataStatus.statusTone} label={dataStatus.statusLabel} className="font-semibold" />
        </Field>
        <Divider />
        <Field label="주가 기준">
          <AsOfDateBadge label={dataStatus.globalAsOfLabel} suffix="장마감" />
        </Field>
        <Divider />
        <Field label="공시 기준">
          <strong className="text-zinc-700 dark:text-zinc-300 font-medium">최근 업데이트</strong>
        </Field>
        <Divider />
        <Field label="산식 버전">
          <MetricsVersionBadge label={dataStatus.metricsVersionLabel} />
        </Field>
      </div>
    </section>
  );
}
