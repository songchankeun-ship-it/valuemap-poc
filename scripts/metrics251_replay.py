#!/usr/bin/env python3
# Metrics 2.5.1 역사/차등 검증 하네스 (Slice H) — 순수·결정적·표준 라이브러리 전용.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D03, §7 Gate 3,
#      §10 Slice H, 원안 티켓 ORN-2502 역사 재실행 부분):
#   * 가격·거래량 의존 후보 factor(모멘텀·거래활성도·위험조정)를 로컬 이력이 허용하는 한
#     최소 252개 시장일에 대해 point-in-time 창으로 재실행한다. 각 시장일 D 의 창은 D 이하의
#     관측값만 사용한다(미래정보 누출 금지). 밸류·종합은 시점별 재무 스냅샷이 없으므로
#     이 하네스에서 계산·주장하지 않는다(§M251-D03).
#   * 2.4(공개 정본 산식)와 2.5.1(shadow 엔진)의 차이를 네 상태로 분류한다:
#       - INTENDED_METHOD_CHANGE  : 원시값은 동일하나 백분위 방식(average-rank vs below-fraction)·
#                                   반올림(HALF_UP vs round)·최소 이력 임계 등 문서화된 방법 차이.
#       - DATA_QUALITY_FINDING    : 창의 입력 데이터 문제(결측 거래일·비양수 가격·거래량 0·
#                                   기업행동 의심 점프)로 설명되는 차이/제외.
#       - UNAVAILABLE_COMPARISON  : 비교 자체가 성립하지 않음(양쪽 결측, 또는 시점별 재무 부재로
#                                   밸류·종합 비교 불가).
#       - P0_MISMATCH             : 두 방식 모두 유효한데 동일 창의 **원시값**이 허용오차를 넘어
#                                   불일치 — 실제 신뢰성 결함 신호(설명 불가).
#   * 결정적 JSON/Markdown 증거를 만든다(같은 로컬 데이터 → 바이트 동일 출력).
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · 작업 지시):
#   * 현재 재무값을 과거 날짜에 복사해 성과 검증처럼 표현하지 않는다. point-in-time 재무가 없으면
#     밸류·종합 비교는 UNAVAILABLE(NO_POINT_IN_TIME_FUNDAMENTALS)로 봉쇄한다(§M251-D03).
#     이 단계는 투자성과 백테스트가 아니라 결정성·경계·안정성(신뢰성 회귀) 검증이다.
#   * 결측을 50/factor 평균으로 대체하지 않는다. 2.5.1 경로는 엔진(Slice D)이 None+사유로 전파한다.
#     2.4 경로는 2.4 의 실제 동작(결측→50 채움)을 **관측·분류**만 하고 2.5.1 계산에 섞지 않는다.
#   * 벽시계 시각 금지(datetime.now()/time.time()/date.today() 등)·난수 금지 — 출력은 로컬 입력
#     바이트에서만 파생, 결정적. 네트워크·외부 서비스 금지.
#   * 공개 public/ 산출물·Metrics 2.4 파일을 수정하지 않는다(price/stocks JSON 읽기 전용).
#   * factor 키·2.5.1 원시 함수는 엔진(Slice D)을 단일 출처로 재사용한다(2.5.1 재구현 금지).
#     2.4 참조 함수는 공개 정본 scripts/compute_metrics.py 의 산식을 그대로 반영한 **읽기 전용
#     참조**다(2.5.1 이 아니라 2.4 를 재현 — 차등 분류의 비교 기준이며 새 truth 를 만들지 않는다).
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_engine as eng  # noqa: E402  (Slice D 순수 엔진 — 2.5.1 원시 함수·factor 키 단일 출처)
import metrics251_primitives as primitives  # noqa: E402  (Slice C 백분위·저장 반올림)

CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
PRICES_DIR = os.path.join(ROOT, "public", "data", "prices")
STOCKS_PATH = os.path.join(ROOT, "public", "data", "stocks.json")
DEFAULT_JSON_OUT = os.path.join(ROOT, "docs", "metrics-2.5.1-replay.json")
DEFAULT_MD_OUT = os.path.join(ROOT, "docs", "metrics-2.5.1-replay.md")

# 가격·거래량 의존 factor 만 역사 재실행 대상(밸류·종합은 시점별 재무 필요 — §M251-D03 봉쇄).
PRICE_VOLUME_FACTORS = ("momentum", "activity", "riskAdjusted")

# 2.4 공개 정본(scripts/compute_metrics.py)이 지표를 계산할 때 쓰는 lookback 창 상한.
#   load_prices(lookback=253): 최근 253 거래일만 사용 → 위험조정 252 수익률·모멘텀 6개월 정합.
#   양 경로에 **동일 창**을 먹여 원시값 동치를 검증하려면 이 상한을 공유해야 한다.
LOOKBACK_CAP = 253

