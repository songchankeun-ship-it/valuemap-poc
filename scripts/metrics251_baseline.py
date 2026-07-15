#!/usr/bin/env python3
# Metrics 2.5.1 기준선 영향 분석기 (Slice A) — 읽기 전용.
#
# 목적: 공개 Metrics 2.4 스냅샷(public/data/stocks.json)을 있는 그대로 읽어, 2.5.1 shadow
#       엔진이 나중에 사용할 numeric gate 의 "기준선(baseline)"을 결정적으로 측정한다.
#       (설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §7 Gate 0, §10 Slice A)
#
# 반드시 지키는 규칙:
#   * 입력을 수정하지 않는다. 공개 stocks.json / Metrics 2.4 산출물은 바이트 불변.
#   * 새 2.5 점수를 계산하거나 게시하지 않는다. 저장된 값만 관측한다.
#   * 결측을 50 또는 다른 지표 평균으로 채우지 않는다(설계서 §4·§M251-D02 금지).
#     현재 파이프라인이 그렇게 채우는 경로는 "관측 대상"으로 보고할 뿐, 재현하지 않는다.
#   * 양수지만 높은 재무값(PER 100·PBR 20 등)을 조용히 invalid 로 분류하지 않는다.
#     이는 QUALITY_WARNING(경고)이며 제외가 아니다(설계서 §M251-D04).
#   * 결정성: 출력은 스냅샷의 소스 기준일·바이트 해시에서만 파생한다. 벽시계 시각을 쓰지 않는다.
#     같은 입력 → 바이트 단위로 동일한 JSON/Markdown.
#   * 확립할 수 없는 필드는 unavailable + 사유로 표기한다(임의 대체 금지).
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/metrics251_baseline.py             # docs/*.json + *.md 재생성 + 요약
#   python scripts/metrics251_baseline.py --json                           # 결정적 JSON 을 stdout 으로
#   python scripts/metrics251_baseline.py --no-write                       # 파일 미기록, 요약만
import argparse
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
STOCKS_PATH = os.path.join(ROOT, "public", "data", "stocks.json")
DEFAULT_JSON_OUT = os.path.join(ROOT, "docs", "metrics-2.5.1-baseline.json")
DEFAULT_MD_OUT = os.path.join(ROOT, "docs", "metrics-2.5.1-baseline.md")

# 등가중 종합 점수를 구성하는 4개 factor. 저장 필드명은 compute_metrics/verify_metrics 와 동일.
FACTORS = ["momentum", "activity", "value", "riskAdjusted"]
FACTOR_STORED_FIELD = {
    "momentum": "momentum",
    "activity": "flow",
    "value": "value",
    "riskAdjusted": "volScore",
}
FACTOR_LABELS_KO = {
    "momentum": "추세(모멘텀)",
    "activity": "거래활성도",
    "value": "밸류",
    "riskAdjusted": "위험조정",
}

# 극단값 경고 임계 — 설계서 §3.3 / §M251-D04. 경고이지 제외가 아니다(양수는 유효로 유지).
EXTREME_THRESHOLDS = [
    {"id": "perGt100", "field": "per", "op": ">", "value": 100.0, "label": "PER > 100"},
    {"id": "perGt500", "field": "per", "op": ">", "value": 500.0, "label": "PER > 500"},
    {"id": "pbrGt20", "field": "pbr", "op": ">", "value": 20.0, "label": "PBR > 20"},
    {"id": "absRoeGt100", "field": "roe", "op": "abs>", "value": 100.0, "label": "절대값 ROE > 100"},
]

