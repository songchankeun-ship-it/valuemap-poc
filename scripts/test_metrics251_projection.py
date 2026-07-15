#!/usr/bin/env python3
# Metrics 2.5.1 의미 projection·문구 key·부호 안전 게이트 — Slice I.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D06, §10 Slice I,
#   원안 티켓 ORN-2505/2506):
#   SCHEMA. projection DTO 가 config/metrics/2.5.1.projection.schema.json 을 통과한다.
#   COPY.   projection 이 참조하는 모든 copyKey 가 레지스트리에 존재하고, 한/영 문자열이 모두
#           비어있지 않으며(경계), 같은 key 의 ko≠en, U+FFFD 0.
#   NAME.   거래활성도 긍정 문구에 가격/매수·매도/유동성·자금유입 언어 없음. 위험조정 긍정 문구에
#           안전/무위험/보장 언어 없음. 명칭·부인은 3.5% 고정 기준수익률·구조적 deniedMeanings 로 고정.
#   SIGN.   음수 모멘텀 원시값 → 절대 UP 아님(DOWN). 위험조정 hurdleRelation 은 저장 원시값 부호와
#           일치(raw<0→BELOW). 상대 band 와 절대 hurdle 은 별개(둘이 어긋나는 사례 존재).
#   STORED. project_snapshot 은 저장된 raw/score/reason 만 소비 — 가격·거래량 입력·버전 불일치 거부.
#           결측 factor 는 UNAVAILABLE + 사유 보존(50/평균/중립 대체 없음).
#   DET.    같은 스냅샷 → 바이트 동일 projection. PURE. 소스에 벽시계/난수/네트워크/공개경로 없음.
#
# Usage: $env:PYTHONUTF8='1'; python scripts/test_metrics251_projection.py
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_projection as proj  # noqa: E402
import metrics251_engine as eng  # noqa: E402
from metrics251_config import validate_against_schema  # noqa: E402

CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
COPY_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.copy.json")
PROJECTION_SCHEMA_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.projection.schema.json")
GOLDEN_SNAPSHOT_PATH = os.path.join(HERE, "fixtures", "metrics251", "golden_snapshot.json")
SOURCE_PATH = os.path.join(HERE, "metrics251_projection.py")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def load_json(path):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


CFG = load_json(CONFIG_PATH)
COPY = load_json(COPY_PATH)
GOLDEN = load_json(GOLDEN_SNAPSHOT_PATH)


def make_stock(ticker, *, mom=None, mom_reason=eng.VALID, mom_score=None,
               act=None, act_reason=eng.VALID, act_score=None,
               val_score=None, val_reason=eng.VALID,
               risk=None, risk_reason=eng.VALID, risk_score=None,
               composite=None, ranking=False):
    """저장 스냅샷 종목 dict(엔진 출력 모양)를 결정적으로 조립. 원시 입력(prices/volumes) 없음."""
    return {
        "ticker": ticker,
        "compositeScore": composite,
        "rankingEligible": ranking,
        "eligibilityReasons": {},
        "factors": {
            "momentum": {"factor": "momentum", "reason": mom_reason, "raw": mom, "score": mom_score},
            "activity": {"factor": "activity", "reason": act_reason, "raw": act, "score": act_score},
            "value": {"factor": "value", "reason": val_reason, "raw": None, "score": val_score},
            "riskAdjusted": {"factor": "riskAdjusted", "reason": risk_reason, "raw": risk, "score": risk_score},
        },
    }


def make_snapshot(stocks, *, engine_version=eng.ENGINE_VERSION, market_date="2026-07-15"):
    return {
        "engineVersion": engine_version,
        "marketDate": market_date,
        "sourceDates": {"prices": "2026-07-14", "volumes": "2026-07-14", "fundamentals": "2026-07-13"},
        "stocks": stocks,
    }


# ===========================================================================
# SCHEMA — golden 스냅샷 projection 이 DTO 스키마를 통과.
# ===========================================================================
def test_schema():
    schema = load_json(PROJECTION_SCHEMA_PATH)
    projection = proj.project_snapshot(GOLDEN, CFG)
    errors = validate_against_schema(projection, schema)
    check(not errors, f"SCHEMA: golden projection 스키마 위반: {errors[:5]}")

    # 인위적 결측 종목도 스키마를 통과해야 한다(UNAVAILABLE 상태·null source).
    snap = make_snapshot([make_stock("Z_MISS", mom_reason=eng.MISSING_INPUT,
                                     act_reason=eng.INSUFFICIENT_HISTORY,
                                     val_reason=eng.MISSING_INPUT,
                                     risk_reason=eng.ZERO_VARIANCE)])
    errors2 = validate_against_schema(proj.project_snapshot(snap, CFG), schema)
    check(not errors2, f"SCHEMA: 결측 projection 스키마 위반: {errors2[:5]}")


