#!/usr/bin/env python3
# Metrics 2.5.1 순수 Python shadow 엔진 (Slice D) — 부작용 없는 core, 표준 라이브러리 전용.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §6 계약, §7 Gate 1~2,
#      §10 Slice D, 원안 티켓 ORN-2502):
#   * 명시적 입력(가격·거래량·재무·config·시장기준일·소스기준일)에서 출력 객체(후보 스냅샷)를
#     만드는 부작용 없는 함수다. 파일을 쓰지 않고, 공개 데이터를 변형하지 않으며, 네트워크를
#     타지 않고, 기존 공개 코드 경로에 연결하지 않는다.
#   * 원안 후보 공식만 조립한다(공개 확정 아님):
#       - 모멘텀: 21/63/126 거래일 수익률의 0.30/0.40/0.30 가중합 → universe 백분위
#       - 거래활성도: 5일/20일 거래량 비율 → 고정 piecewise_linear 점수(config segments)
#       - 밸류: PER·PBR cheapness = mean(100-percentile(per), 100-percentile(pbr))
#       - 위험조정: 252 수익률 기반 (연율수익 - 고정기준수익률) / (연율변동성) → universe 백분위
#       - 종합: 네 factor 동일가중 평균(withhold: 하나라도 결측이면 None)
#   * 요구 조건 미충족 시 None + 사유 코드를 반환한다(결측을 50/평균으로 대체하지 않는다).
#   * 동일 입력·config·엔진 버전은 바이트 단위로 같은 canonical 스냅샷을 만든다(순서·로케일 무관).
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · 작업 지시):
#   * 결측을 50 점 또는 다른 factor 평균으로 대체하지 않는다. 결측은 None + 사유 코드.
#   * 벽시계 시각 금지(datetime.now()/time.time()/date.today() 등) — 출력은 입력에서만 파생.
#   * 파일 쓰기·공개 경로 기록 금지(순수 함수). scripts/compute_metrics.py 미의존(중복 계산 아님,
#     Slice C 원시 함수를 재사용). 3.5% 는 config 의 명명 필드 fixedAnnualHurdleRate 로만 읽는다
#     (최신 무위험수익률이라고 부르지 않는다 — 설계서 §M251-D06).
#
# 이 엔진은 아직 어떤 공개 데이터 생성에도 연결하지 않는다(Slice F 가 불변 snapshot·manifest·
# pointer 를, Slice E 가 자격·모집단 계약을 확장한다). 여기서는 core 계산과 결정성만 확정한다.
from __future__ import annotations

import math
import os
import sys
from dataclasses import dataclass, field
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_primitives as primitives  # noqa: E402  (Slice C 원시 함수 재사용)
from metrics251_config import canonical_bytes, config_hash  # noqa: E402  (Slice B canonical hash 재사용)

ENGINE_VERSION = "2.5.1"

# factor 키(설계서 §6 · config composite.requiredMetrics 순서).
FACTORS = ("momentum", "activity", "value", "riskAdjusted")

# ---------------------------------------------------------------------------
# 사유 코드(설계서 §M251-D04). factor 유효성·품질 상태를 자동 제외와 분리해 명시한다.
# ---------------------------------------------------------------------------
VALID = "VALID"
MISSING_INPUT = "MISSING_INPUT"
INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY"
NON_POSITIVE_FUNDAMENTAL = "NON_POSITIVE_FUNDAMENTAL"
SOURCE_DATE_STALE = "SOURCE_DATE_STALE"
SOURCE_DATE_MISMATCH = "SOURCE_DATE_MISMATCH"
ZERO_VARIANCE = "ZERO_VARIANCE"
QUALITY_WARNING = "QUALITY_WARNING"

