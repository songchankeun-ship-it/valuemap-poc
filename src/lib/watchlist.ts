"use client";

import { createClient } from "@/lib/supabase/client";

export type WatchlistItem = {
  ticker: string;
  addedAt: string; // ISO string
};

const LOCAL_KEY = "ornscore_watchlist";
const LEGACY_LOCAL_KEY = "valuemap_watchlist";
const MIGRATED_KEY = "ornscore_watchlist_migrated";
const LEGACY_MIGRATED_KEY = "valuemap_watchlist_migrated";

// ============================================================
// localStorage 헬퍼
// ============================================================

function readLocal(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY) ?? localStorage.getItem(LEGACY_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 옛 형식 (string[]) + 새 형식 ({ticker, addedAt}[]) 둘 다 지원
    return parsed.map((item: unknown) => {
      if (typeof item === "string") {
        return { ticker: item, addedAt: new Date().toISOString() };
      }
      if (item && typeof item === "object" && "ticker" in item) {
        const obj = item as { ticker: string; addedAt?: string };
        return {
          ticker: String(obj.ticker),
          addedAt: String(obj.addedAt ?? new Date().toISOString()),
        };
      }
      return null;
    }).filter((x): x is WatchlistItem => x !== null);
  } catch {
    return [];
  }
}

function writeLocal(items: WatchlistItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  localStorage.removeItem(LEGACY_LOCAL_KEY);
  window.dispatchEvent(new CustomEvent("watchlist-changed"));
}

// ============================================================
// 사용자 ID 가져오기
// ============================================================

async function getUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// 마이그레이션 (로그인 직후 1회)
// ============================================================

async function ensureMigrated(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY) === "1") return;
  if (localStorage.getItem(LEGACY_MIGRATED_KEY) === "1") {
    localStorage.setItem(MIGRATED_KEY, "1");
    return;
  }

  const userId = await getUserId();
  if (!userId) return;

  const local = readLocal();
  if (local.length === 0) {
    localStorage.setItem(MIGRATED_KEY, "1");
    return;
  }

  try {
    const supabase = createClient();

    // 기존 클라우드 데이터
    const { data: existing } = await supabase
      .from("watchlists")
      .select("ticker")
      .eq("user_id", userId);

    const existingTickers = new Set((existing ?? []).map((r) => r.ticker));
    const toInsert = local
      .filter((i) => !existingTickers.has(i.ticker))
      .map((i) => ({
        user_id: userId,
        ticker: i.ticker,
        added_at: i.addedAt,
      }));

    if (toInsert.length > 0) {
      await supabase.from("watchlists").insert(toInsert);
    }

    // 마이그레이션 완료 마크 (localStorage 비움)
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem(LEGACY_LOCAL_KEY);
    localStorage.setItem(MIGRATED_KEY, "1");
    localStorage.removeItem(LEGACY_MIGRATED_KEY);
    window.dispatchEvent(new CustomEvent("watchlist-changed"));
  } catch (e) {
    console.error("Watchlist migration failed:", e);
  }
}

// ============================================================
// Public API
// ============================================================

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const userId = await getUserId();
  if (!userId) {
    return readLocal();
  }

  await ensureMigrated();

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("watchlists")
      .select("ticker, added_at")
      .order("added_at", { ascending: false });

    if (error || !data) return [];
    return data.map((r) => ({
      ticker: r.ticker,
      addedAt: r.added_at,
    }));
  } catch {
    return [];
  }
}

export async function addToWatchlist(ticker: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) {
    const items = readLocal();
    if (items.some((i) => i.ticker === ticker)) return;
    items.unshift({ ticker, addedAt: new Date().toISOString() });
    writeLocal(items);
    return;
  }

  await ensureMigrated();

  try {
    const supabase = createClient();
    await supabase
      .from("watchlists")
      .upsert(
        { user_id: userId, ticker },
        { onConflict: "user_id,ticker", ignoreDuplicates: true }
      );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("watchlist-changed"));
    }
  } catch (e) {
    console.error("addToWatchlist failed:", e);
  }
}

export async function removeFromWatchlist(ticker: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) {
    const items = readLocal().filter((i) => i.ticker !== ticker);
    writeLocal(items);
    return;
  }

  await ensureMigrated();

  try {
    const supabase = createClient();
    await supabase
      .from("watchlists")
      .delete()
      .eq("user_id", userId)
      .eq("ticker", ticker);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("watchlist-changed"));
    }
  } catch (e) {
    console.error("removeFromWatchlist failed:", e);
  }
}

export async function isInWatchlist(ticker: string): Promise<boolean> {
  const items = await getWatchlist();
  return items.some((i) => i.ticker === ticker);
}
