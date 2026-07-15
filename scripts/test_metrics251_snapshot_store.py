#!/usr/bin/env python3
# Metrics 2.5.1 불변 shadow 저장소 계약·실패주입 게이트 — Slice F.
#
# 강제하는 계약(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D07, §M251-D10,
#   §8, §9, §10 Slice F):
#   A. 해피패스: publish → runs/<snapshotId>/{snapshot,manifest} 불변 승격 + current pointer,
#      reader 가 OK 로 pointer↔manifest↔산출물 무결성을 재검증하고 스냅샷을 반환.
#   B. 원자적 pointer 승격: 성공 publish 만 pointer 를 앞으로 옮긴다. 연속 publish 로 확인.
#   C. 실패 주입은 임시 디렉터리에서만 수행하고, 어떤 실패도 직전 정상 pointer 를 교체하지 않는다:
#      (1) 중단된 쓰기(manifest 전 / pointer 전), (2) 스키마 실패, (3) 체크섬 손상,
#      (4) pointer 손상, (5) QA 실패.
#   D. reader 는 손상/미완료 run 에서 부분 데이터를 반환하지 않고 typed unavailable/degraded 를 준다.
#   E. 불변성: 승격된 run 은 읽기전용이고 같은 snapshotId 재승격은 거부된다.
#   F. 비공개/공개분리: public/ 밑 루트는 거부되고, 저장소는 public pointer/공개 경로를 만들지 않는다.
#   G. 결정성: 같은 입력·runId → 같은 snapshotId·manifestHash·pointer(벽시계/난수 없음).
#
# Usage:
#   $env:PYTHONUTF8='1'; python scripts/test_metrics251_snapshot_store.py
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import metrics251_snapshot_store as store  # noqa: E402

CONFIG_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.json")
GOLDEN_SNAPSHOT_PATH = os.path.join(HERE, "fixtures", "metrics251", "golden_snapshot.json")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def load_snapshot():
    """Slice D 골든 스냅샷(엔진 산출물)을 유효 입력으로 재사용한다."""
    with open(GOLDEN_SNAPSHOT_PATH, encoding="utf-8") as f:
        return json.load(f)


VALID_SNAPSHOT = load_snapshot()


def fresh_root():
    d = tempfile.mkdtemp(prefix="m251store_")
    return d


def cleanup(d):
    store.rmtree_force(d)


# ===========================================================================
# A. 해피패스 — publish 승격 + reader OK.
# ===========================================================================
def test_happy_path():
    root = fresh_root()
    try:
        res = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="r1")
        check(res.ok, f"해피패스 publish 실패: {res.reasons} {res.detail}")
        check(res.snapshotId == f"{VALID_SNAPSHOT['marketDate']}__r1",
              f"snapshotId 형식 오류: {res.snapshotId}")
        # 승격된 산출물 존재.
        run_dir = os.path.join(root, store.RUNS_SUBDIR, res.snapshotId)
        check(os.path.exists(os.path.join(run_dir, store.ARTIFACT_SNAPSHOT)), "승격 snapshot.json 없음")
        check(os.path.exists(os.path.join(run_dir, store.ARTIFACT_MANIFEST)), "승격 manifest.json 없음")
        check(os.path.exists(os.path.join(root, store.POINTER_NAME)), "current pointer 없음")
        # pointer 필수 필드(§M251-D07).
        for k in ("snapshotId", "marketDate", "metricsVersion", "manifestHash"):
            check(k in res.pointer, f"pointer 필수 필드 누락: {k}")
        check(res.pointer["metricsVersion"] == "2.5.1", "pointer metricsVersion!=2.5.1")
        # reader OK + 스냅샷 왕복 일치.
        rr = store.read_current(root)
        check(rr.status == store.READ_OK, f"reader status!=OK: {rr.status} {rr.reasons}")
        check(rr.snapshot == VALID_SNAPSHOT, "reader 반환 스냅샷이 원본과 불일치")
        check(rr.manifest["runState"] == store.RUN_STATE_QA_PASSED, "manifest 가 QA_PASSED 봉인 아님")
    finally:
        cleanup(root)