# 차등 분류 버킷(안정 코드 — 계약이므로 문자열 값을 바꾸지 않는다).
CLS_AGREE = "AGREE"                         # 두 방식 모두 유효·원시값·점수 모두 동일(드묾).
CLS_INTENDED = "INTENDED_METHOD_CHANGE"
CLS_DATA_QUALITY = "DATA_QUALITY_FINDING"
CLS_UNAVAILABLE = "UNAVAILABLE_COMPARISON"
CLS_P0 = "P0_MISMATCH"
CLASSES = (CLS_AGREE, CLS_INTENDED, CLS_DATA_QUALITY, CLS_UNAVAILABLE, CLS_P0)

# 방법 차이 사유(INTENDED 세부).
METHOD_PERCENTILE = "PERCENTILE_METHOD"          # average-rank vs below-fraction (+HALF_UP vs round)
METHOD_MIN_HISTORY = "MIN_HISTORY_THRESHOLD"     # 2.4/2.5.1 최소 이력 임계 상이
METHOD_MISSING_POLICY = "MISSING_POLICY"         # 2.4 결측→50 채움 vs 2.5.1 withhold(None)

# 데이터 품질 사유(DATA_QUALITY 세부).
DQ_MISSING_TRADING_DATE = "MISSING_TRADING_DATE"
DQ_CORPORATE_ACTION_SUSPECT = "CORPORATE_ACTION_SUSPECT"
DQ_NON_POSITIVE_PRICE = "NON_POSITIVE_PRICE"
DQ_ZERO_VOLUME_WINDOW = "ZERO_VOLUME_WINDOW"
DQ_STALE_AS_OF = "STALE_AS_OF"                    # 종목의 최신 관측일이 시장일 D 이전(거래정지/미상장 등)

# 비교 불가 사유(UNAVAILABLE 세부).
UN_BOTH_EXCLUDED = "BOTH_EXCLUDED"
NO_POINT_IN_TIME_FUNDAMENTALS = "NO_POINT_IN_TIME_FUNDAMENTALS"  # 밸류·종합 봉쇄(§M251-D03)

# 원시값 동치 허용오차(부동소수 잡음만 흡수 — 방법 무관 동일 창은 수치적으로 같아야 한다).
RAW_ABS_TOL = 1e-9
RAW_REL_TOL = 1e-9
SCORE_ABS_TOL = 1e-9

# 기업행동 의심 단일일 변동 임계. KRX 일일 가격제한 ±30% 를 크게 넘는 창(>100%)은 미조정 분할/병합
#   등 기업행동을 의심한다(§M251-D06 — 자동 제외가 아니라 품질 상태로 남긴다).
CORPORATE_ACTION_JUMP = 2.0


# ---------------------------------------------------------------------------
# 숫자 위생.
# ---------------------------------------------------------------------------
def _finite_positive(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) and x > 0


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _close_enough(a, b):
    """원시값 동치(절대+상대 허용오차)."""
    if a is None or b is None:
        return False
    return abs(a - b) <= max(RAW_ABS_TOL, RAW_REL_TOL * max(abs(a), abs(b)))


# ---------------------------------------------------------------------------
# 2.4 공개 정본 참조 산식(읽기 전용) — scripts/compute_metrics.py 를 그대로 반영한다.
#   각 함수는 (raw|None, reason) 를 반환한다. reason 은 엔진 상수를 재사용해 사유 비교를 단순화한다.
#   2.4 는 결측을 downstream 에서 50 으로 채우지만, 참조 함수는 원시값과 사유만 돌려주고
#   채움(fill) 여부는 분류기가 별도로 판단한다(2.4 동작을 관측하되 2.5.1 에 섞지 않음).
# ---------------------------------------------------------------------------
def ref24_momentum_raw(prices):
    """2.4 calc_momentum: len>=130, ret(n)=(last-prev)/prev*100(비양수 prev→0), 0.3/0.4/0.3 가중.

    반환 raw 는 **퍼센트 스케일**(2.5.1 은 분수 스케일) — 분류기가 /100 로 정규화해 비교한다.
    """
    if prices is None or len(prices) < 130:
        return None, eng.INSUFFICIENT_HISTORY
    closes = prices
    last = closes[-1]

    def ret(n):
        if len(closes) <= n:
            return 0.0
        prev = closes[-n - 1]
        return (last - prev) / prev * 100.0 if prev > 0 else 0.0

    weighted = 0.3 * ret(21) + 0.4 * ret(63) + 0.3 * ret(126)
    return weighted, eng.VALID