# ===========================================================================
# COPY — 모든 emit copyKey 존재 · 한/영 경계 · ko≠en · U+FFFD 0.
# ===========================================================================
def test_copy_registry():
    projection = proj.project_snapshot(GOLDEN, CFG)
    emitted = proj.emitted_copy_keys(projection)
    registry = COPY["stateCopy"]
    for k in emitted:
        check(k in registry, f"COPY: emit 된 copyKey 가 레지스트리에 없음: {k}")

    # 레지스트리 stateCopy 전 항목: ko/en 존재·비어있지 않음·서로 다름(경계)·U+FFFD 없음.
    for key, entry in registry.items():
        for loc in ("ko", "en"):
            check(loc in entry and isinstance(entry[loc], str) and entry[loc].strip(),
                  f"COPY: {key}.{loc} 비어있음/누락")
            check("�" not in entry.get(loc, ""), f"COPY: {key}.{loc} 에 U+FFFD")
        check(entry.get("ko") != entry.get("en"), f"COPY: {key} ko==en (경계 미분리)")

    # factorLabels 이름·부인도 한/영 경계·U+FFFD 0.
    for fk, label in COPY["factorLabels"].items():
        for loc in ("ko", "en"):
            check(label["name"].get(loc, "").strip(), f"COPY: factorLabels.{fk}.name.{loc} 비어있음")
            check("�" not in label["name"].get(loc, ""), f"COPY: factorLabels.{fk}.name.{loc} U+FFFD")
        check(label["name"]["ko"] != label["name"]["en"], f"COPY: factorLabels.{fk}.name ko==en")

    # 실제로 KeyError 없이 한/영 모두 해석 가능(경계 왕복).
    for k in emitted:
        for loc in ("ko", "en"):
            try:
                s = proj.resolve_copy(k, loc, COPY)
                check(bool(s.strip()), f"COPY: resolve {k}.{loc} 빈 문자열")
            except KeyError as e:
                check(False, f"COPY: resolve 실패 {k}.{loc}: {e}")

    check(COPY.get("copyVersion") == proj.PROJECTION_VERSION,
          "COPY: copyVersion 이 PROJECTION_VERSION 과 불일치")


# ===========================================================================
# NAME — 명칭·부인. 거래활성도/위험조정 긍정 문구에 금지어 없음. 3.5%·구조적 부인 존재.
# ===========================================================================
def _affirmative_strings(prefix):
    """stateCopy 중 prefix 로 시작하는 항목의 ko+en 문자열(부인·정의 문구는 제외 — 긍정 문구만)."""
    out = []
    for key, entry in COPY["stateCopy"].items():
        if key.startswith(prefix):
            out.extend([entry["ko"], entry["en"]])
    return out


