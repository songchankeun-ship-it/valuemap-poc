# ORNScore Metrics 2.5.1 — 운영 층(Slice M–Q) 재인증 · 비공개 운영자 핸드오프 & 런북 (Slice R)

> 상태: **운영 층(M–Q) 로컬 재인증 완료 · 공개 미승인 · 실제 shadow run 0**
>
> 공개 정본: **Metrics 2.4 유지 (바이트 불변 — Git blob 동일성으로 증명, §4)**
>
> `releaseReady`: **false** · `actualRuns`: **0** · `rolloutCandidate`: **false** ·
> 게이트: **PENDING** (`INSUFFICIENT_REAL_RUNS`) — 실제 5거래일 연속 승격 run 미완료
>
> 재인증 시점 HEAD: `fefb9b9` · 브랜치 `ai-center/task-312-ornscore-metrics-2.5.1-r-local-opera`
>
> 작성일: 2026-07-16 · 근거 설계서: `docs/ornscore-metrics-v2.5.1-amendment-2026-07-15.md`
> · 선행 재인증(A–K): `docs/metrics-2.5.1-recertification-dossier.md` (Slice L)

이 문서는 **운영 층(Slice M–Q)의 로컬 재인증과 운영자 핸드오프/런북**이다. 공개 산식 전환·push·
deploy·pointer 교체·실제 거래일 run 착수는 **포함하지 않는다.** 실제 시장일 run 은 소유자의
명시적 별도 승인(Gate 6, 설계서 §7)이 있을 때에만, 아래 §6 런북 순서로 착수한다.

---

## 1. 한 줄 결론

Slice M–Q 의 **일일 shadow 운영 층**(preflight·원자적 run·증거 원장·운영자 상태·종단 fault
matrix)은 로컬에서 **결정적·계약 검증**되고, 공개 Metrics 2.4 데이터/코드는 이 배치(M–Q) 전체에서
**Git blob 동일성으로 불변**임이 증명됐다. 그러나 설계서 §M251-D02/§7 Gate 4 가 요구하는 **실제
5거래일 연속 비공개 shadow run 이 0개**이므로 `releaseReady=false`·`actualRuns=0`이다. 남은 것은
코드가 아니라 **실제 거래일 운영 창 + 사람 검수(Gate 5) + 소유자 공개 승인(Gate 6)**이며, 이는
아래 §7·§8에 결정 목록으로만 남기고 **수행하지 않는다.**

---

## 2. 재인증 게이트 결과 (전부 이 세션 HEAD `fefb9b9`에서 실행)

전 focused 계약(A–K)과 운영 층(M–Q)을 모두 재실행했다. 결과 전부 통과.

### 2.1 공개 정본 무결성 + 타입/위생

| # | 게이트 | 명령 | 결과 |
|---|---|---|---|
| 1 | TypeScript 타입체크 | `npx tsc --noEmit` | ✅ exit 0 |
| 2 | 공개 Metrics 2.4 검증기 | `PYTHONUTF8=1 python scripts/verify_metrics.py` | ✅ 138종목·오류0·브랜드금칙0·버전 **2.4** |
| 3 | diff 위생 | `git diff --check` | ✅ whitespace/충돌마커 0 (§9) |
| 4 | 인코딩 | 편집·신규 파일 U+FFFD 스캔 | ✅ 0건 (§9) |

### 2.2 기반 계약 층(A–K) 재인증

