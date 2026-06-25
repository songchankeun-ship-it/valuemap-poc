# 데이터 소스 상용 이용 리스크 검토표

> **상태: 초안 · 법적 결론 미확정 · 상용화 전 법무 검토 필요.**
> 이 문서는 AI(Claude)가 코드베이스 사용 현황을 근거로 정리한 **추적 가능한 리스크 점검표**다.
> 법적 결론을 단정하지 않는다. **확인 필요**로 표시된 칸은 모두 상용 출시 전에 운영자/법무가 직접 확인해 채운다.
> 소유자 표기: **[법무]** = 사람(법무)이 최종 판단할 항목 / **[개발]** = 개발자가 코드·운영으로 처리할 항목.
> 관련: [`legal-ai-commercial-readiness.md`](./legal-ai-commercial-readiness.md), [`monetization-strategy.md`](./monetization-strategy.md).
> 마지막 정리: 2026-06-25 (AI Center task 39, 후속 B).

---

## 0. 사용하는 이유 / 범위

오른스코어는 공개된 한국 주식 시장 데이터와 자체 산식 점수를 제공하는 **데이터 탐색 도구**다(매수·매도 추천 아님).
현재 데이터는 클라우드 배치(GitHub Actions)로 생성한 정적 스냅샷(`public/data/stocks.json`, `prices/*.json`, `backtest-result.json`)과, 페이지 열람 시 라이브 조회(현재가·공시)를 혼합한다.

**핵심 리스크 요지**: 무료 데이터 출처라도 *개인/비상업 목적 한정* 또는 *재배포 금지* 조건이 흔하다. 상용(유료 구독) 전환 시 출처별 이용약관·라이선스를 개별 확인하고, 가능하면 **공식 유료 인터페이스**로 이전하거나 **대체 소스 / fallback**을 준비해야 한다. 이 문서는 코드 사용 현황 기반 추정이며 **약관 원문 확정이 아니다**.

> ⚠️ 표기 보정(이번 후속 B에서 확인): 직전 버전 표는 가격 수집을 `scripts/run_real.py`·`scripts/fetch_prices.py`로, yfinance를 `fetch_prices.py`로 적었으나 실제 코드와 차이가 있었다. 실제 자동 갱신 경로는 **FinanceDataReader 기반 `fetch_prices.py`**이고, `run_real.py`는 **현재 저장소에 없다**. Naver 스크래핑·yfinance import는 **`fetch_stock_data.py`(시드/수동 경로)**에 있고 일일 자동 워크플로에는 포함되지 않는다. 자세한 정합성 메모는 §부록 참고.

---

## (A) 현재 표시 데이터의 출처와 갱신 경로

각 *사용자에게 보이는* 데이터가 (i) 어디에 표시되는지, (ii) 실제 생성·갱신 경로가 무엇인지, (iii) 표기 정합성 확인이 필요한 지점을 묶었다. 표기 칸의 출처 명칭은 화면(`/status`)·코드(`DATA_SOURCES`)에서 실제로 쓰는 문자열 기준이다.

