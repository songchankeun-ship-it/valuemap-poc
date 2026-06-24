/**
 * 백테스트 한계 요약 배지 4종 (설계서 §10.5 / 이슈 4).
 * 상단에서 한눈에 보이는 차분한 pill. 성과·수익·추천 표현을 쓰지 않고 한계만 요약한다.
 * 긴 주의 문구는 본문에 유지하고, 이 배지는 그 요약 역할만 한다. 모바일에서 2×2로 줄바꿈된다.
 */
const LIMITS = [
  "아이디어 검증용",
  "현재 종합점수 검증 아님",
  "생존편향 가능",
  "슬리피지 단순화",
];

export function BacktestLimitBadges() {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="백테스트 한계 요약">
      {LIMITS.map((label) => (
        <li
          key={label}
          className="inline-flex items-center gap-1 text-[11px] md:text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 text-slate-600 dark:text-slate-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}
