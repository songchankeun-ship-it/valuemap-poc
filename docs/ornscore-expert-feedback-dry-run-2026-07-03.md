# 오른스코어 전문가 피드백 인테이크 루프 — 드라이런 노트 (Task 154)

> **목적:** `docs/ornscore-expert-feedback-intake-template.md`(Task 129) 루프를 실제로 한 번 돌려, **미래의 외부 피드백 한 편이 messy 중복 task 없이 깔끔한 P0/P1/P2 작업으로 변환되는지** 증명한다.
> **성격:** 문서/프로세스 전용 드라이런. 앱 소스·점수식·`stocks.json`·인증/provider/env·라우트·의존성·외부 서비스 무변경. 실제 신규 broad 백로그를 만들지 않는다(방출은 P2 코드 task 예시 1건, 나머지는 거부/드롭/운영자 라우팅으로 종결).
> **작성:** 2026-07-03 (Task 154, [claude]). 브랜치 `ai-center/task-154-ornscore-expert-feedback-loop-dry-ru`(클린 시작).
> **교차 문서(복사 대신 참조):** [`ornscore-expert-feedback-intake-template.md`](./ornscore-expert-feedback-intake-template.md)(루프 원본) · [`ornscore-qa-feedback.md`](./ornscore-qa-feedback.md)(Task 48) · [`ornscore-post-release-qa-2026-07-02.md`](./ornscore-post-release-qa-2026-07-02.md)(Task 127) · [`ornscore-spec-coverage.md`](./ornscore-spec-coverage.md) · [`ornscore-free-beta-v1-scope.md`](./ornscore-free-beta-v1-scope.md)(불변식 원문).

---

## 1. 인테이크 대상 (SAMPLE)

- **리포트 출처:** SAMPLE — 가상 외부 전문가/QA 리포트(드라이런용, **실제 신규 리포트 아님**). 각 항목은 **기존 알려진 이슈**(Task 48·Task 127) 또는 명백한 scope-creep 예시에서 조립.
- **인테이크 일자:** 2026-07-03
- **브랜치:** `ai-center/task-154-ornscore-expert-feedback-loop-dry-ru`
- **사용 표(§7):** 이번 드라이런은 개선된 §7 표(신규 두 칸 = **이미 추적/완료?** dedup · **운영자 전용?** 라우팅)를 그대로 사용해, 중복 task 방지 칸이 실제로 작동하는지 함께 검증한다.

---

## 2. 배치 인테이크 표 (§7 적용 · 4개 경로 시연)

| # | 원문 항목(인용) | 카테고리(§4) | Severity(§5) | 이미 추적/완료?(spec-coverage 대조) | 운영자 전용? | 매핑 파일/문서 | 검증 게이트(§6) | task 프롬프트(§5) / 처분 | 완료 기준 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | "종목 상세에 '목표가'와 '이번 주 매수 후보 Top 픽'을 넣어 사용자가 바로 행동하게 하자." | C1 금융 문구 안전 | — (불변식 가드 탈락, severity 미배정) | 해당 없음 — 불변식 위반 항목 | 아니오 (반영 자체 불가) | §2 **INV-5**(비자문 고지 유지) | 없음 | **방출 안 함 — INV-5(비자문) 위반, 거부.** 목표가·매수 후보·강력 추천은 금칙어. 코드 task 생성 금지. | N/A — scope-creep 거부 경로 |
| 2 | "'/status'에선 공시가 '최근 7일·최신 200건'인데 종목 상세엔 90일 공시가 보인다 — 표면 간 모순처럼 읽힌다." | C3 데이터 신뢰/날짜 정합 | **P2** | **부분 — 중복 아님.** Task 110 P1-4에서 기간 배지(`disclosureExplorerCopy.periodScopeBadge`)는 추가됨. 단 `/status`·신뢰 모달 글로벌 공시 한 줄이 "시장 피드 7일 / 종목별 90일" 차이를 흡수하는 문구는 **미반영** → 신규 여지 있음. | 아니오 | `src/lib/dataStatus.ts`·신뢰 모달 공시 문구(참조: Task 48 P2-1 `dataStatus.ts:154`) | `npx tsc --noEmit` · `PYTHONUTF8=1 python scripts/verify_metrics.py` · `/status` SSR 공시 문구 grep | **[범위]** `/status`·신뢰 모달 공시 상태 한 줄에 "시장 전체 피드=최근 7일(최신 200건), 종목별 상세=최근 90일" 범위 차이를 흡수(표시 문구 1~2줄). **[불변식 유지]** 무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보 유지. **[하드 제약]** 로컬 docs/소스만 · 점수식·`stocks.json`·인증/provider/env·DB 스키마·라우트 의미·의존성 무변경 · 신규 npm 0 · 공시 쿼리/기간 로직 무변경(문구만). **[검증 게이트]** `tsc --noEmit` 0 · `verify_metrics.py` 138/금칙0/Metrics 2.4 · `/status` SSR 공시 문구 grep. **[완료 기준]** 표면 간 범위 모순 0(문구가 두 범위를 명시) · 게이트 통과. **[비목표]** push/릴리스 미수행(로컬 커밋만) · 공시 파이프라인/기간 수집 변경 없음. | `/status`·신뢰 모달 공시 문구가 두 범위를 명시해 표면 간 모순 0, 게이트 전부 통과 |
| 3 | "베타 공개 전 실제 데스크톱(≥1280px)/390px 브라우저에서 가로 넘침·텍스트 겹침·콘솔 오류를 육안 확인해야 한다." | C2 모바일 레이아웃 / C8 운영자 전용 | **P1** | **예 — 이미 추적.** Task 48 **P1-VISUAL**로 상시 추적, Task 127에서 승계·미해소(Playwright 미구성). spec-coverage C절 18. | **예** (§8 운영자 육안 게이트) | §8 운영자 버킷 · Task 48 §3 | 없음 — 자동 시각 게이트 미구성(코드로 못 닫음) | **코드 task 방출 안 함 → §8 운영자 육안 게이트로 라우팅.** (중기: Playwright 스냅샷 CI = 신규 dev 의존성 결정, 범위 밖·운영자.) | 운영자가 데스크톱/390px 육안 1회 통과(코드 task 아님, §8 잔여) |
| 4 | "종목 상세 '먼저 확인할 것' 번호가 '1. 1'처럼 중복돼 보인다 — STEP 배지로 정리 필요." | —(완료 항목, 신규 결함 아님) | — (재기재 안 함) | **예 — 이미 ① 완료.** spec-coverage §8 A§3/I [P0-1](Task 60)에서 `BeginnerReading.tsx` STEP 카드로 교체, 최종 P0-2(Task 68) 재검증에서 `1. 1` 중복 0 확인. | 아니오 | `BeginnerReading.tsx` (이미 수정 완료) | 없음(회귀 감시만) | **방출 안 함 — 이미 완료(spec-coverage 대조). 신규 task로 재기재 금지.** ← 이 드라이런의 핵심(중복 task 드롭). | N/A — 중복 드롭 경로 |

