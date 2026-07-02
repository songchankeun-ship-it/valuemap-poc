# 오른스코어(OrnScore) 공개 사이트 릴리스 후 QA + 피드백 인테이크 노트 (Task 127)

> **역할:** OrnScore 릴리스 후 공개 사이트 QA — 읽기 전용 점검. 만든 사람 관점이 아니라 QA/피드백 인테이크 관점.
> **작성:** 2026-07-02 (Task 127, [claude]). 시작 HEAD `8b1ecc8`(클린). 브랜치 `ai-center/task-127-ornscore-public-site-post-release-qa`.
> **성격:** 앱 코드 무수정 QA 패스. 산출물 = 이 노트 + `PROGRESS.md` / `docs/AI_HANDOFF.md` 갱신. 외부 릴리스/푸시/스토어/결제/외부계정 변경 0.
> **교차 문서(중복 대신 참조):** [`ornscore-free-beta-v1-scope.md`](./ornscore-free-beta-v1-scope.md) · [`ornscore-qa-feedback.md`](./ornscore-qa-feedback.md)(Task 48) · [`ornscore-spec-coverage.md`](./ornscore-spec-coverage.md) · [`PROGRESS.md`](../PROGRESS.md) · [`AI_HANDOFF.md`](./AI_HANDOFF.md)

---

## 0. 검증 환경 / 게이트 한계

| 항목 | 내용 |
|---|---|
| 빌드 | `npx tsc --noEmit` exit 0 · `npm run build` exit 0 (138 SSG 종목 페이지 · 전 라우트 컴파일, 라우트 표 이전과 동일) |
| 산식 검증 | `PYTHONUTF8=1 python scripts/verify_metrics.py` → 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치 |
| 앱 패키징 | `npm run app:check` → 통과(외부 게이트 1건 대기 = `assetlinks.json` 미생성, 실 Android 패키지+SHA-256 필요 = **운영자 게이트**, 회귀 아님) |
| 성능 | `npm run perf:check --base http://127.0.0.1:4455` → 11개 라우트 전부 200, **advisory 경고 0** |
| 로컬 검증 서버 | `127.0.0.1:4455`(prod `next start`, 내 리스너 PID 11636). **AI Center 4310(PID 26420) 무중단** — 내가 띄운 PID만 정리. 포트 3000 미사용. |
| 점검 경로(SSR/에셋) | `/ /today /stocks /stock/034730 /watchlist /compare /login /disclosures /pricing /status /manifest.webmanifest` → **11/11 HTTP 200, 치명 마커 0** (`Application error`/`Hydration`/`TypeError`/`ReferenceError`/`Cannot read`/`Unhandled`) |
| 뷰포트 | 데스크톱 = SSR HTML + 빌드 CSS/청크 grep + 소스 인스펙션. **390px 모바일 = 소스/CSS 가드 점검만(픽셀 렌더 미보장 — Playwright 미구성)** |
| **게이트 한계(중요)** | Playwright 미구성 → 실 브라우저 데스크톱/390px 시각 게이트 로컬 미가용(Task 48 P1-VISUAL 승계). `/watchlist /compare`는 상당 부분 클라이언트 렌더라 SSR HTML엔 셸·로그인 CTA·빈상태 카피만 확인됨. OAuth 실 왕복은 실기기 필요(운영자). |

---

## 1. 요약 (Severity 분포)

| Severity | 건수 | 한 줄 |
|---|---|---|
| **P0 (출시 차단)** | 0 | 치명 결함 없음 — 전 경로 200·마커 0, 무료 베타 불변식 전부 준수 |
| **P1 (릴리스 전 필수)** | 1 | 실 브라우저 모바일/데스크톱 시각 게이트 부재(Task 48 승계, 운영자 육안 액션) |
| **P2 (개선 후보)** | 3 | manifest 단일 `theme_color`(라이트 모드 상단바 어둡게) · safe-area-inset 좌/우 미적용(가로/노치) · Category-B 라우트 로컬 ~4s 왕복(환경 아티팩트, 회귀 아님) |
| **불변식 재확인** | 6 | §3 — 138종목·비자문 고지·EN 토글 숨김·AI 공개 숨김·요금제 무료 베타·요금제 내비 강등 전부 유지 |

