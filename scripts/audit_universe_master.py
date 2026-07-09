#!/usr/bin/env python3
"""Audit OrnScore's local stock universe against the KRX master listing.

This is intentionally separate from verify_metrics.py because it needs network
access through FinanceDataReader. Use it before release/data refresh work when
code-name trust is in question.
"""

import json
import os
import re
import sys

try:
    import FinanceDataReader as fdr
except ImportError:
    print("Run: python -m pip install finance-datareader")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STOCKS_PATH = os.path.join(ROOT, "public", "data", "stocks.json")
SEED_PATH = os.path.join(ROOT, "scripts", "seed_tickers.txt")
EXCLUDED_NAME_RE = re.compile(r"(우$|우B$|우선주|스팩|ETF|ETN)")


def load_stocks():
    with open(STOCKS_PATH, encoding="utf-8-sig") as f:
        return json.load(f)["stocks"]


def load_seed():
    seed = {}
    with open(SEED_PATH, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 2 and parts[0]:
                seed[parts[0]] = parts[1]
    return seed


def main():
    stocks = load_stocks()
    seed = load_seed()
    krx = fdr.StockListing("KRX")
    by_code = {str(row.Code).zfill(6): row for row in krx.itertuples(index=False)}

    missing = []
    stock_mismatches = []
    seed_mismatches = []
    excluded = []

    for s in stocks:
        ticker = str(s.get("ticker", "")).zfill(6)
        name = str(s.get("name") or "")
        row = by_code.get(ticker)
        if row is None:
            missing.append((ticker, name))
            continue
        official = str(row.Name)
        if official != name:
            stock_mismatches.append((ticker, name, official, str(row.Market), str(row.Dept)))
        if EXCLUDED_NAME_RE.search(official) or EXCLUDED_NAME_RE.search(name):
            excluded.append((ticker, name, official, str(row.Market), str(row.Dept)))

    for ticker, seed_name in seed.items():
        row = by_code.get(str(ticker).zfill(6))
        if row is not None and str(row.Name) != seed_name:
            seed_mismatches.append((ticker, seed_name, str(row.Name)))

    print(
        "stocks",
        len(stocks),
        "missing",
        len(missing),
        "mismatches",
        len(stock_mismatches),
        "excluded_name_hits",
        len(excluded),
    )
    print("seed", len(seed), "krx_name_mismatches", len(seed_mismatches))

    for label, rows in (
        ("missing", missing),
        ("stock_mismatches", stock_mismatches),
        ("seed_mismatches", seed_mismatches),
        ("excluded", excluded),
    ):
        for row in rows[:25]:
            print(f"  {label}: {row}")

    ok = not (missing or stock_mismatches or seed_mismatches or excluded)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