**요약:** 4행 = **거부(INV-5)** · **P2 코드 task 방출 1건** · **P1 운영자 버킷 라우팅** · **중복 완료 항목 드롭**. 실제 방출된 자동화 task는 2행 1건뿐(broad 신규 백로그 생성 없음).

---

## 3. 드라이런이 증명한 것 / 발견한 갭

- **증명 1 — scope-creep 거부:** INV-5(비자문) 위반 항목(목표가·매수 후보)이 §2 가드에서 severity 배정 전에 걸러져 코드 task로 방출되지 않음. "리포트가 시켰으니"로 금칙어를 넣지 않는다는 규칙이 실제로 작동.
- **증명 2 — 중복 task 방지:** 이미 완료된 STEP 번호 중복(Task 60/68) 항목이 **spec-coverage 대조 칸**에서 걸려 신규 task로 재기재되지 않고 근거만 남기고 드롭. 이 dry run의 목표(messy 중복 없음) 달성.
- **증명 3 — 운영자 라우팅:** P1-VISUAL이 "운영자 전용?" 칸으로 §8 버킷에 라우팅되어 자동화 task와 섞이지 않음(코드로 못 닫는 게이트 분리).
- **증명 4 — 깨끗한 방출:** 실제 여지가 남은 P2-1(공시 범위 문구)만 §5 6필드로 방출 준비 — 단일·검증 가능·비트리거 표현("로컬 커밋만"·"push/릴리스 미수행"). 거짓 승인 트리거(§5-A) 표현 사용 0.
- **발견한 갭(→ 템플릿 개선 반영):** 원본 §7 표에는 "이미 추적/완료?"(dedup) 칸과 "운영자 전용?" 플래그가 없어, 중복 방지·운영자 분리가 규칙 문장에만 있고 표에 **강제되지 않았다.** 이번에 두 칸을 additive로 추가(§7 헤더/예시행 + §7-A 방출 규칙 2줄). priority(§3/§7 severity)·verification(§6/§7 게이트/§5 [검증 게이트])·safety(§2 불변식·§5-A·톤 규칙)는 이미 충분 → 무변경.

> 참고: 이 드라이런은 어떤 것도 "승인·출시 확정"으로 만들지 않는다. 2행 P2 task는 방출 **준비**일 뿐이며 실제 실행/커밋/릴리스는 별도 결정이다. 실 릴리스·`main` 머지·외부 계정 변경은 §8 운영자 게이트로 남는다.

---

## 4. 검증 (문서 전용)

- **`npx tsc --noEmit`** — exit 0 기대(소스 무변경 증명: `.ts`/앱 소스 무수정, docs만 변경 → 템플릿 §6 규칙대로 이 게이트만으로 충분).
- **`git diff --check`** — 전역 CRLF 노이즈만(이 리포 특성), 실 whitespace 오류 0 기대.
- `npm run build`/`app:check`/`perf:check` 불필요 — 앱 소스·라우트·`<head>` 무변경(문서 전용). 모바일/데스크톱 런타임 영향 0.
- 신규/변경 문서 U+FFFD 치환문자 0 · 한국어 정상 렌더 확인.
- 산출물: 이 노트 + `ornscore-expert-feedback-intake-template.md` additive 2편집 + `PROGRESS.md`/`AI_HANDOFF.md`/`ornscore-spec-coverage.md` 포인터. 브랜치 로컬 커밋만(푸시/머지/릴리스 미수행).
