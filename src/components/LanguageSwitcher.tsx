"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, copy } = useLanguage();

  return (
    <div
      className={
        "inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 p-0.5 shadow-sm " +
        (compact ? "gap-0" : "gap-1")
      }
      aria-label={copy.language.label}
      title={copy.language.label}
    >
      {compact ? null : <Languages className="ml-1.5 w-3.5 h-3.5 text-zinc-400" aria-hidden />}
      <button
        type="button"
        onClick={() => setLocale("ko")}
        aria-pressed={locale === "ko"}
        className={
          "min-w-8 rounded px-2 py-1 text-[11px] font-semibold transition " +
          (locale === "ko"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
        }
      >
        {compact ? copy.language.ko : copy.language.koFull}
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={
          "min-w-8 rounded px-2 py-1 text-[11px] font-semibold transition " +
          (locale === "en"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
        }
      >
        {compact ? copy.language.en : copy.language.enFull}
      </button>
    </div>
  );
}
