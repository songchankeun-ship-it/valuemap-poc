#!/usr/bin/env python3
# ORNScore service continuity Slice C - public-data candidate delta guard.
#
# Deterministic, offline, pre-commit guard that compares the committed
# public-data baseline (public/data/stocks.json at git HEAD) with the
# working-tree candidate WITHOUT modifying either input. It exists so a routine
# data refresh cannot silently publish a stale, malformed, identity-drifted, or
# broadly corrupted stocks.json (see docs/ornscore-service-continuity-2026-07-17.md
# Slice C). It classifies the candidate against a single stable reason code and
# fails closed on any comparison it cannot understand.
#
# The guard is read-only. It never writes stocks.json, never touches public/data,
# and starts no server. Baseline is read from Git (`git show HEAD:...`) or an
# explicit path; candidate is read from the working tree or an explicit path.
#
# Usage:
#   python scripts/verify_public_data_delta.py            # HEAD baseline vs working tree
#   python scripts/verify_public_data_delta.py --json     # stable JSON to stdout
#   python scripts/verify_public_data_delta.py --baseline <path> --candidate <path>
#
# Exit code: 0 when the candidate PASSES (reason OK or NO_CHANGE), 1 otherwise.
import argparse
import json
import math
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DEFAULT_CANDIDATE = os.path.join(ROOT, "public", "data", "stocks.json")
DEFAULT_BASELINE_GITPATH = "public/data/stocks.json"

# Public invariants (frozen). Metrics 2.4 and the 138-stock universe are boundary
# values this batch must not change; the guard asserts them, it does not edit them.
EXPECTED_METRICS_VERSION = "2.4"
EXPECTED_UNIVERSE = 138

# Schema contract mirrored from public/data/stocks.json.
REQUIRED_TOP_KEYS = ("generatedAt", "source", "count", "stocks", "metricsVersion", "asOfBusinessDate")
REQUIRED_STOCK_KEYS = (
    "ticker", "name", "market", "themes",
    "currentPrice", "marketCap",
    "momentum", "flow", "value", "volScore", "compositeScore",
)
# Numeric fields that must always be finite in a healthy candidate.
FINITE_STOCK_FIELDS = (
    "currentPrice", "marketCap",
    "momentum", "flow", "value", "volScore", "compositeScore",
)
# Fundamentals that may legitimately be null per stock, but whose broad
# disappearance signals a degraded data source. Coverage is measured over these.
COVERAGE_FIELDS = ("per", "pbr", "roe", "eps", "bps")
BUSINESS_DATE_RE = re.compile(r"^\d{8}$")

# ---- Documented bounded budgets --------------------------------------------
# KRX applies a +/-30% daily price limit. A single-session price move beyond
# ANOMALY_PRICE_PCT is therefore physically implausible and reads as isolated
# corruption. A score (0-100) jump beyond ANOMALY_SCORE_ABS is likewise implausible
# day over day. A SMALL number of such anomalies is tolerated (halts, ex-events,
# resumptions); exceeding ANOMALY_BUDGET means isolated corruption -> OUTLIER.
ANOMALY_PRICE_PCT = 35.0
ANOMALY_SCORE_ABS = 60.0
ANOMALY_BUDGET = 3
# Expected market movement touches few names hard in one session. If more than
# MASS_CHANGE_BUDGET of the shared universe moves past MATERIAL_MOVE_PCT (price)
# or MATERIAL_SCORE_ABS (score), the shift is too broad to be a market day and
# reads as a rescale/regeneration corruption -> MASS_CHANGE.
MATERIAL_MOVE_PCT = 20.0
MATERIAL_SCORE_ABS = 25.0
MASS_CHANGE_BUDGET = 0.50
# Fundamentals coverage may dip slightly day to day; a drop beyond this fraction
# of the universe signals a degraded source -> COVERAGE_LOW.
COVERAGE_DROP_BUDGET = 0.15

# Stable reason codes. PASS_REASONS never fail the gate.
PASS_REASONS = ("OK", "NO_CHANGE")