**총평:** 릴리스 후 상태가 매우 양호. Task 113(무료 베타 방향 잠금) 이후의 공개 UI 조정(§3 (i) 5개 항목)이 코드에 **전부 반영·유지**되어 있고, Task 118 성능 패스 이후 회귀 없음. 새로 발견된 코드 결함 0. 남은 것은 자동 시각 게이트 부재(P1, 운영자)와 소규모 폴리시 후보(P2)뿐. **안전한 1줄 수정 후보 없음 → 코드 무변경.**

---

## 2. P0 — 출시 차단 (해당 없음)

전 경로 200·치명 마커 0, 확정 가격(9,900/14,900/29,000) 노출 0, 공통 비자문 고지 전면 노출, AI 공개 진입점 0. **출시를 막는 결함 없음.**

---

## 3. 무료 베타 v1 불변식 재확인 (Clean — 회귀 감시 대상)

`docs/ornscore-free-beta-v1-scope.md` §4 (i)의 "must-change public UI" 5개가 실제 코드/렌더에 반영·유지됨을 이번 QA에서 재확인:

| # | 불변식 | 확인 근거(이번 QA) |
|---|---|---|
| INV-1 | **138종목 범위 명확** | 홈 SSR "138개 종목 데이터 분석" · og/twitter/manifest description 전부 "138개 종목". manifest `description`도 138 명시. |
| INV-2 | **비자문 고지 전면** | 홈 "종목 탐색 시간을 줄이는 **데이터 도구**" · `/stock/034730` "투자 추천이 아니라 탐색 우선순위를 정하는 분석 도구" · `/pricing` "데이터 도구" 고지 노출. |
| INV-3 | **한국어 전용(EN 토글 숨김)** | 홈 SSR에 `LanguageSwitcher`/언어 전환/`>English<`/`hreflang`/`?lang=en` **0건**. `AppHeader.tsx`·`MobileNav.tsx`에 `LanguageSwitcher` 렌더 없음(소스 grep 0). EN i18n 문자열은 코드 보존(추후 재개용). |
| INV-4 | **AI 분석 공개 숨김** | `/stock/034730` SSR에 `AI 분석 실행`/`Anthropic`/`AI 종합 분석`/`AiAnalysis` **0건**. `src/app/stock/`에 `<AiAnalysisCard>` 사용 0(소스 grep 0). `/history` 내비 항목 0(Sidebar/MobileBottomNav grep 0). API/컴포넌트/라이브러리는 내부 보존. |
| INV-5 | **요금제 = 무료 베타, 확정가 0** | `/pricing` SSR "무료 베타" 다회 노출·최상단 리드, 확정 가격 문자열(9,900/14,900/29,000·9900/14900/29000) **0건**. paid-plan-first 프레이밍 없음(페이지가 무료 베타로 시작). |
| INV-6 | **요금제 내비 강등** | `Sidebar.tsx` `/pricing` `group:"more"`(1차 아님) · `MobileBottomNav.tsx` `/pricing`은 `MORE` 그룹(PRIMARY = 오늘/종목/공시/관심). 1차 내비 강조 없음. |

추가 확인: 로그인 진입 명확 — 헤더 `href="/login"` + "로그인" 노출, `/watchlist` 비로그인 SSR에 "로그인" CTA·"관심 종목" 빈상태 카피 존재. `/login` 제공자 = 카카오·구글(Google)·네이버·이메일(매직링크) 노출.

---

## 4. P1 — 릴리스 전 필수 (운영자 액션)

