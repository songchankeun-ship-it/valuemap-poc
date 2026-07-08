"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardCheck, ArrowRight, RotateCcw } from "lucide-react";
import {
  getChecklist,
  toggleChecklistItem,
  clearChecklist,
  CHECKLIST_ITEMS,
} from "@/lib/stockChecklist";
import { useLanguage } from "@/components/LanguageProvider";
import { stockChecklistCopy } from "@/lib/copy/stockDetail";
import { FOCUS_RING } from "@/components/ui/controlStyles";

/**
 * 확인 완료 체크리스트 — 사용자가 직접 확인한 항목(공시·실적·밸류·업종 비교)을
 * 이 기기(localStorage)에만 기록하는 재방문 장치. 점수/데이터/공시 로직은 건드리지 않는다.
 * WatchlistClient와 같은 하이드레이션 가드(마운트 전 null)로 SSR/CSR 불일치를 피하고,
 * 각 라벨은 종목 상세 탭 해시(#disclosures 등)로 이어져 확인 흐름 겸 내비게이션이 된다.
 * 로그인 동기화·이메일/푸시 발송은 만들지 않는다(로컬 전용).
 */
export function StockChecklist({ ticker }: { ticker: string; name?: string }) {
  const { locale } = useLanguage();
  const t = stockChecklistCopy[locale];
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const read = () => setChecked(getChecklist(ticker));
    read();
    // 같은 탭 내 토글(커스텀 이벤트)과 다른 탭 변경(storage) 모두에 반응
    window.addEventListener("stock-checklist-changed", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("stock-checklist-changed", read);
      window.removeEventListener("storage", read);
    };
  }, [ticker]);

  // 마운트 전에는 렌더하지 않아 SSR HTML과 어긋나지 않게 한다(WatchlistClient 패턴).
  if (!mounted) return null;

  const total = CHECKLIST_ITEMS.length;
  const done = CHECKLIST_ITEMS.reduce((n, item) => n + (checked[item.id] ? 1 : 0), 0);
  const allDone = done === total;

  return (
    <section
      aria-label={t.title}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
          {t.title}
        </h3>
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400 mt-0.5">
          {t.checkedOf(done, total)}
        </span>
      </div>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400 leading-snug break-words">{t.purpose}</p>

      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
        {CHECKLIST_ITEMS.map((item) => {
          const isChecked = checked[item.id] === true;
          const label = t.items[item.id];
          return (
            <li key={item.id} className="flex items-center gap-1 px-1.5">
              <button
                type="button"
                onClick={() => toggleChecklistItem(ticker, item.id)}
                aria-pressed={isChecked}
                aria-label={label}
                className={`flex items-center gap-2.5 min-h-[44px] flex-1 min-w-0 px-1.5 py-2 text-left rounded-md ${FOCUS_RING}`}
              >
                <span
                  aria-hidden="true"
                  className={
                    "flex items-center justify-center w-5 h-5 shrink-0 rounded-md border transition " +
                    (isChecked
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-transparent")
                  }
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </span>
                <span
                  className={
                    "text-sm break-words " +
                    (isChecked
                      ? "text-zinc-400 dark:text-zinc-500 line-through"
                      : "text-zinc-800 dark:text-zinc-100")
                  }
                >
                  {label}
                </span>
              </button>
              {/* 라벨을 해당 탭 해시로 이어 확인 흐름 겸 내비게이션(별도 44px 타깃) */}
              <a
                href={item.anchor}
                aria-label={`${label} — 해당 탭으로 이동`}
                className={`flex items-center justify-center min-h-[44px] min-w-[44px] shrink-0 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition ${FOCUS_RING}`}
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="min-w-0 text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug break-words">
          {allDone ? t.allDone : t.storageNote}
        </p>
        {done > 0 ? (
          <button
            type="button"
            onClick={() => clearChecklist(ticker)}
            className={`shrink-0 inline-flex items-center gap-1 min-h-[44px] px-2.5 rounded-md text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition ${FOCUS_RING}`}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {t.reset}
          </button>
        ) : null}
      </div>
    </section>
  );
}