| 게이트 | 명령 | 결과 |
|---|---|---|
| config 경계+canonical | `config:metrics251:check` | ✅ FRESH · configHash `7bf1e3a1f989…` · canonical 3361B |
| config 계약 | `test:metrics251-config` | ✅ |
| 기준선 | `test:metrics251-baseline` | ✅ (재생성 불필요 — 소스 라인번호 불변) |
| 원시 함수 | `test:metrics251-primitives` | ✅ |
| 순수 엔진 | `test:metrics251-engine` | ✅ 골든 바이트 일치 |
| 자격/품질/모집단 | `test:metrics251-eligibility` | ✅ |
| 불변 snapshot·pointer | `test:metrics251-snapshot-store` | ✅ |
| 거래일·4층 비교 | `test:metrics251-compare` | ✅ |
| 역사/차등 재실행 | `test:metrics251-replay` | ✅ |
| 의미상태 projection | `test:metrics251-projection` | ✅ |
| TS 계약 생성 최신성 | `contract:metrics251:check` | ✅ FRESH (contract.json sha256 `9d59bc49b659…` · generated.ts sha256 `79b9e15dc9ef…`) |
| TS 읽기계약·재계산 차단 | `test:metrics251-contracts` | ✅ |
| 5일 AND 롤아웃 게이트 | `test:metrics251-rollout-gate` | ✅ AND(OR 아님)·합성금지 |

### 2.3 운영 층(M–Q) 재인증 — 본 Slice의 핵심

| Slice | 게이트 | 명령 | 결과 |
|---|---|---|---|
| M | 날짜 박힌 run preflight 계약 | `test:metrics251-preflight` | ✅ 순수·fail-closed·public 배제 |
| N | 원자적·멱등 단일 시장일 run | `test:metrics251-run` | ✅ PUBLISHED/NOOP/REJECTED·부분실패=pointer 무변경 |
| O | append-only 증거 원장 + 게이트 재생성 | `test:metrics251-ledger` | ✅ hash-chain·중복/충돌·PENDING 보존 |
| P | 읽기 전용 운영자 상태(8상태) | `test:metrics251-operator` | ✅ READY/…/GATE_PENDING·next-actions 결정적 |
| Q | 종단 fault matrix(11) + genuine-run 게이트 | `test:metrics251-e2e` | ✅ 합성마커 산출물 거부·5연속 MET은 fixture 위에서만 |

**라이브 운영자 상태 확인**(읽기 전용, 저장소 미생성 확인):

```
$ PYTHONUTF8=1 npm run operator:metrics251 -- --json
operatorState: GATE_PENDING
gate.status: PENDING · actualRuns: 0 · trailingConsecutivePassingRuns: 0 · rolloutCandidate: false
meta.computesPublicScore: false · readOnly: true
```

실행 후 `.metrics251-shadow/`는 **여전히 미생성** — operator 는 읽기 전용임을 재확인.

---

## 3. 공개 Metrics 2.4 무변경 증명 — Git blob 동일성 (배치 M–Q)

**증명 방식**: 공개 정본 파일의 **Git blob 오브젝트 id**(git 이 내용에 부여하는 정체성)를 배치
경계 커밋들과 작업트리에서 비교한다. blob id 가 같으면 바이트가 같다(정의상).

| 파일 | 커밋/트리 | Git blob id | 판정 |
|---|---|---|---|
| `public/data/stocks.json` | `6ce642e` (A–K 이전) | `f2243814819cbcbc2255a3e9f213012149fc78e3` | 기준 |
| " | `63a748f` (Slice L HEAD) | `f2243814819cbcbc2255a3e9f213012149fc78e3` | ✅ 동일 |
| " | `ebcef9e` (Slice M) · `fefb9b9` (Slice Q/HEAD) | `f2243814819cbcbc2255a3e9f213012149fc78e3` | ✅ 동일 |
| " | 작업트리(`git hash-object`) | `f2243814819cbcbc2255a3e9f213012149fc78e3` | ✅ 동일 |
| `src/lib/metrics.ts` | `63a748f` → `fefb9b9` (M–Q 전 구간) | `8d217ca5ab7a6c1b305c6680985119bf6863a067` | ✅ 동일 |

- **커밋 바이트 sha256 교차확인**: `git cat-file blob HEAD:public/data/stocks.json | sha256sum` =
  **`c225c09a86f5a595943f5aff4480c451009788e3d10bb769b23d4fdf5f137185`** — Slice L 도시에가 기록한
  `c225c09a86f5a595…`와 **일치**. (작업트리 파일의 sha256 은 CRLF 차이로 다를 수 있으나, blob id 는
  동일 = 저장소 정체성 불변.)
