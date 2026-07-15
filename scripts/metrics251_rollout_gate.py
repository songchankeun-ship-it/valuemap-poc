#!/usr/bin/env python3
# Metrics 2.5.1 shadow 운영 보고서 + 기계판독 롤아웃 게이트 평가기 (Slice K)
#   — 순수·결정적·표준 라이브러리 전용. 공개 라우트/화면에 연결하지 않는다(로컬/docs 지향).
#
# 목적(설계서 docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md §M251-D02 "5일 AND 게이트",
#      §7 Gate 4(실제 거래일 shadow), §8 데이터 계약, §9 실패/롤백, §10 Slice K, 원안 ORN-2508):
#   * 실행별(=시장일별) shadow run 을 요약한다: 소스 기준일, config/engine/input 해시,
#     factor·ranking 커버리지, 제외 사유, 차등 분류, manifest 무결성, 연속 거래일 연결성.
#   * 롤아웃 후보(rolloutCandidate)는 다음을 모두 만족할 때만 true 다(AND 게이트):
#       - 최소 5개 **연속 실제 거래일** run 이 QA_PASSED 로 봉인되어 있고,
#       - 그 창의 모든 run 이 (a) 미해결 P0 불일치 0, (b) 소스 기준일 불일치 0,
#         (c) 알 수 없는 제외 사유 0, (d) 공개 경로 누출 0 을 동시에 만족한다.
#     하루라도 빠지면(거래일 누락) 연속 카운트가 초기화된다(§9 "5일 중 한 번 P0 → 연속 초기화",
#     "A missing day resets continuity").
#   * 실제 run 이 5개 미만이면 PENDING 으로 보고한다 — 증거를 **합성하지 않는다**
#     (작업 지시: "report pending rather than synthesizing evidence").
#
# 반드시 지키는 규칙(설계서 §4 변경 불가 원칙 · §M251-D10 · 작업 지시):
#   * 보호되지 않은 라우트를 추가하지 않는다. 보고서는 로컬 stdout/JSON/Markdown(docs/) 이다.
#   * 벽시계 시각/난수/네트워크 금지 — 출력은 입력 run 기록에서만 결정적으로 파생.
#   * 결측을 50/평균으로 채우지 않는다. 차등 증거가 없는 run 은 게이트를 통과시키지 않고
#     DIFFERENTIAL_MISSING 으로 남긴다(합성 금지).
#   * public/ 데이터를 읽거나 쓰지 않는다. shadow 저장소 루트가 public/ 밑이면 누출로 실패.
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from typing import Optional

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import metrics251_engine as eng            # noqa: E402  (FACTORS·사유 enum·RUN_STATE)
import metrics251_eligibility as elig       # noqa: E402  (FACTOR_REASONS·EXCLUDING_REASONS·is_known_reason)
import metrics251_snapshot_store as store   # noqa: E402  (verify_run_dir·QA_PASSED·assert_private_root)
from metrics251_compare import FixtureTradingCalendar  # noqa: E402  (Slice G 거래일 캘린더)
from metrics251_config import canonical_bytes          # noqa: E402  (결정성 해시)

ENGINE_VERSION = eng.ENGINE_VERSION
FACTORS = eng.FACTORS
MIN_CONSECUTIVE_RUNS = 5  # §M251-D02: 최소 5개 연속 실제 거래일

DEFAULT_JSON_OUT = os.path.join(ROOT, "docs", "metrics-2.5.1-rollout-gate.json")
DEFAULT_MD_OUT = os.path.join(ROOT, "docs", "metrics-2.5.1-rollout-gate.md")

# ---------------------------------------------------------------------------
# 게이트 상태(기계판독 enum).
# ---------------------------------------------------------------------------
GATE_MET = "MET"            # 5개 연속 실제 거래일 QA_PASSED + 창 전체 4-zero 만족 → rolloutCandidate=true
GATE_NOT_MET = "NOT_MET"    # run 은 5개 이상이나 연속성/조건 미충족
GATE_PENDING = "PENDING"    # 실제 run 5개 미만 — 증거 합성 없이 보류

