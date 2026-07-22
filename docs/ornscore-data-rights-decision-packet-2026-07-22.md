# ORNScore 데이터 출처 권리 결정 패킷

> 기준일: 2026-07-22 (Asia/Seoul)
> 상태: **현재 구현 기준 정본 · 법률 의견 아님 · 상용화 클리어런스 미부여**
> 범위: 가격·거래량·재무·지연 시세·공시·시장경보·파생 점수·백테스트의 수집, 저장, 공개 표시, 재배포 경로

이 문서는 코드와 공식 원문을 대조해 운영 위험을 분류한 기술 의사결정 기록이다. 공개 접근 가능성, 오픈소스 라이브러리 라이선스, 출처 표시는 원천 데이터의 상업 이용 또는 재배포 허가를 대신하지 않는다. 최종 법률 판단은 오너와 전문 법률 검토가 맡는다.

## 1. 결론

### 1.1 즉시 판정

| 영역 | 판정 | 운영 결정 |
|---|---|---|
| Open DART 공식 API | **GREEN · 조건부 유지** | 현재 API 경로와 원문 링크 방식을 유지한다. 등록 용도, 인증키 비공유, 호출 한도, 약관 변경을 관리한다. |
| FinanceDataReader 소프트웨어 | **GREEN · 코드만** | MIT 라이선스는 라이브러리 코드 사용에만 적용한다. 수집한 데이터 권리의 근거로 사용하지 않는다. |
| 국내 일별 가격·거래량 | **RED · 교체 우선 1** | 현재 `fdr.DataReader(ticker)`는 KRX 직접 경로가 아니라 네이버 차트 경로다. 서면 허가 또는 계약된 소스로 교체하기 전 유료 기능·외부 다운로드·신규 재배포를 금지한다. |
| Naver Finance 재무 HTML 수집 | **RED · 교체 우선 2** | 수동 재생성 경로를 확대하지 않는다. DART 기반 계산 또는 계약된 재무 공급자로 교체한다. |
| Naver 지연 현재가 프록시 | **RED · 교체 또는 비노출** | 공개 페이지의 보조 기능으로도 권리 근거가 없다. 허가된 지연 시세가 없으면 마지막 승인 종가만 표시한다. |
| Yahoo / yfinance 필드 | **RED · 제거 우선 3** | 새 공개 스냅샷에 사용하지 않는다. 유료화 전 기존 `dividendYield`, `beta`, `peg`의 출처를 교체하거나 필드를 제거한다. |
| KRX 시장경보 비공식 호출 | **RED · 비활성 유지** | 현재 결과가 비어 있는 상태를 유지하고, 허가·계약 전 활성화하지 않는다. |
| 자체 점수·백테스트 | **AMBER · 원천 권리 상속** | 계산식은 자체 저작물이지만 입력 가격의 권리 문제가 해소될 때까지 상용화 근거로 사용하지 않는다. |

### 1.2 상용화 게이트

다음 조건이 모두 충족되기 전에는 유료 구독, 데이터 다운로드, API 제공, 기업 판매, 광고용 성과 주장에 현재 데이터셋을 사용하지 않는다.

1. 가격·거래량 공급 계약 또는 서면 허가가 서버 저장, 공개 표시, 파생 점수, 백테스트, 유료 서비스 사용을 명시한다.
2. 재무 데이터 공급 계약 또는 DART 기반 자체 계산 경로가 PER·PBR·ROE·배당 필드의 출처를 설명한다.
3. Yahoo/yfinance에서 유래한 공개 필드가 제거되거나 허가된 공급자로 교체된다.
4. 공개 출처 문구가 거래소 원천, 전달 사업자, 수집 어댑터를 분리해 정확히 표시한다.
5. 제공자별 약관 버전, 계약 ID, 허용 필드, 보관 기간, 재배포 범위를 배포 게이트가 검사한다.

## 2. 현재 구현의 실제 데이터 흐름

### 2.1 공개 산출물

2026-07-22 로컬 기준으로 확인한 사실이다.