def test_naming_and_denials():
    # (a) 거래활성도 긍정 문구(이름 + volumeActivity.state.*)에 매수·매도/유동성·자금/가격 언어 없음.
    va_affirmative = _affirmative_strings("volumeActivity.state.")
    va_affirmative += [COPY["factorLabels"]["volumeActivity"]["name"]["ko"],
                       COPY["factorLabels"]["volumeActivity"]["name"]["en"]]
    va_forbidden_ko = ["매수", "매도", "유동성", "자금", "매수세", "주가", "가격"]
    va_forbidden_en = ["buy", "sell", "liquid", "inflow", "buying pressure", "price direction",
                       "buyer", "seller"]
    for s in va_affirmative:
        low = s.lower()
        for term in va_forbidden_ko:
            check(term not in s, f"NAME: 거래활성도 긍정 문구에 금지어(ko) '{term}': {s}")
        for term in va_forbidden_en:
            check(term not in low, f"NAME: 거래활성도 긍정 문구에 금지어(en) '{term}': {s}")

    # (b) 위험조정 긍정 문구(이름 + riskEfficiency.band.* + riskEfficiency.hurdle.*)에 안전/무위험/보장 없음.
    ra_affirmative = _affirmative_strings("riskEfficiency.band.") + _affirmative_strings("riskEfficiency.hurdle.")
    ra_affirmative += [COPY["factorLabels"]["riskAdjusted"]["name"]["ko"],
                       COPY["factorLabels"]["riskAdjusted"]["name"]["en"]]
    ra_forbidden_ko = ["안전", "무위험", "보장"]
    ra_forbidden_en = ["risk-free", "safe", "guarantee"]
    for s in ra_affirmative:
        low = s.lower()
        for term in ra_forbidden_ko:
            check(term not in s, f"NAME: 위험조정 긍정 문구에 금지어(ko) '{term}': {s}")
        for term in ra_forbidden_en:
            check(term not in low, f"NAME: 위험조정 긍정 문구에 금지어(en) '{term}': {s}")

    # (c) 긍정 명명: 위험조정 이름·hurdle 정의에 3.5% 명시(고정 기준수익률).
    ra_name = COPY["factorLabels"]["riskAdjusted"]["name"]
    hurdle_def = COPY["factorLabels"]["riskAdjusted"]["hurdleDefinition"]
    check("3.5%" in ra_name["ko"] and "3.5%" in ra_name["en"], "NAME: 위험조정 이름에 3.5% 없음")
    check("3.5%" in hurdle_def["ko"] and "3.5%" in hurdle_def["en"], "NAME: hurdle 정의에 3.5% 없음")
    check("고정" in hurdle_def["ko"], "NAME: hurdle 정의(ko)에 '고정' 없음")
    check("not the latest" in hurdle_def["en"].lower(), "NAME: hurdle 정의(en)에 not-latest 부인 없음")

    # (d) 부인(denies)은 부인 대상을 명시적으로 언급해야 한다(부인 문구에는 금지어가 허용됨).
    va_denies = COPY["factorLabels"]["volumeActivity"]["denies"]
    check(any("가격" in d for d in va_denies["ko"]) and any("매수" in d or "매도" in d for d in va_denies["ko"]),
          "NAME: 거래활성도 부인(ko)이 가격·매수/매도를 명시하지 않음")
    check(any("price" in d.lower() for d in va_denies["en"])
          and any("buy" in d.lower() for d in va_denies["en"]),
          "NAME: 거래활성도 부인(en)이 price·buy 를 명시하지 않음")
    ra_denies = COPY["factorLabels"]["riskAdjusted"]["denies"]
    check(any("안전" in d for d in ra_denies["ko"]) and any("무위험" in d for d in ra_denies["ko"]),
          "NAME: 위험조정 부인(ko)이 안전·무위험을 명시하지 않음")
    check(any("safe" in d.lower() for d in ra_denies["en"])
          and any("risk-free" in d.lower() for d in ra_denies["en"]),
          "NAME: 위험조정 부인(en)이 safe·risk-free 를 명시하지 않음")

    # (e) 구조적 deniedMeanings — projection DTO 의 모든 종목에서 항상 존재(코드로 박힘).
    projection = proj.project_snapshot(GOLDEN, CFG)
    for s in projection["stocks"]:
        va = s["factors"]["volumeActivity"]
        ra = s["factors"]["riskAdjusted"]
        check("priceDirection" in va["deniedMeanings"] and "buyerIdentity" in va["deniedMeanings"],
              f"NAME: {s['ticker']} volumeActivity deniedMeanings 에 priceDirection/buyerIdentity 없음")
        check("liquidity" in va["deniedMeanings"] and "fundInflow" in va["deniedMeanings"]
              and "buyingPressure" in va["deniedMeanings"],
              f"NAME: {s['ticker']} volumeActivity deniedMeanings 불완전")
        check("latestRiskFreeRate" in ra["deniedMeanings"] and "safetyGuarantee" in ra["deniedMeanings"],
              f"NAME: {s['ticker']} riskAdjusted deniedMeanings 에 latestRiskFreeRate/safetyGuarantee 없음")
        check(ra["hurdleRate"] == CFG["metrics"]["riskAdjusted"]["fixedAnnualHurdleRate"],
              f"NAME: {s['ticker']} hurdleRate 가 config fixedAnnualHurdleRate 와 불일치")


