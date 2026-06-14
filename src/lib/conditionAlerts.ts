"use client";

import { createClient } from "@/lib/supabase/client";
import type { SavedSearchConfig } from "@/lib/savedSearches";

export interface ConditionAlert {
  id: string;
  name: string;
  config: SavedSearchConfig;
  active: boolean;
  createdAt: string;
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

export async function listConditionAlerts(): Promise<ConditionAlert[]> {
  const uid = await getUserId();
  if (!uid) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("condition_alerts")
      .select("id, name, config, active, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      config: (r.config ?? { sortKey: "compositeScore", sortDir: "desc" }) as SavedSearchConfig,
      active: Boolean(r.active),
      createdAt: String(r.created_at),
    }));
  } catch {
    return [];
  }
}

/** 'ok' | 'login'(로그인 필요) | 'error' */
export async function addConditionAlert(name: string, config: SavedSearchConfig): Promise<"ok" | "login" | "error"> {
  const uid = await getUserId();
  if (!uid) return "login";
  try {
    const supabase = createClient();
    const { error } = await supabase.from("condition_alerts").insert({ user_id: uid, name, config });
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

export async function removeConditionAlert(id: string): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;
  try {
    const supabase = createClient();
    const { error } = await supabase.from("condition_alerts").delete().eq("id", id).eq("user_id", uid);
    return !error;
  } catch {
    return false;
  }
}

export async function setConditionAlertActive(id: string, active: boolean): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;
  try {
    const supabase = createClient();
    const { error } = await supabase.from("condition_alerts").update({ active }).eq("id", id).eq("user_id", uid);
    return !error;
  } catch {
    return false;
  }
}
