#!/usr/bin/env python3
# Metrics 2.5.1 품질·자격·모집단 계약 (Slice E) — 순수·결정적·표준 라이브러리 전용.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D04, §7 Gate 0,
#      §8 데이터 계약, §10 Slice E, 원안 티켓 ORN-2502 자격 부분):
#   * Slice D 순수 shadow 엔진(metrics251_engine)이 만든 후보 스냅샷을 입력으로,
#     자격(eligibility) 사유 코드·품질 경고(quality warning)·factor별 모집단·순위 교집합을
#     명시적으로 계약화하고, 커버리지 회귀 게이트를 제공한다. 엔진을 수정하지 않는다
#     (엔진은 계산만 확정 — 이 층이 자격·모집단·게이트 의미를 얹는다).
#
#   구체 계약:
#   1) 명시적 factor 자격 사유 코드 — 알려진 enum(FACTOR_REASONS)만 허용. 알 수 없는 사유는
#      실패시킨다(설계서 §M251-D04 "UNKNOWN 제외 사유 0건", 작업 지시 "Unknown … must fail").
#   2) 품질 경고 분리 — 양수-이지만-높은 재무값(PER>100·PBR>20·|ROE|>100 등)은 QUALITY_WARNING
#      이며 자동 제외가 아니다. 소스 계약이 무효를 증명할 때만 제외한다(설계서 §M251-D04). 경고는
#      rankingEligible 을 바꾸지 않는다(별도 채널로 기록).
#   3) factor별 유효 모집단 — 각 factor 는 자기 유효 모집단에서만 집계되며, 한 factor 결측이
#      같은 종목의 다른 factor 원시값을 지우지 않는다(설계서 §M251-D04, 작업 지시 non-erasure).
#   4) 순위 자격 교집합 — 종합/순위는 네 factor 가 모두 유효한 교집합에서만 성립한다.
#   5) 모집단 count/hash — factor·순위 모집단의 개수와 canonical 해시(엔진 값과의 차등 검증).
#   6) 커버리지 회귀 게이트 — Slice A 측정 기준선(docs/metrics-2.5.1-baseline.json)을 사용해
#      이유 없는 급락을 탐지하고, 시장/업종 편향을 보고하며, 설계서의 잠정 커버리지 규칙을 강제한다.
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · 작업 지시):
#   * 결측을 50/factor 평균으로 대체하지 않는다(엔진이 이미 None + 사유로 전파; 이 층은 관측만).
#   * 벽시계 시각 금지 — 출력은 입력(요청·config·기준선)에서만 파생, 결정적.
#   * public/ 또는 공개 API 에 아무것도 쓰지 않는다. 공개 Metrics 2.4 산출물 미변경.
#   * Slice A 임계(EXTREME_THRESHOLDS)를 단일 출처로 재사용한다(경고 임계를 새로 창작하지 않음).
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_engine as eng  # noqa: E402  (Slice D 순수 엔진)
import metrics251_baseline as baseline  # noqa: E402  (Slice A 읽기전용 기준선 — 경고 임계 단일 출처)
from metrics251_config import config_hash  # noqa: E402  (Slice B canonical 해시)

BASELINE_JSON_PATH = os.path.join(ROOT, "docs", "metrics-2.5.1-baseline.json")

# ---------------------------------------------------------------------------
# 1) 명시적 factor 자격 사유 enum — 단일 출처는 엔진 상수(중복 정의하지 않는다).
#    QUALITY_WARNING·VALID 는 비제외(non-excluding): factor 는 여전히 유효하다.
#    나머지는 제외(excluding): 해당 factor 는 자기 모집단에서 빠진다.
# ---------------------------------------------------------------------------
FACTORS = eng.FACTORS  # ("momentum", "activity", "value", "riskAdjusted")

FACTOR_REASONS = frozenset({
    eng.VALID,
    eng.MISSING_INPUT,
    eng.INSUFFICIENT_HISTORY,
    eng.NON_POSITIVE_FUNDAMENTAL,
    eng.SOURCE_DATE_STALE,
    eng.SOURCE_DATE_MISMATCH,
    eng.ZERO_VARIANCE,
    eng.QUALITY_WARNING,
})
NON_EXCLUDING_REASONS = frozenset({eng.VALID, eng.QUALITY_WARNING})
EXCLUDING_REASONS = FACTOR_REASONS - NON_EXCLUDING_REASONS