# run 단위 실패 사유 코드(안정적, 게이트 창 자격 판정용).
FAIL_NOT_QA_PASSED = "NOT_QA_PASSED"
FAIL_MANIFEST_COMPROMISED = "MANIFEST_COMPROMISED"
FAIL_NOT_TRADING_DAY = "NOT_TRADING_DAY"
FAIL_CALENDAR_UNCOVERED = "CALENDAR_UNCOVERED"
FAIL_SOURCE_DATE_MISMATCH = "SOURCE_DATE_MISMATCH"
FAIL_UNKNOWN_EXCLUSION_REASON = "UNKNOWN_EXCLUSION_REASON"
FAIL_DIFFERENTIAL_MISSING = "DIFFERENTIAL_MISSING"
FAIL_UNRESOLVED_P0 = "UNRESOLVED_P0"
FAIL_PUBLIC_PATH_LEAK = "PUBLIC_PATH_LEAK"

# 게이트 차단 사유(상위 수준).
BLOCK_INSUFFICIENT_REAL_RUNS = "INSUFFICIENT_REAL_RUNS"
BLOCK_CONTINUITY_BROKEN = "CONTINUITY_BROKEN"


# ---------------------------------------------------------------------------
# 공개 경로 누출 가드 — shadow 산출물은 절대 public/ 밑에 있으면 안 된다(§M251-D10, §9).
# ---------------------------------------------------------------------------
def is_public_path(path):
    """path 가 public/ 밑으로 resolve 되면 True(공개 경로 누출)."""
    if not path:
        return False
    p_abs = os.path.abspath(path)
    public_abs = os.path.abspath(os.path.join(ROOT, "public"))
    try:
        common = os.path.commonpath([p_abs, public_abs])
    except ValueError:
        return False  # 다른 드라이브 등 — public 밑일 수 없음
    return common == public_abs


# ---------------------------------------------------------------------------
# 커버리지 계산 — 결측을 채우지 않고 count/pct 만 보고한다.
# ---------------------------------------------------------------------------
def _pct(count, total):
    if not total:
        return None
    return round(count / total * 100.0, 2)


def _coverage(populations, ranking_pop, universe_size):
    """factor 별 {count,pct} 와 ranking {count,pct}. universe_size 없으면 pct=None."""
    factor_cov = {}
    for f in FACTORS:
        c = ((populations or {}).get(f) or {}).get("count")
        factor_cov[f] = {"count": c, "pct": _pct(c, universe_size) if isinstance(c, int) else None}
    rc = (ranking_pop or {}).get("count")
    ranking_cov = {"count": rc, "pct": _pct(rc, universe_size) if isinstance(rc, int) else None}
    return factor_cov, ranking_cov


# ---------------------------------------------------------------------------
# 제외 사유 파싱 — eligibilityReasonCounts 키는 "factor.REASON" 형식(엔진 계약, §8).
# ---------------------------------------------------------------------------
def _split_reason_key(key):
    """'momentum.MISSING_INPUT' → ('momentum','MISSING_INPUT'). 점 없으면 (None, key)."""
    if "." in key:
        factor, reason = key.split(".", 1)
        return factor, reason
    return None, key


def classify_exclusions(reason_counts):
    """eligibilityReasonCounts 를 분류. 반환: (excluding{reason:count}, unknown_keys[list], source_mismatch_count)."""
    excluding = {}
    unknown = []
    source_mismatch = 0
    for key, n in (reason_counts or {}).items():
        factor, reason = _split_reason_key(key)
        known = (factor in FACTORS) and elig.is_known_reason(reason)
        if not known:
            unknown.append(key)
            continue
        if reason == eng.SOURCE_DATE_MISMATCH:
            source_mismatch += int(n)
        if reason in elig.EXCLUDING_REASONS:
            excluding[reason] = excluding.get(reason, 0) + int(n)
    return dict(sorted(excluding.items())), sorted(unknown), source_mismatch


