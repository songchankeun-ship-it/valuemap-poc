# OrnScore 연속성 배치 클로징 — 2026-07-11 (A–E, tasks 155–159)

> 작성: Task 160 (2026-07-12, Claude). 목적: **채팅 기록 없이도** 이번 연속성 배치가
> "로컬로 무엇이 준비됐고 / 운영자 계정·기기가 필요한 게 무엇이며 / 다음 큐가 무엇을 해야 하는지"를
> 한 화면에서 넘겨받게 하는 것.
>
> 톤 규칙(전 화면·전 문서 공통): **투자 추천 아님 · 데이터 신선도 고지 유지 · 스토어/라이브 출시 미확정은 "미확정"으로만 표기.**
> 운영자 전용 항목의 **정본 분리표는 재작성하지 않고 가리킨다** → `docs/ornscore-owner-final-checklist.md`.

---

## 0. 한 줄 상태

이번 배치(155–159)는 **전부 로컬 커밋 완료 · `main`/원격 무변경 · 워킹트리 clean · 로컬 게이트 전부 green**.
새로운 라이브 배포·스토어 제출·검색 색인 작업은 **하지 않았고**, 그런 것은 아래 §3의 운영자 게이트로 남는다.

---

## 1. 이번 배치가 로컬로 끝낸 것 (agent 완료 · 다시 할 필요 없음)

모두 로컬 UI/카피/문서/툴링 한정. 점수식·`metricsVersion`·데이터 수집·auth·cron·원격/호스팅/스토어/계정 **무변경**.

| Task | 슬라이스 | 핵심 변경 | 커밋 |
|---|---|---|---|
| 155 (A) | /status 근거 코크핏 | 원본 소스 직접 확인 섹션(`#verify`, KRX·Naver·DART 외부 링크, 비자문 톤) | `325f06f` |
| 156 (B) | 관심종목 온보딩/리텐션 | 담기 토스트에 추적 가치 안내(익명 첫 방문 1줄, copy-only) | `5e11a7c` |
| 157 (C) | 검색·후보 발견 동선 | 자동완성 → `/stocks?q=` 전체 목록 핸드오프(종목 결과 있을 때만) | `0de890e` |
| 158 (D) | 접근성/키보드 | 종목 상세 탭 ARIA·roving tabindex / 검색 Esc 버그 / 토글 `aria-pressed` / 더보기 Esc | `8d0e57a` |
| 159 (E) | 로컬 검증 반복성 | 단일 진입점 `npm run verify:local`(5 게이트 집계) + 느림/취약 라우트 문서화 | `87c5773` |

> 각 task PROGRESS/handoff 항목의 개별 "다음에 바로 실행할 작업" 줄은 **이 클로징의 §2·§4 큐로 대체**된다(개별 줄은 역사 기록으로만 남김).