# 스냅샷 전체가 성립하지 않을 때의 top-level 사유(설계서 §9 실패/롤백 규칙에 대응).
RUN_EMPTY_UNIVERSE = "EMPTY_UNIVERSE"
RUN_ENGINE_VERSION_MISMATCH = "ENGINE_VERSION_MISMATCH"
RUN_MARKET_DATE_MISSING = "MARKET_DATE_MISSING"
RUN_SOURCE_DATE_MISSING = "SOURCE_DATE_MISSING"
RUN_SOURCE_DATE_MISMATCH = "SOURCE_DATE_MISMATCH"
RUN_DUPLICATE_TICKER = "DUPLICATE_TICKER"

# 후보 스냅샷 상태. QA_PASSED 는 manifest 봉인(Slice F)·5일 게이트(Slice K)를 통과했다는 뜻이므로
# 여기서 쓰지 않는다 — 이 엔진은 계산만 확정한다. 정직한 중립 상태를 쓴다.
RUN_STATE_CANDIDATE_COMPUTED = "CANDIDATE_COMPUTED"


# ---------------------------------------------------------------------------
# 입력 타입(typed) — 명시적 입력만 받는다. 전역/파일/네트워크에서 아무것도 끌어오지 않는다.
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class StockInput:
    ticker: str
    prices: Optional[list] = None    # adjusted_close, 과거→현재(오래된→최신) 순서
    volumes: Optional[list] = None   # share_volume, 과거→현재 순서
    per: Optional[float] = None
    pbr: Optional[float] = None

    @staticmethod
    def from_dict(d):
        return StockInput(
            ticker=str(d["ticker"]),
            prices=list(d["prices"]) if d.get("prices") is not None else None,
            volumes=list(d["volumes"]) if d.get("volumes") is not None else None,
            per=d.get("per"),
            pbr=d.get("pbr"),
        )


@dataclass(frozen=True)
class EngineRequest:
    config: dict
    marketDate: Optional[str]
    sourceDates: dict           # {"prices": ..., "volumes": ..., "fundamentals": ...|None}
    stocks: list                # list[StockInput]

    @staticmethod
    def from_dict(d):
        return EngineRequest(
            config=d["config"],
            marketDate=d.get("marketDate"),
            sourceDates=dict(d.get("sourceDates") or {}),
            stocks=[StockInput.from_dict(s) for s in d.get("stocks", [])],
        )


# ---------------------------------------------------------------------------
# 출력 타입(typed/canonical) — to_dict() 는 canonical_bytes(sort_keys)가 정규화할 dict 를 만든다.
# ---------------------------------------------------------------------------
@dataclass
class FactorResult:
    factor: str
    reason: str
    raw: Optional[float] = None       # 원시값(밸류는 단일 raw 가 없어 None + components)
    score: Optional[float] = None     # 저장 후보 점수(HALF_UP 1자리) 또는 None
    components: Optional[dict] = None  # 밸류의 per/pbr/perScore/pbrScore 등 보조 정보

    def to_dict(self):
        out = {"factor": self.factor, "reason": self.reason, "raw": self.raw, "score": self.score}
        if self.components is not None:
            out["components"] = self.components
        return out


@dataclass
class StockResult:
    ticker: str
    factors: dict                 # {factorKey: FactorResult}
    compositeScore: Optional[float]
    rankingEligible: bool
    eligibilityReasons: dict      # {factorKey: reason} — VALID 이 아닌 factor 만

    def to_dict(self):
        return {
            "ticker": self.ticker,
            "factors": {k: v.to_dict() for k, v in self.factors.items()},
            "compositeScore": self.compositeScore,
            "rankingEligible": self.rankingEligible,
            "eligibilityReasons": self.eligibilityReasons,
        }


@dataclass
class CandidateSnapshot:
    engineVersion: str
    configHash: str
    inputManifestHash: str
    marketDate: str
    sourceDates: dict
    runState: str
    stocks: list                  # list[StockResult], ticker 오름차순
    factorPopulations: dict       # {factorKey: {count, hash}}
    rankingPopulation: dict       # {count, hash}
    eligibilityReasonCounts: dict

    def to_dict(self):
        return {
            "engineVersion": self.engineVersion,
            "configHash": self.configHash,
            "inputManifestHash": self.inputManifestHash,
            "marketDate": self.marketDate,
            "sourceDates": self.sourceDates,
            "runState": self.runState,
            "stocks": [s.to_dict() for s in self.stocks],
            "factorPopulations": self.factorPopulations,
            "rankingPopulation": self.rankingPopulation,
            "eligibilityReasonCounts": self.eligibilityReasonCounts,
        }

    def canonical_bytes(self):
        return canonical_bytes(self.to_dict())