| 공개 산출물 | 규모와 필드 | 실제 입력 경로 | 위험 |
|---|---|---|---|
| `public/data/prices/{ticker}.json` | 138개 파일, 약 7.88MB. 종목별 약 5년의 일별 종가 `c`와 거래량 `v`를 원시 시계열로 공개 | `.github/workflows/daily-data.yml` → `scripts/fetch_prices.py` → `fdr.DataReader(ticker)` → FDR `NaverDailyReader` → `fchart.stock.naver.com` | **RED**. 기존 문서의 "원시 시세를 재호스팅하지 않음"은 사실과 다르다. |
| `public/data/stocks.json` | 138종목. PER/PBR/ROE 137종목, 배당수익률 138종목, beta 129종목, PEG 28종목. 메타 `source = FDR + Naver + yfinance` | 시드·수동 `scripts/fetch_stock_data.py`; 이후 일일 가격 동기화와 점수 재계산 | **RED**. Naver와 Yahoo 유래 필드가 공개 스냅샷에 남아 있다. |
| `public/backtest-result.json` | 과거 전략 결과와 월별 곡선 | `scripts/backtest/run_real.py`가 공개 가격 파일을 재사용 | **AMBER**. 계산은 자체이지만 입력 가격의 권리 상태를 상속한다. |
| `public/data/market-alerts.json` | 현재 `alerts: []` | `scripts/fetch_market_alerts.py`가 KRX Data Marketplace 내부 JSON 경로를 호출하도록 구현 | **RED · 비활성 유지**. |
| 공시 API 응답 | 접수번호, 보고서명, 제출인, 일자, 원문 링크, 규칙 기반 신호 | `src/lib/dart.ts`, `src/lib/corp-codes.ts`, `src/app/api/disclosures/**` → Open DART 공식 API | **GREEN · 조건부 유지**. |
| 공시 상세 보조 파일 | 계약, 자본, 정정, 임원·주주, 자사주 관련 구조화 필드 | `scripts/fetch_*_details.py` → Open DART 공식 API | **GREEN · 조건부 유지**. 원문과 자동 해석을 구분한다. |

### 2.2 라이브 호출

| 기능 | 코드 | 엔드포인트 | 판정 |
|---|---|---|---|
| 지연 현재가 | `src/app/api/quote/[ticker]/route.ts` | `polling.finance.naver.com/api/realtime/domestic/stock/{ticker}` | **RED**. 비공식 엔드포인트를 브라우저 User-Agent와 Referer로 호출한다. |
| 최근 공시 | `src/app/api/disclosures/recent/route.ts` | `opendart.fss.or.kr/api/list.json` | **GREEN · 조건부 유지**. |
| 종목별 공시 | `src/app/api/disclosures/[ticker]/route.ts` | Open DART 공시·기업 API | **GREEN · 조건부 유지**. |

### 2.3 가장 중요한 출처 정정

현재 `scripts/fetch_prices.py`는 접두사 없이 `fdr.DataReader(ticker, start, end)`를 호출한다. FinanceDataReader 0.9.202와 공식 저장소의 현재 구현은 국내 종목코드를 `NaverDailyReader`로 보낸다. 해당 reader는 네이버 차트 엔드포인트에서 OHLCV를 수집한다.

따라서 공개 카피의 "KRX 일별 종가 (FinanceDataReader)"는 다음 세 층을 혼합한 표현이다.

```text
시장 원천: KRX 상장 종목
실제 전달·수집 출처: Naver Finance 차트 엔드포인트
소프트웨어 어댑터: FinanceDataReader
```

KRX에서 거래된 종목이라는 사실만으로 Naver 전달 경로를 KRX 공식 공급 경로라고 부를 수 없다. 출처 문구 교정은 라이선스 교체와 별도의 P0 정확성 작업이다.

## 3. 공식 근거 대조

모든 링크는 2026-07-22에 확인했다. 링크가 공개한다는 사실만 기록하며, 문서에 없는 허가를 추론하지 않는다.

### 3.1 KRX Data Marketplace

