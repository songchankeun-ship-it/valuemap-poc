# ORNScore Metrics 2.5.1 보정 설계서

> 상태: **Stage A/B 로컬 shadow 준비 승인안**
>
> 공개 적용 상태: **미승인**
>
> 공개 정본: **Metrics 2.4 유지**
>
> `effectiveMarketDate`: **미정**
>
> 작성일: 2026-07-15

## 1. 목적과 결론

Metrics 2.5 원안의 신뢰성 방향은 채택한다. 단일 최종 계산 엔진, 불변
스냅샷, 버전이 다른 점수의 비교 차단, 의미 상태 기반 문구, 결측 은폐 금지,
공시 과장 방지는 모두 ORNScore에 필요한 개선이다.

다만 원안을 그대로 구현하지는 않는다. 다음 네 영역은 공개 전환 전에 반드시
보정해야 한다.

1. 5거래일만으로 252일 입력 지표를 검증할 수 있다는 전제
2. 결측·비정상 재무값이 순위 유니버스에 미치는 영향에 대한 사전 측정 부재
3. 단일 `universeVersion`으로 원시값·점수·순위 비교를 모두 막는 과잉 게이트
4. YAML을 계산 의미까지 소유하는 실행 가능한 단일 정본으로 취급하는 구조

따라서 Metrics 2.5.1은 **공개 산식 변경 작업이 아니라 검증 가능한 shadow
시스템 구축 작업**으로 시작한다. 마지막 로컬 작업이 끝나도 자동으로 Metrics
2.5.1을 공개하지 않는다.

## 2. 입력 문서와 추적성

수신한 원본은 `docs/metrics-v2.5-source/`에 그대로 보존한다.

- 원본 ZIP SHA-256:
  `A8150AE5D48F58458887240D38E7EF7C35F351210D93C28477B3D76DB22B2E7F`
- 원안 문서: `ornscore_metrics_v2_5_engineering_spec_2026-07-15.md`
- 원안 설정: `ornscore_metrics_spec_v2_5.yaml`
- 원안 상태: `draft`
- 원안 적용일: `null`

원본은 증거이므로 수정하지 않는다. 이 문서는 원안을 대체해 공개를 승인하는
문서가 아니라, 원안을 구현하기 전에 통과해야 할 보정 결정과 게이트다.

## 3. 현재 저장소에서 확인된 충돌

### 3.1 계산 경로가 둘이다

- `scripts/compute_metrics.py`가 Metrics 2.4 공개 데이터를 계산한다.
- `src/lib/metrics.ts`도 브라우저/TypeScript에서 유사 계산을 수행하지만
  lookback, 결측 처리, 위험조정 점수 매핑, 백분위 방식이 Python과 다르다.
- 최종 공개 점수를 두 언어에서 다시 계산하면 같은 이름의 점수가 다른 값을
  가질 수 있다.

Metrics 2.5.1의 최종 점수는 Python 엔진이 확정 저장하고, TypeScript는 저장된
계약을 읽고 표현만 한다. TypeScript의 진단용 계산이 필요하면 `preview` 또는
`diagnostic`으로 명명하고 공개 점수와 타입을 분리한다.

### 3.2 결측을 정상 점수처럼 보정한다

현재 Python 경로는 밸류 결측을 나머지 지표 평균으로 대체하고, 일부 계산
경로는 결측 지표를 50으로 채운다. `src/lib/realStocks.ts`도 여러 점수에 50
fallback을 둔다. 이는 4지표 동일가중 설명과 충돌한다.

Metrics 2.5.1에서는 결측을 점수로 변환하지 않는다. 개별 원시값과 계산 가능한
개별 지표는 남기되, 네 지표가 모두 유효하지 않으면 종합점수와 종합순위는
`null`이다.

### 3.3 현재 재무 커버리지는 높지만 품질 이상값이 존재한다

2026-07-15 현재 `public/data/stocks.json` 138종목을 읽기 전용으로 점검한 결과:

| 항목 | 종목 수 |
|---|---:|
| PER > 0 | 137 |
| PBR > 0 | 137 |
| PER·PBR 모두 > 0 | 137 |
| 원안 조건으로 밸류 제외 | 1 |
| PER > 100 | 24 |
| PER > 500 | 8 |
| PBR > 20 | 2 |
| 절대 ROE > 100 | 5 |