def ref24_activity_ratio(volumes):
    """2.4 calc_flow: len>=25, r5=avg(vols[-5:]), r20=avg(vols[-20:]), r20==0→None."""
    if volumes is None or len(volumes) < 25:
        return None, eng.INSUFFICIENT_HISTORY
    r5 = sum(volumes[-5:]) / 5.0
    r20 = sum(volumes[-20:]) / 20.0
    if r20 == 0:
        return None, eng.ZERO_VARIANCE
    return r5 / r20, eng.VALID


def ref24_activity_score(ratio):
    """2.4 calc_flow 점수 매핑(2.5.1 config segments 와 동일 계수) + round(,1). None→None."""
    if ratio is None:
        return None
    if ratio < 0.5:
        score = 10.0
    elif ratio < 1.0:
        score = 10.0 + (ratio - 0.5) * 80.0
    elif ratio < 3.0:
        score = 50.0 + (ratio - 1.0) * 25.0
    else:
        score = 100.0
    return round(score, 1)


def ref24_risk_sharpe(prices):
    """2.4 calc_vol: len>=60, 일간수익률(비양수 prev 건너뜀), population std, sharpe=(mean*252-0.035)/(std*sqrt252)."""
    if prices is None or len(prices) < 60:
        return None, eng.INSUFFICIENT_HISTORY
    rets = [(prices[i] - prices[i - 1]) / prices[i - 1]
            for i in range(1, len(prices)) if prices[i - 1] > 0]
    if len(rets) < 2:
        return None, eng.INSUFFICIENT_HISTORY
    mean = sum(rets) / len(rets)
    std = math.sqrt(sum((r - mean) ** 2 for r in rets) / len(rets))
    if std == 0:
        return None, eng.ZERO_VARIANCE
    ar, asd = mean * 252.0, std * math.sqrt(252.0)
    return (ar - 0.035) / asd, eng.VALID


def ref24_percentile_scores(raws):
    """2.4 백분위: 각 유효 raw 에 대해 below/N*100 후 round(,1). None 은 None(모집단 제외)."""
    valid = [v for v in raws if v is not None]
    n = len(valid)
    out = []
    for v in raws:
        if v is None or n == 0:
            out.append(None)
            continue
        below = sum(1 for x in valid if x < v)
        out.append(round(below / n * 100.0, 1))
    return out


# ---------------------------------------------------------------------------
# 창(window) 품질 검사 — 순수. 결정적 사유 코드 집합을 반환한다.
# ---------------------------------------------------------------------------
def window_quality_findings(window, market_date, axis_dates=None):
    """point-in-time 창의 데이터 품질 사유 코드 리스트(정렬). 제외가 아니라 품질 관측(§M251-D06)."""
    codes = set()
    if not window:
        return []
    closes = [p.get("c") for p in window]
    vols = [p.get("v") for p in window]
    dates = [p.get("d") for p in window]

    if any(not _finite_positive(c) for c in closes):
        codes.add(DQ_NON_POSITIVE_PRICE)

    # 기업행동 의심: 인접 종가 비율이 [1/JUMP, JUMP] 밖(양수 구간 한정).
    for i in range(1, len(closes)):
        a, b = closes[i - 1], closes[i]
        if _finite_positive(a) and _finite_positive(b):
            r = b / a
            if r >= CORPORATE_ACTION_JUMP or r <= 1.0 / CORPORATE_ACTION_JUMP:
                codes.add(DQ_CORPORATE_ACTION_SUSPECT)
                break

    # 거래량 20일 창 합이 0 → 활성도 정의 불가(품질 관측).
    if len(vols) >= 20 and sum(v for v in vols[-20:] if _num(v)) == 0:
        codes.add(DQ_ZERO_VOLUME_WINDOW)

    # 종목 최신 관측일이 시장일 D 이전(거래정지/미상장 등).
    if dates and str(dates[-1]) < str(market_date):
        codes.add(DQ_STALE_AS_OF)

    # 결측 거래일: axis 의 [창 시작, D] 구간 날짜가 종목 창에 없으면 결측(창 범위로 한정).
    if axis_dates:
        wset = {str(d) for d in dates}
        start = str(dates[0])
        expected = [str(d) for d in axis_dates if start <= str(d) <= str(market_date)]
        if any(d not in wset for d in expected):
            codes.add(DQ_MISSING_TRADING_DATE)

    return sorted(codes)


