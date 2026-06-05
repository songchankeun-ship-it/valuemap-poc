import { notFound } from "next/navigation";
import Link from "next/link";
import { getStockByTicker } from "@/lib/mockData";
import { AiAnalysisCard } from "@/components/AiAnalysisCard";
import { StockDisclosures } from "@/components/StockDisclosures";
import { AddToCompareButton } from "@/components/AddToCompareButton";

interface PageProps { params: Promise<{ ticker: string }>; }

export async function generateMetadata({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) return { title: "종목을 찾을 수 없습니다" };
  return {
    title: `${s.name} (${ticker}) 분석 — 밸류맵`,
    description: `${s.name}의 자체 지표 4종, 재무, AI 분석을 한 화면에서.`,
  };
}

function composeReason(m: number, f: number, v: number, vo: number): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (m >= 70) strengths.push("강세 추세");
  else if (m <= 30) weaknesses.push("약세 흐름");
  if (f >= 70) strengths.push("자금 유입 활발");
  else if (f <= 30) weaknesses.push("거래량 부진");
  if (v >= 70) strengths.push("상대적 저평가");
  else if (v <= 30) weaknesses.push("상대적 고평가");
  if (vo >= 70) strengths.push("위험 대비 수익 우수");
  else if (vo <= 30) weaknesses.push("변동성 대비 수익 부진");
  if (!strengths.length && !weaknesses.length) return "네 지표 모두 중간대 — 두드러진 신호 없음";
  const parts: string[] = [];
  if (strengths.length) parts.push("강점: " + strengths.join(", "));
  if (weaknesses.length) parts.push("약점: " + weaknesses.join(", "));
  return parts.join(" · ");
}

export default async function StockDetailPage({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) notFound();
  const composite = Math.round((s.momentum + s.flow + s.value + s.vol) / 4);
  const reason = composeReason(s.momentum, s.flow, s.value, s.vol);

  return (
    <div className="space-y-4">
      <nav className="text-xs text-gray-500 flex items-center gap-1">
        <Link href="/">홈</Link><span>›</span>
        <Link href="/stocks">종목 탐색</Link><span>›</span>
        <span className="text-gray-900">{s.name}</span>
      </nav>

      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-medium">{s.name}</h1>
            <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">{s.ticker}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{s.currentPrice.toLocaleString()}원</span>
            <span className={s.changePct >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {s.changePct >= 0 ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}% (상승률 기준)
            </span>
          </div>
        </div>
        <AddToCompareButton ticker={s.ticker} name={s.name} />
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { l: "PER", v: `${s.per.toFixed(1)}x` },
          { l: "PBR", v: `${s.pbr.toFixed(2)}x` },
          { l: "ROE", v: `${s.roe.toFixed(1)}%` },
          { l: "배당수익률", v: `${s.dividendYield.toFixed(2)}%` },
        ].map((m) => (
          <div key={m.l} className="bg-gray-50 rounded-md p-3">
            <div className="text-[11px] text-gray-500 mb-0.5">{m.l}</div>
            <div className="text-lg font-medium">{m.v}</div>
          </div>
        ))}
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-medium mb-3">자체 지표 4종</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "모멘텀", sc: s.momentum, c: "bg-blue-500" },
            { l: "자금흐름", sc: s.flow, c: "bg-green-500" },
            { l: "밸류", sc: s.value, c: "bg-cyan-500" },
            { l: "변동성조정", sc: s.vol, c: "bg-orange-500" },
          ].map((x) => (
            <div key={x.l}>
              <div className="text-xs text-gray-600 mb-1">{x.l}</div>
              <div className="text-lg font-semibold">{x.sc.toFixed(0)}</div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                <div className={"h-full " + x.c} style={{ width: `${x.sc}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-blue-50 rounded-md">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <strong className="text-sm text-blue-900">종합 점수: {composite}/100</strong>
            <span className="text-[10px] text-blue-600 uppercase tracking-wider">탐색 우선순위</span>
          </div>
          <div className="text-xs text-blue-800 leading-relaxed">왜 {composite}점? — {reason}</div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-medium mb-2">소속 테마 {s.themes.length}</div>
        <div className="flex gap-1.5 flex-wrap">
          {s.themes.map((t, i) => (
            <span key={t} className={"text-[11px] px-2 py-1 rounded-md font-medium " + (i === 0 ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700")}>{t}</span>
          ))}
        </div>
      </section>

      <section><AiAnalysisCard ticker={s.ticker} /></section>
      <section><StockDisclosures ticker={s.ticker} /></section>
    </div>
  );
}