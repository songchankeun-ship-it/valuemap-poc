#!/usr/bin/env python3
# Deterministic fixture generator for the Slice C public-data candidate delta guard.
#
# These fixtures live OUTSIDE public/data by design: the guard is exercised against
# them so its reason codes are proven without ever touching the 138-stock public
# output. Regenerate with:  python scripts/fixtures/public_data_delta/build_fixtures.py
#
# Everything is derived from the stock index (no randomness, no wall-clock), so the
# committed fixture files are byte-stable across machines and reruns.
import copy
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
N = 138  # mirrors the frozen public universe size the guard enforces

BASE_DATE = "20260715"
NEXT_DATE = "20260716"


def build_stock(i):
    price = 10000 + i * 10
    momentum = float(i % 100)
    flow = float((i * 7) % 100)
    value = float((i * 13) % 100)
    vol = float((i * 3) % 100)
    composite = round((momentum + flow + value + vol) / 4, 1)
    s = {
        "ticker": f"{100000 + i:06d}",
        "name": f"Stock{i:03d}",
        "market": "KOSPI" if i % 2 == 0 else "KOSDAQ",
        "themes": ["ThemeA", "ThemeB"] if i % 3 == 0 else ["ThemeA"],
        "currentPrice": price,
        "changePct": 0.0,
        "marketCap": price * 1_000_000,
        "momentum": momentum,
        "flow": flow,
        "value": value,
        "volScore": vol,
        "compositeScore": composite,
        # Fundamentals: a deterministic minority are null so baseline coverage < 100%,
        # leaving room to test a coverage DROP without starting at the ceiling.
        "per": None if i % 20 == 0 else round(5.0 + (i % 30), 2),
        "pbr": None if i % 25 == 0 else round(0.5 + (i % 10) * 0.3, 2),
        "roe": round(1.0 + (i % 15), 2),
        "eps": round(100.0 + i, 2),
        "bps": round(1000.0 + i * 5, 2),
    }
    return s


def build_baseline():
    stocks = [build_stock(i) for i in range(N)]
    return {
        "generatedAt": "2026-07-15T00:00:00",
        "source": "fixture",
        "count": N,
        "stocks": stocks,
        "metricsVersion": "2.4",
        "asOfBusinessDate": BASE_DATE,
    }


def advance(doc):
    d = copy.deepcopy(doc)
    d["generatedAt"] = "2026-07-16T00:00:00"
    d["asOfBusinessDate"] = NEXT_DATE
    return d


def _reprice(stock, pct):
    old = stock["currentPrice"]
    new = round(old * (1 + pct / 100.0))
    stock["currentPrice"] = new
    stock["marketCap"] = new * 1_000_000
    stock["changePct"] = round(pct, 2)


def candidate_valid(base):
    # A normal session: a few names move within the daily limit.
    d = advance(base)
    for i in (0, 1, 2, 3, 4):
        _reprice(d["stocks"][i], 5.0 + i)  # 5..9%
    return d


def candidate_stale(base):
    # Same content churn as valid, but the business date never advanced.
    d = candidate_valid(base)
    d["asOfBusinessDate"] = BASE_DATE
    d["generatedAt"] = "2026-07-15T23:59:00"
    return d


def candidate_identity_drift(base):
    # Universe size preserved (138) but one ticker is swapped out.
    d = advance(base)
    d["stocks"][-1]["ticker"] = "999999"
    return d


def candidate_nonfinite(base):
    # One price becomes NaN (parses via allow_nan) -> non-finite corruption.
    d = advance(base)
    d["stocks"][10]["currentPrice"] = math.nan
    return d


def candidate_outlier(base):
    # A handful of physically implausible single-session moves (> daily limit).
    d = advance(base)
    for i in (5, 6, 7, 8, 9):
        _reprice(d["stocks"][i], 80.0)  # impossible in one KRX session
    return d


def candidate_mass_change(base):
    # Broad within-limit shift across most of the universe -> rescale corruption.
    d = advance(base)
    for i in range(95):
        _reprice(d["stocks"][i], 25.0)  # under the anomaly threshold, but everywhere
    return d


def candidate_coverage(base):
    # Fundamentals collapse for a large slice -> degraded source.
    d = advance(base)
    for i in range(40):
        d["stocks"][i]["per"] = None
        d["stocks"][i]["pbr"] = None
    return d


def dump(name, obj, *, allow_nan=False):
    path = os.path.join(HERE, name)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=True, indent=2, allow_nan=allow_nan)
        f.write("\n")
    return path


def main():
    base = build_baseline()
    dump("baseline.json", base)
    dump("candidate_valid.json", candidate_valid(base))
    dump("candidate_stale.json", candidate_stale(base))
    dump("candidate_identity_drift.json", candidate_identity_drift(base))
    dump("candidate_nonfinite.json", candidate_nonfinite(base), allow_nan=True)
    dump("candidate_outlier.json", candidate_outlier(base))
    dump("candidate_mass_change.json", candidate_mass_change(base))
    dump("candidate_coverage.json", candidate_coverage(base))
    # MISSING case: an empty file (absent-path is exercised directly in the tests).
    with open(os.path.join(HERE, "candidate_missing.json"), "w", encoding="utf-8", newline="\n") as f:
        f.write("")
    # MALFORMED case: truncated, non-JSON text.
    with open(os.path.join(HERE, "candidate_malformed.json"), "w", encoding="utf-8", newline="\n") as f:
        f.write('{ "generatedAt": "2026-07-16T00:00:00", "stocks": [ { "ticker": "100000"\n')
    print(f"wrote fixtures to {HERE}")


if __name__ == "__main__":
    main()
