# -*- coding: utf-8 -*-
"""
fetch_contract_details.py — 단일판매·공급계약 체결 공시의 계약금액·직전매출 대비 비율 수집 (오프라인 스캐폴드)

배경: 단일판매·공급계약(single_contract)·정정(correction)은 DART가 구조화 엔드포인트로
  핵심 숫자를 노출하지 않는 유일하게 남은 유형이다(임원·자기주식·유증·CB·BW는 모두 구조화 경로 확보).
  → 설계서 §18.2의 '보고서 본문(document.xml) 파싱' 파이프라인이 필요하다.

이 스크립트가 하는 일(2단계):
  1) list.json 으로 종목별 '단일판매·공급계약체결' 보고서 목록을 찾는다.
  2) 각 rcept_no 에 대해 document.xml(zip) 을 받아 본문에서
     '계약금액(원)' 과 '최근 매출액 대비 비율(%)' 을 정규식으로 추출한다.

출력: public/data/contract-signals.json
  { "005930": [ {rcept_no, amount, salesRatio, date} ... ] }
    amount     = 계약금액(원)
    salesRatio = 직전(최근) 매출액 대비 비율(%) — 숫자만, 부호/단위 제거

사용법:
    set DART_API_KEY=발급키   (또는 .env / .env.local 에 DART_API_KEY=)
    python scripts/fetch_contract_details.py

⚠️ operator-verify (전부 미검증 가정):
   - DART document.xml 은 보고서마다 양식이 달라 '계약금액'/'매출액 대비' 라벨·표기가 다를 수 있다.
     아래 RE_AMOUNT / RE_RATIO 정규식과 라벨 후보는 추정값이다.
     운영 키로 실제 보고서 1~2건을 받아 본문을 눈으로 확인한 뒤 정규식을 교정하라.
   - 본문 파싱은 실패해도 graceful: 해당 보고서는 결과에서 빠지고(키 누락) 앱은 절을 안 붙인다.
   (이 스캐폴드는 키 없는 로컬에서 실행하지 않으며, contractDetails.ts 는 파일이 없으면 graceful no-op)
"""
from __future__ import annotations
import os, sys, json, time, io, re, zipfile, urllib.request, datetime, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "contract-signals.json")
CORP_CACHE = os.path.join(ROOT, "public", "data", "corp_code_map.json")

# 단일판매·공급계약 보고서명 매칭(공백·중점 표기 흔들림 허용).
RE_REPORT_NM = re.compile(r"단일판매[ㆍ·,\s]*공급계약")

