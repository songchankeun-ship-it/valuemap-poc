import { NotificationToggle } from "@/components/NotificationToggle";
import { ConditionAlertsManager } from "@/components/ConditionAlertsManager";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Mail } from "lucide-react";

export const metadata = {
  title: "알림 설정 — 밸류맵 스톡",
};

export default async function NotificationSettingsPage() {
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userEmail = data.user?.email ?? null;
  } catch {
    // ignore
  }

  if (!userEmail) {
    redirect("/login?next=/settings/notifications");
  }

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        홈으로
      </Link>

      <h1 className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">알림 설정</h1>
      <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mb-5 md:mb-6">
        관심 종목에 새 공시 신호가 발견되면 이메일로 알려드립니다.
      </p>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 md:p-5 mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap md:flex-nowrap">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">공시 신호 알림</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              관심 종목에 자기주식 취득·임원·주요주주 보유 변동·정정공시·단일판매 계약·유상증자 등 신호가 발견되면 매일 한 번 이메일로 발송됩니다.
            </div>
          </div>
          <NotificationToggle />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Mail className="w-3 h-3" />
          <span>
            발송: <strong className="text-zinc-700 dark:text-zinc-300">{userEmail}</strong>
          </span>
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <ConditionAlertsManager />
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-wider">
          알림 받으려면
        </h3>
        <ol className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <li className="flex gap-2">
            <span className="font-mono text-zinc-400 dark:text-zinc-500 shrink-0">1.</span>
            <div>
              종목 페이지에서 <Heart className="w-3 h-3 inline" /> <strong>관심 종목</strong> 버튼으로 등록
            </div>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-zinc-400 dark:text-zinc-500 shrink-0">2.</span>
            <div>매일 KST 16:30 (장 마감 후) 자동으로 신호 분석</div>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-zinc-400 dark:text-zinc-500 shrink-0">3.</span>
            <div>새 신호가 있으면 이메일 도착 (없으면 발송 안 함)</div>
          </li>
        </ol>
      </div>
    </div>
  );
}