# 설계서 §M251-D04 초기 안전 기준(잠정) — baseline 작업에서 확정 전까지의 게이트 임계.
MIN_RANKING_ELIGIBLE_PCT = 95.0     # 전체 rankingEligible 비율 하한
MAX_UNEXPLAINED_DROP_PP = 5.0       # 이전 측정 대비 이유 없는 급락 상한(%p)


def is_known_reason(reason):
    return reason in FACTOR_REASONS


def is_excluding_reason(reason):
    """제외 사유면 True, 비제외(VALID/QUALITY_WARNING)면 False. 알 수 없는 사유는 실패시킨다."""
    if reason not in FACTOR_REASONS:
        raise ValueError(f"is_excluding_reason: 알 수 없는 자격 사유(UNKNOWN): {reason!r}")
    return reason in EXCLUDING_REASONS


def assert_reasons_known(reasons):
    """반복 가능한 사유들이 전부 알려진 enum 인지 단언. 하나라도 아니면 ValueError(설계서 §M251-D04)."""
    unknown = sorted({r for r in reasons if r not in FACTOR_REASONS})
    if unknown:
        raise ValueError(f"assert_reasons_known: 알 수 없는 제외 사유 발견(UNKNOWN 은 실패): {unknown}")
    return True


# ---------------------------------------------------------------------------
# 2) 품질 경고(QUALITY_WARNING) 분리 — 양수-이지만-높음. 제외가 아니라 경고.
#    임계는 Slice A baseline.EXTREME_THRESHOLDS 를 단일 출처로 재사용한다(새 임계 창작 금지).
# ---------------------------------------------------------------------------
def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def quality_warnings(*, per=None, pbr=None, roe=None):
    """양수-이지만-높은 재무값에 대한 경고 코드 리스트(정렬). 제외가 아니다(설계서 §M251-D04).

    per/pbr/roe 중 관측 가능한 값만 검사한다. 임계와 연산자는 Slice A 기준선과 동일하다.
    """
    fields = {"per": per, "pbr": pbr, "roe": roe}
    hits = []
    for t in baseline.EXTREME_THRESHOLDS:
        x = fields.get(t["field"])
        if not _num(x):
            continue
        if t["op"] == ">" and x > t["value"]:
            hits.append(t["id"])
        elif t["op"] == "abs>" and abs(x) > t["value"]:
            hits.append(t["id"])
    return sorted(hits)


# ---------------------------------------------------------------------------
# 3~5) 스냅샷 자격·모집단 평가 — 엔진 결과를 소비해 계약 리포트를 만든다.
# ---------------------------------------------------------------------------
def _factor_score(stock_dict, factor):
    return stock_dict["factors"][factor]["score"]


def _factor_reason(stock_dict, factor):
    return stock_dict["factors"][factor]["reason"]


