"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Heart, GitCompare, Bot, Bell } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "kakao_redirecting">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function handleKakaoLogin() {
    setStatus("kakao_redirecting");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    }
    // 성공이면 자동으로 카카오 페이지로 redirect됨
  }

  return (
    <div className="max-w-md mx-auto px-3 md:px-4 py-6 md:py-12">
      <Link
        href={next}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {next === "/" ? "홈으로" : "이전 페이지로"}
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 md:p-8">
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">밸류맵 스톡 로그인</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          카카오로 1초 만에 시작하거나, 이메일로 로그인 링크를 받으세요.
        </p>

        {status === "sent" ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                  로그인 링크를 보냈어요
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  <strong>{email}</strong>로 메일을 발송했습니다. 메일함에서 링크를 클릭하면 자동으로 로그인됩니다.
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                  메일이 오지 않으면 <strong>스팸함</strong>을 확인해주세요.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 카카오 로그인 */}
            <button
              type="button"
              onClick={handleKakaoLogin}
              disabled={status === "kakao_redirecting" || status === "sending"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FEE500] text-[#191919] rounded-md text-sm font-semibold hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3C6.48 3 2 6.48 2 10.84c0 2.74 1.86 5.16 4.66 6.55-.21.79-.76 2.84-.87 3.28-.13.55.2.55.42.4.17-.11 2.66-1.8 3.74-2.53.66.09 1.34.14 2.05.14 5.52 0 10-3.48 10-7.84S17.52 3 12 3z" />
              </svg>
              {status === "kakao_redirecting" ? "카카오로 이동 중..." : "카카오로 시작하기"}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">또는</span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  이메일로 로그인
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {status === "error" ? (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-700 dark:text-red-300">{errorMsg}</div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={status === "sending" || status === "kakao_redirecting"}
                className="w-full px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "sending" ? "발송 중..." : "로그인 링크 받기"}
              </button>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                로그인 링크 외에 <strong>광고성 메일은 보내지 않습니다</strong>.<br />
                알림 메일도 사용자가 직접 설정할 때만 발송됩니다.
              </p>
            </form>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">로그인하면 가능해요</h3>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" fill="currentColor" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400">관심 종목을 여러 기기에서 이어보기</div>
            </li>
            <li className="flex items-start gap-2.5">
              <GitCompare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400">비교 목록 영구 저장</div>
            </li>
            <li className="flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400">AI 분석 기록 보관</div>
            </li>
            <li className="flex items-start gap-2.5">
              <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400">공시·지표 알림 (출시 예정)</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-12 text-sm text-zinc-500">로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
