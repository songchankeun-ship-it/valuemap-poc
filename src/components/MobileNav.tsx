"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/today", icon: "📅", label: "오늘" },
  { href: "/stocks", icon: "🔍", label: "종목 탐색" },
  { href: "/disclosures", icon: "📢", label: "공시 신호" },
  { href: "/backtest", icon: "🧪", label: "백테스트" },
  { href: "/guide/metrics", icon: "📘", label: "지표 가이드" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-100 transition"
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="text-zinc-700">
          <rect width="18" height="2" rx="1" fill="currentColor"/>
          <rect y="6" width="18" height="2" rx="1" fill="currentColor"/>
          <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
        </svg>
      </button>

      {open ? (
        <>
          <div
            onClick={() => setOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-[60] backdrop-blur-[2px]"
            aria-hidden
          />
          <div className="lg:hidden fixed inset-y-0 left-0 w-[300px] max-w-[85vw] bg-white z-[61] shadow-2xl flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">V</span>
                <span className="text-base font-semibold text-zinc-900">밸류맵</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={
                      "flex items-center gap-3 px-3 py-3 rounded-md text-sm transition " +
                      (active
                        ? "bg-zinc-900 text-white font-medium"
                        : "text-zinc-700 hover:bg-zinc-100")
                    }
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-zinc-200 space-y-2">
              <button
                type="button"
                className="w-full px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 rounded-md text-sm font-medium text-center transition"
              >
                로그인
              </button>
              <button
                type="button"
                disabled
                className="w-full px-3 py-2.5 bg-zinc-200 text-zinc-500 rounded-md text-sm font-medium text-center cursor-not-allowed"
              >
                시작하기
              </button>
              <p className="text-[10px] text-zinc-500 text-center pt-1">
                계정 시스템 준비 중
              </p>
            </div>

            <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              이 도구는 투자 추천이 아니라 <strong>탐색 우선순위</strong>를 정하는 분석 도구입니다.
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}