# ---------------------------------------------------------------------------
# 소스 기준일 불일치 — 미래 소스일(marketDate 이후)·필수 소스일 결측 + factor 수준 SOURCE_DATE_MISMATCH.
# ---------------------------------------------------------------------------
def source_date_findings(source_dates, market_date, factor_source_mismatch):
    """반환: {"missing":[keys], "future":[keys], "factorMismatch":int, "count":int}."""
    sd = source_dates or {}
    missing = []
    future = []
    for key in ("prices", "volumes"):  # 재무(fundamentals)는 null 허용 — 밸류만 보류(§M251-D03)
        val = sd.get(key)
        if not val:
            missing.append(key)
        elif market_date and str(val) > str(market_date):
            future.append(key)  # 미래 데이터는 불가능 → 불일치(§compute_snapshot RUN_SOURCE_DATE_MISMATCH)
    count = len(missing) + len(future) + int(factor_source_mismatch)
    return {"missing": missing, "future": future,
            "factorMismatch": int(factor_source_mismatch), "count": count}


# ---------------------------------------------------------------------------
# run 단위 평가 — 정규화된 run 기록 + 캘린더 → RunFinding(dict).
# ---------------------------------------------------------------------------
@dataclass
class RunFinding:
    marketDate: str
    snapshotId: Optional[str]
    qaPassed: bool
    manifestIntact: bool
    isRealMarketDay: Optional[bool]        # None = 캘린더가 날짜를 커버하지 못함
    engineVersion: Optional[str]
    configHash: Optional[str]
    inputManifestHash: Optional[str]
    sourceDates: dict
    sourceDateFindings: dict
    factorCoverage: dict
    rankingCoverage: dict
    universeSize: Optional[int]
    exclusionReasons: dict
    unknownExclusionReasons: list
    differentialAvailable: bool
    unresolvedP0: Optional[int]
    publicPathLeak: bool
    passesRunChecks: bool
    failReasons: list = field(default_factory=list)

    def to_dict(self):
        return {
            "marketDate": self.marketDate,
            "snapshotId": self.snapshotId,
            "qaPassed": self.qaPassed,
            "manifestIntact": self.manifestIntact,
            "isRealMarketDay": self.isRealMarketDay,
            "engineVersion": self.engineVersion,
            "configHash": self.configHash,
            "inputManifestHash": self.inputManifestHash,
            "sourceDates": self.sourceDates,
            "sourceDateFindings": self.sourceDateFindings,
            "factorCoverage": self.factorCoverage,
            "rankingCoverage": self.rankingCoverage,
            "universeSize": self.universeSize,
            "exclusionReasons": self.exclusionReasons,
            "unknownExclusionReasons": self.unknownExclusionReasons,
            "differentialAvailable": self.differentialAvailable,
            "unresolvedP0": self.unresolvedP0,
            "publicPathLeak": self.publicPathLeak,
            "passesRunChecks": self.passesRunChecks,
            "failReasons": self.failReasons,
        }


