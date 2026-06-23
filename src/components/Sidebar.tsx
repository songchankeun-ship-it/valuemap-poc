"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Search, Megaphone, FlaskConical, BookOpen, Heart, GitCompare, Bot, Info, CreditCard } from "lucide-react";

const ITEMS = [
  { href: "/today", Icon: CalendarDays, label: "오늘", group: "" },
  { href: "/stocks", Icon: Search, label: "종목 찾기", group: "" },
  { href: "/watchlist", Icon: Heart, label: "관심 종목", group: "" },
  { href: "/compare", Icon: GitCompare, label: "비교", group: "분석 도구" },
  { href: "/disclosures", Icon: Megaphone, label: "공시 신호", group: "분석 도구" },
  { href: "/backtest", Icon: FlaskConical, label: "백테스트", group: "분석 도구" },
  { href: "/history", Icon: Bot, label: "분석 기록", group: "분석 도구" },
  { href: "/pricing", Icon: CreditCard, label: "요금제", group: "도움말" },
  { href: "/guide/metrics", Icon: BookOpen, label: "지표 가이드", group: "도움말" },
  { href: "/about", Icon: Info, label: "서비스 소개", group: "도움말" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  // 인증·문서 레이아웃에서는 앱 사이드바 숨김 (디자인 설계서 §2, P0-6)
  const HIDE = ["/login", "/terms", "/privacy"];
  if (pathname && HIDE.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
  // /login 페이지에서는 사이드바 숨김 (집중형 레이아웃)
  if (pathname === "/login") return null;

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
      <div className="sticky top-[5.5rem] px-3 py-4">
        <nav className="space-y-0.5">
          {ITEMS.map((item, idx) => {
            const active = isActive(pathname, item.href);
            const Icon = item.Icon;
            const showGroup = item.group !== "" && item.group !== (ITEMS[idx - 1]?.group ?? "");
            return (
              <div key={item.href}>
                {showGroup ? (
                  <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 pt-3 pb-1">{item.group}</div>
                ) : null}
                <Link
                  prefetch={false} href={item.href}
                  className={
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition " +
                    (active
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800")
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </div>
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
