"use client";

import { createClient } from "@/lib/supabase/client";

export interface SavedSearchConfig {
  query?: string;
  sortKey: string;
  sortDir: string;
  minComposite?: number;
  perMin?: number;
  perMax?: number;
  pbrMin?: number;
  pbrMax?: number;
  roeMin?: number;
  divYieldMin?: number;
  capBucket?: string;
  market?: string;
  excludeLoss?: boolean;
  momentumMin?: number;
  flowMin?: number;
  valueMin?: number;
  volMin?: number;
  themes?: string[];
  sector?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  config: SavedSearchConfig;
  createdAt: string;
}

const LOCAL_KEY = "ornscore_saved_searches";
const LEGACY_LOCAL_KEY = "valuemap_saved_searches";
const PENDING_APPLY_KEY = "ornscore_pending_saved_search_apply";

function readLocal(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY) ?? localStorage.getItem(LEGACY_LOCAL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: SavedSearch[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  localStorage.removeItem(LEGACY_LOCAL_KEY);
  window.dispatchEvent(new CustomEvent("saved-searches-changed"));
}

async function getUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** 비로그인: localStorage / 로그인: Supabase saved_searches (RLS) */
export async function listSavedSearches(): Promise<SavedSearch[]> {
  const uid = await getUserId();
  if (!uid) return readLocal();
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("saved_searches")
      .select("id, name, config, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error || !data) return readLocal();
    return data.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      config: (r.config ?? { sortKey: "compositeScore", sortDir: "desc" }) as SavedSearchConfig,
      createdAt: String(r.created_at),
    }));
  } catch {
    return readLocal();
  }
}

export async function addSavedSearch(name: string, config: SavedSearchConfig): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) {
    const items = readLocal();
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    items.unshift({ id, name, config, createdAt: new Date().toISOString() });
    writeLocal(items.slice(0, 30));
    return true;
  }
  try {
    const supabase = createClient();
    const { error } = await supabase.from("saved_searches").insert({ user_id: uid, name, config });
    if (!error && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("saved-searches-changed"));
    return !error;
  } catch {
    return false;
  }
}

export async function removeSavedSearch(id: string): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) {
    writeLocal(readLocal().filter((s) => s.id !== id));
    return true;
  }
  try {
    const supabase = createClient();
    const { error } = await supabase.from("saved_searches").delete().eq("id", id).eq("user_id", uid);
    if (!error && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("saved-searches-changed"));
    return !error;
  } catch {
    return false;
  }
}

/** `/watchlist` 등 다른 루틴 화면에서 `/stocks`로 들어갈 때 저장 필터를 1회 적용하기 위한 세션 브리지. */
export function queueSavedSearchApply(search: SavedSearch): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.sessionStorage.setItem(PENDING_APPLY_KEY, JSON.stringify(search));
    return true;
  } catch {
    return false;
  }
}

export function consumeQueuedSavedSearch(): SavedSearch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_APPLY_KEY);
    window.sessionStorage.removeItem(PENDING_APPLY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    if (typeof parsed.name !== "string" || !parsed.config || typeof parsed.config !== "object") return null;
    return {
      id: typeof parsed.id === "string" ? parsed.id : "pending",
      name: parsed.name,
      config: parsed.config as SavedSearchConfig,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
