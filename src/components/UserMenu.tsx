"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Heart, GitCompare, Bell, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { commonCopy } from "@/lib/i18n";

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = commonCopy[locale].auth;
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Esc 로 메뉴를 닫고 포커스를 트리거 버튼으로 되돌린다(키보드 접근성).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    setIsLoggingOut(false);
    router.refresh();
  }

  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-semibold hover:bg-blue-200 dark:hover:bg-blue-900 transition"
        aria-label={copy.accountMenu}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={copy.accountMenu}
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 z-50"
        >
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{copy.loggedIn}</div>
            <div className="text-xs text-zinc-900 dark:text-zinc-100 font-medium truncate">{email}</div>
          </div>
          <Link
            href="/watchlist"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Heart className="w-4 h-4" />
            {copy.menuWatchlist}
          </Link>
          <Link
            href="/compare"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <GitCompare className="w-4 h-4" />
            {copy.menuCompare}
          </Link>
          <Link
            href="/settings/notifications"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Bell className="w-4 h-4" />
            {copy.menuNotifications}
          </Link>
          <Link
            href="/data-deletion"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Trash2 className="w-4 h-4" />
            {copy.menuDataDeletion}
          </Link>
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {isLoggingOut ? copy.loggingOut : copy.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
}