### P1-VISUAL · 실 브라우저 모바일/데스크톱 시각 게이트 부재 (Task 48에서 승계, 미해소)
- **경로:** 전 경로(특히 `/stocks` 표형 다열 테이블 · `/compare` 비교표 · `/stock/*` 업종 비교 막대 · `/disclosures` 카드 액션행 · `/today` 변화 칩).
- **재현:** 로컬에 Playwright 등 헤드리스 브라우저 게이트 미구성 → 자동화 QA는 SSR HTML·빌드 CSS/청크·소스 클래스 가드까지만 검증 가능. 폰트 메트릭·실제 줄바꿈·런타임 콘솔/hydration은 미검증.
- **기대:** 공개 전 데스크톱(≥1280px)+390px 실제 렌더 기준 가로 넘침 0·텍스트 겹침 0·카드 붕괴 0·콘솔/hydration 오류 0.
- **실제(이번 QA 범위):** 소스/CSS 기준 위험 패턴 없음. 안전 영역 CSS는 `env(safe-area-inset-top)`/`env(safe-area-inset-bottom)` 존재(헤더 상단·하단바), 뷰포트 `viewport-fit=cover`·`maximum-scale` 없음. 단 **실제 픽셀 검수는 여전히 자동으로 닫히지 않음.**
- **제안:** (a) 단기 — 운영자가 데스크톱/390px로 §6 체크리스트 육안 1회. (b) 중기 — Playwright + 뷰포트 스냅샷 스모크를 CI에. **신규 npm 의존성 결정이라 이번 범위 밖(운영자).**

> P1로 둔 이유: 기능·문구·불변식은 깨끗하나 "릴리스 후에도 유효한" 실제 모바일 픽셀 검수가 자동화로 닫히지 않았다. 코드 결함이 아니라 **게이트 부재**이므로 운영자 액션 항목이다.

---

## 5. P2 — 개선 후보 (선택, 소유자 판단)

