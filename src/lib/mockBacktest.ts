// Python 백테스트 엔진이 아직 실행되지 않았을 때의 폴백
// 실제 데이터는 public/backtest-result.json 에서 로드됨

export interface BacktestResult {
  config: {
    topNThemes: number;
    stocksPerTheme: number;
    initialCapital: number;
  };
  metrics: {
    totalReturn: number;
    cagr: number;
    benchmarkReturn: number;
    alpha: number;
    maxDrawdown: number;
    sharpe: number;
    winRate: number;
    tradeCount: number;
  };
  equityCurveMonthly: { month: string; equity: number; benchmark: number }[];
  monthlyReturns: Record<string, number>;
}

// 와이어프레임용 더미값 — 실 데이터로 교체되기 전 페이지가 깨지지 않게.
export const mockBacktest: BacktestResult = {
  config: { topNThemes: 5, stocksPerTheme: 4, initialCapital: 10_000_000 },
  metrics: {
    totalReturn: 1.85,
    cagr: 0.234,
    benchmarkReturn: 0.42,
    alpha: 0.165,
    maxDrawdown: -0.187,
    sharpe: 1.42,
    winRate: 0.633,
    tradeCount: 298,
  },
  equityCurveMonthly: generateMockCurve(),
  monthlyReturns: generateMockMonthlyReturns(),
};

function generateMockCurve() {
  const points: { month: string; equity: number; benchmark: number }[] = [];
  let eq = 10_000_000;
  let bm = 3000;
  for (let y = 2021; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2021 && m < 5) continue;
      if (y === 2026 && m > 5) break;
      const eqRet = 0.018 + (Math.sin((y * 12 + m) * 0.7) * 0.02);
      const bmRet = 0.006 + (Math.cos((y * 12 + m) * 0.5) * 0.01);
      eq *= 1 + eqRet;
      bm *= 1 + bmRet;
      points.push({
        month: `${y}-${String(m).padStart(2, "0")}`,
        equity: Math.round(eq),
        benchmark: Math.round(bm * 100) / 100,
      });
    }
  }
  return points;
}

function generateMockMonthlyReturns() {
  const out: Record<string, number> = {};
  for (let y = 2021; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2021 && m < 5) continue;
      if (y === 2026 && m > 5) break;
      out[`${y}-${String(m).padStart(2, "0")}`] = 0.018 + Math.sin((y * 12 + m) * 0.7) * 0.04;
    }
  }
  return out;
}
