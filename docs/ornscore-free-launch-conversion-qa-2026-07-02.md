# 오른스코어(OrnScore) 무료 출시 스모크 + 전환 퍼널 QA 노트 (Task 135)

> **역할:** 무료 한국어 베타 출시 후 집중 QA — 스모크 + **전환 퍼널(로그인 진입·데이터 신뢰·안전 문구)** 각도 추가. 읽기 전용 점검 원칙.
> **작성:** 2026-07-02 (Task 135, [claude]). 브랜치 `ai-center/task-135-ornscore-free-launch-smoke-and-conve`(클린 시작·클린 종료).
> **성격:** 앱 코드 무수정 QA 패스. 산출물 = 이 노트 + `PROGRESS.md` / `docs/AI_HANDOFF.md` 갱신. 외부 릴리스/푸시/스토어/결제/외부계정/시크릿 변경 **0**.
> **교차 문서(중복 대신 참조):** [`ornscore-post-release-qa-2026-07-02.md`](./ornscore-post-release-qa-2026-07-02.md)(Task 127) · [`ornscore-free-beta-v1-scope.md`](./ornscore-free-beta-v1-scope.md)(§3–4 불변식) · [`ornscore-spec-coverage.md`](./ornscore-spec-coverage.md)

---

## 0. 검증 환경 / 게이트 한계

| 항목 | 내용 |
|---|---|
| 빌드 | `npx tsc --noEmit` exit 0 · `npm run build` exit 0 (`/stock/[ticker]` `●` SSG 138경로 189kB, **라우트 표 Task 127/128과 동일**) |
| 산식 검증 | `PYTHONUTF8=1 python scripts/verify_metrics.py` → 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치 |
| 앱 패키징 | `npm run app:check` → 통과 (**1 WAIT** = `public/.well-known/assetlinks.json` 미생성 = 실 Android 패키지+SHA-256 필요 = **기존 운영자 게이트**, 회귀 아님) |
| 성능 | `node scripts/perf-check.mjs --base http://127.0.0.1:4456` → 11개 라우트 전부 200, **advisory 경고 0** |
| 로컬 검증 서버 | `127.0.0.1:4456`(prod `next start`, 내 리스너 PID 31964). **AI Center 4310(PID 26420) 무중단** — 내가 띄운 4456 PID만 정리. |
| 점검 경로 | `/ /today /stocks /stock/034730 /stock/032830 /watchlist /compare /login /disclosures /pricing /status /manifest.webmanifest` → **12/12 HTTP 200, 치명 마커 0** (`Application error`/`Hydration failed`/`Cannot read properties`/`ReferenceError:`/`Unhandled`/`Minified React error`) |
| 뷰포트 | 데스크톱 = SSR HTML + 빌드 CSS/청크 grep + 소스 인스펙션. **390px 모바일 = 소스/CSS 가드 점검만**(Playwright 미구성 → 실 픽셀 렌더 미보장) |

> 마커 주의: 원시 grep은 홈/전 라우트에서 `Hydration` 1건을 잡지만, 이는 `suppressHydrationWarning`(정상 React prop) 문자열이다. 정밀 재검(실제 오류 패턴)에서 **치명 마커 0** 확인.

---

## 1. 요약 (Severity 분포)

| Severity | 건수 | 한 줄 |
|---|---|---|
| **P0 (출시 차단)** | 0 | 치명 결함 없음 — 전 경로 200·마커 0, 무료 베타 불변식 6종 전부 준수, 전환 퍼널 진입 정상 |
| **P1 (릴리스 전 필수)** | 1 | 실 브라우저 모바일/데스크톱 시각 게이트 부재(Task 48/127 승계, 운영자 육안 액션) |
| **P2 (개선 후보)** | 2 | manifest 단일 다크 `theme_color` · safe-area-inset 좌/우 미적용(둘 다 Task 127 승계, 신규 아님) |
| **불변식 재확인** | 6 | §3 — INV-1..6 전부 유지 |
| **전환 퍼널** | 정상 | §4 — 로그인 진입·`next` 리다이렉트·제공자 4종·비자문/신뢰 문구 전부 정상, 과대약속 0 |

