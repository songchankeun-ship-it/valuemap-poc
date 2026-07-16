#!/usr/bin/env python3
# Metrics 2.5.1 append-only 증거 원장(evidence ledger) + 롤아웃 게이트 재생성 명령 (Slice O)
#   — 순수·결정적·표준 라이브러리 전용. 공개 라우트/화면에 연결하지 않는다(로컬/비공개 지향).
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02(5일 AND 게이트),
#      §M251-D07(불변 승격·manifest), §M251-D10(비공개 자산), §7 Gate 4, §8 데이터 계약, §9 실패/롤백,
#      §10 Slice O, 원안 티켓 ORN-2503/2508, 작업 지시):
#   * **오직 QA_PASSED 로 봉인된 불변 manifest 에서만** 파생되는 append-only 증거 원장을 만든다.
#     원장 항목(=승인된 시장일 run 하나)은 다음을 기록한다:
#       - marketDate(시장일)
#       - evidenceHashes(configHash·inputManifestHash·manifestHash·snapshotSha256)
#       - coverage(factor/ranking 커버리지 count·pct + universeSize)
#       - exclusions(제외 사유 집계) + unknownExclusionReasons
#       - differential(직전 승인 스냅샷 대비 차등 count: 신규/제외/순위자격변경/종합점수변경 + 비교 capability)
#       - fourZeroGate(미해결P0·소스일불일치·미지제외사유·공개경로누출 — §7 Gate 4 의 네 0 조건)
#   * **append-only**: 기존 항목은 절대 수정/재배열하지 않는다. 새 시장일만 뒤에 덧붙이고, 각 항목은
#     prevHash 로 연쇄(hash chain)돼 위변조가 드러난다. 같은 시장일 재수집은:
#       - 내용(entryHash) 동일 → **중복(duplicate)** 으로 무시(멱등, 덮어쓰지 않음).
#       - 내용 상이 → **충돌(conflict)** 로 거절(기존 불변 항목 보존, 원장 미변경, 비정상 종료 코드).
#   * **PENDING 보존**: 승인 run 이 5개 미만이면 게이트는 PENDING 이며 증거를 합성하지 않는다.
#     5일 AND 게이트의 최종 판정(연속성·창 전체 4-zero)은 Slice K(rollout_gate)를 단일 출처로 재사용한다.
#   * 부수 명령: 비공개 저장소에서 **기존 롤아웃 게이트 JSON·Markdown(docs/)을 재생성**한다(Slice K 재사용).
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · §M251-D10 · 작업 지시):
#   * 벽시계 시각/난수/네트워크 금지 — 원장·해시는 저장소 입력에서만 결정적으로 파생.
#   * 결측을 50/평균으로 채우지 않는다. 저장소에 2.4-vs-2.5.1 차등(P0)이 없으면 unresolvedP0 는
#     null 로 정직하게 남긴다(합성 금지 — 그 run 은 게이트를 통과시키지 못한다).
#   * public/ 데이터를 읽거나 쓰지 않는다. 원장은 비공개(Git 비추적) shadow 저장소에만 둔다
#     (store.assert_private_root 로 강제). 게이트 문서만 docs/ 에 재생성한다(Slice K 와 동일 경로).
#   * QA_PASSED + 무결성 통과 run 만 승인(accepted)한다 — 미봉인/손상 run 은 원장에 넣지 않는다.
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_snapshot_store as store   # noqa: E402  (불변 저장소·verify_run_dir·QA_PASSED)
import metrics251_rollout_gate as rg         # noqa: E402  (Slice K 게이트·커버리지/제외/4-zero 헬퍼 재사용)
import metrics251_compare as cmp             # noqa: E402  (Slice G 구조적 비교 capability)
from metrics251_config import canonical_bytes  # noqa: E402  (결정성 canonical 직렬화)

ENGINE_VERSION = store.ENGINE_VERSION
LEDGER_NAME = "ledger.json"                   # 비공개 저장소 루트의 append-only 원장 파일
LEDGER_SCHEMA = "metrics251.evidence-ledger.v1"
ENTRY_SCHEMA = "metrics251.evidence-ledger-entry.v1"

# append 판정 결과(안정, 정렬해 반환).
APPEND_APPENDED = "APPENDED"
APPEND_DUPLICATE = "DUPLICATE"
APPEND_CONFLICT = "CONFLICT"

# 원장 파일 손상 사유.
LEDGER_UNREADABLE = "LEDGER_UNREADABLE"

