#!/usr/bin/env python3
# Focused self-tests for the Slice C public-data candidate delta guard.
#
# Each case drives the guard against a committed fixture (outside public/data) and
# asserts the intended stable reason code, proving the guard distinguishes a normal
# refresh, a no-op, and each corruption family from one another. It also proves the
# guard fails closed on an unreadable baseline and never mutates its inputs.
#
# Usage:  python scripts/test_public_data_delta.py     (exit 0 = all pass)
import copy
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import verify_public_data_delta as guard  # noqa: E402

FIX = os.path.join(HERE, "fixtures", "public_data_delta")
BASELINE = os.path.join(FIX, "baseline.json")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def run_case(candidate_name):
    """Run the guard: fixture baseline vs a named candidate fixture."""
    return guard.run_guard(
        baseline_source=BASELINE,
        candidate_path=os.path.join(FIX, candidate_name),
        expected_count=guard.EXPECTED_UNIVERSE,
    )


def expect(candidate_name, reason, status):
    r = run_case(candidate_name)
    check(r["reason"] == reason, f"{candidate_name}: reason {r['reason']!r} != {reason!r} ({r['message']})")
    check(r["status"] == status, f"{candidate_name}: status {r['status']!r} != {status!r}")
    return r


# ---- Fixture matrix: each family -> its intended reason code -----------------
expect("candidate_valid.json", "OK", "PASS")
expect("candidate_stale.json", "STALE", "FAIL")
expect("candidate_missing.json", "MISSING", "FAIL")
expect("candidate_malformed.json", "SCHEMA_INVALID", "FAIL")
expect("candidate_identity_drift.json", "IDENTITY_DRIFT", "FAIL")
expect("candidate_nonfinite.json", "NON_FINITE", "FAIL")
expect("candidate_outlier.json", "OUTLIER", "FAIL")
expect("candidate_mass_change.json", "MASS_CHANGE", "FAIL")
expect("candidate_coverage.json", "COVERAGE_LOW", "FAIL")

# ---- Absent path (not just empty file) is MISSING ---------------------------
r = guard.run_guard(baseline_source=BASELINE,
                    candidate_path=os.path.join(FIX, "does_not_exist.json"))
check(r["reason"] == "MISSING", f"absent candidate: {r['reason']!r} != 'MISSING'")

# ---- No-change short circuit: baseline vs itself is NO_CHANGE / PASS ---------
r = guard.run_guard(baseline_source=BASELINE, candidate_path=BASELINE)
check(r["reason"] == "NO_CHANGE" and r["status"] == "PASS",
      f"identical candidate: expected NO_CHANGE/PASS, got {r['reason']}/{r['status']}")

# ---- Fail closed on an unreadable/unparseable baseline (UNKNOWN) -------------
with tempfile.TemporaryDirectory() as td:
    bad_baseline = os.path.join(td, "bad_baseline.json")
    with open(bad_baseline, "w", encoding="utf-8") as f:
        f.write("{ not json")
    r = guard.run_guard(baseline_source=bad_baseline,
                        candidate_path=os.path.join(FIX, "candidate_valid.json"))
    check(r["reason"] == "UNKNOWN" and r["status"] == "FAIL",
          f"malformed baseline: expected UNKNOWN/FAIL, got {r['reason']}/{r['status']}")

    absent_baseline = os.path.join(td, "nope.json")
    r = guard.run_guard(baseline_source=absent_baseline,
                        candidate_path=os.path.join(FIX, "candidate_valid.json"))
    check(r["reason"] == "UNKNOWN", f"absent baseline: {r['reason']!r} != 'UNKNOWN'")

# ---- Wrong universe size (count != expected) is IDENTITY_DRIFT ---------------
with open(BASELINE, encoding="utf-8-sig") as f:
    base_doc = json.load(f)
short = copy.deepcopy(base_doc)
short["stocks"] = short["stocks"][:-1]
short["asOfBusinessDate"] = "20260716"
r = guard.evaluate(base_doc, short, baseline_text="x", candidate_text="y")
check(r["reason"] == "IDENTITY_DRIFT", f"short universe: {r['reason']!r} != 'IDENTITY_DRIFT'")

