import { Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  readingsOf,
  getChecklistByPattern,
  type Reading,
  type StockShape,
} from "@/lib/metricReadings";

/**
 * 점수를 초보자가 이해할 수 있는 한 줄 행동 가이드로 번역.
 * - "이 종목은 좋아? 나빠?" 가 아니라 "뭘 더 확인해야 해?" 에 답한다.
 * 해석/체크리스트 문구는 @/lib/metricReadings 단일 소스에서 가져온다(지표 카드와 공유).
 */

// 점수 → 공시 → 재무 순서로 '먼저 확인할 것'을 안내(설계서 §9.5). 투자 추천이 아니라 확인 순서.
const CONFIRM_ORDER: { step: string; detail: string; href: string; anchorLabel: string }[] = [
  {
    step: "점수부터 본다",
    detail: "어떤 지표가 강하고 약한지 — 위 4지표 카드와 점수 근거에서 이유 확인",
    href: "#basis",
    anchorLabel: "점수 근거",
  },
  {
    step: "공시를 확인한다",
    detail: "자기주식 취득·임원 보유 변동·대형 계약 등 점수에 안 잡히는 신호가 있는지",
    href: "#disclosures",
    anchorLabel: "공시",
  },
  {
    step: "재무로 검증한다",
    detail: "PER·PBR·ROE·배당이 점수와 어긋나지 않는지, 싸 보이는 데 이유가 있는지",
    href: "#financials",
    anchorLabel: "재무",
  },
];

export function BeginnerReading({ s }: { s: StockShape }) {
  const readings: Reading[] = readingsOf(s);
  const checklist = getChecklistByPattern(s);

  const toneStyles: Record<Reading["tone"], string> = {
    good: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20",
    watch: "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40",
    caution: "border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20",
  };

  const toneIcon: Record<Reading["tone"], React.ReactNode> = {
    good: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    watch: <Lightbulb className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />,
    caution: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100">초보자는 이렇게 보세요</h2>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">점수 → 공시 → 재무 순서로 확인할 항목을 정리했어요</p>
        </div>
      </div>

      {/* 헤드라인 — 점수 패턴 요약 */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 mb-3">
        <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5 uppercase tracking-wider">현재 이 종목은</div>
        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{checklist.headline}</div>
      </div>

      {/* 먼저 확인할 것 — 점수 → 공시 → 재무 STEP 카드(설계서 §9.5·§3 번호 중복 제거). ol 자동 번호 대신 STEP n 단일 표기 */}
      <div className="rounded-md border border-blue-100 dark:border-blue-950 bg-blue-50/40 dark:bg-blue-950/20 p-3 mb-3">
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">먼저 확인할 것 <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">— 순서대로</span></div>
        <div className="space-y-2">
          {CONFIRM_ORDER.map((c, i) => (
            <a
              key={c.href}
              href={c.href}
              className="flex gap-2.5 items-start rounded-md border border-blue-100 dark:border-blue-950 bg-white/70 dark:bg-zinc-900/50 p-2.5 hover:border-blue-400 dark:hover:border-blue-700 transition group"
            >
              <span className="shrink-0 inline-flex items-center h-5 px-1.5 rounded bg-blue-600 text-white text-[10px] font-bold tracking-wide tabular-nums">STEP {i + 1}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition break-keep">{c.step} <span aria-hidden>→</span></div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug mt-0.5">{c.detail}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 이 종목에서 특히 — 점수 패턴별 추가 확인 항목 */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 mb-3">
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">이 종목에서 특히 볼 것</div>
        <div className="space-y-1">
          {checklist.items.map((item, i) => (
            <div key={i} className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed flex gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">·</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 leading-snug">
          이동은 위 <strong className="font-medium text-zinc-500 dark:text-zinc-400">먼저 확인할 것</strong> 순서 또는 상단 <strong className="font-medium text-zinc-500 dark:text-zinc-400">다음으로 확인할 것</strong> 버튼을 이용하세요.
        </p>
      </div>

      {/* 지표별 한 줄 해석 — 기본 접힘 */}
      <details className="mt-1">
        <summary className="text-xs text-blue-700 dark:text-blue-400 cursor-pointer select-none">지표별 상세 해석 펼치기 ▾</summary>
        <div className="space-y-1.5 mt-2">
        {readings.map((r) => (
          <div
            key={r.label}
            className={"border rounded-md p-2.5 " + toneStyles[r.tone]}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{r.emoji}</span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{r.label}</span>
              <span className="text-xs font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                {Math.round(r.score)}
              </span>
              <span className="ml-auto">{toneIcon[r.tone]}</span>
            </div>
            <div className="text-[11px] text-zinc-700 dark:text-zinc-300 mb-0.5 leading-snug">
              <strong>{r.meaning}</strong>
            </div>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              → {r.action}
            </div>
          </div>
        ))}
        </div>
      </details>

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">
        ⚠ 이 해석은 매수·매도 추천이 아닙니다. 점수 패턴을 보고 무엇을 더 확인할지 알려드리는 가이드입니다.
      </p>
    </section>
  );
}
