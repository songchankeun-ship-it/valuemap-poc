import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PLANS, COMPARE_ROWS, type Plan, type CompareCell } from "@/lib/pricing";

export const metadata = {
  title: "요금제 — 오른스코어",
  description:
    "오른스코어 무료/Pro/Premium 요금제 방향. 종목 탐색·기본 지표는 무료, Pro·Premium은 출시 예정(준비 중)이며 가격은 미확정입니다.",
};

function PlanCard({ plan }: { plan: Plan }) {
  const planned = plan.status === "planned";
  const marker = plan.id === "free" ? "✓" : plan.id === "pro" ? "★" : "◆";
  const markerColor =
    plan.id === "free"
      ? "text-emerald-600 dark:text-emerald-400"
      : plan.id === "pro"
        ? "text-blue-600 dark:text-blue-400"
        : "text-violet-600 dark:text-violet-400";

  return (
    <section
      className={`relative bg-white dark:bg-zinc-900 rounded-xl p-5 min-w-0 ${
        plan.id === "pro"
          ? "border-2 border-blue-300 dark:border-blue-800"
          : plan.id === "premium"
            ? "border-2 border-violet-300 dark:border-violet-800"
            : "border border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {planned && (
        <span
          className={`absolute -top-2.5 left-5 text-[10px] font-semibold px-2 py-0.5 rounded text-white ${
            plan.id === "pro" ? "bg-blue-600" : "bg-violet-600"
          }`}
        >
          출시 예정 · 준비 중
        </span>
      )}
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{plan.name}</h2>
        <span
          className={`text-sm font-bold shrink-0 ${
            plan.id === "free"
              ? "text-zinc-900 dark:text-zinc-100"
              : plan.id === "pro"
                ? "text-blue-700 dark:text-blue-400"
                : "text-violet-700 dark:text-violet-400"
          }`}
        >
          {plan.id === "free" ? plan.priceLabel : "가격 미확정"}
        </span>
      </div>
      {planned && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 break-words leading-relaxed">
          {plan.priceLabel}
        </p>
      )}
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed break-words">
        {plan.valueLine}
      </p>
      <ul className="space-y-2">
        {plan.includes.map((f) => (
          <li key={f} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
            <span className={`shrink-0 ${markerColor}`}>{marker}</span>
            <span className="break-words min-w-0">{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        {plan.id === "free" ? (
          <Link
            href="/today"
            className="block text-center px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            지금 무료로 시작하기 →
          </Link>
        ) : (
          <>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 break-words">
              아직 준비 중이에요. 출시되면 가장 먼저 알려드릴게요.
            </p>
            <WaitlistForm source={`pricing-${plan.id}`} />
          </>
        )}
      </div>
    </section>
  );
}

function Cell({ value }: { value: CompareCell }) {
  if (value === true) return <span className="text-emerald-600 dark:text-emerald-400">✓</span>;
  if (value === false) return <span className="text-zinc-400 dark:text-zinc-600">—</span>;
  // 문자열: "준비 중" · "베타 무료" 또는 한도("5개" 등)
  const planned = value === "준비 중";
  const betaFree = value === "베타 무료";
  return (
    <span
      className={`text-[11px] break-words ${
        planned
          ? "text-amber-700 dark:text-amber-400"
          : betaFree
            ? "text-sky-700 dark:text-sky-400"
            : "text-zinc-700 dark:text-zinc-300"
      }`}
    >
      {value}
    </span>
  );
}

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 space-y-6 py-8">
      <header className="text-center">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← 홈으로
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">요금제</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed max-w-xl mx-auto break-words">
          탐색·기본 분석은 계속 <strong>무료</strong>입니다. <strong>Pro·Premium은 출시 예정(준비 중)</strong>이며,
          아래 가격은 모두 <strong className="text-amber-700 dark:text-amber-400">검토 중·미확정</strong>입니다.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      {/* 베타 무료 → 정식 출시 시 Pro 전환 안내 — 눈에 띄게 (Item 3) */}
      <section className="flex items-start gap-2.5 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/30 p-4">
        <span className="shrink-0 mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-600 text-white">베타 무료</span>
        <div className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed break-words">
          <strong className="font-semibold">관심 종목 공시 알림 · 저장 조건 알림</strong>은 지금은 베타 기간 동안 무료로 쓸 수 있어요.
          이 알림 기능은 <strong className="font-semibold">정식 출시 시 Pro 기능으로 전환될 예정</strong>입니다.
          전환 시점과 가격은 아직 <strong className="font-semibold text-amber-700 dark:text-amber-400">미확정</strong>이며, 변경 전 미리 공지합니다.
        </div>
      </section>

      {/* 기능 비교표 — 390px에서 가로 스크롤로 안전하게 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">기능 비교</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 break-words">
          ✓ 제공 · — 미제공 · <span className="text-amber-700 dark:text-amber-400">준비 중</span> = 출시 예정(아직 이용·발송·과금 없음) · <span className="text-sky-700 dark:text-sky-400">베타 무료</span> = 베타 기간 한시 무료
        </p>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
                <th className="text-left font-medium text-zinc-600 dark:text-zinc-400 px-3 py-2.5 break-words">기능</th>
                <th className="text-center font-medium text-zinc-900 dark:text-zinc-100 px-2 py-2.5 w-16">무료</th>
                <th className="text-center font-medium text-blue-700 dark:text-blue-400 px-2 py-2.5 w-20">
                  Pro<span className="block text-[9px] font-normal text-zinc-400">준비 중</span>
                </th>
                <th className="text-center font-medium text-violet-700 dark:text-violet-400 px-2 py-2.5 w-20">
                  Premium<span className="block text-[9px] font-normal text-zinc-400">준비 중</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                  <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 break-words">{row.label}</td>
                  <td className="px-2 py-2.5 text-center"><Cell value={row.free} /></td>
                  <td className="px-2 py-2.5 text-center"><Cell value={row.pro} /></td>
                  <td className="px-2 py-2.5 text-center"><Cell value={row.premium} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 break-words leading-relaxed">
          가격·정책은 검토 중이며 출시 전 확정·공지됩니다. 현재 Pro·Premium은 결제·발송이 연결돼 있지 않습니다.
          관심 종목 공시·저장 조건 알림은 지금은 <strong className="text-sky-700 dark:text-sky-400">베타 기간 무료</strong>로 체험할 수 있으며, 정식 출시 시 Pro 기능으로 전환될 예정입니다.
        </p>
      </section>

      {/* §13.2 서비스 공통 고지 */}
      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed break-words">
        오른스코어는 <strong>투자 추천이 아닌 데이터 기반 탐색 도구</strong>입니다. 모든 점수와 신호는 종목을 더 빠르게
        탐색하기 위한 <strong>참고 정보</strong>이며, 매수·매도 추천이 아닙니다. 유료(Pro·Premium) 기능도 개별 종목
        매수·매도 조언이 아니라 정보·변화 알림·리서치 보조를 제공합니다. <strong>최종 투자 판단과 책임은 사용자 본인에게 있습니다.</strong>
      </section>
    </div>
  );
}
