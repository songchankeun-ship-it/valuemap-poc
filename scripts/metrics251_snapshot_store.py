#!/usr/bin/env python3
# Metrics 2.5.1 불변 shadow snapshot 저장소 계약 (Slice F) — 순수·결정적·표준 라이브러리 전용.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D07, §M251-D10,
#      §8 데이터 계약, §9 실패/롤백 규칙, §10 Slice F, 원안 티켓 ORN-2503):
#   * Slice D 순수 엔진이 만든 후보 스냅샷(dict)을 비공개 로컬 저장소에 안전하게 게시한다.
#   * §M251-D07 원자적 승격 순서만 허용한다:
#       1) 고유 runId 임시 디렉터리에 canonical 산출물 작성
#       2) 스키마·행 수·기준일·해시·QA 검증
#       3) 각 산출물 SHA-256 + 상태를 담은 manifest 작성
#       4) manifest 를 QA_PASSED 로 봉인
#       5) 완성된 run 디렉터리를 불변 위치로 승격(runs/<snapshotId>)
#       6) 마지막에 작은 current pointer 를 원자적으로 교체
#       7) reader 가 pointer 와 manifest 해시를 다시 검증
#   * pointer 는 최소 snapshotId·marketDate·metricsVersion·manifestHash 를 담는다.
#   * 실패한 run 은 절대 직전 정상 pointer 를 교체하지 않는다(§9). reader 는 손상/미완료 run 을
#     만나면 부분 데이터를 반환하지 않고 typed unavailable/degraded 결과를 준다.
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · §M251-D10 · 작업 지시):
#   * shadow 기본 출력은 Git 비추적 로컬 경로다(.gitignore 로 제외, public/ 밖). public pointer 를
#     만들지 않고 공개 데이터 경로(public/data)를 건드리지 않는다. assert_private_root 로 강제한다.
#   * 벽시계 시각 금지(datetime.now()/time.time()/date.today() 등)·난수 금지 — 출력은 입력에서만 파생.
#   * 결측을 50/factor 평균으로 채우지 않는다(이 층은 저장/무결성만 담당, 계산은 엔진 소유).
#   * 승격된 run 은 불변이다: 같은 snapshotId 를 덮어쓰지 않고, 파일을 읽기전용으로 만든다.
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import stat
import sys
from dataclasses import dataclass, field
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from metrics251_config import canonical_bytes  # noqa: E402  (Slice B canonical 직렬화 재사용)

ENGINE_VERSION = "2.5.1"

# ---------------------------------------------------------------------------
# 저장소 레이아웃(비공개·Git 비추적).
# ---------------------------------------------------------------------------
DEFAULT_SHADOW_ROOT = os.path.join(ROOT, ".metrics251-shadow")  # .gitignore 로 제외됨(§M251-D10)
TMP_SUBDIR = "tmp"
RUNS_SUBDIR = "runs"
POINTER_NAME = "current.json"          # shadow current pointer(원자적 교체)
ARTIFACT_SNAPSHOT = "snapshot.json"    # canonical 스냅샷 산출물
ARTIFACT_MANIFEST = "manifest.json"    # 체크섬 manifest(봉인)

# manifest 봉인 상태.
RUN_STATE_QA_PASSED = "QA_PASSED"

# ---------------------------------------------------------------------------
# 결과 상태(typed). reader 는 부분 데이터를 반환하지 않는다(설계서 §M251-D07 7항).
# ---------------------------------------------------------------------------
READ_OK = "OK"                  # pointer→manifest→산출물 무결성 전부 통과, 스냅샷 반환
READ_UNAVAILABLE = "UNAVAILABLE"  # pointer 자체가 없거나 읽을 수 없음(정상본 없음)
READ_DEGRADED = "DEGRADED"        # pointer 는 있으나 가리키는 run 이 손상/미완료(직전 정상본 유지 필요)

# publish 실패 사유(§9 실패/롤백에 대응). 실패 시 pointer 는 절대 교체되지 않는다.
PUBLISH_SCHEMA_INVALID = "SCHEMA_INVALID"
PUBLISH_QA_FAILED = "QA_FAILED"
PUBLISH_WRITE_INTERRUPTED = "WRITE_INTERRUPTED"
PUBLISH_CHECKSUM_MISMATCH = "CHECKSUM_MISMATCH"
PUBLISH_ALREADY_PROMOTED = "ALREADY_PROMOTED"

