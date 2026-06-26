"use client";

import { useState } from "react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "price", label: "가격·거래량" },
  { value: "financial", label: "재무(PER·PBR·ROE)" },
  { value: "disclosure", label: "공시" },
  { value: "score", label: "점수·순위" },
  { value: "sector", label: "업종 분류" },
  { value: "other", label: "기타" },
];

/**
 * 데이터 오류 신고 인앱 폼 (선택). 성공 시 data_reports 테이블에 저장.
 * env/테이블 부재 등으로 실패해도 상위 컴포넌트의 mailto 버튼이 항상 fallback으로 유지된다.
 */
export function ReportDataIssueForm({
  asOfDate,
  metricsVersion,
  prefillTicker = "",
}: {
  asOfDate: string;
  metricsVersion: string;
  prefillTicker?: string;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("price");
  const [ticker, setTicker] = useState(prefillTicker);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) {
      setState("error");
      setErrorMsg("신고 내용을 5자 이상 적어주세요.");
      return;
    }
    setState("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/report-data-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, ticker, message, email, asOfDate, metricsVersion }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setErrorMsg(json.error ?? "저장에 실패했어요. 위 메일 버튼으로 신고해주세요.");
        return;
      }
      setState("ok");
    } catch {
      setState("error");
      setErrorMsg("네트워크 오류예요. 위 메일 버튼으로 신고해주세요.");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center mt-2 min-h-[44px] px-3 text-[13px] text-blue-700 dark:text-blue-400 hover:underline"
      >
        앱에서 바로 신고하기 (선택) →
      </button>
    );
  }

  if (state === "ok") {
    return (
      <div className="mt-3 rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/20 p-3 text-[13px] text-emerald-800 dark:text-emerald-300">
        신고가 접수됐어요. 확인 후 반영하겠습니다. 감사합니다.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 p-3">
      <div className="flex flex-wrap gap-2">
        <label className="flex-1 min-w-[140px]">
          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">분류</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full min-h-[44px] rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="flex-1 min-w-[140px]">
          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">종목명·코드 (선택)</span>
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="예: 삼성전자 005930"
            className="w-full min-h-[44px] rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100"
          />
        </label>
      </div>
      <label className="block">
        <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">내용</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="어떤 값이 어떻게 잘못됐는지 적어주세요."
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-2 text-sm text-zinc-900 dark:text-zinc-100"
        />
      </label>
      <label className="block">
        <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">회신용 이메일 (선택)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="답변이 필요하면 입력"
          className="w-full min-h-[44px] rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100"
        />
      </label>
      {state === "error" && (
        <p className="text-[12px] text-red-700 dark:text-red-400">{errorMsg}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex items-center min-h-[44px] px-4 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-60"
        >
          {state === "sending" ? "보내는 중…" : "신고 보내기"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center min-h-[44px] px-3 text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
        >
          닫기
        </button>
      </div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">기준일 {asOfDate} · 산식 {metricsVersion}이(가) 함께 저장됩니다. 저장이 안 되면 위 메일 버튼으로 신고해주세요.</p>
    </form>
  );
}
