#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Metrics 2.5.1 계약 내보내기 (Slice J) — 실행: python scripts/metrics251_contract_export.py [--check]
#
# 목적: TypeScript reader 계약(scripts/metrics251/)이 소비하는 "Python 이 소유한" enum·필수키·
#       산출물 이름·체크섬 메타데이터 키를 단일 정본에서 기계가 읽을 수 있는 JSON 으로 내보낸다.
#       이 파일은 Slice B~I 의 실제 파이썬 모듈(엔진·자격·비교·스냅샷 저장소)에서 값을 끌어오므로,
#       파이썬 정본이 바뀌면 contract.json 이 바뀌고 TS 생성물 freshness 검사가 드리프트를 잡는다.
#
# 산출물: config/metrics/2.5.1.contract.json (Git 추적 계약. 공개 데이터 아님 — §M251-D10 스키마/계약만 Git).
#   - --check: 기존 파일과 재생성 결과를 바이트 비교. 드리프트면 비정상 종료(쓰지 않음).
#   - 기본: 재생성해 파일에 쓴다.
#
# 주의: 이 스크립트는 로컬 파일만 읽고 쓴다. 공개 산출물·네트워크·스케줄러를 건드리지 않는다.

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_engine as eng  # noqa: E402  (Slice D — factor 키·사유 상수 단일 출처)
import metrics251_eligibility as elig  # noqa: E402  (Slice E — 자격 사유 집합)
import metrics251_compare as cmp  # noqa: E402  (Slice G — 비교 capability·사유 코드)
import metrics251_snapshot_store as store  # noqa: E402  (Slice F — 스냅샷/manifest/pointer 계약)

CONTRACT_PATH = os.path.join(ROOT, "config", "metrics", "2.5.1.contract.json")

CONTRACT_VERSION = "2.5.1"

# 비교 사유 코드(reason codes)는 계약 문자열이므로 reader 가 알아야 할 이름을 명시적으로 열거한다.
# 값은 모듈에서 끌어와 값 드리프트를 잡고, 집합 자체는 이 계약의 표면이다.
_COMPARISON_REASON_ATTRS = [
    "COMPARABLE",
    "CURRENT_SNAPSHOT_MISSING",
    "PREVIOUS_SNAPSHOT_MISSING",
    "CURRENT_UNPUBLISHED",
    "PREVIOUS_UNPUBLISHED",
    "ENGINE_VERSION_MISMATCH",
    "CONFIG_MISMATCH",
    "SOURCE_CONTRACT_INCOMPATIBLE",
    "SOURCE_INPUT_UNPUBLISHED",
    "FACTOR_POPULATION_MISMATCH",
    "RANKING_UNIVERSE_MISMATCH",
    "FACTOR_NOT_COMPARABLE",
    "COMPOSITE_NOT_COMPARABLE",
]

_CALENDAR_DAY_KIND_ATTRS = [
    "TRADING_DAY",
    "WEEKEND",
    "HOLIDAY",
    "OUT_OF_CALENDAR_RANGE",
    "NO_PREVIOUS_MARKET_DAY",
    "PREVIOUS_MARKET_DATE_MATCH",
    "PREVIOUS_MARKET_DATE_MISMATCH",
    "PAIRING_INVALID",
]

_READ_STATUS_ATTRS = ["READ_OK", "READ_UNAVAILABLE", "READ_DEGRADED"]

_READ_REASON_ATTRS = [
    "READ_NO_POINTER",
    "READ_POINTER_UNREADABLE",
    "READ_POINTER_INVALID",
    "READ_RUN_MISSING",
    "READ_MANIFEST_MISSING",
    "READ_MANIFEST_UNREADABLE",
    "READ_MANIFEST_HASH_MISMATCH",
    "READ_POINTER_MANIFEST_MISMATCH",
    "READ_ARTIFACT_MISSING",
    "READ_CHECKSUM_MISMATCH",
    "READ_NOT_SEALED",
]


def _values(module, attrs):
    return [getattr(module, a) for a in attrs]