def evaluate_run(record, calendar):
    """정규화된 run 기록 하나를 평가한다. 결측을 채우지 않고 정직하게 unknown 을 표시한다."""
    market_date = str(record.get("marketDate")) if record.get("marketDate") else None

    integrity = record.get("manifestIntegrity") or {"ok": True, "reasons": []}
    manifest_intact = bool(integrity.get("ok", False))
    qa_sealed = record.get("manifestRunState") == store.RUN_STATE_QA_PASSED
    qa_passed = qa_sealed and manifest_intact

    # 실제 거래일 여부 — 캘린더가 커버하지 못하면 확정 불가(None). 합성하지 않는다.
    if market_date and calendar is not None and calendar.covers(market_date):
        is_real_market_day = calendar.is_trading_day(market_date)
    else:
        is_real_market_day = None

    excluding, unknown_keys, factor_source_mismatch = classify_exclusions(
        record.get("eligibilityReasonCounts"))
    sd_find = source_date_findings(record.get("sourceDates"), market_date, factor_source_mismatch)

    universe_size = record.get("universeSize")
    factor_cov, ranking_cov = _coverage(
        record.get("factorPopulations"), record.get("rankingPopulation"), universe_size)

    diff = record.get("differential")
    differential_available = bool(diff and diff.get("available"))
    unresolved_p0 = diff.get("unresolvedP0") if differential_available else None

    # 공개 경로 누출 — 명시 override 우선, 없으면 provenanceRoot 로 판정.
    if record.get("publicPathLeak") is not None:
        public_leak = bool(record.get("publicPathLeak"))
    else:
        public_leak = is_public_path(record.get("provenanceRoot"))

    # ---- run 게이트 조건(모두 만족해야 창 자격) ----
    fails = []
    if not qa_passed:
        fails.append(FAIL_NOT_QA_PASSED)
    if not manifest_intact:
        fails.append(FAIL_MANIFEST_COMPROMISED)
    if is_real_market_day is None:
        fails.append(FAIL_CALENDAR_UNCOVERED)
    elif not is_real_market_day:
        fails.append(FAIL_NOT_TRADING_DAY)
    if sd_find["count"] > 0:
        fails.append(FAIL_SOURCE_DATE_MISMATCH)
    if unknown_keys:
        fails.append(FAIL_UNKNOWN_EXCLUSION_REASON)
    if not differential_available:
        fails.append(FAIL_DIFFERENTIAL_MISSING)
    elif unresolved_p0 is None or unresolved_p0 > 0:
        fails.append(FAIL_UNRESOLVED_P0)
    if public_leak:
        fails.append(FAIL_PUBLIC_PATH_LEAK)

    return RunFinding(
        marketDate=market_date,
        snapshotId=record.get("snapshotId"),
        qaPassed=qa_passed,
        manifestIntact=manifest_intact,
        isRealMarketDay=is_real_market_day,
        engineVersion=record.get("engineVersion"),
        configHash=record.get("configHash"),
        inputManifestHash=record.get("inputManifestHash"),
        sourceDates=record.get("sourceDates") or {},
        sourceDateFindings=sd_find,
        factorCoverage=factor_cov,
        rankingCoverage=ranking_cov,
        universeSize=universe_size,
        exclusionReasons=excluding,
        unknownExclusionReasons=unknown_keys,
        differentialAvailable=differential_available,
        unresolvedP0=unresolved_p0,
        publicPathLeak=public_leak,
        passesRunChecks=not fails,
        failReasons=sorted(set(fails)),
    )


# ---------------------------------------------------------------------------
# 연속성 — 정렬된 findings 에서 인접 거래일 연결성과 후행(trailing) 연속 통과 streak 를 계산.
# ---------------------------------------------------------------------------
def _consecutive(prev_date, cur_date, calendar):
    """cur_date 가 prev_date 의 바로 다음 거래일이면 True. 캘린더 미커버/동일일은 False."""
    if calendar is None or prev_date is None or cur_date is None:
        return False
    if cur_date == prev_date:
        return False
    if not (calendar.covers(prev_date) and calendar.covers(cur_date)):
        return False
    return calendar.previous_trading_day(cur_date) == prev_date


def _continuity(findings, calendar):
    """인접 run 사이의 gap(거래일 누락)·중복일·캘린더 미커버일을 수집."""
    ordered = [f.marketDate for f in findings]
    duplicates = sorted({d for d in ordered if ordered.count(d) > 1})
    uncovered = sorted({f.marketDate for f in findings if f.isRealMarketDay is None})
    gaps = []
    for i in range(1, len(findings)):
        prev_d, cur_d = findings[i - 1].marketDate, findings[i].marketDate
        if prev_d == cur_d:
            continue  # 중복일은 별도 보고
        if not _consecutive(prev_d, cur_d, calendar):
            gaps.append({"from": prev_d, "to": cur_d})
    return {"orderedDates": ordered, "duplicateMarketDates": duplicates,
            "gaps": gaps, "calendarUncoveredDates": uncovered}