# ===========================================================================
# SIGN — 부호 안전. 음수 모멘텀 → 절대 UP 아님. hurdle 관계는 원시값 부호와 일치.
# ===========================================================================
def test_sign_safety():
    # 모멘텀: 원시값 부호별 방향(flat 경계 = config directionFlatThresholdPct = 1.0% = raw 0.01).
    cases = [
        (-0.50, "DOWN"), (-0.02, "DOWN"), (-0.0101, "DOWN"),
        (-0.005, "FLAT"), (0.0, "FLAT"), (0.005, "FLAT"),
        (0.0101, "UP"), (0.02, "UP"), (0.50, "UP"),
    ]
    for raw, expected in cases:
        p = proj.project_momentum({"factor": "momentum", "reason": eng.VALID, "raw": raw, "score": 50.0}, CFG)
        check(p["state"] == expected, f"SIGN: momentum raw={raw} 기대 {expected}, 실제 {p['state']}")
        if raw < 0:
            check(p["state"] != "UP", f"SIGN: 음수 모멘텀 raw={raw} 가 UP 로 표시됨(부호 위반)")

    # 위험조정 hurdleRelation: 저장 원시값 부호와 정확히 일치(band/점수와 무관).
    for raw, rel in [(-500.0, "BELOW"), (-0.0001, "BELOW"), (0.0, "AT"), (0.0001, "ABOVE"), (500.0, "ABOVE")]:
        p = proj.project_risk_adjusted(
            {"factor": "riskAdjusted", "reason": eng.VALID, "raw": raw, "score": 80.0}, CFG)
        check(p["hurdleRelation"] == rel, f"SIGN: risk raw={raw} 기대 hurdle {rel}, 실제 {p['hurdleRelation']}")

    # 상대 band 와 절대 hurdle 은 별개 — 저평가 백분위(LOW)인데 원시값은 양수(ABOVE)인 사례가 성립.
    p = proj.project_risk_adjusted(
        {"factor": "riskAdjusted", "reason": eng.VALID, "raw": 0.4, "score": 5.0}, CFG)
    check(p["state"] == "LOW" and p["hurdleRelation"] == "ABOVE",
          f"SIGN: band/hurdle 독립성 실패: state={p['state']} rel={p['hurdleRelation']}")

    # 반대로 상위 백분위(HIGH)인데 원시값 음수(BELOW)도 성립(유니버스 전체가 hurdle 아래일 때).
    p2 = proj.project_risk_adjusted(
        {"factor": "riskAdjusted", "reason": eng.VALID, "raw": -0.1, "score": 95.0}, CFG)
    check(p2["state"] == "HIGH" and p2["hurdleRelation"] == "BELOW",
          f"SIGN: band/hurdle 독립성(역) 실패: state={p2['state']} rel={p2['hurdleRelation']}")


# ===========================================================================
# STORED — 저장 값만 소비. 재계산 입력·버전 불일치 거부. 결측은 UNAVAILABLE + 사유(대체 없음).
# ===========================================================================
def test_stored_input_only():
    # 가격·거래량 배열이 있는 입력(=엔진 요청)은 거부.
    bad = make_snapshot([make_stock("A", mom=0.1, ranking=True)])
    bad["stocks"][0]["prices"] = [1.0, 2.0, 3.0]
    try:
        proj.project_snapshot(bad, CFG)
        check(False, "STORED: prices 포함 입력을 거부하지 않음(재계산 방지 실패)")
    except ValueError:
        pass

    bad2 = make_snapshot([make_stock("A", act=1.0)])
    bad2["stocks"][0]["volumes"] = [10, 20]
    try:
        proj.project_snapshot(bad2, CFG)
        check(False, "STORED: volumes 포함 입력을 거부하지 않음")
    except ValueError:
        pass

    # 엔진 버전 불일치 스냅샷 거부.
    try:
        proj.project_snapshot(make_snapshot([make_stock("A")], engine_version="2.4"), CFG)
        check(False, "STORED: engineVersion 불일치 스냅샷을 거부하지 않음")
    except ValueError:
        pass

    # 결측 factor → UNAVAILABLE + 사유 보존, sourceScore None(50/중립 대체 없음).
    snap = make_snapshot([make_stock(
        "M", mom_reason=eng.MISSING_INPUT, act_reason=eng.INSUFFICIENT_HISTORY,
        val_reason=eng.NON_POSITIVE_FUNDAMENTAL, risk_reason=eng.ZERO_VARIANCE)])
    p = proj.project_snapshot(snap, CFG)["stocks"][0]
    f = p["factors"]
    check(f["momentum"]["state"] == "UNAVAILABLE" and f["momentum"]["sourceReason"] == eng.MISSING_INPUT,
          "STORED: 결측 모멘텀이 UNAVAILABLE+사유로 표시되지 않음")
    check(f["volumeActivity"]["state"] == "UNAVAILABLE"
          and f["volumeActivity"]["sourceReason"] == eng.INSUFFICIENT_HISTORY,
          "STORED: 결측 거래활성도가 UNAVAILABLE+사유로 표시되지 않음")
    check(f["value"]["state"] == "UNAVAILABLE" and f["value"]["sourceReason"] == eng.NON_POSITIVE_FUNDAMENTAL,
          "STORED: 결측 밸류가 UNAVAILABLE+사유로 표시되지 않음")
    check(f["riskAdjusted"]["state"] == "UNAVAILABLE"
          and f["riskAdjusted"]["hurdleRelation"] == "UNAVAILABLE",
          "STORED: 결측 위험조정이 UNAVAILABLE 로 표시되지 않음")
    for fk in ("momentum", "volumeActivity", "value", "riskAdjusted"):
        check(f[fk]["sourceScore"] is None, f"STORED: 결측 {fk} sourceScore 가 None 이 아님(대체 의심)")
        check(50 not in [f[fk].get("sourceScore")], f"STORED: 결측 {fk} 에 50 대체 흔적")

    # 결측 종합 → WITHHELD.
    check(p["composite"]["state"] == "WITHHELD" and p["composite"]["rankingEligible"] is False,
          "STORED: 결측 종합이 WITHHELD 로 표시되지 않음")

    # 소스가 재계산 산식을 호출하지 않음(엔진 compute_snapshot 미사용).
    with open(SOURCE_PATH, encoding="utf-8") as fsrc:
        src = fsrc.read()
    check("compute_snapshot" not in src, "STORED: projection 소스가 compute_snapshot 을 호출/참조(재계산 의심)")


