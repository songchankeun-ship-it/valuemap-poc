"use client";

import { BarChart3, Building2, FileText, Landmark } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { actionButtonsCopy } from "@/lib/copy/stockDetail";

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
      <ul className="research-stock-jumps">
        {ACTIONS.map(({ label, Icon, href }) => (
          <li key={href}>
            <a
              href={href}
              className="research-stock-jump"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