def build_contract():
    """실제 파이썬 정본 모듈에서 계약을 조립한다. 결정적(정렬 고정)."""
    factor_keys = list(eng.FACTORS)  # 튜플 정의 순서 보존(모멘텀·거래활성도·밸류·위험조정)

    eligibility_reasons = sorted(elig.FACTOR_REASONS)
    non_excluding = sorted(elig.NON_EXCLUDING_REASONS)
    excluding = sorted(elig.EXCLUDING_REASONS)

    return {
        "contractVersion": CONTRACT_VERSION,
        "engineVersion": eng.ENGINE_VERSION,
        "generatedBy": "scripts/metrics251_contract_export.py",
        "note": (
            "Machine-readable Python-owned contract surface for the Metrics 2.5.1 "
            "TypeScript reader (Slice J). Values are pulled from the actual Slice B-I "
            "Python modules so a Python source change flips this file and the generated "
            "TS freshness check catches the drift. NOT public data; never served."
        ),
        "enums": {
            "factorKeys": factor_keys,
            "eligibilityReasons": eligibility_reasons,
            "nonExcludingReasons": non_excluding,
            "excludingReasons": excluding,
            "comparisonMetricKeys": list(cmp.METRIC_KEYS),
            "comparisonReasonCodes": _values(cmp, _COMPARISON_REASON_ATTRS),
            "calendarDayKinds": _values(cmp, _CALENDAR_DAY_KIND_ATTRS),
            "readStatuses": _values(store, _READ_STATUS_ATTRS),
            "readReasonCodes": _values(store, _READ_REASON_ATTRS),
            "runStates": [store.RUN_STATE_QA_PASSED],
        },
        "artifactNames": {
            "pointer": store.POINTER_NAME,
            "manifest": store.ARTIFACT_MANIFEST,
            "snapshot": store.ARTIFACT_SNAPSHOT,
            "runsSubdir": store.RUNS_SUBDIR,
        },
        "requiredKeys": {
            # 스냅샷 필수키는 저장소 계약(_REQUIRED_SNAPSHOT_KEYS)에서 직접 끌어온다 — 단일 출처.
            "snapshot": sorted(store._REQUIRED_SNAPSHOT_KEYS.keys()),
            "pointer": ["snapshotId", "marketDate", "metricsVersion", "manifestHash", "runDir"],
            "manifest": ["snapshotId", "marketDate", "metricsVersion", "runState", "artifacts", "manifestHash"],
            "manifestArtifact": ["sha256", "bytes"],
            "stockResult": ["ticker", "factors", "compositeScore", "rankingEligible", "eligibilityReasons"],
            "factorResult": ["factor", "reason", "raw", "score"],
            "factorPopulation": ["count", "hash"],
            "rankingPopulation": ["count", "hash"],
            "sourceDates": ["prices", "volumes", "fundamentals"],
        },
        # reader 가 반드시 존재를 강제해야 하는 체크섬/무결성 메타데이터 필드 이름.
        "checksumMetadata": {
            "snapshotHashKeys": ["configHash", "inputManifestHash"],
            "populationHashKey": "hash",
            "manifestHashKey": "manifestHash",
            "pointerManifestHashKey": "manifestHash",
            "artifactChecksumKey": "sha256",
        },
    }


def serialize(contract):
    """읽기 좋은 결정적 형태(정렬·2칸 들여쓰기·개행)로 직렬화."""
    return (json.dumps(contract, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Export Metrics 2.5.1 Python-owned contract surface.")
    parser.add_argument("--check", action="store_true",
                        help="기존 파일과 재생성 결과를 비교만 하고 쓰지 않는다(드리프트면 종료코드 1).")
    parser.add_argument("--out", default=CONTRACT_PATH, help="출력 경로(기본 config/metrics/2.5.1.contract.json).")
    args = parser.parse_args(argv)

    data = serialize(build_contract())

    if args.check:
        if not os.path.exists(args.out):
            print(f"CONTRACT DRIFT: 파일 없음 {args.out} — `python scripts/metrics251_contract_export.py` 로 생성하세요.")
            return 1
        with open(args.out, "rb") as f:
            existing = f.read()
        if existing != data:
            print("CONTRACT DRIFT: config/metrics/2.5.1.contract.json 이 파이썬 정본과 다릅니다.")
            print("  → `python scripts/metrics251_contract_export.py` 로 재생성 후 커밋하세요.")
            return 1
        print("contract export: FRESH (파이썬 정본과 일치)")
        return 0

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "wb") as f:
        f.write(data)
    print(f"contract export: wrote {os.path.relpath(args.out, ROOT)} ({len(data)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