현재 데이터만 보면 결측으로 인한 즉시 제외는 1종목이지만, 큰 이상값이 실제
고평가인지 소스 결합 오류인지 확인되지 않았다. 임의 상한으로 자르면 실제
기업을 왜곡할 수 있고, 그대로 두면 소스 오류를 점수로 정당화할 수 있다.
따라서 공개 전에 원인 코드와 소스 기준일을 포함한 영향 보고서가 먼저다.

## 4. 변경 불가 원칙

1. Metrics 2.4 스냅샷과 공개 JSON을 다시 쓰지 않는다.
2. shadow 결과는 `public/`과 공개 API에 저장하지 않는다.
3. Metrics 2.5.1의 첫 공개일은 소유자가 별도로 승인할 때만 정한다.
4. 현재 재무값으로 과거 종합점수를 재계산해 성과 검증처럼 표현하지 않는다.
5. 결측을 50점 또는 다른 지표 평균으로 대체하지 않는다.
6. 산식 변경과 소스 정정, 유니버스 변경을 하나의 버전으로 섞지 않는다.
7. 스냅샷 생성 실패 시 직전 공개 Metrics 2.4 결과를 유지한다.
8. 자동화 작업은 로컬 파일과 유한한 로컬 검증만 수행한다. 원격 저장소,
   호스팅, 계정, 비밀값, 스케줄러, 데이터스토어 스키마·RLS는 별도 승인이다.

## 5. 보정 결정 기록

### M251-D01. 정본의 책임을 분리한다

| 자산 | 책임 | 금지 |
|---|---|---|
| 수신 YAML | 원안 파라미터와 결정의 증거 | 런타임 직접 의존, 원문 수정 |
| canonical JSON config | 승인된 버전, 숫자 파라미터, enum, 표시 메타데이터 | 임의 코드 표현식, 실행 로직 |
| Python 엔진 | 공식의 실행 의미, 유효성 판정, 최종 반올림 | 공개 파일 직접 덮어쓰기 |
| JSON Schema/생성 타입 | 언어 간 계약 | 계산 재구현 |
| 골든 fixture | 기대 결과와 경계값 | 실제 운영 데이터 대체 |
| 생성 문서 | 사용자 설명 | 엔진 적합성의 유일한 증거 |

수신 YAML은 `draft` 증거로 보존한다. 이 저장소에는 선언된 YAML 런타임
의존성이 없으므로, 전역 Python 환경의 우연한 PyYAML 설치나 직접 만든 부분
파서에 운영을 의존하지 않는다. 승인된 실행 설정은 JSON Schema로 검증 가능한
canonical JSON으로 옮기고 그 바이트 표현의 SHA-256을 `configHash`로 쓴다.
엔진 코드의 의미 변경은 config 값이 같더라도 `metricsVersion`을 올려야 한다.
CI는 source-to-decision 매핑, config, 생성 타입, 문서, 골든 결과의 드리프트를
각각 검사한다.

### M251-D02. 5일 검증을 AND 게이트로 바꾼다

원안의 "5개 연속 거래일 또는 P0 불일치 0"은 통과 조건이 너무 약하다.
Metrics 2.5.1은 다음을 모두 만족해야 한다.

1. 현재 유니버스 전체에 대한 2.4/2.5.1 영향 시뮬레이션
2. 가격·거래량 기반 지표의 최소 252개 시장일 결정적 재실행
3. 경계·동률·결측·거래일 누락·기업행동 fixture 통과
4. 최소 5개 연속 실제 거래일의 비공개 shadow 실행
5. 마지막 5개 shadow 실행에서 해결되지 않은 P0 불일치 0건
6. 모든 제외 종목에 알려진 `eligibilityReason` 존재

5일은 운영 연결성과 일별 계약을 확인하는 기간이다. 252일 재실행을 대체하지
않는다.

### M251-D03. 역사 재실행은 시점 일관성을 지킨다

가격·거래량은 해당 날짜에 존재했던 관측값으로 재실행할 수 있다. 반면 현재
PER·PBR을 과거 날짜에 복사하면 미래정보 누출이 생긴다.