- [KRX Data Marketplace 홈페이지 이용약관](https://data.krx.co.kr/contents/MDC/INFO/informationController/MDCINFO003.cmd)은 무단 자동 수집·복제·배포를 금지하고, 사전 허락 없는 복사·복제·배포·전송을 제한한다.
- 같은 약관은 마켓데이터 구매·이용에 별도 마켓데이터 이용약관이 적용된다고 명시한다.
- [KRX 데이터 상품 소개](https://data.krx.co.kr/contents/MDC/INFO/informationController/MDCINFO008.cmd)는 데이터 구입, 분배, 라이선스 경로를 별도 상품군으로 운영한다.

**판정:** 저장소에 KRX 데이터 계약, 주문서, 허가 메일, 계약 ID가 없다. 현재 KRX 내부 JSON 호출이나 KRX로 오인될 수 있는 출처 표기를 상업 이용 허가로 간주할 수 없다.

### 3.2 Naver

- [네이버 서비스 이용약관](https://policy.naver.com/policy/service.html)은 사전 허락 없는 자동화 수단 사용과 서비스 취지에 맞지 않는 자동 이용을 제한한다.
- 현재 구현은 `finance.naver.com` HTML, `fchart.stock.naver.com`, `polling.finance.naver.com`을 자동 호출한다.
- 저장소에서 Naver Finance 데이터 수집·저장·공개 표시에 대한 별도 허가나 계약은 확인되지 않았다.

**판정:** 기술적으로 접근된다는 사실만으로 공개 재배포나 상업 이용이 승인됐다고 볼 근거가 없다. 세 경로 모두 교체 대상이다.

### 3.3 FinanceDataReader

- [FinanceDataReader 라이선스](https://github.com/FinanceData/FinanceDataReader/blob/addcbb7e887f0db6176a87d323de5de28357b5f4/LICENSE.txt)는 소프트웨어 코드에 대한 MIT 조건이다.
- [DataReader 분기 구현](https://github.com/FinanceData/FinanceDataReader/blob/addcbb7e887f0db6176a87d323de5de28357b5f4/src/FinanceDataReader/data.py)은 국내 종목코드 기본 경로가 Naver reader임을 보여준다.
- [Naver reader 구현](https://github.com/FinanceData/FinanceDataReader/blob/addcbb7e887f0db6176a87d323de5de28357b5f4/src/FinanceDataReader/naver/data.py)은 네이버 차트 엔드포인트를 사용한다.

**판정:** FDR의 MIT 라이선스는 FDR 코드를 사용할 수 있다는 뜻이다. FDR가 가져온 Naver 또는 KRX 데이터의 저장·표시·재배포 권한을 부여하지 않는다.

### 3.4 Yahoo / yfinance

- [yfinance 공식 문서](https://ranaroussi.github.io/yfinance/index.html)는 이 도구가 Yahoo와 제휴되지 않았고 연구·교육 목적이며, Yahoo Finance API 데이터는 개인 용도로 안내된다고 밝힌다.
- [Yahoo Developer API Terms](https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html)는 문서가 별도로 허용하거나 Yahoo가 서면 허가하지 않는 한 API 접근으로 수익을 얻거나 접근을 판매·공유하는 행위를 제한한다.
- 현재 공개 `stocks.json`에는 yfinance에서 수집하도록 작성된 배당수익률, beta, PEG 값이 존재한다.

**판정:** 유료 ORNScore의 공개 데이터 입력으로 유지할 근거가 없다. 제거 또는 계약된 소스로 교체한다.

### 3.5 Open DART

- [Open DART 소개](https://opendart.fss.or.kr/intro/main.do)는 개인·기업·기관 누구나 API를 이용하고 공시 원문과 주요 재무정보를 활용할 수 있다고 안내한다.
- [Open DART 이용약관](https://opendart.fss.or.kr/intro/terms.do)은 인증키 기반 이용계약, 인증키 비공유, 호출 허용량, 원칙적 무료 제공, 약관 변경 가능성을 규정한다.
- [Open DART 개발가이드](https://opendart.fss.or.kr/guide/main.do?apiGrpCd=DS001)는 공시검색, 기업개황, 원문파일, 고유번호를 공식 기능으로 제공한다.

**판정:** 현재 소스 중 근거가 가장 명확하다. 다만 등록한 사용환경·용도와 실제 운영이 일치해야 하며, 인증키를 공유하거나 호출 제한을 우회해서는 안 된다. 자동 분류 문구는 DART 원문과 ORNScore의 파생 해석을 분리한다.

## 4. 교체 계획

### 단계 0. 즉시 동결

- `scripts/fetch_stock_data.py`를 운영 재생성 경로로 확대하지 않는다.
- Naver·Yahoo 유래 필드에 신규 기능, 알림, 유료 플랜, 다운로드를 연결하지 않는다.
- KRX 시장경보 비공식 수집은 비활성으로 유지한다.
- 이 작업에서는 워크플로, 공개 데이터, 외부 계정 설정을 변경하지 않는다. 중단 여부는 오너가 이 패킷을 승인한 뒤 별도 변경으로 수행한다.

### 단계 1. 가격·거래량 공급 계약

우선순위는 다음과 같다.

1. KRX Data Marketplace에 138종목, 일별 종가·거래량, 5년 보관, 익명 공개 차트, 파생 점수, 백테스트, 향후 유료 서비스 사용 범위를 제시하고 견적·허가 조건을 요청한다.
2. KRX 직접 계약이 맞지 않으면 동일 범위를 서면으로 허용하는 계약형 데이터 공급자를 선정한다.
3. 브로커 API는 개인 주문·계좌용 허가와 제3자 공개 재배포 권한이 다를 수 있으므로, 공개 표시·캐시·재배포 조항이 없으면 채택하지 않는다.

**완료 기준:** 계약서 또는 서면 허가에 필드, 지연시간, 저장기간, 공개 표시, 파생물, 유료 사용, 재배포, 종료 후 삭제, 출처 표기가 명시되어 있다.

### 단계 2. 재무 데이터 교체

1. DART 정기보고서 재무 API로 순이익, 자본, 주식수, 배당 관련 원시 계정을 수집한다.
2. ROE, EPS, BPS는 회계기간·연결/별도·희석주식수·기업행사를 명시한 자체 계산으로 전환한다.
3. PER, PBR, 배당수익률은 단계 1의 허가된 가격 데이터와 결합한다.
4. 계산이 어려운 필드는 억지로 채우지 않고 `null`과 기준일을 공개한다.
5. 빠른 상용화가 필요하면 위 범위를 허용하는 계약형 재무 공급자를 사용한다.

### 단계 3. Naver·Yahoo 제거

- `src/app/api/quote/[ticker]/route.ts`는 허가된 지연 시세 어댑터로 교체하거나 제거한다.
- `fetch_stock_data.py`의 Naver HTML과 yfinance 호출을 운영 경로에서 제거한다.
- 기존 `stocks.json`의 `dividendYield`, `beta`, `peg`는 새 출처로 재생성할 수 없으면 공개 스키마에서 단계적으로 제외한다.
- 공개 출처 카피와 `/status`는 실제 전달 사업자와 라이선스 상태를 반영한다.

### 단계 4. 권리 메타데이터와 실패 차단

각 데이터 배치에 다음 메타데이터를 저장한다.

```json
{
  "provider": "contracted-provider-id",
  "contractId": "owner-held-reference",
  "termsVersion": "YYYY-MM-DD",
  "rightsProfile": "public-display-and-derived-analytics",
  "marketDate": "YYYY-MM-DD",
  "retrievedAt": "ISO-8601",
  "redistribution": "allowed-with-conditions"
}
```

배포 게이트는 `rightsProfile`, 계약 만료일, 허용 필드가 없으면 새 공개 데이터를 거부한다. 비밀 계약서와 키는 저장소에 넣지 않고 오너 보관 위치의 참조 ID만 기록한다.

## 5. 오너가 보내야 할 문의

### 5.1 KRX 또는 계약형 공급자

아래 내용을 그대로 포함해 서면 답변을 받는다.

```text
서비스: ORNScore, 한국 주식 데이터 분석 공개 베타
대상: KRX 상장 138종목
필드: 일별 종가, 거래량, 종목명, 시가총액, PER/PBR/배당 관련 원시값
보관: 종목별 최대 5년
사용: 익명 웹 화면 표시, 차트, 자체 점수, 백테스트, 향후 유료 구독

확인 요청:
1. 서버에서 자동 수집·저장·캐시할 수 있는가?
2. 로그인하지 않은 사용자에게 원시값과 차트를 표시할 수 있는가?
3. 점수·순위·백테스트 같은 파생물을 만들고 유료 서비스에 사용할 수 있는가?
4. JSON/API/다운로드 제공은 어디까지 허용되는가?
5. 필요한 지연시간, 출처 문구, 보관기간, 삭제의무, 사용량 보고가 있는가?
6. 계약 종료 후 기존 스냅샷과 파생 결과는 어떻게 처리해야 하는가?
7. 계약명, 상품명, 월 비용, 최소 계약기간을 알려달라.
```

KRX 문의 기준 주소는 공식 사이트에 게시된 `krxdata@krx.co.kr`이다. 실제 전송은 오너가 수행한다.

### 5.2 법률 검토에 전달할 질문

1. 현재 무료 베타의 Naver/FDR 수집과 공개 시계열 표시를 계속할 수 있는지.
2. 데이터 자체, 사실 정보, 데이터베이스 제작자 권리, 계약 위반 위험을 각각 어떻게 평가할지.
3. Naver·Yahoo 유래 기존 스냅샷을 교체 후 보관할 수 있는지, 삭제해야 하는지.
4. DART 원문 메타와 ORNScore 자동 분류의 표시·면책 방식이 충분한지.
5. 계약된 가격과 DART 재무로 만든 점수·순위·백테스트의 파생물 권리가 누구에게 귀속되는지.

## 6. 구현 백로그

| 순서 | 작업 | 완료 기준 |
|---|---|---|
| P0-1 | 공개 출처 문구 정정 | KRX 시장 원천, Naver 전달 경로, FDR 어댑터를 분리해 표시한다. |
| P0-2 | 권리 프로필 계약 정의 | 공급자별 허용 필드·표시·저장·파생·유료 사용을 기계 판독형으로 관리한다. |
| P0-3 | 가격 공급자 어댑터 | fixture 비교 후 138종목의 종가·거래량·기업행사 정합성을 통과한다. |
| P0-4 | 재무 공급자 어댑터 | PER/PBR/ROE/배당의 계산 기준일과 결측 정책을 재현한다. |
| P1-1 | Naver 지연 시세 제거·교체 | 비공식 폴링 호출이 코드와 배포 산출물에서 사라진다. |
| P1-2 | yfinance 제거 | 공개 데이터와 생성기에서 Yahoo 유래 필드·라이브러리가 사라진다. |
| P1-3 | 기존 공개 데이터 처리 | 교체, 보관 또는 삭제 결정을 법률 검토와 계약에 따라 기록한다. |
| P1-4 | 배포 게이트 | 계약 만료·권리 메타 누락·허용 외 필드가 있으면 배포를 차단한다. |

## 7. 비범위와 잔여 위험

- 이 문서는 금융투자업 등록 여부, 투자자문 해당성, 개인정보, 앱스토어 심사를 판정하지 않는다.
- Naver 로그인 재검수는 데이터 수집 허가와 별개다. 로그인 승인은 Naver Finance 데이터 사용 승인을 의미하지 않는다.
- Google Play 주소·신원 확인도 데이터 권리와 별개다.
- Metrics 2.5.1 비공개 shadow 결과는 공개되지 않더라도 입력 가격의 수집 경로를 상속한다. 연구용 내부 검증과 상용 공개 권리는 구분한다.
- 공급자와 법률 검토의 서면 답변이 오기 전까지 본 패킷의 RED 항목은 해소되지 않는다.

## 8. 변경 관리

- 정본: 이 문서
- 역사 자료: `docs/data-rights-matrix.md`, `docs/data-source-commercial-risk.md`
- 다음 재검토: 공급자 서면 답변 수신 시, 데이터 어댑터 교체 전, 유료 기능 공개 전, 약관 변경 감지 시
- 승인 기록 필수값: 검토자, 검토일, 원문 URL/파일 해시, 계약 ID, 허용 범위, 만료일, 잔여 예외