# entryHash 계산에서 제외하는(위치 의존) 필드 — 내용 정체성만 해싱한다.
_CHAIN_FIELDS = ("entryHash", "prevHash", "sequence")


# ---------------------------------------------------------------------------
# 승인(accepted) run 읽기 — QA_PASSED + 무결성 통과 manifest 만. 부분/손상 run 은 제외.
# ---------------------------------------------------------------------------
def accepted_runs_from_store(root):
    """비공개 저장소에서 QA_PASSED 로 봉인·무결성 통과한 run 만 정규화해 읽는다(정렬). 없으면 []."""
    root = store.assert_private_root(root)  # public/ 밑이면 즉시 실패(§M251-D10)
    runs_dir = os.path.join(root, store.RUNS_SUBDIR)
    out = []
    if not os.path.isdir(runs_dir):
        return out
    for sub in sorted(os.listdir(runs_dir)):
        run_dir = os.path.join(runs_dir, sub)
        if not os.path.isdir(run_dir):
            continue
        verified = store.verify_run_dir(run_dir)
        if not verified.ok:  # 미봉인(NOT_SEALED)·해시불일치·산출물결측 → 승인 아님(원장 제외)
            continue
        manifest = verified.manifest or {}
        snap_path = os.path.join(run_dir, store.ARTIFACT_SNAPSHOT)
        try:
            with open(snap_path, encoding="utf-8") as f:
                snapshot = json.load(f)
        except (ValueError, OSError):
            continue  # 스냅샷을 못 읽으면 부분 데이터 금지 원칙상 승인하지 않는다.
        out.append({
            "snapshotId": sub,
            "manifest": manifest,
            "snapshot": snapshot,
            "publicLeak": rg.is_public_path(run_dir),
            "runDir": run_dir,
        })
    out.sort(key=lambda r: (_market_date(r), r["snapshotId"]))
    return out


def _market_date(run):
    m = run.get("manifest") or {}
    s = run.get("snapshot") or {}
    return str(m.get("marketDate") or s.get("marketDate") or "")


# ---------------------------------------------------------------------------
# 차등(differential) — 직전 승인 스냅샷 대비 count 변화. 저장소 스냅샷에서만 결정적으로 파생.
# ---------------------------------------------------------------------------
def compute_differential(cur, prev):
    """cur 스냅샷을 직전 승인 스냅샷(prev)과 비교한 차등 count. prev 없으면 available=False.

    합성하지 않는다 — count 는 실제 종목 집합/값에서만 나온다. 비교 capability(raw/composite/rank)는
    Slice G compare_snapshots 를 재사용한다(중복 판정 로직 없음).
    """
    if not prev:
        return {
            "basisMarketDate": None, "available": False,
            "entered": None, "exited": None,
            "rankingEligibilityChanged": None, "compositeChanged": None,
            "commonTickers": None, "capability": None,
        }
    cur_stocks = {s.get("ticker"): s for s in (cur.get("stocks") or []) if isinstance(s, dict)}
    prev_stocks = {s.get("ticker"): s for s in (prev.get("stocks") or []) if isinstance(s, dict)}
    cur_t, prev_t = set(cur_stocks), set(prev_stocks)
    common = cur_t & prev_t
    rank_changed = sum(
        1 for t in common
        if bool(cur_stocks[t].get("rankingEligible")) != bool(prev_stocks[t].get("rankingEligible")))
    comp_changed = sum(
        1 for t in common
        if cur_stocks[t].get("compositeScore") != prev_stocks[t].get("compositeScore"))
    cap = cmp.compare_snapshots(cmp.published_ref(cur), cmp.published_ref(prev))["capabilities"]
    return {
        "basisMarketDate": prev.get("marketDate"),
        "available": True,
        "entered": len(cur_t - prev_t),
        "exited": len(prev_t - cur_t),
        "rankingEligibilityChanged": rank_changed,
        "compositeChanged": comp_changed,
        "commonTickers": len(common),
        "capability": {"raw": cap["raw"], "compositeScore": cap["compositeScore"], "rank": cap["rank"]},
    }