# ⚠️ operator-verify: 본문에서 계약금액/매출비율을 뽑는 정규식. 실보고서로 교정 필요.
#   계약금액: '계약금액 ... 1,234,567,000' 형태 가정(원 단위, 콤마 허용).
RE_AMOUNT = re.compile(r"계약금액[^0-9\-]{0,40}([0-9][0-9,]{3,})")
#   매출비율: '매출액 대비 ... 12.34 %' 또는 '최근매출액대비(%) 12.34' 가정.
RE_RATIO = re.compile(r"매출액?\s*대비[^0-9\-]{0,40}([0-9]+(?:\.[0-9]+)?)\s*%?")


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
    req = urllib.request.Request(url, headers={"User-Agent": "valuemap/contract"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def build_corp_map(key: str) -> dict:
    """ticker(6자리) -> corp_code(8자리). insider/treasury/capital 스크립트와 동일 캐시 재사용."""
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
        return int(str(x).replace(",", "").replace("-", "").strip() or 0)
    except Exception:
        return 0


def list_contracts(key: str, corp_code: str, bgn: str, end: str):
    """list.json 에서 '단일판매·공급계약' 보고서의 rcept_no/날짜만 수집."""
    url = (f"https://opendart.fss.or.kr/api/list.json"
           f"?crtfc_key={key}&corp_code={corp_code}&bgn_de={bgn}&end_de={end}"
           f"&page_count=100")
    try:
        data = json.loads(get(url))
    except Exception:
        return []
    if data.get("status") != "000":
        return []
    out = []
    for it in data.get("list", []):
        nm = it.get("report_nm") or ""
        if RE_REPORT_NM.search(nm):
            out.append({"rcept_no": it.get("rcept_no"), "date": it.get("rcept_dt")})
    return out


def fetch_document_text(key: str, rcept_no: str) -> str:
    """document.xml(zip) 을 받아 본문 텍스트를 한 덩어리 문자열로 펼친다(태그 제거)."""
    url = (f"https://opendart.fss.or.kr/api/document.xml"
           f"?crtfc_key={key}&rcept_no={rcept_no}")
    try:
        raw = get(url)
    except Exception:
        return ""
    # ⚠️ operator-verify: 응답이 zip(여러 XML)인지 단일 XML인지 보고서별로 다를 수 있다.
    text_parts = []
    try:
        zf = zipfile.ZipFile(io.BytesIO(raw))
        for name in zf.namelist():
            try:
                text_parts.append(zf.read(name).decode("utf-8", "ignore"))
            except Exception:
                continue
    except zipfile.BadZipFile:
        text_parts.append(raw.decode("utf-8", "ignore"))
    body = "\n".join(text_parts)
    # 태그 제거 → 라벨/숫자 인접 추출이 쉬워지도록 평문화.
    return re.sub(r"<[^>]+>", " ", body)


def parse_contract(text: str):
    """본문 평문에서 계약금액(원)·매출비율(%) 추출. 못 찾으면 None."""
    amount = 0
    ratio = None
    m = RE_AMOUNT.search(text)
    if m:
        amount = to_int(m.group(1))
    r = RE_RATIO.search(text)
    if r:
        try:
            ratio = float(r.group(1))
        except Exception:
            ratio = None
    if amount <= 0 and ratio is None:
        return None
    return {"amount": amount, "salesRatio": ratio}


def main():
    key = load_key()
    stocks = json.load(open(os.path.join(ROOT, "public", "data", "stocks.json"), encoding="utf-8-sig"))
    tickers = [s["ticker"] for s in stocks.get("stocks", [])]
    corp_map = build_corp_map(key)

    end = datetime.date.today()
    bgn = end - datetime.timedelta(days=365)
    bgn_s, end_s = bgn.strftime("%Y%m%d"), end.strftime("%Y%m%d")

    result = {}
    ok = miss = docs = 0
    for i, tk in enumerate(tickers):
        cc = corp_map.get(tk)
        if not cc:
            miss += 1
            continue
        rows = []
        for c in list_contracts(key, cc, bgn_s, end_s):
            rcept = c["rcept_no"]
            if not rcept:
                continue
            parsed = parse_contract(fetch_document_text(key, rcept))
            docs += 1
            time.sleep(0.12)  # document.xml 호출 간 한도 보호
            if parsed:
                rows.append({
                    "rcept_no": rcept,
                    "amount": parsed["amount"],
                    "salesRatio": parsed["salesRatio"],
                    "date": c["date"],
                })
        if rows:
            result[tk] = rows
            ok += 1
        if (i + 1) % 20 == 0:
            print(f"   {i+1}/{len(tickers)}  수집 {ok}  본문 {docs}건  매핑실패 {miss}")
        time.sleep(0.12)  # list.json 호출 간 한도 보호

    json.dump(result, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n저장: {OUT}  (종목 {ok}개에 단일계약 계약금액·매출비율)")
    print("   각 항목의 amount(원)·salesRatio(%)로 단일계약 신호를 사실 그대로 정확화할 수 있습니다.")
    print("   ⚠️ RE_AMOUNT/RE_RATIO 는 추정 정규식 — 실보고서로 검증 후 교정하세요.")


if __name__ == "__main__":
    main()
