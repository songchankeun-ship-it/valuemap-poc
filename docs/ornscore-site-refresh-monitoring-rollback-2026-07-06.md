# OrnScore 사이트 새로고침 모니터링 · 롤백 노트 — 2026-07-06

> 목적: 오너가 외부 사이트를 **새로고침(main 반영 후 Vercel 재배포)** 한 **직후**, 다음 에이전트/오너가 채팅 기록 없이 (1) 무엇을 즉시 확인하고 (2) 언제 롤백하며 (3) 무엇을 `PROGRESS.md`에 남길지를 한 문서에 못박는다.
> 이 문서는 **문서 전용**(Task 220)이며 앱 소스·점수식·`public/data/*`·`direction`·`metricsVersion`를 건드리지 않는다. 근거는 재서술하지 않고 레포 내부 문서/스크립트로 링크한다.
> 성격: 릴리스 라인을 **되돌릴 수 있고(reversible) 관찰 가능하게(observable)** 만드는 첫 노트. 실행은 오너 게이트, 이 문서는 그 실행 절차만 고정한다.

## §0. 무료 한국어 베타 v1 불변식 (배너) + 상류 노트

- **공개 프레이밍 = 무료 한국어 베타 v1.** 138개 종목 탐색·데이터 도구. AI는 숨김(사용자 노출 없음).
- 유료/요금제 공개 프레이밍 금지. 매수·매도·추천·수익 보장 문구 **0**.
- KO/EN 토글 미노출(`DEFAULT_LOCALE="ko"`), `/pricing` 헤드라인 = "지금은 무료 베타예요".
- 데이터 기준: `count 138 · asOfBusinessDate 20260703 · metricsVersion 2.4 · source "FDR + Naver + yfinance"`. 표기 = `2026.07.03` / `07.03(금)`.
- 상세 스코프 근거: [`docs/ornscore-free-beta-v1-scope.md`](./ornscore-free-beta-v1-scope.md) · 릴리스 팩: [`docs/ornscore-local-release-handoff-2026-07-06.md`](./ornscore-local-release-handoff-2026-07-06.md).

**상류 판정(2026-07-06 read-only, 문서화만·병합 안 함):**
- `git fetch origin` 후 `git rev-list --left-right --count origin/main...HEAD` = **`0 112`**.
  - 왼쪽 0 = origin/main에 HEAD가 놓친 커밋 없음 → 지금 통합할 상류 데이터 없음(**no integration needed**).
  - 오른쪽 112 = HEAD가 origin/main보다 앞선 로컬 개선 커밋 수.
- codex 통합 라인 `codex/ornscore-main-data-integration-20260705`(tip `dbb24e0`)는 **HEAD에 포함**되지만(`git merge-base --is-ancestor` = 참) 더 이상 HEAD가 아니다 — 이 태스크 브랜치가 Task 215~219로 그 위(`5784bb6`)까지 전진. 로컬 커밋만·미push·미배포.
- 캐리포워드 라인 = `ai-center/task-220-ornscore-release-rollback-and-monito`(현재 HEAD). 상류 라인 변동 없음.

---

## §1. 사이트 새로고침 직후 즉시 확인 (오너가 배포한 URL 대상)

> 순서: **자동 게이트 2종 → 수동 하드리로드 브라우저 패스**. 자동 게이트가 `exit 1`이면 수동 패스로 넘어가지 말고 **§2 트리거 표로 직행**(롤백 판단). 근거·라우트 상세는 재서술하지 않고 링크: [`docs/ornscore-local-release-handoff-2026-07-06.md`](./ornscore-local-release-handoff-2026-07-06.md) §4 · [`docs/ornscore-route-smoke-checklist.md`](./ornscore-route-smoke-checklist.md) · [`scripts/verify-routes.mjs`](../scripts/verify-routes.mjs).

`<owner-URL>` = 오너가 실제 배포 URL로 채운다(§1.4 슬롯). 아래 명령은 레포 루트에서 실행.

### §1.1 자동 — 캐시버스트 6라우트 게이트 (verify:routes)

```
npm run verify:routes -- --base https://<owner-URL>
```

- 대표 공개 6라우트(`/ /status /about /pricing /stocks /stock/005930`)를 `?v=<ts>`+`no-cache`로 요청.
- 단언: (a) HTTP 상태(기본 200) (b) 치명 런타임 마커 0 (c) **데이터 기준일** = 로컬 `stocks.json` 파생값(`2026.07.03`) 일치 (d) 무료 베타 프레이밍 존재·stale `요금제`/`기능 비교` 부재 (e) KO/EN 토글 부재(`hreflang`/`lang="en"`/`LanguageSwitcher` 없음 + `lang="ko"` 존재).
- **배포된 데이터 기준일이 로컬과 다르면 초록이 안 뜬다** → stale 배포/캐시를 잡는다.
- 출력 첫 줄 `base=… routes=6 expectedDate=2026.07.03 data=…` 의 `expectedDate` 를 **그대로 캡처**(§3). 하나라도 FAIL → **`exit 1`, 멈춤 → §2**.

