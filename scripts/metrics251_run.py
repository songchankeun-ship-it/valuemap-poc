#!/usr/bin/env python3
# Metrics 2.5.1 원자적·멱등 단일 시장일 shadow run 오케스트레이터 (Slice N) — 표준 라이브러리 전용.
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02(실제 거래일 shadow run),
#      §M251-D07(원자적 승격 pointer), §M251-D10(비공개 자산), §8 데이터 계약, §9 실패/롤백,
#      원안 티켓 ORN-2503/2508, 작업 지시):
#   * **명시적으로 날짜가 박힌 정확히 하나의 시장일**에 대해 기존 계약 층을 조립(compose)해 실행하는
#     명령이다. 새 산식을 만들지 않고, 각 층(Slice M/D/E/G/F)을 순서대로 호출해 하나의 shadow run 을
#     비공개 저장소에 안전하게 게시한다:
#       1) preflight(Slice M)   — 날짜/소스일/해시/필수입력/비공개 레이아웃을 계약 검증(계산 전).
#       2) engine(Slice D)      — 명시적 입력에서 후보 스냅샷을 순수 계산.
#       3) eligibility(Slice E) — 자격/품질/모집단 계약을 재계산해 내재적 QA 게이트로 검증.
#       4) comparison(Slice G)  — 직전 승격 스냅샷과의 차등(비교 capability) 증거를 산출(비-차단).
#       5) snapshot-store(Slice F) — 원자적 승격(tmp→runs→pointer)으로 게시.
#
#   * **원자적(atomic)**: 부분 실패는 승인된 pointer 를 남기지 않는다. pointer 교체는 오직
#     store.publish_snapshot 의 마지막 단계에서만 일어나며(직접 손으로 교체하지 않는다), 어떤 게이트가
#     실패하면 승격/pointer 교체 이전에 멈춘다. store 의 fault 주입(중단/손상/QA실패)은 그대로 전달돼
#     "부분 실패 = pointer 무변경"을 보인다.
#   * **멱등(idempotent)**: runId 는 스냅샷 정체성(engineVersion+configHash+inputManifestHash+marketDate)
#     에서 결정적으로 파생되므로, 바이트 동일 입력은 같은 snapshotId 를 만든다.
#       - 같은 시장일에 **바이트 동일** 스냅샷이 이미 승격돼 있으면 → **NOOP**(재게시/교체 없음).
#       - 같은 시장일에 **다른(충돌)** 스냅샷이 이미 승격돼 있으면 → **REJECTED**(SAME_DATE_CONFLICT).
#         불변 위치를 덮어쓰지 않는다(§M251-D07 불변성).
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · §M251-D10 · 작업 지시):
#   * 벽시계 시각 금지(datetime.now()/time.time()/date.today() 등)·난수 금지 — 출력·runId 는 입력에서만 파생.
#   * public/data·Metrics 2.4 런타임을 읽거나 쓰지 않는다. 산출물은 오직 비공개(Git 비추적) shadow
#     저장소(store.assert_private_root 로 강제)에만 둔다. public pointer/API 를 만들지 않는다.
#   * 결측을 50/factor 평균으로 채우지 않는다 — 계산은 엔진 소유(이 층은 조립·게이트·게시 조정만).
#   * pointer 교체 로직을 재구현하지 않는다 — Slice F 의 원자적 publish 를 단일 출처로 재사용한다.
#   * fixture·저장소 입력만 읽는다. 공개 산식/데이터 미변경.
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from dataclasses import dataclass, field
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_preflight as pf          # noqa: E402  (Slice M 계약)
import metrics251_engine as eng            # noqa: E402  (Slice D 순수 엔진)
import metrics251_eligibility as elig      # noqa: E402  (Slice E 자격/품질/모집단)
import metrics251_compare as cmp           # noqa: E402  (Slice G 거래일 비교 capability)
import metrics251_snapshot_store as store  # noqa: E402  (Slice F 불변 저장소·원자적 승격)
from metrics251_config import canonical_bytes  # noqa: E402  (Slice B canonical 직렬화)

