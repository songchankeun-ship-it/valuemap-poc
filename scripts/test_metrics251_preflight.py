#!/usr/bin/env python3
# Metrics 2.5.1 dated-run preflight 계약 게이트 — Slice M.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02/D07/D10,
#   §8, §9, 원안 ORN-2503/2508, 작업 지시):
#   A. 해피패스: 조립된 입력이 pin(expected)을 바이트 재현하고 거래일·비공개 레이아웃이 안전하면 PASS.
#   B. stale 소스일: 소스일이 pin 보다 과거면 SOURCE_DATE_STALE 로 fail closed.
#   C. 결측 입력: 종목 시계열/유니버스/config 결측이 INPUT_MISSING/UNIVERSE_EMPTY/CONFIG_MISSING.
#   D. 해시 drift: config/입력이 pin 과 달라지면 CONFIG_HASH_MISMATCH/INPUT_HASH_MISMATCH.
#   E. 중복 시장일: 이미 승격된 시장일 재계산 시 DUPLICATE_MARKET_DATE.
#   F. 잘못된 출력 위치: public/ 밑·루트 밖 출력이 OUTPUT_NOT_PRIVATE/SHADOW_ROOT_NOT_PRIVATE/
#      OUTPUT_ESCAPES_SHADOW_ROOT.
#   G. 추가 안전: 거래일 아님·미래 소스일·pin 불일치·형식오류·pin 불완전·fail closed·결정성·순수성.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_preflight.py
import copy
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_preflight as pf         # noqa: E402
import metrics251_engine as eng           # noqa: E402
import metrics251_snapshot_store as store  # noqa: E402
from metrics251_config import config_hash  # noqa: E402
from metrics251_compare import FixtureTradingCalendar  # noqa: E402

CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
FIXTURE_DIR = os.path.join(HERE, "fixtures", "metrics251")
REQUEST_FIXTURE = os.path.join(FIXTURE_DIR, "preflight_request.json")
CALENDAR_FIXTURE = os.path.join(FIXTURE_DIR, "compare_calendar.json")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def load_config():
    with open(CONFIG_PATH, encoding="utf-8-sig") as f:
        return json.load(f)


def load_request_fixture():
    with open(REQUEST_FIXTURE, encoding="utf-8") as f:
        return json.load(f)


def load_calendar():
    with open(CALENDAR_FIXTURE, encoding="utf-8") as f:
        return FixtureTradingCalendar.from_fixture(json.load(f))


CFG = load_config()
BASE = load_request_fixture()
CAL = load_calendar()


def expected_for(config, market_date, source_dates, stocks):
    """조립된 입력에서 pin(expected)을 결정적으로 파생한다(하드코딩 해시 회피)."""
    req = eng.EngineRequest.from_dict({
        "config": config, "marketDate": market_date,
        "sourceDates": source_dates, "stocks": stocks})
    return {
        "engineVersion": eng.ENGINE_VERSION,
        "configHash": config_hash(config),
        "inputManifestHash": eng._input_manifest_hash(req, req.stocks),
        "marketDate": market_date,
        "sourceDates": dict(source_dates),
    }


def build_request(*, config=None, market_date=None, source_dates=None, stocks=None,
                  shadow_root, output_location=None, expected=None):
    """유효 기준 요청을 만들고, expected 는 지정 없으면 조립 입력에서 파생한다."""
    config = CFG if config is None else config
    market_date = BASE["marketDate"] if market_date is None else market_date
    source_dates = copy.deepcopy(BASE["sourceDates"]) if source_dates is None else source_dates
    stocks = copy.deepcopy(BASE["stocks"]) if stocks is None else stocks
    if output_location is None:
        output_location = os.path.join(shadow_root, store.RUNS_SUBDIR, f"{market_date}__r1")
    if expected is None:
        expected = expected_for(config, market_date, source_dates, stocks)
    return {
        "marketDate": market_date,
        "expected": expected,
        "config": config,
        "sourceDates": source_dates,
        "stocks": stocks,
        "shadowRoot": shadow_root,
        "outputLocation": output_location,
    }


def fresh_root():
    return tempfile.mkdtemp(prefix="m251preflight_")


def cleanup(d):
    store.rmtree_force(d)


# ===========================================================================
# A. 해피패스 — pin 재현 + 거래일 + 비공개 레이아웃 → PASS.
# ===========================================================================
def test_happy_path():
    root = fresh_root()
    try:
        req = build_request(shadow_root=root)
        res = pf.preflight_market_day(req, CAL, promoted_market_dates=[])
        check(res.ok, f"해피패스 preflight 실패: {res.reasons} {res.detail}")
        check(res.reasons == [], f"해피패스인데 사유 존재: {res.reasons}")
        check(res.marketDate == BASE["marketDate"], "marketDate 반영 안 됨")
        check(all(v["ok"] for v in res.checks.values()),
              f"해피패스인데 일부 그룹 실패: {res.checks}")
    finally:
        cleanup(root)


