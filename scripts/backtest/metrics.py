"""자체 지표 4종 Python 버전 — TypeScript metrics.ts와 동일 산식.

운영에서는 매일 장 마감 후 이 함수들이 모든 종목에 대해 실행됨.
"""

from __future__ import annotations
import math
from dataclasses import dataclass
from typing import Sequence


@dataclass
class PriceSeries:
    closes: list[float]  # 오래된 → 최신 순


@dataclass
class FundamentalSnapshot:
    per: float | None
    pbr: float | None
    dividend_yield: float | None


@dataclass
class PeerStats:
    peer_per_avg: float
    peer_pbr_avg: float


@dataclass
class InvestorFlow:
    foreign_net_sum: float
    pension_net_sum: float
    market_cap: float


@dataclass
class StockMetricsResult:
    momentum: int
    flow: int
    value: int
    vol: int
    neglect: int
    composite: int


def _return_pct(closes: Sequence[float], lookback_days: int) -> float | None:
    if len(closes) < lookback_days + 1:
        return None
    recent = closes[-1]
    past = closes[-1 - lookback_days]
    if past <= 0:
        return None
    return (recent - past) / past


def _clip_normalize(x: float, lo: float, hi: float, invert: bool = False) -> int:
    clipped = max(lo, min(hi, x))
    ratio = (clipped - lo) / (hi - lo)
    score = 1 - ratio if invert else ratio
    return round(score * 100)


def momentum_score(prices: PriceSeries) -> int:
    r1 = _return_pct(prices.closes, 21)
    r3 = _return_pct(prices.closes, 63)
    r6 = _return_pct(prices.closes, 126)
    if None in (r1, r3, r6):
        return 50
    weighted = r1 * 0.4 + r3 * 0.3 + r6 * 0.3  # type: ignore
    return _clip_normalize(weighted, -0.5, 0.5)


def flow_score(flow: InvestorFlow) -> int:
    if flow.market_cap <= 0:
        return 50
    ratio = (flow.foreign_net_sum + flow.pension_net_sum) / flow.market_cap
    return _clip_normalize(ratio, -0.01, 0.01)


def value_score(fund: FundamentalSnapshot, peer: PeerStats) -> int:
    parts: list[int] = []
    if fund.per and fund.per > 0 and peer.peer_per_avg > 0:
        parts.append(_clip_normalize(fund.per / peer.peer_per_avg, 0.4, 1.6, invert=True))
    if fund.pbr and fund.pbr > 0 and peer.peer_pbr_avg > 0:
        parts.append(_clip_normalize(fund.pbr / peer.peer_pbr_avg, 0.4, 1.6, invert=True))
    if not parts:
        return 50
    return round(sum(parts) / len(parts))


def vol_adjusted_score(prices: PriceSeries) -> int:
    closes = prices.closes[-126:]
    if len(closes) < 30:
        return 50
    daily = [(closes[i] - closes[i - 1]) / closes[i - 1] for i in range(1, len(closes))]
    mean = sum(daily) / len(daily)
    var = sum((x - mean) ** 2 for x in daily) / len(daily)
    std = math.sqrt(var)
    if std == 0:
        return 50
    sharpe_like = mean / std
    return _clip_normalize(sharpe_like, -0.1, 0.1)


def neglect_score(prices: PriceSeries) -> int:
    closes = prices.closes[-252:]
    if not closes:
        return 50
    high = max(closes)
    last = closes[-1]
    if high <= 0:
        return 50
    drop = (high - last) / high
    return _clip_normalize(drop, 0, 0.5)


def composite_score(momentum: int, flow: int, value: int, vol: int,
                     w_momentum: float = 0.25, w_flow: float = 0.25,
                     w_value: float = 0.30, w_vol: float = 0.20) -> int:
    return round(momentum * w_momentum + flow * w_flow + value * w_value + vol * w_vol)


def compute_stock_metrics(prices: PriceSeries, fund: FundamentalSnapshot,
                          peer: PeerStats, flow: InvestorFlow) -> StockMetricsResult:
    m = momentum_score(prices)
    f = flow_score(flow)
    v = value_score(fund, peer)
    vo = vol_adjusted_score(prices)
    n = neglect_score(prices)
    c = composite_score(m, f, v, vo)
    return StockMetricsResult(momentum=m, flow=f, value=v, vol=vo, neglect=n, composite=c)
