#!/usr/bin/env python3
# KRX 시장경보(투자주의/경고/위험·단기과열·관리·거래정지) 수집 → public/data/market-alerts.json
#
# 무료 경로: KRX Data Marketplace getJsonData.cmd (키 불필요, Referer 헤더 필요).
# ⚠️ bld 코드는 KRX가 메뉴마다 다르며 변경될 수 있어 1회 검증 필요.
#    검증법: data.krx.co.kr 시장경보종목 현황 페이지 → F12 Network → getJsonData 요청의 'bld' 복사.
# 실패/0행이면 가짜로 채우지 않고 빈 배열을 쓴다(설계서 원칙 #8). 앱은 경보 없음으로 안전 동작.
#
# 우리 분석대상(stocks.json)과 매칭되는 경보만 저장.
import json, os, sys, datetime
try:
    import requests
except ImportError:
    print("requests 미설치 — pip install requests"); sys.exit(0)

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "data", "market-alerts.json")

# KRX 시장경보 dataset 후보 bld (검증 후 정확한 1개로 고정).
# 시장경보종목(투자주의/경고/위험) 지정현황 + 단기과열 등.
CANDIDATE_BLDS = [
    "dbms/MDC/STAT/standard/MDCSTAT30201",  # 시장경보 후보1 (검증 필요)
    "dbms/MDC/STAT/standard/MDCSTAT30401",  # 단기과열 후보 (검증 필요)
]

# KRX 한글 경보명 → 내부 타입
TYPE_MAP = {
    "투자주의": "INVESTMENT_CAUTION", "투자경고": "INVESTMENT_WARNING",
    "투자위험": "INVESTMENT_RISK", "투자경고지정예고": "WARNING_PRENOTICE",
    "단기과열": "SHORT_TERM_OVERHEAT", "거래정지": "TRADING_HALT",
    "관리종목": "MANAGEMENT_ISSUE", "불성실공시": "UNFAITHFUL_DISCLOSURE",
    "상장적격성": "DELISTING_REVIEW",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Referer": "http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd",
    "X-Requested-With": "XMLHttpRequest",
}
GETJSON = "http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd"


def load_universe():
    try:
        with open(os.path.join(ROOT, "public", "data", "stocks.json"), encoding="utf-8-sig") as f:
            return {s["ticker"] for s in json.load(f).get("stocks", [])}
    except Exception as e:
        print("유니버스 로드 실패:", e); return set()


def fetch(bld):
    today = datetime.datetime.now().strftime("%Y%m%d")
    params = {"bld": bld, "trdDd": today, "mktId": "ALL", "csvxls_isNo": "false"}
    try:
        r = requests.post(GETJSON, data=params, headers=HEADERS, timeout=20)
        if r.status_code != 200:
            print(f"  {bld}: HTTP {r.status_code}"); return []
        js = r.json()
        rows = js.get("OutBlock_1") or js.get("output") or js.get("block1") or []
        print(f"  {bld}: {len(rows)}행")
        return rows
    except Exception as e:
        print(f"  {bld}: 오류 {e}"); return []


def main():
    universe = load_universe()
    print(f"[1/2] 유니버스 {len(universe)}종목")
    print("[2/2] KRX getJsonData 시도...")
    alerts = []
    for bld in CANDIDATE_BLDS:
        rows = fetch(bld)
        for row in rows:
            code = (row.get("ISU_SRT_CD") or row.get("ISU_CD") or "").strip().zfill(6)[-6:]
            if code not in universe:
                continue
            raw = (row.get("ALERT_NM") or row.get("DESIGNATE_DIV") or row.get("MKTALERT_NM") or "").replace(" ", "")
            atype = next((v for k, v in TYPE_MAP.items() if k in raw), None)
            if not atype:
                continue
            alerts.append({
                "stockCode": code, "type": atype, "title": raw or atype,
                "announcedAt": row.get("ALERT_DD") or row.get("DESIGNATE_DD") or None,
                "isActive": True,
                "sourceUrl": "http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd",
            })
    out = {"asOf": datetime.datetime.now().isoformat(), "alerts": alerts}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\n저장: {len(alerts)}건 → {OUT}")
    if not alerts:
        print("⚠️ 경보 0건 — bld 검증 필요(코드 상단 주석 참고). 가짜 데이터는 쓰지 않음.")


if __name__ == "__main__":
    main()