# ---- Metrics version drift is SCHEMA_INVALID (frozen Metrics 2.4) ------------
wrongver = copy.deepcopy(base_doc)
wrongver["metricsVersion"] = "2.5"
wrongver["asOfBusinessDate"] = "20260716"
r = guard.evaluate(base_doc, wrongver, baseline_text="x", candidate_text="y")
check(r["reason"] == "SCHEMA_INVALID", f"metrics drift: {r['reason']!r} != 'SCHEMA_INVALID'")

# ---- Determinism + purity: identical inputs -> identical JSON, inputs intact -
b1 = copy.deepcopy(base_doc)
c1 = json.load(open(os.path.join(FIX, "candidate_valid.json"), encoding="utf-8-sig"))
b_before, c_before = guard._canonical(b1), guard._canonical(c1)
r_a = guard.evaluate(copy.deepcopy(b1), copy.deepcopy(c1), baseline_text="x", candidate_text="y")
r_b = guard.evaluate(copy.deepcopy(b1), copy.deepcopy(c1), baseline_text="x", candidate_text="y")
check(json.dumps(r_a, sort_keys=True) == json.dumps(r_b, sort_keys=True), "evaluate() not deterministic")
check(guard._canonical(b1) == b_before and guard._canonical(c1) == c_before, "evaluate() mutated its inputs")

# ---- Report shape / stability: no timestamps, JSON-serializable -------------
r = run_case("candidate_valid.json")
txt = json.dumps(r, sort_keys=True, ensure_ascii=True)
check("summary" in r and r["summary"] is not None, "valid report missing summary")
check(r["summary"]["anomalyCount"] == 0, "valid candidate unexpectedly has anomalies")
check(r["summary"]["materialMoveNames"] == 0, "valid candidate should have no material movers (moves within limit)")
check(r["summary"]["fields"].get("currentPrice", {}).get("changed", 0) == 5,
      "valid candidate should show exactly 5 changed prices in the field summary")
for banned in ("2026-07-1", "T00:00:00", tempfile.gettempdir().replace(os.sep, "/")):
    check(banned not in txt, f"report leaked non-stable token {banned!r}")

# ---- Operator text renders for pass and fail without raising ----------------
for name in ("candidate_valid.json", "candidate_mass_change.json", "candidate_missing.json"):
    try:
        line = guard.render_text(run_case(name))
        check(line.startswith("[PASS]") or line.startswith("[FAIL]"), f"{name}: bad text header")
    except Exception as exc:  # noqa: BLE001
        failures.append(f"render_text raised on {name}: {exc}")

# ---- public/data must never be written by any of the above ------------------
diff = subprocess.run(["git", "diff", "--", "public/data"], cwd=ROOT,
                      capture_output=True, text=True).stdout
check(diff.strip() == "", "guard/tests dirtied public/data")

# ---- CLI exit codes: PASS -> 0, FAIL -> 1 -----------------------------------
def cli(candidate_name, expect_code):
    proc = subprocess.run(
        [sys.executable, os.path.join(HERE, "verify_public_data_delta.py"),
         "--baseline", BASELINE, "--candidate", os.path.join(FIX, candidate_name), "--json"],
        cwd=ROOT, capture_output=True, text=True,
    )
    check(proc.returncode == expect_code,
          f"CLI {candidate_name}: exit {proc.returncode} != {expect_code}")
    try:
        json.loads(proc.stdout)
    except (ValueError, json.JSONDecodeError):
        failures.append(f"CLI {candidate_name}: --json did not emit valid JSON")


cli("candidate_valid.json", 0)
cli("candidate_stale.json", 1)
cli("candidate_mass_change.json", 1)

total = 9 + 2 + 2 + 2 + 6 + 3 + 1 + 6  # informal count of assertions above
print(f"public-data delta guard tests: {len(failures)} failure(s)")
for f in failures:
    print("  FAIL:", f)
if not failures:
    print("  OK: all fixture reason codes, fail-closed, purity, and CLI checks passed")
sys.exit(1 if failures else 0)