| 표시 데이터 | 표시 위치(코드) | 실제 생성·갱신 경로 | 갱신 주기 | 표기 정합성 |
|---|---|---|---|---|
| 가격·거래량·종가·점수 | `/status` `sources[]` "가격·지표 (FinanceDataReader)"; `domainStatuses.price` "…장마감 · KRX"; `DATA_SOURCES.krx` | `.github/workflows/daily-data.yml` → `fetch_prices.py`(**FinanceDataReader**, 종목별 일별 OHLCV) → `sync_prices_to_stocks.py` → `compute_metrics.py` → `verify_metrics.py`(게이트) → 봇 commit·push → Vercel 자동배포 | GitHub Actions cron `0 8 * * 1-5`(17:00 KST 평일) + 수동 `workflow_dispatch` | **확인 필요** — `/status`는 "FinanceDataReader", `DATA_SOURCES`·`domainStatuses`는 "KRX"로 표기. FDR가 내부적으로 KRX 등을 끌어오므로 모순은 아니나 **명칭 일원화 검토 필요**(§부록). |
| 현재가(지연 시세) | `/status` `sources[]` "현재가 (네이버 지연 시세) · 페이지 열 때 실시간 조회 (참고용)" | 페이지 열람 시 라이브 조회(네이버 지연 시세 페이지). 정적 스냅샷이 아님. | 페이지 열람 시점 | **확인 필요** — 비공식 페이지 열람 의존. 출처·"참고용·지연" 표기 유지 여부 §B·§C 참고. |
| PER·PBR·ROE·배당(재무) | `domainStatuses.financial` "…Naver Finance · PER·PBR 결측 N종목"; `DATA_SOURCES.naver` | `fetch_stock_data.py`의 `fetch_naver()`가 `finance.naver.com/item/main.naver` HTML을 정규식 파싱(스크래핑). **일일 자동 워크플로에는 미포함** — 시드/수동 갱신 경로. | 수동 실행 시 | **확인 필요** — 스크래핑 경로. 자동 갱신 대상이 아님(스냅샷에 반영된 값이 표시됨). |
| 공시 신호 | `/status` `sources[]` "공시 (DART) · 라이브 조회 (DART_API_KEY 필요)"; `domainStatuses.disclosure` "DART · 최근 7일 · 최신 200건 분석"; `DATA_SOURCES.dart` | `src/app/api/disclosures/[ticker]/route.ts`·`recent/route.ts` → **DART Open API 라이브**(코스피·코스닥 각 최신 100건). 키 없거나 실패 시 `public/disclosure-samples/*.json` 폴백. | 페이지 열람 시(메모리 캐시 30~60분) | 정합성 이슈 없음. 원문은 DART 링크로 연결(재호스팅 회피). 표시 상한 50건·수집 200건은 상시 고지됨. |
| 점수 변화(오늘의 변화) | `/status` `sources[]` "점수 변화 (Supabase daily_scores) · 장 마감 후 cron 저장" | 장 마감 후 cron이 일별 점수를 Supabase `daily_scores`에 저장 → 신규 진입·점수 급변 비교. | 장 마감 후 cron | 정합성 이슈 없음. |
| KRX 시장경보 | `/status` `sources[]` "KRX 시장경보 · 보류 — 무료 공식 소스 없음(인프라만 준비)" | `fetch_market_alerts.py`(워크플로 non-blocking). 현재 무료 공식 소스 부재로 **보류**(인프라만 준비, 활성 0건 시 off 표시). | (보류) | 정합성 이슈 없음(미활성 정직 표시). |
| 임원·주요주주 보유 변동(방향·규모) | 공시 카드 enrich(`insiderDetails.ts`) — 있으면 실제 방향, 없으면 추정 | `fetch_insider_details.py`(DART `elestock.json` 구조화 엔드포인트) → `public/data/insider-signals.json`. 수동 실행. 파일 없으면 추정 라벨로 graceful. | 수동 실행 시 | 정합성 이슈 없음(파일 유무로 graceful). |

> 일일 워크플로의 정직성: `verify_metrics.py` 게이트를 통과하고 실제 변경이 있을 때만 봇이 commit·push한다(변경 없으면 skip). 갱신 실패 시 **직전 정상 데이터가 유지**된다(신규 데이터는 자동 검증 통과 시에만 반영). `/status` 하단에 이 동작이 고지됨.

---

## (B) 사람(법무) 검토가 필요한 약관/라이선스 항목  — 소유자 **[법무]**

각 출처별로 **법무가 최종 판단할 법적 질문**과 **확인할 공식 문서 위치**를 적는다. URL·조항은 저장소만으로 확정할 수 없어 **확인 필요**로 둔다. 결론(위반/적법)을 이 문서에서 단정하지 않는다.