# 소스 계약 검사 대상 — 현재 파이프라인의 결측 대체(fallback)·중복 계산(duplicate calculation) 경로.
# 설계서 §3.1(계산 경로 둘)·§3.2(결측을 정상 점수처럼 보정)를 소스에서 명시적으로 확인한다.
# 각 항목은 리터럴 문자열이며, 파일 내 최초 등장 줄 번호를 증거로 기록한다. 파일이 바뀌어
# 리터럴이 사라지면 found=false 로 보고되고 리포트가 stale 로 감지된다(회귀 게이트).
SOURCE_CONTRACT_CHECKS = [
    # Python 엔진(scripts/compute_metrics.py) — 결측을 점수/평균으로 채우는 경로.
    {"id": "py-safe-avg-default50", "file": "scripts/compute_metrics.py", "kind": "fallback",
     "pattern": "def safe_avg(values, default=50):",
     "desc": "종합 평균에서 결측 factor 를 50 으로 채우는 헬퍼(default=50)."},
    {"id": "py-vol-else-50", "file": "scripts/compute_metrics.py", "kind": "fallback",
     "pattern": 'item["volScore"] = vr[0] if vr else 50',
     "desc": "위험조정 계산 불가 시 50 대체(백분위 재계산 전 임시)."},
    {"id": "py-flow-else-50", "file": "scripts/compute_metrics.py", "kind": "fallback",
     "pattern": 'item["flow"] = fr[0] if fr else 50',
     "desc": "거래활성도 계산 불가 시 50 대체."},
    {"id": "py-momentum-missing-50", "file": "scripts/compute_metrics.py", "kind": "fallback",
     "pattern": 'item["momentum"] = 50.0',
     "desc": "모멘텀 원시값 결측 시 백분위 대신 50.0 대체."},
    {"id": "py-vol-missing-50", "file": "scripts/compute_metrics.py", "kind": "fallback",
     "pattern": 'item["volScore"] = 50.0',
     "desc": "샤프 원시값 결측 시 백분위 대신 50.0 대체."},
    {"id": "py-value-factor-average", "file": "scripts/compute_metrics.py", "kind": "fallback",
     "pattern": 'item["value"] = round(sum(avail) / len(avail), 1)',
     "desc": "밸류 결측을 나머지 factor(추세·거래·위험조정) 평균으로 재가중(설계서 §4 금지 대상)."},
    {"id": "py-composite-safe-avg", "file": "scripts/compute_metrics.py", "kind": "fallback",
     "pattern": 'item["compositeScore"] = safe_avg(',
     "desc": "종합점수를 safe_avg(default=50)로 계산 — 결측이 종합에 50 으로 스며드는 경로."},
    # TypeScript 중복 계산 경로(src/lib/metrics.ts) — 파이썬 엔진과 별도로 점수를 재계산.
    {"id": "ts-duplicate-momentumRaw", "file": "src/lib/metrics.ts", "kind": "duplicate-calculation",
     "pattern": "export function momentumRaw(",
     "desc": "모멘텀 원시값을 TypeScript 에서 재계산(파이썬 엔진과 중복)."},
    {"id": "ts-duplicate-flowScore", "file": "src/lib/metrics.ts", "kind": "duplicate-calculation",
     "pattern": "export function flowScore(",
     "desc": "거래활성도 점수를 TypeScript 에서 재계산(중복)."},
    {"id": "ts-duplicate-valueScore", "file": "src/lib/metrics.ts", "kind": "duplicate-calculation",
     "pattern": "export function valueScore(",
     "desc": "밸류 점수를 TypeScript 에서 재계산(중복)."},
    {"id": "ts-duplicate-volScore", "file": "src/lib/metrics.ts", "kind": "duplicate-calculation",
     "pattern": "export function volScore(",
     "desc": "위험조정 점수를 TypeScript 에서 재계산(중복)."},
    {"id": "ts-duplicate-compositeScore", "file": "src/lib/metrics.ts", "kind": "duplicate-calculation",
     "pattern": "export function compositeScore(",
     "desc": "종합점수를 TypeScript 에서 재계산(중복)."},
    {"id": "ts-metrics-percentile-50", "file": "src/lib/metrics.ts", "kind": "fallback",
     "pattern": "if (allRaws.length === 0) return 50;",
     "desc": "백분위 모집단이 비면 50 반환."},
    {"id": "ts-metrics-flow-50", "file": "src/lib/metrics.ts", "kind": "fallback",
     "pattern": "if (volumes.length < 20) return 50;",
     "desc": "거래량 20일 미만이면 50 반환."},
    {"id": "ts-metrics-value-50", "file": "src/lib/metrics.ts", "kind": "fallback",
     "pattern": "if (per <= 0 || pbr <= 0 || peerPer.length === 0 || peerPbr.length === 0) return 50;",
     "desc": "비양수 PER/PBR 또는 빈 모집단이면 밸류 50 반환(비양수를 중립 점수로 승격)."},
    {"id": "ts-metrics-vol-60-50", "file": "src/lib/metrics.ts", "kind": "fallback",
     "pattern": "if (closes.length < 60) return 50;",
     "desc": "종가 60개 미만이면 위험조정 50 반환."},
    # 표시 어댑터(src/lib/realStocks.ts) — 저장값이 숫자가 아니면 50 으로 대체.
    {"id": "ts-realstocks-momentum-50", "file": "src/lib/realStocks.ts", "kind": "fallback",
     "pattern": 'momentum: typeof s.momentum === "number" ? s.momentum : 50,',
     "desc": "저장 momentum 이 숫자가 아니면 50 대체."},
    {"id": "ts-realstocks-flow-50", "file": "src/lib/realStocks.ts", "kind": "fallback",
     "pattern": 'flow: typeof s.flow === "number" ? s.flow : 50,',
     "desc": "저장 flow 가 숫자가 아니면 50 대체."},
    {"id": "ts-realstocks-value-50", "file": "src/lib/realStocks.ts", "kind": "fallback",
     "pattern": 'value: typeof s.value === "number" ? s.value : 50,',
     "desc": "저장 value 가 숫자가 아니면 50 대체."},
    {"id": "ts-realstocks-vol-50", "file": "src/lib/realStocks.ts", "kind": "fallback",
     "pattern": 'vol: typeof s.volScore === "number" ? s.volScore : 50,',
     "desc": "저장 volScore 가 숫자가 아니면 50 대체."},
    {"id": "ts-realstocks-composite-50", "file": "src/lib/realStocks.ts", "kind": "fallback",
     "pattern": "compositeScore: s.compositeScore ?? 50,",
     "desc": "저장 compositeScore 가 없으면 50 대체."},
]

