#!/usr/bin/env python3
# Metrics 2.5.1 원자적·멱등 단일 시장일 shadow run 오케스트레이터 게이트 — Slice N.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02/D07/D10,
#   §8, §9, 원안 ORN-2503/2508, 작업 지시):
#   A. 게시(publish): 정상 입력이 전 층을 통과하면 하나의 스냅샷을 원자적으로 승격하고 pointer 를 건다.
#   B. 멱등(idempotent): 바이트 동일 재실행은 NOOP — 새 run 없음·pointer 무변경.
#   C. 충돌(conflict): 같은 시장일에 다른 스냅샷이 이미 승격되면 SAME_DATE_CONFLICT 로 거절(불변 위치 보존).
#   D. 원자성(atomic): store fault 주입(중단/손상/QA실패)은 승인 pointer 를 남기지 않는다.
#      interrupt_before_pointer 는 승격된 고아 run 을 남기되 pointer 는 걸지 않는다(재실행 시 NOOP).
#   E. 게이트 조립: preflight 실패·eligibility QA 실패는 계산/게시 이전(또는 승격 이전)에 거절한다.
#   F. 비교 조립: 순차 두 거래일 run 은 직전 거래일과 pairing 되는 차등 증거를 남긴다.
#   G. 추가 안전: 결정성·비공개 레이아웃·fail closed.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_run.py
import copy
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_run as run              # noqa: E402
import metrics251_snapshot_store as store  # noqa: E402
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


CFG = load_config()
with open(REQUEST_FIXTURE, encoding="utf-8") as f:
    BASE = json.load(f)
with open(CALENDAR_FIXTURE, encoding="utf-8") as f:
    CAL = FixtureTradingCalendar.from_fixture(json.load(f))


def build_request(root, *, market_date=None, source_dates=None, stocks=None):
    """유효 기준 run 요청을 조립하고, expected pin 은 조립 입력에서 결정적으로 파생한다."""
    market_date = BASE["marketDate"] if market_date is None else market_date
    source_dates = copy.deepcopy(BASE["sourceDates"]) if source_dates is None else source_dates
    stocks = copy.deepcopy(BASE["stocks"]) if stocks is None else stocks
    return {
        "marketDate": market_date,
        "expected": run.derive_expected(CFG, market_date, source_dates, stocks),
        "config": CFG,
        "sourceDates": source_dates,
        "stocks": stocks,
        "shadowRoot": root,
        "outputLocation": os.path.join(root, store.RUNS_SUBDIR, f"{market_date}__r1"),
    }


def fresh_root():
    return tempfile.mkdtemp(prefix="m251run_")


def cleanup(d):
    store.rmtree_force(d)


def runs_count(root):
    runs_dir = os.path.join(root, store.RUNS_SUBDIR)
    return len(os.listdir(runs_dir)) if os.path.isdir(runs_dir) else 0


# ===========================================================================
# A. 게시(publish) — 정상 입력 → PUBLISHED, pointer 설정, run 무결성 통과, read 일치.
# ===========================================================================
def test_publish_happy_path():
    root = fresh_root()
    try:
        res = run.run_market_day(build_request(root), calendar=CAL)
        check(res.status == run.RUN_PUBLISHED, f"게시 실패: {res.status} {res.reasons} {res.phases}")
        check(res.reasons == [], f"게시인데 사유 존재: {res.reasons}")
        check(res.snapshotId and res.snapshotId.startswith(BASE["marketDate"] + "__"),
              f"snapshotId 형식 이상: {res.snapshotId}")
        # pointer 가 걸리고 read_current 로 무결성 스냅샷을 돌려준다.
        rc = store.read_current(root)
        check(rc.status == store.READ_OK, f"게시 후 read_current OK 아님: {rc.status} {rc.reasons}")
        check(rc.pointer["snapshotId"] == res.snapshotId, "pointer 가 게시 스냅샷을 가리키지 않음")
        check(rc.snapshot["marketDate"] == BASE["marketDate"], "read 스냅샷 marketDate 불일치")
        check(runs_count(root) == 1, f"승격 run 이 정확히 1개가 아님: {runs_count(root)}")
        # 증거가 조립됐다(preflight/engine/eligibility/comparison).
        check(res.evidence and res.evidence["snapshotId"] == res.snapshotId, "증거 미조립")
        check(res.phases["engine"]["ok"] and res.phases["eligibility"]["ok"], "층 요약 이상")
    finally:
        cleanup(root)


