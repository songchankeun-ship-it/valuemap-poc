# -*- coding: utf-8 -*-
"""
fetch_treasury_details.py — 자기주식 취득 결정 공시의 실제 규모(주식수·금액·기간) 수집

핵심: DART OpenAPI의 구조화 엔드포인트 tsstkAqDecsn.json('자기주식취득결정')은
  취득예정 주식수·금액·기간을 구조화 필드로 제공한다.
  → 본문 XML을 직접 파싱하지 않고도 회사 자사주 매입 규모를 정확히 알 수 있다.
  (자기주식 취득은 임원 소유보고 elestock 과 함께 DART가 구조화로 노출하는 몇 안 되는 유형)

출력: public/data/treasury-signals.json
  { "005930": [ {rcept_no, acqCnt, acqAmount, periodBgn, periodEnd, date} ... ] }

사용법:
    set DART_API_KEY=발급키   (또는 .env / .env.local 에 DART_API_KEY=)
    python scripts/fetch_treasury_details.py

⚠️ 운영 키로 실제 호출해 FIELD 매핑을 검증하세요.
   tsstkAqDecsn 필드명(aqpln_stk_ostk 등)이 문서와 다르면 FIELD 매핑만 조정하면 됩니다.
   (이 스캐폴드는 키 없는 로컬에서 실행하지 않으며, treasuryDetails.ts 는 파일이 없으면 graceful no-op)
"""
from __future__ import annotations
import os, sys, json, time, io, zipfile, urllib.request, datetime, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "treasury-signals.json")
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
    req = urllib.request.Request(url, headers={"User-Agent": "valuemap/treasury"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def build_corp_map(key: str) -> dict:
    """ticker(6자리) -> corp_code(8자리). insider 스크립트와 동일 캐시 재사용."""
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
        return int(str(x).replace(",", "").strip() or 0)
    except Exception:
        return 0


def fetch_one(key: str, corp_code: str, bgn: str, end: str):
    # 주요사항보고서 '자기주식 취득 결정' 구조화 정보. 기간(bgn_de/end_de) 필수.
    url = (f"https://opendart.fss.or.kr/api/tsstkAqDecsn.json"
           f"?crtfc_key={key}&corp_code={corp_code}&bgn_de={bgn}&end_de={end}")
    try:
        data = json.loads(get(url))
    except Exception:
        return []
    if data.get("status") != "000":
        return []
    out = []
    for it in data.get("list", []):
        # ⚠️ operator-verify: 아래 필드명은 DART tsstkAqDecsn 문서 기준 추정.
        #    운영 키 실호출로 실제 키를 확인한 뒤 필요 시 이 매핑만 교정.
        out.append({
            "rcept_no": it.get("rcept_no"),
            "acqCnt": to_int(it.get("aqpln_stk_ostk")),    # 취득예정 주식(보통주)
            "acqAmount": to_int(it.get("aqpln_prc_ostk")), # 취득예정 금액(보통주, 원)
            "periodBgn": it.get("aq_pd_bgd"),              # 취득예상기간 시작
            "periodEnd": it.get("aq_pd_edd"),              # 취득예상기간 종료
            "date": it.get("rcept_dt"),
        })
    return out


def main():
    key = load_key()
    stocks = json.load(open(os.path.join(ROOT, "public", "data", "stocks.json"), encoding="utf-8-sig"))
    tickers = [s["ticker"] for s in stocks.get("stocks", [])]
    corp_map = build_corp_map(key)

    end = datetime.date.today()
    bgn = end - datetime.timedelta(days=365)
    bgn_s, end_s = bgn.strftime("%Y%m%d"), end.strftime("%Y%m%d")

    result = {}
    ok = miss = 0
    for i, tk in enumerate(tickers):
        cc = corp_map.get(tk)
        if not cc:
            miss += 1
            continue
        rows = fetch_one(key, cc, bgn_s, end_s)
        if rows:
            result[tk] = rows
            ok += 1
        if (i + 1) % 20 == 0:
            print(f"   {i+1}/{len(tickers)}  수집 {ok}  매핑실패 {miss}")
        time.sleep(0.12)  # DART 한도 보호

    json.dump(result, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n저장: {OUT}  (종목 {ok}개에 자기주식 취득 내역)")
    print("   각 항목의 acqCnt/acqAmount 로 자사주 매입 규모를 표시할 수 있습니다.")


if __name__ == "__main__":
    main()
