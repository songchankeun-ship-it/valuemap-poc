"use client";

import { createClient } from "@/lib/supabase/client";

/** 알림 받는지 여부. 기본 ON. */
export async function getNotificationEnabled(): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return true;

    const { data } = await supabase
      .from("notification_preferences")
      .select("enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    return data?.enabled ?? true;
  } catch {
    return true;
  }
}

export async function setNotificationEnabled(enabled: boolean): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("notification_preferences").upsert(
      {
        user_id: user.id,
        enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return !error;
  } catch {
    return false;
  }
}
