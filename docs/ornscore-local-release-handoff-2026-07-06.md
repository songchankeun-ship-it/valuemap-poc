# OrnScore 로컬 릴리스 핸드오프 팩 — 2026-07-06

> 목적: 현재 릴리스 통합 브랜치를 **오너 또는 다음 에이전트가 채팅 기록 없이** 그대로 이어받아 배포까지 진행할 수 있도록, 브랜치 상태·재확인 명령·배포 후 점검·오너 게이트·롤백을 한 문서에 못박는다.
> 이 문서는 **문서 전용**(Task 215)이며 앱 소스·점수식·`public/data/*`를 건드리지 않는다. 근거는 재서술하지 않고 레포 내부 문서로 링크한다.

## 무료 한국어 베타 v1 불변식 (배너)

- **공개 프레이밍 = 무료 한국어 베타 v1.** 138개 종목 탐색·데이터 도구. AI는 숨김(사용자 노출 없음).
- 유료/요금제 공개 프레이밍 금지. 매수·매도·추천·수익 보장 문구 **0**.
- KO/EN 토글 미노출(`DEFAULT_LOCALE="ko"`), `/pricing` 헤드라인 = "지금은 무료 베타예요".
- 데이터 기준: `count 138 · asOfBusinessDate 20260703 · metricsVersion 2.4 · source "FDR + Naver + yfinance"`.
- 상세 스코프 근거: [`docs/ornscore-free-beta-v1-scope.md`](./ornscore-free-beta-v1-scope.md).

---

## 1. 프리-핸드오프 체크리스트

배포 준비 담당(오너/다음 에이전트)은 아래를 순서대로 확인한다. 괄호 안 명령은 레포 루트에서 실행.

- [ ] **작업 트리 클린** — `git status --porcelain` 출력 없음(2026-07-06 확인: 클린).
- [ ] **origin 최신화 완료** — `git fetch origin` 후 상태 판정(§2).
- [ ] **현재 브랜치 확인** — `git rev-parse --abbrev-ref HEAD` = `ai-center/task-215-ornscore-local-branch-sync-guard-and`.
- [ ] **통합 브랜치 포함 관계** — `git merge-base --is-ancestor origin/main HEAD` = 참(origin/main이 HEAD의 조상). codex 통합 브랜치 `codex/ornscore-main-data-integration-20260705` tip == HEAD(`dbb24e0`) 확인.
- [ ] **게이트 재확인 가능성** — 아래 명령이 재현 가능함(직전 게이트 결과는 §3, 근거는 [`PROGRESS.md`](../PROGRESS.md) 2026-07-06 codex 항목):
  - `npx tsc --noEmit` → 0
  - `PYTHONUTF8=1 python scripts/verify_metrics.py` → 138종목·오류 0·금칙 0·Metrics 2.4
  - `npm run app:check` → 0 (단 실 Android `assetlinks.json`은 외부 오너 게이트 WAIT 1)
  - `npm run build` → 0 (176 static pages)
  - `npm run smoke:check -- --base http://localhost:<고유고포트> --all` → 23/23
  - `npm run perf:check -- --base http://localhost:<고유고포트>` → 0 advisory
  - 로컬 서버 안전: 고유 고포트 사용, 내가 띄운 PID만 종료, **AI Center 4310·전체 Node 종료 금지**.

---

## 2. 브랜치 통합 권고

- **캐리포워드 라인 = `ai-center/task-215-ornscore-local-branch-sync-guard-and`** (현재 HEAD, 로컬 전용·미push).
- 이 브랜치는 codex 통합 라인 `codex/ornscore-main-data-integration-20260705`를 **포함**한다(tip 동일: `dbb24e0`). 즉 2026-07-03 공개 데이터 refresh + 로컬 UI/카피/QA 개선이 한 브랜치에 합쳐진 상태를 그대로 이어받는다.
- **2026-07-06 상류 판정**: `git rev-list --left-right --count origin/main...HEAD` = **`0 102`**.
  - 왼쪽 0 = **origin/main에 HEAD가 놓친 커밋 없음** → 지금 통합할 상류 데이터 없음(**no integration needed**).
  - 오른쪽 102 = HEAD가 origin/main보다 앞선 로컬 개선 커밋 수.
- HEAD 최신 데이터 커밋 = `1ca2401 chore(data): daily refresh 2026-07-03T10:27Z`(origin/main tip과 동일).
- **향후 daily-data 커밋 처리 권고**: 이후 origin/main에 `public/data/*`만 만지는 daily refresh 커밋이 생기면, 그 커밋만 이 라인 위로 병합(fast-forward/merge)하는 것은 안전한 후보다. 단 **점수식·소스 데이터 로직은 절대 재작성하지 않는다**. 병합 시 해당 커밋 해시를 기록하고 §1 게이트를 재실행.
- 근거: [`PROGRESS.md`](../PROGRESS.md) 2026-07-05·2026-07-06 codex 항목, [`docs/AI_HANDOFF.md`](./AI_HANDOFF.md) 2026-07-05·2026-07-06 codex 노트.

---

## 3. 이미 완료된 검증 (직전 게이트 스냅샷)

2026-07-06 codex 릴리스 게이트에서 전부 통과(재서술 아님, 재확인 명령은 §1):

| 게이트 | 결과 |
| --- | --- |
| `npx tsc --noEmit` | 0 |
| `PYTHONUTF8=1 python scripts/verify_metrics.py` | 138종목 · 오류 0 · 금칙 0 · Metrics 2.4 |
| `npm run app:check` | 0 (외부 Android `assetlinks.json` 실서명 WAIT 1) |
| `npm run build` | 0 (176 static pages) |
| `npm run smoke:check --all` | 23/23 OK |
| `npm run perf:check` | 0 advisory warnings |
| 390px 브라우저 육안 | `/ /stocks /stock/005930 /status /pricing /login /watchlist` 가로 오버플로우·콘솔 에러 0, `베타 안내` 표시, KO/EN 미노출 |