# ---------------------------------------------------------------------------
# 항목(entry) core 구성 — Slice K 헬퍼로 커버리지/제외/소스일/4-zero 를 재사용(중복 없음).
# ---------------------------------------------------------------------------
def build_entry_core(run, prev_snapshot):
    """승인 run 하나 + 직전 스냅샷 → 원장 항목 core(위치 무관·결정적). (marketDate, core)."""
    manifest = run.get("manifest") or {}
    snapshot = run.get("snapshot") or {}
    market_date = _market_date(run)

    excluding, unknown_keys, factor_source_mismatch = rg.classify_exclusions(
        snapshot.get("eligibilityReasonCounts"))
    sd_find = rg.source_date_findings(snapshot.get("sourceDates"), market_date, factor_source_mismatch)

    stocks = snapshot.get("stocks") or []
    universe_size = len(stocks) if isinstance(stocks, list) else None
    factor_cov, ranking_cov = rg._coverage(
        snapshot.get("factorPopulations"), snapshot.get("rankingPopulation"), universe_size)

    artifacts = manifest.get("artifacts") or {}
    snap_sha = (artifacts.get(store.ARTIFACT_SNAPSHOT) or {}).get("sha256")

    public_leak = bool(run.get("publicLeak"))

    core = {
        "schema": ENTRY_SCHEMA,
        "marketDate": market_date,
        "snapshotId": run.get("snapshotId"),
        "engineVersion": snapshot.get("engineVersion") or manifest.get("metricsVersion"),
        "evidenceHashes": {
            "configHash": manifest.get("configHash") or snapshot.get("configHash"),
            "inputManifestHash": manifest.get("inputManifestHash") or snapshot.get("inputManifestHash"),
            "manifestHash": manifest.get("manifestHash"),
            "snapshotSha256": snap_sha,
        },
        "coverage": {"factor": factor_cov, "ranking": ranking_cov, "universeSize": universe_size},
        "exclusions": excluding,
        "unknownExclusionReasons": unknown_keys,
        "differential": compute_differential(snapshot, prev_snapshot),
        "fourZeroGate": {
            # 저장소에 2.4-vs-2.5.1 차등(P0)이 없으므로 합성하지 않고 null 로 남긴다(§9 합성 금지).
            "unresolvedP0": None,
            "sourceDateMismatch": sd_find["count"],
            "unknownExclusionReason": len(unknown_keys),
            "publicPathLeakage": 1 if public_leak else 0,
        },
    }
    return market_date, core


def entry_hash(core):
    """항목 내용 정체성 해시(위치 의존 필드 제외). 같은 내용 → 같은 해시(멱등·충돌 판정)."""
    payload = {k: v for k, v in core.items() if k not in _CHAIN_FIELDS}
    return hashlib.sha256(canonical_bytes(payload)).hexdigest()


def build_candidates(runs):
    """승인 run 리스트(정렬)를 원장 후보 항목으로 변환. 차등은 직전 승인 스냅샷 대비. 결정적."""
    runs = sorted(runs, key=lambda r: (_market_date(r), r.get("snapshotId") or ""))
    entries = []
    prev_snapshot = None
    for run in runs:
        _md, core = build_entry_core(run, prev_snapshot)
        entry = dict(core)
        entry["entryHash"] = entry_hash(core)
        entries.append(entry)
        prev_snapshot = run.get("snapshot")
    return entries


# ---------------------------------------------------------------------------
# append-only 병합 — 기존 항목 보존·새 시장일만 연쇄로 덧붙임. 중복 무시·충돌 거절.
# ---------------------------------------------------------------------------
def empty_ledger():
    return {
        "schema": LEDGER_SCHEMA,
        "engineVersion": ENGINE_VERSION,
        "appendOnly": True,
        "requiredConsecutiveRuns": rg.MIN_CONSECUTIVE_RUNS,
        "entries": [],
    }


def merge_append(existing, candidates):
    """append-only 병합. 반환: (ledger, report). 기존 항목은 바이트 그대로 보존한다.

    report: {"appended":[dates], "duplicates":[dates], "conflicts":[{marketDate,existingHash,candidateHash}]}.
    """
    existing_entries = list((existing or {}).get("entries") or [])
    by_date = {e.get("marketDate"): e for e in existing_entries}
    merged = list(existing_entries)  # 기존 항목은 절대 수정하지 않는다(append-only).
    last_hash = existing_entries[-1].get("entryHash") if existing_entries else None
    seq = len(existing_entries)

    appended, duplicates, conflicts = [], [], []
    for cand in candidates:
        d = cand.get("marketDate")
        if d in by_date:
            if by_date[d].get("entryHash") == cand.get("entryHash"):
                duplicates.append(d)  # 내용 동일 → 멱등 무시(덮어쓰지 않음)
            else:
                conflicts.append({
                    "marketDate": d,
                    "existingHash": by_date[d].get("entryHash"),
                    "candidateHash": cand.get("entryHash"),
                })  # 내용 상이 → 충돌 거절(불변 항목 보존)
            continue
        entry = dict(cand)
        entry["sequence"] = seq
        entry["prevHash"] = last_hash  # 연쇄(hash chain) — 위변조 탐지
        merged.append(entry)
        by_date[d] = entry
        last_hash = entry["entryHash"]
        seq += 1
        appended.append(d)

    ledger = {
        "schema": LEDGER_SCHEMA,
        "engineVersion": ENGINE_VERSION,
        "appendOnly": True,
        "requiredConsecutiveRuns": rg.MIN_CONSECUTIVE_RUNS,
        "entries": merged,
    }
    report = {"appended": sorted(appended), "duplicates": sorted(duplicates),
              "conflicts": sorted(conflicts, key=lambda c: c["marketDate"] or "")}
    return ledger, report


