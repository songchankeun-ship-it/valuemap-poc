"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Search, Heart, Menu, X, GitCompare, Megaphone, FlaskConical, Bot, CreditCard, BookOpen, Info } from "lucide-react";

const PRIMARY = [
  { href: "/today", Icon: CalendarDays, label: "오늘" },
  { href: "/stocks", Icon: Search, label: "종목 찾기" },
  { href: "/watchlist", Icon: Heart, label: "관심" },
];

const MORE = [
  { href: "/compare", Icon: GitCompare, label: "비교" },
  { href: "/disclosures", Icon: Megaphone, label: "공시 신호" },
  { href: "/backtest", Icon: FlaskConical, label: "백테스트" },
  { href: "/history", Icon: Bot, label: "분석 기록" },
  { href: "/pricing", Icon: CreditCard, label: "요금제" },
  { href: "/guide/metrics", Icon: BookOpen, label: "지표 가이드" },
  { href: "/about", Icon: Info, label: "서비스 소개" },
];

export function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname() || "";
  const HIDE = ["/login", "/terms", "/privacy"];
  if (HIDE.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {moreOpen ? (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-14 inset-x-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl p-3 grid grid-cols-3 gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE.map(({ href, Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={"flex flex-col items-center gap-1 py-3 rounded-lg text-[11px] " + (active(href) ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium" : "text-zinc-600 dark:text-zinc-300")}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 h-14 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800">
        {PRIMARY.map(({ href, Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={"flex flex-col items-center justify-center gap-0.5 text-[10px] " + (active(href) ? "text-blue-700 dark:text-blue-400 font-medium" : "text-zinc-500 dark:text-zinc-400")}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className={"flex flex-col items-center justify-center gap-0.5 text-[10px] " + (moreOpen ? "text-blue-700 dark:text-blue-400 font-medium" : "text-zinc-500 dark:text-zinc-400")}
          aria-label="더보기 메뉴"
        >
          {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          더보기
        </button>
      </nav>
    </>
  );
}
