"use client";

import { useState } from "react";
import { saveAnalysis } from "@/lib/aiHistory";

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
        // 로그인 상태면 자동으로 DB에 기록 저장 (실패해도 사용자엔 영향 X)
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
      <div className="bg-brand-50 rounded-lg p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium text-brand-700 mb-0.5">
              AI 종합 분석
            </div>
            <div className="text-xs text-brand-700/80">
              자체 지표 4종 + 재무 + 공시를 통합한 정직한 분석 (1~3초 소요)
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-2 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="w-full py-2 bg-brand-600 text-white rounded-md text-sm font-medium disabled:opacity-60"
        >
          {loading ? "분석 생성 중…" : "AI 분석 실행"}
        </button>
      </div>
    );
  }

  const a = data.analysis;
  return (
    <div className="bg-white border border-brand-200 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">AI 종합 분석</span>
            <SourceBadge source={data.source} />
          </div>
          <p className="text-base font-medium leading-tight">{a.oneLineSummary}</p>
        </div>
        <ScoreCircle score={a.finalScore} />
      </header>

      <Section title="자체 지표 해석">{a.scoreInterpretation}</Section>
      <Section title="재무 핵심">{a.financialContext}</Section>
      <Section title="테마 맥락">{a.themeContext}</Section>
      {a.disclosureInsight && (
        <Section title="최근 공시 시사점">{a.disclosureInsight}</Section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <BulletBox title="호재 3" color="success" items={a.positives} />
        <BulletBox title="리스크 3" color="danger" items={a.risks} />
      </div>

      <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-700 italic">
        {a.finalNote}
      </div>

      <footer className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-gray-100">
        <div>
          {data.source === "sample" && "사전 생성 샘플 (Claude 키 없음)"}
          {data.source === "cache" && "캐시된 결과 (24시간 유효)"}
          {data.source === "live" && data.model && (
            <>모델: {data.model} · 비용 약 {data.costKRW?.toFixed(2)}원</>
          )}
        </div>
        <div className="space-x-2">
          {typeof data.rateLimitRemaining === "number" && (
            <span>오늘 {data.rateLimitRemaining}회 남음</span>
          )}
          <button
            onClick={() => { setData(null); setError(null); }}
            className="text-brand-600 hover:underline"
          >
            다시 실행
          </button>
        </div>
      </footer>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        본 분석은 일반 정보 제공·교육 목적이며 투자 권유가 아닙니다.
        시세·재무·지표는 시뮬레이션 데이터를 포함할 수 있으며, 실제 매매는 본인 책임입니다.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wide">
        {title}
      </div>
      <p className="text-sm text-gray-800 leading-relaxed">{children}</p>
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
      ? "bg-green-50 border-green-200 text-green-900"
      : "bg-red-50 border-red-200 text-red-900";
  return (
    <div className={`border rounded-md p-3 ${tone}`}>
      <div className="text-xs font-medium mb-2 opacity-80">{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-xs leading-relaxed flex gap-1">
            <span className="opacity-60">{i + 1}.</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "#1D9E75" : score >= 50 ? "#3B82F6" : "#9CA3AF";
  return (
    <div className="text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-white"
        style={{ background: color }}
      >
        {score}
      </div>
      <div className="text-[10px] text-gray-500 mt-1">/100</div>
    </div>
  );
}

function SourceBadge({ source }: { source: "live" | "cache" | "sample" }) {
  const styles = {
    live: { bg: "bg-green-100", text: "text-green-700", label: "Live" },
    cache: { bg: "bg-blue-100", text: "text-blue-700", label: "Cache" },
    sample: { bg: "bg-amber-100", text: "text-amber-700", label: "Sample" },
  };
  const s = styles[source];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
