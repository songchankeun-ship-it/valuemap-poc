"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  enabledOAuthProviders,
  plannedProviders,
  type OAuthProviderId,
} from "@/lib/auth/providers";
import { safeInternalPath } from "@/lib/auth/returnPath";
import { loginCopy, type Locale } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Heart, GitCompare, Bot, Bell, Loader2 } from "lucide-react";

// 인증 오류 코드/메시지를 사람이 읽을 한국어로 변환.
// - 콜백 실패(auth_callback_failed) → URL 의 ?error= 로 들어옴
// - 콘솔 토글 전 OAuth 제공자 클릭 시 "provider is not enabled" 류 → friendly 안내
// - 이메일 매직링크 재요청 제한 등도 읽기 쉽게
function friendlyAuthError(raw: string | null | undefined, locale: Locale): string {
  if (!raw) return "";
  const s = raw.toLowerCase();
  const errors = loginCopy[locale].errors;

  // 앱/홈 화면(standalone) 실행에서 외부 브라우저로 로그인 후 앱 창으로 복귀하지
  // 못한 경우(콜백에 code 없음). 원문 제공자 메시지는 노출하지 않는다.
  if (s.includes("auth_callback_no_code")) {
    return errors.noCode;
  }
  if (s.includes("auth_callback_failed")) {
    return errors.callback;
  }
  if (
    s.includes("provider is not enabled") ||
    s.includes("unsupported provider") ||
    s.includes("validation_failed") ||
    s.includes("provider_disabled")
  ) {
    return errors.provider;
  }
  if (s.includes("only request this") || s.includes("rate limit") || s.includes("too many")) {
    return errors.rateLimit;
  }
  if (s.includes("invalid") && s.includes("email")) {
    return errors.invalidEmail;
  }
  // 알 수 없는 오류는 원문을 그대로 노출하지 않고 일반 안내로 대체
  return errors.unknown;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const copy = loginCopy[locale];
  // next 는 URL 에서 온 조작 가능 입력 → 내부 경로만 허용(open-redirect 방지).
  // 뒤로가기 링크·OAuth/이메일 redirectTo 모두 이 정규화된 값에서 파생된다.
  const next = safeInternalPath(searchParams.get("next"));
  // 정확히 매칭되는 컨텍스트 안내가 있으면 그것을, 없더라도 내부 경로에서 온 로그인(예: /stock/…)
  // 이면 일반 안내로 "상태 보존 + 원래 화면 복귀"를 알린다. 루트(/)에서 온 경우만 안내 생략.
  const contextMsg =
    (copy.contexts as Record<string, string>)[next] ??
    (next !== "/" ? copy.contextFallback : undefined);

  const providers = enabledOAuthProviders();
  // "설정 필요"로만 노출하는 제공자(네이버 등) — env/콘솔 설정 전에는 클릭 불가.
  const planned = plannedProviders();
  // 노출 문구(leadCopy)는 활성화된 제공자만으로 파생 → 화면에 없는/준비 중인 방식을 절대 광고하지 않음
  const providerNames = providers.map((p) => copy.providers[p.id].name).join(locale === "ko" ? "·" : ", ");
  const leadCopy =
    providers.length > 0
      ? copy.lead(providerNames)
      : copy.emailOnlyLead;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "oauth_redirecting">(
    () => (searchParams.get("error") ? "error" : "idle"),
  );
  const [redirectingProvider, setRedirectingProvider] = useState<OAuthProviderId | null>(null);
  const [errorMsg, setErrorMsg] = useState(() => friendlyAuthError(searchParams.get("error"), locale));

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
      setErrorMsg(friendlyAuthError(error.message, locale));
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
      setErrorMsg(friendlyAuthError(error.message, locale));
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
        {next === "/" ? copy.backHome : copy.backPrevious}
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 md:p-8">
        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{copy.title}</h1>
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
                  {copy.sentTitle}
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  {copy.sentBodyPrefix}<strong>{email}</strong>{copy.sentBodySuffix}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                  {copy.spam}
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
                  const providerCopy = copy.providers[p.id];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleOAuthLogin(p.id)}
                      disabled={oauthBusy || emailBusy}
                      aria-busy={isRedirecting}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${p.brandClasses}`}
                    >
                      {isRedirecting ? (
                        <Loader2 className="w-[18px] h-[18px] animate-spin" aria-hidden />
                      ) : (
                        <>
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
                          {p.id === "custom:naver" ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path d="M16.27 12.84 7.46 0H0v24h7.73V11.16L16.54 24H24V0h-7.73v12.84z" />
                            </svg>
                          ) : null}
                          {p.id === "apple" ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path d="M16.36 12.78c.02 2.5 2.19 3.33 2.21 3.34-.02.06-.35 1.18-1.15 2.34-.69 1-1.41 1.99-2.55 2.01-1.11.02-1.47-.66-2.75-.66-1.27 0-1.67.64-2.72.68-1.09.04-1.92-1.08-2.62-2.08-1.42-2.05-2.51-5.79-1.05-8.32.72-1.25 2.02-2.05 3.43-2.07 1.08-.02 2.1.73 2.75.73.66 0 1.89-.9 3.19-.77.54.02 2.06.22 3.04 1.64-.08.05-1.81 1.06-1.79 3.16M14.28 5.39c.58-.7.97-1.68.86-2.65-.83.03-1.84.55-2.44 1.25-.54.62-1.01 1.61-.88 2.56.93.07 1.88-.47 2.46-1.16" />
                            </svg>
                          ) : null}
                        </>
                      )}
                      {isRedirecting ? providerCopy.redirecting : providerCopy.label}
                    </button>
                  );
                })}

                {/* 설정 필요 제공자(네이버 등) — 의도적으로 비활성. onClick·인증 호출 없음.
                    실제 로그인 경로는 운영자 콘솔 설정 + env 토글 후 활성화된다
                    (docs/auth-providers-setup.md 네이버 섹션 참조). 가짜 성공 경로를 만들지 않는다. */}
                {planned.map((p) => (
                  <div
                    key={p.id}
                    aria-disabled="true"
                    title={copy.plannedTitle}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-md text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 opacity-70 cursor-not-allowed select-none"
                  >
                    {p.id === "custom:naver" ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M16.27 12.84 7.46 0H0v24h7.73V11.16L16.54 24H24V0h-7.73v12.84z" />
                      </svg>
                    ) : null}
                    <span>{locale === "ko" ? p.label : `${copy.providers[p.id].name} (${copy.plannedNote})`}</span>
                    <span className="ml-1 rounded-full bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:text-zinc-400">
                      {locale === "ko" ? p.note : copy.plannedNote}
                    </span>
                  </div>
                ))}

                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
                  {copy.legalPrefix} <Link href="/terms" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">{copy.legalTerms}</Link>{copy.legalAnd}<Link href="/privacy" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">{copy.legalPrivacy}</Link>{copy.legalSuffix}
                </p>

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{copy.or}</span>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {copy.emailLabel}
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
                aria-busy={emailBusy}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {emailBusy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
                {emailBusy ? copy.sending : copy.getLink}
              </button>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                <strong>{copy.noAds}</strong><br />
                {copy.noAdsSecond}
              </p>
            </form>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{copy.benefitsTitle}</h3>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" fill="currentColor" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400">{copy.benefits[0]}</div>
            </li>
            <li className="flex items-start gap-2.5">
              <GitCompare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400">{copy.benefits[1]}</div>
            </li>
            <li className="flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400">{copy.benefits[2]}</div>
            </li>
            <li className="flex items-start gap-2.5">
              <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 dark:text-zinc-400">{copy.benefits[3]}</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 로케일 컨텍스트가 안정되기 전 잠깐 보이는 Suspense 폴백 — 텍스트 없이(i18n 회피)
// LoginForm 과 동일한 컨테이너/카드 높이를 흉내 내 레이아웃 이동(CLS)을 줄인다.
function LoginSkeleton() {
  return (
    <div className="max-w-md mx-auto px-3 md:px-4 py-6 md:py-12" aria-busy="true" aria-label="로그인 화면 불러오는 중">
      {/* 뒤로가기 링크 자리 */}
      <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-6" />
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 md:p-8">
        {/* 제목 + 리드 */}
        <div className="h-7 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
        <div className="h-4 w-56 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-5" />
        {/* 소셜 로그인 버튼 자리 */}
        <div className="space-y-2 mb-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-11 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
        {/* 이메일 입력 + 제출 버튼 자리 */}
        <div className="h-11 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mb-4" />
        <div className="h-11 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        {/* 혜택 목록 자리 */}
        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginContent() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
