# 데이터 권리 매트릭스 (Data-Rights Matrix)

> **상태: 로컬 추적 기록 · 법적 결론 미확정.**
> 이 문서는 AI(Claude)가 코드베이스의 실제 데이터 사용 현황을 근거로 정리한 **추적 가능한 데이터 권리 점검표**다.
> **재배포 권리·상업적 이용 허가·라이선스 적법성을 단정하지 않는다.** 증거(약관 원문 대조·버전)가 없는 칸은 모두 `unverified`(미확인)로 두고, 채우는 작업은 **오너 조치**로 명시한다.
> 재검수 계획: [`ornscore-public-reaudit-remediation-2026-07-15.md`](./ornscore-public-reaudit-remediation-2026-07-15.md) §4 Slice L.
> 상세 리스크 근거: [`data-source-commercial-risk.md`](./data-source-commercial-risk.md).
> 최종 정리: 2026-07-15 (AI Center task 292, 재검수 Slice L).

---

## 1. 범위와 원칙

- 대상 소스는 재검수가 요구한 4개 묶음으로 분리한다: **KRX**, **DART**, **Naver Finance / FinanceDataReader(FDR)**, **Yahoo / yfinance**.
- 각 칸의 값은 *코드에서 확인되는 사실*(접근 경로·수집 필드·폴백·출처 표기)과 *미확인 사실*(재배포·상업 이용·약관 버전·검토일)을 구분한다.
- 미확인 칸은 `unverified`로 두고, 해당 칸을 채울 **오너 조치**(주로 **[법무]** 약관 대조, 일부 **[개발]** 소스 전환)를 함께 적는다.
- 이 표는 **법적 클리어런스(재배포·상업적 이용 허가)를 주장하지 않는다.** 상업화·재배포 결론은 오너/법무의 별도 판단이다.

---

## 2. 매트릭스

| 소스 (Source) | 접근 경로 (Access path) | 수집 필드 (Fields) | 표시·재배포 상태 (Display / redistribution) | 출처 표기 (Attribution) | 보관 (Retention) | 폴백 (Fallback) | 근거 링크·버전 (Evidence link/version) | 검토일 (Review date) | 오너 조치 (Owner action) |
|---|---|---|---|---|---|---|---|---|---|
| **KRX** (한국거래소) | 일일 배치 `scripts/fetch_prices.py`(FinanceDataReader 경유), GitHub Actions cron | 시세·거래량·종가(점수 입력) | 2차 가공 점수만 표시, 원시 시세 재호스팅 안 함(코드 사실). 상업적 재배포·유료 라이선스 가부 `unverified` | `/status` "가격·지표 (FinanceDataReader)" · `DATA_SOURCES.krx`/`domainStatuses.price` "KRX" | 정적 스냅샷(`public/data/*`), 갱신 실패 시 직전 정상 유지 | 라이브 실패 시 직전 정상 스냅샷 유지(신규 데이터는 `verify_metrics.py` 통과 시에만 반영) | KRX 정보데이터시스템 이용약관·시세정보 이용계약 — 원문 미대조 `unverified` | `unverified` | **[법무]** 상용 시세 이용계약·재배포 조건 확인. **[개발]** FDR↔KRX 출처 명칭 일원화 검토 |
| **DART** (전자공시) | 라이브 Open API `src/app/api/disclosures/[ticker]`·`recent`(`DART_API_KEY`) | 공시 메타(보고서명·접수번호·일자·정정 여부)·원문 링크 | 메타 표시 + 원문은 DART 링크 연결(재호스팅 안 함, 코드 사실). Open API 호출 한도·상업 이용 조건 `unverified` | `/status`·`DATA_SOURCES.dart`/`domainStatuses.disclosure` "DART" | 메모리 캐시 30~60분(원문 스냅샷 저장 안 함) | 키 없음/호출 실패 시 `public/disclosure-samples/*.json` 샘플 폴백 | Open DART 이용약관·API 이용안내 — 버전 미확정 `unverified` | `unverified` | **[법무]** Open API 상업적 이용·호출 한도 확인 |
| **Naver Finance / FinanceDataReader(FDR)** | Naver: `scripts/fetch_stock_data.py` `fetch_naver()` HTML 스크래핑(재무·지연 현재가, 시드/수동 · 일일 자동 워크플로 미포함). FDR: 일일 가격 수집 라이브러리(원천 KRX 등에 종속) | Naver: PER·PBR·ROE·배당 등 재무 보조, 지연 현재가. FDR: 일별 OHLCV | Naver 스크래핑 = 상용 리스크 높음 `unverified`(공식 API 아님). FDR 라이브러리 = 오픈소스 라이선스이나 **원천 데이터 약관에 종속** `unverified` | `domainStatuses.financial` "Naver Finance" · 지연 현재가 "지연·참고용" 표기 · `DATA_SOURCES.naver` | Naver 재무는 스냅샷에 반영된 값 표시(자동 갱신 대상 아님). 지연 현재가는 페이지 열람 시 조회(저장 안 함) | 수집 실패 시 직전 정상 스냅샷 유지. 지연 현재가는 "지연·참고용" 표기 유지 | 네이버 서비스 이용약관·robots 정책 / FDR 라이브러리 라이선스 — 미대조 `unverified` | `unverified` | **[법무]** Naver 스크래핑 약관 위반 소지 확인(우선순위 높음). **[개발]** 유료 재무는 공식 소스(FnGuide/WISE 등)로 전환 |
| **Yahoo / yfinance** | `scripts/fetch_stock_data.py`에서 import(보조 가격·시계열 검증). **일일 자동 워크플로 미포함** | 보조지표·시계열 검증 값 | 비공식 래퍼 · 상업적 재이용 `unverified`. 사용자 표시 스냅샷에 직접 반영되지 않는 보조 경로 | `DATA_SOURCES.yfinance` | 스냅샷 미반영(보조 검증 한정) | 격하/제거 후보(보조 검증 실패는 사용자 표시에 영향 없음) | Yahoo Finance 이용약관 / yfinance 라이선스 — 미대조 `unverified` | `unverified` | **[법무]** Yahoo 데이터 상업 재이용·yfinance 사용 위험 확인. **[개발]** 보조 한정 격하 또는 제거 |

---

## 3. 요약

- **코드 사실로 확인되는 것**: 접근 경로, 수집 필드, 원문 재호스팅 회피(DART 링크 연결), 폴백 구조(라이브 실패 시 직전 정상 스냅샷·샘플 폴백), 출처 표기 문자열.
- **`unverified`로 남는 것**: 소스별 재배포·상업적 이용 가부, 약관 원문 버전, 검토일 — 모두 오너/법무의 외부 확인이 필요하다.
- 이 매트릭스는 [`data-source-commercial-risk.md`](./data-source-commercial-risk.md)의 압축 권리 기록이며, 두 문서 어느 것도 재배포·상업 이용 허가를 **확정하지 않는다**.
