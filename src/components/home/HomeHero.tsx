import Link from "next/link";

interface HomeHeroProps {
  dataAsOf: string;
  dataStale: boolean;
  totalCount: number;
  strongCount: number;
  volumeSpikeCount: number;
  signalCount: number;
  upCount: number;
  downCount: number;
}

// 홈 히어로 — 첫 3초 안에 가치를 전달한다. 좌측 카피+CTA, 우측 미니 대시보드.
export function HomeHero({
  dataAsOf,
  dataStale,
  totalCount,
  strongCount,
  volumeSpikeCount,
  signalCount,
  upCount,
  downCount,
}: HomeHeroProps) {
  const mini = [
    { label: "종합점수 80+", value: `${strongCount}개` },
    { label: "거래활성도 급증", value: `${volumeSpikeCount}개` },
    { label: "최근 공시 신호", value: `${signalCount}건` },
    { label: "상승 / 하락", value: `${upCount} / ${downCount}` },
  ];
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-zinc-200 dark:border-zinc-800 p-5 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6 items-center">
        {/* 좌측 — 카피 + CTA */}
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center text-[10px] font-semibold tracking-wide text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full bg-white/70 dark:bg-zinc-900/60">
              오른스코어 · 베타
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span className={"w-1.5 h-1.5 rounded-full " + (dataStale ? "bg-amber-500" : "bg-green-500")} />
              <span className="tabular-nums">데이터 기준 {dataAsOf} 장마감</span>
              {dataStale ? <span className="font-medium text-amber-600 dark:text-amber-500">· 갱신 지연</span> : <span className="text-green-600 dark:text-green-500">· 정상</span>}
            </span>
          </div>
          <h1 className="text-[23px] leading-tight md:text-[34px] md:leading-[1.15] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            오늘 볼 종목,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">{totalCount}개에서 5개</span>로 줄이세요.
          </h1>
          <p className="text-[13px] md:text-[15px] text-zinc-600 dark:text-zinc-300 mt-3 max-w-xl leading-relaxed">
            추세 · 거래량 · 밸류 · 위험을 한 번에 분석해 오늘 먼저 확인할 후보를 정리합니다. 오른스코어는 매수 추천이 아니라 종목 탐색 시간을 줄이는 데이터 도구입니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <a href="#today-candidates" className="text-center px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm">
              오늘의 후보 보기 →
            </a>
            <Link prefetch={false} href="/stocks" className="text-center px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition">
              종목 직접 찾기
            </Link>
          </div>
          <Link prefetch={false} href="/guide/metrics" className="inline-block text-[12px] text-blue-700 dark:text-blue-400 hover:underline mt-3">
            지표 계산 방식 보기 →
          </Link>
        </div>

        {/* 우측 — 미니 대시보드 */}
        <div className="rounded-xl bg-white/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 p-4 md:p-5 shadow-sm">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-3">오늘의 데이터 요약</div>
          <dl className="grid grid-cols-2 gap-2.5">
            {mini.map((m) => (
              <div key={m.label} className="rounded-lg bg-zinc-50 dark:bg-zinc-950/50 p-3">
                <dt className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">{m.label}</dt>
                <dd className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums mt-1 leading-none">{m.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3">영업일 장마감 후 자동 갱신 · KRX · Naver · yfinance · DART</p>
        </div>
      </div>
    </section>
  );
}
