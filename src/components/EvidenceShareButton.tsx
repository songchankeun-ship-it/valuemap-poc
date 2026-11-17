"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { trackEvent } from "@/lib/clientAnalytics";
import { withGrowthShareRef } from "@/lib/growthShare";
import { FOCUS_RING } from "@/components/ui/controlStyles";

type ShareKind =
  | { kind: "stock"; ticker: string }
  | { kind: "compare"; count: number; surface: "interactive" | "curated" };

interface EvidenceShareButtonProps {
  path: string;
  title: string;
  text: string;
  analytics: ShareKind;
  label?: string;
  compact?: boolean;
}

export function EvidenceShareButton({
  path,
  title,
  text,
  analytics,
  label = "공유",
  compact = false,
}: EvidenceShareButtonProps) {
  const [copied, setCopied] = useState(false);

  function record(method: "native" | "copy" | "prompt") {
    if (analytics.kind === "stock") {
      trackEvent("stock_share", { method, ticker: analytics.ticker });
      return;
    }
    trackEvent("compare_share", {
      method,
      count: analytics.count,
      surface: analytics.surface,
    });
  }

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${withGrowthShareRef(path)}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        record("native");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      record("copy");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("이 링크를 복사하세요:", url);
      record("prompt");
    }
  }

  return (
    <button
      type="button"
      onClick={() => { void handleShare(); }}
      className={
        compact
          ? `inline-flex min-h-[44px] min-w-0 items-center gap-1.5 overflow-hidden text-xs font-medium text-blue-700 hover:underline dark:text-blue-400 ${FOCUS_RING}`
          : `inline-flex min-h-[44px] min-w-0 items-center gap-1.5 overflow-hidden rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 ${FOCUS_RING}`
      }
      aria-label={label}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span className="truncate">링크 복사됨</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </>
      )}
    </button>
  );
}