# ===========================================================================
# B. stale 소스일 — 소스일이 pin 보다 과거 → SOURCE_DATE_STALE, fail closed.
# ===========================================================================
def test_stale_source_date():
    root = fresh_root()
    try:
        req = build_request(shadow_root=root)
        req["sourceDates"]["prices"] = "2026-07-10"  # pin(2026-07-15)보다 과거 = stale
        res = pf.preflight_market_day(req, CAL, promoted_market_dates=[])
        check(not res.ok, "stale 소스일인데 통과함")
        check(pf.SOURCE_DATE_STALE in res.reasons,
              f"stale 소스일이 SOURCE_DATE_STALE 아님: {res.reasons}")
        check(res.checks["sourceDates"]["ok"] is False, "sourceDates 그룹이 실패로 표시 안 됨")
    finally:
        cleanup(root)


# ===========================================================================
# B2. 미래 소스일 — marketDate 이후 → SOURCE_DATE_FUTURE.
# ===========================================================================
def test_future_source_date():
    root = fresh_root()
    try:
        req = build_request(shadow_root=root)
        req["sourceDates"]["volumes"] = "2026-07-20"  # marketDate(07-15) 이후 = 불가능
        req["expected"]["sourceDates"]["volumes"] = "2026-07-20"  # pin 도 맞춰도 미래는 무조건 실패
        res = pf.preflight_market_day(req, CAL, promoted_market_dates=[])
        check(not res.ok and pf.SOURCE_DATE_FUTURE in res.reasons,
              f"미래 소스일이 SOURCE_DATE_FUTURE 아님: {res.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# C. 결측 입력 — 종목 시계열 결측·유니버스 공백·config 결측.
# ===========================================================================
def test_missing_inputs():
    root = fresh_root()
    try:
        # (i) 한 종목의 prices 결측.
        req = build_request(shadow_root=root)
        req["stocks"][1]["prices"] = None
        res = pf.preflight_market_day(req, CAL, promoted_market_dates=[])
        check(not res.ok and pf.INPUT_MISSING in res.reasons,
              f"종목 시계열 결측이 INPUT_MISSING 아님: {res.reasons}")

        # (ii) 유니버스 공백.
        req2 = build_request(shadow_root=root, stocks=[])
        res2 = pf.preflight_market_day(req2, CAL, promoted_market_dates=[])
        check(not res2.ok and pf.UNIVERSE_EMPTY in res2.reasons,
              f"공백 유니버스가 UNIVERSE_EMPTY 아님: {res2.reasons}")

        # (iii) config 결측.
        req3 = build_request(shadow_root=root)
        req3["config"] = None
        res3 = pf.preflight_market_day(req3, CAL, promoted_market_dates=[])
        check(not res3.ok and pf.CONFIG_MISSING in res3.reasons,
              f"config 결측이 CONFIG_MISSING 아님: {res3.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# D. 해시 drift — config/입력이 pin 과 달라짐.
# ===========================================================================
def test_hash_drift():
    root = fresh_root()
    try:
        # (i) config drift → configHash 불일치. pin 은 원본 config 기준으로 고정.
        req = build_request(shadow_root=root)
        drifted = copy.deepcopy(CFG)
        # composite weights 를 살짝 바꿔 canonical 바이트를 바꾼다(존재 키만 안전 변경).
        drifted["composite"]["weights"] = {k: v for k, v in drifted["composite"]["weights"].items()}
        # 값 하나를 미세 변경(엔진 버전은 그대로 두어 ENGINE_VERSION_MISMATCH 와 분리).
        wk = sorted(drifted["composite"]["weights"].keys())[0]
        drifted["composite"]["weights"][wk] = drifted["composite"]["weights"][wk] + 0.001
        req["config"] = drifted
        res = pf.preflight_market_day(req, CAL, promoted_market_dates=[])
        check(not res.ok and pf.CONFIG_HASH_MISMATCH in res.reasons,
              f"config drift 가 CONFIG_HASH_MISMATCH 아님: {res.reasons}")

        # (ii) 입력 drift → inputManifestHash 불일치. 가격 한 점을 바꾼다.
        req2 = build_request(shadow_root=root)
        req2["stocks"][0]["prices"][0] = req2["stocks"][0]["prices"][0] + 1.0
        res2 = pf.preflight_market_day(req2, CAL, promoted_market_dates=[])
        check(not res2.ok and pf.INPUT_HASH_MISMATCH in res2.reasons,
              f"입력 drift 가 INPUT_HASH_MISMATCH 아님: {res2.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# E. 중복 시장일 — 이미 승격된 시장일 재계산 금지.
# ===========================================================================
def test_duplicate_market_date():
    root = fresh_root()
    try:
        req = build_request(shadow_root=root)
        res = pf.preflight_market_day(req, CAL, promoted_market_dates=[BASE["marketDate"]])
        check(not res.ok and pf.DUPLICATE_MARKET_DATE in res.reasons,
              f"중복 시장일이 DUPLICATE_MARKET_DATE 아님: {res.reasons}")
        # 다른 날짜 집합이면 통과.
        res_ok = pf.preflight_market_day(req, CAL, promoted_market_dates=["2026-07-14"])
        check(res_ok.ok, f"무관한 승격 날짜가 통과를 막음: {res_ok.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# E2. 저장소 연동 — promoted_market_dates(root) 가 승격 run 을 읽어 중복을 잡는다.
# ===========================================================================
def test_promoted_market_dates_from_store():
    root = fresh_root()
    try:
        # golden 스냅샷을 하나 게시해 승격 run 을 만든다.
        with open(os.path.join(FIXTURE_DIR, "golden_snapshot.json"), encoding="utf-8") as f:
            snap = json.load(f)
        pub = store.publish_snapshot(root, snap, run_id="r1")
        check(pub.ok, f"저장소 게시 실패: {pub.reasons}")
        dates = pf.promoted_market_dates(root)
        check(snap["marketDate"] in dates,
              f"승격 run 의 marketDate 가 집합에 없음: {dates}")
        # 그 날짜로 preflight 하면 중복으로 막힌다.
        req = build_request(shadow_root=root, market_date=snap["marketDate"],
                            source_dates={"prices": snap["marketDate"], "volumes": snap["marketDate"],
                                          "fundamentals": None})
        res = pf.preflight_market_day(req, None, promoted_market_dates=dates)
        check(pf.DUPLICATE_MARKET_DATE in res.reasons,
              f"저장소 기반 중복이 감지 안 됨: {res.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# F. 잘못된 출력 위치 — public/ 밑·루트 밖 출력·public 루트.
# ===========================================================================
def test_invalid_output_locations():
    root = fresh_root()
    try:
        # (i) 출력이 public/data 밑.
        req = build_request(shadow_root=root)
        req["outputLocation"] = os.path.join(ROOT, "public", "data", "shadow-should-not-exist", "run")
        res = pf.preflight_market_day(req, CAL, promoted_market_dates=[])
        check(not res.ok and pf.OUTPUT_NOT_PRIVATE in res.reasons,
              f"public/data 출력이 OUTPUT_NOT_PRIVATE 아님: {res.reasons}")

        # (ii) 출력이 저장소 루트 밖(다른 임시 위치).
        other = fresh_root()
        try:
            req2 = build_request(shadow_root=root)
            req2["outputLocation"] = os.path.join(other, store.RUNS_SUBDIR, "x__r1")
            res2 = pf.preflight_market_day(req2, CAL, promoted_market_dates=[])
            check(not res2.ok and pf.OUTPUT_ESCAPES_SHADOW_ROOT in res2.reasons,
                  f"루트 밖 출력이 OUTPUT_ESCAPES_SHADOW_ROOT 아님: {res2.reasons}")
        finally:
            cleanup(other)

        # (iii) shadowRoot 자체가 public/ 밑.
        pub_root = os.path.join(ROOT, "public", "data", "shadow-root-nope")
        req3 = build_request(shadow_root=pub_root)
        res3 = pf.preflight_market_day(req3, CAL, promoted_market_dates=[])
        check(not res3.ok and pf.SHADOW_ROOT_NOT_PRIVATE in res3.reasons,
              f"public 루트가 SHADOW_ROOT_NOT_PRIVATE 아님: {res3.reasons}")
        check(not os.path.exists(pub_root), "preflight 가 public 경로를 생성함(금지)")
    finally:
        cleanup(root)


# ===========================================================================
# G1. 거래일 아님 — 공휴일(2026-07-16) 을 시장일로 지정.
# ===========================================================================
def test_not_trading_day():
    root = fresh_root()
    try:
        holiday = "2026-07-16"
        req = build_request(
            shadow_root=root, market_date=holiday,
            source_dates={"prices": holiday, "volumes": holiday, "fundamentals": "2026-07-13"})
        res = pf.preflight_market_day(req, CAL, promoted_market_dates=[])
        check(not res.ok and pf.MARKET_DATE_NOT_TRADING_DAY in res.reasons,
              f"공휴일이 MARKET_DATE_NOT_TRADING_DAY 아님: {res.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# G2. pin 불일치·형식오류·pin 불완전.
# ===========================================================================
def test_expectation_and_format():
    root = fresh_root()
    try:
        # (i) marketDate 가 pin 과 다름.
        req = build_request(shadow_root=root)
        req["marketDate"] = "2026-07-17"  # pin.marketDate=2026-07-15
        res = pf.preflight_market_day(req, CAL, promoted_market_dates=[])
        check(pf.MARKET_DATE_EXPECTATION_MISMATCH in res.reasons,
              f"marketDate pin 불일치 미검출: {res.reasons}")

        # (ii) 형식 오류 marketDate.
        req2 = build_request(shadow_root=root, market_date="2026/07/15")
        req2["expected"]["marketDate"] = "2026/07/15"
        res2 = pf.preflight_market_day(req2, CAL, promoted_market_dates=[])
        check(pf.MARKET_DATE_MALFORMED in res2.reasons,
              f"형식오류 marketDate 미검출: {res2.reasons}")

        # (iii) pin(expected) 불완전.
        req3 = build_request(shadow_root=root)
        del req3["expected"]["configHash"]
        res3 = pf.preflight_market_day(req3, CAL, promoted_market_dates=[])
        check(pf.EXPECTATION_INCOMPLETE in res3.reasons,
              f"불완전 pin 미검출: {res3.reasons}")

        # (iv) 엔진 버전 불일치.
        req4 = build_request(shadow_root=root)
        req4["config"] = copy.deepcopy(CFG)
        req4["config"]["engineVersion"] = "9.9.9"
        res4 = pf.preflight_market_day(req4, CAL, promoted_market_dates=[])
        check(pf.ENGINE_VERSION_MISMATCH in res4.reasons,
              f"엔진 버전 불일치 미검출: {res4.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# G3. fail closed — 캘린더 미제공 시 확정 불가 → CALENDAR_UNCOVERED(통과 금지).
# ===========================================================================
def test_fail_closed_without_calendar():
    root = fresh_root()
    try:
        req = build_request(shadow_root=root)
        res = pf.preflight_market_day(req, None, promoted_market_dates=[])
        check(not res.ok and pf.CALENDAR_UNCOVERED in res.reasons,
              f"캘린더 없이 통과됨(fail closed 위반): {res.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# G4. 결정성 — 같은 입력은 같은 reasons/checks 를 준다(벽시계/난수 없음).
# ===========================================================================
def test_determinism():
    root = fresh_root()
    try:
        req = build_request(shadow_root=root)
        req["sourceDates"]["prices"] = "2026-07-10"  # 실패 경로도 결정적인지 확인
        a = pf.preflight_market_day(req, CAL, promoted_market_dates=[BASE["marketDate"]])
        b = pf.preflight_market_day(req, CAL, promoted_market_dates=[BASE["marketDate"]])
        check(a.reasons == b.reasons, f"결정성 위반(reasons 다름): {a.reasons} vs {b.reasons}")
        check(a.to_dict() == b.to_dict(), "결정성 위반(to_dict 다름)")
    finally:
        cleanup(root)


# ===========================================================================
# G5. 순수성 — 소스에 벽시계/난수/네트워크/공개데이터 쓰기 흔적 없음.
# ===========================================================================
def test_source_purity():
    src = open(os.path.join(HERE, "metrics251_preflight.py"), encoding="utf-8").read()
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"preflight 에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("urllib", "requests", "socket"):
        check(banned not in code, f"preflight 에 네트워크 흔적: {banned!r}")
    # preflight 는 판정만 한다 — 파일을 쓰지 않고(CLI 는 fixture 를 읽기만) 공개 데이터 경로를 만들지 않는다.
    check(".write(" not in code, "preflight 에 파일 쓰기 흔적(판정층은 아무것도 쓰지 않는다)")
    check("public/data" not in code, "preflight 코드가 public/data 경로를 직접 참조")


def main():
    tests = [
        test_happy_path,
        test_stale_source_date,
        test_future_source_date,
        test_missing_inputs,
        test_hash_drift,
        test_duplicate_market_date,
        test_promoted_market_dates_from_store,
        test_invalid_output_locations,
        test_not_trading_day,
        test_expectation_and_format,
        test_fail_closed_without_calendar,
        test_determinism,
        test_source_purity,
    ]
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001  (테스트 하네스 — 예외도 실패로 수집)
            failures.append(f"{t.__name__} 예외: {e!r}")

    if failures:
        print(f"[FAIL] metrics251_preflight 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1

    print(f"[PASS] metrics251_preflight 계약 검증 통과 ({len(tests)} 케이스: "
          "해피패스·stale소스일·미래소스일·결측입력·해시drift·중복시장일·저장소연동·"
          "잘못된출력위치·거래일아님·pin불일치/형식·fail closed·결정성·순수성).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