# 단일 스냅샷만으로는 확립할 수 없는 기준선 필드 — unavailable + 사유(설계서 §13, fail-closed).
UNAVAILABLE_FIELDS = {
    "sectorExclusionDistribution":
        "업종(sector)은 src/lib/sector.ts 의 표시용 휴리스틱으로 themes 에서 파생되며 "
        "stocks.json 엔벨로프에 없다. 이 분석기에서 재현하면 계산 로직이 또 하나 생기므로"
        "(설계서 §M251-D01), 정식 sector 필드가 생기기 전까지 업종별 제외 분포는 unavailable.",
    "pointInTimeHistory":
        "지표별 252 시장일 재실행과 시점 일관 재무는 시점별 스냅샷이 필요하다(설계서 §M251-D03). "
        "현재 단일 스냅샷으로는 확립 불가 — Slice H 하네스에서 다룬다.",
}


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _read_bytes(path):
    with open(path, "rb") as f:
        return f.read()


def load_snapshot(path=STOCKS_PATH):
    raw_bytes = _read_bytes(path)
    d = json.loads(raw_bytes.decode("utf-8-sig"))
    stocks = d.get("stocks", [])
    meta = {
        "snapshotAsOf": d.get("asOfBusinessDate"),
        "generatedAt": d.get("generatedAt"),
        "pricesSyncedAt": d.get("pricesSyncedAt"),
        "metricsVersion": d.get("metricsVersion"),
        "source": d.get("source"),
        "declaredCount": d.get("count"),
        "universeCount": len(stocks),
        "inputSha256": hashlib.sha256(raw_bytes).hexdigest(),
        "inputPath": "public/data/stocks.json",
    }
    return meta, stocks


def _extreme_hit(field, op, value, s):
    x = s.get(field)
    if not _num(x):
        return False
    if op == ">":
        return x > value
    if op == "abs>":
        return abs(x) > value
    return False


def _fundamental_status(s):
    """밸류 factor 의 관측 상태(설계서 §M251-D04). 양수-이지만-높음은 QUALITY_WARNING(제외 아님)."""
    per, pbr = s.get("per"), s.get("pbr")
    per_missing = not _num(per)
    pbr_missing = not _num(pbr)
    if per_missing or pbr_missing:
        return "MISSING_INPUT"
    if per <= 0 or pbr <= 0:
        return "NON_POSITIVE_FUNDAMENTAL"
    return "VALID"


