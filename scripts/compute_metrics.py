# 산식 버전: Metrics v2.4 (적용일 2026-06-14) — 추세=백분위·거래활성도=거래량비·밸류=풀분위·위험조정=샤프백분위·종합=단순평균
import json, os, sys, time, math
from datetime import datetime, timedelta
try:
    import FinanceDataReader as fdr
    import pandas as pd
except ImportError:
    print("Run: python -m pip install finance-datareader")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_stocks():
    with open(os.path.join(ROOT, "public", "data", "stocks.json"), encoding="utf-8") as f:
        return json.load(f)

def fetch_historical(ticker, days=365):
    end = datetime.now(); start = end - timedelta(days=days)
    try:
        df = fdr.DataReader(ticker, start, end)
        if df is None or df.empty or "Close" not in df.columns: return None
        return df
    except Exception: return None

def load_prices(ticker, lookback=253):
    """차트와 동일한 prices/{ticker}.json을 읽어 지표 계산(수익률 소스 통일·P0-03).
       최근 lookback(≈1년) 거래일만 사용 → vol 관측기간 252+ 충족, r3m=차트 3개월 일치."""
    p = os.path.join(ROOT, "public", "data", "prices", f"{ticker}.json")
    try:
        with open(p, encoding="utf-8-sig") as fp:
            d = json.load(fp)
        pts = [x for x in d.get("points", []) if isinstance(x.get("c"), (int, float)) and x["c"] > 0]
        if len(pts) < 60:
            return None
        pts = pts[-lookback:]
        return pd.DataFrame({"Close": [x["c"] for x in pts], "Volume": [x.get("v", 0) or 0 for x in pts]})
    except Exception:
        return None

def calc_momentum(df):
    if df is None or len(df) < 130: return None
    closes = df["Close"].values; last = closes[-1]
    def ret(n):
        if len(closes) <= n: return 0
        prev = closes[-n-1]
        return (last - prev) / prev * 100 if prev > 0 else 0
    r1m, r3m, r6m, r1y = ret(21), ret(63), ret(126), ret(252)  # 설계서: 21/63/126/252 거래일
    weighted = 0.3*r1m + 0.4*r3m + 0.3*r6m  # 원시 가중수익률 (백분위 환산 전)
    return weighted, {"r1m": round(r1m,2), "r3m": round(r3m,2), "r6m": round(r6m,2), "r1y": round(r1y,2)}

def calc_vol(df):
    if df is None or len(df) < 60: return None
    closes = df["Close"].values
    rets = [(closes[i]-closes[i-1])/closes[i-1] for i in range(1,len(closes)) if closes[i-1] > 0]
    if len(rets) < 2: return None
    mean = sum(rets)/len(rets)
    std = math.sqrt(sum((r-mean)**2 for r in rets)/len(rets))
    if std == 0: return None
    ar, asd = mean*252, std*math.sqrt(252)
    sharpe = (ar - 0.035) / asd
    score = max(0, min(100, 50 + sharpe * 25))
    # 최대낙폭(peak-to-trough) · 최악의 하루
    peak = closes[0]; mdd = 0.0
    for c in closes:
        if c > peak: peak = c
        if peak > 0:
            dd = c/peak - 1
            if dd < mdd: mdd = dd
    worst = min(rets) if rets else 0
    return round(score,1), {"annualReturn": round(ar*100,2), "annualStd": round(asd*100,2), "sharpe": round(sharpe,2), "days": len(closes), "maxDrawdown": round(mdd*100,2), "worstDay": round(worst*100,2)}

def calc_flow(df):
    if df is None or len(df) < 25 or "Volume" not in df.columns: return None
    vols = df["Volume"].values
    r5, r20 = sum(vols[-5:])/5, sum(vols[-20:])/20
    if r20 == 0: return None
    ratio = r5/r20
    if ratio < 0.5: score = 10
    elif ratio < 1.0: score = 10 + (ratio-0.5)*80
    elif ratio < 3.0: score = 50 + (ratio-1.0)*25
    else: score = 100
    return round(score,1), {"recent5dAvg": int(r5), "recent20dAvg": int(r20), "ratio": round(ratio,2)}

def calc_value(stocks):
    pers = sorted([s["per"] for s in stocks if s.get("per") and s["per"] > 0])
    pbrs = sorted([s["pbr"] for s in stocks if s.get("pbr") and s["pbr"] > 0])
    if not pers or not pbrs: return {}
    scores = {}
    for s in stocks:
        per, pbr = s.get("per"), s.get("pbr")
        if not per or not pbr or per <= 0 or pbr <= 0:
            scores[s["ticker"]] = None; continue
        per_rank = sum(1 for p in pers if p < per) / len(pers)
        pbr_rank = sum(1 for p in pbrs if p < pbr) / len(pbrs)
        scores[s["ticker"]] = round(((1-per_rank)*100 + (1-pbr_rank)*100) / 2, 1)
    return scores

def safe_avg(values, default=50):
    cleaned = [v if v is not None else default for v in values]
    return round(sum(cleaned) / len(cleaned), 1)

