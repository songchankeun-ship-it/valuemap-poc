import Link from "next/link";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { MetricChip } from "@/components/ui/MetricChip";
import type { StockCandidate } from "./StockCandidateCard";

interface HomeHeroProps {
  dataAsOf: string;
  dataStale: boolean;
  totalCount: number;
  strongCount: number;
  volumeSpikeCount: number;
  signalCount: number;
  /** 미리보기 카드에 띄울 상위 후보(최대 3). */
  previewCandidates: StockCandidate[];
}

// 홈 히어로 — 첫 화면에서 '점수 기반 한국 주식 탐색 대시보드'임을 즉시 전달한다.
// 좌측 카피+CTA, 우측 실제 서비스 느낌의 대시보드 미리보기 카드.
export function HomeHero({
  dataAsOf,
  dataStale,
  totalCount,
  strongCount,
  volumeSpikeCount,
  signalCount,
  previewCandidates,
}: HomeHeroProps) {
  const lead = previewCandidates[0];
  const rest = previewCandidates.slice(1, 3);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-zinc-900 dark:to-blue-950/30 border border-zinc-200 dark:border-zinc-800 p-5 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-[52%_48%] gap-6 items-center">
        {/* 좌측 — 카피 + CTA */}
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center text-[10px] font-semibold tracking-wide text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full bg-white/70 dark:bg-zinc-900/60 border border-blue-100 dark:border-blue-900/50">
              오른스코어 · 베타
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span className={"w-1.5 h-1.5 rounded-full " + (dataStale ? "bg-orange-500" : "bg-emerald-500")} />
              <span className="tabular-nums">데이터 기준 {dataAsOf} 장마감</span>
              {dataStale ? <span className="font-medium text-orange-600 dark:text-orange-400">· 갱신 지연</span> : <span className="text-emerald-600 dark:text-emerald-400">· 정상</span>}
            </span>
          </div>
          <h1 className="text-[23px] leading-tight md:text-[34px] md:leading-[1.15] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            오늘 볼 한국 주식,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">점수로 먼저</span> 좁혀보세요.
          </h1>
          <p className="text-[13px] md:text-[15px] text-zinc-600 dark:text-zinc-300 mt-3 max-w-xl leading-relaxed">
            추세 · 거래활성도 · 밸류 · 위험조정 · 공시 신호를 한 화면에 정리해, 오늘 먼저 확인할 탐색 우선순위를 보여주는 데이터 도구입니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <a href="#today-candidates" className="text-center px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm">
              오늘 후보 보기 →
            </a>
            <Link prefetch={false} href="/guide/metrics" className="text-center px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition">
              지표 이해하기
            </Link>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-3">
            오른스코어는 투자 추천이 아닌 데이터 기반 탐색 도구입니다.{" "}
            <Link prefetch={false} href="/stocks" className="text-blue-700 dark:text-blue-400 hover:underline">종목 직접 찾기 →</Link>
          </p>
        </div>

        {/* 우측 — 대시보드 미리보기 카드 */}
        <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">오늘의 탐색 후보</div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">종합점수 상위 · 검증 보류 제외</span>
          </div>

          {lead ? (
            <>
              {/* 1순위 — 큰 게이지 + 강점 칩 */}
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 p-3">
                <ScoreGauge score={lead.score} size={80} showOutOf />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold shrink-0 tabular-nums">1</span>
                    <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{lead.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{lead.sector} · {lead.ticker}</div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {lead.metrics.map((m) => (
                      <MetricChip key={m} label={m.replace(/\s*\d+$/, "")} value={m.match(/\d+$/)?.[0] ?? ""} tone="strong" />
                    ))}
                  </div>
                </div>
              </div>

              {/* 2~3순위 — 컴팩트 행 */}
              {rest.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {rest.map((c) => (
                    <li key={c.ticker} className="flex items-center gap-2 rounded-lg px-2.5 py-2 bg-slate-50/70 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold shrink-0 tabular-nums">{c.rank}</span>
                      <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate flex-1">{c.name}</span>
                      <ScoreBadge score={c.score} showLabel={false} size="sm" />
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-5 text-center text-[12px] text-zinc-500 dark:text-zinc-400">
              후보 데이터를 준비 중입니다.
            </div>
          )}

          {/* 요약 라인 */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/50 py-2">
              <div className="text-[15px] font-bold text-blue-700 dark:text-blue-400 tabular-nums leading-none">{strongCount}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">종합 80↑</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/50 py-2">
              <div className="text-[15px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums leading-none">{volumeSpikeCount}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">거래 급증</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-zinc-950/50 py-2">
              <div className="text-[15px] font-bold text-amber-700 dark:text-amber-400 tabular-nums leading-none">{signalCount}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">공시 신호</div>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2.5">분석 종목 {totalCount}개 · 영업일 장마감 후 자동 갱신 · KRX · Naver · DART</p>
        </div>
      </div>
    </section>
  );
}
