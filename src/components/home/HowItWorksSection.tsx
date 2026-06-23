import Link from "next/link";
import { ListChecks, BarChart3, FileSearch } from "lucide-react";

// 오른스코어 사용 방식 3단계 — 오늘 후보 확인 → 이유 확인 → 원문 검증.
export function HowItWorksSection() {
  const steps = [
    {
      icon: ListChecks,
      step: "STEP 1",
      title: "오늘 후보 확인",
      body: "종합점수와 급변 지표로 오늘 먼저 볼 종목을 좁힙니다.",
    },
    {
      icon: BarChart3,
      step: "STEP 2",
      title: "이유 확인",
      body: "추세·거래활성도·밸류·위험조정 지표를 나눠 보며 근거를 점검합니다.",
    },
    {
      icon: FileSearch,
      step: "STEP 3",
      title: "원문 검증",
      body: "공시·재무·차트를 함께 확인하고 최종 판단은 직접 합니다.",
    },
  ];
  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">오른스코어는 이렇게 사용하세요</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">점수로 좁히고, 이유를 보고, 원문으로 검증하는 3단계입니다.</p>
        </div>
        <Link prefetch={false} href="/stocks" className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap">
          종목 탐색 시작하기 →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map(({ icon: Icon, step, title, body }) => (
          <div key={step} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" strokeWidth={1.9} />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">{step}</span>
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{title}</div>
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
