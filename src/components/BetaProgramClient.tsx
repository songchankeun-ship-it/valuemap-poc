"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Check,
  MessageSquare,
  Search,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  BETA_FRICTION_OPTIONS,
  buildBetaFeedbackMailto,
  parseBetaFeedback,
  type BetaFriction,
} from "@/lib/betaFeedback";
import { trackEvent } from "@/lib/clientAnalytics";
import { FOCUS_RING, INPUT_FOCUS } from "@/components/ui/controlStyles";

const STORAGE_KEY = "ornscore_founding_beta_progress_v1";
const SESSION_KEY_PREFIX = "ornscore_founding_beta_started_v1";

const TASKS = [
  {
    id: "discover",
    title: "아는 종목 하나 찾아보기",
    body: "종목명이나 코드로 검색하고 결과가 자연스럽게 좁혀지는지 확인해주세요.",
    href: "/stocks",
    action: "종목 찾기",
    Icon: Search,
  },
  {
    id: "evidence",
    title: "점수의 이유 확인하기",
    body: "종목 상세에서 강점·주의점과 4개 지표 근거가 이해되는지 살펴봐주세요.",
    href: "/stock/005930",
    action: "상세 예시 보기",
    Icon: MessageSquare,
  },
  {
    id: "save",
    title: "관심 종목으로 다시 돌아오기",
    body: "관심 버튼으로 종목을 저장한 뒤 관심 종목 화면에서 다시 열어보세요.",
    href: "/watchlist",
    action: "관심 종목 열기",
    Icon: Bookmark,
  },
] as const;

type TaskId = (typeof TASKS)[number]["id"];
type SubmitState = "idle" | "sending" | "done" | "error";

function readProgress(): TaskId[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const valid = new Set<string>(TASKS.map((task) => task.id));
    return parsed.filter((value): value is TaskId => typeof value === "string" && valid.has(value));
  } catch {
    return [];
  }
}

