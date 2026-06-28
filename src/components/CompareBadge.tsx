"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCompareList } from "@/lib/compare";
import { useLanguage } from "./LanguageProvider";

export function CompareBadge() {
  const [count, setCount] = useState(0);
  const { locale, copy } = useLanguage();

  useEffect(() => {
    let mounted = true;

    function update() {
      getCompareList().then((list) => {
        if (mounted) setCount(list.length);
      });
    }
    update();

    function onCustom() {
      update();
    }

    window.addEventListener("compare-basket-changed", onCustom);
    window.addEventListener("ornscore:compare-updated", onCustom);
    window.addEventListener("valuemap:compare-updated", onCustom);
    return () => {
      mounted = false;
      window.removeEventListener("compare-basket-changed", onCustom);
      window.removeEventListener("ornscore:compare-updated", onCustom);
      window.removeEventListener("valuemap:compare-updated", onCustom);
    };
  }, []);

  if (count === 0) return null;

  return (
    <Link
      href="/compare"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
      title={locale === "ko" ? "비교함 보기" : "View comparison"}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 3h8M2 6h6M2 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="tabular-nums">{copy.nav.compare} {count}</span>
    </Link>
  );
}