def verify_chain(ledger):
    """원장의 append-only 무결성 검증 — entryHash 재계산·prevHash 연쇄·sequence 연속성. 문제 리스트."""
    problems = []
    prev = None
    for i, e in enumerate(ledger.get("entries") or []):
        if entry_hash(e) != e.get("entryHash"):
            problems.append(f"entry[{i}]({e.get('marketDate')}) entryHash 불일치")
        if e.get("prevHash") != prev:
            problems.append(f"entry[{i}]({e.get('marketDate')}) prevHash 연쇄 끊김")
        if e.get("sequence") != i:
            problems.append(f"entry[{i}]({e.get('marketDate')}) sequence 불일치")
        prev = e.get("entryHash")
    return problems


# ---------------------------------------------------------------------------
# 원장 파일 I/O — 비공개 저장소 루트에만 둔다.
# ---------------------------------------------------------------------------
def ledger_path(root):
    return os.path.join(store.assert_private_root(root), LEDGER_NAME)


def read_ledger(root):
    """비공개 저장소의 원장을 읽는다. 없으면 빈 원장. 손상이면 ValueError(fail closed)."""
    path = ledger_path(root)
    if not os.path.exists(path):
        return empty_ledger()
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (ValueError, OSError) as e:
        raise ValueError(f"{LEDGER_UNREADABLE}: {path} ({e!r})")
    if not isinstance(data, dict) or not isinstance(data.get("entries"), list):
        raise ValueError(f"{LEDGER_UNREADABLE}: entries 리스트 없음 — {path}")
    return data


