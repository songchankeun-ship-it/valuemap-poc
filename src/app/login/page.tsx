"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Heart, GitCompare, Bot, Bell } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        홈으로
      </Link>

      <div className="bg-white rounded-xl border border-zinc-200 p-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">밸류맵 로그인</h1>
        <p className="text-sm text-zinc-600 mb-6">
          이메일로 로그인 링크를 보내드려요. 비밀번호 없이 한 번 클릭으로 로그인됩니다.
        </p>

        {status === "sent" ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-emerald-900 mb-1">
                  로그인 링크를 보냈어요
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  <strong>{email}</strong>로 메일을 발송했습니다. 메일함에서 링크를 클릭하면 자동으로 로그인됩니다.
                </p>
                <p className="text-xs text-emerald-700 mt-2">
                  메일이 오지 않으면 <strong>스팸함</strong>을 확인해주세요.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {status === "error" ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">{errorMsg}</div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full px-4 py-2.5 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "sending" ? "발송 중..." : "로그인 링크 받기"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-zinc-200">
          <h3 className="text-xs font-semibold text-zinc-700 mb-3">로그인하면 가능해요</h3>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" fill="currentColor" />
              <div className="text-xs text-zinc-600">관심 종목을 여러 기기에서 이어보기</div>
            </li>
            <li className="flex items-start gap-2.5">
              <GitCompare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600">비교 목록 영구 저장</div>
            </li>
            <li className="flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600">AI 분석 기록 보관</div>
            </li>
            <li className="flex items-start gap-2.5">
              <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600">공시·지표 알림 (출시 예정)</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}