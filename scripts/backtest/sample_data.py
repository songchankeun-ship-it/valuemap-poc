"""더미 가격·테마 데이터 생성기 — 백테스트 엔진 테스트용.

실제 운영에서는 KIS API + DART API에서 수집한 데이터로 교체.
이 모듈은 PoC 엔진이 실제로 돌아가는지 검증하기 위한 용도.
"""

from __future__ import annotations
from datetime import date, timedelta
import math
import random


def business_days(start: date, end: date) -> list[date]:
    """평일만 (간단히 토·일 제외)."""
    days = []
    d = start
    while d <= end:
        if d.weekday() < 5:
            days.append(d)
        d += timedelta(days=1)
    return days


def make_sample_data(seed: int = 42):
    """5년치 더미 데이터 생성.
    - 12개 종목, 3개 테마
    - 각 종목은 GBM (Geometric Brownian Motion)으로 가격 시뮬레이션
    - 테마별로 다른 평균 수익률·변동성
    """
    random.seed(seed)
    start = date(2021, 5, 28)
    end = date(2026, 5, 28)
    dates = business_days(start, end)

    # 12 종목 = 3 테마 × 4 종목
    tickers = [f"S{i:03d}" for i in range(12)]
    theme_membership = {
        1: tickers[0:4],   # 테마 1: 평균 수익률 높음
        2: tickers[4:8],   # 테마 2: 중간
        3: tickers[8:12],  # 테마 3: 낮음
    }
    theme_mu_sigma = {
        1: (0.0008, 0.025),   # 일일 평균 수익률 0.08% / 변동성 2.5%
        2: (0.0004, 0.02),
        3: (-0.0002, 0.022),
    }

    # GBM 시뮬레이션
    price_history: dict[date, dict[str, float]] = {}
    last_prices = {t: 10000.0 for t in tickers}
    for d in dates:
        prices_today: dict[str, float] = {}
        for theme_id, ticker_list in theme_membership.items():
            mu, sigma = theme_mu_sigma[theme_id]
            for t in ticker_list:
                # GBM step
                z = random.gauss(0, 1)
                drift = (mu - 0.5 * sigma ** 2)
                shock = sigma * z
                last_prices[t] *= math.exp(drift + shock)
                prices_today[t] = round(last_prices[t], 2)
        price_history[d] = prices_today

    # 테마 소외 점수 — 각 테마의 최근 6개월 가격 변동률 기반 (낮을수록 소외점수 높음)
    theme_neglect_scores: dict[date, dict[int, int]] = {}
    for i, d in enumerate(dates):
        if i < 126:
            continue
        scores: dict[int, int] = {}
        for theme_id, ticker_list in theme_membership.items():
            past_idx = i - 126
            past_avg = sum(price_history[dates[past_idx]][t] for t in ticker_list) / len(ticker_list)
            current_avg = sum(price_history[d][t] for t in ticker_list) / len(ticker_list)
            ret_6m = (current_avg - past_avg) / past_avg
            # -50% → 100점, 0% → 50점, +50% → 0점
            clipped = max(-0.5, min(0.5, ret_6m))
            score = round((0.5 - clipped) * 100)
            scores[theme_id] = score
        theme_neglect_scores[d] = scores

    # 벤치마크 (코스피 시뮬레이션 — 평균 수익률 낮음)
    benchmark: dict[date, float] = {}
    bm_price = 3000.0
    for d in dates:
        bm_price *= math.exp(0.0002 - 0.5 * 0.012 ** 2 + 0.012 * random.gauss(0, 1))
        benchmark[d] = round(bm_price, 2)

    return {
        "price_history": price_history,
        "theme_membership": theme_membership,
        "theme_neglect_scores": theme_neglect_scores,
        "benchmark": benchmark,
    }