### §1.2 자동 — 전체 23라우트 스모크 (smoke:check --all)

```
npm run smoke:check -- --all --base https://<owner-URL>
```

- 공개+폴백+비로그인 23라우트 상태·SSR 앵커·치명 마커를 검증(기본 게이트는 유한 7, `--all` 로 23). 라우트 인벤토리는 [`docs/ornscore-route-smoke-checklist.md`](./ornscore-route-smoke-checklist.md).
- 요약(`23/23 OK` 등)을 캡처(§3). 실패 라우트가 있으면 그 라우트 성격으로 §2 트리거 매핑.

### §1.3 수동 — 하드리로드 브라우저 패스 (자동이 못 잡는 상호작용)

CDN/브라우저 캐시 우회를 위해 **하드 리로드** 또는 주소창 `?v=<타임스탬프>`. 자동 게이트가 초록이어도 아래는 눈으로 1회 확인:

- [ ] **상태/기준일** — `/` · `/status` 에 `2026.07.03` / `07.03(금)` · `베타 안내` 표시, 콘솔 에러 0.
- [ ] **로그인 진입** — `/login` (그리고 `/login?next=/watchlist`) 에서 (a) 이전 페이지 문맥(`관심 종목을…`) 유지 (b) 카카오/구글 활성·네이버 상태 (c) 이메일 매직링크 입력 렌더. **실제 제출·왕복은 오너 게이트(§4)** — 여기선 진입 화면 렌더까지만.
- [ ] **요금제/무료 베타 카피** — `/pricing` 헤드라인 "지금은 무료 베타예요", stale `요금제`/`기능 비교`/확정가 부재.
- [ ] **KO/EN 토글 부재** — 어느 페이지에도 언어 스위처 노출 없음.

> 자동(§1.1·§1.2)이 SSR 계약을 커버하므로 수동은 **하이드레이션 이후 상호작용·픽셀 육안**에 집중(중복 최소화). 실기기 390px 육안은 별도 런북 [`docs/ornscore-real-device-390px-qa-2026-07-06.md`](./ornscore-real-device-390px-qa-2026-07-06.md).

### §1.4 오너 제공 URL 슬롯 (채워 넣기)

| 항목 | 값 (오너가 채움) |
|---|---|
| 배포 URL (`<owner-URL>`) | `__________________________` |
| 배포/새로고침 시각 (KST) | `__________________________` |
| Vercel 배포 ID / 커밋 SHA | `__________________________` |
| verify:routes 결과 (`expectedDate` 포함) | `__________________________` |
| smoke:check --all 요약 | `__________________________` |

---

## §2. 롤백 결정 지점 (실행 안 함 — 판단 기준·안전 노트만)

### §2.1 트리거 → 액션 표

| 관찰된 증상 | 판정 | 액션 |
|---|---|---|
| 치명 런타임 마커(Application error/Hydration/TypeError 등) 공개 라우트에 노출 | **롤백** | §2.2 즉시 롤백 |
| 5xx / 라우트 다수 비정상 상태 | **롤백** | §2.2 즉시 롤백 |
| 데이터 기준일이 stale(`2026.07.03` 아님) — verify:routes `expectedDate` 불일치 | **롤백**(먼저 캐시/재배포 1회 재확인, 그래도 stale면) | §2.2 |
| 유료/요금제 공개 프레이밍 재부상(`요금제`·`기능 비교`·확정가) | **롤백** | §2.2 (불변식 위반) |
| KO/EN 토글·`lang="en"`·`hreflang` 누출 | **롤백** | §2.2 (불변식 위반) |
| 로그인 진입 자체가 깨짐(`/login` 미렌더·콜백 무한 루프·세션 복귀 실패) | **롤백** | §2.2 |
| 경미한 시각/문구 폴리시(간격·색·비치명 정렬) | **모니터+기록** | 롤백 안 함 · §3에 기록 후 후속 로컬 task |

판단 프레임(치명 A / 문구 불변식 B / 실기기·법무 C)의 근거는 [`docs/ornscore-local-release-evidence-2026-07-03.md`](./ornscore-local-release-evidence-2026-07-03.md) (a)절.

### §2.2 안전한 롤백 노트 (오너 전용 — 이 문서는 실행하지 않음)

- **가장 빠름 — Vercel "이전 배포로 승격(Promote previous deployment)"**: 직전 정상 배포를 즉시 활성화. 빌드 불필요·즉효. **Vercel 대시보드에서 오너만** 수행.
- **git 되돌리기 — 머지 커밋 revert**: main에 병합·배포한 상태에서 문제가 생기면 `git revert -m 1 <merge-sha>` 후 재배포. `-m 1` = 첫 부모(main) 유지.
- **절대 건드리지 않음**: `public/data/*`(가격·기준일 데이터)·점수식/`compositeScore`/지표 산출·`direction`·`metricsVersion`. 롤백은 **코드/배포 되돌리기이지 데이터 재작성이 아니다.**
- **로컬(미배포) 롤백**: 현재 라인은 미push·미배포라 로컬 롤백 비용 ~0 — `git switch <다른 브랜치>`로 이탈 시 라인 보존, 커밋 취소는 `git reset --hard <직전 커밋>`(원격 무영향).
- 교차 참조: [`docs/ornscore-local-release-handoff-2026-07-06.md`](./ornscore-local-release-handoff-2026-07-06.md) §6(롤백 노트).

