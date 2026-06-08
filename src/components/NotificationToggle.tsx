"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { getNotificationEnabled, setNotificationEnabled } from "@/lib/notifications";

export function NotificationToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getNotificationEnabled().then((v) => {
      if (mounted) setEnabled(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function toggle() {
    if (enabled === null || saving) return;
    setSaving(true);
    const newValue = !enabled;
    setEnabled(newValue); // 낙관적
    const success = await setNotificationEnabled(newValue);
    if (!success) {
      setEnabled(!newValue); // 롤백
    }
    setSaving(false);
  }

  if (enabled === null) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm text-zinc-500 border border-zinc-200">
        <Loader2 className="w-4 h-4 animate-spin" />
        불러오는 중...
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium border transition disabled:opacity-50 shrink-0 ${
        enabled
          ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
          : "bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : enabled ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      {enabled ? "알림 받는 중" : "알림 꺼짐"}
    </button>
  );
}
