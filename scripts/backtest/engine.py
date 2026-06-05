"""백테스트 엔진 — 저평가 테마 Top N 분산 전략.

전략 로직:
1. 매월 첫 영업일에 리밸런싱
2. 그 시점의 '소외 점수(neglect_score) Top N' 테마 선정
3. 각 테마 안 종목들에 동등 가중으로 분산투자
4. 한 달 보유 후 다시 리밸런싱

가정:
- 거래 수수료 0.15%
- 슬리피지 0.05%
- 배당 재투자 가정
- 매수/매도 모두 종가 기준

입력: stocks_df (DataFrame: date, ticker, close, theme_id)
출력: BacktestResult (equity curve, monthly returns, metrics)
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, timedelta
from collections import defaultdict
from typing import Iterable
import math
import statistics


@dataclass
class StrategyConfig:
    top_n_themes: int = 5            # 저평가 테마 몇 개를 고를지
    stocks_per_theme: int = 4         # 테마당 종목 수
    initial_capital: float = 10_000_000  # 초기 자본 (원)
    commission_pct: float = 0.0015    # 수수료 0.15%
    slippage_pct: float = 0.0005      # 슬리피지 0.05%
    rebalance_freq: str = "monthly"   # monthly / weekly


@dataclass
class Trade:
    trade_date: date
    ticker: str
    side: str  # 'buy' / 'sell'
    quantity: int
    price: float
    cost: float  # 수수료 + 슬리피지


@dataclass
class DailySnapshot:
    snap_date: date
    equity: float
    cash: float
    positions: dict[str, int]  # ticker -> 보유 수량


@dataclass
class BacktestResult:
    config: StrategyConfig
    start_date: date
    end_date: date
    equity_curve: list[tuple[str, float]]      # [(YYYY-MM-DD, equity), ...]
    benchmark_curve: list[tuple[str, float]]    # 코스피
    monthly_returns: dict[str, float]            # {"2024-01": 0.023}
    trades: list[Trade] = field(default_factory=list)
    # 메트릭 ↓
    total_return: float = 0
    cagr: float = 0
    benchmark_return: float = 0
    alpha: float = 0
    max_drawdown: float = 0
    sharpe_like: float = 0
    win_rate: float = 0
    trade_count: int = 0


class BacktestEngine:
    """초경량 백테스트 엔진. pandas 의존성 없음 (PoC 단순화)."""

    def __init__(self, config: StrategyConfig):
        self.config = config

    def run(self,
             price_history: dict[date, dict[str, float]],
             theme_membership: dict[int, list[str]],
             theme_neglect_scores: dict[date, dict[int, int]],
             benchmark: dict[date, float]) -> BacktestResult:
        """price_history[date][ticker] = close.
        theme_membership[theme_id] = [ticker, ...]
        theme_neglect_scores[date][theme_id] = neglect_score
        benchmark[date] = 코스피 종가
        """
        dates = sorted(price_history.keys())
        start, end = dates[0], dates[-1]

        cash = self.config.initial_capital
        positions: dict[str, int] = defaultdict(int)
        equity_curve: list[tuple[str, float]] = []
        benchmark_curve: list[tuple[str, float]] = []
        trades: list[Trade] = []
        prev_month = None
        first_benchmark = benchmark[start]

        for d in dates:
            prices_today = price_history[d]
            # 보유 종목 가치
            holdings_value = sum(positions[t] * prices_today.get(t, 0) for t in positions)
            equity = cash + holdings_value

            # 매달 첫 거래일에 리밸런싱
            current_month = (d.year, d.month)
            if current_month != prev_month:
                # 이번 달 첫 거래일
                if d in theme_neglect_scores:
                    target = self._select_targets(theme_neglect_scores[d], theme_membership)
                    cash, trades_made = self._rebalance(
                        target, positions, cash, prices_today, d
                    )
                    trades.extend(trades_made)
                prev_month = current_month

            holdings_value = sum(positions[t] * prices_today.get(t, 0) for t in positions)
            equity = cash + holdings_value
            equity_curve.append((d.isoformat(), round(equity, 2)))
            benchmark_curve.append((d.isoformat(), round(benchmark[d], 4)))

        result = BacktestResult(
            config=self.config,
            start_date=start,
            end_date=end,
            equity_curve=equity_curve,
            benchmark_curve=benchmark_curve,
            monthly_returns={},
            trades=trades,
            trade_count=len(trades),
        )
        self._compute_metrics(result, first_benchmark, benchmark[end])
        return result

    def _select_targets(self,
                         neglect_today: dict[int, int],
                         theme_membership: dict[int, list[str]]) -> list[str]:
        # 소외 점수 높은 테마 Top N
        sorted_themes = sorted(neglect_today.items(), key=lambda x: -x[1])
        top_themes = [tid for tid, _ in sorted_themes[: self.config.top_n_themes]]
        # 각 테마에서 stocks_per_theme개 종목 (이 PoC에선 단순히 첫 N개)
        targets: list[str] = []
        for tid in top_themes:
            tickers = theme_membership.get(tid, [])
            targets.extend(tickers[: self.config.stocks_per_theme])
        return targets

    def _rebalance(self,
                    targets: list[str],
                    positions: dict[str, int],
                    cash: float,
                    prices: dict[str, float],
                    trade_date: date) -> tuple[float, list[Trade]]:
        trades: list[Trade] = []
        total_equity = cash + sum(positions[t] * prices.get(t, 0) for t in positions)

        # 매도 (현재 보유 중 target에 없는 것)
        for ticker, qty in list(positions.items()):
            if qty == 0:
                continue
            if ticker not in targets:
                px = prices.get(ticker)
                if px:
                    proceeds = qty * px * (1 - self.config.commission_pct - self.config.slippage_pct)
                    cash += proceeds
                    trades.append(Trade(
                        trade_date=trade_date, ticker=ticker, side="sell",
                        quantity=qty, price=px,
                        cost=qty * px * (self.config.commission_pct + self.config.slippage_pct),
                    ))
                    positions[ticker] = 0

        # 매수 (동등 가중)
        if targets:
            allocation = total_equity / len(targets)
            for ticker in targets:
                px = prices.get(ticker)
                if not px or px <= 0:
                    continue
                current_qty = positions[ticker]
                target_qty = int(allocation / px)
                diff = target_qty - current_qty
                if diff > 0:
                    cost_per_share = px * (1 + self.config.commission_pct + self.config.slippage_pct)
                    affordable = int(cash / cost_per_share)
                    actual = min(diff, affordable)
                    if actual > 0:
                        cash -= actual * cost_per_share
                        positions[ticker] += actual
                        trades.append(Trade(
                            trade_date=trade_date, ticker=ticker, side="buy",
                            quantity=actual, price=px,
                            cost=actual * px * (self.config.commission_pct + self.config.slippage_pct),
                        ))

        return cash, trades

    def _compute_metrics(self, result: BacktestResult,
                          first_benchmark: float, last_benchmark: float) -> None:
        eq = result.equity_curve
        if not eq:
            return
        start_eq = self.config.initial_capital
        end_eq = eq[-1][1]
        years = (result.end_date - result.start_date).days / 365.25

        result.total_return = (end_eq / start_eq - 1)
        result.cagr = (end_eq / start_eq) ** (1 / max(years, 0.01)) - 1
        result.benchmark_return = (last_benchmark / first_benchmark - 1)
        result.alpha = result.cagr - ((last_benchmark / first_benchmark) ** (1 / max(years, 0.01)) - 1)

        # MDD
        peak = eq[0][1]
        mdd = 0.0
        for _, v in eq:
            peak = max(peak, v)
            dd = (v - peak) / peak if peak else 0
            mdd = min(mdd, dd)
        result.max_drawdown = mdd

        # 월별 수익률 + 승률 + Sharpe-like
        monthly: dict[str, float] = {}
        month_starts: dict[str, float] = {}
        for date_str, v in eq:
            ym = date_str[:7]
            if ym not in month_starts:
                month_starts[ym] = v
            monthly[ym] = (v / month_starts[ym]) - 1
        result.monthly_returns = {k: round(v, 4) for k, v in monthly.items()}

        rets = [v for v in monthly.values()]
        if rets:
            mean_r = statistics.mean(rets)
            std_r = statistics.pstdev(rets) if len(rets) > 1 else 0
            result.sharpe_like = round((mean_r / std_r * math.sqrt(12)) if std_r else 0, 2)
            wins = sum(1 for r in rets if r > 0)
            result.win_rate = wins / len(rets)