# ===========================================================================
# B. 원자적 pointer 승격 — 두 번째 성공 publish 가 pointer 를 앞으로 옮긴다.
# ===========================================================================
def test_pointer_advances_on_success():
    root = fresh_root()
    try:
        store.publish_snapshot(root, VALID_SNAPSHOT, run_id="r1")
        snap2 = dict(VALID_SNAPSHOT)  # 같은 marketDate, 다른 runId → 다른 snapshotId
        res2 = store.publish_snapshot(root, snap2, run_id="r2")
        check(res2.ok, f"두번째 publish 실패: {res2.reasons}")
        rr = store.read_current(root)
        check(rr.status == store.READ_OK and rr.pointer["snapshotId"].endswith("__r2"),
              f"pointer 가 최신 성공본(r2)을 가리키지 않음: {rr.pointer}")
        # 두 run 모두 불변 저장소에 남아 있다(승격은 파괴적이지 않다).
        check(os.path.isdir(os.path.join(root, store.RUNS_SUBDIR, f"{VALID_SNAPSHOT['marketDate']}__r1")),
              "직전 run(r1) 디렉터리가 사라짐")
    finally:
        cleanup(root)


# ===========================================================================
# C1. 중단된 쓰기(manifest 전) — 승격/ pointer 없음, 직전 정상본 유지.
# ===========================================================================
def test_interrupt_before_manifest_keeps_last_good():
    root = fresh_root()
    try:
        good = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="good")
        res = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="bad",
                                     faults={"interrupt_before_manifest"})
        check(not res.ok and store.PUBLISH_WRITE_INTERRUPTED in res.reasons,
              f"manifest 전 중단이 실패로 보고되지 않음: {res.reasons}")
        # bad run 은 승격되지 않았다.
        check(not os.path.isdir(os.path.join(root, store.RUNS_SUBDIR,
              f"{VALID_SNAPSHOT['marketDate']}__bad")), "중단된 run 이 승격됨(금지)")
        # pointer 는 여전히 good 을 가리킨다.
        rr = store.read_current(root)
        check(rr.status == store.READ_OK and rr.pointer["snapshotId"] == good.snapshotId,
              f"중단 후 pointer 가 직전 정상본을 유지하지 않음: {rr.pointer}")
    finally:
        cleanup(root)


# ===========================================================================
# C1b. 중단된 쓰기(pointer 교체 전) — 승격은 됐지만 pointer 는 직전 정상본 유지.
# ===========================================================================
def test_interrupt_before_pointer_keeps_last_good():
    root = fresh_root()
    try:
        good = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="good")
        res = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="late",
                                     faults={"interrupt_before_pointer"})
        check(not res.ok and store.PUBLISH_WRITE_INTERRUPTED in res.reasons,
              f"pointer 전 중단이 실패로 보고되지 않음: {res.reasons}")
        # late run 은 승격됐을 수 있으나(불변 저장) pointer 는 good 을 유지해야 한다(§9).
        rr = store.read_current(root)
        check(rr.status == store.READ_OK and rr.pointer["snapshotId"] == good.snapshotId,
              f"pointer 교체 전 중단이 직전 pointer 를 바꿈(금지): {rr.pointer}")
    finally:
        cleanup(root)


# ===========================================================================
# C2. 스키마 실패 — publish 거부, tmp/승격/pointer 없음.
# ===========================================================================
def test_schema_failure():
    root = fresh_root()
    try:
        good = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="good")
        bad_snapshot = dict(VALID_SNAPSHOT)
        del bad_snapshot["stocks"]  # 필수 키 제거 → 스키마 위반
        res = store.publish_snapshot(root, bad_snapshot, run_id="badschema")
        check(not res.ok and store.PUBLISH_SCHEMA_INVALID in res.reasons,
              f"스키마 실패가 거부되지 않음: {res.reasons}")
        check(res.detail and any("stocks" in e for e in res.detail),
              f"스키마 오류 세부에 누락 키가 없음: {res.detail}")
        # 빈 문자열 marketDate 도 거부.
        bad2 = dict(VALID_SNAPSHOT); bad2["marketDate"] = ""
        res2 = store.publish_snapshot(root, bad2, run_id="badmd")
        check(not res2.ok and store.PUBLISH_SCHEMA_INVALID in res2.reasons,
              "빈 marketDate 가 거부되지 않음")
        # pointer 는 여전히 good.
        rr = store.read_current(root)
        check(rr.status == store.READ_OK and rr.pointer["snapshotId"] == good.snapshotId,
              "스키마 실패 후 pointer 가 바뀜(금지)")
    finally:
        cleanup(root)