def _ledger_bytes(ledger):
    return (json.dumps(ledger, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")


def write_ledger_file(root, ledger):
    path = ledger_path(root)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    store._atomic_write_bytes(path, _ledger_bytes(ledger))  # 원자적 교체(부분 파일 노출 방지)
    return path


def ledger_hash(ledger):
    """원장의 결정적 canonical 해시(재실행 동일성 증거)."""
    return hashlib.sha256(canonical_bytes(ledger)).hexdigest()


# ---------------------------------------------------------------------------
# 게이트 상태 요약 — PENDING(<5) 은 Slice K 게이트를 단일 출처로 재사용해 보존한다.
# ---------------------------------------------------------------------------
def gate_status_from_store(root, calendar):
    """저장소에서 5일 AND 게이트 보고서를 계산(Slice K 재사용). 승인 run <5 면 PENDING 보존."""
    gate_runs = rg.run_evidence_from_store(root)
    return rg.evaluate_rollout_gate(gate_runs, calendar, generated_from="shadow-store")


# ---------------------------------------------------------------------------
# 명령 본체 — 저장소에서 원장을 append 하고(옵션) 롤아웃 게이트 문서를 재생성한다.
# ---------------------------------------------------------------------------
def refresh_from_store(root, *, calendar=None, write=True, refresh_gate=True,
                       gate_json_out=None, gate_md_out=None):
    """비공개 저장소에서 append-only 원장을 갱신하고 게이트 문서를 재생성한다. (ledger, summary)."""
    root = store.assert_private_root(root)
    gate_json_out = gate_json_out or rg.DEFAULT_JSON_OUT
    gate_md_out = gate_md_out or rg.DEFAULT_MD_OUT

    runs = accepted_runs_from_store(root)
    candidates = build_candidates(runs)
    existing = read_ledger(root)
    ledger, append_report = merge_append(existing, candidates)

    if write:
        write_ledger_file(root, ledger)

    gate_report = gate_status_from_store(root, calendar) if refresh_gate else None
    if refresh_gate and write:
        js = json.dumps(gate_report, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
        md = rg.render_markdown(gate_report)
        with open(gate_json_out, "w", encoding="utf-8", newline="\n") as fp:
            fp.write(js)
        with open(gate_md_out, "w", encoding="utf-8", newline="\n") as fp:
            fp.write(md)

    accepted = len(ledger["entries"])
    summary = {
        "meta": {
            "reportKind": "metrics-2.5.1-evidence-ledger",
            "engineVersion": ENGINE_VERSION,
            "readOnly": True,
            "computesPublicScore": False,
            "appendOnly": True,
            "requiredConsecutiveRuns": rg.MIN_CONSECUTIVE_RUNS,
            "note": "QA_PASSED 불변 manifest 에서만 파생. 공개 Metrics 2.4 정본은 불변이며 "
                    "이 원장은 로컬 준비 증거이지 공개 전환 승인 근거가 아니다(§7 Gate 6).",
        },
        "acceptedRuns": accepted,
        "entryDates": [e.get("marketDate") for e in ledger["entries"]],
        "ledgerHash": ledger_hash(ledger),
        "append": append_report,
        # PENDING 보존: 승인 run <5 → 게이트 PENDING(증거 합성 없음). 최종 판정은 Slice K 단일 출처.
        "gate": (gate_report["gate"] if gate_report else None),
    }
    return ledger, summary


# ---------------------------------------------------------------------------
# CLI — 비공개 저장소에서 원장 append + 롤아웃 게이트 문서 재생성.
# ---------------------------------------------------------------------------
def _load_calendar(path):
    if not path:
        return None
    with open(path, encoding="utf-8") as f:
        return cmp.FixtureTradingCalendar.from_fixture(json.load(f))


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 append-only 증거 원장 + 롤아웃 게이트 재생성 (Slice O, read-only, deterministic).")
    ap.add_argument("--root", default=store.DEFAULT_SHADOW_ROOT, help="비공개 shadow 저장소 루트")
    ap.add_argument("--calendar", default=None, help="거래일 캘린더 fixture(JSON) — 게이트 연속성 판정용")
    ap.add_argument("--json", action="store_true", help="결정적 요약 JSON 을 stdout 으로")
    ap.add_argument("--no-write", action="store_true", help="파일 미기록(dry-run), 요약만")
    ap.add_argument("--no-refresh-gate", action="store_true", help="롤아웃 게이트 문서 재생성 생략")
    ap.add_argument("--gate-json-out", default=None, help="게이트 JSON 출력 경로(docs/)")
    ap.add_argument("--gate-md-out", default=None, help="게이트 Markdown 출력 경로(docs/)")
    args = ap.parse_args(argv)

    calendar = _load_calendar(args.calendar)
    ledger, summary = refresh_from_store(
        args.root, calendar=calendar, write=not args.no_write,
        refresh_gate=not args.no_refresh_gate,
        gate_json_out=args.gate_json_out, gate_md_out=args.gate_md_out)

    if args.json:
        print(json.dumps(summary, ensure_ascii=False, sort_keys=True, indent=2))
        return 3 if summary["append"]["conflicts"] else 0

    ap_r = summary["append"]
    gate = summary["gate"]
    where = os.path.relpath(ledger_path(args.root), ROOT)
    if not args.no_write:
        print(f"metrics251_ledger: {where} 갱신 — "
              f"append {len(ap_r['appended'])} · 중복 {len(ap_r['duplicates'])} · 충돌 {len(ap_r['conflicts'])}.")
    else:
        print(f"metrics251_ledger: dry-run — append {len(ap_r['appended'])} · "
              f"중복 {len(ap_r['duplicates'])} · 충돌 {len(ap_r['conflicts'])}(미기록).")
    gate_line = (f"게이트 {gate['status']} · rolloutCandidate {str(gate['rolloutCandidate']).lower()}"
                 if gate else "게이트 재생성 생략")
    print(f"  승인 run {summary['acceptedRuns']}(필요 {rg.MIN_CONSECUTIVE_RUNS}) · {gate_line} · "
          f"ledgerHash {summary['ledgerHash'][:12]}…")
    if ap_r["conflicts"]:
        for c in ap_r["conflicts"]:
            print(f"  충돌 거절: {c['marketDate']} (기존 {c['existingHash'][:12]}… ≠ 후보 {c['candidateHash'][:12]}…)")
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
