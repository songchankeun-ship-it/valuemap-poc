#!/usr/bin/env python3
# Metrics 2.5.1 품질·자격·모집단 계약 게이트 — Slice E.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D04, §7 Gate 0,
#   §10 Slice E):
#   A. 사유 enum: 알려진 factor 자격 사유만 허용, UNKNOWN 은 실패(assert_reasons_known 가 raise).
#   B. 품질 경고 분리: 양수-이지만-높음(PER>100·PBR>20·|ROE|>100)은 QUALITY_WARNING 이며 제외 아님.
#      경고 종목도 rankingEligible 을 유지한다.
#   C. factor별 유효 모집단 + non-erasure: value 결측이 momentum/activity/riskAdjusted 관측을 지우지 않음.
#   D. 순위 교집합: 네 factor 모두 유효한 종목만 rankingEligible. 엔진 플래그·해시와 차등 일치.
#   E. 모집단 count/hash: 리포트가 엔진 factorPopulations/rankingPopulation 과 일관.
#   F. 커버리지 게이트: 최소 커버리지·UNKNOWN 0·이유 없는 급락·일관성. 시장/업종 편향 보고.
#   G. 골든 fixture: 결측 factor·stale 소스일·소스 불일치·이력 부족·영분산·양수높음·복수 사유 동시.
#   H. 결정성: 같은 요청 반복 평가 → 바이트 동일.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_eligibility.py                 # 검증(실패 시 exit 1)
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_eligibility.py --update-golden # 골든 fixture 재생성
import argparse
import copy
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_engine as eng  # noqa: E402
import metrics251_eligibility as elig  # noqa: E402

CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
FIXTURE_DIR = os.path.join(HERE, "fixtures", "metrics251")
INPUT_PATH = os.path.join(FIXTURE_DIR, "eligibility_input.json")
REPORT_PATH = os.path.join(FIXTURE_DIR, "eligibility_report.json")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def load_config():
    with open(CONFIG_PATH, encoding="utf-8-sig") as f:
        return json.load(f)


CFG = load_config()


# ===========================================================================
# 결정적 합성 입력 헬퍼(Math.random 금지 — 파라미터로만).
# ===========================================================================
def linear_prices(base, step, n):
    return [float(base + i * step) for i in range(n)]


def const_list(value, n):
    return [float(value)] * n


def v25():
    return const_list(1000, 25)


