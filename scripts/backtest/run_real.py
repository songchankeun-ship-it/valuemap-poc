# -*- coding: utf-8 -*-
"""실데이터 백테스트 — `python scripts/backtest/run_real.py`

public/data/prices/{ticker}.json (실제 KRX 일별 종가)를 읽어
가격 기반 신호 전략을 월별 리밸런싱으로 검증한다.

정직성 원칙:
- 모멘텀/변동성조정/소외도 신호는 '그 시점까지의 가격'만으로 계산 → 미래참조 편향 없음.
- 밸류/자금흐름은 과거 시점 펀더멘털·수급 데이터가 없어 백테스트에서 제외.
- 벤치마크 = 유니버스 동일가중 매수후보유(시장 근사). 거래비용 0% 가정.

출력: public/backtest-result.json (Next.js 백테스트 페이지가 읽음)
"""
from __future__ import annotations
import os, sys, json, glob, math
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from metrics import (  # type: ignore
    PriceSeries, momentum_score, vol_adjusted_score, neglect_score,
)

ROOT = os.path.dirname(os.path.dirname(HERE))
PRICES_DIR = os.path.join(ROOT, "public", "data", "prices")
OUT_PATH = os.path.join(ROOT, "public", "backtest-result.json")

TOP_N = 10
INITIAL_CAPITAL = 10_000_000
MIN_HISTORY = 130  # 신호 계산에 필요한 최소 거래일 (모멘텀 6개월=126)
COST = 0.003       # 편도 거래비용 0.3% (수수료+거래세+슬리피지 근사)


def load_prices():
    """ticker -> {date: close} 와 전체 거래일 목록 반환."""
    series = {}
    all_dates = set()
    for path in sorted(glob.glob(os.path.join(PRICES_DIR, "*.json"))):
        with open(path, encoding="utf-8-sig") as f:
            d = json.load(f)
        pts = d.get("points", [])
        if len(pts) < MIN_HISTORY:
            continue
        m = {}
        for p in pts:
            c = p.get("c")
            if c and c > 0:
                m[p["d"]] = float(c)
                all_dates.add(p["d"])
        if len(m) >= MIN_HISTORY:
            series[d.get("ticker") or os.path.basename(path)[:-5]] = m
    return series, sorted(all_dates)


def build_aligned(series, all_dates):
    """각 ticker를 전체 거래일에 맞춰 forward-fill한 종가 리스트로 정렬."""
    aligned = {}
    for tk, m in series.items():
        out = []
        last = None
        for d in all_dates:
            if d in m:
                last = m[d]
            out.append(last)  # 첫 상장 이전은 None
        aligned[tk] = out
    return aligned


def month_first_indices(all_dates):
    """각 (연,월)의 첫 거래일 인덱스 = 리밸런싱 날짜."""
    seen = set()
    idxs = []
    for i, d in enumerate(all_dates):
        ym = d[:7]
        if ym not in seen:
            seen.add(ym)
            idxs.append(i)
    return idxs


def signal_value(closes_up_to, strategy):
    """전략별 신호 점수 (높을수록 매수 선호)."""
    if len(closes_up_to) < MIN_HISTORY:
        return None
    ps = PriceSeries(closes=closes_up_to)
    if strategy == "momentum":
        return momentum_score(ps)
    if strategy == "vol":
        return vol_adjusted_score(ps)
    if strategy == "neglect":
        return neglect_score(ps)
    if strategy == "composite":
        return (0.5 * momentum_score(ps) + 0.3 * vol_adjusted_score(ps) + 0.2 * neglect_score(ps))
    return None


