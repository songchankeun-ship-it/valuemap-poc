# ORNScore Metrics 2.5.1 — 로컬 통합 재인증 · 소유자 결정 문서 (Slice L)

> 상태: **로컬 shadow 재인증 완료 · 공개 미승인**
>
> 공개 정본: **Metrics 2.4 유지 (변경 없음)**
>
> `releaseReady`: **false** — 실제 5거래일 연속 shadow 창이 미완료(현재 승격 run 0개)
>
> 재인증 시점 HEAD: `63a748f` · 브랜치 `ai-center/task-306-ornscore-metrics-2.5.1-l-local-recer`
>
> 배치 직전 HEAD(pre-batch): `6ce642e`
>
> 작성일: 2026-07-16 · 근거 설계서: `docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md`
> (sha256 `9858414dbff386b4…`) · 원안 증거 ZIP sha256 `A8150AE5…B2E7F`

이 문서는 **로컬 재인증과 핸드오프**다. 공개 산식 전환·push·deploy·pointer 교체는
포함하지 않는다. Gate 6(별도 공개 승인, 설계서 §7)은 여전히 소유자의 별도 결정이다.

---

## 1. 한 줄 결론

Slice A–K 의 shadow 시스템은 로컬에서 **결정적·계약 검증됨**이고, 공개 Metrics 2.4
데이터 바이트와 공개 동작은 이 배치 전체(A–K)에서 **바뀌지 않았다**. 그러나 설계서
§M251-D02/§7 Gate 4 가 요구하는 **실제 5거래일 연속 비공개 shadow run 이 0개**이므로
`releaseReady=false`다. 남은 것은 코드가 아니라 **운영 shadow 창 + 사람 검수(Gate 5) +
소유자 공개 승인(Gate 6)**이다.

---

## 2. 재인증 게이트 결과 (전부 이 세션에서 실행)

| # | 게이트 | 명령 | 결과 |
|---|---|---|---|
| 1 | TypeScript 타입체크 | `npx tsc --noEmit` | ✅ exit 0 |
| 2 | 공개 Metrics 2.4 검증기 | `PYTHONUTF8=1 python scripts/verify_metrics.py` | ✅ 138종목·오류0·브랜드금칙0·버전 2.4 |
| 3 | config 경계+canonical hash | `config:metrics251:check` | ✅ FRESH · configHash `7bf1e3a1f989…` · canonical 3361B |
| 4 | config 계약 | `test:metrics251-config` | ✅ 매핑 61 · 스키마/정규화/민감도/YAML불변 |
| 5 | 기준선 분석기 | `test:metrics251-baseline` | ✅ (재생성 후, §5 참조) 138·순위후보 137/99.28% |
| 6 | 원시 함수(백분위/반올림/결측) | `test:metrics251-primitives` | ✅ HALF_UP·average-rank·null 전파 |
| 7 | 순수 shadow 엔진 | `test:metrics251-engine` | ✅ 골든 10종목 바이트일치·결정성·순수성 |
| 8 | 품질·자격·모집단 | `test:metrics251-eligibility` | ✅ 골든 7시나리오·UNKNOWN 실패·교집합 해시 |
| 9 | 불변 snapshot·manifest·pointer | `test:metrics251-snapshot-store` | ✅ 15 케이스·원자적 승격·실패주입 |
| 10 | 거래일 캘린더·4층 비교 | `test:metrics251-compare` | ✅ 21 케이스·raw 항상비교·상위층 안전숨김 |
| 11 | 역사/차등 재실행 | `test:metrics251-replay` | ✅ 14 케이스·**실데이터 252일 P0=0**·point-in-time 봉쇄 |
| 12 | 의미상태 공개후보 projection | `test:metrics251-projection` | ✅ 9그룹(SCHEMA/COPY/NAME/SIGN/STORED/THRESHOLD/GOLDEN/DET/PURE) |
| 13 | TS 계약 생성 최신성 | `contract:metrics251:check` | ✅ FRESH(export+generator) |
| 14 | TS 읽기계약·재계산 차단 가드 | `test:metrics251-contracts` (tsx) | ✅ 7영역·금지 import/산식 토큰 0 |
| 15 | 5일 AND 롤아웃 게이트 | `test:metrics251-rollout-gate` | ✅ 19 케이스·AND(OR 아님)·합성금지 |
| 16 | 공개 앱 프로덕션 빌드 | `npm run build` | ✅ 138 종목 페이지 prerender·전 라우트 생성 |
| 17 | 라이브 공개 라우트 | `verify:routes` (next start 4461) | ✅ 9/9 200 · 기대 데이터일 2026.07.14 |
| 18 | diff 위생 | `git diff --check` | ✅ (§6) whitespace 오류 0 |
| 19 | 인코딩 | 편집 파일 U+FFFD 스캔 | ✅ (§6) 0건 |