# ===========================================================================
# B. 멱등(idempotent) — 바이트 동일 재실행 → NOOP, 새 run 없음, pointer 무변경.
# ===========================================================================
def test_idempotent_rerun_is_noop():
    root = fresh_root()
    try:
        r1 = run.run_market_day(build_request(root), calendar=CAL)
        check(r1.status == run.RUN_PUBLISHED, f"1차 게시 실패: {r1.status}")
        pointer_after_1 = store._read_pointer_raw(root)

        r2 = run.run_market_day(build_request(root), calendar=CAL)
        check(r2.status == run.RUN_NOOP, f"바이트 동일 재실행이 NOOP 아님: {r2.status} {r2.reasons}")
        check(r2.snapshotId == r1.snapshotId, "멱등 재실행 snapshotId 불일치(결정적 runId 위반)")
        check(runs_count(root) == 1, f"재실행이 새 run 을 만듦: {runs_count(root)}")
        pointer_after_2 = store._read_pointer_raw(root)
        check(pointer_after_1 == pointer_after_2, "멱등 재실행이 pointer 를 바꿈")
        # 증거는 결정적이라 재실행에서도 동일 정체성.
        check(r2.evidence["inputManifestHash"] == r1.evidence["inputManifestHash"],
              "멱등 재실행 inputManifestHash 불일치")
    finally:
        cleanup(root)


# ===========================================================================
# C. 충돌(conflict) — 같은 시장일 다른 입력 → SAME_DATE_CONFLICT, pointer/run 보존.
# ===========================================================================
def test_same_date_conflict_rejected():
    root = fresh_root()
    try:
        r1 = run.run_market_day(build_request(root), calendar=CAL)
        check(r1.status == run.RUN_PUBLISHED, f"1차 게시 실패: {r1.status}")
        pointer_before = store._read_pointer_raw(root)

        conflicting = build_request(root)
        conflicting["stocks"][0]["prices"][0] = conflicting["stocks"][0]["prices"][0] + 5.0
        # pin 도 새 입력에 맞춰 재파생(preflight 는 통과하되, 충돌은 저장소 스캔이 잡는다).
        conflicting["expected"] = run.derive_expected(
            CFG, conflicting["marketDate"], conflicting["sourceDates"], conflicting["stocks"])
        r2 = run.run_market_day(conflicting, calendar=CAL)
        check(r2.status == run.RUN_REJECTED and run.SAME_DATE_CONFLICT in r2.reasons,
              f"같은 시장일 충돌이 SAME_DATE_CONFLICT 아님: {r2.status} {r2.reasons}")
        check(r2.snapshotId != r1.snapshotId, "충돌 후보가 기존과 같은 snapshotId(정체성 파생 이상)")
        check(runs_count(root) == 1, f"충돌이 두 번째 run 을 만듦(불변성 위반): {runs_count(root)}")
        check(store._read_pointer_raw(root) == pointer_before, "충돌이 pointer 를 바꿈")
        rc = store.read_current(root)
        check(rc.pointer["snapshotId"] == r1.snapshotId, "충돌 후 pointer 가 원본을 안 가리킴")
    finally:
        cleanup(root)


# ===========================================================================
# D1. 원자성 — store fault(중단/손상/QA실패)는 승인 pointer 를 남기지 않는다.
# ===========================================================================
def test_publish_faults_leave_no_pointer():
    for fault in ("interrupt_before_manifest", "corrupt_artifact_after_manifest", "fail_qa"):
        root = fresh_root()
        try:
            res = run.run_market_day(build_request(root), calendar=CAL, faults={fault})
            check(res.status == run.RUN_REJECTED and run.PUBLISH_FAILED in res.reasons,
                  f"[{fault}] PUBLISH_FAILED 아님: {res.status} {res.reasons}")
            rc = store.read_current(root)
            check(rc.status == store.READ_UNAVAILABLE,
                  f"[{fault}] 부분 실패인데 승인 pointer 존재: {rc.status}")
            check(runs_count(root) == 0, f"[{fault}] 승격 run 이 남음: {runs_count(root)}")
        finally:
            cleanup(root)