def run_strategy(aligned, all_dates, reb_idxs, strategy):
    equity = float(INITIAL_CAPITAL)
    positions = {}  # ticker -> shares
    equity_curve = []
    trade_count = 0
    turnover_ratios = []
    reb_set = set(reb_idxs)

    for i, d in enumerate(all_dates):
        if i in reb_set:
            # 현재 종목별 가치 + 평가액 (오늘 종가)
            cur_vals = {}
            cur = 0.0
            for tk, sh in positions.items():
                px = aligned[tk][i]
                if px:
                    v = sh * px
                    cur_vals[tk] = v
                    cur += v
            if positions and cur > 0:
                equity = cur
            # 신호: '전일(i-1)까지'의 종가만 사용 → 같은 날 종가 미래참조 제거
            scored = []
            for tk, ser in aligned.items():
                if not ser[i]:
                    continue
                closes = [c for c in ser[:i] if c is not None]
                sv = signal_value(closes, strategy)
                if sv is not None:
                    scored.append((sv, tk))
            if scored:
                scored.sort(reverse=True)
                picks = [tk for _, tk in scored[:TOP_N]]
                target = equity / len(picks)
                # 회전율·거래비용: |목표가치 - 현재가치| 합(매수+매도 양변)
                traded = 0.0
                for tk in set(cur_vals) | set(picks):
                    newv = target if tk in picks else 0.0
                    traded += abs(newv - cur_vals.get(tk, 0.0))
                if equity > 0:
                    turnover_ratios.append(traded / equity)
                equity = max(equity - COST * traded, 0.0)  # 거래비용 차감
                alloc = equity / len(picks)
                new_positions = {}
                for tk in picks:
                    px = aligned[tk][i]
                    if px and px > 0:
                        new_positions[tk] = alloc / px
                trade_count += sum(1 for tk in new_positions if tk not in positions)
                positions = new_positions
        # 일별 평가액
        if positions:
            val = 0.0
            for tk, sh in positions.items():
                px = aligned[tk][i]
                if px:
                    val += sh * px
            if val > 0:
                equity = val
        equity_curve.append((d, equity))
    avg_turnover = (sum(turnover_ratios) / len(turnover_ratios)) if turnover_ratios else 0.0
    return equity_curve, trade_count, avg_turnover


def run_benchmark(aligned, all_dates):
    """유니버스 동일가중 매수후보유 (첫 거래일에 데이터 있는 종목)."""
    start_i = 0
    # 첫날 데이터 있는 종목
    members = [tk for tk, ser in aligned.items() if ser[start_i]]
    if not members:
        # 데이터 있는 첫 인덱스 탐색
        for j in range(len(all_dates)):
            members = [tk for tk, ser in aligned.items() if ser[j]]
            if members:
                start_i = j
                break
    alloc = float(INITIAL_CAPITAL) / len(members)
    shares = {tk: alloc / aligned[tk][start_i] for tk in members}
    curve = []
    for i, d in enumerate(all_dates):
        val = 0.0
        for tk, sh in shares.items():
            px = aligned[tk][i] if i >= start_i else None
            if px:
                val += sh * px
        curve.append((d, val if val > 0 else float(INITIAL_CAPITAL)))
    return curve


def to_monthly(curve):
    """일별 곡선 -> 월말값 dict {YYYY-MM: value}."""
    by_month = {}
    for d, v in curve:
        by_month[d[:7]] = v  # 월의 마지막으로 덮어써짐
    return dict(sorted(by_month.items()))


def max_drawdown(curve):
    peak = -1e18
    mdd = 0.0
    for _, v in curve:
        peak = max(peak, v)
        if peak > 0:
            mdd = min(mdd, v / peak - 1)
    return mdd


def metrics_from(curve, bm_curve):
    start_v = curve[0][1]
    end_v = curve[-1][1]
    total_return = end_v / start_v - 1
    d0 = datetime.strptime(curve[0][0], "%Y-%m-%d")
    d1 = datetime.strptime(curve[-1][0], "%Y-%m-%d")
    years = max((d1 - d0).days / 365.25, 1e-6)
    cagr = (end_v / start_v) ** (1 / years) - 1
    bm_return = bm_curve[-1][1] / bm_curve[0][1] - 1
    # 월별 수익률 (Sharpe/승률)
    mv = list(to_monthly(curve).items())
    rets = []
    for i in range(1, len(mv)):
        prev = mv[i - 1][1]
        if prev > 0:
            rets.append(mv[i][1] / prev - 1)
    if len(rets) >= 2:
        mean = sum(rets) / len(rets)
        var = sum((x - mean) ** 2 for x in rets) / (len(rets) - 1)
        std = math.sqrt(var)
        sharpe = (mean / std * math.sqrt(12)) if std > 0 else 0.0
        win_rate = sum(1 for x in rets if x > 0) / len(rets)
    else:
        sharpe, win_rate = 0.0, 0.0
    # 벤치마크 위험지표
    bm_mv = list(to_monthly(bm_curve).items())
    bm_rets = [bm_mv[k][1] / bm_mv[k - 1][1] - 1 for k in range(1, len(bm_mv)) if bm_mv[k - 1][1] > 0]
    if len(bm_rets) >= 2:
        bmean = sum(bm_rets) / len(bm_rets)
        bstd = math.sqrt(sum((x - bmean) ** 2 for x in bm_rets) / (len(bm_rets) - 1))
        bm_sharpe = (bmean / bstd * math.sqrt(12)) if bstd > 0 else 0.0
    else:
        bm_sharpe = 0.0
    # 연도별 수익률 (월별 복리)
    ymul = {}
    for k in range(1, len(mv)):
        y = mv[k][0][:4]
        r = mv[k][1] / mv[k - 1][1] - 1 if mv[k - 1][1] > 0 else 0.0
        ymul[y] = ymul.get(y, 1.0) * (1 + r)
    yearly = {y: round(v - 1, 4) for y, v in ymul.items()}
    return {
        "totalReturn": round(total_return, 4),
        "cagr": round(cagr, 4),
        "benchmarkReturn": round(bm_return, 4),
        "alpha": round(total_return - bm_return, 4),
        "maxDrawdown": round(max_drawdown(curve), 4),
        "benchmarkMdd": round(max_drawdown(bm_curve), 4),
        "sharpe": round(sharpe, 2),
        "benchmarkSharpe": round(bm_sharpe, 2),
        "winRate": round(win_rate, 4),
        "years": round(years, 2),
        "yearly": yearly,
    }


