"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  LANG_COOKIE,
  LANG_STORAGE_KEY,
  commonCopy,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  copy: (typeof commonCopy)[Locale];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const found = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LANG_COOKIE}=`));
  if (!found) return null;
  return normalizeLocale(decodeURIComponent(found.split("=").slice(1).join("=")));
}

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const queryLocale = new URLSearchParams(window.location.search).get("lang");
  if (queryLocale) return normalizeLocale(queryLocale);

  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (stored) return normalizeLocale(stored);

  return readCookieLocale();
}

function preferredBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const preferred = navigator.languages?.[0] ?? navigator.language;
  return preferred?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

function persistLocale(nextLocale: Locale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = nextLocale === "ko" ? "ko" : "en";
    document.cookie = `${LANG_COOKIE}=${encodeURIComponent(
      nextLocale,
    )}; path=/; max-age=31536000; samesite=lax`;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANG_STORAGE_KEY, nextLocale);
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale();
    const nextLocale = stored ?? preferredBrowserLocale();
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale(nextLocale) {
        setLocaleState(nextLocale);
        persistLocale(nextLocale);
      },
      copy: commonCopy[locale],
    }),
    [locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