# reader 무결성 실패 사유.
READ_NO_POINTER = "NO_POINTER"
READ_POINTER_UNREADABLE = "POINTER_UNREADABLE"
READ_POINTER_INVALID = "POINTER_INVALID"
READ_RUN_MISSING = "RUN_MISSING"
READ_MANIFEST_MISSING = "MANIFEST_MISSING"
READ_MANIFEST_UNREADABLE = "MANIFEST_UNREADABLE"
READ_MANIFEST_HASH_MISMATCH = "MANIFEST_HASH_MISMATCH"
READ_POINTER_MANIFEST_MISMATCH = "POINTER_MANIFEST_MISMATCH"
READ_ARTIFACT_MISSING = "ARTIFACT_MISSING"
READ_CHECKSUM_MISMATCH = "CHECKSUM_MISMATCH"
READ_NOT_SEALED = "NOT_SEALED"

# 스냅샷 최소 스키마 — 엔진 CandidateSnapshot.to_dict() 계약(설계서 §8).
_REQUIRED_SNAPSHOT_KEYS = {
    "engineVersion": str,
    "configHash": str,
    "inputManifestHash": str,
    "marketDate": str,
    "sourceDates": dict,
    "runState": str,
    "stocks": list,
    "factorPopulations": dict,
    "rankingPopulation": dict,
    "eligibilityReasonCounts": dict,
}


@dataclass
class PublishResult:
    ok: bool
    reasons: list = field(default_factory=list)  # 실패 사유 코드(성공 시 빈 리스트)
    snapshotId: Optional[str] = None
    pointer: Optional[dict] = None
    detail: Optional[list] = None                 # 스키마 오류 등 세부(진단용)


@dataclass
class ReadResult:
    status: str                                   # READ_OK | READ_UNAVAILABLE | READ_DEGRADED
    reasons: list = field(default_factory=list)
    snapshot: Optional[dict] = None               # 무결성 전부 통과했을 때만 채운다(부분 데이터 금지)
    pointer: Optional[dict] = None
    manifest: Optional[dict] = None


@dataclass
class VerifyResult:
    ok: bool
    reasons: list = field(default_factory=list)
    manifest: Optional[dict] = None


# ---------------------------------------------------------------------------
# 비공개 루트 가드 — public/ 밑이나 공개 데이터 경로에는 절대 쓰지 않는다(§M251-D10).
# ---------------------------------------------------------------------------
def assert_private_root(root):
    """저장소 루트가 public/ 밑이 아님을 강제한다. 위반 시 ValueError."""
    root_abs = os.path.abspath(root)
    public_abs = os.path.abspath(os.path.join(ROOT, "public"))
    try:
        common = os.path.commonpath([root_abs, public_abs])
    except ValueError:
        return root_abs  # 다른 드라이브 등 — public 밑일 수 없음
    if common == public_abs:
        raise ValueError(
            f"shadow 저장소 루트가 공개 경로(public/) 밑에 있음 — 금지(§M251-D10): {root_abs}")
    return root_abs


# ---------------------------------------------------------------------------
# 원자적 파일 쓰기·읽기전용·강제 삭제 헬퍼.
# ---------------------------------------------------------------------------
def _atomic_write_bytes(path, data):
    """같은 디렉터리 임시 파일에 쓰고 os.replace 로 원자 교체(부분 파일 노출 방지)."""
    tmp = path + ".part"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def _sha256(data):
    return hashlib.sha256(data).hexdigest()


def _make_readonly_tree(path):
    """승격된 run 을 불변으로 만든다 — 트리 내 모든 파일을 읽기전용으로."""
    for base, _dirs, files in os.walk(path):
        for name in files:
            fp = os.path.join(base, name)
            os.chmod(fp, stat.S_IREAD)


