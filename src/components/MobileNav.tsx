"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Search, Megaphone, FlaskConical, BookOpen, Menu, X } from "lucide-react";

const ITEMS = [
  { href: "/today", Icon: CalendarDays, label: "오늘" },
  { href: "/stocks", Icon: Search, label: "종목 탐색" },
  { href: "/disclosures", Icon: Megaphone, label: "공시 신호" },
  { href: "/backtest", Icon: FlaskConical, label: "백테스트" },
  { href: "/guide/metrics", Icon: BookOpen, label: "지표 가이드" },
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
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-100 transition text-zinc-700"
      >
        <Menu className="w-5 h-5" strokeWidth={2} />
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
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.Icon;
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
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
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