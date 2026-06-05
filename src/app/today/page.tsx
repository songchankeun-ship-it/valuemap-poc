// /today — 오늘의 시장 한 화면
import Link from "next/link";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  getAllStocks,
  mockMarketIndices,
  mockInsight,
} from "@/lib/mockData";

async function loadInsight() {
  try {
    const path = join(process.cwd(), "public", "daily-insights", "latest.json");
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    return {
      dateKST: data.dateKST as string,
      source: data.source as string,
      headline: data.insight.headline as string,
      summary: data.insight.summary as string,
      tags: data.insight.highlightedThemes as string[],
      watchPoints: (data.insight.watchPoints ?? []) as string[],
    };
  } catch {
    return {
      dateKST: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }),
      source: "fallback",
      headline: mockInsight.title,
      summary: mockInsight.body,
      tags: mockInsight.tags,
      watchPoints: [] as string[],
    };
  }
}

export const revalidate = 600;

export const metadata = {
  title: "오늘 — 밸류맵",
  description: "오늘의 시장 요약. 지수, 자금흐름, 추세 종목, 시그널 핫리스트.",
};

export default async function TodayPage() {
  const insight = await loadInsight();
  const allStocks = getAllStocks();

  // 오늘의 상승 Top 5 (changePct 기준)
  const topRisers = [...allStocks]
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 5);

  // 자금흐름 Top 5 (flow 기준)
  const topFlow = [...allStocks]
    .sort((a, b) => b.flow - a.flow)
    .slice(0, 5);

  // 소외 Top 5 (neglectScore 기준)
  const topNeglected = [...allStocks]
    .sort((a, b) => b.neglectScore - a.neglectScore)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <nav className="text-xs text-zinc-500 flex items-center gap-1">
        <Link href="/" className="hover:text-zinc-700">홈</Link>
        <span>›</span>
        <span className="text-zinc-900">오늘</span>
      </nav>

      {/* HERO */}
      <header className="bg-gradient-to-br from-zinc-50 to-white border border-zinc-200 rounded-xl p-6">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">TODAY · KST</span>
          <span className="text-xs text-zinc-500 tabular-nums">{insight.dateKST}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">{insight.headline}</h1>
        <p className="text-sm text-zinc-600 mt-3 leading-relaxed max-w-2xl">{insight.summary}</p>
        <div className="flex gap-1.5 flex-wrap mt-4">
          {insight.tags.map((tag) => (
            <Link key={tag} href={`/stocks?theme=${encodeURIComponent(tag)}`} className="text-[11px] px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full hover:bg-brand-100 transition font-medium">
              #{tag}
            </Link>
          ))}
        </div>
      </header>

      {/* 시세 바 */}
      <section className="grid grid-cols-3 gap-3 bg-white border border-zinc-200 rounded-xl p-4 shadow-soft">
        <MarketCell label="코스피" {...mockMarketIndices.kospi} />
        <MarketCell label="코스닥" {...mockMarketIndices.kosdaq} />
        <MarketCell label="USD/KRW" value={mockMarketIndices.usdkrw.value} changePct={mockMarketIndices.usdkrw.changePct} />
      </section>

      {/* 3-up 리스트 */}
      <div className="grid md:grid-cols-3 gap-4">
        <ListCard title="🔥 오늘 상승 Top 5" sub="changePct 기준" stocks={topRisers} valueKey="changePct" valueSuffix="%" />
        <ListCard title="💰 자금흐름 Top 5" sub="외국인+연기금" stocks={topFlow} valueKey="flow" valueSuffix="" />
        <ListCard title="🌙 소외 Top 5" sub="52주 고점 대비" stocks={topNeglected} valueKey="neglectScore" valueSuffix="" />
      </div>

      {/* Watch Points */}
      {insight.watchPoints.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-zinc-900">이번 주 주목 포인트</span>
          </div>
          <ul className="text-sm text-zinc-700 space-y-2.5">
            {insight.watchPoints.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-brand-400 font-bold shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick links */}
      <section className="grid md:grid-cols-2 gap-3">
        <Link href="/disclosures" className="block bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 hover:shadow-md transition group">
          <div className="text-xs font-semibold text-amber-600 mb-1 uppercase tracking-wide">SIGNALS</div>
          <div className="text-base font-semibold text-zinc-900 mb-1">오늘의 공시 시그널</div>
          <div className="text-xs text-zinc-500">자기주식·임원매수·대형계약·정정·증자 자동 추출 →</div>
        </Link>
        <Link href="/stocks" className="block bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 hover:shadow-md transition group">
          <div className="text-xs font-semibold text-brand-600 mb-1 uppercase tracking-wide">EXPLORE</div>
          <div className="text-base font-semibold text-zinc-900 mb-1">종목 전체 탐색</div>
          <div className="text-xs text-zinc-500">자체 지표 4종으로 16가지 정렬·필터 →</div>
        </Link>
      </section>
    </div>
  );
}

function MarketCell({ label, value, changePct }: { label: string; value: number; changePct: number }) {
  const isUp = changePct > 0;
  const isDown = changePct < 0;
  const color = isUp ? "text-red-600" : isDown ? "text-blue-600" : "text-zinc-500";
  const arrow = isUp ? "▲" : isDown ? "▼" : "—";
  return (
    <div className="text-center">
      <div className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-base font-semibold text-zinc-900 tabular-nums">{value.toLocaleString()}</div>
      <div className={`text-xs font-medium tabular-nums ${color}`}>{arrow} {Math.abs(changePct).toFixed(2)}%</div>
    </div>
  );
}

interface ListStock {
  ticker: string;
  name: string;
  changePct: number;
  flow: number;
  neglectScore: number;
}

function ListCard({ title, sub, stocks, valueKey, valueSuffix }: {
  title: string;
  sub: string;
  stocks: ListStock[];
  valueKey: "changePct" | "flow" | "neglectScore";
  valueSuffix: string;
}) {
  return (
    <section className="bg-white border border-zinc-200 rounded-xl p-4 shadow-soft">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">{title}</h3>
        <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>
      </div>
      <ul className="space-y-1">
        {stocks.map((s, i) => {
          const v = s[valueKey];
          const display = valueKey === "changePct" ? `${v > 0 ? "+" : ""}${v.toFixed(2)}` : Math.round(v);
          return (
            <li key={s.ticker}>
              <Link href={`/stock/${s.ticker}`} className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded hover:bg-zinc-50 transition">
                <span className="text-[10px] text-zinc-400 font-bold tabular-nums w-5">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs text-zinc-900 flex-1 truncate">{s.name}</span>
                <span className="text-xs font-semibold text-zinc-700 tabular-nums">{display}{valueSuffix}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
