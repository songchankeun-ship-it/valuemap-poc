import Link from "next/link";
import { HistoryClient } from "@/components/HistoryClient";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "분석 기록 — 오른스코어",
};

export default async function HistoryPage() {
  let loggedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    loggedIn = !!data.user;
  } catch {
    loggedIn = false;
  }

  if (!loggedIn) {
    return (
      <div className="max-w-3xl mx-auto px-3 md:px-4 py-8 md:py-12">
        <header className="mb-5">
          <h1 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
            AI 분석 기록 <span aria-hidden="true">🔒</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
            종목 페이지에서 받은 AI 분석과 메모를 한곳에 저장합니다. <strong>로그인 후 이용 가능</strong>합니다.
          </p>
        </header>
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 md:p-8 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
            로그인하면 받은 AI 분석이 자동 저장돼 여러 기기에서 이어볼 수 있어요.<br className="hidden md:block" />
            카카오 또는 이메일 매직링크로 30초면 시작할 수 있습니다.
          </p>
          <Link
            href="/login?next=/history"
            className="inline-block px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
          >
            로그인 / 시작하기 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-0 md:px-4 py-4 md:py-8">
      <header className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">AI 분석 기록</h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          종목 페이지에서 받은 AI 분석이 자동으로 저장됩니다. 최근 50개까지 보관.
        </p>
      </header>
      <HistoryClient />
    </div>
  );
}