def build_report(meta, stocks):
    n = len(stocks)
    tickers = sorted(str(s.get("ticker")) for s in stocks)

    # ---- 1) PER / PBR 양수·결측·비양수 ----
    def _classify(field):
        positive, missing, non_positive = [], [], []
        for s in stocks:
            x = s.get(field)
            tk = str(s.get("ticker"))
            if not _num(x):
                missing.append(tk)
            elif x > 0:
                positive.append(tk)
            else:
                non_positive.append(tk)
        return {
            "positive": len(positive),
            "missing": len(missing),
            "nonPositive": len(non_positive),
            "missingTickers": sorted(missing),
            "nonPositiveTickers": sorted(non_positive),
        }

    per = _classify("per")
    pbr = _classify("pbr")
    both_positive = sum(
        1 for s in stocks
        if _num(s.get("per")) and s["per"] > 0 and _num(s.get("pbr")) and s["pbr"] > 0
    )

    # ---- 2) valueNA / fallback 노출 ----
    value_na_tickers = sorted(str(s.get("ticker")) for s in stocks if s.get("valueNA") is True)
    # 저장 factor 가 비-숫자여서 realStocks 50-fallback 을 실제로 트리거하는 행 수(현재).
    realstocks_fallback_triggered = {}
    for fk, field in FACTOR_STORED_FIELD.items():
        realstocks_fallback_triggered[fk] = sum(1 for s in stocks if not _num(s.get(field)))
    composite_fallback_triggered = sum(1 for s in stocks if not _num(s.get("compositeScore")))

    # ---- 3) factor 별 관측 가능 availability ----
    # 저장 점수 존재 + 뒷받침 근거(원시 통계) 존재를 모두 관측한다. 파이썬 엔진이 결측을 미리
    # 채우기 때문에 "저장 점수 존재"는 진짜 유효성을 과대평가할 수 있다 — 그래서 근거도 센다.
    def _has_returns(s):
        r = s.get("returns") or {}
        return all(_num(r.get(k)) for k in ("r1m", "r3m", "r6m"))

    def _has_flow_ratio(s):
        return _num((s.get("flowStats") or {}).get("ratio"))

    def _has_sharpe(s):
        vs = s.get("volStats") or {}
        return _num(vs.get("sharpe"))

    def _vol_days_ok(s):
        vs = s.get("volStats") or {}
        return _num(vs.get("days")) and vs["days"] >= 252

    factor_availability = {
        "momentum": {
            "storedNumeric": sum(1 for s in stocks if _num(s.get("momentum"))),
            "supportingEvidence": sum(1 for s in stocks if _has_returns(s)),
            "evidenceField": "returns.r1m/r3m/r6m",
            "note": "저장 momentum 은 백분위. 원시 수익률(returns)이 결측이면 파이썬 엔진이 50.0 으로 채운다.",
        },
        "activity": {
            "storedNumeric": sum(1 for s in stocks if _num(s.get("flow"))),
            "supportingEvidence": sum(1 for s in stocks if _has_flow_ratio(s)),
            "evidenceField": "flowStats.ratio",
            "note": "거래량 5일/20일 비율. ratio 결측이면 파이썬 엔진이 50 으로 채운다.",
        },
        "value": {
            "storedNumeric": sum(1 for s in stocks if _num(s.get("value"))),
            "supportingEvidence": both_positive,
            "evidenceField": "per>0 AND pbr>0",
            "note": "저장 value 는 PER·PBR 결측 시 나머지 factor 평균으로 재가중(valueNA=true). "
                    "진짜 유효 모집단은 per>0 AND pbr>0 인 종목뿐.",
        },
        "riskAdjusted": {
            "storedNumeric": sum(1 for s in stocks if _num(s.get("volScore"))),
            "supportingEvidence": sum(1 for s in stocks if _has_sharpe(s)),
            "evidenceField": "volStats.sharpe",
            "observedHistoryDaysGte252": sum(1 for s in stocks if _vol_days_ok(s)),
            "note": "저장 volScore 는 샤프 백분위. sharpe 결측이면 파이썬 엔진이 50.0 으로 채운다. "
                    "volStats.days 로 관측 이력 길이를 확인(252 시장일 재실행은 Slice H).",
        },
    }

    # ---- 4) 순위 자격(rankingEligible) 후보 커버리지 ----
    # 설계서 §M251-D04: 종합 순위 모집단 = 네 factor 가 모두 유효한 교집합.
    # 관측 근거로 대리한다: momentum=returns 존재, activity=ratio 존재,
    # value=per>0&pbr>0, riskAdjusted=sharpe 존재.
    def _ranking_candidate(s):
        return (
            _has_returns(s)
            and _has_flow_ratio(s)
            and (_num(s.get("per")) and s["per"] > 0 and _num(s.get("pbr")) and s["pbr"] > 0)
            and _has_sharpe(s)
        )

    ranking_candidates = [str(s.get("ticker")) for s in stocks if _ranking_candidate(s)]
    ranking_excluded = sorted(set(tickers) - set(ranking_candidates))
    # 제외 사유(binding constraint) 분해 — 어느 factor 근거가 빠져서 제외됐는지.
    exclusion_reasons = {}
    for s in stocks:
        if _ranking_candidate(s):
            continue
        tk = str(s.get("ticker"))
        reasons = []
        if not _has_returns(s):
            reasons.append("MOMENTUM_MISSING_RETURNS")
        if not _has_flow_ratio(s):
            reasons.append("ACTIVITY_MISSING_RATIO")
        fstat = _fundamental_status(s)
        if fstat != "VALID":
            reasons.append("VALUE_" + fstat)
        if not _has_sharpe(s):
            reasons.append("RISKADJ_MISSING_SHARPE")
        exclusion_reasons[tk] = reasons
    reason_counts = {}
    for reasons in exclusion_reasons.values():
        for r in reasons:
            reason_counts[r] = reason_counts.get(r, 0) + 1

    ranking = {
        "candidateCount": len(ranking_candidates),
        "excludedCount": len(ranking_excluded),
        "coveragePct": round(len(ranking_candidates) / n * 100, 2) if n else 0.0,
        "excludedTickers": ranking_excluded,
        "exclusionReasons": exclusion_reasons,
        "exclusionReasonCounts": reason_counts,
        "bindingFactor": "value",
        "note": "관측 근거 기반 후보. 실제 2.5.1 rankingEligible 은 shadow 엔진(Slice D/E)이 확정한다. "
                "여기서는 새 점수를 계산하지 않는다.",
    }

    # ---- 5) 시장/업종 제외 분포 (data permits) ----
    market_totals, market_excluded = {}, {}
    for s in stocks:
        mk = s.get("market") or "UNKNOWN"
        market_totals[mk] = market_totals.get(mk, 0) + 1
        if not _ranking_candidate(s):
            market_excluded[mk] = market_excluded.get(mk, 0) + 1
    market_distribution = {
        "totalsByMarket": dict(sorted(market_totals.items())),
        "rankingExcludedByMarket": dict(sorted(market_excluded.items())),
    }

    # ---- 6) 극단값 카운트·예시 ----
    extremes = {}
    for t in EXTREME_THRESHOLDS:
        hits = sorted(
            (str(s.get("ticker")), round(float(s.get(t["field"])), 2))
            for s in stocks if _extreme_hit(t["field"], t["op"], t["value"], s)
        )
        extremes[t["id"]] = {
            "label": t["label"],
            "field": t["field"],
            "threshold": t["value"],
            "op": t["op"],
            "count": len(hits),
            "examples": [{"ticker": tk, "value": v} for tk, v in hits],
        }

    # ---- 7) 소스 계약 검사(중복 계산 / fallback 경로) ----
    contract = _run_source_contract_checks()

    return {
        "meta": {
            **meta,
            "reportKind": "metrics-2.5.1-baseline-impact",
            "readOnly": True,
            "computesNewScore": False,
            "publicMetricsVersionUnchanged": meta.get("metricsVersion"),
            "note": "읽기 전용 기준선. 새 2.5 점수를 계산·게시하지 않고, 결측을 채우지 않는다.",
            "factors": FACTORS,
        },
        "fundamentals": {
            "per": per,
            "pbr": pbr,
            "bothPositive": both_positive,
            "valueExcludedByPositivityRule": n - both_positive,
            "positivityRule": "per>0 AND pbr>0 (설계서 §3.3 / calc_value 조건과 동일).",
        },
        "valueFallbackExposure": {
            "valueNaCount": len(value_na_tickers),
            "valueNaTickers": value_na_tickers,
            "realStocksFallbackTriggeredByFactor": realstocks_fallback_triggered,
            "compositeFallbackTriggered": composite_fallback_triggered,
            "note": "valueNA=true 는 현재 파이프라인이 밸류 결측을 나머지 factor 평균으로 재가중해 "
                    "숫자로 저장했음을 뜻한다. 그래서 realStocks 의 비-숫자 50-fallback 은 현재 0 회 "
                    "트리거되지만(파이썬이 미리 채움), 2.5.1 은 이런 대체를 금지한다.",
        },
        "factorAvailability": factor_availability,
        "rankingEligibility": ranking,
        "marketExclusionDistribution": market_distribution,
        "extremeValues": extremes,
        "sourceContractPaths": contract,
        "unavailableFields": {
            k: {"available": False, "reason": v} for k, v in UNAVAILABLE_FIELDS.items()
        },
    }