def evaluate(request_dict):
    """엔진 요청 dict -> 자격·품질·모집단 계약 리포트(dict). 부작용 없음·결정적.

    request_dict: {"config", "marketDate", "sourceDates", "stocks":[{ticker,prices,volumes,per,pbr,[roe]}]}
    엔진을 실행(순수)해 스냅샷을 얻고, 그 위에 자격/경고/모집단/교집합/일관성 계약을 얹는다.
    스냅샷이 성립하지 않으면(top-level 실패) runOk=False + runNullReasons 로 정직하게 보고한다.
    """
    result = eng.run_from_dict(request_dict)
    stocks_in = {str(s["ticker"]): s for s in request_dict.get("stocks", [])}

    # 품질 경고는 스냅샷 성립 여부와 무관하게 원본 재무 입력에서 계산(관측 채널).
    quality = {}
    for tk in sorted(stocks_in):
        s = stocks_in[tk]
        w = quality_warnings(per=s.get("per"), pbr=s.get("pbr"), roe=s.get("roe"))
        if w:
            quality[tk] = {"value": w}
    quality_counts = {}
    for tk in quality:
        for wid in quality[tk]["value"]:
            quality_counts[wid] = quality_counts.get(wid, 0) + 1

    if result.snapshot is None:
        return {
            "engineVersion": eng.ENGINE_VERSION,
            "runOk": False,
            "runNullReasons": list(result.nullReasons),
            "universeCount": len(stocks_in),
            "qualityWarnings": dict(sorted(quality.items())),
            "qualityWarningCounts": dict(sorted(quality_counts.items())),
            "note": "top-level 실패로 스냅샷 미성립 — 자격/모집단 계약은 산출하지 않는다(정직한 보류).",
        }

    snap = result.snapshot.to_dict()
    stocks = snap["stocks"]
    n = len(stocks)

    # (a) 사유 코드 검증 — 모든 factor 사유가 알려진 enum 이어야 한다. UNKNOWN 은 실패 신호.
    all_reasons = [_factor_reason(s, f) for s in stocks for f in FACTORS]
    unknown_reasons = sorted({r for r in all_reasons if not is_known_reason(r)})

    # (b) factor별 유효 모집단 재계산(엔진과 독립) — eligible = 저장 점수 존재(score is not None).
    #     설계서 §M251-D04: 특정 factor 결측이 그 종목의 다른 factor 를 지우지 않는다.
    factor_pop = {}
    reason_score_mismatch = []  # reason==VALID ⟺ score is not None 불변식 위반
    for f in FACTORS:
        eligible = []
        for s in stocks:
            reason = _factor_reason(s, f)
            score = _factor_score(s, f)
            has_score = score is not None
            is_valid = reason == eng.VALID
            if is_valid != has_score:
                reason_score_mismatch.append({"ticker": s["ticker"], "factor": f,
                                              "reason": reason, "scoreIsNone": score is None})
            if has_score:
                eligible.append(str(s["ticker"]))
        eligible.sort()
        factor_pop[f] = {"count": len(eligible), "eligibleTickers": eligible,
                         "hash": _ticker_hash(eligible)}

    # (c) 순위 자격 교집합 — 네 factor 가 모두 유효한 종목. 엔진 rankingEligible 과 대조.
    ranking_by_intersection = sorted(
        str(s["ticker"]) for s in stocks
        if all(_factor_score(s, f) is not None for f in FACTORS))
    ranking_by_engine_flag = sorted(str(s["ticker"]) for s in stocks if s["rankingEligible"])
    ranking_hash = _ticker_hash(ranking_by_intersection)

    # (d) 비-erasure 불변식 — rankingEligible 이 아니어도, VALID 인 factor 는 점수를 유지한다.
    #     value 결측 종목이 momentum/activity/riskAdjusted 관측을 잃지 않았는지 명시적으로 확인.
    erasure_violations = []
    value_missing_preserving = []  # value 가 제외인데 다른 factor 는 유효로 남은 종목(정상 사례)
    for s in stocks:
        for f in FACTORS:
            if _factor_reason(s, f) == eng.VALID and _factor_score(s, f) is None:
                erasure_violations.append({"ticker": s["ticker"], "factor": f})
        value_excluded = is_excluding_reason(_factor_reason(s, "value"))
        others_valid = [f for f in ("momentum", "activity", "riskAdjusted")
                        if _factor_reason(s, f) == eng.VALID]
        if value_excluded and others_valid:
            value_missing_preserving.append({"ticker": s["ticker"], "preservedFactors": others_valid})

    # (e) 제외인데 사유가 없는 종목(불변식: rankingEligible False ⟺ ≥1 factor 제외).
    excluded_without_reason = sorted(
        str(s["ticker"]) for s in stocks
        if not s["rankingEligible"] and not s.get("eligibilityReasons"))

    # (f) 엔진 모집단 메타데이터와의 차등 검증(일관성).
    consistency = {
        "factorCountsMatch": all(
            factor_pop[f]["count"] == snap["factorPopulations"][f]["count"] for f in FACTORS),
        "rankingCountMatch": len(ranking_by_intersection) == snap["rankingPopulation"]["count"],
        "rankingHashMatch": ranking_hash == snap["rankingPopulation"]["hash"],
        "rankingIntersectionMatchesEngineFlag": ranking_by_intersection == ranking_by_engine_flag,
        "reasonScoreInvariantHolds": len(reason_score_mismatch) == 0,
        "noErasure": len(erasure_violations) == 0,
        "noExcludedWithoutReason": len(excluded_without_reason) == 0,
    }

    ranking_pct = round(len(ranking_by_intersection) / n * 100, 2) if n else 0.0

    return {
        "engineVersion": snap["engineVersion"],
        "configHash": snap["configHash"],
        "marketDate": snap["marketDate"],
        "runOk": True,
        "runNullReasons": [],
        "universeCount": n,
        "rankingEligibleCount": len(ranking_by_intersection),
        "rankingEligiblePct": ranking_pct,
        "rankingEligibleTickers": ranking_by_intersection,
        "rankingPopulationHash": ranking_hash,
        "factorPopulations": factor_pop,
        "eligibilityReasonCounts": dict(sorted(snap["eligibilityReasonCounts"].items())),
        "qualityWarnings": dict(sorted(quality.items())),
        "qualityWarningCounts": dict(sorted(quality_counts.items())),
        "unknownReasons": unknown_reasons,
        "excludedWithoutReason": excluded_without_reason,
        "valueMissingPreservingOthers": sorted(value_missing_preserving, key=lambda x: x["ticker"]),
        "consistency": consistency,
    }