export function BetaProgramClient() {
  const [completed, setCompleted] = useState<TaskId[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [friction, setFriction] = useState<BetaFriction | "">("");
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [source, setSource] = useState<"invite" | "site">("site");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCompleted(readProgress());
    const betaSource = new URLSearchParams(window.location.search).get("source") === "invite" ? "invite" : "site";
    setSource(betaSource);
    try {
      const sessionKey = `${SESSION_KEY_PREFIX}_${betaSource}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        trackEvent("beta_start", { source: betaSource });
      }
    } catch {
      trackEvent("beta_start", { source: betaSource });
    }
  }, []);

  const progress = Math.round((completed.length / TASKS.length) * 100);
  const parsedFeedback = useMemo(
    () =>
      parseBetaFeedback({
        rating,
        friction,
        comment,
        email,
        completedSteps: completed.length,
      }),
    [rating, friction, comment, email, completed.length],
  );
  const fallbackHref = parsedFeedback.ok ? buildBetaFeedbackMailto(parsedFeedback.value) : "mailto:contact@ornscore.com";

  function persistProgress(next: TaskId[]) {
    setCompleted(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Progress is optional and must never block the beta flow.
    }
  }

  function toggleTask(id: TaskId) {
    const isDone = completed.includes(id);
    const next = isDone ? completed.filter((item) => item !== id) : [...completed, id];
    persistProgress(next);
    trackEvent("beta_task_complete", {
      step: id,
      action: isDone ? "undo" : "complete",
      completedSteps: next.length,
      source,
    });
  }

  function openTask(id: TaskId) {
    trackEvent("beta_task_open", { step: id, source });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseBetaFeedback({
      rating,
      friction,
      comment,
      email,
      completedSteps: completed.length,
    });
    if (!parsed.ok) {
      setSubmitState("error");
      setMessage(parsed.error);
      return;
    }

    setSubmitState("sending");
    setMessage("");
    trackEvent("beta_feedback_submit", {
      rating: parsed.value.rating,
      friction: parsed.value.friction,
      completedSteps: parsed.value.completedSteps,
      source,
    });

    try {
      const response = await fetch("/api/beta-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.value, website }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitState("error");
        setMessage(result.error || "저장하지 못했어요. 이메일 보내기를 이용해주세요.");
        trackEvent("beta_feedback_result", { result: "server_error", source });
        return;
      }

      setSubmitState("done");
      setMessage("고마워요. 이 의견은 다음 개선 순서를 정하는 데 바로 반영할게요.");
      trackEvent("beta_feedback_result", { result: "ok", source });
    } catch {
      setSubmitState("error");
      setMessage("네트워크 연결을 확인하거나 이메일 보내기를 이용해주세요.");
      trackEvent("beta_feedback_result", { result: "network_error", source });
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="beta-tasks-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="beta-tasks-heading" className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              세 가지만 확인해주세요
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              순서대로 약 10분이면 충분합니다. 완료 표시는 이 기기에만 저장됩니다.
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
            {completed.length}/{TASKS.length}
          </span>
        </div>

        <div
          className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          role="progressbar"
          aria-label="베타 체험 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${progress}%` }} />
        </div>

        <ol className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {TASKS.map((task, index) => {
            const done = completed.includes(task.id);
            return (
              <li key={task.id} className="grid min-h-[116px] gap-3 py-4 sm:grid-cols-[36px_1fr_auto] sm:items-center">
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-pressed={done}
                  aria-label={`${index + 1}단계 ${task.title} ${done ? "완료 취소" : "완료 표시"}`}
                  title={done ? "완료 취소" : "완료 표시"}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${FOCUS_RING} ${
                    done
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-zinc-300 bg-white text-zinc-500 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                </button>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{task.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{task.body}</p>
                </div>

                <Link
                  href={task.href}
                  prefetch={false}
                  onClick={() => openTask(task.id)}
                  className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900 ${FOCUS_RING}`}
                >
                  <task.Icon className="h-4 w-4" aria-hidden="true" />
                  {task.action}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="feedback" aria-labelledby="beta-feedback-heading" className="scroll-mt-20 border-t border-zinc-200 pt-7 dark:border-zinc-800">
        <h2 id="beta-feedback-heading" className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          가장 솔직한 한 가지를 남겨주세요
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          좋았던 점보다 막힌 지점이 더 도움이 됩니다. 이름은 받지 않으며 이메일은 답장이 필요할 때만 선택 입력입니다.
        </p>

        {submitState === "done" ? (
          <div role="status" className="mt-4 border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            {message}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-5">
            <fieldset>
              <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                실제로 다시 써볼 만큼 유용했나요?
              </legend>
              <div className="mt-2 inline-grid grid-cols-5 overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-pressed={rating === value}
                    className={`h-11 w-12 border-r border-zinc-300 text-sm font-semibold last:border-r-0 dark:border-zinc-700 ${FOCUS_RING} ${
                      rating === value
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">1 전혀 아님 · 5 다시 사용하고 싶음</p>
            </fieldset>

            <label className="block">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">가장 막혔던 구간</span>
              <select
                required
                value={friction}
                onChange={(event) => setFriction(event.target.value as BetaFriction)}
                className={`mt-2 min-h-11 w-full max-w-md rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 ${INPUT_FOCUS}`}
              >
                <option value="">선택해주세요</option>
                {BETA_FRICTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">한 가지만 바꾼다면 무엇을 바꾸면 좋을까요?</span>
              <textarea
                required
                minLength={5}
                maxLength={1500}
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="예: 점수가 왜 높은지 첫 화면에서 바로 이해하기 어려웠어요."
                className={`mt-2 w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 ${INPUT_FOCUS}`}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">답장받을 이메일 <span className="font-normal text-zinc-400">(선택)</span></span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className={`mt-2 min-h-11 w-full max-w-md rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 ${INPUT_FOCUS}`}
              />
            </label>

            <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
              웹사이트
              <input
                type="text"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>

            {submitState === "error" ? (
              <div role="alert" className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <p>{message}</p>
                <a href={fallbackHref} className="mt-2 inline-flex min-h-9 items-center font-semibold underline">
                  이메일로 의견 보내기
                </a>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitState === "sending"}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white ${FOCUS_RING}`}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {submitState === "sending" ? "보내는 중" : "의견 보내기"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