- 시점별 재무 스냅샷이 없으면 과거 밸류·종합점수 성과를 주장하지 않는다.
- 현재 재무값은 현재 기준일의 커버리지·민감도 분석에만 쓴다.
- 과거 전체 종합점수 재실행은 point-in-time 재무 데이터가 확보된 구간만
  허용한다.
- 이 단계의 역사 재실행은 투자성과 검증이 아니라 결정성·경계·안정성 검증이다.

### M251-D04. 유효성, 품질 경고, 순위 자격을 분리한다

각 지표는 최소 다음 상태를 가진다.

```text
VALID
MISSING_INPUT
INSUFFICIENT_HISTORY
NON_POSITIVE_FUNDAMENTAL
SOURCE_DATE_STALE
SOURCE_DATE_MISMATCH
ZERO_VARIANCE
QUALITY_WARNING
```

`QUALITY_WARNING`은 자동 제외와 다르다. PER 100 또는 PBR 20 같은 임의 경계만
넘었다는 이유로 삭제하지 않는다. 소스 계약상 비교 가능한 필드일 때만
가격/EPS, 가격/BPS 등 교차 일관성을 강한 검증으로 사용한다. 출처나 기준이
다르면 경고로만 남긴다.

개별 factor는 해당 factor의 유효 모집단에서 백분위를 계산하고 모집단 수와
해시를 함께 저장한다. 특정 종목의 밸류 결측이 그 종목의 모멘텀 원시값까지
지우지는 않는다. 종합순위 모집단은 네 factor가 모두 유효한 교집합이다.

공개 후보 게이트는 baseline 작업에서 확정한다. 초기 안전 기준은 다음과 같다.

- 전체 `rankingEligible` 비율 95% 이상
- 이전 측정 대비 이유 없는 5%p 이상 급락 금지
- 시장별·업종별 제외율과 사유 코드 공개 전 검토
- `UNKNOWN` 제외 사유 0건

### M251-D05. 비교 가능성을 세 층으로 분리한다

단일 `canCompare` 대신 다음 capability를 반환한다.

```ts
type ComparisonCapabilities = {
  raw: boolean;
  factorScore: Record<MetricKey, boolean>;
  compositeScore: boolean;
  rank: boolean;
};
```

| 비교 | 필요한 동일성 |
|---|---|
| 원시값 | 원시 정의, 소스 계약, 두 날짜의 게시 상태 |
| factor 점수 | metrics/config + 해당 factor 모집단 해시 |
| 종합점수 | metrics/config + 네 factor 점수 비교 가능 |
| 종합순위 | 위 조건 + ranking universe 해시 |

유니버스가 바뀌면 원시 수익률·거래량 비율은 비교할 수 있지만 백분위 점수와
순위는 숨길 수 있다. UI는 가능한 비교를 모두 없애지 말고, 숨긴 층과 이유를
정확히 설명한다.

### M251-D06. 위험조정과 거래활성도 이름을 좁힌다

- 3.5%는 `fixedAnnualHurdleRate`라는 버전 파라미터로 저장한다.
- 공개 문구는 "고정 기준수익률 3.5% 대비 과거 수익·변동성 효율"이라고 한다.
- 자동으로 최신 무위험수익률이라고 부르지 않는다.
- 거래량 5일/20일 비율은 `volumeActivityRatio`다.
- 유동성, 자금유입, 매수세, 투자자 정체를 의미한다고 표현하지 않는다.
- 분할 등 기업행동 의심 구간과 거래량 기준일 불일치는 품질 상태로 남긴다.

### M251-D07. 게시를 manifest 기반 원자적 승격으로 만든다

shadow run은 다음 순서만 허용한다.

1. 고유 `runId` 디렉터리에 임시 산출물 작성
2. 스키마, 불변식, 행 수, 기준일, 해시, 허용 오차 검증
3. 각 산출물 SHA-256과 상태를 담은 manifest 작성
4. manifest를 `QA_PASSED`로 봉인
5. 완성된 run 디렉터리를 불변 위치로 승격
6. 마지막에 작은 current pointer를 원자적으로 교체
7. reader가 pointer와 manifest 해시를 다시 검증