ENGINE_VERSION = eng.ENGINE_VERSION

# ---------------------------------------------------------------------------
# run 상태(안정, 계약). status 는 정확히 세 값 중 하나다.
# ---------------------------------------------------------------------------
RUN_PUBLISHED = "PUBLISHED"                 # 새 스냅샷을 승격하고 pointer 를 교체함
RUN_NOOP = "NOOP_ALREADY_PUBLISHED"         # 바이트 동일 스냅샷이 이미 승격됨 — 변경 없음(멱등)
RUN_REJECTED = "REJECTED"                   # 게이트 실패 또는 충돌 — pointer 무변경(원자적)

# ---------------------------------------------------------------------------
# 거절 사유(안정, 정렬해 반환). 각 층의 세부 사유는 phases/detail 로 전달한다.
# ---------------------------------------------------------------------------
PREFLIGHT_FAILED = "PREFLIGHT_FAILED"       # Slice M preflight 가 (중복 외) 사유로 실패
ENGINE_NULL = "ENGINE_NULL"                 # 엔진이 스냅샷을 성립시키지 못함(방어적 — 보통 preflight 가 선차단)
ELIGIBILITY_FAILED = "ELIGIBILITY_FAILED"   # 내재적 QA 게이트 실패(UNKNOWN 사유·일관성 위반 등)
SAME_DATE_CONFLICT = "SAME_DATE_CONFLICT"   # 같은 시장일에 다른(충돌) 스냅샷이 이미 승격됨
PUBLISH_FAILED = "PUBLISH_FAILED"           # store 원자적 승격 실패(중단/손상/QA/이미승격)
INTERNAL_ERROR = "INTERNAL_ERROR"           # 예상 못한 예외 — fail closed

ALL_REASONS = frozenset({
    PREFLIGHT_FAILED, ENGINE_NULL, ELIGIBILITY_FAILED, SAME_DATE_CONFLICT,
    PUBLISH_FAILED, INTERNAL_ERROR,
})

# store 로 전달되는 fault 토큰(그 외 토큰은 store 가 무시). "fail_eligibility" 는 이 층에서 소비한다.
_STORE_FAULT_TOKENS = frozenset({
    "interrupt_before_manifest", "corrupt_artifact_after_manifest",
    "interrupt_before_pointer", "fail_qa",
})
FAULT_FAIL_ELIGIBILITY = "fail_eligibility"  # 이 층 QA 게이트 강제 실패(테스트용 fault 주입)


@dataclass
class RunResult:
    status: str
    reasons: list = field(default_factory=list)     # 정렬된 안정 거절 사유(PUBLISHED/NOOP 은 빈 리스트)
    marketDate: Optional[str] = None
    snapshotId: Optional[str] = None
    pointer: Optional[dict] = None                   # run 이후 current pointer(NOOP/REJECTED 는 무변경)
    phases: dict = field(default_factory=dict)       # 층별 진단 요약(결정적)
    evidence: Optional[dict] = None                  # 조립된 run 증거(결정적) — 저장은 store 스냅샷이 담당

    def to_dict(self):
        return {
            "status": self.status,
            "reasons": self.reasons,
            "marketDate": self.marketDate,
            "snapshotId": self.snapshotId,
            "pointer": self.pointer,
            "phases": self.phases,
            "evidence": self.evidence,
        }

    @property
    def ok(self):
        return self.status in (RUN_PUBLISHED, RUN_NOOP)