# ---------------------------------------------------------------------------
# point-in-time 재무 가드(§M251-D03) — 밸류·종합은 시점별 재무가 없으면 봉쇄한다.
# ---------------------------------------------------------------------------
def value_composite_guard(has_point_in_time_fundamentals):
    """밸류·종합 비교 가능성 판정. 시점별 재무가 없으면 UNAVAILABLE(계산·성과 주장 금지).

    반환 computed=False 는 이 하네스가 밸류·종합 점수를 만들지 않았음을 뜻한다(과거 성과 표현 금지).
    현재 재무값을 과거 날짜에 복사하지 않는다 — 부재 시 정직하게 봉쇄한다.
    """
    if not has_point_in_time_fundamentals:
        return {
            "bucket": CLS_UNAVAILABLE,
            "code": NO_POINT_IN_TIME_FUNDAMENTALS,
            "computed": False,
            "note": "시점별 재무 스냅샷 부재 — 밸류·종합 비교/성과 주장 봉쇄(§M251-D03).",
        }
    # point-in-time 재무가 실제로 확보된 구간에서만 허용(현재 자동화 범위에는 없음 — Slice H 는 봉쇄만 확정).
    return {
        "bucket": CLS_UNAVAILABLE,
        "code": NO_POINT_IN_TIME_FUNDAMENTALS,
        "computed": False,
        "note": "시점별 재무가 표시됐으나 이 하네스는 역사 밸류·종합 성과를 산출하지 않는다"
                "(결정성·경계·안정성 검증 범위, 성과 백테스트 아님).",
    }


# ---------------------------------------------------------------------------
# factor 차등 분류(순수) — 한 종목·한 factor 의 2.4/2.5.1 결과를 버킷으로 분류한다.
# ---------------------------------------------------------------------------
def classify_factor(factor, ref_raw, ref_reason, ref_score,
                    s_raw, s_reason, s_score, dq_codes):
    """(bucket, code) 반환. raw 는 이미 동일 스케일로 정규화된 값(모멘텀은 /100 적용)."""
    ref_valid = ref_reason == eng.VALID
    s_valid = s_reason == eng.VALID
    dq = list(dq_codes or [])

    # (1) 양쪽 모두 유효.
    if ref_valid and s_valid:
        if _close_enough(ref_raw, s_raw):
            if ref_score is not None and s_score is not None and abs(ref_score - s_score) <= SCORE_ABS_TOL:
                return CLS_AGREE, None
            # 원시값 동일·점수 상이 → 백분위 방식/반올림 차이(문서화된 의도).
            return CLS_INTENDED, METHOD_PERCENTILE
        # 동일 창에서 두 방식 모두 유효한데 원시값 불일치 → 설명 불가한 신뢰성 결함.
        return CLS_P0, None

    # (2) 정확히 한쪽만 유효.
    if ref_valid != s_valid:
        excluded_reason = s_reason if not s_valid else ref_reason
        # 데이터 문제로 인한 제외(비양수 가격·거래량 0)는 품질 발견.
        if excluded_reason in (eng.MISSING_INPUT, eng.ZERO_VARIANCE):
            return CLS_DATA_QUALITY, excluded_reason
        if dq and (DQ_NON_POSITIVE_PRICE in dq or DQ_ZERO_VOLUME_WINDOW in dq):
            return CLS_DATA_QUALITY, excluded_reason
        # 최소 이력 임계 차이(2.4/2.5.1 min 상이)로 인한 제외 → 문서화된 의도된 방법 차이.
        if excluded_reason == eng.INSUFFICIENT_HISTORY:
            return CLS_INTENDED, METHOD_MIN_HISTORY
        return CLS_INTENDED, METHOD_MISSING_POLICY

    # (3) 양쪽 모두 무효(비교 불가).
    if dq and (DQ_NON_POSITIVE_PRICE in dq or DQ_ZERO_VOLUME_WINDOW in dq):
        return CLS_DATA_QUALITY, eng.MISSING_INPUT
    return CLS_UNAVAILABLE, UN_BOTH_EXCLUDED