| 소스 | 사용 형태 | 법무가 확인할 질문 | 공식 문서 위치 | 결론 |
|---|---|---|---|---|
| **KRX** (한국거래소) | 시세·거래량·종가(FinanceDataReader 경유). 2차 가공 점수 표시. | 무가공/가공 시세의 상업적 제공·재배포가 별도 이용계약/유료 라이선스 대상인지. 지연시세 한정 시 조건. | KRX 정보데이터시스템 이용약관·시세정보 이용계약(상용) — **확인 필요** | **확인 필요 · 법무 판단** |
| **DART** (전자공시) | Open API 키 기반 라이브 호출. 메타 표시·원문은 링크 연결. | Open API 호출 한도·상업적 이용 조건, 공시 원문 저작권(재호스팅 금지 여부), 메타데이터 2차 가공 표시 범위. | Open DART 이용약관·API 이용안내 — **확인 필요**(현재 공식 키 기반 사용 중) | **확인 필요 · 법무 판단** |
| **Naver Finance** | `finance.naver.com` HTML 스크래핑(재무) + 지연 현재가 페이지 열람. | **공식 공개 API 아님** — 자동 수집·상업적 이용이 약관 위반 소지가 있는지(상용화 최대 리스크 후보). | 네이버 서비스 이용약관·로봇 배제(robots) 정책 — **확인 필요** | **확인 필요 · 법무 판단(우선순위 높음)** |
| **yfinance / Yahoo** | `fetch_stock_data.py`에서 import(보조 가격·시계열 검증 경로). 일일 워크플로 미포함. | Yahoo Finance 데이터의 상업적 재이용 가부, yfinance(비공식 래퍼) 사용의 약관·중단 위험. | Yahoo Finance 이용약관 / yfinance 라이선스 — **확인 필요** | **확인 필요 · 법무 판단** |
| **FinanceDataReader** | 일일 자동 갱신의 가격·지표 수집 라이브러리. | 라이브러리 라이선스(오픈소스)와 **원천 데이터 라이선스**를 분리 검토. 실질 리스크는 원천(KRX·Naver) 약관에 종속. | 라이브러리 라이선스 + 원천(위 KRX·Naver 항목) — **확인 필요** | **확인 필요 · 법무 판단(원천 종속)** |

---

## (C) 대체 출처 후보와 전환 시 필요한 작업  — 소유자 **[개발]**

리스크 높은 비공식 의존(Naver·yfinance 우선)에 대해 대체 후보와 **구체적 개발 전환 작업**을 적는다. 법적 채택 여부는 §B의 법무 판단을 따른다.

| 대상(고위험) | 대체 후보 | 개발 전환 작업 |
|---|---|---|
| **Naver Finance**(재무·지연 현재가) | 공식/유료 재무 데이터 공급사, 또는 KRX 공식 시세 라이선스 경로. | `fetch_stock_data.py`의 `fetch_naver()`를 대체 수집기로 교체; `DATA_SOURCES.naver`·`domainStatuses.financial.detail` 출처 표기 변경; 현재가 라이브 경로(`/status` "현재가") 대체 또는 "지연·참고용" 표기 유지; 수집 실패 시 **직전 정상 데이터 유지** 보장. |
| **yfinance / Yahoo**(보조 검증) | 라이선스 있는 시세 공급사, 또는 보조 검증용으로 격하/제거. | `fetch_stock_data.py` import·사용부 정리; 검증 보조 한정으로 격하하거나 제거; `DATA_SOURCES.yfinance` 표기 조정. |
| **KRX**(가격 핵심) | KRX 공식 상용 시세 라이선스(유료 계약). | 채택 시 `fetch_prices.py` 수집 경로·`DATA_SOURCES.krx`·`domainStatuses.price.detail` 표기 정리; FDR↔KRX 명칭 일원화(§부록). |

> 공통: 어느 소스를 교체하든 **fallback 구조**(라이브 실패 시 캐시/직전 스냅샷)와 **출처 표기 변경**을 함께 처리한다. 현재 공시 API는 샘플 폴백, 일일 데이터는 직전 정상 유지로 이미 fallback 골격이 있다.

---

## (D) 결제 전 고지/약관에서 확정해야 할 문구  — 소유자 **[법무] 확정 · [개발] 반영**

결제·환불·청약철회 등 일반 약관 항목은 **중복 작성하지 않고** [`legal-ai-commercial-readiness.md`](./legal-ai-commercial-readiness.md) A절을 따른다. 여기서는 **데이터 출처에 한정된 고지 후보**만 초안으로 둔다(모두 출시 전 법무 확정).

