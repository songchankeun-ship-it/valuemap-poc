#!/usr/bin/env python3
# Metrics 2.5.1 end-to-end fault-matrix 계약 게이트 — Slice Q.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02/D07/D10,
#   §7 Gate 4, §8, §9, 원안 ORN-2503/2508, 작업 지시):
#   * preflight→run→게이트의 완전한 워크플로를 유한한 fixture fault matrix 로 종단 실행하고,
#     11개 시나리오 각각의 결정적 결과를 검증한다:
#       clean first run · identical rerun · conflicting rerun · interrupted write · corrupt manifest ·
#       source-date mismatch · unknown exclusion reason · unresolved P0 · invalid output location ·
#       missing-day continuity reset · five consecutive passing.
#   * **안전 명제**: 모든 fixture 산출물이 합성-테스트 마커를 싣고, genuine-run 게이트가 그 전부를
#     거부한다(반면 마커 없는 산출물은 통과) — 합성 증거의 실거래일 세탁을 원천 차단.
#   * 결정성: 같은 입력 → 같은 관측(matrixHash 재실행 동일).
#   * 순수성: 하네스 소스에 벽시계/난수/네트워크/public 데이터 경로 흔적 없음.
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_e2e_matrix.py
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_e2e_matrix as e2e         # noqa: E402
import metrics251_run as run                # noqa: E402
import metrics251_preflight as pf           # noqa: E402
import metrics251_rollout_gate as rg        # noqa: E402
import metrics251_snapshot_store as store   # noqa: E402

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def _run_matrix():
    """fresh 임시 비공개 루트를 store 시나리오마다 공급하고 matrix 를 실행한 뒤 정리한다."""
    created = []

    def factory():
        d = tempfile.mkdtemp(prefix="m251_e2e_test_")
        created.append(d)
        return d

    try:
        results, artifacts = e2e.run_matrix(factory)
    finally:
        for d in created:
            store.rmtree_force(d)
    return results, artifacts


def _by_name(results):
    return {r.scenario: r for r in results}


