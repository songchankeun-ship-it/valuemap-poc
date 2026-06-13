# -*- coding: utf-8 -*-
"""
fetch_insider_details.py — 임원·주요주주 '소유상황보고서'의 실제 방향·규모 수집

핵심: DART OpenAPI의 구조화 엔드포인트 elestock.json('임원ㆍ주요주주 소유보고')은
  증감수량(sp_stock_lmp_irds_cnt)을 제공한다.
  → 양수면 '취득(매수 가능)', 음수면 '처분(매도)'.
  본문 XML을 직접 파싱하지 않고도 방향·규모를 정확히 알 수 있다.

출력: public/data/insider-signals.json
  { "005930": [ {rcept_no, repror, ofcps, registered, mainHolder,
                 direction, changeCnt, ownCnt, rate, date} ... ] }

사용법:
    set DART_API_KEY=발급키   (또는 .env / .env.local 에 DART_API_KEY=)
    python scripts/fetch_insider_details.py

⚠️ 운영 키로 실제 호출해 검증하세요. DART 필드명이 바뀌면 FIELD 매핑만 조정하면 됩니다.
"""
from __future__ import annotations
import os, sys, json, time, io, zipfile, urllib.request, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "insider-signals.json")
CORP_CACHE = os.path.join(ROOT, "public", "data", "corp_code_map.json")


def load_key() -> str:
    k = os.environ.get("DART_API_KEY")
    if k:
        return k.strip()
    for fn in (".env", ".env.local"):
        p = os.path.join(ROOT, fn)
        if os.path.exists(p):
            for line in open(p, encoding="utf-8"):
                if line.startswith("DART_API_KEY"):
                    return line.split("=", 1)[1].strip().strip('"')
    print("[X] DART_API_KEY 없음 (환경변수 또는 .env)")
    sys.exit(1)


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "valuemap/insider"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def build_corp_map(key: str) -> dict:
    """ticker(6자리) -> corp_code(8자리). DART corpCode.xml 1회 다운로드 후 캐시."""
    if os.path.exists(CORP_CACHE):
        return json.load(open(CORP_CACHE, encoding="utf-8"))
    print("[*] corpCode.xml 다운로드 중...")
    raw = get(f"https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key={key}")
    zf = zipfile.ZipFile(io.BytesIO(raw))
    xml = zf.read(zf.namelist()[0])
    root = ET.fromstring(xml)
    m = {}
    for el in root.iter("list"):
        sc = (el.findtext("stock_code") or "").strip()
        cc = (el.findtext("corp_code") or "").strip()
        if sc and cc:
            m[sc] = cc
    json.dump(m, open(CORP_CACHE, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"    상장사 {len(m)}개 매핑 캐시")
    return m


def to_int(x) -> int:
    try:
        return int(str(x).replace(",", "").replace("-", "-").strip() or 0)
    except Exception:
        return 0


def fetch_one(key: str, corp_code: str):
    url = (f"https://opendart.fss.or.kr/api/elestock.json"
           f"?crtfc_key={key}&corp_code={corp_code}")
    try:
        data = json.loads(get(url))
    except Exception as e:
        return []
    if data.get("status") != "000":
        return []
    out = []
    for it in data.get("list", []):
        chg = to_int(it.get("sp_stock_lmp_irds_cnt"))   # 특정증권등 증감수
        direction = "긍정 가능" if chg > 0 else "부정 가능" if chg < 0 else "확인 필요"
        out.append({
            "rcept_no": it.get("rcept_no"),
            "repror": it.get("repror"),                  # 보고자
            "ofcps": it.get("isu_exctv_ofcps"),          # 직위
            "registered": it.get("isu_exctv_rgist_at"),  # 등기임원 여부
            "mainHolder": it.get("isu_main_shrholdr"),   # 주요주주 여부
            "direction": direction,
            "changeCnt": chg,                            # 증감 수량(+매수/-매도)
            "ownCnt": to_int(it.get("sp_stock_lmp_cnt")),# 보유 수량
            "rate": it.get("sp_stock_lmp_rate"),         # 보유 비율
            "date": it.get("rcept_dt") or it.get("report_tp"),
        })
    return out


def main():
    key = load_key()
    stocks = json.load(open(os.path.join(ROOT, "public", "data", "stocks.json"), encoding="utf-8-sig"))
    tickers = [s["ticker"] for s in stocks.get("stocks", [])]
    corp_map = build_corp_map(key)

    result = {}
    ok = miss = 0
    for i, tk in enumerate(tickers):
        cc = corp_map.get(tk)
        if not cc:
            miss += 1
            continue
        rows = fetch_one(key, cc)
        if rows:
            result[tk] = rows
            ok += 1
        if (i + 1) % 20 == 0:
            print(f"   {i+1}/{len(tickers)}  수집 {ok}  매핑실패 {miss}")
        time.sleep(0.12)  # DART 한도 보호

    json.dump(result, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n✅ 저장: {OUT}  (종목 {ok}개에 임원 거래 내역)")
    print("   각 항목의 direction(+매수/-매도)·changeCnt로 공시 신호를 정확화할 수 있습니다.")


if __name__ == "__main__":
    main()
