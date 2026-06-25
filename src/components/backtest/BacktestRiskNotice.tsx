import { AlertTriangle } from "lucide-react";
import { dataStatus } from "@/lib/dataStatus";

/**
 * 백테스트 위험·한계 안내 박스 (설계서 §11.4).
 * 서버 컴포넌트. '실험 전략 시뮬레이션 · 현재 종합점수 검증 아님' 단일 고지 +
 * 과거 데이터 기반 시뮬레이션 / 미래 수익 비보장 /
 * 수수료·슬리피지·체결 지연·유동성 한계 / 생존편향·미래참조 제거를 명시한다.
 * 수익률을 강조하지 않고 한계를 또렷이 나열한다. 준비 중·실데이터 양쪽에서 재사용.
 */
export function BacktestRiskNotice({
  assumptions,
  benchmarkLabel,
}: {
  assumptions?: string;
  benchmarkLabel?: string;
}) {
  const items: { head: string; body: string }[] = [
    {
      head: "과거 데이터 기반 시뮬레이션",
      body: "과거 가격으로 복원한 가상의 운용 결과입니다. 과거 성과가 미래 수익을 보장하지 않습니다.",
    },
    {
      head: "체결·비용 한계",
      body: "편도 0.3% 거래비용을 반영했으나 수수료·슬리피지·체결 지연·유동성 한계로 실제 체결가는 달라질 수 있습니다.",
    },
    {
      head: "생존편향 가능",
      body: "현재 분석 유니버스를 과거에 소급 적용해, 상장폐지·편입 이전 종목이 빠지는 생존편향이 있을 수 있습니다.",
    },
    {
      head: "미래참조 제거",
      body: "신호는 전월 마지막 거래일 종가까지만 사용해 다음 거래일에 체결하도록 처리했습니다(미래참조 제거).",
    },
    {
      head: "지표 범위 한계",
      body: "과거 펀더멘털·수급 데이터가 없어 밸류·거래활성도 전략은 제외하고, 가격으로 복원 가능한 신호만 검증했습니다.",
    },
  ];

  return (
    <section
      className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg p-4"
      aria-label="백테스트 위험 및 한계 안내"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" aria-hidden="true" />
        <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
          읽기 전에 — 실험 전략 시뮬레이션의 한계
        </h3>
      </div>
      <p className="text-xs md:text-sm font-medium text-amber-900 dark:text-amber-100 mb-2.5 leading-relaxed">
        {dataStatus.limits.backtest} 현재 ORNSCORE 종합점수 검증 결과는 아닙니다.
      </p>
      <ul className="space-y-2 text-[11px] md:text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        {items.map((it) => (
          <li key={it.head} className="flex gap-2">
            <span className="text-amber-500 dark:text-amber-400 shrink-0" aria-hidden="true">•</span>
            <span className="min-w-0 break-words">
              <strong className="font-semibold">{it.head}</strong> — {it.body}
            </span>
          </li>
        ))}
        {(assumptions || benchmarkLabel) && (
          <li className="flex gap-2 pt-1 border-t border-amber-200/70 dark:border-amber-800/60 mt-1">
            <span className="text-amber-500 dark:text-amber-400 shrink-0" aria-hidden="true">•</span>
            <span className="min-w-0 break-words">
              {benchmarkLabel ? (
                <>벤치마크는 <strong className="font-semibold">{benchmarkLabel}</strong>입니다(실제 시장지수 아님). </>
              ) : null}
              {assumptions ? <>가정: {assumptions}.</> : null}
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}
