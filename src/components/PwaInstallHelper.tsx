"use client";

import { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";

/**
 * 앱처럼 설치하기 — 정직한 PWA 설치 도우미 (Task 75).
 * 정책: 홈 화면 추가/설치(PWA)만 안내한다. App Store·Play 스토어 출시 주장 0.
 * - 브라우저가 beforeinstallprompt를 줄 때만 실제 "앱 설치" 버튼을 노출(가짜 버튼 금지).
 * - 이미 standalone(설치/홈 화면 추가)으로 실행 중이면 다시 설치를 권하지 않는다.
 * - 그 외(iOS Safari 등 프롬프트 없는 환경)에는 수동 추가 단계만 안내한다.
 * service worker는 등록하지 않는다(docs/app-roadmap.md §4 데이터 신선도 결정 유지).
 */

// beforeinstallprompt는 표준 타입에 없어 최소 형태만 로컬 정의(신규 npm 0).
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const stepBullet = "text-zinc-400 dark:text-zinc-500 shrink-0";

function ManualSteps() {
  return (
    <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
      <li className="flex gap-2">
        <span className={stepBullet}>•</span>
        <span>
          <strong className="text-zinc-900 dark:text-zinc-100">iOS(Safari)</strong> — 공유 버튼 → <strong>홈 화면에 추가</strong>
        </span>
      </li>
      <li className="flex gap-2">
        <span className={stepBullet}>•</span>
        <span>
          <strong className="text-zinc-900 dark:text-zinc-100">Android(Chrome)</strong> — 메뉴(⋮) → <strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong>
        </span>
      </li>
    </ul>
  );
}

export default function PwaInstallHelper() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectStandalone = () =>
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setStandalone(detectStandalone());

    const onBeforeInstall = (e: Event) => {
      // 브라우저 기본 미니바를 막고, 사용자가 직접 누를 때까지 이벤트를 보관.
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    // prompt는 1회용 — 결과와 무관하게 이벤트를 비운다(중복 호출 방지).
    setInstallPrompt(null);
  };

  // (a) 이미 앱으로 실행 중 — 설치 권유 없음.
  if (standalone) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 px-3 py-2.5 text-sm text-violet-900 dark:text-violet-200">
        <Check className="w-4 h-4 shrink-0 mt-0.5" />
        <span>이미 앱으로 실행 중입니다. 홈 화면 아이콘에서 바로 열 수 있어요.</span>
      </div>
    );
  }

  // (b) 브라우저가 설치 프롬프트를 제공 — 실제 설치 버튼.
  if (installPrompt) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleInstall}
          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 transition-colors"
        >
          <Download className="w-4 h-4 shrink-0" />
          앱 설치
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          버튼을 누르면 브라우저의 설치 안내가 열립니다. 설치하면 홈 화면에서 앱처럼 전체 화면으로 실행됩니다.
        </p>
      </div>
    );
  }

  // (c) 프롬프트 미제공 환경(iOS Safari 등) — 정직한 수동 추가 단계.
  return <ManualSteps />;
}
