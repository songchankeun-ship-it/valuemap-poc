import { Mail, Globe, Send, MessageCircle, Smartphone, Check, Clock3 } from "lucide-react";

// 알림 채널 현황(설계서 §7.2)을 정직하게 보여준다.
// 이메일만 실제 동작('사용 중'), 나머지는 '준비 중'(비활성). 가짜 ON 상태를 만들지 않는다.

interface Channel {
  key: string;
  label: string;
  icon: React.ReactNode;
  status: "live" | "preparing";
}

const CHANNELS: Channel[] = [
  { key: "email", label: "이메일", icon: <Mail className="w-4 h-4" />, status: "live" },
  { key: "web", label: "웹 알림", icon: <Globe className="w-4 h-4" />, status: "preparing" },
  { key: "telegram", label: "텔레그램", icon: <Send className="w-4 h-4" />, status: "preparing" },
  { key: "kakao", label: "카카오 알림톡", icon: <MessageCircle className="w-4 h-4" />, status: "preparing" },
  { key: "push", label: "앱 푸시", icon: <Smartphone className="w-4 h-4" />, status: "preparing" },
];

export function NotificationChannels() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 md:p-5">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">알림 채널</h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
        알림을 받는 경로예요. 현재는 <strong className="text-emerald-700 dark:text-emerald-400">이메일</strong>만 동작하고, 나머지 채널은 준비 중입니다.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CHANNELS.map((c) => {
          const live = c.status === "live";
          return (
            <li
              key={c.key}
              className={
                "flex items-center justify-between gap-2 px-3 py-3 min-h-[44px] rounded-lg border min-w-0 " +
                (live
                  ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 opacity-80")
              }
            >
              <span className="flex items-center gap-2 min-w-0 text-zinc-700 dark:text-zinc-300">
                <span className={live ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"}>
                  {c.icon}
                </span>
                <span className="text-sm font-medium truncate">{c.label}</span>
              </span>
              {live ? (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                  <Check className="w-3 h-3" />
                  사용 중
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
                  <Clock3 className="w-3 h-3" />
                  준비 중
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
