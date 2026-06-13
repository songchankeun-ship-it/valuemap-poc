"use client";

import { useState } from "react";

export function WaitlistForm({ source = "pricing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const j = await r.json();
      if (r.ok) {
        setStatus("done");
        setMsg(j.already ? "이미 등록돼 있어요. 출시되면 가장 먼저 알려드릴게요!" : "등록 완료! 출시되면 가장 먼저 알려드릴게요.");
      } else {
        setStatus("error");
        setMsg(j.error || "오류가 발생했어요.");
      }
    } catch {
      setStatus("error");
      setMsg("네트워크 오류 — 잠시 후 다시 시도해주세요.");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-2.5">
        <span>✓</span><span>{msg}</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2 flex-wrap">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일 주소"
        className="flex-1 min-w-[180px] px-3 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 rounded-lg focus:outline-none focus:border-blue-500"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition disabled:opacity-60 shrink-0"
      >
        {status === "loading" ? "등록 중..." : "출시 알림 받기"}
      </button>
      {status === "error" ? <p className="w-full text-xs text-rose-600">{msg}</p> : null}
    </form>
  );
}