@dataclass
class EngineResult:
    """엔진 결과. snapshot 이 None 이면 nullReasons 에 top-level 사유 코드가 담긴다."""
    snapshot: Optional[CandidateSnapshot]
    nullReasons: list = field(default_factory=list)


# ---------------------------------------------------------------------------
# 숫자 위생.
# ---------------------------------------------------------------------------
def _finite_positive(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) and x > 0


def _finite_nonneg(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) and x >= 0


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


# ---------------------------------------------------------------------------
# 후보 원시 공식. 각 함수는 (raw|None, reason) 를 반환한다. 결측은 절대 숫자로 대체하지 않는다.
# ---------------------------------------------------------------------------
def momentum_raw(prices, cfg):
    """모멘텀 원시값 = w1m*r21 + w3m*r63 + w6m*r126. (raw|None, reason)."""
    m = cfg["metrics"]["momentum"]
    lb = m["lookbacksTradingDays"]
    w = m["weights"]
    min_points = m["minimumPricePoints"]
    if not prices:
        return None, MISSING_INPUT
    max_lb = max(lb["r1m"], lb["r3m"], lb["r6m"])
    if len(prices) < min_points or len(prices) < max_lb + 1:
        return None, INSUFFICIENT_HISTORY
    last = prices[-1]
    if not _finite_positive(last):
        return None, MISSING_INPUT
    raw = 0.0
    for key in ("r1m", "r3m", "r6m"):
        base = prices[-1 - lb[key]]
        if not _finite_positive(base):
            return None, MISSING_INPUT  # 0/음수/비유한 기준가 → 수익률 정의 불가(데이터 오류)
        raw += w[key] * (last / base - 1.0)
    return raw, VALID


def activity_ratio(volumes, cfg):
    """거래활성도 원시 비율 = avg_5 / avg_20. (ratio|None, reason)."""
    a = cfg["metrics"]["activity"]
    num_days = a["numeratorTradingDays"]
    den_days = a["denominatorTradingDays"]
    min_points = a["minimumVolumePoints"]
    if not volumes:
        return None, MISSING_INPUT
    if len(volumes) < min_points or len(volumes) < den_days:
        return None, INSUFFICIENT_HISTORY
    num_slice = volumes[-num_days:]
    den_slice = volumes[-den_days:]
    for v in den_slice:
        if not _finite_nonneg(v):
            return None, MISSING_INPUT  # 음수/비유한 거래량 → 데이터 오류
    avg_num = sum(num_slice) / num_days
    avg_den = sum(den_slice) / den_days
    if avg_den == 0:
        return None, ZERO_VARIANCE  # 20일 평균 거래량 0 → 비율 정의 불가
    return avg_num / avg_den, VALID


def activity_score_from_ratio(ratio, cfg):
    """고정 piecewise_linear 점수(config segments). score = anchorScore + (ratio-anchorRatio)*slope.

    universe 백분위가 아니라 절대 매핑이다(설계서 §M251-D06). ratio 는 [seg.minInclusive,
    seg.maxExclusive) 로 매칭한다. None 경계는 열린 구간. None 은 None 으로 전파.
    """
    if ratio is None:
        return None
    primitives._require_finite(ratio, "activity_score_from_ratio")
    segments = cfg["metrics"]["activity"]["scoreMapping"]["segments"]
    for seg in segments:
        lo, hi = seg["minInclusive"], seg["maxExclusive"]
        if (lo is None or ratio >= lo) and (hi is None or ratio < hi):
            score = seg["anchorScore"] + (ratio - seg["anchorRatio"]) * seg["slopePerRatio"]
            return primitives.clamp_score(score)
    # segments 는 (-inf, inf) 를 덮도록 config 로 검증됨 — 방어적으로 clamp 없이 실패시키지 않는다.
    raise ValueError(f"activity_score_from_ratio: ratio {ratio} 가 어떤 segment 에도 매칭되지 않음")