pointer는 최소 `snapshotId`, `marketDate`, `metricsVersion`, `manifestHash`를
가진다. 손상되거나 미완료인 run을 가리키면 reader는 직전 정상 pointer를
사용하고 상태를 낮춘다. shadow pointer와 public pointer는 물리적으로 분리한다.

### M251-D08. 상태 집계는 운영 경보와 공개 설명을 분리한다

운영 경보는 가장 높은 심각도를 사용할 수 있다. 공개 페이지는 전체 한 줄
상태와 함께 가격, 재무, 점수, 이력, 공시 등 영향 범위를 보여준다. 한 부가
기능의 장애만으로 모든 데이터가 중단된 것처럼 표현하지 않는다.

### M251-D09. 문서 생성만으로 적합성을 주장하지 않는다

생성 문서는 YAML 드리프트를 줄이는 보조 수단이다. 공개 합격 증거는 다음의
조합이다.

- config schema test
- Python 단위·불변식·골든 테스트
- 생성 타입 compile test
- snapshot contract test
- shadow differential report
- 공개 전 route/E2E recertification

### M251-D10. shadow는 비공개 자산이다

- shadow 기본 출력은 Git 비추적 로컬 경로다.
- 테스트 fixture와 스키마만 Git에 포함한다.
- `public/`, sitemap, 검색 인덱스, 공개 API에서 shadow를 읽지 않는다.
- 보호된 운영 화면에 연결하는 작업도 별도 slice와 권한 회귀 검증이 필요하다.

## 6. Metrics 2.5.1 shadow 계산 계약

원안의 21/63/126 거래일 모멘텀, 5일/20일 거래량 비율, PER·PBR cheapness,
252개 수익률 기반 위험조정, 4개 factor 동일가중은 **shadow 후보 공식**으로
유지한다. 공개 공식으로 확정됐다는 뜻은 아니다.

추가 계약은 다음과 같다.

- 원시 입력은 가능한 정밀도로 보존하고 중간 단계에서 공개 반올림하지 않는다.
- 저장 공개 후보 점수는 Decimal `ROUND_HALF_UP` 한 자리다.
- 동률은 average rank를 사용한다.
- factor별 `eligibleCount`, `populationHash`, `excludedReasonCounts`를 저장한다.
- 종합점수에는 네 factor의 모집단 메타데이터와 ranking universe 해시를 연결한다.
- 모든 계산은 입력 순서와 로케일에 무관하게 결정적이어야 한다.
- 같은 입력·config·엔진 버전은 바이트 단위로 같은 canonical snapshot을 만든다.

## 7. 검증 사다리

### Gate 0 — 영향 기준선

- 현재 138종목의 factor별 유효/제외 사유
- 2.4 대비 2.5.1 점수·순위 분포 변화
- 동률 수, 상·하위 이동, rankingEligible 커버리지
- 시장·업종별 제외 편향
- 이상 재무값 목록과 소스 기준일

Gate 0 보고서 없이는 shadow 엔진의 공개 후보 판정을 하지 않는다.

### Gate 1 — 계약과 원시 함수

- config schema/canonical hash
- HALF_UP, average-rank percentile, null propagation
- 경계값과 순서 불변성
- Python 외 최종 점수 재계산 경로 없음

### Gate 2 — 결정적 shadow snapshot

- 같은 입력의 반복 실행 결과와 manifest hash 일치
- 실패 run이 current pointer에 반영되지 않음
- 공개 Metrics 2.4 파일의 바이트 해시 불변

### Gate 3 — 역사·fixture 재실행

- 가격·거래량 기반 최소 252개 시장일
- 공휴일, 거래정지/누락, 동률, 상장기간 부족, 기업행동 의심 fixture
- point-in-time 재무가 없는 날짜의 밸류·종합 성과 주장 금지

### Gate 4 — 실제 거래일 shadow

- 5개 연속 실제 거래일 모두 성공
- 해결되지 않은 P0 mismatch 0
- source date mismatch 0
- 알 수 없는 제외 사유 0
- 공개 경로 shadow 누출 0

### Gate 5 — 사람 검수

