#!/usr/bin/env python3
# Metrics 2.5.1 shadow 원시 함수 (Slice C) — 순수·결정적·표준 라이브러리 전용.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §6, §7 Gate 1, §10 Slice C):
#   * 백분위(average-rank), Decimal ROUND_HALF_UP 반올림, 점수 클램프/검증,
#     명시적 null 전파를 순수 함수로 제공한다.
#   * 이 함수들은 **공개 Metrics 2.4 생성 경로(scripts/compute_metrics.py)와 분리**돼 있다.
#     compute_metrics 를 import 하지 않고, public/ 에 아무것도 쓰지 않는다(Slice D 에서 shadow
#     엔진이 조립할 재료일 뿐, 아직 어떤 데이터 생성에도 연결하지 않는다).
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙, 작업 지시):
#   * 결측을 50 점 또는 다른 factor 평균으로 대체하지 않는다. 결측은 None 으로 전파한다.
#     - 주의: `SINGLE_VALUE_SCORE`(=50) 는 결측 대체가 아니다. 유효 모집단이 정확히 1개일 때
#       average-rank 백분위 공식 (rank-0.5)/N 이 N=1 에서 자연히 50 을 내는 **정상 계산 결과**다.
#       결측(None)은 절대 이 값으로 채워지지 않는다.
#   * 벽시계 시각 금지(datetime.now()/time.time() 등) — 출력은 입력에서만 파생, 결정적.
#   * 모든 계산은 입력 순서와 로케일에 무관해야 한다(순서 불변).
#
# 설정 정합성(설계서 §M251-D01): 아래 기본 상수는 승인 shadow config
#   config/metrics/2.5.1.json 의 rounding/percentile 값을 반영한다. 이 모듈은 런타임에
#   config 를 파싱하지 않지만(순수·자립 원시 함수), scripts/test_metrics251_primitives.py 가
#   이 상수들이 canonical config 와 정확히 일치함을 단언해 드리프트를 막는다.
from __future__ import annotations

import math
from decimal import Decimal, ROUND_HALF_UP

# config/metrics/2.5.1.json 의 rounding.* 를 반영(테스트가 정합성 단언).
STORED_SCORE_DECIMALS = 1          # rounding.storedScoreDecimals
ROUNDING_MODE = "ROUND_HALF_UP"    # rounding.mode
# config/metrics/2.5.1.json 의 percentile.* 를 반영(테스트가 정합성 단언).
PERCENTILE_METHOD = "average_rank"  # percentile.method / tieHandling
SINGLE_VALUE_SCORE = 50.0          # percentile.singleValueScore (N=1 에서 공식이 내는 값)
MIN_SCORE = 0.0                    # percentile.minScore
MAX_SCORE = 100.0                  # percentile.maxScore


# ---------------------------------------------------------------------------
# 숫자 위생 — 비유한값(NaN/Inf)은 결정성·순위·반올림을 깨므로 명시적으로 거부한다.
# ---------------------------------------------------------------------------
def _require_finite(x, where):
    if isinstance(x, bool) or not isinstance(x, (int, float, Decimal)):
        raise TypeError(f"{where}: 숫자가 아님: {x!r}")
    if isinstance(x, Decimal):
        if not x.is_finite():
            raise ValueError(f"{where}: 비유한 Decimal: {x!r}")
    elif not math.isfinite(x):
        raise ValueError(f"{where}: 비유한값(NaN/Inf): {x!r}")
    return x


def _to_decimal(x):
    # float 의 이진 표현 오차를 피하려고 str 경유로 Decimal 을 만든다(2.45 -> Decimal('2.45')).
    _require_finite(x, "_to_decimal")
    if isinstance(x, Decimal):
        return x
    if isinstance(x, int):
        return Decimal(x)
    return Decimal(str(x))


