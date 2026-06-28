"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Search, TrendingUp, Bell, ChevronDown } from "lucide-react";
import { welcomeOnboardingCopy } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";
import type { ReactNode } from "react";

const STORAGE_KEY = "ornscore_welcome_dismissed_v1";
const LEGACY_STORAGE_KEY = "valuemap_welcome_dismissed_v1";

/**
 * 첫 방문자 환영 박스.
 * - 데스크톱: 3단계 카드 풀 표시
 * - 모바일: 1줄 요약 + 펼치기 (히어로 가리지 않음)
 * - X 누르면 LocalStorage에 저장 → 다시 안 보임
 */
export function WelcomeOnboarding() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { locale } = useLanguage();
  const copy = welcomeOnboardingCopy[locale];

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!dismissed) setShow(true);
    } catch {
      // localStorage 차단된 경우 — 그냥 표시 안 함
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <section className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900 rounded-xl overflow-hidden">
      {/* 모바일 컴팩트 헤더 (md 미만) */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[48px] text-left active:bg-amber-100/40 dark:active:bg-amber-900/30 transition"
          aria-label={copy.toggle}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">👋</span>
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-200 truncate">
              {copy.mobileTitle}
            </span>
          </div>
          <ChevronDown
            className={
              "w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 transition-transform " +
              (expanded ? "rotate-180" : "")
            }
          />
        </button>

        {expanded ? (
          <div className="px-4 pb-4 pt-1 space-y-2">
            <Step n={1} title={copy.steps[0].title} href="/today" icon={<TrendingUp className="w-3.5 h-3.5" />}>
              {copy.steps[0].mobileBody}
            </Step>
            <Step n={2} title={copy.steps[1].title} href="/stocks" icon={<Search className="w-3.5 h-3.5" />}>
              {copy.steps[1].mobileBody}
            </Step>
            <Step n={3} title={copy.steps[2].title} href="/settings/notifications" icon={<Bell className="w-3.5 h-3.5" />}>
              {copy.steps[2].mobileBody}
            </Step>
            <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed pt-1">
              {copy.notice}
            </p>
          </div>
        ) : null}
      </div>

      {/* 닫기 버튼 (양쪽 모두) - 36px 터치 영역 */}
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-1.5 right-1.5 w-9 h-9 inline-flex items-center justify-center rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 active:bg-amber-200 dark:active:bg-amber-900/60 transition z-10"
        aria-label={copy.close}
      >
        <X className="w-4 h-4" />
      </button>

      {/* 데스크톱 풀 카드 (md 이상) */}
      <div className="hidden md:block p-5">
        <div className="flex items-center gap-2 mb-3 pr-10">
          <span className="text-lg">👋</span>
          <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">
            {copy.heading}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <DesktopCard n={1} title={copy.steps[0].title} href="/today" icon={<TrendingUp className="w-3 h-3" />} cta={copy.go}>
            {copy.steps[0].body}
          </DesktopCard>
          <DesktopCard n={2} title={copy.steps[1].title} href="/stocks" icon={<Search className="w-3 h-3" />} cta={copy.go}>
            {copy.steps[1].body}
          </DesktopCard>
          <DesktopCard n={3} title={copy.steps[2].title} href="/settings/notifications" icon={<Bell className="w-3 h-3" />} cta={copy.go}>
            {copy.steps[2].body}
          </DesktopCard>
        </div>

        <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-3 leading-relaxed">
          {copy.noticeLong}
        </p>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  href,
  icon,
  children,
}: {
  n: number;
  title: string;
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      prefetch={false}
      href={href}
      className="flex items-start gap-2.5 p-2.5 min-h-[48px] bg-white/80 dark:bg-zinc-900/60 border border-amber-100 dark:border-amber-900/50 rounded-lg active:bg-white dark:active:bg-zinc-900 transition"
    >
      <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">{title}</div>
        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{children}</div>
      </div>
      <div className="text-amber-700 dark:text-amber-400 shrink-0 mt-1">{icon}</div>
    </Link>
  );
}

function DesktopCard({
  n,
  title,
  href,
  icon,
  cta,
  children,
}: {
  n: number;
  title: string;
  href: string;
  icon: ReactNode;
  cta: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white/80 dark:bg-zinc-900/60 rounded-lg p-3 border border-amber-100 dark:border-amber-900/50">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
          {n}
        </div>
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
      </div>
      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">{children}</p>
      <Link
        prefetch={false}
        href={href}
        className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium hover:underline"
      >
        {icon}
        {cta}
      </Link>
    </div>
  );
}