빌드·라이브 라우트(16·17)는 설계서 §10 Slice L 이 명시하고, 배치 유일의 런타임
파일 변경(§4 `src/lib/metrics.ts` 주석)까지 공개 동작이 온전함을 확인하려 실행했다.

---

## 3. 재현성 해시 (결정성 증거)

| 자산 | 해시/증거 | 방식 |
|---|---|---|
| canonical config | configHash `7bf1e3a1f989…` (canonical 3361B) | Slice B~K 전 구간 불변 |
| Python→TS 계약 | `config/metrics/2.5.1.contract.json` sha256 `9d59bc49b659…` | export `--check` FRESH |
| 생성 TS 타입 | `scripts/metrics251/contracts.generated.ts` sha256 `79b9e15dc9ef…` | generator `--check` FRESH·소스 임베드 일치 |
| 롤아웃 보고서 | report hash `2dee648a5636` | 2회 재실행 바이트 동일 |
| shadow 엔진 골든 | 골든 10종목 스냅샷 바이트 동일 | 반복·입력순열 불변 |
| 기준선 문서 | 재생성 stale-guard 통과 | 벽시계/난수 미사용 |

---

## 4. 공개 Metrics 2.4 무변경 증명 (배치 A–K 전체)

- **pre-batch HEAD `6ce642e` → 현재 `63a748f` 사이 `public/` 변경 0건**
  (`git diff --stat 6ce642e HEAD -- public/` = 빈 출력).
- `public/data/stocks.json` 커밋 바이트 sha256 **`c225c09a86f5a595…` (PRE == HEAD 동일)**.
  작업트리는 git 정리(CRLF) 후 동일 · `git status` 청결(수정 없음).
