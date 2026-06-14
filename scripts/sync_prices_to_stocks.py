# -*- coding: utf-8 -*-
"""
sync_prices_to_stocks.py
- public/data/prices/{ticker}.json의 마지막 종가 + 어제 종가로
  public/data/stocks.json의 currentPrice / changePct / asOfBusinessDate를 업데이트한다.
- 이걸 돌리면 사이트의 모든 종목 가격이 가격 차트와 일치한다.

순서:
    1. python scripts/fetch_prices.py  (가격 데이터 받기)
    2. python scripts/sync_prices_to_stocks.py  (stocks.json 동기화)
    3. git add -A && git commit -m "..." && git push
"""

import os
import json
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STOCKS_PATH = os.path.join(ROOT, "public", "data", "stocks.json")
PRICES_DIR = os.path.join(ROOT, "public", "data", "prices")


def main():
    print("=" * 60)
    print("  Ornscore - Sync prices to stocks.json")
    print("=" * 60)

    if not os.path.exists(STOCKS_PATH):
        print(f"[X] stocks.json not found: {STOCKS_PATH}")
        return
    if not os.path.exists(PRICES_DIR):
        print(f"[X] prices dir not found: {PRICES_DIR}")
        return

    with open(STOCKS_PATH, encoding="utf-8-sig") as f:
        data = json.load(f)

    stocks = data.get("stocks", [])
    print(f"\n[1/3] Loaded {len(stocks)} stocks")

    updated = 0
    missing = 0
    latest_date = None  # 모든 종목 중 가장 최근 영업일 (대표 기준일)

    for s in stocks:
        ticker = s.get("ticker")
        price_file = os.path.join(PRICES_DIR, f"{ticker}.json")
        if not os.path.exists(price_file):
            missing += 1
            continue

        try:
            with open(price_file, encoding="utf-8-sig") as pf:
                pdata = json.load(pf)
            points = pdata.get("points", [])
            if len(points) < 2:
                missing += 1
                continue

            last = points[-1]
            prev = points[-2]
            last_c = float(last.get("c", 0))
            prev_c = float(prev.get("c", 0))
            last_d = last.get("d")

            if last_c <= 0 or prev_c <= 0:
                missing += 1
                continue

            change_pct = (last_c - prev_c) / prev_c * 100

            s["currentPrice"] = int(round(last_c))
            s["changePct"] = round(change_pct, 2)
            updated += 1

            # 가장 최근 날짜 추적 (대부분 모든 종목이 같은 영업일)
            if last_d:
                if latest_date is None or last_d > latest_date:
                    latest_date = last_d

        except Exception as e:
            print(f"    [!] {ticker}: {e}")
            missing += 1

    print(f"\n[2/3] Sync: updated={updated} missing={missing}")

    # asOfBusinessDate를 YYYYMMDD 형태로 저장
    if latest_date:
        # latest_date: "2026-06-11" → "20260611"
        as_of = latest_date.replace("-", "")
        data["asOfBusinessDate"] = as_of
        data["pricesSyncedAt"] = datetime.now().isoformat()
        print(f"      asOfBusinessDate = {as_of}  (from latest chart point)")
    else:
        print("      [!] No latest_date found — asOfBusinessDate not set")

    with open(STOCKS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n[3/3] Saved: {STOCKS_PATH}")
    print(f"      Size: {os.path.getsize(STOCKS_PATH)/1024:.1f} KB")
    print("=" * 60)
    print("  Done. Now: git commit && git push")
    print("=" * 60)


if __name__ == "__main__":
    main()
