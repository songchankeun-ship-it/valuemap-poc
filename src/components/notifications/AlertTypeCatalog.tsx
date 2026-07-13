"use client";

import { useEffect, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import {
  groupAlertsByCategory,
  ALERT_CATEGORY_LABEL,
  type AlertType,
} from "@/lib/alertCatalog";
import { getAlertPref, setAlertPref, ALERT_PREFS_EVENT } from "@/lib/alertPrefs";

function PreviewToggle({ id }: { id: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(getAlertPref(id));
    function sync() {
      setOn(getAlertPref(id));
    }
    window.addEventListener(ALERT_PREFS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ALERT_PREFS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  function toggle() {
    const next = !on;
    setOn(next);
    setAlertPref(id, next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className={
        "shrink-0 inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-md text-xs font-medium border transition " +
        (on
          ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300"
          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300")
      }
    >
      <span
        className={
          "inline-block w-8 h-4 rounded-full relative transition " +
          (on ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600")
        }
        aria-hidden
      >
        <span
          className={
            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all " +
            (on ? "left-[18px]" : "left-0.5")
          }
        />
      </span>
      {on ? "켜둠" : "꺼둠"}
    </button>
  );
}

function AlertRow({ item }: { item: AlertType }) {
  const isLive = item.status === "live";
  return (
    <div className="flex items-start justify-between gap-3 py-3.5 flex-wrap sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-words">
            {item.label}
          </span>
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
              <Check className="w-3 h-3" />
              사용 중 · 이메일
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
              <Clock3 className="w-3 h-3" />
              준비 중
            </span>
          )}
          {item.connectsTo !== "—" ? (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{item.connectsTo} 연동</span>
          ) : null}
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed break-words">
          {item.description}
        </p>
        {isLive ? (
          <a
            href="#live-controls"
            className="inline-block mt-1.5 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
          >
            위 설정에서 켜고 끄기 →
          </a>
        ) : (
          <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 break-words">
            아직 실제 발송 전이에요. 준비되면 여기서 켜둔 설정 그대로 받게 됩니다.
          </p>
        )}
      </div>
      {isLive ? null : <PreviewToggle id={item.id} />}
    </div>
  );
}

export function AlertTypeCatalog() {
  const groups = groupAlertsByCategory();
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 md:p-5">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">알림 종류</h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed">
        받을 수 있는 알림 종류예요. <strong className="text-emerald-700 dark:text-emerald-400">사용 중</strong> 표시는 지금 이메일로 동작하고,
        <strong className="text-amber-700 dark:text-amber-400"> 준비 중</strong> 표시는 설정 개념만 미리 체험할 수 있어요(아직 발송 안 함).
      </p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed break-words">
        ‘준비 중’ 알림의 미리 설정은 지금 이 브라우저에만 저장되고 어떤 메시지도 보내지 않아요. 실제 발송은 채널이 준비된 뒤
        로그인 계정에 연결될 때 시작되며, 그전까지는 미리 켜둬도 발송되지 않습니다.
      </p>
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.category}>
            <h3 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 pb-1 border-b border-zinc-100 dark:border-zinc-800">
              {ALERT_CATEGORY_LABEL[g.category]}
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {g.items.map((item) => (
                <AlertRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
