#!/usr/bin/env python3
# Metrics 2.5.1 의미 상태·공개 후보 projection (Slice I) — 순수·결정적·표준 라이브러리 전용.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D06, §10 Slice I,
#      원안 티켓 ORN-2505 의미 상태 · ORN-2506 거래활성도):
#   * Slice D 순수 엔진이 만들어 Slice F 저장소가 봉인하는 **저장된 후보 스냅샷**을 입력으로,
#     안정적 의미 enum + 문구(copy) key 를 붙인 공개 후보 projection DTO 를 만든다.
#   * 이 projection 의 입력은 저장된 shadow 값과 사유 코드다 — TypeScript/재계산 산식이 아니다.
#     가격·거래량 배열을 받지 않고, 점수를 다시 계산하지 않는다(설계서 §3.1 단일 엔진, Slice J
#     TS 재계산 차단의 사전 계약). 저장된 raw/score/reason 만 소비한다.
#   * 명칭·부인(denial)을 구조로 고정한다(설계서 §M251-D06):
#       - 거래활성도 = "거래량 활동(volume activity)". 가격 방향/매수·매도 주체/유동성·자금유입·
#         매수세를 뜻하지 않는다(deniedMeanings 로 DTO 에 구조적으로 명시).
#       - 위험조정 = "고정 기준수익률 3.5% 대비 과거 수익-변동성 효율". 3.5% 는 config 의 명명 필드
#         fixedAnnualHurdleRate 로만 읽는다(최신·현재 무위험수익률이라고 부르지 않는다).
#   * 의미 임계는 승인 config 의 semanticRules(단일 출처)에서만 읽는다 — 새 임계를 창작하지 않는다.
#   * 문구 key 는 config/metrics/2.5.1.copy.json 레지스트리로 해석한다(한/영). 이 모듈은 언어 중립
#     DTO(문구 key)만 만들고, 실제 한/영 문자열은 레지스트리가 소유한다.
#
# 감사(audit) 결론 — 기존 작업 재사용 경계(설계서 §10 Slice I "기존 momentum regime/activity
#   재사용 감사"):
#   * src/lib/momentumRegime.ts 의 다-기간 regime(MomentumRegimeKey: strengthening/longUpShortDown
#     /…)은 1·3·6개월 개별 수익률(shortDir/midDir/longDir)을 필요로 한다. 저장 스냅샷은 단일
#     **블렌디드** 모멘텀 원시값만 담으므로 그 계약과 일치하지 않는다 → 여기서는 단일 원시값의
#     방향(UP/FLAT/DOWN)만 정직하게 표시하고(다-기간 regime 이 아님을 denies 로 명시), config
#     directionFlatThresholdPct 를 flat 경계로 재사용한다.
#   * 거래활성도(활동)·위험조정 효율의 상태 임계는 config.semanticRules.activityStates /
#     riskEfficiencyBands 에 이미 데이터로 존재(Slice B) → 그대로 단일 출처로 재사용한다.
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · 작업 지시):
#   * 결측 factor 를 50/평균/중립으로 대체하지 않는다 — 결측은 상태 UNAVAILABLE + 사유 보존.
#   * 벽시계 시각/난수/네트워크/파일쓰기 없음(순수) — 출력은 입력(스냅샷·config·레지스트리)에서만 파생.
#   * public/ 또는 공개 API/공개 라우트/컴포넌트에 아무것도 쓰거나 연결하지 않는다.
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_engine as eng  # noqa: E402  (사유 코드 상수·엔진 버전의 단일 출처)
from metrics251_config import config_hash  # noqa: E402  (Slice B canonical 해시 재사용)

PROJECTION_VERSION = "2.5.1"
CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
COPY_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.copy.json")

# 저장 스냅샷의 factor 키 → projection semanticName. 거래활성도만 이름을 좁힌다(§M251-D06).
SEMANTIC_NAME = {
    "momentum": "momentum",
    "activity": "volumeActivity",
    "value": "value",
    "riskAdjusted": "riskAdjusted",
}