def value_validity(per, pbr):
    """밸류 factor 의 per-stock 유효성. (ok, reason)."""
    if not _num(per) or not _num(pbr):
        return False, MISSING_INPUT
    if per <= 0 or pbr <= 0:
        return False, NON_POSITIVE_FUNDAMENTAL
    return True, VALID


def risk_adjusted_raw(prices, cfg):
    """위험조정 원시값 = (mean_daily*252 - hurdle) / (pop_std_daily * sqrt(252)). (raw|None, reason).

    hurdle 는 config 의 명명 필드 fixedAnnualHurdleRate 로만 읽는다(설계서 §M251-D06).
    """
    r = cfg["metrics"]["riskAdjusted"]
    min_points = r["minimumPricePoints"]
    need_returns = r["requiredDailyReturns"]
    ann = r["annualizationFactor"]
    hurdle = r["fixedAnnualHurdleRate"]
    if not prices:
        return None, MISSING_INPUT
    if len(prices) < min_points or len(prices) < need_returns + 1:
        return None, INSUFFICIENT_HISTORY
    window = prices[-(need_returns + 1):]  # need_returns 개의 일간 수익률을 만드는 최소 창
    for p in window:
        if not _finite_positive(p):
            return None, MISSING_INPUT
    returns = [window[i] / window[i - 1] - 1.0 for i in range(1, len(window))]
    n = len(returns)  # == need_returns
    mean = sum(returns) / n
    variance = sum((x - mean) ** 2 for x in returns) / n  # population(설계서/YAML stddev: population)
    std = math.sqrt(variance)
    if std == 0:
        return None, ZERO_VARIANCE
    return (mean * ann - hurdle) / (std * math.sqrt(ann)), VALID


# ---------------------------------------------------------------------------
# 모집단 해시(설계서 §8) — 정렬·고정 표현의 canonical form 을 sha256.
# ---------------------------------------------------------------------------
def _population_hash(pairs):
    """pairs: [(ticker, value), ...] → 정렬 후 canonical sha256(Slice B config_hash 재사용)."""
    return config_hash(sorted([[str(t), v] for t, v in pairs]))


def _ticker_hash(tickers):
    return config_hash(sorted(str(t) for t in tickers))


# ---------------------------------------------------------------------------
# core 엔진.
# ---------------------------------------------------------------------------
def _validate_run(request):
    """top-level 성립 조건. 위반 사유 리스트(비면 통과)."""
    reasons = []
    cfg = request.config
    if cfg.get("engineVersion") != ENGINE_VERSION:
        reasons.append(RUN_ENGINE_VERSION_MISMATCH)
    if not request.marketDate:
        reasons.append(RUN_MARKET_DATE_MISSING)
    if not request.stocks:
        reasons.append(RUN_EMPTY_UNIVERSE)
    tickers = [s.ticker for s in request.stocks]
    if len(set(tickers)) != len(tickers):
        reasons.append(RUN_DUPLICATE_TICKER)
    # 가격·거래량 소스 기준일은 필수(없으면 run 실패). 재무 기준일은 null 허용(밸류만 보류).
    sd = request.sourceDates
    if not sd.get("prices") or not sd.get("volumes"):
        reasons.append(RUN_SOURCE_DATE_MISSING)
    else:
        # 미래 소스 기준일(marketDate 보다 뒤)은 불가능한 데이터 → mismatch (문자열 YYYY-MM-DD 비교).
        if request.marketDate:
            for key in ("prices", "volumes"):
                if sd.get(key) and sd[key] > request.marketDate:
                    reasons.append(RUN_SOURCE_DATE_MISMATCH)
                    break
    return reasons