# ===========================================================================
# 골든 fixture — 작업 지시가 요구하는 7개 시나리오를 결정적으로 커버한다.
#   결측 factor / stale 소스일 / 소스 불일치 / 이력 부족 / 영분산 / 양수-높음 / 복수 사유 동시.
# ===========================================================================
def build_input():
    v = v25()
    primary = {
        "marketDate": "2026-07-15",
        "sourceDates": {"prices": "2026-07-14", "volumes": "2026-07-14", "fundamentals": "2026-07-13"},
        "stocks": [
            # 완전 유효 5종목(rankingEligible) — factor 모집단·순위 교집합의 기반.
            {"ticker": "FULL_A", "prices": linear_prices(1000, 2, 260), "volumes": v,
             "per": 10.0, "pbr": 1.0},
            {"ticker": "FULL_B", "prices": linear_prices(1000, 1, 260),
             "volumes": const_list(1000, 15) + const_list(2000, 5), "per": 20.0, "pbr": 2.0},
            {"ticker": "FULL_C", "prices": linear_prices(3000, -3, 260),
             "volumes": const_list(1000, 15) + const_list(500, 5), "per": 5.0, "pbr": 0.5},
            {"ticker": "FULL_D", "prices": linear_prices(1500, 1, 260), "volumes": const_list(800, 30),
             "per": 15.0, "pbr": 1.5},
            {"ticker": "FULL_E", "prices": linear_prices(1200, 3, 255), "volumes": const_list(1200, 22),
             "per": 8.0, "pbr": 0.8},
            # 결측 factor: PER 결측 → value MISSING_INPUT. momentum/activity/risk 는 유효(non-erasure).
            {"ticker": "MISS_VALUE", "prices": linear_prices(1000, 1, 260), "volumes": v,
             "per": None, "pbr": 1.0},
            # 이력 부족: 가격 200개(<253) → riskAdjusted INSUFFICIENT_HISTORY.
            {"ticker": "SHORT_HIST", "prices": linear_prices(1000, 1, 200), "volumes": v,
             "per": 12.0, "pbr": 1.2},
            # 영분산: 상수 가격 → riskAdjusted ZERO_VARIANCE, 모멘텀 raw 0(유효).
            {"ticker": "ZERO_VAR", "prices": const_list(1000, 260), "volumes": v,
             "per": 11.0, "pbr": 1.1},
            # 양수-이지만-높음: PER 250·PBR 30·ROE 150 → value VALID + 경고(제외 아님, rankingEligible 유지).
            {"ticker": "HIGH_POS", "prices": linear_prices(1000, 2, 260), "volumes": v,
             "per": 250.0, "pbr": 30.0, "roe": 150.0},
            # 복수 사유 동시: PER 결측(value) + 거래량 10개(activity 부족) + 가격 150개(risk 부족).
            {"ticker": "MULTI", "prices": linear_prices(1000, 1, 150), "volumes": const_list(1000, 10),
             "per": None, "pbr": 1.0},
        ],
    }
    # stale 소스일: 재무 기준일 null → 전 종목 value SOURCE_DATE_STALE → 순위 커버리지 0.
    stale = {
        "marketDate": "2026-07-15",
        "sourceDates": {"prices": "2026-07-14", "volumes": "2026-07-14", "fundamentals": None},
        "stocks": [
            {"ticker": "S1", "prices": linear_prices(1000, 2, 260), "volumes": v, "per": 10.0, "pbr": 1.0},
            {"ticker": "S2", "prices": linear_prices(1000, 1, 260), "volumes": v, "per": 20.0, "pbr": 2.0},
        ],
    }
    # 소스 불일치: 가격 소스일이 marketDate 보다 미래 → top-level 실패(runOk=False).
    mismatch = {
        "marketDate": "2026-07-15",
        "sourceDates": {"prices": "2026-07-16", "volumes": "2026-07-14", "fundamentals": "2026-07-13"},
        "stocks": [
            {"ticker": "M1", "prices": linear_prices(1000, 2, 260), "volumes": v, "per": 10.0, "pbr": 1.0},
        ],
    }
    return {"primary": primary, "staleSource": stale, "sourceMismatch": mismatch}


def request_of(scenario):
    return {"config": CFG, "marketDate": scenario["marketDate"],
            "sourceDates": scenario["sourceDates"], "stocks": scenario["stocks"]}


def build_report(scenarios):
    return {name: elig.evaluate(request_of(sc)) for name, sc in sorted(scenarios.items())}


def write_golden():
    os.makedirs(FIXTURE_DIR, exist_ok=True)
    scenarios = build_input()
    with open(INPUT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(scenarios, ensure_ascii=False, sort_keys=True, indent=2) + "\n")
    report = build_report(scenarios)
    with open(REPORT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2) + "\n")
    print(f"golden fixture 재생성: {os.path.relpath(INPUT_PATH, ROOT)} + "
          f"{os.path.relpath(REPORT_PATH, ROOT)}")