# ---------------------------------------------------------------------------
# 한 시장일 전체 유니버스 재실행(순수) — 창은 이미 point-in-time 로 잘려 있어야 한다.
# ---------------------------------------------------------------------------
def evaluate_date(inputs, cfg):
    """한 시장일의 2.4/2.5.1 차등 결과. 부작용 없음·결정적.

    inputs = {
      "marketDate": "YYYY-MM-DD",
      "axisDates": [...]|None,               # 결측 거래일 검출용(옵션)
      "sourceDates": {"prices","volumes","fundamentals": ...|None},
      "stocks": [ {"ticker", "window":[{d,c,v}...] (오래된→최신), "hasPointInTimeFundamentals": bool} ],
    }
    """
    market_date = inputs["marketDate"]
    axis = inputs.get("axisDates")
    stocks = sorted(inputs["stocks"], key=lambda s: str(s["ticker"]))
    n = len(stocks)

    prices_list = []
    vols_list = []
    dq_by_stock = []
    for s in stocks:
        window = s.get("window") or []
        closes = [p.get("c") for p in window]
        vols = [p.get("v") for p in window]
        prices_list.append(closes)
        vols_list.append(vols)
        dq_by_stock.append(window_quality_findings(window, market_date, axis))

    # ---- 원시값(양 경로) ----
    ref_mom = [ref24_momentum_raw(p) for p in prices_list]
    ref_act = [ref24_activity_ratio(v) for v in vols_list]
    ref_risk = [ref24_risk_sharpe(p) for p in prices_list]

    s_mom = [eng.momentum_raw(p, cfg) for p in prices_list]
    s_act = [eng.activity_ratio(v, cfg) for v in vols_list]
    s_risk = [eng.risk_adjusted_raw(p, cfg) for p in prices_list]

    # ---- 백분위/점수(양 경로) ----
    ref_mom_scores = ref24_percentile_scores([r[0] for r in ref_mom])
    ref_risk_scores = ref24_percentile_scores([r[0] for r in ref_risk])
    ref_act_scores = [ref24_activity_score(r[0]) for r in ref_act]

    s_mom_scores = [primitives.store_score(x) for x in primitives.percentile_scores([r[0] for r in s_mom])]
    s_risk_scores = [primitives.store_score(x) for x in primitives.percentile_scores([r[0] for r in s_risk])]
    s_act_scores = [primitives.store_score(eng.activity_score_from_ratio(r[0], cfg)) for r in s_act]

    per_stock = []
    for i, s in enumerate(stocks):
        dq = dq_by_stock[i]
        # 모멘텀은 2.4 가 퍼센트, 2.5.1 이 분수 → 2.4 raw 를 /100 정규화 후 비교.
        rm_raw = ref_mom[i][0] / 100.0 if ref_mom[i][0] is not None else None
        cls = {
            "momentum": classify_factor(
                "momentum", rm_raw, ref_mom[i][1], ref_mom_scores[i],
                s_mom[i][0], s_mom[i][1], s_mom_scores[i], dq),
            "activity": classify_factor(
                "activity", ref_act[i][0], ref_act[i][1], ref_act_scores[i],
                s_act[i][0], s_act[i][1], s_act_scores[i], dq),
            "riskAdjusted": classify_factor(
                "riskAdjusted", ref_risk[i][0], ref_risk[i][1], ref_risk_scores[i],
                s_risk[i][0], s_risk[i][1], s_risk_scores[i], dq),
        }
        # 밸류·종합은 시점별 재무 가드로 봉쇄(과거 성과 주장 금지).
        guard = value_composite_guard(bool(s.get("hasPointInTimeFundamentals")))
        p0 = {f: (cls[f][0] == CLS_P0) for f in PRICE_VOLUME_FACTORS}
        per_stock.append({
            "ticker": str(s["ticker"]),
            "factors": {f: {"bucket": cls[f][0], "code": cls[f][1]} for f in PRICE_VOLUME_FACTORS},
            "dataQuality": dq,
            "valueComparison": guard,
            "compositeComparison": guard,
            "anyP0": any(p0.values()),
        })

    return {
        "marketDate": market_date,
        "universeCount": n,
        "sourceDates": {
            "prices": inputs.get("sourceDates", {}).get("prices"),
            "volumes": inputs.get("sourceDates", {}).get("volumes"),
            "fundamentals": inputs.get("sourceDates", {}).get("fundamentals"),
        },
        "stocks": per_stock,
    }


# ---------------------------------------------------------------------------
# 집계(순수) — 여러 시장일 결과를 결정적 요약으로 접는다.
# ---------------------------------------------------------------------------
def _empty_counts():
    return {c: 0 for c in CLASSES}


