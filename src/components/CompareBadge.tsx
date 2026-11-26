"use client";

import Link from "next/link";
import { GitCompare } from "lucide-react";
import { useCompareCount } from "./CompareCountProvider";
import { useLanguage } from "./LanguageProvider";

export function CompareBadge() {
  const count = useCompareCount();
  const { locale, copy } = useLanguage();

  if (count === 0) return null;

  return (
    <Link
      href="/compare"
      className="hidden sm:flex desk-compare-badge items-center gap-1.5 px-2.5 py-1 text-xs font-semibold"
      title={locale === "ko" ? "비교함 보기" : "View comparison"}
    >
      <GitCompare size={14} aria-hidden="true" />
      <span className="tabular-nums">{copy.nav.compare} {count}</span>
    </Link>
  );
}