def _trailing_streak(findings, calendar):
    """가장 최근 run 에서 끝나는 연속 통과(run 게이트 만족 + 인접 거래일) streak 를 반환.

    실패 run 은 streak 를 초기화한다(§9). 최대 streak 도 함께 계산한다.
    """
    streak = []
    max_len = 0
    for f in findings:
        if f.passesRunChecks:
            if streak and _consecutive(streak[-1].marketDate, f.marketDate, calendar):
                streak.append(f)
            else:
                streak = [f]  # 연속성 끊김 → 새 streak 시작
        else:
            streak = []       # 실패 run → 초기화
        max_len = max(max_len, len(streak))
    return streak, max_len


# ---------------------------------------------------------------------------
# 롤아웃 게이트 평가 — 순수 함수. run 기록 리스트 + 캘린더 → 결정적 보고서(dict).
# ---------------------------------------------------------------------------
def evaluate_rollout_gate(runs, calendar, *, min_consecutive=MIN_CONSECUTIVE_RUNS,
                          generated_from="fixture"):
    """실행별 요약 + 5일 AND 게이트 판정. 증거 합성 없음·결정적."""
    findings = [evaluate_run(r, calendar) for r in runs]
    findings.sort(key=lambda f: (f.marketDate or "", f.snapshotId or ""))

    continuity = _continuity(findings, calendar)
    streak, max_streak = _trailing_streak(findings, calendar)
    actual_runs = len(findings)
    trailing_len = len(streak)

    # 창(window) = 후행 streak 의 마지막 min_consecutive 개(MET 이면 정확히 자격 창).
    window = streak[-min_consecutive:] if trailing_len >= min_consecutive else list(streak)
    window_zero = {
        "unresolvedP0": sum((f.unresolvedP0 or 0) for f in window),
        "sourceDateMismatch": sum(f.sourceDateFindings["count"] for f in window),
        "unknownExclusionReason": sum(len(f.unknownExclusionReasons) for f in window),
        "publicPathLeakage": sum(1 for f in window if f.publicPathLeak),
    }

    blocking = []
    if actual_runs < min_consecutive:
        status = GATE_PENDING
        blocking.append(BLOCK_INSUFFICIENT_REAL_RUNS)
    elif trailing_len >= min_consecutive:
        status = GATE_MET
    else:
        status = GATE_NOT_MET
        blocking.append(BLOCK_CONTINUITY_BROKEN)
        # 최근 min_consecutive 구간에서 관측된 개별 실패 사유를 노출(진단).
        recent = findings[-min_consecutive:]
        seen = sorted({c for f in recent for c in f.failReasons})
        blocking.extend(seen)

    rollout_candidate = status == GATE_MET

    # 집계.
    fail_reason_counts = {}
    exclusion_totals = {}
    passing = 0
    for f in findings:
        if f.passesRunChecks:
            passing += 1
        for c in f.failReasons:
            fail_reason_counts[c] = fail_reason_counts.get(c, 0) + 1
        for reason, n in f.exclusionReasons.items():
            exclusion_totals[reason] = exclusion_totals.get(reason, 0) + n

    cal_cov = None
    if calendar is not None and getattr(calendar, "_start", None):
        cal_cov = {"start": calendar._start, "end": calendar._end}

    return {
        "meta": {
            "reportKind": "metrics-2.5.1-rollout-gate",
            "engineVersion": ENGINE_VERSION,
            "readOnly": True,
            "computesPublicScore": False,
            "generatedFrom": generated_from,
            "requiredConsecutiveRuns": min_consecutive,
            "calendarCoverage": cal_cov,
            "note": "shadow 운영 게이트(§M251-D02 5일 AND). 공개 Metrics 2.4 정본은 불변이며 "
                    "이 보고서는 공개 전환 승인 근거가 아니라 로컬 준비 상태 요약이다(§7 Gate 6).",
        },
        "gate": {
            "status": status,
            "rolloutCandidate": rollout_candidate,
            "actualRuns": actual_runs,
            "requiredConsecutiveRuns": min_consecutive,
            "trailingConsecutivePassingRuns": trailing_len,
            "maxConsecutivePassingRuns": max_streak,
            "windowDates": [f.marketDate for f in window],
            "windowZeroConditions": window_zero,
            "blockingReasons": blocking,
        },
        "continuity": continuity,
        "aggregate": {
            "passingRuns": passing,
            "failingRuns": actual_runs - passing,
            "runFailReasonCounts": dict(sorted(fail_reason_counts.items())),
            "exclusionReasonTotals": dict(sorted(exclusion_totals.items())),
        },
        "runs": [f.to_dict() for f in findings],
    }