> **push/deploy/promote/revert-배포는 전부 오너 게이트.** 로컬 에이전트는 트리거 판정 표와 안전 절차만 남기고 실행하지 않는다.

---

## §3. 새로고침 후 `PROGRESS.md`에 남길 캡처 목록

사이트 새로고침을 실제로 돌린 사람(오너/다음 에이전트)이 아래를 `PROGRESS.md`에 한 항목으로 기록한다(관찰성 근거 보존):

- [ ] **verify:routes 결과** — pass/fail + 출력 첫 줄의 `base=… expectedDate=2026.07.03 …` 그대로.
- [ ] **smoke:check --all 요약** — `23/23 OK`(또는 실패 라우트·사유).
- [ ] **스크린샷** — 데스크톱 + 390px 각각 `/` · `/status` · `/pricing` · `/login`(4×2).
- [ ] **실제 배포 URL + 새로고침 시각(KST)** + Vercel 배포 ID/커밋 SHA(§1.4 표 복사).
- [ ] **콘솔 에러 유무** — 있으면 라우트별 메시지.
- [ ] **keep / roll-back 결정** — §2 표 근거. **롤백했다면 사용한 방법(promote/revert)과 revert SHA 기록.**

작성 톤: 후보·탐색·확인·참고 정보 유지(매수·매도·추천·수익 보장 신규 표현 0). 관찰성 참고표는 [`docs/ornscore-launch-observability-checklist.md`](./ornscore-launch-observability-checklist.md).

---

## §4. 남은 오너 승인 (명시)

로컬 에이전트가 대신 못 하는 외부·실기기·법무 게이트. 이 문서의 §1~§3는 **오너가 아래를 통과시킨 뒤** 의미가 있다.

- [ ] **사이트 새로고침/배포 자체** — main 반영 + Vercel 재배포(또는 프로덕션 승격). **오너만.**
- [ ] **실제 OAuth 왕복** — 카카오/구글/네이버 실제 제출·콜백·세션 복귀(§1.3은 진입 화면 렌더까지만). 근거: [`docs/ornscore-oauth-preflight-checklist.md`](./ornscore-oauth-preflight-checklist.md) §B.
- [ ] **배포 URL 제공** — §1.4 슬롯의 `<owner-URL>`을 오너가 확정·공유해야 §1 자동 게이트 실행 가능.
- [ ] **배포 승격/되돌리기** — §2.2의 Vercel promote 또는 `git revert -m 1` 후 재배포. **오너만.**

추가 오너 게이트(실기기 390px 육안·Android `assetlinks.json` 실지문·법무/결제)는 [`docs/ornscore-local-release-handoff-2026-07-06.md`](./ornscore-local-release-handoff-2026-07-06.md) §5 참조(중복 기재 안 함).

---

## §5. 왜 신규 스크립트를 안 만드나 (문서 전용 근거)

- 이 태스크가 자동화하려는 "새로고침 후 캐시버스트 라우트 재확인"은 **이미 [`scripts/verify-routes.mjs`](../scripts/verify-routes.mjs)(Task 216)** 가 배포 URL(`--base https://<owner-URL>`) 대상으로 수행한다 — 상태·**로컬 파생 기준일**·무료 베타 프레이밍·stale 카피 부재·KO/EN 토글 부재를 단언하고 `exit 1`.
- 전체 라우트 상태·앵커는 **[`scripts/smoke-check.mjs`](../scripts/smoke-check.mjs) `--all`(23라우트)** 가 커버.
- 즉 이 태스크에 필요한 자동 관찰성은 기존 두 게이트 조합으로 충분하다 → **신규 스크립트·신규 npm 의존성·빌드 스텝 추가 0**(과설계 회피). 남은 건 오너의 실행·픽셀 육안·OAuth 왕복(§4)이라 코드로 못 닫는다.

---

## 다음 액션 (한 줄)

오너가 §4 승인(배포/새로고침·URL 제공)을 통과시킨 뒤, 배포 URL로 §1.1 `verify:routes` → §1.2 `smoke:check --all` → §1.3 수동 패스를 돌리고, `exit 1`·§2.1 트리거가 뜨면 §2.2 안전 절차(promote 또는 `git revert -m 1`)로 롤백을 결정하며, 결과를 §3 목록대로 `PROGRESS.md`에 남긴다. push/deploy/promote/revert-배포·OAuth 왕복은 전부 오너 몫(로컬 에이전트 미수행).
