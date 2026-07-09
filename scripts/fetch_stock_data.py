import re, json, os, sys, time
from datetime import datetime
try:
    import FinanceDataReader as fdr
    import yfinance as yf
    import pandas as pd
    import requests
except ImportError:
    print("Run: python -m pip install finance-datareader yfinance requests")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
FORBIDDEN_UNIVERSE_TICKERS = {
    "145995": "삼양사우 우선주로 확인된 코드입니다. 삼양홀딩스 보통주는 000070을 사용하세요.",
}
EXCLUDED_NAME_RE = re.compile(r"(우$|우B$|우선주|스팩|ETF|ETN)")

def universe_exclusion_reason(ticker, name):
    if ticker in FORBIDDEN_UNIVERSE_TICKERS:
        return FORBIDDEN_UNIVERSE_TICKERS[ticker]
    if EXCLUDED_NAME_RE.search(name or ""):
        return "우선주/스팩/ETF/ETN 의심 종목은 별도 배지·규칙 전까지 기본 분석 유니버스에서 제외합니다."
    return None

def extract_tickers():
    seed_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_tickers.txt")
    seen = {}
    if not os.path.exists(seed_path):
        print(f"[X] seed_tickers.txt not found: {seed_path}")
        sys.exit(1)
    with open(seed_path, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line: continue
            parts = line.split("|")
            if len(parts) < 3: continue
            t, n, ts = parts[0].strip(), parts[1].strip(), parts[2].strip()
            themes = [x.strip() for x in ts.split(",") if x.strip()]
            if t not in seen:
                seen[t] = {"name": n, "themes": themes}
    return seen

def naver_get(html, label):
    pat = re.compile(rf'<strong>{re.escape(label)}[^<]*</strong></th>.*?<td[^>]*>\s*([\d.,\-]+|N/A)\s*</td>', re.DOTALL)
    m = pat.search(html)
    if not m: return None
    v = m.group(1).strip()
    if v == "N/A": return None
    try: return float(v.replace(",", ""))
    except: return None

def fetch_naver(ticker):
    try:
        r = requests.get(f"https://finance.naver.com/item/main.naver?code={ticker}", headers=UA, timeout=10)
        h = r.text
        return {"per": naver_get(h,"PER"), "pbr": naver_get(h,"PBR"), "roe": naver_get(h,"ROE"),
                "eps": naver_get(h,"EPS"), "bps": naver_get(h,"BPS")}
    except:
        return {"per": None, "pbr": None, "roe": None, "eps": None, "bps": None}

def main():
    print("="*60)
    print("  Ornscore - Phase 1.2 v3 (167 tickers from SEED file)")
    print("="*60)
    tk_dict = extract_tickers()
    print(f"\n[1/4] Tickers from SEED: {len(tk_dict)}")
    if not tk_dict: sys.exit(1)

    print("\n[2/4] FDR KRX listing...")
    krx = fdr.StockListing("KRX")
    print(f"      OK {len(krx)} listed")

    print("\n[3/4] Base data from FDR...")
    krx_map = {str(row.get("Code","")).zfill(6): row for _, row in krx.iterrows()}
    result, missing, name_mismatches, excluded = [], [], [], []
    for tk, info in tk_dict.items():
        row = krx_map.get(tk)
        if row is None:
            missing.append(f"{tk} ({info['name']})"); continue
        def g(k, d=None):
            v = row.get(k)
            return v if pd.notna(v) else d
        official_name = str(g("Name", info["name"]) or info["name"]).strip()
        seed_name = str(info["name"]).strip()
        if official_name and seed_name and official_name != seed_name:
            name_mismatches.append(f"{tk}: seed={seed_name} / KRX={official_name}")
        reason = universe_exclusion_reason(tk, official_name)
        if reason:
            excluded.append(f"{tk} {official_name}: {reason}")
            continue
        close = g("Close", 0)
        market = str(g("Market", "KOSPI")).upper()
        result.append({
            "ticker": tk, "name": official_name or seed_name, "themes": info["themes"], "market": market,
            "currentPrice": int(close) if close else 0,
            "changePct": float(g("ChagesRatio", 0) or g("Changes", 0) or 0),
            "volume": int(g("Volume", 0) or 0),
            "marketCap": int(g("Marcap", 0) or 0) or None,
        })
    print(f"      OK base: {len(result)} / missing {len(missing)}")
    if name_mismatches:
        print("      KRX name corrections:")
        for m in name_mismatches[:10]: print(f"        - {m}")
    if excluded:
        print("      [X] universe exclusion violations:")
        for e in excluded[:20]: print(f"        - {e}")
        sys.exit(1)
    if missing[:3]:
        for m in missing[:3]: print(f"        - {m}")

    n = len(result)
    est = int(n*0.6)
    print(f"\n[4/4] Naver crawl + yfinance (~{est}s)...")
    naver_ok = yf_ok = 0
    for i, item in enumerate(result):
        nav = fetch_naver(item["ticker"])
        item.update(nav)
        if nav.get("per"): naver_ok += 1
        suffix = ".KS" if item["market"] in ("KOSPI","KS") else ".KQ"
        try:
            yi = yf.Ticker(item["ticker"] + suffix).info
            d = yi.get("dividendYield")
            item["dividendYield"] = round(float(d), 2) if d else 0
            b = yi.get("beta")
            item["beta"] = round(float(b), 2) if b else None
            p = yi.get("pegRatio")
            item["peg"] = round(float(p), 2) if p else None
            yf_ok += 1
        except Exception:
            item["dividendYield"] = 0
            item["beta"] = None
            item["peg"] = None
        if (i+1) % 20 == 0:
            print(f"      {i+1}/{n} (naver={naver_ok}, yf={yf_ok})")
        time.sleep(0.3)
    print(f"      OK naver: {naver_ok}/{n}, yfinance: {yf_ok}/{n}")

    out_dir = os.path.join(ROOT, "public", "data")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, "stocks.json")
    payload = {
        "generatedAt": datetime.now().isoformat(),
        "source": "FDR + Naver + yfinance",
        "count": len(result),
        "stocks": result,
    }
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"\n  Saved: {out}")
    print(f"  Size:  {os.path.getsize(out)/1024:.1f} KB")
    print(f"\n  PER: {sum(1 for it in result if it.get('per'))}/{n}")
    print(f"  PBR: {sum(1 for it in result if it.get('pbr'))}/{n}")
    print(f"  ROE: {sum(1 for it in result if it.get('roe'))}/{n}")
    print("\n--- Preview (10 stocks) ---")
    for it in result[:10]:
        per = f"{it['per']:.2f}" if it.get('per') else "-"
        pbr = f"{it['pbr']:.2f}" if it.get('pbr') else "-"
        roe = f"{it['roe']:.2f}" if it.get('roe') else "-"
        print(f"  {it['ticker']} {it['name'][:10]:12s} {it['currentPrice']:>9,}KRW  PER {per:>7s}  PBR {pbr:>6s}  ROE {roe:>6s}")

if __name__ == "__main__":
    main()