# ---------------------------------------------------------------------------
# 실제 shadow 저장소 읽기(읽기 전용) — run 마다 차등 증거는 없으므로 differential=None(합성 금지).
# ---------------------------------------------------------------------------
def run_evidence_from_store(root):
    """비공개 shadow 저장소의 승격된 run 들을 정규화 기록으로 읽는다. 없으면 []."""
    root = store.assert_private_root(root)  # 저장소가 public/ 밑이면 즉시 실패(§M251-D10)
    runs_dir = os.path.join(root, store.RUNS_SUBDIR)
    if not os.path.isdir(runs_dir):
        return []
    records = []
    for sub in sorted(os.listdir(runs_dir)):
        run_dir = os.path.join(runs_dir, sub)
        if not os.path.isdir(run_dir):
            continue
        verified = store.verify_run_dir(run_dir)
        manifest = verified.manifest or {}
        snapshot = {}
        snap_path = os.path.join(run_dir, store.ARTIFACT_SNAPSHOT)
        if os.path.exists(snap_path):
            try:
                with open(snap_path, encoding="utf-8") as f:
                    snapshot = json.load(f)
            except (ValueError, OSError):
                snapshot = {}
        records.append({
            "marketDate": manifest.get("marketDate") or snapshot.get("marketDate"),
            "snapshotId": sub,
            "manifestRunState": manifest.get("runState"),
            "manifestIntegrity": {"ok": verified.ok, "reasons": verified.reasons},
            "engineVersion": snapshot.get("engineVersion") or manifest.get("metricsVersion"),
            "configHash": snapshot.get("configHash") or manifest.get("configHash"),
            "inputManifestHash": snapshot.get("inputManifestHash") or manifest.get("inputManifestHash"),
            "sourceDates": snapshot.get("sourceDates") or {},
            "factorPopulations": snapshot.get("factorPopulations") or {},
            "rankingPopulation": snapshot.get("rankingPopulation") or {},
            "eligibilityReasonCounts": snapshot.get("eligibilityReasonCounts") or {},
            "universeSize": len(snapshot.get("stocks") or []) if snapshot.get("stocks") else None,
            # 차등(2.4-vs-2.5.1 P0) 증거는 저장소에 없다 → 합성하지 않고 None 유지(게이트 통과 불가).
            "differential": None,
            "provenanceRoot": run_dir,
        })
    records.sort(key=lambda r: (str(r.get("marketDate") or ""), r.get("snapshotId") or ""))
    return records


def report_hash(report):
    """보고서의 결정적 canonical 해시(재실행 동일성 증거)."""
    import hashlib
    return hashlib.sha256(canonical_bytes(report)).hexdigest()


# ---------------------------------------------------------------------------
# Markdown 렌더 — 결정적(같은 보고서 → 같은 바이트).
# ---------------------------------------------------------------------------
def _fmt_zero(name, val):
    return f"{name}={val} {'✅' if val == 0 else '❌'}"