# ===========================================================================
# A. 11개 시나리오 각각의 결정적 결과 — 완전한 preflight→run→게이트 워크플로.
# ===========================================================================
def test_scenarios_matrix():
    results, _artifacts = _run_matrix()
    by = _by_name(results)

    # 목록 완전성 — 정확히 11개 시나리오, 지시된 이름 전부.
    expected_names = {
        "clean_first_run", "identical_rerun", "conflicting_rerun", "interrupted_write",
        "corrupt_manifest", "source_date_mismatch", "unknown_exclusion_reason", "unresolved_p0",
        "invalid_output_location", "missing_day_continuity_reset", "five_consecutive_passing",
    }
    check(set(by) == expected_names, f"시나리오 목록 불일치: {sorted(set(by) ^ expected_names)}")
    check(len(results) == 11, f"시나리오 개수 11 아님: {len(results)}")

    # 1) clean first run — 게시·pointer·게이트 체인(PENDING).
    o = by["clean_first_run"].observed
    check(o["status"] == run.RUN_PUBLISHED, f"clean: 게시 아님 {o}")
    check(o["readStatus"] == store.READ_OK and o["pointerToCandidate"], f"clean: read/pointer {o}")
    check(o["runsCount"] == 1, f"clean: run 수 {o}")
    check(o["gateStatus"] == rg.GATE_PENDING and o["gateActualRuns"] == 1
          and o["gateRolloutCandidate"] is False, f"clean: 게이트 체인 {o}")
    check(o["ledgerAcceptedRuns"] == 1, f"clean: 원장 승인 run {o}")

    # 2) identical rerun — 멱등 NOOP.
    o = by["identical_rerun"].observed
    check(o["firstStatus"] == run.RUN_PUBLISHED and o["rerunStatus"] == run.RUN_NOOP,
          f"identical: NOOP 아님 {o}")
    check(o["sameSnapshotId"] and o["runsCount"] == 1 and o["pointerUnchanged"],
          f"identical: 멱등 불변 위반 {o}")

    # 3) conflicting rerun — 같은 시장일 충돌.
    o = by["conflicting_rerun"].observed
    check(o["conflictStatus"] == run.RUN_REJECTED
          and run.SAME_DATE_CONFLICT in o["conflictReasons"], f"conflict: 사유 {o}")
    check(o["differentCandidate"] and o["runsCount"] == 1 and o["pointerUnchanged"],
          f"conflict: 불변 위치 보존 위반 {o}")

    # 4) interrupted write — 두 중단 지점 모두 승인 pointer 없음(원자성).
    o = by["interrupted_write"].observed
    for fault in ("interrupt_before_manifest", "interrupt_before_pointer"):
        sub = o[fault]
        check(sub["status"] == run.RUN_REJECTED and run.PUBLISH_FAILED in sub["reasons"],
              f"interrupt[{fault}]: PUBLISH_FAILED 아님 {sub}")
        check(sub["readStatus"] == store.READ_UNAVAILABLE,
              f"interrupt[{fault}]: 승인 pointer 존재(원자성 위반) {sub}")
    check(o["interrupt_before_manifest"]["runsCount"] == 0, f"interrupt: manifest 전 run 잔존 {o}")
    check(o["interrupt_before_pointer"]["runsCount"] == 1, f"interrupt: 고아 run 수 {o}")

    # 5) corrupt manifest — reader DEGRADED·게이트 run 무결성 실패.
    o = by["corrupt_manifest"].observed
    check(o["publishStatus"] == run.RUN_PUBLISHED, f"corrupt: 선행 게시 실패 {o}")
    check(o["readStatus"] == store.READ_DEGRADED
          and store.READ_MANIFEST_HASH_MISMATCH in o["readReasons"], f"corrupt: reader {o}")
    check(rg.FAIL_MANIFEST_COMPROMISED in o["runFailReasons"]
          and rg.FAIL_NOT_QA_PASSED in o["runFailReasons"], f"corrupt: 게이트 무결성 {o}")

    # 6) source-date mismatch — preflight 거절.
    o = by["source_date_mismatch"].observed
    check(o["status"] == run.RUN_REJECTED and run.PREFLIGHT_FAILED in o["reasons"],
          f"source mismatch: 거절 아님 {o}")
    check(o["hasSourceMismatch"] and pf.SOURCE_DATE_MISMATCH in o["preflightReasons"],
          f"source mismatch: 사유 {o}")
    check(o["runsCount"] == 0, f"source mismatch: 저장소 흔적 {o}")

    # 7) unknown exclusion reason — 게이트 run 실패.
    o = by["unknown_exclusion_reason"].observed
    check(o["passesRunChecks"] is False and o["hasUnknownReason"], f"unknown reason: {o}")
    check("momentum.WEIRD_UNKNOWN_CODE" in o["unknownKeys"], f"unknown reason: 키 {o}")

    # 8) unresolved P0 — 게이트 run 실패.
    o = by["unresolved_p0"].observed
    check(o["passesRunChecks"] is False and o["hasUnresolvedP0"] and o["unresolvedP0"] == 1,
          f"unresolved P0: {o}")

    # 9) invalid output location — preflight 레이아웃 거절·경로 미생성.
    o = by["invalid_output_location"].observed
    check(o["status"] == run.RUN_REJECTED and run.PREFLIGHT_FAILED in o["reasons"],
          f"invalid output: 거절 아님 {o}")
    check(o["hasLayoutViolation"] and pf.OUTPUT_ESCAPES_SHADOW_ROOT in o["preflightReasons"],
          f"invalid output: 사유 {o}")
    check(o["runsCount"] == 0 and o["badOutputCreated"] is False,
          f"invalid output: 경로 생성/흔적 {o}")

    # 10) missing-day continuity reset — 연속성 초기화, NOT_MET.
    o = by["missing_day_continuity_reset"].observed
    check(o["status"] == rg.GATE_NOT_MET and o["rolloutCandidate"] is False,
          f"continuity reset: 상태 {o}")
    check(o["actualRuns"] == 5 and o["trailing"] < rg.MIN_CONSECUTIVE_RUNS and o["continuityBroken"],
          f"continuity reset: 후행 연속/차단 {o}")
    check(o["gaps"], f"continuity reset: gap 미검출 {o}")

    # 11) five consecutive passing — MET(합성 fixture 위에서만).
    o = by["five_consecutive_passing"].observed
    check(o["status"] == rg.GATE_MET and o["rolloutCandidate"] is True, f"5-consecutive: MET 아님 {o}")
    check(o["actualRuns"] == 5 and o["trailing"] == 5 and o["fourZeroAllZero"],
          f"5-consecutive: 창/4-zero {o}")
    check(len(o["windowDates"]) == 5, f"5-consecutive: 창 크기 {o}")


