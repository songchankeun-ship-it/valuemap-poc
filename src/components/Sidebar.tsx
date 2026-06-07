"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Search, Megaphone, FlaskConical, BookOpen } from "lucide-react";

const ITEMS = [
  { href: "/today", Icon: CalendarDays, label: "오늘" },
  { href: "/stocks", Icon: Search, label: "종목 탐색" },
  { href: "/disclosures", Icon: Megaphone, label: "공시 신호" },
  { href: "/backtest", Icon: FlaskConical, label: "백테스트" },
  { href: "/guide/metrics", Icon: BookOpen, label: "지표 가이드" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-zinc-200 bg-zinc-50/30">
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
                    ? "bg-zinc-900 text-white font-medium"
                    : "text-zinc-700 hover:bg-zinc-100")
                }
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 px-3 py-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider mb-1">베타</div>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            이 도구는 투자 추천이 아니라 탐색 우선순위를 정하는 분석 도구입니다.
          </p>
        </div>
      </div>
    </aside>
  );
}