# ---------------------------------------------------------------------------
# 결정적 runId — 스냅샷 정체성에서만 파생(벽시계/난수 없음). 바이트 동일 입력 → 같은 snapshotId.
# ---------------------------------------------------------------------------
def derive_run_id(snapshot_dict):
    """스냅샷 정체성(engine/config/input hash + marketDate)의 canonical sha256 앞 16자리 → runId."""
    identity = {
        "engineVersion": snapshot_dict.get("engineVersion"),
        "configHash": snapshot_dict.get("configHash"),
        "inputManifestHash": snapshot_dict.get("inputManifestHash"),
        "marketDate": snapshot_dict.get("marketDate"),
    }
    return "r" + hashlib.sha256(canonical_bytes(identity)).hexdigest()[:16]


def derive_expected(config, market_date, source_dates, stocks):
    """조립 입력에서 preflight pin(expected)을 결정적으로 파생한다(CLI 편의·하드코딩 회피)."""
    req = eng.EngineRequest.from_dict({
        "config": config, "marketDate": market_date,
        "sourceDates": source_dates, "stocks": stocks})
    from metrics251_config import config_hash
    return {
        "engineVersion": ENGINE_VERSION,
        "configHash": config_hash(config),
        "inputManifestHash": eng._input_manifest_hash(req, req.stocks),
        "marketDate": market_date,
        "sourceDates": dict(source_dates or {}),
    }


# ---------------------------------------------------------------------------
# 내재적 QA 게이트(eligibility 조립) — 유니버스 크기와 무관한 불변식만 검사한다.
#   커버리지-대-기준선(%) 게이트(Slice E coverage_gate)는 138 유니버스 특정이라 여기서 쓰지 않는다.
#   여기서는 어떤 유효 run 에도 반드시 성립해야 하는 것만 본다: runOk · UNKNOWN 사유 0 ·
#   일관성 전부 · 사유 없는 제외 0(설계서 §M251-D04).
# ---------------------------------------------------------------------------
def qa_gate(report, faults=frozenset()):
    """eligibility 리포트의 내재적 QA 게이트. {ok, blockers, ...요약}. 순수·결정적."""
    blockers = []
    if FAULT_FAIL_ELIGIBILITY in (faults or ()):
        blockers.append("injected_fail")
    if not report.get("runOk"):
        blockers.append("run_not_ok")
    if report.get("unknownReasons"):
        blockers.append("unknown_reasons")
    if report.get("excludedWithoutReason"):
        blockers.append("excluded_without_reason")
    consistency = report.get("consistency") or {}
    if not (consistency and all(consistency.values())):
        blockers.append("consistency")
    return {
        "ok": not blockers,
        "blockers": sorted(set(blockers)),
        "universeCount": report.get("universeCount"),
        "rankingEligibleCount": report.get("rankingEligibleCount"),
        "rankingEligiblePct": report.get("rankingEligiblePct"),
        "unknownReasons": report.get("unknownReasons", []),
        "runNullReasons": report.get("runNullReasons", []),
    }


# ---------------------------------------------------------------------------
# 같은 시장일에 이미 승격된 run 을 스캔한다(읽기 전용) — 멱등/충돌 판정의 근거.
# ---------------------------------------------------------------------------
def scan_market_date(root, market_date):
    """runs/ 에서 '<marketDate>__' 로 시작하는 승격 run 들을 검증·요약한다(정렬). 없으면 []."""
    runs_dir = os.path.join(root, store.RUNS_SUBDIR)
    out = []
    if not os.path.isdir(runs_dir):
        return out
    prefix = f"{market_date}__"
    for name in sorted(os.listdir(runs_dir)):
        if not name.startswith(prefix):
            continue
        run_dir = os.path.join(runs_dir, name)
        if not os.path.isdir(run_dir):
            continue
        verified = store.verify_run_dir(run_dir)
        snap_path = os.path.join(run_dir, store.ARTIFACT_SNAPSHOT)
        raw = None
        if os.path.exists(snap_path):
            try:
                with open(snap_path, "rb") as f:
                    raw = f.read()
            except OSError:
                raw = None
        out.append({
            "snapshotId": name,
            "ok": verified.ok,
            "reasons": verified.reasons,
            "manifestHash": (verified.manifest or {}).get("manifestHash"),
            "bytes": raw,
        })
    return out