# ===========================================================================
# A. 사유 enum — 알려진 것/제외/비제외 분류 + UNKNOWN 실패.
# ===========================================================================
def run_reason_checks():
    check(elig.is_known_reason(eng.VALID), "VALID 이 알려진 사유가 아님")
    check(elig.is_known_reason(eng.ZERO_VARIANCE), "ZERO_VARIANCE 가 알려진 사유가 아님")
    check(not elig.is_known_reason("UNKNOWN"), "UNKNOWN 이 알려진 사유로 취급됨")
    # 비제외: VALID·QUALITY_WARNING. 제외: 나머지.
    check(not elig.is_excluding_reason(eng.VALID), "VALID 이 제외로 분류됨")
    check(not elig.is_excluding_reason(eng.QUALITY_WARNING), "QUALITY_WARNING 이 제외로 분류됨(경고여야)")
    for r in (eng.MISSING_INPUT, eng.INSUFFICIENT_HISTORY, eng.NON_POSITIVE_FUNDAMENTAL,
              eng.SOURCE_DATE_STALE, eng.SOURCE_DATE_MISMATCH, eng.ZERO_VARIANCE):
        check(elig.is_excluding_reason(r), f"{r} 이 제외 사유로 분류되지 않음")
    # UNKNOWN 은 실패.
    raised = False
    try:
        elig.is_excluding_reason("SOMETHING_NEW")
    except ValueError:
        raised = True
    check(raised, "알 수 없는 사유가 is_excluding_reason 에서 실패하지 않음")
    raised = False
    try:
        elig.assert_reasons_known([eng.VALID, "MYSTERY"])
    except ValueError:
        raised = True
    check(raised, "assert_reasons_known 이 UNKNOWN 사유에서 실패하지 않음")
    check(elig.assert_reasons_known([eng.VALID, eng.MISSING_INPUT]) is True,
          "알려진 사유 집합이 통과하지 않음")


# ===========================================================================
# B. 품질 경고 분리 — 임계는 Slice A baseline 과 동일 출처.
# ===========================================================================
def run_warning_checks():
    check(elig.quality_warnings(per=10.0, pbr=1.0) == [], "정상 재무값에 경고가 붙음")
    check(elig.quality_warnings(per=250.0, pbr=1.0) == ["perGt100"], "PER 250 경고가 perGt100 아님")
    check(elig.quality_warnings(per=600.0, pbr=1.0) == ["perGt100", "perGt500"],
          "PER 600 경고가 perGt100+perGt500 아님")
    check(elig.quality_warnings(per=10.0, pbr=30.0) == ["pbrGt20"], "PBR 30 경고가 pbrGt20 아님")
    check(elig.quality_warnings(roe=150.0) == ["absRoeGt100"], "ROE 150 경고가 absRoeGt100 아님")
    check(elig.quality_warnings(roe=-150.0) == ["absRoeGt100"], "ROE -150 절대값 경고가 absRoeGt100 아님")
    check(elig.quality_warnings(per=None, pbr=None, roe=None) == [], "결측 재무값에 경고가 붙음")
    # 단일 출처 정합: 경고 임계가 Slice A EXTREME_THRESHOLDS 와 동일해야 한다.
    import metrics251_baseline as bl
    ids = sorted(t["id"] for t in bl.EXTREME_THRESHOLDS)
    check(ids == ["absRoeGt100", "pbrGt20", "perGt100", "perGt500"],
          f"경고 임계 출처(baseline)가 예상과 다름: {ids}")


