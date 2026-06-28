"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { reportFormCopy } from "@/lib/copy/status";

const CATEGORY_VALUES = ["price", "financial", "disclosure", "score", "sector", "other"] as const;

/**
 * 데이터 오류 신고 인앱 폼 (선택). 성공 시 data_reports 테이블에 저장.
 * env/테이블 부재 등으로 실패해도 상위 컴포넌트의 mailto 버튼이 항상 fallback으로 유지된다.
 * 다국어 v2: 라벨/상태/플레이스홀더는 reportFormCopy(로케일)에서 읽는다.
 */
export function ReportDataIssueForm({
  asOfDate,
  metricsVersion,
  prefillTicker = "",
}: {
  asOfDate: string;
  metricsVersion: string;
  prefillTicker?: string;
}) {
  const { locale } = useLanguage();
  const t = reportFormCopy[locale];
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("price");
  const [ticker, setTicker] = useState(prefillTicker);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) {
      setState("error");
      setErrorMsg(t.errorTooShort);
      return;
    }
    setState("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/report-data-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, ticker, message, email, asOfDate, metricsVersion }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setErrorMsg(json.error ?? t.errorSaveFail);
        return;
      }
      setState("ok");
    } catch {
      setState("error");
      setErrorMsg(t.errorNetwork);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center mt-2 min-h-[44px] px-3 text-[13px] text-blue-700 dark:text-blue-400 hover:underline"
      >
        {t.openButton}
      </button>
    );
  }

  if (state === "ok") {
    return (
      <div className="mt-3 rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/20 p-3 text-[13px] text-emerald-800 dark:text-emerald-300">
        {t.successTitle}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 p-3">
      <div className="flex flex-wrap gap-2">
        <label className="flex-1 min-w-[140px]">
          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">{t.categoryLabel}</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full min-h-[44px] rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100"
          >
            {CATEGORY_VALUES.map((c) => (
              <option key={c} value={c}>{t.categories[c]}</option>
            ))}
          </select>
        </label>
        <label className="flex-1 min-w-[140px]">
          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">{t.tickerLabel}</span>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder={t.tickerPlaceholder}
            className="w-full min-h-[44px] rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100"
          />
        </label>
      </div>
      <label className="block">
        <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">{t.messageLabel}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={t.messagePlaceholder}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100"
        />
      </label>
      <label className="block">
        <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">{t.emailLabel}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          className="w-full min-h-[44px] rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100"
        />
      </label>
      {state === "error" && (
        <p className="text-[12px] text-red-700 dark:text-red-400">{errorMsg}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex items-center min-h-[44px] px-4 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-60"
        >
          {state === "sending" ? t.submitting : t.submit}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center min-h-[44px] px-3 text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
        >
          {t.close}
        </button>
      </div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t.footnote(asOfDate, metricsVersion)}</p>
    </form>
  );
}