# ---------------------------------------------------------------------------
# 조립 오케스트레이터 — 정확히 하나의 시장일에 대해 전 층을 순서대로 실행한다.
# ---------------------------------------------------------------------------
def run_market_day(request, *, calendar=None, faults=frozenset()):
    """명시적으로 날짜가 박힌 하나의 시장일 shadow run 을 조립 실행한다. RunResult.

    request: preflight 요청 형태(marketDate, expected, config, sourceDates, stocks, shadowRoot,
             outputLocation). shadowRoot 는 비공개(Git 비추적)여야 한다.
    원자적·멱등: 실패는 승인 pointer 를 남기지 않고, 바이트 동일 재실행은 NOOP, 충돌은 REJECTED.
    """
    faults = set(faults or ())
    phases = {}
    try:
        req = dict(request or {})
        market_date = req.get("marketDate")
        root = req.get("shadowRoot")

        # ---- 1) preflight(Slice M) — 계산 전 계약 검증. 중복 시장일은 이 층에서 세분 판정한다. ----
        try:
            promoted = pf.promoted_market_dates(root) if root else []
        except Exception:  # noqa: BLE001  (루트가 없거나 공개 경로면 preflight 레이아웃 검사가 정확히 거절)
            promoted = []
        pre = pf.preflight_market_day(req, calendar, promoted)
        phases["preflight"] = pre.to_dict()
        # DUPLICATE_MARKET_DATE 는 멱등/충돌로 세분 판정하므로 여기서 하드 실패시키지 않는다.
        blocking_pre = [r for r in pre.reasons if r != pf.DUPLICATE_MARKET_DATE]
        if blocking_pre:
            return RunResult(status=RUN_REJECTED, reasons=[PREFLIGHT_FAILED],
                             marketDate=market_date, phases=phases)

        # ---- 2) engine(Slice D) — 후보 스냅샷 순수 계산. ----
        engine_req = {
            "config": req.get("config"),
            "marketDate": market_date,
            "sourceDates": req.get("sourceDates"),
            "stocks": req.get("stocks"),
        }
        eres = eng.compute_snapshot(eng.EngineRequest.from_dict(engine_req))
        phases["engine"] = {"ok": eres.snapshot is not None, "nullReasons": list(eres.nullReasons)}
        if eres.snapshot is None:
            # 방어적: 정상 입력이 preflight 를 통과하면 엔진은 스냅샷을 만든다(엔진 null 사유는 preflight 상위집합).
            return RunResult(status=RUN_REJECTED, reasons=[ENGINE_NULL],
                             marketDate=market_date, phases=phases)

        snapshot = eres.snapshot
        snap_dict = snapshot.to_dict()
        candidate_bytes = snapshot.canonical_bytes()
        run_id = derive_run_id(snap_dict)
        candidate_id = f"{market_date}__{run_id}"

        # ---- 3) eligibility(Slice E) — 자격/품질/모집단 계약 재계산 + 내재적 QA 게이트. ----
        elig_report = elig.evaluate(engine_req)
        qa = qa_gate(elig_report, faults)
        phases["eligibility"] = qa
        if not qa["ok"]:
            return RunResult(status=RUN_REJECTED, reasons=[ELIGIBILITY_FAILED],
                             marketDate=market_date, snapshotId=candidate_id, phases=phases)

        # ---- 4) comparison(Slice G) — 직전 승격 스냅샷과의 차등 증거(비-차단). ----
        prior = store.read_current(root)
        prior_ref = (cmp.published_ref(prior.snapshot)
                     if prior.status == store.READ_OK and prior.snapshot else cmp.missing_ref())
        cur_ref = cmp.published_ref(snap_dict)
        if calendar is not None:
            comparison = cmp.evaluate_comparison(cur_ref, prior_ref, calendar)
        else:
            # 캘린더 없이 pairing 은 불가 — 구조적 비교만 증거로 남긴다(비-차단).
            comparison = {"structural": cmp.compare_snapshots(cur_ref, prior_ref),
                          "pairing": None}
        phases["comparison"] = comparison

        evidence = _build_evidence(snap_dict, candidate_id, qa, comparison,
                                   prior_status=prior.status)

        # ---- 5) 멱등/충돌 판정 — 같은 시장일의 기존 승격 run 스캔(원자적 게시 전). ----
        same_date = scan_market_date(root, market_date)
        other_runs = [r for r in same_date if r["snapshotId"] != candidate_id]
        self_runs = [r for r in same_date if r["snapshotId"] == candidate_id]

        if other_runs:
            # 같은 시장일에 다른 스냅샷이 이미 승격됨 → 불변 위치를 덮어쓰지 않고 충돌로 거절.
            phases["conflict"] = {"candidateId": candidate_id,
                                  "existingIds": [r["snapshotId"] for r in other_runs]}
            return RunResult(status=RUN_REJECTED, reasons=[SAME_DATE_CONFLICT],
                             marketDate=market_date, snapshotId=candidate_id,
                             pointer=store._read_pointer_raw(root), phases=phases,
                             evidence=evidence)

        if self_runs:
            existing = self_runs[0]
            if existing["ok"] and existing["bytes"] == candidate_bytes:
                # 바이트 동일 스냅샷이 이미 승격됨 → 멱등 NOOP(재게시/pointer 교체 없음).
                return RunResult(status=RUN_NOOP, reasons=[], marketDate=market_date,
                                 snapshotId=candidate_id, pointer=store._read_pointer_raw(root),
                                 phases=phases, evidence=evidence)
            # 같은 id 인데 손상/바이트 불일치 → 불변 위치를 덮어쓸 수 없으므로 충돌로 거절.
            phases["conflict"] = {"candidateId": candidate_id, "reason": "same_id_not_byte_identical",
                                  "verify": existing["reasons"]}
            return RunResult(status=RUN_REJECTED, reasons=[SAME_DATE_CONFLICT],
                             marketDate=market_date, snapshotId=candidate_id,
                             pointer=store._read_pointer_raw(root), phases=phases, evidence=evidence)

        # ---- 새 시장일 → 원자적 승격(store 가 pointer 교체를 소유). fault 는 그대로 전달. ----
        store_faults = faults & _STORE_FAULT_TOKENS
        pub = store.publish_snapshot(root, snap_dict, run_id=run_id, faults=store_faults)
        phases["publish"] = {"ok": pub.ok, "reasons": list(pub.reasons),
                             "snapshotId": pub.snapshotId, "detail": pub.detail}
        if not pub.ok:
            # 부분 실패 — store 는 직전 pointer 를 교체하지 않았다(원자적). 승인 pointer 무변경.
            return RunResult(status=RUN_REJECTED, reasons=[PUBLISH_FAILED],
                             marketDate=market_date, snapshotId=pub.snapshotId,
                             pointer=pub.pointer, phases=phases, evidence=evidence)

        return RunResult(status=RUN_PUBLISHED, reasons=[], marketDate=market_date,
                         snapshotId=pub.snapshotId, pointer=pub.pointer,
                         phases=phases, evidence=evidence)
    except Exception as e:  # noqa: BLE001  (fail closed — 예상 못한 예외도 승인하지 않는다)
        phases["internalError"] = repr(e)
        return RunResult(status=RUN_REJECTED, reasons=[INTERNAL_ERROR],
                         marketDate=(request or {}).get("marketDate"), phases=phases)