# ===========================================================================
# C~E,G. 골든 자격 리포트 — 커밋된 기대값과 바이트 일치 + 내용 스팟체크.
# ===========================================================================
def run_golden_checks():
    with open(INPUT_PATH, encoding="utf-8") as f:
        scenarios = json.load(f)
    with open(REPORT_PATH, encoding="utf-8") as f:
        expected = json.load(f)
    report = build_report(scenarios)
    check(report == expected,
          "골든 자격 리포트가 커밋된 기대값과 불일치 — --update-golden 필요(의도된 변경일 때만)")

    p = report["primary"]
    check(p["runOk"] is True, "primary runOk 가 True 아님")
    check(p["universeCount"] == 10, f"primary 유니버스!=10: {p['universeCount']}")
    # 순위 교집합 = 완전 유효 5 + HIGH_POS(경고지만 유효) = 6.
    check(sorted(p["rankingEligibleTickers"]) ==
          ["FULL_A", "FULL_B", "FULL_C", "FULL_D", "FULL_E", "HIGH_POS"],
          f"primary rankingEligible 집합 오류: {p['rankingEligibleTickers']}")
    check(p["rankingEligibleCount"] == 6, "primary rankingEligibleCount!=6")

    # B. 양수-높음(HIGH_POS)은 경고 + 여전히 rankingEligible.
    check("HIGH_POS" in p["qualityWarnings"], "HIGH_POS 에 품질 경고 없음")
    check(p["qualityWarnings"]["HIGH_POS"]["value"] == ["absRoeGt100", "pbrGt20", "perGt100"],
          f"HIGH_POS 경고 코드 오류: {p['qualityWarnings'].get('HIGH_POS')}")
    check("HIGH_POS" in p["rankingEligibleTickers"], "경고 종목 HIGH_POS 가 제외됨(경고는 제외가 아님)")

    # C. non-erasure: MISS_VALUE 는 value 만 제외, momentum/activity/risk 는 유효 점수 유지.
    check("MISS_VALUE" in [x["ticker"] for x in p["valueMissingPreservingOthers"]],
          "MISS_VALUE 가 non-erasure 보존 목록에 없음")
    preserved = next(x for x in p["valueMissingPreservingOthers"] if x["ticker"] == "MISS_VALUE")
    check(sorted(preserved["preservedFactors"]) == ["activity", "momentum", "riskAdjusted"],
          f"MISS_VALUE 보존 factor 오류: {preserved['preservedFactors']}")
    check(p["consistency"]["noErasure"] is True, "primary non-erasure 불변식 위반")

    # G. 복수 사유 동시(MULTI): value MISSING_INPUT + activity INSUFFICIENT + risk INSUFFICIENT.
    multi_reasons = {k: v for k, v in p["eligibilityReasonCounts"].items()}
    check("value.MISSING_INPUT" in multi_reasons, "MULTI/MISS_VALUE 의 value.MISSING_INPUT 누락")
    check("activity.INSUFFICIENT_HISTORY" in multi_reasons, "MULTI 의 activity.INSUFFICIENT_HISTORY 누락")
    check("riskAdjusted.INSUFFICIENT_HISTORY" in multi_reasons, "SHORT_HIST/MULTI 의 risk INSUFFICIENT 누락")
    check("riskAdjusted.ZERO_VARIANCE" in multi_reasons, "ZERO_VAR 의 risk ZERO_VARIANCE 누락")

    # D~E. 일관성: 엔진 모집단·순위 해시와 차등 일치, 사유-점수 불변식.
    for k, val in p["consistency"].items():
        check(val is True, f"primary consistency.{k} 가 True 아님")
    check(p["unknownReasons"] == [], "primary 에 UNKNOWN 사유 존재")
    check(p["excludedWithoutReason"] == [], "primary 에 사유 없는 제외 존재")

    # factor 모집단 카운트(엔진 골든과 동일 계약): momentum 10, activity 9(거래량10 제외),
    # value 8(PER결측 2 제외), riskAdjusted 7(SHORT_HIST·MULTI 부족 + ZERO_VAR 영분산 제외).
    fp = p["factorPopulations"]
    check(fp["momentum"]["count"] == 10, f"momentum 모집단!=10: {fp['momentum']['count']}")
    check(fp["activity"]["count"] == 9, f"activity 모집단!=9: {fp['activity']['count']}")
    check(fp["value"]["count"] == 8, f"value 모집단!=8: {fp['value']['count']}")
    check(fp["riskAdjusted"]["count"] == 7, f"riskAdjusted 모집단!=7: {fp['riskAdjusted']['count']}")

    # stale 소스일: 전 종목 value SOURCE_DATE_STALE → 순위 커버리지 0.
    st = report["staleSource"]
    check(st["runOk"] is True, "staleSource runOk 아님(스냅샷은 성립해야)")
    check(st["rankingEligibleCount"] == 0, "staleSource 순위 후보가 0 아님")
    check(st["eligibilityReasonCounts"].get("value.SOURCE_DATE_STALE") == 2,
          "staleSource value.SOURCE_DATE_STALE!=2")
    check(st["factorPopulations"]["value"]["count"] == 0, "staleSource value 모집단!=0")
    # 그러나 가격/거래량 factor 는 여전히 유효(재무 stale 이 다른 factor 를 지우지 않음).
    check(st["factorPopulations"]["momentum"]["count"] == 2, "staleSource momentum 모집단!=2")

    # 소스 불일치: top-level 실패 → runOk False + SOURCE_DATE_MISMATCH.
    mm = report["sourceMismatch"]
    check(mm["runOk"] is False, "sourceMismatch runOk 가 False 아님")
    check(eng.RUN_SOURCE_DATE_MISMATCH in mm["runNullReasons"],
          f"sourceMismatch nullReasons 에 SOURCE_DATE_MISMATCH 없음: {mm['runNullReasons']}")

    return scenarios, report


