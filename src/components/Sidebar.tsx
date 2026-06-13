"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Search, Megaphone, FlaskConical, BookOpen, Heart, GitCompare, Bot, Info } from "lucide-react";

const ITEMS = [
  { href: "/today", Icon: CalendarDays, label: "오늘", soon: false },
  { href: "/stocks", Icon: Search, label: "종목 탐색", soon: false },
  { href: "/watchlist", Icon: Heart, label: "관심 종목", soon: false },
  { href: "/compare", Icon: GitCompare, label: "비교", soon: false },
  { href: "/history", Icon: Bot, label: "분석 기록", soon: false },
  { href: "/disclosures", Icon: Megaphone, label: "공시 신호", soon: false },
  { href: "/backtest", Icon: FlaskConical, label: "백테스트", soon: false },
  { href: "/guide/metrics", Icon: BookOpen, label: "지표 가이드", soon: false },
  { href: "/about", Icon: Info, label: "서비스 소개", soon: false },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  // /login 페이지에서는 사이드바 숨김 (집중형 레이아웃)
  if (pathname === "/login") return null;

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
      <div className="sticky top-[5.5rem] px-3 py-4">
        <nav className="space-y-0.5">
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition " +
                  (active
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800")
                }
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                <span className="flex-1">{item.label}</span>
                {item.soon ? (
                  <span className={"text-[9px] px-1.5 py-0.5 rounded font-medium " + (active ? "bg-amber-300 text-amber-900" : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400")}>
                    SOON
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 px-3 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md">
          <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">베타</div>
          <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            이 도구는 투자 추천이 아니라 탐색 우선순위를 정하는 분석 도구입니다.
          </p>
        </div>
      </div>
    </aside>
  );
}