def _build_evidence(snap_dict, snapshot_id, qa, comparison, *, prior_status):
    """조립된 run 증거(결정적) — preflight 통과·엔진 정체성·자격 QA·차등 비교를 하나로 묶는다.

    저장 자체는 store 스냅샷(비공개 저장소)이 담당한다. 이 증거는 벽시계/난수를 쓰지 않으므로
    바이트 동일 입력은 바이트 동일 증거를 만든다(멱등).
    """
    return {
        "schema": "metrics251.run-evidence.v1",
        "engineVersion": snap_dict.get("engineVersion"),
        "marketDate": snap_dict.get("marketDate"),
        "snapshotId": snapshot_id,
        "configHash": snap_dict.get("configHash"),
        "inputManifestHash": snap_dict.get("inputManifestHash"),
        "sourceDates": snap_dict.get("sourceDates"),
        "eligibility": qa,
        "priorSnapshotStatus": prior_status,
        "comparison": comparison,
    }


# ---------------------------------------------------------------------------
# CLI — fixture 요청(+config·calendar)을 읽어 하나의 시장일 run 을 실행한다. 산출물은 비공개 저장소.
# ---------------------------------------------------------------------------
def _load_json(path):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def _load_calendar(path):
    if not path:
        return None
    with open(path, encoding="utf-8") as f:
        return cmp.FixtureTradingCalendar.from_fixture(json.load(f))


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 atomic/idempotent single-market-day shadow run (Slice N).")
    ap.add_argument("--request", help="run 요청 JSON(marketDate/sourceDates/stocks[, expected, config])")
    ap.add_argument("--config", default=None, help="엔진 config JSON(요청에 config 없으면 이 파일을 주입)")
    ap.add_argument("--calendar", default=None, help="거래일 캘린더 fixture(JSON)")
    ap.add_argument("--root", default=None, help="비공개 shadow 저장소 루트(요청 shadowRoot 를 덮어씀)")
    ap.add_argument("--faults", default="", help="쉼표 구분 fault 주입 토큰(테스트/진단용)")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 결과를 stdout 으로")
    args = ap.parse_args(argv)

    if not args.request:
        print("metrics251_run: atomic/idempotent 단일 시장일 shadow run 오케스트레이터 (Slice N). "
              "import 후 run_market_day(request, calendar=..., faults=...) 사용.")
        print(f"  engineVersion={ENGINE_VERSION} · 상태={RUN_PUBLISHED}/{RUN_NOOP}/{RUN_REJECTED} · fail closed")
        print(f"  기본 저장소 루트(비공개·Git 비추적)={os.path.relpath(store.DEFAULT_SHADOW_ROOT, ROOT)}")
        return 0

    req = _load_json(args.request)
    if not req.get("config") and args.config:
        req["config"] = _load_json(args.config)
    if args.root:
        req["shadowRoot"] = args.root
    if not req.get("shadowRoot"):
        req["shadowRoot"] = store.DEFAULT_SHADOW_ROOT
    if not req.get("outputLocation"):
        req["outputLocation"] = os.path.join(req["shadowRoot"], store.RUNS_SUBDIR, "run")
    if not req.get("expected"):
        req["expected"] = derive_expected(req.get("config"), req.get("marketDate"),
                                          req.get("sourceDates"), req.get("stocks"))
    calendar = _load_calendar(args.calendar)
    faults = {t.strip() for t in args.faults.split(",") if t.strip()}

    result = run_market_day(req, calendar=calendar, faults=faults)

    if args.json:
        # bytes(증거 내 raw)는 JSON 직렬화 대상이 아니므로 evidence 만 안전 출력(스캔 raw 미포함).
        print(json.dumps(result.to_dict(), ensure_ascii=False, sort_keys=True, indent=2, default=str))
    else:
        print(f"metrics251_run: marketDate={result.marketDate} · status={result.status}"
              + (f" · snapshotId={result.snapshotId}" if result.snapshotId else ""))
        if result.reasons:
            print("  사유: " + ", ".join(result.reasons))
    return 0 if result.ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
