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
        href={`/login${next}`}
        className="hidden md:inline-flex items-center px-3 py-1.5 text-zinc-600 hover:text-zinc-900 transition text-sm"
      >
        로그인
      </Link>
      <Link
        href={`/login${next}`}
        className="hidden md:inline-flex items-center px-3 py-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition text-sm font-medium"
      >
        시작하기
      </Link>
    </>
  );
}