- (초안) 시세·재무 데이터는 **지연·참고용**이며 실시간·정확성을 보장하지 않는다는 고지. — 출시 전 법무 확정
- (초안) 데이터는 **제3자 출처**(KRX·DART·Naver 등)에서 제공되며, 출처 약관에 따라 **재배포·상업적 이용이 제한될 수 있다**는 고지. — 출시 전 법무 확정
- (초안) 출처 사정·약관 변경으로 **특정 데이터 제공이 중단·변경될 수 있다**는 고지(유료 구간 데이터 가용성 면책과 정합). — 출시 전 법무 확정
- (초안) 점수·신호는 **자체 산식 기반 참고 정보**이며 매수·매도 추천이 아니라는 기존 공통 고지 유지(신규 표현 아님). — 유지

> 위 문구는 모두 **초안**이며 최종 확정 문구로 단정하지 않는다. 결제 도입 시 `/terms`·`/privacy`·결제 동의 화면에 반영한다.

---

## 추적 가능 체크리스트 (설계서 §41 필수 조치)

데이터 출처 관련 잔여 리스크를 한 곳에서 추적한다. 각 항목에 소유자 **[법무]**/**[개발]**와 상태(미착수/진행/확인 필요)를 단다.

- [ ] **[법무] 확인 필요** — 출처별(KRX·DART·Naver·yfinance·FinanceDataReader) **이용약관 원문 대조**(§B 표 결론 채우기).
- [ ] **[법무] 확인 필요** — 출처별 **상업적 이용·재배포 가능 여부** 확정.
- [ ] **[법무] 진행 권장** — **비공식 수집(Naver 스크래핑·yfinance) 의존도** 평가·축소 결정.
- [x] **[개발] 진행** — **fallback 구조**: 공시 API 샘플 폴백 + 일일 데이터 직전 정상 유지(이미 구현, §A 주석).
- [x] **[개발] 진행** — **직전 정상 데이터 유지**: `verify_metrics.py` 게이트 통과·변경 시에만 commit(워크플로).
- [ ] **[개발] 미착수** — **관리자 수동 재수집** 트리거 UI(현재 GitHub Actions `workflow_dispatch` 수동 버튼만; 앱 내 관리자 재수집 없음).
- [ ] **[개발] 미착수** — **수집 실패 알림**(워크플로 실패 시 운영자 통지; 현재 비-blocking 단계·`echo skipped`만).
- [ ] **[개발] 진행 권장** — **소스 교체 가능 구조**: `DATA_SOURCES`/`domainStatuses`/수집 스크립트가 분리돼 교체 가능하나, 출처 명칭 일원화(§부록)·수집기 추상화 여지 있음.
- [ ] **[개발] 확인 필요** — **출처 표기 일관화**: `/status`("FinanceDataReader")와 `DATA_SOURCES`/`domainStatuses`("KRX") 명칭 정리(§부록).

---

## 부록. 코드 ↔ 표기 정합성 확인 필요 메모 (후속 B 발견)

직전 버전 표와 실제 코드의 차이. 화면 문구가 *사실과 다른* 수준은 아니라 코드 수정은 보류하고 **확인 필요**로 추적한다.

1. **가격 출처 명칭 불일치(확인 필요)** — `/status` `sources[]`는 "가격·지표 (FinanceDataReader)", `DATA_SOURCES.krx`·`domainStatuses.price.detail`은 "KRX". FDR가 내부적으로 KRX 등을 끌어오므로 모순은 아니나 명칭을 하나로 정리할지 검토 필요. (사실 오류 아님 → 이번엔 코드 미변경.)
2. **`run_real.py` 부재** — 직전 표가 가격 경로로 인용한 `scripts/run_real.py`는 **현재 저장소에 없다**. 실제 자동 경로는 `daily-data.yml` → `fetch_prices.py`(FDR) → `sync_prices_to_stocks.py` → `compute_metrics.py`.
3. **yfinance 위치** — 직전 표는 yfinance를 `fetch_prices.py`로 적었으나, `fetch_prices.py`는 FinanceDataReader+pandas만 사용한다. yfinance import는 `fetch_stock_data.py`(시드/수동)에 있다.
4. **Naver 수집 위치** — Naver 스크래핑은 `run_real.py`가 아니라 `fetch_stock_data.py`의 `fetch_naver()`(정규식 HTML 파싱)다. 일일 자동 워크플로에는 포함되지 않는다.

> 이 메모는 *코드 경로* 정합성만 다룬다. 각 출처의 *법적* 결론은 여전히 §B의 **[법무]** 판단 대상이다.
