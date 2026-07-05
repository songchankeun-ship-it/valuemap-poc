# ORNSCORE 실기기 390px 릴리스 QA 런북 (Task 219)

> 무료 한국어 베타 v1 공개 전, **오너가 실제 모바일(390px)에서 혼자 육안 통과**시키는 실행형 체크리스트.
> "무엇을 봐야 하는지" 묻지 않아도 되도록 라우트별 기대 화면·모바일 리스크·합격/불합격 칸을 고정한다.
>
> 작성: 2026-07-06 (Task 219, Claude). **문서 전용**(앱 소스/점수식/데이터/`direction`/`metricsVersion` 무변경).
> 자동화가 검증할 수 있는 부분(SSR 200·앵커·불변식)은 이미 `smoke:check --all` + `verify:routes`가 커버 →
> 이 문서는 **실 픽셀 육안**이라는 남은 오너 게이트(⑤)만 실행 가능하게 만든다. 신규 스크립트/의존성 추가 안 함(과설계 회피).

---

## 0. 무료 베타 v1 불변식 배너 (모든 라우트에서 회귀 감시)

각 라우트를 볼 때 아래가 **항상** 참인지 같이 확인한다. 하나라도 깨지면 P0(릴리스 차단).

- **커버리지 = 138종목.** 홈 히어로/메타/manifest에 `138` 노출, 임의 축소·확대 없음.
- **데이터 기준일 = `2026.07.03`** (`asOfBusinessDate 20260703` → 화면 표기 `2026.07.03`). `metricsVersion 2.4`.
- **한국어 전용.** KO/EN 토글·`English`·`LanguageSwitcher` 미노출(`DEFAULT_LOCALE="ko"`). 혼재 영어 카피 0.
- **AI 숨김.** 사용자 표면에 "AI 분석 실행"·"Anthropic"·AiAnalysisCard·`/history` 내비 노출 0.
- **비자문·무료 프레이밍.** `/pricing` 헤드라인 = **"지금은 무료 베타예요"**, 확정가(9,900/14,900/29,000) 노출 0.
- **금칙어 0.** 매수·매도·추천·수익 보장·목표가 문구 0. 전 표면 "후보·탐색·확인" 톤 유지.

> 데이터 검증 근거: `public/data/stocks.json` = `count 138 · asOfBusinessDate 20260703 · metricsVersion 2.4`
> (Task 219 시점 확인). 스코프 근거 문서: [`ornscore-free-beta-v1-scope.md`](./ornscore-free-beta-v1-scope.md).

---

## 1. 프리-패스 — 먼저 자동 게이트를 초록으로 (육안은 그다음)

실기기 육안은 **자동 게이트가 초록인 상태**에서 시작해야 오탐을 줄인다. 아래를 순서대로 1회.

```bash
# 1) 빌드 (138 SSG)
npm run build

# 2) 로컬 prod 기동 — 유니크 고포트(AI Center 4310 금지, 3000 회피)
npx next start -p 4464
#   ※ 끝나면 이 포트를 점유한 PID만 정리(taskkill /PID <pid> /F). 전체 Node 종료 금지.

# 3) 스모크(확장 세트) + 라우트 검증 — 다른 터미널에서
npm run smoke:check -- --base http://localhost:4464 --all
npm run verify:routes -- --base http://localhost:4464
```

- **통과 기준**: `smoke:check --all` = 23/23 OK, `verify:routes` = 전 라우트 OK(캐시버스트 포함), 치명 마커 0.
- 이 프리-패스가 초록이면 SSR/상태/앵커/불변식은 이미 보장된 것 → 육안은 **오직 픽셀 레이아웃**에 집중한다.
- 직전 초록 게이트 스냅샷: 2026-07-06 codex 라인 23/23(참조: [`ornscore-local-release-handoff-2026-07-06.md`](./ornscore-local-release-handoff-2026-07-06.md) §3).

---

## 2. 실기기 육안 셋업 (390×844)

- **1순위**: 실제 폭 390px 폰(iPhone 12/13/14 급) 실물. 없으면 데스크톱 크롬 DevTools **Device Toolbar → 390×844**.
- **다크/라이트 둘 다**: OS/브라우저 테마를 각각 바꿔 두 번씩. (다크가 기본 테마)
- **콘솔 열기**: F12 → Console. hydration/TypeError/ReferenceError/Cannot read/Application error 마커 0 확인.
- **스크롤 테스트 필수**: 각 라우트 위→아래 스크롤. 특히 `/stock/005930`은 **탭 바 sticky 고착 거동**(§3 하단 항목)을 스크롤로 확인.
- 접근성: 주요 탭 타깃(버튼·링크·탭) ≥ 44px 손가락 터치 여유.

---

## 3. 라우트별 체크리스트 (390×844 · 다크+라이트)