# ===========================================================================
# D2. 원자성 — interrupt_before_pointer: 승격된 고아 run 은 남되 pointer 는 안 걸린다.
#      재실행하면 바이트 동일 고아를 보고 NOOP 하되 여전히 pointer 를 걸지 않는다(승인 아님).
# ===========================================================================
def test_interrupt_before_pointer_no_accepted_pointer():
    root = fresh_root()
    try:
        res = run.run_market_day(build_request(root), calendar=CAL,
                                 faults={"interrupt_before_pointer"})
        check(res.status == run.RUN_REJECTED and run.PUBLISH_FAILED in res.reasons,
              f"interrupt_before_pointer 가 PUBLISH_FAILED 아님: {res.status} {res.reasons}")
        rc = store.read_current(root)
        check(rc.status == store.READ_UNAVAILABLE,
              f"pointer 교체 전 중단인데 승인 pointer 존재(원자성 위반): {rc.status}")
        check(runs_count(root) == 1, f"승격 run(고아)이 1개가 아님: {runs_count(root)}")

        # 재실행: 바이트 동일 고아를 보고 NOOP — 새 run 없음, 여전히 pointer 없음.
        res2 = run.run_market_day(build_request(root), calendar=CAL)
        check(res2.status == run.RUN_NOOP,
              f"고아 승격 재실행이 NOOP 아님: {res2.status} {res2.reasons}")
        check(runs_count(root) == 1, "재실행이 새 run 을 만듦")
        check(store.read_current(root).status == store.READ_UNAVAILABLE,
              "재실행이 (중단된) 고아를 승인 pointer 로 만듦")
    finally:
        cleanup(root)