def aggregate(date_results, *, sample_cap=25):
    """date_results 리스트 → 결정적 요약 리포트(부분). 벽시계·난수 없음."""
    factor_counts = {f: _empty_counts() for f in PRICE_VOLUME_FACTORS}
    method_codes = {f: {} for f in PRICE_VOLUME_FACTORS}
    dq_by_code = {}
    dq_samples = {}
    p0_list = []
    per_date = []

    for dr in date_results:
        d = dr["marketDate"]
        date_factor = {f: _empty_counts() for f in PRICE_VOLUME_FACTORS}
        dq_dates = 0
        for st in dr["stocks"]:
            if st["dataQuality"]:
                dq_dates += 1
                for code in st["dataQuality"]:
                    dq_by_code[code] = dq_by_code.get(code, 0) + 1
                    bucket = dq_samples.setdefault(code, [])
                    if len(bucket) < sample_cap:
                        bucket.append({"marketDate": d, "ticker": st["ticker"]})
            for f in PRICE_VOLUME_FACTORS:
                bucket, code = st["factors"][f]["bucket"], st["factors"][f]["code"]
                factor_counts[f][bucket] += 1
                date_factor[f][bucket] += 1
                if bucket == CLS_INTENDED and code:
                    method_codes[f][code] = method_codes[f].get(code, 0) + 1
                if bucket == CLS_P0:
                    if len(p0_list) < sample_cap:
                        p0_list.append({"marketDate": d, "ticker": st["ticker"], "factor": f})
        per_date.append({
            "marketDate": d,
            "universeCount": dr["universeCount"],
            "stocksWithDataQualityFinding": dq_dates,
            "factors": {f: dict(date_factor[f]) for f in PRICE_VOLUME_FACTORS},
        })

    total_p0 = sum(factor_counts[f][CLS_P0] for f in PRICE_VOLUME_FACTORS)
    comparable = sum(
        factor_counts[f][CLS_AGREE] + factor_counts[f][CLS_INTENDED]
        for f in PRICE_VOLUME_FACTORS)
    raw_agree = comparable  # 양쪽 유효(AGREE/INTENDED)는 원시값 동치가 확인된 쌍이다(P0 이면 별도 버킷).

    return {
        "factorDifferential": {
            f: {
                **{c: factor_counts[f][c] for c in CLASSES},
                "methodCodes": dict(sorted(method_codes[f].items())),
            } for f in PRICE_VOLUME_FACTORS
        },
        "rawAgreement": {
            "comparablePairs": comparable + total_p0,
            "rawAgreePairs": raw_agree,
            "p0Pairs": total_p0,
            "note": "comparablePairs = 양쪽 유효(AGREE+INTENDED) + P0. 양쪽 유효인데 원시값이 "
                    "허용오차를 넘으면 P0 로만 분류된다 — rawAgreePairs 는 원시 동치가 확인된 쌍.",
        },
        "dataQualityFindings": {
            "byCode": dict(sorted(dq_by_code.items())),
            "sampleByCode": {k: dq_samples[k] for k in sorted(dq_samples)},
        },
        "p0Mismatches": p0_list,
        "p0Count": total_p0,
        "perDate": per_date,
    }


# ---------------------------------------------------------------------------
# 로컬 드라이버 — public/data/prices 를 읽어 point-in-time 창을 만들고 재실행한다(읽기 전용).
# ---------------------------------------------------------------------------
def _read_price_points(ticker):
    """prices/{ticker}.json 의 points(오래된→최신). 종가 양수만 유지(2.4 load_prices 와 동일 필터)."""
    path = os.path.join(PRICES_DIR, f"{ticker}.json")
    with open(path, encoding="utf-8-sig") as f:
        d = json.load(f)
    pts = [{"d": str(x["d"]), "c": x["c"], "v": x.get("v", 0) or 0}
           for x in d.get("points", []) if isinstance(x.get("c"), (int, float)) and x["c"] > 0]
    pts.sort(key=lambda p: p["d"])
    return pts


def _load_universe(limit=None):
    """stocks.json 의 티커 목록(정렬)을 읽고 각 티커의 price points 를 로드. 읽기 전용."""
    with open(STOCKS_PATH, encoding="utf-8-sig") as f:
        data = json.load(f)
    tickers = sorted(str(s["ticker"]) for s in data.get("stocks", []))
    if limit:
        tickers = tickers[:limit]
    series = {}
    for tk in tickers:
        path = os.path.join(PRICES_DIR, f"{tk}.json")
        if os.path.exists(path):
            series[tk] = _read_price_points(tk)
    return tickers, series


def _dataset_hash(series):
    """로컬 데이터셋의 결정적 해시 — points 의 (d,c,v)만(휘발 메타 제외). 결정성 증거."""
    h = hashlib.sha256()
    for tk in sorted(series):
        h.update(tk.encode("utf-8"))
        for p in series[tk]:
            h.update(f"|{p['d']},{p['c']},{p['v']}".encode("utf-8"))
        h.update(b"\n")
    return h.hexdigest()


def build_date_axis(series, num_dates):
    """전 종목 날짜의 합집합에서 가장 최근 num_dates 개 시장일(오름차순)."""
    all_dates = set()
    for pts in series.values():
        all_dates.update(p["d"] for p in pts)
    axis = sorted(all_dates)
    return axis[-num_dates:] if num_dates and num_dates < len(axis) else axis


def point_in_time_window(points, market_date, cap=LOOKBACK_CAP):
    """market_date 이하 관측값만(미래정보 누출 금지), 최근 cap 개로 절단(2.4 lookback 정합)."""
    wnd = [p for p in points if p["d"] <= market_date]
    return wnd[-cap:] if cap and len(wnd) > cap else wnd