# ===========================================================================
# F. 커버리지 회귀 게이트.
# ===========================================================================
def run_gate_checks(report):
    # 실 기준선(Slice A) 로드 — 읽기전용. 게이트가 실제 baseline 을 소비하는지 확인.
    real_baseline = elig.load_baseline()
    check(isinstance(real_baseline.get("rankingEligibility"), dict),
          "실 baseline 에 rankingEligibility 없음")

    # (1) primary(6/10=60%) → 최소 커버리지 미달로 게이트 실패. 급락은 '설명됨'(사유 있음)이라
    #     noUnexplainedDrop 은 통과하되 reviewRequired.
    g = elig.coverage_gate(report["primary"], real_baseline)
    check(g["pass"] is False, "primary 게이트가 최소 커버리지 미달인데 통과함")
    check("minRankingEligiblePct" in g["blockers"], "primary 게이트 blocker 에 최소 커버리지 없음")
    check(g["checks"]["zeroUnknownReasons"]["pass"] is True, "primary 에 UNKNOWN 사유(게이트)")
    check(g["checks"]["noUnexplainedDrop"]["reviewRequired"] is True,
          "primary 급락 reviewRequired 가 아님")
    check(g["checks"]["consistency"]["pass"] is True, "primary 일관성 게이트 실패")
    check(g["marketBias"]["available"] is False and g["sectorBias"]["available"] is False,
          "매핑 없이 시장/업종 편향이 available 로 표기됨")

    # (2) 고커버리지 합성 스냅샷(20종목 전부 유효, 100%) vs 낮은 기준선 → 게이트 통과.
    hi_stocks = [
        {"ticker": f"H{i:02d}", "prices": linear_prices(1000 + i, 2, 260), "volumes": v25(),
         "per": 5.0 + i, "pbr": 0.5 + i * 0.1}
        for i in range(20)
    ]
    hi_req = {"config": CFG, "marketDate": "2026-07-15",
              "sourceDates": {"prices": "2026-07-14", "volumes": "2026-07-14",
                              "fundamentals": "2026-07-13"},
              "stocks": hi_stocks}
    hi_report = elig.evaluate(hi_req)
    check(hi_report["rankingEligiblePct"] == 100.0, "고커버리지 스냅샷이 100% 아님")
    low_baseline = {"rankingEligibility": {"coveragePct": 96.0}}
    g2 = elig.coverage_gate(hi_report, low_baseline)
    check(g2["pass"] is True, f"고커버리지 스냅샷 게이트가 통과하지 않음: {g2['blockers']}")
    check(g2["checks"]["noUnexplainedDrop"]["reviewRequired"] is False,
          "고커버리지에서 급락 reviewRequired 가 켜짐")

    # (3) 이유 없는 급락: 96%(>=95 통과) 스냅샷이지만 기준선 99.9% → 급락 3.9%p<5 → 통과.
    #     기준선 99.9%, 스냅샷 94%(<95) → 최소 커버리지로 이미 실패. 급락 규칙 단독 검증은
    #     UNKNOWN 주입으로 확인한다(아래 4).

    # (4) UNKNOWN 사유 주입 → zeroUnknownReasons 실패 + (급락 크면) 이유 없는 급락도 실패.
    tampered = copy.deepcopy(hi_report)
    tampered["unknownReasons"] = ["MYSTERY_REASON"]
    tampered["rankingEligiblePct"] = 80.0  # 큰 급락 유도
    tampered["rankingEligibleCount"] = 16
    high_baseline = {"rankingEligibility": {"coveragePct": 99.0}}
    g3 = elig.coverage_gate(tampered, high_baseline)
    check(g3["pass"] is False, "UNKNOWN+급락 스냅샷 게이트가 통과함")
    check("zeroUnknownReasons" in g3["blockers"], "UNKNOWN 이 게이트 blocker 에 없음")
    check("noUnexplainedDrop" in g3["blockers"], "이유 없는 급락(UNKNOWN 동반)이 blocker 에 없음")
    check("minRankingEligiblePct" in g3["blockers"], "80% 커버리지가 최소 커버리지 blocker 아님")

    # (5) 시장 편향 매핑 제공 → 그룹별 제외율 보고. sourceMismatch(runOk False) 게이트는 run_not_ok.
    market_map = {t: ("KOSPI" if i % 2 == 0 else "KOSDAQ") for i, t in enumerate(
        hi_report["rankingEligibleTickers"])}
    g4 = elig.coverage_gate(hi_report, low_baseline, market_by_ticker=market_map)
    check(g4["marketBias"]["available"] is True, "시장 매핑 제공했는데 편향 미보고")
    check(set(g4["marketBias"]["totalsByGroup"]) == {"KOSPI", "KOSDAQ"},
          "시장 편향 그룹이 KOSPI/KOSDAQ 아님")

    g5 = elig.coverage_gate(report["sourceMismatch"], real_baseline)
    check(g5["pass"] is False and "run_not_ok" in g5["blockers"],
          "sourceMismatch 게이트가 run_not_ok 로 실패하지 않음")