def _run_source_contract_checks():
    results = []
    # 파일별로 한 번만 읽어 재사용.
    file_lines = {}
    for chk in SOURCE_CONTRACT_CHECKS:
        rel = chk["file"]
        if rel not in file_lines:
            fp = os.path.join(ROOT, rel)
            try:
                text = open(fp, encoding="utf-8").read()
            except (OSError, UnicodeDecodeError):
                file_lines[rel] = None
            else:
                file_lines[rel] = text.splitlines()
        lines = file_lines[rel]
        line_no = None
        if lines is not None:
            for i, ln in enumerate(lines, start=1):
                if chk["pattern"] in ln:
                    line_no = i
                    break
        results.append({
            "id": chk["id"],
            "file": rel,
            "kind": chk["kind"],
            "description": chk["desc"],
            "found": line_no is not None,
            "line": line_no,
        })
    results.sort(key=lambda r: r["id"])
    found = sum(1 for r in results if r["found"])
    return {
        "checks": results,
        "totalChecks": len(results),
        "found": found,
        "missing": len(results) - found,
        "fallbackPaths": sum(1 for r in results if r["found"] and r["kind"] == "fallback"),
        "duplicateCalculationPaths": sum(
            1 for r in results if r["found"] and r["kind"] == "duplicate-calculation"),
        "note": "리터럴 소스 계약 검사. found=false 는 해당 경로가 사라졌거나(개선) 파일이 바뀌었음을 뜻하며, "
                "커밋된 리포트를 stale 로 만들어 재생성을 강제한다.",
    }


