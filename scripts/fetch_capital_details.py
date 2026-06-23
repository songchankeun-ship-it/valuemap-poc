# -*- coding: utf-8 -*-
"""
fetch_capital_details.py — 증자·전환사채 발행 결정 공시의 실제 규모(발행금액·자금용도) 수집

핵심: DART OpenAPI의 구조화 엔드포인트
  - piicDecsn.json   ('유상증자결정')   → 신주 수·자금조달 목적별 금액을 구조화 필드로 제공
  - cvbdIsDecsn.json ('전환사채권발행결정') → 사채 권면총액·자금조달 목적별 금액 제공
  - bwbdIsDecsn.json ('신주인수권부사채권발행결정') → 사채 권면총액·자금조달 목적별 금액 제공
  → 본문 XML을 직접 파싱하지 않고도 발행 규모를 사실 그대로 알 수 있다.
  (자기주식취득 tsstkAqDecsn / 임원 소유보고 elestock 과 함께 DART가 구조화로 노출하는 유형)

출력: public/data/capital-signals.json
  { "005930": [ {rcept_no, kind, amount, fundsUse, periodBgn, periodEnd, date} ... ] }
    kind   ∈ "유상증자" | "전환사채" | "신주인수권부사채"
    amount = 발행/조달 규모(원).  유상증자=자금조달목적 합계, 전환사채=권면총액(bd_fta)
    fundsUse = 자금용도 카테고리 문자열(예 "시설", "운영", "시설·운영")  — 사실 분류만

사용법:
    set DART_API_KEY=발급키   (또는 .env / .env.local 에 DART_API_KEY=)
    python scripts/fetch_capital_details.py

⚠️ 운영 키로 실제 호출해 FIELD 매핑을 검증하세요.
   - 전환사채 권면총액 bd_fta, 유상증자 자금목적 fdpp_fclt(시설)/fdpp_op(운영) 등은
     DART 문서 기준 추정값입니다. 문서/실응답과 다르면 아래 FIELD 매핑만 교정하면 됩니다.
   (이 스캐폴드는 키 없는 로컬에서 실행하지 않으며, capitalDetails.ts 는 파일이 없으면 graceful no-op)
"""
from __future__ import annotations
import os, sys, json, time, io, zipfile, urllib.request, datetime, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "capital-signals.json")
CORP_CACHE = os.path.join(ROOT, "public", "data", "corp_code_map.json")