- 표본 종목 원시값·점수 수기 대조
- 신규/제외 종목과 큰 순위 이동 검토
- 문구·상태·이력·공시 화면 검수
- 공개 전환 시점과 첫 적용 거래일 결정

### Gate 6 — 별도 공개 승인

Gate 0~5 통과는 배포 승인이 아니다. 소유자의 새 명시적 결정 뒤에만 공개
pointer, API, 화면, changelog, 배포를 전환한다.

## 8. 데이터 계약 보강

원안 snapshot에 다음 메타데이터를 추가한다.

```json
{
  "engineVersion": "2.5.1",
  "configHash": "...",
  "inputManifestHash": "...",
  "sourceDates": {
    "prices": "YYYY-MM-DD",
    "volumes": "YYYY-MM-DD",
    "fundamentals": "YYYY-MM-DD|null"
  },
  "factorPopulations": {
    "momentum": { "count": 138, "hash": "..." },
    "activity": { "count": 138, "hash": "..." },
    "value": { "count": 137, "hash": "..." },
    "riskAdjusted": { "count": 138, "hash": "..." }
  },
  "rankingPopulation": { "count": 137, "hash": "..." },
  "eligibilityReasonCounts": {},
  "runState": "QA_PASSED"
}
```

모든 hash 입력은 정렬·숫자 표현·개행을 고정한 canonical form을 사용한다.

## 9. 실패와 롤백 규칙

| 실패 | 동작 |
|---|---|
| 입력 기준일 불일치 | run 실패, pointer 유지 |
| config/engine 버전 불일치 | run 실패 |
| factor 모집단 급감 | run 보류, 영향 보고서 생성 |
| snapshot schema 실패 | run 실패 |
| manifest hash 불일치 | reader 거부 |
| 5일 중 한 번 P0 mismatch | 연속일 카운트 초기화 |
| 공개 파일 변경 감지 | shadow 작업 실패 |
| shadow 누출 감지 | 공개 전환 금지 |

Metrics 2.5.1 공개 이후의 롤백 설계도 재계산이 아니라 검증된 pointer 전환을
사용한다. 그러나 현재 자동화 범위에서는 public pointer를 만들지 않는다.

## 10. 작업 분해와 의존성

아래 A~L만 자동화 큐에 등록한다. 각 작업은 하나의 로컬 `[codex]` 커밋,
집중 검증, 핸드오프 갱신을 남긴다.

### Slice A — 기준선 영향 분석기

- 공개 파일을 수정하지 않는 분석 스크립트
- 138종목 eligibility, 이상값, factor 모집단, 2.4 fallback 사용 현황
- JSON + Markdown 결정 보고서
- 이후 numeric gate의 실제 baseline 확정

### Slice B — 설정 경계와 canonical hash

- 원안 YAML을 승인본처럼 직접 수정하지 않음
- `config/metrics/2.5.1.json` shadow config와 JSON Schema 분리
- 수신 YAML→승인 config 결정 매핑 기록(런타임 YAML 파서 없음)
- canonical serialization과 SHA-256
- 생성물 직접 수정 드리프트 검사

### Slice C — 백분위·반올림·결측 원시 함수

- Python average-rank percentile
- Decimal HALF_UP
- 순서 불변, 동률, N=1, null 경계 fixture
- 아직 공개 데이터 생성 경로에 연결하지 않음

### Slice D — 순수 Python shadow 엔진

- 입력 객체에서 출력 객체를 만드는 부작용 없는 core
- 21/63/126, 5/20, value, 252 risk 후보 공식
- 공개 `stocks.json` 쓰기 금지
- 동일 입력 결정성 검증

### Slice E — 품질·자격·모집단 계약

- `eligibilityReason` enum
- factor별 모집단과 ranking 교집합
- 커버리지 급락 게이트
- 이상값은 경고와 제외를 구분

### Slice F — 불변 snapshot·manifest·shadow pointer

- Git 비추적 shadow 저장소
- 임시 run, QA manifest, hash 검증, 원자적 pointer
- 실패 주입 및 직전 정상본 유지 테스트

### Slice G — KRX 거래일과 비교 capability

- 거래일 calendar adapter 계약
- raw/factor/composite/rank capability 분리
- 유니버스 변경 시 원시값만 비교 가능한 fixture
- 외부 캘린더 설정이나 네트워크 변경 없음