# ===========================================================================
# C3a. 체크섬 손상(승격 전 자기검증) — corrupt_artifact_after_manifest.
# ===========================================================================
def test_checksum_corruption_pre_promote():
    root = fresh_root()
    try:
        good = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="good")
        res = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="corrupt",
                                     faults={"corrupt_artifact_after_manifest"})
        check(not res.ok and store.PUBLISH_CHECKSUM_MISMATCH in res.reasons,
              f"산출물 손상이 승격 전 자기검증에서 잡히지 않음: {res.reasons}")
        check(not os.path.isdir(os.path.join(root, store.RUNS_SUBDIR,
              f"{VALID_SNAPSHOT['marketDate']}__corrupt")), "손상된 run 이 승격됨(금지)")
        rr = store.read_current(root)
        check(rr.status == store.READ_OK and rr.pointer["snapshotId"] == good.snapshotId,
              "체크섬 손상 후 pointer 가 바뀜(금지)")
    finally:
        cleanup(root)


# ===========================================================================
# C3b. 체크섬 손상(승격 후 산출물 변조) — reader 가 DEGRADED, 부분 데이터 금지.
# ===========================================================================
def test_checksum_corruption_post_promote():
    root = fresh_root()
    try:
        res = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="r1")
        run_dir = os.path.join(root, store.RUNS_SUBDIR, res.snapshotId)
        snap_path = os.path.join(run_dir, store.ARTIFACT_SNAPSHOT)
        # 불변(읽기전용) 파일을 강제로 변조(공격/비트 부패 시뮬레이션).
        os.chmod(snap_path, 0o600)
        with open(snap_path, "ab") as f:
            f.write(b" ")
        rr = store.read_current(root)
        check(rr.status == store.READ_DEGRADED and store.READ_CHECKSUM_MISMATCH in rr.reasons,
              f"승격 후 산출물 변조가 DEGRADED 로 감지되지 않음: {rr.status} {rr.reasons}")
        check(rr.snapshot is None, "손상 감지 후 부분 스냅샷을 반환함(금지)")
    finally:
        cleanup(root)


# ===========================================================================
# C4. pointer 손상 — reader 가 typed UNAVAILABLE, 부분 데이터 금지.
# ===========================================================================
def test_pointer_corruption():
    root = fresh_root()
    try:
        store.publish_snapshot(root, VALID_SNAPSHOT, run_id="r1")
        pointer_path = os.path.join(root, store.POINTER_NAME)
        # (i) JSON 자체가 깨짐.
        with open(pointer_path, "w", encoding="utf-8") as f:
            f.write("{ this is not json")
        rr = store.read_current(root)
        check(rr.status == store.READ_UNAVAILABLE and store.READ_POINTER_UNREADABLE in rr.reasons,
              f"깨진 pointer JSON 이 UNAVAILABLE 아님: {rr.status} {rr.reasons}")
        check(rr.snapshot is None, "pointer 손상 후 부분 스냅샷 반환(금지)")
        # (ii) JSON 은 유효하나 필수 필드 누락.
        with open(pointer_path, "w", encoding="utf-8") as f:
            json.dump({"snapshotId": "x"}, f)
        rr2 = store.read_current(root)
        check(rr2.status == store.READ_UNAVAILABLE and store.READ_POINTER_INVALID in rr2.reasons,
              f"필드 누락 pointer 가 UNAVAILABLE/INVALID 아님: {rr2.status} {rr2.reasons}")
        # (iii) pointer 가 존재하지 않는 run 을 가리킴 → DEGRADED(정상 pointer 유지 필요 신호).
        with open(pointer_path, "w", encoding="utf-8") as f:
            json.dump({"snapshotId": "2000-01-01__ghost", "marketDate": "2000-01-01",
                       "metricsVersion": "2.5.1", "manifestHash": "deadbeef"}, f)
        rr3 = store.read_current(root)
        check(rr3.status == store.READ_DEGRADED and store.READ_RUN_MISSING in rr3.reasons,
              f"유령 run pointer 가 DEGRADED/RUN_MISSING 아님: {rr3.status} {rr3.reasons}")
        check(rr3.snapshot is None, "유령 run 에서 부분 스냅샷 반환(금지)")
    finally:
        cleanup(root)