# ⚠️ operator-verify: 자금조달 목적 필드 → 사람이 읽는 카테고리 라벨.
#    유상증자/전환사채 공통 fdpp_* 키. 실응답에서 키 확인 후 교정.
FUNDS_USE_FIELDS = [
    ("fdpp_fclt", "시설"),       # 시설자금
    ("fdpp_bsninh", "영업양수"),  # 영업양수자금
    ("fdpp_op", "운영"),         # 운영자금
    ("fdpp_dtrp", "채무상환"),    # 채무상환자금
    ("fdpp_ocsa", "타법인증권취득"),  # 타법인 증권 취득자금
    ("fdpp_etc", "기타"),        # 기타자금
]


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
    req = urllib.request.Request(url, headers={"User-Agent": "valuemap/capital"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def build_corp_map(key: str) -> dict:
    """ticker(6자리) -> corp_code(8자리). insider/treasury 스크립트와 동일 캐시 재사용."""
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


def funds_use(it: dict) -> str:
    """자금조달 목적 중 금액이 잡힌 카테고리만 사실 그대로 묶어 라벨화."""
    cats = []
    for field, label in FUNDS_USE_FIELDS:
        if to_int(it.get(field)) > 0:
            cats.append(label)
    return "·".join(cats)


def fetch_rights(key: str, corp_code: str, bgn: str, end: str):
    # 주요사항보고서 '유상증자 결정' 구조화 정보. 기간(bgn_de/end_de) 필수.
    url = (f"https://opendart.fss.or.kr/api/piicDecsn.json"
           f"?crtfc_key={key}&corp_code={corp_code}&bgn_de={bgn}&end_de={end}")
    try:
        data = json.loads(get(url))
    except Exception:
        return []
    if data.get("status") != "000":
        return []
    out = []
    for it in data.get("list", []):
        # ⚠️ operator-verify: 유상증자 금액 = 자금조달 목적 합계(fdpp_*).
        #    별도 총발행금액 필드가 있으면 그쪽으로 교정.
        amount = sum(to_int(it.get(f)) for f, _ in FUNDS_USE_FIELDS)
        out.append({
            "rcept_no": it.get("rcept_no"),
            "kind": "유상증자",
            "amount": amount,
            "fundsUse": funds_use(it),
            "periodBgn": it.get("pymd"),   # ⚠️ operator-verify: 납입일(기간 없음)
            "periodEnd": it.get("pymd"),
            "date": it.get("rcept_dt"),
        })
    return out


def fetch_cb(key: str, corp_code: str, bgn: str, end: str):
    # 주요사항보고서 '전환사채권 발행 결정' 구조화 정보. 기간(bgn_de/end_de) 필수.
    url = (f"https://opendart.fss.or.kr/api/cvbdIsDecsn.json"
           f"?crtfc_key={key}&corp_code={corp_code}&bgn_de={bgn}&end_de={end}")
    try:
        data = json.loads(get(url))
    except Exception:
        return []
    if data.get("status") != "000":
        return []
    out = []
    for it in data.get("list", []):
        # ⚠️ operator-verify: 전환사채 발행규모 = 권면(전자등록)총액 bd_fta(원).
        out.append({
            "rcept_no": it.get("rcept_no"),
            "kind": "전환사채",
            "amount": to_int(it.get("bd_fta")),
            "fundsUse": funds_use(it),
            "periodBgn": it.get("cv_pd_bgd"),  # ⚠️ operator-verify: 전환청구기간 시작
            "periodEnd": it.get("cv_pd_edd"),  # ⚠️ operator-verify: 전환청구기간 종료
            "date": it.get("rcept_dt"),
        })
    return out


def fetch_bw(key: str, corp_code: str, bgn: str, end: str):
    # 주요사항보고서 '신주인수권부사채권 발행 결정' 구조화 정보. 기간(bgn_de/end_de) 필수.
    # cvbdIsDecsn(전환사채)의 미러 — 권면총액·자금조달 목적 필드 구조가 동일.
    url = (f"https://opendart.fss.or.kr/api/bwbdIsDecsn.json"
           f"?crtfc_key={key}&corp_code={corp_code}&bgn_de={bgn}&end_de={end}")
    try:
        data = json.loads(get(url))
    except Exception:
        return []
    if data.get("status") != "000":
        return []
    out = []
    for it in data.get("list", []):
        # ⚠️ operator-verify: 신주인수권부사채 발행규모 = 권면(전자등록)총액 bd_fta(원).
        out.append({
            "rcept_no": it.get("rcept_no"),
            "kind": "신주인수권부사채",
            "amount": to_int(it.get("bd_fta")),
            "fundsUse": funds_use(it),
            "periodBgn": it.get("ex_pd_bgd"),  # ⚠️ operator-verify: 신주인수권 행사기간 시작
            "periodEnd": it.get("ex_pd_edd"),  # ⚠️ operator-verify: 신주인수권 행사기간 종료
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
        rows = (fetch_rights(key, cc, bgn_s, end_s)
                + fetch_cb(key, cc, bgn_s, end_s)
                + fetch_bw(key, cc, bgn_s, end_s))
        if rows:
            result[tk] = rows
            ok += 1
        if (i + 1) % 20 == 0:
            print(f"   {i+1}/{len(tickers)}  수집 {ok}  매핑실패 {miss}")
        time.sleep(0.12)  # DART 한도 보호 (종목당 3회 호출: 유증·CB·BW)

    json.dump(result, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"\n저장: {OUT}  (종목 {ok}개에 증자·CB 발행 내역)")
    print("   각 항목의 amount(원)·fundsUse 로 발행 규모·자금용도를 표시할 수 있습니다.")


if __name__ == "__main__":
    main()
