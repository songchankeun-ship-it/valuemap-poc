"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "valuemap_compare_basket";

export function CompareBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function updateCount() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setCount(0);
          return;
        }
        const list: string[] = JSON.parse(raw);
        setCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setCount(0);
      }
    }
    updateCount();

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) updateCount();
    }
    function onCustom() {
      updateCount();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("compare-basket-changed", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("compare-basket-changed", onCustom as EventListener);
    };
  }, []);

  if (count === 0) return null;

  return (
    <Link
      href="/compare"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition"
      title="비교함 보기"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 3h8M2 6h6M2 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="tabular-nums">비교 {count}</span>
    </Link>
  );
}