# ===========================================================================
# C4b. pointer↔manifest 해시 불일치 — DEGRADED.
# ===========================================================================
def test_pointer_manifest_hash_mismatch():
    root = fresh_root()
    try:
        res = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="r1")
        pointer_path = os.path.join(root, store.POINTER_NAME)
        with open(pointer_path, encoding="utf-8") as f:
            pointer = json.load(f)
        pointer["manifestHash"] = "0" * 64  # run 은 멀쩡하지만 pointer 가 다른 해시를 주장
        with open(pointer_path, "w", encoding="utf-8") as f:
            json.dump(pointer, f)
        rr = store.read_current(root)
        check(rr.status == store.READ_DEGRADED
              and store.READ_POINTER_MANIFEST_MISMATCH in rr.reasons,
              f"pointer↔manifest 불일치가 DEGRADED 아님: {rr.status} {rr.reasons}")
        check(rr.snapshot is None, "pointer↔manifest 불일치에서 부분 데이터 반환(금지)")
    finally:
        cleanup(root)


# ===========================================================================
# C5. QA 실패 — 봉인/승격/pointer 없음, 직전 정상본 유지.
# ===========================================================================
def test_qa_failure():
    root = fresh_root()
    try:
        good = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="good")
        # (i) fault 토큰으로 QA 실패.
        res = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="qa", faults={"fail_qa"})
        check(not res.ok and store.PUBLISH_QA_FAILED in res.reasons,
              f"fail_qa 가 QA_FAILED 로 거부되지 않음: {res.reasons}")
        # (ii) qa_check 콜백이 False 반환.
        res2 = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="qa2",
                                      qa_check=lambda s: False)
        check(not res2.ok and store.PUBLISH_QA_FAILED in res2.reasons,
              f"qa_check False 가 QA_FAILED 아님: {res2.reasons}")
        # QA 실패 run 은 승격되지 않았고 pointer 는 good 유지.
        check(not os.path.isdir(os.path.join(root, store.RUNS_SUBDIR,
              f"{VALID_SNAPSHOT['marketDate']}__qa")), "QA 실패 run 이 승격됨(금지)")
        rr = store.read_current(root)
        check(rr.status == store.READ_OK and rr.pointer["snapshotId"] == good.snapshotId,
              "QA 실패 후 pointer 가 바뀜(금지)")
        # 성공적인 qa_check(True)는 게시된다.
        res3 = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="qa3", qa_check=lambda s: True)
        check(res3.ok, f"qa_check True 인데 게시 실패: {res3.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# D. reader — pointer 없음(아직 아무것도 게시 안 됨) → UNAVAILABLE.
# ===========================================================================
def test_read_no_pointer():
    root = fresh_root()
    try:
        rr = store.read_current(root)
        check(rr.status == store.READ_UNAVAILABLE and store.READ_NO_POINTER in rr.reasons,
              f"pointer 없음이 UNAVAILABLE/NO_POINTER 아님: {rr.status} {rr.reasons}")
        check(rr.snapshot is None, "pointer 없음인데 스냅샷 반환")
    finally:
        cleanup(root)


# ===========================================================================
# E. 불변성 — 승격 run 은 읽기전용, 같은 snapshotId 재승격 거부.
# ===========================================================================
def test_immutability():
    root = fresh_root()
    try:
        res = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="r1")
        run_dir = os.path.join(root, store.RUNS_SUBDIR, res.snapshotId)
        snap_path = os.path.join(run_dir, store.ARTIFACT_SNAPSHOT)
        # 읽기전용: 직접 쓰기 시도가 실패해야 한다.
        wrote = True
        try:
            with open(snap_path, "w", encoding="utf-8") as f:
                f.write("x")
        except (PermissionError, OSError):
            wrote = False
        check(not wrote, "승격된 산출물이 읽기전용이 아님(불변성 위반)")
        # 같은 runId(→같은 snapshotId) 재게시는 거부.
        res2 = store.publish_snapshot(root, VALID_SNAPSHOT, run_id="r1")
        check(not res2.ok and store.PUBLISH_ALREADY_PROMOTED in res2.reasons,
              f"같은 snapshotId 재승격이 거부되지 않음: {res2.reasons}")
    finally:
        cleanup(root)