def render_markdown(report):
    g = report["gate"]
    m = report["meta"]
    L = []
    L.append("# Metrics 2.5.1 shadow 운영 보고서 · 롤아웃 게이트 (Slice K)")
    L.append("")
    L.append("> 이 문서는 `scripts/metrics251_rollout_gate.py` 가 비공개 shadow 저장소(또는 fixture)에서 "
             "**결정적으로 재생성**합니다. 손으로 수정하지 마세요.")
    L.append("")
    L.append("**로컬 준비 상태 요약이며 공개 전환 승인이 아닙니다(§7 Gate 6).** 공개 Metrics 2.4 정본은 "
             "불변입니다. 롤아웃 후보는 §M251-D02 의 5일 AND 게이트를 만족할 때만 true 입니다.")
    L.append("")
    L.append(f"- 엔진 버전: `{m['engineVersion']}` · 생성 출처: `{m['generatedFrom']}` · "
             f"요구 연속일: **{m['requiredConsecutiveRuns']}**")
    if m.get("calendarCoverage"):
        cc = m["calendarCoverage"]
        L.append(f"- 거래일 캘린더 커버리지: `{cc['start']}` … `{cc['end']}`")
    else:
        L.append("- 거래일 캘린더: 미제공 — 연속성 확정 불가(모든 run CALENDAR_UNCOVERED)")
    L.append("")

    L.append("## 0. 게이트 판정")
    L.append("")
    label = {GATE_MET: "MET ✅", GATE_NOT_MET: "NOT_MET ❌", GATE_PENDING: "PENDING ⏳"}[g["status"]]
    L.append(f"- **상태: {label}** · rolloutCandidate: **{str(g['rolloutCandidate']).lower()}**")
    L.append(f"- 실제 run: **{g['actualRuns']}** (요구 {g['requiredConsecutiveRuns']}) · "
             f"후행 연속 통과: **{g['trailingConsecutivePassingRuns']}** · 최대 연속: {g['maxConsecutivePassingRuns']}")
    if g["windowDates"]:
        L.append(f"- 자격 창(window): {', '.join(f'`{d}`' for d in g['windowDates'])}")
    wz = g["windowZeroConditions"]
    L.append("- 창 4-zero 조건: " + " · ".join([
        _fmt_zero("미해결P0", wz["unresolvedP0"]),
        _fmt_zero("소스일불일치", wz["sourceDateMismatch"]),
        _fmt_zero("미지제외사유", wz["unknownExclusionReason"]),
        _fmt_zero("공개경로누출", wz["publicPathLeakage"]),
    ]))
    if g["blockingReasons"]:
        L.append(f"- 차단 사유: {', '.join(f'`{c}`' for c in g['blockingReasons'])}")
    L.append("")
    if g["status"] == GATE_PENDING:
        L.append("> 실제 shadow run 이 5개 미만입니다. 증거를 합성하지 않고 **PENDING** 으로 둡니다"
                 "(작업 지시: report pending rather than synthesizing evidence).")
        L.append("")

    L.append("## 1. 연속성")
    L.append("")
    cont = report["continuity"]
    L.append(f"- 관측 시장일: {len(cont['orderedDates'])}개")
    if cont["gaps"]:
        L.append("- 연속성 끊김(거래일 누락):")
        for gap in cont["gaps"]:
            L.append(f"  - `{gap['from']}` → `{gap['to']}` 사이 거래일 누락")
    else:
        L.append("- 연속성 끊김: 없음")
    if cont["duplicateMarketDates"]:
        L.append(f"- 중복 시장일: {', '.join(f'`{d}`' for d in cont['duplicateMarketDates'])}")
    if cont["calendarUncoveredDates"]:
        L.append(f"- 캘린더 미커버일: {len(cont['calendarUncoveredDates'])}개")
    L.append("")

    L.append("## 2. 집계")
    L.append("")
    agg = report["aggregate"]
    L.append(f"- 통과 run: {agg['passingRuns']} · 실패 run: {agg['failingRuns']}")
    if agg["runFailReasonCounts"]:
        L.append("- run 실패 사유: " + ", ".join(f"`{k}`={v}" for k, v in agg["runFailReasonCounts"].items()))
    if agg["exclusionReasonTotals"]:
        L.append("- 제외 사유 합계: " + ", ".join(f"`{k}`={v}" for k, v in agg["exclusionReasonTotals"].items()))
    L.append("")

    L.append("## 3. 실행별 요약")
    L.append("")
    if not report["runs"]:
        L.append("_기록된 shadow run 이 없습니다._")
    else:
        L.append("| 시장일 | snapshotId | QA | 거래일 | 소스일불일치 | 미지사유 | 차등 | 미해결P0 | 누출 | 통과 |")
        L.append("|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|")
        for r in report["runs"]:
            trad = {True: "예", False: "아니오", None: "미확정"}[r["isRealMarketDay"]]
            diff = "있음" if r["differentialAvailable"] else "없음"
            p0 = "?" if r["unresolvedP0"] is None else str(r["unresolvedP0"])
            L.append(
                f"| {r['marketDate']} | {r['snapshotId'] or '-'} | "
                f"{'✅' if r['qaPassed'] else '❌'} | {trad} | {r['sourceDateFindings']['count']} | "
                f"{len(r['unknownExclusionReasons'])} | {diff} | {p0} | "
                f"{'예' if r['publicPathLeak'] else '아니오'} | {'✅' if r['passesRunChecks'] else '❌'} |")
    L.append("")
    L.append(f"보고서 canonical SHA-256: `{report_hash(report)}`")
    L.append("")
    return "\n".join(L)