**총평:** Task 127(어제) 이후 회귀 없음. 이번엔 **전환 퍼널 각도**를 추가로 감사했고 새 결함 0. 로그인 진입은 명확·일관, 데이터 신뢰/안전 문구는 보수적, 유료/과대약속 노출 0. **안전한 1줄 수정 후보 없음 → 앱 소스 무변경**(Task 127과 동일 결론).

---

## 2. P0 — 출시 차단 (해당 없음)

12/12 경로 200·치명 마커 0, 확정 가격(9,900/14,900/29,000·9900/14900/29000) 노출 0, 공통 비자문 고지 전면, 공개 AI 진입점 0. **출시를 막는 결함 없음.**

---

## 3. 무료 베타 v1 불변식 재확인 (Clean)

| # | 불변식 | 확인 근거(이번 QA) |
|---|---|---|
| INV-1 | **138종목 범위** | 홈 SSR "138개 종목" · `/manifest.webmanifest` `description` "138개 종목의 자체 지표 4종…". |
| INV-2 | **비자문 고지 전면** | 홈·`/stock/034730`·`/pricing` 모두 "데이터 도구" + "매수·매도 추천이 아니라/아닌" 고지 노출. |
| INV-3 | **한국어 전용(EN 토글 숨김)** | 홈 SSR에 `LanguageSwitcher`/`>English<`/`?lang=en`/`hreflang` **0**. `AppHeader.tsx`·`MobileNav.tsx`에 `LanguageSwitcher` 렌더 0. |
| INV-4 | **AI 공개 숨김** | `/stock/034730` SSR에 `AI 분석 실행`/`Anthropic`/`AiAnalysisCard` **0**. `Sidebar.tsx`·`MobileBottomNav.tsx`·`stock/[ticker]/page.tsx`에 `AiAnalysisCard`/`/history` **0**. |
| INV-5 | **요금제=무료 베타, 확정가 0** | `/pricing` SSR "무료 베타" ×7·최상단 리드(byte 1483, `Pro`는 byte 26058로 후순위)·확정 가격 문자열 **0**. |
| INV-6 | **요금제 내비 강등** | `Sidebar.tsx:18`·`MobileNav.tsx:23` `group:"more"` · `MobileBottomNav.tsx:20` `MORE` 배열(PRIMARY=오늘/종목/공시/관심). 1차 내비 강조 0. |

요금제 톤: `copy/pricing.ts`의 "정식 출시 시 Pro 기능으로 전환될 **수 있고 전환 전 사전 안내**"·"유료 플랜은 현재 제공하지 않으며" = **조건부·비확정**(Task 127 수용 톤 유지). "곧 유료/정식 유료 확정" 류 확정 약속 **0**.

---

## 4. 전환 퍼널 점검 (이번 task 추가 각도) — 정상

| 항목 | 확인 근거 |
|---|---|
| **헤더 로그인 진입** | 홈 SSR `href="/login"` 노출 + "로그인" 라벨. 전 라우트 공통 헤더라 진입 일관. |
| **비로그인 `/watchlist` CTA** | SSR에 로그인 CTA `href="/login?next=%2Fwatchlist"`(**로그인 후 관심목록 복귀 `next` 파라미터 보존** — 퍼널 이탈 방지) + "로그인하면 여러 기기…" 혜택 문구 + "관심 종목" 빈상태 카피. |
| **`/login` 제공자** | 카카오·구글·네이버·**이메일 매직링크**("메일로 로그인 링크") 4종 노출. (로그인 매직링크 이메일은 scope상 허용.) |
| **초보 친화/데이터 신뢰 문구** | 홈·`/stock`·`/status`·`copy/*.ts`·`dataStatus.ts`·`pricing.ts` grep: 과대약속(수익/원금/수익률 보장), 매수·매도 권유, "곧 유료/유료 확정" phrasing **0**. 매치된 문자열은 전부 "추천이 **아니다**"류 부정형 고지. |