# 구조적 부인(denial) — 명칭이 뜻하지 '않는' 것을 DTO 에 코드로 박아 sign-safety 를 강제한다.
VOLUME_ACTIVITY_DENIED = ["priceDirection", "buyerIdentity", "liquidity", "fundInflow", "buyingPressure"]
RISK_ADJUSTED_DENIED = ["latestRiskFreeRate", "safetyGuarantee", "futureReturn"]


# ---------------------------------------------------------------------------
# 로더(읽기 전용). config·copy 레지스트리는 데이터일 뿐, 실행 로직을 담지 않는다.
# ---------------------------------------------------------------------------
def load_config(path=CONFIG_PATH):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def load_copy(path=COPY_PATH):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# 의미 임계 매칭 — config.semanticRules 단일 출처(minInclusive/maxExclusive, null=열린 구간).
# ---------------------------------------------------------------------------
def _match_band(value, bands):
    """value 가 속하는 band id(정렬 무관·결정적). 어느 구간에도 없으면 None(방어적)."""
    if value is None:
        return None
    for b in bands:
        lo, hi = b["minInclusive"], b["maxExclusive"]
        if (lo is None or value >= lo) and (hi is None or value < hi):
            return b["id"]
    return None


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


# ---------------------------------------------------------------------------
# factor projection — 각 함수는 저장된 raw/score/reason 만 읽는다(재계산 없음).
# ---------------------------------------------------------------------------
def project_momentum(factor, cfg):
    """저장된 블렌디드 모멘텀 원시값의 방향만 표시(다-기간 regime 아님).

    flat 경계는 config.semanticRules.directionFlatThresholdPct(%)를 재사용한다. 원시값은
    소수 수익률(0.05 = 5%)이므로 백분율로 비교한다. 부호 안전: 음수 원시값은 절대 UP 이 아니다.
    """
    reason = factor["reason"]
    raw = factor.get("raw")
    score = factor.get("score")
    if reason != eng.VALID or not _num(raw):
        state = "UNAVAILABLE"
    else:
        flat_pct = cfg["semanticRules"]["directionFlatThresholdPct"]
        pct = raw * 100.0
        if pct >= flat_pct:
            state = "UP"
        elif pct <= -flat_pct:
            state = "DOWN"
        else:
            state = "FLAT"
    return {
        "factor": "momentum",
        "semanticName": "momentum",
        "state": state,
        "copyKey": f"momentum.direction.{state}",
        "sourceRaw": raw if _num(raw) else None,
        "sourceScore": score if _num(score) else None,
        "sourceReason": reason,
    }


def project_volume_activity(factor, cfg):
    """거래활성도 = 거래량 활동. 저장된 5일/20일 비율(raw)을 config.activityStates 로 매핑.

    가격 방향/매수·매도 주체/유동성·자금유입·매수세를 뜻하지 않는다(deniedMeanings 로 구조 명시).
    """
    reason = factor["reason"]
    raw = factor.get("raw")
    score = factor.get("score")
    state = None
    if reason == eng.VALID and _num(raw):
        state = _match_band(raw, cfg["semanticRules"]["activityStates"])
    if state is None:
        state = "UNAVAILABLE"
    return {
        "factor": "activity",
        "semanticName": "volumeActivity",
        "state": state,
        "copyKey": f"volumeActivity.state.{state}",
        "deniedMeanings": list(VOLUME_ACTIVITY_DENIED),
        "sourceRaw": raw if _num(raw) else None,
        "sourceScore": score if _num(score) else None,
        "sourceReason": reason,
    }


def project_value(factor, cfg):
    """밸류: 저장 점수 존재 여부만(config 에 밸류 의미 band 없음 — 임계 창작 금지)."""
    reason = factor["reason"]
    score = factor.get("score")
    state = "PRESENT" if (reason == eng.VALID and _num(score)) else "UNAVAILABLE"
    return {
        "factor": "value",
        "semanticName": "value",
        "state": state,
        "copyKey": f"value.state.{state}",
        "sourceScore": score if _num(score) else None,
        "sourceReason": reason,
    }


