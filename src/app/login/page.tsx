"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  enabledOAuthProviders,
  plannedProviders,
  type OAuthProviderId,
} from "@/lib/auth/providers";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Heart, GitCompare, Bot, Bell } from "lucide-react";

// 인증 오류 코드/메시지를 사람이 읽을 한국어로 변환.
// - 콜백 실패(auth_callback_failed) → URL 의 ?error= 로 들어옴
// - 콘솔 토글 전 OAuth 제공자 클릭 시 "provider is not enabled" 류 → friendly 안내
// - 이메일 매직링크 재요청 제한 등도 읽기 쉽게
function friendlyAuthError(raw: string | null | undefined): string {
  if (!raw) return "";
  const s = raw.toLowerCase();

  if (s.includes("auth_callback_failed")) {
    return "로그인 처리 중 문제가 발생했어요. 다시 시도해 주세요.";
  }
  if (
    s.includes("provider is not enabled") ||
    s.includes("unsupported provider") ||
    s.includes("validation_failed") ||
    s.includes("provider_disabled")
  ) {
    return "현재 이 로그인 방식은 준비 중이에요. 카카오 또는 이메일로 로그인해 주세요.";
  }
  if (s.includes("only request this") || s.includes("rate limit") || s.includes("too many")) {
    return "요청이 많아요. 잠시 후 다시 시도해 주세요.";
  }
  if (s.includes("invalid") && s.includes("email")) {
    return "이메일 주소를 다시 확인해 주세요.";
  }
  // 알 수 없는 오류는 원문을 그대로 노출하지 않고 일반 안내로 대체
  return "로그인 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.";
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const CONTEXT_MSG: Record<string, string> = {
    "/history": "분석 기록을 보려면 로그인하세요. 로그인 후 자동으로 돌아갑니다.",
    "/watchlist": "관심 종목을 여러 기기에서 이어보려면 로그인하세요.",
    "/compare": "비교 목록을 저장하려면 로그인하세요.",
    "/settings/notifications": "알림을 설정하려면 로그인하세요.",
  };
  const contextMsg = CONTEXT_MSG[next];

  const providers = enabledOAuthProviders();
  // "준비 중"으로만 노출하는 제공자(네이버 등) — 실제 로그인 경로 없음, 클릭 불가.
  const planned = plannedProviders();
  // 노출 문구(leadCopy)는 활성화된 제공자만으로 파생 → 화면에 없는/준비 중인 방식을 절대 광고하지 않음
  const providerNames = providers.map((p) => p.shortName).join("·");
  const leadCopy =
    providers.length > 0
      ? `${providerNames}로 1초 만에 시작하거나, 이메일로 로그인 링크를 받으세요.`
      : "이메일로 로그인 링크를 받으세요.";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "oauth_redirecting">(
    () => (searchParams.get("error") ? "error" : "idle"),
  );
  const [redirectingProvider, setRedirectingProvider] = useState<OAuthProviderId | null>(null);
  const [errorMsg, setErrorMsg] = useState(() => friendlyAuthError(searchParams.get("error")));

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
      setErrorMsg(friendlyAuthError(error.message));
    } else {
      setStatus("sent");
    }
  }

  async function handleOAuthLogin(provider: OAuthProviderId) {
    setStatus("oauth_redirecting");
    setRedirectingProvider(provider);
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // next 를 콜백 URL 에 보존 → 로그인 후 원래 가려던 곳으로 복귀
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    // 성공이면 자동으로 제공자 페이지로 redirect 된다.
    // 콘솔 토글 전이라 provider 가 비활성이면 여기서 error 반환 → friendly 한국어 안내.
    if (error) {
      setStatus("error");
      setRedirectingProvider(null);
      setErrorMsg(friendlyAuthError(error.message));
    }
  }

  const oauthBusy = status === "oauth_redirecting";
  const emailBusy = status === "sending";

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
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">오른스코어 로그인</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{leadCopy}</p>
        {contextMsg ? (
          <div className="mb-5 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-md px-3 py-2">
            {contextMsg}
          </div>
        ) : <div className="mb-3" />}

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
            {/* 소셜 로그인 — 활성화된 제공자만 config 에서 렌더 (복붙 핸들러 없음) */}
            {providers.length > 0 ? (
              <div className="space-y-2">
                {providers.map((p) => {
                  const isRedirecting = oauthBusy && redirectingProvider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleOAuthLogin(p.id)}
                      disabled={oauthBusy || emailBusy}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md text-sm font-semibold transition ${p.brandClasses}`}
                    >
                      {p.id === "kakao" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 3C6.48 3 2 6.48 2 10.84c0 2.74 1.86 5.16 4.66 6.55-.21.79-.76 2.84-.87 3.28-.13.55.2.55.42.4.17-.11 2.66-1.8 3.74-2.53.66.09 1.34.14 2.05.14 5.52 0 10-3.48 10-7.84S17.52 3 12 3z" />
                        </svg>
                      ) : null}
                      {p.id === "google" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                        </svg>
                      ) : null}
                      {p.id === "apple" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M16.36 12.78c.02 2.5 2.19 3.33 2.21 3.34-.02.06-.35 1.18-1.15 2.34-.69 1-1.41 1.99-2.55 2.01-1.11.02-1.47-.66-2.75-.66-1.27 0-1.67.64-2.72.68-1.09.04-1.92-1.08-2.62-2.08-1.42-2.05-2.51-5.79-1.05-8.32.72-1.25 2.02-2.05 3.43-2.07 1.08-.02 2.1.73 2.75.73.66 0 1.89-.9 3.19-.77.54.02 2.06.22 3.04 1.64-.08.05-1.81 1.06-1.79 3.16M14.28 5.39c.58-.7.97-1.68.86-2.65-.83.03-1.84.55-2.44 1.25-.54.62-1.01 1.61-.88 2.56.93.07 1.88-.47 2.46-1.16" />
                        </svg>
                      ) : null}
                      {isRedirecting ? p.redirectingLabel : p.label}
                    </button>
                  );
                })}

                {/* 준비 중 제공자(네이버 등) — 의도적으로 비활성. onClick·인증 호출 없음.
                    실제 로그인 경로는 운영자 콘솔 설정 후 별도 작업으로 활성화된다
                    (docs/auth-providers-setup.md 네이버 섹션 참조). 가짜 성공 경로를 만들지 않는다. */}
                {planned.map((p) => (
                  <div
                    key={p.id}
                    aria-disabled="true"
                    title="준비 중인 로그인 방식이에요"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 opacity-70 cursor-not-allowed select-none"
                  >
                    {p.id === "naver" ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M16.27 12.84 7.46 0H0v24h7.73V11.16L16.54 24H24V0h-7.73v12.84z" />
                      </svg>
                    ) : null}
                    <span>{p.label}</span>
                    <span className="ml-1 rounded-full bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:text-zinc-400">
                      {p.note}
                    </span>
                  </div>
                ))}

                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
                  계속하면 <Link href="/terms" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">이용약관</Link>과 <Link href="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">개인정보처리방침</Link>에 동의하게 됩니다.
                </p>

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">또는</span>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            ) : null}

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
                    autoComplete="email"
                    // 일부 브라우저/비밀번호 관리자 확장이 input 에 style 등을 주입해
                    // SSR↔클라이언트 hydration 경고가 뜨는 것을 막는다 (GlobalSearch 와 동일 처리).
                    suppressHydrationWarning
                    className="w-full pl-10 pr-3 py-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {status === "error" && errorMsg ? (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-700 dark:text-red-300">{errorMsg}</div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={emailBusy || oauthBusy}
                className="w-full px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {emailBusy ? "발송 중..." : "로그인 링크 받기"}
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
              <div className="text-xs text-zinc-600 dark:text-zinc-400">관심 종목 공시 알림 (등록 시 · 무료)</div>
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
