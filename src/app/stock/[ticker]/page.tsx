import { notFound } from "next/navigation";
import Link from "next/link";
import { getStockByTicker } from "@/lib/mockData";
import { AiAnalysisCard } from "@/components/AiAnalysisCard";
import { StockDisclosures } from "@/components/StockDisclosures";
import { AddToCompareButton } from "@/components/AddToCompareButton";
import { AddToWatchlistButton } from "@/components/AddToWatchlistButton";
import { RecentViewTracker } from "@/components/RecentViewTracker";

interface PageProps { params: Promise<{ ticker: string }>; }

export async function generateMetadata({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) return { title: "종목을 찾을 수 없습니다" };
  return {
    title: s.name + " (" + ticker + ") 분석 — 밸류맵",
    description: s.name + "의 자체 지표 4종, 재무, AI 분석을 한 화면에서.",
  };
}

interface ReasonV2 {
  strengths: { metric: string; score: number }[];
  cautions: { metric: string; score: number }[];
  interpretation: string;
}

function composeReasonV2(m: number, f: number, v: number, vo: number): ReasonV2 {
  const metrics = [
    { metric: "모멘텀", score: m },
    { metric: "자금흐름", score: f },
    { metric: "밸류", score: v },
    { metric: "변동성조정", score: vo },
  ];
  const strengths = metrics.filter(x => x.score >= 70).map(x => ({ metric: x.metric, score: x.score }));
  const cautions = metrics.filter(x => x.score < 50).map(x => ({ metric: x.metric, score: x.score }));

  let interpretation = "";
  if (strengths.length === 0 && cautions.length === 0) {
    interpretation = "네 지표 모두 중간대 — 두드러진 신호 없음";
  } else if (strengths.length === 4) {
    interpretation = "네 지표 모두 우호적인 상태입니다. 시장 전반 변동성도 함께 고려 권장.";
  } else if (strengths.length > 0 && cautions.length === 0) {
    const sNames = strengths.map(s => s.metric).join("·");
    interpretation = sNames + " 지표가 우호적이고 나머지는 중립권입니다.";
  } else if (strengths.length > 0 && cautions.length > 0) {
    const sNames = strengths.map(s => s.metric).join("·");
    const cNames = cautions.map(c => c.metric).join("·");
    interpretation = sNames + "는 강하지만 " + cNames + "는 약한 상태입니다.";
  } else {
    interpretation = "전반적으로 중립~약세 흐름. 추가 분석 권장.";
  }
  return { strengths, cautions, interpretation };
}

export default async function StockDetailPage({ params }: PageProps) {
  const { ticker } = await params;
  const s = getStockByTicker(ticker);
  if (!s) notFound();
  const composite = Math.round((s.momentum + s.flow + s.value + s.vol) / 4);
  const reason = composeReasonV2(s.momentum, s.flow, s.value, s.vol);

  return (
    <div className="space-y-4">
      <RecentViewTracker ticker={s.ticker} name={s.name} />

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
        <div className="flex items-center gap-2 flex-wrap">
          <AddToWatchlistButton ticker={s.ticker} name={s.name} />
          <AddToCompareButton ticker={s.ticker} name={s.name} />
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { l: "PER", v: s.per.toFixed(1) + "x" },
          { l: "PBR", v: s.pbr.toFixed(2) + "x" },
          { l: "ROE", v: s.roe.toFixed(1) + "%" },
          { l: "배당수익률", v: s.dividendYield.toFixed(2) + "%" },
        ].map((m) => (
          <div key={m.l} className="bg-gray-50 rounded-md p-3">
            <div className="text-[11px] text-gray-500 mb-0.5">{m.l}</div>
            <div className="text-lg font-medium tabular-nums">{m.v}</div>
          </div>
        ))}
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-sm font-medium">자체 지표 4종</div>
          <Link href="/guide/metrics" className="text-[10px] text-blue-600 hover:underline">지표 가이드 →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "모멘텀", sc: s.momentum, c: "bg-blue-500", anchor: "momentum" },
            { l: "자금흐름", sc: s.flow, c: "bg-green-500", anchor: "flow" },
            { l: "밸류", sc: s.value, c: "bg-cyan-500", anchor: "value" },
            { l: "변동성조정", sc: s.vol, c: "bg-orange-500", anchor: "vol" },
          ].map((x) => (
            <Link key={x.l} href={"/guide/metrics#" + x.anchor} className="block hover:bg-zinc-50 -mx-1 px-1 py-1 rounded transition">
              <div className="text-xs text-gray-600 mb-1">{x.l}</div>
              <div className="text-lg font-semibold tabular-nums">{x.sc.toFixed(0)}</div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                <div className={"h-full " + x.c} style={{ width: x.sc + "%" }} />
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-3 p-3 bg-blue-50 rounded-md">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <strong className="text-sm text-blue-900 tabular-nums">종합 점수: {composite}/100</strong>
            <span className="text-[10px] text-blue-600 uppercase tracking-wider">탐색 우선순위</span>
          </div>
          <div className="text-xs text-blue-900 mb-1.5 font-medium">왜 {composite}점?</div>
          {reason.strengths.length > 0 ? (
            <div className="text-xs text-emerald-800 mb-1 flex items-start gap-2">
              <span className="font-semibold shrink-0">강점:</span>
              <span className="tabular-nums">{reason.strengths.map(s => s.metric + " " + s.score).join(", ")}</span>
            </div>
          ) : null}
          {reason.cautions.length > 0 ? (
            <div className="text-xs text-amber-800 mb-1 flex items-start gap-2">
              <span className="font-semibold shrink-0">주의:</span>
              <span className="tabular-nums">{reason.cautions.map(c => c.metric + " " + c.score).join(", ")}</span>
            </div>
          ) : null}
          <div className="text-xs text-blue-800 leading-relaxed mt-1.5 pt-1.5 border-t border-blue-100">
            {reason.interpretation}
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-medium mb-2">소속 테마 {s.themes.length}</div>
        <div className="flex gap-1.5 flex-wrap">
          {s.themes.map((t, i) => (
            <Link
              key={t}
              href={"/stocks?theme=" + encodeURIComponent(t)}
              className={"text-[11px] px-2 py-1 rounded-md font-medium hover:opacity-80 transition " + (i === 0 ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700")}
            >
              {t}
            </Link>
          ))}
        </div>
      </section>

      <section><AiAnalysisCard ticker={s.ticker} /></section>
      <section><StockDisclosures ticker={s.ticker} /></section>
    </div>
  );
}