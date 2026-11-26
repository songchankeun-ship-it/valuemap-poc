"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitCompare } from "lucide-react";
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
      className="hidden sm:flex desk-compare-badge items-center gap-1.5 px-2.5 py-1 text-xs font-semibold"
      title={locale === "ko" ? "비교함 보기" : "View comparison"}
    >
      <GitCompare size={14} aria-hidden="true" />
      <span className="tabular-nums">{copy.nav.compare} {count}</span>
    </Link>
  );
}
