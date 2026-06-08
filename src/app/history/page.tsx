import { HistoryClient } from "@/components/HistoryClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "분석 기록 — 밸류맵",
};

export default async function HistoryPage() {
  // 로그인 안 한 사용자는 /login으로 (next=/history)
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      redirect("/login?next=/history");
    }
  } catch {
    redirect("/login?next=/history");
  }

  return (
    <div className="max-w-3xl mx-auto px-0 md:px-4 py-4 md:py-8">
      <header className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-xl font-bold text-zinc-900 mb-1">AI 분석 기록</h1>
        <p className="text-xs text-zinc-600">
          종목 페이지에서 받은 AI 분석이 자동으로 저장됩니다. 최근 50개까지 보관.
        </p>
      </header>
      <HistoryClient />
    </div>
  );
}
