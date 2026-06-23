# -*- coding: utf-8 -*-
"""
fetch_correction_details.py — 정정공시 본문의 '정정 전 → 정정 후' 핵심 수치 수집 (오프라인 스캐폴드)

배경: 정정(correction)은 단일판매·공급계약(single_contract)과 함께 DART가 구조화 엔드포인트로
  핵심 숫자를 노출하지 않는 유형이다(임원·자기주식·유증·CB·BW는 모두 구조화 경로 확보).
  → 설계서 §18.2의 '보고서 본문(document.xml) 파싱' 파이프라인이 필요하다.
  fetch_contract_details.py 와 동일한 2단계 본문 파싱 구조를 미러한다.

이 스크립트가 하는 일(2단계):
  1) list.json 으로 종목별 '정정' 보고서 목록을 찾는다.
  2) 각 rcept_no 에 대해 document.xml(zip) 을 받아 본문에서
     '정정 전 ... 값' 과 '정정 후 ... 값' 쌍(원 단위)을 정규식으로 추출한다.

출력: public/data/correction-signals.json
  { "005930": [ {rcept_no, field, before, after, date} ... ] }
    field  = 정정 항목명(있으면, 예: 매출액) — 본문에서 못 뽑으면 생략
    before = 정정 전 값(원)
    after  = 정정 후 값(원)

사용법:
    set DART_API_KEY=발급키   (또는 .env / .env.local 에 DART_API_KEY=)
    python scripts/fetch_correction_details.py

⚠️ operator-verify (전부 미검증 가정):
   - DART document.xml 은 보고서마다 양식이 달라 '정정 전/후' 라벨·표기·표 구조가 다를 수 있다.
     아래 RE_BEFORE / RE_AFTER / RE_FIELD 정규식과 라벨 후보는 추정값이다.
     운영 키로 실제 정정보고서 1~2건을 받아 본문을 눈으로 확인한 뒤 정규식을 교정하라.
     (정정공시는 '정정 전/정정 후' 컬럼 표가 흔하지만, 정정 사유만 서술하고 수치표가 없는 경우도 많다.)
   - 본문 파싱은 실패해도 graceful: 해당 보고서는 결과에서 빠지고(키 누락) 앱은 절을 안 붙인다.
   (이 스캐폴드는 키 없는 로컬에서 실행하지 않으며, correctionDetails.ts 는 파일이 없으면 graceful no-op)
"""
from __future__ import annotations
import os, sys, json, time, io, re, zipfile, urllib.request, datetime, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "correction-signals.json")
CORP_CACHE = os.path.join(ROOT, "public", "data", "corp_code_map.json")

# 정정 보고서명 매칭(제목에 '정정' 포함). disclosure-signals.ts 의 RE_CORRECTION 과 동일 의도.
RE_REPORT_NM = re.compile(r"정정")

# ⚠️ operator-verify: 본문에서 정정 전/후 수치를 뽑는 정규식. 실보고서로 교정 필요.
#   정정 전: '정정 전 ... 1,234,567,000' 형태 가정(원 단위, 콤마/음수 허용).
RE_BEFORE = re.compile(r"정정\s*전[^0-9\-]{0,40}(-?[0-9][0-9,]{3,})")
#   정정 후: '정정 후 ... 1,234,567,000' 형태 가정.
RE_AFTER = re.compile(r"정정\s*후[^0-9\-]{0,40}(-?[0-9][0-9,]{3,})")
#   항목명: '매출액 ... 정정 전' 처럼 정정 전 라벨 직전의 손익 항목명 후보(있으면).
RE_FIELD = re.compile(r"(매출액?|영업이익|영업손실|당기순이익|당기순손실|순이익)[^0-9]{0,20}정정\s*전")


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
    req = urllib.request.Request(url, headers={"User-Agent": "valuemap/correction"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def build_corp_map(key: str) -> dict:
    """ticker(6자리) -> corp_code(8자리). insider/treasury/capital/contract 스크립트와 동일 캐시 재사용."""
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
        s = str(x).replace(",", "").strip()
        neg = s.startswith("-")
        s = s.lstrip("-")
        v = int(s or 0)
        return -v if neg else v
    except Exception:
        return 0


def list_corrections(key: str, corp_code: str, bgn: str, end: str):
    """list.json 에서 '정정' 보고서의 rcept_no/날짜만 수집."""
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


def parse_correction(text: str):
    """본문 평문에서 정정 전/후 값(원)·항목명 추출. 한 쌍이라도 못 찾으면 None."""
    before = after = None
    mb = RE_BEFORE.search(text)
    if mb:
        before = to_int(mb.group(1))
    ma = RE_AFTER.search(text)
    if ma:
        after = to_int(ma.group(1))
    # 두 값이 모두 있어야 '정정 전 → 정정 후' 절이 성립.
    if before is None or after is None:
        return None
    field = None
    mf = RE_FIELD.search(text)
    if mf:
        field = mf.group(1)
    return {"field": field, "before": before, "after": after}


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
        for c in list_corrections(key, cc, bgn_s, end_s):
            rcept = c["rcept_no"]
            if not rcept:
                continue
            parsed = parse_correction(fetch_document_text(key, rcept))
            docs += 1
            time.sleep(0.12)  # document.xml 호출 간 한도 보호
            if parsed:
                rows.append({
                    "rcept_no": rcept,
                    "field": parsed["field"],
                    "before": parsed["before"],
                    "after": parsed["after"],
                    "date": c["date"],
                })
        if rows:
            result[tk] = rows
            ok += 1
        if (i + 1) % 20 == 0:
            print(f"   {i+1}/{len(tickers)}  수집 {ok}  본문 {docs}건  매핑실패 {miss}")
        time.sleep(0.12)  # list.json 호출 간 한도 보호

    json.dump(result, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n저장: {OUT}  (종목 {ok}개에 정정 전/후 핵심 수치)")
    print("   각 항목의 before(원)·after(원)·field로 정정 신호를 사실 그대로 정확화할 수 있습니다.")
    print("   ⚠️ RE_BEFORE/RE_AFTER/RE_FIELD 는 추정 정규식 — 실보고서로 검증 후 교정하세요.")


if __name__ == "__main__":
    main()