# ---------------------------------------------------------------------------
# Average-rank 백분위.
#   average_ranks: 1-기반 평균 순위. 동률은 그 위치들의 평균 순위를 공유한다.
#     순위는 값에서만 결정되므로 입력 순서에 무관하다(순서 불변, 동률 동일).
#   percentile_from_average_rank: score = (avg_rank - 0.5) / N * 100.
#     - 경계: 최저 유일값 = 50/N (>0), 최고 유일값 = 100 - 50/N (<100) → 항상 (0,100) 내부.
#     - 전부 동률 N개 = 모두 50. 단일값(N=1) = 50 = SINGLE_VALUE_SCORE(정상 계산, 결측 대체 아님).
#     - 단조: 값이 크면 순위가 크거나 같아 점수가 크거나 같다.
# ---------------------------------------------------------------------------
def average_ranks(values):
    """숫자 리스트(None 불가)의 1-기반 평균 순위 리스트. 동률은 평균 순위 공유."""
    for i, v in enumerate(values):
        _require_finite(v, f"average_ranks[{i}]")
    n = len(values)
    # 값 기준 정렬 인덱스. 동률은 == 로 묶어 위치 평균을 부여(입력 순서 무관).
    order = sorted(range(n), key=lambda i: values[i])
    ranks = [0.0] * n
    i = 0
    while i < n:
        j = i
        while j + 1 < n and values[order[j + 1]] == values[order[i]]:
            j += 1
        avg_rank = (i + j) / 2.0 + 1.0  # ((i+1)+(j+1))/2, 1-기반
        for k in range(i, j + 1):
            ranks[order[k]] = avg_rank
        i = j + 1
    return ranks


def percentile_from_average_rank(avg_rank, n):
    """average-rank 백분위 점수: (avg_rank - 0.5)/n * 100. n>=1 필요."""
    if n < 1:
        raise ValueError(f"percentile_from_average_rank: n>=1 필요, {n} 받음")
    return (avg_rank - 0.5) / n * 100.0


def percentile_scores(values, *, min_score=MIN_SCORE, max_score=MAX_SCORE):
    """리스트의 각 원소에 대한 average-rank 백분위 점수.

    None(결측)은 모집단(N)에서 제외되고 출력에서도 None 으로 전파된다(명시적 null 전파,
    결측을 점수로 대체하지 않음). 유효 원소는 자기 모집단 내 백분위를 받고 [min,max] 로
    클램프된다(공식은 이미 (0,100) 내부라 클램프는 방어적). 순서·로케일 무관(결정적).
    """
    valid_idx = [i for i, v in enumerate(values) if v is not None]
    for i in valid_idx:
        _require_finite(values[i], f"percentile_scores[{i}]")
    n = len(valid_idx)
    out = [None] * len(values)
    if n == 0:
        return out
    valid_vals = [values[i] for i in valid_idx]
    ranks = average_ranks(valid_vals)
    for pos, i in enumerate(valid_idx):
        score = percentile_from_average_rank(ranks[pos], n)
        out[i] = clamp_score(score, min_score=min_score, max_score=max_score)
    return out


# ---------------------------------------------------------------------------
# Decimal ROUND_HALF_UP 반올림.
#   HALF_UP = 최근접, 동점(정확히 .5)은 0 에서 먼 쪽. 은행가 반올림(HALF_EVEN)과 다르다:
#     0.5->1, 1.5->2, 2.5->3 (HALF_EVEN 이면 2.5->2). 음수: -0.5->-1, -2.5->-3.
# ---------------------------------------------------------------------------
def round_half_up(value, decimals):
    """Decimal ROUND_HALF_UP 로 소수 `decimals` 자리 반올림한 Decimal 반환."""
    if not isinstance(decimals, int) or isinstance(decimals, bool) or decimals < 0:
        raise ValueError(f"round_half_up: decimals 는 0 이상 정수, {decimals!r} 받음")
    quantum = Decimal(1).scaleb(-decimals)  # 10^-decimals: decimals=1 -> 0.1, decimals=0 -> 1
    return _to_decimal(value).quantize(quantum, rounding=ROUND_HALF_UP)


def round_half_up_float(value, decimals):
    """round_half_up 을 float 으로. (JSON 저장 편의; 정밀 표현이 필요하면 round_half_up 사용.)"""
    return float(round_half_up(value, decimals))