# ===========================================================================
# E1. 게이트 조립 — preflight 실패는 계산/게시 이전에 거절(승인 pointer 없음).
# ===========================================================================
def test_preflight_gate_blocks():
    root = fresh_root()
    try:
        # stale 소스일 → preflight SOURCE_DATE_STALE.
        req = build_request(root)
        req["sourceDates"]["prices"] = "2026-07-10"
        res = run.run_market_day(req, calendar=CAL)
        check(res.status == run.RUN_REJECTED and run.PREFLIGHT_FAILED in res.reasons,
              f"stale 소스일이 PREFLIGHT_FAILED 아님: {res.status} {res.reasons}")
        check(runs_count(root) == 0 and store.read_current(root).status == store.READ_UNAVAILABLE,
              "preflight 실패인데 저장소에 흔적")

        # 공휴일(거래일 아님) → preflight MARKET_DATE_NOT_TRADING_DAY.
        holiday = "2026-07-16"
        req2 = build_request(root, market_date=holiday,
                             source_dates={"prices": holiday, "volumes": holiday,
                                           "fundamentals": "2026-07-13"})
        res2 = run.run_market_day(req2, calendar=CAL)
        check(res2.status == run.RUN_REJECTED and run.PREFLIGHT_FAILED in res2.reasons,
              f"공휴일이 PREFLIGHT_FAILED 아님: {res2.status} {res2.reasons}")

        # 캘린더 미제공 → preflight CALENDAR_UNCOVERED(fail closed).
        res3 = run.run_market_day(build_request(root), calendar=None)
        check(res3.status == run.RUN_REJECTED and run.PREFLIGHT_FAILED in res3.reasons,
              f"캘린더 없이 통과됨(fail closed 위반): {res3.status} {res3.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# E2. 게이트 조립 — eligibility QA 실패(fault 주입)는 게시 이전에 거절, 저장소 무흔적.
# ===========================================================================
def test_eligibility_gate_blocks():
    root = fresh_root()
    try:
        res = run.run_market_day(build_request(root), calendar=CAL,
                                 faults={run.FAULT_FAIL_ELIGIBILITY})
        check(res.status == run.RUN_REJECTED and run.ELIGIBILITY_FAILED in res.reasons,
              f"eligibility QA 실패가 ELIGIBILITY_FAILED 아님: {res.status} {res.reasons}")
        check(runs_count(root) == 0 and store.read_current(root).status == store.READ_UNAVAILABLE,
              "eligibility 실패인데 저장소에 흔적(게시 이전 거절 아님)")
    finally:
        cleanup(root)


# ===========================================================================
# E3. 게이트 조립 — 비공개 레이아웃 위반(public/ 밑 루트)은 preflight 가 거절하고 경로를 안 만든다.
# ===========================================================================
def test_public_root_rejected():
    pub_root = os.path.join(ROOT, "public", "data", "shadow-run-nope")
    req = build_request(pub_root)
    res = run.run_market_day(req, calendar=CAL)
    check(res.status == run.RUN_REJECTED and run.PREFLIGHT_FAILED in res.reasons,
          f"public 루트가 PREFLIGHT_FAILED 아님: {res.status} {res.reasons}")
    check(not os.path.exists(pub_root), "run 이 public 경로를 생성함(금지)")


# ===========================================================================
# F. 비교 조립 — 순차 두 거래일 run 은 직전 거래일과 pairing 되는 차등 증거를 남긴다.
# ===========================================================================
def test_sequential_comparison_evidence():
    root = fresh_root()
    try:
        d1 = build_request(root, market_date="2026-07-14",
                           source_dates={"prices": "2026-07-14", "volumes": "2026-07-14",
                                         "fundamentals": "2026-07-13"})
        r1 = run.run_market_day(d1, calendar=CAL)
        check(r1.status == run.RUN_PUBLISHED, f"1일차 게시 실패: {r1.status} {r1.reasons}")

        d2 = build_request(root, market_date="2026-07-15",
                           source_dates={"prices": "2026-07-15", "volumes": "2026-07-15",
                                         "fundamentals": "2026-07-13"})
        r2 = run.run_market_day(d2, calendar=CAL)
        check(r2.status == run.RUN_PUBLISHED, f"2일차 게시 실패: {r2.status} {r2.reasons}")

        pairing = r2.evidence["comparison"]["pairing"]
        check(pairing is not None and pairing["valid"],
              f"2일차 pairing 이 유효하지 않음: {pairing}")
        check(pairing["actualPreviousMarketDate"] == "2026-07-14",
              f"직전 거래일 pairing 불일치: {pairing}")
        check(pairing["expectedPreviousMarketDate"] == "2026-07-14",
              f"기대 직전 거래일 불일치(공휴일 07-16 무관): {pairing}")
        # pointer 는 최신 거래일을 가리킨다.
        check(store.read_current(root).pointer["snapshotId"] == r2.snapshotId,
              "순차 게시 후 pointer 가 최신일을 안 가리킴")
        check(runs_count(root) == 2, f"순차 두 거래일인데 run 이 2개 아님: {runs_count(root)}")

        # 1일차 재실행은 여전히 NOOP 이고 pointer 를 최신(2일차)에서 되돌리지 않는다.
        r1b = run.run_market_day(d1, calendar=CAL)
        check(r1b.status == run.RUN_NOOP, f"1일차 재실행이 NOOP 아님: {r1b.status}")
        check(store.read_current(root).pointer["snapshotId"] == r2.snapshotId,
              "과거일 재실행이 pointer 를 되돌림")
    finally:
        cleanup(root)


# ===========================================================================
# G1. 결정성 — 같은 입력은 같은 status/snapshotId/증거 정체성을 준다(벽시계/난수 없음).
# ===========================================================================
def test_determinism():
    root_a = fresh_root()
    root_b = fresh_root()
    try:
        ra = run.run_market_day(build_request(root_a), calendar=CAL)
        rb = run.run_market_day(build_request(root_b), calendar=CAL)
        check(ra.status == rb.status == run.RUN_PUBLISHED, "결정성: status 불일치")
        # runId 는 root 와 무관하게 스냅샷 정체성에서만 파생 → 같은 snapshotId.
        check(ra.snapshotId == rb.snapshotId, f"결정성: snapshotId 다름 {ra.snapshotId} vs {rb.snapshotId}")
        check(ra.evidence["configHash"] == rb.evidence["configHash"], "결정성: configHash 다름")
        check(ra.evidence["inputManifestHash"] == rb.evidence["inputManifestHash"],
              "결정성: inputManifestHash 다름")
    finally:
        cleanup(root_a)
        cleanup(root_b)


# ===========================================================================
# G2. 순수성 — 소스에 벽시계/난수/네트워크/공개데이터 쓰기 흔적 없음.
# ===========================================================================
def test_source_purity():
    src = open(os.path.join(HERE, "metrics251_run.py"), encoding="utf-8").read()
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"run 오케스트레이터에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("urllib", "requests", "socket"):
        check(banned not in code, f"run 오케스트레이터에 네트워크 흔적: {banned!r}")
    # 오케스트레이터는 공개 데이터 경로를 직접 참조/기록하지 않는다(산출물은 비공개 저장소 경유).
    check("public/data" not in code, "run 코드가 public/data 경로를 직접 참조")


def main():
    tests = [
        test_publish_happy_path,
        test_idempotent_rerun_is_noop,
        test_same_date_conflict_rejected,
        test_publish_faults_leave_no_pointer,
        test_interrupt_before_pointer_no_accepted_pointer,
        test_preflight_gate_blocks,
        test_eligibility_gate_blocks,
        test_public_root_rejected,
        test_sequential_comparison_evidence,
        test_determinism,
        test_source_purity,
    ]
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001  (테스트 하네스 — 예외도 실패로 수집)
            failures.append(f"{t.__name__} 예외: {e!r}")

    if failures:
        print(f"[FAIL] metrics251_run 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1

    print(f"[PASS] metrics251_run 계약 검증 통과 ({len(tests)} 케이스: "
          "게시·멱등NOOP·같은날짜충돌·게시fault원자성·pointer전중단·preflight게이트·"
          "eligibility게이트·public루트거절·순차비교증거·결정성·순수성).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