# ===========================================================================
# B. 안전 명제 — 모든 fixture 산출물이 마커를 싣고 genuine-run 게이트가 전부 거부한다.
#    (마커 없는 산출물은 통과 — 게이트가 자명하게 전부 거부하는 게 아님을 보인다.)
# ===========================================================================
def test_every_artifact_marked_and_rejected():
    results, artifacts = _run_matrix()
    check(len(artifacts) >= 11, f"산출물 수가 시나리오보다 적음: {len(artifacts)}")

    for i, art in enumerate(artifacts):
        check(e2e.carries_synthetic_marker(art),
              f"산출물[{i}]에 합성 마커 없음: {json.dumps(art, ensure_ascii=False, default=str)[:200]}")
        accepted, reasons = e2e.genuine_run_gate(art)
        check(accepted is False and e2e.GENUINE_REJECT_SYNTHETIC in reasons,
              f"산출물[{i}]이 genuine-run 게이트를 통과함(세탁 위험): {reasons}")

    # 시나리오별로도 최소 하나의 산출물을 싣는다(빈 시나리오 없음).
    for r in results:
        check(len(r.artifacts) >= 1, f"{r.scenario}: 산출물 0개")

    # 11번 MET 경로의 5개 run 기록 전부가 거부되어야 한다(핵심: MET 세탁 불가).
    five = _by_name(results)["five_consecutive_passing"]
    check(len(five.artifacts) == 5, f"5-consecutive: 기록 5개 아님 {len(five.artifacts)}")
    for rec in five.artifacts:
        check(e2e.genuine_run_gate(rec)[0] is False, "5-consecutive MET 기록이 genuine 게이트 통과")


def test_genuine_gate_positive_control():
    """마커 없는 산출물은 genuine-run 게이트를 통과한다 — 게이트가 무조건 거부하는 게 아님."""
    clean = {"marketDate": "2026-07-06",
             "sourceDates": {"prices": "2026-07-06", "volumes": "2026-07-06"},
             "stocks": [{"ticker": "000100"}]}
    accepted, reasons = e2e.genuine_run_gate(clean)
    check(accepted is True and reasons == [], f"마커 없는 산출물이 거부됨: {reasons}")
    check(e2e.carries_synthetic_marker(clean) is False, "마커 없는 산출물이 마커 있다고 오탐")

    # 마커를 심으면 즉시 거부된다.
    stamped = e2e.stamp_synthetic(clean)
    check(e2e.carries_synthetic_marker(stamped), "stamp 후 마커 미검출")
    check(e2e.genuine_run_gate(stamped)[0] is False, "stamp 후에도 통과")

    # 마커가 깊게 중첩돼도 재귀 스캔이 잡는다.
    nested = {"a": {"b": [{"c": e2e.SYNTHETIC_MARKER}]}}
    check(e2e.carries_synthetic_marker(nested), "중첩 마커 미검출(재귀 스캔 실패)")


# ===========================================================================
# C. 결정성 — 같은 입력 → 같은 matrixHash(재실행 동일). 벽시계/난수 없음.
# ===========================================================================
def test_determinism():
    r1, _ = _run_matrix()
    r2, _ = _run_matrix()
    check(e2e.matrix_hash(r1) == e2e.matrix_hash(r2),
          "matrixHash 재실행 불일치(결정성 위반 — 벽시계/난수/경로 누출 의심)")


# ===========================================================================
# D. 순수성 — 하네스 소스에 벽시계/난수/네트워크/public 데이터 경로 흔적 없음.
# ===========================================================================
def test_source_purity():
    src = open(os.path.join(HERE, "metrics251_e2e_matrix.py"), encoding="utf-8").read()
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"하네스에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("urllib", "requests", "socket"):
        check(banned not in code, f"하네스에 네트워크 흔적: {banned!r}")
    check("public/data" not in code, "하네스가 public/data 경로를 직접 참조")


def main():
    tests = [
        test_scenarios_matrix,
        test_every_artifact_marked_and_rejected,
        test_genuine_gate_positive_control,
        test_determinism,
        test_source_purity,
    ]
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001  (테스트 하네스 — 예외도 실패로 수집)
            failures.append(f"{t.__name__} 예외: {e!r}")

    if failures:
        print(f"[FAIL] metrics251_e2e_matrix 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1

    print(f"[PASS] metrics251_e2e_matrix 계약 검증 통과 ({len(tests)} 케이스: "
          "11시나리오 fault matrix·모든 산출물 합성마커+genuine게이트 거부·positive control·"
          "결정성·순수성).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