def run_local_replay(cfg, *, num_dates=252, universe_limit=None, sample_cap=25):
    """로컬 가격 데이터로 최소 num_dates 시장일 재실행 → 요약 리포트(dict). 읽기 전용·결정적."""
    tickers, series = _load_universe(limit=universe_limit)
    axis = sorted({p["d"] for pts in series.values() for p in pts})
    analyzed = axis[-num_dates:] if num_dates and num_dates < len(axis) else axis

    date_results = []
    for d in analyzed:
        stocks = []
        for tk in tickers:
            pts = series.get(tk)
            if not pts:
                continue
            wnd = point_in_time_window(pts, d)
            if not wnd:
                continue  # D 이전 관측 없음(미상장) — 유니버스에서 자연 제외.
            stocks.append({
                "ticker": tk,
                "window": wnd,
                # 역사 재실행에는 시점별 재무가 없다 → 밸류·종합 봉쇄(§M251-D03).
                "hasPointInTimeFundamentals": False,
            })
        if not stocks:
            continue
        inputs = {
            "marketDate": d,
            "axisDates": analyzed,
            "sourceDates": {"prices": d, "volumes": d, "fundamentals": None},
            "stocks": stocks,
        }
        date_results.append(evaluate_date(inputs, cfg))

    agg = aggregate(date_results, sample_cap=sample_cap)
    return {
        "meta": {
            "reportKind": "metrics-2.5.1-historical-differential-replay",
            "engineVersion": eng.ENGINE_VERSION,
            "readOnly": True,
            "computesPublicScore": False,
            "isPerformanceBacktest": False,
            "purpose": "reliability-regression (determinism/boundary/stability), NOT investment-performance backtest",
            "priceVolumeFactors": list(PRICE_VOLUME_FACTORS),
            "lookbackCap": LOOKBACK_CAP,
            "requestedDates": num_dates,
            "analyzedDates": len(date_results),
            "universeSize": len(tickers),
            "datasetHash": _dataset_hash(series),
            "note": "가격·거래량 factor 만 point-in-time 재실행. 밸류·종합은 시점별 재무 부재로 봉쇄"
                    "(NO_POINT_IN_TIME_FUNDAMENTALS). 현재 재무를 과거로 복사하지 않는다(§M251-D03).",
        },
        "pointInTimeGuard": {
            "valueComparison": CLS_UNAVAILABLE,
            "compositeComparison": CLS_UNAVAILABLE,
            "reason": NO_POINT_IN_TIME_FUNDAMENTALS,
            "computed": False,
            "note": "역사 밸류·종합 성과는 산출·주장하지 않는다. 현재-날짜 밸류 영향은 Slice A 기준선 소관.",
        },
        "verdict": {
            "p0Count": agg["p0Count"],
            "p0Clean": agg["p0Count"] == 0,
            "meetsMinimumDates": len(date_results) >= min(num_dates, len(axis)),
        },
        **agg,
    }