def main():
    print("="*60)
    print("  Ornscore - Metrics v2.4 (prices/json source)")
    print("="*60)
    data = load_stocks(); stocks = data["stocks"]; n = len(stocks)
    print(f"\n[1/4] Loaded: {n} stocks")
    print("\n[2/4] VALUE scores...")
    value_scores = calc_value(stocks)
    print(f"      OK value: {sum(1 for v in value_scores.values() if v is not None)}/{n}")
    print(f"\n[3/4] Loading prices (local prices/json, 차트와 동일 소스)...")
    historical = {}
    for i, item in enumerate(stocks):
        df = load_prices(item["ticker"])
        if df is not None: historical[item["ticker"]] = df
        if (i+1) % 25 == 0: print(f"      {i+1}/{n}")
    print(f"      OK prices: {len(historical)}/{n}")
    print("\n[4/4] Computing all 4 metrics + composite...")
    m_ok = vol_ok = f_ok = 0
    for item in stocks:
        df = historical.get(item["ticker"])
        mr = calc_momentum(df)
        item["_mraw"] = mr[0] if mr else None
        item["returns"] = mr[1] if mr else {}
        if mr: m_ok += 1
        vr = calc_vol(df)
        item["volScore"] = vr[0] if vr else 50
        item["volStats"] = vr[1] if vr else {}
        item["_vraw"] = vr[1].get("sharpe") if vr else None
        if vr: vol_ok += 1
        fr = calc_flow(df)
        item["flow"] = fr[0] if fr else 50
        item["flowStats"] = fr[1] if fr else {}
        if fr: f_ok += 1
        v_val = value_scores.get(item["ticker"])
        item["value"] = v_val  # 계산 불가 시 None 유지(아래에서 재가중)

    # 추세: 원시 가중수익률 → 전체 유니버스 백분위(0~100). 고정 매핑의 고점 포화 방지.
    mraws = sorted(it["_mraw"] for it in stocks if it.get("_mraw") is not None)
    for item in stocks:
        mraw = item.pop("_mraw", None)
        if mraw is None or not mraws:
            item["momentum"] = 50.0
        else:
            below = sum(1 for v in mraws if v < mraw)
            item["momentum"] = round(below / len(mraws) * 100, 1)

    # 위험조정: 원시 샤프값 → 전체 유니버스 백분위(0~100). 선형 매핑의 100점 포화 방지 (설계서 8.4).
    vraws = sorted(it["_vraw"] for it in stocks if it.get("_vraw") is not None)
    for item in stocks:
        vraw = item.pop("_vraw", None)
        if vraw is None or not vraws:
            item["volScore"] = 50.0
        else:
            below = sum(1 for v in vraws if v < vraw)
            item["volScore"] = round(below / len(vraws) * 100, 1)

    # 밸류 계산 불가(적자·결측): 50 중립 대신 가용 지표(추세·거래·위험대비) 평균으로 재가중.
    #   적자기업이 중립 50을 받아 유리해지는 문제 방지. valueNA 플래그로 표시.
    for item in stocks:
        if item.get("value") is None:
            avail = [item["momentum"], item["flow"], item["volScore"]]
            item["value"] = round(sum(avail) / len(avail), 1)
            item["valueNA"] = True
        else:
            item["valueNA"] = False

    # 종합: 네 지표 단순 평균 (momentum 백분위·value 재가중 확정 후 계산)
    for item in stocks:
        item["compositeScore"] = safe_avg([item["momentum"], item["flow"], item["value"], item["volScore"]])

    print(f"      momentum: {m_ok}/{n}")
    print(f"      vol:      {vol_ok}/{n}")
    print(f"      flow:     {f_ok}/{n}")

    data["stocks"] = stocks
    data["generatedAt"] = datetime.now().isoformat()
    data["metricsVersion"] = "2.4"
    out = os.path.join(ROOT, "public", "data", "stocks.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n  Saved: {out}  ({os.path.getsize(out)/1024:.1f} KB)")

    print("\n=== Top 5 by COMPOSITE (most balanced) ===")
    for it in sorted(stocks, key=lambda x: x.get("compositeScore",0), reverse=True)[:5]:
        print(f"  {it['ticker']} {it['name'][:10]:12s} comp={it['compositeScore']:>5.1f}  M{it['momentum']:>5.1f} F{it['flow']:>5.1f} V{it['value']:>5.1f} Vol{it['volScore']:>5.1f}")

    print("\n=== Top 5 by VALUE (most undervalued) ===")
    for it in sorted([s for s in stocks if isinstance(s.get('value'),(int,float))], key=lambda x: x["value"], reverse=True)[:5]:
        per = f"{it.get('per',0):.1f}" if it.get('per') else "-"
        pbr = f"{it.get('pbr',0):.2f}" if it.get('pbr') else "-"
        print(f"  {it['ticker']} {it['name'][:10]:12s} VALUE={it['value']:>5.1f}  PER={per:>6s}  PBR={pbr:>5s}")

    print("\n=== Top 5 by MOMENTUM ===")
    for it in sorted([s for s in stocks if s.get("returns")], key=lambda x: x["momentum"], reverse=True)[:5]:
        r = it.get("returns", {})
        print(f"  {it['ticker']} {it['name'][:10]:12s} MOM={it['momentum']:>5.1f}  1M={r.get('r1m',0):+6.1f}%  3M={r.get('r3m',0):+6.1f}%  6M={r.get('r6m',0):+6.1f}%")

if __name__ == "__main__":
    main()