### Slice H — 역사/차등 검증 하네스

- 가격·거래량 최소 252개 시장일 재실행
- point-in-time 재무 가드
- 2.4/2.5.1 차이를 오류·의도된 변경·비교 불가로 분류
- 성과 검증 표현 금지

### Slice I — 의미 상태와 공개 후보 projection

- 기존 momentum regime/activity semantics 재사용 감사
- 3.5% 고정 hurdle 및 volume activity 명칭
- shadow DTO와 문구 key 생성
- 공개 라우트 연결 금지

### Slice J — TypeScript 계약과 중복 계산 차단

- 생성 타입/스키마 reader
- 공개 후보 projection은 저장 점수만 소비
- Metrics 2.5.1 최종 점수의 TS 재계산 금지 검사
- Metrics 2.4 공개 동작 유지

### Slice K — shadow 운영 보고서와 5일 AND 게이트

- 실행별 커버리지, mismatch, source date, hash 요약
- 5개 연속 성공과 P0 0을 동시에 요구
- 보호된 화면 연결 없이 로컬 보고서 우선

### Slice L — 로컬 통합 재인증과 결정 문서

- 전체 focused/unit/contract/golden/build/local route 검증
- 공개 Metrics 2.4 바이트 불변 증거
- 미해결 결정과 owner-gated 공개 체크리스트
- push/deploy/public switch 없음

## 11. 원안 티켓 대응표

| 원안 | 보정 slice |
|---|---|
| ORN-2501 설정/생성기 | B, J |
| ORN-2502 단일 엔진 | C, D, J |
| ORN-2503 snapshot/pointer | F |
| ORN-2504 거래일/비교 | G |
| ORN-2505 의미 상태 | I |
| ORN-2506 거래활성도 | I |
| ORN-2507 이력 UI | 공개 승인 뒤 별도 작업 |
| ORN-2508 상태 집계 | K 및 공개 승인 뒤 별도 작업 |
| ORN-2509 공시 분류 | 기존 재검수 결과 감사 후 별도 결정 |
| ORN-2510 공개 전환 | L은 준비 증거만, 전환은 별도 승인 |

원안의 UI·공시·공개 전환 작업을 지금 큐에 그대로 넣지 않는 이유는 shadow
계약이 안정되기 전에 화면 계약부터 굳히면 다시 두 개의 진실이 생기기 때문이다.

## 12. 각 자동화 작업의 공통 완료 조건

1. 시작 전 `git status --short --branch`, 최근 커밋, `CLAUDE.md`,
   `docs/AI_HANDOFF.md`, `PROGRESS.md`, 이 문서를 읽는다.
2. 사용자·다른 에이전트 변경을 보존한다.
3. 한 slice만 구현하고 관련 없는 정리를 하지 않는다.
4. 최소 `npx tsc --noEmit`, UTF-8 `verify_metrics.py`, focused test,
   `git diff --check`, 편집 파일 U+FFFD 검사를 실행한다.
5. 공개/UI 경로를 건드린 경우에만 build와 local route 검증을 추가한다.
6. 공개 `public/data/stocks.json`과 Metrics 2.4 산출물을 수정하지 않는다.
7. `PROGRESS.md`와 `docs/AI_HANDOFF.md`에 변경·검증·위험·다음 slice를 남긴다.
8. 로컬 `[codex]` 커밋을 만들고 작업트리를 깨끗하게 둔다.
9. push, deploy, 외부 설정, 데이터스토어 정책 변경은 수행하지 않는다.

## 13. 공개 전 남은 사람의 결정

자동화 A~L이 끝나도 다음은 사람이 결정한다.

- 이상 재무값을 경고로 둘지 제외할지
- 실제 rankingEligible 커버리지 허용선
- factor별 모집단과 교집합 방식의 최종 승인
- 3.5% hurdle 유지 기간
- point-in-time 재무 데이터 확보 범위
- 공개 이력 UI 전환 방식
- 첫 `effectiveMarketDate`
- 공개 push/deploy 시점

이 결정이 기록되기 전에는 Metrics 2.5.1을 "출시 준비 완료"라고 부르지 않는다.
