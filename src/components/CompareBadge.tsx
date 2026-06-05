"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "valuemap:compare";

function readCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

export function CompareBadge() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(readCount());

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setCount(readCount());
    }
    function onCustom() {
      setCount(readCount());
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("valuemap:compare-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("valuemap:compare-updated", onCustom);
    };
  }, []);

  // 서버/CSR 미일치 방지: 마운트 전엔 렌더 안 함
  if (!mounted) return null;
  if (count === 0) return null;

  return (
    <Link
      href="/compare"
      aria-label={`비교 ${count}종목`}
      className="relative p-2 rounded-md text-zinc-700 hover:bg-zinc-100 transition shrink-0"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-semibold flex items-center justify-center shadow">
        {count}
      </span>
    </Link>
  );
}