def _ticker_hash(tickers):
    """정렬된 티커의 canonical sha256(Slice B config_hash 재사용) — 엔진 _ticker_hash 와 동일 계약."""
    return config_hash(sorted(str(t) for t in tickers))


# ---------------------------------------------------------------------------
# 6) 커버리지 회귀 게이트 — Slice A 측정 기준선 대비 잠정 규칙 강제(설계서 §M251-D04).
# ---------------------------------------------------------------------------
def load_baseline(path=BASELINE_JSON_PATH):
    """Slice A 기준선 JSON(읽기전용). 없으면 FileNotFoundError."""
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def coverage_gate(report, baseline_report, *,
                  min_ranking_pct=MIN_RANKING_ELIGIBLE_PCT,
                  max_unexplained_drop_pp=MAX_UNEXPLAINED_DROP_PP,
                  market_by_ticker=None, sector_by_ticker=None):
    """자격 리포트를 기준선 대비 검증하는 커버리지 게이트. 순수·결정적.

    하드 블로커(pass=False): 최소 커버리지 미달 · UNKNOWN 사유 존재 · 이유 없는 급락 · 일관성 위반.
    시장/업종 편향은 매핑이 있으면 보고하고 없으면 unavailable+사유로 남긴다(공개 전 사람 검토 대상,
    자동 차단 아님 — 설계서 §M251-D04 "공개 전 검토").
    """
    if not report.get("runOk"):
        return {
            "pass": False,
            "blockers": ["run_not_ok"],
            "runNullReasons": report.get("runNullReasons", []),
            "note": "스냅샷 미성립 — 커버리지 게이트 이전에 top-level 실패를 해결해야 한다.",
        }

    snapshot_pct = report["rankingEligiblePct"]
    baseline_pct = float(((baseline_report or {}).get("rankingEligibility") or {}).get("coveragePct", 0.0))
    drop_pp = round(baseline_pct - snapshot_pct, 2)
    has_unknown = len(report.get("unknownReasons", [])) > 0
    excluded_without_reason = len(report.get("excludedWithoutReason", []))
    consistency = report.get("consistency", {})
    consistency_ok = all(consistency.values()) if consistency else False

    checks = {
        "minRankingEligiblePct": {
            "value": snapshot_pct, "threshold": min_ranking_pct,
            "pass": snapshot_pct >= min_ranking_pct,
        },
        "zeroUnknownReasons": {
            "count": len(report.get("unknownReasons", [])),
            "reasons": report.get("unknownReasons", []),
            "pass": not has_unknown,
        },
        "noUnexplainedDrop": {
            "baselinePct": baseline_pct, "snapshotPct": snapshot_pct, "dropPp": drop_pp,
            "threshold": max_unexplained_drop_pp,
            "excludedWithoutReason": excluded_without_reason,
            # 급락이 임계 이상이고, 그 급락을 설명할 수 없을 때만(=UNKNOWN 존재 또는 사유 없는 제외) 실패.
            # 모든 제외에 알려진 사유가 있으면 급락은 '설명됨'이므로 통과하되 reviewRequired 로 표기.
            "reviewRequired": drop_pp >= max_unexplained_drop_pp,
            "pass": not (drop_pp >= max_unexplained_drop_pp
                         and (has_unknown or excluded_without_reason > 0)),
        },
        "consistency": {"detail": consistency, "pass": consistency_ok},
    }

    blockers = [k for k, v in checks.items() if not v["pass"]]

    # 시장/업종 편향(공개 전 검토 대상). 매핑이 없으면 fail-closed 로 unavailable 표기(임의 대체 금지).
    market_bias = _group_bias(report, market_by_ticker) if market_by_ticker else {
        "available": False,
        "reason": "marketByTicker 매핑 미제공 — 엔진 스냅샷은 시장 필드를 담지 않는다(실데이터 경로에서 주입).",
    }
    sector_bias = _group_bias(report, sector_by_ticker) if sector_by_ticker else {
        "available": False,
        "reason": ("업종(sector)은 표시용 휴리스틱이며 스냅샷/공식 필드가 없다(Slice A unavailableFields "
                   "sectorExclusionDistribution). 정식 sector 필드 확보 전까지 unavailable."),
    }

    return {
        "pass": len(blockers) == 0,
        "blockers": blockers,
        "checks": checks,
        "marketBias": market_bias,
        "sectorBias": sector_bias,
    }


