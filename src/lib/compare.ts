"use client";

import { createClient } from "@/lib/supabase/client";

import { FREE_COMPARE_LIMIT } from "@/lib/limits";
export const COMPARE_MAX = FREE_COMPARE_LIMIT;

const LOCAL_KEY = "valuemap_compare_basket";
const LEGACY_KEY = "valuemap:compare"; // 옛 키 (CompareClient에서 사용했던 거)
const MIGRATED_KEY = "valuemap_compare_migrated";

// ============================================================
// localStorage 헬퍼
// ============================================================

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    // 두 키 모두 시도 + 합치기
    const a = localStorage.getItem(LOCAL_KEY);
    const b = localStorage.getItem(LEGACY_KEY);
    const set = new Set<string>();
    for (const raw of [a, b]) {
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        for (const t of arr) {
          if (typeof t === "string") set.add(t);
        }
      }
    }
    return Array.from(set);
  } catch {
    return [];
  }
}

function writeLocal(tickers: string[]) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(tickers);
  localStorage.setItem(LOCAL_KEY, payload);
  localStorage.setItem(LEGACY_KEY, payload); // 옛 컴포넌트 호환
  window.dispatchEvent(new CustomEvent("compare-basket-changed"));
  window.dispatchEvent(new CustomEvent("valuemap:compare-updated"));
}

function broadcastChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("compare-basket-changed"));
  window.dispatchEvent(new CustomEvent("valuemap:compare-updated"));
}

// ============================================================
// 사용자 ID
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
// 마이그레이션
// ============================================================

async function ensureMigrated(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY) === "1") return;

  const userId = await getUserId();
  if (!userId) return;

  const local = readLocal();
  if (local.length === 0) {
    localStorage.setItem(MIGRATED_KEY, "1");
    return;
  }

  try {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("compare_basket")
      .select("ticker")
      .eq("user_id", userId);
    const existingSet = new Set((existing ?? []).map((r) => r.ticker));

    // 최대 4개 제한 — 남은 자리만큼만 업로드
    const remaining = Math.max(0, COMPARE_MAX - existingSet.size);
    const toInsert = local
      .filter((t) => !existingSet.has(t))
      .slice(0, remaining)
      .map((t) => ({ user_id: userId, ticker: t }));

    if (toInsert.length > 0) {
      await supabase.from("compare_basket").insert(toInsert);
    }

    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem(LEGACY_KEY);
    localStorage.setItem(MIGRATED_KEY, "1");
    broadcastChange();
  } catch (e) {
    console.error("Compare migration failed:", e);
  }
}

// ============================================================
// Public API
// ============================================================

export async function getCompareList(): Promise<string[]> {
  const userId = await getUserId();
  if (!userId) return readLocal();

  await ensureMigrated();

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("compare_basket")
      .select("ticker, added_at")
      .order("added_at", { ascending: true });
    if (!data) return [];
    return data.map((r) => r.ticker);
  } catch {
    return [];
  }
}

export async function addToCompare(
  ticker: string
): Promise<{ ok: boolean; reason?: "max" | "already" | "error" }> {
  const current = await getCompareList();
  if (current.includes(ticker)) return { ok: true, reason: "already" };
  if (current.length >= COMPARE_MAX) {
    return { ok: false, reason: "max" };
  }

  const userId = await getUserId();
  if (!userId) {
    writeLocal([...current, ticker]);
    return { ok: true };
  }

  await ensureMigrated();

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("compare_basket")
      .insert({ user_id: userId, ticker });
    if (error) {
      console.error("addToCompare insert error:", error);
      return { ok: false, reason: "error" };
    }
    broadcastChange();
    return { ok: true };
  } catch (e) {
    console.error("addToCompare failed:", e);
    return { ok: false, reason: "error" };
  }
}

export async function removeFromCompare(ticker: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) {
    const current = readLocal();
    writeLocal(current.filter((t) => t !== ticker));
    return;
  }

  await ensureMigrated();

  try {
    const supabase = createClient();
    await supabase
      .from("compare_basket")
      .delete()
      .eq("user_id", userId)
      .eq("ticker", ticker);
    broadcastChange();
  } catch (e) {
    console.error("removeFromCompare failed:", e);
  }
}

export async function clearCompare(): Promise<void> {
  const userId = await getUserId();
  if (!userId) {
    writeLocal([]);
    return;
  }

  await ensureMigrated();

  try {
    const supabase = createClient();
    await supabase
      .from("compare_basket")
      .delete()
      .eq("user_id", userId);
    broadcastChange();
  } catch (e) {
    console.error("clearCompare failed:", e);
  }
}

export async function isInCompare(ticker: string): Promise<boolean> {
  const list = await getCompareList();
  return list.includes(ticker);
}