def _on_rm_error(func, path, _exc):
    """읽기전용(승격된 run) 파일도 지울 수 있게 쓰기 비트를 복구하고 재시도."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


def rmtree_force(path):
    """읽기전용 트리도 강제 삭제(테스트 정리·stale tmp 청소용). 없으면 무시."""
    if os.path.isdir(path):
        shutil.rmtree(path, onerror=_on_rm_error)


# ---------------------------------------------------------------------------
# 스냅샷 스키마 검증(경량) — 실행 표현식 없이 구조/타입만 확인.
# ---------------------------------------------------------------------------
def validate_snapshot(snapshot):
    """스냅샷 dict 의 최소 스키마 검증. 오류 문자열 리스트(비면 유효)."""
    errors = []
    if not isinstance(snapshot, dict):
        return [f"snapshot 이 dict 아님: {type(snapshot).__name__}"]
    for key, typ in _REQUIRED_SNAPSHOT_KEYS.items():
        if key not in snapshot:
            errors.append(f"필수 키 누락: {key!r}")
        elif not isinstance(snapshot[key], typ):
            errors.append(f"{key}: {typ.__name__} 기대, {type(snapshot[key]).__name__} 받음")
    if snapshot.get("engineVersion") not in (None, ENGINE_VERSION):
        errors.append(f"engineVersion 불일치: {snapshot.get('engineVersion')!r} != {ENGINE_VERSION!r}")
    md = snapshot.get("marketDate")
    if isinstance(md, str) and not md.strip():
        errors.append("marketDate 가 빈 문자열")
    rp = snapshot.get("rankingPopulation")
    if isinstance(rp, dict) and not ("count" in rp and "hash" in rp):
        errors.append("rankingPopulation 에 count/hash 누락")
    return errors


# ---------------------------------------------------------------------------
# manifest 구성 — 각 산출물의 sha256/bytes + 봉인 상태 + manifestHash.
#   manifestHash = sha256(canonical_bytes(manifest_without_manifestHash)).
# ---------------------------------------------------------------------------
def build_manifest(snapshot_id, snapshot, artifacts, run_state):
    core = {
        "snapshotId": snapshot_id,
        "marketDate": snapshot["marketDate"],
        "metricsVersion": snapshot["engineVersion"],
        "configHash": snapshot.get("configHash"),
        "inputManifestHash": snapshot.get("inputManifestHash"),
        "runState": run_state,
        "artifacts": artifacts,
    }
    manifest_hash = _sha256(canonical_bytes(core))
    manifest = dict(core)
    manifest["manifestHash"] = manifest_hash
    return manifest


def manifest_hash_of(manifest):
    """저장된 manifestHash 를 제외한 core 로 다시 계산한 해시(재검증용)."""
    core = {k: v for k, v in manifest.items() if k != "manifestHash"}
    return _sha256(canonical_bytes(core))


# ---------------------------------------------------------------------------
# run 디렉터리 무결성 검증(publisher 승격 전·reader 둘 다 사용) — 부분 데이터 금지의 핵심.
# ---------------------------------------------------------------------------
def verify_run_dir(run_dir):
    """run 디렉터리의 manifest·산출물 체크섬·봉인 상태를 검증. VerifyResult."""
    manifest_path = os.path.join(run_dir, ARTIFACT_MANIFEST)
    if not os.path.exists(manifest_path):
        return VerifyResult(ok=False, reasons=[READ_MANIFEST_MISSING])
    try:
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)
    except (ValueError, OSError):
        return VerifyResult(ok=False, reasons=[READ_MANIFEST_UNREADABLE])
    if not isinstance(manifest, dict) or "manifestHash" not in manifest \
            or not isinstance(manifest.get("artifacts"), dict):
        return VerifyResult(ok=False, reasons=[READ_MANIFEST_UNREADABLE])

    reasons = []
    if manifest_hash_of(manifest) != manifest["manifestHash"]:
        reasons.append(READ_MANIFEST_HASH_MISMATCH)
    if manifest.get("runState") != RUN_STATE_QA_PASSED:
        reasons.append(READ_NOT_SEALED)
    for name, meta in manifest["artifacts"].items():
        fp = os.path.join(run_dir, name)
        if not os.path.exists(fp):
            reasons.append(READ_ARTIFACT_MISSING)
            continue
        data = open(fp, "rb").read()
        if _sha256(data) != meta.get("sha256") or len(data) != meta.get("bytes"):
            reasons.append(READ_CHECKSUM_MISMATCH)
    return VerifyResult(ok=not reasons, reasons=sorted(set(reasons)), manifest=manifest)


# ---------------------------------------------------------------------------
# publish — §M251-D07 원자적 승격. faults 로 중단/손상/QA실패를 주입할 수 있다(테스트).
#   faults 지원 토큰:
#     "interrupt_before_manifest" — 산출물만 쓰고 manifest 전에 중단(승격 없음)
#     "corrupt_artifact_after_manifest" — manifest 계산 후 산출물 변조(자기검증이 잡음)
#     "interrupt_before_pointer" — 승격까지 하고 pointer 교체 전 중단(직전 pointer 유지)
#     "fail_qa" — QA 게이트 실패(봉인/승격 없음)
# ---------------------------------------------------------------------------
def publish_snapshot(root, snapshot, *, run_id, qa_check=None, faults=frozenset()):
    """후보 스냅샷을 비공개 저장소에 게시. 실패 시 직전 pointer 를 절대 교체하지 않는다."""
    root = assert_private_root(root)
    faults = set(faults or ())
    prior_pointer = _read_pointer_raw(root)

    # 1) 스키마 검증(실패 시 임시 파일도 만들지 않음).
    errors = validate_snapshot(snapshot)
    if errors:
        return PublishResult(ok=False, reasons=[PUBLISH_SCHEMA_INVALID], detail=errors,
                             pointer=prior_pointer)

    market_date = snapshot["marketDate"]
    snapshot_id = f"{market_date}__{run_id}"
    tmp_dir = os.path.join(root, TMP_SUBDIR, run_id)
    run_dir = os.path.join(root, RUNS_SUBDIR, snapshot_id)

    # 불변성: 이미 승격된 snapshotId 는 덮어쓰지 않는다.
    if os.path.exists(run_dir):
        return PublishResult(ok=False, reasons=[PUBLISH_ALREADY_PROMOTED],
                             snapshotId=snapshot_id, pointer=prior_pointer)

    rmtree_force(tmp_dir)  # stale tmp 청소
    os.makedirs(tmp_dir, exist_ok=True)

    # 1) canonical 산출물 작성(원자적).
    snap_bytes = canonical_bytes(snapshot)
    _atomic_write_bytes(os.path.join(tmp_dir, ARTIFACT_SNAPSHOT), snap_bytes)

    # 2) QA 게이트 — 실패면 봉인/승격 없음, pointer 유지.
    qa_ok = "fail_qa" not in faults and (qa_check is None or bool(qa_check(snapshot)))
    if not qa_ok:
        rmtree_force(tmp_dir)
        return PublishResult(ok=False, reasons=[PUBLISH_QA_FAILED], pointer=prior_pointer)

    # 중단 주입: manifest 작성 전 크래시 — tmp 는 부분 상태, 승격/pointer 없음.
    if "interrupt_before_manifest" in faults:
        return PublishResult(ok=False, reasons=[PUBLISH_WRITE_INTERRUPTED], pointer=prior_pointer)

    # 3) 체크섬 manifest 작성 + 4) QA_PASSED 봉인.
    artifacts = {ARTIFACT_SNAPSHOT: {"sha256": _sha256(snap_bytes), "bytes": len(snap_bytes)}}

    # 손상 주입: manifest 의 체크섬을 계산한 뒤 산출물을 변조 → 자기검증에서 걸린다.
    if "corrupt_artifact_after_manifest" in faults:
        _atomic_write_bytes(os.path.join(tmp_dir, ARTIFACT_SNAPSHOT), snap_bytes + b" ")

    manifest = build_manifest(snapshot_id, snapshot, artifacts, RUN_STATE_QA_PASSED)
    _atomic_write_bytes(
        os.path.join(tmp_dir, ARTIFACT_MANIFEST),
        (json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8"))

    # 승격 전 자기검증(reader 와 같은 검증). 손상/미봉인이면 승격하지 않고 pointer 유지.
    pre = verify_run_dir(tmp_dir)
    if not pre.ok:
        rmtree_force(tmp_dir)
        return PublishResult(ok=False, reasons=[PUBLISH_CHECKSUM_MISMATCH] + pre.reasons,
                             pointer=prior_pointer)

    # 5) 완성된 run 을 불변 위치로 원자 승격(같은 파일시스템 rename) + 읽기전용.
    os.makedirs(os.path.join(root, RUNS_SUBDIR), exist_ok=True)
    os.replace(tmp_dir, run_dir)
    _make_readonly_tree(run_dir)

    # 중단 주입: 승격까지 하고 pointer 교체 전 크래시 — 직전 정상 pointer 유지(§9).
    if "interrupt_before_pointer" in faults:
        return PublishResult(ok=False, reasons=[PUBLISH_WRITE_INTERRUPTED],
                             snapshotId=snapshot_id, pointer=prior_pointer)

    # 6) 작은 current pointer 를 원자적으로 교체(마지막 단계).
    pointer = {
        "snapshotId": snapshot_id,
        "marketDate": market_date,
        "metricsVersion": snapshot["engineVersion"],
        "manifestHash": manifest["manifestHash"],
        "runDir": f"{RUNS_SUBDIR}/{snapshot_id}",
    }
    _atomic_write_bytes(
        os.path.join(root, POINTER_NAME),
        (json.dumps(pointer, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8"))
    return PublishResult(ok=True, snapshotId=snapshot_id, pointer=pointer)


# ---------------------------------------------------------------------------
# read — §M251-D07 7항. pointer→manifest 무결성을 재검증하고 typed 결과를 준다.
# ---------------------------------------------------------------------------
def _read_pointer_raw(root):
    """pointer 파일을 읽어 dict 로 반환. 없거나 못 읽으면 None."""
    path = os.path.join(root, POINTER_NAME)
    if not os.path.exists(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else None
    except (ValueError, OSError):
        return None


_POINTER_REQUIRED = ("snapshotId", "marketDate", "metricsVersion", "manifestHash")


def read_current(root):
    """current pointer 를 따라 무결성 검증된 스냅샷을 읽는다. ReadResult(부분 데이터 금지)."""
    root = assert_private_root(root)
    pointer_path = os.path.join(root, POINTER_NAME)
    if not os.path.exists(pointer_path):
        return ReadResult(status=READ_UNAVAILABLE, reasons=[READ_NO_POINTER])
    try:
        with open(pointer_path, encoding="utf-8") as f:
            pointer = json.load(f)
    except (ValueError, OSError):
        return ReadResult(status=READ_UNAVAILABLE, reasons=[READ_POINTER_UNREADABLE])
    if not isinstance(pointer, dict) or any(k not in pointer for k in _POINTER_REQUIRED):
        return ReadResult(status=READ_UNAVAILABLE, reasons=[READ_POINTER_INVALID], pointer=pointer
                          if isinstance(pointer, dict) else None)

    run_dir = os.path.join(root, RUNS_SUBDIR, pointer["snapshotId"])
    if not os.path.isdir(run_dir):
        return ReadResult(status=READ_DEGRADED, reasons=[READ_RUN_MISSING], pointer=pointer)

    verified = verify_run_dir(run_dir)
    if not verified.ok:
        return ReadResult(status=READ_DEGRADED, reasons=verified.reasons, pointer=pointer,
                          manifest=verified.manifest)

    # pointer↔manifest 교차 검증.
    if pointer["manifestHash"] != verified.manifest["manifestHash"]:
        return ReadResult(status=READ_DEGRADED, reasons=[READ_POINTER_MANIFEST_MISMATCH],
                          pointer=pointer, manifest=verified.manifest)

    # 무결성 전부 통과 — 스냅샷을 로드해 반환.
    try:
        with open(os.path.join(run_dir, ARTIFACT_SNAPSHOT), encoding="utf-8") as f:
            snapshot = json.load(f)
    except (ValueError, OSError):
        return ReadResult(status=READ_DEGRADED, reasons=[READ_ARTIFACT_MISSING],
                          pointer=pointer, manifest=verified.manifest)
    return ReadResult(status=READ_OK, snapshot=snapshot, pointer=pointer, manifest=verified.manifest)


# ---------------------------------------------------------------------------
# CLI — 저장소 계약 요약(게이트는 test_metrics251_snapshot_store 가 강제).
# ---------------------------------------------------------------------------
def _cli(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 immutable shadow snapshot store (Slice F, pure/deterministic).")
    ap.add_argument("--print-layout", action="store_true", help="저장소 레이아웃/기본 루트를 출력")
    args = ap.parse_args(argv)
    if args.print_layout:
        print(f"defaultRoot(git-ignored): {os.path.relpath(DEFAULT_SHADOW_ROOT, ROOT)}")
        print(f"  {TMP_SUBDIR}/<runId>/            임시 run(작성 중)")
        print(f"  {RUNS_SUBDIR}/<snapshotId>/     불변 승격 run({ARTIFACT_SNAPSHOT}+{ARTIFACT_MANIFEST})")
        print(f"  {POINTER_NAME}                 shadow current pointer(원자적 교체)")
        return 0
    print("metrics251_snapshot_store: Slice F 불변 shadow 저장소. import 후 "
          "publish_snapshot(root, snapshot, run_id=...) / read_current(root) 사용.")
    print(f"  기본 루트(비공개·Git 비추적)={os.path.relpath(DEFAULT_SHADOW_ROOT, ROOT)} · "
          f"봉인상태={RUN_STATE_QA_PASSED}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_cli())
