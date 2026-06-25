"use client";

// 공시 신호 상단 요약 대시보드(설계서 §10.2~§10.4).
// 타입별 카드를 항상 5개 노출 — 0건이면 muted 상태로 '검사했으나 이벤트 없음'을 보인다.
// 색은 disclosureType 단일 소스에서만 가져오고, 항상 텍스트 라벨/아이콘과 함께 쓴다(§20.7).
// 비자문: 호재/악재 표현 없이 'N건'·'이벤트 없음' 같은 사실만 표기.

import { DISCLOSURE_TYPE_ORDER, typeMetaOf } from "@/lib/disclosureType";

export interface DisclosureSummaryCardsProps {
  counts: Record<string, number>; // signalType → 이벤트 묶음 수
  days: number;
  total: number; // 활성 타입 합계(전체 묶음 수)
}

export function DisclosureSummaryCards({ counts, days, total }: DisclosureSummaryCardsProps) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {DISCLOSURE_TYPE_ORDER.map((type) => {
          const meta = typeMetaOf(type);
          const count = counts[type] ?? 0;
          const active = count > 0;
          const Icon = meta.Icon;
          return (
            <div
              key={type}
              className={
                "rounded-lg border p-3 flex flex-col gap-1.5 transition " +
                (active
                  ? meta.badgeBg + " " + meta.badgeBorder
                  : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800")
              }
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={
                    "inline-flex items-center justify-center w-5 h-5 rounded shrink-0 " +
                    (active ? meta.badgeText : "text-zinc-400 dark:text-zinc-600")
                  }
                >
                  <Icon className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span
                  className={
                    "text-xs font-semibold truncate " +
                    (active ? meta.badgeText : "text-zinc-500 dark:text-zinc-400")
                  }
                >
                  {meta.label}
                </span>
              </div>
              <div
                className={
                  "text-2xl font-bold tabular-nums leading-none " +
                  (active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-300 dark:text-zinc-700")
                }
              >
                {count}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                {active ? `최근 ${days}일 · ${count}건` : "이벤트 없음"}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
        최근 {days}일 공시를 5개 유형으로 자동 분류한 결과 · 전체 {total}건. 호재/악재 판단이 아닌 분류입니다.
      </p>
    </div>
  );
}