def _group_bias(report, group_by_ticker):
    """티커→그룹 매핑으로 그룹별 (전체, 순위제외, 제외율%) 분포를 계산. 결정적."""
    eligible = set(report.get("rankingEligibleTickers", []))
    # 유니버스 티커 = eligible ∪ (factor 모집단 등장 티커). 리포트에서 관측 가능한 티커 전체를 모은다.
    universe = set(eligible)
    for f in FACTORS:
        universe.update(report.get("factorPopulations", {}).get(f, {}).get("eligibleTickers", []))
    universe.update(report.get("excludedWithoutReason", []))
    for tk in group_by_ticker:
        universe.add(str(tk))
    totals, excluded = {}, {}
    for tk in sorted(universe):
        g = str(group_by_ticker.get(tk, "UNKNOWN"))
        totals[g] = totals.get(g, 0) + 1
        if tk not in eligible:
            excluded[g] = excluded.get(g, 0) + 1
    rate = {g: round(excluded.get(g, 0) / totals[g] * 100, 2) for g in totals}
    return {
        "available": True,
        "totalsByGroup": dict(sorted(totals.items())),
        "excludedByGroup": dict(sorted(excluded.items())),
        "exclusionRatePctByGroup": dict(sorted(rate.items())),
    }


# ---------------------------------------------------------------------------
# CLI — 골든 fixture 자격 리포트 요약 + 기준선 로드 확인(진단용, 게이트는 테스트가 강제).
# ---------------------------------------------------------------------------
def _cli(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 eligibility/quality/population contract (Slice E, pure).")
    ap.add_argument("--print-reasons", action="store_true",
                    help="알려진 factor 자격 사유 enum 과 비제외/제외 분류를 출력")
    args = ap.parse_args(argv)

    if args.print_reasons:
        print("FACTOR_REASONS:", ", ".join(sorted(FACTOR_REASONS)))
        print("NON_EXCLUDING :", ", ".join(sorted(NON_EXCLUDING_REASONS)))
        print("EXCLUDING     :", ", ".join(sorted(EXCLUDING_REASONS)))
        return 0

    print("metrics251_eligibility: Slice E 순수 자격·품질·모집단 계약. import 후 "
          "evaluate(request)/coverage_gate(report, baseline) 사용.")
    print(f"  factors={list(FACTORS)} · minRankingPct={MIN_RANKING_ELIGIBLE_PCT} "
          f"· maxUnexplainedDropPp={MAX_UNEXPLAINED_DROP_PP}")
    ok = os.path.exists(BASELINE_JSON_PATH)
    print(f"  baseline={'found' if ok else 'MISSING'}: {os.path.relpath(BASELINE_JSON_PATH, ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_cli())
