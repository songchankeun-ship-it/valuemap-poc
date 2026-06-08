import Link from "next/link";

export function AccountButtons() {
  return (
    <>
      <Link
        href="/login"
        className="hidden md:inline-flex items-center px-3 py-1.5 text-zinc-600 hover:text-zinc-900 transition text-sm"
      >
        로그인
      </Link>
      <Link
        href="/login"
        className="hidden md:inline-flex items-center px-3 py-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition text-sm font-medium"
      >
        시작하기
      </Link>
    </>
  );
}