"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Search, TrendingUp, Bell, ChevronDown } from "lucide-react";

const STORAGE_KEY = "valuemap_welcome_dismissed_v1";

/**
 * 첫 방문자 환영 박스.
 * - 데스크톱: 3단계 카드 풀 표시
 * - 모바일: 1줄 요약 + 펼치기 (히어로 가리지 않음)
 * - X 누르면 LocalStorage에 저장 → 다시 안 보임
 */
export function WelcomeOnboarding() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setShow(true);
    } catch {
      // localStorage 차단된 경우 — 그냥 표시 안 함
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
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
          aria-label="처음 사용 가이드 열기/닫기"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">👋</span>
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-200 truncate">
              처음 오셨어요? 3단계 가이드 보기
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
            <Step n={1} title="오늘의 후보 종목 보기" href="/today" icon={<TrendingUp className="w-3.5 h-3.5" />}>
              네 지표가 우호적인 상위 5개 종목 확인
            </Step>
            <Step n={2} title="관심 종목 깊이 보기" href="/stocks" icon={<Search className="w-3.5 h-3.5" />}>
              점수 옆 <strong>(?)</strong>를 누르면 각 지표 의미 보임
            </Step>
            <Step n={3} title="알림 받기 (선택)" href="/settings/notifications" icon={<Bell className="w-3.5 h-3.5" />}>
              관심 종목에 ❤ 등록 → 새 공시 신호 시 이메일
            </Step>
            <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed pt-1">
              ⚠ 본 도구는 매수·매도 추천이 아니라 <strong>데이터 기반 탐색 우선순위</strong>를 제공합니다.
            </p>
          </div>
        ) : null}
      </div>

      {/* 닫기 버튼 (양쪽 모두) - 36px 터치 영역 */}
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-1.5 right-1.5 w-9 h-9 inline-flex items-center justify-center rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 active:bg-amber-200 dark:active:bg-amber-900/60 transition z-10"
        aria-label="안내 닫기"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 데스크톱 풀 카드 (md 이상) */}
      <div className="hidden md:block p-5">
        <div className="flex items-center gap-2 mb-3 pr-10">
          <span className="text-lg">👋</span>
          <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">
            처음 오셨나요? 3단계로 사용해보세요
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <DesktopCard n={1} title="오늘의 후보 종목 보기" href="/today" icon={<TrendingUp className="w-3 h-3" />}>
            네 지표가 우호적인 상위 5개 종목을 확인하세요.
          </DesktopCard>
          <DesktopCard n={2} title="관심 종목 깊이 보기" href="/stocks" icon={<Search className="w-3 h-3" />}>
            점수 옆 <strong>(?)</strong>를 누르면 각 지표 의미를 알 수 있어요.
          </DesktopCard>
          <DesktopCard n={3} title="알림 받기 (선택)" href="/settings/notifications" icon={<Bell className="w-3 h-3" />}>
            관심 종목에 ❤ 등록하면 새 공시 신호 발생 시 이메일 발송.
          </DesktopCard>
        </div>

        <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-3 leading-relaxed">
          ⚠ 본 도구는 매수·매도 추천이 아니라 <strong>데이터 기반 탐색 우선순위</strong>를 제공합니다. 투자 결정은 본인이 직접.
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
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
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
  children,
}: {
  n: number;
  title: string;
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
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
        href={href}
        className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium hover:underline"
      >
        {icon}
        가기 →
      </Link>
    </div>
  );
}
