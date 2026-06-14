# -*- coding: utf-8 -*-
"""
fetch_prices.py
- 138개 종목의 최근 1년 일별 가격 데이터를 수집해
  public/data/prices/{ticker}.json 으로 저장한다.
- 종목 페이지에서 가격 차트를 그리기 위한 데이터 소스.

Usage:
    python -m pip install finance-datareader pandas
    python scripts/fetch_prices.py
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta

try:
    import FinanceDataReader as fdr
    import pandas as pd
except ImportError:
    print("Run: python -m pip install finance-datareader pandas")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_tickers():
    """public/data/stocks.json에서 종목 목록 추출"""
    stocks_path = os.path.join(ROOT, "public", "data", "stocks.json")
    if not os.path.exists(stocks_path):
        print(f"[X] stocks.json not found: {stocks_path}")
        print("    -> Run fetch_stock_data.py first")
        sys.exit(1)
    with open(stocks_path, encoding="utf-8-sig") as f:
        data = json.load(f)
    return [s["ticker"] for s in data.get("stocks", [])]


def fetch_one(ticker: str, start: str, end: str):
    """FinanceDataReader로 일별 OHLCV 가져오기"""
    try:
        df = fdr.DataReader(ticker, start, end)
        if df is None or df.empty:
            return None
        # 컬럼 정리
        df = df[["Close", "Volume"]].copy()
        df = df.dropna(subset=["Close"])
        if df.empty:
            return None
        # 날짜 + 종가 + 거래량
        points = []
        for idx, row in df.iterrows():
            d = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)[:10]
            close = float(row["Close"])
            volume = int(row["Volume"]) if pd.notna(row["Volume"]) else 0
            if close <= 0:
                continue
            points.append({"d": d, "c": close, "v": volume})
        return points
    except Exception as e:
        print(f"    [!] {ticker}: {e}")
        return None


def main():
    print("=" * 60)
    print("  Ornscore - Price History Fetcher")
    print("=" * 60)

    tickers = load_tickers()
    print(f"\n[1/3] Loaded {len(tickers)} tickers from stocks.json")

    out_dir = os.path.join(ROOT, "public", "data", "prices")
    os.makedirs(out_dir, exist_ok=True)
    print(f"[2/3] Output dir: {out_dir}")

    # 5년 + 여유 (백테스트용). 차트는 최근 구간만 사용.
    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=365 * 5 + 40)
    start_str = start_dt.strftime("%Y-%m-%d")
    end_str = end_dt.strftime("%Y-%m-%d")
    print(f"      Range: {start_str} ~ {end_str}")

    print(f"\n[3/3] Fetching ~{len(tickers)} stocks (이거 시간 좀 걸려)...")
    n = len(tickers)
    success = 0
    fail = 0
    skipped = 0
    total_size = 0

    for i, ticker in enumerate(tickers):
        out_path = os.path.join(out_dir, f"{ticker}.json")
        # 이미 오늘 받은 거면 스킵 (재실행 효율)
        # (실제로는 매일 새로 받는 게 안전 — 주석 해제 옵션)
        # if os.path.exists(out_path):
        #     mt = datetime.fromtimestamp(os.path.getmtime(out_path))
        #     if mt.date() == datetime.now().date():
        #         skipped += 1
        #         continue

        points = fetch_one(ticker, start_str, end_str)
        if points is None or len(points) < 5:
            fail += 1
            if (i + 1) % 20 == 0:
                print(f"      {i+1}/{n}  OK={success} FAIL={fail}")
            time.sleep(0.2)
            continue

        payload = {
            "ticker": ticker,
            "generatedAt": datetime.now().isoformat(),
            "count": len(points),
            "from": points[0]["d"],
            "to": points[-1]["d"],
            "points": points,  # [{d, c, v}, ...]
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False)
        total_size += os.path.getsize(out_path)
        success += 1

        if (i + 1) % 20 == 0:
            print(f"      {i+1}/{n}  OK={success} FAIL={fail}  ({total_size/1024:.0f}KB total)")
        time.sleep(0.15)

    print("\n" + "=" * 60)
    print(f"  Done. OK={success}  FAIL={fail}  SKIPPED={skipped}")
    print(f"  Total size: {total_size/1024/1024:.2f} MB")
    print(f"  Avg per stock: {total_size/max(success,1)/1024:.1f} KB")
    print("=" * 60)


if __name__ == "__main__":
    main()
