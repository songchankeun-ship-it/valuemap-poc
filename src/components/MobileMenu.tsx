"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/today", label: "오늘" },
  { href: "/stocks", label: "종목" },
  { href: "/disclosures", label: "공시" },
  { href: "/backtest", label: "백테스트" },
  { href: "/guide/metrics", label: "지표 가이드" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 경로 바뀌면 자동 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 메뉴 열렸을 때 body 스크롤 막기
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="메뉴 열기"
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-md text-zinc-700 hover:bg-zinc-100 transition shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <span className="text-sm font-semibold text-zinc-900">메뉴</span>
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-2 py-3 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2.5 rounded-md text-sm transition ${
                      active
                        ? "bg-zinc-100 text-zinc-900 font-medium"
                        : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-3 border-t border-zinc-200 flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition">
                로그인
              </button>
              <button className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition text-sm font-medium">
                회원가입
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
