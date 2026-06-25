"use client";

import { useState } from "react";
import { saveAnalysis } from "@/lib/aiHistory";
import { Bot, AlertTriangle } from "lucide-react";

interface AnalysisOutput {
  oneLineSummary: string;
  scoreInterpretation: string;
  financialContext: string;
  themeContext: string;
  disclosureInsight: string;
  positives: string[];
  risks: string[];
  finalScore: number;
  finalNote: string;
}

interface AnalysisResponse {
  analysis: AnalysisOutput;
  source: "live" | "cache" | "sample";
  model?: string;
  costKRW?: number;
  rateLimitRemaining?: number;
  generatedAt?: string;
  note?: string;
  error?: string;
}

export function AiAnalysisCard({ ticker, name }: { ticker: string; name?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisResponse | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "분석 생성에 실패했습니다.");
      } else {
        setData(json);
        saveAnalysis({
          ticker,
          tickerName: name,
          analysis: json.analysis,
          model: json.model,
          source: json.source,
          costKRW: json.costKRW,
        }).catch(() => {});
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
            <Bot className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              AI 종합 분석
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              지표 4종 + 재무 + 공시를 통합한 분석 (1~3초)
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
        <div className="mb-2 text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>AI 분석은 입력 데이터를 <strong>Anthropic(미국)</strong>에 전달해 생성하는 참고 정보이며, 매수·매도 추천이 아닙니다.</span>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-60 transition"
        >
          {loading ? "분석 생성 중…" : "AI 분석 실행"}
        </button>
      </div>
    );
  }

  const a = data.analysis;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-2.5 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
        <span>이 분석은 투자 판단을 돕기 위한 <strong>참고 정보</strong>이며, 매수·매도 추천이 아닙니다. 호재·리스크를 함께 확인하세요.</span>
      </div>
      <header className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI 종합 분석</span>
            <SourceBadge source={data.source} />
          </div>
          <p className="text-base font-medium leading-tight text-zinc-900 dark:text-zinc-100">{a.oneLineSummary}</p>
        </div>
        <ScoreCircle score={a.finalScore} />
      </header>

      <Section title="자체 지표 해석">{a.scoreInterpretation}</Section>
      <Section title="재무 핵심">{a.financialContext}</Section>
      <Section title="테마 맥락">{a.themeContext}</Section>
      {a.disclosureInsight && (
        <Section title="최근 공시 시사점">{a.disclosureInsight}</Section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
        <BulletBox title="호재 3" color="success" items={a.positives} />
        <BulletBox title="리스크 3" color="danger" items={a.risks} />
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-md p-3 text-xs text-zinc-700 dark:text-zinc-300 italic">
        {a.finalNote}
      </div>

      <footer className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex-wrap gap-2">
        <div>
          {data.source === "sample" && "사전 생성 샘플 (Claude 키 없음)"}
          {data.source === "cache" && "캐시된 결과 (24시간 유효)"}
          {data.source === "live" && data.model && (
            <>모델: {data.model} · 비용 약 {data.costKRW?.toFixed(2)}원</>
          )}
        </div>
        <div className="flex items-center gap-2">
          {typeof data.rateLimitRemaining === "number" && (
            <span>오늘 {data.rateLimitRemaining}회 남음</span>
          )}
          <button
            onClick={() => { setData(null); setError(null); }}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            다시 실행
          </button>
        </div>
      </footer>

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
        본 분석은 일반 정보 제공·교육 목적이며 투자 권유가 아닙니다. 시세·재무·지표는 시뮬레이션 데이터를 포함할 수 있으며, 실제 매매는 본인 책임입니다.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
        {title}
      </div>
      <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">{children}</p>
    </div>
  );
}

function BulletBox({
  title,
  color,
  items,
}: {
  title: string;
  color: "success" | "danger";
  items: string[];
}) {
  const tone =
    color === "success"
      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
      : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200";
  return (
    <div className={`border rounded-md p-3 ${tone}`}>
      <div className="text-xs font-semibold mb-2 opacity-80 uppercase tracking-wide">{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-xs leading-relaxed flex gap-1.5">
            <span className="opacity-60 shrink-0">{i + 1}.</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#3b82f6" : "#9ca3af";
  return (
    <div className="text-center shrink-0">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white tabular-nums"
        style={{ background: color }}
      >
        {score}
      </div>
      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">/100</div>
    </div>
  );
}

function SourceBadge({ source }: { source: "live" | "cache" | "sample" }) {
  const styles = {
    live: { bg: "bg-emerald-100 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300", label: "Live" },
    cache: { bg: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-300", label: "Cache" },
    sample: { bg: "bg-amber-100 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-300", label: "Sample" },
  };
  const s = styles[source];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
