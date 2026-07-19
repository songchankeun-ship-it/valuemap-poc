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

// ── 한국어 전용 공개 로케일 불변식(Korean-only public-locale invariant) ──────────
// v1 무료 베타의 공개 경험은 한국어 전용이다. 어떤 durable 상태(localStorage/쿠키)도
// 일반 방문자를 영어나 혼합 언어 상태로 만들 수 없다 — 레거시로 저장된 영어 값이
// 남아 있어도 마찬가지다. 영어는 오직 명시적 `?lang=en` 내부 검증 override 로만,
// 그것도 "이 뷰 한정"으로만 켜진다(durable 저장 절대 금지 → 재로드 시 한국어 복귀).
//
// resolvePublicLocale 은 DOM 없이 순수하게 결정을 내리는 단일 진실 소스다. 아래
// 세 입력만 보고, 렌더할 로케일과 durable 부작용(레거시 정리 여부)까지 반환한다.
// 이 함수가 일반 경로(query 없음)에서 durable 값만으로 영어를 반환하는 경로는 없다.
export type PublicLocaleInputs = {
  // 현재 URL 의 ?lang= 값(원문). 없으면 null.
  queryLang: string | null;
  // localStorage 에 남아 있는 원문 값(레거시 포함). 없으면 null.
  storedLocale: string | null;
  // 쿠키에 남아 있는 원문 값(레거시 포함). 없으면 null.
  cookieLocale: string | null;
};

export type PublicLocaleResolution = {
  // 이 뷰에서 실제로 렌더할 로케일.
  locale: Locale;
  // 영어 override 는 일회성이다 — durable public preference 로 굳지 않는다.
  ephemeralOverride: boolean;
  // 레거시 비-한국어 durable 값을 정리(삭제)해야 하는가.
  clearLegacyDurable: boolean;
  // 결정 근거(테스트/디버깅용).
  source: "query-en" | "query-ko" | "default";
};

// durable(localStorage/쿠키) 값이 한국어가 아닌 레거시 상태인지.
function hasLegacyDurable(inputs: PublicLocaleInputs): boolean {
  const storedIsLegacy =
    inputs.storedLocale != null && normalizeLocale(inputs.storedLocale) !== DEFAULT_LOCALE;
  const cookieIsLegacy =
    inputs.cookieLocale != null && normalizeLocale(inputs.cookieLocale) !== DEFAULT_LOCALE;
  return storedIsLegacy || cookieIsLegacy;
}

export function resolvePublicLocale(inputs: PublicLocaleInputs): PublicLocaleResolution {
  const rawQuery = inputs.queryLang == null ? "" : inputs.queryLang.trim();

  if (rawQuery) {
    // 명시적 override 만 영어를 켤 수 있고, 그마저도 durable 로 저장하지 않는다.
    if (normalizeLocale(rawQuery) === "en") {
      return {
        locale: "en",
        ephemeralOverride: true,
        clearLegacyDurable: false,
        source: "query-en",
      };
    }
    // 명시적 ?lang=ko — 한국어로 고정하고, 남은 레거시 영어 durable 은 정리한다.
    return {
      locale: DEFAULT_LOCALE,
      ephemeralOverride: false,
      clearLegacyDurable: hasLegacyDurable(inputs),
      source: "query-ko",
    };
  }

  // 일반 공개 네비게이션 — durable 상태와 무관하게 항상 한국어.
  // (레거시 영어 값이 있어도 영어로 되돌아가지 않는다. 이것이 불변식의 핵심.)
  return {
    locale: DEFAULT_LOCALE,
    ephemeralOverride: false,
    clearLegacyDurable: hasLegacyDurable(inputs),
    source: "default",
  };
}

// ── DOM 어댑터(얇은 래퍼) ────────────────────────────────────────────────────
function readQueryLang(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("lang");
}

function readStoredLocaleRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    return null;
  }
}

function readCookieLocaleRaw(): string | null {
  if (typeof document === "undefined") return null;
  const found = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LANG_COOKIE}=`));
  if (!found) return null;
  return decodeURIComponent(found.split("=").slice(1).join("="));
}

function setDocumentLang(locale: Locale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale === "en" ? "en" : "ko";
  }
}

// 레거시 durable 로케일 정리 — 값을 새로 쓰지 않고 제거만 한다(영어를 durable 로
// 굳히는 쓰기 경로 자체가 없다). 한국어는 기본값이라 durable 저장이 필요 없다.
function clearDurableLocale() {
  if (typeof document !== "undefined") {
    document.cookie = `${LANG_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(LANG_STORAGE_KEY);
    } catch {
      /* localStorage 접근 불가(프라이버시 모드 등) — durable 상태도 없으므로 무시 */
    }
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // SSR·최초 클라 렌더 모두 DEFAULT_LOCALE("ko")로 시작 → hydration mismatch 없음.
  // 영어 override 는 mount 이후 effect 에서만, 그것도 ?lang=en 일 때만 반영된다.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const resolution = resolvePublicLocale({
      queryLang: readQueryLang(),
      storedLocale: readStoredLocaleRaw(),
      cookieLocale: readCookieLocaleRaw(),
    });
    setLocaleState(resolution.locale);
    setDocumentLang(resolution.locale);
    // 영어 override(ephemeralOverride)는 durable 상태를 전혀 쓰지 않는다.
    // 레거시 영어 durable 이 감지되면 조용히 정리해 재발을 막는다.
    if (resolution.clearLegacyDurable) clearDurableLocale();
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale(nextLocale) {
        // 공개 언어 전환은 숨겨져 있다(설계서 §4 KO/EN 토글 숨김). 내부에서 호출되더라도
        // 영어는 durable 로 굳지 않고, 한국어로 전환하면 레거시 영어 durable 을 정리한다.
        const target = normalizeLocale(nextLocale);
        setLocaleState(target);
        setDocumentLang(target);
        if (target === DEFAULT_LOCALE) clearDurableLocale();
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