**배치 검증(2026-07-12 재실행, 전부 green)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py` 138종목·오류0·금칙0·Metrics 2.4 · `git diff --check` clean · `npm run app:check` pass(외부 게이트 WAIT 1 = assetlinks, 운영자 전용) · `git status` clean.

---

## 2. 다음 릴리스 체크리스트 (agent가 로컬에서 준비 가능 — 라이브 출시 아님)

라이브 배포를 **약속·수행하지 않는다.** 아래는 운영자가 릴리스를 승인할 때 **로컬에서 재현·재확인**하는 순서다.

1. **로컬 광역 게이트 재실행** — `npx tsc --noEmit` · `verify_metrics.py` · `git diff --check` · `npm run build` · `npm run app:check`.
2. **라우트 단일 게이트** — 로컬 prod 기동 후 `npm run verify:local`(= `smoke:check --all` 24 + `verify:routes` 9 + `verify:stocks-seo` 12 + `verify:login-preflight` 5, perf는 advisory). 판독 규칙·느림 라우트: `docs/ornscore-route-smoke-checklist.md`.
3. **불변식 스팟체크(SSR HTML)** — 138종목 노출 · 한국어 전용(LanguageSwitcher 0) · 종목 상세 AI 분석 비노출 · 비자문 고지 유지.
4. **문서 드리프트** — `npm run app:check`가 스토어 팩/패키징 문서 날짜·문구 정합을 잡음. 스토어 팩 편집 시 날짜 가드와 함께 갱신.

> 위 1–4는 **agent가 로컬에서 수행 가능**. 실제 `main` push·Vercel 반영·공개 도메인 대상 재검증은 §3(운영자 게이트).

---

## 3. 운영자만 할 수 있는 것 (agent가 자동 실행하지 않음)

**정본 분리표는 `docs/ornscore-owner-final-checklist.md` §B.** 여기서는 이번 배치 시점의 미해결 게이트만 요약한다.

- **공개 라이브 릴리스**: `main` push + Vercel 자동배포 + 공개 도메인(`https://ornscore.com`) 대상 `verify:local`/`verify:routes`/`smoke:check --all` 재확인 — **운영자 승인·실행**. (직전 승인 릴리스 기록: `5f9b665` codex, 2026-07-11.)
- **Android assetlinks**: `public/.well-known/assetlinks.json` 생성 — 실제 package id(`com.ornscore.app` 잠금) + **서명 SHA-256 지문** 필요. 예시(`docs/templates/assetlinks.example.json`)는 자리표시자라 **서빙 안 함**. 절차: `docs/ornscore-android-assetlinks-owner-kit.md`.
- **실기기 QA**: 설치성·아이콘·standalone 내비·**OAuth 복귀(최대 리스크)**·watchlist 복귀·알림 골격 — Playwright 미구성이라 **실기기 육안**. 절차: `docs/app-roadmap.md` §5-1, 항목표: owner-final-checklist §B-1.
- **실 브라우저 픽셀 게이트**: 데스크톱/390×844 오버플로·대비(muted 텍스트)·탭 ←/→ 체감 — 운영자 육안(in-harness 브라우저 없음).
- **스토어 콘솔 제출**: Play Console 등록·스크린샷 캡처 — `docs/app-store-submission-pack.md` 콘솔 입력값에 맞춰 최종 검토.
- **Search Console 재색인**: 공개 배포 후 운영자 실행.
- **결제·법무 확정**: 가격·구독·환불·약관 — `docs/legal-ai-commercial-readiness.md`, owner-final-checklist §B-3.

---

## 4. 다음 자동화 큐 (agent가 로컬로 착수 가능한 것 우선)

정본 추적: `docs/ornscore-spec-coverage.md` §A(③ 근시일 큐). 손이 작고 사용자 체감·차별점이 큰 것부터.

1. **perf:check 카테고리 B `total` 예산 WARN 명시화** — 현재는 문서로만 안내(task 159 잔여). `/today`·`/stock/*`·`/watchlist`의 본문 다운로드 ~4.5s 초과를 회귀 신호로 표면화.
2. **자동완성 종목 행 종합점수 배지** — 스캔성 향상(task 157 후보). `searchStocks` 페이로드에 표시용 `score` 추가 → 헤더/모바일 호출부 배선.
3. **탐색 필터 감각화 마감 → 데이터 신뢰 배지 마감 → 산식 빌드 게이트 → 오류 신고 진입점 → 스켈레톤 → 압축/바텀시트** — spec-coverage §A 순서.
4. **"한 단계 큰 방향" 베팅** — `docs/ornscore-next-product-bets-2026-07-03.md`(각 베팅의 "지금 가능한 첫 로컬 작업" 포함). 근시일 큐를 대체하지 않는 참고 레이어.

---

## 5. 이 클로징이 하지 않은 것 (명시)

- 원격 push·호스팅 변경·라이브 릴리스 **없음**.
- 스토어 콘솔·Search Console·계정 작업 **없음**.
- 점수식·`metricsVersion`·데이터 수집·auth/cron **무변경**.
- 이번 슬라이스 편집: 이 문서(신규) + `PROGRESS.md` + `docs/AI_HANDOFF.md` 클로징 항목만(docs-only).
