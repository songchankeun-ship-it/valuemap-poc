"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Heart, GitCompare, Bot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }

  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold hover:bg-blue-200 transition"
        aria-label="계정 메뉴"
      >
        {initial}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50">
          <div className="px-3 py-2 border-b border-zinc-100">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">로그인 됨</div>
            <div className="text-xs text-zinc-900 font-medium truncate">{email}</div>
          </div>
          <Link
            href="/watchlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Heart className="w-4 h-4" />
            관심 종목
          </Link>
          <Link
            href="/compare"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <GitCompare className="w-4 h-4" />
            비교 목록
          </Link>
          <Link
            href="/history"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Bot className="w-4 h-4" />
            분석 기록
          </Link>
          <div className="border-t border-zinc-100 my-1" />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 text-left"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  );
}