/**
 * 다음 확인 액션 — 상단 결론에서 바로 다음 행동으로 이동.
 * 앵커는 StockTabs 탭 id와 일치(#disclosures/#financials/#basis). '업종 비교'는 전용 탭이 없어
 * 같은 업종 비교 섹션이 들어 있는 요약 탭(#summary)으로 연결. 설계서 §6.5 / §9.7 / §15.
 * 관심·비교 추가는 상단 헤더 actionsSlot의 실제 버튼이 담당하므로 여기선 죽은 링크를 만들지 않는다.
 */
const ACTIONS: { label: string; icon: string; href: string }[] = [
  { label: "공시 확인", icon: "📋", href: "#disclosures" },
  { label: "재무 보기", icon: "💰", href: "#financials" },
  { label: "점수 근거", icon: "📊", href: "#basis" },
  { label: "업종 비교", icon: "🏷️", href: "#summary" },
];

export function NextActionButtons() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {ACTIONS.map((a) => (
        <a
          key={a.href}
          href={a.href}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-center px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[12px] md:text-[13px] font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition leading-tight break-keep"
        >
          <span aria-hidden="true">{a.icon}</span>
          <span>{a.label}</span>
        </a>
      ))}
    </div>
  );
}
