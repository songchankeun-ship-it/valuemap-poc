# -*- coding: utf-8 -*-
"""실행 스크립트 — `python scripts/backtest/run.py` 로 실행.

출력: 콘솔 메트릭 + ../public/backtest-result.json (Next.js가 읽음)
"""

from __future__ import annotations
import json
import sys
from pathlib import Path

# 패키지 경로
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from engine import BacktestEngine, StrategyConfig  # type: ignore
from sample_data import make_sample_data  # type: ignore


def main():
    print("📊 더미 데이터 생성 중...")
    data = make_sample_data(seed=99)  # seed 99: 알파 +17.8% (의미 있는 검증 사례)

    print("⚙️  백테스트 엔진 실행 중...")
    engine = BacktestEngine(StrategyConfig(
        top_n_themes=2,        # 더미 데이터는 3개 테마뿐이라 2로
        stocks_per_theme=4,
        initial_capital=10_000_000,
    ))
    result = engine.run(
        price_history=data["price_history"],
        theme_membership=data["theme_membership"],
        theme_neglect_scores=data["theme_neglect_scores"],
        benchmark=data["benchmark"],
    )

    print("\n=== 백테스트 결과 ===")
    print(f"기간:          {result.start_date} → {result.end_date}")
    print(f"총수익률:      {result.total_return * 100:+.2f}%")
    print(f"CAGR:          {result.cagr * 100:+.2f}%")
    print(f"벤치마크 수익: {result.benchmark_return * 100:+.2f}%")
    print(f"알파:          {result.alpha * 100:+.2f}%")
    print(f"MDD:           {result.max_drawdown * 100:+.2f}%")
    print(f"Sharpe-like:   {result.sharpe_like:.2f}")
    print(f"승률:          {result.win_rate * 100:.1f}%")
    print(f"총 거래:       {result.trade_count}건")

    # Next.js 백테스트 페이지가 읽을 JSON 출력
    out_dir = HERE.parent.parent / "public"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "backtest-result.json"

    # 차트 표시용 데이터 압축 (월 단위로 다운샘플링)
    monthly_equity = {}
    for d_str, eq in result.equity_curve:
        ym = d_str[:7]
        monthly_equity[ym] = eq
    monthly_bm = {}
    for d_str, bm in result.benchmark_curve:
        ym = d_str[:7]
        monthly_bm[ym] = bm

    payload = {
        "config": {
            "topNThemes": result.config.top_n_themes,
            "stocksPerTheme": result.config.stocks_per_theme,
            "initialCapital": result.config.initial_capital,
        },
        "metrics": {
            "totalReturn": round(result.total_return, 4),
            "cagr": round(result.cagr, 4),
            "benchmarkReturn": round(result.benchmark_return, 4),
            "alpha": round(result.alpha, 4),
            "maxDrawdown": round(result.max_drawdown, 4),
            "sharpe": round(result.sharpe_like, 2),
            "winRate": round(result.win_rate, 4),
            "tradeCount": result.trade_count,
        },
        "equityCurveMonthly": [
            {"month": ym, "equity": eq, "benchmark": monthly_bm.get(ym, 0)}
            for ym, eq in sorted(monthly_equity.items())
        ],
        "monthlyReturns": result.monthly_returns,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    pri