def project_risk_adjusted(factor, cfg):
    """위험조정 효율 = 고정 기준수익률 3.5% 대비 과거 수익-변동성 효율.

    band 는 저장된 유니버스 백분위 점수(score)를 config.riskEfficiencyBands 로 매핑한다(상대).
    hurdleRelation 은 저장된 원시값의 부호로 3.5% 기준선 대비 절대 위치를 표시한다(부호 안전):
      raw > 0 → ABOVE, raw == 0 → AT, raw < 0 → BELOW. band(상대)와 hurdle(절대)은 별개다.
    3.5% 는 config.metrics.riskAdjusted.fixedAnnualHurdleRate 로만 읽는다(최신 무위험수익률 아님).
    """
    reason = factor["reason"]
    raw = factor.get("raw")
    score = factor.get("score")
    hurdle_rate = cfg["metrics"]["riskAdjusted"]["fixedAnnualHurdleRate"]

    band = None
    if reason == eng.VALID and _num(score):
        band = _match_band(score, cfg["semanticRules"]["riskEfficiencyBands"])
    if band is None:
        band = "UNAVAILABLE"

    if reason == eng.VALID and _num(raw):
        if raw > 0:
            rel = "ABOVE"
        elif raw < 0:
            rel = "BELOW"
        else:
            rel = "AT"
    else:
        rel = "UNAVAILABLE"

    return {
        "factor": "riskAdjusted",
        "semanticName": "riskAdjusted",
        "state": band,
        "copyKey": f"riskEfficiency.band.{band}",
        "hurdleRelation": rel,
        "hurdleRelationCopyKey": f"riskEfficiency.hurdle.{rel}",
        "hurdleRate": hurdle_rate,
        "deniedMeanings": list(RISK_ADJUSTED_DENIED),
        "sourceRaw": raw if _num(raw) else None,
        "sourceScore": score if _num(score) else None,
        "sourceReason": reason,
    }


def _project_composite(stock):
    eligible = bool(stock.get("rankingEligible"))
    comp = stock.get("compositeScore")
    state = "ELIGIBLE" if eligible else "WITHHELD"
    return {
        "state": state,
        "copyKey": f"composite.state.{state}",
        "rankingEligible": eligible,
        "sourceCompositeScore": comp if _num(comp) else None,
    }


# ---------------------------------------------------------------------------
# 스냅샷 → projection. 저장된 스냅샷 dict 만 받는다(가격·거래량 입력 거부 = 재계산 방지).
# ---------------------------------------------------------------------------
def _assert_stored_snapshot(snapshot):
    """입력이 저장된 후보 스냅샷인지 단언. 가격·거래량 배열이 있으면 재계산 입력이므로 거부한다."""
    if not isinstance(snapshot, dict):
        raise TypeError("project_snapshot: 스냅샷 dict 가 필요하다.")
    if snapshot.get("engineVersion") != eng.ENGINE_VERSION:
        raise ValueError(
            f"project_snapshot: engineVersion 이 {eng.ENGINE_VERSION} 이 아님: "
            f"{snapshot.get('engineVersion')!r} — 버전이 다른 스냅샷은 projection 하지 않는다.")
    stocks = snapshot.get("stocks")
    if not isinstance(stocks, list):
        raise ValueError("project_snapshot: 스냅샷에 stocks 배열이 없다.")
    for s in stocks:
        if "prices" in s or "volumes" in s:
            raise ValueError(
                "project_snapshot: 입력에 prices/volumes 가 있다 — 이는 엔진 요청이지 저장 스냅샷이 "
                "아니다. projection 은 저장된 raw/score/reason 만 소비한다(재계산 금지).")
        if "factors" not in s:
            raise ValueError(f"project_snapshot: 종목 {s.get('ticker')!r} 에 factors 가 없다.")