def store_score(score, *, decimals=STORED_SCORE_DECIMALS):
    """공개 후보 점수를 저장용 소수 `decimals` 자리로 반올림(HALF_UP). None 은 None 으로 전파."""
    if score is None:
        return None
    return round_half_up_float(score, decimals)


def display_integer(stored_score):
    """저장된 점수에서 정수 표시값 산출(HALF_UP, config displayIntegerFromStoredScore).

    저장된 소수 1자리 점수를 입력으로 받는다(원시값이 아님) — 반올림은 저장값 기준이다.
    None 은 None 으로 전파.
    """
    if stored_score is None:
        return None
    return int(round_half_up(stored_score, 0))


# ---------------------------------------------------------------------------
# 점수 클램프 / 검증.
# ---------------------------------------------------------------------------
def clamp_score(score, *, min_score=MIN_SCORE, max_score=MAX_SCORE):
    """점수를 [min_score, max_score] 로 클램프. None 은 None 으로 전파."""
    if score is None:
        return None
    _require_finite(score, "clamp_score")
    if score < min_score:
        return min_score
    if score > max_score:
        return max_score
    return score


def is_score_in_range(score, *, min_score=MIN_SCORE, max_score=MAX_SCORE):
    """유효 상태 판정: None(정상적 결측)과 [min,max] 내 유한 점수만 True."""
    if score is None:
        return True
    try:
        _require_finite(score, "is_score_in_range")
    except (TypeError, ValueError):
        return False
    return min_score <= score <= max_score


def assert_score_valid(score, *, min_score=MIN_SCORE, max_score=MAX_SCORE):
    """점수가 유효하지 않으면 ValueError. None 은 유효한 결측으로 통과(설계서 quality.publishBlockers
    의 score_out_of_range 가드에 대응하는 순수 검사). 검증된 점수(또는 None)를 그대로 반환."""
    if not is_score_in_range(score, min_score=min_score, max_score=max_score):
        raise ValueError(f"assert_score_valid: 점수 범위 밖/무효 [{min_score},{max_score}]: {score!r}")
    return score


# ---------------------------------------------------------------------------
# 명시적 null 전파 결합기.
#   결측이 하나라도 있으면 결과는 None 이다(대체·은폐 금지). 종합점수는 네 factor 가 모두
#   유효할 때만 산출된다(설계서 §3.2, composite.missingPolicy = withhold_composite_and_ranking).
# ---------------------------------------------------------------------------
def mean_or_none(values):
    """산술 평균. 값이 하나라도 None 이거나 비면 None(전파). 50/평균 대체 없음."""
    if not values or any(v is None for v in values):
        return None
    for i, v in enumerate(values):
        _require_finite(v, f"mean_or_none[{i}]")
    return sum(values) / len(values)


def weighted_mean_or_none(values, weights):
    """가중 평균. 값이 하나라도 None 이면 None(전파). 가중치 합은 0 이면 안 됨."""
    if len(values) != len(weights):
        raise ValueError("weighted_mean_or_none: values 와 weights 길이 불일치")
    if not values or any(v is None for v in values):
        return None
    for i, v in enumerate(values):
        _require_finite(v, f"weighted_mean_or_none.value[{i}]")
    total_w = 0.0
    acc = 0.0
    for v, w in zip(values, weights):
        _require_finite(w, "weighted_mean_or_none.weight")
        acc += v * w
        total_w += w
    if total_w == 0:
        raise ValueError("weighted_mean_or_none: 가중치 합이 0")
    return acc / total_w


def composite_score(factor_scores, weights, required):
    """종합점수 = 필수 factor 가 모두 유효할 때만 가중 평균, 아니면 None(보류).

    factor_scores: {factorKey: score|None}, weights: {factorKey: weight},
    required: 필수 factor 키 리스트. 필수 factor 가 하나라도 없거나(None/키 부재) 하면
    종합점수는 None 이다 — 결측을 50/평균으로 채우지 않는다(설계서 §3.2 결측 은폐 금지).
    """
    vals = []
    ws = []
    for key in required:
        score = factor_scores.get(key)
        if score is None:
            return None  # 보류(withhold): 대체하지 않는다.
        vals.append(score)
        ws.append(weights[key])
    return weighted_mean_or_none(vals, ws)
