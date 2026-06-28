"use client";

import { BarChart3, Building2, FileText, Landmark } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { actionButtonsCopy } from "@/lib/copy/stockDetail";

/**
 * 종목 상세 공통 CTA 버튼 그룹.
 * 텍스트가 붙어 보이지 않도록 아이콘, 라벨, 테두리, 간격을 한 컴포넌트에서 고정한다.
 */
export function StockDetailActionButtons() {
  const { locale } = useLanguage();
  const t = actionButtonsCopy[locale];
  const ACTIONS = [
    { label: t.disclosures, Icon: FileText, href: "#disclosures" },
    { label: t.financials, Icon: Landmark, href: "#financials" },
    { label: t.basis, Icon: BarChart3, href: "#basis" },
    { label: t.sector, Icon: Building2, href: "#summary" },
  ] as const;
  return (
    <nav aria-label={t.navAriaLabel} className="w-full">
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 xl:grid-cols-4 gap-2">
        {ACTIONS.map(({ label, Icon, href }) => (
          <a
            key={href}
            href={href}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-center text-xs md:text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 shadow-sm hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
          >
            <Icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