# ===========================================================================
# F. 비공개/공개분리 — public/ 밑 루트 거부, 저장소가 공개 경로를 만들지 않음.
# ===========================================================================
def test_private_root_guard():
    public_root = os.path.join(ROOT, "public", "data", "shadow-should-not-exist")
    raised = False
    try:
        store.assert_private_root(public_root)
    except ValueError:
        raised = True
    check(raised, "public/ 밑 루트가 거부되지 않음(§M251-D10 위반)")
    # publish 도 같은 가드로 막힌다.
    raised2 = False
    try:
        store.publish_snapshot(public_root, VALID_SNAPSHOT, run_id="x")
    except ValueError:
        raised2 = True
    check(raised2, "public/ 밑 publish 가 거부되지 않음")
    check(not os.path.exists(public_root), "publish 가드 실패로 public 경로가 생성됨(금지)")
    # 기본 루트는 public 밖이며 .gitignore 로 제외되는 경로다.
    check("public" not in os.path.relpath(store.DEFAULT_SHADOW_ROOT, ROOT).split(os.sep),
          "기본 shadow 루트가 public 밑에 있음")


# ===========================================================================
# G. 결정성 — 같은 입력·runId → 같은 snapshotId·manifestHash·pointer.
# ===========================================================================
def test_determinism():
    root_a = fresh_root()
    root_b = fresh_root()
    try:
        a = store.publish_snapshot(root_a, VALID_SNAPSHOT, run_id="r1")
        b = store.publish_snapshot(root_b, VALID_SNAPSHOT, run_id="r1")
        check(a.ok and b.ok, "결정성 publish 실패")
        check(a.snapshotId == b.snapshotId, "같은 입력·runId 인데 snapshotId 다름")
        check(a.pointer["manifestHash"] == b.pointer["manifestHash"],
              "같은 입력인데 manifestHash 다름(비결정)")
        check(a.pointer == b.pointer, "같은 입력인데 pointer 다름(비결정)")
    finally:
        cleanup(root_a)
        cleanup(root_b)


# ===========================================================================
# 소스 순수성 — 벽시계/난수/공개경로 흔적 없음.
# ===========================================================================
def test_source_purity():
    src = open(os.path.join(HERE, "metrics251_snapshot_store.py"), encoding="utf-8").read()
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    for banned in ("datetime.now(", "time.time(", "date.today(", "utcnow(", "random("):
        check(banned not in code, f"저장소에 결정성 위반(벽시계/난수): {banned!r}")
    for banned in ("urllib", "requests", "socket"):
        check(banned not in code, f"저장소에 네트워크 흔적: {banned!r}")
    # 공개 데이터 경로를 코드가 직접 다루지 않는다(가드는 문자열 'public' 을 참조하지만 쓰기는 없음).
    check("public/data" not in code, "저장소 코드가 public/data 경로를 직접 참조")


def main():
    tests = [
        test_happy_path,
        test_pointer_advances_on_success,
        test_interrupt_before_manifest_keeps_last_good,
        test_interrupt_before_pointer_keeps_last_good,
        test_schema_failure,
        test_checksum_corruption_pre_promote,
        test_checksum_corruption_post_promote,
        test_pointer_corruption,
        test_pointer_manifest_hash_mismatch,
        test_qa_failure,
        test_read_no_pointer,
        test_immutability,
        test_private_root_guard,
        test_determinism,
        test_source_purity,
    ]
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001  (테스트 하네스 — 예외도 실패로 수집)
            failures.append(f"{t.__name__} 예외: {e!r}")

    if failures:
        print(f"[FAIL] metrics251_snapshot_store 계약 검증 {len(failures)}건 실패:")
        for x in failures:
            print(f"  - {x}")
        return 1

    print(f"[PASS] metrics251_snapshot_store 계약 검증 통과 ({len(tests)} 케이스: "
          "해피패스·원자적 pointer 승격·중단(manifest/pointer 전)·스키마실패·체크섬손상(승격전/후)·"
          "pointer손상·pointer↔manifest불일치·QA실패·pointer없음·불변성·비공개루트·결정성·순수성).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