각 행: **기대 화면**(한국어 카피 앵커) / **모바일 레이아웃 리스크** / **합격·불합격 노트**(빈 체크박스 + 불변식 재확인).
프레이밍은 전부 후보·탐색·확인. 어느 칸이든 매수/매도/추천/수익 문구가 보이면 즉시 불합격(P0).

### `/` (홈)

- **기대 화면**: 히어로에 `138`(개 종목) 카피·`베타 안내`·미니 대시보드(마켓 스냅샷)·후보 카드·공시 신호 카드·비자문 고지("데이터 도구"). 세로 스택.
- **모바일 리스크**: `MarketSnapshotCards` = 2열(360/390px)·가로 넘침 0. `MyStocksSection`은 로컬 저장 개인화라 마운트 후 스켈레톤→콘텐츠 미세 이동(CLS) — 상단 앵커는 흔들리지 않아야 함. 스텝 배지 `whitespace-nowrap` 줄바꿈 확인.
- **합격/불합격**: ☐ 가로 넘침 0 · 텍스트 겹침 0 · `138` 노출 · `2026.07.03` 기준일 · KO 전용 · AI 카드 0 · 콘솔 0.

### `/stocks`

- **기대 화면**: 질문 프리셋 카드(1↔2↔3열)·"예상 결과 N개"·표형 다열 테이블. 검색 입력 노출.
- **모바일 리스크**: `StockResultsTable`은 넓은 표 → **`overflow-x-auto` 래퍼 안 가로 스크롤**이 정상(셀 `whitespace-nowrap`). 표가 뷰포트를 밀어 **바디 자체가 가로로 넘치면 불합격**. 검색 입력 `min-h-[44px]`. 시그널 칩 `flex-wrap`.
- **합격/불합격**: ☐ 표는 컨테이너 내부에서만 가로 스크롤(바디 넘침 0) · 프리셋 카드 붕괴 0 · KO 전용 · 콘솔 0.

### `/stock/005930` (삼성전자 · 고위험 라우트)

- **기대 화면**: 결론 히어로 카드·등급·전체/업종 순위·상위 X% 막대(추세·거래활성도·밸류·위험조정)·근거/공시 탭. 하단 지연 로딩 위젯(차트·공시·타임라인) 스켈레톤. **AI 종합 분석 카드 없음**.
- **모바일 리스크(핵심)**: 지연 위젯 스켈레톤 CLS 0(동일 높이 자리 유지). `StockDetailActionButtons`(`min-[380px]:grid-cols-2`) 44px. `SectorComparison` 표는 `overflow-x-auto`+`min-w-[280px]`.
  - **⚠ StockTabs sticky 고착(owner⑤ 결정 항목)**: 탭 바(`src/components/StockTabs.tsx:53`)가 `sticky top-0 z-10`, 앱 헤더(`AppHeader.tsx:65`)가 `sticky top-0 z-40`. 스크롤 시 탭 바가 같은 `top:0`에 붙되 z가 낮아 **헤더 뒤로 가려짐(occlusion)**. 저심각(sticky가 조용히 no-op = 일반 스크롤처럼 헤더 아래로 사라짐)이나 실기기 육안으로 "탭 바가 헤더에 잘려 가독성 저하인지" 판정 필요.
    - **결정 A(오프셋 고착)**: `top-0` → 헤더 실측 높이 + `env(safe-area-inset-top)` 기반 `top-[calc(...)]`. 매직 넘버는 실기기 검증 후에만.
    - **결정 B(sticky 제거)**: 탭 바 sticky 자체 제거 → 일반 스크롤로 단순화. 여백/미세 겹침 리스크 없음.
    - 둘 다 자동화(curl)로는 스크롤 고착을 검증 불가 → **실기기에서 A/B 택1**. (근거: [`ornscore-mobile-viewport-followup-2026-07-04.md`](./ornscore-mobile-viewport-followup-2026-07-04.md) stock 상세 ①.)
- **합격/불합격**: ☐ 상위 X% 막대 렌더 · 등급/순위 노출 · 스켈레톤 CLS 0 · **AI 카드 0** · KO 전용 · 콘솔 0 · **StockTabs 고착 A/B 결정 기록: ____**.

### `/status`

- **기대 화면**: 도메인 상태·알려진 제한·최근 자동 점검(유니버스 138·검증보류 수·결측 수)·KST **`2026.07.03`** 기준일. (`/admin/status`는 내부용·noindex — 여기서 점검 대상 아님.)
- **모바일 리스크**: 상태 배지 행 `flex-wrap`. 점검 요약 카드 세로 스택·넘침 0.
- **합격/불합격**: ☐ 기준일 `2026.07.03` 표기 · 138 노출 · 가로 넘침 0 · KO 전용 · 콘솔 0.

### `/pricing`