def project_snapshot(snapshot, cfg=None):
    """저장된 후보 스냅샷 dict -> 공개 후보 projection DTO. 부작용 없음·결정적.

    입력은 저장된 값과 사유 코드다(가격·거래량 배열이 있으면 거부). 점수를 다시 계산하지 않는다.
    출력 stocks 는 ticker 오름차순(순서 불변).
    """
    if cfg is None:
        cfg = load_config()
    _assert_stored_snapshot(snapshot)

    projected = []
    for stock in sorted(snapshot["stocks"], key=lambda s: str(s["ticker"])):
        factors = stock["factors"]
        projected.append({
            "ticker": str(stock["ticker"]),
            "composite": _project_composite(stock),
            "factors": {
                "momentum": project_momentum(factors["momentum"], cfg),
                "volumeActivity": project_volume_activity(factors["activity"], cfg),
                "value": project_value(factors["value"], cfg),
                "riskAdjusted": project_risk_adjusted(factors["riskAdjusted"], cfg),
            },
        })

    return {
        "projectionVersion": PROJECTION_VERSION,
        "engineVersion": eng.ENGINE_VERSION,
        "configHash": config_hash(cfg),
        "copyVersion": PROJECTION_VERSION,
        "marketDate": snapshot.get("marketDate"),
        "sourceDates": {
            "prices": (snapshot.get("sourceDates") or {}).get("prices"),
            "volumes": (snapshot.get("sourceDates") or {}).get("volumes"),
            "fundamentals": (snapshot.get("sourceDates") or {}).get("fundamentals"),
        },
        "hurdleRate": cfg["metrics"]["riskAdjusted"]["fixedAnnualHurdleRate"],
        "stocks": projected,
    }


# ---------------------------------------------------------------------------
# 문구 해석 — 레지스트리로 copyKey → {ko, en}. projection 은 언어 중립이고, 이 함수는 진단/문서용.
# ---------------------------------------------------------------------------
def resolve_copy(copy_key, locale, copy=None):
    """copyKey + locale('ko'|'en') -> 문자열. 없으면 KeyError(모든 emit key 는 레지스트리에 존재)."""
    if copy is None:
        copy = load_copy()
    entry = copy["stateCopy"].get(copy_key)
    if entry is None:
        raise KeyError(f"resolve_copy: 알 수 없는 copyKey: {copy_key!r}")
    if locale not in entry:
        raise KeyError(f"resolve_copy: copyKey {copy_key!r} 에 locale {locale!r} 없음")
    return entry[locale]


def emitted_copy_keys(projection):
    """projection DTO 가 참조하는 모든 copyKey(정렬·중복 제거)."""
    keys = set()
    for s in projection["stocks"]:
        keys.add(s["composite"]["copyKey"])
        for f in s["factors"].values():
            keys.add(f["copyKey"])
            if "hurdleRelationCopyKey" in f:
                keys.add(f["hurdleRelationCopyKey"])
    return sorted(keys)


# ---------------------------------------------------------------------------
# CLI — 저장 스냅샷 파일(예: 골든 fixture)을 projection 으로 요약(진단용; 게이트는 테스트가 강제).
# ---------------------------------------------------------------------------
def _cli(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 semantic projection (Slice I, pure — no public wiring).")
    ap.add_argument("--snapshot", help="저장된 후보 스냅샷 JSON 경로")
    ap.add_argument("--locale", default="ko", choices=["ko", "en"])
    ap.add_argument("--json", action="store_true", help="projection DTO 를 JSON 으로 출력")
    args = ap.parse_args(argv)

    if not args.snapshot:
        copy = load_copy()
        print("metrics251_projection: Slice I 순수 의미 projection. import 후 "
              "project_snapshot(stored_snapshot) 사용.")
        print(f"  projectionVersion={PROJECTION_VERSION} · copyKeys={len(copy['stateCopy'])} "
              f"· locales={copy['locales']}")
        return 0

    with open(args.snapshot, encoding="utf-8-sig") as f:
        snapshot = json.load(f)
    projection = project_snapshot(snapshot)
    if args.json:
        print(json.dumps(projection, ensure_ascii=False, indent=2, sort_keys=True))
        return 0
    copy = load_copy()
    print(f"projection {projection['projectionVersion']} · marketDate={projection['marketDate']} "
          f"· stocks={len(projection['stocks'])}")
    for s in projection["stocks"]:
        f = s["factors"]
        print(f"  {s['ticker']}: comp={s['composite']['state']} "
              f"mom={f['momentum']['state']} vol={f['volumeActivity']['state']} "
              f"val={f['value']['state']} risk={f['riskAdjusted']['state']}/"
              f"{f['riskAdjusted']['hurdleRelation']}")
        print(f"      risk: {resolve_copy(f['riskAdjusted']['copyKey'], args.locale, copy)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_cli())