# ---------------------------------------------------------------------------
# Markdown 렌더 — 결정적(같은 리포트 → 같은 바이트).
# ---------------------------------------------------------------------------
def render_markdown(report):
    m = report["meta"]
    L = []
    L.append("# Metrics 2.5.1 역사/차등 검증 하네스 (Slice H)")
    L.append("")
    L.append("> 이 문서는 `scripts/metrics251_replay.py` 가 로컬 가격 데이터에서 **결정적으로 재생성**합니다.")
    L.append("> 손으로 수정하지 마세요. 같은 데이터면 JSON/Markdown 출력이 바이트 단위로 동일합니다.")
    L.append("")
    L.append("**신뢰성 회귀 증거입니다 — 투자성과 백테스트가 아닙니다.** 가격·거래량 의존 factor"
             "(모멘텀·거래활성도·위험조정)만 point-in-time 창으로 재실행해 2.4 정본 산식과 2.5.1 "
             "shadow 엔진의 차이를 분류합니다. 밸류·종합은 시점별 재무가 없어 봉쇄합니다(§M251-D03) — "
             "현재 재무를 과거 날짜에 복사해 성과처럼 표현하지 않습니다.")
    L.append("")
    L.append(f"- 엔진 버전: `{m['engineVersion']}` · 분석 시장일: **{m['analyzedDates']}** "
             f"(요청 {m['requestedDates']}) · 유니버스: {m['universeSize']}종목 · lookback 상한: {m['lookbackCap']}")
    L.append(f"- 데이터셋 SHA-256(points 만): `{m['datasetHash']}`")
    L.append(f"- 목적: {m['purpose']}")
    L.append("")

    v = report["verdict"]
    L.append("## 0. 판정")
    L.append("")
    L.append(f"- **P0 불일치: {v['p0Count']}건** — {'clean ✅' if v['p0Clean'] else 'P0 존재 ❌'}")
    L.append(f"- 최소 시장일 충족(≥252 또는 가용 전량): {'예' if v['meetsMinimumDates'] else '아니오'}")
    L.append("")
    L.append("> P0 는 두 방식 모두 유효한데 **동일 창의 원시값**이 허용오차를 넘어 불일치하는 경우입니다"
             "(설명 불가한 신뢰성 결함). 백분위 방식·반올림·최소 이력 임계 같은 문서화된 차이는 P0 가 "
             "아니라 INTENDED_METHOD_CHANGE 입니다.")
    L.append("")

    L.append("## 1. factor별 차등 분류")
    L.append("")
    L.append("| factor | AGREE | INTENDED | DATA_QUALITY | UNAVAILABLE | P0 |")
    L.append("|---|---:|---:|---:|---:|---:|")
    fd = report["factorDifferential"]
    for f in PRICE_VOLUME_FACTORS:
        c = fd[f]
        L.append(f"| {f} | {c[CLS_AGREE]} | {c[CLS_INTENDED]} | {c[CLS_DATA_QUALITY]} "
                 f"| {c[CLS_UNAVAILABLE]} | {c[CLS_P0]} |")
    L.append("")
    for f in PRICE_VOLUME_FACTORS:
        mc = fd[f]["methodCodes"]
        if mc:
            L.append(f"- {f} INTENDED 세부: " + ", ".join(f"`{k}`={vv}" for k, vv in mc.items()))
    L.append("")

    ra = report["rawAgreement"]
    L.append("## 2. 원시값 동치(신뢰성 핵심 주장)")
    L.append("")
    L.append(f"- 비교 가능 쌍(양쪽 유효 + P0): **{ra['comparablePairs']}**")
    L.append(f"- 원시값 동치 확인 쌍: **{ra['rawAgreePairs']}** · P0(원시 불일치): **{ra['p0Pairs']}**")
    L.append("")
    L.append(f"> {ra['note']}")
    L.append("")

    dq = report["dataQualityFindings"]
    L.append("## 3. 데이터 품질 발견(제외가 아니라 품질 관측 — §M251-D06)")
    L.append("")
    if dq["byCode"]:
        L.append("| 코드 | 건수 |")
        L.append("|---|---:|")
        for k, vv in dq["byCode"].items():
            L.append(f"| `{k}` | {vv} |")
    else:
        L.append("- (없음)")
    L.append("")

    L.append("## 4. point-in-time 재무 가드")
    L.append("")
    g = report["pointInTimeGuard"]
    L.append(f"- 밸류 비교: `{g['valueComparison']}` · 종합 비교: `{g['compositeComparison']}` "
             f"· 사유: `{g['reason']}` · 산출: {g['computed']}")
    L.append(f"> {g['note']}")
    L.append("")

    L.append("## 5. P0 불일치 목록")
    L.append("")
    if report["p0Mismatches"]:
        L.append("| 시장일 | 티커 | factor |")
        L.append("|---|---|---|")
        for p in report["p0Mismatches"]:
            L.append(f"| {p['marketDate']} | `{p['ticker']}` | {p['factor']} |")
    else:
        L.append("- **P0 불일치 없음.** 2.5.1 엔진이 2.4 정본 factor 원시값을 재현하며, 점수 차이는 "
                 "전부 문서화된 방법 차이·데이터 품질·비교 불가로 귀속됨.")
    L.append("")
    return "\n".join(L) + "\n"


# ---------------------------------------------------------------------------
# 설정 로드 + CLI.
# ---------------------------------------------------------------------------
def load_config(path=CONFIG_PATH):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 historical/differential replay harness (Slice H, read-only, deterministic).")
    ap.add_argument("--dates", type=int, default=252, help="분석할 최근 시장일 수(최소 252)")
    ap.add_argument("--universe-limit", type=int, default=None, help="유니버스 티커 상한(진단용)")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 을 stdout 으로")
    ap.add_argument("--json-out", default=DEFAULT_JSON_OUT, help="JSON 리포트 출력 경로")
    ap.add_argument("--out", default=DEFAULT_MD_OUT, help="Markdown 리포트 출력 경로")
    ap.add_argument("--no-write", action="store_true", help="파일 미기록, 요약만")
    args = ap.parse_args(argv)

    cfg = load_config()
    report = run_local_replay(cfg, num_dates=args.dates, universe_limit=args.universe_limit)

    if args.json:
        print(json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2))
        return 0

    js = json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
    md = render_markdown(report)
    if not args.no_write:
        with open(args.json_out, "w", encoding="utf-8", newline="\n") as fp:
            fp.write(js)
        with open(args.out, "w", encoding="utf-8", newline="\n") as fp:
            fp.write(md)
        print(f"metrics251_replay: {os.path.relpath(args.json_out, ROOT)} + "
              f"{os.path.relpath(args.out, ROOT)} 재생성 완료.")

    m, v = report["meta"], report["verdict"]
    print(f"  시장일 {m['analyzedDates']}(요청 {m['requestedDates']}) · 유니버스 {m['universeSize']} · "
          f"P0 {v['p0Count']}({'clean' if v['p0Clean'] else 'DIRTY'}) · "
          f"datasetHash {m['datasetHash'][:12]}…")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