- **기대 화면**: 헤드라인 = **"지금은 무료 베타예요"**·"준비 중" 배지·확정가 노출 **0**·기능 비교표.
- **모바일 리스크**: 기능 비교표 가로 스크롤(`overflow-x-auto` 내부). 요금 카드가 바디를 밀어 넘치지 않는지. 유료 CTA가 눈에 띄게 승격되어 있으면 프레이밍 위반.
- **합격/불합격**: ☐ "지금은 무료 베타예요" 노출 · 확정가 0 · 유료 프레이밍 강조 0 · KO 전용 · 콘솔 0.

### `/login?next=/watchlist`

- **기대 화면**: 소셜 로그인 버튼 **카카오·구글·네이버·이메일(매직링크)** + 정책 링크. `next` 파라미터는 로그인 성공 후 `/watchlist` 복귀용(SSR에선 버튼만 확인, 실 왕복은 오너 OAuth 게이트).
- **모바일 리스크**: 버튼 전부 `w-full min-h-[44px]`. `LoginSkeleton`(Suspense 폴백)이 카드 높이를 흉내 내 CLS 완화. provider/benefit 행 넘침 0.
- **합격/불합격**: ☐ 4개 제공자 버튼 노출 · 44px 탭 타깃 · CLS 0 · KO 전용 · 콘솔 0. (실제 OAuth 왕복 = 오너 별도 게이트.)

### `/watchlist`

- **기대 화면**: 비로그인 시 빈 상태 + **로그인 CTA**(클라이언트 렌더). 로컬 추적 안내 카피("담기 = 별도 알림 없이 로컬 기록" 톤). `noscript` 폴백.
- **모바일 리스크**: 클라 렌더라 초기 로딩→빈/로그인 상태 전환 CLS. 로그인 CTA 버튼 44px. 인라인 제거 `실행 취소` 토스트가 하단 네비를 가리지 않는지(`bottom-[calc(3.5rem+safe-area)]`).
- **합격/불합격**: ☐ 로그인 CTA 노출 · 빈 상태 카피 정직(라이브 알림 암시 0) · 44px · KO 전용 · 콘솔 0.

---

## 4. 완료 기준 (오너)

- 위 7개 라우트 × (다크·라이트) 육안 1회씩, 각 행 체크박스 채움.
- **StockTabs sticky 고착 A/B 결정**을 §3 `/stock/005930` 노트에 기록(결정 후 후속 로컬 task로 반영 가능).
- 실기기 OAuth 왕복(카카오/구글/네이버/이메일)은 **별도 오너 게이트**(이 문서 범위 밖·[`ornscore-local-release-handoff-2026-07-06.md`](./ornscore-local-release-handoff-2026-07-06.md) §5).
- 불변식(138·`2026.07.03`·KO 전용·무료 베타·AI 숨김·금칙어 0) 위반 0.

---

## 5. 왜 신규 스크립트를 안 만들었나 (과설계 회피 결정)

- SSR로 자동 검증 가능한 부분(200 응답·앵커·상태·치명 마커·캐시버스트)은 이미 [`scripts/smoke-check.mjs`](../scripts/smoke-check.mjs)(`--all` 23라우트)와 [`scripts/verify-routes.mjs`](../scripts/verify-routes.mjs)가 커버한다 → 중복 하니스 불필요.
- 남은 것은 **실제 390px 픽셀 렌더·스크롤 고착·다크모드 대비**로, 본질적으로 헤드리스로 검증 불가한 **오너 육안 게이트(⑤)**. Playwright/뷰포트 스냅샷 도입은 신규 dev 의존성 결정이라 이번 범위 밖.
- 따라서 Task 219 산출물 = **실행형 문서(런북)** 1개. 신규 npm 0·빌드 스텝 0.

---

## 6. 교차 참조 (중복 없이 링크)

- [`ornscore-post-release-qa-2026-07-02.md`](./ornscore-post-release-qa-2026-07-02.md) §7(사람 QA 육안 체크리스트)·§8(다음 작업) — 데스크톱 ≥1280px + 390px 원본 육안 목록.
- [`ornscore-mobile-viewport-followup-2026-07-04.md`](./ornscore-mobile-viewport-followup-2026-07-04.md) — 360/390px 다섯 결함 클래스 소스 대조 감사(StockTabs sticky occlusion 발견 원문).
- [`ornscore-local-release-handoff-2026-07-06.md`](./ornscore-local-release-handoff-2026-07-06.md) §5(오너 게이트: 실기기 390px·OAuth·assetlinks·법무).
- [`ornscore-launch-observability-checklist.md`](./ornscore-launch-observability-checklist.md) — 릴리스 후 관찰성(수동 리뷰 단계 포함).
- 자동 게이트 스크립트: [`route-smoke-checklist.md`](./ornscore-route-smoke-checklist.md)(`--all` 세트 앵커/치명 마커 위임).