### P2-1 · manifest `theme_color`가 다크 단색(#09090b) — 라이트 모드 standalone 상단바 어둡게
- **근거:** `/manifest.webmanifest` `theme_color:"#09090b"`(다크). 반면 문서 `<head>`엔 라이트(#ffffff)/다크(#09090b) `theme-color` 미디어쿼리 2종 모두 존재.
- **영향:** manifest는 단일 `theme_color`만 지원 → 라이트 모드 기기의 홈스크린 설치 앱 상단 바가 다크로 보일 수 있음(브라우저 탭은 `<head>` 미디어쿼리로 정상 전환). **결함 아님 · 시각 폴리시.** 다수 PWA가 다크 계열 단색을 그대로 두므로 현행 유지 가능.
- **제안(선택):** 유지 권장. 라이트 상단바를 원하면 `src/app/manifest.ts`의 `theme_color`/`background_color` 조정은 디자인 결정 → 운영자.

### P2-2 · safe-area-inset 좌/우 CSS 미적용 (가로 모드/좌우 노치)
- **근거:** 빌드 CSS에 `env(safe-area-inset-top|bottom)`만 존재, `left/right` 없음.
- **영향:** 세로 고정(`orientation:portrait`) PWA라 실사용 영향 미미. 가로 회전/좌우 노치 기기에서 극단적으로 콘텐츠가 노치에 근접할 수 있음. **P2 나이스투해브.**
- **제안(선택):** 필요 시 앱셸 좌우 패딩에 `env(safe-area-inset-left/right)` 추가 — 디자인 검토 후 운영자.

### P2-3 · Category-B 라우트 로컬 ~4s 왕복 (환경 아티팩트, 회귀 아님)
- **근거:** `perf:check`에서 `/stock/034730`·`/stock/032830`·`/watchlist` total ~4.0–4.05s(TTFB 38–57ms). 나머지 8개 Category-A는 total 47–78ms.
- **영향:** 서버 요청 시 Supabase 왕복(로컬→원격 무료 티어 고정 커넥션/웜업 비용) = **환경 아티팩트**. Task 119 타임아웃 가드가 `/stock/*`를 ~4–4.5s로 캡. 프로덕션(동위치 Supabase)에선 작음. `/stock/[ticker]`는 SSG 프리렌더라 실사용 빠름. **advisory 경고 0 · 소프트 예산 내 · 회귀 아님.**
- **제안:** 조치 불요. Task 118 follow-up(watchlist 배치 쿼리 캐시/클라 이행)은 이미 추적 중 — 동작 리스크라 이번에도 미적용.

---

## 6. 운영자 확인 항목 (Owner-confirmation)

1. **실기기 OAuth 왕복:** 카카오/구글/네이버/이메일 매직링크 실제 로그인 1회(`/auth/callback` 정상 리다이렉트). SSR엔 버튼만 확인 가능 — 실 왕복은 운영자.
2. **데스크톱/390px 육안 시각 게이트(P1):** §7의 11경로를 두 폭에서 1회. Playwright 미구성 상태의 유일한 필수 잔여 게이트.
3. **manifest `theme_color`(P2-1):** 다크 단색 유지 vs 라이트 조정 — 디자인 결정.
4. **assetlinks/스토어(범위 밖):** `app:check`의 1건 WAIT는 실 Android 패키지+SHA-256 필요. 스토어 제출은 v1 범위 밖(scope 문서 §4-iii).
5. **결제/가격/영어 재개(범위 밖):** 무료 베타 동안 비활성 — 제품/법무 게이트.

---

## 7. 사람 QA 육안 체크리스트 (데스크톱 ≥1280px + 390px)

> 로컬 재빌드·재기동 후 각 경로를 두 폭에서. 콘솔(F12)도 확인.

- [ ] `/` — 히어로 138 카피·미니 대시보드·후보 카드·공시 카드·비자문 고지. 모바일 세로 스택.
- [ ] `/today` — 방문일 vs "데이터 기준 장마감" 위계(Task 48 P2-2). 변화 칩 줄바꿈.
- [ ] `/stocks` — 질문 프리셋 카드 1↔2↔3열·"예상 결과 N개"·표형 다열 테이블 가로 스크롤.
- [ ] `/stock/034730` — 결론 카드·등급·전체/업종 순위·상위 X% 막대·근거/공시 탭. 지연 로딩 위젯 스켈레톤(Task 118) CLS 없음. **AI 카드 없음** 재확인.
- [ ] `/watchlist` — 비로그인 빈상태·로그인 CTA(클라 렌더).
- [ ] `/compare` — 비교 시작 화면·비교표 가로 스크롤(클라 렌더).
- [ ] `/login` — 카카오/구글/네이버/이메일 버튼·정책 링크.
- [ ] `/disclosures` — 공시 카드 액션행·기간 토글·수집 범위 문구(Task 48 P2-1).
- [ ] `/pricing` — "무료 베타" 리드·"준비 중" 배지·확정가 0·기능 비교표 가로 스크롤.
- [ ] `/status` — 도메인 상태·알려진 제한·최근 자동 점검·KST 기준일.
- [ ] PWA — 홈스크린 설치(manifest standalone)·아이콘·상단/하단 safe-area.
- [ ] 공통 — 가로 오버플로 0·텍스트 겹침 0·카드 붕괴 0·콘솔/hydration 오류 0.

---

## 8. 다음 작업 제안 (Next work suggestions)

- **P1 해소(운영자/중기):** Playwright + 390px/데스크톱 뷰포트 스냅샷 스모크 CI 도입(신규 dev 의존성 결정). 도입 전까진 §7 육안 게이트.
- **성능 follow-up(추적 중, Task 118):** `/watchlist` 서버 Supabase 138-ticker 배치 캐시/타임아웃/클라 이행 · `/compare`·`/disclosures` below-fold 위젯 동일 지연 패턴 — 동작 리스크라 별도 안전 검토 후.
- **커버리지 잔여(추적 중):** 공시 전체 기간 파이프라인(scope ④) · 도메인 기반 support/privacy 이메일(⑤) · EN i18n 라이브러리/메타 갭 — 이미 `ornscore-spec-coverage.md`/scope 문서로 추적, 신규 재기재 불필요.
- **폴리시(선택):** P2-1 manifest theme_color · P2-2 좌우 safe-area — 디자인 결정 시 함께.

---

## 9. 결론

릴리스 후 공개 사이트는 **안정적**이다. 11개 공개 경로 전부 200·치명 마커 0, 무료 베타 v1 불변식 6종 전부 유지, 4개 게이트(tsc·verify_metrics·app:check·perf:check) 통과. 코드 결함 0 → **앱 소스 무변경**. 잔여는 실 브라우저 시각 게이트(P1, 운영자)와 소규모 폴리시 후보(P2)뿐. 본 작업은 로컬 커밋만(푸시/머지/외부 릴리스/스토어/결제/외부계정 변경 없음).
