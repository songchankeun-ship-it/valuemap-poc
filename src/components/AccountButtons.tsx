"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AccountButtons() {
  const pathname = usePathname();
  const next =
    pathname && pathname !== "/" && pathname !== "/login"
      ? `?next=${encodeURIComponent(pathname)}`
      : "";

  return (
    <>
      <Link
        prefetch={false} href={`/login${next}`}
        className="hidden md:inline-flex items-center px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition text-sm"
      >
        로그인
      </Link>
      <Link
        prefetch={false} href={`/login${next}`}
        className="hidden md:inline-flex items-center px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition text-sm font-medium"
      >
        시작하기
      </Link>
    </>
  );
}