STRATEGIES = [
    ("momentum", "모멘텀 Top10"),
    ("vol", "변동성조정 Top10"),
    ("neglect", "소외도(낙폭) Top10"),
    ("composite", "가격종합 Top10"),
]


def main():
    print("📈 실데이터 로드 중...")
    series, all_dates = load_prices()
    if not series or len(all_dates) < MIN_HISTORY:
        print(f"[X] 가격 데이터 부족: tickers={len(series)} dates={len(all_dates)}")
        print("    먼저 `python scripts/fetch_prices.py` 로 데이터를 받으세요.")
        sys.exit(1)
    print(f"   유니버스 {len(series)}종목, 거래일 {len(all_dates)}일 ({all_dates[0]} ~ {all_dates[-1]})")

    aligned = build_aligned(series, all_dates)
    reb_idxs = month_first_indices(all_dates)
    # 워밍업: 충분한 히스토리 확보된 첫 리밸런싱부터
    reb_idxs = [i for i in reb_idxs if i >= MIN_HISTORY]
    print(f"   리밸런싱 {len(reb_idxs)}회 (월별)")

    bm_curve = run_benchmark(aligned, all_dates)
    bm_monthly = to_monthly(bm_curve)

    strat_payloads = []
    for sid, label in STRATEGIES:
        print(f"⚙️  전략 실행: {label}")
        curve, trades, avg_turnover = run_strategy(aligned, all_dates, reb_idxs, sid)
        m = metrics_from(curve, bm_curve)
        m["tradeCount"] = trades
        m["avgTurnover"] = round(avg_turnover, 4)
        eq_monthly = to_monthly(curve)
        equity_curve_monthly = [
            {"month": ym, "equity": round(eq), "benchmark": round(bm_monthly.get(ym, 0), 2)}
            for ym, eq in eq_monthly.items()
        ]
        monthly_returns = {}
        items = list(eq_monthly.items())
        for i in range(1, len(items)):
            prev = items[i - 1][1]
            monthly_returns[items[i][0]] = round(items[i][1] / prev - 1, 4) if prev > 0 else 0.0
        strat_payloads.append({
            "id": sid, "label": label, "metrics": m,
            "equityCurveMonthly": equity_curve_monthly,
            "monthlyReturns": monthly_returns,
        })
        print(f"     총수익 {m['totalReturn']*100:+.1f}% · CAGR {m['cagr']*100:+.1f}% · "
              f"알파 {m['alpha']*100:+.1f}% · MDD {m['maxDrawdown']*100:.1f}% · Sharpe {m['sharpe']}")

    # 대표 전략 = composite (가격종합)
    primary = next(s for s in strat_payloads if s["id"] == "composite")
    payload = {
        "realData": True,
        "generatedAt": datetime.now().isoformat(),
        "period": {"from": all_dates[0], "to": all_dates[-1], "years": primary["metrics"]["years"]},
        "universe": len(series),
        "benchmarkLabel": "유니버스 동일가중 매수후보유(시장 근사)",
        "assumptions": "월별 리밸런싱 · 동일가중 · 거래비용 0.3%(편도) · 월말 신호→당월 첫 거래일 체결(미래참조 제거) · 가격 기반 신호만(밸류/자금흐름 제외) · 현재 유니버스 소급(생존편향 가능)",
        "config": {"topN": TOP_N, "rebalance": "monthly", "initialCapital": INITIAL_CAPITAL},
        "strategies": strat_payloads,
        # 하위호환: 대표 전략을 최상위에도 노출
        "metrics": {**primary["metrics"], "tradeCount": primary["metrics"]["tradeCount"]},
        "equityCurveMonthly": primary["equityCurveMonthly"],
        "monthlyReturns": primary["monthlyReturns"],
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 저장: {OUT_PATH}")
    print("   백테스트 페이지가 이 결과를 자동으로 표시합니다.")


if __name__ == "__main__":
    main()