- **경로 diff**: `git diff --stat 59a675e HEAD -- public/` = **빈 출력** · `... -- src/` = **빈 출력**.
  → 배치 M–Q 는 `public/`·`src/` 파일을 **0건** 건드렸다.
- `metrics251_*` 운영 스크립트는 fixture·비공개 저장소 입력만 읽고, **공개 산식/데이터/라우트/타입에
  쓰기·import 하지 않는다**(각 스크립트 헤더 §M251-D10 · TS 재계산 차단 계약으로 강제).
- 기본 shadow 루트 `.metrics251-shadow/`는 `.gitignore` 제외이며 현재 **미생성**(§5).

**결론**: 공개 Metrics 2.4 값·타입·동작은 M–Q 배치에서 **바이트 불변**, `metricsVersion` **2.4** 유지
(검증기 #2 확인).

---

## 4. 운영 층(Slice M–Q) 구조 요약 — "무엇을 조립하는가"

각 층은 **새 산식/게이트를 만들지 않고** 기존 계약 층(A–K)을 조립·검증만 한다.

| Slice | 명령(npm) | 스크립트 | 역할 | 부수효과 |
|---|---|---|---|---|
| **M** preflight | `preflight:metrics251` | `metrics251_preflight.py` | 시장일·소스일·해시·필수입력·비공개 레이아웃·public 배제를 **계산 전** 계약 검증(fail-closed) | **없음**(순수 판정) |
| **N** run | `run:metrics251` | `metrics251_run.py` | preflight→엔진(D)→자격(E)→비교(G)→저장소(F) 를 조립해 **원자적·멱등**으로 한 시장일 스냅샷 승격 | **비공개 저장소 쓰기**(pointer 교체는 store publish 마지막 단계에서만) |
| **O** ledger | `ledger:metrics251` | `metrics251_ledger.py` | QA_PASSED 불변 manifest 에서만 파생하는 **append-only 증거 원장**(hash-chain) + 롤아웃 게이트 문서 재생성 | 저장소 `ledger.json` append · `docs/metrics-2.5.1-rollout-gate.{json,md}` 재생성 |
| **P** operator | `operator:metrics251` | `metrics251_operator.py` | 대상 시장일에 대해 **8 상태**(READY/ALREADY_RECORDED/MISSING_INPUT/STALE_SOURCE/CONFLICT/PARTIAL_RUN/QA_FAILED/GATE_PENDING) + 안전한 next-actions 를 결정 | **없음**(읽기 전용) |
| **Q** e2e matrix | `e2e:metrics251` | `metrics251_e2e_matrix.py` | preflight→run→gate 를 **11 fault 시나리오**로 종단 실행 + **genuine-run 게이트**로 합성마커 산출물 거부 | 임시 fixture 루트(호출자 공급)만 |

원자성·멱등: `runId`/`snapshotId` 는 `engineVersion+configHash+inputManifestHash+marketDate` 에서
결정적으로 파생 → 바이트 동일 재실행 = **NOOP**, 같은 날 다른 입력 = **REJECTED(SAME_DATE_CONFLICT)**,
불변 위치 미덮어쓰기.

---

## 5. 비공개 증거 위치 (절대 커밋 금지)

- 기본 루트: **`.metrics251-shadow/`** (`ROOT/.metrics251-shadow`) — `.gitignore` 로 제외됨(§M251-D10).
  현재 **미생성**. 실제 run 착수 시 여기에만 `runs/`·`pointer`·`ledger.json` 이 생성된다.
- `--root` 로 대체 비공개 루트 지정 가능하나 **public/ 하위로 resolve 되면 preflight/store 가 즉시
  실패**(fail-closed)한다.
- **docs/ 로 나가는 것은 롤아웃 게이트 요약(`metrics-2.5.1-rollout-gate.{json,md}`)뿐**이다. 이는 공개
  전환 승인 근거가 아니라 로컬 준비 상태 요약이다(문서 `meta.note` 명시).

---

## 6. 실제 시장일 run 런북 (소유자 명시 승인 뒤에만 착수)

> ⚠️ **전제**: Gate 6 소유자 명시 승인 + 첫 `effectiveMarketDate` 지정 후에만 실행. 아래는 **명령
> 시퀀스의 정본 기록**이며, 이 세션에서 **실행하지 않는다**(실제 KRX 입력·5거래일 조작 금지, §M251-D02).
> 모든 명령은 레포 루트에서, Windows 콘솔은 `PYTHONUTF8=1` 로(cp949 한글 안전).

### 6.1 각 거래일 D 준비 입력(실데이터, 합성마커 없음)

- `request-D.json` — `{ marketDate: "YYYY-MM-DD", sourceDates: {prices, volumes, fundamentals}, stocks: [{ticker, prices, volumes, per, pbr} × 실제 138종목] }`.
  `expected` pin 을 명시하지 않으면 run 이 입력에서 결정적으로 파생한다(`derive_expected`). 소스일은
  실제 데이터 기준일과 일치해야 하며 미래/stale 이면 preflight 가 STALE_SOURCE 로 차단.
- `calendar.json` — 실제 KRX 거래일 캘린더 fixture(연속성 판정용).
- config 정본 — `config/metrics/2.5.1.json`(canonical configHash `7bf1e3a1f989…`).

### 6.2 하루치 순서 (거래일 D마다 반복)

```bash
# (1) 운영자 READY 판정 — 읽기 전용. operatorState == READY 를 확인한 뒤에만 진행.
PYTHONUTF8=1 npm run operator:metrics251 -- \
  --request request-D.json --config config/metrics/2.5.1.json \
  --calendar calendar.json --json
#   READY            → (2) 진행
#   MISSING_INPUT / STALE_SOURCE / CONFLICT / PARTIAL_RUN / QA_FAILED → next-actions 대로 시정, 게시 금지
#   ALREADY_RECORDED → 이 날은 이미 기록됨(멱등) → (2) 생략, (3)으로

# (2) 원자적·멱등 게시 — 유일한 쓰기 명령. status == PUBLISHED(또는 재실행 시 NOOP) 확인.
PYTHONUTF8=1 npm run run:metrics251 -- \
  --request request-D.json --config config/metrics/2.5.1.json \
  --calendar calendar.json --json
#   PUBLISHED → 새 스냅샷 승격 · NOOP → 바이트 동일 재실행 · REJECTED → 충돌/부분실패(pointer 무변경)

# (3) 증거 원장 append + 롤아웃 게이트 문서 재생성 — QA_PASSED manifest 만 채택.
PYTHONUTF8=1 npm run ledger:metrics251 -- --calendar calendar.json --json
#   APPENDED → 새 시장일 · DUPLICATE → 멱등 · CONFLICT → 거절(원장 불변)

# (4) 5일 AND 게이트 판정 확인(단일 출처, 합성 금지).
PYTHONUTF8=1 npm run rollout:metrics251
#   PENDING(actualRuns<5) → 계속 축적 · MET(5연속 + 창 전체 4-zero) → rolloutCandidate=true
```

### 6.3 창 완성 조건 (Gate 4, 설계서 §7)

5개 **실제 연속 KRX 거래일** run 이 각각 QA_PASSED 이고, 창 전체에서 다음 **4-zero**:
`unresolvedP0 = 0` · `sourceDateMismatch = 0` · `unknownExclusionReason = 0` · `publicPathLeakage = 0`.
+ run 별 차등 증거 존재(DIFFERENTIAL_MISSING 없음). 이때에만 게이트 **MET**·`rolloutCandidate=true`.

**게이트 MET ≠ 공개.** 그 뒤 사람 검수(Gate 5) + 소유자 명시 승인(Gate 6)이 있어야 공개
pointer/API/화면/changelog/배포 전환을 **별도 작업으로** 진행한다.

### 6.4 실패/롤백

- 어느 게이트든 실패하면 pointer 는 무변경(원자성) — 시정 후 재실행. 부분 실패 흔적(PARTIAL_RUN)은
  operator next-actions 대로 정리 후 재run.
- 같은 시장일 CONFLICT(다른 입력이 이미 승격)는 불변 위치를 덮어쓰지 않는다 — 입력/소스일을
  재검증한다(어느 쪽이 정본인지 사람 판단).
- 연속성 초기화: 거래일 누락 시 게이트가 NOT_MET 으로 창을 리셋(합성으로 메우지 않는다).

---

## 7. 남은 사람/소유자 결정 (나열만 — 이 세션에서 수행 안 함)

설계서 §13 · 선행 도시에 §11 을 운영 층 관점으로 유지. **자동화 A–Q 완료가 출시 준비를 뜻하지
않는다.**

- [ ] **실제 5거래일 연속 비공개 shadow run** 승격 + Gate 4 4-zero 충족(§6.3) — 실제 시장일에만.
- [ ] 첫 `effectiveMarketDate` 지정(현재 미정).
- [ ] 실제 KRX 138종목 입력·소스일 pin·거래일 캘린더의 운영 배선 방식 확정(권한/회귀 검증 별도).
- [ ] **사람 검수(Gate 5)**: 표본 종목 원시값·점수 수기 대조 · 신규/제외·큰 순위이동 검토 ·
      문구/상태/이력/공시 화면 검수.
- [ ] 이상 재무값(PER>100 등)을 **경고 유지 vs 제외** 결정 · rankingEligible 허용 커버리지선 확정.
- [ ] factor별 모집단·교집합 방식 · 3.5% hurdle 유지 기간 · point-in-time 재무 확보 범위 결정.
- [ ] 공개 이력/상태 UI 전환(ORN-2507/2508) 별도 작업 승인.
- [ ] **Gate 6 소유자 명시 승인** 뒤에만 공개 pointer/API/화면/changelog/배포 전환.

이 결정들이 기록되기 전에는 Metrics 2.5.1 을 "출시 준비 완료"라 부르지 않는다.

---

## 8. 합성 방지 · 정직성 계약

- **releaseReady/actualRuns 정직성**: 현재 `actualRuns=0`·`rolloutCandidate=false`·`status=PENDING`
  (`INSUFFICIENT_REAL_RUNS`). 이 값은 저장소 실측에서만 파생되며 **합성하지 않는다**.
- **genuine-run 게이트(Slice Q)**: e2e matrix 가 만드는 모든 fixture 산출물은 합성-테스트 마커를
  싣고, 별도 게이트가 그 마커를 실은 산출물을 **거부**한다. fixture 위의 "5연속 MET" 시연은 실제
  거래일 증거로 세탁될 수 없다(§M251-D02: 5거래일을 조작하지 않는다).
- **결정성**: 벽시계/난수/네트워크 금지 — 전 운영 스크립트가 fixture·저장소 입력에서만 파생.

---

## 9. diff/인코딩 위생

- `git diff --check` — whitespace/충돌마커 오류 **0**.
- U+FFFD(치환문자) 스캔 — 편집·신규 파일(본 런북, `PROGRESS.md`, `docs/AI_HANDOFF.md`) **0건**.

---

## 10. 다음 단계

- **코드 큐(A–Q) 종료.** 추가 자동화 slice 없음. 이후는 운영·사람·소유자 트랙(§6·§7).
- **운영**: Gate 6 승인 후 §6 런북 순서로 실제 거래일 run 배선·착수(권한 회귀 검증 별도).
- 본 배치는 push/deploy/public switch **없음**. 로컬 `[codex]` 커밋만.