**퍼널 결론:** 로그인 유입 경로가 명확하고, `/watchlist` CTA가 `next` 복귀를 보존해 전환 손실을 줄인다. 데이터 신뢰·안전 문구는 보수적이라 과대약속으로 인한 신뢰 손상 리스크 없음. **퍼널 관련 코드 수정 불요.**

---

## 5. P1 — 릴리스 전 필수 (운영자 액션, Task 48/127 승계)

### P1-VISUAL · 실 브라우저 모바일/데스크톱 시각 게이트 부재
- Playwright 등 헤드리스 브라우저 게이트 미구성 → 자동 QA는 SSR HTML·빌드 CSS/청크·소스 클래스 가드까지만. 폰트 메트릭·실 줄바꿈·런타임 콘솔/hydration은 미검증.
- 소스/CSS 기준 위험 패턴 없음: `env(safe-area-inset-top|bottom)` 존재, `viewportFit:"cover"` 존재, 가로 스크롤 컨테이너 `overflow-x-*` 13곳(표형 다열 의도적 스크롤). **실 픽셀 검수는 여전히 자동으로 닫히지 않음** → 운영자 육안(§7 Task 127 체크리스트) 1회.

---

## 6. P2 — 개선 후보 (선택, Task 127 승계 · 신규 아님)

- **P2-1** manifest `theme_color:"#09090b"` 다크 단색 → 라이트 모드 standalone 상단바 어둡게(브라우저 탭은 `<head>` 미디어쿼리로 정상). 시각 폴리시, 유지 가능.
- **P2-2** safe-area-inset 좌/우 미적용(세로 고정 PWA라 실사용 영향 미미). 가로 회전/좌우 노치에서만 나이스투해브.

> Task 127의 P2-3(Category-B ~4s 로컬 왕복)은 이번에도 재현(`/watchlist` total 4043ms·`/stock/*` TTFB 31~49ms)되며 **환경 아티팩트·회귀 아님**(무료 티어 Supabase 콜드 커넥션). advisory 경고 0.

---

## 7. 게이트 결과 요약

| 게이트 | 결과 |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `verify_metrics.py` | 138종목 · 0오류 · 금칙어 0 · Metrics 2.4 |
| `npm run build` | exit 0 · 라우트 표 무변경 · `/stock/[ticker]` 138 SSG |
| `npm run app:check` | 통과 (1 WAIT = assetlinks, 기존 운영자 게이트) |
| perf:check (4456) | 11 라우트 200 · advisory 0 |
| 12 공개 경로 스모크 | 12/12 200 · 치명 마커 0 |

---

## 8. 운영자 잔여 항목 (코드로 처리 불가)

1. **실기기 OAuth 왕복** — 카카오/구글/네이버/이메일 매직링크 실제 로그인 1회(`/auth/callback` 리다이렉트). SSR엔 버튼만 확인 가능.
2. **데스크톱(≥1280px)/390px 육안 시각 게이트(P1)** — Task 127 §7 11경로 체크리스트 1회.
3. **assetlinks/스토어(범위 밖)** — 실 Android 패키지+SHA-256 필요. `docs/ornscore-android-twa-owner-checklist.md` 인테이크 시트에 값 채우면 다음 AI가 이어감.
4. **결제/가격/영어 재개(범위 밖)** — 무료 베타 동안 비활성, 제품/법무 게이트.

---

## 9. 결론

무료 출시 후 상태 **안정적**. 12개 공개 경로 전부 200·치명 마커 0, 무료 베타 v1 불변식 6종 전부 유지, 4개 게이트 통과, **전환 퍼널(로그인 진입·`next` 복귀·제공자 4종·비자문/신뢰 문구) 신규 결함 0**. 코드 결함 0 → **앱 소스 무변경**(Task 127과 동일 결론). 잔여는 실 브라우저 시각 게이트(P1, 운영자)와 소규모 폴리시(P2)뿐. 본 작업은 로컬 커밋만(푸시/머지/외부 릴리스/스토어/결제/외부계정/시크릿 변경 없음).