def render_markdown(report):
    m = report["meta"]
    f = report["fundamentals"]
    L = []
    L.append("# Metrics 2.5.1 기준선 영향 분석 (Slice A)")
    L.append("")
    L.append("> 이 문서는 `scripts/metrics251_baseline.py` 가 공개 스냅샷에서 **결정적으로 재생성**합니다.")
    L.append("> 손으로 수정하지 마세요. 같은 스냅샷이면 JSON/Markdown 출력이 바이트 단위로 동일합니다.")
    L.append("")
    L.append("**읽기 전용 기준선입니다.** 새 Metrics 2.5 점수를 계산하거나 게시하지 않고, 결측을 50 또는 "
             "다른 factor 평균으로 채우지 않습니다. 공개 Metrics 2.4 는 그대로 정본입니다.")
    L.append("")
    L.append(f"- 스냅샷 기준일: `{m.get('snapshotAsOf')}` · 지표 버전: `{m.get('metricsVersion')}` · 소스: `{m.get('source')}`")
    L.append(f"- 유니버스: {m.get('universeCount')}종목 (선언 count `{m.get('declaredCount')}`)")
    L.append(f"- 입력 SHA-256: `{m.get('inputSha256')}`")
    L.append(f"- 입력 파일: `{m.get('inputPath')}` (미수정)")
    L.append("")

    L.append("## 1. PER / PBR 양수·결측·비양수")
    L.append("")
    L.append("| 항목 | 양수(>0) | 결측 | 비양수(≤0) |")
    L.append("|---|---:|---:|---:|")
    L.append(f"| PER | {f['per']['positive']} | {f['per']['missing']} | {f['per']['nonPositive']} |")
    L.append(f"| PBR | {f['pbr']['positive']} | {f['pbr']['missing']} | {f['pbr']['nonPositive']} |")
    L.append("")
    L.append(f"- PER·PBR 모두 양수: **{f['bothPositive']}** / {m.get('universeCount')}")
    L.append(f"- 양수 규칙(`{f['positivityRule']}`)으로 밸류 제외: **{f['valueExcludedByPositivityRule']}**")
    if f["per"]["missingTickers"]:
        L.append(f"- PER 결측 티커: {', '.join('`'+t+'`' for t in f['per']['missingTickers'])}")
    if f["pbr"]["missingTickers"]:
        L.append(f"- PBR 결측 티커: {', '.join('`'+t+'`' for t in f['pbr']['missingTickers'])}")
    L.append("")

    vf = report["valueFallbackExposure"]
    L.append("## 2. valueNA / fallback 노출")
    L.append("")
    L.append(f"- 현재 `valueNA=true` (밸류 결측을 factor 평균으로 재가중): **{vf['valueNaCount']}**")
    if vf["valueNaTickers"]:
        L.append(f"  - 티커: {', '.join('`'+t+'`' for t in vf['valueNaTickers'])}")
    L.append(f"- realStocks 비-숫자 50-fallback 현재 트리거 수(factor별): "
             + ", ".join(f"{k}={vf['realStocksFallbackTriggeredByFactor'][k]}" for k in FACTORS))
    L.append(f"- compositeScore 50-fallback 현재 트리거 수: {vf['compositeFallbackTriggered']}")
    L.append("")
    L.append(f"> {vf['note']}")
    L.append("")

    L.append("## 3. factor 별 관측 availability")
    L.append("")
    L.append("| factor | 저장 숫자 | 뒷받침 근거 | 근거 필드 |")
    L.append("|---|---:|---:|---|")
    fa = report["factorAvailability"]
    for k in FACTORS:
        a = fa[k]
        L.append(f"| {k} ({FACTOR_LABELS_KO[k]}) | {a['storedNumeric']} | {a['supportingEvidence']} | `{a['evidenceField']}` |")
    L.append("")
    L.append(f"- 위험조정 관측 이력 ≥252 시장일: {fa['riskAdjusted'].get('observedHistoryDaysGte252')}")
    L.append("")
    L.append("> 파이썬 엔진이 결측을 미리 채우므로 '저장 숫자'는 진짜 유효성을 과대평가할 수 있습니다. "
             "그래서 원시 근거(returns·ratio·sharpe·PER·PBR)도 함께 셉니다.")
    L.append("")

    r = report["rankingEligibility"]
    L.append("## 4. 순위 자격(rankingEligible) 후보 커버리지")
    L.append("")
    L.append(f"- 네 factor 근거가 모두 유효한 교집합 후보: **{r['candidateCount']}** / {m.get('universeCount')} "
             f"(**{r['coveragePct']}%**)")
    L.append(f"- 제외: **{r['excludedCount']}** · binding factor: `{r['bindingFactor']}`")
    if r["excludedTickers"]:
        L.append(f"- 제외 티커: {', '.join('`'+t+'`' for t in r['excludedTickers'])}")
    if r["exclusionReasonCounts"]:
        L.append("- 제외 사유 카운트: "
                 + ", ".join(f"`{k}`={v}" for k, v in sorted(r["exclusionReasonCounts"].items())))
    L.append("")
    L.append(f"> {r['note']}")
    L.append("")

    md = report["marketExclusionDistribution"]
    L.append("## 5. 시장별 제외 분포 (data permits)")
    L.append("")
    L.append("| 시장 | 전체 | 순위 후보 제외 |")
    L.append("|---|---:|---:|")
    for mk in md["totalsByMarket"]:
        L.append(f"| {mk} | {md['totalsByMarket'][mk]} | {md['rankingExcludedByMarket'].get(mk, 0)} |")
    L.append("")

    L.append("## 6. 극단값 카운트·예시")
    L.append("")
    L.append("설계서 §M251-D04 — 양수이지만 높은 값은 **경고(QUALITY_WARNING)**이며 제외가 아닙니다. "
             "임의 상한으로 자르지 않고 소스 검증은 사람 검수(오너 게이트)로 남깁니다.")
    L.append("")
    L.append("| 조건 | 종목 수 | 예시 티커 |")
    L.append("|---|---:|---|")
    ev = report["extremeValues"]
    for t in EXTREME_THRESHOLDS:
        e = ev[t["id"]]
        ex = ", ".join(f"`{x['ticker']}`({x['value']})" for x in e["examples"][:12])
        if e["count"] > 12:
            ex += f", … (+{e['count'] - 12})"
        L.append(f"| {e['label']} | {e['count']} | {ex} |")
    L.append("")

    sc = report["sourceContractPaths"]
    L.append("## 7. 현재 소스 계약 경로 (중복 계산 / fallback)")
    L.append("")
    L.append(f"- 총 검사 {sc['totalChecks']} · 발견 {sc['found']} · 누락 {sc['missing']}")
    L.append(f"- fallback 경로 {sc['fallbackPaths']} · 중복 계산 경로 {sc['duplicateCalculationPaths']}")
    L.append("")
    L.append("| id | 파일 | 종류 | 줄 | 설명 |")
    L.append("|---|---|---|---:|---|")
    for c in sc["checks"]:
        line = c["line"] if c["found"] else "—"
        L.append(f"| `{c['id']}` | `{c['file']}` | {c['kind']} | {line} | {c['description']} |")
    L.append("")
    L.append(f"> {sc['note']}")
    L.append("")

    L.append("## 8. 확립 불가 필드 (unavailable)")
    L.append("")
    L.append("아래 값은 단일 스냅샷만으로 확립할 수 없어 **표시하지 않으며, 현재 데이터로 대체하지 않습니다.**")
    L.append("")
    L.append("| 필드 | 상태 | 사유 |")
    L.append("|---|---|---|")
    for k, v in report["unavailableFields"].items():
        L.append(f"| {k} | unavailable | {v['reason']} |")
    L.append("")
    return "\n".join(L) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Metrics 2.5.1 baseline impact analyzer (read-only, deterministic).")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 을 stdout 으로 출력")
    ap.add_argument("--json-out", default=DEFAULT_JSON_OUT, help="JSON 리포트 출력 경로")
    ap.add_argument("--out", default=DEFAULT_MD_OUT, help="Markdown 리포트 출력 경로")
    ap.add_argument("--no-write", action="store_true", help="파일을 쓰지 않고 요약만 출력")
    args = ap.parse_args(argv)

    meta, stocks = load_snapshot()
    if not stocks:
        print("metrics251_baseline: 분석할 종목이 없습니다.", file=sys.stderr)
        return 1
    report = build_report(meta, stocks)

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
        print(f"metrics251_baseline: {os.path.relpath(args.json_out, ROOT)} + "
              f"{os.path.relpath(args.out, ROOT)} 재생성 완료.")

    r = report["rankingEligibility"]
    print(f"  스냅샷 {meta['snapshotAsOf']} · {meta['universeCount']}종목 · "
          f"PER>0 {report['fundamentals']['per']['positive']} · PBR>0 {report['fundamentals']['pbr']['positive']} · "
          f"밸류제외 {report['fundamentals']['valueExcludedByPositivityRule']} · "
          f"순위후보 {r['candidateCount']} ({r['coveragePct']}%) · "
          f"소스계약 fallback {report['sourceContractPaths']['fallbackPaths']}/"
          f"중복계산 {report['sourceContractPaths']['duplicateCalculationPaths']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