근거: [`PROGRESS.md`](../PROGRESS.md) 2026-07-06 codex, [`docs/AI_HANDOFF.md`](./AI_HANDOFF.md) 2026-07-06, [`docs/ornscore-owner-review-2026-07-04.md`](./ornscore-owner-review-2026-07-04.md), [`docs/ornscore-local-release-evidence-2026-07-03.md`](./ornscore-local-release-evidence-2026-07-03.md), [`docs/ornscore-route-smoke-checklist.md`](./ornscore-route-smoke-checklist.md).

> **Task 215 게이트(문서 전용)**: `tsc --noEmit` 0 · `verify_metrics.py` 138/0/0/Metrics 2.4 · 신규/편집 `.md` U+FFFD 0 · `git diff --check` 클린. build/smoke/perf는 앱 소스 무변경이라 재실행 생략(Task 166·177·178·194 docs-only 관행). 직전 QA(2026-07-06 codex) 결과 유효.

---

## 4. 사이트 새로고침 후 캐시버스트 라우트 체크리스트

배포(main 반영 후 Vercel 재배포) **후에** 아래 공개 라우트를 캐시버스트로 재확인한다. 브라우저 하드 리로드 또는 쿼리스트링(`?v=<타임스탬프>`)으로 CDN/브라우저 캐시를 우회.

기대값: **`2026.07.03`/`07.03(금)` 데이터** · `베타 안내` 표시 · KO/EN 토글 미노출 · `/pricing` "지금은 무료 베타예요" · stale `요금제` 문구 미노출 · 콘솔 에러 0.

- [ ] `/` — 홈, 오늘 데이터 기준일 `2026.07.03`, `베타 안내`
- [ ] `/status` — 데이터/시스템 상태, `2026.07.03`
- [ ] `/about` — 서비스 소개, 무료 베타 프레이밍
- [ ] `/pricing` — 헤드라인 "지금은 무료 베타예요", stale `요금제` 없음
- [ ] `/stocks` — 138종목 탐색, KO/EN 미노출
- [ ] `/stock/005930` — 종목 상세(삼성전자), 데이터 기준일·지표 렌더
- [ ] `/login` — 이메일 매직링크 + 카카오/구글/네이버 진입, `?next=` 문맥 유지
- [ ] `/watchlist` — 관심 종목(비로그인 시 로그인 CTA graceful)

근거·명령: [`docs/ornscore-route-smoke-checklist.md`](./ornscore-route-smoke-checklist.md)(`smoke:check --all` 23라우트), [`docs/ornscore-local-release-evidence-2026-07-03.md`](./ornscore-local-release-evidence-2026-07-03.md) (f)절.

---

## 5. 오너 게이트 (외부·실기기·법무 — 로컬에서 대신 못 함)

배포 전 **오너만** 통과시킬 수 있는 4개 게이트. 로컬 에이전트는 노트/체크리스트만 남긴다(외부 서비스 액션 금지).

- [ ] **실기기 390px 육안** — 실제 모바일(390px 폭)에서 `/ /stocks /stock/005930 /status /pricing /login /watchlist` 가로 오버플로우·레이아웃 깨짐 없음 육안 확인. (로컬은 헤드리스 390px까지만 확인됨.)
- [ ] **실제 OAuth 왕복** — 카카오/구글/네이버 로그인을 실제로 제출해 콜백·세션 복귀까지 왕복 확인. (로컬은 진입 버튼 렌더까지만, 제출 안 함.)
- [ ] **Android `assetlinks.json` 실 SHA-256 지문** — 실 서명 키의 SHA-256 지문으로 `assetlinks.json` 생성·배치(현재 `app:check`가 WAIT 1로 표시하는 항목). 근거: [`docs/AI_HANDOFF.md`](./AI_HANDOFF.md) Task 128.
- [ ] **법무/결제 승인** — 유료화·결제·법무 문구는 오너·법무 게이트 뒤에서만. 무료 베타 v1 프레이밍 유지 중에는 결제 노출 금지.

이 4개 완료 → 이 브랜치로 main 반영·배포 → §4 캐시버스트 재확인.

---

## 6. 롤백 노트

- **현재 상태 = 로컬 전용·미push·미배포.** 그래서 지금 시점 롤백 비용은 사실상 0.
  - 그대로 유지: 이 브랜치에 머무름(`ai-center/task-215-...`).
  - 되돌리기: `git switch <다른 브랜치>`로 이탈하면 이 라인은 그대로 보존됨.
  - 커밋 취소: 이번 문서 커밋을 물리려면 `git reset --hard <직전 커밋 dbb24e0>` (로컬 한정, 원격 영향 없음).
- **배포 이후 롤백(오너가 merge+deploy 한 뒤)**: main에 병합·배포한 상태에서 문제가 생기면 **머지 커밋을 revert**(`git revert -m 1 <merge-sha>`) 후 재배포. 데이터·점수식은 revert로 건드리지 않는다.
- 현재까지 배포·push를 수행하지 않았으므로 **사이트 롤백 불필요**.

---

## 다음 액션 (한 줄)

오너가 §5의 4개 게이트(실기기 390px·OAuth 왕복·Android assetlinks 실지문·법무/결제)를 통과시킨 뒤, 이 브랜치 `ai-center/task-215-ornscore-local-branch-sync-guard-and`로 main 반영·배포하고 §4 캐시버스트 라우트를 재확인한다. push/deploy/외부 서비스 액션은 전부 오너 몫(로컬 에이전트는 미수행).