class GuardError(Exception):
    """Raised for an input the guard cannot classify; mapped to fail-closed UNKNOWN."""

    def __init__(self, reason, message):
        super().__init__(message)
        self.reason = reason
        self.message = message


def _is_finite_number(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def _read_text(path):
    # utf-8-sig tolerates the BOM the real stocks.json may carry.
    with open(path, encoding="utf-8-sig") as f:
        return f.read()


def load_candidate(path):
    """Load the working-tree candidate. Missing/empty -> MISSING; unparseable -> SCHEMA_INVALID."""
    if not os.path.exists(path):
        raise GuardError("MISSING", f"candidate file absent: {_rel(path)}")
    try:
        text = _read_text(path)
    except OSError as exc:
        raise GuardError("MISSING", f"candidate unreadable: {_rel(path)} ({exc})")
    if not text.strip():
        raise GuardError("MISSING", f"candidate empty: {_rel(path)}")
    try:
        # allow_nan is default True: NaN/Infinity tokens parse to floats so the
        # finite check can detect them rather than the parser rejecting them.
        return json.loads(text)
    except (json.JSONDecodeError, ValueError) as exc:
        raise GuardError("SCHEMA_INVALID", f"candidate not valid JSON: {_rel(path)} ({exc})")


def load_baseline(source):
    """Load the committed baseline. `source == 'git'` reads HEAD; otherwise a path.

    A baseline the guard cannot read is UNKNOWN (fail closed): without a trusted
    reference there is nothing to compare against.
    """
    if source == "git":
        try:
            raw = subprocess.run(
                ["git", "show", f"HEAD:{DEFAULT_BASELINE_GITPATH}"],
                cwd=ROOT, capture_output=True, check=True,
            ).stdout
        except (subprocess.CalledProcessError, OSError) as exc:
            raise GuardError("UNKNOWN", f"cannot read committed baseline from git HEAD ({exc})")
        text = raw.decode("utf-8-sig")
    else:
        if not os.path.exists(source):
            raise GuardError("UNKNOWN", f"baseline file absent: {_rel(source)}")
        try:
            text = _read_text(source)
        except OSError as exc:
            raise GuardError("UNKNOWN", f"baseline unreadable: {_rel(source)} ({exc})")
    if not text.strip():
        raise GuardError("UNKNOWN", f"baseline empty: {_rel(source)}")
    try:
        return json.loads(text), text
    except (json.JSONDecodeError, ValueError) as exc:
        raise GuardError("UNKNOWN", f"baseline not valid JSON ({exc})")


def _rel(path):
    try:
        return os.path.relpath(path, ROOT).replace(os.sep, "/")
    except ValueError:
        return os.path.basename(path)


def _canonical(obj):
    return json.dumps(obj, sort_keys=True, ensure_ascii=True, separators=(",", ":"))


def _check_schema(doc, label, expected_count):
    """Structural + required-field + Metrics 2.4 + business-date-format checks."""
    problems = []
    if not isinstance(doc, dict):
        raise GuardError("SCHEMA_INVALID", f"{label} root is not an object")
    for k in REQUIRED_TOP_KEYS:
        if k not in doc:
            problems.append(f"{label} missing top-level '{k}'")
    stocks = doc.get("stocks")
    if not isinstance(stocks, list):
        raise GuardError("SCHEMA_INVALID", f"{label} 'stocks' is not a list")
    if doc.get("metricsVersion") != EXPECTED_METRICS_VERSION:
        problems.append(f"{label} metricsVersion {doc.get('metricsVersion')!r} != {EXPECTED_METRICS_VERSION!r}")
    bdate = doc.get("asOfBusinessDate")
    if not (isinstance(bdate, str) and BUSINESS_DATE_RE.match(bdate)):
        problems.append(f"{label} asOfBusinessDate {bdate!r} not YYYYMMDD")
    for i, s in enumerate(stocks):
        if not isinstance(s, dict):
            problems.append(f"{label} stock #{i} is not an object")
            continue
        for k in REQUIRED_STOCK_KEYS:
            if k not in s:
                problems.append(f"{label} stock {s.get('ticker', '#'+str(i))} missing '{k}'")
        themes = s.get("themes")
        if "themes" in s and not (isinstance(themes, list) and len(themes) > 0):
            problems.append(f"{label} stock {s.get('ticker', '#'+str(i))} themes empty/not-list")
    if problems:
        raise GuardError("SCHEMA_INVALID", "; ".join(problems[:10]))


def _ticker_list(doc):
    return [s.get("ticker") for s in doc["stocks"]]


def _check_identity(baseline, candidate, expected_count):
    base_tickers = _ticker_list(baseline)
    cand_tickers = _ticker_list(candidate)
    base_set, cand_set = set(base_tickers), set(cand_tickers)
    details = []
    if len(cand_tickers) != expected_count:
        details.append(f"candidate has {len(cand_tickers)} stocks, expected {expected_count}")
    if len(cand_set) != len(cand_tickers):
        details.append("candidate has duplicate tickers")
    missing = sorted(base_set - cand_set)
    added = sorted(cand_set - base_set)
    if missing:
        details.append(f"missing {len(missing)}: {missing[:5]}")
    if added:
        details.append(f"added {len(added)}: {added[:5]}")
    if details:
        raise GuardError("IDENTITY_DRIFT", "; ".join(details))


def _check_finite(candidate):
    bad = []
    for s in candidate["stocks"]:
        for k in FINITE_STOCK_FIELDS:
            if not _is_finite_number(s.get(k)):
                bad.append(f"{s.get('ticker')}.{k}={s.get(k)!r}")
    if bad:
        raise GuardError("NON_FINITE", f"{len(bad)} non-finite/missing numeric(s): {bad[:8]}")


def _check_monotonic(baseline, candidate):
    b = baseline.get("asOfBusinessDate")
    c = candidate.get("asOfBusinessDate")
    # Both already validated as YYYYMMDD; lexical compare == chronological compare.
    if c <= b:
        raise GuardError(
            "STALE",
            f"candidate asOfBusinessDate {c} did not advance past baseline {b} while data changed",
        )


def _coverage(doc):
    stocks = doc["stocks"]
    if not stocks:
        return {f: 0.0 for f in COVERAGE_FIELDS}
    out = {}
    for f in COVERAGE_FIELDS:
        present = sum(1 for s in stocks if _is_finite_number(s.get(f)))
        out[f] = present / len(stocks)
    return out


def _check_coverage(baseline, candidate):
    b = _coverage(baseline)
    c = _coverage(candidate)
    drops = []
    for f in COVERAGE_FIELDS:
        if b[f] - c[f] > COVERAGE_DROP_BUDGET:
            drops.append(f"{f}: {b[f]:.2f}->{c[f]:.2f}")
    if drops:
        raise GuardError(
            "COVERAGE_LOW",
            f"fundamentals coverage dropped beyond {COVERAGE_DROP_BUDGET:.0%}: {drops}",
        )
    return b, c


def _rel_pct(old, new):
    if not (_is_finite_number(old) and _is_finite_number(new)) or old == 0:
        return None
    return (new - old) / abs(old) * 100.0


def _field_summaries(baseline, candidate):
    """Per-field change summary over the shared universe + anomaly / mass-change tallies."""
    base_by = {s.get("ticker"): s for s in baseline["stocks"]}
    price_moves = []          # abs pct moves for currentPrice
    score_moves = []          # abs point moves for the 4 dimensions + composite
    anomalies = []            # implausible single-field moves (isolated corruption)
    material_price = 0        # names moving past MATERIAL_MOVE_PCT
    material_score = 0        # names with a dimension past MATERIAL_SCORE_ABS
    field_stats = {}          # field -> {"changed": n, "maxAbs": x}

    score_fields = ("momentum", "flow", "value", "volScore", "compositeScore")

    def bump(field, delta):
        st = field_stats.setdefault(field, {"changed": 0, "maxAbs": 0.0})
        if delta != 0:
            st["changed"] += 1
        st["maxAbs"] = max(st["maxAbs"], abs(delta))

    for s in candidate["stocks"]:
        b = base_by.get(s.get("ticker"))
        if b is None:
            continue
        pm = _rel_pct(b.get("currentPrice"), s.get("currentPrice"))
        if pm is not None:
            bump("currentPrice", pm)
            price_moves.append(abs(pm))
            if abs(pm) > MATERIAL_MOVE_PCT:
                material_price += 1
            if abs(pm) > ANOMALY_PRICE_PCT:
                anomalies.append(f"{s.get('ticker')} price {pm:+.1f}%")
        mc = _rel_pct(b.get("marketCap"), s.get("marketCap"))
        if mc is not None:
            bump("marketCap", mc)
        stock_material_score = False
        for f in score_fields:
            ov, nv = b.get(f), s.get(f)
            if _is_finite_number(ov) and _is_finite_number(nv):
                d = nv - ov
                bump(f, d)
                score_moves.append(abs(d))
                if abs(d) > MATERIAL_SCORE_ABS:
                    stock_material_score = True
                if abs(d) > ANOMALY_SCORE_ABS:
                    anomalies.append(f"{s.get('ticker')} {f} {d:+.1f}")
        if stock_material_score:
            material_score += 1

    shared = len(base_by)
    material_names = max(material_price, material_score)
    summary = {
        "sharedUniverse": shared,
        "fields": {
            f: {"changed": st["changed"], "maxAbs": round(st["maxAbs"], 4)}
            for f, st in sorted(field_stats.items())
        },
        "maxPriceMovePct": round(max(price_moves), 4) if price_moves else 0.0,
        "maxScoreMoveAbs": round(max(score_moves), 4) if score_moves else 0.0,
        "anomalyCount": len(anomalies),
        "anomalyBudget": ANOMALY_BUDGET,
        "anomalies": anomalies[:12],
        "materialMoveNames": material_names,
        "materialMoveFraction": round(material_names / shared, 4) if shared else 0.0,
        "massChangeBudget": MASS_CHANGE_BUDGET,
    }
    return summary


def _check_budgets(summary):
    # Isolated corruption first: a handful of physically implausible values.
    if summary["anomalyCount"] > ANOMALY_BUDGET:
        raise GuardError(
            "OUTLIER",
            f"{summary['anomalyCount']} implausible field move(s) exceed anomaly budget {ANOMALY_BUDGET}: "
            f"{summary['anomalies'][:6]}",
        )
    # Broad corruption: too much of the universe moved to be a real session.
    if summary["materialMoveFraction"] > MASS_CHANGE_BUDGET:
        raise GuardError(
            "MASS_CHANGE",
            f"{summary['materialMoveFraction']:.0%} of the universe moved materially, "
            f"beyond mass-change budget {MASS_CHANGE_BUDGET:.0%} (broad corruption, not a market day)",
        )


def evaluate(baseline, candidate, baseline_text=None, candidate_text=None, expected_count=EXPECTED_UNIVERSE):
    """Pure classifier: baseline/candidate dicts -> report dict. Never mutates inputs.

    Ordering is fail-closed: the first triggered class becomes the top-line reason,
    while the full per-field summary is always attached when it can be computed.
    """
    report = {
        "guard": "public-data-candidate-delta",
        "slice": "C",
        "metricsVersion": EXPECTED_METRICS_VERSION,
        "expectedUniverse": expected_count,
        "status": "FAIL",
        "reason": "UNKNOWN",
        "message": "",
        "summary": None,
    }
    try:
        # No-op refresh: identical bytes -> nothing to review. Do this before the
        # monotonic-date check so a clean (unchanged) working tree passes.
        if baseline_text is not None and candidate_text is not None:
            if _canonical(baseline) == _canonical(candidate):
                report.update(status="PASS", reason="NO_CHANGE",
                              message="candidate is byte-identical to committed baseline; no delta to review")
                return report

        _check_schema(baseline, "baseline", expected_count)
        _check_schema(candidate, "candidate", expected_count)
        _check_identity(baseline, candidate, expected_count)
        _check_finite(candidate)
        _check_monotonic(baseline, candidate)
        base_cov, cand_cov = _check_coverage(baseline, candidate)
        summary = _field_summaries(baseline, candidate)
        summary["coverage"] = {
            "baseline": {k: round(v, 4) for k, v in base_cov.items()},
            "candidate": {k: round(v, 4) for k, v in cand_cov.items()},
        }
        report["summary"] = summary
        _check_budgets(summary)

        report.update(status="PASS", reason="OK",
                      message="candidate passes schema, identity, monotonicity, coverage, and budget guards")
        return report
    except GuardError as exc:
        report.update(status="FAIL", reason=exc.reason, message=exc.message)
        return report
    except Exception as exc:  # fail closed on anything unforeseen
        report.update(status="FAIL", reason="UNKNOWN", message=f"unclassified comparison error: {exc}")
        return report


def run_guard(baseline_source="git", candidate_path=DEFAULT_CANDIDATE, expected_count=EXPECTED_UNIVERSE):
    """Load + classify. Load failures map to their fail-closed reason code."""
    try:
        candidate = load_candidate(candidate_path)
    except GuardError as exc:
        return {
            "guard": "public-data-candidate-delta", "slice": "C",
            "status": "FAIL", "reason": exc.reason, "message": exc.message, "summary": None,
        }
    candidate_text = None
    try:
        candidate_text = _read_text(candidate_path)
    except OSError:
        pass
    try:
        baseline, baseline_text = load_baseline(baseline_source)
    except GuardError as exc:
        return {
            "guard": "public-data-candidate-delta", "slice": "C",
            "status": "FAIL", "reason": exc.reason, "message": exc.message, "summary": None,
        }
    return evaluate(baseline, candidate, baseline_text=baseline_text,
                    candidate_text=candidate_text, expected_count=expected_count)


def render_text(report):
    lines = []
    mark = "PASS" if report["status"] == "PASS" else "FAIL"
    lines.append(f"[{mark}] public-data candidate delta guard (Slice C) - reason {report['reason']}")
    lines.append(f"  {report['message']}")
    s = report.get("summary")
    if s:
        lines.append(f"  shared universe: {s['sharedUniverse']}")
        lines.append(f"  max price move: {s['maxPriceMovePct']}%  |  max score move: {s['maxScoreMoveAbs']} pts")
        lines.append(f"  anomalies: {s['anomalyCount']}/{s['anomalyBudget']} budget  |  "
                     f"material movers: {s['materialMoveNames']} "
                     f"({s['materialMoveFraction']:.0%} of {s['massChangeBudget']:.0%} budget)")
        changed = {f: v["changed"] for f, v in s["fields"].items() if v["changed"]}
        if changed:
            lines.append(f"  changed fields: {changed}")
        if s["anomalies"]:
            lines.append(f"  anomaly detail: {s['anomalies'][:6]}")
    return "\n".join(lines)


def main(argv=None):
    p = argparse.ArgumentParser(description="ORNScore public-data candidate delta guard (Slice C)")
    p.add_argument("--baseline", default="git",
                   help="baseline source: 'git' (HEAD blob, default) or a file path")
    p.add_argument("--candidate", default=DEFAULT_CANDIDATE,
                   help="candidate stocks.json path (default: working-tree public/data/stocks.json)")
    p.add_argument("--expected-count", type=int, default=EXPECTED_UNIVERSE,
                   help=f"expected universe size (default {EXPECTED_UNIVERSE})")
    p.add_argument("--json", action="store_true", help="emit stable JSON only")
    args = p.parse_args(argv)

    report = run_guard(args.baseline, args.candidate, args.expected_count)
    if args.json:
        print(json.dumps(report, sort_keys=True, ensure_ascii=True, indent=2))
    else:
        print(render_text(report))
    return 0 if report["reason"] in PASS_REASONS else 1


if __name__ == "__main__":
    sys.exit(main())
