/**
 * 월별 수익률 히트맵 (설계서 §11.3). 순수 CSS/HTML 그리드 — 외부 차트 라이브러리 없음.
 * 행=연도, 열=월(01~12). 셀 색은 수익률 크기에 따라 한국식 등락 색(상승=빨강 계열·하락=파랑 계열·0=중립).
 * 모든 색 클래스는 정적 리터럴(런타임 합성 0 → Tailwind purge 누락 회피).
 * 12열이 390px를 깨지 않도록 overflow-x-auto + min-w로 가로 스크롤 처리.
 */

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

// 수익률(소수) → 정적 배경/글자색 리터럴. 상승=red, 하락=blue, 0/무포지션=zinc.
function heatClass(v: number): string {
  if (v >= 0.15) return "bg-red-600 text-white dark:bg-red-600";
  if (v >= 0.08) return "bg-red-500 text-white dark:bg-red-500";
  if (v >= 0.03) return "bg-red-400 text-red-950 dark:bg-red-500/80 dark:text-white";
  if (v > 0) return "bg-red-200 text-red-900 dark:bg-red-400/40 dark:text-red-100";
  if (v === 0) return "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500";
  if (v > -0.03) return "bg-blue-200 text-blue-900 dark:bg-blue-400/40 dark:text-blue-100";
  if (v > -0.08) return "bg-blue-400 text-blue-950 dark:bg-blue-500/80 dark:text-white";
  if (v > -0.15) return "bg-blue-500 text-white dark:bg-blue-500";
  return "bg-blue-600 text-white dark:bg-blue-600";
}

function fmtPct(v: number) {
  return (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
}

export function MonthlyHeatmap({ monthlyReturns }: { monthlyReturns: Record<string, number> }) {
  const keys = Object.keys(monthlyReturns);
  if (keys.length === 0) return null;

  const years = Array.from(new Set(keys.map((k) => k.slice(0, 4)))).sort();

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">월별 수익률 히트맵</h3>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
        연도(행) × 월(열) 격자. <span className="text-red-600 dark:text-red-400">붉을수록 상승</span> · <span className="text-blue-600 dark:text-blue-400">푸를수록 하락</span> · 회색은 0%/미보유. 빈 칸은 데이터 없음.
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[2.5rem_repeat(12,minmax(0,1fr))] gap-0.5">
            <div aria-hidden="true" />
            {MONTHS.map((mm) => (
              <div key={mm} className="text-center text-[9px] text-zinc-400 dark:text-zinc-500 tabular-nums pb-0.5">
                {mm}
              </div>
            ))}
            {years.map((y) => (
              <div key={y} className="contents">
                <div className="flex items-center text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums pr-1">
                  {y}
                </div>
                {MONTHS.map((mm) => {
                  const key = `${y}-${mm}`;
                  const has = Object.prototype.hasOwnProperty.call(monthlyReturns, key);
                  if (!has) {
                    return (
                      <div
                        key={key}
                        className="h-7 rounded-sm border border-dashed border-zinc-200 dark:border-zinc-800"
                        aria-hidden="true"
                      />
                    );
                  }
                  const v = monthlyReturns[key];
                  return (
                    <div
                      key={key}
                      title={`${y}년 ${mm}월 ${fmtPct(v)}`}
                      aria-label={`${y}년 ${mm}월 수익률 ${fmtPct(v)}`}
                      className={"h-7 rounded-sm flex items-center justify-center text-[8px] font-medium tabular-nums leading-none " + heatClass(v)}
                    >
                      {v === 0 ? "·" : (v * 100).toFixed(0)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