- 배치가 건드린 유일한 런타임/공개 파일: `src/lib/metrics.ts` **+9줄, 순수 주석**
  (`@metricsVersionBoundary 2.4-public` 라벨, Slice J). 삭제 0·로직/export 0 변경.
  → 공개 산식·값·타입 불변, `metricsVersion` **2.4** 유지(검증기 #2 확인).
- shadow 산출물은 `public/`·공개 API·sitemap·검색 인덱스에 **미노출**(설계서 §M251-D10).
  기본 shadow 루트 `.metrics251-shadow` 는 Git 비추적이며 현재 **미생성**.
- 이 Slice L 작업트리 변경: 생성 문서 3건(baseline .json/.md 재생성, 본 dossier),
  `PROGRESS.md`, `docs/AI_HANDOFF.md` 뿐. `public/`·`src/` 무변경.

---

## 5. 재인증 중 발견·시정한 항목 (1건)

**발견**: `test:metrics251-baseline` 이 **stale** 로 실패 → `docs/metrics-2.5.1-baseline.{json,md}`
가 Slice A 시점 라인번호를 그대로 갖고 있었다.

**원인**: Slice J 가 `src/lib/metrics.ts` 상단에 **주석 9줄**(버전 경계 라벨)을 추가하며
그 파일의 fallback/중복계산 마커 라인번호가 일괄 +9 이동(예 112→121, 57→66, 35→44).
기준선 문서는 그 라인번호를 소스계약 증거로 기록하므로 stale 이 됐다.

**시정**: `python scripts/metrics251_baseline.py` 로 결정적 재생성. diff 는 **오직 `"line":`
필드**(json 9마커·md 9마커)만 이동했고 **수치 baseline 은 불변**: 유니버스 138 · PER>0 137 ·
PBR>0 137 · 밸류제외 1(088980) · 순위후보 137(99.28%) · PER>100=24 · PER>500=8 · PBR>20=2.
재생성 후 baseline 테스트 통과. 공개 데이터·코드 로직은 건드리지 않았다.

**잔여 위험 노트**: 기준선 문서는 소스 라인번호를 인용하므로, 이후 `src/lib/metrics.ts`·
`scripts/compute_metrics.py` 편집 시 재생성이 필요하다(테스트가 stale 로 강제 감지).

---

## 6. diff/인코딩 위생

- `git diff --check` — whitespace/충돌마커 오류 **0**.
- U+FFFD(치환문자) 스캔 — 편집·신규 파일(baseline .json/.md, 본 dossier, PROGRESS.md,
  AI_HANDOFF.md) **0건**.

---

## 7. factor·순위 커버리지 (관측 기준선 · 새 점수 아님)

2026-07-14 스냅샷(`public/data/stocks.json`, 읽기전용) 기준. **이 값은 설명용 관측이며
2.5.1 최종 점수를 계산하지 않는다.** 실제 factor 모집단·rankingEligible 은 공개 승인 뒤
shadow 엔진(Slice D/E)이 확정한다.

| 항목 | 값 |
|---|---|
| 유니버스 | 138 |
| 순위 후보(관측) | 137 · **99.28%** |
| 순위 제외 | 1 (`088980`, 사유 `VALUE_MISSING_INPUT`, binding factor = value) |
| 밸류 유효(PER·PBR 양수) | 137 |
| 이상 재무값 | PER>100 = 24 · PER>500 = 8 · PBR>20 = 2 (제외 아님·품질경고 후보) |

설계서 §M251-D04 초기 안전선(rankingEligible ≥ 95%, UNKNOWN 사유 0)은 관측상 충족(99.28%,
UNKNOWN 0)이나 **최종 커버리지 허용선은 사람 결정**(설계서 §13).

---

## 8. 현재 shadow 게이트 상태

| 항목 | 값 |
|---|---|
| 롤아웃 판정 | **PENDING** · `rolloutCandidate=false` · 사유 `INSUFFICIENT_REAL_RUNS` |
| 실제 거래일 shadow run | **0** (승격 run 0 · `.metrics251-shadow` 미생성) |
| 후행 연속 성공일 | 0 (필요 5) |
| 창 전체 4-zero(P0/소스일/미지사유/공개누출) | 평가 불가 — run 부족 |
| 게이트 로직 검증 | fixture 19케이스로 증명(AND·연속초기화·합성금지) |

**5거래일을 조작하지 않는다**(설계서 §M251-D02·본 지침). 실제 창이 없으므로 `releaseReady=false`.

### 공개 승인 전 남은 정확한 증거(운영 입력 필요)

1. **실제 KRX 거래일 5일 연속** 비공개 shadow run 승격(Slice F 저장소).
   각 run: `QA_PASSED` manifest · 소스일 일치 · config/engine/input 해시 일치.
2. 5개 창 전체에서 **미해결 P0 mismatch 0 · source date mismatch 0 · 미지 제외사유 0 ·
   공개경로 누출 0**(Gate 4, §7).
3. run 별 **차등 증거 존재**(DIFFERENTIAL_MISSING 없음) — Slice H 하네스 산출.
4. 확정되면 `rollout:metrics251` 이 MET/`rolloutCandidate=true` 로 전환(코드 준비 완료).

날짜는 미정(`effectiveMarketDate` 미정). 위 5일은 실제 시장일에만 채워진다.

---

## 9. 설계서 보정결정(M251-D01..D10) 상태

| 결정 | 구현 slice | 상태 |
|---|---|---|
| D01 정본 책임 분리(YAML 증거·canonical config·Python 엔진·생성타입·골든) | B, J | ✅ 완료·계약검증 |
| D02 5일 AND 게이트 | K | ✅ 로직 완료 · ⏳ 실제 5일 run 대기 |
| D03 시점일관 역사 재실행·point-in-time 가드 | H | ✅ 완료(성과주장 금지 강제) |
| D04 유효성/품질경고/순위자격 분리 | E | ✅ 완료 · 🧑 최종 커버리지선 사람결정 |
| D05 3층(+rank) 비교 capability | G | ✅ 완료 |
| D06 위험조정·거래활성도 명칭 좁힘(3.5% hurdle·volumeActivity) | I | ✅ 완료·부인문구 |
| D07 manifest 원자적 승격 pointer | F | ✅ 완료·실패주입 |
| D08 운영경보/공개설명 상태 분리 | K(부분) | ⏳ 공개 UI 연결은 승인 뒤 별도 |
| D09 문서생성만으로 적합성 주장 금지 | 전 slice | ✅ 준수(증거=테스트 조합) |
| D10 shadow 비공개 자산 | F, 전 slice | ✅ 완료·public 누출 0 |

## 10. 원안 티켓 ORN-2501..2510 대응 상태

| 원안 티켓 | 보정 slice | 상태 | 증거/결정 |
|---|---|---|---|
| ORN-2501 설정/생성기 | B, J | ✅ 완료 | canonical config·생성 TS 계약·freshness --check |
| ORN-2502 단일 엔진 | C, D, J | ✅ 완료 | 순수 Python 엔진·TS 재계산 정적 차단 |
| ORN-2503 snapshot/pointer | F | ✅ 완료 | 원자적 승격·manifest 해시·실패주입 |
| ORN-2504 거래일/비교 | G | ✅ 완료 | 캘린더 adapter·4층 capability |
| ORN-2505 의미 상태 | I | ✅ 완료 | 안정 enum·공개후보 DTO·문구 key |
| ORN-2506 거래활성도 | I | ✅ 완료 | volumeActivity 명칭·구조적 부인 |
| ORN-2507 이력 UI | — | ⏸ 지연(deferred) | 설계서: 공개 승인 뒤 별도 작업 |
| ORN-2508 상태 집계 | K | ◐ 부분 | 로컬 보고서·게이트 완료 · 공개 화면 연결 지연 |
| ORN-2509 공시 분류 | — | ⏸ 지연(deferred) | 설계서: 기존 재검수 감사 후 별도 결정 |
| ORN-2510 공개 전환 | L | ◐ 준비만 | 준비 증거 완료 · **전환은 Gate 6 별도 승인** |

범례: ✅ 완료·증거 확보 · ◐ 부분/준비만 · ⏳ 실제 운영 run 대기(pending evidence) ·
🧑 사람 결정 대기 · ⏸ 설계서상 의도적 지연.

---

## 11. 소유자 공개 체크리스트 (Gate 5–6, 코드 밖 결정)

자동화 A–L 완료가 **출시 준비 완료를 뜻하지 않는다**(설계서 §13). 공개 전 필수:

- [ ] 실제 5거래일 연속 비공개 shadow run 승격 + Gate 4 4-zero 충족(§8).
- [ ] **사람 검수(Gate 5)**: 표본 종목 원시값·점수 수기 대조 · 신규/제외·큰 순위이동 검토 ·
      문구/상태/이력/공시 화면 검수.
- [ ] 이상 재무값(PER>100 24종 등)을 **경고 유지 vs 제외** 결정.
- [ ] 실제 rankingEligible 허용 커버리지선 확정(관측 99.28%).
- [ ] factor별 모집단·교집합 방식 최종 승인.
- [ ] 3.5% `fixedAnnualHurdleRate` 유지 기간 결정.
- [ ] point-in-time 재무 데이터 확보 범위(과거 종합 성과 주장 가능 구간) 결정.
- [ ] 공개 이력 UI 전환 방식(ORN-2507) 별도 작업 승인.
- [ ] 첫 `effectiveMarketDate` 지정.
- [ ] **Gate 6 소유자 명시 승인** 뒤에만 공개 pointer/API/화면/changelog/배포 전환.

이 결정들이 기록되기 전에는 Metrics 2.5.1 을 "출시 준비 완료"라 부르지 않는다.

---

## 12. 잔여 위험 요약

1. **실제 shadow 창 0** — `releaseReady=false`의 근본. 운영 입력으로만 해소(§8).
2. **point-in-time 재무 부재** — 과거 밸류·종합 성과 주장 금지 유지(D03). 확보 전 성과검증 불가.
3. **모멘텀 방향은 단일 블렌디드 원시값** — 다-기간 regime 표현은 시점별 개별 수익률 확보 후.
4. **기준선 문서의 소스 라인번호 결합** — metrics.ts/compute_metrics.py 편집 시 재생성 필요(§5).
5. **공개 UI 문구/상태 계약(ORN-2507/2508 화면)** — shadow 안정 후 사람 검수에서 확정(D08).

---

## 13. 다음 단계

- **코드 큐(A–L) 종료.** 추가 자동화 slice 없음. 이후는 운영·사람·소유자 트랙.
- **운영**: 실제 거래일 shadow run 배선(공개 승인·권한 회귀 검증 별도 slice 필요, D10).
- **사람**: Gate 5 검수 + §11 체크리스트.
- **소유자**: Gate 6 공개 승인 시 `effectiveMarketDate` 지정 후 별도 전환 작업.
- 본 배치는 push/deploy/public switch **없음**. 로컬 `[codex]` 커밋만.