def compute_snapshot(request):
    """EngineRequest -> EngineResult. 부작용 없음. 요구 미충족 시 snapshot=None + nullReasons."""
    run_reasons = _validate_run(request)
    if run_reasons:
        return EngineResult(snapshot=None, nullReasons=sorted(set(run_reasons)))

    cfg = request.config
    stocks = sorted(request.stocks, key=lambda s: s.ticker)  # 순서 불변: 출력은 ticker 정렬
    n = len(stocks)
    fundamentals_stale = not request.sourceDates.get("fundamentals")

    # ---- 1) factor 별 원시값 + per-stock 사유 ----
    momentum_raw_vals = [None] * n
    momentum_reason = [None] * n
    activity_ratio_vals = [None] * n
    activity_reason = [None] * n
    per_vals = [None] * n
    pbr_vals = [None] * n
    value_reason = [None] * n
    risk_raw_vals = [None] * n
    risk_reason = [None] * n

    for i, s in enumerate(stocks):
        mr, mrs = momentum_raw(s.prices, cfg)
        momentum_raw_vals[i], momentum_reason[i] = mr, mrs

        ar, ars = activity_ratio(s.volumes, cfg)
        activity_ratio_vals[i], activity_reason[i] = ar, ars

        if fundamentals_stale:
            value_reason[i] = SOURCE_DATE_STALE  # 재무 기준일 없음 → 밸류 보류(설계서 §M251-D06)
        else:
            ok, vrs = value_validity(s.per, s.pbr)
            value_reason[i] = vrs
            if ok:
                per_vals[i], pbr_vals[i] = s.per, s.pbr

        rr, rrs = risk_adjusted_raw(s.prices, cfg)
        risk_raw_vals[i], risk_reason[i] = rr, rrs

    # ---- 2) universe 백분위 점수(모멘텀·위험조정) — 결측은 None 으로 전파(대체 없음) ----
    momentum_scores_full = primitives.percentile_scores(momentum_raw_vals)
    risk_scores_full = primitives.percentile_scores(risk_raw_vals)

    # ---- 3) 거래활성도 절대 점수(piecewise_linear) ----
    activity_scores_full = [activity_score_from_ratio(r, cfg) for r in activity_ratio_vals]

    # ---- 4) 밸류: cheapness = mean(100-percentile(per), 100-percentile(pbr)) ----
    per_pct = primitives.percentile_scores(per_vals)
    pbr_pct = primitives.percentile_scores(pbr_vals)
    value_scores_full = [None] * n
    value_components = [None] * n
    for i in range(n):
        if per_pct[i] is None or pbr_pct[i] is None:
            continue
        per_score = 100.0 - per_pct[i]
        pbr_score = 100.0 - pbr_pct[i]
        value_scores_full[i] = (per_score + pbr_score) / 2.0
        value_components[i] = {
            "per": per_vals[i], "pbr": pbr_vals[i],
            "perScore": primitives.store_score(per_score),
            "pbrScore": primitives.store_score(pbr_score),
        }

    # ---- 5) 조립: factor 결과 + 종합점수(withhold) ----
    weights = cfg["composite"]["weights"]
    required = list(cfg["composite"]["requiredMetrics"])
    results = []
    reason_counts = {}
    for i, s in enumerate(stocks):
        factors = {
            "momentum": FactorResult(
                "momentum", momentum_reason[i], raw=momentum_raw_vals[i],
                score=primitives.store_score(momentum_scores_full[i])),
            "activity": FactorResult(
                "activity", activity_reason[i], raw=activity_ratio_vals[i],
                score=primitives.store_score(activity_scores_full[i])),
            "value": FactorResult(
                "value", value_reason[i], raw=None,
                score=primitives.store_score(value_scores_full[i]),
                components=value_components[i]),
            "riskAdjusted": FactorResult(
                "riskAdjusted", risk_reason[i], raw=risk_raw_vals[i],
                score=primitives.store_score(risk_scores_full[i])),
        }
        # 종합점수: 네 factor 의 full-precision 점수로 계산(중간 공개 반올림 금지, 설계서 §6) 후 저장 반올림.
        full_scores = {
            "momentum": momentum_scores_full[i],
            "activity": activity_scores_full[i],
            "value": value_scores_full[i],
            "riskAdjusted": risk_scores_full[i],
        }
        composite_full = primitives.composite_score(full_scores, weights, required)
        composite_stored = primitives.store_score(composite_full)
        ranking_eligible = composite_stored is not None

        elig = {k: factors[k].reason for k in FACTORS if factors[k].reason != VALID}
        for k, reason in elig.items():
            key = f"{k}.{reason}"
            reason_counts[key] = reason_counts.get(key, 0) + 1

        results.append(StockResult(
            ticker=s.ticker, factors=factors,
            compositeScore=composite_stored, rankingEligible=ranking_eligible,
            eligibilityReasons=elig))

    # ---- 6) factor 모집단 + ranking 모집단 메타데이터(설계서 §8) ----
    factor_populations = {
        "momentum": _factor_population(stocks, momentum_raw_vals, momentum_reason),
        "activity": _factor_population(stocks, activity_ratio_vals, activity_reason),
        "value": _factor_population(
            stocks, [value_scores_full[i] for i in range(n)], value_reason),
        "riskAdjusted": _factor_population(stocks, risk_raw_vals, risk_reason),
    }
    ranking_tickers = [r.ticker for r in results if r.rankingEligible]
    ranking_population = {"count": len(ranking_tickers), "hash": _ticker_hash(ranking_tickers)}

    snapshot = CandidateSnapshot(
        engineVersion=ENGINE_VERSION,
        configHash=config_hash(cfg),
        inputManifestHash=_input_manifest_hash(request, stocks),
        marketDate=request.marketDate,
        sourceDates={
            "prices": request.sourceDates.get("prices"),
            "volumes": request.sourceDates.get("volumes"),
            "fundamentals": request.sourceDates.get("fundamentals"),
        },
        runState=RUN_STATE_CANDIDATE_COMPUTED,
        stocks=results,
        factorPopulations=factor_populations,
        rankingPopulation=ranking_population,
        eligibilityReasonCounts=dict(sorted(reason_counts.items())),
    )
    return EngineResult(snapshot=snapshot, nullReasons=[])


