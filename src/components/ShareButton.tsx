"use client";

import { useState } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

export function ShareButton({ name, ticker }: { name: string; ticker: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/stock/${ticker}`;
    const title = `${name} (${ticker}) — 오른스코어`;
    const text = `${name}의 자체 지표 4종 분석을 오른스코어에서 확인하세요.`;

    // 모바일: Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // 사용자가 취소했거나 실패 — 클립보드로 fallback
      }
    }

    // 데스크톱 또는 fallback: 클립보드 복사
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드도 실패하면 prompt
      window.prompt("이 링크를 복사하세요:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-md border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
      aria-label="종목 공유"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          링크 복사됨
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          공유
        </>
      )}
    </button>
  );
}
