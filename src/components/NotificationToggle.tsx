"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Mail, Loader2 } from "lucide-react";
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
      <div className="shrink-0 max-w-full px-4 py-2.5 rounded-md text-sm text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 font-medium text-zinc-600 dark:text-zinc-300">
          <Mail className="w-4 h-4" />
          이메일 알림 설정
        </div>
        <p className="mt-1 max-w-[18rem] text-[11px] leading-relaxed">
          로그인 후 저장된 설정을 확인합니다. 현재 실제 발송 채널은 이메일뿐입니다.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      aria-pressed={enabled}
      aria-busy={saving}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium border transition disabled:opacity-50 shrink-0 ${
        enabled
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
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