# ---------------------------------------------------------------------------
# CLI — 실제 shadow 저장소(읽기 전용) 또는 fixture 에서 보고서 생성.
# ---------------------------------------------------------------------------
def _load_calendar(path):
    if not path:
        return None
    with open(path, encoding="utf-8") as f:
        fx = json.load(f)
    return FixtureTradingCalendar.from_fixture(fx)


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Metrics 2.5.1 shadow 운영 보고서 + 롤아웃 게이트 평가기 (Slice K, read-only, deterministic).")
    ap.add_argument("--root", default=store.DEFAULT_SHADOW_ROOT, help="비공개 shadow 저장소 루트")
    ap.add_argument("--calendar", default=None, help="거래일 캘린더 fixture(JSON) — 없으면 연속성 미확정")
    ap.add_argument("--json", action="store_true", help="결정적 JSON 을 stdout 으로")
    ap.add_argument("--json-out", default=DEFAULT_JSON_OUT, help="JSON 보고서 출력 경로(docs/)")
    ap.add_argument("--out", default=DEFAULT_MD_OUT, help="Markdown 보고서 출력 경로(docs/)")
    ap.add_argument("--no-write", action="store_true", help="파일 미기록, 요약만")
    args = ap.parse_args(argv)

    runs = run_evidence_from_store(args.root)
    calendar = _load_calendar(args.calendar)
    report = evaluate_rollout_gate(runs, calendar, generated_from="shadow-store")

    if args.json:
        print(json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2))
        return 0

    js = json.dumps(report, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
    md = render_markdown(report)
    if not args.no_write:
        with open(args.json_out, "w", encoding="utf-8", newline="\n") as fp:
            fp.write(js)
        with open(args.out, "w", encoding="utf-8", newline="\n") as fp:
            fp.write(md)
        print(f"metrics251_rollout_gate: {os.path.relpath(args.json_out, ROOT)} + "
              f"{os.path.relpath(args.out, ROOT)} 재생성 완료.")

    g = report["gate"]
    print(f"  상태 {g['status']} · rolloutCandidate {str(g['rolloutCandidate']).lower()} · "
          f"실제run {g['actualRuns']} · 후행연속 {g['trailingConsecutivePassingRuns']} · "
          f"hash {report_hash(report)[:12]}…")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