# ===========================================================================
# THRESHOLD — 의미 임계는 config.semanticRules 단일 출처(경계값 매핑 정확).
# ===========================================================================
def test_thresholds_from_config():
    # 거래활성도 경계(activityStates): 0.49→VERY_LOW, 0.50→DECREASED, 0.80→NORMAL, 1.20→INCREASED,
    #   1.50→SIGNIFICANT_INCREASE, 2.00→SURGE.
    va_cases = [(0.49, "VERY_LOW"), (0.50, "DECREASED"), (0.79, "DECREASED"), (0.80, "NORMAL"),
                (1.19, "NORMAL"), (1.20, "INCREASED"), (1.49, "INCREASED"),
                (1.50, "SIGNIFICANT_INCREASE"), (1.99, "SIGNIFICANT_INCREASE"), (2.00, "SURGE"), (9.0, "SURGE")]
    for ratio, expected in va_cases:
        p = proj.project_volume_activity(
            {"factor": "activity", "reason": eng.VALID, "raw": ratio, "score": 50.0}, CFG)
        check(p["state"] == expected, f"THRESHOLD: activity ratio={ratio} 기대 {expected}, 실제 {p['state']}")

    # 위험효율 band(riskEfficiencyBands): 점수 0→LOW, 29.9→LOW, 30→NEUTRAL, 69.9→NEUTRAL, 70→HIGH, 100→HIGH.
    rb_cases = [(0.0, "LOW"), (29.9, "LOW"), (30.0, "NEUTRAL"), (69.9, "NEUTRAL"), (70.0, "HIGH"), (100.0, "HIGH")]
    for score, expected in rb_cases:
        p = proj.project_risk_adjusted(
            {"factor": "riskAdjusted", "reason": eng.VALID, "raw": 1.0, "score": score}, CFG)
        check(p["state"] == expected, f"THRESHOLD: risk score={score} 기대 {expected}, 실제 {p['state']}")


# ===========================================================================
# GOLDEN — 알려진 종목 상태 회귀 가드.
# ===========================================================================
def test_golden_regression():
    projection = proj.project_snapshot(GOLDEN, CFG)
    by_ticker = {s["ticker"]: s for s in projection["stocks"]}
    expect = {
        "A_RISE": ("ELIGIBLE", "UP", "NORMAL", "PRESENT", "NEUTRAL", "ABOVE"),
        "C_FALL": ("ELIGIBLE", "DOWN", "DECREASED", "PRESENT", "LOW", "BELOW"),
        "F_NOPER": ("WITHHELD", "UP", "NORMAL", "UNAVAILABLE", "NEUTRAL", "ABOVE"),
        "H_SHORT": ("WITHHELD", "UP", "NORMAL", "PRESENT", "UNAVAILABLE", "UNAVAILABLE"),
        "I_SHORTVOL": ("WITHHELD", "UP", "UNAVAILABLE", "PRESENT", "NEUTRAL", "ABOVE"),
    }
    for tk, (comp, mom, vol, val, band, rel) in expect.items():
        s = by_ticker.get(tk)
        check(s is not None, f"GOLDEN: 종목 {tk} 없음")
        if s is None:
            continue
        f = s["factors"]
        check(s["composite"]["state"] == comp, f"GOLDEN: {tk} composite {s['composite']['state']}≠{comp}")
        check(f["momentum"]["state"] == mom, f"GOLDEN: {tk} momentum {f['momentum']['state']}≠{mom}")
        check(f["volumeActivity"]["state"] == vol, f"GOLDEN: {tk} volumeActivity {f['volumeActivity']['state']}≠{vol}")
        check(f["value"]["state"] == val, f"GOLDEN: {tk} value {f['value']['state']}≠{val}")
        check(f["riskAdjusted"]["state"] == band, f"GOLDEN: {tk} risk band {f['riskAdjusted']['state']}≠{band}")
        check(f["riskAdjusted"]["hurdleRelation"] == rel, f"GOLDEN: {tk} hurdle {f['riskAdjusted']['hurdleRelation']}≠{rel}")