# ===========================================================================
# H. 결정성 — 같은 요청 반복 평가 → 바이트 동일.
# ===========================================================================
def run_determinism_checks(scenarios):
    for name, sc in scenarios.items():
        r1 = json.dumps(elig.evaluate(request_of(sc)), ensure_ascii=False, sort_keys=True)
        r2 = json.dumps(elig.evaluate(request_of(sc)), ensure_ascii=False, sort_keys=True)
        check(r1 == r2, f"{name} 자격 리포트가 반복 실행에서 다름(비결정)")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Metrics 2.5.1 eligibility/quality/population 계약 게이트.")
    ap.add_argument("--update-golden", action="store_true", help="골든 fixture 재생성 후 종료")
    args = ap.parse_args(argv)

    if args.update_golden:
        write_golden()
        return 0

    if not os.path.exists(INPUT_PATH) or not os.path.exists(REPORT_PATH):
        print("[FAIL] 골든 fixture 없음 — 먼저 --update-golden 실행 필요.", file=sys.stderr)
        return 1

    run_reason_checks()
    run_warning_checks()
    scenarios, report = run_golden_checks()
    run_gate_checks(report)
    run_determinism_checks(scenarios)

    if failures:
        print(f"[FAIL] metrics251_eligibility 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1

    print("[PASS] metrics251_eligibility 계약 검증 통과 "
          "(사유 enum·UNKNOWN 실패 · 품질경고 분리(양수높음 비제외) · factor 모집단+non-erasure · "
          "순위 교집합+해시 차등 · 커버리지 게이트(최소/UNKNOWN0/이유없는급락/일관성·시장업종편향) · "
          "골든 7시나리오 바이트일치 · 결정성).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