def _factor_population(stocks, values, reasons):
    """VALID(reason)인 원소로 모집단 해시 계산. count + hash."""
    pairs = [(stocks[i].ticker, values[i]) for i in range(len(stocks)) if reasons[i] == VALID]
    return {"count": len(pairs), "hash": _population_hash(pairs)}


def _input_manifest_hash(request, stocks):
    """입력을 canonical 해시로 고정(설계서 §8 inputManifestHash). 같은 입력 → 같은 해시."""
    manifest = {
        "marketDate": request.marketDate,
        "sourceDates": {
            "prices": request.sourceDates.get("prices"),
            "volumes": request.sourceDates.get("volumes"),
            "fundamentals": request.sourceDates.get("fundamentals"),
        },
        "stocks": sorted(
            [{"ticker": s.ticker, "prices": s.prices, "volumes": s.volumes,
              "per": s.per, "pbr": s.pbr} for s in stocks],
            key=lambda x: x["ticker"]),
    }
    return config_hash(manifest)


def run_from_dict(request_dict):
    """편의: dict 요청 -> EngineResult(순수)."""
    return compute_snapshot(EngineRequest.from_dict(request_dict))


if __name__ == "__main__":
    # 실행형 진입점이 아니라 shadow core 다. import 해서 compute_snapshot(...) 을 호출한다.
    print("metrics251_engine: 순수 shadow core (Slice D). import 후 compute_snapshot(request) 사용.")
    print(f"  engineVersion={ENGINE_VERSION} · factors={list(FACTORS)}")