# ===========================================================================
# DET — 결정성(같은 입력 → 바이트 동일 projection).
# ===========================================================================
def test_determinism():
    a = json.dumps(proj.project_snapshot(GOLDEN, CFG), ensure_ascii=False, sort_keys=True)
    b = json.dumps(proj.project_snapshot(GOLDEN, CFG), ensure_ascii=False, sort_keys=True)
    check(a == b, "DET: 같은 스냅샷 projection 이 바이트 동일하지 않음")

    # 입력 종목 순서를 뒤집어도 출력은 ticker 정렬로 동일(순서 불변).
    reversed_snap = make_snapshot(list(reversed(GOLDEN["stocks"])),
                                  market_date=GOLDEN["marketDate"])
    reversed_snap["sourceDates"] = GOLDEN["sourceDates"]
    c = json.dumps(proj.project_snapshot(reversed_snap, CFG)["stocks"],
                   ensure_ascii=False, sort_keys=True)
    d = json.dumps(proj.project_snapshot(GOLDEN, CFG)["stocks"], ensure_ascii=False, sort_keys=True)
    check(c == d, "DET: 입력 순서에 따라 projection 이 달라짐(순서 불변 위반)")


# ===========================================================================
# PURE — 소스 순수성(벽시계·난수·네트워크·공개경로 흔적 없음).
# ===========================================================================
def test_source_purity():
    with open(SOURCE_PATH, encoding="utf-8") as f:
        src = f.read()
    check("�" not in src, "PURE: projection 소스에 U+FFFD")
    forbidden = ["datetime", "time.time(", "time.monotonic", "random", "socket",
                 "urllib", "requests", "FinanceDataReader", "import yaml"]
    for tok in forbidden:
        check(tok not in src, f"PURE: projection 소스에 금지 토큰 '{tok}'")
    # 공개 데이터 경로·파일 쓰기 흔적 없음(config/copy/스냅샷 읽기만 허용).
    #   주의: "public/ 에 쓰지 않는다"는 부인 주석은 허용 — 실제 공개 데이터 경로 구성/쓰기만 금지한다.
    check("public/data" not in src and 'join(ROOT, "public"' not in src,
          "PURE: projection 소스에 공개 데이터 경로 구성")
    check(', "w"' not in src and ", 'w'" not in src and 'mode="w"' not in src,
          "PURE: projection 소스에 파일 쓰기 모드(재계산/산출물 쓰기 의심)")


TESTS = [
    ("SCHEMA", test_schema),
    ("COPY", test_copy_registry),
    ("NAME", test_naming_and_denials),
    ("SIGN", test_sign_safety),
    ("STORED", test_stored_input_only),
    ("THRESHOLD", test_thresholds_from_config),
    ("GOLDEN", test_golden_regression),
    ("DET", test_determinism),
    ("PURE", test_source_purity),
]


def main():
    for name, fn in TESTS:
        try:
            fn()
        except Exception as e:  # noqa: BLE001 — 테스트 하네스가 예외를 실패로 수집
            failures.append(f"{name}: 예외 {type(e).__name__}: {e}")
    if failures:
        print(f"FAIL ({len(failures)}):")
        for m in failures:
            print("  -", m)
        return 1
    print(f"OK: metrics251 projection 게이트 {len(TESTS)}개 그룹 통과 "
          f"(SCHEMA/COPY/NAME/SIGN/STORED/THRESHOLD/GOLDEN/DET/PURE).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
